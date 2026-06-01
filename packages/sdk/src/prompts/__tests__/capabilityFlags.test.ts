/**
 * Exhaustive coverage for deriveCapabilityFlags — every flag in
 * ContextCapabilityFlags gets at least one positive and one negative
 * derivation case, plus discovery/detection tests for the trigger
 * permutations that drive trigger-gated flags.
 */

import { describe, it, expect } from 'vitest';
import {
  detectExecutionContext,
  deriveCapabilityFlags,
  type ContextCapabilityFlags,
  type ExecutionContext,
  type TriggerKind,
} from '../contextDetect';

function flagsFor(
  env: NodeJS.ProcessEnv,
  triggerOverride?: TriggerKind,
): ContextCapabilityFlags {
  return deriveCapabilityFlags(detectExecutionContext({ env, triggerOverride }));
}

// All gha-gated flags share the same derivation (inGha = true). Assert them
// all positive in GHA and all negative in local / generic-ci so any future
// divergence of individual flags surfaces as a test break.
const GHA_GATED: (keyof ContextCapabilityFlags)[] = [
  'hasPrPolicies',
  'hasBranchPolicies',
  'hasIssueLinking',
  'hasDraftPrProhibition',
  'hasLabelTaxonomy',
  'hasSingleChannelRule',
  'hasSourceQuoteCap',
  'hasHandoffConventions',
];

describe('deriveCapabilityFlags — GHA-gated flags', () => {
  it.each(GHA_GATED)('%s is TRUE under github-actions', (flag) => {
    const flags = flagsFor({ GITHUB_ACTIONS: 'true' });
    expect(flags[flag]).toBe(true);
  });

  it.each(GHA_GATED)('%s is FALSE under local CI', (flag) => {
    const flags = flagsFor({});
    expect(flags[flag]).toBe(false);
  });

  it.each(GHA_GATED)('%s is FALSE under generic CI (non-GHA)', (flag) => {
    const flags = flagsFor({ CI: 'true' });
    expect(flags[flag]).toBe(false);
  });
});

describe('deriveCapabilityFlags — CI-gated flags', () => {
  it('hasIdempotencyAndAbort TRUE in GHA', () => {
    expect(flagsFor({ GITHUB_ACTIONS: 'true' }).hasIdempotencyAndAbort).toBe(true);
  });
  it('hasIdempotencyAndAbort TRUE in generic CI', () => {
    expect(flagsFor({ CI: 'true' }).hasIdempotencyAndAbort).toBe(true);
  });
  it('hasIdempotencyAndAbort FALSE locally', () => {
    expect(flagsFor({}).hasIdempotencyAndAbort).toBe(false);
  });

  it('hasIssueOnlyNoDirectCommits TRUE in CI, FALSE locally', () => {
    expect(flagsFor({ CI: 'true' }).hasIssueOnlyNoDirectCommits).toBe(true);
    expect(flagsFor({}).hasIssueOnlyNoDirectCommits).toBe(false);
  });
});

describe('deriveCapabilityFlags — trigger-gated flags', () => {
  it('hasPrCommentFormat TRUE on pr-comment-mention', () => {
    const flags = flagsFor(
      { GITHUB_ACTIONS: 'true' },
      'pr-comment-mention',
    );
    expect(flags.hasPrCommentFormat).toBe(true);
  });

  it('hasPrCommentFormat TRUE on issue-comment-mention', () => {
    const flags = flagsFor(
      { GITHUB_ACTIONS: 'true' },
      'issue-comment-mention',
    );
    expect(flags.hasPrCommentFormat).toBe(true);
  });

  it('hasPrCommentFormat FALSE on plain pr-opened', () => {
    const flags = flagsFor({ GITHUB_ACTIONS: 'true' }, 'pr-opened');
    expect(flags.hasPrCommentFormat).toBe(false);
  });

  it('hasSixDimensionReview ONLY on pr-comment-mention', () => {
    expect(
      flagsFor({ GITHUB_ACTIONS: 'true' }, 'pr-comment-mention')
        .hasSixDimensionReview,
    ).toBe(true);
    expect(
      flagsFor({ GITHUB_ACTIONS: 'true' }, 'issue-comment-mention')
        .hasSixDimensionReview,
    ).toBe(false);
    expect(
      flagsFor({ GITHUB_ACTIONS: 'true' }, 'pr-opened').hasSixDimensionReview,
    ).toBe(false);
  });

  it('hasScheduledReportFormat ONLY on scheduled', () => {
    expect(
      flagsFor({ GITHUB_ACTIONS: 'true' }, 'scheduled')
        .hasScheduledReportFormat,
    ).toBe(true);
    expect(
      flagsFor({ GITHUB_ACTIONS: 'true' }, 'push-to-main')
        .hasScheduledReportFormat,
    ).toBe(false);
  });
});

describe('deriveCapabilityFlags — local-dev gating', () => {
  it('hasLocalDevRelax TRUE locally, FALSE in CI of either kind', () => {
    expect(flagsFor({}).hasLocalDevRelax).toBe(true);
    expect(flagsFor({ CI: 'true' }).hasLocalDevRelax).toBe(false);
    expect(flagsFor({ GITHUB_ACTIONS: 'true' }).hasLocalDevRelax).toBe(false);
  });
});

describe('detectExecutionContext — branch / actor discovery', () => {
  it('strips refs/heads/ prefix and detects main', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_REF: 'refs/heads/main' },
    });
    expect(ctx.branch.isMain).toBe(true);
  });

  it('detects master and develop as main-equivalent', () => {
    for (const name of ['master', 'develop']) {
      const ctx = detectExecutionContext({
        env: { GITHUB_ACTIONS: 'true', GITHUB_REF: `refs/heads/${name}` },
      });
      expect(ctx.branch.isMain).toBe(true);
    }
  });

  it('feature branches are NOT main', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_REF: 'refs/heads/feature/foo',
      },
    });
    expect(ctx.branch.isMain).toBe(false);
  });

  it('headRef takes precedence over ref for PR branch detection', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_REF: 'refs/pull/42/merge',
        GITHUB_HEAD_REF: 'feature/x',
      },
    });
    expect(ctx.branch.headRef).toBe('feature/x');
    expect(ctx.branch.isMain).toBe(false);
  });

  it('detects -bot suffix actor as bot', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_ACTOR: 'renovate-bot' },
    });
    expect(ctx.actor.isBot).toBe(true);
  });

  it('non-bot user has isBot=false', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_ACTOR: 'alice' },
    });
    expect(ctx.actor.isBot).toBe(false);
  });

  it('missing GITHUB_REPOSITORY yields null owner/name', () => {
    const ctx = detectExecutionContext({ env: { GITHUB_ACTIONS: 'true' } });
    expect(ctx.repo.owner).toBeNull();
    expect(ctx.repo.name).toBeNull();
  });
});

describe('detectExecutionContext — trigger discovery edge cases', () => {
  it('pull_request with no action defaults to pr-opened', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request' },
    });
    expect(ctx.trigger).toBe('pr-opened');
  });

  it('pull_request ready_for_review → pr-opened', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_EVENT_ACTION: 'ready_for_review',
      },
    });
    expect(ctx.trigger).toBe('pr-opened');
  });

  it('pull_request_target → pr-opened', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request_target',
      },
    });
    expect(ctx.trigger).toBe('pr-opened');
  });

  it('push to feature branch → push-to-branch', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'push',
        GITHUB_REF: 'refs/heads/feature/foo',
      },
    });
    expect(ctx.trigger).toBe('push-to-branch');
  });

  it('workflow_run with success → workflow-dispatch (not build-failure)', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'workflow_run',
        GITHUB_EVENT_CONCLUSION: 'success',
      },
    });
    expect(ctx.trigger).toBe('workflow-dispatch');
  });

  it('workflow_dispatch event → workflow-dispatch', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'workflow_dispatch',
      },
    });
    expect(ctx.trigger).toBe('workflow-dispatch');
  });

  it('unknown event name in GHA → manual', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'gollum',
      },
    });
    expect(ctx.trigger).toBe('manual');
  });

  it('triggerOverride replaces detected trigger', () => {
    const ctx: ExecutionContext = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push' },
      triggerOverride: 'merge-conflict',
    });
    expect(ctx.trigger).toBe('merge-conflict');
  });
});

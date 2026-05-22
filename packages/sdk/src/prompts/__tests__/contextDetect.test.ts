import { describe, it, expect } from 'vitest';
import {
  detectExecutionContext,
  deriveCapabilityFlags,
} from '../contextDetect';

describe('detectExecutionContext', () => {
  it('detects local when no CI env vars set', () => {
    const ctx = detectExecutionContext({ env: {} });
    expect(ctx.ci).toBe('local');
    expect(ctx.trigger).toBe('manual');
  });

  it('detects github-actions on GITHUB_ACTIONS=true', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main' },
    });
    expect(ctx.ci).toBe('github-actions');
    expect(ctx.trigger).toBe('push-to-main');
    expect(ctx.branch.isMain).toBe(true);
  });

  it('detects generic-ci when CI=true but not GHA', () => {
    const ctx = detectExecutionContext({ env: { CI: 'true' } });
    expect(ctx.ci).toBe('generic-ci');
  });

  it('maps pull_request opened → pr-opened', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_EVENT_ACTION: 'opened',
      },
    });
    expect(ctx.trigger).toBe('pr-opened');
  });

  it('maps pull_request synchronize → pr-synchronize', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_EVENT_ACTION: 'synchronize',
      },
    });
    expect(ctx.trigger).toBe('pr-synchronize');
  });

  it('maps issue_comment on PR → pr-comment-mention', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'issue_comment',
        GITHUB_EVENT_ISSUE_PULL_REQUEST: 'true',
      },
    });
    expect(ctx.trigger).toBe('pr-comment-mention');
  });

  it('maps issue_comment on issue → issue-comment-mention', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'issue_comment',
      },
    });
    expect(ctx.trigger).toBe('issue-comment-mention');
  });

  it('maps workflow_run with failure → build-failure', () => {
    const ctx = detectExecutionContext({
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'workflow_run',
        GITHUB_EVENT_CONCLUSION: 'failure',
      },
    });
    expect(ctx.trigger).toBe('build-failure');
  });

  it('maps schedule → scheduled', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'schedule' },
    });
    expect(ctx.trigger).toBe('scheduled');
  });

  it('detects bot actor', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_ACTOR: 'dependabot[bot]' },
    });
    expect(ctx.actor.isBot).toBe(true);
  });

  it('parses owner/repo from GITHUB_REPOSITORY', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'a/b' },
    });
    expect(ctx.repo.owner).toBe('a');
    expect(ctx.repo.name).toBe('b');
  });
});

describe('deriveCapabilityFlags', () => {
  it('enables PR/branch/label flags in GHA', () => {
    const ctx = detectExecutionContext({
      env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push' },
    });
    const flags = deriveCapabilityFlags(ctx);
    expect(flags.hasPrPolicies).toBe(true);
    expect(flags.hasBranchPolicies).toBe(true);
    expect(flags.hasIssueLinking).toBe(true);
    expect(flags.hasLabelTaxonomy).toBe(true);
    expect(flags.hasIdempotencyAndAbort).toBe(true);
  });

  it('enables localDevRelax when local', () => {
    const flags = deriveCapabilityFlags(detectExecutionContext({ env: {} }));
    expect(flags.hasLocalDevRelax).toBe(true);
    expect(flags.hasPrPolicies).toBe(false);
  });

it('enables prCommentFormat and sixDimensionReview on pr-comment-mention', () => {
    const flags = deriveCapabilityFlags(
      detectExecutionContext({
        env: {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'issue_comment',
          GITHUB_EVENT_ISSUE_PULL_REQUEST: 'true',
        },
      }),
    );
    expect(flags.hasPrCommentFormat).toBe(true);
    expect(flags.hasSixDimensionReview).toBe(true);
  });

  it('enables scheduledReportFormat on schedule trigger', () => {
    const flags = deriveCapabilityFlags(
      detectExecutionContext({
        env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'schedule' },
      }),
    );
    expect(flags.hasScheduledReportFormat).toBe(true);
  });

  it('enables idempotencyAndAbort in generic CI too', () => {
    const flags = deriveCapabilityFlags(
      detectExecutionContext({ env: { CI: 'true' } }),
    );
    expect(flags.hasIdempotencyAndAbort).toBe(true);
    expect(flags.hasPrPolicies).toBe(false);
  });
});

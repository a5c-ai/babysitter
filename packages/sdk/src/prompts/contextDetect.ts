/**
 * Execution-context autodetection for prompt gating.
 *
 * Detects whether the CLI is running inside GitHub Actions, a generic CI
 * runner, or a local development environment, plus the inferred trigger
 * (pr-opened, push-to-main, build-failure, merge-conflict, scheduled, etc.)
 * and branch/actor metadata. Prompt parts can key off these fields to
 * include or omit guidance that only makes sense in specific contexts.
 *
 * @module prompts/contextDetect
 */

export type CiKind = 'github-actions' | 'generic-ci' | 'local';

export type TriggerKind =
  | 'pr-opened'
  | 'pr-synchronize'
  | 'pr-comment-mention'
  | 'issue-comment-mention'
  | 'push-to-main'
  | 'push-to-branch'
  | 'build-failure'
  | 'merge-conflict'
  | 'scheduled'
  | 'workflow-dispatch'
  | 'manual';

export interface ExecutionContext {
  ci: CiKind;
  trigger: TriggerKind;
  branch: {
    ref: string | null;
    headRef: string | null;
    baseRef: string | null;
    isMain: boolean;
  };
  actor: {
    login: string | null;
    isBot: boolean;
  };
  mergeableState: 'clean' | 'dirty' | 'unknown';
  eventName: string | null;
  repo: { owner: string | null; name: string | null };
}

export interface DetectOptions {
  /** Override env for testing. Defaults to process.env. */
  env?: NodeJS.ProcessEnv;
  /** Override trigger detection — primarily for tests. */
  triggerOverride?: TriggerKind;
}

const MAIN_BRANCH_NAMES = new Set(['main', 'master', 'develop']);

export function detectExecutionContext(options: DetectOptions = {}): ExecutionContext {
  const env = options.env ?? (typeof process !== 'undefined' ? process.env : {});

  const ci = detectCi(env);
  const eventName = env.GITHUB_EVENT_NAME ?? null;
  const ref = env.GITHUB_REF ?? null;
  const headRef = env.GITHUB_HEAD_REF ?? null;
  const baseRef = env.GITHUB_BASE_REF ?? null;
  const actorLogin = env.GITHUB_ACTOR ?? null;
  const isBot = Boolean(actorLogin && /\[bot\]$|-bot$/i.test(actorLogin));
  const [owner, name] = (env.GITHUB_REPOSITORY ?? '').split('/', 2);

  const isMain = isMainBranch(ref, headRef);

  const trigger =
    options.triggerOverride ?? detectTrigger(ci, eventName, env);

  return {
    ci,
    trigger,
    branch: {
      ref,
      headRef,
      baseRef,
      isMain,
    },
    actor: { login: actorLogin, isBot },
    mergeableState: 'unknown',
    eventName,
    repo: { owner: owner || null, name: name || null },
  };
}

function detectCi(env: NodeJS.ProcessEnv): CiKind {
  if (env.GITHUB_ACTIONS === 'true') return 'github-actions';
  if (env.CI === 'true' || env.CI === '1') return 'generic-ci';
  return 'local';
}

function isMainBranch(ref: string | null, headRef: string | null): boolean {
  const branchName = stripRefPrefix(headRef || ref);
  if (!branchName) return false;
  return MAIN_BRANCH_NAMES.has(branchName);
}

function stripRefPrefix(ref: string | null): string | null {
  if (!ref) return null;
  return ref.replace(/^refs\/heads\//, '').replace(/^refs\/pull\/.*\/merge$/, '');
}

function detectTrigger(
  ci: CiKind,
  eventName: string | null,
  env: NodeJS.ProcessEnv,
): TriggerKind {
  if (ci === 'local') return 'manual';

  switch (eventName) {
    case 'pull_request': {
      const action = env.GITHUB_EVENT_ACTION ?? '';
      if (action === 'opened' || action === 'reopened' || action === 'ready_for_review') {
        return 'pr-opened';
      }
      if (action === 'synchronize') return 'pr-synchronize';
      return 'pr-opened';
    }
    case 'pull_request_target':
      return 'pr-opened';
    case 'issue_comment': {
      const isPrContext = env.GITHUB_EVENT_ISSUE_PULL_REQUEST === 'true';
      return isPrContext ? 'pr-comment-mention' : 'issue-comment-mention';
    }
    case 'push': {
      const ref = env.GITHUB_REF ?? '';
      const branch = stripRefPrefix(ref);
      if (branch && MAIN_BRANCH_NAMES.has(branch)) return 'push-to-main';
      return 'push-to-branch';
    }
    case 'workflow_run': {
      const conclusion = env.GITHUB_EVENT_CONCLUSION ?? '';
      if (conclusion === 'failure') return 'build-failure';
      return 'workflow-dispatch';
    }
    case 'workflow_dispatch':
      return 'workflow-dispatch';
    case 'schedule':
      return 'scheduled';
    default:
      return 'manual';
  }
}

/**
 * Capability flag map derived from an ExecutionContext.
 *
 * Each field corresponds to a PromptContext `hasXxx` flag. Used by prompt
 * composers to auto-enable gated parts based on execution context.
 */
export interface ContextCapabilityFlags {
  hasPrPolicies: boolean;
  hasBranchPolicies: boolean;
  hasIssueLinking: boolean;
  hasDraftPrProhibition: boolean;
  hasLabelTaxonomy: boolean;
  hasSingleChannelRule: boolean;
  hasSourceQuoteCap: boolean;
  hasHandoffConventions: boolean;
  hasIdempotencyAndAbort: boolean;
  hasIssueOnlyNoDirectCommits: boolean;
  hasPrCommentFormat: boolean;
  hasSixDimensionReview: boolean;
  hasScheduledReportFormat: boolean;
  hasLocalDevRelax: boolean;
}

export function deriveCapabilityFlags(ctx: ExecutionContext): ContextCapabilityFlags {
  const inGha = ctx.ci === 'github-actions';
  const inCi = inGha || ctx.ci === 'generic-ci';
  const isLocal = ctx.ci === 'local';

  return {
    hasPrPolicies: inGha,
    hasBranchPolicies: inGha,
    hasIssueLinking: inGha,
    hasDraftPrProhibition: inGha,
    hasLabelTaxonomy: inGha,
    hasSingleChannelRule: inGha,
    hasSourceQuoteCap: inGha,
    hasHandoffConventions: inGha,
    hasIdempotencyAndAbort: inCi,
    hasIssueOnlyNoDirectCommits: inCi,
    hasPrCommentFormat:
      ctx.trigger === 'pr-comment-mention' || ctx.trigger === 'issue-comment-mention',
    hasSixDimensionReview: ctx.trigger === 'pr-comment-mention',
    hasScheduledReportFormat: ctx.trigger === 'scheduled',
    hasLocalDevRelax: isLocal,
  };
}

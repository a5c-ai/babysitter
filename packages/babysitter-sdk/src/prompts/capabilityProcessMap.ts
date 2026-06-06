/**
 * Mapping from ContextCapabilityFlags → library process paths.
 *
 * When a capability flag is true, the babysit skill should prefer dispatching
 * the listed process(es) for work in that context. This is the consumer side
 * of the capability-emission added in `instructions.ts` — it closes the loop
 * between "detect context → emit flags" and "use flags → select a process".
 *
 * Paths are relative to the active process-library root. Multiple processes
 * may be listed per flag in priority order (first match wins unless the
 * caller wants to dispatch them all).
 *
 * @module prompts/capabilityProcessMap
 */

import type { ContextCapabilityFlags } from './contextDetect';

export type CapabilityProcessMap = {
  [K in keyof ContextCapabilityFlags]: string[];
};

export const CAPABILITY_PROCESS_MAP: CapabilityProcessMap = {
  hasPrPolicies: [
    'specializations/collaboration/github/pr-lifecycle-router.js',
    'specializations/collaboration/github/pr-policies.js',
  ],
  hasBranchPolicies: [
    'specializations/collaboration/github/branch-policies.js',
  ],
  hasIssueLinking: [
    'specializations/collaboration/github/issue-linking.js',
  ],
  hasDraftPrProhibition: [
    'specializations/collaboration/github/draft-pr-policy.js',
  ],
  hasLabelTaxonomy: [
    'specializations/collaboration/github/label-taxonomy.js',
  ],
  hasSingleChannelRule: [
    'processes/shared/communication/single-channel-communication.js',
  ],
  hasSourceQuoteCap: [
    'processes/shared/communication/source-quote-discipline.js',
  ],
  hasHandoffConventions: [
    'processes/shared/communication/handoff-conventions.js',
  ],
  hasIdempotencyAndAbort: [
    'processes/shared/ci/idempotency-and-safe-abort.js',
  ],
  hasIssueOnlyNoDirectCommits: [
    'specializations/collaboration/github/issue-only-no-direct-commits.js',
  ],
  hasPrCommentFormat: [
    'specializations/collaboration/github/pr-lifecycle-comment-response.js',
    'specializations/collaboration/github/pr-comment-response.js',
  ],
  hasSixDimensionReview: [
    'specializations/collaboration/code-review/six-dimension-review.js',
  ],
  hasScheduledReportFormat: [
    'processes/shared/reporting/scheduled-report.js',
    'specializations/sourcing/news-intelligence-pipeline.js',
  ],
  hasLocalDevRelax: [
    'processes/shared/local-dev-workflow.js',
  ],
};

/**
 * Return all library process paths whose capability flag is active.
 *
 * Example:
 *   const paths = processPathsForCapabilities(flags);
 *   // → ["specializations/collaboration/github/pr-lifecycle-router.js", ...]
 */
export function processPathsForCapabilities(
  flags: Partial<ContextCapabilityFlags>,
): string[] {
  const out = new Set<string>();
  for (const [flag, active] of Object.entries(flags)) {
    if (active !== true) continue;
    const paths = CAPABILITY_PROCESS_MAP[flag as keyof ContextCapabilityFlags];
    if (paths) for (const p of paths) out.add(p);
  }
  return [...out];
}

/**
 * Render a markdown block suitable for inclusion in an instructions prompt:
 * lists each active capability and the library process(es) that handle it.
 */
export function renderCapabilityProcessGuide(
  flags: Partial<ContextCapabilityFlags>,
): string {
  const active = Object.entries(flags).filter(([, v]) => v === true);
  if (active.length === 0) return '';
  const lines = ['## Library Processes for Active Capabilities', ''];
  for (const [flag] of active) {
    const paths = CAPABILITY_PROCESS_MAP[flag as keyof ContextCapabilityFlags];
    if (!paths || paths.length === 0) continue;
    lines.push(`- \`${flag}\` → ${paths.map((p) => `\`${p}\``).join(', ')}`);
  }
  lines.push('');
  lines.push(
    'When dispatching work for this context, prefer these processes over ad-hoc instructions.',
  );
  lines.push('');
  return lines.join('\n');
}

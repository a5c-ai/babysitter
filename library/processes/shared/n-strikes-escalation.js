/**
 * @module library/processes/shared/n-strikes-escalation
 * @description Run a check task. On failure, run a fixer task and re-check.
 *   After N failures, open a breakpoint with proper rejection branching: a
 *   rejection with feedback loops back as an additional check "issue" rather
 *   than silently being treated as approval.
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 *
 *   Generalized from the spec/quality retry blocks in
 *   joe-habu/superbabysitter/process/subagent-tdd-loop.js (lines 320-359 and
 *   365-404), minus the "rejection == approval" bug that the source version
 *   has at lines 345 and 390.
 *
 * Usage:
 *
 * ```js
 * import { nStrikesEscalation } from '@a5c-ai/babysitter-library/processes/shared';
 *
 * const result = await nStrikesEscalation({
 *   ctx,
 *   maxAttempts: 3,
 *   breakpointId: 'tdd.spec-escalation',
 *   breakpointTitle: 'Spec Review Escalation',
 *   runCheck: async (attemptNumber, priorState) => {
 *     const review = await ctx.task(specReviewerTask, { ... });
 *     return { passed: review.passed, issues: review.issues, state: review };
 *   },
 *   runFix: async (attemptNumber, priorState, issues) => {
 *     return ctx.task(fixerTask, { priorImplementation: priorState, issues, ... });
 *   },
 *   initialState: implResult,
 * });
 * // result = { passed, attempts, state, outcome: 'passed'|'escalation-approved'|'escalation-rejected', feedback? }
 * ```
 *
 * Returns an explicit `outcome` so downstream consumers can distinguish
 * "passed cleanly" from "human override". Never silently flips rejection
 * into approval.
 */

/**
 * @param {object} args
 * @param {object} args.ctx - babysitter ProcessContext
 * @param {number} [args.maxAttempts=3] - how many check/fix cycles before escalating
 * @param {string} args.breakpointId - canonical breakpointId for auto-approval rules
 * @param {string} args.breakpointTitle - human-readable title for the escalation breakpoint
 * @param {(attemptNumber: number, priorState: unknown) => Promise<{passed: boolean, issues: string[], state: unknown}>} args.runCheck
 * @param {(attemptNumber: number, priorState: unknown, issues: string[]) => Promise<unknown>} args.runFix
 * @param {unknown} args.initialState - the state fed to the first check (e.g. an implementation result)
 * @param {(context: object) => string} [args.composeEscalationQuestion] - override the default breakpoint question builder
 * @returns {Promise<{passed: boolean, attempts: number, state: unknown, outcome: 'passed'|'escalation-approved'|'escalation-rejected', feedback?: string, issues?: string[]}>}
 */
export async function nStrikesEscalation(args) {
  const {
    ctx,
    maxAttempts = 3,
    breakpointId,
    breakpointTitle,
    runCheck,
    runFix,
    initialState,
    composeEscalationQuestion = defaultEscalationQuestion,
  } = args;

  let state = initialState;
  let lastIssues = [];
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const check = await runCheck(attempts, state);
    if (check.passed) {
      return { passed: true, attempts, state: check.state ?? state, outcome: 'passed' };
    }
    lastIssues = check.issues || [];
    if (attempts >= maxAttempts) break;
    state = await runFix(attempts, state, lastIssues);
  }

  const bp = await ctx.breakpoint({
    breakpointId,
    title: breakpointTitle,
    question: composeEscalationQuestion({ attempts, issues: lastIssues, title: breakpointTitle }),
  });

  if (bp && bp.approved) {
    return { passed: true, attempts, state, outcome: 'escalation-approved', issues: lastIssues };
  }

  return {
    passed: false,
    attempts,
    state,
    outcome: 'escalation-rejected',
    issues: lastIssues,
    feedback: (bp && bp.feedback) || undefined,
  };
}

function defaultEscalationQuestion({ attempts, issues, title }) {
  return [
    `${title}: check failed ${attempts} times in a row.`,
    '',
    'Latest issues:',
    ...(issues && issues.length > 0 ? issues.map((i) => `  - ${i}`) : ['  - (none reported)']),
    '',
    'Approve to accept the current state and continue.',
    'Reject (with feedback) to feed the feedback back as an issue and retry.',
  ].join('\n');
}

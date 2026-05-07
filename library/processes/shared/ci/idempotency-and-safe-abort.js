/**
 * @process processes/shared/ci/idempotency-and-safe-abort
 * @description Make CI-side effects idempotent; abort early on precondition failure; never retry destructive ops blindly.
 * @inputs { plannedActions: Array<{ kind, description, target }>, currentState?: object }
 * @outputs { success: boolean, actionsToExecute: Array<object>, abortReason?: string }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const inspectStateTask = defineTask(
  'idempotency.inspect-state',
  async ({ plannedActions, currentState }, ctx) => {
    return ctx.agent({
      title: 'Inspect current state before mutations',
      prompt: [
        'Before executing planned side-effecting actions, inspect current state and determine whether each action is still needed.',
        `Planned actions: ${JSON.stringify(plannedActions, null, 2)}`,
        `Known state: ${JSON.stringify(currentState ?? {}, null, 2)}`,
        'Rules:',
        '- If an expected artifact (branch, PR, commit, file) already exists, mark the action as "already-applied".',
        '- If a precondition fails (missing credentials, wrong branch, detached HEAD), mark "abort".',
        '- Never retry a destructive operation (force push, branch delete, tag move) without a fresh precondition check.',
        'Return JSON: { actions: Array<{ ...planned, decision: "execute"|"already-applied"|"abort", reason }>, overallAbortReason?: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Inspect state', labels: ['ci', 'idempotency'] },
);

export async function process(inputs, ctx) {
  const { plannedActions = [], currentState = {} } = inputs;
  const result = await ctx.task(inspectStateTask, { plannedActions, currentState });
  const actions = result.actions ?? [];
  const abortReason = result.overallAbortReason;
  return {
    success: !abortReason,
    actionsToExecute: actions.filter((a) => a.decision === 'execute'),
    skipped: actions.filter((a) => a.decision === 'already-applied'),
    aborted: actions.filter((a) => a.decision === 'abort'),
    abortReason,
  };
}

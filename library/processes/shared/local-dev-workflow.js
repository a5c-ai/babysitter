/**
 * @process processes/shared/local-dev-workflow
 * @description Local-dev relaxations — experimental commits OK while iterating, but tighten up before push.
 * @inputs { phase: "iterating"|"pre-push", pendingCommits?: Array<object> }
 * @outputs { success: boolean, relaxationsActive: boolean, tightenUpActions?: Array<string> }
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const prePushTask = defineTask(
  'local-dev.pre-push-tighten',
  async ({ pendingCommits }, ctx) => {
    return ctx.agent({
      title: 'Tighten up before pushing',
      prompt: [
        'Before pushing, apply the tighten-up checklist:',
        '- Run lint and tests.',
        '- Squash fixup commits.',
        '- Rewrite any commit message that would look sloppy in the PR\'s history.',
        '- Verify no secrets, ad-hoc debug logs, or sandbox files are staged.',
        `Pending commits: ${JSON.stringify(pendingCommits ?? [], null, 2)}`,
        'Return JSON: { readyToPush: boolean, actions: string[], blockers?: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Pre-push tighten', labels: ['local-dev'] },
);

export async function process(inputs, ctx) {
  const { phase = 'iterating', pendingCommits = [] } = inputs;
  if (phase === 'iterating') {
    return {
      success: true,
      relaxationsActive: true,
      note: 'Experimental commits, scratch scripts, and ad-hoc debug logging are acceptable while iterating. Still: no secrets, no pushes to shared branches without review, no disabled tests.',
    };
  }
  const tighten = await ctx.task(prePushTask, { pendingCommits });
  return {
    success: tighten.readyToPush === true,
    relaxationsActive: false,
    tightenUpActions: tighten.actions ?? [],
    blockers: tighten.blockers,
  };
}

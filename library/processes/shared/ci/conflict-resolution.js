/**
 * @process processes/shared/ci/conflict-resolution
 * @description Resolve merge conflicts correctly: read both sides, prefer rebase, regenerate generated files, verify with full check.
 * @inputs { branch: string, baseBranch: string, conflictFiles: Array<string> }
 * @outputs { success: boolean, resolutions: Array<object>, note?: string }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeConflictTask = defineTask(
  'conflict.analyze',
  async ({ branch, baseBranch, conflictFiles }, ctx) => {
    return ctx.agent({
      title: 'Analyze merge conflicts',
      prompt: [
        `Analyze conflicts when merging ${branch} into ${baseBranch}.`,
        `Conflict files: ${conflictFiles.join(', ')}`,
        'For each file, read both the incoming change and the base change before deciding.',
        'Identify generated files (lock files, build artifacts, generated types) so they can be regenerated from source rather than hand-edited.',
        'Return JSON: { analyses: Array<{ file, kind: "generated"|"manual", incomingIntent, baseIntent, resolutionStrategy }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Analyze conflicts', labels: ['ci', 'merge'] },
);

const resolveTask = defineTask(
  'conflict.resolve',
  async ({ analyses, branch, baseBranch }, ctx) => {
    return ctx.agent({
      title: 'Resolve merge conflicts',
      prompt: [
        `Resolve the analyzed conflicts.`,
        'Prefer `git rebase` onto the updated base over `git merge` for feature branches.',
        'Regenerate generated files rather than hand-editing.',
        'After resolving, run the full local verification (typecheck, lint, tests).',
        `Analyses: ${JSON.stringify(analyses, null, 2)}`,
        `Branch: ${branch} -> ${baseBranch}`,
        'Return JSON: { resolutions: Array<{ file, action, summary }>, verification: { typecheck, lint, tests }, note?: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Resolve conflicts', labels: ['ci', 'merge'] },
);

export async function process(inputs, ctx) {
  const { branch, baseBranch, conflictFiles = [] } = inputs;
  if (conflictFiles.length === 0) {
    return { success: true, resolutions: [], note: 'no conflicts' };
  }
  const analysis = await ctx.task(analyzeConflictTask, { branch, baseBranch, conflictFiles });
  const resolved = await ctx.task(resolveTask, {
    analyses: analysis.analyses ?? [],
    branch,
    baseBranch,
  });
  const verification = resolved.verification ?? {};
  const allGreen = verification.typecheck !== false && verification.lint !== false && verification.tests !== false;
  return {
    success: allGreen,
    resolutions: resolved.resolutions ?? [],
    note: resolved.note,
  };
}

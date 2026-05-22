/**
 * @process specializations/collaboration/github/pr-policies
 * @description Enforce PR hygiene: title conventions, scope, description completeness, linked issues, reviewers.
 * @inputs { prNumber: number, repo: string, title: string, body: string, changedFiles: Array<string>, linkedIssues?: Array<string> }
 * @outputs { success: boolean, violations: Array<object>, recommendations: Array<string> }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const auditTask = defineTask(
  'pr-policies.audit',
  async ({ prNumber, repo, title, body, changedFiles, linkedIssues }, ctx) => {
    return ctx.agent({
      title: `Audit PR #${prNumber} against policies`,
      prompt: [
        `Audit pull request ${repo}#${prNumber} against PR policies.`,
        'Policies:',
        '- Title follows conventional-commit style (`type(scope): subject`) with imperative mood and < 72 chars.',
        '- Description explains WHY, not just WHAT; references the motivating issue.',
        '- Exactly one logical concern per PR — no mixing refactor + feature + bugfix.',
        '- Linked issues present unless the change is trivial (≤ 5 lines, single file, no behavior change).',
        '- Changed files are scoped — no drive-by edits unrelated to the stated intent.',
        `Title: ${title}`,
        `Body: ${body}`,
        `Changed files (${changedFiles.length}): ${changedFiles.slice(0, 50).join(', ')}`,
        `Linked issues: ${JSON.stringify(linkedIssues ?? [])}`,
        'Return JSON: { violations: Array<{ policy, severity: "block"|"warn", detail }>, recommendations: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Audit PR', labels: ['collaboration', 'github', 'pr'] },
);

export async function process(inputs, ctx) {
  const audit = await ctx.task(auditTask, inputs);
  const violations = audit.violations ?? [];
  const blockers = violations.filter((v) => v.severity === 'block');
  return {
    success: blockers.length === 0,
    violations,
    recommendations: audit.recommendations ?? [],
  };
}

/**
 * @process specializations/collaboration/github/branch-policies
 * @description Enforce branch-naming, target-branch, and no-direct-push-to-protected rules.
 * @inputs { branch: string, targetBranch: string, protectedBranches?: Array<string>, pushContext?: "direct"|"pr" }
 * @outputs { success: boolean, violations: Array<object>, suggestedBranch?: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const PROTECTED_DEFAULTS = ['main', 'master', 'develop', 'staging', 'release'];
const BRANCH_PATTERNS = [
  /^(feature|feat|fix|bugfix|chore|refactor|docs|test|perf)\/[a-z0-9][-a-z0-9]*$/i,
  /^(hotfix|release)\/v?\d+\.\d+(\.\d+)?(-[a-z0-9.]+)?$/i,
  /^dependabot\//,
  /^renovate\//,
];

const auditTask = defineTask(
  'branch-policies.audit',
  async ({ branch, targetBranch, protectedBranches, pushContext }, ctx) => {
    return ctx.agent({
      title: `Audit branch "${branch}" against policies`,
      prompt: [
        'Audit the branch against collaboration policies.',
        `Branch: ${branch}`,
        `Target: ${targetBranch}`,
        `Push context: ${pushContext ?? 'unknown'}`,
        `Protected branches: ${JSON.stringify(protectedBranches ?? PROTECTED_DEFAULTS)}`,
        'Policies:',
        '- Direct pushes to protected branches are forbidden; land changes via PR.',
        '- Feature branches must follow `<type>/<kebab-case-topic>` naming.',
        '- Release/hotfix branches must include a semver in the name.',
        '- Target branch must match the change class (hotfix → main, feature → develop/staging).',
        'Return JSON: { violations: Array<{ policy, severity, detail }>, suggestedBranch?: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Audit branch', labels: ['collaboration', 'github', 'branch'] },
);

export async function process(inputs, ctx) {
  const { branch, pushContext, protectedBranches = PROTECTED_DEFAULTS } = inputs;
  const localViolations = [];
  if (pushContext === 'direct' && protectedBranches.includes(branch)) {
    localViolations.push({
      policy: 'no-direct-push-to-protected',
      severity: 'block',
      detail: `Direct push to protected branch "${branch}" — use a PR.`,
    });
  }
  if (!BRANCH_PATTERNS.some((r) => r.test(branch)) && !protectedBranches.includes(branch)) {
    localViolations.push({
      policy: 'branch-naming',
      severity: 'warn',
      detail: `Branch name "${branch}" does not match expected patterns.`,
    });
  }
  const audit = await ctx.task(auditTask, inputs);
  const violations = [...localViolations, ...(audit.violations ?? [])];
  return {
    success: violations.filter((v) => v.severity === 'block').length === 0,
    violations,
    suggestedBranch: audit.suggestedBranch,
  };
}

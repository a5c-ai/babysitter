/**
 * @process specializations/collaboration/github/pr-lifecycle-hotfix
 * @description Fast-path lifecycle for production hotfixes: minimal gates, mandatory incident link, on-call sign-off breakpoint, merge to main + backport to staging/develop.
 * @inputs { event: string, pr: object, prDiff?: string, incidentRef?: string, onCall?: string, backportBranches?: string[] }
 * @outputs { success: boolean, stages: object, mergeAction: string, backportPlan: object[], blockers: string[] }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration, specialization:devops-sre-platform]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops, skill-area:incident-management]
 *   workflows: [workflow:code-review, workflow:hotfix-deployment, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { process as prPolicies } from './pr-policies.js';

const signOffTask = defineTask(
  'hotfix.sign-off',
  async ({ pr, incidentRef, onCall, previousFeedback }, ctx) => {
    return ctx.breakpoint({
      breakpointId: 'hotfix.sign-off',
      title: `Hotfix sign-off for ${pr.repo}#${pr.number}`,
      expert: onCall ?? 'owner',
      tags: ['hotfix', 'urgent'],
      previousFeedback,
      prompt: [
        `Hotfix sign-off required for PR ${pr.repo}#${pr.number}.`,
        `Incident: ${incidentRef ?? '(none specified — REQUIRED for hotfix)'}`,
        `Title: ${pr.title}`,
        `Changed files: ${pr.changedFiles.join(', ')}`,
        'Approve only if: (a) incident is real, (b) fix is minimal and targeted, (c) rollback plan exists, (d) you will monitor for 30min post-merge.',
      ].join('\n\n'),
    });
  },
  { kind: 'breakpoint', title: 'Hotfix sign-off', labels: ['hotfix'] },
);

export async function process(inputs, ctx) {
  const { pr, incidentRef, onCall, backportBranches = [] } = inputs;
  const stages = {};
  const blockers = [];

  if (!incidentRef) {
    blockers.push('hotfix-requires-incident-ref');
  }

  stages.prPolicies = await prPolicies({
    prNumber: pr.number,
    repo: pr.repo,
    title: pr.title,
    body: pr.body,
    changedFiles: pr.changedFiles,
    linkedIssues: incidentRef ? [incidentRef] : [],
  }, ctx);
  // Hotfix is lenient on PR policies — warnings don't block, only explicit incident-ref does.
  const criticalViolations = (stages.prPolicies.violations ?? []).filter(
    (v) => v.severity === 'block' && v.policy !== 'linked-issues',
  );
  if (criticalViolations.length > 0) blockers.push('pr-policy-critical');

  if (blockers.length === 0) {
    const signOff = await ctx.task(signOffTask, { pr, incidentRef, onCall });
    stages.signOff = { approved: signOff.approved, by: signOff.respondedBy };
    if (!signOff.approved) blockers.push('hotfix-sign-off-denied');
  }

  const backportPlan = backportBranches.map((branch) => ({
    targetBranch: branch,
    strategy: 'cherry-pick',
    autoOpen: true,
  }));

  return {
    success: blockers.length === 0,
    stages,
    mergeAction: blockers.length === 0 ? 'merge-to-main-then-backport' : 'block',
    backportPlan,
    blockers,
  };
}

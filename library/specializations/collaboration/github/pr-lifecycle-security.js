/**
 * @process specializations/collaboration/github/pr-lifecycle-security
 * @description Security PR lifecycle: embargo check → restricted-reviewer gate → confidentiality audit (no leaks in title/body/tests/diff) → coordinated disclosure plan → merge window.
 * @inputs { event: string, pr: object, prDiff?: string, advisory?: { id, embargoUntil?: string, severity: "critical"|"high"|"medium"|"low" }, securityReviewers?: string[] }
 * @outputs { success: boolean, stages: object, disclosureWindow?: string, blockers: string[] }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration, specialization:security-compliance]
 *   skillAreas: [skill-area:code-review-practice, skill-area:application-security-testing, skill-area:vulnerability-management]
 *   workflows: [workflow:code-review, workflow:security-audit, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:security-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const leakAuditTask = defineTask(
  'security-pr.leak-audit',
  async ({ pr, prDiff, advisory }, ctx) => {
    return ctx.agent({
      title: 'Audit PR for premature disclosure',
      prompt: [
        'Audit this security PR for information that would tip off an attacker before the embargo lifts.',
        `Advisory: ${JSON.stringify(advisory ?? {})}`,
        `Title: ${pr.title}`,
        `Body: ${pr.body}`,
        `Diff (first 8000 chars): ${(prDiff ?? '').slice(0, 8000)}`,
        'Red flags:',
        '- PR title/body mentions CVE ID, exploit technique, or "security fix".',
        '- Commit messages describe the vulnerability.',
        '- Test names explicitly describe the attack.',
        '- Diff comments narrate the exploit.',
        'Recommend: neutral phrasing, tests named by behavior not exploit, disclosure content in advisory only.',
        'Return JSON: { leaks: Array<{ location, excerpt, severity: "block"|"warn" }>, recommendedRewrite?: { title?, body? } }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Leak audit', labels: ['security', 'pr'] },
);

const securityReviewTask = defineTask(
  'security-pr.review-gate',
  async ({ pr, reviewer, advisory, previousFeedback }, ctx) => {
    return ctx.breakpoint({
      breakpointId: 'security-pr.review',
      title: `Security review: ${pr.repo}#${pr.number}`,
      expert: reviewer,
      tags: ['security', 'restricted-review'],
      previousFeedback,
      prompt: [
        `Review security PR. Advisory: ${advisory?.id ?? '(none)'} severity=${advisory?.severity ?? 'unknown'}.`,
        `Embargo until: ${advisory?.embargoUntil ?? '(none)'}`,
        'Approve only if: fix is complete, no bypass remains, tests cover the vulnerability behavior, disclosure timing is coordinated.',
      ].join('\n\n'),
    });
  },
  { kind: 'breakpoint', title: 'Security review', labels: ['security'] },
);

export async function process(inputs, ctx) {
  const { pr, prDiff, advisory, securityReviewers = ['owner'] } = inputs;
  const stages = {};
  const blockers = [];

  // 1) Embargo check
  if (advisory?.embargoUntil) {
    const embargoAt = new Date(advisory.embargoUntil).getTime();
    if (Number.isFinite(embargoAt) && Date.now() < embargoAt) {
      stages.embargo = { inEffect: true, until: advisory.embargoUntil };
    } else {
      stages.embargo = { inEffect: false };
    }
  }

  // 2) Leak audit
  stages.leakAudit = await ctx.task(leakAuditTask, { pr, prDiff, advisory });
  const leakBlockers = (stages.leakAudit.leaks ?? []).filter((l) => l.severity === 'block');
  if (leakBlockers.length > 0) {
    blockers.push('disclosure-leak-detected');
  }

  // 3) Restricted reviewer gate (parallel across reviewers, first-response-wins)
  const reviews = [];
  for (const reviewer of securityReviewers) {
    const result = await ctx.task(securityReviewTask, { pr, reviewer, advisory });
    reviews.push({ reviewer, approved: result.approved, feedback: result.feedback });
    if (result.approved) break;
  }
  stages.reviews = reviews;
  if (!reviews.some((r) => r.approved)) {
    blockers.push('security-review-not-approved');
  }

  // 4) Disclosure window
  const disclosureWindow = stages.embargo?.inEffect
    ? `hold-until:${stages.embargo.until}`
    : 'publish-on-merge';

  return {
    success: blockers.length === 0,
    stages,
    disclosureWindow,
    blockers,
  };
}

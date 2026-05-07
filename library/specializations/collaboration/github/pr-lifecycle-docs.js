/**
 * @process specializations/collaboration/github/pr-lifecycle-docs
 * @description Docs-only PR lifecycle: verify docs-only scope → link check → style/voice audit → technical-accuracy review (if touching technical docs) → merge.
 * @inputs { event: string, pr: object, prDiff?: string, technicalReviewer?: string }
 * @outputs { success: boolean, stages: object, blockers: string[] }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration, specialization:technical-documentation]
 *   skillAreas: [skill-area:code-review-practice, skill-area:docs-as-code, skill-area:reference-docs]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:technical-writer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DOCS_PATH_RE = /(^docs\/|\.md$|\.mdx$|^README|^CHANGELOG|^CONTRIBUTING|^LICENSE)/i;
const TECHNICAL_DOCS_RE = /(^docs\/(api|sdk|cli|reference)\/|SDK\.md$|API\.md$)/i;

const styleAuditTask = defineTask(
  'docs-pr.style-audit',
  async ({ pr, prDiff }, ctx) => {
    return ctx.agent({
      title: 'Docs style + link audit',
      prompt: [
        'Audit the docs changes for: broken links, inconsistent voice/tone, unexplained jargon, dead anchors, image alt text.',
        `PR: ${pr.title}`,
        `Diff (first 10000 chars): ${(prDiff ?? '').slice(0, 10000)}`,
        'Return JSON: { findings: Array<{ kind: "link"|"style"|"accessibility"|"consistency", severity: "block"|"nit", detail, suggestion? }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Style audit', labels: ['docs', 'audit'] },
);

const technicalReviewTask = defineTask(
  'docs-pr.technical-review',
  async ({ pr, reviewer, previousFeedback }, ctx) => {
    return ctx.breakpoint({
      breakpointId: 'docs-pr.technical-review',
      title: `Technical docs review: ${pr.repo}#${pr.number}`,
      expert: reviewer,
      tags: ['docs', 'technical'],
      previousFeedback,
      prompt: [
        `Verify technical accuracy of the docs changes in ${pr.repo}#${pr.number}.`,
        'Approve if: code samples compile/run, API references match current surface, version numbers correct.',
      ].join('\n\n'),
    });
  },
  { kind: 'breakpoint', title: 'Technical docs review', labels: ['docs', 'technical'] },
);

export async function process(inputs, ctx) {
  const { pr, prDiff, technicalReviewer } = inputs;
  const stages = {};
  const blockers = [];

  const nonDocsFiles = pr.changedFiles.filter((f) => !DOCS_PATH_RE.test(f));
  if (nonDocsFiles.length > 0) {
    blockers.push(`non-docs-files-in-docs-pr: ${nonDocsFiles.slice(0, 5).join(', ')}`);
  }
  stages.scope = { docsOnly: nonDocsFiles.length === 0, nonDocsFiles };

  if (blockers.length === 0) {
    stages.styleAudit = await ctx.task(styleAuditTask, { pr, prDiff });
    const blockerFindings = (stages.styleAudit.findings ?? []).filter((f) => f.severity === 'block');
    if (blockerFindings.length > 0) blockers.push('docs-style-blockers');
  }

  const touchesTechnical = pr.changedFiles.some((f) => TECHNICAL_DOCS_RE.test(f));
  if (touchesTechnical && technicalReviewer && blockers.length === 0) {
    const review = await ctx.task(technicalReviewTask, { pr, reviewer: technicalReviewer });
    stages.technicalReview = { approved: review.approved, by: review.respondedBy };
    if (!review.approved) blockers.push('technical-docs-review-denied');
  }

  return {
    success: blockers.length === 0,
    stages,
    blockers,
  };
}

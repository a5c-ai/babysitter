/**
 * @process specializations/communication/content-validator
 * @description Content-validator persona. Scans text as devil's advocate → flags issues
 *   across 5 independent axes in parallel (clarity, audience perspectives, ambiguity,
 *   metaphors, consistency) → writes a structured feedback report with concrete rewrites.
 * @inputs { content: string, audience?: string }
 * @outputs { success, axesReviewed, issuesFound, reportPath? }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/communication/content-validator-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:communication]
 *   skillAreas: [skill-area:docs-as-code, skill-area:reference-docs]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:post-mortem-review, workflow:peer-review-cycle]
 *   roles: [role:tech-lead, role:engineering-manager, role:technical-writer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const AXES = [
  { id: 'clarity', description: 'Clarity audit: highlight vague, overly complex, jargon-heavy passages. Ask: would a first-time visitor instantly understand?' },
  { id: 'audience-flip', description: 'Audience perspective flip: review from technical, non-technical, investor, casual-user perspectives. Flag where one audience is lost.' },
  { id: 'ambiguity', description: 'Ambiguity hunt: detect phrases or CTAs that could be misinterpreted.' },
  { id: 'metaphors', description: 'Metaphor analyzer: test metaphors for clarity and accuracy; propose better alternatives; surface gaps where a metaphor would help.' },
  { id: 'consistency', description: 'Consistency sweep + impact check: tone, terminology, key value props uniform; every heading/visual supports core message.' },
];

const scanAxisTask = defineTask(
  'content-validator.scan-axis',
  async ({ axis, content, audience }, ctx) => {
    return ctx.agent({
      title: `Content-validator: ${axis.id} axis`,
      prompt: [
        'You are the content-validator-agent reviewing ONE axis as devil\'s advocate.',
        `Axis: ${axis.id}`,
        `Scope: ${axis.description}`,
        'For each issue, propose a concrete rewrite (before/after).',
        `Audience (if specified): ${audience ?? '(unspecified)'}`,
        `Content:\n---\n${(content ?? '').slice(0, 40000)}\n---`,
        'Return JSON: { issues: Array<{ passage, problem, rewrite, severity }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-validator scan axis', labels: ['a5c', 'content-validator'] },
);

const flagIssuesTask = defineTask(
  'content-validator.flag-and-prioritise',
  async ({ allIssues }, ctx) => {
    return ctx.agent({
      title: `Content-validator: flag + prioritise ${allIssues.length} issue(s)`,
      prompt: [
        'Deduplicate overlapping findings across axes. Rank by severity (blocker|major|minor).',
        'Identify top simplification opportunities that would improve understanding most.',
        `All issues: ${JSON.stringify(allIssues, null, 2)}`,
        'Return JSON: { ranked: Array<same-shape + axis>, topSimplifications: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-validator flag', labels: ['a5c', 'content-validator'] },
);

const writeReportTask = defineTask(
  'content-validator.write-report',
  async ({ ranked, topSimplifications }, ctx) => {
    return ctx.agent({
      title: 'Content-validator: write structured feedback report',
      prompt: [
        'Produce a structured markdown report grouped by axis, each issue showing passage + problem + proposed rewrite.',
        'End with a "Top Simplification Opportunities" section.',
        `Ranked issues: ${JSON.stringify(ranked, null, 2)}`,
        `Top simplifications: ${JSON.stringify(topSimplifications, null, 2)}`,
        'Return JSON: { reportPath?: string, reportMarkdown: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-validator report', labels: ['a5c', 'content-validator'] },
);

export async function process(inputs, ctx) {
  const { content = '', audience } = inputs ?? {};
  if (!content) {
    return { success: true, axesReviewed: 0, issuesFound: 0 };
  }

  // Scan all axes in parallel.
  const axisResults = await ctx.parallel.map(AXES, (axis) =>
    ctx.task(scanAxisTask, { axis, content, audience }),
  );
  const allIssues = axisResults.flatMap((r, i) =>
    (Array.isArray(r?.issues) ? r.issues : []).map((iss) => ({ ...iss, axis: AXES[i].id })),
  );

  if (allIssues.length === 0) {
    return { success: true, axesReviewed: AXES.length, issuesFound: 0 };
  }

  const flagged = await ctx.task(flagIssuesTask, { allIssues });
  const report = await ctx.task(writeReportTask, {
    ranked: flagged?.ranked ?? allIssues,
    topSimplifications: flagged?.topSimplifications ?? [],
  });

  return {
    success: true,
    axesReviewed: AXES.length,
    issuesFound: allIssues.length,
    reportPath: report?.reportPath,
  };
}

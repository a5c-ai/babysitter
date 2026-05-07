/**
 * @process processes/shared/reporting/scheduled-report
 * @description Emit a structured scheduled-run report; suppress output if previous report unread and nothing material changed.
 * @inputs { windowStart: string, windowEnd: string, observations: Array<object>, previousReport?: object, responsibleParty?: string }
 * @outputs { success: boolean, report?: object, suppressed: boolean, suppressReason?: string }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const materialityTask = defineTask(
  'scheduled-report.materiality',
  async ({ observations, previousReport }, ctx) => {
    return ctx.agent({
      title: 'Detect material change vs. previous report',
      prompt: [
        'Decide whether the current observations represent a material change vs. the previous report.',
        `Previous report: ${JSON.stringify(previousReport ?? null, null, 2)}`,
        `Current observations: ${JSON.stringify(observations, null, 2)}`,
        'Quiet weeks should stay quiet — if nothing material changed AND previous report is still relevant, suppress.',
        'Return JSON: { materialChange: boolean, reason: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Assess materiality', labels: ['reporting'] },
);

const composeReportTask = defineTask(
  'scheduled-report.compose',
  async ({ windowStart, windowEnd, observations, previousReport, responsibleParty }, ctx) => {
    return ctx.agent({
      title: 'Compose structured scheduled report',
      prompt: [
        `Compose a structured report covering ${windowStart} → ${windowEnd}.`,
        'Sections:',
        '- Window',
        '- Summary (2-3 sentences)',
        '- Key findings (bullets, each with an issue/PR/file/log pointer)',
        '- Deltas vs. previous run (explicit "nothing material changed" if true)',
        '- Recommended actions (optional; only if someone should do something)',
        responsibleParty ? `Tag the responsible party: ${responsibleParty}` : '',
        '',
        `Observations: ${JSON.stringify(observations, null, 2)}`,
        `Previous report: ${JSON.stringify(previousReport ?? null, null, 2)}`,
        'Return JSON: { window, summary, keyFindings, deltas, recommendedActions }.',
      ].filter(Boolean).join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Compose report', labels: ['reporting'] },
);

export async function process(inputs, ctx) {
  const { windowStart, windowEnd, observations = [], previousReport, responsibleParty } = inputs;
  const materiality = await ctx.task(materialityTask, { observations, previousReport });
  if (!materiality.materialChange) {
    return {
      success: true,
      suppressed: true,
      suppressReason: materiality.reason,
    };
  }
  const report = await ctx.task(composeReportTask, {
    windowStart,
    windowEnd,
    observations,
    previousReport,
    responsibleParty,
  });
  return { success: true, suppressed: false, report };
}

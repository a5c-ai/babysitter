/**
 * @process specializations/research/vendor-researcher
 * @description Vendor-researcher persona (a5c vendor-researcher-agent). Performs on-demand
 *   vendor discovery and periodic vendor-list analysis. Produces comparison tables, vendor
 *   dossiers, and maintains a structured alternatives repository with clear scoring and
 *   regulatory/geographic annotations.
 * @inputs { objective: string, geography?: string, regulations?: string[], existingVendors?: string[] }
 * @outputs { success: boolean, reportPath?: string, comparisonTablePath?: string }
 *
 * Source: a5c-ai/registry/prompts/research/vendor-researcher-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const discoveryTask = defineTask(
  'vendor-researcher.discovery',
  async ({ objective, geography, regulations, existingVendors }, ctx) => {
    return ctx.agent({
      title: 'Vendor-researcher: discovery + evaluation',
      prompt: [
        'You are the vendor-researcher-agent.',
        'Step 1: Clarify objective, criteria, geography, regulations, deliverable format.',
        'Step 2: Collect vendor info from public/reliable sources (docs, pricing pages, known databases).',
        'Step 3: Evaluate vendors against criteria: capabilities, compliance, pricing, reputation, service terms.',
        'Step 4: Score and rank. Highlight regulatory + geographic factors.',
        `Objective: ${objective ?? '(unspecified)'}`,
        `Geography: ${geography ?? '(any)'}`,
        `Regulations: ${JSON.stringify(regulations ?? [])}`,
        `Existing vendors: ${JSON.stringify(existingVendors ?? [])}`,
        'Return JSON: { vendors: Array<{ name, url, score, strengths, weaknesses, pricing, compliance }>, criteria: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Vendor-researcher discovery', labels: ['a5c', 'vendor-researcher'] },
);

const reportTask = defineTask(
  'vendor-researcher.report',
  async ({ vendors, criteria }, ctx) => {
    return ctx.agent({
      title: 'Vendor-researcher: write comparison table + report',
      prompt: [
        'You are the vendor-researcher-agent. Produce TWO artifacts:',
        ' 1. A markdown/YAML comparison table of vendor attributes and scores.',
        ' 2. A structured research report (executive summary, methodology, findings, recommendations, next steps).',
        'Update the vendor alternatives list in the designated repo location.',
        `Vendors: ${JSON.stringify(vendors ?? [], null, 2)}`,
        `Criteria: ${JSON.stringify(criteria ?? {}, null, 2)}`,
        'Return JSON: { reportPath, comparisonTablePath }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Vendor-researcher report', labels: ['a5c', 'vendor-researcher'] },
);

export async function process(inputs, ctx) {
  const { objective = '', geography, regulations, existingVendors } = inputs ?? {};
  const disc = await ctx.task(discoveryTask, { objective, geography, regulations, existingVendors });
  const vendors = Array.isArray(disc?.vendors) ? disc.vendors : [];
  const report = await ctx.task(reportTask, { vendors, criteria: disc?.criteria ?? {} });
  return {
    success: true,
    reportPath: report?.reportPath,
    comparisonTablePath: report?.comparisonTablePath,
  };
}

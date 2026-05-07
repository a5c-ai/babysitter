/**
 * @process specializations/research/vendor-researcher
 * @description Vendor-researcher persona. Discover candidate vendors → analyse each in
 *   parallel against criteria (capabilities, compliance, pricing, reputation, service terms) →
 *   assemble a comparison table → produce a recommendation report with regulatory/geographic
 *   annotations. Updates the structured alternatives repository.
 * @inputs { objective: string, geography?: string, regulations?: string[], existingVendors?: string[] }
 * @outputs { success, reportPath?, comparisonTablePath?, vendorCount }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/research/vendor-researcher-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:research]
 *   skillAreas: [skill-area:deep-web-research, skill-area:market-research, skill-area:data-analysis]
 *   workflows: [workflow:vendor-evaluation]
 *   roles: [role:research-engineer, role:tech-lead, role:platform-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const clarifyCriteriaTask = defineTask(
  'vendor-researcher.clarify-criteria',
  async ({ objective, geography, regulations, existingVendors }, ctx) => {
    return ctx.agent({
      title: 'Vendor-researcher: clarify criteria',
      prompt: [
        'Formalise the evaluation criteria: capabilities, compliance, pricing model, reputation, service terms, SLAs.',
        'Factor in geographic and regulatory constraints.',
        `Objective: ${objective ?? '(unspecified)'}`,
        `Geography: ${geography ?? '(any)'}`,
        `Regulations: ${JSON.stringify(regulations ?? [])}`,
        `Existing vendors: ${JSON.stringify(existingVendors ?? [])}`,
        'Return JSON: { criteria: object, scoringRubric: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Clarify criteria', labels: ['a5c', 'vendor-researcher'] },
);

const discoverCandidatesTask = defineTask(
  'vendor-researcher.discover-candidates',
  async ({ objective, criteria, existingVendors }, ctx) => {
    return ctx.agent({
      title: 'Vendor-researcher: discover candidate vendors',
      prompt: [
        'Collect candidate vendors from public/reliable sources (docs, pricing pages, known databases).',
        'Include existing vendors for incumbent comparison. Return a candidate shortlist (name + url + one-line pitch).',
        `Objective: ${objective}`,
        `Criteria: ${JSON.stringify(criteria ?? {}, null, 2)}`,
        `Existing: ${JSON.stringify(existingVendors ?? [])}`,
        'Return JSON: { candidates: Array<{ name, url, pitch }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Discover candidates', labels: ['a5c', 'vendor-researcher'] },
);

const analyseVendorTask = defineTask(
  'vendor-researcher.analyse-vendor',
  async ({ vendor, criteria, scoringRubric }, ctx) => {
    return ctx.agent({
      title: `Analyse vendor: ${vendor.name}`,
      prompt: [
        'Score this single vendor against every criterion.',
        'Produce: strengths, weaknesses, pricing snapshot, compliance status, regulatory/geographic notes.',
        `Vendor: ${JSON.stringify(vendor)}`,
        `Criteria: ${JSON.stringify(criteria ?? {}, null, 2)}`,
        `Scoring rubric: ${JSON.stringify(scoringRubric ?? {}, null, 2)}`,
        'Return JSON: { name, url, score, strengths, weaknesses, pricing, compliance, regulatoryNotes }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Analyse vendor', labels: ['a5c', 'vendor-researcher'] },
);

const comparisonTableTask = defineTask(
  'vendor-researcher.comparison-table',
  async ({ vendors, criteria }, ctx) => {
    return ctx.agent({
      title: 'Vendor-researcher: assemble comparison table',
      prompt: [
        'Produce a markdown (or YAML) comparison table: one row per vendor, one column per criterion, final score column.',
        'Commit it to the vendor alternatives repo location (e.g. docs/vendors/comparison.md).',
        `Vendors: ${JSON.stringify(vendors, null, 2)}`,
        `Criteria: ${JSON.stringify(criteria ?? {}, null, 2)}`,
        'Return JSON: { comparisonTablePath: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Comparison table', labels: ['a5c', 'vendor-researcher'] },
);

const recommendationTask = defineTask(
  'vendor-researcher.recommendation',
  async ({ vendors, criteria }, ctx) => {
    return ctx.agent({
      title: 'Vendor-researcher: write recommendation report',
      prompt: [
        'Write a structured report: executive summary, methodology, findings, ranked recommendation, next steps (outreach/POC plan).',
        'Highlight regulatory and geographic factors affecting selection.',
        `Vendors (with scores): ${JSON.stringify(vendors, null, 2)}`,
        `Criteria: ${JSON.stringify(criteria ?? {}, null, 2)}`,
        'Commit at docs/vendors/<objective-slug>/report.md.',
        'Return JSON: { reportPath: string, topChoice: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Recommendation report', labels: ['a5c', 'vendor-researcher'] },
);

export async function process(inputs, ctx) {
  const { objective = '', geography, regulations, existingVendors } = inputs ?? {};
  const { criteria, scoringRubric } = await ctx.task(clarifyCriteriaTask, {
    objective, geography, regulations, existingVendors,
  });
  const { candidates = [] } = await ctx.task(discoverCandidatesTask, { objective, criteria, existingVendors });

  if (candidates.length === 0) {
    return { success: true, vendorCount: 0 };
  }

  // Analyse each vendor in parallel — independent scoring.
  const vendors = await ctx.parallel.map(candidates, (vendor) =>
    ctx.task(analyseVendorTask, { vendor, criteria, scoringRubric }),
  );

  const [table, rec] = await ctx.parallel.all([
    ctx.task(comparisonTableTask, { vendors, criteria }),
    ctx.task(recommendationTask, { vendors, criteria }),
  ]);

  return {
    success: true,
    vendorCount: vendors.length,
    reportPath: rec?.reportPath,
    comparisonTablePath: table?.comparisonTablePath,
  };
}

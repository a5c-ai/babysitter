/**
 * @process specializations/business/revenue
 * @description Revenue-agent. Analyse current/projected project costs → market-compare
 *   pricing strategies of similar projects → design tiered pricing + revenue channels →
 *   produce cost-vs-revenue projections and monitoring guidance.
 * @inputs { projectName?: string, costMetrics?: object, revenueData?: object, horizonMonths?: number }
 * @outputs { success, phase, tiers, projections, monitoringGuidance }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/business/revenue-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:business-analysis, skill-area:financial-modeling, skill-area:business-model-design, skill-area:strategic-planning]
 *   topics: [topic:developer-experience]
 *   workflows: [workflow:strategic-planning, workflow:pricing-strategy-review]
 *   roles: [role:business-analyst, role:tech-lead, role:product-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const costAnalysisTask = defineTask(
  'revenue.cost-analysis',
  async ({ projectName, costMetrics }, ctx) => {
    return ctx.agent({
      title: `Revenue: cost analysis for ${projectName ?? 'project'}`,
      prompt: [
        'Analyse project costs. Identify cost drivers (infra, per-seat licenses, support, egress).',
        'Recommend cost-optimisation opportunities. Return a unit-economics summary suitable for pricing design.',
        `Project: ${projectName ?? '(unspecified)'}`,
        `Cost metrics: ${JSON.stringify(costMetrics ?? {}, null, 2)}`,
        'Return JSON: { drivers: object, unitEconomics: object, optimisations: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Revenue cost analysis', labels: ['a5c', 'revenue'] },
);

const marketCompareTask = defineTask(
  'revenue.market-compare',
  async ({ projectName }, ctx) => {
    return ctx.agent({
      title: 'Revenue: market-compare similar projects',
      prompt: [
        'Research pricing strategies of at least 3 analogous OSS/SaaS projects.',
        'Collect: pricing model (flat/subscription/tiered/usage), price points, free-tier policy, premium gates.',
        'Identify industry benchmarks relevant to this project.',
        `Project: ${projectName ?? '(unspecified)'}`,
        'Return JSON: { comparables: Array<{ name, model, pricePoints, notes }>, benchmarks: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Revenue market compare', labels: ['a5c', 'revenue'] },
);

const tierDesignTask = defineTask(
  'revenue.tier-design',
  async ({ unitEconomics, comparables, benchmarks }, ctx) => {
    return ctx.agent({
      title: 'Revenue: design tiered pricing + channels',
      prompt: [
        'Design a tiered pricing plan (free / pro / team / enterprise) with feature gates aligned to cost drivers.',
        'Propose additional revenue channels: partnerships, marketplace, managed hosting, premium support, ads (if appropriate).',
        `Unit economics: ${JSON.stringify(unitEconomics ?? {}, null, 2)}`,
        `Comparables: ${JSON.stringify(comparables ?? [], null, 2)}`,
        `Benchmarks: ${JSON.stringify(benchmarks ?? {}, null, 2)}`,
        'Return JSON: { tiers: Array<{ name, price, features, gate }>, channels: Array<{ name, rationale }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Revenue tier design', labels: ['a5c', 'revenue'] },
);

const projectionsTask = defineTask(
  'revenue.projections',
  async ({ tiers, channels, horizonMonths, revenueData }, ctx) => {
    return ctx.agent({
      title: `Revenue: project cost-vs-revenue over ${horizonMonths ?? 12} months`,
      prompt: [
        'Produce cost-vs-revenue projections for conservative/base/aggressive scenarios.',
        'Assume mix-shift between tiers; call out key sensitivities.',
        `Tiers: ${JSON.stringify(tiers, null, 2)}`,
        `Channels: ${JSON.stringify(channels, null, 2)}`,
        `Revenue data (if any): ${JSON.stringify(revenueData ?? {}, null, 2)}`,
        `Horizon (months): ${horizonMonths ?? 12}`,
        'Return JSON: { projections: { conservative, base, aggressive }, sensitivities: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Revenue projections', labels: ['a5c', 'revenue'] },
);

const monitoringGuidanceTask = defineTask(
  'revenue.monitoring-guidance',
  async ({ tiers, projections }, ctx) => {
    return ctx.agent({
      title: 'Revenue: monitoring + adjustment guidance',
      prompt: [
        'Define KPIs + dashboards + review cadence for ongoing pricing optimisation.',
        'Suggest triggers for adjustments (e.g. gross-margin drift, churn spike, conversion miss).',
        `Tiers: ${JSON.stringify(tiers, null, 2)}`,
        `Projections: ${JSON.stringify(projections, null, 2)}`,
        'Return JSON: { kpis: string[], cadence: string, triggers: Array<{ metric, threshold, action }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Revenue monitoring guidance', labels: ['a5c', 'revenue'] },
);

export async function process(inputs, ctx) {
  const { projectName, costMetrics, revenueData, horizonMonths = 12 } = inputs ?? {};
  const [cost, market] = await ctx.parallel.all([
    ctx.task(costAnalysisTask, { projectName, costMetrics }),
    ctx.task(marketCompareTask, { projectName }),
  ]);

  const tiersRes = await ctx.task(tierDesignTask, {
    unitEconomics: cost?.unitEconomics ?? {},
    comparables: market?.comparables ?? [],
    benchmarks: market?.benchmarks ?? {},
  });
  const tiers = Array.isArray(tiersRes?.tiers) ? tiersRes.tiers : [];
  const channels = Array.isArray(tiersRes?.channels) ? tiersRes.channels : [];

  const proj = await ctx.task(projectionsTask, { tiers, channels, horizonMonths, revenueData });
  const mon = await ctx.task(monitoringGuidanceTask, { tiers, projections: proj?.projections ?? {} });

  return {
    success: true,
    phase: 'designed',
    tiers,
    channels,
    projections: proj?.projections ?? {},
    monitoringGuidance: mon ?? {},
  };
}

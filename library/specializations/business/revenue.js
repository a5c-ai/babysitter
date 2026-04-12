/**
 * @process specializations/business/revenue
 * @description Revenue persona (a5c revenue-agent). Designs pricing plans, analyzes costs,
 *   researches similar-project pricing, and optimizes revenue channels. Produces pricing
 *   structures (subscription / one-time / tiered), revenue-channel recommendations, and
 *   cost-vs-revenue projections; coordinates with researcher-base and content-writer.
 * @inputs { projectSummary: string, costs?: object, revenue?: object, horizonMonths?: number }
 * @outputs { success: boolean, strategyPath?: string, projectedRevenue?: object }
 *
 * Source: a5c-ai/registry/prompts/business/revenue-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const researchTask = defineTask(
  'revenue.benchmark-research',
  async ({ projectSummary }, ctx) => {
    return ctx.agent({
      title: 'Revenue: benchmark similar-project pricing',
      prompt: [
        'You are the revenue-agent working with researcher-base-agent data.',
        'Identify comparable projects/products and their pricing strategies, tiers, anchor prices, and channel mixes.',
        `Project: ${projectSummary ?? '(unspecified)'}`,
        'Return JSON: { benchmarks: Array<{ name, model, tiers, notes }>, insights: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Revenue benchmark research', labels: ['a5c', 'revenue'] },
);

const strategyTask = defineTask(
  'revenue.design-strategy',
  async ({ projectSummary, costs, revenue, horizonMonths, benchmarks }, ctx) => {
    return ctx.agent({
      title: 'Revenue: design pricing + channel strategy',
      prompt: [
        'You are the revenue-agent.',
        'Propose pricing structures (subscription, one-time, tiered) and revenue channels (ads, partnerships, premium features).',
        'Present cost vs revenue projections across scenarios (conservative / base / optimistic).',
        'Provide monitoring guidance: metrics to watch, adjustment triggers.',
        `Project: ${projectSummary ?? '(unspecified)'}`,
        `Costs: ${JSON.stringify(costs ?? {}, null, 2)}`,
        `Current revenue: ${JSON.stringify(revenue ?? {}, null, 2)}`,
        `Horizon: ${horizonMonths ?? 12} months`,
        `Benchmarks: ${JSON.stringify(benchmarks ?? [], null, 2)}`,
        'Coordinate with @content-writer-agent for pricing-page copy and @developer-agent for integration hooks.',
        'Return JSON: { strategyPath, projectedRevenue: { conservative, base, optimistic } }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Revenue design strategy', labels: ['a5c', 'revenue'] },
);

export async function process(inputs, ctx) {
  const { projectSummary = '', costs, revenue, horizonMonths = 12 } = inputs ?? {};
  const bench = await ctx.task(researchTask, { projectSummary });
  const strategy = await ctx.task(strategyTask, {
    projectSummary,
    costs,
    revenue,
    horizonMonths,
    benchmarks: Array.isArray(bench?.benchmarks) ? bench.benchmarks : [],
  });
  return {
    success: true,
    strategyPath: strategy?.strategyPath,
    projectedRevenue: strategy?.projectedRevenue,
  };
}

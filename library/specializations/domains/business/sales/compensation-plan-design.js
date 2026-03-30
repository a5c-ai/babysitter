/**
 * @process sales/compensation-plan-design
 * @description Structured approach to designing compensation plans including base/variable mix, accelerators, SPIFs, and payout modeling.
 * @inputs { roles: array, companyObjectives: object, marketBenchmarks?: object, currentPlans?: array, constraints?: object }
 * @outputs { success: boolean, compensationPlan: object, payoutModels: array, costAnalysis: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/compensation-plan-design', {
 *   roles: [{ role: 'AE', ote: 200000 }],
 *   companyObjectives: { revenue: 10000000, growthRate: 0.25 },
 *   marketBenchmarks: { aeMix: '50/50' }
 * });
 *
 * @references
 * - Cracking the Sales Management Code: https://www.amazon.com/Cracking-Sales-Management-Code-Behaviors/dp/0071765735
 * - WorldatWork Sales Compensation: https://www.worldatwork.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    roles = [],
    companyObjectives = {},
    marketBenchmarks = {},
    currentPlans = [],
    constraints = {},
    outputDir = 'comp-plan-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Compensation Plan Design for ${roles.length} roles`);

  // Phase 1: Market Benchmarking
  const benchmarking = await ctx.task(marketBenchmarkingTask, { roles, marketBenchmarks, outputDir });
  artifacts.push(...(benchmarking.artifacts || []));

  // Phase 2: Pay Mix Design
  const payMixDesign = await ctx.task(payMixDesignTask, { roles, benchmarking, companyObjectives, outputDir });
  artifacts.push(...(payMixDesign.artifacts || []));

  // Phase 3: Quota and OTE Alignment
  const quotaAlignment = await ctx.task(quotaAlignmentTask, { payMixDesign, companyObjectives, outputDir });
  artifacts.push(...(quotaAlignment.artifacts || []));

  // Phase 4: Accelerator Design
  const acceleratorDesign = await ctx.task(acceleratorDesignTask, { payMixDesign, companyObjectives, constraints, outputDir });
  artifacts.push(...(acceleratorDesign.artifacts || []));

  // Phase 5: SPIF Design
  const spifDesign = await ctx.task(spifDesignTask, { companyObjectives, roles, outputDir });
  artifacts.push(...(spifDesign.artifacts || []));

  // Phase 6: Payout Modeling
  const payoutModeling = await ctx.task(payoutModelingTask, {
    payMixDesign, acceleratorDesign, spifDesign, companyObjectives, outputDir
  });
  artifacts.push(...(payoutModeling.artifacts || []));

  // Phase 7: Cost Analysis
  const costAnalysis = await ctx.task(compCostAnalysisTask, { payoutModeling, roles, companyObjectives, outputDir });
  artifacts.push(...(costAnalysis.artifacts || []));

  // Phase 8: Plan Documentation
  const planDocumentation = await ctx.task(planDocumentationTask, {
    payMixDesign, acceleratorDesign, spifDesign, payoutModeling, outputDir
  });
  artifacts.push(...(planDocumentation.artifacts || []));

  await ctx.breakpoint({
    question: `Compensation plan designed. Total cost: ${costAnalysis.totalCost}. Review and approve?`,
    title: 'Compensation Plan Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    compensationPlan: planDocumentation.plan,
    payoutModels: payoutModeling.models,
    costAnalysis: costAnalysis.analysis,
    recommendations: planDocumentation.recommendations,
    artifacts,
    metadata: { processId: 'sales/compensation-plan-design', timestamp: startTime }
  };
}

export const marketBenchmarkingTask = defineTask('market-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Market Benchmarking',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Compensation benchmarking specialist',
      task: 'Benchmark compensation against market',
      context: args,
      instructions: ['Research market rates', 'Compare OTE levels', 'Analyze pay mix trends', 'Identify competitive positioning']
    },
    outputSchema: { type: 'object', required: ['benchmarks', 'artifacts'], properties: { benchmarks: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'benchmarking']
}));

export const payMixDesignTask = defineTask('pay-mix-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pay Mix Design',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Pay mix design specialist',
      task: 'Design base/variable pay mix',
      context: args,
      instructions: ['Determine optimal pay mix', 'Align with role complexity', 'Balance risk and reward', 'Consider market norms']
    },
    outputSchema: { type: 'object', required: ['payMix', 'artifacts'], properties: { payMix: { type: 'array' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'pay-mix']
}));

export const quotaAlignmentTask = defineTask('quota-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quota and OTE Alignment',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Quota-comp alignment specialist',
      task: 'Align quotas with OTE',
      context: args,
      instructions: ['Calculate quota-to-OTE ratio', 'Ensure achievability', 'Set performance thresholds', 'Design payout curves']
    },
    outputSchema: { type: 'object', required: ['alignment', 'artifacts'], properties: { alignment: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'quota-alignment']
}));

export const acceleratorDesignTask = defineTask('accelerator-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Accelerator Design',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Accelerator design specialist',
      task: 'Design commission accelerators',
      context: args,
      instructions: ['Design tiered accelerators', 'Set achievement thresholds', 'Calculate multipliers', 'Model payouts']
    },
    outputSchema: { type: 'object', required: ['accelerators', 'artifacts'], properties: { accelerators: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'accelerators']
}));

export const spifDesignTask = defineTask('spif-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'SPIF Design',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'SPIF design specialist',
      task: 'Design sales performance incentive funds',
      context: args,
      instructions: ['Identify strategic objectives', 'Design SPIF programs', 'Set budgets and rules', 'Create measurement criteria']
    },
    outputSchema: { type: 'object', required: ['spifs', 'artifacts'], properties: { spifs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'spifs']
}));

export const payoutModelingTask = defineTask('payout-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Payout Modeling',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Payout modeling specialist',
      task: 'Model compensation payouts',
      context: args,
      instructions: ['Create payout scenarios', 'Model attainment levels', 'Calculate expected payouts', 'Stress test the plan']
    },
    outputSchema: { type: 'object', required: ['models', 'artifacts'], properties: { models: { type: 'array' }, scenarios: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'payout-modeling']
}));

export const compCostAnalysisTask = defineTask('comp-cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cost Analysis',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Compensation cost analyst',
      task: 'Analyze total compensation costs',
      context: args,
      instructions: ['Calculate total comp cost', 'Analyze cost-to-revenue ratio', 'Compare to benchmarks', 'Assess affordability']
    },
    outputSchema: { type: 'object', required: ['analysis', 'totalCost', 'artifacts'], properties: { analysis: { type: 'object' }, totalCost: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'cost-analysis']
}));

export const planDocumentationTask = defineTask('plan-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Documentation',
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Compensation plan writer',
      task: 'Document the compensation plan',
      context: args,
      instructions: ['Write plan document', 'Create summary materials', 'Document rules and exceptions', 'Prepare communication materials']
    },
    outputSchema: { type: 'object', required: ['plan', 'recommendations', 'artifacts'], properties: { plan: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'compensation', 'documentation']
}));

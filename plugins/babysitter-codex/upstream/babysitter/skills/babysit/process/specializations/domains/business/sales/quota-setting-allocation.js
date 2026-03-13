/**
 * @process sales/quota-setting-allocation
 * @description Framework for setting achievable but ambitious quotas based on territory potential, historical performance, and company objectives.
 * @inputs { salesTeam: array, territories: array, companyTargets: object, historicalData?: object, marketConditions?: object }
 * @outputs { success: boolean, quotaPlan: object, allocations: array, fairnessAnalysis: object, attainmentProjections: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/quota-setting-allocation', {
 *   salesTeam: [{ name: 'Rep 1', territory: 'West' }],
 *   territories: [{ name: 'West', potential: 1000000 }],
 *   companyTargets: { totalQuota: 10000000, growthRate: 0.2 }
 * });
 *
 * @references
 * - Sales Management Association: https://salesmanagement.org/certification/
 * - Xactly Quota Management: https://www.xactlycorp.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    salesTeam = [],
    territories = [],
    companyTargets = {},
    historicalData = {},
    marketConditions = {},
    quotaMethodology = 'hybrid',
    outputDir = 'quota-setting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quota Setting for ${salesTeam.length} reps`);

  // Phase 1: Territory Potential Analysis
  const potentialAnalysis = await ctx.task(territoryPotentialTask, { territories, marketConditions, outputDir });
  artifacts.push(...(potentialAnalysis.artifacts || []));

  // Phase 2: Historical Performance Analysis
  const performanceAnalysis = await ctx.task(historicalPerformanceTask, { salesTeam, historicalData, outputDir });
  artifacts.push(...(performanceAnalysis.artifacts || []));

  // Phase 3: Top-Down Allocation
  const topDownAllocation = await ctx.task(topDownAllocationTask, { companyTargets, territories, potentialAnalysis, outputDir });
  artifacts.push(...(topDownAllocation.artifacts || []));

  // Phase 4: Bottom-Up Validation
  const bottomUpValidation = await ctx.task(bottomUpValidationTask, {
    salesTeam, performanceAnalysis, potentialAnalysis, topDownAllocation, outputDir
  });
  artifacts.push(...(bottomUpValidation.artifacts || []));

  // Phase 5: Quota Reconciliation
  const quotaReconciliation = await ctx.task(quotaReconciliationTask, {
    topDownAllocation, bottomUpValidation, companyTargets, quotaMethodology, outputDir
  });
  artifacts.push(...(quotaReconciliation.artifacts || []));

  // Phase 6: Fairness Analysis
  const fairnessAnalysis = await ctx.task(fairnessAnalysisTask, {
    quotaReconciliation, salesTeam, territories, outputDir
  });
  artifacts.push(...(fairnessAnalysis.artifacts || []));

  // Phase 7: Attainment Projection
  const attainmentProjection = await ctx.task(attainmentProjectionTask, {
    quotaReconciliation, performanceAnalysis, marketConditions, outputDir
  });
  artifacts.push(...(attainmentProjection.artifacts || []));

  await ctx.breakpoint({
    question: `Quota plan ready. Total: ${companyTargets.totalQuota}. Fairness score: ${fairnessAnalysis.fairnessScore}. Approve?`,
    title: 'Quota Plan Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    quotaPlan: quotaReconciliation.quotaPlan,
    allocations: quotaReconciliation.allocations,
    fairnessAnalysis: fairnessAnalysis.analysis,
    attainmentProjections: attainmentProjection.projections,
    artifacts,
    metadata: { processId: 'sales/quota-setting-allocation', timestamp: startTime }
  };
}

export const territoryPotentialTask = defineTask('territory-potential', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Territory Potential Analysis',
  agent: {
    name: 'quota-analyst',
    prompt: {
      role: 'Territory potential analyst',
      task: 'Analyze territory potential for quota setting',
      context: args,
      instructions: ['Calculate total addressable market', 'Assess growth rates', 'Identify high-potential areas', 'Score territory potential']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, potentialScores: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'quota', 'potential']
}));

export const historicalPerformanceTask = defineTask('historical-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Historical Performance Analysis',
  agent: {
    name: 'quota-analyst',
    prompt: {
      role: 'Performance analyst',
      task: 'Analyze historical sales performance',
      context: args,
      instructions: ['Calculate attainment rates', 'Identify performance trends', 'Assess rep capacity', 'Benchmark against peers']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, repMetrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'quota', 'performance']
}));

export const topDownAllocationTask = defineTask('top-down-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Top-Down Quota Allocation',
  agent: {
    name: 'quota-analyst',
    prompt: {
      role: 'Quota allocation specialist',
      task: 'Allocate company targets top-down',
      context: args,
      instructions: ['Distribute company quota', 'Weight by territory potential', 'Apply growth factors', 'Create initial allocation']
    },
    outputSchema: { type: 'object', required: ['allocations', 'artifacts'], properties: { allocations: { type: 'array' }, methodology: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'quota', 'top-down']
}));

export const bottomUpValidationTask = defineTask('bottom-up-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Bottom-Up Validation',
  agent: {
    name: 'quota-analyst',
    prompt: {
      role: 'Quota validation specialist',
      task: 'Validate quotas from bottom-up perspective',
      context: args,
      instructions: ['Calculate achievable quotas per rep', 'Validate against capacity', 'Identify gaps', 'Recommend adjustments']
    },
    outputSchema: { type: 'object', required: ['validation', 'artifacts'], properties: { validation: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'quota', 'bottom-up']
}));

export const quotaReconciliationTask = defineTask('quota-reconciliation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quota Reconciliation',
  agent: {
    name: 'quota-analyst',
    prompt: {
      role: 'Quota reconciliation specialist',
      task: 'Reconcile top-down and bottom-up quotas',
      context: args,
      instructions: ['Compare approaches', 'Reconcile differences', 'Finalize quotas', 'Document rationale']
    },
    outputSchema: { type: 'object', required: ['quotaPlan', 'allocations', 'artifacts'], properties: { quotaPlan: { type: 'object' }, allocations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'quota', 'reconciliation']
}));

export const fairnessAnalysisTask = defineTask('fairness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fairness Analysis',
  agent: {
    name: 'quota-analyst',
    prompt: {
      role: 'Quota fairness analyst',
      task: 'Analyze quota fairness across team',
      context: args,
      instructions: ['Calculate fairness metrics', 'Identify outliers', 'Assess equity', 'Score overall fairness']
    },
    outputSchema: { type: 'object', required: ['analysis', 'fairnessScore', 'artifacts'], properties: { analysis: { type: 'object' }, fairnessScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'quota', 'fairness']
}));

export const attainmentProjectionTask = defineTask('attainment-projection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Attainment Projection',
  agent: {
    name: 'quota-analyst',
    prompt: {
      role: 'Attainment projection specialist',
      task: 'Project quota attainment',
      context: args,
      instructions: ['Project attainment rates', 'Model scenarios', 'Identify risks', 'Create projections']
    },
    outputSchema: { type: 'object', required: ['projections', 'artifacts'], properties: { projections: { type: 'object' }, scenarios: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'quota', 'projection']
}));

/**
 * @process sales/territory-design-assignment
 * @description Data-driven methodology for carving territories, balancing opportunity distribution, and assigning territories to maximize coverage and productivity.
 * @inputs { salesTeam: array, marketData: object, accountList: array, constraints?: object, currentTerritories?: array }
 * @outputs { success: boolean, territoryPlan: object, assignments: array, coverageAnalysis: object, balanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/territory-design-assignment', {
 *   salesTeam: [{ name: 'Rep 1', experience: 'senior' }],
 *   marketData: { regions: ['West', 'East'], segments: ['Enterprise', 'Mid-Market'] },
 *   accountList: [{ name: 'Account 1', region: 'West', potential: 100000 }]
 * });
 *
 * @references
 * - Xactly Territory Planning: https://www.xactlycorp.com/
 * - Alexander Group Territory Design: https://www.alexandergroup.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    salesTeam = [],
    marketData = {},
    accountList = [],
    constraints = {},
    currentTerritories = [],
    designObjectives = ['balance', 'coverage', 'fairness'],
    outputDir = 'territory-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Territory Design and Assignment for ${salesTeam.length} reps`);

  // Phase 1: Market Analysis
  const marketAnalysis = await ctx.task(marketAnalysisTask, { marketData, accountList, outputDir });
  artifacts.push(...(marketAnalysis.artifacts || []));

  // Phase 2: Account Segmentation
  const accountSegmentation = await ctx.task(accountSegmentationTask, { accountList, marketAnalysis, outputDir });
  artifacts.push(...(accountSegmentation.artifacts || []));

  // Phase 3: Territory Carving
  const territoryCarving = await ctx.task(territoryCarvingTask, {
    marketAnalysis, accountSegmentation, salesTeam, constraints, designObjectives, outputDir
  });
  artifacts.push(...(territoryCarving.artifacts || []));

  // Phase 4: Balance Optimization
  const balanceOptimization = await ctx.task(balanceOptimizationTask, {
    territoryCarving, salesTeam, accountSegmentation, outputDir
  });
  artifacts.push(...(balanceOptimization.artifacts || []));

  // Phase 5: Rep Assignment
  const repAssignment = await ctx.task(repAssignmentTask, {
    balanceOptimization, salesTeam, constraints, outputDir
  });
  artifacts.push(...(repAssignment.artifacts || []));

  // Phase 6: Coverage Analysis
  const coverageAnalysis = await ctx.task(coverageAnalysisTask, {
    repAssignment, accountList, salesTeam, outputDir
  });
  artifacts.push(...(coverageAnalysis.artifacts || []));

  await ctx.breakpoint({
    question: `Territory design complete for ${salesTeam.length} reps. Balance score: ${balanceOptimization.balanceScore}. Review?`,
    title: 'Territory Design Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    territoryPlan: territoryCarving.territories,
    assignments: repAssignment.assignments,
    coverageAnalysis: coverageAnalysis.analysis,
    balanceMetrics: balanceOptimization.metrics,
    artifacts,
    metadata: { processId: 'sales/territory-design-assignment', timestamp: startTime }
  };
}

export const marketAnalysisTask = defineTask('market-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Market Analysis for Territory Design',
  agent: {
    name: 'territory-planner',
    prompt: {
      role: 'Territory planning analyst',
      task: 'Analyze market data to inform territory design',
      context: args,
      instructions: ['Analyze geographic distribution', 'Assess market potential by region', 'Identify concentration patterns', 'Calculate total addressable market', 'Identify growth areas']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, totalPotential: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'territory', 'market-analysis']
}));

export const accountSegmentationTask = defineTask('account-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Account Segmentation',
  agent: {
    name: 'territory-planner',
    prompt: {
      role: 'Account segmentation specialist',
      task: 'Segment accounts for territory assignment',
      context: args,
      instructions: ['Segment by size and potential', 'Classify by industry', 'Assign value tiers', 'Calculate account scores']
    },
    outputSchema: { type: 'object', required: ['segments', 'artifacts'], properties: { segments: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'territory', 'segmentation']
}));

export const territoryCarvingTask = defineTask('territory-carving', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Territory Carving',
  agent: {
    name: 'territory-planner',
    prompt: {
      role: 'Territory design specialist',
      task: 'Design territory boundaries',
      context: args,
      instructions: ['Define territory boundaries', 'Ensure logical groupings', 'Minimize travel', 'Balance workload potential']
    },
    outputSchema: { type: 'object', required: ['territories', 'artifacts'], properties: { territories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'territory', 'carving']
}));

export const balanceOptimizationTask = defineTask('balance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Balance Optimization',
  agent: {
    name: 'territory-planner',
    prompt: {
      role: 'Territory optimization specialist',
      task: 'Optimize territory balance',
      context: args,
      instructions: ['Calculate balance metrics', 'Identify imbalances', 'Recommend adjustments', 'Score final balance']
    },
    outputSchema: { type: 'object', required: ['metrics', 'balanceScore', 'artifacts'], properties: { metrics: { type: 'object' }, balanceScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'territory', 'optimization']
}));

export const repAssignmentTask = defineTask('rep-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rep Assignment',
  agent: {
    name: 'territory-planner',
    prompt: {
      role: 'Sales assignment specialist',
      task: 'Assign reps to territories',
      context: args,
      instructions: ['Match rep skills to territories', 'Consider experience levels', 'Respect constraints', 'Optimize for success']
    },
    outputSchema: { type: 'object', required: ['assignments', 'artifacts'], properties: { assignments: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'territory', 'assignment']
}));

export const coverageAnalysisTask = defineTask('coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coverage Analysis',
  agent: {
    name: 'territory-planner',
    prompt: {
      role: 'Coverage analyst',
      task: 'Analyze territory coverage',
      context: args,
      instructions: ['Calculate coverage ratios', 'Identify gaps', 'Assess capacity', 'Recommend improvements']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'territory', 'coverage']
}));

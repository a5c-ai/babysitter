/**
 * @process specializations/domains/business/logistics/dead-stock-management
 * @description Identification and disposition planning for slow-moving, obsolete, and excess inventory to optimize working capital.
 * @inputs { inventory: array, salesHistory: array, thresholds?: object, dispositionRules?: array }
 * @outputs { success: boolean, deadStockItems: array, dispositionPlan: array, recoveryValue: number, workingCapitalImpact: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/dead-stock-management', {
 *   inventory: [{ sku: 'SKU001', qty: 500, unitCost: 25, lastSaleDate: '2023-01-15' }],
 *   salesHistory: [{ sku: 'SKU001', monthlySales: [0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0] }],
 *   thresholds: { noSaleDays: 180, slowMovingDays: 90 }
 * });
 *
 * @references
 * - Inventory Management Essentials: https://www.amacombooks.org/book/essentials-of-inventory-management-third-edition/
 * - Working Capital Optimization: https://www.ascm.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventory = [],
    salesHistory = [],
    thresholds = {},
    dispositionRules = [],
    outputDir = 'dead-stock-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Dead Stock and Excess Inventory Management Process');
  ctx.log('info', `Inventory items: ${inventory.length}`);

  // PHASE 1: INVENTORY AGE ANALYSIS
  ctx.log('info', 'Phase 1: Analyzing inventory age');
  const ageAnalysis = await ctx.task(inventoryAgeAnalysisTask, { inventory, salesHistory, outputDir });
  artifacts.push(...ageAnalysis.artifacts);

  // PHASE 2: SLOW-MOVING IDENTIFICATION
  ctx.log('info', 'Phase 2: Identifying slow-moving inventory');
  const slowMovingIdentification = await ctx.task(slowMovingIdentificationTask, {
    inventory,
    salesHistory,
    thresholds,
    outputDir
  });
  artifacts.push(...slowMovingIdentification.artifacts);

  // PHASE 3: OBSOLETE INVENTORY IDENTIFICATION
  ctx.log('info', 'Phase 3: Identifying obsolete inventory');
  const obsoleteIdentification = await ctx.task(obsoleteIdentificationTask, {
    inventory,
    ageAnalysis: ageAnalysis.analysis,
    thresholds,
    outputDir
  });
  artifacts.push(...obsoleteIdentification.artifacts);

  // PHASE 4: EXCESS INVENTORY CALCULATION
  ctx.log('info', 'Phase 4: Calculating excess inventory');
  const excessCalculation = await ctx.task(excessInventoryTask, {
    inventory,
    salesHistory,
    thresholds,
    outputDir
  });
  artifacts.push(...excessCalculation.artifacts);

  // Quality Gate: Review dead stock summary
  const totalDeadStockValue = slowMovingIdentification.value + obsoleteIdentification.value + excessCalculation.value;
  await ctx.breakpoint({
    question: `Dead stock analysis complete. Total value: $${totalDeadStockValue}. Slow: $${slowMovingIdentification.value}, Obsolete: $${obsoleteIdentification.value}, Excess: $${excessCalculation.value}. Review?`,
    title: 'Dead Stock Summary Review',
    context: {
      runId: ctx.runId,
      summary: {
        slowMovingValue: slowMovingIdentification.value,
        obsoleteValue: obsoleteIdentification.value,
        excessValue: excessCalculation.value,
        totalValue: totalDeadStockValue
      },
      files: ageAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: ROOT CAUSE ANALYSIS
  ctx.log('info', 'Phase 5: Analyzing root causes');
  const rootCauseAnalysis = await ctx.task(deadStockRootCauseTask, {
    slowMoving: slowMovingIdentification.items,
    obsolete: obsoleteIdentification.items,
    excess: excessCalculation.items,
    outputDir
  });
  artifacts.push(...rootCauseAnalysis.artifacts);

  // PHASE 6: DISPOSITION STRATEGY DEVELOPMENT
  ctx.log('info', 'Phase 6: Developing disposition strategies');
  const dispositionStrategy = await ctx.task(dispositionStrategyTask, {
    deadStock: {
      slowMoving: slowMovingIdentification.items,
      obsolete: obsoleteIdentification.items,
      excess: excessCalculation.items
    },
    dispositionRules,
    outputDir
  });
  artifacts.push(...dispositionStrategy.artifacts);

  // PHASE 7: RECOVERY VALUE ESTIMATION
  ctx.log('info', 'Phase 7: Estimating recovery values');
  const recoveryEstimation = await ctx.task(recoveryValueTask, {
    dispositionPlan: dispositionStrategy.plan,
    outputDir
  });
  artifacts.push(...recoveryEstimation.artifacts);

  // PHASE 8: WORKING CAPITAL IMPACT ANALYSIS
  ctx.log('info', 'Phase 8: Analyzing working capital impact');
  const workingCapitalAnalysis = await ctx.task(workingCapitalTask, {
    deadStockValue: totalDeadStockValue,
    recoveryValue: recoveryEstimation.totalRecovery,
    inventory,
    outputDir
  });
  artifacts.push(...workingCapitalAnalysis.artifacts);

  // PHASE 9: PREVENTION RECOMMENDATIONS
  ctx.log('info', 'Phase 9: Generating prevention recommendations');
  const preventionRecommendations = await ctx.task(preventionTask, {
    rootCauseAnalysis,
    deadStockPatterns: ageAnalysis.patterns,
    outputDir
  });
  artifacts.push(...preventionRecommendations.artifacts);

  // PHASE 10: GENERATE MANAGEMENT REPORT
  ctx.log('info', 'Phase 10: Generating management report');
  const managementReport = await ctx.task(deadStockReportTask, {
    summary: {
      slowMoving: slowMovingIdentification,
      obsolete: obsoleteIdentification,
      excess: excessCalculation
    },
    dispositionPlan: dispositionStrategy.plan,
    recoveryEstimation,
    workingCapitalAnalysis,
    preventionRecommendations: preventionRecommendations.recommendations,
    outputDir
  });
  artifacts.push(...managementReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Dead stock management complete. Total at-risk: $${totalDeadStockValue}. Estimated recovery: $${recoveryEstimation.totalRecovery}. Approve disposition plan?`,
    title: 'Dead Stock Management Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalDeadStockValue: `$${totalDeadStockValue}`,
        estimatedRecovery: `$${recoveryEstimation.totalRecovery}`,
        recoveryRate: `${((recoveryEstimation.totalRecovery / totalDeadStockValue) * 100).toFixed(1)}%`,
        workingCapitalFreed: `$${workingCapitalAnalysis.capitalFreed}`
      },
      files: [{ path: managementReport.reportPath, format: 'markdown', label: 'Management Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    deadStockItems: [...slowMovingIdentification.items, ...obsoleteIdentification.items, ...excessCalculation.items],
    dispositionPlan: dispositionStrategy.plan,
    recoveryValue: recoveryEstimation.totalRecovery,
    workingCapitalImpact: workingCapitalAnalysis.impact,
    preventionRecommendations: preventionRecommendations.recommendations,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/dead-stock-management', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const inventoryAgeAnalysisTask = defineTask('inventory-age-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze inventory age',
  agent: {
    name: 'inventory-age-analyst',
    prompt: {
      role: 'Inventory Age Analysis Specialist',
      task: 'Analyze inventory age and movement patterns',
      context: args,
      instructions: ['Calculate days since last sale', 'Calculate days since receipt', 'Analyze age buckets', 'Identify aging trends', 'Calculate aging value', 'Generate age report']
    },
    outputSchema: { type: 'object', required: ['analysis', 'patterns', 'artifacts'], properties: { analysis: { type: 'array' }, patterns: { type: 'object' }, ageBuckets: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'age-analysis']
}));

export const slowMovingIdentificationTask = defineTask('slow-moving-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify slow-moving inventory',
  agent: {
    name: 'slow-moving-analyst',
    prompt: {
      role: 'Slow-Moving Inventory Specialist',
      task: 'Identify slow-moving inventory items',
      context: args,
      instructions: ['Apply slow-moving thresholds', 'Calculate velocity metrics', 'Identify declining items', 'Calculate slow-moving value', 'Rank by impact', 'Generate slow-moving report']
    },
    outputSchema: { type: 'object', required: ['items', 'value', 'artifacts'], properties: { items: { type: 'array' }, value: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'slow-moving']
}));

export const obsoleteIdentificationTask = defineTask('obsolete-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify obsolete inventory',
  agent: {
    name: 'obsolete-inventory-analyst',
    prompt: {
      role: 'Obsolete Inventory Specialist',
      task: 'Identify obsolete and dead inventory',
      context: args,
      instructions: ['Apply obsolete thresholds', 'Check product status', 'Identify discontinued items', 'Calculate obsolete value', 'Assess write-off requirements', 'Generate obsolete report']
    },
    outputSchema: { type: 'object', required: ['items', 'value', 'artifacts'], properties: { items: { type: 'array' }, value: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'obsolete']
}));

export const excessInventoryTask = defineTask('excess-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate excess inventory',
  agent: {
    name: 'excess-inventory-analyst',
    prompt: {
      role: 'Excess Inventory Specialist',
      task: 'Calculate excess inventory above requirements',
      context: args,
      instructions: ['Calculate forecast requirements', 'Determine excess quantity', 'Calculate excess value', 'Identify over-stocked items', 'Rank by excess value', 'Generate excess report']
    },
    outputSchema: { type: 'object', required: ['items', 'value', 'artifacts'], properties: { items: { type: 'array' }, value: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'excess']
}));

export const deadStockRootCauseTask = defineTask('dead-stock-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze root causes',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Dead Stock Root Cause Analyst',
      task: 'Identify root causes of dead stock accumulation',
      context: args,
      instructions: ['Analyze purchasing patterns', 'Review forecast accuracy', 'Check product lifecycle', 'Identify demand shifts', 'Categorize causes', 'Generate root cause report']
    },
    outputSchema: { type: 'object', required: ['rootCauses', 'artifacts'], properties: { rootCauses: { type: 'array' }, causeDistribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'root-cause']
}));

export const dispositionStrategyTask = defineTask('disposition-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop disposition strategies',
  agent: {
    name: 'disposition-strategist',
    prompt: {
      role: 'Disposition Strategy Specialist',
      task: 'Develop disposition strategies for dead stock',
      context: args,
      instructions: ['Evaluate disposition options', 'Consider liquidation channels', 'Assess donation opportunities', 'Plan markdown strategies', 'Schedule disposal if needed', 'Generate disposition plan']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'array' }, dispositionByMethod: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'disposition']
}));

export const recoveryValueTask = defineTask('recovery-value', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate recovery values',
  agent: {
    name: 'recovery-value-analyst',
    prompt: {
      role: 'Recovery Value Specialist',
      task: 'Estimate recovery values for disposition plan',
      context: args,
      instructions: ['Estimate liquidation values', 'Calculate markdown recovery', 'Value donation tax benefits', 'Calculate scrap values', 'Sum total recovery', 'Generate recovery report']
    },
    outputSchema: { type: 'object', required: ['totalRecovery', 'artifacts'], properties: { totalRecovery: { type: 'number' }, recoveryByMethod: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'recovery']
}));

export const workingCapitalTask = defineTask('working-capital', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze working capital impact',
  agent: {
    name: 'working-capital-analyst',
    prompt: {
      role: 'Working Capital Analyst',
      task: 'Analyze working capital impact of dead stock',
      context: args,
      instructions: ['Calculate capital tied up', 'Estimate holding costs', 'Calculate opportunity cost', 'Project capital freed', 'Calculate inventory turns impact', 'Generate working capital report']
    },
    outputSchema: { type: 'object', required: ['impact', 'capitalFreed', 'artifacts'], properties: { impact: { type: 'object' }, capitalFreed: { type: 'number' }, holdingCosts: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'working-capital']
}));

export const preventionTask = defineTask('prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate prevention recommendations',
  agent: {
    name: 'prevention-specialist',
    prompt: {
      role: 'Dead Stock Prevention Specialist',
      task: 'Generate recommendations to prevent future dead stock',
      context: args,
      instructions: ['Recommend process improvements', 'Suggest inventory policies', 'Improve forecasting', 'Enhance lifecycle management', 'Define monitoring KPIs', 'Generate prevention plan']
    },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, processImprovements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'prevention']
}));

export const deadStockReportTask = defineTask('dead-stock-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate management report',
  agent: {
    name: 'dead-stock-report-specialist',
    prompt: {
      role: 'Dead Stock Report Specialist',
      task: 'Generate comprehensive dead stock management report',
      context: args,
      instructions: ['Summarize dead stock analysis', 'Present disposition plan', 'Document recovery estimates', 'Include working capital impact', 'Present prevention recommendations', 'Generate executive report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'dead-stock', 'reporting']
}));

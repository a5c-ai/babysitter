/**
 * @process specializations/domains/business/logistics/reorder-point-calculation
 * @description Dynamic safety stock and reorder point optimization based on demand variability, lead time analysis, and service level targets.
 * @inputs { inventory: array, demandHistory: array, leadTimeData: array, serviceLevelTargets?: object }
 * @outputs { success: boolean, reorderPoints: array, safetyStocks: array, orderQuantities: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/reorder-point-calculation', {
 *   inventory: [{ sku: 'SKU001', currentStock: 500, unitCost: 25 }],
 *   demandHistory: [{ sku: 'SKU001', dailyDemand: [50, 48, 52, 55, 45, 51, 49] }],
 *   leadTimeData: [{ sku: 'SKU001', avgLeadTime: 7, leadTimeStdDev: 1.5 }],
 *   serviceLevelTargets: { default: 0.95 }
 * });
 *
 * @references
 * - DDMRP: https://www.amazon.com/Demand-Driven-Material-Requirements-Planning-DDMRP/dp/0831136286
 * - Inventory Optimization: https://www.apics.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventory = [],
    demandHistory = [],
    leadTimeData = [],
    serviceLevelTargets = {},
    outputDir = 'reorder-point-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Reorder Point Calculation Process');
  ctx.log('info', `Inventory items: ${inventory.length}`);

  // PHASE 1: DEMAND ANALYSIS
  ctx.log('info', 'Phase 1: Analyzing demand patterns');
  const demandAnalysis = await ctx.task(demandAnalysisTask, { demandHistory, outputDir });
  artifacts.push(...demandAnalysis.artifacts);

  // PHASE 2: LEAD TIME ANALYSIS
  ctx.log('info', 'Phase 2: Analyzing lead times');
  const leadTimeAnalysis = await ctx.task(leadTimeAnalysisTask, { leadTimeData, outputDir });
  artifacts.push(...leadTimeAnalysis.artifacts);

  // PHASE 3: SERVICE LEVEL DETERMINATION
  ctx.log('info', 'Phase 3: Determining service levels');
  const serviceLevelDetermination = await ctx.task(serviceLevelTask, {
    inventory,
    serviceLevelTargets,
    outputDir
  });
  artifacts.push(...serviceLevelDetermination.artifacts);

  // PHASE 4: SAFETY STOCK CALCULATION
  ctx.log('info', 'Phase 4: Calculating safety stocks');
  const safetyStockCalc = await ctx.task(safetyStockCalculationTask, {
    demandAnalysis: demandAnalysis.statistics,
    leadTimeAnalysis: leadTimeAnalysis.statistics,
    serviceLevels: serviceLevelDetermination.levels,
    outputDir
  });
  artifacts.push(...safetyStockCalc.artifacts);

  // PHASE 5: REORDER POINT CALCULATION
  ctx.log('info', 'Phase 5: Calculating reorder points');
  const reorderPointCalc = await ctx.task(reorderPointCalculationTask, {
    demandAnalysis: demandAnalysis.statistics,
    leadTimeAnalysis: leadTimeAnalysis.statistics,
    safetyStocks: safetyStockCalc.safetyStocks,
    outputDir
  });
  artifacts.push(...reorderPointCalc.artifacts);

  // Quality Gate: Review reorder points
  await ctx.breakpoint({
    question: `Reorder points calculated for ${reorderPointCalc.reorderPoints.length} items. Average safety stock days: ${safetyStockCalc.averageSafetyDays}. Review before EOQ calculation?`,
    title: 'Reorder Point Review',
    context: {
      runId: ctx.runId,
      summary: {
        itemsCalculated: reorderPointCalc.reorderPoints.length,
        averageSafetyDays: safetyStockCalc.averageSafetyDays,
        totalSafetyStockValue: safetyStockCalc.totalValue
      },
      files: reorderPointCalc.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 6: ECONOMIC ORDER QUANTITY
  ctx.log('info', 'Phase 6: Calculating economic order quantities');
  const eoqCalc = await ctx.task(eoqCalculationTask, {
    inventory,
    demandAnalysis: demandAnalysis.statistics,
    orderingCosts: inputs.orderingCosts,
    holdingCostRate: inputs.holdingCostRate,
    outputDir
  });
  artifacts.push(...eoqCalc.artifacts);

  // PHASE 7: OPTIMIZATION RECOMMENDATIONS
  ctx.log('info', 'Phase 7: Generating optimization recommendations');
  const optimizationRecommendations = await ctx.task(optimizationRecommendationTask, {
    reorderPoints: reorderPointCalc.reorderPoints,
    safetyStocks: safetyStockCalc.safetyStocks,
    eoqs: eoqCalc.orderQuantities,
    inventory,
    outputDir
  });
  artifacts.push(...optimizationRecommendations.artifacts);

  // PHASE 8: GENERATE REPORT
  ctx.log('info', 'Phase 8: Generating analysis report');
  const analysisReport = await ctx.task(reorderReportTask, {
    reorderPoints: reorderPointCalc.reorderPoints,
    safetyStocks: safetyStockCalc.safetyStocks,
    eoqs: eoqCalc.orderQuantities,
    recommendations: optimizationRecommendations.recommendations,
    outputDir
  });
  artifacts.push(...analysisReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Reorder point calculation complete. ${reorderPointCalc.reorderPoints.length} items analyzed. Total inventory investment optimization: ${optimizationRecommendations.investmentChange}%. Approve?`,
    title: 'Reorder Point Calculation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        itemsAnalyzed: inventory.length,
        totalSafetyStockValue: `$${safetyStockCalc.totalValue}`,
        investmentChange: `${optimizationRecommendations.investmentChange}%`,
        stockoutRiskReduction: `${optimizationRecommendations.stockoutRiskReduction}%`
      },
      files: [{ path: analysisReport.reportPath, format: 'markdown', label: 'Analysis Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    reorderPoints: reorderPointCalc.reorderPoints,
    safetyStocks: safetyStockCalc.safetyStocks,
    orderQuantities: eoqCalc.orderQuantities,
    recommendations: optimizationRecommendations.recommendations,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/reorder-point-calculation', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const demandAnalysisTask = defineTask('demand-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze demand patterns',
  agent: {
    name: 'demand-analyst',
    prompt: {
      role: 'Demand Analysis Specialist',
      task: 'Analyze historical demand patterns and variability',
      context: args,
      instructions: ['Calculate average demand', 'Calculate demand standard deviation', 'Identify seasonality', 'Detect trends', 'Calculate coefficient of variation', 'Generate demand statistics']
    },
    outputSchema: { type: 'object', required: ['statistics', 'artifacts'], properties: { statistics: { type: 'array' }, seasonalPatterns: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'demand-analysis']
}));

export const leadTimeAnalysisTask = defineTask('lead-time-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze lead times',
  agent: {
    name: 'lead-time-analyst',
    prompt: {
      role: 'Lead Time Analysis Specialist',
      task: 'Analyze supplier lead times and variability',
      context: args,
      instructions: ['Calculate average lead time', 'Calculate lead time standard deviation', 'Identify lead time trends', 'Analyze by supplier', 'Flag unreliable suppliers', 'Generate lead time statistics']
    },
    outputSchema: { type: 'object', required: ['statistics', 'artifacts'], properties: { statistics: { type: 'array' }, supplierAnalysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'lead-time']
}));

export const serviceLevelTask = defineTask('service-level', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine service levels',
  agent: {
    name: 'service-level-specialist',
    prompt: {
      role: 'Service Level Specialist',
      task: 'Determine appropriate service levels by item',
      context: args,
      instructions: ['Apply service level targets', 'Consider item criticality', 'Factor in customer requirements', 'Balance cost vs service', 'Calculate z-scores', 'Generate service level assignments']
    },
    outputSchema: { type: 'object', required: ['levels', 'artifacts'], properties: { levels: { type: 'array' }, serviceLevelMatrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'service-level']
}));

export const safetyStockCalculationTask = defineTask('safety-stock-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate safety stocks',
  agent: {
    name: 'safety-stock-calculator',
    prompt: {
      role: 'Safety Stock Calculation Specialist',
      task: 'Calculate optimal safety stock levels',
      context: args,
      instructions: ['Apply safety stock formulas', 'Consider demand variability', 'Factor in lead time variability', 'Apply service level factors', 'Calculate in units and days', 'Generate safety stock report']
    },
    outputSchema: { type: 'object', required: ['safetyStocks', 'averageSafetyDays', 'totalValue', 'artifacts'], properties: { safetyStocks: { type: 'array' }, averageSafetyDays: { type: 'number' }, totalValue: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'safety-stock']
}));

export const reorderPointCalculationTask = defineTask('reorder-point-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate reorder points',
  agent: {
    name: 'reorder-point-calculator',
    prompt: {
      role: 'Reorder Point Calculation Specialist',
      task: 'Calculate optimal reorder points',
      context: args,
      instructions: ['Calculate demand during lead time', 'Add safety stock', 'Calculate reorder point', 'Express in units and days', 'Identify items below ROP', 'Generate reorder point report']
    },
    outputSchema: { type: 'object', required: ['reorderPoints', 'artifacts'], properties: { reorderPoints: { type: 'array' }, itemsBelowROP: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'calculation']
}));

export const eoqCalculationTask = defineTask('eoq-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate economic order quantities',
  agent: {
    name: 'eoq-calculator',
    prompt: {
      role: 'EOQ Calculation Specialist',
      task: 'Calculate economic order quantities',
      context: args,
      instructions: ['Apply EOQ formula', 'Consider ordering costs', 'Factor in holding costs', 'Adjust for min/max constraints', 'Calculate total cost', 'Generate EOQ report']
    },
    outputSchema: { type: 'object', required: ['orderQuantities', 'artifacts'], properties: { orderQuantities: { type: 'array' }, totalAnnualCost: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'eoq']
}));

export const optimizationRecommendationTask = defineTask('optimization-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate optimization recommendations',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'Inventory Optimization Specialist',
      task: 'Generate inventory optimization recommendations',
      context: args,
      instructions: ['Compare current vs optimal', 'Identify improvement opportunities', 'Calculate investment impact', 'Estimate stockout risk reduction', 'Prioritize recommendations', 'Generate action plan']
    },
    outputSchema: { type: 'object', required: ['recommendations', 'investmentChange', 'stockoutRiskReduction', 'artifacts'], properties: { recommendations: { type: 'array' }, investmentChange: { type: 'number' }, stockoutRiskReduction: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'optimization']
}));

export const reorderReportTask = defineTask('reorder-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate analysis report',
  agent: {
    name: 'reorder-report-specialist',
    prompt: {
      role: 'Reorder Analysis Report Specialist',
      task: 'Generate comprehensive reorder point analysis report',
      context: args,
      instructions: ['Summarize calculations', 'Present safety stock analysis', 'Document EOQ recommendations', 'Include implementation guidance', 'Add visualizations', 'Generate executive report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'reorder-point', 'reporting']
}));

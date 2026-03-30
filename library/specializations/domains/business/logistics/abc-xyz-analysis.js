/**
 * @process specializations/domains/business/logistics/abc-xyz-analysis
 * @description Multi-dimensional inventory classification combining value (ABC) and demand variability (XYZ) to set differentiated inventory policies and management strategies.
 * @inputs { inventory: array, salesHistory: array, analysisParameters?: object }
 * @outputs { success: boolean, classifications: array, policyRecommendations: array, inventoryStrategies: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/abc-xyz-analysis', {
 *   inventory: [{ sku: 'SKU001', unitCost: 50, annualUsage: 1000 }],
 *   salesHistory: [{ sku: 'SKU001', monthlySales: [100, 95, 105, 98, 102, 99, 101, 97, 103, 98, 100, 102] }],
 *   analysisParameters: { abcThresholds: { a: 0.8, b: 0.15, c: 0.05 } }
 * });
 *
 * @references
 * - SCOR Model: https://www.ascm.org/corporate-transformation/standards/scor/
 * - Inventory Classification: https://www.apics.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventory = [],
    salesHistory = [],
    analysisParameters = {},
    outputDir = 'abc-xyz-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting ABC-XYZ Analysis Process');
  ctx.log('info', `Inventory items: ${inventory.length}`);

  // PHASE 1: DATA PREPARATION AND VALIDATION
  ctx.log('info', 'Phase 1: Preparing and validating data');
  const dataPrep = await ctx.task(dataPreparationTask, { inventory, salesHistory, outputDir });
  artifacts.push(...dataPrep.artifacts);

  // PHASE 2: ABC CLASSIFICATION (VALUE ANALYSIS)
  ctx.log('info', 'Phase 2: Performing ABC classification');
  const abcClassification = await ctx.task(abcClassificationTask, {
    preparedData: dataPrep.preparedData,
    thresholds: analysisParameters.abcThresholds,
    outputDir
  });
  artifacts.push(...abcClassification.artifacts);

  // PHASE 3: XYZ CLASSIFICATION (DEMAND VARIABILITY)
  ctx.log('info', 'Phase 3: Performing XYZ classification');
  const xyzClassification = await ctx.task(xyzClassificationTask, {
    preparedData: dataPrep.preparedData,
    thresholds: analysisParameters.xyzThresholds,
    outputDir
  });
  artifacts.push(...xyzClassification.artifacts);

  // PHASE 4: MATRIX COMBINATION
  ctx.log('info', 'Phase 4: Combining ABC-XYZ matrix');
  const matrixCombination = await ctx.task(matrixCombinationTask, {
    abcClassification: abcClassification.classifications,
    xyzClassification: xyzClassification.classifications,
    outputDir
  });
  artifacts.push(...matrixCombination.artifacts);

  // Quality Gate: Review classification results
  await ctx.breakpoint({
    question: `ABC-XYZ classification complete for ${inventory.length} items. Review distribution before policy recommendations?`,
    title: 'Classification Review',
    context: {
      runId: ctx.runId,
      distribution: matrixCombination.distribution,
      files: matrixCombination.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: INVENTORY POLICY RECOMMENDATIONS
  ctx.log('info', 'Phase 5: Generating policy recommendations');
  const policyRecommendations = await ctx.task(policyRecommendationTask, {
    combinedClassifications: matrixCombination.classifications,
    analysisParameters,
    outputDir
  });
  artifacts.push(...policyRecommendations.artifacts);

  // PHASE 6: SERVICE LEVEL STRATEGY
  ctx.log('info', 'Phase 6: Defining service level strategies');
  const serviceLevelStrategy = await ctx.task(serviceLevelStrategyTask, {
    classifications: matrixCombination.classifications,
    outputDir
  });
  artifacts.push(...serviceLevelStrategy.artifacts);

  // PHASE 7: REPLENISHMENT STRATEGY
  ctx.log('info', 'Phase 7: Defining replenishment strategies');
  const replenishmentStrategy = await ctx.task(replenishmentStrategyTask, {
    classifications: matrixCombination.classifications,
    policyRecommendations: policyRecommendations.policies,
    outputDir
  });
  artifacts.push(...replenishmentStrategy.artifacts);

  // PHASE 8: GENERATE ANALYSIS REPORT
  ctx.log('info', 'Phase 8: Generating analysis report');
  const analysisReport = await ctx.task(analysisReportTask, {
    abcClassification,
    xyzClassification,
    matrixCombination,
    policyRecommendations: policyRecommendations.policies,
    serviceLevelStrategy: serviceLevelStrategy.strategies,
    replenishmentStrategy: replenishmentStrategy.strategies,
    outputDir
  });
  artifacts.push(...analysisReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `ABC-XYZ analysis complete. ${matrixCombination.classifications.length} items classified. Review and approve policy recommendations?`,
    title: 'ABC-XYZ Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalItems: matrixCombination.classifications.length,
        abcDistribution: abcClassification.distribution,
        xyzDistribution: xyzClassification.distribution,
        axItems: matrixCombination.distribution.AX,
        czItems: matrixCombination.distribution.CZ
      },
      files: [{ path: analysisReport.reportPath, format: 'markdown', label: 'Analysis Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    classifications: matrixCombination.classifications,
    policyRecommendations: policyRecommendations.policies,
    inventoryStrategies: {
      serviceLevels: serviceLevelStrategy.strategies,
      replenishment: replenishmentStrategy.strategies
    },
    distribution: matrixCombination.distribution,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/abc-xyz-analysis', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const dataPreparationTask = defineTask('data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare and validate data',
  agent: {
    name: 'data-preparation-specialist',
    prompt: {
      role: 'Data Preparation Specialist',
      task: 'Prepare inventory and sales data for ABC-XYZ analysis',
      context: args,
      instructions: ['Validate data completeness', 'Calculate annual usage value', 'Calculate demand statistics', 'Handle missing data', 'Normalize data formats', 'Generate prepared dataset']
    },
    outputSchema: { type: 'object', required: ['preparedData', 'artifacts'], properties: { preparedData: { type: 'array' }, dataQuality: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'data-preparation']
}));

export const abcClassificationTask = defineTask('abc-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform ABC classification',
  agent: {
    name: 'abc-classification-specialist',
    prompt: {
      role: 'ABC Classification Specialist',
      task: 'Classify inventory by annual usage value (ABC analysis)',
      context: args,
      instructions: ['Calculate annual usage value', 'Sort by cumulative value', 'Apply Pareto principle', 'Assign A/B/C classes', 'Calculate class statistics', 'Generate ABC report']
    },
    outputSchema: { type: 'object', required: ['classifications', 'distribution', 'artifacts'], properties: { classifications: { type: 'array' }, distribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'abc-classification']
}));

export const xyzClassificationTask = defineTask('xyz-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform XYZ classification',
  agent: {
    name: 'xyz-classification-specialist',
    prompt: {
      role: 'XYZ Classification Specialist',
      task: 'Classify inventory by demand variability (XYZ analysis)',
      context: args,
      instructions: ['Calculate coefficient of variation', 'Analyze demand patterns', 'Assign X/Y/Z classes', 'Identify seasonal items', 'Calculate class statistics', 'Generate XYZ report']
    },
    outputSchema: { type: 'object', required: ['classifications', 'distribution', 'artifacts'], properties: { classifications: { type: 'array' }, distribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'xyz-classification']
}));

export const matrixCombinationTask = defineTask('matrix-combination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Combine ABC-XYZ matrix',
  agent: {
    name: 'matrix-combination-specialist',
    prompt: {
      role: 'Matrix Combination Specialist',
      task: 'Combine ABC and XYZ classifications into 9-segment matrix',
      context: args,
      instructions: ['Merge ABC and XYZ results', 'Create 9-segment matrix', 'Calculate segment statistics', 'Identify strategic segments', 'Generate matrix visualization', 'Document segment characteristics']
    },
    outputSchema: { type: 'object', required: ['classifications', 'distribution', 'artifacts'], properties: { classifications: { type: 'array' }, distribution: { type: 'object' }, matrixVisualization: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'matrix']
}));

export const policyRecommendationTask = defineTask('policy-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate policy recommendations',
  agent: {
    name: 'policy-recommendation-specialist',
    prompt: {
      role: 'Inventory Policy Specialist',
      task: 'Generate inventory policies for each ABC-XYZ segment',
      context: args,
      instructions: ['Define safety stock policies', 'Set reorder point strategies', 'Define review frequencies', 'Recommend order quantities', 'Set service level targets', 'Generate policy matrix']
    },
    outputSchema: { type: 'object', required: ['policies', 'artifacts'], properties: { policies: { type: 'array' }, policyMatrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'policy']
}));

export const serviceLevelStrategyTask = defineTask('service-level-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define service level strategies',
  agent: {
    name: 'service-level-strategist',
    prompt: {
      role: 'Service Level Strategist',
      task: 'Define differentiated service level strategies by segment',
      context: args,
      instructions: ['Set target fill rates', 'Define cycle service levels', 'Balance cost vs service', 'Consider customer impact', 'Set monitoring thresholds', 'Generate strategy document']
    },
    outputSchema: { type: 'object', required: ['strategies', 'artifacts'], properties: { strategies: { type: 'object' }, serviceMatrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'service-level']
}));

export const replenishmentStrategyTask = defineTask('replenishment-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define replenishment strategies',
  agent: {
    name: 'replenishment-strategist',
    prompt: {
      role: 'Replenishment Strategist',
      task: 'Define replenishment strategies by ABC-XYZ segment',
      context: args,
      instructions: ['Define reorder methods', 'Set review periods', 'Calculate safety stocks', 'Define lot sizing rules', 'Consider lead time variability', 'Generate strategy matrix']
    },
    outputSchema: { type: 'object', required: ['strategies', 'artifacts'], properties: { strategies: { type: 'object' }, replenishmentMatrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'replenishment']
}));

export const analysisReportTask = defineTask('analysis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate analysis report',
  agent: {
    name: 'analysis-report-specialist',
    prompt: {
      role: 'Analysis Report Specialist',
      task: 'Generate comprehensive ABC-XYZ analysis report',
      context: args,
      instructions: ['Summarize classification results', 'Present matrix distribution', 'Document policy recommendations', 'Include implementation guidance', 'Add visualizations', 'Generate executive report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'abc-xyz', 'reporting']
}));

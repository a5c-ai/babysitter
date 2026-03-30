/**
 * @process specializations/domains/business/supply-chain/inventory-optimization
 * @description Inventory Optimization and Segmentation - Analyze inventory using ABC/XYZ classification,
 * optimize stocking levels by segment, and identify slow-moving/obsolete inventory for disposition.
 * @inputs { inventoryData?: object, demandData?: object, serviceLevelTargets?: object }
 * @outputs { success: boolean, segmentation: object, stockingPolicies: object, disposition: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/inventory-optimization', {
 *   inventoryData: { items: [...], warehouses: [...] },
 *   demandData: { historical: [...], forecast: [...] },
 *   serviceLevelTargets: { fillRate: 0.98, stockoutRate: 0.02 }
 * });
 *
 * @references
 * - Demand Driven Institute: https://www.demanddriveninstitute.com/books
 * - ASCM CPIM: https://www.ascm.org/learning-development/certifications-credentials/cpim/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventoryData = {},
    demandData = {},
    serviceLevelTargets = {},
    costParameters = {},
    classificationMethod = 'ABC-XYZ',
    outputDir = 'inventory-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Inventory Optimization and Segmentation Process');

  // ============================================================================
  // PHASE 1: INVENTORY DATA ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing inventory data');

  const inventoryAnalysis = await ctx.task(inventoryDataAnalysisTask, {
    inventoryData,
    demandData,
    outputDir
  });

  artifacts.push(...inventoryAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: ABC CLASSIFICATION (VALUE)
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing ABC classification');

  const abcClassification = await ctx.task(abcClassificationTask, {
    inventoryData,
    inventoryAnalysis,
    outputDir
  });

  artifacts.push(...abcClassification.artifacts);

  // ============================================================================
  // PHASE 3: XYZ CLASSIFICATION (VARIABILITY)
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing XYZ classification');

  const xyzClassification = await ctx.task(xyzClassificationTask, {
    inventoryData,
    demandData,
    outputDir
  });

  artifacts.push(...xyzClassification.artifacts);

  // ============================================================================
  // PHASE 4: SEGMENTATION MATRIX
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating segmentation matrix');

  const segmentationMatrix = await ctx.task(segmentationMatrixTask, {
    abcClassification,
    xyzClassification,
    outputDir
  });

  artifacts.push(...segmentationMatrix.artifacts);

  // Breakpoint: Review segmentation
  await ctx.breakpoint({
    question: `Inventory segmentation complete. ${segmentationMatrix.segmentCount} segments identified. A items: ${segmentationMatrix.aItemCount}. Review segmentation before policy development?`,
    title: 'Inventory Segmentation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        segmentCount: segmentationMatrix.segmentCount,
        aItemCount: segmentationMatrix.aItemCount,
        distribution: segmentationMatrix.distribution
      }
    }
  });

  // ============================================================================
  // PHASE 5: STOCKING POLICY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing stocking policies by segment');

  const stockingPolicies = await ctx.task(stockingPolicyTask, {
    segmentationMatrix,
    serviceLevelTargets,
    costParameters,
    outputDir
  });

  artifacts.push(...stockingPolicies.artifacts);

  // ============================================================================
  // PHASE 6: SLOW-MOVING/OBSOLETE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying slow-moving and obsolete inventory');

  const slowMovingAnalysis = await ctx.task(slowMovingAnalysisTask, {
    inventoryData,
    demandData,
    inventoryAnalysis,
    outputDir
  });

  artifacts.push(...slowMovingAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: DISPOSITION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning inventory disposition');

  const dispositionPlan = await ctx.task(dispositionPlanTask, {
    slowMovingAnalysis,
    costParameters,
    outputDir
  });

  artifacts.push(...dispositionPlan.artifacts);

  // ============================================================================
  // PHASE 8: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating optimization recommendations');

  const recommendations = await ctx.task(optimizationRecommendationsTask, {
    inventoryAnalysis,
    segmentationMatrix,
    stockingPolicies,
    slowMovingAnalysis,
    dispositionPlan,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    segmentation: {
      method: classificationMethod,
      matrix: segmentationMatrix.matrix,
      distribution: segmentationMatrix.distribution,
      segmentCount: segmentationMatrix.segmentCount
    },
    stockingPolicies: {
      bySegment: stockingPolicies.policiesBySegment,
      reorderPoints: stockingPolicies.reorderPoints,
      safetyStockLevels: stockingPolicies.safetyStockLevels
    },
    slowMovingInventory: {
      itemCount: slowMovingAnalysis.slowMovingCount,
      totalValue: slowMovingAnalysis.slowMovingValue,
      obsoleteItems: slowMovingAnalysis.obsoleteCount
    },
    disposition: dispositionPlan.recommendations,
    recommendations: recommendations.actionItems,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/inventory-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const inventoryDataAnalysisTask = defineTask('inventory-data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Inventory Data Analysis',
  agent: {
    name: 'inventory-analyst',
    prompt: {
      role: 'Inventory Analyst',
      task: 'Analyze inventory data for optimization',
      context: args,
      instructions: [
        '1. Profile inventory data by SKU',
        '2. Calculate inventory turns by item',
        '3. Analyze days of inventory on hand',
        '4. Calculate inventory carrying costs',
        '5. Assess inventory health metrics',
        '6. Identify data quality issues',
        '7. Calculate inventory value distribution',
        '8. Document inventory insights'
      ],
      outputFormat: 'JSON with inventory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalItems', 'totalValue', 'artifacts'],
      properties: {
        totalItems: { type: 'number' },
        totalValue: { type: 'number' },
        averageTurns: { type: 'number' },
        averageDaysOnHand: { type: 'number' },
        carryingCosts: { type: 'number' },
        healthMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'analysis']
}));

export const abcClassificationTask = defineTask('abc-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: ABC Classification',
  agent: {
    name: 'classification-analyst',
    prompt: {
      role: 'Inventory Classification Specialist',
      task: 'Perform ABC classification based on value',
      context: args,
      instructions: [
        '1. Rank items by annual value (quantity x cost)',
        '2. Calculate cumulative percentage of value',
        '3. Classify A items (top 80% value, ~20% items)',
        '4. Classify B items (next 15% value, ~30% items)',
        '5. Classify C items (remaining 5% value, ~50% items)',
        '6. Validate classification thresholds',
        '7. Generate ABC distribution report',
        '8. Visualize classification'
      ],
      outputFormat: 'JSON with ABC classification'
    },
    outputSchema: {
      type: 'object',
      required: ['classification', 'distribution', 'artifacts'],
      properties: {
        classification: { type: 'object' },
        distribution: { type: 'object' },
        aItemCount: { type: 'number' },
        bItemCount: { type: 'number' },
        cItemCount: { type: 'number' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'abc-classification']
}));

export const xyzClassificationTask = defineTask('xyz-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: XYZ Classification',
  agent: {
    name: 'demand-variability-analyst',
    prompt: {
      role: 'Demand Variability Analyst',
      task: 'Perform XYZ classification based on demand variability',
      context: args,
      instructions: [
        '1. Calculate coefficient of variation (CV) for each item',
        '2. Classify X items (low variability, CV < 0.5)',
        '3. Classify Y items (medium variability, CV 0.5-1.0)',
        '4. Classify Z items (high variability, CV > 1.0)',
        '5. Validate classification thresholds',
        '6. Identify intermittent demand items',
        '7. Generate XYZ distribution report',
        '8. Document variability insights'
      ],
      outputFormat: 'JSON with XYZ classification'
    },
    outputSchema: {
      type: 'object',
      required: ['classification', 'distribution', 'artifacts'],
      properties: {
        classification: { type: 'object' },
        distribution: { type: 'object' },
        xItemCount: { type: 'number' },
        yItemCount: { type: 'number' },
        zItemCount: { type: 'number' },
        intermittentItems: { type: 'array' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'xyz-classification']
}));

export const segmentationMatrixTask = defineTask('segmentation-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Segmentation Matrix',
  agent: {
    name: 'segmentation-analyst',
    prompt: {
      role: 'Inventory Segmentation Specialist',
      task: 'Create combined ABC-XYZ segmentation matrix',
      context: args,
      instructions: [
        '1. Combine ABC and XYZ classifications',
        '2. Create 9-cell segmentation matrix (AX, AY, AZ, etc.)',
        '3. Assign each item to matrix segment',
        '4. Calculate segment statistics',
        '5. Analyze segment characteristics',
        '6. Define segment management approaches',
        '7. Visualize segmentation matrix',
        '8. Document segmentation findings'
      ],
      outputFormat: 'JSON with segmentation matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'distribution', 'segmentCount', 'artifacts'],
      properties: {
        matrix: { type: 'object' },
        distribution: { type: 'object' },
        segmentCount: { type: 'number' },
        aItemCount: { type: 'number' },
        segmentCharacteristics: { type: 'object' },
        managementApproaches: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'segmentation']
}));

export const stockingPolicyTask = defineTask('stocking-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Stocking Policy Development',
  agent: {
    name: 'policy-developer',
    prompt: {
      role: 'Inventory Policy Specialist',
      task: 'Develop stocking policies by segment',
      context: args,
      instructions: [
        '1. Define service level targets by segment',
        '2. Calculate reorder points per segment',
        '3. Calculate safety stock levels',
        '4. Define order quantities (EOQ, etc.)',
        '5. Set review frequencies',
        '6. Define replenishment methods',
        '7. Calculate policy cost impact',
        '8. Document stocking policies'
      ],
      outputFormat: 'JSON with stocking policies'
    },
    outputSchema: {
      type: 'object',
      required: ['policiesBySegment', 'reorderPoints', 'safetyStockLevels', 'artifacts'],
      properties: {
        policiesBySegment: { type: 'object' },
        reorderPoints: { type: 'object' },
        safetyStockLevels: { type: 'object' },
        orderQuantities: { type: 'object' },
        reviewFrequencies: { type: 'object' },
        costImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'stocking-policy']
}));

export const slowMovingAnalysisTask = defineTask('slow-moving-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Slow-Moving/Obsolete Analysis',
  agent: {
    name: 'obsolete-inventory-analyst',
    prompt: {
      role: 'Slow-Moving Inventory Analyst',
      task: 'Identify slow-moving and obsolete inventory',
      context: args,
      instructions: [
        '1. Define slow-moving criteria (no demand > X months)',
        '2. Define obsolete criteria (no demand > Y months)',
        '3. Identify slow-moving items',
        '4. Identify obsolete items',
        '5. Calculate write-off risk exposure',
        '6. Analyze root causes of obsolescence',
        '7. Categorize by disposition potential',
        '8. Document findings'
      ],
      outputFormat: 'JSON with slow-moving analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['slowMovingCount', 'slowMovingValue', 'obsoleteCount', 'artifacts'],
      properties: {
        slowMovingCount: { type: 'number' },
        slowMovingValue: { type: 'number' },
        obsoleteCount: { type: 'number' },
        obsoleteValue: { type: 'number' },
        writeOffRisk: { type: 'number' },
        rootCauses: { type: 'array' },
        dispositionCategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'slow-moving']
}));

export const dispositionPlanTask = defineTask('disposition-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Disposition Planning',
  agent: {
    name: 'disposition-planner',
    prompt: {
      role: 'Inventory Disposition Planner',
      task: 'Develop disposition plan for slow-moving inventory',
      context: args,
      instructions: [
        '1. Evaluate disposition options (sell, return, scrap)',
        '2. Identify liquidation opportunities',
        '3. Calculate recovery values by option',
        '4. Prioritize disposition actions',
        '5. Create disposition timeline',
        '6. Identify process improvements to prevent',
        '7. Calculate financial impact',
        '8. Document disposition plan'
      ],
      outputFormat: 'JSON with disposition plan'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'recoveryValue', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        dispositionOptions: { type: 'object' },
        recoveryValue: { type: 'number' },
        timeline: { type: 'object' },
        preventionMeasures: { type: 'array' },
        financialImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'disposition']
}));

export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Optimization Recommendations',
  agent: {
    name: 'optimization-advisor',
    prompt: {
      role: 'Inventory Optimization Advisor',
      task: 'Generate comprehensive optimization recommendations',
      context: args,
      instructions: [
        '1. Synthesize all analysis findings',
        '2. Identify quick wins',
        '3. Recommend stocking level changes',
        '4. Recommend process improvements',
        '5. Calculate savings potential',
        '6. Prioritize recommendations',
        '7. Create implementation roadmap',
        '8. Document recommendations'
      ],
      outputFormat: 'JSON with optimization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'savingsPotential', 'artifacts'],
      properties: {
        actionItems: { type: 'array' },
        quickWins: { type: 'array' },
        stockingChanges: { type: 'array' },
        processImprovements: { type: 'array' },
        savingsPotential: { type: 'number' },
        implementationRoadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'inventory', 'optimization']
}));

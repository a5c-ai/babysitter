/**
 * @process domains/science/industrial-engineering/inventory-optimization
 * @description Inventory Optimization Analysis - Analyze and optimize inventory policies including safety stock,
 * reorder points, and order quantities to balance service levels with inventory investment.
 * @inputs { inventoryData: string, targetServiceLevel?: number, reviewType?: string }
 * @outputs { success: boolean, classification: object, policies: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/inventory-optimization', {
 *   inventoryData: 'SKU inventory and demand history',
 *   targetServiceLevel: 0.95,
 *   reviewType: 'continuous'
 * });
 *
 * @references
 * - Silver, Pyke & Peterson, Inventory Management and Production Planning
 * - Axsater, Inventory Control
 * - APICS Dictionary (Supply Chain terminology)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventoryData,
    targetServiceLevel = 0.95,
    reviewType = 'continuous',
    holdingCostRate = 0.25,
    outputDir = 'inventory-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Inventory Optimization Analysis process');

  // Task 1: ABC/XYZ Classification
  ctx.log('info', 'Phase 1: Classifying inventory using ABC/XYZ analysis');
  const inventoryClassification = await ctx.task(classificationTask, {
    inventoryData,
    outputDir
  });

  artifacts.push(...inventoryClassification.artifacts);

  // Task 2: Demand Variability Analysis
  ctx.log('info', 'Phase 2: Analyzing demand and lead time variability');
  const variabilityAnalysis = await ctx.task(variabilityAnalysisTask, {
    inventoryClassification,
    outputDir
  });

  artifacts.push(...variabilityAnalysis.artifacts);

  // Breakpoint: Review classification
  await ctx.breakpoint({
    question: `Inventory classified. A-items: ${inventoryClassification.aItemCount}. High variability items: ${variabilityAnalysis.highVariabilityCount}. Proceed with policy optimization?`,
    title: 'Inventory Classification Review',
    context: {
      runId: ctx.runId,
      classification: inventoryClassification.summary,
      variability: variabilityAnalysis.summary,
      files: inventoryClassification.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 3: Safety Stock Calculation
  ctx.log('info', 'Phase 3: Calculating optimal safety stock levels');
  const safetyStockCalc = await ctx.task(safetyStockTask, {
    inventoryClassification,
    variabilityAnalysis,
    targetServiceLevel,
    outputDir
  });

  artifacts.push(...safetyStockCalc.artifacts);

  // Task 4: EOQ Analysis
  ctx.log('info', 'Phase 4: Determining economic order quantities');
  const eoqAnalysis = await ctx.task(eoqTask, {
    inventoryClassification,
    holdingCostRate,
    outputDir
  });

  artifacts.push(...eoqAnalysis.artifacts);

  // Task 5: Reorder Point Calculation
  ctx.log('info', 'Phase 5: Calculating reorder points');
  const reorderPoints = await ctx.task(reorderPointTask, {
    safetyStockCalc,
    variabilityAnalysis,
    reviewType,
    outputDir
  });

  artifacts.push(...reorderPoints.artifacts);

  // Task 6: Cost-Service Tradeoff
  ctx.log('info', 'Phase 6: Analyzing cost vs. service level tradeoffs');
  const tradeoffAnalysis = await ctx.task(tradeoffTask, {
    safetyStockCalc,
    eoqAnalysis,
    targetServiceLevel,
    outputDir
  });

  artifacts.push(...tradeoffAnalysis.artifacts);

  // Task 7: Policy Recommendations
  ctx.log('info', 'Phase 7: Developing policy recommendations');
  const policyRecommendations = await ctx.task(policyRecommendationsTask, {
    inventoryClassification,
    safetyStockCalc,
    eoqAnalysis,
    reorderPoints,
    tradeoffAnalysis,
    outputDir
  });

  artifacts.push(...policyRecommendations.artifacts);

  // Task 8: Implementation Plan
  ctx.log('info', 'Phase 8: Creating implementation plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    policyRecommendations,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Inventory optimization complete. Expected inventory reduction: ${tradeoffAnalysis.inventoryReduction}%. Service level target: ${targetServiceLevel * 100}%. Review recommendations?`,
    title: 'Inventory Optimization Results',
    context: {
      runId: ctx.runId,
      summary: {
        skusAnalyzed: inventoryClassification.totalSKUs,
        inventoryReduction: tradeoffAnalysis.inventoryReduction,
        serviceLevelTarget: targetServiceLevel,
        expectedSavings: tradeoffAnalysis.expectedSavings
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    classification: {
      abcClassification: inventoryClassification.abcClassification,
      xyzClassification: inventoryClassification.xyzClassification,
      matrix: inventoryClassification.matrix
    },
    policies: {
      safetyStock: safetyStockCalc.safetyStockBySKU,
      eoq: eoqAnalysis.eoqBySKU,
      reorderPoints: reorderPoints.ropBySKU
    },
    recommendations: policyRecommendations.recommendations,
    expectedImpact: {
      inventoryReduction: tradeoffAnalysis.inventoryReduction,
      expectedSavings: tradeoffAnalysis.expectedSavings,
      serviceLevelImpact: tradeoffAnalysis.serviceLevelImpact
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/inventory-optimization',
      timestamp: startTime,
      targetServiceLevel,
      reviewType,
      outputDir
    }
  };
}

// Task 1: ABC/XYZ Classification
export const classificationTask = defineTask('inventory-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify inventory using ABC/XYZ',
  agent: {
    name: 'inventory-classifier',
    prompt: {
      role: 'Inventory Analyst',
      task: 'Classify inventory using ABC and XYZ analysis',
      context: args,
      instructions: [
        '1. Calculate annual usage value for each SKU',
        '2. Rank SKUs by usage value',
        '3. Apply ABC classification (80/15/5)',
        '4. Calculate coefficient of variation for demand',
        '5. Apply XYZ classification based on variability',
        '6. Create ABC-XYZ matrix',
        '7. Identify policy segments',
        '8. Document classification results'
      ],
      outputFormat: 'JSON with classification results and matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['abcClassification', 'xyzClassification', 'matrix', 'aItemCount', 'totalSKUs', 'summary', 'artifacts'],
      properties: {
        abcClassification: { type: 'object' },
        xyzClassification: { type: 'object' },
        matrix: { type: 'object' },
        aItemCount: { type: 'number' },
        totalSKUs: { type: 'number' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'classification']
}));

// Task 2: Variability Analysis
export const variabilityAnalysisTask = defineTask('variability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze demand and lead time variability',
  agent: {
    name: 'variability-analyst',
    prompt: {
      role: 'Demand Analyst',
      task: 'Analyze variability in demand and lead times',
      context: args,
      instructions: [
        '1. Calculate demand standard deviation',
        '2. Calculate demand coefficient of variation',
        '3. Analyze lead time data',
        '4. Calculate lead time variability',
        '5. Identify seasonal patterns',
        '6. Calculate combined variability',
        '7. Identify high-variability items',
        '8. Document variability analysis'
      ],
      outputFormat: 'JSON with variability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['demandVariability', 'leadTimeVariability', 'highVariabilityCount', 'summary', 'artifacts'],
      properties: {
        demandVariability: { type: 'object' },
        leadTimeVariability: { type: 'object' },
        combinedVariability: { type: 'object' },
        highVariabilityCount: { type: 'number' },
        seasonalPatterns: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'variability']
}));

// Task 3: Safety Stock Calculation
export const safetyStockTask = defineTask('safety-stock-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate optimal safety stock',
  agent: {
    name: 'safety-stock-calculator',
    prompt: {
      role: 'Inventory Planning Specialist',
      task: 'Calculate safety stock by target service level',
      context: args,
      instructions: [
        '1. Determine service level by classification',
        '2. Calculate z-score for service level',
        '3. Apply safety stock formula',
        '4. Account for lead time variability',
        '5. Calculate safety stock by SKU',
        '6. Summarize total safety stock value',
        '7. Compare to current safety stock',
        '8. Document calculations'
      ],
      outputFormat: 'JSON with safety stock calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['safetyStockBySKU', 'totalSafetyStock', 'safetyStockValue', 'artifacts'],
      properties: {
        safetyStockBySKU: { type: 'object' },
        totalSafetyStock: { type: 'number' },
        safetyStockValue: { type: 'number' },
        serviceLevelBySKU: { type: 'object' },
        comparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'safety-stock']
}));

// Task 4: EOQ Analysis
export const eoqTask = defineTask('eoq-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine economic order quantities',
  agent: {
    name: 'eoq-analyst',
    prompt: {
      role: 'Inventory Optimization Analyst',
      task: 'Calculate economic order quantities',
      context: args,
      instructions: [
        '1. Gather ordering costs',
        '2. Calculate holding costs',
        '3. Apply EOQ formula',
        '4. Consider quantity discounts',
        '5. Apply practical constraints (MOQ, lot sizes)',
        '6. Calculate order frequency',
        '7. Calculate total inventory costs',
        '8. Document EOQ analysis'
      ],
      outputFormat: 'JSON with EOQ calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['eoqBySKU', 'totalCostBySKU', 'artifacts'],
      properties: {
        eoqBySKU: { type: 'object' },
        orderFrequency: { type: 'object' },
        totalCostBySKU: { type: 'object' },
        constrainedEOQ: { type: 'object' },
        discountAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'eoq']
}));

// Task 5: Reorder Point Calculation
export const reorderPointTask = defineTask('reorder-point-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate reorder points',
  agent: {
    name: 'rop-calculator',
    prompt: {
      role: 'Inventory Policy Analyst',
      task: 'Calculate reorder points for inventory policy',
      context: args,
      instructions: [
        '1. Calculate average demand during lead time',
        '2. Add safety stock to get ROP',
        '3. Adjust for review period if periodic review',
        '4. Calculate min/max levels if (s,S) policy',
        '5. Consider rounding to practical units',
        '6. Document ROP by SKU',
        '7. Create policy parameters table',
        '8. Document calculations'
      ],
      outputFormat: 'JSON with reorder points'
    },
    outputSchema: {
      type: 'object',
      required: ['ropBySKU', 'policyParameters', 'artifacts'],
      properties: {
        ropBySKU: { type: 'object' },
        demandDuringLeadTime: { type: 'object' },
        policyParameters: { type: 'object' },
        minMaxLevels: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'reorder-point']
}));

// Task 6: Cost-Service Tradeoff
export const tradeoffTask = defineTask('cost-service-tradeoff', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cost vs. service tradeoffs',
  agent: {
    name: 'tradeoff-analyst',
    prompt: {
      role: 'Inventory Optimization Consultant',
      task: 'Analyze tradeoffs between inventory cost and service level',
      context: args,
      instructions: [
        '1. Calculate current inventory investment',
        '2. Calculate proposed inventory investment',
        '3. Model different service level scenarios',
        '4. Create cost-service curve',
        '5. Calculate inventory reduction percentage',
        '6. Estimate stockout cost impact',
        '7. Calculate expected savings',
        '8. Document tradeoff analysis'
      ],
      outputFormat: 'JSON with tradeoff analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['inventoryReduction', 'expectedSavings', 'serviceLevelImpact', 'artifacts'],
      properties: {
        currentInvestment: { type: 'number' },
        proposedInvestment: { type: 'number' },
        inventoryReduction: { type: 'number' },
        expectedSavings: { type: 'number' },
        serviceLevelImpact: { type: 'object' },
        costServiceCurve: { type: 'object' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'tradeoff']
}));

// Task 7: Policy Recommendations
export const policyRecommendationsTask = defineTask('policy-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop policy recommendations',
  agent: {
    name: 'policy-recommender',
    prompt: {
      role: 'Supply Chain Consultant',
      task: 'Develop inventory policy recommendations by segment',
      context: args,
      instructions: [
        '1. Define policy by ABC-XYZ segment',
        '2. Recommend review system (continuous vs. periodic)',
        '3. Recommend ordering policy ((Q,R) vs. (s,S))',
        '4. Set service level targets by segment',
        '5. Define exceptions and special handling',
        '6. Create policy documentation',
        '7. Define KPIs for monitoring',
        '8. Document recommendations'
      ],
      outputFormat: 'JSON with policy recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'policyBySegment', 'kpis', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        policyBySegment: { type: 'object' },
        reviewSystems: { type: 'object' },
        serviceLevelTargets: { type: 'object' },
        exceptions: { type: 'array' },
        kpis: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'policy']
}));

// Task 8: Implementation Plan
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Supply Chain Project Manager',
      task: 'Create plan to implement new inventory policies',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Start with pilot SKUs',
        '3. Plan system updates needed',
        '4. Define training requirements',
        '5. Create communication plan',
        '6. Define go-live approach',
        '7. Plan performance monitoring',
        '8. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'systemUpdates', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        pilotPlan: { type: 'object' },
        systemUpdates: { type: 'array' },
        trainingPlan: { type: 'object' },
        communicationPlan: { type: 'object' },
        monitoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'inventory', 'implementation']
}));

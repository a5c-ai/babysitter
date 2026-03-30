/**
 * @process specializations/domains/business/supply-chain/safety-stock-optimization
 * @description Safety Stock Calculation and Optimization - Calculate optimal safety stock levels based on
 * demand variability, lead time variability, and target service levels using statistical methods.
 * @inputs { demandData?: object, leadTimeData?: object, serviceLevelTargets?: object, costParameters?: object }
 * @outputs { success: boolean, safetyStockLevels: object, serviceAnalysis: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/safety-stock-optimization', {
 *   demandData: { items: [...], variability: {...} },
 *   leadTimeData: { suppliers: [...], variability: {...} },
 *   serviceLevelTargets: { fillRate: 0.98 },
 *   costParameters: { holdingCost: 0.25, stockoutCost: 100 }
 * });
 *
 * @references
 * - ASCM CPIM: https://www.ascm.org/learning-development/certifications-credentials/cpim/
 * - Safety Stock Best Practices: https://www.kinaxis.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    demandData = {},
    leadTimeData = {},
    serviceLevelTargets = {},
    costParameters = {},
    calculationMethod = 'statistical',
    outputDir = 'safety-stock-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Safety Stock Calculation and Optimization Process');

  // ============================================================================
  // PHASE 1: DEMAND VARIABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing demand variability');

  const demandVariability = await ctx.task(demandVariabilityTask, {
    demandData,
    outputDir
  });

  artifacts.push(...demandVariability.artifacts);

  // ============================================================================
  // PHASE 2: LEAD TIME VARIABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing lead time variability');

  const leadTimeVariability = await ctx.task(leadTimeVariabilityTask, {
    leadTimeData,
    outputDir
  });

  artifacts.push(...leadTimeVariability.artifacts);

  // ============================================================================
  // PHASE 3: SERVICE LEVEL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing service level requirements');

  const serviceLevelAnalysis = await ctx.task(serviceLevelAnalysisTask, {
    serviceLevelTargets,
    demandVariability,
    outputDir
  });

  artifacts.push(...serviceLevelAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SAFETY STOCK CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Calculating safety stock levels');

  const safetyStockCalculation = await ctx.task(safetyStockCalculationTask, {
    demandVariability,
    leadTimeVariability,
    serviceLevelAnalysis,
    calculationMethod,
    outputDir
  });

  artifacts.push(...safetyStockCalculation.artifacts);

  // Breakpoint: Review calculations
  await ctx.breakpoint({
    question: `Safety stock calculations complete. Total investment: $${safetyStockCalculation.totalInvestment}. Average service level: ${safetyStockCalculation.avgServiceLevel}%. Review calculations?`,
    title: 'Safety Stock Calculation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        totalInvestment: safetyStockCalculation.totalInvestment,
        avgServiceLevel: safetyStockCalculation.avgServiceLevel,
        itemsCalculated: safetyStockCalculation.itemsCalculated
      }
    }
  });

  // ============================================================================
  // PHASE 5: COST-SERVICE TRADE-OFF ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing cost-service trade-offs');

  const tradeOffAnalysis = await ctx.task(costServiceTradeOffTask, {
    safetyStockCalculation,
    serviceLevelTargets,
    costParameters,
    outputDir
  });

  artifacts.push(...tradeOffAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: OPTIMIZATION SCENARIOS
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing optimization scenarios');

  const optimizationScenarios = await ctx.task(optimizationScenariosTask, {
    safetyStockCalculation,
    tradeOffAnalysis,
    serviceLevelTargets,
    outputDir
  });

  artifacts.push(...optimizationScenarios.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating implementation recommendations');

  const recommendations = await ctx.task(implementationRecommendationsTask, {
    safetyStockCalculation,
    tradeOffAnalysis,
    optimizationScenarios,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    safetyStockLevels: {
      byItem: safetyStockCalculation.safetyStockByItem,
      totalUnits: safetyStockCalculation.totalUnits,
      totalInvestment: safetyStockCalculation.totalInvestment
    },
    serviceAnalysis: {
      targetServiceLevel: serviceLevelTargets.fillRate || 0.95,
      achievedServiceLevel: safetyStockCalculation.avgServiceLevel,
      stockoutRisk: safetyStockCalculation.stockoutRisk
    },
    tradeOffs: {
      costCurve: tradeOffAnalysis.costCurve,
      optimalPoint: tradeOffAnalysis.optimalPoint
    },
    scenarios: optimizationScenarios.scenarios,
    recommendations: recommendations.actionItems,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/safety-stock-optimization',
      timestamp: startTime,
      calculationMethod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const demandVariabilityTask = defineTask('demand-variability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Demand Variability Analysis',
  agent: {
    name: 'demand-analyst',
    prompt: {
      role: 'Demand Variability Analyst',
      task: 'Analyze demand variability for safety stock calculation',
      context: args,
      instructions: [
        '1. Calculate mean demand by item',
        '2. Calculate standard deviation of demand',
        '3. Calculate coefficient of variation',
        '4. Identify demand patterns (stable, seasonal, erratic)',
        '5. Detect outliers and special causes',
        '6. Assess forecast error patterns',
        '7. Segment items by variability',
        '8. Document variability analysis'
      ],
      outputFormat: 'JSON with demand variability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['meanDemand', 'demandStdDev', 'artifacts'],
      properties: {
        meanDemand: { type: 'object' },
        demandStdDev: { type: 'object' },
        coefficientOfVariation: { type: 'object' },
        demandPatterns: { type: 'object' },
        outliers: { type: 'array' },
        variabilitySegments: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'safety-stock', 'demand-variability']
}));

export const leadTimeVariabilityTask = defineTask('lead-time-variability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Lead Time Variability Analysis',
  agent: {
    name: 'lead-time-analyst',
    prompt: {
      role: 'Lead Time Analyst',
      task: 'Analyze lead time variability for safety stock calculation',
      context: args,
      instructions: [
        '1. Calculate mean lead time by supplier/item',
        '2. Calculate standard deviation of lead time',
        '3. Analyze lead time reliability',
        '4. Identify suppliers with high variability',
        '5. Assess impact of lead time extensions',
        '6. Identify root causes of variability',
        '7. Segment by lead time reliability',
        '8. Document lead time analysis'
      ],
      outputFormat: 'JSON with lead time variability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['meanLeadTime', 'leadTimeStdDev', 'artifacts'],
      properties: {
        meanLeadTime: { type: 'object' },
        leadTimeStdDev: { type: 'object' },
        reliability: { type: 'object' },
        highVariabilitySuppliers: { type: 'array' },
        rootCauses: { type: 'array' },
        reliabilitySegments: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'safety-stock', 'lead-time']
}));

export const serviceLevelAnalysisTask = defineTask('service-level-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Service Level Analysis',
  agent: {
    name: 'service-analyst',
    prompt: {
      role: 'Service Level Analyst',
      task: 'Analyze service level requirements and targets',
      context: args,
      instructions: [
        '1. Document target service levels by segment',
        '2. Calculate current service levels',
        '3. Determine z-scores for service levels',
        '4. Assess service level gaps',
        '5. Evaluate stockout costs',
        '6. Analyze customer impact',
        '7. Differentiate service by item importance',
        '8. Document service level requirements'
      ],
      outputFormat: 'JSON with service level analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['targetLevels', 'currentLevels', 'zScores', 'artifacts'],
      properties: {
        targetLevels: { type: 'object' },
        currentLevels: { type: 'object' },
        zScores: { type: 'object' },
        serviceGaps: { type: 'object' },
        stockoutCosts: { type: 'object' },
        differentiatedTargets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'safety-stock', 'service-level']
}));

export const safetyStockCalculationTask = defineTask('safety-stock-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Safety Stock Calculation',
  agent: {
    name: 'safety-stock-calculator',
    prompt: {
      role: 'Safety Stock Specialist',
      task: 'Calculate optimal safety stock levels',
      context: args,
      instructions: [
        '1. Apply safety stock formula (z * sqrt(LT*sigma_d^2 + d^2*sigma_lt^2))',
        '2. Calculate safety stock by item',
        '3. Apply service level factors (z-scores)',
        '4. Account for both demand and lead time variability',
        '5. Calculate total safety stock investment',
        '6. Validate calculations',
        '7. Calculate expected service levels',
        '8. Document calculation methodology'
      ],
      outputFormat: 'JSON with safety stock calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['safetyStockByItem', 'totalUnits', 'totalInvestment', 'artifacts'],
      properties: {
        safetyStockByItem: { type: 'object' },
        totalUnits: { type: 'number' },
        totalInvestment: { type: 'number' },
        avgServiceLevel: { type: 'number' },
        itemsCalculated: { type: 'number' },
        stockoutRisk: { type: 'object' },
        methodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'safety-stock', 'calculation']
}));

export const costServiceTradeOffTask = defineTask('cost-service-trade-off', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Cost-Service Trade-off Analysis',
  agent: {
    name: 'trade-off-analyst',
    prompt: {
      role: 'Cost-Service Trade-off Analyst',
      task: 'Analyze trade-offs between inventory cost and service level',
      context: args,
      instructions: [
        '1. Build cost-service curve',
        '2. Calculate inventory cost at various service levels',
        '3. Calculate stockout cost at various service levels',
        '4. Identify optimal trade-off point',
        '5. Analyze marginal cost of service improvement',
        '6. Assess diminishing returns',
        '7. Recommend service level targets',
        '8. Document trade-off analysis'
      ],
      outputFormat: 'JSON with cost-service trade-off analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['costCurve', 'optimalPoint', 'artifacts'],
      properties: {
        costCurve: { type: 'array' },
        optimalPoint: { type: 'object' },
        marginalCosts: { type: 'object' },
        diminishingReturns: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'safety-stock', 'trade-off']
}));

export const optimizationScenariosTask = defineTask('optimization-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Optimization Scenarios',
  agent: {
    name: 'scenario-developer',
    prompt: {
      role: 'Optimization Scenario Analyst',
      task: 'Develop safety stock optimization scenarios',
      context: args,
      instructions: [
        '1. Develop baseline scenario (current state)',
        '2. Develop cost reduction scenario',
        '3. Develop service improvement scenario',
        '4. Develop balanced optimization scenario',
        '5. Calculate impact of each scenario',
        '6. Assess risk of each scenario',
        '7. Compare scenarios',
        '8. Recommend optimal scenario'
      ],
      outputFormat: 'JSON with optimization scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'recommendedScenario', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        recommendedScenario: { type: 'object' },
        scenarioComparison: { type: 'object' },
        riskAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'safety-stock', 'scenarios']
}));

export const implementationRecommendationsTask = defineTask('implementation-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Implementation Recommendations',
  agent: {
    name: 'implementation-advisor',
    prompt: {
      role: 'Safety Stock Implementation Advisor',
      task: 'Generate implementation recommendations',
      context: args,
      instructions: [
        '1. Prioritize implementation actions',
        '2. Define phased implementation approach',
        '3. Identify system updates needed',
        '4. Define monitoring and review process',
        '5. Recommend variability reduction actions',
        '6. Define governance for safety stock',
        '7. Calculate expected benefits',
        '8. Create implementation plan'
      ],
      outputFormat: 'JSON with implementation recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'implementationPlan', 'artifacts'],
      properties: {
        actionItems: { type: 'array' },
        implementationPhases: { type: 'array' },
        systemUpdates: { type: 'array' },
        monitoringProcess: { type: 'object' },
        variabilityReduction: { type: 'array' },
        expectedBenefits: { type: 'object' },
        implementationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'safety-stock', 'implementation']
}));

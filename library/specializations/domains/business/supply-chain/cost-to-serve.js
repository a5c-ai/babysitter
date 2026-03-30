/**
 * @process specializations/domains/business/supply-chain/cost-to-serve
 * @description Supply Chain Cost-to-Serve Analysis - Calculate total cost to serve by customer, product,
 * or channel including procurement, inventory, logistics, and service costs for profitability insights.
 * @inputs { customers?: array, products?: array, channels?: array, costData?: object }
 * @outputs { success: boolean, costAnalysis: object, profitabilityInsights: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/cost-to-serve', {
 *   customers: ['Customer A', 'Customer B'],
 *   products: ['Product X', 'Product Y'],
 *   channels: ['Direct', 'Distribution'],
 *   costData: { procurement: {...}, logistics: {...} }
 * });
 *
 * @references
 * - McKinsey Supply Chain Cost-to-Serve: https://www.mckinsey.com/capabilities/operations/how-we-help-clients/supply-chain
 * - Gartner Cost-to-Serve: https://www.gartner.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customers = [],
    products = [],
    channels = [],
    costData = {},
    analysisScope = 'comprehensive',
    outputDir = 'cost-to-serve-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Supply Chain Cost-to-Serve Analysis Process');

  // ============================================================================
  // PHASE 1: COST DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting cost data');

  const costCollection = await ctx.task(costDataCollectionTask, {
    costData,
    analysisScope,
    outputDir
  });

  artifacts.push(...costCollection.artifacts);

  // ============================================================================
  // PHASE 2: PROCUREMENT COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing procurement costs');

  const procurementCosts = await ctx.task(procurementCostTask, {
    costCollection,
    products,
    outputDir
  });

  artifacts.push(...procurementCosts.artifacts);

  // ============================================================================
  // PHASE 3: INVENTORY COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing inventory costs');

  const inventoryCosts = await ctx.task(inventoryCostTask, {
    costCollection,
    products,
    customers,
    outputDir
  });

  artifacts.push(...inventoryCosts.artifacts);

  // ============================================================================
  // PHASE 4: LOGISTICS COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing logistics costs');

  const logisticsCosts = await ctx.task(logisticsCostTask, {
    costCollection,
    customers,
    channels,
    outputDir
  });

  artifacts.push(...logisticsCosts.artifacts);

  // ============================================================================
  // PHASE 5: SERVICE COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing service costs');

  const serviceCosts = await ctx.task(serviceCostTask, {
    costCollection,
    customers,
    channels,
    outputDir
  });

  artifacts.push(...serviceCosts.artifacts);

  // ============================================================================
  // PHASE 6: COST-TO-SERVE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Calculating total cost-to-serve');

  const costToServeCalculation = await ctx.task(costToServeCalculationTask, {
    procurementCosts,
    inventoryCosts,
    logisticsCosts,
    serviceCosts,
    customers,
    products,
    channels,
    outputDir
  });

  artifacts.push(...costToServeCalculation.artifacts);

  // Breakpoint: Review cost-to-serve analysis
  await ctx.breakpoint({
    question: `Cost-to-serve analysis complete. Average CTS: $${costToServeCalculation.averageCts}. Highest cost customer: ${costToServeCalculation.highestCostCustomer}. Review analysis?`,
    title: 'Cost-to-Serve Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        averageCts: costToServeCalculation.averageCts,
        highestCostCustomer: costToServeCalculation.highestCostCustomer,
        ctsRange: costToServeCalculation.ctsRange
      }
    }
  });

  // ============================================================================
  // PHASE 7: PROFITABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing profitability');

  const profitabilityAnalysis = await ctx.task(profitabilityAnalysisTask, {
    costToServeCalculation,
    customers,
    products,
    channels,
    outputDir
  });

  artifacts.push(...profitabilityAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating optimization recommendations');

  const optimizationRecommendations = await ctx.task(ctsOptimizationTask, {
    costToServeCalculation,
    profitabilityAnalysis,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    costAnalysis: {
      totalCostToServe: costToServeCalculation.totalCts,
      averageCts: costToServeCalculation.averageCts,
      ctsByCustomer: costToServeCalculation.ctsByCustomer,
      ctsByProduct: costToServeCalculation.ctsByProduct,
      ctsByChannel: costToServeCalculation.ctsByChannel
    },
    costBreakdown: {
      procurement: procurementCosts.totalCost,
      inventory: inventoryCosts.totalCost,
      logistics: logisticsCosts.totalCost,
      service: serviceCosts.totalCost
    },
    profitabilityInsights: {
      profitableCustomers: profitabilityAnalysis.profitableCustomers,
      unprofitableCustomers: profitabilityAnalysis.unprofitableCustomers,
      marginBySegment: profitabilityAnalysis.marginBySegment
    },
    recommendations: optimizationRecommendations.recommendations,
    savingsPotential: optimizationRecommendations.savingsPotential,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/cost-to-serve',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const costDataCollectionTask = defineTask('cost-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Cost Data Collection',
  agent: {
    name: 'cost-collector',
    prompt: {
      role: 'Cost Data Analyst',
      task: 'Collect and validate cost data',
      context: args,
      instructions: [
        '1. Extract procurement cost data',
        '2. Extract inventory cost data',
        '3. Extract logistics cost data',
        '4. Extract service cost data',
        '5. Validate data completeness',
        '6. Identify cost allocation rules',
        '7. Normalize cost data',
        '8. Document data sources'
      ],
      outputFormat: 'JSON with collected cost data'
    },
    outputSchema: {
      type: 'object',
      required: ['costCategories', 'dataQuality', 'artifacts'],
      properties: {
        costCategories: { type: 'object' },
        dataQuality: { type: 'object' },
        allocationRules: { type: 'object' },
        dataSources: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'data-collection']
}));

export const procurementCostTask = defineTask('procurement-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Procurement Cost Analysis',
  agent: {
    name: 'procurement-analyst',
    prompt: {
      role: 'Procurement Cost Analyst',
      task: 'Analyze procurement costs',
      context: args,
      instructions: [
        '1. Calculate material costs by product',
        '2. Include purchasing overhead',
        '3. Allocate supplier management costs',
        '4. Include quality costs',
        '5. Calculate inbound freight',
        '6. Allocate customs/duties',
        '7. Summarize procurement cost per unit',
        '8. Document cost drivers'
      ],
      outputFormat: 'JSON with procurement cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCost', 'costByProduct', 'artifacts'],
      properties: {
        totalCost: { type: 'number' },
        costByProduct: { type: 'object' },
        costComponents: { type: 'object' },
        costDrivers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'procurement']
}));

export const inventoryCostTask = defineTask('inventory-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Inventory Cost Analysis',
  agent: {
    name: 'inventory-cost-analyst',
    prompt: {
      role: 'Inventory Cost Analyst',
      task: 'Analyze inventory carrying costs',
      context: args,
      instructions: [
        '1. Calculate storage costs',
        '2. Calculate capital costs',
        '3. Include insurance costs',
        '4. Calculate obsolescence costs',
        '5. Allocate handling costs',
        '6. Calculate by customer/product',
        '7. Analyze inventory turns impact',
        '8. Document inventory cost drivers'
      ],
      outputFormat: 'JSON with inventory cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCost', 'carryingCostRate', 'artifacts'],
      properties: {
        totalCost: { type: 'number' },
        carryingCostRate: { type: 'number' },
        costByProduct: { type: 'object' },
        costByCustomer: { type: 'object' },
        costComponents: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'inventory']
}));

export const logisticsCostTask = defineTask('logistics-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Logistics Cost Analysis',
  agent: {
    name: 'logistics-cost-analyst',
    prompt: {
      role: 'Logistics Cost Analyst',
      task: 'Analyze logistics and distribution costs',
      context: args,
      instructions: [
        '1. Calculate outbound freight costs',
        '2. Calculate warehousing costs',
        '3. Include order processing costs',
        '4. Calculate delivery costs',
        '5. Include returns processing',
        '6. Analyze cost by customer/channel',
        '7. Calculate cost per shipment',
        '8. Document logistics cost drivers'
      ],
      outputFormat: 'JSON with logistics cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCost', 'costByCustomer', 'artifacts'],
      properties: {
        totalCost: { type: 'number' },
        costByCustomer: { type: 'object' },
        costByChannel: { type: 'object' },
        costPerShipment: { type: 'number' },
        costComponents: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'logistics']
}));

export const serviceCostTask = defineTask('service-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Service Cost Analysis',
  agent: {
    name: 'service-cost-analyst',
    prompt: {
      role: 'Service Cost Analyst',
      task: 'Analyze customer service costs',
      context: args,
      instructions: [
        '1. Calculate customer service costs',
        '2. Include order management costs',
        '3. Calculate special handling costs',
        '4. Include expediting costs',
        '5. Calculate complaint handling costs',
        '6. Allocate by customer/channel',
        '7. Identify high-service-cost customers',
        '8. Document service cost drivers'
      ],
      outputFormat: 'JSON with service cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCost', 'costByCustomer', 'artifacts'],
      properties: {
        totalCost: { type: 'number' },
        costByCustomer: { type: 'object' },
        specialHandlingCosts: { type: 'object' },
        highCostCustomers: { type: 'array' },
        costDrivers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'service']
}));

export const costToServeCalculationTask = defineTask('cost-to-serve-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Cost-to-Serve Calculation',
  agent: {
    name: 'cts-calculator',
    prompt: {
      role: 'Cost-to-Serve Calculation Specialist',
      task: 'Calculate total cost-to-serve',
      context: args,
      instructions: [
        '1. Sum all cost components',
        '2. Calculate CTS by customer',
        '3. Calculate CTS by product',
        '4. Calculate CTS by channel',
        '5. Calculate average CTS',
        '6. Identify CTS range and distribution',
        '7. Compare to benchmarks',
        '8. Document CTS calculations'
      ],
      outputFormat: 'JSON with cost-to-serve calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCts', 'averageCts', 'ctsByCustomer', 'artifacts'],
      properties: {
        totalCts: { type: 'number' },
        averageCts: { type: 'number' },
        ctsByCustomer: { type: 'object' },
        ctsByProduct: { type: 'object' },
        ctsByChannel: { type: 'object' },
        ctsRange: { type: 'object' },
        highestCostCustomer: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'calculation']
}));

export const profitabilityAnalysisTask = defineTask('profitability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Profitability Analysis',
  agent: {
    name: 'profitability-analyst',
    prompt: {
      role: 'Customer Profitability Analyst',
      task: 'Analyze profitability by customer/product/channel',
      context: args,
      instructions: [
        '1. Calculate gross margin by customer',
        '2. Calculate net margin after CTS',
        '3. Identify profitable customers',
        '4. Identify unprofitable customers',
        '5. Analyze margin by segment',
        '6. Create profitability matrix',
        '7. Calculate profit contribution',
        '8. Document profitability insights'
      ],
      outputFormat: 'JSON with profitability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['profitableCustomers', 'unprofitableCustomers', 'marginBySegment', 'artifacts'],
      properties: {
        profitableCustomers: { type: 'array' },
        unprofitableCustomers: { type: 'array' },
        marginBySegment: { type: 'object' },
        profitabilityMatrix: { type: 'object' },
        profitContribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'profitability']
}));

export const ctsOptimizationTask = defineTask('cts-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Optimization Recommendations',
  agent: {
    name: 'optimization-advisor',
    prompt: {
      role: 'Cost-to-Serve Optimization Advisor',
      task: 'Generate optimization recommendations',
      context: args,
      instructions: [
        '1. Identify cost reduction opportunities',
        '2. Recommend pricing adjustments',
        '3. Suggest service level optimization',
        '4. Recommend channel optimization',
        '5. Identify customer profitability actions',
        '6. Calculate savings potential',
        '7. Prioritize recommendations',
        '8. Create action plan'
      ],
      outputFormat: 'JSON with optimization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'savingsPotential', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        savingsPotential: { type: 'number' },
        pricingAdjustments: { type: 'array' },
        serviceLevelOptimization: { type: 'array' },
        channelOptimization: { type: 'array' },
        actionPlan: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'cost-to-serve', 'optimization']
}));

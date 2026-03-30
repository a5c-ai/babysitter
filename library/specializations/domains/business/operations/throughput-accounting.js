/**
 * @process specializations/domains/business/operations/throughput-accounting
 * @description Throughput Accounting analysis based on Theory of Constraints financial metrics.
 *              Replaces traditional cost accounting with T (Throughput), I (Investment), and
 *              OE (Operating Expense) to drive better operational decisions.
 * @inputs {
 *   organizationContext: { industry: string, businessModel: string, productLines: string[] },
 *   financialData: { revenueByProduct: object, materialCosts: object, operatingExpenses: object },
 *   productData: { products: object[], constraintUsage: object, routings: object[] },
 *   decisionContext: { decisionsToEvaluate: object[], investmentProposals: object[] },
 *   currentMetrics: { currentThroughput: number, currentInventory: number, currentOE: number }
 * }
 * @outputs {
 *   throughputAnalysis: { productThroughput: object[], throughputPerConstraintUnit: object[] },
 *   investmentAnalysis: { inventoryValuation: object, investmentRecommendations: object[] },
 *   decisionSupport: { productMixDecision: object, pricingGuidance: object, makeVsBuyAnalysis: object },
 *   performanceMetrics: { netProfit: number, roi: number, productivity: number, turnover: number }
 * }
 * @example
 * // Input
 * {
 *   organizationContext: { industry: "manufacturing", businessModel: "make-to-order", productLines: ["Standard", "Premium", "Custom"] },
 *   financialData: { revenueByProduct: {...}, materialCosts: {...}, operatingExpenses: 500000 },
 *   productData: { products: [...], constraintUsage: {...}, routings: [...] },
 *   decisionContext: { decisionsToEvaluate: [...], investmentProposals: [...] },
 *   currentMetrics: { currentThroughput: 800000, currentInventory: 200000, currentOE: 500000 }
 * }
 * @references Throughput Accounting (Corbett), The Goal (Goldratt), TOC Financial Measures
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, financialData, productData, decisionContext, currentMetrics } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Current State Financial Analysis
  const currentStateAnalysis = await ctx.task(analyzeCurrentState, {
    financialData,
    currentMetrics,
    organizationContext
  });
  artifacts.push({ phase: 'current-state-analysis', output: currentStateAnalysis });

  // Phase 2: Product Throughput Calculation
  const productThroughput = await ctx.task(calculateProductThroughput, {
    productData,
    financialData,
    currentStateAnalysis
  });
  artifacts.push({ phase: 'product-throughput', output: productThroughput });

  // Phase 3: Constraint Utilization Analysis
  const constraintAnalysis = await ctx.task(analyzeConstraintUtilization, {
    productThroughput,
    productData
  });
  artifacts.push({ phase: 'constraint-analysis', output: constraintAnalysis });

  // Phase 4: Throughput per Constraint Unit Ranking
  const tCuRanking = await ctx.task(calculateTCURanking, {
    productThroughput,
    constraintAnalysis,
    productData
  });
  artifacts.push({ phase: 'tcu-ranking', output: tCuRanking });

  // Quality Gate: Throughput Analysis Review
  await ctx.breakpoint('throughput-analysis-review', {
    title: 'Throughput Analysis Review',
    description: 'Review product throughput and T/CU ranking before decision analysis',
    artifacts: [productThroughput, constraintAnalysis, tCuRanking]
  });

  // Phase 5: Product Mix Optimization
  const productMixOptimization = await ctx.task(optimizeProductMix, {
    tCuRanking,
    constraintAnalysis,
    financialData,
    productData
  });
  artifacts.push({ phase: 'product-mix', output: productMixOptimization });

  // Phase 6: Pricing Decision Support
  const pricingAnalysis = await ctx.task(analyzePricingDecisions, {
    productThroughput,
    tCuRanking,
    constraintAnalysis,
    decisionContext
  });
  artifacts.push({ phase: 'pricing-analysis', output: pricingAnalysis });

  // Phase 7: Make vs Buy Analysis
  const makeVsBuyAnalysis = await ctx.task(analyzeMakeVsBuy, {
    productThroughput,
    constraintAnalysis,
    decisionContext,
    financialData
  });
  artifacts.push({ phase: 'make-vs-buy', output: makeVsBuyAnalysis });

  // Phase 8: Investment Evaluation
  const investmentEvaluation = await ctx.task(evaluateInvestments, {
    decisionContext,
    currentMetrics,
    constraintAnalysis,
    productThroughput
  });
  artifacts.push({ phase: 'investment-evaluation', output: investmentEvaluation });

  // Phase 9: Inventory Valuation
  const inventoryValuation = await ctx.task(valuateInventory, {
    financialData,
    productData,
    currentMetrics
  });
  artifacts.push({ phase: 'inventory-valuation', output: inventoryValuation });

  // Phase 10: Performance Metrics Calculation
  const performanceMetrics = await ctx.task(calculatePerformanceMetrics, {
    currentStateAnalysis,
    productMixOptimization,
    investmentEvaluation,
    currentMetrics
  });
  artifacts.push({ phase: 'performance-metrics', output: performanceMetrics });

  // Phase 11: Decision Recommendations
  const decisionRecommendations = await ctx.task(generateDecisionRecommendations, {
    productMixOptimization,
    pricingAnalysis,
    makeVsBuyAnalysis,
    investmentEvaluation,
    performanceMetrics
  });
  artifacts.push({ phase: 'decision-recommendations', output: decisionRecommendations });

  // Final Quality Gate: TA Decision Support Approval
  await ctx.breakpoint('ta-decision-approval', {
    title: 'Throughput Accounting Decision Support Approval',
    description: 'Final approval of TA-based decision recommendations',
    artifacts: [decisionRecommendations, performanceMetrics]
  });

  return {
    success: true,
    throughputAnalysis: {
      productThroughput,
      throughputPerConstraintUnit: tCuRanking,
      constraintAnalysis
    },
    investmentAnalysis: {
      inventoryValuation,
      investmentRecommendations: investmentEvaluation
    },
    decisionSupport: {
      productMixDecision: productMixOptimization,
      pricingGuidance: pricingAnalysis,
      makeVsBuyAnalysis
    },
    performanceMetrics,
    recommendations: decisionRecommendations,
    artifacts,
    metadata: {
      processId: 'throughput-accounting',
      startTime,
      endTime: ctx.now(),
      organizationContext
    }
  };
}

export const analyzeCurrentState = defineTask('analyze-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Current Financial State',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'Financial analyst with TOC and throughput accounting expertise',
      task: 'Analyze the current financial state using throughput accounting principles',
      context: {
        financialData: args.financialData,
        currentMetrics: args.currentMetrics,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Calculate current Throughput (T) from revenue minus truly variable costs',
        'Identify and categorize truly variable costs vs operating expenses',
        'Calculate current Investment (I) including all inventory',
        'Verify Operating Expense (OE) classification',
        'Calculate baseline Net Profit (T - OE)',
        'Calculate baseline ROI ((T - OE) / I)'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        totalThroughput: { type: 'number' },
        trulyVariableCosts: { type: 'object' },
        totalInvestment: { type: 'number' },
        operatingExpense: { type: 'number' },
        netProfit: { type: 'number' },
        roi: { type: 'number' },
        baselineMetrics: { type: 'object' }
      },
      required: ['totalThroughput', 'totalInvestment', 'operatingExpense', 'netProfit']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'financial', 'baseline']
}));

export const calculateProductThroughput = defineTask('calculate-product-throughput', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate Product Throughput',
  agent: {
    name: 'throughput-calculator',
    prompt: {
      role: 'Throughput accounting specialist',
      task: 'Calculate throughput for each product',
      context: {
        productData: args.productData,
        financialData: args.financialData,
        currentStateAnalysis: args.currentStateAnalysis
      },
      instructions: [
        'Calculate selling price for each product',
        'Identify truly variable costs per unit (materials, commissions, etc.)',
        'Calculate throughput per unit (T/u = Price - TVC)',
        'Determine current sales volume by product',
        'Calculate total throughput contribution by product',
        'Rank products by absolute throughput contribution'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        productThroughputs: { type: 'array' },
        throughputByProduct: { type: 'object' },
        totalThroughput: { type: 'number' },
        rankingByThroughput: { type: 'array' }
      },
      required: ['productThroughputs', 'totalThroughput']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'throughput', 'product']
}));

export const analyzeConstraintUtilization = defineTask('analyze-constraint-utilization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Constraint Utilization',
  agent: {
    name: 'constraint-analyst',
    prompt: {
      role: 'TOC constraint analysis specialist',
      task: 'Analyze how each product uses constraint capacity',
      context: {
        productThroughput: args.productThroughput,
        productData: args.productData
      },
      instructions: [
        'Identify the system constraint resource',
        'Calculate constraint time per unit for each product',
        'Determine total available constraint capacity',
        'Calculate current constraint utilization by product',
        'Identify constraint capacity remaining or shortfall',
        'Analyze constraint loading patterns'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        constraintResource: { type: 'string' },
        constraintTimePerUnit: { type: 'object' },
        totalCapacity: { type: 'number' },
        currentUtilization: { type: 'object' },
        capacityStatus: { type: 'object' },
        loadingPattern: { type: 'object' }
      },
      required: ['constraintResource', 'constraintTimePerUnit', 'totalCapacity']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint', 'utilization']
}));

export const calculateTCURanking = defineTask('calculate-tcu-ranking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate T/CU Ranking',
  agent: {
    name: 'tcu-analyst',
    prompt: {
      role: 'Throughput accounting decision specialist',
      task: 'Calculate and rank products by Throughput per Constraint Unit (T/CU)',
      context: {
        productThroughput: args.productThroughput,
        constraintAnalysis: args.constraintAnalysis,
        productData: args.productData
      },
      instructions: [
        'Calculate T/CU for each product (Throughput / Constraint Time)',
        'Rank products from highest to lowest T/CU',
        'Identify strategic implications of ranking',
        'Compare T/CU ranking to traditional margin ranking',
        'Document any products where rankings differ significantly',
        'Calculate contribution margin vs T/CU correlation'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        tcuByProduct: { type: 'object' },
        tcuRanking: { type: 'array' },
        marginComparison: { type: 'object' },
        rankingDifferences: { type: 'array' },
        strategicImplications: { type: 'array' }
      },
      required: ['tcuByProduct', 'tcuRanking']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tcu', 'ranking']
}));

export const optimizeProductMix = defineTask('optimize-product-mix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize Product Mix',
  agent: {
    name: 'product-mix-optimizer',
    prompt: {
      role: 'Product portfolio optimization specialist',
      task: 'Determine optimal product mix to maximize throughput',
      context: {
        tCuRanking: args.tCuRanking,
        constraintAnalysis: args.constraintAnalysis,
        financialData: args.financialData,
        productData: args.productData
      },
      instructions: [
        'Apply T/CU ranking to allocate constraint capacity',
        'Satisfy demand for highest T/CU products first',
        'Calculate optimal production quantities',
        'Compare current mix to optimal mix',
        'Calculate throughput improvement potential',
        'Identify implementation considerations'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        optimalMix: { type: 'object' },
        currentMix: { type: 'object' },
        throughputImprovement: { type: 'number' },
        mixChangeRecommendations: { type: 'array' },
        implementationPlan: { type: 'object' }
      },
      required: ['optimalMix', 'throughputImprovement']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-mix', 'optimization']
}));

export const analyzePricingDecisions = defineTask('analyze-pricing-decisions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Pricing Decisions',
  agent: {
    name: 'pricing-analyst',
    prompt: {
      role: 'Strategic pricing analyst with TA expertise',
      task: 'Provide pricing guidance based on throughput accounting',
      context: {
        productThroughput: args.productThroughput,
        tCuRanking: args.tCuRanking,
        constraintAnalysis: args.constraintAnalysis,
        decisionContext: args.decisionContext
      },
      instructions: [
        'Calculate minimum acceptable price for each product',
        'Determine pricing floor based on TVC only',
        'Analyze pricing flexibility by T/CU position',
        'Evaluate special order pricing decisions',
        'Assess volume discount implications',
        'Provide pricing strategy recommendations'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        minimumPrices: { type: 'object' },
        pricingFloors: { type: 'object' },
        pricingFlexibility: { type: 'object' },
        specialOrderGuidance: { type: 'object' },
        volumeDiscountAnalysis: { type: 'object' },
        pricingRecommendations: { type: 'array' }
      },
      required: ['minimumPrices', 'pricingRecommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pricing', 'decision']
}));

export const analyzeMakeVsBuy = defineTask('analyze-make-vs-buy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Make vs Buy Decisions',
  agent: {
    name: 'make-buy-analyst',
    prompt: {
      role: 'Sourcing and make-buy decision specialist',
      task: 'Evaluate make vs buy decisions using throughput accounting',
      context: {
        productThroughput: args.productThroughput,
        constraintAnalysis: args.constraintAnalysis,
        decisionContext: args.decisionContext,
        financialData: args.financialData
      },
      instructions: [
        'Identify components using constraint capacity',
        'Calculate throughput impact of outsourcing',
        'Determine breakeven outsourcing price',
        'Analyze capacity freed by outsourcing',
        'Calculate net throughput gain/loss',
        'Provide make vs buy recommendations'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        constraintComponents: { type: 'array' },
        outsourcingAnalysis: { type: 'object' },
        breakevenPrices: { type: 'object' },
        capacityImpact: { type: 'object' },
        netThroughputImpact: { type: 'object' },
        recommendations: { type: 'array' }
      },
      required: ['outsourcingAnalysis', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'make-buy', 'sourcing']
}));

export const evaluateInvestments = defineTask('evaluate-investments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate Investment Proposals',
  agent: {
    name: 'investment-evaluator',
    prompt: {
      role: 'Capital investment analyst with TOC focus',
      task: 'Evaluate investment proposals using throughput accounting',
      context: {
        decisionContext: args.decisionContext,
        currentMetrics: args.currentMetrics,
        constraintAnalysis: args.constraintAnalysis,
        productThroughput: args.productThroughput
      },
      instructions: [
        'Analyze each investment proposal',
        'Calculate delta T (change in throughput)',
        'Calculate delta I (change in investment)',
        'Calculate delta OE (change in operating expense)',
        'Calculate payback period using T, I, OE',
        'Rank investments by throughput improvement per dollar invested'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        investmentAnalyses: { type: 'array' },
        deltaCalculations: { type: 'object' },
        paybackPeriods: { type: 'object' },
        investmentRanking: { type: 'array' },
        recommendations: { type: 'array' }
      },
      required: ['investmentAnalyses', 'investmentRanking']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'investment', 'evaluation']
}));

export const valuateInventory = defineTask('valuate-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Valuate Inventory',
  agent: {
    name: 'inventory-valuator',
    prompt: {
      role: 'Inventory accounting specialist',
      task: 'Valuate inventory using throughput accounting principles',
      context: {
        financialData: args.financialData,
        productData: args.productData,
        currentMetrics: args.currentMetrics
      },
      instructions: [
        'Value inventory at truly variable cost only',
        'Compare to traditional full absorption costing',
        'Calculate inventory investment by category',
        'Identify excess inventory opportunities',
        'Calculate inventory turns using TA method',
        'Recommend inventory reduction targets'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        taInventoryValue: { type: 'number' },
        traditionalValue: { type: 'number' },
        valuationDifference: { type: 'number' },
        inventoryByCategory: { type: 'object' },
        inventoryTurns: { type: 'number' },
        reductionTargets: { type: 'object' }
      },
      required: ['taInventoryValue', 'inventoryTurns']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inventory', 'valuation']
}));

export const calculatePerformanceMetrics = defineTask('calculate-performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate Performance Metrics',
  agent: {
    name: 'performance-metrics-analyst',
    prompt: {
      role: 'Financial performance metrics specialist',
      task: 'Calculate comprehensive TA performance metrics',
      context: {
        currentStateAnalysis: args.currentStateAnalysis,
        productMixOptimization: args.productMixOptimization,
        investmentEvaluation: args.investmentEvaluation,
        currentMetrics: args.currentMetrics
      },
      instructions: [
        'Calculate Net Profit (T - OE)',
        'Calculate Return on Investment ((T - OE) / I)',
        'Calculate Productivity (T / OE)',
        'Calculate Investment Turns (T / I)',
        'Compare current vs potential metrics',
        'Project future state metrics'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        currentNetProfit: { type: 'number' },
        currentROI: { type: 'number' },
        currentProductivity: { type: 'number' },
        currentTurnover: { type: 'number' },
        potentialNetProfit: { type: 'number' },
        potentialROI: { type: 'number' },
        improvementOpportunity: { type: 'object' }
      },
      required: ['currentNetProfit', 'currentROI', 'currentProductivity']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metrics', 'performance']
}));

export const generateDecisionRecommendations = defineTask('generate-decision-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Decision Recommendations',
  agent: {
    name: 'decision-advisor',
    prompt: {
      role: 'Strategic decision advisor with throughput accounting expertise',
      task: 'Synthesize analyses into actionable decision recommendations',
      context: {
        productMixOptimization: args.productMixOptimization,
        pricingAnalysis: args.pricingAnalysis,
        makeVsBuyAnalysis: args.makeVsBuyAnalysis,
        investmentEvaluation: args.investmentEvaluation,
        performanceMetrics: args.performanceMetrics
      },
      instructions: [
        'Prioritize recommendations by throughput impact',
        'Identify quick wins vs strategic initiatives',
        'Create implementation roadmap',
        'Quantify expected benefits',
        'Identify risks and mitigation strategies',
        'Provide executive summary of recommendations'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        prioritizedRecommendations: { type: 'array' },
        quickWins: { type: 'array' },
        strategicInitiatives: { type: 'array' },
        implementationRoadmap: { type: 'object' },
        expectedBenefits: { type: 'object' },
        risksMitigations: { type: 'array' },
        executiveSummary: { type: 'string' }
      },
      required: ['prioritizedRecommendations', 'executiveSummary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'recommendations', 'decision']
}));

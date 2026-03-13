/**
 * @process specializations/domains/business/operations/demand-forecasting
 * @description Demand Forecasting and Analysis process for generating accurate demand predictions.
 *              Combines statistical methods, market intelligence, and collaborative inputs to
 *              produce actionable demand forecasts across multiple time horizons.
 * @inputs {
 *   organizationContext: { industry: string, businessModel: string, demandPatterns: string[] },
 *   historicalData: { salesHistory: object[], promotionHistory: object[], eventHistory: object[] },
 *   marketData: { economicIndicators: object, competitorActivity: object, marketTrends: object },
 *   forecastScope: { products: string[], timeHorizons: string[], granularity: string },
 *   forecastingPolicy: { methods: string[], accuracy: object, reviewCycles: string[] }
 * }
 * @outputs {
 *   forecasts: { shortTerm: object, mediumTerm: object, longTerm: object },
 *   forecastAnalytics: { accuracy: object, bias: object, confidence: object },
 *   demandInsights: { drivers: object[], patterns: object[], anomalies: object[] },
 *   processMetrics: { forecastValueAdd: number, consensusVariance: number, accuracyTrend: object }
 * }
 * @example
 * // Input
 * {
 *   organizationContext: { industry: "retail", businessModel: "omni-channel", demandPatterns: ["seasonal", "promotional", "trend"] },
 *   historicalData: { salesHistory: [...], promotionHistory: [...], eventHistory: [...] },
 *   marketData: { economicIndicators: {...}, competitorActivity: {...}, marketTrends: {...} },
 *   forecastScope: { products: ["Category-A", "Category-B"], timeHorizons: ["weekly", "monthly", "quarterly"], granularity: "SKU" },
 *   forecastingPolicy: { methods: ["exponential-smoothing", "regression", "ML"], accuracy: {...}, reviewCycles: ["weekly", "monthly"] }
 * }
 * @references APICS Forecasting, Demand Sensing, Machine Learning for Demand Forecasting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, historicalData, marketData, forecastScope, forecastingPolicy } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Data Quality Assessment
  const dataQuality = await ctx.task(assessDataQuality, {
    historicalData,
    forecastScope
  });
  artifacts.push({ phase: 'data-quality', output: dataQuality });

  // Phase 2: Demand Pattern Analysis
  const patternAnalysis = await ctx.task(analyzeDemandPatterns, {
    historicalData,
    dataQuality,
    organizationContext
  });
  artifacts.push({ phase: 'pattern-analysis', output: patternAnalysis });

  // Phase 3: Causal Factor Identification
  const causalFactors = await ctx.task(identifyCausalFactors, {
    historicalData,
    marketData,
    patternAnalysis
  });
  artifacts.push({ phase: 'causal-factors', output: causalFactors });

  // Phase 4: Statistical Baseline Generation
  const statisticalBaseline = await ctx.task(generateStatisticalBaseline, {
    historicalData,
    patternAnalysis,
    forecastingPolicy,
    forecastScope
  });
  artifacts.push({ phase: 'statistical-baseline', output: statisticalBaseline });

  // Phase 5: ML/AI Forecast Enhancement
  const mlEnhancement = await ctx.task(enhanceWithML, {
    statisticalBaseline,
    causalFactors,
    historicalData,
    forecastingPolicy
  });
  artifacts.push({ phase: 'ml-enhancement', output: mlEnhancement });

  // Quality Gate: Statistical Forecast Review
  await ctx.breakpoint('statistical-forecast-review', {
    title: 'Statistical Forecast Review',
    description: 'Review statistical and ML-enhanced forecasts before market adjustments',
    artifacts: [statisticalBaseline, mlEnhancement, patternAnalysis]
  });

  // Phase 6: Market Intelligence Integration
  const marketIntegration = await ctx.task(integrateMarketIntelligence, {
    mlEnhancement,
    marketData,
    organizationContext
  });
  artifacts.push({ phase: 'market-integration', output: marketIntegration });

  // Phase 7: Promotional Impact Modeling
  const promotionalImpact = await ctx.task(modelPromotionalImpact, {
    marketIntegration,
    historicalData,
    forecastScope
  });
  artifacts.push({ phase: 'promotional-impact', output: promotionalImpact });

  // Phase 8: New Product Forecasting
  const newProductForecast = await ctx.task(forecastNewProducts, {
    marketIntegration,
    patternAnalysis,
    marketData
  });
  artifacts.push({ phase: 'new-product-forecast', output: newProductForecast });

  // Phase 9: Forecast Reconciliation
  const forecastReconciliation = await ctx.task(reconcileForecasts, {
    statisticalBaseline,
    mlEnhancement,
    marketIntegration,
    promotionalImpact,
    newProductForecast,
    forecastScope
  });
  artifacts.push({ phase: 'forecast-reconciliation', output: forecastReconciliation });

  // Phase 10: Confidence Interval Calculation
  const confidenceAnalysis = await ctx.task(calculateConfidence, {
    forecastReconciliation,
    historicalData,
    dataQuality
  });
  artifacts.push({ phase: 'confidence-analysis', output: confidenceAnalysis });

  // Phase 11: Forecast Accuracy Measurement
  const accuracyMeasurement = await ctx.task(measureAccuracy, {
    forecastReconciliation,
    historicalData,
    forecastingPolicy
  });
  artifacts.push({ phase: 'accuracy-measurement', output: accuracyMeasurement });

  // Phase 12: Demand Insights Generation
  const demandInsights = await ctx.task(generateDemandInsights, {
    patternAnalysis,
    causalFactors,
    forecastReconciliation,
    accuracyMeasurement
  });
  artifacts.push({ phase: 'demand-insights', output: demandInsights });

  // Final Quality Gate: Forecast Approval
  await ctx.breakpoint('forecast-approval', {
    title: 'Demand Forecast Approval',
    description: 'Final approval of demand forecasts for planning use',
    artifacts: [forecastReconciliation, confidenceAnalysis, demandInsights]
  });

  return {
    success: true,
    forecasts: {
      shortTerm: forecastReconciliation.shortTerm,
      mediumTerm: forecastReconciliation.mediumTerm,
      longTerm: forecastReconciliation.longTerm
    },
    forecastAnalytics: {
      accuracy: accuracyMeasurement,
      bias: accuracyMeasurement.biasAnalysis,
      confidence: confidenceAnalysis
    },
    demandInsights,
    processMetrics: {
      forecastValueAdd: accuracyMeasurement.valueAdd,
      consensusVariance: forecastReconciliation.consensusVariance,
      accuracyTrend: accuracyMeasurement.trend
    },
    artifacts,
    metadata: {
      processId: 'demand-forecasting',
      startTime,
      endTime: ctx.now(),
      organizationContext,
      forecastScope
    }
  };
}

export const assessDataQuality = defineTask('assess-data-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Data Quality',
  agent: {
    name: 'data-quality-analyst',
    prompt: {
      role: 'Data quality specialist for demand forecasting',
      task: 'Assess the quality of historical data for forecasting',
      context: {
        historicalData: args.historicalData,
        forecastScope: args.forecastScope
      },
      instructions: [
        'Check data completeness and coverage',
        'Identify missing data points and gaps',
        'Detect outliers and anomalies',
        'Validate data consistency across sources',
        'Assess data recency and relevance',
        'Recommend data cleansing actions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        completenessScore: { type: 'number' },
        missingData: { type: 'array' },
        outliers: { type: 'array' },
        consistencyIssues: { type: 'array' },
        recencyAssessment: { type: 'object' },
        cleansingRecommendations: { type: 'array' }
      },
      required: ['completenessScore', 'outliers', 'cleansingRecommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-quality', 'assessment']
}));

export const analyzeDemandPatterns = defineTask('analyze-demand-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Demand Patterns',
  agent: {
    name: 'pattern-analyst',
    prompt: {
      role: 'Demand pattern analysis specialist',
      task: 'Identify and characterize demand patterns',
      context: {
        historicalData: args.historicalData,
        dataQuality: args.dataQuality,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Detect seasonality patterns',
        'Identify trend components',
        'Analyze cyclical patterns',
        'Classify demand variability',
        'Identify demand segments',
        'Document pattern characteristics'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        seasonalityPatterns: { type: 'object' },
        trendAnalysis: { type: 'object' },
        cyclicalPatterns: { type: 'array' },
        variabilityClassification: { type: 'object' },
        demandSegments: { type: 'array' },
        patternCharacteristics: { type: 'object' }
      },
      required: ['seasonalityPatterns', 'trendAnalysis', 'variabilityClassification']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pattern', 'analysis']
}));

export const identifyCausalFactors = defineTask('identify-causal-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Causal Factors',
  agent: {
    name: 'causal-analyst',
    prompt: {
      role: 'Causal analysis specialist',
      task: 'Identify factors that drive demand variation',
      context: {
        historicalData: args.historicalData,
        marketData: args.marketData,
        patternAnalysis: args.patternAnalysis
      },
      instructions: [
        'Analyze correlation with economic indicators',
        'Assess promotional impact coefficients',
        'Evaluate pricing elasticity',
        'Identify competitive effects',
        'Analyze weather and seasonal drivers',
        'Quantify causal factor impacts'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        economicDrivers: { type: 'object' },
        promotionalCoefficients: { type: 'object' },
        priceElasticity: { type: 'object' },
        competitiveEffects: { type: 'object' },
        externalDrivers: { type: 'array' },
        impactQuantification: { type: 'object' }
      },
      required: ['economicDrivers', 'promotionalCoefficients', 'impactQuantification']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'causal', 'drivers']
}));

export const generateStatisticalBaseline = defineTask('generate-statistical-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Statistical Baseline',
  agent: {
    name: 'statistical-forecaster',
    prompt: {
      role: 'Statistical forecasting specialist',
      task: 'Generate baseline statistical forecasts',
      context: {
        historicalData: args.historicalData,
        patternAnalysis: args.patternAnalysis,
        forecastingPolicy: args.forecastingPolicy,
        forecastScope: args.forecastScope
      },
      instructions: [
        'Select appropriate forecasting methods',
        'Apply time series decomposition',
        'Generate forecasts at required granularity',
        'Calculate forecast error metrics',
        'Compare method performance',
        'Select best-fit models'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        baselineForecasts: { type: 'object' },
        methodsApplied: { type: 'array' },
        decomposition: { type: 'object' },
        errorMetrics: { type: 'object' },
        methodComparison: { type: 'object' },
        selectedModels: { type: 'object' }
      },
      required: ['baselineForecasts', 'methodsApplied', 'errorMetrics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'statistical', 'forecasting']
}));

export const enhanceWithML = defineTask('enhance-with-ml', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enhance with ML/AI',
  agent: {
    name: 'ml-forecaster',
    prompt: {
      role: 'Machine learning forecasting specialist',
      task: 'Enhance forecasts using ML/AI methods',
      context: {
        statisticalBaseline: args.statisticalBaseline,
        causalFactors: args.causalFactors,
        historicalData: args.historicalData,
        forecastingPolicy: args.forecastingPolicy
      },
      instructions: [
        'Apply ML algorithms for pattern detection',
        'Incorporate causal factors in models',
        'Generate ensemble forecasts',
        'Compare ML vs statistical accuracy',
        'Identify ML value-add scenarios',
        'Document model performance'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        mlForecasts: { type: 'object' },
        algorithmsUsed: { type: 'array' },
        ensembleForecast: { type: 'object' },
        accuracyComparison: { type: 'object' },
        valueAddScenarios: { type: 'array' },
        modelPerformance: { type: 'object' }
      },
      required: ['mlForecasts', 'ensembleForecast', 'accuracyComparison']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'ai-forecasting']
}));

export const integrateMarketIntelligence = defineTask('integrate-market-intelligence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Market Intelligence',
  agent: {
    name: 'market-intelligence-integrator',
    prompt: {
      role: 'Market intelligence integration specialist',
      task: 'Integrate market intelligence into forecasts',
      context: {
        mlEnhancement: args.mlEnhancement,
        marketData: args.marketData,
        organizationContext: args.organizationContext
      },
      instructions: [
        'Incorporate economic outlook adjustments',
        'Add competitive intelligence impacts',
        'Include market trend adjustments',
        'Factor in regulatory changes',
        'Add industry-specific events',
        'Document intelligence sources'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        adjustedForecast: { type: 'object' },
        economicAdjustments: { type: 'object' },
        competitiveAdjustments: { type: 'object' },
        trendAdjustments: { type: 'object' },
        eventAdjustments: { type: 'array' },
        intelligenceSources: { type: 'array' }
      },
      required: ['adjustedForecast', 'economicAdjustments']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'market', 'intelligence']
}));

export const modelPromotionalImpact = defineTask('model-promotional-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model Promotional Impact',
  agent: {
    name: 'promotional-modeler',
    prompt: {
      role: 'Promotional forecasting specialist',
      task: 'Model and forecast promotional demand impacts',
      context: {
        marketIntegration: args.marketIntegration,
        historicalData: args.historicalData,
        forecastScope: args.forecastScope
      },
      instructions: [
        'Analyze historical promotional lifts',
        'Model promotional cannibalization',
        'Forecast pantry loading effects',
        'Calculate promotional baselines',
        'Project planned promotion impacts',
        'Document promotional assumptions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        promotionalLifts: { type: 'object' },
        cannibalizationEffects: { type: 'object' },
        pantryLoadingEffects: { type: 'object' },
        promotionalBaselines: { type: 'object' },
        plannedPromotionImpact: { type: 'object' },
        assumptions: { type: 'array' }
      },
      required: ['promotionalLifts', 'plannedPromotionImpact']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'promotional', 'modeling']
}));

export const forecastNewProducts = defineTask('forecast-new-products', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast New Products',
  agent: {
    name: 'new-product-forecaster',
    prompt: {
      role: 'New product forecasting specialist',
      task: 'Generate forecasts for new products',
      context: {
        marketIntegration: args.marketIntegration,
        patternAnalysis: args.patternAnalysis,
        marketData: args.marketData
      },
      instructions: [
        'Identify analogous products for benchmarking',
        'Apply diffusion curve models',
        'Incorporate launch plans',
        'Model distribution build',
        'Factor market test results',
        'Document uncertainty ranges'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        newProductForecasts: { type: 'array' },
        analogousProducts: { type: 'array' },
        diffusionCurves: { type: 'object' },
        launchPlanImpact: { type: 'object' },
        distributionBuild: { type: 'object' },
        uncertaintyRanges: { type: 'object' }
      },
      required: ['newProductForecasts', 'uncertaintyRanges']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'new-product', 'forecasting']
}));

export const reconcileForecasts = defineTask('reconcile-forecasts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconcile Forecasts',
  agent: {
    name: 'forecast-reconciler',
    prompt: {
      role: 'Forecast reconciliation specialist',
      task: 'Reconcile multiple forecast inputs into consensus',
      context: {
        statisticalBaseline: args.statisticalBaseline,
        mlEnhancement: args.mlEnhancement,
        marketIntegration: args.marketIntegration,
        promotionalImpact: args.promotionalImpact,
        newProductForecast: args.newProductForecast,
        forecastScope: args.forecastScope
      },
      instructions: [
        'Combine forecast components',
        'Reconcile across time horizons',
        'Balance top-down and bottom-up',
        'Create consensus forecast',
        'Document reconciliation adjustments',
        'Calculate consensus variance'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        shortTerm: { type: 'object' },
        mediumTerm: { type: 'object' },
        longTerm: { type: 'object' },
        reconciliationAdjustments: { type: 'array' },
        consensusVariance: { type: 'number' },
        reconciliationNotes: { type: 'array' }
      },
      required: ['shortTerm', 'mediumTerm', 'longTerm', 'consensusVariance']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reconciliation', 'consensus']
}));

export const calculateConfidence = defineTask('calculate-confidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate Confidence Intervals',
  agent: {
    name: 'confidence-analyst',
    prompt: {
      role: 'Statistical confidence analysis specialist',
      task: 'Calculate confidence intervals for forecasts',
      context: {
        forecastReconciliation: args.forecastReconciliation,
        historicalData: args.historicalData,
        dataQuality: args.dataQuality
      },
      instructions: [
        'Calculate prediction intervals',
        'Assess forecast uncertainty',
        'Generate confidence bands',
        'Identify high-uncertainty items',
        'Create risk-adjusted ranges',
        'Document confidence methodology'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        predictionIntervals: { type: 'object' },
        uncertaintyAssessment: { type: 'object' },
        confidenceBands: { type: 'object' },
        highUncertaintyItems: { type: 'array' },
        riskAdjustedRanges: { type: 'object' },
        methodology: { type: 'string' }
      },
      required: ['predictionIntervals', 'confidenceBands', 'highUncertaintyItems']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'confidence', 'intervals']
}));

export const measureAccuracy = defineTask('measure-accuracy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measure Forecast Accuracy',
  agent: {
    name: 'accuracy-analyst',
    prompt: {
      role: 'Forecast accuracy measurement specialist',
      task: 'Measure and analyze forecast accuracy',
      context: {
        forecastReconciliation: args.forecastReconciliation,
        historicalData: args.historicalData,
        forecastingPolicy: args.forecastingPolicy
      },
      instructions: [
        'Calculate MAPE, WMAPE, bias',
        'Analyze accuracy by segment',
        'Track accuracy over time',
        'Identify systematic errors',
        'Calculate forecast value add',
        'Benchmark against targets'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        mape: { type: 'number' },
        wmape: { type: 'number' },
        biasAnalysis: { type: 'object' },
        segmentAccuracy: { type: 'object' },
        trend: { type: 'object' },
        systematicErrors: { type: 'array' },
        valueAdd: { type: 'number' },
        benchmarkComparison: { type: 'object' }
      },
      required: ['mape', 'wmape', 'biasAnalysis', 'valueAdd']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accuracy', 'measurement']
}));

export const generateDemandInsights = defineTask('generate-demand-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Demand Insights',
  agent: {
    name: 'insights-generator',
    prompt: {
      role: 'Demand insights analyst',
      task: 'Generate actionable demand insights',
      context: {
        patternAnalysis: args.patternAnalysis,
        causalFactors: args.causalFactors,
        forecastReconciliation: args.forecastReconciliation,
        accuracyMeasurement: args.accuracyMeasurement
      },
      instructions: [
        'Identify key demand drivers',
        'Highlight emerging patterns',
        'Flag significant anomalies',
        'Identify improvement opportunities',
        'Generate actionable recommendations',
        'Create insight summary report'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        drivers: { type: 'array' },
        patterns: { type: 'array' },
        anomalies: { type: 'array' },
        improvementOpportunities: { type: 'array' },
        recommendations: { type: 'array' },
        insightSummary: { type: 'string' }
      },
      required: ['drivers', 'patterns', 'anomalies', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'insights', 'demand']
}));

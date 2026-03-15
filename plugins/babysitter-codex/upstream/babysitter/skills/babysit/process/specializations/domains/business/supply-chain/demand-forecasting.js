/**
 * @process specializations/domains/business/supply-chain/demand-forecasting
 * @description Demand Forecasting and Planning - Generate statistical demand forecasts using historical data,
 * market intelligence, and demand signals with continuous accuracy improvement.
 * @inputs { historicalDataPath?: string, planningHorizon?: string, forecastGranularity?: string, productCategories?: array }
 * @outputs { success: boolean, forecasts: object, accuracy: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/demand-forecasting', {
 *   historicalDataPath: '/data/sales-history.csv',
 *   planningHorizon: '12-months',
 *   forecastGranularity: 'weekly',
 *   productCategories: ['electronics', 'apparel']
 * });
 *
 * @references
 * - ASCM CPIM Certification: https://www.ascm.org/learning-development/certifications-credentials/cpim/
 * - Demand Planning Best Practices: https://www.gartner.com/en/supply-chain
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    historicalDataPath = '',
    planningHorizon = '12-months',
    forecastGranularity = 'weekly',
    productCategories = [],
    includeSeasonality = true,
    includeTrendAnalysis = true,
    confidenceInterval = 95,
    demandSignals = [],
    marketIntelligence = {},
    outputDir = 'demand-forecast-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Demand Forecasting and Planning Process');

  // ============================================================================
  // PHASE 1: DATA COLLECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting and validating historical data');

  const dataCollection = await ctx.task(dataCollectionTask, {
    historicalDataPath,
    productCategories,
    demandSignals,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  if (!dataCollection.dataValid) {
    return {
      success: false,
      error: 'Data validation failed',
      details: dataCollection.validationIssues,
      metadata: { processId: 'supply-chain/demand-forecasting', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 2: DEMAND PATTERN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing demand patterns and seasonality');

  const patternAnalysis = await ctx.task(demandPatternAnalysisTask, {
    dataCollection,
    includeSeasonality,
    includeTrendAnalysis,
    productCategories,
    outputDir
  });

  artifacts.push(...patternAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: MARKET INTELLIGENCE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Integrating market intelligence');

  const marketIntegration = await ctx.task(marketIntelligenceIntegrationTask, {
    patternAnalysis,
    marketIntelligence,
    demandSignals,
    productCategories,
    outputDir
  });

  artifacts.push(...marketIntegration.artifacts);

  // ============================================================================
  // PHASE 4: FORECAST MODEL SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Selecting optimal forecast models');

  const modelSelection = await ctx.task(forecastModelSelectionTask, {
    patternAnalysis,
    marketIntegration,
    planningHorizon,
    forecastGranularity,
    outputDir
  });

  artifacts.push(...modelSelection.artifacts);

  // ============================================================================
  // PHASE 5: STATISTICAL FORECAST GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating statistical forecasts');

  const forecastGeneration = await ctx.task(forecastGenerationTask, {
    dataCollection,
    patternAnalysis,
    modelSelection,
    planningHorizon,
    forecastGranularity,
    confidenceInterval,
    productCategories,
    outputDir
  });

  artifacts.push(...forecastGeneration.artifacts);

  // ============================================================================
  // PHASE 6: FORECAST ACCURACY MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Measuring forecast accuracy');

  const accuracyMeasurement = await ctx.task(accuracyMeasurementTask, {
    forecastGeneration,
    dataCollection,
    outputDir
  });

  artifacts.push(...accuracyMeasurement.artifacts);

  // Breakpoint: Review forecast results
  await ctx.breakpoint({
    question: `Demand forecasts generated. Overall MAPE: ${accuracyMeasurement.mape}%. Forecast bias: ${accuracyMeasurement.bias}%. Review forecast accuracy and adjust models?`,
    title: 'Demand Forecast Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        planningHorizon,
        forecastGranularity,
        productsForecasted: forecastGeneration.productsForecasted,
        mape: accuracyMeasurement.mape,
        bias: accuracyMeasurement.bias,
        confidenceInterval
      }
    }
  });

  // ============================================================================
  // PHASE 7: FORECAST IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating improvement recommendations');

  const improvementRecommendations = await ctx.task(improvementRecommendationsTask, {
    forecastGeneration,
    accuracyMeasurement,
    patternAnalysis,
    outputDir
  });

  artifacts.push(...improvementRecommendations.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    forecasts: {
      planningHorizon,
      forecastGranularity,
      productsForecasted: forecastGeneration.productsForecasted,
      forecastSummary: forecastGeneration.forecastSummary,
      demandProjections: forecastGeneration.demandProjections
    },
    accuracy: {
      mape: accuracyMeasurement.mape,
      wmape: accuracyMeasurement.wmape,
      bias: accuracyMeasurement.bias,
      accuracyByCategory: accuracyMeasurement.accuracyByCategory
    },
    patterns: {
      seasonalityDetected: patternAnalysis.seasonalityDetected,
      trendDirection: patternAnalysis.trendDirection,
      demandVolatility: patternAnalysis.demandVolatility
    },
    recommendations: improvementRecommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/demand-forecasting',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Data Collection and Validation',
  agent: {
    name: 'demand-planning-analyst',
    prompt: {
      role: 'Demand Planning Analyst',
      task: 'Collect and validate historical demand data for forecasting',
      context: args,
      instructions: [
        '1. Load historical sales/demand data from specified path',
        '2. Validate data completeness (check for gaps)',
        '3. Identify data quality issues (outliers, anomalies)',
        '4. Cleanse data by handling missing values',
        '5. Aggregate data by product category if needed',
        '6. Integrate external demand signals (promotions, events)',
        '7. Document data sources and quality metrics',
        '8. Save validated dataset'
      ],
      outputFormat: 'JSON with data validation results and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataValid', 'artifacts'],
      properties: {
        dataValid: { type: 'boolean' },
        recordCount: { type: 'number' },
        dateRange: { type: 'object' },
        validationIssues: { type: 'array', items: { type: 'string' } },
        dataQualityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'demand-forecasting', 'data-collection']
}));

export const demandPatternAnalysisTask = defineTask('demand-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Demand Pattern Analysis',
  agent: {
    name: 'demand-analyst',
    prompt: {
      role: 'Demand Pattern Analyst',
      task: 'Analyze historical demand patterns including seasonality and trends',
      context: args,
      instructions: [
        '1. Decompose time series into trend, seasonal, and residual components',
        '2. Identify seasonal patterns (weekly, monthly, quarterly, yearly)',
        '3. Detect trend direction and strength',
        '4. Calculate demand volatility by product/category',
        '5. Identify cyclical patterns',
        '6. Detect structural breaks in demand patterns',
        '7. Classify products by demand pattern (stable, seasonal, erratic)',
        '8. Document findings and visualizations'
      ],
      outputFormat: 'JSON with pattern analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['seasonalityDetected', 'trendDirection', 'artifacts'],
      properties: {
        seasonalityDetected: { type: 'boolean' },
        seasonalPatterns: { type: 'array' },
        trendDirection: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
        demandVolatility: { type: 'object' },
        patternClassification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'demand-forecasting', 'pattern-analysis']
}));

export const marketIntelligenceIntegrationTask = defineTask('market-intelligence-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Market Intelligence Integration',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'Market Intelligence Analyst',
      task: 'Integrate market intelligence and demand signals into forecasting',
      context: args,
      instructions: [
        '1. Analyze provided market intelligence data',
        '2. Identify relevant demand drivers (promotions, events, economic factors)',
        '3. Quantify impact of demand signals on historical demand',
        '4. Incorporate competitor intelligence if available',
        '5. Assess macroeconomic factors affecting demand',
        '6. Identify leading indicators for demand changes',
        '7. Create adjustment factors for forecast models',
        '8. Document market assumptions'
      ],
      outputFormat: 'JSON with market intelligence integration results'
    },
    outputSchema: {
      type: 'object',
      required: ['demandDrivers', 'adjustmentFactors', 'artifacts'],
      properties: {
        demandDrivers: { type: 'array' },
        adjustmentFactors: { type: 'object' },
        marketAssumptions: { type: 'array' },
        leadingIndicators: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'demand-forecasting', 'market-intelligence']
}));

export const forecastModelSelectionTask = defineTask('forecast-model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Forecast Model Selection',
  agent: {
    name: 'forecasting-specialist',
    prompt: {
      role: 'Forecasting Specialist',
      task: 'Select optimal forecasting models based on demand patterns',
      context: args,
      instructions: [
        '1. Evaluate candidate models (ARIMA, ETS, Prophet, ML models)',
        '2. Match models to demand pattern characteristics',
        '3. Consider data requirements for each model',
        '4. Evaluate model complexity vs. interpretability trade-offs',
        '5. Select primary and backup models by product segment',
        '6. Define model parameters and hyperparameters',
        '7. Set up model ensemble if beneficial',
        '8. Document model selection rationale'
      ],
      outputFormat: 'JSON with model selection results'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedModels', 'modelRationale', 'artifacts'],
      properties: {
        selectedModels: { type: 'object' },
        modelRationale: { type: 'object' },
        modelParameters: { type: 'object' },
        ensembleStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'demand-forecasting', 'model-selection']
}));

export const forecastGenerationTask = defineTask('forecast-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Statistical Forecast Generation',
  agent: {
    name: 'forecast-generator',
    prompt: {
      role: 'Statistical Forecaster',
      task: 'Generate demand forecasts using selected models',
      context: args,
      instructions: [
        '1. Train selected models on historical data',
        '2. Generate point forecasts for planning horizon',
        '3. Calculate prediction intervals at specified confidence level',
        '4. Apply market intelligence adjustments',
        '5. Generate forecasts at required granularity',
        '6. Aggregate forecasts to higher levels (category, region)',
        '7. Create forecast waterfall (base + adjustments)',
        '8. Save detailed forecast outputs'
      ],
      outputFormat: 'JSON with forecast results'
    },
    outputSchema: {
      type: 'object',
      required: ['productsForecasted', 'forecastSummary', 'demandProjections', 'artifacts'],
      properties: {
        productsForecasted: { type: 'number' },
        forecastSummary: { type: 'object' },
        demandProjections: { type: 'array' },
        predictionIntervals: { type: 'object' },
        forecastWaterfall: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'demand-forecasting', 'forecast-generation']
}));

export const accuracyMeasurementTask = defineTask('accuracy-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Forecast Accuracy Measurement',
  agent: {
    name: 'accuracy-analyst',
    prompt: {
      role: 'Forecast Accuracy Analyst',
      task: 'Measure and analyze forecast accuracy metrics',
      context: args,
      instructions: [
        '1. Calculate MAPE (Mean Absolute Percentage Error)',
        '2. Calculate WMAPE (Weighted MAPE)',
        '3. Calculate forecast bias (systematic over/under-forecasting)',
        '4. Calculate accuracy by product category',
        '5. Compare accuracy to targets and benchmarks',
        '6. Identify products with poor accuracy',
        '7. Analyze forecast error patterns',
        '8. Document accuracy metrics and trends'
      ],
      outputFormat: 'JSON with accuracy metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['mape', 'bias', 'artifacts'],
      properties: {
        mape: { type: 'number' },
        wmape: { type: 'number' },
        bias: { type: 'number' },
        accuracyByCategory: { type: 'object' },
        lowAccuracyProducts: { type: 'array' },
        errorPatterns: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'demand-forecasting', 'accuracy']
}));

export const improvementRecommendationsTask = defineTask('improvement-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Forecast Improvement Recommendations',
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'Demand Planning Advisor',
      task: 'Generate recommendations to improve forecast accuracy',
      context: args,
      instructions: [
        '1. Analyze root causes of forecast errors',
        '2. Recommend model improvements',
        '3. Identify additional data sources needed',
        '4. Suggest process improvements',
        '5. Recommend segmentation changes',
        '6. Identify automation opportunities',
        '7. Prioritize recommendations by impact',
        '8. Create improvement action plan'
      ],
      outputFormat: 'JSON with improvement recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        rootCauseAnalysis: { type: 'object' },
        actionPlan: { type: 'array' },
        expectedImprovements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'demand-forecasting', 'improvement']
}));

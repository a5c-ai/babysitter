/**
 * @process specializations/domains/business/logistics/demand-forecasting
 * @description AI-powered demand prediction using historical data, market signals, and external factors to improve forecast accuracy and inventory planning.
 * @inputs { salesHistory: array, products: array, externalFactors?: object, forecastHorizon?: number }
 * @outputs { success: boolean, forecasts: array, accuracy: object, confidenceIntervals: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/demand-forecasting', {
 *   salesHistory: [{ sku: 'SKU001', date: '2024-01-01', quantity: 100 }],
 *   products: [{ sku: 'SKU001', category: 'Electronics' }],
 *   forecastHorizon: 12
 * });
 *
 * @references
 * - MIT Supply Chain: https://www.edx.org/micromasters/mitx-supply-chain-management
 * - Forecasting Best Practices: https://www.ascm.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    salesHistory = [],
    products = [],
    externalFactors = {},
    forecastHorizon = 12,
    forecastMethod = 'ensemble', // 'moving-average', 'exponential-smoothing', 'arima', 'ml', 'ensemble'
    outputDir = 'demand-forecasting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Demand Forecasting Process');
  ctx.log('info', `Products: ${products.length}, Horizon: ${forecastHorizon} periods, Method: ${forecastMethod}`);

  // PHASE 1: DATA PREPARATION AND CLEANSING
  ctx.log('info', 'Phase 1: Preparing and cleansing data');
  const dataPrep = await ctx.task(forecastDataPrepTask, { salesHistory, products, outputDir });
  artifacts.push(...dataPrep.artifacts);

  // PHASE 2: DEMAND PATTERN ANALYSIS
  ctx.log('info', 'Phase 2: Analyzing demand patterns');
  const patternAnalysis = await ctx.task(demandPatternAnalysisTask, {
    preparedData: dataPrep.cleanedData,
    outputDir
  });
  artifacts.push(...patternAnalysis.artifacts);

  // PHASE 3: SEASONALITY AND TREND DETECTION
  ctx.log('info', 'Phase 3: Detecting seasonality and trends');
  const seasonalityAnalysis = await ctx.task(seasonalityAnalysisTask, {
    preparedData: dataPrep.cleanedData,
    patterns: patternAnalysis.patterns,
    outputDir
  });
  artifacts.push(...seasonalityAnalysis.artifacts);

  // PHASE 4: EXTERNAL FACTORS INTEGRATION
  ctx.log('info', 'Phase 4: Integrating external factors');
  const externalIntegration = await ctx.task(externalFactorsTask, {
    preparedData: dataPrep.cleanedData,
    externalFactors,
    outputDir
  });
  artifacts.push(...externalIntegration.artifacts);

  // PHASE 5: MODEL SELECTION AND TRAINING
  ctx.log('info', 'Phase 5: Selecting and training forecast models');
  const modelTraining = await ctx.task(modelTrainingTask, {
    preparedData: dataPrep.cleanedData,
    patternAnalysis,
    seasonalityAnalysis,
    forecastMethod,
    outputDir
  });
  artifacts.push(...modelTraining.artifacts);

  // PHASE 6: FORECAST GENERATION
  ctx.log('info', 'Phase 6: Generating forecasts');
  const forecastGeneration = await ctx.task(forecastGenerationTask, {
    trainedModels: modelTraining.models,
    forecastHorizon,
    externalFactors: externalIntegration.integratedFactors,
    outputDir
  });
  artifacts.push(...forecastGeneration.artifacts);

  // Quality Gate: Review forecast results
  await ctx.breakpoint({
    question: `Forecasts generated for ${forecastGeneration.forecasts.length} products. Average MAPE: ${modelTraining.metrics.averageMAPE}%. Review forecasts?`,
    title: 'Forecast Review',
    context: {
      runId: ctx.runId,
      summary: {
        productsForecasted: forecastGeneration.forecasts.length,
        averageMAPE: `${modelTraining.metrics.averageMAPE}%`,
        forecastHorizon
      },
      files: forecastGeneration.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 7: CONFIDENCE INTERVALS AND UNCERTAINTY
  ctx.log('info', 'Phase 7: Calculating confidence intervals');
  const confidenceCalc = await ctx.task(confidenceIntervalTask, {
    forecasts: forecastGeneration.forecasts,
    modelMetrics: modelTraining.metrics,
    outputDir
  });
  artifacts.push(...confidenceCalc.artifacts);

  // PHASE 8: FORECAST ACCURACY ASSESSMENT
  ctx.log('info', 'Phase 8: Assessing forecast accuracy');
  const accuracyAssessment = await ctx.task(accuracyAssessmentTask, {
    forecasts: forecastGeneration.forecasts,
    actualData: dataPrep.cleanedData,
    outputDir
  });
  artifacts.push(...accuracyAssessment.artifacts);

  // PHASE 9: BIAS DETECTION AND CORRECTION
  ctx.log('info', 'Phase 9: Detecting and correcting bias');
  const biasCorrection = await ctx.task(biasCorrectionTask, {
    forecasts: forecastGeneration.forecasts,
    accuracyMetrics: accuracyAssessment.metrics,
    outputDir
  });
  artifacts.push(...biasCorrection.artifacts);

  // PHASE 10: GENERATE FORECAST REPORT
  ctx.log('info', 'Phase 10: Generating forecast report');
  const forecastReport = await ctx.task(forecastReportTask, {
    forecasts: biasCorrection.correctedForecasts,
    accuracy: accuracyAssessment.metrics,
    confidenceIntervals: confidenceCalc.intervals,
    patternAnalysis,
    seasonalityAnalysis,
    outputDir
  });
  artifacts.push(...forecastReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Demand forecasting complete. ${forecastGeneration.forecasts.length} products forecasted with ${accuracyAssessment.metrics.overallMAPE}% MAPE. Approve forecasts?`,
    title: 'Demand Forecasting Complete',
    context: {
      runId: ctx.runId,
      summary: {
        productsForecasted: forecastGeneration.forecasts.length,
        forecastHorizon: `${forecastHorizon} periods`,
        overallMAPE: `${accuracyAssessment.metrics.overallMAPE}%`,
        biasDetected: biasCorrection.biasDetected,
        forecastMethod
      },
      files: [{ path: forecastReport.reportPath, format: 'markdown', label: 'Forecast Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    forecasts: biasCorrection.correctedForecasts,
    accuracy: accuracyAssessment.metrics,
    confidenceIntervals: confidenceCalc.intervals,
    recommendations: forecastReport.recommendations,
    patterns: patternAnalysis.patterns,
    seasonality: seasonalityAnalysis.seasonalFactors,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/demand-forecasting', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const forecastDataPrepTask = defineTask('forecast-data-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare and cleanse data',
  agent: {
    name: 'forecast-data-specialist',
    prompt: {
      role: 'Forecast Data Preparation Specialist',
      task: 'Prepare and cleanse sales data for forecasting',
      context: args,
      instructions: ['Handle missing data', 'Remove outliers', 'Aggregate to forecast periods', 'Handle promotions/events', 'Normalize data', 'Generate data quality report']
    },
    outputSchema: { type: 'object', required: ['cleanedData', 'artifacts'], properties: { cleanedData: { type: 'array' }, dataQuality: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'data-prep']
}));

export const demandPatternAnalysisTask = defineTask('demand-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze demand patterns',
  agent: {
    name: 'demand-pattern-analyst',
    prompt: {
      role: 'Demand Pattern Analyst',
      task: 'Analyze demand patterns for forecast model selection',
      context: args,
      instructions: ['Classify demand patterns', 'Identify intermittent demand', 'Detect lumpy demand', 'Analyze volatility', 'Recommend forecast methods', 'Generate pattern report']
    },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'object' }, patternClassification: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'pattern-analysis']
}));

export const seasonalityAnalysisTask = defineTask('seasonality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect seasonality and trends',
  agent: {
    name: 'seasonality-analyst',
    prompt: {
      role: 'Seasonality Analysis Specialist',
      task: 'Detect and quantify seasonality and trends',
      context: args,
      instructions: ['Decompose time series', 'Calculate seasonal indices', 'Identify trend direction', 'Detect cyclical patterns', 'Calculate seasonal factors', 'Generate seasonality report']
    },
    outputSchema: { type: 'object', required: ['seasonalFactors', 'trend', 'artifacts'], properties: { seasonalFactors: { type: 'object' }, trend: { type: 'object' }, cyclicalPatterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'seasonality']
}));

export const externalFactorsTask = defineTask('external-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate external factors',
  agent: {
    name: 'external-factors-specialist',
    prompt: {
      role: 'External Factors Integration Specialist',
      task: 'Integrate external factors into demand model',
      context: args,
      instructions: ['Process economic indicators', 'Incorporate weather data', 'Add promotional calendars', 'Include competitor data', 'Calculate factor correlations', 'Generate factor integration report']
    },
    outputSchema: { type: 'object', required: ['integratedFactors', 'artifacts'], properties: { integratedFactors: { type: 'object' }, factorCorrelations: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'external-factors']
}));

export const modelTrainingTask = defineTask('model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Train forecast models',
  agent: {
    name: 'forecast-model-trainer',
    prompt: {
      role: 'Forecast Model Training Specialist',
      task: 'Select and train appropriate forecast models',
      context: args,
      instructions: ['Select model by pattern type', 'Train multiple models', 'Tune hyperparameters', 'Cross-validate models', 'Calculate accuracy metrics', 'Generate model performance report']
    },
    outputSchema: { type: 'object', required: ['models', 'metrics', 'artifacts'], properties: { models: { type: 'array' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'model-training']
}));

export const forecastGenerationTask = defineTask('forecast-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate forecasts',
  agent: {
    name: 'forecast-generator',
    prompt: {
      role: 'Forecast Generation Specialist',
      task: 'Generate demand forecasts',
      context: args,
      instructions: ['Generate point forecasts', 'Apply external factors', 'Combine ensemble models', 'Generate by period', 'Apply business rules', 'Generate forecast dataset']
    },
    outputSchema: { type: 'object', required: ['forecasts', 'artifacts'], properties: { forecasts: { type: 'array' }, forecastSummary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'generation']
}));

export const confidenceIntervalTask = defineTask('confidence-interval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate confidence intervals',
  agent: {
    name: 'confidence-interval-specialist',
    prompt: {
      role: 'Confidence Interval Specialist',
      task: 'Calculate forecast confidence intervals',
      context: args,
      instructions: ['Calculate prediction intervals', 'Compute 80% and 95% intervals', 'Factor in model uncertainty', 'Adjust for horizon length', 'Document assumptions', 'Generate interval report']
    },
    outputSchema: { type: 'object', required: ['intervals', 'artifacts'], properties: { intervals: { type: 'array' }, uncertaintyMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'confidence']
}));

export const accuracyAssessmentTask = defineTask('accuracy-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess forecast accuracy',
  agent: {
    name: 'accuracy-assessment-specialist',
    prompt: {
      role: 'Forecast Accuracy Specialist',
      task: 'Assess forecast accuracy metrics',
      context: args,
      instructions: ['Calculate MAPE', 'Calculate MAE', 'Calculate RMSE', 'Calculate bias', 'Analyze by product/category', 'Generate accuracy report']
    },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'object' }, accuracyByCategory: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'accuracy']
}));

export const biasCorrectionTask = defineTask('bias-correction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect and correct bias',
  agent: {
    name: 'bias-correction-specialist',
    prompt: {
      role: 'Forecast Bias Correction Specialist',
      task: 'Detect and correct forecast bias',
      context: args,
      instructions: ['Detect systematic bias', 'Analyze bias patterns', 'Apply bias corrections', 'Validate corrections', 'Document adjustments', 'Generate bias report']
    },
    outputSchema: { type: 'object', required: ['correctedForecasts', 'biasDetected', 'artifacts'], properties: { correctedForecasts: { type: 'array' }, biasDetected: { type: 'boolean' }, biasCorrections: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'bias-correction']
}));

export const forecastReportTask = defineTask('forecast-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate forecast report',
  agent: {
    name: 'forecast-report-specialist',
    prompt: {
      role: 'Forecast Report Specialist',
      task: 'Generate comprehensive demand forecast report',
      context: args,
      instructions: ['Summarize forecasts', 'Present accuracy metrics', 'Document methodology', 'Include visualizations', 'Provide recommendations', 'Generate executive report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'recommendations', 'artifacts'], properties: { reportPath: { type: 'string' }, recommendations: { type: 'array' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'demand-forecasting', 'reporting']
}));

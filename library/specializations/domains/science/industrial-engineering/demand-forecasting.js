/**
 * @process domains/science/industrial-engineering/demand-forecasting
 * @description Demand Forecasting Model Development - Develop and implement demand forecasting models using statistical
 * and machine learning methods to improve inventory planning and supply chain responsiveness.
 * @inputs { productData: string, historicalPeriods?: number, forecastHorizon?: number }
 * @outputs { success: boolean, forecastModel: object, accuracy: object, forecasts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/demand-forecasting', {
 *   productData: 'SKU-12345 sales history',
 *   historicalPeriods: 24,
 *   forecastHorizon: 12
 * });
 *
 * @references
 * - Hyndman & Athanasopoulos, Forecasting: Principles and Practice
 * - Makridakis et al., Forecasting Methods and Applications
 * - Armstrong, Principles of Forecasting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productData,
    historicalPeriods = 24,
    forecastHorizon = 12,
    granularity = 'monthly',
    outputDir = 'demand-forecast-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Demand Forecasting Model Development process');

  // Task 1: Data Collection and Cleansing
  ctx.log('info', 'Phase 1: Collecting and cleansing historical data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    productData,
    historicalPeriods,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Task 2: Pattern Analysis
  ctx.log('info', 'Phase 2: Identifying demand patterns');
  const patternAnalysis = await ctx.task(patternAnalysisTask, {
    dataCollection,
    outputDir
  });

  artifacts.push(...patternAnalysis.artifacts);

  // Breakpoint: Review patterns
  await ctx.breakpoint({
    question: `Demand patterns identified. Trend: ${patternAnalysis.trendType}. Seasonality: ${patternAnalysis.seasonalityType}. Intermittency: ${patternAnalysis.intermittencyLevel}. Proceed with model selection?`,
    title: 'Demand Pattern Review',
    context: {
      runId: ctx.runId,
      patterns: {
        trend: patternAnalysis.trendType,
        seasonality: patternAnalysis.seasonalityType,
        intermittency: patternAnalysis.intermittencyLevel
      },
      files: patternAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 3: Model Selection
  ctx.log('info', 'Phase 3: Selecting appropriate forecasting models');
  const modelSelection = await ctx.task(modelSelectionTask, {
    patternAnalysis,
    outputDir
  });

  artifacts.push(...modelSelection.artifacts);

  // Task 4: Model Fitting
  ctx.log('info', 'Phase 4: Fitting forecasting models');
  const modelFitting = await ctx.task(modelFittingTask, {
    dataCollection,
    modelSelection,
    outputDir
  });

  artifacts.push(...modelFitting.artifacts);

  // Task 5: Model Evaluation
  ctx.log('info', 'Phase 5: Evaluating forecast accuracy');
  const modelEvaluation = await ctx.task(modelEvaluationTask, {
    modelFitting,
    dataCollection,
    outputDir
  });

  artifacts.push(...modelEvaluation.artifacts);

  // Task 6: Forecast Generation
  ctx.log('info', 'Phase 6: Generating forecasts');
  const forecastGeneration = await ctx.task(forecastGenerationTask, {
    modelFitting,
    modelEvaluation,
    forecastHorizon,
    outputDir
  });

  artifacts.push(...forecastGeneration.artifacts);

  // Task 7: System Implementation
  ctx.log('info', 'Phase 7: Implementing forecasting system');
  const systemImplementation = await ctx.task(systemImplementationTask, {
    modelFitting,
    forecastGeneration,
    outputDir
  });

  artifacts.push(...systemImplementation.artifacts);

  // Task 8: Review Process
  ctx.log('info', 'Phase 8: Establishing forecast review process');
  const reviewProcess = await ctx.task(reviewProcessTask, {
    forecastGeneration,
    modelEvaluation,
    outputDir
  });

  artifacts.push(...reviewProcess.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Forecasting model developed. Best model: ${modelEvaluation.bestModel}. MAPE: ${modelEvaluation.bestMAPE.toFixed(1)}%. ${forecastHorizon} period forecast generated. Review forecasts?`,
    title: 'Demand Forecasting Results',
    context: {
      runId: ctx.runId,
      summary: {
        bestModel: modelEvaluation.bestModel,
        mape: modelEvaluation.bestMAPE,
        forecastHorizon,
        nextPeriodForecast: forecastGeneration.forecasts[0]
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    forecastModel: {
      modelType: modelEvaluation.bestModel,
      parameters: modelFitting.bestModelParams
    },
    accuracy: {
      mape: modelEvaluation.bestMAPE,
      mae: modelEvaluation.bestMAE,
      rmse: modelEvaluation.bestRMSE
    },
    forecasts: forecastGeneration.forecasts,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/demand-forecasting',
      timestamp: startTime,
      forecastHorizon,
      granularity,
      outputDir
    }
  };
}

// Task 1: Data Collection
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and cleanse historical data',
  agent: {
    name: 'data-engineer',
    prompt: {
      role: 'Data Engineer',
      task: 'Collect and cleanse historical demand data',
      context: args,
      instructions: [
        '1. Extract historical demand data',
        '2. Check for missing values',
        '3. Handle outliers appropriately',
        '4. Identify and handle promotions/events',
        '5. Aggregate to desired granularity',
        '6. Check data quality metrics',
        '7. Document data issues found',
        '8. Create clean dataset'
      ],
      outputFormat: 'JSON with cleansed data and quality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'dataQuality', 'artifacts'],
      properties: {
        data: { type: 'array' },
        dataQuality: { type: 'object' },
        missingValues: { type: 'object' },
        outliers: { type: 'array' },
        events: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'data-collection']
}));

// Task 2: Pattern Analysis
export const patternAnalysisTask = defineTask('pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify demand patterns',
  agent: {
    name: 'pattern-analyst',
    prompt: {
      role: 'Demand Pattern Analyst',
      task: 'Analyze and classify demand patterns',
      context: args,
      instructions: [
        '1. Analyze trend component',
        '2. Analyze seasonal patterns',
        '3. Test for stationarity',
        '4. Analyze autocorrelation (ACF/PACF)',
        '5. Assess demand variability (CV)',
        '6. Classify intermittency (ADI/CV2)',
        '7. Identify demand type (smooth, erratic, lumpy, intermittent)',
        '8. Document pattern analysis'
      ],
      outputFormat: 'JSON with pattern analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['trendType', 'seasonalityType', 'intermittencyLevel', 'demandType', 'artifacts'],
      properties: {
        trendType: { type: 'string' },
        seasonalityType: { type: 'string' },
        seasonalPeriod: { type: 'number' },
        intermittencyLevel: { type: 'string' },
        demandType: { type: 'string' },
        stationarityTest: { type: 'object' },
        acfPacf: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'pattern-analysis']
}));

// Task 3: Model Selection
export const modelSelectionTask = defineTask('model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select forecasting models',
  agent: {
    name: 'model-selector',
    prompt: {
      role: 'Forecasting Model Expert',
      task: 'Select appropriate forecasting models based on patterns',
      context: args,
      instructions: [
        '1. Consider moving average methods',
        '2. Consider exponential smoothing (SES, Holt, Holt-Winters)',
        '3. Consider ARIMA/SARIMA models',
        '4. Consider Croston method for intermittent demand',
        '5. Consider machine learning methods if appropriate',
        '6. Select ensemble approach if beneficial',
        '7. Document model selection rationale',
        '8. Identify candidate models for testing'
      ],
      outputFormat: 'JSON with model selection and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['candidateModels', 'selectionRationale', 'artifacts'],
      properties: {
        candidateModels: { type: 'array' },
        primaryModel: { type: 'string' },
        selectionRationale: { type: 'string' },
        modelParameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'model-selection']
}));

// Task 4: Model Fitting
export const modelFittingTask = defineTask('model-fitting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fit forecasting models',
  agent: {
    name: 'model-fitter',
    prompt: {
      role: 'Statistical Modeler',
      task: 'Fit candidate forecasting models to data',
      context: args,
      instructions: [
        '1. Split data into training/testing',
        '2. Fit each candidate model',
        '3. Optimize model parameters',
        '4. Check model diagnostics',
        '5. Analyze residuals',
        '6. Document model fit statistics',
        '7. Generate model code',
        '8. Save fitted models'
      ],
      outputFormat: 'JSON with fitted models and diagnostics'
    },
    outputSchema: {
      type: 'object',
      required: ['fittedModels', 'bestModelParams', 'artifacts'],
      properties: {
        fittedModels: { type: 'array' },
        bestModelParams: { type: 'object' },
        fitStatistics: { type: 'object' },
        residualAnalysis: { type: 'object' },
        modelCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'model-fitting']
}));

// Task 5: Model Evaluation
export const modelEvaluationTask = defineTask('model-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate forecast accuracy',
  agent: {
    name: 'model-evaluator',
    prompt: {
      role: 'Forecast Accuracy Analyst',
      task: 'Evaluate and compare model forecast accuracy',
      context: args,
      instructions: [
        '1. Calculate accuracy metrics (MAPE, MAE, RMSE)',
        '2. Calculate forecast bias',
        '3. Compare models using holdout test',
        '4. Perform cross-validation if needed',
        '5. Rank models by accuracy',
        '6. Select best model',
        '7. Document accuracy results',
        '8. Create accuracy report'
      ],
      outputFormat: 'JSON with accuracy evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['bestModel', 'bestMAPE', 'bestMAE', 'bestRMSE', 'modelComparison', 'artifacts'],
      properties: {
        bestModel: { type: 'string' },
        bestMAPE: { type: 'number' },
        bestMAE: { type: 'number' },
        bestRMSE: { type: 'number' },
        forecastBias: { type: 'number' },
        modelComparison: { type: 'array' },
        crossValidation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'evaluation']
}));

// Task 6: Forecast Generation
export const forecastGenerationTask = defineTask('forecast-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate forecasts',
  agent: {
    name: 'forecast-generator',
    prompt: {
      role: 'Forecaster',
      task: 'Generate demand forecasts for planning horizon',
      context: args,
      instructions: [
        '1. Refit best model on full data',
        '2. Generate point forecasts',
        '3. Generate prediction intervals',
        '4. Generate scenarios (optimistic, pessimistic)',
        '5. Adjust for known events if needed',
        '6. Format forecast output',
        '7. Create forecast visualization',
        '8. Document forecast assumptions'
      ],
      outputFormat: 'JSON with forecasts and prediction intervals'
    },
    outputSchema: {
      type: 'object',
      required: ['forecasts', 'predictionIntervals', 'artifacts'],
      properties: {
        forecasts: { type: 'array' },
        predictionIntervals: { type: 'object' },
        scenarios: { type: 'object' },
        adjustments: { type: 'array' },
        assumptions: { type: 'array' },
        visualization: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'generation']
}));

// Task 7: System Implementation
export const systemImplementationTask = defineTask('system-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement forecasting system',
  agent: {
    name: 'system-implementer',
    prompt: {
      role: 'Forecasting System Engineer',
      task: 'Implement automated forecasting system',
      context: args,
      instructions: [
        '1. Create forecast generation pipeline',
        '2. Automate data extraction',
        '3. Set up scheduled forecast runs',
        '4. Create error tracking system',
        '5. Build forecast output reports',
        '6. Integrate with planning systems',
        '7. Document system architecture',
        '8. Create user documentation'
      ],
      outputFormat: 'JSON with system implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'schedule', 'integration', 'artifacts'],
      properties: {
        pipeline: { type: 'object' },
        schedule: { type: 'object' },
        errorTracking: { type: 'object' },
        integration: { type: 'object' },
        documentation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'implementation']
}));

// Task 8: Review Process
export const reviewProcessTask = defineTask('review-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish forecast review process',
  agent: {
    name: 'process-designer',
    prompt: {
      role: 'S&OP Process Designer',
      task: 'Establish forecast review and adjustment process',
      context: args,
      instructions: [
        '1. Define forecast review meeting cadence',
        '2. Define roles and responsibilities',
        '3. Create forecast override process',
        '4. Define exception reporting criteria',
        '5. Establish consensus process',
        '6. Create forecast accuracy tracking',
        '7. Plan forecast improvement reviews',
        '8. Document review procedures'
      ],
      outputFormat: 'JSON with review process definition'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewProcess', 'roles', 'procedures', 'artifacts'],
      properties: {
        reviewProcess: { type: 'object' },
        meetingCadence: { type: 'string' },
        roles: { type: 'array' },
        overrideProcess: { type: 'object' },
        exceptionCriteria: { type: 'array' },
        accuracyTracking: { type: 'object' },
        procedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'forecasting', 'review-process']
}));

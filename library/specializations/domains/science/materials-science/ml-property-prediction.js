/**
 * @process domains/science/materials-science/ml-property-prediction
 * @description ML Materials Property Prediction - Build and deploy machine learning models for property prediction
 * using descriptors, graph neural networks (CGCNN, MEGNet), or SISSO.
 * @inputs { targetProperty: string, trainingData?: object, modelType?: string }
 * @outputs { success: boolean, model: object, predictions: array, metrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/ml-property-prediction', {
 *   targetProperty: 'band-gap',
 *   trainingData: { source: 'materials-project', count: 10000 },
 *   modelType: 'cgcnn'
 * });
 *
 * @references
 * - matminer: https://hackingmaterials.lbl.gov/matminer/
 * - CGCNN: https://github.com/txie-93/cgcnn
 * - MEGNet: https://github.com/materialsvirtuallab/megnet
 * - SISSO: https://github.com/rouyang2017/SISSO
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetProperty = 'formation-energy',
    trainingData = { source: 'materials-project', count: 5000 },
    modelType = 'random-forest',
    descriptorType = 'matminer',
    validationSplit = 0.2,
    testSplit = 0.1,
    hyperparameterTuning = true,
    outputDir = 'ml-prediction-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ML Property Prediction for: ${targetProperty}`);
  ctx.log('info', `Model type: ${modelType}, Descriptor: ${descriptorType}`);

  // Phase 1: Data Collection
  ctx.log('info', 'Phase 1: Collecting training data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    targetProperty,
    trainingData,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Phase 2: Feature Engineering
  ctx.log('info', 'Phase 2: Engineering features/descriptors');
  const featureEngineering = await ctx.task(featureEngineeringTask, {
    dataset: dataCollection.dataset,
    targetProperty,
    descriptorType,
    modelType,
    outputDir
  });

  artifacts.push(...featureEngineering.artifacts);

  await ctx.breakpoint({
    question: `Feature engineering complete. ${featureEngineering.featureCount} features generated. ${featureEngineering.sampleCount} samples available. Proceed with model training?`,
    title: 'Feature Engineering Review',
    context: {
      runId: ctx.runId,
      summary: {
        featureCount: featureEngineering.featureCount,
        sampleCount: featureEngineering.sampleCount,
        descriptorType
      },
      files: featureEngineering.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Data Splitting
  ctx.log('info', 'Phase 3: Splitting data');
  const dataSplitting = await ctx.task(dataSplittingTask, {
    features: featureEngineering.features,
    targets: featureEngineering.targets,
    validationSplit,
    testSplit,
    outputDir
  });

  artifacts.push(...dataSplitting.artifacts);

  // Phase 4: Model Training
  ctx.log('info', 'Phase 4: Training model');
  const modelTraining = await ctx.task(modelTrainingTask, {
    trainData: dataSplitting.trainData,
    valData: dataSplitting.valData,
    modelType,
    targetProperty,
    hyperparameterTuning,
    outputDir
  });

  artifacts.push(...modelTraining.artifacts);

  // Phase 5: Model Evaluation
  ctx.log('info', 'Phase 5: Evaluating model');
  const modelEvaluation = await ctx.task(modelEvaluationTask, {
    model: modelTraining.model,
    testData: dataSplitting.testData,
    modelType,
    outputDir
  });

  artifacts.push(...modelEvaluation.artifacts);

  await ctx.breakpoint({
    question: `Model evaluation complete. Test MAE: ${modelEvaluation.mae.toFixed(4)}, Test R2: ${modelEvaluation.r2.toFixed(4)}. Review performance?`,
    title: 'Model Evaluation Review',
    context: {
      runId: ctx.runId,
      summary: {
        mae: modelEvaluation.mae,
        rmse: modelEvaluation.rmse,
        r2: modelEvaluation.r2,
        modelType
      },
      files: modelEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Feature Importance Analysis
  ctx.log('info', 'Phase 6: Analyzing feature importance');
  const featureImportance = await ctx.task(featureImportanceTask, {
    model: modelTraining.model,
    features: featureEngineering.featureNames,
    modelType,
    outputDir
  });

  artifacts.push(...featureImportance.artifacts);

  // Phase 7: Model Interpretation
  ctx.log('info', 'Phase 7: Interpreting model');
  const modelInterpretation = await ctx.task(modelInterpretationTask, {
    model: modelTraining.model,
    testData: dataSplitting.testData,
    featureImportance: featureImportance.importance,
    modelType,
    outputDir
  });

  artifacts.push(...modelInterpretation.artifacts);

  // Phase 8: Model Export and Deployment
  ctx.log('info', 'Phase 8: Exporting model');
  const modelExport = await ctx.task(modelExportTask, {
    model: modelTraining.model,
    modelType,
    featureNames: featureEngineering.featureNames,
    targetProperty,
    metrics: modelEvaluation.metrics,
    outputDir
  });

  artifacts.push(...modelExport.artifacts);

  // Phase 9: Report Generation
  ctx.log('info', 'Phase 9: Generating report');
  const report = await ctx.task(mlReportTask, {
    targetProperty,
    modelType,
    descriptorType,
    dataCollection,
    featureEngineering,
    modelTraining,
    modelEvaluation,
    featureImportance,
    modelInterpretation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    targetProperty,
    modelType,
    model: {
      path: modelExport.modelPath,
      type: modelType,
      featureCount: featureEngineering.featureCount,
      trainingSize: dataSplitting.trainData.size
    },
    predictions: modelEvaluation.predictions,
    metrics: {
      mae: modelEvaluation.mae,
      rmse: modelEvaluation.rmse,
      r2: modelEvaluation.r2,
      mape: modelEvaluation.mape
    },
    featureImportance: featureImportance.topFeatures,
    interpretation: modelInterpretation.insights,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/ml-property-prediction',
      timestamp: startTime,
      descriptorType,
      trainingDataSource: trainingData.source,
      outputDir
    }
  };
}

// Task 1: Data Collection
export const dataCollectionTask = defineTask('ml-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Collection - ${args.targetProperty}`,
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'Materials Data Specialist',
      task: 'Collect training data for ML property prediction',
      context: args,
      instructions: [
        '1. Connect to specified data source',
        '2. Query materials with target property',
        '3. Download structure files',
        '4. Retrieve property values',
        '5. Clean data (remove duplicates, outliers)',
        '6. Verify data quality',
        '7. Handle missing values',
        '8. Document data provenance',
        '9. Generate dataset statistics',
        '10. Export collected dataset'
      ],
      outputFormat: 'JSON with data collection results'
    },
    outputSchema: {
      type: 'object',
      required: ['dataset', 'sampleCount', 'artifacts'],
      properties: {
        dataset: { type: 'string' },
        sampleCount: { type: 'number' },
        propertyRange: { type: 'object' },
        dataQuality: { type: 'object' },
        dataProvenance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'data-collection', 'materials-science']
}));

// Task 2: Feature Engineering
export const featureEngineeringTask = defineTask('ml-feature-engineering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feature Engineering - ${args.targetProperty}`,
  agent: {
    name: 'feature-engineer',
    prompt: {
      role: 'Materials Feature Engineering Specialist',
      task: 'Generate features/descriptors for ML models',
      context: args,
      instructions: [
        '1. Choose descriptor strategy based on model type',
        '2. For traditional ML: use matminer compositional features',
        '3. For GNN: generate crystal graphs',
        '4. Calculate elemental statistics',
        '5. Add structural descriptors if applicable',
        '6. Handle categorical features',
        '7. Scale/normalize features',
        '8. Remove highly correlated features',
        '9. Document feature generation',
        '10. Export features and targets'
      ],
      outputFormat: 'JSON with feature engineering results'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'targets', 'featureCount', 'artifacts'],
      properties: {
        features: { type: 'string', description: 'Path to features file' },
        targets: { type: 'string', description: 'Path to targets file' },
        featureCount: { type: 'number' },
        sampleCount: { type: 'number' },
        featureNames: { type: 'array', items: { type: 'string' } },
        featureTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'feature-engineering', 'materials-science']
}));

// Task 3: Data Splitting
export const dataSplittingTask = defineTask('ml-data-splitting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Splitting',
  agent: {
    name: 'data-splitter',
    prompt: {
      role: 'ML Data Preparation Specialist',
      task: 'Split data into train/validation/test sets',
      context: args,
      instructions: [
        '1. Load features and targets',
        '2. Perform stratified splitting if classification',
        '3. Ensure random but reproducible split',
        '4. Check distribution consistency across splits',
        '5. Handle class imbalance if needed',
        '6. Save split indices for reproducibility',
        '7. Generate split statistics',
        '8. Verify no data leakage',
        '9. Export train/val/test sets',
        '10. Document splitting strategy'
      ],
      outputFormat: 'JSON with data splitting results'
    },
    outputSchema: {
      type: 'object',
      required: ['trainData', 'valData', 'testData', 'artifacts'],
      properties: {
        trainData: { type: 'object' },
        valData: { type: 'object' },
        testData: { type: 'object' },
        splitRatio: { type: 'object' },
        splitIndices: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'data-splitting', 'materials-science']
}));

// Task 4: Model Training
export const modelTrainingTask = defineTask('ml-model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Training - ${args.modelType}`,
  agent: {
    name: 'ml-trainer',
    prompt: {
      role: 'Materials ML Model Training Specialist',
      task: 'Train ML model for property prediction',
      context: args,
      instructions: [
        '1. Initialize model architecture',
        '2. Set up hyperparameter search if requested',
        '3. Configure training parameters',
        '4. Train model with early stopping',
        '5. Monitor validation loss',
        '6. Perform cross-validation if appropriate',
        '7. Select best model',
        '8. Log training metrics',
        '9. Save model checkpoint',
        '10. Document training process'
      ],
      outputFormat: 'JSON with model training results'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'trainingHistory', 'bestParams', 'artifacts'],
      properties: {
        model: { type: 'string', description: 'Path to trained model' },
        trainingHistory: { type: 'object' },
        bestParams: { type: 'object' },
        validationMetrics: { type: 'object' },
        trainingTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'training', 'materials-science']
}));

// Task 5: Model Evaluation
export const modelEvaluationTask = defineTask('ml-model-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model Evaluation',
  agent: {
    name: 'model-evaluator',
    prompt: {
      role: 'ML Model Evaluation Specialist',
      task: 'Evaluate model performance on test set',
      context: args,
      instructions: [
        '1. Load trained model',
        '2. Generate predictions on test set',
        '3. Calculate MAE, RMSE, R2, MAPE',
        '4. Generate parity plot',
        '5. Analyze error distribution',
        '6. Identify outlier predictions',
        '7. Assess prediction uncertainty',
        '8. Compare with baseline models',
        '9. Generate evaluation report',
        '10. Document evaluation metrics'
      ],
      outputFormat: 'JSON with model evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['mae', 'rmse', 'r2', 'predictions', 'artifacts'],
      properties: {
        mae: { type: 'number' },
        rmse: { type: 'number' },
        r2: { type: 'number' },
        mape: { type: 'number' },
        predictions: { type: 'string', description: 'Path to predictions file' },
        parityPlot: { type: 'string' },
        errorDistribution: { type: 'object' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'evaluation', 'materials-science']
}));

// Task 6: Feature Importance
export const featureImportanceTask = defineTask('ml-feature-importance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feature Importance Analysis',
  agent: {
    name: 'importance-analyst',
    prompt: {
      role: 'Feature Importance Analysis Specialist',
      task: 'Analyze feature importance for model interpretability',
      context: args,
      instructions: [
        '1. Extract model feature importances',
        '2. For tree models: use built-in importance',
        '3. For neural nets: use permutation importance',
        '4. Calculate SHAP values if applicable',
        '5. Rank features by importance',
        '6. Identify top contributing features',
        '7. Generate importance plots',
        '8. Analyze feature interactions',
        '9. Correlate with physical intuition',
        '10. Document feature importance'
      ],
      outputFormat: 'JSON with feature importance results'
    },
    outputSchema: {
      type: 'object',
      required: ['importance', 'topFeatures', 'artifacts'],
      properties: {
        importance: { type: 'object' },
        topFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              importance: { type: 'number' }
            }
          }
        },
        importancePlot: { type: 'string' },
        shapValues: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'feature-importance', 'materials-science']
}));

// Task 7: Model Interpretation
export const modelInterpretationTask = defineTask('ml-model-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model Interpretation',
  agent: {
    name: 'model-interpreter',
    prompt: {
      role: 'ML Model Interpretation Specialist',
      task: 'Interpret model behavior and extract insights',
      context: args,
      instructions: [
        '1. Analyze prediction patterns',
        '2. Identify material space coverage',
        '3. Assess extrapolation behavior',
        '4. Analyze worst predictions',
        '5. Check for biases',
        '6. Validate physical meaningfulness',
        '7. Generate partial dependence plots',
        '8. Extract structure-property relationships',
        '9. Identify model limitations',
        '10. Summarize interpretability insights'
      ],
      outputFormat: 'JSON with model interpretation results'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'pdpPlots', 'artifacts'],
      properties: {
        insights: { type: 'array', items: { type: 'string' } },
        pdpPlots: { type: 'array', items: { type: 'string' } },
        structurePropertyRelations: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } },
        coverageAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'interpretation', 'materials-science']
}));

// Task 8: Model Export
export const modelExportTask = defineTask('ml-model-export', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model Export',
  agent: {
    name: 'model-exporter',
    prompt: {
      role: 'ML Model Export Specialist',
      task: 'Export model for deployment and sharing',
      context: args,
      instructions: [
        '1. Save model in portable format',
        '2. Export model weights',
        '3. Save feature scaler/normalizer',
        '4. Generate model card',
        '5. Create inference script',
        '6. Document input/output format',
        '7. Add version information',
        '8. Include performance metrics',
        '9. Create usage examples',
        '10. Package for distribution'
      ],
      outputFormat: 'JSON with model export results'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'modelCard', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        modelCard: { type: 'string' },
        scalerPath: { type: 'string' },
        inferenceScript: { type: 'string' },
        exampleUsage: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'export', 'materials-science']
}));

// Task 9: Report Generation
export const mlReportTask = defineTask('ml-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `ML Prediction Report - ${args.targetProperty}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'ML for Materials Technical Writer',
      task: 'Generate comprehensive ML property prediction report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document data sources and preparation',
        '3. Describe feature engineering',
        '4. Present model architecture',
        '5. Report training process',
        '6. Present evaluation metrics',
        '7. Include parity and error plots',
        '8. Discuss feature importance',
        '9. Present interpretation insights',
        '10. Add conclusions and recommendations'
      ],
      outputFormat: 'JSON with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        figures: { type: 'array', items: { type: 'string' } },
        tables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ml', 'report', 'documentation', 'materials-science']
}));

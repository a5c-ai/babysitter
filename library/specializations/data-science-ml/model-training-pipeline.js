/**
 * @process specializations/data-science-ml/model-training-pipeline
 * @description Model Training Pipeline with Experiment Tracking - Execute model training with hyperparameter tuning,
 * track experiments with metrics and artifacts, compare model variants, and select best performers with automated
 * quality gates and convergence criteria.
 * @inputs { projectName: string, modelType: string, trainingData: string, validationData: string, targetMetric: string, targetPerformance?: number, maxIterations?: number, hyperparameterStrategy?: string }
 * @outputs { success: boolean, bestModel: object, experimentResults: array, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/model-training-pipeline', {
 *   projectName: 'Churn Prediction Model',
 *   modelType: 'classification',
 *   trainingData: 'data/train.csv',
 *   validationData: 'data/val.csv',
 *   targetMetric: 'f1_score',
 *   targetPerformance: 0.85,
 *   maxIterations: 10,
 *   hyperparameterStrategy: 'bayesian'
 * });
 *
 * @references
 * - MLflow Experiment Tracking: https://mlflow.org/
 * - Weights & Biases: https://wandb.ai/
 * - Kubeflow Pipelines: https://www.kubeflow.org/
 * - TensorFlow: https://www.tensorflow.org/
 * - PyTorch: https://pytorch.org/
 * - Scikit-learn Model Selection: https://scikit-learn.org/stable/model_selection.html
 * - Optuna Hyperparameter Optimization: https://optuna.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    modelType = 'classification',
    trainingData,
    validationData,
    testData = null,
    targetMetric = 'accuracy',
    targetPerformance = 0.85,
    maxIterations = 10,
    hyperparameterStrategy = 'grid',
    experimentTrackingBackend = 'mlflow',
    earlyStoppingPatience = 3,
    crossValidationFolds = 5,
    randomSeed = 42,
    computeResource = 'cpu',
    outputDir = 'model-training-output'
  } = inputs;

  const startTime = ctx.now();
  const experimentResults = [];
  const artifacts = [];
  let currentIteration = 0;
  let bestPerformance = 0;
  let bestModel = null;
  let noImprovementCount = 0;

  ctx.log('info', `Starting Model Training Pipeline: ${projectName}`);
  ctx.log('info', `Target: ${targetMetric} >= ${targetPerformance}`);

  // ============================================================================
  // PHASE 1: TRAINING ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up training environment');
  const envSetup = await ctx.task(trainingEnvironmentSetupTask, {
    projectName,
    modelType,
    experimentTrackingBackend,
    computeResource,
    outputDir
  });

  if (!envSetup.success) {
    return {
      success: false,
      error: 'Training environment setup failed',
      details: envSetup,
      metadata: { processId: 'specializations/data-science-ml/model-training-pipeline', timestamp: startTime }
    };
  }

  artifacts.push(...envSetup.artifacts);

  // ============================================================================
  // PHASE 2: DATA LOADING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Loading and validating training data');
  const dataLoad = await ctx.task(dataLoadingValidationTask, {
    projectName,
    trainingData,
    validationData,
    testData,
    modelType,
    outputDir
  });

  if (!dataLoad.success) {
    return {
      success: false,
      error: 'Data loading and validation failed',
      details: dataLoad,
      metadata: { processId: 'specializations/data-science-ml/model-training-pipeline', timestamp: startTime }
    };
  }

  artifacts.push(...dataLoad.artifacts);

  // Quality Gate: Check data quality scores
  if (dataLoad.dataQuality.trainingScore < 70 || dataLoad.dataQuality.validationScore < 70) {
    await ctx.breakpoint({
      question: `Data quality concerns detected. Training: ${dataLoad.dataQuality.trainingScore}/100, Validation: ${dataLoad.dataQuality.validationScore}/100. Proceed with training?`,
      title: 'Data Quality Warning',
      context: {
        runId: ctx.runId,
        dataQuality: dataLoad.dataQuality,
        recommendation: 'Consider running EDA pipeline and data cleaning before training',
        files: dataLoad.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: BASELINE MODEL ESTABLISHMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Training baseline model');
  const baselineResult = await ctx.task(baselineModelTrainingTask, {
    projectName,
    modelType,
    trainingData: dataLoad.processedTrainingData,
    validationData: dataLoad.processedValidationData,
    targetMetric,
    randomSeed,
    outputDir
  });

  experimentResults.push({
    iteration: 0,
    type: 'baseline',
    performance: baselineResult.performance,
    metrics: baselineResult.metrics,
    modelConfig: baselineResult.modelConfig,
    timestamp: ctx.now()
  });

  artifacts.push(...baselineResult.artifacts);
  bestPerformance = baselineResult.performance[targetMetric];
  bestModel = baselineResult;

  ctx.log('info', `Baseline ${targetMetric}: ${bestPerformance.toFixed(4)}`);

  // Breakpoint: Review baseline results
  await ctx.breakpoint({
    question: `Baseline model trained. ${targetMetric}: ${bestPerformance.toFixed(4)}/${targetPerformance}. Review results and approve to proceed with hyperparameter tuning?`,
    title: 'Baseline Model Review',
    context: {
      runId: ctx.runId,
      baseline: {
        performance: baselineResult.performance,
        metrics: baselineResult.metrics
      },
      files: baselineResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: HYPERPARAMETER SEARCH SPACE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining hyperparameter search space');
  const searchSpace = await ctx.task(hyperparameterSearchSpaceTask, {
    projectName,
    modelType,
    baselineConfig: baselineResult.modelConfig,
    hyperparameterStrategy,
    maxIterations,
    outputDir
  });

  artifacts.push(...searchSpace.artifacts);

  // ============================================================================
  // PHASE 5: ITERATIVE HYPERPARAMETER TUNING WITH CONVERGENCE
  // ============================================================================

  ctx.log('info', 'Phase 5: Starting hyperparameter tuning loop');

  while (currentIteration < maxIterations && noImprovementCount < earlyStoppingPatience) {
    currentIteration++;

    ctx.log('info', `Iteration ${currentIteration}/${maxIterations} - Best ${targetMetric}: ${bestPerformance.toFixed(4)}`);

    // Task 5.1: Generate next hyperparameter configuration
    const hyperparamConfig = await ctx.task(hyperparameterGenerationTask, {
      projectName,
      modelType,
      searchSpace: searchSpace.searchSpace,
      strategy: hyperparameterStrategy,
      iteration: currentIteration,
      previousResults: experimentResults,
      targetMetric,
      outputDir
    });

    // Task 5.2: Train model with hyperparameters
    const trainingResult = await ctx.task(modelTrainingTask, {
      projectName,
      modelType,
      trainingData: dataLoad.processedTrainingData,
      validationData: dataLoad.processedValidationData,
      hyperparameters: hyperparamConfig.hyperparameters,
      targetMetric,
      randomSeed,
      iteration: currentIteration,
      experimentId: envSetup.experimentId,
      outputDir
    });

    // Task 5.3: Evaluate model performance
    const evaluation = await ctx.task(modelEvaluationTask, {
      projectName,
      modelType,
      model: trainingResult.model,
      validationData: dataLoad.processedValidationData,
      targetMetric,
      iteration: currentIteration,
      outputDir
    });

    // Task 5.4: Log experiment to tracking backend
    const experimentLog = await ctx.task(experimentLoggingTask, {
      projectName,
      experimentId: envSetup.experimentId,
      experimentTrackingBackend,
      iteration: currentIteration,
      hyperparameters: hyperparamConfig.hyperparameters,
      metrics: evaluation.metrics,
      model: trainingResult.model,
      artifacts: trainingResult.artifacts,
      outputDir
    });

    // Store iteration results
    const iterationPerformance = evaluation.metrics[targetMetric];
    experimentResults.push({
      iteration: currentIteration,
      type: 'tuning',
      hyperparameters: hyperparamConfig.hyperparameters,
      performance: evaluation.metrics,
      trainingTime: trainingResult.trainingTime,
      modelSize: trainingResult.modelSize,
      convergence: trainingResult.convergence,
      experimentRunId: experimentLog.runId,
      timestamp: ctx.now()
    });

    artifacts.push(...trainingResult.artifacts);
    artifacts.push(...evaluation.artifacts);

    // Check for improvement
    const improvement = iterationPerformance - bestPerformance;
    const improvementPercent = (improvement / bestPerformance) * 100;

    if (iterationPerformance > bestPerformance) {
      ctx.log('info', `New best model! ${targetMetric}: ${iterationPerformance.toFixed(4)} (+${improvementPercent.toFixed(2)}%)`);
      bestPerformance = iterationPerformance;
      bestModel = {
        iteration: currentIteration,
        model: trainingResult.model,
        hyperparameters: hyperparamConfig.hyperparameters,
        performance: evaluation.metrics,
        artifacts: trainingResult.artifacts
      };
      noImprovementCount = 0;
    } else {
      noImprovementCount++;
      ctx.log('info', `No improvement (${noImprovementCount}/${earlyStoppingPatience})`);
    }

    // Check convergence
    if (bestPerformance >= targetPerformance) {
      ctx.log('info', `Target performance achieved! ${targetMetric}: ${bestPerformance.toFixed(4)} >= ${targetPerformance}`);
      break;
    }

    // Periodic review breakpoint
    if (currentIteration % 5 === 0 && currentIteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${currentIteration} complete. Best ${targetMetric}: ${bestPerformance.toFixed(4)}/${targetPerformance}. No improvement: ${noImprovementCount}/${earlyStoppingPatience}. Continue training?`,
        title: `Training Progress - Iteration ${currentIteration}`,
        context: {
          runId: ctx.runId,
          progress: {
            currentIteration,
            maxIterations,
            bestPerformance,
            targetPerformance,
            noImprovementCount,
            recentResults: experimentResults.slice(-5)
          },
          files: artifacts.filter(a => a.iteration === currentIteration).map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  const converged = bestPerformance >= targetPerformance;
  const stoppedEarly = noImprovementCount >= earlyStoppingPatience;

  ctx.log('info', `Training loop complete. Iterations: ${currentIteration}, Converged: ${converged}, Early stopped: ${stoppedEarly}`);

  // ============================================================================
  // PHASE 6: CROSS-VALIDATION ON BEST MODEL
  // ============================================================================

  ctx.log('info', 'Phase 6: Cross-validating best model');
  const crossValidation = await ctx.task(crossValidationTask, {
    projectName,
    modelType,
    trainingData: dataLoad.processedTrainingData,
    bestModelConfig: bestModel.hyperparameters,
    targetMetric,
    folds: crossValidationFolds,
    randomSeed,
    outputDir
  });

  artifacts.push(...crossValidation.artifacts);

  // Quality Gate: Check cross-validation stability
  const cvMean = crossValidation.metrics[targetMetric].mean;
  const cvStd = crossValidation.metrics[targetMetric].std;
  const cvStable = cvStd < 0.05; // Standard deviation threshold

  if (!cvStable) {
    await ctx.breakpoint({
      question: `Cross-validation shows high variance. ${targetMetric} mean: ${cvMean.toFixed(4)} ± ${cvStd.toFixed(4)}. Model may not generalize well. Proceed?`,
      title: 'Cross-Validation Stability Warning',
      context: {
        runId: ctx.runId,
        crossValidation: crossValidation.metrics,
        recommendation: 'Consider collecting more data, feature engineering, or regularization',
        files: crossValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: TEST SET EVALUATION (if provided)
  // ============================================================================

  let testEvaluation = null;
  if (testData) {
    ctx.log('info', 'Phase 7: Evaluating on held-out test set');
    testEvaluation = await ctx.task(testSetEvaluationTask, {
      projectName,
      modelType,
      model: bestModel.model,
      testData,
      targetMetric,
      outputDir
    });

    artifacts.push(...testEvaluation.artifacts);

    // Quality Gate: Check for overfitting
    const validationPerformance = bestModel.performance[targetMetric];
    const testPerformance = testEvaluation.metrics[targetMetric];
    const performanceDrop = validationPerformance - testPerformance;
    const dropPercent = (performanceDrop / validationPerformance) * 100;

    if (dropPercent > 10) {
      await ctx.breakpoint({
        question: `Significant performance drop on test set detected. Validation: ${validationPerformance.toFixed(4)}, Test: ${testPerformance.toFixed(4)} (-${dropPercent.toFixed(2)}%). Model may be overfitting. Proceed?`,
        title: 'Overfitting Warning',
        context: {
          runId: ctx.runId,
          overfitting: {
            validationPerformance,
            testPerformance,
            dropPercent
          },
          recommendation: 'Consider regularization, more data, or simpler model architecture',
          files: testEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 8: MODEL PERFORMANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive performance analysis');
  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    projectName,
    modelType,
    bestModel,
    experimentResults,
    crossValidation,
    testEvaluation,
    targetMetric,
    targetPerformance,
    outputDir
  });

  artifacts.push(...performanceAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: MODEL ARTIFACT PACKAGING
  // ============================================================================

  ctx.log('info', 'Phase 9: Packaging model artifacts');
  const modelPackage = await ctx.task(modelPackagingTask, {
    projectName,
    modelType,
    bestModel,
    dataPreprocessing: dataLoad.preprocessingPipeline,
    performanceMetrics: bestModel.performance,
    crossValidationMetrics: crossValidation.metrics,
    testMetrics: testEvaluation ? testEvaluation.metrics : null,
    outputDir
  });

  artifacts.push(...modelPackage.artifacts);

  // ============================================================================
  // PHASE 10: EXPERIMENT COMPARISON AND VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating experiment comparison report');
  const comparisonReport = await ctx.task(experimentComparisonTask, {
    projectName,
    experimentResults,
    bestModel,
    targetMetric,
    targetPerformance,
    converged,
    outputDir
  });

  artifacts.push(...comparisonReport.artifacts);

  // ============================================================================
  // PHASE 11: FINAL MODEL REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 11: Final model review');
  const finalReview = await ctx.task(finalModelReviewTask, {
    projectName,
    modelType,
    bestModel,
    experimentResults,
    crossValidation,
    testEvaluation,
    performanceAnalysis,
    targetMetric,
    targetPerformance,
    converged,
    stoppedEarly,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Deployment approval
  await ctx.breakpoint({
    question: `Training complete. Best ${targetMetric}: ${bestPerformance.toFixed(4)}/${targetPerformance}. ${finalReview.verdict}. Approve model for deployment?`,
    title: 'Final Model Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        iterations: currentIteration,
        bestPerformance,
        targetPerformance,
        converged,
        stoppedEarly,
        cvStable,
        testPerformance: testEvaluation ? testEvaluation.metrics[targetMetric] : null
      },
      verdict: finalReview.verdict,
      recommendation: finalReview.recommendation,
      files: [
        { path: modelPackage.modelPath, format: 'binary', label: 'Model Binary' },
        { path: comparisonReport.reportPath, format: 'markdown', label: 'Comparison Report' },
        { path: performanceAnalysis.reportPath, format: 'markdown', label: 'Performance Analysis' },
        { path: finalReview.reportPath, format: 'markdown', label: 'Final Review' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    bestModel: {
      iteration: bestModel.iteration,
      modelPath: modelPackage.modelPath,
      hyperparameters: bestModel.hyperparameters,
      performance: bestModel.performance,
      crossValidationMetrics: crossValidation.metrics,
      testMetrics: testEvaluation ? testEvaluation.metrics : null
    },
    experimentResults,
    performanceMetrics: {
      targetMetric,
      targetPerformance,
      bestPerformance,
      converged,
      cvMean,
      cvStd,
      cvStable,
      testPerformance: testEvaluation ? testEvaluation.metrics[targetMetric] : null
    },
    trainingStats: {
      totalIterations: currentIteration,
      baselinePerformance: experimentResults[0].performance[targetMetric],
      finalPerformance: bestPerformance,
      improvementPercent: ((bestPerformance - experimentResults[0].performance[targetMetric]) / experimentResults[0].performance[targetMetric] * 100),
      stoppedEarly,
      duration
    },
    artifacts,
    finalReview: {
      verdict: finalReview.verdict,
      approved: finalReview.approved,
      recommendation: finalReview.recommendation,
      concerns: finalReview.concerns
    },
    metadata: {
      processId: 'specializations/data-science-ml/model-training-pipeline',
      timestamp: startTime,
      experimentTrackingBackend,
      experimentId: envSetup.experimentId
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Training Environment Setup
export const trainingEnvironmentSetupTask = defineTask('training-environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Training Environment Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer specializing in MLOps and experiment infrastructure',
      task: 'Set up the training environment and experiment tracking infrastructure',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        experimentTrackingBackend: args.experimentTrackingBackend,
        computeResource: args.computeResource,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create output directory structure for experiments, models, logs, and artifacts',
        '2. Initialize experiment tracking backend (MLflow, W&B, etc.)',
        '3. Create unique experiment ID for this training run',
        '4. Set up logging configuration',
        '5. Verify compute resource availability (CPU/GPU)',
        '6. Install and verify required ML libraries (scikit-learn, TensorFlow, PyTorch, etc.)',
        '7. Set random seeds for reproducibility',
        '8. Create experiment metadata file',
        '9. Initialize experiment tracking client',
        '10. Return setup confirmation with experiment ID and paths'
      ],
      outputFormat: 'JSON object with setup status and configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'experimentId', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        experimentId: { type: 'string', description: 'Unique experiment identifier' },
        experimentName: { type: 'string' },
        outputDirectories: {
          type: 'object',
          properties: {
            models: { type: 'string' },
            logs: { type: 'string' },
            artifacts: { type: 'string' },
            checkpoints: { type: 'string' }
          }
        },
        computeInfo: {
          type: 'object',
          properties: {
            device: { type: 'string' },
            gpuAvailable: { type: 'boolean' },
            gpuCount: { type: 'number' },
            memoryAvailable: { type: 'string' }
          }
        },
        libraryVersions: {
          type: 'object',
          description: 'Installed library versions for reproducibility'
        },
        trackingUri: { type: 'string', description: 'Experiment tracking backend URI' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'setup', 'environment']
}));

// Phase 2: Data Loading and Validation
export const dataLoadingValidationTask = defineTask('data-loading-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Loading and Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer specializing in ML data pipelines',
      task: 'Load and validate training, validation, and test datasets',
      context: {
        projectName: args.projectName,
        trainingData: args.trainingData,
        validationData: args.validationData,
        testData: args.testData,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load training data from specified path',
        '2. Load validation data from specified path',
        '3. Load test data if provided',
        '4. Validate data formats and schemas are consistent',
        '5. Check for missing values and data quality issues',
        '6. Verify class balance for classification tasks',
        '7. Compute data quality scores (0-100) for each dataset',
        '8. Extract feature names and types',
        '9. Generate data statistics and summaries',
        '10. Apply necessary preprocessing (scaling, encoding, etc.)',
        '11. Save preprocessing pipeline for later use',
        '12. Save processed datasets to output directory',
        '13. Generate data quality report'
      ],
      outputFormat: 'JSON object with loaded data paths, quality scores, and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'processedTrainingData', 'processedValidationData', 'dataQuality', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        processedTrainingData: { type: 'string', description: 'Path to processed training data' },
        processedValidationData: { type: 'string', description: 'Path to processed validation data' },
        processedTestData: { type: 'string', description: 'Path to processed test data' },
        dataQuality: {
          type: 'object',
          properties: {
            trainingScore: { type: 'number', minimum: 0, maximum: 100 },
            validationScore: { type: 'number', minimum: 0, maximum: 100 },
            testScore: { type: 'number', minimum: 0, maximum: 100 },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        dataStats: {
          type: 'object',
          properties: {
            trainingRows: { type: 'number' },
            validationRows: { type: 'number' },
            testRows: { type: 'number' },
            numFeatures: { type: 'number' },
            featureNames: { type: 'array', items: { type: 'string' } },
            targetName: { type: 'string' },
            classBalance: { type: 'object' }
          }
        },
        preprocessingPipeline: { type: 'string', description: 'Path to saved preprocessing pipeline' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'data-loading', 'validation']
}));

// Phase 3: Baseline Model Training
export const baselineModelTrainingTask = defineTask('baseline-model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Baseline Model Training - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer specializing in model development',
      task: 'Train a baseline model with default hyperparameters to establish performance benchmark',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        trainingData: args.trainingData,
        validationData: args.validationData,
        targetMetric: args.targetMetric,
        randomSeed: args.randomSeed,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate baseline model for the task (LogisticRegression, RandomForest, etc.)',
        '2. Use default or simple hyperparameters',
        '3. Train model on training data',
        '4. Evaluate on validation data',
        '5. Compute all relevant metrics (accuracy, precision, recall, F1, AUC, etc.)',
        '6. Generate confusion matrix for classification',
        '7. Plot learning curves if applicable',
        '8. Save trained baseline model',
        '9. Log training time and model size',
        '10. Create baseline performance report'
      ],
      outputFormat: 'JSON object with model performance and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'model', 'performance', 'metrics', 'modelConfig', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        model: { type: 'string', description: 'Path to saved baseline model' },
        modelConfig: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            hyperparameters: { type: 'object' }
          }
        },
        performance: {
          type: 'object',
          description: 'Performance metrics on validation set'
        },
        metrics: {
          type: 'object',
          description: 'All computed metrics'
        },
        trainingTime: { type: 'number', description: 'Training time in seconds' },
        modelSize: { type: 'string', description: 'Model file size' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'baseline', 'model-training']
}));

// Phase 4: Hyperparameter Search Space Definition
export const hyperparameterSearchSpaceTask = defineTask('hyperparameter-search-space', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Hyperparameter Search Space Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Research Engineer specializing in hyperparameter optimization',
      task: 'Define comprehensive hyperparameter search space based on model type and baseline configuration',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        baselineConfig: args.baselineConfig,
        hyperparameterStrategy: args.hyperparameterStrategy,
        maxIterations: args.maxIterations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze baseline model configuration',
        '2. Identify key hyperparameters to tune',
        '3. Define search ranges for each hyperparameter',
        '4. Specify parameter types (continuous, discrete, categorical)',
        '5. Set constraints and dependencies between parameters',
        '6. Adapt search space size to maxIterations budget',
        '7. For grid search: define discrete values',
        '8. For random search: define distributions',
        '9. For bayesian: define priors and bounds',
        '10. Document rationale for search space choices',
        '11. Save search space configuration'
      ],
      outputFormat: 'JSON object with hyperparameter search space definition'
    },
    outputSchema: {
      type: 'object',
      required: ['searchSpace', 'artifacts'],
      properties: {
        searchSpace: {
          type: 'object',
          description: 'Hyperparameter search space definition',
          additionalProperties: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['continuous', 'discrete', 'categorical'] },
              range: { type: 'array' },
              distribution: { type: 'string' },
              default: {}
            }
          }
        },
        strategy: { type: 'string', description: 'Search strategy being used' },
        estimatedSearchSize: { type: 'number', description: 'Estimated number of configurations' },
        priorityParameters: {
          type: 'array',
          items: { type: 'string' },
          description: 'Most important parameters to tune'
        },
        rationale: { type: 'string', description: 'Explanation of search space choices' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'hyperparameter', 'search-space']
}));

// Phase 5.1: Hyperparameter Configuration Generation
export const hyperparameterGenerationTask = defineTask('hyperparameter-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration ${args.iteration}: Generate Hyperparameter Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Optimization Engineer',
      task: 'Generate next hyperparameter configuration based on search strategy and previous results',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        searchSpace: args.searchSpace,
        strategy: args.strategy,
        iteration: args.iteration,
        previousResults: args.previousResults,
        targetMetric: args.targetMetric,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze previous experiment results',
        '2. Apply hyperparameter search strategy (grid/random/bayesian)',
        '3. For grid search: select next configuration from grid',
        '4. For random search: sample randomly from distributions',
        '5. For bayesian: use Gaussian Process to suggest next point',
        '6. Ensure configuration is valid and within bounds',
        '7. Avoid duplicate configurations already tested',
        '8. Log reasoning for configuration choice',
        '9. Save configuration for tracking',
        '10. Return hyperparameter dictionary'
      ],
      outputFormat: 'JSON object with hyperparameter configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['hyperparameters'],
      properties: {
        hyperparameters: {
          type: 'object',
          description: 'Hyperparameter configuration to try'
        },
        strategy: { type: 'string' },
        reasoning: { type: 'string', description: 'Why this configuration was chosen' },
        expectedImprovement: { type: 'number', description: 'Predicted improvement if bayesian' },
        configurationId: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'hyperparameter', 'generation', `iteration-${args.iteration}`]
}));

// Phase 5.2: Model Training with Hyperparameters
export const modelTrainingTask = defineTask('model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration ${args.iteration}: Model Training - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer',
      task: 'Train model with specified hyperparameters',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        trainingData: args.trainingData,
        validationData: args.validationData,
        hyperparameters: args.hyperparameters,
        targetMetric: args.targetMetric,
        randomSeed: args.randomSeed,
        iteration: args.iteration,
        experimentId: args.experimentId,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize model with specified hyperparameters',
        '2. Train model on training data',
        '3. Monitor training progress (loss, metrics)',
        '4. Implement early stopping if applicable',
        '5. Track training time',
        '6. Monitor for convergence',
        '7. Save trained model',
        '8. Save training history',
        '9. Log model size and complexity',
        '10. Generate learning curves',
        '11. Check for training issues (NaN, divergence)',
        '12. Return trained model and statistics'
      ],
      outputFormat: 'JSON object with trained model and training statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'model', 'trainingTime', 'convergence', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        model: { type: 'string', description: 'Path to saved trained model' },
        trainingTime: { type: 'number', description: 'Training time in seconds' },
        modelSize: { type: 'string', description: 'Model file size' },
        convergence: {
          type: 'object',
          properties: {
            converged: { type: 'boolean' },
            finalLoss: { type: 'number' },
            epochs: { type: 'number' }
          }
        },
        trainingHistory: { type: 'string', description: 'Path to training history' },
        issues: { type: 'array', items: { type: 'string' }, description: 'Any training issues encountered' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' },
              iteration: { type: 'number' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'model-training', `iteration-${args.iteration}`]
}));

// Phase 5.3: Model Evaluation
export const modelEvaluationTask = defineTask('model-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration ${args.iteration}: Model Evaluation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Evaluation Engineer',
      task: 'Evaluate trained model on validation set',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        model: args.model,
        validationData: args.validationData,
        targetMetric: args.targetMetric,
        iteration: args.iteration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load trained model',
        '2. Load validation data',
        '3. Generate predictions on validation set',
        '4. Compute target metric',
        '5. Compute all standard metrics for task type',
        '6. For classification: accuracy, precision, recall, F1, AUC-ROC',
        '7. For regression: MAE, MSE, RMSE, R2',
        '8. Generate confusion matrix (classification)',
        '9. Plot ROC curve (binary classification)',
        '10. Analyze prediction distribution',
        '11. Identify failure modes or biases',
        '12. Save evaluation report and visualizations'
      ],
      outputFormat: 'JSON object with evaluation metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          description: 'All evaluation metrics'
        },
        confusionMatrix: { type: 'array', description: 'Confusion matrix for classification' },
        predictionStats: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            std: { type: 'number' },
            min: { type: 'number' },
            max: { type: 'number' }
          }
        },
        failureModes: { type: 'array', items: { type: 'string' }, description: 'Identified weaknesses' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'evaluation', `iteration-${args.iteration}`]
}));

// Phase 5.4: Experiment Logging
export const experimentLoggingTask = defineTask('experiment-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration ${args.iteration}: Log Experiment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Engineer',
      task: 'Log experiment to tracking backend (MLflow, W&B, etc.)',
      context: {
        projectName: args.projectName,
        experimentId: args.experimentId,
        experimentTrackingBackend: args.experimentTrackingBackend,
        iteration: args.iteration,
        hyperparameters: args.hyperparameters,
        metrics: args.metrics,
        model: args.model,
        artifacts: args.artifacts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Connect to experiment tracking backend',
        '2. Create new run within experiment',
        '3. Log all hyperparameters',
        '4. Log all metrics',
        '5. Log model artifact',
        '6. Log training artifacts (plots, logs, etc.)',
        '7. Tag run with iteration number and metadata',
        '8. Set run status to finished',
        '9. Generate tracking UI link',
        '10. Save experiment metadata locally'
      ],
      outputFormat: 'JSON object with experiment logging confirmation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runId'],
      properties: {
        success: { type: 'boolean' },
        runId: { type: 'string', description: 'Experiment tracking run ID' },
        trackingUrl: { type: 'string', description: 'URL to view experiment in tracking UI' },
        backend: { type: 'string' },
        loggedItems: {
          type: 'object',
          properties: {
            hyperparameters: { type: 'number' },
            metrics: { type: 'number' },
            artifacts: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'experiment-tracking', `iteration-${args.iteration}`]
}));

// Phase 6: Cross-Validation
export const crossValidationTask = defineTask('cross-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Cross-Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Validation Engineer',
      task: 'Perform k-fold cross-validation on best model configuration',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        trainingData: args.trainingData,
        bestModelConfig: args.bestModelConfig,
        targetMetric: args.targetMetric,
        folds: args.folds,
        randomSeed: args.randomSeed,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load full training data',
        '2. Set up k-fold cross-validation splitter',
        '3. For each fold:',
        '   - Split data into train/val',
        '   - Train model with best config',
        '   - Evaluate on fold validation set',
        '   - Record metrics',
        '4. Compute mean and std of metrics across folds',
        '5. Analyze variance in performance',
        '6. Generate box plots of metric distributions',
        '7. Check for outlier folds',
        '8. Save CV results for each fold',
        '9. Generate cross-validation report'
      ],
      outputFormat: 'JSON object with cross-validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        folds: { type: 'number' },
        metrics: {
          type: 'object',
          description: 'Metrics with mean and std across folds'
        },
        foldResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fold: { type: 'number' },
              metrics: { type: 'object' }
            }
          }
        },
        varianceAnalysis: {
          type: 'object',
          properties: {
            highVarianceMetrics: { type: 'array', items: { type: 'string' } },
            outlierFolds: { type: 'array', items: { type: 'number' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'cross-validation', 'validation']
}));

// Phase 7: Test Set Evaluation
export const testSetEvaluationTask = defineTask('test-set-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Set Evaluation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Evaluation Engineer',
      task: 'Evaluate best model on held-out test set',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        model: args.model,
        testData: args.testData,
        targetMetric: args.targetMetric,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load best trained model',
        '2. Load held-out test data',
        '3. Generate predictions on test set',
        '4. Compute all evaluation metrics',
        '5. Compare test vs validation performance',
        '6. Analyze generalization gap',
        '7. Generate detailed error analysis',
        '8. Create prediction examples (best/worst)',
        '9. Generate visualizations (confusion matrix, ROC, etc.)',
        '10. Save test evaluation report'
      ],
      outputFormat: 'JSON object with test set evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          description: 'All test set metrics'
        },
        generalizationGap: {
          type: 'object',
          description: 'Difference between validation and test performance'
        },
        errorAnalysis: {
          type: 'object',
          properties: {
            worstPredictions: { type: 'array' },
            bestPredictions: { type: 'array' },
            commonErrors: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'test-evaluation', 'validation']
}));

// Phase 8: Performance Analysis
export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Performance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior ML Engineer and Data Scientist',
      task: 'Conduct comprehensive performance analysis of training results',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        bestModel: args.bestModel,
        experimentResults: args.experimentResults,
        crossValidation: args.crossValidation,
        testEvaluation: args.testEvaluation,
        targetMetric: args.targetMetric,
        targetPerformance: args.targetPerformance,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze learning trajectory across iterations',
        '2. Identify which hyperparameters had biggest impact',
        '3. Compare performance across train/val/test sets',
        '4. Assess model stability from cross-validation',
        '5. Evaluate whether target performance was achieved',
        '6. Analyze convergence behavior',
        '7. Identify potential overfitting or underfitting',
        '8. Compare against baseline performance',
        '9. Generate performance visualizations',
        '10. Provide insights and recommendations',
        '11. Create comprehensive analysis report'
      ],
      outputFormat: 'JSON object with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'insights', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        insights: {
          type: 'object',
          properties: {
            performanceTrend: { type: 'string' },
            keyHyperparameters: { type: 'array', items: { type: 'string' } },
            generalization: { type: 'string' },
            stability: { type: 'string' },
            overfitting: { type: 'boolean' },
            underfitting: { type: 'boolean' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'analysis', 'performance']
}));

// Phase 9: Model Packaging
export const modelPackagingTask = defineTask('model-packaging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Model Packaging - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Engineer specializing in model deployment',
      task: 'Package model with all necessary artifacts for deployment',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        bestModel: args.bestModel,
        dataPreprocessing: args.dataPreprocessing,
        performanceMetrics: args.performanceMetrics,
        crossValidationMetrics: args.crossValidationMetrics,
        testMetrics: args.testMetrics,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create model package directory',
        '2. Copy best trained model',
        '3. Copy preprocessing pipeline',
        '4. Save model metadata (hyperparameters, metrics, version)',
        '5. Save feature schema and requirements',
        '6. Generate model card with documentation',
        '7. Create inference script example',
        '8. Package dependencies (requirements.txt)',
        '9. Create README with usage instructions',
        '10. Generate model signature for serving',
        '11. Create deployment configuration',
        '12. Archive package as .zip or .tar.gz'
      ],
      outputFormat: 'JSON object with model package details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'modelPath', 'packagePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        modelPath: { type: 'string', description: 'Path to trained model file' },
        packagePath: { type: 'string', description: 'Path to complete model package' },
        modelVersion: { type: 'string' },
        modelSignature: {
          type: 'object',
          properties: {
            inputs: { type: 'object' },
            outputs: { type: 'object' }
          }
        },
        packageContents: {
          type: 'array',
          items: { type: 'string' }
        },
        modelCard: { type: 'string', description: 'Path to model card' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'packaging', 'deployment']
}));

// Phase 10: Experiment Comparison
export const experimentComparisonTask = defineTask('experiment-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Experiment Comparison - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Research Engineer',
      task: 'Generate comprehensive comparison of all experiments',
      context: {
        projectName: args.projectName,
        experimentResults: args.experimentResults,
        bestModel: args.bestModel,
        targetMetric: args.targetMetric,
        targetPerformance: args.targetPerformance,
        converged: args.converged,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compile all experiment results into comparison table',
        '2. Rank experiments by target metric',
        '3. Plot performance across iterations',
        '4. Compare hyperparameter configurations',
        '5. Visualize hyperparameter impact',
        '6. Generate parallel coordinates plot',
        '7. Create performance heatmaps',
        '8. Identify best performing hyperparameter ranges',
        '9. Show convergence trajectory',
        '10. Highlight best model',
        '11. Create executive summary',
        '12. Generate comparison report in Markdown'
      ],
      outputFormat: 'JSON object with experiment comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        comparisonTable: { type: 'string', description: 'Path to experiment comparison CSV' },
        rankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              iteration: { type: 'number' },
              performance: { type: 'number' }
            }
          }
        },
        hyperparameterInsights: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'comparison', 'visualization']
}));

// Phase 11: Final Model Review
export const finalModelReviewTask = defineTask('final-model-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Final Model Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal ML Engineer and Technical Reviewer',
      task: 'Conduct final comprehensive review of trained model and provide deployment recommendation',
      context: {
        projectName: args.projectName,
        modelType: args.modelType,
        bestModel: args.bestModel,
        experimentResults: args.experimentResults,
        crossValidation: args.crossValidation,
        testEvaluation: args.testEvaluation,
        performanceAnalysis: args.performanceAnalysis,
        targetMetric: args.targetMetric,
        targetPerformance: args.targetPerformance,
        converged: args.converged,
        stoppedEarly: args.stoppedEarly,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review whether target performance was achieved',
        '2. Assess model generalization from CV and test results',
        '3. Check for overfitting or underfitting signs',
        '4. Evaluate training stability and convergence',
        '5. Review hyperparameter tuning effectiveness',
        '6. Assess model complexity vs performance tradeoff',
        '7. Check for data quality or bias concerns',
        '8. Evaluate deployment readiness',
        '9. Identify any blocking issues',
        '10. Provide clear deployment recommendation (approve/reject/revise)',
        '11. List strengths and concerns',
        '12. Suggest follow-up actions if needed',
        '13. Generate final review report'
      ],
      outputFormat: 'JSON object with final review and verdict'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'recommendation', 'reportPath', 'artifacts'],
      properties: {
        verdict: { type: 'string', description: 'Overall assessment' },
        approved: { type: 'boolean', description: 'Recommended for deployment' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        recommendation: { type: 'string', description: 'Deployment recommendation' },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        followUpActions: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training-pipeline', 'review', 'final-approval']
}));

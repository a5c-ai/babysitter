/**
 * @process specializations/data-science-ml/automl-pipeline
 * @description AutoML Pipeline Orchestration - Automated machine learning workflows with algorithm selection,
 * hyperparameter optimization, ensemble creation, and model selection with human-in-the-loop validation gates.
 * @inputs { dataPath: string, targetColumn: string, problemType: string, timeLimit: number, targetMetric: string }
 * @outputs { success: boolean, bestModel: object, leaderboard: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/automl-pipeline', {
 *   dataPath: 'data/training.csv',
 *   targetColumn: 'churn',
 *   problemType: 'binary-classification',
 *   timeLimit: 3600,
 *   targetMetric: 'auc'
 * });
 *
 * @references
 * - Auto-sklearn: https://automl.github.io/auto-sklearn/
 * - H2O AutoML: https://docs.h2o.ai/h2o/latest-stable/h2o-docs/automl.html
 * - MLflow Experiment Tracking: https://mlflow.org/
 * - Google AutoML: https://cloud.google.com/automl
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * AutoML Pipeline Orchestration Process
 *
 * Demonstrates:
 * - Automated algorithm selection and evaluation
 * - Hyperparameter optimization with multiple strategies
 * - Parallel model training and evaluation
 * - Ensemble model creation and validation
 * - Quality convergence with human-in-the-loop gates
 * - Comprehensive model comparison and selection
 * - Breakpoints for critical decision points
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.dataPath - Path to training dataset
 * @param {string} inputs.targetColumn - Target variable column name
 * @param {string} inputs.problemType - ML problem type (binary-classification, multiclass-classification, regression)
 * @param {number} inputs.timeLimit - Time limit in seconds for AutoML search
 * @param {string} inputs.targetMetric - Optimization metric (auc, f1, accuracy, rmse, etc.)
 * @param {number} inputs.targetPerformance - Target performance threshold
 * @param {boolean} inputs.enableEnsembles - Enable ensemble model creation
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    dataPath,
    targetColumn,
    problemType,
    timeLimit = 3600,
    targetMetric = 'auc',
    targetPerformance = 0.85,
    enableEnsembles = true,
    maxModels = 50,
    validationStrategy = 'cv',
    outputDir = 'automl-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // ============================================================================
  // PHASE 1: DATA PREPARATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Data Preparation and Validation');

  const dataPreparation = await ctx.task(dataPreparationTask, {
    dataPath,
    targetColumn,
    problemType,
    validationStrategy,
    outputDir
  });

  if (!dataPreparation.success) {
    return {
      success: false,
      error: 'Data preparation failed',
      details: dataPreparation,
      metadata: { processId: 'specializations/data-science-ml/automl-pipeline', timestamp: startTime }
    };
  }

  artifacts.push(...dataPreparation.artifacts);

  // Breakpoint: Review data preparation results
  await ctx.breakpoint({
    question: `Data prepared for AutoML. Dataset: ${dataPreparation.rowCount} rows, ${dataPreparation.featureCount} features. Validation strategy: ${validationStrategy}. Proceed with AutoML search?`,
    title: 'Data Preparation Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/data-preparation-report.md`, format: 'markdown' },
        { path: `${outputDir}/data-statistics.json`, format: 'code', language: 'json' }
      ],
      summary: {
        rowCount: dataPreparation.rowCount,
        featureCount: dataPreparation.featureCount,
        targetDistribution: dataPreparation.targetDistribution,
        missingValues: dataPreparation.missingValuePercentage
      }
    }
  });

  // ============================================================================
  // PHASE 2: ALGORITHM SELECTION AND BASELINE MODELS
  // ============================================================================

  ctx.log('info', 'Phase 2: Algorithm Selection and Baseline Models');

  const algorithmSelection = await ctx.task(algorithmSelectionTask, {
    problemType,
    dataCharacteristics: dataPreparation.characteristics,
    timeLimit,
    targetMetric,
    outputDir
  });

  artifacts.push(...algorithmSelection.artifacts);

  // Train baseline models in parallel
  ctx.log('info', 'Training baseline models in parallel');

  const baselineResults = await ctx.parallel.all(
    algorithmSelection.selectedAlgorithms.map((algorithm, index) =>
      () => ctx.task(baselineModelTask, {
        dataPath: dataPreparation.processedDataPath,
        targetColumn,
        algorithm: algorithm.name,
        problemType,
        targetMetric,
        validationStrategy,
        taskIndex: index + 1,
        outputDir
      })
    )
  );

  artifacts.push(...baselineResults.flatMap(r => r.artifacts));

  // Evaluate baseline results
  const baselineEvaluation = await ctx.task(baselineEvaluationTask, {
    baselineResults,
    targetMetric,
    targetPerformance,
    outputDir
  });

  artifacts.push(...baselineEvaluation.artifacts);

  // ============================================================================
  // PHASE 3: HYPERPARAMETER OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Hyperparameter Optimization');

  // Select top performing algorithms for HPO
  const topAlgorithms = baselineEvaluation.topAlgorithms.slice(0, 5);

  // Breakpoint: Review baseline results before HPO
  await ctx.breakpoint({
    question: `Baseline models trained. Best baseline score: ${baselineEvaluation.bestScore.toFixed(4)}. Top ${topAlgorithms.length} algorithms selected for HPO. Continue?`,
    title: 'Baseline Models Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/baseline-leaderboard.md`, format: 'markdown' },
        { path: `${outputDir}/baseline-results.json`, format: 'code', language: 'json' }
      ],
      summary: {
        totalModels: baselineResults.length,
        bestScore: baselineEvaluation.bestScore,
        bestAlgorithm: baselineEvaluation.bestAlgorithm,
        topAlgorithms: topAlgorithms.map(a => a.name)
      }
    }
  });

  // Parallel HPO for top algorithms
  ctx.log('info', `Running hyperparameter optimization for ${topAlgorithms.length} algorithms`);

  const hpoResults = await ctx.parallel.all(
    topAlgorithms.map((algorithm, index) =>
      () => ctx.task(hyperparameterOptimizationTask, {
        dataPath: dataPreparation.processedDataPath,
        targetColumn,
        algorithm: algorithm.name,
        problemType,
        targetMetric,
        validationStrategy,
        timeLimit: Math.floor(timeLimit * 0.5 / topAlgorithms.length),
        taskIndex: index + 1,
        outputDir
      })
    )
  );

  artifacts.push(...hpoResults.flatMap(r => r.artifacts));

  // Evaluate HPO results
  const hpoEvaluation = await ctx.task(hpoEvaluationTask, {
    hpoResults,
    baselineEvaluation,
    targetMetric,
    targetPerformance,
    outputDir
  });

  artifacts.push(...hpoEvaluation.artifacts);

  // ============================================================================
  // PHASE 4: ENSEMBLE CREATION (if enabled)
  // ============================================================================

  let ensembleResults = null;
  if (enableEnsembles && hpoResults.length >= 2) {
    ctx.log('info', 'Phase 4: Ensemble Model Creation');

    ensembleResults = await ctx.task(ensembleCreationTask, {
      dataPath: dataPreparation.processedDataPath,
      targetColumn,
      baseModels: hpoEvaluation.topModels,
      problemType,
      targetMetric,
      validationStrategy,
      outputDir
    });

    artifacts.push(...ensembleResults.artifacts);

    // Breakpoint: Review ensemble results
    if (ensembleResults.ensembles.length > 0) {
      await ctx.breakpoint({
        question: `Ensemble models created. Best ensemble score: ${ensembleResults.bestEnsembleScore.toFixed(4)}. Compare with best individual model: ${hpoEvaluation.bestScore.toFixed(4)}. Review ensembles?`,
        title: 'Ensemble Models Review',
        context: {
          runId: ctx.runId,
          files: [
            { path: `${outputDir}/ensemble-results.md`, format: 'markdown' },
            { path: `${outputDir}/ensemble-comparison.json`, format: 'code', language: 'json' }
          ],
          summary: {
            ensemblesCreated: ensembleResults.ensembles.length,
            bestEnsembleScore: ensembleResults.bestEnsembleScore,
            bestIndividualScore: hpoEvaluation.bestScore,
            improvement: ensembleResults.bestEnsembleScore - hpoEvaluation.bestScore
          }
        }
      });
    }
  }

  // ============================================================================
  // PHASE 5: FINAL MODEL SELECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Final Model Selection and Validation');

  const finalSelection = await ctx.task(finalModelSelectionTask, {
    dataPath: dataPreparation.processedDataPath,
    targetColumn,
    baselineResults,
    hpoResults,
    ensembleResults,
    targetMetric,
    targetPerformance,
    problemType,
    outputDir
  });

  artifacts.push(...finalSelection.artifacts);

  const targetMet = finalSelection.bestModel.score >= targetPerformance;

  // Comprehensive model validation on hold-out test set
  ctx.log('info', 'Running comprehensive model validation');

  const [
    testSetValidation,
    fairnessValidation,
    robustnessValidation,
    interpretabilityAnalysis
  ] = await ctx.parallel.all([
    () => ctx.task(testSetValidationTask, {
      dataPath: dataPreparation.testDataPath,
      targetColumn,
      model: finalSelection.bestModel,
      problemType,
      targetMetric,
      outputDir
    }),
    () => ctx.task(fairnessValidationTask, {
      dataPath: dataPreparation.testDataPath,
      targetColumn,
      model: finalSelection.bestModel,
      problemType,
      sensitiveFeatures: inputs.sensitiveFeatures || [],
      outputDir
    }),
    () => ctx.task(robustnessValidationTask, {
      dataPath: dataPreparation.testDataPath,
      targetColumn,
      model: finalSelection.bestModel,
      problemType,
      outputDir
    }),
    () => ctx.task(interpretabilityAnalysisTask, {
      dataPath: dataPreparation.testDataPath,
      targetColumn,
      model: finalSelection.bestModel,
      problemType,
      outputDir
    })
  ]);

  artifacts.push(
    ...testSetValidation.artifacts,
    ...fairnessValidation.artifacts,
    ...robustnessValidation.artifacts,
    ...interpretabilityAnalysis.artifacts
  );

  // ============================================================================
  // PHASE 6: FINAL REVIEW AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Final Review and Documentation');

  const [
    finalReport,
    modelCard,
    deploymentPackage
  ] = await ctx.parallel.all([
    () => ctx.task(finalReportTask, {
      dataPreparation,
      algorithmSelection,
      baselineEvaluation,
      hpoEvaluation,
      ensembleResults,
      finalSelection,
      testSetValidation,
      fairnessValidation,
      robustnessValidation,
      interpretabilityAnalysis,
      targetMetric,
      targetPerformance,
      targetMet,
      outputDir
    }),
    () => ctx.task(modelCardTask, {
      model: finalSelection.bestModel,
      dataCharacteristics: dataPreparation.characteristics,
      performanceMetrics: testSetValidation.metrics,
      fairnessMetrics: fairnessValidation.metrics,
      limitations: [...robustnessValidation.limitations, ...interpretabilityAnalysis.limitations],
      intendedUse: inputs.intendedUse || 'General purpose ML model',
      outputDir
    }),
    () => ctx.task(deploymentPackageTask, {
      model: finalSelection.bestModel,
      dataPreparation,
      preprocessing: dataPreparation.preprocessing,
      dependencies: finalSelection.dependencies,
      outputDir
    })
  ]);

  artifacts.push(
    ...finalReport.artifacts,
    ...modelCard.artifacts,
    ...deploymentPackage.artifacts
  );

  // Final breakpoint for approval
  await ctx.breakpoint({
    question: `AutoML complete. Best model: ${finalSelection.bestModel.algorithm}. Score: ${finalSelection.bestModel.score.toFixed(4)}/${targetPerformance}. ${targetMet ? 'Target met!' : 'Target not met.'} ${testSetValidation.verdict}. Approve for deployment?`,
    title: 'Final AutoML Results Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/final-report.md`, format: 'markdown' },
        { path: `${outputDir}/model-card.md`, format: 'markdown' },
        { path: `${outputDir}/leaderboard.json`, format: 'code', language: 'json' },
        { path: `${outputDir}/deployment-package.zip`, format: 'binary' }
      ],
      summary: {
        bestModel: finalSelection.bestModel.algorithm,
        bestScore: finalSelection.bestModel.score,
        targetPerformance,
        targetMet,
        totalModelsEvaluated: finalSelection.totalModelsEvaluated,
        testScore: testSetValidation.testScore,
        fairnessApproved: fairnessValidation.approved,
        robustnessApproved: robustnessValidation.approved
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  // Return comprehensive results
  return {
    success: targetMet,
    bestModel: {
      algorithm: finalSelection.bestModel.algorithm,
      score: finalSelection.bestModel.score,
      hyperparameters: finalSelection.bestModel.hyperparameters,
      modelPath: finalSelection.bestModel.path,
      testScore: testSetValidation.testScore
    },
    leaderboard: finalSelection.leaderboard,
    targetMetric,
    targetPerformance,
    targetMet,
    totalModelsEvaluated: finalSelection.totalModelsEvaluated,
    validation: {
      testSet: testSetValidation.metrics,
      fairness: fairnessValidation.metrics,
      robustness: robustnessValidation.metrics,
      interpretability: interpretabilityAnalysis.summary
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-science-ml/automl-pipeline',
      timestamp: startTime,
      dataPath,
      targetColumn,
      problemType,
      timeLimit,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Data Preparation and Validation
export const dataPreparationTask = defineTask('data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare and validate data for AutoML',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer and data scientist',
      task: 'Prepare dataset for AutoML pipeline with validation and splitting',
      context: args,
      instructions: [
        'Load dataset from provided path',
        'Validate data quality (missing values, outliers, data types)',
        'Analyze target variable distribution and check for class imbalance',
        'Split data into train/validation/test sets based on validation strategy',
        'Generate data statistics and characteristics',
        'Identify feature types (numerical, categorical, datetime)',
        'Apply basic preprocessing (handle missing values, encode categoricals)',
        'Save processed datasets and metadata',
        'Generate data preparation report'
      ],
      outputFormat: 'JSON with success, processedDataPath, testDataPath, rowCount, featureCount, characteristics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'processedDataPath', 'testDataPath', 'rowCount', 'featureCount', 'characteristics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        processedDataPath: { type: 'string' },
        testDataPath: { type: 'string' },
        rowCount: { type: 'number' },
        featureCount: { type: 'number' },
        targetDistribution: { type: 'object' },
        missingValuePercentage: { type: 'number' },
        characteristics: {
          type: 'object',
          properties: {
            numericalFeatures: { type: 'number' },
            categoricalFeatures: { type: 'number' },
            datetimeFeatures: { type: 'number' },
            classBalance: { type: 'object' },
            datasetSize: { type: 'string' }
          }
        },
        preprocessing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'data-preparation', 'validation']
}));

// Task 2: Algorithm Selection
export const algorithmSelectionTask = defineTask('algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select candidate ML algorithms',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning expert',
      task: 'Select appropriate ML algorithms for AutoML search based on problem type and data characteristics',
      context: args,
      instructions: [
        'Analyze problem type and data characteristics',
        'Select candidate algorithms appropriate for the problem (trees, linear, neural nets, etc.)',
        'For classification: consider logistic regression, random forest, gradient boosting (XGBoost, LightGBM, CatBoost), SVM, neural networks',
        'For regression: consider linear regression, random forest, gradient boosting, SVR, neural networks',
        'Consider dataset size when selecting algorithms (some work better on small/large data)',
        'Consider feature types (some algorithms handle categoricals natively)',
        'Prioritize algorithms by expected performance and training time',
        'Define search space for each algorithm',
        'Estimate time allocation per algorithm'
      ],
      outputFormat: 'JSON with selectedAlgorithms, searchSpaces, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedAlgorithms', 'searchSpaces', 'artifacts'],
      properties: {
        selectedAlgorithms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              expectedPerformance: { type: 'string', enum: ['high', 'medium', 'low'] },
              expectedTrainingTime: { type: 'string', enum: ['fast', 'medium', 'slow'] },
              priority: { type: 'number' }
            }
          }
        },
        searchSpaces: { type: 'object' },
        rationale: { type: 'string' },
        timeAllocation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'algorithm-selection', 'planning']
}));

// Task 3: Baseline Model Training
export const baselineModelTask = defineTask('baseline-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Train baseline model: ${args.algorithm}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer',
      task: 'Train baseline ML model with default hyperparameters',
      context: args,
      instructions: [
        'Load training data',
        'Initialize model with default hyperparameters',
        'Train model using cross-validation or train/validation split',
        'Evaluate model performance on validation set',
        'Calculate specified target metric',
        'Record training time and resource usage',
        'Save model and predictions',
        'Generate performance report'
      ],
      outputFormat: 'JSON with algorithm, score, trainingTime, predictions, modelPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'score', 'trainingTime', 'modelPath', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
        score: { type: 'number' },
        metrics: { type: 'object' },
        trainingTime: { type: 'number' },
        predictions: { type: 'string' },
        modelPath: { type: 'string' },
        hyperparameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'baseline-model', 'training', `algorithm-${args.algorithm}`]
}));

// Task 4: Baseline Evaluation
export const baselineEvaluationTask = defineTask('baseline-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate baseline models',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer',
      task: 'Evaluate and rank baseline models',
      context: args,
      instructions: [
        'Compare performance metrics across all baseline models',
        'Rank models by target metric',
        'Identify top performing algorithms',
        'Analyze performance vs training time trade-offs',
        'Assess if any baseline meets target performance',
        'Generate leaderboard visualization',
        'Provide recommendations for HPO phase'
      ],
      outputFormat: 'JSON with topAlgorithms, bestScore, bestAlgorithm, leaderboard, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topAlgorithms', 'bestScore', 'bestAlgorithm', 'leaderboard', 'artifacts'],
      properties: {
        topAlgorithms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              score: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        bestScore: { type: 'number' },
        bestAlgorithm: { type: 'string' },
        leaderboard: { type: 'array' },
        targetMet: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'baseline-evaluation', 'ranking']
}));

// Task 5: Hyperparameter Optimization
export const hyperparameterOptimizationTask = defineTask('hyperparameter-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `HPO for ${args.algorithm}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer and optimization specialist',
      task: 'Perform hyperparameter optimization for ML algorithm',
      context: args,
      instructions: [
        'Define hyperparameter search space for algorithm',
        'Select optimization strategy (random search, Bayesian optimization, or grid search)',
        'Execute hyperparameter search within time limit',
        'Track all trials with metrics and hyperparameters',
        'Use cross-validation to evaluate each configuration',
        'Select best hyperparameter configuration',
        'Train final model with best hyperparameters',
        'Generate HPO report with search trajectory'
      ],
      outputFormat: 'JSON with algorithm, bestScore, bestHyperparameters, trials, modelPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'bestScore', 'bestHyperparameters', 'trials', 'modelPath', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
        bestScore: { type: 'number' },
        bestHyperparameters: { type: 'object' },
        trials: { type: 'number' },
        improvementOverBaseline: { type: 'number' },
        searchStrategy: { type: 'string' },
        modelPath: { type: 'string' },
        trainingTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'hpo', 'optimization', `algorithm-${args.algorithm}`]
}));

// Task 6: HPO Evaluation
export const hpoEvaluationTask = defineTask('hpo-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate HPO results',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer',
      task: 'Evaluate and rank models after hyperparameter optimization',
      context: args,
      instructions: [
        'Compare HPO results with baseline performance',
        'Rank all optimized models by target metric',
        'Calculate improvement from hyperparameter tuning',
        'Identify best overall model',
        'Generate comprehensive leaderboard',
        'Assess if target performance is met',
        'Provide insights on which algorithms benefit most from tuning'
      ],
      outputFormat: 'JSON with topModels, bestScore, bestAlgorithm, leaderboard, improvement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topModels', 'bestScore', 'bestAlgorithm', 'leaderboard', 'artifacts'],
      properties: {
        topModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithm: { type: 'string' },
              score: { type: 'number' },
              hyperparameters: { type: 'object' },
              modelPath: { type: 'string' }
            }
          }
        },
        bestScore: { type: 'number' },
        bestAlgorithm: { type: 'string' },
        leaderboard: { type: 'array' },
        improvement: { type: 'number' },
        targetMet: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'hpo-evaluation', 'ranking']
}));

// Task 7: Ensemble Creation
export const ensembleCreationTask = defineTask('ensemble-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create ensemble models',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer specializing in ensemble methods',
      task: 'Create and evaluate ensemble models from base models',
      context: args,
      instructions: [
        'Load predictions from top base models',
        'Create voting/averaging ensemble',
        'Create stacking ensemble with meta-learner',
        'Create blending ensemble',
        'Evaluate each ensemble on validation set',
        'Compare ensemble performance with best individual model',
        'Select best ensemble configuration',
        'Save ensemble models and configurations'
      ],
      outputFormat: 'JSON with ensembles, bestEnsembleScore, bestEnsemble, improvement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ensembles', 'bestEnsembleScore', 'artifacts'],
      properties: {
        ensembles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              score: { type: 'number' },
              baseModels: { type: 'array', items: { type: 'string' } },
              modelPath: { type: 'string' }
            }
          }
        },
        bestEnsembleScore: { type: 'number' },
        bestEnsemble: { type: 'object' },
        improvement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'ensemble', 'model-selection']
}));

// Task 8: Final Model Selection
export const finalModelSelectionTask = defineTask('final-model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select final model',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer',
      task: 'Select final model considering performance, complexity, and deployment requirements',
      context: args,
      instructions: [
        'Aggregate all models from baseline, HPO, and ensemble phases',
        'Rank models by target metric',
        'Consider model complexity and inference time',
        'Evaluate deployment requirements (dependencies, model size)',
        'Select best model balancing performance and practicality',
        'Generate comprehensive leaderboard',
        'Document model selection rationale'
      ],
      outputFormat: 'JSON with bestModel, leaderboard, totalModelsEvaluated, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bestModel', 'leaderboard', 'totalModelsEvaluated', 'artifacts'],
      properties: {
        bestModel: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            score: { type: 'number' },
            hyperparameters: { type: 'object' },
            path: { type: 'string' },
            complexity: { type: 'string' },
            inferenceTime: { type: 'number' }
          }
        },
        leaderboard: { type: 'array' },
        totalModelsEvaluated: { type: 'number' },
        rationale: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'final-selection', 'model-selection']
}));

// Task 9: Test Set Validation
export const testSetValidationTask = defineTask('test-set-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate on hold-out test set',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer',
      task: 'Validate final model on hold-out test set',
      context: args,
      instructions: [
        'Load hold-out test set',
        'Generate predictions on test set',
        'Calculate all relevant metrics',
        'Analyze prediction errors and confusion matrix',
        'Compare test performance with validation performance',
        'Check for overfitting or underfitting',
        'Generate comprehensive test report'
      ],
      outputFormat: 'JSON with testScore, metrics, verdict, overfitting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testScore', 'metrics', 'verdict', 'artifacts'],
      properties: {
        testScore: { type: 'number' },
        metrics: { type: 'object' },
        confusionMatrix: { type: 'array' },
        overfitting: { type: 'boolean' },
        performanceGap: { type: 'number' },
        verdict: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'validation', 'test-set']
}));

// Task 10: Fairness Validation
export const fairnessValidationTask = defineTask('fairness-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate model fairness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI ethics specialist and machine learning engineer',
      task: 'Assess model fairness across demographic groups',
      context: args,
      instructions: [
        'Identify sensitive features if provided',
        'Calculate fairness metrics (demographic parity, equal opportunity, equalized odds)',
        'Analyze model performance across different demographic groups',
        'Identify bias and disparate impact',
        'Assess fairness thresholds',
        'Recommend bias mitigation strategies if needed',
        'Generate fairness report'
      ],
      outputFormat: 'JSON with approved, metrics, disparities, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'metrics', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        metrics: { type: 'object' },
        disparities: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'validation', 'fairness', 'ethics']
}));

// Task 11: Robustness Validation
export const robustnessValidationTask = defineTask('robustness-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate model robustness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer',
      task: 'Assess model robustness to input perturbations and edge cases',
      context: args,
      instructions: [
        'Test model with noisy inputs',
        'Test model with edge case values',
        'Analyze prediction confidence distributions',
        'Check for prediction instability',
        'Identify input regions with high uncertainty',
        'Assess model resilience',
        'Generate robustness report'
      ],
      outputFormat: 'JSON with approved, metrics, limitations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'metrics', 'limitations', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        metrics: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'validation', 'robustness']
}));

// Task 12: Interpretability Analysis
export const interpretabilityAnalysisTask = defineTask('interpretability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze model interpretability',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer specializing in explainable AI',
      task: 'Generate model explanations and feature importance',
      context: args,
      instructions: [
        'Calculate global feature importance',
        'Generate SHAP or LIME explanations for sample predictions',
        'Identify most influential features',
        'Analyze feature interactions',
        'Generate interpretability visualizations',
        'Document model decision logic',
        'Assess explanation quality and clarity'
      ],
      outputFormat: 'JSON with featureImportance, explanations, summary, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['featureImportance', 'summary', 'artifacts'],
      properties: {
        featureImportance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              importance: { type: 'number' }
            }
          }
        },
        explanations: { type: 'object' },
        summary: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'interpretability', 'explainability']
}));

// Task 13: Final Report Generation
export const finalReportTask = defineTask('final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate final AutoML report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer and machine learning engineer',
      task: 'Generate comprehensive AutoML final report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Document AutoML search process and phases',
        'Present model leaderboard and rankings',
        'Document best model details and performance',
        'Include validation results (test, fairness, robustness)',
        'Summarize interpretability findings',
        'Provide deployment recommendations',
        'Document limitations and caveats',
        'Format as professional Markdown report'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'reporting', 'documentation']
}));

// Task 14: Model Card Generation
export const modelCardTask = defineTask('model-card', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate model card',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML documentation specialist',
      task: 'Generate comprehensive model card documentation',
      context: args,
      instructions: [
        'Document model details (algorithm, hyperparameters)',
        'Describe intended use and limitations',
        'Document training data characteristics',
        'Present performance metrics across all dimensions',
        'Document fairness and bias considerations',
        'List ethical considerations',
        'Provide usage recommendations',
        'Follow Model Card template standards'
      ],
      outputFormat: 'JSON with modelCardPath, sections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modelCardPath', 'artifacts'],
      properties: {
        modelCardPath: { type: 'string' },
        sections: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'model-card', 'documentation']
}));

// Task 15: Deployment Package
export const deploymentPackageTask = defineTask('deployment-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create deployment package',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps engineer',
      task: 'Package model for production deployment',
      context: args,
      instructions: [
        'Package trained model files',
        'Include preprocessing pipeline and artifacts',
        'Generate inference code and API wrapper',
        'Create requirements.txt with dependencies',
        'Generate Docker configuration if needed',
        'Create deployment documentation',
        'Include example usage code',
        'Create deployment checklist'
      ],
      outputFormat: 'JSON with packagePath, files, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'files', 'dependencies', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        deploymentInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'automl', 'deployment', 'packaging']
}));

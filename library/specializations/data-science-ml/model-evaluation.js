/**
 * @process specializations/data-science-ml/model-evaluation
 * @description Model Evaluation and Validation Framework - Comprehensive model assessment across multiple dimensions
 * including performance metrics, robustness testing, fairness analysis, explainability, and production readiness checks
 * with iterative validation loops and quality gates.
 * @inputs { modelPath: string, testDataPath: string, modelType: string, targetMetrics?: object, validationLevel?: string }
 * @outputs { success: boolean, overallScore: number, validationResults: object, productionReady: boolean, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/model-evaluation', {
 *   modelPath: 'models/trained/churn-predictor-v2.pkl',
 *   testDataPath: 'data/test/churn_test.csv',
 *   modelType: 'classification',
 *   targetMetrics: { accuracy: 0.85, f1_score: 0.80, auc_roc: 0.88 },
 *   validationLevel: 'comprehensive',
 *   fairnessAttributes: ['age_group', 'gender', 'region'],
 *   explainabilityRequired: true
 * });
 *
 * @references
 * - Google ML Testing: https://developers.google.com/machine-learning/testing-debugging
 * - Model Cards: https://arxiv.org/abs/1810.03993
 * - Fairness Indicators: https://www.tensorflow.org/responsible_ai/fairness_indicators/guide
 * - SHAP (SHapley Additive exPlanations): https://github.com/slundberg/shap
 * - Model Validation Best Practices: https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelPath,
    testDataPath,
    modelType = 'classification',
    targetMetrics = {},
    validationLevel = 'standard', // 'basic', 'standard', 'comprehensive'
    fairnessAttributes = [],
    explainabilityRequired = false,
    robustnessTestsEnabled = true,
    calibrationCheckEnabled = true,
    productionSimulationEnabled = false,
    outputDir = 'model-evaluation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const validationResults = {};
  let overallScore = 0;
  let productionReady = false;

  ctx.log('info', `Starting Model Evaluation and Validation Framework`);
  ctx.log('info', `Model: ${modelPath}, Type: ${modelType}, Level: ${validationLevel}`);

  // ============================================================================
  // PHASE 1: MODEL LOADING AND BASIC VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Loading model and performing basic verification');

  const modelLoadResult = await ctx.task(modelLoadingTask, {
    modelPath,
    testDataPath,
    modelType,
    outputDir
  });

  if (!modelLoadResult.success) {
    return {
      success: false,
      error: 'Model loading or basic verification failed',
      details: modelLoadResult,
      metadata: {
        processId: 'specializations/data-science-ml/model-evaluation',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...modelLoadResult.artifacts);
  validationResults.modelLoad = modelLoadResult;

  // Quality Gate: Model must load successfully and have valid structure
  if (!modelLoadResult.modelValid || modelLoadResult.structureIssues.length > 0) {
    await ctx.breakpoint({
      question: `Model structure issues detected: ${modelLoadResult.structureIssues.length} issues found. Review and approve to continue?`,
      title: 'Model Structure Validation',
      context: {
        runId: ctx.runId,
        modelPath,
        issues: modelLoadResult.structureIssues,
        files: modelLoadResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: PERFORMANCE METRICS EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Evaluating performance metrics on test set');

  const performanceEval = await ctx.task(performanceEvaluationTask, {
    modelPath: modelLoadResult.loadedModelPath,
    testDataPath,
    modelType,
    targetMetrics,
    outputDir
  });

  artifacts.push(...performanceEval.artifacts);
  validationResults.performance = performanceEval;

  // Quality Gate: Check if target metrics are met
  const metricsNotMet = performanceEval.metricsComparison.filter(m => !m.targetMet);
  if (metricsNotMet.length > 0) {
    await ctx.breakpoint({
      question: `${metricsNotMet.length} target metrics not met. Continue validation or adjust targets?`,
      title: 'Performance Metrics Review',
      context: {
        runId: ctx.runId,
        actualMetrics: performanceEval.metrics,
        targetMetrics,
        metricsNotMet: metricsNotMet.map(m => ({
          metric: m.metricName,
          actual: m.actualValue,
          target: m.targetValue
        })),
        files: performanceEval.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: PARALLEL VALIDATION CHECKS (Basic Level)
  // ============================================================================

  ctx.log('info', 'Phase 3: Running parallel basic validation checks');

  const [
    predictionDistribution,
    errorAnalysis,
    confusionMatrixAnalysis
  ] = await ctx.parallel.all([
    () => ctx.task(predictionDistributionTask, {
      modelPath: modelLoadResult.loadedModelPath,
      testDataPath,
      modelType,
      outputDir
    }),
    () => ctx.task(errorAnalysisTask, {
      modelPath: modelLoadResult.loadedModelPath,
      testDataPath,
      modelType,
      performanceMetrics: performanceEval.metrics,
      outputDir
    }),
    () => ctx.task(confusionMatrixTask, {
      modelPath: modelLoadResult.loadedModelPath,
      testDataPath,
      modelType,
      outputDir
    })
  ]);

  validationResults.predictionDistribution = predictionDistribution;
  validationResults.errorAnalysis = errorAnalysis;
  validationResults.confusionMatrix = confusionMatrixAnalysis;

  artifacts.push(
    ...predictionDistribution.artifacts,
    ...errorAnalysis.artifacts,
    ...confusionMatrixAnalysis.artifacts
  );

  // ============================================================================
  // PHASE 4: CALIBRATION ANALYSIS (if enabled)
  // ============================================================================

  let calibrationResult = null;
  if (calibrationCheckEnabled && modelType === 'classification') {
    ctx.log('info', 'Phase 4: Performing calibration analysis');

    calibrationResult = await ctx.task(calibrationAnalysisTask, {
      modelPath: modelLoadResult.loadedModelPath,
      testDataPath,
      outputDir
    });

    validationResults.calibration = calibrationResult;
    artifacts.push(...calibrationResult.artifacts);

    // Quality Gate: Check calibration quality
    if (calibrationResult.calibrationScore < 70) {
      await ctx.breakpoint({
        question: `Model calibration score: ${calibrationResult.calibrationScore}/100. Model predictions may not be well-calibrated. Proceed?`,
        title: 'Calibration Warning',
        context: {
          runId: ctx.runId,
          calibrationScore: calibrationResult.calibrationScore,
          recommendation: 'Consider recalibrating the model using Platt scaling or isotonic regression',
          files: calibrationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 5: ROBUSTNESS TESTING (if enabled and standard+ level)
  // ============================================================================

  let robustnessResults = null;
  if (robustnessTestsEnabled && (validationLevel === 'standard' || validationLevel === 'comprehensive')) {
    ctx.log('info', 'Phase 5: Conducting robustness testing');

    const [
      adversarialTest,
      perturbationTest,
      boundaryTest
    ] = await ctx.parallel.all([
      () => ctx.task(adversarialTestingTask, {
        modelPath: modelLoadResult.loadedModelPath,
        testDataPath,
        modelType,
        outputDir
      }),
      () => ctx.task(perturbationTestingTask, {
        modelPath: modelLoadResult.loadedModelPath,
        testDataPath,
        modelType,
        outputDir
      }),
      () => ctx.task(boundaryTestingTask, {
        modelPath: modelLoadResult.loadedModelPath,
        testDataPath,
        modelType,
        outputDir
      })
    ]);

    robustnessResults = {
      adversarial: adversarialTest,
      perturbation: perturbationTest,
      boundary: boundaryTest,
      overallRobustnessScore: (
        adversarialTest.robustnessScore +
        perturbationTest.robustnessScore +
        boundaryTest.robustnessScore
      ) / 3
    };

    validationResults.robustness = robustnessResults;
    artifacts.push(
      ...adversarialTest.artifacts,
      ...perturbationTest.artifacts,
      ...boundaryTest.artifacts
    );

    // Quality Gate: Check robustness score
    if (robustnessResults.overallRobustnessScore < 70) {
      await ctx.breakpoint({
        question: `Robustness score: ${robustnessResults.overallRobustnessScore.toFixed(2)}/100. Model may be vulnerable to adversarial inputs. Continue?`,
        title: 'Robustness Concerns',
        context: {
          runId: ctx.runId,
          robustnessScore: robustnessResults.overallRobustnessScore,
          adversarialScore: adversarialTest.robustnessScore,
          perturbationScore: perturbationTest.robustnessScore,
          boundaryScore: boundaryTest.robustnessScore,
          files: [
            ...adversarialTest.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
            ...perturbationTest.artifacts.slice(0, 2).map(a => ({ path: a.path, format: a.format || 'json' }))
          ]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: FAIRNESS ANALYSIS (if attributes provided and comprehensive level)
  // ============================================================================

  let fairnessResults = null;
  if (fairnessAttributes.length > 0 && validationLevel === 'comprehensive') {
    ctx.log('info', 'Phase 6: Conducting fairness analysis');

    fairnessResults = await ctx.task(fairnessAnalysisTask, {
      modelPath: modelLoadResult.loadedModelPath,
      testDataPath,
      modelType,
      fairnessAttributes,
      outputDir
    });

    validationResults.fairness = fairnessResults;
    artifacts.push(...fairnessResults.artifacts);

    // Quality Gate: Check for fairness violations
    const fairnessViolations = fairnessResults.metrics.filter(m => m.violation);
    if (fairnessViolations.length > 0) {
      await ctx.breakpoint({
        question: `${fairnessViolations.length} fairness violations detected across protected attributes. Review and approve to proceed?`,
        title: 'Fairness Violations Detected',
        context: {
          runId: ctx.runId,
          violations: fairnessViolations,
          fairnessScore: fairnessResults.overallFairnessScore,
          recommendation: 'Consider retraining with fairness constraints or applying post-processing debiasing',
          files: fairnessResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 7: EXPLAINABILITY ANALYSIS (if required and comprehensive level)
  // ============================================================================

  let explainabilityResults = null;
  if (explainabilityRequired && validationLevel === 'comprehensive') {
    ctx.log('info', 'Phase 7: Generating model explainability analysis');

    const [
      featureImportance,
      shapAnalysis,
      localExplanations
    ] = await ctx.parallel.all([
      () => ctx.task(featureImportanceTask, {
        modelPath: modelLoadResult.loadedModelPath,
        testDataPath,
        modelType,
        outputDir
      }),
      () => ctx.task(shapAnalysisTask, {
        modelPath: modelLoadResult.loadedModelPath,
        testDataPath,
        modelType,
        outputDir
      }),
      () => ctx.task(localExplanationsTask, {
        modelPath: modelLoadResult.loadedModelPath,
        testDataPath,
        modelType,
        numSamples: 100,
        outputDir
      })
    ]);

    explainabilityResults = {
      featureImportance,
      shap: shapAnalysis,
      localExplanations,
      explainabilityScore: (featureImportance.score + shapAnalysis.score + localExplanations.score) / 3
    };

    validationResults.explainability = explainabilityResults;
    artifacts.push(
      ...featureImportance.artifacts,
      ...shapAnalysis.artifacts,
      ...localExplanations.artifacts
    );
  }

  // ============================================================================
  // PHASE 8: DATA DRIFT DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Checking for data drift and distribution shift');

  const driftAnalysis = await ctx.task(dataDriftDetectionTask, {
    modelPath: modelLoadResult.loadedModelPath,
    testDataPath,
    trainingDataStats: modelLoadResult.trainingDataStats,
    outputDir
  });

  validationResults.dataDrift = driftAnalysis;
  artifacts.push(...driftAnalysis.artifacts);

  // Quality Gate: Check for significant drift
  if (driftAnalysis.significantDriftDetected) {
    await ctx.breakpoint({
      question: `Significant data drift detected in ${driftAnalysis.driftedFeatures.length} features. Model may not generalize well to test data. Continue?`,
      title: 'Data Drift Warning',
      context: {
        runId: ctx.runId,
        driftScore: driftAnalysis.overallDriftScore,
        driftedFeatures: driftAnalysis.driftedFeatures,
        recommendation: 'Consider retraining model on more recent data or applying domain adaptation techniques',
        files: driftAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: PRODUCTION SIMULATION (if enabled)
  // ============================================================================

  let productionSimResult = null;
  if (productionSimulationEnabled && validationLevel === 'comprehensive') {
    ctx.log('info', 'Phase 9: Running production environment simulation');

    productionSimResult = await ctx.task(productionSimulationTask, {
      modelPath: modelLoadResult.loadedModelPath,
      testDataPath,
      modelType,
      outputDir
    });

    validationResults.productionSimulation = productionSimResult;
    artifacts.push(...productionSimResult.artifacts);

    // Quality Gate: Check production readiness metrics
    if (productionSimResult.latencyP99 > productionSimResult.latencyThreshold) {
      await ctx.breakpoint({
        question: `Model latency exceeds threshold. P99: ${productionSimResult.latencyP99}ms, Threshold: ${productionSimResult.latencyThreshold}ms. Approve for production?`,
        title: 'Performance Warning',
        context: {
          runId: ctx.runId,
          latencyMetrics: productionSimResult.latencyMetrics,
          throughput: productionSimResult.throughput,
          memoryUsage: productionSimResult.memoryUsage,
          files: productionSimResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 10: OVERALL QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 10: Computing overall validation score');

  const scoringResult = await ctx.task(overallScoringTask, {
    validationResults: {
      modelLoad: modelLoadResult,
      performance: performanceEval,
      predictionDistribution,
      errorAnalysis,
      confusionMatrix: confusionMatrixAnalysis,
      calibration: calibrationResult,
      robustness: robustnessResults,
      fairness: fairnessResults,
      explainability: explainabilityResults,
      dataDrift: driftAnalysis,
      productionSimulation: productionSimResult
    },
    validationLevel,
    targetMetrics,
    outputDir
  });

  overallScore = scoringResult.overallScore;
  productionReady = scoringResult.productionReady;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `Overall validation score: ${overallScore}/100`);
  ctx.log('info', `Production ready: ${productionReady}`);

  // ============================================================================
  // PHASE 11: MODEL CARD GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating model card documentation');

  const modelCard = await ctx.task(modelCardGenerationTask, {
    modelPath,
    modelType,
    validationResults,
    overallScore,
    productionReady,
    targetMetrics,
    validationLevel,
    outputDir
  });

  artifacts.push(...modelCard.artifacts);

  // ============================================================================
  // PHASE 12: VALIDATION REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive validation report');

  const validationReport = await ctx.task(validationReportTask, {
    modelPath,
    modelType,
    validationResults,
    scoringResult,
    modelCard,
    validationLevel,
    outputDir
  });

  artifacts.push(...validationReport.artifacts);

  // ============================================================================
  // PHASE 13: PRODUCTION READINESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 13: Assessing production readiness');

  const readinessAssessment = await ctx.task(productionReadinessTask, {
    validationResults,
    scoringResult,
    targetMetrics,
    modelType,
    outputDir
  });

  artifacts.push(...readinessAssessment.artifacts);

  // Final Breakpoint: Deployment approval
  await ctx.breakpoint({
    question: `Model evaluation complete. Overall score: ${overallScore}/100. Production ready: ${productionReady}. ${readinessAssessment.verdict}. Approve for deployment?`,
    title: 'Final Model Validation Review',
    context: {
      runId: ctx.runId,
      summary: {
        modelPath,
        modelType,
        overallScore,
        productionReady,
        validationLevel,
        performanceMetrics: performanceEval.metrics,
        robustnessScore: robustnessResults?.overallRobustnessScore,
        fairnessScore: fairnessResults?.overallFairnessScore,
        driftDetected: driftAnalysis.significantDriftDetected
      },
      verdict: readinessAssessment.verdict,
      recommendation: readinessAssessment.recommendation,
      blockingIssues: readinessAssessment.blockingIssues,
      files: [
        { path: modelCard.modelCardPath, format: 'markdown', label: 'Model Card' },
        { path: validationReport.reportPath, format: 'markdown', label: 'Validation Report' },
        { path: readinessAssessment.checklistPath, format: 'markdown', label: 'Production Checklist' },
        { path: `${outputDir}/validation-scorecard.json`, format: 'json', label: 'Scorecard' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    modelPath,
    modelType,
    validationLevel,
    overallScore,
    productionReady,
    validationResults: {
      modelLoad: {
        success: modelLoadResult.success,
        modelValid: modelLoadResult.modelValid,
        structureIssues: modelLoadResult.structureIssues.length
      },
      performance: {
        metrics: performanceEval.metrics,
        targetsMet: performanceEval.allTargetsMet
      },
      errorAnalysis: {
        totalErrors: errorAnalysis.totalErrors,
        errorPatterns: errorAnalysis.patterns.length
      },
      calibration: calibrationResult ? {
        score: calibrationResult.calibrationScore,
        wellCalibrated: calibrationResult.wellCalibrated
      } : null,
      robustness: robustnessResults ? {
        overallScore: robustnessResults.overallRobustnessScore,
        adversarialRobust: robustnessResults.adversarial.robust,
        perturbationRobust: robustnessResults.perturbation.robust
      } : null,
      fairness: fairnessResults ? {
        overallScore: fairnessResults.overallFairnessScore,
        violations: fairnessResults.metrics.filter(m => m.violation).length
      } : null,
      explainability: explainabilityResults ? {
        score: explainabilityResults.explainabilityScore,
        topFeatures: explainabilityResults.featureImportance.topFeatures.slice(0, 5)
      } : null,
      dataDrift: {
        overallScore: driftAnalysis.overallDriftScore,
        significantDrift: driftAnalysis.significantDriftDetected,
        driftedFeatures: driftAnalysis.driftedFeatures.length
      },
      productionSimulation: productionSimResult ? {
        latencyP99: productionSimResult.latencyP99,
        throughput: productionSimResult.throughput,
        passed: productionSimResult.passed
      } : null
    },
    artifacts,
    modelCard: {
      path: modelCard.modelCardPath,
      summary: modelCard.summary
    },
    validationReport: {
      path: validationReport.reportPath
    },
    readinessAssessment: {
      verdict: readinessAssessment.verdict,
      approved: readinessAssessment.approved,
      blockingIssues: readinessAssessment.blockingIssues,
      recommendation: readinessAssessment.recommendation
    },
    duration,
    metadata: {
      processId: 'specializations/data-science-ml/model-evaluation',
      timestamp: startTime,
      validationLevel,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Model Loading and Basic Verification
export const modelLoadingTask = defineTask('model-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Load and Verify Model - ${args.modelPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer specializing in model deployment and validation',
      task: 'Load the trained model and perform basic structural verification',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load the model from the specified path',
        '2. Verify model file integrity and format',
        '3. Check model structure and architecture',
        '4. Verify model has required methods (predict, predict_proba, etc.)',
        '5. Load test data and verify compatibility with model input',
        '6. Check model metadata (version, training date, hyperparameters)',
        '7. Extract training data statistics if available',
        '8. Perform basic sanity checks (model can make predictions)',
        '9. Identify any structural issues or warnings',
        '10. Save loaded model path and metadata'
      ],
      outputFormat: 'JSON object with loading status and verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'modelValid', 'loadedModelPath', 'structureIssues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        modelValid: { type: 'boolean' },
        loadedModelPath: { type: 'string', description: 'Path to loaded model' },
        modelMetadata: {
          type: 'object',
          properties: {
            modelType: { type: 'string' },
            version: { type: 'string' },
            framework: { type: 'string' },
            inputShape: { type: 'array' },
            outputShape: { type: 'array' }
          }
        },
        structureIssues: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of structural issues found'
        },
        trainingDataStats: {
          type: 'object',
          description: 'Training data statistics if available'
        },
        testDataCompatible: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'loading', 'verification']
}));

// Phase 2: Performance Metrics Evaluation
export const performanceEvaluationTask = defineTask('performance-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Performance Evaluation - ${args.modelType}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Scientist specializing in model evaluation',
      task: 'Evaluate model performance on test set and compute comprehensive metrics',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        targetMetrics: args.targetMetrics,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate predictions on test dataset',
        '2. For classification: compute accuracy, precision, recall, F1, AUC-ROC, AUC-PR',
        '3. For regression: compute MAE, MSE, RMSE, R², MAPE',
        '4. Compute per-class metrics for multi-class classification',
        '5. Generate confidence intervals for metrics',
        '6. Compare metrics against targets',
        '7. Identify metric deficiencies',
        '8. Compute micro and macro averages where applicable',
        '9. Generate performance visualization (ROC curves, PR curves, etc.)',
        '10. Save detailed metrics report'
      ],
      outputFormat: 'JSON object with comprehensive performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'metricsComparison', 'allTargetsMet', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          description: 'Computed performance metrics'
        },
        metricsComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              actualValue: { type: 'number' },
              targetValue: { type: 'number' },
              targetMet: { type: 'boolean' },
              confidenceInterval: { type: 'array' }
            }
          }
        },
        allTargetsMet: { type: 'boolean' },
        perClassMetrics: { type: 'object', description: 'Per-class metrics for classification' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'performance', 'metrics']
}));

// Phase 3.1: Prediction Distribution Analysis
export const predictionDistributionTask = defineTask('prediction-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Analyze Prediction Distribution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistical Analyst',
      task: 'Analyze the distribution of model predictions',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate predictions on test set',
        '2. Analyze prediction distribution (histogram, quantiles)',
        '3. Check for prediction bias (skewed distributions)',
        '4. For classification: analyze predicted probabilities distribution',
        '5. Identify concentration of predictions',
        '6. Check for boundary effects',
        '7. Compare with ground truth distribution',
        '8. Generate distribution visualizations',
        '9. Compute distribution statistics (mean, median, std, skewness, kurtosis)',
        '10. Flag distribution anomalies'
      ],
      outputFormat: 'JSON object with distribution analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionStats', 'anomaliesDetected', 'artifacts'],
      properties: {
        distributionStats: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            median: { type: 'number' },
            std: { type: 'number' },
            skewness: { type: 'number' },
            kurtosis: { type: 'number' }
          }
        },
        anomaliesDetected: { type: 'boolean' },
        anomalies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'distribution']
}));

// Phase 3.2: Error Analysis
export const errorAnalysisTask = defineTask('error-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Error Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Diagnostics Expert',
      task: 'Analyze model errors and identify patterns',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        performanceMetrics: args.performanceMetrics,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all prediction errors',
        '2. Categorize errors by type (false positives, false negatives, etc.)',
        '3. Analyze error magnitude distribution',
        '4. Find systematic error patterns',
        '5. Identify features associated with high error',
        '6. Find data slices with high error rates',
        '7. Analyze error correlation with input features',
        '8. Generate error examples (worst predictions)',
        '9. Create error analysis visualizations',
        '10. Provide actionable error reduction recommendations'
      ],
      outputFormat: 'JSON object with error analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalErrors', 'patterns', 'recommendations', 'artifacts'],
      properties: {
        totalErrors: { type: 'number' },
        errorRate: { type: 'number' },
        errorCategories: {
          type: 'object',
          description: 'Breakdown of errors by category'
        },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        highErrorSlices: {
          type: 'array',
          items: { type: 'string' },
          description: 'Data slices with high error rates'
        },
        worstPredictions: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'error-analysis']
}));

// Phase 3.3: Confusion Matrix Analysis
export const confusionMatrixTask = defineTask('confusion-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Confusion Matrix Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Classification Analysis Expert',
      task: 'Generate and analyze confusion matrix',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate confusion matrix',
        '2. Compute normalized confusion matrix',
        '3. Identify most confused class pairs',
        '4. Calculate per-class precision, recall, F1',
        '5. Analyze classification patterns',
        '6. Identify systematic misclassifications',
        '7. Compute class balance impact',
        '8. Generate confusion matrix visualization',
        '9. Provide class-specific insights',
        '10. Recommend class-specific improvements'
      ],
      outputFormat: 'JSON object with confusion matrix analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['confusionMatrix', 'mostConfusedPairs', 'artifacts'],
      properties: {
        confusionMatrix: { type: 'array' },
        normalizedConfusionMatrix: { type: 'array' },
        mostConfusedPairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trueClass: { type: 'string' },
              predictedClass: { type: 'string' },
              confusionRate: { type: 'number' }
            }
          }
        },
        perClassMetrics: { type: 'object' },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'confusion-matrix']
}));

// Phase 4: Calibration Analysis
export const calibrationAnalysisTask = defineTask('calibration-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Model Calibration Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Probabilistic Model Expert',
      task: 'Analyze model calibration and probability estimates',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate predicted probabilities',
        '2. Compute calibration curve (reliability diagram)',
        '3. Calculate Expected Calibration Error (ECE)',
        '4. Calculate Maximum Calibration Error (MCE)',
        '5. Compute Brier score',
        '6. Analyze probability distribution by confidence bins',
        '7. Check for over/under-confidence patterns',
        '8. Generate calibration visualizations',
        '9. Assess if recalibration is needed',
        '10. Recommend calibration methods if needed'
      ],
      outputFormat: 'JSON object with calibration analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['calibrationScore', 'wellCalibrated', 'artifacts'],
      properties: {
        calibrationScore: { type: 'number', minimum: 0, maximum: 100 },
        wellCalibrated: { type: 'boolean' },
        expectedCalibrationError: { type: 'number' },
        maxCalibrationError: { type: 'number' },
        brierScore: { type: 'number' },
        confidenceBins: { type: 'array' },
        overconfident: { type: 'boolean' },
        underconfident: { type: 'boolean' },
        recalibrationNeeded: { type: 'boolean' },
        recommendedMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'calibration']
}));

// Phase 5.1: Adversarial Testing
export const adversarialTestingTask = defineTask('adversarial-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Adversarial Robustness Testing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Security Expert',
      task: 'Test model robustness against adversarial examples',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate adversarial examples using FGSM, PGD methods',
        '2. Test model on adversarial examples',
        '3. Measure prediction change rate',
        '4. Calculate adversarial accuracy',
        '5. Analyze vulnerability patterns',
        '6. Identify most vulnerable inputs',
        '7. Test different perturbation magnitudes',
        '8. Generate adversarial examples visualizations',
        '9. Compute robustness score (0-100)',
        '10. Recommend defensive strategies'
      ],
      outputFormat: 'JSON object with adversarial testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessScore', 'robust', 'artifacts'],
      properties: {
        robustnessScore: { type: 'number', minimum: 0, maximum: 100 },
        robust: { type: 'boolean' },
        adversarialAccuracy: { type: 'number' },
        vulnerabilityRate: { type: 'number' },
        vulnerablePatterns: { type: 'array', items: { type: 'string' } },
        defensiveRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'robustness', 'adversarial']
}));

// Phase 5.2: Perturbation Testing
export const perturbationTestingTask = defineTask('perturbation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Input Perturbation Testing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Robustness Engineer',
      task: 'Test model stability under input perturbations',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply random noise perturbations to inputs',
        '2. Test with missing values and imputation',
        '3. Apply feature scaling variations',
        '4. Test with outlier injections',
        '5. Measure prediction stability',
        '6. Calculate perturbation robustness score',
        '7. Identify sensitive features',
        '8. Analyze prediction variance',
        '9. Generate perturbation visualizations',
        '10. Recommend robustness improvements'
      ],
      outputFormat: 'JSON object with perturbation testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessScore', 'robust', 'artifacts'],
      properties: {
        robustnessScore: { type: 'number', minimum: 0, maximum: 100 },
        robust: { type: 'boolean' },
        predictionStability: { type: 'number' },
        sensitiveFeatures: { type: 'array', items: { type: 'string' } },
        predictionVariance: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'robustness', 'perturbation']
}));

// Phase 5.3: Boundary Testing
export const boundaryTestingTask = defineTask('boundary-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Decision Boundary Testing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Testing Specialist',
      task: 'Test model behavior at decision boundaries',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify decision boundaries',
        '2. Test predictions near boundaries',
        '3. Analyze boundary stability',
        '4. Test with extreme values',
        '5. Test with out-of-distribution inputs',
        '6. Measure boundary confidence',
        '7. Identify brittle boundaries',
        '8. Generate boundary visualizations',
        '9. Compute boundary robustness score',
        '10. Recommend boundary improvements'
      ],
      outputFormat: 'JSON object with boundary testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessScore', 'boundariesStable', 'artifacts'],
      properties: {
        robustnessScore: { type: 'number', minimum: 0, maximum: 100 },
        boundariesStable: { type: 'boolean' },
        boundaryConfidence: { type: 'number' },
        brittleBoundaries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'robustness', 'boundary']
}));

// Phase 6: Fairness Analysis
export const fairnessAnalysisTask = defineTask('fairness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Fairness and Bias Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI Ethics and Fairness Specialist',
      task: 'Analyze model fairness across protected attributes',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        fairnessAttributes: args.fairnessAttributes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Segment data by protected attributes',
        '2. Compute per-group performance metrics',
        '3. Calculate demographic parity difference',
        '4. Calculate equal opportunity difference',
        '5. Calculate equalized odds difference',
        '6. Compute disparate impact ratio',
        '7. Identify fairness violations',
        '8. Analyze prediction distribution per group',
        '9. Generate fairness visualizations',
        '10. Recommend mitigation strategies'
      ],
      outputFormat: 'JSON object with fairness analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallFairnessScore', 'metrics', 'artifacts'],
      properties: {
        overallFairnessScore: { type: 'number', minimum: 0, maximum: 100 },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              demographicParity: { type: 'number' },
              equalOpportunity: { type: 'number' },
              equalizedOdds: { type: 'number' },
              disparateImpact: { type: 'number' },
              violation: { type: 'boolean' }
            }
          }
        },
        groupPerformance: { type: 'object' },
        mitigationStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'fairness', 'ethics']
}));

// Phase 7.1: Feature Importance
export const featureImportanceTask = defineTask('feature-importance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Feature Importance Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Interpretability Expert',
      task: 'Analyze feature importance for model predictions',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compute feature importance scores',
        '2. Use permutation importance',
        '3. Calculate partial dependence plots',
        '4. Rank features by importance',
        '5. Identify top contributing features',
        '6. Detect redundant or low-importance features',
        '7. Analyze feature interactions',
        '8. Generate feature importance visualizations',
        '9. Compute explainability score',
        '10. Provide interpretability insights'
      ],
      outputFormat: 'JSON object with feature importance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'topFeatures', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
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
        redundantFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'explainability', 'feature-importance']
}));

// Phase 7.2: SHAP Analysis
export const shapAnalysisTask = defineTask('shap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: SHAP Value Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Explainable AI Specialist',
      task: 'Generate SHAP values for model interpretability',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compute SHAP values for predictions',
        '2. Generate SHAP summary plot',
        '3. Create SHAP dependence plots',
        '4. Analyze global feature contributions',
        '5. Identify interaction effects',
        '6. Generate SHAP force plots for key predictions',
        '7. Compute SHAP-based feature importance',
        '8. Analyze prediction drivers',
        '9. Create SHAP visualizations',
        '10. Provide explainability insights'
      ],
      outputFormat: 'JSON object with SHAP analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        globalImportance: { type: 'array' },
        interactions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'explainability', 'shap']
}));

// Phase 7.3: Local Explanations
export const localExplanationsTask = defineTask('local-explanations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Local Prediction Explanations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Model Interpretability Engineer',
      task: 'Generate local explanations for individual predictions',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        numSamples: args.numSamples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Sample predictions for explanation',
        '2. Generate LIME explanations',
        '3. Identify key features per prediction',
        '4. Analyze explanation consistency',
        '5. Check explanation stability',
        '6. Generate counterfactual examples',
        '7. Create local explanation visualizations',
        '8. Assess explanation quality',
        '9. Compute local explainability score',
        '10. Provide prediction-level insights'
      ],
      outputFormat: 'JSON object with local explanations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        explanations: { type: 'array' },
        consistencyScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'explainability', 'local']
}));

// Phase 8: Data Drift Detection
export const dataDriftDetectionTask = defineTask('data-drift-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Data Drift Detection',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Monitoring Specialist',
      task: 'Detect data drift between training and test data',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        trainingDataStats: args.trainingDataStats,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare training vs test data distributions',
        '2. Compute KS test for numerical features',
        '3. Compute Chi-square test for categorical features',
        '4. Calculate PSI (Population Stability Index)',
        '5. Detect covariate shift',
        '6. Identify drifted features',
        '7. Assess drift severity',
        '8. Generate drift visualizations',
        '9. Compute overall drift score',
        '10. Recommend retraining if needed'
      ],
      outputFormat: 'JSON object with drift analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallDriftScore', 'significantDriftDetected', 'driftedFeatures', 'artifacts'],
      properties: {
        overallDriftScore: { type: 'number', minimum: 0, maximum: 100 },
        significantDriftDetected: { type: 'boolean' },
        driftedFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              driftScore: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        retrainingRecommended: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'drift', 'monitoring']
}));

// Phase 9: Production Simulation
export const productionSimulationTask = defineTask('production-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Production Environment Simulation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Engineer',
      task: 'Simulate production workload and measure performance',
      context: {
        modelPath: args.modelPath,
        testDataPath: args.testDataPath,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model in production-like environment',
        '2. Run batch predictions under load',
        '3. Measure inference latency (P50, P95, P99)',
        '4. Measure throughput (requests/second)',
        '5. Monitor memory usage',
        '6. Monitor CPU/GPU utilization',
        '7. Test concurrent request handling',
        '8. Simulate production traffic patterns',
        '9. Generate performance benchmarks',
        '10. Assess production readiness'
      ],
      outputFormat: 'JSON object with production simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'latencyP99', 'throughput', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        latencyMetrics: {
          type: 'object',
          properties: {
            p50: { type: 'number' },
            p95: { type: 'number' },
            p99: { type: 'number' }
          }
        },
        latencyP99: { type: 'number' },
        latencyThreshold: { type: 'number' },
        throughput: { type: 'number', description: 'Requests per second' },
        memoryUsage: { type: 'string' },
        cpuUtilization: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'production', 'performance']
}));

// Phase 10: Overall Scoring
export const overallScoringTask = defineTask('overall-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Overall Validation Scoring',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior ML Validation Engineer',
      task: 'Compute overall validation score and production readiness assessment',
      context: {
        validationResults: args.validationResults,
        validationLevel: args.validationLevel,
        targetMetrics: args.targetMetrics,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Aggregate scores across all validation dimensions',
        '2. Apply weighted scoring based on validation level',
        '3. For basic: performance (60%), error analysis (20%), distribution (20%)',
        '4. For standard: add robustness (15%), calibration (10%), adjust weights',
        '5. For comprehensive: include fairness (10%), explainability (10%), drift (5%)',
        '6. Calculate overall validation score (0-100)',
        '7. Assess production readiness criteria',
        '8. Identify blocking issues',
        '9. Generate scorecard',
        '10. Provide go/no-go recommendation'
      ],
      outputFormat: 'JSON object with overall scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'productionReady', 'dimensionScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        productionReady: { type: 'boolean' },
        dimensionScores: {
          type: 'object',
          properties: {
            performance: { type: 'number' },
            errorAnalysis: { type: 'number' },
            distribution: { type: 'number' },
            calibration: { type: 'number' },
            robustness: { type: 'number' },
            fairness: { type: 'number' },
            explainability: { type: 'number' },
            drift: { type: 'number' },
            production: { type: 'number' }
          }
        },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'scoring']
}));

// Phase 11: Model Card Generation
export const modelCardGenerationTask = defineTask('model-card-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Generate Model Card',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Documentation Specialist',
      task: 'Generate comprehensive model card following Model Cards standard',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        validationResults: args.validationResults,
        overallScore: args.overallScore,
        productionReady: args.productionReady,
        targetMetrics: args.targetMetrics,
        validationLevel: args.validationLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document model details (architecture, version, purpose)',
        '2. Document intended use and limitations',
        '3. Document training data and preprocessing',
        '4. Document evaluation data and metrics',
        '5. Document performance across metrics',
        '6. Document fairness analysis if available',
        '7. Document ethical considerations',
        '8. Document caveats and recommendations',
        '9. Include validation results summary',
        '10. Generate model card in Markdown format'
      ],
      outputFormat: 'JSON object with model card'
    },
    outputSchema: {
      type: 'object',
      required: ['modelCardPath', 'summary', 'artifacts'],
      properties: {
        modelCardPath: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            modelName: { type: 'string' },
            version: { type: 'string' },
            purpose: { type: 'string' },
            intendedUse: { type: 'string' },
            limitations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'model-evaluation', 'documentation', 'model-card']
}));

// Phase 12: Validation Report
export const validationReportTask = defineTask('validation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 12: Generate Validation Report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Reporting Specialist',
      task: 'Generate comprehensive validation report',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        validationResults: args.validationResults,
        scoringResult: args.scoringResult,
        modelCard: args.modelCard,
        validationLevel: args.validationLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document validation methodology',
        '3. Present performance metrics with visualizations',
        '4. Include error analysis findings',
        '5. Present robustness testing results',
        '6. Include fairness analysis if conducted',
        '7. Present drift detection results',
        '8. Include production simulation results',
        '9. Present overall scoring and recommendation',
        '10. Generate report in Markdown format'
      ],
      outputFormat: 'JSON object with validation report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'documentation', 'report']
}));

// Phase 13: Production Readiness Assessment
export const productionReadinessTask = defineTask('production-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 13: Production Readiness Assessment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal ML Engineer and Production Reviewer',
      task: 'Conduct final production readiness assessment',
      context: {
        validationResults: args.validationResults,
        scoringResult: args.scoringResult,
        targetMetrics: args.targetMetrics,
        modelType: args.modelType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all validation results',
        '2. Check if target metrics are met',
        '3. Verify no critical issues exist',
        '4. Assess production performance requirements',
        '5. Check model robustness and stability',
        '6. Verify fairness if applicable',
        '7. Assess monitoring readiness',
        '8. Identify blocking issues for production',
        '9. Provide clear verdict (approve/reject/conditional)',
        '10. Generate production checklist'
      ],
      outputFormat: 'JSON object with production readiness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'blockingIssues', 'recommendation', 'checklistPath', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        approved: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        checklistPath: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-evaluation', 'production-readiness', 'final-review']
}));

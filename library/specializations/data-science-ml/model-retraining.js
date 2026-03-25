/**
 * @process data-science-ml/model-retraining
 * @description ML Model Retraining Pipeline - Detect model staleness, automatically retrain on updated data,
 * validate performance improvements, deploy updated models, and maintain version lineage with quality gates
 * @inputs { modelId: string, retrainingTrigger: string, dataSource: string, performanceThreshold: number, autoDeployEnabled: boolean }
 * @outputs { success: boolean, modelVersion: string, performanceImprovement: number, deployed: boolean, artifacts: array }
 *
 * @example
 * const result = await orchestrate('data-science-ml/model-retraining', {
 *   modelId: 'recommendation-model-v2',
 *   retrainingTrigger: 'scheduled', // or 'drift-detected', 'performance-degradation'
 *   dataSource: 's3://ml-data/training-data/2024-01-latest/',
 *   performanceThreshold: 0.85,
 *   autoDeployEnabled: false
 * });
 *
 * @references
 * - MLOps Continuous Training: https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning
 * - Apache Airflow: https://airflow.apache.org/
 * - Prefect Modern Workflow: https://www.prefect.io/
 * - ML Test Score: https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/aad9f93b86b7addfea4c419b9100c6cdd26cacea.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelId,
    retrainingTrigger = 'scheduled',
    dataSource,
    performanceThreshold = 0.85,
    autoDeployEnabled = false,
    validationDataSource = null,
    hyperparameters = {},
    rollbackOnFailure = true,
    notificationChannels = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let deploymentSuccessful = false;

  ctx.log('info', `Starting model retraining pipeline for model: ${modelId}`);
  ctx.log('info', `Retraining trigger: ${retrainingTrigger}`);

  // ============================================================================
  // PHASE 1: PRE-RETRAINING VALIDATION
  // ============================================================================

  // Task 1: Validate Current Model State
  ctx.log('info', 'Phase 1: Validating current model state');
  const modelStateValidation = await ctx.task(validateCurrentModelStateTask, {
    modelId,
    retrainingTrigger
  });

  if (!modelStateValidation.isValid) {
    return {
      success: false,
      error: 'Current model state validation failed',
      details: modelStateValidation,
      metadata: { processId: 'data-science-ml/model-retraining', timestamp: startTime }
    };
  }

  artifacts.push(...modelStateValidation.artifacts);
  const currentModelMetrics = modelStateValidation.currentMetrics;

  // Task 2: Validate Retraining Data
  ctx.log('info', 'Validating retraining data quality and availability');
  const dataValidation = await ctx.task(validateRetrainingDataTask, {
    dataSource,
    validationDataSource,
    modelId,
    currentModelSchema: modelStateValidation.modelSchema
  });

  if (!dataValidation.dataQualityPassed) {
    return {
      success: false,
      error: 'Retraining data validation failed',
      details: dataValidation,
      metadata: { processId: 'data-science-ml/model-retraining', timestamp: startTime }
    };
  }

  artifacts.push(...dataValidation.artifacts);

  // Breakpoint: Review data validation and approve retraining
  await ctx.breakpoint({
    question: `Data validation complete for model ${modelId}. Data quality score: ${dataValidation.dataQualityScore}/100. Dataset size: ${dataValidation.datasetSize} samples. Proceed with retraining?`,
    title: 'Retraining Data Validation Review',
    context: {
      runId: ctx.runId,
      modelId,
      trigger: retrainingTrigger,
      dataQualityScore: dataValidation.dataQualityScore,
      datasetSize: dataValidation.datasetSize,
      schemaMismatch: dataValidation.schemaMismatch,
      files: dataValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: MODEL RETRAINING
  // ============================================================================

  ctx.log('info', 'Phase 2: Starting model retraining');

  // Task 3: Prepare Training Environment
  const trainingEnvPrep = await ctx.task(prepareTrainingEnvironmentTask, {
    modelId,
    dataSource,
    hyperparameters,
    currentModelConfig: modelStateValidation.modelConfig
  });

  artifacts.push(...trainingEnvPrep.artifacts);

  // Task 4: Execute Model Retraining
  ctx.log('info', 'Executing model retraining with updated data');
  const retrainingResult = await ctx.task(executeModelRetrainingTask, {
    modelId,
    dataSource,
    validationDataSource,
    trainingConfig: trainingEnvPrep.trainingConfig,
    hyperparameters,
    currentModelVersion: modelStateValidation.currentVersion
  });

  if (!retrainingResult.success) {
    return {
      success: false,
      error: 'Model retraining execution failed',
      details: retrainingResult,
      metadata: { processId: 'data-science-ml/model-retraining', timestamp: startTime }
    };
  }

  artifacts.push(...retrainingResult.artifacts);
  const newModelVersion = retrainingResult.modelVersion;

  // Task 5: Monitor Training Progress and Convergence
  ctx.log('info', 'Monitoring training metrics and convergence');
  const trainingMonitoring = await ctx.task(monitorTrainingProgressTask, {
    modelId,
    trainingJobId: retrainingResult.trainingJobId,
    expectedDuration: retrainingResult.estimatedDuration
  });

  artifacts.push(...trainingMonitoring.artifacts);

  // Quality Gate: Training must converge successfully
  if (!trainingMonitoring.converged) {
    ctx.log('error', 'Model training did not converge');
    return {
      success: false,
      error: 'Training failed to converge',
      details: trainingMonitoring,
      metadata: { processId: 'data-science-ml/model-retraining', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 3: MODEL VALIDATION AND COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 3: Validating retrained model performance');

  // Task 6: Comprehensive Model Evaluation
  const modelEvaluation = await ctx.task(evaluateRetrainedModelTask, {
    modelId,
    newModelVersion,
    currentModelVersion: modelStateValidation.currentVersion,
    validationDataSource: validationDataSource || dataSource,
    performanceThreshold
  });

  artifacts.push(...modelEvaluation.artifacts);

  // Task 7: Compare with Current Production Model
  ctx.log('info', 'Comparing retrained model with current production model');
  const modelComparison = await ctx.task(compareModelsTask, {
    modelId,
    newModelVersion,
    newModelMetrics: modelEvaluation.metrics,
    currentModelVersion: modelStateValidation.currentVersion,
    currentModelMetrics,
    performanceThreshold
  });

  artifacts.push(...modelComparison.artifacts);

  const performanceImprovement = modelComparison.relativeImprovement;
  const isImprovement = modelComparison.isImprovement;

  // Quality Gate: New model must meet performance threshold
  if (!modelEvaluation.meetsThreshold) {
    ctx.log('warn', `Retrained model does not meet performance threshold: ${modelEvaluation.primaryMetricScore} < ${performanceThreshold}`);

    await ctx.breakpoint({
      question: `Retrained model performance (${modelEvaluation.primaryMetricScore}) does not meet threshold (${performanceThreshold}). Review results and decide: proceed with deployment anyway, or abort?`,
      title: 'Model Performance Below Threshold',
      context: {
        runId: ctx.runId,
        modelId,
        newModelVersion,
        performanceScore: modelEvaluation.primaryMetricScore,
        threshold: performanceThreshold,
        comparison: modelComparison,
        files: modelEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // Quality Gate: New model should outperform current model
  if (!isImprovement) {
    ctx.log('warn', `Retrained model does not outperform current model. Improvement: ${performanceImprovement}%`);

    await ctx.breakpoint({
      question: `Retrained model shows ${performanceImprovement > 0 ? 'minimal' : 'negative'} improvement (${performanceImprovement}%). Deploy anyway, or abort?`,
      title: 'Model Performance Comparison Warning',
      context: {
        runId: ctx.runId,
        modelId,
        newModelVersion,
        currentModelVersion: modelStateValidation.currentVersion,
        improvement: performanceImprovement,
        comparison: modelComparison,
        files: modelComparison.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // Task 8: Model Fairness and Bias Analysis
  ctx.log('info', 'Analyzing model fairness and bias');
  const fairnessAnalysis = await ctx.task(analyzeFairnessTask, {
    modelId,
    newModelVersion,
    validationDataSource: validationDataSource || dataSource,
    demographics: modelStateValidation.monitoredDemographics || []
  });

  artifacts.push(...fairnessAnalysis.artifacts);

  // Quality Gate: Fairness checks must pass
  if (fairnessAnalysis.hasCriticalBias) {
    ctx.log('error', 'Critical bias detected in retrained model');

    await ctx.breakpoint({
      question: `Critical fairness issues detected in retrained model. ${fairnessAnalysis.criticalBiasCount} critical bias(es) found. Review and decide: abort deployment or accept risks?`,
      title: 'Model Fairness Critical Issues',
      context: {
        runId: ctx.runId,
        modelId,
        newModelVersion,
        criticalBiases: fairnessAnalysis.criticalBiases,
        fairnessMetrics: fairnessAnalysis.fairnessMetrics,
        files: fairnessAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: MODEL REGISTRATION AND VERSIONING
  // ============================================================================

  ctx.log('info', 'Phase 4: Registering new model version');

  // Task 9: Register Model in Model Registry
  const modelRegistration = await ctx.task(registerModelTask, {
    modelId,
    newModelVersion,
    trainingMetadata: {
      dataSource,
      trainingJobId: retrainingResult.trainingJobId,
      hyperparameters,
      trainingDuration: trainingMonitoring.actualDuration,
      converged: trainingMonitoring.converged
    },
    performanceMetrics: modelEvaluation.metrics,
    fairnessMetrics: fairnessAnalysis.fairnessMetrics,
    comparisonResults: modelComparison,
    lineage: {
      parentVersion: modelStateValidation.currentVersion,
      retrainingTrigger,
      timestamp: startTime
    }
  });

  artifacts.push(...modelRegistration.artifacts);

  // Task 10: Generate Model Card
  ctx.log('info', 'Generating comprehensive model card');
  const modelCard = await ctx.task(generateModelCardTask, {
    modelId,
    newModelVersion,
    modelRegistration,
    trainingMetadata: retrainingResult,
    performanceMetrics: modelEvaluation.metrics,
    fairnessAnalysis,
    modelComparison,
    intendedUse: modelStateValidation.intendedUse,
    limitations: modelStateValidation.knownLimitations
  });

  artifacts.push(...modelCard.artifacts);

  // ============================================================================
  // PHASE 5: DEPLOYMENT (CONDITIONAL)
  // ============================================================================

  ctx.log('info', 'Phase 5: Model deployment');

  let deploymentDecision = autoDeployEnabled && isImprovement && !fairnessAnalysis.hasCriticalBias;

  if (!autoDeployEnabled || !isImprovement || fairnessAnalysis.hasCriticalBias) {
    // Manual approval required
    await ctx.breakpoint({
      question: `Model ${newModelVersion} ready for deployment. Performance: ${modelEvaluation.primaryMetricScore}. Improvement: ${performanceImprovement}%. Deploy to production?`,
      title: 'Model Deployment Approval',
      context: {
        runId: ctx.runId,
        modelId,
        newModelVersion,
        currentModelVersion: modelStateValidation.currentVersion,
        performanceScore: modelEvaluation.primaryMetricScore,
        improvement: performanceImprovement,
        autoDeployEnabled,
        isImprovement,
        hasCriticalBias: fairnessAnalysis.hasCriticalBias,
        files: [
          ...modelCard.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
          { path: modelRegistration.registryUrl, format: 'link', label: 'Model Registry' }
        ]
      }
    });

    // Assume approval was given if we continue past breakpoint
    deploymentDecision = true;
  }

  if (deploymentDecision) {
    ctx.log('info', 'Deploying retrained model to production');

    // Task 11: Canary Deployment (Gradual Rollout)
    const canaryDeployment = await ctx.task(canaryDeployModelTask, {
      modelId,
      newModelVersion,
      currentModelVersion: modelStateValidation.currentVersion,
      deploymentStrategy: 'gradual-rollout',
      canaryPercentage: 10,
      rollbackOnFailure
    });

    artifacts.push(...canaryDeployment.artifacts);

    if (!canaryDeployment.success) {
      ctx.log('error', 'Canary deployment failed');
      return {
        success: false,
        error: 'Model deployment failed during canary stage',
        details: canaryDeployment,
        modelVersion: newModelVersion,
        registered: true,
        deployed: false,
        artifacts,
        metadata: { processId: 'data-science-ml/model-retraining', timestamp: startTime }
      };
    }

    // Task 12: Monitor Canary Deployment
    ctx.log('info', 'Monitoring canary deployment metrics');
    const canaryMonitoring = await ctx.task(monitorCanaryDeploymentTask, {
      modelId,
      newModelVersion,
      deploymentId: canaryDeployment.deploymentId,
      monitoringDuration: canaryDeployment.monitoringDuration,
      performanceThreshold
    });

    artifacts.push(...canaryMonitoring.artifacts);

    // Quality Gate: Canary must perform well
    if (!canaryMonitoring.meetsExpectations) {
      ctx.log('error', 'Canary deployment performance degradation detected');

      if (rollbackOnFailure) {
        ctx.log('warn', 'Initiating automatic rollback');
        const rollback = await ctx.task(rollbackDeploymentTask, {
          modelId,
          newModelVersion,
          currentModelVersion: modelStateValidation.currentVersion,
          deploymentId: canaryDeployment.deploymentId,
          reason: 'Canary performance degradation'
        });

        artifacts.push(...rollback.artifacts);

        return {
          success: false,
          error: 'Canary deployment failed - automatic rollback executed',
          details: canaryMonitoring,
          rollback,
          modelVersion: newModelVersion,
          registered: true,
          deployed: false,
          artifacts,
          metadata: { processId: 'data-science-ml/model-retraining', timestamp: startTime }
        };
      } else {
        await ctx.breakpoint({
          question: `Canary deployment showing performance issues. ${canaryMonitoring.issues.length} issue(s) detected. Rollback or continue full deployment?`,
          title: 'Canary Deployment Issues',
          context: {
            runId: ctx.runId,
            modelId,
            newModelVersion,
            issues: canaryMonitoring.issues,
            canaryMetrics: canaryMonitoring.metrics,
            files: canaryMonitoring.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
          }
        });
      }
    }

    // Task 13: Full Production Deployment
    ctx.log('info', 'Proceeding with full production deployment');
    const fullDeployment = await ctx.task(fullDeployModelTask, {
      modelId,
      newModelVersion,
      currentModelVersion: modelStateValidation.currentVersion,
      deploymentId: canaryDeployment.deploymentId,
      canaryResults: canaryMonitoring
    });

    artifacts.push(...fullDeployment.artifacts);

    if (fullDeployment.success) {
      deploymentSuccessful = true;
      ctx.log('info', `Model ${newModelVersion} successfully deployed to production`);
    } else {
      ctx.log('error', 'Full production deployment failed');
      return {
        success: false,
        error: 'Full production deployment failed',
        details: fullDeployment,
        modelVersion: newModelVersion,
        registered: true,
        deployed: false,
        artifacts,
        metadata: { processId: 'data-science-ml/model-retraining', timestamp: startTime }
      };
    }

    // Task 14: Update Model Serving Configuration
    const servingConfigUpdate = await ctx.task(updateServingConfigTask, {
      modelId,
      newModelVersion,
      previousModelVersion: modelStateValidation.currentVersion,
      deploymentMetadata: fullDeployment
    });

    artifacts.push(...servingConfigUpdate.artifacts);

  } else {
    ctx.log('info', 'Model deployment skipped - registered but not deployed');
  }

  // ============================================================================
  // PHASE 6: POST-DEPLOYMENT MONITORING
  // ============================================================================

  if (deploymentSuccessful) {
    ctx.log('info', 'Phase 6: Setting up post-deployment monitoring');

    // Task 15: Configure Monitoring and Alerting
    const monitoringSetup = await ctx.task(setupPostDeploymentMonitoringTask, {
      modelId,
      newModelVersion,
      performanceThreshold,
      alertingThresholds: {
        performanceDegradation: performanceThreshold * 0.95,
        predictionLatencyMs: 200,
        errorRatePercent: 1.0,
        dataDriftScore: 0.1
      },
      notificationChannels
    });

    artifacts.push(...monitoringSetup.artifacts);
  }

  // ============================================================================
  // PHASE 7: FINALIZATION AND REPORTING
  // ============================================================================

  // Task 16: Generate Retraining Report
  ctx.log('info', 'Generating comprehensive retraining report');
  const retrainingReport = await ctx.task(generateRetrainingReportTask, {
    modelId,
    newModelVersion,
    currentModelVersion: modelStateValidation.currentVersion,
    retrainingTrigger,
    dataValidation,
    retrainingResult,
    trainingMonitoring,
    modelEvaluation,
    modelComparison,
    fairnessAnalysis,
    modelRegistration,
    deployed: deploymentSuccessful,
    performanceImprovement,
    artifacts
  });

  artifacts.push(...retrainingReport.artifacts);

  // Final Breakpoint: Review complete retraining pipeline results
  await ctx.breakpoint({
    question: `Model retraining pipeline complete for ${modelId}. New version: ${newModelVersion}. Performance improvement: ${performanceImprovement}%. Deployed: ${deploymentSuccessful}. Review final report?`,
    title: 'Retraining Pipeline Complete',
    context: {
      runId: ctx.runId,
      modelId,
      newModelVersion,
      currentModelVersion: modelStateValidation.currentVersion,
      performanceImprovement,
      deployed: deploymentSuccessful,
      files: [
        { path: retrainingReport.reportPath, format: 'markdown', label: 'Retraining Report' },
        { path: modelCard.modelCardPath, format: 'markdown', label: 'Model Card' },
        ...artifacts.filter(a => a.type === 'summary').map(a => ({ path: a.path, format: a.format || 'markdown' }))
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    modelId,
    modelVersion: newModelVersion,
    previousVersion: modelStateValidation.currentVersion,
    retrainingTrigger,
    performanceImprovement,
    deployed: deploymentSuccessful,
    metrics: {
      currentModel: currentModelMetrics,
      newModel: modelEvaluation.metrics,
      improvement: modelComparison.improvementDetails
    },
    fairness: {
      passed: !fairnessAnalysis.hasCriticalBias,
      criticalBiasCount: fairnessAnalysis.criticalBiasCount,
      fairnessMetrics: fairnessAnalysis.fairnessMetrics
    },
    lineage: {
      parentVersion: modelStateValidation.currentVersion,
      retrainingTrigger,
      timestamp: startTime,
      duration
    },
    artifacts,
    reportPath: retrainingReport.reportPath,
    modelCardPath: modelCard.modelCardPath,
    registryUrl: modelRegistration.registryUrl,
    metadata: {
      processId: 'data-science-ml/model-retraining',
      timestamp: startTime,
      duration
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Validate Current Model State
export const validateCurrentModelStateTask = defineTask('validate-current-model-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate current state: ${args.modelId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps engineer',
      task: 'Validate the current production model state and readiness for retraining',
      context: args,
      instructions: [
        'Retrieve current model version from model registry',
        'Fetch current production performance metrics',
        'Validate model is in healthy state (no ongoing incidents)',
        'Retrieve model schema and configuration',
        'Check model deployment status and traffic allocation',
        'Assess retraining trigger justification',
        'Document current baseline metrics for comparison',
        'Verify model artifact accessibility'
      ],
      outputFormat: 'JSON with isValid, currentVersion, currentMetrics, modelSchema, modelConfig, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'currentVersion', 'currentMetrics', 'modelSchema', 'artifacts'],
      properties: {
        isValid: { type: 'boolean' },
        currentVersion: { type: 'string' },
        currentMetrics: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1Score: { type: 'number' },
            auc: { type: 'number' }
          }
        },
        modelSchema: { type: 'object' },
        modelConfig: { type: 'object' },
        intendedUse: { type: 'string' },
        knownLimitations: { type: 'array', items: { type: 'string' } },
        monitoredDemographics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'model-state']
}));

// Task 2: Validate Retraining Data
export const validateRetrainingDataTask = defineTask('validate-retraining-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate retraining data quality',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality engineer',
      task: 'Validate data quality and suitability for model retraining',
      context: args,
      instructions: [
        'Load and inspect training data from data source',
        'Validate data schema matches model expectations',
        'Check data completeness (missing values, null counts)',
        'Assess data quality score (0-100)',
        'Verify sufficient sample size for retraining',
        'Detect data drift from original training distribution',
        'Check for data leakage or contamination',
        'Validate label quality and distribution',
        'Generate data quality report'
      ],
      outputFormat: 'JSON with dataQualityPassed, dataQualityScore, datasetSize, schemaMismatch, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataQualityPassed', 'dataQualityScore', 'datasetSize', 'artifacts'],
      properties: {
        dataQualityPassed: { type: 'boolean' },
        dataQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        datasetSize: { type: 'number' },
        schemaMismatch: { type: 'boolean' },
        schemaIssues: { type: 'array', items: { type: 'string' } },
        dataDrift: {
          type: 'object',
          properties: {
            detected: { type: 'boolean' },
            driftScore: { type: 'number' },
            driftedFeatures: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'data-quality']
}));

// Task 3: Prepare Training Environment
export const prepareTrainingEnvironmentTask = defineTask('prepare-training-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare training environment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML infrastructure engineer',
      task: 'Set up training environment with required configurations',
      context: args,
      instructions: [
        'Provision compute resources (GPU/CPU) for training',
        'Set up training framework and dependencies',
        'Configure hyperparameters (use provided or defaults)',
        'Prepare data loaders and preprocessing pipelines',
        'Set up experiment tracking (MLflow, Weights & Biases, etc.)',
        'Configure checkpointing and model saving',
        'Set up logging and monitoring',
        'Generate training configuration file'
      ],
      outputFormat: 'JSON with trainingConfig, resourcesAllocated, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingConfig', 'resourcesAllocated', 'artifacts'],
      properties: {
        trainingConfig: { type: 'object' },
        resourcesAllocated: {
          type: 'object',
          properties: {
            computeType: { type: 'string' },
            instanceCount: { type: 'number' },
            gpuCount: { type: 'number' }
          }
        },
        experimentTrackingUrl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'setup', 'training-environment']
}));

// Task 4: Execute Model Retraining
export const executeModelRetrainingTask = defineTask('execute-model-retraining', (args, taskCtx) => ({
  kind: 'agent',
  title: `Retrain model: ${args.modelId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'machine learning engineer',
      task: 'Execute model retraining with updated data',
      context: args,
      instructions: [
        'Load training and validation datasets',
        'Initialize model architecture (from current model config)',
        'Optionally load pretrained weights for transfer learning',
        'Execute training loop with configured hyperparameters',
        'Track training metrics (loss, accuracy, etc.) per epoch',
        'Save model checkpoints at intervals',
        'Validate on validation set periodically',
        'Save final trained model artifacts',
        'Generate new model version identifier',
        'Log training metadata and metrics'
      ],
      outputFormat: 'JSON with success, modelVersion, trainingJobId, estimatedDuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'modelVersion', 'trainingJobId', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        modelVersion: { type: 'string' },
        trainingJobId: { type: 'string' },
        estimatedDuration: { type: 'number' },
        modelArtifactPath: { type: 'string' },
        checkpointPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'training', 'execution']
}));

// Task 5: Monitor Training Progress
export const monitorTrainingProgressTask = defineTask('monitor-training-progress', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor training convergence',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML monitoring specialist',
      task: 'Monitor training job progress and convergence',
      context: args,
      instructions: [
        'Track training job status (running, completed, failed)',
        'Monitor training metrics over time (loss, accuracy)',
        'Assess convergence based on metric stability',
        'Check for overfitting (training vs validation gap)',
        'Monitor resource utilization (GPU, memory)',
        'Detect training anomalies (NaN loss, exploding gradients)',
        'Verify training completed within expected duration',
        'Generate training progress report with visualizations'
      ],
      outputFormat: 'JSON with converged, actualDuration, finalMetrics, trainingCurves, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'finalMetrics', 'artifacts'],
      properties: {
        converged: { type: 'boolean' },
        actualDuration: { type: 'number' },
        finalMetrics: {
          type: 'object',
          properties: {
            trainLoss: { type: 'number' },
            valLoss: { type: 'number' },
            trainAccuracy: { type: 'number' },
            valAccuracy: { type: 'number' }
          }
        },
        overfittingDetected: { type: 'boolean' },
        anomaliesDetected: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring', 'training']
}));

// Task 6: Evaluate Retrained Model
export const evaluateRetrainedModelTask = defineTask('evaluate-retrained-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate retrained model performance',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML evaluation engineer',
      task: 'Comprehensively evaluate retrained model performance',
      context: args,
      instructions: [
        'Load retrained model and validation dataset',
        'Run inference on validation set',
        'Calculate primary metric (accuracy, F1, AUC, etc.)',
        'Calculate comprehensive metrics suite',
        'Analyze error distribution and failure modes',
        'Generate confusion matrix and classification report',
        'Assess performance across data segments',
        'Check if performance meets threshold',
        'Generate evaluation report with visualizations'
      ],
      outputFormat: 'JSON with meetsThreshold, primaryMetricScore, metrics, errorAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsThreshold', 'primaryMetricScore', 'metrics', 'artifacts'],
      properties: {
        meetsThreshold: { type: 'boolean' },
        primaryMetricScore: { type: 'number' },
        metrics: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1Score: { type: 'number' },
            auc: { type: 'number' }
          }
        },
        confusionMatrix: { type: 'array' },
        errorAnalysis: {
          type: 'object',
          properties: {
            totalErrors: { type: 'number' },
            errorRate: { type: 'number' },
            errorPatterns: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'evaluation', 'validation']
}));

// Task 7: Compare Models
export const compareModelsTask = defineTask('compare-models', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare model versions',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML evaluation specialist',
      task: 'Compare retrained model with current production model',
      context: args,
      instructions: [
        'Compare primary metrics between models',
        'Calculate relative improvement percentage',
        'Perform statistical significance testing',
        'Compare performance across data segments',
        'Analyze performance trade-offs',
        'Compare model complexity and resource requirements',
        'Assess practical significance vs statistical significance',
        'Generate side-by-side comparison report'
      ],
      outputFormat: 'JSON with isImprovement, relativeImprovement, statisticallySignificant, improvementDetails, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isImprovement', 'relativeImprovement', 'statisticallySignificant', 'artifacts'],
      properties: {
        isImprovement: { type: 'boolean' },
        relativeImprovement: { type: 'number' },
        statisticallySignificant: { type: 'boolean' },
        pValue: { type: 'number' },
        improvementDetails: {
          type: 'object',
          properties: {
            accuracyDelta: { type: 'number' },
            precisionDelta: { type: 'number' },
            recallDelta: { type: 'number' },
            f1Delta: { type: 'number' }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'comparison', 'evaluation']
}));

// Task 8: Analyze Fairness
export const analyzeFairnessTask = defineTask('analyze-fairness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze model fairness and bias',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML fairness and ethics specialist',
      task: 'Analyze model for fairness and bias across demographic groups',
      context: args,
      instructions: [
        'Segment validation data by demographic attributes',
        'Calculate performance metrics per demographic group',
        'Compute fairness metrics (demographic parity, equalized odds, etc.)',
        'Identify disparate impact across groups',
        'Assess if bias exceeds acceptable thresholds',
        'Flag critical bias issues requiring immediate attention',
        'Generate fairness analysis report',
        'Recommend bias mitigation strategies if needed'
      ],
      outputFormat: 'JSON with hasCriticalBias, criticalBiasCount, criticalBiases, fairnessMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasCriticalBias', 'criticalBiasCount', 'fairnessMetrics', 'artifacts'],
      properties: {
        hasCriticalBias: { type: 'boolean' },
        criticalBiasCount: { type: 'number' },
        criticalBiases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              demographic: { type: 'string' },
              metric: { type: 'string' },
              disparateImpact: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        fairnessMetrics: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        mitigationRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'bias-analysis']
}));

// Task 9: Register Model
export const registerModelTask = defineTask('register-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Register model in model registry',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps engineer',
      task: 'Register retrained model in model registry with complete metadata',
      context: args,
      instructions: [
        'Connect to model registry (MLflow, SageMaker Model Registry, etc.)',
        'Register new model version with unique identifier',
        'Attach training metadata and hyperparameters',
        'Attach performance metrics and evaluation results',
        'Attach fairness metrics and bias analysis',
        'Document model lineage (parent version, retraining trigger)',
        'Tag model with relevant labels',
        'Set model stage (staging, pending approval)',
        'Generate registry URL for reference'
      ],
      outputFormat: 'JSON with success, registryUrl, modelVersionId, registrationTimestamp, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'registryUrl', 'modelVersionId', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        registryUrl: { type: 'string' },
        modelVersionId: { type: 'string' },
        registrationTimestamp: { type: 'string' },
        modelStage: { type: 'string', enum: ['staging', 'pending', 'production', 'archived'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'registration', 'model-registry']
}));

// Task 10: Generate Model Card
export const generateModelCardTask = defineTask('generate-model-card', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive model card',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML documentation specialist',
      task: 'Generate comprehensive model card documenting model details, performance, and limitations',
      context: args,
      instructions: [
        'Document model details (architecture, version, training date)',
        'Describe intended use and use cases',
        'Document training data and methodology',
        'Present performance metrics across segments',
        'Document fairness and bias analysis results',
        'List known limitations and failure modes',
        'Provide recommendations for use',
        'Include ethical considerations',
        'Format as structured markdown document',
        'Follow Model Card standard format'
      ],
      outputFormat: 'JSON with modelCardPath, modelCardSections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modelCardPath', 'artifacts'],
      properties: {
        modelCardPath: { type: 'string' },
        modelCardSections: {
          type: 'object',
          properties: {
            modelDetails: { type: 'string' },
            intendedUse: { type: 'string' },
            trainingData: { type: 'string' },
            performanceMetrics: { type: 'string' },
            fairnessAnalysis: { type: 'string' },
            limitations: { type: 'string' },
            ethicalConsiderations: { type: 'string' }
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
  labels: ['agent', 'documentation', 'model-card']
}));

// Task 11: Canary Deploy Model
export const canaryDeployModelTask = defineTask('canary-deploy-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deploy model with canary strategy',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'deployment engineer',
      task: 'Deploy retrained model using canary deployment strategy',
      context: args,
      instructions: [
        'Create deployment configuration for canary release',
        'Deploy new model version to canary environment',
        'Configure traffic splitting (canary percentage)',
        'Set up A/B testing between old and new models',
        'Configure automatic rollback triggers',
        'Enable detailed logging for canary traffic',
        'Generate deployment ID for tracking',
        'Calculate monitoring duration for canary',
        'Document deployment configuration'
      ],
      outputFormat: 'JSON with success, deploymentId, canaryPercentage, monitoringDuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deploymentId', 'canaryPercentage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deploymentId: { type: 'string' },
        canaryPercentage: { type: 'number' },
        monitoringDuration: { type: 'number' },
        canaryEndpoint: { type: 'string' },
        rollbackEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'canary']
}));

// Task 12: Monitor Canary Deployment
export const monitorCanaryDeploymentTask = defineTask('monitor-canary-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor canary deployment metrics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and ML monitoring specialist',
      task: 'Monitor canary deployment and assess performance',
      context: args,
      instructions: [
        'Monitor canary model predictions and metrics',
        'Compare canary performance to control (current model)',
        'Track prediction latency and throughput',
        'Monitor error rates and failures',
        'Assess statistical significance of differences',
        'Detect performance degradation or anomalies',
        'Check if canary meets performance expectations',
        'Generate canary monitoring report with comparison charts'
      ],
      outputFormat: 'JSON with meetsExpectations, metrics, issues, comparisonResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsExpectations', 'metrics', 'issues', 'artifacts'],
      properties: {
        meetsExpectations: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            canaryAccuracy: { type: 'number' },
            controlAccuracy: { type: 'number' },
            canaryLatencyMs: { type: 'number' },
            controlLatencyMs: { type: 'number' },
            canaryErrorRate: { type: 'number' },
            controlErrorRate: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              description: { type: 'string' }
            }
          }
        },
        comparisonResults: {
          type: 'object',
          properties: {
            statisticallySignificant: { type: 'boolean' },
            pValue: { type: 'number' }
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
  labels: ['agent', 'monitoring', 'canary']
}));

// Task 13: Rollback Deployment
export const rollbackDeploymentTask = defineTask('rollback-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rollback model deployment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'deployment engineer',
      task: 'Rollback failed deployment to previous model version',
      context: args,
      instructions: [
        'Stop traffic to failed model version',
        'Restore traffic to previous stable version',
        'Update serving configuration to point to old version',
        'Clean up failed deployment resources',
        'Log rollback event and reason',
        'Send notifications about rollback',
        'Generate rollback report',
        'Update model registry to mark version as failed'
      ],
      outputFormat: 'JSON with success, rolledBackTo, rollbackTimestamp, reason, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rolledBackTo', 'reason', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rolledBackTo: { type: 'string' },
        rollbackTimestamp: { type: 'string' },
        reason: { type: 'string' },
        notificationsSent: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rollback', 'deployment']
}));

// Task 14: Full Deploy Model
export const fullDeployModelTask = defineTask('full-deploy-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Full production deployment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'deployment engineer',
      task: 'Execute full production deployment of retrained model',
      context: args,
      instructions: [
        'Gradually increase traffic to new model version',
        'Monitor metrics during traffic ramp-up',
        'Complete traffic migration to new model',
        'Retire old model version from serving',
        'Update production endpoints and configurations',
        'Log deployment completion event',
        'Send deployment success notifications',
        'Generate deployment summary report'
      ],
      outputFormat: 'JSON with success, deployedVersion, trafficAllocation, deploymentTimestamp, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deployedVersion', 'trafficAllocation', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deployedVersion: { type: 'string' },
        trafficAllocation: {
          type: 'object',
          properties: {
            newModel: { type: 'number' },
            oldModel: { type: 'number' }
          }
        },
        deploymentTimestamp: { type: 'string' },
        productionEndpoint: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'production']
}));

// Task 15: Update Serving Config
export const updateServingConfigTask = defineTask('update-serving-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update model serving configuration',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'infrastructure engineer',
      task: 'Update model serving infrastructure configuration',
      context: args,
      instructions: [
        'Update model serving configuration files',
        'Point serving endpoints to new model version',
        'Update model metadata in serving layer',
        'Configure caching and optimization settings',
        'Update API documentation with new model version',
        'Archive old model version configuration',
        'Verify configuration changes applied successfully',
        'Generate configuration change log'
      ],
      outputFormat: 'JSON with success, updatedEndpoints, configurationChanges, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'updatedEndpoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        updatedEndpoints: { type: 'array', items: { type: 'string' } },
        configurationChanges: { type: 'array', items: { type: 'string' } },
        verificationPassed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'configuration', 'serving']
}));

// Task 16: Setup Post-Deployment Monitoring
export const setupPostDeploymentMonitoringTask = defineTask('setup-post-deployment-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup post-deployment monitoring',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and monitoring engineer',
      task: 'Configure comprehensive monitoring and alerting for deployed model',
      context: args,
      instructions: [
        'Configure performance metric monitoring (accuracy, latency, throughput)',
        'Set up data drift detection monitors',
        'Configure alerting rules for performance degradation',
        'Set up error rate and anomaly detection',
        'Configure dashboards for real-time monitoring',
        'Set up automated retraining triggers for drift/degradation',
        'Configure notification channels for alerts',
        'Generate monitoring configuration document'
      ],
      outputFormat: 'JSON with monitoringEnabled, dashboardUrls, alertingRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringEnabled', 'dashboardUrls', 'alertingRules', 'artifacts'],
      properties: {
        monitoringEnabled: { type: 'boolean' },
        dashboardUrls: { type: 'array', items: { type: 'string' } },
        alertingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'number' },
              action: { type: 'string' }
            }
          }
        },
        driftDetectionEnabled: { type: 'boolean' },
        retrainingTriggersConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring', 'alerting']
}));

// Task 17: Generate Retraining Report
export const generateRetrainingReportTask = defineTask('generate-retraining-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive retraining report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML technical writer and analyst',
      task: 'Generate comprehensive report documenting entire retraining pipeline',
      context: args,
      instructions: [
        'Create executive summary of retraining process',
        'Document retraining trigger and justification',
        'Summarize data validation results',
        'Document training process and convergence',
        'Present model evaluation and comparison results',
        'Summarize fairness and bias analysis',
        'Document deployment process and status',
        'Include performance improvement metrics',
        'List all artifacts and their locations',
        'Provide recommendations for future retraining',
        'Format as professional Markdown report with visualizations'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextRetrainingSchedule: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'documentation']
}));

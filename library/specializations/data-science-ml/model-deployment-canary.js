/**
 * @process specializations/data-science-ml/model-deployment-canary
 * @description Model Deployment Pipeline with Canary Release - Progressive rollout strategy with automated
 * health monitoring, traffic shifting, and rollback capabilities for ML model deployments.
 * @inputs { modelPath: string, modelVersion: string, targetEnvironment: string, canaryPercentages?: number[], healthCheckConfig?: object }
 * @outputs { success: boolean, deploymentStatus: string, canaryMetrics: object, finalTrafficAllocation: object, rollbackTriggered: boolean }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/model-deployment-canary', {
 *   modelPath: 'models/churn-predictor-v2.pkl',
 *   modelVersion: 'v2.0.1',
 *   targetEnvironment: 'production',
 *   canaryPercentages: [5, 25, 50, 100],
 *   healthCheckConfig: {
 *     latencyThresholdMs: 200,
 *     errorRateThreshold: 0.02,
 *     minSampleSize: 1000
 *   }
 * });
 *
 * @references
 * - Canary Deployment Pattern: https://martinfowler.com/bliki/CanaryRelease.html
 * - Progressive Delivery: https://redmonk.com/jgovernor/2018/08/06/towards-progressive-delivery/
 * - Google SRE Canary: https://sre.google/workbook/canarying-releases/
 * - AWS ML Deployments: https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html
 * - MLOps Deployment Strategies: https://ml-ops.org/content/deployment-strategies
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelPath,
    modelVersion,
    targetEnvironment = 'production',
    canaryPercentages = [10, 25, 50, 100],
    healthCheckConfig = {
      latencyThresholdMs: 200,
      errorRateThreshold: 0.02,
      accuracyDropThreshold: 0.05,
      minSampleSize: 1000,
      evaluationWindowMinutes: 10
    },
    rollbackEnabled = true,
    notificationChannels = []
  } = inputs;

  const startTime = ctx.now();
  let rollbackTriggered = false;
  const canaryHistory = [];

  ctx.log('info', `Starting canary deployment for model ${modelVersion} to ${targetEnvironment}`);

  // ============================================================================
  // PHASE 1: PRE-DEPLOYMENT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Pre-deployment validation');

  // Task 1.1: Model Artifact Validation
  const artifactValidation = await ctx.task(modelArtifactValidationTask, {
    modelPath,
    modelVersion,
    targetEnvironment
  });

  if (!artifactValidation.valid) {
    return {
      success: false,
      error: 'Model artifact validation failed',
      details: artifactValidation.errors,
      phase: 'pre-deployment-validation',
      metadata: { processId: 'specializations/data-science-ml/model-deployment-canary', timestamp: startTime }
    };
  }

  // Task 1.2: Environment Readiness Check
  const environmentCheck = await ctx.task(environmentReadinessTask, {
    targetEnvironment,
    modelVersion,
    requiredResources: artifactValidation.resourceRequirements
  });

  if (!environmentCheck.ready) {
    return {
      success: false,
      error: 'Environment not ready for deployment',
      details: environmentCheck.issues,
      phase: 'pre-deployment-validation',
      metadata: { processId: 'specializations/data-science-ml/model-deployment-canary', timestamp: startTime }
    };
  }

  // Task 1.3: Baseline Metrics Capture
  const baselineMetrics = await ctx.task(baselineMetricsCaptureTask, {
    targetEnvironment,
    currentModelVersion: environmentCheck.currentModelVersion,
    metricsToCapture: ['latency', 'errorRate', 'throughput', 'accuracy']
  });

  // Breakpoint: Review pre-deployment validation results
  await ctx.breakpoint({
    question: `Pre-deployment validation complete for ${modelVersion}. Artifact valid, environment ready, baseline captured. Proceed with canary deployment?`,
    title: 'Pre-Deployment Validation Review',
    context: {
      runId: ctx.runId,
      modelVersion,
      targetEnvironment,
      baselineMetrics: baselineMetrics.metrics,
      files: [
        { path: `artifacts/pre-deployment-validation.json`, format: 'json' },
        { path: `artifacts/baseline-metrics.json`, format: 'json' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: CANARY DEPLOYMENT INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Canary deployment initialization');

  // Task 2.1: Deploy Canary Infrastructure
  const canaryInfrastructure = await ctx.task(canaryInfrastructureDeploymentTask, {
    modelPath,
    modelVersion,
    targetEnvironment,
    infrastructureConfig: environmentCheck.infrastructureConfig
  });

  if (!canaryInfrastructure.success) {
    return {
      success: false,
      error: 'Canary infrastructure deployment failed',
      details: canaryInfrastructure.errors,
      phase: 'canary-initialization',
      metadata: { processId: 'specializations/data-science-ml/model-deployment-canary', timestamp: startTime }
    };
  }

  // Task 2.2: Configure Traffic Routing
  const trafficRouting = await ctx.task(trafficRoutingConfigurationTask, {
    targetEnvironment,
    canaryEndpoint: canaryInfrastructure.canaryEndpoint,
    productionEndpoint: canaryInfrastructure.productionEndpoint,
    initialTrafficPercentage: 0
  });

  // Task 2.3: Setup Monitoring and Alerts
  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    targetEnvironment,
    modelVersion,
    canaryEndpoint: canaryInfrastructure.canaryEndpoint,
    healthCheckConfig,
    notificationChannels
  });

  ctx.log('info', `Canary infrastructure deployed: ${canaryInfrastructure.canaryEndpoint}`);

  // ============================================================================
  // PHASE 3: PROGRESSIVE TRAFFIC SHIFTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Progressive traffic shifting with health checks');

  for (let i = 0; i < canaryPercentages.length; i++) {
    const targetPercentage = canaryPercentages[i];
    const currentStage = i + 1;
    const totalStages = canaryPercentages.length;

    ctx.log('info', `Stage ${currentStage}/${totalStages}: Shifting to ${targetPercentage}% canary traffic`);

    // Task 3.1: Shift Traffic to Target Percentage
    const trafficShift = await ctx.task(trafficShiftTask, {
      targetEnvironment,
      canaryEndpoint: canaryInfrastructure.canaryEndpoint,
      targetPercentage,
      currentPercentage: i > 0 ? canaryPercentages[i - 1] : 0
    });

    // Task 3.2: Wait for Stabilization Period
    await ctx.task(stabilizationWaitTask, {
      targetEnvironment,
      waitMinutes: healthCheckConfig.evaluationWindowMinutes,
      canaryPercentage: targetPercentage
    });

    // Task 3.3: Collect Canary Metrics
    const canaryMetrics = await ctx.task(canaryMetricsCollectionTask, {
      targetEnvironment,
      canaryEndpoint: canaryInfrastructure.canaryEndpoint,
      productionEndpoint: canaryInfrastructure.productionEndpoint,
      evaluationWindowMinutes: healthCheckConfig.evaluationWindowMinutes,
      minSampleSize: healthCheckConfig.minSampleSize
    });

    // Task 3.4: Health Check Analysis
    const healthAnalysis = await ctx.task(canaryHealthAnalysisTask, {
      canaryMetrics: canaryMetrics.canaryMetrics,
      baselineMetrics: baselineMetrics.metrics,
      healthCheckConfig,
      currentStage,
      totalStages
    });

    // Store stage results
    canaryHistory.push({
      stage: currentStage,
      percentage: targetPercentage,
      timestamp: ctx.now(),
      metrics: canaryMetrics.canaryMetrics,
      healthStatus: healthAnalysis.status,
      healthScore: healthAnalysis.healthScore
    });

    // Quality Gate: Health Check Pass/Fail
    if (healthAnalysis.status === 'failed') {
      ctx.log('error', `Health check failed at ${targetPercentage}% traffic: ${healthAnalysis.reason}`);

      // Trigger rollback if enabled
      if (rollbackEnabled) {
        ctx.log('warn', 'Triggering automatic rollback');
        rollbackTriggered = true;

        // Task 3.5: Execute Rollback
        const rollbackResult = await ctx.task(rollbackExecutionTask, {
          targetEnvironment,
          canaryEndpoint: canaryInfrastructure.canaryEndpoint,
          previousModelVersion: environmentCheck.currentModelVersion,
          reason: healthAnalysis.reason,
          failedAtPercentage: targetPercentage
        });

        // Breakpoint: Rollback Notification
        await ctx.breakpoint({
          question: `Canary deployment FAILED at ${targetPercentage}% traffic and was automatically rolled back. Review failure details?`,
          title: 'Canary Deployment Failed - Rollback Complete',
          context: {
            runId: ctx.runId,
            modelVersion,
            failureReason: healthAnalysis.reason,
            failedAtPercentage: targetPercentage,
            rollbackResult,
            canaryHistory,
            files: [
              { path: `artifacts/canary-failure-report.json`, format: 'json' },
              { path: `artifacts/health-analysis-${currentStage}.json`, format: 'json' }
            ]
          }
        });

        return {
          success: false,
          deploymentStatus: 'rolled-back',
          rollbackTriggered: true,
          failedAtPercentage: targetPercentage,
          failureReason: healthAnalysis.reason,
          canaryHistory,
          rollbackResult,
          metadata: {
            processId: 'specializations/data-science-ml/model-deployment-canary',
            timestamp: startTime,
            duration: ctx.now() - startTime,
            modelVersion,
            targetEnvironment
          }
        };
      } else {
        // No rollback, just pause for manual intervention
        await ctx.breakpoint({
          question: `Health check FAILED at ${targetPercentage}% traffic. Rollback disabled. Manual intervention required. Continue or abort?`,
          title: 'Canary Health Check Failed',
          context: {
            runId: ctx.runId,
            modelVersion,
            failureReason: healthAnalysis.reason,
            currentPercentage: targetPercentage,
            healthAnalysis,
            canaryMetrics: canaryMetrics.canaryMetrics,
            files: [
              { path: `artifacts/health-analysis-${currentStage}.json`, format: 'json' }
            ]
          }
        });
      }
    } else if (healthAnalysis.status === 'warning') {
      // Warning state - pause for review
      await ctx.breakpoint({
        question: `Health check shows WARNING at ${targetPercentage}% traffic. Health score: ${healthAnalysis.healthScore}/100. Review metrics and proceed to next stage?`,
        title: `Canary Stage ${currentStage} - Warning State`,
        context: {
          runId: ctx.runId,
          modelVersion,
          warningReasons: healthAnalysis.warnings,
          currentPercentage: targetPercentage,
          nextPercentage: i < canaryPercentages.length - 1 ? canaryPercentages[i + 1] : null,
          healthAnalysis,
          canaryMetrics: canaryMetrics.canaryMetrics,
          files: [
            { path: `artifacts/health-analysis-${currentStage}.json`, format: 'json' },
            { path: `artifacts/canary-metrics-${currentStage}.json`, format: 'json' }
          ]
        }
      });
    } else {
      // Success - log and continue
      ctx.log('info', `Health check PASSED at ${targetPercentage}% traffic. Health score: ${healthAnalysis.healthScore}/100`);

      // Optional breakpoint for review (can be skipped for full automation)
      if (targetPercentage < 100 && i < canaryPercentages.length - 1) {
        await ctx.breakpoint({
          question: `Stage ${currentStage}/${totalStages} complete. Health check passed at ${targetPercentage}%. Proceed to ${canaryPercentages[i + 1]}%?`,
          title: `Canary Stage ${currentStage} - Success`,
          context: {
            runId: ctx.runId,
            modelVersion,
            currentPercentage: targetPercentage,
            nextPercentage: canaryPercentages[i + 1],
            healthScore: healthAnalysis.healthScore,
            metrics: canaryMetrics.canaryMetrics,
            files: [
              { path: `artifacts/health-analysis-${currentStage}.json`, format: 'json' }
            ]
          }
        });
      }
    }
  }

  // ============================================================================
  // PHASE 4: FULL DEPLOYMENT AND CLEANUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Full deployment and cleanup');

  // Task 4.1: Promote Canary to Production
  const promotionResult = await ctx.task(canaryPromotionTask, {
    targetEnvironment,
    canaryEndpoint: canaryInfrastructure.canaryEndpoint,
    modelVersion,
    canaryHistory
  });

  // Task 4.2: Final Validation
  const finalValidation = await ctx.task(postDeploymentValidationTask, {
    targetEnvironment,
    modelVersion,
    deploymentEndpoint: promotionResult.productionEndpoint,
    expectedBehavior: artifactValidation.expectedBehavior
  });

  // Task 4.3: Cleanup Canary Infrastructure
  const cleanup = await ctx.task(canaryCleanupTask, {
    targetEnvironment,
    canaryEndpoint: canaryInfrastructure.canaryEndpoint,
    retainLogs: true,
    retainMetrics: true
  });

  // Task 4.4: Generate Deployment Report
  const deploymentReport = await ctx.task(deploymentReportGenerationTask, {
    modelVersion,
    targetEnvironment,
    canaryHistory,
    baselineMetrics: baselineMetrics.metrics,
    finalMetrics: canaryHistory[canaryHistory.length - 1].metrics,
    promotionResult,
    cleanup
  });

  // Final Breakpoint: Deployment Complete
  await ctx.breakpoint({
    question: `Canary deployment SUCCESSFUL! Model ${modelVersion} is now serving 100% production traffic in ${targetEnvironment}. Review deployment report?`,
    title: 'Canary Deployment Complete',
    context: {
      runId: ctx.runId,
      modelVersion,
      targetEnvironment,
      totalStages: canaryPercentages.length,
      deploymentDuration: ctx.now() - startTime,
      files: [
        { path: `artifacts/deployment-report.json`, format: 'json' },
        { path: `artifacts/deployment-report.md`, format: 'markdown' },
        { path: `artifacts/canary-history.json`, format: 'json' }
      ]
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    deploymentStatus: 'completed',
    modelVersion,
    targetEnvironment,
    rollbackTriggered: false,
    canaryHistory,
    canaryMetrics: {
      stages: canaryHistory.length,
      finalHealthScore: canaryHistory[canaryHistory.length - 1].healthScore,
      averageHealthScore: canaryHistory.reduce((sum, h) => sum + h.healthScore, 0) / canaryHistory.length
    },
    finalTrafficAllocation: {
      canary: 0,
      production: 100,
      model: modelVersion
    },
    baselineMetrics: baselineMetrics.metrics,
    finalMetrics: canaryHistory[canaryHistory.length - 1].metrics,
    promotionResult,
    cleanup,
    reportPath: deploymentReport.reportPath,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/data-science-ml/model-deployment-canary',
      timestamp: startTime,
      completedAt: endTime,
      canaryPercentages
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1.1: Model Artifact Validation
export const modelArtifactValidationTask = defineTask('model-artifact-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate model artifact - ${args.modelVersion}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML DevOps Engineer with expertise in model deployment and validation',
      task: 'Validate model artifact for production deployment readiness',
      context: {
        modelPath: args.modelPath,
        modelVersion: args.modelVersion,
        targetEnvironment: args.targetEnvironment
      },
      instructions: [
        '1. Verify model file exists at specified path and is accessible',
        '2. Validate model serialization format (pickle, joblib, ONNX, TensorFlow SavedModel, etc.)',
        '3. Check model file integrity (checksums, signatures)',
        '4. Verify model dependencies and framework versions are compatible',
        '5. Load model and validate it can be deserialized successfully',
        '6. Check for model metadata (version, training date, feature schema, performance metrics)',
        '7. Validate model signature (input/output schema)',
        '8. Estimate resource requirements (memory, CPU/GPU, disk space)',
        '9. Verify model can perform inference on sample data',
        '10. Check for security vulnerabilities in model dependencies'
      ],
      outputFormat: 'JSON object with validation results, errors, and resource requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'modelPath', 'modelVersion'],
      properties: {
        valid: { type: 'boolean' },
        modelPath: { type: 'string' },
        modelVersion: { type: 'string' },
        modelFormat: { type: 'string' },
        frameworkVersion: { type: 'string' },
        resourceRequirements: {
          type: 'object',
          properties: {
            memoryMB: { type: 'number' },
            cpuCores: { type: 'number' },
            gpuRequired: { type: 'boolean' },
            diskSpaceMB: { type: 'number' }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            trainedAt: { type: 'string' },
            featureSchema: { type: 'object' },
            performanceMetrics: { type: 'object' }
          }
        },
        integrityCheck: {
          type: 'object',
          properties: {
            checksumValid: { type: 'boolean' },
            signatureValid: { type: 'boolean' }
          }
        },
        inferenceTest: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            latencyMs: { type: 'number' }
          }
        },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        expectedBehavior: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'validation', 'pre-deployment']
}));

// Task 1.2: Environment Readiness Check
export const environmentReadinessTask = defineTask('environment-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Check environment readiness - ${args.targetEnvironment}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with expertise in infrastructure and deployment',
      task: 'Validate target environment is ready for canary deployment',
      context: {
        targetEnvironment: args.targetEnvironment,
        modelVersion: args.modelVersion,
        requiredResources: args.requiredResources
      },
      instructions: [
        '1. Verify target environment exists and is accessible',
        '2. Check current deployed model version',
        '3. Validate infrastructure capacity (compute, memory, storage) meets requirements',
        '4. Check load balancer and traffic routing configuration',
        '5. Verify monitoring and logging systems are operational',
        '6. Check database connections and external API dependencies',
        '7. Validate service accounts and IAM permissions for deployment',
        '8. Check for ongoing deployments or maintenance windows',
        '9. Verify rollback capability (previous version available)',
        '10. Assess current traffic load and health status'
      ],
      outputFormat: 'JSON object with readiness status, current state, and issues'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'targetEnvironment', 'currentModelVersion'],
      properties: {
        ready: { type: 'boolean' },
        targetEnvironment: { type: 'string' },
        currentModelVersion: { type: 'string' },
        infrastructureCapacity: {
          type: 'object',
          properties: {
            cpuAvailable: { type: 'number' },
            memoryAvailable: { type: 'number' },
            storageAvailable: { type: 'number' },
            sufficient: { type: 'boolean' }
          }
        },
        infrastructureConfig: { type: 'object' },
        loadBalancer: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            healthy: { type: 'boolean' }
          }
        },
        monitoringSystems: {
          type: 'object',
          properties: {
            operational: { type: 'boolean' },
            systems: { type: 'array', items: { type: 'string' } }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              healthy: { type: 'boolean' }
            }
          }
        },
        permissions: {
          type: 'object',
          properties: {
            deployAccess: { type: 'boolean' },
            rollbackAccess: { type: 'boolean' }
          }
        },
        ongoingOperations: { type: 'array', items: { type: 'string' } },
        currentTrafficLoad: {
          type: 'object',
          properties: {
            requestsPerSecond: { type: 'number' },
            healthy: { type: 'boolean' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'environment', 'pre-deployment']
}));

// Task 1.3: Baseline Metrics Capture
export const baselineMetricsCaptureTask = defineTask('baseline-metrics-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture baseline metrics - ${args.currentModelVersion}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Monitoring Engineer with expertise in metrics and observability',
      task: 'Capture baseline performance metrics from current production model',
      context: {
        targetEnvironment: args.targetEnvironment,
        currentModelVersion: args.currentModelVersion,
        metricsToCapture: args.metricsToCapture
      },
      instructions: [
        '1. Query production metrics for current model version',
        '2. Capture latency metrics (p50, p90, p95, p99) over last 24 hours',
        '3. Capture error rate and success rate',
        '4. Capture throughput (requests per second)',
        '5. Capture model accuracy metrics if available (from feedback loop)',
        '6. Capture resource utilization (CPU, memory)',
        '7. Calculate statistical summary (mean, median, std dev)',
        '8. Identify normal operating ranges for each metric',
        '9. Save baseline metrics for comparison during canary',
        '10. Generate baseline metrics report'
      ],
      outputFormat: 'JSON object with baseline metrics and statistical summary'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'capturedAt'],
      properties: {
        currentModelVersion: { type: 'string' },
        capturedAt: { type: 'string' },
        captureWindow: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            latency: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p90: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' },
                mean: { type: 'number' },
                stdDev: { type: 'number' }
              }
            },
            errorRate: {
              type: 'object',
              properties: {
                rate: { type: 'number' },
                count: { type: 'number' },
                types: { type: 'object' }
              }
            },
            throughput: {
              type: 'object',
              properties: {
                requestsPerSecond: { type: 'number' },
                totalRequests: { type: 'number' }
              }
            },
            accuracy: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                value: { type: 'number' },
                sampleSize: { type: 'number' }
              }
            },
            resourceUtilization: {
              type: 'object',
              properties: {
                cpuPercent: { type: 'number' },
                memoryPercent: { type: 'number' }
              }
            }
          }
        },
        normalRanges: {
          type: 'object',
          properties: {
            latencyP95Max: { type: 'number' },
            errorRateMax: { type: 'number' },
            minThroughput: { type: 'number' }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            sampleSize: { type: 'number' },
            completeness: { type: 'number' },
            confidence: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'metrics', 'baseline']
}));

// Task 2.1: Canary Infrastructure Deployment
export const canaryInfrastructureDeploymentTask = defineTask('canary-infrastructure-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy canary infrastructure - ${args.modelVersion}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Infrastructure Engineer with expertise in ML deployment',
      task: 'Deploy canary infrastructure for new model version',
      context: {
        modelPath: args.modelPath,
        modelVersion: args.modelVersion,
        targetEnvironment: args.targetEnvironment,
        infrastructureConfig: args.infrastructureConfig
      },
      instructions: [
        '1. Provision canary compute resources (containers, VMs, or serverless functions)',
        '2. Deploy new model version to canary endpoint',
        '3. Configure canary service with appropriate resource limits',
        '4. Setup health check endpoints for canary service',
        '5. Verify canary service starts successfully and passes health checks',
        '6. Configure logging and monitoring for canary endpoint',
        '7. Tag canary resources with deployment metadata',
        '8. Verify canary endpoint can serve inference requests',
        '9. Record canary endpoint URL and service details',
        '10. Keep production endpoint unchanged at this stage'
      ],
      outputFormat: 'JSON object with deployment status, endpoints, and service details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'canaryEndpoint', 'productionEndpoint'],
      properties: {
        success: { type: 'boolean' },
        modelVersion: { type: 'string' },
        canaryEndpoint: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            serviceId: { type: 'string' },
            resourceIds: { type: 'array', items: { type: 'string' } },
            healthCheckUrl: { type: 'string' },
            status: { type: 'string' }
          }
        },
        productionEndpoint: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            serviceId: { type: 'string' },
            currentVersion: { type: 'string' }
          }
        },
        deploymentDetails: {
          type: 'object',
          properties: {
            region: { type: 'string' },
            infrastructure: { type: 'string' },
            replicas: { type: 'number' },
            resourceAllocation: { type: 'object' }
          }
        },
        healthCheck: {
          type: 'object',
          properties: {
            passed: { type: 'boolean' },
            latencyMs: { type: 'number' }
          }
        },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'infrastructure', 'deployment']
}));

// Task 2.2: Traffic Routing Configuration
export const trafficRoutingConfigurationTask = defineTask('traffic-routing-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure traffic routing - ${args.initialTrafficPercentage}%`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network Engineer with expertise in load balancing and traffic management',
      task: 'Configure traffic routing between production and canary endpoints',
      context: {
        targetEnvironment: args.targetEnvironment,
        canaryEndpoint: args.canaryEndpoint,
        productionEndpoint: args.productionEndpoint,
        initialTrafficPercentage: args.initialTrafficPercentage
      },
      instructions: [
        '1. Configure load balancer or API gateway for traffic splitting',
        '2. Set initial traffic split (typically 0% to canary initially)',
        '3. Configure routing rules (weighted routing, header-based, etc.)',
        '4. Setup session affinity if required by model',
        '5. Configure timeout and retry policies',
        '6. Verify routing configuration is valid',
        '7. Test routing with synthetic requests',
        '8. Record routing configuration for audit trail',
        '9. Ensure rollback capability is maintained',
        '10. Verify production traffic continues normally'
      ],
      outputFormat: 'JSON object with routing configuration and verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'currentAllocation'],
      properties: {
        configured: { type: 'boolean' },
        routingStrategy: { type: 'string' },
        currentAllocation: {
          type: 'object',
          properties: {
            production: { type: 'number' },
            canary: { type: 'number' }
          }
        },
        loadBalancer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            configured: { type: 'boolean' }
          }
        },
        routingRules: { type: 'array', items: { type: 'object' } },
        sessionAffinity: { type: 'boolean' },
        policies: {
          type: 'object',
          properties: {
            timeout: { type: 'string' },
            retries: { type: 'number' }
          }
        },
        verification: {
          type: 'object',
          properties: {
            tested: { type: 'boolean' },
            productionTrafficNormal: { type: 'boolean' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'traffic', 'routing']
}));

// Task 2.3: Monitoring Setup
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup monitoring and alerts - ${args.modelVersion}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE with expertise in monitoring and alerting',
      task: 'Setup comprehensive monitoring and alerting for canary deployment',
      context: {
        targetEnvironment: args.targetEnvironment,
        modelVersion: args.modelVersion,
        canaryEndpoint: args.canaryEndpoint,
        healthCheckConfig: args.healthCheckConfig,
        notificationChannels: args.notificationChannels
      },
      instructions: [
        '1. Configure metrics collection for canary endpoint',
        '2. Setup dashboards for canary vs production comparison',
        '3. Create alerts for health check thresholds (latency, error rate, etc.)',
        '4. Configure anomaly detection for canary metrics',
        '5. Setup notification channels (Slack, PagerDuty, email)',
        '6. Configure log aggregation and search for canary',
        '7. Setup distributed tracing if applicable',
        '8. Create alert for automatic rollback triggers',
        '9. Verify all monitoring systems are receiving data',
        '10. Test notification channels'
      ],
      outputFormat: 'JSON object with monitoring configuration and verification'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'dashboardUrl'],
      properties: {
        configured: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        metricsCollector: {
          type: 'object',
          properties: {
            system: { type: 'string' },
            configured: { type: 'boolean' },
            metricsCollected: { type: 'array', items: { type: 'string' } }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'number' },
              severity: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        },
        notificationChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              type: { type: 'string' },
              tested: { type: 'boolean' }
            }
          }
        },
        logging: {
          type: 'object',
          properties: {
            system: { type: 'string' },
            configured: { type: 'boolean' }
          }
        },
        verification: {
          type: 'object',
          properties: {
            dataReceiving: { type: 'boolean' },
            alertsActive: { type: 'boolean' },
            notificationsTested: { type: 'boolean' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'monitoring', 'alerting']
}));

// Task 3.1: Traffic Shift
export const trafficShiftTask = defineTask('traffic-shift', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shift traffic to ${args.targetPercentage}%`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with expertise in progressive delivery',
      task: 'Shift traffic from production to canary endpoint',
      context: {
        targetEnvironment: args.targetEnvironment,
        canaryEndpoint: args.canaryEndpoint,
        targetPercentage: args.targetPercentage,
        currentPercentage: args.currentPercentage
      },
      instructions: [
        '1. Calculate traffic shift delta (from current to target percentage)',
        '2. Update load balancer weights or routing rules',
        '3. Verify configuration change is applied',
        '4. Wait for configuration propagation (usually 30-60 seconds)',
        '5. Send test requests to verify routing distribution',
        '6. Monitor immediate impact on both endpoints',
        '7. Record traffic shift timestamp and configuration',
        '8. Verify both endpoints remain healthy after shift',
        '9. Check for any immediate errors or anomalies',
        '10. Confirm traffic distribution matches target'
      ],
      outputFormat: 'JSON object with traffic shift results and verification'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'currentAllocation'],
      properties: {
        success: { type: 'boolean' },
        shiftedAt: { type: 'string' },
        previousAllocation: {
          type: 'object',
          properties: {
            production: { type: 'number' },
            canary: { type: 'number' }
          }
        },
        currentAllocation: {
          type: 'object',
          properties: {
            production: { type: 'number' },
            canary: { type: 'number' }
          }
        },
        verification: {
          type: 'object',
          properties: {
            configApplied: { type: 'boolean' },
            distributionVerified: { type: 'boolean' },
            bothEndpointsHealthy: { type: 'boolean' }
          }
        },
        immediateImpact: {
          type: 'object',
          properties: {
            errorsDetected: { type: 'boolean' },
            latencyIncrease: { type: 'boolean' }
          }
        },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'traffic-shift', 'execution']
}));

// Task 3.2: Stabilization Wait
export const stabilizationWaitTask = defineTask('stabilization-wait', (args, taskCtx) => ({
  kind: 'agent',
  title: `Wait for stabilization - ${args.waitMinutes} minutes`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Deployment Coordinator',
      task: 'Wait for metrics to stabilize after traffic shift',
      context: {
        targetEnvironment: args.targetEnvironment,
        waitMinutes: args.waitMinutes,
        canaryPercentage: args.canaryPercentage
      },
      instructions: [
        '1. Wait for specified evaluation window duration',
        '2. Monitor real-time metrics during wait period',
        '3. Check for immediate failures or anomalies',
        '4. Ensure sufficient sample size for statistical analysis',
        '5. Log periodic status updates during wait',
        '6. Allow metrics to reach steady state',
        '7. Record wait period start and end times',
        '8. Verify both endpoints continue serving requests',
        '9. Note any transient issues during warm-up',
        '10. Confirm wait period completed successfully'
      ],
      outputFormat: 'JSON object with wait period results and observations'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'waitedMinutes'],
      properties: {
        completed: { type: 'boolean' },
        waitedMinutes: { type: 'number' },
        startedAt: { type: 'string' },
        completedAt: { type: 'string' },
        canaryPercentage: { type: 'number' },
        observations: {
          type: 'object',
          properties: {
            immediateFailures: { type: 'boolean' },
            anomaliesDetected: { type: 'boolean' },
            sufficientSamples: { type: 'boolean' },
            steadyStateReached: { type: 'boolean' }
          }
        },
        sampleSize: {
          type: 'object',
          properties: {
            canaryRequests: { type: 'number' },
            productionRequests: { type: 'number' }
          }
        },
        transientIssues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'stabilization', 'wait']
}));

// Task 3.3: Canary Metrics Collection
export const canaryMetricsCollectionTask = defineTask('canary-metrics-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect canary metrics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer with expertise in metrics analysis',
      task: 'Collect and aggregate metrics from canary and production endpoints',
      context: {
        targetEnvironment: args.targetEnvironment,
        canaryEndpoint: args.canaryEndpoint,
        productionEndpoint: args.productionEndpoint,
        evaluationWindowMinutes: args.evaluationWindowMinutes,
        minSampleSize: args.minSampleSize
      },
      instructions: [
        '1. Query metrics for canary endpoint over evaluation window',
        '2. Query metrics for production endpoint over same window',
        '3. Collect latency percentiles (p50, p90, p95, p99)',
        '4. Collect error rate and error types',
        '5. Collect throughput and request counts',
        '6. Collect model-specific metrics if available (accuracy, predictions)',
        '7. Collect resource utilization (CPU, memory)',
        '8. Calculate statistical measures (mean, median, std dev)',
        '9. Verify minimum sample size is met',
        '10. Generate comparative metrics summary'
      ],
      outputFormat: 'JSON object with canary and production metrics for comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['canaryMetrics', 'productionMetrics', 'collectedAt'],
      properties: {
        collectedAt: { type: 'string' },
        evaluationWindow: { type: 'string' },
        canaryMetrics: {
          type: 'object',
          properties: {
            latency: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p90: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' },
                mean: { type: 'number' },
                stdDev: { type: 'number' }
              }
            },
            errorRate: {
              type: 'object',
              properties: {
                rate: { type: 'number' },
                count: { type: 'number' },
                types: { type: 'object' }
              }
            },
            throughput: {
              type: 'object',
              properties: {
                requestsPerSecond: { type: 'number' },
                totalRequests: { type: 'number' }
              }
            },
            accuracy: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                value: { type: 'number' },
                sampleSize: { type: 'number' }
              }
            },
            resourceUtilization: {
              type: 'object',
              properties: {
                cpuPercent: { type: 'number' },
                memoryPercent: { type: 'number' }
              }
            }
          }
        },
        productionMetrics: {
          type: 'object',
          properties: {
            latency: { type: 'object' },
            errorRate: { type: 'object' },
            throughput: { type: 'object' },
            accuracy: { type: 'object' },
            resourceUtilization: { type: 'object' }
          }
        },
        sampleSizeCheck: {
          type: 'object',
          properties: {
            canaryRequests: { type: 'number' },
            productionRequests: { type: 'number' },
            minimumMet: { type: 'boolean' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'metrics', 'collection']
}));

// Task 3.4: Canary Health Analysis
export const canaryHealthAnalysisTask = defineTask('canary-health-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze canary health - Stage ${args.currentStage}/${args.totalStages}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and ML Performance Analyst',
      task: 'Analyze canary health and determine if deployment should continue',
      context: {
        canaryMetrics: args.canaryMetrics,
        baselineMetrics: args.baselineMetrics,
        healthCheckConfig: args.healthCheckConfig,
        currentStage: args.currentStage,
        totalStages: args.totalStages
      },
      instructions: [
        '1. Compare canary latency vs baseline (threshold: healthCheckConfig.latencyThresholdMs)',
        '2. Compare canary error rate vs baseline (threshold: healthCheckConfig.errorRateThreshold)',
        '3. Compare canary accuracy vs baseline if available (threshold: healthCheckConfig.accuracyDropThreshold)',
        '4. Check resource utilization is within acceptable limits',
        '5. Perform statistical significance tests (t-test, Mann-Whitney U)',
        '6. Calculate overall health score (0-100)',
        '7. Determine status: passed, warning, or failed',
        '8. Identify specific failures or concerns',
        '9. Generate recommendations for next steps',
        '10. Provide rollback recommendation if health check fails'
      ],
      outputFormat: 'JSON object with health analysis, status, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'healthScore'],
      properties: {
        status: {
          type: 'string',
          enum: ['passed', 'warning', 'failed'],
          description: 'Overall health check status'
        },
        healthScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall health score'
        },
        analysisDetails: {
          type: 'object',
          properties: {
            latencyCheck: {
              type: 'object',
              properties: {
                passed: { type: 'boolean' },
                canaryP95: { type: 'number' },
                baselineP95: { type: 'number' },
                threshold: { type: 'number' },
                percentageIncrease: { type: 'number' }
              }
            },
            errorRateCheck: {
              type: 'object',
              properties: {
                passed: { type: 'boolean' },
                canaryRate: { type: 'number' },
                baselineRate: { type: 'number' },
                threshold: { type: 'number' },
                increase: { type: 'number' }
              }
            },
            accuracyCheck: {
              type: 'object',
              properties: {
                passed: { type: 'boolean' },
                available: { type: 'boolean' },
                canaryAccuracy: { type: 'number' },
                baselineAccuracy: { type: 'number' },
                threshold: { type: 'number' },
                drop: { type: 'number' }
              }
            },
            resourceCheck: {
              type: 'object',
              properties: {
                passed: { type: 'boolean' },
                cpuWithinLimits: { type: 'boolean' },
                memoryWithinLimits: { type: 'boolean' }
              }
            },
            statisticalSignificance: {
              type: 'object',
              properties: {
                latencyDifferenceSignificant: { type: 'boolean' },
                errorRateDifferenceSignificant: { type: 'boolean' },
                pValue: { type: 'number' }
              }
            }
          }
        },
        failures: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of failed health checks'
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of warning conditions'
        },
        reason: {
          type: 'string',
          description: 'Primary reason for status (especially if failed)'
        },
        recommendation: {
          type: 'string',
          enum: ['continue', 'proceed-with-caution', 'pause-for-review', 'rollback'],
          description: 'Recommended action'
        },
        rollbackRecommended: {
          type: 'boolean',
          description: 'Whether rollback should be triggered'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'health-analysis', 'quality-gate']
}));

// Task 3.5: Rollback Execution
export const rollbackExecutionTask = defineTask('rollback-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute rollback - ${args.reason}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Response Engineer with expertise in rollback procedures',
      task: 'Execute immediate rollback of canary deployment',
      context: {
        targetEnvironment: args.targetEnvironment,
        canaryEndpoint: args.canaryEndpoint,
        previousModelVersion: args.previousModelVersion,
        reason: args.reason,
        failedAtPercentage: args.failedAtPercentage
      },
      instructions: [
        '1. Immediately shift 100% traffic back to production endpoint',
        '2. Verify traffic is no longer reaching canary endpoint',
        '3. Stop canary service gracefully',
        '4. Preserve canary logs and metrics for post-mortem',
        '5. Verify production endpoint is healthy and serving all traffic',
        '6. Send rollback notifications to configured channels',
        '7. Record rollback details (time, reason, triggered by)',
        '8. Create incident report with failure details',
        '9. Tag canary resources for cleanup',
        '10. Verify system returned to stable state'
      ],
      outputFormat: 'JSON object with rollback execution results and incident details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rolledBackAt'],
      properties: {
        success: { type: 'boolean' },
        rolledBackAt: { type: 'string' },
        reason: { type: 'string' },
        failedAtPercentage: { type: 'number' },
        trafficRestored: {
          type: 'object',
          properties: {
            production: { type: 'number' },
            canary: { type: 'number' }
          }
        },
        canaryServiceStopped: { type: 'boolean' },
        dataPreserved: {
          type: 'object',
          properties: {
            logsArchived: { type: 'boolean' },
            metricsArchived: { type: 'boolean' }
          }
        },
        productionHealth: {
          type: 'object',
          properties: {
            healthy: { type: 'boolean' },
            servingTraffic: { type: 'boolean' }
          }
        },
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              sent: { type: 'boolean' }
            }
          }
        },
        incidentReport: {
          type: 'object',
          properties: {
            incidentId: { type: 'string' },
            severity: { type: 'string' },
            reportPath: { type: 'string' }
          }
        },
        systemStable: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'rollback', 'incident-response']
}));

// Task 4.1: Canary Promotion
export const canaryPromotionTask = defineTask('canary-promotion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Promote canary to production - ${args.modelVersion}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Release Engineer with expertise in production deployments',
      task: 'Promote canary to full production after successful validation',
      context: {
        targetEnvironment: args.targetEnvironment,
        canaryEndpoint: args.canaryEndpoint,
        modelVersion: args.modelVersion,
        canaryHistory: args.canaryHistory
      },
      instructions: [
        '1. Finalize traffic shift to 100% canary',
        '2. Update production endpoint to point to new model version',
        '3. Decommission old production instances gracefully',
        '4. Update deployment metadata and version tags',
        '5. Update model registry with production deployment status',
        '6. Configure production monitoring to track new version',
        '7. Remove canary-specific labels and promote to production',
        '8. Verify all production traffic is served by new version',
        '9. Record promotion timestamp and details',
        '10. Archive old model version with rollback capability'
      ],
      outputFormat: 'JSON object with promotion results and production status'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'promotedAt'],
      properties: {
        success: { type: 'boolean' },
        promotedAt: { type: 'string' },
        modelVersion: { type: 'string' },
        productionEndpoint: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            version: { type: 'string' },
            servingTraffic: { type: 'number' }
          }
        },
        oldVersionDecommissioned: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            status: { type: 'string' },
            archived: { type: 'boolean' }
          }
        },
        modelRegistry: {
          type: 'object',
          properties: {
            updated: { type: 'boolean' },
            productionVersion: { type: 'string' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            trackingNewVersion: { type: 'boolean' }
          }
        },
        verification: {
          type: 'object',
          properties: {
            allTrafficOnNewVersion: { type: 'boolean' },
            healthCheckPassed: { type: 'boolean' }
          }
        },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'promotion', 'production']
}));

// Task 4.2: Post-Deployment Validation
export const postDeploymentValidationTask = defineTask('post-deployment-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-deployment validation - ${args.modelVersion}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer with expertise in production validation',
      task: 'Validate model behavior in production after full deployment',
      context: {
        targetEnvironment: args.targetEnvironment,
        modelVersion: args.modelVersion,
        deploymentEndpoint: args.deploymentEndpoint,
        expectedBehavior: args.expectedBehavior
      },
      instructions: [
        '1. Run smoke tests against production endpoint',
        '2. Verify model returns expected predictions for test cases',
        '3. Check API response format and schema compliance',
        '4. Validate latency is within acceptable range',
        '5. Verify error handling and edge cases',
        '6. Check integration with downstream systems',
        '7. Validate logging and monitoring are working',
        '8. Run end-to-end test scenarios',
        '9. Verify model metadata is correctly exposed',
        '10. Confirm all health checks are passing'
      ],
      outputFormat: 'JSON object with validation results and any issues found'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'testsPassed'],
      properties: {
        valid: { type: 'boolean' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        validationResults: {
          type: 'object',
          properties: {
            smokeTests: { type: 'boolean' },
            predictionAccuracy: { type: 'boolean' },
            apiCompliance: { type: 'boolean' },
            latencyAcceptable: { type: 'boolean' },
            errorHandling: { type: 'boolean' },
            integrations: { type: 'boolean' },
            monitoring: { type: 'boolean' },
            endToEnd: { type: 'boolean' },
            healthChecks: { type: 'boolean' }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            avgLatencyMs: { type: 'number' },
            successRate: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'validation', 'post-deployment']
}));

// Task 4.3: Canary Cleanup
export const canaryCleanupTask = defineTask('canary-cleanup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cleanup canary infrastructure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Infrastructure Engineer with expertise in resource management',
      task: 'Cleanup canary infrastructure while preserving logs and metrics',
      context: {
        targetEnvironment: args.targetEnvironment,
        canaryEndpoint: args.canaryEndpoint,
        retainLogs: args.retainLogs,
        retainMetrics: args.retainMetrics
      },
      instructions: [
        '1. Archive canary logs to long-term storage',
        '2. Archive canary metrics and performance data',
        '3. Shutdown canary compute resources',
        '4. Remove canary service configurations',
        '5. Delete canary routing rules from load balancer',
        '6. Remove temporary canary-specific resources',
        '7. Clean up monitoring dashboards (or archive them)',
        '8. Remove canary-specific alerts',
        '9. Document cleanup actions and archived resources',
        '10. Verify no orphaned resources remain'
      ],
      outputFormat: 'JSON object with cleanup results and archived resources'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'resourcesRemoved'],
      properties: {
        completed: { type: 'boolean' },
        completedAt: { type: 'string' },
        archived: {
          type: 'object',
          properties: {
            logs: {
              type: 'object',
              properties: {
                archived: { type: 'boolean' },
                location: { type: 'string' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                archived: { type: 'boolean' },
                location: { type: 'string' }
              }
            }
          }
        },
        resourcesRemoved: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceType: { type: 'string' },
              resourceId: { type: 'string' },
              removed: { type: 'boolean' }
            }
          }
        },
        monitoringCleanup: {
          type: 'object',
          properties: {
            dashboardsArchived: { type: 'boolean' },
            alertsRemoved: { type: 'boolean' }
          }
        },
        verification: {
          type: 'object',
          properties: {
            noOrphanedResources: { type: 'boolean' }
          }
        },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'cleanup', 'post-deployment']
}));

// Task 4.4: Deployment Report Generation
export const deploymentReportGenerationTask = defineTask('deployment-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate deployment report - ${args.modelVersion}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Deployment Analyst',
      task: 'Generate comprehensive deployment report for audit and documentation',
      context: {
        modelVersion: args.modelVersion,
        targetEnvironment: args.targetEnvironment,
        canaryHistory: args.canaryHistory,
        baselineMetrics: args.baselineMetrics,
        finalMetrics: args.finalMetrics,
        promotionResult: args.promotionResult,
        cleanup: args.cleanup
      },
      instructions: [
        '1. Create executive summary of deployment',
        '2. Document canary strategy and stages (percentages, durations)',
        '3. Present baseline vs final metrics comparison',
        '4. Include health check results for each stage',
        '5. Document any issues or warnings encountered',
        '6. Include promotion and validation results',
        '7. Document performance improvements or regressions',
        '8. Include timeline of deployment events',
        '9. Generate both structured JSON and Markdown report',
        '10. Archive report for compliance and audit'
      ],
      outputFormat: 'JSON object with deployment report paths and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary'],
      properties: {
        reportPath: { type: 'string' },
        markdownReportPath: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            modelVersion: { type: 'string' },
            targetEnvironment: { type: 'string' },
            deploymentStatus: { type: 'string' },
            totalStages: { type: 'number' },
            totalDuration: { type: 'string' },
            healthChecksPassed: { type: 'number' },
            healthChecksFailed: { type: 'number' }
          }
        },
        metricsComparison: {
          type: 'object',
          properties: {
            latencyImprovement: { type: 'string' },
            errorRateChange: { type: 'string' },
            throughputChange: { type: 'string' }
          }
        },
        stagesTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'number' },
              percentage: { type: 'number' },
              timestamp: { type: 'string' },
              healthStatus: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        issuesEncountered: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-deployment', 'canary', 'reporting', 'documentation']
}));

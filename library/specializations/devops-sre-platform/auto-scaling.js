/**
 * @process specializations/devops-sre-platform/auto-scaling
 * @description Auto-Scaling Configuration - Comprehensive workflow for implementing production-grade auto-scaling
 * solutions including Horizontal Pod Autoscaler (HPA), Vertical Pod Autoscaler (VPA), Cluster Autoscaler,
 * custom metrics-based scaling, predictive scaling, load testing validation, and capacity planning.
 * Covers both Kubernetes and VM-based infrastructure with cloud provider integrations.
 * @inputs { projectName: string, infrastructure: string, scalingStrategy?: string, targetMetrics?: object }
 * @outputs { success: boolean, scalingScore: number, scalers: array, policies: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/auto-scaling', {
 *   projectName: 'E-commerce Platform',
 *   infrastructure: 'kubernetes', // 'kubernetes', 'vm', 'serverless', 'hybrid'
 *   scalingStrategy: 'reactive', // 'reactive', 'predictive', 'scheduled', 'hybrid'
 *   services: ['api-gateway', 'payment-service', 'order-service'],
 *   targetMetrics: {
 *     cpuUtilization: 70,
 *     memoryUtilization: 80,
 *     requestsPerSecond: 1000,
 *     responseTime: 200
 *   },
 *   cloudProvider: 'aws', // 'aws', 'gcp', 'azure', 'on-premise'
 *   environment: 'production',
 *   budget: {
 *     maxMonthlyCost: 10000,
 *     maxInstances: 50
 *   }
 * });
 *
 * @references
 * - Kubernetes HPA: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
 * - Kubernetes VPA: https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler
 * - Cluster Autoscaler: https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler
 * - AWS Auto Scaling: https://docs.aws.amazon.com/autoscaling/
 * - GCP Autoscaling: https://cloud.google.com/compute/docs/autoscaler
 * - Azure Autoscale: https://docs.microsoft.com/en-us/azure/azure-monitor/autoscale/
 * - KEDA: https://keda.sh/docs/
 * - Karpenter: https://karpenter.sh/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    infrastructure = 'kubernetes', // 'kubernetes', 'vm', 'serverless', 'hybrid'
    scalingStrategy = 'reactive', // 'reactive', 'predictive', 'scheduled', 'hybrid'
    services = [],
    targetMetrics = {
      cpuUtilization: 70,
      memoryUtilization: 80,
      requestsPerSecond: 1000,
      responseTime: 200,
      customMetrics: []
    },
    cloudProvider = 'aws', // 'aws', 'gcp', 'azure', 'on-premise'
    environment = 'production',
    budget = {
      maxMonthlyCost: 10000,
      maxInstances: 50,
      minInstances: 2
    },
    enableHPA = true,
    enableVPA = false,
    enableClusterAutoscaler = true,
    enableCustomMetrics = true,
    enablePredictiveScaling = false,
    scalingPolicies = {
      scaleUpCooldown: 60, // seconds
      scaleDownCooldown: 300, // seconds
      scaleUpStabilization: 60, // seconds
      scaleDownStabilization: 300 // seconds
    },
    outputDir = 'auto-scaling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let scalingScore = 0;
  const scalers = [];
  const policies = [];
  const validationResults = [];

  ctx.log('info', `Starting Auto-Scaling Configuration for ${projectName}`);
  ctx.log('info', `Infrastructure: ${infrastructure}, Strategy: ${scalingStrategy}, Environment: ${environment}`);
  ctx.log('info', `Target CPU: ${targetMetrics.cpuUtilization}%, Memory: ${targetMetrics.memoryUtilization}%`);

  // ============================================================================
  // PHASE 1: ANALYZE WORKLOAD CHARACTERISTICS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing workload characteristics and scaling requirements');

  const workloadAnalysis = await ctx.task(analyzeWorkloadTask, {
    projectName,
    infrastructure,
    services,
    environment,
    cloudProvider,
    outputDir
  });

  if (!workloadAnalysis.success) {
    return {
      success: false,
      error: 'Failed to analyze workload characteristics',
      details: workloadAnalysis,
      metadata: {
        processId: 'specializations/devops-sre-platform/auto-scaling',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...workloadAnalysis.artifacts);

  ctx.log('info', `Workload analysis complete - ${workloadAnalysis.services.length} services analyzed`);
  ctx.log('info', `Workload patterns: ${workloadAnalysis.patterns.join(', ')}`);

  // Quality Gate: Workload analysis review
  await ctx.breakpoint({
    question: `Phase 1 Review: Analyzed ${workloadAnalysis.services.length} services. Workload patterns identified: ${workloadAnalysis.patterns.join(', ')}. Recommended scaling strategy: ${workloadAnalysis.recommendedStrategy}. Approve?`,
    title: 'Workload Analysis Review',
    context: {
      runId: ctx.runId,
      workloadAnalysis: {
        servicesCount: workloadAnalysis.services.length,
        patterns: workloadAnalysis.patterns,
        peakLoad: workloadAnalysis.peakLoad,
        baselineLoad: workloadAnalysis.baselineLoad,
        recommendedStrategy: workloadAnalysis.recommendedStrategy
      },
      files: [{
        path: `${outputDir}/phase1-workload-analysis.json`,
        format: 'json',
        content: JSON.stringify(workloadAnalysis, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 2: CONFIGURE HORIZONTAL POD AUTOSCALER (HPA)
  // ============================================================================

  if (enableHPA && infrastructure === 'kubernetes') {
    ctx.log('info', 'Phase 2: Configuring Horizontal Pod Autoscaler (HPA)');

    const hpaConfig = await ctx.task(configureHPATask, {
      projectName,
      services: workloadAnalysis.services,
      targetMetrics,
      scalingPolicies,
      environment,
      outputDir
    });

    if (!hpaConfig.success) {
      return {
        success: false,
        error: 'Failed to configure HPA',
        details: hpaConfig,
        metadata: {
          processId: 'specializations/devops-sre-platform/auto-scaling',
          timestamp: startTime
        }
      };
    }

    artifacts.push(...hpaConfig.artifacts);
    scalers.push(...hpaConfig.scalers);
    policies.push(...hpaConfig.policies);

    ctx.log('info', `HPA configured - ${hpaConfig.scalers.length} HPA resources created`);
  }

  // ============================================================================
  // PHASE 3: CONFIGURE VERTICAL POD AUTOSCALER (VPA)
  // ============================================================================

  if (enableVPA && infrastructure === 'kubernetes') {
    ctx.log('info', 'Phase 3: Configuring Vertical Pod Autoscaler (VPA)');

    const vpaConfig = await ctx.task(configureVPATask, {
      projectName,
      services: workloadAnalysis.services,
      targetMetrics,
      environment,
      outputDir
    });

    if (!vpaConfig.success) {
      ctx.log('warn', 'VPA configuration failed, but continuing');
    } else {
      artifacts.push(...vpaConfig.artifacts);
      scalers.push(...vpaConfig.scalers);
      policies.push(...vpaConfig.policies);

      ctx.log('info', `VPA configured - ${vpaConfig.scalers.length} VPA resources created`);
    }
  }

  // ============================================================================
  // PHASE 4: CONFIGURE CLUSTER AUTOSCALER
  // ============================================================================

  if (enableClusterAutoscaler && infrastructure === 'kubernetes') {
    ctx.log('info', 'Phase 4: Configuring Cluster Autoscaler');

    const clusterAutoscalerConfig = await ctx.task(configureClusterAutoscalerTask, {
      projectName,
      cloudProvider,
      budget,
      workloadAnalysis,
      environment,
      outputDir
    });

    if (!clusterAutoscalerConfig.success) {
      return {
        success: false,
        error: 'Failed to configure Cluster Autoscaler',
        details: clusterAutoscalerConfig,
        metadata: {
          processId: 'specializations/devops-sre-platform/auto-scaling',
          timestamp: startTime
        }
      };
    }

    artifacts.push(...clusterAutoscalerConfig.artifacts);
    scalers.push(clusterAutoscalerConfig.scaler);
    policies.push(...clusterAutoscalerConfig.policies);

    ctx.log('info', `Cluster Autoscaler configured - Min nodes: ${clusterAutoscalerConfig.minNodes}, Max nodes: ${clusterAutoscalerConfig.maxNodes}`);

    // Quality Gate: Cluster Autoscaler review
    await ctx.breakpoint({
      question: `Phase 4 Review: Cluster Autoscaler configured with min nodes: ${clusterAutoscalerConfig.minNodes}, max nodes: ${clusterAutoscalerConfig.maxNodes}. Estimated max cost: $${clusterAutoscalerConfig.estimatedMaxMonthlyCost}/month. Approve?`,
      title: 'Cluster Autoscaler Configuration Review',
      context: {
        runId: ctx.runId,
        clusterAutoscaler: {
          minNodes: clusterAutoscalerConfig.minNodes,
          maxNodes: clusterAutoscalerConfig.maxNodes,
          nodeGroups: clusterAutoscalerConfig.nodeGroups,
          estimatedMaxMonthlyCost: clusterAutoscalerConfig.estimatedMaxMonthlyCost
        },
        files: [{
          path: `${outputDir}/phase4-cluster-autoscaler-config.json`,
          format: 'json',
          content: JSON.stringify(clusterAutoscalerConfig, null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 5: CONFIGURE VM AUTO SCALING (IF APPLICABLE)
  // ============================================================================

  if (infrastructure === 'vm' || infrastructure === 'hybrid') {
    ctx.log('info', 'Phase 5: Configuring VM Auto Scaling');

    const vmAutoscalingConfig = await ctx.task(configureVMAutoscalingTask, {
      projectName,
      cloudProvider,
      services: workloadAnalysis.services,
      targetMetrics,
      scalingPolicies,
      budget,
      environment,
      outputDir
    });

    if (!vmAutoscalingConfig.success) {
      ctx.log('warn', 'VM auto-scaling configuration failed, but continuing');
    } else {
      artifacts.push(...vmAutoscalingConfig.artifacts);
      scalers.push(...vmAutoscalingConfig.scalers);
      policies.push(...vmAutoscalingConfig.policies);

      ctx.log('info', `VM auto-scaling configured - ${vmAutoscalingConfig.scalers.length} auto-scaling groups created`);
    }
  }

  // ============================================================================
  // PHASE 6: CONFIGURE CUSTOM METRICS-BASED SCALING
  // ============================================================================

  if (enableCustomMetrics && targetMetrics.customMetrics && targetMetrics.customMetrics.length > 0) {
    ctx.log('info', 'Phase 6: Configuring custom metrics-based scaling');

    const customMetricsConfig = await ctx.task(configureCustomMetricsScalingTask, {
      projectName,
      infrastructure,
      services: workloadAnalysis.services,
      customMetrics: targetMetrics.customMetrics,
      scalingPolicies,
      environment,
      outputDir
    });

    if (!customMetricsConfig.success) {
      ctx.log('warn', 'Custom metrics scaling configuration failed, but continuing');
    } else {
      artifacts.push(...customMetricsConfig.artifacts);
      scalers.push(...customMetricsConfig.scalers);
      policies.push(...customMetricsConfig.policies);

      ctx.log('info', `Custom metrics scaling configured - ${customMetricsConfig.scalers.length} custom metric scalers created`);
    }
  }

  // ============================================================================
  // PHASE 7: IMPLEMENT PREDICTIVE SCALING (IF ENABLED)
  // ============================================================================

  if (enablePredictiveScaling && (scalingStrategy === 'predictive' || scalingStrategy === 'hybrid')) {
    ctx.log('info', 'Phase 7: Implementing predictive scaling');

    const predictiveScalingConfig = await ctx.task(configurePredictiveScalingTask, {
      projectName,
      infrastructure,
      cloudProvider,
      workloadAnalysis,
      services: workloadAnalysis.services,
      environment,
      outputDir
    });

    if (!predictiveScalingConfig.success) {
      ctx.log('warn', 'Predictive scaling configuration failed, but continuing');
    } else {
      artifacts.push(...predictiveScalingConfig.artifacts);
      scalers.push(...predictiveScalingConfig.scalers);
      policies.push(...predictiveScalingConfig.policies);

      ctx.log('info', `Predictive scaling configured - ${predictiveScalingConfig.scalers.length} predictive scalers created`);
    }
  }

  // ============================================================================
  // PHASE 8: CONFIGURE SCALING POLICIES AND LIMITS
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring scaling policies and resource limits');

  const policiesConfig = await ctx.task(configureScalingPoliciesTask, {
    projectName,
    infrastructure,
    services: workloadAnalysis.services,
    scalingPolicies,
    budget,
    scalers,
    environment,
    outputDir
  });

  if (!policiesConfig.success) {
    return {
      success: false,
      error: 'Failed to configure scaling policies',
      details: policiesConfig,
      metadata: {
        processId: 'specializations/devops-sre-platform/auto-scaling',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...policiesConfig.artifacts);
  policies.push(...policiesConfig.policies);

  ctx.log('info', `Scaling policies configured - ${policiesConfig.policies.length} policies created`);

  // ============================================================================
  // PHASE 9: SET UP SCALING MONITORING AND ALERTS
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up scaling monitoring and alerts');

  const monitoringConfig = await ctx.task(setupScalingMonitoringTask, {
    projectName,
    infrastructure,
    services: workloadAnalysis.services,
    scalers,
    policies,
    targetMetrics,
    environment,
    outputDir
  });

  if (!monitoringConfig.success) {
    ctx.log('warn', 'Scaling monitoring setup failed, but continuing');
  } else {
    artifacts.push(...monitoringConfig.artifacts);

    ctx.log('info', `Scaling monitoring configured - ${monitoringConfig.dashboards.length} dashboards, ${monitoringConfig.alerts.length} alerts created`);
  }

  // Quality Gate: Monitoring review
  await ctx.breakpoint({
    question: `Phase 9 Review: Scaling monitoring configured with ${monitoringConfig.dashboards.length} dashboards and ${monitoringConfig.alerts.length} alerts. Review monitoring setup?`,
    title: 'Scaling Monitoring Review',
    context: {
      runId: ctx.runId,
      monitoring: {
        dashboards: monitoringConfig.dashboards.map(d => d.name),
        alerts: monitoringConfig.alerts.map(a => a.name),
        metricsCollected: monitoringConfig.metricsCollected
      },
      files: [{
        path: `${outputDir}/phase9-monitoring-config.json`,
        format: 'json',
        content: JSON.stringify(monitoringConfig, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 10: CONDUCT LOAD TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Conducting load testing to validate auto-scaling');

  const loadTestingResult = await ctx.task(conductLoadTestingTask, {
    projectName,
    infrastructure,
    services: workloadAnalysis.services,
    scalers,
    targetMetrics,
    environment,
    outputDir
  });

  if (!loadTestingResult.success) {
    ctx.log('warn', 'Load testing validation encountered issues');

    await ctx.breakpoint({
      question: `Phase 10 Alert: Load testing validation encountered ${loadTestingResult.failedTests} failed tests. Issues: ${loadTestingResult.issues.length}. Review before proceeding?`,
      title: 'Load Testing Validation Failed',
      context: {
        runId: ctx.runId,
        loadTesting: {
          testsPassed: loadTestingResult.testsPassed,
          testsFailed: loadTestingResult.failedTests,
          issues: loadTestingResult.issues
        },
        files: [{
          path: `${outputDir}/phase10-load-testing-report.json`,
          format: 'json',
          content: JSON.stringify(loadTestingResult, null, 2)
        }]
      }
    });
  }

  artifacts.push(...loadTestingResult.artifacts);
  validationResults.push(loadTestingResult);

  ctx.log('info', `Load testing complete - ${loadTestingResult.testsPassed}/${loadTestingResult.testsTotal} tests passed`);

  // ============================================================================
  // PHASE 11: CAPACITY PLANNING AND COST OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Conducting capacity planning and cost optimization');

  const capacityPlanningResult = await ctx.task(conductCapacityPlanningTask, {
    projectName,
    infrastructure,
    workloadAnalysis,
    scalers,
    policies,
    budget,
    loadTestingResult,
    cloudProvider,
    environment,
    outputDir
  });

  if (!capacityPlanningResult.success) {
    return {
      success: false,
      error: 'Failed to complete capacity planning',
      details: capacityPlanningResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/auto-scaling',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...capacityPlanningResult.artifacts);

  ctx.log('info', `Capacity planning complete - Estimated baseline cost: $${capacityPlanningResult.baselineCost}/month, Peak cost: $${capacityPlanningResult.peakCost}/month`);

  // Quality Gate: Cost review
  if (capacityPlanningResult.peakCost > budget.maxMonthlyCost) {
    await ctx.breakpoint({
      question: `Phase 11 Alert: Estimated peak cost $${capacityPlanningResult.peakCost}/month exceeds budget $${budget.maxMonthlyCost}/month. Review capacity plan and adjust limits?`,
      title: 'Cost Budget Exceeded',
      context: {
        runId: ctx.runId,
        capacityPlanning: {
          baselineCost: capacityPlanningResult.baselineCost,
          peakCost: capacityPlanningResult.peakCost,
          budgetLimit: budget.maxMonthlyCost,
          recommendations: capacityPlanningResult.recommendations
        },
        files: [{
          path: `${outputDir}/phase11-capacity-planning.json`,
          format: 'json',
          content: JSON.stringify(capacityPlanningResult, null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 12: GENERATE DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating auto-scaling documentation and runbooks');

  const documentationResult = await ctx.task(generateScalingDocumentationTask, {
    projectName,
    infrastructure,
    scalingStrategy,
    workloadAnalysis,
    scalers,
    policies,
    monitoringConfig,
    capacityPlanningResult,
    cloudProvider,
    outputDir
  });

  if (!documentationResult.success) {
    ctx.log('warn', 'Documentation generation failed, but continuing');
  } else {
    artifacts.push(...documentationResult.artifacts);
  }

  // ============================================================================
  // FINAL SCORING AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Calculating auto-scaling configuration score');

  const scoringResult = await ctx.task(calculateScalingScoreTask, {
    projectName,
    infrastructure,
    scalingStrategy,
    scalers,
    policies,
    loadTestingResult,
    capacityPlanningResult,
    outputDir
  });

  scalingScore = scoringResult.scalingScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `Auto-Scaling Score: ${scalingScore}/100`);

  // Final Breakpoint: Auto-scaling setup complete
  const qualityThreshold = environment === 'production' ? 85 : 75;

  await ctx.breakpoint({
    question: `Final Review: Auto-Scaling Configuration complete for ${projectName}. Score: ${scalingScore}/100 (threshold: ${qualityThreshold}). ${scalers.length} scalers configured, ${policies.length} policies created. Ready to deploy?`,
    title: 'Final Auto-Scaling Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        infrastructure,
        scalingStrategy,
        scalingScore,
        qualityThreshold,
        scalersConfigured: scalers.length,
        policiesCreated: policies.length,
        estimatedBaselineCost: capacityPlanningResult.baselineCost,
        estimatedPeakCost: capacityPlanningResult.peakCost,
        loadTestingPassed: loadTestingResult.testsPassed === loadTestingResult.testsTotal
      },
      scalingConfiguration: {
        hpaEnabled: enableHPA && scalers.some(s => s.type === 'hpa'),
        vpaEnabled: enableVPA && scalers.some(s => s.type === 'vpa'),
        clusterAutoscalerEnabled: enableClusterAutoscaler && scalers.some(s => s.type === 'cluster-autoscaler'),
        customMetricsEnabled: enableCustomMetrics && scalers.some(s => s.type === 'custom-metrics'),
        predictiveScalingEnabled: enablePredictiveScaling && scalers.some(s => s.type === 'predictive')
      },
      verdict: scoringResult.verdict,
      recommendation: scoringResult.recommendation,
      files: [
        {
          path: `${outputDir}/auto-scaling-summary.json`,
          format: 'json',
          content: JSON.stringify({
            scalers,
            policies,
            capacityPlanningResult,
            scalingScore
          }, null, 2)
        },
        {
          path: documentationResult.runbookPath,
          format: 'markdown',
          content: documentationResult.runbook || 'Runbook generation pending'
        }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Auto-Scaling Configuration completed in ${duration}ms`);
  ctx.log('info', `Scalers configured: ${scalers.length}`);
  ctx.log('info', `Policies created: ${policies.length}`);
  ctx.log('info', `Scaling Score: ${scalingScore}/100`);

  return {
    success: true,
    projectName,
    infrastructure,
    scalingStrategy,
    scalingScore,
    qualityThreshold,
    scalers: scalers.map(s => ({
      name: s.name,
      type: s.type,
      service: s.service,
      minReplicas: s.minReplicas,
      maxReplicas: s.maxReplicas,
      targetMetrics: s.targetMetrics
    })),
    policies: policies.map(p => ({
      name: p.name,
      type: p.type,
      scaler: p.scaler,
      configuration: p.configuration
    })),
    capacityPlanning: {
      baselineCost: capacityPlanningResult.baselineCost,
      peakCost: capacityPlanningResult.peakCost,
      baselineInstances: capacityPlanningResult.baselineInstances,
      peakInstances: capacityPlanningResult.peakInstances,
      recommendations: capacityPlanningResult.recommendations
    },
    monitoring: {
      dashboards: monitoringConfig.dashboards.map(d => ({
        name: d.name,
        url: d.url,
        type: d.type
      })),
      alerts: monitoringConfig.alerts.map(a => ({
        name: a.name,
        severity: a.severity,
        condition: a.condition
      }))
    },
    validation: {
      loadTestingPassed: loadTestingResult.testsPassed === loadTestingResult.testsTotal,
      testsPassed: loadTestingResult.testsPassed,
      testsFailed: loadTestingResult.failedTests,
      testsTotal: loadTestingResult.testsTotal,
      issues: loadTestingResult.issues
    },
    artifacts,
    documentation: {
      runbookPath: documentationResult.runbookPath,
      architecturePath: documentationResult.architecturePath,
      summaryPath: scoringResult.summaryPath
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/auto-scaling',
      processSlug: 'auto-scaling',
      category: 'devops-sre-platform',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const analyzeWorkloadTask = defineTask('analyze-workload', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Workload Characteristics: ${args.projectName}`,
  agent: {
    name: 'workload-analyst',
    prompt: {
      role: 'SRE Workload Analysis Specialist',
      task: 'Analyze workload characteristics and scaling requirements',
      context: args,
      instructions: [
        'Analyze each service/application for workload characteristics',
        'Identify workload patterns:',
        '  - Steady state: Consistent load',
        '  - Periodic: Predictable daily/weekly patterns',
        '  - Seasonal: Predictable monthly/yearly patterns',
        '  - Bursty: Unpredictable traffic spikes',
        '  - Event-driven: Traffic triggered by specific events',
        'Determine baseline resource requirements (CPU, memory, network)',
        'Determine peak resource requirements',
        'Identify resource constraints and bottlenecks',
        'Analyze historical metrics if available',
        'Calculate growth trends and projections',
        'Identify services suitable for horizontal vs vertical scaling',
        'Recommend optimal scaling strategy (reactive/predictive/scheduled)',
        'Document workload profiles for each service',
        'Create workload analysis report'
      ],
      outputFormat: 'JSON with success, services (with workload profiles), patterns, peakLoad, baselineLoad, recommendedStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'services', 'patterns', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              workloadType: { type: 'string' },
              baselineCPU: { type: 'number' },
              baselineMemory: { type: 'number' },
              peakCPU: { type: 'number' },
              peakMemory: { type: 'number' },
              scalingType: { type: 'string', enum: ['horizontal', 'vertical', 'both'] },
              patterns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        patterns: { type: 'array', items: { type: 'string' } },
        peakLoad: { type: 'object' },
        baselineLoad: { type: 'object' },
        recommendedStrategy: { type: 'string' },
        growthTrend: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'workload-analysis', args.infrastructure]
}));

export const configureHPATask = defineTask('configure-hpa', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Horizontal Pod Autoscaler: ${args.projectName}`,
  agent: {
    name: 'kubernetes-scaling-engineer',
    prompt: {
      role: 'Kubernetes Autoscaling Specialist',
      task: 'Configure Horizontal Pod Autoscaler (HPA) for services',
      context: args,
      instructions: [
        'For each service, create HPA configuration:',
        '  - Set minReplicas based on baseline requirements',
        '  - Set maxReplicas based on peak requirements and budget',
        '  - Configure target CPU utilization (default 70%)',
        '  - Configure target memory utilization (default 80%)',
        '  - Add custom metrics if applicable (requests/sec, response time)',
        'Configure HPA behavior policies:',
        '  - Scale-up behavior: stabilization window, scale-up policies',
        '  - Scale-down behavior: stabilization window, scale-down policies',
        '  - Prevent flapping with cooldown periods',
        'Set resource requests and limits for accurate scaling',
        'Configure metrics server if not already present',
        'For custom metrics, integrate with Prometheus Adapter or KEDA',
        'Generate HPA YAML manifests',
        'Test HPA configuration with kubectl dry-run',
        'Document HPA scaling logic and thresholds',
        'Create HPA troubleshooting guide'
      ],
      outputFormat: 'JSON with success, scalers (HPA configs), policies, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scalers', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scalers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['hpa'] },
              service: { type: 'string' },
              minReplicas: { type: 'number' },
              maxReplicas: { type: 'number' },
              targetMetrics: { type: 'array' },
              currentReplicas: { type: 'number' }
            }
          }
        },
        policies: { type: 'array' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'hpa', 'kubernetes']
}));

export const configureVPATask = defineTask('configure-vpa', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Vertical Pod Autoscaler: ${args.projectName}`,
  agent: {
    name: 'kubernetes-vpa-engineer',
    prompt: {
      role: 'Kubernetes VPA Specialist',
      task: 'Configure Vertical Pod Autoscaler (VPA) for services',
      context: args,
      instructions: [
        'Install VPA components if not already present (recommender, updater, admission controller)',
        'For each service suitable for vertical scaling:',
        '  - Create VPA configuration',
        '  - Set update mode (Off/Initial/Recreate/Auto)',
        '  - Configure resource policy (min/max allowed, controlled resources)',
        '  - Set update policy (eviction requirements)',
        'Identify services that should NOT use VPA:',
        '  - Services already using HPA (conflict)',
        '  - Stateful services sensitive to restarts',
        '  - Services requiring zero downtime',
        'For recommendation-only mode, set updateMode: Off',
        'Configure VPA to work alongside HPA (if both enabled):',
        '  - VPA manages CPU/memory requests',
        '  - HPA manages replica count',
        'Generate VPA YAML manifests',
        'Document VPA recommendations and right-sizing strategy',
        'Create VPA monitoring and review process'
      ],
      outputFormat: 'JSON with success, scalers (VPA configs), policies, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scalers', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scalers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['vpa'] },
              service: { type: 'string' },
              updateMode: { type: 'string', enum: ['Off', 'Initial', 'Recreate', 'Auto'] },
              minAllowed: { type: 'object' },
              maxAllowed: { type: 'object' }
            }
          }
        },
        policies: { type: 'array' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'vpa', 'kubernetes']
}));

export const configureClusterAutoscalerTask = defineTask('configure-cluster-autoscaler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Cluster Autoscaler: ${args.projectName}`,
  agent: {
    name: 'cluster-autoscaling-engineer',
    prompt: {
      role: 'Cluster Autoscaling Expert',
      task: 'Configure Cluster Autoscaler or Karpenter for node scaling',
      context: args,
      instructions: [
        'Choose autoscaling solution:',
        '  - Cluster Autoscaler: Standard, works with all cloud providers',
        '  - Karpenter: AWS-specific, faster provisioning, more flexible',
        'Design node groups/pools:',
        '  - General purpose nodes for standard workloads',
        '  - High-memory nodes for memory-intensive workloads',
        '  - GPU nodes for ML/compute workloads (if needed)',
        '  - Spot/preemptible instances for cost savings',
        'Configure Cluster Autoscaler:',
        '  - Set min/max nodes per node group',
        '  - Configure scale-down delay and threshold',
        '  - Set scale-down utilization threshold (default 50%)',
        '  - Configure skip-nodes-with annotations',
        '  - Enable scale-down for empty nodes',
        'Configure cloud provider auto-scaling groups:',
        '  - AWS: ASG with tags for cluster autoscaler',
        '  - GCP: MIG with autoscaling enabled',
        '  - Azure: VMSS with autoscale rules',
        'Set Pod Disruption Budgets to prevent excessive scale-down',
        'Calculate estimated costs for min and max scaling',
        'Generate IaC for cluster autoscaler deployment',
        'Document node scaling behavior and troubleshooting'
      ],
      outputFormat: 'JSON with success, scaler, policies, minNodes, maxNodes, nodeGroups, estimatedMaxMonthlyCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scaler', 'policies', 'minNodes', 'maxNodes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scaler: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['cluster-autoscaler', 'karpenter'] },
            minNodes: { type: 'number' },
            maxNodes: { type: 'number' }
          }
        },
        policies: { type: 'array' },
        minNodes: { type: 'number' },
        maxNodes: { type: 'number' },
        nodeGroups: { type: 'array' },
        estimatedMinMonthlyCost: { type: 'number' },
        estimatedMaxMonthlyCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'cluster-autoscaler', 'kubernetes', args.cloudProvider]
}));

export const configureVMAutoscalingTask = defineTask('configure-vm-autoscaling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure VM Auto Scaling: ${args.projectName}`,
  agent: {
    name: 'vm-autoscaling-engineer',
    prompt: {
      role: 'VM Auto Scaling Specialist',
      task: 'Configure virtual machine auto-scaling for cloud provider',
      context: args,
      instructions: [
        'Configure cloud provider auto-scaling groups:',
        'AWS:',
        '  - Create Auto Scaling Groups (ASG)',
        '  - Configure launch templates with AMI',
        '  - Set min/max/desired capacity',
        '  - Create scaling policies (target tracking, step scaling, simple scaling)',
        '  - Configure CloudWatch alarms for scaling triggers',
        '  - Set cooldown periods',
        'GCP:',
        '  - Create Managed Instance Groups (MIG)',
        '  - Configure instance templates',
        '  - Enable autoscaling based on CPU, load balancer, custom metrics',
        '  - Set min/max instances',
        '  - Configure scale-in controls',
        'Azure:',
        '  - Create Virtual Machine Scale Sets (VMSS)',
        '  - Configure autoscale rules based on metrics',
        '  - Set instance limits',
        '  - Configure scale-out and scale-in rules',
        'Configure health checks and instance replacement',
        'Set up load balancer integration',
        'Configure instance warmup time',
        'Generate IaC (Terraform/CloudFormation) for autoscaling groups',
        'Document VM scaling configuration'
      ],
      outputFormat: 'JSON with success, scalers (ASG/MIG/VMSS configs), policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scalers', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scalers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['asg', 'mig', 'vmss'] },
              service: { type: 'string' },
              minInstances: { type: 'number' },
              maxInstances: { type: 'number' },
              targetMetrics: { type: 'array' }
            }
          }
        },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'vm', args.cloudProvider]
}));

export const configureCustomMetricsScalingTask = defineTask('configure-custom-metrics-scaling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Custom Metrics Scaling: ${args.projectName}`,
  agent: {
    name: 'custom-metrics-engineer',
    prompt: {
      role: 'Custom Metrics Autoscaling Specialist',
      task: 'Configure autoscaling based on custom application metrics',
      context: args,
      instructions: [
        'Identify custom metrics for scaling:',
        '  - Application metrics: queue depth, pending jobs, active connections',
        '  - Business metrics: orders/sec, transactions/sec, active users',
        '  - External metrics: third-party service metrics',
        'For Kubernetes, implement custom metrics scaling:',
        '  - Option 1: Prometheus Adapter',
        '    * Deploy Prometheus Adapter',
        '    * Configure custom metrics API',
        '    * Map Prometheus metrics to Kubernetes metrics',
        '    * Update HPA to use custom metrics',
        '  - Option 2: KEDA (Kubernetes Event-Driven Autoscaling)',
        '    * Deploy KEDA operator',
        '    * Create ScaledObject resources',
        '    * Configure scalers (Prometheus, Kafka, RabbitMQ, etc.)',
        '    * Set polling interval and cooldown period',
        'For VMs, configure custom CloudWatch/Stackdriver/Azure Monitor metrics',
        'Create custom metric exporters if needed',
        'Define scaling thresholds for custom metrics',
        'Test custom metrics collection and scaling triggers',
        'Generate manifests/IaC for custom metrics scaling',
        'Document custom metrics and scaling logic'
      ],
      outputFormat: 'JSON with success, scalers (custom metric configs), policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scalers', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scalers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['custom-metrics', 'keda'] },
              service: { type: 'string' },
              customMetric: { type: 'string' },
              targetValue: { type: 'number' },
              minReplicas: { type: 'number' },
              maxReplicas: { type: 'number' }
            }
          }
        },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'custom-metrics', args.infrastructure]
}));

export const configurePredictiveScalingTask = defineTask('configure-predictive-scaling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Predictive Scaling: ${args.projectName}`,
  agent: {
    name: 'predictive-scaling-engineer',
    prompt: {
      role: 'Predictive Scaling and ML Specialist',
      task: 'Implement predictive scaling using machine learning and forecasting',
      context: args,
      instructions: [
        'Analyze historical workload data to identify patterns',
        'Implement predictive scaling approaches:',
        '  - AWS Predictive Scaling: Use AWS Auto Scaling predictive scaling',
        '  - Time-based scaling: Schedule scaling for known patterns',
        '  - ML-based forecasting: Custom ML models for demand prediction',
        'For AWS Predictive Scaling:',
        '  - Enable predictive scaling policy',
        '  - Configure forecast algorithm (CPU, network, custom)',
        '  - Set predictive scaling mode (ForecastOnly or ForecastAndScale)',
        '  - Configure scheduling buffer and max capacity',
        'For scheduled scaling:',
        '  - Create scheduled scaling actions',
        '  - Define cron expressions for scale-up/scale-down',
        '  - Account for time zones and daylight saving',
        'For custom ML-based scaling:',
        '  - Collect and store historical metrics',
        '  - Train time-series forecasting model (ARIMA, Prophet, LSTM)',
        '  - Deploy model for real-time predictions',
        '  - Create scaling controller that acts on predictions',
        'Configure lead time for scaling actions (5-15 minutes typical)',
        'Set confidence thresholds for prediction-based scaling',
        'Monitor prediction accuracy and tune models',
        'Document predictive scaling logic and maintenance'
      ],
      outputFormat: 'JSON with success, scalers (predictive configs), policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scalers', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scalers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['predictive', 'scheduled'] },
              service: { type: 'string' },
              predictionMethod: { type: 'string' },
              leadTime: { type: 'number' },
              schedule: { type: 'string' }
            }
          }
        },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'predictive', args.cloudProvider]
}));

export const configureScalingPoliciesTask = defineTask('configure-scaling-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Scaling Policies and Limits: ${args.projectName}`,
  agent: {
    name: 'scaling-policy-engineer',
    prompt: {
      role: 'Auto-Scaling Policy Specialist',
      task: 'Configure comprehensive scaling policies and resource limits',
      context: args,
      instructions: [
        'Configure global scaling policies:',
        '  - Scale-up cooldown period (prevent flapping)',
        '  - Scale-down cooldown period (longer to reduce oscillation)',
        '  - Stabilization windows',
        '  - Scale-up velocity (pods/min or instances/min)',
        '  - Scale-down velocity',
        'Set resource limits:',
        '  - Max total instances/pods across all services',
        '  - Max cost per month',
        '  - Max instances per service',
        '  - Min instances per service (high availability)',
        'Configure Pod Disruption Budgets (Kubernetes):',
        '  - Set minAvailable or maxUnavailable',
        '  - Prevent mass scale-down during maintenance',
        'Create scaling behavior policies:',
        '  - Percent-based scaling (increase by 50%)',
        '  - Fixed scaling (add 2 pods)',
        '  - Hybrid policies',
        'Configure priority-based scaling:',
        '  - Critical services scale first',
        '  - Non-critical services can scale down first',
        'Set up quota management and enforcement',
        'Create policies for emergency scaling scenarios',
        'Define scaling approval workflows if needed',
        'Generate policy configuration files',
        'Document all scaling policies and limits'
      ],
      outputFormat: 'JSON with success, policies (detailed policy configs), limits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'limits', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              scaler: { type: 'string' },
              configuration: { type: 'object' }
            }
          }
        },
        limits: {
          type: 'object',
          properties: {
            maxTotalInstances: { type: 'number' },
            maxMonthlyCost: { type: 'number' },
            minInstances: { type: 'number' }
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
  labels: ['auto-scaling', 'policies', args.infrastructure]
}));

export const setupScalingMonitoringTask = defineTask('setup-scaling-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Scaling Monitoring and Alerts: ${args.projectName}`,
  agent: {
    name: 'scaling-monitoring-engineer',
    prompt: {
      role: 'Auto-Scaling Monitoring Specialist',
      task: 'Set up comprehensive monitoring and alerting for auto-scaling',
      context: args,
      instructions: [
        'Create Grafana dashboards for auto-scaling:',
        '  - HPA Dashboard: Current/desired replicas, scaling events, metrics',
        '  - Cluster Autoscaler Dashboard: Node count, pending pods, scaling events',
        '  - Cost Dashboard: Current spend, projected spend, cost per service',
        '  - Scaling Events Dashboard: Timeline of all scaling actions',
        'Configure key metrics to monitor:',
        '  - Current vs desired replicas/instances',
        '  - Scaling event frequency',
        '  - Time to scale (latency)',
        '  - Resource utilization (before/after scaling)',
        '  - Pod/instance churn rate',
        '  - Pending pods (unschedulable)',
        '  - Cost metrics (current, trend, forecast)',
        'Set up alerts for scaling issues:',
        '  - HPA unable to compute metrics (critical)',
        '  - Reached max replicas/instances (warning)',
        '  - Frequent scaling events (flapping detection)',
        '  - Cluster Autoscaler errors (critical)',
        '  - Pods pending for > 5 minutes (high)',
        '  - Cost exceeds budget threshold (critical)',
        '  - Scale-up failures (high)',
        '  - Abnormal scaling patterns (medium)',
        'Configure log collection for scaling events',
        'Set up tracing for scaling decision pipeline',
        'Create runbooks linked to each alert',
        'Generate dashboard JSON and alert rules',
        'Document monitoring setup and access'
      ],
      outputFormat: 'JSON with success, dashboards, alerts, metricsCollected, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboards', 'alerts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' },
              panels: { type: 'number' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              severity: { type: 'string' },
              condition: { type: 'string' },
              runbookUrl: { type: 'string' }
            }
          }
        },
        metricsCollected: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'monitoring', args.infrastructure]
}));

export const conductLoadTestingTask = defineTask('conduct-load-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Conduct Load Testing for Scaling Validation: ${args.projectName}`,
  agent: {
    name: 'load-testing-engineer',
    prompt: {
      role: 'Performance and Load Testing Specialist',
      task: 'Conduct load testing to validate auto-scaling configuration',
      context: args,
      instructions: [
        'Design load testing scenarios:',
        '  - Baseline load test (steady state)',
        '  - Gradual ramp-up test (slow increase)',
        '  - Spike test (sudden traffic increase)',
        '  - Stress test (beyond max capacity)',
        '  - Soak test (sustained high load)',
        'For each test scenario:',
        '  - Define test parameters (users, RPS, duration)',
        '  - Run load test using k6, JMeter, Locust, or similar',
        '  - Monitor scaling behavior in real-time',
        '  - Record scaling events and timing',
        '  - Measure time to scale (from trigger to ready)',
        '  - Observe resource utilization during scaling',
        '  - Check application performance (latency, errors)',
        'Validate scaling triggers work correctly:',
        '  - Scale-up happens when threshold is exceeded',
        '  - Scale-down happens when load decreases',
        '  - No premature scale-down (cooldown respected)',
        '  - No flapping (rapid scale-up/down cycles)',
        'Test failure scenarios:',
        '  - Pod/instance failures during high load',
        '  - Scaling during deployments',
        '  - Reaching maximum scaling limits',
        'Measure and record:',
        '  - Time to scale (P50, P95, P99)',
        '  - Application latency during scaling',
        '  - Error rates during scaling',
        '  - Cost during peak load',
        'Identify issues and optimization opportunities',
        'Generate load testing report with charts and metrics'
      ],
      outputFormat: 'JSON with success, testsPassed, failedTests, testsTotal, issues, scalingMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testsPassed', 'failedTests', 'testsTotal', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testsPassed: { type: 'number' },
        failedTests: { type: 'number' },
        testsTotal: { type: 'number' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              passed: { type: 'boolean' },
              timeToScale: { type: 'number' },
              maxLatency: { type: 'number' },
              errorRate: { type: 'number' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        scalingMetrics: {
          type: 'object',
          properties: {
            avgTimeToScaleUp: { type: 'number' },
            avgTimeToScaleDown: { type: 'number' },
            maxReplicasReached: { type: 'number' },
            flappingDetected: { type: 'boolean' }
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
  labels: ['auto-scaling', 'load-testing', 'validation']
}));

export const conductCapacityPlanningTask = defineTask('conduct-capacity-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Conduct Capacity Planning and Cost Optimization: ${args.projectName}`,
  agent: {
    name: 'capacity-planning-specialist',
    prompt: {
      role: 'Capacity Planning and FinOps Engineer',
      task: 'Conduct capacity planning and cost optimization analysis',
      context: args,
      instructions: [
        'Analyze current and projected workload:',
        '  - Current baseline resource usage',
        '  - Current peak resource usage',
        '  - Projected growth over 6-12 months',
        'Calculate capacity requirements:',
        '  - Baseline capacity (min instances/replicas)',
        '  - Peak capacity (max instances/replicas)',
        '  - Buffer capacity (overhead for headroom)',
        'Estimate costs:',
        '  - Baseline cost (min running costs)',
        '  - Average cost (typical daily costs)',
        '  - Peak cost (max scaling costs)',
        '  - Annual projected cost',
        'Analyze cost optimization opportunities:',
        '  - Use of spot/preemptible instances',
        '  - Reserved instance / committed use discounts',
        '  - Right-sizing recommendations',
        '  - Scheduling non-critical workloads',
        '  - Multi-region cost comparison',
        'Validate against budget constraints:',
        '  - Check if peak cost exceeds budget',
        '  - Calculate cost buffer remaining',
        '  - Identify cost-saving opportunities',
        'Create capacity planning roadmap:',
        '  - When to review and adjust scaling configs',
        '  - When to upgrade infrastructure',
        '  - Growth milestones and capacity checkpoints',
        'Generate cost forecasting charts',
        'Provide recommendations for cost optimization',
        'Document capacity planning methodology'
      ],
      outputFormat: 'JSON with success, baselineCost, peakCost, baselineInstances, peakInstances, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'baselineCost', 'peakCost', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        baselineCost: { type: 'number', description: 'Monthly baseline cost' },
        averageCost: { type: 'number', description: 'Monthly average cost' },
        peakCost: { type: 'number', description: 'Monthly peak cost' },
        annualProjectedCost: { type: 'number', description: 'Annual projected cost' },
        baselineInstances: { type: 'number' },
        peakInstances: { type: 'number' },
        costBreakdown: {
          type: 'object',
          properties: {
            compute: { type: 'number' },
            storage: { type: 'number' },
            network: { type: 'number' },
            other: { type: 'number' }
          }
        },
        savingsOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              estimatedSavings: { type: 'number' },
              effort: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        capacityRoadmap: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'capacity-planning', 'cost-optimization']
}));

export const generateScalingDocumentationTask = defineTask('generate-scaling-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Auto-Scaling Documentation: ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Specialist for Auto-Scaling',
      task: 'Generate comprehensive auto-scaling documentation and runbooks',
      context: args,
      instructions: [
        'Create auto-scaling architecture documentation:',
        '  - Architecture diagram showing all scalers',
        '  - Data flow diagram (metrics → scaling decision → action)',
        '  - Component descriptions and responsibilities',
        'Document scaling configuration:',
        '  - HPA configurations (per service)',
        '  - VPA configurations (if enabled)',
        '  - Cluster Autoscaler configuration',
        '  - Custom metrics scaling (if enabled)',
        '  - Predictive scaling (if enabled)',
        '  - Scaling policies and limits',
        'Create operational runbooks:',
        '  - How to view current scaling status',
        '  - How to manually scale services',
        '  - How to temporarily disable autoscaling',
        '  - How to adjust scaling thresholds',
        '  - Troubleshooting flapping/thrashing',
        '  - Troubleshooting slow scaling',
        '  - Troubleshooting scaling failures',
        '  - How to handle cost alerts',
        'Document monitoring and dashboards:',
        '  - Dashboard access and descriptions',
        '  - Key metrics to watch',
        '  - Alert definitions and response procedures',
        'Create getting started guide for operators',
        'Document capacity planning process',
        'Include cost optimization recommendations',
        'Add FAQ section for common scaling questions',
        'Format as professional Markdown documentation'
      ],
      outputFormat: 'JSON with success, runbookPath, architecturePath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runbookPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runbookPath: { type: 'string' },
        architecturePath: { type: 'string' },
        runbook: { type: 'string', description: 'Markdown content' },
        operationalGuides: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'documentation', args.infrastructure]
}));

export const calculateScalingScoreTask = defineTask('calculate-scaling-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate Auto-Scaling Configuration Score: ${args.projectName}`,
  agent: {
    name: 'scaling-assessor',
    prompt: {
      role: 'Auto-Scaling Assessment Specialist',
      task: 'Calculate auto-scaling configuration quality score and provide assessment',
      context: args,
      instructions: [
        'Calculate weighted auto-scaling score (0-100):',
        '  - Workload analysis quality (15% weight)',
        '    * Services analyzed comprehensively',
        '    * Workload patterns identified',
        '    * Scaling requirements defined',
        '  - Scaling configuration completeness (30% weight)',
        '    * HPA configured for all services',
        '    * VPA configured where appropriate',
        '    * Cluster autoscaler/VM autoscaling configured',
        '    * Custom metrics scaling (if needed)',
        '    * Predictive scaling (bonus points)',
        '  - Scaling policies and limits (20% weight)',
        '    * Appropriate cooldown periods',
        '    * Resource limits configured',
        '    * Pod Disruption Budgets set',
        '    * Flapping prevention measures',
        '  - Monitoring and observability (20% weight)',
        '    * Comprehensive dashboards',
        '    * Actionable alerts',
        '    * Runbooks available',
        '    * Metrics collection complete',
        '  - Load testing validation (15% weight)',
        '    * All load tests passed',
        '    * Scaling behavior validated',
        '    * Performance maintained during scaling',
        '    * No critical issues identified',
        'Assess production readiness',
        'Evaluate cost efficiency',
        'Identify strengths and weaknesses',
        'Provide overall verdict (excellent/good/acceptable/needs-improvement)',
        'Generate actionable recommendations',
        'Create final assessment summary'
      ],
      outputFormat: 'JSON with scalingScore, verdict, recommendation, productionReady, summaryPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scalingScore', 'verdict', 'recommendation', 'summaryPath', 'artifacts'],
      properties: {
        scalingScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            workloadAnalysis: { type: 'number' },
            scalingConfiguration: { type: 'number' },
            policiesAndLimits: { type: 'number' },
            monitoring: { type: 'number' },
            loadTesting: { type: 'number' }
          }
        },
        productionReady: { type: 'boolean' },
        costEfficient: { type: 'boolean' },
        verdict: { type: 'string', enum: ['excellent', 'good', 'acceptable', 'needs-improvement'] },
        recommendation: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auto-scaling', 'assessment', args.infrastructure]
}));

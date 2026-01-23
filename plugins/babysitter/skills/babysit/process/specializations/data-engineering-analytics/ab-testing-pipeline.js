/**
 * @process specializations/data-engineering-analytics/ab-testing-pipeline
 * @description A/B Testing Pipeline for Data Engineering - Build end-to-end A/B testing data pipeline with experiment
 * tracking, randomization infrastructure, automated data collection, statistical analysis, guardrail metrics monitoring,
 * and automated reporting capabilities.
 * @inputs { projectName: string, experimentName: string, variants: array, targetMetric: string, sampleSize?: number, duration?: number }
 * @outputs { success: boolean, pipelineConfig: object, trackingSystem: object, analysisFramework: object, reportingDashboard: object }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/ab-testing-pipeline', {
 *   projectName: 'Homepage Redesign A/B Test',
 *   experimentName: 'hero-banner-optimization',
 *   variants: [
 *     { name: 'control', description: 'Current hero banner' },
 *     { name: 'treatment-a', description: 'New hero banner with CTA' },
 *     { name: 'treatment-b', description: 'Video hero banner' }
 *   ],
 *   targetMetric: 'conversion_rate',
 *   sampleSize: 50000,
 *   duration: 14
 * });
 *
 * @references
 * - Microsoft Experimentation Platform: https://exp-platform.com/
 * - Optimizely Stats Engine: https://www.optimizely.com/insights/blog/stats-engine/
 * - Trustworthy Online Controlled Experiments: https://experimentguide.com/
 * - Netflix Experimentation: https://netflixtechblog.com/its-all-a-bout-testing-the-netflix-experimentation-platform-4e1ca458c15
 * - Airbnb Experiments at Scale: https://medium.com/airbnb-engineering/experiments-at-airbnb-e2db3abf39e7
 * - Uber's Experimentation Platform: https://eng.uber.com/experimentation-platform/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * A/B Testing Pipeline for Data Engineering
 *
 * Demonstrates:
 * - Experiment tracking system setup and configuration
 * - Randomization infrastructure with consistent assignment
 * - Automated data collection pipelines for experiment events
 * - Real-time and batch statistical analysis
 * - Guardrail metrics monitoring and alerting
 * - Automated reporting dashboards and insights
 * - Data quality validation and SRM detection
 * - Scalable pipeline architecture for high-volume experiments
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the A/B testing project
 * @param {string} inputs.experimentName - Unique identifier for the experiment
 * @param {Array} inputs.variants - Array of variant definitions (control and treatments)
 * @param {string} inputs.targetMetric - Primary success metric
 * @param {number} inputs.sampleSize - Target sample size per variant
 * @param {number} inputs.duration - Experiment duration in days
 * @param {Array} inputs.secondaryMetrics - Additional metrics to track
 * @param {Array} inputs.guardrailMetrics - Metrics with safety thresholds
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with pipeline configuration and tracking systems
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    experimentName,
    variants,
    targetMetric,
    sampleSize = 10000,
    duration = 14,
    secondaryMetrics = [],
    guardrailMetrics = [],
    confidenceLevel = 0.95,
    minimumDetectableEffect = 0.05,
    randomizationUnit = 'user_id',
    trafficAllocation = null,
    dataWarehouse = 'default',
    outputDir = 'ab-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Building A/B Testing Pipeline: ${projectName}`);
  ctx.log('info', `Experiment: ${experimentName}`);
  ctx.log('info', `Variants: ${variants.length} (${variants.map(v => v.name).join(', ')})`);
  ctx.log('info', `Target metric: ${targetMetric}`);

  // ============================================================================
  // PHASE 1: EXPERIMENT DESIGN AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Experiment Design and Configuration');

  // Task 1.1: Validate Experiment Configuration
  const configValidation = await ctx.task(experimentConfigValidationTask, {
    projectName,
    experimentName,
    variants,
    targetMetric,
    sampleSize,
    duration,
    randomizationUnit,
    outputDir
  });

  if (!configValidation.valid) {
    return {
      success: false,
      error: 'Experiment configuration validation failed',
      details: configValidation.errors,
      phase: 'configuration',
      metadata: {
        processId: 'specializations/data-engineering-analytics/ab-testing-pipeline',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...configValidation.artifacts);

  // Task 1.2: Statistical Test Design
  const statisticalDesign = await ctx.task(statisticalDesignTask, {
    projectName,
    experimentName,
    targetMetric,
    sampleSize,
    confidenceLevel,
    minimumDetectableEffect,
    variants,
    outputDir
  });

  artifacts.push(...statisticalDesign.artifacts);

  // Task 1.3: Traffic Allocation Strategy
  const trafficAllocationPlan = await ctx.task(trafficAllocationTask, {
    projectName,
    experimentName,
    variants,
    trafficAllocation,
    sampleSize,
    duration,
    outputDir
  });

  artifacts.push(...trafficAllocationPlan.artifacts);

  // Breakpoint: Review experiment design
  await ctx.breakpoint({
    question: `Review A/B test design for ${experimentName}. Variants: ${variants.length}. Sample size: ${sampleSize} per variant. Duration: ${duration} days. Confidence: ${confidenceLevel}. Approve design?`,
    title: 'Experiment Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      experimentName,
      variants,
      targetMetric,
      sampleSize,
      duration,
      files: [
        { path: `${outputDir}/experiment-config.json`, format: 'json' },
        { path: `${outputDir}/statistical-design.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: EXPERIMENT TRACKING SYSTEM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Experiment Tracking System Setup');

  // Task 2.1: Experiment Metadata Store Design
  const metadataStore = await ctx.task(metadataStoreDesignTask, {
    projectName,
    experimentName,
    variants,
    targetMetric,
    secondaryMetrics,
    guardrailMetrics,
    duration,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...metadataStore.artifacts);

  // Task 2.2: Experiment Registry Implementation
  const experimentRegistry = await ctx.task(experimentRegistryTask, {
    projectName,
    experimentName,
    metadataStore,
    variants,
    trafficAllocationPlan,
    statisticalDesign,
    outputDir
  });

  artifacts.push(...experimentRegistry.artifacts);

  // Task 2.3: Experiment Lifecycle Management
  const lifecycleManagement = await ctx.task(lifecycleManagementTask, {
    projectName,
    experimentName,
    experimentRegistry,
    duration,
    outputDir
  });

  artifacts.push(...lifecycleManagement.artifacts);

  // ============================================================================
  // PHASE 3: RANDOMIZATION INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Randomization Infrastructure');

  // Task 3.1: Randomization Algorithm Design
  const randomizationAlgorithm = await ctx.task(randomizationAlgorithmTask, {
    projectName,
    experimentName,
    variants,
    randomizationUnit,
    trafficAllocationPlan,
    consistencyRequirement: 'deterministic',
    outputDir
  });

  artifacts.push(...randomizationAlgorithm.artifacts);

  // Task 3.2: Assignment Service Implementation
  const assignmentService = await ctx.task(assignmentServiceTask, {
    projectName,
    experimentName,
    randomizationAlgorithm,
    experimentRegistry,
    variants,
    outputDir
  });

  artifacts.push(...assignmentService.artifacts);

  // Task 3.3: Assignment Logging Pipeline
  const assignmentLogging = await ctx.task(assignmentLoggingTask, {
    projectName,
    experimentName,
    assignmentService,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...assignmentLogging.artifacts);

  // Quality Gate: Validate randomization quality
  await ctx.breakpoint({
    question: `Randomization infrastructure ready for ${experimentName}. Algorithm: ${randomizationAlgorithm.algorithm}. Assignment service: ${assignmentService.endpoint}. Validate randomization quality before proceeding?`,
    title: 'Randomization Validation',
    context: {
      runId: ctx.runId,
      experimentName,
      randomizationAlgorithm: randomizationAlgorithm.algorithm,
      assignmentService: assignmentService.endpoint,
      files: [
        { path: `${outputDir}/randomization-spec.json`, format: 'json' },
        { path: `${outputDir}/assignment-service-api.yaml`, format: 'yaml' }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: DATA COLLECTION PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 4: Data Collection Pipeline');

  // Task 4.1: Event Tracking Schema Design
  const eventSchema = await ctx.task(eventSchemaDesignTask, {
    projectName,
    experimentName,
    targetMetric,
    secondaryMetrics,
    guardrailMetrics,
    randomizationUnit,
    outputDir
  });

  artifacts.push(...eventSchema.artifacts);

  // Task 4.2: Event Collection Pipeline
  const eventCollection = await ctx.task(eventCollectionPipelineTask, {
    projectName,
    experimentName,
    eventSchema,
    dataWarehouse,
    ingestionMode: 'streaming',
    outputDir
  });

  artifacts.push(...eventCollection.artifacts);

  // Task 4.3: Data Quality Validation Pipeline
  const dataQuality = await ctx.task(dataQualityPipelineTask, {
    projectName,
    experimentName,
    eventSchema,
    eventCollection,
    validationRules: ['completeness', 'correctness', 'consistency', 'timeliness'],
    outputDir
  });

  artifacts.push(...dataQuality.artifacts);

  // Task 4.4: Sample Ratio Mismatch Detection
  const srmDetection = await ctx.task(srmDetectionTask, {
    projectName,
    experimentName,
    variants,
    trafficAllocationPlan,
    assignmentLogging,
    threshold: 0.01,
    outputDir
  });

  artifacts.push(...srmDetection.artifacts);

  // ============================================================================
  // PHASE 5: METRICS COMPUTATION PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 5: Metrics Computation Pipeline');

  // Task 5.1: Metric Calculation Logic
  const metricCalculation = await ctx.task(metricCalculationTask, {
    projectName,
    experimentName,
    targetMetric,
    secondaryMetrics,
    guardrailMetrics,
    eventSchema,
    aggregationWindow: 'daily',
    outputDir
  });

  artifacts.push(...metricCalculation.artifacts);

  // Task 5.2: Real-time Metrics Pipeline
  const realtimeMetrics = await ctx.task(realtimeMetricsPipelineTask, {
    projectName,
    experimentName,
    metricCalculation,
    eventCollection,
    updateFrequency: '5 minutes',
    outputDir
  });

  artifacts.push(...realtimeMetrics.artifacts);

  // Task 5.3: Batch Metrics Pipeline
  const batchMetrics = await ctx.task(batchMetricsPipelineTask, {
    projectName,
    experimentName,
    metricCalculation,
    dataWarehouse,
    schedule: 'daily at 00:00 UTC',
    outputDir
  });

  artifacts.push(...batchMetrics.artifacts);

  // ============================================================================
  // PHASE 6: STATISTICAL ANALYSIS FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Statistical Analysis Framework');

  // Task 6.1: Statistical Test Implementation
  const statisticalTests = await ctx.task(statisticalTestImplementationTask, {
    projectName,
    experimentName,
    statisticalDesign,
    targetMetric,
    secondaryMetrics,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...statisticalTests.artifacts);

  // Task 6.2: Sequential Testing Framework
  const sequentialTesting = await ctx.task(sequentialTestingTask, {
    projectName,
    experimentName,
    statisticalTests,
    earlyStoppingEnabled: true,
    peekingFrequency: 'daily',
    outputDir
  });

  artifacts.push(...sequentialTesting.artifacts);

  // Task 6.3: Effect Size Estimation
  const effectSizeEstimation = await ctx.task(effectSizeEstimationTask, {
    projectName,
    experimentName,
    targetMetric,
    secondaryMetrics,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...effectSizeEstimation.artifacts);

  // Task 6.4: Segmentation Analysis
  const segmentationAnalysis = await ctx.task(segmentationAnalysisTask, {
    projectName,
    experimentName,
    targetMetric,
    segments: inputs.segments || ['platform', 'user_type', 'region'],
    outputDir
  });

  artifacts.push(...segmentationAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: GUARDRAIL METRICS MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Guardrail Metrics Monitoring');

  // Task 7.1: Guardrail Thresholds Definition
  const guardrailThresholds = await ctx.task(guardrailThresholdsTask, {
    projectName,
    experimentName,
    guardrailMetrics,
    variants,
    outputDir
  });

  artifacts.push(...guardrailThresholds.artifacts);

  // Task 7.2: Guardrail Monitoring Pipeline
  const guardrailMonitoring = await ctx.task(guardrailMonitoringTask, {
    projectName,
    experimentName,
    guardrailThresholds,
    realtimeMetrics,
    checkFrequency: '15 minutes',
    outputDir
  });

  artifacts.push(...guardrailMonitoring.artifacts);

  // Task 7.3: Automated Alerting System
  const alertingSystem = await ctx.task(alertingSystemTask, {
    projectName,
    experimentName,
    guardrailMonitoring,
    srmDetection,
    dataQuality,
    alertChannels: ['slack', 'email', 'pagerduty'],
    outputDir
  });

  artifacts.push(...alertingSystem.artifacts);

  // ============================================================================
  // PHASE 8: AUTOMATED REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Automated Reporting');

  // Task 8.1: Results Dashboard Design
  const resultsDashboard = await ctx.task(dashboardDesignTask, {
    projectName,
    experimentName,
    targetMetric,
    secondaryMetrics,
    guardrailMetrics,
    variants,
    statisticalTests,
    outputDir
  });

  artifacts.push(...resultsDashboard.artifacts);

  // Task 8.2: Automated Report Generation
  const reportGeneration = await ctx.task(reportGenerationTask, {
    projectName,
    experimentName,
    resultsDashboard,
    statisticalTests,
    effectSizeEstimation,
    segmentationAnalysis,
    schedule: 'daily',
    outputDir
  });

  artifacts.push(...reportGeneration.artifacts);

  // Task 8.3: Decision Support System
  const decisionSupport = await ctx.task(decisionSupportTask, {
    projectName,
    experimentName,
    statisticalTests,
    effectSizeEstimation,
    guardrailMonitoring,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...decisionSupport.artifacts);

  // ============================================================================
  // PHASE 9: PIPELINE ORCHESTRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Pipeline Orchestration');

  // Task 9.1: Workflow Orchestration
  const workflowOrchestration = await ctx.task(workflowOrchestrationTask, {
    projectName,
    experimentName,
    pipelines: [
      assignmentLogging,
      eventCollection,
      dataQuality,
      realtimeMetrics,
      batchMetrics,
      statisticalTests,
      guardrailMonitoring,
      reportGeneration
    ],
    orchestrator: 'airflow',
    outputDir
  });

  artifacts.push(...workflowOrchestration.artifacts);

  // Task 9.2: Pipeline Monitoring and Observability
  const pipelineObservability = await ctx.task(pipelineObservabilityTask, {
    projectName,
    experimentName,
    workflowOrchestration,
    metrics: ['latency', 'throughput', 'error_rate', 'data_quality'],
    outputDir
  });

  artifacts.push(...pipelineObservability.artifacts);

  // ============================================================================
  // PHASE 10: DEPLOYMENT AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Deployment and Validation');

  // Task 10.1: Integration Testing
  const integrationTesting = await ctx.task(integrationTestingTask, {
    projectName,
    experimentName,
    assignmentService,
    eventCollection,
    metricCalculation,
    testScenarios: ['happy_path', 'edge_cases', 'failure_modes'],
    outputDir
  });

  artifacts.push(...integrationTesting.artifacts);

  // Quality Gate: Integration tests must pass
  if (!integrationTesting.allTestsPassed) {
    return {
      success: false,
      error: 'Integration testing failed',
      details: integrationTesting.failedTests,
      phase: 'deployment',
      metadata: {
        processId: 'specializations/data-engineering-analytics/ab-testing-pipeline',
        timestamp: startTime
      }
    };
  }

  // Task 10.2: Deployment Plan
  const deploymentPlan = await ctx.task(deploymentPlanTask, {
    projectName,
    experimentName,
    components: [
      assignmentService,
      eventCollection,
      realtimeMetrics,
      batchMetrics,
      guardrailMonitoring,
      alertingSystem,
      resultsDashboard
    ],
    rolloutStrategy: 'gradual',
    outputDir
  });

  artifacts.push(...deploymentPlan.artifacts);

  // Task 10.3: Runbook and Documentation
  const runbook = await ctx.task(runbookGenerationTask, {
    projectName,
    experimentName,
    architecture: workflowOrchestration,
    monitoring: pipelineObservability,
    troubleshooting: integrationTesting,
    outputDir
  });

  artifacts.push(...runbook.artifacts);

  // Final Breakpoint: Review complete pipeline
  await ctx.breakpoint({
    question: `A/B Testing Pipeline complete for ${experimentName}. Components: assignment service, event collection, metrics computation, statistical analysis, guardrail monitoring, automated reporting. Review deployment plan and approve launch?`,
    title: 'Pipeline Deployment Approval',
    context: {
      runId: ctx.runId,
      projectName,
      experimentName,
      components: deploymentPlan.components.length,
      integrationTestsPassed: integrationTesting.allTestsPassed,
      files: [
        { path: `${outputDir}/pipeline-architecture.md`, format: 'markdown' },
        { path: `${outputDir}/deployment-plan.json`, format: 'json' },
        { path: `${outputDir}/runbook.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // RETURN RESULTS
  // ============================================================================

  const endTime = ctx.now();
  const durationMinutes = (endTime - startTime) / (1000 * 60);

  ctx.log('info', `A/B Testing Pipeline completed in ${durationMinutes.toFixed(2)} minutes`);
  ctx.log('info', `Artifacts generated: ${artifacts.length}`);

  return {
    success: true,
    projectName,
    experimentName,
    pipelineConfig: {
      variants: variants.length,
      targetMetric,
      sampleSize,
      duration,
      confidenceLevel,
      randomizationUnit
    },
    trackingSystem: {
      metadataStore: metadataStore.databaseSchema,
      experimentRegistry: experimentRegistry.apiEndpoint,
      lifecycleStates: lifecycleManagement.states
    },
    randomizationInfrastructure: {
      algorithm: randomizationAlgorithm.algorithm,
      assignmentService: assignmentService.endpoint,
      assignmentLogging: assignmentLogging.pipeline
    },
    dataCollection: {
      eventSchema: eventSchema.schema,
      ingestionPipeline: eventCollection.pipeline,
      dataQuality: dataQuality.validationRules,
      srmDetection: srmDetection.enabled
    },
    metricsComputation: {
      realtimePipeline: realtimeMetrics.pipeline,
      batchPipeline: batchMetrics.pipeline,
      calculations: metricCalculation.formulas
    },
    analysisFramework: {
      statisticalTests: statisticalTests.tests,
      sequentialTesting: sequentialTesting.enabled,
      effectSizeEstimation: effectSizeEstimation.methods,
      segmentation: segmentationAnalysis.segments
    },
    guardrailMonitoring: {
      thresholds: guardrailThresholds.thresholds,
      monitoring: guardrailMonitoring.pipeline,
      alerting: alertingSystem.channels
    },
    reportingDashboard: {
      dashboard: resultsDashboard.url,
      reportGeneration: reportGeneration.schedule,
      decisionSupport: decisionSupport.criteria
    },
    orchestration: {
      workflow: workflowOrchestration.dag,
      observability: pipelineObservability.dashboards
    },
    deployment: {
      integrationTests: integrationTesting.allTestsPassed,
      plan: deploymentPlan.strategy,
      runbook: runbook.path
    },
    artifacts,
    metadata: {
      processId: 'specializations/data-engineering-analytics/ab-testing-pipeline',
      startTime,
      endTime,
      durationMinutes: durationMinutes.toFixed(2),
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const experimentConfigValidationTask = defineTask('experiment-config-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Experiment Configuration - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineering Architect specializing in A/B testing infrastructure',
      task: 'Validate the A/B testing experiment configuration for completeness and correctness',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        variants: args.variants,
        targetMetric: args.targetMetric,
        sampleSize: args.sampleSize,
        duration: args.duration,
        randomizationUnit: args.randomizationUnit
      },
      instructions: [
        '1. Validate experiment name is unique, descriptive, and follows naming conventions',
        '2. Verify all variants have unique names and clear descriptions',
        '3. Ensure at least one control variant exists',
        '4. Validate target metric is well-defined and measurable',
        '5. Check sample size is sufficient for statistical power',
        '6. Verify experiment duration is reasonable (typically 1-4 weeks)',
        '7. Validate randomization unit is appropriate (user_id, session_id, etc.)',
        '8. Check for potential conflicts with other running experiments',
        '9. Verify compliance with data privacy and ethical guidelines',
        '10. Generate configuration artifacts and validation report'
      ],
      outputFormat: 'JSON object with validation results and any errors'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'errors', 'artifacts'],
      properties: {
        valid: {
          type: 'boolean',
          description: 'Whether configuration is valid'
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of validation errors if any'
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of validation warnings'
        },
        validatedConfig: {
          type: 'object',
          description: 'Validated and normalized configuration'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'validation']
}));

export const statisticalDesignTask = defineTask('statistical-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Statistical Test Design - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistician specializing in experimental design and hypothesis testing',
      task: 'Design the statistical testing methodology for the A/B test',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        targetMetric: args.targetMetric,
        sampleSize: args.sampleSize,
        confidenceLevel: args.confidenceLevel,
        minimumDetectableEffect: args.minimumDetectableEffect,
        variants: args.variants
      },
      instructions: [
        '1. Determine the appropriate statistical test based on metric type (t-test, chi-square, Mann-Whitney, etc.)',
        '2. Calculate significance level (alpha) from confidence level',
        '3. Recommend statistical power (typically 0.8 or 80%)',
        '4. Calculate required sample size per variant based on MDE and power',
        '5. Design multiple testing correction if needed (Bonferroni, Benjamini-Hochberg)',
        '6. Specify whether one-tailed or two-tailed test',
        '7. Document statistical assumptions and validation procedures',
        '8. Design sequential testing approach for early stopping',
        '9. Create formulas for p-value, confidence interval, and effect size calculations',
        '10. Generate statistical test specification document'
      ],
      outputFormat: 'JSON object with complete statistical design'
    },
    outputSchema: {
      type: 'object',
      required: ['statisticalTest', 'alpha', 'power', 'sampleSizePerVariant', 'artifacts'],
      properties: {
        statisticalTest: {
          type: 'string',
          description: 'Type of statistical test (e.g., two-sample t-test, chi-square)'
        },
        testTails: {
          type: 'string',
          enum: ['one-tailed', 'two-tailed'],
          description: 'Whether test is one-tailed or two-tailed'
        },
        alpha: {
          type: 'number',
          description: 'Significance level (e.g., 0.05 for 95% confidence)'
        },
        power: {
          type: 'number',
          description: 'Statistical power (typically 0.8)'
        },
        sampleSizePerVariant: {
          type: 'number',
          description: 'Required sample size per variant'
        },
        minimumDetectableEffect: {
          type: 'number',
          description: 'Minimum detectable effect size'
        },
        multipleTestingCorrection: {
          type: 'string',
          description: 'Method for multiple testing correction'
        },
        sequentialTestingEnabled: {
          type: 'boolean',
          description: 'Whether sequential testing is enabled'
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Statistical assumptions'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'statistics']
}));

export const trafficAllocationTask = defineTask('traffic-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Traffic Allocation Strategy - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Platform Engineer',
      task: 'Design traffic allocation strategy for experiment variants',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        variants: args.variants,
        trafficAllocation: args.trafficAllocation,
        sampleSize: args.sampleSize,
        duration: args.duration
      },
      instructions: [
        '1. If custom allocation provided, validate it sums to 100%',
        '2. Otherwise, design equal allocation across variants',
        '3. Calculate expected traffic per variant based on estimated daily traffic',
        '4. Verify sample size targets can be achieved within duration',
        '5. Design ramp-up strategy (immediate, gradual, staged)',
        '6. Specify traffic filtering rules (e.g., exclude bots, test users)',
        '7. Define inclusion/exclusion criteria for experiment participation',
        '8. Calculate expected completion time',
        '9. Design fallback allocation strategy',
        '10. Generate traffic allocation specification'
      ],
      outputFormat: 'JSON object with traffic allocation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['allocation', 'rampupStrategy', 'artifacts'],
      properties: {
        allocation: {
          type: 'object',
          description: 'Traffic allocation percentages per variant',
          additionalProperties: { type: 'number' }
        },
        rampupStrategy: {
          type: 'string',
          enum: ['immediate', 'gradual', 'staged'],
          description: 'How to ramp up traffic'
        },
        rampupSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'number' },
              percentage: { type: 'number' }
            }
          },
          description: 'Ramp-up schedule if gradual'
        },
        estimatedDailyTraffic: {
          type: 'number',
          description: 'Estimated daily eligible traffic'
        },
        expectedCompletionDays: {
          type: 'number',
          description: 'Expected days to complete'
        },
        inclusionCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Criteria for including users'
        },
        exclusionCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Criteria for excluding users'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'traffic']
}));

export const metadataStoreDesignTask = defineTask('metadata-store-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Experiment Metadata Store Design - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Architect specializing in experiment tracking systems',
      task: 'Design database schema for storing experiment metadata',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        variants: args.variants,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        guardrailMetrics: args.guardrailMetrics,
        duration: args.duration,
        dataWarehouse: args.dataWarehouse
      },
      instructions: [
        '1. Design experiments table schema (id, name, status, start_date, end_date, etc.)',
        '2. Design variants table schema (id, experiment_id, name, description, allocation)',
        '3. Design metrics table schema (id, name, type, calculation, aggregation)',
        '4. Design experiment_metrics junction table',
        '5. Design experiment_config table for storing configuration JSON',
        '6. Add indexes for common query patterns',
        '7. Design audit log table for tracking changes',
        '8. Add constraints and validations',
        '9. Generate DDL statements for selected data warehouse',
        '10. Create migration scripts and initialization data'
      ],
      outputFormat: 'JSON object with database schema design'
    },
    outputSchema: {
      type: 'object',
      required: ['databaseSchema', 'ddlStatements', 'artifacts'],
      properties: {
        databaseSchema: {
          type: 'object',
          properties: {
            tables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  columns: { type: 'array' },
                  indexes: { type: 'array' },
                  constraints: { type: 'array' }
                }
              }
            }
          },
          description: 'Complete database schema'
        },
        ddlStatements: {
          type: 'array',
          items: { type: 'string' },
          description: 'SQL DDL statements to create schema'
        },
        migrationScripts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Database migration scripts'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'database']
}));

export const experimentRegistryTask = defineTask('experiment-registry', (args, taskCtx) => ({
  kind: 'agent',
  title: `Experiment Registry Implementation - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backend Engineer specializing in API development',
      task: 'Implement experiment registry API for managing experiments',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        metadataStore: args.metadataStore,
        variants: args.variants,
        trafficAllocationPlan: args.trafficAllocationPlan,
        statisticalDesign: args.statisticalDesign
      },
      instructions: [
        '1. Design REST API for experiment CRUD operations',
        '2. Implement POST /experiments endpoint for creating experiments',
        '3. Implement GET /experiments/{id} endpoint for retrieving experiment details',
        '4. Implement PATCH /experiments/{id} endpoint for updating experiments',
        '5. Implement POST /experiments/{id}/variants endpoint for managing variants',
        '6. Implement GET /experiments/active endpoint for listing active experiments',
        '7. Add authentication and authorization',
        '8. Implement validation logic for experiment configuration',
        '9. Add audit logging for all operations',
        '10. Generate OpenAPI specification and API documentation'
      ],
      outputFormat: 'JSON object with API specification and implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['apiEndpoint', 'endpoints', 'artifacts'],
      properties: {
        apiEndpoint: {
          type: 'string',
          description: 'Base URL of the experiment registry API'
        },
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          },
          description: 'List of API endpoints'
        },
        authentication: {
          type: 'string',
          description: 'Authentication mechanism'
        },
        openApiSpec: {
          type: 'string',
          description: 'Path to OpenAPI specification'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'api']
}));

export const lifecycleManagementTask = defineTask('lifecycle-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Experiment Lifecycle Management - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Engineer',
      task: 'Design experiment lifecycle state machine and transitions',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        experimentRegistry: args.experimentRegistry,
        duration: args.duration
      },
      instructions: [
        '1. Define experiment lifecycle states (draft, scheduled, running, paused, completed, cancelled)',
        '2. Define valid state transitions and transition triggers',
        '3. Design automatic state transitions (e.g., scheduled -> running at start_date)',
        '4. Implement manual state transition endpoints',
        '5. Add validation logic for state transitions',
        '6. Design notifications for state changes',
        '7. Implement experiment start/stop automation',
        '8. Add rollback procedures for each state',
        '9. Design state transition audit logging',
        '10. Generate state machine diagram and documentation'
      ],
      outputFormat: 'JSON object with lifecycle management specification'
    },
    outputSchema: {
      type: 'object',
      required: ['states', 'transitions', 'artifacts'],
      properties: {
        states: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of lifecycle states'
        },
        transitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              trigger: { type: 'string' },
              automatic: { type: 'boolean' }
            }
          },
          description: 'Valid state transitions'
        },
        automationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              action: { type: 'string' }
            }
          },
          description: 'Automated lifecycle management rules'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'lifecycle']
}));

export const randomizationAlgorithmTask = defineTask('randomization-algorithm', (args, taskCtx) => ({
  kind: 'agent',
  title: `Randomization Algorithm Design - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Algorithms Engineer specializing in randomization and hashing',
      task: 'Design deterministic randomization algorithm for variant assignment',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        variants: args.variants,
        randomizationUnit: args.randomizationUnit,
        trafficAllocationPlan: args.trafficAllocationPlan,
        consistencyRequirement: args.consistencyRequirement
      },
      instructions: [
        '1. Select appropriate hash function (MD5, SHA256, MurmurHash, etc.)',
        '2. Design hash input format (experiment_id + randomization_unit)',
        '3. Implement hash modulo method for variant assignment',
        '4. Create deterministic mapping from hash to variant based on allocation',
        '5. Ensure consistent assignment across multiple calls',
        '6. Handle edge cases (null values, empty strings, etc.)',
        '7. Design salt/seed strategy for isolation between experiments',
        '8. Implement stratification if needed',
        '9. Create pseudocode and reference implementation',
        '10. Generate test cases for validation'
      ],
      outputFormat: 'JSON object with randomization algorithm specification'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'hashFunction', 'pseudocode', 'artifacts'],
      properties: {
        algorithm: {
          type: 'string',
          description: 'Name of the randomization algorithm'
        },
        hashFunction: {
          type: 'string',
          description: 'Hash function used (MD5, SHA256, etc.)'
        },
        hashInput: {
          type: 'string',
          description: 'Format of hash input string'
        },
        assignmentLogic: {
          type: 'string',
          description: 'How hash maps to variant assignment'
        },
        salt: {
          type: 'string',
          description: 'Salt or seed value for the hash'
        },
        pseudocode: {
          type: 'string',
          description: 'Pseudocode for the algorithm'
        },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              input: { type: 'string' },
              expectedVariant: { type: 'string' }
            }
          },
          description: 'Test cases for validation'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'randomization']
}));

export const assignmentServiceTask = defineTask('assignment-service', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assignment Service Implementation - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backend Engineer specializing in high-performance services',
      task: 'Implement variant assignment service with low latency and high availability',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        randomizationAlgorithm: args.randomizationAlgorithm,
        experimentRegistry: args.experimentRegistry,
        variants: args.variants
      },
      instructions: [
        '1. Design REST API for variant assignment: GET /assign?experiment_id=X&user_id=Y',
        '2. Implement caching layer for experiment configuration',
        '3. Implement the randomization algorithm for assignment',
        '4. Add experiment status validation (only assign if running)',
        '5. Implement rate limiting and request throttling',
        '6. Add latency monitoring (target p99 < 50ms)',
        '7. Design fallback mechanism for failures (default to control)',
        '8. Implement health check endpoints',
        '9. Add metrics export (assignments per variant, latency, errors)',
        '10. Generate service specification and deployment configuration'
      ],
      outputFormat: 'JSON object with assignment service specification'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoint', 'api', 'artifacts'],
      properties: {
        endpoint: {
          type: 'string',
          description: 'Assignment service endpoint URL'
        },
        api: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          },
          description: 'API endpoints'
        },
        caching: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            ttl: { type: 'string' }
          },
          description: 'Caching configuration'
        },
        performanceTarget: {
          type: 'object',
          properties: {
            p99Latency: { type: 'string' },
            throughput: { type: 'string' }
          },
          description: 'Performance targets'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'service']
}));

export const assignmentLoggingTask = defineTask('assignment-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assignment Logging Pipeline - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer specializing in streaming pipelines',
      task: 'Design pipeline for logging and storing variant assignments',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        assignmentService: args.assignmentService,
        dataWarehouse: args.dataWarehouse
      },
      instructions: [
        '1. Design assignment event schema (timestamp, experiment_id, user_id, variant, etc.)',
        '2. Implement assignment event capture in assignment service',
        '3. Design streaming pipeline for assignment events (Kafka, Kinesis, Pub/Sub)',
        '4. Implement consumer for writing assignments to data warehouse',
        '5. Add deduplication logic for idempotency',
        '6. Design partitioning strategy (by date, experiment_id)',
        '7. Implement data retention policy',
        '8. Add monitoring for pipeline health (lag, throughput, errors)',
        '9. Create assignment table schema in data warehouse',
        '10. Generate pipeline configuration and deployment specs'
      ],
      outputFormat: 'JSON object with assignment logging pipeline specification'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'schema', 'artifacts'],
      properties: {
        pipeline: {
          type: 'string',
          description: 'Name of the logging pipeline'
        },
        streamingPlatform: {
          type: 'string',
          description: 'Streaming platform (Kafka, Kinesis, Pub/Sub)'
        },
        schema: {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' }
                }
              }
            }
          },
          description: 'Assignment event schema'
        },
        partitioningStrategy: {
          type: 'string',
          description: 'How data is partitioned'
        },
        retentionPolicy: {
          type: 'string',
          description: 'Data retention policy'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'logging']
}));

export const eventSchemaDesignTask = defineTask('event-schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Tracking Schema Design - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Engineer',
      task: 'Design comprehensive event schema for tracking experiment metrics',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        guardrailMetrics: args.guardrailMetrics,
        randomizationUnit: args.randomizationUnit
      },
      instructions: [
        '1. Design base event schema (timestamp, user_id, session_id, event_type, properties)',
        '2. Define events required to calculate target metric',
        '3. Define events required for secondary metrics',
        '4. Define events required for guardrail metrics',
        '5. Ensure all events include experiment_id and variant',
        '6. Add context fields (platform, device, location, etc.) for segmentation',
        '7. Design event validation rules',
        '8. Create event catalog documentation',
        '9. Generate JSON schema for validation',
        '10. Create example events and tracking plan'
      ],
      outputFormat: 'JSON object with event schema specification'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'events', 'artifacts'],
      properties: {
        schema: {
          type: 'object',
          description: 'JSON schema for events'
        },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              description: { type: 'string' },
              requiredProperties: { type: 'array', items: { type: 'string' } },
              optionalProperties: { type: 'array', items: { type: 'string' } },
              usedForMetrics: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'List of events to track'
        },
        validationRules: {
          type: 'array',
          items: { type: 'string' },
          description: 'Validation rules for events'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'schema']
}));

export const eventCollectionPipelineTask = defineTask('event-collection-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Collection Pipeline - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer specializing in real-time data ingestion',
      task: 'Design scalable event collection pipeline for experiment data',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        eventSchema: args.eventSchema,
        dataWarehouse: args.dataWarehouse,
        ingestionMode: args.ingestionMode
      },
      instructions: [
        '1. Design event ingestion API (REST endpoint, SDK)',
        '2. Implement schema validation for incoming events',
        '3. Design streaming pipeline (Kafka, Kinesis, Pub/Sub)',
        '4. Implement event enrichment (add derived fields, lookups)',
        '5. Design partitioning strategy for events table',
        '6. Implement batch and real-time sinks to data warehouse',
        '7. Add deduplication and ordering guarantees',
        '8. Implement error handling and dead letter queue',
        '9. Add monitoring for ingestion rate, errors, and lag',
        '10. Generate pipeline configuration and SDK documentation'
      ],
      outputFormat: 'JSON object with event collection pipeline specification'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'ingestionEndpoint', 'artifacts'],
      properties: {
        pipeline: {
          type: 'string',
          description: 'Pipeline name'
        },
        ingestionEndpoint: {
          type: 'string',
          description: 'Event ingestion API endpoint'
        },
        streamingPlatform: {
          type: 'string',
          description: 'Streaming platform used'
        },
        enrichment: {
          type: 'array',
          items: { type: 'string' },
          description: 'Event enrichment operations'
        },
        sinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              destination: { type: 'string' },
              mode: { type: 'string' },
              latency: { type: 'string' }
            }
          },
          description: 'Data sinks'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'ingestion']
}));

export const dataQualityPipelineTask = defineTask('data-quality-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Quality Validation Pipeline - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Design data quality validation pipeline for experiment data',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        eventSchema: args.eventSchema,
        eventCollection: args.eventCollection,
        validationRules: args.validationRules
      },
      instructions: [
        '1. Implement completeness checks (missing required fields)',
        '2. Implement correctness checks (data type validation, range checks)',
        '3. Implement consistency checks (cross-field validation)',
        '4. Implement timeliness checks (event timestamp freshness)',
        '5. Design anomaly detection for sudden traffic drops/spikes',
        '6. Implement schema validation against expected schema',
        '7. Design data quality metrics dashboard',
        '8. Implement alerting for data quality issues',
        '9. Create data quality reports',
        '10. Generate validation pipeline configuration'
      ],
      outputFormat: 'JSON object with data quality pipeline specification'
    },
    outputSchema: {
      type: 'object',
      required: ['validationRules', 'pipeline', 'artifacts'],
      properties: {
        validationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleName: { type: 'string' },
              ruleType: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
            }
          },
          description: 'Data quality validation rules'
        },
        pipeline: {
          type: 'string',
          description: 'Data quality pipeline name'
        },
        schedule: {
          type: 'string',
          description: 'Validation schedule'
        },
        alerting: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            thresholds: { type: 'object' }
          },
          description: 'Alerting configuration'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'data-quality']
}));

export const srmDetectionTask = defineTask('srm-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sample Ratio Mismatch Detection - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Statistician',
      task: 'Implement Sample Ratio Mismatch (SRM) detection system',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        variants: args.variants,
        trafficAllocationPlan: args.trafficAllocationPlan,
        assignmentLogging: args.assignmentLogging,
        threshold: args.threshold
      },
      instructions: [
        '1. Implement chi-square test for SRM detection',
        '2. Calculate expected vs. observed sample ratios per variant',
        '3. Compute p-value for chi-square test',
        '4. Set SRM alert threshold (typically p < 0.01)',
        '5. Design daily SRM checks',
        '6. Implement cumulative SRM monitoring',
        '7. Create SRM detection query for data warehouse',
        '8. Design SRM alert notifications',
        '9. Create SRM investigation runbook',
        '10. Generate SRM monitoring configuration'
      ],
      outputFormat: 'JSON object with SRM detection specification'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'method', 'artifacts'],
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Whether SRM detection is enabled'
        },
        method: {
          type: 'string',
          description: 'Statistical method (chi-square test)'
        },
        threshold: {
          type: 'number',
          description: 'P-value threshold for SRM alert'
        },
        checkFrequency: {
          type: 'string',
          description: 'How often to check for SRM'
        },
        query: {
          type: 'string',
          description: 'SQL query for SRM detection'
        },
        alerting: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            severity: { type: 'string' }
          },
          description: 'Alert configuration'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'srm']
}));

export const metricCalculationTask = defineTask('metric-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metric Calculation Logic - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Engineer',
      task: 'Design metric calculation logic and formulas',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        guardrailMetrics: args.guardrailMetrics,
        eventSchema: args.eventSchema,
        aggregationWindow: args.aggregationWindow
      },
      instructions: [
        '1. Define calculation formula for target metric (e.g., conversion_rate = conversions / assignments)',
        '2. Define calculation formulas for secondary metrics',
        '3. Define calculation formulas for guardrail metrics',
        '4. Specify aggregation level (user-level, session-level, etc.)',
        '5. Design metric rollup queries per variant',
        '6. Implement delta method for variance estimation',
        '7. Handle edge cases (division by zero, null values)',
        '8. Create SQL queries for batch calculation',
        '9. Create streaming aggregation logic',
        '10. Generate metric calculation documentation'
      ],
      outputFormat: 'JSON object with metric calculation specification'
    },
    outputSchema: {
      type: 'object',
      required: ['formulas', 'queries', 'artifacts'],
      properties: {
        formulas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              formula: { type: 'string' },
              numerator: { type: 'string' },
              denominator: { type: 'string' },
              aggregation: { type: 'string' }
            }
          },
          description: 'Metric calculation formulas'
        },
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              sql: { type: 'string' }
            }
          },
          description: 'SQL queries for batch calculation'
        },
        streamingLogic: {
          type: 'string',
          description: 'Logic for streaming aggregation'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'metrics']
}));

export const realtimeMetricsPipelineTask = defineTask('realtime-metrics-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Real-time Metrics Pipeline - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Streaming Data Engineer',
      task: 'Design real-time metrics computation pipeline',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        metricCalculation: args.metricCalculation,
        eventCollection: args.eventCollection,
        updateFrequency: args.updateFrequency
      },
      instructions: [
        '1. Design streaming aggregation using windowing (tumbling, sliding)',
        '2. Implement incremental metric updates',
        '3. Design state management for streaming aggregations',
        '4. Implement variant-level metric rollups',
        '5. Store real-time metrics in fast store (Redis, DynamoDB)',
        '6. Design metric materialization strategy',
        '7. Implement late event handling',
        '8. Add monitoring for pipeline lag and throughput',
        '9. Create real-time metrics API',
        '10. Generate streaming pipeline configuration'
      ],
      outputFormat: 'JSON object with real-time metrics pipeline specification'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'store', 'artifacts'],
      properties: {
        pipeline: {
          type: 'string',
          description: 'Real-time metrics pipeline name'
        },
        windowingStrategy: {
          type: 'string',
          description: 'Windowing strategy (tumbling, sliding)'
        },
        updateFrequency: {
          type: 'string',
          description: 'How often metrics are updated'
        },
        store: {
          type: 'string',
          description: 'Fast store for real-time metrics'
        },
        api: {
          type: 'string',
          description: 'API endpoint for real-time metrics'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'realtime']
}));

export const batchMetricsPipelineTask = defineTask('batch-metrics-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Batch Metrics Pipeline - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer specializing in batch processing',
      task: 'Design batch metrics computation pipeline for accurate daily snapshots',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        metricCalculation: args.metricCalculation,
        dataWarehouse: args.dataWarehouse,
        schedule: args.schedule
      },
      instructions: [
        '1. Design daily batch job for metric computation',
        '2. Implement SQL queries for accurate metric calculation',
        '3. Design metrics snapshot table schema',
        '4. Implement partition-aware processing',
        '5. Add idempotency for reprocessing',
        '6. Calculate cumulative metrics over experiment duration',
        '7. Compute daily and cumulative statistics per variant',
        '8. Implement backfill capability',
        '9. Add job monitoring and alerting',
        '10. Generate batch pipeline DAG and configuration'
      ],
      outputFormat: 'JSON object with batch metrics pipeline specification'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'schedule', 'artifacts'],
      properties: {
        pipeline: {
          type: 'string',
          description: 'Batch metrics pipeline name'
        },
        schedule: {
          type: 'string',
          description: 'Cron schedule for batch job'
        },
        outputTable: {
          type: 'string',
          description: 'Metrics snapshot table name'
        },
        orchestrator: {
          type: 'string',
          description: 'Workflow orchestrator (Airflow, etc.)'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'batch']
}));

export const statisticalTestImplementationTask = defineTask('statistical-test-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Statistical Test Implementation - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistical Computing Specialist',
      task: 'Implement statistical tests for experiment analysis',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        statisticalDesign: args.statisticalDesign,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        confidenceLevel: args.confidenceLevel
      },
      instructions: [
        '1. Implement the chosen statistical test (t-test, chi-square, Mann-Whitney)',
        '2. Calculate test statistic and p-value',
        '3. Compute confidence intervals for effect size',
        '4. Implement variance estimation (delta method for ratios)',
        '5. Apply multiple testing correction if needed',
        '6. Calculate statistical power post-hoc',
        '7. Implement test assumptions validation',
        '8. Create Python/R scripts for analysis',
        '9. Design analysis result schema',
        '10. Generate statistical test documentation'
      ],
      outputFormat: 'JSON object with statistical test implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'implementation', 'artifacts'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              testType: { type: 'string' },
              implementation: { type: 'string' }
            }
          },
          description: 'Statistical tests per metric'
        },
        implementation: {
          type: 'string',
          description: 'Path to analysis scripts'
        },
        outputSchema: {
          type: 'object',
          description: 'Schema for analysis results'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'statistics']
}));

export const sequentialTestingTask = defineTask('sequential-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sequential Testing Framework - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Statistician',
      task: 'Implement sequential testing for early stopping decisions',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        statisticalTests: args.statisticalTests,
        earlyStoppingEnabled: args.earlyStoppingEnabled,
        peekingFrequency: args.peekingFrequency
      },
      instructions: [
        '1. Implement sequential probability ratio test (SPRT) or mSPRT',
        '2. Calculate alpha spending function for multiple looks',
        '3. Design early stopping boundaries (futility and superiority)',
        '4. Implement peeking schedule and p-value adjustment',
        '5. Calculate sample size inflation factor',
        '6. Design automated early stopping decision logic',
        '7. Implement human-in-the-loop approval for early stops',
        '8. Add logging for all peeking events',
        '9. Create early stopping documentation',
        '10. Generate sequential testing configuration'
      ],
      outputFormat: 'JSON object with sequential testing framework'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'method', 'artifacts'],
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Whether sequential testing is enabled'
        },
        method: {
          type: 'string',
          description: 'Sequential testing method (SPRT, mSPRT, Bonferroni)'
        },
        peekingSchedule: {
          type: 'array',
          items: { type: 'string' },
          description: 'Schedule for interim analyses'
        },
        stoppingBoundaries: {
          type: 'object',
          properties: {
            superiority: { type: 'string' },
            futility: { type: 'string' }
          },
          description: 'Early stopping boundaries'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'sequential']
}));

export const effectSizeEstimationTask = defineTask('effect-size-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Effect Size Estimation - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistician',
      task: 'Implement effect size estimation with confidence intervals',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        confidenceLevel: args.confidenceLevel
      },
      instructions: [
        '1. Calculate absolute difference between treatment and control',
        '2. Calculate relative lift (percentage change)',
        '3. Compute confidence intervals for effect size',
        '4. Implement bootstrap resampling for CI if needed',
        '5. Calculate practical significance thresholds',
        '6. Estimate variance using delta method for ratios',
        '7. Compute effect size for all metrics',
        '8. Create effect size visualization',
        '9. Generate effect size report',
        '10. Document estimation methodology'
      ],
      outputFormat: 'JSON object with effect size estimation specification'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'artifacts'],
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              effectSizeMetric: { type: 'string' },
              confidenceIntervalMethod: { type: 'string' }
            }
          },
          description: 'Effect size estimation methods'
        },
        practicalSignificanceThreshold: {
          type: 'object',
          description: 'Thresholds for practical significance'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'effect-size']
}));

export const segmentationAnalysisTask = defineTask('segmentation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Segmentation Analysis - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Engineer',
      task: 'Design segmentation analysis for heterogeneous treatment effects',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        targetMetric: args.targetMetric,
        segments: args.segments
      },
      instructions: [
        '1. Define segments for analysis (platform, user_type, region, etc.)',
        '2. Design queries to compute metrics per segment per variant',
        '3. Implement statistical tests for each segment',
        '4. Check for Simpson\'s paradox across segments',
        '5. Apply Bonferroni correction for multiple comparisons',
        '6. Identify segments with significant treatment effects',
        '7. Design segment analysis dashboard',
        '8. Create segment analysis report template',
        '9. Implement causal forest for HTE estimation (optional)',
        '10. Generate segmentation analysis configuration'
      ],
      outputFormat: 'JSON object with segmentation analysis specification'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'queries', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Segments for analysis'
        },
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              sql: { type: 'string' }
            }
          },
          description: 'SQL queries for segment analysis'
        },
        multipleTestingCorrection: {
          type: 'string',
          description: 'Correction method for multiple comparisons'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'segmentation']
}));

export const guardrailThresholdsTask = defineTask('guardrail-thresholds', (args, taskCtx) => ({
  kind: 'agent',
  title: `Guardrail Thresholds Definition - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Data Scientist',
      task: 'Define guardrail metric thresholds and alert conditions',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        guardrailMetrics: args.guardrailMetrics,
        variants: args.variants
      },
      instructions: [
        '1. For each guardrail metric, define acceptable threshold (e.g., error_rate < 1%)',
        '2. Specify whether threshold is absolute or relative to control',
        '3. Define alert conditions (breach threshold for X consecutive checks)',
        '4. Specify alert severity levels (warning, critical)',
        '5. Design graduated response (warning -> pause -> stop)',
        '6. Add business context for each guardrail',
        '7. Define monitoring frequency for each guardrail',
        '8. Create guardrail violation runbook',
        '9. Implement guardrail evaluation logic',
        '10. Generate guardrail configuration'
      ],
      outputFormat: 'JSON object with guardrail thresholds specification'
    },
    outputSchema: {
      type: 'object',
      required: ['thresholds', 'artifacts'],
      properties: {
        thresholds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              threshold: { type: 'string' },
              comparison: { type: 'string', enum: ['absolute', 'relative'] },
              alertCondition: { type: 'string' },
              severity: { type: 'string', enum: ['warning', 'critical'] }
            }
          },
          description: 'Guardrail thresholds'
        },
        response: {
          type: 'object',
          properties: {
            warning: { type: 'string' },
            critical: { type: 'string' }
          },
          description: 'Response actions per severity'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'guardrails']
}));

export const guardrailMonitoringTask = defineTask('guardrail-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Guardrail Monitoring Pipeline - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Engineer',
      task: 'Implement automated guardrail metrics monitoring pipeline',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        guardrailThresholds: args.guardrailThresholds,
        realtimeMetrics: args.realtimeMetrics,
        checkFrequency: args.checkFrequency
      },
      instructions: [
        '1. Design scheduled job for guardrail evaluation',
        '2. Implement threshold comparison logic',
        '3. Track consecutive threshold breaches',
        '4. Design state machine for guardrail violations',
        '5. Implement alert triggering based on severity',
        '6. Add automatic experiment pause for critical violations',
        '7. Create guardrail monitoring dashboard',
        '8. Implement guardrail history logging',
        '9. Add manual override capability',
        '10. Generate guardrail monitoring configuration'
      ],
      outputFormat: 'JSON object with guardrail monitoring specification'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'checkFrequency', 'artifacts'],
      properties: {
        pipeline: {
          type: 'string',
          description: 'Guardrail monitoring pipeline name'
        },
        checkFrequency: {
          type: 'string',
          description: 'How often guardrails are checked'
        },
        autoActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              action: { type: 'string' }
            }
          },
          description: 'Automated actions based on guardrail status'
        },
        dashboard: {
          type: 'string',
          description: 'Guardrail monitoring dashboard URL'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'monitoring']
}));

export const alertingSystemTask = defineTask('alerting-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Automated Alerting System - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Implement comprehensive alerting system for experiment monitoring',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        guardrailMonitoring: args.guardrailMonitoring,
        srmDetection: args.srmDetection,
        dataQuality: args.dataQuality,
        alertChannels: args.alertChannels
      },
      instructions: [
        '1. Aggregate alerts from guardrail monitoring, SRM detection, and data quality',
        '2. Implement alert routing based on severity and type',
        '3. Configure Slack integration for real-time alerts',
        '4. Configure email integration for digest alerts',
        '5. Configure PagerDuty integration for critical alerts',
        '6. Implement alert deduplication and throttling',
        '7. Add alert context and runbook links',
        '8. Design alert escalation policies',
        '9. Implement alert acknowledgment tracking',
        '10. Generate alerting system configuration'
      ],
      outputFormat: 'JSON object with alerting system specification'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'routing', 'artifacts'],
      properties: {
        channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Configured alert channels'
        },
        routing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alertType: { type: 'string' },
              severity: { type: 'string' },
              channel: { type: 'string' }
            }
          },
          description: 'Alert routing rules'
        },
        escalationPolicy: {
          type: 'object',
          description: 'Escalation policy configuration'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'alerting']
}));

export const dashboardDesignTask = defineTask('dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Results Dashboard Design - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Visualization Engineer',
      task: 'Design comprehensive experiment results dashboard',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        guardrailMetrics: args.guardrailMetrics,
        variants: args.variants,
        statisticalTests: args.statisticalTests
      },
      instructions: [
        '1. Design high-level experiment health scorecard',
        '2. Create time series visualizations for key metrics',
        '3. Design variant comparison tables with statistical results',
        '4. Add confidence interval visualizations',
        '5. Create guardrail metrics monitoring panel',
        '6. Design segment-level analysis views',
        '7. Add SRM and data quality indicators',
        '8. Implement drill-down capabilities',
        '9. Choose dashboard platform (Tableau, Looker, Superset, etc.)',
        '10. Generate dashboard specification and mockups'
      ],
      outputFormat: 'JSON object with dashboard design specification'
    },
    outputSchema: {
      type: 'object',
      required: ['url', 'panels', 'artifacts'],
      properties: {
        url: {
          type: 'string',
          description: 'Dashboard URL (placeholder or actual)'
        },
        platform: {
          type: 'string',
          description: 'Dashboard platform (Tableau, Looker, etc.)'
        },
        panels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              panelName: { type: 'string' },
              visualizationType: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'Dashboard panels'
        },
        refreshFrequency: {
          type: 'string',
          description: 'How often dashboard data refreshes'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts (mockups, specs)'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'dashboard']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Automated Report Generation - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Analyst',
      task: 'Design automated experiment results reporting system',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        resultsDashboard: args.resultsDashboard,
        statisticalTests: args.statisticalTests,
        effectSizeEstimation: args.effectSizeEstimation,
        segmentationAnalysis: args.segmentationAnalysis,
        schedule: args.schedule
      },
      instructions: [
        '1. Design daily summary report (metrics snapshot, alerts, status)',
        '2. Design final experiment report (results, statistical analysis, recommendation)',
        '3. Create report templates (HTML, PDF, Markdown)',
        '4. Implement automated report generation job',
        '5. Add visualizations (metric trends, confidence intervals, segments)',
        '6. Include statistical test results and interpretations',
        '7. Add executive summary section',
        '8. Implement report distribution (email, Slack)',
        '9. Create report archive and versioning',
        '10. Generate report generation configuration'
      ],
      outputFormat: 'JSON object with report generation specification'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'reportTypes', 'artifacts'],
      properties: {
        schedule: {
          type: 'string',
          description: 'Report generation schedule'
        },
        reportTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reportName: { type: 'string' },
              frequency: { type: 'string' },
              format: { type: 'string' },
              distribution: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'Types of reports generated'
        },
        templates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Report template files'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'reporting']
}));

export const decisionSupportTask = defineTask('decision-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Support System - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Scientist',
      task: 'Implement decision support system for experiment conclusions',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        statisticalTests: args.statisticalTests,
        effectSizeEstimation: args.effectSizeEstimation,
        guardrailMonitoring: args.guardrailMonitoring,
        confidenceLevel: args.confidenceLevel
      },
      instructions: [
        '1. Design decision criteria (statistical significance + practical significance + guardrails)',
        '2. Implement automated decision logic (ship, don\'t ship, inconclusive)',
        '3. Calculate confidence in recommendation',
        '4. Identify blocking issues (guardrail violations, data quality)',
        '5. Generate experiment scorecard (pass/fail per criterion)',
        '6. Create decision recommendation with rationale',
        '7. Add cost-benefit analysis if applicable',
        '8. Implement human-in-the-loop approval workflow',
        '9. Generate decision documentation',
        '10. Create decision support system specification'
      ],
      outputFormat: 'JSON object with decision support specification'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'decisionLogic', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              weight: { type: 'number' },
              threshold: { type: 'string' }
            }
          },
          description: 'Decision criteria'
        },
        decisionLogic: {
          type: 'string',
          description: 'Automated decision logic'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          enum: ['ship', 'dont-ship', 'iterate', 'inconclusive'],
          description: 'Possible recommendations'
        },
        approvalWorkflow: {
          type: 'object',
          description: 'Human approval workflow'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'decision']
}));

export const workflowOrchestrationTask = defineTask('workflow-orchestration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Workflow Orchestration - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Platform Engineer',
      task: 'Design workflow orchestration for all pipeline components',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        pipelines: args.pipelines,
        orchestrator: args.orchestrator
      },
      instructions: [
        '1. Design DAG (Directed Acyclic Graph) for pipeline dependencies',
        '2. Define task execution order and parallelization',
        '3. Implement dependency resolution between pipelines',
        '4. Add retry logic and error handling',
        '5. Configure SLA monitoring for each task',
        '6. Implement sensor tasks for event-driven triggers',
        '7. Add data quality gates between stages',
        '8. Configure alerting for pipeline failures',
        '9. Generate Airflow DAG or equivalent orchestration code',
        '10. Create orchestration documentation'
      ],
      outputFormat: 'JSON object with workflow orchestration specification'
    },
    outputSchema: {
      type: 'object',
      required: ['dag', 'orchestrator', 'artifacts'],
      properties: {
        dag: {
          type: 'string',
          description: 'DAG name or identifier'
        },
        orchestrator: {
          type: 'string',
          description: 'Orchestration platform (Airflow, Prefect, etc.)'
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskType: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'Orchestrated tasks'
        },
        schedule: {
          type: 'string',
          description: 'DAG schedule (cron expression)'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts (DAG code)'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'orchestration']
}));

export const pipelineObservabilityTask = defineTask('pipeline-observability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Monitoring and Observability - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Site Reliability Engineer',
      task: 'Implement observability for all pipeline components',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        workflowOrchestration: args.workflowOrchestration,
        metrics: args.metrics
      },
      instructions: [
        '1. Define pipeline health metrics (latency, throughput, error rate, data quality)',
        '2. Implement metrics collection for each pipeline component',
        '3. Design pipeline monitoring dashboard',
        '4. Add distributed tracing for end-to-end visibility',
        '5. Implement log aggregation and structured logging',
        '6. Set up alerting for pipeline anomalies',
        '7. Add SLA monitoring and SLO tracking',
        '8. Implement pipeline health scoring',
        '9. Create troubleshooting runbook',
        '10. Generate observability configuration'
      ],
      outputFormat: 'JSON object with pipeline observability specification'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'dashboards', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              component: { type: 'string' },
              threshold: { type: 'string' }
            }
          },
          description: 'Pipeline health metrics'
        },
        dashboards: {
          type: 'array',
          items: { type: 'string' },
          description: 'Monitoring dashboard URLs'
        },
        tracing: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            backend: { type: 'string' }
          },
          description: 'Distributed tracing configuration'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'observability']
}));

export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Testing - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Engineer',
      task: 'Design and execute integration tests for the A/B testing pipeline',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        assignmentService: args.assignmentService,
        eventCollection: args.eventCollection,
        metricCalculation: args.metricCalculation,
        testScenarios: args.testScenarios
      },
      instructions: [
        '1. Design happy path test scenario (normal experiment flow)',
        '2. Design edge case tests (boundary conditions, corner cases)',
        '3. Design failure mode tests (service failures, data corruption)',
        '4. Test assignment service consistency and correctness',
        '5. Test event collection pipeline idempotency',
        '6. Test metric calculation accuracy with known inputs',
        '7. Test SRM detection with imbalanced assignments',
        '8. Test guardrail alerting with threshold breaches',
        '9. Execute all test scenarios and collect results',
        '10. Generate test report with pass/fail status'
      ],
      outputFormat: 'JSON object with integration testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'testResults', 'artifacts'],
      properties: {
        allTestsPassed: {
          type: 'boolean',
          description: 'Whether all tests passed'
        },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              scenario: { type: 'string' },
              status: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
              details: { type: 'string' }
            }
          },
          description: 'Individual test results'
        },
        failedTests: {
          type: 'array',
          items: { type: 'string' },
          description: 'Names of failed tests'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts (test logs, reports)'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'testing']
}));

export const deploymentPlanTask = defineTask('deployment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deployment Plan - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Release Manager',
      task: 'Create deployment plan for A/B testing pipeline',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        components: args.components,
        rolloutStrategy: args.rolloutStrategy
      },
      instructions: [
        '1. List all components to deploy (services, pipelines, dashboards)',
        '2. Define deployment order with dependencies',
        '3. Design rollout strategy (big bang, gradual, blue-green)',
        '4. Create deployment checklist',
        '5. Define rollback procedures for each component',
        '6. Specify deployment validation steps',
        '7. Create smoke tests for post-deployment validation',
        '8. Define monitoring during deployment',
        '9. Plan deployment communication to stakeholders',
        '10. Generate deployment runbook'
      ],
      outputFormat: 'JSON object with deployment plan'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'strategy', 'artifacts'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              deploymentOrder: { type: 'number' }
            }
          },
          description: 'Components to deploy'
        },
        strategy: {
          type: 'string',
          enum: ['big-bang', 'gradual', 'blue-green', 'canary'],
          description: 'Deployment strategy'
        },
        rollbackProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              procedure: { type: 'string' }
            }
          },
          description: 'Rollback procedures per component'
        },
        validationSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Post-deployment validation steps'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated artifacts (runbook, checklists)'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'deployment']
}));

export const runbookGenerationTask = defineTask('runbook-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Runbook and Documentation - ${args.experimentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and SRE',
      task: 'Generate comprehensive runbook and documentation for the A/B testing pipeline',
      context: {
        projectName: args.projectName,
        experimentName: args.experimentName,
        architecture: args.architecture,
        monitoring: args.monitoring,
        troubleshooting: args.troubleshooting
      },
      instructions: [
        '1. Create architecture documentation with system diagrams',
        '2. Document all pipeline components and their responsibilities',
        '3. Create operational runbook with common procedures',
        '4. Document troubleshooting guide for common issues',
        '5. Add monitoring and alerting documentation',
        '6. Create incident response procedures',
        '7. Document rollback and recovery procedures',
        '8. Add FAQ section for common questions',
        '9. Create API documentation for all services',
        '10. Generate complete documentation package'
      ],
      outputFormat: 'JSON object with runbook and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['path', 'sections', 'artifacts'],
      properties: {
        path: {
          type: 'string',
          description: 'Path to main runbook file'
        },
        sections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Runbook sections'
        },
        architectureDiagrams: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to architecture diagrams'
        },
        apiDocumentation: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to API documentation'
        },
        artifacts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated documentation artifacts'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'documentation']
}));

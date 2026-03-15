/**
 * @process specializations/code-migration-modernization/logging-observability-migration
 * @description Logging and Observability Migration - Process for modernizing logging, monitoring, and
 * observability from legacy approaches to structured logging, distributed tracing, and centralized
 * monitoring with proper correlation.
 * @inputs { projectName: string, currentLogging?: object, targetStack?: object, services?: array }
 * @outputs { success: boolean, loggingAnalysis: object, observabilityPlan: object, implementedFeatures: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/logging-observability-migration', {
 *   projectName: 'Observability Modernization',
 *   currentLogging: { type: 'file-based', format: 'unstructured' },
 *   targetStack: { logging: 'ELK', tracing: 'Jaeger', metrics: 'Prometheus' },
 *   services: ['api-gateway', 'order-service', 'payment-service']
 * });
 *
 * @references
 * - OpenTelemetry: https://opentelemetry.io/
 * - ELK Stack: https://www.elastic.co/elastic-stack
 * - Structured Logging: https://stackify.com/what-is-structured-logging-and-why-developers-need-it/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentLogging = {},
    targetStack = {},
    services = [],
    outputDir = 'observability-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Logging and Observability Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: LOGGING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current logging');
  const loggingAnalysis = await ctx.task(loggingAnalysisTask, {
    projectName,
    currentLogging,
    services,
    outputDir
  });

  artifacts.push(...loggingAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: OBSERVABILITY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing observability stack');
  const observabilityDesign = await ctx.task(observabilityDesignTask, {
    projectName,
    loggingAnalysis,
    targetStack,
    services,
    outputDir
  });

  artifacts.push(...observabilityDesign.artifacts);

  // Breakpoint: Design review
  await ctx.breakpoint({
    question: `Observability design complete for ${projectName}. Stack: ${observabilityDesign.stackDescription}. Services: ${services.length}. Approve design?`,
    title: 'Observability Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      observabilityDesign,
      recommendation: 'Review stack components and integration plan'
    }
  });

  // ============================================================================
  // PHASE 3: STRUCTURED LOGGING IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing structured logging');
  const structuredLogging = await ctx.task(structuredLoggingImplementationTask, {
    projectName,
    observabilityDesign,
    services,
    outputDir
  });

  artifacts.push(...structuredLogging.artifacts);

  // ============================================================================
  // PHASE 4: DISTRIBUTED TRACING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up distributed tracing');
  const distributedTracing = await ctx.task(distributedTracingSetupTask, {
    projectName,
    observabilityDesign,
    services,
    outputDir
  });

  artifacts.push(...distributedTracing.artifacts);

  // ============================================================================
  // PHASE 5: METRICS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing metrics');
  const metricsImplementation = await ctx.task(metricsImplementationTask, {
    projectName,
    observabilityDesign,
    services,
    outputDir
  });

  artifacts.push(...metricsImplementation.artifacts);

  // ============================================================================
  // PHASE 6: CENTRALIZED COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up centralized collection');
  const centralizedCollection = await ctx.task(centralizedCollectionTask, {
    projectName,
    structuredLogging,
    distributedTracing,
    metricsImplementation,
    outputDir
  });

  artifacts.push(...centralizedCollection.artifacts);

  // ============================================================================
  // PHASE 7: DASHBOARDS AND ALERTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating dashboards and alerts');
  const dashboardsAlerts = await ctx.task(dashboardsAlertsTask, {
    projectName,
    centralizedCollection,
    services,
    outputDir
  });

  artifacts.push(...dashboardsAlerts.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Observability migration complete for ${projectName}. Services instrumented: ${services.length}. Dashboards: ${dashboardsAlerts.dashboardCount}. Alerts: ${dashboardsAlerts.alertCount}. Approve?`,
    title: 'Observability Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        services: services.length,
        dashboards: dashboardsAlerts.dashboardCount,
        alerts: dashboardsAlerts.alertCount
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    loggingAnalysis,
    observabilityPlan: observabilityDesign,
    implementedFeatures: {
      structuredLogging,
      distributedTracing,
      metricsImplementation,
      centralizedCollection,
      dashboardsAlerts
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/logging-observability-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const loggingAnalysisTask = defineTask('logging-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Logging Analysis - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Observability Analyst',
      task: 'Analyze current logging implementation',
      context: args,
      instructions: [
        '1. Document current logging',
        '2. Analyze log formats',
        '3. Identify log levels usage',
        '4. Map log destinations',
        '5. Assess log volume',
        '6. Identify gaps',
        '7. Review retention policies',
        '8. Assess searchability',
        '9. Document pain points',
        '10. Generate analysis report'
      ],
      outputFormat: 'JSON with currentFormat, logVolume, destinations, gaps, painPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentFormat', 'logVolume', 'artifacts'],
      properties: {
        currentFormat: { type: 'string' },
        logVolume: { type: 'string' },
        destinations: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'object' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['observability-migration', 'logging', 'analysis']
}));

export const observabilityDesignTask = defineTask('observability-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Observability Design - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Observability Architect',
      task: 'Design observability stack',
      context: args,
      instructions: [
        '1. Select logging stack',
        '2. Choose tracing solution',
        '3. Select metrics system',
        '4. Design correlation strategy',
        '5. Plan collection agents',
        '6. Design retention policies',
        '7. Plan dashboards',
        '8. Design alerting',
        '9. Plan cost management',
        '10. Generate design document'
      ],
      outputFormat: 'JSON with stackDescription, components, correlationStrategy, retentionPolicy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stackDescription', 'components', 'artifacts'],
      properties: {
        stackDescription: { type: 'string' },
        components: { type: 'object' },
        correlationStrategy: { type: 'object' },
        retentionPolicy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['observability-migration', 'design', 'architecture']
}));

export const structuredLoggingImplementationTask = defineTask('structured-logging-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Structured Logging Implementation - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Developer',
      task: 'Implement structured logging',
      context: args,
      instructions: [
        '1. Configure logging library',
        '2. Implement JSON format',
        '3. Add correlation IDs',
        '4. Standardize log levels',
        '5. Add context fields',
        '6. Implement PII handling',
        '7. Configure log shipping',
        '8. Test logging',
        '9. Document standards',
        '10. Generate implementation report'
      ],
      outputFormat: 'JSON with servicesUpdated, logFormat, correlationEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['servicesUpdated', 'logFormat', 'artifacts'],
      properties: {
        servicesUpdated: { type: 'number' },
        logFormat: { type: 'string' },
        correlationEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['observability-migration', 'logging', 'implementation']
}));

export const distributedTracingSetupTask = defineTask('distributed-tracing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Distributed Tracing Setup - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'SRE Engineer',
      task: 'Set up distributed tracing',
      context: args,
      instructions: [
        '1. Install tracing SDK',
        '2. Configure trace propagation',
        '3. Instrument services',
        '4. Set up trace collector',
        '5. Configure sampling',
        '6. Add custom spans',
        '7. Set up trace UI',
        '8. Test trace correlation',
        '9. Document setup',
        '10. Generate tracing report'
      ],
      outputFormat: 'JSON with servicesInstrumented, tracingTool, samplingRate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['servicesInstrumented', 'tracingTool', 'artifacts'],
      properties: {
        servicesInstrumented: { type: 'number' },
        tracingTool: { type: 'string' },
        samplingRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['observability-migration', 'tracing', 'setup']
}));

export const metricsImplementationTask = defineTask('metrics-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Metrics Implementation - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Metrics Engineer',
      task: 'Implement application metrics',
      context: args,
      instructions: [
        '1. Define key metrics',
        '2. Implement RED metrics',
        '3. Add custom metrics',
        '4. Set up metrics endpoint',
        '5. Configure scraping',
        '6. Add labels',
        '7. Implement SLI metrics',
        '8. Test metrics collection',
        '9. Document metrics',
        '10. Generate metrics report'
      ],
      outputFormat: 'JSON with metricsCount, servicesWithMetrics, redMetrics, sliMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsCount', 'servicesWithMetrics', 'artifacts'],
      properties: {
        metricsCount: { type: 'number' },
        servicesWithMetrics: { type: 'number' },
        redMetrics: { type: 'boolean' },
        sliMetrics: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['observability-migration', 'metrics', 'implementation']
}));

export const centralizedCollectionTask = defineTask('centralized-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Centralized Collection - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Platform Engineer',
      task: 'Set up centralized collection',
      context: args,
      instructions: [
        '1. Deploy log aggregator',
        '2. Set up trace collector',
        '3. Deploy metrics server',
        '4. Configure data pipelines',
        '5. Set up correlation',
        '6. Configure retention',
        '7. Set up backups',
        '8. Test data flow',
        '9. Document architecture',
        '10. Generate collection report'
      ],
      outputFormat: 'JSON with logsCollected, tracesCollected, metricsCollected, correlationWorking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['logsCollected', 'tracesCollected', 'metricsCollected', 'artifacts'],
      properties: {
        logsCollected: { type: 'boolean' },
        tracesCollected: { type: 'boolean' },
        metricsCollected: { type: 'boolean' },
        correlationWorking: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['observability-migration', 'collection', 'centralization']
}));

export const dashboardsAlertsTask = defineTask('dashboards-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Dashboards and Alerts - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Observability Engineer',
      task: 'Create dashboards and alerts',
      context: args,
      instructions: [
        '1. Create service dashboards',
        '2. Build system overview',
        '3. Create SLO dashboards',
        '4. Set up alert rules',
        '5. Configure notification channels',
        '6. Create runbooks',
        '7. Test alerting',
        '8. Document dashboards',
        '9. Train team',
        '10. Generate dashboard report'
      ],
      outputFormat: 'JSON with dashboardCount, alertCount, notificationChannels, runbooks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardCount', 'alertCount', 'artifacts'],
      properties: {
        dashboardCount: { type: 'number' },
        alertCount: { type: 'number' },
        notificationChannels: { type: 'array', items: { type: 'string' } },
        runbooks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['observability-migration', 'dashboards', 'alerting']
}));

/**
 * @process specializations/ai-agents-conversational/llm-observability-monitoring
 * @description LLM Observability and Monitoring - Process for implementing comprehensive observability
 * for LLM applications including request tracing, token usage tracking, latency monitoring, and quality metrics.
 * @inputs { systemName?: string, observabilityTools?: array, metricsConfig?: object, outputDir?: string }
 * @outputs { success: boolean, tracingSetup: object, metricsConfig: object, dashboards: array, alerts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/llm-observability-monitoring', {
 *   systemName: 'production-agent',
 *   observabilityTools: ['langsmith', 'langfuse', 'opentelemetry'],
 *   metricsConfig: { enableTokenTracking: true, enableLatencyHistograms: true }
 * });
 *
 * @references
 * - LangSmith: https://docs.smith.langchain.com/
 * - Langfuse: https://langfuse.com/docs
 * - OpenTelemetry: https://opentelemetry.io/docs/
 * - Helicone: https://docs.helicone.ai/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'llm-observability',
    observabilityTools = ['langfuse'],
    metricsConfig = {},
    outputDir = 'observability-output',
    enableTracing = true,
    enableCostTracking = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LLM Observability Setup for ${systemName}`);

  // ============================================================================
  // PHASE 1: TRACING INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up tracing infrastructure');

  const tracingSetup = await ctx.task(tracingInfrastructureTask, {
    systemName,
    observabilityTools,
    outputDir
  });

  artifacts.push(...tracingSetup.artifacts);

  // ============================================================================
  // PHASE 2: TOKEN USAGE TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing token usage tracking');

  const tokenTracking = await ctx.task(tokenUsageTrackingTask, {
    systemName,
    enableCostTracking,
    outputDir
  });

  artifacts.push(...tokenTracking.artifacts);

  // ============================================================================
  // PHASE 3: LATENCY MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up latency monitoring');

  const latencyMonitoring = await ctx.task(latencyMonitoringTask, {
    systemName,
    metricsConfig,
    outputDir
  });

  artifacts.push(...latencyMonitoring.artifacts);

  // ============================================================================
  // PHASE 4: QUALITY METRICS
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing quality metrics');

  const qualityMetrics = await ctx.task(qualityMetricsTask, {
    systemName,
    outputDir
  });

  artifacts.push(...qualityMetrics.artifacts);

  // ============================================================================
  // PHASE 5: LOGGING PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up logging pipeline');

  const loggingPipeline = await ctx.task(loggingPipelineTask, {
    systemName,
    outputDir
  });

  artifacts.push(...loggingPipeline.artifacts);

  // ============================================================================
  // PHASE 6: DASHBOARDS AND ALERTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating dashboards and alerts');

  const dashboardsAlerts = await ctx.task(dashboardsAlertsTask, {
    systemName,
    tracingSetup: tracingSetup.config,
    tokenTracking: tokenTracking.metrics,
    latencyMonitoring: latencyMonitoring.config,
    qualityMetrics: qualityMetrics.metrics,
    outputDir
  });

  artifacts.push(...dashboardsAlerts.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `LLM observability for ${systemName} complete. Tools: ${observabilityTools.join(', ')}. Review observability setup?`,
    title: 'LLM Observability Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        observabilityTools,
        enableTracing,
        enableCostTracking,
        dashboardCount: dashboardsAlerts.dashboards.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    tracingSetup: tracingSetup.config,
    metricsConfig: {
      tokens: tokenTracking.metrics,
      latency: latencyMonitoring.config,
      quality: qualityMetrics.metrics
    },
    dashboards: dashboardsAlerts.dashboards,
    alerts: dashboardsAlerts.alerts,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/llm-observability-monitoring',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const tracingInfrastructureTask = defineTask('tracing-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Tracing Infrastructure - ${args.systemName}`,
  agent: {
    name: 'observability-engineer',  // AG-OPS-004: Sets up tracing, logging, and monitoring
    prompt: {
      role: 'Tracing Developer',
      task: 'Setup distributed tracing for LLM applications',
      context: args,
      instructions: [
        '1. Configure OpenTelemetry',
        '2. Setup LangSmith/Langfuse integration',
        '3. Implement trace propagation',
        '4. Add span attributes for LLM calls',
        '5. Configure trace sampling',
        '6. Setup trace visualization',
        '7. Add trace search and filtering',
        '8. Save tracing configuration'
      ],
      outputFormat: 'JSON with tracing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        tracingCodePath: { type: 'string' },
        integrations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability', 'tracing']
}));

export const tokenUsageTrackingTask = defineTask('token-usage-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Token Usage Tracking - ${args.systemName}`,
  agent: {
    name: 'token-tracker',
    prompt: {
      role: 'Token Usage Developer',
      task: 'Implement token usage tracking',
      context: args,
      instructions: [
        '1. Track input/output tokens',
        '2. Calculate cost per request',
        '3. Aggregate by user/session',
        '4. Track context window usage',
        '5. Implement budget tracking',
        '6. Add usage forecasting',
        '7. Create usage reports',
        '8. Save token tracking config'
      ],
      outputFormat: 'JSON with token tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        trackingCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability', 'tokens']
}));

export const latencyMonitoringTask = defineTask('latency-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Latency Monitoring - ${args.systemName}`,
  agent: {
    name: 'latency-developer',
    prompt: {
      role: 'Latency Monitoring Developer',
      task: 'Setup latency monitoring for LLM calls',
      context: args,
      instructions: [
        '1. Measure time-to-first-token',
        '2. Track total response time',
        '3. Create latency histograms',
        '4. Track P50/P95/P99 latencies',
        '5. Monitor by model/endpoint',
        '6. Add latency breakdowns',
        '7. Configure SLO tracking',
        '8. Save latency monitoring config'
      ],
      outputFormat: 'JSON with latency monitoring'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        monitoringCodePath: { type: 'string' },
        slos: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability', 'latency']
}));

export const qualityMetricsTask = defineTask('quality-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Quality Metrics - ${args.systemName}`,
  agent: {
    name: 'quality-developer',
    prompt: {
      role: 'Quality Metrics Developer',
      task: 'Implement LLM output quality metrics',
      context: args,
      instructions: [
        '1. Track response relevance',
        '2. Monitor hallucination rates',
        '3. Track user feedback',
        '4. Measure task success',
        '5. Track safety violations',
        '6. Add sentiment analysis',
        '7. Create quality scores',
        '8. Save quality metrics config'
      ],
      outputFormat: 'JSON with quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        metricsCodePath: { type: 'string' },
        qualityScore: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability', 'quality']
}));

export const loggingPipelineTask = defineTask('logging-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Logging Pipeline - ${args.systemName}`,
  agent: {
    name: 'logging-developer',
    prompt: {
      role: 'Logging Developer',
      task: 'Setup structured logging pipeline',
      context: args,
      instructions: [
        '1. Define log schema',
        '2. Configure structured logging',
        '3. Add request/response logging',
        '4. Implement PII redaction',
        '5. Setup log aggregation',
        '6. Configure retention policies',
        '7. Add search and filtering',
        '8. Save logging configuration'
      ],
      outputFormat: 'JSON with logging pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        loggingCodePath: { type: 'string' },
        schema: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability', 'logging']
}));

export const dashboardsAlertsTask = defineTask('dashboards-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Dashboards and Alerts - ${args.systemName}`,
  agent: {
    name: 'dashboard-developer',
    prompt: {
      role: 'Dashboard Developer',
      task: 'Create observability dashboards and alerts',
      context: args,
      instructions: [
        '1. Design dashboard layout',
        '2. Create metrics visualizations',
        '3. Add tracing views',
        '4. Configure alert rules',
        '5. Setup notification channels',
        '6. Add anomaly detection',
        '7. Create on-call runbooks',
        '8. Save dashboards and alerts'
      ],
      outputFormat: 'JSON with dashboards and alerts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'alerts', 'artifacts'],
      properties: {
        dashboards: { type: 'array' },
        alerts: { type: 'array' },
        dashboardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability', 'dashboards']
}));

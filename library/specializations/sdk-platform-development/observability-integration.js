/**
 * @process specializations/sdk-platform-development/observability-integration
 * @description Implements comprehensive observability integration for SDKs using
 *              OpenTelemetry standards, including distributed tracing, metrics,
 *              and log correlation for full-stack visibility.
 * @inputs {
 *   sdkName: string,
 *   languages: string[],
 *   observabilityStack: string[],
 *   tracingBackends: string[],
 *   metricsBackends: string[]
 * }
 * @outputs {
 *   openTelemetryIntegration: object,
 *   tracingSetup: object,
 *   metricsSetup: object,
 *   correlationSetup: object
 * }
 * @example
 *   inputs: {
 *     sdkName: "microservices-sdk",
 *     languages: ["typescript", "java", "go", "python"],
 *     observabilityStack: ["opentelemetry", "prometheus", "jaeger"],
 *     tracingBackends: ["jaeger", "zipkin", "datadog"],
 *     metricsBackends: ["prometheus", "cloudwatch", "datadog"]
 *   }
 * @references
 *   - https://opentelemetry.io/docs/
 *   - https://www.jaegertracing.io/docs/
 *   - https://prometheus.io/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { sdkName, languages, observabilityStack, tracingBackends, metricsBackends } = inputs;

  ctx.log.info('Starting observability integration', {
    sdkName,
    languages,
    observabilityStack
  });

  // Phase 1: OpenTelemetry Integration
  ctx.log.info('Phase 1: Integrating OpenTelemetry');
  const openTelemetrySetup = await ctx.task(openTelemetryIntegrationTask, {
    sdkName,
    languages,
    observabilityStack
  });

  // Phase 2: Distributed Tracing Setup
  ctx.log.info('Phase 2: Setting up distributed tracing');
  const tracingSetup = await ctx.task(distributedTracingSetupTask, {
    sdkName,
    languages,
    tracingBackends,
    otelSetup: openTelemetrySetup.result
  });

  // Phase 3: Metrics Instrumentation
  ctx.log.info('Phase 3: Instrumenting metrics');
  const metricsSetup = await ctx.task(metricsInstrumentationTask, {
    sdkName,
    languages,
    metricsBackends,
    otelSetup: openTelemetrySetup.result
  });

  // Phase 4: Log Correlation
  ctx.log.info('Phase 4: Setting up log correlation');
  const logCorrelation = await ctx.task(logCorrelationSetupTask, {
    sdkName,
    languages,
    tracingSetup: tracingSetup.result
  });

  // Phase 5: Observability Dashboards
  ctx.log.info('Phase 5: Creating observability dashboards');
  const dashboards = await ctx.task(observabilityDashboardsTask, {
    sdkName,
    tracingBackends,
    metricsBackends,
    metricsSetup: metricsSetup.result
  });

  // Quality Gate
  await ctx.breakpoint('observability-review', {
    question: 'Review the observability integration. Is distributed tracing properly configured with context propagation?',
    context: {
      openTelemetrySetup: openTelemetrySetup.result,
      tracingSetup: tracingSetup.result,
      metricsSetup: metricsSetup.result
    }
  });

  ctx.log.info('Observability integration completed');

  return {
    openTelemetryIntegration: openTelemetrySetup.result,
    tracingSetup: tracingSetup.result,
    metricsSetup: metricsSetup.result,
    correlationSetup: logCorrelation.result,
    dashboards: dashboards.result
  };
}

export const openTelemetryIntegrationTask = defineTask('opentelemetry-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate OpenTelemetry',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'OpenTelemetry integration specialist',
      task: `Integrate OpenTelemetry into ${args.sdkName}`,
      context: {
        languages: args.languages,
        observabilityStack: args.observabilityStack
      },
      instructions: [
        'Design OpenTelemetry SDK integration for each language',
        'Configure trace, metric, and log providers',
        'Set up context propagation (W3C Trace Context, B3)',
        'Implement resource detection (service name, version, environment)',
        'Configure exporters (OTLP, Jaeger, Zipkin)',
        'Design auto-instrumentation hooks',
        'Create manual instrumentation helpers'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        sdkIntegration: { type: 'object' },
        providers: { type: 'object' },
        contextPropagation: { type: 'object' },
        resourceDetection: { type: 'object' },
        exporters: { type: 'array' },
        instrumentationHooks: { type: 'object' }
      },
      required: ['sdkIntegration', 'providers', 'contextPropagation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'opentelemetry', 'integration']
}));

export const distributedTracingSetupTask = defineTask('distributed-tracing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup distributed tracing',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Distributed tracing engineer',
      task: `Setup distributed tracing for ${args.sdkName}`,
      context: {
        languages: args.languages,
        tracingBackends: args.tracingBackends,
        otelSetup: args.otelSetup
      },
      instructions: [
        'Create span creation helpers for SDK operations',
        'Implement span attributes and events',
        'Design span links for async operations',
        'Configure sampling strategies (always, ratio, parent-based)',
        'Set up baggage propagation for cross-cutting concerns',
        'Create tracing middleware/interceptors',
        'Implement span status and error recording'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        spanHelpers: { type: 'object' },
        attributeSchemas: { type: 'object' },
        samplingStrategies: { type: 'object' },
        baggagePropagation: { type: 'object' },
        middlewareIntegration: { type: 'object' }
      },
      required: ['spanHelpers', 'attributeSchemas', 'samplingStrategies']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'tracing', 'distributed-systems']
}));

export const metricsInstrumentationTask = defineTask('metrics-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Instrument SDK metrics',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Metrics engineering specialist',
      task: `Instrument metrics for ${args.sdkName}`,
      context: {
        languages: args.languages,
        metricsBackends: args.metricsBackends,
        otelSetup: args.otelSetup
      },
      instructions: [
        'Define SDK metric instruments (counters, histograms, gauges)',
        'Create standard SDK metrics (request count, latency, errors)',
        'Implement metric views and aggregations',
        'Configure metric exporters for each backend',
        'Design metric cardinality management',
        'Create custom metric registration API',
        'Implement exemplars linking metrics to traces'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        metricInstruments: { type: 'object' },
        standardMetrics: { type: 'array' },
        views: { type: 'object' },
        exporterConfig: { type: 'object' },
        cardinalityManagement: { type: 'object' },
        exemplars: { type: 'object' }
      },
      required: ['metricInstruments', 'standardMetrics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'metrics', 'instrumentation']
}));

export const logCorrelationSetupTask = defineTask('log-correlation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup log correlation',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Observability correlation engineer',
      task: `Setup log correlation for ${args.sdkName}`,
      context: {
        languages: args.languages,
        tracingSetup: args.tracingSetup
      },
      instructions: [
        'Inject trace and span IDs into log records',
        'Create log-to-trace linking helpers',
        'Design structured log format with trace context',
        'Implement log level to span event mapping',
        'Configure log exporters with trace correlation',
        'Create unified query helpers (find logs for trace)',
        'Design correlation ID propagation across services'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        traceIdInjection: { type: 'object' },
        logToTraceLinks: { type: 'object' },
        structuredLogFormat: { type: 'object' },
        logExporters: { type: 'array' },
        correlationHelpers: { type: 'object' }
      },
      required: ['traceIdInjection', 'structuredLogFormat']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'logging', 'correlation']
}));

export const observabilityDashboardsTask = defineTask('observability-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create observability dashboards',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Observability dashboard specialist',
      task: `Create observability dashboards for ${args.sdkName}`,
      context: {
        tracingBackends: args.tracingBackends,
        metricsBackends: args.metricsBackends,
        metricsSetup: args.metricsSetup
      },
      instructions: [
        'Design Grafana dashboards for SDK metrics',
        'Create Jaeger/Zipkin trace exploration views',
        'Build RED metrics dashboard (Rate, Errors, Duration)',
        'Create service dependency graphs',
        'Design alerting rules for SLOs',
        'Build log correlation dashboard',
        'Create runbook links for common issues'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        grafanaDashboards: { type: 'array' },
        traceViews: { type: 'object' },
        redDashboard: { type: 'object' },
        dependencyGraphs: { type: 'object' },
        alertingRules: { type: 'array' }
      },
      required: ['grafanaDashboards', 'redDashboard']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'dashboards', 'observability']
}));

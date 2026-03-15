/**
 * @process specializations/performance-optimization/performance-slo-definition
 * @description Performance SLO Definition - Define Service Level Objectives for performance metrics including
 * latency SLOs (p50, p95, p99), throughput SLOs, error rate thresholds, SLO monitoring dashboards, and alerting.
 * @inputs { projectName: string, services: array, targetLatencyP95?: number, targetLatencyP99?: number }
 * @outputs { success: boolean, slos: array, dashboards: array, alerts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/performance-slo-definition', {
 *   projectName: 'API Gateway',
 *   services: ['auth-service', 'data-service', 'gateway'],
 *   targetLatencyP95: 200,
 *   targetLatencyP99: 500,
 *   targetThroughput: 10000,
 *   targetErrorRate: 0.1
 * });
 *
 * @references
 * - Google SRE Book - SLOs: https://sre.google/sre-book/service-level-objectives/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    services = [],
    targetLatencyP95 = 200,
    targetLatencyP99 = 500,
    targetThroughput = 1000,
    targetErrorRate = 1.0,
    outputDir = 'performance-slo-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance SLO Definition for ${projectName}`);

  // Phase 1: Analyze Historical Performance Data
  const historicalAnalysis = await ctx.task(analyzeHistoricalDataTask, {
    projectName, services, outputDir
  });
  artifacts.push(...historicalAnalysis.artifacts);

  // Phase 2: Identify User-Facing Performance Metrics
  const metricsIdentification = await ctx.task(identifyPerformanceMetricsTask, {
    projectName, services, historicalAnalysis, outputDir
  });
  artifacts.push(...metricsIdentification.artifacts);

  // Phase 3: Define Latency SLOs
  const latencySLOs = await ctx.task(defineLatencySLOsTask, {
    projectName, services, targetLatencyP95, targetLatencyP99, historicalAnalysis, outputDir
  });
  artifacts.push(...latencySLOs.artifacts);

  await ctx.breakpoint({
    question: `Latency SLOs defined: P95=${targetLatencyP95}ms, P99=${targetLatencyP99}ms. Review and approve?`,
    title: 'Latency SLO Review',
    context: { runId: ctx.runId, slos: latencySLOs.slos }
  });

  // Phase 4: Define Throughput SLOs
  const throughputSLOs = await ctx.task(defineThroughputSLOsTask, {
    projectName, services, targetThroughput, outputDir
  });
  artifacts.push(...throughputSLOs.artifacts);

  // Phase 5: Set Error Rate Thresholds
  const errorSLOs = await ctx.task(defineErrorRateSLOsTask, {
    projectName, services, targetErrorRate, outputDir
  });
  artifacts.push(...errorSLOs.artifacts);

  // Phase 6: Create SLO Monitoring Dashboards
  const dashboards = await ctx.task(createSLODashboardsTask, {
    projectName, latencySLOs, throughputSLOs, errorSLOs, outputDir
  });
  artifacts.push(...dashboards.artifacts);

  // Phase 7: Implement SLO Alerting
  const alerts = await ctx.task(implementSLOAlertingTask, {
    projectName, latencySLOs, throughputSLOs, errorSLOs, outputDir
  });
  artifacts.push(...alerts.artifacts);

  // Phase 8: Document SLO Definitions
  const documentation = await ctx.task(documentSLODefinitionsTask, {
    projectName, latencySLOs, throughputSLOs, errorSLOs, dashboards, alerts, outputDir
  });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Performance SLOs defined with ${dashboards.dashboards.length} dashboards and ${alerts.alerts.length} alerts. Approve?`,
    title: 'Final SLO Review',
    context: { runId: ctx.runId, summary: { latencySLOs: latencySLOs.slos.length, throughputSLOs: throughputSLOs.slos.length, errorSLOs: errorSLOs.slos.length } }
  });

  return {
    success: true,
    projectName,
    slos: [...latencySLOs.slos, ...throughputSLOs.slos, ...errorSLOs.slos],
    dashboards: dashboards.dashboards,
    alerts: alerts.alerts,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/performance-optimization/performance-slo-definition',
      timestamp: startTime,
      outputDir
    }
  };
}

export const analyzeHistoricalDataTask = defineTask('analyze-historical-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Historical Data - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Analyze historical performance data',
      context: args,
      instructions: [
        '1. Collect historical latency data',
        '2. Analyze percentile distributions',
        '3. Identify performance patterns',
        '4. Calculate baseline statistics',
        '5. Document historical trends'
      ],
      outputFormat: 'JSON with historical analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'analysis']
}));

export const identifyPerformanceMetricsTask = defineTask('identify-performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Performance Metrics - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Identify user-facing performance metrics',
      context: args,
      instructions: [
        '1. Identify latency metrics',
        '2. Identify throughput metrics',
        '3. Identify error rate metrics',
        '4. Map metrics to user experience',
        '5. Prioritize metrics by impact'
      ],
      outputFormat: 'JSON with metrics identification'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'metrics']
}));

export const defineLatencySLOsTask = defineTask('define-latency-slos', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Latency SLOs - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Define latency SLOs',
      context: args,
      instructions: [
        '1. Define P50 latency targets',
        '2. Define P95 latency targets',
        '3. Define P99 latency targets',
        '4. Set measurement windows',
        '5. Document SLO rationale'
      ],
      outputFormat: 'JSON with latency SLOs'
    },
    outputSchema: {
      type: 'object',
      required: ['slos', 'artifacts'],
      properties: {
        slos: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'latency']
}));

export const defineThroughputSLOsTask = defineTask('define-throughput-slos', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Throughput SLOs - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Define throughput SLOs',
      context: args,
      instructions: [
        '1. Define requests per second targets',
        '2. Define transaction throughput targets',
        '3. Set capacity thresholds',
        '4. Document throughput requirements'
      ],
      outputFormat: 'JSON with throughput SLOs'
    },
    outputSchema: {
      type: 'object',
      required: ['slos', 'artifacts'],
      properties: {
        slos: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'throughput']
}));

export const defineErrorRateSLOsTask = defineTask('define-error-rate-slos', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Error Rate SLOs - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Define error rate SLOs',
      context: args,
      instructions: [
        '1. Set error rate thresholds',
        '2. Define error categories',
        '3. Set availability targets',
        '4. Document error budgets'
      ],
      outputFormat: 'JSON with error rate SLOs'
    },
    outputSchema: {
      type: 'object',
      required: ['slos', 'artifacts'],
      properties: {
        slos: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'errors']
}));

export const createSLODashboardsTask = defineTask('create-slo-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create SLO Dashboards - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Create SLO monitoring dashboards',
      context: args,
      instructions: [
        '1. Create SLO overview dashboard',
        '2. Create latency SLO panels',
        '3. Create throughput SLO panels',
        '4. Create error budget panels',
        '5. Export dashboard configurations'
      ],
      outputFormat: 'JSON with dashboard configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'artifacts'],
      properties: {
        dashboards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'dashboards']
}));

export const implementSLOAlertingTask = defineTask('implement-slo-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement SLO Alerting - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Implement SLO alerting',
      context: args,
      instructions: [
        '1. Create burn rate alerts',
        '2. Create SLO violation alerts',
        '3. Configure notification channels',
        '4. Set alert severities',
        '5. Document alert definitions'
      ],
      outputFormat: 'JSON with alert configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'artifacts'],
      properties: {
        alerts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'alerting']
}));

export const documentSLODefinitionsTask = defineTask('document-slo-definitions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document SLO Definitions - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Document SLO definitions and rationale',
      context: args,
      instructions: [
        '1. Document all SLO targets',
        '2. Explain rationale for each SLO',
        '3. Document measurement methodology',
        '4. Include dashboard access information',
        '5. Document alerting procedures'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'slo', 'documentation']
}));

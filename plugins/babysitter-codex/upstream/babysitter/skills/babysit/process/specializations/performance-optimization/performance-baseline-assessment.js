/**
 * @process specializations/performance-optimization/performance-baseline-assessment
 * @description Performance Baseline Assessment - Establish comprehensive performance baselines for an application
 * or system, including identifying critical user journeys, defining KPIs, setting up monitoring infrastructure,
 * executing baseline measurements, documenting performance characteristics, and establishing performance budgets.
 * @inputs { projectName: string, applicationScope: string, userJourneys?: array, targetEnvironment?: string }
 * @outputs { success: boolean, baselineScore: number, kpis: array, performanceBudgets: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/performance-baseline-assessment', {
 *   projectName: 'E-commerce Platform',
 *   applicationScope: 'full-stack',
 *   userJourneys: ['product-search', 'checkout', 'user-login'],
 *   targetEnvironment: 'production',
 *   metricsToCapture: ['response-time', 'throughput', 'error-rate', 'resource-utilization']
 * });
 *
 * @references
 * - Web Vitals: https://web.dev/vitals/
 * - Brendan Gregg's Methodology: https://www.brendangregg.com/methodology.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationScope = 'full-stack',
    userJourneys = [],
    targetEnvironment = 'production',
    metricsToCapture = ['response-time', 'throughput', 'error-rate', 'resource-utilization'],
    outputDir = 'performance-baseline-output',
    baselineDuration = 7, // days
    sampleSize = 1000
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let baselineScore = 0;

  ctx.log('info', `Starting Performance Baseline Assessment for ${projectName}`);
  ctx.log('info', `Scope: ${applicationScope}, Environment: ${targetEnvironment}`);

  // Phase 1: Identify Critical User Journeys
  ctx.log('info', 'Phase 1: Identifying critical user journeys and transactions');

  const journeyAnalysis = await ctx.task(identifyUserJourneysTask, {
    projectName,
    applicationScope,
    userJourneys,
    outputDir
  });

  artifacts.push(...journeyAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Identified ${journeyAnalysis.criticalJourneys.length} critical user journeys. Review and confirm?`,
    title: 'User Journey Review',
    context: {
      runId: ctx.runId,
      journeys: journeyAnalysis.criticalJourneys,
      files: journeyAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // Phase 2: Define Key Performance Indicators
  ctx.log('info', 'Phase 2: Defining key performance indicators (KPIs)');

  const kpiDefinition = await ctx.task(defineKPIsTask, {
    projectName,
    criticalJourneys: journeyAnalysis.criticalJourneys,
    metricsToCapture,
    outputDir
  });

  artifacts.push(...kpiDefinition.artifacts);

  // Phase 3: Setup Performance Monitoring Infrastructure
  ctx.log('info', 'Phase 3: Setting up performance monitoring infrastructure');

  const monitoringSetup = await ctx.task(setupMonitoringInfrastructureTask, {
    projectName,
    kpis: kpiDefinition.kpis,
    targetEnvironment,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  await ctx.breakpoint({
    question: `Monitoring infrastructure configured with ${monitoringSetup.metricsEndpoints} endpoints. Verify setup?`,
    title: 'Monitoring Setup Review',
    context: {
      runId: ctx.runId,
      monitoring: monitoringSetup,
      files: monitoringSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // Phase 4: Execute Baseline Measurements
  ctx.log('info', 'Phase 4: Executing baseline measurement tests');

  const baselineMeasurement = await ctx.task(executeBaselineMeasurementsTask, {
    projectName,
    kpis: kpiDefinition.kpis,
    criticalJourneys: journeyAnalysis.criticalJourneys,
    baselineDuration,
    sampleSize,
    targetEnvironment,
    outputDir
  });

  artifacts.push(...baselineMeasurement.artifacts);

  // Phase 5: Document Performance Characteristics
  ctx.log('info', 'Phase 5: Documenting current performance characteristics');

  const performanceDoc = await ctx.task(documentPerformanceCharacteristicsTask, {
    projectName,
    baselineResults: baselineMeasurement.results,
    kpis: kpiDefinition.kpis,
    outputDir
  });

  artifacts.push(...performanceDoc.artifacts);

  // Phase 6: Create Performance Dashboards
  ctx.log('info', 'Phase 6: Creating performance dashboards');

  const dashboards = await ctx.task(createPerformanceDashboardsTask, {
    projectName,
    kpis: kpiDefinition.kpis,
    baselineResults: baselineMeasurement.results,
    outputDir
  });

  artifacts.push(...dashboards.artifacts);

  // Phase 7: Establish Performance Budgets
  ctx.log('info', 'Phase 7: Establishing performance budgets');

  const performanceBudgets = await ctx.task(establishPerformanceBudgetsTask, {
    projectName,
    baselineResults: baselineMeasurement.results,
    kpis: kpiDefinition.kpis,
    criticalJourneys: journeyAnalysis.criticalJourneys,
    outputDir
  });

  artifacts.push(...performanceBudgets.artifacts);

  await ctx.breakpoint({
    question: `Performance budgets established. Review budgets for ${performanceBudgets.budgets.length} metrics?`,
    title: 'Performance Budget Review',
    context: {
      runId: ctx.runId,
      budgets: performanceBudgets.budgets,
      files: performanceBudgets.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // Phase 8: Calculate Baseline Score
  ctx.log('info', 'Phase 8: Calculating baseline score and final assessment');

  const scoring = await ctx.task(calculateBaselineScoreTask, {
    projectName,
    baselineResults: baselineMeasurement.results,
    kpis: kpiDefinition.kpis,
    performanceBudgets: performanceBudgets.budgets,
    outputDir
  });

  baselineScore = scoring.baselineScore;
  artifacts.push(...scoring.artifacts);

  await ctx.breakpoint({
    question: `Baseline assessment complete. Score: ${baselineScore}/100. Approve baseline?`,
    title: 'Final Baseline Review',
    context: {
      runId: ctx.runId,
      summary: {
        baselineScore,
        kpiCount: kpiDefinition.kpis.length,
        journeyCount: journeyAnalysis.criticalJourneys.length,
        budgetCount: performanceBudgets.budgets.length
      },
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  return {
    success: true,
    projectName,
    baselineScore,
    kpis: kpiDefinition.kpis,
    criticalJourneys: journeyAnalysis.criticalJourneys,
    baselineResults: baselineMeasurement.results,
    performanceBudgets: performanceBudgets.budgets,
    dashboards: dashboards.dashboards,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/performance-optimization/performance-baseline-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const identifyUserJourneysTask = defineTask('identify-user-journeys', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify User Journeys - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Identify critical user journeys and transactions',
      context: args,
      instructions: [
        '1. Analyze application architecture and user flows',
        '2. Identify business-critical transactions',
        '3. Map user journeys to technical components',
        '4. Prioritize journeys by business impact',
        '5. Document entry points and expected behavior',
        '6. Identify performance-sensitive operations',
        '7. Create user journey map document'
      ],
      outputFormat: 'JSON with user journey analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalJourneys', 'artifacts'],
      properties: {
        criticalJourneys: { type: 'array', items: { type: 'object' } },
        journeyMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'user-journeys']
}));

export const defineKPIsTask = defineTask('define-kpis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define KPIs - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Define key performance indicators',
      context: args,
      instructions: [
        '1. Define latency KPIs (p50, p95, p99)',
        '2. Define throughput KPIs (requests/sec, transactions/sec)',
        '3. Define error rate KPIs',
        '4. Define resource utilization KPIs',
        '5. Define Core Web Vitals (LCP, FID, CLS) if applicable',
        '6. Set measurement methodology for each KPI',
        '7. Document KPI definitions and rationale'
      ],
      outputFormat: 'JSON with KPI definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'artifacts'],
      properties: {
        kpis: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'kpis']
}));

export const setupMonitoringInfrastructureTask = defineTask('setup-monitoring-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Monitoring - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Setup performance monitoring infrastructure',
      context: args,
      instructions: [
        '1. Configure metrics collection (Prometheus, StatsD, etc.)',
        '2. Set up APM instrumentation',
        '3. Configure distributed tracing',
        '4. Set up synthetic monitoring probes',
        '5. Configure log aggregation for performance events',
        '6. Test data collection is working',
        '7. Document monitoring setup'
      ],
      outputFormat: 'JSON with monitoring setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsEndpoints', 'artifacts'],
      properties: {
        metricsEndpoints: { type: 'number' },
        monitoringConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'monitoring']
}));

export const executeBaselineMeasurementsTask = defineTask('execute-baseline-measurements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Baseline Measurements - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Execute baseline performance measurements',
      context: args,
      instructions: [
        '1. Collect baseline metrics over measurement period',
        '2. Measure latency percentiles (p50, p95, p99)',
        '3. Measure throughput under normal load',
        '4. Measure resource utilization patterns',
        '5. Collect error rates and types',
        '6. Analyze metric distributions',
        '7. Document baseline measurement results'
      ],
      outputFormat: 'JSON with baseline measurement results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        statisticalSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'measurement']
}));

export const documentPerformanceCharacteristicsTask = defineTask('document-performance-characteristics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Performance - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Document current performance characteristics',
      context: args,
      instructions: [
        '1. Summarize baseline performance metrics',
        '2. Document performance patterns and trends',
        '3. Identify performance hotspots',
        '4. Document resource consumption patterns',
        '5. Create performance profile document',
        '6. Include statistical analysis',
        '7. Generate performance characteristics report'
      ],
      outputFormat: 'JSON with performance documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'documentation']
}));

export const createPerformanceDashboardsTask = defineTask('create-performance-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Dashboards - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Create performance monitoring dashboards',
      context: args,
      instructions: [
        '1. Create overview performance dashboard',
        '2. Create per-journey performance dashboards',
        '3. Add latency distribution charts',
        '4. Add throughput trend graphs',
        '5. Add resource utilization panels',
        '6. Configure dashboard variables',
        '7. Export dashboard configurations'
      ],
      outputFormat: 'JSON with dashboard configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'artifacts'],
      properties: {
        dashboards: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'dashboards']
}));

export const establishPerformanceBudgetsTask = defineTask('establish-performance-budgets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Establish Budgets - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Establish performance budgets',
      context: args,
      instructions: [
        '1. Set latency budgets based on baseline + headroom',
        '2. Set throughput budgets',
        '3. Set resource utilization budgets',
        '4. Set error rate budgets',
        '5. Define budget violation thresholds',
        '6. Create budget monitoring rules',
        '7. Document performance budget policy'
      ],
      outputFormat: 'JSON with performance budgets'
    },
    outputSchema: {
      type: 'object',
      required: ['budgets', 'artifacts'],
      properties: {
        budgets: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'budgets']
}));

export const calculateBaselineScoreTask = defineTask('calculate-baseline-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate Baseline Score - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Calculate baseline score and final assessment',
      context: args,
      instructions: [
        '1. Score latency performance (0-100)',
        '2. Score throughput capacity (0-100)',
        '3. Score resource efficiency (0-100)',
        '4. Score reliability (error rates) (0-100)',
        '5. Calculate weighted overall score',
        '6. Identify improvement opportunities',
        '7. Generate baseline assessment report'
      ],
      outputFormat: 'JSON with baseline score'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineScore', 'artifacts'],
      properties: {
        baselineScore: { type: 'number' },
        componentScores: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'baseline', 'scoring']
}));

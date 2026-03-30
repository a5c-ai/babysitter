/**
 * @process specializations/sdk-platform-development/performance-benchmarking
 * @description Performance Benchmarking - Establish performance baselines and continuous benchmarking
 * including latency metrics, throughput testing, and load testing scenarios.
 * @inputs { projectName: string, benchmarkTargets?: array, kpis?: object, loadTestConfig?: object }
 * @outputs { success: boolean, benchmarks: array, baselines: object, dashboards: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/performance-benchmarking', {
 *   projectName: 'CloudAPI SDK',
 *   benchmarkTargets: ['sdk-initialization', 'api-calls', 'serialization'],
 *   kpis: { p50: 100, p95: 250, p99: 500 },
 *   loadTestConfig: { concurrency: 100, duration: '5m' }
 * });
 *
 * @references
 * - Systems Performance: https://www.brendangregg.com/systems-performance-2nd-edition-book.html
 * - Benchmark Best Practices: https://github.com/google/benchmark
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    benchmarkTargets = ['sdk-initialization', 'api-calls', 'serialization'],
    kpis = { p50: 100, p95: 250, p99: 500 },
    loadTestConfig = { concurrency: 50, duration: '5m' },
    outputDir = 'performance-benchmarking'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Benchmarking: ${projectName}`);
  ctx.log('info', `Benchmark Targets: ${benchmarkTargets.join(', ')}`);

  // ============================================================================
  // PHASE 1: BENCHMARK STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining performance benchmark strategy');

  const benchmarkStrategy = await ctx.task(benchmarkStrategyTask, {
    projectName,
    benchmarkTargets,
    kpis,
    outputDir
  });

  artifacts.push(...benchmarkStrategy.artifacts);

  // ============================================================================
  // PHASE 2: KPI DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining performance KPIs');

  const kpiDefinition = await ctx.task(kpiDefinitionTask, {
    projectName,
    kpis,
    benchmarkStrategy,
    outputDir
  });

  artifacts.push(...kpiDefinition.artifacts);

  // ============================================================================
  // PHASE 3: BENCHMARK SUITE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating benchmark test suites');

  const benchmarkSuites = await ctx.task(benchmarkSuiteTask, {
    projectName,
    benchmarkTargets,
    kpiDefinition,
    outputDir
  });

  artifacts.push(...benchmarkSuites.artifacts);

  // ============================================================================
  // PHASE 4: LOAD TESTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing load testing scenarios');

  const loadTesting = await ctx.task(loadTestingTask, {
    projectName,
    loadTestConfig,
    benchmarkStrategy,
    outputDir
  });

  artifacts.push(...loadTesting.artifacts);

  // Quality Gate: Benchmark Review
  await ctx.breakpoint({
    question: `Benchmark strategy defined for ${projectName}. Targets: ${benchmarkTargets.length}, KPIs defined. Approve benchmarking approach?`,
    title: 'Benchmark Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      benchmarkTargets,
      kpis,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: CONTINUOUS MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing continuous performance monitoring');

  const continuousMonitoring = await ctx.task(continuousMonitoringTask, {
    projectName,
    kpiDefinition,
    benchmarkSuites,
    outputDir
  });

  artifacts.push(...continuousMonitoring.artifacts);

  // ============================================================================
  // PHASE 6: DASHBOARD CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating monitoring dashboards');

  const dashboards = await ctx.task(performanceDashboardTask, {
    projectName,
    kpiDefinition,
    continuousMonitoring,
    outputDir
  });

  artifacts.push(...dashboards.artifacts);

  // ============================================================================
  // PHASE 7: REGRESSION DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up performance regression detection');

  const regressionDetection = await ctx.task(regressionDetectionTask, {
    projectName,
    kpiDefinition,
    benchmarkSuites,
    outputDir
  });

  artifacts.push(...regressionDetection.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating performance documentation');

  const documentation = await ctx.task(performanceDocumentationTask, {
    projectName,
    benchmarkStrategy,
    kpiDefinition,
    benchmarkSuites,
    loadTesting,
    dashboards,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    benchmarks: benchmarkSuites.suites,
    baselines: kpiDefinition.baselines,
    loadTesting: loadTesting.config,
    dashboards: dashboards.config,
    regressionDetection: regressionDetection.config,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/performance-benchmarking',
      timestamp: startTime,
      benchmarkTargets
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const benchmarkStrategyTask = defineTask('benchmark-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Benchmark Strategy - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Define performance benchmark strategy',
      context: {
        projectName: args.projectName,
        benchmarkTargets: args.benchmarkTargets,
        kpis: args.kpis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify critical performance paths',
        '2. Define benchmark methodology',
        '3. Plan measurement techniques',
        '4. Design warm-up procedures',
        '5. Plan statistical analysis',
        '6. Define comparison approach',
        '7. Plan environment consistency',
        '8. Design benchmark isolation',
        '9. Plan benchmark scheduling',
        '10. Generate benchmark strategy document'
      ],
      outputFormat: 'JSON with benchmark strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'methodology', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        methodology: { type: 'string' },
        criticalPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'performance', 'benchmarking', 'strategy']
}));

export const kpiDefinitionTask = defineTask('kpi-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: KPI Definition - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Performance Analyst',
      task: 'Define performance KPIs and targets',
      context: {
        projectName: args.projectName,
        kpis: args.kpis,
        benchmarkStrategy: args.benchmarkStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define latency KPIs (p50, p95, p99)',
        '2. Define throughput targets',
        '3. Establish memory usage limits',
        '4. Define CPU utilization targets',
        '5. Set connection pool metrics',
        '6. Define error rate thresholds',
        '7. Establish baseline measurements',
        '8. Define acceptable variance',
        '9. Plan KPI evolution',
        '10. Generate KPI documentation'
      ],
      outputFormat: 'JSON with KPI definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'baselines', 'artifacts'],
      properties: {
        kpis: { type: 'array', items: { type: 'object' } },
        baselines: { type: 'object' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'performance', 'kpis']
}));

export const benchmarkSuiteTask = defineTask('benchmark-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Benchmark Suites - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Benchmark Engineer',
      task: 'Create benchmark test suites',
      context: {
        projectName: args.projectName,
        benchmarkTargets: args.benchmarkTargets,
        kpiDefinition: args.kpiDefinition,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SDK initialization benchmarks',
        '2. Build API call latency benchmarks',
        '3. Create serialization benchmarks',
        '4. Build authentication flow benchmarks',
        '5. Create pagination benchmarks',
        '6. Build concurrent request benchmarks',
        '7. Create memory allocation benchmarks',
        '8. Build connection pooling benchmarks',
        '9. Create comparison benchmarks',
        '10. Generate benchmark suite configuration'
      ],
      outputFormat: 'JSON with benchmark suites'
    },
    outputSchema: {
      type: 'object',
      required: ['suites', 'config', 'artifacts'],
      properties: {
        suites: { type: 'array', items: { type: 'object' } },
        config: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'performance', 'benchmark-suites']
}));

export const loadTestingTask = defineTask('load-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Load Testing - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Load Test Engineer',
      task: 'Design load testing scenarios',
      context: {
        projectName: args.projectName,
        loadTestConfig: args.loadTestConfig,
        benchmarkStrategy: args.benchmarkStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design load test scenarios',
        '2. Configure k6 or similar tool',
        '3. Create ramp-up patterns',
        '4. Design steady-state tests',
        '5. Create spike test scenarios',
        '6. Design soak tests',
        '7. Configure thresholds',
        '8. Set up distributed testing',
        '9. Design result analysis',
        '10. Generate load test configuration'
      ],
      outputFormat: 'JSON with load testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'scenarios', 'artifacts'],
      properties: {
        config: { type: 'object' },
        scenarios: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'performance', 'load-testing']
}));

export const continuousMonitoringTask = defineTask('continuous-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Continuous Monitoring - ${args.projectName}`,
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Monitoring Engineer',
      task: 'Implement continuous performance monitoring',
      context: {
        projectName: args.projectName,
        kpiDefinition: args.kpiDefinition,
        benchmarkSuites: args.benchmarkSuites,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up continuous benchmark execution',
        '2. Configure performance data collection',
        '3. Design trend analysis',
        '4. Set up alerting thresholds',
        '5. Configure CI/CD integration',
        '6. Design historical comparison',
        '7. Set up anomaly detection',
        '8. Configure reporting frequency',
        '9. Design data retention',
        '10. Generate monitoring configuration'
      ],
      outputFormat: 'JSON with continuous monitoring config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'schedule', 'artifacts'],
      properties: {
        config: { type: 'object' },
        schedule: { type: 'object' },
        alerting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'performance', 'monitoring']
}));

export const performanceDashboardTask = defineTask('performance-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Dashboard - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Dashboard Engineer',
      task: 'Create monitoring dashboards',
      context: {
        projectName: args.projectName,
        kpiDefinition: args.kpiDefinition,
        continuousMonitoring: args.continuousMonitoring,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design dashboard layout',
        '2. Create latency percentile charts',
        '3. Build throughput visualizations',
        '4. Create trend comparison charts',
        '5. Design regression indicators',
        '6. Build benchmark comparison views',
        '7. Create drill-down capabilities',
        '8. Design alert integration',
        '9. Build export functionality',
        '10. Generate dashboard configuration'
      ],
      outputFormat: 'JSON with dashboard configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'panels', 'artifacts'],
      properties: {
        config: { type: 'object' },
        panels: { type: 'array', items: { type: 'object' } },
        url: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'performance', 'dashboard']
}));

export const regressionDetectionTask = defineTask('regression-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Regression Detection - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Performance Analyst',
      task: 'Set up performance regression detection',
      context: {
        projectName: args.projectName,
        kpiDefinition: args.kpiDefinition,
        benchmarkSuites: args.benchmarkSuites,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define regression thresholds',
        '2. Design statistical comparison',
        '3. Configure CI/CD gate integration',
        '4. Set up notification rules',
        '5. Design root cause analysis hints',
        '6. Configure baseline management',
        '7. Set up false positive handling',
        '8. Design investigation workflow',
        '9. Configure rollback triggers',
        '10. Generate regression detection config'
      ],
      outputFormat: 'JSON with regression detection configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'thresholds', 'artifacts'],
      properties: {
        config: { type: 'object' },
        thresholds: { type: 'object' },
        notifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'performance', 'regression-detection']
}));

export const performanceDocumentationTask = defineTask('performance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Performance Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate performance documentation',
      context: {
        projectName: args.projectName,
        benchmarkStrategy: args.benchmarkStrategy,
        kpiDefinition: args.kpiDefinition,
        benchmarkSuites: args.benchmarkSuites,
        loadTesting: args.loadTesting,
        dashboards: args.dashboards,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create performance overview',
        '2. Document KPIs and targets',
        '3. Write benchmark execution guide',
        '4. Document load testing procedures',
        '5. Create dashboard usage guide',
        '6. Write regression investigation guide',
        '7. Document optimization recommendations',
        '8. Create performance tuning guide',
        '9. Write troubleshooting guide',
        '10. Generate all documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            benchmarks: { type: 'string' },
            tuning: { type: 'string' }
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
  labels: ['sdk', 'performance', 'documentation']
}));

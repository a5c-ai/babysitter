/**
 * @process specializations/gpu-programming/gpu-performance-regression-testing
 * @description GPU Performance Regression Testing - Workflow for establishing and maintaining GPU performance
 * benchmarks to detect regressions across code changes and hardware.
 * @inputs { projectName: string, benchmarkSuite: array, thresholds?: object, ciIntegration?: boolean, outputDir?: string }
 * @outputs { success: boolean, benchmarkResults: object, regressionReport: object, ciConfiguration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/gpu-performance-regression-testing', {
 *   projectName: 'cuda_library',
 *   benchmarkSuite: ['gemm', 'convolution', 'reduction'],
 *   thresholds: { latencyRegression: 5, throughputRegression: 5 },
 *   ciIntegration: true
 * });
 *
 * @references
 * - Google Benchmark: https://github.com/google/benchmark
 * - NVIDIA/cuda-samples benchmarks: https://github.com/NVIDIA/cuda-samples
 * - Performance Testing Best Practices: https://developer.nvidia.com/blog/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    benchmarkSuite,
    thresholds = { latencyRegression: 5, throughputRegression: 5 },
    ciIntegration = true,
    outputDir = 'perf-regression-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GPU Performance Regression Testing: ${projectName}`);
  ctx.log('info', `Benchmarks: ${benchmarkSuite.join(', ')}, Thresholds: ${JSON.stringify(thresholds)}`);

  // Phase 1: Benchmark Suite Design
  const suiteDesign = await ctx.task(benchmarkSuiteDesignTask, {
    projectName, benchmarkSuite, outputDir
  });
  artifacts.push(...suiteDesign.artifacts);

  // Phase 2: Baseline Establishment
  const baselineEstablishment = await ctx.task(baselineEstablishmentTask, {
    projectName, suiteDesign, outputDir
  });
  artifacts.push(...baselineEstablishment.artifacts);

  // Phase 3: Threshold Configuration
  const thresholdConfig = await ctx.task(thresholdConfigurationTask, {
    projectName, thresholds, baselineEstablishment, outputDir
  });
  artifacts.push(...thresholdConfig.artifacts);

  // Phase 4: Regression Detection
  const regressionDetection = await ctx.task(regressionDetectionTask, {
    projectName, baselineEstablishment, thresholdConfig, outputDir
  });
  artifacts.push(...regressionDetection.artifacts);

  // Phase 5: CI/CD Integration
  let ciConfig = null;
  if (ciIntegration) {
    ciConfig = await ctx.task(ciCdIntegrationTask, {
      projectName, suiteDesign, thresholdConfig, outputDir
    });
    artifacts.push(...ciConfig.artifacts);
  }

  // Phase 6: Dashboard and Reporting
  const dashboardReporting = await ctx.task(performanceDashboardTask, {
    projectName, baselineEstablishment, regressionDetection, outputDir
  });
  artifacts.push(...dashboardReporting.artifacts);

  await ctx.breakpoint({
    question: `Performance regression testing setup complete for ${projectName}. Benchmarks: ${suiteDesign.benchmarkCount}. CI ready: ${ciIntegration}. Review?`,
    title: 'Regression Testing Complete',
    context: { runId: ctx.runId, suiteDesign, regressionDetection }
  });

  return {
    success: true,
    projectName,
    benchmarkResults: {
      baseline: baselineEstablishment.baseline,
      benchmarkCount: suiteDesign.benchmarkCount,
      metricsCollected: suiteDesign.metrics
    },
    regressionReport: {
      thresholds: thresholdConfig.thresholds,
      detectionMethod: regressionDetection.method,
      alertConfiguration: regressionDetection.alerts
    },
    ciConfiguration: ciConfig ? {
      configPath: ciConfig.configPath,
      triggerConditions: ciConfig.triggers,
      reportingIntegration: ciConfig.reporting
    } : null,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/gpu-performance-regression-testing',
      timestamp: startTime,
      outputDir
    }
  };
}

export const benchmarkSuiteDesignTask = defineTask('benchmark-suite-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark Suite Design - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Design benchmark suite',
      context: args,
      instructions: [
        '1. Define benchmark operations',
        '2. Choose metrics to track',
        '3. Design micro-benchmarks',
        '4. Design macro-benchmarks',
        '5. Define input data ranges',
        '6. Plan warm-up iterations',
        '7. Configure timing methodology',
        '8. Plan statistical sampling',
        '9. Document benchmarks',
        '10. Create benchmark framework'
      ],
      outputFormat: 'JSON with benchmark suite design'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarkCount', 'metrics', 'artifacts'],
      properties: {
        benchmarkCount: { type: 'number' },
        metrics: { type: 'array', items: { type: 'string' } },
        benchmarks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'regression', 'design']
}));

export const baselineEstablishmentTask = defineTask('baseline-establishment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Baseline Establishment - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Establish performance baseline',
      context: args,
      instructions: [
        '1. Run baseline benchmarks',
        '2. Collect multiple samples',
        '3. Calculate statistics',
        '4. Store baseline data',
        '5. Document hardware config',
        '6. Document software versions',
        '7. Handle variance',
        '8. Create baseline report',
        '9. Version baseline data',
        '10. Plan baseline updates'
      ],
      outputFormat: 'JSON with baseline establishment'
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'statistics', 'artifacts'],
      properties: {
        baseline: { type: 'object' },
        statistics: { type: 'object' },
        hardwareConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'regression', 'baseline']
}));

export const thresholdConfigurationTask = defineTask('threshold-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Threshold Configuration - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Configure regression thresholds',
      context: args,
      instructions: [
        '1. Analyze baseline variance',
        '2. Set latency thresholds',
        '3. Set throughput thresholds',
        '4. Configure per-benchmark thresholds',
        '5. Account for noise',
        '6. Set warning vs error levels',
        '7. Configure trend detection',
        '8. Handle hardware variation',
        '9. Document thresholds',
        '10. Create threshold config file'
      ],
      outputFormat: 'JSON with threshold configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['thresholds', 'noiseMargin', 'artifacts'],
      properties: {
        thresholds: { type: 'object' },
        noiseMargin: { type: 'number' },
        perBenchmarkThresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'regression', 'thresholds']
}));

export const regressionDetectionTask = defineTask('regression-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Regression Detection - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Implement regression detection',
      context: args,
      instructions: [
        '1. Implement comparison logic',
        '2. Use statistical tests',
        '3. Detect trending changes',
        '4. Handle flaky benchmarks',
        '5. Implement alerts',
        '6. Create regression report',
        '7. Identify root cause hints',
        '8. Implement triage workflow',
        '9. Track regressions over time',
        '10. Document detection method'
      ],
      outputFormat: 'JSON with regression detection'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'alerts', 'artifacts'],
      properties: {
        method: { type: 'string' },
        alerts: { type: 'object' },
        detectionCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'regression', 'detection']
}));

export const ciCdIntegrationTask = defineTask('ci-cd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'devops-engineer',
    skills: ['ci-cd-integration'],
    prompt: {
      role: 'DevOps Engineer',
      task: 'Integrate with CI/CD pipeline',
      context: args,
      instructions: [
        '1. Create CI configuration',
        '2. Configure GPU runners',
        '3. Set trigger conditions',
        '4. Add benchmark jobs',
        '5. Configure reporting',
        '6. Add failure conditions',
        '7. Integrate with PR workflow',
        '8. Configure notifications',
        '9. Add artifact storage',
        '10. Document CI integration'
      ],
      outputFormat: 'JSON with CI/CD integration'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'triggers', 'reporting', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        triggers: { type: 'array', items: { type: 'string' } },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'regression', 'ci-cd']
}));

export const performanceDashboardTask = defineTask('performance-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dashboard and Reporting - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Create performance dashboard',
      context: args,
      instructions: [
        '1. Design dashboard layout',
        '2. Add time-series charts',
        '3. Show regression indicators',
        '4. Add comparison views',
        '5. Include statistical summaries',
        '6. Add alert displays',
        '7. Enable drill-down',
        '8. Add export capabilities',
        '9. Document dashboard usage',
        '10. Create reporting templates'
      ],
      outputFormat: 'JSON with dashboard configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardConfig', 'reportTemplates', 'artifacts'],
      properties: {
        dashboardConfig: { type: 'object' },
        reportTemplates: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'regression', 'dashboard']
}));

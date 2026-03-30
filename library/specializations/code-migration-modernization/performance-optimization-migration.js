/**
 * @process specializations/code-migration-modernization/performance-optimization-migration
 * @description Performance Optimization Migration - Process for improving application performance
 * during or after migration, including profiling, bottleneck identification, optimization
 * implementation, and performance regression prevention.
 * @inputs { projectName: string, performanceRequirements?: object, currentMetrics?: object, targetEnvironment?: object }
 * @outputs { success: boolean, performanceAnalysis: object, optimizations: array, benchmarkResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/performance-optimization-migration', {
 *   projectName: 'API Performance Optimization',
 *   performanceRequirements: { p99Latency: '200ms', throughput: '5000 rps' },
 *   currentMetrics: { p99Latency: '500ms', throughput: '2000 rps' },
 *   targetEnvironment: { cloud: 'AWS', runtime: 'Node.js' }
 * });
 *
 * @references
 * - Performance Engineering: https://www.brendangregg.com/linuxperf.html
 * - Web Performance: https://web.dev/performance/
 * - APM Tools: https://www.datadoghq.com/product/apm/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    performanceRequirements = {},
    currentMetrics = {},
    targetEnvironment = {},
    outputDir = 'performance-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Optimization Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: PERFORMANCE PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 1: Profiling application performance');
  const performanceProfiling = await ctx.task(performanceProfilingTask, {
    projectName,
    currentMetrics,
    targetEnvironment,
    outputDir
  });

  artifacts.push(...performanceProfiling.artifacts);

  // ============================================================================
  // PHASE 2: BOTTLENECK IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying bottlenecks');
  const bottleneckIdentification = await ctx.task(bottleneckIdentificationTask, {
    projectName,
    performanceProfiling,
    performanceRequirements,
    outputDir
  });

  artifacts.push(...bottleneckIdentification.artifacts);

  // Breakpoint: Bottleneck review
  await ctx.breakpoint({
    question: `Bottleneck analysis complete for ${projectName}. Critical bottlenecks: ${bottleneckIdentification.criticalCount}. Top issue: ${bottleneckIdentification.topIssue}. Approve optimization plan?`,
    title: 'Bottleneck Analysis Review',
    context: {
      runId: ctx.runId,
      projectName,
      bottleneckIdentification,
      recommendation: 'Review bottlenecks and prioritize optimizations'
    }
  });

  // ============================================================================
  // PHASE 3: OPTIMIZATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning optimizations');
  const optimizationPlanning = await ctx.task(optimizationPlanningTask, {
    projectName,
    bottleneckIdentification,
    performanceRequirements,
    outputDir
  });

  artifacts.push(...optimizationPlanning.artifacts);

  // ============================================================================
  // PHASE 4: OPTIMIZATION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing optimizations');
  const optimizationImplementation = await ctx.task(optimizationImplementationTask, {
    projectName,
    optimizationPlanning,
    outputDir
  });

  artifacts.push(...optimizationImplementation.artifacts);

  // ============================================================================
  // PHASE 5: BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 5: Running benchmarks');
  const benchmarking = await ctx.task(benchmarkingTask, {
    projectName,
    optimizationImplementation,
    currentMetrics,
    performanceRequirements,
    outputDir
  });

  artifacts.push(...benchmarking.artifacts);

  // ============================================================================
  // PHASE 6: REGRESSION PREVENTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up regression prevention');
  const regressionPrevention = await ctx.task(regressionPreventionTask, {
    projectName,
    benchmarking,
    performanceRequirements,
    outputDir
  });

  artifacts.push(...regressionPrevention.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Performance optimization complete for ${projectName}. Requirements met: ${benchmarking.requirementsMet}. Improvement: ${benchmarking.improvement}. Regression tests: ${regressionPrevention.testsConfigured}. Approve?`,
    title: 'Performance Optimization Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        optimizations: optimizationImplementation.implementedCount,
        requirementsMet: benchmarking.requirementsMet,
        improvement: benchmarking.improvement,
        regressionTests: regressionPrevention.testsConfigured
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    performanceAnalysis: {
      profiling: performanceProfiling,
      bottlenecks: bottleneckIdentification
    },
    optimizations: optimizationImplementation.optimizations,
    benchmarkResults: benchmarking,
    regressionPrevention,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/performance-optimization-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const performanceProfilingTask = defineTask('performance-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Performance Profiling - ${args.projectName}`,
  agent: {
    name: 'performance-profiler',
    prompt: {
      role: 'Performance Engineer',
      task: 'Profile application performance',
      context: args,
      instructions: [
        '1. Set up profiling tools',
        '2. Capture CPU profiles',
        '3. Analyze memory usage',
        '4. Profile I/O operations',
        '5. Measure network latency',
        '6. Profile database queries',
        '7. Analyze call graphs',
        '8. Identify hot paths',
        '9. Document baseline',
        '10. Generate profiling report'
      ],
      outputFormat: 'JSON with cpuProfile, memoryProfile, ioProfile, hotPaths, baseline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cpuProfile', 'memoryProfile', 'baseline', 'artifacts'],
      properties: {
        cpuProfile: { type: 'object' },
        memoryProfile: { type: 'object' },
        ioProfile: { type: 'object' },
        hotPaths: { type: 'array', items: { type: 'object' } },
        baseline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'profiling', 'analysis']
}));

export const bottleneckIdentificationTask = defineTask('bottleneck-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Bottleneck Identification - ${args.projectName}`,
  agent: {
    name: 'bottleneck-analyst',
    prompt: {
      role: 'Performance Analyst',
      task: 'Identify performance bottlenecks',
      context: args,
      instructions: [
        '1. Analyze profiles',
        '2. Identify CPU bottlenecks',
        '3. Find memory issues',
        '4. Identify I/O bottlenecks',
        '5. Find network issues',
        '6. Analyze database queries',
        '7. Identify contention',
        '8. Prioritize by impact',
        '9. Estimate fix effort',
        '10. Generate bottleneck report'
      ],
      outputFormat: 'JSON with criticalCount, bottlenecks, topIssue, byCategory, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalCount', 'bottlenecks', 'topIssue', 'artifacts'],
      properties: {
        criticalCount: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'object' } },
        topIssue: { type: 'string' },
        byCategory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'bottlenecks', 'analysis']
}));

export const optimizationPlanningTask = defineTask('optimization-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Optimization Planning - ${args.projectName}`,
  agent: {
    name: 'optimization-planner',
    prompt: {
      role: 'Performance Architect',
      task: 'Plan performance optimizations',
      context: args,
      instructions: [
        '1. Select optimization techniques',
        '2. Prioritize by impact',
        '3. Plan implementation order',
        '4. Estimate effort',
        '5. Plan caching strategy',
        '6. Plan async optimizations',
        '7. Plan database optimizations',
        '8. Plan infrastructure changes',
        '9. Set success criteria',
        '10. Generate optimization plan'
      ],
      outputFormat: 'JSON with optimizations, priority, estimatedImpact, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'priority', 'estimatedImpact', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        priority: { type: 'array', items: { type: 'string' } },
        estimatedImpact: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'planning', 'strategy']
}));

export const optimizationImplementationTask = defineTask('optimization-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Optimization Implementation - ${args.projectName}`,
  agent: {
    name: 'optimization-developer',
    prompt: {
      role: 'Senior Developer',
      task: 'Implement performance optimizations',
      context: args,
      instructions: [
        '1. Implement caching',
        '2. Optimize queries',
        '3. Add connection pooling',
        '4. Implement async patterns',
        '5. Optimize algorithms',
        '6. Reduce memory allocations',
        '7. Add batching',
        '8. Optimize serialization',
        '9. Test each optimization',
        '10. Document changes'
      ],
      outputFormat: 'JSON with implementedCount, optimizations, improvements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedCount', 'optimizations', 'artifacts'],
      properties: {
        implementedCount: { type: 'number' },
        optimizations: { type: 'array', items: { type: 'object' } },
        improvements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'implementation', 'code']
}));

export const benchmarkingTask = defineTask('benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Benchmarking - ${args.projectName}`,
  agent: {
    name: 'benchmark-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Run performance benchmarks',
      context: args,
      instructions: [
        '1. Set up benchmark suite',
        '2. Run load tests',
        '3. Measure latency',
        '4. Measure throughput',
        '5. Compare to baseline',
        '6. Calculate improvement',
        '7. Test under stress',
        '8. Validate requirements',
        '9. Document results',
        '10. Generate benchmark report'
      ],
      outputFormat: 'JSON with requirementsMet, improvement, newMetrics, comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirementsMet', 'improvement', 'newMetrics', 'artifacts'],
      properties: {
        requirementsMet: { type: 'boolean' },
        improvement: { type: 'string' },
        newMetrics: { type: 'object' },
        comparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'benchmarking', 'testing']
}));

export const regressionPreventionTask = defineTask('regression-prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Regression Prevention - ${args.projectName}`,
  agent: {
    name: 'regression-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Set up performance regression prevention',
      context: args,
      instructions: [
        '1. Create benchmark suite',
        '2. Set up CI integration',
        '3. Configure thresholds',
        '4. Set up alerts',
        '5. Create dashboards',
        '6. Document baselines',
        '7. Configure reporting',
        '8. Train team',
        '9. Test automation',
        '10. Generate setup report'
      ],
      outputFormat: 'JSON with testsConfigured, ciIntegration, thresholds, dashboards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testsConfigured', 'ciIntegration', 'artifacts'],
      properties: {
        testsConfigured: { type: 'boolean' },
        ciIntegration: { type: 'boolean' },
        thresholds: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['performance-optimization', 'regression', 'prevention']
}));

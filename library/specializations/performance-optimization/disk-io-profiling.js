/**
 * @process specializations/performance-optimization/disk-io-profiling
 * @description Disk I/O Profiling - Profile and optimize disk I/O operations including read/write patterns,
 * buffer optimization, and async I/O implementation.
 * @inputs { projectName: string, targetApplication: string, ioPattern?: string }
 * @outputs { success: boolean, ioProfile: object, optimizations: array, improvementPercent: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/disk-io-profiling', {
 *   projectName: 'Log Processing System',
 *   targetApplication: 'log-aggregator',
 *   ioPattern: 'sequential'
 * });
 *
 * @references
 * - FIO Documentation: https://fio.readthedocs.io/
 * - iostat: https://man7.org/linux/man-pages/man1/iostat.1.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    ioPattern = 'mixed',
    outputDir = 'disk-io-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Disk I/O Profiling for ${projectName}`);

  // Phase 1: Set Up I/O Monitoring Tools
  const monitoringSetup = await ctx.task(setupIOMonitoringTask, { projectName, targetApplication, outputDir });
  artifacts.push(...monitoringSetup.artifacts);

  // Phase 2: Capture Disk I/O Metrics
  const ioMetrics = await ctx.task(captureIOMetricsTask, { projectName, targetApplication, outputDir });
  artifacts.push(...ioMetrics.artifacts);

  // Phase 3: Analyze Read/Write Patterns
  const patternAnalysis = await ctx.task(analyzeReadWritePatternsTask, { projectName, ioMetrics, outputDir });
  artifacts.push(...patternAnalysis.artifacts);

  await ctx.breakpoint({
    question: `I/O analysis complete. Pattern: ${patternAnalysis.dominantPattern}. IOPS: ${ioMetrics.iops}. Review bottlenecks?`,
    title: 'Disk I/O Analysis',
    context: { runId: ctx.runId, patternAnalysis }
  });

  // Phase 4: Identify I/O Bottlenecks
  const bottlenecks = await ctx.task(identifyIOBottlenecksTask, { projectName, ioMetrics, patternAnalysis, outputDir });
  artifacts.push(...bottlenecks.artifacts);

  // Phase 5: Evaluate Sequential vs Random Access
  const accessEvaluation = await ctx.task(evaluateAccessPatternsTask, { projectName, patternAnalysis, outputDir });
  artifacts.push(...accessEvaluation.artifacts);

  // Phase 6: Optimize Buffer Sizes
  const bufferOpt = await ctx.task(optimizeBufferSizesTask, { projectName, ioMetrics, bottlenecks, outputDir });
  artifacts.push(...bufferOpt.artifacts);

  // Phase 7: Implement Async I/O Where Appropriate
  const asyncIO = await ctx.task(implementAsyncIOTask, { projectName, bottlenecks, outputDir });
  artifacts.push(...asyncIO.artifacts);

  // Phase 8: Benchmark I/O Improvements
  const benchmarks = await ctx.task(benchmarkIOImprovementsTask, { projectName, bufferOpt, asyncIO, outputDir });
  artifacts.push(...benchmarks.artifacts);

  await ctx.breakpoint({
    question: `I/O optimization complete. Improvement: ${benchmarks.improvementPercent}%. Accept changes?`,
    title: 'Disk I/O Optimization Results',
    context: { runId: ctx.runId, benchmarks }
  });

  return {
    success: true,
    projectName,
    ioProfile: ioMetrics.profile,
    patterns: patternAnalysis.patterns,
    optimizations: [...bufferOpt.optimizations, ...asyncIO.optimizations],
    improvementPercent: benchmarks.improvementPercent,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/disk-io-profiling', timestamp: startTime, outputDir }
  };
}

export const setupIOMonitoringTask = defineTask('setup-io-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup I/O Monitoring - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Setup I/O monitoring tools', context: args,
      instructions: ['1. Install iostat/iotop', '2. Configure I/O tracing', '3. Set up metrics collection', '4. Configure dashboards', '5. Document setup'],
      outputFormat: 'JSON with setup details' },
    outputSchema: { type: 'object', required: ['configured', 'artifacts'], properties: { configured: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'setup']
}));

export const captureIOMetricsTask = defineTask('capture-io-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture I/O Metrics - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Capture disk I/O metrics', context: args,
      instructions: ['1. Capture IOPS', '2. Capture throughput', '3. Capture latency', '4. Capture queue depth', '5. Export metrics'],
      outputFormat: 'JSON with I/O metrics' },
    outputSchema: { type: 'object', required: ['iops', 'profile', 'artifacts'], properties: { iops: { type: 'number' }, profile: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'metrics']
}));

export const analyzeReadWritePatternsTask = defineTask('analyze-read-write-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Read/Write Patterns - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Analyze read/write patterns', context: args,
      instructions: ['1. Analyze read vs write ratio', '2. Identify access patterns', '3. Analyze block sizes', '4. Document patterns', '5. Identify issues'],
      outputFormat: 'JSON with pattern analysis' },
    outputSchema: { type: 'object', required: ['dominantPattern', 'patterns', 'artifacts'], properties: { dominantPattern: { type: 'string' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'patterns']
}));

export const identifyIOBottlenecksTask = defineTask('identify-io-bottlenecks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify I/O Bottlenecks - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Identify I/O bottlenecks', context: args,
      instructions: ['1. Identify slow operations', '2. Find queue saturation', '3. Identify seek-heavy patterns', '4. Find blocking I/O', '5. Document bottlenecks'],
      outputFormat: 'JSON with bottleneck analysis' },
    outputSchema: { type: 'object', required: ['bottlenecks', 'artifacts'], properties: { bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'bottlenecks']
}));

export const evaluateAccessPatternsTask = defineTask('evaluate-access-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Access Patterns - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Evaluate sequential vs random access', context: args,
      instructions: ['1. Analyze sequential ratio', '2. Identify random access', '3. Evaluate impact', '4. Recommend changes', '5. Document evaluation'],
      outputFormat: 'JSON with access evaluation' },
    outputSchema: { type: 'object', required: ['evaluation', 'artifacts'], properties: { evaluation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'access-patterns']
}));

export const optimizeBufferSizesTask = defineTask('optimize-buffer-sizes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Buffer Sizes - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Optimize buffer sizes', context: args,
      instructions: ['1. Analyze current buffers', '2. Test different sizes', '3. Optimize read buffers', '4. Optimize write buffers', '5. Document changes'],
      outputFormat: 'JSON with buffer optimizations' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'buffers']
}));

export const implementAsyncIOTask = defineTask('implement-async-io', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Async I/O - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement async I/O where appropriate', context: args,
      instructions: ['1. Identify blocking I/O', '2. Implement async operations', '3. Add I/O scheduling', '4. Handle completion', '5. Document changes'],
      outputFormat: 'JSON with async I/O implementation' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'async']
}));

export const benchmarkIOImprovementsTask = defineTask('benchmark-io-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark I/O Improvements - ${args.projectName}`,
  agent: {
    name: 'io-performance-expert',
    prompt: { role: 'Performance Engineer', task: 'Benchmark I/O improvements', context: args,
      instructions: ['1. Run baseline benchmarks', '2. Run optimized benchmarks', '3. Compare IOPS', '4. Compare latency', '5. Document results'],
      outputFormat: 'JSON with benchmark results' },
    outputSchema: { type: 'object', required: ['improvementPercent', 'artifacts'], properties: { improvementPercent: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'disk-io', 'benchmarking']
}));

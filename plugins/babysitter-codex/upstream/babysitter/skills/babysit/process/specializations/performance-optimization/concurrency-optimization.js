/**
 * @process specializations/performance-optimization/concurrency-optimization
 * @description Concurrency Optimization - Optimize concurrent processing for improved throughput including contention
 * analysis, lock optimization, thread pool tuning, and implementation of lock-free algorithms.
 * @inputs { projectName: string, codebaseType: string, concurrencyIssues?: array }
 * @outputs { success: boolean, contentionAnalysis: object, optimizations: array, threadPoolConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/concurrency-optimization', {
 *   projectName: 'Order Processing System',
 *   codebaseType: 'java',
 *   concurrencyIssues: ['lock contention', 'thread starvation']
 * });
 *
 * @references
 * - Java Concurrency in Practice: https://jcip.net/
 * - LMAX Disruptor: https://lmax-exchange.github.io/disruptor/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    codebaseType = 'java',
    concurrencyIssues = [],
    outputDir = 'concurrency-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Concurrency Optimization for ${projectName}`);

  // Phase 1: Analyze Current Concurrency Model
  const concurrencyModel = await ctx.task(analyzeConcurrencyModelTask, { projectName, codebaseType, outputDir });
  artifacts.push(...concurrencyModel.artifacts);

  // Phase 2: Identify Contention Points
  const contentionAnalysis = await ctx.task(identifyContentionPointsTask, { projectName, concurrencyModel, outputDir });
  artifacts.push(...contentionAnalysis.artifacts);

  // Phase 3: Analyze Lock Usage
  const lockAnalysis = await ctx.task(analyzeLockUsageTask, { projectName, contentionAnalysis, outputDir });
  artifacts.push(...lockAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Found ${contentionAnalysis.contentionPoints.length} contention points and ${lockAnalysis.lockIssues.length} lock issues. Proceed with optimization design?`,
    title: 'Contention Analysis Review',
    context: { runId: ctx.runId, contentionAnalysis, lockAnalysis }
  });

  // Phase 4: Design Lock Optimizations
  const lockOptimizations = await ctx.task(designLockOptimizationsTask, { projectName, lockAnalysis, outputDir });
  artifacts.push(...lockOptimizations.artifacts);

  // Phase 5: Evaluate Lock-Free Algorithms
  const lockFreeEvaluation = await ctx.task(evaluateLockFreeAlgorithmsTask, { projectName, contentionAnalysis, codebaseType, outputDir });
  artifacts.push(...lockFreeEvaluation.artifacts);

  // Phase 6: Configure Thread Pools
  const threadPoolConfig = await ctx.task(configureThreadPoolsTask, { projectName, concurrencyModel, outputDir });
  artifacts.push(...threadPoolConfig.artifacts);

  // Phase 7: Implement Async Processing
  const asyncProcessing = await ctx.task(implementAsyncProcessingTask, { projectName, codebaseType, outputDir });
  artifacts.push(...asyncProcessing.artifacts);

  // Phase 8: Benchmark Concurrent Performance
  const benchmarkResults = await ctx.task(benchmarkConcurrentPerformanceTask, { projectName, outputDir });
  artifacts.push(...benchmarkResults.artifacts);

  // Phase 9: Document Concurrency Patterns
  const documentation = await ctx.task(documentConcurrencyPatternsTask, { projectName, lockOptimizations, lockFreeEvaluation, threadPoolConfig, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Concurrency optimization complete. ${lockOptimizations.optimizations.length} lock optimizations, ${lockFreeEvaluation.recommendations.length} lock-free candidates. Throughput improvement: ${benchmarkResults.throughputImprovement}%. Accept?`,
    title: 'Concurrency Optimization Review',
    context: { runId: ctx.runId, lockOptimizations, benchmarkResults }
  });

  return {
    success: true,
    projectName,
    contentionAnalysis: contentionAnalysis.analysis,
    optimizations: lockOptimizations.optimizations,
    lockFreeRecommendations: lockFreeEvaluation.recommendations,
    threadPoolConfig: threadPoolConfig.configuration,
    benchmarkResults: benchmarkResults.results,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/concurrency-optimization', timestamp: startTime, outputDir }
  };
}

export const analyzeConcurrencyModelTask = defineTask('analyze-concurrency-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Concurrency Model - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Analyze current concurrency model', context: args,
      instructions: ['1. Identify threading model', '2. Map shared resources', '3. Document synchronization', '4. Identify patterns', '5. Document model'],
      outputFormat: 'JSON with concurrency model analysis' },
    outputSchema: { type: 'object', required: ['model', 'artifacts'], properties: { model: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'analysis']
}));

export const identifyContentionPointsTask = defineTask('identify-contention-points', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Contention Points - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Identify contention points', context: args,
      instructions: ['1. Profile lock contention', '2. Identify hot locks', '3. Measure wait times', '4. Map contention sources', '5. Document findings'],
      outputFormat: 'JSON with contention point analysis' },
    outputSchema: { type: 'object', required: ['contentionPoints', 'analysis', 'artifacts'], properties: { contentionPoints: { type: 'array' }, analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'contention']
}));

export const analyzeLockUsageTask = defineTask('analyze-lock-usage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Lock Usage - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Analyze lock usage patterns', context: args,
      instructions: ['1. Map lock hierarchy', '2. Identify lock scope issues', '3. Find unnecessary locks', '4. Detect potential deadlocks', '5. Document issues'],
      outputFormat: 'JSON with lock usage analysis' },
    outputSchema: { type: 'object', required: ['lockIssues', 'artifacts'], properties: { lockIssues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'locks']
}));

export const designLockOptimizationsTask = defineTask('design-lock-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Lock Optimizations - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Design lock optimizations', context: args,
      instructions: ['1. Reduce lock scope', '2. Use finer-grained locks', '3. Consider read-write locks', '4. Design lock striping', '5. Document optimizations'],
      outputFormat: 'JSON with lock optimization designs' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'lock-optimization']
}));

export const evaluateLockFreeAlgorithmsTask = defineTask('evaluate-lock-free-algorithms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Lock-Free Algorithms - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Evaluate lock-free algorithm opportunities', context: args,
      instructions: ['1. Identify CAS opportunities', '2. Evaluate atomic operations', '3. Consider concurrent collections', '4. Assess complexity tradeoffs', '5. Document recommendations'],
      outputFormat: 'JSON with lock-free evaluation' },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'lock-free']
}));

export const configureThreadPoolsTask = defineTask('configure-thread-pools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Thread Pools - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Configure thread pools for optimal performance', context: args,
      instructions: ['1. Analyze workload types', '2. Size CPU-bound pools', '3. Size I/O-bound pools', '4. Configure queue strategies', '5. Document configuration'],
      outputFormat: 'JSON with thread pool configuration' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'thread-pools']
}));

export const implementAsyncProcessingTask = defineTask('implement-async-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Async Processing - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement async processing patterns', context: args,
      instructions: ['1. Identify async opportunities', '2. Design async workflows', '3. Implement non-blocking I/O', '4. Add async error handling', '5. Document patterns'],
      outputFormat: 'JSON with async processing implementation' },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'async']
}));

export const benchmarkConcurrentPerformanceTask = defineTask('benchmark-concurrent-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark Concurrent Performance - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Benchmark concurrent performance', context: args,
      instructions: ['1. Design concurrent benchmarks', '2. Measure throughput', '3. Measure contention', '4. Compare before/after', '5. Document results'],
      outputFormat: 'JSON with benchmark results' },
    outputSchema: { type: 'object', required: ['throughputImprovement', 'results', 'artifacts'], properties: { throughputImprovement: { type: 'number' }, results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'benchmarking']
}));

export const documentConcurrencyPatternsTask = defineTask('document-concurrency-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Concurrency Patterns - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: { role: 'Performance Engineer', task: 'Document concurrency optimization patterns', context: args,
      instructions: ['1. Document lock patterns', '2. Document async patterns', '3. Include thread pool guidelines', '4. Add anti-patterns', '5. Generate report'],
      outputFormat: 'JSON with concurrency documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'concurrency', 'documentation']
}));

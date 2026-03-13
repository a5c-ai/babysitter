/**
 * @process specializations/performance-optimization/cpu-optimization-implementation
 * @description CPU Optimization Implementation - Implement CPU optimizations based on profiling analysis including
 * algorithmic improvements, hot code path optimization, caching for expensive computations, and parallel processing.
 * @inputs { projectName: string, profilingResults: object, targetHotspots: array, optimizationGoal?: number }
 * @outputs { success: boolean, optimizationsApplied: array, improvementPercent: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/cpu-optimization-implementation', {
 *   projectName: 'Data Processing Pipeline',
 *   profilingResults: profilingData,
 *   targetHotspots: ['parseJSON', 'sortRecords', 'computeHash'],
 *   optimizationGoal: 50
 * });
 *
 * @references
 * - Mechanical Sympathy: https://mechanical-sympathy.blogspot.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    profilingResults,
    targetHotspots = [],
    optimizationGoal = 30,
    outputDir = 'cpu-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CPU Optimization Implementation for ${projectName}`);

  // Phase 1: Review Profiling Results
  const review = await ctx.task(reviewProfilingResultsTask, {
    projectName, profilingResults, targetHotspots, outputDir
  });
  artifacts.push(...review.artifacts);

  // Phase 2: Design Optimization Approach
  const design = await ctx.task(designOptimizationApproachTask, {
    projectName, review, optimizationGoal, outputDir
  });
  artifacts.push(...design.artifacts);

  await ctx.breakpoint({
    question: `Optimization approach designed for ${design.optimizations.length} hotspots. Proceed with implementation?`,
    title: 'Optimization Design Review',
    context: { runId: ctx.runId, optimizations: design.optimizations }
  });

  // Phase 3: Implement Algorithmic Improvements
  const algorithmic = await ctx.task(implementAlgorithmicImprovementsTask, {
    projectName, design, outputDir
  });
  artifacts.push(...algorithmic.artifacts);

  // Phase 4: Optimize Hot Code Paths
  const hotPathOptimization = await ctx.task(optimizeHotCodePathsTask, {
    projectName, design, outputDir
  });
  artifacts.push(...hotPathOptimization.artifacts);

  // Phase 5: Add Caching for Expensive Computations
  const caching = await ctx.task(addComputationCachingTask, {
    projectName, design, outputDir
  });
  artifacts.push(...caching.artifacts);

  // Phase 6: Implement Parallel Processing
  const parallel = await ctx.task(implementParallelProcessingTask, {
    projectName, design, outputDir
  });
  artifacts.push(...parallel.artifacts);

  // Phase 7: Benchmark Before and After
  const benchmarks = await ctx.task(benchmarkChangesTask, {
    projectName, algorithmic, hotPathOptimization, caching, parallel, outputDir
  });
  artifacts.push(...benchmarks.artifacts);

  // Phase 8: Validate Improvements
  const validation = await ctx.task(validateImprovementsTask, {
    projectName, benchmarks, optimizationGoal, outputDir
  });
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Optimization complete. Improvement: ${validation.improvementPercent}% (Goal: ${optimizationGoal}%). Accept changes?`,
    title: 'Optimization Validation',
    context: { runId: ctx.runId, validation }
  });

  return {
    success: true,
    projectName,
    optimizationsApplied: [...algorithmic.optimizations, ...hotPathOptimization.optimizations, ...caching.optimizations, ...parallel.optimizations],
    improvementPercent: validation.improvementPercent,
    benchmarks: benchmarks.results,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/performance-optimization/cpu-optimization-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

export const reviewProfilingResultsTask = defineTask('review-profiling-results', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Profiling Results - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Review profiling results and recommendations',
      context: args,
      instructions: [
        '1. Analyze profiling data',
        '2. Identify optimization opportunities',
        '3. Assess complexity of changes',
        '4. Estimate potential improvements',
        '5. Document analysis findings'
      ],
      outputFormat: 'JSON with review results'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'review']
}));

export const designOptimizationApproachTask = defineTask('design-optimization-approach', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Optimization Approach - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Design CPU optimization approach',
      context: args,
      instructions: [
        '1. Design algorithmic improvements',
        '2. Plan hot path optimizations',
        '3. Design caching strategy',
        '4. Plan parallelization approach',
        '5. Document optimization design'
      ],
      outputFormat: 'JSON with optimization design'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'design']
}));

export const implementAlgorithmicImprovementsTask = defineTask('implement-algorithmic-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Algorithmic Improvements - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Implement algorithmic improvements',
      context: args,
      instructions: [
        '1. Implement better algorithms',
        '2. Optimize data structures',
        '3. Reduce algorithmic complexity',
        '4. Add unit tests',
        '5. Document changes'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'algorithmic']
}));

export const optimizeHotCodePathsTask = defineTask('optimize-hot-code-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Hot Code Paths - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Optimize hot code paths',
      context: args,
      instructions: [
        '1. Inline small functions',
        '2. Reduce function call overhead',
        '3. Optimize loops',
        '4. Remove unnecessary operations',
        '5. Document optimizations'
      ],
      outputFormat: 'JSON with optimization details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'hot-paths']
}));

export const addComputationCachingTask = defineTask('add-computation-caching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Add Computation Caching - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Add caching for expensive computations',
      context: args,
      instructions: [
        '1. Identify cacheable computations',
        '2. Implement memoization',
        '3. Add result caching',
        '4. Configure cache eviction',
        '5. Document caching strategy'
      ],
      outputFormat: 'JSON with caching details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'caching']
}));

export const implementParallelProcessingTask = defineTask('implement-parallel-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Parallel Processing - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Implement parallel processing',
      context: args,
      instructions: [
        '1. Identify parallelizable operations',
        '2. Implement thread pools',
        '3. Add async processing',
        '4. Handle synchronization',
        '5. Document parallel patterns'
      ],
      outputFormat: 'JSON with parallel processing details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'parallel']
}));

export const benchmarkChangesTask = defineTask('benchmark-changes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark Changes - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark before and after changes',
      context: args,
      instructions: [
        '1. Run baseline benchmarks',
        '2. Run optimized benchmarks',
        '3. Compare results',
        '4. Calculate improvement percentages',
        '5. Document benchmark results'
      ],
      outputFormat: 'JSON with benchmark results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: { results: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'benchmarking']
}));

export const validateImprovementsTask = defineTask('validate-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Improvements - ${args.projectName}`,
  agent: {
    name: 'throughput-optimization-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Validate improvements meet targets',
      context: args,
      instructions: [
        '1. Compare against optimization goal',
        '2. Verify no regressions',
        '3. Validate correctness',
        '4. Document validation results',
        '5. Provide recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['improvementPercent', 'artifacts'],
      properties: { improvementPercent: { type: 'number' }, passed: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'cpu-optimization', 'validation']
}));

/**
 * @process specializations/performance-optimization/memory-allocation-optimization
 * @description Memory Allocation Optimization - Reduce memory allocation overhead and improve efficiency
 * including object pooling, temporary object reduction, and data structure optimization.
 * @inputs { projectName: string, targetComponents: array, allocationProfile?: object }
 * @outputs { success: boolean, optimizations: array, allocationReduction: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/memory-allocation-optimization', {
 *   projectName: 'Real-time Analytics',
 *   targetComponents: ['event-processor', 'aggregator', 'serializer'],
 *   allocationProfile: profileData
 * });
 *
 * @references
 * - Caffeine Cache: https://github.com/ben-manes/caffeine
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetComponents = [],
    allocationProfile = {},
    outputDir = 'allocation-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Memory Allocation Optimization for ${projectName}`);

  // Phase 1: Profile Allocation Patterns
  const allocationPatterns = await ctx.task(profileAllocationPatternsTask, { projectName, targetComponents, outputDir });
  artifacts.push(...allocationPatterns.artifacts);

  // Phase 2: Identify High-Allocation Code Paths
  const highAllocation = await ctx.task(identifyHighAllocationPathsTask, { projectName, allocationPatterns, outputDir });
  artifacts.push(...highAllocation.artifacts);

  await ctx.breakpoint({
    question: `Found ${highAllocation.paths.length} high-allocation paths. Review optimization strategies?`,
    title: 'Allocation Analysis',
    context: { runId: ctx.runId, highAllocation }
  });

  // Phase 3: Implement Object Pooling
  const objectPooling = await ctx.task(implementObjectPoolingTask, { projectName, highAllocation, outputDir });
  artifacts.push(...objectPooling.artifacts);

  // Phase 4: Reduce Temporary Object Creation
  const tempObjectReduction = await ctx.task(reduceTemporaryObjectsTask, { projectName, highAllocation, outputDir });
  artifacts.push(...tempObjectReduction.artifacts);

  // Phase 5: Optimize Data Structure Choices
  const dataStructureOpt = await ctx.task(optimizeDataStructuresTask, { projectName, highAllocation, outputDir });
  artifacts.push(...dataStructureOpt.artifacts);

  // Phase 6: Consider Stack vs Heap Allocation
  const stackAllocation = await ctx.task(evaluateStackAllocationTask, { projectName, highAllocation, outputDir });
  artifacts.push(...stackAllocation.artifacts);

  // Phase 7: Benchmark Allocation Improvements
  const benchmarks = await ctx.task(benchmarkAllocationImprovementsTask, { projectName, objectPooling, tempObjectReduction, dataStructureOpt, outputDir });
  artifacts.push(...benchmarks.artifacts);

  // Phase 8: Validate Reduced GC Pressure
  const validation = await ctx.task(validateReducedGCPressureTask, { projectName, benchmarks, outputDir });
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Allocation optimization complete. Reduction: ${validation.allocationReduction}%. Accept changes?`,
    title: 'Allocation Optimization Results',
    context: { runId: ctx.runId, validation }
  });

  return {
    success: true,
    projectName,
    optimizations: [...objectPooling.optimizations, ...tempObjectReduction.optimizations, ...dataStructureOpt.optimizations],
    allocationReduction: validation.allocationReduction,
    gcImprovements: validation.gcImprovements,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/memory-allocation-optimization', timestamp: startTime, outputDir }
  };
}

export const profileAllocationPatternsTask = defineTask('profile-allocation-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Profile Allocation Patterns - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Profile memory allocation patterns', context: args,
      instructions: ['1. Enable allocation profiling', '2. Capture allocation data', '3. Analyze allocation rates', '4. Identify patterns', '5. Document findings'],
      outputFormat: 'JSON with allocation patterns' },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'profiling']
}));

export const identifyHighAllocationPathsTask = defineTask('identify-high-allocation-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify High-Allocation Paths - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Identify high-allocation code paths', context: args,
      instructions: ['1. Rank by allocation rate', '2. Identify allocation hotspots', '3. Analyze object types', '4. Find optimization targets', '5. Document paths'],
      outputFormat: 'JSON with high-allocation paths' },
    outputSchema: { type: 'object', required: ['paths', 'artifacts'], properties: { paths: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'hotspots']
}));

export const implementObjectPoolingTask = defineTask('implement-object-pooling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Object Pooling - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Implement object pooling', context: args,
      instructions: ['1. Identify poolable objects', '2. Implement object pools', '3. Configure pool sizes', '4. Add pool monitoring', '5. Document pooling'],
      outputFormat: 'JSON with pooling implementation' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'pooling']
}));

export const reduceTemporaryObjectsTask = defineTask('reduce-temporary-objects', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reduce Temporary Objects - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Reduce temporary object creation', context: args,
      instructions: ['1. Find temporary allocations', '2. Reuse objects where possible', '3. Use primitives', '4. Reduce boxing', '5. Document changes'],
      outputFormat: 'JSON with reduction details' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'temporary-objects']
}));

export const optimizeDataStructuresTask = defineTask('optimize-data-structures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Data Structures - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Optimize data structure choices', context: args,
      instructions: ['1. Review data structure usage', '2. Use compact structures', '3. Pre-size collections', '4. Use specialized types', '5. Document optimizations'],
      outputFormat: 'JSON with data structure optimizations' },
    outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'data-structures']
}));

export const evaluateStackAllocationTask = defineTask('evaluate-stack-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Stack Allocation - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Evaluate stack vs heap allocation', context: args,
      instructions: ['1. Identify stack-eligible objects', '2. Analyze escape analysis', '3. Enable scalar replacement', '4. Verify stack allocation', '5. Document findings'],
      outputFormat: 'JSON with stack allocation evaluation' },
    outputSchema: { type: 'object', required: ['evaluation', 'artifacts'], properties: { evaluation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'stack']
}));

export const benchmarkAllocationImprovementsTask = defineTask('benchmark-allocation-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark Allocation Improvements - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Benchmark allocation improvements', context: args,
      instructions: ['1. Measure before allocation rate', '2. Measure after allocation rate', '3. Compare GC activity', '4. Calculate improvements', '5. Document benchmarks'],
      outputFormat: 'JSON with benchmark results' },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'benchmarking']
}));

export const validateReducedGCPressureTask = defineTask('validate-reduced-gc-pressure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Reduced GC Pressure - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Validate reduced GC pressure', context: args,
      instructions: ['1. Compare GC frequency', '2. Compare pause times', '3. Validate memory usage', '4. Calculate reduction', '5. Document validation'],
      outputFormat: 'JSON with validation results' },
    outputSchema: { type: 'object', required: ['allocationReduction', 'gcImprovements', 'artifacts'], properties: { allocationReduction: { type: 'number' }, gcImprovements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'allocation', 'validation']
}));

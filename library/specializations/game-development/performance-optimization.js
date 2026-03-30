/**
 * @process specializations/game-development/performance-optimization
 * @description Game Performance Optimization Process - Profile, analyze, and optimize game performance including
 * frame rate, memory usage, load times, and platform-specific optimizations for target hardware.
 * @inputs { projectName: string, targetPlatforms?: array, fpsTarget?: number, memoryBudget?: string, outputDir?: string }
 * @outputs { success: boolean, optimizations: array, performanceReport: string, metricsImprovement: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/performance-optimization', {
 *   projectName: 'Stellar Odyssey',
 *   targetPlatforms: ['PC', 'PlayStation 5'],
 *   fpsTarget: 60,
 *   memoryBudget: '8GB'
 * });
 *
 * @references
 * - Game Engine Architecture by Jason Gregory
 * - GPU Gems Series
 * - GDC Performance Optimization Talks
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetPlatforms = ['PC'],
    fpsTarget = 60,
    memoryBudget = '4GB',
    loadTimeTarget = 10,
    outputDir = 'performance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Optimization: ${projectName}`);
  ctx.log('info', `Targets: ${fpsTarget}fps, ${memoryBudget} memory, ${loadTimeTarget}s load time`);

  // Phase 1: Baseline Profiling
  const baselineProfiling = await ctx.task(baselineProfilingTask, {
    projectName, targetPlatforms, fpsTarget, memoryBudget, outputDir
  });
  artifacts.push(...baselineProfiling.artifacts);

  // Phase 2: CPU Optimization
  const cpuOptimization = await ctx.task(cpuOptimizationTask, {
    projectName, baselineProfiling, fpsTarget, outputDir
  });
  artifacts.push(...cpuOptimization.artifacts);

  // Phase 3: GPU Optimization
  const gpuOptimization = await ctx.task(gpuOptimizationTask, {
    projectName, baselineProfiling, fpsTarget, outputDir
  });
  artifacts.push(...gpuOptimization.artifacts);

  // Phase 4: Memory Optimization
  const memoryOptimization = await ctx.task(memoryOptimizationTask, {
    projectName, baselineProfiling, memoryBudget, outputDir
  });
  artifacts.push(...memoryOptimization.artifacts);

  // Phase 5: Load Time Optimization
  const loadTimeOptimization = await ctx.task(loadTimeOptimizationTask, {
    projectName, loadTimeTarget, outputDir
  });
  artifacts.push(...loadTimeOptimization.artifacts);

  // Phase 6: Platform-Specific Optimization
  const platformOptimization = await ctx.task(platformOptimizationTask, {
    projectName, targetPlatforms, fpsTarget, outputDir
  });
  artifacts.push(...platformOptimization.artifacts);

  // Phase 7: Final Profiling
  const finalProfiling = await ctx.task(finalProfilingTask, {
    projectName, baselineProfiling, fpsTarget, memoryBudget, loadTimeTarget, outputDir
  });
  artifacts.push(...finalProfiling.artifacts);

  await ctx.breakpoint({
    question: `Performance optimization complete for ${projectName}. FPS: ${finalProfiling.avgFps}. Memory: ${finalProfiling.memoryUsage}. Load time: ${finalProfiling.loadTime}s. Targets met: ${finalProfiling.targetsMet}. Review report?`,
    title: 'Performance Optimization Complete',
    context: { runId: ctx.runId, finalProfiling, improvements: finalProfiling.improvements }
  });

  return {
    success: true,
    projectName,
    optimizations: [...cpuOptimization.optimizations, ...gpuOptimization.optimizations, ...memoryOptimization.optimizations],
    performanceReport: finalProfiling.reportPath,
    metricsImprovement: finalProfiling.improvements,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/performance-optimization', timestamp: startTime, outputDir }
  };
}

export const baselineProfilingTask = defineTask('baseline-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Baseline Profiling - ${args.projectName}`,
  agent: {
    name: 'optimization-engineer-agent',
    prompt: { role: 'Performance Engineer', task: 'Profile baseline performance', context: args, instructions: ['1. Profile CPU usage', '2. Profile GPU usage', '3. Measure memory usage', '4. Identify bottlenecks'] },
    outputSchema: { type: 'object', required: ['currentFps', 'currentMemory', 'bottlenecks', 'artifacts'], properties: { currentFps: { type: 'number' }, currentMemory: { type: 'string' }, bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'performance', 'profiling']
}));

export const cpuOptimizationTask = defineTask('cpu-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `CPU Optimization - ${args.projectName}`,
  agent: {
    name: 'optimization-engineer-agent',
    prompt: { role: 'Performance Engineer', task: 'Optimize CPU performance', context: args, instructions: ['1. Optimize hot paths', '2. Implement multithreading', '3. Optimize algorithms', '4. Reduce allocations'] },
    outputSchema: { type: 'object', required: ['optimizations', 'fpsGain', 'artifacts'], properties: { optimizations: { type: 'array' }, fpsGain: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'performance', 'cpu']
}));

export const gpuOptimizationTask = defineTask('gpu-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `GPU Optimization - ${args.projectName}`,
  agent: {
    name: 'graphics-programmer-agent',
    prompt: { role: 'Graphics Engineer', task: 'Optimize GPU performance', context: args, instructions: ['1. Optimize draw calls', '2. Implement LOD', '3. Optimize shaders', '4. Add occlusion culling'] },
    outputSchema: { type: 'object', required: ['optimizations', 'fpsGain', 'artifacts'], properties: { optimizations: { type: 'array' }, fpsGain: { type: 'number' }, drawCallReduction: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'performance', 'gpu']
}));

export const memoryOptimizationTask = defineTask('memory-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Memory Optimization - ${args.projectName}`,
  agent: {
    name: 'optimization-engineer-agent',
    prompt: { role: 'Performance Engineer', task: 'Optimize memory usage', context: args, instructions: ['1. Implement asset streaming', '2. Optimize texture memory', '3. Implement object pooling', '4. Fix memory leaks'] },
    outputSchema: { type: 'object', required: ['optimizations', 'memorySaved', 'artifacts'], properties: { optimizations: { type: 'array' }, memorySaved: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'performance', 'memory']
}));

export const loadTimeOptimizationTask = defineTask('load-time-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Load Time Optimization - ${args.projectName}`,
  agent: {
    name: 'optimization-engineer-agent',
    prompt: { role: 'Performance Engineer', task: 'Optimize load times', context: args, instructions: ['1. Implement async loading', '2. Optimize asset formats', '3. Add loading prioritization', '4. Implement level streaming'] },
    outputSchema: { type: 'object', required: ['loadTimeReduction', 'techniques', 'artifacts'], properties: { loadTimeReduction: { type: 'number' }, techniques: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'performance', 'load-time']
}));

export const platformOptimizationTask = defineTask('platform-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Optimization - ${args.projectName}`,
  agent: {
    name: 'platform-programmer-agent',
    prompt: { role: 'Platform Engineer', task: 'Apply platform-specific optimizations', context: args, instructions: ['1. Use platform APIs', '2. Optimize for hardware', '3. Add quality presets', '4. Test on target hardware'] },
    outputSchema: { type: 'object', required: ['platformOptimizations', 'artifacts'], properties: { platformOptimizations: { type: 'object' }, qualityPresets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'performance', 'platform']
}));

export const finalProfilingTask = defineTask('final-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Final Profiling - ${args.projectName}`,
  agent: {
    name: 'optimization-engineer-agent',
    prompt: { role: 'Performance Engineer', task: 'Profile final performance', context: args, instructions: ['1. Profile all platforms', '2. Compare to baseline', '3. Verify targets met', '4. Generate performance report'] },
    outputSchema: { type: 'object', required: ['avgFps', 'memoryUsage', 'loadTime', 'targetsMet', 'improvements', 'reportPath', 'artifacts'], properties: { avgFps: { type: 'number' }, memoryUsage: { type: 'string' }, loadTime: { type: 'number' }, targetsMet: { type: 'boolean' }, improvements: { type: 'object' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'performance', 'final-profiling']
}));

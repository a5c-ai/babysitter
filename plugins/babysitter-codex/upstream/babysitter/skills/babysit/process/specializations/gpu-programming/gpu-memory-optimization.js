/**
 * @process specializations/gpu-programming/gpu-memory-optimization
 * @description GPU Memory Optimization - Systematic approach to optimizing GPU memory access patterns,
 * reducing memory bandwidth bottlenecks, and maximizing cache utilization.
 * @inputs { projectName: string, targetKernels: array, memoryAnalysis?: boolean, targetBandwidth?: number, outputDir?: string }
 * @outputs { success: boolean, optimizations: array, bandwidthImprovement: object, accessPatternReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/gpu-memory-optimization', {
 *   projectName: 'matrix_ops',
 *   targetKernels: ['matmul', 'transpose'],
 *   memoryAnalysis: true,
 *   targetBandwidth: 80 // percentage of theoretical max
 * });
 *
 * @references
 * - CUDA C++ Best Practices Guide - Memory Optimizations: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
 * - GPU Gems: Optimizing Memory Access: https://developer.nvidia.com/gpugems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetKernels,
    memoryAnalysis = true,
    targetBandwidth = 80,
    outputDir = 'memory-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GPU Memory Optimization: ${projectName}`);
  ctx.log('info', `Target kernels: ${targetKernels.join(', ')}, Target bandwidth: ${targetBandwidth}%`);

  // Phase 1: Memory Access Pattern Analysis
  const accessAnalysis = await ctx.task(memoryAccessAnalysisTask, {
    projectName, targetKernels, outputDir
  });
  artifacts.push(...accessAnalysis.artifacts);

  // Phase 2: Coalescing Optimization
  const coalescingOpt = await ctx.task(coalescingOptimizationTask, {
    projectName, targetKernels, accessAnalysis, outputDir
  });
  artifacts.push(...coalescingOpt.artifacts);

  // Phase 3: Shared Memory Optimization
  const sharedMemOpt = await ctx.task(sharedMemoryOptimizationTask, {
    projectName, targetKernels, accessAnalysis, outputDir
  });
  artifacts.push(...sharedMemOpt.artifacts);

  // Phase 4: Bank Conflict Resolution
  const bankConflictOpt = await ctx.task(bankConflictResolutionTask, {
    projectName, sharedMemOpt, outputDir
  });
  artifacts.push(...bankConflictOpt.artifacts);

  // Phase 5: Cache Utilization
  const cacheOpt = await ctx.task(cacheUtilizationTask, {
    projectName, targetKernels, accessAnalysis, outputDir
  });
  artifacts.push(...cacheOpt.artifacts);

  // Phase 6: Texture and Constant Memory
  const specialMemOpt = await ctx.task(specialMemoryOptimizationTask, {
    projectName, targetKernels, accessAnalysis, outputDir
  });
  artifacts.push(...specialMemOpt.artifacts);

  // Phase 7: Bandwidth Measurement
  const bandwidthMeasurement = await ctx.task(bandwidthMeasurementTask, {
    projectName, targetKernels, targetBandwidth, outputDir
  });
  artifacts.push(...bandwidthMeasurement.artifacts);

  await ctx.breakpoint({
    question: `Memory optimization complete for ${projectName}. Bandwidth utilization: ${bandwidthMeasurement.achievedBandwidth}% (target: ${targetBandwidth}%). Review optimizations?`,
    title: 'Memory Optimization Complete',
    context: { runId: ctx.runId, bandwidthMeasurement }
  });

  return {
    success: bandwidthMeasurement.achievedBandwidth >= targetBandwidth,
    projectName,
    optimizations: [
      ...coalescingOpt.optimizations,
      ...sharedMemOpt.optimizations,
      ...bankConflictOpt.optimizations,
      ...cacheOpt.optimizations,
      ...specialMemOpt.optimizations
    ],
    bandwidthImprovement: {
      before: accessAnalysis.initialBandwidth,
      after: bandwidthMeasurement.achievedBandwidth,
      improvement: bandwidthMeasurement.achievedBandwidth - accessAnalysis.initialBandwidth
    },
    accessPatternReport: accessAnalysis.report,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/gpu-memory-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const memoryAccessAnalysisTask = defineTask('memory-access-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Memory Access Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze GPU memory access patterns',
      context: args,
      instructions: [
        '1. Profile memory transactions with Nsight Compute',
        '2. Identify coalesced vs uncoalesced accesses',
        '3. Measure global memory throughput',
        '4. Analyze shared memory usage',
        '5. Identify memory-bound kernels',
        '6. Profile L1/L2 cache hit rates',
        '7. Identify strided access patterns',
        '8. Analyze memory divergence',
        '9. Create access pattern visualization',
        '10. Document baseline metrics'
      ],
      outputFormat: 'JSON with memory access analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'initialBandwidth', 'artifacts'],
      properties: {
        report: { type: 'object' },
        initialBandwidth: { type: 'number' },
        coalescingIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory', 'analysis']
}));

export const coalescingOptimizationTask = defineTask('coalescing-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coalescing Optimization - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize memory coalescing',
      context: args,
      instructions: [
        '1. Restructure data layouts for coalescing',
        '2. Convert AoS to SoA where beneficial',
        '3. Align memory accesses to warp boundaries',
        '4. Pad arrays for optimal alignment',
        '5. Reorder thread indexing',
        '6. Implement strided access workarounds',
        '7. Use vectorized loads where applicable',
        '8. Optimize matrix access patterns',
        '9. Profile improved coalescing',
        '10. Document transformations'
      ],
      outputFormat: 'JSON with coalescing optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'coalescingImprovement', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        coalescingImprovement: { type: 'number' },
        dataLayoutChanges: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory', 'coalescing']
}));

export const sharedMemoryOptimizationTask = defineTask('shared-memory-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shared Memory Optimization - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize shared memory usage',
      context: args,
      instructions: [
        '1. Identify data reuse opportunities',
        '2. Implement tiling strategies',
        '3. Size shared memory allocations',
        '4. Add synchronization barriers',
        '5. Balance shared memory vs occupancy',
        '6. Implement double buffering',
        '7. Optimize tile sizes',
        '8. Handle boundary conditions',
        '9. Profile shared memory bandwidth',
        '10. Document shared memory strategy'
      ],
      outputFormat: 'JSON with shared memory optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'sharedMemUsage', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        sharedMemUsage: { type: 'object' },
        tilingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory', 'shared-memory']
}));

export const bankConflictResolutionTask = defineTask('bank-conflict-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bank Conflict Resolution - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Resolve shared memory bank conflicts',
      context: args,
      instructions: [
        '1. Analyze bank access patterns',
        '2. Identify n-way bank conflicts',
        '3. Add padding to eliminate conflicts',
        '4. Restructure access indices',
        '5. Profile bank conflict metrics',
        '6. Test different padding strategies',
        '7. Balance padding vs memory usage',
        '8. Document conflict resolution',
        '9. Verify no new conflicts introduced',
        '10. Measure performance improvement'
      ],
      outputFormat: 'JSON with bank conflict resolution details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'conflictsResolved', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        conflictsResolved: { type: 'number' },
        paddingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory', 'bank-conflicts']
}));

export const cacheUtilizationTask = defineTask('cache-utilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cache Utilization - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize GPU cache utilization',
      context: args,
      instructions: [
        '1. Profile L1/L2 cache hit rates',
        '2. Configure L1/shared memory split',
        '3. Optimize data locality',
        '4. Use cache hints where available',
        '5. Implement cache-friendly algorithms',
        '6. Reduce cache thrashing',
        '7. Profile cache metrics',
        '8. Test different configurations',
        '9. Document cache strategy',
        '10. Measure improvement'
      ],
      outputFormat: 'JSON with cache optimization details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'cacheHitRates', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        cacheHitRates: { type: 'object' },
        cacheConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory', 'cache']
}));

export const specialMemoryOptimizationTask = defineTask('special-memory-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Special Memory Optimization - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize texture and constant memory usage',
      context: args,
      instructions: [
        '1. Identify texture memory candidates',
        '2. Implement texture memory bindings',
        '3. Use constant memory for read-only data',
        '4. Configure texture filtering modes',
        '5. Handle texture cache utilization',
        '6. Implement surface memory if needed',
        '7. Profile special memory bandwidth',
        '8. Compare vs global memory',
        '9. Document usage patterns',
        '10. Measure improvement'
      ],
      outputFormat: 'JSON with special memory optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'textureUsage', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        textureUsage: { type: 'object' },
        constantMemoryUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory', 'texture']
}));

export const bandwidthMeasurementTask = defineTask('bandwidth-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bandwidth Measurement - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Measure final memory bandwidth',
      context: args,
      instructions: [
        '1. Profile final memory throughput',
        '2. Compare to theoretical maximum',
        '3. Calculate bandwidth efficiency',
        '4. Benchmark all optimized kernels',
        '5. Create comparison charts',
        '6. Document achieved improvements',
        '7. Identify remaining bottlenecks',
        '8. Generate optimization report',
        '9. Provide further recommendations',
        '10. Create performance summary'
      ],
      outputFormat: 'JSON with bandwidth measurement results'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedBandwidth', 'theoreticalMax', 'artifacts'],
      properties: {
        achievedBandwidth: { type: 'number' },
        theoreticalMax: { type: 'number' },
        kernelBandwidths: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory', 'bandwidth']
}));

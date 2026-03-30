/**
 * @process specializations/gpu-programming/shared-memory-usage-patterns
 * @description Shared Memory Usage Patterns - Process for effectively utilizing shared memory for inter-thread
 * communication, data reuse, and performance optimization.
 * @inputs { projectName: string, targetKernels: array, tilingStrategy?: string, optimizeBankConflicts?: boolean, outputDir?: string }
 * @outputs { success: boolean, sharedMemoryDesign: object, tiledImplementations: array, bankConflictAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/shared-memory-usage-patterns', {
 *   projectName: 'matrix_transpose',
 *   targetKernels: ['transpose_naive', 'transpose_tiled'],
 *   tilingStrategy: 'square-tiles',
 *   optimizeBankConflicts: true
 * });
 *
 * @references
 * - Shared Memory: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - Bank Conflicts: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetKernels,
    tilingStrategy = 'auto',
    optimizeBankConflicts = true,
    outputDir = 'shared-memory-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Shared Memory Optimization: ${projectName}`);
  ctx.log('info', `Kernels: ${targetKernels.join(', ')}, Tiling: ${tilingStrategy}`);

  // Phase 1: Data Reuse Analysis
  const dataReuseAnalysis = await ctx.task(dataReuseAnalysisTask, {
    projectName, targetKernels, outputDir
  });
  artifacts.push(...dataReuseAnalysis.artifacts);

  // Phase 2: Tiling Strategy Design
  const tilingDesign = await ctx.task(tilingStrategyDesignTask, {
    projectName, targetKernels, tilingStrategy, dataReuseAnalysis, outputDir
  });
  artifacts.push(...tilingDesign.artifacts);

  // Phase 3: Shared Memory Allocation
  const sharedMemAllocation = await ctx.task(sharedMemoryAllocationTask, {
    projectName, targetKernels, tilingDesign, outputDir
  });
  artifacts.push(...sharedMemAllocation.artifacts);

  // Phase 4: Bank Conflict Analysis
  let bankConflictOpt = null;
  if (optimizeBankConflicts) {
    bankConflictOpt = await ctx.task(sharedMemBankConflictTask, {
      projectName, sharedMemAllocation, outputDir
    });
    artifacts.push(...bankConflictOpt.artifacts);
  }

  // Phase 5: Synchronization Design
  const syncDesign = await ctx.task(sharedMemSyncDesignTask, {
    projectName, tilingDesign, sharedMemAllocation, outputDir
  });
  artifacts.push(...syncDesign.artifacts);

  // Phase 6: Implementation
  const implementation = await ctx.task(sharedMemImplementationTask, {
    projectName, targetKernels, tilingDesign, sharedMemAllocation, bankConflictOpt, syncDesign, outputDir
  });
  artifacts.push(...implementation.artifacts);

  // Phase 7: Performance Validation
  const perfValidation = await ctx.task(sharedMemPerformanceTask, {
    projectName, targetKernels, implementation, outputDir
  });
  artifacts.push(...perfValidation.artifacts);

  await ctx.breakpoint({
    question: `Shared memory optimization complete for ${projectName}. Speedup: ${perfValidation.speedup}x. Review?`,
    title: 'Shared Memory Optimization Complete',
    context: { runId: ctx.runId, perfValidation }
  });

  return {
    success: perfValidation.speedup >= 1.2,
    projectName,
    sharedMemoryDesign: {
      reusePatterns: dataReuseAnalysis.patterns,
      tilingStrategy: tilingDesign.strategy,
      allocation: sharedMemAllocation.allocation
    },
    tiledImplementations: implementation.tiledKernels,
    bankConflictAnalysis: bankConflictOpt ? {
      conflictsFound: bankConflictOpt.conflictsFound,
      resolved: bankConflictOpt.resolved,
      paddingUsed: bankConflictOpt.paddingStrategy
    } : null,
    performance: {
      speedup: perfValidation.speedup,
      bandwidthImprovement: perfValidation.bandwidthImprovement
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/shared-memory-usage-patterns',
      timestamp: startTime,
      outputDir
    }
  };
}

export const dataReuseAnalysisTask = defineTask('data-reuse-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Reuse Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'warp-primitives'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze data reuse opportunities',
      context: args,
      instructions: [
        '1. Identify data access patterns',
        '2. Analyze temporal data reuse',
        '3. Analyze spatial data reuse',
        '4. Calculate reuse distances',
        '5. Identify cacheable data',
        '6. Profile global memory accesses',
        '7. Find redundant loads',
        '8. Calculate potential savings',
        '9. Document reuse patterns',
        '10. Recommend shared mem candidates'
      ],
      outputFormat: 'JSON with data reuse analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'reuseOpportunities', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'object' } },
        reuseOpportunities: { type: 'array', items: { type: 'object' } },
        potentialSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'shared-memory', 'reuse']
}));

export const tilingStrategyDesignTask = defineTask('tiling-strategy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tiling Strategy - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design tiling strategy',
      context: args,
      instructions: [
        '1. Determine optimal tile sizes',
        '2. Design tile loading pattern',
        '3. Handle tile boundaries',
        '4. Plan halo regions for stencils',
        '5. Balance tile size vs occupancy',
        '6. Design multi-level tiling',
        '7. Handle non-divisible sizes',
        '8. Optimize for cache lines',
        '9. Document tiling strategy',
        '10. Create tile size auto-tuning'
      ],
      outputFormat: 'JSON with tiling strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'tileSizes', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        tileSizes: { type: 'object' },
        loadingPattern: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'shared-memory', 'tiling']
}));

export const sharedMemoryAllocationTask = defineTask('shared-memory-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shared Memory Allocation - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design shared memory allocation',
      context: args,
      instructions: [
        '1. Calculate shared memory size',
        '2. Design memory layout',
        '3. Use static vs dynamic allocation',
        '4. Plan double buffering if needed',
        '5. Consider occupancy impact',
        '6. Configure L1/shared split',
        '7. Handle alignment requirements',
        '8. Plan memory reuse',
        '9. Document allocation strategy',
        '10. Test allocation limits'
      ],
      outputFormat: 'JSON with shared memory allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['allocation', 'memoryLayout', 'artifacts'],
      properties: {
        allocation: { type: 'object' },
        memoryLayout: { type: 'object' },
        totalSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'shared-memory', 'allocation']
}));

export const sharedMemBankConflictTask = defineTask('shared-mem-bank-conflict', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bank Conflict Optimization - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'warp-primitives'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize bank conflicts',
      context: args,
      instructions: [
        '1. Analyze bank access patterns',
        '2. Profile bank conflict metrics',
        '3. Calculate n-way conflicts',
        '4. Design padding strategy',
        '5. Restructure memory layout',
        '6. Test conflict-free patterns',
        '7. Balance padding vs memory',
        '8. Handle 2D vs 1D arrays',
        '9. Profile optimized access',
        '10. Document bank strategy'
      ],
      outputFormat: 'JSON with bank conflict optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['conflictsFound', 'resolved', 'paddingStrategy', 'artifacts'],
      properties: {
        conflictsFound: { type: 'number' },
        resolved: { type: 'number' },
        paddingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'shared-memory', 'bank-conflicts']
}));

export const sharedMemSyncDesignTask = defineTask('shared-mem-sync-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synchronization Design - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design synchronization for shared memory',
      context: args,
      instructions: [
        '1. Identify sync points',
        '2. Place __syncthreads correctly',
        '3. Minimize barrier usage',
        '4. Handle conditional sync',
        '5. Use __syncwarp where applicable',
        '6. Avoid deadlock scenarios',
        '7. Profile sync overhead',
        '8. Use cooperative groups',
        '9. Document sync strategy',
        '10. Test correctness'
      ],
      outputFormat: 'JSON with synchronization design'
    },
    outputSchema: {
      type: 'object',
      required: ['syncPoints', 'syncStrategy', 'artifacts'],
      properties: {
        syncPoints: { type: 'array', items: { type: 'object' } },
        syncStrategy: { type: 'string' },
        overhead: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'shared-memory', 'sync']
}));

export const sharedMemImplementationTask = defineTask('shared-mem-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement shared memory optimizations',
      context: args,
      instructions: [
        '1. Implement tiled kernels',
        '2. Add shared memory declarations',
        '3. Implement tile loading',
        '4. Add synchronization',
        '5. Implement computation phase',
        '6. Handle boundary conditions',
        '7. Apply bank conflict fixes',
        '8. Add double buffering if needed',
        '9. Test correctness',
        '10. Document implementation'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['tiledKernels', 'kernelCode', 'artifacts'],
      properties: {
        tiledKernels: { type: 'array', items: { type: 'object' } },
        kernelCode: { type: 'object' },
        boundaryHandling: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'shared-memory', 'implementation']
}));

export const sharedMemPerformanceTask = defineTask('shared-mem-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Validation - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'warp-primitives'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Validate shared memory performance',
      context: args,
      instructions: [
        '1. Benchmark tiled vs naive',
        '2. Measure speedup',
        '3. Profile bandwidth improvement',
        '4. Verify bank conflict reduction',
        '5. Test various data sizes',
        '6. Compare occupancy impact',
        '7. Create comparison charts',
        '8. Document results',
        '9. Identify further opportunities',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with performance validation'
    },
    outputSchema: {
      type: 'object',
      required: ['speedup', 'bandwidthImprovement', 'artifacts'],
      properties: {
        speedup: { type: 'number' },
        bandwidthImprovement: { type: 'number' },
        benchmarkResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'shared-memory', 'performance']
}));

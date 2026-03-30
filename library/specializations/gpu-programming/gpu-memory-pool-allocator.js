/**
 * @process specializations/gpu-programming/gpu-memory-pool-allocator
 * @description GPU Memory Pool and Allocator Design - Workflow for implementing custom GPU memory allocators
 * and pools to reduce allocation overhead and fragmentation.
 * @inputs { projectName: string, allocationType: string, poolStrategy?: string, memoryBudget?: string, outputDir?: string }
 * @outputs { success: boolean, allocatorImplementation: object, poolConfiguration: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/gpu-memory-pool-allocator', {
 *   projectName: 'inference_engine',
 *   allocationType: 'caching',
 *   poolStrategy: 'buddy-system',
 *   memoryBudget: '4GB'
 * });
 *
 * @references
 * - CUDA Memory Management: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - Memory Pools API: https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__MEMORY__POOLS.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    allocationType,
    poolStrategy = 'caching',
    memoryBudget = '4GB',
    outputDir = 'memory-pool-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GPU Memory Pool/Allocator Design: ${projectName}`);
  ctx.log('info', `Type: ${allocationType}, Strategy: ${poolStrategy}, Budget: ${memoryBudget}`);

  // Phase 1: Allocation Pattern Analysis
  const allocationAnalysis = await ctx.task(allocationPatternAnalysisTask, {
    projectName, outputDir
  });
  artifacts.push(...allocationAnalysis.artifacts);

  // Phase 2: Pool Architecture Design
  const poolArchitecture = await ctx.task(poolArchitectureTask, {
    projectName, poolStrategy, memoryBudget, allocationAnalysis, outputDir
  });
  artifacts.push(...poolArchitecture.artifacts);

  // Phase 3: Allocator Implementation
  const allocatorImpl = await ctx.task(allocatorImplementationTask, {
    projectName, allocationType, poolArchitecture, outputDir
  });
  artifacts.push(...allocatorImpl.artifacts);

  // Phase 4: Fragmentation Management
  const fragmentationMgmt = await ctx.task(fragmentationManagementTask, {
    projectName, poolArchitecture, allocatorImpl, outputDir
  });
  artifacts.push(...fragmentationMgmt.artifacts);

  // Phase 5: CUDA Memory Pools Integration
  const cudaPoolsIntegration = await ctx.task(cudaMemoryPoolsTask, {
    projectName, allocatorImpl, outputDir
  });
  artifacts.push(...cudaPoolsIntegration.artifacts);

  // Phase 6: Performance Benchmarking
  const benchmarking = await ctx.task(allocatorBenchmarkingTask, {
    projectName, allocatorImpl, cudaPoolsIntegration, outputDir
  });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Memory pool/allocator complete for ${projectName}. Allocation speedup: ${benchmarking.allocationSpeedup}x. Review?`,
    title: 'Memory Allocator Complete',
    context: { runId: ctx.runId, benchmarking }
  });

  return {
    success: benchmarking.allocationSpeedup >= 2.0,
    projectName,
    allocatorImplementation: {
      allocatorPath: allocatorImpl.allocatorPath,
      headerPath: allocatorImpl.headerPath,
      allocationType
    },
    poolConfiguration: {
      strategy: poolStrategy,
      memoryBudget,
      pools: poolArchitecture.pools,
      fragmentationHandling: fragmentationMgmt.strategy
    },
    performanceMetrics: {
      allocationSpeedup: benchmarking.allocationSpeedup,
      fragmentationRatio: benchmarking.fragmentationRatio,
      peakMemory: benchmarking.peakMemory
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/gpu-memory-pool-allocator',
      timestamp: startTime,
      outputDir
    }
  };
}

export const allocationPatternAnalysisTask = defineTask('allocation-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Allocation Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze allocation patterns',
      context: args,
      instructions: [
        '1. Profile allocation frequencies',
        '2. Analyze allocation sizes',
        '3. Identify allocation hotspots',
        '4. Measure allocation latency',
        '5. Identify reusable allocations',
        '6. Profile deallocation patterns',
        '7. Analyze memory lifetime',
        '8. Identify fragmentation sources',
        '9. Document patterns',
        '10. Recommend pool strategy'
      ],
      outputFormat: 'JSON with allocation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'recommendations', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        sizeDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory-pool', 'analysis']
}));

export const poolArchitectureTask = defineTask('pool-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pool Architecture - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design memory pool architecture',
      context: args,
      instructions: [
        '1. Design pool hierarchy',
        '2. Define size classes',
        '3. Configure pool capacities',
        '4. Design allocation strategy',
        '5. Plan memory recycling',
        '6. Design thread safety',
        '7. Handle pool exhaustion',
        '8. Design pool expansion',
        '9. Document architecture',
        '10. Create configuration API'
      ],
      outputFormat: 'JSON with pool architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['pools', 'sizeClasses', 'artifacts'],
      properties: {
        pools: { type: 'array', items: { type: 'object' } },
        sizeClasses: { type: 'array', items: { type: 'number' } },
        totalCapacity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory-pool', 'architecture']
}));

export const allocatorImplementationTask = defineTask('allocator-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Allocator Implementation - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement memory allocator',
      context: args,
      instructions: [
        '1. Implement allocation function',
        '2. Implement deallocation function',
        '3. Implement size query',
        '4. Add thread safety',
        '5. Implement caching logic',
        '6. Add statistics tracking',
        '7. Handle edge cases',
        '8. Implement reset/cleanup',
        '9. Test allocator',
        '10. Document API'
      ],
      outputFormat: 'JSON with allocator implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['allocatorPath', 'headerPath', 'artifacts'],
      properties: {
        allocatorPath: { type: 'string' },
        headerPath: { type: 'string' },
        api: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory-pool', 'implementation']
}));

export const fragmentationManagementTask = defineTask('fragmentation-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fragmentation Management - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement fragmentation management',
      context: args,
      instructions: [
        '1. Implement coalescing',
        '2. Design defragmentation',
        '3. Track fragmentation metrics',
        '4. Implement compaction',
        '5. Handle external fragmentation',
        '6. Handle internal fragmentation',
        '7. Trigger defrag conditions',
        '8. Minimize defrag overhead',
        '9. Test fragmentation handling',
        '10. Document strategy'
      ],
      outputFormat: 'JSON with fragmentation management'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'mechanisms', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        mechanisms: { type: 'array', items: { type: 'string' } },
        defragPolicy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory-pool', 'fragmentation']
}));

export const cudaMemoryPoolsTask = defineTask('cuda-memory-pools', (args, taskCtx) => ({
  kind: 'agent',
  title: `CUDA Memory Pools - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Integrate CUDA memory pools API',
      context: args,
      instructions: [
        '1. Create cudaMemPool_t',
        '2. Configure pool properties',
        '3. Use cudaMallocAsync',
        '4. Use cudaFreeAsync',
        '5. Set release threshold',
        '6. Handle pool attributes',
        '7. Enable pool sharing',
        '8. Profile async allocations',
        '9. Compare to custom allocator',
        '10. Document integration'
      ],
      outputFormat: 'JSON with CUDA memory pools integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationCode', 'configuration', 'artifacts'],
      properties: {
        integrationCode: { type: 'string' },
        configuration: { type: 'object' },
        comparisonResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory-pool', 'cuda-api']
}));

export const allocatorBenchmarkingTask = defineTask('allocator-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmarking - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Benchmark memory allocator',
      context: args,
      instructions: [
        '1. Benchmark allocation latency',
        '2. Compare to cudaMalloc',
        '3. Measure throughput',
        '4. Profile fragmentation',
        '5. Test under load',
        '6. Measure peak memory',
        '7. Test concurrent access',
        '8. Compare pool strategies',
        '9. Create benchmark report',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with benchmarking results'
    },
    outputSchema: {
      type: 'object',
      required: ['allocationSpeedup', 'fragmentationRatio', 'peakMemory', 'artifacts'],
      properties: {
        allocationSpeedup: { type: 'number' },
        fragmentationRatio: { type: 'number' },
        peakMemory: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'memory-pool', 'benchmarking']
}));

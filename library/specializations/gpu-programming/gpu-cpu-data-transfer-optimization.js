/**
 * @process specializations/gpu-programming/gpu-cpu-data-transfer-optimization
 * @description GPU-CPU Data Transfer Optimization - Workflow for minimizing data transfer overhead between
 * host and device memory. Covers asynchronous transfers, pinned memory, and compute-transfer overlap.
 * @inputs { projectName: string, transferPatterns: array, usePinnedMemory?: boolean, asyncTransfers?: boolean, outputDir?: string }
 * @outputs { success: boolean, optimizations: array, transferEfficiency: object, overlapAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/gpu-cpu-data-transfer-optimization', {
 *   projectName: 'streaming_pipeline',
 *   transferPatterns: ['input_streaming', 'output_collection'],
 *   usePinnedMemory: true,
 *   asyncTransfers: true
 * });
 *
 * @references
 * - CUDA Best Practices - Data Transfer: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
 * - Unified Memory: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    transferPatterns,
    usePinnedMemory = true,
    asyncTransfers = true,
    useUnifiedMemory = false,
    outputDir = 'transfer-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Data Transfer Optimization: ${projectName}`);
  ctx.log('info', `Patterns: ${transferPatterns.join(', ')}, Pinned: ${usePinnedMemory}, Async: ${asyncTransfers}`);

  // Phase 1: Transfer Pattern Analysis
  const transferAnalysis = await ctx.task(transferAnalysisTask, {
    projectName, transferPatterns, outputDir
  });
  artifacts.push(...transferAnalysis.artifacts);

  // Phase 2: Pinned Memory Implementation
  let pinnedMemory = null;
  if (usePinnedMemory) {
    pinnedMemory = await ctx.task(pinnedMemoryTask, {
      projectName, transferAnalysis, outputDir
    });
    artifacts.push(...pinnedMemory.artifacts);
  }

  // Phase 3: Async Transfer Implementation
  let asyncImpl = null;
  if (asyncTransfers) {
    asyncImpl = await ctx.task(asyncTransferTask, {
      projectName, transferAnalysis, pinnedMemory, outputDir
    });
    artifacts.push(...asyncImpl.artifacts);
  }

  // Phase 4: Compute-Transfer Overlap
  const overlapOptimization = await ctx.task(computeTransferOverlapTask, {
    projectName, asyncImpl, transferAnalysis, outputDir
  });
  artifacts.push(...overlapOptimization.artifacts);

  // Phase 5: Unified Memory Evaluation
  let unifiedMemoryEval = null;
  if (useUnifiedMemory) {
    unifiedMemoryEval = await ctx.task(unifiedMemoryTask, {
      projectName, transferAnalysis, outputDir
    });
    artifacts.push(...unifiedMemoryEval.artifacts);
  }

  // Phase 6: Transfer Benchmarking
  const benchmarking = await ctx.task(transferBenchmarkingTask, {
    projectName, transferAnalysis, pinnedMemory, asyncImpl, overlapOptimization, outputDir
  });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Transfer optimization complete for ${projectName}. Throughput improvement: ${benchmarking.improvement}%. Review?`,
    title: 'Transfer Optimization Complete',
    context: { runId: ctx.runId, benchmarking }
  });

  return {
    success: benchmarking.improvement >= 20,
    projectName,
    optimizations: [
      ...(pinnedMemory?.optimizations || []),
      ...(asyncImpl?.optimizations || []),
      ...overlapOptimization.optimizations
    ],
    transferEfficiency: {
      before: benchmarking.baselineThroughput,
      after: benchmarking.optimizedThroughput,
      improvement: benchmarking.improvement
    },
    overlapAnalysis: {
      overlapRatio: overlapOptimization.overlapRatio,
      hiddenLatency: overlapOptimization.hiddenLatency
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/gpu-cpu-data-transfer-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const transferAnalysisTask = defineTask('transfer-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transfer Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'unified-memory'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze data transfer patterns',
      context: args,
      instructions: [
        '1. Profile existing transfers',
        '2. Measure transfer sizes',
        '3. Identify transfer frequency',
        '4. Analyze transfer direction patterns',
        '5. Identify PCIe bottlenecks',
        '6. Measure current throughput',
        '7. Identify redundant transfers',
        '8. Profile transfer latency',
        '9. Analyze data dependencies',
        '10. Document transfer baseline'
      ],
      outputFormat: 'JSON with transfer analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['transferProfile', 'bottlenecks', 'artifacts'],
      properties: {
        transferProfile: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'object' } },
        currentThroughput: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'transfer', 'analysis']
}));

export const pinnedMemoryTask = defineTask('pinned-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pinned Memory - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement pinned memory',
      context: args,
      instructions: [
        '1. Identify pinned memory candidates',
        '2. Allocate page-locked memory',
        '3. Handle allocation failures',
        '4. Balance pinned vs pageable',
        '5. Implement memory pools',
        '6. Use portable pinned memory',
        '7. Use write-combined memory where appropriate',
        '8. Handle cleanup properly',
        '9. Profile pinned memory impact',
        '10. Document pinned memory usage'
      ],
      outputFormat: 'JSON with pinned memory implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'pinnedAllocations', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        pinnedAllocations: { type: 'array', items: { type: 'object' } },
        throughputGain: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'transfer', 'pinned-memory']
}));

export const asyncTransferTask = defineTask('async-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Async Transfers - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement asynchronous transfers',
      context: args,
      instructions: [
        '1. Create CUDA streams for transfers',
        '2. Use cudaMemcpyAsync',
        '3. Implement double buffering',
        '4. Create transfer pipelines',
        '5. Handle stream synchronization',
        '6. Use events for dependencies',
        '7. Implement circular buffers',
        '8. Profile async efficiency',
        '9. Handle error in async ops',
        '10. Document async patterns'
      ],
      outputFormat: 'JSON with async transfer implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'streamUsage', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        streamUsage: { type: 'object' },
        bufferingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'transfer', 'async']
}));

export const computeTransferOverlapTask = defineTask('compute-transfer-overlap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compute-Transfer Overlap - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement compute-transfer overlap',
      context: args,
      instructions: [
        '1. Design overlap strategy',
        '2. Partition work for overlap',
        '3. Use multiple streams',
        '4. Pipeline transfers and compute',
        '5. Minimize synchronization',
        '6. Handle data dependencies',
        '7. Profile overlap efficiency',
        '8. Visualize stream timelines',
        '9. Optimize chunk sizes',
        '10. Document overlap pattern'
      ],
      outputFormat: 'JSON with overlap implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'overlapRatio', 'hiddenLatency', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        overlapRatio: { type: 'number' },
        hiddenLatency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'transfer', 'overlap']
}));

export const unifiedMemoryTask = defineTask('unified-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Unified Memory - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'unified-memory'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Evaluate unified memory',
      context: args,
      instructions: [
        '1. Identify unified memory candidates',
        '2. Implement cudaMallocManaged',
        '3. Use memory hints/prefetch',
        '4. Profile page fault patterns',
        '5. Compare vs explicit transfers',
        '6. Handle memory oversubscription',
        '7. Optimize access patterns',
        '8. Use memory advise hints',
        '9. Profile CPU-GPU access',
        '10. Document unified memory usage'
      ],
      outputFormat: 'JSON with unified memory evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['suitable', 'implementation', 'artifacts'],
      properties: {
        suitable: { type: 'boolean' },
        implementation: { type: 'object' },
        performanceComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'transfer', 'unified-memory']
}));

export const transferBenchmarkingTask = defineTask('transfer-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transfer Benchmarking - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'unified-memory'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Benchmark transfer optimizations',
      context: args,
      instructions: [
        '1. Benchmark baseline transfers',
        '2. Benchmark optimized transfers',
        '3. Measure throughput improvement',
        '4. Measure latency reduction',
        '5. Profile PCIe utilization',
        '6. Compare with theoretical max',
        '7. Test various data sizes',
        '8. Create comparison charts',
        '9. Document benchmark methodology',
        '10. Summarize results'
      ],
      outputFormat: 'JSON with benchmarking results'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineThroughput', 'optimizedThroughput', 'improvement', 'artifacts'],
      properties: {
        baselineThroughput: { type: 'number' },
        optimizedThroughput: { type: 'number' },
        improvement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'transfer', 'benchmarking']
}));

/**
 * @process specializations/gpu-programming/cuda-stream-concurrency
 * @description CUDA Stream and Concurrency Management - Process for implementing concurrent kernel execution
 * and overlapping operations using CUDA streams and events.
 * @inputs { projectName: string, concurrencyPatterns: array, streamCount?: number, useGraphs?: boolean, outputDir?: string }
 * @outputs { success: boolean, streamArchitecture: object, concurrencyMetrics: object, overlapAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/cuda-stream-concurrency', {
 *   projectName: 'data_pipeline',
 *   concurrencyPatterns: ['kernel-overlap', 'transfer-compute'],
 *   streamCount: 4,
 *   useGraphs: true
 * });
 *
 * @references
 * - CUDA Streams: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - CUDA Graphs: https://developer.nvidia.com/blog/cuda-graphs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    concurrencyPatterns,
    streamCount = 4,
    useGraphs = false,
    outputDir = 'stream-concurrency-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CUDA Stream Concurrency: ${projectName}`);
  ctx.log('info', `Patterns: ${concurrencyPatterns.join(', ')}, Streams: ${streamCount}`);

  // Phase 1: Execution Graph Design
  const executionGraph = await ctx.task(executionGraphDesignTask, {
    projectName, concurrencyPatterns, streamCount, outputDir
  });
  artifacts.push(...executionGraph.artifacts);

  // Phase 2: Stream Architecture
  const streamArchitecture = await ctx.task(streamArchitectureTask, {
    projectName, streamCount, executionGraph, outputDir
  });
  artifacts.push(...streamArchitecture.artifacts);

  // Phase 3: Event Synchronization
  const eventSynchronization = await ctx.task(eventSynchronizationTask, {
    projectName, streamArchitecture, executionGraph, outputDir
  });
  artifacts.push(...eventSynchronization.artifacts);

  // Phase 4: Kernel Overlapping
  const kernelOverlap = await ctx.task(kernelOverlappingTask, {
    projectName, streamArchitecture, executionGraph, outputDir
  });
  artifacts.push(...kernelOverlap.artifacts);

  // Phase 5: CUDA Graphs (if enabled)
  let cudaGraphs = null;
  if (useGraphs) {
    cudaGraphs = await ctx.task(cudaGraphsTask, {
      projectName, executionGraph, streamArchitecture, outputDir
    });
    artifacts.push(...cudaGraphs.artifacts);
  }

  // Phase 6: Concurrency Profiling
  const concurrencyProfiling = await ctx.task(concurrencyProfilingTask, {
    projectName, streamArchitecture, kernelOverlap, cudaGraphs, outputDir
  });
  artifacts.push(...concurrencyProfiling.artifacts);

  await ctx.breakpoint({
    question: `Stream concurrency implementation complete for ${projectName}. GPU utilization: ${concurrencyProfiling.gpuUtilization}%. Review?`,
    title: 'Stream Concurrency Complete',
    context: { runId: ctx.runId, concurrencyProfiling }
  });

  return {
    success: concurrencyProfiling.gpuUtilization >= 70,
    projectName,
    streamArchitecture: {
      streamCount,
      streamPurposes: streamArchitecture.streamPurposes,
      eventDependencies: eventSynchronization.dependencies
    },
    concurrencyMetrics: {
      gpuUtilization: concurrencyProfiling.gpuUtilization,
      concurrentKernels: concurrencyProfiling.concurrentKernels,
      overlapRatio: kernelOverlap.overlapRatio
    },
    overlapAnalysis: {
      computeComputeOverlap: kernelOverlap.computeComputeOverlap,
      computeTransferOverlap: kernelOverlap.computeTransferOverlap
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/cuda-stream-concurrency',
      timestamp: startTime,
      outputDir
    }
  };
}

export const executionGraphDesignTask = defineTask('execution-graph-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execution Graph - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design execution dependency graph',
      context: args,
      instructions: [
        '1. Identify all GPU operations',
        '2. Map operation dependencies',
        '3. Identify independent operations',
        '4. Find concurrency opportunities',
        '5. Create dependency DAG',
        '6. Identify critical path',
        '7. Plan operation scheduling',
        '8. Minimize synchronization',
        '9. Document execution graph',
        '10. Visualize dependencies'
      ],
      outputFormat: 'JSON with execution graph design'
    },
    outputSchema: {
      type: 'object',
      required: ['operationGraph', 'criticalPath', 'artifacts'],
      properties: {
        operationGraph: { type: 'object' },
        criticalPath: { type: 'array', items: { type: 'string' } },
        independentOps: { type: 'array', items: { type: 'array' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'streams', 'graph']
}));

export const streamArchitectureTask = defineTask('stream-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stream Architecture - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design stream architecture',
      context: args,
      instructions: [
        '1. Determine number of streams',
        '2. Assign operations to streams',
        '3. Create stream pool',
        '4. Set stream priorities',
        '5. Design stream lifecycle',
        '6. Handle stream cleanup',
        '7. Implement stream callbacks',
        '8. Balance stream workloads',
        '9. Document stream purposes',
        '10. Create stream manager'
      ],
      outputFormat: 'JSON with stream architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['streamPurposes', 'streamAssignments', 'artifacts'],
      properties: {
        streamPurposes: { type: 'array', items: { type: 'object' } },
        streamAssignments: { type: 'object' },
        streamPriorities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'streams', 'architecture']
}));

export const eventSynchronizationTask = defineTask('event-synchronization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Synchronization - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement event-based synchronization',
      context: args,
      instructions: [
        '1. Identify sync points',
        '2. Create event objects',
        '3. Record events in streams',
        '4. Implement stream wait',
        '5. Handle cross-stream deps',
        '6. Use cudaStreamWaitEvent',
        '7. Query event status',
        '8. Minimize event overhead',
        '9. Profile event latency',
        '10. Document sync patterns'
      ],
      outputFormat: 'JSON with event synchronization'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'eventCode', 'artifacts'],
      properties: {
        dependencies: { type: 'array', items: { type: 'object' } },
        eventCode: { type: 'string' },
        syncOverhead: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'streams', 'events']
}));

export const kernelOverlappingTask = defineTask('kernel-overlapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kernel Overlapping - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement kernel overlapping',
      context: args,
      instructions: [
        '1. Launch kernels concurrently',
        '2. Verify hardware support',
        '3. Size kernels for overlap',
        '4. Overlap compute kernels',
        '5. Overlap with transfers',
        '6. Profile actual overlap',
        '7. Handle resource contention',
        '8. Optimize kernel sizes',
        '9. Measure overlap ratio',
        '10. Document overlap patterns'
      ],
      outputFormat: 'JSON with kernel overlapping'
    },
    outputSchema: {
      type: 'object',
      required: ['overlapRatio', 'computeComputeOverlap', 'computeTransferOverlap', 'artifacts'],
      properties: {
        overlapRatio: { type: 'number' },
        computeComputeOverlap: { type: 'number' },
        computeTransferOverlap: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'streams', 'overlap']
}));

export const cudaGraphsTask = defineTask('cuda-graphs', (args, taskCtx) => ({
  kind: 'agent',
  title: `CUDA Graphs - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement CUDA Graphs',
      context: args,
      instructions: [
        '1. Capture execution graph',
        '2. Use stream capture API',
        '3. Instantiate graph executable',
        '4. Launch graph repeatedly',
        '5. Update graph parameters',
        '6. Handle graph modifications',
        '7. Profile graph overhead',
        '8. Compare to streams',
        '9. Handle graph errors',
        '10. Document graph usage'
      ],
      outputFormat: 'JSON with CUDA Graphs implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['graphCode', 'launchOverhead', 'artifacts'],
      properties: {
        graphCode: { type: 'string' },
        launchOverhead: { type: 'number' },
        speedupVsStreams: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'streams', 'graphs']
}));

export const concurrencyProfilingTask = defineTask('concurrency-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Concurrency Profiling - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Profile concurrency efficiency',
      context: args,
      instructions: [
        '1. Profile with Nsight Systems',
        '2. Measure GPU utilization',
        '3. Count concurrent kernels',
        '4. Visualize stream timeline',
        '5. Identify idle periods',
        '6. Profile sync overhead',
        '7. Measure effective overlap',
        '8. Compare to sequential',
        '9. Create timeline analysis',
        '10. Document findings'
      ],
      outputFormat: 'JSON with concurrency profiling'
    },
    outputSchema: {
      type: 'object',
      required: ['gpuUtilization', 'concurrentKernels', 'artifacts'],
      properties: {
        gpuUtilization: { type: 'number' },
        concurrentKernels: { type: 'number' },
        idleTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'streams', 'profiling']
}));

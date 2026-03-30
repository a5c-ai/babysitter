/**
 * @process specializations/gpu-programming/dynamic-parallelism-implementation
 * @description Dynamic Parallelism Implementation - Process for utilizing CUDA dynamic parallelism to launch
 * kernels from device code, enabling recursive and adaptive algorithms.
 * @inputs { projectName: string, algorithmType: string, maxNestingDepth?: number, recursivePattern?: string, outputDir?: string }
 * @outputs { success: boolean, dynamicKernels: array, nestingAnalysis: object, performanceComparison: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/dynamic-parallelism-implementation', {
 *   projectName: 'adaptive_mesh_refinement',
 *   algorithmType: 'recursive',
 *   maxNestingDepth: 4,
 *   recursivePattern: 'quadtree'
 * });
 *
 * @references
 * - Dynamic Parallelism: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - Nested Parallelism: https://developer.nvidia.com/blog/introduction-cuda-dynamic-parallelism/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    algorithmType,
    maxNestingDepth = 3,
    recursivePattern = 'divide-and-conquer',
    outputDir = 'dynamic-parallelism-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Dynamic Parallelism Implementation: ${projectName}`);
  ctx.log('info', `Algorithm: ${algorithmType}, Max depth: ${maxNestingDepth}, Pattern: ${recursivePattern}`);

  // Phase 1: Use Case Analysis
  const useCaseAnalysis = await ctx.task(dynamicParallelismUseCaseTask, {
    projectName, algorithmType, recursivePattern, outputDir
  });
  artifacts.push(...useCaseAnalysis.artifacts);

  // Phase 2: Kernel Hierarchy Design
  const kernelHierarchy = await ctx.task(kernelHierarchyDesignTask, {
    projectName, useCaseAnalysis, maxNestingDepth, outputDir
  });
  artifacts.push(...kernelHierarchy.artifacts);

  // Phase 3: Device-Side Memory Management
  const deviceMemory = await ctx.task(deviceMemoryManagementTask, {
    projectName, kernelHierarchy, maxNestingDepth, outputDir
  });
  artifacts.push(...deviceMemory.artifacts);

  // Phase 4: Synchronization Design
  const syncDesign = await ctx.task(dynamicSyncDesignTask, {
    projectName, kernelHierarchy, outputDir
  });
  artifacts.push(...syncDesign.artifacts);

  // Phase 5: Implementation
  const implementation = await ctx.task(dynamicParallelismImplementationTask, {
    projectName, kernelHierarchy, deviceMemory, syncDesign, outputDir
  });
  artifacts.push(...implementation.artifacts);

  // Phase 6: Performance Analysis
  const performanceAnalysis = await ctx.task(dynamicParallelismPerformanceTask, {
    projectName, implementation, maxNestingDepth, outputDir
  });
  artifacts.push(...performanceAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Dynamic parallelism implementation complete for ${projectName}. Speedup vs host-launch: ${performanceAnalysis.speedupVsHost}x. Review?`,
    title: 'Dynamic Parallelism Complete',
    context: { runId: ctx.runId, performanceAnalysis }
  });

  return {
    success: performanceAnalysis.speedupVsHost >= 1.0,
    projectName,
    dynamicKernels: implementation.kernels,
    nestingAnalysis: {
      maxDepth: maxNestingDepth,
      actualDepth: implementation.actualDepth,
      launchOverhead: performanceAnalysis.launchOverhead
    },
    performanceComparison: {
      speedupVsHost: performanceAnalysis.speedupVsHost,
      memoryOverhead: performanceAnalysis.memoryOverhead,
      recommendation: performanceAnalysis.recommendation
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/dynamic-parallelism-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

export const dynamicParallelismUseCaseTask = defineTask('dynamic-parallelism-use-case', (args, taskCtx) => ({
  kind: 'agent',
  title: `Use Case Analysis - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'dynamic-parallelism'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Analyze dynamic parallelism use case',
      context: args,
      instructions: [
        '1. Identify algorithm characteristics',
        '2. Assess recursive patterns',
        '3. Evaluate adaptive work needs',
        '4. Compare to flat parallelism',
        '5. Identify nesting requirements',
        '6. Assess memory requirements',
        '7. Evaluate launch overhead',
        '8. Document use case suitability',
        '9. Identify alternatives',
        '10. Recommend approach'
      ],
      outputFormat: 'JSON with use case analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['suitable', 'characteristics', 'artifacts'],
      properties: {
        suitable: { type: 'boolean' },
        characteristics: { type: 'array', items: { type: 'string' } },
        alternatives: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'dynamic-parallelism', 'analysis']
}));

export const kernelHierarchyDesignTask = defineTask('kernel-hierarchy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kernel Hierarchy - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'dynamic-parallelism'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design kernel hierarchy',
      context: args,
      instructions: [
        '1. Define parent kernel',
        '2. Define child kernels',
        '3. Design launch parameters',
        '4. Plan work decomposition',
        '5. Design termination condition',
        '6. Plan data passing',
        '7. Handle recursion depth',
        '8. Design grid/block sizing',
        '9. Document hierarchy',
        '10. Create call graph'
      ],
      outputFormat: 'JSON with kernel hierarchy'
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'parentKernel', 'artifacts'],
      properties: {
        hierarchy: { type: 'object' },
        parentKernel: { type: 'object' },
        childKernels: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'dynamic-parallelism', 'hierarchy']
}));

export const deviceMemoryManagementTask = defineTask('device-memory-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Device Memory - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'dynamic-parallelism'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement device-side memory management',
      context: args,
      instructions: [
        '1. Use cudaMalloc from device',
        '2. Manage device heap',
        '3. Set cudaLimitDevRuntimeSyncDepth',
        '4. Set cudaLimitDevRuntimePendingLaunchCount',
        '5. Handle allocation failures',
        '6. Implement cleanup',
        '7. Track memory usage',
        '8. Avoid leaks',
        '9. Test memory management',
        '10. Document memory strategy'
      ],
      outputFormat: 'JSON with device memory management'
    },
    outputSchema: {
      type: 'object',
      required: ['memoryStrategy', 'limits', 'artifacts'],
      properties: {
        memoryStrategy: { type: 'object' },
        limits: { type: 'object' },
        heapConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'dynamic-parallelism', 'memory']
}));

export const dynamicSyncDesignTask = defineTask('dynamic-sync-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synchronization Design - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'dynamic-parallelism'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design synchronization for dynamic parallelism',
      context: args,
      instructions: [
        '1. Use cudaDeviceSynchronize',
        '2. Handle parent-child sync',
        '3. Design stream usage',
        '4. Handle implicit sync',
        '5. Avoid unnecessary sync',
        '6. Handle sync depth limits',
        '7. Profile sync overhead',
        '8. Implement async patterns',
        '9. Test synchronization',
        '10. Document sync strategy'
      ],
      outputFormat: 'JSON with synchronization design'
    },
    outputSchema: {
      type: 'object',
      required: ['syncStrategy', 'syncPoints', 'artifacts'],
      properties: {
        syncStrategy: { type: 'string' },
        syncPoints: { type: 'array', items: { type: 'object' } },
        streamUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'dynamic-parallelism', 'sync']
}));

export const dynamicParallelismImplementationTask = defineTask('dynamic-parallelism-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'dynamic-parallelism'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement dynamic parallelism',
      context: args,
      instructions: [
        '1. Implement parent kernel',
        '2. Implement child launch',
        '3. Add -rdc=true compilation',
        '4. Link with cudadevrt',
        '5. Implement data passing',
        '6. Add error handling',
        '7. Implement termination',
        '8. Test correctness',
        '9. Profile launches',
        '10. Document implementation'
      ],
      outputFormat: 'JSON with implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['kernels', 'actualDepth', 'artifacts'],
      properties: {
        kernels: { type: 'array', items: { type: 'object' } },
        actualDepth: { type: 'number' },
        compilationFlags: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'dynamic-parallelism', 'implementation']
}));

export const dynamicParallelismPerformanceTask = defineTask('dynamic-parallelism-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze dynamic parallelism performance',
      context: args,
      instructions: [
        '1. Benchmark dynamic approach',
        '2. Compare to host-launched',
        '3. Measure launch overhead',
        '4. Profile memory overhead',
        '5. Test various depths',
        '6. Analyze scalability',
        '7. Profile occupancy',
        '8. Create comparison report',
        '9. Identify when beneficial',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['speedupVsHost', 'launchOverhead', 'memoryOverhead', 'recommendation', 'artifacts'],
      properties: {
        speedupVsHost: { type: 'number' },
        launchOverhead: { type: 'number' },
        memoryOverhead: { type: 'number' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'dynamic-parallelism', 'performance']
}));

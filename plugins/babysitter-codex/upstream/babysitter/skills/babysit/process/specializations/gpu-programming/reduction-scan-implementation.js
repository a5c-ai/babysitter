/**
 * @process specializations/gpu-programming/reduction-scan-implementation
 * @description Reduction and Scan Algorithm Implementation - Workflow for implementing efficient parallel
 * reduction and prefix sum (scan) algorithms, foundational patterns for many GPU applications.
 * @inputs { projectName: string, operation: string, dataType?: string, algorithm?: string, outputDir?: string }
 * @outputs { success: boolean, kernelImplementations: array, performanceBenchmarks: object, algorithmVariants: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/reduction-scan-implementation', {
 *   projectName: 'statistics_library',
 *   operation: 'sum',
 *   dataType: 'float',
 *   algorithm: 'work-efficient'
 * });
 *
 * @references
 * - GPU Gems 3 - Parallel Prefix Sum: https://developer.nvidia.com/gpugems/gpugems3/part-vi-gpu-computing
 * - Optimizing Parallel Reduction in CUDA: https://developer.download.nvidia.com/assets/cuda/files/reduction.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    operation,
    dataType = 'float',
    algorithm = 'work-efficient',
    outputDir = 'reduction-scan-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Reduction/Scan Implementation: ${projectName}`);
  ctx.log('info', `Operation: ${operation}, Data type: ${dataType}, Algorithm: ${algorithm}`);

  // Phase 1: Algorithm Design
  const algorithmDesign = await ctx.task(reductionAlgorithmDesignTask, {
    projectName, operation, dataType, algorithm, outputDir
  });
  artifacts.push(...algorithmDesign.artifacts);

  // Phase 2: Basic Reduction
  const basicReduction = await ctx.task(basicReductionTask, {
    projectName, operation, dataType, algorithmDesign, outputDir
  });
  artifacts.push(...basicReduction.artifacts);

  // Phase 3: Warp-Level Reduction
  const warpReduction = await ctx.task(warpLevelReductionTask, {
    projectName, operation, dataType, outputDir
  });
  artifacts.push(...warpReduction.artifacts);

  // Phase 4: Scan Implementation
  const scanImpl = await ctx.task(scanImplementationTask, {
    projectName, operation, dataType, algorithm, outputDir
  });
  artifacts.push(...scanImpl.artifacts);

  // Phase 5: Large Array Handling
  const largeArrayHandling = await ctx.task(largeArrayHandlingTask, {
    projectName, basicReduction, scanImpl, outputDir
  });
  artifacts.push(...largeArrayHandling.artifacts);

  // Phase 6: Performance Benchmarking
  const benchmarking = await ctx.task(reductionBenchmarkingTask, {
    projectName, basicReduction, warpReduction, scanImpl, largeArrayHandling, outputDir
  });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Reduction/Scan implementation complete for ${projectName}. Bandwidth efficiency: ${benchmarking.bandwidthEfficiency}%. Review?`,
    title: 'Reduction/Scan Complete',
    context: { runId: ctx.runId, benchmarking }
  });

  return {
    success: benchmarking.bandwidthEfficiency >= 70,
    projectName,
    kernelImplementations: [
      basicReduction.kernelPath,
      warpReduction.kernelPath,
      scanImpl.inclusiveScanPath,
      scanImpl.exclusiveScanPath
    ],
    performanceBenchmarks: {
      reductionBandwidth: benchmarking.reductionBandwidth,
      scanBandwidth: benchmarking.scanBandwidth,
      bandwidthEfficiency: benchmarking.bandwidthEfficiency
    },
    algorithmVariants: algorithmDesign.variants,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/reduction-scan-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

export const reductionAlgorithmDesignTask = defineTask('reduction-algorithm-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Algorithm Design - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'Parallel Algorithm Designer',
      task: 'Design reduction/scan algorithms',
      context: args,
      instructions: [
        '1. Define reduction operation',
        '2. Design tree-based reduction',
        '3. Design sequential addressing',
        '4. Plan warp-level primitives',
        '5. Design work-efficient scan',
        '6. Handle bank conflicts',
        '7. Plan multi-pass approach',
        '8. Document algorithm variants',
        '9. Analyze work complexity',
        '10. Choose optimal approach'
      ],
      outputFormat: 'JSON with algorithm design'
    },
    outputSchema: {
      type: 'object',
      required: ['variants', 'selectedAlgorithm', 'artifacts'],
      properties: {
        variants: { type: 'array', items: { type: 'object' } },
        selectedAlgorithm: { type: 'string' },
        complexity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'reduction', 'design']
}));

export const basicReductionTask = defineTask('basic-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Basic Reduction - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement basic parallel reduction',
      context: args,
      instructions: [
        '1. Implement tree-based reduction',
        '2. Use shared memory',
        '3. Avoid divergent branches',
        '4. Use sequential addressing',
        '5. Handle odd-sized arrays',
        '6. First load global then reduce',
        '7. Unroll last warp',
        '8. Implement partial reductions',
        '9. Test correctness',
        '10. Document implementation'
      ],
      outputFormat: 'JSON with basic reduction'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelPath', 'performance', 'artifacts'],
      properties: {
        kernelPath: { type: 'string' },
        performance: { type: 'object' },
        correctness: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'reduction', 'basic']
}));

export const warpLevelReductionTask = defineTask('warp-level-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Warp-Level Reduction - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement warp-level reduction',
      context: args,
      instructions: [
        '1. Use __shfl_down_sync',
        '2. Implement warp reduce',
        '3. Avoid shared memory',
        '4. Handle warp size',
        '5. Implement for all ops',
        '6. Test on various sizes',
        '7. Profile vs shared mem',
        '8. Handle non-full warps',
        '9. Document usage',
        '10. Create templates'
      ],
      outputFormat: 'JSON with warp-level reduction'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelPath', 'performance', 'artifacts'],
      properties: {
        kernelPath: { type: 'string' },
        performance: { type: 'object' },
        speedupVsShared: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'reduction', 'warp']
}));

export const scanImplementationTask = defineTask('scan-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan Implementation - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement parallel scan (prefix sum)',
      context: args,
      instructions: [
        '1. Implement Blelloch scan',
        '2. Up-sweep phase',
        '3. Down-sweep phase',
        '4. Handle bank conflicts',
        '5. Implement inclusive scan',
        '6. Implement exclusive scan',
        '7. Handle arbitrary sizes',
        '8. Test correctness',
        '9. Profile performance',
        '10. Document algorithms'
      ],
      outputFormat: 'JSON with scan implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['inclusiveScanPath', 'exclusiveScanPath', 'artifacts'],
      properties: {
        inclusiveScanPath: { type: 'string' },
        exclusiveScanPath: { type: 'string' },
        performance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'reduction', 'scan']
}));

export const largeArrayHandlingTask = defineTask('large-array-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Large Array Handling - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Handle large array reduction/scan',
      context: args,
      instructions: [
        '1. Design multi-pass approach',
        '2. Implement block-level results',
        '3. Reduce block results',
        '4. Handle scan propagation',
        '5. Implement decoupled lookback',
        '6. Handle memory limits',
        '7. Test billion elements',
        '8. Profile large arrays',
        '9. Compare approaches',
        '10. Document strategy'
      ],
      outputFormat: 'JSON with large array handling'
    },
    outputSchema: {
      type: 'object',
      required: ['multiPassCode', 'maxArraySize', 'artifacts'],
      properties: {
        multiPassCode: { type: 'string' },
        maxArraySize: { type: 'number' },
        memoryUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'reduction', 'large-arrays']
}));

export const reductionBenchmarkingTask = defineTask('reduction-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmarking - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Benchmark reduction/scan performance',
      context: args,
      instructions: [
        '1. Benchmark all variants',
        '2. Measure bandwidth',
        '3. Calculate efficiency',
        '4. Compare to CUB/Thrust',
        '5. Test various sizes',
        '6. Profile memory access',
        '7. Create comparison charts',
        '8. Identify best variants',
        '9. Document performance',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with benchmarking results'
    },
    outputSchema: {
      type: 'object',
      required: ['reductionBandwidth', 'scanBandwidth', 'bandwidthEfficiency', 'artifacts'],
      properties: {
        reductionBandwidth: { type: 'number' },
        scanBandwidth: { type: 'number' },
        bandwidthEfficiency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'reduction', 'benchmarking']
}));

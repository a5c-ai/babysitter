/**
 * @process specializations/gpu-programming/occupancy-optimization
 * @description Occupancy Optimization - Process for optimizing SM occupancy by balancing resource usage
 * (registers, shared memory, thread block size) to maximize parallelism.
 * @inputs { projectName: string, targetKernels: array, targetOccupancy?: number, targetArch?: string, outputDir?: string }
 * @outputs { success: boolean, optimizedConfigs: array, occupancyReport: object, resourceAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/occupancy-optimization', {
 *   projectName: 'convolution_kernels',
 *   targetKernels: ['conv2d_forward', 'conv2d_backward'],
 *   targetOccupancy: 75,
 *   targetArch: 'sm_86'
 * });
 *
 * @references
 * - CUDA Occupancy Calculator: https://docs.nvidia.com/cuda/cuda-occupancy-calculator/
 * - Occupancy Best Practices: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetKernels,
    targetOccupancy = 75,
    targetArch = 'sm_80',
    outputDir = 'occupancy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Occupancy Optimization: ${projectName}`);
  ctx.log('info', `Target occupancy: ${targetOccupancy}%, Architecture: ${targetArch}`);

  // Phase 1: Current Occupancy Analysis
  const currentAnalysis = await ctx.task(occupancyAnalysisBaselineTask, {
    projectName, targetKernels, targetArch, outputDir
  });
  artifacts.push(...currentAnalysis.artifacts);

  // Phase 2: Register Usage Optimization
  const registerOptimization = await ctx.task(registerOptimizationTask, {
    projectName, targetKernels, currentAnalysis, targetOccupancy, outputDir
  });
  artifacts.push(...registerOptimization.artifacts);

  // Phase 3: Shared Memory Tuning
  const sharedMemTuning = await ctx.task(sharedMemoryTuningTask, {
    projectName, targetKernels, currentAnalysis, targetOccupancy, outputDir
  });
  artifacts.push(...sharedMemTuning.artifacts);

  // Phase 4: Block Size Optimization
  const blockSizeOptimization = await ctx.task(blockSizeOptimizationTask, {
    projectName, targetKernels, currentAnalysis, registerOptimization, sharedMemTuning, outputDir
  });
  artifacts.push(...blockSizeOptimization.artifacts);

  // Phase 5: Launch Bounds Configuration
  const launchBounds = await ctx.task(launchBoundsConfigTask, {
    projectName, targetKernels, blockSizeOptimization, outputDir
  });
  artifacts.push(...launchBounds.artifacts);

  // Phase 6: Final Occupancy Measurement
  const finalMeasurement = await ctx.task(finalOccupancyMeasurementTask, {
    projectName, targetKernels, targetOccupancy, blockSizeOptimization, outputDir
  });
  artifacts.push(...finalMeasurement.artifacts);

  await ctx.breakpoint({
    question: `Occupancy optimization complete for ${projectName}. Achieved: ${finalMeasurement.achievedOccupancy}% (target: ${targetOccupancy}%). Review?`,
    title: 'Occupancy Optimization Complete',
    context: { runId: ctx.runId, finalMeasurement }
  });

  return {
    success: finalMeasurement.achievedOccupancy >= targetOccupancy,
    projectName,
    optimizedConfigs: finalMeasurement.optimizedConfigs,
    occupancyReport: {
      before: currentAnalysis.occupancy,
      after: finalMeasurement.achievedOccupancy,
      improvement: finalMeasurement.achievedOccupancy - currentAnalysis.occupancy
    },
    resourceAnalysis: {
      registers: registerOptimization.analysis,
      sharedMemory: sharedMemTuning.analysis,
      blockSize: blockSizeOptimization.analysis
    },
    launchBounds: launchBounds.configurations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/occupancy-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const occupancyAnalysisBaselineTask = defineTask('occupancy-analysis-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Occupancy Baseline - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze current occupancy',
      context: args,
      instructions: [
        '1. Profile current occupancy per kernel',
        '2. Query GPU architecture limits',
        '3. Measure register usage per thread',
        '4. Measure shared memory per block',
        '5. Record current block sizes',
        '6. Calculate theoretical max occupancy',
        '7. Identify limiting factors',
        '8. Compare achieved vs theoretical',
        '9. Document baseline metrics',
        '10. Create occupancy report'
      ],
      outputFormat: 'JSON with occupancy baseline analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['occupancy', 'limitingFactors', 'artifacts'],
      properties: {
        occupancy: { type: 'number' },
        limitingFactors: { type: 'array', items: { type: 'string' } },
        resourceUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'occupancy', 'baseline']
}));

export const registerOptimizationTask = defineTask('register-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Register Optimization - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize register usage',
      context: args,
      instructions: [
        '1. Analyze register pressure',
        '2. Use __launch_bounds__ to limit registers',
        '3. Refactor for register efficiency',
        '4. Use shared memory for register spilling',
        '5. Reduce live variables',
        '6. Test register limits vs performance',
        '7. Profile spill to local memory',
        '8. Balance registers vs occupancy',
        '9. Document register strategy',
        '10. Validate optimizations'
      ],
      outputFormat: 'JSON with register optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'optimizations', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        optimizations: { type: 'array', items: { type: 'object' } },
        registersPerThread: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'occupancy', 'registers']
}));

export const sharedMemoryTuningTask = defineTask('shared-memory-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shared Memory Tuning - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Tune shared memory for occupancy',
      context: args,
      instructions: [
        '1. Analyze shared memory usage',
        '2. Calculate occupancy impact',
        '3. Reduce shared memory if needed',
        '4. Use dynamic shared memory',
        '5. Configure L1/shared split',
        '6. Test different allocations',
        '7. Balance shared mem vs occupancy',
        '8. Profile different configurations',
        '9. Document tuning decisions',
        '10. Validate improvements'
      ],
      outputFormat: 'JSON with shared memory tuning results'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'optimizations', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        optimizations: { type: 'array', items: { type: 'object' } },
        recommendedAllocation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'occupancy', 'shared-memory']
}));

export const blockSizeOptimizationTask = defineTask('block-size-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Block Size Optimization - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize thread block size',
      context: args,
      instructions: [
        '1. Test multiple block sizes',
        '2. Use occupancy calculator API',
        '3. Find optimal block dimensions',
        '4. Consider warp alignment',
        '5. Account for problem size',
        '6. Profile each configuration',
        '7. Balance occupancy vs performance',
        '8. Consider 1D vs 2D vs 3D blocks',
        '9. Document optimal sizes',
        '10. Create auto-tuning logic'
      ],
      outputFormat: 'JSON with block size optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'optimalSizes', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        optimalSizes: { type: 'array', items: { type: 'object' } },
        performanceData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'occupancy', 'block-size']
}));

export const launchBoundsConfigTask = defineTask('launch-bounds-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Launch Bounds Configuration - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Configure launch bounds',
      context: args,
      instructions: [
        '1. Determine optimal __launch_bounds__',
        '2. Set max threads per block',
        '3. Optionally set min blocks per SM',
        '4. Apply to kernel definitions',
        '5. Test compilation',
        '6. Profile with launch bounds',
        '7. Compare vs without bounds',
        '8. Handle multiple architectures',
        '9. Document launch bounds',
        '10. Create architecture-specific variants'
      ],
      outputFormat: 'JSON with launch bounds configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configurations', 'kernelAnnotations', 'artifacts'],
      properties: {
        configurations: { type: 'array', items: { type: 'object' } },
        kernelAnnotations: { type: 'object' },
        performanceImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'occupancy', 'launch-bounds']
}));

export const finalOccupancyMeasurementTask = defineTask('final-occupancy-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Final Occupancy Measurement - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Measure final occupancy',
      context: args,
      instructions: [
        '1. Profile optimized kernels',
        '2. Measure achieved occupancy',
        '3. Compare to target',
        '4. Verify performance improvement',
        '5. Test across input sizes',
        '6. Create before/after comparison',
        '7. Document final configurations',
        '8. Identify remaining opportunities',
        '9. Create optimization report',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with final occupancy measurements'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedOccupancy', 'optimizedConfigs', 'artifacts'],
      properties: {
        achievedOccupancy: { type: 'number' },
        optimizedConfigs: { type: 'array', items: { type: 'object' } },
        performanceGain: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'occupancy', 'measurement']
}));

/**
 * @process specializations/gpu-programming/stencil-computation-optimization
 * @description Stencil Computation Optimization - Process for optimizing stencil computations (neighbor-based operations)
 * common in image processing, CFD, and scientific simulations.
 * @inputs { projectName: string, stencilType: string, dimensions?: number, haloSize?: number, outputDir?: string }
 * @outputs { success: boolean, optimizedKernels: array, tilingStrategy: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/stencil-computation-optimization', {
 *   projectName: 'fluid_simulation',
 *   stencilType: '3d-7point',
 *   dimensions: 3,
 *   haloSize: 1
 * });
 *
 * @references
 * - Stencil Optimization: https://developer.nvidia.com/blog/finite-difference-methods-cuda-cc-part-1/
 * - Temporal Blocking: https://dl.acm.org/doi/10.1145/1654059.1654099
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    stencilType,
    dimensions = 2,
    haloSize = 1,
    outputDir = 'stencil-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Stencil Computation Optimization: ${projectName}`);
  ctx.log('info', `Stencil: ${stencilType}, Dimensions: ${dimensions}, Halo: ${haloSize}`);

  // Phase 1: Stencil Analysis
  const stencilAnalysis = await ctx.task(stencilAnalysisTask, {
    projectName, stencilType, dimensions, haloSize, outputDir
  });
  artifacts.push(...stencilAnalysis.artifacts);

  // Phase 2: Tiling Strategy
  const tilingStrategy = await ctx.task(stencilTilingTask, {
    projectName, stencilAnalysis, dimensions, haloSize, outputDir
  });
  artifacts.push(...tilingStrategy.artifacts);

  // Phase 3: Shared Memory Implementation
  const sharedMemImpl = await ctx.task(stencilSharedMemoryTask, {
    projectName, tilingStrategy, haloSize, outputDir
  });
  artifacts.push(...sharedMemImpl.artifacts);

  // Phase 4: Boundary Handling
  const boundaryHandling = await ctx.task(boundaryHandlingTask, {
    projectName, stencilType, dimensions, tilingStrategy, outputDir
  });
  artifacts.push(...boundaryHandling.artifacts);

  // Phase 5: Temporal Blocking
  const temporalBlocking = await ctx.task(temporalBlockingTask, {
    projectName, stencilAnalysis, tilingStrategy, outputDir
  });
  artifacts.push(...temporalBlocking.artifacts);

  // Phase 6: Performance Benchmarking
  const benchmarking = await ctx.task(stencilBenchmarkingTask, {
    projectName, sharedMemImpl, temporalBlocking, outputDir
  });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Stencil optimization complete for ${projectName}. Speedup: ${benchmarking.speedup}x. Bandwidth: ${benchmarking.bandwidthEfficiency}%. Review?`,
    title: 'Stencil Optimization Complete',
    context: { runId: ctx.runId, benchmarking }
  });

  return {
    success: benchmarking.speedup >= 2.0,
    projectName,
    optimizedKernels: [
      sharedMemImpl.kernelPath,
      temporalBlocking.kernelPath
    ],
    tilingStrategy: {
      tileSize: tilingStrategy.tileSize,
      haloHandling: tilingStrategy.haloHandling,
      occupancy: tilingStrategy.occupancy
    },
    performanceMetrics: {
      speedup: benchmarking.speedup,
      bandwidthEfficiency: benchmarking.bandwidthEfficiency,
      gflops: benchmarking.gflops
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/stencil-computation-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const stencilAnalysisTask = defineTask('stencil-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stencil Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'parallel-patterns'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Analyze stencil computation',
      context: args,
      instructions: [
        '1. Define stencil pattern',
        '2. Identify neighbor accesses',
        '3. Calculate arithmetic intensity',
        '4. Analyze memory access pattern',
        '5. Identify data reuse',
        '6. Calculate halo requirements',
        '7. Profile naive implementation',
        '8. Identify bandwidth limits',
        '9. Document stencil properties',
        '10. Plan optimization approach'
      ],
      outputFormat: 'JSON with stencil analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stencilPattern', 'arithmeticIntensity', 'artifacts'],
      properties: {
        stencilPattern: { type: 'object' },
        arithmeticIntensity: { type: 'number' },
        dataReuse: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'stencil', 'analysis']
}));

export const stencilTilingTask = defineTask('stencil-tiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tiling Strategy - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'parallel-patterns'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design stencil tiling strategy',
      context: args,
      instructions: [
        '1. Calculate optimal tile size',
        '2. Account for halo regions',
        '3. Balance shared mem vs occupancy',
        '4. Design 2D/3D tiling',
        '5. Handle tile boundaries',
        '6. Plan halo loading',
        '7. Minimize halo overhead',
        '8. Test tile configurations',
        '9. Document tiling strategy',
        '10. Create auto-tuning'
      ],
      outputFormat: 'JSON with tiling strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['tileSize', 'haloHandling', 'occupancy', 'artifacts'],
      properties: {
        tileSize: { type: 'object' },
        haloHandling: { type: 'string' },
        occupancy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'stencil', 'tiling']
}));

export const stencilSharedMemoryTask = defineTask('stencil-shared-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shared Memory Implementation - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'parallel-patterns'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement shared memory stencil',
      context: args,
      instructions: [
        '1. Allocate shared memory tile',
        '2. Load tile with halos',
        '3. Handle cooperative loading',
        '4. Add synchronization',
        '5. Compute from shared mem',
        '6. Handle boundary threads',
        '7. Optimize bank conflicts',
        '8. Test correctness',
        '9. Profile performance',
        '10. Document implementation'
      ],
      outputFormat: 'JSON with shared memory implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelPath', 'sharedMemSize', 'artifacts'],
      properties: {
        kernelPath: { type: 'string' },
        sharedMemSize: { type: 'number' },
        speedup: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'stencil', 'shared-memory']
}));

export const boundaryHandlingTask = defineTask('boundary-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Boundary Handling - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'parallel-patterns'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement boundary conditions',
      context: args,
      instructions: [
        '1. Implement periodic boundaries',
        '2. Implement clamped boundaries',
        '3. Implement reflected boundaries',
        '4. Implement constant boundaries',
        '5. Handle ghost cells',
        '6. Optimize boundary threads',
        '7. Separate boundary kernels',
        '8. Test boundary correctness',
        '9. Profile boundary overhead',
        '10. Document boundary handling'
      ],
      outputFormat: 'JSON with boundary handling'
    },
    outputSchema: {
      type: 'object',
      required: ['boundaryTypes', 'boundaryCode', 'artifacts'],
      properties: {
        boundaryTypes: { type: 'array', items: { type: 'string' } },
        boundaryCode: { type: 'string' },
        overhead: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'stencil', 'boundaries']
}));

export const temporalBlockingTask = defineTask('temporal-blocking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Temporal Blocking - ${args.projectName}`,
  agent: {
    name: 'gpu-memory-expert',
    skills: ['gpu-memory-analysis', 'parallel-patterns'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement temporal blocking',
      context: args,
      instructions: [
        '1. Design time-tiling strategy',
        '2. Calculate expanded halo',
        '3. Implement multi-step kernel',
        '4. Handle temporal dependencies',
        '5. Balance memory vs compute',
        '6. Profile memory savings',
        '7. Test multi-iteration',
        '8. Validate correctness',
        '9. Compare to iterative',
        '10. Document approach'
      ],
      outputFormat: 'JSON with temporal blocking'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelPath', 'timeSteps', 'artifacts'],
      properties: {
        kernelPath: { type: 'string' },
        timeSteps: { type: 'number' },
        memoryReduction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'stencil', 'temporal-blocking']
}));

export const stencilBenchmarkingTask = defineTask('stencil-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmarking - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Benchmark stencil performance',
      context: args,
      instructions: [
        '1. Benchmark naive vs optimized',
        '2. Measure effective bandwidth',
        '3. Calculate GFLOPS',
        '4. Compare to roofline',
        '5. Test various grid sizes',
        '6. Profile memory access',
        '7. Create comparison charts',
        '8. Compare to CPU baseline',
        '9. Document results',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with benchmarking results'
    },
    outputSchema: {
      type: 'object',
      required: ['speedup', 'bandwidthEfficiency', 'gflops', 'artifacts'],
      properties: {
        speedup: { type: 'number' },
        bandwidthEfficiency: { type: 'number' },
        gflops: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'stencil', 'benchmarking']
}));

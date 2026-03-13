/**
 * @process specializations/gpu-programming/tensor-core-programming
 * @description Tensor Core Programming - Workflow for utilizing NVIDIA Tensor Cores for accelerated
 * matrix multiply-accumulate operations in deep learning and HPC applications.
 * @inputs { projectName: string, matrixOperation: string, precision?: string, useWmma?: boolean, outputDir?: string }
 * @outputs { success: boolean, tensorCoreKernels: array, performanceComparison: object, precisionAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/tensor-core-programming', {
 *   projectName: 'transformer_attention',
 *   matrixOperation: 'batched_gemm',
 *   precision: 'fp16',
 *   useWmma: true
 * });
 *
 * @references
 * - WMMA API: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - Tensor Core Programming: https://developer.nvidia.com/blog/programming-tensor-cores-cuda-9/
 * - CUTLASS: https://github.com/NVIDIA/cutlass
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    matrixOperation,
    precision = 'fp16',
    useWmma = true,
    useCutlass = false,
    outputDir = 'tensor-core-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Tensor Core Programming: ${projectName}`);
  ctx.log('info', `Operation: ${matrixOperation}, Precision: ${precision}, WMMA: ${useWmma}`);

  // Phase 1: Workload Suitability Analysis
  const suitabilityAnalysis = await ctx.task(tensorCoreSuitabilityTask, {
    projectName, matrixOperation, precision, outputDir
  });
  artifacts.push(...suitabilityAnalysis.artifacts);

  // Phase 2: WMMA API Implementation
  let wmmaImpl = null;
  if (useWmma) {
    wmmaImpl = await ctx.task(wmmaImplementationTask, {
      projectName, matrixOperation, precision, suitabilityAnalysis, outputDir
    });
    artifacts.push(...wmmaImpl.artifacts);
  }

  // Phase 3: cuBLAS Tensor Core Integration
  const cublasIntegration = await ctx.task(cublasTensorCoreTask, {
    projectName, matrixOperation, precision, outputDir
  });
  artifacts.push(...cublasIntegration.artifacts);

  // Phase 4: Mixed Precision Implementation
  const mixedPrecision = await ctx.task(mixedPrecisionTask, {
    projectName, precision, wmmaImpl, outputDir
  });
  artifacts.push(...mixedPrecision.artifacts);

  // Phase 5: Performance Profiling
  const performanceProfiling = await ctx.task(tensorCoreProfilingTask, {
    projectName, wmmaImpl, cublasIntegration, outputDir
  });
  artifacts.push(...performanceProfiling.artifacts);

  // Phase 6: Precision Analysis
  const precisionAnalysis = await ctx.task(precisionAnalysisTask, {
    projectName, precision, mixedPrecision, outputDir
  });
  artifacts.push(...precisionAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Tensor Core implementation complete for ${projectName}. Speedup vs CUDA cores: ${performanceProfiling.speedup}x. Review?`,
    title: 'Tensor Core Programming Complete',
    context: { runId: ctx.runId, performanceProfiling, precisionAnalysis }
  });

  return {
    success: performanceProfiling.speedup >= 2.0,
    projectName,
    tensorCoreKernels: wmmaImpl ? wmmaImpl.kernels : [],
    performanceComparison: {
      cudaCoreBaseline: performanceProfiling.cudaCorePerf,
      tensorCorePerf: performanceProfiling.tensorCorePerf,
      speedup: performanceProfiling.speedup,
      tensorCoreUtilization: performanceProfiling.tcUtilization
    },
    precisionAnalysis: {
      precision,
      accuracy: precisionAnalysis.accuracy,
      errorBound: precisionAnalysis.errorBound
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/tensor-core-programming',
      timestamp: startTime,
      outputDir
    }
  };
}

export const tensorCoreSuitabilityTask = defineTask('tensor-core-suitability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Suitability Analysis - ${args.projectName}`,
  agent: {
    name: 'tensor-core-specialist',
    skills: ['tensor-core-ops', 'cutlass-library'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Analyze tensor core suitability',
      context: args,
      instructions: [
        '1. Analyze matrix dimensions',
        '2. Check alignment requirements',
        '3. Verify supported precision',
        '4. Assess data type compatibility',
        '5. Check hardware support',
        '6. Analyze operation patterns',
        '7. Identify tensor core candidates',
        '8. Calculate expected speedup',
        '9. Document suitability findings',
        '10. Recommend approach'
      ],
      outputFormat: 'JSON with suitability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['suitable', 'recommendations', 'artifacts'],
      properties: {
        suitable: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        requirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'tensor-core', 'suitability']
}));

export const wmmaImplementationTask = defineTask('wmma-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `WMMA Implementation - ${args.projectName}`,
  agent: {
    name: 'tensor-core-specialist',
    skills: ['tensor-core-ops', 'cutlass-library'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement WMMA API',
      context: args,
      instructions: [
        '1. Include wmma header',
        '2. Define fragment types',
        '3. Load matrix fragments',
        '4. Perform mma operation',
        '5. Store result fragment',
        '6. Handle matrix tiling',
        '7. Implement accumulation',
        '8. Handle alignment padding',
        '9. Optimize memory layout',
        '10. Document WMMA usage'
      ],
      outputFormat: 'JSON with WMMA implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['kernels', 'fragmentTypes', 'artifacts'],
      properties: {
        kernels: { type: 'array', items: { type: 'object' } },
        fragmentTypes: { type: 'array', items: { type: 'string' } },
        tilingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'tensor-core', 'wmma']
}));

export const cublasTensorCoreTask = defineTask('cublas-tensor-core', (args, taskCtx) => ({
  kind: 'agent',
  title: `cuBLAS Integration - ${args.projectName}`,
  agent: {
    name: 'tensor-core-specialist',
    skills: ['tensor-core-ops', 'cutlass-library'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Integrate cuBLAS tensor core mode',
      context: args,
      instructions: [
        '1. Set up cuBLAS handle',
        '2. Configure tensor core math mode',
        '3. Set compute type appropriately',
        '4. Use cublasGemmEx for flexibility',
        '5. Handle data type conversions',
        '6. Configure algorithm selection',
        '7. Enable tensor operations',
        '8. Handle batched operations',
        '9. Profile cuBLAS performance',
        '10. Document cuBLAS usage'
      ],
      outputFormat: 'JSON with cuBLAS integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationCode', 'configuration', 'artifacts'],
      properties: {
        integrationCode: { type: 'string' },
        configuration: { type: 'object' },
        supportedOperations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'tensor-core', 'cublas']
}));

export const mixedPrecisionTask = defineTask('mixed-precision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mixed Precision - ${args.projectName}`,
  agent: {
    name: 'tensor-core-specialist',
    skills: ['tensor-core-ops', 'cutlass-library'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement mixed precision computation',
      context: args,
      instructions: [
        '1. Design precision strategy',
        '2. Implement FP16 compute with FP32 accumulate',
        '3. Handle data type conversions',
        '4. Implement loss scaling if needed',
        '5. Use appropriate tensor core types',
        '6. Handle precision-sensitive operations',
        '7. Implement fallback for unsupported ops',
        '8. Profile mixed precision impact',
        '9. Validate numerical stability',
        '10. Document precision strategy'
      ],
      outputFormat: 'JSON with mixed precision implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['precisionStrategy', 'conversions', 'artifacts'],
      properties: {
        precisionStrategy: { type: 'object' },
        conversions: { type: 'array', items: { type: 'object' } },
        lossScaling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'tensor-core', 'mixed-precision']
}));

export const tensorCoreProfilingTask = defineTask('tensor-core-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Profiling - ${args.projectName}`,
  agent: {
    name: 'tensor-core-specialist',
    skills: ['tensor-core-ops', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Profile tensor core performance',
      context: args,
      instructions: [
        '1. Benchmark CUDA core baseline',
        '2. Benchmark tensor core implementation',
        '3. Calculate speedup',
        '4. Measure TC utilization',
        '5. Profile memory bandwidth',
        '6. Analyze roofline position',
        '7. Compare with cuBLAS',
        '8. Profile various matrix sizes',
        '9. Create performance charts',
        '10. Document profiling results'
      ],
      outputFormat: 'JSON with profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['speedup', 'tcUtilization', 'cudaCorePerf', 'tensorCorePerf', 'artifacts'],
      properties: {
        speedup: { type: 'number' },
        tcUtilization: { type: 'number' },
        cudaCorePerf: { type: 'number' },
        tensorCorePerf: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'tensor-core', 'profiling']
}));

export const precisionAnalysisTask = defineTask('precision-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Precision Analysis - ${args.projectName}`,
  agent: {
    name: 'tensor-core-specialist',
    skills: ['tensor-core-ops', 'cutlass-library'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Analyze numerical precision',
      context: args,
      instructions: [
        '1. Compare FP32 vs mixed precision results',
        '2. Calculate error bounds',
        '3. Analyze precision loss',
        '4. Test edge cases',
        '5. Validate with reference',
        '6. Identify precision-sensitive ops',
        '7. Recommend precision strategy',
        '8. Test various data distributions',
        '9. Document precision findings',
        '10. Provide guidelines'
      ],
      outputFormat: 'JSON with precision analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['accuracy', 'errorBound', 'artifacts'],
      properties: {
        accuracy: { type: 'number' },
        errorBound: { type: 'number' },
        precisionIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'tensor-core', 'precision']
}));

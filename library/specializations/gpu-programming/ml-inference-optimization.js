/**
 * @process specializations/gpu-programming/ml-inference-optimization
 * @description Machine Learning Inference Optimization - Workflow for optimizing GPU-accelerated ML model
 * inference for production deployment, covering quantization, batching, and kernel fusion.
 * @inputs { modelName: string, framework: string, targetLatency?: number, quantization?: string, outputDir?: string }
 * @outputs { success: boolean, optimizedModel: object, performanceMetrics: object, deploymentConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/ml-inference-optimization', {
 *   modelName: 'resnet50',
 *   framework: 'pytorch',
 *   targetLatency: 5,
 *   quantization: 'int8'
 * });
 *
 * @references
 * - TensorRT Documentation: https://docs.nvidia.com/deeplearning/tensorrt/
 * - ONNX Runtime: https://onnxruntime.ai/
 * - Quantization: https://pytorch.org/docs/stable/quantization.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelName,
    framework,
    targetLatency = 10,
    quantization = 'fp16',
    useTensorRT = true,
    outputDir = 'inference-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ML Inference Optimization: ${modelName}`);
  ctx.log('info', `Framework: ${framework}, Target latency: ${targetLatency}ms, Quantization: ${quantization}`);

  // Phase 1: Model Profiling
  const modelProfiling = await ctx.task(modelProfilingTask, {
    modelName, framework, outputDir
  });
  artifacts.push(...modelProfiling.artifacts);

  // Phase 2: Quantization
  const quantizationImpl = await ctx.task(quantizationImplementationTask, {
    modelName, framework, quantization, modelProfiling, outputDir
  });
  artifacts.push(...quantizationImpl.artifacts);

  // Phase 3: TensorRT Optimization
  let tensorrtOpt = null;
  if (useTensorRT) {
    tensorrtOpt = await ctx.task(tensorrtOptimizationTask, {
      modelName, quantizationImpl, outputDir
    });
    artifacts.push(...tensorrtOpt.artifacts);
  }

  // Phase 4: Batching Strategy
  const batchingStrategy = await ctx.task(batchingStrategyTask, {
    modelName, targetLatency, modelProfiling, outputDir
  });
  artifacts.push(...batchingStrategy.artifacts);

  // Phase 5: Kernel Fusion
  const kernelFusion = await ctx.task(kernelFusionTask, {
    modelName, tensorrtOpt, outputDir
  });
  artifacts.push(...kernelFusion.artifacts);

  // Phase 6: Inference Benchmarking
  const benchmarking = await ctx.task(inferenceBenchmarkingTask, {
    modelName, targetLatency, quantizationImpl, tensorrtOpt, batchingStrategy, outputDir
  });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Inference optimization complete for ${modelName}. Latency: ${benchmarking.latency}ms (target: ${targetLatency}ms). Review?`,
    title: 'Inference Optimization Complete',
    context: { runId: ctx.runId, benchmarking }
  });

  return {
    success: benchmarking.latency <= targetLatency,
    modelName,
    optimizedModel: {
      format: tensorrtOpt ? 'tensorrt' : 'onnx',
      path: tensorrtOpt?.enginePath || quantizationImpl.modelPath,
      quantization
    },
    performanceMetrics: {
      latency: benchmarking.latency,
      throughput: benchmarking.throughput,
      memoryUsage: benchmarking.memoryUsage,
      speedup: benchmarking.speedup
    },
    deploymentConfig: {
      optimalBatchSize: batchingStrategy.optimalBatchSize,
      maxBatchSize: batchingStrategy.maxBatchSize,
      dynamicBatching: batchingStrategy.dynamicBatching
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/ml-inference-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const modelProfilingTask = defineTask('model-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Profiling - ${args.modelName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'tensor-core-ops'],
    prompt: {
      role: 'ML Engineer',
      task: 'Profile inference model',
      context: args,
      instructions: [
        '1. Analyze model architecture',
        '2. Profile layer-by-layer latency',
        '3. Identify compute-intensive ops',
        '4. Profile memory usage',
        '5. Analyze operator types',
        '6. Identify bottleneck layers',
        '7. Profile data movement',
        '8. Analyze precision requirements',
        '9. Document profiling results',
        '10. Identify optimization opportunities'
      ],
      outputFormat: 'JSON with model profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['layerProfile', 'bottlenecks', 'artifacts'],
      properties: {
        layerProfile: { type: 'array', items: { type: 'object' } },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        baselineLatency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'inference', 'profiling']
}));

export const quantizationImplementationTask = defineTask('quantization-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quantization - ${args.modelName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'tensor-core-ops'],
    prompt: {
      role: 'ML Engineer',
      task: 'Implement model quantization',
      context: args,
      instructions: [
        '1. Choose quantization strategy',
        '2. Prepare calibration dataset',
        '3. Apply post-training quantization',
        '4. Handle sensitive layers',
        '5. Validate accuracy after quantization',
        '6. Export quantized model',
        '7. Compare latency improvement',
        '8. Document accuracy impact',
        '9. Test edge cases',
        '10. Generate quantization report'
      ],
      outputFormat: 'JSON with quantization implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'accuracyDelta', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        accuracyDelta: { type: 'number' },
        latencyReduction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'inference', 'quantization']
}));

export const tensorrtOptimizationTask = defineTask('tensorrt-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `TensorRT Optimization - ${args.modelName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'tensor-core-ops'],
    prompt: {
      role: 'ML Engineer',
      task: 'Optimize with TensorRT',
      context: args,
      instructions: [
        '1. Export model to ONNX',
        '2. Configure TensorRT builder',
        '3. Set optimization profiles',
        '4. Enable kernel auto-tuning',
        '5. Configure precision mode',
        '6. Build TensorRT engine',
        '7. Validate engine accuracy',
        '8. Profile optimized engine',
        '9. Serialize engine for deployment',
        '10. Document TensorRT configuration'
      ],
      outputFormat: 'JSON with TensorRT optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['enginePath', 'latency', 'artifacts'],
      properties: {
        enginePath: { type: 'string' },
        latency: { type: 'number' },
        fusedLayers: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'inference', 'tensorrt']
}));

export const batchingStrategyTask = defineTask('batching-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Batching Strategy - ${args.modelName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'tensor-core-ops'],
    prompt: {
      role: 'ML Engineer',
      task: 'Design batching strategy',
      context: args,
      instructions: [
        '1. Profile latency vs batch size',
        '2. Find optimal batch size',
        '3. Design dynamic batching',
        '4. Configure batch timeout',
        '5. Handle variable sequence lengths',
        '6. Implement batch padding',
        '7. Design batching queue',
        '8. Balance latency vs throughput',
        '9. Document batching config',
        '10. Test batching performance'
      ],
      outputFormat: 'JSON with batching strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalBatchSize', 'maxBatchSize', 'dynamicBatching', 'artifacts'],
      properties: {
        optimalBatchSize: { type: 'number' },
        maxBatchSize: { type: 'number' },
        dynamicBatching: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'inference', 'batching']
}));

export const kernelFusionTask = defineTask('kernel-fusion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kernel Fusion - ${args.modelName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'tensor-core-ops'],
    prompt: {
      role: 'ML Engineer',
      task: 'Analyze and apply kernel fusion',
      context: args,
      instructions: [
        '1. Identify fusion opportunities',
        '2. Analyze TensorRT fusions',
        '3. Implement custom fused kernels',
        '4. Fuse activation functions',
        '5. Fuse normalization layers',
        '6. Fuse element-wise ops',
        '7. Profile fused kernels',
        '8. Validate fusion correctness',
        '9. Document fusions applied',
        '10. Measure latency improvement'
      ],
      outputFormat: 'JSON with kernel fusion analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['fusionsApplied', 'latencyReduction', 'artifacts'],
      properties: {
        fusionsApplied: { type: 'array', items: { type: 'object' } },
        latencyReduction: { type: 'number' },
        customKernels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'inference', 'fusion']
}));

export const inferenceBenchmarkingTask = defineTask('inference-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmarking - ${args.modelName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'tensor-core-ops'],
    prompt: {
      role: 'ML Engineer',
      task: 'Benchmark inference performance',
      context: args,
      instructions: [
        '1. Measure end-to-end latency',
        '2. Measure throughput (QPS)',
        '3. Profile GPU memory usage',
        '4. Test different batch sizes',
        '5. Measure P50/P95/P99 latency',
        '6. Compare to baseline',
        '7. Test under load',
        '8. Profile power consumption',
        '9. Create benchmark report',
        '10. Document optimizations impact'
      ],
      outputFormat: 'JSON with benchmarking results'
    },
    outputSchema: {
      type: 'object',
      required: ['latency', 'throughput', 'memoryUsage', 'speedup', 'artifacts'],
      properties: {
        latency: { type: 'number' },
        throughput: { type: 'number' },
        memoryUsage: { type: 'number' },
        speedup: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'inference', 'benchmarking']
}));

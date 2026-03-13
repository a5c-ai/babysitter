/**
 * @process specializations/robotics-simulation/neural-network-edge-optimization
 * @description Neural Network Model Optimization for Edge Deployment - Optimize neural network models for
 * deployment on robot edge devices including quantization, pruning, TensorRT conversion, and runtime optimization.
 * @inputs { modelName: string, targetDevice?: string, optimizationLevel?: string, outputDir?: string }
 * @outputs { success: boolean, optimizedModel: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/neural-network-edge-optimization', {
 *   modelName: 'detection_model',
 *   targetDevice: 'jetson-orin',
 *   optimizationLevel: 'fp16'
 * });
 *
 * @references
 * - TensorRT: https://developer.nvidia.com/tensorrt
 * - ONNX Runtime: https://onnxruntime.ai/
 * - OpenVINO: https://docs.openvino.ai/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelName,
    targetDevice = 'jetson-orin',
    optimizationLevel = 'fp16',
    outputDir = 'edge-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Neural Network Edge Optimization for ${modelName}`);

  const modelAnalysis = await ctx.task(modelAnalysisTask, { modelName, targetDevice, outputDir });
  artifacts.push(...modelAnalysis.artifacts);

  const onnxConversion = await ctx.task(onnxConversionTask, { modelName, modelAnalysis, outputDir });
  artifacts.push(...onnxConversion.artifacts);

  const quantization = await ctx.task(quantizationTask, { modelName, optimizationLevel, onnxConversion, outputDir });
  artifacts.push(...quantization.artifacts);

  const pruning = await ctx.task(pruningOptimizationTask, { modelName, quantization, outputDir });
  artifacts.push(...pruning.artifacts);

  const tensorrtConversion = await ctx.task(tensorrtConversionTask, { modelName, targetDevice, pruning, outputDir });
  artifacts.push(...tensorrtConversion.artifacts);

  const runtimeOptimization = await ctx.task(runtimeOptimizationTask, { modelName, targetDevice, tensorrtConversion, outputDir });
  artifacts.push(...runtimeOptimization.artifacts);

  const accuracyValidation = await ctx.task(accuracyValidationTask, { modelName, runtimeOptimization, outputDir });
  artifacts.push(...accuracyValidation.artifacts);

  const latencyBenchmark = await ctx.task(latencyBenchmarkTask, { modelName, targetDevice, runtimeOptimization, outputDir });
  artifacts.push(...latencyBenchmark.artifacts);

  const deploymentPackage = await ctx.task(deploymentPackageTask, { modelName, targetDevice, runtimeOptimization, outputDir });
  artifacts.push(...deploymentPackage.artifacts);

  await ctx.breakpoint({
    question: `Edge Optimization Complete for ${modelName}. Accuracy retention: ${accuracyValidation.accuracyRetention}%, Speedup: ${latencyBenchmark.speedup}x. Review?`,
    title: 'Edge Optimization Complete',
    context: { runId: ctx.runId, accuracyRetention: accuracyValidation.accuracyRetention, speedup: latencyBenchmark.speedup }
  });

  return {
    success: accuracyValidation.accuracyRetention >= 95,
    modelName,
    optimizedModel: { modelPath: deploymentPackage.modelPath, format: tensorrtConversion.format },
    performanceMetrics: { accuracyRetention: accuracyValidation.accuracyRetention, speedup: latencyBenchmark.speedup, latencyMs: latencyBenchmark.latencyMs },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/neural-network-edge-optimization', timestamp: startTime, outputDir }
  };
}

export const modelAnalysisTask = defineTask('model-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Analysis - ${args.modelName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Analyze model architecture and complexity', context: args, instructions: ['1. Profile model layers', '2. Count parameters', '3. Identify bottlenecks', '4. Check device compatibility', '5. Document analysis'] },
    outputSchema: { type: 'object', required: ['architecture', 'parameters', 'artifacts'], properties: { architecture: { type: 'object' }, parameters: { type: 'number' }, bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'analysis']
}));

export const onnxConversionTask = defineTask('onnx-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: `ONNX Conversion - ${args.modelName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Convert model to ONNX format', context: args, instructions: ['1. Export to ONNX', '2. Verify operators', '3. Check dynamic shapes', '4. Validate output', '5. Document conversion'] },
    outputSchema: { type: 'object', required: ['onnxPath', 'opsetVersion', 'artifacts'], properties: { onnxPath: { type: 'string' }, opsetVersion: { type: 'number' }, warnings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'onnx']
}));

export const quantizationTask = defineTask('quantization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quantization - ${args.modelName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Apply quantization for reduced precision', context: args, instructions: ['1. Calibrate with dataset', '2. Apply PTQ or QAT', '3. Configure precision levels', '4. Validate accuracy', '5. Document quantization'] },
    outputSchema: { type: 'object', required: ['quantizedPath', 'precision', 'artifacts'], properties: { quantizedPath: { type: 'string' }, precision: { type: 'string' }, accuracyDrop: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'quantization']
}));

export const pruningOptimizationTask = defineTask('pruning-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pruning - ${args.modelName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Apply pruning to reduce model size', context: args, instructions: ['1. Identify prunable layers', '2. Apply structured pruning', '3. Fine-tune if needed', '4. Validate accuracy', '5. Document pruning'] },
    outputSchema: { type: 'object', required: ['prunedPath', 'sparsity', 'artifacts'], properties: { prunedPath: { type: 'string' }, sparsity: { type: 'number' }, sizeReduction: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'pruning']
}));

export const tensorrtConversionTask = defineTask('tensorrt-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: `TensorRT Conversion - ${args.modelName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Convert to TensorRT engine', context: args, instructions: ['1. Build TensorRT engine', '2. Configure workspace', '3. Set precision mode', '4. Optimize for device', '5. Validate engine'] },
    outputSchema: { type: 'object', required: ['enginePath', 'format', 'artifacts'], properties: { enginePath: { type: 'string' }, format: { type: 'string' }, buildConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'tensorrt']
}));

export const runtimeOptimizationTask = defineTask('runtime-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Runtime Optimization - ${args.modelName}`,
  agent: {
    name: 'ml-robotics-engineer',  // AG-007: ML/RL Robotics Engineer Agent
    prompt: { role: 'ML Engineer', task: 'Optimize inference runtime', context: args, instructions: ['1. Configure CUDA streams', '2. Enable async inference', '3. Optimize memory allocation', '4. Configure batch processing', '5. Test runtime performance'] },
    outputSchema: { type: 'object', required: ['runtimeConfig', 'optimizations', 'artifacts'], properties: { runtimeConfig: { type: 'object' }, optimizations: { type: 'array' }, memoryUsage: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'runtime']
}));

export const accuracyValidationTask = defineTask('accuracy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Accuracy Validation - ${args.modelName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Validate optimized model accuracy', context: args, instructions: ['1. Run on test dataset', '2. Compare to baseline', '3. Calculate accuracy retention', '4. Check edge cases', '5. Generate validation report'] },
    outputSchema: { type: 'object', required: ['accuracyRetention', 'baselineAccuracy', 'artifacts'], properties: { accuracyRetention: { type: 'number' }, baselineAccuracy: { type: 'number' }, optimizedAccuracy: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'validation']
}));

export const latencyBenchmarkTask = defineTask('latency-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: `Latency Benchmark - ${args.modelName}`,
  agent: {
    name: 'simulation-optimization-expert',  // AG-009: Simulation Optimization Expert Agent
    prompt: { role: 'Performance Engineer', task: 'Benchmark inference latency', context: args, instructions: ['1. Warm up model', '2. Run latency benchmark', '3. Measure throughput', '4. Calculate speedup', '5. Generate performance report'] },
    outputSchema: { type: 'object', required: ['latencyMs', 'speedup', 'artifacts'], properties: { latencyMs: { type: 'number' }, speedup: { type: 'number' }, throughput: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'benchmark']
}));

export const deploymentPackageTask = defineTask('deployment-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deployment Package - ${args.modelName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Create deployment package', context: args, instructions: ['1. Package optimized model', '2. Create ROS node wrapper', '3. Add configuration files', '4. Write deployment docs', '5. Test deployment'] },
    outputSchema: { type: 'object', required: ['modelPath', 'deploymentConfig', 'artifacts'], properties: { modelPath: { type: 'string' }, deploymentConfig: { type: 'object' }, rosNodePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'edge-optimization', 'deployment']
}));

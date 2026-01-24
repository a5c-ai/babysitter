/**
 * @process specializations/robotics-simulation/object-detection-pipeline
 * @description Object Detection and Recognition Pipeline - Develop perception pipeline for detecting and
 * recognizing objects including model selection, training, edge optimization, ROS integration, and
 * 3D bounding box estimation.
 * @inputs { projectName: string, targetObjects?: array, detectionModel?: string, deploymentTarget?: string, outputDir?: string }
 * @outputs { success: boolean, modelPath: string, rosIntegration: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/object-detection-pipeline', {
 *   projectName: 'warehouse_detection',
 *   targetObjects: ['boxes', 'pallets', 'people'],
 *   detectionModel: 'yolov8',
 *   deploymentTarget: 'jetson-orin'
 * });
 *
 * @references
 * - YOLOv8: https://github.com/ultralytics/ultralytics
 * - Detectron2: https://github.com/facebookresearch/detectron2
 * - NVIDIA DeepStream: https://developer.nvidia.com/deepstream-sdk
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetObjects = [],
    detectionModel = 'yolov8',
    deploymentTarget = 'jetson',
    outputDir = 'object-detection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Object Detection Pipeline: ${projectName}`);

  // Phase 1: Model Selection
  const modelSelection = await ctx.task(detectionModelSelectionTask, { projectName, detectionModel, targetObjects, deploymentTarget, outputDir });
  artifacts.push(...modelSelection.artifacts);

  // Phase 2: Dataset Collection
  const datasetCollection = await ctx.task(detectionDatasetTask, { projectName, targetObjects, outputDir });
  artifacts.push(...datasetCollection.artifacts);

  // Phase 3: Model Training
  const modelTraining = await ctx.task(detectionModelTrainingTask, { projectName, detectionModel, datasetCollection, outputDir });
  artifacts.push(...modelTraining.artifacts);

  // Phase 4: Edge Optimization
  const edgeOptimization = await ctx.task(edgeDeploymentOptimizationTask, { projectName, modelTraining, deploymentTarget, outputDir });
  artifacts.push(...edgeOptimization.artifacts);

  // Phase 5: ROS Integration
  const rosIntegration = await ctx.task(detectionRosIntegrationTask, { projectName, edgeOptimization, outputDir });
  artifacts.push(...rosIntegration.artifacts);

  // Phase 6: 3D Bounding Boxes
  const boundingBox3D = await ctx.task(boundingBox3DEstimationTask, { projectName, modelTraining, outputDir });
  artifacts.push(...boundingBox3D.artifacts);

  // Phase 7: Object Tracking
  const objectTracking = await ctx.task(objectTrackingTask, { projectName, modelTraining, outputDir });
  artifacts.push(...objectTracking.artifacts);

  // Phase 8: Testing
  const testing = await ctx.task(detectionTestingTask, { projectName, modelTraining, rosIntegration, outputDir });
  artifacts.push(...testing.artifacts);

  // Phase 9: Performance Measurement
  const performance = await ctx.task(detectionPerformanceTask, { projectName, testing, deploymentTarget, outputDir });
  artifacts.push(...performance.artifacts);

  await ctx.breakpoint({
    question: `Object Detection Pipeline Complete. mAP: ${testing.mAP}, Latency: ${performance.latency}ms. Review?`,
    title: 'Object Detection Complete',
    context: { runId: ctx.runId, mAP: testing.mAP, latency: performance.latency }
  });

  return {
    success: testing.mAP >= 0.5,
    projectName,
    modelPath: edgeOptimization.optimizedModelPath,
    rosIntegration: rosIntegration.nodeConfig,
    performanceMetrics: { mAP: testing.mAP, latency: performance.latency, fps: performance.fps },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/object-detection-pipeline', timestamp: startTime, outputDir }
  };
}

export const detectionModelSelectionTask = defineTask('detection-model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detection Model Selection - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: { role: 'ML Engineer', task: 'Select detection model', context: args, instructions: ['1. Evaluate YOLO, Detectron2, EfficientDet', '2. Consider deployment constraints', '3. Select model architecture', '4. Document selection rationale'] },
    outputSchema: { type: 'object', required: ['selectedModel', 'architecture', 'artifacts'], properties: { selectedModel: { type: 'string' }, architecture: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'model-selection']
}));

export const detectionDatasetTask = defineTask('detection-dataset', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detection Dataset - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: { role: 'ML Data Engineer', task: 'Collect or generate training dataset', context: args, instructions: ['1. Collect real-world images', '2. Generate synthetic data', '3. Annotate bounding boxes', '4. Create train/val/test splits', '5. Verify data quality'] },
    outputSchema: { type: 'object', required: ['datasetPath', 'statistics', 'artifacts'], properties: { datasetPath: { type: 'string' }, statistics: { type: 'object' }, classes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'dataset']
}));

export const detectionModelTrainingTask = defineTask('detection-model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detection Model Training - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: { role: 'ML Engineer', task: 'Train/fine-tune detection model', context: args, instructions: ['1. Configure training hyperparameters', '2. Set up data augmentation', '3. Train model', '4. Monitor training metrics', '5. Select best checkpoint'] },
    outputSchema: { type: 'object', required: ['modelPath', 'trainingMetrics', 'artifacts'], properties: { modelPath: { type: 'string' }, trainingMetrics: { type: 'object' }, bestEpoch: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'training']
}));

export const edgeDeploymentOptimizationTask = defineTask('edge-deployment-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Edge Optimization - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: { role: 'ML Engineer', task: 'Optimize model for edge deployment', context: args, instructions: ['1. Quantize model (INT8, FP16)', '2. Convert to TensorRT/ONNX', '3. Benchmark on target hardware', '4. Validate accuracy after optimization', '5. Document optimizations'] },
    outputSchema: { type: 'object', required: ['optimizedModelPath', 'speedup', 'artifacts'], properties: { optimizedModelPath: { type: 'string' }, speedup: { type: 'number' }, accuracyLoss: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'edge-optimization']
}));

export const detectionRosIntegrationTask = defineTask('detection-ros-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `ROS Integration - ${args.projectName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Integrate with ROS perception pipeline', context: args, instructions: ['1. Create ROS node for detection', '2. Configure image subscription', '3. Publish detection messages', '4. Add visualization', '5. Document ROS interface'] },
    outputSchema: { type: 'object', required: ['nodeConfig', 'topics', 'artifacts'], properties: { nodeConfig: { type: 'object' }, topics: { type: 'array' }, launchFile: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'ros']
}));

export const boundingBox3DEstimationTask = defineTask('bounding-box-3d-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `3D Bounding Box - ${args.projectName}`,
  agent: {
    name: 'computer-vision-engineer',
    prompt: { role: 'Computer Vision Engineer', task: 'Implement 3D bounding box estimation', context: args, instructions: ['1. Fuse 2D detection with depth', '2. Estimate object dimensions', '3. Calculate 3D pose', '4. Project to world frame', '5. Validate 3D accuracy'] },
    outputSchema: { type: 'object', required: ['bbox3DConfig', 'accuracy3D', 'artifacts'], properties: { bbox3DConfig: { type: 'object' }, accuracy3D: { type: 'object' }, method: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', '3d-bbox']
}));

export const objectTrackingTask = defineTask('object-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Object Tracking - ${args.projectName}`,
  agent: {
    name: 'computer-vision-engineer',
    prompt: { role: 'Computer Vision Engineer', task: 'Add object tracking over time', context: args, instructions: ['1. Select tracking algorithm (SORT, DeepSORT)', '2. Configure track management', '3. Handle occlusions', '4. Add track ID persistence', '5. Evaluate tracking metrics'] },
    outputSchema: { type: 'object', required: ['trackingConfig', 'mota', 'artifacts'], properties: { trackingConfig: { type: 'object' }, mota: { type: 'number' }, motp: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'tracking']
}));

export const detectionTestingTask = defineTask('detection-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detection Testing - ${args.projectName}`,
  agent: {
    name: 'test-engineer',
    prompt: { role: 'Test Engineer', task: 'Test in varied conditions', context: args, instructions: ['1. Test with varying lighting', '2. Test with occlusions', '3. Test at different distances', '4. Measure mAP', '5. Generate test report'] },
    outputSchema: { type: 'object', required: ['mAP', 'testResults', 'artifacts'], properties: { mAP: { type: 'number' }, testResults: { type: 'array' }, perClassAP: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'testing']
}));

export const detectionPerformanceTask = defineTask('detection-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detection Performance - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Measure detection accuracy and latency', context: args, instructions: ['1. Measure inference latency', '2. Measure throughput (FPS)', '3. Profile memory usage', '4. Test on target hardware', '5. Document performance'] },
    outputSchema: { type: 'object', required: ['latency', 'fps', 'artifacts'], properties: { latency: { type: 'number' }, fps: { type: 'number' }, memoryUsage: { type: 'object' }, gpuUtilization: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'object-detection', 'performance']
}));

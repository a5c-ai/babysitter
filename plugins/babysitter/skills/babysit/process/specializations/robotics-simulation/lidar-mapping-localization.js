/**
 * @process specializations/robotics-simulation/lidar-mapping-localization
 * @description LiDAR-Based Mapping and Localization - Implement 3D LiDAR SLAM for robust localization in
 * GPS-denied environments including framework selection, point cloud processing, scan matching, pose graph
 * optimization, and IMU integration.
 * @inputs { robotName: string, lidarType?: string, slamFramework?: string, imuIntegration?: boolean, outputDir?: string }
 * @outputs { success: boolean, slamConfig: object, mapPath: string, accuracyMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/lidar-mapping-localization', {
 *   robotName: 'agv_robot',
 *   lidarType: '3d-velodyne',
 *   slamFramework: 'lio-sam',
 *   imuIntegration: true
 * });
 *
 * @references
 * - LIO-SAM: https://github.com/TixiaoShan/LIO-SAM
 * - A-LOAM: https://github.com/HKUST-Aerial-Robotics/A-LOAM
 * - Point Cloud Library: https://pointclouds.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    lidarType = '3d-velodyne',
    slamFramework = 'lio-sam',
    imuIntegration = true,
    outputDir = 'lidar-slam-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LiDAR SLAM Implementation for ${robotName}`);

  // Phase 1: Framework Selection
  const frameworkSelection = await ctx.task(lidarSlamFrameworkTask, { robotName, slamFramework, lidarType, imuIntegration, outputDir });
  artifacts.push(...frameworkSelection.artifacts);

  // Phase 2: LiDAR Configuration
  const lidarConfig = await ctx.task(lidarSensorConfigTask, { robotName, lidarType, outputDir });
  artifacts.push(...lidarConfig.artifacts);

  // Phase 3: Point Cloud Preprocessing
  const preprocessing = await ctx.task(pointCloudPreprocessingTask, { robotName, lidarConfig, outputDir });
  artifacts.push(...preprocessing.artifacts);

  // Phase 4: Scan Matching
  const scanMatching = await ctx.task(scanMatchingTask, { robotName, slamFramework, preprocessing, outputDir });
  artifacts.push(...scanMatching.artifacts);

  // Phase 5: Pose Graph Optimization
  const poseGraph = await ctx.task(poseGraphOptimizationTask, { robotName, slamFramework, scanMatching, outputDir });
  artifacts.push(...poseGraph.artifacts);

  // Phase 6: IMU Integration
  if (imuIntegration) {
    const imuSetup = await ctx.task(lidarImuIntegrationTask, { robotName, slamFramework, poseGraph, outputDir });
    artifacts.push(...imuSetup.artifacts);
  }

  // Phase 7: Testing
  const testing = await ctx.task(lidarSlamTestingTask, { robotName, slamFramework, outputDir });
  artifacts.push(...testing.artifacts);

  // Phase 8: Accuracy Evaluation
  const accuracy = await ctx.task(lidarSlamAccuracyTask, { robotName, testing, outputDir });
  artifacts.push(...accuracy.artifacts);

  // Phase 9: Optimization
  const optimization = await ctx.task(lidarSlamOptimizationTask, { robotName, slamFramework, accuracy, outputDir });
  artifacts.push(...optimization.artifacts);

  await ctx.breakpoint({
    question: `LiDAR SLAM Complete for ${robotName}. ATE: ${accuracy.ate}m. Review?`,
    title: 'LiDAR SLAM Complete',
    context: { runId: ctx.runId, ate: accuracy.ate, framework: slamFramework }
  });

  return {
    success: accuracy.meetsRequirements,
    robotName,
    slamConfig: { framework: slamFramework, configPath: frameworkSelection.configPath },
    mapPath: testing.mapPath,
    accuracyMetrics: { ate: accuracy.ate, rpe: accuracy.rpe },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/lidar-mapping-localization', timestamp: startTime, outputDir }
  };
}

export const lidarSlamFrameworkTask = defineTask('lidar-slam-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `LiDAR SLAM Framework - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Select and configure LiDAR SLAM framework', context: args, instructions: ['1. Evaluate LOAM, LeGO-LOAM, LIO-SAM options', '2. Consider IMU integration support', '3. Configure framework dependencies', '4. Set up ROS integration', '5. Document framework selection'] },
    outputSchema: { type: 'object', required: ['framework', 'configPath', 'artifacts'], properties: { framework: { type: 'string' }, configPath: { type: 'string' }, dependencies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'framework']
}));

export const lidarSensorConfigTask = defineTask('lidar-sensor-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `LiDAR Sensor Config - ${args.robotName}`,
  agent: {
    name: 'sensor-engineer',
    prompt: { role: 'Sensor Engineer', task: 'Configure LiDAR sensor parameters', context: args, instructions: ['1. Set scan rate and resolution', '2. Configure range limits', '3. Set up point cloud format', '4. Configure intensity settings', '5. Document sensor config'] },
    outputSchema: { type: 'object', required: ['lidarParams', 'artifacts'], properties: { lidarParams: { type: 'object' }, scanRate: { type: 'number' }, rangeMax: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'sensor']
}));

export const pointCloudPreprocessingTask = defineTask('point-cloud-preprocessing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Point Cloud Preprocessing - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Implement point cloud preprocessing', context: args, instructions: ['1. Configure voxel grid filtering', '2. Set up ground plane removal', '3. Configure outlier removal', '4. Implement downsampling', '5. Document preprocessing pipeline'] },
    outputSchema: { type: 'object', required: ['preprocessingConfig', 'artifacts'], properties: { preprocessingConfig: { type: 'object' }, voxelSize: { type: 'number' }, filters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'preprocessing']
}));

export const scanMatchingTask = defineTask('scan-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan Matching - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Set up scan matching and registration', context: args, instructions: ['1. Configure ICP algorithm', '2. Set up feature extraction', '3. Configure matching thresholds', '4. Set convergence criteria', '5. Document scan matching config'] },
    outputSchema: { type: 'object', required: ['scanMatchingConfig', 'artifacts'], properties: { scanMatchingConfig: { type: 'object' }, algorithm: { type: 'string' }, convergenceThreshold: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'scan-matching']
}));

export const poseGraphOptimizationTask = defineTask('pose-graph-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pose Graph Optimization - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Implement pose graph optimization', context: args, instructions: ['1. Configure graph optimization backend', '2. Set up loop closure integration', '3. Configure optimization parameters', '4. Set up incremental optimization', '5. Document optimization config'] },
    outputSchema: { type: 'object', required: ['poseGraphConfig', 'artifacts'], properties: { poseGraphConfig: { type: 'object' }, optimizer: { type: 'string' }, loopClosureConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'pose-graph']
}));

export const lidarImuIntegrationTask = defineTask('lidar-imu-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `LiDAR-IMU Integration - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Add IMU integration for LiDAR SLAM', context: args, instructions: ['1. Configure IMU preintegration', '2. Set up sensor fusion', '3. Configure bias estimation', '4. Set time synchronization', '5. Document IMU integration'] },
    outputSchema: { type: 'object', required: ['imuIntegrationConfig', 'artifacts'], properties: { imuIntegrationConfig: { type: 'object' }, preintegrationConfig: { type: 'object' }, fusionMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'imu']
}));

export const lidarSlamTestingTask = defineTask('lidar-slam-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `LiDAR SLAM Testing - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: { role: 'Test Engineer', task: 'Test LiDAR SLAM in challenging scenarios', context: args, instructions: ['1. Test in indoor environments', '2. Test in outdoor environments', '3. Test with dynamic obstacles', '4. Test large-scale mapping', '5. Generate test reports'] },
    outputSchema: { type: 'object', required: ['testResults', 'mapPath', 'artifacts'], properties: { testResults: { type: 'array' }, mapPath: { type: 'string' }, successRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'testing']
}));

export const lidarSlamAccuracyTask = defineTask('lidar-slam-accuracy', (args, taskCtx) => ({
  kind: 'agent',
  title: `LiDAR SLAM Accuracy - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: { role: 'Test Engineer', task: 'Evaluate mapping accuracy and consistency', context: args, instructions: ['1. Compute ATE and RPE', '2. Evaluate map consistency', '3. Compare to ground truth', '4. Analyze drift', '5. Generate accuracy report'] },
    outputSchema: { type: 'object', required: ['ate', 'rpe', 'meetsRequirements', 'artifacts'], properties: { ate: { type: 'number' }, rpe: { type: 'number' }, mapConsistency: { type: 'number' }, meetsRequirements: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'accuracy']
}));

export const lidarSlamOptimizationTask = defineTask('lidar-slam-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `LiDAR SLAM Optimization - ${args.robotName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Optimize computational efficiency', context: args, instructions: ['1. Profile processing times', '2. Optimize point cloud processing', '3. Reduce memory usage', '4. Configure parallel processing', '5. Document optimizations'] },
    outputSchema: { type: 'object', required: ['processingTime', 'optimizations', 'artifacts'], properties: { processingTime: { type: 'number' }, optimizations: { type: 'array' }, memoryUsage: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'lidar-slam', 'optimization']
}));

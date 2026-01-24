/**
 * @process specializations/robotics-simulation/sensor-fusion-framework
 * @description Sensor Fusion Framework - Implement multi-sensor fusion for robust state estimation including
 * EKF/UKF implementation, IMU/wheel/GPS/vision fusion, outlier rejection, and performance validation.
 * @inputs { robotName: string, sensorSources?: array, filterType?: string, outputDir?: string }
 * @outputs { success: boolean, fusionConfig: object, validationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/sensor-fusion-framework', {
 *   robotName: 'mobile_robot',
 *   sensorSources: ['imu', 'wheel_odom', 'gps', 'visual_odom'],
 *   filterType: 'ekf'
 * });
 *
 * @references
 * - robot_localization: http://wiki.ros.org/robot_localization
 * - Probabilistic Robotics: https://mitpress.mit.edu/9780262201629/
 * - Kalibr: https://github.com/ethz-asl/kalibr
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    sensorSources = ['imu', 'wheel_odom'],
    filterType = 'ekf',
    outputDir = 'sensor-fusion-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Sensor Fusion Framework for ${robotName}`);

  // Phase 1: Architecture Design
  const architecture = await ctx.task(fusionArchitectureTask, { robotName, sensorSources, filterType, outputDir });
  artifacts.push(...architecture.artifacts);

  // Phase 2: Filter Implementation
  const filterImpl = await ctx.task(filterImplementationTask, { robotName, filterType, sensorSources, outputDir });
  artifacts.push(...filterImpl.artifacts);

  // Phase 3: Sensor Integration
  const sensorIntegration = await ctx.task(sensorIntegrationTask, { robotName, sensorSources, filterImpl, outputDir });
  artifacts.push(...sensorIntegration.artifacts);

  // Phase 4: Delay Handling
  const delayHandling = await ctx.task(sensorDelayHandlingTask, { robotName, sensorSources, outputDir });
  artifacts.push(...delayHandling.artifacts);

  // Phase 5: Outlier Rejection
  const outlierRejection = await ctx.task(outlierRejectionTask, { robotName, filterImpl, outputDir });
  artifacts.push(...outlierRejection.artifacts);

  // Phase 6: Parameter Tuning
  const parameterTuning = await ctx.task(fusionParameterTuningTask, { robotName, filterType, sensorSources, outputDir });
  artifacts.push(...parameterTuning.artifacts);

  // Phase 7: Ground Truth Validation
  const validation = await ctx.task(fusionValidationTask, { robotName, parameterTuning, outputDir });
  artifacts.push(...validation.artifacts);

  // Phase 8: Degradation Testing
  const degradationTesting = await ctx.task(sensorDegradationTestingTask, { robotName, sensorSources, outputDir });
  artifacts.push(...degradationTesting.artifacts);

  // Phase 9: Performance Monitoring
  const monitoring = await ctx.task(fusionMonitoringTask, { robotName, validation, outputDir });
  artifacts.push(...monitoring.artifacts);

  await ctx.breakpoint({
    question: `Sensor Fusion Complete for ${robotName}. Position error: ${validation.positionError}m. Review?`,
    title: 'Sensor Fusion Complete',
    context: { runId: ctx.runId, positionError: validation.positionError, filter: filterType }
  });

  return {
    success: validation.meetsRequirements,
    robotName,
    fusionConfig: { filterType, parameters: parameterTuning.parameters, configPath: parameterTuning.configPath },
    validationResults: { positionError: validation.positionError, orientationError: validation.orientationError },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/sensor-fusion-framework', timestamp: startTime, outputDir }
  };
}

export const fusionArchitectureTask = defineTask('fusion-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fusion Architecture - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Design sensor fusion architecture', context: args, instructions: ['1. Define state vector', '2. Design sensor model', '3. Plan filter structure', '4. Define output states', '5. Document architecture'] },
    outputSchema: { type: 'object', required: ['stateVector', 'sensorModels', 'artifacts'], properties: { stateVector: { type: 'array' }, sensorModels: { type: 'array' }, filterStructure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'architecture']
}));

export const filterImplementationTask = defineTask('filter-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Filter Implementation - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Implement EKF or UKF filter', context: args, instructions: ['1. Implement prediction step', '2. Implement update step', '3. Configure covariances', '4. Set up state transition', '5. Implement measurement models'] },
    outputSchema: { type: 'object', required: ['filterConfig', 'stateTransition', 'artifacts'], properties: { filterConfig: { type: 'object' }, stateTransition: { type: 'object' }, measurementModels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'filter']
}));

export const sensorIntegrationTask = defineTask('sensor-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensor Integration - ${args.robotName}`,
  agent: {
    name: 'sensor-engineer',
    prompt: { role: 'Sensor Engineer', task: 'Fuse data from IMU, wheel, GPS, vision', context: args, instructions: ['1. Configure IMU integration', '2. Add wheel odometry', '3. Integrate GPS', '4. Add visual odometry', '5. Test sensor fusion'] },
    outputSchema: { type: 'object', required: ['sensorConfigs', 'topics', 'artifacts'], properties: { sensorConfigs: { type: 'array' }, topics: { type: 'array' }, frameIds: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'integration']
}));

export const sensorDelayHandlingTask = defineTask('sensor-delay-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Delay Handling - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Handle sensor delays and async measurements', context: args, instructions: ['1. Measure sensor latencies', '2. Implement delay compensation', '3. Handle out-of-order messages', '4. Configure buffers', '5. Test timing accuracy'] },
    outputSchema: { type: 'object', required: ['delayConfig', 'sensorLatencies', 'artifacts'], properties: { delayConfig: { type: 'object' }, sensorLatencies: { type: 'object' }, bufferConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'delay']
}));

export const outlierRejectionTask = defineTask('outlier-rejection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Outlier Rejection - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Implement outlier rejection', context: args, instructions: ['1. Implement Mahalanobis distance check', '2. Configure chi-squared thresholds', '3. Add innovation monitoring', '4. Implement RANSAC for vision', '5. Test outlier detection'] },
    outputSchema: { type: 'object', required: ['outlierConfig', 'thresholds', 'artifacts'], properties: { outlierConfig: { type: 'object' }, thresholds: { type: 'object' }, rejectionRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'outlier']
}));

export const fusionParameterTuningTask = defineTask('fusion-parameter-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parameter Tuning - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Tune filter parameters', context: args, instructions: ['1. Tune process noise', '2. Tune measurement noise', '3. Configure initial covariances', '4. Optimize parameters', '5. Validate tuning'] },
    outputSchema: { type: 'object', required: ['parameters', 'configPath', 'artifacts'], properties: { parameters: { type: 'object' }, configPath: { type: 'string' }, processNoise: { type: 'object' }, measurementNoise: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'tuning']
}));

export const fusionValidationTask = defineTask('fusion-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fusion Validation - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: { role: 'Test Engineer', task: 'Validate against ground truth', context: args, instructions: ['1. Compare to ground truth', '2. Compute position error', '3. Compute orientation error', '4. Test in various conditions', '5. Generate validation report'] },
    outputSchema: { type: 'object', required: ['positionError', 'orientationError', 'meetsRequirements', 'artifacts'], properties: { positionError: { type: 'number' }, orientationError: { type: 'number' }, meetsRequirements: { type: 'boolean' }, testResults: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'validation']
}));

export const sensorDegradationTestingTask = defineTask('sensor-degradation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Degradation Testing - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: { role: 'Test Engineer', task: 'Test under sensor degradation', context: args, instructions: ['1. Test with GPS dropout', '2. Test with IMU noise', '3. Test wheel slip scenarios', '4. Test sensor failure recovery', '5. Document robustness'] },
    outputSchema: { type: 'object', required: ['degradationResults', 'robustnessScore', 'artifacts'], properties: { degradationResults: { type: 'array' }, robustnessScore: { type: 'number' }, failureModes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'degradation']
}));

export const fusionMonitoringTask = defineTask('fusion-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fusion Monitoring - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: { role: 'Robotics Engineer', task: 'Monitor and log fusion performance', context: args, instructions: ['1. Set up covariance monitoring', '2. Add innovation logging', '3. Configure health diagnostics', '4. Add performance metrics', '5. Create monitoring dashboard'] },
    outputSchema: { type: 'object', required: ['monitoringConfig', 'diagnostics', 'artifacts'], properties: { monitoringConfig: { type: 'object' }, diagnostics: { type: 'array' }, metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'sensor-fusion', 'monitoring']
}));

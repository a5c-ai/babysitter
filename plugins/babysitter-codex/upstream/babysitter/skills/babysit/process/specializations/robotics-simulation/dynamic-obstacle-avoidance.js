/**
 * @process specializations/robotics-simulation/dynamic-obstacle-avoidance
 * @description Dynamic Obstacle Avoidance - Implement real-time obstacle avoidance for mobile robots including
 * algorithm selection, perception integration, velocity constraints, social navigation, and safety validation.
 * @inputs { robotName: string, avoidanceAlgorithm?: string, environmentType?: string, outputDir?: string }
 * @outputs { success: boolean, avoidanceConfig: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/dynamic-obstacle-avoidance', {
 *   robotName: 'service_robot',
 *   avoidanceAlgorithm: 'teb',
 *   environmentType: 'human-environment'
 * });
 *
 * @references
 * - DWA: https://wiki.ros.org/dwa_local_planner
 * - TEB: https://wiki.ros.org/teb_local_planner
 * - Social Navigation: https://arxiv.org/abs/2103.14750
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    avoidanceAlgorithm = 'teb',
    environmentType = 'dynamic',
    outputDir = 'dynamic-avoidance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Dynamic Obstacle Avoidance for ${robotName}`);

  const algorithmSelection = await ctx.task(avoidanceAlgorithmSelectionTask, { robotName, avoidanceAlgorithm, environmentType, outputDir });
  artifacts.push(...algorithmSelection.artifacts);

  const perceptionIntegration = await ctx.task(avoidancePerceptionIntegrationTask, { robotName, algorithmSelection, outputDir });
  artifacts.push(...perceptionIntegration.artifacts);

  const velocityConstraints = await ctx.task(velocityConstraintsConfigTask, { robotName, algorithmSelection, outputDir });
  artifacts.push(...velocityConstraints.artifacts);

  const obstaclePrediction = await ctx.task(obstaclePredictionTask, { robotName, perceptionIntegration, outputDir });
  artifacts.push(...obstaclePrediction.artifacts);

  const socialNavigation = await ctx.task(socialNavigationTask, { robotName, environmentType, outputDir });
  artifacts.push(...socialNavigation.artifacts);

  const dynamicTesting = await ctx.task(dynamicObstacleTestingTask, { robotName, algorithmSelection, outputDir });
  artifacts.push(...dynamicTesting.artifacts);

  const safetyValidation = await ctx.task(avoidanceSafetyValidationTask, { robotName, dynamicTesting, outputDir });
  artifacts.push(...safetyValidation.artifacts);

  const replanningOptimization = await ctx.task(replanningOptimizationTask, { robotName, safetyValidation, outputDir });
  artifacts.push(...replanningOptimization.artifacts);

  const successRateMeasurement = await ctx.task(avoidanceSuccessRateTask, { robotName, dynamicTesting, safetyValidation, outputDir });
  artifacts.push(...successRateMeasurement.artifacts);

  await ctx.breakpoint({
    question: `Dynamic Avoidance Complete for ${robotName}. Success rate: ${successRateMeasurement.successRate}%, Collision-free: ${safetyValidation.collisionFree}. Review?`,
    title: 'Dynamic Avoidance Complete',
    context: { runId: ctx.runId, successRate: successRateMeasurement.successRate, collisionFree: safetyValidation.collisionFree }
  });

  return {
    success: successRateMeasurement.successRate >= 95 && safetyValidation.collisionFree,
    robotName,
    avoidanceConfig: { algorithm: avoidanceAlgorithm, parameters: algorithmSelection.parameters },
    performanceMetrics: { successRate: successRateMeasurement.successRate, replanTime: replanningOptimization.replanTime },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/dynamic-obstacle-avoidance', timestamp: startTime, outputDir }
  };
}

export const avoidanceAlgorithmSelectionTask = defineTask('avoidance-algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Algorithm Selection - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Select avoidance algorithm', context: args, instructions: ['1. Evaluate DWA, TEB, MPC options', '2. Consider environment type', '3. Configure algorithm parameters', '4. Set up ROS integration', '5. Document selection'] },
    outputSchema: { type: 'object', required: ['algorithm', 'parameters', 'artifacts'], properties: { algorithm: { type: 'string' }, parameters: { type: 'object' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'algorithm']
}));

export const avoidancePerceptionIntegrationTask = defineTask('avoidance-perception-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Perception Integration - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Integrate with perception system', context: args, instructions: ['1. Subscribe to laser scan', '2. Integrate point cloud', '3. Add object detection', '4. Configure obstacle tracking', '5. Test perception pipeline'] },
    outputSchema: { type: 'object', required: ['perceptionConfig', 'sensorTopics', 'artifacts'], properties: { perceptionConfig: { type: 'object' }, sensorTopics: { type: 'array' }, trackingConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'perception']
}));

export const velocityConstraintsConfigTask = defineTask('velocity-constraints-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Velocity Constraints - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure velocity constraints and dynamics', context: args, instructions: ['1. Set max linear velocity', '2. Set max angular velocity', '3. Configure acceleration limits', '4. Add deceleration constraints', '5. Test dynamics compliance'] },
    outputSchema: { type: 'object', required: ['velocityLimits', 'accelerationLimits', 'artifacts'], properties: { velocityLimits: { type: 'object' }, accelerationLimits: { type: 'object' }, dynamicsConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'velocity']
}));

export const obstaclePredictionTask = defineTask('obstacle-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Obstacle Prediction - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement prediction for moving obstacles', context: args, instructions: ['1. Estimate obstacle velocities', '2. Predict future positions', '3. Configure prediction horizon', '4. Handle uncertainty', '5. Test prediction accuracy'] },
    outputSchema: { type: 'object', required: ['predictionConfig', 'horizon', 'artifacts'], properties: { predictionConfig: { type: 'object' }, horizon: { type: 'number' }, predictionMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'prediction']
}));

export const socialNavigationTask = defineTask('social-navigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Social Navigation - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Add social navigation behaviors', context: args, instructions: ['1. Implement personal space', '2. Add passing behaviors', '3. Configure social forces', '4. Add human-aware planning', '5. Test with humans'] },
    outputSchema: { type: 'object', required: ['socialConfig', 'personalSpace', 'artifacts'], properties: { socialConfig: { type: 'object' }, personalSpace: { type: 'number' }, socialForces: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'social']
}));

export const dynamicObstacleTestingTask = defineTask('dynamic-obstacle-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dynamic Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test with dynamic obstacles at various speeds', context: args, instructions: ['1. Test with slow-moving obstacles', '2. Test with fast-moving obstacles', '3. Test with multiple obstacles', '4. Test crossing scenarios', '5. Measure avoidance performance'] },
    outputSchema: { type: 'object', required: ['testResults', 'avoidanceRate', 'artifacts'], properties: { testResults: { type: 'array' }, avoidanceRate: { type: 'number' }, scenarioResults: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'testing']
}));

export const avoidanceSafetyValidationTask = defineTask('avoidance-safety-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Safety Validation - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Validate safety margins and collision avoidance', context: args, instructions: ['1. Verify minimum clearance', '2. Test emergency stop', '3. Validate safety margins', '4. Test failure modes', '5. Document safety compliance'] },
    outputSchema: { type: 'object', required: ['collisionFree', 'safetyMargins', 'artifacts'], properties: { collisionFree: { type: 'boolean' }, safetyMargins: { type: 'object' }, emergencyStopTest: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'safety']
}));

export const replanningOptimizationTask = defineTask('replanning-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Replanning Optimization - ${args.robotName}`,
  agent: {
    name: 'simulation-optimization-expert',  // AG-009: Simulation Optimization Expert Agent
    prompt: { role: 'Performance Engineer', task: 'Optimize replanning frequency', context: args, instructions: ['1. Profile replanning time', '2. Optimize computation', '3. Configure adaptive replanning', '4. Balance frequency vs quality', '5. Test real-time performance'] },
    outputSchema: { type: 'object', required: ['replanTime', 'replanFrequency', 'artifacts'], properties: { replanTime: { type: 'number' }, replanFrequency: { type: 'number' }, optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'replanning']
}));

export const avoidanceSuccessRateTask = defineTask('avoidance-success-rate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Success Rate Measurement - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Measure navigation success rate', context: args, instructions: ['1. Run navigation trials', '2. Count successful navigations', '3. Analyze failure cases', '4. Calculate success rate', '5. Generate report'] },
    outputSchema: { type: 'object', required: ['successRate', 'totalTrials', 'artifacts'], properties: { successRate: { type: 'number' }, totalTrials: { type: 'number' }, failureCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'dynamic-avoidance', 'success-rate']
}));

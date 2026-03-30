/**
 * @process specializations/robotics-simulation/path-planning-algorithm
 * @description Path Planning Algorithm Implementation - Implement and tune path planning algorithms for
 * navigation including algorithm selection, cost map configuration, dynamic obstacle avoidance, path
 * smoothing, and performance optimization.
 * @inputs { robotName: string, planningAlgorithm?: string, environmentType?: string, outputDir?: string }
 * @outputs { success: boolean, plannerConfig: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/path-planning-algorithm', {
 *   robotName: 'mobile_robot',
 *   planningAlgorithm: 'rrt-star',
 *   environmentType: 'warehouse'
 * });
 *
 * @references
 * - OMPL: https://ompl.kavrakilab.org/
 * - move_base: http://wiki.ros.org/move_base
 * - Nav2: https://navigation.ros.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    planningAlgorithm = 'rrt-star',
    environmentType = 'indoor',
    outputDir = 'path-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Path Planning Implementation for ${robotName}`);

  // Phase 1: Algorithm Selection
  const algorithmSelection = await ctx.task(planningAlgorithmSelectionTask, { robotName, planningAlgorithm, environmentType, outputDir });
  artifacts.push(...algorithmSelection.artifacts);

  // Phase 2: Cost Map Configuration
  const costMapConfig = await ctx.task(costMapConfigurationTask, { robotName, environmentType, outputDir });
  artifacts.push(...costMapConfig.artifacts);

  // Phase 3: Planner Parameters
  const plannerParams = await ctx.task(plannerParametersTask, { robotName, planningAlgorithm, costMapConfig, outputDir });
  artifacts.push(...plannerParams.artifacts);

  // Phase 4: Dynamic Obstacle Avoidance
  const dynamicAvoidance = await ctx.task(dynamicObstacleAvoidanceTask, { robotName, plannerParams, outputDir });
  artifacts.push(...dynamicAvoidance.artifacts);

  // Phase 5: Path Smoothing
  const pathSmoothing = await ctx.task(pathSmoothingTask, { robotName, planningAlgorithm, outputDir });
  artifacts.push(...pathSmoothing.artifacts);

  // Phase 6: Failure Handling
  const failureHandling = await ctx.task(planningFailureHandlingTask, { robotName, outputDir });
  artifacts.push(...failureHandling.artifacts);

  // Phase 7: Testing
  const testing = await ctx.task(pathPlanningTestingTask, { robotName, plannerParams, environmentType, outputDir });
  artifacts.push(...testing.artifacts);

  // Phase 8: Performance Metrics
  const performance = await ctx.task(pathPlanningPerformanceTask, { robotName, testing, outputDir });
  artifacts.push(...performance.artifacts);

  // Phase 9: Optimization
  const optimization = await ctx.task(pathPlanningOptimizationTask, { robotName, planningAlgorithm, performance, outputDir });
  artifacts.push(...optimization.artifacts);

  await ctx.breakpoint({
    question: `Path Planning Complete for ${robotName}. Planning time: ${performance.avgPlanningTime}ms, Success rate: ${testing.successRate}%. Review?`,
    title: 'Path Planning Complete',
    context: { runId: ctx.runId, planningTime: performance.avgPlanningTime, successRate: testing.successRate }
  });

  return {
    success: testing.successRate >= 95,
    robotName,
    plannerConfig: { algorithm: planningAlgorithm, parameters: plannerParams.parameters, configPath: plannerParams.configPath },
    performanceMetrics: { planningTime: performance.avgPlanningTime, pathQuality: performance.pathQuality, successRate: testing.successRate },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/path-planning-algorithm', timestamp: startTime, outputDir }
  };
}

export const planningAlgorithmSelectionTask = defineTask('planning-algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planning Algorithm Selection - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Select path planning algorithm', context: args, instructions: ['1. Evaluate A*, RRT, RRT*, Hybrid A*', '2. Consider environment complexity', '3. Consider real-time requirements', '4. Document selection rationale'] },
    outputSchema: { type: 'object', required: ['selectedAlgorithm', 'rationale', 'artifacts'], properties: { selectedAlgorithm: { type: 'string' }, rationale: { type: 'string' }, alternatives: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'algorithm']
}));

export const costMapConfigurationTask = defineTask('cost-map-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Map Configuration - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement cost map representation', context: args, instructions: ['1. Configure static layer', '2. Add obstacle layer', '3. Configure inflation layer', '4. Set resolution', '5. Test cost map updates'] },
    outputSchema: { type: 'object', required: ['costMapConfig', 'layers', 'artifacts'], properties: { costMapConfig: { type: 'object' }, layers: { type: 'array' }, resolution: { type: 'number' }, inflationRadius: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'costmap']
}));

export const plannerParametersTask = defineTask('planner-parameters', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planner Parameters - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure planner parameters', context: args, instructions: ['1. Set search resolution', '2. Configure goal tolerance', '3. Set planning timeout', '4. Configure heuristics', '5. Tune for environment'] },
    outputSchema: { type: 'object', required: ['parameters', 'configPath', 'artifacts'], properties: { parameters: { type: 'object' }, configPath: { type: 'string' }, goalTolerance: { type: 'object' }, timeout: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'parameters']
}));

export const dynamicObstacleAvoidanceTask = defineTask('dynamic-obstacle-avoidance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dynamic Obstacle Avoidance - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Add dynamic obstacle avoidance', context: args, instructions: ['1. Configure obstacle tracking', '2. Add velocity obstacles', '3. Set replanning triggers', '4. Configure safety margins', '5. Test dynamic avoidance'] },
    outputSchema: { type: 'object', required: ['avoidanceConfig', 'replanFrequency', 'artifacts'], properties: { avoidanceConfig: { type: 'object' }, replanFrequency: { type: 'number' }, safetyMargins: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'dynamic-avoidance']
}));

export const pathSmoothingTask = defineTask('path-smoothing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Path Smoothing - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement path smoothing and optimization', context: args, instructions: ['1. Configure smoothing algorithm', '2. Add curvature constraints', '3. Optimize path length', '4. Ensure kinematic feasibility', '5. Validate smoothed paths'] },
    outputSchema: { type: 'object', required: ['smoothingConfig', 'curvatureLimit', 'artifacts'], properties: { smoothingConfig: { type: 'object' }, curvatureLimit: { type: 'number' }, smoothingMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'smoothing']
}));

export const planningFailureHandlingTask = defineTask('planning-failure-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Failure Handling - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Handle planning failures gracefully', context: args, instructions: ['1. Detect planning failures', '2. Implement recovery behaviors', '3. Add fallback planners', '4. Configure timeouts', '5. Test failure recovery'] },
    outputSchema: { type: 'object', required: ['failureHandlingConfig', 'recoveryBehaviors', 'artifacts'], properties: { failureHandlingConfig: { type: 'object' }, recoveryBehaviors: { type: 'array' }, fallbackPlanner: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'failure-handling']
}));

export const pathPlanningTestingTask = defineTask('path-planning-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Path Planning Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test in complex environments', context: args, instructions: ['1. Test in narrow passages', '2. Test with dynamic obstacles', '3. Test long-range planning', '4. Measure success rate', '5. Generate test report'] },
    outputSchema: { type: 'object', required: ['testResults', 'successRate', 'artifacts'], properties: { testResults: { type: 'array' }, successRate: { type: 'number' }, failureCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'testing']
}));

export const pathPlanningPerformanceTask = defineTask('path-planning-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planning Performance - ${args.robotName}`,
  agent: {
    name: 'simulation-optimization-expert',  // AG-009: Simulation Optimization Expert Agent
    prompt: { role: 'Performance Engineer', task: 'Measure planning time and path quality', context: args, instructions: ['1. Measure planning time', '2. Evaluate path length', '3. Measure smoothness', '4. Profile memory usage', '5. Document metrics'] },
    outputSchema: { type: 'object', required: ['avgPlanningTime', 'pathQuality', 'artifacts'], properties: { avgPlanningTime: { type: 'number' }, pathQuality: { type: 'object' }, memoryUsage: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'performance']
}));

export const pathPlanningOptimizationTask = defineTask('path-planning-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planning Optimization - ${args.robotName}`,
  agent: {
    name: 'simulation-optimization-expert',  // AG-009: Simulation Optimization Expert Agent
    prompt: { role: 'Performance Engineer', task: 'Optimize computational performance', context: args, instructions: ['1. Optimize search algorithm', '2. Add caching', '3. Configure multi-threading', '4. Reduce memory allocations', '5. Benchmark improvements'] },
    outputSchema: { type: 'object', required: ['optimizations', 'speedup', 'artifacts'], properties: { optimizations: { type: 'array' }, speedup: { type: 'number' }, newPlanningTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'path-planning', 'optimization']
}));

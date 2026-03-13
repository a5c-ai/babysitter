/**
 * @process specializations/robotics-simulation/trajectory-optimization
 * @description Trajectory Optimization - Implement trajectory optimization for smooth and efficient robot
 * motion including cost function design, constraint formulation, solver implementation, and feasibility
 * validation.
 * @inputs { robotName: string, optimizationType?: string, constraints?: array, outputDir?: string }
 * @outputs { success: boolean, trajectoryConfig: object, optimizationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/trajectory-optimization', {
 *   robotName: 'robot_arm',
 *   optimizationType: 'time-optimal',
 *   constraints: ['velocity', 'acceleration', 'jerk', 'collision']
 * });
 *
 * @references
 * - TrajOpt: http://rll.berkeley.edu/trajopt/
 * - CHOMP: https://github.com/ros-planning/moveit/tree/master/moveit_planners/chomp
 * - STOMP: https://ros-planning.github.io/moveit_tutorials/doc/stomp_planner/stomp_planner_tutorial.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    optimizationType = 'smoothness',
    constraints = ['velocity', 'acceleration', 'collision'],
    outputDir = 'trajectory-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Trajectory Optimization for ${robotName}`);

  const formulation = await ctx.task(trajectoryFormulationTask, { robotName, optimizationType, outputDir });
  artifacts.push(...formulation.artifacts);

  const costFunction = await ctx.task(costFunctionDesignTask, { robotName, optimizationType, formulation, outputDir });
  artifacts.push(...costFunction.artifacts);

  const constraintSetup = await ctx.task(trajectoryConstraintsTask, { robotName, constraints, formulation, outputDir });
  artifacts.push(...constraintSetup.artifacts);

  const solverImpl = await ctx.task(trajectorySolverTask, { robotName, costFunction, constraintSetup, outputDir });
  artifacts.push(...solverImpl.artifacts);

  const obstacleHandling = await ctx.task(trajectoryObstacleHandlingTask, { robotName, solverImpl, outputDir });
  artifacts.push(...obstacleHandling.artifacts);

  const velocityProfile = await ctx.task(velocityProfileOptimizationTask, { robotName, solverImpl, outputDir });
  artifacts.push(...velocityProfile.artifacts);

  const testing = await ctx.task(trajectoryTestingTask, { robotName, solverImpl, outputDir });
  artifacts.push(...testing.artifacts);

  const feasibilityValidation = await ctx.task(feasibilityValidationTask, { robotName, testing, outputDir });
  artifacts.push(...feasibilityValidation.artifacts);

  const qualityMetrics = await ctx.task(trajectoryQualityMetricsTask, { robotName, testing, feasibilityValidation, outputDir });
  artifacts.push(...qualityMetrics.artifacts);

  await ctx.breakpoint({
    question: `Trajectory Optimization Complete for ${robotName}. Smoothness: ${qualityMetrics.smoothness}, Feasibility: ${feasibilityValidation.feasible}. Review?`,
    title: 'Trajectory Optimization Complete',
    context: { runId: ctx.runId, smoothness: qualityMetrics.smoothness, feasible: feasibilityValidation.feasible }
  });

  return {
    success: feasibilityValidation.feasible && qualityMetrics.meetsRequirements,
    robotName,
    trajectoryConfig: { solver: solverImpl.solver, costWeights: costFunction.weights },
    optimizationResults: { smoothness: qualityMetrics.smoothness, executionTime: qualityMetrics.executionTime },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/trajectory-optimization', timestamp: startTime, outputDir }
  };
}

export const trajectoryFormulationTask = defineTask('trajectory-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Formulation - ${args.robotName}`,
  agent: {
    name: 'control-engineer',
    prompt: { role: 'Control Engineer', task: 'Formulate trajectory optimization problem', context: args, instructions: ['1. Define trajectory representation', '2. Choose parameterization (splines, waypoints)', '3. Define optimization variables', '4. Set boundary conditions', '5. Document formulation'] },
    outputSchema: { type: 'object', required: ['representation', 'variables', 'artifacts'], properties: { representation: { type: 'string' }, variables: { type: 'array' }, parameterization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'formulation']
}));

export const costFunctionDesignTask = defineTask('cost-function-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Function Design - ${args.robotName}`,
  agent: {
    name: 'control-engineer',
    prompt: { role: 'Control Engineer', task: 'Design cost function', context: args, instructions: ['1. Define smoothness cost', '2. Add time cost', '3. Add energy cost', '4. Set cost weights', '5. Test cost function'] },
    outputSchema: { type: 'object', required: ['costFunction', 'weights', 'artifacts'], properties: { costFunction: { type: 'object' }, weights: { type: 'object' }, components: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'cost-function']
}));

export const trajectoryConstraintsTask = defineTask('trajectory-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Constraints - ${args.robotName}`,
  agent: {
    name: 'control-engineer',
    prompt: { role: 'Control Engineer', task: 'Add kinematic and dynamic constraints', context: args, instructions: ['1. Add velocity constraints', '2. Add acceleration constraints', '3. Add jerk limits', '4. Add joint limits', '5. Formulate constraint functions'] },
    outputSchema: { type: 'object', required: ['constraints', 'limits', 'artifacts'], properties: { constraints: { type: 'array' }, limits: { type: 'object' }, constraintMargins: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'constraints']
}));

export const trajectorySolverTask = defineTask('trajectory-solver', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Solver - ${args.robotName}`,
  agent: {
    name: 'control-engineer',
    prompt: { role: 'Control Engineer', task: 'Implement optimization solver', context: args, instructions: ['1. Select solver (TrajOpt, CHOMP, STOMP)', '2. Configure solver parameters', '3. Implement initialization', '4. Add convergence criteria', '5. Test solver'] },
    outputSchema: { type: 'object', required: ['solver', 'solverConfig', 'artifacts'], properties: { solver: { type: 'string' }, solverConfig: { type: 'object' }, convergenceCriteria: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'solver']
}));

export const trajectoryObstacleHandlingTask = defineTask('trajectory-obstacle-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Obstacle Handling - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Handle obstacles and collision avoidance', context: args, instructions: ['1. Add collision cost', '2. Configure signed distance fields', '3. Set safety margins', '4. Handle self-collision', '5. Test collision avoidance'] },
    outputSchema: { type: 'object', required: ['collisionConfig', 'safetyMargins', 'artifacts'], properties: { collisionConfig: { type: 'object' }, safetyMargins: { type: 'object' }, sdfConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'collision']
}));

export const velocityProfileOptimizationTask = defineTask('velocity-profile-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Velocity Profile - ${args.robotName}`,
  agent: {
    name: 'control-engineer',
    prompt: { role: 'Control Engineer', task: 'Optimize trajectory timing and velocity profiles', context: args, instructions: ['1. Compute time-optimal profile', '2. Apply velocity scaling', '3. Smooth velocity transitions', '4. Respect dynamics limits', '5. Validate profiles'] },
    outputSchema: { type: 'object', required: ['velocityProfile', 'executionTime', 'artifacts'], properties: { velocityProfile: { type: 'object' }, executionTime: { type: 'number' }, peakVelocity: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'velocity']
}));

export const trajectoryTestingTask = defineTask('trajectory-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test on complex motion scenarios', context: args, instructions: ['1. Test point-to-point motions', '2. Test via-point trajectories', '3. Test in cluttered environments', '4. Measure optimization time', '5. Evaluate trajectory quality'] },
    outputSchema: { type: 'object', required: ['testResults', 'optimizationTime', 'artifacts'], properties: { testResults: { type: 'array' }, optimizationTime: { type: 'number' }, successRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'testing']
}));

export const feasibilityValidationTask = defineTask('feasibility-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feasibility Validation - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Validate feasibility on physical robot', context: args, instructions: ['1. Check kinematic feasibility', '2. Verify dynamics limits', '3. Test on simulator', '4. Validate on hardware', '5. Document feasibility'] },
    outputSchema: { type: 'object', required: ['feasible', 'validationResults', 'artifacts'], properties: { feasible: { type: 'boolean' }, validationResults: { type: 'object' }, constraintViolations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'feasibility']
}));

export const trajectoryQualityMetricsTask = defineTask('trajectory-quality-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Metrics - ${args.robotName}`,
  agent: {
    name: 'motion-planning-expert',  // AG-016: Motion Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Measure trajectory quality metrics', context: args, instructions: ['1. Compute smoothness metric', '2. Measure path length', '3. Compute energy consumption', '4. Measure execution time', '5. Generate quality report'] },
    outputSchema: { type: 'object', required: ['smoothness', 'executionTime', 'meetsRequirements', 'artifacts'], properties: { smoothness: { type: 'number' }, executionTime: { type: 'number' }, pathLength: { type: 'number' }, energy: { type: 'number' }, meetsRequirements: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'trajectory-optimization', 'quality']
}));

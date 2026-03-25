/**
 * @process specializations/robotics-simulation/mpc-controller-design
 * @description MPC Controller Design - Design and implement Model Predictive Control for robot trajectory
 * tracking including model derivation, optimization formulation, constraint handling, solver selection,
 * and real-time validation.
 * @inputs { robotName: string, robotType?: string, controlObjective?: string, outputDir?: string }
 * @outputs { success: boolean, mpcConfig: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/mpc-controller-design', {
 *   robotName: 'mobile_robot',
 *   robotType: 'differential-drive',
 *   controlObjective: 'trajectory-tracking'
 * });
 *
 * @references
 * - CasADi: https://web.casadi.org/
 * - ACADO: https://acado.github.io/
 * - CVXPY: https://cvxpy.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    robotType = 'differential-drive',
    controlObjective = 'trajectory-tracking',
    outputDir = 'mpc-controller-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MPC Controller Design for ${robotName}`);

  // Phase 1: Model Derivation
  const modelDerivation = await ctx.task(robotModelDerivationTask, { robotName, robotType, outputDir });
  artifacts.push(...modelDerivation.artifacts);

  // Phase 2: MPC Formulation
  const mpcFormulation = await ctx.task(mpcFormulationTask, { robotName, controlObjective, modelDerivation, outputDir });
  artifacts.push(...mpcFormulation.artifacts);

  // Phase 3: Solver Implementation
  const solverImpl = await ctx.task(mpcSolverImplementationTask, { robotName, mpcFormulation, outputDir });
  artifacts.push(...solverImpl.artifacts);

  // Phase 4: Parameter Tuning
  const parameterTuning = await ctx.task(mpcParameterTuningTask, { robotName, mpcFormulation, outputDir });
  artifacts.push(...parameterTuning.artifacts);

  // Phase 5: Constraint Handling
  const constraintHandling = await ctx.task(mpcConstraintHandlingTask, { robotName, robotType, mpcFormulation, outputDir });
  artifacts.push(...constraintHandling.artifacts);

  // Phase 6: Tracking Performance
  const trackingPerformance = await ctx.task(trajectoryTrackingTestTask, { robotName, parameterTuning, outputDir });
  artifacts.push(...trackingPerformance.artifacts);

  // Phase 7: Simulation Validation
  const simValidation = await ctx.task(mpcSimulationValidationTask, { robotName, trackingPerformance, outputDir });
  artifacts.push(...simValidation.artifacts);

  // Phase 8: Real-Time Optimization
  const realTimeOptimization = await ctx.task(mpcRealTimeOptimizationTask, { robotName, solverImpl, outputDir });
  artifacts.push(...realTimeOptimization.artifacts);

  // Phase 9: Baseline Comparison
  const comparison = await ctx.task(mpcBaselineComparisonTask, { robotName, trackingPerformance, outputDir });
  artifacts.push(...comparison.artifacts);

  await ctx.breakpoint({
    question: `MPC Controller Complete for ${robotName}. Tracking error: ${trackingPerformance.trackingError}m, Solver time: ${realTimeOptimization.solverTime}ms. Review?`,
    title: 'MPC Controller Complete',
    context: { runId: ctx.runId, trackingError: trackingPerformance.trackingError, solverTime: realTimeOptimization.solverTime }
  });

  return {
    success: trackingPerformance.trackingError < 0.1 && realTimeOptimization.realTimeCapable,
    robotName,
    mpcConfig: { predictionHorizon: parameterTuning.predictionHorizon, weights: parameterTuning.weights, configPath: parameterTuning.configPath },
    performanceMetrics: { trackingError: trackingPerformance.trackingError, solverTime: realTimeOptimization.solverTime, controlEffort: trackingPerformance.controlEffort },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/mpc-controller-design', timestamp: startTime, outputDir }
  };
}

export const robotModelDerivationTask = defineTask('robot-model-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Robot Model Derivation - ${args.robotName}`,
  agent: {
    name: 'control-systems-expert',  // AG-003: Control Systems Expert Agent
    prompt: { role: 'Control Engineer', task: 'Derive robot kinematic or dynamic model', context: args, instructions: ['1. Define state vector', '2. Derive kinematics', '3. Add dynamics if needed', '4. Discretize model', '5. Validate model accuracy'] },
    outputSchema: { type: 'object', required: ['stateSpace', 'discretization', 'artifacts'], properties: { stateSpace: { type: 'object' }, discretization: { type: 'object' }, stateVector: { type: 'array' }, controlVector: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'modeling']
}));

export const mpcFormulationTask = defineTask('mpc-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `MPC Formulation - ${args.robotName}`,
  agent: {
    name: 'control-systems-expert',  // AG-003: Control Systems Expert Agent
    prompt: { role: 'Control Engineer', task: 'Formulate MPC optimization problem', context: args, instructions: ['1. Define cost function', '2. Set state weights', '3. Set control weights', '4. Define terminal cost', '5. Add constraint formulations'] },
    outputSchema: { type: 'object', required: ['costFunction', 'constraints', 'artifacts'], properties: { costFunction: { type: 'object' }, constraints: { type: 'array' }, stateWeights: { type: 'array' }, controlWeights: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'formulation']
}));

export const mpcSolverImplementationTask = defineTask('mpc-solver-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `MPC Solver Implementation - ${args.robotName}`,
  agent: {
    name: 'control-systems-expert',  // AG-003: Control Systems Expert Agent
    prompt: { role: 'Control Engineer', task: 'Implement MPC solver', context: args, instructions: ['1. Select solver (CasADi, ACADO, CVXPY)', '2. Configure solver settings', '3. Implement warm starting', '4. Add solver diagnostics', '5. Test solver convergence'] },
    outputSchema: { type: 'object', required: ['solver', 'solverConfig', 'artifacts'], properties: { solver: { type: 'string' }, solverConfig: { type: 'object' }, warmStarting: { type: 'boolean' }, convergenceCriteria: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'solver']
}));

export const mpcParameterTuningTask = defineTask('mpc-parameter-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `MPC Parameter Tuning - ${args.robotName}`,
  agent: {
    name: 'control-systems-expert',  // AG-003: Control Systems Expert Agent
    prompt: { role: 'Control Engineer', task: 'Tune MPC parameters', context: args, instructions: ['1. Tune prediction horizon', '2. Tune state weights Q', '3. Tune control weights R', '4. Set control horizon', '5. Validate tuning'] },
    outputSchema: { type: 'object', required: ['predictionHorizon', 'weights', 'configPath', 'artifacts'], properties: { predictionHorizon: { type: 'number' }, weights: { type: 'object' }, controlHorizon: { type: 'number' }, configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'tuning']
}));

export const mpcConstraintHandlingTask = defineTask('mpc-constraint-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Constraint Handling - ${args.robotName}`,
  agent: {
    name: 'control-systems-expert',  // AG-003: Control Systems Expert Agent
    prompt: { role: 'Control Engineer', task: 'Add constraint handling', context: args, instructions: ['1. Add velocity limits', '2. Add acceleration limits', '3. Add collision avoidance', '4. Add actuator limits', '5. Test constraint satisfaction'] },
    outputSchema: { type: 'object', required: ['constraints', 'softConstraints', 'artifacts'], properties: { constraints: { type: 'array' }, softConstraints: { type: 'array' }, velocityLimits: { type: 'object' }, accelerationLimits: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'constraints']
}));

export const trajectoryTrackingTestTask = defineTask('trajectory-tracking-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Tracking Test - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test tracking performance on reference trajectories', context: args, instructions: ['1. Test straight line tracking', '2. Test curve tracking', '3. Test varying speed profiles', '4. Measure tracking error', '5. Measure control effort'] },
    outputSchema: { type: 'object', required: ['trackingError', 'controlEffort', 'artifacts'], properties: { trackingError: { type: 'number' }, controlEffort: { type: 'number' }, trajectoryTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'tracking']
}));

export const mpcSimulationValidationTask = defineTask('mpc-simulation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Simulation Validation - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Validate in simulation and hardware', context: args, instructions: ['1. Test in Gazebo simulation', '2. Test with model uncertainty', '3. Test disturbance rejection', '4. Validate on hardware', '5. Document validation results'] },
    outputSchema: { type: 'object', required: ['simResults', 'hardwareResults', 'artifacts'], properties: { simResults: { type: 'object' }, hardwareResults: { type: 'object' }, robustness: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'validation']
}));

export const mpcRealTimeOptimizationTask = defineTask('mpc-real-time-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Real-Time Optimization - ${args.robotName}`,
  agent: {
    name: 'simulation-optimization-expert',  // AG-009: Simulation Optimization Expert Agent
    prompt: { role: 'Performance Engineer', task: 'Optimize solver runtime for real-time execution', context: args, instructions: ['1. Profile solver time', '2. Reduce horizon if needed', '3. Optimize code generation', '4. Add parallel computation', '5. Verify real-time capability'] },
    outputSchema: { type: 'object', required: ['solverTime', 'realTimeCapable', 'artifacts'], properties: { solverTime: { type: 'number' }, realTimeCapable: { type: 'boolean' }, optimizations: { type: 'array' }, controlRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'real-time']
}));

export const mpcBaselineComparisonTask = defineTask('mpc-baseline-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Baseline Comparison - ${args.robotName}`,
  agent: {
    name: 'control-systems-expert',  // AG-003: Control Systems Expert Agent
    prompt: { role: 'Control Engineer', task: 'Compare with baseline controllers', context: args, instructions: ['1. Compare with PID controller', '2. Compare with LQR', '3. Measure performance improvement', '4. Document trade-offs', '5. Generate comparison report'] },
    outputSchema: { type: 'object', required: ['comparison', 'improvement', 'artifacts'], properties: { comparison: { type: 'object' }, improvement: { type: 'object' }, tradeoffs: { type: 'array' }, recommendation: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'mpc', 'comparison']
}));

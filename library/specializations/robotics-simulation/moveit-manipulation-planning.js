/**
 * @process specializations/robotics-simulation/moveit-manipulation-planning
 * @description Manipulation Planning with MoveIt - Configure MoveIt for robotic arm motion planning and
 * manipulation including setup, kinematics configuration, collision checking, grasp planning, and
 * pick-and-place operations.
 * @inputs { robotName: string, robotDescription?: string, endEffector?: string, outputDir?: string }
 * @outputs { success: boolean, moveitConfig: object, graspPlanningConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/moveit-manipulation-planning', {
 *   robotName: 'ur5_arm',
 *   robotDescription: 'ur5.urdf',
 *   endEffector: 'gripper'
 * });
 *
 * @references
 * - MoveIt: https://moveit.ros.org/
 * - MoveIt Tutorials: https://ros-planning.github.io/moveit_tutorials/
 * - MoveIt2: https://github.com/ros-planning/moveit2
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    robotDescription = '',
    endEffector = 'gripper',
    outputDir = 'moveit-config-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MoveIt Configuration for ${robotName}`);

  // Phase 1: MoveIt Setup
  const moveitSetup = await ctx.task(moveitSetupTask, { robotName, robotDescription, outputDir });
  artifacts.push(...moveitSetup.artifacts);

  // Phase 2: Kinematics Configuration
  const kinematicsConfig = await ctx.task(kinematicsConfigurationTask, { robotName, moveitSetup, outputDir });
  artifacts.push(...kinematicsConfig.artifacts);

  // Phase 3: Planning Groups
  const planningGroups = await ctx.task(planningGroupsConfigTask, { robotName, endEffector, moveitSetup, outputDir });
  artifacts.push(...planningGroups.artifacts);

  // Phase 4: Collision Checking
  const collisionChecking = await ctx.task(collisionCheckingSetupTask, { robotName, moveitSetup, outputDir });
  artifacts.push(...collisionChecking.artifacts);

  // Phase 5: Motion Planning Pipeline
  const motionPlanning = await ctx.task(motionPlanningPipelineTask, { robotName, kinematicsConfig, outputDir });
  artifacts.push(...motionPlanning.artifacts);

  // Phase 6: Grasp Planning
  const graspPlanning = await ctx.task(graspPlanningSetupTask, { robotName, endEffector, outputDir });
  artifacts.push(...graspPlanning.artifacts);

  // Phase 7: Perception Integration
  const perceptionIntegration = await ctx.task(perceptionIntegrationTask, { robotName, graspPlanning, outputDir });
  artifacts.push(...perceptionIntegration.artifacts);

  // Phase 8: Pick and Place Testing
  const pickPlaceTest = await ctx.task(pickPlaceTestingTask, { robotName, graspPlanning, perceptionIntegration, outputDir });
  artifacts.push(...pickPlaceTest.artifacts);

  // Phase 9: Parameter Tuning
  const tuning = await ctx.task(moveitParameterTuningTask, { robotName, pickPlaceTest, outputDir });
  artifacts.push(...tuning.artifacts);

  await ctx.breakpoint({
    question: `MoveIt Configuration Complete for ${robotName}. Pick success rate: ${pickPlaceTest.successRate}%. Review?`,
    title: 'MoveIt Configuration Complete',
    context: { runId: ctx.runId, successRate: pickPlaceTest.successRate }
  });

  return {
    success: pickPlaceTest.successRate >= 90,
    robotName,
    moveitConfig: { configPackage: moveitSetup.configPackage, planners: motionPlanning.planners },
    graspPlanningConfig: graspPlanning.graspConfig,
    performanceMetrics: { planningTime: tuning.avgPlanningTime, successRate: pickPlaceTest.successRate },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/moveit-manipulation-planning', timestamp: startTime, outputDir }
  };
}

export const moveitSetupTask = defineTask('moveit-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `MoveIt Setup - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Set up MoveIt configuration package', context: args, instructions: ['1. Run MoveIt Setup Assistant', '2. Configure SRDF', '3. Set up joint limits', '4. Generate config package', '5. Test basic launch'] },
    outputSchema: { type: 'object', required: ['configPackage', 'srdfPath', 'artifacts'], properties: { configPackage: { type: 'string' }, srdfPath: { type: 'string' }, jointLimits: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'setup']
}));

export const kinematicsConfigurationTask = defineTask('kinematics-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kinematics Configuration - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure robot kinematics', context: args, instructions: ['1. Select IK solver (KDL, IKFast, TracIK)', '2. Configure solver parameters', '3. Set timeout values', '4. Test IK accuracy', '5. Document kinematics config'] },
    outputSchema: { type: 'object', required: ['ikSolver', 'kinematicsConfig', 'artifacts'], properties: { ikSolver: { type: 'string' }, kinematicsConfig: { type: 'object' }, solverAccuracy: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'kinematics']
}));

export const planningGroupsConfigTask = defineTask('planning-groups-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planning Groups - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Define planning groups and end effectors', context: args, instructions: ['1. Define arm planning group', '2. Define end effector group', '3. Configure group states', '4. Set up named poses', '5. Validate groups'] },
    outputSchema: { type: 'object', required: ['planningGroups', 'endEffectors', 'artifacts'], properties: { planningGroups: { type: 'array' }, endEffectors: { type: 'array' }, namedPoses: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'planning-groups']
}));

export const collisionCheckingSetupTask = defineTask('collision-checking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collision Checking - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Set up collision checking', context: args, instructions: ['1. Configure ACM matrix', '2. Add collision objects', '3. Set up scene monitoring', '4. Configure padding', '5. Test collision detection'] },
    outputSchema: { type: 'object', required: ['acmConfig', 'collisionPadding', 'artifacts'], properties: { acmConfig: { type: 'object' }, collisionPadding: { type: 'number' }, sceneConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'collision']
}));

export const motionPlanningPipelineTask = defineTask('motion-planning-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Motion Planning Pipeline - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure motion planning pipeline', context: args, instructions: ['1. Configure OMPL planners', '2. Set planner parameters', '3. Add planning adapters', '4. Configure trajectory processing', '5. Test planning pipeline'] },
    outputSchema: { type: 'object', required: ['planners', 'pipelineConfig', 'artifacts'], properties: { planners: { type: 'array' }, pipelineConfig: { type: 'object' }, adapters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'planning-pipeline']
}));

export const graspPlanningSetupTask = defineTask('grasp-planning-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Grasp Planning - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement grasp planning', context: args, instructions: ['1. Configure grasp generator', '2. Define grasp poses', '3. Set approach/retreat vectors', '4. Configure gripper actions', '5. Test grasp generation'] },
    outputSchema: { type: 'object', required: ['graspConfig', 'graspPoses', 'artifacts'], properties: { graspConfig: { type: 'object' }, graspPoses: { type: 'array' }, approachConfig: { type: 'object' }, gripperConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'grasp-planning']
}));

export const perceptionIntegrationTask = defineTask('perception-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Perception Integration - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Add perception integration for object pose estimation', context: args, instructions: ['1. Configure octomap server', '2. Add object recognition', '3. Estimate object poses', '4. Update planning scene', '5. Test perception pipeline'] },
    outputSchema: { type: 'object', required: ['perceptionConfig', 'octomapConfig', 'artifacts'], properties: { perceptionConfig: { type: 'object' }, octomapConfig: { type: 'object' }, objectRecognition: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'perception']
}));

export const pickPlaceTestingTask = defineTask('pick-place-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pick and Place Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test pick-and-place operations', context: args, instructions: ['1. Test single object picking', '2. Test placing accuracy', '3. Test with different objects', '4. Test in cluttered scenes', '5. Measure success rate'] },
    outputSchema: { type: 'object', required: ['successRate', 'testResults', 'artifacts'], properties: { successRate: { type: 'number' }, testResults: { type: 'array' }, pickAccuracy: { type: 'number' }, placeAccuracy: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'pick-place']
}));

export const moveitParameterTuningTask = defineTask('moveit-parameter-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parameter Tuning - ${args.robotName}`,
  agent: {
    name: 'manipulation-expert',  // AG-018: Manipulation Planning Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Tune planning parameters for success rate and speed', context: args, instructions: ['1. Tune planner timeout', '2. Adjust goal tolerances', '3. Optimize trajectory smoothing', '4. Balance speed vs reliability', '5. Document final parameters'] },
    outputSchema: { type: 'object', required: ['tunedParameters', 'avgPlanningTime', 'artifacts'], properties: { tunedParameters: { type: 'object' }, avgPlanningTime: { type: 'number' }, successRateImprovement: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'moveit', 'tuning']
}));

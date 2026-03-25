/**
 * @process specializations/robotics-simulation/nav2-navigation-setup
 * @description Nav2 Navigation Stack Setup - Configure ROS 2 Nav2 for autonomous mobile robot navigation
 * including behavior trees, costmap configuration, planner setup, recovery behaviors, and waypoint following.
 * @inputs { robotName: string, robotType?: string, mapType?: string, outputDir?: string }
 * @outputs { success: boolean, nav2Config: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/nav2-navigation-setup', {
 *   robotName: 'mobile_robot',
 *   robotType: 'differential-drive',
 *   mapType: 'static'
 * });
 *
 * @references
 * - Nav2: https://navigation.ros.org/
 * - Navigation2 GitHub: https://github.com/ros-planning/navigation2
 * - Nav2 Tutorials: https://docs.nav2.org/tutorials/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    robotType = 'differential-drive',
    mapType = 'static',
    outputDir = 'nav2-config-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Nav2 Navigation Setup for ${robotName}`);

  const nav2Setup = await ctx.task(nav2StackSetupTask, { robotName, robotType, outputDir });
  artifacts.push(...nav2Setup.artifacts);

  const behaviorTree = await ctx.task(behaviorTreeConfigTask, { robotName, nav2Setup, outputDir });
  artifacts.push(...behaviorTree.artifacts);

  const costmapConfig = await ctx.task(nav2CostmapConfigTask, { robotName, mapType, outputDir });
  artifacts.push(...costmapConfig.artifacts);

  const plannerConfig = await ctx.task(nav2PlannerConfigTask, { robotName, robotType, costmapConfig, outputDir });
  artifacts.push(...plannerConfig.artifacts);

  const recoveryBehaviors = await ctx.task(recoveryBehaviorsTask, { robotName, nav2Setup, outputDir });
  artifacts.push(...recoveryBehaviors.artifacts);

  const waypointFollowing = await ctx.task(waypointFollowingTask, { robotName, plannerConfig, outputDir });
  artifacts.push(...waypointFollowing.artifacts);

  const dynamicAvoidance = await ctx.task(nav2DynamicAvoidanceTask, { robotName, plannerConfig, outputDir });
  artifacts.push(...dynamicAvoidance.artifacts);

  const testing = await ctx.task(nav2TestingTask, { robotName, nav2Setup, outputDir });
  artifacts.push(...testing.artifacts);

  const tuning = await ctx.task(nav2ParameterTuningTask, { robotName, testing, outputDir });
  artifacts.push(...tuning.artifacts);

  await ctx.breakpoint({
    question: `Nav2 Setup Complete for ${robotName}. Navigation success rate: ${testing.successRate}%. Review?`,
    title: 'Nav2 Setup Complete',
    context: { runId: ctx.runId, successRate: testing.successRate }
  });

  return {
    success: testing.successRate >= 95,
    robotName,
    nav2Config: { configPath: nav2Setup.configPath, behaviorTree: behaviorTree.btPath },
    performanceMetrics: { successRate: testing.successRate, avgNavTime: tuning.avgNavTime },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/nav2-navigation-setup', timestamp: startTime, outputDir }
  };
}

export const nav2StackSetupTask = defineTask('nav2-stack-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nav2 Stack Setup - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Set up Nav2 navigation stack', context: args, instructions: ['1. Install Nav2 packages', '2. Configure robot transforms', '3. Set up map server', '4. Configure AMCL localization', '5. Create launch files'] },
    outputSchema: { type: 'object', required: ['configPath', 'launchFile', 'artifacts'], properties: { configPath: { type: 'string' }, launchFile: { type: 'string' }, transforms: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'setup']
}));

export const behaviorTreeConfigTask = defineTask('behavior-tree-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Behavior Tree Config - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure behavior trees for navigation logic', context: args, instructions: ['1. Design navigation behavior tree', '2. Add planning subtrees', '3. Add recovery subtrees', '4. Configure BT plugins', '5. Test behavior tree'] },
    outputSchema: { type: 'object', required: ['btPath', 'btPlugins', 'artifacts'], properties: { btPath: { type: 'string' }, btPlugins: { type: 'array' }, subtrees: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'behavior-tree']
}));

export const nav2CostmapConfigTask = defineTask('nav2-costmap-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Costmap Config - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement costmap layers', context: args, instructions: ['1. Configure static layer', '2. Add obstacle layer', '3. Configure inflation layer', '4. Set up voxel layer for 3D', '5. Tune costmap parameters'] },
    outputSchema: { type: 'object', required: ['globalCostmap', 'localCostmap', 'artifacts'], properties: { globalCostmap: { type: 'object' }, localCostmap: { type: 'object' }, layers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'costmap']
}));

export const nav2PlannerConfigTask = defineTask('nav2-planner-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planner Config - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure local and global planners', context: args, instructions: ['1. Configure NavFn global planner', '2. Set up DWB local planner', '3. Configure controller parameters', '4. Set velocity constraints', '5. Test planning pipeline'] },
    outputSchema: { type: 'object', required: ['globalPlanner', 'localPlanner', 'artifacts'], properties: { globalPlanner: { type: 'object' }, localPlanner: { type: 'object' }, controllerParams: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'planner']
}));

export const recoveryBehaviorsTask = defineTask('recovery-behaviors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recovery Behaviors - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Set up recovery behaviors', context: args, instructions: ['1. Configure spin recovery', '2. Add backup recovery', '3. Configure clear costmap', '4. Add wait behavior', '5. Test recovery sequence'] },
    outputSchema: { type: 'object', required: ['recoveryPlugins', 'recoverySequence', 'artifacts'], properties: { recoveryPlugins: { type: 'array' }, recoverySequence: { type: 'array' }, recoveryParams: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'recovery']
}));

export const waypointFollowingTask = defineTask('waypoint-following', (args, taskCtx) => ({
  kind: 'agent',
  title: `Waypoint Following - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement waypoint following', context: args, instructions: ['1. Configure waypoint follower', '2. Set waypoint tolerance', '3. Add waypoint task executor', '4. Configure goal checker', '5. Test multi-waypoint navigation'] },
    outputSchema: { type: 'object', required: ['waypointConfig', 'goalChecker', 'artifacts'], properties: { waypointConfig: { type: 'object' }, goalChecker: { type: 'object' }, waypointTolerance: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'waypoint']
}));

export const nav2DynamicAvoidanceTask = defineTask('nav2-dynamic-avoidance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dynamic Avoidance - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Add dynamic obstacle avoidance', context: args, instructions: ['1. Configure obstacle tracking', '2. Set up dynamic layer', '3. Configure velocity obstacles', '4. Tune avoidance parameters', '5. Test with moving obstacles'] },
    outputSchema: { type: 'object', required: ['dynamicConfig', 'trackingConfig', 'artifacts'], properties: { dynamicConfig: { type: 'object' }, trackingConfig: { type: 'object' }, velocityObstacles: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'dynamic-avoidance']
}));

export const nav2TestingTask = defineTask('nav2-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nav2 Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test in simulation and real environments', context: args, instructions: ['1. Test point-to-point navigation', '2. Test waypoint sequences', '3. Test recovery behaviors', '4. Test in cluttered environment', '5. Measure success rate'] },
    outputSchema: { type: 'object', required: ['successRate', 'testResults', 'artifacts'], properties: { successRate: { type: 'number' }, testResults: { type: 'array' }, failureCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'testing']
}));

export const nav2ParameterTuningTask = defineTask('nav2-parameter-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parameter Tuning - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Tune parameters for optimal navigation', context: args, instructions: ['1. Tune planner parameters', '2. Tune controller gains', '3. Optimize costmap settings', '4. Balance speed vs safety', '5. Document final parameters'] },
    outputSchema: { type: 'object', required: ['tunedParams', 'avgNavTime', 'artifacts'], properties: { tunedParams: { type: 'object' }, avgNavTime: { type: 'number' }, improvements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'nav2', 'tuning']
}));

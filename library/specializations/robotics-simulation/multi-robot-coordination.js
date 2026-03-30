/**
 * @process specializations/robotics-simulation/multi-robot-coordination
 * @description Multi-Robot Coordination - Implement coordination systems for multiple robots including
 * task allocation, formation control, collision avoidance, communication protocols, and fleet management.
 * @inputs { fleetName: string, robotCount?: number, coordinationType?: string, outputDir?: string }
 * @outputs { success: boolean, coordinationConfig: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/multi-robot-coordination', {
 *   fleetName: 'warehouse_fleet',
 *   robotCount: 10,
 *   coordinationType: 'decentralized'
 * });
 *
 * @references
 * - Multi-Robot Systems: https://www.springer.com/gp/book/9783319388267
 * - Task Allocation: https://robotics.cs.rutgers.edu/AAMAS-2018-Tutorial/Slides/
 * - ROS Multi-Robot: http://wiki.ros.org/multimaster_fkie
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fleetName,
    robotCount = 5,
    coordinationType = 'decentralized',
    outputDir = 'multi-robot-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-Robot Coordination for ${fleetName}`);

  const communicationSetup = await ctx.task(robotCommunicationSetupTask, { fleetName, robotCount, coordinationType, outputDir });
  artifacts.push(...communicationSetup.artifacts);

  const taskAllocation = await ctx.task(taskAllocationSystemTask, { fleetName, robotCount, coordinationType, outputDir });
  artifacts.push(...taskAllocation.artifacts);

  const formationControl = await ctx.task(formationControlTask, { fleetName, robotCount, outputDir });
  artifacts.push(...formationControl.artifacts);

  const collisionAvoidance = await ctx.task(multiRobotCollisionAvoidanceTask, { fleetName, robotCount, outputDir });
  artifacts.push(...collisionAvoidance.artifacts);

  const pathCoordination = await ctx.task(pathCoordinationTask, { fleetName, robotCount, collisionAvoidance, outputDir });
  artifacts.push(...pathCoordination.artifacts);

  const consensusAlgorithms = await ctx.task(consensusAlgorithmsTask, { fleetName, coordinationType, outputDir });
  artifacts.push(...consensusAlgorithms.artifacts);

  const trafficManagement = await ctx.task(trafficManagementTask, { fleetName, pathCoordination, outputDir });
  artifacts.push(...trafficManagement.artifacts);

  const simulationTesting = await ctx.task(multiRobotSimulationTestingTask, { fleetName, robotCount, outputDir });
  artifacts.push(...simulationTesting.artifacts);

  const scalabilityTesting = await ctx.task(scalabilityTestingTask, { fleetName, robotCount, simulationTesting, outputDir });
  artifacts.push(...scalabilityTesting.artifacts);

  await ctx.breakpoint({
    question: `Multi-Robot Coordination Complete for ${fleetName}. Task completion: ${simulationTesting.taskCompletionRate}%, Collision-free: ${collisionAvoidance.collisionFree}. Review?`,
    title: 'Multi-Robot Coordination Complete',
    context: { runId: ctx.runId, taskCompletionRate: simulationTesting.taskCompletionRate, collisionFree: collisionAvoidance.collisionFree }
  });

  return {
    success: simulationTesting.taskCompletionRate >= 95 && collisionAvoidance.collisionFree,
    fleetName,
    coordinationConfig: { type: coordinationType, robotCount, configPath: communicationSetup.configPath },
    performanceMetrics: { taskCompletionRate: simulationTesting.taskCompletionRate, avgTaskTime: simulationTesting.avgTaskTime, throughput: scalabilityTesting.throughput },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/multi-robot-coordination', timestamp: startTime, outputDir }
  };
}

export const robotCommunicationSetupTask = defineTask('robot-communication-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Communication Setup - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Set up robot communication', context: args, instructions: ['1. Configure ROS multi-master', '2. Set up discovery protocol', '3. Configure message routing', '4. Set up shared topics', '5. Test communication'] },
    outputSchema: { type: 'object', required: ['configPath', 'communicationConfig', 'artifacts'], properties: { configPath: { type: 'string' }, communicationConfig: { type: 'object' }, latency: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'communication']
}));

export const taskAllocationSystemTask = defineTask('task-allocation-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Task Allocation - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement task allocation', context: args, instructions: ['1. Implement auction-based allocation', '2. Configure market-based approach', '3. Handle task dependencies', '4. Optimize assignments', '5. Test allocation'] },
    outputSchema: { type: 'object', required: ['allocationAlgorithm', 'efficiency', 'artifacts'], properties: { allocationAlgorithm: { type: 'object' }, efficiency: { type: 'number' }, fairness: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'task-allocation']
}));

export const formationControlTask = defineTask('formation-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Formation Control - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement formation control', context: args, instructions: ['1. Define formation shapes', '2. Implement leader-follower', '3. Add behavior-based control', '4. Handle formation changes', '5. Test formations'] },
    outputSchema: { type: 'object', required: ['formationConfig', 'formations', 'artifacts'], properties: { formationConfig: { type: 'object' }, formations: { type: 'array' }, transitionTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'formation']
}));

export const multiRobotCollisionAvoidanceTask = defineTask('multi-robot-collision-avoidance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collision Avoidance - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement multi-robot collision avoidance', context: args, instructions: ['1. Implement ORCA/RVO', '2. Configure safety distances', '3. Handle deadlocks', '4. Add priority rules', '5. Test avoidance'] },
    outputSchema: { type: 'object', required: ['collisionFree', 'algorithm', 'artifacts'], properties: { collisionFree: { type: 'boolean' }, algorithm: { type: 'string' }, safetyDistance: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'collision-avoidance']
}));

export const pathCoordinationTask = defineTask('path-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Path Coordination - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Coordinate robot paths', context: args, instructions: ['1. Implement CBS planner', '2. Add priority planning', '3. Handle dynamic replanning', '4. Optimize total path cost', '5. Test coordination'] },
    outputSchema: { type: 'object', required: ['planningAlgorithm', 'avgPathLength', 'artifacts'], properties: { planningAlgorithm: { type: 'object' }, avgPathLength: { type: 'number' }, planningTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'path-coordination']
}));

export const consensusAlgorithmsTask = defineTask('consensus-algorithms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consensus Algorithms - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement consensus algorithms', context: args, instructions: ['1. Implement state consensus', '2. Add distributed estimation', '3. Handle network failures', '4. Configure convergence', '5. Test consensus'] },
    outputSchema: { type: 'object', required: ['consensusConfig', 'convergenceTime', 'artifacts'], properties: { consensusConfig: { type: 'object' }, convergenceTime: { type: 'number' }, robustness: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'consensus']
}));

export const trafficManagementTask = defineTask('traffic-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Traffic Management - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Implement traffic management', context: args, instructions: ['1. Define traffic zones', '2. Implement intersection control', '3. Add queue management', '4. Handle congestion', '5. Test traffic flow'] },
    outputSchema: { type: 'object', required: ['trafficConfig', 'throughput', 'artifacts'], properties: { trafficConfig: { type: 'object' }, throughput: { type: 'number' }, avgWaitTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'traffic']
}));

export const multiRobotSimulationTestingTask = defineTask('multi-robot-simulation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Simulation Testing - ${args.fleetName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test multi-robot system in simulation', context: args, instructions: ['1. Run fleet simulations', '2. Test task scenarios', '3. Measure completion rates', '4. Analyze bottlenecks', '5. Generate test report'] },
    outputSchema: { type: 'object', required: ['taskCompletionRate', 'avgTaskTime', 'artifacts'], properties: { taskCompletionRate: { type: 'number' }, avgTaskTime: { type: 'number' }, bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'simulation-testing']
}));

export const scalabilityTestingTask = defineTask('scalability-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scalability Testing - ${args.fleetName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test system scalability', context: args, instructions: ['1. Test with increasing robots', '2. Measure throughput', '3. Identify scaling limits', '4. Analyze performance curves', '5. Document scalability'] },
    outputSchema: { type: 'object', required: ['throughput', 'maxRobots', 'artifacts'], properties: { throughput: { type: 'number' }, maxRobots: { type: 'number' }, scalingCurve: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'multi-robot', 'scalability']
}));

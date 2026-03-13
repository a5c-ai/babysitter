/**
 * @process specializations/robotics-simulation/robot-bring-up-integration
 * @description Robot Bring-Up and Integration Testing - Systematic robot hardware and software bring-up
 * including component verification, subsystem integration, full system testing, and performance validation.
 * @inputs { robotName: string, robotType?: string, bringUpPhase?: string, outputDir?: string }
 * @outputs { success: boolean, bringUpStatus: object, integrationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/robot-bring-up-integration', {
 *   robotName: 'new_robot_platform',
 *   robotType: 'mobile-manipulator',
 *   bringUpPhase: 'full-integration'
 * });
 *
 * @references
 * - Robot Bring-Up: https://docs.ros.org/en/rolling/Tutorials/Intermediate/Tf2/Tf2-Main.html
 * - Integration Testing: https://www.ros.org/reps/rep-0107.html
 * - ROS2 Launch: https://docs.ros.org/en/rolling/Tutorials/Intermediate/Launch/Launch-Main.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    robotType = 'mobile-robot',
    bringUpPhase = 'full-integration',
    outputDir = 'robot-bringup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Robot Bring-Up for ${robotName}`);

  const powerBringUp = await ctx.task(powerSystemBringUpTask, { robotName, robotType, outputDir });
  artifacts.push(...powerBringUp.artifacts);

  const sensorBringUp = await ctx.task(sensorBringUpTask, { robotName, powerBringUp, outputDir });
  artifacts.push(...sensorBringUp.artifacts);

  const actuatorBringUp = await ctx.task(actuatorBringUpTask, { robotName, powerBringUp, outputDir });
  artifacts.push(...actuatorBringUp.artifacts);

  const computeBringUp = await ctx.task(computeSystemBringUpTask, { robotName, powerBringUp, outputDir });
  artifacts.push(...computeBringUp.artifacts);

  const networkConfig = await ctx.task(networkConfigurationTask, { robotName, computeBringUp, outputDir });
  artifacts.push(...networkConfig.artifacts);

  const rosIntegration = await ctx.task(rosBringUpTask, { robotName, sensorBringUp, actuatorBringUp, computeBringUp, outputDir });
  artifacts.push(...rosIntegration.artifacts);

  const subsystemIntegration = await ctx.task(subsystemIntegrationTask, { robotName, rosIntegration, outputDir });
  artifacts.push(...subsystemIntegration.artifacts);

  const fullSystemTest = await ctx.task(fullSystemTestTask, { robotName, subsystemIntegration, outputDir });
  artifacts.push(...fullSystemTest.artifacts);

  const performanceValidation = await ctx.task(performanceValidationTask, { robotName, fullSystemTest, outputDir });
  artifacts.push(...performanceValidation.artifacts);

  await ctx.breakpoint({
    question: `Robot Bring-Up Complete for ${robotName}. All subsystems: ${fullSystemTest.allSubsystemsPassed ? 'PASSED' : 'FAILED'}. Performance: ${performanceValidation.performanceScore}%. Review?`,
    title: 'Robot Bring-Up Complete',
    context: { runId: ctx.runId, subsystemsPassed: fullSystemTest.allSubsystemsPassed, performanceScore: performanceValidation.performanceScore }
  });

  return {
    success: fullSystemTest.allSubsystemsPassed && performanceValidation.performanceScore >= 90,
    robotName,
    bringUpStatus: { phase: bringUpPhase, subsystemStatus: fullSystemTest.subsystemStatus },
    integrationResults: { allPassed: fullSystemTest.allSubsystemsPassed, performanceScore: performanceValidation.performanceScore },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/robot-bring-up-integration', timestamp: startTime, outputDir }
  };
}

export const powerSystemBringUpTask = defineTask('power-system-bringup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Power System Bring-Up - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Bring up power systems', context: args, instructions: ['1. Check battery/power supply', '2. Verify power distribution', '3. Test emergency stop', '4. Validate power monitoring', '5. Document power status'] },
    outputSchema: { type: 'object', required: ['powerStatus', 'voltages', 'artifacts'], properties: { powerStatus: { type: 'object' }, voltages: { type: 'object' }, emergencyStopWorking: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'power']
}));

export const sensorBringUpTask = defineTask('sensor-bringup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensor Bring-Up - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Bring up sensor systems', context: args, instructions: ['1. Connect each sensor', '2. Verify data streams', '3. Check frame rates', '4. Validate data quality', '5. Document sensor status'] },
    outputSchema: { type: 'object', required: ['sensorStatus', 'dataRates', 'artifacts'], properties: { sensorStatus: { type: 'object' }, dataRates: { type: 'object' }, qualityMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'sensors']
}));

export const actuatorBringUpTask = defineTask('actuator-bringup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Actuator Bring-Up - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Bring up actuator systems', context: args, instructions: ['1. Initialize motor controllers', '2. Test each joint/motor', '3. Verify encoder feedback', '4. Check range of motion', '5. Document actuator status'] },
    outputSchema: { type: 'object', required: ['actuatorStatus', 'motorTests', 'artifacts'], properties: { actuatorStatus: { type: 'object' }, motorTests: { type: 'array' }, encoderStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'actuators']
}));

export const computeSystemBringUpTask = defineTask('compute-system-bringup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compute System Bring-Up - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Bring up compute systems', context: args, instructions: ['1. Boot onboard computers', '2. Verify GPU/accelerators', '3. Check memory/storage', '4. Configure real-time kernel', '5. Document compute status'] },
    outputSchema: { type: 'object', required: ['computeStatus', 'systemResources', 'artifacts'], properties: { computeStatus: { type: 'object' }, systemResources: { type: 'object' }, gpuStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'compute']
}));

export const networkConfigurationTask = defineTask('network-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Configuration - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure robot networking', context: args, instructions: ['1. Configure network interfaces', '2. Set up ROS networking', '3. Configure DDS/middleware', '4. Test communication', '5. Document network config'] },
    outputSchema: { type: 'object', required: ['networkConfig', 'interfaces', 'artifacts'], properties: { networkConfig: { type: 'object' }, interfaces: { type: 'array' }, ddsConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'network']
}));

export const rosBringUpTask = defineTask('ros-bringup', (args, taskCtx) => ({
  kind: 'agent',
  title: `ROS Bring-Up - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Bring up ROS nodes and drivers', context: args, instructions: ['1. Launch driver nodes', '2. Verify topic publishing', '3. Check TF tree', '4. Validate services/actions', '5. Document ROS status'] },
    outputSchema: { type: 'object', required: ['rosStatus', 'activeNodes', 'artifacts'], properties: { rosStatus: { type: 'object' }, activeNodes: { type: 'array' }, tfTree: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'ros']
}));

export const subsystemIntegrationTask = defineTask('subsystem-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Subsystem Integration - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Integrate and test subsystems', context: args, instructions: ['1. Test perception pipeline', '2. Test control pipeline', '3. Test navigation stack', '4. Test manipulation stack', '5. Document integration results'] },
    outputSchema: { type: 'object', required: ['integrationResults', 'subsystems', 'artifacts'], properties: { integrationResults: { type: 'object' }, subsystems: { type: 'array' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'integration']
}));

export const fullSystemTestTask = defineTask('full-system-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Full System Test - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Run full system tests', context: args, instructions: ['1. Run end-to-end tests', '2. Test autonomous behaviors', '3. Test safety systems', '4. Run stress tests', '5. Document system status'] },
    outputSchema: { type: 'object', required: ['allSubsystemsPassed', 'subsystemStatus', 'artifacts'], properties: { allSubsystemsPassed: { type: 'boolean' }, subsystemStatus: { type: 'object' }, failedTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'system-test']
}));

export const performanceValidationTask = defineTask('performance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Validation - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Validate system performance', context: args, instructions: ['1. Measure latencies', '2. Check throughput', '3. Validate accuracy', '4. Measure resource usage', '5. Generate performance report'] },
    outputSchema: { type: 'object', required: ['performanceScore', 'metrics', 'artifacts'], properties: { performanceScore: { type: 'number' }, metrics: { type: 'object' }, bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'bring-up', 'performance']
}));

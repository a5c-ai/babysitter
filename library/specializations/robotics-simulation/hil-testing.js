/**
 * @process specializations/robotics-simulation/hil-testing
 * @description Hardware-in-the-Loop (HIL) Testing - Implement comprehensive HIL testing framework for
 * validating robot software against real hardware including test fixture setup, real-time interfaces,
 * automated test execution, and regression testing.
 * @inputs { robotName: string, testScope?: string, hilPlatform?: string, outputDir?: string }
 * @outputs { success: boolean, hilConfig: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/hil-testing', {
 *   robotName: 'test_robot',
 *   testScope: 'full-system',
 *   hilPlatform: 'speedgoat'
 * });
 *
 * @references
 * - HIL Testing: https://www.ni.com/en-us/innovations/white-papers/09/what-is-hardware-in-the-loop-testing.html
 * - dSPACE: https://www.dspace.com/en/inc/home/products/hw/simulator_hardware.cfm
 * - Speedgoat: https://www.speedgoat.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    testScope = 'full-system',
    hilPlatform = 'speedgoat',
    outputDir = 'hil-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HIL Testing for ${robotName}`);

  const hilSetup = await ctx.task(hilPlatformSetupTask, { robotName, hilPlatform, outputDir });
  artifacts.push(...hilSetup.artifacts);

  const hardwareInterface = await ctx.task(hardwareInterfaceConfigTask, { robotName, hilSetup, outputDir });
  artifacts.push(...hardwareInterface.artifacts);

  const realtimeInterface = await ctx.task(realtimeInterfaceTask, { robotName, hilPlatform, hardwareInterface, outputDir });
  artifacts.push(...realtimeInterface.artifacts);

  const testFixture = await ctx.task(testFixtureSetupTask, { robotName, testScope, outputDir });
  artifacts.push(...testFixture.artifacts);

  const testCases = await ctx.task(hilTestCaseDesignTask, { robotName, testScope, testFixture, outputDir });
  artifacts.push(...testCases.artifacts);

  const faultInjection = await ctx.task(faultInjectionSetupTask, { robotName, testCases, outputDir });
  artifacts.push(...faultInjection.artifacts);

  const automatedExecution = await ctx.task(automatedTestExecutionTask, { robotName, testCases, faultInjection, outputDir });
  artifacts.push(...automatedExecution.artifacts);

  const dataLogging = await ctx.task(hilDataLoggingTask, { robotName, automatedExecution, outputDir });
  artifacts.push(...dataLogging.artifacts);

  const regressionTesting = await ctx.task(regressionTestingTask, { robotName, automatedExecution, outputDir });
  artifacts.push(...regressionTesting.artifacts);

  await ctx.breakpoint({
    question: `HIL Testing Complete for ${robotName}. Pass rate: ${automatedExecution.passRate}%, Coverage: ${testCases.coverage}%. Review?`,
    title: 'HIL Testing Complete',
    context: { runId: ctx.runId, passRate: automatedExecution.passRate, coverage: testCases.coverage }
  });

  return {
    success: automatedExecution.passRate >= 95,
    robotName,
    hilConfig: { platform: hilPlatform, configPath: hilSetup.configPath },
    testResults: { passRate: automatedExecution.passRate, coverage: testCases.coverage, totalTests: automatedExecution.totalTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/hil-testing', timestamp: startTime, outputDir }
  };
}

export const hilPlatformSetupTask = defineTask('hil-platform-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `HIL Platform Setup - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Set up HIL testing platform', context: args, instructions: ['1. Configure HIL hardware', '2. Install real-time OS', '3. Set up I/O interfaces', '4. Configure timing', '5. Validate platform setup'] },
    outputSchema: { type: 'object', required: ['configPath', 'platformConfig', 'artifacts'], properties: { configPath: { type: 'string' }, platformConfig: { type: 'object' }, ioChannels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'setup']
}));

export const hardwareInterfaceConfigTask = defineTask('hardware-interface-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hardware Interface - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Configure hardware interfaces', context: args, instructions: ['1. Map sensor inputs', '2. Configure actuator outputs', '3. Set up CAN/EtherCAT', '4. Configure analog/digital I/O', '5. Test interfaces'] },
    outputSchema: { type: 'object', required: ['interfaceConfig', 'mappings', 'artifacts'], properties: { interfaceConfig: { type: 'object' }, mappings: { type: 'object' }, protocols: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'interface']
}));

export const realtimeInterfaceTask = defineTask('realtime-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: `Real-Time Interface - ${args.robotName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Set up real-time communication', context: args, instructions: ['1. Configure RT communication', '2. Set up shared memory', '3. Configure UDP/RT-Ethernet', '4. Set cycle times', '5. Test determinism'] },
    outputSchema: { type: 'object', required: ['rtConfig', 'cycleTime', 'artifacts'], properties: { rtConfig: { type: 'object' }, cycleTime: { type: 'number' }, jitterMs: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'realtime']
}));

export const testFixtureSetupTask = defineTask('test-fixture-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Fixture Setup - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Set up test fixtures', context: args, instructions: ['1. Design test fixtures', '2. Configure plant models', '3. Set up signal conditioning', '4. Configure safety interlocks', '5. Validate fixtures'] },
    outputSchema: { type: 'object', required: ['fixtureConfig', 'plantModels', 'artifacts'], properties: { fixtureConfig: { type: 'object' }, plantModels: { type: 'array' }, safetyInterlocks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'fixture']
}));

export const hilTestCaseDesignTask = defineTask('hil-test-case-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Case Design - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Design HIL test cases', context: args, instructions: ['1. Define test scenarios', '2. Create test sequences', '3. Set pass/fail criteria', '4. Calculate coverage', '5. Document test cases'] },
    outputSchema: { type: 'object', required: ['testCases', 'coverage', 'artifacts'], properties: { testCases: { type: 'array' }, coverage: { type: 'number' }, categories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'test-design']
}));

export const faultInjectionSetupTask = defineTask('fault-injection-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fault Injection Setup - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Set up fault injection testing', context: args, instructions: ['1. Define fault scenarios', '2. Configure injection points', '3. Set up sensor faults', '4. Configure actuator faults', '5. Test fault injection'] },
    outputSchema: { type: 'object', required: ['faultScenarios', 'injectionPoints', 'artifacts'], properties: { faultScenarios: { type: 'array' }, injectionPoints: { type: 'array' }, faultTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'fault-injection']
}));

export const automatedTestExecutionTask = defineTask('automated-test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Automated Execution - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Execute automated HIL tests', context: args, instructions: ['1. Initialize test harness', '2. Run test sequences', '3. Collect results', '4. Calculate pass rate', '5. Generate test report'] },
    outputSchema: { type: 'object', required: ['passRate', 'totalTests', 'artifacts'], properties: { passRate: { type: 'number' }, totalTests: { type: 'number' }, passedTests: { type: 'number' }, failedTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'execution']
}));

export const hilDataLoggingTask = defineTask('hil-data-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Logging - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Configure HIL data logging', context: args, instructions: ['1. Configure signal logging', '2. Set up data storage', '3. Configure triggers', '4. Set sampling rates', '5. Validate logging'] },
    outputSchema: { type: 'object', required: ['loggingConfig', 'dataFiles', 'artifacts'], properties: { loggingConfig: { type: 'object' }, dataFiles: { type: 'array' }, samplingRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'logging']
}));

export const regressionTestingTask = defineTask('regression-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Regression Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Set up regression testing', context: args, instructions: ['1. Create baseline results', '2. Configure regression suite', '3. Set up CI integration', '4. Configure comparison criteria', '5. Document regression process'] },
    outputSchema: { type: 'object', required: ['regressionSuite', 'baselineResults', 'artifacts'], properties: { regressionSuite: { type: 'object' }, baselineResults: { type: 'object' }, ciConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'hil', 'regression']
}));

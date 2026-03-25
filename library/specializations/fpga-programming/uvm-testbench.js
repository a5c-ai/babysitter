/**
 * @process specializations/fpga-programming/uvm-testbench
 * @description UVM Testbench Architecture - Design and implement Universal Verification Methodology (UVM) testbenches
 * following IEEE 1800.2 standard. Create reusable verification components and test infrastructure.
 * @inputs { dutName: string, interfaces: array, uvmVersion?: string, reuseLevel?: string, outputDir?: string }
 * @outputs { success: boolean, uvmEnvironment: object, agents: array, tests: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/uvm-testbench', {
 *   dutName: 'ethernet_mac',
 *   interfaces: ['gmii', 'axi_lite', 'interrupt'],
 *   uvmVersion: '1.2',
 *   reuseLevel: 'high'
 * });
 *
 * @references
 * - IEEE 1800.2-2020 UVM Standard: https://standards.ieee.org/standard/1800_2-2020.html
 * - UVM Reference: https://verificationacademy.com/
 * - UVM Cookbook: https://www.mentor.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dutName,
    interfaces,
    uvmVersion = '1.2',
    reuseLevel = 'high',
    factoryOverrides = true,
    configDb = true,
    outputDir = 'uvm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting UVM Testbench Development for: ${dutName}`);

  // Phase implementations
  const uvmArchitecture = await ctx.task(uvmArchitectureTask, { dutName, interfaces, uvmVersion, reuseLevel, outputDir });
  artifacts.push(...uvmArchitecture.artifacts);

  const agentTasks = interfaces.map(intf => () => ctx.task(uvmAgentTask, { dutName, interfaceName: intf, uvmVersion, outputDir }));
  const agents = await ctx.parallel.all(agentTasks);
  agents.forEach(a => artifacts.push(...a.artifacts));

  const uvmScoreboard = await ctx.task(uvmScoreboardTask, { dutName, interfaces, uvmArchitecture, outputDir });
  artifacts.push(...uvmScoreboard.artifacts);

  const uvmEnv = await ctx.task(uvmEnvironmentTask, { dutName, agents, uvmScoreboard, configDb, outputDir });
  artifacts.push(...uvmEnv.artifacts);

  const uvmTests = await ctx.task(uvmTestsTask, { dutName, uvmEnv, factoryOverrides, outputDir });
  artifacts.push(...uvmTests.artifacts);

  await ctx.breakpoint({
    question: `UVM Testbench Complete for ${dutName}. ${agents.length} agents, ${uvmTests.testCount} tests. Review UVM environment?`,
    title: 'UVM Testbench Complete',
    context: { runId: ctx.runId, dutName, agentCount: agents.length, testCount: uvmTests.testCount }
  });

  const endTime = ctx.now();

  return {
    success: true,
    dutName,
    uvmEnvironment: { envPath: uvmEnv.envFilePath, scoreboard: uvmScoreboard.scoreboardPath },
    agents: agents.map(a => ({ name: a.agentName, path: a.agentPath })),
    tests: uvmTests.tests,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/uvm-testbench', timestamp: startTime, dutName, outputDir }
  };
}

export const uvmArchitectureTask = defineTask('uvm-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `UVM Architecture - ${args.dutName}`,
  agent: {
    name: 'uvm-architect',
    prompt: {
      role: 'UVM Verification Architect',
      task: 'Design UVM testbench architecture',
      context: args,
      instructions: ['1. Define UVM component hierarchy', '2. Plan agent structure per interface', '3. Design environment architecture', '4. Plan scoreboard strategy', '5. Define configuration objects', '6. Plan virtual sequences', '7. Design factory usage', '8. Plan reporting strategy', '9. Create architecture diagram', '10. Document component interactions']
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'artifacts'],
      properties: { hierarchy: { type: 'object' }, components: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'uvm', 'architecture']
}));

export const uvmAgentTask = defineTask('uvm-agent', (args, taskCtx) => ({
  kind: 'agent',
  title: `UVM Agent - ${args.interfaceName}`,
  agent: {
    name: 'uvm-engineer',
    prompt: {
      role: 'UVM Engineer',
      task: `Create UVM agent for ${args.interfaceName}`,
      context: args,
      instructions: ['1. Create agent class extending uvm_agent', '2. Implement driver', '3. Implement monitor', '4. Create sequencer', '5. Add configuration object', '6. Connect TLM ports', '7. Implement active/passive modes', '8. Add coverage collector', '9. Create agent package', '10. Document agent usage']
    },
    outputSchema: {
      type: 'object',
      required: ['agentName', 'agentPath', 'artifacts'],
      properties: { agentName: { type: 'string' }, agentPath: { type: 'string' }, driverPath: { type: 'string' }, monitorPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'uvm', 'agent']
}));

export const uvmScoreboardTask = defineTask('uvm-scoreboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `UVM Scoreboard - ${args.dutName}`,
  agent: {
    name: 'uvm-engineer',
    prompt: {
      role: 'UVM Engineer',
      task: 'Create UVM scoreboard',
      context: args,
      instructions: ['1. Create scoreboard class', '2. Implement analysis exports', '3. Create reference model', '4. Implement comparison logic', '5. Handle out-of-order', '6. Add error reporting', '7. Implement statistics', '8. Add debug features', '9. Document scoreboard', '10. Test comparison logic']
    },
    outputSchema: {
      type: 'object',
      required: ['scoreboardPath', 'artifacts'],
      properties: { scoreboardPath: { type: 'string' }, referenceModelPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'uvm', 'scoreboard']
}));

export const uvmEnvironmentTask = defineTask('uvm-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `UVM Environment - ${args.dutName}`,
  agent: {
    name: 'uvm-engineer',
    prompt: {
      role: 'UVM Engineer',
      task: 'Create UVM environment',
      context: args,
      instructions: ['1. Create env class extending uvm_env', '2. Instantiate agents', '3. Instantiate scoreboard', '4. Connect TLM ports', '5. Add virtual sequencer', '6. Configure components', '7. Use config_db', '8. Add build/connect phases', '9. Create env package', '10. Document environment']
    },
    outputSchema: {
      type: 'object',
      required: ['envFilePath', 'artifacts'],
      properties: { envFilePath: { type: 'string' }, virtualSequencerPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'uvm', 'environment']
}));

export const uvmTestsTask = defineTask('uvm-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `UVM Tests - ${args.dutName}`,
  agent: {
    name: 'uvm-engineer',
    prompt: {
      role: 'UVM Engineer',
      task: 'Create UVM tests',
      context: args,
      instructions: ['1. Create base test class', '2. Implement directed tests', '3. Implement random tests', '4. Use factory overrides', '5. Configure environment', '6. Start sequences', '7. Implement objections', '8. Add test phases', '9. Create test list', '10. Document tests']
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'tests', 'artifacts'],
      properties: { testCount: { type: 'number' }, tests: { type: 'array', items: { type: 'object' } }, baseTestPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'uvm', 'tests']
}));

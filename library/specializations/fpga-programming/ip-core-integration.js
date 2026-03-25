/**
 * @process specializations/fpga-programming/ip-core-integration
 * @description IP Core Integration - Integrate vendor IP cores and custom IP blocks into designs. Configure IP
 * parameters, connect interfaces, and verify integration correctness.
 * @inputs { designName: string, ipCores: array, targetDevice: string, interfaceProtocols?: array, outputDir?: string }
 * @outputs { success: boolean, integratedIps: array, interfaceConnections: object, verificationReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/ip-core-integration', {
 *   designName: 'processing_system',
 *   ipCores: [{ name: 'axi_dma', vendor: 'xilinx' }, { name: 'axi_gpio', vendor: 'xilinx' }],
 *   targetDevice: 'Zynq-7000',
 *   interfaceProtocols: ['AXI4', 'AXI4-Lite', 'AXI4-Stream']
 * });
 *
 * @references
 * - Vivado IP Integrator: https://docs.amd.com/r/en-US/ug994-vivado-ip-subsystems
 * - Platform Designer: https://www.intel.com/content/www/us/en/programmable/documentation/jrw1529444674987.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    ipCores,
    targetDevice,
    interfaceProtocols = ['AXI4'],
    outputDir = 'ip-integration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting IP Core Integration for: ${designName}`);
  ctx.log('info', `IP Cores: ${ipCores.length}, Target: ${targetDevice}`);

  const ipSelection = await ctx.task(ipSelectionTask, { designName, ipCores, targetDevice, outputDir });
  artifacts.push(...ipSelection.artifacts);

  const ipConfiguration = await ctx.task(ipConfigurationTask, { designName, ipSelection, targetDevice, outputDir });
  artifacts.push(...ipConfiguration.artifacts);

  const interfaceConnection = await ctx.task(interfaceConnectionTask, { designName, ipConfiguration, interfaceProtocols, outputDir });
  artifacts.push(...interfaceConnection.artifacts);

  await ctx.breakpoint({
    question: `IP cores configured for ${designName}. ${ipConfiguration.configuredIps} IPs, ${interfaceConnection.connectionCount} connections. Review integration?`,
    title: 'IP Integration Review',
    context: { runId: ctx.runId, designName, configuredIps: ipConfiguration.configuredIps, connections: interfaceConnection.connectionCount }
  });

  const clockResetConnection = await ctx.task(clockResetConnectionTask, { designName, ipConfiguration, interfaceConnection, outputDir });
  artifacts.push(...clockResetConnection.artifacts);

  const addressMapping = await ctx.task(addressMappingTask, { designName, ipConfiguration, interfaceConnection, outputDir });
  artifacts.push(...addressMapping.artifacts);

  const integrationVerification = await ctx.task(integrationVerificationTask, { designName, ipConfiguration, interfaceConnection, addressMapping, outputDir });
  artifacts.push(...integrationVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: integrationVerification.passed,
    designName,
    integratedIps: ipConfiguration.ips,
    interfaceConnections: interfaceConnection.connections,
    verificationReport: { passed: integrationVerification.passed, tests: integrationVerification.tests },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/ip-core-integration', timestamp: startTime, designName, outputDir }
  };
}

export const ipSelectionTask = defineTask('ip-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `IP Selection - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Select and validate IP cores',
      context: args,
      instructions: ['1. Review IP requirements', '2. Select vendor IPs', '3. Verify device compatibility', '4. Check IP versions', '5. Review IP documentation', '6. Identify dependencies', '7. Check licensing', '8. Document selection rationale', '9. Create IP list', '10. Verify availability']
    },
    outputSchema: {
      type: 'object',
      required: ['selectedIps', 'artifacts'],
      properties: { selectedIps: { type: 'array', items: { type: 'object' } }, compatibility: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'ip', 'selection']
}));

export const ipConfigurationTask = defineTask('ip-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `IP Configuration - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Configure IP core parameters',
      context: args,
      instructions: ['1. Set IP parameters', '2. Configure interfaces', '3. Set data widths', '4. Configure features', '5. Set clock requirements', '6. Configure resets', '7. Generate IP output products', '8. Document configuration', '9. Validate parameters', '10. Create IP instantiation']
    },
    outputSchema: {
      type: 'object',
      required: ['configuredIps', 'ips', 'artifacts'],
      properties: { configuredIps: { type: 'number' }, ips: { type: 'array', items: { type: 'object' } }, configurations: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'ip', 'configuration']
}));

export const interfaceConnectionTask = defineTask('interface-connection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interface Connection - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Connect IP interfaces',
      context: args,
      instructions: ['1. Identify interface ports', '2. Match interface protocols', '3. Connect AXI interfaces', '4. Connect streaming interfaces', '5. Handle interface adapters', '6. Connect interrupts', '7. Document connections', '8. Verify compatibility', '9. Create connection diagram', '10. Generate interconnect']
    },
    outputSchema: {
      type: 'object',
      required: ['connectionCount', 'connections', 'artifacts'],
      properties: { connectionCount: { type: 'number' }, connections: { type: 'array', items: { type: 'object' } }, interconnects: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'ip', 'interface']
}));

export const clockResetConnectionTask = defineTask('clock-reset-connection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clock/Reset Connection - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Connect clocks and resets to IPs',
      context: args,
      instructions: ['1. Identify clock requirements per IP', '2. Connect clock inputs', '3. Identify reset requirements', '4. Connect reset inputs', '5. Handle async resets', '6. Configure reset order', '7. Document clock/reset connections', '8. Verify frequency requirements', '9. Check reset polarity', '10. Generate constraints']
    },
    outputSchema: {
      type: 'object',
      required: ['clockConnections', 'resetConnections', 'artifacts'],
      properties: { clockConnections: { type: 'array', items: { type: 'object' } }, resetConnections: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'ip', 'clock', 'reset']
}));

export const addressMappingTask = defineTask('address-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Address Mapping - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Configure address mapping',
      context: args,
      instructions: ['1. Define address space', '2. Assign base addresses', '3. Configure address ranges', '4. Handle address decoding', '5. Create memory map', '6. Document address assignments', '7. Generate address header', '8. Verify no overlaps', '9. Create documentation', '10. Generate address map']
    },
    outputSchema: {
      type: 'object',
      required: ['addressMap', 'artifacts'],
      properties: { addressMap: { type: 'array', items: { type: 'object' } }, memoryMapPath: { type: 'string' }, headerFilePath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'ip', 'address']
}));

export const integrationVerificationTask = defineTask('integration-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Verify IP integration',
      context: args,
      instructions: ['1. Simulate IP subsystem', '2. Test register access', '3. Verify data flow', '4. Test interrupts', '5. Verify reset behavior', '6. Test address decoding', '7. Check interface timing', '8. Document test results', '9. Create integration testbench', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'tests', 'artifacts'],
      properties: { passed: { type: 'boolean' }, tests: { type: 'array', items: { type: 'object' } }, issues: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'ip', 'verification']
}));

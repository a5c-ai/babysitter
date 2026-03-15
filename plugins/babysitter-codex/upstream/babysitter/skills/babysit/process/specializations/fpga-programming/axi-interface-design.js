/**
 * @process specializations/fpga-programming/axi-interface-design
 * @description AXI Interface Design and Implementation - Design AXI4, AXI4-Lite, and AXI4-Stream interfaces. Implement
 * masters, slaves, and interconnect components following ARM AMBA specifications.
 * @inputs { designName: string, axiType: string, interfaceRole: string, dataWidth?: number, addrWidth?: number, outputDir?: string }
 * @outputs { success: boolean, interfaceDesign: object, rtlFiles: array, verificationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/axi-interface-design', {
 *   designName: 'dma_controller',
 *   axiType: 'AXI4',
 *   interfaceRole: 'master',
 *   dataWidth: 64,
 *   addrWidth: 32
 * });
 *
 * @references
 * - ARM AMBA AXI Protocol: https://developer.arm.com/documentation/ihi0022/latest
 * - AXI4-Stream Protocol: https://developer.arm.com/documentation/ihi0051/latest
 * - Xilinx AXI Reference: https://docs.amd.com/r/en-US/ug1037-vivado-axi-reference-guide
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    axiType,
    interfaceRole,
    dataWidth = 32,
    addrWidth = 32,
    burstSupport = true,
    outputDir = 'axi-interface-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting AXI Interface Design for: ${designName}`);
  ctx.log('info', `Type: ${axiType}, Role: ${interfaceRole}, Data: ${dataWidth}b, Addr: ${addrWidth}b`);

  const protocolAnalysis = await ctx.task(protocolAnalysisTask, { designName, axiType, interfaceRole, dataWidth, addrWidth, outputDir });
  artifacts.push(...protocolAnalysis.artifacts);

  const channelDesign = await ctx.task(channelDesignTask, { designName, axiType, interfaceRole, protocolAnalysis, burstSupport, outputDir });
  artifacts.push(...channelDesign.artifacts);

  const handshakeLogic = await ctx.task(handshakeLogicTask, { designName, channelDesign, axiType, outputDir });
  artifacts.push(...handshakeLogic.artifacts);

  await ctx.breakpoint({
    question: `AXI interface channels designed for ${designName}. ${channelDesign.channelCount} channels, ${handshakeLogic.signalCount} signals. Review interface design?`,
    title: 'AXI Interface Review',
    context: { runId: ctx.runId, designName, axiType, channels: channelDesign.channelCount, signals: handshakeLogic.signalCount }
  });

  const dataPathDesign = await ctx.task(dataPathDesignTask, { designName, channelDesign, dataWidth, outputDir });
  artifacts.push(...dataPathDesign.artifacts);

  const burstHandling = burstSupport ? await ctx.task(burstHandlingTask, { designName, axiType, dataWidth, outputDir }) : null;
  if (burstHandling) artifacts.push(...burstHandling.artifacts);

  const interfaceVerification = await ctx.task(interfaceVerificationTask, { designName, channelDesign, handshakeLogic, axiType, outputDir });
  artifacts.push(...interfaceVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: interfaceVerification.passed,
    designName,
    interfaceDesign: { type: axiType, role: interfaceRole, channels: channelDesign.channels, dataWidth, addrWidth },
    rtlFiles: channelDesign.rtlFiles,
    verificationResults: { passed: interfaceVerification.passed, tests: interfaceVerification.tests },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/axi-interface-design', timestamp: startTime, designName, outputDir }
  };
}

export const protocolAnalysisTask = defineTask('protocol-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Protocol Analysis - ${args.designName}`,
  agent: {
    name: 'axi-engineer',
    prompt: {
      role: 'AXI Protocol Engineer',
      task: 'Analyze AXI protocol requirements',
      context: args,
      instructions: ['1. Review AXI specification', '2. Identify required channels', '3. Define signal requirements', '4. Specify burst capabilities', '5. Define QoS requirements', '6. Identify optional signals', '7. Document protocol subset', '8. Create interface spec', '9. Review with team', '10. Finalize requirements']
    },
    outputSchema: {
      type: 'object',
      required: ['protocolSpec', 'artifacts'],
      properties: { protocolSpec: { type: 'object' }, requiredChannels: { type: 'array', items: { type: 'string' } }, optionalFeatures: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'axi', 'protocol']
}));

export const channelDesignTask = defineTask('channel-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Channel Design - ${args.designName}`,
  agent: {
    name: 'axi-engineer',
    prompt: {
      role: 'AXI Protocol Engineer',
      task: 'Design AXI channels',
      context: args,
      instructions: ['1. Design write address channel', '2. Design write data channel', '3. Design write response channel', '4. Design read address channel', '5. Design read data channel', '6. Implement valid/ready handshake', '7. Add ID support', '8. Document channel interfaces', '9. Create RTL files', '10. Verify channel connectivity']
    },
    outputSchema: {
      type: 'object',
      required: ['channelCount', 'channels', 'rtlFiles', 'artifacts'],
      properties: { channelCount: { type: 'number' }, channels: { type: 'array', items: { type: 'object' } }, rtlFiles: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'axi', 'channel']
}));

export const handshakeLogicTask = defineTask('handshake-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Handshake Logic - ${args.designName}`,
  agent: {
    name: 'axi-engineer',
    prompt: {
      role: 'AXI Protocol Engineer',
      task: 'Implement handshake logic',
      context: args,
      instructions: ['1. Implement valid/ready protocol', '2. Handle backpressure', '3. Design skid buffers', '4. Handle channel dependencies', '5. Implement ordering rules', '6. Add timeout handling', '7. Document handshake behavior', '8. Create timing diagrams', '9. Test handshake scenarios', '10. Verify protocol compliance']
    },
    outputSchema: {
      type: 'object',
      required: ['signalCount', 'handshakeLogic', 'artifacts'],
      properties: { signalCount: { type: 'number' }, handshakeLogic: { type: 'object' }, timingDiagrams: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'axi', 'handshake']
}));

export const dataPathDesignTask = defineTask('data-path-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Path Design - ${args.designName}`,
  agent: {
    name: 'axi-engineer',
    prompt: {
      role: 'AXI Protocol Engineer',
      task: 'Design data path logic',
      context: args,
      instructions: ['1. Design data alignment', '2. Implement strobe handling', '3. Handle narrow transfers', '4. Design data packing', '5. Implement endianness', '6. Add byte enables', '7. Document data flow', '8. Create data path RTL', '9. Test data transfers', '10. Verify data integrity']
    },
    outputSchema: {
      type: 'object',
      required: ['dataPath', 'artifacts'],
      properties: { dataPath: { type: 'object' }, alignmentLogic: { type: 'object' }, rtlPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'axi', 'datapath']
}));

export const burstHandlingTask = defineTask('burst-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Burst Handling - ${args.designName}`,
  agent: {
    name: 'axi-engineer',
    prompt: {
      role: 'AXI Protocol Engineer',
      task: 'Implement burst handling',
      context: args,
      instructions: ['1. Implement INCR bursts', '2. Implement WRAP bursts', '3. Implement FIXED bursts', '4. Design address generation', '5. Handle burst boundaries', '6. Implement beat counting', '7. Add burst length handling', '8. Document burst behavior', '9. Test burst scenarios', '10. Verify burst compliance']
    },
    outputSchema: {
      type: 'object',
      required: ['burstLogic', 'artifacts'],
      properties: { burstLogic: { type: 'object' }, supportedTypes: { type: 'array', items: { type: 'string' } }, maxBurstLength: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'axi', 'burst']
}));

export const interfaceVerificationTask = defineTask('interface-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interface Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'AXI Verification Engineer',
      task: 'Verify AXI interface',
      context: args,
      instructions: ['1. Create AXI VIP testbench', '2. Test single transfers', '3. Test burst transfers', '4. Verify handshake timing', '5. Test error responses', '6. Check protocol compliance', '7. Run stress tests', '8. Verify ordering', '9. Document test results', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'tests', 'artifacts'],
      properties: { passed: { type: 'boolean' }, tests: { type: 'array', items: { type: 'object' } }, protocolCompliance: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'axi', 'verification']
}));

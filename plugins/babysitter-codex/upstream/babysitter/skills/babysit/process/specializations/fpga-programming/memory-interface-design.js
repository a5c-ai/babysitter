/**
 * @process specializations/fpga-programming/memory-interface-design
 * @description Memory Interface Design - Design high-performance memory interfaces including DDR3/DDR4 controllers,
 * SRAM interfaces, and on-chip memory architectures. Optimize for bandwidth, latency, and power.
 * @inputs { designName: string, memoryType: string, dataWidth?: number, addressWidth?: number, clockFrequency?: number, outputDir?: string }
 * @outputs { success: boolean, memoryInterface: object, controllerDesign: object, timingAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/memory-interface-design', {
 *   designName: 'video_frame_buffer',
 *   memoryType: 'DDR4',
 *   dataWidth: 64,
 *   addressWidth: 32,
 *   clockFrequency: 800
 * });
 *
 * @references
 * - JEDEC DDR4 Standard: https://www.jedec.org/standards-documents/docs/jesd79-4
 * - Xilinx MIG: https://docs.amd.com/r/en-US/ug586_7Series_MIS
 * - Intel EMIF: https://www.intel.com/content/www/us/en/programmable/documentation/bhc1410334853449.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    memoryType,
    dataWidth = 64,
    addressWidth = 32,
    clockFrequency = 400,
    eccSupport = false,
    outputDir = 'memory-interface-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Memory Interface Design for: ${designName}`);
  ctx.log('info', `Type: ${memoryType}, Width: ${dataWidth}b, Freq: ${clockFrequency}MHz`);

  const memoryArchitecture = await ctx.task(memoryArchitectureTask, { designName, memoryType, dataWidth, addressWidth, clockFrequency, outputDir });
  artifacts.push(...memoryArchitecture.artifacts);

  const controllerDesign = await ctx.task(controllerDesignTask, { designName, memoryType, memoryArchitecture, eccSupport, outputDir });
  artifacts.push(...controllerDesign.artifacts);

  const phyDesign = await ctx.task(phyDesignTask, { designName, memoryType, clockFrequency, dataWidth, outputDir });
  artifacts.push(...phyDesign.artifacts);

  await ctx.breakpoint({
    question: `Memory controller designed for ${designName}. ${memoryType} at ${clockFrequency}MHz, ${dataWidth}-bit interface. Review memory design?`,
    title: 'Memory Interface Review',
    context: { runId: ctx.runId, designName, memoryType, clockFrequency, dataWidth }
  });

  const timingCalibration = await ctx.task(timingCalibrationTask, { designName, phyDesign, memoryType, clockFrequency, outputDir });
  artifacts.push(...timingCalibration.artifacts);

  const arbiterDesign = await ctx.task(arbiterDesignTask, { designName, controllerDesign, outputDir });
  artifacts.push(...arbiterDesign.artifacts);

  const memoryVerification = await ctx.task(memoryVerificationTask, { designName, controllerDesign, phyDesign, timingCalibration, outputDir });
  artifacts.push(...memoryVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: memoryVerification.passed,
    designName,
    memoryInterface: { type: memoryType, dataWidth, addressWidth, frequency: clockFrequency },
    controllerDesign: controllerDesign.controller,
    timingAnalysis: timingCalibration.analysis,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/memory-interface-design', timestamp: startTime, designName, outputDir }
  };
}

export const memoryArchitectureTask = defineTask('memory-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Memory Architecture - ${args.designName}`,
  agent: {
    name: 'memory-engineer',
    prompt: {
      role: 'Memory Interface Engineer',
      task: 'Design memory architecture',
      context: args,
      instructions: ['1. Analyze bandwidth requirements', '2. Define memory topology', '3. Calculate address mapping', '4. Design bank interleaving', '5. Plan refresh scheduling', '6. Define burst lengths', '7. Specify latency requirements', '8. Document architecture', '9. Create memory map', '10. Review with team']
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: { architecture: { type: 'object' }, memoryMap: { type: 'object' }, bandwidthEstimate: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'memory', 'architecture']
}));

export const controllerDesignTask = defineTask('controller-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Controller Design - ${args.designName}`,
  agent: {
    name: 'memory-engineer',
    prompt: {
      role: 'Memory Interface Engineer',
      task: 'Design memory controller',
      context: args,
      instructions: ['1. Design command sequencer', '2. Implement timing state machine', '3. Design refresh controller', '4. Implement write leveling', '5. Design read leveling', '6. Add ECC if required', '7. Implement power management', '8. Document controller', '9. Create RTL', '10. Verify timing']
    },
    outputSchema: {
      type: 'object',
      required: ['controller', 'artifacts'],
      properties: { controller: { type: 'object' }, stateMachine: { type: 'object' }, rtlPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'memory', 'controller']
}));

export const phyDesignTask = defineTask('phy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `PHY Design - ${args.designName}`,
  agent: {
    name: 'memory-engineer',
    prompt: {
      role: 'Memory PHY Engineer',
      task: 'Design memory PHY',
      context: args,
      instructions: ['1. Design DQ/DQS paths', '2. Implement IDELAYCTRL', '3. Design input/output buffers', '4. Implement DLL/PLL', '5. Design ODT control', '6. Add termination calibration', '7. Implement ZQ calibration', '8. Document PHY design', '9. Create constraints', '10. Verify signal integrity']
    },
    outputSchema: {
      type: 'object',
      required: ['phy', 'artifacts'],
      properties: { phy: { type: 'object' }, ioConstraints: { type: 'string' }, timingConstraints: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'memory', 'phy']
}));

export const timingCalibrationTask = defineTask('timing-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Timing Calibration - ${args.designName}`,
  agent: {
    name: 'memory-engineer',
    prompt: {
      role: 'Memory Timing Engineer',
      task: 'Design timing calibration',
      context: args,
      instructions: ['1. Design write leveling algorithm', '2. Design read leveling algorithm', '3. Implement bit slip correction', '4. Design per-bit deskew', '5. Implement VREF training', '6. Add eye centering', '7. Design calibration FSM', '8. Document calibration', '9. Test calibration', '10. Verify margins']
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: { analysis: { type: 'object' }, calibrationLogic: { type: 'object' }, marginResults: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'memory', 'calibration']
}));

export const arbiterDesignTask = defineTask('arbiter-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Arbiter Design - ${args.designName}`,
  agent: {
    name: 'memory-engineer',
    prompt: {
      role: 'Memory Interface Engineer',
      task: 'Design memory arbiter',
      context: args,
      instructions: ['1. Define arbitration policy', '2. Design priority encoder', '3. Implement round-robin', '4. Add QoS support', '5. Design request queues', '6. Implement reordering', '7. Add bandwidth allocation', '8. Document arbiter', '9. Create RTL', '10. Verify fairness']
    },
    outputSchema: {
      type: 'object',
      required: ['arbiter', 'artifacts'],
      properties: { arbiter: { type: 'object' }, policy: { type: 'string' }, portCount: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'memory', 'arbiter']
}));

export const memoryVerificationTask = defineTask('memory-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Memory Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Memory Verification Engineer',
      task: 'Verify memory interface',
      context: args,
      instructions: ['1. Create memory model', '2. Test initialization', '3. Test read/write operations', '4. Test burst transfers', '5. Verify refresh operation', '6. Test calibration', '7. Run stress tests', '8. Check data integrity', '9. Document results', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, testResults: { type: 'array', items: { type: 'object' } }, bandwidthMeasured: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'memory', 'verification']
}));

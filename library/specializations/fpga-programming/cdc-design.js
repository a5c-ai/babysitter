/**
 * @process specializations/fpga-programming/cdc-design
 * @description Clock Domain Crossing (CDC) Design - Design and verify safe clock domain crossing circuits. Implement
 * synchronizers, handshake protocols, and asynchronous FIFOs with proper CDC techniques.
 * @inputs { designName: string, clockDomains: array, crossingTypes?: array, verificationLevel?: string, outputDir?: string }
 * @outputs { success: boolean, cdcDesign: object, synchronizers: array, verificationReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/cdc-design', {
 *   designName: 'multi_clock_controller',
 *   clockDomains: [{ name: 'clk_100', frequency: 100 }, { name: 'clk_200', frequency: 200 }],
 *   crossingTypes: ['single_bit', 'bus', 'handshake', 'async_fifo'],
 *   verificationLevel: 'comprehensive'
 * });
 *
 * @references
 * - CDC Design Guidelines: http://www.sunburst-design.com/papers/
 * - CDC Verification: https://www.synopsys.com/verification/static-and-formal-verification/spyglass.html
 * - Async FIFO Design: https://zipcpu.com/blog/2017/10/20/cdc.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    clockDomains,
    crossingTypes = ['single_bit', 'bus', 'handshake'],
    verificationLevel = 'standard',
    outputDir = 'cdc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CDC Design for: ${designName}`);
  ctx.log('info', `Clock Domains: ${clockDomains.length}, Crossing Types: ${crossingTypes.join(', ')}`);

  const cdcAnalysis = await ctx.task(cdcAnalysisTask, { designName, clockDomains, crossingTypes, outputDir });
  artifacts.push(...cdcAnalysis.artifacts);

  const synchronizerDesign = await ctx.task(synchronizerDesignTask, { designName, cdcAnalysis, clockDomains, outputDir });
  artifacts.push(...synchronizerDesign.artifacts);

  const handshakeProtocol = await ctx.task(handshakeProtocolTask, { designName, clockDomains, cdcAnalysis, outputDir });
  artifacts.push(...handshakeProtocol.artifacts);

  await ctx.breakpoint({
    question: `CDC design complete for ${designName}. ${cdcAnalysis.crossingCount} crossings identified, ${synchronizerDesign.synchronizerCount} synchronizers designed. Review CDC design?`,
    title: 'CDC Design Review',
    context: { runId: ctx.runId, designName, crossingCount: cdcAnalysis.crossingCount, synchronizerCount: synchronizerDesign.synchronizerCount }
  });

  const asyncFifoDesign = crossingTypes.includes('async_fifo') ? await ctx.task(asyncFifoDesignTask, { designName, clockDomains, outputDir }) : null;
  if (asyncFifoDesign) artifacts.push(...asyncFifoDesign.artifacts);

  const cdcConstraints = await ctx.task(cdcConstraintsTask, { designName, cdcAnalysis, synchronizerDesign, outputDir });
  artifacts.push(...cdcConstraints.artifacts);

  const cdcVerification = await ctx.task(cdcVerificationTask, { designName, cdcAnalysis, synchronizerDesign, verificationLevel, outputDir });
  artifacts.push(...cdcVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: cdcVerification.passed,
    designName,
    cdcDesign: { crossings: cdcAnalysis.crossings, protocols: handshakeProtocol.protocols },
    synchronizers: synchronizerDesign.synchronizers,
    verificationReport: { passed: cdcVerification.passed, violations: cdcVerification.violations, coverage: cdcVerification.coverage },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/cdc-design', timestamp: startTime, designName, outputDir }
  };
}

export const cdcAnalysisTask = defineTask('cdc-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `CDC Analysis - ${args.designName}`,
  agent: {
    name: 'cdc-engineer',
    prompt: {
      role: 'CDC Design Engineer',
      task: 'Analyze clock domain crossings',
      context: args,
      instructions: ['1. Identify all clock domains', '2. Find all domain crossings', '3. Classify crossing types', '4. Identify single-bit crossings', '5. Identify bus crossings', '6. Identify control signal crossings', '7. Document crossing requirements', '8. Assess metastability risk', '9. Create CDC report', '10. Prioritize crossings']
    },
    outputSchema: {
      type: 'object',
      required: ['crossingCount', 'crossings', 'artifacts'],
      properties: { crossingCount: { type: 'number' }, crossings: { type: 'array', items: { type: 'object' } }, riskAssessment: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'cdc', 'analysis']
}));

export const synchronizerDesignTask = defineTask('synchronizer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synchronizer Design - ${args.designName}`,
  agent: {
    name: 'cdc-engineer',
    prompt: {
      role: 'CDC Design Engineer',
      task: 'Design synchronization circuits',
      context: args,
      instructions: ['1. Design 2FF synchronizer', '2. Design 3FF synchronizer if needed', '3. Use ASYNC_REG attribute', '4. Design pulse synchronizer', '5. Design level synchronizer', '6. Handle reset synchronization', '7. Document MTBF calculations', '8. Create synchronizer library', '9. Test synchronizer behavior', '10. Document usage']
    },
    outputSchema: {
      type: 'object',
      required: ['synchronizerCount', 'synchronizers', 'artifacts'],
      properties: { synchronizerCount: { type: 'number' }, synchronizers: { type: 'array', items: { type: 'object' } }, mtbfCalculations: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'cdc', 'synchronizer']
}));

export const handshakeProtocolTask = defineTask('handshake-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Handshake Protocol - ${args.designName}`,
  agent: {
    name: 'cdc-engineer',
    prompt: {
      role: 'CDC Design Engineer',
      task: 'Design handshake protocols',
      context: args,
      instructions: ['1. Design req-ack handshake', '2. Implement 4-phase handshake', '3. Design pulse handshake', '4. Handle bus crossing with handshake', '5. Implement valid-ready protocol', '6. Design credit-based flow control', '7. Document protocol behavior', '8. Create protocol library', '9. Test protocol operation', '10. Verify no data loss']
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: { protocols: { type: 'array', items: { type: 'object' } }, protocolLibraryPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'cdc', 'handshake']
}));

export const asyncFifoDesignTask = defineTask('async-fifo-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Async FIFO Design - ${args.designName}`,
  agent: {
    name: 'cdc-engineer',
    prompt: {
      role: 'CDC Design Engineer',
      task: 'Design asynchronous FIFO',
      context: args,
      instructions: ['1. Design Gray code counters', '2. Implement pointer synchronization', '3. Design full/empty logic', '4. Handle almost full/empty', '5. Implement memory array', '6. Design read/write logic', '7. Add overflow/underflow protection', '8. Document FIFO parameters', '9. Test FIFO operation', '10. Verify no data corruption']
    },
    outputSchema: {
      type: 'object',
      required: ['fifoDesign', 'artifacts'],
      properties: { fifoDesign: { type: 'object' }, fifoFilePath: { type: 'string' }, parameters: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'cdc', 'async-fifo']
}));

export const cdcConstraintsTask = defineTask('cdc-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `CDC Constraints - ${args.designName}`,
  agent: {
    name: 'cdc-engineer',
    prompt: {
      role: 'CDC Design Engineer',
      task: 'Create CDC timing constraints',
      context: args,
      instructions: ['1. Define clock groups', '2. Set false paths for CDC', '3. Set max_delay for data paths', '4. Constrain synchronizer placement', '5. Add ASYNC_REG constraints', '6. Document constraint purpose', '7. Validate constraints', '8. Test constraint coverage', '9. Create constraint file', '10. Review with timing engineer']
    },
    outputSchema: {
      type: 'object',
      required: ['constraintFilePath', 'artifacts'],
      properties: { constraintFilePath: { type: 'string' }, falsePaths: { type: 'array', items: { type: 'object' } }, maxDelays: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'cdc', 'constraints']
}));

export const cdcVerificationTask = defineTask('cdc-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `CDC Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'CDC Verification Engineer',
      task: 'Verify CDC correctness',
      context: args,
      instructions: ['1. Run structural CDC check', '2. Run formal CDC verification', '3. Check synchronizer presence', '4. Verify reconvergence', '5. Check FIFO correctness', '6. Simulate with random delays', '7. Check for data corruption', '8. Document violations', '9. Create waivers if needed', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'violations', 'coverage', 'artifacts'],
      properties: { passed: { type: 'boolean' }, violations: { type: 'array', items: { type: 'object' } }, coverage: { type: 'object' }, waivers: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'cdc', 'verification']
}));

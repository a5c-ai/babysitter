/**
 * @process specializations/fpga-programming/reset-strategy
 * @description Reset Strategy Design - Design robust reset distribution and synchronization for single and multi-clock
 * domain designs. Implement reset sequencing and de-assertion synchronization.
 * @inputs { designName: string, clockDomains: array, resetType?: string, resetPolarity?: string, outputDir?: string }
 * @outputs { success: boolean, resetDesign: object, synchronizers: array, sequencingLogic: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/reset-strategy', {
 *   designName: 'soc_subsystem',
 *   clockDomains: ['cpu_clk', 'bus_clk', 'io_clk'],
 *   resetType: 'synchronous',
 *   resetPolarity: 'active_low'
 * });
 *
 * @references
 * - Reset Design: http://www.sunburst-design.com/papers/
 * - FPGA Reset Best Practices: https://docs.amd.com/r/en-US/ug949-vivado-design-methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    clockDomains,
    resetType = 'synchronous',
    resetPolarity = 'active_low',
    resetSequencing = true,
    outputDir = 'reset-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Reset Strategy Design for: ${designName}`);
  ctx.log('info', `Type: ${resetType}, Polarity: ${resetPolarity}, Domains: ${clockDomains.length}`);

  const resetArchitecture = await ctx.task(resetArchitectureTask, { designName, clockDomains, resetType, resetPolarity, outputDir });
  artifacts.push(...resetArchitecture.artifacts);

  const resetSynchronizers = await ctx.task(resetSynchronizersTask, { designName, clockDomains, resetType, resetPolarity, outputDir });
  artifacts.push(...resetSynchronizers.artifacts);

  const resetSequencingLogic = resetSequencing ? await ctx.task(resetSequencingTask, { designName, clockDomains, resetArchitecture, outputDir }) : null;
  if (resetSequencingLogic) artifacts.push(...resetSequencingLogic.artifacts);

  await ctx.breakpoint({
    question: `Reset strategy defined for ${designName}. ${clockDomains.length} domains, ${resetSynchronizers.synchronizerCount} synchronizers. Review reset design?`,
    title: 'Reset Strategy Review',
    context: { runId: ctx.runId, designName, domains: clockDomains.length, synchronizers: resetSynchronizers.synchronizerCount }
  });

  const resetConstraints = await ctx.task(resetConstraintsTask, { designName, resetArchitecture, resetSynchronizers, outputDir });
  artifacts.push(...resetConstraints.artifacts);

  const resetVerification = await ctx.task(resetVerificationTask, { designName, resetArchitecture, resetSynchronizers, resetSequencingLogic, outputDir });
  artifacts.push(...resetVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: resetVerification.passed,
    designName,
    resetDesign: { type: resetType, polarity: resetPolarity, architecture: resetArchitecture.architecture },
    synchronizers: resetSynchronizers.synchronizers,
    sequencingLogic: resetSequencingLogic?.sequencing,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/reset-strategy', timestamp: startTime, designName, outputDir }
  };
}

export const resetArchitectureTask = defineTask('reset-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reset Architecture - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design reset architecture',
      context: args,
      instructions: ['1. Define reset hierarchy', '2. Identify reset sources', '3. Plan reset distribution', '4. Design reset tree', '5. Handle external vs internal resets', '6. Plan power-on reset', '7. Design soft reset', '8. Document reset requirements', '9. Create reset block diagram', '10. Specify reset timing']
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: { architecture: { type: 'object' }, resetSources: { type: 'array', items: { type: 'string' } }, resetTree: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'reset', 'architecture']
}));

export const resetSynchronizersTask = defineTask('reset-synchronizers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reset Synchronizers - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design reset synchronizers',
      context: args,
      instructions: ['1. Design async reset synchronizer', '2. Implement de-assertion synchronization', '3. Handle reset removal metastability', '4. Use ASYNC_REG attribute', '5. Design per-domain synchronizers', '6. Handle reset glitch filtering', '7. Document synchronizer design', '8. Create synchronizer library', '9. Test reset behavior', '10. Verify no metastability']
    },
    outputSchema: {
      type: 'object',
      required: ['synchronizerCount', 'synchronizers', 'artifacts'],
      properties: { synchronizerCount: { type: 'number' }, synchronizers: { type: 'array', items: { type: 'object' } }, libraryPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'reset', 'synchronizer']
}));

export const resetSequencingTask = defineTask('reset-sequencing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reset Sequencing - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design reset sequencing',
      context: args,
      instructions: ['1. Define reset sequence order', '2. Design sequencing state machine', '3. Implement domain dependencies', '4. Add delay counters', '5. Handle reverse sequence for de-reset', '6. Design status reporting', '7. Handle timeout conditions', '8. Document sequencing', '9. Test sequence operation', '10. Verify correct order']
    },
    outputSchema: {
      type: 'object',
      required: ['sequencing', 'artifacts'],
      properties: { sequencing: { type: 'object' }, sequenceOrder: { type: 'array', items: { type: 'string' } }, stateMachine: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'reset', 'sequencing']
}));

export const resetConstraintsTask = defineTask('reset-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reset Constraints - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Create reset constraints',
      context: args,
      instructions: ['1. Constrain reset paths', '2. Set false paths for async reset', '3. Constrain synchronizer placement', '4. Add reset timing constraints', '5. Document constraint rationale', '6. Validate reset constraints', '7. Test constraint coverage', '8. Create constraint file', '9. Review with design team', '10. Generate constraint report']
    },
    outputSchema: {
      type: 'object',
      required: ['constraintFilePath', 'artifacts'],
      properties: { constraintFilePath: { type: 'string' }, constraints: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'reset', 'constraints']
}));

export const resetVerificationTask = defineTask('reset-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reset Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Verify reset design',
      context: args,
      instructions: ['1. Simulate reset assertion', '2. Simulate reset de-assertion', '3. Test reset sequencing', '4. Verify synchronizer behavior', '5. Test with random reset timing', '6. Check all domains reset properly', '7. Verify no state corruption', '8. Test concurrent resets', '9. Document verification results', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, testResults: { type: 'array', items: { type: 'object' } }, issues: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'reset', 'verification']
}));

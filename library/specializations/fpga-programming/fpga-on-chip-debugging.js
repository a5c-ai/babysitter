/**
 * @process specializations/fpga-programming/fpga-on-chip-debugging
 * @description FPGA On-Chip Debugging - Set up and use integrated logic analyzers (ILA), virtual I/O (VIO), and debug
 * cores for in-system debugging. Capture and analyze signals during real hardware operation.
 * @inputs { designName: string, debugTargets: array, captureDepth?: number, triggerConditions?: array, outputDir?: string }
 * @outputs { success: boolean, debugSetup: object, ilaCores: array, triggerConfiguration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/fpga-on-chip-debugging', {
 *   designName: 'pcie_controller',
 *   debugTargets: [{ signal: 'rx_data', width: 64 }, { signal: 'tx_valid', width: 1 }],
 *   captureDepth: 4096,
 *   triggerConditions: [{ signal: 'error_flag', value: 1 }]
 * });
 *
 * @references
 * - Vivado Debug: https://docs.amd.com/r/en-US/ug908-vivado-programming-debugging
 * - Signal Tap: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1410471376527.html
 * - ChipScope: https://docs.amd.com/r/en-US/ug936-vivado-tutorial-programming-debugging
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    debugTargets,
    captureDepth = 1024,
    triggerConditions = [],
    debugHubType = 'ila',
    outputDir = 'debug-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting On-Chip Debug Setup for: ${designName}`);
  ctx.log('info', `Targets: ${debugTargets.length}, Depth: ${captureDepth}, Triggers: ${triggerConditions.length}`);

  const debugPlanning = await ctx.task(debugPlanningTask, { designName, debugTargets, captureDepth, outputDir });
  artifacts.push(...debugPlanning.artifacts);

  const ilaInsertion = await ctx.task(ilaInsertionTask, { designName, debugPlanning, captureDepth, debugHubType, outputDir });
  artifacts.push(...ilaInsertion.artifacts);

  const triggerSetup = await ctx.task(triggerSetupTask, { designName, ilaInsertion, triggerConditions, outputDir });
  artifacts.push(...triggerSetup.artifacts);

  await ctx.breakpoint({
    question: `Debug cores configured for ${designName}. ${ilaInsertion.coreCount} ILA cores, ${triggerSetup.triggerCount} triggers. Review debug setup?`,
    title: 'Debug Setup Review',
    context: { runId: ctx.runId, designName, cores: ilaInsertion.coreCount, triggers: triggerSetup.triggerCount }
  });

  const vioSetup = await ctx.task(vioSetupTask, { designName, debugPlanning, outputDir });
  artifacts.push(...vioSetup.artifacts);

  const debugConstraints = await ctx.task(debugConstraintsTask, { designName, ilaInsertion, vioSetup, outputDir });
  artifacts.push(...debugConstraints.artifacts);

  const debugVerification = await ctx.task(debugVerificationTask, { designName, ilaInsertion, triggerSetup, vioSetup, outputDir });
  artifacts.push(...debugVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: debugVerification.passed,
    designName,
    debugSetup: { targets: debugTargets, captureDepth, hubType: debugHubType },
    ilaCores: ilaInsertion.cores,
    triggerConfiguration: triggerSetup.configuration,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/fpga-on-chip-debugging', timestamp: startTime, designName, outputDir }
  };
}

export const debugPlanningTask = defineTask('debug-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug Planning - ${args.designName}`,
  agent: {
    name: 'debug-engineer',
    prompt: {
      role: 'FPGA Debug Engineer',
      task: 'Plan debug strategy',
      context: args,
      instructions: ['1. Analyze debug requirements', '2. Identify key signals', '3. Plan signal grouping', '4. Calculate memory requirements', '5. Identify trigger points', '6. Plan debug hierarchy', '7. Assess resource impact', '8. Document debug plan', '9. Review with team', '10. Finalize debug strategy']
    },
    outputSchema: {
      type: 'object',
      required: ['debugPlan', 'artifacts'],
      properties: { debugPlan: { type: 'object' }, signalGroups: { type: 'array', items: { type: 'object' } }, resourceEstimate: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'debug', 'planning']
}));

export const ilaInsertionTask = defineTask('ila-insertion', (args, taskCtx) => ({
  kind: 'agent',
  title: `ILA Insertion - ${args.designName}`,
  agent: {
    name: 'debug-engineer',
    prompt: {
      role: 'FPGA Debug Engineer',
      task: 'Insert ILA debug cores',
      context: args,
      instructions: ['1. Create debug hub', '2. Instantiate ILA cores', '3. Connect probe signals', '4. Configure sample depth', '5. Set storage qualification', '6. Configure comparators', '7. Add mark_debug attributes', '8. Document ILA configuration', '9. Generate debug constraints', '10. Verify ILA insertion']
    },
    outputSchema: {
      type: 'object',
      required: ['coreCount', 'cores', 'artifacts'],
      properties: { coreCount: { type: 'number' }, cores: { type: 'array', items: { type: 'object' } }, probeCount: { type: 'number' }, memoryUsage: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'debug', 'ila']
}));

export const triggerSetupTask = defineTask('trigger-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trigger Setup - ${args.designName}`,
  agent: {
    name: 'debug-engineer',
    prompt: {
      role: 'FPGA Debug Engineer',
      task: 'Configure debug triggers',
      context: args,
      instructions: ['1. Define trigger conditions', '2. Configure comparators', '3. Set trigger positions', '4. Configure trigger sequencing', '5. Set capture windows', '6. Add boolean combinations', '7. Configure trigger outputs', '8. Document triggers', '9. Test trigger operation', '10. Verify trigger capture']
    },
    outputSchema: {
      type: 'object',
      required: ['triggerCount', 'configuration', 'artifacts'],
      properties: { triggerCount: { type: 'number' }, configuration: { type: 'object' }, triggerConditions: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'debug', 'trigger']
}));

export const vioSetupTask = defineTask('vio-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `VIO Setup - ${args.designName}`,
  agent: {
    name: 'debug-engineer',
    prompt: {
      role: 'FPGA Debug Engineer',
      task: 'Configure Virtual I/O',
      context: args,
      instructions: ['1. Identify control signals', '2. Instantiate VIO cores', '3. Configure input probes', '4. Configure output probes', '5. Set initial values', '6. Add activity detectors', '7. Document VIO ports', '8. Create control scripts', '9. Test VIO operation', '10. Verify signal control']
    },
    outputSchema: {
      type: 'object',
      required: ['vioSetup', 'artifacts'],
      properties: { vioSetup: { type: 'object' }, inputProbes: { type: 'number' }, outputProbes: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'debug', 'vio']
}));

export const debugConstraintsTask = defineTask('debug-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug Constraints - ${args.designName}`,
  agent: {
    name: 'debug-engineer',
    prompt: {
      role: 'FPGA Debug Engineer',
      task: 'Create debug constraints',
      context: args,
      instructions: ['1. Add debug clock constraints', '2. Constrain debug hub', '3. Set false paths for debug', '4. Add placement constraints', '5. Constrain debug memory', '6. Document constraint rationale', '7. Validate constraints', '8. Test with implementation', '9. Verify timing closure', '10. Generate constraint file']
    },
    outputSchema: {
      type: 'object',
      required: ['constraintFilePath', 'artifacts'],
      properties: { constraintFilePath: { type: 'string' }, constraints: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'debug', 'constraints']
}));

export const debugVerificationTask = defineTask('debug-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Debug Verification Engineer',
      task: 'Verify debug functionality',
      context: args,
      instructions: ['1. Program debug bitstream', '2. Connect to debug hub', '3. Test ILA capture', '4. Test trigger conditions', '5. Verify VIO control', '6. Test waveform export', '7. Verify signal integrity', '8. Test multiple captures', '9. Document debug procedures', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, captureTests: { type: 'array', items: { type: 'object' } }, issues: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'debug', 'verification']
}));

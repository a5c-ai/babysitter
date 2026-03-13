/**
 * @process specializations/fpga-programming/timing-constraints
 * @description Timing Constraint Development - Develop comprehensive timing constraints (SDC/XDC) including clock
 * definitions, input/output delays, false paths, and multicycle paths. Ensure constraint completeness and correctness.
 * @inputs { designName: string, clockSpecs: array, ioInterfaces?: array, constraintFormat?: string, targetDevice?: string, outputDir?: string }
 * @outputs { success: boolean, constraintFile: string, validationReport: object, coverageReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/timing-constraints', {
 *   designName: 'multi_clock_design',
 *   clockSpecs: [{ name: 'sys_clk', frequency: 200, source: 'external' }, { name: 'ddr_clk', frequency: 400, source: 'pll' }],
 *   ioInterfaces: ['ddr3', 'spi', 'uart'],
 *   constraintFormat: 'XDC'
 * });
 *
 * @references
 * - SDC Standard: https://www.synopsys.com/
 * - Vivado Constraints: https://docs.amd.com/r/en-US/ug903-vivado-using-constraints
 * - Timing Analysis: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1410385117325.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    clockSpecs,
    ioInterfaces = [],
    constraintFormat = 'SDC',
    targetDevice = 'Generic FPGA',
    outputDir = 'timing-constraints-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Timing Constraint Development for: ${designName}`);
  ctx.log('info', `Clocks: ${clockSpecs.length}, Format: ${constraintFormat}`);

  const clockConstraints = await ctx.task(clockConstraintsTask, { designName, clockSpecs, constraintFormat, outputDir });
  artifacts.push(...clockConstraints.artifacts);

  const generatedClocks = await ctx.task(generatedClocksTask, { designName, clockSpecs, clockConstraints, constraintFormat, outputDir });
  artifacts.push(...generatedClocks.artifacts);

  const ioConstraints = await ctx.task(ioConstraintsTask, { designName, ioInterfaces, clockSpecs, constraintFormat, outputDir });
  artifacts.push(...ioConstraints.artifacts);

  await ctx.breakpoint({
    question: `Clock and I/O constraints defined for ${designName}. ${clockConstraints.clockCount} clocks, ${ioConstraints.ioCount} I/O constraints. Review constraints?`,
    title: 'Timing Constraints Review',
    context: { runId: ctx.runId, designName, clockCount: clockConstraints.clockCount, ioCount: ioConstraints.ioCount }
  });

  const falsePaths = await ctx.task(falsePathsTask, { designName, clockSpecs, constraintFormat, outputDir });
  artifacts.push(...falsePaths.artifacts);

  const multicyclePaths = await ctx.task(multicyclePathsTask, { designName, clockSpecs, constraintFormat, outputDir });
  artifacts.push(...multicyclePaths.artifacts);

  const constraintValidation = await ctx.task(constraintValidationTask, { designName, clockConstraints, generatedClocks, ioConstraints, falsePaths, multicyclePaths, constraintFormat, outputDir });
  artifacts.push(...constraintValidation.artifacts);

  const constraintFile = await ctx.task(constraintFileTask, { designName, clockConstraints, generatedClocks, ioConstraints, falsePaths, multicyclePaths, constraintFormat, outputDir });
  artifacts.push(...constraintFile.artifacts);

  const endTime = ctx.now();

  return {
    success: constraintValidation.valid,
    designName,
    constraintFile: constraintFile.filePath,
    validationReport: { valid: constraintValidation.valid, warnings: constraintValidation.warnings, errors: constraintValidation.errors },
    coverageReport: { clocksCovered: clockConstraints.clockCount, iosCovered: ioConstraints.ioCount, exceptionsCovered: falsePaths.pathCount + multicyclePaths.pathCount },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/timing-constraints', timestamp: startTime, designName, outputDir }
  };
}

export const clockConstraintsTask = defineTask('clock-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clock Constraints - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Define primary clock constraints',
      context: args,
      instructions: ['1. Define create_clock for each primary clock', '2. Set clock period and waveform', '3. Define clock source (port or pin)', '4. Add clock uncertainty', '5. Define clock latency if needed', '6. Set clock groups', '7. Document clock requirements', '8. Verify clock definitions', '9. Add clock comments', '10. Create clock constraint file']
    },
    outputSchema: {
      type: 'object',
      required: ['clockCount', 'clockDefinitions', 'artifacts'],
      properties: { clockCount: { type: 'number' }, clockDefinitions: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'clocks']
}));

export const generatedClocksTask = defineTask('generated-clocks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generated Clocks - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Define generated clock constraints',
      context: args,
      instructions: ['1. Identify PLL/MMCM outputs', '2. Define create_generated_clock', '3. Set master clock reference', '4. Define multiply/divide factors', '5. Set phase shifts', '6. Define duty cycle', '7. Document clock relationships', '8. Verify derived frequencies', '9. Add clock group relationships', '10. Test generated clock constraints']
    },
    outputSchema: {
      type: 'object',
      required: ['generatedClockCount', 'artifacts'],
      properties: { generatedClockCount: { type: 'number' }, generatedClocks: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'generated-clocks']
}));

export const ioConstraintsTask = defineTask('io-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `I/O Constraints - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Define I/O timing constraints',
      context: args,
      instructions: ['1. Define set_input_delay for inputs', '2. Define set_output_delay for outputs', '3. Reference appropriate clocks', '4. Set max and min delays', '5. Handle DDR interfaces', '6. Add source-synchronous constraints', '7. Document timing budgets', '8. Add interface comments', '9. Verify I/O constraints', '10. Create I/O constraint section']
    },
    outputSchema: {
      type: 'object',
      required: ['ioCount', 'artifacts'],
      properties: { ioCount: { type: 'number' }, inputConstraints: { type: 'array', items: { type: 'object' } }, outputConstraints: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'io']
}));

export const falsePathsTask = defineTask('false-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `False Paths - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Define false path constraints',
      context: args,
      instructions: ['1. Identify asynchronous clock crossings', '2. Identify static configuration paths', '3. Define set_false_path constraints', '4. Use -from/-to/-through correctly', '5. Document path rationale', '6. Verify paths are truly false', '7. Avoid over-constraining', '8. Add comments', '9. Review with design team', '10. Create false path section']
    },
    outputSchema: {
      type: 'object',
      required: ['pathCount', 'artifacts'],
      properties: { pathCount: { type: 'number' }, falsePaths: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'false-paths']
}));

export const multicyclePathsTask = defineTask('multicycle-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `Multicycle Paths - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Define multicycle path constraints',
      context: args,
      instructions: ['1. Identify slow-to-fast clock paths', '2. Identify enable-gated paths', '3. Define set_multicycle_path -setup', '4. Define set_multicycle_path -hold', '5. Set correct path multiplier', '6. Document multicycle rationale', '7. Verify RTL matches constraint', '8. Add comments', '9. Review path behavior', '10. Create multicycle section']
    },
    outputSchema: {
      type: 'object',
      required: ['pathCount', 'artifacts'],
      properties: { pathCount: { type: 'number' }, multicyclePaths: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'multicycle']
}));

export const constraintValidationTask = defineTask('constraint-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Constraint Validation - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Validate timing constraints',
      context: args,
      instructions: ['1. Check constraint syntax', '2. Verify clock coverage', '3. Check I/O coverage', '4. Verify exception validity', '5. Check for conflicts', '6. Verify completeness', '7. Run constraint validation', '8. Fix errors and warnings', '9. Document validation results', '10. Create validation report']
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'warnings', 'errors', 'artifacts'],
      properties: { valid: { type: 'boolean' }, warnings: { type: 'array', items: { type: 'string' } }, errors: { type: 'array', items: { type: 'string' } }, coverage: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'validation']
}));

export const constraintFileTask = defineTask('constraint-file', (args, taskCtx) => ({
  kind: 'agent',
  title: `Constraint File - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Generate final constraint file',
      context: args,
      instructions: ['1. Organize constraints by section', '2. Add file header comments', '3. Include revision history', '4. Add section separators', '5. Include all clock constraints', '6. Include all I/O constraints', '7. Include all exceptions', '8. Add inline documentation', '9. Format consistently', '10. Generate final file']
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'artifacts'],
      properties: { filePath: { type: 'string' }, sections: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'constraints-file']
}));

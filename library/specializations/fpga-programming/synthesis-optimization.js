/**
 * @process specializations/fpga-programming/synthesis-optimization
 * @description Synthesis Optimization - Optimize RTL for synthesis to meet area, timing, and power goals. Apply
 * synthesis directives and attributes to guide tool optimization.
 * @inputs { designName: string, targetDevice: string, optimizationGoals?: object, synthesisToolset?: string, outputDir?: string }
 * @outputs { success: boolean, synthesisReport: object, optimizations: array, resourceUtilization: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/synthesis-optimization', {
 *   designName: 'video_processor',
 *   targetDevice: 'Xilinx Ultrascale+ XCVU9P',
 *   optimizationGoals: { targetFrequency: 300, maxLutUtilization: 70, powerBudget: 15 },
 *   synthesisToolset: 'Vivado'
 * });
 *
 * @references
 * - Vivado Synthesis: https://docs.amd.com/r/en-US/ug901-vivado-synthesis
 * - Quartus Synthesis: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
 * - Synthesis Best Practices: https://docs.amd.com/r/en-US/ug949-vivado-design-methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    targetDevice,
    optimizationGoals = { targetFrequency: 200, maxLutUtilization: 80, powerBudget: null },
    synthesisToolset = 'auto',
    hierarchyPreservation = 'balanced',
    outputDir = 'synthesis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Synthesis Optimization for: ${designName}`);
  ctx.log('info', `Target: ${targetDevice}, Frequency: ${optimizationGoals.targetFrequency}MHz`);

  const synthesisAnalysis = await ctx.task(synthesisAnalysisTask, { designName, targetDevice, optimizationGoals, synthesisToolset, outputDir });
  artifacts.push(...synthesisAnalysis.artifacts);

  const resourceOptimization = await ctx.task(resourceOptimizationTask, { designName, synthesisAnalysis, optimizationGoals, outputDir });
  artifacts.push(...resourceOptimization.artifacts);

  const timingOptimization = await ctx.task(timingOptimizationTask, { designName, synthesisAnalysis, optimizationGoals, outputDir });
  artifacts.push(...timingOptimization.artifacts);

  await ctx.breakpoint({
    question: `Initial synthesis complete for ${designName}. LUT: ${synthesisAnalysis.lutUtilization}%, Timing: ${timingOptimization.timingMet ? 'MET' : 'FAILED'}. Apply optimizations?`,
    title: 'Synthesis Analysis Review',
    context: { runId: ctx.runId, designName, lutUtilization: synthesisAnalysis.lutUtilization, timingMet: timingOptimization.timingMet }
  });

  const synthesisDirectives = await ctx.task(synthesisDirectivesTask, { designName, resourceOptimization, timingOptimization, targetDevice, outputDir });
  artifacts.push(...synthesisDirectives.artifacts);

  const dspBramInference = await ctx.task(dspBramInferenceTask, { designName, synthesisAnalysis, targetDevice, outputDir });
  artifacts.push(...dspBramInference.artifacts);

  const finalSynthesis = await ctx.task(finalSynthesisTask, { designName, synthesisDirectives, dspBramInference, optimizationGoals, outputDir });
  artifacts.push(...finalSynthesis.artifacts);

  const endTime = ctx.now();

  return {
    success: finalSynthesis.goalsAchieved,
    designName,
    synthesisReport: { toolset: synthesisToolset, targetDevice, timing: finalSynthesis.timing, power: finalSynthesis.power },
    optimizations: synthesisDirectives.appliedOptimizations,
    resourceUtilization: { lut: finalSynthesis.lutUtilization, ff: finalSynthesis.ffUtilization, bram: finalSynthesis.bramUtilization, dsp: finalSynthesis.dspUtilization },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/synthesis-optimization', timestamp: startTime, designName, outputDir }
  };
}

export const synthesisAnalysisTask = defineTask('synthesis-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synthesis Analysis - ${args.designName}`,
  agent: {
    name: 'synthesis-engineer',
    prompt: {
      role: 'FPGA Synthesis Engineer',
      task: 'Analyze initial synthesis results',
      context: args,
      instructions: ['1. Run initial synthesis', '2. Analyze resource utilization', '3. Identify high-fanout nets', '4. Identify critical paths', '5. Check inference results', '6. Analyze hierarchy', '7. Review warnings', '8. Identify optimization targets', '9. Document findings', '10. Create analysis report']
    },
    outputSchema: {
      type: 'object',
      required: ['lutUtilization', 'ffUtilization', 'artifacts'],
      properties: { lutUtilization: { type: 'string' }, ffUtilization: { type: 'string' }, bramUtilization: { type: 'string' }, dspUtilization: { type: 'string' }, criticalPaths: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'synthesis', 'analysis']
}));

export const resourceOptimizationTask = defineTask('resource-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resource Optimization - ${args.designName}`,
  agent: {
    name: 'synthesis-engineer',
    prompt: {
      role: 'FPGA Synthesis Engineer',
      task: 'Optimize resource utilization',
      context: args,
      instructions: ['1. Identify resource-heavy modules', '2. Apply resource sharing', '3. Optimize FSM encoding', '4. Apply retiming', '5. Optimize multiplexers', '6. Reduce logic duplication', '7. Apply keep attributes', '8. Optimize memories', '9. Document optimizations', '10. Verify functionality']
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: { optimizations: { type: 'array', items: { type: 'object' } }, savingsEstimate: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'synthesis', 'resources']
}));

export const timingOptimizationTask = defineTask('timing-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Timing Optimization - ${args.designName}`,
  agent: {
    name: 'synthesis-engineer',
    prompt: {
      role: 'FPGA Synthesis Engineer',
      task: 'Optimize for timing closure',
      context: args,
      instructions: ['1. Analyze critical paths', '2. Apply pipelining', '3. Restructure logic', '4. Apply register retiming', '5. Optimize carry chains', '6. Reduce fanout', '7. Apply synthesis strategies', '8. Use physical synthesis', '9. Document timing fixes', '10. Verify timing improvement']
    },
    outputSchema: {
      type: 'object',
      required: ['timingMet', 'artifacts'],
      properties: { timingMet: { type: 'boolean' }, worstSlack: { type: 'number' }, criticalPathFixes: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'synthesis', 'timing']
}));

export const synthesisDirectivesTask = defineTask('synthesis-directives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synthesis Directives - ${args.designName}`,
  agent: {
    name: 'synthesis-engineer',
    prompt: {
      role: 'FPGA Synthesis Engineer',
      task: 'Apply synthesis directives',
      context: args,
      instructions: ['1. Add keep attributes', '2. Configure FSM encoding', '3. Add max_fanout constraints', '4. Configure RAM style', '5. Configure DSP usage', '6. Add hierarchy preservation', '7. Configure register duplication', '8. Add IO register attributes', '9. Document directives', '10. Verify directive effects']
    },
    outputSchema: {
      type: 'object',
      required: ['appliedOptimizations', 'artifacts'],
      properties: { appliedOptimizations: { type: 'array', items: { type: 'object' } }, directivesFile: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'synthesis', 'directives']
}));

export const dspBramInferenceTask = defineTask('dsp-bram-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: `DSP/BRAM Inference - ${args.designName}`,
  agent: {
    name: 'synthesis-engineer',
    prompt: {
      role: 'FPGA Synthesis Engineer',
      task: 'Optimize DSP and BRAM inference',
      context: args,
      instructions: ['1. Analyze arithmetic operations', '2. Guide DSP inference', '3. Configure DSP pipelining', '4. Analyze memory structures', '5. Guide BRAM inference', '6. Configure BRAM output registers', '7. Balance DSP/BRAM usage', '8. Apply inference attributes', '9. Document inference', '10. Verify inference results']
    },
    outputSchema: {
      type: 'object',
      required: ['dspInference', 'bramInference', 'artifacts'],
      properties: { dspInference: { type: 'object' }, bramInference: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'synthesis', 'dsp', 'bram']
}));

export const finalSynthesisTask = defineTask('final-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Final Synthesis - ${args.designName}`,
  agent: {
    name: 'synthesis-engineer',
    prompt: {
      role: 'FPGA Synthesis Engineer',
      task: 'Run final optimized synthesis',
      context: args,
      instructions: ['1. Apply all optimizations', '2. Run synthesis', '3. Verify timing closure', '4. Check resource utilization', '5. Verify power estimates', '6. Compare to goals', '7. Generate reports', '8. Document final results', '9. Create sign-off checklist', '10. Archive synthesis outputs']
    },
    outputSchema: {
      type: 'object',
      required: ['goalsAchieved', 'lutUtilization', 'timing', 'artifacts'],
      properties: { goalsAchieved: { type: 'boolean' }, lutUtilization: { type: 'string' }, ffUtilization: { type: 'string' }, bramUtilization: { type: 'string' }, dspUtilization: { type: 'string' }, timing: { type: 'object' }, power: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'synthesis', 'final']
}));

/**
 * @process specializations/fpga-programming/timing-closure
 * @description Timing Closure Strategies - Achieve timing closure through systematic analysis and optimization
 * techniques. Apply RTL modifications, constraint refinements, and tool directives to meet timing requirements.
 * @inputs { designName: string, targetFrequency: number, currentSlack?: number, targetDevice: string, outputDir?: string }
 * @outputs { success: boolean, timingReport: object, appliedStrategies: array, closureStatus: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/timing-closure', {
 *   designName: 'high_speed_dsp',
 *   targetFrequency: 500,
 *   currentSlack: -0.5,
 *   targetDevice: 'Xilinx Ultrascale+ XCVU13P'
 * });
 *
 * @references
 * - UltraFast Design Methodology: https://docs.amd.com/r/en-US/ug949-vivado-design-methodology
 * - Timing Closure: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1410385117325.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    targetFrequency,
    currentSlack = null,
    targetDevice,
    maxIterations = 5,
    outputDir = 'timing-closure-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Timing Closure for: ${designName}`);
  ctx.log('info', `Target: ${targetFrequency}MHz on ${targetDevice}`);

  const timingAnalysis = await ctx.task(timingAnalysisTask, { designName, targetFrequency, targetDevice, outputDir });
  artifacts.push(...timingAnalysis.artifacts);

  const criticalPathAnalysis = await ctx.task(criticalPathAnalysisTask, { designName, timingAnalysis, outputDir });
  artifacts.push(...criticalPathAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Critical path analysis complete. Worst slack: ${criticalPathAnalysis.worstSlack}ns. ${criticalPathAnalysis.failingPaths} failing paths. Proceed with timing closure strategies?`,
    title: 'Critical Path Analysis',
    context: { runId: ctx.runId, designName, worstSlack: criticalPathAnalysis.worstSlack, failingPaths: criticalPathAnalysis.failingPaths }
  });

  const rtlOptimizations = await ctx.task(rtlOptimizationsTask, { designName, criticalPathAnalysis, outputDir });
  artifacts.push(...rtlOptimizations.artifacts);

  const constraintRefinement = await ctx.task(constraintRefinementTask, { designName, criticalPathAnalysis, outputDir });
  artifacts.push(...constraintRefinement.artifacts);

  const physicalOptimization = await ctx.task(physicalOptimizationTask, { designName, criticalPathAnalysis, targetDevice, outputDir });
  artifacts.push(...physicalOptimization.artifacts);

  const incrementalCompilation = await ctx.task(incrementalCompilationTask, { designName, rtlOptimizations, constraintRefinement, physicalOptimization, outputDir });
  artifacts.push(...incrementalCompilation.artifacts);

  const finalTimingVerification = await ctx.task(finalTimingVerificationTask, { designName, targetFrequency, incrementalCompilation, outputDir });
  artifacts.push(...finalTimingVerification.artifacts);

  const endTime = ctx.now();
  const timingMet = finalTimingVerification.worstSlack >= 0;

  return {
    success: timingMet,
    designName,
    timingReport: { targetFrequency, achievedSlack: finalTimingVerification.worstSlack, timingMet, iterations: incrementalCompilation.iterations },
    appliedStrategies: [...rtlOptimizations.strategies, ...constraintRefinement.strategies, ...physicalOptimization.strategies],
    closureStatus: timingMet ? 'TIMING_MET' : 'TIMING_FAILED',
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/timing-closure', timestamp: startTime, designName, outputDir }
  };
}

export const timingAnalysisTask = defineTask('timing-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Timing Analysis - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Perform timing analysis',
      context: args,
      instructions: ['1. Run static timing analysis', '2. Generate timing summary', '3. Identify failing paths', '4. Analyze clock skew', '5. Check setup violations', '6. Check hold violations', '7. Analyze inter-clock paths', '8. Document timing status', '9. Create timing report', '10. Identify closure strategy']
    },
    outputSchema: {
      type: 'object',
      required: ['worstSetupSlack', 'worstHoldSlack', 'artifacts'],
      properties: { worstSetupSlack: { type: 'number' }, worstHoldSlack: { type: 'number' }, failingEndpoints: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'analysis']
}));

export const criticalPathAnalysisTask = defineTask('critical-path-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Critical Path Analysis - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Analyze critical paths',
      context: args,
      instructions: ['1. Extract top critical paths', '2. Analyze path components', '3. Identify logic levels', '4. Analyze routing delays', '5. Identify path patterns', '6. Categorize path types', '7. Find optimization targets', '8. Document path details', '9. Prioritize fixes', '10. Create analysis report']
    },
    outputSchema: {
      type: 'object',
      required: ['worstSlack', 'failingPaths', 'artifacts'],
      properties: { worstSlack: { type: 'number' }, failingPaths: { type: 'number' }, criticalPaths: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'critical-paths']
}));

export const rtlOptimizationsTask = defineTask('rtl-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `RTL Optimizations - ${args.designName}`,
  agent: {
    name: 'fpga-engineer',
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Apply RTL timing optimizations',
      context: args,
      instructions: ['1. Add pipeline stages', '2. Restructure logic', '3. Apply register retiming', '4. Balance logic paths', '5. Reduce fanout', '6. Optimize multiplexers', '7. Use DSP pipelining', '8. Verify functionality', '9. Document changes', '10. Test optimizations']
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: { strategies: { type: 'array', items: { type: 'object' } }, estimatedImprovement: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'rtl-optimization']
}));

export const constraintRefinementTask = defineTask('constraint-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Constraint Refinement - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Refine timing constraints',
      context: args,
      instructions: ['1. Review constraint accuracy', '2. Add missing exceptions', '3. Refine clock uncertainty', '4. Adjust I/O delays', '5. Add physical constraints', '6. Refine false paths', '7. Add max_delay constraints', '8. Document refinements', '9. Validate constraints', '10. Test constraint impact']
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: { strategies: { type: 'array', items: { type: 'object' } }, constraintChanges: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'constraints']
}));

export const physicalOptimizationTask = defineTask('physical-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Physical Optimization - ${args.designName}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'FPGA Implementation Engineer',
      task: 'Apply physical optimizations',
      context: args,
      instructions: ['1. Apply placement constraints', '2. Use floorplanning', '3. Apply routing directives', '4. Use physical synthesis', '5. Apply post-route optimization', '6. Optimize congestion', '7. Use incremental placement', '8. Document physical changes', '9. Verify placement quality', '10. Test optimization results']
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: { strategies: { type: 'array', items: { type: 'object' } }, placementChanges: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'physical']
}));

export const incrementalCompilationTask = defineTask('incremental-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Incremental Compilation - ${args.designName}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'FPGA Implementation Engineer',
      task: 'Run incremental compilation',
      context: args,
      instructions: ['1. Apply optimizations', '2. Run incremental synthesis', '3. Run incremental implementation', '4. Preserve timing-met blocks', '5. Focus on failing paths', '6. Monitor improvement', '7. Iterate if needed', '8. Track convergence', '9. Document iterations', '10. Generate iteration report']
    },
    outputSchema: {
      type: 'object',
      required: ['iterations', 'improvementHistory', 'artifacts'],
      properties: { iterations: { type: 'number' }, improvementHistory: { type: 'array', items: { type: 'object' } }, finalSlack: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'incremental']
}));

export const finalTimingVerificationTask = defineTask('final-timing-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Final Timing Verification - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Verify final timing results',
      context: args,
      instructions: ['1. Run final timing analysis', '2. Verify all constraints met', '3. Check all clock domains', '4. Verify hold timing', '5. Check pulse width', '6. Generate sign-off report', '7. Document any waivers', '8. Create timing summary', '9. Archive timing data', '10. Generate final report']
    },
    outputSchema: {
      type: 'object',
      required: ['worstSlack', 'timingMet', 'artifacts'],
      properties: { worstSlack: { type: 'number' }, timingMet: { type: 'boolean' }, allDomainsMet: { type: 'boolean' }, signOffReport: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'timing', 'verification']
}));

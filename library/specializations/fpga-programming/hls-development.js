/**
 * @process specializations/fpga-programming/hls-development
 * @description High-Level Synthesis Development - Develop hardware accelerators using C/C++ with HLS tools. Optimize
 * algorithms for hardware implementation with pipelining, loop unrolling, and memory optimization directives.
 * @inputs { designName: string, algorithmFile: string, targetDevice: string, targetLatency?: number, targetThroughput?: number, outputDir?: string }
 * @outputs { success: boolean, hlsDesign: object, synthesisReport: object, rtlOutput: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/hls-development', {
 *   designName: 'fft_accelerator',
 *   algorithmFile: 'src/fft.cpp',
 *   targetDevice: 'Xilinx Alveo U250',
 *   targetLatency: 1000,
 *   targetThroughput: 1000000
 * });
 *
 * @references
 * - Vitis HLS Guide: https://docs.amd.com/r/en-US/ug1399-vitis-hls
 * - Intel HLS Compiler: https://www.intel.com/content/www/us/en/software/programmable/quartus-prime/hls-compiler.html
 * - HLS Best Practices: https://docs.amd.com/r/en-US/ug1399-vitis-hls/Best-Practices-for-HLS
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    algorithmFile,
    targetDevice,
    targetLatency = null,
    targetThroughput = null,
    optimizationLevel = 'balanced',
    outputDir = 'hls-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HLS Development for: ${designName}`);
  ctx.log('info', `Algorithm: ${algorithmFile}, Target: ${targetDevice}`);

  const algorithmAnalysis = await ctx.task(algorithmAnalysisTask, { designName, algorithmFile, targetLatency, targetThroughput, outputDir });
  artifacts.push(...algorithmAnalysis.artifacts);

  const codeRefactoring = await ctx.task(codeRefactoringTask, { designName, algorithmAnalysis, optimizationLevel, outputDir });
  artifacts.push(...codeRefactoring.artifacts);

  const directiveOptimization = await ctx.task(directiveOptimizationTask, { designName, codeRefactoring, targetLatency, targetThroughput, outputDir });
  artifacts.push(...directiveOptimization.artifacts);

  await ctx.breakpoint({
    question: `HLS code optimized for ${designName}. ${directiveOptimization.directiveCount} directives applied, estimated II: ${directiveOptimization.estimatedII}. Review HLS design?`,
    title: 'HLS Design Review',
    context: { runId: ctx.runId, designName, directives: directiveOptimization.directiveCount, estimatedII: directiveOptimization.estimatedII }
  });

  const interfaceSynthesis = await ctx.task(interfaceSynthesisTask, { designName, directiveOptimization, outputDir });
  artifacts.push(...interfaceSynthesis.artifacts);

  const hlsSynthesis = await ctx.task(hlsSynthesisTask, { designName, directiveOptimization, interfaceSynthesis, targetDevice, outputDir });
  artifacts.push(...hlsSynthesis.artifacts);

  const hlsVerification = await ctx.task(hlsVerificationTask, { designName, algorithmFile, hlsSynthesis, outputDir });
  artifacts.push(...hlsVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: hlsVerification.passed,
    designName,
    hlsDesign: { algorithm: algorithmFile, directives: directiveOptimization.directives, interfaces: interfaceSynthesis.interfaces },
    synthesisReport: hlsSynthesis.report,
    rtlOutput: { path: hlsSynthesis.rtlPath, resources: hlsSynthesis.resources },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/hls-development', timestamp: startTime, designName, outputDir }
  };
}

export const algorithmAnalysisTask = defineTask('algorithm-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Algorithm Analysis - ${args.designName}`,
  agent: {
    name: 'hls-engineer',
    prompt: {
      role: 'HLS Design Engineer',
      task: 'Analyze algorithm for HLS',
      context: args,
      instructions: ['1. Parse C/C++ algorithm', '2. Identify compute loops', '3. Analyze data dependencies', '4. Identify memory access patterns', '5. Calculate theoretical throughput', '6. Identify parallelization opportunities', '7. Document bottlenecks', '8. Create dataflow graph', '9. Estimate resource usage', '10. Recommend optimizations']
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: { analysis: { type: 'object' }, loops: { type: 'array', items: { type: 'object' } }, bottlenecks: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'hls', 'analysis']
}));

export const codeRefactoringTask = defineTask('code-refactoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Code Refactoring - ${args.designName}`,
  agent: {
    name: 'hls-engineer',
    prompt: {
      role: 'HLS Design Engineer',
      task: 'Refactor code for HLS',
      context: args,
      instructions: ['1. Remove dynamic memory', '2. Convert to fixed-point if needed', '3. Flatten nested structures', '4. Extract loop bodies', '5. Add interface pragmas', '6. Optimize array accesses', '7. Remove recursion', '8. Document changes', '9. Test functional equivalence', '10. Prepare for synthesis']
    },
    outputSchema: {
      type: 'object',
      required: ['refactoredCode', 'artifacts'],
      properties: { refactoredCode: { type: 'string' }, changes: { type: 'array', items: { type: 'object' } }, functionallyEquivalent: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'hls', 'refactoring']
}));

export const directiveOptimizationTask = defineTask('directive-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Directive Optimization - ${args.designName}`,
  agent: {
    name: 'hls-engineer',
    prompt: {
      role: 'HLS Design Engineer',
      task: 'Optimize HLS directives',
      context: args,
      instructions: ['1. Apply pipeline directives', '2. Configure loop unrolling', '3. Set array partitioning', '4. Configure dataflow', '5. Set inline directives', '6. Configure stream depth', '7. Set latency constraints', '8. Document directive rationale', '9. Run quick synthesis', '10. Iterate on directives']
    },
    outputSchema: {
      type: 'object',
      required: ['directiveCount', 'directives', 'estimatedII', 'artifacts'],
      properties: { directiveCount: { type: 'number' }, directives: { type: 'array', items: { type: 'object' } }, estimatedII: { type: 'number' }, estimatedLatency: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'hls', 'directives']
}));

export const interfaceSynthesisTask = defineTask('interface-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interface Synthesis - ${args.designName}`,
  agent: {
    name: 'hls-engineer',
    prompt: {
      role: 'HLS Design Engineer',
      task: 'Configure HLS interfaces',
      context: args,
      instructions: ['1. Define AXI-MM interfaces', '2. Define AXI-Stream interfaces', '3. Configure AXI-Lite control', '4. Set interface bundles', '5. Configure memory ports', '6. Set interface depth', '7. Add register interfaces', '8. Document interfaces', '9. Generate interface spec', '10. Verify connectivity']
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'artifacts'],
      properties: { interfaces: { type: 'array', items: { type: 'object' } }, interfaceSpec: { type: 'string' }, bundles: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'hls', 'interface']
}));

export const hlsSynthesisTask = defineTask('hls-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `HLS Synthesis - ${args.designName}`,
  agent: {
    name: 'hls-engineer',
    prompt: {
      role: 'HLS Design Engineer',
      task: 'Run HLS synthesis',
      context: args,
      instructions: ['1. Configure synthesis settings', '2. Run C synthesis', '3. Analyze synthesis report', '4. Check resource estimates', '5. Verify timing estimates', '6. Check latency/II', '7. Export RTL', '8. Document synthesis results', '9. Archive reports', '10. Prepare for implementation']
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'rtlPath', 'resources', 'artifacts'],
      properties: { report: { type: 'object' }, rtlPath: { type: 'string' }, resources: { type: 'object' }, timing: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'hls', 'synthesis']
}));

export const hlsVerificationTask = defineTask('hls-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `HLS Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'HLS Verification Engineer',
      task: 'Verify HLS design',
      context: args,
      instructions: ['1. Run C simulation', '2. Run C/RTL co-simulation', '3. Verify functional correctness', '4. Check latency', '5. Verify throughput', '6. Test corner cases', '7. Compare with golden reference', '8. Check interface behavior', '9. Document results', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, csimResults: { type: 'object' }, cosimResults: { type: 'object' }, latencyMeasured: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'hls', 'verification']
}));

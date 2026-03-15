/**
 * @process specializations/algorithms-optimization/code-level-optimization
 * @description Code-Level Performance Optimization - Micro-optimization process including cache optimization,
 * avoiding redundant computation, using appropriate data structures, and language-specific optimizations.
 * @inputs { code: string, language: string, targetMetric?: string }
 * @outputs { success: boolean, optimizedCode: string, improvements: array, benchmarks: object, artifacts: array }
 *
 * @references
 * - Performance Optimization Guides
 * - Language-Specific Optimization Techniques
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { code, language, targetMetric = 'speed', outputDir = 'code-optimization-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Code-Level Optimization - Target: ${targetMetric}`);

  const profiling = await ctx.task(codeProfilingTask, { code, language, outputDir });
  artifacts.push(...profiling.artifacts);

  const optimization = await ctx.task(microOptimizationTask, { code, language, profiling, targetMetric, outputDir });
  artifacts.push(...optimization.artifacts);

  const benchmarking = await ctx.task(benchmarkingTask, { code, optimizedCode: optimization.code, language, outputDir });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Code optimization complete. Improvement: ${benchmarking.improvement}%. Review optimized code?`,
    title: 'Code Optimization Complete',
    context: { runId: ctx.runId, improvement: benchmarking.improvement, techniques: optimization.techniques }
  });

  return {
    success: true,
    optimizedCode: optimization.code,
    improvements: optimization.techniques,
    benchmarks: benchmarking.results,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const codeProfilingTask = defineTask('code-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Profile Code',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Performance Engineer',
      task: 'Profile code to identify optimization opportunities',
      context: args,
      instructions: ['1. Identify hot paths', '2. Find redundant computations', '3. Check memory access patterns', '4. Document findings'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['hotspots', 'opportunities', 'artifacts'],
      properties: { hotspots: { type: 'array' }, opportunities: { type: 'array' }, memoryIssues: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'code-optimization', 'profiling']
}));

export const microOptimizationTask = defineTask('micro-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Micro-Optimizations',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Performance Engineer',
      task: 'Apply code-level optimizations',
      context: args,
      instructions: ['1. Hoist loop invariants', '2. Optimize memory access', '3. Use appropriate data structures', '4. Apply language-specific tricks'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'techniques', 'artifacts'],
      properties: { code: { type: 'string' }, techniques: { type: 'array' }, changes: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'code-optimization', 'micro']
}));

export const benchmarkingTask = defineTask('benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark Optimizations',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Performance Tester',
      task: 'Benchmark original vs optimized code',
      context: args,
      instructions: ['1. Create benchmark tests', '2. Run both versions', '3. Compare results', '4. Calculate improvement'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'improvement', 'artifacts'],
      properties: { results: { type: 'object' }, improvement: { type: 'number' }, comparison: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'code-optimization', 'benchmarking']
}));

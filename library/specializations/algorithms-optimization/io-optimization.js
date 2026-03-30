/**
 * @process specializations/algorithms-optimization/io-optimization
 * @description I/O Optimization for Competitive Programming - Process for implementing fast I/O techniques
 * (C++ sync_with_stdio, cin.tie, Python sys.stdin, Java BufferedReader) and batch processing for large inputs.
 * @inputs { language: string, inputSize?: number }
 * @outputs { success: boolean, optimizedTemplate: string, speedup: number, artifacts: array }
 *
 * @references
 * - Fast I/O Techniques for Competitive Programming
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { language, inputSize = 100000, outputDir = 'io-optimization-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Optimizing I/O for ${language}`);

  const analysis = await ctx.task(ioAnalysisTask, { language, inputSize, outputDir });
  artifacts.push(...analysis.artifacts);

  const implementation = await ctx.task(fastIOImplementationTask, { language, analysis, outputDir });
  artifacts.push(...implementation.artifacts);

  const benchmarking = await ctx.task(ioBenchmarkingTask, { language, implementation, inputSize, outputDir });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `I/O optimization complete for ${language}. Speedup: ${benchmarking.speedup}x. Review template?`,
    title: 'I/O Optimization Complete',
    context: { runId: ctx.runId, language, speedup: benchmarking.speedup }
  });

  return {
    success: true,
    optimizedTemplate: implementation.template,
    speedup: benchmarking.speedup,
    techniques: analysis.techniques,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const ioAnalysisTask = defineTask('io-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze I/O - ${args.language}`,
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Competitive Programming Expert',
      task: 'Analyze I/O optimization opportunities for language',
      context: args,
      instructions: ['1. Identify default I/O bottlenecks', '2. List optimization techniques', '3. Prioritize by impact', '4. Document analysis'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'artifacts'],
      properties: { techniques: { type: 'array' }, bottlenecks: { type: 'array' }, expectedSpeedup: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'io-optimization', 'analysis']
}));

export const fastIOImplementationTask = defineTask('fast-io-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Fast I/O - ${args.language}`,
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Competitive Programming Expert',
      task: 'Implement fast I/O template',
      context: args,
      instructions: ['1. Implement fast input', '2. Implement fast output', '3. Create reusable template', '4. Document usage'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'artifacts'],
      properties: { template: { type: 'string' }, inputFunction: { type: 'string' }, outputFunction: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'io-optimization', 'implementation']
}));

export const ioBenchmarkingTask = defineTask('io-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark I/O',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Performance Tester',
      task: 'Benchmark I/O optimizations',
      context: args,
      instructions: ['1. Generate test input', '2. Benchmark default I/O', '3. Benchmark optimized I/O', '4. Calculate speedup'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['speedup', 'artifacts'],
      properties: { speedup: { type: 'number' }, defaultTime: { type: 'number' }, optimizedTime: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'io-optimization', 'benchmarking']
}));

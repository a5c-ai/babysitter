/**
 * @process specializations/algorithms-optimization/memory-optimization
 * @description Memory Optimization and Space Complexity Reduction - Systematic approach to reducing space complexity
 * through rolling arrays, in-place algorithms, bit manipulation, and space-efficient data structures.
 * @inputs { algorithm: string, currentSpaceComplexity: string }
 * @outputs { success: boolean, optimizedAlgorithm: string, newSpaceComplexity: string, techniques: array, artifacts: array }
 *
 * @references
 * - Space Optimization Techniques
 * - Memory-Efficient Algorithms
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { algorithm, currentSpaceComplexity, language = 'cpp', outputDir = 'memory-optimization-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Optimizing Memory for ${algorithm}`);

  const analysis = await ctx.task(memoryAnalysisTask, { algorithm, currentSpaceComplexity, outputDir });
  artifacts.push(...analysis.artifacts);

  const optimization = await ctx.task(spaceReductionTask, { algorithm, analysis, outputDir });
  artifacts.push(...optimization.artifacts);

  const implementation = await ctx.task(memoryOptimizedImplementationTask, { optimization, language, outputDir });
  artifacts.push(...implementation.artifacts);

  await ctx.breakpoint({
    question: `Memory optimization complete. ${currentSpaceComplexity} -> ${optimization.newComplexity}. Review?`,
    title: 'Memory Optimization Complete',
    context: { runId: ctx.runId, original: currentSpaceComplexity, optimized: optimization.newComplexity }
  });

  return {
    success: true,
    optimizedAlgorithm: implementation.code,
    newSpaceComplexity: optimization.newComplexity,
    techniques: optimization.techniques,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const memoryAnalysisTask = defineTask('memory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Memory Usage',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Memory Optimization Expert',
      task: 'Analyze algorithm memory usage',
      context: args,
      instructions: ['1. Identify memory allocations', '2. Find unnecessary storage', '3. Check for memory leaks', '4. Document findings'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['allocations', 'opportunities', 'artifacts'],
      properties: { allocations: { type: 'array' }, opportunities: { type: 'array' }, wastedSpace: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'memory-optimization', 'analysis']
}));

export const spaceReductionTask = defineTask('space-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Space Reduction',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Memory Optimization Expert',
      task: 'Apply space reduction techniques',
      context: args,
      instructions: ['1. Apply rolling array technique', '2. Use in-place modifications', '3. Apply bit manipulation', '4. Document techniques'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'newComplexity', 'artifacts'],
      properties: { techniques: { type: 'array' }, newComplexity: { type: 'string' }, changes: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'memory-optimization', 'reduction']
}));

export const memoryOptimizedImplementationTask = defineTask('memory-optimized-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Optimized Version',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement memory-optimized algorithm',
      context: args,
      instructions: ['1. Implement optimized version', '2. Verify correctness', '3. Measure memory usage', '4. Document implementation'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, memoryUsage: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'memory-optimization', 'implementation']
}));

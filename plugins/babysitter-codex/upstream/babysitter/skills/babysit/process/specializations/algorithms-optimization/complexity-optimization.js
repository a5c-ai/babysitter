/**
 * @process specializations/algorithms-optimization/complexity-optimization
 * @description Algorithm Complexity Analysis and Optimization - Process for analyzing time/space complexity,
 * identifying bottlenecks, and optimizing algorithms through better algorithmic approaches.
 * @inputs { algorithm: string, currentComplexity?: object, targetComplexity?: object }
 * @outputs { success: boolean, analysis: object, optimizations: array, newComplexity: object, artifacts: array }
 *
 * @references
 * - Big-O Analysis, Complexity Theory
 * - Algorithm Optimization Techniques
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { algorithm, currentComplexity = {}, targetComplexity = null, outputDir = 'complexity-optimization-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Complexity Optimization for ${algorithm}`);

  const analysis = await ctx.task(complexityAnalysisTask, { algorithm, currentComplexity, outputDir });
  artifacts.push(...analysis.artifacts);

  const bottlenecks = await ctx.task(bottleneckIdentificationTask, { algorithm, analysis, outputDir });
  artifacts.push(...bottlenecks.artifacts);

  const optimizations = await ctx.task(algorithmicOptimizationTask, { algorithm, bottlenecks, targetComplexity, outputDir });
  artifacts.push(...optimizations.artifacts);

  const verification = await ctx.task(complexityVerificationTask, { algorithm, optimizations, outputDir });
  artifacts.push(...verification.artifacts);

  await ctx.breakpoint({
    question: `Optimization complete. Original: O(${analysis.timeComplexity}) -> New: O(${verification.newTimeComplexity}). Review?`,
    title: 'Complexity Optimization Complete',
    context: { runId: ctx.runId, original: analysis.timeComplexity, optimized: verification.newTimeComplexity }
  });

  return {
    success: true,
    analysis: { original: analysis, bottlenecks: bottlenecks.identified },
    optimizations: optimizations.applied,
    newComplexity: { time: verification.newTimeComplexity, space: verification.newSpaceComplexity },
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const complexityAnalysisTask = defineTask('complexity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Complexity - ${args.algorithm}`,
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Complexity Analyst',
      task: 'Analyze algorithm time and space complexity',
      context: args,
      instructions: ['1. Analyze time complexity', '2. Analyze space complexity', '3. Identify dominant terms', '4. Document analysis'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['timeComplexity', 'spaceComplexity', 'artifacts'],
      properties: { timeComplexity: { type: 'string' }, spaceComplexity: { type: 'string' }, breakdown: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'complexity', 'analysis']
}));

export const bottleneckIdentificationTask = defineTask('bottleneck-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Bottlenecks',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Performance Analyst',
      task: 'Identify algorithmic bottlenecks',
      context: args,
      instructions: ['1. Find highest complexity operations', '2. Identify inefficiencies', '3. Rank by impact', '4. Document bottlenecks'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['identified', 'artifacts'],
      properties: { identified: { type: 'array' }, ranking: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'complexity', 'bottlenecks']
}));

export const algorithmicOptimizationTask = defineTask('algorithmic-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Algorithmic Optimizations',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Algorithm Optimizer',
      task: 'Apply algorithmic optimizations',
      context: args,
      instructions: ['1. Consider better algorithms', '2. Consider better data structures', '3. Apply optimizations', '4. Document changes'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['applied', 'artifacts'],
      properties: { applied: { type: 'array' }, newAlgorithm: { type: 'string' }, improvements: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'complexity', 'optimization']
}));

export const complexityVerificationTask = defineTask('complexity-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify New Complexity',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Complexity Analyst',
      task: 'Verify optimized complexity',
      context: args,
      instructions: ['1. Analyze new complexity', '2. Verify improvements', '3. Benchmark if possible', '4. Document results'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['newTimeComplexity', 'newSpaceComplexity', 'artifacts'],
      properties: { newTimeComplexity: { type: 'string' }, newSpaceComplexity: { type: 'string' }, improvement: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'complexity', 'verification']
}));

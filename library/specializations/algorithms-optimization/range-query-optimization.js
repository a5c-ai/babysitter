/**
 * @process specializations/algorithms-optimization/range-query-optimization
 * @description Range Query Problem Optimization - Selecting optimal data structure and approach for range query
 * problems (sparse table for static arrays, sqrt decomposition for moderate updates, segment trees for frequent updates).
 * @inputs { queryType: string, updateFrequency?: string, arraySize?: number }
 * @outputs { success: boolean, recommendation: string, implementation: string, artifacts: array }
 *
 * @references
 * - Range Query Structures Comparison
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { queryType, updateFrequency = 'none', arraySize = 100000, language = 'cpp', outputDir = 'range-query-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Optimizing Range Query - Type: ${queryType}, Updates: ${updateFrequency}`);

  const analysis = await ctx.task(rangeQueryAnalysisTask, { queryType, updateFrequency, arraySize, outputDir });
  artifacts.push(...analysis.artifacts);

  const implementation = await ctx.task(rangeQueryImplementationTask, { analysis, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const comparison = await ctx.task(rangeQueryComparisonTask, { queryType, implementation, outputDir });
  artifacts.push(...comparison.artifacts);

  await ctx.breakpoint({
    question: `Range query optimization complete. Recommended: ${analysis.recommendation}. Review?`,
    title: 'Range Query Optimization Complete',
    context: { runId: ctx.runId, recommendation: analysis.recommendation, complexity: analysis.complexity }
  });

  return {
    success: true,
    queryType,
    recommendation: analysis.recommendation,
    implementation: implementation.code,
    comparison: comparison.results,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const rangeQueryAnalysisTask = defineTask('range-query-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Range Query Requirements',
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Data Structure Expert',
      task: 'Analyze requirements and recommend data structure',
      context: args,
      instructions: ['1. Analyze query type', '2. Consider update frequency', '3. Consider array size', '4. Compare options', '5. Recommend optimal structure'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'complexity', 'artifacts'],
      properties: { recommendation: { type: 'string' }, complexity: { type: 'object' }, alternatives: { type: 'array' }, justification: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'range-query', 'analysis']
}));

export const rangeQueryImplementationTask = defineTask('range-query-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Range Query Structure',
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement recommended data structure',
      context: args,
      instructions: ['1. Implement recommended structure', '2. Implement query operation', '3. Implement update if needed', '4. Optimize implementation'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, operations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'range-query', 'implementation']
}));

export const rangeQueryComparisonTask = defineTask('range-query-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare Range Query Approaches',
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Performance Analyst',
      task: 'Compare different range query approaches',
      context: args,
      instructions: ['1. Benchmark implemented solution', '2. Compare to alternatives', '3. Analyze trade-offs', '4. Document comparison'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: { results: { type: 'object' }, tradeoffs: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'range-query', 'comparison']
}));

/**
 * @process specializations/algorithms-optimization/divide-conquer-design
 * @description Divide and Conquer Algorithm Design - Process for designing divide and conquer algorithms,
 * analyzing recurrence relations using Master theorem, and implementing efficient recursive solutions.
 * @inputs { problemStatement: string }
 * @outputs { success: boolean, division: object, recurrence: string, implementation: string, artifacts: array }
 *
 * @references
 * - Divide and Conquer: CLRS Chapter 4
 * - Master Theorem Analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemStatement, language = 'python', outputDir = 'divide-conquer-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Designing Divide and Conquer Algorithm');

  const design = await ctx.task(divideConquerDesignTask, { problemStatement, outputDir });
  artifacts.push(...design.artifacts);

  const analysis = await ctx.task(recurrenceAnalysisTask, { design, outputDir });
  artifacts.push(...analysis.artifacts);

  const implementation = await ctx.task(divideConquerImplementationTask, { design, language, outputDir });
  artifacts.push(...implementation.artifacts);

  await ctx.breakpoint({
    question: `Divide and Conquer algorithm designed. Recurrence: ${analysis.recurrence}. Complexity: ${analysis.complexity}. Review?`,
    title: 'Divide and Conquer Complete',
    context: { runId: ctx.runId, recurrence: analysis.recurrence, complexity: analysis.complexity }
  });

  return {
    success: true,
    division: design.divisionStrategy,
    recurrence: analysis.recurrence,
    complexity: analysis.complexity,
    implementation: implementation.code,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const divideConquerDesignTask = defineTask('divide-conquer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Divide and Conquer',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Designer',
      task: 'Design divide and conquer solution',
      context: args,
      instructions: ['1. Define division strategy', '2. Define base case', '3. Define combine step', '4. Document design'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['divisionStrategy', 'baseCase', 'combineStep', 'artifacts'],
      properties: { divisionStrategy: { type: 'object' }, baseCase: { type: 'object' }, combineStep: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'divide-conquer', 'design']
}));

export const recurrenceAnalysisTask = defineTask('recurrence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Recurrence',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Analyst',
      task: 'Analyze recurrence relation',
      context: args,
      instructions: ['1. Derive recurrence relation', '2. Apply Master theorem', '3. Determine complexity', '4. Document analysis'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['recurrence', 'complexity', 'artifacts'],
      properties: { recurrence: { type: 'string' }, complexity: { type: 'string' }, masterTheoremCase: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'divide-conquer', 'analysis']
}));

export const divideConquerImplementationTask = defineTask('divide-conquer-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Divide and Conquer',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement divide and conquer algorithm',
      context: args,
      instructions: ['1. Implement recursive structure', '2. Implement base case', '3. Implement combine step', '4. Optimize if possible'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, stackDepth: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'divide-conquer', 'implementation']
}));

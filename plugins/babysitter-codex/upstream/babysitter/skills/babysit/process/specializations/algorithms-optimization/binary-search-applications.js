/**
 * @process specializations/algorithms-optimization/binary-search-applications
 * @description Binary Search Applications and Variations - Process for applying binary search to various problem
 * types including search on answer, rotated arrays, and parametric search.
 * @inputs { problemType: string, searchSpace?: object }
 * @outputs { success: boolean, approach: string, solution: object, artifacts: array }
 *
 * @references
 * - Binary Search Patterns: https://cp-algorithms.com/num_methods/binary_search.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemType, searchSpace = {}, language = 'python', outputDir = 'binary-search-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Applying Binary Search - Problem Type: ${problemType}`);

  const analysis = await ctx.task(binarySearchAnalysisTask, { problemType, searchSpace, outputDir });
  artifacts.push(...analysis.artifacts);

  const implementation = await ctx.task(binarySearchImplementationTask, { analysis, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const verification = await ctx.task(binarySearchVerificationTask, { implementation, outputDir });
  artifacts.push(...verification.artifacts);

  await ctx.breakpoint({
    question: `Binary search solution for ${problemType} complete. Approach: ${analysis.approach}. Verified: ${verification.correct}. Review?`,
    title: 'Binary Search Application Complete',
    context: { runId: ctx.runId, approach: analysis.approach, verified: verification.correct }
  });

  return {
    success: true,
    problemType,
    approach: analysis.approach,
    solution: implementation.solution,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const binarySearchAnalysisTask = defineTask('binary-search-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze ${args.problemType} for Binary Search`,
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Expert',
      task: 'Analyze problem for binary search applicability',
      context: args,
      instructions: ['1. Identify search space', '2. Define feasibility function', '3. Determine search direction', '4. Handle edge cases'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'searchSpace', 'artifacts'],
      properties: { approach: { type: 'string' }, searchSpace: { type: 'object' }, feasibilityCheck: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'binary-search', 'analysis']
}));

export const binarySearchImplementationTask = defineTask('binary-search-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Binary Search',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement binary search solution',
      context: args,
      instructions: ['1. Implement search bounds', '2. Implement feasibility check', '3. Handle boundary conditions', '4. Optimize implementation'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'artifacts'],
      properties: { solution: { type: 'object' }, code: { type: 'string' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'binary-search', 'implementation']
}));

export const binarySearchVerificationTask = defineTask('binary-search-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Binary Search',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Tester',
      task: 'Verify binary search correctness',
      context: args,
      instructions: ['1. Test boundary cases', '2. Verify monotonicity', '3. Test edge cases', '4. Verify off-by-one handling'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['correct', 'artifacts'],
      properties: { correct: { type: 'boolean' }, testResults: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'binary-search', 'verification']
}));

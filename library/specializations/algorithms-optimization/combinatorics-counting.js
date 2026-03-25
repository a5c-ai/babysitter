/**
 * @process specializations/algorithms-optimization/combinatorics-counting
 * @description Combinatorics and Counting Problem Solving - Process for solving counting problems using permutations,
 * combinations, binomial coefficients, Catalan numbers, and inclusion-exclusion principle.
 * @inputs { problemType?: string, n?: number, k?: number }
 * @outputs { success: boolean, solution: object, implementations: object, artifacts: array }
 *
 * @references
 * - Combinatorics: https://cp-algorithms.com/combinatorics/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemType = 'general', n = 1000, k = 500, modulo = 1000000007, language = 'cpp', outputDir = 'combinatorics-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Solving Combinatorics Problem: ${problemType}`);

  const library = await ctx.task(combinatoricsLibraryTask, { n, modulo, language, outputDir });
  artifacts.push(...library.artifacts);

  const problem = await ctx.task(countingProblemTask, { problemType, n, k, modulo, library, language, outputDir });
  artifacts.push(...problem.artifacts);

  await ctx.breakpoint({
    question: `Combinatorics solution complete. Problem type: ${problemType}. Review?`,
    title: 'Combinatorics Complete',
    context: { runId: ctx.runId, problemType, solution: problem.solution }
  });

  return {
    success: true,
    problemType,
    solution: problem.solution,
    implementations: library.implementations,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const combinatoricsLibraryTask = defineTask('combinatorics-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Combinatorics Library',
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Combinatorics Expert',
      task: 'Build combinatorics computation library',
      context: args,
      instructions: ['1. Precompute factorials', '2. Precompute inverse factorials', '3. Implement nCr', '4. Implement nPr', '5. Implement Catalan numbers'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['implementations', 'artifacts'],
      properties: { implementations: { type: 'object' }, precomputation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'combinatorics', 'library']
}));

export const countingProblemTask = defineTask('counting-problem', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solve ${args.problemType} Problem`,
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Combinatorics Expert',
      task: 'Solve counting problem',
      context: args,
      instructions: ['1. Identify counting technique', '2. Apply appropriate formula', '3. Handle modular arithmetic', '4. Verify solution'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'technique', 'artifacts'],
      properties: { solution: { type: 'object' }, technique: { type: 'string' }, formula: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'combinatorics', 'problem']
}));

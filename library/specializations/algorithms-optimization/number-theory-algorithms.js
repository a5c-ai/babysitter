/**
 * @process specializations/algorithms-optimization/number-theory-algorithms
 * @description Modular Arithmetic and Number Theory Implementation - Process for implementing GCD/LCM (Euclidean algorithm),
 * modular exponentiation, modular inverse, and solving number theory problems.
 * @inputs { algorithms?: array }
 * @outputs { success: boolean, implementations: object, artifacts: array }
 *
 * @references
 * - Number Theory: https://cp-algorithms.com/algebra/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { algorithms = ['gcd', 'modexp', 'modinv', 'chinese-remainder'], language = 'cpp', outputDir = 'number-theory-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Implementing Number Theory Algorithms`);

  const implementations = {};
  for (const algo of algorithms) {
    const impl = await ctx.task(numberTheoryImplementationTask, { algorithm: algo, language, outputDir });
    artifacts.push(...impl.artifacts);
    implementations[algo] = impl;
  }

  const library = await ctx.task(numberTheoryLibraryTask, { implementations, language, outputDir });
  artifacts.push(...library.artifacts);

  await ctx.breakpoint({
    question: `Number theory library complete. ${algorithms.length} algorithms implemented. Review?`,
    title: 'Number Theory Complete',
    context: { runId: ctx.runId, algorithms, libraryPath: library.libraryPath }
  });

  return {
    success: true,
    algorithms,
    implementations,
    libraryPath: library.libraryPath,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const numberTheoryImplementationTask = defineTask('number-theory-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.algorithm}`,
  skills: ['mod-arithmetic-helper', 'prime-sieve'],
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Number Theory Expert',
      task: 'Implement number theory algorithm',
      context: args,
      instructions: ['1. Implement algorithm correctly', '2. Handle edge cases', '3. Document complexity', '4. Add usage examples'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'complexity', 'artifacts'],
      properties: { code: { type: 'string' }, complexity: { type: 'string' }, examples: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'number-theory', args.algorithm]
}));

export const numberTheoryLibraryTask = defineTask('number-theory-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Number Theory Library',
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Library Designer',
      task: 'Create number theory library file',
      context: args,
      instructions: ['1. Combine implementations', '2. Add documentation', '3. Create quick reference', '4. Save library file'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['libraryPath', 'artifacts'],
      properties: { libraryPath: { type: 'string' }, quickReference: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'number-theory', 'library']
}));

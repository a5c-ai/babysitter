/**
 * @process specializations/algorithms-optimization/prime-algorithms
 * @description Prime Number Algorithms and Applications - Implementation of sieve of Eratosthenes, primality testing
 * (Miller-Rabin), prime factorization, and applications to competitive programming problems.
 * @inputs { maxN?: number, algorithms?: array }
 * @outputs { success: boolean, implementations: object, artifacts: array }
 *
 * @references
 * - Prime Algorithms: https://cp-algorithms.com/algebra/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { maxN = 1000000, algorithms = ['sieve', 'miller-rabin', 'factorization'], language = 'cpp', outputDir = 'prime-algorithms-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Implementing Prime Algorithms (maxN: ${maxN})`);

  const sieve = await ctx.task(sieveImplementationTask, { maxN, language, outputDir });
  artifacts.push(...sieve.artifacts);

  const primality = await ctx.task(primalityTestingTask, { language, outputDir });
  artifacts.push(...primality.artifacts);

  const factorization = await ctx.task(factorizationTask, { language, outputDir });
  artifacts.push(...factorization.artifacts);

  const library = await ctx.task(primeLibraryTask, { sieve, primality, factorization, language, outputDir });
  artifacts.push(...library.artifacts);

  await ctx.breakpoint({
    question: `Prime algorithms library complete. Sieve up to ${maxN}. Review?`,
    title: 'Prime Algorithms Complete',
    context: { runId: ctx.runId, maxN, algorithms }
  });

  return {
    success: true,
    maxN,
    implementations: { sieve, primality, factorization },
    libraryPath: library.libraryPath,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const sieveImplementationTask = defineTask('sieve-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Sieve of Eratosthenes',
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Algorithm Expert',
      task: 'Implement Sieve of Eratosthenes',
      context: args,
      instructions: ['1. Implement basic sieve', '2. Implement segmented sieve', '3. Implement linear sieve variant', '4. Document implementations'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'variants', 'artifacts'],
      properties: { code: { type: 'string' }, variants: { type: 'object' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'prime', 'sieve']
}));

export const primalityTestingTask = defineTask('primality-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Primality Testing',
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Algorithm Expert',
      task: 'Implement primality testing algorithms',
      context: args,
      instructions: ['1. Implement trial division', '2. Implement Miller-Rabin', '3. Document accuracy and complexity', '4. Add examples'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'algorithms', 'artifacts'],
      properties: { code: { type: 'string' }, algorithms: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'prime', 'primality']
}));

export const factorizationTask = defineTask('factorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Prime Factorization',
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Algorithm Expert',
      task: 'Implement prime factorization',
      context: args,
      instructions: ['1. Implement trial division factorization', '2. Implement SPF-based factorization', '3. Document complexity', '4. Add examples'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'methods', 'artifacts'],
      properties: { code: { type: 'string' }, methods: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'prime', 'factorization']
}));

export const primeLibraryTask = defineTask('prime-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Prime Library',
  agent: {
    name: 'number-theory-specialist',
    prompt: {
      role: 'Library Designer',
      task: 'Create prime algorithms library',
      context: args,
      instructions: ['1. Combine all implementations', '2. Add documentation', '3. Create quick reference', '4. Save library'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['libraryPath', 'artifacts'],
      properties: { libraryPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'prime', 'library']
}));

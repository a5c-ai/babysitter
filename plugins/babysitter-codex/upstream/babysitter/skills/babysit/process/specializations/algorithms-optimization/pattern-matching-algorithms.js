/**
 * @process specializations/algorithms-optimization/pattern-matching-algorithms
 * @description Pattern Matching Algorithm Implementation - Process for implementing and comparing pattern matching
 * algorithms (KMP, Rabin-Karp, Boyer-Moore, Z-algorithm) with performance analysis.
 * @inputs { text?: string, pattern?: string, algorithm?: string }
 * @outputs { success: boolean, implementations: object, comparison: object, artifacts: array }
 *
 * @references
 * - String Matching Algorithms: https://cp-algorithms.com/string/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { text = '', pattern = '', algorithm = 'all', language = 'python', outputDir = 'pattern-matching-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Implementing Pattern Matching Algorithms`);

  const design = await ctx.task(patternMatchingDesignTask, { algorithm, outputDir });
  artifacts.push(...design.artifacts);

  const implementation = await ctx.task(patternMatchingImplementationTask, { design, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const comparison = await ctx.task(algorithmComparisonTask, { implementation, text, pattern, outputDir });
  artifacts.push(...comparison.artifacts);

  await ctx.breakpoint({
    question: `Pattern matching algorithms implemented. Best for this case: ${comparison.recommended}. Review?`,
    title: 'Pattern Matching Complete',
    context: { runId: ctx.runId, algorithms: design.algorithms, recommended: comparison.recommended }
  });

  return {
    success: true,
    implementations: implementation.algorithms,
    comparison: comparison.results,
    recommended: comparison.recommended,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const patternMatchingDesignTask = defineTask('pattern-matching-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Pattern Matching Algorithms',
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'String Algorithm Expert',
      task: 'Design pattern matching algorithm implementations',
      context: args,
      instructions: ['1. Review KMP algorithm', '2. Review Rabin-Karp algorithm', '3. Review Boyer-Moore algorithm', '4. Review Z-algorithm', '5. Document designs'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'artifacts'],
      properties: { algorithms: { type: 'array' }, complexities: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pattern-matching', 'design']
}));

export const patternMatchingImplementationTask = defineTask('pattern-matching-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Pattern Matching',
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement pattern matching algorithms',
      context: args,
      instructions: ['1. Implement each algorithm', '2. Include preprocessing', '3. Include search phase', '4. Document implementations'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'artifacts'],
      properties: { algorithms: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pattern-matching', 'implementation']
}));

export const algorithmComparisonTask = defineTask('algorithm-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare Algorithms',
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'Algorithm Analyst',
      task: 'Compare pattern matching algorithms',
      context: args,
      instructions: ['1. Test each algorithm', '2. Compare performance', '3. Analyze strengths/weaknesses', '4. Recommend best choice'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'recommended', 'artifacts'],
      properties: { results: { type: 'object' }, recommended: { type: 'string' }, analysis: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pattern-matching', 'comparison']
}));

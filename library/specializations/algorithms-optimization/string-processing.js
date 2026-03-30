/**
 * @process specializations/algorithms-optimization/string-processing
 * @description String Processing Problem Solving - Comprehensive process for solving string problems including
 * palindromes (Manacher's), longest common subsequence, edit distance, and string transformations.
 * @inputs { problemType: string, strings?: array }
 * @outputs { success: boolean, solution: object, implementation: string, artifacts: array }
 *
 * @references
 * - String Algorithm Catalog
 * - Classic String Problems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemType, strings = [], language = 'python', outputDir = 'string-processing-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Solving String Problem: ${problemType}`);

  const analysis = await ctx.task(stringProblemAnalysisTask, { problemType, strings, outputDir });
  artifacts.push(...analysis.artifacts);

  const solution = await ctx.task(stringSolutionTask, { problemType, analysis, language, outputDir });
  artifacts.push(...solution.artifacts);

  const testing = await ctx.task(stringTestingTask, { problemType, solution, strings, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `String problem ${problemType} solved. Complexity: O(${solution.complexity}). Tests passed: ${testing.passed}. Review?`,
    title: 'String Processing Complete',
    context: { runId: ctx.runId, problemType, complexity: solution.complexity, testsPassed: testing.passed }
  });

  return {
    success: true,
    problemType,
    solution: { algorithm: solution.algorithm, complexity: solution.complexity },
    implementation: solution.code,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const stringProblemAnalysisTask = defineTask('string-problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze ${args.problemType}`,
  skills: ['kmp-builder', 'z-function-calculator', 'suffix-array-builder'],
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'String Algorithm Expert',
      task: 'Analyze string problem',
      context: args,
      instructions: ['1. Understand problem requirements', '2. Identify applicable algorithms', '3. Select best approach', '4. Document analysis'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'approach', 'artifacts'],
      properties: { algorithm: { type: 'string' }, approach: { type: 'string' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'string-processing', 'analysis']
}));

export const stringSolutionTask = defineTask('string-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solve ${args.problemType}`,
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement string algorithm solution',
      context: args,
      instructions: ['1. Implement algorithm', '2. Handle edge cases', '3. Optimize if possible', '4. Document solution'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'algorithm', 'complexity', 'artifacts'],
      properties: { code: { type: 'string' }, algorithm: { type: 'string' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'string-processing', 'solution']
}));

export const stringTestingTask = defineTask('string-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test String Solution',
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'QA Engineer',
      task: 'Test string algorithm solution',
      context: args,
      instructions: ['1. Test with provided strings', '2. Test edge cases', '3. Test performance', '4. Document results'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, testResults: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'string-processing', 'testing']
}));

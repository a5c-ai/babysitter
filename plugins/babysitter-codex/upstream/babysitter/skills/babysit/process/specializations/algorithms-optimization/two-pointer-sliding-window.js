/**
 * @process specializations/algorithms-optimization/two-pointer-sliding-window
 * @description Two-Pointer and Sliding Window Techniques - Master process for applying two-pointer and sliding window
 * techniques to array and string problems with pattern recognition and optimization.
 * @inputs { problemStatement: string, dataType?: string }
 * @outputs { success: boolean, technique: string, solution: object, artifacts: array }
 *
 * @references
 * - Two Pointer Technique Patterns
 * - Sliding Window Problems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemStatement, dataType = 'array', language = 'python', outputDir = 'two-pointer-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Two-Pointer/Sliding Window Analysis');

  const analysis = await ctx.task(techniqueAnalysisTask, { problemStatement, dataType, outputDir });
  artifacts.push(...analysis.artifacts);

  const solution = await ctx.task(techniqueSolutionTask, { analysis, language, outputDir });
  artifacts.push(...solution.artifacts);

  const testing = await ctx.task(techniqueTestingTask, { solution, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Solution using ${analysis.technique} technique complete. Complexity: O(${solution.complexity}). Review?`,
    title: 'Two-Pointer/Sliding Window Complete',
    context: { runId: ctx.runId, technique: analysis.technique, complexity: solution.complexity }
  });

  return {
    success: true,
    technique: analysis.technique,
    solution: { code: solution.code, complexity: solution.complexity },
    pattern: analysis.pattern,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const techniqueAnalysisTask = defineTask('technique-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Problem for Technique',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Pattern Expert',
      task: 'Analyze problem for two-pointer/sliding window applicability',
      context: args,
      instructions: ['1. Identify if two-pointer applies', '2. Identify if sliding window applies', '3. Determine pointer movement strategy', '4. Select optimal approach'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['technique', 'pattern', 'artifacts'],
      properties: { technique: { type: 'string' }, pattern: { type: 'string' }, strategy: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'two-pointer', 'analysis']
}));

export const techniqueSolutionTask = defineTask('technique-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Solution',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement two-pointer/sliding window solution',
      context: args,
      instructions: ['1. Implement pointer initialization', '2. Implement movement logic', '3. Implement condition checking', '4. Handle edge cases'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'complexity', 'artifacts'],
      properties: { code: { type: 'string' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'two-pointer', 'solution']
}));

export const techniqueTestingTask = defineTask('technique-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Solution',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'QA Engineer',
      task: 'Test two-pointer/sliding window solution',
      context: args,
      instructions: ['1. Test with sample inputs', '2. Test edge cases', '3. Test boundary conditions', '4. Verify correctness'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, testResults: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'two-pointer', 'testing']
}));

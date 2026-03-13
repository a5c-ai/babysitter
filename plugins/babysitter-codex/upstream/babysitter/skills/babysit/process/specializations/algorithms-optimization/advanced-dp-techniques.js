/**
 * @process specializations/algorithms-optimization/advanced-dp-techniques
 * @description Advanced Dynamic Programming Techniques - Learning and implementing advanced DP techniques including
 * bitmask DP, digit DP, DP on trees, DP optimization (convex hull trick, divide and conquer optimization).
 * @inputs { technique: string, problem?: string }
 * @outputs { success: boolean, implementation: object, examples: array, artifacts: array }
 *
 * @references
 * - Advanced DP: https://cp-algorithms.com/dynamic_programming/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { technique, problem = null, language = 'cpp', outputDir = 'advanced-dp-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Learning Advanced DP Technique: ${technique}`);

  const learning = await ctx.task(advancedDPLearningTask, { technique, outputDir });
  artifacts.push(...learning.artifacts);

  const implementation = await ctx.task(advancedDPImplementationTask, { technique, learning, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const examples = await ctx.task(advancedDPExamplesTask, { technique, implementation, problem, outputDir });
  artifacts.push(...examples.artifacts);

  await ctx.breakpoint({
    question: `Advanced DP technique ${technique} mastered. ${examples.solved.length} examples solved. Review?`,
    title: 'Advanced DP Complete',
    context: { runId: ctx.runId, technique, examplesSolved: examples.solved.length }
  });

  return {
    success: true,
    technique,
    implementation: implementation.template,
    examples: examples.solved,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const advancedDPLearningTask = defineTask('advanced-dp-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Learn ${args.technique}`,
  skills: ['dp-optimizer', 'dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: 'Learn advanced DP technique',
      context: args,
      instructions: ['1. Understand technique theory', '2. Identify use cases', '3. Study complexity improvements', '4. Document key concepts'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'useCases', 'artifacts'],
      properties: { concepts: { type: 'array' }, useCases: { type: 'array' }, complexity: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'advanced-dp', 'learning']
}));

export const advancedDPImplementationTask = defineTask('advanced-dp-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.technique}`,
  skills: ['dp-optimizer', 'dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement advanced DP technique',
      context: args,
      instructions: ['1. Implement technique template', '2. Handle edge cases', '3. Optimize implementation', '4. Document usage'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'artifacts'],
      properties: { template: { type: 'string' }, usage: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'advanced-dp', 'implementation']
}));

export const advancedDPExamplesTask = defineTask('advanced-dp-examples', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solve Example Problems',
  skills: ['dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'Competitive Programmer',
      task: 'Solve example problems using technique',
      context: args,
      instructions: ['1. Select appropriate problems', '2. Apply technique', '3. Verify solutions', '4. Document learnings'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['solved', 'artifacts'],
      properties: { solved: { type: 'array' }, learnings: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'advanced-dp', 'examples']
}));

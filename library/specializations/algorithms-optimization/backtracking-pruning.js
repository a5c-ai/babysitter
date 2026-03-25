/**
 * @process specializations/algorithms-optimization/backtracking-pruning
 * @description Backtracking with Pruning Strategies - Process for designing backtracking solutions with effective
 * pruning, constraint propagation, and optimization for NP-hard problems.
 * @inputs { problemStatement: string, constraints?: array }
 * @outputs { success: boolean, solution: object, pruningStrategies: array, artifacts: array }
 *
 * @references
 * - Backtracking Algorithms
 * - Constraint Satisfaction Problems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemStatement, constraints = [], language = 'python', outputDir = 'backtracking-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Designing Backtracking Solution');

  const design = await ctx.task(backtrackingDesignTask, { problemStatement, constraints, outputDir });
  artifacts.push(...design.artifacts);

  const pruning = await ctx.task(pruningStrategyTask, { design, constraints, outputDir });
  artifacts.push(...pruning.artifacts);

  const implementation = await ctx.task(backtrackingImplementationTask, { design, pruning, language, outputDir });
  artifacts.push(...implementation.artifacts);

  await ctx.breakpoint({
    question: `Backtracking solution designed. Pruning strategies: ${pruning.strategies.length}. Review?`,
    title: 'Backtracking Complete',
    context: { runId: ctx.runId, pruningStrategies: pruning.strategies }
  });

  return {
    success: true,
    solution: design.solution,
    pruningStrategies: pruning.strategies,
    implementation: implementation.code,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const backtrackingDesignTask = defineTask('backtracking-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Backtracking',
  skills: ['code-template-manager'],
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Designer',
      task: 'Design backtracking solution',
      context: args,
      instructions: ['1. Define state space', '2. Define choice function', '3. Define constraint check', '4. Define goal test'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'stateSpace', 'artifacts'],
      properties: { solution: { type: 'object' }, stateSpace: { type: 'object' }, choices: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'backtracking', 'design']
}));

export const pruningStrategyTask = defineTask('pruning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Pruning Strategies',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Optimization Expert',
      task: 'Design pruning strategies',
      context: args,
      instructions: ['1. Identify early termination conditions', '2. Design constraint propagation', '3. Implement bounds checking', '4. Order variables/values'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: { strategies: { type: 'array' }, expectedSpeedup: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'backtracking', 'pruning']
}));

export const backtrackingImplementationTask = defineTask('backtracking-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Backtracking',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement backtracking with pruning',
      context: args,
      instructions: ['1. Implement recursive backtrack', '2. Implement pruning checks', '3. Implement state management', '4. Handle solution collection'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'backtracking', 'implementation']
}));

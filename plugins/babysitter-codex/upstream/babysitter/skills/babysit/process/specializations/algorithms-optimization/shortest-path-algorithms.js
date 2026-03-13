/**
 * @process specializations/algorithms-optimization/shortest-path-algorithms
 * @description Shortest Path Algorithm Selection and Implementation - Systematic process for selecting shortest path
 * algorithm (Dijkstra, Bellman-Ford, Floyd-Warshall, A*) based on constraints, implementing, and verifying correctness.
 * @inputs { graphProperties: object, sourceType?: string, constraints?: object }
 * @outputs { success: boolean, algorithm: string, implementation: string, complexity: object, artifacts: array }
 *
 * @references
 * - Shortest Path Algorithms: https://cp-algorithms.com/graph/
 * - CLRS Shortest Path Chapter
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { graphProperties, sourceType = 'single', constraints = {}, language = 'python', outputDir = 'shortest-path-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Shortest Path Algorithm Process');

  const selection = await ctx.task(algorithmSelectionTask, { graphProperties, sourceType, constraints, outputDir });
  artifacts.push(...selection.artifacts);

  const implementation = await ctx.task(shortestPathImplementationTask, { selection, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const verification = await ctx.task(shortestPathVerificationTask, { selection, implementation, outputDir });
  artifacts.push(...verification.artifacts);

  await ctx.breakpoint({
    question: `Shortest path algorithm selected: ${selection.algorithm}. Complexity: O(${selection.complexity}). Review?`,
    title: 'Shortest Path Algorithm Complete',
    context: { runId: ctx.runId, algorithm: selection.algorithm, complexity: selection.complexity }
  });

  return {
    success: true,
    algorithm: selection.algorithm,
    implementation: implementation.code,
    complexity: { time: selection.complexity, space: selection.spaceComplexity },
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const algorithmSelectionTask = defineTask('algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Shortest Path Algorithm',
  skills: ['graph-modeler', 'graph-algorithm-selector'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Graph Algorithm Expert',
      task: 'Select optimal shortest path algorithm',
      context: args,
      instructions: [
        '1. Check for negative weights (Bellman-Ford needed)',
        '2. Check single-source vs all-pairs',
        '3. Check graph density',
        '4. Check if heuristic available (A*)',
        '5. Select and justify algorithm'
      ],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'complexity', 'justification', 'artifacts'],
      properties: { algorithm: { type: 'string' }, complexity: { type: 'string' }, spaceComplexity: { type: 'string' }, justification: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'shortest-path', 'selection']
}));

export const shortestPathImplementationTask = defineTask('shortest-path-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.selection?.algorithm || 'Shortest Path'}`,
  skills: ['graph-modeler'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement shortest path algorithm',
      context: args,
      instructions: ['1. Implement selected algorithm', '2. Include path reconstruction', '3. Handle edge cases', '4. Optimize implementation'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, pathReconstruction: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'shortest-path', 'implementation']
}));

export const shortestPathVerificationTask = defineTask('shortest-path-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Shortest Path Implementation',
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Algorithm Tester',
      task: 'Verify shortest path implementation correctness',
      context: args,
      instructions: ['1. Test with known graphs', '2. Verify path correctness', '3. Check edge cases', '4. Benchmark performance'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['isCorrect', 'testResults', 'artifacts'],
      properties: { isCorrect: { type: 'boolean' }, testResults: { type: 'array' }, performance: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'shortest-path', 'verification']
}));

/**
 * @process specializations/algorithms-optimization/advanced-graph-algorithms
 * @description Advanced Graph Algorithm Implementation - Implementation of advanced graph algorithms including
 * maximum flow (Dinic's, Edmonds-Karp), minimum spanning tree (Kruskal, Prim), and bipartite matching (Hopcroft-Karp).
 * @inputs { algorithmType: string, graph?: object }
 * @outputs { success: boolean, algorithm: string, implementation: string, result: object, artifacts: array }
 *
 * @references
 * - Network Flow: https://cp-algorithms.com/graph/
 * - MST Algorithms, Matching Algorithms
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { algorithmType, graph = null, language = 'cpp', outputDir = 'advanced-graph-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Implementing Advanced Graph Algorithm: ${algorithmType}`);

  const design = await ctx.task(advancedAlgorithmDesignTask, { algorithmType, graph, outputDir });
  artifacts.push(...design.artifacts);

  const implementation = await ctx.task(advancedAlgorithmImplementationTask, { algorithmType, design, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const verification = await ctx.task(advancedAlgorithmVerificationTask, { algorithmType, implementation, outputDir });
  artifacts.push(...verification.artifacts);

  await ctx.breakpoint({
    question: `${algorithmType} implemented. Complexity: O(${design.complexity}). Verified: ${verification.isCorrect}. Review?`,
    title: 'Advanced Graph Algorithm Complete',
    context: { runId: ctx.runId, algorithmType, complexity: design.complexity, verified: verification.isCorrect }
  });

  return {
    success: true,
    algorithm: algorithmType,
    implementation: implementation.code,
    complexity: design.complexity,
    result: verification.result,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const advancedAlgorithmDesignTask = defineTask('advanced-algorithm-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design ${args.algorithmType}`,
  skills: ['graph-algorithm-selector', 'flow-network-builder', 'advanced-ds-library'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Advanced Algorithm Expert',
      task: 'Design advanced graph algorithm implementation',
      context: args,
      instructions: ['1. Understand algorithm theory', '2. Design data structures', '3. Plan implementation steps', '4. Analyze complexity'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'complexity', 'artifacts'],
      properties: { design: { type: 'object' }, complexity: { type: 'string' }, dataStructures: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'advanced-graph', 'design']
}));

export const advancedAlgorithmImplementationTask = defineTask('advanced-algorithm-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.algorithmType}`,
  skills: ['flow-network-builder', 'advanced-ds-library'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement advanced graph algorithm',
      context: args,
      instructions: ['1. Implement core algorithm', '2. Implement helper functions', '3. Optimize for performance', '4. Document code'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, helpers: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'advanced-graph', 'implementation']
}));

export const advancedAlgorithmVerificationTask = defineTask('advanced-algorithm-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.algorithmType}`,
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Algorithm Tester',
      task: 'Verify advanced graph algorithm correctness',
      context: args,
      instructions: ['1. Test with known examples', '2. Verify optimality', '3. Stress test', '4. Document results'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['isCorrect', 'result', 'artifacts'],
      properties: { isCorrect: { type: 'boolean' }, result: { type: 'object' }, testCases: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'advanced-graph', 'verification']
}));

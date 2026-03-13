/**
 * @process specializations/algorithms-optimization/graph-traversal
 * @description Graph Traversal and Connectivity Analysis - Process for implementing DFS/BFS for various applications
 * (cycle detection, topological sort, connected components, bipartite checking, shortest paths).
 * @inputs { graph: object, application?: string }
 * @outputs { success: boolean, traversalResult: object, implementation: string, artifacts: array }
 *
 * @references
 * - Graph Traversal: https://cp-algorithms.com/graph/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { graph, application = 'connectivity', language = 'python', outputDir = 'graph-traversal-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Graph Traversal - Application: ${application}`);

  const selection = await ctx.task(traversalSelectionTask, { graph, application, outputDir });
  artifacts.push(...selection.artifacts);

  const implementation = await ctx.task(traversalImplementationTask, { selection, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const analysis = await ctx.task(traversalAnalysisTask, { graph, implementation, application, outputDir });
  artifacts.push(...analysis.artifacts);

  await ctx.breakpoint({
    question: `Graph traversal complete. Method: ${selection.method}. Application: ${application}. Review results?`,
    title: 'Graph Traversal Complete',
    context: { runId: ctx.runId, method: selection.method, result: analysis.summary }
  });

  return {
    success: true,
    traversalMethod: selection.method,
    traversalResult: analysis.result,
    implementation: implementation.code,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const traversalSelectionTask = defineTask('traversal-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Traversal Method',
  skills: ['graph-modeler', 'graph-algorithm-selector'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Graph Algorithm Expert',
      task: 'Select appropriate traversal method for application',
      context: args,
      instructions: ['1. Analyze application requirements', '2. Choose DFS or BFS', '3. Determine variations needed', '4. Document selection'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'variation', 'artifacts'],
      properties: { method: { type: 'string' }, variation: { type: 'string' }, justification: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'graph-traversal', 'selection']
}));

export const traversalImplementationTask = defineTask('traversal-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Traversal',
  skills: ['graph-modeler'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement graph traversal algorithm',
      context: args,
      instructions: ['1. Implement traversal method', '2. Add application-specific logic', '3. Handle edge cases', '4. Document code'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, complexity: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'graph-traversal', 'implementation']
}));

export const traversalAnalysisTask = defineTask('traversal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Traversal Results',
  skills: ['graph-modeler'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Graph Analyst',
      task: 'Analyze graph traversal results for application',
      context: args,
      instructions: ['1. Run traversal on graph', '2. Extract application-specific results', '3. Analyze findings', '4. Document results'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['result', 'summary', 'artifacts'],
      properties: { result: { type: 'object' }, summary: { type: 'string' }, findings: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'graph-traversal', 'analysis']
}));

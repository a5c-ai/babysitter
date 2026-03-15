/**
 * @process specializations/algorithms-optimization/graph-modeling
 * @description Graph Problem Modeling and Representation - Process for converting real-world problems into graph
 * representations, selecting appropriate graph structure, and choosing adjacency list vs matrix.
 * @inputs { problemStatement: string, entities?: array, relationships?: array }
 * @outputs { success: boolean, graphModel: object, representation: string, implementation: string, artifacts: array }
 *
 * @references
 * - Graph Theory Fundamentals
 * - CP-Algorithms Graph: https://cp-algorithms.com/graph/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemStatement, entities = [], relationships = [], outputDir = 'graph-modeling-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Graph Problem Modeling');

  const extraction = await ctx.task(entityExtractionTask, { problemStatement, entities, relationships, outputDir });
  artifacts.push(...extraction.artifacts);

  const modeling = await ctx.task(graphModelingTask, { extraction, outputDir });
  artifacts.push(...modeling.artifacts);

  const representation = await ctx.task(representationSelectionTask, { modeling, outputDir });
  artifacts.push(...representation.artifacts);

  const implementation = await ctx.task(graphImplementationTask, { modeling, representation, outputDir });
  artifacts.push(...implementation.artifacts);

  await ctx.breakpoint({
    question: `Graph model created. Type: ${modeling.graphType}. Representation: ${representation.choice}. Review?`,
    title: 'Graph Modeling Complete',
    context: { runId: ctx.runId, graphType: modeling.graphType, representation: representation.choice }
  });

  return {
    success: true,
    graphModel: modeling.model,
    representation: representation.choice,
    implementation: implementation.code,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const entityExtractionTask = defineTask('entity-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Entities and Relationships',
  skills: ['graph-modeler'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Graph Modeling Expert',
      task: 'Extract entities and relationships from problem',
      context: args,
      instructions: ['1. Identify nodes/vertices', '2. Identify edges/relationships', '3. Identify edge weights/properties', '4. Document extraction'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['nodes', 'edges', 'artifacts'],
      properties: { nodes: { type: 'array' }, edges: { type: 'array' }, weights: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'graph-modeling', 'extraction']
}));

export const graphModelingTask = defineTask('graph-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Graph Model',
  skills: ['graph-modeler', 'graph-algorithm-selector'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Graph Modeling Expert',
      task: 'Create formal graph model',
      context: args,
      instructions: ['1. Determine directed vs undirected', '2. Determine weighted vs unweighted', '3. Check for special properties', '4. Create formal model'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'graphType', 'artifacts'],
      properties: { model: { type: 'object' }, graphType: { type: 'string' }, properties: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'graph-modeling', 'model']
}));

export const representationSelectionTask = defineTask('representation-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Graph Representation',
  skills: ['graph-algorithm-selector'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Graph Algorithm Expert',
      task: 'Select optimal graph representation',
      context: args,
      instructions: ['1. Analyze graph density', '2. Consider operations needed', '3. Choose adjacency list vs matrix', '4. Justify choice'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['choice', 'justification', 'artifacts'],
      properties: { choice: { type: 'string' }, justification: { type: 'string' }, complexity: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'graph-modeling', 'representation']
}));

export const graphImplementationTask = defineTask('graph-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Graph',
  skills: ['graph-modeler'],
  agent: {
    name: 'graph-specialist',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement graph data structure',
      context: args,
      instructions: ['1. Implement chosen representation', '2. Add helper methods', '3. Handle edge cases', '4. Document implementation'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, methods: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'graph-modeling', 'implementation']
}));

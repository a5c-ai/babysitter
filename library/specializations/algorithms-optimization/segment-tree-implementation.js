/**
 * @process specializations/algorithms-optimization/segment-tree-implementation
 * @description Segment Tree Implementation and Variants - Complete implementation of segment tree with point updates,
 * range queries, lazy propagation, and persistent variants for various use cases.
 * @inputs { queryType?: string, updateType?: string, variant?: string }
 * @outputs { success: boolean, implementation: object, operations: array, artifacts: array }
 *
 * @references
 * - Segment Tree: https://cp-algorithms.com/data_structures/segment_tree.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { queryType = 'sum', updateType = 'point', variant = 'basic', language = 'cpp', outputDir = 'segment-tree-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Implementing Segment Tree - Query: ${queryType}, Update: ${updateType}, Variant: ${variant}`);

  const design = await ctx.task(segmentTreeDesignTask, { queryType, updateType, variant, outputDir });
  artifacts.push(...design.artifacts);

  const implementation = await ctx.task(segmentTreeImplementationTask, { design, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const testing = await ctx.task(segmentTreeTestingTask, { implementation, queryType, updateType, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Segment tree implemented. Variant: ${variant}. All tests passed: ${testing.allPassed}. Review?`,
    title: 'Segment Tree Complete',
    context: { runId: ctx.runId, variant, complexity: design.complexity, testsPassed: testing.allPassed }
  });

  return {
    success: true,
    variant,
    implementation: { code: implementation.code, operations: design.operations },
    complexity: design.complexity,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const segmentTreeDesignTask = defineTask('segment-tree-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Segment Tree',
  skills: ['segment-tree-builder', 'advanced-ds-library'],
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Data Structure Expert',
      task: 'Design segment tree for specified operations',
      context: args,
      instructions: ['1. Design tree structure', '2. Define merge operation', '3. Plan update operation', '4. Plan query operation', '5. Design lazy propagation if needed'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'complexity', 'artifacts'],
      properties: { operations: { type: 'array' }, complexity: { type: 'object' }, mergeFunction: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segment-tree', 'design']
}));

export const segmentTreeImplementationTask = defineTask('segment-tree-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Segment Tree',
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement segment tree',
      context: args,
      instructions: ['1. Implement build operation', '2. Implement update operation', '3. Implement query operation', '4. Implement lazy propagation', '5. Document code'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, methods: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segment-tree', 'implementation']
}));

export const segmentTreeTestingTask = defineTask('segment-tree-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Segment Tree',
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Test segment tree implementation',
      context: args,
      instructions: ['1. Test build operation', '2. Test point/range updates', '3. Test range queries', '4. Test edge cases', '5. Stress test'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'artifacts'],
      properties: { allPassed: { type: 'boolean' }, testResults: { type: 'array' }, performance: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segment-tree', 'testing']
}));

/**
 * @process specializations/algorithms-optimization/fenwick-tree-implementation
 * @description Fenwick Tree (BIT) Implementation and Applications - Implementation of Binary Indexed Tree for prefix
 * sum queries and point updates with extensions for range updates and 2D versions.
 * @inputs { variant?: string }
 * @outputs { success: boolean, implementation: object, applications: array, artifacts: array }
 *
 * @references
 * - Fenwick Tree: https://cp-algorithms.com/data_structures/fenwick.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { variant = 'basic', language = 'cpp', outputDir = 'fenwick-tree-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Implementing Fenwick Tree - Variant: ${variant}`);

  const implementation = await ctx.task(fenwickImplementationTask, { variant, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const applications = await ctx.task(fenwickApplicationsTask, { implementation, outputDir });
  artifacts.push(...applications.artifacts);

  const testing = await ctx.task(fenwickTestingTask, { implementation, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Fenwick tree implemented. Variant: ${variant}. Applications: ${applications.demonstrated.length}. Review?`,
    title: 'Fenwick Tree Complete',
    context: { runId: ctx.runId, variant, applications: applications.demonstrated }
  });

  return {
    success: true,
    variant,
    implementation: implementation.code,
    applications: applications.demonstrated,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const fenwickImplementationTask = defineTask('fenwick-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Fenwick Tree - ${args.variant}`,
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement Fenwick tree',
      context: args,
      instructions: ['1. Implement basic BIT', '2. Implement point update', '3. Implement prefix query', '4. Implement range query', '5. Implement variants if needed'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, operations: { type: 'array' }, complexity: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'fenwick-tree', 'implementation']
}));

export const fenwickApplicationsTask = defineTask('fenwick-applications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Demonstrate Applications',
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Algorithm Expert',
      task: 'Demonstrate Fenwick tree applications',
      context: args,
      instructions: ['1. Implement inversion count', '2. Implement range sum queries', '3. Implement order statistics', '4. Document applications'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['demonstrated', 'artifacts'],
      properties: { demonstrated: { type: 'array' }, examples: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'fenwick-tree', 'applications']
}));

export const fenwickTestingTask = defineTask('fenwick-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Fenwick Tree',
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Test Fenwick tree implementation',
      context: args,
      instructions: ['1. Test update operation', '2. Test query operation', '3. Test edge cases', '4. Verify correctness', '5. Benchmark performance'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'artifacts'],
      properties: { allPassed: { type: 'boolean' }, testResults: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'fenwick-tree', 'testing']
}));

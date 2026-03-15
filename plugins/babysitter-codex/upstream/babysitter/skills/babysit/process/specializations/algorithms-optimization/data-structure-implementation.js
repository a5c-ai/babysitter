/**
 * @process specializations/algorithms-optimization/data-structure-implementation
 * @description Data Structure Implementation and Verification - Process for implementing advanced data structures
 * (segment tree, fenwick tree, trie, union-find) with operation verification and performance benchmarking.
 * @inputs { dataStructure: string, operations?: array, language?: string }
 * @outputs { success: boolean, implementation: string, operationComplexity: object, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/data-structure-implementation', {
 *   dataStructure: 'SegmentTree',
 *   operations: ['build', 'query', 'update'],
 *   language: 'cpp'
 * });
 *
 * @references
 * - CP-Algorithms Data Structures: https://cp-algorithms.com/data_structures/
 * - Competitive Programming 4 by Steven Halim
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataStructure,
    operations = ['insert', 'query', 'delete'],
    language = 'cpp',
    outputDir = 'ds-impl-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Implementing Data Structure - ${dataStructure}`);

  // PHASE 1: Design
  const design = await ctx.task(dsDesignTask, { dataStructure, operations, outputDir });
  artifacts.push(...design.artifacts);

  // PHASE 2: Implementation
  const implementation = await ctx.task(dsImplementationTask, { dataStructure, design, language, outputDir });
  artifacts.push(...implementation.artifacts);

  // PHASE 3: Operation Verification
  const verification = await ctx.task(operationVerificationTask, { dataStructure, implementation, language, outputDir });
  artifacts.push(...verification.artifacts);

  // PHASE 4: Performance Benchmarking
  const benchmarking = await ctx.task(performanceBenchmarkingTask, { dataStructure, implementation, language, outputDir });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `${dataStructure} implemented. All operations verified: ${verification.allVerified}. Review?`,
    title: 'Data Structure Implementation Complete',
    context: {
      runId: ctx.runId,
      dataStructure,
      operationsVerified: verification.allVerified,
      complexity: implementation.complexity,
      files: [
        { path: implementation.codePath, format: language, label: 'Implementation' },
        { path: benchmarking.reportPath, format: 'markdown', label: 'Benchmarks' }
      ]
    }
  });

  return {
    success: true,
    dataStructure,
    implementation: implementation.code,
    operationComplexity: implementation.complexity,
    benchmarks: benchmarking.results,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/data-structure-implementation', timestamp: startTime, outputDir }
  };
}

export const dsDesignTask = defineTask('ds-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design ${args.dataStructure}`,
  skills: ['data-structure-selector', 'segment-tree-builder', 'advanced-ds-library'],
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Data Structure Expert',
      task: 'Design data structure with all operations',
      context: args,
      instructions: [
        '1. Define data structure properties',
        '2. Design internal representation',
        '3. Plan all operations',
        '4. Define invariants',
        '5. Document design decisions'
      ],
      outputFormat: 'JSON object with design'
    },
    outputSchema: {
      type: 'object',
      required: ['representation', 'operations', 'invariants', 'artifacts'],
      properties: {
        representation: { type: 'string' },
        operations: { type: 'array', items: { type: 'object' } },
        invariants: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-structure', 'design']
}));

export const dsImplementationTask = defineTask('ds-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.dataStructure}`,
  skills: ['data-structure-selector', 'segment-tree-builder', 'advanced-ds-library'],
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement data structure',
      context: args,
      instructions: [
        '1. Implement internal structure',
        '2. Implement all operations',
        '3. Handle edge cases',
        '4. Document complexity',
        '5. Save to file'
      ],
      outputFormat: 'JSON object with implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'codePath', 'complexity', 'artifacts'],
      properties: {
        code: { type: 'string' },
        codePath: { type: 'string' },
        complexity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-structure', 'implementation']
}));

export const operationVerificationTask = defineTask('operation-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.dataStructure} Operations`,
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Verify all data structure operations',
      context: args,
      instructions: [
        '1. Test each operation',
        '2. Verify invariants maintained',
        '3. Test edge cases',
        '4. Test stress cases',
        '5. Document results'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['allVerified', 'operationResults', 'artifacts'],
      properties: {
        allVerified: { type: 'boolean' },
        operationResults: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-structure', 'verification']
}));

export const performanceBenchmarkingTask = defineTask('performance-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmark ${args.dataStructure}`,
  skills: ['code-profiler'],
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark data structure performance',
      context: args,
      instructions: [
        '1. Benchmark each operation',
        '2. Test with various sizes',
        '3. Measure memory usage',
        '4. Compare to expected complexity',
        '5. Create benchmark report'
      ],
      outputFormat: 'JSON object with benchmarks'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'reportPath', 'artifacts'],
      properties: {
        results: { type: 'object' },
        reportPath: { type: 'string' },
        matchesExpected: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-structure', 'benchmarking']
}));

/**
 * @process specializations/algorithms-optimization/cp-library-creation
 * @description Competitive Programming Library Creation - Building a personal algorithm library with template
 * implementations of common algorithms, data structures, and patterns for quick contest usage.
 * @inputs { category?: string, algorithms?: array, language?: string }
 * @outputs { success: boolean, libraryPath: string, algorithms: array, documentation: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/cp-library-creation', {
 *   category: 'graph',
 *   algorithms: ['dijkstra', 'bfs', 'dfs', 'union-find'],
 *   language: 'cpp'
 * });
 *
 * @references
 * - CP-Algorithms: https://cp-algorithms.com/
 * - Competitive Programming 4 by Steven Halim
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    category = 'general',
    algorithms = [],
    language = 'cpp',
    outputDir = 'cp-library-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Creating CP Library - Category: ${category}`);

  // PHASE 1: Library Design
  const design = await ctx.task(libraryDesignTask, { category, algorithms, language, outputDir });
  artifacts.push(...design.artifacts);

  // PHASE 2: Template Implementation
  const implementation = await ctx.task(templateImplementationTask, { design, language, outputDir });
  artifacts.push(...implementation.artifacts);

  // PHASE 3: Testing Suite
  const testing = await ctx.task(testingSuiteTask, { implementation, language, outputDir });
  artifacts.push(...testing.artifacts);

  // PHASE 4: Documentation
  const documentation = await ctx.task(documentationTask, { design, implementation, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `CP Library created for ${category}. ${implementation.algorithmCount} algorithms implemented. Review?`,
    title: 'CP Library Creation Complete',
    context: {
      runId: ctx.runId,
      category,
      algorithmCount: implementation.algorithmCount,
      files: [
        { path: implementation.libraryPath, format: language, label: 'Library' },
        { path: documentation.docPath, format: 'markdown', label: 'Documentation' }
      ]
    }
  });

  return {
    success: true,
    category,
    libraryPath: implementation.libraryPath,
    algorithms: implementation.algorithms,
    documentation: documentation.docPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/cp-library-creation', timestamp: startTime, outputDir }
  };
}

export const libraryDesignTask = defineTask('library-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Library Design - ${args.category}`,
  skills: ['code-template-manager', 'segment-tree-builder', 'advanced-ds-library'],
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Competitive Programming Expert',
      task: 'Design competitive programming library structure',
      context: args,
      instructions: [
        '1. Define library structure and organization',
        '2. List algorithms to include',
        '3. Design template interfaces',
        '4. Plan for contest-friendly usage',
        '5. Define coding conventions'
      ],
      outputFormat: 'JSON object with library design'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'algorithms', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        algorithms: { type: 'array', items: { type: 'object' } },
        conventions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cp-library', 'design']
}));

export const templateImplementationTask = defineTask('template-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Template Implementation',
  skills: ['code-template-manager', 'segment-tree-builder', 'advanced-ds-library'],
  agent: {
    name: 'data-structures-expert',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement algorithm templates',
      context: args,
      instructions: [
        '1. Implement each algorithm',
        '2. Use contest-friendly code style',
        '3. Include quick usage comments',
        '4. Optimize for copy-paste usage',
        '5. Save to library file'
      ],
      outputFormat: 'JSON object with implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'algorithmCount', 'libraryPath', 'artifacts'],
      properties: {
        algorithms: { type: 'array', items: { type: 'object' } },
        algorithmCount: { type: 'number' },
        libraryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cp-library', 'implementation']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Library Testing Suite',
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Create and run tests for library',
      context: args,
      instructions: [
        '1. Create test cases for each algorithm',
        '2. Include edge case tests',
        '3. Verify correctness',
        '4. Benchmark performance',
        '5. Document test results'
      ],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'testResults', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        testResults: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cp-library', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Library Documentation',
  agent: {
    name: 'algorithm-teacher',
    prompt: {
      role: 'Technical Writer',
      task: 'Create library documentation',
      context: args,
      instructions: [
        '1. Document each algorithm',
        '2. Include complexity analysis',
        '3. Provide usage examples',
        '4. Create quick reference',
        '5. Save documentation'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'quickReference', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        quickReference: { type: 'string' },
        usageExamples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cp-library', 'documentation']
}));

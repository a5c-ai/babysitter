/**
 * @process specializations/algorithms-optimization/trie-suffix-structures
 * @description Trie and Suffix Structure Building - Implementation of trie, suffix array, and suffix tree with
 * applications to pattern matching, autocomplete, and string processing problems.
 * @inputs { structure: string, strings?: array }
 * @outputs { success: boolean, implementation: string, applications: array, artifacts: array }
 *
 * @references
 * - Suffix Structures: https://cp-algorithms.com/string/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { structure = 'trie', strings = [], language = 'cpp', outputDir = 'suffix-structures-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Building ${structure} structure`);

  const design = await ctx.task(structureDesignTask, { structure, outputDir });
  artifacts.push(...design.artifacts);

  const implementation = await ctx.task(structureImplementationTask, { structure, design, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const applications = await ctx.task(applicationsTask, { structure, implementation, strings, outputDir });
  artifacts.push(...applications.artifacts);

  await ctx.breakpoint({
    question: `${structure} structure implemented. Applications demonstrated: ${applications.demonstrated.length}. Review?`,
    title: 'Suffix Structure Complete',
    context: { runId: ctx.runId, structure, applications: applications.demonstrated }
  });

  return {
    success: true,
    structure,
    implementation: implementation.code,
    applications: applications.demonstrated,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const structureDesignTask = defineTask('structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design ${args.structure}`,
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'Data Structure Expert',
      task: 'Design suffix/trie structure',
      context: args,
      instructions: ['1. Design internal representation', '2. Plan operations', '3. Analyze complexity', '4. Document design'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'operations', 'artifacts'],
      properties: { design: { type: 'object' }, operations: { type: 'array' }, complexity: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'suffix-structures', 'design']
}));

export const structureImplementationTask = defineTask('structure-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.structure}`,
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement suffix/trie structure',
      context: args,
      instructions: ['1. Implement data structure', '2. Implement all operations', '3. Handle edge cases', '4. Document code'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, operations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'suffix-structures', 'implementation']
}));

export const applicationsTask = defineTask('applications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Demonstrate Applications',
  agent: {
    name: 'string-specialist',
    prompt: {
      role: 'Algorithm Expert',
      task: 'Demonstrate string structure applications',
      context: args,
      instructions: ['1. Implement pattern matching', '2. Implement autocomplete', '3. Implement string queries', '4. Document applications'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['demonstrated', 'artifacts'],
      properties: { demonstrated: { type: 'array' }, examples: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'suffix-structures', 'applications']
}));

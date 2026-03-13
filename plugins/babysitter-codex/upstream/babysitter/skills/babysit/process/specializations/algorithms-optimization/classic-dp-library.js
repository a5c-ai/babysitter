/**
 * @process specializations/algorithms-optimization/classic-dp-library
 * @description Classic DP Problem Library Building - Comprehensive process for solving and documenting classic DP
 * problems (knapsack, LCS, edit distance, matrix chain, coin change) with multiple approaches.
 * @inputs { problems?: array, language?: string }
 * @outputs { success: boolean, problemsSolved: number, library: object, artifacts: array }
 *
 * @references
 * - Classic DP Problems: https://www.geeksforgeeks.org/dynamic-programming/
 * - CLRS Dynamic Programming Chapter
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problems = ['knapsack', 'lcs', 'edit-distance', 'matrix-chain', 'coin-change'],
    language = 'python',
    outputDir = 'classic-dp-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const library = {};

  ctx.log('info', `Building Classic DP Library - ${problems.length} problems`);

  for (const problem of problems) {
    ctx.log('info', `Solving ${problem}`);

    const solution = await ctx.task(classicDPSolutionTask, { problem, language, outputDir });
    artifacts.push(...solution.artifacts);
    library[problem] = solution;
  }

  const documentation = await ctx.task(libraryDocumentationTask, { library, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Classic DP library complete. ${problems.length} problems solved. Review?`,
    title: 'Classic DP Library Complete',
    context: { runId: ctx.runId, problems, files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
  });

  return {
    success: true,
    problemsSolved: problems.length,
    library,
    documentationPath: documentation.docPath,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const classicDPSolutionTask = defineTask('classic-dp-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solve ${args.problem}`,
  skills: ['dp-pattern-library'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Expert',
      task: `Solve classic DP problem: ${args.problem}`,
      context: args,
      instructions: [
        '1. Define problem formally',
        '2. Design DP state',
        '3. Derive recurrence',
        '4. Implement multiple approaches',
        '5. Analyze complexity',
        '6. Document solution'
      ],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['state', 'recurrence', 'implementations', 'complexity', 'artifacts'],
      properties: {
        state: { type: 'object' },
        recurrence: { type: 'string' },
        implementations: { type: 'object' },
        complexity: { type: 'object' },
        variations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'classic-dp', args.problem]
}));

export const libraryDocumentationTask = defineTask('library-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document DP Library',
  agent: {
    name: 'algorithm-teacher',
    prompt: {
      role: 'Technical Writer',
      task: 'Create comprehensive DP library documentation',
      context: args,
      instructions: ['1. Document each problem', '2. Include complexity analysis', '3. Provide usage examples', '4. Create quick reference'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'artifacts'],
      properties: { docPath: { type: 'string' }, quickReference: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'classic-dp', 'documentation']
}));

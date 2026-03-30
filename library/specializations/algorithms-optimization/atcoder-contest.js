/**
 * @process specializations/algorithms-optimization/atcoder-contest
 * @description AtCoder Contest Practice and Analysis - Process for participating in AtCoder contests with focus on
 * problem-solving speed, accuracy, and post-contest editorial analysis.
 * @inputs { contestId?: string, contestType?: string, language?: string }
 * @outputs { success: boolean, problemsSolved: number, submissions: array, editorialNotes: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/atcoder-contest', {
 *   contestId: 'abc300',
 *   contestType: 'abc',
 *   language: 'cpp'
 * });
 *
 * @references
 * - AtCoder: https://atcoder.jp/
 * - AtCoder Problems: https://kenkoooo.com/atcoder/
 * - Competitive Programming Handbook: https://cses.fi/book/book.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contestId = 'virtual',
    contestType = 'abc', // 'abc', 'arc', 'agc'
    language = 'cpp',
    outputDir = 'atcoder-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting AtCoder Contest Process - Contest: ${contestId}, Type: ${contestType}`);

  // PHASE 1: Contest Setup
  const setup = await ctx.task(contestSetupTask, { contestId, contestType, language, outputDir });
  artifacts.push(...setup.artifacts);

  // PHASE 2: Problem Solving
  const solving = await ctx.task(problemSolvingTask, { contestId, contestType, setup, language, outputDir });
  artifacts.push(...solving.artifacts);

  // PHASE 3: Editorial Analysis
  const editorial = await ctx.task(editorialAnalysisTask, { contestId, solving, outputDir });
  artifacts.push(...editorial.artifacts);

  // PHASE 4: Performance Review
  const review = await ctx.task(performanceReviewTask, { contestId, solving, editorial, outputDir });
  artifacts.push(...review.artifacts);

  await ctx.breakpoint({
    question: `AtCoder contest ${contestId} complete. Problems solved: ${solving.solvedCount}. Review results?`,
    title: 'AtCoder Contest Complete',
    context: {
      runId: ctx.runId,
      solvedCount: solving.solvedCount,
      editorialNotes: editorial.notes,
      files: review.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contestId,
    problemsSolved: solving.solvedCount,
    submissions: solving.submissions,
    editorialNotes: editorial.notes,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/atcoder-contest', timestamp: startTime, outputDir }
  };
}

export const contestSetupTask = defineTask('contest-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `AtCoder Setup - ${args.contestId}`,
  skills: ['atcoder-client', 'code-template-manager'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Competitive Programmer',
      task: 'Set up AtCoder contest environment',
      context: args,
      instructions: [
        '1. Configure development environment',
        '2. Prepare code template with fast I/O',
        '3. Set up submission helper scripts',
        '4. Review AtCoder-specific patterns'
      ],
      outputFormat: 'JSON object with setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'artifacts'],
      properties: { ready: { type: 'boolean' }, templatePath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'atcoder', 'setup']
}));

export const problemSolvingTask = defineTask('problem-solving', (args, taskCtx) => ({
  kind: 'agent',
  title: `AtCoder Problem Solving - ${args.contestId}`,
  skills: ['atcoder-client'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Competitive Programmer',
      task: 'Solve AtCoder contest problems',
      context: args,
      instructions: [
        '1. Read problems in order (A, B, C...)',
        '2. Solve easier problems quickly',
        '3. Carefully read constraints',
        '4. Test solutions thoroughly',
        '5. Submit and track results'
      ],
      outputFormat: 'JSON object with solving results'
    },
    outputSchema: {
      type: 'object',
      required: ['solvedCount', 'submissions', 'artifacts'],
      properties: {
        solvedCount: { type: 'number' },
        submissions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'atcoder', 'solving']
}));

export const editorialAnalysisTask = defineTask('editorial-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `AtCoder Editorial Analysis - ${args.contestId}`,
  skills: ['atcoder-client'],
  agent: {
    name: 'upsolving-coach',
    prompt: {
      role: 'Algorithm Analyst',
      task: 'Analyze contest editorials',
      context: args,
      instructions: [
        '1. Read official editorials',
        '2. Compare with own solutions',
        '3. Learn new techniques',
        '4. Document insights'
      ],
      outputFormat: 'JSON object with editorial analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['notes', 'artifacts'],
      properties: { notes: { type: 'array', items: { type: 'string' } }, newTechniques: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'atcoder', 'editorial']
}));

export const performanceReviewTask = defineTask('performance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `AtCoder Performance Review - ${args.contestId}`,
  skills: ['atcoder-client'],
  agent: {
    name: 'contest-strategist',
    prompt: {
      role: 'Performance Analyst',
      task: 'Review contest performance',
      context: args,
      instructions: [
        '1. Analyze time spent per problem',
        '2. Identify areas for improvement',
        '3. Update skill tracking',
        '4. Set goals for next contest'
      ],
      outputFormat: 'JSON object with performance review'
    },
    outputSchema: {
      type: 'object',
      required: ['improvements', 'artifacts'],
      properties: { improvements: { type: 'array', items: { type: 'string' } }, goals: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'atcoder', 'review']
}));

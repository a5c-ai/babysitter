/**
 * @process specializations/algorithms-optimization/codeforces-contest
 * @description Codeforces Contest Preparation and Participation - End-to-end process for Codeforces contest preparation
 * including virtual contest practice, upsolving, rating improvement tracking, and pattern mastery.
 * @inputs { contestId?: string, contestType?: string, targetRating?: number, practiceMode?: boolean }
 * @outputs { success: boolean, problemsSolved: number, rating: object, upsolvingNotes: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/codeforces-contest', {
 *   contestId: '1900',
 *   contestType: 'div2',
 *   targetRating: 1600,
 *   practiceMode: true
 * });
 *
 * @references
 * - Codeforces: https://codeforces.com/
 * - Competitive Programmer's Handbook: https://cses.fi/book/book.pdf
 * - CP-Algorithms: https://cp-algorithms.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contestId = 'virtual',
    contestType = 'div2',
    targetRating = 1400,
    practiceMode = true,
    language = 'cpp',
    templatePath = null,
    outputDir = 'codeforces-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Codeforces Contest Process - Contest: ${contestId}, Type: ${contestType}`);

  // ============================================================================
  // PHASE 1: CONTEST PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Contest Preparation');

  const preparation = await ctx.task(contestPreparationTask, {
    contestId,
    contestType,
    targetRating,
    language,
    templatePath,
    outputDir
  });

  artifacts.push(...preparation.artifacts);

  // ============================================================================
  // PHASE 2: PROBLEM SOLVING DURING CONTEST
  // ============================================================================

  ctx.log('info', 'Phase 2: Problem Solving');

  const problemSolving = await ctx.task(problemSolvingTask, {
    contestId,
    contestType,
    preparation,
    language,
    practiceMode,
    outputDir
  });

  artifacts.push(...problemSolving.artifacts);

  // Quality Gate: Mid-contest review
  await ctx.breakpoint({
    question: `Contest progress: ${problemSolving.solvedCount} problems solved. Continue or take strategic break?`,
    title: 'Contest Progress Review',
    context: {
      runId: ctx.runId,
      solvedCount: problemSolving.solvedCount,
      attemptedCount: problemSolving.attemptedCount,
      remainingTime: problemSolving.remainingTime,
      files: problemSolving.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: POST-CONTEST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Post-Contest Analysis');

  const postAnalysis = await ctx.task(postContestAnalysisTask, {
    contestId,
    problemSolving,
    outputDir
  });

  artifacts.push(...postAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: UPSOLVING
  // ============================================================================

  ctx.log('info', 'Phase 4: Upsolving Unsolved Problems');

  const upsolving = await ctx.task(upsolvingTask, {
    contestId,
    problemSolving,
    postAnalysis,
    language,
    outputDir
  });

  artifacts.push(...upsolving.artifacts);

  // ============================================================================
  // PHASE 5: RATING AND PROGRESS TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 5: Rating and Progress Tracking');

  const progressTracking = await ctx.task(progressTrackingTask, {
    contestId,
    targetRating,
    problemSolving,
    upsolving,
    outputDir
  });

  artifacts.push(...progressTracking.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Contest analysis complete. Problems solved: ${problemSolving.solvedCount}. Upsolving complete: ${upsolving.upsolvingComplete}. Review results?`,
    title: 'Contest Session Complete',
    context: {
      runId: ctx.runId,
      summary: {
        contestId,
        solvedCount: problemSolving.solvedCount,
        upsolvingCount: upsolving.upsolvedCount,
        weakAreas: postAnalysis.weakAreas,
        improvement: progressTracking.ratingChange
      },
      files: [
        { path: postAnalysis.analysisPath, format: 'markdown', label: 'Contest Analysis' },
        { path: progressTracking.progressPath, format: 'json', label: 'Progress Tracking' }
      ]
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    contestId,
    contestType,
    problemsSolved: problemSolving.solvedCount,
    totalProblems: problemSolving.totalProblems,
    rating: progressTracking.currentRating,
    upsolvingNotes: upsolving.notes,
    weakAreas: postAnalysis.weakAreas,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/algorithms-optimization/codeforces-contest',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const contestPreparationTask = defineTask('contest-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Contest Preparation - ${args.contestId}`,
  skills: ['codeforces-api-client', 'code-template-manager'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Competitive Programmer',
      task: 'Prepare for Codeforces contest',
      context: args,
      instructions: [
        '1. Set up development environment and template',
        '2. Review common algorithms for contest level',
        '3. Warm up with 1-2 practice problems',
        '4. Prepare debugging tools and strategies',
        '5. Set up fast I/O template',
        '6. Review time management strategy'
      ],
      outputFormat: 'JSON object with preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['prepared', 'templateReady', 'artifacts'],
      properties: {
        prepared: { type: 'boolean' },
        templateReady: { type: 'boolean' },
        warmupProblems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'codeforces', 'preparation']
}));

export const problemSolvingTask = defineTask('problem-solving', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Problem Solving - ${args.contestId}`,
  skills: ['codeforces-api-client', 'test-case-generator'],
  agent: {
    name: 'competitive-programmer',
    prompt: {
      role: 'Competitive Programmer',
      task: 'Solve contest problems systematically',
      context: args,
      instructions: [
        '1. Read all problems quickly to assess difficulty',
        '2. Start with easiest problems first',
        '3. Implement solutions carefully, test before submit',
        '4. Track time spent on each problem',
        '5. Move on if stuck for too long',
        '6. Document approaches and solutions'
      ],
      outputFormat: 'JSON object with solving progress'
    },
    outputSchema: {
      type: 'object',
      required: ['solvedCount', 'attemptedCount', 'totalProblems', 'artifacts'],
      properties: {
        solvedCount: { type: 'number' },
        attemptedCount: { type: 'number' },
        totalProblems: { type: 'number' },
        solutions: { type: 'array', items: { type: 'object' } },
        remainingTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'codeforces', 'problem-solving']
}));

export const postContestAnalysisTask = defineTask('post-contest-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Post-Contest Analysis - ${args.contestId}`,
  skills: ['codeforces-api-client'],
  agent: {
    name: 'contest-strategist',
    prompt: {
      role: 'Algorithm Analyst',
      task: 'Analyze contest performance',
      context: args,
      instructions: [
        '1. Review each problem attempt',
        '2. Identify mistakes and wrong approaches',
        '3. Analyze time management effectiveness',
        '4. Identify knowledge gaps and weak areas',
        '5. Compare solutions with editorial',
        '6. Document lessons learned'
      ],
      outputFormat: 'JSON object with analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['weakAreas', 'lessons', 'analysisPath', 'artifacts'],
      properties: {
        weakAreas: { type: 'array', items: { type: 'string' } },
        lessons: { type: 'array', items: { type: 'string' } },
        mistakes: { type: 'array', items: { type: 'object' } },
        analysisPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'codeforces', 'analysis']
}));

export const upsolvingTask = defineTask('upsolving', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Upsolving - ${args.contestId}`,
  skills: ['codeforces-api-client'],
  agent: {
    name: 'upsolving-coach',
    prompt: {
      role: 'Algorithm Learner',
      task: 'Upsolve problems not solved during contest',
      context: args,
      instructions: [
        '1. Read editorials for unsolved problems',
        '2. Understand the intended solution approach',
        '3. Implement solution without looking at code',
        '4. Compare with editorial solution',
        '5. Document new techniques learned',
        '6. Add to personal algorithm library'
      ],
      outputFormat: 'JSON object with upsolving results'
    },
    outputSchema: {
      type: 'object',
      required: ['upsolvedCount', 'upsolvingComplete', 'notes', 'artifacts'],
      properties: {
        upsolvedCount: { type: 'number' },
        upsolvingComplete: { type: 'boolean' },
        notes: { type: 'array', items: { type: 'string' } },
        newTechniques: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'codeforces', 'upsolving']
}));

export const progressTrackingTask = defineTask('progress-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Progress Tracking - ${args.contestId}`,
  skills: ['codeforces-api-client'],
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Performance Analyst',
      task: 'Track rating and progress over time',
      context: args,
      instructions: [
        '1. Calculate expected rating change',
        '2. Update progress tracking metrics',
        '3. Identify improvement trends',
        '4. Set goals for next contest',
        '5. Create progress report',
        '6. Update learning plan based on performance'
      ],
      outputFormat: 'JSON object with progress tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['currentRating', 'ratingChange', 'progressPath', 'artifacts'],
      properties: {
        currentRating: { type: 'object' },
        ratingChange: { type: 'number' },
        trend: { type: 'string' },
        nextGoals: { type: 'array', items: { type: 'string' } },
        progressPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'codeforces', 'progress-tracking']
}));

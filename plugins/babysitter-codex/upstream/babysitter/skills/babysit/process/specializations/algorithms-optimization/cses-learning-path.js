/**
 * @process specializations/algorithms-optimization/cses-learning-path
 * @description CSES Problem Set Systematic Learning Path - Structured approach to completing the CSES problem set
 * (300 problems) covering all algorithm topics systematically with tracking and mastery verification.
 * @inputs { currentTopic?: string, targetProblems?: number, language?: string }
 * @outputs { success: boolean, problemsSolved: number, topicsMastered: array, progressReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/algorithms-optimization/cses-learning-path', {
 *   currentTopic: 'dynamic-programming',
 *   targetProblems: 10,
 *   language: 'cpp'
 * });
 *
 * @references
 * - CSES Problem Set: https://cses.fi/problemset/
 * - Competitive Programmer's Handbook: https://cses.fi/book/book.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    currentTopic = 'introductory',
    targetProblems = 5,
    language = 'cpp',
    outputDir = 'cses-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CSES Learning Path - Topic: ${currentTopic}, Target: ${targetProblems} problems`);

  // PHASE 1: Topic Selection and Planning
  const planning = await ctx.task(topicPlanningTask, { currentTopic, targetProblems, outputDir });
  artifacts.push(...planning.artifacts);

  // PHASE 2: Problem Solving Session
  const solving = await ctx.task(problemSolvingSessionTask, { planning, language, outputDir });
  artifacts.push(...solving.artifacts);

  // PHASE 3: Mastery Verification
  const mastery = await ctx.task(masteryVerificationTask, { currentTopic, solving, outputDir });
  artifacts.push(...mastery.artifacts);

  // PHASE 4: Progress Update
  const progress = await ctx.task(progressUpdateTask, { currentTopic, solving, mastery, outputDir });
  artifacts.push(...progress.artifacts);

  await ctx.breakpoint({
    question: `CSES session complete. Topic: ${currentTopic}. Problems solved: ${solving.solvedCount}. Mastery: ${mastery.masteryLevel}%. Continue?`,
    title: 'CSES Learning Session Complete',
    context: {
      runId: ctx.runId,
      topic: currentTopic,
      solvedCount: solving.solvedCount,
      masteryLevel: mastery.masteryLevel,
      files: progress.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    currentTopic,
    problemsSolved: solving.solvedCount,
    topicsMastered: mastery.masteredTopics,
    progressReport: progress.report,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/algorithms-optimization/cses-learning-path', timestamp: startTime, outputDir }
  };
}

export const topicPlanningTask = defineTask('topic-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `CSES Topic Planning - ${args.currentTopic}`,
  skills: ['cses-tracker', 'dp-pattern-library'],
  agent: {
    name: 'algorithm-teacher',
    prompt: {
      role: 'Algorithm Curriculum Designer',
      task: 'Plan CSES problem set learning session',
      context: args,
      instructions: [
        '1. Review CSES topic categories',
        '2. Select problems for current topic',
        '3. Order by difficulty progression',
        '4. Identify prerequisites',
        '5. Create learning plan'
      ],
      outputFormat: 'JSON object with learning plan'
    },
    outputSchema: {
      type: 'object',
      required: ['problems', 'prerequisites', 'artifacts'],
      properties: {
        problems: { type: 'array', items: { type: 'object' } },
        prerequisites: { type: 'array', items: { type: 'string' } },
        estimatedTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cses', 'planning']
}));

export const problemSolvingSessionTask = defineTask('problem-solving-session', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CSES Problem Solving Session',
  skills: ['cses-tracker'],
  agent: {
    name: 'upsolving-coach',
    prompt: {
      role: 'Competitive Programmer',
      task: 'Solve CSES problems systematically',
      context: args,
      instructions: [
        '1. Read problem statement carefully',
        '2. Analyze constraints and edge cases',
        '3. Design solution approach',
        '4. Implement and test solution',
        '5. Submit and verify acceptance',
        '6. Document solution and complexity'
      ],
      outputFormat: 'JSON object with solving results'
    },
    outputSchema: {
      type: 'object',
      required: ['solvedCount', 'solutions', 'artifacts'],
      properties: {
        solvedCount: { type: 'number' },
        solutions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cses', 'solving']
}));

export const masteryVerificationTask = defineTask('mastery-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `CSES Mastery Verification - ${args.currentTopic}`,
  skills: ['cses-tracker'],
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Algorithm Assessor',
      task: 'Verify topic mastery',
      context: args,
      instructions: [
        '1. Assess problem-solving success rate',
        '2. Evaluate solution quality',
        '3. Check complexity understanding',
        '4. Determine mastery level',
        '5. Identify remaining gaps'
      ],
      outputFormat: 'JSON object with mastery assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['masteryLevel', 'masteredTopics', 'artifacts'],
      properties: {
        masteryLevel: { type: 'number' },
        masteredTopics: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cses', 'mastery']
}));

export const progressUpdateTask = defineTask('progress-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CSES Progress Update',
  skills: ['cses-tracker'],
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Progress Tracker',
      task: 'Update CSES learning progress',
      context: args,
      instructions: [
        '1. Update problem completion status',
        '2. Track topic progress',
        '3. Calculate overall completion',
        '4. Recommend next topics',
        '5. Generate progress report'
      ],
      outputFormat: 'JSON object with progress update'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'nextTopics', 'artifacts'],
      properties: {
        report: { type: 'object' },
        nextTopics: { type: 'array', items: { type: 'string' } },
        overallProgress: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'cses', 'progress']
}));

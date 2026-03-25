/**
 * @process specializations/algorithms-optimization/progress-tracking
 * @description Algorithm Learning Progress Tracking - Track problems solved, topics mastered, contest ratings,
 * and improvement trends over time with visualization and goal setting.
 * @inputs { userId?: string, timeframe?: string }
 * @outputs { success: boolean, progress: object, trends: object, recommendations: array, artifacts: array }
 *
 * @references
 * - Learning Analytics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { userId = 'default', timeframe = '30days', outputDir = 'progress-tracking-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Tracking Progress - User: ${userId}, Timeframe: ${timeframe}`);

  const dataCollection = await ctx.task(dataCollectionTask, { userId, timeframe, outputDir });
  artifacts.push(...dataCollection.artifacts);

  const analysis = await ctx.task(progressAnalysisTask, { data: dataCollection.data, outputDir });
  artifacts.push(...analysis.artifacts);

  const recommendations = await ctx.task(recommendationsTask, { analysis, outputDir });
  artifacts.push(...recommendations.artifacts);

  await ctx.breakpoint({
    question: `Progress tracking complete. Problems solved: ${analysis.problemsSolved}. Rating change: ${analysis.ratingChange}. Review?`,
    title: 'Progress Tracking Complete',
    context: { runId: ctx.runId, problemsSolved: analysis.problemsSolved, trends: analysis.trends }
  });

  return {
    success: true,
    userId,
    progress: analysis.progress,
    trends: analysis.trends,
    recommendations: recommendations.items,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect Progress Data',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Data Analyst',
      task: 'Collect learning progress data',
      context: args,
      instructions: ['1. Collect problems solved', '2. Collect topic coverage', '3. Collect contest results', '4. Collect time spent', '5. Organize data'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'artifacts'],
      properties: { data: { type: 'object' }, sources: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'progress-tracking', 'collection']
}));

export const progressAnalysisTask = defineTask('progress-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Progress',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Learning Analyst',
      task: 'Analyze learning progress',
      context: args,
      instructions: ['1. Calculate statistics', '2. Identify trends', '3. Compare to goals', '4. Identify patterns', '5. Create visualizations'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['progress', 'trends', 'problemsSolved', 'ratingChange', 'artifacts'],
      properties: { progress: { type: 'object' }, trends: { type: 'object' }, problemsSolved: { type: 'number' }, ratingChange: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'progress-tracking', 'analysis']
}));

export const recommendationsTask = defineTask('recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Recommendations',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Learning Coach',
      task: 'Generate learning recommendations',
      context: args,
      instructions: ['1. Identify areas for improvement', '2. Suggest next topics', '3. Recommend problems', '4. Adjust goals', '5. Create action items'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'artifacts'],
      properties: { items: { type: 'array' }, nextSteps: { type: 'array' }, adjustedGoals: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'progress-tracking', 'recommendations']
}));

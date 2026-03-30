/**
 * @process specializations/algorithms-optimization/behavioral-interview-prep
 * @description Behavioral Interview Preparation - Process for preparing STAR format responses, leadership principles
 * practice, and communication skill development for tech interviews.
 * @inputs { company?: string, principles?: array }
 * @outputs { success: boolean, preparedStories: array, practiceResults: object, artifacts: array }
 *
 * @references
 * - Amazon Leadership Principles
 * - STAR Interview Method
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { company = 'general', principles = ['leadership', 'problem-solving', 'teamwork'], outputDir = 'behavioral-interview-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Behavioral Interview Prep - ${company}`);

  const storyGeneration = await ctx.task(storyGenerationTask, { company, principles, outputDir });
  artifacts.push(...storyGeneration.artifacts);

  const starFormatting = await ctx.task(starFormattingTask, { stories: storyGeneration.stories, outputDir });
  artifacts.push(...starFormatting.artifacts);

  const practice = await ctx.task(behavioralPracticeTask, { starFormatting, company, outputDir });
  artifacts.push(...practice.artifacts);

  await ctx.breakpoint({
    question: `Behavioral prep complete. ${starFormatting.formattedStories.length} stories prepared. Practice score: ${practice.score}/100. Review?`,
    title: 'Behavioral Interview Prep Complete',
    context: { runId: ctx.runId, company, storiesCount: starFormatting.formattedStories.length }
  });

  return {
    success: true,
    company,
    preparedStories: starFormatting.formattedStories,
    practiceResults: practice.results,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const storyGenerationTask = defineTask('story-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Stories',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Interview Coach',
      task: 'Generate behavioral interview stories',
      context: args,
      instructions: ['1. Identify relevant experiences', '2. Map experiences to principles', '3. Select impactful stories', '4. Document story outlines'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['stories', 'artifacts'],
      properties: { stories: { type: 'array' }, principleMapping: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'behavioral-interview', 'stories']
}));

export const starFormattingTask = defineTask('star-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Format STAR Responses',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Interview Coach',
      task: 'Format stories in STAR format',
      context: args,
      instructions: ['1. Structure Situation clearly', '2. Define Task specifically', '3. Detail Actions taken', '4. Quantify Results', '5. Practice timing'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['formattedStories', 'artifacts'],
      properties: { formattedStories: { type: 'array' }, timing: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'behavioral-interview', 'star']
}));

export const behavioralPracticeTask = defineTask('behavioral-practice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Practice Behavioral Questions',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interviewer',
      task: 'Practice behavioral interview questions',
      context: args,
      instructions: ['1. Ask behavioral questions', '2. Evaluate responses', '3. Provide feedback', '4. Score performance', '5. Suggest improvements'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'score', 'artifacts'],
      properties: { results: { type: 'object' }, score: { type: 'number' }, feedback: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'behavioral-interview', 'practice']
}));

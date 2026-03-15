/**
 * @process specializations/algorithms-optimization/faang-interview-prep
 * @description FAANG Technical Interview Preparation - Systematic preparation for technical interviews including
 * problem-solving practice, time-boxed sessions, communication practice, and mock interviews.
 * @inputs { company?: string, role?: string, timeframe?: number }
 * @outputs { success: boolean, preparationPlan: object, progress: object, artifacts: array }
 *
 * @references
 * - Cracking the Coding Interview
 * - FAANG Interview Preparation Guides
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { company = 'general', role = 'software-engineer', timeframe = 4, outputDir = 'faang-interview-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting FAANG Interview Preparation - ${company}, ${role}`);

  const assessment = await ctx.task(skillAssessmentTask, { company, role, outputDir });
  artifacts.push(...assessment.artifacts);

  const plan = await ctx.task(preparationPlanTask, { assessment, timeframe, company, role, outputDir });
  artifacts.push(...plan.artifacts);

  const practice = await ctx.task(practiceSessionTask, { plan, outputDir });
  artifacts.push(...practice.artifacts);

  const mockInterview = await ctx.task(mockInterviewTask, { company, role, plan, outputDir });
  artifacts.push(...mockInterview.artifacts);

  await ctx.breakpoint({
    question: `Interview preparation session complete. Mock interview score: ${mockInterview.score}/100. Review plan?`,
    title: 'FAANG Interview Prep Complete',
    context: { runId: ctx.runId, company, role, mockScore: mockInterview.score, weakAreas: assessment.weakAreas }
  });

  return {
    success: true,
    company,
    role,
    preparationPlan: plan.plan,
    progress: { assessment: assessment.scores, mockScore: mockInterview.score },
    weakAreas: assessment.weakAreas,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const skillAssessmentTask = defineTask('skill-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Technical Skills',
  skills: ['interview-question-bank'],
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interview Coach',
      task: 'Assess current technical skills for interview readiness',
      context: args,
      instructions: ['1. Assess data structures knowledge', '2. Assess algorithm knowledge', '3. Assess system design skills', '4. Identify weak areas', '5. Create skill matrix'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'weakAreas', 'artifacts'],
      properties: { scores: { type: 'object' }, weakAreas: { type: 'array' }, strengths: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'faang-interview', 'assessment']
}));

export const preparationPlanTask = defineTask('preparation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Preparation Plan',
  skills: ['interview-question-bank'],
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interview Coach',
      task: 'Create interview preparation plan',
      context: args,
      instructions: ['1. Create weekly schedule', '2. Assign topics to weeks', '3. Include practice problems', '4. Plan mock interviews', '5. Set milestones'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: { plan: { type: 'object' }, schedule: { type: 'array' }, problems: { type: 'array' }, milestones: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'faang-interview', 'plan']
}));

export const practiceSessionTask = defineTask('practice-session', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Practice Session',
  skills: ['interview-question-bank', 'leetcode-problem-fetcher'],
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interview Coach',
      task: 'Conduct problem-solving practice session',
      context: args,
      instructions: ['1. Select appropriate problems', '2. Time-box problem solving', '3. Evaluate solutions', '4. Provide feedback', '5. Track progress'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['problemsSolved', 'feedback', 'artifacts'],
      properties: { problemsSolved: { type: 'number' }, feedback: { type: 'array' }, improvements: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'faang-interview', 'practice']
}));

export const mockInterviewTask = defineTask('mock-interview', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Mock Interview',
  skills: ['interview-question-bank', 'mock-interview-runner'],
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interviewer',
      task: 'Conduct mock technical interview',
      context: args,
      instructions: ['1. Simulate real interview conditions', '2. Ask coding question', '3. Evaluate communication', '4. Evaluate problem-solving', '5. Provide detailed feedback'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'feedback', 'artifacts'],
      properties: { score: { type: 'number' }, feedback: { type: 'object' }, strengths: { type: 'array' }, improvements: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'faang-interview', 'mock']
}));

/**
 * @process specializations/algorithms-optimization/mock-coding-interview
 * @description Mock Coding Interview Session - Full mock interview simulation with problem presentation, timed solving,
 * hint system, and detailed feedback on problem-solving approach, code quality, and communication.
 * @inputs { difficulty?: string, topics?: array, duration?: number }
 * @outputs { success: boolean, score: object, feedback: object, artifacts: array }
 *
 * @references
 * - Technical Interview Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { difficulty = 'medium', topics = ['arrays', 'strings', 'trees'], duration = 45, language = 'python', outputDir = 'mock-interview-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Mock Coding Interview - Difficulty: ${difficulty}, Duration: ${duration}min`);

  const problemSelection = await ctx.task(problemSelectionTask, { difficulty, topics, outputDir });
  artifacts.push(...problemSelection.artifacts);

  const interview = await ctx.task(interviewSimulationTask, { problem: problemSelection.problem, duration, language, outputDir });
  artifacts.push(...interview.artifacts);

  const evaluation = await ctx.task(solutionEvaluationTask, { interview, problemSelection, outputDir });
  artifacts.push(...evaluation.artifacts);

  const feedback = await ctx.task(detailedFeedbackTask, { interview, evaluation, outputDir });
  artifacts.push(...feedback.artifacts);

  await ctx.breakpoint({
    question: `Mock interview complete. Overall score: ${evaluation.overallScore}/100. Review detailed feedback?`,
    title: 'Mock Interview Complete',
    context: { runId: ctx.runId, score: evaluation.overallScore, strengths: feedback.strengths, improvements: feedback.improvements }
  });

  return {
    success: true,
    difficulty,
    problem: problemSelection.problem.title,
    score: evaluation.scores,
    feedback: feedback.detailed,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const problemSelectionTask = defineTask('problem-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Interview Problem',
  skills: ['interview-question-bank', 'leetcode-problem-fetcher'],
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interviewer',
      task: 'Select appropriate interview problem',
      context: args,
      instructions: ['1. Select problem matching difficulty', '2. Ensure topic coverage', '3. Include follow-up questions', '4. Prepare hints', '5. Document expected solution'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['problem', 'artifacts'],
      properties: { problem: { type: 'object' }, hints: { type: 'array' }, expectedSolution: { type: 'object' }, followUps: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'mock-interview', 'selection']
}));

export const interviewSimulationTask = defineTask('interview-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulate Interview',
  skills: ['mock-interview-runner'],
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interviewer',
      task: 'Simulate coding interview',
      context: args,
      instructions: ['1. Present problem', '2. Allow clarifying questions', '3. Monitor time', '4. Provide hints if needed', '5. Track problem-solving process'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'timeline', 'artifacts'],
      properties: { solution: { type: 'string' }, timeline: { type: 'array' }, hintsUsed: { type: 'number' }, clarifications: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'mock-interview', 'simulation']
}));

export const solutionEvaluationTask = defineTask('solution-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate Solution',
  skills: ['solution-comparator', 'complexity-analyzer'],
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Technical Interviewer',
      task: 'Evaluate interview solution',
      context: args,
      instructions: ['1. Check correctness', '2. Evaluate code quality', '3. Evaluate complexity', '4. Evaluate communication', '5. Calculate overall score'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'overallScore', 'artifacts'],
      properties: { scores: { type: 'object' }, overallScore: { type: 'number' }, correctness: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'mock-interview', 'evaluation']
}));

export const detailedFeedbackTask = defineTask('detailed-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Provide Detailed Feedback',
  agent: {
    name: 'feedback-generator',
    prompt: {
      role: 'Interview Coach',
      task: 'Provide detailed interview feedback',
      context: args,
      instructions: ['1. Highlight strengths', '2. Identify improvements', '3. Compare to optimal solution', '4. Provide actionable advice', '5. Create improvement plan'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['detailed', 'strengths', 'improvements', 'artifacts'],
      properties: { detailed: { type: 'object' }, strengths: { type: 'array' }, improvements: { type: 'array' }, actionItems: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'mock-interview', 'feedback']
}));

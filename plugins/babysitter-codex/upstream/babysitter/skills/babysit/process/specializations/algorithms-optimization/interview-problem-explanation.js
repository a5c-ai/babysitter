/**
 * @process specializations/algorithms-optimization/interview-problem-explanation
 * @description Interview Problem-Solving Explanation Practice - Practice explaining thought process while solving
 * problems, including clarifying requirements, discussing trade-offs, and communicating complexity analysis.
 * @inputs { problem: string, language?: string }
 * @outputs { success: boolean, explanation: object, evaluation: object, artifacts: array }
 *
 * @references
 * - Technical Communication Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problem, language = 'python', outputDir = 'explanation-practice-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Interview Problem Explanation Practice');

  const clarification = await ctx.task(clarificationPracticeTask, { problem, outputDir });
  artifacts.push(...clarification.artifacts);

  const approach = await ctx.task(approachExplanationTask, { problem, clarification, outputDir });
  artifacts.push(...approach.artifacts);

  const implementation = await ctx.task(implementationExplanationTask, { problem, approach, language, outputDir });
  artifacts.push(...implementation.artifacts);

  const evaluation = await ctx.task(communicationEvaluationTask, { clarification, approach, implementation, outputDir });
  artifacts.push(...evaluation.artifacts);

  await ctx.breakpoint({
    question: `Explanation practice complete. Communication score: ${evaluation.score}/100. Review feedback?`,
    title: 'Explanation Practice Complete',
    context: { runId: ctx.runId, score: evaluation.score, feedback: evaluation.feedback }
  });

  return {
    success: true,
    problem,
    explanation: { clarification: clarification.questions, approach: approach.explanation, implementation: implementation.walkthrough },
    evaluation: evaluation.results,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const clarificationPracticeTask = defineTask('clarification-practice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Practice Clarifications',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Interview Coach',
      task: 'Practice asking clarifying questions',
      context: args,
      instructions: ['1. Identify ambiguities', '2. Ask about constraints', '3. Clarify edge cases', '4. Confirm understanding', '5. Evaluate question quality'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'artifacts'],
      properties: { questions: { type: 'array' }, quality: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'explanation', 'clarification']
}));

export const approachExplanationTask = defineTask('approach-explanation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Practice Approach Explanation',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Interview Coach',
      task: 'Practice explaining solution approach',
      context: args,
      instructions: ['1. Explain high-level approach', '2. Discuss alternatives', '3. Justify choice', '4. Explain complexity', '5. Discuss trade-offs'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['explanation', 'artifacts'],
      properties: { explanation: { type: 'string' }, tradeoffs: { type: 'array' }, complexity: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'explanation', 'approach']
}));

export const implementationExplanationTask = defineTask('implementation-explanation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Practice Implementation Walkthrough',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Interview Coach',
      task: 'Practice explaining implementation',
      context: args,
      instructions: ['1. Walk through code structure', '2. Explain key decisions', '3. Discuss edge case handling', '4. Test with examples', '5. Discuss improvements'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['walkthrough', 'artifacts'],
      properties: { walkthrough: { type: 'string' }, keyPoints: { type: 'array' }, testing: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'explanation', 'implementation']
}));

export const communicationEvaluationTask = defineTask('communication-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate Communication',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'Interview Coach',
      task: 'Evaluate communication quality',
      context: args,
      instructions: ['1. Evaluate clarity', '2. Evaluate structure', '3. Evaluate technical accuracy', '4. Provide feedback', '5. Score overall'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'score', 'feedback', 'artifacts'],
      properties: { results: { type: 'object' }, score: { type: 'number' }, feedback: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'explanation', 'evaluation']
}));

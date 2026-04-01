/**
 * @process specializations/algorithms-optimization/computational-geometry
 * @description Computational Geometry Problem Solving - Process for solving geometry problems including convex hull
 * (Graham scan), line intersection, closest pair of points, and geometric algorithms.
 * @inputs { problemType: string, points?: array }
 * @outputs { success: boolean, solution: object, implementation: string, artifacts: array }
 *
 * @references
 * - Computational Geometry: https://cp-algorithms.com/geometry/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemType, points = [], language = 'cpp', outputDir = 'computational-geometry-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Solving Geometry Problem: ${problemType}`);

  const analysis = await ctx.task(geometryAnalysisTask, { problemType, points, outputDir });
  artifacts.push(...analysis.artifacts);

  const implementation = await ctx.task(geometryImplementationTask, { analysis, language, outputDir });
  artifacts.push(...implementation.artifacts);

  let verification = await ctx.task(geometryVerificationTask, { implementation, points, outputDir });
    let lastFeedback = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback) {
      verification = await ctx.task(geometryVerificationTask, { ...{ implementation, points, outputDir }, feedback: lastFeedback, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({
    question: `Geometry solution for ${problemType} complete. Verified: ${verification.correct}. Review?`,
    title: 'Computational Geometry Complete',
    context: { runId: ctx.runId, problemType, verified: verification.correct },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (finalApproval.approved) break;
    lastFeedback = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  return {
    success: true,
    problemType,
    solution: analysis.solution,
    implementation: implementation.code,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const geometryAnalysisTask = defineTask('geometry-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze ${args.problemType}`,
  skills: ['convex-hull-solver', 'geometry-primitives'],
  agent: {
    name: 'geometry-specialist',
    prompt: {
      role: 'Computational Geometry Expert',
      task: 'Analyze geometry problem',
      context: args,
      instructions: ['1. Identify geometric primitives needed', '2. Select appropriate algorithm', '3. Handle edge cases', '4. Consider numerical precision'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'algorithm', 'artifacts'],
      properties: { solution: { type: 'object' }, algorithm: { type: 'string' }, precision: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'geometry', 'analysis']
}));

export const geometryImplementationTask = defineTask('geometry-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Geometry Algorithm',
  skills: ['convex-hull-solver', 'geometry-primitives'],
  agent: {
    name: 'geometry-specialist',
    prompt: {
      role: 'Algorithm Engineer',
      task: 'Implement computational geometry algorithm',
      context: args,
      instructions: ['1. Implement geometric primitives', '2. Implement main algorithm', '3. Handle floating point precision', '4. Optimize for performance'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'artifacts'],
      properties: { code: { type: 'string' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'geometry', 'implementation']
}));

export const geometryVerificationTask = defineTask('geometry-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Geometry Solution',
  skills: ['test-case-generator'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Verify geometry implementation',
      context: args,
      instructions: ['1. Test with known cases', '2. Test edge cases', '3. Verify numerical stability', '4. Test degenerate cases'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['correct', 'artifacts'],
      properties: { correct: { type: 'boolean' }, testResults: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'geometry', 'verification']
}));

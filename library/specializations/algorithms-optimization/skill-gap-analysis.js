/**
 * @process specializations/algorithms-optimization/skill-gap-analysis
 * @description Algorithm Skill Gap Analysis and Learning Plan - Systematic assessment of algorithm knowledge gaps
 * across topics (arrays, trees, graphs, DP, strings) and creation of personalized learning plan.
 * @inputs { currentLevel?: string, targetLevel?: string }
 * @outputs { success: boolean, assessment: object, gaps: array, learningPlan: object, artifacts: array }
 *
 * @references
 * - Competitive Programming Skill Tracks
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { currentLevel = 'intermediate', targetLevel = 'advanced', outputDir = 'skill-gap-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Skill Gap Analysis - Current: ${currentLevel}, Target: ${targetLevel}`);

  const assessment = await ctx.task(skillAssessmentTask, { currentLevel, outputDir });
  artifacts.push(...assessment.artifacts);

  const gapAnalysis = await ctx.task(gapAnalysisTask, { assessment, targetLevel, outputDir });
  artifacts.push(...gapAnalysis.artifacts);

  const learningPlan = await ctx.task(learningPlanCreationTask, { gapAnalysis, targetLevel, outputDir });
  artifacts.push(...learningPlan.artifacts);

  await ctx.breakpoint({
    question: `Skill gap analysis complete. ${gapAnalysis.gaps.length} gaps identified. Learning plan created. Review?`,
    title: 'Skill Gap Analysis Complete',
    context: { runId: ctx.runId, gaps: gapAnalysis.gaps, planDuration: learningPlan.estimatedDuration }
  });

  return {
    success: true,
    currentLevel,
    targetLevel,
    assessment: assessment.scores,
    gaps: gapAnalysis.gaps,
    learningPlan: learningPlan.plan,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const skillAssessmentTask = defineTask('skill-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Algorithm Skills',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Algorithm Skills Assessor',
      task: 'Assess current algorithm knowledge',
      context: args,
      instructions: ['1. Assess arrays and strings', '2. Assess trees and graphs', '3. Assess dynamic programming', '4. Assess advanced topics', '5. Create skill matrix'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'artifacts'],
      properties: { scores: { type: 'object' }, strengths: { type: 'array' }, weaknesses: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'skill-gap', 'assessment']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Skill Gaps',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Learning Analyst',
      task: 'Identify skill gaps between current and target level',
      context: args,
      instructions: ['1. Compare to target level requirements', '2. Identify missing skills', '3. Prioritize gaps', '4. Estimate effort to close', '5. Document gaps'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'artifacts'],
      properties: { gaps: { type: 'array' }, priorities: { type: 'array' }, effortEstimates: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'skill-gap', 'analysis']
}));

export const learningPlanCreationTask = defineTask('learning-plan-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Learning Plan',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Learning Plan Designer',
      task: 'Create personalized learning plan',
      context: args,
      instructions: ['1. Sequence topics optimally', '2. Select learning resources', '3. Create practice problem list', '4. Set milestones', '5. Estimate timeline'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'estimatedDuration', 'artifacts'],
      properties: { plan: { type: 'object' }, estimatedDuration: { type: 'string' }, milestones: { type: 'array' }, resources: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'skill-gap', 'planning']
}));

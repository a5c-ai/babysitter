/**
 * @process sales/new-hire-onboarding-ramp
 * @description Structured onboarding program with milestones, training curriculum, and certification requirements to accelerate time-to-productivity for new sales hires.
 * @inputs { hireName: string, role: string, startDate: string, manager: string, territory?: string, experienceLevel?: string }
 * @outputs { success: boolean, onboardingPlan: object, curriculum: array, milestones: array, certificationTracker: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/new-hire-onboarding-ramp', {
 *   hireName: 'Jane Smith',
 *   role: 'Account Executive',
 *   startDate: '2024-02-01',
 *   manager: 'John Doe',
 *   territory: 'West Region',
 *   experienceLevel: 'mid-level'
 * });
 *
 * @references
 * - MindTickle Sales Readiness: https://www.mindtickle.com/
 * - Sales Onboarding Best Practices: https://www.gartner.com/en/sales
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    hireName,
    role,
    startDate,
    manager,
    territory = '',
    experienceLevel = 'mid-level',
    rampPeriod = 90,
    outputDir = 'onboarding-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Onboarding Plan for ${hireName} - ${role}`);

  // Phase 1: Role Requirements Analysis
  const roleRequirements = await ctx.task(roleRequirementsTask, { role, experienceLevel, territory, outputDir });
  artifacts.push(...(roleRequirements.artifacts || []));

  // Phase 2: Learning Path Design
  const learningPath = await ctx.task(learningPathDesignTask, { role, roleRequirements, experienceLevel, outputDir });
  artifacts.push(...(learningPath.artifacts || []));

  // Phase 3: Week-by-Week Plan
  const weeklyPlan = await ctx.task(weeklyPlanTask, { hireName, role, learningPath, rampPeriod, startDate, outputDir });
  artifacts.push(...(weeklyPlan.artifacts || []));

  // Phase 4: Milestone Definition
  const milestones = await ctx.task(milestoneDefinitionTask, { role, weeklyPlan, rampPeriod, outputDir });
  artifacts.push(...(milestones.artifacts || []));

  // Phase 5: Certification Requirements
  const certifications = await ctx.task(certificationRequirementsTask, { role, learningPath, outputDir });
  artifacts.push(...(certifications.artifacts || []));

  // Phase 6: Buddy and Mentor Assignment
  const mentorAssignment = await ctx.task(mentorAssignmentTask, { hireName, role, manager, territory, outputDir });
  artifacts.push(...(mentorAssignment.artifacts || []));

  // Phase 7: Success Metrics Definition
  const successMetrics = await ctx.task(successMetricsTask, { role, milestones, rampPeriod, outputDir });
  artifacts.push(...(successMetrics.artifacts || []));

  // Phase 8: Onboarding Plan Compilation
  const onboardingPlan = await ctx.task(onboardingPlanCompilationTask, {
    hireName, role, startDate, manager, weeklyPlan, milestones, certifications,
    mentorAssignment, successMetrics, outputDir
  });
  artifacts.push(...(onboardingPlan.artifacts || []));

  await ctx.breakpoint({
    question: `Onboarding plan ready for ${hireName}. ${rampPeriod}-day ramp. Review and finalize?`,
    title: 'Sales Onboarding Plan Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    hireName,
    role,
    onboardingPlan: onboardingPlan.plan,
    curriculum: learningPath.curriculum,
    milestones: milestones.milestones,
    certificationTracker: certifications.tracker,
    successMetrics: successMetrics.metrics,
    artifacts,
    metadata: { processId: 'sales/new-hire-onboarding-ramp', timestamp: startTime }
  };
}

export const roleRequirementsTask = defineTask('role-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Role Requirements Analysis',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Sales enablement specialist',
      task: 'Define role requirements and competencies',
      context: args,
      instructions: ['Define key competencies', 'Identify knowledge areas', 'Map skill requirements', 'Set proficiency levels']
    },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, competencies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'requirements']
}));

export const learningPathDesignTask = defineTask('learning-path-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Learning Path Design',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Learning design specialist',
      task: 'Design comprehensive learning path',
      context: args,
      instructions: ['Design training modules', 'Sequence learning activities', 'Include varied formats', 'Build knowledge progressively']
    },
    outputSchema: { type: 'object', required: ['curriculum', 'artifacts'], properties: { curriculum: { type: 'array' }, totalHours: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'learning-path']
}));

export const weeklyPlanTask = defineTask('weekly-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Week-by-Week Plan',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Onboarding planner',
      task: 'Create detailed week-by-week onboarding plan',
      context: args,
      instructions: ['Plan each week activities', 'Balance training and practice', 'Include shadowing', 'Build toward independence']
    },
    outputSchema: { type: 'object', required: ['weeklyPlan', 'artifacts'], properties: { weeklyPlan: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'weekly-plan']
}));

export const milestoneDefinitionTask = defineTask('milestone-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Milestone Definition',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Ramp milestone specialist',
      task: 'Define ramp milestones and checkpoints',
      context: args,
      instructions: ['Define 30/60/90 day milestones', 'Set measurable criteria', 'Include activity milestones', 'Define performance checkpoints']
    },
    outputSchema: { type: 'object', required: ['milestones', 'artifacts'], properties: { milestones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'milestones']
}));

export const certificationRequirementsTask = defineTask('certification-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Certification Requirements',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Certification specialist',
      task: 'Define certification requirements',
      context: args,
      instructions: ['Define required certifications', 'Set assessment criteria', 'Create certification timeline', 'Design tracking mechanism']
    },
    outputSchema: { type: 'object', required: ['tracker', 'certifications', 'artifacts'], properties: { tracker: { type: 'object' }, certifications: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'certification']
}));

export const mentorAssignmentTask = defineTask('mentor-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Buddy and Mentor Assignment',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Mentorship coordinator',
      task: 'Design mentorship and buddy program',
      context: args,
      instructions: ['Define mentor criteria', 'Create buddy program', 'Set meeting cadence', 'Define support expectations']
    },
    outputSchema: { type: 'object', required: ['mentorship', 'artifacts'], properties: { mentorship: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'mentorship']
}));

export const successMetricsTask = defineTask('success-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Success Metrics Definition',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Performance metrics specialist',
      task: 'Define onboarding success metrics',
      context: args,
      instructions: ['Define ramp metrics', 'Set performance benchmarks', 'Create scorecard', 'Define review process']
    },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'array' }, scorecard: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'metrics']
}));

export const onboardingPlanCompilationTask = defineTask('onboarding-plan-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Onboarding Plan Compilation',
  agent: {
    name: 'enablement-specialist',
    prompt: {
      role: 'Onboarding program manager',
      task: 'Compile comprehensive onboarding plan',
      context: args,
      instructions: ['Compile all elements', 'Create executive summary', 'Build calendar view', 'Create communication materials']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'onboarding', 'compilation']
}));

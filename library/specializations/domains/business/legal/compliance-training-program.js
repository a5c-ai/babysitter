/**
 * @process specializations/domains/business/legal/compliance-training-program
 * @description Compliance Training Program - Develop role-based compliance training curricula with tracking,
 * certification, and effectiveness measurement.
 * @inputs { organizationProfile: object, trainingScope?: array, roles?: array, outputDir?: string }
 * @outputs { success: boolean, curriculum: object, courses: array, trackingPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/compliance-training-program', {
 *   organizationProfile: { name: 'Acme Corp', industry: 'financial-services', employeeCount: 5000 },
 *   trainingScope: ['code-of-conduct', 'anti-corruption', 'data-privacy'],
 *   roles: ['all-employees', 'managers', 'finance', 'sales'],
 *   outputDir: 'training-program'
 * });
 *
 * @references
 * - SCCE Training Best Practices: https://www.corporatecompliance.org/resources/books
 * - DOJ Compliance Program Guidance: https://www.justice.gov/criminal-fraud/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    trainingScope = ['code-of-conduct'],
    roles = ['all-employees'],
    outputDir = 'training-program-output',
    includeAssessments = true,
    includeCertification = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Compliance Training Program Development for ${organizationProfile.name}`);

  // Phase 1: Training Needs Assessment
  const needsAssessment = await ctx.task(trainingNeedsAssessmentTask, {
    organizationProfile,
    trainingScope,
    roles,
    outputDir
  });
  artifacts.push(...needsAssessment.artifacts);

  // Phase 2: Curriculum Design
  const curriculumDesign = await ctx.task(curriculumDesignTask, {
    needsAssessment: needsAssessment.needs,
    trainingScope,
    roles,
    outputDir
  });
  artifacts.push(...curriculumDesign.artifacts);

  // Phase 3: Course Development
  const courseDevelopment = await ctx.task(courseDevelopmentTask, {
    curriculum: curriculumDesign.curriculum,
    includeAssessments,
    outputDir
  });
  artifacts.push(...courseDevelopment.artifacts);

  // Phase 4: Certification Framework
  let certification = null;
  if (includeCertification) {
    certification = await ctx.task(certificationFrameworkTask, {
      courses: courseDevelopment.courses,
      outputDir
    });
    artifacts.push(...certification.artifacts);
  }

  // Phase 5: Tracking and Metrics
  const trackingPlan = await ctx.task(trainingTrackingTask, {
    courses: courseDevelopment.courses,
    roles,
    outputDir
  });
  artifacts.push(...trackingPlan.artifacts);

  // Phase 6: Implementation Plan
  const implementationPlan = await ctx.task(trainingImplementationTask, {
    organizationProfile,
    curriculum: curriculumDesign.curriculum,
    courses: courseDevelopment.courses,
    trackingPlan: trackingPlan.plan,
    outputDir
  });
  artifacts.push(...implementationPlan.artifacts);

  await ctx.breakpoint({
    question: `Training program for ${organizationProfile.name} complete. ${courseDevelopment.courses.length} courses created. Approve program?`,
    title: 'Training Program Review',
    context: {
      runId: ctx.runId,
      coursesCount: courseDevelopment.courses.length,
      rolesCount: roles.length,
      files: artifacts.slice(-2).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  return {
    success: true,
    organization: organizationProfile.name,
    curriculum: curriculumDesign.curriculum,
    courses: courseDevelopment.courses,
    certification: certification ? certification.framework : null,
    trackingPlan: trackingPlan.plan,
    implementationPlan: implementationPlan.plan,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/compliance-training-program', timestamp: startTime }
  };
}

export const trainingNeedsAssessmentTask = defineTask('training-needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess training needs',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Training Needs Analyst',
      task: 'Assess compliance training needs by role and topic',
      context: args,
      instructions: ['Identify training requirements by role', 'Assess knowledge gaps', 'Consider regulatory requirements', 'Document training needs matrix'],
      outputFormat: 'JSON with needs object, artifacts'
    },
    outputSchema: { type: 'object', required: ['needs', 'artifacts'], properties: { needs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'training-program']
}));

export const curriculumDesignTask = defineTask('curriculum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design training curriculum',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Curriculum Designer',
      task: 'Design role-based compliance training curriculum',
      context: args,
      instructions: ['Design curriculum structure', 'Map courses to roles', 'Define learning paths', 'Set completion requirements'],
      outputFormat: 'JSON with curriculum object, artifacts'
    },
    outputSchema: { type: 'object', required: ['curriculum', 'artifacts'], properties: { curriculum: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'training-program']
}));

export const courseDevelopmentTask = defineTask('course-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training courses',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Course Developer',
      task: 'Develop compliance training courses',
      context: args,
      instructions: ['Create course content outlines', 'Develop learning objectives', 'Design assessments', 'Create course materials'],
      outputFormat: 'JSON with courses array, artifacts'
    },
    outputSchema: { type: 'object', required: ['courses', 'artifacts'], properties: { courses: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'training-program']
}));

export const certificationFrameworkTask = defineTask('certification-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create certification framework',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Certification Designer',
      task: 'Design training certification framework',
      context: args,
      instructions: ['Define certification requirements', 'Create assessment criteria', 'Design certification tracking', 'Set recertification requirements'],
      outputFormat: 'JSON with framework object, artifacts'
    },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'training-program']
}));

export const trainingTrackingTask = defineTask('training-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design training tracking',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Training Tracker',
      task: 'Design training tracking and metrics plan',
      context: args,
      instructions: ['Define tracking metrics', 'Design completion tracking', 'Create effectiveness measures', 'Document reporting requirements'],
      outputFormat: 'JSON with plan object, artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'training-program']
}));

export const trainingImplementationTask = defineTask('training-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Implementation Planner',
      task: 'Create training program implementation plan',
      context: args,
      instructions: ['Define rollout phases', 'Create communication plan', 'Set implementation timeline', 'Identify resource requirements'],
      outputFormat: 'JSON with plan object, artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'training-program']
}));

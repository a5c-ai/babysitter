/**
 * @process domains/business/knowledge-management/onboarding-knowledge-transfer
 * @description Design and implement onboarding programs that accelerate time-to-competency through structured knowledge transfer activities and resources
 * @specialization Knowledge Management
 * @category Knowledge Sharing and Transfer
 * @inputs { roleContext: object, competencyRequirements: array, existingResources: array, onboardingTimeline: string, outputDir: string }
 * @outputs { success: boolean, onboardingProgram: object, learningPath: array, resources: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    roleContext = {},
    competencyRequirements = [],
    existingResources = [],
    onboardingTimeline = '90 days',
    organizationalContext = {},
    buddyMentorProgram = true,
    outputDir = 'onboarding-kt-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Onboarding Knowledge Transfer Program Process');

  const needsAssessment = await ctx.task(needsAssessmentTask, { roleContext, competencyRequirements, existingResources, outputDir });
  artifacts.push(...needsAssessment.artifacts);

  const learningPathDesign = await ctx.task(learningPathDesignTask, { needsAssessment, competencyRequirements, onboardingTimeline, outputDir });
  artifacts.push(...learningPathDesign.artifacts);

  await ctx.breakpoint({
    question: `Learning path designed with ${learningPathDesign.milestones.length} milestones over ${onboardingTimeline}. Review?`,
    title: 'Learning Path Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { milestones: learningPathDesign.milestones.length } }
  });

  const contentDevelopment = await ctx.task(contentDevelopmentTask, { learningPath: learningPathDesign.path, existingResources, outputDir });
  artifacts.push(...contentDevelopment.artifacts);

  const buddyProgram = await ctx.task(buddyProgramTask, { roleContext, onboardingTimeline, buddyMentorProgram, outputDir });
  artifacts.push(...buddyProgram.artifacts);

  const checkInFramework = await ctx.task(checkInFrameworkTask, { onboardingTimeline, milestones: learningPathDesign.milestones, outputDir });
  artifacts.push(...checkInFramework.artifacts);

  const assessmentDesign = await ctx.task(assessmentDesignTask, { competencyRequirements, milestones: learningPathDesign.milestones, outputDir });
  artifacts.push(...assessmentDesign.artifacts);

  const programCompilation = await ctx.task(programCompilationTask, { learningPath: learningPathDesign.path, content: contentDevelopment.content, buddyProgram: buddyProgram.program, checkInFramework: checkInFramework.framework, assessmentDesign: assessmentDesign.design, outputDir });
  artifacts.push(...programCompilation.artifacts);

  const qualityAssessment = await ctx.task(qualityAssessmentTask, { needsAssessment, learningPathDesign, contentDevelopment, programCompilation, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  let reviewResult = null;
  if (requireApproval) {
    reviewResult = await ctx.task(stakeholderReviewTask, { onboardingProgram: programCompilation.program, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    onboardingProgram: programCompilation.program,
    learningPath: learningPathDesign.path,
    resources: contentDevelopment.content,
    buddyProgram: buddyProgram.program,
    assessmentFramework: assessmentDesign.design,
    statistics: { milestonesCreated: learningPathDesign.milestones.length, resourcesDeveloped: contentDevelopment.content.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/onboarding-knowledge-transfer', timestamp: startTime, outputDir }
  };
}

export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess onboarding needs',
  agent: { name: 'onboarding-analyst', prompt: { role: 'onboarding needs analyst', task: 'Assess knowledge transfer needs for onboarding', context: args, instructions: ['Identify knowledge gaps and requirements', 'Save to output directory'], outputFormat: 'JSON with needs (object), artifacts' }, outputSchema: { type: 'object', required: ['needs', 'artifacts'], properties: { needs: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'onboarding', 'assessment']
}));

export const learningPathDesignTask = defineTask('learning-path-design', (args, taskCtx) => ({
  kind: 'agent', title: 'Design learning path',
  agent: { name: 'learning-designer', prompt: { role: 'learning path designer', task: 'Design structured learning path', context: args, instructions: ['Create progressive learning milestones', 'Save to output directory'], outputFormat: 'JSON with path (array), milestones (array), artifacts' }, outputSchema: { type: 'object', required: ['path', 'milestones', 'artifacts'], properties: { path: { type: 'array' }, milestones: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'onboarding', 'learning']
}));

export const contentDevelopmentTask = defineTask('content-development', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop content',
  agent: { name: 'content-developer', prompt: { role: 'onboarding content developer', task: 'Develop onboarding content', context: args, instructions: ['Create learning resources', 'Save to output directory'], outputFormat: 'JSON with content (array), artifacts' }, outputSchema: { type: 'object', required: ['content', 'artifacts'], properties: { content: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'onboarding', 'content']
}));

export const buddyProgramTask = defineTask('buddy-program', (args, taskCtx) => ({
  kind: 'agent', title: 'Design buddy program',
  agent: { name: 'buddy-designer', prompt: { role: 'buddy program designer', task: 'Design buddy/mentor program', context: args, instructions: ['Create buddy program structure', 'Save to output directory'], outputFormat: 'JSON with program (object), artifacts' }, outputSchema: { type: 'object', required: ['program', 'artifacts'], properties: { program: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'onboarding', 'buddy']
}));

export const checkInFrameworkTask = defineTask('check-in-framework', (args, taskCtx) => ({
  kind: 'agent', title: 'Design check-in framework',
  agent: { name: 'checkin-designer', prompt: { role: 'check-in framework designer', task: 'Design check-in framework', context: args, instructions: ['Create regular check-in structure', 'Save to output directory'], outputFormat: 'JSON with framework (object), artifacts' }, outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'onboarding', 'checkins']
}));

export const assessmentDesignTask = defineTask('assessment-design', (args, taskCtx) => ({
  kind: 'agent', title: 'Design assessments',
  agent: { name: 'assessment-designer', prompt: { role: 'assessment designer', task: 'Design competency assessments', context: args, instructions: ['Create assessment methods', 'Save to output directory'], outputFormat: 'JSON with design (object), artifacts' }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'onboarding', 'assessment']
}));

export const programCompilationTask = defineTask('program-compilation', (args, taskCtx) => ({
  kind: 'agent', title: 'Compile program',
  agent: { name: 'program-compiler', prompt: { role: 'program compiler', task: 'Compile complete onboarding program', context: args, instructions: ['Integrate all components', 'Save to output directory'], outputFormat: 'JSON with program (object), artifacts' }, outputSchema: { type: 'object', required: ['program', 'artifacts'], properties: { program: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'onboarding', 'compilation']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess quality',
  agent: { name: 'quality-assessor', prompt: { role: 'quality assessor', task: 'Assess program quality', context: args, instructions: ['Evaluate quality', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent', title: 'Stakeholder review',
  agent: { name: 'project-manager', prompt: { role: 'project manager', task: 'Coordinate review', context: args, instructions: ['Present for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' }, outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));

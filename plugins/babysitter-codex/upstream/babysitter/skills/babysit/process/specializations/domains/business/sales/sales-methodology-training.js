/**
 * @process sales/sales-methodology-training
 * @description Framework for delivering methodology training (Challenger, SPIN, MEDDIC) with role-plays, certifications, and ongoing reinforcement.
 * @inputs { methodology: string, participants: array, currentSkillLevel: string, trainingObjectives: array, duration?: string }
 * @outputs { success: boolean, trainingProgram: object, curriculum: array, assessments: array, reinforcementPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/sales-methodology-training', {
 *   methodology: 'MEDDIC',
 *   participants: [{ name: 'Rep 1', role: 'AE' }],
 *   currentSkillLevel: 'beginner',
 *   trainingObjectives: ['Improve qualification', 'Increase win rates']
 * });
 *
 * @references
 * - Sales Acceleration Formula: https://www.amazon.com/Sales-Acceleration-Formula-Technology-Inbound/dp/1119047072
 * - RAIN Group Sales Training: https://www.rainsalestraining.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    methodology,
    participants = [],
    currentSkillLevel = 'beginner',
    trainingObjectives = [],
    duration = '2 weeks',
    outputDir = 'methodology-training-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ${methodology} Methodology Training Program`);

  // Phase 1: Needs Assessment
  const needsAssessment = await ctx.task(trainingNeedsAssessmentTask, {
    methodology, participants, currentSkillLevel, trainingObjectives, outputDir
  });
  artifacts.push(...(needsAssessment.artifacts || []));

  // Phase 2: Curriculum Design
  const curriculumDesign = await ctx.task(trainingCurriculumDesignTask, {
    methodology, needsAssessment, duration, outputDir
  });
  artifacts.push(...(curriculumDesign.artifacts || []));

  // Phase 3: Learning Content Development
  const contentDevelopment = await ctx.task(learningContentTask, { methodology, curriculumDesign, outputDir });
  artifacts.push(...(contentDevelopment.artifacts || []));

  // Phase 4: Role-Play Scenarios
  const rolePlayScenarios = await ctx.task(rolePlayScenariosTask, { methodology, curriculumDesign, outputDir });
  artifacts.push(...(rolePlayScenarios.artifacts || []));

  // Phase 5: Assessment Design
  const assessmentDesign = await ctx.task(assessmentDesignTask, { methodology, curriculumDesign, outputDir });
  artifacts.push(...(assessmentDesign.artifacts || []));

  // Phase 6: Certification Program
  const certificationProgram = await ctx.task(certificationProgramTask, { methodology, assessmentDesign, outputDir });
  artifacts.push(...(certificationProgram.artifacts || []));

  // Phase 7: Reinforcement Plan
  const reinforcementPlan = await ctx.task(reinforcementPlanTask, { methodology, curriculumDesign, outputDir });
  artifacts.push(...(reinforcementPlan.artifacts || []));

  // Phase 8: Program Compilation
  const programCompilation = await ctx.task(trainingProgramCompilationTask, {
    methodology, curriculumDesign, contentDevelopment, rolePlayScenarios,
    assessmentDesign, certificationProgram, reinforcementPlan, outputDir
  });
  artifacts.push(...(programCompilation.artifacts || []));

  await ctx.breakpoint({
    question: `${methodology} training program ready for ${participants.length} participants. Review curriculum?`,
    title: 'Methodology Training Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    methodology,
    trainingProgram: programCompilation.program,
    curriculum: curriculumDesign.curriculum,
    assessments: assessmentDesign.assessments,
    reinforcementPlan: reinforcementPlan.plan,
    artifacts,
    metadata: { processId: 'sales/sales-methodology-training', timestamp: startTime }
  };
}

export const trainingNeedsAssessmentTask = defineTask('training-needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Training Needs Assessment',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'Training needs analyst',
      task: 'Assess training needs and gaps',
      context: args,
      instructions: ['Assess current skill levels', 'Identify knowledge gaps', 'Define learning objectives', 'Prioritize training needs']
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'needs-assessment']
}));

export const trainingCurriculumDesignTask = defineTask('training-curriculum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Training Curriculum Design',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'Curriculum designer',
      task: 'Design methodology training curriculum',
      context: args,
      instructions: ['Structure learning modules', 'Sequence topics logically', 'Balance theory and practice', 'Include varied learning formats']
    },
    outputSchema: { type: 'object', required: ['curriculum', 'artifacts'], properties: { curriculum: { type: 'array' }, totalHours: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'curriculum']
}));

export const learningContentTask = defineTask('learning-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Learning Content Development',
  agent: {
    name: 'content-developer',
    prompt: {
      role: 'Learning content developer',
      task: 'Develop training content',
      context: args,
      instructions: ['Create presentation materials', 'Develop workbooks', 'Build reference guides', 'Design exercises']
    },
    outputSchema: { type: 'object', required: ['content', 'artifacts'], properties: { content: { type: 'array' }, materials: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'content']
}));

export const rolePlayScenariosTask = defineTask('role-play-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Role-Play Scenarios',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'Role-play designer',
      task: 'Create role-play scenarios',
      context: args,
      instructions: ['Design realistic scenarios', 'Create buyer personas', 'Develop evaluation rubrics', 'Build coaching guides']
    },
    outputSchema: { type: 'object', required: ['scenarios', 'artifacts'], properties: { scenarios: { type: 'array' }, rubrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'role-play']
}));

export const assessmentDesignTask = defineTask('assessment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assessment Design',
  agent: {
    name: 'assessment-specialist',
    prompt: {
      role: 'Assessment designer',
      task: 'Design training assessments',
      context: args,
      instructions: ['Create knowledge tests', 'Design skill assessments', 'Build practical evaluations', 'Set passing criteria']
    },
    outputSchema: { type: 'object', required: ['assessments', 'artifacts'], properties: { assessments: { type: 'array' }, criteria: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'assessment']
}));

export const certificationProgramTask = defineTask('certification-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Certification Program',
  agent: {
    name: 'certification-specialist',
    prompt: {
      role: 'Certification program designer',
      task: 'Design certification program',
      context: args,
      instructions: ['Define certification levels', 'Create certification requirements', 'Design badge system', 'Build recertification process']
    },
    outputSchema: { type: 'object', required: ['certification', 'artifacts'], properties: { certification: { type: 'object' }, levels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'certification']
}));

export const reinforcementPlanTask = defineTask('reinforcement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reinforcement Plan',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'Learning reinforcement specialist',
      task: 'Design reinforcement and sustainment plan',
      context: args,
      instructions: ['Plan ongoing reinforcement', 'Design coaching integration', 'Create practice opportunities', 'Build measurement framework']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, activities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'reinforcement']
}));

export const trainingProgramCompilationTask = defineTask('training-program-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Training Program Compilation',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'Training program manager',
      task: 'Compile complete training program',
      context: args,
      instructions: ['Compile all components', 'Create facilitator guide', 'Build participant materials', 'Design program schedule']
    },
    outputSchema: { type: 'object', required: ['program', 'artifacts'], properties: { program: { type: 'object' }, schedule: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'training', 'compilation']
}));

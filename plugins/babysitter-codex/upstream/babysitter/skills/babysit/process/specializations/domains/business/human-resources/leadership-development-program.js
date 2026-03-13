/**
 * @process specializations/domains/business/human-resources/leadership-development-program
 * @description Leadership Development Program Process - Design and delivery of structured leadership capability building
 * including assessments, cohort learning, coaching, action learning projects, and progress measurement.
 * @inputs { organizationName: string, targetAudience: string, programDuration: string, cohortSize: number }
 * @outputs { success: boolean, participantsCompleted: number, competencyGrowth: object, businessImpact: object, programROI: number }
 *
 * @references
 * - CCL Leadership Development: https://www.ccl.org/articles/leading-effectively-articles/leadership-development-program/
 * - Harvard Leadership Programs: https://www.exed.hbs.edu/leadership-programs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    targetAudience = 'emerging-leaders',
    programDuration = '6-months',
    cohortSize = 20,
    includeCoaching = true,
    includeActionLearning = true,
    leadershipCompetencies = ['strategic-thinking', 'people-leadership', 'change-management', 'communication'],
    outputDir = 'leadership-development-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Leadership Development Program for ${organizationName}`);

  // Phase 1: Program Design
  const programDesign = await ctx.task(programDesignTask, { organizationName, targetAudience, programDuration, cohortSize, leadershipCompetencies, includeCoaching, includeActionLearning, outputDir });
  artifacts.push(...programDesign.artifacts);

  await ctx.breakpoint({
    question: `Leadership development program designed for ${targetAudience}. ${programDesign.modules.length} modules planned. Review program design?`,
    title: 'Program Design Review',
    context: { runId: ctx.runId, modules: programDesign.modules, competencies: programDesign.competencies, files: programDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
  });

  // Phase 2: Participant Selection
  const participantSelection = await ctx.task(participantSelectionTask, { organizationName, targetAudience, cohortSize, outputDir });
  artifacts.push(...participantSelection.artifacts);

  // Phase 3: Pre-Program Assessment
  const preAssessment = await ctx.task(preAssessmentTask, { organizationName, participants: participantSelection.participants, leadershipCompetencies, outputDir });
  artifacts.push(...preAssessment.artifacts);

  // Phase 4: Curriculum Development
  const curriculumDevelopment = await ctx.task(curriculumDevelopmentTask, { organizationName, programDesign, preAssessment, outputDir });
  artifacts.push(...curriculumDevelopment.artifacts);

  // Phase 5: Coaching Setup
  let coachingSetup = null;
  if (includeCoaching) {
    coachingSetup = await ctx.task(coachingSetupTask, { organizationName, participants: participantSelection.participants, programDuration, outputDir });
    artifacts.push(...coachingSetup.artifacts);
  }

  // Phase 6: Action Learning Projects
  let actionLearning = null;
  if (includeActionLearning) {
    actionLearning = await ctx.task(actionLearningTask, { organizationName, participants: participantSelection.participants, outputDir });
    artifacts.push(...actionLearning.artifacts);
  }

  // Phase 7: Program Delivery
  const programDelivery = await ctx.task(programDeliveryTask, { organizationName, curriculumDevelopment, participants: participantSelection.participants, coachingSetup, actionLearning, outputDir });
  artifacts.push(...programDelivery.artifacts);

  await ctx.breakpoint({
    question: `Program delivery in progress. ${programDelivery.modulesCompleted} modules completed. Review progress?`,
    title: 'Program Delivery Progress',
    context: { runId: ctx.runId, modulesCompleted: programDelivery.modulesCompleted, participationRate: programDelivery.participationRate, files: programDelivery.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
  });

  // Phase 8: Mid-Program Review
  const midProgramReview = await ctx.task(midProgramReviewTask, { organizationName, programDelivery, participants: participantSelection.participants, outputDir });
  artifacts.push(...midProgramReview.artifacts);

  // Phase 9: Post-Program Assessment
  const postAssessment = await ctx.task(postAssessmentTask, { organizationName, participants: participantSelection.participants, leadershipCompetencies, preAssessment, outputDir });
  artifacts.push(...postAssessment.artifacts);

  // Phase 10: Graduation and Transition
  const graduation = await ctx.task(graduationTask, { organizationName, participants: participantSelection.participants, postAssessment, actionLearning, outputDir });
  artifacts.push(...graduation.artifacts);

  // Phase 11: Impact Measurement
  const impactMeasurement = await ctx.task(impactMeasurementTask, { organizationName, preAssessment, postAssessment, actionLearning, graduation, outputDir });
  artifacts.push(...impactMeasurement.artifacts);

  // Phase 12: Program Evaluation
  const programEvaluation = await ctx.task(programEvaluationTask, { organizationName, programDelivery, impactMeasurement, outputDir });
  artifacts.push(...programEvaluation.artifacts);

  return {
    success: true,
    organizationName,
    targetAudience,
    participantsCompleted: graduation.graduatesCount,
    competencyGrowth: impactMeasurement.competencyGrowth,
    businessImpact: impactMeasurement.businessImpact,
    programROI: impactMeasurement.roi,
    satisfaction: programEvaluation.satisfaction,
    artifacts,
    metadata: { processId: 'specializations/domains/business/human-resources/leadership-development-program', timestamp: startTime, outputDir }
  };
}

export const programDesignTask = defineTask('program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Program Design - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Leadership Development Specialist', task: 'Design leadership development program', context: args, instructions: ['1. Define program objectives', '2. Design curriculum structure', '3. Define learning modules', '4. Plan experiential learning', '5. Design assessment approach', '6. Plan coaching integration', '7. Design action learning', '8. Create program timeline', '9. Define success metrics', '10. Document program design'], outputFormat: 'JSON object with program design' }, outputSchema: { type: 'object', required: ['modules', 'competencies', 'artifacts'], properties: { modules: { type: 'array', items: { type: 'object' } }, competencies: { type: 'array', items: { type: 'object' } }, timeline: { type: 'object' }, assessmentApproach: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'design']
}));

export const participantSelectionTask = defineTask('participant-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Participant Selection - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Talent Management Specialist', task: 'Select program participants', context: args, instructions: ['1. Define selection criteria', '2. Identify candidate pool', '3. Review nominations', '4. Assess readiness', '5. Conduct interviews', '6. Make selections', '7. Notify participants', '8. Handle alternates', '9. Communicate with managers', '10. Document selections'], outputFormat: 'JSON object with participant selection' }, outputSchema: { type: 'object', required: ['participants', 'artifacts'], properties: { participants: { type: 'array', items: { type: 'object' } }, selectionCriteria: { type: 'object' }, alternates: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'selection']
}));

export const preAssessmentTask = defineTask('pre-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Pre-Assessment - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Assessment Specialist', task: 'Conduct pre-program assessments', context: args, instructions: ['1. Administer leadership assessments', '2. Conduct 360 feedback', '3. Complete personality assessments', '4. Gather manager input', '5. Self-assessment', '6. Create baseline profiles', '7. Identify development priorities', '8. Generate individual reports', '9. Aggregate cohort data', '10. Document assessments'], outputFormat: 'JSON object with pre-assessment results' }, outputSchema: { type: 'object', required: ['assessmentResults', 'baselineScores', 'artifacts'], properties: { assessmentResults: { type: 'array', items: { type: 'object' } }, baselineScores: { type: 'object' }, developmentPriorities: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'assessment']
}));

export const curriculumDevelopmentTask = defineTask('curriculum-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Curriculum Development - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Learning Designer', task: 'Develop program curriculum', context: args, instructions: ['1. Design module content', '2. Create learning materials', '3. Develop case studies', '4. Plan simulations', '5. Create assessments', '6. Design group activities', '7. Develop facilitator guides', '8. Create participant workbooks', '9. Design virtual sessions', '10. Document curriculum'], outputFormat: 'JSON object with curriculum' }, outputSchema: { type: 'object', required: ['curriculum', 'materials', 'artifacts'], properties: { curriculum: { type: 'object' }, materials: { type: 'array', items: { type: 'object' } }, caseStudies: { type: 'array', items: { type: 'object' } }, facilitatorGuides: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'curriculum']
}));

export const coachingSetupTask = defineTask('coaching-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Coaching Setup - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Executive Coaching Coordinator', task: 'Set up coaching program', context: args, instructions: ['1. Select coaches', '2. Match coaches to participants', '3. Define coaching objectives', '4. Schedule sessions', '5. Create coaching agreements', '6. Train on program context', '7. Establish check-ins', '8. Create progress tracking', '9. Plan coach supervision', '10. Document coaching setup'], outputFormat: 'JSON object with coaching setup' }, outputSchema: { type: 'object', required: ['coachingPlan', 'coachMatches', 'artifacts'], properties: { coachingPlan: { type: 'object' }, coachMatches: { type: 'array', items: { type: 'object' } }, sessionSchedule: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'coaching']
}));

export const actionLearningTask = defineTask('action-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Action Learning Projects - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Action Learning Facilitator', task: 'Design action learning projects', context: args, instructions: ['1. Identify business challenges', '2. Define project scope', '3. Form project teams', '4. Assign executive sponsors', '5. Create project charters', '6. Plan deliverables', '7. Schedule checkpoints', '8. Plan presentations', '9. Define success criteria', '10. Document projects'], outputFormat: 'JSON object with action learning projects' }, outputSchema: { type: 'object', required: ['projects', 'teams', 'artifacts'], properties: { projects: { type: 'array', items: { type: 'object' } }, teams: { type: 'array', items: { type: 'object' } }, sponsors: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'action-learning']
}));

export const programDeliveryTask = defineTask('program-delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Program Delivery - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Program Manager', task: 'Manage program delivery', context: args, instructions: ['1. Deliver learning modules', '2. Facilitate sessions', '3. Track attendance', '4. Monitor engagement', '5. Support coaching', '6. Guide action learning', '7. Collect feedback', '8. Address issues', '9. Track progress', '10. Document delivery'], outputFormat: 'JSON object with delivery status' }, outputSchema: { type: 'object', required: ['modulesCompleted', 'participationRate', 'artifacts'], properties: { modulesCompleted: { type: 'number' }, participationRate: { type: 'number' }, engagementMetrics: { type: 'object' }, feedback: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'delivery']
}));

export const midProgramReviewTask = defineTask('mid-program-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Mid-Program Review - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Program Evaluator', task: 'Conduct mid-program review', context: args, instructions: ['1. Gather participant feedback', '2. Assess progress', '3. Review coaching engagement', '4. Check action learning progress', '5. Identify adjustments', '6. Address concerns', '7. Recognize achievements', '8. Update stakeholders', '9. Make improvements', '10. Document review'], outputFormat: 'JSON object with mid-program review' }, outputSchema: { type: 'object', required: ['progressSummary', 'adjustments', 'artifacts'], properties: { progressSummary: { type: 'object' }, participantFeedback: { type: 'object' }, adjustments: { type: 'array', items: { type: 'string' } }, concerns: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'mid-review']
}));

export const postAssessmentTask = defineTask('post-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Post-Assessment - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Assessment Specialist', task: 'Conduct post-program assessments', context: args, instructions: ['1. Re-administer assessments', '2. Conduct post-360 feedback', '3. Compare to baseline', '4. Calculate growth', '5. Gather manager feedback', '6. Assess behavior change', '7. Document results', '8. Create individual reports', '9. Aggregate cohort data', '10. Identify success stories'], outputFormat: 'JSON object with post-assessment results' }, outputSchema: { type: 'object', required: ['postScores', 'growthMetrics', 'artifacts'], properties: { postScores: { type: 'object' }, growthMetrics: { type: 'object' }, behaviorChange: { type: 'object' }, successStories: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'post-assessment']
}));

export const graduationTask = defineTask('graduation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Graduation - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Program Coordinator', task: 'Manage graduation and transition', context: args, instructions: ['1. Verify completion', '2. Plan graduation event', '3. Present action learning', '4. Award certificates', '5. Celebrate achievements', '6. Create alumni network', '7. Plan follow-up', '8. Transition to managers', '9. Create development plans', '10. Document graduation'], outputFormat: 'JSON object with graduation results' }, outputSchema: { type: 'object', required: ['graduatesCount', 'artifacts'], properties: { graduatesCount: { type: 'number' }, graduationEvent: { type: 'object' }, actionLearningPresentations: { type: 'array', items: { type: 'object' } }, developmentPlans: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'graduation']
}));

export const impactMeasurementTask = defineTask('impact-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Impact Measurement - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Impact Analyst', task: 'Measure program impact', context: args, instructions: ['1. Calculate competency growth', '2. Assess behavior change', '3. Measure business impact', '4. Calculate ROI', '5. Track promotions', '6. Assess action learning impact', '7. Gather stakeholder feedback', '8. Compare to objectives', '9. Document success stories', '10. Create impact report'], outputFormat: 'JSON object with impact measurement' }, outputSchema: { type: 'object', required: ['competencyGrowth', 'businessImpact', 'roi', 'artifacts'], properties: { competencyGrowth: { type: 'object' }, businessImpact: { type: 'object' }, roi: { type: 'number' }, promotions: { type: 'number' }, successStories: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'impact']
}));

export const programEvaluationTask = defineTask('program-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Program Evaluation - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Program Evaluator', task: 'Evaluate overall program', context: args, instructions: ['1. Analyze participant satisfaction', '2. Evaluate content effectiveness', '3. Assess facilitator quality', '4. Review coaching effectiveness', '5. Evaluate logistics', '6. Identify improvements', '7. Benchmark against industry', '8. Create recommendations', '9. Plan next cohort', '10. Document evaluation'], outputFormat: 'JSON object with program evaluation' }, outputSchema: { type: 'object', required: ['satisfaction', 'effectiveness', 'recommendations', 'artifacts'], properties: { satisfaction: { type: 'number' }, effectiveness: { type: 'object' }, improvements: { type: 'array', items: { type: 'string' } }, recommendations: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['hr', 'leadership-development', 'evaluation']
}));

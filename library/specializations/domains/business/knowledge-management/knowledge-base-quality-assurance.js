/**
 * @process domains/business/knowledge-management/knowledge-base-quality-assurance
 * @description Establish content review cycles, accuracy verification, currency checks, and quality standards for knowledge base content
 * @specialization Knowledge Management
 * @category Knowledge Base Development
 * @inputs { knowledgeBase: object, qualityStandards: object, reviewScope: object, outputDir: string }
 * @outputs { success: boolean, qualityFramework: object, reviewResults: array, improvementPlan: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeBase = {},
    qualityStandards = {},
    reviewScope = {},
    contentInventory = [],
    reviewFrequency = 'quarterly',
    outputDir = 'kb-qa-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Base Quality Assurance Process');

  // Phase 1: Quality Standards Definition
  ctx.log('info', 'Phase 1: Defining quality standards');
  const standardsDefinition = await ctx.task(standardsDefinitionTask, { qualityStandards, knowledgeBase, outputDir });
  artifacts.push(...standardsDefinition.artifacts);

  await ctx.breakpoint({
    question: `Quality standards defined with ${standardsDefinition.criteria.length} criteria. Review?`,
    title: 'Quality Standards Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { criteria: standardsDefinition.criteria.length } }
  });

  // Phase 2: Review Schedule Planning
  ctx.log('info', 'Phase 2: Planning review schedule');
  const reviewSchedule = await ctx.task(reviewSchedulePlanningTask, { contentInventory, reviewFrequency, reviewScope, outputDir });
  artifacts.push(...reviewSchedule.artifacts);

  // Phase 3: Content Accuracy Assessment
  ctx.log('info', 'Phase 3: Assessing content accuracy');
  const accuracyAssessment = await ctx.task(accuracyAssessmentTask, { contentInventory, standardsDefinition: standardsDefinition.standards, outputDir });
  artifacts.push(...accuracyAssessment.artifacts);

  // Phase 4: Currency Check
  ctx.log('info', 'Phase 4: Checking content currency');
  const currencyCheck = await ctx.task(currencyCheckTask, { contentInventory, outputDir });
  artifacts.push(...currencyCheck.artifacts);

  // Phase 5: Completeness Review
  ctx.log('info', 'Phase 5: Reviewing content completeness');
  const completenessReview = await ctx.task(completenessReviewTask, { contentInventory, standardsDefinition: standardsDefinition.standards, outputDir });
  artifacts.push(...completenessReview.artifacts);

  // Phase 6: Usability Assessment
  ctx.log('info', 'Phase 6: Assessing usability');
  const usabilityAssessment = await ctx.task(usabilityAssessmentTask, { knowledgeBase, outputDir });
  artifacts.push(...usabilityAssessment.artifacts);

  // Phase 7: Quality Scoring
  ctx.log('info', 'Phase 7: Scoring content quality');
  const qualityScoring = await ctx.task(qualityScoringTask, { accuracyAssessment, currencyCheck, completenessReview, usabilityAssessment, outputDir });
  artifacts.push(...qualityScoring.artifacts);

  // Phase 8: Improvement Plan Development
  ctx.log('info', 'Phase 8: Developing improvement plan');
  const improvementPlan = await ctx.task(improvementPlanTask, { qualityScoring, standardsDefinition: standardsDefinition.standards, outputDir });
  artifacts.push(...improvementPlan.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Final quality assessment');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { standardsDefinition, qualityScoring, improvementPlan, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { qualityFramework: standardsDefinition.standards, reviewResults: qualityScoring.results, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    qualityFramework: standardsDefinition.standards,
    reviewSchedule: reviewSchedule.schedule,
    reviewResults: qualityScoring.results,
    improvementPlan: improvementPlan.plan,
    statistics: { articlesReviewed: qualityScoring.articlesReviewed, issuesFound: qualityScoring.issuesCount },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/knowledge-base-quality-assurance', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const standardsDefinitionTask = defineTask('standards-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define quality standards',
  agent: {
    name: 'standards-developer',
    prompt: { role: 'quality standards developer', task: 'Define knowledge base quality standards', context: args, instructions: ['Define accuracy, currency, completeness criteria', 'Set quality thresholds', 'Save to output directory'], outputFormat: 'JSON with standards (object), criteria (array), artifacts' },
    outputSchema: { type: 'object', required: ['standards', 'criteria', 'artifacts'], properties: { standards: { type: 'object' }, criteria: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'standards']
}));

export const reviewSchedulePlanningTask = defineTask('review-schedule-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan review schedule',
  agent: {
    name: 'schedule-planner',
    prompt: { role: 'review schedule planner', task: 'Plan content review schedule', context: args, instructions: ['Create review calendar', 'Assign review responsibilities', 'Save to output directory'], outputFormat: 'JSON with schedule (object), artifacts' },
    outputSchema: { type: 'object', required: ['schedule', 'artifacts'], properties: { schedule: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'review', 'schedule']
}));

export const accuracyAssessmentTask = defineTask('accuracy-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess content accuracy',
  agent: {
    name: 'accuracy-assessor',
    prompt: { role: 'content accuracy assessor', task: 'Assess content accuracy', context: args, instructions: ['Verify factual accuracy', 'Check for outdated information', 'Save to output directory'], outputFormat: 'JSON with assessment (object), issues (array), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'accuracy', 'assessment']
}));

export const currencyCheckTask = defineTask('currency-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check content currency',
  agent: {
    name: 'currency-checker',
    prompt: { role: 'content currency specialist', task: 'Check content currency', context: args, instructions: ['Review last update dates', 'Identify stale content', 'Save to output directory'], outputFormat: 'JSON with check (object), staleContent (array), artifacts' },
    outputSchema: { type: 'object', required: ['check', 'artifacts'], properties: { check: { type: 'object' }, staleContent: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'currency', 'check']
}));

export const completenessReviewTask = defineTask('completeness-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review content completeness',
  agent: {
    name: 'completeness-reviewer',
    prompt: { role: 'content completeness reviewer', task: 'Review content completeness', context: args, instructions: ['Check for missing sections', 'Identify gaps', 'Save to output directory'], outputFormat: 'JSON with review (object), gaps (array), artifacts' },
    outputSchema: { type: 'object', required: ['review', 'artifacts'], properties: { review: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'completeness', 'review']
}));

export const usabilityAssessmentTask = defineTask('usability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess usability',
  agent: {
    name: 'usability-assessor',
    prompt: { role: 'usability specialist', task: 'Assess knowledge base usability', context: args, instructions: ['Evaluate navigation', 'Check readability', 'Save to output directory'], outputFormat: 'JSON with assessment (object), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'usability', 'assessment']
}));

export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score content quality',
  agent: {
    name: 'quality-scorer',
    prompt: { role: 'quality scoring specialist', task: 'Score overall content quality', context: args, instructions: ['Calculate aggregate scores', 'Identify priority fixes', 'Save to output directory'], outputFormat: 'JSON with results (array), articlesReviewed (number), issuesCount (number), artifacts' },
    outputSchema: { type: 'object', required: ['results', 'articlesReviewed', 'issuesCount', 'artifacts'], properties: { results: { type: 'array' }, articlesReviewed: { type: 'number' }, issuesCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'scoring']
}));

export const improvementPlanTask = defineTask('improvement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop improvement plan',
  agent: {
    name: 'improvement-planner',
    prompt: { role: 'improvement planner', task: 'Develop quality improvement plan', context: args, instructions: ['Prioritize improvements', 'Create action items', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'improvement', 'plan']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final quality assessment',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Final QA process quality assessment', context: args, instructions: ['Evaluate QA completeness', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
    outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present findings for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));

/**
 * @process domains/business/knowledge-management/double-loop-learning
 * @description Facilitate double-loop learning processes that question underlying assumptions and drive transformational organizational change
 * @specialization Knowledge Management
 * @category Organizational Learning Processes
 * @inputs { learningContext: object, currentAssumptions: array, triggeringEvent: object, outputDir: string }
 * @outputs { success: boolean, learningOutcomes: object, assumptionChanges: array, actionChanges: array, governingVariables: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    learningContext = {},
    currentAssumptions = [],
    triggeringEvent = {},
    participantGroup = [],
    facilitationApproach = 'action-science',
    outputDir = 'double-loop-learning-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Double-Loop Learning Implementation Process');

  // Phase 1: Learning Context Assessment
  ctx.log('info', 'Phase 1: Assessing learning context');
  const contextAssessment = await ctx.task(contextAssessmentTask, { learningContext, triggeringEvent, outputDir });
  artifacts.push(...contextAssessment.artifacts);

  await ctx.breakpoint({
    question: `Learning context assessed. Trigger type: ${contextAssessment.triggerType}. Proceed with assumption examination?`,
    title: 'Context Assessment Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { triggerType: contextAssessment.triggerType } }
  });

  // Phase 2: Current Actions Analysis
  ctx.log('info', 'Phase 2: Analyzing current actions and outcomes');
  const actionsAnalysis = await ctx.task(actionsAnalysisTask, { learningContext, triggeringEvent, outputDir });
  artifacts.push(...actionsAnalysis.artifacts);

  // Phase 3: Governing Variables Identification
  ctx.log('info', 'Phase 3: Identifying governing variables');
  const governingVariables = await ctx.task(governingVariablesTask, { actionsAnalysis, currentAssumptions, outputDir });
  artifacts.push(...governingVariables.artifacts);

  // Phase 4: Assumption Surfacing
  ctx.log('info', 'Phase 4: Surfacing underlying assumptions');
  const assumptionSurfacing = await ctx.task(assumptionSurfacingTask, { governingVariables, currentAssumptions, outputDir });
  artifacts.push(...assumptionSurfacing.artifacts);

  // Phase 5: Assumption Testing
  ctx.log('info', 'Phase 5: Testing assumptions validity');
  const assumptionTesting = await ctx.task(assumptionTestingTask, { assumptionSurfacing: assumptionSurfacing.assumptions, learningContext, outputDir });
  artifacts.push(...assumptionTesting.artifacts);

  // Phase 6: Mental Model Reframing
  ctx.log('info', 'Phase 6: Reframing mental models');
  const mentalModelReframing = await ctx.task(mentalModelReframingTask, { assumptionTesting, governingVariables: governingVariables.variables, outputDir });
  artifacts.push(...mentalModelReframing.artifacts);

  // Phase 7: New Action Strategy Development
  ctx.log('info', 'Phase 7: Developing new action strategies');
  const newActionStrategy = await ctx.task(newActionStrategyTask, { mentalModelReframing, learningContext, outputDir });
  artifacts.push(...newActionStrategy.artifacts);

  // Phase 8: Implementation Planning
  ctx.log('info', 'Phase 8: Planning implementation');
  const implementationPlanning = await ctx.task(implementationPlanningTask, { newActionStrategy: newActionStrategy.strategy, participantGroup, outputDir });
  artifacts.push(...implementationPlanning.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing learning quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { contextAssessment, assumptionTesting, mentalModelReframing, newActionStrategy, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { learningOutcomes: mentalModelReframing.outcomes, newActions: newActionStrategy.strategy, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    learningOutcomes: mentalModelReframing.outcomes,
    assumptionChanges: assumptionTesting.validatedAssumptions,
    governingVariables: governingVariables.variables,
    mentalModelShifts: mentalModelReframing.shifts,
    actionChanges: newActionStrategy.strategy,
    implementationPlan: implementationPlanning.plan,
    statistics: { assumptionsExamined: assumptionSurfacing.assumptions.length, shiftsIdentified: mentalModelReframing.shifts.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/double-loop-learning', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const contextAssessmentTask = defineTask('context-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess learning context',
  agent: {
    name: 'context-assessor',
    prompt: { role: 'organizational learning specialist', task: 'Assess double-loop learning context', context: args, instructions: ['Analyze triggering event', 'Identify learning opportunity', 'Save to output directory'], outputFormat: 'JSON with assessment (object), triggerType (string), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'triggerType', 'artifacts'], properties: { assessment: { type: 'object' }, triggerType: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'context', 'assessment']
}));

export const actionsAnalysisTask = defineTask('actions-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current actions',
  agent: {
    name: 'actions-analyst',
    prompt: { role: 'action analyst', task: 'Analyze current actions and their outcomes', context: args, instructions: ['Map action-consequence patterns', 'Identify mismatches', 'Save to output directory'], outputFormat: 'JSON with analysis (object), patterns (array), artifacts' },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'actions', 'analysis']
}));

export const governingVariablesTask = defineTask('governing-variables', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify governing variables',
  agent: {
    name: 'variables-identifier',
    prompt: { role: 'governing variables specialist', task: 'Identify governing variables driving behavior', context: args, instructions: ['Uncover implicit goals and values', 'Map to behaviors', 'Save to output directory'], outputFormat: 'JSON with variables (array), mapping (object), artifacts' },
    outputSchema: { type: 'object', required: ['variables', 'artifacts'], properties: { variables: { type: 'array' }, mapping: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'governing-variables', 'identification']
}));

export const assumptionSurfacingTask = defineTask('assumption-surfacing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Surface underlying assumptions',
  agent: {
    name: 'assumption-surfacer',
    prompt: { role: 'assumption surfacing facilitator', task: 'Surface and articulate underlying assumptions', context: args, instructions: ['Make implicit assumptions explicit', 'Document belief systems', 'Save to output directory'], outputFormat: 'JSON with assumptions (array), artifacts' },
    outputSchema: { type: 'object', required: ['assumptions', 'artifacts'], properties: { assumptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'assumption', 'surfacing']
}));

export const assumptionTestingTask = defineTask('assumption-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test assumptions validity',
  agent: {
    name: 'assumption-tester',
    prompt: { role: 'assumption testing specialist', task: 'Test validity of surfaced assumptions', context: args, instructions: ['Challenge assumptions with evidence', 'Identify invalid assumptions', 'Save to output directory'], outputFormat: 'JSON with validatedAssumptions (array), invalidAssumptions (array), artifacts' },
    outputSchema: { type: 'object', required: ['validatedAssumptions', 'invalidAssumptions', 'artifacts'], properties: { validatedAssumptions: { type: 'array' }, invalidAssumptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'assumption', 'testing']
}));

export const mentalModelReframingTask = defineTask('mental-model-reframing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reframe mental models',
  agent: {
    name: 'reframing-facilitator',
    prompt: { role: 'mental model reframing facilitator', task: 'Facilitate mental model reframing', context: args, instructions: ['Develop new mental models', 'Document paradigm shifts', 'Save to output directory'], outputFormat: 'JSON with outcomes (object), shifts (array), newModels (array), artifacts' },
    outputSchema: { type: 'object', required: ['outcomes', 'shifts', 'artifacts'], properties: { outcomes: { type: 'object' }, shifts: { type: 'array' }, newModels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mental-model', 'reframing']
}));

export const newActionStrategyTask = defineTask('new-action-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop new action strategies',
  agent: {
    name: 'action-strategist',
    prompt: { role: 'action strategy developer', task: 'Develop new action strategies from reframed models', context: args, instructions: ['Design aligned actions', 'Create implementation approach', 'Save to output directory'], outputFormat: 'JSON with strategy (object), actions (array), artifacts' },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, actions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'action', 'strategy']
}));

export const implementationPlanningTask = defineTask('implementation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan implementation',
  agent: {
    name: 'implementation-planner',
    prompt: { role: 'implementation planner', task: 'Plan change implementation', context: args, instructions: ['Create rollout plan', 'Define success metrics', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'implementation', 'planning']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess learning quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess double-loop learning quality', context: args, instructions: ['Evaluate depth of learning', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present learning outcomes for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));

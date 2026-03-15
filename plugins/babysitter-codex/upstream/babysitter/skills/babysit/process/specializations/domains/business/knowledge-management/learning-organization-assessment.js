/**
 * @process domains/business/knowledge-management/learning-organization-assessment
 * @description Assess organizational learning capabilities using frameworks like Senge's five disciplines and develop improvement plans
 * @specialization Knowledge Management
 * @category Organizational Learning Processes
 * @inputs { organizationalScope: object, assessmentFramework: string, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, assessment: object, maturityLevel: number, gaps: array, improvementPlan: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationalScope = {},
    assessmentFramework = 'senge-five-disciplines',
    stakeholders = [],
    currentState = {},
    benchmarks = {},
    outputDir = 'learning-org-assessment-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Learning Organization Assessment Process');

  // Phase 1: Assessment Framework Setup
  ctx.log('info', 'Phase 1: Setting up assessment framework');
  const frameworkSetup = await ctx.task(frameworkSetupTask, { assessmentFramework, organizationalScope, outputDir });
  artifacts.push(...frameworkSetup.artifacts);

  await ctx.breakpoint({
    question: `Assessment framework "${assessmentFramework}" configured with ${frameworkSetup.dimensions.length} dimensions. Proceed?`,
    title: 'Framework Setup Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { dimensions: frameworkSetup.dimensions.length } }
  });

  // Phase 2: Personal Mastery Assessment
  ctx.log('info', 'Phase 2: Assessing personal mastery');
  const personalMastery = await ctx.task(personalMasteryTask, { organizationalScope, outputDir });
  artifacts.push(...personalMastery.artifacts);

  // Phase 3: Mental Models Assessment
  ctx.log('info', 'Phase 3: Assessing mental models');
  const mentalModels = await ctx.task(mentalModelsTask, { organizationalScope, outputDir });
  artifacts.push(...mentalModels.artifacts);

  // Phase 4: Shared Vision Assessment
  ctx.log('info', 'Phase 4: Assessing shared vision');
  const sharedVision = await ctx.task(sharedVisionTask, { organizationalScope, outputDir });
  artifacts.push(...sharedVision.artifacts);

  // Phase 5: Team Learning Assessment
  ctx.log('info', 'Phase 5: Assessing team learning');
  const teamLearning = await ctx.task(teamLearningTask, { organizationalScope, outputDir });
  artifacts.push(...teamLearning.artifacts);

  // Phase 6: Systems Thinking Assessment
  ctx.log('info', 'Phase 6: Assessing systems thinking');
  const systemsThinking = await ctx.task(systemsThinkingTask, { organizationalScope, outputDir });
  artifacts.push(...systemsThinking.artifacts);

  // Phase 7: Maturity Level Determination
  ctx.log('info', 'Phase 7: Determining maturity level');
  const maturityDetermination = await ctx.task(maturityDeterminationTask, { personalMastery, mentalModels, sharedVision, teamLearning, systemsThinking, benchmarks, outputDir });
  artifacts.push(...maturityDetermination.artifacts);

  // Phase 8: Improvement Plan Development
  ctx.log('info', 'Phase 8: Developing improvement plan');
  const improvementPlan = await ctx.task(improvementPlanTask, { maturityDetermination, organizationalScope, outputDir });
  artifacts.push(...improvementPlan.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing assessment quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { frameworkSetup, maturityDetermination, improvementPlan, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { assessment: maturityDetermination.assessment, improvementPlan: improvementPlan.plan, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    assessment: maturityDetermination.assessment,
    disciplineScores: {
      personalMastery: personalMastery.score,
      mentalModels: mentalModels.score,
      sharedVision: sharedVision.score,
      teamLearning: teamLearning.score,
      systemsThinking: systemsThinking.score
    },
    maturityLevel: maturityDetermination.maturityLevel,
    gaps: maturityDetermination.gaps,
    improvementPlan: improvementPlan.plan,
    statistics: { dimensionsAssessed: frameworkSetup.dimensions.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/learning-organization-assessment', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const frameworkSetupTask = defineTask('framework-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up assessment framework',
  agent: {
    name: 'framework-specialist',
    prompt: { role: 'learning organization specialist', task: 'Configure assessment framework', context: args, instructions: ['Define assessment dimensions', 'Create evaluation criteria', 'Save to output directory'], outputFormat: 'JSON with framework (object), dimensions (array), artifacts' },
    outputSchema: { type: 'object', required: ['framework', 'dimensions', 'artifacts'], properties: { framework: { type: 'object' }, dimensions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'framework', 'setup']
}));

export const personalMasteryTask = defineTask('personal-mastery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess personal mastery',
  agent: {
    name: 'mastery-assessor',
    prompt: { role: 'personal mastery assessor', task: 'Assess personal mastery discipline', context: args, instructions: ['Evaluate individual learning commitment', 'Assess personal vision clarity', 'Save to output directory'], outputFormat: 'JSON with assessment (object), score (number 0-5), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'score', 'artifacts'], properties: { assessment: { type: 'object' }, score: { type: 'number', minimum: 0, maximum: 5 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'personal-mastery', 'assessment']
}));

export const mentalModelsTask = defineTask('mental-models', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess mental models',
  agent: {
    name: 'mental-models-assessor',
    prompt: { role: 'mental models assessor', task: 'Assess mental models discipline', context: args, instructions: ['Evaluate assumption surfacing practices', 'Assess inquiry and advocacy balance', 'Save to output directory'], outputFormat: 'JSON with assessment (object), score (number 0-5), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'score', 'artifacts'], properties: { assessment: { type: 'object' }, score: { type: 'number', minimum: 0, maximum: 5 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'mental-models', 'assessment']
}));

export const sharedVisionTask = defineTask('shared-vision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess shared vision',
  agent: {
    name: 'vision-assessor',
    prompt: { role: 'shared vision assessor', task: 'Assess shared vision discipline', context: args, instructions: ['Evaluate vision alignment', 'Assess commitment levels', 'Save to output directory'], outputFormat: 'JSON with assessment (object), score (number 0-5), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'score', 'artifacts'], properties: { assessment: { type: 'object' }, score: { type: 'number', minimum: 0, maximum: 5 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'shared-vision', 'assessment']
}));

export const teamLearningTask = defineTask('team-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess team learning',
  agent: {
    name: 'team-learning-assessor',
    prompt: { role: 'team learning assessor', task: 'Assess team learning discipline', context: args, instructions: ['Evaluate dialogue practices', 'Assess collective intelligence', 'Save to output directory'], outputFormat: 'JSON with assessment (object), score (number 0-5), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'score', 'artifacts'], properties: { assessment: { type: 'object' }, score: { type: 'number', minimum: 0, maximum: 5 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'team-learning', 'assessment']
}));

export const systemsThinkingTask = defineTask('systems-thinking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess systems thinking',
  agent: {
    name: 'systems-thinking-assessor',
    prompt: { role: 'systems thinking assessor', task: 'Assess systems thinking discipline', context: args, instructions: ['Evaluate holistic thinking', 'Assess feedback loop understanding', 'Save to output directory'], outputFormat: 'JSON with assessment (object), score (number 0-5), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'score', 'artifacts'], properties: { assessment: { type: 'object' }, score: { type: 'number', minimum: 0, maximum: 5 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'systems-thinking', 'assessment']
}));

export const maturityDeterminationTask = defineTask('maturity-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine maturity level',
  agent: {
    name: 'maturity-analyst',
    prompt: { role: 'maturity analyst', task: 'Determine overall maturity level', context: args, instructions: ['Calculate aggregate maturity', 'Identify gaps', 'Save to output directory'], outputFormat: 'JSON with assessment (object), maturityLevel (number 1-5), gaps (array), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'maturityLevel', 'gaps', 'artifacts'], properties: { assessment: { type: 'object' }, maturityLevel: { type: 'number', minimum: 1, maximum: 5 }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'maturity', 'determination']
}));

export const improvementPlanTask = defineTask('improvement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop improvement plan',
  agent: {
    name: 'improvement-planner',
    prompt: { role: 'improvement planner', task: 'Develop learning organization improvement plan', context: args, instructions: ['Create actionable initiatives', 'Prioritize by impact', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'improvement', 'plan']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess assessment quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess assessment quality', context: args, instructions: ['Evaluate rigor and completeness', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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

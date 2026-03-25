/**
 * @process domains/business/knowledge-management/cross-functional-knowledge-exchange
 * @description Enable knowledge sharing across organizational boundaries through rotation programs, cross-functional teams, and structured exchange mechanisms
 * @specialization Knowledge Management
 * @category Knowledge Sharing and Transfer
 * @inputs { exchangeScope: object, participatingFunctions: array, knowledgeDomains: array, exchangeMechanisms: array, outputDir: string }
 * @outputs { success: boolean, exchangeProgram: object, exchangeActivities: array, measurementFramework: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    exchangeScope = {},
    participatingFunctions = [],
    knowledgeDomains = [],
    exchangeMechanisms = ['rotations', 'cross-functional-teams', 'knowledge-networks', 'exchange-sessions'],
    organizationalContext = {},
    duration = '12 months',
    outputDir = 'cross-functional-exchange-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Cross-Functional Knowledge Exchange Process');

  // Phase 1: Exchange Needs Assessment
  ctx.log('info', 'Phase 1: Assessing cross-functional exchange needs');
  const needsAssessment = await ctx.task(needsAssessmentTask, { exchangeScope, participatingFunctions, knowledgeDomains, organizationalContext, outputDir });
  artifacts.push(...needsAssessment.artifacts);

  await ctx.breakpoint({
    question: `Identified ${needsAssessment.exchangeOpportunities.length} exchange opportunities across ${participatingFunctions.length} functions. Review?`,
    title: 'Exchange Needs Assessment Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { opportunities: needsAssessment.exchangeOpportunities.length, functions: participatingFunctions.length } }
  });

  // Phase 2: Exchange Program Design
  ctx.log('info', 'Phase 2: Designing exchange program');
  const programDesign = await ctx.task(programDesignTask, { needsAssessment, exchangeMechanisms, duration, outputDir });
  artifacts.push(...programDesign.artifacts);

  // Phase 3: Rotation Program Design
  ctx.log('info', 'Phase 3: Designing rotation programs');
  const rotationDesign = await ctx.task(rotationDesignTask, { programDesign: programDesign.design, participatingFunctions, outputDir });
  artifacts.push(...rotationDesign.artifacts);

  // Phase 4: Cross-Functional Team Design
  ctx.log('info', 'Phase 4: Designing cross-functional teams');
  const crossFunctionalTeams = await ctx.task(crossFunctionalTeamTask, { programDesign: programDesign.design, knowledgeDomains, outputDir });
  artifacts.push(...crossFunctionalTeams.artifacts);

  // Phase 5: Knowledge Network Design
  ctx.log('info', 'Phase 5: Designing knowledge networks');
  const networkDesign = await ctx.task(networkDesignTask, { knowledgeDomains, participatingFunctions, outputDir });
  artifacts.push(...networkDesign.artifacts);

  // Phase 6: Exchange Activities Planning
  ctx.log('info', 'Phase 6: Planning exchange activities');
  const activitiesPlanning = await ctx.task(activitiesPlanningTask, { programDesign: programDesign.design, rotationDesign, crossFunctionalTeams, networkDesign, outputDir });
  artifacts.push(...activitiesPlanning.artifacts);

  // Phase 7: Governance and Support
  ctx.log('info', 'Phase 7: Designing governance and support');
  const governanceSupport = await ctx.task(governanceSupportTask, { programDesign: programDesign.design, organizationalContext, outputDir });
  artifacts.push(...governanceSupport.artifacts);

  // Phase 8: Measurement Framework
  ctx.log('info', 'Phase 8: Designing measurement framework');
  const measurementFramework = await ctx.task(measurementFrameworkTask, { programDesign: programDesign.design, exchangeScope, outputDir });
  artifacts.push(...measurementFramework.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { needsAssessment, programDesign, activitiesPlanning, measurementFramework, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { exchangeProgram: programDesign.design, activities: activitiesPlanning.activities, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    exchangeProgram: programDesign.design,
    exchangeActivities: activitiesPlanning.activities,
    rotationPrograms: rotationDesign.programs,
    crossFunctionalTeams: crossFunctionalTeams.teams,
    knowledgeNetworks: networkDesign.networks,
    measurementFramework: measurementFramework.framework,
    governance: governanceSupport.governance,
    statistics: { functionsInvolved: participatingFunctions.length, activitiesPlanned: activitiesPlanning.activities.length, exchangeOpportunities: needsAssessment.exchangeOpportunities.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/cross-functional-knowledge-exchange', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess exchange needs',
  agent: {
    name: 'exchange-analyst',
    prompt: { role: 'cross-functional exchange analyst', task: 'Assess knowledge exchange needs', context: args, instructions: ['Identify exchange opportunities and barriers', 'Save to output directory'], outputFormat: 'JSON with exchangeOpportunities (array), barriers (array), artifacts' },
    outputSchema: { type: 'object', required: ['exchangeOpportunities', 'artifacts'], properties: { exchangeOpportunities: { type: 'array' }, barriers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'exchange', 'assessment']
}));

export const programDesignTask = defineTask('program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design exchange program',
  agent: {
    name: 'program-designer',
    prompt: { role: 'exchange program designer', task: 'Design comprehensive exchange program', context: args, instructions: ['Create program structure and timeline', 'Save to output directory'], outputFormat: 'JSON with design (object), artifacts' },
    outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'program', 'design']
}));

export const rotationDesignTask = defineTask('rotation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design rotation programs',
  agent: {
    name: 'rotation-designer',
    prompt: { role: 'rotation program designer', task: 'Design job rotation programs', context: args, instructions: ['Create rotation structure and assignments', 'Save to output directory'], outputFormat: 'JSON with programs (array), artifacts' },
    outputSchema: { type: 'object', required: ['programs', 'artifacts'], properties: { programs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'rotation', 'design']
}));

export const crossFunctionalTeamTask = defineTask('cross-functional-team', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design cross-functional teams',
  agent: {
    name: 'team-designer',
    prompt: { role: 'cross-functional team designer', task: 'Design cross-functional teams', context: args, instructions: ['Define team composition and objectives', 'Save to output directory'], outputFormat: 'JSON with teams (array), artifacts' },
    outputSchema: { type: 'object', required: ['teams', 'artifacts'], properties: { teams: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'teams', 'design']
}));

export const networkDesignTask = defineTask('network-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design knowledge networks',
  agent: {
    name: 'network-designer',
    prompt: { role: 'knowledge network designer', task: 'Design knowledge networks', context: args, instructions: ['Create network structures and activities', 'Save to output directory'], outputFormat: 'JSON with networks (array), artifacts' },
    outputSchema: { type: 'object', required: ['networks', 'artifacts'], properties: { networks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'networks', 'design']
}));

export const activitiesPlanningTask = defineTask('activities-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan exchange activities',
  agent: {
    name: 'activities-planner',
    prompt: { role: 'exchange activities planner', task: 'Plan exchange activities', context: args, instructions: ['Define activities and calendar', 'Save to output directory'], outputFormat: 'JSON with activities (array), calendar (object), artifacts' },
    outputSchema: { type: 'object', required: ['activities', 'artifacts'], properties: { activities: { type: 'array' }, calendar: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'activities', 'planning']
}));

export const governanceSupportTask = defineTask('governance-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design governance and support',
  agent: {
    name: 'governance-designer',
    prompt: { role: 'governance designer', task: 'Design governance framework', context: args, instructions: ['Define governance and support mechanisms', 'Save to output directory'], outputFormat: 'JSON with governance (object), artifacts' },
    outputSchema: { type: 'object', required: ['governance', 'artifacts'], properties: { governance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'governance', 'support']
}));

export const measurementFrameworkTask = defineTask('measurement-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design measurement framework',
  agent: {
    name: 'measurement-designer',
    prompt: { role: 'measurement framework designer', task: 'Design measurement framework', context: args, instructions: ['Define metrics and evaluation approach', 'Save to output directory'], outputFormat: 'JSON with framework (object), artifacts' },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'measurement', 'framework']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess design quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Evaluate design quality', context: args, instructions: ['Assess program design quality', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));

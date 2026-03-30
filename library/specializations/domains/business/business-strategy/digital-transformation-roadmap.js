/**
 * @process business-strategy/digital-transformation-roadmap
 * @description Strategic planning for technology-enabled business transformation including capability assessment, initiative prioritization, and implementation planning
 * @inputs { organizationContext: object, transformationVision: string, currentState: object, outputDir: string }
 * @outputs { success: boolean, maturityAssessment: object, roadmap: object, initiatives: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    transformationVision = '',
    currentState = {},
    outputDir = 'digital-transform-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Digital Transformation Roadmapping Process');

  // Phase 1: Digital Maturity Assessment
  ctx.log('info', 'Phase 1: Assessing digital maturity');
  const maturityAssessment = await ctx.task(digitalMaturityTask, { organizationContext, currentState, outputDir });
  artifacts.push(...maturityAssessment.artifacts);

  // Phase 2: Transformation Vision and Strategy
  ctx.log('info', 'Phase 2: Defining transformation strategy');
  const transformationStrategy = await ctx.task(transformationStrategyTask, { transformationVision, maturityAssessment, outputDir });
  artifacts.push(...transformationStrategy.artifacts);

  // Phase 3: Capability Gap Analysis
  ctx.log('info', 'Phase 3: Analyzing capability gaps');
  const capabilityGaps = await ctx.task(capabilityGapAnalysisTask, { maturityAssessment, transformationStrategy, outputDir });
  artifacts.push(...capabilityGaps.artifacts);

  // Phase 4: Initiative Identification
  ctx.log('info', 'Phase 4: Identifying transformation initiatives');
  const initiatives = await ctx.task(initiativeIdentificationTask, { capabilityGaps, transformationStrategy, outputDir });
  artifacts.push(...initiatives.artifacts);

  // Phase 5: Technology Architecture
  ctx.log('info', 'Phase 5: Designing technology architecture');
  const techArchitecture = await ctx.task(technologyArchitectureTask, { initiatives: initiatives.initiatives, outputDir });
  artifacts.push(...techArchitecture.artifacts);

  // Phase 6: Roadmap Development
  ctx.log('info', 'Phase 6: Developing transformation roadmap');
  const roadmap = await ctx.task(roadmapDevelopmentTask, { initiatives: initiatives.initiatives, techArchitecture, outputDir });
  artifacts.push(...roadmap.artifacts);

  // Phase 7: Change and Adoption Plan
  ctx.log('info', 'Phase 7: Planning change and adoption');
  const changeAdoption = await ctx.task(changeAdoptionPlanTask, { roadmap, organizationContext, outputDir });
  artifacts.push(...changeAdoption.artifacts);

  // Phase 8: Generate Report
  ctx.log('info', 'Phase 8: Generating transformation roadmap report');
  const transformReport = await ctx.task(transformationReportTask, { maturityAssessment, transformationStrategy, roadmap, changeAdoption, outputDir });
  artifacts.push(...transformReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    maturityAssessment: maturityAssessment.assessment,
    roadmap: roadmap.roadmap,
    initiatives: initiatives.initiatives,
    technologyArchitecture: techArchitecture.architecture,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/digital-transformation-roadmap', timestamp: startTime }
  };
}

export const digitalMaturityTask = defineTask('digital-maturity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess digital maturity',
  agent: {
    name: 'digital-maturity-assessor',
    prompt: {
      role: 'digital maturity assessment specialist',
      task: 'Assess organizational digital maturity',
      context: args,
      instructions: ['Assess across dimensions: Strategy, Culture, Organization, Technology, Operations, Customer', 'Score maturity levels (1-5)', 'Benchmark against industry', 'Identify strengths and gaps', 'Save assessment to output directory'],
      outputFormat: 'JSON with assessment (object), maturityScore (number), gaps (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['assessment', 'maturityScore', 'artifacts'], properties: { assessment: { type: 'object' }, maturityScore: { type: 'number' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'maturity']
}));

export const transformationStrategyTask = defineTask('transformation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define transformation strategy',
  agent: {
    name: 'transformation-strategist',
    prompt: {
      role: 'digital transformation strategist',
      task: 'Define digital transformation strategy',
      context: args,
      instructions: ['Articulate transformation vision', 'Define strategic pillars', 'Set transformation objectives', 'Identify success metrics', 'Save strategy to output directory'],
      outputFormat: 'JSON with strategy (object), objectives (array), metrics (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, objectives: { type: 'array' }, metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'strategy']
}));

export const capabilityGapAnalysisTask = defineTask('capability-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze capability gaps',
  agent: {
    name: 'capability-analyst',
    prompt: {
      role: 'digital capability analyst',
      task: 'Analyze capability gaps for digital transformation',
      context: args,
      instructions: ['Map current vs required capabilities', 'Identify technology gaps', 'Identify skill gaps', 'Identify process gaps', 'Save analysis to output directory'],
      outputFormat: 'JSON with gaps (array), prioritizedGaps (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['gaps', 'artifacts'], properties: { gaps: { type: 'array' }, prioritizedGaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'capabilities']
}));

export const initiativeIdentificationTask = defineTask('initiative-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify transformation initiatives',
  agent: {
    name: 'initiative-planner',
    prompt: {
      role: 'transformation initiative planner',
      task: 'Identify and prioritize transformation initiatives',
      context: args,
      instructions: ['Identify initiatives to close gaps', 'Prioritize by value and feasibility', 'Define quick wins and long-term', 'Estimate investment required', 'Save initiatives to output directory'],
      outputFormat: 'JSON with initiatives (array), prioritization (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['initiatives', 'artifacts'], properties: { initiatives: { type: 'array' }, prioritization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'initiatives']
}));

export const technologyArchitectureTask = defineTask('technology-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design technology architecture',
  agent: {
    name: 'enterprise-architect',
    prompt: {
      role: 'enterprise technology architect',
      task: 'Design target technology architecture',
      context: args,
      instructions: ['Design target state architecture', 'Identify technology building blocks', 'Plan integration approach', 'Address security and compliance', 'Save architecture to output directory'],
      outputFormat: 'JSON with architecture (object), buildingBlocks (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['architecture', 'artifacts'], properties: { architecture: { type: 'object' }, buildingBlocks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'architecture']
}));

export const roadmapDevelopmentTask = defineTask('roadmap-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop transformation roadmap',
  agent: {
    name: 'roadmap-developer',
    prompt: {
      role: 'transformation roadmap developer',
      task: 'Develop multi-year transformation roadmap',
      context: args,
      instructions: ['Sequence initiatives', 'Define waves/phases', 'Identify dependencies', 'Create timeline with milestones', 'Save roadmap to output directory'],
      outputFormat: 'JSON with roadmap (object), timeline (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['roadmap', 'artifacts'], properties: { roadmap: { type: 'object' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'roadmap']
}));

export const changeAdoptionPlanTask = defineTask('change-adoption-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan change and adoption',
  agent: {
    name: 'adoption-planner',
    prompt: {
      role: 'digital adoption specialist',
      task: 'Plan change management and adoption',
      context: args,
      instructions: ['Develop change management approach', 'Plan training and enablement', 'Design adoption metrics', 'Create communication plan', 'Save plan to output directory'],
      outputFormat: 'JSON with changePlan (object), trainingPlan (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['changePlan', 'artifacts'], properties: { changePlan: { type: 'object' }, trainingPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'adoption']
}));

export const transformationReportTask = defineTask('transformation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate transformation report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'digital transformation consultant and technical writer',
      task: 'Generate comprehensive transformation roadmap report',
      context: args,
      instructions: ['Create executive summary', 'Document maturity assessment', 'Present transformation strategy', 'Include roadmap visualization', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'digital-transformation', 'reporting']
}));

/**
 * @process business-strategy/post-merger-integration
 * @description Comprehensive planning and execution framework for integrating acquired companies to realize deal synergies and strategic objectives
 * @inputs { dealContext: object, acquiredCompany: object, acquiringCompany: object, synergyTargets: object, outputDir: string }
 * @outputs { success: boolean, integrationPlan: object, synergyCaptureApproach: object, changeManagementPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dealContext = {},
    acquiredCompany = {},
    acquiringCompany = {},
    synergyTargets = {},
    outputDir = 'pmi-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Post-Merger Integration Planning Process');

  // Phase 1: Integration Strategy and Principles
  ctx.log('info', 'Phase 1: Defining integration strategy');
  const integrationStrategy = await ctx.task(integrationStrategyTask, { dealContext, acquiredCompany, acquiringCompany, outputDir });
  artifacts.push(...integrationStrategy.artifacts);

  // Phase 2: Integration Governance
  ctx.log('info', 'Phase 2: Establishing integration governance');
  const integrationGovernance = await ctx.task(integrationGovernanceTask, { integrationStrategy, outputDir });
  artifacts.push(...integrationGovernance.artifacts);

  // Phase 3: Synergy Identification and Validation
  ctx.log('info', 'Phase 3: Identifying and validating synergies');
  const synergyValidation = await ctx.task(synergyValidationTask, { synergyTargets, acquiredCompany, acquiringCompany, outputDir });
  artifacts.push(...synergyValidation.artifacts);

  // Phase 4: Organizational Design
  ctx.log('info', 'Phase 4: Designing target organization');
  const orgDesign = await ctx.task(orgDesignTask, { integrationStrategy, acquiredCompany, acquiringCompany, outputDir });
  artifacts.push(...orgDesign.artifacts);

  // Phase 5: Functional Integration Planning
  ctx.log('info', 'Phase 5: Planning functional integration');
  const functionalPlanning = await ctx.task(functionalIntegrationTask, { orgDesign, integrationStrategy, outputDir });
  artifacts.push(...functionalPlanning.artifacts);

  // Phase 6: Technology and Systems Integration
  ctx.log('info', 'Phase 6: Planning technology integration');
  const techIntegration = await ctx.task(techIntegrationTask, { acquiredCompany, acquiringCompany, outputDir });
  artifacts.push(...techIntegration.artifacts);

  // Phase 7: Culture Integration
  ctx.log('info', 'Phase 7: Planning culture integration');
  const cultureIntegration = await ctx.task(cultureIntegrationTask, { acquiredCompany, acquiringCompany, outputDir });
  artifacts.push(...cultureIntegration.artifacts);

  // Phase 8: Synergy Capture Planning
  ctx.log('info', 'Phase 8: Planning synergy capture');
  const synergyCaptureePlan = await ctx.task(synergyCaptureTask, { synergyValidation, functionalPlanning, outputDir });
  artifacts.push(...synergyCaptureePlan.artifacts);

  // Phase 9: Change Management and Communication
  ctx.log('info', 'Phase 9: Developing change management plan');
  const changeManagement = await ctx.task(changeManagementTask, { orgDesign, cultureIntegration, outputDir });
  artifacts.push(...changeManagement.artifacts);

  // Phase 10: Day 1 Readiness
  ctx.log('info', 'Phase 10: Planning Day 1 readiness');
  const day1Readiness = await ctx.task(day1ReadinessTask, { integrationStrategy, functionalPlanning, outputDir });
  artifacts.push(...day1Readiness.artifacts);

  // Phase 11: Integration Execution Roadmap
  ctx.log('info', 'Phase 11: Creating integration roadmap');
  const integrationRoadmap = await ctx.task(integrationRoadmapTask, { functionalPlanning, techIntegration, synergyCaptureePlan, outputDir });
  artifacts.push(...integrationRoadmap.artifacts);

  // Phase 12: Generate Report
  ctx.log('info', 'Phase 12: Generating PMI report');
  const pmiReport = await ctx.task(pmiReportTask, { integrationStrategy, synergyValidation, orgDesign, integrationRoadmap, changeManagement, outputDir });
  artifacts.push(...pmiReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    integrationPlan: {
      strategy: integrationStrategy.strategy,
      governance: integrationGovernance.governance,
      organization: orgDesign.design,
      roadmap: integrationRoadmap.roadmap
    },
    synergyCaptureApproach: synergyCaptureePlan.approach,
    changeManagementPlan: changeManagement.plan,
    day1Checklist: day1Readiness.checklist,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/post-merger-integration', timestamp: startTime }
  };
}

export const integrationStrategyTask = defineTask('integration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define integration strategy',
  agent: {
    name: 'integration-strategist',
    prompt: {
      role: 'post-merger integration strategist',
      task: 'Define overall integration strategy and approach',
      context: args,
      instructions: ['Define integration philosophy (absorption, preservation, transformation)', 'Set integration priorities', 'Define success metrics', 'Establish guiding principles', 'Save strategy to output directory'],
      outputFormat: 'JSON with strategy (object), priorities (array), successMetrics (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, priorities: { type: 'array' }, successMetrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'strategy']
}));

export const integrationGovernanceTask = defineTask('integration-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish integration governance',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'integration program management specialist',
      task: 'Design integration governance structure',
      context: args,
      instructions: ['Design IMO structure', 'Define steering committee', 'Establish work streams', 'Create decision rights matrix', 'Save governance to output directory'],
      outputFormat: 'JSON with governance (object), imoStructure (object), workStreams (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['governance', 'artifacts'], properties: { governance: { type: 'object' }, imoStructure: { type: 'object' }, workStreams: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'governance']
}));

export const synergyValidationTask = defineTask('synergy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate synergies',
  agent: {
    name: 'synergy-analyst',
    prompt: {
      role: 'synergy validation specialist',
      task: 'Validate and detail synergy opportunities',
      context: args,
      instructions: ['Validate revenue synergies', 'Validate cost synergies', 'Identify one-time costs', 'Create synergy tracking model', 'Save validation to output directory'],
      outputFormat: 'JSON with synergies (object), revenueSynergies (array), costSynergies (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['synergies', 'artifacts'], properties: { synergies: { type: 'object' }, revenueSynergies: { type: 'array' }, costSynergies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'synergies']
}));

export const orgDesignTask = defineTask('org-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design target organization',
  agent: {
    name: 'org-designer',
    prompt: {
      role: 'organizational design specialist',
      task: 'Design integrated organizational structure',
      context: args,
      instructions: ['Design target org structure', 'Define leadership appointments', 'Plan workforce integration', 'Identify retention priorities', 'Save design to output directory'],
      outputFormat: 'JSON with design (object), structure (object), retentionPriorities (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, structure: { type: 'object' }, retentionPriorities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'organization']
}));

export const functionalIntegrationTask = defineTask('functional-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan functional integration',
  agent: {
    name: 'functional-planner',
    prompt: {
      role: 'functional integration planning specialist',
      task: 'Plan integration across all functional areas',
      context: args,
      instructions: ['Plan Finance integration', 'Plan HR integration', 'Plan Operations integration', 'Plan Sales and Marketing integration', 'Save plans to output directory'],
      outputFormat: 'JSON with functionalPlans (object), milestones (array), dependencies (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['functionalPlans', 'artifacts'], properties: { functionalPlans: { type: 'object' }, milestones: { type: 'array' }, dependencies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'functional']
}));

export const techIntegrationTask = defineTask('tech-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan technology integration',
  agent: {
    name: 'tech-integration-planner',
    prompt: {
      role: 'technology integration specialist',
      task: 'Plan technology and systems integration',
      context: args,
      instructions: ['Assess system landscapes', 'Define target architecture', 'Plan data migration', 'Plan system cutover approach', 'Save plan to output directory'],
      outputFormat: 'JSON with techPlan (object), targetArchitecture (object), migrations (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['techPlan', 'artifacts'], properties: { techPlan: { type: 'object' }, targetArchitecture: { type: 'object' }, migrations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'technology']
}));

export const cultureIntegrationTask = defineTask('culture-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan culture integration',
  agent: {
    name: 'culture-integrator',
    prompt: {
      role: 'organizational culture integration specialist',
      task: 'Plan cultural integration approach',
      context: args,
      instructions: ['Assess cultural differences', 'Define target culture', 'Plan culture bridging activities', 'Design integration rituals', 'Save plan to output directory'],
      outputFormat: 'JSON with culturePlan (object), culturalGaps (array), bridgingActivities (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['culturePlan', 'artifacts'], properties: { culturePlan: { type: 'object' }, culturalGaps: { type: 'array' }, bridgingActivities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'culture']
}));

export const synergyCaptureTask = defineTask('synergy-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan synergy capture',
  agent: {
    name: 'synergy-capture-planner',
    prompt: {
      role: 'synergy realization specialist',
      task: 'Plan detailed synergy capture approach',
      context: args,
      instructions: ['Create synergy capture initiatives', 'Define owners and timelines', 'Establish tracking mechanisms', 'Plan quick wins', 'Save approach to output directory'],
      outputFormat: 'JSON with approach (object), initiatives (array), trackingModel (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['approach', 'artifacts'], properties: { approach: { type: 'object' }, initiatives: { type: 'array' }, trackingModel: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'synergy-capture']
}));

export const changeManagementTask = defineTask('change-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop change management plan',
  agent: {
    name: 'change-manager',
    prompt: {
      role: 'change management specialist',
      task: 'Develop comprehensive change management approach',
      context: args,
      instructions: ['Assess change impact', 'Design communication plan', 'Plan stakeholder engagement', 'Create training approach', 'Save plan to output directory'],
      outputFormat: 'JSON with plan (object), communicationPlan (object), stakeholderMap (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, communicationPlan: { type: 'object' }, stakeholderMap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'change-management']
}));

export const day1ReadinessTask = defineTask('day1-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Day 1 readiness',
  agent: {
    name: 'day1-planner',
    prompt: {
      role: 'Day 1 readiness specialist',
      task: 'Plan Day 1 activities and readiness',
      context: args,
      instructions: ['Define Day 1 requirements', 'Create Day 1 checklist', 'Plan announcements and communications', 'Ensure operational continuity', 'Save plan to output directory'],
      outputFormat: 'JSON with checklist (array), communications (array), readinessStatus (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['checklist', 'artifacts'], properties: { checklist: { type: 'array' }, communications: { type: 'array' }, readinessStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'day1']
}));

export const integrationRoadmapTask = defineTask('integration-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create integration roadmap',
  agent: {
    name: 'roadmap-developer',
    prompt: {
      role: 'integration program manager',
      task: 'Create comprehensive integration execution roadmap',
      context: args,
      instructions: ['Sequence all integration activities', 'Define phases and gates', 'Identify critical path', 'Create milestone plan', 'Save roadmap to output directory'],
      outputFormat: 'JSON with roadmap (object), phases (array), milestones (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['roadmap', 'artifacts'], properties: { roadmap: { type: 'object' }, phases: { type: 'array' }, milestones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'roadmap']
}));

export const pmiReportTask = defineTask('pmi-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate PMI report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'M&A integration advisor and technical writer',
      task: 'Generate comprehensive PMI planning report',
      context: args,
      instructions: ['Create executive summary', 'Document integration strategy', 'Present synergy capture plan', 'Include detailed roadmap', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pmi', 'reporting']
}));

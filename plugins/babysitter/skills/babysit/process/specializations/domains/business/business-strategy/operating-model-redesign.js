/**
 * @process business-strategy/operating-model-redesign
 * @description Comprehensive redesign of organizational structure, processes, governance, and capabilities to support strategic objectives
 * @inputs { strategicObjectives: array, organizationContext: object, currentOperatingModel: object, outputDir: string }
 * @outputs { success: boolean, currentStateAssessment: object, futureOperatingModel: object, transitionPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    strategicObjectives = [],
    organizationContext = {},
    currentOperatingModel = {},
    outputDir = 'operating-model-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Operating Model Redesign Process');

  // Phase 1: Current State Assessment
  ctx.log('info', 'Phase 1: Assessing current operating model');
  const currentAssessment = await ctx.task(currentStateAssessmentTask, { currentOperatingModel, organizationContext, outputDir });
  artifacts.push(...currentAssessment.artifacts);

  // Phase 2: Strategic Alignment Analysis
  ctx.log('info', 'Phase 2: Analyzing strategic alignment');
  const alignmentAnalysis = await ctx.task(strategicAlignmentTask, { currentAssessment, strategicObjectives, outputDir });
  artifacts.push(...alignmentAnalysis.artifacts);

  // Phase 3: Operating Model Design Principles
  ctx.log('info', 'Phase 3: Defining design principles');
  const designPrinciples = await ctx.task(designPrinciplesTask, { strategicObjectives, alignmentAnalysis, outputDir });
  artifacts.push(...designPrinciples.artifacts);

  // Phase 4: Structure Design
  ctx.log('info', 'Phase 4: Designing organizational structure');
  const structureDesign = await ctx.task(structureDesignTask, { designPrinciples, outputDir });
  artifacts.push(...structureDesign.artifacts);

  // Phase 5: Process Design
  ctx.log('info', 'Phase 5: Designing core processes');
  const processDesign = await ctx.task(processDesignTask, { structureDesign, designPrinciples, outputDir });
  artifacts.push(...processDesign.artifacts);

  // Phase 6: Governance Design
  ctx.log('info', 'Phase 6: Designing governance model');
  const governanceDesign = await ctx.task(governanceDesignTask, { structureDesign, processDesign, outputDir });
  artifacts.push(...governanceDesign.artifacts);

  // Phase 7: Capability Requirements
  ctx.log('info', 'Phase 7: Defining capability requirements');
  const capabilityRequirements = await ctx.task(capabilityRequirementsTask, { structureDesign, processDesign, outputDir });
  artifacts.push(...capabilityRequirements.artifacts);

  // Phase 8: Transition Planning
  ctx.log('info', 'Phase 8: Planning transition');
  const transitionPlan = await ctx.task(transitionPlanningTask, { currentAssessment, structureDesign, processDesign, governanceDesign, outputDir });
  artifacts.push(...transitionPlan.artifacts);

  // Phase 9: Generate Report
  ctx.log('info', 'Phase 9: Generating operating model report');
  const modelReport = await ctx.task(operatingModelReportTask, { currentAssessment, designPrinciples, structureDesign, processDesign, governanceDesign, transitionPlan, outputDir });
  artifacts.push(...modelReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    currentStateAssessment: currentAssessment.assessment,
    futureOperatingModel: {
      structure: structureDesign.structure,
      processes: processDesign.processes,
      governance: governanceDesign.governance,
      capabilities: capabilityRequirements.capabilities
    },
    transitionPlan: transitionPlan.plan,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/operating-model-redesign', timestamp: startTime }
  };
}

export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current operating model',
  agent: {
    name: 'operating-model-analyst',
    prompt: {
      role: 'operating model analyst',
      task: 'Assess current operating model',
      context: args,
      instructions: ['Assess structure, processes, governance, capabilities', 'Identify pain points and inefficiencies', 'Evaluate strategic alignment', 'Save assessment to output directory'],
      outputFormat: 'JSON with assessment (object), painPoints (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, painPoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'assessment']
}));

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze strategic alignment',
  agent: {
    name: 'alignment-analyst',
    prompt: {
      role: 'strategic alignment analyst',
      task: 'Analyze alignment between operating model and strategy',
      context: args,
      instructions: ['Map operating model to strategic objectives', 'Identify alignment gaps', 'Prioritize misalignments', 'Save analysis to output directory'],
      outputFormat: 'JSON with alignment (object), gaps (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['alignment', 'gaps', 'artifacts'], properties: { alignment: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'alignment']
}));

export const designPrinciplesTask = defineTask('design-principles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define design principles',
  agent: {
    name: 'design-architect',
    prompt: {
      role: 'operating model design architect',
      task: 'Define operating model design principles',
      context: args,
      instructions: ['Define guiding principles', 'Set design constraints', 'Establish decision criteria', 'Save principles to output directory'],
      outputFormat: 'JSON with principles (array), constraints (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['principles', 'artifacts'], properties: { principles: { type: 'array' }, constraints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'principles']
}));

export const structureDesignTask = defineTask('structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design organizational structure',
  agent: {
    name: 'org-designer',
    prompt: {
      role: 'organizational structure designer',
      task: 'Design future organizational structure',
      context: args,
      instructions: ['Design org structure options', 'Define reporting relationships', 'Design roles and responsibilities', 'Save structure to output directory'],
      outputFormat: 'JSON with structure (object), orgChart (object), roles (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['structure', 'artifacts'], properties: { structure: { type: 'object' }, orgChart: { type: 'object' }, roles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'structure']
}));

export const processDesignTask = defineTask('process-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design core processes',
  agent: {
    name: 'process-designer',
    prompt: {
      role: 'business process designer',
      task: 'Design core business processes',
      context: args,
      instructions: ['Identify core processes', 'Design process flows', 'Define handoffs and interfaces', 'Save processes to output directory'],
      outputFormat: 'JSON with processes (array), processArchitecture (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['processes', 'artifacts'], properties: { processes: { type: 'array' }, processArchitecture: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'processes']
}));

export const governanceDesignTask = defineTask('governance-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design governance model',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'governance model designer',
      task: 'Design governance and decision-making model',
      context: args,
      instructions: ['Define decision rights', 'Design governance bodies', 'Create escalation paths', 'Save governance to output directory'],
      outputFormat: 'JSON with governance (object), decisionRights (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['governance', 'artifacts'], properties: { governance: { type: 'object' }, decisionRights: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'governance']
}));

export const capabilityRequirementsTask = defineTask('capability-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define capability requirements',
  agent: {
    name: 'capability-planner',
    prompt: {
      role: 'capability planning specialist',
      task: 'Define capability requirements for new operating model',
      context: args,
      instructions: ['Identify required capabilities', 'Assess capability gaps', 'Plan capability build', 'Save requirements to output directory'],
      outputFormat: 'JSON with capabilities (array), gaps (array), buildPlan (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['capabilities', 'artifacts'], properties: { capabilities: { type: 'array' }, gaps: { type: 'array' }, buildPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'capabilities']
}));

export const transitionPlanningTask = defineTask('transition-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan transition',
  agent: {
    name: 'transition-planner',
    prompt: {
      role: 'operating model transition planner',
      task: 'Plan transition from current to future operating model',
      context: args,
      instructions: ['Define transition phases', 'Plan change management', 'Create communication plan', 'Save transition plan to output directory'],
      outputFormat: 'JSON with plan (object), phases (array), timeline (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, phases: { type: 'array' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'transition']
}));

export const operatingModelReportTask = defineTask('operating-model-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate operating model report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'operating model consultant and technical writer',
      task: 'Generate comprehensive operating model redesign report',
      context: args,
      instructions: ['Create executive summary', 'Document current vs future state', 'Present all design elements', 'Include transition roadmap', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'operating-model', 'reporting']
}));

/**
 * @process business-strategy/strategic-planning-cycle
 * @description Annual strategic planning process including preparation, analysis, formulation, and implementation planning
 * @inputs { organizationName: string, planningPeriod: string, currentStrategy: object, environmentalData: object }
 * @outputs { success: boolean, strategicPlan: object, implementationRoadmap: object, communicationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    planningPeriod = '3-year',
    currentStrategy = {},
    environmentalData = {},
    outputDir = 'strategic-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Strategic Planning Cycle for ${organizationName}`);

  // Phase 1: Preparation Phase
  ctx.log('info', 'Phase 1: Executing preparation phase');
  const preparationPhase = await ctx.task(preparationPhaseTask, {
    organizationName, planningPeriod, currentStrategy, outputDir
  });
  artifacts.push(...preparationPhase.artifacts);

  // Phase 2: External Analysis
  ctx.log('info', 'Phase 2: Conducting external environment analysis');
  const externalAnalysis = await ctx.task(externalAnalysisTask, {
    organizationName, environmentalData, outputDir
  });
  artifacts.push(...externalAnalysis.artifacts);

  // Phase 3: Internal Analysis
  ctx.log('info', 'Phase 3: Conducting internal capabilities analysis');
  const internalAnalysis = await ctx.task(internalAnalysisTask, {
    organizationName, currentStrategy, outputDir
  });
  artifacts.push(...internalAnalysis.artifacts);

  // Phase 4: Strategy Formulation
  ctx.log('info', 'Phase 4: Formulating strategy options');
  const strategyFormulation = await ctx.task(strategyFormulationTask, {
    organizationName, externalAnalysis, internalAnalysis, currentStrategy, outputDir
  });
  artifacts.push(...strategyFormulation.artifacts);

  // Phase 5: Strategy Evaluation and Selection
  ctx.log('info', 'Phase 5: Evaluating and selecting strategies');
  const strategySelection = await ctx.task(strategySelectionTask, {
    organizationName, strategyFormulation, outputDir
  });
  artifacts.push(...strategySelection.artifacts);

  // Phase 6: Implementation Planning
  ctx.log('info', 'Phase 6: Developing implementation plan');
  const implementationPlanning = await ctx.task(implementationPlanningTask, {
    organizationName, strategySelection, outputDir
  });
  artifacts.push(...implementationPlanning.artifacts);

  // Phase 7: Resource Allocation
  ctx.log('info', 'Phase 7: Planning resource allocation');
  const resourceAllocation = await ctx.task(strategicResourceAllocationTask, {
    organizationName, implementationPlanning, outputDir
  });
  artifacts.push(...resourceAllocation.artifacts);

  // Phase 8: Communication Plan
  ctx.log('info', 'Phase 8: Developing strategy communication plan');
  const communicationPlan = await ctx.task(strategyCommunicationTask, {
    organizationName, strategySelection, implementationPlanning, outputDir
  });
  artifacts.push(...communicationPlan.artifacts);

  // Phase 9: Generate Strategic Plan Document
  ctx.log('info', 'Phase 9: Generating comprehensive strategic plan document');
  const strategicPlanDoc = await ctx.task(strategicPlanDocumentTask, {
    organizationName, planningPeriod, preparationPhase, externalAnalysis, internalAnalysis,
    strategyFormulation, strategySelection, implementationPlanning, resourceAllocation, communicationPlan, outputDir
  });
  artifacts.push(...strategicPlanDoc.artifacts);

  await ctx.breakpoint({
    question: `Strategic planning cycle complete for ${organizationName}. Review the ${planningPeriod} strategic plan?`,
    title: 'Strategic Planning Cycle Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName, planningPeriod,
    strategicPlan: strategicPlanDoc.plan,
    selectedStrategies: strategySelection.selectedStrategies,
    implementationRoadmap: implementationPlanning.roadmap,
    resourceAllocation: resourceAllocation.allocation,
    communicationPlan: communicationPlan.plan,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/strategic-planning-cycle', timestamp: startTime, outputDir }
  };
}

export const preparationPhaseTask = defineTask('preparation-phase', (args, taskCtx) => ({
  kind: 'agent', title: 'Execute preparation phase',
  agent: {
    name: 'planning-coordinator',
    prompt: {
      role: 'strategic planning coordinator',
      task: 'Execute the preparation phase of strategic planning',
      context: args,
      instructions: ['Define planning scope and objectives', 'Identify key stakeholders', 'Establish planning calendar and milestones', 'Gather historical data and performance metrics', 'Review current strategy effectiveness', 'Generate preparation phase documentation']
    },
    outputSchema: { type: 'object', required: ['preparation', 'artifacts'], properties: { preparation: { type: 'object' }, stakeholders: { type: 'array' }, calendar: { type: 'object' }, currentStrategyReview: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'preparation']
}));

export const externalAnalysisTask = defineTask('external-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Conduct external environment analysis',
  agent: {
    name: 'external-analyst',
    prompt: {
      role: 'external environment analyst',
      task: 'Analyze the external environment for strategic planning',
      context: args,
      instructions: ['Conduct macro-environmental analysis (PESTEL)', 'Analyze industry dynamics (Five Forces)', 'Assess competitive landscape', 'Identify key opportunities and threats', 'Analyze market trends and drivers', 'Generate external analysis report']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, opportunities: { type: 'array' }, threats: { type: 'array' }, keyTrends: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'external-analysis']
}));

export const internalAnalysisTask = defineTask('internal-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Conduct internal capabilities analysis',
  agent: {
    name: 'internal-analyst',
    prompt: {
      role: 'internal capabilities analyst',
      task: 'Analyze internal capabilities and resources',
      context: args,
      instructions: ['Assess organizational capabilities and resources', 'Analyze value chain activities', 'Identify core competencies', 'Evaluate financial position', 'Identify strengths and weaknesses', 'Generate internal analysis report']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, strengths: { type: 'array' }, weaknesses: { type: 'array' }, capabilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'internal-analysis']
}));

export const strategyFormulationTask = defineTask('strategy-formulation', (args, taskCtx) => ({
  kind: 'agent', title: 'Formulate strategy options',
  agent: {
    name: 'strategy-formulator',
    prompt: {
      role: 'strategy formulation specialist',
      task: 'Generate and develop strategy options',
      context: args,
      instructions: ['Define strategic vision and mission', 'Set strategic objectives', 'Generate strategy alternatives using TOWS', 'Develop corporate and business strategies', 'Consider growth, stability, and retrenchment options', 'Generate strategy options documentation']
    },
    outputSchema: { type: 'object', required: ['options', 'artifacts'], properties: { options: { type: 'array' }, vision: { type: 'string' }, mission: { type: 'string' }, objectives: { type: 'array' }, towsStrategies: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'formulation']
}));

export const strategySelectionTask = defineTask('strategy-selection', (args, taskCtx) => ({
  kind: 'agent', title: 'Evaluate and select strategies',
  agent: {
    name: 'strategy-evaluator',
    prompt: {
      role: 'strategy evaluation specialist',
      task: 'Evaluate and select optimal strategies',
      context: args,
      instructions: ['Evaluate options against strategic criteria', 'Assess suitability, feasibility, acceptability', 'Conduct risk assessment', 'Select recommended strategies', 'Document selection rationale', 'Generate strategy selection report']
    },
    outputSchema: { type: 'object', required: ['selectedStrategies', 'artifacts'], properties: { selectedStrategies: { type: 'array' }, evaluationMatrix: { type: 'object' }, rationale: { type: 'string' }, risks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'selection']
}));

export const implementationPlanningTask = defineTask('implementation-planning', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'strategy implementation specialist',
      task: 'Develop comprehensive implementation plan',
      context: args,
      instructions: ['Define strategic initiatives and projects', 'Prioritize initiatives by impact', 'Create implementation timeline', 'Define milestones and deliverables', 'Establish governance structure', 'Generate implementation roadmap']
    },
    outputSchema: { type: 'object', required: ['roadmap', 'artifacts'], properties: { roadmap: { type: 'object' }, initiatives: { type: 'array' }, timeline: { type: 'object' }, milestones: { type: 'array' }, governance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'implementation']
}));

export const strategicResourceAllocationTask = defineTask('strategic-resource-allocation', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan resource allocation',
  agent: {
    name: 'resource-planner',
    prompt: {
      role: 'strategic resource allocation specialist',
      task: 'Develop strategic resource allocation plan',
      context: args,
      instructions: ['Estimate resource requirements by initiative', 'Prioritize resource allocation', 'Develop budget framework', 'Plan capability development', 'Address resource constraints', 'Generate resource allocation plan']
    },
    outputSchema: { type: 'object', required: ['allocation', 'artifacts'], properties: { allocation: { type: 'object' }, budget: { type: 'object' }, priorities: { type: 'array' }, constraints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'resources']
}));

export const strategyCommunicationTask = defineTask('strategy-communication', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop strategy communication plan',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'strategic communication specialist',
      task: 'Develop strategy communication plan',
      context: args,
      instructions: ['Define key messages by stakeholder group', 'Develop communication timeline', 'Create communication materials outline', 'Plan cascade communication approach', 'Define feedback mechanisms', 'Generate communication plan']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, keyMessages: { type: 'array' }, timeline: { type: 'object' }, stakeholderApproach: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'communication']
}));

export const strategicPlanDocumentTask = defineTask('strategic-plan-document', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate comprehensive strategic plan document',
  agent: {
    name: 'plan-documenter',
    prompt: {
      role: 'strategic plan author',
      task: 'Generate comprehensive strategic plan document',
      context: args,
      instructions: ['Create executive summary', 'Document vision, mission, values', 'Present environmental analysis', 'Document strategic objectives and measures', 'Present selected strategies', 'Include implementation roadmap', 'Add resource allocation plan', 'Format as professional strategic plan']
    },
    outputSchema: { type: 'object', required: ['plan', 'reportPath', 'artifacts'], properties: { plan: { type: 'object' }, reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'strategic-planning', 'documentation']
}));

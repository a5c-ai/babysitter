/**
 * @process sales/sales-marketing-alignment
 * @description Process for aligning sales and marketing teams on lead definitions, handoff processes, shared metrics, and feedback loops.
 * @inputs { salesTeam: object, marketingTeam: object, currentProcesses?: object, painPoints?: array, alignmentGoals?: array }
 * @outputs { success: boolean, alignmentPlan: object, slaDefinitions: object, sharedMetrics: array, feedbackLoops: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/sales-marketing-alignment', {
 *   salesTeam: { size: 20, leader: 'VP Sales' },
 *   marketingTeam: { size: 15, leader: 'VP Marketing' },
 *   alignmentGoals: ['Improve lead quality', 'Reduce handoff friction']
 * });
 *
 * @references
 * - SiriusDecisions Demand Waterfall: https://www.forrester.com/
 * - Revenue Marketing Alliance: https://www.revenuemarketing.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    salesTeam = {},
    marketingTeam = {},
    currentProcesses = {},
    painPoints = [],
    alignmentGoals = [],
    outputDir = 'alignment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Sales-Marketing Alignment Process');

  // Phase 1: Current State Assessment
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    salesTeam, marketingTeam, currentProcesses, painPoints, outputDir
  });
  artifacts.push(...(currentStateAssessment.artifacts || []));

  // Phase 2: Lead Definition Alignment
  const leadDefinitions = await ctx.task(leadDefinitionAlignmentTask, {
    currentStateAssessment, alignmentGoals, outputDir
  });
  artifacts.push(...(leadDefinitions.artifacts || []));

  // Phase 3: Funnel Stage Definition
  const funnelDefinitions = await ctx.task(funnelStageDefinitionTask, {
    leadDefinitions, currentProcesses, outputDir
  });
  artifacts.push(...(funnelDefinitions.artifacts || []));

  // Phase 4: SLA Development
  const slaDevelopment = await ctx.task(slaDevelopmentTask, {
    leadDefinitions, funnelDefinitions, outputDir
  });
  artifacts.push(...(slaDevelopment.artifacts || []));

  // Phase 5: Shared Metrics Definition
  const sharedMetrics = await ctx.task(sharedMetricsDefinitionTask, {
    leadDefinitions, funnelDefinitions, slaDevelopment, outputDir
  });
  artifacts.push(...(sharedMetrics.artifacts || []));

  // Phase 6: Feedback Loop Design
  const feedbackLoops = await ctx.task(feedbackLoopDesignTask, {
    sharedMetrics, slaDevelopment, outputDir
  });
  artifacts.push(...(feedbackLoops.artifacts || []));

  // Phase 7: Communication Cadence
  const communicationCadence = await ctx.task(communicationCadenceTask, {
    salesTeam, marketingTeam, feedbackLoops, outputDir
  });
  artifacts.push(...(communicationCadence.artifacts || []));

  // Phase 8: Alignment Plan Compilation
  const alignmentPlan = await ctx.task(alignmentPlanCompilationTask, {
    leadDefinitions, funnelDefinitions, slaDevelopment, sharedMetrics,
    feedbackLoops, communicationCadence, outputDir
  });
  artifacts.push(...(alignmentPlan.artifacts || []));

  await ctx.breakpoint({
    question: `Sales-Marketing alignment plan ready. ${sharedMetrics.metrics?.length || 0} shared metrics, ${feedbackLoops.loops?.length || 0} feedback loops defined. Review?`,
    title: 'Sales-Marketing Alignment Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    alignmentPlan: alignmentPlan.plan,
    slaDefinitions: slaDevelopment.slas,
    sharedMetrics: sharedMetrics.metrics,
    feedbackLoops: feedbackLoops.loops,
    communicationPlan: communicationCadence.plan,
    artifacts,
    metadata: { processId: 'sales/sales-marketing-alignment', timestamp: startTime }
  };
}

export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Current State Assessment',
  agent: {
    name: 'alignment-analyst',
    prompt: {
      role: 'Sales-marketing alignment analyst',
      task: 'Assess current state of sales-marketing alignment',
      context: args,
      instructions: ['Document current processes', 'Identify pain points', 'Map handoff workflows', 'Assess collaboration gaps']
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'alignment']
}));

export const leadDefinitionAlignmentTask = defineTask('lead-definition-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Lead Definition Alignment',
  agent: {
    name: 'lead-definition-specialist',
    prompt: {
      role: 'Lead definition specialist',
      task: 'Align on lead definitions between sales and marketing',
      context: args,
      instructions: ['Define MQL criteria', 'Define SQL criteria', 'Establish lead scoring thresholds', 'Document qualification standards']
    },
    outputSchema: { type: 'object', required: ['definitions', 'artifacts'], properties: { definitions: { type: 'object' }, scoringModel: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'lead-definitions']
}));

export const funnelStageDefinitionTask = defineTask('funnel-stage-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Funnel Stage Definition',
  agent: {
    name: 'funnel-specialist',
    prompt: {
      role: 'Demand funnel specialist',
      task: 'Define unified funnel stages',
      context: args,
      instructions: ['Define funnel stages', 'Map stage transitions', 'Set conversion benchmarks', 'Document stage criteria']
    },
    outputSchema: { type: 'object', required: ['funnelStages', 'artifacts'], properties: { funnelStages: { type: 'array' }, transitions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'funnel']
}));

export const slaDevelopmentTask = defineTask('sla-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'SLA Development',
  agent: {
    name: 'sla-specialist',
    prompt: {
      role: 'Service level agreement specialist',
      task: 'Develop sales-marketing SLAs',
      context: args,
      instructions: ['Define lead follow-up SLAs', 'Set marketing response commitments', 'Establish escalation procedures', 'Create accountability measures']
    },
    outputSchema: { type: 'object', required: ['slas', 'artifacts'], properties: { slas: { type: 'object' }, escalations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'sla']
}));

export const sharedMetricsDefinitionTask = defineTask('shared-metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Shared Metrics Definition',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'Revenue metrics specialist',
      task: 'Define shared sales-marketing metrics',
      context: args,
      instructions: ['Define pipeline metrics', 'Establish conversion metrics', 'Create revenue attribution model', 'Design shared dashboard']
    },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'array' }, dashboardDesign: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'metrics']
}));

export const feedbackLoopDesignTask = defineTask('feedback-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feedback Loop Design',
  agent: {
    name: 'feedback-specialist',
    prompt: {
      role: 'Feedback loop designer',
      task: 'Design sales-marketing feedback loops',
      context: args,
      instructions: ['Design lead quality feedback', 'Create content feedback process', 'Establish win/loss sharing', 'Build continuous improvement loops']
    },
    outputSchema: { type: 'object', required: ['loops', 'artifacts'], properties: { loops: { type: 'array' }, processes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'feedback']
}));

export const communicationCadenceTask = defineTask('communication-cadence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Communication Cadence',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'Team communication planner',
      task: 'Design sales-marketing communication cadence',
      context: args,
      instructions: ['Plan regular meetings', 'Design reporting cadence', 'Create collaboration channels', 'Establish escalation paths']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, meetings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'communication']
}));

export const alignmentPlanCompilationTask = defineTask('alignment-plan-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Alignment Plan Compilation',
  agent: {
    name: 'alignment-planner',
    prompt: {
      role: 'Sales-marketing alignment program manager',
      task: 'Compile comprehensive alignment plan',
      context: args,
      instructions: ['Compile all elements', 'Create implementation roadmap', 'Define success criteria', 'Build governance model']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, roadmap: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'alignment-plan']
}));

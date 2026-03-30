/**
 * @process business-strategy/value-stream-mapping
 * @description End-to-end visualization and analysis of material and information flows required to deliver value to customers
 * @inputs { productFamily: string, processScope: object, organizationContext: object, outputDir: string }
 * @outputs { success: boolean, currentStateMap: object, futureStateMap: object, implementationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productFamily = '',
    processScope = {},
    organizationContext = {},
    outputDir = 'vsm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Value Stream Mapping Process');

  // Phase 1: Product Family Selection
  ctx.log('info', 'Phase 1: Selecting product family');
  const productFamilySelection = await ctx.task(productFamilySelectionTask, { productFamily, processScope, outputDir });
  artifacts.push(...productFamilySelection.artifacts);

  // Phase 2: Current State Map
  ctx.log('info', 'Phase 2: Creating current state map');
  const currentStateMap = await ctx.task(currentStateMapTask, { productFamily: productFamilySelection.selectedFamily, outputDir });
  artifacts.push(...currentStateMap.artifacts);

  // Phase 3: Timeline Analysis
  ctx.log('info', 'Phase 3: Analyzing timeline');
  const timelineAnalysis = await ctx.task(timelineAnalysisTask, { currentStateMap: currentStateMap.map, outputDir });
  artifacts.push(...timelineAnalysis.artifacts);

  // Phase 4: Lean Assessment
  ctx.log('info', 'Phase 4: Assessing lean metrics');
  const leanAssessment = await ctx.task(leanAssessmentTask, { currentStateMap: currentStateMap.map, timelineAnalysis, outputDir });
  artifacts.push(...leanAssessment.artifacts);

  // Phase 5: Future State Design
  ctx.log('info', 'Phase 5: Designing future state');
  const futureStateMap = await ctx.task(futureStateDesignTask, { currentStateMap: currentStateMap.map, leanAssessment, outputDir });
  artifacts.push(...futureStateMap.artifacts);

  // Phase 6: Implementation Plan
  ctx.log('info', 'Phase 6: Creating implementation plan');
  const implementationPlan = await ctx.task(vsmImplementationPlanTask, { currentStateMap: currentStateMap.map, futureStateMap: futureStateMap.map, outputDir });
  artifacts.push(...implementationPlan.artifacts);

  // Phase 7: Generate Report
  ctx.log('info', 'Phase 7: Generating VSM report');
  const vsmReport = await ctx.task(vsmReportTask, { productFamilySelection, currentStateMap, timelineAnalysis, leanAssessment, futureStateMap, implementationPlan, outputDir });
  artifacts.push(...vsmReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    currentStateMap: currentStateMap.map,
    futureStateMap: futureStateMap.map,
    metrics: {
      currentLeadTime: timelineAnalysis.totalLeadTime,
      futureLeadTime: futureStateMap.targetLeadTime,
      processEfficiency: leanAssessment.efficiency
    },
    implementationPlan: implementationPlan.plan,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/value-stream-mapping', timestamp: startTime }
  };
}

export const productFamilySelectionTask = defineTask('product-family-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select product family',
  agent: {
    name: 'vsm-analyst',
    prompt: {
      role: 'value stream analyst',
      task: 'Select product family for value stream mapping',
      context: args,
      instructions: ['Analyze product-process matrix', 'Identify high-volume/high-value families', 'Select representative product family', 'Save selection to output directory'],
      outputFormat: 'JSON with selectedFamily (object), selectionRationale (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['selectedFamily', 'artifacts'], properties: { selectedFamily: { type: 'object' }, selectionRationale: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'vsm', 'product-family']
}));

export const currentStateMapTask = defineTask('current-state-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create current state map',
  agent: {
    name: 'value-stream-mapper',
    prompt: {
      role: 'value stream mapping specialist',
      task: 'Create current state value stream map',
      context: args,
      instructions: ['Walk the process from customer to supplier', 'Document process steps with data boxes', 'Map information flows', 'Map material flows', 'Include inventory locations', 'Save map to output directory'],
      outputFormat: 'JSON with map (object), processSteps (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['map', 'artifacts'], properties: { map: { type: 'object' }, processSteps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'vsm', 'current-state']
}));

export const timelineAnalysisTask = defineTask('timeline-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze timeline',
  agent: {
    name: 'timeline-analyst',
    prompt: {
      role: 'process timeline analyst',
      task: 'Analyze value stream timeline',
      context: args,
      instructions: ['Calculate process time per step', 'Calculate lead time per step', 'Identify value-add vs non-value-add time', 'Calculate total lead time', 'Save analysis to output directory'],
      outputFormat: 'JSON with totalLeadTime (number), processTime (number), waitTime (number), timeline (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['totalLeadTime', 'artifacts'], properties: { totalLeadTime: { type: 'number' }, processTime: { type: 'number' }, waitTime: { type: 'number' }, timeline: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'vsm', 'timeline']
}));

export const leanAssessmentTask = defineTask('lean-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess lean metrics',
  agent: {
    name: 'lean-assessor',
    prompt: {
      role: 'lean assessment specialist',
      task: 'Assess lean metrics and identify improvements',
      context: args,
      instructions: ['Calculate process efficiency', 'Identify waste locations', 'Assess flow and pull', 'Identify kaizen bursts', 'Save assessment to output directory'],
      outputFormat: 'JSON with efficiency (number), wastes (array), kaizenBursts (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['efficiency', 'artifacts'], properties: { efficiency: { type: 'number' }, wastes: { type: 'array' }, kaizenBursts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'vsm', 'lean']
}));

export const futureStateDesignTask = defineTask('future-state-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design future state',
  agent: {
    name: 'future-state-designer',
    prompt: {
      role: 'future state value stream designer',
      task: 'Design future state value stream map',
      context: args,
      instructions: ['Apply lean principles to design', 'Implement flow and pull', 'Eliminate waste', 'Calculate target metrics', 'Save future state to output directory'],
      outputFormat: 'JSON with map (object), targetLeadTime (number), improvements (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['map', 'targetLeadTime', 'artifacts'], properties: { map: { type: 'object' }, targetLeadTime: { type: 'number' }, improvements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'vsm', 'future-state']
}));

export const vsmImplementationPlanTask = defineTask('vsm-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'VSM implementation planner',
      task: 'Create plan to achieve future state',
      context: args,
      instructions: ['Define implementation loops', 'Create kaizen event schedule', 'Define metrics tracking', 'Save plan to output directory'],
      outputFormat: 'JSON with plan (object), loops (array), schedule (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, loops: { type: 'array' }, schedule: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'vsm', 'implementation']
}));

export const vsmReportTask = defineTask('vsm-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate VSM report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VSM consultant and technical writer',
      task: 'Generate comprehensive VSM report',
      context: args,
      instructions: ['Create executive summary', 'Include current and future state maps', 'Document improvements', 'Include implementation plan', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'vsm', 'reporting']
}));

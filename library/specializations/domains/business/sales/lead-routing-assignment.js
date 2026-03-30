/**
 * @process sales/lead-routing-assignment
 * @description Automated lead routing and assignment process with territory rules, round-robin distribution, and rep capacity balancing.
 * @inputs { leads: array, routingRules: object, territories: array, repCapacity?: object, priorityConfig?: object }
 * @outputs { success: boolean, assignments: array, routingMetrics: object, exceptions: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/lead-routing-assignment', {
 *   leads: [{ id: 'L001', company: 'Acme', industry: 'Tech', region: 'West' }],
 *   routingRules: { byRegion: true, byIndustry: true, roundRobin: true },
 *   territories: [{ id: 'T1', rep: 'Rep1', regions: ['West'] }]
 * });
 *
 * @references
 * - LeanData Lead Routing: https://www.leandata.com/
 * - Chili Piper Routing: https://www.chilipiper.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    leads = [],
    routingRules = {},
    territories = [],
    repCapacity = {},
    priorityConfig = {},
    outputDir = 'lead-routing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Lead Routing for ${leads.length} leads`);

  // Phase 1: Lead Data Enrichment
  const leadEnrichment = await ctx.task(leadEnrichmentTask, { leads, outputDir });
  artifacts.push(...(leadEnrichment.artifacts || []));

  // Phase 2: Lead Scoring and Prioritization
  const leadScoring = await ctx.task(leadScoringTask, { leads: leadEnrichment.enrichedLeads, priorityConfig, outputDir });
  artifacts.push(...(leadScoring.artifacts || []));

  // Phase 3: Territory Matching
  const territoryMatching = await ctx.task(territoryMatchingTask, { leads: leadScoring.scoredLeads, territories, routingRules, outputDir });
  artifacts.push(...(territoryMatching.artifacts || []));

  // Phase 4: Rep Capacity Analysis
  const capacityAnalysis = await ctx.task(repCapacityAnalysisTask, { territories, repCapacity, leadCount: leads.length, outputDir });
  artifacts.push(...(capacityAnalysis.artifacts || []));

  // Phase 5: Assignment Optimization
  const assignmentOptimization = await ctx.task(assignmentOptimizationTask, {
    territoryMatching, capacityAnalysis, routingRules, outputDir
  });
  artifacts.push(...(assignmentOptimization.artifacts || []));

  // Phase 6: Exception Handling
  const exceptionHandling = await ctx.task(exceptionHandlingTask, { assignmentOptimization, outputDir });
  artifacts.push(...(exceptionHandling.artifacts || []));

  // Phase 7: Routing Metrics Calculation
  const routingMetrics = await ctx.task(routingMetricsTask, { assignmentOptimization, exceptionHandling, outputDir });
  artifacts.push(...(routingMetrics.artifacts || []));

  // Phase 8: Assignment Report Generation
  const assignmentReport = await ctx.task(assignmentReportTask, {
    assignmentOptimization, exceptionHandling, routingMetrics, outputDir
  });
  artifacts.push(...(assignmentReport.artifacts || []));

  await ctx.breakpoint({
    question: `Lead routing complete. ${assignmentOptimization.assignments?.length || 0} leads assigned. ${exceptionHandling.exceptions?.length || 0} exceptions. Review?`,
    title: 'Lead Routing Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    leadsProcessed: leads.length,
    assignments: assignmentOptimization.assignments,
    routingMetrics: routingMetrics.metrics,
    exceptions: exceptionHandling.exceptions,
    recommendations: assignmentReport.recommendations,
    artifacts,
    metadata: { processId: 'sales/lead-routing-assignment', timestamp: startTime }
  };
}

export const leadEnrichmentTask = defineTask('lead-enrichment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Lead Data Enrichment',
  agent: {
    name: 'data-enrichment-specialist',
    prompt: {
      role: 'Lead data enrichment specialist',
      task: 'Enrich lead data for routing decisions',
      context: args,
      instructions: ['Validate lead data', 'Enrich company information', 'Identify firmographics', 'Flag data quality issues']
    },
    outputSchema: { type: 'object', required: ['enrichedLeads', 'artifacts'], properties: { enrichedLeads: { type: 'array' }, dataQuality: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'lead-enrichment']
}));

export const leadScoringTask = defineTask('lead-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Lead Scoring and Prioritization',
  agent: {
    name: 'lead-scoring-specialist',
    prompt: {
      role: 'Lead scoring specialist',
      task: 'Score and prioritize leads',
      context: args,
      instructions: ['Apply scoring model', 'Calculate fit scores', 'Determine intent signals', 'Assign priority tiers']
    },
    outputSchema: { type: 'object', required: ['scoredLeads', 'artifacts'], properties: { scoredLeads: { type: 'array' }, scoringMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'lead-scoring']
}));

export const territoryMatchingTask = defineTask('territory-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Territory Matching',
  agent: {
    name: 'territory-specialist',
    prompt: {
      role: 'Territory matching specialist',
      task: 'Match leads to territories',
      context: args,
      instructions: ['Apply territory rules', 'Match by geography', 'Match by industry', 'Handle overlaps']
    },
    outputSchema: { type: 'object', required: ['matchedLeads', 'artifacts'], properties: { matchedLeads: { type: 'array' }, matchingStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'territory-matching']
}));

export const repCapacityAnalysisTask = defineTask('rep-capacity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rep Capacity Analysis',
  agent: {
    name: 'capacity-analyst',
    prompt: {
      role: 'Sales capacity analyst',
      task: 'Analyze rep capacity for lead assignment',
      context: args,
      instructions: ['Calculate current workload', 'Assess capacity limits', 'Identify availability', 'Balance distribution']
    },
    outputSchema: { type: 'object', required: ['capacityAnalysis', 'artifacts'], properties: { capacityAnalysis: { type: 'object' }, repAvailability: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'capacity']
}));

export const assignmentOptimizationTask = defineTask('assignment-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assignment Optimization',
  agent: {
    name: 'assignment-optimizer',
    prompt: {
      role: 'Lead assignment optimizer',
      task: 'Optimize lead-to-rep assignments',
      context: args,
      instructions: ['Apply routing rules', 'Balance workload', 'Optimize for speed', 'Maximize rep-lead fit']
    },
    outputSchema: { type: 'object', required: ['assignments', 'artifacts'], properties: { assignments: { type: 'array' }, optimizationMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'assignment']
}));

export const exceptionHandlingTask = defineTask('exception-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Exception Handling',
  agent: {
    name: 'exception-handler',
    prompt: {
      role: 'Routing exception handler',
      task: 'Handle routing exceptions',
      context: args,
      instructions: ['Identify unassigned leads', 'Handle rule conflicts', 'Escalate complex cases', 'Document exceptions']
    },
    outputSchema: { type: 'object', required: ['exceptions', 'artifacts'], properties: { exceptions: { type: 'array' }, resolutions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'exceptions']
}));

export const routingMetricsTask = defineTask('routing-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Routing Metrics Calculation',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'Routing metrics analyst',
      task: 'Calculate routing performance metrics',
      context: args,
      instructions: ['Calculate assignment speed', 'Measure distribution balance', 'Track exception rate', 'Assess routing accuracy']
    },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'object' }, trends: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'metrics']
}));

export const assignmentReportTask = defineTask('assignment-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assignment Report Generation',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'Assignment report specialist',
      task: 'Generate lead assignment report',
      context: args,
      instructions: ['Compile assignment summary', 'Document exceptions', 'Provide recommendations', 'Create distribution report']
    },
    outputSchema: { type: 'object', required: ['report', 'recommendations', 'artifacts'], properties: { report: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'reporting']
}));

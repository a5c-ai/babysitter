/**
 * @process domains/business/knowledge-management/knowledge-network-mapping
 * @description Map informal knowledge networks, identify key connectors and knowledge brokers, and analyze knowledge flow patterns
 * @specialization Knowledge Management
 * @category Expertise Location and Mapping
 * @inputs { organizationalScope: object, networkTypes: array, dataSourcess: array, outputDir: string }
 * @outputs { success: boolean, networkMap: object, keyConnectors: array, flowPatterns: object, recommendations: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationalScope = {},
    networkTypes = ['expertise', 'collaboration', 'information-flow'],
    dataSources = [],
    analysisDepth = 'comprehensive',
    outputDir = 'network-mapping-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Network Mapping and Analysis Process');

  // Phase 1: Data Collection Planning
  ctx.log('info', 'Phase 1: Planning data collection');
  const dataCollectionPlan = await ctx.task(dataCollectionPlanningTask, { organizationalScope, networkTypes, dataSources, outputDir });
  artifacts.push(...dataCollectionPlan.artifacts);

  await ctx.breakpoint({
    question: `Data collection plan ready with ${dataCollectionPlan.methods.length} methods. Proceed?`,
    title: 'Data Collection Plan Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { methods: dataCollectionPlan.methods.length } }
  });

  // Phase 2: Network Data Gathering
  ctx.log('info', 'Phase 2: Gathering network data');
  const networkData = await ctx.task(networkDataGatheringTask, { dataCollectionPlan: dataCollectionPlan.plan, dataSources, outputDir });
  artifacts.push(...networkData.artifacts);

  // Phase 3: Network Visualization
  ctx.log('info', 'Phase 3: Creating network visualization');
  const networkVisualization = await ctx.task(networkVisualizationTask, { networkData: networkData.data, networkTypes, outputDir });
  artifacts.push(...networkVisualization.artifacts);

  // Phase 4: Centrality Analysis
  ctx.log('info', 'Phase 4: Analyzing network centrality');
  const centralityAnalysis = await ctx.task(centralityAnalysisTask, { networkData: networkData.data, outputDir });
  artifacts.push(...centralityAnalysis.artifacts);

  // Phase 5: Connector Identification
  ctx.log('info', 'Phase 5: Identifying key connectors');
  const connectorIdentification = await ctx.task(connectorIdentificationTask, { centralityAnalysis, networkData: networkData.data, outputDir });
  artifacts.push(...connectorIdentification.artifacts);

  // Phase 6: Knowledge Broker Analysis
  ctx.log('info', 'Phase 6: Analyzing knowledge brokers');
  const knowledgeBrokerAnalysis = await ctx.task(knowledgeBrokerAnalysisTask, { centralityAnalysis, connectorIdentification, outputDir });
  artifacts.push(...knowledgeBrokerAnalysis.artifacts);

  // Phase 7: Flow Pattern Analysis
  ctx.log('info', 'Phase 7: Analyzing knowledge flow patterns');
  const flowPatternAnalysis = await ctx.task(flowPatternAnalysisTask, { networkData: networkData.data, centralityAnalysis, outputDir });
  artifacts.push(...flowPatternAnalysis.artifacts);

  // Phase 8: Gap and Opportunity Analysis
  ctx.log('info', 'Phase 8: Identifying gaps and opportunities');
  const gapAnalysis = await ctx.task(gapAnalysisTask, { networkVisualization, flowPatternAnalysis, outputDir });
  artifacts.push(...gapAnalysis.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing analysis quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { networkData, centralityAnalysis, connectorIdentification, flowPatternAnalysis, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { networkMap: networkVisualization.map, keyConnectors: connectorIdentification.connectors, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    networkMap: networkVisualization.map,
    keyConnectors: connectorIdentification.connectors,
    knowledgeBrokers: knowledgeBrokerAnalysis.brokers,
    flowPatterns: flowPatternAnalysis.patterns,
    gaps: gapAnalysis.gaps,
    recommendations: gapAnalysis.recommendations,
    statistics: { nodesAnalyzed: networkData.nodeCount, connectorsIdentified: connectorIdentification.connectors.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/knowledge-network-mapping', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const dataCollectionPlanningTask = defineTask('data-collection-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan data collection',
  agent: {
    name: 'data-collection-planner',
    prompt: { role: 'network analysis planner', task: 'Plan network data collection', context: args, instructions: ['Define data sources and methods', 'Plan survey and interview approach', 'Save to output directory'], outputFormat: 'JSON with plan (object), methods (array), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'methods', 'artifacts'], properties: { plan: { type: 'object' }, methods: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'data-collection', 'planning']
}));

export const networkDataGatheringTask = defineTask('network-data-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather network data',
  agent: {
    name: 'data-gatherer',
    prompt: { role: 'network data specialist', task: 'Gather network relationship data', context: args, instructions: ['Collect relationship data', 'Structure for analysis', 'Save to output directory'], outputFormat: 'JSON with data (object), nodeCount (number), artifacts' },
    outputSchema: { type: 'object', required: ['data', 'nodeCount', 'artifacts'], properties: { data: { type: 'object' }, nodeCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'data', 'gathering']
}));

export const networkVisualizationTask = defineTask('network-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create network visualization',
  agent: {
    name: 'network-visualizer',
    prompt: { role: 'network visualization specialist', task: 'Create network map visualization', context: args, instructions: ['Generate network diagrams', 'Color code by network type', 'Save to output directory'], outputFormat: 'JSON with map (object), artifacts' },
    outputSchema: { type: 'object', required: ['map', 'artifacts'], properties: { map: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'network', 'visualization']
}));

export const centralityAnalysisTask = defineTask('centrality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze network centrality',
  agent: {
    name: 'centrality-analyst',
    prompt: { role: 'network centrality analyst', task: 'Analyze network centrality metrics', context: args, instructions: ['Calculate degree, betweenness, closeness centrality', 'Identify central nodes', 'Save to output directory'], outputFormat: 'JSON with metrics (object), centralNodes (array), artifacts' },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'object' }, centralNodes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'centrality', 'analysis']
}));

export const connectorIdentificationTask = defineTask('connector-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify key connectors',
  agent: {
    name: 'connector-identifier',
    prompt: { role: 'network connector specialist', task: 'Identify key connectors and hubs', context: args, instructions: ['Find bridge nodes between groups', 'Identify knowledge hubs', 'Save to output directory'], outputFormat: 'JSON with connectors (array), artifacts' },
    outputSchema: { type: 'object', required: ['connectors', 'artifacts'], properties: { connectors: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'connector', 'identification']
}));

export const knowledgeBrokerAnalysisTask = defineTask('knowledge-broker-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge brokers',
  agent: {
    name: 'broker-analyst',
    prompt: { role: 'knowledge broker analyst', task: 'Analyze knowledge broker roles', context: args, instructions: ['Identify boundary spanners', 'Assess broker influence', 'Save to output directory'], outputFormat: 'JSON with brokers (array), analysis (object), artifacts' },
    outputSchema: { type: 'object', required: ['brokers', 'artifacts'], properties: { brokers: { type: 'array' }, analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'broker', 'analysis']
}));

export const flowPatternAnalysisTask = defineTask('flow-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge flow patterns',
  agent: {
    name: 'flow-analyst',
    prompt: { role: 'knowledge flow analyst', task: 'Analyze knowledge flow patterns', context: args, instructions: ['Map information pathways', 'Identify bottlenecks', 'Save to output directory'], outputFormat: 'JSON with patterns (object), bottlenecks (array), artifacts' },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'object' }, bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'flow', 'analysis']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify gaps and opportunities',
  agent: {
    name: 'gap-analyst',
    prompt: { role: 'network gap analyst', task: 'Identify network gaps and opportunities', context: args, instructions: ['Find disconnected groups', 'Identify improvement opportunities', 'Save to output directory'], outputFormat: 'JSON with gaps (array), recommendations (array), artifacts' },
    outputSchema: { type: 'object', required: ['gaps', 'recommendations', 'artifacts'], properties: { gaps: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'gap', 'analysis']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess analysis quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess network analysis quality', context: args, instructions: ['Evaluate data completeness', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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

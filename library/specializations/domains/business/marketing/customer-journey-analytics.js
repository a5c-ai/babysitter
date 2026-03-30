/**
 * @process marketing/customer-journey-analytics
 * @description Map and measure customer touchpoints across channels, identify drop-off points, and optimize conversion funnels through data analysis.
 * @inputs { touchpointData: object, conversionData: object, channelData: object, segments: array }
 * @outputs { success: boolean, journeyMaps: array, funnelAnalysis: object, dropOffAnalysis: object, optimizationRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    touchpointData = {},
    conversionData = {},
    channelData = {},
    segments = [],
    outputDir = 'journey-analytics-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Customer Journey Analytics');

  const touchpointMapping = await ctx.task(touchpointMappingTask, { touchpointData, channelData, outputDir });
  artifacts.push(...touchpointMapping.artifacts);

  const journeyPathAnalysis = await ctx.task(journeyPathAnalysisTaskJA, { touchpointMapping, conversionData, outputDir });
  artifacts.push(...journeyPathAnalysis.artifacts);

  const funnelAnalysis = await ctx.task(funnelAnalysisTask, { journeyPathAnalysis, conversionData, outputDir });
  artifacts.push(...funnelAnalysis.artifacts);

  const dropOffAnalysis = await ctx.task(dropOffAnalysisTask, { funnelAnalysis, journeyPathAnalysis, outputDir });
  artifacts.push(...dropOffAnalysis.artifacts);

  const segmentJourneyAnalysis = await ctx.task(segmentJourneyAnalysisTask, { journeyPathAnalysis, segments, outputDir });
  artifacts.push(...segmentJourneyAnalysis.artifacts);

  const channelInfluenceAnalysis = await ctx.task(channelInfluenceAnalysisTask, { journeyPathAnalysis, channelData, outputDir });
  artifacts.push(...channelInfluenceAnalysis.artifacts);

  const frictionPointAnalysis = await ctx.task(frictionPointAnalysisTask, { dropOffAnalysis, touchpointMapping, outputDir });
  artifacts.push(...frictionPointAnalysis.artifacts);

  const optimizationRecommendations = await ctx.task(journeyOptimizationTask, { dropOffAnalysis, frictionPointAnalysis, funnelAnalysis, outputDir });
  artifacts.push(...optimizationRecommendations.artifacts);

  const journeyVisualization = await ctx.task(journeyVisualizationTask, { journeyPathAnalysis, funnelAnalysis, dropOffAnalysis, outputDir });
  artifacts.push(...journeyVisualization.artifacts);

  const qualityAssessment = await ctx.task(journeyAnalyticsQualityTask, { touchpointMapping, funnelAnalysis, dropOffAnalysis, optimizationRecommendations, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const analyticsScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Journey analytics complete. Quality score: ${analyticsScore}/100. Review and approve?`,
    title: 'Journey Analytics Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    analyticsScore,
    journeyMaps: journeyPathAnalysis.journeyMaps,
    funnelAnalysis: funnelAnalysis.analysis,
    dropOffAnalysis: dropOffAnalysis.analysis,
    frictionPoints: frictionPointAnalysis.frictionPoints,
    channelInfluence: channelInfluenceAnalysis.influence,
    segmentJourneys: segmentJourneyAnalysis.journeys,
    optimizationRecommendations: optimizationRecommendations.recommendations,
    visualizations: journeyVisualization.visualizations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/customer-journey-analytics', timestamp: startTime, outputDir }
  };
}

export const touchpointMappingTask = defineTask('touchpoint-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map customer touchpoints',
  agent: {
    name: 'touchpoint-mapper',
    prompt: {
      role: 'Customer experience analyst',
      task: 'Map all customer touchpoints across channels',
      context: args,
      instructions: ['Identify all touchpoints', 'Categorize by channel', 'Map touchpoint sequence', 'Identify key moments', 'Document touchpoint data']
    },
    outputSchema: { type: 'object', required: ['touchpoints', 'mapping', 'artifacts'], properties: { touchpoints: { type: 'array' }, mapping: { type: 'object' }, channels: { type: 'array' }, keyMoments: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'touchpoints']
}));

export const journeyPathAnalysisTaskJA = defineTask('journey-path-analysis-ja', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze journey paths',
  agent: {
    name: 'journey-analyst',
    prompt: {
      role: 'Customer journey analyst',
      task: 'Analyze customer journey paths and patterns',
      context: args,
      instructions: ['Identify common paths', 'Analyze path length', 'Calculate path frequencies', 'Identify successful paths', 'Map path variations']
    },
    outputSchema: { type: 'object', required: ['journeyMaps', 'paths', 'artifacts'], properties: { journeyMaps: { type: 'array' }, paths: { type: 'array' }, pathLength: { type: 'object' }, successfulPaths: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'paths']
}));

export const funnelAnalysisTask = defineTask('funnel-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze conversion funnel',
  agent: {
    name: 'funnel-analyst',
    prompt: {
      role: 'Conversion funnel analyst',
      task: 'Analyze customer conversion funnel',
      context: args,
      instructions: ['Define funnel stages', 'Calculate stage conversions', 'Analyze funnel velocity', 'Compare funnel variations', 'Identify bottlenecks']
    },
    outputSchema: { type: 'object', required: ['analysis', 'stages', 'artifacts'], properties: { analysis: { type: 'object' }, stages: { type: 'array' }, conversionRates: { type: 'object' }, velocity: { type: 'object' }, bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'funnel']
}));

export const dropOffAnalysisTask = defineTask('drop-off-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze drop-off points',
  agent: {
    name: 'drop-off-analyst',
    prompt: {
      role: 'Funnel optimization specialist',
      task: 'Identify and analyze drop-off points',
      context: args,
      instructions: ['Identify drop-off points', 'Calculate drop-off rates', 'Analyze drop-off causes', 'Quantify lost value', 'Prioritize by impact']
    },
    outputSchema: { type: 'object', required: ['analysis', 'dropOffs', 'artifacts'], properties: { analysis: { type: 'object' }, dropOffs: { type: 'array' }, rates: { type: 'object' }, causes: { type: 'array' }, lostValue: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'drop-off']
}));

export const segmentJourneyAnalysisTask = defineTask('segment-journey-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze journeys by segment',
  agent: {
    name: 'segment-journey-analyst',
    prompt: {
      role: 'Segment analytics specialist',
      task: 'Analyze customer journeys by segment',
      context: args,
      instructions: ['Compare segment journeys', 'Identify segment patterns', 'Analyze segment conversion', 'Find segment opportunities', 'Document segment insights']
    },
    outputSchema: { type: 'object', required: ['journeys', 'comparison', 'artifacts'], properties: { journeys: { type: 'array' }, comparison: { type: 'object' }, patterns: { type: 'array' }, opportunities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'segments']
}));

export const channelInfluenceAnalysisTask = defineTask('channel-influence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze channel influence',
  agent: {
    name: 'channel-influence-analyst',
    prompt: {
      role: 'Channel analytics specialist',
      task: 'Analyze channel influence on customer journey',
      context: args,
      instructions: ['Map channel touchpoints', 'Calculate channel influence', 'Identify channel synergies', 'Analyze channel sequence', 'Document findings']
    },
    outputSchema: { type: 'object', required: ['influence', 'channels', 'artifacts'], properties: { influence: { type: 'object' }, channels: { type: 'array' }, synergies: { type: 'array' }, sequences: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'channel-influence']
}));

export const frictionPointAnalysisTask = defineTask('friction-point-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze friction points',
  agent: {
    name: 'friction-analyst',
    prompt: {
      role: 'Customer experience optimization specialist',
      task: 'Identify and analyze journey friction points',
      context: args,
      instructions: ['Identify friction signals', 'Map friction to touchpoints', 'Quantify friction impact', 'Categorize friction types', 'Prioritize friction fixes']
    },
    outputSchema: { type: 'object', required: ['frictionPoints', 'impact', 'artifacts'], properties: { frictionPoints: { type: 'array' }, impact: { type: 'object' }, categories: { type: 'object' }, priorities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'friction']
}));

export const journeyOptimizationTask = defineTask('journey-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop optimization recommendations',
  agent: {
    name: 'journey-optimizer',
    prompt: {
      role: 'Journey optimization strategist',
      task: 'Develop journey optimization recommendations',
      context: args,
      instructions: ['Prioritize opportunities', 'Develop recommendations', 'Estimate impact', 'Plan implementation', 'Create roadmap']
    },
    outputSchema: { type: 'object', required: ['recommendations', 'roadmap', 'artifacts'], properties: { recommendations: { type: 'array' }, roadmap: { type: 'object' }, impact: { type: 'object' }, quickWins: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'optimization']
}));

export const journeyVisualizationTask = defineTask('journey-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create journey visualizations',
  agent: {
    name: 'journey-visualizer',
    prompt: {
      role: 'Data visualization specialist',
      task: 'Create customer journey visualizations',
      context: args,
      instructions: ['Create journey maps', 'Build funnel visualizations', 'Design Sankey diagrams', 'Create touchpoint heatmaps', 'Generate reports']
    },
    outputSchema: { type: 'object', required: ['visualizations', 'reports', 'artifacts'], properties: { visualizations: { type: 'array' }, reports: { type: 'array' }, specs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'visualization']
}));

export const journeyAnalyticsQualityTask = defineTask('journey-analytics-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess analytics quality',
  agent: {
    name: 'analytics-validator',
    prompt: {
      role: 'Customer analytics director',
      task: 'Assess overall journey analytics quality',
      context: args,
      instructions: ['Evaluate data coverage', 'Assess analysis depth', 'Review recommendations', 'Assess actionability', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'journey-analytics', 'quality-assessment']
}));

/**
 * @process marketing/marketing-roi-analysis
 * @description Calculate return on investment by channel and campaign. Build marketing mix models to optimize budget allocation across the portfolio.
 * @inputs { campaignData: object, channelSpend: object, revenueData: object, benchmarks: object }
 * @outputs { success: boolean, roiAnalysis: object, marketingMixModel: object, budgetOptimization: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignData = {},
    channelSpend = {},
    revenueData = {},
    benchmarks = {},
    outputDir = 'marketing-roi-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Marketing ROI Analysis');

  const dataConsolidation = await ctx.task(roiDataConsolidationTask, { campaignData, channelSpend, revenueData, outputDir });
  artifacts.push(...dataConsolidation.artifacts);

  const channelRoiAnalysis = await ctx.task(channelRoiAnalysisTask, { dataConsolidation, benchmarks, outputDir });
  artifacts.push(...channelRoiAnalysis.artifacts);

  const campaignRoiAnalysis = await ctx.task(campaignRoiAnalysisTask, { dataConsolidation, benchmarks, outputDir });
  artifacts.push(...campaignRoiAnalysis.artifacts);

  const costMetricsAnalysis = await ctx.task(costMetricsAnalysisTask, { dataConsolidation, channelRoiAnalysis, outputDir });
  artifacts.push(...costMetricsAnalysis.artifacts);

  const marketingMixModel = await ctx.task(marketingMixModelTask, { dataConsolidation, channelRoiAnalysis, outputDir });
  artifacts.push(...marketingMixModel.artifacts);

  const budgetOptimization = await ctx.task(budgetOptimizationTask, { marketingMixModel, channelRoiAnalysis, channelSpend, outputDir });
  artifacts.push(...budgetOptimization.artifacts);

  const incrementalityAnalysis = await ctx.task(incrementalityAnalysisTask, { dataConsolidation, marketingMixModel, outputDir });
  artifacts.push(...incrementalityAnalysis.artifacts);

  const roiForecasting = await ctx.task(roiForecastingTask, { channelRoiAnalysis, marketingMixModel, budgetOptimization, outputDir });
  artifacts.push(...roiForecasting.artifacts);

  const qualityAssessment = await ctx.task(roiAnalysisQualityTask, { channelRoiAnalysis, marketingMixModel, budgetOptimization, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const analysisScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `ROI analysis complete. Quality score: ${analysisScore}/100. Review and approve?`,
    title: 'Marketing ROI Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    analysisScore,
    roiAnalysis: { byChannel: channelRoiAnalysis.analysis, byCampaign: campaignRoiAnalysis.analysis, costMetrics: costMetricsAnalysis.metrics },
    marketingMixModel: marketingMixModel.model,
    budgetOptimization: budgetOptimization.optimization,
    incrementality: incrementalityAnalysis.analysis,
    forecasts: roiForecasting.forecasts,
    recommendations: budgetOptimization.recommendations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/marketing-roi-analysis', timestamp: startTime, outputDir }
  };
}

export const roiDataConsolidationTask = defineTask('roi-data-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consolidate ROI data',
  agent: {
    name: 'data-consolidator',
    prompt: {
      role: 'Marketing finance analyst',
      task: 'Consolidate marketing spend and revenue data',
      context: args,
      instructions: ['Consolidate spend data', 'Align revenue data', 'Normalize time periods', 'Handle data gaps', 'Validate data quality']
    },
    outputSchema: { type: 'object', required: ['data', 'quality', 'artifacts'], properties: { data: { type: 'object' }, quality: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'data']
}));

export const channelRoiAnalysisTask = defineTask('channel-roi-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze channel ROI',
  agent: {
    name: 'channel-roi-analyst',
    prompt: {
      role: 'Marketing ROI analyst',
      task: 'Calculate and analyze ROI by channel',
      context: args,
      instructions: ['Calculate channel ROI', 'Calculate ROAS', 'Compare to benchmarks', 'Identify top performers', 'Identify underperformers']
    },
    outputSchema: { type: 'object', required: ['analysis', 'roi', 'artifacts'], properties: { analysis: { type: 'object' }, roi: { type: 'object' }, roas: { type: 'object' }, benchmarkComparison: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'channel-roi']
}));

export const campaignRoiAnalysisTask = defineTask('campaign-roi-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze campaign ROI',
  agent: {
    name: 'campaign-roi-analyst',
    prompt: {
      role: 'Campaign performance analyst',
      task: 'Calculate and analyze ROI by campaign',
      context: args,
      instructions: ['Calculate campaign ROI', 'Analyze by campaign type', 'Compare campaign performance', 'Identify best practices', 'Document learnings']
    },
    outputSchema: { type: 'object', required: ['analysis', 'campaigns', 'artifacts'], properties: { analysis: { type: 'object' }, campaigns: { type: 'array' }, topPerformers: { type: 'array' }, learnings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'campaign-roi']
}));

export const costMetricsAnalysisTask = defineTask('cost-metrics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cost metrics',
  agent: {
    name: 'cost-analyst',
    prompt: {
      role: 'Marketing cost analyst',
      task: 'Analyze marketing cost efficiency metrics',
      context: args,
      instructions: ['Calculate CAC', 'Calculate CPL', 'Analyze cost trends', 'Compare to LTV', 'Identify efficiency opportunities']
    },
    outputSchema: { type: 'object', required: ['metrics', 'efficiency', 'artifacts'], properties: { metrics: { type: 'object' }, efficiency: { type: 'object' }, trends: { type: 'object' }, opportunities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'cost-metrics']
}));

export const marketingMixModelTask = defineTask('marketing-mix-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build marketing mix model',
  agent: {
    name: 'mmm-analyst',
    prompt: {
      role: 'Marketing mix modeling specialist',
      task: 'Build marketing mix model to understand channel contribution',
      context: args,
      instructions: ['Define model variables', 'Build regression model', 'Analyze channel contribution', 'Assess saturation effects', 'Validate model accuracy']
    },
    outputSchema: { type: 'object', required: ['model', 'contribution', 'artifacts'], properties: { model: { type: 'object' }, contribution: { type: 'object' }, saturation: { type: 'object' }, validation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'mmm']
}));

export const budgetOptimizationTask = defineTask('budget-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize budget allocation',
  agent: {
    name: 'budget-optimizer',
    prompt: {
      role: 'Marketing budget optimization specialist',
      task: 'Optimize budget allocation across channels',
      context: args,
      instructions: ['Apply optimization algorithm', 'Model budget scenarios', 'Calculate optimal allocation', 'Assess risk/return trade-offs', 'Create recommendations']
    },
    outputSchema: { type: 'object', required: ['optimization', 'recommendations', 'artifacts'], properties: { optimization: { type: 'object' }, recommendations: { type: 'array' }, scenarios: { type: 'array' }, expectedImpact: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'optimization']
}));

export const incrementalityAnalysisTask = defineTask('incrementality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze incrementality',
  agent: {
    name: 'incrementality-analyst',
    prompt: {
      role: 'Marketing measurement specialist',
      task: 'Analyze incremental impact of marketing activities',
      context: args,
      instructions: ['Identify baseline', 'Calculate incremental lift', 'Assess channel incrementality', 'Identify cannibalization', 'Document findings']
    },
    outputSchema: { type: 'object', required: ['analysis', 'incrementalLift', 'artifacts'], properties: { analysis: { type: 'object' }, incrementalLift: { type: 'object' }, baseline: { type: 'object' }, cannibalization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'incrementality']
}));

export const roiForecastingTask = defineTask('roi-forecasting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast ROI',
  agent: {
    name: 'roi-forecaster',
    prompt: {
      role: 'Marketing forecasting analyst',
      task: 'Forecast future marketing ROI',
      context: args,
      instructions: ['Build forecast models', 'Project channel ROI', 'Model scenario impacts', 'Assess forecast confidence', 'Create forecast report']
    },
    outputSchema: { type: 'object', required: ['forecasts', 'scenarios', 'artifacts'], properties: { forecasts: { type: 'object' }, scenarios: { type: 'array' }, confidence: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'forecasting']
}));

export const roiAnalysisQualityTask = defineTask('roi-analysis-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess analysis quality',
  agent: {
    name: 'roi-validator',
    prompt: {
      role: 'Marketing finance director',
      task: 'Assess overall ROI analysis quality',
      context: args,
      instructions: ['Evaluate data quality', 'Assess model validity', 'Review optimization', 'Assess actionability', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'roi-analysis', 'quality-assessment']
}));

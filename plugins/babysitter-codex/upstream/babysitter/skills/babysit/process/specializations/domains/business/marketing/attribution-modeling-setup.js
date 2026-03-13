/**
 * @process marketing/attribution-modeling-setup
 * @description Implement multi-touch attribution to understand channel contribution to conversions. Compare first-touch, last-touch, and data-driven models.
 * @inputs { channelData: object, conversionData: object, customerJourney: object, existingAttribution: object }
 * @outputs { success: boolean, attributionModel: object, modelComparison: object, channelContribution: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    channelData = {},
    conversionData = {},
    customerJourney = {},
    existingAttribution = {},
    outputDir = 'attribution-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Attribution Modeling Setup');

  const dataAssessment = await ctx.task(attributionDataAssessmentTask, { channelData, conversionData, customerJourney, outputDir });
  artifacts.push(...dataAssessment.artifacts);

  const journeyAnalysis = await ctx.task(journeyPathAnalysisTask, { customerJourney, dataAssessment, outputDir });
  artifacts.push(...journeyAnalysis.artifacts);

  const firstTouchModel = await ctx.task(firstTouchModelTask, { journeyAnalysis, conversionData, outputDir });
  artifacts.push(...firstTouchModel.artifacts);

  const lastTouchModel = await ctx.task(lastTouchModelTask, { journeyAnalysis, conversionData, outputDir });
  artifacts.push(...lastTouchModel.artifacts);

  const linearModel = await ctx.task(linearAttributionModelTask, { journeyAnalysis, conversionData, outputDir });
  artifacts.push(...linearModel.artifacts);

  const positionBasedModel = await ctx.task(positionBasedModelTask, { journeyAnalysis, conversionData, outputDir });
  artifacts.push(...positionBasedModel.artifacts);

  const dataDrivenModel = await ctx.task(dataDrivenModelTask, { journeyAnalysis, conversionData, channelData, outputDir });
  artifacts.push(...dataDrivenModel.artifacts);

  const modelComparison = await ctx.task(modelComparisonTask, { firstTouchModel, lastTouchModel, linearModel, positionBasedModel, dataDrivenModel, outputDir });
  artifacts.push(...modelComparison.artifacts);

  const implementationPlan = await ctx.task(attributionImplementationTask, { modelComparison, existingAttribution, outputDir });
  artifacts.push(...implementationPlan.artifacts);

  const qualityAssessment = await ctx.task(attributionQualityTask, { dataAssessment, modelComparison, implementationPlan, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const attributionScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Attribution setup complete. Quality score: ${attributionScore}/100. Review and approve?`,
    title: 'Attribution Modeling Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    attributionScore,
    attributionModel: dataDrivenModel.model,
    modelComparison: modelComparison.comparison,
    channelContribution: modelComparison.channelContribution,
    recommendations: implementationPlan.recommendations,
    implementationPlan: implementationPlan.plan,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/attribution-modeling-setup', timestamp: startTime, outputDir }
  };
}

export const attributionDataAssessmentTask = defineTask('attribution-data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess attribution data',
  agent: {
    name: 'data-assessor',
    prompt: {
      role: 'Marketing analytics data specialist',
      task: 'Assess data readiness for attribution modeling',
      context: args,
      instructions: ['Audit available data sources', 'Assess data quality', 'Identify tracking gaps', 'Evaluate cross-device tracking', 'Document data limitations']
    },
    outputSchema: { type: 'object', required: ['assessment', 'quality', 'artifacts'], properties: { assessment: { type: 'object' }, quality: { type: 'object' }, gaps: { type: 'array' }, limitations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'data-assessment']
}));

export const journeyPathAnalysisTask = defineTask('journey-path-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze customer journey paths',
  agent: {
    name: 'journey-analyst',
    prompt: {
      role: 'Customer journey analyst',
      task: 'Analyze customer journey paths and touchpoints',
      context: args,
      instructions: ['Map conversion paths', 'Identify common journeys', 'Analyze path length', 'Identify key touchpoints', 'Calculate path frequencies']
    },
    outputSchema: { type: 'object', required: ['paths', 'touchpoints', 'artifacts'], properties: { paths: { type: 'array' }, touchpoints: { type: 'array' }, pathLength: { type: 'object' }, commonJourneys: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'journey-analysis']
}));

export const firstTouchModelTask = defineTask('first-touch-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build first-touch model',
  agent: {
    name: 'first-touch-modeler',
    prompt: {
      role: 'Attribution modeling specialist',
      task: 'Build and analyze first-touch attribution model',
      context: args,
      instructions: ['Calculate first-touch attribution', 'Analyze channel performance', 'Identify acquisition drivers', 'Document model limitations', 'Generate model output']
    },
    outputSchema: { type: 'object', required: ['model', 'attribution', 'artifacts'], properties: { model: { type: 'object' }, attribution: { type: 'object' }, channelPerformance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'first-touch']
}));

export const lastTouchModelTask = defineTask('last-touch-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build last-touch model',
  agent: {
    name: 'last-touch-modeler',
    prompt: {
      role: 'Attribution modeling specialist',
      task: 'Build and analyze last-touch attribution model',
      context: args,
      instructions: ['Calculate last-touch attribution', 'Analyze channel performance', 'Identify conversion drivers', 'Document model limitations', 'Generate model output']
    },
    outputSchema: { type: 'object', required: ['model', 'attribution', 'artifacts'], properties: { model: { type: 'object' }, attribution: { type: 'object' }, channelPerformance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'last-touch']
}));

export const linearAttributionModelTask = defineTask('linear-attribution-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build linear model',
  agent: {
    name: 'linear-modeler',
    prompt: {
      role: 'Attribution modeling specialist',
      task: 'Build and analyze linear attribution model',
      context: args,
      instructions: ['Calculate linear attribution', 'Distribute credit equally', 'Analyze channel contribution', 'Document model assumptions', 'Generate model output']
    },
    outputSchema: { type: 'object', required: ['model', 'attribution', 'artifacts'], properties: { model: { type: 'object' }, attribution: { type: 'object' }, channelContribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'linear']
}));

export const positionBasedModelTask = defineTask('position-based-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build position-based model',
  agent: {
    name: 'position-modeler',
    prompt: {
      role: 'Attribution modeling specialist',
      task: 'Build and analyze position-based (U-shaped) attribution model',
      context: args,
      instructions: ['Calculate position-based attribution', 'Weight first and last touches', 'Analyze channel contribution', 'Document model rationale', 'Generate model output']
    },
    outputSchema: { type: 'object', required: ['model', 'attribution', 'artifacts'], properties: { model: { type: 'object' }, attribution: { type: 'object' }, weights: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'position-based']
}));

export const dataDrivenModelTask = defineTask('data-driven-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build data-driven model',
  agent: {
    name: 'data-driven-modeler',
    prompt: {
      role: 'Advanced attribution modeling specialist',
      task: 'Build data-driven attribution model using statistical methods',
      context: args,
      instructions: ['Apply Shapley value or Markov chain approach', 'Calculate data-driven attribution', 'Validate model accuracy', 'Compare to rule-based models', 'Generate model documentation']
    },
    outputSchema: { type: 'object', required: ['model', 'attribution', 'artifacts'], properties: { model: { type: 'object' }, attribution: { type: 'object' }, methodology: { type: 'object' }, validation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'data-driven']
}));

export const modelComparisonTask = defineTask('model-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare attribution models',
  agent: {
    name: 'model-comparator',
    prompt: {
      role: 'Marketing analytics director',
      task: 'Compare and recommend attribution models',
      context: args,
      instructions: ['Compare model outputs', 'Analyze differences by channel', 'Assess model fit', 'Recommend optimal model', 'Document trade-offs']
    },
    outputSchema: { type: 'object', required: ['comparison', 'channelContribution', 'artifacts'], properties: { comparison: { type: 'object' }, channelContribution: { type: 'object' }, recommendation: { type: 'object' }, tradeoffs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'comparison']
}));

export const attributionImplementationTask = defineTask('attribution-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Marketing technology specialist',
      task: 'Plan attribution model implementation',
      context: args,
      instructions: ['Define technical requirements', 'Plan tool configuration', 'Create reporting setup', 'Define governance', 'Create implementation roadmap']
    },
    outputSchema: { type: 'object', required: ['plan', 'recommendations', 'artifacts'], properties: { plan: { type: 'object' }, recommendations: { type: 'array' }, technical: { type: 'object' }, roadmap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'implementation']
}));

export const attributionQualityTask = defineTask('attribution-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess attribution quality',
  agent: {
    name: 'attribution-validator',
    prompt: {
      role: 'Marketing measurement director',
      task: 'Assess overall attribution setup quality',
      context: args,
      instructions: ['Evaluate data quality', 'Assess model validity', 'Review implementation plan', 'Assess actionability', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'attribution', 'quality-assessment']
}));

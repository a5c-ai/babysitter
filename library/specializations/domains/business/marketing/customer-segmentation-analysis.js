/**
 * @process marketing/customer-segmentation-analysis
 * @description Divide market into distinct groups using demographics, psychographics, behavior, and needs. Evaluate segment attractiveness and prioritize targets using STP framework.
 * @inputs { customerData: object, marketData: object, businessGoals: object, existingSegments: array }
 * @outputs { success: boolean, segments: array, segmentProfiles: array, prioritization: object, targetingStrategy: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerData = {},
    marketData = {},
    businessGoals = {},
    existingSegments = [],
    outputDir = 'segmentation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Customer Segmentation Analysis');

  const dataPreparation = await ctx.task(segmentationDataPrepTask, { customerData, marketData, outputDir });
  artifacts.push(...dataPreparation.artifacts);

  const demographicSegmentation = await ctx.task(demographicSegmentationTask, { dataPreparation, outputDir });
  artifacts.push(...demographicSegmentation.artifacts);

  const psychographicSegmentation = await ctx.task(psychographicSegmentationTask, { dataPreparation, outputDir });
  artifacts.push(...psychographicSegmentation.artifacts);

  const behavioralSegmentation = await ctx.task(behavioralSegmentationTask, { dataPreparation, outputDir });
  artifacts.push(...behavioralSegmentation.artifacts);

  const needsBasedSegmentation = await ctx.task(needsBasedSegmentationTask, { dataPreparation, businessGoals, outputDir });
  artifacts.push(...needsBasedSegmentation.artifacts);

  const segmentSynthesis = await ctx.task(segmentSynthesisTask, { demographicSegmentation, psychographicSegmentation, behavioralSegmentation, needsBasedSegmentation, outputDir });
  artifacts.push(...segmentSynthesis.artifacts);

  const segmentEvaluation = await ctx.task(segmentEvaluationTask, { segmentSynthesis, marketData, businessGoals, outputDir });
  artifacts.push(...segmentEvaluation.artifacts);

  const targetingStrategy = await ctx.task(targetingStrategyTask, { segmentEvaluation, businessGoals, outputDir });
  artifacts.push(...targetingStrategy.artifacts);

  const qualityAssessment = await ctx.task(segmentationQualityTask, { segmentSynthesis, segmentEvaluation, targetingStrategy, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const segmentationScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Segmentation complete. Quality score: ${segmentationScore}/100. Review and approve?`,
    title: 'Segmentation Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    segmentationScore,
    segments: segmentSynthesis.segments,
    segmentProfiles: segmentSynthesis.profiles,
    prioritization: segmentEvaluation.prioritization,
    targetingStrategy: targetingStrategy.strategy,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/customer-segmentation-analysis', timestamp: startTime, outputDir }
  };
}

export const segmentationDataPrepTask = defineTask('segmentation-data-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare segmentation data',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Market research data analyst',
      task: 'Prepare and validate data for segmentation analysis',
      context: args,
      instructions: ['Consolidate customer data', 'Clean and validate data', 'Identify segmentation variables', 'Prepare data for analysis', 'Document data quality']
    },
    outputSchema: { type: 'object', required: ['data', 'variables', 'artifacts'], properties: { data: { type: 'object' }, variables: { type: 'array' }, quality: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'data-prep']
}));

export const demographicSegmentationTask = defineTask('demographic-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze demographic segments',
  agent: {
    name: 'demographic-analyst',
    prompt: {
      role: 'Demographic segmentation specialist',
      task: 'Segment market by demographic variables',
      context: args,
      instructions: ['Segment by age groups', 'Segment by income levels', 'Segment by geography', 'Segment by occupation', 'Identify demographic patterns']
    },
    outputSchema: { type: 'object', required: ['segments', 'patterns', 'artifacts'], properties: { segments: { type: 'array' }, patterns: { type: 'object' }, sizes: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'demographics']
}));

export const psychographicSegmentationTask = defineTask('psychographic-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze psychographic segments',
  agent: {
    name: 'psychographic-analyst',
    prompt: {
      role: 'Psychographic segmentation specialist',
      task: 'Segment market by psychographic variables',
      context: args,
      instructions: ['Segment by lifestyle', 'Segment by values', 'Segment by attitudes', 'Segment by interests', 'Identify psychographic patterns']
    },
    outputSchema: { type: 'object', required: ['segments', 'patterns', 'artifacts'], properties: { segments: { type: 'array' }, patterns: { type: 'object' }, profiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'psychographics']
}));

export const behavioralSegmentationTask = defineTask('behavioral-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze behavioral segments',
  agent: {
    name: 'behavioral-analyst',
    prompt: {
      role: 'Behavioral segmentation specialist',
      task: 'Segment market by behavioral variables',
      context: args,
      instructions: ['Segment by purchase behavior', 'Segment by usage patterns', 'Segment by loyalty status', 'Segment by benefits sought', 'Identify behavioral patterns']
    },
    outputSchema: { type: 'object', required: ['segments', 'patterns', 'artifacts'], properties: { segments: { type: 'array' }, patterns: { type: 'object' }, behaviors: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'behavioral']
}));

export const needsBasedSegmentationTask = defineTask('needs-based-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze needs-based segments',
  agent: {
    name: 'needs-analyst',
    prompt: {
      role: 'Needs-based segmentation specialist',
      task: 'Segment market by customer needs',
      context: args,
      instructions: ['Identify key customer needs', 'Cluster by need priorities', 'Map needs to solutions', 'Identify unmet needs', 'Define needs-based segments']
    },
    outputSchema: { type: 'object', required: ['segments', 'needs', 'artifacts'], properties: { segments: { type: 'array' }, needs: { type: 'array' }, unmetNeeds: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'needs']
}));

export const segmentSynthesisTask = defineTask('segment-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize final segments',
  agent: {
    name: 'segment-synthesizer',
    prompt: {
      role: 'Market segmentation strategist',
      task: 'Synthesize final market segments',
      context: args,
      instructions: ['Combine segmentation approaches', 'Create unified segments', 'Develop segment profiles', 'Name and describe segments', 'Quantify segment sizes']
    },
    outputSchema: { type: 'object', required: ['segments', 'profiles', 'artifacts'], properties: { segments: { type: 'array' }, profiles: { type: 'array' }, sizes: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'synthesis']
}));

export const segmentEvaluationTask = defineTask('segment-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate segment attractiveness',
  agent: {
    name: 'segment-evaluator',
    prompt: {
      role: 'Market segment analyst',
      task: 'Evaluate segment attractiveness and prioritize',
      context: args,
      instructions: ['Assess segment size', 'Evaluate growth potential', 'Analyze competitive intensity', 'Assess accessibility', 'Calculate segment value', 'Prioritize segments']
    },
    outputSchema: { type: 'object', required: ['evaluation', 'prioritization', 'artifacts'], properties: { evaluation: { type: 'array' }, prioritization: { type: 'object' }, matrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'evaluation']
}));

export const targetingStrategyTask = defineTask('targeting-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop targeting strategy',
  agent: {
    name: 'targeting-strategist',
    prompt: {
      role: 'Marketing targeting strategist',
      task: 'Develop segment targeting strategy',
      context: args,
      instructions: ['Select target segments', 'Define targeting approach', 'Plan segment-specific strategies', 'Align with business goals', 'Create targeting recommendations']
    },
    outputSchema: { type: 'object', required: ['strategy', 'targets', 'artifacts'], properties: { strategy: { type: 'object' }, targets: { type: 'array' }, approach: { type: 'string' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'targeting']
}));

export const segmentationQualityTask = defineTask('segmentation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess segmentation quality',
  agent: {
    name: 'segmentation-validator',
    prompt: {
      role: 'Market research director',
      task: 'Assess overall segmentation quality',
      context: args,
      instructions: ['Evaluate segment validity', 'Assess actionability', 'Review targeting alignment', 'Assess strategic fit', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'segmentation', 'quality-assessment']
}));

/**
 * @process marketing/paid-social-advertising
 * @description Plan and execute advertising campaigns on Meta, LinkedIn, and other social platforms with audience targeting, creative optimization, and conversion tracking.
 * @inputs { platforms: array, budget: number, objectives: object, targetAudience: object, creativeAssets: array }
 * @outputs { success: boolean, campaignStructure: object, audienceStrategy: object, creativeStrategy: object, optimizationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    platforms = ['meta', 'linkedin'],
    budget = 0,
    objectives = {},
    targetAudience = {},
    creativeAssets = [],
    outputDir = 'paid-social-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Paid Social Advertising');

  const platformStrategy = await ctx.task(paidSocialPlatformStrategyTask, { platforms, objectives, targetAudience, budget, outputDir });
  artifacts.push(...platformStrategy.artifacts);

  const audienceStrategy = await ctx.task(paidSocialAudienceTask, { targetAudience, platforms, outputDir });
  artifacts.push(...audienceStrategy.artifacts);

  const campaignStructure = await ctx.task(paidSocialCampaignStructureTask, { platformStrategy, objectives, budget, outputDir });
  artifacts.push(...campaignStructure.artifacts);

  const creativeStrategy = await ctx.task(paidSocialCreativeTask, { platforms, objectives, creativeAssets, audienceStrategy, outputDir });
  artifacts.push(...creativeStrategy.artifacts);

  const biddingOptimization = await ctx.task(paidSocialBiddingTask, { campaignStructure, objectives, budget, outputDir });
  artifacts.push(...biddingOptimization.artifacts);

  const trackingSetup = await ctx.task(paidSocialTrackingTask, { platforms, objectives, outputDir });
  artifacts.push(...trackingSetup.artifacts);

  const testingPlan = await ctx.task(paidSocialTestingTask, { creativeStrategy, audienceStrategy, outputDir });
  artifacts.push(...testingPlan.artifacts);

  const qualityAssessment = await ctx.task(paidSocialQualityTask, { platformStrategy, audienceStrategy, campaignStructure, creativeStrategy, biddingOptimization, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const campaignScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Paid social setup complete. Quality score: ${campaignScore}/100. Review and approve?`,
    title: 'Paid Social Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    campaignScore,
    campaignStructure: campaignStructure.structure,
    audienceStrategy: audienceStrategy.strategy,
    creativeStrategy: creativeStrategy.strategy,
    optimizationPlan: { bidding: biddingOptimization.strategy, testing: testingPlan.plan },
    trackingSetup: trackingSetup.setup,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/paid-social-advertising', timestamp: startTime, outputDir }
  };
}

export const paidSocialPlatformStrategyTask = defineTask('paid-social-platform-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define platform strategy',
  agent: {
    name: 'platform-strategist',
    prompt: {
      role: 'Paid social platform specialist',
      task: 'Define platform-specific advertising strategy',
      context: args,
      instructions: ['Evaluate platform fit', 'Define platform objectives', 'Allocate budget by platform', 'Define platform-specific tactics', 'Plan cross-platform integration']
    },
    outputSchema: { type: 'object', required: ['strategy', 'allocation', 'artifacts'], properties: { strategy: { type: 'object' }, allocation: { type: 'object' }, tactics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'platform']
}));

export const paidSocialAudienceTask = defineTask('paid-social-audience', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop audience strategy',
  agent: {
    name: 'audience-strategist',
    prompt: {
      role: 'Paid social audience specialist',
      task: 'Develop comprehensive audience targeting strategy',
      context: args,
      instructions: ['Define core audiences', 'Create custom audiences', 'Build lookalike audiences', 'Plan retargeting audiences', 'Define exclusion audiences']
    },
    outputSchema: { type: 'object', required: ['strategy', 'audiences', 'artifacts'], properties: { strategy: { type: 'object' }, audiences: { type: 'array' }, lookalikes: { type: 'array' }, retargeting: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'audience']
}));

export const paidSocialCampaignStructureTask = defineTask('paid-social-campaign-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design campaign structure',
  agent: {
    name: 'campaign-architect',
    prompt: {
      role: 'Paid social campaign architect',
      task: 'Design optimal campaign structure',
      context: args,
      instructions: ['Define campaign hierarchy', 'Create ad set structure', 'Plan ad variations', 'Define campaign settings', 'Plan budget distribution']
    },
    outputSchema: { type: 'object', required: ['structure', 'campaigns', 'artifacts'], properties: { structure: { type: 'object' }, campaigns: { type: 'array' }, adSets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'structure']
}));

export const paidSocialCreativeTask = defineTask('paid-social-creative', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop creative strategy',
  agent: {
    name: 'creative-strategist',
    prompt: {
      role: 'Paid social creative specialist',
      task: 'Develop creative strategy for paid social',
      context: args,
      instructions: ['Define creative formats', 'Plan ad copy variations', 'Define visual guidelines', 'Create creative matrix', 'Plan creative testing']
    },
    outputSchema: { type: 'object', required: ['strategy', 'creatives', 'artifacts'], properties: { strategy: { type: 'object' }, creatives: { type: 'array' }, formats: { type: 'array' }, testing: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'creative']
}));

export const paidSocialBiddingTask = defineTask('paid-social-bidding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define bidding strategy',
  agent: {
    name: 'bidding-specialist',
    prompt: {
      role: 'Paid social bidding specialist',
      task: 'Develop optimal bidding and budget strategy',
      context: args,
      instructions: ['Select bid strategies', 'Set cost controls', 'Plan budget pacing', 'Define bid caps', 'Plan scaling strategy']
    },
    outputSchema: { type: 'object', required: ['strategy', 'controls', 'artifacts'], properties: { strategy: { type: 'object' }, controls: { type: 'object' }, pacing: { type: 'object' }, scaling: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'bidding']
}));

export const paidSocialTrackingTask = defineTask('paid-social-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up tracking',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'Paid social tracking specialist',
      task: 'Plan comprehensive tracking setup',
      context: args,
      instructions: ['Plan pixel implementation', 'Define conversion events', 'Set up CAPI integration', 'Configure attribution', 'Plan UTM strategy']
    },
    outputSchema: { type: 'object', required: ['setup', 'events', 'artifacts'], properties: { setup: { type: 'object' }, events: { type: 'array' }, attribution: { type: 'object' }, utm: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'tracking']
}));

export const paidSocialTestingTask = defineTask('paid-social-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define testing plan',
  agent: {
    name: 'testing-specialist',
    prompt: {
      role: 'Paid social testing specialist',
      task: 'Define comprehensive testing plan',
      context: args,
      instructions: ['Plan creative tests', 'Plan audience tests', 'Define placement tests', 'Plan bid strategy tests', 'Create testing roadmap']
    },
    outputSchema: { type: 'object', required: ['plan', 'tests', 'artifacts'], properties: { plan: { type: 'object' }, tests: { type: 'array' }, roadmap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'testing']
}));

export const paidSocialQualityTask = defineTask('paid-social-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess setup quality',
  agent: {
    name: 'paid-social-validator',
    prompt: {
      role: 'Paid social director',
      task: 'Assess overall paid social setup quality',
      context: args,
      instructions: ['Evaluate platform strategy', 'Assess audience targeting', 'Review campaign structure', 'Evaluate creative strategy', 'Assess bidding approach', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'paid-social', 'quality-assessment']
}));

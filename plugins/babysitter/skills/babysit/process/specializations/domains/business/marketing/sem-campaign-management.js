/**
 * @process marketing/sem-campaign-management
 * @description Set up and optimize paid search campaigns in Google Ads including keyword targeting, ad copy, bidding strategies, and quality score improvement.
 * @inputs { businessGoals: object, targetKeywords: array, budget: number, competitors: array, landingPages: array }
 * @outputs { success: boolean, campaignStructure: object, adCopy: array, biddingStrategy: object, qualityScorePlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    businessGoals = {},
    targetKeywords = [],
    budget = 0,
    competitors = [],
    landingPages = [],
    outputDir = 'sem-campaign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting SEM Campaign Management');

  const keywordStrategy = await ctx.task(semKeywordStrategyTask, { targetKeywords, competitors, businessGoals, outputDir });
  artifacts.push(...keywordStrategy.artifacts);

  const campaignStructure = await ctx.task(campaignStructureTask, { keywordStrategy, businessGoals, budget, outputDir });
  artifacts.push(...campaignStructure.artifacts);

  const adCopyDevelopment = await ctx.task(adCopyDevelopmentTask, { keywordStrategy, campaignStructure, landingPages, outputDir });
  artifacts.push(...adCopyDevelopment.artifacts);

  const biddingStrategy = await ctx.task(biddingStrategyTask, { campaignStructure, budget, businessGoals, outputDir });
  artifacts.push(...biddingStrategy.artifacts);

  const qualityScorePlan = await ctx.task(qualityScoreOptimizationTask, { keywordStrategy, adCopyDevelopment, landingPages, outputDir });
  artifacts.push(...qualityScorePlan.artifacts);

  const audienceTargeting = await ctx.task(audienceTargetingTask, { businessGoals, campaignStructure, outputDir });
  artifacts.push(...audienceTargeting.artifacts);

  const trackingSetup = await ctx.task(conversionTrackingSetupTask, { businessGoals, campaignStructure, outputDir });
  artifacts.push(...trackingSetup.artifacts);

  const qualityAssessment = await ctx.task(semCampaignQualityTask, { keywordStrategy, campaignStructure, adCopyDevelopment, biddingStrategy, qualityScorePlan, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const campaignScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `SEM campaign setup complete. Quality score: ${campaignScore}/100. Review and approve?`,
    title: 'SEM Campaign Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    campaignScore,
    campaignStructure: campaignStructure.structure,
    adCopy: adCopyDevelopment.ads,
    biddingStrategy: biddingStrategy.strategy,
    qualityScorePlan: qualityScorePlan.plan,
    keywordStrategy: keywordStrategy.strategy,
    audienceTargeting: audienceTargeting.targeting,
    trackingSetup: trackingSetup.setup,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/sem-campaign-management', timestamp: startTime, outputDir }
  };
}

export const semKeywordStrategyTask = defineTask('sem-keyword-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop SEM keyword strategy',
  agent: {
    name: 'sem-keyword-strategist',
    prompt: {
      role: 'Paid search keyword specialist',
      task: 'Develop comprehensive keyword strategy for paid search campaigns',
      context: args,
      instructions: ['Research high-intent keywords', 'Analyze competitor keywords', 'Group keywords by theme', 'Define match types', 'Create negative keyword list', 'Estimate keyword costs']
    },
    outputSchema: { type: 'object', required: ['strategy', 'keywords', 'artifacts'], properties: { strategy: { type: 'object' }, keywords: { type: 'array' }, negativeKeywords: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'keywords']
}));

export const campaignStructureTask = defineTask('campaign-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design campaign structure',
  agent: {
    name: 'campaign-architect',
    prompt: {
      role: 'Paid search campaign architect',
      task: 'Design optimal campaign and ad group structure',
      context: args,
      instructions: ['Define campaign hierarchy', 'Create ad group structure', 'Assign keywords to ad groups', 'Define campaign settings', 'Plan budget distribution']
    },
    outputSchema: { type: 'object', required: ['structure', 'campaigns', 'artifacts'], properties: { structure: { type: 'object' }, campaigns: { type: 'array' }, adGroups: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'structure']
}));

export const adCopyDevelopmentTask = defineTask('ad-copy-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop ad copy',
  agent: {
    name: 'ad-copywriter',
    prompt: {
      role: 'Paid search copywriter',
      task: 'Write compelling ad copy for all ad groups',
      context: args,
      instructions: ['Write responsive search ads', 'Include keywords in headlines', 'Create compelling descriptions', 'Add relevant extensions', 'Create ad variations for testing']
    },
    outputSchema: { type: 'object', required: ['ads', 'extensions', 'artifacts'], properties: { ads: { type: 'array' }, extensions: { type: 'array' }, testVariations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'ad-copy']
}));

export const biddingStrategyTask = defineTask('bidding-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define bidding strategy',
  agent: {
    name: 'bidding-strategist',
    prompt: {
      role: 'Paid search bidding specialist',
      task: 'Develop optimal bidding strategy',
      context: args,
      instructions: ['Select bidding strategy type', 'Set target CPA/ROAS', 'Define bid adjustments', 'Plan budget pacing', 'Create bid management rules']
    },
    outputSchema: { type: 'object', required: ['strategy', 'targets', 'artifacts'], properties: { strategy: { type: 'object' }, targets: { type: 'object' }, adjustments: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'bidding']
}));

export const qualityScoreOptimizationTask = defineTask('quality-score-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan quality score optimization',
  agent: {
    name: 'quality-score-optimizer',
    prompt: {
      role: 'Quality score optimization specialist',
      task: 'Develop plan to improve quality scores',
      context: args,
      instructions: ['Analyze current quality scores', 'Improve ad relevance', 'Optimize landing page experience', 'Improve expected CTR', 'Create optimization roadmap']
    },
    outputSchema: { type: 'object', required: ['plan', 'improvements', 'artifacts'], properties: { plan: { type: 'object' }, improvements: { type: 'array' }, landingPageRecommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'quality-score']
}));

export const audienceTargetingTask = defineTask('audience-targeting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define audience targeting',
  agent: {
    name: 'audience-specialist',
    prompt: {
      role: 'Paid search audience specialist',
      task: 'Define audience targeting strategy',
      context: args,
      instructions: ['Define remarketing audiences', 'Create custom audiences', 'Plan in-market targeting', 'Define demographic targeting', 'Plan audience bid adjustments']
    },
    outputSchema: { type: 'object', required: ['targeting', 'audiences', 'artifacts'], properties: { targeting: { type: 'object' }, audiences: { type: 'array' }, bidAdjustments: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'audiences']
}));

export const conversionTrackingSetupTask = defineTask('conversion-tracking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up conversion tracking',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'Conversion tracking specialist',
      task: 'Plan conversion tracking implementation',
      context: args,
      instructions: ['Define conversion actions', 'Plan tracking implementation', 'Set conversion values', 'Configure attribution', 'Plan offline conversion import']
    },
    outputSchema: { type: 'object', required: ['setup', 'conversions', 'artifacts'], properties: { setup: { type: 'object' }, conversions: { type: 'array' }, attribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'tracking']
}));

export const semCampaignQualityTask = defineTask('sem-campaign-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess campaign quality',
  agent: {
    name: 'sem-validator',
    prompt: {
      role: 'SEM campaign director',
      task: 'Assess overall campaign setup quality',
      context: args,
      instructions: ['Evaluate keyword coverage', 'Assess campaign structure', 'Review ad copy quality', 'Evaluate bidding strategy', 'Assess quality score optimization', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'sem', 'quality-assessment']
}));

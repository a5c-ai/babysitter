/**
 * @process marketing/social-media-strategy-execution
 * @description Define platform priorities, content mix, posting cadence, community management protocols, and engagement programs aligned with brand voice.
 * @inputs { brandGuidelines: object, targetAudience: object, businessGoals: object, competitors: array, existingPresence: object }
 * @outputs { success: boolean, socialStrategy: object, contentPlan: object, communityGuidelines: object, engagementPrograms: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    brandGuidelines = {},
    targetAudience = {},
    businessGoals = {},
    competitors = [],
    existingPresence = {},
    outputDir = 'social-media-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Social Media Strategy Execution');

  const platformStrategy = await ctx.task(platformPrioritizationTask, { targetAudience, businessGoals, existingPresence, competitors, outputDir });
  artifacts.push(...platformStrategy.artifacts);

  const contentMix = await ctx.task(contentMixDefinitionTask, { platformStrategy, brandGuidelines, targetAudience, outputDir });
  artifacts.push(...contentMix.artifacts);

  const postingCadence = await ctx.task(postingCadenceTask, { platformStrategy, contentMix, outputDir });
  artifacts.push(...postingCadence.artifacts);

  const voiceTone = await ctx.task(socialVoiceToneTask, { brandGuidelines, platformStrategy, outputDir });
  artifacts.push(...voiceTone.artifacts);

  const communityManagement = await ctx.task(communityManagementTask, { platformStrategy, brandGuidelines, outputDir });
  artifacts.push(...communityManagement.artifacts);

  const engagementPrograms = await ctx.task(engagementProgramsTask, { platformStrategy, targetAudience, businessGoals, outputDir });
  artifacts.push(...engagementPrograms.artifacts);

  const metricsFramework = await ctx.task(socialMetricsFrameworkTask, { platformStrategy, businessGoals, outputDir });
  artifacts.push(...metricsFramework.artifacts);

  const qualityAssessment = await ctx.task(socialStrategyQualityTask, { platformStrategy, contentMix, postingCadence, communityManagement, engagementPrograms, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const strategyScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Social media strategy complete. Quality score: ${strategyScore}/100. Review and approve?`,
    title: 'Social Media Strategy Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    strategyScore,
    socialStrategy: { platforms: platformStrategy.platforms, contentMix: contentMix.mix, cadence: postingCadence.cadence },
    contentPlan: contentMix.plan,
    communityGuidelines: communityManagement.guidelines,
    engagementPrograms: engagementPrograms.programs,
    voiceAndTone: voiceTone.guidelines,
    metricsFramework: metricsFramework.framework,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/social-media-strategy-execution', timestamp: startTime, outputDir }
  };
}

export const platformPrioritizationTask = defineTask('platform-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize social platforms',
  agent: {
    name: 'platform-strategist',
    prompt: {
      role: 'Social media platform strategist',
      task: 'Analyze and prioritize social media platforms',
      context: args,
      instructions: ['Analyze audience presence by platform', 'Assess platform fit for brand', 'Evaluate competitor presence', 'Prioritize platforms', 'Define platform roles']
    },
    outputSchema: { type: 'object', required: ['platforms', 'priorities', 'artifacts'], properties: { platforms: { type: 'array' }, priorities: { type: 'array' }, roles: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'platforms']
}));

export const contentMixDefinitionTask = defineTask('content-mix-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content mix',
  agent: {
    name: 'content-mix-planner',
    prompt: {
      role: 'Social content strategist',
      task: 'Define optimal content mix by platform',
      context: args,
      instructions: ['Define content pillars for social', 'Balance content types (educational, entertaining, promotional)', 'Plan content formats by platform', 'Create content ratio guidelines', 'Plan content calendar themes']
    },
    outputSchema: { type: 'object', required: ['mix', 'plan', 'artifacts'], properties: { mix: { type: 'object' }, plan: { type: 'object' }, pillars: { type: 'array' }, ratios: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'content-mix']
}));

export const postingCadenceTask = defineTask('posting-cadence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define posting cadence',
  agent: {
    name: 'cadence-planner',
    prompt: {
      role: 'Social media scheduling specialist',
      task: 'Define optimal posting cadence by platform',
      context: args,
      instructions: ['Research optimal posting times', 'Define posting frequency', 'Plan daily and weekly schedule', 'Account for time zones', 'Create posting calendar']
    },
    outputSchema: { type: 'object', required: ['cadence', 'schedule', 'artifacts'], properties: { cadence: { type: 'object' }, schedule: { type: 'object' }, optimalTimes: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'cadence']
}));

export const socialVoiceToneTask = defineTask('social-voice-tone', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define social voice and tone',
  agent: {
    name: 'voice-specialist',
    prompt: {
      role: 'Brand voice specialist for social',
      task: 'Adapt brand voice for social media',
      context: args,
      instructions: ['Adapt brand voice for social', 'Define platform-specific tone', 'Create writing guidelines', 'Define emoji and hashtag usage', 'Create example posts']
    },
    outputSchema: { type: 'object', required: ['guidelines', 'examples', 'artifacts'], properties: { guidelines: { type: 'object' }, examples: { type: 'array' }, doAndDont: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'voice']
}));

export const communityManagementTask = defineTask('community-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define community management protocols',
  agent: {
    name: 'community-manager',
    prompt: {
      role: 'Social media community manager',
      task: 'Create community management guidelines and protocols',
      context: args,
      instructions: ['Define response protocols', 'Create escalation procedures', 'Plan crisis response', 'Define moderation guidelines', 'Create response templates']
    },
    outputSchema: { type: 'object', required: ['guidelines', 'protocols', 'artifacts'], properties: { guidelines: { type: 'object' }, protocols: { type: 'object' }, templates: { type: 'array' }, escalation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'community']
}));

export const engagementProgramsTask = defineTask('engagement-programs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design engagement programs',
  agent: {
    name: 'engagement-designer',
    prompt: {
      role: 'Social engagement strategist',
      task: 'Design social media engagement programs',
      context: args,
      instructions: ['Design UGC programs', 'Plan influencer collaborations', 'Create contest strategies', 'Plan community challenges', 'Design advocacy programs']
    },
    outputSchema: { type: 'object', required: ['programs', 'campaigns', 'artifacts'], properties: { programs: { type: 'array' }, campaigns: { type: 'array' }, ugcStrategy: { type: 'object' }, influencerPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'engagement']
}));

export const socialMetricsFrameworkTask = defineTask('social-metrics-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define metrics framework',
  agent: {
    name: 'social-analyst',
    prompt: {
      role: 'Social media analytics specialist',
      task: 'Define social media metrics and KPIs',
      context: args,
      instructions: ['Define platform-specific KPIs', 'Set engagement benchmarks', 'Create reporting framework', 'Define success metrics', 'Plan competitive benchmarking']
    },
    outputSchema: { type: 'object', required: ['framework', 'kpis', 'artifacts'], properties: { framework: { type: 'object' }, kpis: { type: 'array' }, benchmarks: { type: 'object' }, reporting: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'metrics']
}));

export const socialStrategyQualityTask = defineTask('social-strategy-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategy quality',
  agent: {
    name: 'social-validator',
    prompt: {
      role: 'Social media director',
      task: 'Assess overall social strategy quality',
      context: args,
      instructions: ['Evaluate platform strategy', 'Assess content mix', 'Review cadence feasibility', 'Evaluate community management', 'Assess engagement programs', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'social-media', 'quality-assessment']
}));

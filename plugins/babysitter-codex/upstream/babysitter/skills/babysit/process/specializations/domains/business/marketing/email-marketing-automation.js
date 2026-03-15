/**
 * @process marketing/email-marketing-automation
 * @description Build email nurture sequences, lifecycle campaigns, triggered communications, and personalization rules using marketing automation platforms.
 * @inputs { customerJourney: object, segments: array, existingEmails: array, automationPlatform: string, businessGoals: object }
 * @outputs { success: boolean, nurtureSequences: array, lifecycleCampaigns: array, automationRules: object, personalizationStrategy: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerJourney = {},
    segments = [],
    existingEmails = [],
    automationPlatform = 'generic',
    businessGoals = {},
    outputDir = 'email-automation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Email Marketing Automation');

  const journeyMapping = await ctx.task(emailJourneyMappingTask, { customerJourney, segments, businessGoals, outputDir });
  artifacts.push(...journeyMapping.artifacts);

  const nurtureSequences = await ctx.task(nurtureSequenceDesignTask, { journeyMapping, segments, outputDir });
  artifacts.push(...nurtureSequences.artifacts);

  const lifecycleCampaigns = await ctx.task(lifecycleCampaignDesignTask, { journeyMapping, segments, outputDir });
  artifacts.push(...lifecycleCampaigns.artifacts);

  const triggeredEmails = await ctx.task(triggeredEmailDesignTask, { journeyMapping, automationPlatform, outputDir });
  artifacts.push(...triggeredEmails.artifacts);

  const personalizationStrategy = await ctx.task(personalizationStrategyTask, { segments, journeyMapping, automationPlatform, outputDir });
  artifacts.push(...personalizationStrategy.artifacts);

  const automationRules = await ctx.task(automationRulesTask, { nurtureSequences, lifecycleCampaigns, triggeredEmails, automationPlatform, outputDir });
  artifacts.push(...automationRules.artifacts);

  const testingStrategy = await ctx.task(emailTestingStrategyTask, { nurtureSequences, lifecycleCampaigns, outputDir });
  artifacts.push(...testingStrategy.artifacts);

  const qualityAssessment = await ctx.task(emailAutomationQualityTask, { journeyMapping, nurtureSequences, lifecycleCampaigns, automationRules, personalizationStrategy, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const automationScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Email automation complete. Quality score: ${automationScore}/100. Review and approve?`,
    title: 'Email Automation Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    automationScore,
    nurtureSequences: nurtureSequences.sequences,
    lifecycleCampaigns: lifecycleCampaigns.campaigns,
    triggeredEmails: triggeredEmails.emails,
    automationRules: automationRules.rules,
    personalizationStrategy: personalizationStrategy.strategy,
    testingStrategy: testingStrategy.strategy,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/email-marketing-automation', timestamp: startTime, outputDir }
  };
}

export const emailJourneyMappingTask = defineTask('email-journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map email touchpoints to journey',
  agent: {
    name: 'journey-mapper',
    prompt: {
      role: 'Email marketing strategist',
      task: 'Map email touchpoints to customer journey stages',
      context: args,
      instructions: ['Map journey stages to email needs', 'Identify key email moments', 'Define email objectives by stage', 'Plan email frequency by stage', 'Identify automation opportunities']
    },
    outputSchema: { type: 'object', required: ['mapping', 'touchpoints', 'artifacts'], properties: { mapping: { type: 'object' }, touchpoints: { type: 'array' }, opportunities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'journey']
}));

export const nurtureSequenceDesignTask = defineTask('nurture-sequence-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design nurture sequences',
  agent: {
    name: 'nurture-designer',
    prompt: {
      role: 'Email nurture specialist',
      task: 'Design email nurture sequences',
      context: args,
      instructions: ['Design welcome sequence', 'Create lead nurture sequence', 'Plan consideration stage sequence', 'Design re-engagement sequence', 'Define sequence timing and cadence']
    },
    outputSchema: { type: 'object', required: ['sequences', 'emails', 'artifacts'], properties: { sequences: { type: 'array' }, emails: { type: 'array' }, timing: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'nurture']
}));

export const lifecycleCampaignDesignTask = defineTask('lifecycle-campaign-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design lifecycle campaigns',
  agent: {
    name: 'lifecycle-designer',
    prompt: {
      role: 'Lifecycle marketing specialist',
      task: 'Design lifecycle email campaigns',
      context: args,
      instructions: ['Design onboarding campaign', 'Create retention campaigns', 'Plan win-back campaigns', 'Design loyalty programs', 'Plan anniversary/milestone emails']
    },
    outputSchema: { type: 'object', required: ['campaigns', 'triggers', 'artifacts'], properties: { campaigns: { type: 'array' }, triggers: { type: 'array' }, timing: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'lifecycle']
}));

export const triggeredEmailDesignTask = defineTask('triggered-email-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design triggered emails',
  agent: {
    name: 'trigger-designer',
    prompt: {
      role: 'Marketing automation specialist',
      task: 'Design triggered email communications',
      context: args,
      instructions: ['Design transactional emails', 'Create behavioral triggers', 'Plan cart abandonment sequence', 'Design browse abandonment emails', 'Create event-based triggers']
    },
    outputSchema: { type: 'object', required: ['emails', 'triggers', 'artifacts'], properties: { emails: { type: 'array' }, triggers: { type: 'array' }, conditions: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'triggers']
}));

export const personalizationStrategyTask = defineTask('personalization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop personalization strategy',
  agent: {
    name: 'personalization-specialist',
    prompt: {
      role: 'Email personalization expert',
      task: 'Develop email personalization strategy',
      context: args,
      instructions: ['Define personalization variables', 'Create dynamic content rules', 'Plan segment-specific content', 'Define personalization fallbacks', 'Plan progressive personalization']
    },
    outputSchema: { type: 'object', required: ['strategy', 'rules', 'artifacts'], properties: { strategy: { type: 'object' }, rules: { type: 'array' }, variables: { type: 'array' }, dynamicContent: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'personalization']
}));

export const automationRulesTask = defineTask('automation-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define automation rules',
  agent: {
    name: 'automation-architect',
    prompt: {
      role: 'Marketing automation architect',
      task: 'Define automation rules and workflows',
      context: args,
      instructions: ['Define entry and exit criteria', 'Create branching logic', 'Set wait conditions', 'Define goal completion', 'Plan suppression rules']
    },
    outputSchema: { type: 'object', required: ['rules', 'workflows', 'artifacts'], properties: { rules: { type: 'object' }, workflows: { type: 'array' }, logic: { type: 'object' }, suppression: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'rules']
}));

export const emailTestingStrategyTask = defineTask('email-testing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define email testing strategy',
  agent: {
    name: 'email-tester',
    prompt: {
      role: 'Email optimization specialist',
      task: 'Define email A/B testing strategy',
      context: args,
      instructions: ['Plan subject line tests', 'Design content tests', 'Plan send time optimization', 'Define test metrics', 'Create testing roadmap']
    },
    outputSchema: { type: 'object', required: ['strategy', 'tests', 'artifacts'], properties: { strategy: { type: 'object' }, tests: { type: 'array' }, metrics: { type: 'array' }, roadmap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'testing']
}));

export const emailAutomationQualityTask = defineTask('email-automation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess automation quality',
  agent: {
    name: 'automation-validator',
    prompt: {
      role: 'Email marketing director',
      task: 'Assess overall email automation quality',
      context: args,
      instructions: ['Evaluate journey coverage', 'Assess nurture sequence depth', 'Review lifecycle campaigns', 'Evaluate personalization', 'Assess automation logic', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'email-automation', 'quality-assessment']
}));

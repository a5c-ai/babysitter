/**
 * @process specializations/game-development/live-ops-setup
 * @description Live Operations Setup Process - Establish live operations infrastructure and processes including
 * analytics, remote config, content delivery, community management, and ongoing support systems.
 * @inputs { projectName: string, liveOpsModel?: string, analyticsRequirements?: array, outputDir?: string }
 * @outputs { success: boolean, liveOpsDoc: string, analyticsSetup: object, contentPipeline: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    liveOpsModel = 'seasons',
    analyticsRequirements = ['retention', 'monetization', 'engagement'],
    contentCadence = 'monthly',
    outputDir = 'live-ops-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Live Ops Setup: ${projectName}`);

  // Phase 1: Live Ops Strategy
  const strategy = await ctx.task(liveOpsStrategyTask, { projectName, liveOpsModel, contentCadence, outputDir });
  artifacts.push(...strategy.artifacts);

  // Phase 2: Analytics Setup
  const analytics = await ctx.task(analyticsSetupTask, { projectName, analyticsRequirements, outputDir });
  artifacts.push(...analytics.artifacts);

  // Phase 3: Remote Config
  const remoteConfig = await ctx.task(remoteConfigTask, { projectName, outputDir });
  artifacts.push(...remoteConfig.artifacts);

  // Phase 4: Content Delivery Pipeline
  const contentPipeline = await ctx.task(contentPipelineTask, { projectName, contentCadence, outputDir });
  artifacts.push(...contentPipeline.artifacts);

  // Phase 5: Community Management
  const community = await ctx.task(communityManagementTask, { projectName, outputDir });
  artifacts.push(...community.artifacts);

  // Phase 6: Support Systems
  const support = await ctx.task(supportSystemsTask, { projectName, outputDir });
  artifacts.push(...support.artifacts);

  await ctx.breakpoint({
    question: `Live Ops setup complete for ${projectName}. Analytics configured. Content pipeline ready. Review documentation?`,
    title: 'Live Ops Setup Review',
    context: { runId: ctx.runId, strategy, analytics, contentPipeline }
  });

  return {
    success: true,
    projectName,
    liveOpsDoc: strategy.docPath,
    analyticsSetup: analytics.setupDetails,
    contentPipeline: contentPipeline.pipelineDetails,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/live-ops-setup', timestamp: startTime, outputDir }
  };
}

export const liveOpsStrategyTask = defineTask('live-ops-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Live Ops Strategy - ${args.projectName}`,
  agent: {
    name: 'liveops-manager-agent',
    prompt: { role: 'Live Ops Manager', task: 'Define live ops strategy', context: args, instructions: ['1. Define content roadmap', '2. Plan seasonal content', '3. Define KPIs', '4. Create live ops calendar'] },
    outputSchema: { type: 'object', required: ['docPath', 'roadmap', 'artifacts'], properties: { docPath: { type: 'string' }, roadmap: { type: 'array' }, kpis: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'live-ops', 'strategy']
}));

export const analyticsSetupTask = defineTask('analytics-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytics Setup - ${args.projectName}`,
  agent: {
    name: 'analytics-engineer-agent',
    prompt: { role: 'Data Analyst', task: 'Set up game analytics', context: args, instructions: ['1. Configure analytics platform', '2. Define event taxonomy', '3. Create dashboards', '4. Set up alerts'] },
    outputSchema: { type: 'object', required: ['setupDetails', 'events', 'artifacts'], properties: { setupDetails: { type: 'object' }, events: { type: 'array' }, dashboards: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'live-ops', 'analytics']
}));

export const remoteConfigTask = defineTask('remote-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remote Config - ${args.projectName}`,
  agent: {
    name: 'backend-engineer-agent',
    prompt: { role: 'Backend Engineer', task: 'Set up remote configuration', context: args, instructions: ['1. Configure remote config service', '2. Define config parameters', '3. Set up A/B testing', '4. Create deployment process'] },
    outputSchema: { type: 'object', required: ['configParams', 'abTestingEnabled', 'artifacts'], properties: { configParams: { type: 'array' }, abTestingEnabled: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'live-ops', 'remote-config']
}));

export const contentPipelineTask = defineTask('content-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Content Pipeline - ${args.projectName}`,
  agent: {
    name: 'liveops-manager-agent',
    prompt: { role: 'Live Ops Manager', task: 'Establish content delivery pipeline', context: args, instructions: ['1. Set up content delivery', '2. Create asset bundles', '3. Define update process', '4. Test hot updates'] },
    outputSchema: { type: 'object', required: ['pipelineDetails', 'deliveryMethod', 'artifacts'], properties: { pipelineDetails: { type: 'object' }, deliveryMethod: { type: 'string' }, hotUpdateSupport: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'live-ops', 'content-pipeline']
}));

export const communityManagementTask = defineTask('community-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Community Management - ${args.projectName}`,
  agent: {
    name: 'community-manager-agent',
    prompt: { role: 'Community Manager', task: 'Set up community management', context: args, instructions: ['1. Set up social channels', '2. Create moderation policies', '3. Define engagement strategy', '4. Set up feedback collection'] },
    outputSchema: { type: 'object', required: ['channels', 'policies', 'artifacts'], properties: { channels: { type: 'array' }, policies: { type: 'object' }, engagementPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'live-ops', 'community']
}));

export const supportSystemsTask = defineTask('support-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: `Support Systems - ${args.projectName}`,
  agent: {
    name: 'support-lead-agent',
    prompt: { role: 'Support Lead', task: 'Set up player support systems', context: args, instructions: ['1. Configure help desk', '2. Create FAQ and knowledge base', '3. Set up ticket escalation', '4. Define SLAs'] },
    outputSchema: { type: 'object', required: ['helpDeskReady', 'knowledgeBase', 'artifacts'], properties: { helpDeskReady: { type: 'boolean' }, knowledgeBase: { type: 'string' }, slas: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'live-ops', 'support']
}));

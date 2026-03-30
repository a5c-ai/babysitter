/**
 * @process specializations/game-development/game-analytics-integration
 * @description Game Analytics Integration Process - Implement analytics tracking for player behavior, monetization,
 * retention metrics, funnel analysis, and A/B testing infrastructure.
 * @inputs { projectName: string, analyticsProvider?: string, eventsToTrack?: array, outputDir?: string }
 * @outputs { success: boolean, analyticsDoc: string, eventSchema: object, dashboards: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    analyticsProvider = 'unity-analytics',
    eventsToTrack = ['session', 'progression', 'economy', 'engagement'],
    abTestingRequired = true,
    privacyCompliance = true,
    outputDir = 'analytics-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Game Analytics Integration: ${projectName}`);

  // Phase 1: Analytics Strategy
  const strategy = await ctx.task(analyticsStrategyTask, { projectName, eventsToTrack, outputDir });
  artifacts.push(...strategy.artifacts);

  // Phase 2: Event Schema Design
  const eventSchema = await ctx.task(eventSchemaTask, { projectName, eventsToTrack, outputDir });
  artifacts.push(...eventSchema.artifacts);

  // Phase 3: SDK Integration
  const sdkIntegration = await ctx.task(analyticsSdkTask, { projectName, analyticsProvider, outputDir });
  artifacts.push(...sdkIntegration.artifacts);

  // Phase 4: Event Implementation
  const eventImplementation = await ctx.task(eventImplementationTask, { projectName, eventSchema, outputDir });
  artifacts.push(...eventImplementation.artifacts);

  // Phase 5: A/B Testing Setup
  if (abTestingRequired) {
    const abTesting = await ctx.task(abTestingSetupTask, { projectName, outputDir });
    artifacts.push(...abTesting.artifacts);
  }

  // Phase 6: Privacy Compliance
  if (privacyCompliance) {
    const privacy = await ctx.task(privacyComplianceTask, { projectName, outputDir });
    artifacts.push(...privacy.artifacts);
  }

  // Phase 7: Dashboard Creation
  const dashboards = await ctx.task(dashboardCreationTask, { projectName, eventsToTrack, outputDir });
  artifacts.push(...dashboards.artifacts);

  // Phase 8: Analytics Testing
  const testing = await ctx.task(analyticsTestingTask, { projectName, eventImplementation, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Analytics integration complete for ${projectName}. ${eventImplementation.eventCount} events. ${dashboards.dashboardCount} dashboards. Test pass: ${testing.passRate}%. Review?`,
    title: 'Analytics Integration Review',
    context: { runId: ctx.runId, eventImplementation, dashboards, testing }
  });

  return {
    success: true,
    projectName,
    analyticsDoc: strategy.docPath,
    eventSchema: eventSchema.schema,
    dashboards: dashboards.dashboardList,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/game-analytics-integration', timestamp: startTime, outputDir }
  };
}

export const analyticsStrategyTask = defineTask('analytics-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytics Strategy - ${args.projectName}`,
  agent: {
    name: 'analytics-engineer-agent',
    prompt: { role: 'Data Analyst', task: 'Define analytics strategy', context: args, instructions: ['1. Define KPIs', '2. Plan event taxonomy', '3. Define funnels', '4. Create documentation'] },
    outputSchema: { type: 'object', required: ['docPath', 'kpis', 'artifacts'], properties: { docPath: { type: 'string' }, kpis: { type: 'array' }, funnels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'strategy']
}));

export const eventSchemaTask = defineTask('event-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Schema - ${args.projectName}`,
  agent: {
    name: 'analytics-engineer-agent',
    prompt: { role: 'Data Analyst', task: 'Design event schema', context: args, instructions: ['1. Define event names', '2. Define parameters', '3. Create data types', '4. Document schema'] },
    outputSchema: { type: 'object', required: ['schema', 'eventTypes', 'artifacts'], properties: { schema: { type: 'object' }, eventTypes: { type: 'array' }, parameters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'schema']
}));

export const analyticsSdkTask = defineTask('analytics-sdk', (args, taskCtx) => ({
  kind: 'agent',
  title: `SDK Integration - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Gameplay Programmer', task: 'Integrate analytics SDK', context: args, instructions: ['1. Add SDK to project', '2. Configure initialization', '3. Add user identification', '4. Test basic tracking'] },
    outputSchema: { type: 'object', required: ['integrated', 'provider', 'artifacts'], properties: { integrated: { type: 'boolean' }, provider: { type: 'string' }, configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'sdk']
}));

export const eventImplementationTask = defineTask('event-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Implementation - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Gameplay Programmer', task: 'Implement analytics events', context: args, instructions: ['1. Implement session events', '2. Add progression events', '3. Track economy events', '4. Add custom events'] },
    outputSchema: { type: 'object', required: ['eventCount', 'events', 'artifacts'], properties: { eventCount: { type: 'number' }, events: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'events']
}));

export const abTestingSetupTask = defineTask('ab-testing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `A/B Testing - ${args.projectName}`,
  agent: {
    name: 'analytics-engineer-agent',
    prompt: { role: 'Data Analyst', task: 'Set up A/B testing', context: args, instructions: ['1. Configure A/B framework', '2. Define test groups', '3. Create flag system', '4. Set up reporting'] },
    outputSchema: { type: 'object', required: ['abSystemReady', 'artifacts'], properties: { abSystemReady: { type: 'boolean' }, testTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'ab-testing']
}));

export const privacyComplianceTask = defineTask('privacy-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Privacy Compliance - ${args.projectName}`,
  agent: {
    name: 'compliance-tester-agent',
    prompt: { role: 'Privacy Engineer', task: 'Ensure privacy compliance', context: args, instructions: ['1. Add consent flow', '2. Implement opt-out', '3. Handle data deletion', '4. Add privacy policy'] },
    outputSchema: { type: 'object', required: ['compliant', 'features', 'artifacts'], properties: { compliant: { type: 'boolean' }, features: { type: 'array' }, regulations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'privacy']
}));

export const dashboardCreationTask = defineTask('dashboard-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dashboard Creation - ${args.projectName}`,
  agent: {
    name: 'analytics-engineer-agent',
    prompt: { role: 'Data Analyst', task: 'Create analytics dashboards', context: args, instructions: ['1. Create retention dashboard', '2. Create economy dashboard', '3. Create engagement dashboard', '4. Set up alerts'] },
    outputSchema: { type: 'object', required: ['dashboardList', 'dashboardCount', 'artifacts'], properties: { dashboardList: { type: 'array' }, dashboardCount: { type: 'number' }, alerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'dashboards']
}));

export const analyticsTestingTask = defineTask('analytics-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytics Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test analytics integration', context: args, instructions: ['1. Verify event firing', '2. Validate parameters', '3. Test data pipeline', '4. Verify dashboards'] },
    outputSchema: { type: 'object', required: ['passRate', 'issues', 'artifacts'], properties: { passRate: { type: 'number' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'analytics', 'testing']
}));

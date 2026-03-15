/**
 * @process specializations/web-development/google-analytics-integration
 * @description Google Analytics Integration - Process for integrating Google Analytics 4 with custom events, conversions, and privacy compliance.
 * @inputs { projectName: string, measurementId?: string }
 * @outputs { success: boolean, analyticsConfig: object, events: array, artifacts: array }
 * @references - Google Analytics: https://developers.google.com/analytics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, measurementId = '', outputDir = 'google-analytics-integration' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Google Analytics Integration: ${projectName}`);

  const ga4Setup = await ctx.task(ga4SetupTask, { projectName, measurementId, outputDir });
  artifacts.push(...ga4Setup.artifacts);

  const eventsSetup = await ctx.task(eventsSetupTask, { projectName, outputDir });
  artifacts.push(...eventsSetup.artifacts);

  const conversionsSetup = await ctx.task(conversionsSetupTask, { projectName, outputDir });
  artifacts.push(...conversionsSetup.artifacts);

  const privacySetup = await ctx.task(privacySetupTask, { projectName, outputDir });
  artifacts.push(...privacySetup.artifacts);

  await ctx.breakpoint({ question: `Google Analytics integration complete for ${projectName}. Approve?`, title: 'Analytics Review', context: { runId: ctx.runId, events: eventsSetup.events } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, analyticsConfig: ga4Setup.config, events: eventsSetup.events, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/google-analytics-integration', timestamp: startTime } };
}

export const ga4SetupTask = defineTask('ga4-setup', (args, taskCtx) => ({ kind: 'agent', title: `GA4 Setup - ${args.projectName}`, agent: { name: 'ga4-architect', prompt: { role: 'GA4 Architect', task: 'Configure Google Analytics 4', context: args, instructions: ['1. Install gtag.js', '2. Configure measurement ID', '3. Set up data streams', '4. Configure user properties', '5. Set up enhanced measurement', '6. Configure debug mode', '7. Set up GTM integration', '8. Configure cross-domain', '9. Set up user ID', '10. Document setup'], outputFormat: 'JSON with GA4 setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'analytics', 'ga4'] }));

export const eventsSetupTask = defineTask('events-setup', (args, taskCtx) => ({ kind: 'agent', title: `Events Setup - ${args.projectName}`, agent: { name: 'analytics-events-specialist', prompt: { role: 'Analytics Events Specialist', task: 'Configure custom events', context: args, instructions: ['1. Define event taxonomy', '2. Create custom events', '3. Configure parameters', '4. Set up page_view', '5. Configure user engagement', '6. Set up form events', '7. Configure click events', '8. Set up scroll tracking', '9. Configure video events', '10. Document events'], outputFormat: 'JSON with events' }, outputSchema: { type: 'object', required: ['events', 'artifacts'], properties: { events: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'analytics', 'events'] }));

export const conversionsSetupTask = defineTask('conversions-setup', (args, taskCtx) => ({ kind: 'agent', title: `Conversions Setup - ${args.projectName}`, agent: { name: 'conversions-specialist', prompt: { role: 'Conversions Specialist', task: 'Configure conversions', context: args, instructions: ['1. Define conversion events', '2. Configure purchase tracking', '3. Set up lead generation', '4. Configure sign-up tracking', '5. Set up goal completions', '6. Configure funnels', '7. Set up attribution', '8. Configure value tracking', '9. Set up remarketing', '10. Document conversions'], outputFormat: 'JSON with conversions' }, outputSchema: { type: 'object', required: ['conversions', 'artifacts'], properties: { conversions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'analytics', 'conversions'] }));

export const privacySetupTask = defineTask('privacy-setup', (args, taskCtx) => ({ kind: 'agent', title: `Privacy Setup - ${args.projectName}`, agent: { name: 'analytics-privacy-specialist', prompt: { role: 'Analytics Privacy Specialist', task: 'Configure privacy compliance', context: args, instructions: ['1. Set up consent mode', '2. Configure cookie consent', '3. Set up data retention', '4. Configure IP anonymization', '5. Set up data deletion', '6. Configure GDPR compliance', '7. Set up CCPA compliance', '8. Configure opt-out', '9. Set up privacy policy', '10. Document privacy'], outputFormat: 'JSON with privacy setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'analytics', 'privacy'] }));

export const documentationTask = defineTask('analytics-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate analytics documentation', context: args, instructions: ['1. Create README', '2. Document GA4 setup', '3. Create events guide', '4. Document conversions', '5. Create privacy guide', '6. Document debugging', '7. Create reporting guide', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'analytics', 'documentation'] }));

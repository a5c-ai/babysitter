/**
 * @process specializations/web-development/frontend-caching-service-workers
 * @description Frontend Caching with Service Workers - Process for implementing browser caching strategies using Service Workers and Workbox.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, cachingConfig: object, strategies: array, artifacts: array }
 * @references - Workbox: https://developers.google.com/web/tools/workbox
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'react', outputDir = 'frontend-caching-service-workers' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Frontend Caching: ${projectName}`);

  const serviceWorkerSetup = await ctx.task(serviceWorkerSetupTask, { projectName, framework, outputDir });
  artifacts.push(...serviceWorkerSetup.artifacts);

  const cachingStrategies = await ctx.task(cachingStrategiesTask, { projectName, outputDir });
  artifacts.push(...cachingStrategies.artifacts);

  const offlineSetup = await ctx.task(offlineSupportTask, { projectName, outputDir });
  artifacts.push(...offlineSetup.artifacts);

  const updateSetup = await ctx.task(updateHandlingTask, { projectName, outputDir });
  artifacts.push(...updateSetup.artifacts);

  await ctx.breakpoint({ question: `Frontend caching setup complete for ${projectName}. Approve?`, title: 'Caching Review', context: { runId: ctx.runId, strategies: cachingStrategies.strategies } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, cachingConfig: serviceWorkerSetup.config, strategies: cachingStrategies.strategies, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/frontend-caching-service-workers', timestamp: startTime } };
}

export const serviceWorkerSetupTask = defineTask('sw-setup', (args, taskCtx) => ({ kind: 'agent', title: `Service Worker Setup - ${args.projectName}`, agent: { name: 'sw-developer', prompt: { role: 'Service Worker Developer', task: 'Set up Service Worker', context: args, instructions: ['1. Configure Workbox', '2. Set up registration', '3. Configure scope', '4. Set up lifecycle', '5. Configure skipWaiting', '6. Set up clients claim', '7. Configure navigation preload', '8. Set up error handling', '9. Configure debugging', '10. Document setup'], outputFormat: 'JSON with SW setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'service-worker'] }));

export const cachingStrategiesTask = defineTask('caching-strategies', (args, taskCtx) => ({ kind: 'agent', title: `Caching Strategies - ${args.projectName}`, agent: { name: 'caching-strategist', prompt: { role: 'Caching Strategist', task: 'Implement caching strategies', context: args, instructions: ['1. Configure CacheFirst', '2. Set up NetworkFirst', '3. Configure StaleWhileRevalidate', '4. Set up NetworkOnly', '5. Configure CacheOnly', '6. Set up route matching', '7. Configure cache expiration', '8. Set up cache limits', '9. Configure precaching', '10. Document strategies'], outputFormat: 'JSON with strategies' }, outputSchema: { type: 'object', required: ['strategies', 'artifacts'], properties: { strategies: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'strategies'] }));

export const offlineSupportTask = defineTask('offline-support', (args, taskCtx) => ({ kind: 'agent', title: `Offline Support - ${args.projectName}`, agent: { name: 'offline-specialist', prompt: { role: 'Offline Support Specialist', task: 'Implement offline support', context: args, instructions: ['1. Create offline page', '2. Configure offline detection', '3. Set up queue management', '4. Configure background sync', '5. Set up IndexedDB', '6. Configure data persistence', '7. Set up offline UI', '8. Configure sync notifications', '9. Set up conflict resolution', '10. Document offline'], outputFormat: 'JSON with offline support' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'offline'] }));

export const updateHandlingTask = defineTask('update-handling', (args, taskCtx) => ({ kind: 'agent', title: `Update Handling - ${args.projectName}`, agent: { name: 'update-specialist', prompt: { role: 'SW Update Specialist', task: 'Handle SW updates', context: args, instructions: ['1. Configure update detection', '2. Set up update prompt', '3. Configure auto-update', '4. Set up version management', '5. Configure cache busting', '6. Set up graceful updates', '7. Configure rollback', '8. Set up update logging', '9. Configure A/B testing', '10. Document updates'], outputFormat: 'JSON with update handling' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'updates'] }));

export const documentationTask = defineTask('caching-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate caching documentation', context: args, instructions: ['1. Create README', '2. Document strategies', '3. Create offline guide', '4. Document updates', '5. Create debugging guide', '6. Document testing', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate diagrams'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'documentation'] }));

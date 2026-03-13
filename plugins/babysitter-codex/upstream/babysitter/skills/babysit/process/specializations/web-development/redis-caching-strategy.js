/**
 * @process specializations/web-development/redis-caching-strategy
 * @description Redis Caching Strategy Implementation - Process for implementing caching with Redis including cache patterns, invalidation strategies, and session storage.
 * @inputs { projectName: string, features?: object }
 * @outputs { success: boolean, cacheConfig: object, patterns: array, artifacts: array }
 * @references
 * - Redis Documentation: https://redis.io/documentation
 * - ioredis: https://github.com/redis/ioredis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, features = { sessions: true, pubsub: false }, outputDir = 'redis-caching-strategy' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Redis Caching Strategy: ${projectName}`);

  const redisSetup = await ctx.task(redisSetupTask, { projectName, outputDir });
  artifacts.push(...redisSetup.artifacts);

  const cachePatternsSetup = await ctx.task(cachePatternsTask, { projectName, outputDir });
  artifacts.push(...cachePatternsSetup.artifacts);

  const invalidationSetup = await ctx.task(invalidationSetupTask, { projectName, outputDir });
  artifacts.push(...invalidationSetup.artifacts);

  const sessionSetup = await ctx.task(sessionStorageTask, { projectName, features, outputDir });
  artifacts.push(...sessionSetup.artifacts);

  await ctx.breakpoint({ question: `Redis caching setup complete for ${projectName}. ${cachePatternsSetup.patterns.length} patterns implemented. Approve?`, title: 'Redis Caching Review', context: { runId: ctx.runId, patterns: cachePatternsSetup.patterns } });

  const documentation = await ctx.task(documentationTask, { projectName, cachePatternsSetup, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, cacheConfig: redisSetup.config, patterns: cachePatternsSetup.patterns, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/redis-caching-strategy', timestamp: startTime } };
}

export const redisSetupTask = defineTask('redis-setup', (args, taskCtx) => ({ kind: 'agent', title: `Redis Setup - ${args.projectName}`, agent: { name: 'redis-developer', prompt: { role: 'Redis Developer', task: 'Set up Redis connection', context: args, instructions: ['1. Install ioredis', '2. Configure connection', '3. Set up connection pool', '4. Configure clustering', '5. Set up sentinel', '6. Configure TLS', '7. Set up error handling', '8. Configure reconnection', '9. Set up health checks', '10. Document setup'], outputFormat: 'JSON with Redis setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'redis', 'setup'] }));

export const cachePatternsTask = defineTask('cache-patterns', (args, taskCtx) => ({ kind: 'agent', title: `Cache Patterns - ${args.projectName}`, agent: { name: 'cache-patterns-specialist', prompt: { role: 'Cache Patterns Specialist', task: 'Implement caching patterns', context: args, instructions: ['1. Implement cache-aside', '2. Set up read-through', '3. Configure write-through', '4. Implement write-behind', '5. Set up cache warming', '6. Configure TTL strategies', '7. Implement LRU eviction', '8. Set up cache prefetching', '9. Configure serialization', '10. Document patterns'], outputFormat: 'JSON with patterns' }, outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'redis', 'patterns'] }));

export const invalidationSetupTask = defineTask('cache-invalidation', (args, taskCtx) => ({ kind: 'agent', title: `Cache Invalidation - ${args.projectName}`, agent: { name: 'cache-invalidation-specialist', prompt: { role: 'Cache Invalidation Specialist', task: 'Implement cache invalidation', context: args, instructions: ['1. Design invalidation strategy', '2. Implement tag-based invalidation', '3. Set up pattern invalidation', '4. Configure cascade invalidation', '5. Implement event-based', '6. Set up time-based', '7. Configure manual invalidation', '8. Implement partial invalidation', '9. Set up monitoring', '10. Document invalidation'], outputFormat: 'JSON with invalidation' }, outputSchema: { type: 'object', required: ['strategies', 'artifacts'], properties: { strategies: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'redis', 'invalidation'] }));

export const sessionStorageTask = defineTask('session-storage', (args, taskCtx) => ({ kind: 'agent', title: `Session Storage - ${args.projectName}`, agent: { name: 'session-storage-specialist', prompt: { role: 'Session Storage Specialist', task: 'Implement session storage', context: args, instructions: ['1. Configure session store', '2. Set up serialization', '3. Configure TTL', '4. Set up rolling sessions', '5. Configure secure flags', '6. Set up session rotation', '7. Configure multi-server', '8. Set up cleanup', '9. Configure monitoring', '10. Document sessions'], outputFormat: 'JSON with session setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'redis', 'sessions'] }));

export const documentationTask = defineTask('redis-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Redis documentation', context: args, instructions: ['1. Create README', '2. Document setup', '3. Create patterns guide', '4. Document invalidation', '5. Create session guide', '6. Document monitoring', '7. Create performance guide', '8. Document scaling', '9. Create troubleshooting', '10. Generate examples'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'caching', 'documentation'] }));

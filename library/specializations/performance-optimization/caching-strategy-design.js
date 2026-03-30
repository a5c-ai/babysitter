/**
 * @process specializations/performance-optimization/caching-strategy-design
 * @description Caching Strategy Design - Design and implement multi-tier caching strategy including cache layer
 * selection, cache key design, TTL configuration, cache invalidation patterns, and monitoring setup.
 * @inputs { projectName: string, cacheableData: array, cacheLayers?: array }
 * @outputs { success: boolean, cachingStrategy: object, implementedLayers: array, hitRatioTarget: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/caching-strategy-design', {
 *   projectName: 'Content Delivery System',
 *   cacheableData: ['user-profiles', 'product-catalog', 'session-data'],
 *   cacheLayers: ['local', 'distributed']
 * });
 *
 * @references
 * - Redis Documentation: https://redis.io/documentation
 * - Memcached: https://memcached.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cacheableData = [],
    cacheLayers = ['local', 'distributed'],
    outputDir = 'caching-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Caching Strategy Design for ${projectName}`);

  // Phase 1: Analyze Data Access Patterns
  const accessPatterns = await ctx.task(analyzeDataAccessPatternsTask, { projectName, cacheableData, outputDir });
  artifacts.push(...accessPatterns.artifacts);

  // Phase 2: Identify Cacheable Data
  const cacheableAnalysis = await ctx.task(identifyCacheableDataTask, { projectName, accessPatterns, outputDir });
  artifacts.push(...cacheableAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Identified ${cacheableAnalysis.cacheableItems.length} cacheable data items. Design cache layers?`,
    title: 'Cacheable Data Analysis',
    context: { runId: ctx.runId, cacheableAnalysis }
  });

  // Phase 3: Select Cache Layers
  const layerSelection = await ctx.task(selectCacheLayersTask, { projectName, cacheableAnalysis, cacheLayers, outputDir });
  artifacts.push(...layerSelection.artifacts);

  // Phase 4: Design Cache Key Strategy
  const keyStrategy = await ctx.task(designCacheKeyStrategyTask, { projectName, cacheableAnalysis, outputDir });
  artifacts.push(...keyStrategy.artifacts);

  // Phase 5: Configure TTLs
  const ttlConfig = await ctx.task(configureCacheTTLsTask, { projectName, cacheableAnalysis, outputDir });
  artifacts.push(...ttlConfig.artifacts);

  // Phase 6: Implement Cache Invalidation
  const invalidation = await ctx.task(implementCacheInvalidationTask, { projectName, keyStrategy, outputDir });
  artifacts.push(...invalidation.artifacts);

  // Phase 7: Add Cache Monitoring
  const monitoring = await ctx.task(addCacheMonitoringTask, { projectName, layerSelection, outputDir });
  artifacts.push(...monitoring.artifacts);

  // Phase 8: Document Strategy
  const documentation = await ctx.task(documentCachingStrategyTask, { projectName, layerSelection, keyStrategy, ttlConfig, invalidation, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Caching strategy designed with ${layerSelection.layers.length} layers. Target hit ratio: ${monitoring.hitRatioTarget}%. Accept?`,
    title: 'Caching Strategy Review',
    context: { runId: ctx.runId, layerSelection, monitoring }
  });

  return {
    success: true,
    projectName,
    cachingStrategy: { layers: layerSelection.layers, keyStrategy: keyStrategy.strategy, ttlConfig: ttlConfig.configs, invalidation: invalidation.patterns },
    implementedLayers: layerSelection.layers,
    hitRatioTarget: monitoring.hitRatioTarget,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/caching-strategy-design', timestamp: startTime, outputDir }
  };
}

export const analyzeDataAccessPatternsTask = defineTask('analyze-data-access-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Data Access Patterns - ${args.projectName}`,
  agent: {
    name: 'caching-architect',
    prompt: { role: 'Performance Engineer', task: 'Analyze data access patterns for caching', context: args,
      instructions: ['1. Analyze read/write ratios', '2. Identify hot data', '3. Measure access frequency', '4. Analyze data sizes', '5. Document patterns'],
      outputFormat: 'JSON with access patterns' },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'patterns']
}));

export const identifyCacheableDataTask = defineTask('identify-cacheable-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Cacheable Data - ${args.projectName}`,
  agent: {
    name: 'caching-architect',
    prompt: { role: 'Performance Engineer', task: 'Identify cacheable data', context: args,
      instructions: ['1. Evaluate cache candidacy', '2. Check consistency needs', '3. Analyze volatility', '4. Assess size', '5. Document candidates'],
      outputFormat: 'JSON with cacheable items' },
    outputSchema: { type: 'object', required: ['cacheableItems', 'artifacts'], properties: { cacheableItems: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'identification']
}));

export const selectCacheLayersTask = defineTask('select-cache-layers', (args, taskCtx) => ({
  kind: 'skill',
  title: `Select Cache Layers - ${args.projectName}`,
  skill: {
    name: 'distributed-caching',
    prompt: { role: 'Performance Engineer', task: 'Select cache layers', context: args,
      instructions: ['1. Evaluate local caching', '2. Evaluate distributed cache', '3. Consider CDN', '4. Design tiering', '5. Document selection'],
      outputFormat: 'JSON with cache layers' },
    outputSchema: { type: 'object', required: ['layers', 'artifacts'], properties: { layers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'layers']
}));

export const designCacheKeyStrategyTask = defineTask('design-cache-key-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Cache Key Strategy - ${args.projectName}`,
  agent: {
    name: 'caching-architect',
    prompt: { role: 'Performance Engineer', task: 'Design cache key strategy', context: args,
      instructions: ['1. Design key structure', '2. Include versioning', '3. Add namespacing', '4. Handle parameters', '5. Document strategy'],
      outputFormat: 'JSON with key strategy' },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'keys']
}));

export const configureCacheTTLsTask = defineTask('configure-cache-ttls', (args, taskCtx) => ({
  kind: 'skill',
  title: `Configure Cache TTLs - ${args.projectName}`,
  skill: {
    name: 'distributed-caching',
    prompt: { role: 'Performance Engineer', task: 'Configure cache TTLs', context: args,
      instructions: ['1. Analyze data volatility', '2. Set appropriate TTLs', '3. Consider stale-while-revalidate', '4. Configure per data type', '5. Document configuration'],
      outputFormat: 'JSON with TTL configs' },
    outputSchema: { type: 'object', required: ['configs', 'artifacts'], properties: { configs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'ttl']
}));

export const implementCacheInvalidationTask = defineTask('implement-cache-invalidation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Cache Invalidation - ${args.projectName}`,
  skill: {
    name: 'distributed-caching',
    prompt: { role: 'Performance Engineer', task: 'Implement cache invalidation', context: args,
      instructions: ['1. Design invalidation strategy', '2. Implement event-based invalidation', '3. Handle cascade invalidation', '4. Add manual invalidation', '5. Document patterns'],
      outputFormat: 'JSON with invalidation implementation' },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'invalidation']
}));

export const addCacheMonitoringTask = defineTask('add-cache-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Add Cache Monitoring - ${args.projectName}`,
  agent: {
    name: 'caching-architect',
    prompt: { role: 'Performance Engineer', task: 'Add cache monitoring', context: args,
      instructions: ['1. Track hit/miss rates', '2. Monitor memory usage', '3. Track evictions', '4. Set up alerts', '5. Create dashboards'],
      outputFormat: 'JSON with monitoring setup' },
    outputSchema: { type: 'object', required: ['hitRatioTarget', 'artifacts'], properties: { hitRatioTarget: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'monitoring']
}));

export const documentCachingStrategyTask = defineTask('document-caching-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Caching Strategy - ${args.projectName}`,
  agent: {
    name: 'caching-architect',
    prompt: { role: 'Performance Engineer', task: 'Document caching strategy', context: args,
      instructions: ['1. Document architecture', '2. Document key strategy', '3. Document TTL policies', '4. Document invalidation', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'caching', 'documentation']
}));

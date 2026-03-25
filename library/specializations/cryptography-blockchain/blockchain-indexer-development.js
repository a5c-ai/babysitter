/**
 * @process specializations/cryptography-blockchain/blockchain-indexer-development
 * @description Blockchain Indexer Development - Development of blockchain indexers for event tracking, state aggregation,
 * and queryable APIs with real-time synchronization.
 * @inputs { projectName: string, network: string, indexType?: string, storageBackend?: string }
 * @outputs { success: boolean, indexerInfo: object, apiEndpoints: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/blockchain-indexer-development', {
 *   projectName: 'DeFi Analytics Indexer',
 *   network: 'ethereum',
 *   indexType: 'events',
 *   storageBackend: 'postgres'
 * });
 *
 * @references
 * - The Graph Protocol: https://thegraph.com/docs/
 * - Subsquid: https://docs.subsquid.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    network,
    indexType = 'events',
    storageBackend = 'postgres',
    features = ['real-time', 'historical', 'graphql'],
    outputDir = 'indexer-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Blockchain Indexer Development: ${projectName}`);

  const schemaDesign = await ctx.task(schemaDesignTask, { projectName, indexType, storageBackend, outputDir });
  artifacts.push(...schemaDesign.artifacts);

  const eventDecoding = await ctx.task(eventDecodingTask, { projectName, network, outputDir });
  artifacts.push(...eventDecoding.artifacts);

  const syncEngine = await ctx.task(syncEngineTask, { projectName, features, outputDir });
  artifacts.push(...syncEngine.artifacts);

  const dataTransformers = await ctx.task(dataTransformersTask, { projectName, outputDir });
  artifacts.push(...dataTransformers.artifacts);

  const storageLayer = await ctx.task(storageLayerTask, { projectName, storageBackend, outputDir });
  artifacts.push(...storageLayer.artifacts);

  const apiLayer = await ctx.task(apiLayerTask, { projectName, features, outputDir });
  artifacts.push(...apiLayer.artifacts);

  const reorgHandling = await ctx.task(reorgHandlingTask, { projectName, outputDir });
  artifacts.push(...reorgHandling.artifacts);

  const performanceOptimization = await ctx.task(performanceOptimizationTask, { projectName, outputDir });
  artifacts.push(...performanceOptimization.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    indexerInfo: { network, indexType, storageBackend, features },
    apiEndpoints: apiLayer.endpoints,
    schema: schemaDesign,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/blockchain-indexer-development', timestamp: startTime }
  };
}

export const schemaDesignTask = defineTask('schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Schema Design - ${args.projectName}`,
  agent: {
    name: 'schema-architect',
    prompt: {
      role: 'Indexer Schema Architect',
      task: 'Design indexer schema',
      context: args,
      instructions: ['1. Identify entities', '2. Design relationships', '3. Plan aggregations', '4. Design indexes', '5. Plan partitioning', '6. Handle time-series data', '7. Design for queries', '8. Plan migrations', '9. Document schema', '10. Create ERD'],
      outputFormat: 'JSON with schema design'
    },
    outputSchema: { type: 'object', required: ['schema', 'entities', 'artifacts'], properties: { schema: { type: 'object' }, entities: { type: 'array' }, relationships: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'schema']
}));

export const eventDecodingTask = defineTask('event-decoding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Decoding - ${args.projectName}`,
  agent: {
    name: 'decoder-engineer',
    prompt: {
      role: 'Event Decoding Engineer',
      task: 'Implement event decoding',
      context: args,
      instructions: ['1. Parse contract ABIs', '2. Implement log decoding', '3. Handle indexed params', '4. Decode transaction input', '5. Handle internal transactions', '6. Implement trace decoding', '7. Handle proxy contracts', '8. Add custom decoders', '9. Test decoding accuracy', '10. Document decoders'],
      outputFormat: 'JSON with event decoding'
    },
    outputSchema: { type: 'object', required: ['decoders', 'abiRegistry', 'artifacts'], properties: { decoders: { type: 'array' }, abiRegistry: { type: 'object' }, eventTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'decoding']
}));

export const syncEngineTask = defineTask('sync-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sync Engine - ${args.projectName}`,
  agent: {
    name: 'sync-engineer',
    prompt: {
      role: 'Indexer Sync Engineer',
      task: 'Implement sync engine',
      context: args,
      instructions: ['1. Implement block fetcher', '2. Add parallel syncing', '3. Handle rate limits', '4. Implement checkpoints', '5. Add real-time sync', '6. Handle gaps', '7. Implement retry logic', '8. Add progress tracking', '9. Test sync speed', '10. Document sync process'],
      outputFormat: 'JSON with sync engine'
    },
    outputSchema: { type: 'object', required: ['syncEngine', 'syncSpeed', 'artifacts'], properties: { syncEngine: { type: 'object' }, syncSpeed: { type: 'number' }, checkpointStrategy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'sync']
}));

export const dataTransformersTask = defineTask('data-transformers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Transformers - ${args.projectName}`,
  agent: {
    name: 'transformer-engineer',
    prompt: {
      role: 'Data Transformer Engineer',
      task: 'Implement data transformers',
      context: args,
      instructions: ['1. Design transformation pipeline', '2. Implement entity handlers', '3. Add aggregation logic', '4. Handle derived data', '5. Implement computed fields', '6. Add data validation', '7. Handle null values', '8. Add normalization', '9. Test transformations', '10. Document transformers'],
      outputFormat: 'JSON with data transformers'
    },
    outputSchema: { type: 'object', required: ['transformers', 'pipeline', 'artifacts'], properties: { transformers: { type: 'array' }, pipeline: { type: 'object' }, aggregations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'transformers']
}));

export const storageLayerTask = defineTask('storage-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Storage Layer - ${args.projectName}`,
  agent: {
    name: 'storage-engineer',
    prompt: {
      role: 'Indexer Storage Engineer',
      task: 'Implement storage layer',
      context: args,
      instructions: ['1. Setup database schema', '2. Implement batch writes', '3. Add caching layer', '4. Optimize queries', '5. Add connection pooling', '6. Implement sharding', '7. Add replication', '8. Handle migrations', '9. Test performance', '10. Document storage'],
      outputFormat: 'JSON with storage layer'
    },
    outputSchema: { type: 'object', required: ['storageConfig', 'performance', 'artifacts'], properties: { storageConfig: { type: 'object' }, performance: { type: 'object' }, indexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'storage']
}));

export const apiLayerTask = defineTask('api-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Layer - ${args.projectName}`,
  agent: {
    name: 'api-engineer',
    prompt: {
      role: 'Indexer API Engineer',
      task: 'Implement API layer',
      context: args,
      instructions: ['1. Design GraphQL schema', '2. Implement resolvers', '3. Add REST endpoints', '4. Implement pagination', '5. Add filtering', '6. Implement subscriptions', '7. Add rate limiting', '8. Implement caching', '9. Test API', '10. Document endpoints'],
      outputFormat: 'JSON with API layer'
    },
    outputSchema: { type: 'object', required: ['endpoints', 'graphqlSchema', 'artifacts'], properties: { endpoints: { type: 'array' }, graphqlSchema: { type: 'object' }, subscriptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'api']
}));

export const reorgHandlingTask = defineTask('reorg-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reorg Handling - ${args.projectName}`,
  agent: {
    name: 'reorg-engineer',
    prompt: {
      role: 'Chain Reorg Engineer',
      task: 'Implement reorg handling',
      context: args,
      instructions: ['1. Detect chain reorgs', '2. Implement rollback logic', '3. Handle orphaned data', '4. Implement confirmation tracking', '5. Add finality checks', '6. Handle deep reorgs', '7. Implement recovery', '8. Add monitoring', '9. Test reorg scenarios', '10. Document handling'],
      outputFormat: 'JSON with reorg handling'
    },
    outputSchema: { type: 'object', required: ['reorgHandling', 'rollbackStrategy', 'artifacts'], properties: { reorgHandling: { type: 'object' }, rollbackStrategy: { type: 'object' }, confirmationDepth: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'reorg']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Optimization - ${args.projectName}`,
  agent: {
    name: 'perf-engineer',
    prompt: {
      role: 'Indexer Performance Engineer',
      task: 'Optimize indexer performance',
      context: args,
      instructions: ['1. Profile bottlenecks', '2. Optimize queries', '3. Add batch processing', '4. Implement parallel indexing', '5. Optimize memory usage', '6. Add caching', '7. Optimize network', '8. Add compression', '9. Benchmark performance', '10. Document optimizations'],
      outputFormat: 'JSON with performance optimization'
    },
    outputSchema: { type: 'object', required: ['optimizations', 'benchmarks', 'artifacts'], properties: { optimizations: { type: 'array' }, benchmarks: { type: 'object' }, throughput: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['indexer', 'performance']
}));

/**
 * @process specializations/cryptography-blockchain/subgraph-development
 * @description Subgraph Development - Development of subgraphs for The Graph protocol to index blockchain events
 * and provide queryable GraphQL APIs.
 * @inputs { projectName: string, network: string, contracts: array, entities?: array }
 * @outputs { success: boolean, subgraphInfo: object, schema: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/subgraph-development', {
 *   projectName: 'DEX Analytics Subgraph',
 *   network: 'ethereum',
 *   contracts: ['Factory', 'Pool', 'Router'],
 *   entities: ['Pool', 'Swap', 'Position', 'Token']
 * });
 *
 * @references
 * - The Graph Docs: https://thegraph.com/docs/
 * - Subgraph Best Practices: https://thegraph.com/docs/en/developing/creating-a-subgraph/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    network,
    contracts,
    entities = [],
    features = ['time-travel', 'full-text-search'],
    outputDir = 'subgraph-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Subgraph Development: ${projectName}`);

  const schemaDesign = await ctx.task(schemaDesignTask, { projectName, entities, features, outputDir });
  artifacts.push(...schemaDesign.artifacts);

  const manifestConfiguration = await ctx.task(manifestConfigurationTask, { projectName, network, contracts, outputDir });
  artifacts.push(...manifestConfiguration.artifacts);

  const mappingImplementation = await ctx.task(mappingImplementationTask, { projectName, contracts, outputDir });
  artifacts.push(...mappingImplementation.artifacts);

  const entityHandlers = await ctx.task(entityHandlersTask, { projectName, entities, outputDir });
  artifacts.push(...entityHandlers.artifacts);

  const derivedFields = await ctx.task(derivedFieldsTask, { projectName, outputDir });
  artifacts.push(...derivedFields.artifacts);

  const aggregations = await ctx.task(aggregationsTask, { projectName, outputDir });
  artifacts.push(...aggregations.artifacts);

  const performanceOptimization = await ctx.task(performanceOptimizationTask, { projectName, outputDir });
  artifacts.push(...performanceOptimization.artifacts);

  const testingDeployment = await ctx.task(testingDeploymentTask, { projectName, network, outputDir });
  artifacts.push(...testingDeployment.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    subgraphInfo: { network, contracts, entities, features },
    schema: schemaDesign.schema,
    deployment: testingDeployment,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/subgraph-development', timestamp: startTime }
  };
}

export const schemaDesignTask = defineTask('schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Schema Design - ${args.projectName}`,
  agent: {
    name: 'schema-architect',
    prompt: {
      role: 'Subgraph Schema Architect',
      task: 'Design GraphQL schema',
      context: args,
      instructions: ['1. Define entity types', '2. Design relationships', '3. Add derived fields', '4. Define enums', '5. Add interfaces', '6. Design aggregations', '7. Add full-text search', '8. Design for queries', '9. Optimize schema', '10. Document schema'],
      outputFormat: 'JSON with schema design'
    },
    outputSchema: { type: 'object', required: ['schema', 'entities', 'artifacts'], properties: { schema: { type: 'object' }, entities: { type: 'array' }, relationships: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'schema']
}));

export const manifestConfigurationTask = defineTask('manifest-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Manifest Configuration - ${args.projectName}`,
  agent: {
    name: 'manifest-engineer',
    prompt: {
      role: 'Subgraph Manifest Engineer',
      task: 'Configure subgraph manifest',
      context: args,
      instructions: ['1. Define data sources', '2. Configure ABIs', '3. Set start blocks', '4. Define event handlers', '5. Add call handlers', '6. Configure block handlers', '7. Add templates', '8. Configure features', '9. Validate manifest', '10. Document configuration'],
      outputFormat: 'JSON with manifest configuration'
    },
    outputSchema: { type: 'object', required: ['manifest', 'dataSources', 'artifacts'], properties: { manifest: { type: 'object' }, dataSources: { type: 'array' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'manifest']
}));

export const mappingImplementationTask = defineTask('mapping-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mapping Implementation - ${args.projectName}`,
  agent: {
    name: 'mapping-engineer',
    prompt: {
      role: 'Subgraph Mapping Engineer',
      task: 'Implement event mappings',
      context: args,
      instructions: ['1. Implement event handlers', '2. Parse event parameters', '3. Create entities', '4. Update entities', '5. Handle BigInt/BigDecimal', '6. Implement helper functions', '7. Handle errors', '8. Add logging', '9. Test mappings', '10. Document mappings'],
      outputFormat: 'JSON with mapping implementation'
    },
    outputSchema: { type: 'object', required: ['mappings', 'handlers', 'artifacts'], properties: { mappings: { type: 'array' }, handlers: { type: 'array' }, helpers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'mappings']
}));

export const entityHandlersTask = defineTask('entity-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Entity Handlers - ${args.projectName}`,
  agent: {
    name: 'entity-engineer',
    prompt: {
      role: 'Entity Handler Engineer',
      task: 'Implement entity handlers',
      context: args,
      instructions: ['1. Implement create functions', '2. Implement load functions', '3. Add getOrCreate pattern', '4. Handle entity updates', '5. Implement relationships', '6. Add computed fields', '7. Handle deletions', '8. Optimize storage', '9. Test handlers', '10. Document handlers'],
      outputFormat: 'JSON with entity handlers'
    },
    outputSchema: { type: 'object', required: ['handlers', 'patterns', 'artifacts'], properties: { handlers: { type: 'array' }, patterns: { type: 'array' }, optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'entities']
}));

export const derivedFieldsTask = defineTask('derived-fields', (args, taskCtx) => ({
  kind: 'agent',
  title: `Derived Fields - ${args.projectName}`,
  agent: {
    name: 'derived-engineer',
    prompt: {
      role: 'Derived Fields Engineer',
      task: 'Implement derived fields',
      context: args,
      instructions: ['1. Identify derived fields', '2. Implement calculations', '3. Handle reverse lookups', '4. Add aggregations', '5. Implement time-series', '6. Add snapshots', '7. Optimize queries', '8. Handle updates', '9. Test derivations', '10. Document fields'],
      outputFormat: 'JSON with derived fields'
    },
    outputSchema: { type: 'object', required: ['derivedFields', 'calculations', 'artifacts'], properties: { derivedFields: { type: 'array' }, calculations: { type: 'array' }, snapshots: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'derived']
}));

export const aggregationsTask = defineTask('aggregations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Aggregations - ${args.projectName}`,
  agent: {
    name: 'aggregation-engineer',
    prompt: {
      role: 'Aggregation Engineer',
      task: 'Implement data aggregations',
      context: args,
      instructions: ['1. Design aggregation entities', '2. Implement hourly aggregations', '3. Add daily aggregations', '4. Implement running totals', '5. Add historical snapshots', '6. Implement TVL tracking', '7. Add volume tracking', '8. Optimize storage', '9. Test aggregations', '10. Document aggregations'],
      outputFormat: 'JSON with aggregations'
    },
    outputSchema: { type: 'object', required: ['aggregations', 'intervals', 'artifacts'], properties: { aggregations: { type: 'array' }, intervals: { type: 'array' }, snapshots: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'aggregations']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Optimization - ${args.projectName}`,
  agent: {
    name: 'perf-engineer',
    prompt: {
      role: 'Subgraph Performance Engineer',
      task: 'Optimize subgraph performance',
      context: args,
      instructions: ['1. Optimize indexing speed', '2. Reduce storage usage', '3. Optimize queries', '4. Add indexes', '5. Reduce entity count', '6. Optimize mappings', '7. Handle high-volume events', '8. Benchmark performance', '9. Test at scale', '10. Document optimizations'],
      outputFormat: 'JSON with performance optimization'
    },
    outputSchema: { type: 'object', required: ['optimizations', 'benchmarks', 'artifacts'], properties: { optimizations: { type: 'array' }, benchmarks: { type: 'object' }, indexingSpeed: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'performance']
}));

export const testingDeploymentTask = defineTask('testing-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing and Deployment - ${args.projectName}`,
  agent: {
    name: 'deploy-engineer',
    prompt: {
      role: 'Subgraph Deployment Engineer',
      task: 'Test and deploy subgraph',
      context: args,
      instructions: ['1. Run unit tests', '2. Test locally', '3. Deploy to hosted service', '4. Test queries', '5. Monitor indexing', '6. Verify data accuracy', '7. Test migrations', '8. Configure alerts', '9. Document deployment', '10. Create runbook'],
      outputFormat: 'JSON with testing and deployment'
    },
    outputSchema: { type: 'object', required: ['deployment', 'testResults', 'artifacts'], properties: { deployment: { type: 'object' }, testResults: { type: 'object' }, queryEndpoint: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['subgraph', 'deployment']
}));

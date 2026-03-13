/**
 * @process specializations/ai-agents-conversational/vector-database-setup
 * @description Vector Database Setup and Optimization - Process for selecting, configuring, and optimizing vector databases
 * for semantic search including indexing strategies, metadata filtering, and performance tuning.
 * @inputs { projectName?: string, vectorDb?: string, dataSize?: string, queryPatterns?: array, outputDir?: string }
 * @outputs { success: boolean, dbConfig: object, indexingPipeline: object, queryOptimization: object, performanceBenchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/vector-database-setup', {
 *   projectName: 'enterprise-search',
 *   vectorDb: 'pinecone',
 *   dataSize: 'large',
 *   queryPatterns: ['similarity', 'filtered', 'hybrid']
 * });
 *
 * @references
 * - Pinecone: https://docs.pinecone.io/
 * - Weaviate: https://weaviate.io/developers/weaviate
 * - Chroma: https://docs.trychroma.com/
 * - Qdrant: https://qdrant.tech/documentation/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'vector-db',
    vectorDb = 'chroma',
    dataSize = 'medium',
    queryPatterns = ['similarity'],
    outputDir = 'vector-db-output',
    embeddingDimension = 1536,
    enableMetadataFiltering = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Vector Database Setup for ${projectName}`);

  // ============================================================================
  // PHASE 1: DATABASE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting and configuring database');

  const dbSelection = await ctx.task(dbSelectionTask, {
    projectName,
    vectorDb,
    dataSize,
    queryPatterns,
    embeddingDimension,
    outputDir
  });

  artifacts.push(...dbSelection.artifacts);

  // ============================================================================
  // PHASE 2: INDEX CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring index');

  const indexConfig = await ctx.task(indexConfigurationTask, {
    projectName,
    vectorDb,
    embeddingDimension,
    dataSize,
    enableMetadataFiltering,
    outputDir
  });

  artifacts.push(...indexConfig.artifacts);

  // ============================================================================
  // PHASE 3: INDEXING PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 3: Building indexing pipeline');

  const indexingPipeline = await ctx.task(indexingPipelineTask, {
    projectName,
    indexConfig: indexConfig.config,
    outputDir
  });

  artifacts.push(...indexingPipeline.artifacts);

  // ============================================================================
  // PHASE 4: METADATA SCHEMA
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining metadata schema');

  const metadataSchema = await ctx.task(metadataSchemaTask, {
    projectName,
    enableMetadataFiltering,
    outputDir
  });

  artifacts.push(...metadataSchema.artifacts);

  // ============================================================================
  // PHASE 5: QUERY OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing queries');

  const queryOptimization = await ctx.task(queryOptimizationTask, {
    projectName,
    queryPatterns,
    indexConfig: indexConfig.config,
    outputDir
  });

  artifacts.push(...queryOptimization.artifacts);

  // ============================================================================
  // PHASE 6: PERFORMANCE BENCHMARKS
  // ============================================================================

  ctx.log('info', 'Phase 6: Running performance benchmarks');

  const benchmarks = await ctx.task(performanceBenchmarksTask, {
    projectName,
    vectorDb,
    indexConfig: indexConfig.config,
    queryPatterns,
    outputDir
  });

  artifacts.push(...benchmarks.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Vector DB ${projectName} setup complete. Query latency p95: ${benchmarks.results.queryLatencyP95}ms. Review configuration?`,
    title: 'Vector Database Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        vectorDb,
        dataSize,
        embeddingDimension,
        queryLatencyP95: benchmarks.results.queryLatencyP95,
        indexingThroughput: benchmarks.results.indexingThroughput
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    dbConfig: dbSelection.config,
    indexingPipeline: indexingPipeline.pipeline,
    queryOptimization: queryOptimization.optimization,
    performanceBenchmarks: benchmarks.results,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/vector-database-setup',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dbSelectionTask = defineTask('db-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Vector Database - ${args.projectName}`,
  agent: {
    name: 'vector-db-specialist',  // AG-RAG-004: Optimizes vector database configuration and indexing
    prompt: {
      role: 'Database Architect',
      task: 'Configure vector database for project',
      context: args,
      instructions: [
        '1. Validate database selection for use case',
        '2. Configure connection settings',
        '3. Set up authentication',
        '4. Configure namespaces/collections',
        '5. Set resource limits',
        '6. Configure replication (if needed)',
        '7. Document configuration',
        '8. Save database config'
      ],
      outputFormat: 'JSON with database config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        connectionString: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vector-db', 'selection']
}));

export const indexConfigurationTask = defineTask('index-configuration', (args, taskCtx) => ({
  kind: 'skill',
  title: `Configure Index - ${args.projectName}`,
  skill: {
    name: 'vector-store-configs',  // SK-RAG-004: Vector store connection and configuration templates
    prompt: {
      role: 'Index Specialist',
      task: 'Configure vector index for optimal performance',
      context: args,
      instructions: [
        '1. Select index type (HNSW, IVF, etc.)',
        '2. Configure dimension and metric',
        '3. Set M and ef parameters for HNSW',
        '4. Configure nlist for IVF',
        '5. Set up sharding for large data',
        '6. Configure metadata indexing',
        '7. Document index config',
        '8. Save index configuration'
      ],
      outputFormat: 'JSON with index config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        indexType: { type: 'string' },
        parameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vector-db', 'index']
}));

export const indexingPipelineTask = defineTask('indexing-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Indexing Pipeline - ${args.projectName}`,
  agent: {
    name: 'pipeline-developer',
    prompt: {
      role: 'Pipeline Developer',
      task: 'Build data indexing pipeline',
      context: args,
      instructions: [
        '1. Create upsert pipeline',
        '2. Implement batch processing',
        '3. Add progress tracking',
        '4. Implement incremental updates',
        '5. Add error handling/retry',
        '6. Configure rate limiting',
        '7. Implement cleanup/delete',
        '8. Save indexing pipeline'
      ],
      outputFormat: 'JSON with indexing pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'artifacts'],
      properties: {
        pipeline: { type: 'object' },
        pipelineCodePath: { type: 'string' },
        batchConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vector-db', 'indexing']
}));

export const metadataSchemaTask = defineTask('metadata-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Metadata Schema - ${args.projectName}`,
  agent: {
    name: 'schema-designer',
    prompt: {
      role: 'Schema Designer',
      task: 'Define metadata schema for filtering',
      context: args,
      instructions: [
        '1. Define metadata fields',
        '2. Set field types (string, number, boolean)',
        '3. Configure filterable fields',
        '4. Define enumerable values',
        '5. Add timestamp fields',
        '6. Configure full-text search fields',
        '7. Document schema',
        '8. Save metadata schema'
      ],
      outputFormat: 'JSON with metadata schema'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        filterableFields: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vector-db', 'metadata']
}));

export const queryOptimizationTask = defineTask('query-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Queries - ${args.projectName}`,
  agent: {
    name: 'query-optimizer',
    prompt: {
      role: 'Query Optimizer',
      task: 'Optimize vector search queries',
      context: args,
      instructions: [
        '1. Tune top-k parameters',
        '2. Configure ef_search for HNSW',
        '3. Optimize filter combinations',
        '4. Implement query caching',
        '5. Configure timeout settings',
        '6. Tune similarity thresholds',
        '7. Test query patterns',
        '8. Save query optimization'
      ],
      outputFormat: 'JSON with query optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimization', 'artifacts'],
      properties: {
        optimization: { type: 'object' },
        queryTemplates: { type: 'array' },
        cacheConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vector-db', 'optimization']
}));

export const performanceBenchmarksTask = defineTask('performance-benchmarks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Benchmarks - ${args.projectName}`,
  agent: {
    name: 'performance-tester',
    prompt: {
      role: 'Performance Tester',
      task: 'Benchmark vector database performance',
      context: args,
      instructions: [
        '1. Measure indexing throughput',
        '2. Measure query latency (p50, p95, p99)',
        '3. Test concurrent query performance',
        '4. Measure memory usage',
        '5. Test filtered query performance',
        '6. Compare with baseline',
        '7. Generate performance report',
        '8. Save benchmark results'
      ],
      outputFormat: 'JSON with benchmark results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            indexingThroughput: { type: 'number' },
            queryLatencyP50: { type: 'number' },
            queryLatencyP95: { type: 'number' },
            queryLatencyP99: { type: 'number' },
            concurrentQPS: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vector-db', 'benchmarks']
}));

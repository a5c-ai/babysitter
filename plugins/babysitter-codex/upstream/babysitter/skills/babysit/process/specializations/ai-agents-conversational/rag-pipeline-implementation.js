/**
 * @process specializations/ai-agents-conversational/rag-pipeline-implementation
 * @description RAG Pipeline Design and Implementation - Comprehensive process for building RAG pipelines including
 * document ingestion, chunking strategies, embedding generation, vector storage, retrieval, and generation.
 * @inputs { pipelineName?: string, documentSources?: array, vectorDb?: string, embeddingModel?: string, outputDir?: string }
 * @outputs { success: boolean, ragPipeline: object, indexingSystem: object, retrievalLogic: object, evaluationMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/rag-pipeline-implementation', {
 *   pipelineName: 'docs-qa-system',
 *   documentSources: ['confluence', 'github-docs'],
 *   vectorDb: 'pinecone',
 *   embeddingModel: 'text-embedding-3-small'
 * });
 *
 * @references
 * - LlamaIndex RAG: https://docs.llamaindex.ai/en/stable/
 * - LangChain RAG: https://python.langchain.com/docs/use_cases/question_answering/
 * - Pinecone: https://docs.pinecone.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    pipelineName = 'rag-pipeline',
    documentSources = [],
    vectorDb = 'chroma',
    embeddingModel = 'text-embedding-3-small',
    outputDir = 'rag-pipeline-output',
    chunkSize = 512,
    chunkOverlap = 50
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RAG Pipeline Implementation for ${pipelineName}`);

  // ============================================================================
  // PHASE 1: DOCUMENT INGESTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up document ingestion');

  const documentIngestion = await ctx.task(documentIngestionTask, {
    pipelineName,
    documentSources,
    outputDir
  });

  artifacts.push(...documentIngestion.artifacts);

  // ============================================================================
  // PHASE 2: CHUNKING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing chunking strategy');

  const chunkingStrategy = await ctx.task(chunkingStrategyTask, {
    pipelineName,
    chunkSize,
    chunkOverlap,
    documentTypes: documentIngestion.documentTypes,
    outputDir
  });

  artifacts.push(...chunkingStrategy.artifacts);

  // ============================================================================
  // PHASE 3: EMBEDDING GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up embedding generation');

  const embeddingGeneration = await ctx.task(embeddingGenerationTask, {
    pipelineName,
    embeddingModel,
    chunkingStrategy: chunkingStrategy.strategy,
    outputDir
  });

  artifacts.push(...embeddingGeneration.artifacts);

  // ============================================================================
  // PHASE 4: VECTOR STORAGE
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring vector storage');

  const vectorStorage = await ctx.task(vectorStorageTask, {
    pipelineName,
    vectorDb,
    embeddingDimension: embeddingGeneration.dimension,
    outputDir
  });

  artifacts.push(...vectorStorage.artifacts);

  // ============================================================================
  // PHASE 5: RETRIEVAL LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing retrieval logic');

  const retrievalLogic = await ctx.task(retrievalLogicTask, {
    pipelineName,
    vectorStorage: vectorStorage.config,
    outputDir
  });

  artifacts.push(...retrievalLogic.artifacts);

  // ============================================================================
  // PHASE 6: GENERATION PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 6: Building generation pipeline');

  const generationPipeline = await ctx.task(generationPipelineTask, {
    pipelineName,
    retrievalLogic: retrievalLogic.retriever,
    outputDir
  });

  artifacts.push(...generationPipeline.artifacts);

  // ============================================================================
  // PHASE 7: EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating RAG pipeline');

  const evaluation = await ctx.task(ragEvaluationTask, {
    pipelineName,
    pipeline: generationPipeline.pipeline,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `RAG Pipeline ${pipelineName} complete. Retrieval accuracy: ${evaluation.metrics.retrievalAccuracy}%, Generation quality: ${evaluation.metrics.generationQuality}. Review pipeline?`,
    title: 'RAG Pipeline Review',
    context: {
      runId: ctx.runId,
      summary: {
        pipelineName,
        vectorDb,
        embeddingModel,
        chunkSize,
        retrievalAccuracy: evaluation.metrics.retrievalAccuracy,
        generationQuality: evaluation.metrics.generationQuality
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    pipelineName,
    ragPipeline: generationPipeline.pipeline,
    indexingSystem: {
      ingestion: documentIngestion.system,
      chunking: chunkingStrategy.strategy,
      embedding: embeddingGeneration.generator
    },
    retrievalLogic: retrievalLogic.retriever,
    evaluationMetrics: evaluation.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/rag-pipeline-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const documentIngestionTask = defineTask('document-ingestion', (args, taskCtx) => ({
  kind: 'skill',
  title: `Setup Document Ingestion - ${args.pipelineName}`,
  skill: {
    name: 'document-loaders',  // SK-RAG-001: Document loader configurations for various file types
    prompt: {
      role: 'Data Engineer',
      task: 'Setup document ingestion pipeline',
      context: args,
      instructions: [
        '1. Configure document loaders for each source',
        '2. Implement format conversion (PDF, HTML, MD)',
        '3. Add metadata extraction',
        '4. Handle encoding issues',
        '5. Implement incremental ingestion',
        '6. Add document deduplication',
        '7. Create ingestion monitoring',
        '8. Save ingestion system'
      ],
      outputFormat: 'JSON with ingestion system'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'documentTypes', 'artifacts'],
      properties: {
        system: { type: 'object' },
        documentTypes: { type: 'array' },
        loaders: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rag', 'ingestion']
}));

export const chunkingStrategyTask = defineTask('chunking-strategy', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Chunking - ${args.pipelineName}`,
  skill: {
    name: 'text-splitters',  // SK-RAG-002: Text splitter configurations for semantic chunking
    prompt: {
      role: 'Chunking Specialist',
      task: 'Implement document chunking strategy',
      context: args,
      instructions: [
        '1. Select chunking approach (fixed, semantic, recursive)',
        '2. Configure chunk size and overlap',
        '3. Handle document structure (headers, sections)',
        '4. Preserve metadata in chunks',
        '5. Implement parent-child chunking',
        '6. Handle code blocks and tables',
        '7. Test chunking quality',
        '8. Save chunking strategy'
      ],
      outputFormat: 'JSON with chunking strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        chunkingCodePath: { type: 'string' },
        avgChunkSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rag', 'chunking']
}));

export const embeddingGenerationTask = defineTask('embedding-generation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Setup Embedding Generation - ${args.pipelineName}`,
  skill: {
    name: 'embedding-models',  // SK-RAG-003: Embedding model integration helpers
    prompt: {
      role: 'Embedding Specialist',
      task: 'Setup embedding generation pipeline',
      context: args,
      instructions: [
        '1. Configure embedding model',
        '2. Implement batch embedding',
        '3. Add embedding caching',
        '4. Handle rate limiting',
        '5. Implement embedding normalization',
        '6. Add embedding quality checks',
        '7. Monitor embedding costs',
        '8. Save embedding generator'
      ],
      outputFormat: 'JSON with embedding generator'
    },
    outputSchema: {
      type: 'object',
      required: ['generator', 'dimension', 'artifacts'],
      properties: {
        generator: { type: 'object' },
        dimension: { type: 'number' },
        embeddingCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rag', 'embedding']
}));

export const vectorStorageTask = defineTask('vector-storage', (args, taskCtx) => ({
  kind: 'skill',
  title: `Configure Vector Storage - ${args.pipelineName}`,
  skill: {
    name: 'vector-store-configs',  // SK-RAG-004: Vector store connection and configuration templates
    prompt: {
      role: 'Vector Database Specialist',
      task: 'Configure vector database storage',
      context: args,
      instructions: [
        '1. Initialize vector database',
        '2. Create index with appropriate config',
        '3. Configure metadata filtering',
        '4. Set up namespaces/collections',
        '5. Implement upsert logic',
        '6. Add delete/update operations',
        '7. Configure backup strategy',
        '8. Save vector storage config'
      ],
      outputFormat: 'JSON with vector storage config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        indexName: { type: 'string' },
        storageCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rag', 'vector-db']
}));

export const retrievalLogicTask = defineTask('retrieval-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Retrieval - ${args.pipelineName}`,
  agent: {
    name: 'rag-architect',  // AG-RAG-001: Designs RAG pipelines with optimal retrieval strategies
    prompt: {
      role: 'Retrieval Specialist',
      task: 'Implement retrieval logic',
      context: args,
      instructions: [
        '1. Implement similarity search',
        '2. Add metadata filtering',
        '3. Implement hybrid search (semantic + keyword)',
        '4. Add reranking',
        '5. Configure top-k results',
        '6. Implement MMR for diversity',
        '7. Add retrieval caching',
        '8. Save retrieval logic'
      ],
      outputFormat: 'JSON with retrieval logic'
    },
    outputSchema: {
      type: 'object',
      required: ['retriever', 'artifacts'],
      properties: {
        retriever: { type: 'object' },
        retrievalCodePath: { type: 'string' },
        searchConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rag', 'retrieval']
}));

export const generationPipelineTask = defineTask('generation-pipeline', (args, taskCtx) => ({
  kind: 'skill',
  title: `Build Generation Pipeline - ${args.pipelineName}`,
  skill: {
    name: 'rag-prompt-templates',  // SK-RAG-005: RAG prompt templates for context injection
    prompt: {
      role: 'RAG Developer',
      task: 'Build complete generation pipeline',
      context: args,
      instructions: [
        '1. Create RAG chain',
        '2. Design context injection prompt',
        '3. Implement source citation',
        '4. Add context window management',
        '5. Handle no-results gracefully',
        '6. Add response validation',
        '7. Implement streaming',
        '8. Save generation pipeline'
      ],
      outputFormat: 'JSON with generation pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'artifacts'],
      properties: {
        pipeline: { type: 'object' },
        pipelineCodePath: { type: 'string' },
        promptTemplate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rag', 'generation']
}));

export const ragEvaluationTask = defineTask('rag-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate RAG Pipeline - ${args.pipelineName}`,
  agent: {
    name: 'rag-evaluator',
    prompt: {
      role: 'RAG Evaluator',
      task: 'Evaluate RAG pipeline performance',
      context: args,
      instructions: [
        '1. Create evaluation dataset',
        '2. Measure retrieval accuracy',
        '3. Evaluate context relevance',
        '4. Measure answer accuracy',
        '5. Evaluate faithfulness (no hallucination)',
        '6. Calculate latency metrics',
        '7. Generate evaluation report',
        '8. Save evaluation results'
      ],
      outputFormat: 'JSON with evaluation metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            retrievalAccuracy: { type: 'number' },
            contextRelevance: { type: 'number' },
            answerAccuracy: { type: 'number' },
            faithfulness: { type: 'number' },
            generationQuality: { type: 'number' },
            avgLatency: { type: 'number' }
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
  labels: ['agent', 'rag', 'evaluation']
}));

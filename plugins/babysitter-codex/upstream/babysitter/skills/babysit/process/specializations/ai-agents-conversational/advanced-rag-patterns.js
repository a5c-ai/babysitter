/**
 * @process specializations/ai-agents-conversational/advanced-rag-patterns
 * @description Advanced RAG Pattern Implementation - Process for implementing advanced RAG patterns including
 * hierarchical retrieval, multi-query RAG, agentic RAG, hybrid search, and self-RAG with quality assessment.
 * @inputs { patternName?: string, baseRagPipeline?: object, optimizationGoal?: string, outputDir?: string }
 * @outputs { success: boolean, advancedRetriever: object, queryOptimization: object, reranking: object, qualityMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/advanced-rag-patterns', {
 *   patternName: 'self-rag-qa',
 *   optimizationGoal: 'accuracy',
 *   baseRagPipeline: existingPipeline
 * });
 *
 * @references
 * - Self-RAG: https://arxiv.org/abs/2310.11511
 * - HyDE: https://arxiv.org/abs/2212.10496
 * - LlamaIndex Advanced RAG: https://docs.llamaindex.ai/en/stable/optimizing/advanced_retrieval/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    patternName = 'advanced-rag',
    baseRagPipeline = null,
    optimizationGoal = 'accuracy',
    outputDir = 'advanced-rag-output',
    enableHybridSearch = true,
    enableReranking = true,
    enableSelfRAG = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Advanced RAG Pattern Implementation for ${patternName}`);

  // ============================================================================
  // PHASE 1: PATTERN SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting RAG patterns');

  const patternSelection = await ctx.task(patternSelectionTask, {
    patternName,
    optimizationGoal,
    enableHybridSearch,
    enableReranking,
    enableSelfRAG,
    outputDir
  });

  artifacts.push(...patternSelection.artifacts);

  // ============================================================================
  // PHASE 2: MULTI-QUERY RAG
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing multi-query RAG');

  const multiQueryRag = await ctx.task(multiQueryRagTask, {
    patternName,
    patterns: patternSelection.selectedPatterns,
    outputDir
  });

  artifacts.push(...multiQueryRag.artifacts);

  // ============================================================================
  // PHASE 3: HIERARCHICAL RETRIEVAL
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing hierarchical retrieval');

  const hierarchicalRetrieval = await ctx.task(hierarchicalRetrievalTask, {
    patternName,
    outputDir
  });

  artifacts.push(...hierarchicalRetrieval.artifacts);

  // ============================================================================
  // PHASE 4: HYBRID SEARCH
  // ============================================================================

  let hybridSearch = null;
  if (enableHybridSearch) {
    ctx.log('info', 'Phase 4: Implementing hybrid search');

    hybridSearch = await ctx.task(hybridSearchTask, {
      patternName,
      outputDir
    });

    artifacts.push(...hybridSearch.artifacts);
  }

  // ============================================================================
  // PHASE 5: RERANKING
  // ============================================================================

  let reranking = null;
  if (enableReranking) {
    ctx.log('info', 'Phase 5: Implementing reranking');

    reranking = await ctx.task(rerankingTask, {
      patternName,
      outputDir
    });

    artifacts.push(...reranking.artifacts);
  }

  // ============================================================================
  // PHASE 6: SELF-RAG
  // ============================================================================

  let selfRag = null;
  if (enableSelfRAG) {
    ctx.log('info', 'Phase 6: Implementing Self-RAG');

    selfRag = await ctx.task(selfRagTask, {
      patternName,
      outputDir
    });

    artifacts.push(...selfRag.artifacts);
  }

  // ============================================================================
  // PHASE 7: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing quality assessment');

  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    patternName,
    multiQueryRag: multiQueryRag.implementation,
    hierarchicalRetrieval: hierarchicalRetrieval.implementation,
    hybridSearch,
    reranking,
    selfRag,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Advanced RAG ${patternName} complete. Quality score: ${qualityAssessment.metrics.overallQuality}. Review implementation?`,
    title: 'Advanced RAG Review',
    context: {
      runId: ctx.runId,
      summary: {
        patternName,
        patterns: patternSelection.selectedPatterns,
        enableHybridSearch,
        enableReranking,
        enableSelfRAG,
        qualityScore: qualityAssessment.metrics.overallQuality
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    patternName,
    advancedRetriever: {
      multiQuery: multiQueryRag.implementation,
      hierarchical: hierarchicalRetrieval.implementation,
      hybrid: hybridSearch ? hybridSearch.implementation : null
    },
    queryOptimization: multiQueryRag.queryOptimization,
    reranking: reranking ? reranking.implementation : null,
    selfRag: selfRag ? selfRag.implementation : null,
    qualityMetrics: qualityAssessment.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/advanced-rag-patterns',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const patternSelectionTask = defineTask('pattern-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select RAG Patterns - ${args.patternName}`,
  agent: {
    name: 'advanced-rag-specialist',  // AG-RAG-002: Implements advanced RAG patterns (HyDE, self-RAG, multi-query)
    prompt: {
      role: 'RAG Architect',
      task: 'Select optimal RAG patterns for use case',
      context: args,
      instructions: [
        '1. Analyze optimization goal',
        '2. Evaluate available patterns',
        '3. Select complementary patterns',
        '4. Define pattern composition',
        '5. Document pattern tradeoffs',
        '6. Create implementation plan',
        '7. Save pattern selection'
      ],
      outputFormat: 'JSON with pattern selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedPatterns', 'artifacts'],
      properties: {
        selectedPatterns: { type: 'array' },
        implementationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'advanced-rag', 'patterns']
}));

export const multiQueryRagTask = defineTask('multi-query-rag', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Multi-Query RAG - ${args.patternName}`,
  skill: {
    name: 'retrieval-strategies',  // SK-RAG-006: Retrieval strategy implementations (hybrid, reranking)
    prompt: {
      role: 'RAG Developer',
      task: 'Implement multi-query RAG for comprehensive retrieval',
      context: args,
      instructions: [
        '1. Implement query generation (multiple variations)',
        '2. Use LLM to generate query variations',
        '3. Execute parallel retrieval',
        '4. Implement result fusion (RRF)',
        '5. Handle deduplication',
        '6. Optimize query count',
        '7. Add query caching',
        '8. Save multi-query implementation'
      ],
      outputFormat: 'JSON with multi-query implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'queryOptimization', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        queryOptimization: { type: 'object' },
        codePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'advanced-rag', 'multi-query']
}));

export const hierarchicalRetrievalTask = defineTask('hierarchical-retrieval', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Hierarchical Retrieval - ${args.patternName}`,
  agent: {
    name: 'retrieval-developer',
    prompt: {
      role: 'Retrieval Developer',
      task: 'Implement hierarchical retrieval strategy',
      context: args,
      instructions: [
        '1. Define document hierarchy levels',
        '2. Implement summary-level retrieval',
        '3. Implement detail-level retrieval',
        '4. Create small-to-big retrieval',
        '5. Handle parent-child relationships',
        '6. Implement context expansion',
        '7. Balance granularity',
        '8. Save hierarchical implementation'
      ],
      outputFormat: 'JSON with hierarchical implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        hierarchyConfig: { type: 'object' },
        codePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'advanced-rag', 'hierarchical']
}));

export const hybridSearchTask = defineTask('hybrid-search', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Hybrid Search - ${args.patternName}`,
  skill: {
    name: 'retrieval-strategies',  // SK-RAG-006: Retrieval strategy implementations (hybrid, reranking)
    prompt: {
      role: 'Search Developer',
      task: 'Implement hybrid search (semantic + keyword)',
      context: args,
      instructions: [
        '1. Configure semantic search',
        '2. Configure keyword search (BM25)',
        '3. Implement reciprocal rank fusion',
        '4. Tune fusion weights',
        '5. Handle sparse-dense combination',
        '6. Optimize search latency',
        '7. Test hybrid vs single',
        '8. Save hybrid search implementation'
      ],
      outputFormat: 'JSON with hybrid search'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        fusionConfig: { type: 'object' },
        codePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'advanced-rag', 'hybrid']
}));

export const rerankingTask = defineTask('reranking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Reranking - ${args.patternName}`,
  agent: {
    name: 'reranking-developer',
    prompt: {
      role: 'Reranking Developer',
      task: 'Implement reranking for improved relevance',
      context: args,
      instructions: [
        '1. Select reranking model (Cohere, cross-encoder)',
        '2. Implement initial retrieval',
        '3. Apply reranking to top-N',
        '4. Configure reranking threshold',
        '5. Handle tie-breaking',
        '6. Optimize reranking latency',
        '7. Test reranking impact',
        '8. Save reranking implementation'
      ],
      outputFormat: 'JSON with reranking'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        modelConfig: { type: 'object' },
        codePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'advanced-rag', 'reranking']
}));

export const selfRagTask = defineTask('self-rag', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Self-RAG - ${args.patternName}`,
  agent: {
    name: 'self-rag-developer',
    prompt: {
      role: 'Self-RAG Developer',
      task: 'Implement Self-RAG with retrieval critique',
      context: args,
      instructions: [
        '1. Implement retrieval necessity detection',
        '2. Add relevance critique',
        '3. Implement support verification',
        '4. Add utility assessment',
        '5. Create critique-based filtering',
        '6. Implement iterative refinement',
        '7. Handle low-confidence cases',
        '8. Save Self-RAG implementation'
      ],
      outputFormat: 'JSON with Self-RAG'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        critiqueConfig: { type: 'object' },
        codePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'advanced-rag', 'self-rag']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Assessment - ${args.patternName}`,
  agent: {
    name: 'rag-evaluator',  // AG-RAG-003: Creates RAG evaluation frameworks with RAGAS metrics
    prompt: {
      role: 'Quality Assessor',
      task: 'Assess advanced RAG quality',
      context: args,
      instructions: [
        '1. Create evaluation dataset',
        '2. Measure retrieval precision/recall',
        '3. Evaluate answer relevance',
        '4. Measure hallucination rate',
        '5. Compare to baseline RAG',
        '6. Calculate latency overhead',
        '7. Generate quality report',
        '8. Save assessment results'
      ],
      outputFormat: 'JSON with quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            retrievalPrecision: { type: 'number' },
            retrievalRecall: { type: 'number' },
            answerRelevance: { type: 'number' },
            hallucinationRate: { type: 'number' },
            overallQuality: { type: 'number' },
            latencyOverhead: { type: 'number' }
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
  labels: ['agent', 'advanced-rag', 'quality']
}));

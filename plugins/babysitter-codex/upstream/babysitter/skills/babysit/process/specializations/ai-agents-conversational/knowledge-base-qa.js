/**
 * @process specializations/ai-agents-conversational/knowledge-base-qa
 * @description Knowledge Base QA Agent - Process for building question-answering agents over knowledge
 * bases including document ingestion, retrieval strategies, answer generation, and citation handling.
 * @inputs { agentName?: string, knowledgeSources?: array, retrievalStrategy?: string, outputDir?: string }
 * @outputs { success: boolean, knowledgeBase: object, retrievalEngine: object, qaEngine: object, citationSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/knowledge-base-qa', {
 *   agentName: 'docs-qa-agent',
 *   knowledgeSources: ['./docs', './wiki'],
 *   retrievalStrategy: 'hybrid'
 * });
 *
 * @references
 * - RAGAS: https://docs.ragas.io/
 * - LlamaIndex: https://docs.llamaindex.ai/
 * - Haystack: https://docs.haystack.deepset.ai/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'knowledge-qa-agent',
    knowledgeSources = [],
    retrievalStrategy = 'hybrid',
    outputDir = 'knowledge-qa-output',
    enableCitations = true,
    enableFeedback = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Knowledge Base QA Agent for ${agentName}`);

  // ============================================================================
  // PHASE 1: DOCUMENT INGESTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Ingesting documents');

  const documentIngestion = await ctx.task(documentIngestionTask, {
    agentName,
    knowledgeSources,
    outputDir
  });

  artifacts.push(...documentIngestion.artifacts);

  // ============================================================================
  // PHASE 2: KNOWLEDGE BASE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up knowledge base');

  const knowledgeBase = await ctx.task(knowledgeBaseSetupTask, {
    agentName,
    documents: documentIngestion.documents,
    outputDir
  });

  artifacts.push(...knowledgeBase.artifacts);

  // ============================================================================
  // PHASE 3: RETRIEVAL ENGINE
  // ============================================================================

  ctx.log('info', 'Phase 3: Building retrieval engine');

  const retrievalEngine = await ctx.task(retrievalEngineTask, {
    agentName,
    knowledgeBase: knowledgeBase.config,
    retrievalStrategy,
    outputDir
  });

  artifacts.push(...retrievalEngine.artifacts);

  // ============================================================================
  // PHASE 4: QA ENGINE
  // ============================================================================

  ctx.log('info', 'Phase 4: Building QA engine');

  const qaEngine = await ctx.task(qaEngineTask, {
    agentName,
    retrievalEngine: retrievalEngine.engine,
    outputDir
  });

  artifacts.push(...qaEngine.artifacts);

  // ============================================================================
  // PHASE 5: CITATION SYSTEM
  // ============================================================================

  let citationSystem = null;
  if (enableCitations) {
    ctx.log('info', 'Phase 5: Setting up citation system');

    citationSystem = await ctx.task(citationSystemTask, {
      agentName,
      qaEngine: qaEngine.engine,
      outputDir
    });

    artifacts.push(...citationSystem.artifacts);
  }

  // ============================================================================
  // PHASE 6: FEEDBACK LOOP
  // ============================================================================

  let feedbackLoop = null;
  if (enableFeedback) {
    ctx.log('info', 'Phase 6: Implementing feedback loop');

    feedbackLoop = await ctx.task(feedbackLoopTask, {
      agentName,
      qaEngine: qaEngine.engine,
      outputDir
    });

    artifacts.push(...feedbackLoop.artifacts);
  }

  // ============================================================================
  // PHASE 7: QA EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating QA quality');

  const qaEvaluation = await ctx.task(qaEvaluationTask, {
    agentName,
    qaEngine: qaEngine.engine,
    retrievalEngine: retrievalEngine.engine,
    outputDir
  });

  artifacts.push(...qaEvaluation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Knowledge QA agent ${agentName} complete. Answer accuracy: ${qaEvaluation.results.answerAccuracy}. Review implementation?`,
    title: 'Knowledge QA Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        documentCount: documentIngestion.documents.length,
        retrievalStrategy,
        answerAccuracy: qaEvaluation.results.answerAccuracy
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    knowledgeBase: knowledgeBase.config,
    retrievalEngine: retrievalEngine.engine,
    qaEngine: qaEngine.engine,
    citationSystem: citationSystem ? citationSystem.system : null,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/knowledge-base-qa',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const documentIngestionTask = defineTask('document-ingestion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ingest Documents - ${args.agentName}`,
  agent: {
    name: 'rag-architect',  // AG-RAG-001: Designs end-to-end RAG pipelines with optimal retrieval strategies
    prompt: {
      role: 'Document Ingestion Developer',
      task: 'Ingest documents into knowledge base',
      context: args,
      instructions: [
        '1. Parse document sources',
        '2. Extract text content',
        '3. Handle multiple formats',
        '4. Extract metadata',
        '5. Clean and normalize',
        '6. Chunk documents',
        '7. Generate embeddings',
        '8. Save ingested documents'
      ],
      outputFormat: 'JSON with ingested documents'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'artifacts'],
      properties: {
        documents: { type: 'array' },
        ingestionCodePath: { type: 'string' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-qa', 'ingestion']
}));

export const knowledgeBaseSetupTask = defineTask('knowledge-base-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Knowledge Base - ${args.agentName}`,
  agent: {
    name: 'kb-developer',
    prompt: {
      role: 'Knowledge Base Developer',
      task: 'Setup knowledge base infrastructure',
      context: args,
      instructions: [
        '1. Configure vector store',
        '2. Setup document store',
        '3. Create indices',
        '4. Add metadata filtering',
        '5. Configure caching',
        '6. Setup update pipeline',
        '7. Test knowledge base',
        '8. Save KB configuration'
      ],
      outputFormat: 'JSON with knowledge base config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        kbCodePath: { type: 'string' },
        indexConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-qa', 'kb']
}));

export const retrievalEngineTask = defineTask('retrieval-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Retrieval Engine - ${args.agentName}`,
  agent: {
    name: 'retrieval-developer',
    prompt: {
      role: 'Retrieval Engine Developer',
      task: 'Build document retrieval engine',
      context: args,
      instructions: [
        '1. Implement vector search',
        '2. Add keyword search',
        '3. Implement hybrid search',
        '4. Add re-ranking',
        '5. Configure top-k selection',
        '6. Add query expansion',
        '7. Test retrieval quality',
        '8. Save retrieval engine'
      ],
      outputFormat: 'JSON with retrieval engine'
    },
    outputSchema: {
      type: 'object',
      required: ['engine', 'artifacts'],
      properties: {
        engine: { type: 'object' },
        retrievalCodePath: { type: 'string' },
        retrievalConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-qa', 'retrieval']
}));

export const qaEngineTask = defineTask('qa-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build QA Engine - ${args.agentName}`,
  agent: {
    name: 'qa-developer',
    prompt: {
      role: 'QA Engine Developer',
      task: 'Build question-answering engine',
      context: args,
      instructions: [
        '1. Create QA prompts',
        '2. Implement context injection',
        '3. Add answer generation',
        '4. Handle "I don\'t know"',
        '5. Implement follow-ups',
        '6. Add answer validation',
        '7. Test QA quality',
        '8. Save QA engine'
      ],
      outputFormat: 'JSON with QA engine'
    },
    outputSchema: {
      type: 'object',
      required: ['engine', 'artifacts'],
      properties: {
        engine: { type: 'object' },
        qaCodePath: { type: 'string' },
        qaPrompts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-qa', 'qa']
}));

export const citationSystemTask = defineTask('citation-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Citation System - ${args.agentName}`,
  agent: {
    name: 'citation-developer',
    prompt: {
      role: 'Citation System Developer',
      task: 'Setup answer citation system',
      context: args,
      instructions: [
        '1. Extract source references',
        '2. Map answers to sources',
        '3. Generate inline citations',
        '4. Create source links',
        '5. Add citation formatting',
        '6. Verify citation accuracy',
        '7. Test citation quality',
        '8. Save citation system'
      ],
      outputFormat: 'JSON with citation system'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: { type: 'object' },
        citationCodePath: { type: 'string' },
        citationFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-qa', 'citations']
}));

export const feedbackLoopTask = defineTask('feedback-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Feedback Loop - ${args.agentName}`,
  agent: {
    name: 'feedback-developer',
    prompt: {
      role: 'Feedback Loop Developer',
      task: 'Implement user feedback loop',
      context: args,
      instructions: [
        '1. Add answer rating',
        '2. Track helpful/unhelpful',
        '3. Collect corrections',
        '4. Implement learning',
        '5. Add feedback analytics',
        '6. Create improvement reports',
        '7. Test feedback pipeline',
        '8. Save feedback system'
      ],
      outputFormat: 'JSON with feedback loop'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: { type: 'object' },
        feedbackCodePath: { type: 'string' },
        analyticsConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-qa', 'feedback']
}));

export const qaEvaluationTask = defineTask('qa-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate QA Quality - ${args.agentName}`,
  agent: {
    name: 'evaluation-developer',
    prompt: {
      role: 'QA Evaluation Developer',
      task: 'Evaluate question-answering quality',
      context: args,
      instructions: [
        '1. Create evaluation dataset',
        '2. Measure answer accuracy',
        '3. Evaluate retrieval quality',
        '4. Test faithfulness',
        '5. Measure answer relevance',
        '6. Calculate RAGAS metrics',
        '7. Generate evaluation report',
        '8. Save evaluation results'
      ],
      outputFormat: 'JSON with evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            answerAccuracy: { type: 'number' },
            retrievalPrecision: { type: 'number' },
            faithfulness: { type: 'number' },
            answerRelevance: { type: 'number' }
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
  labels: ['agent', 'knowledge-qa', 'evaluation']
}));

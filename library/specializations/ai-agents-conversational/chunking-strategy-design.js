/**
 * @process specializations/ai-agents-conversational/chunking-strategy-design
 * @description Chunking Strategy Design and Testing - Process for designing and testing document chunking strategies
 * including fixed-size, semantic, recursive splitting, and small-to-big retrieval patterns.
 * @inputs { projectName?: string, documentTypes?: array, targetChunkSize?: number, outputDir?: string }
 * @outputs { success: boolean, chunkingImplementation: object, evaluationMetrics: object, optimalParameters: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/chunking-strategy-design', {
 *   projectName: 'docs-chunking',
 *   documentTypes: ['markdown', 'pdf', 'html'],
 *   targetChunkSize: 512
 * });
 *
 * @references
 * - LangChain Text Splitters: https://python.langchain.com/docs/modules/data_connection/document_transformers/
 * - LlamaIndex Node Parsers: https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'chunking-strategy',
    documentTypes = ['text'],
    targetChunkSize = 512,
    outputDir = 'chunking-output',
    chunkOverlap = 50,
    enableSemanticChunking = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Chunking Strategy Design for ${projectName}`);

  // ============================================================================
  // PHASE 1: DOCUMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing document characteristics');

  const documentAnalysis = await ctx.task(documentAnalysisTask, {
    projectName,
    documentTypes,
    outputDir
  });

  artifacts.push(...documentAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting chunking strategies');

  const strategySelection = await ctx.task(strategySelectionTask, {
    projectName,
    documentTypes,
    targetChunkSize,
    documentAnalysis: documentAnalysis.analysis,
    enableSemanticChunking,
    outputDir
  });

  artifacts.push(...strategySelection.artifacts);

  // ============================================================================
  // PHASE 3: IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing chunking strategies');

  const implementation = await ctx.task(chunkingImplementationTask, {
    projectName,
    strategies: strategySelection.strategies,
    targetChunkSize,
    chunkOverlap,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // ============================================================================
  // PHASE 4: PARAMETER TUNING
  // ============================================================================

  ctx.log('info', 'Phase 4: Tuning chunking parameters');

  const parameterTuning = await ctx.task(parameterTuningTask, {
    projectName,
    implementation: implementation.implementation,
    targetChunkSize,
    outputDir
  });

  artifacts.push(...parameterTuning.artifacts);

  // ============================================================================
  // PHASE 5: EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating chunking quality');

  const evaluation = await ctx.task(chunkingEvaluationTask, {
    projectName,
    implementation: implementation.implementation,
    optimalParams: parameterTuning.optimalParams,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Chunking strategy ${projectName} complete. Avg chunk quality: ${evaluation.metrics.avgQuality}. Review implementation?`,
    title: 'Chunking Strategy Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        documentTypes,
        targetChunkSize,
        selectedStrategies: strategySelection.strategies,
        avgQuality: evaluation.metrics.avgQuality
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    chunkingImplementation: implementation.implementation,
    evaluationMetrics: evaluation.metrics,
    optimalParameters: parameterTuning.optimalParams,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/chunking-strategy-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const documentAnalysisTask = defineTask('document-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Documents - ${args.projectName}`,
  agent: {
    name: 'chunking-specialist',  // AG-RAG-005: Designs chunking strategies for different document types
    prompt: {
      role: 'Document Analyst',
      task: 'Analyze document characteristics for chunking',
      context: args,
      instructions: [
        '1. Analyze document structure',
        '2. Identify headers and sections',
        '3. Measure average sentence length',
        '4. Identify code blocks and tables',
        '5. Analyze paragraph patterns',
        '6. Document type-specific features',
        '7. Create document profile',
        '8. Save document analysis'
      ],
      outputFormat: 'JSON with document analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        documentProfiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chunking', 'analysis']
}));

export const strategySelectionTask = defineTask('strategy-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Strategies - ${args.projectName}`,
  agent: {
    name: 'chunking-architect',
    prompt: {
      role: 'Chunking Architect',
      task: 'Select optimal chunking strategies',
      context: args,
      instructions: [
        '1. Evaluate fixed-size chunking',
        '2. Evaluate recursive character splitting',
        '3. Evaluate semantic chunking',
        '4. Evaluate markdown/code-aware splitting',
        '5. Consider document type requirements',
        '6. Select primary and fallback strategies',
        '7. Document tradeoffs',
        '8. Save strategy selection'
      ],
      outputFormat: 'JSON with strategy selection'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chunking', 'strategy']
}));

export const chunkingImplementationTask = defineTask('chunking-implementation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Chunking - ${args.projectName}`,
  skill: {
    name: 'text-splitters',  // SK-RAG-002: Text splitter configurations for semantic chunking
    prompt: {
      role: 'Chunking Developer',
      task: 'Implement chunking strategies',
      context: args,
      instructions: [
        '1. Implement selected strategies',
        '2. Handle overlap configuration',
        '3. Preserve metadata in chunks',
        '4. Handle special content (code, tables)',
        '5. Implement chunk post-processing',
        '6. Add chunk validation',
        '7. Create chunking pipeline',
        '8. Save implementation'
      ],
      outputFormat: 'JSON with chunking implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        chunkingCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chunking', 'implementation']
}));

export const parameterTuningTask = defineTask('parameter-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tune Parameters - ${args.projectName}`,
  agent: {
    name: 'parameter-tuner',
    prompt: {
      role: 'Parameter Tuner',
      task: 'Tune chunking parameters for optimal results',
      context: args,
      instructions: [
        '1. Test different chunk sizes',
        '2. Test different overlap values',
        '3. Measure chunk quality metrics',
        '4. Optimize for retrieval performance',
        '5. Balance size vs context',
        '6. Find optimal parameters',
        '7. Document parameter choices',
        '8. Save optimal parameters'
      ],
      outputFormat: 'JSON with optimal parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalParams', 'artifacts'],
      properties: {
        optimalParams: {
          type: 'object',
          properties: {
            chunkSize: { type: 'number' },
            chunkOverlap: { type: 'number' },
            strategy: { type: 'string' }
          }
        },
        tuningResults: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chunking', 'tuning']
}));

export const chunkingEvaluationTask = defineTask('chunking-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Chunking - ${args.projectName}`,
  agent: {
    name: 'chunking-evaluator',
    prompt: {
      role: 'Chunking Evaluator',
      task: 'Evaluate chunking quality',
      context: args,
      instructions: [
        '1. Measure chunk size distribution',
        '2. Evaluate semantic coherence',
        '3. Check boundary quality',
        '4. Measure context preservation',
        '5. Test retrieval with chunks',
        '6. Calculate overall quality score',
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
            avgChunkSize: { type: 'number' },
            sizeVariance: { type: 'number' },
            semanticCoherence: { type: 'number' },
            boundaryQuality: { type: 'number' },
            avgQuality: { type: 'number' }
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
  labels: ['agent', 'chunking', 'evaluation']
}));

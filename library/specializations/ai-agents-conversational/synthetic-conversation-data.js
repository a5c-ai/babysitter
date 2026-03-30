/**
 * @process specializations/ai-agents-conversational/synthetic-conversation-data
 * @description Synthetic Conversation Data Generation - Process for generating high-quality synthetic
 * conversation data for training and testing conversational AI systems using LLM-based generation.
 * @inputs { datasetName?: string, scenarios?: array, targetSize?: number, outputDir?: string }
 * @outputs { success: boolean, generatedDataset: object, qualityMetrics: object, diversityAnalysis: object, exportedData: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/synthetic-conversation-data', {
 *   datasetName: 'customer-support-synthetic',
 *   scenarios: ['order-tracking', 'refund-request', 'product-inquiry'],
 *   targetSize: 10000
 * });
 *
 * @references
 * - Self-Instruct: https://arxiv.org/abs/2212.10560
 * - Evol-Instruct: https://arxiv.org/abs/2304.12244
 * - Genstruct: https://huggingface.co/NousResearch/Genstruct-7B
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    datasetName = 'synthetic-conversations',
    scenarios = ['general'],
    targetSize = 1000,
    outputDir = 'synthetic-data-output',
    enableEvolution = true,
    qualityThreshold = 0.8
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Synthetic Conversation Generation for ${datasetName}`);

  // ============================================================================
  // PHASE 1: SCENARIO DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining generation scenarios');

  const scenarioDefinition = await ctx.task(scenarioDefinitionTask, {
    datasetName,
    scenarios,
    outputDir
  });

  artifacts.push(...scenarioDefinition.artifacts);

  // ============================================================================
  // PHASE 2: SEED GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Generating seed conversations');

  const seedGeneration = await ctx.task(seedGenerationTask, {
    datasetName,
    scenarios: scenarioDefinition.scenarios,
    outputDir
  });

  artifacts.push(...seedGeneration.artifacts);

  // ============================================================================
  // PHASE 3: CONVERSATION EVOLUTION
  // ============================================================================

  let evolution = null;
  if (enableEvolution) {
    ctx.log('info', 'Phase 3: Evolving conversations');

    evolution = await ctx.task(conversationEvolutionTask, {
      datasetName,
      seedConversations: seedGeneration.conversations,
      targetSize,
      outputDir
    });

    artifacts.push(...evolution.artifacts);
  }

  // ============================================================================
  // PHASE 4: QUALITY FILTERING
  // ============================================================================

  ctx.log('info', 'Phase 4: Filtering for quality');

  const qualityFiltering = await ctx.task(qualityFilteringTask, {
    datasetName,
    conversations: evolution ? evolution.conversations : seedGeneration.conversations,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityFiltering.artifacts);

  // ============================================================================
  // PHASE 5: DIVERSITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing diversity');

  const diversityAnalysis = await ctx.task(diversityAnalysisTask, {
    datasetName,
    filteredConversations: qualityFiltering.filteredConversations,
    outputDir
  });

  artifacts.push(...diversityAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: DATA EXPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Exporting dataset');

  const dataExport = await ctx.task(dataExportTask, {
    datasetName,
    conversations: qualityFiltering.filteredConversations,
    qualityMetrics: qualityFiltering.metrics,
    diversityAnalysis: diversityAnalysis.analysis,
    outputDir
  });

  artifacts.push(...dataExport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Synthetic dataset ${datasetName} generated. Size: ${qualityFiltering.filteredConversations.length}, Quality: ${qualityFiltering.metrics.avgQuality}. Review dataset?`,
    title: 'Synthetic Data Review',
    context: {
      runId: ctx.runId,
      summary: {
        datasetName,
        scenarios,
        totalGenerated: evolution ? evolution.conversations.length : seedGeneration.conversations.length,
        afterFiltering: qualityFiltering.filteredConversations.length,
        avgQuality: qualityFiltering.metrics.avgQuality
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'jsonl' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    datasetName,
    generatedDataset: {
      size: qualityFiltering.filteredConversations.length,
      path: dataExport.datasetPath
    },
    qualityMetrics: qualityFiltering.metrics,
    diversityAnalysis: diversityAnalysis.analysis,
    exportedData: dataExport.exports,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/synthetic-conversation-data',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const scenarioDefinitionTask = defineTask('scenario-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Scenarios - ${args.datasetName}`,
  agent: {
    name: 'synthetic-data-generator',  // AG-DOM-004: Creates synthetic conversation training data
    prompt: {
      role: 'Scenario Designer',
      task: 'Define conversation generation scenarios',
      context: args,
      instructions: [
        '1. Expand scenario categories',
        '2. Define user personas',
        '3. Create intent templates',
        '4. Define conversation flows',
        '5. Add complexity variations',
        '6. Define success criteria',
        '7. Create scenario specs',
        '8. Save scenario definitions'
      ],
      outputFormat: 'JSON with scenario definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        personas: { type: 'array' },
        intentTemplates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthetic-data', 'scenarios']
}));

export const seedGenerationTask = defineTask('seed-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Seeds - ${args.datasetName}`,
  agent: {
    name: 'seed-generator',
    prompt: {
      role: 'Seed Conversation Generator',
      task: 'Generate seed conversations',
      context: args,
      instructions: [
        '1. Generate diverse seed conversations',
        '2. Cover all scenarios',
        '3. Vary conversation lengths',
        '4. Include multi-turn dialogues',
        '5. Add realistic user behaviors',
        '6. Include edge cases',
        '7. Validate coherence',
        '8. Save seed conversations'
      ],
      outputFormat: 'JSON with seed conversations'
    },
    outputSchema: {
      type: 'object',
      required: ['conversations', 'artifacts'],
      properties: {
        conversations: { type: 'array' },
        seedDataPath: { type: 'string' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthetic-data', 'seeds']
}));

export const conversationEvolutionTask = defineTask('conversation-evolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evolve Conversations - ${args.datasetName}`,
  agent: {
    name: 'evolution-generator',
    prompt: {
      role: 'Conversation Evolution Generator',
      task: 'Evolve and expand conversations using Evol-Instruct',
      context: args,
      instructions: [
        '1. Apply complexity evolution',
        '2. Add breadth variations',
        '3. Create paraphrases',
        '4. Add context variations',
        '5. Generate edge cases',
        '6. Maintain coherence',
        '7. Track evolution lineage',
        '8. Save evolved conversations'
      ],
      outputFormat: 'JSON with evolved conversations'
    },
    outputSchema: {
      type: 'object',
      required: ['conversations', 'artifacts'],
      properties: {
        conversations: { type: 'array' },
        evolutionPath: { type: 'string' },
        evolutionStats: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthetic-data', 'evolution']
}));

export const qualityFilteringTask = defineTask('quality-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Filter Quality - ${args.datasetName}`,
  agent: {
    name: 'quality-filter',
    prompt: {
      role: 'Quality Filter',
      task: 'Filter conversations by quality',
      context: args,
      instructions: [
        '1. Score conversation quality',
        '2. Check coherence',
        '3. Validate correctness',
        '4. Check for hallucinations',
        '5. Filter by threshold',
        '6. Remove duplicates',
        '7. Calculate quality metrics',
        '8. Save filtered conversations'
      ],
      outputFormat: 'JSON with filtered conversations'
    },
    outputSchema: {
      type: 'object',
      required: ['filteredConversations', 'metrics', 'artifacts'],
      properties: {
        filteredConversations: { type: 'array' },
        metrics: {
          type: 'object',
          properties: {
            avgQuality: { type: 'number' },
            passRate: { type: 'number' }
          }
        },
        filterPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthetic-data', 'quality']
}));

export const diversityAnalysisTask = defineTask('diversity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Diversity - ${args.datasetName}`,
  agent: {
    name: 'diversity-analyzer',
    prompt: {
      role: 'Diversity Analyzer',
      task: 'Analyze dataset diversity',
      context: args,
      instructions: [
        '1. Calculate lexical diversity',
        '2. Analyze semantic coverage',
        '3. Check scenario distribution',
        '4. Analyze length distribution',
        '5. Check intent coverage',
        '6. Identify gaps',
        '7. Generate diversity report',
        '8. Save diversity analysis'
      ],
      outputFormat: 'JSON with diversity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        diversityScore: { type: 'number' },
        gaps: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthetic-data', 'diversity']
}));

export const dataExportTask = defineTask('data-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Export Dataset - ${args.datasetName}`,
  agent: {
    name: 'data-exporter',
    prompt: {
      role: 'Data Export Specialist',
      task: 'Export synthetic dataset',
      context: args,
      instructions: [
        '1. Format for fine-tuning',
        '2. Export to JSONL',
        '3. Create train/eval splits',
        '4. Generate dataset card',
        '5. Add metadata',
        '6. Create statistics file',
        '7. Package for distribution',
        '8. Save exported dataset'
      ],
      outputFormat: 'JSON with exported dataset'
    },
    outputSchema: {
      type: 'object',
      required: ['datasetPath', 'exports', 'artifacts'],
      properties: {
        datasetPath: { type: 'string' },
        exports: {
          type: 'object',
          properties: {
            trainPath: { type: 'string' },
            evalPath: { type: 'string' },
            datasetCardPath: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthetic-data', 'export']
}));

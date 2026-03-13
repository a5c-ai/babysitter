/**
 * @process methodologies/ruflo/ruflo-intelligence
 * @description Ruflo RuVector Intelligence - Self-optimization cycle: pattern extraction -> reasoning bank -> SONA adaptation -> knowledge graph updates
 * @inputs { executionData: object, memoryScope?: string, learningAlgorithm?: string, embeddingDimension?: number, maxPatterns?: number }
 * @outputs { success: boolean, patterns: array, reasoningBank: object, knowledgeGraph: object, optimizations: array, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const extractPatternsTask = defineTask('ruflo-extract-patterns', async (args, _ctx) => {
  return { patterns: args };
}, {
  kind: 'agent',
  title: 'Extract Execution Patterns from Task History',
  labels: ['ruflo', 'ruvector', 'pattern-extraction'],
  io: {
    inputs: { executionData: 'object', memoryScope: 'string' },
    outputs: { patterns: 'array', frequencies: 'object', correlations: 'array', novelPatterns: 'array', patternConfidence: 'object' }
  }
});

const retrieveReasoningTask = defineTask('ruflo-retrieve-reasoning', async (args, _ctx) => {
  return { reasoning: args };
}, {
  kind: 'agent',
  title: 'RETRIEVE: Search ReasoningBank for Matching Trajectories',
  labels: ['ruflo', 'ruvector', 'reasoning-bank', 'retrieve'],
  io: {
    inputs: { patterns: 'array', memoryScope: 'string', topK: 'number' },
    outputs: { matchedTrajectories: 'array', similarityScores: 'array', bankSize: 'number', retrievalLatency: 'string' }
  }
});

const judgeReasoningTask = defineTask('ruflo-judge-reasoning', async (args, _ctx) => {
  return { judgment: args };
}, {
  kind: 'agent',
  title: 'JUDGE: Evaluate Retrieved Trajectories for Current Context',
  labels: ['ruflo', 'ruvector', 'reasoning-bank', 'judge'],
  io: {
    inputs: { matchedTrajectories: 'array', currentContext: 'object', patterns: 'array' },
    outputs: { applicableTrajectories: 'array', rejectedTrajectories: 'array', adaptations: 'array', confidenceScores: 'array' }
  }
});

const distillReasoningTask = defineTask('ruflo-distill-reasoning', async (args, _ctx) => {
  return { distillation: args };
}, {
  kind: 'agent',
  title: 'DISTILL: Compress Learnings into ReasoningBank Entries',
  labels: ['ruflo', 'ruvector', 'reasoning-bank', 'distill'],
  io: {
    inputs: { applicableTrajectories: 'array', newPatterns: 'array', adaptations: 'array' },
    outputs: { newEntries: 'array', updatedEntries: 'array', prunedEntries: 'array', compressionRatio: 'number' }
  }
});

const sonaAdaptTask = defineTask('ruflo-sona-adapt', async (args, _ctx) => {
  return { adaptation: args };
}, {
  kind: 'agent',
  title: 'SONA: Self-Optimizing Neural Architecture Adaptation',
  labels: ['ruflo', 'ruvector', 'sona', 'self-optimization'],
  io: {
    inputs: { patterns: 'array', reasoningBankState: 'object', currentWeights: 'object', learningAlgorithm: 'string' },
    outputs: { updatedWeights: 'object', adaptationDelta: 'number', ewcPenalty: 'number', catastrophicForgettingRisk: 'string', optimizations: 'array' }
  }
});

const updateKnowledgeGraphTask = defineTask('ruflo-update-knowledge-graph', async (args, _ctx) => {
  return { graph: args };
}, {
  kind: 'agent',
  title: 'Update Knowledge Graph with New Patterns and Relations',
  labels: ['ruflo', 'ruvector', 'knowledge-graph'],
  io: {
    inputs: { patterns: 'array', reasoningEntries: 'array', existingGraph: 'object' },
    outputs: { nodesAdded: 'number', edgesAdded: 'number', communitiesDetected: 'array', pageRankUpdated: 'boolean', graphStats: 'object' }
  }
});

const vectorEmbeddingTask = defineTask('ruflo-vector-embedding', async (args, _ctx) => {
  return { embedding: args };
}, {
  kind: 'agent',
  title: 'Generate HNSW Vector Embeddings for Pattern Storage',
  labels: ['ruflo', 'ruvector', 'hnsw', 'embedding'],
  io: {
    inputs: { patterns: 'array', embeddingDimension: 'number', existingIndex: 'object' },
    outputs: { embeddings: 'array', indexSize: 'number', searchLatency: 'string', queryThroughput: 'string', indexUpdated: 'boolean' }
  }
});

const memoryConsolidationTask = defineTask('ruflo-memory-consolidation', async (args, _ctx) => {
  return { consolidation: args };
}, {
  kind: 'agent',
  title: 'Consolidate 3-Tier Memory: Project, Local, User Scopes',
  labels: ['ruflo', 'ruvector', 'memory', 'consolidation'],
  io: {
    inputs: { projectMemory: 'object', localMemory: 'object', userMemory: 'object', newEntries: 'array' },
    outputs: { projectUpdates: 'array', localUpdates: 'array', userUpdates: 'array', promotions: 'array', evictions: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Ruflo RuVector Intelligence Process
 *
 * Implements the RuVector self-learning and self-optimizing cycle:
 * 1. Pattern Extraction - Mine execution data for recurring patterns
 * 2. ReasoningBank RETRIEVE - Search for matching trajectories
 * 3. ReasoningBank JUDGE - Evaluate applicability to current context
 * 4. ReasoningBank DISTILL - Compress and store new learnings
 * 5. SONA Adaptation - Self-Optimizing Neural Architecture update (<0.05ms)
 * 6. Knowledge Graph Update - PageRank, community detection, new relations
 * 7. HNSW Vector Embedding - Index patterns for fast similarity search
 * 8. 3-Tier Memory Consolidation - Project/Local/User scope management
 *
 * Intelligence Components:
 * - SONA: Self-Optimizing Neural Architecture with sub-millisecond adaptation
 * - EWC++: Elastic Weight Consolidation to prevent catastrophic forgetting
 * - ReasoningBank: RETRIEVE -> JUDGE -> DISTILL pipeline for trajectory learning
 * - HNSW: Hierarchical Navigable Small World graph for vector search (61us, 16400 QPS)
 * - 9 RL Algorithms: Q-Learning, SARSA, PPO, DQN, A2C, TD3, SAC, DDPG, Rainbow
 *
 * Memory Tiers:
 * - Project scope: Codebase-specific patterns and decisions
 * - Local scope: Session-specific adaptations and context
 * - User scope: Cross-project preferences and learned behaviors
 *
 * Attribution: Adapted from https://github.com/ruvnet/ruflo by ruvnet
 *
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.executionData - Data from completed execution
 * @param {string} inputs.memoryScope - project|local|user (default: project)
 * @param {string} inputs.learningAlgorithm - q-learning|sarsa|ppo|dqn (default: q-learning)
 * @param {number} inputs.embeddingDimension - Vector embedding size (default: 128)
 * @param {number} inputs.maxPatterns - Maximum patterns to retain (default: 1000)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Intelligence cycle results
 */
export async function process(inputs, ctx) {
  const {
    executionData,
    memoryScope = 'project',
    learningAlgorithm = 'q-learning',
    embeddingDimension = 128,
    maxPatterns = 1000
  } = inputs;

  ctx.log('RuVector: Starting intelligence cycle', { memoryScope, learningAlgorithm });

  // ============================================================================
  // STEP 1: PATTERN EXTRACTION
  // ============================================================================

  ctx.log('Step 1: Extracting execution patterns');

  const patternResult = await ctx.task(extractPatternsTask, {
    executionData,
    memoryScope
  });

  ctx.log('Patterns extracted', {
    total: patternResult.patterns.length,
    novel: patternResult.novelPatterns.length
  });

  // ============================================================================
  // STEP 2-4: REASONING BANK (RETRIEVE -> JUDGE -> DISTILL)
  // ============================================================================

  ctx.log('Step 2: ReasoningBank RETRIEVE');

  const retrieveResult = await ctx.task(retrieveReasoningTask, {
    patterns: patternResult.patterns,
    memoryScope,
    topK: 10
  });

  ctx.log('Step 3: ReasoningBank JUDGE');

  const judgeResult = await ctx.task(judgeReasoningTask, {
    matchedTrajectories: retrieveResult.matchedTrajectories,
    currentContext: executionData,
    patterns: patternResult.patterns
  });

  ctx.log('Step 4: ReasoningBank DISTILL');

  const distillResult = await ctx.task(distillReasoningTask, {
    applicableTrajectories: judgeResult.applicableTrajectories,
    newPatterns: patternResult.novelPatterns,
    adaptations: judgeResult.adaptations
  });

  ctx.log('ReasoningBank updated', {
    newEntries: distillResult.newEntries.length,
    updated: distillResult.updatedEntries.length,
    pruned: distillResult.prunedEntries.length
  });

  // ============================================================================
  // STEP 5: SONA SELF-OPTIMIZATION
  // ============================================================================

  ctx.log('Step 5: SONA adaptation');

  const sonaResult = await ctx.task(sonaAdaptTask, {
    patterns: patternResult.patterns,
    reasoningBankState: {
      entries: distillResult.newEntries.length + distillResult.updatedEntries.length,
      compressionRatio: distillResult.compressionRatio
    },
    currentWeights: {},
    learningAlgorithm
  });

  ctx.log('SONA adapted', {
    delta: sonaResult.adaptationDelta,
    forgettingRisk: sonaResult.catastrophicForgettingRisk,
    ewcPenalty: sonaResult.ewcPenalty
  });

  if (sonaResult.catastrophicForgettingRisk === 'high') {
    await ctx.breakpoint({
      question: `SONA adaptation has high catastrophic forgetting risk (EWC penalty: ${sonaResult.ewcPenalty}). Review optimizations and approve: ${sonaResult.optimizations.join('; ')}`,
      title: 'RuVector: High Forgetting Risk - Review Adaptation',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 6-7: KNOWLEDGE GRAPH + VECTOR EMBEDDINGS (parallel)
  // ============================================================================

  ctx.log('Steps 6-7: Knowledge graph update and vector embedding (parallel)');

  const [graphResult, embeddingResult] = await ctx.parallel.all([
    ctx.task(updateKnowledgeGraphTask, {
      patterns: patternResult.patterns,
      reasoningEntries: distillResult.newEntries,
      existingGraph: {}
    }),
    ctx.task(vectorEmbeddingTask, {
      patterns: patternResult.patterns,
      embeddingDimension,
      existingIndex: {}
    })
  ]);

  ctx.log('Knowledge graph updated', {
    nodes: graphResult.nodesAdded,
    edges: graphResult.edgesAdded,
    communities: graphResult.communitiesDetected.length
  });

  // ============================================================================
  // STEP 8: 3-TIER MEMORY CONSOLIDATION
  // ============================================================================

  ctx.log('Step 8: Memory consolidation across scopes');

  const consolidationResult = await ctx.task(memoryConsolidationTask, {
    projectMemory: {},
    localMemory: {},
    userMemory: {},
    newEntries: [...distillResult.newEntries, ...distillResult.updatedEntries]
  });

  return {
    success: true,
    patterns: {
      total: patternResult.patterns.length,
      novel: patternResult.novelPatterns.length,
      correlations: patternResult.correlations.length
    },
    reasoningBank: {
      retrieved: retrieveResult.matchedTrajectories.length,
      applicable: judgeResult.applicableTrajectories.length,
      rejected: judgeResult.rejectedTrajectories.length,
      newEntries: distillResult.newEntries.length,
      updatedEntries: distillResult.updatedEntries.length,
      pruned: distillResult.prunedEntries.length,
      compressionRatio: distillResult.compressionRatio
    },
    knowledgeGraph: {
      nodesAdded: graphResult.nodesAdded,
      edgesAdded: graphResult.edgesAdded,
      communities: graphResult.communitiesDetected,
      pageRankUpdated: graphResult.pageRankUpdated
    },
    vectorIndex: {
      indexSize: embeddingResult.indexSize,
      searchLatency: embeddingResult.searchLatency,
      queryThroughput: embeddingResult.queryThroughput,
      dimension: embeddingDimension
    },
    optimizations: sonaResult.optimizations,
    sonaState: {
      adaptationDelta: sonaResult.adaptationDelta,
      ewcPenalty: sonaResult.ewcPenalty,
      forgettingRisk: sonaResult.catastrophicForgettingRisk,
      algorithm: learningAlgorithm
    },
    memoryConsolidation: {
      projectUpdates: consolidationResult.projectUpdates.length,
      localUpdates: consolidationResult.localUpdates.length,
      userUpdates: consolidationResult.userUpdates.length,
      promotions: consolidationResult.promotions.length,
      evictions: consolidationResult.evictions.length
    },
    summary: {
      patternsExtracted: patternResult.patterns.length,
      reasoningBankEntries: distillResult.newEntries.length,
      graphNodesAdded: graphResult.nodesAdded,
      sonaAdaptationDelta: sonaResult.adaptationDelta,
      memoryScope,
      learningAlgorithm
    },
    metadata: {
      processId: 'methodologies/ruflo/ruflo-intelligence',
      attribution: 'https://github.com/ruvnet/ruflo',
      author: 'ruvnet',
      timestamp: ctx.now()
    }
  };
}

/**
 * @process specializations/ai-agents-conversational/conversational-memory-system
 * @description Conversational Memory System Implementation - Process for implementing memory systems for conversational agents
 * including short-term (conversation buffer), long-term (persistent storage), and semantic memory (vector-based retrieval).
 * @inputs { systemName?: string, memoryTypes?: array, storageBackend?: string, outputDir?: string }
 * @outputs { success: boolean, memorySystem: object, storageBackends: object, retrievalLogic: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/conversational-memory-system', {
 *   systemName: 'chatbot-memory',
 *   memoryTypes: ['short-term', 'long-term', 'semantic'],
 *   storageBackend: 'redis'
 * });
 *
 * @references
 * - LangChain Memory: https://python.langchain.com/docs/modules/memory/
 * - Zep: https://docs.getzep.com/
 * - MemGPT: https://memgpt.readme.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'memory-system',
    memoryTypes = ['short-term', 'long-term'],
    storageBackend = 'redis',
    outputDir = 'memory-system-output',
    maxConversationLength = 20,
    enableSummarization = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Conversational Memory System for ${systemName}`);

  // ============================================================================
  // PHASE 1: MEMORY ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing memory architecture');

  const memoryArchitecture = await ctx.task(memoryArchitectureTask, {
    systemName,
    memoryTypes,
    maxConversationLength,
    enableSummarization,
    outputDir
  });

  artifacts.push(...memoryArchitecture.artifacts);

  // ============================================================================
  // PHASE 2: SHORT-TERM MEMORY
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing short-term memory');

  const shortTermMemory = await ctx.task(shortTermMemoryTask, {
    systemName,
    maxConversationLength,
    enableSummarization,
    outputDir
  });

  artifacts.push(...shortTermMemory.artifacts);

  // ============================================================================
  // PHASE 3: LONG-TERM MEMORY
  // ============================================================================

  let longTermMemory = null;
  if (memoryTypes.includes('long-term')) {
    ctx.log('info', 'Phase 3: Implementing long-term memory');

    longTermMemory = await ctx.task(longTermMemoryTask, {
      systemName,
      storageBackend,
      outputDir
    });

    artifacts.push(...longTermMemory.artifacts);
  }

  // ============================================================================
  // PHASE 4: SEMANTIC MEMORY
  // ============================================================================

  let semanticMemory = null;
  if (memoryTypes.includes('semantic')) {
    ctx.log('info', 'Phase 4: Implementing semantic memory');

    semanticMemory = await ctx.task(semanticMemoryTask, {
      systemName,
      outputDir
    });

    artifacts.push(...semanticMemory.artifacts);
  }

  // ============================================================================
  // PHASE 5: MEMORY RETRIEVAL
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing memory retrieval');

  const memoryRetrieval = await ctx.task(memoryRetrievalTask, {
    systemName,
    memoryTypes,
    shortTermMemory: shortTermMemory.memory,
    longTermMemory: longTermMemory ? longTermMemory.memory : null,
    semanticMemory: semanticMemory ? semanticMemory.memory : null,
    outputDir
  });

  artifacts.push(...memoryRetrieval.artifacts);

  // ============================================================================
  // PHASE 6: MEMORY INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating memory system');

  const integration = await ctx.task(memoryIntegrationTask, {
    systemName,
    shortTermMemory: shortTermMemory.memory,
    longTermMemory: longTermMemory ? longTermMemory.memory : null,
    semanticMemory: semanticMemory ? semanticMemory.memory : null,
    retrievalLogic: memoryRetrieval.logic,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Memory system ${systemName} complete. Memory types: ${memoryTypes.join(', ')}. Review implementation?`,
    title: 'Memory System Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        memoryTypes,
        storageBackend,
        maxConversationLength,
        enableSummarization
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    memorySystem: integration.system,
    storageBackends: {
      shortTerm: shortTermMemory.storage,
      longTerm: longTermMemory ? longTermMemory.storage : null,
      semantic: semanticMemory ? semanticMemory.storage : null
    },
    retrievalLogic: memoryRetrieval.logic,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/conversational-memory-system',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const memoryArchitectureTask = defineTask('memory-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Memory Architecture - ${args.systemName}`,
  agent: {
    name: 'memory-architect',  // AG-MEM-001: Designs conversation memory hierarchies (short/long-term)
    prompt: {
      role: 'Memory System Architect',
      task: 'Design conversational memory architecture',
      context: args,
      instructions: [
        '1. Design memory hierarchy',
        '2. Define memory boundaries',
        '3. Plan data flow between memory types',
        '4. Design memory consolidation',
        '5. Plan summarization strategy',
        '6. Define retention policies',
        '7. Create architecture diagram',
        '8. Save architecture design'
      ],
      outputFormat: 'JSON with memory architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        diagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'memory', 'architecture']
}));

export const shortTermMemoryTask = defineTask('short-term-memory', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Short-Term Memory - ${args.systemName}`,
  skill: {
    name: 'conversation-buffer',  // SK-MEM-001: Conversation buffer memory implementations
    prompt: {
      role: 'Memory Developer',
      task: 'Implement short-term conversation memory',
      context: args,
      instructions: [
        '1. Implement conversation buffer',
        '2. Set up sliding window',
        '3. Add message summarization',
        '4. Handle context overflow',
        '5. Implement token counting',
        '6. Add conversation reset',
        '7. Create memory interface',
        '8. Save short-term memory'
      ],
      outputFormat: 'JSON with short-term memory'
    },
    outputSchema: {
      type: 'object',
      required: ['memory', 'storage', 'artifacts'],
      properties: {
        memory: { type: 'object' },
        storage: { type: 'string' },
        memoryCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'memory', 'short-term']
}));

export const longTermMemoryTask = defineTask('long-term-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Long-Term Memory - ${args.systemName}`,
  agent: {
    name: 'persistence-developer',
    prompt: {
      role: 'Persistence Developer',
      task: 'Implement long-term persistent memory',
      context: args,
      instructions: [
        '1. Configure storage backend',
        '2. Design data schema',
        '3. Implement CRUD operations',
        '4. Add session management',
        '5. Implement memory consolidation',
        '6. Add expiration/cleanup',
        '7. Handle cross-session retrieval',
        '8. Save long-term memory'
      ],
      outputFormat: 'JSON with long-term memory'
    },
    outputSchema: {
      type: 'object',
      required: ['memory', 'storage', 'artifacts'],
      properties: {
        memory: { type: 'object' },
        storage: { type: 'string' },
        schema: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'memory', 'long-term']
}));

export const semanticMemoryTask = defineTask('semantic-memory', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Semantic Memory - ${args.systemName}`,
  skill: {
    name: 'semantic-memory-index',  // SK-MEM-003: Semantic memory with vector retrieval
    prompt: {
      role: 'Semantic Memory Developer',
      task: 'Implement vector-based semantic memory',
      context: args,
      instructions: [
        '1. Configure vector store',
        '2. Implement memory embedding',
        '3. Add similarity search',
        '4. Handle memory indexing',
        '5. Implement relevance filtering',
        '6. Add memory deduplication',
        '7. Configure retrieval limits',
        '8. Save semantic memory'
      ],
      outputFormat: 'JSON with semantic memory'
    },
    outputSchema: {
      type: 'object',
      required: ['memory', 'storage', 'artifacts'],
      properties: {
        memory: { type: 'object' },
        storage: { type: 'string' },
        vectorConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'memory', 'semantic']
}));

export const memoryRetrievalTask = defineTask('memory-retrieval', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Memory Retrieval - ${args.systemName}`,
  agent: {
    name: 'retrieval-developer',
    prompt: {
      role: 'Memory Retrieval Developer',
      task: 'Implement unified memory retrieval',
      context: args,
      instructions: [
        '1. Design retrieval interface',
        '2. Implement multi-source retrieval',
        '3. Add relevance scoring',
        '4. Handle memory fusion',
        '5. Implement context injection',
        '6. Add caching layer',
        '7. Configure retrieval strategies',
        '8. Save retrieval logic'
      ],
      outputFormat: 'JSON with retrieval logic'
    },
    outputSchema: {
      type: 'object',
      required: ['logic', 'artifacts'],
      properties: {
        logic: { type: 'object' },
        retrievalCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'memory', 'retrieval']
}));

export const memoryIntegrationTask = defineTask('memory-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Memory System - ${args.systemName}`,
  agent: {
    name: 'integration-developer',
    prompt: {
      role: 'Integration Developer',
      task: 'Integrate all memory components',
      context: args,
      instructions: [
        '1. Create unified memory interface',
        '2. Wire all memory types',
        '3. Implement memory lifecycle',
        '4. Add monitoring/logging',
        '5. Test memory operations',
        '6. Document integration',
        '7. Create usage examples',
        '8. Save integrated system'
      ],
      outputFormat: 'JSON with integrated system'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: { type: 'object' },
        systemCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'memory', 'integration']
}));

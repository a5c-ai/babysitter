/**
 * @process specializations/ai-agents-conversational/long-term-memory-management
 * @description Long-Term Memory and User Profile Management - Process for building persistent memory systems that track
 * user preferences, historical interactions, learned facts, and personalization across sessions.
 * @inputs { systemName?: string, userAttributes?: array, factTypes?: array, outputDir?: string }
 * @outputs { success: boolean, userProfileSystem: object, factExtraction: object, crossSessionPersistence: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/long-term-memory-management', {
 *   systemName: 'user-memory',
 *   userAttributes: ['preferences', 'history', 'facts'],
 *   factTypes: ['personal', 'preferences', 'context']
 * });
 *
 * @references
 * - Zep: https://docs.getzep.com/
 * - Mem0: https://docs.mem0.ai/
 * - User Modeling: https://en.wikipedia.org/wiki/User_modeling
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'long-term-memory',
    userAttributes = ['preferences', 'facts'],
    factTypes = ['personal', 'preferences'],
    outputDir = 'long-term-memory-output',
    enableFactExtraction = true,
    enablePersonalization = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Long-Term Memory Management for ${systemName}`);

  // ============================================================================
  // PHASE 1: USER PROFILE SCHEMA
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing user profile schema');

  const profileSchema = await ctx.task(userProfileSchemaTask, {
    systemName,
    userAttributes,
    outputDir
  });

  artifacts.push(...profileSchema.artifacts);

  // ============================================================================
  // PHASE 2: FACT EXTRACTION
  // ============================================================================

  let factExtraction = null;
  if (enableFactExtraction) {
    ctx.log('info', 'Phase 2: Implementing fact extraction');

    factExtraction = await ctx.task(factExtractionTask, {
      systemName,
      factTypes,
      outputDir
    });

    artifacts.push(...factExtraction.artifacts);
  }

  // ============================================================================
  // PHASE 3: PREFERENCE LEARNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing preference learning');

  const preferenceLearning = await ctx.task(preferenceLearningTask, {
    systemName,
    userAttributes,
    outputDir
  });

  artifacts.push(...preferenceLearning.artifacts);

  // ============================================================================
  // PHASE 4: CROSS-SESSION PERSISTENCE
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing cross-session persistence');

  const persistence = await ctx.task(crossSessionPersistenceTask, {
    systemName,
    profileSchema: profileSchema.schema,
    outputDir
  });

  artifacts.push(...persistence.artifacts);

  // ============================================================================
  // PHASE 5: PERSONALIZATION ENGINE
  // ============================================================================

  let personalization = null;
  if (enablePersonalization) {
    ctx.log('info', 'Phase 5: Building personalization engine');

    personalization = await ctx.task(personalizationEngineTask, {
      systemName,
      preferenceLearning: preferenceLearning.learning,
      factExtraction: factExtraction ? factExtraction.extraction : null,
      outputDir
    });

    artifacts.push(...personalization.artifacts);
  }

  // ============================================================================
  // PHASE 6: PRIVACY AND CONSENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing privacy controls');

  const privacyControls = await ctx.task(privacyControlsTask, {
    systemName,
    userAttributes,
    outputDir
  });

  artifacts.push(...privacyControls.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Long-term memory ${systemName} complete. User attributes: ${userAttributes.join(', ')}. Review implementation?`,
    title: 'Long-Term Memory Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        userAttributes,
        factTypes,
        enableFactExtraction,
        enablePersonalization
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    userProfileSystem: {
      schema: profileSchema.schema,
      preferenceLearning: preferenceLearning.learning
    },
    factExtraction: factExtraction ? factExtraction.extraction : null,
    crossSessionPersistence: persistence.persistence,
    personalization: personalization ? personalization.engine : null,
    privacyControls: privacyControls.controls,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/long-term-memory-management',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const userProfileSchemaTask = defineTask('user-profile-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design User Profile Schema - ${args.systemName}`,
  agent: {
    name: 'user-profile-manager',  // AG-MEM-002: Implements user profile and preference persistence
    prompt: {
      role: 'Schema Designer',
      task: 'Design user profile data schema',
      context: args,
      instructions: [
        '1. Define user identity fields',
        '2. Design preference storage',
        '3. Create fact storage schema',
        '4. Add interaction history fields',
        '5. Design metadata fields',
        '6. Add versioning support',
        '7. Document schema',
        '8. Save profile schema'
      ],
      outputFormat: 'JSON with profile schema'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        schemaPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'long-term-memory', 'schema']
}));

export const factExtractionTask = defineTask('fact-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Fact Extraction - ${args.systemName}`,
  agent: {
    name: 'fact-extractor',  // AG-MEM-003: Extracts and stores facts from conversations
    prompt: {
      role: 'Fact Extraction Developer',
      task: 'Implement fact extraction from conversations',
      context: args,
      instructions: [
        '1. Design fact extraction prompts',
        '2. Implement entity extraction',
        '3. Extract user preferences',
        '4. Extract personal facts',
        '5. Handle fact updates/corrections',
        '6. Add confidence scoring',
        '7. Implement fact validation',
        '8. Save fact extraction'
      ],
      outputFormat: 'JSON with fact extraction'
    },
    outputSchema: {
      type: 'object',
      required: ['extraction', 'artifacts'],
      properties: {
        extraction: { type: 'object' },
        extractionCodePath: { type: 'string' },
        prompts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'long-term-memory', 'facts']
}));

export const preferenceLearningTask = defineTask('preference-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Preference Learning - ${args.systemName}`,
  agent: {
    name: 'preference-developer',
    prompt: {
      role: 'Preference Learning Developer',
      task: 'Implement user preference learning',
      context: args,
      instructions: [
        '1. Track user choices',
        '2. Learn communication preferences',
        '3. Track topic interests',
        '4. Learn formatting preferences',
        '5. Implement implicit feedback',
        '6. Handle preference conflicts',
        '7. Add preference decay',
        '8. Save preference learning'
      ],
      outputFormat: 'JSON with preference learning'
    },
    outputSchema: {
      type: 'object',
      required: ['learning', 'artifacts'],
      properties: {
        learning: { type: 'object' },
        learningCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'long-term-memory', 'preferences']
}));

export const crossSessionPersistenceTask = defineTask('cross-session-persistence', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Cross-Session Persistence - ${args.systemName}`,
  skill: {
    name: 'entity-memory-store',  // SK-MEM-002: Entity memory for tracking key information
    prompt: {
      role: 'Persistence Developer',
      task: 'Implement cross-session data persistence',
      context: args,
      instructions: [
        '1. Configure persistent storage',
        '2. Implement session linking',
        '3. Handle user identification',
        '4. Implement data sync',
        '5. Add conflict resolution',
        '6. Handle data migration',
        '7. Implement backup/restore',
        '8. Save persistence logic'
      ],
      outputFormat: 'JSON with persistence'
    },
    outputSchema: {
      type: 'object',
      required: ['persistence', 'artifacts'],
      properties: {
        persistence: { type: 'object' },
        persistenceCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'long-term-memory', 'persistence']
}));

export const personalizationEngineTask = defineTask('personalization-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Personalization Engine - ${args.systemName}`,
  agent: {
    name: 'personalization-developer',
    prompt: {
      role: 'Personalization Developer',
      task: 'Build personalization engine',
      context: args,
      instructions: [
        '1. Create personalization rules',
        '2. Implement response adaptation',
        '3. Add context injection',
        '4. Handle personalization triggers',
        '5. Implement A/B testing support',
        '6. Add personalization metrics',
        '7. Create fallback handling',
        '8. Save personalization engine'
      ],
      outputFormat: 'JSON with personalization engine'
    },
    outputSchema: {
      type: 'object',
      required: ['engine', 'artifacts'],
      properties: {
        engine: { type: 'object' },
        engineCodePath: { type: 'string' },
        rules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'long-term-memory', 'personalization']
}));

export const privacyControlsTask = defineTask('privacy-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Privacy Controls - ${args.systemName}`,
  agent: {
    name: 'privacy-developer',
    prompt: {
      role: 'Privacy Developer',
      task: 'Implement privacy and consent controls',
      context: args,
      instructions: [
        '1. Implement consent management',
        '2. Add data export (GDPR)',
        '3. Implement data deletion',
        '4. Add data anonymization',
        '5. Handle opt-out requests',
        '6. Implement access controls',
        '7. Add audit logging',
        '8. Save privacy controls'
      ],
      outputFormat: 'JSON with privacy controls'
    },
    outputSchema: {
      type: 'object',
      required: ['controls', 'artifacts'],
      properties: {
        controls: { type: 'object' },
        privacyCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'long-term-memory', 'privacy']
}));

/**
 * @process specializations/programming-languages/concurrency-primitives
 * @description Concurrency Primitives Implementation - Process for implementing concurrency features including
 * threads, async/await, channels, and synchronization primitives.
 * @inputs { languageName: string, concurrencyModel?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, primitives: object, runtime: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/concurrency-primitives', {
 *   languageName: 'MyLang',
 *   concurrencyModel: 'async-await',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - CSP (Communicating Sequential Processes) by Hoare
 * - Tokio Runtime: https://tokio.rs/
 * - Go Concurrency: https://go.dev/doc/effective_go#concurrency
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    concurrencyModel = 'async-await',
    implementationLanguage = 'Rust',
    outputDir = 'concurrency-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Concurrency Primitives: ${languageName}`);
  ctx.log('info', `Model: ${concurrencyModel}`);

  // ============================================================================
  // PHASE 1: CONCURRENCY MODEL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Concurrency Model');

  const modelDesign = await ctx.task(concurrencyModelTask, {
    languageName,
    concurrencyModel,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...modelDesign.artifacts);

  await ctx.breakpoint({
    question: `Concurrency model: ${concurrencyModel}. Features: ${modelDesign.features.join(', ')}. Proceed with runtime implementation?`,
    title: 'Model Design Review',
    context: {
      runId: ctx.runId,
      model: concurrencyModel,
      features: modelDesign.features,
      files: modelDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: SCHEDULER IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Scheduler');

  const scheduler = await ctx.task(schedulerTask, {
    languageName,
    concurrencyModel,
    modelDesign,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...scheduler.artifacts);

  // ============================================================================
  // PHASE 3: SYNCHRONIZATION PRIMITIVES
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Synchronization Primitives');

  const syncPrimitives = await ctx.task(syncPrimitivesTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...syncPrimitives.artifacts);

  // ============================================================================
  // PHASE 4: COMMUNICATION PRIMITIVES
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Communication Primitives');

  const commPrimitives = await ctx.task(commPrimitivesTask, {
    languageName,
    concurrencyModel,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...commPrimitives.artifacts);

  // ============================================================================
  // PHASE 5: ASYNC RUNTIME (if async model)
  // ============================================================================

  let asyncRuntime = null;
  if (concurrencyModel === 'async-await') {
    ctx.log('info', 'Phase 5: Implementing Async Runtime');

    asyncRuntime = await ctx.task(asyncRuntimeTask, {
      languageName,
      scheduler,
      implementationLanguage,
      outputDir
    });

    artifacts.push(...asyncRuntime.artifacts);
  }

  // ============================================================================
  // PHASE 6: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating Concurrency Runtime');

  const integration = await ctx.task(concurrencyIntegrationTask, {
    languageName,
    modelDesign,
    scheduler,
    syncPrimitives,
    commPrimitives,
    asyncRuntime,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Tests');

  const testSuite = await ctx.task(concurrencyTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Documentation');

  const documentation = await ctx.task(concurrencyDocumentationTask, {
    languageName,
    concurrencyModel,
    modelDesign,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Concurrency Primitives Complete for ${languageName}! Model: ${concurrencyModel}, Primitives: ${syncPrimitives.primitiveCount + commPrimitives.primitiveCount}. Review deliverables?`,
    title: 'Concurrency Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        concurrencyModel,
        syncPrimitives: syncPrimitives.primitiveCount,
        commPrimitives: commPrimitives.primitiveCount,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Concurrency Runtime' },
        { path: documentation.guidePath, format: 'markdown', label: 'Concurrency Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    primitives: {
      sync: syncPrimitives.primitives,
      communication: commPrimitives.primitives,
      totalCount: syncPrimitives.primitiveCount + commPrimitives.primitiveCount
    },
    runtime: {
      model: concurrencyModel,
      scheduler: scheduler.schedulerType,
      features: modelDesign.features
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      guidePath: documentation.guidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/concurrency-primitives',
      timestamp: startTime,
      languageName,
      concurrencyModel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const concurrencyModelTask = defineTask('concurrency-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Concurrency Model - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Concurrency Engineer',
      task: 'Design concurrency model',
      context: args,
      instructions: [
        '1. Choose concurrency paradigm (threads, async, actors)',
        '2. Design task/coroutine representation',
        '3. Define scheduling model',
        '4. Design memory sharing model',
        '5. Define synchronization approach',
        '6. Design error propagation',
        '7. Plan cancellation support',
        '8. Define resource cleanup',
        '9. Document tradeoffs',
        '10. Create model specification'
      ],
      outputFormat: 'JSON with concurrency model'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'paradigm', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        paradigm: { type: 'string' },
        sharingModel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'model']
}));

export const schedulerTask = defineTask('scheduler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Scheduler - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Concurrency Engineer',
      task: 'Implement scheduler',
      context: args,
      instructions: [
        '1. Design scheduler type (work-stealing, cooperative)',
        '2. Implement task queue',
        '3. Implement worker threads',
        '4. Handle task creation/spawning',
        '5. Implement yield/preemption',
        '6. Handle priority scheduling',
        '7. Implement load balancing',
        '8. Handle thread pool sizing',
        '9. Add scheduler metrics',
        '10. Test scheduler behavior'
      ],
      outputFormat: 'JSON with scheduler'
    },
    outputSchema: {
      type: 'object',
      required: ['schedulerType', 'features', 'artifacts'],
      properties: {
        schedulerType: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'scheduler']
}));

export const syncPrimitivesTask = defineTask('sync-primitives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Sync Primitives - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Concurrency Engineer',
      task: 'Implement synchronization primitives',
      context: args,
      instructions: [
        '1. Implement Mutex',
        '2. Implement RwLock',
        '3. Implement Semaphore',
        '4. Implement Condition Variable',
        '5. Implement Barrier',
        '6. Implement Once/OnceCell',
        '7. Implement atomic types',
        '8. Handle lock poisoning',
        '9. Add lock debugging',
        '10. Test primitives'
      ],
      outputFormat: 'JSON with sync primitives'
    },
    outputSchema: {
      type: 'object',
      required: ['primitives', 'primitiveCount', 'artifacts'],
      properties: {
        primitives: { type: 'array', items: { type: 'string' } },
        primitiveCount: { type: 'number' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'sync']
}));

export const commPrimitivesTask = defineTask('comm-primitives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Communication Primitives - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Concurrency Engineer',
      task: 'Implement communication primitives',
      context: args,
      instructions: [
        '1. Implement unbounded channel',
        '2. Implement bounded channel',
        '3. Implement oneshot channel',
        '4. Implement broadcast channel',
        '5. Implement select/multiplex',
        '6. Handle channel closing',
        '7. Implement timeouts',
        '8. Add backpressure support',
        '9. Handle cancellation',
        '10. Test channels'
      ],
      outputFormat: 'JSON with communication primitives'
    },
    outputSchema: {
      type: 'object',
      required: ['primitives', 'primitiveCount', 'artifacts'],
      properties: {
        primitives: { type: 'array', items: { type: 'string' } },
        primitiveCount: { type: 'number' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'channels']
}));

export const asyncRuntimeTask = defineTask('async-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Async Runtime - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Concurrency Engineer',
      task: 'Implement async runtime',
      context: args,
      instructions: [
        '1. Design Future/Promise type',
        '2. Implement async/await transformation',
        '3. Implement event loop/reactor',
        '4. Handle IO events',
        '5. Implement timers',
        '6. Support cancellation tokens',
        '7. Handle nested async',
        '8. Implement async traits',
        '9. Add runtime configuration',
        '10. Test async execution'
      ],
      outputFormat: 'JSON with async runtime'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        eventLoopType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'async']
}));

export const concurrencyIntegrationTask = defineTask('concurrency-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Concurrency Integration - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Concurrency Engineer',
      task: 'Integrate concurrency runtime',
      context: args,
      instructions: [
        '1. Create main runtime API',
        '2. Integrate all components',
        '3. Add spawn/join API',
        '4. Add runtime configuration',
        '5. Handle shutdown',
        '6. Add panic handling',
        '7. Add debug/trace support',
        '8. Handle thread locals',
        '9. Add metrics',
        '10. Final code organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'publicApi', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        publicApi: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'integration']
}));

export const concurrencyTestingTask = defineTask('concurrency-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Concurrency Testing - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive concurrency tests',
      context: args,
      instructions: [
        '1. Test sync primitives',
        '2. Test channels',
        '3. Test scheduler',
        '4. Test async execution',
        '5. Test deadlock detection',
        '6. Stress test concurrency',
        '7. Test race conditions',
        '8. Test cancellation',
        '9. Measure code coverage',
        '10. Add loom/miri tests'
      ],
      outputFormat: 'JSON with test suite'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'testing']
}));

export const concurrencyDocumentationTask = defineTask('concurrency-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Concurrency Documentation - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate concurrency documentation',
      context: args,
      instructions: [
        '1. Create concurrency guide',
        '2. Document primitives',
        '3. Document channels',
        '4. Document async/await',
        '5. Create API reference',
        '6. Add usage examples',
        '7. Document best practices',
        '8. Document pitfalls',
        '9. Add debugging guide',
        '10. Create quick reference'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['guidePath', 'artifacts'],
      properties: {
        guidePath: { type: 'string' },
        apiDocPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'concurrency', 'documentation']
}));

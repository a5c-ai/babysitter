/**
 * @process specializations/programming-languages/garbage-collector-implementation
 * @description Garbage Collector Implementation - Process for implementing automatic memory management. Covers
 * mark-sweep, copying, generational, and concurrent collection algorithms.
 * @inputs { languageName: string, gcAlgorithm?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, gcImplementation: object, allocator: object, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/garbage-collector-implementation', {
 *   languageName: 'MyLang',
 *   gcAlgorithm: 'generational',
 *   implementationLanguage: 'C'
 * });
 *
 * @references
 * - The Garbage Collection Handbook by Jones, Hosking, Moss
 * - V8 Garbage Collection: https://v8.dev/blog/trash-talk
 * - Boehm GC: https://www.hboehm.info/gc/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    gcAlgorithm = 'mark-sweep',
    implementationLanguage = 'C',
    concurrentCollection = false,
    outputDir = 'gc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GC Implementation: ${languageName}`);
  ctx.log('info', `Algorithm: ${gcAlgorithm}, Concurrent: ${concurrentCollection}`);

  // ============================================================================
  // PHASE 1: OBJECT MODEL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Object Model');

  const objectModel = await ctx.task(objectModelTask, {
    languageName,
    gcAlgorithm,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...objectModel.artifacts);

  await ctx.breakpoint({
    question: `Object model designed with ${objectModel.headerSize} byte header. Root set: ${objectModel.rootSetSources.join(', ')}. Proceed with allocator?`,
    title: 'Object Model Review',
    context: {
      runId: ctx.runId,
      headerSize: objectModel.headerSize,
      rootSetSources: objectModel.rootSetSources,
      files: objectModel.artifacts.map(a => ({ path: a.path, format: a.format || 'c' }))
    }
  });

  // ============================================================================
  // PHASE 2: MEMORY ALLOCATOR
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Memory Allocator');

  const memoryAllocator = await ctx.task(memoryAllocatorTask, {
    languageName,
    gcAlgorithm,
    objectModel,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...memoryAllocator.artifacts);

  // ============================================================================
  // PHASE 3: ROOT SET SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Root Set Scanning');

  const rootSetScanning = await ctx.task(rootSetScanningTask, {
    languageName,
    objectModel,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...rootSetScanning.artifacts);

  // ============================================================================
  // PHASE 4: MARKING PHASE
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Marking Phase');

  const markingPhase = await ctx.task(markingPhaseTask, {
    languageName,
    gcAlgorithm,
    objectModel,
    rootSetScanning,
    concurrentCollection,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...markingPhase.artifacts);

  // ============================================================================
  // PHASE 5: SWEEP/COMPACT PHASE
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Sweep/Compact Phase');

  const sweepPhase = await ctx.task(sweepPhaseTask, {
    languageName,
    gcAlgorithm,
    objectModel,
    memoryAllocator,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...sweepPhase.artifacts);

  // ============================================================================
  // PHASE 6: WRITE BARRIERS (if needed)
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Write Barriers');

  const writeBarriers = await ctx.task(writeBarriersTask, {
    languageName,
    gcAlgorithm,
    concurrentCollection,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...writeBarriers.artifacts);

  // ============================================================================
  // PHASE 7: GC INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating GC');

  const gcIntegration = await ctx.task(gcIntegrationTask, {
    languageName,
    objectModel,
    memoryAllocator,
    rootSetScanning,
    markingPhase,
    sweepPhase,
    writeBarriers,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...gcIntegration.artifacts);

  // ============================================================================
  // PHASE 8: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Tests');

  const testSuite = await ctx.task(gcTestingTask, {
    languageName,
    gcIntegration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 9: BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 9: Running Benchmarks');

  const benchmarks = await ctx.task(gcBenchmarkingTask, {
    languageName,
    gcAlgorithm,
    gcIntegration,
    outputDir
  });

  artifacts.push(...benchmarks.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating Documentation');

  const documentation = await ctx.task(gcDocumentationTask, {
    languageName,
    gcAlgorithm,
    objectModel,
    gcIntegration,
    benchmarks,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `GC Implementation Complete for ${languageName}! Algorithm: ${gcAlgorithm}, Pause time: ${benchmarks.avgPauseTime}. Review deliverables?`,
    title: 'GC Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        gcAlgorithm,
        concurrentCollection,
        avgPauseTime: benchmarks.avgPauseTime,
        throughput: benchmarks.throughput,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: gcIntegration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'GC Implementation' },
        { path: documentation.specPath, format: 'markdown', label: 'GC Specification' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    gcImplementation: {
      algorithm: gcAlgorithm,
      concurrentCollection,
      mainFile: gcIntegration.mainFilePath
    },
    objectModel: {
      headerSize: objectModel.headerSize,
      features: objectModel.features
    },
    allocator: {
      strategy: memoryAllocator.strategy,
      features: memoryAllocator.features
    },
    benchmarks: {
      avgPauseTime: benchmarks.avgPauseTime,
      throughput: benchmarks.throughput,
      memoryOverhead: benchmarks.memoryOverhead
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/garbage-collector-implementation',
      timestamp: startTime,
      languageName,
      gcAlgorithm
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const objectModelTask = defineTask('object-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Object Model - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'GC Engineer',
      task: 'Design object model for GC',
      context: args,
      instructions: [
        '1. Design object header (mark bits, type info)',
        '2. Define object layout requirements',
        '3. Identify root set sources (stack, globals, registers)',
        '4. Design reference tracking',
        '5. Handle interior pointers',
        '6. Design weak references',
        '7. Handle finalizers/destructors',
        '8. Define alignment requirements',
        '9. Create object iteration API',
        '10. Document object model'
      ],
      outputFormat: 'JSON with object model'
    },
    outputSchema: {
      type: 'object',
      required: ['headerSize', 'rootSetSources', 'features', 'artifacts'],
      properties: {
        headerSize: { type: 'number' },
        rootSetSources: { type: 'array', items: { type: 'string' } },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'gc', 'object-model']
}));

export const memoryAllocatorTask = defineTask('memory-allocator', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Memory Allocator - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'GC Engineer',
      task: 'Implement memory allocator',
      context: args,
      instructions: [
        '1. Implement heap allocation',
        '2. Design allocation strategy (bump, free-list)',
        '3. Handle size classes',
        '4. Implement block management',
        '5. Handle large object allocation',
        '6. Implement heap expansion',
        '7. Add allocation statistics',
        '8. Handle out of memory',
        '9. Optimize allocation path',
        '10. Test allocator'
      ],
      outputFormat: 'JSON with memory allocator'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'features', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
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
  labels: ['programming-languages', 'gc', 'allocator']
}));

export const rootSetScanningTask = defineTask('root-set-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Root Set Scanning - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'GC Engineer',
      task: 'Implement root set scanning',
      context: args,
      instructions: [
        '1. Scan stack frames',
        '2. Scan global variables',
        '3. Scan thread-local storage',
        '4. Handle register scanning',
        '5. Scan native handles',
        '6. Handle JIT-compiled code roots',
        '7. Track root set precisely',
        '8. Handle conservative scanning',
        '9. Optimize scanning performance',
        '10. Test root enumeration'
      ],
      outputFormat: 'JSON with root set scanning'
    },
    outputSchema: {
      type: 'object',
      required: ['scanSources', 'features', 'artifacts'],
      properties: {
        scanSources: { type: 'array', items: { type: 'string' } },
        features: { type: 'array', items: { type: 'string' } },
        preciseScanning: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'gc', 'root-scanning']
}));

export const markingPhaseTask = defineTask('marking-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Marking Phase - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'GC Engineer',
      task: 'Implement marking phase',
      context: args,
      instructions: [
        '1. Implement mark bit handling',
        '2. Implement traversal (DFS/BFS)',
        '3. Handle work list/stack',
        '4. Implement tricolor marking',
        '5. Handle concurrent marking (if enabled)',
        '6. Implement incremental marking',
        '7. Handle satb barriers (if concurrent)',
        '8. Optimize marking performance',
        '9. Add marking statistics',
        '10. Test marking correctness'
      ],
      outputFormat: 'JSON with marking phase'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'features', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        concurrent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'gc', 'marking']
}));

export const sweepPhaseTask = defineTask('sweep-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Sweep/Compact Phase - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'GC Engineer',
      task: 'Implement sweep/compact phase',
      context: args,
      instructions: [
        '1. Implement sweeping (mark-sweep)',
        '2. Implement copying (if semi-space)',
        '3. Implement compaction (if mark-compact)',
        '4. Handle pointer updating',
        '5. Handle forwarding pointers',
        '6. Implement concurrent sweeping',
        '7. Handle fragmentation',
        '8. Run finalizers',
        '9. Optimize sweep performance',
        '10. Test reclamation correctness'
      ],
      outputFormat: 'JSON with sweep phase'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'features', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        compaction: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'gc', 'sweep']
}));

export const writeBarriersTask = defineTask('write-barriers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Write Barriers - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'GC Engineer',
      task: 'Implement write barriers',
      context: args,
      instructions: [
        '1. Design write barrier type',
        '2. Implement store buffer (generational)',
        '3. Implement card marking',
        '4. Implement SATB barriers (concurrent)',
        '5. Handle reference writes',
        '6. Optimize barrier code',
        '7. Handle JIT barrier emission',
        '8. Add barrier statistics',
        '9. Handle barrier overflow',
        '10. Test barrier correctness'
      ],
      outputFormat: 'JSON with write barriers'
    },
    outputSchema: {
      type: 'object',
      required: ['barrierType', 'features', 'artifacts'],
      properties: {
        barrierType: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        overhead: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'gc', 'barriers']
}));

export const gcIntegrationTask = defineTask('gc-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: GC Integration - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'GC Engineer',
      task: 'Integrate GC components',
      context: args,
      instructions: [
        '1. Create main GC class',
        '2. Integrate all components',
        '3. Implement collection trigger',
        '4. Add GC configuration',
        '5. Implement GC API',
        '6. Handle safepoints',
        '7. Add GC logging',
        '8. Handle emergency collection',
        '9. Add metrics collection',
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
  labels: ['programming-languages', 'gc', 'integration']
}));

export const gcTestingTask = defineTask('gc-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: GC Testing - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive GC tests',
      context: args,
      instructions: [
        '1. Test allocation',
        '2. Test collection correctness',
        '3. Test root scanning',
        '4. Test write barriers',
        '5. Test weak references',
        '6. Test finalizers',
        '7. Test concurrent collection',
        '8. Stress test GC',
        '9. Measure code coverage',
        '10. Add regression tests'
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
  labels: ['programming-languages', 'gc', 'testing']
}));

export const gcBenchmarkingTask = defineTask('gc-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: GC Benchmarking - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark GC performance',
      context: args,
      instructions: [
        '1. Measure pause times',
        '2. Measure throughput',
        '3. Measure memory overhead',
        '4. Test with allocation-heavy workloads',
        '5. Test with long-lived objects',
        '6. Measure concurrent overhead',
        '7. Profile GC phases',
        '8. Compare with reference GCs',
        '9. Identify bottlenecks',
        '10. Generate benchmark reports'
      ],
      outputFormat: 'JSON with benchmarks'
    },
    outputSchema: {
      type: 'object',
      required: ['avgPauseTime', 'throughput', 'memoryOverhead', 'artifacts'],
      properties: {
        avgPauseTime: { type: 'string' },
        throughput: { type: 'string' },
        memoryOverhead: { type: 'string' },
        benchmarks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'gc', 'benchmarking']
}));

export const gcDocumentationTask = defineTask('gc-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: GC Documentation - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate GC documentation',
      context: args,
      instructions: [
        '1. Create GC specification',
        '2. Document algorithm',
        '3. Document object model',
        '4. Document write barriers',
        '5. Create API reference',
        '6. Document tuning options',
        '7. Add performance guide',
        '8. Document debugging',
        '9. Create internals guide',
        '10. Add troubleshooting'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'artifacts'],
      properties: {
        specPath: { type: 'string' },
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
  labels: ['programming-languages', 'gc', 'documentation']
}));

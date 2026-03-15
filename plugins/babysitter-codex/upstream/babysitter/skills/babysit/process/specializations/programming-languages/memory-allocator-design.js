/**
 * @process specializations/programming-languages/memory-allocator-design
 * @description Memory Allocator Design - Process for designing custom memory allocators for language runtimes.
 * Covers arena allocators, pool allocators, and general-purpose heap management.
 * @inputs { languageName: string, allocatorType?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, allocatorSpec: object, implementation: object, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/memory-allocator-design', {
 *   languageName: 'MyLang',
 *   allocatorType: 'arena',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - jemalloc: https://jemalloc.net/
 * - mimalloc: https://github.com/microsoft/mimalloc
 * - Custom Allocators: https://www.gingerbill.org/article/2019/02/08/memory-allocation-strategies-001/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    allocatorType = 'general-purpose',
    implementationLanguage = 'C',
    threadSafe = true,
    outputDir = 'allocator-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Memory Allocator Design: ${languageName}`);
  ctx.log('info', `Type: ${allocatorType}, Thread-safe: ${threadSafe}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Allocator Requirements');

  const requirements = await ctx.task(allocatorRequirementsTask, {
    languageName,
    allocatorType,
    threadSafe,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: ALLOCATOR ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Allocator Architecture');

  const architecture = await ctx.task(allocatorArchitectureTask, {
    languageName,
    allocatorType,
    requirements,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  await ctx.breakpoint({
    question: `Allocator architecture: ${architecture.strategy}. Features: ${architecture.features.join(', ')}. Proceed with implementation?`,
    title: 'Architecture Review',
    context: {
      runId: ctx.runId,
      strategy: architecture.strategy,
      features: architecture.features,
      files: architecture.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: CORE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Core Allocator');

  const coreImplementation = await ctx.task(coreAllocatorTask, {
    languageName,
    allocatorType,
    architecture,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...coreImplementation.artifacts);

  // ============================================================================
  // PHASE 4: SIZE CLASS HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Size Classes');

  const sizeClasses = await ctx.task(sizeClassesTask, {
    languageName,
    architecture,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...sizeClasses.artifacts);

  // ============================================================================
  // PHASE 5: THREAD SAFETY
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Thread Safety');

  const threadSafetyImpl = await ctx.task(allocatorThreadSafetyTask, {
    languageName,
    threadSafe,
    coreImplementation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...threadSafetyImpl.artifacts);

  // ============================================================================
  // PHASE 6: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating Allocator');

  const integration = await ctx.task(allocatorIntegrationTask, {
    languageName,
    coreImplementation,
    sizeClasses,
    threadSafetyImpl,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Tests');

  const testSuite = await ctx.task(allocatorTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 8: Running Benchmarks');

  const benchmarks = await ctx.task(allocatorBenchmarkingTask, {
    languageName,
    allocatorType,
    integration,
    outputDir
  });

  artifacts.push(...benchmarks.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Documentation');

  const documentation = await ctx.task(allocatorDocumentationTask, {
    languageName,
    allocatorType,
    architecture,
    integration,
    benchmarks,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Memory Allocator Complete for ${languageName}! Allocation speed: ${benchmarks.allocationSpeed}. Review deliverables?`,
    title: 'Allocator Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        allocatorType,
        threadSafe,
        allocationSpeed: benchmarks.allocationSpeed,
        fragmentation: benchmarks.fragmentation,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Allocator' },
        { path: documentation.specPath, format: 'markdown', label: 'Specification' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    allocatorSpec: {
      type: allocatorType,
      strategy: architecture.strategy,
      features: architecture.features
    },
    implementation: {
      mainFile: integration.mainFilePath,
      threadSafe,
      sizeClasses: sizeClasses.classCount
    },
    benchmarks: {
      allocationSpeed: benchmarks.allocationSpeed,
      deallocationSpeed: benchmarks.deallocationSpeed,
      fragmentation: benchmarks.fragmentation
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/memory-allocator-design',
      timestamp: startTime,
      languageName,
      allocatorType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const allocatorRequirementsTask = defineTask('allocator-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Allocator Requirements - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Analyze allocator requirements',
      context: args,
      instructions: [
        '1. Identify allocation patterns',
        '2. Determine size distribution',
        '3. Assess thread requirements',
        '4. Identify fragmentation concerns',
        '5. Determine performance targets',
        '6. Assess memory overhead budget',
        '7. Identify special requirements',
        '8. Define API requirements',
        '9. Document constraints',
        '10. Create requirements document'
      ],
      outputFormat: 'JSON with requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['allocationPatterns', 'performanceTargets', 'artifacts'],
      properties: {
        allocationPatterns: { type: 'array', items: { type: 'string' } },
        performanceTargets: { type: 'object' },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'allocator', 'requirements']
}));

export const allocatorArchitectureTask = defineTask('allocator-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Allocator Architecture - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Design allocator architecture',
      context: args,
      instructions: [
        '1. Choose allocation strategy',
        '2. Design size class hierarchy',
        '3. Plan thread-local caches',
        '4. Design block management',
        '5. Plan large allocation handling',
        '6. Design metadata storage',
        '7. Plan fragmentation mitigation',
        '8. Design memory mapping',
        '9. Document architecture',
        '10. Create architecture diagrams'
      ],
      outputFormat: 'JSON with architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'features', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'allocator', 'architecture']
}));

export const coreAllocatorTask = defineTask('core-allocator', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Core Allocator - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Implement core allocator',
      context: args,
      instructions: [
        '1. Implement malloc/alloc function',
        '2. Implement free/dealloc function',
        '3. Implement realloc function',
        '4. Handle memory mapping',
        '5. Implement block splitting',
        '6. Implement block coalescing',
        '7. Handle alignment',
        '8. Add debug checks',
        '9. Optimize hot paths',
        '10. Test core functions'
      ],
      outputFormat: 'JSON with core implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'functions', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        functions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'allocator', 'implementation']
}));

export const sizeClassesTask = defineTask('size-classes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Size Classes - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Implement size class handling',
      context: args,
      instructions: [
        '1. Define size class bins',
        '2. Implement size-to-class mapping',
        '3. Create per-class free lists',
        '4. Implement slab allocation',
        '5. Handle large objects separately',
        '6. Optimize class transitions',
        '7. Minimize internal fragmentation',
        '8. Add class statistics',
        '9. Document size classes',
        '10. Test size handling'
      ],
      outputFormat: 'JSON with size classes'
    },
    outputSchema: {
      type: 'object',
      required: ['classCount', 'strategy', 'artifacts'],
      properties: {
        classCount: { type: 'number' },
        strategy: { type: 'string' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'allocator', 'size-classes']
}));

export const allocatorThreadSafetyTask = defineTask('allocator-thread-safety', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Thread Safety - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Implement thread safety',
      context: args,
      instructions: [
        '1. Implement thread-local caches',
        '2. Add global arena locks',
        '3. Use lock-free where possible',
        '4. Implement cache flush',
        '5. Handle thread termination',
        '6. Minimize lock contention',
        '7. Use atomic operations',
        '8. Test concurrent access',
        '9. Profile contention',
        '10. Document threading model'
      ],
      outputFormat: 'JSON with thread safety'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        lockingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'allocator', 'thread-safety']
}));

export const allocatorIntegrationTask = defineTask('allocator-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Allocator Integration - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Integrate allocator',
      context: args,
      instructions: [
        '1. Create main allocator API',
        '2. Integrate all components',
        '3. Add initialization',
        '4. Add shutdown/cleanup',
        '5. Add statistics API',
        '6. Add debug/trace mode',
        '7. Handle configuration',
        '8. Add memory limits',
        '9. Final code organization',
        '10. Create allocator factory'
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
  labels: ['programming-languages', 'allocator', 'integration']
}));

export const allocatorTestingTask = defineTask('allocator-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Allocator Testing - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive allocator tests',
      context: args,
      instructions: [
        '1. Test basic allocation',
        '2. Test size classes',
        '3. Test concurrent access',
        '4. Test edge cases',
        '5. Test memory exhaustion',
        '6. Stress test allocator',
        '7. Test fragmentation behavior',
        '8. Test alignment',
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
  labels: ['programming-languages', 'allocator', 'testing']
}));

export const allocatorBenchmarkingTask = defineTask('allocator-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Allocator Benchmarking - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark allocator performance',
      context: args,
      instructions: [
        '1. Measure allocation speed',
        '2. Measure deallocation speed',
        '3. Measure multi-threaded performance',
        '4. Measure fragmentation',
        '5. Measure memory overhead',
        '6. Compare with system allocator',
        '7. Profile hot paths',
        '8. Measure cache behavior',
        '9. Test various workloads',
        '10. Generate benchmark reports'
      ],
      outputFormat: 'JSON with benchmarks'
    },
    outputSchema: {
      type: 'object',
      required: ['allocationSpeed', 'deallocationSpeed', 'fragmentation', 'artifacts'],
      properties: {
        allocationSpeed: { type: 'string' },
        deallocationSpeed: { type: 'string' },
        fragmentation: { type: 'string' },
        memoryOverhead: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'allocator', 'benchmarking']
}));

export const allocatorDocumentationTask = defineTask('allocator-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Allocator Documentation - ${args.languageName}`,
  agent: {
    name: 'memory-management-expert',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate allocator documentation',
      context: args,
      instructions: [
        '1. Create allocator specification',
        '2. Document architecture',
        '3. Document size classes',
        '4. Document threading model',
        '5. Create API reference',
        '6. Document tuning options',
        '7. Add performance guide',
        '8. Document debugging',
        '9. Create integration guide',
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
  labels: ['programming-languages', 'allocator', 'documentation']
}));

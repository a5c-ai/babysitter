/**
 * @process specializations/programming-languages/jit-compiler-development
 * @description JIT Compiler Development - Process for implementing just-in-time compilation to improve runtime
 * performance. Covers profiling, compilation triggers, code generation, and deoptimization.
 * @inputs { languageName: string, baselineInterpreter?: object, targetArchitecture?: string, outputDir?: string }
 * @outputs { success: boolean, profiler: object, jitCompiler: object, codeCache: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/jit-compiler-development', {
 *   languageName: 'MyLang',
 *   targetArchitecture: 'x86_64'
 * });
 *
 * @references
 * - A Brief History of Just-In-Time: https://dl.acm.org/doi/10.1145/857076.857077
 * - V8 TurboFan: https://v8.dev/docs/turbofan
 * - HotSpot JIT: https://openjdk.org/groups/hotspot/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    baselineInterpreter = null,
    targetArchitecture = 'x86_64',
    implementationLanguage = 'C++',
    optimizationTiers = 2,
    outputDir = 'jit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting JIT Compiler Development: ${languageName}`);
  ctx.log('info', `Target: ${targetArchitecture}, Tiers: ${optimizationTiers}`);

  // ============================================================================
  // PHASE 1: PROFILING SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Profiling System');

  const profilingSystem = await ctx.task(profilingSystemTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...profilingSystem.artifacts);

  // ============================================================================
  // PHASE 2: COMPILATION TRIGGERS
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Compilation Triggers');

  const compilationTriggers = await ctx.task(compilationTriggersTask, {
    languageName,
    profilingSystem,
    optimizationTiers,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...compilationTriggers.artifacts);

  await ctx.breakpoint({
    question: `JIT triggers configured: ${compilationTriggers.triggerTypes.join(', ')}. Hot threshold: ${compilationTriggers.hotThreshold}. Proceed with code generation?`,
    title: 'Compilation Triggers Review',
    context: {
      runId: ctx.runId,
      triggerTypes: compilationTriggers.triggerTypes,
      hotThreshold: compilationTriggers.hotThreshold,
      files: compilationTriggers.artifacts.map(a => ({ path: a.path, format: a.format || 'cpp' }))
    }
  });

  // ============================================================================
  // PHASE 3: IR FOR JIT
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing JIT IR');

  const jitIR = await ctx.task(jitIRTask, {
    languageName,
    targetArchitecture,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...jitIR.artifacts);

  // ============================================================================
  // PHASE 4: CODE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Code Generation');

  const codeGeneration = await ctx.task(jitCodeGenerationTask, {
    languageName,
    targetArchitecture,
    jitIR,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...codeGeneration.artifacts);

  // ============================================================================
  // PHASE 5: OPTIMIZATION TIERS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Optimization Tiers');

  const optimizationTiersImpl = await ctx.task(optimizationTiersTask, {
    languageName,
    optimizationTiers,
    jitIR,
    codeGeneration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...optimizationTiersImpl.artifacts);

  // ============================================================================
  // PHASE 6: DEOPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Deoptimization');

  const deoptimization = await ctx.task(deoptimizationTask, {
    languageName,
    codeGeneration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...deoptimization.artifacts);

  // ============================================================================
  // PHASE 7: CODE CACHE
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Code Cache');

  const codeCache = await ctx.task(codeCacheTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...codeCache.artifacts);

  // ============================================================================
  // PHASE 8: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Integrating JIT Compiler');

  const integration = await ctx.task(jitIntegrationTask, {
    languageName,
    profilingSystem,
    compilationTriggers,
    jitIR,
    codeGeneration,
    optimizationTiersImpl,
    deoptimization,
    codeCache,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating Tests');

  const testSuite = await ctx.task(jitTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating Documentation');

  const documentation = await ctx.task(jitDocumentationTask, {
    languageName,
    profilingSystem,
    optimizationTiersImpl,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `JIT Compiler Complete for ${languageName}! ${optimizationTiers} tiers, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'JIT Compiler Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        targetArchitecture,
        optimizationTiers,
        testCoverage: testSuite.coverage,
        speedup: testSuite.speedup
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'JIT Compiler' },
        { path: documentation.architecturePath, format: 'markdown', label: 'Architecture Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    profiler: {
      features: profilingSystem.features,
      counters: profilingSystem.counters
    },
    jitCompiler: {
      targetArchitecture,
      optimizationTiers,
      mainFile: integration.mainFilePath
    },
    codeCache: {
      features: codeCache.features,
      evictionPolicy: codeCache.evictionPolicy
    },
    deoptimization: {
      triggers: deoptimization.triggers,
      features: deoptimization.features
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage,
      speedup: testSuite.speedup
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/jit-compiler-development',
      timestamp: startTime,
      languageName,
      targetArchitecture
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const profilingSystemTask = defineTask('profiling-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Profiling System - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Design profiling system',
      context: args,
      instructions: [
        '1. Design execution counters',
        '2. Implement call counting',
        '3. Track loop iterations',
        '4. Collect type feedback',
        '5. Track branch history',
        '6. Implement sampling profiler',
        '7. Design profiling data structures',
        '8. Minimize profiling overhead',
        '9. Add profiling output',
        '10. Test profiling accuracy'
      ],
      outputFormat: 'JSON with profiling system'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'counters', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        counters: { type: 'array', items: { type: 'string' } },
        overhead: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'jit', 'profiling']
}));

export const compilationTriggersTask = defineTask('compilation-triggers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Compilation Triggers - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Implement compilation triggers',
      context: args,
      instructions: [
        '1. Define hot code threshold',
        '2. Implement counter-based triggers',
        '3. Implement on-stack replacement',
        '4. Design tier transition rules',
        '5. Handle background compilation',
        '6. Implement compilation queue',
        '7. Add priority scheduling',
        '8. Handle compilation budget',
        '9. Test trigger behavior',
        '10. Tune thresholds'
      ],
      outputFormat: 'JSON with compilation triggers'
    },
    outputSchema: {
      type: 'object',
      required: ['triggerTypes', 'hotThreshold', 'artifacts'],
      properties: {
        triggerTypes: { type: 'array', items: { type: 'string' } },
        hotThreshold: { type: 'number' },
        osrSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'jit', 'triggers']
}));

export const jitIRTask = defineTask('jit-ir', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: JIT IR - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Implement JIT intermediate representation',
      context: args,
      instructions: [
        '1. Design low-level IR',
        '2. Implement SSA construction',
        '3. Design type representation',
        '4. Implement control flow graph',
        '5. Support speculative types',
        '6. Add IR verification',
        '7. Implement IR printing',
        '8. Design IR optimization passes',
        '9. Support deoptimization points',
        '10. Test IR construction'
      ],
      outputFormat: 'JSON with JIT IR'
    },
    outputSchema: {
      type: 'object',
      required: ['irFeatures', 'filePath', 'artifacts'],
      properties: {
        irFeatures: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        ssaForm: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'jit', 'ir']
}));

export const jitCodeGenerationTask = defineTask('jit-code-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: JIT Code Generation - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Implement native code generation',
      context: args,
      instructions: [
        '1. Implement instruction selection',
        '2. Implement register allocation',
        '3. Generate target instructions',
        '4. Handle calling conventions',
        '5. Implement stack frame layout',
        '6. Generate jump/branch code',
        '7. Handle constants and literals',
        '8. Implement inline caching',
        '9. Generate exception handling code',
        '10. Test code correctness'
      ],
      outputFormat: 'JSON with code generation'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        registerAllocator: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'jit', 'codegen']
}));

export const optimizationTiersTask = defineTask('optimization-tiers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Optimization Tiers - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Implement optimization tiers',
      context: args,
      instructions: [
        '1. Design tier hierarchy',
        '2. Implement baseline tier (fast compilation)',
        '3. Implement optimizing tier (better code)',
        '4. Define tier transition logic',
        '5. Implement tier-specific optimizations',
        '6. Handle tier fallback',
        '7. Implement warmup strategy',
        '8. Balance compilation time vs code quality',
        '9. Add tier profiling',
        '10. Test tier transitions'
      ],
      outputFormat: 'JSON with optimization tiers'
    },
    outputSchema: {
      type: 'object',
      required: ['tiers', 'transitions', 'artifacts'],
      properties: {
        tiers: { type: 'array', items: { type: 'object' } },
        transitions: { type: 'array', items: { type: 'object' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'jit', 'tiers']
}));

export const deoptimizationTask = defineTask('deoptimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Deoptimization - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Implement deoptimization',
      context: args,
      instructions: [
        '1. Design deoptimization points',
        '2. Implement guard checks',
        '3. Handle type guard failures',
        '4. Implement frame reconstruction',
        '5. Transfer to interpreter state',
        '6. Handle OSR deoptimization',
        '7. Track deoptimization reasons',
        '8. Implement recompilation blacklisting',
        '9. Add deoptimization logging',
        '10. Test deoptimization correctness'
      ],
      outputFormat: 'JSON with deoptimization'
    },
    outputSchema: {
      type: 'object',
      required: ['triggers', 'features', 'artifacts'],
      properties: {
        triggers: { type: 'array', items: { type: 'string' } },
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
  labels: ['programming-languages', 'jit', 'deoptimization']
}));

export const codeCacheTask = defineTask('code-cache', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Code Cache - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Implement code cache',
      context: args,
      instructions: [
        '1. Design code cache structure',
        '2. Implement code memory allocation',
        '3. Handle code alignment',
        '4. Implement code lookup',
        '5. Design eviction policy',
        '6. Handle code invalidation',
        '7. Implement memory protection',
        '8. Add cache statistics',
        '9. Handle cache pressure',
        '10. Test cache behavior'
      ],
      outputFormat: 'JSON with code cache'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'evictionPolicy', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        evictionPolicy: { type: 'string' },
        cacheSize: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'jit', 'cache']
}));

export const jitIntegrationTask = defineTask('jit-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: JIT Integration - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'JIT Compiler Engineer',
      task: 'Integrate JIT compiler',
      context: args,
      instructions: [
        '1. Create main JIT class',
        '2. Integrate all components',
        '3. Implement compile() API',
        '4. Add configuration options',
        '5. Implement threading model',
        '6. Add debug/trace support',
        '7. Integrate with interpreter',
        '8. Handle error conditions',
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
  labels: ['programming-languages', 'jit', 'integration']
}));

export const jitTestingTask = defineTask('jit-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: JIT Testing - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive JIT tests',
      context: args,
      instructions: [
        '1. Test code generation correctness',
        '2. Test optimization passes',
        '3. Test deoptimization',
        '4. Test tier transitions',
        '5. Test code cache',
        '6. Benchmark speedup',
        '7. Test edge cases',
        '8. Stress test compilation',
        '9. Measure code coverage',
        '10. Add regression tests'
      ],
      outputFormat: 'JSON with test suite'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'speedup', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        speedup: { type: 'string' },
        benchmarks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'jit', 'testing']
}));

export const jitDocumentationTask = defineTask('jit-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: JIT Documentation - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate JIT documentation',
      context: args,
      instructions: [
        '1. Create architecture guide',
        '2. Document profiling system',
        '3. Document optimization tiers',
        '4. Document deoptimization',
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
      required: ['architecturePath', 'artifacts'],
      properties: {
        architecturePath: { type: 'string' },
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
  labels: ['programming-languages', 'jit', 'documentation']
}));

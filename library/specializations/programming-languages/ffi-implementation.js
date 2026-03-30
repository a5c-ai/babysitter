/**
 * @process specializations/programming-languages/ffi-implementation
 * @description FFI Implementation - Process for implementing Foreign Function Interface to enable interoperability
 * with C/C++ libraries and other language runtimes.
 * @inputs { languageName: string, targetLanguages?: array, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, ffiSystem: object, bindings: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/ffi-implementation', {
 *   languageName: 'MyLang',
 *   targetLanguages: ['C', 'C++']
 * });
 *
 * @references
 * - libffi: https://sourceware.org/libffi/
 * - Rust FFI: https://doc.rust-lang.org/nomicon/ffi.html
 * - Python ctypes: https://docs.python.org/3/library/ctypes.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    targetLanguages = ['C'],
    implementationLanguage = 'Rust',
    outputDir = 'ffi-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting FFI Implementation: ${languageName}`);
  ctx.log('info', `Target languages: ${targetLanguages.join(', ')}`);

  // ============================================================================
  // PHASE 1: TYPE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Implementing Type Mapping');

  const typeMapping = await ctx.task(ffiTypeMappingTask, {
    languageName,
    targetLanguages,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeMapping.artifacts);

  // ============================================================================
  // PHASE 2: CALLING CONVENTIONS
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Calling Conventions');

  const callingConventions = await ctx.task(callingConventionsTask, {
    languageName,
    targetLanguages,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...callingConventions.artifacts);

  await ctx.breakpoint({
    question: `Calling conventions implemented: ${callingConventions.conventions.join(', ')}. Proceed with memory management?`,
    title: 'Calling Conventions Review',
    context: {
      runId: ctx.runId,
      conventions: callingConventions.conventions,
      files: callingConventions.artifacts.map(a => ({ path: a.path, format: a.format || 'rust' }))
    }
  });

  // ============================================================================
  // PHASE 3: MEMORY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Memory Management');

  const memoryManagement = await ctx.task(ffiMemoryManagementTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...memoryManagement.artifacts);

  // ============================================================================
  // PHASE 4: BINDING GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Binding Generation');

  const bindingGeneration = await ctx.task(bindingGenerationTask, {
    languageName,
    targetLanguages,
    typeMapping,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...bindingGeneration.artifacts);

  // ============================================================================
  // PHASE 5: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating FFI System');

  const integration = await ctx.task(ffiIntegrationTask, {
    languageName,
    typeMapping,
    callingConventions,
    memoryManagement,
    bindingGeneration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 6: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating Tests');

  const testSuite = await ctx.task(ffiTestingTask, {
    languageName,
    integration,
    targetLanguages,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Documentation');

  const documentation = await ctx.task(ffiDocumentationTask, {
    languageName,
    targetLanguages,
    typeMapping,
    integration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `FFI Implementation Complete for ${languageName}! Target: ${targetLanguages.join(', ')}, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'FFI Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        targetLanguages,
        typeMappings: typeMapping.mappingCount,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'FFI System' },
        { path: documentation.guidePath, format: 'markdown', label: 'FFI Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    ffiSystem: {
      mainFile: integration.mainFilePath,
      targetLanguages
    },
    bindings: {
      typeMappings: typeMapping.mappingCount,
      conventions: callingConventions.conventions
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/ffi-implementation',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const ffiTypeMappingTask = defineTask('ffi-type-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: FFI Type Mapping - ${args.languageName}`,
  agent: {
    name: 'ffi-interop-engineer',
    prompt: {
      role: 'FFI Engineer',
      task: 'Implement type mapping',
      context: args,
      instructions: [
        '1. Map primitive types (int, float, etc.)',
        '2. Map pointer types',
        '3. Handle struct layout',
        '4. Handle union types',
        '5. Map arrays',
        '6. Handle strings (null-terminated)',
        '7. Handle function pointers',
        '8. Handle opaque types',
        '9. Validate type sizes',
        '10. Test type conversions'
      ],
      outputFormat: 'JSON with type mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['mappingCount', 'mappings', 'artifacts'],
      properties: {
        mappingCount: { type: 'number' },
        mappings: { type: 'array', items: { type: 'object' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ffi', 'type-mapping']
}));

export const callingConventionsTask = defineTask('calling-conventions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Calling Conventions - ${args.languageName}`,
  agent: {
    name: 'ffi-interop-engineer',
    prompt: {
      role: 'FFI Engineer',
      task: 'Implement calling conventions',
      context: args,
      instructions: [
        '1. Implement C calling convention',
        '2. Handle stdcall (Windows)',
        '3. Handle fastcall',
        '4. Handle System V AMD64 ABI',
        '5. Handle ARM calling convention',
        '6. Handle return values',
        '7. Handle stack alignment',
        '8. Handle variadic functions',
        '9. Test cross-platform',
        '10. Document conventions'
      ],
      outputFormat: 'JSON with calling conventions'
    },
    outputSchema: {
      type: 'object',
      required: ['conventions', 'filePath', 'artifacts'],
      properties: {
        conventions: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        platforms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ffi', 'calling-conventions']
}));

export const ffiMemoryManagementTask = defineTask('ffi-memory-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: FFI Memory Management - ${args.languageName}`,
  agent: {
    name: 'ffi-interop-engineer',
    prompt: {
      role: 'FFI Engineer',
      task: 'Implement FFI memory management',
      context: args,
      instructions: [
        '1. Handle ownership across boundary',
        '2. Implement safe pointer wrappers',
        '3. Handle buffer allocation',
        '4. Handle string conversion',
        '5. Implement cleanup/finalization',
        '6. Handle callbacks safely',
        '7. Prevent dangling pointers',
        '8. Handle lifetime issues',
        '9. Add memory debugging',
        '10. Test memory safety'
      ],
      outputFormat: 'JSON with memory management'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        safetyMeasures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ffi', 'memory']
}));

export const bindingGenerationTask = defineTask('binding-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Binding Generation - ${args.languageName}`,
  agent: {
    name: 'ffi-interop-engineer',
    prompt: {
      role: 'FFI Engineer',
      task: 'Implement binding generation',
      context: args,
      instructions: [
        '1. Parse C header files',
        '2. Generate language bindings',
        '3. Handle preprocessor macros',
        '4. Generate wrapper functions',
        '5. Handle inline functions',
        '6. Generate type definitions',
        '7. Support binding configuration',
        '8. Handle platform differences',
        '9. Generate documentation',
        '10. Test generated bindings'
      ],
      outputFormat: 'JSON with binding generation'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        generatorType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ffi', 'bindings']
}));

export const ffiIntegrationTask = defineTask('ffi-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: FFI Integration - ${args.languageName}`,
  agent: {
    name: 'ffi-interop-engineer',
    prompt: {
      role: 'FFI Engineer',
      task: 'Integrate FFI system',
      context: args,
      instructions: [
        '1. Create main FFI API',
        '2. Integrate all components',
        '3. Add loading mechanism',
        '4. Handle symbol resolution',
        '5. Add configuration',
        '6. Handle errors',
        '7. Add debugging support',
        '8. Add metrics',
        '9. Handle platform differences',
        '10. Final organization'
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
  labels: ['programming-languages', 'ffi', 'integration']
}));

export const ffiTestingTask = defineTask('ffi-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: FFI Testing - ${args.languageName}`,
  agent: {
    name: 'ffi-interop-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive FFI tests',
      context: args,
      instructions: [
        '1. Test type conversions',
        '2. Test function calls',
        '3. Test callbacks',
        '4. Test memory management',
        '5. Test error handling',
        '6. Test with real libraries',
        '7. Test cross-platform',
        '8. Stress test',
        '9. Measure coverage',
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
  labels: ['programming-languages', 'ffi', 'testing']
}));

export const ffiDocumentationTask = defineTask('ffi-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: FFI Documentation - ${args.languageName}`,
  agent: {
    name: 'ffi-interop-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate FFI documentation',
      context: args,
      instructions: [
        '1. Create FFI guide',
        '2. Document type mappings',
        '3. Document calling conventions',
        '4. Add safety guidelines',
        '5. Create API reference',
        '6. Add examples',
        '7. Document binding generation',
        '8. Add troubleshooting',
        '9. Document platform notes',
        '10. Add best practices'
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
  labels: ['programming-languages', 'ffi', 'documentation']
}));

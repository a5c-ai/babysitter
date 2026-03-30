/**
 * @process specializations/programming-languages/code-generation-llvm
 * @description Code Generation (LLVM) - Process for implementing code generation using LLVM. Covers LLVM IR generation,
 * optimization passes, debug information, and machine code emission.
 * @inputs { languageName: string, targetTriple?: string, optimizationLevel?: number, debugInfo?: boolean, outputDir?: string }
 * @outputs { success: boolean, codeGenerator: object, llvmIntegration: object, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/code-generation-llvm', {
 *   languageName: 'MyLang',
 *   targetTriple: 'x86_64-unknown-linux-gnu',
 *   optimizationLevel: 2,
 *   debugInfo: true
 * });
 *
 * @references
 * - LLVM Tutorial: https://llvm.org/docs/tutorial/
 * - LLVM Language Reference: https://llvm.org/docs/LangRef.html
 * - Getting Started with LLVM Core Libraries
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    targetTriple = 'native',
    optimizationLevel = 2,
    debugInfo = true,
    implementationLanguage = 'C++',
    outputDir = 'codegen-llvm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LLVM Code Generation: ${languageName}`);
  ctx.log('info', `Target: ${targetTriple}, Optimization: O${optimizationLevel}`);

  // ============================================================================
  // PHASE 1: LLVM INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up LLVM Infrastructure');

  const llvmSetup = await ctx.task(llvmSetupTask, {
    languageName,
    targetTriple,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...llvmSetup.artifacts);

  // ============================================================================
  // PHASE 2: TYPE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Type Mapping');

  const typeMapping = await ctx.task(typeMappingTask, {
    languageName,
    llvmSetup,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeMapping.artifacts);

  await ctx.breakpoint({
    question: `Type mapping complete. ${typeMapping.typeMappings} types mapped to LLVM. Proceed with expression codegen?`,
    title: 'Type Mapping Review',
    context: {
      runId: ctx.runId,
      typeMappings: typeMapping.typeMappings,
      files: typeMapping.artifacts.map(a => ({ path: a.path, format: a.format || 'cpp' }))
    }
  });

  // ============================================================================
  // PHASE 3: EXPRESSION CODE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Expression Code Generation');

  const expressionCodegen = await ctx.task(expressionCodegenTask, {
    languageName,
    llvmSetup,
    typeMapping,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...expressionCodegen.artifacts);

  // ============================================================================
  // PHASE 4: STATEMENT CODE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Statement Code Generation');

  const statementCodegen = await ctx.task(statementCodegenTask, {
    languageName,
    llvmSetup,
    typeMapping,
    expressionCodegen,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...statementCodegen.artifacts);

  // ============================================================================
  // PHASE 5: FUNCTION CODE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Function Code Generation');

  const functionCodegen = await ctx.task(functionCodegenTask, {
    languageName,
    llvmSetup,
    typeMapping,
    statementCodegen,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...functionCodegen.artifacts);

  // ============================================================================
  // PHASE 6: RUNTIME SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Runtime Support');

  const runtimeSupport = await ctx.task(runtimeSupportTask, {
    languageName,
    llvmSetup,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...runtimeSupport.artifacts);

  // ============================================================================
  // PHASE 7: OPTIMIZATION CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring Optimizations');

  const optimizationConfig = await ctx.task(llvmOptimizationTask, {
    languageName,
    llvmSetup,
    optimizationLevel,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...optimizationConfig.artifacts);

  // ============================================================================
  // PHASE 8: DEBUG INFORMATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Debug Information');

  const debugInfoGen = await ctx.task(debugInfoTask, {
    languageName,
    llvmSetup,
    debugInfo,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...debugInfoGen.artifacts);

  await ctx.breakpoint({
    question: `Debug info generation ${debugInfo ? 'enabled' : 'disabled'}. DWARF support: ${debugInfoGen.dwarfSupport}. Continue with testing?`,
    title: 'Debug Info Review',
    context: {
      runId: ctx.runId,
      debugInfo,
      dwarfSupport: debugInfoGen.dwarfSupport,
      files: debugInfoGen.artifacts.map(a => ({ path: a.path, format: a.format || 'cpp' }))
    }
  });

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating Tests');

  const testSuite = await ctx.task(codegenTestingTask, {
    languageName,
    llvmSetup,
    expressionCodegen,
    statementCodegen,
    functionCodegen,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 10: BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 10: Running Benchmarks');

  const benchmarks = await ctx.task(codegenBenchmarkTask, {
    languageName,
    llvmSetup,
    optimizationLevel,
    outputDir
  });

  artifacts.push(...benchmarks.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating Documentation');

  const documentation = await ctx.task(codegenDocumentationTask, {
    languageName,
    llvmSetup,
    typeMapping,
    optimizationConfig,
    debugInfoGen,
    testSuite,
    benchmarks,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `LLVM Code Generation Complete for ${languageName}! Test coverage: ${testSuite.coverage}%. Generated code performance: ${benchmarks.performanceRating}. Review deliverables?`,
    title: 'Code Generation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        targetTriple,
        optimizationLevel,
        testCoverage: testSuite.coverage,
        performanceRating: benchmarks.performanceRating
      },
      files: [
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' },
        { path: documentation.architecturePath, format: 'markdown', label: 'Architecture Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    codeGenerator: {
      targetTriple,
      optimizationLevel,
      features: functionCodegen.features
    },
    llvmIntegration: {
      llvmVersion: llvmSetup.llvmVersion,
      targetFeatures: llvmSetup.targetFeatures
    },
    typeMapping: {
      typeMappings: typeMapping.typeMappings,
      aggregateTypes: typeMapping.aggregateTypes
    },
    debugInfo: {
      enabled: debugInfo,
      dwarfSupport: debugInfoGen.dwarfSupport
    },
    benchmarks: {
      performanceRating: benchmarks.performanceRating,
      compilationSpeed: benchmarks.compilationSpeed
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      apiDocPath: documentation.apiDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/code-generation-llvm',
      timestamp: startTime,
      languageName,
      targetTriple
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const llvmSetupTask = defineTask('llvm-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: LLVM Setup - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Set up LLVM infrastructure',
      context: args,
      instructions: [
        '1. Initialize LLVM context',
        '2. Create module and builder',
        '3. Configure target machine',
        '4. Set up target triple',
        '5. Initialize target info',
        '6. Configure data layout',
        '7. Set up optimization passes',
        '8. Create module pass manager',
        '9. Configure code generation options',
        '10. Verify LLVM setup'
      ],
      outputFormat: 'JSON with LLVM setup'
    },
    outputSchema: {
      type: 'object',
      required: ['llvmVersion', 'targetFeatures', 'artifacts'],
      properties: {
        llvmVersion: { type: 'string' },
        targetFeatures: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'llvm-setup']
}));

export const typeMappingTask = defineTask('type-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Type Mapping - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Implement type mapping to LLVM',
      context: args,
      instructions: [
        '1. Map primitive types to LLVM types',
        '2. Map integer types with sizes',
        '3. Map floating point types',
        '4. Map boolean type',
        '5. Handle aggregate types (structs)',
        '6. Handle array types',
        '7. Handle pointer types',
        '8. Handle function types',
        '9. Handle generic types',
        '10. Test type mapping'
      ],
      outputFormat: 'JSON with type mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['typeMappings', 'aggregateTypes', 'artifacts'],
      properties: {
        typeMappings: { type: 'number' },
        aggregateTypes: { type: 'number' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'type-mapping']
}));

export const expressionCodegenTask = defineTask('expression-codegen', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Expression Codegen - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Implement expression code generation',
      context: args,
      instructions: [
        '1. Generate arithmetic operations',
        '2. Generate comparison operations',
        '3. Generate logical operations',
        '4. Generate function calls',
        '5. Handle short-circuit evaluation',
        '6. Generate member access',
        '7. Generate array indexing',
        '8. Handle type conversions',
        '9. Generate literals',
        '10. Test expression codegen'
      ],
      outputFormat: 'JSON with expression codegen'
    },
    outputSchema: {
      type: 'object',
      required: ['expressionTypes', 'filePath', 'artifacts'],
      properties: {
        expressionTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'expressions']
}));

export const statementCodegenTask = defineTask('statement-codegen', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Statement Codegen - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Implement statement code generation',
      context: args,
      instructions: [
        '1. Generate variable declarations',
        '2. Generate assignments',
        '3. Generate if/else statements',
        '4. Generate while loops',
        '5. Generate for loops',
        '6. Generate switch/match statements',
        '7. Generate return statements',
        '8. Generate break/continue',
        '9. Handle blocks and scopes',
        '10. Test statement codegen'
      ],
      outputFormat: 'JSON with statement codegen'
    },
    outputSchema: {
      type: 'object',
      required: ['statementTypes', 'filePath', 'artifacts'],
      properties: {
        statementTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'statements']
}));

export const functionCodegenTask = defineTask('function-codegen', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Function Codegen - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Implement function code generation',
      context: args,
      instructions: [
        '1. Generate function declarations',
        '2. Generate function definitions',
        '3. Handle calling conventions',
        '4. Generate parameter handling',
        '5. Generate return value handling',
        '6. Handle variadic functions',
        '7. Generate closures/lambdas',
        '8. Handle method dispatch',
        '9. Generate entry/exit blocks',
        '10. Test function codegen'
      ],
      outputFormat: 'JSON with function codegen'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        callingConventions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'functions']
}));

export const runtimeSupportTask = defineTask('runtime-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Runtime Support - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Implement runtime support',
      context: args,
      instructions: [
        '1. Generate runtime call stubs',
        '2. Handle memory allocation',
        '3. Implement exception handling',
        '4. Generate type info (RTTI)',
        '5. Handle string operations',
        '6. Generate array bounds checks',
        '7. Implement panic/abort',
        '8. Handle initialization',
        '9. Generate cleanup code',
        '10. Test runtime integration'
      ],
      outputFormat: 'JSON with runtime support'
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeFunctions', 'filePath', 'artifacts'],
      properties: {
        runtimeFunctions: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'runtime']
}));

export const llvmOptimizationTask = defineTask('llvm-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: LLVM Optimization - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Configure LLVM optimization pipeline',
      context: args,
      instructions: [
        '1. Configure optimization levels',
        '2. Set up standard passes',
        '3. Configure inlining thresholds',
        '4. Enable vectorization',
        '5. Configure loop optimizations',
        '6. Enable link-time optimization',
        '7. Configure code size optimization',
        '8. Set target-specific options',
        '9. Benchmark optimization impact',
        '10. Document optimization settings'
      ],
      outputFormat: 'JSON with optimization config'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizationPasses', 'filePath', 'artifacts'],
      properties: {
        optimizationPasses: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        ltoEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'optimization']
}));

export const debugInfoTask = defineTask('debug-info', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Debug Info - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'LLVM Engineer',
      task: 'Generate debug information',
      context: args,
      instructions: [
        '1. Create debug info builder',
        '2. Generate compile unit',
        '3. Generate file info',
        '4. Generate type debug info',
        '5. Generate function debug info',
        '6. Map source locations',
        '7. Generate variable debug info',
        '8. Support DWARF/CodeView',
        '9. Handle inlined functions',
        '10. Test with debugger'
      ],
      outputFormat: 'JSON with debug info'
    },
    outputSchema: {
      type: 'object',
      required: ['dwarfSupport', 'filePath', 'artifacts'],
      properties: {
        dwarfSupport: { type: 'boolean' },
        filePath: { type: 'string' },
        debugFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'debug-info']
}));

export const codegenTestingTask = defineTask('codegen-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Codegen Testing - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'Compiler Test Engineer',
      task: 'Create comprehensive codegen tests',
      context: args,
      instructions: [
        '1. Test expression generation',
        '2. Test statement generation',
        '3. Test function generation',
        '4. Test type handling',
        '5. Test runtime functions',
        '6. Test optimization output',
        '7. Test debug info',
        '8. Test cross-compilation',
        '9. Measure code coverage',
        '10. Add execution tests'
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
  labels: ['programming-languages', 'codegen', 'testing']
}));

export const codegenBenchmarkTask = defineTask('codegen-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Codegen Benchmarking - ${args.languageName}`,
  agent: {
    name: 'compiler-performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark generated code',
      context: args,
      instructions: [
        '1. Create benchmark programs',
        '2. Measure compilation speed',
        '3. Measure binary size',
        '4. Measure execution speed',
        '5. Compare optimization levels',
        '6. Profile hot paths',
        '7. Compare with reference compilers',
        '8. Measure memory usage',
        '9. Test startup time',
        '10. Generate benchmark reports'
      ],
      outputFormat: 'JSON with benchmarks'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceRating', 'compilationSpeed', 'artifacts'],
      properties: {
        performanceRating: { type: 'string' },
        compilationSpeed: { type: 'string' },
        binarySize: { type: 'string' },
        executionBenchmarks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'benchmarking']
}));

export const codegenDocumentationTask = defineTask('codegen-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Codegen Documentation - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate code generation documentation',
      context: args,
      instructions: [
        '1. Create architecture documentation',
        '2. Document type mappings',
        '3. Document calling conventions',
        '4. Document optimization options',
        '5. Document debug info format',
        '6. Create API reference',
        '7. Add integration examples',
        '8. Document target requirements',
        '9. Add troubleshooting guide',
        '10. Create performance tuning guide'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocPath', 'architecturePath', 'artifacts'],
      properties: {
        apiDocPath: { type: 'string' },
        architecturePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'codegen', 'documentation']
}));

/**
 * @process specializations/programming-languages/type-system-implementation
 * @description Type System Implementation - Comprehensive process for implementing type checking and type inference.
 * Covers type representation, checking algorithms, inference, subtyping, and error reporting.
 * @inputs { languageName: string, typeSystemStyle?: string, inferenceLevel?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, typeChecker: object, inferenceSystem: object, errorDiagnostics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/type-system-implementation', {
 *   languageName: 'MyLang',
 *   typeSystemStyle: 'gradual',
 *   inferenceLevel: 'local',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - Types and Programming Languages by Pierce
 * - Practical Foundations for Programming Languages by Harper
 * - Hindley-Milner Type Inference: https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system
 * - Bidirectional Type Checking: https://arxiv.org/abs/1908.05839
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    typeSystemStyle = 'static',
    inferenceLevel = 'local',
    subtypingStyle = 'structural',
    implementationLanguage = 'TypeScript',
    outputDir = 'type-system-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Type System Implementation: ${languageName}`);
  ctx.log('info', `Style: ${typeSystemStyle}, Inference: ${inferenceLevel}`);

  // ============================================================================
  // PHASE 1: TYPE REPRESENTATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Type Representation');

  const typeRepresentation = await ctx.task(typeRepresentationTask, {
    languageName,
    typeSystemStyle,
    subtypingStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeRepresentation.artifacts);

  await ctx.breakpoint({
    question: `Type representation designed with ${typeRepresentation.typeCount} type kinds. Primitives: ${typeRepresentation.primitives.length}, Compound: ${typeRepresentation.compounds.length}. Proceed with environment?`,
    title: 'Type Representation Review',
    context: {
      runId: ctx.runId,
      typeCount: typeRepresentation.typeCount,
      primitives: typeRepresentation.primitives,
      compounds: typeRepresentation.compounds,
      files: typeRepresentation.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 2: TYPE ENVIRONMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Type Environment');

  const typeEnvironment = await ctx.task(typeEnvironmentTask, {
    languageName,
    typeRepresentation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeEnvironment.artifacts);

  // ============================================================================
  // PHASE 3: TYPE CHECKING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Type Checking');

  const typeChecking = await ctx.task(typeCheckingTask, {
    languageName,
    typeSystemStyle,
    typeRepresentation,
    typeEnvironment,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeChecking.artifacts);

  // ============================================================================
  // PHASE 4: TYPE INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Type Inference');

  const typeInference = await ctx.task(typeInferenceTask, {
    languageName,
    inferenceLevel,
    typeRepresentation,
    typeEnvironment,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeInference.artifacts);

  // ============================================================================
  // PHASE 5: SUBTYPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Subtyping');

  const subtyping = await ctx.task(subtypingTask, {
    languageName,
    subtypingStyle,
    typeRepresentation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...subtyping.artifacts);

  await ctx.breakpoint({
    question: `Subtyping implemented: ${subtypingStyle} style. Variance support: ${subtyping.varianceSupport}. Continue with error reporting?`,
    title: 'Subtyping Review',
    context: {
      runId: ctx.runId,
      subtypingStyle,
      varianceSupport: subtyping.varianceSupport,
      rules: subtyping.rules,
      files: subtyping.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: ERROR REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Error Reporting');

  const errorReporting = await ctx.task(typeErrorReportingTask, {
    languageName,
    typeRepresentation,
    typeChecking,
    typeInference,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...errorReporting.artifacts);

  // ============================================================================
  // PHASE 7: TYPE CHECKER INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating Type Checker');

  const typeCheckerIntegration = await ctx.task(typeCheckerIntegrationTask, {
    languageName,
    typeRepresentation,
    typeEnvironment,
    typeChecking,
    typeInference,
    subtyping,
    errorReporting,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeCheckerIntegration.artifacts);

  // ============================================================================
  // PHASE 8: UNIT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Unit Tests');

  const testSuite = await ctx.task(typeSystemTestingTask, {
    languageName,
    typeCheckerIntegration,
    typeRepresentation,
    typeInference,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Documentation');

  const documentation = await ctx.task(typeSystemDocumentationTask, {
    languageName,
    typeSystemStyle,
    inferenceLevel,
    typeRepresentation,
    typeCheckerIntegration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Type System Implementation Complete for ${languageName}! Test coverage: ${testSuite.coverage}%, Type kinds: ${typeRepresentation.typeCount}. Review deliverables?`,
    title: 'Type System Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        typeSystemStyle,
        inferenceLevel,
        typeCount: typeRepresentation.typeCount,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: typeCheckerIntegration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Type Checker' },
        { path: documentation.specPath, format: 'markdown', label: 'Type System Specification' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    typeChecker: {
      mainFile: typeCheckerIntegration.mainFilePath,
      typeSystemStyle,
      features: typeCheckerIntegration.features
    },
    typeRepresentation: {
      typeCount: typeRepresentation.typeCount,
      primitives: typeRepresentation.primitives,
      compounds: typeRepresentation.compounds
    },
    inferenceSystem: {
      level: inferenceLevel,
      algorithm: typeInference.algorithm,
      features: typeInference.features
    },
    subtyping: {
      style: subtypingStyle,
      varianceSupport: subtyping.varianceSupport
    },
    errorDiagnostics: {
      errorCount: errorReporting.errorCount,
      categories: errorReporting.categories
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      specPath: documentation.specPath,
      apiDocPath: documentation.apiDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/type-system-implementation',
      timestamp: startTime,
      languageName,
      typeSystemStyle
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const typeRepresentationTask = defineTask('type-representation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Type Representation - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Type System Engineer',
      task: 'Design type representation',
      context: args,
      instructions: [
        '1. Define primitive types (int, float, bool, string)',
        '2. Design composite types (arrays, tuples, records)',
        '3. Design function types',
        '4. Design user-defined types (structs, classes)',
        '5. Handle type parameters (generics)',
        '6. Design type aliases',
        '7. Handle union/intersection types (if applicable)',
        '8. Design special types (void, never, any)',
        '9. Implement type equality',
        '10. Create type pretty-printing'
      ],
      outputFormat: 'JSON with type representation'
    },
    outputSchema: {
      type: 'object',
      required: ['typeCount', 'primitives', 'compounds', 'artifacts'],
      properties: {
        typeCount: { type: 'number' },
        primitives: { type: 'array', items: { type: 'string' } },
        compounds: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'type-system', 'representation']
}));

export const typeEnvironmentTask = defineTask('type-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Type Environment - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Type System Engineer',
      task: 'Implement type environment',
      context: args,
      instructions: [
        '1. Design type environment structure',
        '2. Implement scope management',
        '3. Handle type bindings',
        '4. Support type aliases/synonyms',
        '5. Handle module boundaries',
        '6. Implement type lookup',
        '7. Support forward references',
        '8. Handle shadowing',
        '9. Implement environment merging',
        '10. Create environment utilities'
      ],
      outputFormat: 'JSON with type environment'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        scopeHandling: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'type-system', 'environment']
}));

export const typeCheckingTask = defineTask('type-checking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Type Checking - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Type System Engineer',
      task: 'Implement type checking',
      context: args,
      instructions: [
        '1. Check expression types',
        '2. Check statement types',
        '3. Validate declarations',
        '4. Check function call types',
        '5. Check assignment compatibility',
        '6. Validate return types',
        '7. Check operator types',
        '8. Validate generic instantiation',
        '9. Check pattern matching exhaustiveness',
        '10. Implement type checking visitor'
      ],
      outputFormat: 'JSON with type checking'
    },
    outputSchema: {
      type: 'object',
      required: ['checkedConstructs', 'filePath', 'artifacts'],
      properties: {
        checkedConstructs: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        checkingRules: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'type-system', 'checking']
}));

export const typeInferenceTask = defineTask('type-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Type Inference - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Type System Engineer',
      task: 'Implement type inference',
      context: args,
      instructions: [
        '1. Implement constraint generation',
        '2. Implement unification algorithm',
        '3. Handle type variables',
        '4. Implement let-polymorphism (if HM)',
        '5. Implement bidirectional inference',
        '6. Handle inference in expressions',
        '7. Infer function parameter types',
        '8. Handle generic inference',
        '9. Implement inference fallback',
        '10. Test inference completeness'
      ],
      outputFormat: 'JSON with type inference'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'features', 'filePath', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
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
  labels: ['programming-languages', 'type-system', 'inference']
}));

export const subtypingTask = defineTask('subtyping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Subtyping - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Type System Engineer',
      task: 'Implement subtyping',
      context: args,
      instructions: [
        '1. Define subtyping rules',
        '2. Implement subtype checking',
        '3. Handle variance (covariant, contravariant, invariant)',
        '4. Support structural or nominal subtyping',
        '5. Handle generic variance',
        '6. Implement width and depth subtyping',
        '7. Handle function subtyping',
        '8. Support intersection/union subtyping',
        '9. Optimize subtype checking',
        '10. Test subtyping correctness'
      ],
      outputFormat: 'JSON with subtyping'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'varianceSupport', 'artifacts'],
      properties: {
        rules: { type: 'array', items: { type: 'string' } },
        varianceSupport: { type: 'boolean' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'type-system', 'subtyping']
}));

export const typeErrorReportingTask = defineTask('type-error-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Reporting - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Diagnostics Engineer',
      task: 'Implement type error reporting',
      context: args,
      instructions: [
        '1. Design type error message format',
        '2. Show expected vs actual types',
        '3. Provide fix suggestions',
        '4. Handle error cascades',
        '5. Add related information',
        '6. Format type names readably',
        '7. Support error recovery',
        '8. Add error codes',
        '9. Support machine-readable output',
        '10. Test error message quality'
      ],
      outputFormat: 'JSON with error reporting'
    },
    outputSchema: {
      type: 'object',
      required: ['errorCount', 'categories', 'artifacts'],
      properties: {
        errorCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        suggestionsEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'type-system', 'error-reporting']
}));

export const typeCheckerIntegrationTask = defineTask('type-checker-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Type Checker Integration - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Type System Engineer',
      task: 'Integrate type checker components',
      context: args,
      instructions: [
        '1. Create main TypeChecker class',
        '2. Integrate all type checking components',
        '3. Implement public check() API',
        '4. Add configuration options',
        '5. Implement incremental checking hooks',
        '6. Add debug/trace mode',
        '7. Create type checker factory',
        '8. Integrate with error reporter',
        '9. Add caching support',
        '10. Final code organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'features', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        publicApi: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'type-system', 'integration']
}));

export const typeSystemTestingTask = defineTask('type-system-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Type System Testing - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Test Engineer',
      task: 'Create comprehensive type system tests',
      context: args,
      instructions: [
        '1. Test type checking correctness',
        '2. Test type inference completeness',
        '3. Test subtyping correctness',
        '4. Test error messages quality',
        '5. Test generic instantiation',
        '6. Test edge cases',
        '7. Test performance',
        '8. Test error recovery',
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
  labels: ['programming-languages', 'type-system', 'testing']
}));

export const typeSystemDocumentationTask = defineTask('type-system-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Type System Documentation - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate type system documentation',
      context: args,
      instructions: [
        '1. Create type system specification',
        '2. Document all type kinds',
        '3. Document type inference behavior',
        '4. Document subtyping rules',
        '5. Create API reference',
        '6. Add usage examples',
        '7. Document error messages',
        '8. Create troubleshooting guide',
        '9. Add architecture overview',
        '10. Document design decisions'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'apiDocPath', 'artifacts'],
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
  labels: ['programming-languages', 'type-system', 'documentation']
}));

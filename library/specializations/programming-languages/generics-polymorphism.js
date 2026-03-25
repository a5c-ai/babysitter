/**
 * @process specializations/programming-languages/generics-polymorphism
 * @description Generics and Polymorphism - Process for implementing parametric polymorphism, generics, traits/interfaces,
 * type bounds, and monomorphization or type erasure strategies.
 * @inputs { languageName: string, polymorphismStyle?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, genericsSystem: object, polymorphism: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/generics-polymorphism', {
 *   languageName: 'MyLang',
 *   polymorphismStyle: 'monomorphization'
 * });
 *
 * @references
 * - Rust Generics: https://doc.rust-lang.org/book/ch10-00-generics.html
 * - Haskell Type Classes: https://wiki.haskell.org/Type_class
 * - Java Generics: https://docs.oracle.com/javase/tutorial/java/generics/
 * - C++ Templates: https://en.cppreference.com/w/cpp/language/templates
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    polymorphismStyle = 'monomorphization',
    implementationLanguage = 'Rust',
    outputDir = 'generics-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Generics and Polymorphism: ${languageName}`);
  ctx.log('info', `Polymorphism style: ${polymorphismStyle}`);

  // ============================================================================
  // PHASE 1: GENERIC SYNTAX DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Generic Syntax');

  const genericSyntax = await ctx.task(genericSyntaxTask, {
    languageName,
    polymorphismStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...genericSyntax.artifacts);

  // ============================================================================
  // PHASE 2: TYPE PARAMETERS
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Type Parameters');

  const typeParameters = await ctx.task(typeParametersTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeParameters.artifacts);

  await ctx.breakpoint({
    question: `Type parameters implemented. Features: ${typeParameters.features.join(', ')}. Proceed with bounds?`,
    title: 'Type Parameters Review',
    context: {
      runId: ctx.runId,
      features: typeParameters.features,
      files: typeParameters.artifacts.map(a => ({ path: a.path, format: a.format || 'rust' }))
    }
  });

  // ============================================================================
  // PHASE 3: TYPE BOUNDS AND CONSTRAINTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Type Bounds');

  const typeBounds = await ctx.task(typeBoundsTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeBounds.artifacts);

  // ============================================================================
  // PHASE 4: TRAITS/INTERFACES
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Traits/Interfaces');

  const traitsInterfaces = await ctx.task(traitsInterfacesTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...traitsInterfaces.artifacts);

  // ============================================================================
  // PHASE 5: TYPE INFERENCE FOR GENERICS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Type Inference for Generics');

  const typeInference = await ctx.task(genericTypeInferenceTask, {
    languageName,
    typeParameters,
    typeBounds,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...typeInference.artifacts);

  // ============================================================================
  // PHASE 6: INSTANTIATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Instantiation Strategy');

  const instantiation = await ctx.task(instantiationStrategyTask, {
    languageName,
    polymorphismStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...instantiation.artifacts);

  // ============================================================================
  // PHASE 7: VARIANCE
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Variance');

  const variance = await ctx.task(varianceTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...variance.artifacts);

  // ============================================================================
  // PHASE 8: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Integrating Generics System');

  const integration = await ctx.task(genericsIntegrationTask, {
    languageName,
    genericSyntax,
    typeParameters,
    typeBounds,
    traitsInterfaces,
    typeInference,
    instantiation,
    variance,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating Tests');

  const testSuite = await ctx.task(genericsTestingTask, {
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

  const documentation = await ctx.task(genericsDocumentationTask, {
    languageName,
    polymorphismStyle,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Generics System Complete for ${languageName}! Style: ${polymorphismStyle}, Variance: ${variance.varianceTypes.join(', ')}. Review deliverables?`,
    title: 'Generics Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        polymorphismStyle,
        varianceTypes: variance.varianceTypes,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Generics System' },
        { path: documentation.guidePath, format: 'markdown', label: 'Generics Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    genericsSystem: {
      mainFile: integration.mainFilePath,
      style: polymorphismStyle
    },
    polymorphism: {
      boundTypes: typeBounds.boundTypes,
      variance: variance.varianceTypes,
      instantiation: instantiation.strategy
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/generics-polymorphism',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const genericSyntaxTask = defineTask('generic-syntax', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Generic Syntax - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Programming Language Designer',
      task: 'Design generic syntax',
      context: args,
      instructions: [
        '1. Design type parameter syntax (<T>, [T], etc.)',
        '2. Design generic function syntax',
        '3. Design generic struct/class syntax',
        '4. Design generic enum syntax',
        '5. Design generic trait/interface syntax',
        '6. Design bound syntax (T: Bound)',
        '7. Design where clauses',
        '8. Design associated types',
        '9. Handle multiple parameters',
        '10. Document syntax'
      ],
      outputFormat: 'JSON with generic syntax'
    },
    outputSchema: {
      type: 'object',
      required: ['constructs', 'filePath', 'artifacts'],
      properties: {
        constructs: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'generics', 'syntax']
}));

export const typeParametersTask = defineTask('type-parameters', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Type Parameters - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement type parameters',
      context: args,
      instructions: [
        '1. Parse type parameters',
        '2. Create type parameter symbols',
        '3. Handle type parameter scope',
        '4. Implement default type parameters',
        '5. Handle const generics',
        '6. Implement lifetime parameters',
        '7. Handle higher-kinded types',
        '8. Implement type parameter lookup',
        '9. Add validation',
        '10. Test type parameters'
      ],
      outputFormat: 'JSON with type parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
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
  labels: ['programming-languages', 'generics', 'type-parameters']
}));

export const typeBoundsTask = defineTask('type-bounds', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Type Bounds - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement type bounds',
      context: args,
      instructions: [
        '1. Implement trait bounds',
        '2. Implement intersection bounds',
        '3. Implement lifetime bounds',
        '4. Handle supertraits',
        '5. Implement where clauses',
        '6. Handle higher-ranked bounds',
        '7. Implement bound checking',
        '8. Handle implied bounds',
        '9. Add bound errors',
        '10. Test type bounds'
      ],
      outputFormat: 'JSON with type bounds'
    },
    outputSchema: {
      type: 'object',
      required: ['boundTypes', 'filePath', 'artifacts'],
      properties: {
        boundTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'generics', 'bounds']
}));

export const traitsInterfacesTask = defineTask('traits-interfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Traits/Interfaces - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement traits/interfaces',
      context: args,
      instructions: [
        '1. Define trait/interface syntax',
        '2. Implement trait methods',
        '3. Handle default implementations',
        '4. Implement associated types',
        '5. Handle associated constants',
        '6. Implement trait objects',
        '7. Handle coherence/orphan rules',
        '8. Implement blanket impls',
        '9. Handle negative impls',
        '10. Test trait system'
      ],
      outputFormat: 'JSON with traits/interfaces'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
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
  labels: ['programming-languages', 'generics', 'traits']
}));

export const genericTypeInferenceTask = defineTask('generic-type-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generic Type Inference - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement type inference for generics',
      context: args,
      instructions: [
        '1. Infer type arguments',
        '2. Handle bidirectional inference',
        '3. Implement constraint solving',
        '4. Handle ambiguous inference',
        '5. Implement turbofish syntax',
        '6. Handle partial inference',
        '7. Infer from bounds',
        '8. Handle fallback types',
        '9. Add inference errors',
        '10. Test inference'
      ],
      outputFormat: 'JSON with type inference'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
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
  labels: ['programming-languages', 'generics', 'inference']
}));

export const instantiationStrategyTask = defineTask('instantiation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Instantiation Strategy - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement instantiation strategy',
      context: args,
      instructions: [
        '1. Choose strategy (monomorphization/erasure)',
        '2. Implement specialization',
        '3. Handle code generation',
        '4. Manage code bloat',
        '5. Implement caching',
        '6. Handle recursive types',
        '7. Optimize common cases',
        '8. Handle vtables (if erasure)',
        '9. Benchmark code size',
        '10. Test instantiation'
      ],
      outputFormat: 'JSON with instantiation strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'filePath', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'generics', 'instantiation']
}));

export const varianceTask = defineTask('variance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Variance - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement variance',
      context: args,
      instructions: [
        '1. Implement covariance',
        '2. Implement contravariance',
        '3. Implement invariance',
        '4. Infer variance',
        '5. Handle phantom types',
        '6. Handle function types',
        '7. Handle reference types',
        '8. Add variance annotations',
        '9. Check variance violations',
        '10. Test variance'
      ],
      outputFormat: 'JSON with variance'
    },
    outputSchema: {
      type: 'object',
      required: ['varianceTypes', 'filePath', 'artifacts'],
      properties: {
        varianceTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'generics', 'variance']
}));

export const genericsIntegrationTask = defineTask('generics-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Generics Integration - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Integrate generics system',
      context: args,
      instructions: [
        '1. Create main generics API',
        '2. Integrate with parser',
        '3. Integrate with type checker',
        '4. Integrate with code generator',
        '5. Add configuration',
        '6. Handle errors',
        '7. Add debugging support',
        '8. Add metrics',
        '9. Handle edge cases',
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
  labels: ['programming-languages', 'generics', 'integration']
}));

export const genericsTestingTask = defineTask('generics-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Generics Testing - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive generics tests',
      context: args,
      instructions: [
        '1. Test type parameters',
        '2. Test bounds',
        '3. Test traits/interfaces',
        '4. Test inference',
        '5. Test instantiation',
        '6. Test variance',
        '7. Test error handling',
        '8. Benchmark performance',
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
  labels: ['programming-languages', 'generics', 'testing']
}));

export const genericsDocumentationTask = defineTask('generics-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Generics Documentation - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate generics documentation',
      context: args,
      instructions: [
        '1. Create generics guide',
        '2. Document type parameters',
        '3. Document bounds',
        '4. Document traits/interfaces',
        '5. Document variance',
        '6. Add examples',
        '7. Add best practices',
        '8. Document common patterns',
        '9. Add troubleshooting',
        '10. Create quick reference'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['guidePath', 'artifacts'],
      properties: {
        guidePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'generics', 'documentation']
}));

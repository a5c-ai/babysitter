/**
 * @process specializations/programming-languages/effect-system-design
 * @description Effect System Design - Process for implementing algebraic effect systems with handlers, effect tracking,
 * and effect polymorphism for managing side effects in a controlled manner.
 * @inputs { languageName: string, effectStyle?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, effectSystem: object, handlers: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/effect-system-design', {
 *   languageName: 'MyLang',
 *   effectStyle: 'algebraic'
 * });
 *
 * @references
 * - Koka Language Effects: https://koka-lang.github.io/koka/doc/book.html
 * - Eff Language: https://www.eff-lang.org/
 * - Effect Handlers: https://effect-handlers.org/
 * - Algebraic Effects: https://www.microsoft.com/en-us/research/publication/algebraic-effects-for-functional-programming/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    effectStyle = 'algebraic',
    implementationLanguage = 'OCaml',
    outputDir = 'effect-system-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Effect System Design: ${languageName}`);
  ctx.log('info', `Effect style: ${effectStyle}`);

  // ============================================================================
  // PHASE 1: EFFECT SYNTAX DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Effect Syntax');

  const effectSyntax = await ctx.task(effectSyntaxTask, {
    languageName,
    effectStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...effectSyntax.artifacts);

  // ============================================================================
  // PHASE 2: EFFECT DECLARATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Effect Declaration');

  const effectDeclaration = await ctx.task(effectDeclarationTask, {
    languageName,
    effectStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...effectDeclaration.artifacts);

  await ctx.breakpoint({
    question: `Effect declaration implemented. Features: ${effectDeclaration.features.join(', ')}. Proceed with handlers?`,
    title: 'Effect Declaration Review',
    context: {
      runId: ctx.runId,
      features: effectDeclaration.features,
      files: effectDeclaration.artifacts.map(a => ({ path: a.path, format: a.format || 'ocaml' }))
    }
  });

  // ============================================================================
  // PHASE 3: EFFECT HANDLERS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Effect Handlers');

  const effectHandlers = await ctx.task(effectHandlersTask, {
    languageName,
    effectStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...effectHandlers.artifacts);

  // ============================================================================
  // PHASE 4: EFFECT TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Effect Tracking');

  const effectTracking = await ctx.task(effectTrackingTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...effectTracking.artifacts);

  // ============================================================================
  // PHASE 5: EFFECT POLYMORPHISM
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Effect Polymorphism');

  const effectPolymorphism = await ctx.task(effectPolymorphismTask, {
    languageName,
    effectTracking,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...effectPolymorphism.artifacts);

  // ============================================================================
  // PHASE 6: EFFECT INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Effect Inference');

  const effectInference = await ctx.task(effectInferenceTask, {
    languageName,
    effectTracking,
    effectPolymorphism,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...effectInference.artifacts);

  // ============================================================================
  // PHASE 7: RUNTIME IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Runtime Support');

  const runtimeImplementation = await ctx.task(effectRuntimeTask, {
    languageName,
    effectHandlers,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...runtimeImplementation.artifacts);

  // ============================================================================
  // PHASE 8: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Integrating Effect System');

  const integration = await ctx.task(effectSystemIntegrationTask, {
    languageName,
    effectSyntax,
    effectDeclaration,
    effectHandlers,
    effectTracking,
    effectPolymorphism,
    effectInference,
    runtimeImplementation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating Tests');

  const testSuite = await ctx.task(effectSystemTestingTask, {
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

  const documentation = await ctx.task(effectSystemDocumentationTask, {
    languageName,
    effectStyle,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Effect System Complete for ${languageName}! Style: ${effectStyle}, Effect inference: ${effectInference.enabled}. Review deliverables?`,
    title: 'Effect System Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        effectStyle,
        effectInference: effectInference.enabled,
        builtinEffects: effectDeclaration.builtinEffects,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Effect System' },
        { path: documentation.guidePath, format: 'markdown', label: 'Effects Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    effectSystem: {
      mainFile: integration.mainFilePath,
      style: effectStyle
    },
    handlers: {
      types: effectHandlers.handlerTypes,
      resumption: effectHandlers.resumptionStyle
    },
    inference: {
      enabled: effectInference.enabled,
      algorithm: effectInference.algorithm
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/effect-system-design',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const effectSyntaxTask = defineTask('effect-syntax', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Effect Syntax - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Programming Language Designer',
      task: 'Design effect system syntax',
      context: args,
      instructions: [
        '1. Design effect declaration syntax',
        '2. Design effect operation syntax',
        '3. Design handler syntax',
        '4. Design perform/raise syntax',
        '5. Design effect type annotations',
        '6. Design effect rows',
        '7. Design resumption syntax',
        '8. Handle effect subtyping',
        '9. Design effect constraints',
        '10. Document syntax'
      ],
      outputFormat: 'JSON with effect syntax'
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
  labels: ['programming-languages', 'effects', 'syntax']
}));

export const effectDeclarationTask = defineTask('effect-declaration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Effect Declaration - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement effect declaration',
      context: args,
      instructions: [
        '1. Parse effect declarations',
        '2. Define effect operations',
        '3. Handle operation signatures',
        '4. Implement builtin effects',
        '5. Handle effect parameters',
        '6. Define effect scoping',
        '7. Handle effect imports',
        '8. Implement effect modules',
        '9. Add validation',
        '10. Test declarations'
      ],
      outputFormat: 'JSON with effect declaration'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'builtinEffects', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        builtinEffects: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'effects', 'declaration']
}));

export const effectHandlersTask = defineTask('effect-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Effect Handlers - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement effect handlers',
      context: args,
      instructions: [
        '1. Implement handler syntax parsing',
        '2. Implement shallow handlers',
        '3. Implement deep handlers',
        '4. Handle resumptions (one-shot, multi-shot)',
        '5. Implement handler composition',
        '6. Handle handler search',
        '7. Implement handler nesting',
        '8. Handle return clauses',
        '9. Implement finally clauses',
        '10. Test handlers'
      ],
      outputFormat: 'JSON with effect handlers'
    },
    outputSchema: {
      type: 'object',
      required: ['handlerTypes', 'resumptionStyle', 'filePath', 'artifacts'],
      properties: {
        handlerTypes: { type: 'array', items: { type: 'string' } },
        resumptionStyle: { type: 'string' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'effects', 'handlers']
}));

export const effectTrackingTask = defineTask('effect-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Effect Tracking - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement effect tracking',
      context: args,
      instructions: [
        '1. Design effect type representation',
        '2. Implement effect rows',
        '3. Track effects through calls',
        '4. Handle effect unification',
        '5. Implement effect subtyping',
        '6. Handle effect masking',
        '7. Track handler coverage',
        '8. Detect unhandled effects',
        '9. Add effect annotations',
        '10. Test effect tracking'
      ],
      outputFormat: 'JSON with effect tracking'
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
  labels: ['programming-languages', 'effects', 'tracking']
}));

export const effectPolymorphismTask = defineTask('effect-polymorphism', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Effect Polymorphism - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement effect polymorphism',
      context: args,
      instructions: [
        '1. Implement effect variables',
        '2. Handle effect quantification',
        '3. Implement effect constraints',
        '4. Handle row polymorphism',
        '5. Implement effect instantiation',
        '6. Handle effect generalization',
        '7. Implement effect bounds',
        '8. Handle effect subsumption',
        '9. Add type-level effects',
        '10. Test polymorphism'
      ],
      outputFormat: 'JSON with effect polymorphism'
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
  labels: ['programming-languages', 'effects', 'polymorphism']
}));

export const effectInferenceTask = defineTask('effect-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Effect Inference - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement effect inference',
      context: args,
      instructions: [
        '1. Infer effects from operations',
        '2. Propagate effects through calls',
        '3. Handle effect constraints',
        '4. Implement effect unification',
        '5. Handle principal types',
        '6. Infer handler effects',
        '7. Handle effect leaks',
        '8. Add effect error messages',
        '9. Optimize inference',
        '10. Test inference'
      ],
      outputFormat: 'JSON with effect inference'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'algorithm', 'filePath', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        algorithm: { type: 'string' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'effects', 'inference']
}));

export const effectRuntimeTask = defineTask('effect-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Effect Runtime - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Runtime Engineer',
      task: 'Implement effect runtime',
      context: args,
      instructions: [
        '1. Implement continuation capture',
        '2. Handle stack management',
        '3. Implement handler frames',
        '4. Handle resumption storage',
        '5. Implement multi-shot continuations',
        '6. Optimize common cases',
        '7. Handle exceptions',
        '8. Add debugging support',
        '9. Benchmark performance',
        '10. Test runtime'
      ],
      outputFormat: 'JSON with effect runtime'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        continuationStyle: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'effects', 'runtime']
}));

export const effectSystemIntegrationTask = defineTask('effect-system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Effect System Integration - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Integrate effect system',
      context: args,
      instructions: [
        '1. Create main effect API',
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
  labels: ['programming-languages', 'effects', 'integration']
}));

export const effectSystemTestingTask = defineTask('effect-system-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Effect System Testing - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive effect system tests',
      context: args,
      instructions: [
        '1. Test effect declarations',
        '2. Test handlers',
        '3. Test resumptions',
        '4. Test effect tracking',
        '5. Test inference',
        '6. Test polymorphism',
        '7. Test runtime',
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
  labels: ['programming-languages', 'effects', 'testing']
}));

export const effectSystemDocumentationTask = defineTask('effect-system-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Effect System Documentation - ${args.languageName}`,
  agent: {
    name: 'type-system-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate effect system documentation',
      context: args,
      instructions: [
        '1. Create effects guide',
        '2. Document effect declarations',
        '3. Document handlers',
        '4. Document effect tracking',
        '5. Document common patterns',
        '6. Add examples (state, exceptions, async)',
        '7. Add best practices',
        '8. Document performance',
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
  labels: ['programming-languages', 'effects', 'documentation']
}));

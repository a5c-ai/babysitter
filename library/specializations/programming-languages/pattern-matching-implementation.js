/**
 * @process specializations/programming-languages/pattern-matching-implementation
 * @description Pattern Matching Implementation - Process for implementing advanced pattern matching with destructuring,
 * guards, exhaustiveness checking, and optimization.
 * @inputs { languageName: string, patternStyle?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, patternSystem: object, matching: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/pattern-matching-implementation', {
 *   languageName: 'MyLang',
 *   patternStyle: 'ml-style'
 * });
 *
 * @references
 * - Rust Pattern Matching: https://doc.rust-lang.org/book/ch18-00-patterns.html
 * - OCaml Pattern Matching: https://ocaml.org/docs/pattern-matching
 * - Haskell Patterns: https://wiki.haskell.org/Pattern_matching
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    patternStyle = 'ml-style',
    implementationLanguage = 'Rust',
    outputDir = 'pattern-matching-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Pattern Matching Implementation: ${languageName}`);
  ctx.log('info', `Pattern style: ${patternStyle}`);

  // ============================================================================
  // PHASE 1: PATTERN SYNTAX DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Pattern Syntax');

  const patternSyntax = await ctx.task(patternSyntaxTask, {
    languageName,
    patternStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...patternSyntax.artifacts);

  // ============================================================================
  // PHASE 2: PATTERN TYPES
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Pattern Types');

  const patternTypes = await ctx.task(patternTypesTask, {
    languageName,
    patternStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...patternTypes.artifacts);

  await ctx.breakpoint({
    question: `Pattern types implemented: ${patternTypes.types.join(', ')}. Proceed with matching algorithm?`,
    title: 'Pattern Types Review',
    context: {
      runId: ctx.runId,
      types: patternTypes.types,
      files: patternTypes.artifacts.map(a => ({ path: a.path, format: a.format || 'rust' }))
    }
  });

  // ============================================================================
  // PHASE 3: MATCHING ALGORITHM
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Matching Algorithm');

  const matchingAlgorithm = await ctx.task(matchingAlgorithmTask, {
    languageName,
    patternTypes,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...matchingAlgorithm.artifacts);

  // ============================================================================
  // PHASE 4: GUARDS AND BINDINGS
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Guards and Bindings');

  const guardsBindings = await ctx.task(guardsBindingsTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...guardsBindings.artifacts);

  // ============================================================================
  // PHASE 5: EXHAUSTIVENESS CHECKING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Exhaustiveness Checking');

  const exhaustiveness = await ctx.task(exhaustivenessTask, {
    languageName,
    patternTypes,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...exhaustiveness.artifacts);

  // ============================================================================
  // PHASE 6: OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Pattern Optimization');

  const optimization = await ctx.task(patternOptimizationTask, {
    languageName,
    matchingAlgorithm,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...optimization.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating Pattern Matching');

  const integration = await ctx.task(patternMatchingIntegrationTask, {
    languageName,
    patternSyntax,
    patternTypes,
    matchingAlgorithm,
    guardsBindings,
    exhaustiveness,
    optimization,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 8: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Tests');

  const testSuite = await ctx.task(patternMatchingTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Documentation');

  const documentation = await ctx.task(patternMatchingDocumentationTask, {
    languageName,
    patternStyle,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Pattern Matching Complete for ${languageName}! ${patternTypes.types.length} pattern types, exhaustiveness: ${exhaustiveness.enabled}. Review deliverables?`,
    title: 'Pattern Matching Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        patternStyle,
        patternTypes: patternTypes.types.length,
        exhaustivenessChecking: exhaustiveness.enabled,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Pattern Matching' },
        { path: documentation.guidePath, format: 'markdown', label: 'Pattern Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    patternSystem: {
      mainFile: integration.mainFilePath,
      style: patternStyle,
      patternTypes: patternTypes.types
    },
    matching: {
      algorithm: matchingAlgorithm.algorithm,
      exhaustiveness: exhaustiveness.enabled,
      optimizations: optimization.optimizations
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/pattern-matching-implementation',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const patternSyntaxTask = defineTask('pattern-syntax', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pattern Syntax - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Programming Language Designer',
      task: 'Design pattern matching syntax',
      context: args,
      instructions: [
        '1. Design match expression syntax',
        '2. Design pattern arm syntax',
        '3. Design if-let syntax',
        '4. Design while-let syntax',
        '5. Design let-else syntax',
        '6. Design function parameter patterns',
        '7. Handle pattern precedence',
        '8. Design or-patterns',
        '9. Design @ bindings',
        '10. Document syntax'
      ],
      outputFormat: 'JSON with pattern syntax'
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
  labels: ['programming-languages', 'pattern-matching', 'syntax']
}));

export const patternTypesTask = defineTask('pattern-types', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Pattern Types - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement pattern types',
      context: args,
      instructions: [
        '1. Implement literal patterns',
        '2. Implement variable patterns',
        '3. Implement wildcard patterns',
        '4. Implement tuple patterns',
        '5. Implement struct patterns',
        '6. Implement enum/variant patterns',
        '7. Implement array/slice patterns',
        '8. Implement range patterns',
        '9. Implement reference patterns',
        '10. Test all pattern types'
      ],
      outputFormat: 'JSON with pattern types'
    },
    outputSchema: {
      type: 'object',
      required: ['types', 'filePath', 'artifacts'],
      properties: {
        types: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'pattern-matching', 'types']
}));

export const matchingAlgorithmTask = defineTask('matching-algorithm', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Matching Algorithm - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement matching algorithm',
      context: args,
      instructions: [
        '1. Implement pattern compilation',
        '2. Build decision tree',
        '3. Handle pattern matrix',
        '4. Implement usefulness checking',
        '5. Handle constructor matching',
        '6. Handle nested patterns',
        '7. Implement backtracking',
        '8. Handle match failure',
        '9. Optimize common cases',
        '10. Test matching correctness'
      ],
      outputFormat: 'JSON with matching algorithm'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'filePath', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
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
  labels: ['programming-languages', 'pattern-matching', 'algorithm']
}));

export const guardsBindingsTask = defineTask('guards-bindings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Guards and Bindings - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement guards and bindings',
      context: args,
      instructions: [
        '1. Implement pattern guards',
        '2. Handle guard expressions',
        '3. Implement variable bindings',
        '4. Handle binding modes',
        '5. Implement @ patterns',
        '6. Handle move vs borrow',
        '7. Handle mutable bindings',
        '8. Implement binding scopes',
        '9. Add binding errors',
        '10. Test guards and bindings'
      ],
      outputFormat: 'JSON with guards and bindings'
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
  labels: ['programming-languages', 'pattern-matching', 'guards']
}));

export const exhaustivenessTask = defineTask('exhaustiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Exhaustiveness Checking - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement exhaustiveness checking',
      context: args,
      instructions: [
        '1. Implement usefulness algorithm',
        '2. Track covered patterns',
        '3. Find uncovered patterns',
        '4. Generate witness patterns',
        '5. Handle sealed types',
        '6. Handle infinite types',
        '7. Handle guards impact',
        '8. Generate error messages',
        '9. Handle unreachable patterns',
        '10. Test exhaustiveness'
      ],
      outputFormat: 'JSON with exhaustiveness'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'filePath', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
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
  labels: ['programming-languages', 'pattern-matching', 'exhaustiveness']
}));

export const patternOptimizationTask = defineTask('pattern-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Pattern Optimization - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement pattern optimization',
      context: args,
      instructions: [
        '1. Optimize decision trees',
        '2. Merge common paths',
        '3. Reorder tests by frequency',
        '4. Eliminate redundant tests',
        '5. Handle constant folding',
        '6. Optimize switch/jump tables',
        '7. Inline small matches',
        '8. Handle range optimization',
        '9. Benchmark optimizations',
        '10. Document optimizations'
      ],
      outputFormat: 'JSON with optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'filePath', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'pattern-matching', 'optimization']
}));

export const patternMatchingIntegrationTask = defineTask('pattern-matching-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Pattern Matching Integration - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Integrate pattern matching',
      context: args,
      instructions: [
        '1. Create main pattern compiler',
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
  labels: ['programming-languages', 'pattern-matching', 'integration']
}));

export const patternMatchingTestingTask = defineTask('pattern-matching-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Pattern Matching Testing - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive pattern matching tests',
      context: args,
      instructions: [
        '1. Test all pattern types',
        '2. Test matching algorithm',
        '3. Test exhaustiveness',
        '4. Test guards',
        '5. Test bindings',
        '6. Test optimization',
        '7. Test edge cases',
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
  labels: ['programming-languages', 'pattern-matching', 'testing']
}));

export const patternMatchingDocumentationTask = defineTask('pattern-matching-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Pattern Matching Documentation - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate pattern matching documentation',
      context: args,
      instructions: [
        '1. Create pattern guide',
        '2. Document all pattern types',
        '3. Document guards',
        '4. Document exhaustiveness',
        '5. Add examples',
        '6. Add best practices',
        '7. Document common patterns',
        '8. Add troubleshooting',
        '9. Document internals',
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
  labels: ['programming-languages', 'pattern-matching', 'documentation']
}));

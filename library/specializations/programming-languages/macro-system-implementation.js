/**
 * @process specializations/programming-languages/macro-system-implementation
 * @description Macro System Implementation - Process for implementing a macro system for compile-time metaprogramming.
 * Covers textual macros, syntactic macros, and procedural macros.
 * @inputs { languageName: string, macroStyle?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, macroSystem: object, expansion: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/macro-system-implementation', {
 *   languageName: 'MyLang',
 *   macroStyle: 'syntactic'
 * });
 *
 * @references
 * - Rust Macros: https://doc.rust-lang.org/book/ch19-06-macros.html
 * - Lisp Macros: https://www.lispworks.com/documentation/common-lisp.html
 * - Scheme Hygienic Macros: https://schemers.org/Documents/Standards/R5RS/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    macroStyle = 'syntactic',
    hygienic = true,
    implementationLanguage = 'Rust',
    outputDir = 'macro-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Macro System Implementation: ${languageName}`);
  ctx.log('info', `Style: ${macroStyle}, Hygienic: ${hygienic}`);

  // ============================================================================
  // PHASE 1: MACRO DEFINITION SYNTAX
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Macro Definition Syntax');

  const macroSyntax = await ctx.task(macroSyntaxTask, {
    languageName,
    macroStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...macroSyntax.artifacts);

  // ============================================================================
  // PHASE 2: PATTERN MATCHING
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Pattern Matching');

  const patternMatching = await ctx.task(patternMatchingTask, {
    languageName,
    macroStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...patternMatching.artifacts);

  // ============================================================================
  // PHASE 3: EXPANSION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Macro Expansion');

  const macroExpansion = await ctx.task(macroExpansionTask, {
    languageName,
    macroStyle,
    hygienic,
    patternMatching,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...macroExpansion.artifacts);

  await ctx.breakpoint({
    question: `Macro expansion implemented. Hygienic: ${hygienic}, Features: ${macroExpansion.features.join(', ')}. Proceed with integration?`,
    title: 'Macro Expansion Review',
    context: {
      runId: ctx.runId,
      features: macroExpansion.features,
      files: macroExpansion.artifacts.map(a => ({ path: a.path, format: a.format || 'rust' }))
    }
  });

  // ============================================================================
  // PHASE 4: HYGIENE (if enabled)
  // ============================================================================

  let hygieneSystem = null;
  if (hygienic) {
    ctx.log('info', 'Phase 4: Implementing Hygiene');

    hygieneSystem = await ctx.task(hygieneSystemTask, {
      languageName,
      macroExpansion,
      implementationLanguage,
      outputDir
    });

    artifacts.push(...hygieneSystem.artifacts);
  }

  // ============================================================================
  // PHASE 5: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating Macro System');

  const integration = await ctx.task(macroIntegrationTask, {
    languageName,
    macroSyntax,
    patternMatching,
    macroExpansion,
    hygieneSystem,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 6: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating Tests');

  const testSuite = await ctx.task(macroTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Documentation');

  const documentation = await ctx.task(macroDocumentationTask, {
    languageName,
    macroStyle,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Macro System Complete for ${languageName}! Style: ${macroStyle}, Hygienic: ${hygienic}, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'Macro System Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        macroStyle,
        hygienic,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Macro System' },
        { path: documentation.guidePath, format: 'markdown', label: 'Macro Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    macroSystem: {
      mainFile: integration.mainFilePath,
      style: macroStyle,
      hygienic
    },
    expansion: {
      features: macroExpansion.features
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/macro-system-implementation',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const macroSyntaxTask = defineTask('macro-syntax', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Macro Syntax - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Macro System Engineer',
      task: 'Design macro definition syntax',
      context: args,
      instructions: [
        '1. Design macro definition keyword',
        '2. Define pattern syntax',
        '3. Define template syntax',
        '4. Handle macro parameters',
        '5. Support variadic patterns',
        '6. Support repetition patterns',
        '7. Design macro invocation syntax',
        '8. Handle attribute/decorator macros',
        '9. Support derive macros',
        '10. Document syntax'
      ],
      outputFormat: 'JSON with macro syntax'
    },
    outputSchema: {
      type: 'object',
      required: ['syntaxElements', 'filePath', 'artifacts'],
      properties: {
        syntaxElements: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'macro', 'syntax']
}));

export const patternMatchingTask = defineTask('pattern-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Pattern Matching - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Macro System Engineer',
      task: 'Implement macro pattern matching',
      context: args,
      instructions: [
        '1. Parse macro patterns',
        '2. Implement literal matching',
        '3. Implement binding patterns',
        '4. Implement repetition matching',
        '5. Handle nested patterns',
        '6. Implement fragment specifiers',
        '7. Handle ambiguous patterns',
        '8. Implement pattern compilation',
        '9. Add match failure messages',
        '10. Test pattern matching'
      ],
      outputFormat: 'JSON with pattern matching'
    },
    outputSchema: {
      type: 'object',
      required: ['patternTypes', 'filePath', 'artifacts'],
      properties: {
        patternTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        fragmentSpecifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'macro', 'pattern-matching']
}));

export const macroExpansionTask = defineTask('macro-expansion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Macro Expansion - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Macro System Engineer',
      task: 'Implement macro expansion',
      context: args,
      instructions: [
        '1. Implement expansion algorithm',
        '2. Handle substitution',
        '3. Handle repetition expansion',
        '4. Implement recursive expansion',
        '5. Handle expansion limits',
        '6. Track expansion trace',
        '7. Handle expansion errors',
        '8. Support expansion debugging',
        '9. Optimize expansion',
        '10. Test expansion correctness'
      ],
      outputFormat: 'JSON with macro expansion'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        expansionLimit: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'macro', 'expansion']
}));

export const hygieneSystemTask = defineTask('hygiene-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Hygiene System - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Macro System Engineer',
      task: 'Implement hygienic macros',
      context: args,
      instructions: [
        '1. Implement syntax context tracking',
        '2. Handle identifier hygiene',
        '3. Implement scope marking',
        '4. Handle intentional capture',
        '5. Support unhygienic escape hatch',
        '6. Track lexical context',
        '7. Handle nested hygiene',
        '8. Resolve hygienic conflicts',
        '9. Test hygiene correctness',
        '10. Document hygiene rules'
      ],
      outputFormat: 'JSON with hygiene system'
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
  labels: ['programming-languages', 'macro', 'hygiene']
}));

export const macroIntegrationTask = defineTask('macro-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Macro Integration - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Macro System Engineer',
      task: 'Integrate macro system',
      context: args,
      instructions: [
        '1. Create main macro expander',
        '2. Integrate with parser',
        '3. Add builtin macros',
        '4. Handle expansion ordering',
        '5. Add configuration',
        '6. Handle errors',
        '7. Add debugging support',
        '8. Add expansion visualization',
        '9. Add metrics',
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
        builtinMacros: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'macro', 'integration']
}));

export const macroTestingTask = defineTask('macro-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Macro Testing - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive macro tests',
      context: args,
      instructions: [
        '1. Test pattern matching',
        '2. Test expansion',
        '3. Test hygiene',
        '4. Test recursion',
        '5. Test error handling',
        '6. Test builtin macros',
        '7. Test edge cases',
        '8. Test performance',
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
  labels: ['programming-languages', 'macro', 'testing']
}));

export const macroDocumentationTask = defineTask('macro-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Macro Documentation - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate macro documentation',
      context: args,
      instructions: [
        '1. Create macro guide',
        '2. Document syntax',
        '3. Document pattern matching',
        '4. Document hygiene',
        '5. Document builtin macros',
        '6. Add examples',
        '7. Add best practices',
        '8. Add troubleshooting',
        '9. Document debugging',
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
  labels: ['programming-languages', 'macro', 'documentation']
}));

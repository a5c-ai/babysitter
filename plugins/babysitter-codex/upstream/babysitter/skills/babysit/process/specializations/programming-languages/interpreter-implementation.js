/**
 * @process specializations/programming-languages/interpreter-implementation
 * @description Interpreter Implementation - Process for implementing an interpreter for direct program execution.
 * Covers both tree-walking and bytecode interpreter approaches.
 * @inputs { languageName: string, interpreterStyle?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, interpreter: object, valueSystem: object, builtinLibrary: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/interpreter-implementation', {
 *   languageName: 'MyLang',
 *   interpreterStyle: 'tree-walking',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - Crafting Interpreters: https://craftinginterpreters.com/
 * - Structure and Interpretation of Computer Programs
 * - Writing An Interpreter In Go by Thorsten Ball
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    interpreterStyle = 'tree-walking',
    implementationLanguage = 'TypeScript',
    garbageCollection = 'reference-counting',
    outputDir = 'interpreter-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Interpreter Implementation: ${languageName}`);
  ctx.log('info', `Style: ${interpreterStyle}, Language: ${implementationLanguage}`);

  // ============================================================================
  // PHASE 1: STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting Interpreter Strategy');

  const strategySelection = await ctx.task(interpreterStrategyTask, {
    languageName,
    interpreterStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...strategySelection.artifacts);

  await ctx.breakpoint({
    question: `Interpreter strategy: ${interpreterStyle}. Trade-offs: ${strategySelection.tradeoffs.join(', ')}. Proceed with value system?`,
    title: 'Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: interpreterStyle,
      tradeoffs: strategySelection.tradeoffs,
      files: strategySelection.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: VALUE REPRESENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Value Representation');

  const valueRepresentation = await ctx.task(valueRepresentationTask, {
    languageName,
    interpreterStyle,
    garbageCollection,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...valueRepresentation.artifacts);

  // ============================================================================
  // PHASE 3: ENVIRONMENT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Environment');

  const environment = await ctx.task(environmentImplementationTask, {
    languageName,
    valueRepresentation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...environment.artifacts);

  // ============================================================================
  // PHASE 4: EXPRESSION EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Expression Evaluation');

  const expressionEvaluation = await ctx.task(expressionEvaluationTask, {
    languageName,
    interpreterStyle,
    valueRepresentation,
    environment,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...expressionEvaluation.artifacts);

  // ============================================================================
  // PHASE 5: STATEMENT EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Statement Execution');

  const statementExecution = await ctx.task(statementExecutionTask, {
    languageName,
    interpreterStyle,
    valueRepresentation,
    environment,
    expressionEvaluation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...statementExecution.artifacts);

  // ============================================================================
  // PHASE 6: FUNCTION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Function Handling');

  const functionHandling = await ctx.task(functionHandlingTask, {
    languageName,
    valueRepresentation,
    environment,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...functionHandling.artifacts);

  // ============================================================================
  // PHASE 7: BUILT-IN FUNCTIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Built-in Functions');

  const builtinFunctions = await ctx.task(builtinFunctionsTask, {
    languageName,
    valueRepresentation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...builtinFunctions.artifacts);

  // ============================================================================
  // PHASE 8: ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing Error Handling');

  const errorHandling = await ctx.task(interpreterErrorHandlingTask, {
    languageName,
    valueRepresentation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 9: INTERPRETER INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Integrating Interpreter');

  const integration = await ctx.task(interpreterIntegrationTask, {
    languageName,
    valueRepresentation,
    environment,
    expressionEvaluation,
    statementExecution,
    functionHandling,
    builtinFunctions,
    errorHandling,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 10: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating Tests');

  const testSuite = await ctx.task(interpreterTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating Documentation');

  const documentation = await ctx.task(interpreterDocumentationTask, {
    languageName,
    interpreterStyle,
    valueRepresentation,
    builtinFunctions,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Interpreter Implementation Complete for ${languageName}! Test coverage: ${testSuite.coverage}%, Built-in functions: ${builtinFunctions.functionCount}. Review deliverables?`,
    title: 'Interpreter Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        interpreterStyle,
        valueTypes: valueRepresentation.valueTypes.length,
        builtinFunctions: builtinFunctions.functionCount,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Interpreter' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    interpreter: {
      style: interpreterStyle,
      mainFile: integration.mainFilePath,
      features: integration.features
    },
    valueSystem: {
      valueTypes: valueRepresentation.valueTypes,
      garbageCollection
    },
    environment: {
      scopeHandling: environment.scopeHandling,
      closureSupport: environment.closureSupport
    },
    builtinLibrary: {
      functionCount: builtinFunctions.functionCount,
      categories: builtinFunctions.categories
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
      processId: 'specializations/programming-languages/interpreter-implementation',
      timestamp: startTime,
      languageName,
      interpreterStyle
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const interpreterStrategyTask = defineTask('interpreter-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Interpreter Strategy - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Architect',
      task: 'Select and validate interpreter strategy',
      context: args,
      instructions: [
        '1. Evaluate tree-walking vs bytecode',
        '2. Consider hybrid approaches',
        '3. Analyze performance requirements',
        '4. Consider implementation complexity',
        '5. Evaluate debugging support needs',
        '6. Consider future JIT potential',
        '7. Document trade-offs',
        '8. Make architecture decision',
        '9. Plan implementation phases',
        '10. Create strategy document (ADR)'
      ],
      outputFormat: 'JSON with strategy selection'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'tradeoffs', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'interpreter', 'strategy']
}));

export const valueRepresentationTask = defineTask('value-representation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Value Representation - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Implement value representation',
      context: args,
      instructions: [
        '1. Define value types (int, float, bool, string)',
        '2. Handle boxed vs unboxed values',
        '3. Implement type tags',
        '4. Design object representation',
        '5. Implement arrays/lists',
        '6. Handle nil/null/none',
        '7. Implement value equality',
        '8. Add value hashing',
        '9. Implement value printing',
        '10. Test value operations'
      ],
      outputFormat: 'JSON with value representation'
    },
    outputSchema: {
      type: 'object',
      required: ['valueTypes', 'filePath', 'artifacts'],
      properties: {
        valueTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        boxingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'interpreter', 'values']
}));

export const environmentImplementationTask = defineTask('environment-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Environment - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Implement environment',
      context: args,
      instructions: [
        '1. Create variable bindings structure',
        '2. Implement scope chain',
        '3. Handle lexical scoping',
        '4. Implement closures',
        '5. Handle global environment',
        '6. Implement environment lookup',
        '7. Support variable mutation',
        '8. Handle shadowing',
        '9. Implement environment copying',
        '10. Test scope behavior'
      ],
      outputFormat: 'JSON with environment'
    },
    outputSchema: {
      type: 'object',
      required: ['scopeHandling', 'closureSupport', 'filePath', 'artifacts'],
      properties: {
        scopeHandling: { type: 'string' },
        closureSupport: { type: 'boolean' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'interpreter', 'environment']
}));

export const expressionEvaluationTask = defineTask('expression-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Expression Evaluation - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Implement expression evaluation',
      context: args,
      instructions: [
        '1. Evaluate literals',
        '2. Evaluate identifiers',
        '3. Evaluate arithmetic operators',
        '4. Evaluate comparison operators',
        '5. Evaluate logical operators',
        '6. Evaluate function calls',
        '7. Handle short-circuit evaluation',
        '8. Evaluate member access',
        '9. Handle type coercion',
        '10. Test expression evaluation'
      ],
      outputFormat: 'JSON with expression evaluation'
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
  labels: ['programming-languages', 'interpreter', 'expressions']
}));

export const statementExecutionTask = defineTask('statement-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Statement Execution - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Implement statement execution',
      context: args,
      instructions: [
        '1. Execute variable declarations',
        '2. Execute assignments',
        '3. Execute if/else statements',
        '4. Execute while loops',
        '5. Execute for loops',
        '6. Execute return statements',
        '7. Execute break/continue',
        '8. Execute blocks',
        '9. Handle control flow',
        '10. Test statement execution'
      ],
      outputFormat: 'JSON with statement execution'
    },
    outputSchema: {
      type: 'object',
      required: ['statementTypes', 'filePath', 'artifacts'],
      properties: {
        statementTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        controlFlowHandling: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'interpreter', 'statements']
}));

export const functionHandlingTask = defineTask('function-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Function Handling - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Implement function handling',
      context: args,
      instructions: [
        '1. Implement function values',
        '2. Handle function definitions',
        '3. Implement function calls',
        '4. Handle parameters and arguments',
        '5. Implement return values',
        '6. Support closures',
        '7. Handle recursion',
        '8. Implement tail call optimization',
        '9. Support first-class functions',
        '10. Test function behavior'
      ],
      outputFormat: 'JSON with function handling'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        tailCallOptimization: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'interpreter', 'functions']
}));

export const builtinFunctionsTask = defineTask('builtin-functions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Built-in Functions - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Implement built-in functions',
      context: args,
      instructions: [
        '1. Implement print/println',
        '2. Implement type conversion functions',
        '3. Implement string operations',
        '4. Implement math functions',
        '5. Implement array operations',
        '6. Implement I/O primitives',
        '7. Implement time functions',
        '8. Create native function interface',
        '9. Document built-ins',
        '10. Test built-in functions'
      ],
      outputFormat: 'JSON with built-in functions'
    },
    outputSchema: {
      type: 'object',
      required: ['functionCount', 'categories', 'filePath', 'artifacts'],
      properties: {
        functionCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
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
  labels: ['programming-languages', 'interpreter', 'builtins']
}));

export const interpreterErrorHandlingTask = defineTask('interpreter-error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Error Handling - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Implement error handling',
      context: args,
      instructions: [
        '1. Define runtime error types',
        '2. Implement error reporting',
        '3. Add source location to errors',
        '4. Implement stack traces',
        '5. Handle type errors',
        '6. Handle division by zero',
        '7. Handle undefined variables',
        '8. Implement try/catch (if supported)',
        '9. Add error recovery',
        '10. Test error scenarios'
      ],
      outputFormat: 'JSON with error handling'
    },
    outputSchema: {
      type: 'object',
      required: ['errorTypes', 'filePath', 'artifacts'],
      properties: {
        errorTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        stackTraceSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'interpreter', 'error-handling']
}));

export const interpreterIntegrationTask = defineTask('interpreter-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Interpreter Integration - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Interpreter Engineer',
      task: 'Integrate interpreter components',
      context: args,
      instructions: [
        '1. Create main Interpreter class',
        '2. Integrate all components',
        '3. Implement interpret() API',
        '4. Add configuration options',
        '5. Implement state reset',
        '6. Add debug mode',
        '7. Create interpreter factory',
        '8. Integrate error reporter',
        '9. Add execution limits',
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
  labels: ['programming-languages', 'interpreter', 'integration']
}));

export const interpreterTestingTask = defineTask('interpreter-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Interpreter Testing - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Compiler Test Engineer',
      task: 'Create comprehensive interpreter tests',
      context: args,
      instructions: [
        '1. Test expression evaluation',
        '2. Test statement execution',
        '3. Test function handling',
        '4. Test built-in functions',
        '5. Test error handling',
        '6. Test scoping rules',
        '7. Test closures',
        '8. Test edge cases',
        '9. Measure code coverage',
        '10. Add conformance tests'
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
  labels: ['programming-languages', 'interpreter', 'testing']
}));

export const interpreterDocumentationTask = defineTask('interpreter-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Interpreter Documentation - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate interpreter documentation',
      context: args,
      instructions: [
        '1. Create API reference',
        '2. Document value types',
        '3. Document built-in functions',
        '4. Add usage examples',
        '5. Document error messages',
        '6. Create embedding guide',
        '7. Document configuration',
        '8. Add architecture overview',
        '9. Create troubleshooting guide',
        '10. Document performance characteristics'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocPath', 'artifacts'],
      properties: {
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
  labels: ['programming-languages', 'interpreter', 'documentation']
}));

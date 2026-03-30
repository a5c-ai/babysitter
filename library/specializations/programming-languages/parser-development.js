/**
 * @process specializations/programming-languages/parser-development
 * @description Parser Development - Systematic process for implementing a parser that converts token streams into
 * abstract syntax trees. Covers recursive descent, LALR, PEG, and Pratt parsing approaches.
 * @inputs { languageName: string, parsingStrategy?: string, grammarSpec?: object, lexer?: object, outputDir?: string }
 * @outputs { success: boolean, parserImplementation: object, errorRecovery: object, testSuite: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/parser-development', {
 *   languageName: 'MyLang',
 *   parsingStrategy: 'recursive-descent',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - Crafting Interpreters: https://craftinginterpreters.com/parsing-expressions.html
 * - Pratt Parsing: https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html
 * - Dragon Book Chapter 4: Syntax Analysis
 * - ANTLR Reference: https://www.antlr.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    parsingStrategy = 'recursive-descent',
    grammarSpec = null,
    lexer = null,
    implementationLanguage = 'TypeScript',
    errorRecoveryMode = 'synchronize',
    outputDir = 'parser-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Parser Development: ${languageName}`);
  ctx.log('info', `Strategy: ${parsingStrategy}, Language: ${implementationLanguage}`);

  // ============================================================================
  // PHASE 1: PARSING STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating Parsing Strategy');

  const strategyAnalysis = await ctx.task(parsingStrategyTask, {
    languageName,
    parsingStrategy,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...strategyAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Parsing strategy analyzed: ${parsingStrategy}. Lookahead: ${strategyAnalysis.lookahead}, Grammar class: ${strategyAnalysis.grammarClass}. Proceed with architecture design?`,
    title: 'Parsing Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: parsingStrategy,
      grammarClass: strategyAnalysis.grammarClass,
      tradeoffs: strategyAnalysis.tradeoffs,
      files: strategyAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: PARSER ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Parser Architecture');

  const parserArchitecture = await ctx.task(parserArchitectureTask, {
    languageName,
    parsingStrategy,
    strategyAnalysis,
    implementationLanguage,
    errorRecoveryMode,
    outputDir
  });

  artifacts.push(...parserArchitecture.artifacts);

  // ============================================================================
  // PHASE 3: AST NODE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating AST Node Definitions');

  const astNodes = await ctx.task(astNodeGenerationTask, {
    languageName,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...astNodes.artifacts);

  // ============================================================================
  // PHASE 4: EXPRESSION PARSER
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Expression Parser');

  const expressionParser = await ctx.task(expressionParserTask, {
    languageName,
    parsingStrategy,
    parserArchitecture,
    astNodes,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...expressionParser.artifacts);

  // ============================================================================
  // PHASE 5: STATEMENT PARSER
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Statement Parser');

  const statementParser = await ctx.task(statementParserTask, {
    languageName,
    parserArchitecture,
    astNodes,
    expressionParser,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...statementParser.artifacts);

  // ============================================================================
  // PHASE 6: DECLARATION PARSER
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Declaration Parser');

  const declarationParser = await ctx.task(declarationParserTask, {
    languageName,
    parserArchitecture,
    astNodes,
    statementParser,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...declarationParser.artifacts);

  // ============================================================================
  // PHASE 7: ERROR RECOVERY IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Error Recovery');

  const errorRecovery = await ctx.task(parserErrorRecoveryTask, {
    languageName,
    errorRecoveryMode,
    parserArchitecture,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...errorRecovery.artifacts);

  await ctx.breakpoint({
    question: `Error recovery implemented with ${errorRecovery.strategies.length} strategies. Synchronization points: ${errorRecovery.syncPoints.length}. Continue with diagnostics?`,
    title: 'Error Recovery Review',
    context: {
      runId: ctx.runId,
      strategies: errorRecovery.strategies,
      syncPoints: errorRecovery.syncPoints,
      files: errorRecovery.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 8: DIAGNOSTIC MESSAGES
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing Diagnostic Messages');

  const diagnostics = await ctx.task(parserDiagnosticsTask, {
    languageName,
    errorRecovery,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...diagnostics.artifacts);

  // ============================================================================
  // PHASE 9: PARSER INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Integrating Parser Components');

  const parserIntegration = await ctx.task(parserIntegrationTask, {
    languageName,
    parserArchitecture,
    expressionParser,
    statementParser,
    declarationParser,
    errorRecovery,
    diagnostics,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...parserIntegration.artifacts);

  // ============================================================================
  // PHASE 10: UNIT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating Parser Tests');

  const testSuite = await ctx.task(parserTestingTask, {
    languageName,
    parserIntegration,
    astNodes,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating Documentation');

  const documentation = await ctx.task(parserDocumentationTask, {
    languageName,
    parsingStrategy,
    parserArchitecture,
    astNodes,
    errorRecovery,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Parser Development Complete for ${languageName}! Test coverage: ${testSuite.coverage}%, AST nodes: ${astNodes.nodeCount}. Review deliverables?`,
    title: 'Parser Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        parsingStrategy,
        astNodeCount: astNodes.nodeCount,
        testCoverage: testSuite.coverage,
        errorStrategies: errorRecovery.strategies.length
      },
      files: [
        { path: parserIntegration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Parser Implementation' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    parserImplementation: {
      mainFile: parserIntegration.mainFilePath,
      parsingStrategy,
      implementationLanguage,
      components: parserIntegration.components
    },
    astNodes: {
      count: astNodes.nodeCount,
      categories: astNodes.categories,
      filePath: astNodes.filePath
    },
    errorRecovery: {
      mode: errorRecoveryMode,
      strategies: errorRecovery.strategies,
      syncPoints: errorRecovery.syncPoints
    },
    diagnostics: {
      messageCount: diagnostics.messageCount,
      categories: diagnostics.categories
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage,
      testFiles: testSuite.testFiles
    },
    documentation: {
      apiDocPath: documentation.apiDocPath,
      grammarDocPath: documentation.grammarDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/parser-development',
      timestamp: startTime,
      languageName,
      parsingStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const parsingStrategyTask = defineTask('parsing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Parsing Strategy - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Parser Architecture Expert',
      task: 'Analyze and validate parsing strategy selection',
      context: args,
      instructions: [
        '1. Analyze grammar complexity (LL, LR, PEG compatibility)',
        '2. Evaluate lookahead requirements',
        '3. Check for left recursion (problematic for LL)',
        '4. Assess ambiguity handling needs',
        '5. Evaluate error recovery requirements',
        '6. Consider implementation complexity',
        '7. Analyze performance requirements',
        '8. Document strategy tradeoffs',
        '9. Recommend parser generator or hand-written',
        '10. Create strategy decision document (ADR)'
      ],
      outputFormat: 'JSON with strategy analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['grammarClass', 'lookahead', 'tradeoffs', 'artifacts'],
      properties: {
        grammarClass: { type: 'string' },
        lookahead: { type: 'number' },
        leftRecursion: { type: 'boolean' },
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
  labels: ['programming-languages', 'parser', 'strategy']
}));

export const parserArchitectureTask = defineTask('parser-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Parser Architecture - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Parser Architecture Expert',
      task: 'Design parser architecture',
      context: args,
      instructions: [
        '1. Define parser interface and public API',
        '2. Design token stream integration',
        '3. Plan lookahead buffer management',
        '4. Design error recovery approach',
        '5. Plan AST construction strategy',
        '6. Design parser context/state management',
        '7. Plan source span propagation',
        '8. Design modular parser structure',
        '9. Plan incremental parsing support',
        '10. Document architecture diagram'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'publicApi', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        publicApi: { type: 'array', items: { type: 'string' } },
        lookaheadBuffer: { type: 'number' },
        stateManagement: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'architecture']
}));

export const astNodeGenerationTask = defineTask('ast-node-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: AST Node Generation - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'AST Designer',
      task: 'Generate AST node definitions',
      context: args,
      instructions: [
        '1. Map grammar productions to AST nodes',
        '2. Define expression node types',
        '3. Define statement node types',
        '4. Define declaration node types',
        '5. Define type annotation nodes',
        '6. Add source span to all nodes',
        '7. Design node base class/trait',
        '8. Generate visitor interface',
        '9. Add serialization support',
        '10. Document each node type'
      ],
      outputFormat: 'JSON with AST node definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['nodeCount', 'categories', 'filePath', 'artifacts'],
      properties: {
        nodeCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        expressionNodes: { type: 'array', items: { type: 'string' } },
        statementNodes: { type: 'array', items: { type: 'string' } },
        declarationNodes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'ast']
}));

export const expressionParserTask = defineTask('expression-parser', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Expression Parser - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Parser Implementation Engineer',
      task: 'Implement expression parser',
      context: args,
      instructions: [
        '1. Implement Pratt parsing for operator precedence',
        '2. Handle prefix expressions (unary operators)',
        '3. Handle infix expressions (binary operators)',
        '4. Handle postfix expressions (if any)',
        '5. Parse primary expressions (literals, identifiers)',
        '6. Parse grouping expressions (parentheses)',
        '7. Parse function call expressions',
        '8. Parse member access expressions',
        '9. Parse conditional expressions (ternary)',
        '10. Handle operator precedence correctly'
      ],
      outputFormat: 'JSON with expression parser'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'expressionTypes', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        expressionTypes: { type: 'array', items: { type: 'string' } },
        precedenceLevels: { type: 'number' },
        prattParser: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'expressions']
}));

export const statementParserTask = defineTask('statement-parser', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Statement Parser - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Parser Implementation Engineer',
      task: 'Implement statement parser',
      context: args,
      instructions: [
        '1. Parse variable declaration statements',
        '2. Parse assignment statements',
        '3. Parse if/else statements',
        '4. Parse while/for loop statements',
        '5. Parse return statements',
        '6. Parse break/continue statements',
        '7. Parse block statements',
        '8. Parse expression statements',
        '9. Parse match/switch statements',
        '10. Handle statement terminators (semicolons)'
      ],
      outputFormat: 'JSON with statement parser'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'statementTypes', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        statementTypes: { type: 'array', items: { type: 'string' } },
        controlFlow: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'statements']
}));

export const declarationParserTask = defineTask('declaration-parser', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Declaration Parser - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Parser Implementation Engineer',
      task: 'Implement declaration parser',
      context: args,
      instructions: [
        '1. Parse function declarations',
        '2. Parse class/struct declarations',
        '3. Parse interface/trait declarations',
        '4. Parse type alias declarations',
        '5. Parse enum declarations',
        '6. Parse import/module declarations',
        '7. Parse top-level constants',
        '8. Handle visibility modifiers',
        '9. Parse generic type parameters',
        '10. Handle declaration attributes/annotations'
      ],
      outputFormat: 'JSON with declaration parser'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'declarationTypes', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        declarationTypes: { type: 'array', items: { type: 'string' } },
        modifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'declarations']
}));

export const parserErrorRecoveryTask = defineTask('parser-error-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Error Recovery - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Parser Implementation Engineer',
      task: 'Implement parser error recovery',
      context: args,
      instructions: [
        '1. Implement panic mode recovery',
        '2. Define synchronization points (statement boundaries)',
        '3. Handle missing tokens',
        '4. Handle unexpected tokens',
        '5. Implement phrase-level recovery',
        '6. Add error productions for common mistakes',
        '7. Collect multiple errors before stopping',
        '8. Track error context for messages',
        '9. Prevent infinite loops on errors',
        '10. Test recovery on malformed input'
      ],
      outputFormat: 'JSON with error recovery'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'syncPoints', 'artifacts'],
      properties: {
        strategies: { type: 'array', items: { type: 'string' } },
        syncPoints: { type: 'array', items: { type: 'string' } },
        errorLimit: { type: 'number' },
        recoveryTokens: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'error-recovery']
}));

export const parserDiagnosticsTask = defineTask('parser-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Parser Diagnostics - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Diagnostics Engineer',
      task: 'Implement diagnostic messages',
      context: args,
      instructions: [
        '1. Design diagnostic message format',
        '2. Create error message templates',
        '3. Add source context in messages',
        '4. Implement suggestion system',
        '5. Support warning vs error levels',
        '6. Add related information (notes)',
        '7. Format source location clearly',
        '8. Support color output',
        '9. Support machine-readable output (JSON)',
        '10. Document common errors'
      ],
      outputFormat: 'JSON with diagnostics system'
    },
    outputSchema: {
      type: 'object',
      required: ['messageCount', 'categories', 'artifacts'],
      properties: {
        messageCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        severityLevels: { type: 'array', items: { type: 'string' } },
        suggestionSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'diagnostics']
}));

export const parserIntegrationTask = defineTask('parser-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Parser Integration - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Parser Implementation Engineer',
      task: 'Integrate parser components',
      context: args,
      instructions: [
        '1. Create main Parser class',
        '2. Integrate lexer/token stream',
        '3. Integrate all parsing modules',
        '4. Implement public parse() API',
        '5. Add parser configuration options',
        '6. Implement incremental parsing hooks',
        '7. Add debug/trace mode',
        '8. Create parser factory',
        '9. Integrate diagnostics reporter',
        '10. Final code organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'components', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        components: { type: 'array', items: { type: 'string' } },
        publicApi: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'integration']
}));

export const parserTestingTask = defineTask('parser-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Parser Testing - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Test Engineer',
      task: 'Create comprehensive parser tests',
      context: args,
      instructions: [
        '1. Test expression parsing',
        '2. Test statement parsing',
        '3. Test declaration parsing',
        '4. Test operator precedence',
        '5. Test error recovery',
        '6. Test diagnostic messages',
        '7. Test edge cases',
        '8. Test large files',
        '9. Measure code coverage',
        '10. Add regression tests'
      ],
      outputFormat: 'JSON with test suite'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'testFiles', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'testing']
}));

export const parserDocumentationTask = defineTask('parser-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Parser Documentation - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate parser documentation',
      context: args,
      instructions: [
        '1. Create API reference documentation',
        '2. Document AST node types',
        '3. Document parsing strategy',
        '4. Create grammar documentation',
        '5. Document error recovery',
        '6. Add usage examples',
        '7. Create integration guide',
        '8. Document diagnostic messages',
        '9. Add architecture overview',
        '10. Create troubleshooting guide'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocPath', 'grammarDocPath', 'artifacts'],
      properties: {
        apiDocPath: { type: 'string' },
        grammarDocPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'parser', 'documentation']
}));

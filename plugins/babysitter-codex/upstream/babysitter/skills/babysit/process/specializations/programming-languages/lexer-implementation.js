/**
 * @process specializations/programming-languages/lexer-implementation
 * @description Lexer Implementation - Comprehensive process for implementing a lexer (tokenizer) that converts source
 * code into a stream of tokens. Covers both hand-written and generated lexers with Unicode support and error recovery.
 * @inputs { languageName: string, grammarSpec?: object, implementationLanguage?: string, unicodeSupport?: boolean, outputDir?: string }
 * @outputs { success: boolean, lexerImplementation: object, tokenTypes: object, testSuite: object, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/lexer-implementation', {
 *   languageName: 'MyLang',
 *   implementationLanguage: 'Rust',
 *   unicodeSupport: true,
 *   approach: 'hand-written'
 * });
 *
 * @references
 * - Crafting Interpreters: https://craftinginterpreters.com/scanning.html
 * - Dragon Book Chapter 3: Lexical Analysis
 * - Flex Lexer Generator: https://github.com/westes/flex
 * - Unicode Text Segmentation: https://unicode.org/reports/tr29/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    grammarSpec = null,
    implementationLanguage = 'TypeScript',
    approach = 'hand-written',
    unicodeSupport = true,
    positionTracking = true,
    errorRecovery = true,
    outputDir = 'lexer-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Lexer Implementation: ${languageName}`);
  ctx.log('info', `Implementation: ${implementationLanguage}, Approach: ${approach}`);

  // ============================================================================
  // PHASE 1: TOKEN DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Token Types');

  const tokenDesign = await ctx.task(tokenDesignTask, {
    languageName,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...tokenDesign.artifacts);

  await ctx.breakpoint({
    question: `Token design complete for ${languageName}. ${tokenDesign.tokenCount} token types defined. Keywords: ${tokenDesign.keywords.length}, Operators: ${tokenDesign.operators.length}. Proceed with architecture?`,
    title: 'Token Design Review',
    context: {
      runId: ctx.runId,
      tokenCount: tokenDesign.tokenCount,
      categories: tokenDesign.categories,
      files: tokenDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 2: LEXER ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Lexer Architecture');

  const lexerArchitecture = await ctx.task(lexerArchitectureTask, {
    languageName,
    approach,
    implementationLanguage,
    unicodeSupport,
    positionTracking,
    errorRecovery,
    tokenDesign,
    outputDir
  });

  artifacts.push(...lexerArchitecture.artifacts);

  // ============================================================================
  // PHASE 3: CHARACTER STREAM HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Character Stream');

  const charStream = await ctx.task(charStreamTask, {
    languageName,
    implementationLanguage,
    unicodeSupport,
    positionTracking,
    outputDir
  });

  artifacts.push(...charStream.artifacts);

  // ============================================================================
  // PHASE 4: WHITESPACE AND COMMENT HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Whitespace and Comments');

  const whitespaceHandling = await ctx.task(whitespaceHandlingTask, {
    languageName,
    implementationLanguage,
    grammarSpec,
    charStream,
    outputDir
  });

  artifacts.push(...whitespaceHandling.artifacts);

  // ============================================================================
  // PHASE 5: KEYWORD AND IDENTIFIER SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Keyword and Identifier Scanning');

  const keywordScanning = await ctx.task(keywordScanningTask, {
    languageName,
    implementationLanguage,
    unicodeSupport,
    tokenDesign,
    charStream,
    outputDir
  });

  artifacts.push(...keywordScanning.artifacts);

  // ============================================================================
  // PHASE 6: LITERAL SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Literal Scanning');

  const literalTasks = ['numbers', 'strings', 'characters'].map(literalType =>
    () => ctx.task(literalScanningTask, {
      languageName,
      implementationLanguage,
      literalType,
      grammarSpec,
      charStream,
      outputDir
    })
  );

  const literalResults = await ctx.parallel.all(literalTasks);
  const literalScanning = {
    numbers: literalResults[0],
    strings: literalResults[1],
    characters: literalResults[2],
    artifacts: literalResults.flatMap(r => r.artifacts)
  };

  artifacts.push(...literalScanning.artifacts);

  // ============================================================================
  // PHASE 7: OPERATOR SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Operator Scanning');

  const operatorScanning = await ctx.task(operatorScanningTask, {
    languageName,
    implementationLanguage,
    tokenDesign,
    charStream,
    outputDir
  });

  artifacts.push(...operatorScanning.artifacts);

  // ============================================================================
  // PHASE 8: SOURCE LOCATION TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing Source Location Tracking');

  const locationTracking = await ctx.task(locationTrackingTask, {
    languageName,
    implementationLanguage,
    unicodeSupport,
    charStream,
    outputDir
  });

  artifacts.push(...locationTracking.artifacts);

  // ============================================================================
  // PHASE 9: ERROR RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing Error Recovery');

  const errorHandling = await ctx.task(lexerErrorRecoveryTask, {
    languageName,
    implementationLanguage,
    errorRecovery,
    charStream,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  await ctx.breakpoint({
    question: `Error recovery implemented. ${errorHandling.recoveryStrategies.length} recovery strategies. Error types: ${errorHandling.errorTypes.length}. Continue with testing?`,
    title: 'Error Recovery Review',
    context: {
      runId: ctx.runId,
      recoveryStrategies: errorHandling.recoveryStrategies,
      errorTypes: errorHandling.errorTypes,
      files: errorHandling.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 10: LEXER INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Integrating Lexer Components');

  const lexerIntegration = await ctx.task(lexerIntegrationTask, {
    languageName,
    implementationLanguage,
    tokenDesign,
    lexerArchitecture,
    charStream,
    whitespaceHandling,
    keywordScanning,
    literalScanning,
    operatorScanning,
    locationTracking,
    errorHandling,
    outputDir
  });

  artifacts.push(...lexerIntegration.artifacts);

  // ============================================================================
  // PHASE 11: UNIT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating Unit Tests');

  const testSuite = await ctx.task(lexerTestingTask, {
    languageName,
    implementationLanguage,
    tokenDesign,
    lexerIntegration,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 12: PERFORMANCE BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 12: Performance Benchmarking');

  const benchmarks = await ctx.task(lexerBenchmarkTask, {
    languageName,
    implementationLanguage,
    lexerIntegration,
    outputDir
  });

  artifacts.push(...benchmarks.artifacts);

  // ============================================================================
  // PHASE 13: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating Documentation');

  const documentation = await ctx.task(lexerDocumentationTask, {
    languageName,
    tokenDesign,
    lexerArchitecture,
    lexerIntegration,
    testSuite,
    benchmarks,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Lexer Implementation Complete for ${languageName}! Test coverage: ${testSuite.coverage}%, Performance: ${benchmarks.tokensPerSecond} tokens/sec. Review deliverables?`,
    title: 'Lexer Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        approach,
        tokenCount: tokenDesign.tokenCount,
        testCoverage: testSuite.coverage,
        performance: benchmarks.tokensPerSecond
      },
      files: [
        { path: lexerIntegration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Lexer Implementation' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    lexerImplementation: {
      mainFile: lexerIntegration.mainFilePath,
      approach,
      implementationLanguage,
      features: {
        unicodeSupport,
        positionTracking,
        errorRecovery
      }
    },
    tokenTypes: {
      count: tokenDesign.tokenCount,
      keywords: tokenDesign.keywords,
      operators: tokenDesign.operators,
      literals: tokenDesign.literals
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage,
      testFiles: testSuite.testFiles
    },
    benchmarks: {
      tokensPerSecond: benchmarks.tokensPerSecond,
      memoryUsage: benchmarks.memoryUsage,
      startupTime: benchmarks.startupTime
    },
    documentation: {
      apiDocPath: documentation.apiDocPath,
      usageExamples: documentation.usageExamples
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/lexer-implementation',
      timestamp: startTime,
      languageName,
      approach,
      implementationLanguage
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const tokenDesignTask = defineTask('token-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Token Design - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Design token types and structures',
      context: args,
      instructions: [
        '1. List all token categories (keywords, operators, literals, etc.)',
        '2. Define token data structures with value and location',
        '3. Create token type enumeration',
        '4. Define keyword list',
        '5. Define operator tokens (single and multi-character)',
        '6. Define literal token types',
        '7. Define punctuation tokens',
        '8. Add special tokens (EOF, ERROR, etc.)',
        '9. Design token factory/constructor',
        '10. Document token attributes'
      ],
      outputFormat: 'JSON with token design'
    },
    outputSchema: {
      type: 'object',
      required: ['tokenCount', 'keywords', 'operators', 'literals', 'artifacts'],
      properties: {
        tokenCount: { type: 'number' },
        keywords: { type: 'array', items: { type: 'string' } },
        operators: { type: 'array', items: { type: 'string' } },
        literals: { type: 'array', items: { type: 'string' } },
        categories: { type: 'array', items: { type: 'string' } },
        tokenStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'tokens']
}));

export const lexerArchitectureTask = defineTask('lexer-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Lexer Architecture - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Architecture Engineer',
      task: 'Design lexer architecture',
      context: args,
      instructions: [
        '1. Choose implementation approach (hand-written vs generated)',
        '2. Design state machine (if applicable)',
        '3. Plan lookahead requirements',
        '4. Design error handling strategy',
        '5. Plan Unicode handling strategy',
        '6. Design position tracking mechanism',
        '7. Plan buffering strategy',
        '8. Design lexer interface/API',
        '9. Plan incremental lexing support',
        '10. Document architecture decisions'
      ],
      outputFormat: 'JSON with lexer architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'components', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        components: { type: 'array', items: { type: 'string' } },
        lookahead: { type: 'number' },
        stateMachine: { type: 'object' },
        bufferingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'architecture']
}));

export const charStreamTask = defineTask('char-stream', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Character Stream - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Implement character stream handling',
      context: args,
      instructions: [
        '1. Implement character buffer',
        '2. Handle Unicode input (UTF-8/UTF-16)',
        '3. Implement peek and advance operations',
        '4. Handle end-of-file',
        '5. Implement lookahead buffer',
        '6. Track byte offset and character offset',
        '7. Handle line endings (CR, LF, CRLF)',
        '8. Implement mark/reset for backtracking',
        '9. Add input source abstraction (file, string)',
        '10. Optimize for performance'
      ],
      outputFormat: 'JSON with character stream implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        unicodeHandling: { type: 'string' },
        bufferSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'char-stream']
}));

export const whitespaceHandlingTask = defineTask('whitespace-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Whitespace Handling - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Implement whitespace and comment handling',
      context: args,
      instructions: [
        '1. Handle spaces and tabs',
        '2. Handle newlines (significant if needed)',
        '3. Implement single-line comment scanning',
        '4. Implement multi-line comment scanning',
        '5. Handle nested comments (if supported)',
        '6. Implement doc comment recognition',
        '7. Track whitespace for formatting tools',
        '8. Handle Unicode whitespace characters',
        '9. Optimize whitespace skipping',
        '10. Test edge cases (unterminated comments)'
      ],
      outputFormat: 'JSON with whitespace handling'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'commentStyles', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        commentStyles: { type: 'array', items: { type: 'string' } },
        nestedComments: { type: 'boolean' },
        significantWhitespace: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'whitespace']
}));

export const keywordScanningTask = defineTask('keyword-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Keyword Scanning - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Implement keyword and identifier scanning',
      context: args,
      instructions: [
        '1. Define identifier pattern (start char, continue chars)',
        '2. Handle Unicode identifiers (if supported)',
        '3. Implement keyword recognition (hash table or trie)',
        '4. Differentiate contextual keywords',
        '5. Handle reserved words vs soft keywords',
        '6. Implement raw identifiers (r#keyword)',
        '7. Optimize keyword lookup',
        '8. Handle identifier length limits',
        '9. Support identifier normalization (NFC)',
        '10. Test edge cases (Unicode, long identifiers)'
      ],
      outputFormat: 'JSON with keyword scanning'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'keywordCount', 'lookupStrategy', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        keywordCount: { type: 'number' },
        lookupStrategy: { type: 'string' },
        unicodeIdentifiers: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'keywords']
}));

export const literalScanningTask = defineTask('literal-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: ${args.literalType} Literal Scanning - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: `Implement ${args.literalType} literal scanning`,
      context: args,
      instructions: [
        `1. Implement ${args.literalType} literal recognition`,
        '2. Handle different formats (decimal, hex, binary, octal for numbers)',
        '3. Handle escape sequences (for strings)',
        '4. Support multiline literals (if applicable)',
        '5. Handle raw/verbatim literals',
        '6. Implement string interpolation (if supported)',
        '7. Handle numeric suffixes (i32, f64, etc.)',
        '8. Validate literal syntax',
        '9. Report meaningful errors',
        '10. Test edge cases and limits'
      ],
      outputFormat: 'JSON with literal scanning'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'formats', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        formats: { type: 'array', items: { type: 'string' } },
        escapeSequences: { type: 'array', items: { type: 'string' } },
        interpolation: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'literals', args.literalType]
}));

export const operatorScanningTask = defineTask('operator-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Operator Scanning - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Implement operator scanning',
      context: args,
      instructions: [
        '1. Implement single-character operator scanning',
        '2. Implement multi-character operator scanning',
        '3. Handle operator ambiguity (< vs << vs <=)',
        '4. Implement maximal munch rule',
        '5. Handle punctuation tokens',
        '6. Implement delimiter tokens (braces, brackets)',
        '7. Handle special operators (range .., arrow =>)',
        '8. Support custom operators (if language allows)',
        '9. Optimize operator lookup',
        '10. Test all operator combinations'
      ],
      outputFormat: 'JSON with operator scanning'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'operatorCount', 'maxLength', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        operatorCount: { type: 'number' },
        maxLength: { type: 'number' },
        lookupStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'operators']
}));

export const locationTrackingTask = defineTask('location-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Location Tracking - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Implement source location tracking',
      context: args,
      instructions: [
        '1. Track line and column numbers',
        '2. Handle Unicode character widths',
        '3. Create source span structures',
        '4. Track byte offsets',
        '5. Handle tab width for column calculation',
        '6. Create source file abstraction',
        '7. Support multiple source files',
        '8. Implement location formatting for errors',
        '9. Optimize memory usage',
        '10. Test location accuracy'
      ],
      outputFormat: 'JSON with location tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'spanStructure', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        spanStructure: { type: 'object' },
        trackingGranularity: { type: 'string' },
        memoryOptimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'location']
}));

export const lexerErrorRecoveryTask = defineTask('lexer-error-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Error Recovery - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Implement lexer error recovery',
      context: args,
      instructions: [
        '1. Handle invalid characters',
        '2. Recover from unterminated strings',
        '3. Recover from unterminated comments',
        '4. Report meaningful error messages',
        '5. Continue scanning after errors',
        '6. Collect multiple errors',
        '7. Suggest fixes for common mistakes',
        '8. Handle encoding errors',
        '9. Limit error cascade',
        '10. Test error scenarios'
      ],
      outputFormat: 'JSON with error recovery'
    },
    outputSchema: {
      type: 'object',
      required: ['recoveryStrategies', 'errorTypes', 'artifacts'],
      properties: {
        recoveryStrategies: { type: 'array', items: { type: 'string' } },
        errorTypes: { type: 'array', items: { type: 'string' } },
        errorLimit: { type: 'number' },
        suggestions: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'error-recovery']
}));

export const lexerIntegrationTask = defineTask('lexer-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Lexer Integration - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Frontend Engineer',
      task: 'Integrate lexer components',
      context: args,
      instructions: [
        '1. Create main Lexer class/struct',
        '2. Integrate all scanning components',
        '3. Implement public API (nextToken, peek)',
        '4. Create token iterator interface',
        '5. Add lexer configuration options',
        '6. Implement reset/restart functionality',
        '7. Add debug/trace mode',
        '8. Create lexer factory',
        '9. Integrate with error reporter',
        '10. Final code cleanup and organization'
      ],
      outputFormat: 'JSON with integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'publicApi', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        publicApi: { type: 'array', items: { type: 'string' } },
        configOptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'integration']
}));

export const lexerTestingTask = defineTask('lexer-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Lexer Testing - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Test Engineer',
      task: 'Create comprehensive lexer tests',
      context: args,
      instructions: [
        '1. Test each token type',
        '2. Test keyword recognition',
        '3. Test operator scanning',
        '4. Test literal formats',
        '5. Test whitespace and comments',
        '6. Test error cases',
        '7. Test Unicode handling',
        '8. Test location tracking accuracy',
        '9. Measure code coverage',
        '10. Add fuzz testing'
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
  labels: ['programming-languages', 'lexer', 'testing']
}));

export const lexerBenchmarkTask = defineTask('lexer-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Lexer Benchmarking - ${args.languageName}`,
  agent: {
    name: 'compiler-performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark lexer performance',
      context: args,
      instructions: [
        '1. Create benchmark test files',
        '2. Measure tokens per second',
        '3. Measure memory usage',
        '4. Measure startup/warmup time',
        '5. Test with various file sizes',
        '6. Compare with reference implementations',
        '7. Profile hot paths',
        '8. Identify optimization opportunities',
        '9. Document performance characteristics',
        '10. Create benchmark reports'
      ],
      outputFormat: 'JSON with benchmark results'
    },
    outputSchema: {
      type: 'object',
      required: ['tokensPerSecond', 'memoryUsage', 'artifacts'],
      properties: {
        tokensPerSecond: { type: 'number' },
        memoryUsage: { type: 'string' },
        startupTime: { type: 'string' },
        fileSizeResults: { type: 'array', items: { type: 'object' } },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'benchmarking']
}));

export const lexerDocumentationTask = defineTask('lexer-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Lexer Documentation - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate lexer documentation',
      context: args,
      instructions: [
        '1. Create API reference documentation',
        '2. Document token types',
        '3. Create usage examples',
        '4. Document configuration options',
        '5. Create integration guide',
        '6. Document error handling',
        '7. Add performance notes',
        '8. Create troubleshooting guide',
        '9. Document Unicode handling',
        '10. Add architecture overview'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocPath', 'usageExamples', 'artifacts'],
      properties: {
        apiDocPath: { type: 'string' },
        usageExamples: { type: 'array', items: { type: 'string' } },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lexer', 'documentation']
}));

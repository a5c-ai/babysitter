/**
 * @process specializations/programming-languages/semantic-analysis
 * @description Semantic Analysis - Process for implementing semantic analysis including name resolution, scope analysis,
 * symbol table management, and semantic validation beyond syntax checking.
 * @inputs { languageName: string, ast?: object, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, symbolTable: object, nameResolver: object, semanticValidator: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/semantic-analysis', {
 *   languageName: 'MyLang',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - Engineering a Compiler Chapter 4: Context-Sensitive Analysis
 * - Dragon Book Chapter 6: Intermediate-Code Generation
 * - Symbol Tables: https://en.wikipedia.org/wiki/Symbol_table
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    ast = null,
    implementationLanguage = 'TypeScript',
    scopingRules = 'lexical',
    outputDir = 'semantic-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Semantic Analysis: ${languageName}`);
  ctx.log('info', `Scoping: ${scopingRules}, Language: ${implementationLanguage}`);

  // ============================================================================
  // PHASE 1: SYMBOL TABLE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Symbol Table');

  const symbolTableDesign = await ctx.task(symbolTableDesignTask, {
    languageName,
    scopingRules,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...symbolTableDesign.artifacts);

  await ctx.breakpoint({
    question: `Symbol table designed with ${symbolTableDesign.symbolKinds.length} symbol kinds. Scoping: ${scopingRules}. Proceed with implementation?`,
    title: 'Symbol Table Design Review',
    context: {
      runId: ctx.runId,
      symbolKinds: symbolTableDesign.symbolKinds,
      scopeTypes: symbolTableDesign.scopeTypes,
      files: symbolTableDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: SYMBOL TABLE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Symbol Table');

  const symbolTableImpl = await ctx.task(symbolTableImplementationTask, {
    languageName,
    symbolTableDesign,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...symbolTableImpl.artifacts);

  // ============================================================================
  // PHASE 3: NAME RESOLUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Name Resolution');

  const nameResolution = await ctx.task(nameResolutionTask, {
    languageName,
    symbolTableImpl,
    scopingRules,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...nameResolution.artifacts);

  // ============================================================================
  // PHASE 4: SCOPE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Scope Analysis');

  const scopeAnalysis = await ctx.task(scopeAnalysisTask, {
    languageName,
    symbolTableImpl,
    nameResolution,
    scopingRules,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...scopeAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: SEMANTIC VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Semantic Validation');

  const semanticValidation = await ctx.task(semanticValidationTask, {
    languageName,
    symbolTableImpl,
    nameResolution,
    scopeAnalysis,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...semanticValidation.artifacts);

  // ============================================================================
  // PHASE 6: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating Semantic Analyzer');

  const integration = await ctx.task(semanticAnalyzerIntegrationTask, {
    languageName,
    symbolTableImpl,
    nameResolution,
    scopeAnalysis,
    semanticValidation,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Tests');

  const testSuite = await ctx.task(semanticAnalysisTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Documentation');

  const documentation = await ctx.task(semanticAnalysisDocumentationTask, {
    languageName,
    symbolTableDesign,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Semantic Analysis Complete for ${languageName}! Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'Semantic Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        symbolKinds: symbolTableDesign.symbolKinds.length,
        semanticChecks: semanticValidation.checks.length,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Semantic Analyzer' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    symbolTable: {
      symbolKinds: symbolTableDesign.symbolKinds,
      scopeTypes: symbolTableDesign.scopeTypes,
      filePath: symbolTableImpl.filePath
    },
    nameResolver: {
      features: nameResolution.features,
      filePath: nameResolution.filePath
    },
    scopeAnalyzer: {
      scopingRules,
      features: scopeAnalysis.features
    },
    semanticValidator: {
      checks: semanticValidation.checks,
      filePath: semanticValidation.filePath
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/semantic-analysis',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const symbolTableDesignTask = defineTask('symbol-table-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Symbol Table Design - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Design symbol table structure',
      context: args,
      instructions: [
        '1. Define symbol entry structure',
        '2. Plan scope representation (tree, stack)',
        '3. Define symbol kinds (variable, function, type, etc.)',
        '4. Plan nested scope handling',
        '5. Support module/namespace scopes',
        '6. Design symbol attributes',
        '7. Plan forward reference handling',
        '8. Design lookup strategy',
        '9. Plan memory optimization',
        '10. Document design decisions'
      ],
      outputFormat: 'JSON with symbol table design'
    },
    outputSchema: {
      type: 'object',
      required: ['symbolKinds', 'scopeTypes', 'artifacts'],
      properties: {
        symbolKinds: { type: 'array', items: { type: 'string' } },
        scopeTypes: { type: 'array', items: { type: 'string' } },
        symbolStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'semantic-analysis', 'symbol-table']
}));

export const symbolTableImplementationTask = defineTask('symbol-table-impl', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Symbol Table Implementation - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement symbol table',
      context: args,
      instructions: [
        '1. Implement symbol entry class',
        '2. Implement scope class',
        '3. Implement symbol table with scope stack',
        '4. Implement symbol insertion',
        '5. Implement symbol lookup (local and global)',
        '6. Implement scope enter/exit',
        '7. Handle shadowing detection',
        '8. Implement symbol iteration',
        '9. Add symbol table debugging',
        '10. Test implementation'
      ],
      outputFormat: 'JSON with implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
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
  labels: ['programming-languages', 'semantic-analysis', 'implementation']
}));

export const nameResolutionTask = defineTask('name-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Name Resolution - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement name resolution',
      context: args,
      instructions: [
        '1. Resolve variable references',
        '2. Resolve type references',
        '3. Resolve function calls',
        '4. Handle forward references',
        '5. Resolve qualified names',
        '6. Handle imports/exports',
        '7. Report undefined references',
        '8. Handle overloading (if applicable)',
        '9. Implement method resolution',
        '10. Test resolution correctness'
      ],
      outputFormat: 'JSON with name resolution'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        resolutionKinds: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'semantic-analysis', 'name-resolution']
}));

export const scopeAnalysisTask = defineTask('scope-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Scope Analysis - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement scope analysis',
      context: args,
      instructions: [
        '1. Build scope tree',
        '2. Validate variable declarations',
        '3. Check for duplicate definitions',
        '4. Handle shadowing rules',
        '5. Analyze closure captures',
        '6. Check visibility/access',
        '7. Validate scope boundaries',
        '8. Handle hoisting (if applicable)',
        '9. Report scope errors',
        '10. Test scoping rules'
      ],
      outputFormat: 'JSON with scope analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        scopeChecks: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'semantic-analysis', 'scope-analysis']
}));

export const semanticValidationTask = defineTask('semantic-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Semantic Validation - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement semantic validation',
      context: args,
      instructions: [
        '1. Validate control flow (break/continue placement)',
        '2. Check return statement coverage',
        '3. Validate initialization before use',
        '4. Check mutability violations',
        '5. Validate constant expressions',
        '6. Check exhaustiveness (match/switch)',
        '7. Validate inheritance constraints',
        '8. Check interface implementation',
        '9. Report semantic errors',
        '10. Test all validations'
      ],
      outputFormat: 'JSON with semantic validation'
    },
    outputSchema: {
      type: 'object',
      required: ['checks', 'filePath', 'artifacts'],
      properties: {
        checks: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        errorTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'semantic-analysis', 'validation']
}));

export const semanticAnalyzerIntegrationTask = defineTask('semantic-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Semantic Analyzer Integration - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Integrate semantic analyzer',
      context: args,
      instructions: [
        '1. Create main SemanticAnalyzer class',
        '2. Integrate symbol table',
        '3. Integrate name resolver',
        '4. Integrate scope analyzer',
        '5. Integrate semantic validator',
        '6. Implement analyze() API',
        '7. Add configuration options',
        '8. Add debug mode',
        '9. Integrate error reporting',
        '10. Final code organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'artifacts'],
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
  labels: ['programming-languages', 'semantic-analysis', 'integration']
}));

export const semanticAnalysisTestingTask = defineTask('semantic-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Semantic Analysis Testing - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Test Engineer',
      task: 'Create comprehensive semantic analysis tests',
      context: args,
      instructions: [
        '1. Test symbol table operations',
        '2. Test name resolution',
        '3. Test scope analysis',
        '4. Test semantic validation',
        '5. Test error detection',
        '6. Test edge cases',
        '7. Test error messages',
        '8. Test performance',
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
  labels: ['programming-languages', 'semantic-analysis', 'testing']
}));

export const semanticAnalysisDocumentationTask = defineTask('semantic-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Semantic Analysis Documentation - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate semantic analysis documentation',
      context: args,
      instructions: [
        '1. Create API reference',
        '2. Document symbol table',
        '3. Document scoping rules',
        '4. Document semantic checks',
        '5. Add usage examples',
        '6. Document error messages',
        '7. Create architecture overview',
        '8. Add troubleshooting guide',
        '9. Document design decisions',
        '10. Create quick reference'
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
  labels: ['programming-languages', 'semantic-analysis', 'documentation']
}));

/**
 * @process specializations/programming-languages/error-message-enhancement
 * @description Error Message Enhancement - Process for designing and implementing user-friendly, informative error
 * messages with suggestions, context, and color formatting.
 * @inputs { languageName: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, errorSystem: object, messageTemplates: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/error-message-enhancement', {
 *   languageName: 'MyLang',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - Rust Error Messages: https://doc.rust-lang.org/error-index.html
 * - Elm Error Messages: https://elm-lang.org/news/compiler-errors-for-humans
 * - Clang Diagnostics: https://clang.llvm.org/docs/DiagnosticsReference.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    implementationLanguage = 'Rust',
    colorSupport = true,
    suggestionSystem = true,
    outputDir = 'error-messages-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Error Message Enhancement: ${languageName}`);

  // ============================================================================
  // PHASE 1: ERROR TAXONOMY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Error Taxonomy');

  const errorTaxonomy = await ctx.task(errorTaxonomyTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...errorTaxonomy.artifacts);

  // ============================================================================
  // PHASE 2: MESSAGE FORMAT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Message Format');

  const messageFormat = await ctx.task(messageFormatTask, {
    languageName,
    colorSupport,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...messageFormat.artifacts);

  await ctx.breakpoint({
    question: `Message format designed. Color: ${colorSupport}, Sections: ${messageFormat.sections.join(', ')}. Proceed with rendering?`,
    title: 'Message Format Review',
    context: {
      runId: ctx.runId,
      sections: messageFormat.sections,
      files: messageFormat.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: SOURCE CONTEXT RENDERING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Source Context Rendering');

  const sourceContext = await ctx.task(sourceContextTask, {
    languageName,
    messageFormat,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...sourceContext.artifacts);

  // ============================================================================
  // PHASE 4: SUGGESTION SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Suggestion System');

  const suggestions = await ctx.task(suggestionSystemTask, {
    languageName,
    suggestionSystem,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...suggestions.artifacts);

  // ============================================================================
  // PHASE 5: MESSAGE TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating Message Templates');

  const messageTemplates = await ctx.task(messageTemplatesTask, {
    languageName,
    errorTaxonomy,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...messageTemplates.artifacts);

  // ============================================================================
  // PHASE 6: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating Error System');

  const integration = await ctx.task(errorSystemIntegrationTask, {
    languageName,
    errorTaxonomy,
    messageFormat,
    sourceContext,
    suggestions,
    messageTemplates,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Tests');

  const testSuite = await ctx.task(errorMessageTestingTask, {
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

  const documentation = await ctx.task(errorMessageDocumentationTask, {
    languageName,
    errorTaxonomy,
    messageTemplates,
    integration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Error Message Enhancement Complete for ${languageName}! ${messageTemplates.templateCount} templates, ${suggestions.suggestionCount} suggestion rules. Review deliverables?`,
    title: 'Error Messages Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        errorCategories: errorTaxonomy.categoryCount,
        templates: messageTemplates.templateCount,
        suggestions: suggestions.suggestionCount,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Error System' },
        { path: documentation.errorIndexPath, format: 'markdown', label: 'Error Index' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    errorSystem: {
      mainFile: integration.mainFilePath,
      categoryCount: errorTaxonomy.categoryCount,
      colorSupport
    },
    messageTemplates: {
      count: messageTemplates.templateCount,
      categories: messageTemplates.categories
    },
    suggestions: {
      count: suggestions.suggestionCount,
      types: suggestions.suggestionTypes
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      errorIndexPath: documentation.errorIndexPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/error-message-enhancement',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const errorTaxonomyTask = defineTask('error-taxonomy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Error Taxonomy - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Diagnostics Designer',
      task: 'Design error taxonomy',
      context: args,
      instructions: [
        '1. Categorize error types (parse, type, semantic)',
        '2. Assign error codes (E0001, etc.)',
        '3. Define severity levels',
        '4. Group related errors',
        '5. Define error metadata',
        '6. Plan error documentation',
        '7. Handle deprecation warnings',
        '8. Handle lint warnings',
        '9. Create error hierarchy',
        '10. Document error categories'
      ],
      outputFormat: 'JSON with error taxonomy'
    },
    outputSchema: {
      type: 'object',
      required: ['categoryCount', 'categories', 'artifacts'],
      properties: {
        categoryCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        errorCodes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'errors', 'taxonomy']
}));

export const messageFormatTask = defineTask('message-format', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Message Format - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Compiler Diagnostics Designer',
      task: 'Design message format',
      context: args,
      instructions: [
        '1. Design message structure',
        '2. Define header format',
        '3. Design source snippet format',
        '4. Design underline/caret style',
        '5. Design multiline highlighting',
        '6. Add color scheme',
        '7. Design note/help sections',
        '8. Support JSON output',
        '9. Handle terminal width',
        '10. Create format specification'
      ],
      outputFormat: 'JSON with message format'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'colorScheme', 'artifacts'],
      properties: {
        sections: { type: 'array', items: { type: 'string' } },
        colorScheme: { type: 'object' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'errors', 'format']
}));

export const sourceContextTask = defineTask('source-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Source Context - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Diagnostics Engineer',
      task: 'Implement source context rendering',
      context: args,
      instructions: [
        '1. Extract source lines',
        '2. Add line numbers',
        '3. Implement span highlighting',
        '4. Handle multiline spans',
        '5. Add primary/secondary labels',
        '6. Handle Unicode characters',
        '7. Handle tab expansion',
        '8. Truncate long lines',
        '9. Show context lines',
        '10. Test rendering'
      ],
      outputFormat: 'JSON with source context'
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
  labels: ['programming-languages', 'errors', 'source-context']
}));

export const suggestionSystemTask = defineTask('suggestion-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Suggestion System - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Diagnostics Engineer',
      task: 'Implement suggestion system',
      context: args,
      instructions: [
        '1. Implement fix suggestions',
        '2. Show suggested code changes',
        '3. Implement did-you-mean',
        '4. Handle typo correction',
        '5. Suggest imports',
        '6. Machine-applicable fixes',
        '7. Show before/after diff',
        '8. Rate suggestion confidence',
        '9. Handle multiple suggestions',
        '10. Test suggestions'
      ],
      outputFormat: 'JSON with suggestions'
    },
    outputSchema: {
      type: 'object',
      required: ['suggestionCount', 'suggestionTypes', 'artifacts'],
      properties: {
        suggestionCount: { type: 'number' },
        suggestionTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'errors', 'suggestions']
}));

export const messageTemplatesTask = defineTask('message-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Message Templates - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Diagnostics Engineer',
      task: 'Create message templates',
      context: args,
      instructions: [
        '1. Create parse error templates',
        '2. Create type error templates',
        '3. Create semantic error templates',
        '4. Create warning templates',
        '5. Use clear, friendly language',
        '6. Add explanations',
        '7. Include help links',
        '8. Template for each error code',
        '9. Review for clarity',
        '10. Document templates'
      ],
      outputFormat: 'JSON with templates'
    },
    outputSchema: {
      type: 'object',
      required: ['templateCount', 'categories', 'artifacts'],
      properties: {
        templateCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'errors', 'templates']
}));

export const errorSystemIntegrationTask = defineTask('error-system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error System Integration - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Diagnostics Engineer',
      task: 'Integrate error system',
      context: args,
      instructions: [
        '1. Create main error reporter',
        '2. Integrate all components',
        '3. Create diagnostic API',
        '4. Add output modes',
        '5. Handle error limit',
        '6. Add JSON output',
        '7. Add sorting/grouping',
        '8. Integrate with compiler',
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'errors', 'integration']
}));

export const errorMessageTestingTask = defineTask('error-message-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Error Message Testing - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive error message tests',
      context: args,
      instructions: [
        '1. Test each error code',
        '2. Test source rendering',
        '3. Test suggestions',
        '4. Test color output',
        '5. Test JSON output',
        '6. Test edge cases',
        '7. Visual review tests',
        '8. Test Unicode handling',
        '9. Measure coverage',
        '10. Add snapshot tests'
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
  labels: ['programming-languages', 'errors', 'testing']
}));

export const errorMessageDocumentationTask = defineTask('error-message-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Error Message Documentation - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate error documentation',
      context: args,
      instructions: [
        '1. Create error index',
        '2. Document each error code',
        '3. Add examples for each error',
        '4. Show how to fix each error',
        '5. Create API reference',
        '6. Document configuration',
        '7. Add style guide',
        '8. Document integration',
        '9. Add contributing guide',
        '10. Create FAQ'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['errorIndexPath', 'artifacts'],
      properties: {
        errorIndexPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'errors', 'documentation']
}));

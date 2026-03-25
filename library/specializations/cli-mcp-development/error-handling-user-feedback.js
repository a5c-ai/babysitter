/**
 * @process specializations/cli-mcp-development/error-handling-user-feedback
 * @description Error Handling and User Feedback - Implement comprehensive error handling with helpful messages,
 * fix suggestions, "did you mean" features, and appropriate exit codes for CLI applications.
 * @inputs { projectName: string, language: string, errorCategories?: array }
 * @outputs { success: boolean, errorHierarchy: array, exitCodes: object, suggestions: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/error-handling-user-feedback', {
 *   projectName: 'data-cli',
 *   language: 'typescript',
 *   errorCategories: ['validation', 'network', 'permission', 'configuration']
 * });
 *
 * @references
 * - CLI Guidelines - Errors: https://clig.dev/#errors
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    errorCategories = ['validation', 'network', 'permission', 'configuration', 'internal'],
    enableTelemetry = false,
    outputDir = 'error-handling-user-feedback'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Error Handling and User Feedback: ${projectName}`);

  // ============================================================================
  // PHASE 1: ERROR MESSAGE FORMAT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing error message format');

  const errorFormatDesign = await ctx.task(errorFormatDesignTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...errorFormatDesign.artifacts);

  // ============================================================================
  // PHASE 2: ERROR HIERARCHY/TYPES
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating error hierarchy/types');

  const errorHierarchy = await ctx.task(errorHierarchyTask, {
    projectName,
    language,
    errorCategories,
    outputDir
  });

  artifacts.push(...errorHierarchy.artifacts);

  // ============================================================================
  // PHASE 3: CONTEXTUAL ERROR MESSAGES
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing contextual error messages');

  const contextualErrors = await ctx.task(contextualErrorsTask, {
    projectName,
    language,
    errorHierarchy,
    outputDir
  });

  artifacts.push(...contextualErrors.artifacts);

  // ============================================================================
  // PHASE 4: FIX SUGGESTIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Adding fix suggestions for common errors');

  const fixSuggestions = await ctx.task(fixSuggestionsTask, {
    projectName,
    language,
    errorCategories,
    outputDir
  });

  artifacts.push(...fixSuggestions.artifacts);

  // ============================================================================
  // PHASE 5: "DID YOU MEAN" SUGGESTIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating "did you mean" suggestions for typos');

  const didYouMean = await ctx.task(didYouMeanTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...didYouMean.artifacts);

  // Quality Gate: Error Handling Review
  await ctx.breakpoint({
    question: `Error handling implemented with ${errorHierarchy.types.length} error types. Proceed with exit codes and documentation?`,
    title: 'Error Handling Review',
    context: {
      runId: ctx.runId,
      projectName,
      errorTypes: errorHierarchy.types.length,
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: STACK TRACE HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing stack trace handling (debug vs production)');

  const stackTraceHandling = await ctx.task(stackTraceHandlingTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...stackTraceHandling.artifacts);

  // ============================================================================
  // PHASE 7: ERROR CODES FOR SCRIPTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Adding error codes for scripting');

  const errorCodes = await ctx.task(errorCodesTask, {
    projectName,
    language,
    errorCategories,
    outputDir
  });

  artifacts.push(...errorCodes.artifacts);

  // ============================================================================
  // PHASE 8: ERROR DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating error documentation');

  const errorDocumentation = await ctx.task(errorDocumentationTask, {
    projectName,
    errorHierarchy,
    errorCodes,
    fixSuggestions,
    outputDir
  });

  artifacts.push(...errorDocumentation.artifacts);

  // ============================================================================
  // PHASE 9: ERROR REPORTING/TELEMETRY (OPTIONAL)
  // ============================================================================

  if (enableTelemetry) {
    ctx.log('info', 'Phase 9: Implementing error reporting/telemetry (opt-in)');

    const errorTelemetry = await ctx.task(errorTelemetryTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...errorTelemetry.artifacts);
  }

  // ============================================================================
  // PHASE 10: ERROR SCENARIO TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Testing error scenarios comprehensively');

  const errorTesting = await ctx.task(errorTestingTask, {
    projectName,
    language,
    errorHierarchy,
    errorCodes,
    outputDir
  });

  artifacts.push(...errorTesting.artifacts);

  // ============================================================================
  // PHASE 11: ERROR HANDLING DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Documenting error handling patterns');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    errorFormatDesign,
    errorHierarchy,
    contextualErrors,
    fixSuggestions,
    didYouMean,
    errorCodes,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Error Handling and User Feedback complete for ${projectName}. Review and approve?`,
    title: 'Error Handling Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        errorTypes: errorHierarchy.types.length,
        exitCodes: Object.keys(errorCodes.codes).length,
        hasSuggestions: true,
        hasDidYouMean: true
      },
      files: [
        { path: documentation.errorDocPath, format: 'markdown', label: 'Error Documentation' },
        { path: errorHierarchy.hierarchyPath, format: 'typescript', label: 'Error Types' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    errorHierarchy: errorHierarchy.types,
    exitCodes: errorCodes.codes,
    suggestions: {
      fixSuggestions: fixSuggestions.suggestions,
      didYouMean: didYouMean.enabled
    },
    documentation: {
      errorDoc: documentation.errorDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/error-handling-user-feedback',
      timestamp: startTime,
      errorCategories
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const errorFormatDesignTask = defineTask('error-format-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Error Format Design - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI Error Message Designer',
      task: 'Design error message format',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design error message structure',
        '2. Define error output format (header, body, suggestion)',
        '3. Configure error coloring (red for errors, yellow for warnings)',
        '4. Design context information display',
        '5. Generate error format specification'
      ],
      outputFormat: 'JSON with error format design'
    },
    outputSchema: {
      type: 'object',
      required: ['format', 'artifacts'],
      properties: {
        format: { type: 'object' },
        colorScheme: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'format']
}));

export const errorHierarchyTask = defineTask('error-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Error Hierarchy - ${args.projectName}`,
  agent: {
    name: 'cli-error-handler-designer',
    prompt: {
      role: 'CLI Error Architecture Specialist',
      task: 'Create error hierarchy/types',
      context: {
        projectName: args.projectName,
        language: args.language,
        errorCategories: args.errorCategories,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create base error class',
        '2. Create category-specific error classes',
        '3. Add error codes to each type',
        '4. Include context properties',
        '5. Generate error hierarchy code'
      ],
      outputFormat: 'JSON with error hierarchy'
    },
    outputSchema: {
      type: 'object',
      required: ['types', 'hierarchyPath', 'artifacts'],
      properties: {
        types: { type: 'array', items: { type: 'object' } },
        hierarchyPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'hierarchy']
}));

export const contextualErrorsTask = defineTask('contextual-errors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Contextual Errors - ${args.projectName}`,
  agent: {
    name: 'cli-error-handler-designer',
    prompt: {
      role: 'CLI Contextual Error Specialist',
      task: 'Implement contextual error messages',
      context: {
        projectName: args.projectName,
        language: args.language,
        errorHierarchy: args.errorHierarchy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Include file paths in error context',
        '2. Include line numbers if applicable',
        '3. Include relevant configuration values',
        '4. Show what was expected vs received',
        '5. Generate contextual error code'
      ],
      outputFormat: 'JSON with contextual errors'
    },
    outputSchema: {
      type: 'object',
      required: ['contextConfig', 'artifacts'],
      properties: {
        contextConfig: { type: 'object' },
        contextFields: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'contextual']
}));

export const fixSuggestionsTask = defineTask('fix-suggestions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Fix Suggestions - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI Error Recovery Specialist',
      task: 'Add fix suggestions for common errors',
      context: {
        projectName: args.projectName,
        language: args.language,
        errorCategories: args.errorCategories,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map common errors to fix suggestions',
        '2. Provide actionable commands when possible',
        '3. Link to documentation for complex issues',
        '4. Suggest configuration changes',
        '5. Generate fix suggestions code'
      ],
      outputFormat: 'JSON with fix suggestions'
    },
    outputSchema: {
      type: 'object',
      required: ['suggestions', 'artifacts'],
      properties: {
        suggestions: { type: 'object' },
        suggestionMappings: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'suggestions']
}));

export const didYouMeanTask = defineTask('did-you-mean', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Did You Mean - ${args.projectName}`,
  agent: {
    name: 'cli-error-handler-designer',
    prompt: {
      role: 'CLI Typo Detection Specialist',
      task: 'Create "did you mean" suggestions for typos',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement Levenshtein distance calculation',
        '2. Create suggestion matching for commands',
        '3. Create suggestion matching for options',
        '4. Configure similarity threshold',
        '5. Generate did-you-mean code'
      ],
      outputFormat: 'JSON with did-you-mean'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        algorithm: { type: 'string' },
        threshold: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'did-you-mean']
}));

export const stackTraceHandlingTask = defineTask('stack-trace-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stack Trace Handling - ${args.projectName}`,
  agent: {
    name: 'cli-error-handler-designer',
    prompt: {
      role: 'CLI Debug Mode Specialist',
      task: 'Implement stack trace handling (debug vs production)',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Hide stack traces in production',
        '2. Show stack traces with --debug flag',
        '3. Format stack traces for readability',
        '4. Filter internal frames',
        '5. Generate stack trace handling code'
      ],
      outputFormat: 'JSON with stack trace handling'
    },
    outputSchema: {
      type: 'object',
      required: ['handlingConfig', 'artifacts'],
      properties: {
        handlingConfig: { type: 'object' },
        debugFlag: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'stack-trace']
}));

export const errorCodesTask = defineTask('error-codes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Error Codes - ${args.projectName}`,
  agent: {
    name: 'cli-error-handler-designer',
    prompt: {
      role: 'CLI Exit Code Specialist',
      task: 'Add error codes for scripting',
      context: {
        projectName: args.projectName,
        language: args.language,
        errorCategories: args.errorCategories,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define exit code conventions (0=success, 1=error, 2=misuse)',
        '2. Map error types to exit codes',
        '3. Use standard codes where applicable',
        '4. Document exit codes',
        '5. Generate exit code handling'
      ],
      outputFormat: 'JSON with error codes'
    },
    outputSchema: {
      type: 'object',
      required: ['codes', 'artifacts'],
      properties: {
        codes: { type: 'object' },
        mappings: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'exit-codes']
}));

export const errorDocumentationTask = defineTask('error-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Error Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'CLI Error Documentation Specialist',
      task: 'Create error documentation',
      context: {
        projectName: args.projectName,
        errorHierarchy: args.errorHierarchy,
        errorCodes: args.errorCodes,
        fixSuggestions: args.fixSuggestions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document all error types',
        '2. Document exit codes',
        '3. Document fix suggestions',
        '4. Add troubleshooting guide',
        '5. Generate error documentation'
      ],
      outputFormat: 'JSON with error documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['errorCatalogPath', 'artifacts'],
      properties: {
        errorCatalogPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'documentation']
}));

export const errorTelemetryTask = defineTask('error-telemetry', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Error Telemetry - ${args.projectName}`,
  agent: {
    name: 'cli-error-handler-designer',
    prompt: {
      role: 'CLI Telemetry Specialist',
      task: 'Implement error reporting/telemetry (opt-in)',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create opt-in telemetry system',
        '2. Collect error information anonymously',
        '3. Respect privacy (no PII)',
        '4. Add disable option',
        '5. Generate telemetry code'
      ],
      outputFormat: 'JSON with error telemetry'
    },
    outputSchema: {
      type: 'object',
      required: ['telemetryConfig', 'artifacts'],
      properties: {
        telemetryConfig: { type: 'object' },
        privacyPolicy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'telemetry']
}));

export const errorTestingTask = defineTask('error-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Error Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: {
      role: 'CLI Error Testing Specialist',
      task: 'Test error scenarios comprehensively',
      context: {
        projectName: args.projectName,
        language: args.language,
        errorHierarchy: args.errorHierarchy,
        errorCodes: args.errorCodes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test each error type',
        '2. Test exit codes',
        '3. Test error message format',
        '4. Test fix suggestions',
        '5. Test did-you-mean suggestions',
        '6. Generate error test suite'
      ],
      outputFormat: 'JSON with error tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testFilePath', 'testCases', 'artifacts'],
      properties: {
        testFilePath: { type: 'string' },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'CLI Error Handling Documentation Specialist',
      task: 'Document error handling patterns',
      context: {
        projectName: args.projectName,
        errorFormatDesign: args.errorFormatDesign,
        errorHierarchy: args.errorHierarchy,
        contextualErrors: args.contextualErrors,
        fixSuggestions: args.fixSuggestions,
        didYouMean: args.didYouMean,
        errorCodes: args.errorCodes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document error handling architecture',
        '2. Document error message format',
        '3. Document exit codes',
        '4. Add developer guide for adding new errors',
        '5. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['errorDocPath', 'artifacts'],
      properties: {
        errorDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'error-handling', 'documentation']
}));

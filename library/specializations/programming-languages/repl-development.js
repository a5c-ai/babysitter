/**
 * @process specializations/programming-languages/repl-development
 * @description REPL Development - Process for building an interactive REPL (Read-Eval-Print Loop) for the language.
 * Covers input handling, evaluation, output formatting, and user experience.
 * @inputs { languageName: string, interpreter?: object, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, repl: object, commands: object, completion: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/repl-development', {
 *   languageName: 'MyLang',
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - Crafting Interpreters REPL: https://craftinginterpreters.com/scanning.html#the-repl
 * - Readline Library: https://tiswww.case.edu/php/chet/readline/rltop.html
 * - REPL Best Practices: https://langserver.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    interpreter = null,
    implementationLanguage = 'TypeScript',
    outputDir = 'repl-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting REPL Development: ${languageName}`);

  // ============================================================================
  // PHASE 1: INPUT HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 1: Implementing Input Handling');

  const inputHandling = await ctx.task(inputHandlingTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...inputHandling.artifacts);

  // ============================================================================
  // PHASE 2: INCREMENTAL PARSING
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Incremental Parsing');

  const incrementalParsing = await ctx.task(incrementalParsingTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...incrementalParsing.artifacts);

  // ============================================================================
  // PHASE 3: EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Evaluation');

  const evaluation = await ctx.task(replEvaluationTask, {
    languageName,
    interpreter,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // ============================================================================
  // PHASE 4: OUTPUT FORMATTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Output Formatting');

  const outputFormatting = await ctx.task(outputFormattingTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...outputFormatting.artifacts);

  // ============================================================================
  // PHASE 5: REPL COMMANDS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing REPL Commands');

  const replCommands = await ctx.task(replCommandsTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...replCommands.artifacts);

  // ============================================================================
  // PHASE 6: TAB COMPLETION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Tab Completion');

  const tabCompletion = await ctx.task(tabCompletionTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...tabCompletion.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating REPL');

  const integration = await ctx.task(replIntegrationTask, {
    languageName,
    inputHandling,
    incrementalParsing,
    evaluation,
    outputFormatting,
    replCommands,
    tabCompletion,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 8: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Tests');

  const testSuite = await ctx.task(replTestingTask, {
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

  const documentation = await ctx.task(replDocumentationTask, {
    languageName,
    replCommands,
    tabCompletion,
    integration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `REPL Development Complete for ${languageName}! Commands: ${replCommands.commandCount}, Tab completion: ${tabCompletion.completionTypes.length} types. Review deliverables?`,
    title: 'REPL Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        commands: replCommands.commandCount,
        completionTypes: tabCompletion.completionTypes,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'REPL Implementation' },
        { path: documentation.userGuidePath, format: 'markdown', label: 'User Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    repl: {
      mainFile: integration.mainFilePath,
      features: integration.features
    },
    commands: {
      count: replCommands.commandCount,
      commands: replCommands.commands
    },
    completion: {
      types: tabCompletion.completionTypes,
      features: tabCompletion.features
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      userGuidePath: documentation.userGuidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/repl-development',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const inputHandlingTask = defineTask('input-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Input Handling - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'REPL Engineer',
      task: 'Implement input handling',
      context: args,
      instructions: [
        '1. Integrate readline library',
        '2. Handle multi-line input',
        '3. Implement bracket matching',
        '4. Add history support',
        '5. Handle keyboard shortcuts',
        '6. Support line editing',
        '7. Handle paste events',
        '8. Support input from files',
        '9. Add undo/redo support',
        '10. Test input scenarios'
      ],
      outputFormat: 'JSON with input handling'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        historySupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'repl', 'input']
}));

export const incrementalParsingTask = defineTask('incremental-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Incremental Parsing - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'REPL Engineer',
      task: 'Implement incremental parsing',
      context: args,
      instructions: [
        '1. Detect complete expressions',
        '2. Request continuation for incomplete input',
        '3. Handle syntax errors gracefully',
        '4. Support expression-mode input',
        '5. Support statement-mode input',
        '6. Handle definitions',
        '7. Track continuation state',
        '8. Provide clear continuation prompts',
        '9. Handle cancel/reset',
        '10. Test parsing scenarios'
      ],
      outputFormat: 'JSON with incremental parsing'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        continuationPrompt: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'repl', 'parsing']
}));

export const replEvaluationTask = defineTask('repl-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: REPL Evaluation - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'REPL Engineer',
      task: 'Implement REPL evaluation',
      context: args,
      instructions: [
        '1. Manage REPL state',
        '2. Handle definitions (persist)',
        '3. Handle expressions (print result)',
        '4. Handle statements',
        '5. Support incremental redefinition',
        '6. Track evaluation history',
        '7. Support _ for last result',
        '8. Handle errors gracefully',
        '9. Support execution timeout',
        '10. Test evaluation'
      ],
      outputFormat: 'JSON with evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        stateManagement: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'repl', 'evaluation']
}));

export const outputFormattingTask = defineTask('output-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Output Formatting - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'REPL Engineer',
      task: 'Implement output formatting',
      context: args,
      instructions: [
        '1. Pretty-print values',
        '2. Format complex structures',
        '3. Truncate large outputs',
        '4. Add color support',
        '5. Format error messages',
        '6. Show type information',
        '7. Format collections nicely',
        '8. Handle special values (functions)',
        '9. Support different output formats',
        '10. Test formatting'
      ],
      outputFormat: 'JSON with output formatting'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        colorSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'repl', 'output']
}));

export const replCommandsTask = defineTask('repl-commands', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: REPL Commands - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'REPL Engineer',
      task: 'Implement REPL commands',
      context: args,
      instructions: [
        '1. Add :help command',
        '2. Add :quit/:exit command',
        '3. Add :load file command',
        '4. Add :type expression command',
        '5. Add :clear command',
        '6. Add :history command',
        '7. Add :reset command',
        '8. Add :env command (show bindings)',
        '9. Create command parser',
        '10. Document commands'
      ],
      outputFormat: 'JSON with REPL commands'
    },
    outputSchema: {
      type: 'object',
      required: ['commandCount', 'commands', 'filePath', 'artifacts'],
      properties: {
        commandCount: { type: 'number' },
        commands: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'repl', 'commands']
}));

export const tabCompletionTask = defineTask('tab-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Tab Completion - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'REPL Engineer',
      task: 'Implement tab completion',
      context: args,
      instructions: [
        '1. Complete identifiers',
        '2. Complete keywords',
        '3. Complete REPL commands',
        '4. Complete file paths',
        '5. Complete member access',
        '6. Show completion hints',
        '7. Handle ambiguous completions',
        '8. Support fuzzy matching',
        '9. Cache completions',
        '10. Test completion'
      ],
      outputFormat: 'JSON with tab completion'
    },
    outputSchema: {
      type: 'object',
      required: ['completionTypes', 'features', 'filePath', 'artifacts'],
      properties: {
        completionTypes: { type: 'array', items: { type: 'string' } },
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
  labels: ['programming-languages', 'repl', 'completion']
}));

export const replIntegrationTask = defineTask('repl-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: REPL Integration - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'REPL Engineer',
      task: 'Integrate REPL components',
      context: args,
      instructions: [
        '1. Create main REPL class',
        '2. Integrate all components',
        '3. Implement main loop',
        '4. Add configuration options',
        '5. Handle signals (Ctrl+C)',
        '6. Implement startup/shutdown',
        '7. Add session management',
        '8. Support scripting mode',
        '9. Add debug mode',
        '10. Final organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'features', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'repl', 'integration']
}));

export const replTestingTask = defineTask('repl-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: REPL Testing - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive REPL tests',
      context: args,
      instructions: [
        '1. Test input handling',
        '2. Test incremental parsing',
        '3. Test evaluation',
        '4. Test output formatting',
        '5. Test REPL commands',
        '6. Test tab completion',
        '7. Test error handling',
        '8. Test interactive scenarios',
        '9. Measure code coverage',
        '10. Add integration tests'
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
  labels: ['programming-languages', 'repl', 'testing']
}));

export const replDocumentationTask = defineTask('repl-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: REPL Documentation - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate REPL documentation',
      context: args,
      instructions: [
        '1. Create user guide',
        '2. Document REPL commands',
        '3. Document keyboard shortcuts',
        '4. Document tab completion',
        '5. Add usage examples',
        '6. Create quick reference',
        '7. Document configuration',
        '8. Add troubleshooting guide',
        '9. Document customization',
        '10. Add tips and tricks'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['userGuidePath', 'artifacts'],
      properties: {
        userGuidePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'repl', 'documentation']
}));

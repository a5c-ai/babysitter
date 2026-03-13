/**
 * @process specializations/cli-mcp-development/interactive-prompt-system
 * @description Interactive Prompt System - Implement interactive prompts for gathering user input when arguments are missing,
 * including text inputs, selections, confirmations, and password prompts.
 * @inputs { projectName: string, language: string, promptLibrary?: string, prompts: array }
 * @outputs { success: boolean, promptConfig: object, promptFlows: array, validationRules: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/interactive-prompt-system', {
 *   projectName: 'config-cli',
 *   language: 'typescript',
 *   promptLibrary: 'inquirer',
 *   prompts: [
 *     { type: 'input', name: 'projectName', message: 'Project name?' },
 *     { type: 'list', name: 'template', choices: ['react', 'vue', 'angular'] }
 *   ]
 * });
 *
 * @references
 * - Inquirer.js: https://github.com/SBoudrias/Inquirer.js
 * - Questionary: https://github.com/tmbo/questionary
 * - Survey: https://github.com/AlecAivazis/survey
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    promptLibrary = 'inquirer',
    prompts = [],
    nonInteractiveDefaults = true,
    outputDir = 'interactive-prompt-system'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Interactive Prompt System: ${projectName}`);
  ctx.log('info', `Prompt Library: ${promptLibrary}`);

  // ============================================================================
  // PHASE 1: PROMPT LIBRARY SELECTION AND SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up prompt library');

  const librarySetup = await ctx.task(librarySetupTask, {
    projectName,
    language,
    promptLibrary,
    outputDir
  });

  artifacts.push(...librarySetup.artifacts);

  // ============================================================================
  // PHASE 2: TEXT INPUT PROMPTS
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing text input prompts with validation');

  const textPrompts = await ctx.task(textPromptsTask, {
    projectName,
    language,
    promptLibrary,
    prompts: prompts.filter(p => p.type === 'input' || p.type === 'text'),
    outputDir
  });

  artifacts.push(...textPrompts.artifacts);

  // ============================================================================
  // PHASE 3: SELECTION PROMPTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Adding selection prompts (single and multi-select)');

  const selectionPrompts = await ctx.task(selectionPromptsTask, {
    projectName,
    language,
    promptLibrary,
    prompts: prompts.filter(p => p.type === 'list' || p.type === 'checkbox'),
    outputDir
  });

  artifacts.push(...selectionPrompts.artifacts);

  // ============================================================================
  // PHASE 4: CONFIRMATION PROMPTS
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating confirmation prompts for destructive actions');

  const confirmationPrompts = await ctx.task(confirmationPromptsTask, {
    projectName,
    language,
    promptLibrary,
    outputDir
  });

  artifacts.push(...confirmationPrompts.artifacts);

  // ============================================================================
  // PHASE 5: PASSWORD/SECRET PROMPTS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing password and secret input prompts');

  const passwordPrompts = await ctx.task(passwordPromptsTask, {
    projectName,
    language,
    promptLibrary,
    outputDir
  });

  artifacts.push(...passwordPrompts.artifacts);

  // Quality Gate: Prompt System Review
  await ctx.breakpoint({
    question: `Prompt system configured with ${textPrompts.prompts.length + selectionPrompts.prompts.length} prompts. Proceed with progress indicators and non-interactive mode?`,
    title: 'Prompt System Review',
    context: {
      runId: ctx.runId,
      projectName,
      textPrompts: textPrompts.prompts.length,
      selectionPrompts: selectionPrompts.prompts.length,
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: PROGRESS INDICATORS
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding progress indicators during operations');

  const progressIndicators = await ctx.task(progressIndicatorsTask, {
    projectName,
    language,
    promptLibrary,
    outputDir
  });

  artifacts.push(...progressIndicators.artifacts);

  // ============================================================================
  // PHASE 7: NON-INTERACTIVE MODE
  // ============================================================================

  ctx.log('info', 'Phase 7: Handling non-interactive mode fallback');

  const nonInteractiveMode = await ctx.task(nonInteractiveModeTask, {
    projectName,
    language,
    nonInteractiveDefaults,
    prompts,
    outputDir
  });

  artifacts.push(...nonInteractiveMode.artifacts);

  // ============================================================================
  // PHASE 8: ACCESSIBILITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Testing prompt accessibility');

  const accessibilityTesting = await ctx.task(accessibilityTestingTask, {
    projectName,
    language,
    promptLibrary,
    textPrompts,
    selectionPrompts,
    outputDir
  });

  artifacts.push(...accessibilityTesting.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Documenting interactive mode behavior');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    librarySetup,
    textPrompts,
    selectionPrompts,
    confirmationPrompts,
    passwordPrompts,
    progressIndicators,
    nonInteractiveMode,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Interactive Prompt System complete for ${projectName}. Review and approve?`,
    title: 'Interactive Prompt System Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        promptLibrary,
        totalPrompts: textPrompts.prompts.length + selectionPrompts.prompts.length,
        hasProgressIndicators: true,
        nonInteractiveModeSupported: nonInteractiveDefaults
      },
      files: [
        { path: documentation.promptDocPath, format: 'markdown', label: 'Prompt Documentation' },
        { path: librarySetup.configPath, format: language === 'typescript' ? 'typescript' : language, label: 'Prompt Config' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    promptConfig: {
      library: promptLibrary,
      configPath: librarySetup.configPath
    },
    promptFlows: [
      ...textPrompts.prompts,
      ...selectionPrompts.prompts,
      ...confirmationPrompts.prompts,
      ...passwordPrompts.prompts
    ],
    progressIndicators: progressIndicators.indicators,
    nonInteractiveMode: nonInteractiveMode.config,
    validationRules: textPrompts.validationRules,
    documentation: {
      promptDoc: documentation.promptDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/interactive-prompt-system',
      timestamp: startTime,
      promptLibrary
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const librarySetupTask = defineTask('library-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Library Setup - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'CLI Interactive Prompt Specialist',
      task: 'Set up prompt library',
      context: {
        projectName: args.projectName,
        language: args.language,
        promptLibrary: args.promptLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install and configure prompt library',
        '2. Create prompt utilities module',
        '3. Configure default prompt settings',
        '4. Set up prompt theming if supported',
        '5. Configure error handling for prompts',
        '6. Generate prompt configuration'
      ],
      outputFormat: 'JSON with library setup configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'setup']
}));

export const textPromptsTask = defineTask('text-prompts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Text Prompts - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'CLI Prompt Designer',
      task: 'Implement text input prompts with validation',
      context: {
        projectName: args.projectName,
        language: args.language,
        promptLibrary: args.promptLibrary,
        prompts: args.prompts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create text input prompt templates',
        '2. Add input validation (required, format, length)',
        '3. Configure default values',
        '4. Add placeholder text support',
        '5. Implement transformer functions',
        '6. Generate text prompt implementations'
      ],
      outputFormat: 'JSON with text prompts'
    },
    outputSchema: {
      type: 'object',
      required: ['prompts', 'validationRules', 'artifacts'],
      properties: {
        prompts: { type: 'array', items: { type: 'object' } },
        validationRules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'text-input']
}));

export const selectionPromptsTask = defineTask('selection-prompts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Selection Prompts - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'CLI Selection Designer',
      task: 'Add selection prompts (single and multi-select)',
      context: {
        projectName: args.projectName,
        language: args.language,
        promptLibrary: args.promptLibrary,
        prompts: args.prompts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create single-select list prompts',
        '2. Create multi-select checkbox prompts',
        '3. Add dynamic choice loading',
        '4. Configure choice formatting',
        '5. Add search/filter for long lists',
        '6. Generate selection prompt implementations'
      ],
      outputFormat: 'JSON with selection prompts'
    },
    outputSchema: {
      type: 'object',
      required: ['prompts', 'artifacts'],
      properties: {
        prompts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'selection']
}));

export const confirmationPromptsTask = defineTask('confirmation-prompts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Confirmation Prompts - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'CLI Confirmation Designer',
      task: 'Create confirmation prompts for destructive actions',
      context: {
        projectName: args.projectName,
        language: args.language,
        promptLibrary: args.promptLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create yes/no confirmation prompts',
        '2. Add type-to-confirm for destructive actions',
        '3. Configure default confirmation values',
        '4. Add warning messages for dangerous operations',
        '5. Generate confirmation prompt implementations'
      ],
      outputFormat: 'JSON with confirmation prompts'
    },
    outputSchema: {
      type: 'object',
      required: ['prompts', 'artifacts'],
      properties: {
        prompts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'confirmation']
}));

export const passwordPromptsTask = defineTask('password-prompts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Password Prompts - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'CLI Security Prompt Designer',
      task: 'Implement password and secret input prompts',
      context: {
        projectName: args.projectName,
        language: args.language,
        promptLibrary: args.promptLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create password input with masking',
        '2. Add confirmation password prompts',
        '3. Configure secret input handling',
        '4. Ensure secrets are not logged',
        '5. Generate password prompt implementations'
      ],
      outputFormat: 'JSON with password prompts'
    },
    outputSchema: {
      type: 'object',
      required: ['prompts', 'artifacts'],
      properties: {
        prompts: { type: 'array', items: { type: 'object' } },
        securityConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'password', 'security']
}));

export const progressIndicatorsTask = defineTask('progress-indicators', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Progress Indicators - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'CLI Progress Indicator Designer',
      task: 'Add progress indicators during operations',
      context: {
        projectName: args.projectName,
        language: args.language,
        promptLibrary: args.promptLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create spinner for indeterminate progress',
        '2. Add progress bar for known duration',
        '3. Configure progress messages',
        '4. Handle progress in non-TTY mode',
        '5. Generate progress indicator implementations'
      ],
      outputFormat: 'JSON with progress indicators'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'artifacts'],
      properties: {
        indicators: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'progress']
}));

export const nonInteractiveModeTask = defineTask('non-interactive-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Non-Interactive Mode - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'CLI Mode Designer',
      task: 'Handle non-interactive mode fallback',
      context: {
        projectName: args.projectName,
        language: args.language,
        nonInteractiveDefaults: args.nonInteractiveDefaults,
        prompts: args.prompts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Detect non-interactive (non-TTY) mode',
        '2. Configure default values for non-interactive',
        '3. Add --yes flag for automatic confirmation',
        '4. Handle missing required inputs gracefully',
        '5. Generate non-interactive mode handling'
      ],
      outputFormat: 'JSON with non-interactive mode config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        defaultValues: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'non-interactive']
}));

export const accessibilityTestingTask = defineTask('accessibility-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Accessibility Testing - ${args.projectName}`,
  agent: {
    name: 'terminal-accessibility-expert',
    prompt: {
      role: 'CLI Accessibility Tester',
      task: 'Test prompt accessibility',
      context: {
        projectName: args.projectName,
        language: args.language,
        promptLibrary: args.promptLibrary,
        textPrompts: args.textPrompts,
        selectionPrompts: args.selectionPrompts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test keyboard navigation',
        '2. Test screen reader compatibility',
        '3. Test color contrast in prompts',
        '4. Test prompt focus management',
        '5. Generate accessibility test suite'
      ],
      outputFormat: 'JSON with accessibility test results'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'artifacts'],
      properties: {
        testResults: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'accessibility', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'CLI Documentation Specialist',
      task: 'Document interactive mode behavior',
      context: {
        projectName: args.projectName,
        librarySetup: args.librarySetup,
        textPrompts: args.textPrompts,
        selectionPrompts: args.selectionPrompts,
        confirmationPrompts: args.confirmationPrompts,
        passwordPrompts: args.passwordPrompts,
        progressIndicators: args.progressIndicators,
        nonInteractiveMode: args.nonInteractiveMode,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document all prompt types',
        '2. Document validation rules',
        '3. Document non-interactive mode',
        '4. Add usage examples',
        '5. Document progress indicators',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['promptDocPath', 'artifacts'],
      properties: {
        promptDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'prompts', 'documentation']
}));

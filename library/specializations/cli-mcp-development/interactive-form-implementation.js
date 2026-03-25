/**
 * @process specializations/cli-mcp-development/interactive-form-implementation
 * @description Interactive Form Implementation - Create multi-field interactive forms for complex data entry in terminal
 * with validation, navigation, and submission handling.
 * @inputs { projectName: string, language: string, framework?: string, fields: array }
 * @outputs { success: boolean, formConfig: object, fieldComponents: array, validationRules: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/interactive-form-implementation', {
 *   projectName: 'config-wizard',
 *   language: 'typescript',
 *   framework: 'ink',
 *   fields: [
 *     { name: 'projectName', type: 'text', required: true },
 *     { name: 'template', type: 'select', choices: ['react', 'vue'] }
 *   ]
 * });
 *
 * @references
 * - Huh: https://github.com/charmbracelet/huh
 * - Enquirer: https://github.com/enquirer/enquirer
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    framework = 'ink',
    fields = [],
    outputDir = 'interactive-form-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Interactive Form Implementation: ${projectName}`);

  // ============================================================================
  // PHASE 1: FORM COMPONENT STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing form component structure');

  const formStructure = await ctx.task(formStructureTask, {
    projectName,
    language,
    framework,
    fields,
    outputDir
  });

  artifacts.push(...formStructure.artifacts);

  // ============================================================================
  // PHASE 2: TEXT INPUT FIELDS
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing text input fields');

  const textInputFields = await ctx.task(textInputFieldsTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...textInputFields.artifacts);

  // ============================================================================
  // PHASE 3: SELECT/DROPDOWN FIELDS
  // ============================================================================

  ctx.log('info', 'Phase 3: Adding select/dropdown fields');

  const selectFields = await ctx.task(selectFieldsTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...selectFields.artifacts);

  // ============================================================================
  // PHASE 4: CHECKBOX AND TOGGLE FIELDS
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating checkbox and toggle fields');

  const checkboxFields = await ctx.task(checkboxFieldsTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...checkboxFields.artifacts);

  // ============================================================================
  // PHASE 5: DATE/TIME PICKERS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing date/time pickers');

  const dateTimePickers = await ctx.task(dateTimePickersTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...dateTimePickers.artifacts);

  // Quality Gate: Field Components Review
  await ctx.breakpoint({
    question: `Form field components created. Proceed with validation and navigation?`,
    title: 'Field Components Review',
    context: {
      runId: ctx.runId,
      projectName,
      fieldTypes: ['text', 'select', 'checkbox', 'datetime'],
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: FIELD VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding field validation');

  const fieldValidation = await ctx.task(fieldValidationTask, {
    projectName,
    language,
    framework,
    fields,
    outputDir
  });

  artifacts.push(...fieldValidation.artifacts);

  // ============================================================================
  // PHASE 7: FORM NAVIGATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating form navigation (tab, arrows)');

  const formNavigation = await ctx.task(formNavigationTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...formNavigation.artifacts);

  // ============================================================================
  // PHASE 8: FORM SUBMISSION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing form submission handling');

  const formSubmission = await ctx.task(formSubmissionTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...formSubmission.artifacts);

  // ============================================================================
  // PHASE 9: FORM STATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Adding form state management');

  const formStateManagement = await ctx.task(formStateManagementTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...formStateManagement.artifacts);

  // ============================================================================
  // PHASE 10: FIELD DEPENDENCIES
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating field dependencies');

  const fieldDependencies = await ctx.task(fieldDependenciesTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...fieldDependencies.artifacts);

  // ============================================================================
  // PHASE 11: ACCESSIBILITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Testing keyboard accessibility');

  const accessibilityTesting = await ctx.task(accessibilityTestingTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...accessibilityTesting.artifacts);

  // ============================================================================
  // PHASE 12: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    formStructure,
    textInputFields,
    selectFields,
    fieldValidation,
    formNavigation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Interactive Form Implementation complete for ${projectName}. Review and approve?`,
    title: 'Form Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework,
        fieldTypes: 5,
        hasValidation: true,
        hasDependencies: true
      },
      files: [
        { path: documentation.formDocPath, format: 'markdown', label: 'Form Documentation' },
        { path: formStructure.formPath, format: 'typescript', label: 'Form Component' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    formConfig: {
      framework,
      formPath: formStructure.formPath
    },
    fieldComponents: [
      { type: 'text', path: textInputFields.componentPath },
      { type: 'select', path: selectFields.componentPath },
      { type: 'checkbox', path: checkboxFields.componentPath },
      { type: 'datetime', path: dateTimePickers.componentPath }
    ],
    validationRules: fieldValidation.rules,
    navigation: formNavigation.config,
    documentation: {
      formDoc: documentation.formDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/interactive-form-implementation',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const formStructureTask = defineTask('form-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Form Structure - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Form Architect',
      task: 'Design form component structure',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        fields: args.fields,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Form container component',
        '2. Design field layout structure',
        '3. Create form context for state',
        '4. Set up field registration',
        '5. Generate form structure code'
      ],
      outputFormat: 'JSON with form structure'
    },
    outputSchema: {
      type: 'object',
      required: ['formPath', 'artifacts'],
      properties: {
        formPath: { type: 'string' },
        formConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'structure']
}));

export const textInputFieldsTask = defineTask('text-input-fields', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Text Input Fields - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Input Component Developer',
      task: 'Implement text input fields',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create TextInput component',
        '2. Add cursor handling',
        '3. Implement character input',
        '4. Add placeholder support',
        '5. Handle multiline input',
        '6. Generate text input code'
      ],
      outputFormat: 'JSON with text input fields'
    },
    outputSchema: {
      type: 'object',
      required: ['componentPath', 'artifacts'],
      properties: {
        componentPath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'text-input']
}));

export const selectFieldsTask = defineTask('select-fields', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Select Fields - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Select Component Developer',
      task: 'Add select/dropdown fields',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Select component',
        '2. Implement option rendering',
        '3. Add arrow key navigation',
        '4. Handle selection',
        '5. Add search filtering',
        '6. Generate select field code'
      ],
      outputFormat: 'JSON with select fields'
    },
    outputSchema: {
      type: 'object',
      required: ['componentPath', 'artifacts'],
      properties: {
        componentPath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'select']
}));

export const checkboxFieldsTask = defineTask('checkbox-fields', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Checkbox Fields - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Checkbox Component Developer',
      task: 'Create checkbox and toggle fields',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Checkbox component',
        '2. Create Toggle/Switch component',
        '3. Handle check state',
        '4. Add label support',
        '5. Generate checkbox field code'
      ],
      outputFormat: 'JSON with checkbox fields'
    },
    outputSchema: {
      type: 'object',
      required: ['componentPath', 'artifacts'],
      properties: {
        componentPath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'checkbox']
}));

export const dateTimePickersTask = defineTask('datetime-pickers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: DateTime Pickers - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI DateTime Component Developer',
      task: 'Implement date/time pickers',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create DatePicker component',
        '2. Create TimePicker component',
        '3. Add calendar view',
        '4. Handle date/time selection',
        '5. Generate datetime picker code'
      ],
      outputFormat: 'JSON with datetime pickers'
    },
    outputSchema: {
      type: 'object',
      required: ['componentPath', 'artifacts'],
      properties: {
        componentPath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'datetime']
}));

export const fieldValidationTask = defineTask('field-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Field Validation - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Validation Specialist',
      task: 'Add field validation',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        fields: args.fields,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create validation engine',
        '2. Implement required validation',
        '3. Add pattern validation',
        '4. Implement custom validators',
        '5. Display validation errors',
        '6. Generate validation code'
      ],
      outputFormat: 'JSON with field validation'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'artifacts'],
      properties: {
        rules: { type: 'array', items: { type: 'object' } },
        validatorPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'validation']
}));

export const formNavigationTask = defineTask('form-navigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Form Navigation - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Navigation Specialist',
      task: 'Create form navigation (tab, arrows)',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement Tab navigation',
        '2. Add Shift+Tab for reverse',
        '3. Handle arrow key navigation',
        '4. Create field focus order',
        '5. Generate navigation code'
      ],
      outputFormat: 'JSON with form navigation'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        shortcuts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'navigation']
}));

export const formSubmissionTask = defineTask('form-submission', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Form Submission - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Form Submission Specialist',
      task: 'Implement form submission handling',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Handle Enter key submission',
        '2. Validate all fields before submit',
        '3. Show submission progress',
        '4. Handle submission errors',
        '5. Generate form submission code'
      ],
      outputFormat: 'JSON with form submission'
    },
    outputSchema: {
      type: 'object',
      required: ['submissionConfig', 'artifacts'],
      properties: {
        submissionConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'submission']
}));

export const formStateManagementTask = defineTask('form-state-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Form State Management - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI State Management Specialist',
      task: 'Add form state management',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create form state container',
        '2. Handle field value changes',
        '3. Track dirty/touched state',
        '4. Implement reset functionality',
        '5. Generate state management code'
      ],
      outputFormat: 'JSON with form state management'
    },
    outputSchema: {
      type: 'object',
      required: ['stateConfig', 'artifacts'],
      properties: {
        stateConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'state']
}));

export const fieldDependenciesTask = defineTask('field-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Field Dependencies - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Field Dependencies Specialist',
      task: 'Create field dependencies',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement conditional fields',
        '2. Handle field visibility rules',
        '3. Create field value dependencies',
        '4. Update dependent fields',
        '5. Generate dependencies code'
      ],
      outputFormat: 'JSON with field dependencies'
    },
    outputSchema: {
      type: 'object',
      required: ['dependenciesConfig', 'artifacts'],
      properties: {
        dependenciesConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'dependencies']
}));

export const accessibilityTestingTask = defineTask('accessibility-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Accessibility Testing - ${args.projectName}`,
  agent: {
    name: 'terminal-accessibility-expert',
    prompt: {
      role: 'TUI Accessibility Tester',
      task: 'Test keyboard accessibility',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test tab navigation order',
        '2. Test keyboard-only operation',
        '3. Test focus visibility',
        '4. Test screen reader compatibility',
        '5. Generate accessibility test suite'
      ],
      outputFormat: 'JSON with accessibility tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'artifacts'],
      properties: {
        testResults: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'accessibility']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'TUI Form Documentation Specialist',
      task: 'Generate documentation',
      context: {
        projectName: args.projectName,
        formStructure: args.formStructure,
        textInputFields: args.textInputFields,
        selectFields: args.selectFields,
        fieldValidation: args.fieldValidation,
        formNavigation: args.formNavigation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document form component API',
        '2. Document field components',
        '3. Document validation rules',
        '4. Document navigation patterns',
        '5. Add usage examples',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['formDocPath', 'artifacts'],
      properties: {
        formDocPath: { type: 'string' },
        componentDocs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'form', 'documentation']
}));

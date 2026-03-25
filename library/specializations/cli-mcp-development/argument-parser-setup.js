/**
 * @process specializations/cli-mcp-development/argument-parser-setup
 * @description Argument Parser Setup - Implement comprehensive argument parsing with validation, help generation,
 * custom types, environment variable fallbacks, and shell completion scripts.
 * @inputs { projectName: string, language: string, framework: string, commands: array, globalOptions?: array }
 * @outputs { success: boolean, parserConfig: object, validationRules: array, completionScripts: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/argument-parser-setup', {
 *   projectName: 'data-cli',
 *   language: 'typescript',
 *   framework: 'commander',
 *   commands: [{ name: 'process', args: ['input'], options: ['--output', '--format'] }],
 *   globalOptions: ['--verbose', '--config']
 * });
 *
 * @references
 * - Yargs: https://yargs.js.org/
 * - Argparse: https://docs.python.org/3/library/argparse.html
 * - Cobra: https://cobra.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    framework = 'commander',
    commands = [],
    globalOptions = ['--verbose', '--quiet', '--config'],
    envVarPrefix = '',
    outputDir = 'argument-parser-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Argument Parser Setup: ${projectName}`);
  ctx.log('info', `Language: ${language}, Framework: ${framework}`);

  // ============================================================================
  // PHASE 1: PARSER LIBRARY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Configuring argument parser library');

  const parserConfig = await ctx.task(parserConfigTask, {
    projectName,
    language,
    framework,
    commands,
    outputDir
  });

  artifacts.push(...parserConfig.artifacts);

  // ============================================================================
  // PHASE 2: POSITIONAL ARGUMENTS
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining positional arguments with types');

  const positionalArgs = await ctx.task(positionalArgsTask, {
    projectName,
    language,
    framework,
    commands,
    parserConfig,
    outputDir
  });

  artifacts.push(...positionalArgs.artifacts);

  // ============================================================================
  // PHASE 3: OPTIONAL FLAGS AND DEFAULTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing optional flags with defaults');

  const optionalFlags = await ctx.task(optionalFlagsTask, {
    projectName,
    language,
    framework,
    commands,
    globalOptions,
    outputDir
  });

  artifacts.push(...optionalFlags.artifacts);

  // ============================================================================
  // PHASE 4: CUSTOM ARGUMENT TYPES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating custom argument types and validators');

  const customTypes = await ctx.task(customTypesTask, {
    projectName,
    language,
    framework,
    commands,
    outputDir
  });

  artifacts.push(...customTypes.artifacts);

  // ============================================================================
  // PHASE 5: ENVIRONMENT VARIABLE FALLBACKS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing environment variable fallbacks');

  const envVarFallbacks = await ctx.task(envVarFallbacksTask, {
    projectName,
    language,
    framework,
    globalOptions,
    envVarPrefix,
    outputDir
  });

  artifacts.push(...envVarFallbacks.artifacts);

  // Quality Gate: Argument Configuration Review
  await ctx.breakpoint({
    question: `Argument parsing configured with ${positionalArgs.arguments.length} positional args, ${optionalFlags.flags.length} flags, and ${customTypes.types.length} custom types. Proceed with help and completion setup?`,
    title: 'Argument Configuration Review',
    context: {
      runId: ctx.runId,
      projectName,
      positionalArgs: positionalArgs.arguments.length,
      optionalFlags: optionalFlags.flags.length,
      customTypes: customTypes.types.length,
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: HELP TEXT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating help text with examples');

  const helpText = await ctx.task(helpTextTask, {
    projectName,
    language,
    framework,
    commands,
    positionalArgs,
    optionalFlags,
    outputDir
  });

  artifacts.push(...helpText.artifacts);

  // ============================================================================
  // PHASE 7: SHELL COMPLETION SCRIPTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Adding shell completion scripts');

  const completionScripts = await ctx.task(completionScriptsTask, {
    projectName,
    language,
    framework,
    commands,
    outputDir
  });

  artifacts.push(...completionScripts.artifacts);

  // ============================================================================
  // PHASE 8: VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Testing argument edge cases');

  const validation = await ctx.task(validationTestingTask, {
    projectName,
    language,
    framework,
    positionalArgs,
    optionalFlags,
    customTypes,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Documenting all options');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    parserConfig,
    positionalArgs,
    optionalFlags,
    customTypes,
    envVarFallbacks,
    completionScripts,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Argument Parser Setup complete for ${projectName}. Review and approve?`,
    title: 'Argument Parser Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        language,
        framework,
        positionalArguments: positionalArgs.arguments.length,
        optionalFlags: optionalFlags.flags.length,
        customTypes: customTypes.types.length,
        completionShells: Object.keys(completionScripts.scripts).length
      },
      files: [
        { path: documentation.optionsDocPath, format: 'markdown', label: 'Options Documentation' },
        { path: parserConfig.configPath, format: language === 'typescript' ? 'typescript' : language, label: 'Parser Config' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    parserConfig: {
      framework,
      configPath: parserConfig.configPath,
      options: parserConfig.options
    },
    arguments: {
      positional: positionalArgs.arguments,
      optional: optionalFlags.flags
    },
    customTypes: customTypes.types,
    validationRules: validation.rules,
    environmentVariables: envVarFallbacks.mappings,
    completionScripts: completionScripts.scripts,
    documentation: {
      optionsDoc: documentation.optionsDocPath,
      completionDoc: documentation.completionDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/argument-parser-setup',
      timestamp: startTime,
      language,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const parserConfigTask = defineTask('parser-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Parser Configuration - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'CLI Argument Parsing Specialist',
      task: 'Configure argument parser library',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        commands: args.commands,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize argument parser library',
        '2. Configure parser options and settings',
        '3. Set up command registration',
        '4. Configure error handling',
        '5. Set up help configuration',
        '6. Configure strict mode if available',
        '7. Generate parser configuration file'
      ],
      outputFormat: 'JSON with parser configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'options', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        options: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'configuration']
}));

export const positionalArgsTask = defineTask('positional-args', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Positional Arguments - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'CLI Argument Designer',
      task: 'Define positional arguments with types',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        commands: args.commands,
        parserConfig: args.parserConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze commands for required positional arguments',
        '2. Define argument types (string, number, file path)',
        '3. Configure required vs optional positional args',
        '4. Add argument descriptions for help text',
        '5. Configure variadic arguments if needed',
        '6. Set up argument coercion',
        '7. Generate positional argument definitions'
      ],
      outputFormat: 'JSON with positional arguments'
    },
    outputSchema: {
      type: 'object',
      required: ['arguments', 'artifacts'],
      properties: {
        arguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              required: { type: 'boolean' },
              description: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'positional']
}));

export const optionalFlagsTask = defineTask('optional-flags', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Optional Flags - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'CLI Flag Designer',
      task: 'Implement optional flags with defaults',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        commands: args.commands,
        globalOptions: args.globalOptions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define global flags (verbose, quiet, config)',
        '2. Define command-specific flags',
        '3. Configure short and long flag variants',
        '4. Set default values for optional flags',
        '5. Configure boolean flags',
        '6. Add mutually exclusive option groups',
        '7. Generate flag definitions'
      ],
      outputFormat: 'JSON with optional flags'
    },
    outputSchema: {
      type: 'object',
      required: ['flags', 'artifacts'],
      properties: {
        flags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              short: { type: 'string' },
              type: { type: 'string' },
              default: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        mutuallyExclusive: { type: 'array', items: { type: 'array' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'flags']
}));

export const customTypesTask = defineTask('custom-types', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Custom Types - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'CLI Type System Designer',
      task: 'Create custom argument types and validators',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        commands: args.commands,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify arguments needing custom types',
        '2. Create file path type with existence check',
        '3. Create URL type with validation',
        '4. Create enum type for choices',
        '5. Create date/time types',
        '6. Implement custom validators',
        '7. Generate custom type definitions'
      ],
      outputFormat: 'JSON with custom types'
    },
    outputSchema: {
      type: 'object',
      required: ['types', 'artifacts'],
      properties: {
        types: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              validation: { type: 'string' },
              errorMessage: { type: 'string' }
            }
          }
        },
        validators: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'custom-types']
}));

export const envVarFallbacksTask = defineTask('env-var-fallbacks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Environment Variable Fallbacks - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'CLI Configuration Specialist',
      task: 'Implement environment variable fallbacks',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        globalOptions: args.globalOptions,
        envVarPrefix: args.envVarPrefix,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define environment variable naming convention',
        '2. Map global options to environment variables',
        '3. Configure fallback precedence (arg > env > config)',
        '4. Document environment variables',
        '5. Add env var validation',
        '6. Generate env var configuration'
      ],
      outputFormat: 'JSON with environment variable mappings'
    },
    outputSchema: {
      type: 'object',
      required: ['mappings', 'artifacts'],
      properties: {
        mappings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              envVar: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        precedence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'environment-variables']
}));

export const helpTextTask = defineTask('help-text', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Help Text Generation - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'CLI Help Text Designer',
      task: 'Generate help text with examples',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        commands: args.commands,
        positionalArgs: args.positionalArgs,
        optionalFlags: args.optionalFlags,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure help text formatting',
        '2. Add usage examples for each command',
        '3. Configure help sections',
        '4. Add version information to help',
        '5. Configure help output styling',
        '6. Add footer with documentation links',
        '7. Generate help configuration'
      ],
      outputFormat: 'JSON with help text configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['helpConfig', 'artifacts'],
      properties: {
        helpConfig: { type: 'object' },
        examples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'help-text']
}));

export const completionScriptsTask = defineTask('completion-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Completion Scripts - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'Shell Completion Specialist',
      task: 'Add shell completion scripts',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        commands: args.commands,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate Bash completion script',
        '2. Generate Zsh completion script',
        '3. Generate Fish completion script',
        '4. Configure dynamic completions',
        '5. Add file path completions',
        '6. Document completion installation',
        '7. Generate completion scripts'
      ],
      outputFormat: 'JSON with completion scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'artifacts'],
      properties: {
        scripts: {
          type: 'object',
          properties: {
            bash: { type: 'string' },
            zsh: { type: 'string' },
            fish: { type: 'string' }
          }
        },
        installInstructions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'shell-completion']
}));

export const validationTestingTask = defineTask('validation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: {
      role: 'CLI Testing Specialist',
      task: 'Test argument edge cases',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        positionalArgs: args.positionalArgs,
        optionalFlags: args.optionalFlags,
        customTypes: args.customTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test required argument validation',
        '2. Test optional argument defaults',
        '3. Test custom type validation',
        '4. Test mutually exclusive options',
        '5. Test environment variable fallbacks',
        '6. Test help output',
        '7. Generate validation test suite'
      ],
      outputFormat: 'JSON with validation rules and tests'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'tests', 'artifacts'],
      properties: {
        rules: { type: 'array', items: { type: 'object' } },
        tests: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'CLI Documentation Specialist',
      task: 'Document all options',
      context: {
        projectName: args.projectName,
        parserConfig: args.parserConfig,
        positionalArgs: args.positionalArgs,
        optionalFlags: args.optionalFlags,
        customTypes: args.customTypes,
        envVarFallbacks: args.envVarFallbacks,
        completionScripts: args.completionScripts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document all positional arguments',
        '2. Document all optional flags',
        '3. Document custom types and validation',
        '4. Document environment variables',
        '5. Document shell completion installation',
        '6. Add usage examples',
        '7. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['optionsDocPath', 'artifacts'],
      properties: {
        optionsDocPath: { type: 'string' },
        completionDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'argument-parsing', 'documentation']
}));

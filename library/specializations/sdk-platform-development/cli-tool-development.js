/**
 * @process specializations/sdk-platform-development/cli-tool-development
 * @description Develops command-line interface tools for SDK ecosystems, including
 *              project scaffolding, code generation, debugging utilities, and
 *              developer workflow automation.
 * @inputs {
 *   sdkName: string,
 *   cliName: string,
 *   languages: string[],
 *   commandCategories: string[],
 *   features: string[]
 * }
 * @outputs {
 *   cliArchitecture: object,
 *   commands: object,
 *   scaffolding: object,
 *   distribution: object
 * }
 * @example
 *   inputs: {
 *     sdkName: "platform-sdk",
 *     cliName: "platform-cli",
 *     languages: ["typescript", "go"],
 *     commandCategories: ["init", "generate", "deploy", "debug", "config"],
 *     features: ["interactive-prompts", "progress-bars", "color-output", "autocomplete"]
 *   }
 * @references
 *   - https://oclif.io/docs/
 *   - https://cobra.dev/
 *   - https://click.palletsprojects.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { sdkName, cliName, languages, commandCategories, features } = inputs;

  ctx.log.info('Starting CLI tool development', {
    sdkName,
    cliName,
    commandCategories
  });

  // Phase 1: CLI Architecture Design
  ctx.log.info('Phase 1: Designing CLI architecture');
  const cliArchitecture = await ctx.task(cliArchitectureDesignTask, {
    sdkName,
    cliName,
    languages,
    features
  });

  // Phase 2: Command Structure Definition
  ctx.log.info('Phase 2: Defining command structure');
  const commandStructure = await ctx.task(commandStructureDefinitionTask, {
    cliName,
    commandCategories,
    architecture: cliArchitecture.result
  });

  // Phase 3: Scaffolding and Code Generation
  ctx.log.info('Phase 3: Implementing scaffolding');
  const scaffolding = await ctx.task(scaffoldingImplementationTask, {
    sdkName,
    cliName,
    languages,
    commands: commandStructure.result
  });

  // Phase 4: Interactive Features
  ctx.log.info('Phase 4: Adding interactive features');
  const interactiveFeatures = await ctx.task(interactiveFeaturesTask, {
    cliName,
    features,
    architecture: cliArchitecture.result
  });

  // Phase 5: Distribution and Installation
  ctx.log.info('Phase 5: Setting up distribution');
  const distribution = await ctx.task(cliDistributionSetupTask, {
    cliName,
    languages,
    architecture: cliArchitecture.result
  });

  // Quality Gate
  await ctx.breakpoint('cli-development-review', {
    question: 'Review the CLI tool implementation. Is the UX intuitive and the command structure logical?',
    context: {
      cliArchitecture: cliArchitecture.result,
      commandStructure: commandStructure.result,
      scaffolding: scaffolding.result,
      interactiveFeatures: interactiveFeatures.result
    }
  });

  ctx.log.info('CLI tool development completed');

  return {
    cliArchitecture: cliArchitecture.result,
    commands: commandStructure.result,
    scaffolding: scaffolding.result,
    interactiveFeatures: interactiveFeatures.result,
    distribution: distribution.result
  };
}

export const cliArchitectureDesignTask = defineTask('cli-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design CLI architecture',
  agent: {
    name: 'cli-ux-reviewer',
    prompt: {
      role: 'CLI tool architect',
      task: `Design CLI architecture for ${args.cliName}`,
      context: {
        sdkName: args.sdkName,
        languages: args.languages,
        features: args.features
      },
      instructions: [
        'Choose CLI framework (oclif, commander, yargs, cobra, click)',
        'Design plugin/extension architecture for CLI',
        'Plan command hierarchy and namespacing',
        'Design configuration management (files, env vars)',
        'Plan authentication and credential storage',
        'Define output formats (table, JSON, YAML)',
        'Design error handling and exit codes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        framework: { type: 'object' },
        pluginArchitecture: { type: 'object' },
        commandHierarchy: { type: 'object' },
        configManagement: { type: 'object' },
        authentication: { type: 'object' },
        outputFormats: { type: 'array' },
        errorHandling: { type: 'object' }
      },
      required: ['framework', 'commandHierarchy', 'configManagement']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'architecture', 'design']
}));

export const commandStructureDefinitionTask = defineTask('command-structure-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define command structure',
  agent: {
    name: 'cli-ux-reviewer',
    prompt: {
      role: 'CLI command designer',
      task: `Define command structure for ${args.cliName}`,
      context: {
        commandCategories: args.commandCategories,
        architecture: args.architecture
      },
      instructions: [
        'Define init/setup commands for project bootstrapping',
        'Create generate commands for code scaffolding',
        'Design deploy/publish commands for releases',
        'Add debug/diagnose commands for troubleshooting',
        'Create config commands for settings management',
        'Define auth commands for credential management',
        'Add help and documentation commands'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        initCommands: { type: 'array' },
        generateCommands: { type: 'array' },
        deployCommands: { type: 'array' },
        debugCommands: { type: 'array' },
        configCommands: { type: 'array' },
        authCommands: { type: 'array' },
        commandSpecs: { type: 'object' }
      },
      required: ['initCommands', 'generateCommands', 'commandSpecs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'commands', 'structure']
}));

export const scaffoldingImplementationTask = defineTask('scaffolding-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement scaffolding system',
  agent: {
    name: 'template-customization-agent',
    prompt: {
      role: 'Code scaffolding engineer',
      task: `Implement scaffolding system for ${args.cliName}`,
      context: {
        sdkName: args.sdkName,
        languages: args.languages,
        commands: args.commands
      },
      instructions: [
        'Design template engine integration (handlebars, EJS, etc.)',
        'Create project templates for different use cases',
        'Implement file generation with conflict resolution',
        'Design variable interpolation and transforms',
        'Create post-generation hooks (npm install, git init)',
        'Implement incremental scaffolding (add to existing)',
        'Add template validation and testing'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        templateEngine: { type: 'object' },
        projectTemplates: { type: 'array' },
        fileGeneration: { type: 'object' },
        variableInterpolation: { type: 'object' },
        postGenerationHooks: { type: 'array' },
        conflictResolution: { type: 'object' }
      },
      required: ['templateEngine', 'projectTemplates', 'fileGeneration']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'scaffolding', 'templates']
}));

export const interactiveFeaturesTask = defineTask('interactive-features', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add interactive features',
  agent: {
    name: 'cli-ux-reviewer',
    prompt: {
      role: 'CLI UX engineer',
      task: `Add interactive features to ${args.cliName}`,
      context: {
        features: args.features,
        architecture: args.architecture
      },
      instructions: [
        'Implement interactive prompts (inquirer, survey)',
        'Add progress bars and spinners for long operations',
        'Create color-coded output with chalk/colors',
        'Implement shell autocomplete (bash, zsh, fish)',
        'Add table output formatting',
        'Create interactive selection menus',
        'Implement verbose/quiet output modes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        promptSystem: { type: 'object' },
        progressIndicators: { type: 'object' },
        colorOutput: { type: 'object' },
        autocomplete: { type: 'object' },
        tableFormatting: { type: 'object' },
        outputModes: { type: 'object' }
      },
      required: ['promptSystem', 'progressIndicators', 'colorOutput']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'interactive', 'ux']
}));

export const cliDistributionSetupTask = defineTask('cli-distribution-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup CLI distribution',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'CLI distribution engineer',
      task: `Setup distribution for ${args.cliName}`,
      context: {
        languages: args.languages,
        architecture: args.architecture
      },
      instructions: [
        'Configure npm/PyPI/Homebrew distribution',
        'Create standalone binary builds (pkg, pyinstaller)',
        'Design auto-update mechanism',
        'Create installation scripts for different platforms',
        'Implement version checking and notifications',
        'Setup release automation (GitHub Actions)',
        'Create installation documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        packageManagers: { type: 'object' },
        binaryBuilds: { type: 'object' },
        autoUpdate: { type: 'object' },
        installationScripts: { type: 'object' },
        releaseAutomation: { type: 'object' },
        documentation: { type: 'object' }
      },
      required: ['packageManagers', 'installationScripts', 'releaseAutomation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'distribution', 'release']
}));

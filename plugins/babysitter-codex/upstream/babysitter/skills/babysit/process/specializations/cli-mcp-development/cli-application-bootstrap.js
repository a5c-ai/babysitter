/**
 * @process specializations/cli-mcp-development/cli-application-bootstrap
 * @description CLI Application Bootstrap - Create a new CLI application with project structure, argument parsing, and basic commands
 * using modern CLI frameworks like Commander.js, Click, or Cobra.
 * @inputs { projectName: string, language: string, framework?: string, packageManager?: string, features?: array }
 * @outputs { success: boolean, projectStructure: object, configFiles: array, initialCommands: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cli-application-bootstrap', {
 *   projectName: 'my-cli-tool',
 *   language: 'typescript',
 *   framework: 'commander',
 *   packageManager: 'npm',
 *   features: ['typescript', 'eslint', 'testing', 'ci']
 * });
 *
 * @references
 * - Commander.js: https://github.com/tj/commander.js
 * - Click: https://click.palletsprojects.com/
 * - Cobra: https://cobra.dev/
 * - CLI Guidelines: https://clig.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    framework = 'commander',
    packageManager = 'npm',
    features = ['typescript', 'eslint', 'testing'],
    description = '',
    author = '',
    license = 'MIT',
    outputDir = 'cli-application-bootstrap'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CLI Application Bootstrap: ${projectName}`);
  ctx.log('info', `Language: ${language}, Framework: ${framework}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND FRAMEWORK SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and validating framework selection');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    language,
    framework,
    features,
    description,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PROJECT STRUCTURE INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Initializing project structure');

  const projectStructure = await ctx.task(projectStructureTask, {
    projectName,
    language,
    framework,
    packageManager,
    features,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...projectStructure.artifacts);

  // ============================================================================
  // PHASE 3: PACKAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring package manifest and dependencies');

  const packageConfig = await ctx.task(packageConfigTask, {
    projectName,
    language,
    framework,
    packageManager,
    features,
    description,
    author,
    license,
    outputDir
  });

  artifacts.push(...packageConfig.artifacts);

  // ============================================================================
  // PHASE 4: BASE COMMAND IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing base command with version and help');

  const baseCommand = await ctx.task(baseCommandTask, {
    projectName,
    language,
    framework,
    projectStructure,
    outputDir
  });

  artifacts.push(...baseCommand.artifacts);

  // ============================================================================
  // PHASE 5: ARGUMENT PARSING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up argument parsing configuration');

  const argumentParsing = await ctx.task(argumentParsingTask, {
    projectName,
    language,
    framework,
    baseCommand,
    outputDir
  });

  artifacts.push(...argumentParsing.artifacts);

  // Quality Gate: Review CLI Structure
  await ctx.breakpoint({
    question: `Phase 5 Complete: CLI structure initialized with ${baseCommand.commands.length} initial commands. Proceed with tooling setup?`,
    title: 'CLI Structure Review',
    context: {
      runId: ctx.runId,
      projectName,
      language,
      framework,
      commands: baseCommand.commands,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: DEVELOPMENT TOOLING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up linting, formatting, and TypeScript config');

  const toolingSetup = await ctx.task(toolingSetupTask, {
    projectName,
    language,
    features,
    packageManager,
    outputDir
  });

  artifacts.push(...toolingSetup.artifacts);

  // ============================================================================
  // PHASE 7: TESTING INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up testing infrastructure');

  const testingSetup = await ctx.task(testingSetupTask, {
    projectName,
    language,
    framework,
    features,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating README and usage documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    language,
    framework,
    packageManager,
    description,
    baseCommand,
    argumentParsing,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `CLI Application Bootstrap complete for ${projectName}. Project ready for development. Review and approve?`,
    title: 'CLI Bootstrap Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        language,
        framework,
        packageManager,
        features,
        totalFiles: artifacts.length
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
        { path: packageConfig.manifestPath, format: 'json', label: 'Package Manifest' },
        { path: baseCommand.entryPointPath, format: language === 'typescript' ? 'typescript' : language, label: 'Entry Point' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    projectStructure: {
      directories: projectStructure.directories,
      files: projectStructure.files
    },
    configFiles: [
      packageConfig.manifestPath,
      ...toolingSetup.configFiles
    ],
    initialCommands: baseCommand.commands,
    entryPoint: baseCommand.entryPointPath,
    documentation: {
      readme: documentation.readmePath,
      usage: documentation.usagePath
    },
    testing: {
      framework: testingSetup.testFramework,
      configPath: testingSetup.configPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/cli-application-bootstrap',
      timestamp: startTime,
      language,
      framework,
      packageManager
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'Senior CLI Developer with expertise in command-line application architecture',
      task: 'Analyze requirements and validate CLI framework selection',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        features: args.features,
        description: args.description,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze project requirements for CLI application',
        '2. Validate framework selection based on language and features',
        '3. Identify required dependencies and tooling',
        '4. Assess cross-platform compatibility needs',
        '5. Evaluate feature requirements (TypeScript, testing, CI)',
        '6. Document recommended project structure',
        '7. Identify potential challenges and solutions',
        '8. Generate requirements analysis report'
      ],
      outputFormat: 'JSON with requirements analysis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['frameworkValidation', 'dependencies', 'artifacts'],
      properties: {
        frameworkValidation: {
          type: 'object',
          properties: {
            recommended: { type: 'boolean' },
            alternatives: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              purpose: { type: 'string' },
              dev: { type: 'boolean' }
            }
          }
        },
        projectStructure: { type: 'object' },
        challenges: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'bootstrap', 'requirements-analysis']
}));

export const projectStructureTask = defineTask('project-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Project Structure - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI Project Architect',
      task: 'Initialize project directory structure',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        packageManager: args.packageManager,
        features: args.features,
        requirementsAnalysis: args.requirementsAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create src directory for source code',
        '2. Create tests directory for test files',
        '3. Create docs directory for documentation',
        '4. Set up commands subdirectory for CLI commands',
        '5. Create utils directory for helper functions',
        '6. Set up config directory for configuration',
        '7. Create appropriate index/entry files',
        '8. Set up gitignore and editorconfig',
        '9. Generate project structure documentation'
      ],
      outputFormat: 'JSON with directory structure and file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['directories', 'files', 'artifacts'],
      properties: {
        directories: {
          type: 'array',
          items: { type: 'string' }
        },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        gitignore: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'bootstrap', 'project-structure']
}));

export const packageConfigTask = defineTask('package-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Package Configuration - ${args.projectName}`,
  agent: {
    name: 'cli-developer',
    prompt: {
      role: 'CLI Package Configuration Specialist',
      task: 'Configure package manifest and dependencies',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        packageManager: args.packageManager,
        features: args.features,
        description: args.description,
        author: args.author,
        license: args.license,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create package.json/setup.py/go.mod based on language',
        '2. Configure bin entry point for CLI executable',
        '3. Add production dependencies (CLI framework, etc.)',
        '4. Add development dependencies (TypeScript, linters, etc.)',
        '5. Configure scripts for build, test, lint',
        '6. Set up npm/pip/go configuration',
        '7. Configure module resolution',
        '8. Add engines/requires-python version constraints',
        '9. Generate package manifest file'
      ],
      outputFormat: 'JSON with package configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['manifestPath', 'dependencies', 'artifacts'],
      properties: {
        manifestPath: { type: 'string' },
        dependencies: {
          type: 'object',
          properties: {
            production: { type: 'object' },
            development: { type: 'object' }
          }
        },
        scripts: { type: 'object' },
        binConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'bootstrap', 'package-config']
}));

export const baseCommandTask = defineTask('base-command', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Base Command Implementation - ${args.projectName}`,
  agent: {
    name: 'cli-developer',
    prompt: {
      role: 'CLI Command Developer',
      task: 'Implement base command with version and help',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        projectStructure: args.projectStructure,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create main entry point file',
        '2. Initialize CLI framework (Commander/Click/Cobra)',
        '3. Configure program name and description',
        '4. Add version command/flag',
        '5. Configure help generation',
        '6. Add initial subcommand structure',
        '7. Set up error handling for CLI',
        '8. Configure exit codes',
        '9. Generate entry point and command files'
      ],
      outputFormat: 'JSON with command implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['entryPointPath', 'commands', 'artifacts'],
      properties: {
        entryPointPath: { type: 'string' },
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        programConfig: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' }
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
  labels: ['cli', 'bootstrap', 'commands']
}));

export const argumentParsingTask = defineTask('argument-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Argument Parsing Setup - ${args.projectName}`,
  agent: {
    name: 'cli-developer',
    prompt: {
      role: 'CLI Argument Parsing Specialist',
      task: 'Set up comprehensive argument parsing configuration',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        baseCommand: args.baseCommand,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure global options (verbose, quiet, config)',
        '2. Set up positional argument handling',
        '3. Configure optional flags with defaults',
        '4. Add environment variable fallbacks',
        '5. Implement argument validation',
        '6. Set up help text generation',
        '7. Configure shell completion basics',
        '8. Generate argument parsing configuration'
      ],
      outputFormat: 'JSON with argument parsing setup'
    },
    outputSchema: {
      type: 'object',
      required: ['globalOptions', 'argumentConfig', 'artifacts'],
      properties: {
        globalOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              short: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              default: { type: 'string' }
            }
          }
        },
        argumentConfig: { type: 'object' },
        validationRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'bootstrap', 'argument-parsing']
}));

export const toolingSetupTask = defineTask('tooling-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Development Tooling - ${args.projectName}`,
  agent: {
    name: 'cli-developer',
    prompt: {
      role: 'CLI Development Tooling Specialist',
      task: 'Set up linting, formatting, and build tools',
      context: {
        projectName: args.projectName,
        language: args.language,
        features: args.features,
        packageManager: args.packageManager,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure TypeScript/type checking if applicable',
        '2. Set up ESLint/Pylint/golint configuration',
        '3. Configure Prettier/Black formatting',
        '4. Set up pre-commit hooks with husky/pre-commit',
        '5. Configure build scripts',
        '6. Set up watch mode for development',
        '7. Configure sourcemaps if applicable',
        '8. Generate all configuration files'
      ],
      outputFormat: 'JSON with tooling configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configFiles', 'artifacts'],
      properties: {
        configFiles: {
          type: 'array',
          items: { type: 'string' }
        },
        lintConfig: { type: 'object' },
        formatConfig: { type: 'object' },
        buildConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'bootstrap', 'tooling']
}));

export const testingSetupTask = defineTask('testing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Testing Infrastructure - ${args.projectName}`,
  agent: {
    name: 'cli-developer',
    prompt: {
      role: 'CLI Testing Specialist',
      task: 'Set up testing infrastructure for CLI application',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select and configure test framework (Jest/pytest/go test)',
        '2. Set up test directory structure',
        '3. Create initial test file for base command',
        '4. Configure test coverage collection',
        '5. Set up CLI-specific test utilities',
        '6. Configure test scripts in package manifest',
        '7. Add snapshot testing for output',
        '8. Generate test configuration and initial tests'
      ],
      outputFormat: 'JSON with testing setup'
    },
    outputSchema: {
      type: 'object',
      required: ['testFramework', 'configPath', 'artifacts'],
      properties: {
        testFramework: { type: 'string' },
        configPath: { type: 'string' },
        testFiles: {
          type: 'array',
          items: { type: 'string' }
        },
        coverageConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'bootstrap', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'CLI Documentation Specialist',
      task: 'Generate README and usage documentation',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        packageManager: args.packageManager,
        description: args.description,
        baseCommand: args.baseCommand,
        argumentParsing: args.argumentParsing,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive README.md',
        '2. Document installation instructions',
        '3. Add usage examples for commands',
        '4. Document available options and flags',
        '5. Add development setup instructions',
        '6. Document testing procedures',
        '7. Add contribution guidelines section',
        '8. Create changelog template',
        '9. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        usagePath: { type: 'string' },
        changelogPath: { type: 'string' },
        sections: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'bootstrap', 'documentation']
}));

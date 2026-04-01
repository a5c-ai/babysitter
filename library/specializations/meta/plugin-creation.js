/**
 * @process meta/plugin-creation
 * @description Create a new babysitter plugin package with install/uninstall/configure instructions, optional process files, migrations, and marketplace entry
 * @inputs { pluginName: string, description: string, scope?: string, outputDir?: string, components?: object, marketplace?: object }
 * @outputs { success: boolean, pluginDir: string, components: array, marketplaceEntry: object, artifacts: array }
 * @skill plugin-structure specializations/cli-mcp-development/skills/plugin-loader-generator/SKILL.md
 * @agent process-architect specializations/meta/agents/process-architect/AGENT.md
 * @agent quality-assessor specializations/meta/agents/quality-assessor/AGENT.md
 * @agent technical-writer specializations/meta/agents/technical-writer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Plugin Creation Process
 *
 * Creates a complete babysitter plugin package following the plugin-author-guide.
 * A babysitter plugin is a version-managed package of contextual instructions
 * (install.md, uninstall.md, configure.md) plus optional process files and migrations.
 *
 * Phases:
 * 1. Requirements Analysis — understand plugin purpose, components, target audience
 * 2. Structure Design — plan directory layout, components, marketplace metadata
 * 3. Instruction Authoring — write install.md, uninstall.md, configure.md
 * 4. Process Files (optional) — create install-process.js, configure-process.js
 * 5. Validation — verify package structure and instruction quality
 * 6. Marketplace Integration — generate marketplace.json entry
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.pluginName - Plugin name (kebab-case)
 * @param {string} inputs.description - High-level description of what the plugin does
 * @param {string} inputs.scope - Target scope: "global", "project", or "both" (default: "project")
 * @param {string} inputs.outputDir - Output directory for the plugin package (default: current dir)
 * @param {Object} inputs.components - Which components to include
 * @param {boolean} inputs.components.installProcess - Include install-process.js (default: false)
 * @param {boolean} inputs.components.configureProcess - Include configure-process.js (default: false)
 * @param {boolean} inputs.components.uninstallProcess - Include uninstall-process.js (default: false)
 * @param {boolean} inputs.components.migrations - Include initial migration structure (default: false)
 * @param {boolean} inputs.components.processFiles - Include process/ directory with main.js (default: false)
 * @param {Object} inputs.marketplace - Marketplace configuration
 * @param {string} inputs.marketplace.name - Marketplace name to target
 * @param {string} inputs.marketplace.author - Plugin author name
 * @param {Array<string>} inputs.marketplace.tags - Tags for discovery
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with plugin package artifacts
 */
export async function process(inputs, ctx) {
  const {
    pluginName,
    description,
    scope = 'project',
    outputDir = '.',
    components = {},
    marketplace = {},
    referencePlugin = null,
    additionalRequirements = ''
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const pluginDir = `${outputDir}/${pluginName}`;

  ctx.log('info', `Creating plugin package: ${pluginName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing plugin requirements');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    pluginName,
    description,
    scope,
    components,
    marketplace,
    referencePlugin,
    additionalRequirements
  });

  artifacts.push(...(requirements.artifacts || []));

  // ============================================================================
  // PHASE 2: STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing plugin structure');

  let structure = await ctx.task(structureDesignTask, {
    pluginName,
    requirements: requirements.analysis,
    components,
    scope,
    pluginDir
  });

  artifacts.push(...(structure.artifacts || []));

    let lastFeedback_phase2Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase2Review) {
      structure = await ctx.task(structureDesignTask, { ...{
    pluginName,
    requirements: requirements.analysis,
    components,
    scope,
    pluginDir
  }, feedback: lastFeedback_phase2Review, attempt: attempt + 1 });
    }
  const phase2Review = await ctx.breakpoint({
    question: `Plugin structure designed for "${pluginName}" with ${structure.fileCount} files. Review the planned structure before creating files?`,
    title: 'Plugin Structure Review',
    context: {
      runId: ctx.runId,
      files: (structure.artifacts || []).map(a => ({
        path: a.path,
        format: a.format || 'json',
        label: a.label
      })),
      summary: {
        pluginName,
        fileCount: structure.fileCount,
        directories: structure.directories,
        hasInstallProcess: !!components.installProcess,
        hasMigrations: !!components.migrations
      }
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase2Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase2Review.approved) break;
    lastFeedback_phase2Review = phase2Review.response || phase2Review.feedback || 'Changes requested';
  }
  // ============================================================================
  // PHASE 3: INSTRUCTION AUTHORING
  // ============================================================================

  ctx.log('info', 'Phase 3: Writing plugin instructions');

  // 3a: Write install.md
  const installInstructions = await ctx.task(writeInstallInstructionsTask, {
    pluginName,
    description,
    scope,
    requirements: requirements.analysis,
    structure: structure.design,
    pluginDir,
    hasInstallProcess: !!components.installProcess
  });

  artifacts.push(...(installInstructions.artifacts || []));

  // 3b: Write uninstall.md
  const uninstallInstructions = await ctx.task(writeUninstallInstructionsTask, {
    pluginName,
    scope,
    requirements: requirements.analysis,
    structure: structure.design,
    installSteps: installInstructions.steps,
    pluginDir
  });

  artifacts.push(...(uninstallInstructions.artifacts || []));

  // 3c: Write configure.md
  const configureInstructions = await ctx.task(writeConfigureInstructionsTask, {
    pluginName,
    scope,
    requirements: requirements.analysis,
    structure: structure.design,
    pluginDir,
    hasConfigureProcess: !!components.configureProcess
  });

  artifacts.push(...(configureInstructions.artifacts || []));

  // ============================================================================
  // PHASE 4: PROCESS FILES (optional)
  // ============================================================================

  const processResults = {};

  if (components.installProcess) {
    ctx.log('info', 'Phase 4a: Creating install-process.js');

    processResults.install = await ctx.task(writeInstallProcessTask, {
      pluginName,
      requirements: requirements.analysis,
      installSteps: installInstructions.steps,
      pluginDir
    });

    artifacts.push(...(processResults.install.artifacts || []));
  }

  if (components.configureProcess) {
    ctx.log('info', 'Phase 4b: Creating configure-process.js');

    processResults.configure = await ctx.task(writeConfigureProcessTask, {
      pluginName,
      requirements: requirements.analysis,
      configureOptions: configureInstructions.options,
      pluginDir
    });

    artifacts.push(...(processResults.configure.artifacts || []));
  }

  if (components.processFiles) {
    ctx.log('info', 'Phase 4c: Creating process/main.js');

    processResults.main = await ctx.task(writeMainProcessTask, {
      pluginName,
      description,
      requirements: requirements.analysis,
      pluginDir
    });

    artifacts.push(...(processResults.main.artifacts || []));
  }
  // ============================================================================
  // PHASE 5: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Validating plugin package');

  let validation = await ctx.task(validatePluginPackageTask, {
    pluginName,
    pluginDir,
    requirements: requirements.analysis,
    structure: structure.design,
    components,
    hasInstallMd: true,
    hasUninstallMd: true,
    hasConfigureMd: true,
    hasInstallProcess: !!components.installProcess,
    hasConfigureProcess: !!components.configureProcess,
    hasProcessFiles: !!components.processFiles
  });

  artifacts.push(...(validation.artifacts || []));

  if (!validation.valid) {
      let lastFeedback_phase5Review = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_phase5Review) {
        validation = await ctx.task(validatePluginPackageTask, { ...{
    pluginName,
    pluginDir,
    requirements: requirements.analysis,
    structure: structure.design,
    components,
    hasInstallMd: true,
    hasUninstallMd: true,
    hasConfigureMd: true,
    hasInstallProcess: !!components.installProcess,
    hasConfigureProcess: !!components.configureProcess,
    hasProcessFiles: !!components.processFiles
  }, feedback: lastFeedback_phase5Review, attempt: attempt + 1 });
      }
  const phase5Review = await ctx.breakpoint({
      question: `Plugin validation found ${(validation.issues || []).length} issues. Review and decide: fix issues or proceed anyway?`,
      title: 'Plugin Validation Issues',
      context: {
        runId: ctx.runId,
        files: (validation.artifacts || []).map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          label: a.label
        }))
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_phase5Review || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (phase5Review.approved) break;
      lastFeedback_phase5Review = phase5Review.response || phase5Review.feedback || 'Changes requested';
    } }

  // ============================================================================
  // PHASE 6: MARKETPLACE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating marketplace entry');

  const marketplaceEntry = await ctx.task(generateMarketplaceEntryTask, {
    pluginName,
    description,
    marketplace,
    structure: structure.design,
    components,
    pluginDir
  });

  artifacts.push(...(marketplaceEntry.artifacts || []));

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.valid,
    pluginName,
    pluginDir,
    components: Object.keys(components).filter(k => components[k]),
    fileCount: structure.fileCount,
    marketplaceEntry: marketplaceEntry.entry,
    validation: validation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'meta/plugin-creation',
      timestamp: startTime
    }
  };
}
  // ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('plugin-requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze plugin requirements',
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Plugin requirements analyst',
      task: 'Analyze plugin requirements and define what the plugin needs to do',
      context: args,
      instructions: [
        'Analyze the plugin description and purpose',
        'Identify what the plugin installs, configures, and manages',
        'Define prerequisites (tools, env vars, permissions)',
        'Identify configuration options and defaults',
        'Determine what files/directories the plugin creates',
        'Identify any hooks, skills, or agents the plugin provides',
        'Note any external service dependencies',
        'If a reference plugin is provided, analyze its patterns',
        'Define what uninstallation needs to reverse',
        'Determine migration patterns for future versions'
      ],
      outputFormat: 'JSON with analysis object containing purpose, prerequisites, configOptions, fileStructure, hooks, dependencies, and artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            prerequisites: { type: 'array', items: { type: 'string' } },
            configOptions: { type: 'array', items: { type: 'object' } },
            fileStructure: { type: 'object' },
            hooks: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'array', items: { type: 'string' } },
            uninstallSteps: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'meta', 'plugin', 'requirements']
}));

// Task 2: Structure Design
export const structureDesignTask = defineTask('plugin-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design plugin directory structure',
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Plugin structure designer',
      task: 'Design the complete plugin package directory structure',
      context: args,
      instructions: [
        'Design the plugin package directory layout following the babysitter plugin-author-guide:',
        'Required files:',
        '  - install.md: Agent-readable installation instructions',
        '  - uninstall.md: Agent-readable removal instructions',
        '  - configure.md: Agent-readable configuration instructions',
        'Optional files based on components:',
        '  - install-process.js: Automated install babysitter process',
        '  - uninstall-process.js: Automated uninstall process',
        '  - configure-process.js: Automated configure process',
        '  - migrations/: Version migration files (format: <from>_to_<to>.md or .js)',
        '  - process/: Process definition files',
        '  - process/main.js: Main process entry point',
        'Plan the complete directory tree',
        'Identify total file count and directory count',
        'Note any additional files needed (README, examples, etc.)',
        `Output directory: ${args.pluginDir}`
      ],
      outputFormat: 'JSON with design (directory tree object), fileCount (number), directories (array of paths), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'fileCount', 'artifacts'],
      properties: {
        design: { type: 'object' },
        fileCount: { type: 'number' },
        directories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'design']
}));

// Task 3a: Write install.md
export const writeInstallInstructionsTask = defineTask('write-install-instructions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write install.md instructions',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Plugin instruction author',
      task: 'Write the install.md file for the babysitter plugin package',
      context: args,
      instructions: [
        'Write clear, numbered installation instructions in markdown',
        'Target audience: an AI agent that will read and execute these steps',
        'Be explicit about file paths, config keys, and expected values',
        'Use placeholders like <project-root> or <home-dir> for environment-specific paths',
        'Include prerequisites section (tools, env vars, permissions)',
        'Each step should have a bash command or clear action',
        'If install-process.js exists, reference it for automated steps',
        'Include verification steps to confirm installation succeeded',
        'Write the actual markdown content for the file',
        `Save to: ${args.pluginDir}/install.md`
      ],
      outputFormat: 'JSON with content (markdown string), steps (array of step descriptions), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'steps', 'artifacts'],
      properties: {
        content: { type: 'string' },
        steps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'instructions']
}));

// Task 3b: Write uninstall.md
export const writeUninstallInstructionsTask = defineTask('write-uninstall-instructions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write uninstall.md instructions',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Plugin instruction author',
      task: 'Write the uninstall.md file that reverses the installation steps',
      context: args,
      instructions: [
        'Write clear, numbered uninstallation instructions in markdown',
        'Reverse each step from the installation in proper order',
        'Remove files, directories, config entries, env vars',
        'Remove any hooks, skills, or agents installed by the plugin',
        'Include cleanup verification steps',
        'Be explicit about what to remove and where',
        `Save to: ${args.pluginDir}/uninstall.md`
      ],
      outputFormat: 'JSON with content (markdown string), steps (array), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'steps', 'artifacts'],
      properties: {
        content: { type: 'string' },
        steps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'instructions']
}));

// Task 3c: Write configure.md
export const writeConfigureInstructionsTask = defineTask('write-configure-instructions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write configure.md instructions',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Plugin instruction author',
      task: 'Write the configure.md file with available settings and configuration steps',
      context: args,
      instructions: [
        'Write clear configuration instructions in markdown',
        'Include a table of available settings with defaults and descriptions',
        'Show how to change each setting with concrete examples',
        'Include validation steps for the configuration',
        'If configure-process.js exists, reference it for automation',
        `Save to: ${args.pluginDir}/configure.md`
      ],
      outputFormat: 'JSON with content (markdown string), options (array of setting objects), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'options', 'artifacts'],
      properties: {
        content: { type: 'string' },
        options: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'instructions']
}));

// Task 4a: Write install-process.js
export const writeInstallProcessTask = defineTask('write-install-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write install-process.js',
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process generator for plugin install automation',
      task: 'Create install-process.js - a babysitter process file that automates the plugin installation',
      context: args,
      instructions: [
        'Generate a babysitter process file following SDK patterns:',
        '1. JSDoc header with @process, @description, @inputs, @outputs',
        '2. import { defineTask } from "@a5c-ai/babysitter-sdk"',
        '3. export async function process(inputs, ctx)',
        '4. Define tasks for each installation step that needs automation',
        '5. Include validation tasks to verify installation',
        'The process should automate steps that go beyond simple file operations:',
        '  - Validating external service connectivity',
        '  - Running database migrations',
        '  - Generating configuration from templates',
        '  - Health checks',
        `Save to: ${args.pluginDir}/install-process.js`
      ],
      outputFormat: 'JSON with processFile (path), code (content), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processFile', 'artifacts'],
      properties: {
        processFile: { type: 'string' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'process']
}));

// Task 4b: Write configure-process.js
export const writeConfigureProcessTask = defineTask('write-configure-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write configure-process.js',
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process generator for plugin configuration automation',
      task: 'Create configure-process.js - a babysitter process file that automates plugin configuration',
      context: args,
      instructions: [
        'Generate a babysitter process file for configuration:',
        '1. JSDoc header with @process, @description, @inputs, @outputs',
        '2. import { defineTask } from "@a5c-ai/babysitter-sdk"',
        '3. export async function process(inputs, ctx)',
        '4. Tasks for reading current config, presenting options, validating, writing new config',
        `Save to: ${args.pluginDir}/configure-process.js`
      ],
      outputFormat: 'JSON with processFile (path), code (content), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processFile', 'artifacts'],
      properties: {
        processFile: { type: 'string' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'process']
}));

// Task 4c: Write process/main.js
export const writeMainProcessTask = defineTask('write-main-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write process/main.js',
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process generator for plugin main process',
      task: 'Create process/main.js - the main babysitter process that the plugin provides',
      context: args,
      instructions: [
        'Generate the main process file that this plugin contributes to the babysitter ecosystem:',
        '1. JSDoc header with @process, @description, @inputs, @outputs',
        '2. import { defineTask } from "@a5c-ai/babysitter-sdk"',
        '3. export async function process(inputs, ctx)',
        '4. Define tasks that implement the plugin core functionality',
        '5. Include quality gates and breakpoints as appropriate',
        `Save to: ${args.pluginDir}/process/main.js`
      ],
      outputFormat: 'JSON with processFile (path), code (content), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processFile', 'artifacts'],
      properties: {
        processFile: { type: 'string' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'process']
}));

// Task 5: Validate Plugin Package
export const validatePluginPackageTask = defineTask('validate-plugin-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate plugin package structure and content',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Plugin package validation specialist',
      task: 'Validate the generated plugin package for completeness and correctness',
      context: args,
      instructions: [
        'Validate the plugin package structure:',
        '1. Check install.md exists and has numbered steps with bash commands',
        '2. Check uninstall.md exists and reverses install steps',
        '3. Check configure.md exists with settings table and examples',
        '4. If install-process.js expected, verify it has proper JSDoc and exports',
        '5. If configure-process.js expected, verify it has proper structure',
        '6. If process/main.js expected, verify it has proper structure',
        '7. Check all markdown files reference correct paths',
        '8. Verify no hardcoded absolute paths (should use placeholders)',
        '9. Check for common issues: missing prerequisites, incomplete uninstall',
        '10. Verify instructions are clear enough for an AI agent to follow',
        'Generate a validation report with issues and recommendations'
      ],
      outputFormat: 'JSON with valid (boolean), results (object with per-file checks), issues (array of strings), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'results', 'artifacts'],
      properties: {
        valid: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            hasInstallMd: { type: 'boolean' },
            hasUninstallMd: { type: 'boolean' },
            hasConfigureMd: { type: 'boolean' },
            installStepCount: { type: 'number' },
            uninstallStepCount: { type: 'number' },
            configOptionCount: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'validation']
}));

// Task 6: Generate Marketplace Entry
export const generateMarketplaceEntryTask = defineTask('generate-marketplace-entry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate marketplace.json entry',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Marketplace metadata generator',
      task: 'Generate the marketplace.json entry for this plugin',
      context: args,
      instructions: [
        'Generate a marketplace.json entry following the babysitter format:',
        '{',
        '  "name": "<plugin-name>",',
        '  "description": "<brief description>",',
        '  "latestVersion": "1.0.0",',
        '  "versions": ["1.0.0"],',
        '  "packagePath": "plugins/<plugin-name>",',
        '  "tags": [<relevant tags>],',
        '  "author": "<author>"',
        '}',
        'Also write a snippet showing how to add this to an existing marketplace.json',
        `Save the entry JSON to: ${args.pluginDir}/marketplace-entry.json`
      ],
      outputFormat: 'JSON with entry (marketplace entry object), snippet (string showing integration), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['entry', 'artifacts'],
      properties: {
        entry: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            latestVersion: { type: 'string' },
            versions: { type: 'array', items: { type: 'string' } },
            packagePath: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            author: { type: 'string' }
          }
        },
        snippet: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'plugin', 'marketplace']
}));

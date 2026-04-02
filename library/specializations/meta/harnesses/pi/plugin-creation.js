/**
 * @process meta/harnesses/pi/plugin-creation
 * @description Create and distribute a Pi coding agent plugin (extension) with package.json omp field,
 *   activate() entry point, registerTool/registerCommand/on() events, SKILL.md files, commands/*.md
 *   with YAML frontmatter, and npm distribution as @scope/package
 * @inputs { pluginName: string, description: string, scope?: string, author?: string, components?: object, npmScope?: string, outputDir?: string }
 * @outputs { success: boolean, pluginDir: string, packageJson: object, components: array, npmPackage: string }
 * @agent process-architect specializations/meta/agents/process-architect/AGENT.md
 * @agent quality-assessor specializations/meta/agents/quality-assessor/AGENT.md
 * @agent technical-writer specializations/meta/agents/technical-writer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const requirementsAnalysisTask = defineTask('pi-plugin-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Pi plugin requirements and target audience',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pi extension architect specializing in the Pi coding agent plugin ecosystem',
      task: `Analyze requirements for a new Pi coding agent plugin called "${args.pluginName}".

Pi plugins are npm packages that extend the Pi coding agent via the ExtensionAPI interface.
The plugin system uses:
- package.json with an "omp" field declaring extensions/ and skills/ directories
- An activate(pi: ExtensionAPI) entry point in extensions/<name>/index.ts
- ExtensionAPI provides: registerTool(), registerCommand(), on() for 10 lifecycle events
  (onAgentStart, onAgentEnd, onToolCall, onToolResult, onMessage, onError, onAbort,
   onSessionStart, onSessionEnd, onStatusChange)
- setWidget(), setStatus(), appendEntry(), sendMessage(), sendUserMessage() for TUI
- SKILL.md files for skill definitions
- commands/*.md files with YAML frontmatter (name, description, args) for slash commands
- Peer dependency on @mariozechner/pi-coding-agent

Analyze the following and produce a comprehensive requirements document:
1. What tools should this plugin register? (registerTool with name, description, parameters, execute)
2. What commands should it expose? (registerCommand or commands/*.md)
3. Which lifecycle events should it hook into? (on('onAgentStart'), on('onToolCall'), etc.)
4. Should it include TUI widgets? (setWidget, setStatus, appendEntry)
5. Should it include skills? (SKILL.md files in skills/ directory)
6. What is the target audience and use case?
7. What npm scope should be used for distribution?

Plugin description: ${args.description}
Additional requirements: ${args.additionalRequirements || 'None specified'}`,
      context: {
        pluginName: args.pluginName,
        description: args.description,
        components: args.components,
        npmScope: args.npmScope,
        referencePlugin: 'plugins/babysitter-pi/ (reference implementation)'
      },
      instructions: [
        'Analyze the plugin purpose against Pi ExtensionAPI capabilities',
        'Determine which tools, commands, events, widgets, and skills are needed',
        'Consider the npm distribution model (@scope/package-name)',
        'Identify peer dependencies beyond @mariozechner/pi-coding-agent',
        'Produce a structured requirements document'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'components'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            targetAudience: { type: 'string' },
            tools: { type: 'array', items: { type: 'object' } },
            commands: { type: 'array', items: { type: 'object' } },
            events: { type: 'array', items: { type: 'string' } },
            widgets: { type: 'array', items: { type: 'object' } },
            skills: { type: 'array', items: { type: 'object' } },
            peerDependencies: { type: 'object' }
          }
        },
        components: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const scaffoldPluginTask = defineTask('pi-plugin-scaffold', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold Pi plugin directory structure and package.json',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pi plugin scaffolding engineer',
      task: `Create the complete directory structure and package.json for Pi plugin "${args.pluginName}" at ${args.pluginDir}.

Required directory layout:
${args.pluginDir}/
  package.json          # With "omp" field: { extensions: "extensions", skills: "skills" }
  extensions/
    ${args.pluginName}/
      index.ts          # activate(pi: ExtensionAPI) entry point
      types.ts          # TypeScript type definitions
      constants.ts      # Configuration constants, timeouts, env vars
  skills/
    <skill-name>/
      SKILL.md          # Per-skill definition (one per skill)
  commands/
    <command-name>.md   # Slash commands with YAML frontmatter
  test/
    index.test.ts       # Extension tests
  README.md             # Plugin documentation
  .gitignore

The package.json must include:
{
  "name": "${args.npmScope}/${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.description}",
  "omp": {
    "extensions": "extensions",
    "skills": "skills"
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": ">=0.1.0"
  },
  "main": "extensions/${args.pluginName}/index.ts",
  "files": ["extensions/", "skills/", "commands/", "README.md"]
}

Create all directories and the package.json file. Do NOT create implementation files yet.`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        npmScope: args.npmScope,
        requirements: args.requirements
      },
      instructions: [
        'Create the full directory tree following Pi plugin conventions',
        'Write package.json with the omp field for extensions and skills',
        'Include peer dependency on @mariozechner/pi-coding-agent',
        'Create placeholder directories for all component types',
        'Do NOT write implementation code yet'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['pluginDir', 'packageJson', 'directories'],
      properties: {
        pluginDir: { type: 'string' },
        packageJson: { type: 'object' },
        directories: { type: 'array', items: { type: 'string' } },
        fileCount: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const implementComponentsTask = defineTask('pi-plugin-implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Pi plugin components (tools, commands, events, skills)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pi extension developer implementing plugin components',
      task: `Implement all components for Pi plugin "${args.pluginName}" at ${args.pluginDir}.

Based on the requirements analysis, implement:

### 1. Extension Entry Point (extensions/${args.pluginName}/index.ts)
Write the activate(pi: ExtensionAPI) function that:
- Registers all tools via pi.registerTool({ name, description, parameters, execute })
- Registers commands via pi.registerCommand({ name, description, execute })
- Hooks lifecycle events via pi.on('onAgentStart', handler), pi.on('onToolCall', handler), etc.
- Sets up TUI widgets via pi.setWidget(key, content) if applicable
- Returns a deactivate() cleanup function

### 2. Type Definitions (extensions/${args.pluginName}/types.ts)
Define TypeScript interfaces for:
- Tool parameters and return types
- Command argument types
- Event payload types
- Widget state types
- Configuration options

### 3. Constants (extensions/${args.pluginName}/constants.ts)
Define:
- Tool and command name constants
- Default configuration values
- Timeout values
- Environment variable names (PI_PLUGIN_<NAME>_*)

### 4. Skills (skills/<name>/SKILL.md)
For each skill, create a SKILL.md following the babysitter skill format:
- Skill name, description, trigger conditions
- Dependencies and prerequisites
- Step-by-step instructions
- Expected outputs

### 5. Commands (commands/<name>.md)
For each command, create a markdown file with YAML frontmatter:
---
name: <command-name>
description: <what it does>
args:
  - name: <arg-name>
    description: <arg description>
    required: true|false
---
<Command instructions body>

Requirements: ${JSON.stringify(args.requirements)}`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        requirements: args.requirements,
        structure: args.structure
      },
      instructions: [
        'Implement the activate() function with all registrations',
        'Create TypeScript types for all tool/command/event interfaces',
        'Write SKILL.md files for each skill in skills/ directory',
        'Write command .md files with YAML frontmatter in commands/',
        'Ensure all lifecycle event handlers are properly typed',
        'Include error handling and cleanup in deactivate()'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'tools', 'commands', 'events'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'object' } },
        commands: { type: 'array', items: { type: 'object' } },
        events: { type: 'array', items: { type: 'string' } },
        skills: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const testAndValidateTask = defineTask('pi-plugin-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate Pi plugin structure and components',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pi plugin QA engineer and validator',
      task: `Validate the Pi plugin "${args.pluginName}" at ${args.pluginDir}.

Perform the following validation checks:

### Manifest Validation
1. Verify package.json has valid "omp" field with extensions and skills paths
2. Verify "name" follows @scope/package-name convention
3. Verify peer dependency on @mariozechner/pi-coding-agent exists
4. Verify "main" points to a valid extensions/*/index.ts file
5. Verify "files" array includes extensions/, skills/, commands/

### Structure Validation
6. Verify extensions/<name>/index.ts exports an activate function
7. Verify extensions/<name>/index.ts activate accepts ExtensionAPI parameter
8. Verify each skill has a valid SKILL.md in skills/<name>/
9. Verify each command .md has valid YAML frontmatter (name, description)
10. Verify types.ts exists with proper interface definitions

### Component Validation
11. Verify all registerTool calls have name, description, parameters, execute
12. Verify all registerCommand calls have name, description, execute
13. Verify on() event handlers reference valid ExtensionAPI events
14. Verify widget keys are unique strings
15. Verify deactivate cleanup function is returned

### Test Execution
16. Run TypeScript type checking (tsc --noEmit) if tsconfig exists
17. Run any existing test files
18. Verify no circular imports between extension modules

Report all findings with severity (error/warning/info) and fix suggestions.`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        requirements: args.requirements,
        structure: args.structure
      },
      instructions: [
        'Read and validate package.json omp field',
        'Check directory structure matches Pi plugin conventions',
        'Verify activate() function signature and registrations',
        'Validate SKILL.md and command .md formats',
        'Run type checking if possible',
        'Report issues with severity and fix suggestions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'checks'],
      properties: {
        valid: { type: 'boolean' },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              severity: { type: 'string', enum: ['error', 'warning', 'info'] },
              message: { type: 'string' },
              fix: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const distributionSetupTask = defineTask('pi-plugin-distribute', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up npm distribution for Pi plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'npm package distribution engineer for Pi plugins',
      task: `Set up npm distribution for Pi plugin "${args.pluginName}" at ${args.pluginDir}.

Pi plugins are distributed as npm packages and installed into Pi's plugin directory.

### npm Package Setup
1. Verify/update package.json with:
   - "name": "${args.npmScope}/${args.pluginName}"
   - "version": "1.0.0"
   - "license": "MIT" (or as specified)
   - "repository", "homepage", "bugs" fields
   - "keywords": ["pi-coding-agent", "pi-plugin", "pi-extension", ...]
   - "files": whitelist of published files
   - "engines": { "node": ">=18" }

2. Create .npmignore with:
   - test/, __tests__/, *.test.ts
   - .git/, .github/
   - tsconfig.json (if not needed at runtime)
   - Development-only files

3. Create a publish script or CI workflow:
   - npm publish --access public
   - Version bump workflow
   - Pre-publish validation (npm pack --dry-run)

### Installation Instructions
4. Document the install command for end users:
   - npm install ${args.npmScope}/${args.pluginName}
   - Or: pi plugin install ${args.npmScope}/${args.pluginName}
   - Plugin gets installed to the Pi plugins directory
   - Pi auto-discovers extensions via the omp.extensions field

### Marketplace Registration (optional)
5. If targeting a babysitter marketplace:
   - Generate marketplace entry JSON
   - Include packagePath, tags, author, version info
   - Register via: babysitter plugin:update-registry

### Versioning Strategy
6. Set up semantic versioning:
   - versions.json tracking sdkVersion compatibility
   - CHANGELOG.md with initial release entry
   - Git tags for releases (v1.0.0)`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        npmScope: args.npmScope,
        requirements: args.requirements
      },
      instructions: [
        'Configure package.json for npm publishing',
        'Create .npmignore for clean publishing',
        'Write installation instructions for Pi users',
        'Set up versioning with versions.json and CHANGELOG.md',
        'Document the publish workflow',
        'Create marketplace entry if applicable'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['npmPackage', 'publishReady'],
      properties: {
        npmPackage: { type: 'string' },
        publishReady: { type: 'boolean' },
        installCommand: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const documentationTask = defineTask('pi-plugin-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive Pi plugin documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer specializing in Pi coding agent plugin documentation',
      task: `Create comprehensive documentation for Pi plugin "${args.pluginName}" at ${args.pluginDir}.

### README.md
Write a complete README including:
1. Plugin name, description, and badges (npm version, license)
2. Features list with descriptions
3. Requirements (Pi coding agent version, Node.js version)
4. Installation: npm install ${args.npmScope}/${args.pluginName}
5. Configuration: environment variables, settings
6. Usage examples for each tool, command, and skill
7. API reference: tools registered, commands available, events handled
8. Troubleshooting common issues
9. Contributing guidelines
10. License

### Usage Examples
For each registered tool:
- Show the tool invocation syntax
- Provide example input/output
- Document parameters and return types

For each command:
- Show the slash command usage
- Document arguments and options
- Provide example sessions

For each skill:
- Describe when and how it triggers
- Show expected workflow

### CHANGELOG.md
Create initial changelog:
## [1.0.0] - ${new Date().toISOString().split('T')[0]}
### Added
- Initial release
- <list all features>

Components: ${JSON.stringify(args.components)}`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        npmScope: args.npmScope,
        requirements: args.requirements,
        components: args.components
      },
      instructions: [
        'Write README.md with all standard sections',
        'Include usage examples for every tool and command',
        'Create CHANGELOG.md with initial release entry',
        'Document all environment variables and configuration',
        'Include troubleshooting section',
        'Use clear markdown formatting with code blocks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

/**
 * Pi Plugin Creation Process
 *
 * Creates a complete Pi coding agent plugin package with extensions, skills,
 * commands, and npm distribution setup. Pi plugins use the ExtensionAPI interface
 * with registerTool/registerCommand/on() for lifecycle events.
 *
 * Phases:
 * 1. Requirements Analysis - understand plugin purpose and Pi API usage
 * 2. Scaffold Plugin Structure - create directory layout and package.json with omp field
 * 3. Implement Components - create activate() entry, tools, commands, skills, events
 * 4. Testing & Validation - validate manifest, structure, component registration
 * 5. Distribution Setup - prepare npm package for publishing
 * 6. Documentation - create README, usage examples, changelog
 */
export async function process(inputs, ctx) {
  const {
    pluginName,
    description,
    scope = 'project',
    author = 'unknown',
    components = {},
    npmScope = '@pi-plugins',
    outputDir = '.',
    additionalRequirements = ''
  } = inputs;

  const pluginDir = `${outputDir}/${pluginName}`;
  const artifacts = [];

  ctx.log('info', `Creating Pi plugin: ${pluginName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Pi plugin requirements');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    pluginName,
    description,
    components,
    npmScope,
    additionalRequirements
  });

  artifacts.push(...(requirements.artifacts || []));

  // ============================================================================
  // PHASE 2: SCAFFOLD PLUGIN STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Scaffolding Pi plugin structure');

  let scaffold = await ctx.task(scaffoldPluginTask, {
    pluginName,
    pluginDir,
    description,
    npmScope,
    requirements: requirements.analysis
  });

  artifacts.push(...(scaffold.artifacts || []));

  let lastFeedback_structureReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_structureReview) {
      scaffold = await ctx.task(scaffoldPluginTask, {
        pluginName, pluginDir, description, npmScope,
        requirements: requirements.analysis,
        feedback: lastFeedback_structureReview,
        attempt: attempt + 1
      });
    }
    const structureReview = await ctx.breakpoint({
      question: `Pi plugin "${pluginName}" scaffolded with ${scaffold.fileCount || 'multiple'} files. Review the package.json omp field and directory layout?`,
      title: 'Pi Plugin Structure Review',
      context: {
        runId: ctx.runId,
        files: (scaffold.artifacts || []).map(a => ({ path: a.path, label: a.label })),
        summary: { pluginName, npmPackage: `${npmScope}/${pluginName}`, directories: scaffold.directories }
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_structureReview || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (structureReview.approved) break;
    lastFeedback_structureReview = structureReview.response || structureReview.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 3: IMPLEMENT COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Pi plugin components');

  const implementation = await ctx.task(implementComponentsTask, {
    pluginName,
    pluginDir,
    requirements: requirements.analysis,
    structure: scaffold
  });

  artifacts.push(...(implementation.artifacts || []));

  // ============================================================================
  // PHASE 4: TESTING & VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing and validating Pi plugin');

  let validation = await ctx.task(testAndValidateTask, {
    pluginName,
    pluginDir,
    requirements: requirements.analysis,
    structure: scaffold
  });

  artifacts.push(...(validation.artifacts || []));

  if (!validation.valid) {
    let lastFeedback_validationReview = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_validationReview) {
        validation = await ctx.task(testAndValidateTask, {
          pluginName, pluginDir,
          requirements: requirements.analysis, structure: scaffold,
          feedback: lastFeedback_validationReview, attempt: attempt + 1
        });
      }
      const validationReview = await ctx.breakpoint({
        question: `Pi plugin validation found ${(validation.issues || []).length} issues. Review findings and decide whether to fix or proceed?`,
        title: 'Pi Plugin Validation Results',
        context: {
          runId: ctx.runId,
          checks: validation.checks,
          issues: validation.issues
        },
        expert: 'owner',
        tags: ['approval-gate'],
        previousFeedback: lastFeedback_validationReview || undefined,
        attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (validationReview.approved) break;
      lastFeedback_validationReview = validationReview.response || validationReview.feedback || 'Changes requested';
    }
  }

  // ============================================================================
  // PHASE 5: DISTRIBUTION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up npm distribution');

  const distribution = await ctx.task(distributionSetupTask, {
    pluginName,
    pluginDir,
    npmScope,
    requirements: requirements.analysis
  });

  artifacts.push(...(distribution.artifacts || []));

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating documentation');

  const docs = await ctx.task(documentationTask, {
    pluginName,
    pluginDir,
    npmScope,
    requirements: requirements.analysis,
    components: implementation
  });

  artifacts.push(...(docs.artifacts || []));

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  ctx.log('info', `Pi plugin "${pluginName}" creation complete`);

  return {
    success: true,
    pluginDir,
    packageJson: scaffold.packageJson,
    npmPackage: `${npmScope}/${pluginName}`,
    components: {
      tools: implementation.tools || [],
      commands: implementation.commands || [],
      events: implementation.events || [],
      skills: implementation.skills || []
    },
    distribution: {
      npmPackage: distribution.npmPackage,
      installCommand: distribution.installCommand,
      publishReady: distribution.publishReady
    },
    artifacts
  };
}

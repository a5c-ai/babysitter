/**
 * @process codex-plugin-creation
 * @description Create and distribute a plugin for the Codex CLI harness. Guides through
 *   requirements analysis, scaffolding the plugin with .codex-plugin/plugin.json manifest (with
 *   interface object), .app.json, hooks.json (SessionStart/UserPromptSubmit/Stop with matcher+hooks
 *   array format), SKILL.md files, MCP server entries, then validating, preparing for npm/GitHub
 *   distribution, and generating documentation.
 * @inputs { pluginName: string, pluginDescription: string, outputDir?: string, components?: { skills?: string[], hooks?: string[], commands?: string[], mcp?: boolean }, language?: string, author?: string }
 * @outputs { success: boolean, pluginDir: string, manifest: object, components: object, distributionReady: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeRequirementsTask = defineTask('codex-analyze-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze plugin requirements for Codex CLI',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Codex CLI plugin architect',
      task: `Analyze requirements for a new Codex CLI plugin named "${args.pluginName}".

Description: ${args.pluginDescription}

Determine:
1. **Target audience** — who will use this plugin and in what Codex workflows
2. **Component inventory** — which Codex plugin components are needed:
   - Skills (SKILL.md files for capability definitions)
   - Hooks (SessionStart, UserPromptSubmit, Stop — configured in hooks.json or config.toml)
   - Commands (CLI-invocable actions)
   - MCP servers (configured in config.toml under [mcp_servers])
3. **Plugin type** — determine implementation approach:
   - Script-based (shell scripts for hooks, markdown for skills/commands)
   - Rust-native (compiled plugin using Codex plugin API — for performance-critical plugins)
4. **Configuration schema** — what settings go in config.toml:
   - API keys and secrets (environment variable references)
   - Behavioral preferences and toggles
   - Model and timeout overrides
5. **Dependencies** — npm packages, system CLIs, or Rust crates required

Codex CLI plugin structure reference:
\`\`\`
<plugin-root>/
  .codex-plugin/
    plugin.json         # Plugin manifest with interface object (displayName, category, capabilities)
  .app.json             # App manifest (name, version, description)
  hooks.json            # Hook definitions (SessionStart, UserPromptSubmit, Stop) with matcher+hooks arrays
  hooks/
    *.sh                # Hook script implementations
  skills/
    <skill-name>/
      SKILL.md          # Skill definition
  commands/
    <command>.md        # Command definitions
  assets/
    icon.svg            # Plugin icon
  config.toml.template  # Template for user's config.toml additions
  babysitter.lock.json  # Lock file for version tracking
  versions.json         # Version history
  package.json          # npm package metadata
\`\`\`

Return a structured requirements document.`,
      context: { pluginName: args.pluginName, description: args.pluginDescription, requestedComponents: args.components, language: args.language },
      instructions: [
        'Identify all required Codex CLI plugin components',
        'Determine script-based vs Rust-native approach',
        'Define config.toml schema additions',
        'List external dependencies',
        'Return structured JSON requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'pluginType', 'configSchema', 'dependencies'],
      properties: {
        components: { type: 'object' },
        pluginType: { type: 'string' },
        configSchema: { type: 'object' },
        dependencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const scaffoldPluginTask = defineTask('codex-scaffold-plugin', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold Codex CLI plugin directory structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Codex CLI plugin scaffolding specialist',
      task: `Create the directory structure and manifest files for the Codex CLI plugin "${args.pluginName}" at ${args.outputDir}.

Requirements analysis:
${JSON.stringify(args.requirements, null, 2)}

Steps:
1. Create the plugin root directory: ${args.outputDir}/${args.pluginName}/
2. Create subdirectories for each component type:
   - hooks/ (for hook shell scripts)
   - skills/ with subdirs for each skill
   - commands/ (if commands are needed)
   - assets/ (for static resources if any)

3. Create .codex-plugin/ directory with plugin.json manifest:
\`\`\`json
{
  "name": "${args.pluginName}",
  "version": "1.0.0",
  "skills": "./skills/",
  "hooks": "./hooks.json",
  "apps": "./.app.json",
  "interface": {
    "displayName": "${args.pluginName}",
    "shortDescription": "${args.pluginDescription}",
    "category": "Coding",
    "capabilities": ["Interactive", "Read", "Write"],
    "brandColor": "#0F766E",
    "composerIcon": "./assets/icon.svg"
  }
}
\`\`\`

4. Write .app.json manifest:
\`\`\`json
{
  "name": "${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.pluginDescription}",
  "author": "${args.author || 'unknown'}",
  "license": "MIT",
  "codex": {
    "minVersion": "0.1.0"
  }
}
\`\`\`

5. Write hooks.json following the Codex hook format:
\`\`\`json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "./hooks/<script>.sh" }
        ]
      }
    ],
    "UserPromptSubmit": [...],
    "Stop": [...]
  }
}
\`\`\`

6. Write config.toml.template showing what entries the user should add to their Codex config:
\`\`\`toml
# ${args.pluginName} plugin configuration
[plugins.${args.pluginName}]
enabled = true

# MCP server configuration (if needed)
# [mcp_servers.${args.pluginName}]
# command = "npx"
# args = ["-y", "<mcp-package>"]
\`\`\`

7. Write versions.json with initial version entry.

8. Write babysitter.lock.json for version tracking.

9. Write package.json for npm distribution:
\`\`\`json
{
  "name": "@${args.author || 'unknown'}/${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.pluginDescription}",
  "files": [".codex-plugin/", "hooks/", "skills/", "commands/", "assets/", ".app.json", "hooks.json", "config.toml.template"],
  "keywords": ["codex", "codex-cli", "plugin", "babysitter-plugin"]
}
\`\`\`

Return the list of created files and directories.`,
      context: { pluginName: args.pluginName, outputDir: args.outputDir, requirements: args.requirements, author: args.author },
      instructions: [
        'Create plugin directory structure',
        'Write .app.json manifest',
        'Write hooks.json with Codex hook format',
        'Write config.toml.template',
        'Write versions.json and lock file',
        'Write package.json for npm',
        'Return list of created files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['pluginDir', 'manifestPath', 'createdFiles', 'createdDirs'],
      properties: {
        pluginDir: { type: 'string' },
        manifestPath: { type: 'string' },
        createdFiles: { type: 'array', items: { type: 'string' } },
        createdDirs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const implementComponentsTask = defineTask('codex-implement-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement all Codex CLI plugin components',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Codex CLI plugin developer',
      task: `Implement all components for the Codex CLI plugin "${args.pluginName}" at ${args.pluginDir}.

Requirements:
${JSON.stringify(args.requirements, null, 2)}

Implement each component type as needed:

### Skills (skills/<name>/SKILL.md)
Each SKILL.md must include:
- Skill name and description
- Trigger conditions (when the skill should be invoked)
- Step-by-step implementation instructions
- Tool usage patterns compatible with Codex CLI sandbox model
- Note: Codex runs in a sandboxed environment by default — skills must work within sandbox constraints or clearly document when network/filesystem access is needed

### Hooks (hooks/*.sh)
Each hook script must:
- Start with #!/bin/bash
- Handle the Codex hook environment variables (CODEX_SESSION_ID, CODEX_WORKSPACE, etc.)
- Be idempotent (safe to run multiple times)
- Exit 0 on success, non-zero to signal the hook system
- For SessionStart: initialization, state setup
- For UserPromptSubmit: prompt preprocessing, context injection
- For Stop: cleanup, state persistence, iteration control

### Commands (commands/<name>.md)
Each command defines a Codex-invocable action with:
- Command name and description
- Usage pattern
- Implementation instructions
- Expected inputs and outputs

### MCP Configuration (config.toml.template additions)
If MCP servers are needed, add entries in TOML format:
\`\`\`toml
[mcp_servers.<server-name>]
command = "<binary>"
args = ["<arg1>", "<arg2>"]
env = { KEY = "value" }
\`\`\`

Implement ALL components listed in the requirements. Ensure each file is complete and functional within Codex's sandboxed execution model.`,
      context: { pluginName: args.pluginName, pluginDir: args.pluginDir, requirements: args.requirements },
      instructions: [
        'Implement every skill as a complete SKILL.md',
        'Create all hook shell scripts',
        'Write command definitions',
        'Add MCP server configurations to config.toml.template',
        'Respect Codex sandbox constraints in all implementations',
        'Return list of all implemented files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedFiles', 'componentCounts'],
      properties: {
        implementedFiles: { type: 'array', items: { type: 'string' } },
        componentCounts: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const testAndValidateTask = defineTask('codex-test-validate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate Codex CLI plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer for Codex CLI plugins',
      task: `Validate the Codex CLI plugin at ${args.pluginDir}.

Run these validation checks:

1. **Manifest validation** — .app.json:
   - Valid JSON with required fields (name, version, description)
   - Version follows semver

2. **Hook validation** — hooks.json + hooks/*.sh:
   - hooks.json is valid JSON matching Codex hook schema
   - Only valid hook types used (SessionStart, UserPromptSubmit, Stop)
   - Each referenced script exists and starts with #!/bin/bash
   - Scripts handle expected environment variables
   - Scripts are safe for sandboxed execution

3. **Skill validation** — skills/<name>/SKILL.md:
   - Each SKILL.md has title, description, trigger, and instructions
   - Skills respect Codex sandbox model (document any escape requirements)

4. **Config validation** — config.toml.template:
   - Valid TOML syntax
   - MCP server entries have required fields (command, args)
   - Environment variable references documented

5. **Package validation** — package.json:
   - Valid JSON with correct "files" field
   - No unnecessary dependencies included
   - Keywords include "codex" or "codex-cli"

6. **Version tracking** — versions.json, babysitter.lock.json:
   - Both are valid JSON
   - Versions are consistent across all manifests

7. **Cross-reference check**:
   - All files referenced in hooks.json exist
   - All skills referenced in documentation exist
   - config.toml.template references match implementation

Return a structured validation report.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName },
      instructions: [
        'Validate all manifest and config files',
        'Check every referenced file exists',
        'Verify sandbox compatibility',
        'Check version consistency',
        'Return structured pass/fail report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'checks', 'issues'],
      properties: {
        valid: { type: 'boolean' },
        checks: { type: 'array' },
        issues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const fixValidationIssuesTask = defineTask('codex-fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix validation issues in Codex CLI plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Plugin maintainer',
      task: `Fix the following validation issues in the Codex CLI plugin at ${args.pluginDir}:

${JSON.stringify(args.issues, null, 2)}

For each issue: read the affected file, apply the fix, verify it resolves the problem.
Return a summary of all fixes.`,
      context: { pluginDir: args.pluginDir, issues: args.issues },
      instructions: ['Fix each issue', 'Verify each fix', 'Return summary'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fixesApplied'],
      properties: { fixesApplied: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const setupDistributionTask = defineTask('codex-setup-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up Codex CLI plugin distribution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Codex CLI plugin distribution specialist',
      task: `Prepare the Codex CLI plugin "${args.pluginName}" at ${args.pluginDir} for distribution.

Codex CLI plugins are distributed via npm or GitHub. Steps:

1. **npm distribution setup**:
   - Verify package.json has correct "files" field (only plugin artifacts, no test/dev files)
   - Add "repository" field pointing to GitHub repo
   - Add "bin" entry if the plugin provides CLI commands
   - Create .npmignore to exclude dev files, tests, and documentation source
   - Ensure "babysitter-plugin" and "codex-cli" are in keywords

2. **GitHub distribution setup**:
   - Create a release-ready directory structure
   - Write GitHub Actions workflow (.github/workflows/publish.yml) for automated npm publish on tag:
     \`\`\`yaml
     name: Publish Plugin
     on:
       push:
         tags: ['v*']
     jobs:
       publish:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - uses: actions/setup-node@v4
           - run: npm publish
             env:
               NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
     \`\`\`

3. **Create install.md** — installation instructions:
   - npm install: \`npm install @${args.author}/${args.pluginName}\`
   - Manual install from GitHub: clone + copy to plugin directory
   - Post-install config.toml additions from template
   - Register: babysitter plugin:update-registry --plugin-name ${args.pluginName} --plugin-version 1.0.0 --project --json

4. **Create uninstall.md** — cleanup instructions:
   - Remove plugin files
   - Remove config.toml entries
   - Remove from registry

5. **Create configure.md** — post-install configuration guide

6. **Create CHANGELOG.md** with initial 1.0.0 entry.

Write all distribution files to ${args.pluginDir}/.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, pluginDescription: args.pluginDescription, author: args.author },
      instructions: [
        'Set up npm distribution with correct package.json',
        'Create GitHub Actions publish workflow',
        'Write install/uninstall/configure markdown',
        'Create CHANGELOG.md',
        'Return list of distribution files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionFiles', 'npmPackageName'],
      properties: {
        distributionFiles: { type: 'array', items: { type: 'string' } },
        npmPackageName: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const generateDocumentationTask = defineTask('codex-generate-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Codex CLI plugin documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer for Codex CLI plugins',
      task: `Create comprehensive documentation for the Codex CLI plugin "${args.pluginName}" at ${args.pluginDir}.

Create:

1. **README.md** with:
   - Plugin name, description, and Codex CLI compatibility note
   - Installation via npm and manual methods
   - Component overview (skills, hooks, commands, MCP servers)
   - Configuration reference (config.toml entries)
   - Sandbox considerations — what works in sandbox vs full-auto mode
   - Usage examples for each feature
   - Troubleshooting section
   - Contributing and license

2. **USAGE.md** — detailed usage guide:
   - Codex CLI setup prerequisites
   - Step-by-step skill walkthroughs
   - Hook behavior and lifecycle documentation
   - Command reference with examples
   - MCP server interaction patterns
   - Sandbox mode vs full-auto mode behavior differences

3. **examples/** directory:
   - Example config.toml snippets
   - Sample workflows demonstrating the plugin

Document thoroughly for both new Codex CLI users and experienced developers.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, requirements: args.requirements, components: args.components },
      instructions: [
        'Write comprehensive README.md',
        'Write detailed USAGE.md with sandbox considerations',
        'Create example configurations',
        'Return list of documentation files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationFiles'],
      properties: {
        documentationFiles: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
  const {
    pluginName,
    pluginDescription,
    outputDir = '.',
    components = {},
    language = 'script',
    author = 'unknown'
  } = inputs;

  const pluginDir = `${outputDir}/${pluginName}`;
  const startTime = ctx.now();

  ctx.log('info', `Creating Codex CLI plugin "${pluginName}" at ${pluginDir}`);

  // ========================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ========================================================================

  ctx.log('info', 'Phase 1: Analyzing plugin requirements for Codex CLI');

  const requirements = await ctx.task(analyzeRequirementsTask, {
    pluginName,
    pluginDescription,
    components,
    language
  });

  await ctx.breakpoint({
    question: `Requirements analysis complete for Codex CLI plugin "${pluginName}". Plugin type: ${requirements.pluginType}. Components: ${JSON.stringify(Object.keys(requirements.components))}. Review and approve to proceed with scaffolding.`,
    options: ['Approve — proceed to scaffolding', 'Revise — adjust requirements'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 2: SCAFFOLD PLUGIN STRUCTURE
  // ========================================================================

  ctx.log('info', 'Phase 2: Scaffolding Codex CLI plugin structure');

  const scaffold = await ctx.task(scaffoldPluginTask, {
    pluginName,
    pluginDescription,
    outputDir,
    requirements,
    author
  });

  // ========================================================================
  // PHASE 3: IMPLEMENT COMPONENTS
  // ========================================================================

  ctx.log('info', 'Phase 3: Implementing plugin components');

  const implemented = await ctx.task(implementComponentsTask, {
    pluginName,
    pluginDir,
    requirements
  });

  // ========================================================================
  // PHASE 4: TESTING & VALIDATION
  // ========================================================================

  ctx.log('info', 'Phase 4: Testing and validating plugin');

  const validation = await ctx.task(testAndValidateTask, {
    pluginDir,
    pluginName
  });

  if (!validation.valid && validation.issues && validation.issues.length > 0) {
    ctx.log('warn', `Found ${validation.issues.length} validation issues, fixing...`);
    await ctx.task(fixValidationIssuesTask, {
      pluginDir,
      issues: validation.issues
    });
  }

  await ctx.breakpoint({
    question: `Codex CLI plugin implementation and validation complete. ${validation.valid ? 'All checks passed.' : `Fixed ${validation.issues?.length || 0} issues.`} Review the plugin at ${pluginDir}. Approve to proceed with distribution setup.`,
    options: ['Approve — proceed to distribution', 'Reject — needs more work'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 5: DISTRIBUTION SETUP
  // ========================================================================

  ctx.log('info', 'Phase 5: Setting up npm/GitHub distribution');

  const distribution = await ctx.task(setupDistributionTask, {
    pluginDir,
    pluginName,
    pluginDescription,
    author
  });

  // ========================================================================
  // PHASE 6: DOCUMENTATION
  // ========================================================================

  ctx.log('info', 'Phase 6: Generating documentation');

  const documentation = await ctx.task(generateDocumentationTask, {
    pluginDir,
    pluginName,
    requirements,
    components: implemented
  });

  ctx.log('info', `Codex CLI plugin "${pluginName}" creation complete`);

  return {
    success: true,
    pluginDir,
    manifest: { name: pluginName, version: '1.0.0', author, pluginType: requirements.pluginType },
    components: implemented.componentCounts,
    distributionReady: true,
    npmPackage: distribution.npmPackageName,
    files: {
      scaffold: scaffold.createdFiles,
      implemented: implemented.implementedFiles,
      distribution: distribution.distributionFiles,
      documentation: documentation.documentationFiles
    },
    duration: ctx.now() - startTime
  };
}

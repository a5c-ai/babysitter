/**
 * @process claude-code-plugin-creation
 * @description Create and distribute a plugin for the Claude Code harness. Guides through
 *   requirements analysis, scaffolding the .claude-plugin/ directory with plugin.json manifest,
 *   implementing skills (SKILL.md), agents (.claude/agents/*.md), hooks (hooks.json or
 *   settings.json), MCP configs (.mcp.json), and commands — then validating, preparing for
 *   marketplace distribution via marketplace.json, and generating documentation.
 * @inputs { pluginName: string, pluginDescription: string, outputDir?: string, components?: { skills?: string[], hooks?: string[], commands?: string[], agents?: string[], mcp?: boolean }, userConfig?: object, author?: string }
 * @outputs { success: boolean, pluginDir: string, manifest: object, components: object, distributionReady: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeRequirementsTask = defineTask('cc-analyze-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze plugin requirements for Claude Code',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Claude Code plugin architect',
      task: `Analyze requirements for a new Claude Code plugin named "${args.pluginName}".

Description: ${args.pluginDescription}

Determine:
1. **Target audience** — who will use this plugin and in what workflows
2. **Component inventory** — which Claude Code plugin components are needed:
   - Skills (SKILL.md files with trigger patterns and instructions)
   - Hooks (SessionStart, Stop, PreToolUse, PostToolUse — shell scripts or commands)
   - Commands (slash commands exposed to the user)
   - Agents (.claude/agents/*.md subagent definitions)
   - MCP servers (.mcp.json configurations for tool integrations)
3. **userConfig schema** — what settings the plugin needs, split into:
   - sensitive (API keys, tokens — stored securely, never logged)
   - non-sensitive (preferences, toggles, thresholds)
4. **Dependencies** — any npm packages, external CLIs, or MCP servers required
5. **Integration points** — how components interact with each other and with Claude Code

Claude Code plugin structure reference:
\`\`\`
.claude-plugin/
  plugin.json          # Manifest: name, version, description, hooks, skills, commands, userConfig
  hooks/
    hooks.json         # Hook definitions (SessionStart, Stop, PreToolUse, PostToolUse)
    *.sh               # Hook implementation scripts
  skills/
    <skill-name>/
      SKILL.md         # Skill definition with trigger patterns
  commands/
    <command>.md       # Slash command definitions
  agents/
    <agent>.md         # Subagent definitions
  .mcp.json            # MCP server configurations
\`\`\`

Return a structured requirements document with component list, config schema, and integration map.`,
      context: { pluginName: args.pluginName, description: args.pluginDescription, requestedComponents: args.components },
      instructions: [
        'Identify all required Claude Code plugin components',
        'Define userConfig schema with sensitive/non-sensitive split',
        'Map integration points between components',
        'List external dependencies',
        'Return structured JSON requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'userConfig', 'dependencies', 'integrationMap'],
      properties: {
        components: { type: 'object' },
        userConfig: { type: 'object' },
        dependencies: { type: 'array' },
        integrationMap: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const scaffoldPluginTask = defineTask('cc-scaffold-plugin', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold Claude Code plugin directory structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Claude Code plugin scaffolding specialist',
      task: `Create the directory structure and plugin.json manifest for the Claude Code plugin "${args.pluginName}" at ${args.outputDir}.

Requirements analysis:
${JSON.stringify(args.requirements, null, 2)}

Steps:
1. Create the plugin root directory: ${args.outputDir}/.claude-plugin/
2. Create subdirectories based on required components:
   - hooks/ (if hooks are needed)
   - skills/ with subdirs for each skill
   - commands/ (if commands are needed)
   - agents/ (if agents are needed)

3. Write plugin.json manifest following this exact Claude Code format:
\`\`\`json
{
  "name": "${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.pluginDescription}",
  "author": "${args.author || 'unknown'}",
  "license": "MIT",
  "hooks": {
    "SessionStart": "hooks/<hook-script>.sh",
    "Stop": "hooks/<hook-script>.sh",
    "PreToolUse": "hooks/<hook-script>.sh",
    "PostToolUse": "hooks/<hook-script>.sh"
  },
  "skills": [
    { "name": "<skill-name>", "file": "skills/<skill-name>/SKILL.md" }
  ],
  "commands": [],
  "userConfig": {
    "sensitive": {
      "<key>": { "type": "string", "description": "...", "required": false }
    },
    "nonSensitive": {
      "<key>": { "type": "string", "description": "...", "default": "..." }
    }
  },
  "repository": {
    "type": "git",
    "url": ""
  },
  "keywords": []
}
\`\`\`

4. If MCP is needed, create a .mcp.json template at the plugin root:
\`\`\`json
{
  "mcpServers": {
    "<server-name>": {
      "command": "npx",
      "args": ["-y", "<mcp-package>"],
      "env": {}
    }
  }
}
\`\`\`

Only include hook entries, skill entries, and config keys that are actually needed per the requirements.
Return the list of created files and directories.`,
      context: { pluginName: args.pluginName, outputDir: args.outputDir, requirements: args.requirements, author: args.author },
      instructions: [
        'Create .claude-plugin/ directory structure',
        'Write plugin.json with correct Claude Code manifest format',
        'Create .mcp.json if MCP integration is required',
        'Create subdirectories for all required component types',
        'Return list of created files and directories'
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

const implementComponentsTask = defineTask('cc-implement-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement all Claude Code plugin components',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Claude Code plugin developer',
      task: `Implement all components for the Claude Code plugin "${args.pluginName}" at ${args.pluginDir}.

Requirements:
${JSON.stringify(args.requirements, null, 2)}

Implement each component type as needed:

### Skills (skills/<name>/SKILL.md)
Each SKILL.md must include:
- A descriptive title and description
- Trigger conditions (when the skill should activate)
- Step-by-step instructions for Claude Code to follow
- Any tool usage patterns or constraints
- Reference to userConfig values if needed

### Hooks (hooks/hooks.json + hook scripts)
Create hooks.json following the Claude Code hooks format:
\`\`\`json
{
  "hooks": {
    "<HookType>": [
      {
        "matcher": "<glob-or-regex>",
        "hooks": [
          { "type": "command", "command": "./hooks/<script>.sh" }
        ]
      }
    ]
  }
}
\`\`\`
Valid hook types: SessionStart, Stop, PreToolUse, PostToolUse
Each hook script must be executable (#!/bin/bash), read environment context, and perform its action.

### Commands (commands/<name>.md)
Each command markdown file defines a slash command with:
- Command name and description
- Usage instructions
- Implementation steps for Claude Code to follow when the command is invoked

### Agents (agents/<name>.md)
Each agent markdown defines a specialized subagent with:
- Agent role and expertise description
- Allowed tools and constraints
- Task delegation patterns
- Output format expectations

### MCP Configuration (.mcp.json)
If MCP servers are needed, configure them with proper command, args, and env fields.

Implement ALL components listed in the requirements. Each file must be complete and functional.`,
      context: { pluginName: args.pluginName, pluginDir: args.pluginDir, requirements: args.requirements },
      instructions: [
        'Implement every skill as a complete SKILL.md',
        'Create hooks.json and all hook shell scripts',
        'Write command markdown files for each command',
        'Write agent markdown files for each agent',
        'Configure MCP servers if needed',
        'Ensure all file cross-references are consistent',
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

const testAndValidateTask = defineTask('cc-test-validate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate Claude Code plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer for Claude Code plugins',
      task: `Validate the Claude Code plugin at ${args.pluginDir}.

Run these validation checks:

1. **Manifest validation** — plugin.json:
   - Valid JSON with required fields (name, version, description, author)
   - All referenced skill files exist at their declared paths
   - All referenced hook scripts exist and are executable
   - userConfig schema is well-formed with types and descriptions
   - No orphaned files (files that exist but are not referenced in manifest)

2. **Skill validation** — each skills/<name>/SKILL.md:
   - Has a clear title and description
   - Contains trigger conditions
   - Instructions are actionable and unambiguous
   - References to userConfig keys match the manifest schema

3. **Hook validation** — hooks/hooks.json + scripts:
   - hooks.json is valid JSON matching Claude Code hook schema
   - Each hook script starts with #!/bin/bash
   - Scripts reference correct paths relative to plugin root
   - Matcher patterns are valid globs or regexes

4. **Command validation** — commands/*.md:
   - Each has a command name, description, and instructions
   - No duplicate command names

5. **Agent validation** — agents/*.md:
   - Each has role, expertise, constraints, and output format
   - Tool allowlists are reasonable

6. **MCP validation** — .mcp.json:
   - Valid JSON structure
   - Commands resolve to real packages/binaries
   - Environment variables documented

7. **Cross-reference check**:
   - All inter-component references resolve
   - No circular dependencies between components

Return a structured validation report.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName },
      instructions: [
        'Read and parse plugin.json manifest',
        'Validate every referenced file exists',
        'Check skill, hook, command, agent, and MCP content',
        'Verify cross-references',
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

const fixValidationIssuesTask = defineTask('cc-fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix validation issues in Claude Code plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Plugin maintainer',
      task: `Fix the following validation issues in the Claude Code plugin at ${args.pluginDir}:

${JSON.stringify(args.issues, null, 2)}

For each issue: read the affected file, apply the fix, verify it resolves the problem.
Return a summary of all fixes.`,
      context: { pluginDir: args.pluginDir, issues: args.issues },
      instructions: ['Fix each issue', 'Verify each fix', 'Return summary of fixes applied'],
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

const setupDistributionTask = defineTask('cc-setup-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up Claude Code plugin distribution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Claude Code plugin distribution specialist',
      task: `Prepare the Claude Code plugin "${args.pluginName}" at ${args.pluginDir} for marketplace distribution.

Claude Code plugins are distributed via marketplace registries. Steps:

1. **Create marketplace entry** — prepare a marketplace.json snippet for this plugin:
\`\`\`json
{
  "${args.pluginName}": {
    "name": "${args.pluginName}",
    "description": "${args.pluginDescription}",
    "latestVersion": "1.0.0",
    "versions": ["1.0.0"],
    "packagePath": "plugins/${args.pluginName}",
    "tags": [],
    "author": "${args.author || 'unknown'}"
  }
}
\`\`\`

2. **Create install.md** — installation instructions that:
   - Interview the user about which components to install
   - Copy selected skills, hooks, commands, agents to the project
   - Register via: babysitter plugin:update-registry --plugin-name ${args.pluginName} --plugin-version 1.0.0 --project --json
   - Configure userConfig values (prompt for sensitive values, set non-sensitive defaults)

3. **Create uninstall.md** — cleanup instructions that:
   - Remove all installed plugin files
   - Remove from registry: babysitter plugin:remove-from-registry --plugin-name ${args.pluginName} --project --json

4. **Create configure.md** — post-install configuration:
   - How to update userConfig values
   - How to enable/disable individual components
   - How to update the plugin version

5. **Create package.json** if npm distribution is also desired:
   - Set "files" to include only plugin artifacts
   - Add "babysitter-plugin" keyword
   - Set appropriate peerDependencies

6. **Create CHANGELOG.md** with initial 1.0.0 entry.

Write all distribution files to ${args.pluginDir}/.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, pluginDescription: args.pluginDescription, author: args.author },
      instructions: [
        'Create marketplace.json snippet',
        'Write install.md with user interview and selective install',
        'Write uninstall.md with complete cleanup',
        'Write configure.md with all config options',
        'Create CHANGELOG.md',
        'Return list of distribution files created'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionFiles', 'marketplaceEntry'],
      properties: {
        distributionFiles: { type: 'array', items: { type: 'string' } },
        marketplaceEntry: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const generateDocumentationTask = defineTask('cc-generate-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Claude Code plugin documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer for Claude Code plugins',
      task: `Create comprehensive documentation for the Claude Code plugin "${args.pluginName}" at ${args.pluginDir}.

Create:

1. **README.md** — project README with:
   - Plugin name, description, and badges
   - Quick-start installation (babysitter plugin:install ${args.pluginName})
   - Component overview (list of skills, hooks, commands, agents, MCP servers)
   - Configuration reference (all userConfig keys with types, defaults, descriptions)
   - Usage examples for each major feature
   - Troubleshooting section
   - Contributing guidelines
   - License

2. **USAGE.md** — detailed usage guide with:
   - Step-by-step walkthrough of each skill
   - Hook behavior documentation (when each fires, what it does)
   - Command reference with examples
   - Agent delegation patterns
   - MCP server usage if applicable

3. **examples/** directory with:
   - Example configurations
   - Sample workflows showing the plugin in action

Document the plugin thoroughly so users can install, configure, and use it without additional help.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, requirements: args.requirements, components: args.components },
      instructions: [
        'Write comprehensive README.md',
        'Write detailed USAGE.md',
        'Create example configurations',
        'Ensure all documented features match actual implementation',
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
    userConfig = {},
    author = 'unknown'
  } = inputs;

  const pluginDir = `${outputDir}/.claude-plugin`;
  const startTime = ctx.now();

  ctx.log('info', `Creating Claude Code plugin "${pluginName}" at ${pluginDir}`);

  // ========================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ========================================================================

  ctx.log('info', 'Phase 1: Analyzing plugin requirements');

  const requirements = await ctx.task(analyzeRequirementsTask, {
    pluginName,
    pluginDescription,
    components
  });

  await ctx.breakpoint({
    question: `Requirements analysis complete for Claude Code plugin "${pluginName}". Review the component inventory, userConfig schema, and integration map. Approve to proceed with scaffolding.`,
    options: ['Approve — proceed to scaffolding', 'Revise — adjust requirements'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 2: SCAFFOLD PLUGIN STRUCTURE
  // ========================================================================

  ctx.log('info', 'Phase 2: Scaffolding Claude Code plugin structure');

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
    question: `Plugin implementation and validation complete. ${validation.valid ? 'All checks passed.' : `Fixed ${validation.issues?.length || 0} issues.`} Review the plugin at ${pluginDir}. Approve to proceed with distribution setup.`,
    options: ['Approve — proceed to distribution', 'Reject — needs more work'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 5: DISTRIBUTION SETUP
  // ========================================================================

  ctx.log('info', 'Phase 5: Setting up marketplace distribution');

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

  ctx.log('info', `Claude Code plugin "${pluginName}" creation complete`);

  return {
    success: true,
    pluginDir,
    manifest: { name: pluginName, version: '1.0.0', author },
    components: implemented.componentCounts,
    distributionReady: true,
    files: {
      scaffold: scaffold.createdFiles,
      implemented: implemented.implementedFiles,
      distribution: distribution.distributionFiles,
      documentation: documentation.documentationFiles
    },
    duration: ctx.now() - startTime
  };
}

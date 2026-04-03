/**
 * @process cursor-plugin-creation
 * @description Create and distribute a plugin for the Cursor harness. Guides through
 *   requirements analysis, scaffolding the .cursor-plugin/ directory with plugin.json manifest,
 *   implementing skills (SKILL.md), rules (rules/*.mdc), agents (.cursor/agents/*.md),
 *   hooks (hooks.json), and commands — then validating, preparing for cursor.com/marketplace
 *   distribution, and generating documentation.
 * @inputs { pluginName: string, pluginDescription: string, outputDir?: string, components?: { skills?: string[], hooks?: string[], commands?: string[], agents?: string[], rules?: string[] }, author?: string }
 * @outputs { success: boolean, pluginDir: string, manifest: object, components: object, distributionReady: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeRequirementsTask = defineTask('cursor-analyze-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze plugin requirements for Cursor',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cursor plugin architect',
      task: `Analyze requirements for a new Cursor plugin named "${args.pluginName}".

Description: ${args.pluginDescription}

Determine:
1. **Target audience** — who will use this plugin and in what Cursor workflows
2. **Component inventory** — which Cursor plugin components are needed:
   - Skills (skills/<name>/SKILL.md — capability definitions with trigger patterns)
   - Rules (rules/*.mdc — MDC-format rules that Cursor auto-applies to conversations;
     these use YAML frontmatter with "description", "globs", and optional "alwaysApply" fields,
     followed by markdown instruction content)
   - Agents (.cursor/agents/*.md — specialized subagent definitions)
   - Hooks (hooks.json — SessionStart, Stop, PreToolUse, PostToolUse)
   - Commands (commands/*.md — slash commands)
3. **Rule strategy** — determine which rules are needed:
   - Always-apply rules (alwaysApply: true) — enforced in every conversation
   - Glob-matched rules (globs: ["*.ts", "src/**"]) — applied when matching files are in context
   - Manual rules (neither) — user must explicitly reference them
4. **Configuration needs** — what settings the plugin requires
5. **Dependencies** — external tools, APIs, or services
6. **Cursor-specific features** — which Cursor capabilities the plugin leverages:
   - Composer (multi-file editing)
   - Tab completion / inline suggestions
   - Chat panel interactions
   - Terminal integration
   - @-mentions for context injection

Cursor plugin structure reference:
\`\`\`
.cursor-plugin/
  plugin.json          # Manifest: name, version, description, hooks, skills, commands
  hooks/
    hooks.json         # Hook definitions
    *.sh               # Hook implementation scripts
  skills/
    <skill-name>/
      SKILL.md         # Skill definition with trigger patterns
  commands/
    <command>.md       # Slash command definitions
  rules/
    <rule-name>.mdc   # MDC-format rule files (YAML frontmatter + markdown)
  agents/
    <agent>.md         # Subagent definitions
\`\`\`

Return a structured requirements document.`,
      context: { pluginName: args.pluginName, description: args.pluginDescription, requestedComponents: args.components },
      instructions: [
        'Identify all required Cursor plugin components',
        'Define rule strategy (always-apply vs glob-matched vs manual)',
        'Map Cursor feature dependencies',
        'List external dependencies',
        'Return structured JSON requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'ruleStrategy', 'configuration', 'dependencies', 'cursorFeatures'],
      properties: {
        components: { type: 'object' },
        ruleStrategy: { type: 'object' },
        configuration: { type: 'object' },
        dependencies: { type: 'array' },
        cursorFeatures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const scaffoldPluginTask = defineTask('cursor-scaffold-plugin', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold Cursor plugin directory structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cursor plugin scaffolding specialist',
      task: `Create the directory structure and plugin.json manifest for the Cursor plugin "${args.pluginName}" at ${args.outputDir}.

Requirements analysis:
${JSON.stringify(args.requirements, null, 2)}

Steps:
1. Create the plugin root directory: ${args.outputDir}/.cursor-plugin/
2. Create subdirectories based on required components:
   - hooks/ (if hooks are needed)
   - skills/ with subdirs for each skill
   - commands/ (if commands are needed)
   - rules/ (if rules are needed)
   - agents/ (if agents are needed)

3. Write plugin.json manifest following the Cursor plugin format:
\`\`\`json
{
  "name": "${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.pluginDescription}",
  "author": "${args.author || 'unknown'}",
  "license": "MIT",
  "hooks": "hooks/hooks.json",
  "skills": "skills/",
  "commands": "commands/",
  "repository": {
    "type": "git",
    "url": ""
  },
  "keywords": ["cursor", "cursor-plugin"]
}
\`\`\`

Note: Cursor plugin.json uses directory paths for skills and commands (not arrays), and a
file path for hooks. This differs from Claude Code which uses arrays of objects.

4. Create empty placeholder files in each component directory so the structure is visible.

Return the list of created files and directories.`,
      context: { pluginName: args.pluginName, outputDir: args.outputDir, requirements: args.requirements, author: args.author },
      instructions: [
        'Create .cursor-plugin/ directory structure',
        'Write plugin.json with Cursor manifest format',
        'Create component subdirectories',
        'Create placeholder files',
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

const implementComponentsTask = defineTask('cursor-implement-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement all Cursor plugin components',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cursor plugin developer',
      task: `Implement all components for the Cursor plugin "${args.pluginName}" at ${args.pluginDir}.

Requirements:
${JSON.stringify(args.requirements, null, 2)}

Implement each component type as needed:

### Skills (skills/<name>/SKILL.md)
Each SKILL.md must include:
- Skill name and description
- Trigger conditions (when Cursor should invoke this skill)
- Step-by-step instructions
- Tool usage patterns compatible with Cursor's Composer and Chat
- Integration with Cursor-specific features (@-mentions, inline editing, etc.)

### Rules (rules/<name>.mdc)
Each .mdc file uses MDC format — YAML frontmatter delimited by --- followed by markdown content:
\`\`\`mdc
---
description: Brief description of what this rule enforces
globs: ["*.ts", "*.tsx"]
alwaysApply: false
---

# Rule Title

Rule content in markdown. This is injected into the AI context when:
- alwaysApply is true: every conversation
- globs match: when matching files are in context
- neither: only when explicitly referenced by the user

Write clear, actionable instructions that Cursor's AI should follow.
\`\`\`

Rule strategy from requirements:
${JSON.stringify(args.requirements.ruleStrategy, null, 2)}

### Agents (agents/<name>.md)
Each agent markdown defines a specialized subagent with:
- Agent role and expertise
- Allowed tools and constraints
- Task delegation patterns
- When to invoke this agent vs handling directly

### Hooks (hooks.json)
Create hooks.json following the Cursor hooks format. The \`stop\` hook supports a \`loop_limit\`
field (null for unlimited) that controls orchestration re-entry:
\`\`\`json
{
  "version": 1,
  "hooks": {
    "stop": [
      {
        "type": "command",
        "bash": "bash \\"./hooks/stop-hook.sh\\"",
        "powershell": "powershell -NoProfile -ExecutionPolicy Bypass -File \\"./hooks/stop-hook.ps1\\"",
        "loop_limit": null
      }
    ]
  }
}
\`\`\`
The stop hook with \`loop_limit: null\` enables infinite orchestration loops (critical for babysitter).
Hook scripts must be standalone executables that handle Cursor's hook environment.

### Commands (commands/<name>.md)
Each command defines a slash command with:
- Command name and description
- Usage instructions and parameters
- Implementation steps for Cursor to follow
- Example invocations

Implement ALL components listed in the requirements. Each file must be complete and functional.`,
      context: { pluginName: args.pluginName, pluginDir: args.pluginDir, requirements: args.requirements },
      instructions: [
        'Implement every skill as a complete SKILL.md',
        'Create all .mdc rule files with correct frontmatter',
        'Write agent markdown definitions',
        'Create hooks.json and hook scripts',
        'Write command markdown files',
        'Ensure all components integrate with Cursor features',
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

const testAndValidateTask = defineTask('cursor-test-validate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate Cursor plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer for Cursor plugins',
      task: `Validate the Cursor plugin at ${args.pluginDir}.

Run these validation checks:

1. **Manifest validation** — plugin.json:
   - Valid JSON with required fields (name, version, description)
   - hooks path points to existing hooks.json
   - skills and commands paths point to existing directories
   - Version follows semver

2. **Skill validation** — skills/<name>/SKILL.md:
   - Each has title, description, trigger conditions, and instructions
   - Instructions are compatible with Cursor's AI capabilities
   - No references to unsupported tools or features

3. **Rule validation** — rules/<name>.mdc:
   - Each .mdc file has valid YAML frontmatter (delimited by ---)
   - Frontmatter contains "description" field
   - "globs" field contains valid glob patterns (if present)
   - "alwaysApply" is boolean (if present)
   - Markdown content after frontmatter is well-formed
   - Rule strategy is coherent (not too many always-apply rules)

4. **Agent validation** — agents/<name>.md:
   - Each has role, expertise, constraints, and output format
   - Tool allowlists are reasonable for Cursor
   - No conflicting agent definitions

5. **Hook validation** — hooks/hooks.json + scripts:
   - hooks.json is valid JSON with valid hook types
   - Each referenced script exists and starts with #!/bin/bash
   - Scripts handle expected environment variables

6. **Command validation** — commands/<name>.md:
   - Each has name, description, and instructions
   - No duplicate command names

7. **Cross-reference check**:
   - All inter-component references resolve
   - Rules reference existing skills/agents correctly
   - No orphaned files

Return a structured validation report.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName },
      instructions: [
        'Validate plugin.json manifest',
        'Check all skills, rules, agents, hooks, and commands',
        'Verify MDC frontmatter in all .mdc files',
        'Check cross-references',
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

const fixValidationIssuesTask = defineTask('cursor-fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix validation issues in Cursor plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Plugin maintainer',
      task: `Fix the following validation issues in the Cursor plugin at ${args.pluginDir}:

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

const setupDistributionTask = defineTask('cursor-setup-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up Cursor plugin distribution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cursor plugin distribution specialist',
      task: `Prepare the Cursor plugin "${args.pluginName}" at ${args.pluginDir} for distribution via cursor.com/marketplace.

Cursor plugins are distributed via the Cursor marketplace and GitHub. Steps:

1. **Cursor marketplace submission preparation**:
   - Create marketplace-submission.json with metadata for cursor.com/marketplace:
     \`\`\`json
     {
       "name": "${args.pluginName}",
       "displayName": "${args.pluginName}",
       "description": "${args.pluginDescription}",
       "version": "1.0.0",
       "author": "${args.author || 'unknown'}",
       "publisher": "${args.author || 'unknown'}",
       "categories": [],
       "tags": [],
       "repository": "https://github.com/${args.author || 'unknown'}/${args.pluginName}",
       "icon": "",
       "screenshots": [],
       "license": "MIT",
       "engines": {
         "cursor": ">=0.40.0"
       },
       "contributes": {
         "skills": [],
         "rules": [],
         "agents": [],
         "commands": []
       }
     }
     \`\`\`
   - The "contributes" section itemizes all components the plugin provides
   - The "engines.cursor" field specifies minimum Cursor version compatibility

2. **GitHub distribution setup**:
   - Create .gitignore excluding dev artifacts
   - Create GitHub Actions workflow for release:
     \`\`\`yaml
     name: Release Plugin
     on:
       push:
         tags: ['v*']
     jobs:
       release:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - name: Package Plugin
             run: |
               mkdir -p dist
               cp -r .cursor-plugin dist/
               tar czf ${args.pluginName}-v\${{ github.ref_name }}.tar.gz -C dist .cursor-plugin
           - name: Create GitHub Release
             uses: softprops/action-gh-release@v2
             with:
               files: '*.tar.gz'
               generate_release_notes: true
     \`\`\`

3. **Create install.md** — installation instructions:
   - Primary: install from cursor.com/marketplace (once submitted)
   - Alternative: clone from GitHub and copy .cursor-plugin/ to project root
   - Post-install: verify rules appear in Cursor Settings > Rules
   - Configure any required settings
   - Register: babysitter plugin:update-registry --plugin-name ${args.pluginName} --plugin-version 1.0.0 --project --json

4. **Create uninstall.md** — cleanup instructions:
   - Remove .cursor-plugin/ directory
   - Remove any project-level .cursor/ agent files
   - Remove from registry

5. **Create configure.md** — post-install configuration:
   - How to enable/disable individual rules
   - How to customize rule globs
   - How to add project-specific agent overrides
   - How to configure hooks

6. **Create CHANGELOG.md** with initial 1.0.0 entry.

Write all distribution files to ${args.pluginDir}/.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, pluginDescription: args.pluginDescription, author: args.author },
      instructions: [
        'Create marketplace-submission.json with component inventory',
        'Set up GitHub release workflow',
        'Write install/uninstall/configure markdown',
        'Create CHANGELOG.md',
        'Return list of distribution files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionFiles', 'marketplaceSubmission'],
      properties: {
        distributionFiles: { type: 'array', items: { type: 'string' } },
        marketplaceSubmission: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const generateDocumentationTask = defineTask('cursor-generate-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Cursor plugin documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer for Cursor plugins',
      task: `Create comprehensive documentation for the Cursor plugin "${args.pluginName}" at ${args.pluginDir}.

Create:

1. **README.md** with:
   - Plugin name, description, and Cursor version requirements
   - Installation from marketplace and GitHub
   - Component overview:
     - Skills and their trigger patterns
     - Rules (list each .mdc file with its description, globs, and alwaysApply status)
     - Agents and their specializations
     - Hooks and their behavior
     - Commands and their usage
   - Configuration reference
   - Usage examples showing Cursor-specific workflows (Composer, Chat, inline)
   - How rules interact with Cursor's context system
   - Troubleshooting section
   - Contributing and license

2. **USAGE.md** — detailed usage guide:
   - Cursor setup prerequisites
   - How plugins integrate with Cursor's AI features
   - Rule behavior deep dive:
     - Always-apply rules and their impact on every conversation
     - Glob-matched rules and when they activate
     - Manual rules and how to reference them
   - Skill walkthroughs in Cursor Chat and Composer
   - Agent delegation patterns
   - Hook lifecycle documentation
   - Command reference with examples
   - Tips for effective plugin usage with Cursor's AI models

3. **examples/** directory:
   - Example rule customizations
   - Sample Composer workflows
   - Configuration examples

Document thoroughly for Cursor users.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, requirements: args.requirements, components: args.components },
      instructions: [
        'Write comprehensive README.md',
        'Write detailed USAGE.md with Cursor-specific guidance',
        'Create example configurations and workflows',
        'Document all rules with their activation conditions',
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
    author = 'unknown'
  } = inputs;

  const pluginDir = `${outputDir}/.cursor-plugin`;
  const startTime = ctx.now();

  ctx.log('info', `Creating Cursor plugin "${pluginName}" at ${pluginDir}`);

  // ========================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ========================================================================

  ctx.log('info', 'Phase 1: Analyzing plugin requirements for Cursor');

  const requirements = await ctx.task(analyzeRequirementsTask, {
    pluginName,
    pluginDescription,
    components
  });

  await ctx.breakpoint({
    question: `Requirements analysis complete for Cursor plugin "${pluginName}". Components: ${JSON.stringify(Object.keys(requirements.components))}. Rule strategy: ${JSON.stringify(requirements.ruleStrategy)}. Cursor features: ${JSON.stringify(requirements.cursorFeatures)}. Review and approve to proceed.`,
    options: ['Approve — proceed to scaffolding', 'Revise — adjust requirements'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 2: SCAFFOLD PLUGIN STRUCTURE
  // ========================================================================

  ctx.log('info', 'Phase 2: Scaffolding Cursor plugin structure');

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
    question: `Cursor plugin implementation and validation complete. ${validation.valid ? 'All checks passed.' : `Fixed ${validation.issues?.length || 0} issues.`} Review the plugin at ${pluginDir}, especially the .mdc rule files. Approve to proceed with distribution.`,
    options: ['Approve — proceed to distribution', 'Reject — needs more work'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 5: DISTRIBUTION SETUP
  // ========================================================================

  ctx.log('info', 'Phase 5: Setting up cursor.com/marketplace distribution');

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

  ctx.log('info', `Cursor plugin "${pluginName}" creation complete`);

  return {
    success: true,
    pluginDir,
    manifest: { name: pluginName, version: '1.0.0', author },
    components: implemented.componentCounts,
    distributionReady: true,
    marketplaceSubmission: distribution.marketplaceSubmission,
    files: {
      scaffold: scaffold.createdFiles,
      implemented: implemented.implementedFiles,
      distribution: distribution.distributionFiles,
      documentation: documentation.documentationFiles
    },
    duration: ctx.now() - startTime
  };
}

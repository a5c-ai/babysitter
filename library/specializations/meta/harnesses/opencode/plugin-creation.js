/**
 * @process meta/harnesses/opencode/plugin-creation
 * @description Create and distribute a plugin for OpenCode (anomalyco/opencode). Guides through
 *   requirements analysis, scaffolding with plugin context/hooks, implementing custom tools (Zod schemas),
 *   hook handlers (tool.execute.before/after, session.created/idle, file.edited, etc.), custom agents
 *   (markdown with YAML frontmatter), commands, MCP configs, and npm distribution.
 * @inputs { pluginName: string, description: string, outputDir?: string, components?: { tools?: string[], hooks?: string[], agents?: string[], commands?: string[], mcp?: boolean }, author?: string, npmScope?: string }
 * @outputs { success: boolean, pluginDir: string, components: object, distributionReady: boolean }
 * @agent process-architect specializations/meta/agents/process-architect/AGENT.md
 * @agent quality-assessor specializations/meta/agents/quality-assessor/AGENT.md
 * @agent technical-writer specializations/meta/agents/technical-writer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeRequirementsTask = defineTask('oc-analyze-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze plugin requirements for OpenCode',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OpenCode plugin architect',
      task: `Analyze requirements for a new OpenCode plugin named "${args.pluginName}".

Description: ${args.description}

Determine:
1. **Target audience** — who will use this plugin and in what workflows
2. **Component inventory** — which OpenCode plugin components are needed:
   - Custom Tools (with Zod schemas, registered via plugin context)
   - Hooks (tool.execute.before/after, session.created/idle, file.edited, shell.env, etc.)
   - Custom Agents (markdown with YAML frontmatter in .opencode/agents/)
   - Commands (markdown files in .opencode/commands/ or JSON config)
   - MCP servers (configured in opencode.json mcp key)
3. **Configuration** — what plugin config keys are needed
4. **Dependencies** — npm packages, MCP servers required
5. **Permission implications** — what tool permissions the plugin needs

OpenCode plugin structure reference:
\`\`\`
my-opencode-plugin/
  src/
    index.ts              # Plugin entry: export default async function(ctx) { ... }
    tools/                # Custom tool implementations with Zod schemas
    hooks/                # Hook handler implementations
  .opencode/
    agents/               # Custom agent definitions (markdown + YAML frontmatter)
      reviewer.md
    commands/             # Custom command definitions (markdown)
      deploy.md
    plugins/              # Local plugin files (auto-discovered)
  opencode.json           # Configuration (mcp, agent, command, plugin keys)
  package.json            # npm distribution
\`\`\`

Plugin context provides: project, directory, worktree, client SDK, $ (Bun shell).
Plugins return a hooks object with tool registrations and event handlers.

Return a structured requirements document.`,
      context: { pluginName: args.pluginName, description: args.description, requestedComponents: args.components },
      instructions: [
        'Identify all required OpenCode plugin components',
        'Map hook events to use cases',
        'Define custom tool schemas',
        'Plan agent definitions with modes (primary/subagent)',
        'Return structured JSON requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'config', 'dependencies'],
      properties: {
        components: { type: 'object' },
        config: { type: 'object' },
        dependencies: { type: 'array' },
        hookEvents: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const scaffoldPluginTask = defineTask('oc-scaffold-plugin', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold OpenCode plugin directory structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OpenCode plugin scaffolding specialist',
      task: `Create the directory structure for OpenCode plugin "${args.pluginName}" at ${args.outputDir}.

Requirements:
${JSON.stringify(args.requirements, null, 2)}

Steps:
1. Create plugin source directory with TypeScript entry point
2. Create .opencode/ directories for agents and commands
3. Write package.json for npm distribution:
\`\`\`json
{
  "name": "${args.npmScope ? args.npmScope + '/' : ''}${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.description}",
  "main": "src/index.ts",
  "type": "module",
  "files": ["src/", ".opencode/", "opencode.json"],
  "keywords": ["opencode", "opencode-plugin"],
  "peerDependencies": {
    "@opencode-ai/plugin": "*"
  }
}
\`\`\`

4. Write opencode.json with plugin, agent, command, and mcp config:
\`\`\`json
{
  "plugin": {
    "${args.pluginName}": {
      "source": "./src/index.ts"
    }
  },
  "agent": {},
  "command": {},
  "mcp": {}
}
\`\`\`

5. Create tsconfig.json for TypeScript

Return list of created files and directories.`,
      context: { pluginName: args.pluginName, outputDir: args.outputDir, requirements: args.requirements, npmScope: args.npmScope, author: args.author },
      instructions: [
        'Create plugin directory structure',
        'Write package.json for npm',
        'Write opencode.json with plugin config',
        'Create .opencode/ directories',
        'Return created files list'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['pluginDir', 'createdFiles', 'createdDirs'],
      properties: {
        pluginDir: { type: 'string' },
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

const implementComponentsTask = defineTask('oc-implement-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement all OpenCode plugin components',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OpenCode plugin developer',
      task: `Implement all components for OpenCode plugin "${args.pluginName}" at ${args.pluginDir}.

Requirements:
${JSON.stringify(args.requirements, null, 2)}

### Plugin Entry Point (src/index.ts)
Export async function receiving context, returning hooks object:
\`\`\`typescript
import type { Plugin } from '@opencode-ai/plugin';
import { z } from 'zod';

export default async function(ctx): Plugin {
  return {
    tools: {
      'tool-name': {
        description: 'What this tool does',
        parameters: z.object({ /* Zod schema */ }),
        execute: async (args) => { /* implementation */ }
      }
    },
    hooks: {
      'tool.execute.before': async (event) => { /* approve/deny/modify */ },
      'session.idle': async (event) => { /* orchestration re-entry */ },
      'file.edited': async (event) => { /* react to file changes */ }
    }
  };
}
\`\`\`

### Custom Agents (.opencode/agents/<name>.md)
Markdown with YAML frontmatter:
\`\`\`markdown
---
name: agent-name
mode: subagent
model: claude-sonnet-4-20250514
temperature: 0.3
maxSteps: 50
---
Agent instructions...
\`\`\`
Modes: primary, subagent, all. Invoked via @name syntax.

### Commands (.opencode/commands/<name>.md or opencode.json command key)
Markdown command definitions or JSON config entries.

### MCP Config (opencode.json mcp key)
MCP server definitions with stdio or HTTP/SSE transports.

Implement ALL components listed in the requirements.`,
      context: { pluginName: args.pluginName, pluginDir: args.pluginDir, requirements: args.requirements },
      instructions: [
        'Write src/index.ts with tools and hooks',
        'Create custom agent markdown files',
        'Create command files',
        'Configure MCP servers if needed',
        'Return list of implemented files'
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

const testAndValidateTask = defineTask('oc-test-validate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate OpenCode plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer for OpenCode plugins',
      task: `Validate the OpenCode plugin at ${args.pluginDir}.

Checks:
1. src/index.ts exports a default async function
2. Tools have valid Zod schemas
3. Hook event names are valid OpenCode events
4. Agent markdown files have valid YAML frontmatter (name, mode required)
5. Commands are valid markdown
6. opencode.json is valid JSON with correct plugin/agent/command/mcp keys
7. package.json has correct fields and @opencode-ai/plugin peer dependency
8. TypeScript compiles without errors

Return structured validation report.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName },
      instructions: ['Validate all components', 'Return pass/fail report'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'checks', 'issues'],
      properties: { valid: { type: 'boolean' }, checks: { type: 'array' }, issues: { type: 'array' } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const fixValidationIssuesTask = defineTask('oc-fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix validation issues in OpenCode plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Plugin maintainer',
      task: `Fix these validation issues in the plugin at ${args.pluginDir}:
${JSON.stringify(args.issues, null, 2)}
Fix each issue and verify the fix.`,
      context: { pluginDir: args.pluginDir, issues: args.issues },
      instructions: ['Fix each issue', 'Return summary'],
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

const setupDistributionTask = defineTask('oc-setup-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up OpenCode plugin distribution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OpenCode plugin distribution specialist',
      task: `Prepare the plugin "${args.pluginName}" at ${args.pluginDir} for distribution.

OpenCode plugins are distributed via:
1. **npm packages** — Primary distribution. Auto-installed via Bun to ~/.cache/opencode/node_modules/
   Users add to opencode.json: { "plugin": { "${args.pluginName}": { "source": "npm:${args.npmScope ? args.npmScope + '/' : ''}${args.pluginName}" } } }
2. **Local files** — Copy to .opencode/plugins/ (project) or ~/.config/opencode/plugins/ (global)
3. **awesome-opencode** — Community listing at github.com/awesome-opencode/awesome-opencode

Steps:
1. Finalize package.json for npm publication
2. Create install.md with instructions for both npm and local install
3. Create uninstall.md
4. Create configure.md
5. Create CHANGELOG.md

Write all distribution files.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, description: args.description, author: args.author, npmScope: args.npmScope },
      instructions: ['Create all distribution files', 'Return file list'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionFiles'],
      properties: { distributionFiles: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const generateDocumentationTask = defineTask('oc-generate-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate OpenCode plugin documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer for OpenCode plugins',
      task: `Create documentation for the plugin "${args.pluginName}" at ${args.pluginDir}.

Create:
1. README.md — overview, installation, configuration, usage, components
2. USAGE.md — detailed usage guide per component (tools, hooks, agents, commands)
3. examples/ — example opencode.json configurations

Document the plugin thoroughly.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, requirements: args.requirements, components: args.components },
      instructions: ['Write README.md', 'Write USAGE.md', 'Create examples/', 'Return file list'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationFiles'],
      properties: { documentationFiles: { type: 'array', items: { type: 'string' } } }
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
    description,
    outputDir = '.',
    components = {},
    author = 'unknown',
    npmScope = ''
  } = inputs;

  const pluginDir = `${outputDir}/${pluginName}`;
  const startTime = ctx.now();

  ctx.log('info', `Creating OpenCode plugin "${pluginName}" at ${pluginDir}`);

  // Phase 1: Requirements Analysis
  ctx.log('info', 'Phase 1: Analyzing plugin requirements');
  const requirements = await ctx.task(analyzeRequirementsTask, {
    pluginName, description, components
  });

  await ctx.breakpoint({
    question: `Requirements analysis complete for OpenCode plugin "${pluginName}". Review the component inventory (tools, hooks, agents, commands). Approve to proceed.`,
    options: ['Approve — proceed to scaffolding', 'Revise — adjust requirements'],
    expert: 'owner'
  });

  // Phase 2: Scaffold Plugin Structure
  ctx.log('info', 'Phase 2: Scaffolding plugin structure');
  const scaffold = await ctx.task(scaffoldPluginTask, {
    pluginName, description, outputDir, requirements, author, npmScope
  });

  // Phase 3: Implement Components
  ctx.log('info', 'Phase 3: Implementing plugin components');
  const implemented = await ctx.task(implementComponentsTask, {
    pluginName, pluginDir, requirements
  });

  // Phase 4: Testing & Validation
  ctx.log('info', 'Phase 4: Testing and validating plugin');
  const validation = await ctx.task(testAndValidateTask, {
    pluginDir, pluginName
  });

  if (!validation.valid && validation.issues && validation.issues.length > 0) {
    ctx.log('warn', `Found ${validation.issues.length} validation issues, fixing...`);
    await ctx.task(fixValidationIssuesTask, { pluginDir, issues: validation.issues });
  }

  await ctx.breakpoint({
    question: `Plugin implementation complete. ${validation.valid ? 'All checks passed.' : `Fixed ${validation.issues?.length || 0} issues.`} Review at ${pluginDir}. Approve to proceed with distribution.`,
    options: ['Approve — proceed to distribution', 'Reject — needs more work'],
    expert: 'owner'
  });

  // Phase 5: Distribution Setup
  ctx.log('info', 'Phase 5: Setting up distribution');
  const distribution = await ctx.task(setupDistributionTask, {
    pluginDir, pluginName, description, author, npmScope
  });

  // Phase 6: Documentation
  ctx.log('info', 'Phase 6: Generating documentation');
  const documentation = await ctx.task(generateDocumentationTask, {
    pluginDir, pluginName, requirements, components: implemented
  });

  ctx.log('info', `OpenCode plugin "${pluginName}" creation complete`);

  return {
    success: true,
    pluginDir,
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

/**
 * @process meta/harnesses/github-copilot/plugin-creation
 * @description Create and distribute a GitHub Copilot plugin with plugin.json manifest,
 *   hooks.json (version 1 format: sessionStart, sessionEnd, userPromptSubmitted, preToolUse, postToolUse,
 *   agentStop, subagentStop, errorOccurred), .github/agents/*.agent.md, skills/<name>/SKILL.md,
 *   commands/*.md, AGENTS.md, .github/instructions/**/*.instructions.md, MCP configs,
 *   copilot-setup-steps.yml, and npm distribution
 * @inputs { extensionName: string, description: string, components?: object, outputDir?: string, repoOwner?: string, author?: string }
 * @outputs { success: boolean, outputDir: string, agents: array, hooks: array, instructions: array, distribution: object }
 * @agent process-architect specializations/meta/agents/process-architect/AGENT.md
 * @agent quality-assessor specializations/meta/agents/quality-assessor/AGENT.md
 * @agent technical-writer specializations/meta/agents/technical-writer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const requirementsAnalysisTask = defineTask('copilot-ext-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze GitHub Copilot extension requirements',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Copilot extension architect with deep knowledge of the Copilot customization system',
      task: `Analyze requirements for a GitHub Copilot extension called "${args.extensionName}".

GitHub Copilot extensions use file-based configuration in the .github/ directory:

### 1. Agents (.github/agents/*.agent.md)
Custom agents with YAML frontmatter and markdown body instructions:
---
name: <agent-name>
description: <what this agent does>
target: <copilot-chat|copilot-workspace|copilot-cli>
tools:
  - <tool-name>
model: <gpt-4o|claude-sonnet-4-20250514|etc.>
mcp-servers:
  - <server-name>
---
<Agent instructions in markdown>

Agents are invoked with @<agent-name> in Copilot Chat.
They can reference MCP servers for tool access.

### 2. Plugin Manifest (plugin.json)
The plugin root contains a plugin.json manifest:
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "description": "<description>",
  "author": { "name": "<author>" },
  "license": "MIT",
  "skills": "skills/",
  "hooks": "hooks.json",
  "commands": "commands/",
  "agents": "AGENTS.md",
  "repository": { "type": "git", "url": "<repo-url>" },
  "keywords": []
}

### 3. Hooks (hooks.json)
Version 1 format with 8 event types and bash/powershell scripts:
{
  "version": 1,
  "hooks": {
    "sessionStart": [{ "type": "command", "bash": "./hooks/session-start.sh", "powershell": "./hooks/session-start.ps1", "timeoutSec": 30 }],
    "sessionEnd": [{ "type": "command", "bash": "./hooks/session-end.sh", "powershell": "./hooks/session-end.ps1", "timeoutSec": 30 }],
    "userPromptSubmitted": [{ "type": "command", "bash": "./hooks/user-prompt-submitted.sh", "powershell": "./hooks/user-prompt-submitted.ps1", "timeoutSec": 30 }]
  }
}

Event types: sessionStart, sessionEnd, userPromptSubmitted, preToolUse, postToolUse, agentStop, subagentStop, errorOccurred

### 4. Skills (skills/<name>/SKILL.md)
Folders with SKILL.md files following the AgentSkills.io standard

### 3. Instructions (.github/instructions/**/*.instructions.md)
Repository-level instruction files that customize Copilot behavior:
- .github/instructions/coding-standards.instructions.md
- .github/instructions/security/review.instructions.md
- Organized in subdirectories by concern
- Copilot reads these as context for all interactions

### 4. MCP Server Dependencies (copilot-setup-steps.yml)
Workflow file that installs MCP server dependencies:
name: "Copilot Setup Steps"
steps:
  - name: "Install MCP dependencies"
    run: |
      npm install -g @scope/mcp-server-name
  - name: "Start MCP server"
    run: |
      npx @scope/mcp-server-name --stdio

### 5. Distribution
- Primary: commit files to .github/ in the repo
- Community: submit to awesome-copilot lists
- Organization: share via GitHub organization templates
- Marketplace: GitHub Marketplace for Copilot extensions (if applicable)

Analyze the following:
1. Which agents should be created? (name, target, tools, model)
2. Which hooks should be configured? (events, conditions)
3. Which instruction files are needed? (categories, concerns)
4. Which MCP servers are required? (dependencies)
5. How should the extension be distributed?

Extension description: ${args.description}
Components requested: ${JSON.stringify(args.components || {})}`,
      context: {
        extensionName: args.extensionName,
        description: args.description,
        components: args.components,
        repoOwner: args.repoOwner
      },
      instructions: [
        'Analyze extension purpose against Copilot customization capabilities',
        'Plan agents with appropriate targets and tool/MCP requirements',
        'Identify which of the 8 hook events are relevant',
        'Determine instruction file categories',
        'Plan MCP server dependencies for copilot-setup-steps.yml',
        'Produce structured requirements'
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
            agents: { type: 'array', items: { type: 'object' } },
            hooks: { type: 'array', items: { type: 'object' } },
            instructions: { type: 'array', items: { type: 'object' } },
            mcpServers: { type: 'array', items: { type: 'object' } }
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

const scaffoldStructureTask = defineTask('copilot-ext-scaffold', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold GitHub Copilot extension directory structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Copilot extension scaffolding engineer',
      task: `Create the directory structure for GitHub Copilot extension "${args.extensionName}" at ${args.outputDir}.

Required directory layout:
${args.outputDir}/
  plugin.json                      # Plugin manifest (name, version, skills, hooks, commands, agents)
  hooks.json                       # Hook definitions (version 1 format)
  hooks/
    session-start.sh               # Unix hook scripts
    session-start.ps1              # Windows hook scripts
    session-end.sh
    session-end.ps1
    user-prompt-submitted.sh
    user-prompt-submitted.ps1
  skills/
    <skill-name>/SKILL.md          # Skills (SKILL.md per skill)
  commands/
    <command>.md                   # Command definitions
  .github/
    plugin.json                    # .github-scoped manifest copy
    agents/
      <agent-name>.agent.md        # Custom agents (one per file)
    instructions/
      <category>/
        <concern>.instructions.md  # Instruction files (organized by category)
  AGENTS.md                        # Root-level agent instructions
  bin/
    install.js                     # npm postinstall script
    cli.js                         # Plugin CLI entry point
  scripts/
    team-install.js                # Team deployment script
  package.json                     # npm distribution manifest
  README.md                        # Extension documentation

Important conventions:
- Plugin manifest is plugin.json at package root
- hooks.json uses version 1 format with bash/powershell scripts
- Agent files MUST end in .agent.md
- Instruction files MUST end in .instructions.md
- .github/plugin.json is a copy for org-wide distribution

Create all directories and placeholder files. Do NOT write implementations yet.

Planned agents: ${JSON.stringify(args.agents || [])}
Planned hooks: ${JSON.stringify(args.hooks || [])}
Planned instruction categories: ${JSON.stringify(args.instructionCategories || [])}`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        requirements: args.requirements,
        agents: args.agents,
        hooks: args.hooks,
        instructionCategories: args.instructionCategories
      },
      instructions: [
        'Create .github/agents/, .github/hooks/, .github/instructions/ directories',
        'Create subdirectories under instructions/ per category',
        'Create copilot-setup-steps.yml stub at project root',
        'Do NOT create package.json -- Copilot uses file-based config',
        'Do NOT write implementation content yet'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['outputDir', 'directories'],
      properties: {
        outputDir: { type: 'string' },
        directories: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'string' } },
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

const implementAgentsTask = defineTask('copilot-ext-agents', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create GitHub Copilot agent definitions',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Copilot agent author',
      task: `Create agent definition files for Copilot extension "${args.extensionName}".

For each agent, create a .github/agents/<name>.agent.md file with:

### YAML Frontmatter (required fields)
---
name: <agent-name>
description: <concise description of what the agent does>
target: <copilot-chat|copilot-workspace|copilot-cli>
tools:
  - <tool-name-1>
  - <tool-name-2>
model: <preferred-model>
mcp-servers:
  - <server-name>
---

### Markdown Body (agent instructions)
Write comprehensive instructions that define:
- The agent's role and expertise
- How to handle different types of requests
- What tools to use and when
- Output format expectations
- Error handling guidance
- Context the agent should consider (repo structure, conventions)

The agent name becomes the @mention: @<name> in Copilot Chat.

Target options:
- copilot-chat: For conversational interactions
- copilot-workspace: For code generation and modification
- copilot-cli: For command-line assistance

Agents to create: ${JSON.stringify(args.agents)}
Write to: ${args.outputDir}/.github/agents/`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        agents: args.agents,
        requirements: args.requirements
      },
      instructions: [
        'Create one .agent.md file per agent in .github/agents/',
        'Include complete YAML frontmatter with all relevant fields',
        'Write detailed markdown instructions for each agent',
        'Ensure agent names are valid @-mention identifiers',
        'Reference MCP servers in frontmatter if tools are needed',
        'Include model preference based on agent complexity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['agents', 'files'],
      properties: {
        agents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              filename: { type: 'string' },
              target: { type: 'string' },
              tools: { type: 'array', items: { type: 'string' } },
              mcpServers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
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

const implementHooksTask = defineTask('copilot-ext-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create GitHub Copilot hook configurations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Copilot hook configuration engineer',
      task: `Create hook configuration files for Copilot extension "${args.extensionName}".

For each hook, create a .github/hooks/<event-name>.json file:

{
  "event": "<event-type>",
  "handler": "<path-to-handler-or-action>",
  "conditions": {
    "file_patterns": ["*.ts", "*.js"],
    "branch_patterns": ["main", "release/*"],
    "labels": ["needs-review"],
    "author_association": ["COLLABORATOR", "MEMBER"]
  },
  "config": {
    "model": "<preferred-model>",
    "instructions": "<inline-instructions-or-path>",
    "max_tokens": 4096,
    "temperature": 0.3
  }
}

Available event types (8 total):
1. sessionStart — new session begins or existing session resumes
2. sessionEnd — session completes or is terminated
3. userPromptSubmitted — user submits a prompt
4. preToolUse — before any tool execution (can approve/deny)
5. postToolUse — after a tool is used
6. agentStop — main agent finishes responding
7. subagentStop — subagent completes before returning to parent
8. errorOccurred — error during agent execution

Hooks use version 1 JSON format with bash/powershell scripts:
{
  "version": 1,
  "hooks": {
    "<eventType>": [{
      "type": "command",
      "bash": "./hooks/<script>.sh",
      "powershell": "./hooks/<script>.ps1",
      "timeoutSec": 30
    }]
  }
}

Hooks to create: ${JSON.stringify(args.hooks)}
Write to: ${args.outputDir}/.github/hooks/`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        hooks: args.hooks,
        requirements: args.requirements
      },
      instructions: [
        'Create one .json file per hook in .github/hooks/',
        'Use valid event types from the 8 available events',
        'Include appropriate conditions for filtering',
        'Configure model and instruction preferences',
        'Validate JSON structure before writing'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['hooks', 'files'],
      properties: {
        hooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              filename: { type: 'string' },
              conditions: { type: 'object' }
            }
          }
        },
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

const implementInstructionsTask = defineTask('copilot-ext-instructions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create GitHub Copilot instruction files',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Copilot instruction author creating repository-level guidance',
      task: `Create instruction files for Copilot extension "${args.extensionName}".

Instruction files go in .github/instructions/**/*.instructions.md and provide
repository-level context that Copilot reads for all interactions.

File naming convention:
- .github/instructions/<category>/<concern>.instructions.md
- Categories group related concerns (e.g., security/, testing/, architecture/)
- Copilot automatically discovers and reads all .instructions.md files

Instruction file format (plain markdown):
# <Title>

<Description of what guidance this provides>

## Rules

<Specific rules and constraints>

## Examples

<Code examples showing correct patterns>

## Anti-patterns

<What to avoid and why>

These files influence ALL Copilot interactions in the repo, not just specific agents.
They are additive -- all instruction files are loaded as context.

Instruction categories and files to create: ${JSON.stringify(args.instructionCategories)}
Write to: ${args.outputDir}/.github/instructions/`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        instructionCategories: args.instructionCategories,
        requirements: args.requirements
      },
      instructions: [
        'Create .instructions.md files organized by category subdirectories',
        'Write clear, actionable rules and examples',
        'Include anti-patterns to help Copilot avoid mistakes',
        'Keep each file focused on a single concern',
        'Remember: these apply to ALL Copilot interactions in the repo'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['instructions', 'files'],
      properties: {
        instructions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              filename: { type: 'string' },
              concern: { type: 'string' }
            }
          }
        },
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

const implementSetupStepsTask = defineTask('copilot-ext-setup-steps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create copilot-setup-steps.yml for MCP dependencies',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Actions and Copilot setup engineer',
      task: `Create copilot-setup-steps.yml for Copilot extension "${args.extensionName}".

The copilot-setup-steps.yml file at the project root defines setup steps that run
before Copilot sessions, primarily for installing MCP server dependencies.

Format:
name: "Copilot Setup Steps"
steps:
  - name: "<descriptive-step-name>"
    run: |
      <shell commands to install dependencies>
  - name: "<another-step>"
    run: |
      <more commands>
    env:
      KEY: value

Common patterns:
- Install npm MCP server packages: npm install -g @scope/mcp-server
- Install Python MCP servers: pip install mcp-server-name
- Start background MCP servers: npx @scope/mcp-server --stdio &
- Set up authentication tokens: export API_KEY=$COPILOT_SECRET_KEY

MCP servers needed: ${JSON.stringify(args.mcpServers)}
Write to: ${args.outputDir}/copilot-setup-steps.yml`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        mcpServers: args.mcpServers,
        requirements: args.requirements
      },
      instructions: [
        'Create copilot-setup-steps.yml at project root',
        'Include install steps for all required MCP servers',
        'Add environment variable configuration where needed',
        'Follow GitHub Actions step syntax',
        'Include the babysitter MCP server if orchestration is needed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['setupSteps', 'mcpServers'],
      properties: {
        setupSteps: { type: 'array', items: { type: 'object' } },
        mcpServers: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const testAndValidateTask = defineTask('copilot-ext-validate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate GitHub Copilot extension structure and content',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Copilot extension QA validator',
      task: `Validate the GitHub Copilot extension "${args.extensionName}" at ${args.outputDir}.

### Agent Validation
1. Verify .github/agents/ directory exists with .agent.md files
2. Verify each agent has valid YAML frontmatter (name, description, target)
3. Verify target values are valid (copilot-chat, copilot-workspace, copilot-cli)
4. Verify tool references match available tools or MCP server tools
5. Verify model references are valid model identifiers
6. Verify mcp-servers references match copilot-setup-steps.yml
7. Verify markdown body has substantive instructions

### Hook Validation
8. Verify .github/hooks/ directory exists with .json files
9. Verify each hook has a valid event type (one of the 8 supported events)
10. Verify JSON is parseable and structurally valid
11. Verify conditions use valid field names
12. Verify handler paths reference existing files or actions

### Instruction Validation
13. Verify .github/instructions/ directory structure
14. Verify all files end in .instructions.md
15. Verify instructions contain actionable rules, not just descriptions
16. Verify no conflicting instructions across files

### Setup Steps Validation
17. Verify copilot-setup-steps.yml exists at project root
18. Verify YAML is valid
19. Verify step names are descriptive
20. Verify MCP server packages referenced actually exist on npm/pypi

### Cross-Component Validation
21. Verify agents reference MCP servers that are in setup-steps
22. Verify hooks don't conflict with each other
23. Verify no circular references between components

Report all findings with severity and fix suggestions.`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        requirements: args.requirements
      },
      instructions: [
        'Validate all .agent.md files for correct YAML frontmatter',
        'Validate all hook .json files for correct event types',
        'Validate .instructions.md files for content quality',
        'Validate copilot-setup-steps.yml syntax',
        'Check cross-component references (agents -> MCP -> setup-steps)',
        'Report with severity levels'
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

const distributionSetupTask = defineTask('copilot-ext-distribute', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up distribution for GitHub Copilot extension',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub Copilot extension distribution engineer',
      task: `Set up distribution for Copilot extension "${args.extensionName}".

GitHub Copilot extensions are distributed via repository files, not packages.

### 1. Repository Distribution (primary)
- All files live in .github/ and are discovered automatically
- Commit .github/agents/, .github/hooks/, .github/instructions/
- Commit copilot-setup-steps.yml to project root
- Any collaborator with repo access gets the extension

### 2. GitHub Template Repository
- Create a template repo with the full .github/ structure
- Users create new repos from the template
- Include a setup wizard or README with configuration steps

### 3. Organization-Level Sharing
- GitHub organizations can set organization-level Copilot instructions
- Share agents and hooks across all org repos
- Use .github repository for org-wide defaults

### 4. Awesome-Copilot Community Lists
- Submit to awesome-copilot curated lists
- Include: name, description, agents, hooks, instructions
- Provide a one-line install: "copy .github/ to your repo"
- Link to the source repository

### 5. GitHub Marketplace (if applicable)
- For more complex extensions that include a GitHub App
- Requires review process and marketplace listing
- Only needed if the extension requires server-side components

### 6. Gist / Snippet Distribution
- Share individual agents or instruction files as GitHub Gists
- Useful for single-purpose configurations
- Easy to copy into existing projects

Create distribution documentation and any helper scripts (e.g., install.sh
that copies .github/ files to a target repo).`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        repoOwner: args.repoOwner,
        requirements: args.requirements
      },
      instructions: [
        'Document repo-based distribution as the primary method',
        'Create a helper script for copying to other repos',
        'Include awesome-copilot submission template',
        'Document organization-level sharing if applicable',
        'Include template repository setup instructions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionMethods'],
      properties: {
        distributionMethods: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'string' } },
        awesomeCopilotEntry: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const documentationTask = defineTask('copilot-ext-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive GitHub Copilot extension documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer specializing in GitHub Copilot extension documentation',
      task: `Create documentation for GitHub Copilot extension "${args.extensionName}" at ${args.outputDir}.

### README.md
1. **Extension Name and Description**
   - Clear description of what the extension provides
   - List of agents, hooks, and instruction categories

2. **Requirements**
   - GitHub Copilot subscription (Individual, Business, or Enterprise)
   - Repository access permissions
   - MCP server dependencies (if any)

3. **Installation**
   - Copy .github/ directory to your repo
   - Copy copilot-setup-steps.yml to project root
   - Run setup steps for MCP dependencies
   - Verify with Copilot Chat: "@<agent-name> hello"

4. **Agents Reference**
   For each agent:
   - Name and @-mention syntax
   - Target (chat, workspace, cli)
   - Tools and MCP servers available
   - Usage examples with sample prompts and responses
   - Best practices and limitations

5. **Hooks Reference**
   For each hook:
   - Event type and trigger conditions
   - Configuration options
   - Example scenarios
   - How to customize conditions

6. **Instructions Reference**
   For each instruction file:
   - Category and concern
   - What behavior it influences
   - How to customize or disable

7. **MCP Server Dependencies**
   - List of required MCP servers
   - Installation instructions
   - Configuration and environment variables
   - Troubleshooting connection issues

8. **Customization**
   - How to modify agent instructions
   - How to add/remove hooks
   - How to override instruction files
   - How to add new MCP servers

9. **Troubleshooting**
   - Agent not responding
   - Hook not firing
   - MCP server connection failures
   - Permission issues

### CHANGELOG.md
## [1.0.0] - ${new Date().toISOString().split('T')[0]}
### Added
- Initial release
- <list all agents, hooks, instruction categories>

Analysis: ${JSON.stringify(args.analysis)}`,
      context: {
        extensionName: args.extensionName,
        outputDir: args.outputDir,
        analysis: args.analysis,
        agents: args.agents,
        hooks: args.hooks,
        instructions: args.instructions
      },
      instructions: [
        'Write comprehensive README with all sections',
        'Include usage examples for each agent with @-mention syntax',
        'Document all hook events and conditions',
        'List all instruction files with descriptions',
        'Create CHANGELOG.md with initial release',
        'Include troubleshooting for common Copilot issues'
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
 * GitHub Copilot Extension Creation Process
 *
 * Creates a complete GitHub Copilot extension with agents (.agent.md),
 * hooks (.json for 8 event types), instruction files (.instructions.md),
 * MCP setup (copilot-setup-steps.yml), and distribution via repo files.
 *
 * Phases:
 * 1. Requirements Analysis - understand extension purpose and Copilot components
 * 2. Scaffold Structure - create .github/ directory layout
 * 3. Implement Components - create agents, hooks, instructions, setup steps
 * 4. Testing & Validation - validate YAML frontmatter, JSON hooks, cross-references
 * 5. Distribution Setup - prepare for repo sharing and awesome-copilot
 * 6. Documentation - create README, usage examples, changelog
 */
export async function process(inputs, ctx) {
  const {
    extensionName,
    description,
    components = {},
    outputDir = '.',
    repoOwner = 'unknown'
  } = inputs;

  const artifacts = [];

  ctx.log('info', `Creating GitHub Copilot extension: ${extensionName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Copilot extension requirements');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    extensionName,
    description,
    components,
    repoOwner
  });

  artifacts.push(...(requirements.artifacts || []));

  // ============================================================================
  // PHASE 2: SCAFFOLD STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Scaffolding .github/ directory structure');

  let scaffold = await ctx.task(scaffoldStructureTask, {
    extensionName,
    outputDir,
    requirements: requirements.analysis,
    agents: requirements.analysis.agents,
    hooks: requirements.analysis.hooks,
    instructionCategories: requirements.analysis.instructions
  });

  artifacts.push(...(scaffold.artifacts || []));

  let lastFeedback_structureReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_structureReview) {
      scaffold = await ctx.task(scaffoldStructureTask, {
        extensionName, outputDir,
        requirements: requirements.analysis,
        agents: requirements.analysis.agents,
        hooks: requirements.analysis.hooks,
        instructionCategories: requirements.analysis.instructions,
        feedback: lastFeedback_structureReview,
        attempt: attempt + 1
      });
    }
    const structureReview = await ctx.breakpoint({
      question: `Copilot extension "${extensionName}" scaffolded with ${scaffold.fileCount || 'multiple'} files in .github/. Review the agent, hook, and instruction layout?`,
      title: 'Copilot Extension Structure Review',
      context: {
        runId: ctx.runId,
        files: (scaffold.artifacts || []).map(a => ({ path: a.path, label: a.label })),
        summary: {
          extensionName,
          agents: requirements.analysis.agents?.length || 0,
          hooks: requirements.analysis.hooks?.length || 0,
          instructions: requirements.analysis.instructions?.length || 0,
          directories: scaffold.directories
        }
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

  ctx.log('info', 'Phase 3a: Creating agent definitions');

  const agentResults = await ctx.task(implementAgentsTask, {
    extensionName,
    outputDir,
    agents: requirements.analysis.agents,
    requirements: requirements.analysis
  });

  artifacts.push(...(agentResults.artifacts || []));

  ctx.log('info', 'Phase 3b: Creating hook configurations');

  const hookResults = await ctx.task(implementHooksTask, {
    extensionName,
    outputDir,
    hooks: requirements.analysis.hooks,
    requirements: requirements.analysis
  });

  artifacts.push(...(hookResults.artifacts || []));

  ctx.log('info', 'Phase 3c: Creating instruction files');

  const instructionResults = await ctx.task(implementInstructionsTask, {
    extensionName,
    outputDir,
    instructionCategories: requirements.analysis.instructions,
    requirements: requirements.analysis
  });

  artifacts.push(...(instructionResults.artifacts || []));

  ctx.log('info', 'Phase 3d: Creating copilot-setup-steps.yml');

  const setupResults = await ctx.task(implementSetupStepsTask, {
    extensionName,
    outputDir,
    mcpServers: requirements.analysis.mcpServers,
    requirements: requirements.analysis
  });

  artifacts.push(...(setupResults.artifacts || []));

  // ============================================================================
  // PHASE 4: TESTING & VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating Copilot extension');

  let validation = await ctx.task(testAndValidateTask, {
    extensionName,
    outputDir,
    requirements: requirements.analysis
  });

  artifacts.push(...(validation.artifacts || []));

  if (!validation.valid) {
    let lastFeedback_validationReview = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_validationReview) {
        validation = await ctx.task(testAndValidateTask, {
          extensionName, outputDir, requirements: requirements.analysis,
          feedback: lastFeedback_validationReview, attempt: attempt + 1
        });
      }
      const validationReview = await ctx.breakpoint({
        question: `Copilot extension validation found ${(validation.issues || []).length} issues. Fix or proceed?`,
        title: 'Copilot Extension Validation Results',
        context: { runId: ctx.runId, checks: validation.checks, issues: validation.issues },
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

  ctx.log('info', 'Phase 5: Setting up distribution');

  const distribution = await ctx.task(distributionSetupTask, {
    extensionName,
    outputDir,
    repoOwner,
    requirements: requirements.analysis
  });

  artifacts.push(...(distribution.artifacts || []));

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating documentation');

  const docs = await ctx.task(documentationTask, {
    extensionName,
    outputDir,
    analysis: requirements.analysis,
    agents: agentResults.agents,
    hooks: hookResults.hooks,
    instructions: instructionResults.instructions
  });

  artifacts.push(...(docs.artifacts || []));

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  ctx.log('info', `GitHub Copilot extension "${extensionName}" creation complete`);

  return {
    success: true,
    outputDir,
    agents: agentResults.agents || [],
    hooks: hookResults.hooks || [],
    instructions: instructionResults.instructions || [],
    setupSteps: setupResults.setupSteps || [],
    distribution: {
      methods: distribution.distributionMethods,
      awesomeCopilotEntry: distribution.awesomeCopilotEntry
    },
    artifacts
  };
}

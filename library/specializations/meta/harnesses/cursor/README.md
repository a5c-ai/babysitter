# Cursor Harness Extensibility Reference

> Comprehensive reference for Cursor IDE extensibility surfaces relevant to Babysitter harness integration.
> Last updated: 2026-04-02

## Overview

Cursor is an AI-first code editor built on VS Code, developed by Anysphere Inc. It provides native AI features (Tab completion, Chat, Composer/Agent mode) alongside a growing plugin and extensibility ecosystem. Official documentation lives at [cursor.com/docs](https://docs.cursor.com/).

Cursor uses a fork of VS Code and maintains broad compatibility with VS Code extensions while layering its own AI-native extensibility surfaces on top.

---

## Plugin System (v2.5, February 2026)

Cursor introduced a first-party plugin system in v2.5 (February 2026), separate from VS Code extensions. Plugins are declared via a `.cursor-plugin/plugin.json` manifest and can provide skills, commands, rules, subagents, MCP servers, and hooks.

### Plugin Manifest: `.cursor-plugin/plugin.json`

The manifest is the entry point for all plugin components. It lives at the root of the plugin package.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique plugin identifier (lowercase, hyphens allowed) |
| `version` | string | Yes | Semver version |
| `displayName` | string | No | Human-readable name for marketplace display |
| `description` | string | Yes | Short description of the plugin |
| `author` | string or object | Yes | Author name or `{ name, email }` object |
| `license` | string | No | SPDX license identifier |
| `keywords` | string[] | No | Discovery tags for marketplace search |
| `skills` | string | No | Relative path to skills directory |
| `commands` | string | No | Relative path to commands directory |
| `hooks` | string | No | Relative path to hooks JSON file |
| `rules` | string | No | Relative path to rules directory |
| `subagents` | string | No | Relative path to subagents directory |
| `mcpServers` | object | No | MCP server configuration |

### Real-World Example (Babysitter Plugin)

```json
{
  "name": "babysitter",
  "version": "0.1.0",
  "description": "Orchestrate complex, multi-step workflows with event-sourced state management, hook-based extensibility, and human-in-the-loop approval -- powered by the Babysitter SDK",
  "author": "a5c.ai",
  "license": "MIT",
  "hooks": "hooks/hooks-cursor.json",
  "commands": "commands/",
  "skills": "skills/",
  "repository": {
    "type": "git",
    "url": "https://github.com/a5c-ai/babysitter"
  },
  "keywords": [
    "orchestration", "workflow", "automation", "event-sourced",
    "hooks", "cursor", "agent", "LLM"
  ]
}
```

See [examples/plugin.json](examples/plugin.json) for a complete example.

### Component Types

Plugins can bundle any combination of the following components:

- **Skills** -- AI-triggerable capabilities with SKILL.md definitions
- **Commands** -- Slash commands invocable via `/command-name` in chat
- **Rules** -- Context injection rules (`.mdc` files)
- **Subagents** -- Delegated agent definitions
- **MCP Servers** -- Model Context Protocol server integrations
- **Hooks** -- Lifecycle event handlers

---

## Rules

Rules are Cursor's mechanism for injecting context into AI conversations. They live in `.cursor/rules/` as `.mdc` (Markdown with Components) files.

### Rule File Format

Each `.mdc` file has YAML frontmatter followed by markdown content:

```markdown
---
description: When and why this rule applies
globs: "src/**/*.ts"
alwaysApply: false
---

# Rule Title

Rule content in markdown. This gets injected into the AI context
when the rule's activation conditions are met.
```

### Rule Types

Rules are categorized by how they activate:

| Type | `alwaysApply` | `globs` | `description` | Activation |
|------|---------------|---------|---------------|------------|
| **Always** | `true` | -- | -- | Injected into every conversation |
| **Auto-Attached** | `false` | pattern(s) | optional | Injected when referenced files match glob |
| **Agent-Requested** | `false` | -- | present | AI decides whether to include based on description |
| **Manual** | `false` | -- | -- | Only included when explicitly `@`-referenced |

- **Always rules**: Best for project-wide conventions, coding standards, persona instructions.
- **Auto-Attached rules**: Best for file-type-specific guidance (e.g., testing patterns for `*.test.ts`).
- **Agent-Requested rules**: Best for situational context the AI can self-select (e.g., "deployment procedures").
- **Manual rules**: Best for rarely-needed reference material.

### Glob Patterns

The `globs` field accepts glob patterns (or arrays of patterns) to match against file paths:

```yaml
globs: "src/**/*.ts"           # Single pattern
globs:
  - "src/**/*.ts"              # Array of patterns
  - "lib/**/*.js"
  - "!**/*.test.ts"            # Negation
```

### Legacy: `.cursorrules`

Before the rules system, Cursor supported a `.cursorrules` file at the project root. This is a plain text file (no frontmatter) that behaves like an "Always" rule. It is still supported but deprecated in favor of `.cursor/rules/`.

See [examples/rule.mdc](examples/rule.mdc) for a complete example.

---

## Skills

Skills are AI-triggerable actions defined by a `SKILL.md` file within a plugin's skills directory. Each skill lives in its own subdirectory.

### SKILL.md Format

```markdown
---
name: my-skill
description: >-
  Concise description of what this skill does and when to use it.
  The description is the primary trigger mechanism -- the AI uses it
  to decide when to invoke the skill. Maximum 1024 characters.
---

# Skill Title

Detailed instructions for the AI when this skill is activated.
Can include code examples, step-by-step procedures, etc.
```

### Key Properties

| Field | Type | Limit | Description |
|-------|------|-------|-------------|
| `name` | string | -- | Unique skill identifier within the plugin |
| `description` | string | 1024 chars | Trigger description -- the AI reads this to decide activation |

The `description` field is critical: it serves as the primary mechanism by which the AI decides whether to invoke the skill. Write descriptions that clearly enumerate trigger phrases and use cases.

### Directory Structure

```
skills/
  my-skill/
    SKILL.md
  another-skill/
    SKILL.md
```

---

## Commands

Commands provide slash-command interfaces (`/command-name`) in the Cursor chat. Each command is a markdown file in the plugin's commands directory.

### Command File Format

```markdown
---
description: What this command does
argument-hint: Description of expected arguments
allowed-tools: Read, Write, Bash, Edit, Grep, Glob
---

Instructions for the AI when this command is invoked.
```

### Key Properties

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Shown in the command palette and help |
| `argument-hint` | string | Placeholder text describing expected arguments |
| `allowed-tools` | string | Comma-separated list of tools the command may use |

Commands are stored as `commands/<name>.md` where the filename (minus `.md`) becomes the slash command name.

---

## Subagents

Subagents are delegated AI agents defined in `.cursor/agents/` as markdown files. They allow decomposition of complex tasks into specialized sub-agents with constrained capabilities.

### Subagent File Format

```markdown
---
name: code-reviewer
description: Reviews code changes for quality and correctness
model: inherit
readonly: true
is_background: false
---

# Code Reviewer Agent

You are a code review specialist. Analyze the provided changes and report
issues organized by severity.

## Instructions

1. Check for type safety violations
2. Identify potential bugs
3. Suggest improvements
```

### Key Properties

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | -- | Agent identifier |
| `description` | string | -- | When and how the agent should be used |
| `model` | string | `inherit` | Model selection: `inherit` (same as parent), `fast` (quick model), or a specific model ID |
| `readonly` | boolean | `false` | If `true`, the agent cannot modify files |
| `is_background` | boolean | `false` | If `true`, runs in the background without blocking |

### Invocation

Subagents are invoked via `@agent-name` in chat or programmatically by the parent agent. Background agents run concurrently and report results asynchronously.

---

## Hooks

Hooks provide lifecycle event handlers that execute at specific points during Cursor sessions. Introduced in v1.7, with significant expansions in v2.4.

### Hook Events

| Event | Version | Description |
|-------|---------|-------------|
| `beforeSubmitPrompt` | v1.7 | Before a user prompt is sent to the AI |
| `beforeShellExecution` | v1.7 | Before a terminal command is executed |
| `beforeMCPExecution` | v1.7 | Before an MCP tool call is executed |
| `beforeReadFile` | v1.7 | Before a file is read by the agent |
| `afterFileEdit` | v1.7 | After a file has been edited |
| `stop` | v1.7 | When the agent finishes its turn |

### PreToolUse and PostToolUse (v2.4)

Cursor v2.4 introduced `PreToolUse` and `PostToolUse` hook types, aligning with Claude Code's hook model. These provide finer-grained control over individual tool invocations:

- **PreToolUse**: Fires before any tool is invoked. Can block, modify, or approve the tool call.
- **PostToolUse**: Fires after a tool completes. Can trigger follow-up actions based on tool output.

### hooks.json Format

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "command",
        "bash": "bash \"./hooks/session-start.sh\"",
        "powershell": "powershell -NoProfile -ExecutionPolicy Bypass -File \"./hooks/session-start.ps1\"",
        "timeoutSec": 30
      }
    ],
    "stop": [
      {
        "type": "command",
        "bash": "bash \"./hooks/stop-hook.sh\"",
        "powershell": "powershell -NoProfile -ExecutionPolicy Bypass -File \"./hooks/stop-hook.ps1\"",
        "loop_limit": null
      }
    ]
  }
}
```

### Hook Object Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Hook type, typically `"command"` |
| `bash` | string | Yes* | Shell command for Unix/macOS |
| `powershell` | string | Yes* | PowerShell command for Windows |
| `timeoutSec` | number | No | Maximum execution time in seconds |
| `loop_limit` | number or null | No | For `stop` hooks: max re-entry count (`null` = unlimited) |

*At least one of `bash` or `powershell` must be provided.

### Discovery Locations (Priority Order)

Hooks are discovered from three locations, merged in priority order:

1. **Project**: `.cursor/hooks.json` -- project-specific hooks
2. **Enterprise**: `/etc/cursor/hooks.json` -- organization-wide enforcement (Linux/macOS) or equivalent Windows path
3. **User**: `~/.cursor/hooks.json` -- user-level personal hooks

Enterprise hooks cannot be overridden by project or user hooks, enabling centralized policy enforcement.

See [examples/hooks.json](examples/hooks.json) for a complete example.

---

## MCP (Model Context Protocol)

Cursor has full MCP support, enabling integration with external tool servers.

### Supported Transports

- **stdio** -- Local process communication via stdin/stdout
- **sse** -- Server-Sent Events over HTTP
- **streamable-http** -- Streamable HTTP transport (newer, preferred for remote servers)

### Configuration Files

| Scope | Path | Description |
|-------|------|-------------|
| Project | `.cursor/mcp.json` | Project-specific MCP servers |
| Global | `~/.cursor/mcp.json` | User-wide MCP servers |

### Configuration Format

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "env": {
        "API_KEY": "..."
      }
    },
    "remote-server": {
      "url": "https://mcp.example.com/sse",
      "transport": "sse"
    }
  }
}
```

### MCP Apps (v2.6)

Cursor v2.6 introduced MCP Apps, which allow MCP servers to provide interactive UI components rendered directly in the Cursor chat panel. This enables rich visual interfaces (charts, forms, dashboards) powered by MCP tool responses.

---

## Marketplace

### Cursor Marketplace (February 2026)

Cursor launched its official plugin marketplace at [cursor.com/marketplace](https://cursor.com/marketplace) in February 2026 alongside the v2.5 plugin system.

- Plugins are installable via `/add-plugin` in the editor
- Discovery through search and curated categories
- Version management and automatic updates

### Git-Based Marketplace Distribution

Plugins can also be distributed via git-based marketplace registries using `.cursor-plugin/marketplace.json`:

```json
{
  "name": "a5c-ai",
  "owner": {
    "name": "a5c.ai",
    "email": "support@a5c.ai"
  },
  "metadata": {
    "description": "Babysitter plugins for Cursor",
    "pluginRoot": "plugins"
  },
  "plugins": [
    {
      "name": "babysitter",
      "description": "Babysitter orchestration plugin for Cursor IDE and headless CLI mode",
      "version": "0.1.0",
      "source": "babysitter-cursor"
    }
  ]
}
```

The marketplace.json file lives at `.cursor-plugin/marketplace.json` in a repository and lists available plugins with their source directories.

### Team Marketplaces (v2.6)

Cursor v2.6 introduced Team Marketplaces, allowing organizations to host private plugin registries. This enables:

- Internal plugin distribution without public marketplace listing
- Centralized governance and version control
- Pre-approved plugin catalogs for enterprise teams

### Enterprise Governance

Enterprise deployments can enforce plugin policies through:

- Team marketplace restrictions (only allow plugins from approved sources)
- Enterprise hooks for audit and compliance
- `/etc/cursor/` configuration for organization-wide defaults

---

## Agent Features

### Cloud Agents

Cursor supports cloud-hosted agent execution, where agent sessions run in remote VMs rather than locally. This enables:

- Long-running tasks without local resource consumption
- Parallel agent execution across multiple VMs
- Handoff from local to cloud via the `&` prefix in chat

### Self-Hosted Agents (March 2026)

Self-hosted agent infrastructure was introduced in March 2026, allowing organizations to run agent VMs on their own infrastructure for data sovereignty and compliance.

### ACP for JetBrains

Cursor's Agent Communication Protocol (ACP) enables integration with JetBrains IDEs, allowing Cursor's AI capabilities to be used from IntelliJ, PyCharm, WebStorm, and other JetBrains products.

### CLI Agent

Cursor provides a CLI agent (`cursor-cli`) with multiple execution modes:

- **Plan mode**: Generate an execution plan without making changes
- **Ask mode**: Interactive Q&A without file modifications
- **Headless mode**: Fully automated execution for CI/CD pipelines

### Memory Tool

The Memory tool provides persistent context across sessions. The agent can store and retrieve project-specific knowledge that persists between conversations.

### Cloud Handoff

The `&` prefix in chat hands off the current task to a cloud agent. The local session receives updates as the cloud agent progresses.

---

## Permissions

### YOLO Mode

YOLO mode auto-approves terminal commands matching configured patterns. It applies only to terminal/shell commands -- MCP tool calls are NOT covered by YOLO mode and always require explicit approval (unless separately configured).

Configuration via Cursor settings:

```json
{
  "cursor.yolo.enabled": true,
  "cursor.yolo.allowPatterns": [
    "npm test",
    "npm run lint",
    "git status",
    "git diff"
  ]
}
```

### Readonly Subagents

Subagents with `readonly: true` cannot modify files, providing a safety boundary for review and analysis tasks.

### Hook-Based Enforcement

Hooks (especially enterprise hooks at `/etc/cursor/hooks.json`) can enforce policies:

- Block dangerous commands via `beforeShellExecution`
- Audit file access via `beforeReadFile`
- Validate edits via `afterFileEdit`
- Control MCP usage via `beforeMCPExecution`

Enterprise hooks take priority and cannot be overridden by project or user configuration.

---

## VS Code Compatibility

Cursor is built on a VS Code fork and maintains broad extension compatibility.

### Extension Registry

Cursor uses the **Open VSX Registry** (open-vsx.org) rather than Microsoft's Visual Studio Marketplace. Approximately 99% of VS Code extensions work without modification.

### Notable Exceptions

The following Microsoft-proprietary extensions are not available on Open VSX and do not work in Cursor:

- **Pylance** -- Python language server (use Pyright or Jedi instead)
- **C# Dev Kit** -- C# development tools (use OmniSharp-based alternatives)
- **Live Share** -- Real-time collaboration (no direct equivalent)

These are proprietary to Microsoft and restricted to official VS Code distributions.

---

## Ecosystem Resources

| Resource | URL | Description |
|----------|-----|-------------|
| awesome-cursorrules | github.com/PatrickJS/awesome-cursorrules | Community-curated rules collection |
| dotcursorrules.com | dotcursorrules.com | Rule templates and sharing |
| cursorrules.org | cursorrules.org | Rule directory and best practices |
| Cursor Forum | forum.cursor.com | Official community forum |
| Cursor Docs | docs.cursor.com | Official documentation |
| Cursor Changelog | cursor.com/changelog | Release notes and version history |

---

## Babysitter Integration: Key Notes

### Stop Hook Support

Cursor supports a `stop` hook that fires when the agent finishes its turn. The Babysitter Cursor plugin uses this for orchestration loop re-entry:

```json
{
  "version": 1,
  "hooks": {
    "stop": [
      {
        "type": "command",
        "bash": "bash \"./hooks/stop-hook.sh\"",
        "powershell": "powershell -NoProfile -ExecutionPolicy Bypass -File \"./hooks/stop-hook.ps1\"",
        "loop_limit": null
      }
    ]
  }
}
```

The `loop_limit` field controls how many times the stop hook can re-enter the orchestration loop:
- `null` — unlimited re-entry (used for Babysitter's deterministic replay)
- A number — maximum re-entry count before the loop terminates

This enables the same hook-driven orchestration model as Claude Code, with the stop hook calling `babysitter run:iterate` after each agent turn.

### Harness Adapter

The Cursor harness adapter is registered in the Babysitter SDK at:
- Adapter: `createCursorAdapter` in `packages/sdk/src/harness/adapters/`
- Discovery: Detected via `cursor` CLI availability
- Plugin: `plugins/babysitter-cursor/`

### Plugin Structure (Babysitter Cursor Plugin)

```
plugins/babysitter-cursor/
├── plugin.json              # Plugin manifest
├── hooks.json               # Hook configuration (version 1)
├── hooks/
│   ├── hooks-cursor.json    # Cursor-specific hooks
│   ├── session-start.sh     # Session start hook (Unix)
│   ├── session-start.ps1    # Session start hook (Windows)
│   ├── stop-hook.sh         # Stop hook (Unix) — orchestration re-entry
│   └── stop-hook.ps1        # Stop hook (Windows)
├── skills/                  # 10 skill directories
│   ├── babysit/SKILL.md
│   ├── call/SKILL.md
│   ├── plan/SKILL.md
│   ├── resume/SKILL.md
│   └── ...
├── commands/                # 15 command markdown files
│   ├── call.md
│   ├── plan.md
│   ├── resume.md
│   └── ...
├── scripts/
│   └── team-install.js
├── test/
├── package.json
├── versions.json
└── README.md
```

### Plugin Installation

The Babysitter plugin for Cursor is installed via:

```bash
babysitter plugin:install babysitter --project
# or via the Cursor marketplace: /add-plugin babysitter
```

---

## References

See [references.md](references.md) for a complete list of external references with URLs and access dates.

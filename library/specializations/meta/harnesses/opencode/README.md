# OpenCode Harness Extensibility

**Category**: Meta/Harness Documentation
**Harness**: OpenCode
**Status**: Active (135K+ stars, actively maintained)
**Babysitter Adapter**: `opencode`

## Overview

OpenCode is an open-source, provider-agnostic AI coding agent by Anomaly (formerly sst/opencode). It provides a terminal TUI, desktop app (beta), and VS Code extension. Not coupled to any single LLM provider -- supports Claude, OpenAI, Google, local models. Built-in LSP support and client/server architecture.

- **Repository**: [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode)
- **Language**: TypeScript
- **License**: MIT
- **Stars**: 135,479 (as of 2026-04-02)
- **npm package**: `opencode-ai`
- **Distribution**: npm, Homebrew, curl, Scoop, Chocolatey, AUR, Nix, mise
- **Surfaces**: Terminal TUI, Desktop App (macOS/Windows/Linux), VS Code extension

> **Reference**: [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode) (accessed 2026-04-02)

## Plugin Architecture

OpenCode has a plugin system that supports both local file plugins and npm package plugins.

### Plugin Loading

Plugins load from two sources:
1. **Local files**: JavaScript/TypeScript placed in `.opencode/plugins/` (project) or `~/.config/opencode/plugins/` (global)
2. **NPM packages**: Specified in `opencode.json` config, auto-installed via Bun to `~/.cache/opencode/node_modules/`

Load order: global config -> project config -> global plugins -> project plugins.

### Plugin Structure

Plugins are JS/TS modules exporting async functions that receive a rich context object (`project`, `directory`, `worktree`, `client` SDK, `$` Bun shell) and return a hooks object:

```typescript
// .opencode/plugins/my-plugin.ts
import type { Plugin } from '@opencode-ai/plugin';

export default async function(ctx): Plugin {
  // ctx provides: project, directory, worktree, client SDK, $ (Bun shell)
  return {
    // Register custom tools with Zod schemas
    tools: {
      'my-tool': {
        description: 'A custom tool',
        parameters: z.object({ query: z.string() }),
        execute: async (args) => { /* ... */ }
      }
    },
    // Register hooks
    hooks: {
      'tool.execute.before': async (event) => { /* intercept tool calls */ },
      'file.edited': async (event) => { /* react to file changes */ },
      'session.created': async (event) => { /* session lifecycle */ }
    }
  };
}
```

> **Reference**: [opencode.ai/docs/plugins/](https://opencode.ai/docs/plugins/) (accessed 2026-04-02), [npm: @opencode-ai/plugin](https://www.npmjs.com/package/@opencode-ai/plugin) (accessed 2026-04-02)

### Plugin Configuration

Plugins are configured in `opencode.json`:

```json
{
  "plugin": {
    "my-plugin": {
      "source": "npm:@scope/my-plugin",
      "config": { "key": "value" }
    },
    "local-plugin": {
      "source": "./plugins/local-plugin.ts"
    }
  }
}
```

## Built-in Tools

OpenCode ships with built-in tools that can be toggled via the `tools` config key. Additional tools can be registered by plugins.

| Tool | Description |
|------|-------------|
| `glob` | Find files matching glob patterns |
| `grep` | Search file contents with regex |
| `ls` | List directory contents |
| `view` | Read file contents |
| `write` | Write entire file contents |
| `edit` | Apply targeted edits to files |
| `patch` | Apply unified diff patches |
| `diagnostics` | Run LSP diagnostics on files |
| `bash` | Execute shell commands |
| `fetch` | Fetch URL contents |
| `sourcegraph` | Search code via Sourcegraph |
| `agent` | Delegate sub-tasks to a built-in sub-agent |

### Agent Tool

OpenCode includes a built-in sub-agent tool and supports custom agent definitions via the `agent` config key.

## Custom Agents

### Built-in Agents

| Agent | Mode | Description |
|-------|------|-------------|
| `build` | Primary | Full access, default agent |
| `plan` | Primary | Read-only analysis mode |
| `general` | Subagent | Multi-step research, invoked via `@general` |
| `explore` | Subagent | Fast read-only codebase search |
| `compaction` | System | Context compaction (hidden) |
| `title` | System | Title generation (hidden) |
| `summary` | System | Summary generation (hidden) |

### Custom Agent Definitions

Custom agents are defined via JSON config or markdown files with YAML frontmatter:

**JSON configuration** (in `opencode.json`):

```json
{
  "agent": {
    "reviewer": {
      "model": "claude-sonnet-4-20250514",
      "instructions": "You are a code reviewer...",
      "mode": "subagent",
      "temperature": 0.3,
      "maxSteps": 50,
      "permission": {
        "bash": "deny",
        "write": "deny"
      }
    }
  },
  "default_agent": "build"
}
```

**Markdown files** (in `.opencode/agents/` or `~/.config/opencode/agents/`):

```markdown
---
name: reviewer
mode: subagent
model: claude-sonnet-4-20250514
temperature: 0.3
maxSteps: 50
---

You are a code reviewer. Analyze code changes for...
```

### Agent Modes

| Mode | Description |
|------|-------------|
| `primary` | Full-capability agent with all tools |
| `subagent` | Delegated agent invoked via `@name` |
| `all` | Available in both primary and subagent contexts |

### Invocation

Agents are invoked via `@agentname` syntax in messages. Users can navigate between parent/child sessions via keybindings. Interactive creation available via `opencode agent create`.

> **Reference**: [opencode.ai/docs/agents/](https://opencode.ai/docs/agents/) (accessed 2026-04-02)

## Instructions / Rules

OpenCode supports instruction files via the `instructions` config key and `AGENTS.md`:

```json
{
  "instructions": [
    "docs/ARCHITECTURE.md",
    ".opencode/rules/*.md"
  ]
}
```

Glob patterns are supported for auto-discovery. The `AGENTS.md` file at project root (created by `/init` command) provides primary project instructions.

> **Reference**: [opencode.ai/docs/config/](https://opencode.ai/docs/config/) (accessed 2026-04-02)

## Custom Commands

OpenCode supports custom commands defined as markdown files. Commands are prompt templates that can be invoked by name during a conversation.

### Command Locations

| Scope | Directory | Prefix |
|-------|-----------|--------|
| User | `~/.config/opencode/commands/` | `user:` |
| Project | `<project>/.opencode/commands/` | `project:` |

### Command Format

Command files are plain markdown (`.md`) files. The filename (without extension) becomes the command name. Subdirectory organization is supported for grouping related commands.

```
~/.config/opencode/commands/
  review.md           -> user:review
  testing/
    unit.md           -> user:testing/unit
    integration.md    -> user:testing/integration

<project>/.opencode/commands/
  deploy.md           -> project:deploy
  debug.md            -> project:debug
```

### Placeholder Variables

Commands support `$NAME` placeholders that are substituted at invocation time:

```markdown
<!-- ~/.config/opencode/commands/explain.md -->
Explain the following code in $LANGUAGE, focusing on $ASPECT:

$CODE
```

### Example Command

```markdown
<!-- .opencode/commands/review.md -->
Review the following code for:
- Security vulnerabilities
- Performance issues
- Code style consistency

Focus area: $FOCUS

File: $FILE
```

## Hooks

OpenCode has a rich event-based hook system, exposed via plugins. Plugins return a hooks object keyed by event type.

### Hook Event Types

| Category | Event | Description |
|----------|-------|-------------|
| **Tool** | `tool.execute.before` | Before a tool is executed (can intercept/modify) |
| **Tool** | `tool.execute.after` | After a tool completes |
| **File** | `file.edited` | When a file is edited by the agent |
| **File** | `file.watcher.updated` | When the file watcher detects changes |
| **Session** | `session.created` | New session starts |
| **Session** | `session.compacted` | Session context is compacted |
| **Session** | `session.idle` | Session becomes idle (agent stop) |
| **Message** | `message.updated` | When a message is updated in the conversation |
| **Shell** | `shell.env` | Inject environment variables into shell commands |
| **TUI** | `tui.prompt.append` | Append content to TUI prompt |
| **TUI** | `tui.command.execute` | Custom TUI command execution |
| **LSP** | LSP hooks | Language server integration events |
| **Permission** | Permission hooks | Tool permission check events |
| **Server** | Server hooks | Server lifecycle events |
| **Todo** | Todo hooks | Task/todo management events |

### Hook Example

```typescript
export default async function(ctx) {
  return {
    hooks: {
      'tool.execute.before': async (event) => {
        // Approve, deny, or modify tool calls
        if (event.tool === 'bash' && event.args.command.includes('rm -rf')) {
          return { decision: 'deny', reason: 'Dangerous command blocked' };
        }
        return { decision: 'allow' };
      },
      'session.idle': async (event) => {
        // Orchestration re-entry point (similar to stop hook)
        // Can trigger babysitter run:iterate here
      }
    }
  };
}
```

> **Reference**: [opencode.ai/docs/plugins/](https://opencode.ai/docs/plugins/) (accessed 2026-04-02)

## MCP (Model Context Protocol)

OpenCode has first-class MCP support with both stdio (local) and HTTP/SSE (remote, with OAuth 2.0) transports. MCP server prompts become slash commands. MCP tools integrate alongside built-in tools with permission checks and plugin hooks.

### Configuration

MCP servers are configured in `opencode.json` under the `mcp` key:

```json
{
  "mcp": {
    "local-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "{env:MY_API_KEY}"
      }
    },
    "remote-server": {
      "url": "http://localhost:8080/sse"
    },
    "babysitter": {
      "command": "babysitter",
      "args": ["mcp:serve", "--json"]
    }
  }
}
```

### Features

- **Stdio transport**: Local child processes via command/args
- **HTTP/SSE transport**: Remote servers with OAuth 2.0 support
- **Variable substitution**: `{env:VAR}` for sensitive values
- **MCP prompts as slash commands**: Server prompts exposed as commands
- **Permission integration**: MCP tools subject to same permission checks as built-in tools
- **Plugin hook integration**: `tool.execute.before/after` hooks apply to MCP tools too

> **Reference**: [opencode.ai/docs](https://opencode.ai/docs), [deepwiki.com/anomalyco/opencode/8.2-mcp-integration](https://deepwiki.com/anomalyco/opencode/8.2-mcp-integration) (accessed 2026-04-02)

## Configuration

OpenCode uses JSON/JSONC (JSON with Comments) configuration files named `opencode.json`.

### Config File Locations & Precedence

Configuration files merge together (later sources override earlier ones):

1. Remote config (`.well-known/opencode` endpoint)
2. Global config (`~/.config/opencode/opencode.json`)
3. Custom config (`OPENCODE_CONFIG` environment variable)
4. Project config (`opencode.json` in project root)
5. `.opencode` directories (agents, commands, plugins)
6. Inline config (`OPENCODE_CONFIG_CONTENT` environment variable)

Specialized configs:
- TUI settings: `tui.json` (or `tui.jsonc`) in global/project locations
- Custom directory: `OPENCODE_CONFIG_DIR` environment variable

### Configuration Keys

```json
{
  "model": "claude-sonnet-4-20250514",
  "small_model": "claude-haiku-4-5-20251001",
  "provider": { /* provider config */ },
  "server": { "port": 8080, "hostname": "localhost" },
  "tools": { /* tool availability toggles */ },
  "agent": { /* custom agent definitions */ },
  "default_agent": "default",
  "command": { /* custom command definitions */ },
  "share": "manual",
  "theme": "default",
  "keybinds": { /* custom keyboard bindings */ },
  "formatter": { /* code formatter config */ },
  "permission": { /* tool permission levels */ },
  "mcp": { /* MCP server configuration */ },
  "plugin": { /* plugin loading from npm/local */ },
  "instructions": ["path/to/rules/*.md"],
  "snapshot": true,
  "autoupdate": true,
  "compaction": { /* context compaction settings */ },
  "watcher": { /* file watcher ignore patterns */ },
  "disabled_providers": [],
  "enabled_providers": [],
  "experimental": {}
}
```

### Variable Substitution

The configuration supports two substitution patterns:
- **Environment variables**: `{env:VARIABLE_NAME}`
- **File contents**: `{file:path/to/file}`

File paths support relative, absolute (`/`), and home directory (`~`) references.

### Configuration Reference

| Section | Description |
|---------|-------------|
| `model` / `small_model` | Primary and lightweight model selection |
| `provider` | Provider configuration with options |
| `server` | Server settings (port, hostname, mDNS, CORS) |
| `tools` | Tool availability toggles |
| `agent` | Custom agent definitions |
| `command` | Custom command definitions |
| `permission` | Tool permission levels |
| `mcp` | MCP server configuration |
| `plugin` | Plugin loading from npm/local |
| `instructions` | Rule file paths/glob patterns |
| `compaction` | Context compaction settings |
| `watcher` | File watcher ignore patterns |

## Custom Commands

Commands are defined in configuration or as files in `.opencode/commands/`:

```json
{
  "command": {
    "review": {
      "description": "Review code for quality",
      "instructions": "Review the following code..."
    }
  }
}
```

Command files in `.opencode/commands/` are also auto-discovered:

```
~/.config/opencode/commands/      # Global commands
.opencode/commands/               # Project commands
```

## Permissions Model

Granular per-tool permissions with three levels, configured globally and overridden per-agent. Supports glob patterns for bash commands.

```json
{
  "permission": {
    "bash": "ask",
    "write": "ask",
    "edit": "auto",
    "read": "auto",
    "webfetch": "ask"
  }
}
```

| Level | Description |
|-------|-------------|
| `allow` / `auto` | Always permit without prompting |
| `ask` | Prompt user for permission each time |
| `deny` | Always block |

Bash command permissions support glob patterns:

```json
{
  "permission": {
    "bash": {
      "git status *": "allow",
      "git push": "ask",
      "rm -rf *": "deny"
    }
  }
}
```

The `plan` agent defaults to asking permission for all writes and bash commands (read-only by default).

> **Reference**: [opencode.ai/docs/permissions/](https://opencode.ai/docs/permissions/) (accessed 2026-04-02)

## Distribution

| Method | Command |
|--------|---------|
| curl | `curl -fsSL https://opencode.ai/install \| bash` |
| npm/bun/pnpm | `npm i -g opencode-ai@latest` |
| Homebrew | `brew install anomalyco/tap/opencode` or `brew install opencode` |
| Scoop (Windows) | `scoop install opencode` |
| Chocolatey (Windows) | `choco install opencode` |
| AUR (Arch) | `yay -S opencode` |
| Nix | Available in nixpkgs |
| mise | `mise install opencode` |
| Desktop App | DMG (macOS), EXE (Windows), deb/rpm/AppImage (Linux) |
| Desktop via Homebrew | `brew install --cask opencode-desktop` |

> **Reference**: [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode), [opencode.ai](https://opencode.ai) (accessed 2026-04-02)

## Babysitter Integration Status

### Current Adapter

The Babysitter SDK includes an `opencode` harness adapter:

```typescript
// From packages/sdk/src/harness/discovery.ts
{
  name: "opencode",
  cli: "opencode",
  callerEnvVars: [],
  capabilities: [Cap.HeadlessPrompt],
}
```

### Capability Matrix

| Capability | Supported | Notes |
|------------|-----------|-------|
| Discovery | Yes | CLI detection via `opencode` on PATH |
| HeadlessPrompt | Yes | Server mode / non-interactive |
| SessionBinding | Yes | `session.created` hook + client SDK |
| StopHook | Yes | `session.idle` hook via plugins |
| Mcp | Yes | Full MCP client with stdio + HTTP/SSE |
| Programmatic | Yes | Server mode + client SDK |

### Integration Patterns

1. **Plugin integration** (recommended):
```typescript
// .opencode/plugins/babysitter.ts
export default async function(ctx) {
  return {
    hooks: {
      'session.idle': async (event) => {
        // Orchestration re-entry: run babysitter iterate
      },
      'session.created': async (event) => {
        // Session binding: associate with babysitter run
      },
      'tool.execute.before': async (event) => {
        // Pre-tool-use: approve/deny via babysitter policies
      }
    }
  };
}
```

2. **MCP integration**:
```json
{
  "mcp": {
    "babysitter": {
      "command": "babysitter",
      "args": ["mcp:serve", "--json"]
    }
  }
}
```

## Ecosystem

- **Community**: [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) -- community-curated plugins and integrations
- **Ecosystem page**: [opencode.ai/docs/ecosystem/](https://opencode.ai/docs/ecosystem/)
- **opencode.cafe**: Community resource site
- **Native TS Toolsets**: Being added as simpler alternative to MCP for custom tools (GitHub issue #2237)
- **No formal marketplace yet**: Plugins distributed via npm packages and local files

### Related Harnesses

| Harness | Plugin System | Hooks | MCP | Session Binding |
|---------|--------------|-------|-----|-----------------|
| Claude Code | Yes | Yes | Yes | Yes |
| Codex | Yes | Yes | Yes | Yes |
| Cursor | Yes | Yes | Yes | Partial |
| Gemini CLI | Yes | Yes | Yes | Yes |
| GitHub Copilot | Yes | Yes | Yes | Partial |
| **OpenCode** | **Yes** | **Via plugins** | **Yes** | **Partial** |
| Oh-My-Pi | Yes | Yes | No | Yes |

## References

See [references.md](./references.md) for complete URL list with access dates.

---

*Last updated: 2026-04-02*

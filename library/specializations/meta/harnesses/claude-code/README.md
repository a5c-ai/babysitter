# Claude Code Harness Extensibility Documentation

Comprehensive reference for extending Claude Code through its plugin, skill, hook, MCP, subagent, and permission systems.

**Last verified**: 2026-04-02
**Claude Code docs domain**: `code.claude.com/docs/en/`

---

## Table of Contents

1. [Overview](#overview)
2. [Plugin Architecture](#plugin-architecture)
3. [Skills System](#skills-system)
4. [Commands](#commands)
5. [Hook System](#hook-system)
6. [MCP Support](#mcp-support)
7. [Distribution](#distribution)
8. [Subagents](#subagents)
9. [Permissions](#permissions)
10. [Configuration](#configuration)
11. [IDE Integration](#ide-integration)
12. [Ecosystem](#ecosystem)

---

## Overview

Claude Code is Anthropic's official CLI and IDE extension for interacting with Claude. It provides a terminal-first agentic coding assistant with deep extensibility through plugins, skills, hooks, MCP servers, subagents, and a multi-scope configuration system.

Claude Code runs in the terminal or as an embedded agent inside VS Code and JetBrains IDEs. It supports tool use (file read/write, bash execution, web fetch, grep, glob), autonomous multi-step workflows, and delegation to subagents.

**Key extensibility surfaces**:

- **Plugins**: Packaged bundles of skills, agents, hooks, MCP servers, and LSP servers distributed via git-based marketplaces
- **Skills**: Markdown-based instruction sets (SKILL.md) that extend Claude's capabilities, following the AgentSkills.io open standard
- **Hooks**: Event-driven handlers (28 event types) that execute shell commands, HTTP requests, LLM prompts, or agentic verifiers
- **MCP**: Model Context Protocol servers providing external tools via stdio, SSE, streamable-http, or WebSocket transports
- **Subagents**: Specialized AI assistants with isolated context windows, custom system prompts, and independent tool access
- **Permissions**: Fine-grained Tool(specifier) rules with deny > ask > allow precedence across managed, user, project, and local scopes

> **References**:
> - [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) (accessed 2026-04-02)
> - [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) (accessed 2026-04-02)

---

## Plugin Architecture

Plugins are self-contained directories that extend Claude Code with custom functionality. A plugin bundles skills, agents, hooks, MCP servers, LSP servers, and default settings into a single distributable unit.

### Plugin Directory Structure

```
my-plugin/
  .claude-plugin/
    plugin.json             # Plugin manifest (optional if using defaults)
  commands/                 # Skill markdown files (legacy; use skills/ for new work)
  agents/                   # Subagent markdown files
  skills/                   # Agent Skills with SKILL.md
    my-skill/
      SKILL.md
      reference.md          # Optional supporting files
      scripts/
  output-styles/            # Output style definitions
  hooks/
    hooks.json              # Hook configuration
  settings.json             # Default settings (currently only "agent" key supported)
  .mcp.json                 # MCP server definitions
  .lsp.json                 # LSP server configurations
  scripts/                  # Hook and utility scripts
  LICENSE
  CHANGELOG.md
```

**Critical**: The `.claude-plugin/` directory contains ONLY `plugin.json`. All component directories (commands/, agents/, skills/, hooks/, etc.) must be at the plugin root, not inside `.claude-plugin/`.

> **Reference**: [code.claude.com/docs/en/plugins-reference#plugin-directory-structure](https://code.claude.com/docs/en/plugins-reference#plugin-directory-structure) (accessed 2026-04-02)

### Plugin Manifest (plugin.json)

The manifest at `.claude-plugin/plugin.json` defines plugin identity and configuration. It is optional -- if omitted, Claude Code auto-discovers components in default locations and derives the plugin name from the directory name.

#### Required Fields

| Field  | Type   | Description                                     |
|--------|--------|-------------------------------------------------|
| `name` | string | Unique identifier (kebab-case). Used as skill namespace prefix. |

#### Metadata Fields

| Field         | Type   | Description                          |
|---------------|--------|--------------------------------------|
| `version`     | string | Semantic version (e.g., `"2.1.0"`)  |
| `description` | string | Brief explanation of plugin purpose  |
| `author`      | object | `{ name, email?, url? }`            |
| `homepage`    | string | Documentation URL                    |
| `repository`  | string | Source code URL                      |
| `license`     | string | SPDX license identifier             |
| `keywords`    | array  | Discovery tags                       |

#### Component Path Fields

| Field          | Type                  | Description                                                       |
|----------------|-----------------------|-------------------------------------------------------------------|
| `commands`     | string or array       | Custom command files/directories (replaces default `commands/`)   |
| `agents`       | string or array       | Custom agent files (replaces default `agents/`)                   |
| `skills`       | string or array       | Custom skill directories (replaces default `skills/`)             |
| `hooks`        | string, array, or object | Hook config paths or inline config                             |
| `mcpServers`   | string, array, or object | MCP config paths or inline config                              |
| `outputStyles` | string or array       | Custom output style files/directories                             |
| `lspServers`   | string, array, or object | LSP server configurations                                      |
| `userConfig`   | object                | User-configurable values prompted at enable time                  |
| `channels`     | array                 | Channel declarations for message injection                        |

All custom paths must be relative to the plugin root and start with `./`. Setting a component path replaces the default directory for that component type.

See `examples/plugin.json` for a complete example.

> **Reference**: [code.claude.com/docs/en/plugins-reference#plugin-manifest-schema](https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema) (accessed 2026-04-02)

### Environment Variables

Claude Code provides two variables for referencing plugin paths. Both are substituted inline in skill content, agent content, hook commands, and MCP/LSP server configs. Both are also exported as environment variables to hook processes and server subprocesses.

| Variable               | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| `${CLAUDE_PLUGIN_ROOT}` | Absolute path to the plugin's installation directory. Changes on update.   |
| `${CLAUDE_PLUGIN_DATA}` | Persistent directory for plugin state (`~/.claude/plugins/data/{id}/`). Survives updates. Created on first reference. |

**User configuration variables**: Values from `userConfig` are available as `${user_config.KEY}` substitutions and as `CLAUDE_PLUGIN_OPTION_<KEY>` environment variables.

> **Reference**: [code.claude.com/docs/en/plugins-reference#environment-variables](https://code.claude.com/docs/en/plugins-reference#environment-variables) (accessed 2026-04-02)

### Plugin Caching

For security, Claude Code copies marketplace plugins to the local plugin cache at `~/.claude/plugins/cache` rather than using them in-place. Installed plugins cannot reference files outside their directory (paths like `../shared-utils` will not work). Use symlinks within the plugin directory if external files are needed; symlinks are followed during the copy process.

> **Reference**: [code.claude.com/docs/en/plugins-reference#plugin-caching-and-file-resolution](https://code.claude.com/docs/en/plugins-reference#plugin-caching-and-file-resolution) (accessed 2026-04-02)

### User Configuration (userConfig)

Plugins can declare user-configurable values that are prompted at enable time:

```json
{
  "userConfig": {
    "api_endpoint": {
      "description": "Your team's API endpoint",
      "sensitive": false
    },
    "api_token": {
      "description": "API authentication token",
      "sensitive": true
    }
  }
}
```

- Non-sensitive values: stored in `settings.json` under `pluginConfigs[<plugin-id>].options`
- Sensitive values: stored in system keychain (or `~/.claude/.credentials.json` fallback); ~2 KB total limit
- Available as `${user_config.KEY}` substitutions and `CLAUDE_PLUGIN_OPTION_<KEY>` env vars

> **Reference**: [code.claude.com/docs/en/plugins-reference#user-configuration](https://code.claude.com/docs/en/plugins-reference#user-configuration) (accessed 2026-04-02)

### Plugin Testing

Use `--plugin-dir` to load plugins during development without installation:

```bash
claude --plugin-dir ./my-plugin
# Load multiple plugins:
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
```

Use `/reload-plugins` to pick up changes without restarting. When a `--plugin-dir` plugin has the same name as an installed marketplace plugin, the local copy takes precedence (except managed force-enabled plugins).

Use `claude plugin validate .` or `/plugin validate .` to check plugin.json, skill/agent/command frontmatter, and hooks/hooks.json for syntax and schema errors.

> **Reference**: [code.claude.com/docs/en/plugins#test-your-plugins-locally](https://code.claude.com/docs/en/plugins#test-your-plugins-locally) (accessed 2026-04-02)

---

## Skills System

Skills extend Claude's capabilities through markdown-based instruction sets. Claude Code skills follow the [AgentSkills.io](https://agentskills.io) open standard and extend it with invocation control, subagent execution, and dynamic context injection.

### SKILL.md Format

Every skill is a directory containing a `SKILL.md` file with YAML frontmatter and markdown instructions:

```yaml
---
name: my-skill
description: What this skill does and when to use it
allowed-tools: Read, Grep, Glob
---

Your skill instructions here...
```

The skill directory can include supporting files:

```
my-skill/
  SKILL.md           # Main instructions (required)
  template.md        # Templates for Claude to fill in
  examples/
    sample.md        # Example outputs
  scripts/
    validate.sh      # Scripts Claude can execute
```

### Frontmatter Reference

All fields are optional. Only `description` is recommended.

| Field                      | Type    | Description                                                                                              |
|----------------------------|---------|----------------------------------------------------------------------------------------------------------|
| `name`                     | string  | Display name (lowercase, numbers, hyphens; max 64 chars). Defaults to directory name.                   |
| `description`              | string  | What the skill does and when to use it. Claude uses this for auto-invocation. Truncated at 250 chars in listing. |
| `argument-hint`            | string  | Hint for autocomplete, e.g., `[issue-number]` or `[filename] [format]`.                                 |
| `disable-model-invocation` | boolean | `true` prevents Claude from loading this skill automatically. Default: `false`.                          |
| `user-invocable`           | boolean | `false` hides from `/` menu. Default: `true`.                                                            |
| `allowed-tools`            | string  | Comma-separated tools Claude can use without permission when skill is active.                            |
| `model`                    | string  | Model to use when skill is active.                                                                       |
| `effort`                   | string  | Effort level override. Options: `low`, `medium`, `high`, `max` (Opus 4.6 only).                         |
| `context`                  | string  | Set to `fork` to run in a forked subagent context.                                                       |
| `agent`                    | string  | Subagent type when `context: fork` is set (e.g., `Explore`, `Plan`, custom name).                       |
| `hooks`                    | object  | Hooks scoped to this skill's lifecycle.                                                                  |
| `paths`                    | string or list | Glob patterns limiting when skill is auto-activated based on files being worked on.                |
| `shell`                    | string  | Shell for `!`command`` blocks: `bash` (default) or `powershell`.                                         |

### String Substitutions

| Variable               | Description                                                                |
|------------------------|----------------------------------------------------------------------------|
| `$ARGUMENTS`           | All arguments passed when invoking the skill.                              |
| `$ARGUMENTS[N]`        | Specific argument by 0-based index.                                        |
| `$N`                   | Shorthand for `$ARGUMENTS[N]` (e.g., `$0`, `$1`).                         |
| `${BABYSITTER_SESSION_ID}` | Current session ID.                                                        |
| `${CLAUDE_SKILL_DIR}`  | Directory containing the skill's SKILL.md.                                 |

If `$ARGUMENTS` is not present in the content, arguments are appended as `ARGUMENTS: <value>`.

### Dynamic Context Injection

The `` !`<command>` `` syntax runs shell commands before skill content is sent to Claude. The command output replaces the placeholder:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

Summarize this pull request...
```

Commands execute immediately as preprocessing. Claude only sees the final rendered output.

### Invocation Control

| Frontmatter                      | User invoke | Claude invoke | Context behavior                                             |
|----------------------------------|-------------|---------------|--------------------------------------------------------------|
| (default)                        | Yes         | Yes           | Description always in context, full skill loads when invoked |
| `disable-model-invocation: true` | Yes         | No            | Description not in context, loads only on user invoke        |
| `user-invocable: false`          | No          | Yes           | Description always in context, loads when Claude invokes     |

### Skill Locations

| Scope      | Path                                        | Applies to                     |
|------------|---------------------------------------------|--------------------------------|
| Enterprise | Managed settings                            | All users in organization      |
| Personal   | `~/.claude/skills/<name>/SKILL.md`          | All your projects              |
| Project    | `.claude/skills/<name>/SKILL.md`            | This project only              |
| Plugin     | `<plugin>/skills/<name>/SKILL.md`           | Where plugin is enabled        |

Priority: enterprise > personal > project. Plugin skills use `plugin-name:skill-name` namespace.

### Bundled Skills

| Skill                       | Purpose                                                                              |
|-----------------------------|--------------------------------------------------------------------------------------|
| `/batch <instruction>`      | Parallel codebase changes via isolated git worktrees                                 |
| `/claude-api`               | Claude API/SDK reference material                                                    |
| `/debug [description]`      | Enable debug logging and troubleshoot                                                |
| `/loop [interval] <prompt>` | Run prompt repeatedly on interval                                                    |
| `/simplify [focus]`         | Review changed files for code reuse, quality, efficiency                             |

See `examples/SKILL.md` for a complete skill definition example.

> **References**:
> - [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) (accessed 2026-04-02)
> - [agentskills.io](https://agentskills.io) (accessed 2026-04-02)

---

## Commands

Commands are the legacy precursor to skills. Files at `.claude/commands/<name>.md` or `<plugin>/commands/<name>.md` create `/name` shortcuts.

**Commands have been merged into skills.** A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way. Existing `.claude/commands/` files continue working. If a skill and a command share the same name, the skill takes precedence.

Commands support the same frontmatter fields as skills.

### Built-in Commands

Built-in commands execute fixed logic directly (unlike skills which are prompt-based):

| Command      | Description                                    |
|--------------|------------------------------------------------|
| `/help`      | Show available commands and skills              |
| `/compact`   | Compact conversation context                   |
| `/config`    | Open settings interface                        |
| `/permissions` | View and manage permission rules             |
| `/agents`    | Manage subagents                               |
| `/hooks`     | Browse configured hooks                        |
| `/plugin`    | Plugin management (install, update, etc.)      |
| `/init`      | Initialize CLAUDE.md for project               |
| `/add-dir`   | Add additional working directory               |
| `/reload-plugins` | Reload all plugins                        |

> **Reference**: [code.claude.com/docs/en/commands](https://code.claude.com/docs/en/commands) (accessed 2026-04-02)

---

## Hook System

Hooks are event handlers that respond to Claude Code lifecycle events. They execute shell commands, HTTP requests, LLM prompts, or agentic verifiers.

### Event Types (28 events)

| Event                | When it fires                                          | Blocking |
|----------------------|--------------------------------------------------------|----------|
| `SessionStart`       | Session begins or resumes                              | No       |
| `SessionEnd`         | Session terminates                                     | No       |
| `InstructionsLoaded` | CLAUDE.md or `.claude/rules/*.md` loaded               | No       |
| `UserPromptSubmit`   | User submits prompt                                    | Yes      |
| `PreToolUse`         | Before tool executes                                   | Yes (allow/deny/ask/defer) |
| `PermissionRequest`  | Permission dialog appears                              | Yes (allow/deny) |
| `PermissionDenied`   | Auto mode denies tool                                  | No (retry only) |
| `PostToolUse`        | Tool succeeds                                          | No       |
| `PostToolUseFailure` | Tool fails                                             | No       |
| `Notification`       | Notification sent                                      | No       |
| `SubagentStart`      | Subagent spawned                                       | No       |
| `SubagentStop`       | Subagent finishes                                      | Yes      |
| `TaskCreated`        | Task created via TaskCreate                            | Yes      |
| `TaskCompleted`      | Task marked complete                                   | Yes      |
| `Stop`               | Claude finishes responding                             | Yes      |
| `StopFailure`        | Turn ends from API error                               | No       |
| `TeammateIdle`       | Agent team teammate idle                               | Yes      |
| `ConfigChange`       | Config file changes                                    | Yes      |
| `CwdChanged`         | Working directory changes                              | No       |
| `FileChanged`        | Watched file changes                                   | No       |
| `PreCompact`         | Before context compaction                              | No       |
| `PostCompact`        | After compaction completes                             | No       |
| `Elicitation`        | MCP server requests input                              | Yes      |
| `ElicitationResult`  | User responds to MCP input                             | Yes      |
| `WorktreeCreate`     | Worktree created                                       | Yes      |
| `WorktreeRemove`     | Worktree removed                                       | No       |

### Handler Types

#### 1. Command Hooks (`type: "command"`)

```json
{
  "type": "command",
  "command": "/path/to/script.sh",
  "timeout": 600
}
```

- Receives JSON input on stdin
- Exit codes: 0 = allow (parse JSON from stdout), 2 = block (show stderr), other = non-blocking error
- Can output structured JSON to stdout

#### 2. HTTP Hooks (`type: "http"`)

```json
{
  "type": "http",
  "url": "http://localhost:8080/hook",
  "headers": { "Authorization": "Bearer $MY_TOKEN" },
  "allowedEnvVars": ["MY_TOKEN"],
  "timeout": 30
}
```

- POSTs JSON input to endpoint
- 2xx = success, non-2xx = non-blocking error

#### 3. Prompt Hooks (`type: "prompt"`)

```json
{
  "type": "prompt",
  "prompt": "Should this action be allowed? $ARGUMENTS",
  "model": "claude-3-5-haiku-20241022",
  "timeout": 30
}
```

- Sends event JSON to Claude model, returns yes/no decision

#### 4. Agent Hooks (`type: "agent"`)

```json
{
  "type": "agent",
  "prompt": "Verify this command is safe: $ARGUMENTS",
  "timeout": 60
}
```

- Spawns subagent with tools (Read, Grep, Glob) for complex verification

### Common Hook Fields

| Field           | Type    | Default       | Description                                        |
|-----------------|---------|---------------|----------------------------------------------------|
| `type`          | string  | (required)    | `"command"`, `"http"`, `"prompt"`, or `"agent"`    |
| `if`            | string  | --            | Permission rule syntax filter: `"Bash(git *)"`, `"Edit(*.ts)"` |
| `timeout`       | number  | 600/30/60     | Seconds before canceling                           |
| `statusMessage` | string  | --            | Custom spinner message                             |
| `once`          | boolean | false         | Run only once per session (skills only)            |

### Matcher Patterns

The `matcher` field is a regex that filters which events trigger the hook:

| Event Group                   | Matcher Filters      | Example Values                           |
|-------------------------------|----------------------|------------------------------------------|
| Tool events (PreToolUse, etc.)| `tool_name`          | `Bash`, `Edit\|Write`, `mcp__memory__.*` |
| SessionStart                  | Session source       | `startup`, `resume`, `clear`, `compact`  |
| SubagentStart/Stop            | Agent type           | `Bash`, `Explore`, `Plan`, custom names  |
| FileChanged                   | Filename (basename)  | `.envrc`, `.env`                         |
| ConfigChange                  | Config source        | `user_settings`, `project_settings`      |

### PreToolUse Decision Control

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask|defer",
    "permissionDecisionReason": "explanation",
    "updatedInput": { "field": "new_value" }
  }
}
```

Precedence when multiple hooks conflict: `deny` > `defer` > `ask` > `allow`.

### Hook Configuration Locations

| Location                                    | Scope            |
|---------------------------------------------|------------------|
| `~/.claude/settings.json`                   | All projects     |
| `.claude/settings.json`                     | Single project (shared) |
| `.claude/settings.local.json`               | Single project (local) |
| Managed settings                            | Organization     |
| Plugin `hooks/hooks.json`                   | Plugin scope     |
| Skill/Agent frontmatter `hooks` field       | Component scope  |

### Environment Variables in Hooks

| Variable              | Description                                                |
|-----------------------|------------------------------------------------------------|
| `CLAUDE_PROJECT_DIR`  | Project root directory                                     |
| `CLAUDE_PLUGIN_ROOT`  | Plugin installation directory                              |
| `CLAUDE_PLUGIN_DATA`  | Plugin persistent data directory                           |
| `CLAUDE_CODE_REMOTE`  | `"true"` in remote web environments                        |
| `CLAUDE_ENV_FILE`     | Path to file for persisting env vars (SessionStart/CwdChanged/FileChanged only) |

See `examples/settings.json` for a complete hooks configuration example.

> **Reference**: [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) (accessed 2026-04-02)

---

## MCP Support

Claude Code supports the Model Context Protocol (MCP) for connecting to external tools and services.

### Configuration

MCP servers are configured in `.mcp.json` at the project root, plugin root, or user home:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@company/mcp-server"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

### Transport Types

| Transport          | Description                              | Config key    |
|--------------------|------------------------------------------|---------------|
| `stdio`            | Subprocess communication via stdin/stdout | `command`, `args` |
| `sse`              | Server-Sent Events                       | `url`         |
| `streamable-http`  | HTTP streaming                           | `url`         |
| `ws`               | WebSocket                                | `url`         |

### CLI Management

```bash
# Add MCP server
claude mcp add my-server --transport stdio -- npx -y @company/mcp-server
claude mcp add my-server --transport http https://example.com/mcp
claude mcp add my-server --transport sse https://example.com/sse

# List configured servers
claude mcp list

# Remove server
claude mcp remove my-server
```

### Plugin MCP Servers

Plugins bundle MCP servers in `.mcp.json` at the plugin root or inline in `plugin.json`:

```json
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": { "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data" }
    }
  }
}
```

Plugin MCP servers start automatically when the plugin is enabled.

### Deferred Tool Loading

MCP tools use deferred loading: only tool names appear initially. Full schemas are fetched on demand when the tool is about to be used, reducing context usage.

### MCP Tool Permission Syntax

```
mcp__<server>__<tool>          # Specific tool
mcp__<server>__*               # All tools from a server
mcp__puppeteer__puppeteer_navigate  # Exact tool match
```

### Managed MCP Configuration

Set `allowManagedMcpServersOnly: true` in managed settings to restrict MCP servers to only those defined in managed settings. `deniedMcpServers` still merges from all sources.

> **Reference**: [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp) (accessed 2026-04-02)

---

## Distribution

### Git-Based Marketplaces

A marketplace is a git repository containing `.claude-plugin/marketplace.json` that catalogs available plugins.

#### marketplace.json Schema

```json
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "metadata": {
    "description": "Internal development tools",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting",
      "version": "2.1.0"
    }
  ]
}
```

Required fields: `name`, `owner` (with `name`), `plugins` array.

#### Plugin Source Types (5 types)

| Source        | Format                                          | Description                          |
|---------------|-------------------------------------------------|--------------------------------------|
| Relative path | `"./plugins/my-plugin"` (string)               | Directory within marketplace repo    |
| `github`      | `{ source: "github", repo: "owner/repo", ref?, sha? }` | GitHub repository           |
| `url`         | `{ source: "url", url: "https://...", ref?, sha? }` | Any git URL                    |
| `git-subdir`  | `{ source: "git-subdir", url: "...", path: "...", ref?, sha? }` | Subdirectory in git repo (sparse clone) |
| `npm`         | `{ source: "npm", package: "@org/plugin", version?, registry? }` | npm package                |

#### Marketplace Commands

```bash
# Add marketplace
/plugin marketplace add owner/repo                    # GitHub
/plugin marketplace add https://gitlab.com/org/repo   # Git URL
/plugin marketplace add ./local-marketplace            # Local

# Install plugin
/plugin install plugin-name@marketplace-name

# Update marketplace
/plugin marketplace update

# Update plugin
claude plugin update plugin-name@marketplace-name
```

#### CLAUDE_CODE_PLUGIN_SEED_DIR

For containers and CI, pre-populate plugins at build time:

```
$CLAUDE_CODE_PLUGIN_SEED_DIR/
  known_marketplaces.json
  marketplaces/<name>/...
  cache/<marketplace>/<plugin>/<version>/...
```

Set `CLAUDE_CODE_PLUGIN_SEED_DIR` environment variable. Multiple directories can be separated with `:` (Unix) or `;` (Windows). The seed directory is read-only; auto-updates are disabled for seed marketplaces.

#### Managed Marketplace Restrictions

Set `strictKnownMarketplaces` in managed settings:

| Value               | Behavior                                                |
|---------------------|---------------------------------------------------------|
| Undefined (default) | No restrictions                                         |
| Empty array `[]`    | Complete lockdown -- no new marketplaces                |
| List of sources     | Only matching marketplaces allowed                      |

Supports `github`, `url`, `hostPattern`, and `pathPattern` source types.

#### Plugin Installation Scopes

| Scope   | Settings file                      | Use case                         |
|---------|------------------------------------|----------------------------------|
| `user`  | `~/.claude/settings.json`          | Personal (default)               |
| `project` | `.claude/settings.json`          | Team (committed to git)          |
| `local` | `.claude/settings.local.json`      | Project-specific (gitignored)    |
| `managed` | Managed settings                 | Organization (read-only)         |

### Official Marketplace Submission

Submit plugins to the official Anthropic marketplace:

- Claude.ai: [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
- Console: [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)

> **Reference**: [code.claude.com/docs/en/plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) (accessed 2026-04-02)

---

## Subagents

Subagents are specialized AI assistants that run in their own context window with custom system prompts, specific tool access, and independent permissions.

### Built-in Subagents

| Agent             | Model   | Tools            | Purpose                                    |
|-------------------|---------|------------------|--------------------------------------------|
| **Explore**       | Haiku   | Read-only        | Fast codebase search and analysis          |
| **Plan**          | Inherit | Read-only        | Research for plan mode                     |
| **general-purpose** | Inherit | All tools      | Complex multi-step tasks                   |
| statusline-setup  | Sonnet  | --               | Configure status line                      |
| Claude Code Guide | Haiku   | --               | Answer Claude Code feature questions       |

### Subagent Definition Format

Subagents are Markdown files with YAML frontmatter:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
maxTurns: 20
effort: medium
---

You are a code reviewer. Analyze code and provide
specific, actionable feedback on quality, security, and best practices.
```

### Frontmatter Fields

| Field             | Required | Description                                                               |
|-------------------|----------|---------------------------------------------------------------------------|
| `name`            | Yes      | Unique identifier (lowercase, hyphens)                                    |
| `description`     | Yes      | When Claude should delegate to this subagent                              |
| `tools`           | No       | Allowlist of tools. Inherits all if omitted                               |
| `disallowedTools` | No       | Tools to deny (removed from inherited list)                               |
| `model`           | No       | `sonnet`, `opus`, `haiku`, full model ID, or `inherit`. Default: `inherit` |
| `permissionMode`  | No       | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`  |
| `maxTurns`        | No       | Maximum agentic turns                                                     |
| `skills`          | No       | Skills preloaded into context at startup                                  |
| `mcpServers`      | No       | MCP servers available to this subagent                                    |
| `hooks`           | No       | Lifecycle hooks scoped to this subagent                                   |
| `memory`          | No       | Persistent memory scope: `user`, `project`, or `local`                    |
| `background`      | No       | `true` to always run as background task. Default: `false`                 |
| `effort`          | No       | `low`, `medium`, `high`, `max` (Opus 4.6 only)                           |
| `isolation`       | No       | `worktree` for isolated git worktree execution                            |
| `color`           | No       | Display color: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan` |
| `initialPrompt`   | No       | Auto-submitted first turn when running as main session agent              |

### Subagent Scopes

| Location                    | Scope             | Priority    |
|-----------------------------|-------------------|-------------|
| Managed settings            | Organization-wide | 1 (highest) |
| `--agents` CLI flag         | Current session   | 2           |
| `.claude/agents/`           | Current project   | 3           |
| `~/.claude/agents/`         | All your projects | 4           |
| Plugin `agents/`            | Plugin scope      | 5 (lowest)  |

**Security note**: Plugin subagents do NOT support `hooks`, `mcpServers`, or `permissionMode` frontmatter fields. These are ignored for plugin-shipped agents.

### CLI-Defined Subagents

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

See `examples/agent.md` for a complete subagent definition example.

> **Reference**: [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) (accessed 2026-04-02)

---

## Permissions

Claude Code uses a fine-grained permission system with tiered tool types.

### Permission Tiers

| Tool type         | Example          | Approval required | "Don't ask again" behavior         |
|-------------------|------------------|-------------------|------------------------------------|
| Read-only         | File reads, Grep | No                | N/A                               |
| Bash commands     | Shell execution  | Yes               | Permanent per project + command    |
| File modification | Edit/write files | Yes               | Until session end                  |

### Permission Rule Syntax

Rules follow `Tool` or `Tool(specifier)` format:

```
Bash                              # All bash commands
Bash(npm run build)               # Exact command
Bash(npm run *)                   # Wildcard pattern
Read(./.env)                      # Specific file
Edit(/src/**/*.ts)                # Gitignore-style glob
WebFetch(domain:example.com)      # Domain filter
mcp__puppeteer__puppeteer_navigate # MCP tool
Agent(Explore)                    # Subagent control
Skill(commit)                     # Skill control
Skill(review-pr *)                # Skill prefix match
```

### Rule Evaluation Order

**deny > ask > allow** -- the first matching rule wins. Deny rules always take precedence regardless of which scope defines them.

### Permission Modes

| Mode                | Description                                          |
|---------------------|------------------------------------------------------|
| `default`           | Prompts for permission on first use                  |
| `acceptEdits`       | Auto-accepts file edit permissions for session       |
| `plan`              | Read-only -- no modifications or commands            |
| `auto`              | AI-based safety classifier auto-approves             |
| `dontAsk`           | Auto-denies unless pre-approved                      |
| `bypassPermissions` | Skips prompts (except .git, .claude, .vscode, .idea) |

### Settings Precedence

1. **Managed settings** (cannot be overridden)
2. **Command line arguments**
3. **Local project** (`.claude/settings.local.json`)
4. **Shared project** (`.claude/settings.json`)
5. **User** (`~/.claude/settings.json`)

### Auto Mode Classifier

Configure trusted infrastructure for auto mode:

```json
{
  "autoMode": {
    "environment": [
      "Source control: github.example.com/acme-corp",
      "Trusted cloud buckets: s3://acme-build-artifacts",
      "Trusted internal domains: *.corp.example.com"
    ],
    "allow": ["...custom allow rules..."],
    "soft_deny": ["...custom block rules..."]
  }
}
```

Inside the classifier: `soft_deny` blocks first, `allow` overrides as exceptions, explicit user intent overrides both.

**Important**: Setting `allow` or `soft_deny` replaces the ENTIRE default list. Always start from `claude auto-mode defaults` output.

> **Reference**: [code.claude.com/docs/en/permissions](https://code.claude.com/docs/en/permissions) (accessed 2026-04-02)

---

## Configuration

### Multi-Scope Hierarchy

| Scope       | Location                                                   | Who it affects             | Shared? |
|-------------|------------------------------------------------------------|-----------------------------|---------|
| **Managed** | Server-managed, plist/registry, or `managed-settings.json` | All users on machine        | Yes (IT) |
| **User**    | `~/.claude/` directory                                     | You, across all projects    | No      |
| **Project** | `.claude/` in repository                                   | All collaborators           | Yes (git) |
| **Local**   | `.claude/settings.local.json`                              | You, in this repo only      | No (gitignored) |

### Settings Files

- `~/.claude/settings.json` -- User settings
- `.claude/settings.json` -- Shared project settings (committed to git)
- `.claude/settings.local.json` -- Local project settings (gitignored)
- Managed settings files (OS-dependent paths)

### Key Settings Categories

- `permissions` -- allow/deny/ask rules, defaultMode
- `hooks` -- event handlers
- `enabledPlugins` -- plugin activation map
- `extraKnownMarketplaces` -- marketplace sources
- `additionalDirectories` -- extra working directories
- `autoMode` -- auto mode classifier configuration
- `disableAllHooks` -- disable hook execution
- `pluginConfigs` -- per-plugin user configuration

### Managed-Only Settings

These settings only work from managed settings (user/project scope has no effect):

| Setting                                  | Description                                    |
|------------------------------------------|------------------------------------------------|
| `allowManagedHooksOnly`                  | Only managed + SDK hooks allowed               |
| `allowManagedMcpServersOnly`             | Only managed MCP servers                       |
| `allowManagedPermissionRulesOnly`        | Only managed permission rules                  |
| `strictKnownMarketplaces`               | Marketplace allowlist                          |
| `blockedMarketplaces`                    | Marketplace blocklist                          |
| `channelsEnabled`                        | Enable channels                                |
| `allowedChannelPlugins`                  | Channel plugin allowlist                       |
| `pluginTrustMessage`                     | Custom plugin trust warning                    |

### CLAUDE.md

CLAUDE.md files provide persistent context (memory) to Claude. They are loaded from:

- Project root `CLAUDE.md`
- `.claude/` directory
- Parent directories (walking up)
- User-level `~/.claude/CLAUDE.md`
- Path-specific rules via `.claude/rules/*.md`

> **Reference**: [code.claude.com/docs/en/settings](https://code.claude.com/docs/en/settings) (accessed 2026-04-02)

---

## IDE Integration

### VS Code Extension

Claude Code integrates as a VS Code extension providing:

- Inline chat and code actions
- Terminal integration
- File context from editor selection
- Side-panel conversation view

Install from the VS Code marketplace or via `code --install-extension anthropic.claude-code`.

### JetBrains Plugin

Claude Code provides a JetBrains plugin for IntelliJ IDEA, WebStorm, PyCharm, and other JetBrains IDEs:

- Tool window integration
- Editor context awareness
- Terminal integration

Install from the JetBrains Marketplace.

> **References**:
> - [code.claude.com/docs/en/ide-integrations](https://code.claude.com/docs/en/ide-integrations) (accessed 2026-04-02)

---

## Ecosystem

### Scale and Adoption

As of 2026-04-02, Claude Code has a substantial ecosystem:

- **9,900+ public repositories** on GitHub referencing Claude Code plugins, skills, or configuration
- **Official Anthropic marketplace** for curated plugin distribution
- **Community awesome-lists** aggregating third-party plugins and skills

### Plugin Submission

- Claude.ai: [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
- Console: [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)

### Community Resources

- Official docs: [code.claude.com/docs](https://code.claude.com/docs)
- Plugin marketplace: accessible via `/plugin` command in Claude Code
- AgentSkills.io standard: [agentskills.io](https://agentskills.io)
- GitHub topic: `claude-code-plugin`

> **References**:
> - [github.com/topics/claude-code](https://github.com/topics/claude-code) (accessed 2026-04-02)
> - [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit) (accessed 2026-04-02)

---

## LSP Servers

Plugins can provide Language Server Protocol (LSP) servers for real-time code intelligence.

### Configuration (.lsp.json)

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

### Required Fields

| Field                 | Description                                  |
|-----------------------|----------------------------------------------|
| `command`             | LSP binary to execute (must be in PATH)      |
| `extensionToLanguage` | Maps file extensions to language identifiers |

### Optional Fields

| Field                   | Description                                            |
|-------------------------|--------------------------------------------------------|
| `args`                  | Command-line arguments                                 |
| `transport`             | `stdio` (default) or `socket`                          |
| `env`                   | Environment variables                                  |
| `initializationOptions` | Options passed during initialization                   |
| `settings`              | Settings via `workspace/didChangeConfiguration`        |
| `workspaceFolder`       | Workspace folder path                                  |
| `startupTimeout`        | Max startup wait (ms)                                  |
| `shutdownTimeout`       | Max shutdown wait (ms)                                 |
| `restartOnCrash`        | Auto-restart on crash                                  |
| `maxRestarts`           | Max restart attempts                                   |

### Available Official LSP Plugins

| Plugin           | Language Server            | Install Command                                    |
|------------------|----------------------------|----------------------------------------------------|
| `pyright-lsp`    | Pyright (Python)           | `pip install pyright` or `npm install -g pyright`  |
| `typescript-lsp` | TypeScript Language Server | `npm install -g typescript-language-server typescript` |
| `rust-lsp`       | rust-analyzer              | See rust-analyzer docs                             |

> **Reference**: [code.claude.com/docs/en/plugins-reference#lsp-servers](https://code.claude.com/docs/en/plugins-reference#lsp-servers) (accessed 2026-04-02)

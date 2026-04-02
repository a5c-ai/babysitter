# OpenAI Codex CLI -- Extensibility Reference

> **Last verified**: 2026-04-02
> **Repository**: [github.com/openai/codex](https://github.com/openai/codex)
> **License**: Apache-2.0
> **Language**: Rust (codex-rs/) + Node.js SDK wrapper

## Overview

Codex CLI is OpenAI's open-source terminal-based coding agent. It features a full Rust rewrite (`codex-rs/`) with a TUI, app server, MCP server, plugin system, skills, hooks, connectors, and more. The Node.js SDK (`sdk/`) provides a wrapper layer.

---

## Plugin Architecture

Codex CLI has a Rust-native plugin system built into `codex-rs/plugin/`. Plugins are self-contained packages with a `.codex-plugin/` directory containing a `plugin.json` manifest.

### Plugin Directory Structure

```
my-codex-plugin/
├── .codex-plugin/
│   └── plugin.json          # Plugin manifest (required)
├── .app.json                # ChatGPT app connector definitions (optional)
├── hooks.json               # Hook event definitions (optional)
├── hooks/
│   ├── session-start.sh     # Hook implementation scripts
│   ├── stop-hook.sh
│   └── user-prompt-submit.sh
├── skills/
│   ├── my-skill/
│   │   └── SKILL.md
│   └── another-skill/
│       └── SKILL.md
├── assets/
│   ├── icon.svg
│   └── logo.svg
├── bin/
│   └── cli.js               # Plugin CLI entry point
├── scripts/
│   └── team-install.js       # Team deployment scripts
├── package.json              # npm distribution manifest
└── README.md
```

### Plugin Manifest: `.codex-plugin/plugin.json`

The manifest is the primary entry point for the plugin system. It declares all plugin components and metadata.

```json
{
  "name": "babysitter",
  "version": "0.1.5",
  "description": "Babysitter orchestration plugin for Codex with skill entrypoints and lifecycle hooks.",
  "author": {
    "name": "a5c.ai",
    "email": "support@a5c.ai",
    "url": "https://github.com/a5c-ai/babysitter"
  },
  "homepage": "https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-codex#readme",
  "repository": "https://github.com/a5c-ai/babysitter",
  "license": "MIT",
  "keywords": ["babysitter", "codex", "orchestration", "hooks", "skills"],
  "skills": "./skills/",
  "hooks": "./hooks.json",
  "apps": "./.app.json",
  "interface": {
    "displayName": "Babysitter",
    "shortDescription": "Run Babysitter orchestration flows from Codex",
    "longDescription": "Babysitter adds orchestration entrypoints such as $call, $plan, and $resume, plus Codex lifecycle hooks that keep runs and workspace state in sync.",
    "developerName": "a5c.ai",
    "category": "Coding",
    "capabilities": ["Interactive", "Read", "Write"],
    "websiteURL": "https://github.com/a5c-ai/babysitter",
    "privacyPolicyURL": "https://github.com/a5c-ai/babysitter",
    "termsOfServiceURL": "https://github.com/a5c-ai/babysitter",
    "defaultPrompt": [
      "Use Babysitter to start a new orchestration run",
      "Plan a Babysitter workflow before executing it",
      "Resume the latest Babysitter run in this workspace"
    ],
    "brandColor": "#0F766E",
    "composerIcon": "./assets/icon.svg",
    "logo": "./assets/logo.svg",
    "screenshots": []
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique plugin identifier |
| `version` | string | Yes | Semver version |
| `description` | string | Yes | Short plugin description |
| `author` | string or object | Yes | Author name or `{ name, email, url }` |
| `license` | string | No | SPDX license identifier |
| `keywords` | string[] | No | Discovery tags |
| `skills` | string | No | Relative path to skills directory |
| `hooks` | string | No | Relative path to hooks.json |
| `apps` | string | No | Relative path to `.app.json` (ChatGPT connectors) |
| `interface` | object | No | UI metadata for marketplace/TUI display |

#### `interface` Object

| Field | Type | Description |
|-------|------|-------------|
| `displayName` | string | Human-readable name in UI |
| `shortDescription` | string | One-liner for lists |
| `longDescription` | string | Full description for detail views |
| `developerName` | string | Developer/organization name |
| `category` | string | Category (e.g., "Coding", "DevOps", "Security") |
| `capabilities` | string[] | Declared capabilities: `Interactive`, `Read`, `Write` |
| `websiteURL` | string | Plugin homepage |
| `privacyPolicyURL` | string | Privacy policy link |
| `termsOfServiceURL` | string | Terms of service link |
| `defaultPrompt` | string[] | Suggested prompts shown to users |
| `brandColor` | string | Hex color for UI theming |
| `composerIcon` | string | Path to composer icon (SVG) |
| `logo` | string | Path to logo asset (SVG) |
| `screenshots` | string[] | Paths to screenshot images |

### App Connectors: `.app.json`

Codex supports ChatGPT app connectors (via the `$` prefix in the composer). These are defined in `.app.json`:

```json
{
  "apps": {
    "my-app": {
      "name": "My App",
      "description": "Integration with My App service"
    }
  }
}
```

The `$` prefix in the Codex composer inserts ChatGPT connector references.

### Plugin Identity and Loading

- Plugins are identified by a `PluginId` with namespace segments
- Each plugin has a manifest at `.codex-plugin/plugin.json`
- Plugin loading produces a `LoadedPlugin` via `PluginLoadOutcome`
- Configuration stored per-user in `~/.codex/config.toml` under `[plugins.<name>]`

### Plugin Capabilities (Rust API)

Each plugin exposes a `PluginCapabilitySummary`:

```rust
PluginCapabilitySummary {
    config_name: String,
    display_name: String,
    description: Option<String>,
    has_skills: bool,
    mcp_server_names: Vec<String>,
    app_connector_ids: Vec<AppConnectorId>,
}
```

Plugins can provide:
- **Skills** (SKILL.md files in skills/ directory)
- **MCP servers** (discoverable via plugin capabilities)
- **App connectors** (ChatGPT integration via `.app.json`)
- **Hooks** (lifecycle event handlers via `hooks.json`)

> **Reference**: [codex-rs/plugin/](https://github.com/openai/codex/tree/main/codex-rs/plugin) (accessed 2026-04-02), [plugins/babysitter-codex/.codex-plugin/plugin.json](https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-codex/.codex-plugin/plugin.json) (accessed 2026-04-02)

---

## Skills System

Skills are a core extensibility mechanism using `SKILL.md` files.

### System Skills

- Embedded in the binary at build time
- Extracted to `CODEX_HOME/skills/.system/` on startup
- Fingerprint-based caching (re-extracted only when binary changes)

### User and Plugin Skills

- Discovered from configurable skill roots
- Plugin-provided skills declared via `PluginCapabilitySummary.has_skills`
- Configuration in `[skills]` table in `config.toml`, keyed by SKILL.md path

### Skill Format

Skills use the SKILL.md format with YAML frontmatter (same convention as Claude Code and Cursor):

```markdown
---
name: my-skill
description: Description of what this skill does
---

# My Skill

Instructions for the agent...
```

> **Reference**: [codex-rs/skills/](https://github.com/openai/codex/tree/main/codex-rs/skills), [docs/skills.md](https://github.com/openai/codex/blob/main/docs/skills.md) (accessed 2026-04-02)

---

## Commands and Skills as Entry Points

### Built-in Slash Commands

Codex CLI supports slash commands in the TUI:

| Command | Description |
|---------|-------------|
| `/review` | Code review |
| `/apps` | List ChatGPT-connected apps |

The `$` prefix in the composer inserts ChatGPT connectors.

### Plugin Skills as Commands

While Codex does not have a formal user-defined custom command registration API for slash commands, plugins expose their functionality through **skills** which serve as de facto commands. For example, the Babysitter Codex plugin provides:

```
skills/
  assimilate/SKILL.md     # Assimilate external methodology
  babysit/SKILL.md        # Primary orchestration entry point
  call/SKILL.md           # Quick invoke
  doctor/SKILL.md         # Diagnose run health
  forever/SKILL.md        # Infinite loop process
  help/SKILL.md           # Help system
  issue/SKILL.md          # Issue management
  model/SKILL.md          # Model selection
  observe/SKILL.md        # Real-time dashboard
  plan/SKILL.md           # Planning mode
  project-install/SKILL.md # Project setup
  resume/SKILL.md         # Resume a run
  retrospect/SKILL.md     # Analyze past runs
  team-install/SKILL.md   # Team deployment
  user-install/SKILL.md   # User setup
  yolo/SKILL.md           # Non-interactive mode
```

Each skill is auto-discoverable by the agent and serves as an invokable entry point.

> **Reference**: [developers.openai.com/codex/cli/slash-commands](https://developers.openai.com/codex/cli/slash-commands) (accessed 2026-04-02), [plugins/babysitter-codex/skills/](https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-codex/skills/) (accessed 2026-04-02)

---

## Hook System

Codex CLI has a robust hook system with 5 event types, closely mirroring Claude Code's model. Hooks can be configured both at plugin level (`hooks.json`) and at user level (`config.toml`).

### Event Types

| Event | Description | Output |
|-------|-------------|--------|
| `SessionStart` | Session initialization | Session setup logic |
| `UserPromptSubmit` | User input interception | Modify/validate user prompts |
| `PreToolUse` | Before tool execution | Can approve/deny/modify tool calls |
| `PostToolUse` | After tool execution | React to tool results |
| `Stop` | Agent turn completion | End-of-turn actions |

### Plugin-Level Configuration: `hooks.json`

Plugins define hooks in a `hooks.json` file (referenced from `plugin.json` via the `hooks` field):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/babysitter-session-start.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/user-prompt-submit.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/babysitter-stop-hook.sh"
          }
        ]
      }
    ]
  }
}
```

### Hook Entry Format

Each hook entry in the array specifies:

| Field | Type | Description |
|-------|------|-------------|
| `matcher` | string | Glob pattern for when the hook fires (`"*"` = always) |
| `hooks` | array | Array of hook handler objects |

Each hook handler object:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Handler type: `"command"` for script execution |
| `command` | string | Path to the script to execute (relative to plugin root) |

### User-Level Configuration: `config.toml`

User-level hooks can also be configured in `~/.codex/config.toml`:

```toml
[hooks]
# Hook definitions here
```

### Hook Protocol

- Hook payloads are JSON (via stdin)
- Responses are JSON (via stdout) controlling flow
- `PreToolUse` can return approve/deny/modify outcomes
- Legacy `notify` hook available for end-of-turn notifications

> **Reference**: [codex-rs/hooks/](https://github.com/openai/codex/tree/main/codex-rs/hooks) (accessed 2026-04-02), [plugins/babysitter-codex/hooks.json](https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-codex/hooks.json) (accessed 2026-04-02)

---

## MCP Support

Full MCP (Model Context Protocol) client support.

### Configuration

MCP servers configured in `~/.codex/config.toml`:

```toml
[mcp_servers.my-server]
command = "npx"
args = ["-y", "@company/mcp-server"]

[mcp_servers.my-server.tools.search]
approval_mode = "approve"
```

### Features

- **Per-tool approval overrides**: Configure approval mode per MCP tool
- **OAuth support**: Configurable callback port/URL and credential storage (keyring or file)
- **Remote connections**: Shared CA-loading path for remote MCP
- **Plugin-provided MCP**: Plugins can bundle MCP servers

> **Reference**: [docs/config.md](https://github.com/openai/codex/blob/main/docs/config.md) (accessed 2026-04-02)

---

## AGENTS.md Support

Codex CLI fully supports AGENTS.md for project-level custom instructions.

### Discovery

- Searched in project root and parent directories
- `child_agents_md` feature flag enables hierarchical AGENTS.md with scope and precedence rules
- Fallback filenames configurable via `project_doc_fallback_filenames`
- Max size controlled by `project_doc_max_bytes`

### Additional Instructions

- `developer_instructions` in `config.toml` provides additional developer-role system messages
- `model_instructions_file` allows overriding built-in model instructions entirely

> **Reference**: [docs/agents_md.md](https://github.com/openai/codex/blob/main/docs/agents_md.md) (accessed 2026-04-02)

---

## Configuration

TOML-based configuration at `~/.codex/config.toml` with JSON Schema validation.

### Config Locations

| Location | Scope |
|----------|-------|
| `~/.codex/config.toml` | User-level |
| `.codex/` (project directory) | Project-level |

### Key Config Sections

| Section | Description |
|---------|-------------|
| `approval_policy` | Tool approval behavior |
| `sandbox_mode` | Sandbox enforcement level |
| `mcp_servers` | MCP server definitions |
| `plugins` | Plugin configurations |
| `skills` | Skill configurations |
| `hooks` | Hook event handlers |
| `model` / `model_provider` / `model_providers` | Model selection and providers |
| `features` | Feature flags |
| `profiles` | Named config profiles |
| `permissions` | Named permission profiles |
| `developer_instructions` | Custom system messages |
| `notify` | Notification settings |
| `history` | History configuration |
| `tools` | Tool settings |
| `web_search` | Web search configuration |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CODEX_HOME` | Home directory for Codex data |
| `CODEX_SQLITE_HOME` | SQLite database location |
| `CODEX_CA_CERTIFICATE` | Custom CA certificate path |

### Config Schema

The config schema is published as JSON Schema at `codex-rs/core/config.schema.json`, generated from Rust types.

> **Reference**: [codex-rs/core/config.schema.json](https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json), [docs/config.md](https://github.com/openai/codex/blob/main/docs/config.md) (accessed 2026-04-02)

---

## Permissions and Sandboxing

### Sandbox Modes

1. **Full-auto / suggest-like modes**: Controlled by `approval_policy`
2. **WorkspaceWrite**: Restricts file writes to workspace directory
3. **Configurable per-tool approval**: Fine-grained control

### Platform-Specific Sandboxing

| Platform | Mechanism |
|----------|-----------|
| macOS | Seatbelt / `sandbox-exec` |
| Linux | Linux sandboxing |
| Windows | Windows sandbox |

### Permission Profiles

- Named permission profiles in `[permissions]` table
- Default profile selector via `default_permissions`
- Execution policy (`execpolicy`) system for fine-grained command approval rules
- `PreToolUse` hooks can programmatically approve/deny tool calls

---

## Distribution

### Codex CLI Distribution

| Method | Command |
|--------|---------|
| npm | `npm install -g @openai/codex` |
| Homebrew | `brew install --cask codex` |
| GitHub Releases | Direct binary download (macOS arm64/x86_64, Linux x86_64/arm64) |

### Plugin Distribution

Codex plugins are distributed as npm packages. The package includes:
- `.codex-plugin/plugin.json` manifest
- All plugin components (skills, hooks, scripts, assets)
- `package.json` for npm with `"files"` array controlling published contents

Example `package.json` for a Codex plugin:

```json
{
  "name": "@a5c-ai/babysitter-codex",
  "version": "0.1.6",
  "description": "Babysitter Codex skill bundle and integration package",
  "bin": {
    "babysitter-codex": "bin/cli.js"
  },
  "files": [
    ".codex-plugin/",
    ".app.json",
    "assets/",
    "hooks/",
    "hooks.json",
    "skills/",
    "bin/",
    "scripts/",
    "babysitter.lock.json"
  ],
  "keywords": ["babysitter", "codex", "orchestration", "ai-agent", "codex-skill"],
  "scripts": {
    "deploy": "npm publish --access public",
    "deploy:staging": "npm publish --access public --tag staging"
  }
}
```

### Architecture

- **Rust core** (`codex-rs/`): TUI, app-server, MCP server, plugin system, skills, hooks, connectors
- **Node.js SDK** (`sdk/`): JavaScript/TypeScript wrapper

---

## Ecosystem

- **License**: Apache-2.0
- **Community**: Open-source contributions accepted (CLA required), open source fund program
- **Maturity**: The plugin/skill system is functional with active third-party development
- **Primary extensibility**: MCP servers, AGENTS.md, hooks, plugin.json manifest, skills
- **No marketplace yet**: No formal plugin registry or marketplace exists; distribution is via npm and GitHub repos

---

## Babysitter Integration

The Babysitter SDK includes a Codex adapter at `packages/sdk/src/harness/codex.ts`:

- `createCodexAdapter()` implements `HarnessAdapter`
- Capabilities: `[Programmatic]`
- CLI detection via `which codex` / `where codex`
- Plugin installation via `babysitter-codex` npm package
- Harness invocation via `invokeHarness()` with Codex-specific flag mapping

The `plugins/babysitter-codex/` directory contains the Babysitter plugin for Codex with hooks, skills, assets, and version tracking.

---

## References

See [references.md](./references.md) for the complete list of sources.

---
title: Adapters CLI Reference
description: The host-side `adapters` CLI (@a5c-ai/adapters-cli) — install, run, manage, and authenticate AI coding harnesses directly from your shell.
category: reference
last_updated: 2026-06-23
---

[Docs](../index.md) › [Reference](./index.md) › Adapters CLI

# Adapters CLI Reference

**Package:** `@a5c-ai/adapters-cli` · **Binary:** `adapters` · **Version:** 5.1.0 · **Node:** >=20.9.0

## On this page

- [In Plain English](#in-plain-english)
- [Technical Reference](#technical-reference)
- [adapters run](#adapters-run)
- [adapters install (and uninstall / update / detect)](#adapters-install-and-uninstall--update--detect)
- [adapters auth](#adapters-auth)
- [adapters doctor](#adapters-doctor)
- [Not Supported](#not-supported)

---

## In Plain English

**The `adapters` CLI lets you run any supported AI coding harness from your shell with one command - and manage its install, models, sessions, config, and auth in the same place.**

It is the host-side companion to Babysitter's [Adapters](../features/adapters.md) runtime. Where the in-session `/babysitter:*` commands drive an orchestration [run](./glossary.md) from *inside* a harness, `adapters` drives a harness from *outside* it.

A two-line taste:

```bash
npm install -g @a5c-ai/adapters-cli
adapters run claude "explain this codebase"
```

That installs the CLI globally and runs the Claude harness with a single prompt. No plugin, no marketplace, no session setup required.

> **Three CLIs, three jobs - don't conflate them.**
>
> | CLI | Where it runs | What it does |
> |-----|---------------|--------------|
> | `adapters` | Your shell (host-side) | Run/install/manage harnesses directly |
> | `babysitter` | Your shell (host-side) | Core orchestration runtime (`run:*`, `task:*`, `harness:install-plugin`) |
> | `/babysitter:*` | Inside a harness (in-session) | Drive an orchestration run from the chat surface |

---

## Technical Reference

The `adapters` binary is published as `@a5c-ai/adapters-cli` and requires Node.js **>=20.9.0** (the rest of the Babysitter toolchain runs on Node >=20.0.0; the Adapters CLI pins a slightly higher floor). Install it globally:

```bash
npm install -g @a5c-ai/adapters-cli
adapters version
adapters doctor
```

`adapters doctor` runs an environment health check and is the fastest way to confirm the CLI can see your harness binaries and credentials.

### Global Options

These flags are accepted across commands:

| Flag | Type | Description |
|------|------|-------------|
| `--json` | boolean | Emit JSON output where the command supports it |
| `--config-dir <dir>` | string | Override the config directory |
| `--project-dir <dir>` | string | Override the project directory |
| `--log-level <level>` | string | Set log verbosity |
| `--log-file <path>` | string | Write logs to a file |
| `--debug` | boolean | Enable debug output |
| `--no-color` | boolean | Disable ANSI colors |
| `--help`, `-h` | boolean | Show help |
| `--version`, `-V` | boolean | Print version |

> Use `adapters help <command>` for per-command help at any time.

---

## `adapters run`

Run an agent with a prompt.

```bash
adapters run claude "explain this codebase"
adapters run codex --yolo --no-session "add tests"
adapters run --profile fast "review this PR"
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `agent` | no | Agent name (first positional, if registered) |
| `prompt` | no | Prompt text (remaining positionals or stdin) |

**Options:**

| Flag | Type | Description |
|------|------|-------------|
| `--stream` / `--no-stream` | boolean | Enable / disable streaming |
| `--thinking-effort <level>` | string | `low`, `medium`, `high`, `max` |
| `--thinking-budget <n>` | number | Thinking budget in tokens |
| `--thinking-override <v>` | string | Thinking override |
| `--temperature <n>` | number | Sampling temperature |
| `--top-p <n>` | number | Top-p |
| `--top-k <n>` | number | Top-k |
| `--max-tokens <n>` | number | Maximum output tokens |
| `--max-output-tokens <n>` | number | Maximum output tokens |
| `--max-turns <n>` | number | Maximum agentic turns |
| `--session <id>` | string | Resume session by ID |
| `--fork <id>` | string | Fork session by ID |
| `--no-session` | boolean | Ephemeral run (no session persisted) |
| `--system <text>` | string | System prompt |
| `--system-mode <mode>` | string | `prepend`, `append`, `replace` |
| `--cwd <dir>` | string | Working directory |
| `--env <KEY=VALUE>` | string (repeatable) | Environment variable |
| `--yolo` | boolean | Auto-approve all tool calls |
| `--deny` | boolean | Auto-deny all approval requests |
| `--timeout <ms>` | number | Run timeout in ms |
| `--inactivity-timeout <ms>` | number | Inactivity timeout in ms |
| `--output-format <fmt>` | string | Output format |
| `--tag <tag>` | string (repeatable) | Run tag |
| `--run-id <id>` | string | Run ID |
| `--attach <ref>` | string (repeatable) | Attach a file/resource |
| `--skill <name>` | string (repeatable) | Skill to load |
| `--mcp-server <ref>` | string (repeatable) | MCP server |
| `--project-id <id>` | string | Project ID |
| `--profile <name>` | string | Named profile to apply |
| `--prompt <text>`, `-p` | string | Initial prompt text |
| `--non-interactive` | boolean | Force headless one-shot mode (with `--prompt`) |
| `--interactive`, `-i` | boolean | Enter interactive REPL mode |
| `--quiet`, `-q` | boolean | Suppress non-essential output |
| `--use-mock-harness` | boolean | Use mock harness (testing) |
| `--mock-scenario <name>` | string | Mock scenario (testing) |

---

## `adapters install` (and `uninstall` / `update` / `detect`)

Install, uninstall, update, or detect agent CLI binaries. The same command dispatches all four operations.

```bash
adapters install claude
adapters install claude --dry-run
adapters uninstall codex
adapters update codex
adapters detect claude --json
```

**Argument:** `agent`.

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--force` | boolean | false | Reinstall even if already present |
| `--dry-run` | boolean | false | Print the planned command without executing |
| `--pkg-version <v>` | string | - | Pin to a specific version (npm only) |

> **Version pinning uses `--pkg-version`, not `--version`.** `--version` prints the CLI's own version.

---

## `adapters adapters`

List and inspect registered adapters.

```bash
adapters adapters list
adapters adapters detect claude
adapters adapters info gemini
```

**Subcommands:** `list` (default), `detect`, `info`.
**Arguments:** `subcommand`, `agent` (for `detect`/`info`).
**Options:** `--json`.

---

## `adapters models`

List and inspect models.

```bash
adapters models list claude
adapters models info claude claude-sonnet-4-20250514
```

**Subcommands:** `list`, `info`, `get`, `refresh`, `current`, `set`.
**Arguments:** `subcommand` (required), `agent` (required), `model` (for `info`/`get`/`set`).
**Options:** `--provider <name>`, `--json`.

---

## `adapters sessions`

Manage agent sessions.

```bash
adapters sessions list claude
adapters sessions cost
```

**Subcommands:** `list` (default), `show`, `export`, `cost`.
**Arguments:** `subcommand`, `agent`, `session-id` (for `show`/`export`).

**Options:**

| Flag | Type | Description |
|------|------|-------------|
| `--since <date>` | string | Filter sessions after this date |
| `--until <date>` | string | Filter sessions before this date |
| `--model <id>`, `-m` | string | Filter by model |
| `--tag <tag>` | string (repeatable) | Filter by tag |
| `--limit <n>` | number | Maximum results |
| `--sort <key>` | string | Sort by: `date`, `cost`, `turns` |
| `--format <fmt>` | string | Output format: `json`, `jsonl`, `markdown` |
| `--json` | boolean | Output as JSON |

---

## `adapters config`

Read and write agent configuration.

```bash
adapters config get claude model
adapters config set claude model claude-sonnet-4-20250514
adapters config schema codex
```

**Subcommands:** `get`, `set`, `schema`, `validate`, `reload`.
**Arguments:** `subcommand` (required), `agent`, `field`, `value`.
**Options:** `--json`.

---

## `adapters profiles`

Manage named `RunOptions` presets that you can apply with `adapters run --profile <name>`.

```bash
adapters profiles list
adapters profiles set fast --agent claude --yolo --max-turns 5
adapters profiles delete fast
```

**Subcommands:** `list` (default), `show`, `set`, `delete`, `apply`.
**Arguments:** `subcommand`, `name`.
**Options:** `--scope <scope>` (`global` or `project`), `--json`.

---

## `adapters auth`

Check and set up authentication.

```bash
adapters auth check
adapters auth check claude
adapters auth setup gemini
```

**Subcommands:** `check`, `setup`.
**Arguments:** `subcommand` (required), `agent` (optional for `check`).
**Options:** `--json`.

---

## `adapters plugin` (alias: `adapters plugins`)

Manage native agent plugins. Subcommand availability is validated at runtime against each agent's plugin capabilities and delegated to the native plugin command.

```bash
adapters plugin list claude
adapters plugin install claude filesystem-watcher
adapters plugin marketplace claude
```

**Subcommands:** `list`, `install`, `enable`, `disable`, `marketplace`.
**Arguments:** `subcommand` (required), `agent` (required), `plugin` (plugin name / marketplace cmd).
**Options:** `--json`, `--help`.

---

## `adapters mcp`

Manage MCP (Model Context Protocol) servers for an agent.

```bash
adapters mcp list claude
adapters mcp install claude filesystem
```

**Subcommands:** `list`, `install`, `uninstall`.
**Arguments:** `subcommand` (required), `agent` (required), `server` (for `install`/`uninstall`).

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--global` | boolean | true (when `--project` absent) | Install/operate at global scope |
| `--project` | boolean | - | Operate at project scope |

---

## `adapters skill`

Manage skill folders for agents.

```bash
adapters skill list claude
adapters skill add claude ./skills/my-skill --global
adapters skill remove claude my-skill --project
```

**Subcommands:** `list`, `add`, `remove`, `where`, `agents`.
**Arguments:** `subcommand` (required), `agent`, `source/name`.

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--global` | boolean | false | User-level skills dir |
| `--project` | boolean | true | Project-level skills dir (default) |
| `--name <name>` | string | - | Override copied skill name |
| `--force` | boolean | false | Overwrite existing |
| `--json` | boolean | false | Output as JSON |

---

## `adapters agent`

Manage custom sub-agents for harnesses.

```bash
adapters agent list claude
adapters agent add claude ./my-agent.md --global
adapters agent remove claude my-agent.md --project
```

**Subcommands:** `list`, `add`, `remove`, `where`, `agents`.
**Arguments:** `subcommand` (required), `agent`, `source/name`.

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--global` | boolean | false | User-level agents dir |
| `--project` | boolean | true | Project-level agents dir (default) |
| `--name <name>` | string | - | Override copied agent name |
| `--force` | boolean | false | Overwrite existing |
| `--json` | boolean | false | Output as JSON |

---

## `adapters workspaces`

Manage temp workspaces and git worktrees.

```bash
adapters workspaces list
adapters workspaces create my-ws --repo ./repo --mode worktree
adapters workspaces delete my-ws --force
```

**Subcommands:** `list` (default), `create`, `archive`, `cleanup`, `recover`, `delete`, `sync-sessions`.
**Arguments:** `subcommand`, `workspace/name`.

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--repo <path>` | string (repeatable) | - | Local cloned repository path |
| `--mode <mode>` | string | worktree | `worktree` or `symlink` |
| `--name <name>` | string | - | Workspace name |
| `--root <dir>` | string | - | Override workspace root directory |
| `--force` | boolean | false | Allow delete to clean up on disk first |
| `--json` | boolean | false | Output as JSON |

---

## `adapters launch`

Launch a harness with provider/model config and stdin/stdout passthrough. This is the path for routing a harness to a cloud provider (Bedrock, Vertex, Azure Foundry, Ollama, Anthropic, and more).

```bash
adapters launch claude bedrock --region us-east-1
adapters launch codex bedrock --with-proxy-if-needed -p "fix the bug"
adapters launch claude anthropic --dry-run
```

**Arguments:** `harness` (required), `provider` (e.g. `bedrock`, `vertex`, `ollama`, `anthropic`).

**Options:**

| Flag | Type | Description |
|------|------|-------------|
| `--api-key <key>` | string | API key for the provider |
| `--profile <name>` | string | Profile |
| `--api-base <url>` | string | Custom API endpoint |
| `--region <region>` | string | Cloud region (Bedrock, Vertex) |
| `--project <id>` | string | Cloud project (Vertex, Foundry) |
| `--resource-group <name>` | string | Azure resource group |
| `--endpoint-name <name>` | string | Endpoint name |
| `--transport <t>`, `-t` | string | `anthropic`, `openai-chat`, `openai-responses`, `google` |
| `--auth-command <cmd>` | string | External command that emits a bearer token |
| `--with-proxy-if-needed` | boolean | Auto-launch proxy if harness can't speak provider natively |
| `--with-proxy` | boolean | Force proxy even if not needed |
| `--no-proxy` | boolean | Disable proxy (error if needed) |
| `--proxy-port <n>` | number | Proxy listen port (0=auto) |
| `--proxy-log-level <level>` | string | Proxy log level |
| `--resume <id>`, `-r` | string | Resume session by ID |
| `--session-id <id>`, `-s` | string | Explicit new session ID |
| `--prompt <text>`, `-p` | string | Non-interactive mode with prompt |
| `--interactive`, `-i` | boolean | Interactive mode |
| `--max-turns <n>` | number | Turn limit |
| `--max-budget-usd <n>` | number | Budget limit in USD |
| `--dry-run` | boolean | Print the resolved plan as JSON, don't execute |
| `--provider-arg <arg>` | string (repeatable) | Extra provider argument |
| `--observe` | boolean | Observe mode |
| `--workspace <id>` | string | Workspace identifier |
| `--workspace-create` | boolean | Create workspace |
| `--workspace-mode <mode>` | string | Workspace mode |
| `--workspace-repo <path>` | string (repeatable) | Workspace repo |
| `--workspace-name <name>` | string | Workspace name |
| `--yolo` | boolean | Auto-approve tool calls |
| `--bridge-interactive` | boolean | Bridge interactive mode |
| `--bridge-hooks` | boolean | Bridge hooks |

---

## `adapters detect-host`

Detect which agent harness this CLI is running under.

```bash
adapters detect-host
adapters detect-host --json
```

**Options:** `--json`.

---

## `adapters remote`

Install or update adapters on a remote host (SSH, Docker, Kubernetes, or local).

```bash
adapters remote install host.example.com --mode ssh --dry-run
adapters remote install my-pod --mode k8s --harness codex
```

**Subcommands:** `install`, `update`.
**Arguments:** `subcommand` (required), `host` (required - target host / pod / container).

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--mode <mode>` | string | ssh | `ssh` \| `docker` \| `k8s` \| `local` |
| `--harness <agent>` | string | claude | Agent to install after adapters |
| `--identity-file <path>` | string | - | SSH key path (ssh mode) |
| `--port <n>` | number | - | SSH port (ssh mode) |
| `--context <ctx>` | string | - | Kubernetes context (k8s mode) |
| `--force` | boolean | false | Reinstall even if already present |
| `--dry-run` | boolean | false | Print planned commands without executing |
| `--json` | boolean | false | Output as JSON |

---

## `adapters hooks`

Manage and dispatch unified agent hooks. See [Hooks](../features/hooks.md) for the conceptual model and per-harness hook tables.

```bash
adapters hooks discover
adapters hooks list
adapters hooks add --id trace-all --handler builtin --target trace
```

**Subcommands:** `discover`, `list`, `add`, `remove`, `set`, `handle`.
**Arguments:** `agent`, `hookType` (for `handle`).

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--handler <type>` | string | builtin | `builtin` \| `command` \| `script` |
| `--target <target>` | string | log | Handler target |
| `--priority <n>` | string | 100 | Sort order (lower = earlier) |
| `--enabled <bool>` | string | - | `true` \| `false` |
| `--id <id>` | string | - | Hook ID |
| `--global` | boolean | false | Global scope |
| `--project` | boolean | true | Project scope (default) |
| `--json` | boolean | false | Output as JSON |

---

## `adapters gateway`

Run the browser/mobile gateway service and manage its access tokens.

```bash
adapters gateway serve
adapters gateway tokens create --name phone --qr
adapters gateway status --url http://127.0.0.1:7878
```

**Subcommands:** `serve`, `tokens`, `status`.
**Arguments:** `subcommand` (required), `tokens-subcommand` (`list`, `create`, `revoke` under `tokens`).

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--config <path>` | string | default gateway config path | Gateway config path (serve, tokens) |
| `--host <host>` | string | - | Listen host (serve) |
| `--port <n>` | number | - | Listen port (serve) |
| `--webui <path>` | string | - | WebUI root (serve) |
| `--no-webui` | boolean | false | Disable WebUI (serve) |
| `--url <url>` | string | http://127.0.0.1:7878 | Gateway URL (status, tokens create) |
| `--name <name>` | string | token@<hostname> | Token name (tokens create) |
| `--ttl-ms <n>` | number | - | Token TTL in ms (tokens create) |
| `--qr` | boolean | false | Render QR (tokens create) |
| `--id <id>` | string | - | Token ID (tokens revoke) |
| `--json` | boolean | false | Output as JSON |

---

## `adapters doctor`

Run an environment health check. Run this first when something is not working.

```bash
adapters doctor
adapters doctor --json
```

**Options:** `--json`.

---

## `adapters tui`

Launch the Ink-based adapters TUI.

```bash
adapters tui
adapters tui --agent claude-code
```

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--agent <name>`, `-a` | string | claude-code | Default agent for new prompts |
| `--user-plugins-dir <dir>` | string | `$ADAPTERS_TUI_PLUGINS_DIR` or `~/.adapters/tui-plugins` | Override user-plugin discovery dir |
| `--no-user-plugins` | boolean | false | Skip discovering user plugins |

---

## `adapters version` / `adapters help`

```bash
adapters version
adapters --version

adapters help
adapters help run
```

`adapters version` (and `adapters --version`) prints the CLI version. `adapters help [command]` shows main help or per-command help.

---

## Not Supported

A handful of items appear in help text or are reserved internally but are **not** part of the supported command surface. Do not script against them:

- `adapters config --scope` (config does not take a scope flag - use `adapters profiles --scope` instead)
- `adapters install --version` (use `--pkg-version` to pin a version; `--version` prints the CLI version)
- `adapters mcp enable` / `adapters mcp disable` (the `mcp` command implements `list`, `install`, `uninstall` only)
- `adapters hooks install` (the `hooks` command implements `discover`, `list`, `add`, `remove`, `set`, `handle`)

---

## Related Documentation

- [Adapters](../features/adapters.md) - The conceptual guide to the Adapters runtime
- [Adapter Types reference](./adapter-types.md) - All 20 adapter package types enumerated (Adapters is a family, not one thing)
- [Adapters (ecosystem overview)](../ecosystem/adapters.md) - Introductory tour of the adapters family
- [Installation](../getting-started/installation.md) - Installing the `adapters` CLI and harness plugins
- [CLI Reference](./cli-reference.md) - The core `babysitter` orchestration CLI
- [Slash Commands](./slash-commands.md) - The in-session `/babysitter:*` surface
- [CLI Examples](../../cli-examples.md) - Worked command examples

---

## Next steps

- **Next:** [Configuration](./configuration.md)
- **Related:** [Adapters (concept)](../features/adapters.md), [Adapter Types reference](./adapter-types.md), [Install Matrix](../harnesses/install-matrix.md), [CLI Reference](./cli-reference.md)

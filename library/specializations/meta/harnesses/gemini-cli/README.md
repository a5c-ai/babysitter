# Gemini CLI Harness Extensibility

Comprehensive documentation for extending Google's Gemini CLI -- the official command-line interface for Google Gemini models.

**Repository:** [github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)
**Extension Gallery:** [geminicli.com/extensions](https://geminicli.com/extensions)
**Last updated:** 2026-04-02

---

## Overview

Gemini CLI is Google's official open-source command-line interface for interacting with Gemini models. It provides an extensible architecture built around extensions -- self-contained packages that add capabilities through prompts, MCP servers, commands, themes, hooks, sub-agents, and skills.

Extensions are distributed as directories containing a `gemini-extension.json` manifest and optional supporting files. They can be installed from GitHub repositories, local paths, or the community extension gallery.

---

## Extension System

### Extension Manifest: `gemini-extension.json`

Every Gemini CLI extension requires a `gemini-extension.json` manifest at the root of the extension directory. The manifest declares the extension's identity, capabilities, and MCP server configurations.

**Manifest fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Unique extension identifier |
| `version` | `string` | Yes | Semantic version |
| `description` | `string` | Yes | Human-readable description |
| `contextFileName` | `string` | No | Name of the project instruction file (e.g., `"GEMINI.md"`) |
| `mcpServers` | `object` | No | MCP server configurations (keyed by server name) |
| `settings` | `array` | No | Extension settings definitions (see Settings section) |
| `migratedTo` | `string` | No | New repo URI if the extension has moved (redirects installs) |

**Example manifest:**

```json
{
  "name": "babysitter",
  "version": "4.0.153",
  "description": "Orchestrate complex, multi-step workflows with event-sourced state management",
  "contextFileName": "GEMINI.md",
  "settings": [
    {
      "name": "babysitterApiKey",
      "description": "API key for babysitter cloud services",
      "envVar": "BABYSITTER_API_KEY",
      "sensitive": true
    }
  ]
}
```

### Extension Package Structure

A complete extension directory may contain:

```
my-extension/
  gemini-extension.json    # Required: extension manifest
  GEMINI.md                # Project instruction file (contextFileName)
  commands/                # Custom slash commands (TOML format)
    my-command/
      do-thing.toml
  hooks/                   # Lifecycle hooks
    hooks.json             # Hook registration (NOT in manifest)
    session-start.sh       # SessionStart hook script
    after-agent.sh         # AfterAgent hook script
  skills/                  # Agent skills (Agent Skills format)
  scripts/                 # Supporting shell scripts
  versions.json            # SDK/extension version tracking
```

---

## Extension Management

### Installing Extensions

Extensions are installed via the `gemini extensions install` command:

```bash
# Install from GitHub repository
gemini extensions install https://github.com/owner/repo

# Install from a local path
gemini extensions install /path/to/extension

# Install via the Babysitter SDK helper
babysitter harness:install-plugin gemini-cli
babysitter harness:install-plugin gemini-cli --workspace /path/to/repo
```

Extensions are stored in the Gemini CLI extension directory (typically `~/.gemini/extensions/`).

### Enable/Disable Per Workspace

Extensions can be enabled or disabled on a per-workspace basis. This allows different projects to use different extension configurations without affecting the global installation.

### Extension Settings and Keychain

Extensions can define settings that are stored per-user. Sensitive values (API keys, tokens) are stored securely using the system keychain rather than in plaintext configuration files.

---

## Skills

Skills are defined within the `skills/` directory of an extension. They follow the Agent Skills format -- structured definitions that declare what the skill does, when to trigger it, and how it should be invoked.

Skills are activated via the `activate_skill` tool within Gemini CLI sessions. The skill system allows extensions to expose domain-specific capabilities that the Gemini model can invoke during conversations.

---

## Commands

Extensions define custom slash commands in the `commands/` directory using TOML files. Each TOML file defines a command with a description and a prompt template.

**Command TOML format:**

```toml
description = "Start a new orchestration run"
prompt = """
You are an orchestration agent. Follow the protocol from GEMINI.md.

## Your Task
Fulfill the user's request: {{args}}

## Protocol Steps
1. Research the repository
2. Create the process
3. Setup the session loop
4. STOP -- the AfterAgent hook drives the loop
"""
```

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` | Shown in command help/discovery |
| `prompt` | `string` | Template injected when the command is invoked; `{{args}}` is replaced with user arguments |

Commands are invoked as slash commands in the Gemini CLI: `/extension-name:command-name [arguments]`.

---

## Hooks

Hooks are the primary mechanism for extensions to intercept and control the Gemini CLI session lifecycle. Hook registration lives in `hooks/hooks.json` within the extension directory -- **not** in the `gemini-extension.json` manifest.

### hooks.json Format

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "name": "my-session-start",
            "type": "command",
            "command": "bash \"${extensionPath}/hooks/session-start.sh\"",
            "timeout": 30000,
            "description": "Initialize session state"
          }
        ]
      }
    ],
    "AfterAgent": [
      {
        "matcher": "*",
        "hooks": [
          {
            "name": "my-after-agent",
            "type": "command",
            "command": "bash \"${extensionPath}/hooks/after-agent.sh\"",
            "timeout": 30000,
            "description": "Post-turn orchestration control"
          }
        ]
      }
    ]
  }
}
```

### Hook Types

Gemini CLI supports 11 hook types covering the full session and agent lifecycle:

| Hook Type | When It Fires | Use Case |
|-----------|--------------|----------|
| `SessionStart` | When a new Gemini CLI session begins | Initialize state, install dependencies, prepare workspace |
| `SessionEnd` | When a session ends (cleanup) | Cleanup resources, finalize state, emit metrics |
| `BeforeAgent` | Before each agent turn starts | Inject context, modify prompts, pre-turn setup |
| `AfterAgent` | After every agent turn completes | Orchestration loop control, session continuation/exit decisions |
| `BeforeModel` | Before each model API call | Request modification, logging, rate limiting |
| `AfterModel` | After each model API response | Response inspection, logging, post-processing |
| `BeforeToolSelection` | Before the model selects tools | Constrain available tools, inject tool guidance |
| `BeforeTool` | Before a tool is executed | Tool guards, permission checks, validation |
| `AfterTool` | After a tool execution completes | Result inspection, logging, post-tool actions |
| `PreCompress` | Before context compression occurs | Preserve important context, modify compression behavior |
| `Notification` | When the agent emits a notification | User alerts, status updates, progress reporting |

### Hook Registration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Unique hook identifier |
| `type` | `string` | Yes | Hook type (`"command"` for shell-based hooks) |
| `command` | `string` | Yes | Shell command to execute; `${extensionPath}` is the extension root |
| `timeout` | `number` | No | Timeout in milliseconds (default varies by hook type) |
| `description` | `string` | No | Human-readable description |
| `matcher` | `string` | AfterAgent only | Pattern to match (use `"*"` for all turns) |

### Hook Protocol

Hooks communicate with Gemini CLI via a strict I/O protocol:

**Input:** JSON via stdin. The payload varies by hook type.

**SessionStart input fields:**

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | `string` | Unique session identifier |
| `cwd` | `string` | Current working directory |
| `hook_event_name` | `string` | The hook event name |
| `timestamp` | `string` | ISO 8601 timestamp |

**AfterAgent input fields:**

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | `string` | Unique session identifier |
| `prompt` | `string` | The user's original prompt |
| `prompt_response` | `string` | The agent's response text for this turn |
| `stop_hook_active` | `boolean` | True if this hook is running as part of a retry |
| `transcript_path` | `string` | Path to the full conversation transcript |
| `cwd` | `string` | Current working directory |
| `hook_event_name` | `string` | The hook event name |
| `timestamp` | `string` | ISO 8601 timestamp |

**Output:** JSON via stdout. Plain text must NOT appear on stdout.

**AfterAgent output decisions:**

| Decision | JSON Output | Effect |
|----------|-------------|--------|
| Allow exit | `{}` or `{"decision":"allow"}` | Session exits normally |
| Block/continue | `{"decision":"block","reason":"...","systemMessage":"..."}` | Session continues with `reason` as next prompt context |
| Deny/retry | `{"decision":"deny","systemMessage":"..."}` | Session retries the current turn |

**Stderr:** Used for debug/log output only. Never parsed by Gemini CLI.

**Exit codes:**

| Code | Meaning |
|------|---------|
| `0` | Success; stdout is parsed as JSON |
| `2` | System block; stderr is used as the rejection reason |

### AfterAgent Hook for Orchestration

The AfterAgent hook is the primary mechanism for building orchestration loops in Gemini CLI. After every agent turn, the hook decides whether to continue or exit:

1. The hook reads the agent's response from `prompt_response` in the stdin JSON
2. It checks for a completion signal (e.g., a `<promise>PROOF</promise>` tag)
3. If the run is not complete, it returns `{"decision":"block","reason":"...","systemMessage":"..."}` which injects `reason` as the next turn's prompt context
4. If the run is complete (proof matches), it returns `{}` to allow the session to exit

This pattern enables deterministic, event-sourced orchestration loops where the hook -- not the agent -- controls the iteration lifecycle.

### Environment Variables Available in Hooks

| Variable | Description |
|----------|-------------|
| `GEMINI_SESSION_ID` | Unique ID for the current Gemini CLI session |
| `GEMINI_PROJECT_DIR` | Absolute path to the project root |
| `GEMINI_CWD` | Current working directory |
| `GEMINI_EXTENSION_PATH` | Absolute path to the extension directory (resolved by `${extensionPath}` in commands) |

---

## MCP (Model Context Protocol)

MCP servers are configured directly in the `gemini-extension.json` manifest under the `mcpServers` field. Each key is a server name, and the value is the server configuration.

**Example with MCP servers:**

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "Extension with MCP tools",
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"],
      "env": {
        "API_KEY": "{{settings.apiKey}}"
      }
    },
    "babysitter": {
      "command": "babysitter",
      "args": ["mcp:serve", "--json"]
    }
  }
}
```

MCP servers provide tools, resources, and prompts that the Gemini model can invoke during conversations. The `{{settings.apiKey}}` syntax references extension settings, with sensitive values resolved from the system keychain.

---

## GEMINI.md: Project Instruction Files

The `contextFileName` field in the manifest specifies the name of a project instruction file. When Gemini CLI opens a project that contains a file matching this name (e.g., `GEMINI.md`), its contents are automatically loaded into the model's context.

This is analogous to `.cursorrules` (Cursor), `CLAUDE.md` (Claude Code), or `AGENTS.md` (GitHub Copilot). It provides persistent project-specific instructions, conventions, and context to the model.

**Usage pattern:**

1. Extension manifest declares `"contextFileName": "GEMINI.md"`
2. The project root contains a `GEMINI.md` with project instructions
3. Gemini CLI loads `GEMINI.md` into context when the session starts
4. The model follows the instructions throughout the session

**Example GEMINI.md content:**

```markdown
# Project Instructions for Gemini CLI

This project uses the Babysitter orchestration engine.
When active, follow the AfterAgent hook loop protocol.

## Dependencies
- Babysitter SDK CLI must be installed
- jq must be available in PATH

## Orchestration Protocol
1. Create run with `babysitter run:create`
2. Iterate with `babysitter run:iterate`
3. Post results with `babysitter task:post`
4. STOP after each phase -- the hook drives the loop
```

---

## Distribution

### Primary: Git Repository Install

Extensions are distributed as **git repositories** and installed via:

```bash
# Install from GitHub repository (primary method)
gemini extensions install https://github.com/owner/extension-repo

# Install a specific version/ref
gemini extensions install https://github.com/owner/extension-repo --ref v2.1.0

# Install from a local path (development)
gemini extensions install /path/to/extension
```

The `gemini-extension.json` manifest must be at the repository root.

### GitHub Releases with Pre-Built Archives

Extensions can publish pre-built archives via GitHub Releases for faster installation. The archive naming convention is:

```
{platform}.{arch}.{name}.{extension}
```

Where platform is `linux`/`darwin`/`win32`, arch is `x64`/`arm64`, and extension is typically `tar.gz` or `zip`.

### Extension Gallery

The extension gallery at [geminicli.com/extensions](https://geminicli.com/extensions) provides discovery. To list an extension in the gallery, add the **`gemini-cli-extension`** topic tag to the GitHub repository. Gallery-listed extensions appear in `gemini extensions list` and are installable by name.

### Repository Migration

If an extension repository moves, add `"migratedTo": "https://github.com/new-owner/new-repo"` to the old repo's `gemini-extension.json`. Gemini CLI follows the redirect on install.

### Secondary: npm Packages

Extensions can also be packaged as npm packages for programmatic or CI/CD convenience:

```bash
npx @scope/my-gemini-extension install
```

### Community Extensions

The community maintains a curated list of Gemini CLI extensions at [github.com/Piebald-AI/awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli).

---

## Configuration

### Project-Level Configuration

Project-level configuration is primarily done through:

1. **GEMINI.md** (or the file specified by `contextFileName`) -- project instructions loaded into model context
2. **Extension enable/disable** -- per-workspace extension activation
3. **Extension settings** -- per-extension configuration values

### Extension Settings

Extensions define settings in the `settings` array of `gemini-extension.json`. Each setting specifies:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Setting identifier (used in `{{settings.name}}` templates) |
| `description` | `string` | Yes | Human-readable description shown during configuration |
| `envVar` | `string` | No | Environment variable name to inject the value as |
| `sensitive` | `boolean` | No | If `true`, stored in the system keychain (not plaintext) |

Sensitive values (API keys, secrets) are stored in the system keychain. Non-sensitive values are stored in the Gemini CLI configuration directory.

Settings are referenced in MCP server configurations and commands using the `{{settings.keyName}}` template syntax.

---

## Ecosystem

### Google-Built Extensions

Google provides first-party extensions for core functionality and integrations with Google Cloud services.

### Partner Extensions

Technology partners build extensions that integrate their tools and services with Gemini CLI.

### Community Extensions

The open-source community contributes extensions covering a wide range of use cases. The [awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli) repository by Piebald AI serves as a curated directory.

### Babysitter Integration

The Babysitter SDK provides a full Gemini CLI extension (`@a5c-ai/babysitter-gemini`) that adds:

- **Commands:** `/babysitter:call`, `/babysitter:resume`, `/babysitter:yolo`, `/babysitter:plan`, `/babysitter:doctor`, `/babysitter:observe`, and more
- **Hooks:** SessionStart (session state initialization) and AfterAgent (orchestration loop driver)
- **MCP:** Babysitter MCP server for tool-based run management
- **Context:** GEMINI.md with full orchestration protocol instructions

---

## Complete Code Examples

### Full Extension Manifest with MCP

```json
{
  "name": "my-orchestrator",
  "version": "2.1.0",
  "description": "Multi-step workflow orchestration for Gemini CLI",
  "contextFileName": "GEMINI.md",
  "mcpServers": {
    "orchestrator": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Full hooks.json with Multiple Hooks

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "name": "init-workspace",
            "type": "command",
            "command": "bash \"${extensionPath}/hooks/session-start.sh\"",
            "timeout": 30000,
            "description": "Initialize workspace state and dependencies"
          }
        ]
      }
    ],
    "AfterAgent": [
      {
        "matcher": "*",
        "hooks": [
          {
            "name": "orchestration-loop",
            "type": "command",
            "command": "bash \"${extensionPath}/hooks/after-agent.sh\"",
            "timeout": 30000,
            "description": "Drive the orchestration loop -- block/allow/deny based on run state"
          }
        ]
      }
    ]
  }
}
```

### AfterAgent Hook Script (Shell)

```bash
#!/bin/bash
# AfterAgent hook: reads JSON from stdin, outputs JSON to stdout
set -uo pipefail

# Capture stdin to temp file
INPUT_FILE=$(mktemp)
cat > "$INPUT_FILE"

# Parse session_id and prompt_response
SESSION_ID=$(jq -r '.session_id // empty' < "$INPUT_FILE")
RESPONSE=$(jq -r '.prompt_response // empty' < "$INPUT_FILE")

# Check for completion signal
if echo "$RESPONSE" | grep -q '<promise>'; then
  # Allow exit
  printf '{}\n'
else
  # Continue the loop
  printf '{"decision":"block","reason":"Continue orchestration","systemMessage":"Iteration continues"}\n'
fi

rm -f "$INPUT_FILE"
exit 0
```

### Command TOML

```toml
description = "Analyze repository structure and report findings"
prompt = """
You are a repository analysis agent. Analyze the codebase structure: {{args}}

1. Scan directory layout and key files
2. Identify frameworks, languages, and patterns
3. Report findings in a structured format
"""
```

---

## References

| Resource | URL | Accessed |
|----------|-----|----------|
| Gemini CLI Repository | [github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | 2026-04-03 |
| Extension Gallery | [geminicli.com/extensions](https://geminicli.com/extensions) | 2026-04-03 |
| Official Docs: Extensions Overview | [geminicli.com/docs/extensions/](https://geminicli.com/docs/extensions/) | 2026-04-03 |
| Official Docs: Writing Extensions | [geminicli.com/docs/extensions/writing-extensions/](https://geminicli.com/docs/extensions/writing-extensions/) | 2026-04-03 |
| Official Docs: Releasing Extensions | [geminicli.com/docs/extensions/releasing/](https://geminicli.com/docs/extensions/releasing/) | 2026-04-03 |
| Official Docs: Best Practices | [geminicli.com/docs/extensions/best-practices/](https://geminicli.com/docs/extensions/best-practices/) | 2026-04-03 |
| Official Docs: Hooks | [geminicli.com/docs/hooks/](https://geminicli.com/docs/hooks/) | 2026-04-03 |
| Official Docs: Writing Hooks | [geminicli.com/docs/hooks/writing-hooks/](https://geminicli.com/docs/hooks/writing-hooks/) | 2026-04-03 |
| Awesome Gemini CLI | [github.com/Piebald-AI/awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli) | 2026-04-03 |
| Babysitter Gemini Plugin | [github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-gemini](https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-gemini) | 2026-04-03 |
| Babysitter SDK | [npmjs.com/package/@a5c-ai/babysitter-sdk](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk) | 2026-04-03 |
| Babysitter Gemini Extension (npm) | [npmjs.com/package/@a5c-ai/babysitter-gemini](https://www.npmjs.com/package/@a5c-ai/babysitter-gemini) | 2026-04-03 |

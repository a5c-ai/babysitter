# Unified Plugin System Specification

Version: 1.0.0
Status: Implementation-ready specification
Audience: Platform engineers, compiler/runtime engineers, plugin authors
Last updated: 2026-04-17

---

## 1. Overview & Goals

The Unified Plugin System is a **build tool** that compiles a single canonical plugin definition (the Unified Plugin Format, or UPF) into harness-specific plugin packages for every supported AI coding agent.

### Problem

The babysitter project historically maintained multiple plugin directories under `plugins/`, but the source of truth is now unified and generated per target:

| Directory | Harness | Manual sync required |
|-----------|---------|---------------------|
| `plugins/babysitter-unified/` | Unified source | Source of truth |
| `plugins/babysitter-unified/per-harness/codex/` | Codex overlay | Harness-specific source overlay |
| `plugins/babysitter-unified/per-harness/cursor/` | Cursor overlay | Harness-specific source overlay |
| `plugins/babysitter-unified/per-harness/gemini/` | Gemini CLI overlay | Harness-specific source overlay |
| `plugins/babysitter-unified/per-harness/github/` | GitHub Copilot overlay | Harness-specific source overlay |
| `plugins/babysitter-unified/per-harness/pi/` | Pi overlay | Harness-specific source overlay |
| `plugins/babysitter-unified/per-harness/omp/` | oh-my-pi overlay | Harness-specific source overlay |
| `plugins/babysitter-unified/per-harness/opencode/` | OpenCode overlay | Harness-specific source overlay |
| `plugins/babysitter-unified/per-harness/openclaw/` | OpenClaw overlay | Harness-specific source overlay |

Every time a command, skill, or hook changes in the canonical plugin, the change must be manually propagated to all targets. The `scripts/plugin-command-sync-lib.cjs` library and per-target `sync-command-skills.js` scripts partially automate skill derivation, but the process is fragile and incomplete.

### Solution

Replace manual synchronization with a deterministic compiler:

```bash
npx @a5c-ai/extension-mux compile --target claude-code --output dist/claude-code
npx @a5c-ai/extension-mux compile --target codex --output dist/codex
npx @a5c-ai/extension-mux compile --target all --output dist/
```

### Design Principles

1. **Single source of truth**: One UPF package, N compiled outputs.
2. **Claude Code is the superset**: The UPF format is based on Claude Code's `plugin.json` because it has the richest component model.
3. **Deterministic output**: Same input always produces identical output.
4. **Lossless where possible, explicit degradation where not**: When a target does not support a component, the compiler emits a diagnostic rather than silently dropping it.
5. **hooks-mux is a dependency, not internalized**: Hook execution routing goes through the hooks-mux subsystem. The compiler generates the shell/Node.js/PowerShell wrapper scripts that call into hooks-mux.
6. **agent-catalog is authoritative for target metadata**: Target capabilities, hook mappings, install paths, argv detection hints, and package/bin generation metadata are read from `@a5c-ai/agent-catalog`; compiler code only adapts that declarative graph into emitted files.

---

## 2. Unified Plugin Format (UPF) -- The Source Format

### 2.1 Directory Structure

```
my-plugin/
  a5c-plugin.json          # Unified manifest (required)
  versions.json            # SDK + hooks-mux version pins (required)
  commands/                # Slash commands (*.md files)
    call.md
    yolo.md
    plan.md
    resume.md
    help.md
    ...
  skills/                  # Skills (each in its own directory)
    babysit/
      SKILL.md
    custom-skill/
      SKILL.md
  hooks/                   # Canonical hook handlers
    session-start.handler.sh
    stop.handler.sh
    user-prompt-submit.handler.sh
    pre-tool-use.handler.sh
  agents/                  # Agent definitions (*.md)
    AGENTS.md              # Combined agent instructions
  assets/                  # Icons, logos, screenshots
    icon.png
  context/                 # Context files for injection
    GEMINI.md              # Gemini-specific context
    AGENTS.md              # Copilot/Pi agent context
  overrides/               # Per-target override files
    codex/
      extra-skills.json
    gemini/
      hooks-mapping.json
```

### 2.2 `a5c-plugin.json` Manifest Schema

This is the canonical manifest. It extends Claude Code's `plugin.json` with cross-target metadata and override sections.

```jsonc
{
  // ── Identity ──────────────────────────────────────────────────
  "name": "babysitter",                          // string, required. Plugin name.
  "version": "5.0.0",                            // string, required. Semver.
  "description": "Orchestrate complex...",        // string, required. Human-readable.
  "author": "a5c.ai",                            // string | { name, email }, required.
  "license": "MIT",                              // string, required. SPDX identifier.

  // ── Repository & Discovery ────────────────────────────────────
  "repository": {                                 // object, optional.
    "type": "git",
    "url": "https://github.com/a5c-ai/babysitter"
  },
  "homepage": "https://github.com/a5c-ai/babysitter#readme",  // string, optional.
  "keywords": [                                   // string[], optional. Discovery tags.
    "orchestration", "workflow", "automation"
  ],

  // ── Components ────────────────────────────────────────────────
  "hooks": {                                      // object, required if hooks exist.
    // Maps canonical hook names to handler script paths.
    // These are the "real" handlers -- the compiler generates
    // the per-target wrapper scripts from these.
    "SessionStart": "hooks/session-start.handler.sh",
    "Stop": "hooks/stop.handler.sh",
    "UserPromptSubmit": "hooks/user-prompt-submit.handler.sh",
    "PreToolUse": "hooks/pre-tool-use.handler.sh"
  },

  "commands": [],                                 // string[] | string, optional.
                                                  // Array of command files or directory path.
                                                  // If string, treated as directory containing *.md.
                                                  // If array, each entry is a path to a command file.

  "skills": [                                     // array, optional.
    {
      "name": "babysit",                          // string, required. Skill identifier.
      "file": "skills/babysit/SKILL.md"           // string, required. Path to SKILL.md.
    }
  ],

  "agents": "agents/AGENTS.md",                   // string | string[], optional.
                                                   // Path(s) to agent definition files.

  // ── Context Files ─────────────────────────────────────────────
  "contextFiles": {                                // object, optional.
    // Maps target names to context file paths.
    // These are injected into the target's context mechanism.
    "gemini": "context/GEMINI.md",
    "github-copilot": "context/AGENTS.md",
    "pi": "context/AGENTS.md",
    "oh-my-pi": "context/AGENTS.md"
  },

  // ── Target-Specific Overrides ─────────────────────────────────
  "targets": {                                     // object, optional.
    "claude-code": {
      // Override or extend any top-level field for this target.
      // Merged on top of the base manifest during compilation.
    },
    "codex": {
      "npmPackageName": "@a5c-ai/babysitter-codex",
      "skills": "derive-from-commands",            // Special directive.
      "hooks": {
        // Override hook config for Codex.
        "PreToolUse": null                         // Disable this hook for Codex.
      }
    },
    "gemini": {
      "extensionManifest": {
        "contextFileName": "GEMINI.md",
        "settings": []
      },
      "commands": "commands/",                     // Gemini uses TOML commands.
      "hooks": {
        "AfterAgent": "hooks/after-agent.handler.sh"  // Gemini-specific hook.
      }
    },
  },

  // ── Hook Configuration ────────────────────────────────────────
  "hookConfig": {                                  // object, optional.
    "proxyAdapter": true,                          // boolean. Use hooks-mux for all hooks.
    "matchers": {                                   // Per-hook matchers.
      "PreToolUse": "Bash"                          // Claude Code: matcher for PreToolUse.
    }
  }
}
```

#### 2.2.1 Formal JSON Schema for `a5c-plugin.json`

The following TypeScript interface defines the canonical type for the UPF manifest:

```typescript
interface A5cPluginManifest {
  // ── Identity (required) ──────────────────────────────────────
  name: string;                                     // Plugin name (kebab-case)
  version: string;                                  // Semver string (e.g., "5.0.0")
  description: string;                              // Human-readable description
  author: string | { name: string; email?: string }; // Author identity
  license: string;                                  // SPDX license identifier

  // ── Repository & Discovery (optional) ────────────────────────
  repository?: {
    type: string;                                   // e.g., "git"
    url: string;                                    // Repository URL
  };
  homepage?: string;                                // Project homepage URL
  keywords?: string[];                              // Discovery tags

  // ── Components ────────────────────────────────────────────────
  hooks?: Record<string, string | null>;            // Canonical hook name -> handler path
                                                    // null removes the hook for a target
  commands?: string[] | string;                     // Command file paths or directory path
  skills?: Array<{
    name: string;                                   // Skill identifier
    file: string;                                   // Path to SKILL.md
  }>;
  agents?: string | string[];                       // Agent definition file path(s)

  // ── Context Files ─────────────────────────────────────────────
  contextFiles?: Record<string, string>;            // Target name -> context file path

  // ── Target-Specific Overrides ─────────────────────────────────
  targets?: Record<string, TargetOverride>;

  // ── Hook Configuration ────────────────────────────────────────
  hookConfig?: {
    proxyAdapter?: boolean;                         // Use hooks-mux for all hooks
    matchers?: Record<string, string>;              // Per-hook matchers (e.g., PreToolUse: "Bash")
  };
}

interface TargetOverride {
  // Override or extend any top-level field
  npmPackageName?: string;                          // npm package name for publishable targets
  type?: "typescript-build";                        // Indicates target requires a build step
  skills?: "derive-from-commands" | Array<{ name: string; file: string }>;
  hooks?: Record<string, string | null>;            // Override/disable specific hooks
  commands?: string[] | string;
  extensionManifest?: {                             // Gemini-specific
    contextFileName?: string;
    settings?: unknown[];
  };
  extraFiles?: Record<string, string>;              // Output path -> source path
  [key: string]: unknown;                           // Extensible for future targets
}
```

**JSON Schema** (for tooling and validation):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://a5c.ai/schemas/a5c-plugin.json",
  "title": "Unified Plugin Format Manifest",
  "type": "object",
  "required": ["name", "version", "description", "author", "license"],
  "properties": {
    "name": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "version": { "type": "string" },
    "description": { "type": "string" },
    "author": {
      "oneOf": [
        { "type": "string" },
        {
          "type": "object",
          "required": ["name"],
          "properties": {
            "name": { "type": "string" },
            "email": { "type": "string", "format": "email" }
          }
        }
      ]
    },
    "license": { "type": "string" },
    "repository": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "url": { "type": "string", "format": "uri" }
      }
    },
    "homepage": { "type": "string", "format": "uri" },
    "keywords": { "type": "array", "items": { "type": "string" } },
    "hooks": {
      "type": "object",
      "additionalProperties": { "type": ["string", "null"] }
    },
    "commands": {
      "oneOf": [
        { "type": "string" },
        { "type": "array", "items": { "type": "string" } }
      ]
    },
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "file"],
        "properties": {
          "name": { "type": "string" },
          "file": { "type": "string" }
        }
      }
    },
    "agents": {
      "oneOf": [
        { "type": "string" },
        { "type": "array", "items": { "type": "string" } }
      ]
    },
    "contextFiles": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    },
    "targets": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "npmPackageName": { "type": "string" },
          "type": { "type": "string", "enum": ["typescript-build"] },
          "skills": {
            "oneOf": [
              { "type": "string", "enum": ["derive-from-commands"] },
              { "type": "array" }
            ]
          },
          "hooks": {
            "type": "object",
            "additionalProperties": { "type": ["string", "null"] }
          },
          "extraFiles": {
            "type": "object",
            "additionalProperties": { "type": "string" }
          }
        },
        "additionalProperties": true
      }
    },
    "hookConfig": {
      "type": "object",
      "properties": {
        "proxyAdapter": { "type": "boolean" },
        "matchers": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    }
  },
  "additionalProperties": false
}
```

### 2.3 `versions.json` Schema

Pinned dependency versions for SDK and hooks-mux. Used by hook scripts to install the correct versions at runtime.

```json
{
  "sdkVersion": "5.0.1-staging.b5c14f2a"
}
```

The `sdkVersion` field is used for **both** `@a5c-ai/babysitter-sdk` and `@a5c-ai/hooks-mux-cli` installation. This is the current behavior in the codebase -- both packages share a version.

For Gemini, an optional `extensionVersion` field can be added:

```json
{
  "sdkVersion": "5.0.0",
  "extensionVersion": "5.0.0"
}
```

The `scripts/bump-version.mjs` script automatically updates all `versions.json` files across plugin directories.

---

## 3. Component Definitions

### 3.1 Commands (`commands/*.md`)

Commands are Claude Code slash commands. Each is a Markdown file with YAML frontmatter.

**Frontmatter fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | yes | One-line description shown in command list |
| `argument-hint` | string | no | Placeholder text for command argument input |
| `allowed-tools` | string (CSV) | no | Comma-separated list of tools the command may use |

**Example -- `commands/call.md`:**

```markdown
---
description: Orchestrate a babysitter run. use this command to start babysitting a complex workflow.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).
```

**Example -- `commands/yolo.md`:**

```markdown
---
description: Orchestrate a babysitter run. use this command to start babysitting a complex workflow in a non-interactive mode, without any user interaction or breakpoints in the run.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). but without any user interaction or breakpoints in the run.
```

**Current codebase commands** (all in `plugins/babysitter-unified/commands/`):
`call.md`, `yolo.md`, `forever.md`, `plan.md`, `resume.md`, `help.md`, `observe.md`, `cleanup.md`, `plugins.md`, `project-install.md`, `user-install.md`, `contrib.md`, `retrospect.md`, `assimilate.md`, `doctor.md`

### 3.2 Skills (`skills/*/SKILL.md`)

Skills are longer-form instructions loaded by the agent when a skill is invoked. Each skill lives in its own directory with a `SKILL.md` file.

**Frontmatter fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Skill identifier (used in `/plugin:skill` invocation) |
| `description` | string | yes | When this skill should be triggered |
| `allowed-tools` | string (CSV) | no | Tools the skill may use |
| `version` | string | no | Skill version |

**Example -- `skills/babysit/SKILL.md`:**

```markdown
---
name: babysit
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
version: 0.1.3
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution.
...
```

**Standalone vs. command-derived skills:**

Some skills are standalone (like `babysit`). Others are **derived from commands** via the `buildSkillFromCommand()` function in `scripts/plugin-command-sync-lib.cjs`. This function:

1. Parses the command's YAML frontmatter
2. Extracts `description` (or falls back to `"Babysitter ${name} mode."`)
3. Extracts the Markdown body
4. Renders a `SKILL.md` with `name` and `description` frontmatter plus the body

**Transformation (from `plugin-command-sync-lib.cjs`):**

```javascript
function buildSkillFromCommand(name, commandMarkdown) {
  const parsed = parseFrontmatter(commandMarkdown);
  return renderSkillMarkdown(
    name,
    parsed.data.description || `Babysitter ${name} mode.`,
    parsed.body,
  );
}

function renderSkillMarkdown(name, description, body) {
  return [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    '---',
    '',
    `# ${name}`,
    '',
    body.trim(),
    '',
  ].join('\n');
}
```

The `babysit` and `babysitter` skills are **excluded** from command-based derivation (they are standalone).

### 3.3 Hooks (`hooks/`)

Hooks are lifecycle event handlers executed by the harness at specific points during a session.

#### 3.3.1 Canonical Hook Names

The UPF defines a superset of hook names. Not all targets support all hooks.

| Canonical Name | Description | Claude Code | Codex | Cursor | Gemini | Copilot | OpenCode | OpenClaw |
|----------------|-------------|-------------|-------|--------|--------|---------|----------|----------|
| `SessionStart` | Session begins | yes | yes | yes (`sessionStart`) | yes | yes (`sessionStart`) | yes (`session.created`) | yes (`session_start`) |
| `Stop` | Agent wants to stop | yes | yes | yes (`stop`) | -- | -- | -- | -- |
| `UserPromptSubmit` | User submits prompt | yes | yes | -- | -- | yes (`userPromptSubmitted`) | -- | -- |
| `PreToolUse` | Before tool execution | yes | -- | -- | -- | -- | yes (`tool.execute.before`) | -- |
| `PostToolUse` | After tool execution | -- | -- | -- | -- | -- | yes (`tool.execute.after`) | -- |
| `AfterAgent` | After agent turn | -- | -- | -- | yes | -- | -- | yes (`agent_end`) |
| `SessionEnd` | Session ends | -- | -- | -- | -- | yes (`sessionEnd`) | -- | yes (`session_end`) |
| `SessionIdle` | Agent goes idle | -- | -- | -- | -- | -- | yes (`session.idle`) | -- |
| `ShellEnv` | Shell env injection | -- | -- | -- | -- | -- | yes (`shell.env`) | -- |
| `BeforePromptBuild` | Before prompt assembly | -- | -- | -- | -- | -- | -- | yes (`before_prompt_build`) |
| `SubagentStop` | Subagent stops | yes | -- | -- | -- | -- | -- | -- |
| `Notification` | Notification event | yes | -- | -- | -- | -- | -- | -- |
| `PreCompact` | Before context compaction | yes | -- | -- | -- | -- | -- | -- |

#### 3.3.2 The `babysitter-proxied-*` Hook Script Pattern

All hook-capable targets use the same pattern: a **wrapper script** that ensures the SDK and hooks-mux are installed, then delegates to hooks-mux with the correct adapter name.

The target-specific values injected into these templates (`adapterName`, plugin-root env var, script variant set, install path layout, package/bin behavior) are catalog-driven. The compiler should not introduce a second handwritten registry for those surfaces.

The wrapper scripts follow a template with three variants:

**Bash variant** (Claude Code, Codex, Gemini, GitHub Copilot, Cursor):

```bash
#!/bin/bash
# Unified {{HOOK_TITLE}} Hook for {{HARNESS_DISPLAY_NAME}}
# Routes through hooks-mux for all hook execution.

set -euo pipefail

PLUGIN_ROOT="${{{PLUGIN_ROOT_ENV_VAR}}:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_MARKER_FILE="${PLUGIN_ROOT}/.babysitter-install-attempted"
PROXY_MARKER_FILE="${PLUGIN_ROOT}/.hooks-mux-install-attempted"

GLOBAL_ROOT="${BABYSITTER_GLOBAL_STATE_DIR:-$HOME/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-${GLOBAL_ROOT}/logs}"
LOG_FILE="$LOG_DIR/babysitter-{{HOOK_TYPE}}-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

# ... (logging helper, SDK install, hooks-mux install) ...

# Delegate to hooks-mux
RESULT=$($PROXY invoke \
  --adapter {{ADAPTER_NAME}} \
  --handler "babysitter hook:run --harness unified --hook-type {{HOOK_TYPE}} --plugin-root ${PLUGIN_ROOT} --json" \
  --json \
  < "$INPUT_FILE" 2>"$STDERR_LOG")
```

**Template variables:**

| Variable | Description | Examples |
|----------|-------------|---------|
| `{{ADAPTER_NAME}}` | hooks-mux adapter name | `claude`, `codex`, `gemini`, `copilot`, `cursor`, `opencode`, `openclaw` |
| `{{HOOK_TYPE}}` | Babysitter hook type | `session-start`, `stop`, `user-prompt-submit`, `pre-tool-use` |
| `{{PLUGIN_ROOT_ENV_VAR}}` | Env var for plugin root | `CLAUDE_PLUGIN_ROOT`, `COPILOT_PLUGIN_DIR`, `GEMINI_EXTENSION_PATH`, `CURSOR_PLUGIN_ROOT`, `OPENCODE_PLUGIN_ROOT` |
| `{{HARNESS_DISPLAY_NAME}}` | Human-readable harness name | `Claude Code`, `GitHub Copilot CLI`, `Gemini CLI`, `Cursor`, `OpenCode` |
| `{{HOOK_TITLE}}` | Human-readable hook title | `Session Start`, `Stop`, `User Prompt Submit` |

**PowerShell variant** (Cursor, GitHub Copilot -- Windows support):

Same logic as bash, but using PowerShell idioms. The compiler generates `.ps1` files alongside `.sh` files for targets that require PowerShell support.

Key differences from bash:
- `$ErrorActionPreference = "Stop"` instead of `set -euo pipefail`
- `Get-Command` instead of `command -v`
- `$env:PATH = "...;$env:PATH"` instead of `export PATH="...:$PATH"`
- `ConvertFrom-Json` instead of `node -e` for JSON parsing

**Node.js variant** (OpenCode):

OpenCode hooks are JavaScript files (`.js`), not shell scripts. Same logic but using `child_process.execSync`:

```javascript
#!/usr/bin/env node
// Unified {{HOOK_TITLE}} Hook for OpenCode

const { execSync } = require("child_process");
// ... install logic ...

function runViaProxy(proxy, hookType, inputJson) {
  const handler = `babysitter hook:run --harness unified --hook-type ${hookType} --plugin-root ${PLUGIN_ROOT} --json`;
  const result = execSync(`"${proxy}" invoke --adapter opencode --handler "${handler}" --json`, {
    input: inputJson,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 30000,
  });
  return result.toString("utf8").trim();
}
```

#### 3.3.3 Hook Registration Formats by Target

Each target has its own format for declaring which hooks exist. The compiler must emit the correct format:

**Claude Code (`hooks.json`):**

```json
{
  "description": "Babysitter plugin hooks for continuous orchestration loops and token compression",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-proxied-session-start-hook.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-proxied-pre-tool-use-hook.sh"
          }
        ]
      }
    ]
  }
}
```

Key details:
- Optional top-level `description` field (human-readable summary of the hooks)
- Uses `${CLAUDE_PLUGIN_ROOT}` template variable
- Optional `matcher` field for filtering (e.g., `"Bash"` for PreToolUse)
- No `version` field
- Hook names: PascalCase (`SessionStart`, `Stop`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `SubagentStop`, `Notification`, `PreCompact`, `SessionEnd`)

**Codex (`hooks.json`):**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/babysitter-session-start.sh"
          }
        ]
      }
    ]
  }
}
```

Key details:
- Uses relative paths (`./hooks/...`)
- Requires `matcher` field (uses `".*"` regex for catch-all)
- Same PascalCase hook names as Claude Code

**Cursor (`hooks-cursor.json`):**

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

Key details:
- Has `"version": 1` field
- Hook names: camelCase (`sessionStart`, `stop`)
- Separate `bash` and `powershell` fields (not `command`)
- `timeoutSec` (seconds) for timeouts
- `loop_limit` field for stop hooks
- Relative paths (no template variable)

**GitHub Copilot (`hooks.json`):**

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "command",
        "bash": "./hooks/session-start.sh",
        "powershell": "./hooks/session-start.ps1",
        "timeoutSec": 30
      }
    ],
    "sessionEnd": [...],
    "userPromptSubmitted": [...]
  }
}
```

Key details:
- Has `"version": 1` field
- Hook names: camelCase (`sessionStart`, `sessionEnd`, `userPromptSubmitted`)
- Note: `userPromptSubmitted` (past tense), not `UserPromptSubmit`
- Separate `bash` and `powershell` fields
- `timeoutSec` for timeouts

**Gemini (`hooks/hooks.json`):**

```json
{
  "description": "Babysitter plugin hooks for Gemini CLI — session initialization and AfterAgent continuation loop",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "name": "babysitter-session-start",
            "type": "command",
            "command": "bash \"${extensionPath}/hooks/session-start.sh\"",
            "timeout": 30000,
            "description": "Initializes a Babysitter session state file so the AfterAgent hook can track orchestration progress"
          }
        ]
      }
    ],
    "AfterAgent": [
      {
        "matcher": "*",
        "hooks": [
          {
            "name": "babysitter-after-agent",
            "type": "command",
            "command": "bash \"${extensionPath}/hooks/after-agent.sh\"",
            "timeout": 30000,
            "description": "Babysitter orchestration loop driver — blocks session exit to continue iterating until the run is complete"
          }
        ]
      }
    ]
  }
}
```

Key details:
- Optional top-level `description` field (human-readable summary)
- Uses `${extensionPath}` template variable (not `${CLAUDE_PLUGIN_ROOT}`)
- Has `name` and `description` fields per hook entry
- `timeout` in **milliseconds** (not seconds)
- Glob matcher `"*"` (not regex `".*"`)
- PascalCase hook names

**OpenCode (`hooks/hooks.json`):**

```json
{
  "version": 1,
  "description": "Babysitter hook registration for OpenCode.",
  "hooks": {
    "session.created": [
      {
        "type": "command",
        "script": "hooks/session-created.js",
        "description": "Initialize babysitter session state",
        "timeoutMs": 30000
      }
    ],
    "tool.execute.before": [
      {
        "type": "command",
        "script": "hooks/tool-execute-before.js",
        "description": "Pre-tool-use hook",
        "timeoutMs": 10000
      }
    ]
  }
}
```

Key details:
- Has `"version": 1` and `"description"` fields
- Hook names: dot-separated lowercase (`session.created`, `session.idle`, `shell.env`, `tool.execute.before`, `tool.execute.after`)
- Uses `script` field (not `command` or `bash`)
- Scripts are **JavaScript** (.js), not shell
- `timeoutMs` in milliseconds

**OpenClaw (`openclaw.plugin.json` hooks section):**

```json
{
  "hooks": {
    "session_start": "extensions/hooks/session-start.ts",
    "session_end": "extensions/hooks/session-end.ts",
    "before_prompt_build": "extensions/hooks/before-prompt-build.ts",
    "agent_end": "extensions/hooks/agent-end.ts"
  }
}
```

Key details:
- Hook names: snake_case (`session_start`, `session_end`, `before_prompt_build`, `agent_end`)
- Values are **TypeScript file paths** (not command strings)
- Hooks are part of the `openclaw.plugin.json` manifest, not a separate file
- OpenClaw also has a `hooks.json` in Claude Code format (with `matcher: "*"`) for Claude Code compatibility

### 3.4 Agents (`agents/*.md` or `AGENTS.md`)

Agent instructions are Markdown files that provide behavioral guidance to the AI agent when operating under plugin control.

**Different targets use different context file mechanisms:**

| Target | File | Mechanism |
|--------|------|-----------|
| Claude Code | -- | Uses skills and hooks (no separate agent file) |
| Codex | -- | Uses skills directly |
| Cursor | -- | Uses skills directly |
| Gemini | `GEMINI.md` | `contextFileName` in `gemini-extension.json` |
| GitHub Copilot | `AGENTS.md` | `"agents": "AGENTS.md"` in `plugin.json` |
| Pi | `AGENTS.md` | Packaged in `files` array |
| oh-my-pi | `AGENTS.md` | Packaged in `files` array |
| OpenCode | -- | Uses skills directly |
| OpenClaw | -- | In-process hooks inject context |

**Example -- `AGENTS.md` for GitHub Copilot:**

```markdown
# Babysitter Orchestration Agent

You are operating under Babysitter orchestration. Babysitter manages complex, multi-step
workflows with event-sourced state management, hook-based extensibility, and human-in-the-loop
approval gates.

## Key Behaviors

1. **Follow the process definition exactly.**
2. **Report completion accurately.**
3. **Respect breakpoints.**
4. **Use structured output.**
5. **Completion proof.** Output `<promise>COMPLETION_PROOF</promise>` when done.

## Environment

- **Harness**: GitHub Copilot CLI (`copilot`)
- **SDK CLI**: `babysitter`
...
```

---

## 4. Target Profiles

Each target has a well-defined native format. The compiler must emit files conforming to these formats exactly.

### 4.1 Claude Code (`claude-code`)

**Native format:**
- `plugin.json` -- Plugin manifest
- `hooks.json` (or `hooks/hooks.json`) -- Hook registration
- `commands/*.md` -- Slash commands
- `skills/*/SKILL.md` -- Skills
- `versions.json` -- SDK version pin

**Manifest (`plugin.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "...",
  "author": "a5c.ai",
  "license": "MIT",
  "hooks": {
    "SessionStart": "hooks/babysitter-session-start-hook.sh",
    "Stop": "hooks/babysitter-stop-hook.sh"
  },
  "commands": [],
  "skills": [
    { "name": "babysitter", "file": "skills/babysit/SKILL.md" }
  ],
  "repository": { "type": "git", "url": "..." },
  "keywords": [...]
}
```

Notes:
- `hooks` can be a string (path to hooks.json) or inline object mapping hook names to script paths
- `commands` can be `[]` (auto-discovered from commands/) or explicit list
- `skills` is an array of `{ name, file }` objects
- Plugin root env var: `CLAUDE_PLUGIN_ROOT`

**Emitted file tree:**

```
dist/claude-code/
  plugin.json
  hooks.json
  hooks/
    babysitter-proxied-session-start-hook.sh
    babysitter-proxied-stop-hook.sh
    babysitter-proxied-user-prompt-submit-hook.sh
    babysitter-proxied-pre-tool-use-hook.sh
    babysitter-session-start-hook.sh        (legacy non-proxied)
    babysitter-stop-hook.sh                 (legacy non-proxied)
    babysitter-user-prompt-submit-hook.sh   (legacy non-proxied)
    babysitter-pre-tool-use-hook.sh         (legacy non-proxied)
    proxied-hooks.json                      (alternative hooks.json)
  commands/
    call.md
    yolo.md
    ...
  skills/
    babysit/
      SKILL.md
  versions.json
```

### 4.2 Codex (`codex`)

**Native format:**
- `package.json` -- npm package manifest with SDK dependency
- `hooks.json` -- Hook registration (nested array with `matcher: ".*"`)
- `skills/*/SKILL.md` -- Skills (derived from commands via `buildSkillFromCommand()`)
- `.codex-plugin/` -- Codex-specific metadata directory
- `.app.json` -- App manifest
- `plugin.lock.json` -- Lock file
- `versions.json` -- SDK version pin

**Manifest (`package.json`):**

```json
{
  "name": "@a5c-ai/babysitter-codex",
  "version": "5.0.0",
  "description": "Babysitter Codex skill bundle...",
  "scripts": {
    "test": "node test/integration.test.js && node test/packaged-install.test.js",
    "sync:commands": "node scripts/sync-command-skills.js",
    "deploy": "npm publish --access public",
    "deploy:staging": "npm publish --access public --tag staging"
  },
  "bin": { "babysitter-codex": "bin/cli.js" },
  "files": [
    ".codex-plugin/", "assets/", "hooks/", "hooks.json",
    "skills/", ".app.json", "bin/", "scripts/",
    "plugin.lock.json", "README.md"
  ],
  "keywords": ["babysitter", "codex", "orchestration"],
  "author": "a5c.ai",
  "license": "MIT",
  "publishConfig": { "access": "public" },
  "dependencies": { "@a5c-ai/babysitter-sdk": "5.0.0" }
}
```

**Hooks (`hooks.json`):**

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": ".*", "hooks": [{ "type": "command", "command": "./hooks/babysitter-session-start.sh" }] }
    ],
    "UserPromptSubmit": [
      { "matcher": ".*", "hooks": [{ "type": "command", "command": "./hooks/user-prompt-submit.sh" }] }
    ],
    "Stop": [
      { "matcher": ".*", "hooks": [{ "type": "command", "command": "./hooks/babysitter-stop-hook.sh" }] }
    ]
  }
}
```

Key difference from Claude Code: every hook entry **requires a `matcher` field** (regex pattern, `".*"` for catch-all).

**Skill derivation:** Codex does not use commands directly. Instead, skills are derived from commands:

1. For each command `commands/call.md`, create `skills/call/SKILL.md` using `buildSkillFromCommand("call", readFileSync("commands/call.md"))`
2. The `babysit` and `babysitter` skills are excluded from derivation (they are standalone)

**Emitted file tree:**

```
dist/codex/
  package.json
  hooks.json
  hooks/
    babysitter-session-start.sh
    babysitter-stop-hook.sh
    user-prompt-submit.sh
  skills/
    babysit/SKILL.md         (standalone, copied)
    call/SKILL.md            (derived from commands/call.md)
    yolo/SKILL.md            (derived from commands/yolo.md)
    plan/SKILL.md            (derived from commands/plan.md)
    resume/SKILL.md          (derived from commands/resume.md)
    ...
  versions.json
  bin/
    cli.js
  assets/
  .codex-plugin/
  .app.json
  plugin.lock.json
```

### 4.3 Cursor (`cursor`)

**Native format:**
- `plugin.json` -- Plugin manifest (points to `hooks/hooks-cursor.json`)
- `hooks/hooks-cursor.json` -- Hook registration (v1 format with bash+ps1 pairs)
- `commands/*.md` -- Slash commands (same format as Claude Code)
- `skills/*/SKILL.md` -- Skills
- `versions.json` -- SDK version pin

**Manifest (`plugin.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "...",
  "author": "a5c.ai",
  "license": "MIT",
  "hooks": "hooks/hooks-cursor.json",
  "commands": "commands/",
  "skills": "skills/",
  "repository": { "type": "git", "url": "..." },
  "keywords": ["orchestration", "workflow", "cursor", ...]
}
```

Note: `commands` and `skills` can be **directory paths** (strings) instead of arrays.

**Hooks (`hooks/hooks-cursor.json`):**

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

Cursor-specific details:
- Requires **both bash and PowerShell** variants for each hook
- camelCase hook names: `sessionStart`, `stop`
- `timeoutSec` in seconds
- `loop_limit: null` on stop hooks

**Emitted file tree:**

```
dist/cursor/
  plugin.json
  hooks/
    hooks-cursor.json
    session-start.sh
    session-start.ps1
    stop-hook.sh
    stop-hook.ps1
    babysitter-proxied-session-start.sh
    babysitter-proxied-session-start.ps1
    babysitter-proxied-stop-hook.sh
    babysitter-proxied-stop-hook.ps1
    proxied-hooks.json
  commands/
    call.md
    yolo.md
    ...
  skills/
    babysit/SKILL.md
    ...
  versions.json
```

### 4.4 Gemini (`gemini`)

**Native format:**
- `plugin.json` -- Plugin manifest (includes `extensionManifest` reference and `contextFileName`)
- `gemini-extension.json` -- Gemini extension manifest
- `commands/*.toml` -- Commands in TOML format (not Markdown)
- `GEMINI.md` -- Context file injected into every session
- `hooks/hooks.json` -- Hook registration (with `name`, `description`, `timeout` in ms)
- `versions.json` -- SDK version pin

**Manifest (`plugin.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "...",
  "author": "a5c.ai",
  "license": "MIT",
  "harness": "gemini-cli",
  "hooks": {
    "SessionStart": "hooks/session-start.sh",
    "AfterAgent": "hooks/after-agent.sh"
  },
  "commands": [
    "commands/call.toml",
    "commands/yolo.toml",
    ...
  ],
  "skills": [],
  "contextFileName": "GEMINI.md",
  "extensionManifest": "gemini-extension.json",
  "repository": { "type": "git", "url": "..." },
  "keywords": [...]
}
```

**Extension manifest (`gemini-extension.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "...",
  "contextFileName": "GEMINI.md",
  "settings": []
}
```

**Command format (TOML):**

Commands are converted from Markdown to TOML:

```toml
description = "Orchestrate a babysitter run. use this command to start babysitting a complex workflow."

prompt = "Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md)."
```

Conversion rules:
- `description` from frontmatter maps to TOML `description`
- Markdown body maps to TOML `prompt`
- `argument-hint` and `allowed-tools` are **dropped** (not supported by Gemini TOML commands)

**Gemini-specific hooks:** Gemini supports `AfterAgent` (not in Claude Code) and `SessionStart`, but **not** `Stop`, `UserPromptSubmit`, or `PreToolUse`.

**Plugin root env var:** `GEMINI_EXTENSION_PATH`

**Emitted file tree:**

```
dist/gemini/
  plugin.json
  gemini-extension.json
  GEMINI.md
  hooks/
    hooks.json
    session-start.sh
    after-agent.sh
    babysitter-proxied-session-start.sh
    babysitter-proxied-after-agent.sh
    proxied-hooks.json
  commands/
    call.toml
    yolo.toml
    plan.toml
    ...
  versions.json
```

### 4.5 GitHub Copilot (`github-copilot`)

**Native format:**
- `plugin.json` -- Plugin manifest
- `.github/plugin.json` -- GitHub-specific plugin manifest (optional duplicate)
- `hooks.json` -- Hook registration (v1 format with bash+ps1)
- `AGENTS.md` -- Agent instructions context file
- `commands/*.md` -- Slash commands
- `skills/*/SKILL.md` -- Skills
- `versions.json` -- SDK version pin

**Manifest (`plugin.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "...",
  "author": { "name": "a5c.ai", "email": "support@a5c.ai" },
  "license": "MIT",
  "skills": "skills/",
  "hooks": "hooks.json",
  "commands": "commands/",
  "agents": "AGENTS.md",
  "repository": { "type": "git", "url": "..." },
  "keywords": ["orchestration", "github-copilot", ...]
}
```

Note: `author` can be an object `{ name, email }` (not just a string).

**Hooks (`hooks.json`):**

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      { "type": "command", "bash": "./hooks/session-start.sh", "powershell": "./hooks/session-start.ps1", "timeoutSec": 30 }
    ],
    "sessionEnd": [
      { "type": "command", "bash": "./hooks/session-end.sh", "powershell": "./hooks/session-end.ps1", "timeoutSec": 30 }
    ],
    "userPromptSubmitted": [
      { "type": "command", "bash": "./hooks/user-prompt-submitted.sh", "powershell": "./hooks/user-prompt-submitted.ps1", "timeoutSec": 30 }
    ]
  }
}
```

Key details:
- `"version": 1` required
- camelCase hook names with past tense: `userPromptSubmitted` (not `UserPromptSubmit`)
- Requires both `bash` and `powershell` variants
- Supports `sessionEnd` (not in Claude Code or Codex)

**Plugin root env var:** `COPILOT_PLUGIN_DIR`

**Emitted file tree:**

```
dist/github-copilot/
  plugin.json
  .github/
    plugin.json                 (duplicate for GitHub detection)
  hooks.json
  hooks/
    session-start.sh
    session-start.ps1
    session-end.sh
    session-end.ps1
    user-prompt-submitted.sh
    user-prompt-submitted.ps1
    babysitter-proxied-session-start.sh
    babysitter-proxied-session-start.ps1
    babysitter-proxied-session-end.sh
    babysitter-proxied-session-end.ps1
    babysitter-proxied-user-prompt-submitted.sh
    babysitter-proxied-user-prompt-submitted.ps1
    proxied-hooks.json
  AGENTS.md
  commands/
    call.md
    ...
  skills/
    babysit/SKILL.md
    ...
  versions.json
```

### 4.6 Pi (`pi`)

**Native format:**
- `package.json` -- npm package with `pi: { extensions, skills }` field
- `AGENTS.md` -- Agent instructions
- `extensions/` -- Pi extension modules (JavaScript)
- `skills/*/SKILL.md` -- Skills
- `commands/` -- Command docs (synced via `scripts/sync-command-docs.cjs`)
- `bin/cli.cjs` -- CLI entrypoint
- `versions.json` -- SDK version pin

**Manifest (`package.json`):**

```json
{
  "name": "@a5c-ai/babysitter-pi",
  "version": "5.0.0",
  "type": "module",
  "description": "Babysitter package for Pi Coding Agent",
  "keywords": ["pi", "babysitter", "orchestration"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"]
  },
  "dependencies": { "@a5c-ai/babysitter-sdk": "5.0.0" },
  "peerDependencies": { "@earendil-works/pi-coding-agent": "*" },
  "scripts": {
    "test": "node --test test/integration.test.js && node test/packaged-install.test.cjs",
    "sync:commands": "node scripts/sync-command-docs.cjs",
    "deploy": "npm publish --access public"
  },
  "bin": { "babysitter-pi": "bin/cli.cjs" },
  "files": [
    "bin/", "package.json", "versions.json", "README.md",
    "AGENTS.md", "extensions/", "skills/", "commands/", "scripts/"
  ],
  "author": "a5c.ai",
  "license": "MIT",
  "publishConfig": { "access": "public" }
}
```

Pi-specific details:
- **No hooks** -- Pi does not support hook registration
- Uses `"pi": { extensions, skills }` field in package.json
- `peerDependencies` on the Pi agent
- Skills are derived from commands (same pattern as Codex)
- Has `extensions/index.js` (or `.ts`) -- the Pi extension entry point

**Extensions generation (`extensions/index.js`):**

The Pi extension file registers slash commands that forward to babysitter skills via the Pi `ExtensionAPI`. The compiler generates this file from the command list.

Generation rules:

1. Import the Pi extension API type: `import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";`
2. Define a `COMMANDS` array containing all command names (e.g., `["assimilate", "call", "cleanup", "contrib", "doctor", "forever", "help", ...]`)
3. Define a `toSkillPrompt(name, args)` helper that returns `` `/skill:${name}${args ? ` ${args}` : ""}` ``
4. Export a default `activate(pi: ExtensionAPI)` function that:
   a. Registers `/babysit` and `/babysitter` commands that forward to the `babysit` skill
   b. For each command name in `COMMANDS`, registers two commands:
      - `/<name>` -- forwards to `/skill:<name>`
      - `/babysitter:<name>` -- alias that forwards to `/skill:<name>`
5. Each command handler calls `pi.sendUserMessage(toSkillPrompt(name, args))` to delegate to the skill system

The `COMMANDS` list is derived from the UPF `commands/` directory: take each `*.md` filename (without extension), excluding `babysit` and `babysitter` (which are registered separately as the primary entry points).

**Reference implementation** (from the Pi per-harness source overlay under `plugins/babysitter-unified/per-harness/pi/`):

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const COMMANDS = [
  "assimilate", "call", "cleanup", "contrib", "doctor",
  "forever", "help", "observe", "plan", "plugins",
  "project-install", "resume", "retrospect", "user-install", "yolo",
] as const;

function toSkillPrompt(name: string, args: string): string {
  return `/skill:${name}${args ? ` ${args}` : ""}`;
}

export default function activate(pi: ExtensionAPI): void {
  const forwardBabysit = async (args: unknown) => {
    pi.sendUserMessage(toSkillPrompt("babysit", String(args ?? "").trim()));
  };

  pi.registerCommand("babysit", {
    description: "Load the Babysitter orchestration skill",
    handler: forwardBabysit,
  });

  pi.registerCommand("babysitter", {
    description: "Alias for /babysit",
    handler: forwardBabysit,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown) => {
      pi.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    pi.registerCommand(name, {
      description: `Open the Babysitter ${name} skill`,
      handler: forward,
    });

    pi.registerCommand(`babysitter:${name}`, {
      description: `Alias for /${name}`,
      handler: forward,
    });
  }
}
```

**Emitted file tree:**

```
dist/pi/
  package.json
  AGENTS.md
  versions.json
  extensions/
    index.js
  skills/
    babysit/SKILL.md
    call/SKILL.md
    ...
  commands/
    call.md
    ...
  bin/
    cli.cjs
```

### 4.7 oh-my-pi (`oh-my-pi`)

**Native format:** Identical to Pi, but with:
- Package name: `@a5c-ai/babysitter-omp`
- `"omp"` field instead of `"pi"` in package.json
- `peerDependencies` on `@oh-my-pi/pi-coding-agent` instead of `@earendil-works/pi-coding-agent`
- Binary name: `babysitter-omp`
- Extensions import from `@oh-my-pi/pi-coding-agent` instead of `@earendil-works/pi-coding-agent`

The `extensions/index.js` generation follows the same rules as Pi (see section 4.6), but the import type reference changes to `import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";`.

**Manifest (`package.json`):**

```json
{
  "name": "@a5c-ai/babysitter-omp",
  "version": "5.0.0",
  "type": "module",
  "description": "Babysitter package for oh-my-pi",
  "omp": {
    "extensions": ["./extensions"],
    "skills": ["./skills"]
  },
  "dependencies": { "@a5c-ai/babysitter-sdk": "5.0.0" },
  "peerDependencies": { "@oh-my-pi/pi-coding-agent": "*" },
  ...
}
```

### 4.8 OpenCode (`opencode`)

**Native format:**
- `plugin.json` -- Plugin manifest
- `hooks/hooks.json` -- Hook registration (dot-separated event names, JS scripts)
- `commands/*.md` -- Commands (full copy from source)
- `skills/*/SKILL.md` -- Skills (full copy + derived from commands)
- `accomplish-skills/babysitter/SKILL.md` -- Accomplish-mode skill variant
- `versions.json` -- SDK version pin

**Manifest (`plugin.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "...",
  "author": "a5c.ai",
  "license": "MIT",
  "harness": "opencode",
  "hooks": "hooks/",
  "commands": "commands/",
  "skills": "skills/",
  "repository": { "type": "git", "url": "..." },
  "keywords": ["orchestration", "opencode", ...]
}
```

Note: `hooks` points to a **directory** (not a file), containing `hooks.json` and the JS hook scripts.

**Hooks (`hooks/hooks.json`):**

```json
{
  "version": 1,
  "description": "Babysitter hook registration for OpenCode.",
  "hooks": {
    "session.created": [
      { "type": "command", "script": "hooks/session-created.js", "description": "...", "timeoutMs": 30000 }
    ],
    "session.idle": [
      { "type": "command", "script": "hooks/session-idle.js", "description": "...", "timeoutMs": 30000 }
    ],
    "shell.env": [
      { "type": "command", "script": "hooks/shell-env.js", "description": "...", "timeoutMs": 5000 }
    ],
    "tool.execute.before": [
      { "type": "command", "script": "hooks/tool-execute-before.js", "description": "...", "timeoutMs": 10000 }
    ],
    "tool.execute.after": [
      { "type": "command", "script": "hooks/tool-execute-after.js", "description": "...", "timeoutMs": 10000 }
    ]
  }
}
```

OpenCode-specific details:
- Hook scripts are JavaScript `.js` files (not shell)
- `script` field instead of `command` or `bash`
- `timeoutMs` in milliseconds
- Dot-separated event names
- Plugin root env var: `OPENCODE_PLUGIN_ROOT`
- Has `accomplish-skills/` directory for a separate skill discovery mode

**`accomplish-skills/` generation:**

OpenCode has a secondary skill discovery mode called "accomplish mode" that uses a separate directory. The `accomplish-skills/babysitter/SKILL.md` file is a specialized variant of the babysit skill tailored for OpenCode's accomplish workflow.

Generation rules:

1. The compiler creates `accomplish-skills/babysitter/SKILL.md` as a self-contained SKILL.md with:
   - YAML frontmatter: `name: babysitter`, `description` (same as the babysit skill), `command: /babysitter`, `verified: true`
   - Body content identical to the babysit skill but with OpenCode-specific harness references (e.g., `--harness opencode` in CLI commands)
   - The `versions.json` probe path references the generated OpenCode plugin directory (e.g., `./artifacts/generated-plugins/opencode/versions.json`)
2. Only the primary `babysitter` skill is placed in `accomplish-skills/`. Command-derived skills are not duplicated there.
3. The accomplish-skills variant includes the `command` and `verified` frontmatter fields which are not present in regular skills

**Emitted file tree:**

```
dist/opencode/
  plugin.json
  hooks/
    hooks.json
    session-created.js
    session-idle.js
    shell-env.js
    tool-execute-before.js
    tool-execute-after.js
    babysitter-proxied-session-created.js
    babysitter-proxied-session-idle.js
    babysitter-proxied-shell-env.js
    babysitter-proxied-tool-execute-before.js
    babysitter-proxied-tool-execute-after.js
  commands/
    call.md
    yolo.md
    status.md                    (OpenCode-specific command)
    ...
  skills/
    babysit/SKILL.md
    call/SKILL.md
    accomplish-status/SKILL.md   (OpenCode-specific)
    ...
  accomplish-skills/
    babysitter/SKILL.md
  versions.json
```

### 4.9 OpenClaw (`openclaw`)

**Native format:**
- `plugin.json` -- Generic plugin manifest (Claude Code compatible)
- `openclaw.plugin.json` -- OpenClaw native plugin manifest
- `hooks.json` -- Hook registration (Claude Code format with `matcher: "*"`)
- `skills/*/SKILL.md` -- Skills
- `commands/` -- Commands directory
- `versions.json` -- SDK version pin

**Plugin manifest (`plugin.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "...",
  "author": "a5c.ai",
  "license": "MIT",
  "hooks": "hooks.json",
  "commands": "commands/",
  "skills": "skills/",
  "repository": { "type": "git", "url": "..." },
  "keywords": [...]
}
```

**OpenClaw native manifest (`openclaw.plugin.json`):**

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "Babysitter orchestration plugin for OpenClaw...",
  "entrypoint": "extensions/index.ts",
  "hooks": {
    "session_start": "extensions/hooks/session-start.ts",
    "session_end": "extensions/hooks/session-end.ts",
    "before_prompt_build": "extensions/hooks/before-prompt-build.ts",
    "agent_end": "extensions/hooks/agent-end.ts"
  },
  "capabilities": [
    "orchestration",
    "process-management",
    "human-in-the-loop"
  ]
}
```

OpenClaw-specific details:
- **Two manifest files**: `plugin.json` (generic) + `openclaw.plugin.json` (native)
- OpenClaw hooks use snake_case names and TypeScript file paths
- Has `entrypoint` and `capabilities` fields in native manifest
- `hooks.json` uses Claude Code format with `matcher: "*"` (glob, not regex `".*"`)

**Emitted file tree:**

```
dist/openclaw/
  plugin.json
  openclaw.plugin.json
  hooks.json
  hooks/
    babysitter-session-start.sh
    babysitter-stop-hook.sh
    babysitter-proxied-session-start.sh
    babysitter-proxied-stop-hook.sh
    proxied-hooks.json
  extensions/
    index.ts
    hooks/
      session-start.ts
      session-end.ts
      before-prompt-build.ts
      agent-end.ts
  commands/
    call.md
    ...
  skills/
    babysit/SKILL.md
    ...
  versions.json
```

---

## 5. Compiler Pipeline

### 5.1 Pipeline Stages

```
                 a5c-plugin.json
                       |
                       v
           +---------------------+
           |     1. VALIDATE     |
           +---------------------+
                       |
                       v
           +---------------------+
           |     2. RESOLVE      |
           +---------------------+
                       |
                       v
           +---------------------+
           |    3. TRANSFORM     |
           +---------------------+
                       |
                       v
           +---------------------+
           |      4. EMIT       |
           +---------------------+
                       |
                       v
           +---------------------+
           |     5. VERIFY      |
           +---------------------+
                       |
                       v
              Compilation Result
```

### 5.2 Stage 1: VALIDATE

Validate the UPF manifest and all referenced files:

1. Parse `a5c-plugin.json` -- fail if missing or malformed JSON.
2. Verify required fields: `name`, `version`, `description`, `author`, `license`.
3. Verify `version` is valid semver.
4. For each entry in `hooks`, verify the handler file exists.
5. For each command file/directory reference, verify files exist.
6. For each skill entry, verify the `SKILL.md` file exists.
7. For agent/context file references, verify they exist.
8. Parse `versions.json` -- verify `sdkVersion` is present.
9. Check for duplicate skill names.
10. Check for duplicate command names.
11. If `targets` overrides reference files, verify those files exist.

**Output:** Validated manifest object + array of validation diagnostics (errors/warnings).

### 5.3 Stage 2: RESOLVE

Load the target profile and compute the effective manifest:

1. Load the target profile (built-in definitions for each supported target).
2. If `a5c-plugin.json` has a `targets.<targetName>` section, deep-merge it onto the base manifest.
3. Compute the capability matrix: which hooks, commands, skills, agents, and context files apply to this target.
4. For hooks, map canonical names to target-native names using the hook name mapping table.
5. For commands, determine the output format (md, toml, or skills).
6. Generate a degradation plan: list components that will be dropped or transformed lossily.

**Hook name mapping table:**

| Canonical | Claude Code | Codex | Cursor | Gemini | Copilot | OpenCode | OpenClaw |
|-----------|-------------|-------|--------|--------|---------|----------|----------|
| SessionStart | SessionStart | SessionStart | sessionStart | SessionStart | sessionStart | session.created | session_start |
| Stop | Stop | Stop | stop | -- | -- | -- | -- |
| UserPromptSubmit | UserPromptSubmit | UserPromptSubmit | -- | -- | userPromptSubmitted | -- | -- |
| PreToolUse | PreToolUse | -- | -- | -- | -- | tool.execute.before | -- |
| PostToolUse | PostToolUse | -- | -- | -- | -- | tool.execute.after | -- |
| AfterAgent | -- | -- | -- | AfterAgent | -- | -- | agent_end |
| SessionEnd | -- | -- | -- | -- | sessionEnd | -- | session_end |
| SessionIdle | -- | -- | -- | -- | -- | session.idle | -- |
| ShellEnv | -- | -- | -- | -- | -- | shell.env | -- |
| BeforePromptBuild | -- | -- | -- | -- | -- | -- | before_prompt_build |

### 5.4 Stage 3: TRANSFORM

Convert each component to the target format:

#### Commands

| Source | Target | Transformation |
|--------|--------|----------------|
| `commands/*.md` | Claude Code | Copy as-is |
| `commands/*.md` | Codex | Not emitted (skills derived instead) |
| `commands/*.md` | Cursor | Copy as-is |
| `commands/*.md` | Gemini | Convert to TOML (see below) |
| `commands/*.md` | Copilot | Copy as-is |
| `commands/*.md` | Pi | Copy as-is |
| `commands/*.md` | oh-my-pi | Copy as-is |
| `commands/*.md` | OpenCode | Copy as-is |
| `commands/*.md` | OpenClaw | Copy as-is |

**Markdown to TOML conversion (Gemini):**

```
Input (commands/call.md):
---
description: Orchestrate a babysitter run.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, ...
---

Invoke the babysitter:babysit skill and follow its instructions.

Output (commands/call.toml):
description = "Orchestrate a babysitter run."

prompt = "Invoke the babysitter:babysit skill and follow its instructions."
```

Implementation: Parse frontmatter with `parseFrontmatter()`, extract `description`, use body as `prompt`.

#### Skills

| Source | Target | Transformation |
|--------|--------|----------------|
| Standalone skills | All | Copy `skills/*/SKILL.md` |
| Command-backed skills | Codex, Pi, oh-my-pi, OpenCode | Derive via `buildSkillFromCommand()` |
| Command-backed skills | Others | Not derived (commands serve directly) |

The `buildSkillFromCommand()` transformation from `plugin-command-sync-lib.cjs`:

```
Input (commands/call.md):
---
description: Orchestrate a babysitter run.
argument-hint: ...
allowed-tools: ...
---

Invoke the babysitter:babysit skill...

Output (skills/call/SKILL.md):
---
name: call
description: Orchestrate a babysitter run.
---

# call

Invoke the babysitter:babysit skill...
```

Skip derivation for skills named `babysit` or `babysitter` (these are standalone).

#### Hooks

For each supported hook on the target:

1. Select the hook handler script from the UPF manifest.
2. Generate the target-appropriate wrapper script from the template:
   - Bash variant for Claude Code, Codex, Gemini, Copilot, Cursor
   - PowerShell variant for Cursor, Copilot
   - Node.js variant for OpenCode
   - TypeScript variant for OpenClaw
3. Emit the hook registration file (`hooks.json` or equivalent) in the target's format.
4. Set the correct adapter name, plugin root env var, and hook type in the template.

#### Manifests

Generate the target-native manifest from the UPF manifest:

| Target | Primary manifest | Additional manifests |
|--------|------------------|---------------------|
| Claude Code | `plugin.json` | -- |
| Codex | `package.json` | `.app.json` |
| Cursor | `plugin.json` | -- |
| Gemini | `plugin.json` | `gemini-extension.json` |
| Copilot | `plugin.json` | `.github/plugin.json` |
| Pi | `package.json` | -- |
| oh-my-pi | `package.json` | -- |
| OpenCode | `plugin.json` | -- |
| OpenClaw | `plugin.json` | `openclaw.plugin.json` |

#### Context files

Emit context files for targets that support them:

| Target | Context file | Source |
|--------|-------------|--------|
| Gemini | `GEMINI.md` | `contextFiles.gemini` or `context/GEMINI.md` |
| Copilot | `AGENTS.md` | `contextFiles.github-copilot` or `context/AGENTS.md` |
| Pi | `AGENTS.md` | `contextFiles.pi` or `context/AGENTS.md` |
| oh-my-pi | `AGENTS.md` | `contextFiles.oh-my-pi` or `context/AGENTS.md` |

### 5.5 Stage 4: EMIT

Write all transformed files to the output directory. The output structure matches exactly what currently lives in the generated target bundle directory (for example, `artifacts/generated-plugins/codex/`).

### 5.6 Stage 5: VERIFY

Run target-specific validation checks:

1. JSON schema validation for all emitted `.json` files.
2. Verify all file paths referenced in manifests exist.
3. Verify hook scripts are executable (have shebang).
4. For TOML files (Gemini), verify valid TOML syntax.
5. For TypeScript targets (OpenClaw), verify syntax with `tsc --noEmit`.
6. Compare emitted output against existing plugin directory (if `--existing` flag provided).

### 5.7 Error Handling

The compiler uses a **diagnostics accumulation** model rather than fail-fast. Each pipeline stage can produce diagnostics at three severity levels:

| Level | Meaning | Behavior |
|-------|---------|----------|
| `error` | Fatal -- compilation cannot produce valid output | Stage halts; subsequent stages are skipped |
| `warning` | Non-fatal -- output may be degraded or incomplete | Compilation continues; reported in result |
| `info` | Informational -- no action required | Compilation continues; reported in result |

**Partial failure semantics:**

When compiling with `--target all`, each target is compiled independently. A failure in one target does not prevent compilation of other targets. The overall result status is:

- `success` -- all targets compiled without errors or warnings
- `warning` -- all targets compiled, but some emitted warnings (e.g., unsupported hooks dropped)
- `error` -- one or more targets failed to compile

**Diagnostic output format:**

Each diagnostic includes structured fields for programmatic consumption:

```typescript
interface Diagnostic {
  level: "info" | "warning" | "error";
  category: "validation" | "compatibility" | "compilation" | "verification";
  message: string;                    // Human-readable description
  component?: string;                 // e.g., "hooks.PreToolUse", "commands/call.md"
  target?: string;                    // e.g., "codex", "gemini" (undefined for source-level)
  source?: string;                    // Source file that triggered the diagnostic
  suggestion?: string;                // Suggested fix or action
}
```

**Common diagnostic scenarios:**

| Scenario | Level | Category | Example message |
|----------|-------|----------|-----------------|
| Missing required field in manifest | error | validation | `"Required field 'name' is missing in a5c-plugin.json"` |
| Hook unsupported by target | warning | compatibility | `"Hook 'PreToolUse' is not supported by target 'gemini' — skipping"` |
| Override file not found | error | validation | `"Override file 'overrides/codex/config.json' referenced in targets.codex.extraFiles does not exist"` |
| Version mismatch in versions.json | warning | validation | `"sdkVersion '5.0.0' does not match manifest version '5.0.1'"` |
| Generated hook script missing shebang | error | verification | `"Hook script 'hooks/session-start.sh' is missing shebang line"` |
| Diff against existing directory | info | verification | `"File 'skills/call/SKILL.md' differs from existing — content changed at line 4"` |
| Command has no description | warning | validation | `"Command 'commands/test.md' has no 'description' in frontmatter"` |

**CLI output modes:**

- **Default (human-readable):** Diagnostics are printed to stderr with colored severity prefixes. Summary line shows counts per level.
- **`--json`:** Diagnostics are included in the structured `CompilationResult.diagnostics` array (see Appendix C).
- **`--strict`:** Treats warnings as errors, causing the compiler to exit with a non-zero status if any warnings are present.

---

## 6. Hook Compilation Details

### 6.1 The Babysitter-Proxied Hook Template (Bash)

This is the full template. Variables in `{{DOUBLE_BRACES}}` are substituted by the compiler:

```bash
#!/bin/bash
# Unified {{HOOK_TITLE}} Hook for {{HARNESS_DISPLAY_NAME}}
# Routes through hooks-mux for all hook execution.
#
# Ensures the babysitter SDK CLI and hooks-mux are installed (from versions.json
# sdkVersion), then delegates to the TypeScript handler via hooks-mux.
#
# Protocol:
#   Input:  JSON via stdin (contains session_id, cwd, etc.)
#   Output: JSON via stdout ({} on success)
#   Stderr: debug/log output only
#   Exit 0: success
#   Exit 2: block (fatal error)

set -euo pipefail

PLUGIN_ROOT="${{{PLUGIN_ROOT_ENV_VAR}}:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_MARKER_FILE="${PLUGIN_ROOT}/.babysitter-install-attempted"
PROXY_MARKER_FILE="${PLUGIN_ROOT}/.hooks-mux-install-attempted"

GLOBAL_ROOT="${BABYSITTER_GLOBAL_STATE_DIR:-$HOME/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-${GLOBAL_ROOT}/logs}"
LOG_FILE="$LOG_DIR/babysitter-{{HOOK_TYPE}}-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

# Structured logging helper
blog() {
  local msg="$1"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $msg" >> "$LOG_FILE" 2>/dev/null
  if command -v babysitter &>/dev/null; then
    babysitter log --type hook --label "hook:{{HOOK_TYPE}}" --message "$msg" --source shell-hook 2>/dev/null || true
  fi
}

blog "Unified hook script invoked"
blog "PLUGIN_ROOT=$PLUGIN_ROOT"

SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

# --- SDK install/upgrade ---
install_sdk() {
  local target_version="$1"
  if npm i -g "@a5c-ai/babysitter-sdk@${target_version}" --loglevel=error 2>/dev/null; then
    blog "Installed SDK globally (${target_version})"
    return 0
  else
    if npm i -g "@a5c-ai/babysitter-sdk@${target_version}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null; then
      export PATH="$HOME/.local/bin:$PATH"
      blog "Installed SDK to user prefix (${target_version})"
      return 0
    fi
  fi
  return 1
}

NEEDS_SDK_INSTALL=false
if command -v babysitter &>/dev/null; then
  CURRENT_VERSION=$(babysitter --version 2>/dev/null || echo "unknown")
  if [ "$CURRENT_VERSION" != "$SDK_VERSION" ]; then
    NEEDS_SDK_INSTALL=true
  fi
else
  NEEDS_SDK_INSTALL=true
fi

if [ "$NEEDS_SDK_INSTALL" = true ] && [ ! -f "$SDK_MARKER_FILE" ]; then
  install_sdk "$SDK_VERSION"
  echo "$SDK_VERSION" > "$SDK_MARKER_FILE" 2>/dev/null
fi

if ! command -v babysitter &>/dev/null; then
  babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
  export -f babysitter
fi

# --- hooks-mux install/upgrade ---
install_hooks_proxy() {
  local target_version="$1"
  if npm i -g "@a5c-ai/hooks-mux-cli@${target_version}" --loglevel=error 2>/dev/null; then
    return 0
  else
    if npm i -g "@a5c-ai/hooks-mux-cli@${target_version}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null; then
      export PATH="$HOME/.local/bin:$PATH"
      return 0
    fi
  fi
  return 1
}

NEEDS_PROXY_INSTALL=false
if command -v a5c-hooks-mux &>/dev/null; then
  PROXY_VERSION=$(a5c-hooks-mux --version 2>/dev/null || echo "unknown")
  if [ "$PROXY_VERSION" != "$SDK_VERSION" ]; then
    NEEDS_PROXY_INSTALL=true
  fi
elif [ -f "$HOME/.local/bin/a5c-hooks-mux" ]; then
  export PATH="$HOME/.local/bin:$PATH"
  PROXY_VERSION=$(a5c-hooks-mux --version 2>/dev/null || echo "unknown")
  if [ "$PROXY_VERSION" != "$SDK_VERSION" ]; then
    NEEDS_PROXY_INSTALL=true
  fi
else
  NEEDS_PROXY_INSTALL=true
fi

if [ "$NEEDS_PROXY_INSTALL" = true ] && [ ! -f "$PROXY_MARKER_FILE" ]; then
  install_hooks_proxy "$SDK_VERSION"
  echo "$SDK_VERSION" > "$PROXY_MARKER_FILE" 2>/dev/null
fi

PROXY=""
if command -v a5c-hooks-mux &>/dev/null; then
  PROXY="a5c-hooks-mux"
elif [ -f "$HOME/.local/bin/a5c-hooks-mux" ]; then
  PROXY="$HOME/.local/bin/a5c-hooks-mux"
fi

if [ -z "$PROXY" ]; then
  PROXY="npx -y @a5c-ai/hooks-mux-cli@${SDK_VERSION} "
fi

# --- Capture stdin and delegate ---
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-{{HOOK_TYPE}}-$$.json")
cat > "$INPUT_FILE"

STDERR_LOG="$LOG_DIR/babysitter-{{HOOK_TYPE}}-hook-stderr.log"

RESULT=$($PROXY invoke \
  --adapter {{ADAPTER_NAME}} \
  --handler "babysitter hook:run --harness unified --hook-type {{HOOK_TYPE}} --plugin-root ${PLUGIN_ROOT} --json" \
  --json \
  < "$INPUT_FILE" 2>"$STDERR_LOG")
EXIT_CODE=$?

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
```

### 6.2 hooks-mux Adapter Names

Each target uses a specific adapter name when calling hooks-mux:

| Target | Adapter Name |
|--------|-------------|
| Claude Code | `claude` |
| Codex | `codex` (not currently used; Codex hooks use direct shell) |
| Cursor | `cursor` |
| Gemini | `gemini` |
| GitHub Copilot | `copilot` |
| OpenCode | `opencode` |
| OpenClaw | `openclaw` |
| Pi | `pi` (adapter exists but hooks not supported by Pi) |
| oh-my-pi | `oh-my-pi` |

These correspond to the hooks-mux adapter packages:
`packages/hooks-mux/adapter-claude/`, `packages/hooks-mux/adapter-codex/`, etc.

### 6.3 AdapterCapabilities Interface

Each hooks-mux adapter declares its capabilities via the `AdapterCapabilities` interface:

```typescript
interface AdapterCapabilities {
  name: string;                          // e.g., "claude", "copilot"
  family: 'shell-hook' | 'in-process' | 'observer';
  sessionIdQuality: 'native' | 'derived' | 'synthetic' | 'none';
  supportsOrderedFanout: boolean;
  supportsNativeAdditionalContext: boolean;
  supportsBlock: boolean;
  supportsAsk: boolean;
  supportsToolInputMutation: boolean;
  supportsToolResultMutation: boolean;
  supportsPersistedEnv: boolean;
  envPersistenceMode: 'native_env_file' | 'runtime_hook' | 'wrapper_only' | 'none';
  toolInterceptionScope: 'all' | 'shell_only' | 'partial_shell_only' | 'none';
  notes?: string[];
}
```

The compiler should use these capabilities to determine which hooks can actually function on a given target.

### 6.4 versions.json Integration

The `versions.json` file is emitted for every target. Hook scripts read it at runtime to determine which version of `@a5c-ai/babysitter-sdk` and `@a5c-ai/hooks-mux-cli` to install.

During compilation, `versions.json` is copied from the UPF source. During the bump-version release process (`scripts/bump-version.mjs`), all `versions.json` files across all plugin directories are updated synchronously:

```javascript
for (const path of versionsJsonPaths) {
  const data = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  data.sdkVersion = newVersion;
  writeJson(path, data);
}
```

Post-UPF migration, `bump-version.mjs` will update only the UPF source `versions.json`, and the compiler will propagate it to all targets.

---

## 7. Target-Specific Overrides

### 7.1 Override Mechanism

The `targets` section of `a5c-plugin.json` supports per-target overrides using deep merge semantics.

```jsonc
{
  "targets": {
    "codex": {
      // Add a target-specific npm package name
      "npmPackageName": "@a5c-ai/babysitter-codex",

      // Directive: derive skills from commands instead of copying commands
      "skills": "derive-from-commands",

      // Disable a specific hook for this target
      "hooks": {
        "PreToolUse": null
      },

      // Add target-specific extra files
      "extraFiles": {
        ".codex-plugin/config.json": "overrides/codex/config.json",
        ".app.json": "overrides/codex/app.json"
      }
    },
    "gemini": {
      // Gemini-specific hook not in the canonical set
      "hooks": {
        "AfterAgent": "hooks/after-agent.handler.sh"
      },

      // Extension manifest metadata
      "extensionManifest": {
        "contextFileName": "GEMINI.md",
        "settings": []
      }
    }
  }
}
```

### 7.2 Override Merge Semantics

1. **Scalar values**: Target value replaces base value.
2. **Objects**: Deep-merged recursively.
3. **Arrays**: Target array replaces base array entirely (no element-level merge).
4. **`null` values**: Setting a field to `null` removes it (e.g., `"PreToolUse": null` disables that hook).
5. **Special directives**: String values like `"derive-from-commands"` are interpreted as compilation directives, not literal values.

### 7.3 Extra Files

The `extraFiles` field maps output paths to source paths, allowing targets to include files that are not part of the standard component model:

```jsonc
{
  "targets": {
    "codex": {
      "extraFiles": {
        ".codex-plugin/config.json": "overrides/codex/config.json",
        "assets/icon.png": "assets/icon.png",
        "bin/cli.js": "overrides/codex/cli.js",
        "scripts/sync-command-skills.js": "overrides/codex/sync-command-skills.js"
      }
    }
  }
}
```

---

## 8. Versioning & Publishing

### 8.1 Version Synchronization

The babysitter project uses synchronized versioning across all packages. The `scripts/bump-version.mjs` script updates:

1. All workspace `package.json` files (root, `packages/sdk`, `packages/babysitter`, etc.)
2. All generated plugin `package.json` files or per-harness package surfaces (`artifacts/generated-plugins/codex/package.json`, etc.)
3. All plugin manifest files (`plugin.json`, `gemini-extension.json`, `openclaw.plugin.json`)
4. All `versions.json` files (setting `sdkVersion`)
5. All cross-package dependency references (`@a5c-ai/babysitter-sdk`, `@a5c-ai/hooks-mux-core`)
6. Lock files (`package-lock.json`)

### 8.2 Post-UPF Version Flow

After migration to UPF:

```
bump-version.mjs
  |
  +-- Update UPF source (a5c-plugin.json version, versions.json sdkVersion)
  |
  +-- Run compiler for each target
  |     npx @a5c-ai/extension-mux compile --target all --output dist/
  |
  +-- Each dist/<target>/ has correct version in its manifest
```

### 8.3 npm Publishing Per Target

Each target that publishes to npm has a distinct package name:

| Target | npm Package Name |
|--------|-----------------|
| Codex | `@a5c-ai/babysitter-codex` |
| Pi | `@a5c-ai/babysitter-pi` |
| oh-my-pi | `@a5c-ai/babysitter-omp` |
| OpenCode | -- (not published to npm) |

Claude Code, Gemini, Cursor, Copilot, and OpenClaw plugins are distributed as content bundles (installed via marketplace or file copy), not npm packages.

### 8.4 CI Workflow Integration

Example GitHub Actions workflow for compiling and publishing:

```yaml
name: Compile & Publish Plugins
on:
  push:
    tags: ['v*']

jobs:
  compile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run build:sdk

      # Compile all targets
      - run: npx @a5c-ai/extension-mux compile --target all --output dist/ --verify

      # Publish npm packages
      - run: cd dist/codex && npm publish --access public
      - run: cd dist/pi && npm publish --access public
      - run: cd dist/oh-my-pi && npm publish --access public

      # Upload content bundles as release artifacts
      - uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/claude-code.tar.gz
            dist/cursor.tar.gz
            dist/gemini.tar.gz
            dist/github-copilot.tar.gz
            dist/opencode.tar.gz
            dist/openclaw.tar.gz
```

---

## 9. Migration Guide

### 9.1 Step-by-Step Migration

#### Phase 1: Create the UPF Source

1. **Create `a5c-plugin.json`** in `plugins/babysitter-unified/`.

2. **Base the manifest on `plugins/babysitter-unified/plugin.json`**, which is already the superset:

```json
{
  "name": "babysitter",
  "version": "5.0.0",
  "description": "Orchestrate complex, multi-step workflows...",
  "author": "a5c.ai",
  "license": "MIT",
  "hooks": {
    "SessionStart": "hooks/session-start.handler.sh",
    "Stop": "hooks/stop.handler.sh",
    "UserPromptSubmit": "hooks/user-prompt-submit.handler.sh",
    "PreToolUse": "hooks/pre-tool-use.handler.sh"
  },
  "commands": [],
  "skills": [
    { "name": "babysitter", "file": "skills/babysit/SKILL.md" }
  ],
  "contextFiles": {
    "gemini": "context/GEMINI.md",
    "github-copilot": "context/AGENTS.md",
    "pi": "context/AGENTS.md",
    "oh-my-pi": "context/AGENTS.md"
  },
  "targets": {
    "codex": { "skills": "derive-from-commands", "npmPackageName": "@a5c-ai/babysitter-codex" },
    "gemini": { "hooks": { "AfterAgent": "hooks/after-agent.handler.sh" } },
    "pi": { "npmPackageName": "@a5c-ai/babysitter-pi" },
    "oh-my-pi": { "npmPackageName": "@a5c-ai/babysitter-omp" }
  }
}
```

3. **Keep canonical files** in `plugins/babysitter-unified/`:
   - `commands/*.md` (already the source of truth)
   - `skills/babysit/SKILL.md` (standalone skill)
   - `hooks/*.sh` (handler scripts)
   - `versions.json`

4. **Keep harness overlays** in `plugins/babysitter-unified/per-harness/`:
   - `plugins/babysitter-unified/per-harness/gemini/GEMINI.md`
   - `plugins/babysitter-unified/per-harness/github/AGENTS.md`

5. **Keep target-specific overrides** in per-harness source overlays:
   - Codex-specific files in `plugins/babysitter-unified/per-harness/codex/`
   - Pi extensions in `plugins/babysitter-unified/per-harness/pi/`

#### Phase 2: Validate the Compiler

1. Run the compiler for each target and compare output against the existing plugin directory:

```bash
npx @a5c-ai/extension-mux compile --target claude-code --output /tmp/test-claude-code
npx @a5c-ai/extension-mux diff --target claude-code --existing artifacts/generated-plugins/claude-code
```

2. Fix any discrepancies. The compiler output should match the existing plugins exactly (modulo whitespace/formatting).

#### Phase 3: Replace Manual Sync

1. Update `scripts/bump-version.mjs` to run the compiler after updating the UPF source.
2. Remove `sync-command-skills.js` scripts from Codex and other plugins.
3. Remove the `plugin-command-sync-lib.cjs` library (its logic is now in the compiler).
4. Add CI job to run `compile --target all --verify` on every PR.

#### Phase 4: Switch to Generated Output

1. Delete the old hand-maintained per-target plugin directories.
2. Keep generated output outside tracked source directories (for this repo, `artifacts/generated-plugins/` is ignored).
3. Update CI to compile and publish from UPF source.

### 9.2 What Becomes UPF Source

| Current location | UPF role |
|-----------------|----------|
| `plugins/babysitter-unified/plugin.json` | Base manifest for unified plugin compilation |
| `plugins/babysitter-unified/commands/*.md` | Canonical commands |
| `plugins/babysitter-unified/skills/babysit/SKILL.md` | Standalone skill |
| `plugins/babysitter-unified/hooks/*.sh` | Canonical hook handlers |
| `plugins/babysitter-unified/versions.json` | Canonical version pin |
| `plugins/babysitter-unified/per-harness/gemini/GEMINI.md` | Context file for Gemini target |
| `plugins/babysitter-unified/per-harness/github/AGENTS.md` | Context file for Copilot/Pi targets |
| `scripts/plugin-command-sync-lib.cjs` | Logic absorbed into compiler |

### 9.3 What Gets Generated

| Current location | Generated from |
|-----------------|---------------|
| `artifacts/generated-plugins/codex/` | UPF + codex target profile |
| `artifacts/generated-plugins/cursor/` | UPF + cursor target profile |
| `artifacts/generated-plugins/gemini/` | UPF + gemini target profile |
| `artifacts/generated-plugins/github-copilot/` | UPF + github-copilot target profile |
| `artifacts/generated-plugins/pi/` | UPF + pi target profile |
| `artifacts/generated-plugins/oh-my-pi/` | UPF + oh-my-pi target profile |
| `artifacts/generated-plugins/opencode/` | UPF + opencode target profile |
| `artifacts/generated-plugins/openclaw/` | UPF + openclaw target profile |

---

## 10. CLI Reference

### 10.1 `compile`

Compile a UPF package for one or all targets.

```
npx @a5c-ai/extension-mux compile --target <name|all> --output <dir> [options]

Options:
  --target <name>    Target harness name or "all" for all targets.
                     Valid names: claude-code, codex, cursor, gemini,
                     github-copilot, pi, oh-my-pi, opencode, openclaw
  --output <dir>     Output directory. For "all", creates subdirectories per target.
  --source <dir>     UPF source directory (default: current directory).
  --verify           Run verification checks after compilation.
  --dry-run          Show what would be emitted without writing files.
  --json             Output structured JSON result.
  --verbose          Verbose logging.
```

**Example:**

```bash
# Compile for Claude Code
npx @a5c-ai/extension-mux compile --target claude-code --output dist/claude-code

# Compile all targets with verification
npx @a5c-ai/extension-mux compile --target all --output dist/ --verify

# Dry run to see what would be emitted
npx @a5c-ai/extension-mux compile --target gemini --output dist/gemini --dry-run --json
```

**Output (JSON mode):**

```json
{
  "target": "claude-code",
  "status": "success",
  "outputDir": "dist/claude-code",
  "emittedFiles": [
    "plugin.json",
    "hooks.json",
    "hooks/babysitter-proxied-session-start-hook.sh",
    "commands/call.md",
    "skills/babysit/SKILL.md",
    "versions.json"
  ],
  "diagnostics": [],
  "componentSupport": {
    "hooks": { "SessionStart": "native", "Stop": "native", "PreToolUse": "native" },
    "commands": "native",
    "skills": "native"
  }
}
```

### 10.2 `validate`

Validate a UPF source package without compiling.

```
npx @a5c-ai/extension-mux validate [options]

Options:
  --source <dir>     UPF source directory (default: current directory).
  --strict           Treat warnings as errors.
  --json             Output structured JSON diagnostics.
```

**Example:**

```bash
npx @a5c-ai/extension-mux validate --source plugins/babysitter-unified --strict
```

### 10.3 `diff`

Compare compiled output against an existing plugin directory.

```
npx @a5c-ai/extension-mux diff --target <name> --existing <dir> [options]

Options:
  --target <name>    Target harness name.
  --existing <dir>   Path to existing hand-maintained plugin directory.
  --source <dir>     UPF source directory (default: current directory).
  --json             Output structured JSON diff.
```

**Example:**

```bash
npx @a5c-ai/extension-mux diff --target codex --existing artifacts/generated-plugins/codex
```

**Output:**

```
Files only in compiled: .codex-plugin/auto-generated.json
Files only in existing: test/integration.test.js
Files with differences:
  skills/call/SKILL.md
    - compiled: name: call
    + existing: name: call
    (content differs at line 4)
```

### 10.4 `init`

Scaffold a new UPF plugin.

```
npx @a5c-ai/extension-mux init --name <name> [options]

Options:
  --name <name>      Plugin name.
  --output <dir>     Output directory (default: current directory).
  --template <name>  Template to use: minimal, full, hooks-only.
```

**Example:**

```bash
npx @a5c-ai/extension-mux init --name my-plugin --template full --output plugins/my-plugin
```

Creates:

```
plugins/my-plugin/
  a5c-plugin.json
  versions.json
  commands/
    example.md
  skills/
    example/
      SKILL.md
  hooks/
    session-start.handler.sh
  context/
    AGENTS.md
```

### 10.5 `list-targets`

Show available compilation targets and their capabilities.

```
npx @a5c-ai/extension-mux list-targets [options]

Options:
  --json             Output structured JSON.
  --verbose          Show full capability details.
```

**Example output:**

```
Target          Class            Hooks  Commands  Skills  Agents  Context
claude-code     content-bundle   yes    yes (md)  yes     no      no
codex           content-bundle   yes    no        yes*    no      no
cursor          content-bundle   yes    yes (md)  yes     no      no
gemini          content-bundle   yes    yes (toml) no     no      yes (GEMINI.md)
github-copilot  content-bundle   yes    yes (md)  yes     yes     yes (AGENTS.md)
pi              runtime-adapter  no     yes (md)  yes*    no      yes (AGENTS.md)
oh-my-pi        runtime-adapter  no     yes (md)  yes*    no      yes (AGENTS.md)
opencode        runtime-adapter  yes    yes (md)  yes     no      no
openclaw        runtime-adapter  yes    yes (md)  yes     no      no

* Skills derived from commands via buildSkillFromCommand()
```

---

## Appendix A: File Format Quick Reference

### Claude Code hooks.json

```json
{ "description": "...", "hooks": { "HookName": [{ "hooks": [{ "type": "command", "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/script.sh" }] }] } }
```

### Codex hooks.json

```json
{ "hooks": { "HookName": [{ "matcher": ".*", "hooks": [{ "type": "command", "command": "./hooks/script.sh" }] }] } }
```

### Cursor hooks-cursor.json

```json
{ "version": 1, "hooks": { "hookName": [{ "type": "command", "bash": "bash \"./hooks/script.sh\"", "powershell": "powershell -NoProfile -ExecutionPolicy Bypass -File \"./hooks/script.ps1\"", "timeoutSec": 30 }] } }
```

### Gemini hooks.json

```json
{ "description": "...", "hooks": { "HookName": [{ "hooks": [{ "name": "hook-name", "type": "command", "command": "bash \"${extensionPath}/hooks/script.sh\"", "timeout": 30000, "description": "..." }] }] } }
```

### GitHub Copilot hooks.json

```json
{ "version": 1, "hooks": { "hookName": [{ "type": "command", "bash": "./hooks/script.sh", "powershell": "./hooks/script.ps1", "timeoutSec": 30 }] } }
```

### OpenCode hooks.json

```json
{ "version": 1, "description": "...", "hooks": { "event.name": [{ "type": "command", "script": "hooks/script.js", "description": "...", "timeoutMs": 30000 }] } }
```

### OpenClaw openclaw.plugin.json hooks

```json
{ "hooks": { "event_name": "extensions/hooks/handler.ts" } }
```

---

## Appendix B: hooks-mux Adapter Packages

The hooks-mux subsystem has per-adapter packages that normalize hook I/O across harnesses:

| Adapter Package | Harness | Family |
|----------------|---------|--------|
| `packages/hooks-mux/adapter-claude/` | Claude Code | shell-hook |
| `packages/hooks-mux/adapter-codex/` | Codex | shell-hook |
| `packages/hooks-mux/adapter-cursor/` | Cursor | shell-hook |
| `packages/hooks-mux/adapter-gemini/` | Gemini CLI | shell-hook |
| `packages/hooks-mux/adapter-copilot/` | GitHub Copilot | shell-hook |
| `packages/hooks-mux/adapter-opencode/` | OpenCode | in-process |
| `packages/hooks-mux/adapter-openclaw/` | OpenClaw | in-process |
| `packages/hooks-mux/adapter-pi/` | Pi | in-process |
| `packages/hooks-mux/adapter-oh-my-pi/` | oh-my-pi | in-process |

---

## Appendix C: Compilation Result Schema

```typescript
interface CompilationResult {
  target: string;
  status: "success" | "warning" | "error";
  outputDir: string;
  emittedFiles: string[];
  componentSupport: {
    hooks: Record<string, "native" | "emulated" | "unsupported">;
    commands: "native" | "toml" | "derived" | "unsupported";
    skills: "native" | "derived" | "unsupported";
    agents: "native" | "unsupported";
    context: "native" | "unsupported";
  };
  diagnostics: Diagnostic[];
  verificationChecklist: string[];
}

interface Diagnostic {
  level: "info" | "warning" | "error";
  category: "validation" | "compatibility" | "compilation" | "verification";
  message: string;
  component?: string;
  target?: string;
  source?: string;
  suggestion?: string;
}
```

---

## Appendix D: Plugin Root Environment Variables

| Target | Environment Variable | Fallback |
|--------|---------------------|----------|
| Claude Code | `CLAUDE_PLUGIN_ROOT` | `$(cd "$(dirname "$0")/.." && pwd)` |
| Codex | -- (relative paths) | `$(cd "$(dirname "$0")/.." && pwd)` |
| Cursor | `CURSOR_PLUGIN_ROOT` | `$(cd "$(dirname "$0")/.." && pwd)` |
| Gemini | `GEMINI_EXTENSION_PATH` | `$(cd "$(dirname "$0")/.." && pwd)` |
| GitHub Copilot | `COPILOT_PLUGIN_DIR` | `$(cd "$(dirname "$0")/.." && pwd)` |
| OpenCode | `OPENCODE_PLUGIN_ROOT` | `path.resolve(__dirname, "..")` |
| OpenClaw | -- (TypeScript, in-process) | -- |
| Pi | -- (npm package) | -- |
| oh-my-pi | -- (npm package) | -- |

---

## Appendix E: Testing Strategy

The unified plugin compiler requires testing at three levels to ensure correctness and prevent regressions.

### E.1 Unit Tests for Transformations

Each transformation function is tested in isolation:

| Test area | Description | Example assertions |
|-----------|-------------|-------------------|
| Markdown-to-TOML | Command frontmatter extraction and TOML emission | `description` field maps correctly; body becomes `prompt`; `argument-hint` is dropped |
| `buildSkillFromCommand()` | Command-to-skill derivation | Frontmatter is rewritten with `name` and `description`; body is preserved; `babysit`/`babysitter` are excluded |
| Hook name mapping | Canonical-to-target name conversion | `SessionStart` -> `sessionStart` for Cursor; `UserPromptSubmit` -> `userPromptSubmitted` for Copilot |
| Hook script templating | Template variable substitution | `{{ADAPTER_NAME}}`, `{{HOOK_TYPE}}`, `{{PLUGIN_ROOT_ENV_VAR}}` are replaced correctly |
| Manifest generation | UPF to target-native manifest | Required fields present; override merge produces correct result; `null` values remove fields |
| Override merge | Deep merge with null-deletion | Scalar replacement, recursive object merge, array replacement, `null` deletion |
| Pi extensions generation | `COMMANDS` list derivation from commands/ | Command list matches directory contents; `babysit`/`babysitter` excluded; import uses correct package |

### E.2 Integration Tests (End-to-End Compilation)

Full compiler pipeline tests that compile a known UPF source and validate the complete output:

```bash
# Compile a test fixture UPF source for each target
npx @a5c-ai/extension-mux compile --target all --source test/fixtures/test-plugin --output test/output --verify
```

Integration test assertions:
1. **File tree completeness** -- every expected file is emitted; no unexpected files
2. **File content correctness** -- manifests parse as valid JSON/TOML; hook scripts have shebangs; SKILL.md files have valid frontmatter
3. **Cross-file consistency** -- paths referenced in manifests point to emitted files; versions match across `versions.json` and `package.json` dependencies
4. **Round-trip stability** -- compiling twice produces identical output (determinism check)

### E.3 Snapshot Testing

Compiled output for each target is stored as committed snapshots. CI compares fresh compilation against snapshots:

```bash
# Update snapshots (when intentional changes are made)
npx @a5c-ai/extension-mux compile --target all --output test/snapshots --source test/fixtures/test-plugin

# CI check: compile and compare (fails if output differs from snapshot)
npx @a5c-ai/extension-mux compile --target all --output /tmp/test-output --source test/fixtures/test-plugin
npx @a5c-ai/extension-mux diff --target all --existing test/snapshots
```

Snapshot tests catch unintentional changes to emitted output format, whitespace, field ordering, and file structure.

### E.4 The `diff` Command for Regression Detection

The `diff` CLI command (section 10.3) is the primary regression detection tool during migration:

```bash
# Compare compiled output against generated plugin bundles
npx @a5c-ai/extension-mux diff --target codex --existing artifacts/generated-plugins/codex
npx @a5c-ai/extension-mux diff --target pi --existing artifacts/generated-plugins/pi
npx @a5c-ai/extension-mux diff --target all --existing artifacts/generated-plugins
```

The diff command:
1. Compiles the UPF source for the specified target into a temp directory
2. Recursively compares every file against the existing directory
3. Reports files only in compiled, only in existing, and content differences
4. Returns exit code 0 if identical, exit code 1 if differences found
5. In `--json` mode, outputs a structured diff result with per-file change details

This is essential during Phase 2 of migration (section 9.1) to verify the compiler produces output matching the hand-maintained plugins.

---

## Appendix F: Version Conflict Resolution

### F.1 Version Fields and Their Relationships

The UPF manifest contains two version-related fields that can potentially conflict:

| Field | Location | Purpose |
|-------|----------|---------|
| `version` | `a5c-plugin.json` | Plugin version (used in emitted manifests) |
| `sdkVersion` | `versions.json` | SDK/hooks-mux version pin (used at runtime) |

Additionally, target overrides can specify dependency versions:

```jsonc
{
  "targets": {
    "codex": {
      // This creates a potential conflict if the override version
      // differs from versions.json sdkVersion
      "dependencies": {
        "@a5c-ai/babysitter-sdk": "4.9.0"
      }
    }
  }
}
```

### F.2 Conflict Scenarios and Resolution

**Scenario 1: UPF `version` vs. target override version**

If a target override specifies a different plugin `version` than the UPF manifest:

- **Resolution:** The UPF `version` field is authoritative. Target overrides **cannot** override the top-level `version` field. The compiler emits a warning diagnostic if a target attempts to set a different `version`.

**Scenario 2: `versions.json` sdkVersion vs. target dependency version**

If a target override specifies an explicit dependency version for `@a5c-ai/babysitter-sdk` that differs from `versions.json` `sdkVersion`:

- **Resolution:** The `versions.json` `sdkVersion` is authoritative for hook script installation. For `package.json` dependency fields in targets like Codex/Pi, the compiler uses `sdkVersion` from `versions.json` unless the target override explicitly sets a dependency version. If both are present and differ, the compiler:
  1. Emits a `warning` diagnostic: `"Target 'codex' specifies SDK dependency '4.9.0' but versions.json pins sdkVersion to '5.0.0'. Using versions.json value."`
  2. Uses the `versions.json` value (it is authoritative)

**Scenario 3: Hook script version drift**

Hook scripts read `versions.json` at runtime to determine which SDK/hooks-mux version to install. If a compiled plugin's `versions.json` is manually edited after compilation:

- **Resolution:** This is a runtime concern, not a compile-time one. The compiler always copies the source `versions.json` as-is. The `bump-version.mjs` script ensures all versions stay in sync during releases.

**Scenario 4: UPF source version vs. existing plugin version**

When using `diff --existing`, the compiled version may differ from the hand-maintained plugin version:

- **Resolution:** The diff command reports version differences as informational diagnostics, not errors. Version differences are expected during migration (the compiled output has the UPF version, existing plugins may have independently bumped versions).

### F.3 Version Pinning Best Practices

1. **Single source of truth:** Always update versions via `scripts/bump-version.mjs`, which updates both `a5c-plugin.json` and `versions.json` atomically.
2. **Avoid target-level version overrides:** Do not override dependency versions in `targets.*` -- let `versions.json` be authoritative.
3. **Pre-release verification:** Run `validate --strict` before release to catch any version inconsistencies.
4. **Lock file discipline:** For npm-published targets (Codex, Pi, oh-my-pi), lock files are generated during `npm install` in the emitted directory, not by the compiler.

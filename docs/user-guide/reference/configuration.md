# Babysitter Configuration Reference

**Version:** 1.0
**Last Updated:** 2026-01-25

Complete reference for all Babysitter configuration options, environment variables, file paths, and settings.

---

## Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
  - [SDK Variables](#sdk-variables)
  - [Worker Variables](#worker-variables)
  - [Debug Variables](#debug-variables)
  - [Session Variables](#session-variables)
- [Directory Structure](#directory-structure)
  - [Runs Directory](#runs-directory)
  - [Run Directory Structure](#run-directory-structure)
  - [Plugin Directory](#plugin-directory)
- [Configuration Files](#configuration-files)
  - [run.json](#runjson)
  - [inputs.json](#inputsjson)
  - [state.json](#statejson)
  - [hooks.json](#hooksjson)
- [Hook Configuration](#hook-configuration)
  - [Hook Discovery](#hook-discovery)
  - [Hook Types](#hook-types)
  - [Custom Hook Development](#custom-hook-development)
- [Process Configuration](#process-configuration)
  - [Task Definitions](#task-definitions)
  - [Breakpoint Configuration](#breakpoint-configuration)
- [Default Values](#default-values)
- [Configuration Precedence](#configuration-precedence)

---

## Overview

Babysitter configuration is managed through:
1. **Environment variables** - Runtime settings
2. **File-based configuration** - Per-run and per-project settings
3. **CLI flags** - Command-line overrides
4. **Hooks** - Extensible behavior customization

### Configuration Philosophy

- **Convention over configuration** - Sensible defaults work out of the box
- **Explicit overrides** - Environment variables and CLI flags for customization
- **Immutable runs** - Run configuration is captured at creation time
- **Git-friendly** - Human-readable JSON and markdown files

---

## Environment Variables

### SDK Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `RUNS_DIR` | Base directory for runs | `.` (current directory) | `.a5c/runs` |
| `REPO_ROOT` | Repository root directory | Current working directory | `/home/user/project` |
| `BABYSITTER_LOG_LEVEL` | Logging verbosity | `info` | `debug`, `warn`, `error` |
| `BABYSITTER_ALLOW_SECRET_LOGS` | Allow logging sensitive data | `false` | `true` |

#### RUNS_DIR

Specifies the base directory where run directories are created and stored.

```bash
# Default behavior - runs created in current directory
babysitter run:create --process-id dev/build --entry ./main.js#process

# Override via environment variable
export RUNS_DIR=.a5c/runs
babysitter run:create --process-id dev/build --entry ./main.js#process

# Override via CLI flag (takes precedence)
babysitter run:create --runs-dir .a5c/runs --process-id dev/build --entry ./main.js#process
```

#### BABYSITTER_LOG_LEVEL

Controls the verbosity of log output.

| Level | Description |
|-------|-------------|
| `error` | Only errors |
| `warn` | Warnings and errors |
| `info` | Normal operation (default) |
| `debug` | Detailed debugging information |

```bash
export BABYSITTER_LOG_LEVEL=debug
babysitter run:iterate run-123 --json
```

#### BABYSITTER_ALLOW_SECRET_LOGS

When set to `true` along with `--verbose` and `--json`, allows task payloads to be included in output.

```bash
BABYSITTER_ALLOW_SECRET_LOGS=true babysitter task:show run-123 ef-abc --json --verbose
```

**Security Warning:** Only enable in development/debugging. Never enable in production logs.

---

### Debug Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEBUG` | Node.js debug namespaces | None | `babysitter:*` |

```bash

# Enable Node.js debug output
export DEBUG=babysitter:*
babysitter run:iterate run-123
```

---

### Session Variables

These variables are set by Claude Code and used by the plugin.

| Variable | Description | Set By |
|----------|-------------|--------|
| `BABYSITTER_SESSION_ID` | Cross-harness session identifier (written to `CLAUDE_ENV_FILE` by session-start hook) | Babysitter |
| `CLAUDE_PLUGIN_ROOT` | Plugin installation directory | Claude Code |
| `CLAUDE_ENV_FILE` | Path to environment persistence file | Claude Code |

These are automatically available in hooks and skills. Use them for session isolation and state management.

```bash
# In a hook script
echo "Session: $BABYSITTER_SESSION_ID"
echo "Plugin root: $CLAUDE_PLUGIN_ROOT"

# State file path pattern
STATE_FILE="${CLAUDE_PLUGIN_ROOT}/state/${BABYSITTER_SESSION_ID}.md"
```

---

## Directory Structure

### Runs Directory

Default location: `.a5c/runs/` (configurable via `RUNS_DIR` or `--runs-dir`)

```
.a5c/
└── runs/
    ├── run-20260125-143012-feature-a/
    ├── run-20260125-150000-bugfix/
    └── run-20260126-090000-refactor/
```

### Run Directory Structure

Each run has the following structure:

```
.a5c/runs/<runId>/
├── run.json              # Run metadata (immutable after creation)
├── inputs.json           # Initial inputs (immutable after creation)
├── code/
│   └── main.js           # Process implementation
├── artifacts/
│   ├── process.md        # Process description
│   ├── plan.md           # Implementation plan
│   └── ...               # Other generated artifacts
├── journal/
│   ├── 000001.<ulid>.json  # Event 1
│   ├── 000002.<ulid>.json  # Event 2
│   └── ...                 # Append-only event log
├── state/
│   └── state.json        # Derived state cache (gitignored, rebuildable)
└── tasks/
    └── <effectId>/
        ├── task.json     # Task definition
        ├── input.json    # Task inputs
        ├── result.json   # Task result (written by SDK)
        ├── output.json   # Value file (written by executor)
        ├── stdout.log    # Standard output
        └── stderr.log    # Standard error
```

#### File Descriptions

| File | Purpose | Mutability |
|------|---------|------------|
| `run.json` | Run metadata, process configuration | Immutable |
| `inputs.json` | Initial process inputs | Immutable |
| `code/main.js` | Process implementation | Editable |
| `artifacts/*` | Generated files (plans, specs) | Generated |
| `journal/*` | Event log | Append-only |
| `state/state.json` | Cached state | Derived (rebuildable) |
| `tasks/*/task.json` | Task definitions | Immutable |
| `tasks/*/result.json` | Task results | Written by SDK |

### Plugin Directory

Location: Managed by Claude Code plugin system

```
plugins/babysitter/
├── plugin.json           # Plugin manifest
├── skills/
│   └── babysit/
│       ├── SKILL.md      # Skill instructions
│       ├── scripts/
│       │   └── setup-babysitter-run-resume.sh
│       ├── reference/
│       │   └── *.md
│       └── process/
│           ├── methodologies/
│           └── specializations/
├── hooks/
│   ├── hooks.json        # Hook registration
│   ├── hook-dispatcher.sh
│   ├── babysitter-stop-hook.sh
│   ├── babysitter-session-start-hook.sh
│   ├── on-iteration-start/
│   │   └── native-orchestrator.sh
│   ├── on-iteration-end/
│   ├── on-run-start/
│   ├── on-run-complete/
│   ├── on-task-start/
│   ├── on-task-complete/
│   └── on-breakpoint/
├── agents/
│   └── babysitter.md
└── state/                # Runtime state (session-specific)
    └── ${SESSION_ID}.md
```

---

## Configuration Files

### run.json

Created by `run:create`. Contains immutable run metadata.

**Schema:**
```json
{
  "runId": "run-20260125-143012",
  "createdAt": "2026-01-25T14:30:12.123Z",
  "process": {
    "processId": "dev/build",
    "entry": ".a5c/processes/build/main.js#buildProcess",
    "revision": "1.0.0"
  },
  "request": "Build the authentication module",
  "prompt": "Build the authentication module with JWT tokens and role-based access control"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `runId` | string | Unique run identifier |
| `createdAt` | ISO 8601 | Creation timestamp |
| `process.processId` | string | Process type identifier |
| `process.entry` | string | Entry point `<path>#<export>` |
| `process.revision` | string | Optional version/revision |
| `request` | string | Optional human-readable description |
| `prompt` | string | Optional initial user prompt (persisted for context recovery) |

---

### inputs.json

Initial inputs provided to the process.

**Schema:** User-defined, passed to process function as first argument.

**Example:**
```json
{
  "feature": "user-authentication",
  "targetQuality": 85,
  "maxIterations": 5,
  "config": {
    "database": "sqlite",
    "testFramework": "jest"
  }
}
```

---

### state.json

Derived state cache. Rebuilt from journal if missing.

**Schema:**
```json
{
  "runId": "run-20260125-143012",
  "status": "running",
  "version": 42,
  "processState": {},
  "invocations": {
    "task/build:1": {
      "effectId": "effect-abc123",
      "status": "completed",
      "resultRef": "tasks/effect-abc123/result.json"
    }
  },
  "pendingEffects": [
    {
      "effectId": "effect-def456",
      "kind": "node",
      "status": "requested",
      "taskId": "task/lint"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `runId` | Run identifier |
| `status` | `created`, `running`, `waiting`, `completed`, `failed` |
| `version` | State version (increments with each event) |
| `processState` | Process-specific state data |
| `invocations` | Map of completed task invocations |
| `pendingEffects` | List of pending effects |

**Note:** This file is gitignored and can be deleted. It will be rebuilt by `run:rebuild-state` or the next CLI command.

---

### hooks.json

Hook registration for Claude Code integration.

**Location:** `plugins/babysitter/hooks/hooks.json`

**Schema:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-session-start-hook.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-stop-hook.sh"
          }
        ]
      }
    ]
  }
}
```

**Hook Events:**
- `SessionStart` - When Claude Code session starts
- `Stop` - When Claude tries to exit
- `PreToolUse` - Before tool invocation
- `PostToolUse` - After tool invocation

---

## Hook Configuration

### Hook Discovery

Hooks are discovered in priority order:

1. **Per-repo hooks:** `.a5c/hooks/<hook-name>/*.sh`
2. **Per-user hooks:** `~/.config/babysitter/hooks/<hook-name>/*.sh`
3. **Plugin hooks:** `plugins/babysitter/hooks/<hook-name>/*.sh`

All executable files (`.sh`) in the hook directory are executed in lexicographic order.

### Hook Types

#### SDK Lifecycle Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| `on-run-start` | Run creation | Initialize run resources |
| `on-run-complete` | Successful completion | Cleanup, notifications |
| `on-run-fail` | Run failure | Error handling, alerts |
| `on-iteration-start` | Before iteration | **Core orchestration** |
| `on-iteration-end` | After iteration | Finalization, logging |
| `on-task-start` | Before task execution | Preparation, metrics |
| `on-task-complete` | After task execution | Cleanup, metrics |
| `on-breakpoint` | Breakpoint created | Notifications |

#### Claude Code Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| `SessionStart` | Session begins | Session setup |
| `Stop` | Exit attempt | In-session loop control |
| `PreToolUse` | Before tool call | Validation |
| `PostToolUse` | After tool call | Logging |

### Custom Hook Development

#### Basic Hook Template

```bash
#!/bin/bash
set -euo pipefail

# Read JSON payload from stdin
PAYLOAD=$(cat)

# Parse payload
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
EFFECT_ID=$(echo "$PAYLOAD" | jq -r '.effectId // empty')

# Log to stderr (not captured as result)
echo "Processing: $RUN_ID" >&2

# Your logic here
# ...

# Return JSON result via stdout
echo '{"ok": true, "action": "processed"}'
```

#### Hook Input/Output

| Channel | Purpose |
|---------|---------|
| stdin | JSON payload input |
| stdout | JSON result output (must be valid JSON) |
| stderr | Logging (not captured) |

#### Making Hooks Executable

```bash
chmod +x .a5c/hooks/on-run-complete/my-hook.sh
```

#### Example: Slack Notification Hook

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
STATUS=$(echo "$PAYLOAD" | jq -r '.status')

# Send to Slack
curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Run $RUN_ID completed with status: $STATUS\"}" >&2

echo '{"ok": true}'
```

---

## Process Configuration

### Task Definitions

Tasks are defined in the process file using the `defineTask` helper.

#### Node Task

```javascript
export const buildTask = defineTask('build', (args, ctx) => ({
  kind: 'node',
  title: 'Build project',
  node: {
    entry: './scripts/build.js',
    args: ['--target', args.target],
    env: {
      NODE_ENV: 'production'
    },
    timeout: 300000  // 5 minutes
  },
  io: {
    inputJsonPath: `tasks/${ctx.effectId}/input.json`,
    outputJsonPath: `tasks/${ctx.effectId}/result.json`
  }
}));
```

#### Agent Task

```javascript
export const analyzeTask = defineTask('analyze', (args, ctx) => ({
  kind: 'agent',
  title: 'Analyze code quality',
  agent: {
    name: 'code-analyzer',
    prompt: {
      role: 'Senior code reviewer',
      task: 'Analyze the codebase for quality issues',
      context: args,
      instructions: [
        'Review code structure',
        'Check naming conventions',
        'Identify potential bugs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'issues'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array' }
      }
    }
  }
}));
```

#### Skill Task

```javascript
export const refactorTask = defineTask('refactor', (args, ctx) => ({
  kind: 'skill',
  title: 'Refactor module',
  skill: {
    name: 'code-refactor',
    context: {
      files: args.files,
      pattern: args.pattern,
      instructions: args.instructions
    }
  }
}));
```

### Breakpoint Configuration

```javascript
await ctx.breakpoint({
  question: 'Approve the deployment to production?',
  title: 'Production Deployment Approval',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/deploy-plan.md', format: 'markdown', label: 'Deployment Plan' },
      { path: 'artifacts/changes.md', format: 'markdown', label: 'Changes Summary' },
      { path: 'code/main.js', format: 'code', language: 'javascript', label: 'Process Code' }
    ]
  }
});
```

---

## Default Values

### SDK Defaults

| Setting | Default Value |
|---------|---------------|
| Runs directory | Current directory (`.`) |
| Log level | `info` |
| Max iterations | 100 (in testing harness) |
| Task timeout | None (process-defined) |

### In-Session Loop Defaults

| Setting | Default Value |
|---------|---------------|
| Max iterations | `0` (unlimited) |
| State file location | `$CLAUDE_PLUGIN_ROOT/state/${SESSION_ID}.md` |

---

## Configuration Precedence

When multiple configuration sources exist, they are applied in this order (later overrides earlier):

1. **Built-in defaults** - Hardcoded in SDK
2. **Configuration files** - `run.json`, `inputs.json`
3. **Environment variables** - `RUNS_DIR`, `PORT`, etc.
4. **CLI flags** - `--runs-dir`, `--json`, `--verbose`

### Example Precedence

```bash
# Built-in default: runs dir = "."
# Environment variable: RUNS_DIR=.a5c/runs
# CLI flag: --runs-dir /custom/runs

export RUNS_DIR=.a5c/runs
babysitter run:create --runs-dir /custom/runs --process-id dev/build

# Result: runs dir = /custom/runs (CLI flag wins)
```

---

## Configuration Best Practices

### Development Environment

```bash
# .envrc or .env
export RUNS_DIR=.a5c/runs
export BABYSITTER_LOG_LEVEL=debug
```

### CI/CD Environment

```bash
# GitHub Actions example
env:
  RUNS_DIR: .a5c/runs
  BABYSITTER_LOG_LEVEL: info
  BABYSITTER_ALLOW_SECRET_LOGS: false
```

### Security Recommendations

1. **Never commit tokens** - Use environment variables or secrets management
2. **Restrict network binding** - Use `--host 127.0.0.1` for local-only access
3. **Enable authentication** - Set `AGENT_TOKEN` and `HUMAN_TOKEN`
4. **Audit logs** - Keep `BABYSITTER_ALLOW_SECRET_LOGS=false` in production

---

## Related Documentation

- [CLI Reference](./cli-reference.md) - Complete CLI documentation
- [Glossary](./glossary.md) - Term definitions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

# Babysitter CLI Reference

**Version:** 1.0
**SDK Version:** 0.0.123+
**Last Updated:** 2026-01-25

Complete reference documentation for the Babysitter command-line interface.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Global Options](#global-options)
- [Run Management Commands](#run-management-commands)
  - [run:create](#runcreate)
  - [run:status](#runstatus)
  - [run:events](#runevents)
  - [run:iterate](#runiterate)
  - [run:rebuild-state](#runrebuild-state)
- [Task Commands](#task-commands)
  - [task:list](#tasklist)
  - [task:show](#taskshow)
  - [task:post](#taskpost)
- [Breakpoints Commands](#breakpoints-commands)
  - [breakpoints start](#breakpoints-start)
  - [breakpoint create](#breakpoint-create)
  - [breakpoint status](#breakpoint-status)
  - [breakpoint wait](#breakpoint-wait)
- [Exit Codes](#exit-codes)
- [Output Formats](#output-formats)
- [Examples](#examples)

---

## Overview

The Babysitter CLI provides deterministic orchestration for event-sourced workflows. It enables run lifecycle management, task introspection, and result posting.

**Binary Names:**
- `babysitter` (primary)
- `babysitter-sdk` (alias)

**Design Principles:**
- Deterministic operations (same inputs = same outputs)
- JSON-first output for automation
- POSIX path separators in all output (cross-platform)
- No hidden state mutations

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g @a5c-ai/babysitter-sdk@latest
```

### Via npx (No Install)

```bash
npx -y @a5c-ai/babysitter-sdk@latest <command>
```

### Verify Installation

```bash
babysitter --version
# Output: 0.0.123
```

### Alias Setup

```bash
# Recommended alias for scripts
CLI="babysitter"

# Or for npx usage
CLI="npx -y @a5c-ai/babysitter-sdk@latest"
```

---

## Global Options

These options are available on all commands:

| Option | Description | Default |
|--------|-------------|---------|
| `--runs-dir <path>` | Override the runs directory | `.` (current directory) |
| `--json` | Output in JSON format | `false` |
| `--verbose` | Enable verbose logging (paths, resolved options) | `false` |
| `--dry-run` | Preview changes without applying (where supported) | `false` |
| `--help` | Show help for command | - |
| `--version` | Show version number | - |

### Path Handling

- All paths in output use POSIX separators (`/`) regardless of platform
- Input paths accept both POSIX (`/`) and Windows (`\`) separators
- Paths are relative to the run directory unless absolute

---

## Run Management Commands

### run:create

Creates a new orchestration run.

#### Synopsis

```bash
babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  [--inputs <file>] \
  [--run-id <id>] \
  [--process-revision <rev>] \
  [--request <description>] \
  [--json]
```

#### Options

| Option | Required | Description |
|--------|----------|-------------|
| `--process-id <id>` | Yes | Process identifier (e.g., `dev/build`) |
| `--entry <path>#<export>` | Yes | Entry point file and export name |
| `--inputs <file>` | No | Path to inputs JSON file |
| `--run-id <id>` | No | Custom run ID (auto-generated if omitted) |
| `--process-revision <rev>` | No | Process revision/version |
| `--request <description>` | No | Human-readable request description |

#### Output (Human)

```
[run:create] runId=run-20260125-143012 runDir=.a5c/runs/run-20260125-143012
```

#### Output (JSON)

```json
{
  "runId": "run-20260125-143012",
  "runDir": ".a5c/runs/run-20260125-143012",
  "process": {
    "processId": "dev/build",
    "entry": "processes/build/process.mjs#process"
  }
}
```

#### Examples

```bash
# Basic run creation
babysitter run:create \
  --process-id dev/build \
  --entry .a5c/processes/build/main.js#buildProcess

# With inputs and custom ID
babysitter run:create \
  --process-id tdd/feature \
  --entry .a5c/processes/tdd/main.js#tddProcess \
  --inputs ./inputs.json \
  --run-id "run-$(date -u +%Y%m%d-%H%M%S)-auth-feature" \
  --json

# With request description
babysitter run:create \
  --process-id dev/api \
  --entry ./process.js#apiProcess \
  --request "Build REST API with authentication"
```

---

### run:status

Returns the current status of a run.

#### Synopsis

```bash
babysitter run:status <runId> [--json]
```

#### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `<runId>` | Yes | Run ID or path to run directory |

#### Output (Human)

```
[run:status] state=waiting last=TASK_REQUESTED#0042 2026-01-25T14:30:12.123Z pending[node]=2 pending[total]=2 stateVersion=42
```

#### Output (JSON)

```json
{
  "runId": "run-20260125-143012",
  "state": "waiting",
  "lastEvent": "TASK_REQUESTED#0042 2026-01-25T14:30:12.123Z",
  "pendingByKind": {
    "node": 2
  },
  "metadata": {
    "processId": "dev/build",
    "stateVersion": 42,
    "pendingEffectsByKind": {
      "node": 2
    }
  },
  "completionSecret": "..." // Only present when state=completed
}
```

#### State Values

| State | Description |
|-------|-------------|
| `created` | Run initialized, not yet started |
| `running` | Run in progress |
| `waiting` | Blocked on breakpoint or sleep |
| `completed` | Run finished successfully |
| `failed` | Run terminated with error |

#### Examples

```bash
# Check status
babysitter run:status run-20260125-143012

# JSON output
babysitter run:status run-20260125-143012 --json

# Using run directory path
babysitter run:status .a5c/runs/run-20260125-143012 --json
```

---

### run:events

Lists journal events for a run.

#### Synopsis

```bash
babysitter run:events <runId> \
  [--limit <n>] \
  [--reverse] \
  [--filter-type <type>] \
  [--json]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--limit <n>` | Maximum events to return | All |
| `--reverse` | Show newest events first | `false` |
| `--filter-type <type>` | Filter by event type | All types |

#### Output (Human)

```
[run:events] count=42
#0001 2026-01-25T14:30:12.123Z RUN_CREATED processId=dev/build
#0002 2026-01-25T14:30:12.234Z TASK_REQUESTED effectId=effect-abc123
#0003 2026-01-25T14:30:15.456Z EFFECT_RESOLVED effectId=effect-abc123
...
```

#### Output (JSON)

```json
{
  "count": 42,
  "events": [
    {
      "seq": 1,
      "timestamp": "2026-01-25T14:30:12.123Z",
      "type": "RUN_CREATED",
      "payload": {
        "processId": "dev/build"
      }
    }
  ]
}
```

#### Examples

```bash
# Show all events
babysitter run:events run-20260125-143012

# Last 20 events (newest first)
babysitter run:events run-20260125-143012 --limit 20 --reverse

# Filter by type
babysitter run:events run-20260125-143012 --filter-type EFFECT_RESOLVED --json
```

---

### run:iterate

Executes a single orchestration iteration. This is the core command for driving runs.

#### Synopsis

```bash
babysitter run:iterate <runId> \
  [--iteration <n>] \
  [--json]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--iteration <n>` | Iteration number (for logging) | 1 |

#### Output (Human)

```
[run:iterate] iteration=1 status=executed action=executed-tasks count=3
```

#### Output (JSON)

```json
{
  "iteration": 1,
  "status": "executed",
  "action": "executed-tasks",
  "reason": "auto-runnable-tasks",
  "count": 3,
  "metadata": {
    "runId": "run-20260125-143012",
    "processId": "dev/build",
    "hookStatus": "executed",
    "stateVersion": 45
  },
  "completionSecret": "..." // Only present when status=completed
}
```

#### Status Values

| Status | Description | Action |
|--------|-------------|--------|
| `executed` | Tasks were executed | Continue looping |
| `waiting` | Breakpoint or sleep active | Pause, check periodically |
| `completed` | Run finished successfully | Exit loop |
| `failed` | Run encountered error | Exit loop, investigate |
| `none` | No pending effects | May indicate completion |

#### Examples

```bash
# Single iteration
babysitter run:iterate run-20260125-143012 --json

# With iteration number
babysitter run:iterate run-20260125-143012 --iteration 5 --json

# Orchestration loop pattern
ITERATION=0
while true; do
  ((ITERATION++))
  RESULT=$(babysitter run:iterate "$RUN_ID" --json --iteration $ITERATION)
  STATUS=$(echo "$RESULT" | jq -r '.status')

  case "$STATUS" in
    completed|failed) break ;;
    waiting) sleep 5 ;;
    *) continue ;;
  esac
done
```

---

### run:rebuild-state

Rebuilds the state cache from the journal.

#### Synopsis

```bash
babysitter run:rebuild-state <runId> [--json]
```

#### Description

Replays the journal to reconstruct `state/state.json`. Useful when the state cache is missing, corrupted, or stale.

#### Output (JSON)

```json
{
  "status": "rebuilt",
  "reason": "missing-state-file",
  "eventCount": 42,
  "stateVersion": 42
}
```

#### Examples

```bash
# Rebuild state
babysitter run:rebuild-state run-20260125-143012

# Check result
babysitter run:status run-20260125-143012 --json
```

---

## Task Commands

### task:list

Lists tasks in a run with their status.

#### Synopsis

```bash
babysitter task:list <runId> \
  [--pending] \
  [--kind <kind>] \
  [--json]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--pending` | Show only pending (unresolved) tasks | All tasks |
| `--kind <kind>` | Filter by task kind | All kinds |

#### Output (Human)

```
[task:list] pending=2
- ef-build-001 [node requested] build workspace (taskId=build.workspaces)
- ef-lint-001 [node requested] lint sources (taskId=lint.sources)
```

#### Output (JSON)

```json
{
  "tasks": [
    {
      "effectId": "ef-build-001",
      "status": "requested",
      "kind": "node",
      "label": "build workspace",
      "taskId": "build.workspaces",
      "taskDefRef": "tasks/ef-build-001/task.json",
      "resultRef": null,
      "stdoutRef": null,
      "stderrRef": null
    }
  ]
}
```

#### Examples

```bash
# List all tasks
babysitter task:list run-20260125-143012

# List pending tasks only
babysitter task:list run-20260125-143012 --pending --json

# Filter by kind
babysitter task:list run-20260125-143012 --kind breakpoint
```

---

### task:show

Shows detailed information about a specific task.

#### Synopsis

```bash
babysitter task:show <runId> <effectId> [--json]
```

#### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `<runId>` | Yes | Run ID |
| `<effectId>` | Yes | Effect ID of the task |

#### Output (JSON)

```json
{
  "effect": {
    "effectId": "ef-build-001",
    "taskId": "build.workspaces",
    "status": "requested",
    "kind": "node",
    "stdoutRef": null
  },
  "task": {
    "kind": "node",
    "node": {
      "entry": "build/scripts/build-workspace.mjs",
      "args": ["--workspace", "frontend"]
    }
  },
  "result": null,
  "largeResult": null
}
```

#### Examples

```bash
# Show task details
babysitter task:show run-20260125-143012 ef-build-001 --json

# Human readable
babysitter task:show run-20260125-143012 ef-build-001
```

---

### task:post

Posts a result for an executed task. This is how you commit external execution results into the run.

#### Synopsis

```bash
babysitter task:post <runId> <effectId> \
  --status <ok|error> \
  [--value <file>] \
  [--error <file>] \
  [--stdout-ref <ref>] \
  [--stderr-ref <ref>] \
  [--stdout-file <file>] \
  [--stderr-file <file>] \
  [--started-at <iso8601>] \
  [--finished-at <iso8601>] \
  [--metadata <file>] \
  [--invocation-key <key>] \
  [--dry-run] \
  [--json]
```

#### Options

| Option | Required | Description |
|--------|----------|-------------|
| `--status <ok\|error>` | Yes | Task completion status |
| `--value <file>` | No | Path to result value JSON (for status=ok) |
| `--error <file>` | No | Path to error payload JSON (for status=error) |
| `--stdout-ref <ref>` | No | Reference to stdout file |
| `--stderr-ref <ref>` | No | Reference to stderr file |
| `--stdout-file <file>` | No | Path to stdout file to copy |
| `--stderr-file <file>` | No | Path to stderr file to copy |
| `--started-at <iso8601>` | No | Task start timestamp |
| `--finished-at <iso8601>` | No | Task end timestamp |
| `--metadata <file>` | No | Path to additional metadata JSON |
| `--invocation-key <key>` | No | Invocation key for the task |
| `--dry-run` | No | Preview without committing |

#### Output (JSON)

```json
{
  "status": "ok",
  "committed": {
    "resultRef": "tasks/ef-build-001/result.json",
    "stdoutRef": "tasks/ef-build-001/stdout.log",
    "stderrRef": "tasks/ef-build-001/stderr.log"
  },
  "stdoutRef": "tasks/ef-build-001/stdout.log",
  "stderrRef": "tasks/ef-build-001/stderr.log",
  "resultRef": "tasks/ef-build-001/result.json"
}
```

#### Important Notes

1. **Do NOT write `result.json` directly** - The SDK owns this file
2. Write your result value to a separate file (e.g., `output.json`)
3. Pass the value file via `--value` flag
4. The CLI will create the proper `result.json` with metadata

#### Examples

```bash
# Post successful result
echo '{"score": 85}' > tasks/ef-build-001/output.json
babysitter task:post run-20260125-143012 ef-build-001 \
  --status ok \
  --value tasks/ef-build-001/output.json \
  --json

# Post with stdout/stderr
babysitter task:post run-20260125-143012 ef-build-001 \
  --status ok \
  --value tasks/ef-build-001/output.json \
  --stdout-file tasks/ef-build-001/stdout.log \
  --stderr-file tasks/ef-build-001/stderr.log \
  --json

# Post error
echo '{"error": "Build failed", "exitCode": 1}' > tasks/ef-build-001/error.json
babysitter task:post run-20260125-143012 ef-build-001 \
  --status error \
  --error tasks/ef-build-001/error.json \
  --json

# Dry run (preview)
babysitter task:post run-20260125-143012 ef-build-001 \
  --status ok \
  --dry-run
```

---

## Breakpoints Commands

The breakpoints commands are provided by the `@a5c-ai/babysitter-breakpoints` package.

> **Note on Breakpoint Modes:**
>
> Babysitter supports two modes for handling breakpoints:
>
> | Mode | When Used | Service Required |
> |------|-----------|-----------------|
> | **Interactive** | Claude Code sessions | No - breakpoints handled via AskUserQuestion in chat |
> | **Non-Interactive** | CI/CD, scripts, team workflows | Yes - use commands below |
>
> **If you're using Claude Code interactively, you don't need these commands** - breakpoints are handled directly in the chat. These commands are for non-interactive automation scenarios.

### breakpoints start

Starts the full breakpoints service (API + Web UI + Worker). **Only needed for non-interactive mode.**

#### Synopsis

```bash
breakpoints start [--host <host>] [--port <port>] [--web-port <port>]
```

Or via npx:

```bash
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--host <host>` | Bind address | `127.0.0.1` |
| `--port <port>` | API port | `3185` |
| `--web-port <port>` | Web UI port | `3184` |

#### Examples

```bash
# Start with defaults
breakpoints start

# Custom ports
breakpoints start --port 4185 --web-port 4184

# Expose to network (caution!)
breakpoints start --host 0.0.0.0
```

---

### breakpoint create

Creates a new breakpoint for human approval.

#### Synopsis

```bash
breakpoints breakpoint create \
  --question <question> \
  [--title <title>] \
  [--run-id <runId>] \
  [--tag <tag>] \
  [--file <path,format[,language][,label]>]...
```

#### Options

| Option | Required | Description |
|--------|----------|-------------|
| `--question <question>` | Yes | Question to present to human |
| `--title <title>` | No | Breakpoint title |
| `--run-id <runId>` | No | Associated run ID |
| `--tag <tag>` | No | Tag for filtering (repeatable) |
| `--file <spec>` | No | Context file (repeatable) |

#### File Specification Format

```
<path>,<format>[,<language>][,<label>]
```

- `path` - File path relative to repo root
- `format` - `markdown`, `code`, `json`, `text`
- `language` - (Optional) Syntax highlighting language
- `label` - (Optional) Display label

#### Examples

```bash
# Simple breakpoint
breakpoints breakpoint create \
  --question "Approve the deployment?" \
  --title "Production Deployment"

# With context files
breakpoints breakpoint create \
  --question "Approve the plan?" \
  --title "Plan Review" \
  --run-id run-20260125-143012 \
  --file ".a5c/runs/run-20260125-143012/artifacts/plan.md,markdown" \
  --file ".a5c/runs/run-20260125-143012/code/main.js,code,javascript"
```

---

### breakpoint status

Checks the status of a breakpoint.

#### Synopsis

```bash
breakpoints breakpoint status <id>
```

#### Output

```json
{
  "id": "bp-abc123",
  "status": "waiting",
  "title": "Plan Review",
  "question": "Approve the plan?",
  "createdAt": "2026-01-25T14:30:12.123Z"
}
```

---

### breakpoint wait

Waits for a breakpoint to be released.

#### Synopsis

```bash
breakpoints breakpoint wait <id> [--interval <seconds>]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--interval <seconds>` | Poll interval | `5` |

#### Examples

```bash
# Wait with default interval
breakpoints breakpoint wait bp-abc123

# Custom interval
breakpoints breakpoint wait bp-abc123 --interval 3
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Expected user error (bad args, missing run, validation failure) |
| `2+` | Unexpected internal error |

### Error Handling

Errors include:
- Command prefix
- Resolved run directory
- Descriptive message
- Stack trace (with `--verbose`)

Example error:
```
[run:events] unable to read run metadata at .a5c/runs/invalid-run
```

---

## Output Formats

### Human Format (Default)

Terse, single-line output optimized for CI logs and human readability.

```
[run:status] state=waiting last=TASK_REQUESTED#0042 pending[node]=2
```

### JSON Format (`--json`)

Structured JSON for programmatic parsing.

```json
{
  "state": "waiting",
  "pendingByKind": { "node": 2 }
}
```

**JSON Conventions:**
- Single JSON document (not streaming)
- All timestamps are ISO 8601 strings
- Numbers remain numeric
- Paths use POSIX separators

### Secret Handling

Task payloads are never echoed by default. To see full payloads:

```bash
BABYSITTER_ALLOW_SECRET_LOGS=true babysitter task:show <runId> <effectId> --json --verbose
```

---

## Examples

### Complete Orchestration Flow

```bash
#!/bin/bash
set -euo pipefail

CLI="babysitter"
PROCESS_ID="tdd/feature"
ENTRY=".a5c/processes/tdd/main.js#tddProcess"

# 1. Create run
RESULT=$($CLI run:create \
  --process-id "$PROCESS_ID" \
  --entry "$ENTRY" \
  --inputs inputs.json \
  --json)

RUN_ID=$(echo "$RESULT" | jq -r '.runId')
echo "Created run: $RUN_ID"

# 2. Orchestration loop
ITERATION=0
MAX_ITERATIONS=100

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ((ITERATION++))
  echo "Iteration $ITERATION..."

  # Run iteration
  RESULT=$($CLI run:iterate "$RUN_ID" --json --iteration $ITERATION)
  STATUS=$(echo "$RESULT" | jq -r '.status')

  echo "Status: $STATUS"

  case "$STATUS" in
    completed)
      echo "Run completed successfully!"
      break
      ;;
    failed)
      echo "Run failed!"
      exit 1
      ;;
    waiting)
      echo "Waiting for breakpoint..."
      sleep 10
      ;;
    executed|none)
      continue
      ;;
  esac
done

# 3. Final status
$CLI run:status "$RUN_ID" --json
```

### Task Execution Pattern

```bash
#!/bin/bash
RUN_ID="$1"

# Get pending tasks
TASKS=$($CLI task:list "$RUN_ID" --pending --json)
COUNT=$(echo "$TASKS" | jq '.tasks | length')

echo "Found $COUNT pending tasks"

# Process each task
echo "$TASKS" | jq -c '.tasks[]' | while read -r task; do
  EFFECT_ID=$(echo "$task" | jq -r '.effectId')
  KIND=$(echo "$task" | jq -r '.kind')

  echo "Processing: $EFFECT_ID ($KIND)"

  # Execute based on kind
  case "$KIND" in
    node)
      # Execute node task...
      node "$(echo "$task" | jq -r '.task.node.entry')"
      ;;
  esac

  # Post result
  echo '{"success": true}' > "tasks/$EFFECT_ID/output.json"
  $CLI task:post "$RUN_ID" "$EFFECT_ID" \
    --status ok \
    --value "tasks/$EFFECT_ID/output.json" \
    --json
done
```

### Breakpoint Integration

```bash
#!/bin/bash
RUN_ID="$1"

# Check for pending breakpoints
TASKS=$($CLI task:list "$RUN_ID" --pending --kind breakpoint --json)

echo "$TASKS" | jq -c '.tasks[]' | while read -r bp; do
  EFFECT_ID=$(echo "$bp" | jq -r '.effectId')

  # Create breakpoint in service
  BP_ID=$(breakpoints breakpoint create \
    --question "$(echo "$bp" | jq -r '.task.breakpoint.question')" \
    --title "$(echo "$bp" | jq -r '.task.breakpoint.title')" \
    --run-id "$RUN_ID" \
    --json | jq -r '.id')

  # Wait for release
  breakpoints breakpoint wait "$BP_ID"

  # Post result
  echo '{"approved": true}' > "tasks/$EFFECT_ID/output.json"
  $CLI task:post "$RUN_ID" "$EFFECT_ID" \
    --status ok \
    --value "tasks/$EFFECT_ID/output.json"
done
```

---

## Quick Reference Card

### Run Commands

```bash
# Create
babysitter run:create --process-id <id> --entry <path>#<export> --json

# Status
babysitter run:status <runId> --json

# Iterate
babysitter run:iterate <runId> --json --iteration <n>

# Events
babysitter run:events <runId> --limit 20 --reverse

# Rebuild state
babysitter run:rebuild-state <runId>
```

### Task Commands

```bash
# List pending
babysitter task:list <runId> --pending --json

# Show details
babysitter task:show <runId> <effectId> --json

# Post result
babysitter task:post <runId> <effectId> --status ok --value <file> --json
```

### Breakpoints Commands (Non-Interactive Mode Only)

```bash
# Start service (not needed for Claude Code interactive mode)
breakpoints start

# Create breakpoint
breakpoints breakpoint create --question "..." --title "..."

# Wait for release
breakpoints breakpoint wait <id>
```

**Note:** If using Claude Code interactively, breakpoints are handled automatically in the chat - no commands needed!

---

## Related Documentation

- [Glossary](./glossary.md) - Term definitions
- [Configuration Reference](./configuration.md) - Environment variables and settings
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

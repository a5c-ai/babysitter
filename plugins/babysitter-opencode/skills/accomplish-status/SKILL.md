---
name: accomplish-status
description: Report babysitter orchestration run status to Accomplish AI desktop app via file-based IPC
command: /accomplish-status
---

# accomplish-status

Report babysitter run status to the [Accomplish AI](https://github.com/accomplish-ai/accomplish) desktop app via file-based IPC.

## Overview

This skill writes run status JSON to a well-known directory. External consumers (such as a future Accomplish daemon integration or other tooling) can watch this directory for changes to track orchestration progress, pending breakpoints, and completion state.

## Status File Location

Status files are written to:

```
<OPENCODE_CONFIG_DIR>/run-status/<runId>.json
```

Where `OPENCODE_CONFIG_DIR` is resolved from the `OPENCODE_CONFIG_DIR` environment variable (typically `~/.config/opencode` or platform equivalent).

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{const fs=require('fs');const probes=['./plugins/babysitter-opencode/versions.json','./node_modules/@a5c-ai/babysitter-opencode/versions.json'];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")
CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

## Instructions

### 1. Resolve the status directory

```bash
STATUS_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/run-status"
mkdir -p "$STATUS_DIR"
```

### 2. Get run status from babysitter

```bash
babysitter run:status .a5c/runs/<runId> --json
```

### 3. Write the status file

Transform the run status output into the Accomplish status format and write it to `$STATUS_DIR/<runId>.json`.

Use the `ACCOMPLISH_TASK_ID` environment variable to correlate the babysitter run with the originating Accomplish task. This variable is set automatically by Accomplish when it spawns the agent session.

```bash
ACCOMPLISH_TASK_ID="${ACCOMPLISH_TASK_ID:-}"
```

### 4. Status file format

Write the following JSON structure to `$STATUS_DIR/<runId>.json`:

```json
{
  "runId": "abc123-def456",
  "processId": "my-process",
  "status": "running",
  "currentPhase": "execute",
  "phases": [
    { "name": "plan", "status": "completed" },
    { "name": "execute", "status": "running" },
    { "name": "verify", "status": "pending" }
  ],
  "pendingEffects": [
    {
      "effectId": "eff-001",
      "kind": "breakpoint",
      "title": "Approve implementation plan"
    }
  ],
  "accomplishTaskId": "accomplish-task-789",
  "lastUpdatedAt": "2026-04-04T12:00:00.000Z"
}
```

#### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `runId` | string | Babysitter run identifier |
| `processId` | string | Process definition identifier |
| `status` | enum | One of: `created`, `running`, `waiting`, `completed`, `failed` |
| `currentPhase` | string | Name of the currently active phase |
| `phases` | array | Ordered list of phases with individual status (`pending`, `running`, `completed`, `failed`) |
| `pendingEffects` | array | Currently pending effects (tasks, breakpoints, sleeps) awaiting resolution |
| `accomplishTaskId` | string | Correlation ID from `ACCOMPLISH_TASK_ID` env var; links this run to the Accomplish UI task |
| `lastUpdatedAt` | string | ISO 8601 timestamp of the last status update |

### 5. When to update

Write or update the status file:

- Immediately after `babysitter run:create` (status: `created`)
- After each `babysitter run:iterate` call (status: `running` or `waiting`)
- When breakpoints are requested (status: `waiting`, include breakpoint in `pendingEffects`)
- After `babysitter task:post` resolves an effect (status: `running`)
- On run completion (status: `completed`)
- On run failure (status: `failed`)

### 6. Cleanup

When a run reaches a terminal state (`completed` or `failed`), the status file may be left in place for external consumers to read the final state. Stale status files can be cleaned up manually or by external tooling.

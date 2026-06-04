# GAP-TOOLS-036: Bash Background Execution

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | S |
| Status | Missing |

## Description
Add background execution support and description param to babysitter's `bash`
agentic tool to match CC's BashTool feature set.

## Current State
Babysitter's `bash` tool spawns a child process synchronously (waits for completion).
Has `env` and `cwd` params that CC lacks. Missing `run_in_background` and `description`.

CC's BashTool params: `command`, `description` (required human-readable task summary),
`timeout`, `run_in_background` (boolean -- runs command in background, returns task ID,
notifies on completion).

## Target State
Add to the `bash` agentic tool:

- **`run_in_background`**: Boolean. When true, spawn the process and return immediately
  with a task/effect ID. Completion notification via journal event or callback. The Pi
  session continues executing while the command runs.
- **`description`**: String. Human-readable description of what the command does. Used
  for logging, embedded SDK dashboard display, and permission prompts.

Background execution requires:
- Tracking background processes by ID
- Collecting stdout/stderr asynchronously
- Delivering completion notification back to the session
- Cleanup on session termination

## Dependencies
- [GAP-TOOLS-030](GAP-TOOLS-030.md) -- effect cancellation (to cancel background commands)

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| CC BashTool | `src/tools/BashTool/BashTool.tsx` |

## Recommendation
Phase 2. Medium priority. Background execution is valuable for long-running builds,
tests, and deployments during orchestration. The `description` param is low-effort
and should be added regardless.

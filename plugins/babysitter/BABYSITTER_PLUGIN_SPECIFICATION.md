# Babysitter Plugin Specification

**Version:** 4.0
**Date:** 2026-01-20
**SDK Version:** 0.0.29+
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Core Components](#3-core-components)
4. [Hook System](#4-hook-system)
5. [CLI Commands](#5-cli-commands)
6. [Skills](#6-skills)
7. [In-Session Loop Mechanism](#7-in-session-loop-mechanism)
8. [File Structure](#8-file-structure)
9. [Workflows](#9-workflows)
10. [API Reference](#10-api-reference)
11. [Integration Patterns](#11-integration-patterns)
12. [Security & Best Practices](#12-security--best-practices)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Overview

### 1.1 What is Babysitter?

Babysitter is an **event-sourced process orchestration system** that enables deterministic, resumable, and git-friendly automation workflows. It combines:

- **SDK (@a5c-ai/babysitter-sdk)** - Event-sourced orchestration runtime
- **CLI** - Command-line interface for run management
- **Hook System** - Extensible lifecycle hooks for custom behavior
- **Skills** - Claude Code skills for interactive orchestration
- **In-Session Loops** - Continuous iteration within a single session
- **Breakpoints** - Human-in-the-loop approval system
- **Plugin** - Claude Code integration package

### 1.2 Key Principles

**Event-Sourced**
- All state changes recorded as immutable events in `journal/`
- State can be reconstructed by replaying journal
- Enables time-travel debugging and audit trails

**Hook-Driven (Version 4.0)**
- Hooks execute tasks directly (not just return decisions)
- CLI provides single-iteration orchestration (`run:iterate`)
- Skills/agents provide external loop
- SDK never runs tasks automatically

**Git-Friendly**
- Append-only journal (one event per file)
- Human-readable JSON and markdown
- Deterministic naming for merge-friendly diffs
- State cache is gitignored (derived from journal)

**Deterministic Replay**
- Processes re-run from the top
- Intrinsics short-circuit using journal
- Same inputs + journal = same execution path

### 1.3 Design Philosophy

> **Hooks execute, skill loops, SDK never runs tasks automatically.**

This pure hook execution architecture ensures:
- Complete customizability via hooks
- Clear separation of concerns
- No hidden orchestration logic in SDK
- Full control over task execution flow

---

## 2. Architecture

### 2.1 System Architecture

Babysitter supports two primary interaction modes:

**Mode A: Skill-Based Orchestration** (External loop driven by skill/agent)

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code / Agent                       │
│                     (External Loop)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Calls babysitter skill
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   Babysitter Skill                           │
│         (Loops run:iterate until completion)                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Calls CLI
                 │
┌────────────────▼────────────────────────────────────────────┐
│              @a5c-ai/babysitter-sdk CLI                      │
│  (run:create, run:iterate, run:status, task:post, etc.)      │
└───┬──────────────────────────────────────────────────────┬──┘
    │                                                      │
    │ Calls hooks                                          │ Updates
    │                                                      │
┌───▼────────────────┐                            ┌────────▼──────┐
│   Hook System      │                            │  Run Directory│
│  (on-iteration-    │                            │  (.a5c/runs/  │
│   start executes   │◄───────────────────────────┤   <runId>/)   │
│   tasks directly)  │    Reads journal/state     │               │
└────────────────────┘                            └───────────────┘
```

**Mode B: In-Session Loop** (Internal loop via stop hook)

```
┌──────────────────────────────────────────────────────────────┐
│  User: /babysitter:babysit <PROMPT> --max-iterations <n>        │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│         setup-babysitter-run.sh                              │
│  • Creates state file with prompt + iteration counter        │
│  • State location: $CLAUDE_PLUGIN_ROOT/state/${SESSION_ID}.md│
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│         Claude Works on Task                                 │
│  • Uses all available tools (Bash, Edit, Write, etc.)       │
│  • Makes changes to codebase                                 │
│  • Runs tests, builds, etc.                                  │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ Claude tries to exit
                      ▼
┌──────────────────────────────────────────────────────────────┐
│         babysitter-stop-hook.sh (Claude Code Hook)           │
│  1. Load state file for session                              │
│  2. Check max iterations reached?                            │
│  3. Parse transcript for completion promise?                 │
│  4. If not complete:                                         │
│     - Increment iteration counter                            │
│     - Block exit via JSON response                           │
│     - Feed prompt back to Claude                             │
│  5. If complete:                                             │
│     - Delete state file                                      │
│     - Allow exit (exit 0)                                    │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ Loop continues
                      ▼
              Claude sees prompt again
              (Iteration N + 1)
```

**Mode Comparison:**

| Aspect | Skill-Based | In-Session Loop |
|--------|-------------|-----------------|
| **Loop Control** | Skill/Agent | Stop Hook |
| **Exit Control** | Skill decides | Hook intercepts exit |
| **Use Case** | Complex orchestration | Iterative refinement |
| **CLI Interaction** | Explicit `run:iterate` | Optional (ad-hoc work) |
| **State Storage** | `.a5c/runs/` | `$CLAUDE_PLUGIN_ROOT/state/` |
| **Iteration Limit** | Skill logic | `--max-iterations` flag |

### 2.2 Data Flow

**Single Iteration Flow:**

1. **Agent/Skill** calls `run:iterate <runId> --json`
2. **CLI** loads journal and reconstructs state
3. **CLI** calls `on-iteration-start` hook with iteration payload
4. **Hook** examines pending effects and executes tasks:
   - Executes the effect externally (hook/worker/agent)
   - Calls `task:post <runId> <effectId> --status <ok|error>` to commit into journal/state
5. **Hook** returns execution results as JSON
6. **CLI** calls `on-iteration-end` hook for finalization
7. **CLI** returns iteration result to agent/skill:
   - `status: "executed"` - Continue looping
   - `status: "waiting"` - Breakpoint or sleep (pause)
   - `status: "completed"` - Run finished successfully
   - `status: "failed"` - Run failed with error
8. **Agent/Skill** decides whether to continue or stop

### 2.3 Component Interaction

```
Agent → Skill → CLI → Hooks → Tasks → Journal → State
  ↑                                               |
  └───────────────────────────────────────────────┘
           Read state, make decisions
```

---

## 3. Core Components

### 3.1 SDK (@a5c-ai/babysitter-sdk)

**Purpose:** Event-sourced orchestration runtime

**Key Modules:**
- `runtime/` - Process execution engine
- `storage/` - Journal and state management
- `tasks/` - Task definition and execution
- `cli/` - Command-line interface

**Version:** 0.0.29+

**Installation:**
```bash
npm install -g @a5c-ai/babysitter-sdk
# or
npx -y @a5c-ai/babysitter-sdk
```

**Core Intrinsics:**
- `ctx.task(taskDef, inputs)` - Execute a task
- `ctx.breakpoint(payload)` - Request human approval
- `ctx.sleepUntil(timestamp)` - Time gate
- `ctx.parallel.*` - Batch operations
- `ctx.hook(hookName, payload)` - Call custom hooks

### 3.2 CLI

**Purpose:** Command-line interface for run management

**Binary Names:**
- `babysitter`
- `babysitter-sdk`

**Command Categories:**

**Run Management:**
- `run:create` - Create new run
- `run:status` - Check run status
- `run:events` - View journal events
- `run:iterate` - Single iteration orchestration (NEW in v4.0)

**Task Operations:**
- `task:list` - List tasks
- `task:show` - Show task details
- `task:post` - Commit/post a task result

**Utility:**
- `--version` - Show version
- `--help` - Show help

**Global Flags:**
- `--runs-dir <path>` - Override runs directory
- `--json` - Output JSON format
- `--verbose` - Verbose logging

### 3.3 Hook System

**Purpose:** Extensible lifecycle hooks for custom behavior

**Hook Discovery Priority:**
1. Per-repo hooks (`.a5c/hooks/<hook-name>/*.sh`)
2. Per-user hooks (`~/.config/babysitter/hooks/<hook-name>/*.sh`)
3. Plugin hooks (`plugins/babysitter/hooks/<hook-name>/*.sh`)

**Hook Types:**

**SDK Lifecycle Hooks (Automatic):**
- `on-run-start` - When run is created
- `on-run-complete` - When run completes successfully
- `on-run-fail` - When run fails
- `on-iteration-start` - **Core orchestration hook** (executes tasks)
- `on-iteration-end` - After iteration completes
- `on-task-start` - Before task execution
- `on-task-complete` - After task execution
- `on-step-dispatch` - Before process step

**Process-Level Hooks (Manual):**
- `pre-commit` - Before git commit
- `pre-branch` - Before creating branch
- `post-planning` - After planning phase
- `on-score` - Quality gates/scoring
- `on-breakpoint` - Breakpoint notifications

**Hook Input/Output:**
- Input: JSON payload via stdin
- Output: JSON result via stdout
- Stderr: For logging (not captured in result)

### 3.4 Skills

**Purpose:** Claude Code skills for interactive orchestration

**Available Skills:**

**babysitter:**
- Main orchestration skill
- Loops `run:iterate` until completion
- Handles run lifecycle
- Location: `plugins/babysitter/skills/babysit/`

**babysitter-breakpoint:**
- **DEPRECATED** (integrated into main skill)
- Use main skill for all breakpoint handling

### 3.5 Commands

**Purpose:** In-session Claude Code commands

**Available Commands:**

**/babysitter:babysit**
- Start babysitter run in current session
- Uses stop hook to prevent exit
- Loops until completion promise or max iterations
- Location: `plugins/babysit/SKILL.md`

**/babysitter:babysit resume**
- Resume existing babysitter run
- Checks run status via CLI
- Continues from current state
- Location: `plugins/babysit/SKILL.md`

### 3.6 Breakpoints Package

**Purpose:** Human-in-the-loop approval system

**Components:**
- API server (port 3185)
- Web UI (port 3184)
- Worker for job processing
- Extensions (Telegram, etc.)

**Location:** `packages/breakpoints/`

**Features:**
- Create breakpoints with context files
- Web UI for approval
- Telegram integration for mobile notifications
- Extensible via custom extensions

---

## 4. Hook System

### 4.1 Hook Execution Model (Version 4.0)

**Key Change:** Hooks now **execute tasks directly** instead of returning effect definitions, and then **post results** via `task:post`.

**Before (Version 3.0):**
```bash
# Hook returns effect definition
{
  "effects": [
    {"effectId": "task-123", "kind": "node"}
  ]
}
# Skill executes tasks
```

**After (Version 4.0):**
```bash
# Hook executes tasks directly
# ...execute "$EFFECT_ID" externally, then post the result:
"${CLI[@]}" task:post "$RUN_ID" "$EFFECT_ID" --status ok --json

# Hook returns execution results
{
  "action": "executed-tasks",
  "count": 3,
  "reason": "auto-runnable-tasks"
}
```

### 4.2 Hook Dispatcher

**Location:** `plugins/babysitter/hooks/hook-dispatcher.sh`

**Responsibilities:**
- Discover hooks in priority order
- Execute hooks with payload via stdin
- Collect stdout (JSON results only)
- Keep stderr separate for logging
- Return aggregated results

**Discovery Order:**
1. `.a5c/hooks/<hook-name>/` (per-repo)
2. `~/.config/babysitter/hooks/<hook-name>/` (per-user)
3. `plugins/babysitter/hooks/<hook-name>/` (plugin)

**Critical Fix (v4.0):**
- Removed `2>&1` to keep stderr separate from stdout
- Prevents logging from breaking JSON parsing

### 4.3 Core Orchestration Hook

**Hook:** `on-iteration-start`

**Implementation:** `plugins/babysitter/hooks/on-iteration-start/native-orchestrator.sh`

**Responsibilities:**
1. Load run status via `run:status --json`
2. Check terminal states (completed, failed)
3. List pending tasks via `task:list --pending --json`
4. Filter auto-runnable tasks (kind="node")
5. **Execute tasks directly**, then **commit** via `task:post`
6. Return execution results

**Output Format:**

**Executed tasks:**
```json
{
  "action": "executed-tasks",
  "count": 3,
  "reason": "auto-runnable-tasks"
}
```

**Waiting (breakpoint/sleep):**
```json
{
  "action": "waiting",
  "reason": "breakpoint-waiting",
  "count": 1
}
```

**Terminal state:**
```json
{
  "action": "none",
  "reason": "terminal-state",
  "status": "completed"
}
```

### 4.4 Hook Payload Schemas

**on-iteration-start:**
```json
{
  "runId": "run-20260120-example",
  "runDir": ".a5c/runs/run-20260120-example",
  "iteration": 1,
  "metadata": {
    "processId": "dev/build",
    "stateVersion": 42
  }
}
```

**on-task-start:**
```json
{
  "runId": "run-20260120-example",
  "effectId": "effect-abc123",
  "taskId": "task/build",
  "kind": "node",
  "label": "auto"
}
```

**on-breakpoint:**
```json
{
  "runId": "run-20260120-example",
  "breakpointId": "bp-xyz789",
  "question": "Approve the plan?",
  "context": {
    "files": [
      {"path": "artifacts/plan.md", "format": "markdown"}
    ]
  }
}
```

### 4.5 Custom Hook Development

**Example: Slack Notification Hook**

**Location:** `.a5c/hooks/on-run-complete/notify-slack.sh`

```bash
#!/bin/bash
set -euo pipefail

# Read payload from stdin
PAYLOAD=$(cat)

RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
STATUS=$(echo "$PAYLOAD" | jq -r '.status')

# Send notification
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Run $RUN_ID completed with status: $STATUS\"}"

# Return success
echo '{"ok": true}'
```

**Make executable:**
```bash
chmod +x .a5c/hooks/on-run-complete/notify-slack.sh
```

---

## 5. CLI Commands

### 5.1 run:create

**Purpose:** Create a new run

**Syntax:**
```bash
babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <path> \
  --run-id <id>
```

**Example:**
```bash
babysitter run:create \
  --process-id dev/build \
  --entry .a5c/processes/dev/build.js#buildProcess \
  --inputs examples/inputs/build.json \
  --run-id "run-$(date -u +%Y%m%d-%H%M%S)-dev-build"
```

**Output:**
```json
{
  "runId": "run-20260120-101530-dev-build",
  "runDir": ".a5c/runs/run-20260120-101530-dev-build"
}
```

### 5.2 run:iterate

**Purpose:** Execute single orchestration iteration

**Syntax:**
```bash
babysitter run:iterate <runId> [--json] [--iteration <n>]
```

**Example:**
```bash
babysitter run:iterate run-20260120-example --json --iteration 1
```

**Output:**
```json
{
  "iteration": 1,
  "status": "executed",
  "action": "executed-tasks",
  "reason": "auto-runnable-tasks",
  "count": 3,
  "metadata": {
    "runId": "run-20260120-example",
    "processId": "dev/build",
    "hookStatus": "executed"
  }
}
```

**Status Values:**
- `"executed"` - Tasks executed, continue looping
- `"waiting"` - Breakpoint or sleep, pause orchestration
- `"completed"` - Run finished successfully, exit loop
- `"failed"` - Run failed with error, exit loop
- `"none"` - No action taken (no pending effects)

### 5.3 run:status

**Purpose:** Check run status

**Syntax:**
```bash
babysitter run:status <runId> [--json]
```

**Example:**
```bash
babysitter run:status run-20260120-example --json
```

**Output:**
```json
{
  "runId": "run-20260120-example",
  "state": "running",
  "metadata": {
    "processId": "dev/build",
    "stateVersion": 42,
    "pendingEffectsByKind": {
      "node": 2,
      "breakpoint": 1
    }
  }
}
```

### 5.4 run:events

**Purpose:** View journal events

**Syntax:**
```bash
babysitter run:events <runId> [--limit <n>] [--reverse] [--json]
```

**Example:**
```bash
# Show last 20 events
babysitter run:events run-20260120-example --limit 20 --reverse
```

### 5.5 task:list

**Purpose:** List tasks

**Syntax:**
```bash
babysitter task:list <runId> [--pending] [--json]
```

**Example:**
```bash
babysitter task:list run-20260120-example --pending --json
```

**Output:**
```json
{
  "tasks": [
    {
      "effectId": "effect-abc123",
      "kind": "node",
      "label": "auto",
      "status": "requested"
    }
  ]
}
```

### 5.6 task:post

**Purpose:** Post/commit a task result after it was executed externally

**Syntax:**
```bash
babysitter task:post <runId> <effectId> --status <ok|error> [--value <file>] [--error <file>] [--stdout-ref <ref>] [--stderr-ref <ref>] [--stdout-file <file>] [--stderr-file <file>] [--started-at <iso8601>] [--finished-at <iso8601>] [--metadata <file>] [--invocation-key <key>] [--dry-run] [--json]
```

**Example:**
```bash
babysitter task:post run-20260120-example effect-abc123 --status ok --json
```

**Output:**
```json
{
  "status": "ok|error",
  "committed": {
    "resultRef": "tasks/effect-abc123/result.json",
    "stdoutRef": "tasks/effect-abc123/stdout.log",
    "stderrRef": "tasks/effect-abc123/stderr.log"
  },
  "stdoutRef": "tasks/effect-abc123/stdout.log",
  "stderrRef": "tasks/effect-abc123/stderr.log",
  "resultRef": "tasks/effect-abc123/result.json"
}
```

---

## 6. Skills

### 6.1 Babysitter Skill

**Location:** `plugins/babysitter/skills/babysit/SKILL.md`

**Purpose:** Main orchestration skill for managing runs

**Key Responsibilities:**
1. Verify CLI availability and version
2. Create or resume runs
3. Loop `run:iterate` until completion
4. Handle breakpoints via hook system
5. Manage run lifecycle
6. Provide quality gates and verification

**Architecture Overview:**

```
┌─────────────────────────────────────────┐
│         Babysitter Skill                │
│   (External orchestration loop)         │
└───────────────┬─────────────────────────┘
                │
        while not terminal:
                │
                ▼
┌───────────────────────────────────────────┐
│  run:iterate --json                       │
│  • Hook executes tasks                    │
│  • Returns: status, action, count         │
└───────────────┬───────────────────────────┘
                │
        ┌───────┴──────┐
        │              │
   "executed"     "waiting/completed/failed"
        │              │
    continue        break loop
        │
        └──────────────┘
```

**Usage:**

**Via skill invocation:**
```
User: "Orchestrate run-20260120-example"
Claude: [Invokes babysitter skill automatically]
```

**Via CLI alias:**
```bash
CLI="npx -y @a5c-ai/babysitter-sdk"
```

**Skill Instructions:** See `plugins/babysitter/skills/babysit/SKILL.md` for complete instructions.

### 6.2 Workflow Modes

**Mode A: Resume Existing Run**
1. Inspect run via `run:status` and `run:events`
2. Continue from current state via `run:iterate`
3. Loop until terminal state

**Mode B: Create New Run**
1. Explore codebase to understand task
2. Create `main.js` and `process.md` with implementation plan
3. Request approval via breakpoint
4. Initialize run via `run:create`
5. Drive execution via `run:iterate`

**Quality Gates:**
- CLI version check before every session
- Output verification against SDK/CLI references
- State version checks after each iteration
- Metadata field validation

---

## 7. In-Session Loop Mechanism

### 7.1 Overview

The in-session loop mechanism enables Claude to work continuously on a task within a single session through a self-referential loop. Instead of Claude finishing and exiting, the system intercepts exit attempts and feeds the same prompt back, creating an iterative improvement cycle.

**Key Components:**
- `/babysitter:babysit` skill and slash command
- `setup-babysitter-run.sh` - Creates loop state
- `babysitter-session-start-hook.sh` - Persists session ID
- `babysitter-stop-hook.sh` - Intercepts exit and continues loop
- State file with YAML frontmatter

**Purpose:**
- Iterative refinement and self-improvement
- Seeing incremental progress
- Learning and experimentation
- Tasks requiring multiple iterations

**See:** `IN_SESSION_LOOP_MECHANISM.md` for complete technical documentation.

### 7.2 Slash Commands

#### /babysitter:babysit

**Purpose:** Start a new in-session loop

**Syntax:**
```bash
/babysitter:babysit <PROMPT> [--max-iterations <n>] [--run-id <id>]
```

**Examples:**
```bash
/babysitter:babysit Build a REST API --max-iterations 20
/babysitter:babysit Fix the auth bug --max-iterations 10
/babysitter:babysit Improve code quality  # Runs forever
```

**Arguments:**
- `PROMPT` - Task description (multiple words, no quotes needed)
- `--max-iterations <n>` - Maximum iterations (0 = unlimited, default)
- `--run-id <id>` - Optional run ID to store in state (if already known)
- `--help` - Show help message

**Behind the Scenes:**
1. Executes `setup-babysitter-run.sh` with arguments
2. Creates state file in `$CLAUDE_PLUGIN_ROOT/state/${SESSION_ID}.md`
3. State file contains iteration counter, limits, and prompt
4. Stop hook becomes active for the session

#### /babysitter:babysit resume

**Purpose:** Resume existing run in in-session mode

**Syntax:**
```bash
/babysitter:babysit resume <run-id> [--max-iterations <n>]
```

**Example:**
```bash
/babysitter:babysit resume run-20260120-example --max-iterations 15
```

**Differences from /babysitter:babysit **
- Takes run ID instead of prompt
- Validates run exists via `run:status`
- Prevents resuming completed runs
- Creates prompt from run metadata

### 7.3 Loop Flow

```
┌────────────────────────────────────────┐
│  User: /babysitter:babysit Build API      │
│         --max-iterations 20            │
│         (completion secret emitted     │
│          only when run completes)      │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│  setup-babysitter-run.sh               │
│  Creates state file:                   │
│  ---                                   │
│  iteration: 1                          │
│  max_iterations: 20                    │
│  run_id: "<run-id>"                    │
│  ---                                   │
│  Build API                             │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│  Claude works on task                  │
│  - Iteration 1: Creates structure      │
│  - Makes changes to files              │
│  - Runs tests                          │
└─────────────────┬──────────────────────┘
                  │
                  │ Claude tries to exit
                  ▼
┌────────────────────────────────────────┐
│  babysitter-stop-hook.sh               │
│  1. Load state file                    │
│  2. Check iteration: 1 < 20 ✓          │
│  3. Check promise in output: NO        │
│  4. Increment iteration: 2             │
│  5. Block exit, feed prompt back       │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│  Claude sees prompt again              │
│  System: "🔄 Babysitter iteration 2"   │
│  Prompt: "Build API"                   │
│  - Iteration 2: Adds features          │
│  - Sees previous work in files         │
│  - Can refine and improve              │
└─────────────────┬──────────────────────┘
                  │
                  │ Loop continues...
                  │
          ┌───────┴────────┐
          │                │
    Max iterations    Completion promise
      reached?          detected?
          │                │
          ▼                ▼
      Exit loop        Exit loop
```

### 7.4 State File Format

**Location:** `$CLAUDE_PLUGIN_ROOT/state/${CLAUDE_SESSION_ID}.md`

**Format:** Markdown with YAML frontmatter

**Example:**
```yaml
---
active: true
iteration: 3
max_iterations: 20
run_id: "<run-id>"
started_at: "2026-01-20T10:15:30Z"
---

Build a REST API for managing todos with the following features:
- Create, read, update, delete todos
- User authentication
- Database persistence
```

**Fields:**
- `active` - Always true when file exists
- `iteration` - Current iteration number (starts at 1)
- `max_iterations` - Maximum iterations (0 = unlimited)
- `run_id` - Run ID associated with this loop (may be empty until set)
- `started_at` - ISO 8601 timestamp
- `run_id` - Optional (for resume mode)

### 7.5 Stop Hook Mechanism

**Trigger:** When Claude tries to exit the session

**Input:**
```json
{
  "session_id": "abc-xyz-123",
  "transcript_path": "/path/to/transcript.jsonl"
}
```

**Process:**
1. **Load state file** for session
2. **Validate** iteration and max_iterations are numbers
3. **Check max iterations:** If `iteration >= max_iterations`, allow exit
4. **Read transcript** to get last assistant message
5. **Check completion promise:** If `<promise>TEXT</promise>` matches, allow exit
6. **Not complete:** Increment iteration, block exit, feed prompt back

**Output (Block Exit):**
```json
{
  "decision": "block",
  "reason": "<original-prompt>",
  "systemMessage": "🔄 Babysitter iteration N | To stop: output <promise>TEXT</promise> (ONLY when TRUE!)"
}
```

**Output (Allow Exit):**
```bash
exit 0  # No JSON needed
```

### 7.6 Completion Detection

**Method 1: Completion Promise**

Claude outputs:
```xml
<promise>DONE</promise>
```

Requirements:
- Exact tag format: `<promise>` and `</promise>`
- Promise text must match exactly (case-sensitive)
- Promise statement must be TRUE

**Method 2: Max Iterations**

Loop automatically exits when:
```bash
iteration >= max_iterations
```

Output:
```
🛑 Babysitter run: Max iterations (20) reached.
```

### 7.7 Session Isolation

**Mechanism:**
- Each session has unique `CLAUDE_SESSION_ID`
- State file named: `${SESSION_ID}.md`
- No cross-session interference

**Benefits:**
- Multiple Claude Code windows run independently
- Clean separation between sessions
- No state leakage

### 7.8 Hook Wiring

**Registration:** `plugins/babysitter/hooks/hooks.json`

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

**SessionStart Hook:**
- Runs when session starts
- Extracts `session_id` from input
- Persists as `CLAUDE_SESSION_ID` environment variable
- Makes session ID available to setup scripts

**Stop Hook:**
- Runs when Claude tries to exit
- Checks for active babysitter loop
- Decides whether to allow or block exit
- Feeds prompt back if loop should continue

### 7.9 Example Usage

**Simple Task:**
```bash
/babysitter:babysit Fix authentication bug --max-iterations 10
```

Result: Claude iterates up to 10 times, refining the fix each iteration.

**Task with Promise:**
```bash
/babysitter:babysit Build REST API --max-iterations 50
```

Result: Claude works until all tests pass (or 50 iterations), outputs `<promise>All tests passing</promise>` to exit.

**Infinite Loop (Caution!):**
```bash
/babysitter:babysit Improve code quality
```

Result: Runs forever, continuously refining. No automatic exit.

⚠️ **Warning:** Without `--max-iterations`, the loop runs infinitely until the run completes!

### 7.10 Technical Documentation

For complete technical details including:
- Algorithm flowcharts
- Error handling
- Security considerations
- State file parsing
- Transcript extraction
- Atomic updates

See: **`IN_SESSION_LOOP_MECHANISM.md`**

---

## 8. File Structure

### 8.1 Plugin Structure

```
plugins/babysitter/
├── skills/
│   └── babysit/
│       ├── SKILL.md                 # Main skill instructions
│       ├── scripts/
│       │   ├── setup-babysitter-run.sh     # /babysitter:babysit setup
│       │   └── setup-babysitter-run-resume.sh  # /babysitter:babysit resume setup
│       └── reference/
│           ├── HOOKS.md            # Hook system documentation
│           ├── ORCHESTRATION_GUIDE.md
│           └── ADVANCED_PATTERNS.md
├── hooks/
│   ├── hooks.json                 # Hook registration (SessionStart, Stop)
│   ├── hook-dispatcher.sh         # Hook discovery & execution
│   ├── on-breakpoint-dispatcher.sh
│   ├── babysitter-stop-hook.sh    # Stop hook for in-session loops
│   ├── babysitter-session-start-hook.sh  # Persists CLAUDE_SESSION_ID
│   ├── on-iteration-start/
│   │   ├── native-orchestrator.sh  # Core orchestration hook
│   │   └── logger.sh
│   ├── on-iteration-end/
│   │   ├── native-finalization.sh
│   │   └── logger.sh
│   ├── on-run-start/
│   ├── on-run-complete/
│   ├── on-run-fail/
│   ├── on-task-start/
│   ├── on-task-complete/
│   ├── on-breakpoint/
│   ├── pre-commit/
│   ├── pre-branch/
│   ├── post-planning/
│   └── on-score/
├── state/                          # In-session loop state (created at runtime)
│   └── ${SESSION_ID}.md           # State file per session
├── agents/
│   └── babysitter.md               # Agent configuration
└── *.md                            # Documentation
    ├── BABYSITTER_PLUGIN_SPECIFICATION.md  # This file
    ├── IN_SESSION_LOOP_MECHANISM.md        # In-session loop technical docs
    └── HOOKS.md                            # Hook development guide
```

### 8.2 Run Directory Structure

```
.a5c/runs/<runId>/
├── run.json                        # Run metadata
├── inputs.json                     # Initial inputs
├── code/
│   └── main.js                    # Process implementation
├── artifacts/
│   ├── process.md                 # Process description
│   └── *.md                       # Other artifacts
├── journal/
│   ├── 000001.<ulid>.json        # Event 1
│   ├── 000002.<ulid>.json        # Event 2
│   └── ...                        # Append-only events
├── state/
│   └── state.json                 # Derived state (gitignored)
└── tasks/
    └── <effectId>/
        ├── task.json              # Task definition
        ├── inputs.json            # Task inputs
        ├── result.json            # Task result
        ├── stdout.log             # Task stdout
        └── stderr.log             # Task stderr
```

### 8.3 Journal Event Structure

**Event File Naming:**
```
<sequence>.<ulid>.json
```

**Example:** `000042.01HJKMNPQR3STUVWXYZ012345.json`

**Event Schema:**
```json
{
  "seq": 42,
  "timestamp": "2026-01-20T10:15:30.123Z",
  "type": "task:requested",
  "effectId": "effect-abc123",
  "invocationKey": "task/build:1",
  "taskId": "task/build",
  "payload": {
    "kind": "node",
    "node": {
      "entry": "./scripts/build.js"
    }
  }
}
```

### 8.4 State Cache Structure

**File:** `.a5c/runs/<runId>/state/state.json`

**Purpose:** Derived state index (gitignored, rebuildable from journal)

**Schema:**
```json
{
  "runId": "run-20260120-example",
  "status": "running",
  "version": 42,
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
      "status": "requested"
    }
  ]
}
```

---

## 9. Workflows

### 9.1 Basic Orchestration Loop

**External Loop (Skill/Agent):**

```bash
CLI="npx -y @a5c-ai/babysitter-sdk"
ITERATION=0

while true; do
  ((ITERATION++))

  # Call run:iterate - hook executes tasks internally
  RESULT=$($CLI run:iterate "$RUN_ID" --json --iteration $ITERATION)

  STATUS=$(echo "$RESULT" | jq -r '.status')

  # Check terminal states
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo "Run $STATUS"
    break
  elif [ "$STATUS" = "waiting" ]; then
    echo "Run waiting (breakpoint or sleep)"
    break
  fi

  # Status "executed" or "none" - continue looping
done
```

### 9.2 In-Session Loop (Commands)

**Using /babysitter:babysit command (in-session loop):**

1. User sends `/babysitter:babysit Build a REST API`
2. `setup-babysitter-run.sh` creates state file
3. `babysitter-session-start-hook.sh` sets CLAUDE_SESSION_ID
4. User works on task interactively
5. When user tries to exit:
   - `babysitter-stop-hook.sh` intercepts exit
   - Hook checks completion conditions
   - If not complete, feeds prompt back
   - Loop continues
6. Loop exits when:
   - Max iterations reached
   - Completion promise detected in output

**State File Format:**
```yaml
---
active: true
iteration: 1
max_iterations: 20
run_id: "<run-id>"
started_at: "2026-01-20T10:15:30Z"
---

Build a REST API
```

### 9.3 Breakpoint Workflow

**Process File:**
```javascript
export async function myProcess(inputs, ctx) {
  // Generate plan
  const plan = await generatePlan(inputs);
  await ctx.task(writePlan, { content: plan });

  // Request approval via breakpoint
  await ctx.breakpoint({
    question: "Approve the plan?",
    context: {
      files: [
        { path: "artifacts/plan.md", format: "markdown" }
      ]
    }
  });

  // Continue after approval
  await ctx.task(implementPlan, { plan });
}
```

**Hook Flow:**
1. Process calls `ctx.breakpoint()`
2. SDK creates breakpoint effect
3. `on-iteration-start` hook detects breakpoint (kind="breakpoint")
4. Hook calls `on-breakpoint-dispatcher.sh`
5. Dispatcher executes hooks (e.g., `breakpoint-cli.sh`, Telegram notification)
6. Breakpoint CLI or web UI presents question to user
7. User approves or rejects
8. Feedback recorded in breakpoint system
9. Next iteration detects released breakpoint
10. Process resumes from after `ctx.breakpoint()`

### 9.4 Parallel Execution

**Process File:**
```javascript
export async function myProcess(inputs, ctx) {
  // Execute tasks in parallel
  const [buildResult, lintResult, testResult] = await ctx.parallel.all([
    () => ctx.task(buildTask, { target: "app" }),
    () => ctx.task(lintTask, { files: "src/**/*.ts" }),
    () => ctx.task(testTask, { suite: "smoke" }),
  ]);

  return { build: buildResult, lint: lintResult, test: testResult };
}
```

**Execution:**
1. Process encounters `ctx.parallel.all()`
2. SDK throws `ParallelBatch` exception with all task requests
3. Orchestrator processes batch
4. On next iteration, all results available
5. Process continues with all results

---

## 10. API Reference

### 10.1 Process Context (ctx)

**Core Methods:**

**ctx.task(taskDef, inputs)**
- Execute a task
- Returns: Task result (or throws if not yet executed)

**ctx.breakpoint(payload)**
- Request human approval
- Returns: Feedback object

**ctx.sleepUntil(timestamp)**
- Sleep until specified time
- Returns: void

**ctx.hook(hookName, payload)**
- Call custom hook
- Returns: Hook execution results

**ctx.parallel.all(tasks)**
- Execute tasks in parallel
- Returns: Array of results

**ctx.log(message)**
- Log message
- Recorded in journal

**ctx.now()**
- Get current timestamp (deterministic)
- Returns: Date object

### 10.2 Task Definition

**Node Task:**
```javascript
const buildTask = {
  kind: "node",
  node: {
    entry: "./scripts/build.js"
  }
};
```

**Task with Timeout:**
```javascript
const testTask = {
  kind: "node",
  node: {
    entry: "./scripts/test.js",
    timeout: 300000  // 5 minutes
  }
};
```

**Task with Environment:**
```javascript
const deployTask = {
  kind: "node",
  node: {
    entry: "./scripts/deploy.js",
    env: {
      DEPLOY_ENV: "production"
    }
  }
};
```

### 10.3 Breakpoint Payload

**Basic Breakpoint:**
```javascript
await ctx.breakpoint({
  question: "Approve the changes?",
  title: "Review Required"
});
```

**Breakpoint with Context Files:**
```javascript
await ctx.breakpoint({
  question: "Approve the implementation plan?",
  title: "Plan Approval",
  context: {
    runId: "run-20260120-example",
    files: [
      { path: "artifacts/plan.md", format: "markdown" },
      { path: "code/main.js", format: "code", language: "javascript" },
      { path: "inputs.json", format: "code", language: "json" }
    ]
  }
});
```

### 10.4 Hook Result Format

**Success:**
```json
{
  "ok": true,
  "action": "executed-tasks",
  "count": 3,
  "metadata": {
    "hookName": "native-orchestrator",
    "executionTime": 1234
  }
}
```

**Waiting:**
```json
{
  "ok": true,
  "action": "waiting",
  "reason": "breakpoint-waiting",
  "count": 1
}
```

**Error:**
```json
{
  "ok": false,
  "error": "Failed to execute task",
  "details": {
    "effectId": "effect-abc123",
    "exitCode": 1
  }
}
```

---

## 11. Integration Patterns

### 11.1 CI/CD Integration

**GitHub Actions Example:**

```yaml
name: Babysitter Orchestration

on:
  push:
    branches: [main]

jobs:
  orchestrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Babysitter SDK
        run: npm install -g @a5c-ai/babysitter-sdk

      - name: Create Run
        run: |
          babysitter run:create \
            --process-id ci/build-and-test \
            --entry .a5c/processes/ci/main.js#ciProcess \
            --inputs ci-inputs.json \
            --run-id "run-${{ github.run_id }}"

      - name: Orchestrate
        run: |
          RUN_ID="run-${{ github.run_id }}"
          ITERATION=0

          while true; do
            ((ITERATION++))

            RESULT=$(babysitter run:iterate "$RUN_ID" --json --iteration $ITERATION)
            STATUS=$(echo "$RESULT" | jq -r '.status')

            echo "Iteration $ITERATION: $STATUS"

            if [ "$STATUS" = "completed" ]; then
              exit 0
            elif [ "$STATUS" = "failed" ]; then
              exit 1
            elif [ "$STATUS" = "waiting" ]; then
              echo "Breakpoint detected, cannot auto-approve in CI"
              exit 1
            fi
          done
```

### 11.2 Custom Hook Integration

**Example: Metrics Collection Hook**

**Location:** `.a5c/hooks/on-task-complete/collect-metrics.sh`

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)

EFFECT_ID=$(echo "$PAYLOAD" | jq -r '.effectId')
TASK_ID=$(echo "$PAYLOAD" | jq -r '.taskId')
EXIT_CODE=$(echo "$PAYLOAD" | jq -r '.exitCode // 0')
DURATION=$(echo "$PAYLOAD" | jq -r '.durationMs // 0')

# Send metrics to monitoring system
curl -X POST "$METRICS_ENDPOINT/task-completed" \
  -H "Content-Type: application/json" \
  -d "{
    \"effectId\": \"$EFFECT_ID\",
    \"taskId\": \"$TASK_ID\",
    \"exitCode\": $EXIT_CODE,
    \"duration\": $DURATION,
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }"

echo '{"ok": true}'
```

### 11.3 Telegram Integration

**Setup:**
```bash
# In breakpoints package
cd packages/breakpoints

# Enable Telegram extension
npm run cli extension enable telegram \
  --token <bot-token> \
  --username <your-username>

# Start worker
npm run start:worker
```

**Usage:**
1. Send `/start` to bot
2. Bot shows waiting breakpoints
3. Commands:
   - `list` - Show all waiting
   - `preview 1` - View details
   - `file 1` - Download context file
   - Reply or send text to release

**See:** `packages/breakpoints/README.md` for full Telegram documentation

---

## 12. Security & Best Practices

### 12.1 Security Considerations

**Session Isolation:**
- In-session loops use `CLAUDE_SESSION_ID` for state isolation
- Each session has isolated state file
- Prevents cross-session interference

**Completion Promise Security:**
- Uses exact string matching (not pattern matching)
- Prevents glob pattern exploitation
- Requires `<promise>` XML tags
- No wildcards or regex in promise matching

**Input Validation:**
- Numeric fields validated before arithmetic
- State file corruption detected gracefully
- Run ID validation (must exist)
- JSON parsing errors handled

**Hook Execution:**
- Hooks run with repository permissions
- No privilege escalation
- Stderr separate from stdout (prevents injection)
- Hooks must be executable (`chmod +x`)

### 12.2 Best Practices

**Run Management:**
- Use descriptive run IDs with timestamps
- Include process ID and task name in run ID
- Store artifacts in `artifacts/` directory
- Keep `code/main.js` under version control

**Hook Development:**
- Always return JSON via stdout
- Use stderr for logging only
- Handle errors gracefully
- Document hook purpose and payload
- Test hooks in isolation

**Process Development:**
- Keep processes deterministic
- Use `ctx.now()` instead of `Date.now()`
- Request approval before destructive actions
- Break complex processes into smaller steps
- Document process purpose and inputs

**Error Handling:**
- Capture task errors in journal
- Provide context in error messages
- Use breakpoints for recoverable errors
- Log state for debugging

**Performance:**
- Limit parallel batch sizes
- Use task timeouts
- Clean up old runs periodically
- Archive completed runs

### 12.3 Common Pitfalls

**❌ Don't:**
- Manually edit `journal.jsonl` or `state.json`
- Skip `run:iterate` and directly edit files
- Create run directories manually
- Use `run:continue` (removed in v4.0)
- Mix stdout and stderr in hooks
- Use non-deterministic values (random, Date.now())

**✅ Do:**
- Use CLI for all state changes
- Drive execution through `run:iterate`
- Let CLI create run directories
- Use `run:iterate` (v4.0+ only)
- Keep stdout for JSON, stderr for logs
- Use `ctx.now()` for timestamps

---

## 13. Troubleshooting

### 13.1 Common Issues

**Issue:** CLI not found

**Solution:**
```bash
# Install globally
npm install -g @a5c-ai/babysitter-sdk

# Or use npx
npx -y @a5c-ai/babysitter-sdk --version
```

**Issue:** Hook not executing

**Solution:**
```bash
# Check hook is executable
chmod +x .a5c/hooks/on-iteration-start/my-hook.sh

# Check hook discovery
ls -la .a5c/hooks/on-iteration-start/
ls -la ~/.config/babysitter/hooks/on-iteration-start/
ls -la plugins/babysitter/hooks/on-iteration-start/

# Test hook manually
echo '{"runId":"test"}' | .a5c/hooks/on-iteration-start/my-hook.sh
```

**Issue:** JSON parsing error in hook output

**Solution:**
```bash
# Check hook stdout is pure JSON
echo '{"test":"payload"}' | ./my-hook.sh

# Ensure stderr is not mixed with stdout
# WRONG: command 2>&1
# RIGHT: command (stderr goes to terminal)

# Test with jq
echo '{"test":"payload"}' | ./my-hook.sh | jq .
```

**Issue:** Run stuck in waiting state

**Solution:**
```bash
# Check pending breakpoints
babysitter task:list run-20260120-example --pending --json

# Check breakpoint status
# Visit http://localhost:3184 in browser
# Or use Telegram bot

# Release breakpoint via CLI (if needed)
curl -X POST http://localhost:3185/api/breakpoints/<id>/feedback \
  -H "Content-Type: application/json" \
  -d '{"author":"admin","comment":"Approved","release":true}'
```

**Issue:** State corruption

**Solution:**
```bash
# State is derived from journal - rebuild it
rm .a5c/runs/<runId>/state/state.json

# Next CLI command will rebuild state from journal
babysitter run:status run-20260120-example
```

### 13.2 Debug Mode

**Enable verbose logging:**
```bash
# For hooks
export TELEGRAM_DEBUG=1

# For CLI
babysitter run:status run-20260120-example --verbose
```

**Check journal events:**
```bash
# Show last 20 events
babysitter run:events run-20260120-example --limit 20 --reverse

# Export all events
babysitter run:events run-20260120-example --json > events.json
```

**Inspect run directory:**
```bash
# Show structure
tree .a5c/runs/run-20260120-example

# Check metadata
cat .a5c/runs/run-20260120-example/run.json | jq .

# Check state
cat .a5c/runs/run-20260120-example/state/state.json | jq .
```

### 13.3 Getting Help

**Documentation:**
- SDK: `packages/sdk/sdk.md`
- Hooks: `plugins/babysitter/skills/babysit/reference/HOOKS.md`
- Skills: `plugins/babysitter/skills/babysit/SKILL.md`
- Breakpoints: `packages/breakpoints/README.md`

**CLI Help:**
```bash
babysitter --help
babysitter run:create --help
babysitter task:post --help
```

**Check Version:**
```bash
babysitter --version
```

**Report Issues:**
- GitHub: https://github.com/a5c-ai/babysitter/issues
- Include: CLI version, error output, relevant journal events

---

## Appendix A: Version History

**Version 4.0** (2026-01-20)
- Pure hook execution architecture
- Hooks execute tasks directly
- Removed `run:continue` command
- Added `run:iterate` command
- Fixed hook dispatcher (stderr separation)
- Enhanced Telegram integration

**Version 3.0** (2026-01-19)
- Generalized hook system
- Process-level hooks (pre-commit, post-planning, etc.)
- Native hooks for all lifecycle events
- Hook dispatcher implementation

**Version 2.0**
- CLI-driven orchestration
- Event-sourced architecture
- Breakpoint system

**Version 1.0**
- Initial SDK release
- Basic process execution

---

## Appendix B: Glossary

**Agent** - LLM-powered tool or code assistant (implemented as task)

**Breakpoint** - Human-in-the-loop approval point in process

**CLI** - Command-line interface for run management

**Effect** - Side-effect request (task, breakpoint, sleep)

**Hook** - Shell script executed at lifecycle points

**Intrinsic** - SDK function callable from process (`ctx.task`, etc.)

**Iteration** - Single pass through orchestration loop

**Journal** - Append-only event log

**Orchestration** - Managing process execution and state

**Process** - JavaScript/TypeScript function defining workflow

**Run** - Single execution of a process

**SDK** - Software Development Kit (@a5c-ai/babysitter-sdk)

**Skill** - Claude Code skill for interactive orchestration

**State** - Derived cache from journal (rebuildable)

**Task** - Core primitive for external work

---

## Appendix C: File Extensions & Formats

**Configuration:**
- `.json` - JSON data files
- `.yaml`, `.yml` - YAML configuration

**Code:**
- `.js` - JavaScript (CommonJS)
- `.ts` - TypeScript
- `.sh` - Shell scripts (hooks)

**Documentation:**
- `.md` - Markdown documentation

**Data:**
- `.log` - Log files (stdout, stderr)
- `.txt` - Plain text

**Archives:**
- Journal events: `<seq>.<ulid>.json`
- Run metadata: `run.json`
- State cache: `state.json`

---

## Appendix D: Environment Variables

**CLI:**
- `DB_PATH` - Breakpoints database path
- `REPO_ROOT` - Repository root directory
- `RUNS_DIR` - Override runs directory

**Worker:**
- `WORKER_POLL_MS` - Poll interval (default: 2000)
- `WORKER_BATCH_SIZE` - Batch size (default: 10)

**Debugging:**
- `TELEGRAM_DEBUG` - Enable Telegram debug logging
- `BABYSITTER_ALLOW_SECRET_LOGS` - Allow secret logging (with --verbose)

**Session:**
- `CLAUDE_SESSION_ID` - Session ID for isolation
- `CLAUDE_PLUGIN_ROOT` - Plugin root directory
- `CLAUDE_ENV_FILE` - Environment variable persistence

---

**END OF SPECIFICATION**

---

**Document Metadata:**
- Created: 2026-01-20
- Version: 4.0
- SDK Version: 0.0.29+
- Status: Production Ready
- Maintainers: Babysitter Team
- License: See repository LICENSE file

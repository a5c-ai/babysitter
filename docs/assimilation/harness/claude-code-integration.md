# Claude Code Harness Integration

Technical reference for the babysitter plugin's integration with Claude Code. Covers the full lifecycle from plugin registration through session management, the stop-hook orchestration loop, effect execution, and completion proof validation.

---

## Table of Contents

1. [Plugin Manifest Registration](#1-plugin-manifest-registration)
2. [SessionStart Hook](#2-sessionstart-hook)
3. [Session State File Format](#3-session-state-file-format)
4. [Run Creation and Session Binding](#4-run-creation-and-session-binding)
5. [The Stop Hook -- Core Orchestration Loop Control](#5-the-stop-hook----core-orchestration-loop-control)
6. [The Iteration Loop](#6-the-iteration-loop)
7. [Native Orchestration Hooks](#7-native-orchestration-hooks)
8. [Breakpoint Handling](#8-breakpoint-handling)
9. [Session Check-Iteration (Runaway Loop Detection)](#9-session-check-iteration-runaway-loop-detection)
10. [Completion Proof and Clean Exit](#10-completion-proof-and-clean-exit)

---

## Architecture Overview

```
+-------------------------------------------------------------------+
|                        Claude Code Host                           |
|                                                                   |
|  +---------------------+    +-------------------------------+     |
|  | Plugin Registration  |    | Hook System                   |     |
|  | (plugin.json)        |    |  SessionStart -> session-start |     |
|  | - hooks              |    |  Stop         -> stop          |     |
|  | - skills             |    +-------------------------------+     |
|  | - commands            |                                         |
|  +---------------------+                                         |
+-------------------------------------------------------------------+
         |                              |
         v                              v
+-------------------+    +------------------------------------+
| babysitter CLI    |    | Session State Files                |
| (SDK npm package) |    | {pluginRoot}/skills/babysit/state/ |
|                   |    |   {sessionId}.md                   |
| hook:run          |    +------------------------------------+
| run:create        |                   |
| run:iterate       |                   v
| task:list         |    +------------------------------------+
| task:post         |    | Run Directory                      |
| session:*         |    | .a5c/runs/{runId}/                 |
+-------------------+    |   run.json, journal/, tasks/,      |
                         |   state/, blobs/                   |
                         +------------------------------------+
```

### End-to-End Data Flow

```
Claude Code starts session
        |
        v
[SessionStart Hook] --> bash shell script
        |                    |
        v                    v
  stdin: {session_id}   babysitter hook:run --hook-type session-start
        |                    |
        v                    v
  Write BABYSITTER_SESSION_ID   Create baseline state file
  to CLAUDE_ENV_FILE            {stateDir}/{sessionId}.md
        |
        v
  [User invokes /babysit skill]
        |
        v
  [Skill creates process, calls run:create]
        |
        v
  run:create --harness claude-code --session-id ... --plugin-root ...
        |
        v
  Session state file updated with runId binding
        |
        v
  [Skill calls run:iterate, executes effects, posts results, STOPS]
        |
        v
  Claude Code intercepts stop --> [Stop Hook]
        |
        v
  babysitter hook:run --hook-type stop
        |
        v
  Decision: block (continue) or approve (exit)
        |
        +--[block]--> reason + systemMessage injected back to Claude
        |                  |
        |                  v
        |             Claude resumes with iteration context
        |             (calls run:iterate, executes effects, STOPS)
        |                  |
        |                  +---> [Stop Hook] again (loop)
        |
        +--[approve]--> Session ends, state file cleaned up
```

---

## 1. Plugin Manifest Registration

**File:** `plugins/babysitter/plugin.json`

The plugin manifest declares two hooks, three skills, and metadata:

```json
{
  "name": "babysitter",
  "version": "4.0.139",
  "sdkVersion": "0.0.170-staging.336c9a98",
  "hooks": {
    "SessionStart": "hooks/babysitter-session-start-hook.sh",
    "Stop": "hooks/babysitter-stop-hook.sh"
  },
  "skills": [
    { "name": "babysitter", "file": "skills/babysit/SKILL.md" }
  ]
}
```

Additionally, `plugins/babysitter/hooks/hooks.json` provides a secondary hook descriptor used by Claude Code's native hook system:

```json
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-session-start-hook.sh" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-stop-hook.sh" }] }]
  }
}
```

### Key Registration Points

| Component | Purpose |
|-----------|---------|
| `SessionStart` hook | Installs SDK, creates baseline session state file |
| `Stop` hook | Intercepts exit signals, controls orchestration loop continuation |
| `babysitter` skill | Primary orchestration skill (SKILL.md) |
| `babysitter-score` skill | Quality scoring skill |
| `sdkVersion` | Pinned SDK version for CLI installation |

### Environment Variables Provided by Claude Code

| Variable | Description |
|----------|-------------|
| `CLAUDE_PLUGIN_ROOT` | Absolute path to the installed plugin directory |
| `BABYSITTER_SESSION_ID` | Cross-harness session identifier (written to `CLAUDE_ENV_FILE` by session-start hook) |
| `CLAUDE_ENV_FILE` | Path to env file for persisting exports across hook invocations |

---

## 2. SessionStart Hook

**Shell entry:** `plugins/babysitter/hooks/babysitter-session-start-hook.sh`
**TypeScript handler:** `packages/sdk/src/harness/claudeCode.ts` -> `handleSessionStartHookImpl()`

### Execution Flow

```
Claude Code starts session
        |
        v
babysitter-session-start-hook.sh
        |
        +-- 1. Resolve PLUGIN_ROOT from CLAUDE_PLUGIN_ROOT or dirname
        |
        +-- 2. Check if `babysitter` CLI is on PATH
        |       |
        |       +-- [not found] Check MARKER_FILE (.babysitter-install-attempted)
        |       |       |
        |       |       +-- [no marker] Read sdkVersion from versions.json
        |       |       |       |
        |       |       |       +-- Try: npm i -g @a5c-ai/babysitter-sdk@{version}
        |       |       |       |
        |       |       |       +-- Fallback: npm i -g ... --prefix $HOME/.local
        |       |       |       |
        |       |       |       +-- Write marker file
        |       |       |
        |       |       +-- [marker exists] Skip install
        |       |
        |       +-- [still not found] Create npx fallback function
        |
        +-- 3. Capture stdin to temp file (clean EOF for Node.js)
        |
        +-- 4. Invoke: babysitter hook:run --hook-type session-start \
        |         --harness claude-code --plugin-root $PLUGIN_ROOT --json < $INPUT_FILE
        |
        +-- 5. Output result JSON to stdout
        |
        v
    exit $EXIT_CODE
```

### TypeScript Handler (`handleSessionStartHookImpl`)

The handler performs three operations:

1. **Parse stdin** -- Reads JSON input containing `{ session_id: string }`.

2. **Append to CLAUDE_ENV_FILE** -- If the `CLAUDE_ENV_FILE` environment variable is set, appends `export BABYSITTER_SESSION_ID="{sessionId}"` to make the session ID available to subsequent hook invocations.

3. **Create baseline state file** -- Writes a session state file at `{pluginRoot}/skills/babysit/state/{sessionId}.md` with initial values:

```yaml
---
active: true
iteration: 1
max_iterations: 256
run_id: ""
started_at: "2026-03-02T10:00:00Z"
last_iteration_at: "2026-03-02T10:00:00Z"
iteration_times:
---
```

The baseline state file is created unconditionally (if it does not already exist) so the stop hook can find it later, even before a run is created. The `run_id` field is empty at this stage -- it gets populated during run creation (Section 4).

### SDK Installation Strategy

The shell script uses a four-tier fallback for CLI availability:

| Priority | Method | Condition |
|----------|--------|-----------|
| 1 | Global `babysitter` binary | Already on PATH |
| 2 | `npm i -g` (global install) | Marker file absent, permissions OK |
| 3 | `npm i -g --prefix $HOME/.local` | Global install fails (permissions) |
| 4 | `npx -y @a5c-ai/babysitter-sdk@{version}` | All installs failed |

The marker file (`{PLUGIN_ROOT}/.babysitter-install-attempted`) prevents repeated install attempts.

---

## 3. Session State File Format

**Module:** `packages/sdk/src/session/`
**Path convention:** `{pluginRoot}/skills/babysit/state/{sessionId}.md`

Session state files use Markdown with YAML frontmatter. The frontmatter stores machine-readable state, and the body stores the user's original prompt.

### File Structure

```markdown
---
active: true
iteration: 3
max_iterations: 256
run_id: "my-run-abc123"
started_at: "2026-03-02T10:00:00Z"
last_iteration_at: "2026-03-02T10:05:30Z"
iteration_times: 45,62,58
---

Build a REST API with authentication and rate limiting for the user service.
```

### YAML Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `active` | boolean | Whether the session loop is active |
| `iteration` | number | Current iteration number (1-based) |
| `max_iterations` | number | Maximum allowed iterations (0 = unlimited, default: 256) |
| `run_id` | string | Associated run ID (empty string before `run:create`) |
| `started_at` | string | ISO 8601 timestamp of session start |
| `last_iteration_at` | string | ISO 8601 timestamp of last iteration |
| `iteration_times` | string | Comma-separated list of last 3 iteration durations in seconds. Represented as a plain string in YAML (e.g., `iteration_times: 45,62,58`), not a YAML list. Parsed into `number[]` by the TypeScript layer. |

### TypeScript Types

```typescript
interface SessionState {
  active: boolean;
  iteration: number;        // 1-based
  maxIterations: number;    // 0 = unlimited
  runId: string;            // "" if unbound
  startedAt: string;        // ISO 8601
  lastIterationAt: string;  // ISO 8601
  iterationTimes: number[]; // last 3 durations (seconds)
}

interface SessionFile {
  state: SessionState;
  prompt: string;       // Markdown body after frontmatter
  filePath: string;
}
```

### Atomic Write Protocol

Session files are written atomically via `writeSessionFile()`:

1. Create temp file: `{filePath}.tmp.{pid}`
2. Write content to temp file
3. Atomic rename: `rename(temp, target)`
4. On error: clean up temp file

### Parsing

The YAML frontmatter parser (`parseYamlFrontmatter`) is a lightweight implementation that:
- Splits content on `---` delimiters
- Parses `key: value` pairs (strips surrounding quotes)
- Returns the body (everything after the second `---`) as the prompt

---

## 4. Run Creation and Session Binding

**Harness method:** `bindSessionImpl()` in `packages/sdk/src/harness/claudeCode.ts`

When the babysitter skill creates a run via `run:create --harness claude-code`, the SDK binds the Claude Code session to the new run.

### CLI Invocation

```bash
babysitter run:create \
  --process-id my-process \
  --entry ./process.js#process \
  --runs-dir .a5c/runs \
  --inputs inputs.json \
  --run-id my-run-abc123 \
  --process-revision v2.1 \
  --request req-456 \
  --prompt "Build the API" \
  --harness claude-code \
  --session-id "${BABYSITTER_SESSION_ID}" \
  --plugin-root "${CLAUDE_PLUGIN_ROOT}" \
  --json \
  --dry-run
```

**All `run:create` flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--process-id <id>` | Yes | Process identifier |
| `--entry <path#export>` | Yes | Entrypoint file path and export name |
| `--runs-dir <dir>` | No | Root directory for run storage (default: `.a5c/runs`) |
| `--inputs <file>` | No | JSON file with process inputs |
| `--run-id <id>` | No | Override auto-generated run ID |
| `--process-revision <rev>` | No | Process revision tag |
| `--request <id>` | No | Associated request identifier |
| `--prompt <text>` | No | User prompt text |
| `--harness <name>` | No | Harness adapter name (e.g., `claude-code`) |
| `--session-id <id>` | No | Session ID for harness binding |
| `--plugin-root <dir>` | No | Plugin root directory for state resolution |
| `--json` | No | Output as JSON |
| `--dry-run` | No | Preview without creating run |

### Binding Flow

```
run:create command
        |
        v
  Create run directory (.a5c/runs/{runId}/)
  Write run.json, inputs.json, initial journal events
        |
        v
  Detect harness = "claude-code"
        |
        v
  bindSessionImpl()
        |
        +-- Resolve stateDir = {pluginRoot}/skills/babysit/state
        |
        +-- Compute filePath = {stateDir}/{sessionId}.md
        |
        +-- Check if state file exists
        |       |
        |       +-- [exists, different runId] -> ERROR: re-entrant run
        |       |
        |       +-- [exists, same/empty runId] -> Update state with runId
        |       |
        |       +-- [not exists] -> Create new state file with runId
        |
        v
  Return SessionBindResult { harness, sessionId, stateFile }
```

### Re-entrant Run Prevention

If a session state file already exists with a different `runId`, the binding fails with:

```
Session already associated with run: {existingRunId}
```

This prevents concurrent runs on the same session. To start a new run, the previous run must complete (state file cleaned up) or the state file must be manually removed.

### State File After Binding

After successful binding, the state file is updated:

```yaml
---
active: true
iteration: 1
max_iterations: 256
run_id: "my-run-abc123"
started_at: "2026-03-02T10:00:00Z"
last_iteration_at: "2026-03-02T10:00:00Z"
iteration_times:
---

Build a REST API with authentication and rate limiting for the user service.
```

---

## 5. The Stop Hook -- Core Orchestration Loop Control

**Shell entry:** `plugins/babysitter/hooks/babysitter-stop-hook.sh`
**TypeScript handler:** `handleStopHookImpl()` in `packages/sdk/src/harness/claudeCode.ts`

The stop hook is the central mechanism that converts Claude Code's single-turn execution model into a multi-iteration orchestration loop. Every time Claude attempts to end its response, the stop hook intercepts and decides whether to allow the exit or block it with new context.

### Stop Hook Decision Flow

The decision flow is organized into four logical phases:

#### Phase 1: Input Parsing

```
Claude Code agent finishes response -> triggers Stop hook
        |
        v
babysitter-stop-hook.sh
        |
        +-- Resolve babysitter CLI (PATH / $HOME/.local/bin / npx)
        +-- Capture stdin to temp file
        +-- Invoke: babysitter hook:run --hook-type stop \
        |     --harness claude-code --plugin-root $PLUGIN_ROOT --json
        |
        v
handleStopHookImpl()
        |
        +-- 1. Read stdin JSON: { session_id, transcript_path, last_assistant_message }
```

#### Phase 2: Guard Checks

```
        +-- 2. No session_id? --> APPROVE (allow exit)
        |
        +-- 3. Resolve stateDir, find session file
        |       |
        |       +-- Primary: {pluginRoot}/skills/babysit/state/{sessionId}.md
        |       +-- Fallback: .a5c/state/{sessionId}.md
        |       +-- [not found] --> APPROVE (no active loop)
        |
        +-- 4. Read session state
        |
        +-- 5. Check max iterations
        |       +-- [iteration >= maxIterations] --> APPROVE + cleanup
        |
        +-- 6. Check iteration timing (runaway loop detection)
        |       +-- [avg of last 3 <= 15s, after iter 5] --> APPROVE + cleanup
        |
        +-- 7. No runId bound? --> APPROVE + cleanup
```

#### Phase 3: Run State Evaluation

```
        +-- 8. Load run state from journal
        |       |
        |       +-- Read run.json metadata
        |       +-- Load journal events
        |       +-- Build effect index
        |       +-- Determine: completed / failed / waiting / created
        |       +-- Count pending effects by kind
        |       +-- [run state unknown] --> APPROVE + cleanup
        |
        +-- 9. Parse transcript for <promise> tag
        |       |
        |       +-- Read transcript_path (JSONL file)
        |       +-- Extract last assistant text message
        |       +-- Search for <promise>VALUE</promise>
        |       +-- Fallback: use last_assistant_message from hook input
        |
        +-- 10. Check completion proof
        |       |
        |       +-- [run completed AND promise matches proof] --> APPROVE + cleanup
```

#### Phase 4: Output (Block Decision)

```
        +-- 11. BLOCK: Continue loop
                |
                +-- Increment iteration
                +-- Update session state file
                +-- Build reason (injected to Claude as context)
                +-- Build systemMessage (shown to user)
                +-- Discover relevant skills/agents
                +-- Output: { decision: "block", reason, systemMessage }
```

### State Transition Diagram

```
                    +----------+
                    |  SESSION  |
                    |  STARTED  |
                    +----+-----+
                         |
                    SessionStart hook
                    creates baseline state
                         |
                         v
                    +----------+
                    |  UNBOUND  |  (state file exists, runId = "")
                    +----+-----+
                         |
                    run:create --harness claude-code
                    binds session to run
                         |
                         v
                    +----------+
              +---->|  ACTIVE   |  (state file has runId, iteration N)
              |     +----+-----+
              |          |
              |     Claude stops -> Stop hook fires
              |          |
              |          v
              |     +---------+
              |     | EVALUATE |
              |     +----+----+
              |          |
              |     +----+----+----+----+----+----+
              |     |    |    |    |    |    |    |
              |     v    v    v    v    v    v    v
              |   max  fast  no   run  proof no   otherwise
              |   iter loop  run  unk  match run
              |     |    |    |    |    |    |    |
              |     v    v    v    v    v    v    |
              |   +---------------------------+  |
              |   |        APPROVE            |  |
              |   | (allow exit, cleanup      |  |
              |   |  state file)              |  |
              |   +---------------------------+  |
              |                                  |
              |                                  v
              |                            +---------+
              |                            |  BLOCK  |
              |                            | (inject |
              |                            | context)|
              |                            +----+----+
              |                                 |
              |     Claude resumes with reason  |
              |     (calls run:iterate, etc.)   |
              |                                 |
              +---------------------------------+
```

### Hook Input Format

The stop hook receives JSON on stdin:

```json
{
  "session_id": "sess-abc123",
  "transcript_path": "/tmp/claude-transcript-abc123.jsonl",
  "last_assistant_message": "I've completed the task..."
}
```

### Hook Output Format

**Block (continue loop):**

```json
{
  "decision": "block",
  "reason": "Babysitter iteration 3 | Continue orchestration (run:iterate).\n\nBuild a REST API...",
  "systemMessage": "\uD83D\uDD04 Babysitter iteration 3/256 [waiting]"
}
```

**Approve (allow exit):**

```json
{}
```

An empty object or `{ "decision": "approve" }` signals approval. The stop hook outputs `{}` for all approve cases.

### Block Reason Construction

The `reason` field (injected as context to Claude) is constructed from:

1. **Iteration context** -- varies by run state:
   - Completed: `"Run completed! To finish: call 'run:status --json', extract 'completionProof', output in <promise>SECRET</promise> tags."`
   - Waiting: `"Waiting on: {pendingKinds}. Check if pending effects are resolved, then call run:iterate."`
   - Failed: `"Run failed. Fix the run, journal or process and proceed."`
   - Default: `"Continue orchestration (run:iterate)."`

2. **Discovered skills/agents** -- appended if found (up to 10 items)

3. **Original prompt** -- the full prompt from the session state file body

Format: `"{iterationContext}\n\n{prompt}"`

### Journal Event Recording

Each stop hook invocation appends a `STOP_HOOK_INVOKED` event to the run journal:

```json
{
  "sessionId": "sess-abc123",
  "iteration": 2,
  "decision": "block",
  "reason": "continue_loop",
  "runState": "waiting",
  "pendingKinds": "node, breakpoint",
  "hasPromise": false,
  "timestamp": "2026-03-02T10:05:30.000Z"
}
```

### Approve Conditions (Exit Allowed)

| Condition | Reason String |
|-----------|---------------|
| No `session_id` in hook input | (no event recorded) |
| No session state file found | (no event recorded) |
| `iteration >= maxIterations` | `max_iterations_reached` |
| Iteration avg <= 15s (after iter 5) | `iteration_too_fast` |
| No `runId` bound to session | (cleanup, no event) |
| Run state unknown/unreadable | `run_state_unknown` |
| Promise tag matches completion proof | `completion_proof_matched` |

---

## 6. The Iteration Loop

The iteration loop is not a programmatic loop within any single process. It is an emergent loop created by the interaction between the babysitter skill (running inside Claude Code) and the stop hook.

### Single Iteration Sequence

```
[Claude resumes with stop-hook context]
        |
        v
  1. babysitter run:iterate .a5c/runs/{runId} --json
        |
        +-- orchestrateIteration() replays journal, runs process function
        |   |
        |   +-- Process calls ctx.task() / ctx.breakpoint() / etc.
        |   +-- Replay engine checks effect index
        |   +-- Resolved effects: return cached result
        |   +-- Unresolved: throw EffectRequestedError
        |   +-- New effects: append EFFECT_REQUESTED to journal
        |
        +-- Output: { status, action, count, completionProof?, effects[] }
        |
        v
  2. babysitter task:list .a5c/runs/{runId} --pending --json
        |
        +-- Lists all pending (unresolved) effects
        +-- Output: { tasks: [{ effectId, kind, status, label }] }
        |
        v
  3. For each pending effect:
        |
        +-- [kind=node]       Execute Node.js task
        +-- [kind=agent]      Delegate to agent via Task tool
        +-- [kind=skill]      Invoke Claude Code skill
        +-- [kind=breakpoint] Ask user (interactive) or auto-resolve (non-interactive)
        +-- [kind=sleep]      Wait until time condition met
        |
        v
  4. babysitter task:post .a5c/runs/{runId} {effectId} \
       --status ok --value {valueFile} --json
        |
        +-- Writes result.json to tasks/{effectId}/
        +-- Appends EFFECT_RESOLVED event to journal
        +-- Updates state cache
        |
        v
  5. Claude STOPS (ends response)
        |
        v
  [Stop Hook fires] --> evaluates --> BLOCK with next iteration context
        |
        v
  [Claude resumes] --> back to step 1
```

### run:iterate Output Schema

```json
{
  "iteration": 3,
  "status": "executed",
  "action": "executed-tasks",
  "reason": "auto-runnable-tasks",
  "count": 2,
  "metadata": { "runId": "my-run", "processId": "my-process" }
}
```

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `executed` | Tasks were requested | Execute pending effects, post results, stop |
| `waiting` | Breakpoint or sleep pending | Handle breakpoint/sleep, post result, stop |
| `completed` | Run finished | Extract `completionProof`, output in `<promise>` tag |
| `failed` | Run errored | Inspect and fix, re-iterate |
| `none` | No pending effects | Stop (hook may continue or allow exit) |

### task:post Protocol

Results must be posted through the CLI, not by writing `result.json` directly:

```bash
# Write value to separate file
echo '{"score": 85, "details": {...}}' > tasks/{effectId}/output.json

# Post through CLI (creates result.json + journal event + cache update)
babysitter task:post .a5c/runs/{runId} {effectId} \
  --status ok \
  --value tasks/{effectId}/output.json \
  --json
```

The `task:post` command:
1. Reads the value from the specified file
2. Writes `tasks/{effectId}/result.json` with schema version and metadata
3. Appends an `EFFECT_RESOLVED` event to `journal/`
4. Updates `state/state.json` cache

---

## 7. Native Orchestration Hooks

**Dispatcher:** `plugins/babysitter/hooks/hook-dispatcher.sh`

The hook dispatcher executes native babysitter lifecycle hooks (distinct from Claude Code's `SessionStart`/`Stop` hooks). These hooks are triggered by the SDK runtime during `run:iterate`.

### Hook Types Triggered During Iteration

| Hook | When | Triggered By |
|------|------|-------------|
| `on-iteration-start` | Before orchestrateIteration() | `run:iterate` command |
| `on-iteration-end` | After orchestrateIteration() | `run:iterate` command |
| `on-run-start` | Run created | `run:create` command |
| `on-run-complete` | Run finished successfully | orchestrateIteration() |
| `on-run-fail` | Run failed | orchestrateIteration() |
| `on-task-start` | Task execution begins | Effect executor |
| `on-task-complete` | Task execution ends | Effect executor |
| `on-breakpoint` | Breakpoint reached | orchestrateIteration() |
| `on-step-dispatch` | Effect dispatched | Replay engine |
| `on-score` | Quality score posted | Score handler |
| `pre-commit` | Before git commit | Git integration |
| `pre-branch` | Before branch creation | Git integration |
| `post-planning` | Planning phase complete | Planning handler |

### Hook Discovery Priority

The dispatcher searches for hook scripts in three directories, executing in order:

```
1. Per-repo:  {REPO_ROOT}/.a5c/hooks/{hookType}/*.sh    (highest priority)
2. Per-user:  ~/.config/babysitter/hooks/{hookType}/*.sh  (medium priority)
3. Plugin:    {PLUGIN_ROOT}/hooks/{hookType}/*.sh         (lowest priority)
```

Within each directory, scripts are sorted alphabetically and executed sequentially. Each script receives the hook payload on stdin. Individual hook failures do not fail the dispatcher -- it continues executing remaining hooks.

### Breakpoint Hook Dispatcher

**File:** `plugins/babysitter/hooks/on-breakpoint-dispatcher.sh`

A specialized dispatcher for breakpoint events. Same three-tier discovery as the generic dispatcher but specific to the `on-breakpoint` hook type. Receives breakpoint payload on stdin via `BREAKPOINT_PAYLOAD` environment variable.

---

## 8. Breakpoint Handling

Breakpoints are human-approval gates within a process. When the process function calls `ctx.breakpoint()`, the replay engine throws an `EffectRequestedError` with kind `breakpoint`.

### Interactive Mode (Default)

When Claude Code has access to the `AskUserQuestion` tool:

```
run:iterate detects breakpoint effect
        |
        v
  task:list shows: { kind: "breakpoint", status: "requested" }
        |
        v
  Skill reads breakpoint question from task.json
        |
        v
  AskUserQuestion tool presented to user
  (MUST include explicit "Approve" / "Reject" options)
        |
        v
  User selects option
        |
        +-- [empty/dismissed/ambiguous] --> Re-ask. NEVER assume approval.
        |
        +-- [explicit approve/reject] --> Post result via task:post
        |
        v
  babysitter task:post {runId} {effectId} --status ok --value {response.json}
        |
        v
  Next iteration replays breakpoint with cached result
```

**Validation rules for interactive breakpoints:**

1. AskUserQuestion MUST include explicit approve/reject options
2. Empty, dismissed, or ambiguous responses are treated as NOT approved
3. Never fabricate or infer approval text
4. Only pass the user's actual response verbatim
5. Never offer "chat about this" options -- only explicit choices or free-text

### Non-Interactive Mode (Running with `-p` flag)

When `AskUserQuestion` is unavailable:

```
run:iterate detects breakpoint effect
        |
        v
  Skill reads breakpoint context from task.json
        |
        v
  Auto-resolve: select best option based on context and user intent
        |
        v
  babysitter task:post {runId} {effectId} --status ok --value {decision.json}
```

---

## 9. Session Check-Iteration (Runaway Loop Detection)

**CLI command:** `babysitter session:check-iteration`
**Handler:** `handleSessionCheckIteration()` in `packages/sdk/src/cli/commands/session.ts`

The stop hook and the `session:check-iteration` command both implement runaway loop detection to prevent infinite iteration loops.

### Detection Mechanisms

#### 1. Max Iterations Guard

```
IF iteration >= maxIterations (default 256):
    APPROVE exit, cleanup state file
```

#### 2. Iteration Speed Guard (Runaway Detection)

```
IF iteration >= 5:
    Calculate durations of last 3 iterations
    IF average duration <= 15 seconds:
        APPROVE exit (runaway detected), cleanup state file
```

The `iterationTimes` array stores the last 3 iteration durations in seconds. Durations are calculated from the difference between the current timestamp and `lastIterationAt`.

### Timing Calculation

**Concrete example:**

```
lastIterationAt = "2026-03-02T10:05:00Z"  (epoch: 1740909900)
currentTime     = "2026-03-02T10:05:45Z"  (epoch: 1740909945)
duration        = 1740909945 - 1740909900 = 45 seconds

existingTimes = [62, 58]
updatedTimes  = [62, 58, 45]   (appended, kept last 3)
average       = (62 + 58 + 45) / 3 = 55s  --> NOT too fast (> 15s threshold)
```

```typescript
function updateIterationTimes(
  existingTimes: number[],
  lastIterationAt: string,   // ISO 8601
  currentTime: string        // ISO 8601
): number[] {
  const duration = epochSeconds(currentTime) - epochSeconds(lastIterationAt);
  if (duration <= 0) return existingTimes;
  return [...existingTimes, duration].slice(-3);  // Keep last 3
}

function isIterationTooFast(iterationTimes: number[]): boolean {
  if (iterationTimes.length < 3) return false;
  const avg = sum(iterationTimes) / iterationTimes.length;
  return avg <= 15;  // 15 seconds threshold
}
```

### session:check-iteration Output

```json
{
  "found": true,
  "shouldContinue": true,
  "nextIteration": 4,
  "updatedIterationTimes": [45, 62, 58],
  "iteration": 3,
  "maxIterations": 256,
  "runId": "my-run-abc123",
  "prompt": "Build the API..."
}
```

When `shouldContinue` is `false`, includes `reason` and `stopMessage`:

```json
{
  "found": true,
  "shouldContinue": false,
  "reason": "iteration_too_fast",
  "averageTime": 8.3,
  "threshold": 15,
  "stopMessage": "Average iteration time too fast (8.3s <= 15s)"
}
```

---

## 10. Completion Proof and Clean Exit

The completion proof is a cryptographic mechanism that prevents premature exit from the orchestration loop. Only when the run has genuinely completed does the proof become available.

### Proof Generation

**File:** `packages/sdk/src/cli/completionProof.ts`

```typescript
const COMPLETION_PROOF_SALT = "babysitter-completion-secret-v1";

function deriveCompletionProof(runId: string): string {
  return sha256(`${runId}:${COMPLETION_PROOF_SALT}`);
}

function resolveCompletionProof(metadata: RunMetadata): string {
  return metadata.completionProof ?? deriveCompletionProof(metadata.runId);
}
```

The proof is a SHA-256 hash of `{runId}:{salt}`. It is stored in `run.json` metadata or derived on demand.

### Proof Verification in Stop Hook

```
Stop hook fires
        |
        v
  Load journal -> check for RUN_COMPLETED event
        |
        +-- [not completed] -> no proof available
        |
        +-- [completed] -> resolveCompletionProof(metadata)
        |
        v
  Parse transcript for <promise>VALUE</promise> tag
        |
        +-- extractPromiseTag(lastAssistantText)
        |   Returns content between first <promise>...</promise> tags
        |   Trims whitespace, collapses internal whitespace
        |
        v
  Compare: promiseValue === completionProof
        |
        +-- [match] -> APPROVE exit, cleanup state file
        |
        +-- [no match] -> BLOCK with hint:
              "Run completed! Extract completionProof from run:status --json,
               output in <promise>SECRET</promise> tags."
```

### Promise Tag Format

```
<promise>a1b2c3d4e5f6...</promise>
```

The agent must output the exact completion proof value inside `<promise>` tags. The extraction function:

```typescript
function extractPromiseTag(text: string): string | null {
  const match = text.match(/<promise>([\s\S]*?)<\/promise>/);
  if (!match) return null;
  return match[1].trim().replace(/\s+/g, ' ');
}
```

### Complete Exit Sequence

```
run:iterate returns { status: "completed", completionProof: "abc123..." }
        |
        v
  Claude outputs: <promise>abc123...</promise>
        |
        v
  Claude STOPS
        |
        v
  Stop hook fires
        |
        v
  Load journal: RUN_COMPLETED event found
  Derive proof: sha256("{runId}:babysitter-completion-secret-v1")
  Parse transcript: extract <promise>abc123...</promise>
        |
        v
  promiseValue === completionProof -> MATCH
        |
        v
  Append STOP_HOOK_INVOKED event (reason: "completion_proof_matched")
        |
        v
  Delete session state file (cleanup)
        |
        v
  Output: {}  (APPROVE)
        |
        v
  Claude Code session ends normally
```

### Session Cleanup

On any approve decision, the stop hook calls `cleanupSession()` which deletes the session state file:

```typescript
async function cleanupSession(filePath: string): Promise<void> {
  try {
    await deleteSessionFile(filePath);
  } catch {
    // Best-effort cleanup
  }
}
```

This ensures that:
- Subsequent sessions are not contaminated by old state
- The next `SessionStart` hook creates a fresh baseline
- No orphaned state files accumulate over time

---

## Harness Adapter Architecture

**Files:**
- `packages/sdk/src/harness/types.ts` -- Interface definition
- `packages/sdk/src/harness/claudeCode.ts` -- Claude Code implementation
- `packages/sdk/src/harness/nullAdapter.ts` -- No-op fallback
- `packages/sdk/src/harness/registry.ts` -- Auto-detection and lookup

The harness adapter pattern abstracts host-specific behaviors so the SDK core remains harness-agnostic. The `HarnessAdapter` interface defines:

```typescript
interface HarnessAdapter {
  readonly name: string;
  isActive(): boolean;
  resolveSessionId(parsed: { sessionId?: string }): string | undefined;
  resolveStateDir(args: { stateDir?: string; pluginRoot?: string }): string | undefined;
  resolvePluginRoot(args: { pluginRoot?: string }): string | undefined;
  bindSession(opts: SessionBindOptions): Promise<SessionBindResult>;
  handleStopHook(args: HookHandlerArgs): Promise<number>;
  handleSessionStartHook(args: HookHandlerArgs): Promise<number>;
  findHookDispatcherPath(startCwd: string): string | null;
}
```

### Adapter Detection

The registry probes adapters in priority order. The Claude Code adapter reports active when either `BABYSITTER_SESSION_ID` or `CLAUDE_ENV_FILE` is set:

```typescript
isActive(): boolean {
  return !!(process.env.BABYSITTER_SESSION_ID || process.env.CLAUDE_ENV_FILE);
}
```

If no adapter matches, the null adapter is used, which approves all stop hooks (no orchestration loop) and returns safe defaults.

### hookRun Command Dispatch

**File:** `packages/sdk/src/cli/commands/hookRun.ts`

The `hook:run` command routes to the appropriate adapter method:

```
babysitter hook:run --hook-type stop --harness claude-code
        |
        v
  getAdapterByName("claude-code") -> ClaudeCodeAdapter
        |
        v
  switch (hookType):
    case "stop":          adapter.handleStopHook(args)
    case "session-start": adapter.handleSessionStartHook(args)
```

---

## File Reference

| File | Role |
|------|------|
| `plugins/babysitter/plugin.json` | Plugin manifest with hook and skill declarations |
| `plugins/babysitter/hooks/hooks.json` | Secondary hook descriptor for Claude Code hook system |
| `plugins/babysitter/hooks/babysitter-session-start-hook.sh` | Shell entry for SessionStart hook |
| `plugins/babysitter/hooks/babysitter-stop-hook.sh` | Shell entry for Stop hook |
| `plugins/babysitter/hooks/hook-dispatcher.sh` | Generic hook dispatcher (per-repo/per-user/plugin) |
| `plugins/babysitter/hooks/on-breakpoint-dispatcher.sh` | Breakpoint-specific hook dispatcher |
| `plugins/babysitter/skills/babysit/SKILL.md` | Primary orchestration skill definition |
| `packages/sdk/src/harness/types.ts` | HarnessAdapter interface definition |
| `packages/sdk/src/harness/claudeCode.ts` | Claude Code adapter (stop hook, session-start, binding) |
| `packages/sdk/src/harness/nullAdapter.ts` | No-op fallback adapter |
| `packages/sdk/src/harness/registry.ts` | Adapter auto-detection and lookup registry |
| `packages/sdk/src/harness/index.ts` | Harness module public exports |
| `packages/sdk/src/session/types.ts` | SessionState, SessionFile, error types |
| `packages/sdk/src/session/parse.ts` | YAML frontmatter parsing, state file reading |
| `packages/sdk/src/session/write.ts` | Atomic state file writes, timing utilities |
| `packages/sdk/src/session/index.ts` | Session module public exports |
| `packages/sdk/src/cli/commands/hookRun.ts` | hook:run CLI command dispatcher |
| `packages/sdk/src/cli/commands/session.ts` | session:* CLI commands including check-iteration |
| `packages/sdk/src/cli/commands/runIterate.ts` | run:iterate CLI command |
| `packages/sdk/src/cli/completionProof.ts` | Completion proof derivation (SHA-256) |

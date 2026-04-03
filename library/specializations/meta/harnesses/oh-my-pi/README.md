# Oh My Pi Harness -- Babysitter Extensibility Documentation

> Reference date: 2026-04-02

## Overview

Oh My Pi (CLI: `omp`, package: `@oh-my-pi/pi-coding-agent`) is an enhanced fork of the Pi coding agent. Babysitter integrates with it through a dedicated harness adapter in the SDK and a plugin package (`@a5c-ai/babysitter-pi`) that provides extensions, commands, skills, and an AGENTS.md behavioral contract.

The integration turns oh-my-pi into a fully orchestrated harness: babysitter drives multi-step workflows through process definitions, effects, and a deterministic iteration loop, while oh-my-pi provides the agent runtime, tool execution, TUI rendering, and user interaction surface.

---

## Relationship to Pi

The oh-my-pi adapter (`createOhMyPiAdapter()` in `packages/sdk/src/harness/ohMyPi.ts`) wraps `createPiAdapter()` with two differences:

1. **Name**: Reports as `"oh-my-pi"` instead of `"pi"` so the registry can distinguish between the two when both are installed.
2. **Activation check**: Only claims active when `OMP_SESSION_ID` or `OMP_PLUGIN_ROOT` environment variables are set (not PI_* variants).

Everything else -- session binding, hook handling, state directory resolution, prompt context generation -- is inherited from the Pi adapter (`packages/sdk/src/harness/pi.ts`), which itself delegates stop-hook and session-start-hook handling to the Claude Code adapter.

The Pi adapter resolves environment state from both `OMP_*` and `PI_*` env var families, supporting the entire PI-family lineage. Oh-my-pi narrows activation detection to OMP-specific variables while sharing all runtime behavior.

### Adapter Capabilities

Oh-my-pi advertises the following capabilities (from `packages/sdk/src/harness/discovery.ts`):

| Capability | Description |
|------------|-------------|
| `Programmatic` | Supports programmatic (non-interactive) invocation |
| `SessionBinding` | Can bind a babysitter run to a host session |
| `StopHook` | Implements the stop-hook lifecycle event |
| `HeadlessPrompt` | Can accept a prompt without a TTY |

---

## Extension System

Oh-my-pi uses the same extension system as Pi. Extensions are declared in `package.json` under the `omp` field:

```json
{
  "omp": {
    "extensions": ["./extensions"],
    "skills": ["./skills"]
  }
}
```

The babysitter extension entry point (`plugins/babysitter-pi/extensions/babysitter/index.ts`) exports a default `activate(pi: ExtensionAPI)` function. The `ExtensionAPI` interface (defined in `plugins/babysitter-pi/extensions/babysitter/types.ts`) provides 10 event hooks:

| Event | Description |
|-------|-------------|
| `session_start` | Session initialized; extension binds babysitter state |
| `agent_end` | Agent turn completed; drives the orchestration loop |
| `session_shutdown` | Session closing; cleans up run state and widgets |
| `before_agent_start` | Before agent begins processing |
| `tool_call` | Tool invocation intercepted; used for task interception |
| `tool_result` | Tool execution completed |
| `context` | Context injection point; babysitter run state added here |
| `input` | User input event |
| `turn_start` | Agent turn beginning |
| `turn_end` | Agent turn ending |

The ExtensionAPI also exposes:
- `registerTool(toolDef)` -- register custom tools
- `registerCommand(name, options)` -- register slash commands
- `registerMessageRenderer(type, renderer)` -- register TUI message formatters
- `appendEntry(entry)` -- append to session log
- `sendMessage(msg)` / `sendUserMessage(msg)` -- inject messages into conversation
- `getActiveTools()` / `setActiveTools(tools)` -- manage active tool set

---

## SDK Bridge

The SDK bridge (`plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts`) provides in-process integration with the babysitter runtime. No CLI subprocess is spawned, no stdout is parsed, no JSON is scraped from a pipe.

The bridge imports directly from `@a5c-ai/babysitter-sdk`:

| Bridge Function | SDK Function | Purpose |
|-----------------|-------------|---------|
| `createNewRun()` | `createRun()` | Create a new babysitter run |
| `iterate()` | `orchestrateIteration()` | Run a single orchestration iteration |
| `postResult()` | `commitEffectResult()` | Post an effect result to the journal |
| `getRunStatus()` | `readRunMetadata()` + `loadJournal()` | Read run state and pending effects |
| `getPendingEffects()` | (via `getRunStatus`) | Convenience shorthand for pending effects |

Errors from the SDK are wrapped in `SdkBridgeError` with the original cause preserved.

A deprecated `cli-wrapper.ts` module exists for backward compatibility. It spawns `babysitter` as a child process with `--json` output. New code should use the SDK bridge exclusively.

---

## Loop Driver

The loop driver (`plugins/babysitter-pi/extensions/babysitter/loop-driver.ts`) is wired to the `agent_end` event and drives the orchestration iteration cycle.

### Loop Sequence

On every `agent_end` event:

1. **Look up active run** -- If no babysitter run is bound to the session, return immediately.
2. **Check for completion proof** -- Scan agent output for a `<promise>...</promise>` tag. If found, the run is finalized.
3. **Check guards** -- Evaluate all safety guards (see Guards section). If any guard trips, the run is stopped.
4. **Run SDK iteration** -- Call `iterate(runDir)` via the SDK bridge.
5. **Handle result**:
   - `completed` -- Log success, clear active run, reset guard state.
   - `failed` -- Log failure, clear active run, reset guard state.
   - `waiting` -- Build a continuation prompt listing pending effects with per-kind execution instructions, inject it via `pi.sendUserMessage()`.

### Continuation Prompt

When effects are pending, the loop driver builds a structured continuation prompt containing:
- Run ID and iteration number
- Numbered list of pending effects with kind, title, and effectId
- Per-kind execution instructions (node, shell, agent, breakpoint, sleep, orchestrator_task, skill)

This prompt is injected as a user message to keep the agent loop alive.

---

## Guards

The guard module (`plugins/babysitter-pi/extensions/babysitter/guards.ts`) enforces safety limits before every orchestration iteration.

### Guard Thresholds

| Guard | Default | Env Override | Description |
|-------|---------|-------------|-------------|
| Max iterations | 256 | `BABYSITTER_MAX_ITERATIONS` | Hard cap on iteration count per run |
| Wall-clock time | 7,200,000 ms (2h) | -- | Maximum elapsed time from run start |
| Consecutive errors | 3 | -- | Errors in a row before the guard trips |
| Doom-loop detection | 3 fast iterations | -- | Iterations under 2s each with unchanged pending effect count |

### Doom-Loop Detection

Two detection mechanisms:

1. **Time + pending count** (primary): If the last 3 iterations each completed in under 2 seconds AND the pending effect count has not changed, the run is considered stuck.
2. **Digest comparison** (legacy): If the last 3 iteration digests (serialized pending effect IDs) are identical, the run is flagged.

Guard state is reset when a run completes, fails, or is cleared from the session.

### Constants Module Defaults

The constants module (`plugins/babysitter-pi/extensions/babysitter/constants.ts`) defines additional defaults that differ from the guard module's runtime values:

| Constant | Value | Notes |
|----------|-------|-------|
| `DEFAULT_MAX_ITERATIONS` | 256 | Matches guard module |
| `DEFAULT_MAX_DURATION_MS` | 1,800,000 (30 min) | More conservative than the guard's 2h limit |
| `DEFAULT_ERROR_THRESHOLD` | 5 | Higher than the guard's runtime check of 3 |
| `DEFAULT_DOOM_LOOP_WINDOW` | 4 | Wider window than the guard's runtime check of 3 |
| `EFFECT_TIMEOUT_MS` | 900,000 (15 min) | Per-effect execution timeout |
| `POST_RESULT_TIMEOUT_MS` | 30,000 (30s) | Result posting timeout |

The guard module's runtime values (`guards.ts`) take precedence during execution. The constants module values serve as configuration defaults for the broader extension.

---

## Task Interceptor

The task interceptor (`plugins/babysitter-pi/extensions/babysitter/task-interceptor.ts`) blocks built-in task and todo tools during active babysitter runs to prevent conflicts with babysitter's own orchestration.

### Intercepted Tools

| Tool Name | Reason |
|-----------|--------|
| `task` | Native task management conflicts with babysitter effects |
| `todo_write` | Native todo conflicts with babysitter task tracking |
| `TodoWrite` | Alternate casing of todo_write |
| `TaskCreate` | Native task creation conflicts |
| `sub_agent` | Sub-agent dispatch should go through babysitter effects |
| `quick_task` | Quick task creation conflicts |

When a babysitter run is active and an intercepted tool is called, the interceptor returns `{ block: true, reason: "..." }`, directing the agent to use babysitter effects instead. When no run is active, all tools are allowed through.

---

## TUI Widgets

The extension renders three TUI widget panels via `pi.setWidget()` (`plugins/babysitter-pi/extensions/babysitter/tui-widgets.ts`):

### Run Progress Widget (`babysitter:run`)

Displays:
- Babysitter Run ID
- Process ID
- Iteration count / max iterations and status
- Elapsed time (formatted as `Xs`, `Xm Ys`, or `Xh Ym Zs`)

### Effects Queue Widget (`babysitter:effects`)

Displays:
- Header with count of pending effects
- Per-effect lines: `[kind] title`

### Quality Score Widget (`babysitter:quality`)

Displays:
- Current score vs. target threshold
- 16-character ASCII progress bar with `=` fill and `>` cursor

### Status Line

A separate status line module (`plugins/babysitter-pi/extensions/babysitter/status-line.ts`) provides a compact single-line summary via `pi.setStatus()`:
- Idle: `"Babysitter: idle"`
- Running: `"Babysitter: iter N | pending M | Xm"`
- Completed: `"Babysitter: done"`
- Failed: `"Babysitter: FAILED"`

### Todo Replacement Widget (`babysitter:todos`)

The todo replacement module (`plugins/babysitter-pi/extensions/babysitter/todo-replacement.ts`) reads the babysitter journal directly via the SDK's `loadJournal()` and maps effect states into a checkbox-style todo list:
- `[x]` completed effects
- `[ ]` in-progress effects
- `[!]` failed effects

### Message Renderers

The tool renderer (`plugins/babysitter-pi/extensions/babysitter/tool-renderer.ts`) registers four message type renderers:

| Message Type | Format |
|-------------|--------|
| `babysitter:tool-result` | Per-effect execution result with status icon, kind, title, duration, value/error |
| `babysitter:status` | Unicode box-drawn run status overview |
| `babysitter:effect-result` | Compact one-line effect completion summary |
| `babysitter:iteration` | Iteration progress with pending count |

---

## Custom Tools

The extension registers three custom tools with oh-my-pi (`plugins/babysitter-pi/extensions/babysitter/custom-tools.ts`):

| Tool | Description |
|------|-------------|
| `babysitter_run_status` | Get run state, iteration count, and pending effects |
| `babysitter_post_result` | Post a result (ok/error) for a pending effect by effectId |
| `babysitter_iterate` | Manually trigger the next orchestration iteration |

These tools operate through the SDK bridge, allowing agents to inspect and control babysitter runs without leaving the oh-my-pi session.

---

## Effect Executor

The effect executor (`plugins/babysitter-pi/extensions/babysitter/effect-executor.ts`) maps babysitter effect kinds to oh-my-pi execution capabilities:

| Effect Kind | Execution Strategy |
|------------|-------------------|
| `agent` | Sub-agent via `pi.sendUserMessage()` with `[babysitter:agent]` prefix |
| `node` | `execSync('node -e ...')` with 15-minute timeout |
| `shell` | `execSync(command)` with 15-minute timeout |
| `breakpoint` | User approval gate via `pi.sendMessage({ type: 'ask', options: ['Approve', 'Reject'] })` |
| `sleep` | `setTimeout` with absolute timestamp support via `schedulerHints.sleepUntilEpochMs` |
| `skill` | Dispatch through pi's command system via `pi.sendMessage()` |
| `orchestrator_task` | Sub-agent delegation via `pi.sendUserMessage()` with `[babysitter:orchestrator]` prefix |

Results are committed back to the run journal via the SDK's `commitEffectResult()` directly -- no CLI subprocess.

---

## Result Poster

The result poster (`plugins/babysitter-pi/extensions/babysitter/result-poster.ts`) provides a clean interface for committing effect results to the journal:

- `postResult(opts)` -- Full-featured result posting with stdout, stderr, timestamps
- `postOkResult(runDir, effectId, value)` -- Convenience for successful results
- `postErrorResult(runDir, effectId, error)` -- Convenience for failed results

All functions delegate to the SDK's `commitEffectResult()`.

---

## Skills

### SKILL.md (`plugins/babysitter-pi/skills/babysitter/SKILL.md`)

The babysitter skill for oh-my-pi follows the same pattern as other harnesses:

1. Reads SDK version from `versions.json` at the plugin root.
2. Installs `@a5c-ai/babysitter-sdk` globally for CLI access.
3. Runs `babysitter instructions:babysit-skill --harness oh-my-pi --interactive` (or `--no-interactive`) to generate the full orchestration playbook.
4. Follows the generated instructions to drive the run.

---

## Commands

The extension registers five slash commands in the `activate()` function:

| Command | Description |
|---------|-------------|
| `/babysitter:call` | Start a new orchestration run with a prompt. Creates run, binds to session, kicks off first iteration. |
| `/babysitter:status` | Show run status: process ID, status, iteration, elapsed time, pending effects list. Accepts optional run ID. |
| `/babysitter:resume` | Resume a stopped/interrupted run by ID. Re-binds to session, runs next iteration. |
| `/babysitter:doctor` | Diagnose run health: directory structure, lock files, journal integrity, state cache, SDK status, guard state. |
| `/babysitter:sync` | Manually synchronize todo widget state from the journal. Updates run widget and status line. |

Aliases: `/babysitter` and `/call` both map to `/babysitter:call`.

### Command Documentation Files

Each command has a corresponding markdown file under `plugins/babysitter-pi/commands/`:

| File | Command |
|------|---------|
| `babysitter-call.md` | `/babysitter:call` |
| `babysitter-status.md` | `/babysitter:status` |
| `babysitter-resume.md` | `/babysitter:resume` |
| `babysitter-doctor.md` | `/babysitter:doctor` |

---

## AGENTS.md

The behavioral contract (`plugins/babysitter-pi/AGENTS.md`) defines 9 sections governing agent behavior during active babysitter runs:

1. **Session Start** -- Auto-initialization: binds session to `.a5c/`, checks for active runs, resumes if found.
2. **Command Recognition** -- `/babysitter:*` dispatch table.
3. **Orchestration Protocol** -- Core loop: create run, iterate, execute effects, post results, repeat. The loop-driver controls iteration; agents must not loop independently.
4. **Effect Types** -- Per-kind execution table (agent, skill, shell, breakpoint, sleep). `node` is not presented as a PI-family generated effect kind.
5. **Posting Results** -- Use the plugin-owned bridge. Complete one phase per turn. Do not abort on single failures.
6. **Task Interception** -- Built-in task/todo tools are intercepted during active runs.
7. **TUI Widgets** -- Auto-updating status line, effect queue, progress indicator.
8. **Run Completion** -- Must output `<promise>PROOF_VALUE</promise>` with the SDK's completion proof.
9. **Directory Layout** -- Reference for `.a5c/runs/<RUN_ID>/` structure.

---

## Secure Sandbox

The secure sandbox (`packages/sdk/src/harness/piSecureSandbox.ts`) provides Docker-based command execution isolation for Pi-family harnesses.

### Configuration

| Setting | Env Variable | Default |
|---------|-------------|---------|
| Sandbox image | `BABYSITTER_PI_SANDBOX_IMAGE` | `node:22-bookworm` |
| Install strategy | `BABYSITTER_PI_SANDBOX_INSTALL_STRATEGY` | `download` |
| Container workspace | -- | `/workspace` |

### Sandbox Modes

The `PiSessionOptions.bashSandbox` option controls sandbox behavior:

| Mode | Behavior |
|------|----------|
| `local` | No sandbox; commands run natively (default) |
| `auto` | Attempt Docker sandbox; fall back to local on failure |
| `secure` | Require Docker sandbox; fail if unavailable |

### Architecture

1. **DockerSandboxAdapter** -- Manages a Docker container lifecycle:
   - Container name: `babysitter-pi-<pid>-<random>`
   - Workspace is bind-mounted from host to `/workspace` in the container
   - Supports `exec`, `writeFile`, `readFile`, `fileExists`, `stop`

2. **DockerSecureBashBackend** -- Wraps the adapter with AgentSH secure sandbox:
   - Lazy initialization on first command execution
   - `@agentsh/secure-sandbox` provides security policy enforcement
   - Adds a system prompt note explaining the sandbox to the agent

3. **Path mapping** -- Host paths are mapped to container paths. Only paths within the workspace are allowed; paths outside resolve to `/workspace`.

### Compaction Settings

When compression is enabled, the Pi wrapper configures compaction via environment-driven settings:

| Setting | Env Variable | Default |
|---------|-------------|---------|
| Compaction reserve tokens | `BABYSITTER_PI_COMPACTION_RESERVE_TOKENS` | 8,192 |
| Keep recent tokens | `BABYSITTER_PI_COMPACTION_KEEP_RECENT_TOKENS` | 12,288 |
| Branch summary reserve | `BABYSITTER_PI_BRANCH_SUMMARY_RESERVE_TOKENS` | 4,096 |

---

## Configuration

### Environment Variables

| Variable | Purpose | Used By |
|----------|---------|---------|
| `OMP_SESSION_ID` | Oh-my-pi session identifier | Adapter activation, session resolution |
| `OMP_PLUGIN_ROOT` | Oh-my-pi plugin installation root | Adapter activation, state dir resolution |
| `PI_SESSION_ID` | Pi session identifier (fallback) | Session resolution |
| `PI_PLUGIN_ROOT` | Pi plugin root (fallback) | State dir resolution |
| `BABYSITTER_STATE_DIR` | Override state directory | State dir resolution |
| `BABYSITTER_RUNS_DIR` | Run storage directory | Run directory resolution |
| `BABYSITTER_MAX_ITERATIONS` | Max iteration count | Guard configuration |
| `BABYSITTER_QUALITY_THRESHOLD` | Min quality score | Quality gate |
| `BABYSITTER_TIMEOUT` | General operation timeout | CLI timeout |
| `BABYSITTER_LOG_LEVEL` | Logging verbosity | Log configuration |
| `BABYSITTER_HOOK_TIMEOUT` | Per-hook timeout | Hook execution |
| `BABYSITTER_NODE_TASK_TIMEOUT` | Node task timeout | Effect execution |
| `BABYSITTER_CLI_PATH` | CLI binary path override | CLI wrapper |
| `BABYSITTER_PI_SANDBOX_IMAGE` | Docker sandbox image | Secure sandbox |
| `BABYSITTER_PI_SANDBOX_INSTALL_STRATEGY` | Sandbox install strategy | Secure sandbox |
| `BABYSITTER_PI_COMPACTION_RESERVE_TOKENS` | Compaction reserve | Session compaction |
| `BABYSITTER_PI_COMPACTION_KEEP_RECENT_TOKENS` | Keep recent tokens | Session compaction |
| `BABYSITTER_PI_BRANCH_SUMMARY_RESERVE_TOKENS` | Branch summary reserve | Session compaction |

### State Directory Resolution

The state directory is resolved in priority order:

1. Explicit `--state-dir` argument
2. `BABYSITTER_STATE_DIR` environment variable
3. Adjacent to plugin root: `<pluginRoot>/../.a5c`
4. Fallback: `.a5c` relative to CWD

### Plugin Root Resolution

Plugin root is resolved from:

1. Explicit `--plugin-root` argument
2. `OMP_PLUGIN_ROOT` environment variable
3. `PI_PLUGIN_ROOT` environment variable (fallback)

### Plugin Install Directories

| Harness | Plugin Root |
|---------|-------------|
| oh-my-pi | `~/.omp/plugins/babysitter` |
| pi | `~/.pi/plugins/babysitter` |

Workspace-scoped installs use `<workspace>/.omp/plugins/babysitter` or `<workspace>/.pi/plugins/babysitter`.

---

## Distribution

### Package

- **npm package**: `@a5c-ai/babysitter-pi`
- **Version**: 0.1.0
- **License**: MIT
- **Binary**: `babysitter-pi` (via `bin/cli.cjs`)
- **Peer dependency**: `@mariozechner/pi-coding-agent` (any version)
- **SDK dependency**: `@a5c-ai/babysitter-sdk` ^0.0.180

### Installation

**Install the oh-my-pi CLI itself:**

```bash
babysitter harness:install oh-my-pi
# or: npm install -g @oh-my-pi/pi-coding-agent
```

**Install the babysitter plugin for oh-my-pi:**

```bash
babysitter harness:install-plugin oh-my-pi
# or: npx @a5c-ai/babysitter-pi install --harness oh-my-pi
```

**Workspace-scoped installation:**

```bash
babysitter harness:install-plugin oh-my-pi --workspace /path/to/repo
# or: npx @a5c-ai/babysitter-pi install --harness oh-my-pi --workspace /path/to/repo
```

### Discovery

```bash
babysitter harness:discover --json
```

Oh-my-pi is detected by:
- **Installed discovery**: Probes for `omp` on PATH and `.omp` config directory
- **Caller detection**: Checks for `OMP_SESSION_ID` or `OMP_PLUGIN_ROOT` environment variables

### Config Detection

The discovery module checks for `.omp` directory in both CWD and the user's home directory.

---

## Extension Module Summary

| Module | File | Purpose |
|--------|------|---------|
| Entry point | `index.ts` | Wires all modules into ExtensionAPI events and commands |
| Constants | `constants.ts` | Centralized configuration constants and env var names |
| Types | `types.ts` | TypeScript interfaces for ExtensionAPI, RunState, effects, guards, widgets |
| SDK Bridge | `sdk-bridge.ts` | In-process SDK integration (replaces CLI wrapper) |
| CLI Wrapper | `cli-wrapper.ts` | **Deprecated** -- subprocess-based CLI invocation |
| Loop Driver | `loop-driver.ts` | agent_end handler driving orchestration iteration |
| Guards | `guards.ts` | Safety limits and doom-loop detection |
| Task Interceptor | `task-interceptor.ts` | Blocks built-in task/todo tools during active runs |
| Effect Executor | `effect-executor.ts` | Maps effect kinds to oh-my-pi execution capabilities |
| Result Poster | `result-poster.ts` | Posts effect results to journal via SDK |
| TUI Widgets | `tui-widgets.ts` | Run progress, effects queue, quality score panels |
| Status Line | `status-line.ts` | Compact status bar integration |
| Tool Renderer | `tool-renderer.ts` | Custom message renderers for babysitter message types |
| Custom Tools | `custom-tools.ts` | Registered tools: run_status, post_result, iterate |
| Todo Replacement | `todo-replacement.ts` | Journal-driven todo widget replacing native todos |

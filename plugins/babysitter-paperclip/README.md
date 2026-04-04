# @a5c-ai/babysitter-paperclip

Babysitter orchestration plugin for Paperclip AI. Integrates Babysitter's
deterministic, event-sourced orchestration with Paperclip's multi-agent
platform, providing run lifecycle management, breakpoint approval workflows,
and real-time observability through Paperclip's UI slot system.

## Installation

Install the Babysitter SDK CLI globally:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

Then install the plugin from the monorepo:

```bash
cd babysitter
npm install
npm run build --workspace=@a5c-ai/babysitter-paperclip
```

In Paperclip, register the plugin by pointing to the built `dist/` output or
by adding `@a5c-ai/babysitter-paperclip` to your Paperclip workspace plugin
list.

## Configuration

Settings are declared in the plugin manifest and configurable through
Paperclip's plugin settings UI:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `runsDir` | string | `.a5c/runs` | Directory where babysitter run data is stored |
| `autoIterate` | boolean | `true` | Automatically iterate runs when effects are resolved |
| `maxIterations` | number | `256` | Maximum orchestration iterations per run |
| `breakpointTimeout` | number | `3600000` | Time to wait for breakpoint approval (ms, default 1 hour) |

## Architecture Overview

### Delegating Adapter Model

Paperclip wraps multiple AI harnesses (Claude Code, Codex, Gemini CLI, Cursor,
GitHub Copilot, etc.). The plugin detects which underlying harness each agent
uses through a three-tier detection system:

1. **Agent metadata (high confidence)** -- Maps the Paperclip agent
   `adapterType` field to a babysitter harness name. Known mappings:

   | Paperclip adapterType | Babysitter harness |
   |-----------------------|-------------------|
   | `claude_local` | `claude-code` |
   | `codex_local` | `codex` |
   | `gemini_local` | `gemini-cli` |
   | `cursor_local` | `cursor` |
   | `github_copilot` | `github-copilot` |
   | `opencode_local` | `opencode` |
   | `pi_local` | `pi` |
   | `omp_local` | `oh-my-pi` |

2. **Environment variable probing (medium confidence)** -- Checks for known
   harness signatures: `CLAUDE_CODE_SESSION`, `CODEX_SESSION`,
   `GEMINI_CLI_SESSION`, `CURSOR_SESSION`, etc.

3. **Plugin config fallback (medium confidence)** -- Uses the `defaultHarness`
   setting. If nothing matches, defaults to `claude-code` with low confidence.

### Worker

The worker (`src/worker.ts`) is the server-side entry point. It registers:

- **Event handlers** for `agent.run.started`, `agent.run.finished`,
  `agent.run.failed`, and `agent.run.cancelled` lifecycle events
- **Data handlers** for `runs-overview`, `run-detail`, and
  `pending-breakpoints` queries
- **Action handlers** for `approve-breakpoint`, `reject-breakpoint`, and
  `create-run` operations
- **Stream handler** for `subscribe-run-events` (real-time journal events)
- **Tool** `babysitter-status` -- available to agents for checking run state

All babysitter operations go through the CLI bridge (`src/babysitter-bridge.ts`)
which shells out to the `babysitter` CLI with `--json` output.

### UI Components

The plugin registers three UI slots in Paperclip:

| Slot Type | Component | Description |
|-----------|-----------|-------------|
| `dashboardWidget` | `BabysitterDashboard` | Active runs overview with pending breakpoint badge count |
| `detailTab` | `RunDetailTab` | Journal timeline view with breakpoint approval/rejection forms (scoped to agent entities) |
| `sidebarPanel` | `BabysitterSidebar` | Compact run status sidebar |

## Event Flow

```
                          Paperclip Platform
  +----------------------------------------------------------+
  |                                                          |
  |  Agent starts run                                        |
  |       |                                                  |
  |       v                                                  |
  |  agent.run.started -----> Worker: detectHarness()        |
  |                                |                         |
  |                                v                         |
  |                           Store harness                  |
  |                           detection in                   |
  |                           plugin state                   |
  +----------------------------------------------------------+
              |
              | (babysitter CLI bridge)
              v
  +----------------------------------------------------------+
  |              Babysitter Orchestration                     |
  |                                                          |
  |  run:create  --->  run:iterate  --->  Pending effects?   |
  |                                          |               |
  |                        +---------+-------+-------+       |
  |                        |         |               |       |
  |                   breakpoint   task           sleep      |
  |                        |         |               |       |
  +------------------------|---------+---------------|-------+
                           |                         |
              +------------|-------------------------+
              |            v
  +-----------|-------------------------------------------------+
  |           |         Paperclip UI                             |
  |           v                                                  |
  |  Worker streams pending breakpoint to UI                     |
  |       |                                                      |
  |       v                                                      |
  |  RunDetailTab renders approval form                          |
  |  BabysitterDashboard shows badge count                       |
  |       |                                                      |
  |       v                                                      |
  |  User clicks Approve / Reject                                |
  |       |                                                      |
  |       v                                                      |
  |  Action handler: approve-breakpoint / reject-breakpoint      |
  |       |                                                      |
  +-------|----------------------------------------------------- +
          |
          | (babysitter CLI bridge)
          v
  +----------------------------------------------------------+
  |  babysitter task:post <runDir> <effectId>                 |
  |    --status ok                                           |
  |    --value-inline '{"approved": true}'       (approve)   |
  |    --value-inline '{"approved": false,       (reject)    |
  |                     "feedback": "..."}'                  |
  |                                                          |
  |  EFFECT_RESOLVED appended to journal                     |
  |  Next iteration replays with resolved effect             |
  +----------------------------------------------------------+
```

### Breakpoint Flow (Critical Detail)

Both approval and rejection use `--status ok` when posting via `task:post`.
The distinction is in the value payload:

- **Approve**: `{ approved: true, response: "..." }`
- **Reject**: `{ approved: false, feedback: "..." }`

This matches babysitter's breakpoint contract where `BreakpointResult.approved`
controls the process branch, not the task status. Never use `--status error`
for rejections.

When `autoIterate` is enabled (default), the worker automatically calls
`run:iterate` after resolving a breakpoint so the process continues without
manual intervention.

## Plugin Events

The plugin emits custom events on the Paperclip event bus:

| Event | When |
|-------|------|
| `plugin.babysitter.run.created` | A new babysitter run is created via the `create-run` action |
| `plugin.babysitter.breakpoint.requested` | A breakpoint effect is pending approval |
| `plugin.babysitter.breakpoint.resolved` | A breakpoint is approved or rejected |

## Troubleshooting

### "babysitter" CLI not found

The plugin shells out to the `babysitter` CLI. Ensure it is installed globally
and available on `PATH`:

```bash
npm install -g @a5c-ai/babysitter-sdk
babysitter version
```

### Runs directory not found

The default `runsDir` is `.a5c/runs` relative to the workspace. If your
project uses a different path, update the plugin setting or set the
`BABYSITTER_RUNS_DIR` environment variable.

### Harness detection shows "fallback" / low confidence

The plugin could not determine which underlying harness the agent uses. Either:
1. Set the agent's `adapterType` field in Paperclip to one of the known values
   (e.g., `claude_local`, `codex_local`)
2. Set the `defaultHarness` plugin config to your preferred harness name
3. Ensure the harness CLI sets its expected environment variables

### Breakpoint times out

The default breakpoint timeout is 1 hour (3,600,000 ms). Increase the
`breakpointTimeout` setting if your workflow requires longer approval windows.

### State cache mismatch

If run status appears stale, rebuild the state cache:

```bash
babysitter run:rebuild-state .a5c/runs/<runId>
```

### Journal corruption

Repair a corrupted journal:

```bash
babysitter run:repair-journal .a5c/runs/<runId>
```

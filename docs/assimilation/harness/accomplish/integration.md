# Babysitter + Accomplish Integration Guide

## What is Accomplish?

[Accomplish AI](https://github.com/accomplish-ai/accomplish) is an Electron desktop application for AI-assisted software development. It spawns [OpenCode](https://opencode.ai) as a subprocess to execute AI coding tasks, providing a rich desktop UI around the agent interaction -- including task management, permission dialogs, and a conversation view.

Babysitter integrates with Accomplish through the OpenCode plugin system. When babysitter is installed, Accomplish gains:

- **Structured orchestration** -- multi-phase task execution with deterministic replay
- **Breakpoint approval gates** -- human-in-the-loop decisions resolved conversationally via Accomplish's `ask-user-question` MCP tool
- **Progress visibility** -- phase progress, iteration counts, and pending effects visible in the agent conversation

---

## Prerequisites

1. **Babysitter SDK** installed globally or in your project:
   ```bash
   npm install -g @a5c-ai/babysitter
   # or
   npm install @a5c-ai/babysitter
   ```

2. **[Accomplish AI](https://github.com/accomplish-ai/accomplish)** installed and set up on your machine. The installer auto-detects Accomplish by checking for the platform-specific data directory:
   - **macOS**: `~/Library/Application Support/Accomplish/`
   - **Windows**: `%APPDATA%/Accomplish/`
   - **Linux**: `~/.config/Accomplish/`

3. **OpenCode** -- bundled with Accomplish; no separate installation needed.

---

## Installation

### Automatic (recommended)

The babysitter plugin installer auto-detects Accomplish when present:

```bash
babysitter plugin:install babysitter --global
```

This performs two installations in one step:
1. Installs the OpenCode plugin to `~/.opencode/plugins/babysitter/` (standard OpenCode)
2. Detects Accomplish and copies the plugin to `<accomplishDataDir>/opencode/plugins/babysitter/`

### Accomplish-only install

To install exclusively to the Accomplish data directory without touching the standard OpenCode paths:

```bash
cd plugins/babysitter-opencode
node bin/install.cjs --accomplish
```

### Manual install

Copy the plugin bundle manually:

```bash
# Determine your Accomplish data directory
# macOS:   ~/Library/Application Support/Accomplish/opencode/plugins/babysitter/
# Windows: %APPDATA%/Accomplish/opencode/plugins/babysitter/
# Linux:   ~/.config/Accomplish/opencode/plugins/babysitter/

cp -r plugins/babysitter-opencode/* <accomplishDataDir>/opencode/plugins/babysitter/
```

After any installation method, restart Accomplish to pick up the plugin.

---

## How It Works

### Plugin auto-discovery

Accomplish spawns OpenCode with its data directory as the working context. OpenCode discovers plugins by scanning `.opencode/plugins/` for JS modules. The babysitter plugin registers itself via `index.js`, which exports hooks for the OpenCode plugin system:

- `session.created` -- initializes babysitter session state
- `session.idle` -- handles iteration orchestration
- `shell.env` -- injects `BABYSITTER_SESSION_ID` and other env vars
- `tool.execute.before` / `tool.execute.after` -- pre/post tool hooks

### Hook lifecycle within Accomplish

```
Accomplish spawns OpenCode subprocess
  |
  v
OpenCode loads babysitter plugin (index.js)
  |
  v
session.created hook fires
  |-- Creates session state file
  |-- Detects ACCOMPLISH_TASK_ID from env
  |-- Stores task correlation in session metadata
  |
  v
User invokes /babysitter skill (or agent triggers it)
  |
  v
babysitter run:create
  |-- Creates .a5c/runs/<runId>/ directory
  |-- Writes run-status JSON to IPC directory
  |-- Session state updated with runId
  |
  v
babysitter run:iterate (loop)
  |-- Replays journal, executes process
  |-- On pending effects: agent handles them
  |-- On breakpoints:
  |     |
  |     v
  |   Agent uses ask-user-question MCP tool
  |   User approves/rejects in Accomplish conversation
  |     |
  |     v
  |   babysitter task:post resolves the breakpoint
  |
  v
Run completes or fails
```

### Session binding

When running inside Accomplish, the adapter detects `ACCOMPLISH_TASK_ID` and stores it in the session state's `metadata` field:

```typescript
// SessionState.metadata
{
  accomplishTaskId: "task_abc123"
}
```

This correlation allows the Accomplish daemon to match babysitter runs to its own task records.

---

## Using the /babysitter Skill in Accomplish

Once the plugin is installed, the `/babysitter` skill is available in Accomplish's agent conversation. It orchestrates complex multi-step tasks:

1. **Invoke**: Type `/babysitter` in the Accomplish conversation, or let the agent invoke it for multi-step tasks
2. **Run creation**: The skill creates a structured run with phased execution
3. **Progress reporting**: Each iteration updates Accomplish's UI with current phase and progress
4. **Breakpoints**: Human approval gates appear as native Accomplish dialogs -- approve, reject, or provide feedback without leaving the app
5. **Completion**: Results and artifacts are available in `.a5c/runs/<runId>/`

### Additional skills

- `/accomplish-status` -- Manually trigger a status update to the Accomplish UI for a specific run

---

## Environment Variables

| Variable | Set by | Description |
|----------|--------|-------------|
| `ACCOMPLISH_TASK_ID` | Accomplish | Correlation ID linking the OpenCode session to an Accomplish task. Set automatically when Accomplish spawns the subprocess. |
| `OPENCODE_CONFIG` | OpenCode | Path to OpenCode configuration file |
| `OPENCODE_CONFIG_DIR` | Accomplish/OpenCode | OpenCode config directory; when set, its parent is treated as the Accomplish data directory |
| `BABYSITTER_STATE_DIR` | User/Plugin | Override for babysitter state directory (default: `.a5c`) |
| `BABYSITTER_SESSION_ID` | Plugin (shell.env hook) | Session ID injected by the babysitter plugin for cross-harness session tracking |
| `OPENCODE_PLUGIN_ROOT` | Plugin (shell.env hook) | Plugin root directory for babysitter plugin discovery |

---

## How Breakpoints Work

When the orchestration reaches a breakpoint (human approval gate), the agent resolves it conversationally using Accomplish's `ask-user-question` MCP tool:

1. `babysitter run:iterate` returns with a pending breakpoint effect
2. The agent reads the breakpoint details (title, question, options)
3. The agent calls the `ask-user-question` MCP tool to present the decision to the user
4. The user responds in the Accomplish conversation UI
5. The agent posts the resolution: `babysitter task:post <runDir> <effectId> --status ok --value-inline '{"approved": true}'`
6. The next iteration picks up the resolved breakpoint and continues

This works without any changes to the Accomplish codebase. The user experience is conversational rather than a dedicated dialog, but fully functional.

---

## Troubleshooting

### Plugin not detected by Accomplish

**Symptoms**: `/babysitter` skill not available in Accomplish conversation; no babysitter hooks firing.

**Steps**:
1. Verify the plugin directory exists:
   - macOS: `ls ~/Library/Application\ Support/Accomplish/opencode/plugins/babysitter/`
   - Windows: `dir %APPDATA%\Accomplish\opencode\plugins\babysitter\`
   - Linux: `ls ~/.config/Accomplish/opencode/plugins/babysitter/`
2. Verify `index.js` and `plugin.json` exist in that directory
3. Restart Accomplish completely (quit and relaunch, not just close the window)
4. Check Accomplish logs for plugin loading errors

### Breakpoints not being presented to the user

**Symptoms**: Babysitter run reaches a breakpoint but the agent doesn't ask for approval.

**Steps**:
1. Check that the run has pending breakpoints: `babysitter task:list .a5c/runs/<runId> --pending`
2. Verify the agent is handling breakpoint effects by calling `ask-user-question` MCP tool
3. If using the `/babysitter` skill, ensure the skill instructions are loaded correctly
4. Check that `ACCOMPLISH_TASK_ID` is set: the agent uses this to correlate the session

### Run stuck or state inconsistent

**Steps**:
```bash
# Rebuild derived state from journal
babysitter run:rebuild-state .a5c/runs/<runId>

# Repair journal integrity
babysitter run:repair-journal .a5c/runs/<runId>

# Full diagnostic
babysitter harness:doctor --run-id <runId>
```

### ACCOMPLISH_TASK_ID not set

If `ACCOMPLISH_TASK_ID` is not in the environment, babysitter still works normally -- it just cannot correlate runs with specific Accomplish tasks. Runs execute, breakpoints are resolved conversationally, and results are available in `.a5c/runs/`.

Verify Accomplish is setting this variable when spawning OpenCode. This is an Accomplish-side configuration.

---

## Architecture Reference

| Component | Path | Purpose |
|-----------|------|---------|
| OpenCode adapter | `packages/sdk/src/harness/opencode.ts` | Accomplish detection, `ACCOMPLISH_TASK_ID` handling, data dir resolution, session metadata |
| Discovery module | `packages/sdk/src/harness/discovery.ts` | Caller detection via env vars including `ACCOMPLISH_TASK_ID` |
| Installer (shared) | `plugins/babysitter-opencode/bin/install-shared.cjs` | Accomplish detection, plugin bundle copy, surface installation |
| Installer (entry) | `plugins/babysitter-opencode/bin/install.cjs` | CLI entry point with `--accomplish` flag |
| `/babysitter` skill (Accomplish format) | `plugins/babysitter-opencode/accomplish-skills/babysitter/SKILL.md` | Orchestration skill formatted for Accomplish's skill system |
| `/accomplish-status` skill | `plugins/babysitter-opencode/skills/accomplish-status/SKILL.md` | Run status reporting |
| Session types | `packages/sdk/src/session/types.ts` | `SessionState.metadata` field for `accomplishTaskId` correlation |

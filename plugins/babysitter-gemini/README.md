# @a5c-ai/babysitter-gemini

Babysitter integration package for Gemini CLI.

This package ships a Gemini CLI extension bundle:

- `gemini-extension.json` — Gemini CLI extension manifest
- `GEMINI.md` — Orchestration context file loaded into every agent session
- `commands/` — Slash command definitions for all babysitter workflows
- `hooks/` — SessionStart and AfterAgent hook scripts
- `bin/cli.js` — `babysitter-gemini` installer CLI

It uses the Babysitter SDK CLI and the shared `~/.a5c` process-library state.
The extension registers the hooks and commands so Gemini CLI can drive the
Babysitter orchestration loop from within the agent session.

## Installation

Install the SDK CLI first:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

Then install the Gemini extension globally:

```bash
npm install -g @a5c-ai/babysitter-gemini
babysitter-gemini install --global
```

Or install to a specific workspace only:

```bash
babysitter-gemini install --workspace /path/to/project
```

For development, use a symlink instead of copying files:

```bash
babysitter-gemini install --symlink
```

Alternatively, install through the SDK harness helper:

```bash
babysitter harness:install-plugin gemini-cli
```

After installation, restart Gemini CLI to activate the extension.

## How It Works

The plugin implements a hook-driven orchestration loop:

1. `SessionStart` fires when a new Gemini CLI session begins. It ensures the
   correct SDK CLI version is installed (pinned via `versions.json`) and
   initializes session state under `.a5c/state/`.

2. The `GEMINI.md` context file is loaded into every session, instructing the
   agent on the full 8-step orchestration workflow — from interviewing the user
   and creating a process definition through iterating effects and posting results.

3. The agent performs **one orchestration phase per turn**, then stops.

4. `AfterAgent` fires after every agent turn. It checks whether a babysitter run
   is bound to the current session. If the run is not yet complete, the hook
   returns `{"decision":"block","reason":"...","systemMessage":"..."}` to keep
   the session alive and inject the next iteration prompt. Once the agent emits
   `<promise>COMPLETION_PROOF</promise>`, the hook allows the session to exit.

## Hook Types

| Hook | Gemini CLI Event | Script | Purpose |
|------|-----------------|--------|---------|
| Session initialization | `SessionStart` | `hooks/session-start.sh` | Installs the correct SDK version, creates session state |
| Continuation loop | `AfterAgent` | `hooks/after-agent.sh` | Blocks session exit and drives the orchestration loop until the run completes |

Both hooks delegate to the SDK CLI via `babysitter hook:run` for all business
logic. The shell scripts handle SDK version bootstrapping and stdin capture only.

## Available Commands

All 15 commands follow the orchestration workflow described in `GEMINI.md`.
Invoke them in Gemini CLI with `/babysitter:<command>`.

### Primary Orchestration Commands

| Command | Description |
|---------|-------------|
| `/babysitter:call [instructions]` | Start a babysitter-orchestrated run. Interviews you (interactive) or parses the prompt (non-interactive), creates a process definition, then executes it step by step. |
| `/babysitter:plan [instructions]` | Generate a detailed execution plan without running anything. Stops after Phase 1. |
| `/babysitter:yolo [instructions]` | Start a run in fully autonomous mode — all breakpoints are auto-approved, no user interaction requested. |
| `/babysitter:forever [instructions]` | Start a run that loops indefinitely with sleep intervals between iterations. |
| `/babysitter:resume [run-id]` | Resume a paused or interrupted run. If no run ID is given, discovers all runs under `.a5c/runs/` and suggests which to continue. |

### Diagnostic and Analysis Commands

| Command | Description |
|---------|-------------|
| `/babysitter:doctor [run-id]` | Run a 10-point health check on a run: journal integrity, state cache consistency, effect status, lock status, session state, log analysis, disk usage, process validation, and hook execution health. |
| `/babysitter:retrospect [run-id...]` | Analyze completed runs and suggest process improvements. Supports single run, multiple IDs, or `--all` for aggregate cross-run analysis. |

### Lifecycle Management Commands

| Command | Description |
|---------|-------------|
| `/babysitter:assimilate [target]` | Convert an external methodology, harness, or specification into native babysitter process definitions with skills and agents. Accepts a repo URL, harness name, or spec path. |
| `/babysitter:cleanup [--dry-run] [--keep-days N]` | Aggregate insights from completed/failed runs into `docs/run-history-insights.md`, then remove old run data. Defaults to keeping runs newer than 7 days. |
| `/babysitter:observe [--watch-dir dir]` | Launch the real-time observer dashboard (`@a5c-ai/babysitter-observer-dashboard`) and open it in the browser. |

### Setup Commands

| Command | Description |
|---------|-------------|
| `/babysitter:user-install` | First-time onboarding — installs dependencies, interviews you about specialties and preferences, and builds your user profile at `~/.a5c/user-profile.json`. |
| `/babysitter:project-install` | Onboard a project — researches the codebase, builds the project profile, installs recommended tools, and optionally configures CI/CD. |

### Plugin and Community Commands

| Command | Description |
|---------|-------------|
| `/babysitter:plugins [action]` | Manage babysitter plugins: list installed plugins, install from marketplace, update, uninstall, or configure. |
| `/babysitter:contrib [feedback]` | Submit a bug report, feature request, bugfix PR, library contribution, or documentation answer to the babysitter project. |
| `/babysitter:help [topic]` | Show help for babysitter commands, processes, skills, agents, or methodologies. Pass a topic like `command call` or `process tdd-quality-convergence` for targeted docs. |

## Available Skills

The GEMINI.md context file provides 16 built-in orchestration skills. These are
invoked implicitly when the agent follows the orchestration workflow — they are
not separate slash commands but capability areas described in the context file.

| Skill | Description |
|-------|-------------|
| User interview | Gather intent, requirements, and scope via `ask_user` (interactive) or prompt parsing (non-interactive) |
| User profile integration | Read and apply `~/.a5c/user-profile.json` to calibrate breakpoint density, tool preferences, and communication style |
| Process discovery | Find relevant processes in `.a5c/processes/`, the active process library, and `specializations/`/`methodologies/` |
| Process creation | Build custom JS process definitions with `@skill`/`@agent` markers, mermaid diagrams, and documentation |
| Run creation | Create a run with session binding via `babysitter run:create --harness gemini-cli --session-id "${GEMINI_SESSION_ID}"` |
| Run resumption | Resume an existing run via `babysitter session:resume` |
| Run iteration | Drive the orchestration loop with `babysitter run:iterate` |
| Effect listing | Enumerate pending effects via `babysitter task:list --pending` |
| Effect execution | Execute effects externally via `@agent` sub-agent delegation or direct shell commands |
| Breakpoint handling | Present approval gates to the user via `ask_user` (interactive) or auto-resolve (non-interactive) |
| Result posting | Post task outcomes via `babysitter task:post --status ok --value <file>` |
| Completion proof | Emit `<promise>COMPLETION_PROOF</promise>` when the run completes to allow the AfterAgent hook to unblock |
| State recovery | Repair corrupted state with `babysitter run:rebuild-state` and `babysitter run:repair-journal` |
| Process library binding | Resolve or initialize the active process library with `babysitter process-library:active` |
| Profile management | Read and write user/project profiles via `babysitter profile:read|write|merge|render` |
| Sub-agent delegation | Delegate tasks to Gemini CLI sub-agents using `@agent` prompts |

## Configuration

The extension reads configuration from the following locations:

| Source | Purpose |
|--------|---------|
| `versions.json` | Pins the required `@a5c-ai/babysitter-sdk` version. Read by hooks at startup. |
| `gemini-extension.json` | Gemini CLI extension manifest. Sets `contextFileName: "GEMINI.md"`. |
| `plugin.json` | Babysitter plugin manifest. Declares hooks, commands, and harness (`gemini-cli`). |
| `GEMINI_EXTENSION_PATH` env var | Path to the installed extension root. Set automatically by Gemini CLI. Falls back to the directory containing the hook script. |
| `BABYSITTER_LOG_DIR` env var | Override the log directory. Defaults to `~/.a5c/logs`. |
| `.a5c/state/` | Session state directory. Created automatically by the SessionStart hook. |
| `~/.a5c/user-profile.json` | User profile for personalizing orchestration (breakpoint density, tool preferences, communication style). |

## Verification

Verify the installed extension bundle:

```bash
babysitter-gemini status --global
```

Or check the files directly:

```bash
test -d ~/.gemini/extensions/babysitter-gemini
test -f ~/.gemini/extensions/babysitter-gemini/gemini-extension.json
test -f ~/.gemini/extensions/babysitter-gemini/GEMINI.md
test -f ~/.gemini/extensions/babysitter-gemini/hooks/session-start.sh
test -f ~/.gemini/extensions/babysitter-gemini/hooks/after-agent.sh
```

Verify the SDK CLI is available:

```bash
babysitter --version
```

Verify the active process-library binding:

```bash
babysitter process-library:active --json
```

## Workspace Output

After `babysitter-gemini install --workspace <path>`, the extension is placed at:

- `<workspace>/.gemini/extensions/babysitter-gemini/gemini-extension.json`
- `<workspace>/.gemini/extensions/babysitter-gemini/GEMINI.md`
- `<workspace>/.gemini/extensions/babysitter-gemini/hooks/session-start.sh`
- `<workspace>/.gemini/extensions/babysitter-gemini/hooks/after-agent.sh`
- `<workspace>/.gemini/extensions/babysitter-gemini/commands/`

## Troubleshooting

### SDK CLI not found after session start

The SessionStart hook installs the SDK automatically, but if permissions prevent
a global install it falls back to `~/.local/bin`. Check the session-start log:

```bash
cat ~/.a5c/logs/babysitter-session-start-hook.log
```

If the CLI is still missing, install it manually:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

### AfterAgent hook not firing

Confirm the extension is installed and Gemini CLI has been restarted since
installation. Check that `gemini-extension.json` is present:

```bash
test -f ~/.gemini/extensions/babysitter-gemini/gemini-extension.json && echo "OK"
```

### Run stuck in loop / hook always blocking

The AfterAgent hook blocks until it detects `<promise>COMPLETION_PROOF</promise>`
in the agent's output. If a run is stuck, check whether it has completed:

```bash
babysitter run:status .a5c/runs/<runId> --json
```

If the run failed or the journal is corrupted, repair it:

```bash
babysitter run:rebuild-state .a5c/runs/<runId>
babysitter run:repair-journal .a5c/runs/<runId>
```

Or run the diagnostic command from within Gemini CLI:

```
/babysitter:doctor <runId>
```

### SDK version mismatch

The SessionStart hook checks `versions.json` and upgrades the SDK if the
installed version does not match. Check the hook log for version details:

```bash
cat ~/.a5c/logs/babysitter-session-start-hook.log | grep version
```

To force a reinstall to the pinned version:

```bash
SDK_VERSION=$(node -e "console.log(require(require('os').homedir()+'/.gemini/extensions/babysitter-gemini/versions.json').sdkVersion)")
npm install -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}"
```

### Process library not bound

If commands report that no active process-library binding exists, initialize one:

```bash
babysitter process-library:active --json
```

If that returns nothing, clone the library:

```bash
babysitter process-library:clone --dir .a5c/process-library/babysitter-repo
```

### Hook logs location

| Log file | Contents |
|----------|----------|
| `~/.a5c/logs/babysitter-session-start-hook.log` | SessionStart hook output |
| `~/.a5c/logs/babysitter-session-start-hook-stderr.log` | SessionStart SDK stderr |
| `~/.a5c/logs/babysitter-after-agent-hook.log` | AfterAgent hook output |
| `~/.a5c/logs/babysitter-after-agent-hook-stderr.log` | AfterAgent SDK stderr |

## License

MIT

# @a5c-ai/babysitter-openclaw

Babysitter orchestration plugin for [OpenClaw](https://openclaw.dev), the daemon-based AI coding agent.

This package provides full Babysitter integration through OpenClaw's programmatic plugin API:

- **Programmatic hooks** via `api.on()` for session lifecycle and orchestration control
- **Skills** for process orchestration, diagnostics, and project management
- **Slash commands** forwarding to skills through OpenClaw's extension system
- **SDK-managed** process-library bootstrapping and state management

The SDK (`@a5c-ai/babysitter-sdk`) remains the single source of truth for orchestration, runs, tasks, replay, and state. This plugin is a thin adapter layer.

## Installation

### Primary: Babysitter Marketplace

```bash
babysitter plugin:install babysitter-openclaw
```

### Secondary: npm

```bash
npm install -g @a5c-ai/babysitter-openclaw
```

The `postinstall` script registers the plugin globally. To install into a specific workspace:

```bash
npx @a5c-ai/babysitter-openclaw install --workspace /path/to/repo
```

### Verify Installation

```bash
babysitter harness:discover --json
babysitter plugin:list-installed --json
```

### Removal

```bash
npm uninstall -g @a5c-ai/babysitter-openclaw
```

Or via the marketplace:

```bash
babysitter plugin:uninstall babysitter-openclaw
```

## Architecture

### Daemon Model vs CLI Model

Most Babysitter harness plugins (Claude Code, Codex, Cursor) integrate with CLI-based agents that follow a **stop-hook model**: the agent runs, stops, a hook fires synchronously, and the agent resumes. This creates a natural iteration boundary.

OpenClaw is a **daemon-based harness**. It runs as a persistent process and exposes a programmatic plugin API rather than a filesystem-based hook surface. This changes the orchestration model:

| Aspect | CLI Harnesses (Claude Code, Codex) | OpenClaw (Daemon) |
|--------|-------------------------------------|-------------------|
| Agent lifecycle | Start, run, stop | Persistent daemon |
| Hook mechanism | Shell scripts via `hooks.json` | Programmatic `api.on()` callbacks |
| Iteration boundary | `Stop` hook (synchronous) | `agent_end` event (fire-and-forget) |
| Prompt injection | `UserPromptSubmit` hook | `before_prompt_build` callback |
| Session management | Implicit via CLI invocations | Explicit `session_start` / `session_end` events |

### How Orchestration Works

1. **Session starts** -- `session_start` hook fires, initializing Babysitter state via `babysitter hook:run --hook-type session-start --harness openclaw`.
2. **Each agent turn begins** -- `before_prompt_build` hook injects orchestration context (active run state, pending tasks, iteration instructions) into the prompt.
3. **Each agent turn ends** -- `agent_end` hook fires asynchronously (fire-and-forget via `spawn` + `unref`), triggering `babysitter hook:run --hook-type stop --harness openclaw` to advance the orchestration iteration.
4. **Session ends** -- `session_end` hook finalizes any active Babysitter runs.

The `agent_end` handler intentionally uses `spawn` with `unref()` rather than `execFileSync` so it does not block the next agent turn. Errors are logged to `$BABYSITTER_LOG_DIR/babysitter-agent-end-hook.log` but never propagate to the agent.

### Dual Hook Surface

The plugin ships both:

- **Programmatic hooks** (`extensions/hooks/*.ts`) -- registered via `api.on()` in `extensions/index.ts`. These are the primary integration path for OpenClaw's native plugin API.
- **Shell hooks** (`hooks/babysitter-session-start.sh`, `hooks/babysitter-stop-hook.sh`) -- declared in `hooks.json` for compatibility with harnesses that use the filesystem-based hook surface.

Both surfaces delegate to the same `babysitter hook:run` CLI commands.

## Capabilities

The OpenClaw adapter declares the following harness capabilities:

| Capability | Supported | Notes |
|------------|-----------|-------|
| **SessionBinding** | Yes | Binds runs to OpenClaw sessions via `session_start` / `session_end` |
| **Mcp** | Yes | MCP server integration via `babysitter mcp:serve` |
| **HeadlessPrompt** | Yes | Programmatic prompt submission via `api.sendUserMessage()` |
| **StopHook** | No | OpenClaw uses `agent_end` + `before_prompt_build` instead of a synchronous stop-hook model |

## Available Commands

The extension registers 17 slash commands (15 named commands plus `/babysit` and `/babysitter`). Each command forwards to its corresponding skill via OpenClaw's `/skill:<name>` mechanism.

| Command | Alias | Description |
|---------|-------|-------------|
| `/babysit` | `/babysitter` | Load the Babysitter orchestration skill |
| `/call` | `/babysitter:call` | Start orchestrating a complex workflow |
| `/plan` | `/babysitter:plan` | Plan a workflow without executing it |
| `/resume` | `/babysitter:resume` | Resume an existing orchestration run |
| `/yolo` | `/babysitter:yolo` | Run in non-interactive mode (no breakpoints) |
| `/forever` | `/babysitter:forever` | Start a never-ending orchestration loop |
| `/doctor` | `/babysitter:doctor` | Diagnose run health (journal, state, locks) |
| `/observe` | `/babysitter:observe` | Launch the real-time observer dashboard |
| `/retrospect` | `/babysitter:retrospect` | Analyze past runs for improvements |
| `/cleanup` | `/babysitter:cleanup` | Clean up old runs and aggregate insights |
| `/assimilate` | `/babysitter:assimilate` | Convert external methodologies into processes |
| `/contrib` | `/babysitter:contrib` | Submit feedback or contributions |
| `/help` | `/babysitter:help` | Babysitter documentation and usage help |
| `/plugins` | `/babysitter:plugins` | Manage Babysitter plugins |
| `/user-install` | `/babysitter:user-install` | Set up Babysitter for your user profile |
| `/project-install` | `/babysitter:project-install` | Onboard a project for Babysitter orchestration |

Every named command also has a `babysitter:` prefixed alias (e.g., `/babysitter:call`).

## Available Skills

Skills are defined in `skills/` and exposed through OpenClaw's skill system:

| Skill | Description |
|-------|-------------|
| **babysit** | Core orchestration skill -- iterates `.a5c/runs/<runId>/` through the deterministic replay loop |
| **call** | Start a new orchestrated run for a complex workflow |
| **plan** | Create and refine a process definition without executing it |
| **resume** | Resume an incomplete run, auto-discovering candidates if none specified |
| **yolo** | Non-interactive orchestration with no breakpoints or user prompts |
| **forever** | Infinite-loop process (e.g., periodic task polling with `ctx.sleep`) |
| **doctor** | Diagnose run health -- journal integrity, state cache, effects, locks, disk usage |
| **observe** | Launch the browser-based observer dashboard for real-time run monitoring |
| **retrospect** | Post-run analysis with suggestions for process improvements |
| **cleanup** | Aggregate insights from completed/failed runs, then remove old data |
| **assimilate** | Convert external methodologies or specifications into Babysitter process definitions |
| **contrib** | Submit feedback or contribute to the Babysitter project |
| **help** | Documentation and usage guidance for commands, processes, and methodologies |
| **plugins** | List, install, configure, update, or uninstall Babysitter plugins |
| **user-install** | Guided user onboarding -- profile setup, dependency installation, preferences |
| **project-install** | Guided project onboarding -- codebase analysis, profile setup, CI/CD configuration |

## Hook System

OpenClaw hooks are registered programmatically in `extensions/index.ts` via `api.on()`. Each hook delegates to the Babysitter SDK CLI.

### session_start

**File:** `extensions/hooks/session-start.ts`
**Maps to:** `babysitter hook:run --hook-type session-start --harness openclaw`

Fires when an OpenClaw session begins. Initializes Babysitter state, ensures the CLI is available (falls back to `npx` if not installed globally), and sets up the state directory. Runs synchronously with a 30-second timeout (60 seconds for `npx` fallback). Errors are logged but do not block the session.

### session_end

**File:** `extensions/hooks/session-end.ts`
**Maps to:** `babysitter hook:run --hook-type stop --harness openclaw`

Fires on session teardown. Finalizes any active Babysitter runs. Same synchronous execution model as `session_start`.

### before_prompt_build

**File:** `extensions/hooks/before-prompt-build.ts`
**Maps to:** `babysitter hook:run --hook-type user-prompt-submit --harness openclaw`

Fires before OpenClaw assembles the system/user prompt for each agent turn. This is the primary orchestration injection point -- Babysitter returns JSON context containing iteration instructions, active run state, and pending task information. The return value is merged into the prompt context. Runs synchronously.

### agent_end

**File:** `extensions/hooks/agent-end.ts`
**Maps to:** `babysitter hook:run --hook-type stop --harness openclaw`

Fires after each agent turn completes. This is the iteration driver -- it triggers Babysitter to advance the orchestration loop. Unlike other hooks, this runs **asynchronously** (fire-and-forget via `spawn` + `child.unref()`) so it does not block the next agent turn. Stderr is collected for diagnostic logging.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BABYSITTER_STATE_DIR` | `.a5c` (cwd-relative) | State directory for run storage and session data |
| `BABYSITTER_LOG_DIR` | `~/.a5c/logs` | Directory for hook execution logs |
| `BABYSITTER_RUNS_DIR` | `.a5c/runs` | Root directory for run storage |
| `BABYSITTER_GLOBAL_STATE_DIR` | `~/.a5c` | Global state directory |
| `OPENCLAW_PLUGIN_ROOT` | Auto-detected | Override the plugin root directory |

### SDK Version Pinning

The SDK version is pinned in `versions.json`:

```json
{"sdkVersion": "0.0.184-staging.58c6c09c"}
```

When the `babysitter` CLI is not available globally, hooks fall back to `npx -y @a5c-ai/babysitter-sdk@<pinned-version>`.

### Config Files

| File | Purpose |
|------|---------|
| `plugin.json` | Babysitter plugin manifest (name, version, hooks, commands, skills) |
| `openclaw.plugin.json` | OpenClaw-native plugin manifest (entrypoint, programmatic hooks, capabilities) |
| `hooks.json` | Shell-based hook declarations for filesystem hook surface |
| `versions.json` | Pinned SDK version for reproducible installations |

## Plugin Layout

```text
plugins/babysitter-openclaw/
|-- package.json              # npm package manifest
|-- plugin.json               # Babysitter plugin manifest
|-- openclaw.plugin.json      # OpenClaw-native plugin manifest
|-- versions.json             # Pinned SDK version
|-- hooks.json                # Shell hook declarations
|-- extensions/
|   |-- index.ts              # Plugin entrypoint (api.on, registerCommand)
|   `-- hooks/
|       |-- session-start.ts  # session_start handler
|       |-- session-end.ts    # session_end handler
|       |-- before-prompt-build.ts  # before_prompt_build handler
|       `-- agent-end.ts      # agent_end handler (async/fire-and-forget)
|-- hooks/
|   |-- babysitter-session-start.sh  # Shell fallback for session start
|   `-- babysitter-stop-hook.sh      # Shell fallback for stop
|-- skills/
|   |-- babysit/SKILL.md
|   |-- call/SKILL.md
|   |-- plan/SKILL.md
|   |-- resume/SKILL.md
|   |-- yolo/SKILL.md
|   |-- forever/SKILL.md
|   |-- doctor/SKILL.md
|   |-- observe/SKILL.md
|   |-- retrospect/SKILL.md
|   |-- cleanup/SKILL.md
|   |-- assimilate/SKILL.md
|   |-- contrib/SKILL.md
|   |-- help/SKILL.md
|   |-- plugins/SKILL.md
|   |-- user-install/SKILL.md
|   `-- project-install/SKILL.md
|-- commands/                 # Mirrored command documentation (markdown)
|-- bin/
|   |-- cli.cjs               # Standalone CLI entrypoint
|   |-- install.cjs           # Global postinstall script
|   `-- uninstall.cjs         # Global preuninstall script
`-- scripts/
    |-- setup.sh              # Setup helper
    `-- sync-command-docs.cjs # Regenerate mirrored command docs
```

## Development

### Local Development

Clone the monorepo and work within the plugin directory:

```bash
git clone https://github.com/a5c-ai/babysitter.git
cd babysitter
npm install
```

### Running Tests

```bash
cd plugins/babysitter-openclaw
npm test
npm run test:integration
npm run test:packaged-install
```

### Syncing Command Docs

Regenerate mirrored command documentation from skill definitions:

```bash
npm run sync:commands
```

### Publishing

```bash
npm run deploy              # Publish to npm (public)
npm run deploy:staging      # Publish with staging tag
```

### SDK Setup for Development

Read the pinned SDK version from `versions.json`:

```bash
PLUGIN_ROOT="$(pwd)"
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
```

## Troubleshooting

- Verify the harness with `babysitter harness:discover --json`.
- If `openclaw` is not detected, check `which openclaw` (Unix) or `where openclaw` (Windows).
- If commands do not appear, restart OpenClaw after installation so it reloads plugin metadata.
- If hooks fail silently, check log files in `$BABYSITTER_LOG_DIR` (defaults to `~/.a5c/logs/`).
- If the wrong SDK version is used, inspect `versions.json` inside the installed package root.
- Regenerate mirrored commands with `npm run sync:commands`.

## License

MIT

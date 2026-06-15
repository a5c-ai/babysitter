# @a5c-ai/babysitter-antigravity

Babysitter integration package for Antigravity CLI.

Antigravity CLI is Google's successor to Gemini CLI. It uses a workflow-driven
hook model and a SKILL.md plugin system. It is model-agnostic, supporting
Gemini, Claude, and GPT providers.

This package ships an Antigravity CLI plugin bundle:

- `SKILL.md` — Antigravity-native skill manifest with YAML frontmatter
- `plugin.json` — Babysitter plugin manifest
- `workflow.json` — Workflow orchestration descriptor
- `mcp.json` — MCP config for multi-provider tool integration
- `commands/` — Slash command definitions for all babysitter workflows
- `hooks/` — Workflow-driven hook scripts
- `bin/cli.js` — `babysitter-antigravity` installer CLI

It uses the Babysitter SDK CLI and the shared `~/.a5c` process-library state.
The plugin registers workflow-driven hooks and commands so Antigravity CLI can
drive the Babysitter orchestration loop from within the agent session.

## Installation

Install the Babysitter CLI once:

```bash
npm install -g @a5c-ai/babysitter
```

Install the Antigravity plugin through the SDK helper:

```bash
# Global install
babysitter harness:install-plugin antigravity-cli

# Workspace install
babysitter harness:install-plugin antigravity-cli --workspace /path/to/project
```

You can also run the published package installer directly:

```bash
npx --yes @a5c-ai/babysitter-antigravity install --global
npx --yes @a5c-ai/babysitter-antigravity install --workspace /path/to/project
```

For development, use a symlink instead of copying files:

```bash
babysitter-antigravity install --symlink
```

After installation, restart Antigravity CLI to activate the plugin.

## How It Works

The plugin implements a workflow-driven orchestration loop:

1. `SessionStart` fires when a new Antigravity CLI session begins. It ensures
   the correct SDK CLI version is installed (pinned via `versions.json`) and
   initializes session state under `~/.a5c/state/`.

2. The `SKILL.md` context file is loaded into every session, instructing the
   agent on the full 8-step orchestration workflow -- from interviewing the user
   and creating a process definition through iterating effects and posting results.

3. The agent performs **one orchestration phase per turn**, then stops.

4. `AfterAgent` fires after every agent turn. It checks whether a babysitter run
   is bound to the current session. If the run is not yet complete, the hook
   returns `{"decision":"block","reason":"...","systemMessage":"..."}` to keep
   the session alive and inject the next iteration prompt. Once the agent emits
   `<promise>COMPLETION_PROOF</promise>`, the hook allows the session to exit.

## Hook Types

| Hook | Event | Type | Purpose |
|------|-------|------|---------|
| Session initialization | `SessionStart` | workflow | Installs the correct SDK version, creates session state |
| Continuation loop | `AfterAgent` | workflow | Blocks session exit and drives the orchestration loop until the run completes |

Both hooks delegate to the SDK CLI via `babysitter hook:run` for all business
logic. The workflow-driven hook model replaces the shell-hook scripts used by
Gemini CLI.

## Differences from Gemini CLI

| Feature | Gemini CLI | Antigravity CLI |
|---------|-----------|----------------|
| Hook model | Shell-hook scripts | Workflow-driven hooks |
| Plugin manifest | `gemini-extension.json` | `SKILL.md` (YAML frontmatter) |
| Model support | Gemini only | Gemini, Claude, GPT (model-agnostic) |
| Tool integration | Native | MCP-based multi-provider |
| Orchestration | Extension-based | Workflow + SKILL.md |

## Available Commands

All commands follow the orchestration workflow described in `SKILL.md`.
Invoke them in Antigravity CLI with `/babysitter:<command>`.

### Primary Orchestration Commands

| Command | Description |
|---------|-------------|
| `/babysitter:call [instructions]` | Start a babysitter-orchestrated run |
| `/babysitter:plan [instructions]` | Generate a detailed execution plan without running anything |
| `/babysitter:yolo [instructions]` | Start a run in fully autonomous mode |
| `/babysitter:forever [instructions]` | Start a run that loops indefinitely |
| `/babysitter:resume [run-id]` | Resume a paused or interrupted run |

### Diagnostic and Analysis Commands

| Command | Description |
|---------|-------------|
| `/babysitter:doctor [run-id]` | Run a health check on a run |
| `/babysitter:retrospect [run-id...]` | Analyze completed runs and suggest improvements |

### Lifecycle Management Commands

| Command | Description |
|---------|-------------|
| `/babysitter:assimilate [target]` | Convert an external methodology into native babysitter process definitions |
| `/babysitter:cleanup [--dry-run]` | Aggregate insights then remove old run data |
| `/babysitter:observe` | Launch the real-time observer dashboard |

### Setup Commands

| Command | Description |
|---------|-------------|
| `/babysitter:user-install` | First-time onboarding and user profile setup |
| `/babysitter:project-install` | Onboard a project for babysitter orchestration |

### Plugin and Community Commands

| Command | Description |
|---------|-------------|
| `/babysitter:blueprints [action]` | Manage Babysitter blueprints |
| `/babysitter:contrib [feedback]` | Submit feedback or contribute to the babysitter project |
| `/babysitter:help [topic]` | Show help for babysitter commands and workflows |

## Configuration

| Source | Purpose |
|--------|---------|
| `versions.json` | Pins the required `@a5c-ai/babysitter-sdk` version |
| `SKILL.md` | Antigravity-native skill manifest with YAML frontmatter metadata |
| `plugin.json` | Babysitter plugin manifest declaring hooks, commands, and harness |
| `workflow.json` | Workflow orchestration descriptor for hook execution graph |
| `mcp.json` | MCP config for multi-provider tool integration |
| `ANTIGRAVITY_SKILL_PATH` env var | Path to the installed plugin root |
| `BABYSITTER_LOG_DIR` env var | Override the log directory (defaults to `~/.a5c/logs`) |
| `~/.a5c/state/` | Session state directory |
| `~/.a5c/user-profile.json` | User profile for personalizing orchestration |

## Verification

Verify the installed plugin bundle:

```bash
babysitter-antigravity status --global
```

Verify the SDK CLI is available:

```bash
babysitter --version
```

Verify the active process-library binding:

```bash
babysitter process-library:active --json
```

## Troubleshooting

### SDK CLI not found after session start

The SessionStart hook installs the SDK automatically. If permissions prevent
a global install, check the session-start log:

```bash
cat ~/.a5c/logs/babysitter-session-start-hook.log
```

If the CLI is still missing, install it manually:

```bash
npm install -g @a5c-ai/babysitter-sdk
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

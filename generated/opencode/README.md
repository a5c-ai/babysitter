# @a5c-ai/babysitter-opencode

Babysitter integration package for [OpenCode](https://opencode.ai).

This package ships an OpenCode plugin bundle that provides event-sourced
orchestration, hook-based extensibility, and human-in-the-loop approval for
complex multi-step workflows -- powered by the Babysitter SDK.

## Plugin Structure

```
plugins/babysitter-opencode/
  bin/
    cli.cjs              CLI entry point (babysitter-opencode command)
    install.cjs          Installation script
    install-shared.cjs   Shared installation utilities
    uninstall.cjs        Uninstallation script
  commands/              Slash command definitions (.md files)
  hooks/
    hooks.json           Hook registration manifest
    session-created.js   Initialize babysitter session state
    session-idle.js      Check for pending effects when idle
    shell-env.js         Inject env vars into shell
    tool-execute-before.js  Pre-tool-use hook
    tool-execute-after.js   Post-tool-use hook
  skills/
    babysit/SKILL.md     Core orchestration skill
    accomplish-status/SKILL.md  Run status reporting for Accomplish
  accomplish-skills/
    babysitter/SKILL.md  Bundled skill in Accomplish format
  plugin.json            Plugin manifest
  versions.json          SDK version tracking
```

## Installation

### Prerequisites

Install the Babysitter SDK CLI:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

### Method 1: npm global install (recommended)

```bash
npm install -g @a5c-ai/babysitter-opencode
```

The `postinstall` script automatically copies the plugin into your current
workspace's `.opencode/plugins/babysitter/` directory.

To install into a specific workspace:

```bash
babysitter-opencode install --workspace /path/to/project
```

### Method 2: Babysitter harness install

```bash
babysitter harness:install-plugin opencode
```

### Method 3: Manual copy

```bash
mkdir -p .opencode/plugins/babysitter
cp -r node_modules/@a5c-ai/babysitter-opencode/hooks .opencode/plugins/babysitter/
cp -r node_modules/@a5c-ai/babysitter-opencode/skills .opencode/plugins/babysitter/
cp -r node_modules/@a5c-ai/babysitter-opencode/commands .opencode/plugins/babysitter/
cp node_modules/@a5c-ai/babysitter-opencode/plugin.json .opencode/plugins/babysitter/
cp node_modules/@a5c-ai/babysitter-opencode/versions.json .opencode/plugins/babysitter/
```

## Uninstallation

```bash
babysitter-opencode uninstall
```

Or from a specific workspace:

```bash
babysitter-opencode uninstall --workspace /path/to/project
```

### Method 4: Accomplish AI (auto-detected)

When [Accomplish](https://github.com/accomplish-ai/accomplish) is installed,
the installer automatically detects it and copies the plugin into Accomplish's
OpenCode config directory (`<userDataPath>/opencode/plugins/babysitter/`).

```bash
# Auto-detects Accomplish during standard install
npm install -g @a5c-ai/babysitter-opencode

# Or target Accomplish explicitly
babysitter-opencode install --accomplish

# Install to both standalone OpenCode and Accomplish
babysitter-opencode install --global --accomplish
```

Accomplish stores OpenCode config at platform-specific locations:
- **macOS**: `~/Library/Application Support/Accomplish/opencode/`
- **Windows**: `%APPDATA%/Accomplish/opencode/`
- **Linux**: `~/.config/Accomplish/opencode/`

## CLI Reference

```
babysitter-opencode install [--global]            Install plugin globally
babysitter-opencode install --workspace [path]    Install into workspace
babysitter-opencode install --accomplish          Install into Accomplish data dir
babysitter-opencode uninstall [--global]          Uninstall plugin globally
babysitter-opencode uninstall --workspace [path]  Uninstall from workspace
babysitter-opencode sync                          Sync command surfaces
babysitter-opencode doctor                        Check installation health
babysitter-opencode version                       Show version
babysitter-opencode help                          Show help
```

## Integration Model

OpenCode plugins are JS/TS modules placed in `.opencode/plugins/`. The babysitter
plugin registers hooks for the following OpenCode events:

| OpenCode Event | Babysitter Hook | Purpose |
|----------------|-----------------|---------|
| `session.created` | `session-start` | Initialize session state |
| `session.idle` | `stop` | Check for pending effects |
| `shell.env` | -- | Inject env vars (AGENT_SESSION_ID) |
| `tool.execute.before` | `pre-tool-use` | Pre-tool-use awareness |
| `tool.execute.after` | `post-tool-use` | Post-tool-use awareness |

### Loop Model

OpenCode does NOT have a blocking stop hook. The `session.idle` event is
fire-and-forget. Therefore, babysitter uses an **in-turn iteration** model:
the agent runs the full orchestration loop within a single turn by calling
`babysitter run:iterate` repeatedly until completion.

### Environment Variables

The `shell.env` hook self-injects these variables since OpenCode does not
natively provide them:

- `AGENT_SESSION_ID` -- Unique session identifier
- `OPENCODE_SESSION_ID` -- Alias for session ID
- `BABYSITTER_STATE_DIR` -- State directory path
- `BABYSITTER_RUNS_DIR` -- Runs directory path
- `OPENCODE_PLUGIN_ROOT` -- Plugin root directory

### Accomplish Integration

When running inside [Accomplish](https://github.com/accomplish-ai/accomplish), OpenCode is spawned as a subprocess with
additional environment variables. The babysitter adapter detects these
automatically:

- `ACCOMPLISH_TASK_ID` -- Accomplish task identifier (primary correlation key)
- `OPENCODE_CONFIG_DIR` -- Path to Accomplish's OpenCode config directory
- `OPENCODE_CONFIG` -- Path to the generated `opencode.json`

The adapter writes `accomplishTaskId` into session state metadata for
correlation. The `accomplish-status` skill writes run status JSON to
`<OPENCODE_CONFIG_DIR>/run-status/<runId>.json` for file-based IPC.

Breakpoints are resolved conversationally: when a breakpoint is pending, the
agent uses Accomplish's `ask-user-question` MCP tool to prompt the user, then
posts the result via `babysitter task:post`.

### Configuration Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_HOME` | `.opencode/` in workspace | OpenCode config root |
| `OPENCODE_WORKSPACE` | `cwd` | Workspace directory |
| `BABYSITTER_OPENCODE_PLUGIN_DIR` | `.opencode/plugins/` | Plugin install target |
| `BABYSITTER_OPENCODE_MARKETPLACE_PATH` | `~/.agents/plugins/marketplace.json` | Marketplace file |
| `BABYSITTER_SDK_CLI` | (auto-detected) | Path to SDK CLI entry |
| `BABYSITTER_GLOBAL_STATE_DIR` | `~/.a5c` | Global state directory |
| `ACCOMPLISH_TASK_ID` | -- | Set by Accomplish when spawning OpenCode |
| `OPENCODE_CONFIG_DIR` | -- | Accomplish's OpenCode config directory |

## Verification

```bash
# Check installation health
babysitter-opencode doctor

# Or verify manually:
test -f .opencode/plugins/babysitter/index.js
test -f .opencode/plugins/babysitter/hooks/session-created.js
test -f .opencode/plugins/babysitter/hooks/shell-env.js
test -f .opencode/plugins/babysitter/skills/babysit/SKILL.md

# Verify SDK CLI
babysitter --version

# Verify process library binding
babysitter process-library:active --json
```

## Running Tests

```bash
cd plugins/babysitter-opencode
npm test
```

## License

MIT

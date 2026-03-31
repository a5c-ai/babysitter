# @a5c-ai/babysitter-cursor

Babysitter orchestration plugin for [Cursor IDE](https://cursor.com) and
its headless CLI agent mode.

This package ships a complete Cursor plugin bundle -- skills, lifecycle
hooks, and SDK integration -- that lets you run Babysitter's event-sourced,
multi-step orchestration engine directly inside Cursor sessions. It uses the
Babysitter SDK CLI and the shared `~/.a5c` process-library state. The
installer registers the plugin bundle and materializes the active skills and
hooks so Cursor can execute Babysitter commands and hook scripts directly.

## Prerequisites

- **Node.js 22+**
- **Cursor IDE** with CLI agent support (`cursor` command available on PATH)
- **CURSOR_API_KEY** environment variable -- required for headless CLI mode
- **Babysitter SDK CLI** (`@a5c-ai/babysitter-sdk`) -- installed globally

## Installation

Install the SDK CLI first:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

### Via Cursor Marketplace (recommended)

Install directly from the Cursor Marketplace:

1. Open **Cursor IDE** and navigate to **Settings > Plugins**
2. Search for **babysitter-cursor**
3. Click **Install**

### Via Babysitter plugin manager

```bash
babysitter plugin:install babysitter-cursor --marketplace-name a5c.ai --global
```

### Workspace installation

```bash
babysitter plugin:install babysitter-cursor --marketplace-name a5c.ai --project
```

If the workspace does not already have an active process-library binding, the
installer bootstraps the shared global SDK process library automatically:

```bash
babysitter process-library:active --json
```

### Alternative Installation (development)

For local development or environments without marketplace access:

#### Via npm

```bash
npm install -g @a5c-ai/babysitter-cursor
babysitter-cursor install
```

#### From source

```bash
cd plugins/babysitter-cursor
node bin/install.js
```

#### Manual installation

Copy the plugin directory to your local Cursor plugins path:

```bash
cp -r plugins/babysitter-cursor ~/.cursor/plugins/local/babysitter-cursor
```

## Uninstallation

```bash
babysitter-cursor uninstall
```

Or via the plugin manager:

```bash
babysitter plugin:uninstall babysitter-cursor --global
```

## Plugin Structure (Directory Layout)

```
plugins/babysitter-cursor/
  .cursor-plugin/
    plugin.json              # Cursor Marketplace manifest
  plugin.json                # Plugin manifest (skills dir, hooks path, metadata)
  hooks.json                 # Hook configuration (sessionStart, stop)
  hooks/
    session-start.sh         # SessionStart lifecycle hook (bash)
    session-start.ps1        # SessionStart lifecycle hook (PowerShell)
    stop-hook.sh             # Stop hook -- orchestration loop driver (bash)
    stop-hook.ps1            # Stop hook -- orchestration loop driver (PowerShell)
  skills/
    babysit/SKILL.md         # Core orchestration skill
    call/SKILL.md            # Start a new run
    plan/SKILL.md            # Plan without executing
    resume/SKILL.md          # Resume an incomplete run
    doctor/SKILL.md          # Diagnose run health
    retrospect/SKILL.md      # Analyze completed runs
    observe/SKILL.md         # Observer dashboard
    assimilate/SKILL.md      # Assimilate external methodologies
    help/SKILL.md            # Help and documentation
    user-install/SKILL.md    # User setup
  bin/
    cli.js                   # CLI entry point (babysitter-cursor command)
    install.js               # Installation script
    install-shared.js        # Shared installation utilities
    uninstall.js             # Uninstallation script
  scripts/
    team-install.js          # Team-level installation
  versions.json              # SDK version pinning
  package.json               # npm package metadata
  .cursorrules               # Custom instructions for Cursor agent
  .gitignore
```

## Hook Configuration

The plugin declares lifecycle hooks in `hooks.json` using the version 1
format. Hook event names use camelCase (e.g., `sessionStart`, `stop`).

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "command",
        "bash": "./hooks/session-start.sh",
        "powershell": "./hooks/session-start.ps1",
        "timeoutSec": 30
      }
    ],
    "stop": [
      {
        "type": "command",
        "bash": "./hooks/stop-hook.sh",
        "powershell": "./hooks/stop-hook.ps1",
        "loop_limit": null
      }
    ]
  }
}
```

Each hook entry specifies a `bash` and/or `powershell` command, a `type`
(currently always `"command"`), and optional parameters like `timeoutSec`
or `loop_limit`.

### Hook Format Details

- **version**: Must be `1`. Identifies the hooks schema version.
- **Event names**: Use camelCase (`sessionStart`, `stop`). Not snake_case,
  not PascalCase.
- **loop_limit**: Controls how many times the stop hook can re-inject
  continuation before the session is forced to end. Set to `null` for
  unlimited orchestration iterations (the default for this plugin).
- **Input**: Hooks receive JSON via stdin containing session context
  (including `conversation_id` for session identification).
- **Output**: Hooks emit JSON via stdout. The stop hook uses
  `{followup_message: "..."}` to auto-continue the orchestration loop.

## Available Skills

The plugin registers ten skills that surface as slash commands within
Cursor:

| Skill | Description |
|-------|-------------|
| `babysit` | Core entrypoint. Orchestrate `.a5c/runs/<runId>/` through iterative execution. Invoke when asked to babysit, orchestrate, or run a workflow. |
| `call` | Start a new orchestration run. Everything after `$call` becomes the initial Babysitter request. Always creates an interactive run. |
| `plan` | Design a process definition without executing it. Useful for reviewing or refining a workflow before committing to a run. |
| `resume` | Resume an incomplete or paused orchestration run from where it left off. |
| `doctor` | Diagnose run health -- journal integrity, state cache, effects, locks, sessions, logs, and disk usage. |
| `retrospect` | Analyze a completed run: results, process quality, and suggestions for process improvements and optimizations. |
| `observe` | Launch the real-time observer dashboard to watch active runs. |
| `assimilate` | Assimilate an external methodology, harness, or specification into Babysitter process definitions. |
| `help` | Show documentation for Babysitter command usage, processes, skills, agents, and methodologies. |
| `user-install` | Set up Babysitter for yourself -- installs dependencies, interviews you about preferences, and configures user-level defaults. |

## Usage Examples

### Interactive (Cursor IDE)

Open a Cursor session and invoke any skill as a slash command:

```text
$babysit run my-workflow
$call build and test the authentication module
$plan design a data migration pipeline
$resume
$doctor
```

### Headless CLI

Run Cursor in headless agent mode for fully automated orchestration. The
`CURSOR_API_KEY` environment variable must be set.

```bash
export CURSOR_API_KEY="your-api-key"

cursor agent -p -f --trust --approve-mcps \
  'Build and test the authentication module'
```

With a workspace directory:

```bash
cursor agent -p -f --trust --approve-mcps \
  --workspace /path/to/repo \
  'Refactor the payment service to use the new API'
```

**Headless CLI flags:**

| Flag | Description |
|------|-------------|
| `-p` | Print mode (output to stdout) |
| `-f` | Non-interactive / force mode |
| `--trust` | Trust the workspace (skip confirmation prompts) |
| `--approve-mcps` | Auto-approve MCP server connections |
| `--workspace <dir>` | Set the working directory |

**Note:** The `afterAgentResponse` and `afterAgentThought` hook events do
NOT fire in CLI headless mode. The plugin relies on `sessionStart` and
`stop` hooks, which are supported in both interactive and headless modes.

## Orchestration Model

The plugin drives multi-step orchestration through a stop-hook loop
pattern. This is how Babysitter iterates autonomously within Cursor:

### SessionStart

Fires when a new Cursor session begins. The hook:

1. Checks and installs the required SDK version (pinned in `versions.json`)
2. Initializes a Babysitter session for the active Cursor session
3. The session ID is extracted from `conversation_id` in the hook's stdin
   JSON (not from an environment variable)

### Stop (Orchestration Loop Driver)

When Cursor attempts to end its turn, this hook intercepts the exit and:

1. Checks whether the active run has completed or emitted a completion proof
2. If the run is still in progress, emits `{followup_message: "..."}` to
   auto-continue the orchestration loop with the next iteration step
3. Only allows the session to exit when the run finishes or reaches a
   breakpoint requiring human input

This is what keeps Babysitter iterating autonomously -- each turn performs
one orchestration phase, and the stop hook decides whether to loop or yield.
The `loop_limit: null` setting in `hooks.json` allows unlimited iterations.

**Important:** The stop hook uses `{followup_message: "..."}` to signal
continuation, NOT `{decision: "block"}`. This is a Cursor-specific
convention.

## Configuration

### .cursorrules

The plugin includes a `.cursorrules` file for custom agent instructions.
This file is discovered by Cursor by convention and configures agent
behavior within sessions.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CURSOR_API_KEY` | -- | API key for headless CLI mode (required) |
| `CURSOR_PLUGIN_ROOT` | Plugin directory | Plugin root directory |
| `BABYSITTER_STATE_DIR` | `<cwd>/.a5c` | State directory for session data |
| `BABYSITTER_LOG_DIR` | `<plugin>/.a5c/logs` | Log output directory |

### SDK Version Pinning

The plugin pins its required SDK version in `versions.json`. The
SessionStart hook reads this file and ensures the correct version of
`@a5c-ai/babysitter-sdk` is installed globally before proceeding.

## Marketplace Distribution

Cursor Marketplace is Git-based. Plugins are distributed through Git
repositories that contain a manifest file.

### Plugin Manifest

The Cursor marketplace manifest lives at `.cursor-plugin/plugin.json`:

```json
{
  "name": "babysitter-cursor",
  "version": "0.1.0",
  "description": "Babysitter orchestration plugin for Cursor IDE/CLI ...",
  "author": {
    "name": "a5c.ai",
    "email": "support@a5c.ai",
    "url": "https://github.com/a5c-ai/babysitter"
  },
  "homepage": "https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-cursor#readme",
  "repository": "https://github.com/a5c-ai/babysitter",
  "license": "MIT",
  "skills": "skills/",
  "hooks": "hooks.json"
}
```

The `skills` field points to the skills directory where Cursor
auto-discovers `SKILL.md` files in subdirectories. The `hooks` field
references the `hooks.json` configuration file.

### Marketplace Manifest

To distribute through a marketplace, add the plugin to the marketplace's
`marketplace.json`:

```json
{
  "name": "a5c.ai",
  "owner": {
    "name": "a5c.ai",
    "email": "support@a5c.ai"
  },
  "metadata": {
    "description": "Babysitter orchestration plugins",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "babysitter-cursor",
      "description": "Multi-step workflow orchestration for Cursor IDE",
      "version": "0.1.0",
      "source": "./plugins/babysitter-cursor"
    }
  ]
}
```

### User Commands

```bash
babysitter plugin:add-marketplace --marketplace-url https://github.com/a5c-ai/babysitter --global
babysitter plugin:list-plugins --marketplace-name a5c.ai --global
babysitter plugin:install babysitter-cursor --marketplace-name a5c.ai --global
```

## Troubleshooting

### Hook not firing

Run the doctor skill from within a Cursor session to diagnose hook and
session health:

```text
$doctor
```

Also check log output in `<plugin-root>/.a5c/logs/`:

- `babysitter-session-start-hook.log`
- `babysitter-stop-hook.log`
- `babysitter-stop-hook-stderr.log`
- `babysitter-session-start-hook-stderr.log`

### Run stuck or not progressing

Check the run status and diagnose:

```text
$doctor [run-id]
```

Or inspect the run directory directly:

```bash
babysitter run:status --run-id <runId> --json
babysitter run:events --run-id <runId> --json
```

### SDK version mismatch

If the plugin reports version incompatibility, ensure the pinned SDK
version is installed:

```bash
SDK_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('versions.json','utf8')).sdkVersion)")
npm install -g @a5c-ai/babysitter-sdk@$SDK_VERSION
```

### Headless mode not working

Verify that `CURSOR_API_KEY` is set:

```bash
echo $CURSOR_API_KEY
```

Ensure the `cursor` CLI is available on PATH:

```bash
cursor --version
```

### afterAgentResponse / afterAgentThought hooks not firing

These hook events do not fire in CLI headless mode. This is expected
Cursor behavior. The plugin is designed to work with `sessionStart` and
`stop` hooks only, which are supported in both interactive and headless
modes.

### Windows limitations

On native Windows, hook execution depends on shell configuration. The
plugin includes both `bash` (.sh) and `powershell` (.ps1) hook scripts
to maximize compatibility. If hooks do not fire, try running from Git Bash
or WSL. The `hooks.json` file includes `powershell` entries alongside
`bash` entries for Windows PowerShell execution support.

## Development / Contributing

### Local development

```bash
git clone https://github.com/a5c-ai/babysitter.git
cd babysitter
npm install
cd plugins/babysitter-cursor
node bin/install.js
```

### Publishing

```bash
cd plugins/babysitter-cursor
npm run deploy            # Publish to npm (public)
npm run deploy:staging    # Publish to npm with staging tag
```

### Team installation

```bash
cd plugins/babysitter-cursor
npm run team:install
```

This sets up the plugin for all team members in a shared workspace,
writing team-level configuration to `.a5c/team/`.

### Verification

Verify the installed plugin bundle:

```bash
npm ls -g @a5c-ai/babysitter-cursor --depth=0
```

Verify the active shared process-library binding:

```bash
babysitter process-library:active --json
```

## License

MIT

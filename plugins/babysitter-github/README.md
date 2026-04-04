# @a5c-ai/babysitter-github

Babysitter orchestration plugin for GitHub Copilot. It supports both:

- **GitHub Copilot CLI** via the local plugin and hook model
- **GitHub Copilot coding agent / cloud agent** via repository-installed skills and instructions

This package ships a complete Copilot CLI plugin bundle -- skills, lifecycle
hooks, and SDK integration -- that lets you run Babysitter's event-sourced,
multi-step orchestration engine directly inside GitHub Copilot CLI sessions.
It uses the Babysitter SDK CLI and the shared `~/.a5c` process-library state.
The installer registers the plugin bundle and materializes the active skills
and hooks so Copilot CLI can execute Babysitter commands and hook scripts
directly.

## Prerequisites

- **Node.js 22+**
- **GitHub Copilot CLI** (`copilot`) -- requires an active GitHub Copilot
  subscription
- **Babysitter SDK CLI** (`@a5c-ai/babysitter-sdk`) -- installed globally

## Installation

### From marketplace (recommended)

Register the a5c.ai marketplace and install the plugin:

```bash
# Register the marketplace
copilot plugin marketplace add a5c-ai/babysitter

# Install the plugin
copilot plugin install babysitter
```

### Direct GitHub install

Install directly from the Git repository using Copilot CLI. Copilot CLI
discovers the plugin via `.github/plugin/marketplace.json` at the repo root:

```bash
copilot plugin install a5c-ai/babysitter
```

### Alternative Installation (npm / development)

For development or environments where the Copilot CLI plugin system is not
available, install via npm:

Install the SDK CLI first:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

Then install the GitHub Copilot plugin globally:

```bash
npm install -g @a5c-ai/babysitter-github
babysitter-github install
```

Or install from source:

```bash
cd plugins/babysitter-github
node bin/install.js
```

Install into a specific workspace:

```bash
babysitter-github install --workspace /path/to/repo
```

### GitHub Copilot cloud agent installation

For GitHub Copilot's cloud-hosted coding agent, install repository-scoped
Babysitter support instead of the local `~/.copilot` CLI plugin surface:

```bash
babysitter-github install --cloud-agent --workspace /path/to/repo
```

This installs:

- a mirrored Babysitter GitHub plugin bundle under `.github/babysitter/github-plugin/`
- Babysitter skills under `.github/skills/`
- a managed Babysitter block in `AGENTS.md`
- a managed Babysitter block in `.github/copilot-instructions.md`
- a `copilot-setup-steps` workflow, or a generated merge candidate if the repo already has one

If the repository already has a custom `copilot-setup-steps.yml`, the
installer preserves it and writes a merge candidate to:

```text
.github/workflows/copilot-setup-steps.babysitter.generated.yml
```

If the workspace does not already have an active process-library binding, the
installer bootstraps the shared global SDK process library automatically:

```bash
babysitter process-library:active --json
```

## Uninstallation

Via Copilot CLI:

```bash
copilot plugin uninstall babysitter
```

Via npm:

```bash
babysitter-github uninstall
```

## Integration Model

The plugin provides:

- `skills/babysit/SKILL.md` as the core orchestration entrypoint
- Mode wrapper skills such as `$call`, `$plan`, and `$resume`
- Plugin-level lifecycle hooks for `sessionStart`, `sessionEnd`, and
  `userPromptSubmitted`

For Copilot cloud agent, the hook scripts are mirrored into the repository as
part of the installed plugin bundle for reference and parity, but the hosted
agent path is driven by repository instructions, skills, and setup workflow
instead of local `~/.copilot/hooks.json`.

The process library is fetched and bound through the SDK CLI in
`~/.a5c/active/process-library.json`.

### Active Process-Library Model

Process discovery prefers active roots in this order:

1. `.a5c/processes` in the current workspace
2. The SDK-managed active process-library binding returned by
   `babysitter process-library:active --json`
3. The cloned process-library repo root from `defaultSpec.cloneDir` when
   adjacent reference material is needed
4. Installed extension content only as a compatibility fallback

## Available Skills

The plugin registers ten skills that surface as slash commands within Copilot
CLI:

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

## How the Hook-Driven Orchestration Loop Works

GitHub Copilot CLI supports plugin lifecycle hooks. This plugin registers
three hooks that drive the orchestration loop:

### SessionStart

Fires when a new Copilot CLI session begins. The hook:

1. Initializes a Babysitter session for the active Copilot session
2. Ensures the SDK CLI is installed at the correct version (pinned in
   `versions.json`)
3. Creates baseline session state in the `.a5c` state directory

### SessionEnd

The orchestration loop driver. Registered as `sessionEnd` in `hooks.json`,
this hook fires when the Copilot CLI session ends and:

1. Checks whether the active run has completed or emitted a completion proof
2. If the run is still in progress, re-injects the next orchestration step
   to continue iteration
3. Only allows the session to exit when the run finishes or reaches a
   breakpoint requiring human input

This is what keeps Babysitter iterating autonomously within the Copilot CLI
session -- each turn performs one orchestration phase, and the Stop hook
decides whether to loop or yield.

### UserPromptSubmitted

Fires before a user prompt reaches the model. The hook applies
density-filter compression to long user prompts to reduce token usage while
preserving semantic content.

## Configuration

### AGENTS.md

The plugin uses `AGENTS.md` (the Copilot CLI equivalent of `CLAUDE.md`) for
custom agent instructions. The cloud-agent installer appends a managed
Babysitter section to the repository root `AGENTS.md` so the hosted agent can
see the same orchestration guidance.

### .github/copilot-instructions.md

The cloud-agent installer also appends a managed Babysitter block to
`.github/copilot-instructions.md`. This gives GitHub-hosted Copilot sessions a
repository-wide entrypoint for the Babysitter skills and setup workflow.

### copilot-setup-steps workflow

The cloud-agent path seeds `.github/workflows/copilot-setup-steps.yml` with a
`copilot-setup-steps` job that installs the Babysitter SDK and initializes the
active process library before the cloud agent starts working.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_PROJECT_DIR` | CWD | Project root directory (set by Copilot CLI) |
| `BABYSITTER_LOG_DIR` | `~/.a5c/logs` | Log output directory override; default is the user-global Babysitter log root |
| `BABYSITTER_STATE_DIR` | `<cwd>/.a5c` | State directory for session data |

### SDK Version Pinning

The plugin pins its required SDK version in `versions.json`. The
SessionStart hook reads this file and ensures the correct version of
`@a5c-ai/babysitter-sdk` is installed globally before proceeding.

## Copilot CLI Plugin Structure

This section documents the Copilot CLI plugin format that this package
conforms to. Understanding this structure is useful when extending the plugin
or building new ones.

### Plugin Manifest Location

Copilot CLI looks for the plugin manifest in these paths, checked in order:

1. `.plugin/plugin.json`
2. `.github/plugin/plugin.json`
3. `.claude-plugin/plugin.json`
4. `plugin.json` (repository root)

The first match wins. This plugin uses `plugin.json` at the package root.

For marketplace discovery, Copilot CLI looks for `.github/plugin/marketplace.json`
at the repository root. This file lists all available plugins in the repo and is
used when installing via `copilot plugin install OWNER/REPO`.

### plugin.json Schema

The manifest declares metadata, skills, hooks, and optional integrations:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | `string` | Plugin identifier (e.g., `"babysitter"`) |
| `description` | No | `string` | Human-readable summary |
| `version` | No | `string` | Semver version string |
| `author` | No | `object` | Author info: `{ "name": "...", "email": "..." }` |
| `license` | No | `string` | SPDX license identifier |
| `keywords` | No | `string[]` | Searchable tags for marketplace discovery |
| `agents` | No | `string` | Path to agents directory |
| `skills` | No | `string` | Path to skills directory (auto-discovers SKILL.md files in subdirectories) |
| `hooks` | No | `string` | Path to `hooks.json` |
| `mcpServers` | No | `string` | Path to `.mcp.json` for MCP server configuration |

Example from this plugin:

```json
{
  "name": "babysitter",
  "version": "0.1.0",
  "description": "Orchestrate complex, multi-step workflows ...",
  "author": "a5c.ai",
  "license": "MIT",
  "skills": "skills/",
  "hooks": "hooks.json",
  "commands": [],
  "keywords": ["orchestration", "workflow", "automation"]
}
```

### Skills Format

Each skill lives in its own directory under `skills/` and is defined by a
Markdown file with YAML frontmatter:

```
skills/
  babysit/
    SKILL.md
  call/
    SKILL.md
  plan/
    SKILL.md
```

The `SKILL.md` file uses frontmatter to declare metadata:

```markdown
---
name: babysit
description: Orchestrate a multi-step workflow using the Babysitter SDK
---

Skill body with instructions for the agent...
```

The `name` and `description` fields in the frontmatter are required. The
body of the Markdown file contains the instructions the agent follows when
the skill is invoked.

### hooks.json Format

The `hooks.json` file declares lifecycle hook handlers as an array of
command descriptors per event type:

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
    "sessionEnd": [
      {
        "type": "command",
        "bash": "./hooks/session-end.sh",
        "powershell": "./hooks/session-end.ps1",
        "timeoutSec": 30
      }
    ],
    "userPromptSubmitted": [
      {
        "type": "command",
        "bash": "./hooks/user-prompt-submitted.sh",
        "powershell": "./hooks/user-prompt-submitted.ps1",
        "timeoutSec": 30
      }
    ],
    "preToolUse": [...],
    "postToolUse": [...],
    "errorOccurred": [...]
  }
}
```

Each hook entry specifies a `bash` and/or `powershell` command, a `type`
(currently always `"command"`), and an optional `timeoutSec`.

**Supported hook event types:**

| Event | Description |
|-------|-------------|
| `sessionStart` | Fires when a new CLI session begins |
| `sessionEnd` | Fires when a CLI session ends |
| `userPromptSubmitted` | Fires before a user prompt reaches the model |
| `preToolUse` | Fires before a tool is executed |
| `postToolUse` | Fires after a tool has executed |
| `errorOccurred` | Fires when an error is encountered |

**Flow-control decisions:** Only `preToolUse` hooks can return flow-control
decisions via the `permissionDecision` field in stdout JSON. Valid values
are `"deny"`, `"allow"`, and `"ask"`. All other hook event outputs are
ignored by the runtime.

## Marketplace Distribution

Copilot CLI plugins can be distributed through marketplaces -- Git
repositories that contain a manifest listing available plugins.

### Creating a Marketplace

A marketplace is a Git repository with a `marketplace.json` file at the
repository root in `.github/plugin/marketplace.json`:

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
      "name": "babysitter",
      "description": "Multi-step workflow orchestration with event-sourced state",
      "version": "0.1.0",
      "source": "./plugins/babysitter-github"
    }
  ]
}
```

The `source` field points to the plugin directory relative to the
marketplace repository root.

### User Commands

Copilot CLI provides built-in commands for plugin and marketplace
management:

**Marketplace commands:**

```bash
copilot plugin marketplace add OWNER/REPO        # Register a marketplace
copilot plugin marketplace list                   # List registered marketplaces
copilot plugin marketplace browse NAME            # Browse plugins in a marketplace
```

**Plugin installation:**

```bash
copilot plugin install PLUGIN@MARKETPLACE         # Install from a marketplace
copilot plugin install OWNER/REPO                 # Install directly from a GitHub repo
copilot plugin install ./PATH                     # Install from a local path
```

**Plugin management:**

```bash
copilot plugin list                               # List installed plugins
copilot plugin update PLUGIN                      # Update a plugin
copilot plugin uninstall PLUGIN                   # Remove a plugin
```

### Plugin Storage

Installed plugins are stored under `~/.copilot/installed-plugins/`:

- **Marketplace installs:** `~/.copilot/installed-plugins/MARKETPLACE/PLUGIN-NAME/`
- **Direct installs:** `~/.copilot/installed-plugins/_direct/SOURCE-ID/`

### Default Registries

Copilot CLI ships with two built-in registries:

- `copilot-plugins` -- official first-party plugins
- `awesome-copilot` -- community-curated plugin collection

These registries are available without running `marketplace add`.

## Plugin Structure (Directory Layout)

```
plugins/babysitter-github/
  plugin.json              # Plugin manifest (skills, hooks, metadata)
  .github/plugin.json      # Plugin manifest (alternate discovery path)
  hooks.json               # Hook configuration (sessionStart, sessionEnd, userPromptSubmitted)
  hooks/
    session-start.sh       # SessionStart lifecycle hook
    session-end.sh         # SessionEnd lifecycle hook
    user-prompt-submitted.sh  # UserPromptSubmitted hook (prompt compression)
  skills/
    babysit/SKILL.md       # Core orchestration skill
    call/SKILL.md          # Start a new run
    plan/SKILL.md          # Plan without executing
    resume/SKILL.md        # Resume an incomplete run
    doctor/SKILL.md        # Diagnose run health
    retrospect/SKILL.md    # Analyze completed runs
    observe/SKILL.md       # Observer dashboard
    assimilate/SKILL.md    # Assimilate external methodologies
    help/SKILL.md          # Help and documentation
    user-install/SKILL.md  # User setup
  bin/
    cli.js                 # CLI entry point (babysitter-github command)
    install.js             # Installation script
    uninstall.js           # Uninstallation script
  scripts/
    team-install.js        # Team-level installation
  versions.json            # SDK version pinning
  package.json             # npm package metadata
  AGENTS.md                # Custom instructions for Copilot CLI
```

Cloud-agent installation additionally writes into the target repository:

```
.github/
  babysitter/github-plugin/                # Mirrored plugin bundle for repo-local visibility
  skills/
    babysitter-babysit/SKILL.md            # Installed Babysitter cloud skills
    babysitter-call/SKILL.md
    ...
  copilot-instructions.md                  # Managed Babysitter block appended
  workflows/
    copilot-setup-steps.yml                # Managed workflow when no custom file exists
    copilot-setup-steps.babysitter.generated.yml  # Merge candidate when a custom file already exists
AGENTS.md                                  # Managed Babysitter block appended
```

## Verification

Verify marketplace registration:

```bash
copilot plugin marketplace list
```

Verify the installed plugin:

```bash
npm ls -g @a5c-ai/babysitter-github --depth=0
```

Verify the active shared process-library binding:

```bash
babysitter process-library:active --json
```

## Troubleshooting

### Hook not firing

Run the doctor skill from within a Copilot CLI session to diagnose hook and
session health:

```text
$doctor
```

### Run stuck or not progressing

Check the run status and diagnose:

```text
$doctor [run-id]
```

You can also inspect the run directory directly:

```bash
babysitter run:status --run-id <runId> --json
babysitter run:events --run-id <runId> --json
```

### SDK version mismatch

If the plugin reports version incompatibility, ensure the pinned SDK version
is installed:

```bash
SDK_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('versions.json','utf8')).sdkVersion)")
npm install -g @a5c-ai/babysitter-sdk@$SDK_VERSION
```

### Windows limitations

On native Windows, Copilot CLI may not execute hook scripts depending on
shell configuration. The plugin still installs correctly, but lifecycle hooks
may not fire. Using WSL or Git Bash is recommended. The `hooks.json` file
includes `powershell` entries alongside `bash` entries to improve Windows
compatibility where PowerShell execution is available.

## Development / Contributing

### Local development

```bash
git clone https://github.com/a5c-ai/babysitter.git
cd babysitter
npm install
cd plugins/babysitter-github
node bin/install.js
```

### Publishing

```bash
cd plugins/babysitter-github
npm run deploy            # Publish to npm (public)
npm run deploy:staging    # Publish to npm with staging tag
```

### Team installation

```bash
cd plugins/babysitter-github
npm run team:install
```

This sets up the plugin for all team members in a shared workspace,
writing team-level configuration to `.a5c/team/`.

## License

MIT

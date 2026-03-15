# babysitter-pi

Babysitter SDK deep integration plugin for [oh-my-pi](https://github.com/nicholasgasior/oh-my-pi).

This plugin makes babysitter a mandatory first-class orchestration layer within oh-my-pi, providing:

- **Session auto-binding** -- automatically binds pi sessions to babysitter runs
- **Task interception** -- intercepts pi task dispatch and routes through babysitter's effect system
- **TUI widgets** -- terminal UI components for run status, pending effects, and quality scores
- **Harness adapter** -- adapts babysitter's test harness for pi's execution environment
- **Slash commands** -- `/babysitter:call`, `/babysitter:status`, `/babysitter:resume`, `/babysitter:doctor`

## Prerequisites

- **Node.js** >= 18
- **oh-my-pi** (`@oh-my-pi/pi-coding-agent`) installed globally
- **@a5c-ai/babysitter-sdk** (installed automatically as a dependency)

## Installation

### From npm (published)

```bash
omp plugin install babysitter-pi
```

### Local development (from this repo)

Clone the repo and link the plugin into oh-my-pi:

```bash
# 1. Clone and install workspace dependencies
git clone <repo-url> && cd babysitter
npm install

# 2. Build the SDK (the plugin depends on it)
npm run build:sdk

# 3. Link the plugin into oh-my-pi
omp plugin link ./plugins/pi

# 4. Verify the plugin is loaded
omp plugin list
```

The `omp plugin link` command creates a symlink so oh-my-pi loads the extension directly from your working tree -- edits to `plugins/pi/` take effect immediately without reinstalling.

### Manual setup (without omp CLI)

If you prefer to wire things up manually:

```bash
# Install the plugin's own dependencies
cd plugins/pi
npm install

# Symlink into oh-my-pi's plugin directory
ln -s "$(pwd)" ~/.omp/plugins/babysitter-pi
```

## Configuration

### Azure OpenAI (if using Azure as the LLM provider)

Create `~/.omp/agent/models.yml` with your Azure OpenAI endpoint:

```yaml
providers:
  azure-openai:
    type: azure-openai
    apiKey: ${AZURE_OPENAI_API_KEY}
    endpoint: https://<your-resource>.openai.azure.com
    apiVersion: "2025-03-01-preview"

models:
  azure-openai/gpt-4o:
    provider: azure-openai
    modelId: gpt-4o
```

Then run pi with:

```bash
omp --model azure-openai/gpt-4o
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BABYSITTER_RUNS_DIR` | `.a5c/runs` | Root directory for run storage |
| `AZURE_OPENAI_API_KEY` | -- | Azure OpenAI API key (if using Azure provider) |
| `AZURE_OPENAI_ENDPOINT` | -- | Azure OpenAI endpoint URL |

## Usage

Once the plugin is installed, babysitter activates automatically on every pi session start. No manual activation is needed.

### Start a new orchestrated run

```
/babysitter:call Scan the codebase and generate a quality report
```

### Check run status

```
/babysitter:status
/babysitter:status <runId>
```

### Resume a previous run

```
/babysitter:resume <runId>
```

### Diagnose run health

```
/babysitter:doctor
/babysitter:doctor <runId>
```

## How it works

The extension hooks into oh-my-pi's lifecycle events to drive babysitter's orchestration loop:

```
session_start ──> initSession / bindRun
                       │
                       v
              ┌─── iterate() ◄────────────────────┐
              │        │                           │
              │        v                           │
              │  EFFECT_REQUESTED                  │
              │    (agent / node / breakpoint)      │
              │        │                           │
              │        v                           │
              │  execute effect                    │
              │  (real work: files, scripts, etc.) │
              │        │                           │
              │        v                           │
              │  postResult() ─── EFFECT_RESOLVED ─┘
              │
              └──> RUN_COMPLETED
```

1. **`session_start`** -- initializes the session, checks for an existing run to resume
2. **`/babysitter:call`** -- creates a new run from a process definition, binds it to the session
3. **`agent_end`** -- after each agent turn, drives the next orchestration iteration
4. **Effects** -- the process requests work (agent tasks, node scripts, breakpoints); the extension executes them and posts results back
5. **`session_shutdown`** -- cleans up state and releases locks

### Effect kinds

| Kind | What happens |
|------|-------------|
| `agent` | Delegated to pi's agent via `sendUserMessage()` |
| `node` | Executed as a Node.js script via `child_process` |
| `shell` | Executed as a shell command |
| `breakpoint` | Pauses for human approval |
| `sleep` | Time-based gate |
| `skill` | Routed to a registered pi skill |

## Running tests

```bash
# All plugin tests
cd plugins/pi && npm test

# Individual test suites
npm run test:integration    # Extension integration tests
npm run test:harness        # Harness adapter tests
npm run test:tui            # TUI widget tests

# E2E tests (requires Docker)
npm run test:e2e:docker     # From repo root
```

## Structure

```
plugins/pi/
├── extensions/babysitter/   # oh-my-pi extension (main entry point)
│   ├── index.ts             # activate() -- event handlers, commands
│   ├── session-binder.ts    # Run creation and session binding
│   ├── sdk-bridge.ts        # SDK API bridge (iterate, postResult, etc.)
│   ├── loop-driver.ts       # Orchestration loop (onAgentEnd)
│   ├── effect-executor.ts   # Effect dispatch (agent, node, shell, etc.)
│   ├── task-interceptor.ts  # Intercepts native task/todo tools
│   ├── tui-widgets.ts       # Terminal UI widgets
│   ├── status-line.ts       # Status bar integration
│   ├── tool-renderer.ts     # Message renderers for tool results
│   ├── custom-tools.ts      # Registered tools (run:status, post-result, iterate)
│   ├── guards.ts            # Loop guards and safety checks
│   ├── todo-replacement.ts  # Todo state sync
│   ├── constants.ts         # Shared constants
│   └── types.ts             # TypeScript type definitions
├── tools/                   # Tool definitions exposed to the pi agent
├── skills/babysitter/       # Skill definitions for babysitter orchestration
├── commands/                # CLI commands registered with oh-my-pi
├── scripts/                 # postinstall/preuninstall lifecycle scripts
├── test/                    # Integration, harness, and TUI tests
├── docs/                    # Additional documentation
├── AGENTS.md                # Agent behavioral instructions
├── package.json
└── README.md
```

## License

MIT

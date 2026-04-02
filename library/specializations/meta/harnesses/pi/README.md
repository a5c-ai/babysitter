# Pi Harness Extensibility Reference

Comprehensive documentation for extending the Pi coding agent harness (`@mariozechner/pi-coding-agent`) through the Babysitter plugin system.

Last updated: 2026-04-02

---

## Table of Contents

1. [Overview](#overview)
2. [Extension System](#extension-system)
3. [ExtensionAPI](#extensionapi)
4. [Skills](#skills)
5. [Commands](#commands)
6. [Hooks (Event-Based)](#hooks-event-based)
7. [MCP Integration](#mcp-integration)
8. [PiSessionHandle API](#pisessionhandle-api)
9. [Secure Sandbox](#secure-sandbox)
10. [Repository Instruction Files (AGENTS.md / CLAUDE.md)](#repository-instruction-files)
11. [Distribution and Installation](#distribution-and-installation)
12. [Configuration](#configuration)
13. [SDK Bridge (Direct In-Process Integration)](#sdk-bridge)
14. [Code Examples](#code-examples)
15. [Source File References](#source-file-references)

---

## Overview

Pi is a coding agent from the `pi-mono` monorepo, published as `@mariozechner/pi-coding-agent`. It provides a terminal-based AI coding assistant with an extension system that allows plugins to hook into the agent lifecycle, register custom tools and commands, render custom UI widgets, and intercept tool calls.

The Babysitter integration is distributed as `@a5c-ai/babysitter-pi`, a plugin package that bridges Babysitter's deterministic orchestration model into the Pi agent session. The plugin uses Pi's extension API to drive the Babysitter iteration loop, execute effects, render TUI widgets, and manage run state -- all without spawning CLI subprocesses.

Two Pi variants are supported through the same codebase:

| Variant | CLI Command | Package | Plugin Dir | Env Prefix |
|---------|-------------|---------|------------|------------|
| Pi | `pi` | `@mariozechner/pi-coding-agent` | `~/.pi/plugins/` | `PI_*` |
| Oh-My-Pi | `omp` | `@oh-my-pi/pi-coding-agent` | `~/.omp/plugins/` | `OMP_*` |

Both variants share the same extension API, hook system, and Babysitter adapter implementation. The Oh-My-Pi adapter (`ohMyPi.ts`) wraps the Pi adapter with only the name and environment variable detection differing.

---

## Extension System

Pi extensions are declared in the plugin's `package.json` via the `omp` field. This field specifies the directories containing extensions and skills:

```json
{
  "omp": {
    "extensions": ["./extensions"],
    "skills": ["./skills"]
  }
}
```

Each subdirectory under the declared `extensions` path is treated as an extension. The extension directory name becomes the extension identifier. Each extension must export an `activate` function as its entry point:

```typescript
export async function activate(pi: ExtensionAPI): Promise<void> {
  // Register tools, subscribe to events, set up widgets, etc.
}
```

The `activate` function receives the `ExtensionAPI` instance, which is the primary interface for interacting with the Pi host. All registration, event subscription, and UI manipulation flows through this single object.

### Extension Directory Structure

```
extensions/
  babysitter/
    constants.ts          # Configuration constants, env var names, widget keys
    types.ts              # TypeScript type definitions for ExtensionAPI and run state
    sdk-bridge.ts         # Direct SDK calls (replaces CLI subprocess approach)
    loop-driver.ts        # agent_end handler -- core orchestration loop
    effect-executor.ts    # Maps effect kinds to execution strategies
    result-poster.ts      # Posts task results via SDK commitEffectResult
    task-interceptor.ts   # Blocks native task/todo tools during active runs
    guards.ts             # Iteration guards and doom-loop detection
    custom-tools.ts       # Registers babysitter_run_status, babysitter_post_result, babysitter_iterate
    status-line.ts        # Status bar integration
    tool-renderer.ts      # Custom message renderers for babysitter output types
    tui-widgets.ts        # Run progress, effects queue, quality score widgets
    todo-replacement.ts   # Replaces native todo widget with journal-derived tasks
    cli-wrapper.ts        # [DEPRECATED] CLI subprocess approach, replaced by sdk-bridge
```

---

## ExtensionAPI

The `ExtensionAPI` interface is the primary contract between an extension and the Pi host. It exposes lifecycle event subscription, tool registration, UI rendering, and message injection.

### Lifecycle Events

The `on()` method subscribes to one of 10 lifecycle events:

| Event | Fired When | Typical Use |
|-------|-----------|-------------|
| `session_start` | A new Pi session begins | Auto-bind babysitter run, initialize state |
| `agent_end` | The LLM finishes a turn | **Core loop driver** -- iterate, check guards, inject continuation |
| `session_shutdown` | The session is ending | Clean up resources, clear widgets |
| `before_agent_start` | Just before the LLM is invoked | Inject context, modify system prompt |
| `tool_call` | A tool is about to execute | **Interceptor** -- block native task tools during active runs |
| `tool_result` | A tool has returned a result | Post-process tool output, update widgets |
| `context` | Context assembly phase | Inject babysitter state into the context window |
| `input` | User input received | Pre-process user commands |
| `turn_start` | A conversation turn begins | Record timing, update status line |
| `turn_end` | A conversation turn completes | Record iteration digest, update widgets |

```typescript
pi.on('session_start', (event) => {
  // Initialize babysitter run binding
});

pi.on('agent_end', (event) => {
  // Drive the orchestration loop
});

pi.on('tool_call', (toolName, params) => {
  // Return { block: true, reason: '...' } to intercept
});
```

### Tool Registration

`registerTool(toolDef)` registers a custom tool that the LLM can invoke during a session. The tool definition includes a name, description, JSON Schema parameters, and an async execute handler:

```typescript
pi.registerTool({
  name: 'babysitter_run_status',
  label: 'Babysitter Run Status',
  description: 'Get current babysitter run status including pending effects.',
  parameters: {},
  execute: async (toolCallId, params, signal, onUpdate, ctx) => {
    return { content: '...', details: { ... } };
  },
});
```

The Babysitter plugin registers three tools:

| Tool Name | Purpose |
|-----------|---------|
| `babysitter_run_status` | Returns run ID, process ID, status, iteration count, pending effects |
| `babysitter_post_result` | Posts ok/error result for a pending effect back to the journal |
| `babysitter_iterate` | Manually triggers the next orchestration iteration |

### Command Registration

`registerCommand(name, options)` registers a slash command that users can invoke with `/name`:

```typescript
pi.registerCommand('babysitter:call', {
  description: 'Start a babysitter orchestration run',
  handler: async (...args) => { /* ... */ },
});
```

### Message Rendering

`registerMessageRenderer(type, renderer)` registers a custom renderer for a specific message type. The renderer transforms a payload object into a display string:

```typescript
pi.registerMessageRenderer('babysitter:status', (payload) => {
  return formatRunStatus(payload);  // Returns a formatted box-drawing string
});
```

The Babysitter plugin registers four renderer types:

| Type | Renders |
|------|---------|
| `babysitter:tool-result` | Per-effect execution result with status icon and duration |
| `babysitter:status` | Run overview in a Unicode box-drawing frame |
| `babysitter:effect-result` | Compact one-line effect completion summary |
| `babysitter:iteration` | Iteration progress with pending count |

### Widget Management

`setWidget(key, lines)` sets or updates a TUI widget panel identified by a string key. The widget displays an array of text lines:

```typescript
pi.setWidget('babysitter:run', [
  'Babysitter Run: abc-123',
  'Process: my-process',
  'Iteration: 3/256 | Status: running',
  'Elapsed: 2m 15s',
]);
```

The Babysitter plugin manages five widget keys:

| Widget Key | Content |
|------------|---------|
| `babysitter:run` | Run ID, process, iteration/max, status, elapsed time |
| `babysitter:effects` | List of pending effects with kind and title |
| `babysitter:quality` | Quality score with ASCII progress bar |
| `babysitter:todos` | Journal-derived task checklist replacing native todo |
| `babysitter` (status bar) | Compact one-line status: `Babysitter: iter 3 \| pending 2 \| 5m` |

### Status Bar

`setStatus(key, text)` sets a compact status line in the persistent status bar area:

```typescript
pi.setStatus('babysitter', 'Babysitter: iter 3 | pending 2 | 5m');
```

### Session Log

`appendEntry(entry)` appends a structured entry to the session log:

```typescript
pi.appendEntry({
  type: 'info',
  content: '[babysitter] Run abc-123 completed successfully after 5 iterations.',
});
```

### Message Injection

Two methods inject messages into the conversation:

- `sendMessage(msg)` -- injects a message with any role (user/assistant/system)
- `sendUserMessage(msg)` -- convenience for injecting user-role messages

```typescript
pi.sendUserMessage({ role: 'user', content: '[babysitter] Continue orchestration...' });
pi.sendMessage({ role: 'system', content: '[babysitter:skill] Executing skill: deploy' });
```

---

## Skills

Skills are YAML-frontmatter Markdown files placed in the `skills/` directory declared in `package.json`. Each skill has a `SKILL.md` file:

```
skills/
  babysitter/
    SKILL.md
```

### SKILL.md Format

```markdown
---
name: babysitter
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run...
---

# babysitter

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

## Dependencies
...

## Instructions
...
```

The YAML frontmatter declares the skill name and description (used for discovery and matching). The body contains the full instructions that the agent follows when the skill is activated.

Skills are discovered by the Pi host automatically from the directory declared in the `omp.skills` field of `package.json`.

---

## Commands

Commands are Markdown files with YAML frontmatter placed in the `commands/` directory. Each file defines a slash command:

```
commands/
  babysitter-call.md
  babysitter-status.md
  babysitter-resume.md
  babysitter-doctor.md
```

### Command File Format

```markdown
---
name: babysitter:call
description: Start a babysitter orchestration run
arguments:
  - name: prompt
    description: The task to orchestrate
    required: true
---

Start a babysitter orchestration run. Creates a new run...

## Usage

\`\`\`
/babysitter:call "build feature X"
\`\`\`
```

The YAML frontmatter declares:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Command name (invoked as `/name`) |
| `description` | string | Brief description shown in command listings |
| `arguments` | array | Parameter definitions with name, description, required |

---

## Hooks (Event-Based)

Pi hooks are **event-based, not file-based**. Unlike Claude Code (which uses filesystem hook scripts in `.claude/settings.json`), Pi extensions subscribe to events via `ExtensionAPI.on()`. There are no hook files to create or configure -- all hook behavior is declared in the extension's `activate()` function.

### Key Hook Patterns

**session_start -- Auto-Bind**

The `session_start` event fires at the beginning of every Pi session. The Babysitter plugin uses this to:
1. Bind the current session to the babysitter state directory (`.a5c/`)
2. Check for an active run with pending tasks
3. Resume from the first pending effect if a run exists

**agent_end -- Loop Driver**

The `agent_end` event is the core orchestration hook. When the LLM finishes a turn, the loop driver:
1. Looks up the active run for the current session
2. Checks for a `<promise>...</promise>` completion proof tag
3. Runs guard checks (max iterations, time limits, doom-loop detection)
4. Calls `orchestrateIteration` via the SDK bridge
5. Based on the result: cleans up (completed/failed) or injects a continuation prompt (waiting)

**tool_call -- Interceptor**

The `tool_call` event fires before any tool executes. The task interceptor checks whether a babysitter run is active and blocks native task/todo tools (`task`, `todo_write`, `TodoWrite`, `TaskCreate`, `sub_agent`, `quick_task`) to prevent conflicts with babysitter's own orchestration.

**context -- State Injection**

The `context` event fires during context assembly. Extensions can inject babysitter run state (iteration count, pending effects, phase) into the agent's context window so the LLM is aware of orchestration state.

---

## MCP Integration

Pi does **not** have native MCP (Model Context Protocol) capability. The Pi harness spec in the discovery module does not list `HarnessCapability.Mcp` among its capabilities.

The Babysitter MCP server is available separately via:

```bash
babysitter mcp:serve [--json]
```

This provides the standard Babysitter MCP tools (runs, tasks, sessions, discovery) over stdio transport, but it runs as a standalone process rather than being integrated into the Pi host.

---

## PiSessionHandle API

The `PiSessionHandle` class (from `packages/sdk/src/harness/piWrapper.ts`) provides the Babysitter SDK's programmatic interface for controlling Pi sessions. It wraps `@mariozechner/pi-coding-agent`'s `createAgentSession()` behind a babysitter-friendly API.

### Factory Function

```typescript
import { createPiSession } from '@a5c-ai/babysitter-sdk';

const session = createPiSession({
  workspace: '/path/to/project',
  model: 'anthropic:claude-sonnet-4-20250514',
  timeout: 900_000,
  toolsMode: 'coding',
  bashSandbox: 'auto',
});
```

### PiSessionOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `workspace` | `string` | `process.cwd()` | Working directory for the session |
| `model` | `string` | Pi default | Model identifier (`provider:modelId` or bare `modelId`) |
| `timeout` | `number` | `900000` (15m) | Max ms to wait for a single prompt |
| `thinkingLevel` | `string` | -- | `"minimal"`, `"low"`, `"medium"`, `"high"`, or `"xhigh"` |
| `toolsMode` | `string` | `"default"` | `"default"`, `"coding"`, or `"readonly"` |
| `customTools` | `unknown[]` | -- | Additional tool definitions |
| `uiContext` | `AskUserQuestionUiContext` | -- | UI context for custom tools |
| `systemPrompt` | `string` | -- | Replace the discovered system prompt entirely |
| `appendSystemPrompt` | `string[]` | -- | Append custom instructions to the system prompt |
| `isolated` | `boolean` | `false` | Skip all discovered extensions, skills, AGENTS files |
| `ephemeral` | `boolean` | `false` | Use in-memory session manager (no persistent files) |
| `bashSandbox` | `string` | `"local"` | `"local"`, `"secure"`, or `"auto"` |
| `enableCompaction` | `boolean` | -- | Enable PI session compaction |
| `agentDir` | `string` | -- | Global pi agent config directory |

### Lazy Initialization

The underlying `AgentSession` is created lazily on the first `prompt()` call. Calling `initialize()` explicitly is safe and idempotent:

```typescript
await session.initialize();  // No-op if already initialized
```

### Methods

**`prompt(text, timeout?): Promise<PiPromptResult>`**

Send a prompt and wait for completion. Returns `{ output, exitCode, duration, success }`. Handles the `agent_end` event internally to detect completion. Timeout triggers abort and throws `PiTimeoutError`.

**`steer(text): Promise<void>`**

Deliver a steering message immediately while the agent is processing. Used for mid-turn course correction.

**`followUp(text): Promise<void>`**

Queue a follow-up message for after the current turn completes. Used by the loop driver to inject continuation prompts.

**`subscribe(listener): () => void`**

Subscribe to session events. Returns an unsubscribe function. Events are `PiSessionEvent` objects with a `type` field.

**`executeBash(command, onChunk?): Promise<{ output, exitCode, cancelled }>`**

Execute a bash command through the agent's sandbox. Supports streaming via `onChunk` callback.

**`abort(): Promise<void>`**

Abort the current prompt execution.

**`dispose(): void`**

Dispose of the session and release all resources. Aborts any streaming response before cleanup.

### Properties

- `sessionId: string | undefined` -- The underlying pi session ID
- `isStreaming: boolean` -- Whether the session is currently streaming
- `isInitialized: boolean` -- Whether `initialize()` has completed

### Model Resolution

The model string supports two formats:

1. **`provider:modelId`** -- e.g. `"anthropic:claude-sonnet-4-20250514"`, `"azure-openai-responses:gpt-4.1"` -- resolved via Pi's `ModelRegistry.find(provider, modelId)`
2. **Bare `modelId`** -- e.g. `"gpt-4.1"` -- searched across all providers, preferring those with valid API keys

If no model is found in the registry, the wrapper attempts to synthesize an Azure OpenAI model entry from environment variables.

### Azure OpenAI Support

The Pi wrapper includes specialized Azure OpenAI configuration:

- Normalizes `AZURE_OPENAI_BASE_URL` to ensure it ends with `/openai/v1`
- Bridges `AZURE_OPENAI_PROJECT_NAME` to `AZURE_OPENAI_RESOURCE_NAME`
- Auto-generates `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` from `AZURE_OPENAI_DEPLOYMENT`
- Synthesizes model entries from `AZURE_OPENAI_API_KEY` + resource configuration

---

## Secure Sandbox

The `piSecureSandbox.ts` module provides Docker-based secure command execution for Pi sessions, powered by `@agentsh/secure-sandbox`.

### Architecture

When `bashSandbox` is set to `"secure"` or `"auto"`, the Pi session routes all bash tool execution through a Docker container:

1. A container is started from the configured image (default: `node:22-bookworm`)
2. The project workspace is bind-mounted at `/workspace` inside the container
3. `@agentsh/secure-sandbox` wraps the container with security policies
4. All `executeBash` calls are routed through the sandbox

### Sandbox Modes

| Mode | Behavior |
|------|----------|
| `local` | No sandbox. Commands execute directly on the host. Default. |
| `secure` | Docker sandbox required. Fails if Docker is unavailable. |
| `auto` | Attempts Docker sandbox; falls back to `local` on failure. |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BABYSITTER_PI_SANDBOX_IMAGE` | `node:22-bookworm` | Docker image for the sandbox container |
| `BABYSITTER_PI_SANDBOX_INSTALL_STRATEGY` | `download` | Strategy for installing sandbox dependencies |

### Container Lifecycle

- Container name: `babysitter-pi-<pid>-<random>` (deterministic-ish, avoids collisions)
- Container is removed on dispose (`docker rm -f`)
- Workspace mount: `<host-workspace>:/workspace`
- All path references in commands are translated from host paths to container paths

---

## Repository Instruction Files

The `discoverRepoInstructionPrompts()` function (in `piWrapper.ts`) traverses the directory tree from the workspace up to the git root, collecting instruction files at each level.

### Traversal Algorithm

1. Start at the workspace directory
2. Walk upward to the nearest `.git` directory (the traversal root)
3. At each directory from root to workspace (top-down order), check for:
   - `CLAUDE.md` (preferred)
   - `AGENTS.md` (fallback)
4. The first file found at each level is included; if both exist, `CLAUDE.md` wins

### Output Format

Each discovered file is prepended with a label and injected into the Pi session's system prompt:

```
Repository instructions from path/to/CLAUDE.md:
<file contents>
```

Multiple instruction files from different directory levels are concatenated in top-down order (root first, workspace last).

---

## Distribution and Installation

### Package

- **npm package**: `@a5c-ai/babysitter-pi`
- **Type**: ESM (`"type": "module"`)
- **Peer dependency**: `@mariozechner/pi-coding-agent` (any version)
- **Dependency**: `@a5c-ai/babysitter-sdk` (`^0.0.180`)

### Installation

The Babysitter SDK provides automated installation through the harness adapter:

```bash
# Install the Pi CLI itself
babysitter harness:install pi

# Install the Babysitter plugin into the Pi plugin directory
babysitter harness:install-plugin pi
```

Plugin installation targets:

| Harness | Plugin Directory |
|---------|-----------------|
| Pi | `~/.pi/plugins/babysitter/` |
| Oh-My-Pi | `~/.omp/plugins/babysitter/` |

When `--workspace <dir>` is provided, the plugin installs into the project-local plugin directory instead.

### Published Files

The npm package includes: `bin/`, `package.json`, `extensions/`, `skills/`, `commands/`, `scripts/`.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PI_SESSION_ID` | -- | Current Pi session identifier |
| `PI_PLUGIN_ROOT` | -- | Absolute path to the Pi plugin root directory |
| `OMP_SESSION_ID` | -- | Current Oh-My-Pi session identifier |
| `OMP_PLUGIN_ROOT` | -- | Absolute path to the Oh-My-Pi plugin root directory |
| `BABYSITTER_STATE_DIR` | `.a5c` | Babysitter state directory |
| `BABYSITTER_RUNS_DIR` | `.a5c/runs` | Run storage directory |
| `BABYSITTER_CLI_PATH` | `babysitter` | Path to the babysitter CLI binary |
| `BABYSITTER_MAX_ITERATIONS` | `256` | Maximum orchestration iterations |
| `BABYSITTER_TIMEOUT` | `120000` | General operation timeout (ms) |
| `BABYSITTER_QUALITY_THRESHOLD` | `80` | Minimum quality score to pass |
| `BABYSITTER_LOG_LEVEL` | `info` | Logging verbosity |
| `BABYSITTER_HOOK_TIMEOUT` | `30000` | Per-hook timeout (ms) |
| `BABYSITTER_NODE_TASK_TIMEOUT` | `900000` | Node task timeout (ms) |
| `BABYSITTER_PI_COMPACTION_RESERVE_TOKENS` | `8192` | Tokens reserved for compaction |
| `BABYSITTER_PI_COMPACTION_KEEP_RECENT_TOKENS` | `12288` | Recent tokens kept during compaction |
| `BABYSITTER_PI_BRANCH_SUMMARY_RESERVE_TOKENS` | `4096` | Tokens reserved for branch summary |
| `BABYSITTER_PI_SANDBOX_IMAGE` | `node:22-bookworm` | Docker sandbox image |
| `BABYSITTER_PI_SANDBOX_INSTALL_STRATEGY` | `download` | Sandbox install strategy |
| `AZURE_OPENAI_API_KEY` | -- | Azure OpenAI authentication key |
| `AZURE_OPENAI_RESOURCE_NAME` | -- | Azure OpenAI resource name |
| `AZURE_OPENAI_PROJECT_NAME` | -- | Alias for AZURE_OPENAI_RESOURCE_NAME |
| `AZURE_OPENAI_BASE_URL` | -- | Azure OpenAI base URL (auto-normalized) |
| `AZURE_OPENAI_DEPLOYMENT` | -- | Azure OpenAI deployment name |
| `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` | -- | Model-to-deployment mapping |

### State Directory Resolution

The Pi adapter resolves the state directory through the following priority chain:

1. Explicit `--stateDir` argument
2. `BABYSITTER_STATE_DIR` environment variable
3. `<pluginRoot>/../.a5c` (adjacent to the plugin install root)
4. `.a5c` (relative to CWD)

### Session ID Resolution

Session IDs are resolved from environment variables in order:

1. Explicit `--session-id` argument
2. `OMP_SESSION_ID`
3. `PI_SESSION_ID`

The Pi adapter sets `autoResolvesSessionId()` to `true`, meaning explicitly passing `--session-id` is rejected as a conflict.

---

## SDK Bridge

The Babysitter Pi plugin communicates with the Babysitter runtime through **direct in-process SDK calls**, not CLI subprocesses. The `sdk-bridge.ts` module imports directly from `@a5c-ai/babysitter-sdk`:

```typescript
import {
  createRun,
  orchestrateIteration,
  commitEffectResult,
  loadJournal,
  readRunMetadata,
} from '@a5c-ai/babysitter-sdk';
```

### Bridge Functions

| Function | SDK Equivalent | Purpose |
|----------|---------------|---------|
| `createNewRun(opts)` | `createRun()` | Create a new babysitter run |
| `iterate(runDir)` | `orchestrateIteration()` | Run one orchestration iteration |
| `postResult(opts)` | `commitEffectResult()` | Post an effect result to the journal |
| `getRunStatus(runDir)` | `readRunMetadata()` + `loadJournal()` | Derive run status from journal events |
| `getPendingEffects(runDir)` | (via `getRunStatus`) | List pending (unresloved) effects |

All errors are wrapped in `SdkBridgeError` with the original cause preserved.

The deprecated `cli-wrapper.ts` module (which spawned `babysitter` as a child process) is retained for backward compatibility but should not be used in new code.

---

## Code Examples

### Extension Activation

See `examples/extension-activate.ts` for a complete example of an extension entry point that registers tools, subscribes to lifecycle events, and sets up TUI widgets.

### Plugin Manifest

See `examples/package.json` for an example `package.json` with the `omp` field declaring extensions and skills directories.

### Creating a Pi Session Programmatically

```typescript
import { createPiSession } from '@a5c-ai/babysitter-sdk';

const session = createPiSession({
  workspace: process.cwd(),
  model: 'anthropic:claude-sonnet-4-20250514',
  toolsMode: 'coding',
  bashSandbox: 'auto',
  appendSystemPrompt: ['Always explain your reasoning before making changes.'],
});

try {
  const result = await session.prompt('Refactor the auth module to use JWT');
  console.log(`Success: ${result.success}, Output: ${result.output}`);
} finally {
  session.dispose();
}
```

### Registering a Custom Tool

```typescript
pi.registerTool({
  name: 'my_custom_tool',
  label: 'My Custom Tool',
  description: 'Does something useful.',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'The input value' },
    },
    required: ['input'],
  },
  execute: async (toolCallId, params, signal, onUpdate, ctx) => {
    const input = params.input as string;
    return {
      content: `Processed: ${input}`,
      details: { processed: true },
    };
  },
});
```

### Intercepting Tool Calls

```typescript
pi.on('tool_call', (toolName, params) => {
  if (toolName === 'dangerous_tool' && isRunActive()) {
    return { block: true, reason: 'Blocked during active orchestration run.' };
  }
  return null;  // Allow
});
```

---

## Source File References

See [references.md](./references.md) for a complete index of source files with descriptions and locations.

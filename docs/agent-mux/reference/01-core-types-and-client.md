# Core Types, Client, and Package Identity

**Specification v1.0** | `@a5c-ai/agent-comm-mux`

---

## 1. Package Identity

### 1.1 Package Coordinates

| Field | Value |
|---|---|
| npm scope | `@a5c-ai` |
| Core runtime package | `@a5c-ai/agent-comm-mux` |
| Convenience meta-package | `@a5c-ai/agent-mux` |
| CLI binary | `amux` |
| Language | TypeScript, strict mode |
| Runtime | Node.js 20.9.0 or later (first LTS release of v20) |
| Module system | ESM package (`"type": "module"`); `import`, `require`, and `default` export-map conditions all resolve to the same ESM build |
| License | MIT |
| Canonical package doc | `packages/agent-mux/core/README.md` |
| Reference mirror | `docs/agent-mux/reference/01-core-types-and-client.md` |

### 1.2 Package Structure

The package family is split across several published packages in the babysitter
monorepo. Consumers choose the granularity they need, but the current runtime
dependency story must match the published package graph.

| Package | Purpose | Runtime dependencies |
|---|---|---|
| `@a5c-ai/agent-comm-mux` | `AgentMuxClient`, normalized events, type definitions, provider/hook/workspace helpers, and stream/runtime primitives | `@a5c-ai/atlas`, `@a5c-ai/agent-mux-observability` |
| `@a5c-ai/agent-mux-adapters` | All built-in adapter implementations (claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes) | `@a5c-ai/agent-comm-mux` |
| `@a5c-ai/agent-mux-cli` | CLI binary (`amux`) | `@a5c-ai/agent-comm-mux`, `@a5c-ai/agent-mux-adapters` |
| `@a5c-ai/agent-mux` | Convenience meta-package: re-exports core + adapters + cli | All three above |

### 1.3 Installation

```bash
# Core runtime only
npm install @a5c-ai/agent-comm-mux

# SDK/runtime with built-in adapters
npm install @a5c-ai/agent-comm-mux @a5c-ai/agent-mux-adapters

# SDK + CLI (everything)
npm install @a5c-ai/agent-mux

# Zero-install CLI via npx
npx @a5c-ai/agent-mux
```

Import the package as ESM:

```typescript
import { createClient } from '@a5c-ai/agent-comm-mux';
import { classifyTool } from '@a5c-ai/agent-comm-mux/browser';
import { buildKanbanProjectBoard } from '@a5c-ai/agent-comm-mux/kanban';
import type { AutomationRule } from '@a5c-ai/agent-comm-mux/automation';
```

There is no separate CommonJS build. CommonJS callers should use dynamic import
(`await import('@a5c-ai/agent-comm-mux')`) rather than assuming a CJS shim.

The core package's two runtime dependencies are intentional parts of the current
architecture:

- `@a5c-ai/atlas/catalog` supplies the harness image catalog plus host-detection
  rules and metadata used by invocation and host helpers.
- `@a5c-ai/agent-mux-observability` supplies the structured logging and telemetry
  primitives used by the client, auth/session flows, and run-handle implementation.

The documented public subpath surface is:

- `@a5c-ai/agent-comm-mux`
- `@a5c-ai/agent-comm-mux/browser`
- `@a5c-ai/agent-comm-mux/kanban`
- `@a5c-ai/agent-comm-mux/automation`

Package release verification should keep these subpaths aligned with the
published `dist/index.*`, `dist/browser.*`, `dist/kanban.*`, and
`dist/automation.*` artifacts.

### 1.4 Supported Agents

The following ten agents are supported as built-in adapters in v1:

| Agent Name | CLI Binary | Description |
|---|---|---|
| `claude` | `claude` | Anthropic Claude Code |
| `codex` | `codex` | OpenAI Codex CLI |
| `gemini` | `gemini` | Google Gemini CLI |
| `copilot` | `copilot` | GitHub Copilot CLI (via `gh copilot`) |
| `cursor` | `cursor` | Cursor editor CLI |
| `opencode` | `opencode` | OpenCode CLI |
| `pi` | `pi` | Pi coding agent |
| `omp` | `omp` | oh-my-pi coding agent |
| `openclaw` | `openclaw` | OpenClaw multi-channel agent |
| `hermes` | `hermes` | NousResearch Hermes agent (install: `pip install hermes-agent` or `uv pip install hermes-agent`; requires Python >= 3.11) |

The `AgentName` type is a union of these string literals plus `string` to support plugin adapters registered at runtime.

```typescript
type BuiltInAgentName =
  | 'claude'
  | 'codex'
  | 'gemini'
  | 'copilot'
  | 'cursor'
  | 'opencode'
  | 'pi'
  | 'omp'
  | 'openclaw'
  | 'hermes';

type AgentName = BuiltInAgentName | (string & {});
```

The `(string & {})` intersection preserves IDE autocompletion for built-in names while accepting arbitrary strings for plugin-registered adapters.

---

## 2. Core Concepts

### 2.1 Agent

An **Agent** is a local CLI-based AI coding agent that can be spawned as a subprocess. Agents are external programs installed on the user's system. agent-mux does not embed, bundle, or proxy any agent -- it drives them through their CLI interface.

Each agent is identified by a unique `AgentName` string. agent-mux provides adapters for ten built-in agents (see Section 1.4). Additional agents can be registered via the plugin adapter contract.

### 2.2 Adapter

An **Adapter** is agent-mux's internal representation of a specific agent. Each adapter encapsulates complete knowledge of a single agent:

- **Installation**: how to install the agent on each platform, prerequisites, and version requirements.
- **Spawning**: how to construct CLI arguments, environment variables, and working directory for a subprocess invocation.
- **Output parsing**: how to parse the agent's stdout/stderr stream into normalized `AgentEvent` objects.
- **Session management**: where the agent stores session files, how to enumerate and read them.
- **Configuration**: where native config files live, their schema, and how to read/write them.
- **Capabilities**: a structured manifest of what the agent (and each of its models) can do.
- **Authentication**: how to detect authentication state and provide setup guidance.
- **Plugins**: (where supported) how to list, install, search, and remove plugins.

Adapters implement the `AgentAdapter` interface and extend `BaseAgentAdapter`. Built-in adapters are registered automatically when `@a5c-ai/agent-mux-adapters` is loaded. Custom adapters are registered via `mux.adapters.register()`.

### 2.3 Run

A **Run** is a single invocation of an agent. When `mux.run(options)` is called, agent-mux:

1. Resolves the target adapter from `options.agent`.
2. Validates `options` against the adapter's capabilities (throwing `CapabilityError` if unsatisfied).
3. Constructs CLI arguments via `adapter.buildSpawnArgs()`.
4. Spawns the agent as a child process.
5. Returns a `RunHandle` immediately.

Each run is:
- **Async**: the `RunHandle` is returned before the agent produces output.
- **Event-streaming**: output is parsed into typed `AgentEvent` objects and emitted on the `RunHandle`.
- **Concurrency-safe**: each run has its own subprocess, stdio pipes, temp directory, and internal state. Multiple runs can execute simultaneously without interference.

Runs are identified by a `runId` (a ULID string). If `options.runId` is not provided, one is generated automatically.

### 2.4 Session

A **Session** is the agent's own persistent record of a conversation. Sessions are stored in the agent's native format and location (see Section 4.3 for the per-agent session file locations). agent-mux reads sessions on demand through the `SessionManager` but never owns, replicates, or modifies session data directly.

Sessions are identified by the agent's native session ID. agent-mux maps between native session IDs and its own unified identifiers via the `run-index.jsonl` log.

### 2.5 Event

An **Event** is a typed, normalized unit of output from a run. All agent-specific output formats (JSON lines, plain text, structured messages, etc.) are parsed by the adapter into the unified `AgentEvent` union type. Events are emitted on the `RunHandle` via both the async iterator and EventEmitter interfaces.

Every event extends `BaseEvent`:

```typescript
interface BaseEvent {
  /** Discriminator tag for the event union type. */
  type: string;

  /** ULID of the run that produced this event. */
  runId: string;

  /** Name of the agent that produced this event. */
  agent: AgentName;

  /**
   * Unix epoch milliseconds when this event was created by agent-mux.
   * This is the parse time, not the agent's internal timestamp.
   */
  timestamp: number;

  /**
   * The raw, unparsed line from the agent's output.
   * Present only when the client is created with `debug: true`
   * or the run is started with `debug: true`.
   * Omitted in production to reduce memory pressure.
   */
  raw?: string;
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `type` | `string` | Yes | -- | Event discriminator. Matches one of the `AgentEvent` union members. |
| `runId` | `string` | Yes | -- | ULID identifying the run. |
| `agent` | `AgentName` | Yes | -- | Agent that produced the event. |
| `timestamp` | `number` | Yes | -- | Unix epoch milliseconds at event parse time. |
| `raw` | `string` | No | `undefined` | Unparsed agent output line. Only present in debug mode. |

### 2.6 Capabilities

**Capabilities** are a structured manifest of what an agent adapter (and each of its models) can do. Consumers use capabilities for feature-gating: before requesting a feature like thinking or MCP, the consumer can check whether the target agent supports it, avoiding runtime errors.

Capabilities exist at two levels:
- **Agent-level** (`AgentCapabilities`): static properties of the adapter itself -- session support, streaming modes, plugin formats, platform support, etc.
- **Model-level** (`ModelCapabilities`): per-model properties -- context window, pricing, thinking support, tool calling, etc.

When a `RunOptions` field requires a capability that the agent does not have, agent-mux throws a `CapabilityError` before spawning the subprocess.

### 2.7 Profile

A **Profile** is a named set of `RunOptions` stored on disk. Profiles allow consumers to switch between configurations (e.g., "fast" vs. "careful") without changing code.

Profiles are stored as JSON files:
- **Global profiles**: `~/.agent-mux/profiles/<name>.json` -- shared across all projects.
- **Project profiles**: `.agent-mux/profiles/<name>.json` -- project-specific.

Project profiles override global profiles when both exist with the same name. Override is a deep merge: project profile fields replace global profile fields at the leaf level.

Profile files contain a subset of `RunOptions` fields. The following per-run ephemeral fields are excluded and must not appear in a profile: `prompt`, `onInputRequired`, `onApprovalRequest`, `env`, `cwd`, `sessionId`, `forkSessionId`, `noSession`, `attachments`, `runId`, `projectId`, `profile`, `agentsDoc`. See spec 02 §10.3 for the complete prohibited fields table.

> **Note:** `systemPrompt` and `systemPromptMode` ARE valid profile fields (they can be meaningfully reused across runs as defaults). See spec 02 §10.2 `ProfileData` interface.

```typescript
interface ProfileData {
  /** The agent to use. */
  agent?: AgentName;

  /** The model to use. */
  model?: string;

  /** Approval mode. */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /** Run timeout in milliseconds. */
  timeout?: number;

  /** Inactivity timeout in milliseconds. */
  inactivityTimeout?: number;

  /** Maximum turns. */
  maxTurns?: number;

  /** Thinking effort level. */
  thinkingEffort?: 'low' | 'medium' | 'high' | 'max';

  /** Thinking budget in tokens. */
  thinkingBudgetTokens?: number;

  /** Override thinking behavior entirely: arbitrary native thinking parameters passed directly to the underlying provider (escape hatch). */
  thinkingOverride?: Record<string, unknown>;

  /** Temperature for sampling. */
  temperature?: number;

  /** Top-P for sampling. */
  topP?: number;

  /** Top-K for sampling. */
  topK?: number;

  /** Maximum output tokens. */
  maxTokens?: number;

  /** Maximum output tokens (alias). */
  maxOutputTokens?: number;

  /** Streaming mode. */
  stream?: boolean | 'auto';

  /** Output format. */
  outputFormat?: 'text' | 'json' | 'jsonl';

  /** Retry policy. */
  retryPolicy?: RetryPolicy;

  /** System prompt. */
  systemPrompt?: string;

  /** System prompt injection mode. */
  systemPromptMode?: 'prepend' | 'append' | 'replace';

  /** Skills to load. */
  skills?: string[];

  /** MCP server configurations. */
  mcpServers?: McpServerConfig[];

  /** Tags for run indexing. */
  tags?: string[];
}
```

### 2.8 Plugin

A **Plugin** is an extension to an agent's capabilities. Plugins encompass a broad category of add-ons -- skills, tools, themes, MCP servers, channel connectors, etc. Plugin support is agent-specific and gated by the `supportsPlugins` capability flag.

Plugin formats vary by agent:

```typescript
type PluginFormat =
  | 'npm-package'
  | 'skill-file'
  | 'skill-directory'
  | 'extension-ts'
  | 'channel-plugin'
  | 'mcp-server';
```

| Format | Description | Used By |
|---|---|---|
| `npm-package` | Published npm package | opencode, pi, omp, openclaw |
| `skill-file` | Single file defining a skill | opencode, pi, omp, openclaw, hermes |
| `skill-directory` | Directory containing skill assets | claude (via `--add-dir`), hermes (`~/.hermes/skills/`) |
| `extension-ts` | TypeScript extension file | cursor |
| `channel-plugin` | Channel connector plugin | openclaw |
| `mcp-server` | MCP server configuration | claude, cursor, opencode, openclaw, hermes |

**Plugin support per built-in agent:**

| Agent | supportsPlugins | Format(s) | Registry |
|---|---|---|---|
| Claude Code | partial | skill-directory, mcp-server | -- (via `--add-dir`) |
| Codex CLI | no | -- | -- |
| Gemini CLI | no | -- | -- |
| Copilot CLI | no | -- | -- |
| Cursor | yes | extension-ts, mcp-server | cursor.sh/extensions |
| OpenCode | yes | npm-package, skill-file, mcp-server | npm (opencode-*) |
| Pi | yes | npm-package, skill-file | npm (@mariozechner/pi-*) |
| omp | yes | npm-package, skill-file | npm (@oh-my-pi/*) |
| OpenClaw | yes | npm-package, skill-file, channel-plugin | npm + openclaw.ai/plugins |
| Hermes | yes | skill-file, skill-directory, mcp-server | agentskills.io |

agent-mux provides a unified `PluginManager` interface that delegates to each agent's native plugin system. Calling any `PluginManager` method on an agent where `supportsPlugins` is `false` throws a `CapabilityError`.

**MCP support per built-in agent:**

Hermes supports MCP in both client mode (connecting to external MCP servers for extended tool capabilities) and server mode (exposing itself as an MCP server via `hermes-acp`). This is reflected in `AgentCapabilities.supportsMCP: true` for the hermes adapter.

---

## 3. Error Types

agent-mux defines a hierarchy of typed error classes. All errors extend the base `AgentMuxError`.

### 3.1 AgentMuxError (Base)

```typescript
class AgentMuxError extends Error {
  /** Machine-readable error code. */
  readonly code: ErrorCode;

  /** Whether the operation can be retried. */
  readonly recoverable: boolean;

  constructor(code: ErrorCode, message: string, recoverable?: boolean);
}

/** Error codes defined by this spec. The scope document delegates error code definition to the spec. */
type ErrorCode =
  | 'CAPABILITY_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'AGENT_NOT_FOUND'
  | 'AGENT_NOT_INSTALLED'
  | 'AGENT_CRASH'
  | 'SPAWN_ERROR'
  | 'TIMEOUT'
  | 'INACTIVITY_TIMEOUT'
  | 'PARSE_ERROR'
  | 'CONFIG_ERROR'
  | 'CONFIG_LOCK_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'PLUGIN_ERROR'
  | 'RATE_LIMITED'
  | 'CONTEXT_EXCEEDED'
  | 'ABORTED'
  | 'RUN_NOT_ACTIVE'
  | 'STDIN_NOT_AVAILABLE'
  | 'NO_PENDING_INTERACTION'
  | 'INVALID_STATE_TRANSITION'
  | 'PTY_NOT_AVAILABLE'
  | 'INTERNAL';
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `code` | `ErrorCode` | Yes | -- | Machine-readable error code for programmatic handling. |
| `message` | `string` | Yes | -- | Human-readable error description. |
| `recoverable` | `boolean` | Yes | `false` | Whether the caller can retry the operation. |

### 3.2 CapabilityError

Thrown when a `RunOptions` field or API call requires a capability that the target agent or model does not support.

```typescript
class CapabilityError extends AgentMuxError {
  /** The agent that lacks the capability. */
  readonly agent: AgentName;

  /** The capability that was requested. */
  readonly capability: string;

  /** The model that was targeted, if applicable. */
  readonly model?: string;

  constructor(agent: AgentName, capability: string, model?: string);
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `agent` | `AgentName` | Yes | -- | The agent that lacks the required capability. |
| `capability` | `string` | Yes | -- | Human-readable name of the missing capability (e.g., `"thinking"`, `"mcp"`, `"plugins"`). |
| `model` | `string` | No | `undefined` | The specific model that was targeted, if the capability is model-level. |

**When thrown from the client:**

- `mux.run()` with `thinkingEffort` set when the selected model has `supportsThinking: false`.
- `mux.run()` with `stream: true` when the adapter has `supportsTextStreaming: false`.
- `mux.run()` with `mcpServers` set when the adapter has `supportsMCP: false`.
- `mux.run()` with `skills` set when the adapter has `supportsSkills: false`.
- `mux.run()` with `outputFormat: 'json'` when the adapter has `supportsJsonMode: false`.
- `mux.plugins.list()`, `.install()`, `.uninstall()`, `.update()`, `.updateAll()`, `.search()`, `.browse()`, or `.info()` on an agent where `supportsPlugins` is `false`.

### 3.3 ValidationError

Thrown when input values fail schema or range validation.

```typescript
class ValidationError extends AgentMuxError {
  /** The field(s) that failed validation. */
  readonly fields: ValidationFieldError[];

  constructor(fields: ValidationFieldError[]);
}

interface ValidationFieldError {
  /** Dot-path to the invalid field (e.g., "temperature"). */
  field: string;

  /** What went wrong. */
  message: string;

  /** The value that was provided. */
  received: unknown;

  /** The expected type or range. */
  expected: string;
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `fields` | `ValidationFieldError[]` | Yes | -- | Array of individual field errors. Always contains at least one entry. |

**When thrown from the client:**

- `createClient()` with invalid option values (e.g., negative `timeout`).
- `mux.run()` with `temperature` outside `[0.0, 2.0]`.
- `mux.run()` with `topP` outside `[0.0, 1.0]`.
- `mux.run()` with `topK` less than `1`.
- `mux.run()` with `maxTokens` or `maxOutputTokens` less than `1`.
- `mux.run()` with `thinkingBudgetTokens` less than `1024` or greater than the model's `maxThinkingTokens`.
- `mux.run()` with empty `prompt`.
- `mux.config.set()` or `mux.config.setField()` with values that fail the agent's config schema.
- `mux.profiles` methods with invalid profile data.

### 3.4 AuthError

Thrown when an agent's authentication state prevents the requested operation.

```typescript
class AuthError extends AgentMuxError {
  /** The agent with the auth problem. */
  readonly agent: AgentName;

  /** Current auth status. */
  readonly status: 'unauthenticated' | 'expired' | 'unknown';

  /** Human-readable guidance on how to authenticate. */
  readonly guidance: string;

  constructor(agent: AgentName, status: AuthError['status'], guidance: string);
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `agent` | `AgentName` | Yes | -- | The agent that requires authentication. |
| `status` | `'unauthenticated' \| 'expired' \| 'unknown'` | Yes | -- | The detected auth state. |
| `guidance` | `string` | Yes | -- | Instructions for the user to authenticate (e.g., "Run `claude auth login` to authenticate"). |

**When thrown from the client:**

- `mux.run()` when `mux.auth.check(agent)` returns a status other than `'authenticated'` and the agent's adapter reports that authentication is required to operate. Note: not all agents require auth checks before spawning; some report auth errors only after the subprocess starts, in which case an `auth_error` event is emitted instead.

---

## 4. Storage Layout

agent-mux uses two directory trees. **Project-level configuration overrides global configuration** via deep merge at the field level.

### 4.1 Global Directory: `~/.agent-mux/`

```
~/.agent-mux/
  config.json          # Global SDK defaults
  profiles/            # Named RunOptions presets, shared across projects
    fast.json
    careful.json
  auth-hints.json      # Cached auth state hints per agent (read-only cache)
```

#### 4.1.1 Platform-Specific Home Directory Resolution

| Platform | `~` resolves to | Full path |
|---|---|---|
| macOS | `$HOME` (typically `/Users/<user>`) | `/Users/<user>/.agent-mux/` |
| Linux | `$HOME` (typically `/home/<user>`) | `/home/<user>/.agent-mux/` |
| Windows | `%USERPROFILE%` (typically `C:\Users\<user>`) | `C:\Users\<user>\.agent-mux\` |

The `configDir` option on `createClient()` overrides this path entirely. When set, no platform resolution occurs.

Resolution order for the home directory:
1. `createClient({ configDir })` if provided.
2. `AGENT_MUX_CONFIG_DIR` environment variable if set (defined by this spec; not in the scope document).
3. `path.join(os.homedir(), '.agent-mux')`.

#### 4.1.2 `config.json` -- Global Configuration

```typescript
interface GlobalConfig {
  /**
   * Default agent used when `RunOptions.agent` is not specified
   * and no profile overrides it.
   */
  defaultAgent?: AgentName;

  /**
   * Default model used when `RunOptions.model` is not specified.
   * Agent-specific; ignored if the agent does not support this model.
   */
  defaultModel?: string;

  /**
   * Default approval mode for tool calls and file operations.
   * @default 'prompt'
   */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /**
   * Default run timeout in milliseconds. 0 means no timeout.
   * @default 0
   */
  timeout?: number;

  /**
   * Default inactivity timeout in milliseconds. 0 means no timeout.
   * @default 0
   */
  inactivityTimeout?: number;

  /**
   * Default retry policy.
   */
  retryPolicy?: RetryPolicy;

  /**
   * Default streaming mode.
   * @default 'auto'
   */
  stream?: boolean | 'auto';
}
```

| Field | Type | Required | Default | Valid Range | Description |
|---|---|---|---|---|---|
| `defaultAgent` | `AgentName` | No | `undefined` | Any registered agent name | Agent used when none is specified in `RunOptions`. |
| `defaultModel` | `string` | No | `undefined` | Agent-dependent | Model used when none is specified. |
| `approvalMode` | `'yolo' \| 'prompt' \| 'deny'` | No | `'prompt'` | One of the three literals | How tool calls are approved. |
| `timeout` | `number` | No | `0` | `>= 0` (integer, milliseconds) | Run timeout. `0` disables. |
| `inactivityTimeout` | `number` | No | `0` | `>= 0` (integer, milliseconds) | Inactivity timeout. `0` disables. |
| `retryPolicy` | `RetryPolicy` | No | `undefined` | See `RetryPolicy` definition | Retry behavior on transient failures. |
| `stream` | `boolean \| 'auto'` | No | `'auto'` | `true`, `false`, or `'auto'` | Streaming mode. |

**File format**: UTF-8 encoded JSON. No BOM. Trailing newline permitted. Comments are not supported (strict JSON).

**Missing file behavior**: If `config.json` does not exist, agent-mux uses built-in defaults. The file is never auto-created; it is only written when the user explicitly calls `mux.config` write methods or `amux config set`.

**Corrupt file behavior**: If `config.json` exists but cannot be parsed as valid JSON, agent-mux throws a `ConfigError` with code `CONFIG_ERROR`, message identifying the parse error location, and `recoverable: false`. The client does not fall back to defaults when a config file exists but is corrupt -- this is treated as an explicit error to avoid silent misconfiguration.

#### 4.1.3 `profiles/` -- Global Profiles

Each file in this directory is a JSON file named `<profile-name>.json` containing a `ProfileData` object (see Section 2.7). Profile names must match the regex `^[a-zA-Z0-9_-]{1,64}$`. Files that do not match this pattern are ignored.

#### 4.1.4 `auth-hints.json` -- Cached Auth State

```typescript
interface AuthHintsFile {
  /** Schema version for forward compatibility. */
  version: 1;

  /** Per-agent cached auth state. */
  agents: Record<AgentName, AuthHintEntry>;
}

interface AuthHintEntry {
  /** Last detected auth status. */
  status: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown';

  /** Auth method that was detected. */
  method?: string;

  /** Identity string (e.g., email or username). */
  identity?: string;

  /** When this hint expires and should be re-checked. */
  expiresAt?: string;

  /** ISO 8601 timestamp of when this hint was last updated. */
  checkedAt: string;
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `version` | `1` | Yes | -- | Schema version. Always `1` in v1. |
| `agents` | `Record<AgentName, AuthHintEntry>` | Yes | `{}` | Map of agent names to cached auth hints. |

**Security note**: This file is a read-only cache of heuristic auth state. It does **not** contain credentials, tokens, API keys, or any secret material. It caches only the result of auth detection (status, method, identity display name) to avoid expensive re-checks on every run. Entries are invalidated based on `expiresAt` or when `mux.auth.check()` is called explicitly.

**File permissions**: On POSIX systems (macOS, Linux), this file is created with mode `0600` (owner read/write only). On Windows, file permissions rely on the default user ACL.

### 4.2 Project Directory: `.agent-mux/`

Located in the project root (the working directory or the nearest ancestor containing a `.agent-mux/` directory).

```
.agent-mux/
  config.json          # Project-level overrides of global config
  profiles/            # Project-specific profiles (override/extend global)
  run-index.jsonl      # Append-only run log
```

Resolution order for the project directory:
1. `createClient({ projectConfigDir })` if provided.
2. `AGENT_MUX_PROJECT_DIR` environment variable if set (defined by this spec; not in the scope document).
3. Walk up from `process.cwd()` looking for a `.agent-mux/` directory.
4. If not found, use `path.join(process.cwd(), '.agent-mux')` as the default (created lazily on first write).

#### 4.2.1 `config.json` -- Project Configuration

Same schema as the global `config.json` (Section 4.1.2). Project values override global values via deep merge: for scalar fields, the project value replaces the global value; for object fields, the merge is recursive; for array fields, the project value replaces the global value entirely (no concatenation).

#### 4.2.2 `profiles/` -- Project Profiles

Same format as global profiles (Section 4.1.3). When a profile name exists in both global and project directories, the project profile is deep-merged on top of the global profile using the same rules as config.json.

#### 4.2.3 `run-index.jsonl` -- Run Index

The only persistent data agent-mux writes. An append-only JSONL (JSON Lines) file where each line is a self-contained JSON object recording one run.

```typescript
interface RunIndexEntry {
  /** Schema version for the entry format. */
  v: 1;

  /** ULID of the run. Globally unique, time-sortable. */
  runId: string;

  /** Agent that was invoked. */
  agent: AgentName;

  /** Model that was used (if known). */
  model?: string;

  /** The agent's native session ID (if applicable). */
  sessionId?: string;

  /**
   * ISO 8601 timestamp when the run started.
   * Always in UTC with 'Z' suffix.
   */
  timestamp: string;

  /** Cost record, if cost data was available. */
  cost?: CostRecord;

  /** Consumer-provided tags for filtering and grouping. */
  tags: string[];
}
```

The fields `runId`, `agent`, `model`, `sessionId`, `cost`, `timestamp`, and `tags` are specified by the scope document (Section 4). The `v` field is added by this spec for forward-compatible schema evolution. Together these fields must serialize to under 512 bytes per entry to guarantee atomic appends (see Concurrency below).

| Field | Type | Required | Default | Valid Range | Description |
|---|---|---|---|---|---|
| `v` | `1` | Yes | -- | `1` | Schema version. Readers must ignore entries with unknown versions. |
| `runId` | `string` | Yes | -- | ULID format (26 chars) | Unique run identifier. |
| `agent` | `AgentName` | Yes | -- | Registered agent name | Agent that was invoked. |
| `model` | `string` | No | `undefined` | Agent-dependent | Model used for the run. |
| `sessionId` | `string` | No | `undefined` | Agent-dependent | Native session ID from the agent. |
| `timestamp` | `string` | Yes | -- | ISO 8601 UTC | When the run started. |
| `cost` | `CostRecord` | No | `undefined` | -- | Aggregated cost data (written on run completion). |
| `tags` | `string[]` | Yes | `[]` | Array of non-empty strings | Consumer-provided tags. |

```typescript
interface CostRecord {
  /** Total cost in USD. */
  totalUsd: number;

  /** Input tokens consumed. */
  inputTokens: number;

  /** Output tokens generated. */
  outputTokens: number;

  /** Thinking/reasoning tokens (if applicable). */
  thinkingTokens?: number;

  /** Cached input tokens (if applicable). */
  cachedTokens?: number;
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `totalUsd` | `number` | Yes | -- | Estimated total cost in US dollars. |
| `inputTokens` | `number` | Yes | -- | Number of input tokens consumed. |
| `outputTokens` | `number` | Yes | -- | Number of output tokens generated. |
| `thinkingTokens` | `number` | No | `undefined` | Thinking/reasoning tokens used. |
| `cachedTokens` | `number` | No | `undefined` | Tokens served from cache. |

**Versioning**: Each entry carries a `v` field. The current version is `1`. When the schema evolves, the version number increments. Readers must tolerate and skip entries with unknown version numbers. Writers always write the current version.

**Concurrency**: The file is opened in append mode (`O_APPEND`). On POSIX systems, appends smaller than `PIPE_BUF` are atomic. `PIPE_BUF` is 4096 bytes on Linux and 512 bytes on macOS. Each JSON line is guaranteed to be under 512 bytes (the most restrictive `PIPE_BUF` value across supported platforms), ensuring atomic appends on all POSIX systems without file locking. On Windows, file appends use `FILE_APPEND_DATA` which provides equivalent atomicity for writes of this size. No file lock is required for appending.

**Corruption recovery**: If the last line of the file is incomplete (e.g., due to a process crash during write), readers skip any line that fails JSON parsing and log a debug-level warning. Valid entries before and after the corrupt line are processed normally.

### 4.3 Native Agent Session and Config Locations

For reference, the per-agent native file locations. These are the files agent-mux reads through the `SessionManager` and `ConfigManager`.

#### Session Storage

| Agent | Session Location | Format |
|---|---|---|
| Claude Code | `~/.claude/projects/<hash>/` | JSONL per session |
| Codex CLI | `~/.codex/sessions/` | JSONL |
| Gemini CLI | `~/.gemini/sessions/` | JSONL |
| Copilot CLI | `~/.config/github-copilot/sessions/` | JSON |
| Cursor | `~/.cursor/sessions/` | SQLite |
| OpenCode | `~/.local/share/opencode/` | SQLite |
| Pi | `~/.pi/agent/sessions/` | JSONL tree (id + parentId) |
| omp | `~/.omp/agent/sessions/` | JSONL tree (id + parentId) |
| OpenClaw | `~/.openclaw/sessions/` | JSON per channel/session |
| Hermes | `~/.hermes/` | SQLite with FTS5 full-text search extensions |

#### Config Locations

| Agent | Global Config | Project Config |
|---|---|---|
| Claude Code | `~/.claude/settings.json` | `.claude/settings.json` |
| Codex CLI | `~/.codex/config.json` | `.codex/config.json` |
| Gemini CLI | `~/.config/gemini/settings.json` | `.gemini/settings.json` |
| Copilot CLI | `~/.config/github-copilot/settings.json` | -- |
| Cursor | `~/.cursor/settings.json` | `.cursor/settings.json` |
| OpenCode | `~/.config/opencode/opencode.json` | `.opencode/opencode.json` |
| Pi | `~/.pi/agent/settings.json` | -- |
| omp | `~/.omp/agent/settings.json` | -- |
| OpenClaw | `~/.openclaw/config.json` | -- |
| Hermes | `~/.hermes/cli-config.yaml` | -- |

Note: Hermes uses YAML for its native configuration (`cli-config.yaml`) while all other agents use JSON. The `ConfigManager` handles this transparently -- consumers interact with a unified JSON-based interface regardless of the native format.

### 4.4 Directory Creation Behavior

- **Global directory** (`~/.agent-mux/`): Created lazily on first write operation (e.g., `mux.config.set()`, `mux.auth.check()` caching a hint). Read operations do not create the directory; they return defaults when the directory is absent.
- **Project directory** (`.agent-mux/`): Created explicitly by `amux init` or lazily on first run (when a `run-index.jsonl` entry must be appended). The `createClient()` call itself does not create any directories.
- **Subdirectories** (`profiles/`): Created lazily when the first profile is written.

Missing parent directories are created recursively using `mkdir -p` semantics (Node.js `fs.mkdir` with `recursive: true`).

---

## 5. AgentMuxClient -- Main Entry Point

### 5.1 `createClient()` Factory

The `createClient()` function is the sole entry point for creating an `AgentMuxClient` instance. It is a synchronous factory that validates options and returns the client immediately. No I/O is performed during construction.

```typescript
import { createClient } from '@a5c-ai/agent-mux';

function createClient(options?: ClientOptions): AgentMuxClient;
```

#### 5.1.1 `ClientOptions`

```typescript
interface ClientOptions {
  /**
   * Default agent for runs when `RunOptions.agent` is not specified.
   * Also overrides the value in config.json.
   */
  defaultAgent?: AgentName;

  /**
   * Default model for runs when `RunOptions.model` is not specified.
   */
  defaultModel?: string;

  /**
   * Default approval mode for tool calls and file operations.
   * @default 'prompt'
   */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /**
   * Default run timeout in milliseconds. 0 means no timeout.
   * Must be a non-negative integer.
   * @default 0
   */
  timeout?: number;

  /**
   * Default inactivity timeout in milliseconds. 0 means no timeout.
   * Must be a non-negative integer.
   * @default 0
   */
  inactivityTimeout?: number;

  /**
   * Default retry policy for transient failures.
   */
  retryPolicy?: RetryPolicy;

  /**
   * Default streaming mode.
   * - 'auto': use streaming when the adapter supports it; fall back silently.
   * - true: require streaming; throw CapabilityError if unsupported.
   * - false: buffer all output; emit as single events on completion.
   * @default 'auto'
   */
  stream?: boolean | 'auto';

  /**
   * Override the global config directory path.
   * When set, bypasses all platform-specific home directory resolution.
   * Must be an absolute path.
   */
  configDir?: string;

  /**
   * Override the project config directory path.
   * When set, bypasses the directory walk-up search.
   * Must be an absolute path.
   */
  projectConfigDir?: string;

  /**
   * Enable debug mode. When true, `raw` fields are populated on events
   * (scope Section 8, BaseEvent) and additional `debug` events are emitted
   * (scope Section 8, Debug events). Corresponds to the `--debug` CLI flag
   * (scope Section 21).
   * @default false
   */
  debug?: boolean;
}
```

| Field | Type | Required | Default | Valid Range | Description |
|---|---|---|---|---|---|
| `defaultAgent` | `AgentName` | No | `undefined` | Any registered agent name | Default agent for runs. |
| `defaultModel` | `string` | No | `undefined` | Agent-dependent | Default model for runs. |
| `approvalMode` | `'yolo' \| 'prompt' \| 'deny'` | No | `'prompt'` | Literal union | Default tool approval mode. |
| `timeout` | `number` | No | `0` | `>= 0` (integer, ms) | Default run timeout. |
| `inactivityTimeout` | `number` | No | `0` | `>= 0` (integer, ms) | Default inactivity timeout. |
| `retryPolicy` | `RetryPolicy` | No | `undefined` | See below | Default retry policy. |
| `stream` | `boolean \| 'auto'` | No | `'auto'` | `true`, `false`, `'auto'` | Default streaming mode. |
| `configDir` | `string` | No | Platform-dependent | Absolute path | Global config directory override. |
| `projectConfigDir` | `string` | No | Walk-up search | Absolute path | Project config directory override. |
| `debug` | `boolean` | No | `false` | -- | Enable debug output on events. |

```typescript
interface RetryPolicy {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Base delay between retries in milliseconds.
   * Actual delay uses exponential backoff: baseDelayMs * 2^(attempt-1).
   * @default 1000
   */
  baseDelayMs?: number;

  /**
   * Maximum delay between retries in milliseconds.
   * Caps the exponential backoff.
   * @default 30000
   */
  maxDelayMs?: number;

  /**
   * Jitter factor applied to the delay. 0 means no jitter; 1 means
   * up to 100% random jitter added.
   * @default 0.1
   */
  jitterFactor?: number;

  /**
   * Which error codes are retryable.
   * @default ['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT']
   */
  retryOn?: ErrorCode[];
}
```

| Field | Type | Required | Default | Valid Range | Description |
|---|---|---|---|---|---|
| `maxAttempts` | `number` | No | `3` | `>= 1` (integer) | Maximum retry attempts. |
| `baseDelayMs` | `number` | No | `1000` | `>= 0` (integer) | Base delay for exponential backoff. |
| `maxDelayMs` | `number` | No | `30000` | `>= baseDelayMs` (integer) | Maximum delay cap. |
| `jitterFactor` | `number` | No | `0.1` | `[0.0, 1.0]` | Random jitter factor. |
| `retryOn` | `ErrorCode[]` | No | `['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT']` | Array of `ErrorCode` values | Error codes eligible for retry. |

#### 5.1.2 Throws

- `ValidationError` -- if any option value is invalid (e.g., negative `timeout`, `configDir` is not an absolute path).

#### 5.1.3 Concurrency Safety

Multiple `AgentMuxClient` instances can coexist in the same Node.js process. Each instance maintains its own resolved configuration, adapter registry, and internal state. Shared file system resources (config files, `run-index.jsonl`) are accessed safely:

- **Config reads**: snapshot-based; the file is read once and cached. Call `mux.config.reload()` to refresh.
- **Config writes**: use advisory file locking via `proper-lockfile` (or platform-native locking). If a lock cannot be acquired within 5000ms, a `ConfigLockError` is thrown (code: `CONFIG_LOCK_ERROR`, `recoverable: true`).
- **Run index appends**: append-only, atomic at the OS level (see Section 4.2.3).

#### 5.1.4 Config Resolution Order

When the client resolves a configuration value (e.g., `defaultAgent`), the following precedence applies (highest to lowest):

1. **`RunOptions`** -- per-run override (e.g., `mux.run({ agent: 'codex' })`).
2. **`ClientOptions`** -- passed to `createClient()`.
3. **Project `config.json`** -- `.agent-mux/config.json`.
4. **Global `config.json`** -- `~/.agent-mux/config.json`.
5. **Built-in defaults** -- hardcoded in agent-mux (e.g., `approvalMode: 'prompt'`, `stream: 'auto'`).

Profile resolution follows the same pattern: project profiles override global profiles, and explicit `RunOptions` fields override profile values.

### 5.2 `AgentMuxClient`

```typescript
interface AgentMuxClient {
  /**
   * Start an agent run and return a handle for streaming events,
   * interaction, and control.
   *
   * @param options - Run configuration. `agent` is required unless
   *   a `defaultAgent` was configured.
   * @returns A RunHandle that is simultaneously an AsyncIterable,
   *   EventEmitter, and Promise.
   * @throws ValidationError if options fail validation.
   * @throws CapabilityError if options require unsupported capabilities.
   * @throws AuthError if the agent requires authentication and none is detected.
   * @throws AgentMuxError with code AGENT_NOT_INSTALLED if the agent binary
   *   is not found on PATH.
   */
  run(options: RunOptions): RunHandle;

  /**
   * Adapter registry -- discovery, capabilities, installation info.
   * Provides methods to list, detect, and query agent adapters.
   */
  readonly adapters: AdapterRegistry;

  /**
   * Model registry -- per-agent model lists, metadata, cost estimation.
   */
  readonly models: ModelRegistry;

  /**
   * Session manager -- read, search, and export native session files.
   */
  readonly sessions: SessionManager;

  /**
   * Config manager -- read/write agent-native and agent-mux config files.
   */
  readonly config: ConfigManager;

  /**
   * Auth manager -- detect and surface authentication state.
   */
  readonly auth: AuthManager;

  /**
   * Profile manager -- named RunOptions presets.
   */
  readonly profiles: ProfileManager;

  /**
   * Plugin manager -- install, list, remove plugins per agent.
   */
  readonly plugins: PluginManager;
}
```

### 5.3 Namespace Sub-Clients

Each property on `AgentMuxClient` is a **namespace sub-client** -- a focused interface for a specific domain. Sub-clients share the parent client's resolved configuration and adapter registry.

#### 5.3.1 `mux.adapters` -- AdapterRegistry

```typescript
interface AdapterRegistry {
  /**
   * List all registered adapters (built-in and plugin-registered).
   * Returns static metadata; does not perform I/O.
   */
  list(): AgentAdapterInfo[];

  /**
   * Detect all installed agents. Performs I/O: checks PATH for each
   * agent binary, reads version, probes auth state.
   * Results are cached for 60 seconds.
   */
  installed(): Promise<InstalledAgentInfo[]>;

  /**
   * Detect a single agent's installation status.
   * @param agent - The agent to detect.
   * @returns Installation info, or null if the adapter is not registered.
   * @throws AgentMuxError with code AGENT_NOT_FOUND if no adapter is
   *   registered for the given name.
   */
  detect(agent: AgentName): Promise<InstalledAgentInfo | null>;

  /**
   * Get the capabilities manifest for an agent.
   * Synchronous; capabilities are static metadata on the adapter.
   * @throws AgentMuxError with code AGENT_NOT_FOUND if no adapter is
   *   registered for the given name.
   */
  capabilities(agent: AgentName): AgentCapabilities;

  /**
   * Get install instructions for an agent, optionally filtered by platform.
   * @param agent - The agent to get instructions for.
   * @param platform - Target platform. Defaults to the current platform.
   * @throws AgentMuxError with code AGENT_NOT_FOUND if no adapter is
   *   registered for the given name.
   */
  installInstructions(
    agent: AgentName,
    platform?: NodeJS.Platform
  ): InstallMethod[];

  /**
   * Register a custom adapter at runtime. If an adapter with the same
   * agent name is already registered, it is replaced.
   * @param adapter - The adapter instance to register.
   */
  register(adapter: AgentAdapter): void;

  /**
   * Unregister an adapter. Built-in adapters can be unregistered.
   * @param agent - The agent name to unregister.
   * @throws AgentMuxError with code AGENT_NOT_FOUND if no adapter is
   *   registered for the given name.
   */
  unregister(agent: AgentName): void;
}

interface AgentAdapterInfo {
  /** Agent name. */
  agent: AgentName;

  /** Human-readable display name (e.g., "Claude Code"). */
  displayName: string;

  /** The CLI command used to invoke this agent. */
  cliCommand: string;

  /** Whether this is a built-in adapter or plugin-registered. */
  builtIn: boolean;
}

interface InstalledAgentInfo {
  /** Agent name. */
  agent: AgentName;

  /** Whether the agent binary was found on PATH. */
  installed: boolean;

  /** Absolute path to the agent binary, or null if not found. */
  cliPath: string | null;

  /** Detected version string, or null if not determinable. */
  version: string | null;

  /** Whether the installed version meets the adapter's minimum version. */
  meetsMinVersion: boolean;

  /** The minimum version required by the adapter. */
  minVersion: string;

  /** Detected authentication state. */
  authState: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown';

  /** Currently active model (if detectable from config). */
  activeModel: string | null;
}

interface InstallMethod {
  /** Target platform, or 'all' for platform-independent methods. */
  platform: 'darwin' | 'linux' | 'win32' | 'all';

  /**
   * The installation mechanism.
   * Note: 'pip' is defined by this spec to support hermes-agent; not in original scope.
   */
  type: 'npm' | 'pip' | 'brew' | 'gh-extension' | 'curl' | 'winget' | 'scoop' | 'manual';

  /** The exact command to run (e.g., "npm install -g @anthropic-ai/claude-code"). */
  command: string;

  /** Additional notes (e.g., "Requires gh CLI to be installed first"). */
  notes?: string;

  /** Command to verify prerequisite exists before running install. */
  prerequisiteCheck?: string;
}
```

#### 5.3.2 `mux.profiles` -- ProfileManager

```typescript
interface ProfileManager {
  /**
   * List all available profiles. Returns both global and project profiles,
   * with project profiles taking precedence when names collide.
   * @param scope - Filter by scope. If omitted, returns all.
   */
  list(scope?: 'global' | 'project'): Promise<ProfileInfo[]>;

  /**
   * Get a profile by name. If the profile exists in both global and
   * project scope, returns the deep-merged result.
   * @throws AgentMuxError with code PROFILE_NOT_FOUND if the profile
   *   does not exist in any scope.
   */
  get(name: string): Promise<ProfileData>;

  /**
   * Create or update a profile.
   * @param name - Profile name. Must match /^[a-zA-Z0-9_-]{1,64}$/.
   * @param data - Profile data to save.
   * @param scope - Where to save. Defaults to 'project' if a project
   *   directory exists, otherwise 'global'.
   * @throws ValidationError if the name is invalid or data fails validation.
   */
  set(
    name: string,
    data: ProfileData,
    scope?: 'global' | 'project'
  ): Promise<void>;

  /**
   * Delete a profile.
   * @param name - Profile name.
   * @param scope - Scope to delete from. If omitted, deletes from both.
   * @throws AgentMuxError with code PROFILE_NOT_FOUND if the profile
   *   does not exist in the specified scope.
   */
  delete(name: string, scope?: 'global' | 'project'): Promise<void>;

  /**
   * Resolve a profile name to a full ProfileData object, applying
   * the merge rules (project overrides global).
   * @throws AgentMuxError with code PROFILE_NOT_FOUND if the profile
   *   does not exist.
   */
  resolve(name: string): Promise<ProfileData>;
}

interface ProfileInfo {
  /** Profile name. */
  name: string;

  /** Where this profile is defined. */
  scope: 'global' | 'project';

  /** Absolute path to the profile file. */
  filePath: string;

  /** The profile data. */
  data: ProfileData;
}
```

### 5.4 `mux.run()` -- Starting a Run

```typescript
run(options: RunOptions): RunHandle;
```

#### 5.4.1 Parameters

`options: RunOptions` -- The complete parameter set for the run. See the scope document Section 6 for the full `RunOptions` interface. Key fields:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `agent` | `AgentName` | Conditional | `clientOptions.defaultAgent` | Required unless `defaultAgent` was set on the client or in config. |
| `prompt` | `string \| string[]` | Yes | -- | The prompt to send to the agent. |
| `model` | `string` | No | Agent's default model | Model to use for this run. |
| `profile` | `string` | No | `undefined` | Named profile to apply as base options. |
| `stream` | `boolean \| 'auto'` | No | Client default | Streaming mode for this run. |
| `timeout` | `number` | No | Client default | Run timeout in milliseconds. |
| `runId` | `string` | No | Auto-generated ULID | Custom run identifier. |
| `tags` | `string[]` | No | `[]` | Tags for run indexing. |

#### 5.4.2 Return Type

Returns a `RunHandle` immediately, before any agent output is produced. The `RunHandle` is simultaneously:

- An `AsyncIterable<AgentEvent>` for streaming consumption.
- An EventEmitter with typed `on`/`off`/`once` methods.
- A `PromiseLike<RunResult>` for `await`-based consumption.

> **Forward reference**: `RunHandle` and `RunResult` are fully defined in `03-run-handle-and-interaction.md` (scope Section 7). This spec covers only the client-side contract for creating and returning a `RunHandle` via `mux.run()`.

#### 5.4.3 Throws

- `ValidationError` -- if `options` fields fail validation (empty prompt, out-of-range numbers, etc.).
- `CapabilityError` -- if `options` require capabilities the agent does not have.
- `AuthError` -- if the agent requires authentication and the check fails.
- `AgentMuxError` (code: `AGENT_NOT_INSTALLED`) -- if the agent binary is not found on PATH.
- `AgentMuxError` (code: `AGENT_NOT_FOUND`) -- if no adapter is registered for the agent name.
- `AgentMuxError` (code: `PROFILE_NOT_FOUND`) -- if `options.profile` references a nonexistent profile.

Note: These errors are thrown synchronously from `mux.run()`. Errors that occur after the subprocess starts (crashes, rate limits, auth failures from the agent itself) are emitted as events on the `RunHandle` and/or cause the `RunResult` promise to reject.

#### 5.4.4 Behavioral Description

1. **Profile resolution**: If `options.profile` is set, resolve the profile and deep-merge it under `options` (explicit options take precedence over profile values).
2. **Agent resolution**: Determine the agent from `options.agent`, falling back to `defaultAgent` from client options, then config. If no agent is determined, throw `ValidationError`.
3. **Validation**: Validate all options against the adapter's capabilities and constraints. Throw appropriate errors.
4. **Auth check**: If the adapter indicates pre-spawn auth checking is supported, check auth state. Throw `AuthError` if unauthenticated.
5. **Spawn args**: Call `adapter.buildSpawnArgs(options)` to construct CLI arguments and environment.
6. **Run ID**: Generate a ULID if `options.runId` is not provided.
7. **Append to run index**: Write a `RunIndexEntry` to `run-index.jsonl` with the fields defined in Section 4.2.3 (`v`, `runId`, `agent`, `model`, `sessionId`, `timestamp`, `tags`). The `cost` field is omitted at this point because cost data is not yet available.
8. **Spawn subprocess**: Fork the agent as a child process with the constructed arguments.
9. **Return RunHandle**: Return the handle immediately. The handle begins parsing and emitting events as the subprocess produces output.
10. **On completion**: Cost data, if available, is recorded on the `RunResult` (see `03-run-handle-and-interaction.md`). The run index entry written in step 7 is the only entry for this run; cost roll-ups are computed by joining run index entries with `RunResult` data at query time.

#### 5.4.5 Concurrency Safety

Multiple calls to `mux.run()` can execute concurrently. Each run:
- Gets its own subprocess with independent stdio pipes.
- Gets its own temporary directory for ephemeral harness state (cleaned up on run completion).
- Appends to `run-index.jsonl` atomically (see Section 4.2.3).
- Does not share mutable state with other runs.

The `AgentMuxClient` itself is stateless between runs; it holds only resolved configuration and the adapter registry.

### 5.5 Usage Examples

#### Basic run with async iteration

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient({ defaultAgent: 'claude' });

const run = mux.run({
  agent: 'claude',
  prompt: 'Explain the factory pattern in TypeScript',
});

for await (const event of run) {
  if (event.type === 'text_delta') {
    process.stdout.write(event.delta);
  }
}
```

#### Awaiting the final result

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const result = await mux.run({
  agent: 'codex',
  prompt: 'Refactor the auth module',
  model: 'o4-mini',
  approvalMode: 'yolo',
  timeout: 120_000,
});

console.log(`Completed in ${result.durationMs}ms`);
console.log(`Cost: $${result.cost?.totalUsd.toFixed(4)}`);
console.log(result.text);
```

#### Using profiles

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

// Set up a profile
await mux.profiles.set('fast', {
  agent: 'gemini',
  thinkingEffort: 'low',
  timeout: 30_000,
  approvalMode: 'yolo',
});

// Use the profile in a run
const result = await mux.run({
  profile: 'fast',
  prompt: 'Add error handling to the API routes',
});
```

#### Event-based consumption

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const run = mux.run({
  agent: 'claude',
  prompt: 'Build a REST API for the user model',
  stream: true,
});

run.on('text_delta', (event) => {
  process.stdout.write(event.delta);
});

run.on('tool_call_ready', (event) => {
  console.log(`\nTool call: ${event.toolName}(${JSON.stringify(event.input)})`);
});

run.on('file_write', (event) => {
  console.log(`\nWrote ${event.byteCount} bytes to ${event.path}`);
});

run.on('cost', (event) => {
  console.log(`\nCost so far: $${event.cost.totalUsd.toFixed(4)}`);
});

const result = await run;
console.log(`\nRun ${result.runId} completed.`);
```

#### Checking capabilities before running

```typescript
import { createClient, CapabilityError } from '@a5c-ai/agent-mux';

const mux = createClient();

const caps = mux.adapters.capabilities('hermes');

if (caps.supportsThinking) {
  const result = await mux.run({
    agent: 'hermes',
    prompt: 'Analyze the security implications of this code',
    thinkingEffort: 'high',
  });
} else {
  const result = await mux.run({
    agent: 'hermes',
    prompt: 'Analyze the security implications of this code',
  });
}
```

#### Querying installed agents

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const installed = await mux.adapters.installed();

for (const info of installed) {
  if (info.installed) {
    console.log(
      `${info.agent} v${info.version} at ${info.cliPath} — auth: ${info.authState}`
    );
  } else {
    const methods = mux.adapters.installInstructions(info.agent);
    console.log(`${info.agent} not installed. Install with: ${methods[0]?.command}`);
  }
}
```

#### Concurrent runs across agents

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const [claudeResult, codexResult] = await Promise.all([
  mux.run({
    agent: 'claude',
    prompt: 'Write unit tests for the auth module',
    tags: ['testing'],
  }),
  mux.run({
    agent: 'codex',
    prompt: 'Write integration tests for the API routes',
    tags: ['testing'],
  }),
]);

console.log(`Claude cost: $${claudeResult.cost?.totalUsd.toFixed(4)}`);
console.log(`Codex cost: $${codexResult.cost?.totalUsd.toFixed(4)}`);
```

#### Custom config and project directories

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient({
  configDir: '/opt/agent-mux/config',
  projectConfigDir: '/workspace/my-project/.agent-mux',
  debug: true,
});

const run = mux.run({
  agent: 'opencode',
  prompt: 'Lint and fix all TypeScript files',
});

for await (const event of run) {
  if (event.type === 'debug') {
    console.error(`[${event.level}] ${event.message}`);
  }
}
```

---

## 6. Platform Notes

### 6.1 Path Handling

agent-mux normalizes all file paths using `path.resolve()` and `path.join()` from the Node.js `path` module, which automatically handles platform-specific separators (`/` on POSIX, `\` on Windows). All paths stored in configuration files and `run-index.jsonl` use the OS-native separator.

### 6.2 Windows-Specific Behavior

- **Home directory**: Resolved via `os.homedir()`, typically `C:\Users\<user>`.
- **Shell invocation**: Agent subprocesses are spawned with `shell: true` on Windows to resolve `.cmd` and `.bat` wrappers (common for npm-installed global packages).
- **PTY support**: `node-pty` on Windows uses ConPTY (Windows 10 1809+). Agents that require PTY (e.g., OpenClaw interactive mode) may have degraded behavior on older Windows versions.
- **File permissions**: Windows does not support POSIX file modes. The `auth-hints.json` file relies on default user ACLs rather than `chmod 0600`.
- **File locking**: Config file locking uses `LockFileEx` on Windows, which provides mandatory locking (stronger than POSIX advisory locks).
- **Signal handling**: `SIGINT` is emulated via `GenerateConsoleCtrlEvent`. `SIGKILL` is emulated via `TerminateProcess`. The grace period for child process shutdown is the same (5 seconds).
- **Hermes agent**: Hermes requires WSL2 on Windows. The adapter detects whether WSL2 is available and spawns Hermes through `wsl` when running on native Windows.

### 6.3 macOS-Specific Behavior

- **Home directory**: Resolved via `os.homedir()`, typically `/Users/<user>`.
- **Pipe buffer size**: `PIPE_BUF` is 512 bytes on macOS (vs. 4096 on Linux). Run index entries are guaranteed under 512 bytes to maintain atomic appends.

### 6.4 Linux-Specific Behavior

- **XDG compliance**: Some agents store config under XDG directories (e.g., Gemini CLI at `~/.config/gemini/`, OpenCode at `~/.config/opencode/`). agent-mux reads from the actual paths used by each agent, respecting `XDG_CONFIG_HOME` and `XDG_DATA_HOME` when the agent does.
- **File permissions**: `auth-hints.json` is created with mode `0600`. Config files are created with mode `0644`.

---

## 7. Security Considerations

### 7.1 No Credential Storage

agent-mux does **not** store, manage, or transmit credentials. Authentication is handled entirely by each agent's native mechanisms (API keys in environment variables, OAuth tokens managed by the agent's own CLI, etc.). agent-mux only observes the result of authentication checks through each adapter's `detectAuth()` method.

### 7.2 Auth Hints Caching

The `auth-hints.json` file (Section 4.1.4) caches the **result** of auth detection, not credentials themselves. It stores:
- Whether the agent appears to be authenticated.
- What auth method was detected (e.g., "api-key", "oauth").
- A display-friendly identity string (e.g., email).
- An expiration time for the cache entry.

This cache exists solely to avoid expensive auth detection on every run. It can be safely deleted at any time; the next auth check will repopulate it.

### 7.3 File Permissions

| File | POSIX Mode | Purpose |
|---|---|---|
| `auth-hints.json` | `0600` | Contains identity display strings; owner-only access. |
| `config.json` | `0644` | Non-sensitive configuration; world-readable. |
| `run-index.jsonl` | `0644` | Run metadata; world-readable. |
| Profile files | `0644` | Non-sensitive configuration; world-readable. |

On Windows, all files use the default user ACL. No additional permission hardening is applied.

### 7.4 Environment Variable Passthrough

When spawning agent subprocesses, agent-mux passes through the current `process.env` merged with any `env` overrides from `RunOptions`. Consumers must take care not to pass sensitive values in `RunOptions.env` that should not be visible to the agent subprocess. agent-mux does not filter or sanitize environment variables.

### 7.5 Config File Integrity

agent-mux does not sign or checksum its configuration files. If a config file is tampered with, agent-mux will use the tampered values. Consumers in security-sensitive environments should use file system permissions and integrity monitoring tools to protect the `.agent-mux/` and `~/.agent-mux/` directories.

---

## 8. Cross-References

This spec (`01-core-types-and-client.md`) covers scope Sections 1--5: package identity, core concepts, storage layout, and the `AgentMuxClient` entry point. The following types and interfaces are defined here:

| Type / Interface | Defined In | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | This spec | 1.4 |
| `BaseEvent` | This spec | 2.5 |
| `ProfileData` | This spec | 2.7 |
| `PluginFormat` | This spec | 2.8 |
| `AgentMuxError`, `CapabilityError`, `ValidationError`, `AuthError` | This spec | 3 |
| `ErrorCode` | This spec | 3.1 |
| `GlobalConfig` | This spec | 4.1.2 |
| `AuthHintsFile`, `AuthHintEntry` | This spec | 4.1.4 |
| `RunIndexEntry`, `CostRecord` | This spec | 4.2.3 |
| `ClientOptions`, `RetryPolicy` | This spec | 5.1.1 |
| `AgentMuxClient` | This spec | 5.2 |
| `AdapterRegistry`, `AgentAdapterInfo`, `InstalledAgentInfo`, `InstallMethod` | This spec | 5.3.1 |
| `ProfileManager`, `ProfileInfo` | This spec | 5.3.2 |

The following types are referenced but **not** defined in this spec:

| Type / Interface | Defined In | Scope Section |
|---|---|---|
| `RunOptions` | `02-run-options-and-profiles.md` §2 | 6 |
| `AgentEvent` (full union) | `04-agent-events.md` §4 | 8 |
| `RunHandle` | `03-run-handle-and-interaction.md` §2 | 7 |
| `RunResult` | `03-run-handle-and-interaction.md` §3 | 7 |
| `AgentCapabilities`, `ModelCapabilities` | `06-capabilities-and-models.md` §2, §5 | 11 |
| `AgentAdapter`, `BaseAgentAdapter` | `05-adapter-system.md` §2, §4 | 19 |
| `SessionManager` | `07-session-manager.md` §2 | 16 |
| `ConfigManager` | `08-config-and-auth.md` §2 | 17 |
| `AuthManager` | `08-config-and-auth.md` §8 | 18 |
| `PluginManager` | `09-plugin-manager.md` §2 | 13 |
| `ModelRegistry` | `06-capabilities-and-models.md` §4 | 15 |
| `McpServerConfig` | `02-run-options-and-profiles.md` §4 | 17 |

---

## Implementation Status (2026-04-12)

### 1.4 Supported agents — actual count is 11

The adapters package exports an 11th built-in adapter, `agent-mux-remote`, for nested amux execution over any invocation mode. See `docs/12-built-in-adapters.md`.

### 5.x AgentMuxClient — new behaviour

- **`client.run()` spawns a real subprocess.** Validation runs synchronously, then `startSpawnLoop()` (`packages/core/src/spawn-runner.ts`) drives the pipeline: `buildSpawnArgs()` → `buildInvocationCommand()` → `node:child_process.spawn` → parse loop. The returned `RunHandle` is live from the first call.
- **`client.detectHost(opts?): HostHarnessInfo | null`** — aggregates each adapter's `hostEnvSignals` with `DEFAULT_HOST_SIGNALS` and delegates to `detectHostHarness()`. Returns the enclosing harness (env signal match, with argv fallback) or `null`. See `packages/core/src/host-detection.ts`.

### 5.x RunOptions.invocation

`RunOptions` now carries an optional `invocation: InvocationMode` field (`'local' | 'docker' | 'ssh' | 'k8s'`). See `docs/13-invocation-modes.md`.

### Package layout

The meta package `@a5c-ai/agent-mux` re-exports `core` and `adapters` (`packages/agent-mux/src/index.ts`). The CLI ships as a separate binary in `@a5c-ai/agent-mux-cli`. A fifth workspace, `@a5c-ai/agent-mux-harness-mock`, is test-only and is not part of the runtime meta-package. See `docs/14-harness-mock.md`.

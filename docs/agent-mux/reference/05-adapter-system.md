# Adapter Contract, BaseAgentAdapter, and AdapterRegistry

**Specification v1.0** | `@a5c-ai/agent-mux`

> **Note:** hermes-agent is included as a 10th supported agent per project requirements, extending the original scope's 9 agents. All ten built-in agents (claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes) share the same adapter contract.

---

## 1. Overview

This specification defines the adapter system: the primary extension and abstraction layer that allows agent-mux to drive any CLI-based AI coding agent through a uniform interface. The adapter system consists of three core pieces:

1. **`AgentAdapter`** -- the interface every adapter must implement, defining the full contract for spawning, parsing, session management, configuration, authentication, and plugin operations.
2. **`BaseAgentAdapter`** -- an abstract class that provides shared utilities and hook points, reducing boilerplate for adapter authors.
3. **`AdapterRegistry`** -- the runtime registry that manages adapter instances, provides discovery and detection, and enables plugin-based extensibility.

Every agent interaction in agent-mux flows through an adapter. When `mux.run(options)` is called, the system resolves the adapter from the registry, calls `buildSpawnArgs()` to construct the subprocess invocation, spawns the process, feeds each output line through `parseEvent()` to produce normalized `AgentEvent` values, and invokes lifecycle hooks on completion or failure.

### 1.1 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `RunHandle` | `03-run-handle-and-interaction.md` | 2 |
| `AgentEvent`, `BaseEvent` | `04-agent-events.md` | 2 |
| `CostRecord` | `01-core-types-and-client.md` | 4.2.3 |
| `ErrorCode`, `AgentMuxError`, `CapabilityError` | `01-core-types-and-client.md` | 3.1, 3.2 |
| `RetryPolicy` | `01-core-types-and-client.md` | 5.1.1 |
| `ModelCapabilities` | `06-capabilities-and-models.md` | 5 |
| `Session`, `SessionSummary` | `07-session-manager.md` | 2 |
| `AgentConfig`, `AgentConfigSchema`, `ConfigField` | `08-config-and-auth.md` | 3, 4, 5 |
| `AuthState`, `AuthSetupGuidance`, `AuthMethod` | `08-config-and-auth.md` | 9, 11, 10 |
| `InstalledPlugin`, `PluginInstallOptions`, `PluginSearchOptions`, `PluginListing` | `09-plugin-manager.md` | 2 |

### 1.2 Design Principles

1. **One adapter per agent.** The registry holds exactly one adapter per `AgentName`. Registration with a name that already exists replaces the previous adapter (with safeguards; see Section 8.1).
2. **Adapters are stateless.** An adapter instance does not hold per-run state. All run-specific state lives in the `RunHandle` and the stream engine. A single adapter instance serves all concurrent runs for that agent.
3. **Fail loudly, recover gracefully.** Adapter methods that encounter errors throw typed exceptions. The run engine catches these and emits appropriate error events rather than silently dropping output.
4. **Plugin adapters are first-class.** Third-party adapters registered via `mux.adapters.register()` have identical capabilities and lifecycle to built-in adapters. There is no privileged internal API.

---

## 2. AgentAdapter Interface

The `AgentAdapter` interface is the complete contract that every adapter -- built-in or plugin -- must implement. It covers eight responsibilities: identity, capabilities, spawning, output parsing, authentication, session management, configuration, and (optionally) plugin operations.

```typescript
/**
 * The full contract for an agent adapter. Implementations encapsulate
 * everything agent-mux needs to know about a specific CLI-based agent.
 *
 * Built-in adapters extend BaseAgentAdapter rather than implementing
 * this interface directly. Plugin adapters may implement it directly
 * or extend BaseAgentAdapter.
 */
interface AgentAdapter {
  // ── Identity ──────────────────────────────────────────────────────

  /**
   * Unique agent identifier. Must match the AgentName used in RunOptions.
   * For built-in agents, one of the BuiltInAgentName literals.
   * For plugin adapters, any string that does not collide with built-in names.
   *
   * @see AgentName in 01-core-types-and-client.md, Section 1.4.
   */
  readonly agent: AgentName;

  /**
   * Human-readable display name shown in CLI output, logs, and error messages.
   * Example: 'Claude Code', 'Gemini CLI', 'NousResearch Hermes'.
   */
  readonly displayName: string;

  /**
   * The CLI command used to invoke this agent. This is the binary name
   * passed to child_process.spawn(). Examples: 'claude', 'codex', 'gemini',
   * 'hermes', 'copilot'. Note: CopilotAdapter uses 'copilot' here; the actual
   * binary invocation is 'gh copilot' (installed as a gh CLI extension).
   */
  readonly cliCommand: string;

  /**
   * Minimum CLI version required for this adapter to function correctly.
   * Compared using semver. If the detected version is below this, the
   * InstalledAgentInfo.meetsMinVersion field is set to false.
   * Omit if no minimum version requirement exists.
   */
  readonly minVersion?: string;

  // ── Capabilities ──────────────────────────────────────────────────

  /**
   * Structured manifest of what this agent can do. Used by agent-mux
   * to validate RunOptions before spawning, gate optional features,
   * and populate the capabilities() query on AdapterRegistry.
   *
   * @see AgentCapabilities in 06-capabilities-and-models.md, Section 2.
   */
  readonly capabilities: AgentCapabilities;

  /**
   * Complete list of models supported by this agent, with per-model
   * capabilities, pricing, and context window information.
   *
   * @see ModelCapabilities in 06-capabilities-and-models.md, Section 2.
   */
  readonly models: ModelCapabilities[];

  /**
   * The default model ID used when RunOptions.model is not specified.
   * Must be an ID present in the models array. Omit if the agent does
   * not have a stable default (consumer must always specify a model).
   */
  readonly defaultModelId?: string;

  /**
   * Schema describing the agent's native configuration file format.
   * Used by ConfigManager for validation and by the CLI for config commands.
   *
   * @see AgentConfigSchema in 08-config-and-auth.md, Section 4.
   */
  readonly configSchema: AgentConfigSchema;

  // ── Spawning ──────────────────────────────────────────────────────

  /**
   * Translates RunOptions into the concrete arguments, environment, and
   * working directory needed to spawn the agent subprocess.
   *
   * Called once per run, before child_process.spawn(). The returned
   * SpawnArgs are used directly by the stream engine.
   *
   * @param options - The full RunOptions for this run.
   * @returns SpawnArgs describing how to spawn the subprocess.
   * @throws CapabilityError if options require capabilities the agent lacks.
   * @throws ValidationError if options contain invalid values for this agent.
   *
   * @see RunOptions in 02-run-options-and-profiles.md, Section 2.
   */
  buildSpawnArgs(options: RunOptions): SpawnArgs;

  // ── Output parsing ────────────────────────────────────────────────

  /**
   * Parses a single line of stdout/stderr from the agent subprocess
   * into zero, one, or many AgentEvent values.
   *
   * Called by the stream engine for every line of output. Returning null
   * means the line is not recognized and should be silently dropped
   * (unless debug mode is active, in which case a 'log' event is emitted).
   *
   * Returning an array allows a single line to produce multiple events
   * (e.g., a JSON line containing both a text delta and a cost update).
   *
   * Must not throw. If parsing fails, return null and let the stream
   * engine emit a 'log' event in debug mode.
   *
   * @param line - A single line of output from the agent process.
   * @param context - Contextual information about the current parse state.
   * @returns Parsed event(s), or null if the line is not recognized.
   *
   * @see AgentEvent in 04-agent-events.md, Section 2.
   */
  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null;

  // ── Authentication ────────────────────────────────────────────────

  /**
   * Detects the current authentication state for this agent by inspecting
   * auth files, environment variables, credential stores, or running
   * a lightweight CLI probe.
   *
   * Must not prompt the user or modify any state. Read-only detection only.
   *
   * @returns Current auth state including status, method, identity, and expiry.
   *
   * @see AuthState in 08-config-and-auth.md, Section 9.
   */
  detectAuth(): Promise<AuthState>;

  /**
   * Returns human-readable guidance for setting up authentication.
   * Includes step-by-step instructions, required environment variables,
   * links to documentation, and platform-specific notes.
   *
   * @returns Structured auth setup guidance.
   *
   * @see AuthSetupGuidance in 08-config-and-auth.md, Section 11.
   */
  getAuthGuidance(): AuthSetupGuidance;

  // ── Session management ────────────────────────────────────────────

  /**
   * Returns the filesystem path to the directory where this agent
   * stores session files.
   *
   * @param cwd - Working directory context. Some agents store sessions
   *   relative to the project root. Defaults to process.cwd().
   * @returns Absolute path to the session directory.
   */
  sessionDir(cwd?: string): string;

  /**
   * Parses a native session file into the normalized Session type.
   *
   * @param filePath - Absolute path to the session file.
   * @returns Parsed session data.
   * @throws if the file does not exist or cannot be parsed.
   *
   * @see Session in 07-session-manager.md, Section 2.
   */
  parseSessionFile(filePath: string): Promise<Session>;

  /**
   * Lists all session file paths for this agent.
   *
   * @param cwd - Working directory context. Defaults to process.cwd().
   * @returns Array of absolute file paths to session files.
   */
  listSessionFiles(cwd?: string): Promise<string[]>;

  // ── Configuration ─────────────────────────────────────────────────

  /**
   * Reads the agent's native configuration file(s) and returns them
   * as a normalized AgentConfig object.
   *
   * @param cwd - Working directory for project-level config resolution.
   *   Defaults to process.cwd().
   * @returns Merged config (global + project-level, project wins).
   *
   * @see AgentConfig in 08-config-and-auth.md, Section 3.
   */
  readConfig(cwd?: string): Promise<AgentConfig>;

  /**
   * Writes partial configuration updates to the agent's native config file.
   * Performs a merge with existing config; does not overwrite unmentioned fields.
   *
   * @param config - Partial config to merge.
   * @param cwd - Working directory for project-level config resolution.
   *   Defaults to process.cwd().
   *
   * @see AgentConfig in 08-config-and-auth.md, Section 3.
   */
  writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>;

  // ── Plugin operations (optional) ──────────────────────────────────
  // These methods are only required when capabilities.supportsPlugins is true.
  // The PluginManager delegates to these methods for agent-specific plugin
  // operations. Adapters where supportsPlugins is false may omit them entirely.

  /**
   * Lists all plugins currently installed for this agent.
   *
   * @returns Array of installed plugin descriptors.
   * @see InstalledPlugin in 09-plugin-manager.md, Section 2.
   */
  listPlugins?(): Promise<InstalledPlugin[]>;

  /**
   * Installs a plugin for this agent.
   *
   * @param pluginId - Plugin identifier (npm package name, registry ID, etc.).
   * @param options - Installation options (version, registry, etc.).
   * @returns Descriptor of the newly installed plugin.
   * @see InstalledPlugin in 09-plugin-manager.md, Section 2.
   */
  installPlugin?(pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin>;

  /**
   * Uninstalls a plugin from this agent.
   *
   * @param pluginId - Plugin identifier to remove.
   */
  uninstallPlugin?(pluginId: string): Promise<void>;

  /**
   * Searches available plugins for this agent.
   *
   * @param query - Search query string.
   * @param options - Search options (registry filter, page, limit, etc.).
   * @returns Array of matching plugin listings.
   * @see PluginListing in 09-plugin-manager.md, Section 2.
   */
  searchPlugins?(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>;
}
```

---

## 3. Supporting Types

### 3.1 SpawnArgs

The `SpawnArgs` type is returned by `buildSpawnArgs()` and consumed by the stream engine to spawn the agent subprocess.

```typescript
/**
 * Describes exactly how to spawn an agent subprocess.
 * Returned by AgentAdapter.buildSpawnArgs() and passed directly
 * to the stream engine's process spawner.
 */
interface SpawnArgs {
  /**
   * The command to execute. Typically the adapter's cliCommand value,
   * but may differ (e.g., 'gh' for copilot where cliCommand is 'copilot').
   */
  command: string;

  /**
   * Array of CLI arguments. Built by the adapter from RunOptions.
   * Example: ['--model', 'claude-sonnet-4-20250514', '--output-format', 'stream-json', '-p', 'Hello']
   */
  args: string[];

  /**
   * Environment variables to set on the subprocess. Merged with the
   * current process.env (these values take precedence on conflict).
   */
  env: Record<string, string>;

  /**
   * Working directory for the subprocess. Defaults to RunOptions.cwd
   * or process.cwd() if neither is specified.
   */
  cwd: string;

  /**
   * Whether the subprocess requires a pseudo-terminal (PTY).
   * Some agents (e.g., Cursor) require PTY for proper output.
   * When true, the stream engine uses node-pty instead of child_process.
   */
  usePty: boolean;

  /**
   * Standard input to pipe into the subprocess after spawn.
   * Used when the agent reads the prompt from stdin rather than
   * from CLI arguments (e.g., long prompts that exceed argv limits).
   * Undefined means no stdin is written; the stream is left open
   * for interactive input via RunHandle.send().
   */
  stdin?: string;

  /**
   * Timeout in milliseconds for the entire subprocess execution.
   * Propagated from RunOptions.timeout. The stream engine enforces this.
   */
  timeout?: number;

  /**
   * Inactivity timeout in milliseconds. If no stdout/stderr output
   * is received for this duration, the stream engine fires the
   * adapter's onTimeout() hook.
   */
  inactivityTimeout?: number;

  /**
   * Shell mode. When true, the command is executed via the system shell
   * (child_process.spawn with shell: true). Required for agents whose
   * CLI command involves shell features (pipes, aliases, etc.).
   * Default: false.
   */
  shell?: boolean;
}
```

### 3.2 ParseContext

The `ParseContext` type provides contextual information to `parseEvent()` to support stateful parsing without requiring the adapter itself to hold mutable state.

```typescript
/**
 * Contextual state passed to AgentAdapter.parseEvent() on every line.
 * Maintained by the stream engine and updated as events are emitted.
 * Enables stateful parsing (e.g., tracking whether we're inside a
 * tool call block) without the adapter holding mutable state.
 */
interface ParseContext {
  /**
   * The run ID for the current run. Matches RunHandle.runId.
   */
  runId: string;

  /**
   * The agent name. Matches RunOptions.agent.
   */
  agent: AgentName;

  /**
   * The session ID, if one has been established. Set after
   * a 'session_start' or 'session_resume' event is emitted.
   */
  sessionId: string | undefined;

  /**
   * Zero-based index of the current turn. Incremented each time
   * a 'turn_start' event is emitted.
   */
  turnIndex: number;

  /**
   * Whether debug mode is active. When true, the adapter may include
   * additional diagnostic information in events.
   */
  debug: boolean;

  /**
   * The output format requested in RunOptions.outputFormat.
   * Adapters may use this to switch between JSON and text parsing modes.
   */
  outputFormat: 'text' | 'json' | 'jsonl';

  /**
   * Whether the line came from stdout or stderr.
   */
  source: 'stdout' | 'stderr';

  /**
   * The StreamAssembler instance for this run. Adapters use this to
   * accumulate multi-line output (e.g., partial JSON objects split
   * across lines, multi-line code blocks).
   *
   * @see StreamAssembler in Section 6.
   */
  assembler: StreamAssembler;

  /**
   * Total number of events emitted so far in this run.
   * Useful for ordering and deduplication.
   */
  eventCount: number;

  /**
   * The last event type emitted, or null if no events have been emitted yet.
   * Useful for context-dependent parsing (e.g., detecting the end of a
   * multi-part tool result).
   */
  lastEventType: string | null;

  /**
   * Adapter-managed state bag. The adapter may store arbitrary parse state
   * here between calls. The stream engine preserves this object across
   * calls but never reads or modifies it.
   */
  adapterState: Record<string, unknown>;
}
```

### 3.3 InstalledAgentInfo

Returned by `AdapterRegistry.installed()` and `AdapterRegistry.detect()`. Represents the detection result for a single agent.

```typescript
/**
 * Result of detecting whether a specific agent is installed and functional.
 * Returned by AdapterRegistry.detect() for a single agent and by
 * AdapterRegistry.installed() as an array for all registered agents.
 */
interface InstalledAgentInfo {
  /**
   * The agent identifier.
   */
  agent: AgentName;

  /**
   * Whether the agent CLI binary was found on PATH or at a known location.
   */
  installed: boolean;

  /**
   * Absolute path to the CLI binary, or null if not found.
   * Resolved via which/where or platform-specific lookup.
   */
  cliPath: string | null;

  /**
   * Detected version string (e.g., '1.0.28'), or null if the binary
   * was not found or version detection failed.
   */
  version: string | null;

  /**
   * Whether the detected version meets the adapter's minVersion requirement.
   * Always true if minVersion is not set on the adapter.
   * Always false if version is null.
   */
  meetsMinVersion: boolean;

  /**
   * The minimum version required by the adapter. Copied from
   * AgentAdapter.minVersion. Empty string if no minimum is specified.
   */
  minVersion: string;

  /**
   * Current authentication state for this agent.
   * Determined by calling adapter.detectAuth().
   */
  authState: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown';

  /**
   * The currently active/default model, or null if it could not be determined.
   * Read from the agent's config file or CLI output.
   */
  activeModel: string | null;
}
```

### 3.4 AgentAdapterInfo

Returned by `AdapterRegistry.list()`. A lightweight descriptor of a registered adapter that does not require async detection.

```typescript
/**
 * Lightweight descriptor of a registered adapter. Returned by
 * AdapterRegistry.list() without performing any async detection.
 * Contains only the static metadata available from the adapter instance.
 */
interface AgentAdapterInfo {
  /**
   * The agent identifier.
   */
  agent: AgentName;

  /**
   * Human-readable display name.
   */
  displayName: string;

  /**
   * The CLI command used to invoke this agent.
   */
  cliCommand: string;

  /**
   * Minimum CLI version required, if any.
   */
  minVersion: string | undefined;

  /**
   * Whether this adapter was registered as a built-in (from
   * @a5c-ai/agent-mux-adapters) or as a plugin adapter via register().
   */
  source: 'built-in' | 'plugin';
}
```

---

## 4. BaseAgentAdapter Abstract Class

All ten built-in adapters extend `BaseAgentAdapter`. Plugin adapters may extend it for convenience or implement `AgentAdapter` directly.

`BaseAgentAdapter` provides:
- Protected utility methods that handle common parsing, detection, and option-building tasks.
- Hook points with sensible defaults that adapters can override for agent-specific behavior.
- A `StreamAssembler` instance for multi-line output assembly.

```typescript
/**
 * Abstract base class for agent adapters. Provides shared utilities
 * and hook points with sensible defaults.
 *
 * All built-in adapters extend this class. Plugin adapters may extend
 * it or implement AgentAdapter directly.
 *
 * Subclasses must implement all abstract members (the readonly fields
 * and methods from AgentAdapter that have no default implementation).
 */
abstract class BaseAgentAdapter implements AgentAdapter {
  // ── Abstract members (must be implemented by subclasses) ──────────

  abstract readonly agent: AgentName;
  abstract readonly displayName: string;
  abstract readonly cliCommand: string;
  abstract readonly minVersion?: string;
  abstract readonly capabilities: AgentCapabilities;
  abstract readonly models: ModelCapabilities[];
  abstract readonly defaultModelId?: string;
  abstract readonly configSchema: AgentConfigSchema;

  abstract buildSpawnArgs(options: RunOptions): SpawnArgs;
  abstract parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null;
  abstract detectAuth(): Promise<AuthState>;
  abstract getAuthGuidance(): AuthSetupGuidance;
  abstract sessionDir(cwd?: string): string;
  abstract parseSessionFile(filePath: string): Promise<Session>;
  abstract listSessionFiles(cwd?: string): Promise<string[]>;
  abstract readConfig(cwd?: string): Promise<AgentConfig>;
  abstract writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>;

  // ── Protected utilities ───────────────────────────────────────────

  /**
   * Attempts to parse a line as JSON. Returns the parsed value on success,
   * or null if the line is not valid JSON. Does not throw.
   *
   * Used by adapters whose agents emit JSON-per-line output (most of them).
   *
   * @param line - A single line of stdout output.
   * @returns Parsed JSON value, or null.
   */
  protected parseJsonLine(line: string): unknown | null;

  /**
   * Normalizes a raw cost/usage object from agent output into the
   * standard CostRecord type. Handles the various formats agents use
   * to report token counts and costs (nested objects, flat fields,
   * camelCase vs snake_case, etc.).
   *
   * Returns null if the raw value does not contain recognizable cost data.
   *
   * @param raw - Raw cost/usage data from agent output.
   * @returns Normalized CostRecord, or null.
   *
   * @see CostRecord in 01-core-types-and-client.md, Section 4.2.3.
   */
  protected assembleCostRecord(raw: unknown): CostRecord | null;

  /**
   * Detects the installed CLI version by running the agent's CLI
   * with a version flag (typically --version or -v) and parsing
   * the output. Returns null if the binary is not found or version
   * detection fails.
   *
   * Uses a 5-second timeout to avoid hanging on unresponsive binaries.
   *
   * @returns Semver version string (e.g., '1.0.28'), or null.
   */
  protected detectVersionFromCli(): Promise<string | null>;

  /**
   * Builds the environment variable record for the subprocess from
   * RunOptions. Handles:
   * - Merging RunOptions.env with process.env
   * - Setting agent-specific env vars for approval mode
   * - Setting env vars for output format (e.g., CLAUDE_CODE_OUTPUT_FORMAT)
   * - Disabling interactive prompts where applicable
   *
   * @param options - The RunOptions for this run.
   * @returns Environment variable record for child_process.spawn().
   */
  protected buildEnvFromOptions(options: RunOptions): Record<string, string>;

  /**
   * Resolves the session ID to use for this run. Logic:
   * 1. If options.sessionId is set, return it.
   * 2. If options.forkSessionId is set, return it (the adapter's
   *    buildSpawnArgs uses it to construct fork arguments).
   * 3. If options.noSession is true, return undefined.
   * 4. Otherwise, return undefined (let the agent create a new session).
   *
   * @param options - The RunOptions for this run.
   * @returns Session ID string, or undefined.
   */
  protected resolveSessionId(options: RunOptions): string | undefined;

  // ── Hook points (overridable, with defaults) ──────────────────────

  /**
   * Called when the agent subprocess fails to spawn (e.g., binary not found,
   * permission denied, PTY allocation failure).
   *
   * Default implementation returns a 'crash' event with the error message
   * and an exit code of -1.
   *
   * Adapters may override to provide agent-specific error messages or
   * to attempt recovery (e.g., suggesting installation).
   *
   * @param error - The spawn error.
   * @returns An AgentEvent to emit. Typically a 'crash' or 'error' event.
   */
  onSpawnError(error: Error): AgentEvent;

  /**
   * Called when the inactivity timeout fires (no output received for
   * the configured duration).
   *
   * Default implementation returns an 'error' event with code 'TIMEOUT'
   * and recoverable: false.
   *
   * @returns An AgentEvent to emit.
   */
  onTimeout(): AgentEvent;

  /**
   * Called when the agent subprocess exits. Receives the exit code and
   * signal (if killed by a signal). Returns zero or more events to emit.
   *
   * Default implementation:
   * - Exit code 0: returns an empty array (normal exit; session_end is
   *   expected to have been emitted by parseEvent already).
   * - Exit code non-zero with no prior crash event: returns a 'crash'
   *   event with the exit code and any accumulated stderr.
   * - Killed by signal: returns an 'error' event with code 'AGENT_CRASH'.
   *
   * @param exitCode - Process exit code.
   * @param signal - Signal name if killed by signal, or null.
   * @returns Array of AgentEvents to emit (may be empty).
   */
  onProcessExit(exitCode: number, signal: string | null): AgentEvent[];

  /**
   * Determines whether a failed run should be retried based on the
   * error event, current attempt count, and the configured retry policy.
   *
   * Default implementation checks:
   * 1. attempt < policy.maxRetries
   * 2. The event's error code is in policy.retryOn
   * 3. The event is marked as recoverable
   *
   * Adapters may override to add agent-specific retry logic (e.g.,
   * retrying on specific exit codes that indicate transient failures).
   *
   * @param event - The error event that triggered the retry check.
   * @param attempt - Zero-based attempt index (0 = first attempt).
   * @param policy - The retry policy from RunOptions or client defaults.
   * @returns true if the run should be retried, false otherwise.
   *
   * @see RetryPolicy in 01-core-types-and-client.md, Section 5.1.1.
   */
  shouldRetry(event: AgentEvent, attempt: number, policy: RetryPolicy): boolean;

  // ── Stream assembler ──────────────────────────────────────────────

  /**
   * StreamAssembler instance for this adapter. Provides utilities for
   * accumulating multi-line output, buffering partial JSON, and
   * reassembling fragmented streaming data.
   *
   * @see StreamAssembler in Section 6.
   */
  protected readonly streamAssembler: StreamAssembler;
}
```

---

## 5. AdapterRegistry Interface

The `AdapterRegistry` is accessed via `mux.adapters` on the `AgentMuxClient`. It manages the set of available adapters, provides synchronous metadata queries, async detection of installed agents, and the registration API for plugin adapters.

```typescript
/**
 * Registry of agent adapters. Manages discovery, detection, capability
 * queries, and plugin adapter registration.
 *
 * Accessed via mux.adapters on AgentMuxClient.
 *
 * @see AgentMuxClient in 01-core-types-and-client.md, Section 5.
 */
interface AdapterRegistry {
  // ── Query methods ─────────────────────────────────────────────────

  /**
   * Returns metadata for all registered adapters. Synchronous -- does not
   * probe the filesystem or run any detection. Returns both built-in and
   * plugin-registered adapters.
   *
   * @returns Array of AgentAdapterInfo descriptors, sorted by agent name.
   */
  list(): AgentAdapterInfo[];

  /**
   * Detects all registered agents and returns installation status for each.
   * Runs detection in parallel for all registered adapters. Results are
   * cached for 30 seconds to avoid repeated filesystem probes.
   *
   * @returns Array of InstalledAgentInfo for every registered adapter.
   */
  installed(): Promise<InstalledAgentInfo[]>;

  /**
   * Detects whether a specific agent is installed and returns its status.
   * Returns null if no adapter is registered for the given agent name.
   *
   * @param agent - The agent to detect.
   * @returns InstalledAgentInfo, or null if no adapter is registered.
   */
  detect(agent: AgentName): Promise<InstalledAgentInfo | null>;

  /**
   * Returns the capabilities manifest for a specific agent. Synchronous --
   * reads from the adapter's static capabilities declaration.
   *
   * @param agent - The agent to query.
   * @returns AgentCapabilities for the agent.
   * @throws AgentMuxError with code 'UNKNOWN_AGENT' if no adapter is registered.
   *
   * @see AgentCapabilities in 06-capabilities-and-models.md, Section 2.
   */
  capabilities(agent: AgentName): AgentCapabilities;

  /**
   * Returns platform-specific installation instructions for an agent.
   * Used by `amux install <agent>` and by consumers to guide users
   * through agent installation.
   *
   * @param agent - The agent to get instructions for.
   * @param platform - Target platform. Defaults to process.platform.
   * @returns Array of InstallMethod objects, filtered by platform.
   * @throws AgentMuxError with code 'UNKNOWN_AGENT' if no adapter is registered.
   *
   * @see InstallMethod in 06-capabilities-and-models.md, Section 3.
   */
  installInstructions(agent: AgentName, platform?: NodeJS.Platform): InstallMethod[];

  // ── Registration methods ──────────────────────────────────────────

  /**
   * Registers a new adapter or replaces an existing one. This is the
   * primary extension point for third-party agent support.
   *
   * If an adapter with the same agent name already exists:
   * - If the existing adapter's source is 'plugin', it is replaced silently.
   * - If the existing adapter's source is 'built-in', a warning is emitted
   *   via the 'debug' event on subsequent runs, but the replacement proceeds.
   *   This allows plugin adapters to override built-in behavior.
   *
   * The adapter is validated on registration:
   * - agent name must be a non-empty string
   * - displayName must be a non-empty string
   * - cliCommand must be a non-empty string
   * - capabilities must be a valid AgentCapabilities object
   * - models must be an array (may be empty)
   * - configSchema must be a valid AgentConfigSchema object
   * - All required methods must be present and callable
   *
   * @param adapter - The adapter instance to register.
   * @throws ValidationError if the adapter fails validation.
   */
  register(adapter: AgentAdapter): void;

  /**
   * Removes an adapter from the registry.
   *
   * If the agent has active runs (RunHandles that have not completed),
   * the adapter remains functional for those runs -- unregistration
   * only prevents new runs from being started with this agent.
   * Subsequent calls to mux.run() with this agent name will throw
   * AgentMuxError with code 'UNKNOWN_AGENT'.
   *
   * @param agent - The agent name to unregister.
   * @throws AgentMuxError with code 'UNKNOWN_AGENT' if no adapter is
   *   registered for the given name.
   */
  unregister(agent: AgentName): void;
}
```

---

## 6. StreamAssembler Utility

The `StreamAssembler` is a stateful utility for reassembling fragmented output. Agent processes do not always emit clean, single-line JSON. Output may be split across multiple lines (partial JSON), interleaved (stdout and stderr), or buffered in platform-dependent ways. The `StreamAssembler` handles these cases.

```typescript
/**
 * Stateful utility for reassembling fragmented agent output into
 * complete, parseable units. One instance per run, accessible via
 * ParseContext.assembler and BaseAgentAdapter.streamAssembler.
 *
 * The assembler operates in two modes:
 * - Line mode (default): each line is treated as an independent unit.
 * - Block mode: lines are accumulated until a termination condition
 *   is met (e.g., matching braces for JSON, a sentinel line).
 */
class StreamAssembler {
  /**
   * Feeds a line into the assembler. In line mode, returns the line
   * unchanged. In block mode, accumulates the line and returns null
   * until the block is complete, then returns the assembled block.
   *
   * @param line - A single line of output.
   * @returns Complete output unit, or null if accumulating.
   */
  feed(line: string): string | null;

  /**
   * Begins block accumulation mode. Subsequent calls to feed()
   * will accumulate lines until endBlock() is called or the
   * termination predicate returns true.
   *
   * @param terminator - Predicate that receives each accumulated line.
   *   When it returns true, the block is complete and feed() returns
   *   the joined result.
   */
  startBlock(terminator: (line: string, accumulated: string) => boolean): void;

  /**
   * Forces the current block to end and returns whatever has been
   * accumulated so far. Used when the process exits mid-block
   * or when a timeout fires.
   *
   * @returns Accumulated content, or null if not in block mode.
   */
  endBlock(): string | null;

  /**
   * Whether the assembler is currently in block accumulation mode.
   */
  readonly inBlock: boolean;

  /**
   * Resets the assembler to its initial state. Called between runs
   * if the adapter is reused (which it always is, since adapters
   * are singletons in the registry).
   */
  reset(): void;

  /**
   * Returns the number of lines currently accumulated in the buffer.
   * Zero when not in block mode.
   */
  readonly bufferedLineCount: number;

  /**
   * Returns the raw accumulated content without ending the block.
   * Useful for diagnostic logging.
   */
  peek(): string;
}
```

---

## 7. Adapter Lifecycle

This section describes the complete lifecycle of an adapter from registration through run execution to cleanup.

### 7.1 Registration

Adapters are registered in two ways:

1. **Built-in adapters.** When `@a5c-ai/agent-mux-adapters` is imported (or `@a5c-ai/agent-mux` is imported, which re-exports it), all ten built-in adapter instances are created and registered with the `AdapterRegistry`. This happens synchronously during module initialization. Built-in adapters are marked with `source: 'built-in'`.

2. **Plugin adapters.** Third-party adapters are registered by calling `mux.adapters.register(adapter)` at any time after the client is created. Plugin adapters are marked with `source: 'plugin'`. See Section 8 for details.

Registration is synchronous and validates the adapter's shape (all required fields and methods present, correct types). No filesystem or network access occurs during registration.

### 7.2 Detection

Detection determines whether an agent's CLI binary is installed, what version it is, and its auth state. Detection is triggered by:

- `mux.adapters.detect(agent)` -- single agent.
- `mux.adapters.installed()` -- all registered agents in parallel.
- Implicitly before `mux.run()` if the agent has not been detected yet in this client lifetime.

Detection sequence for a single agent:

1. Look up the adapter by `AgentName` in the registry.
2. Call `detectVersionFromCli()` (inherited from `BaseAgentAdapter`) to locate the binary and read its version.
3. Compare the detected version against `adapter.minVersion` using semver.
4. Call `adapter.detectAuth()` to determine authentication state.
5. Read the agent's config to determine the active model.
6. Construct and return an `InstalledAgentInfo` object.

Detection results are cached for 30 seconds. Calling `detect()` within the cache window returns the cached result without re-probing.

### 7.3 Spawn

When `mux.run(options)` is called:

1. **Resolve adapter.** Look up the adapter for `options.agent` in the registry. Throw `AgentMuxError` with code `'UNKNOWN_AGENT'` if not found.
2. **Validate capabilities.** Check that `options` do not request capabilities the agent lacks (e.g., `thinkingEffort` on an agent where `supportsThinking` is false). Throw `CapabilityError` on mismatch.
3. **Build spawn args.** Call `adapter.buildSpawnArgs(options)` to get the `SpawnArgs`.
4. **Create ParseContext.** Initialize a fresh `ParseContext` with `runId`, `agent`, `turnIndex: 0`, and a fresh `adapterState: {}`.
5. **Spawn subprocess.** Use `SpawnArgs` to spawn via `child_process.spawn()` (or `node-pty` if `usePty` is true).
6. **Return RunHandle.** The `RunHandle` is returned immediately. The subprocess runs asynchronously.

### 7.4 Parse

For each line of stdout/stderr from the subprocess:

1. Set `context.source` to `'stdout'` or `'stderr'`.
2. Call `adapter.parseEvent(line, context)`.
3. If the return is `null`:
   - If debug mode is active, emit a `{ type: 'log', source, line }` event.
   - Otherwise, silently discard the line.
4. If the return is a single `AgentEvent`, emit it on the `RunHandle`.
5. If the return is an array of `AgentEvent`, emit each in order.
6. After emitting, update `context.eventCount`, `context.lastEventType`, and (if a `session_start` event) `context.sessionId`.

### 7.5 Cleanup

When the subprocess exits (normally or abnormally):

1. Call `adapter.onProcessExit(exitCode, signal)`.
2. Emit any events returned by the hook.
3. Call `streamAssembler.endBlock()` to flush any buffered content. If content is returned, pass it through `parseEvent()` one final time.
4. Call `streamAssembler.reset()` to prepare for the next run.
5. Resolve the `RunHandle`'s promise with the `RunResult`.
6. Write the run record to `.agent-mux/run-index.jsonl`.

---

## 8. Plugin Adapter Extensibility

Third-party developers can add support for agents not included in the ten built-in adapters by implementing the `AgentAdapter` interface and registering it with the `AdapterRegistry`.

### 8.1 Registration API

```typescript
import { createClient, BaseAgentAdapter } from '@a5c-ai/agent-mux';
import type { AgentAdapter, RunOptions, SpawnArgs, ParseContext, AgentEvent } from '@a5c-ai/agent-mux';

// Option A: Extend BaseAgentAdapter for utilities and hooks
class MyAgentAdapter extends BaseAgentAdapter {
  readonly agent = 'my-agent' as AgentName;
  readonly displayName = 'My Agent';
  readonly cliCommand = 'myagent';
  readonly minVersion = '0.1.0';
  readonly capabilities = { /* ... */ } as AgentCapabilities;
  readonly models = [ /* ... */ ];
  readonly defaultModelId = 'my-model-v1';
  readonly configSchema = { /* ... */ } as AgentConfigSchema;

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    return {
      command: this.cliCommand,
      args: ['--prompt', Array.isArray(options.prompt) ? options.prompt.join('\n') : options.prompt],
      env: this.buildEnvFromOptions(options),
      cwd: options.cwd ?? process.cwd(),
      usePty: false,
    };
  }

  parseEvent(line: string, context: ParseContext): AgentEvent | null {
    const json = this.parseJsonLine(line);
    if (!json || typeof json !== 'object') return null;
    // Map agent-specific JSON to AgentEvent types...
    return null;
  }

  // ... implement remaining abstract methods
}

// Option B: Implement AgentAdapter directly (no BaseAgentAdapter utilities)
const bareAdapter: AgentAdapter = {
  agent: 'bare-agent' as AgentName,
  displayName: 'Bare Agent',
  cliCommand: 'bare',
  capabilities: { /* ... */ } as AgentCapabilities,
  models: [],
  configSchema: { /* ... */ } as AgentConfigSchema,
  buildSpawnArgs: (options) => ({ /* ... */ }) as SpawnArgs,
  parseEvent: (line, context) => null,
  detectAuth: async () => ({ /* ... */ }) as AuthState,
  getAuthGuidance: () => ({ /* ... */ }) as AuthSetupGuidance,
  sessionDir: () => '/tmp/bare-sessions',
  parseSessionFile: async () => ({ /* ... */ }) as Session,
  listSessionFiles: async () => [],
  readConfig: async () => ({}) as AgentConfig,
  writeConfig: async () => {},
};

// Register with the client
const mux = createClient();
mux.adapters.register(new MyAgentAdapter());
mux.adapters.register(bareAdapter);

// Now usable like any built-in agent
const handle = mux.run({ agent: 'my-agent', prompt: 'Hello' });
```

### 8.2 npm Package Convention

Plugin adapters distributed as npm packages should follow this convention:

- Package name: `agent-mux-adapter-<agent-name>` (e.g., `agent-mux-adapter-aider`).
- Default export: an `AgentAdapter` instance or a factory function `() => AgentAdapter`.
- Peer dependency: `@a5c-ai/agent-mux-core` (to get type definitions).

```typescript
// agent-mux-adapter-aider/src/index.ts
import { BaseAgentAdapter } from '@a5c-ai/agent-mux-core';

class AiderAdapter extends BaseAgentAdapter {
  // ... implementation
}

export default new AiderAdapter();
```

```typescript
// Consumer code
import aiderAdapter from 'agent-mux-adapter-aider';

const mux = createClient();
mux.adapters.register(aiderAdapter);
```

### 8.3 Name Collision Rules

When `register()` is called with an agent name that already exists in the registry:

| Existing source | New source | Behavior |
|---|---|---|
| `built-in` | `plugin` | Replacement proceeds. A `debug`-level warning is emitted on subsequent runs noting that a built-in adapter was overridden. |
| `plugin` | `plugin` | Replacement proceeds silently. The previous adapter is fully removed. |
| `built-in` | `built-in` | Only occurs during module initialization. Last registration wins (deterministic load order). |

In all cases, active runs using the old adapter continue uninterrupted. Only new runs use the replacement adapter.

---

## 9. Error Handling

### 9.1 Adapter Method Failures

Each adapter method has a defined failure mode:

| Method | Failure behavior |
|---|---|
| `buildSpawnArgs()` | Throws `CapabilityError` or `ValidationError`. The run is not started; the `RunHandle` promise rejects immediately. |
| `parseEvent()` | Must not throw. If it does throw despite this contract, the stream engine catches the exception, emits a `{ type: 'error', code: 'PARSE_ERROR', message, recoverable: true }` event, and continues processing subsequent lines. |
| `detectAuth()` | On failure, returns `{ status: 'unknown' }` rather than throwing. Network or filesystem errors during auth detection are swallowed and logged at debug level. |
| `getAuthGuidance()` | Must not throw. Returns a minimal guidance object with `steps: []` on failure. |
| `sessionDir()` | Throws if the path cannot be determined. Callers handle the error. |
| `parseSessionFile()` | Throws on file-not-found or parse failure. Callers handle the error. |
| `listSessionFiles()` | Returns an empty array on failure (directory not found, permission error). |
| `readConfig()` | Returns an empty config object if no config file exists. Throws on parse failure. |
| `writeConfig()` | Throws on filesystem errors (permission denied, disk full). |
| `listPlugins()` | Throws `CapabilityError` if `supportsPlugins` is false. |
| `installPlugin()` | Throws `CapabilityError` if `supportsPlugins` is false. Throws on install failure. |
| `uninstallPlugin()` | Throws `CapabilityError` if `supportsPlugins` is false. Throws on uninstall failure. |
| `searchPlugins()` | Throws `CapabilityError` if `supportsPlugins` is false. Returns empty array on search failure. |
| `onSpawnError()` | Must not throw. Returns an error event. |
| `onTimeout()` | Must not throw. Returns an error event. |
| `onProcessExit()` | Must not throw. Returns an array of events (may be empty). |
| `shouldRetry()` | Must not throw. Returns false on internal error. |

### 9.2 Registry Method Failures

| Method | Failure behavior |
|---|---|
| `list()` | Never fails. Returns an empty array if no adapters are registered. |
| `installed()` | Individual detection failures are captured in the `InstalledAgentInfo` (installed: false, version: null). The overall call never rejects. |
| `detect()` | Returns null if no adapter is registered. Detection failures produce an `InstalledAgentInfo` with `installed: false`. |
| `capabilities()` | Throws `AgentMuxError` with code `'UNKNOWN_AGENT'` if no adapter is registered. |
| `installInstructions()` | Throws `AgentMuxError` with code `'UNKNOWN_AGENT'` if no adapter is registered. Returns an empty array if the adapter declares no install methods for the given platform. |
| `register()` | Throws `ValidationError` if the adapter fails shape validation. |
| `unregister()` | Throws `AgentMuxError` with code `'UNKNOWN_AGENT'` if the agent is not registered. |

---

## 10. Edge Cases

### 10.1 Name Collision on Registration

See Section 8.3 for the complete collision matrix. Key points:

- Plugin adapters can override built-in adapters. This is intentional -- it allows consumers to patch agent behavior or replace a built-in adapter with a custom implementation.
- A warning is emitted (not an error) when overriding a built-in adapter, so the consumer is aware.
- The replaced adapter's reference is released; it is not stored for fallback.

### 10.2 Unregister During Active Run

When `unregister()` is called for an agent that has one or more active (in-progress) runs:

- The adapter instance is removed from the registry's lookup map immediately.
- Active `RunHandle` instances retain a direct reference to the adapter instance. They continue to function normally -- `parseEvent()` is still called for each line, hooks still fire on exit.
- New calls to `mux.run()` with the unregistered agent name fail with `AgentMuxError` code `'UNKNOWN_AGENT'`.
- The adapter instance is garbage-collected only after all `RunHandle` references to it are released (i.e., all active runs complete).

This design avoids the complexity of "pending unregister" states. The registry is a lookup table, not a lifecycle manager.

### 10.3 Unknown Output Lines

When `parseEvent()` returns `null` for a line:

- **Debug mode off (default).** The line is silently discarded. No event is emitted. This is the expected path for agent output that is informational but not semantically meaningful (progress spinners, ASCII art banners, blank lines, etc.).
- **Debug mode on.** A `{ type: 'log', source: 'stdout' | 'stderr', line }` event is emitted. This allows diagnostic tools to see everything the agent outputs without requiring the adapter to parse it.

If a significant fraction of lines are returning `null` (the adapter cannot parse most output), this indicates an adapter bug or an agent version mismatch. agent-mux does not detect this automatically -- adapter authors should ensure comprehensive parsing for all known output formats of their agent.

### 10.4 Adapter Registration Validation Failures

If `register()` receives an object that is missing required fields or has fields of the wrong type, it throws `ValidationError` with a message listing all validation failures. The adapter is not partially registered -- registration is atomic.

Specific validations:

- `agent` must be a non-empty string.
- `displayName` must be a non-empty string.
- `cliCommand` must be a non-empty string.
- `capabilities` must be an object with the required boolean fields.
- `models` must be an array.
- `configSchema` must be an object with `agent`, `fields`, `configFilePaths`, and `projectConfigFilePaths`.
- `buildSpawnArgs` must be a function.
- `parseEvent` must be a function.
- `detectAuth` must be a function.
- `getAuthGuidance` must be a function.
- `sessionDir` must be a function.
- `parseSessionFile` must be a function.
- `listSessionFiles` must be a function.
- `readConfig` must be a function.
- `writeConfig` must be a function.

### 10.5 Concurrent Detection Calls

If `detect()` or `installed()` is called while a previous detection for the same agent is still in progress, the second call awaits the same underlying promise rather than launching a duplicate detection. This deduplication prevents filesystem/process storms when multiple consumers call detection simultaneously.

### 10.6 Adapter with Empty Models Array

An adapter may declare an empty `models` array. This is valid for agents where the model list is dynamic and discovered at runtime (e.g., agents that proxy to multiple providers). In this case:

- `capabilities()` still works normally.
- `ModelRegistry.models(agent)` returns an empty array.
- `ModelRegistry.defaultModel(agent)` returns null.
- `mux.run()` with no `model` specified and no `defaultModelId` on the adapter: the agent is invoked without a model flag, relying on the agent's own default model selection.

### 10.7 hermes Adapter Specifics

The hermes adapter (NousResearch Hermes agent) follows the same contract as all other adapters. Hermes-specific notes:

- **Installation**: `pip install hermes-agent` or `uv pip install hermes-agent`. Requires Python >= 3.11. The `cliCommand` is `'hermes'`.
- **Version detection**: `hermes --version` is used by `detectVersionFromCli()`.
- **Session storage**: Hermes stores sessions in `~/.hermes/sessions/` as JSONL files.
- **Output format**: Hermes emits JSON-per-line on stdout when invoked with `--output-format jsonl`.
- **Capabilities**: Hermes supports text streaming, tool calling, MCP, and skills. It does not support session forking or parallel tool calls. The `supportsPlugins` flag is false for v1.

---

## 11. Built-in Adapter Summary

All ten built-in adapters extend `BaseAgentAdapter` and are registered automatically on import. Each adapter implements the full `AgentAdapter` interface with agent-specific logic for spawning, parsing, session management, configuration, and authentication.

| Adapter | `agent` | `cliCommand` | `displayName` | Session Format | Stream | Plugin Support |
|---|---|---|---|---|---|---|
| ClaudeCodeAdapter | `claude` | `claude` | Claude Code | JSONL | yes | partial (skill-directory, mcp-server) |
| CodexAdapter | `codex` | `codex` | Codex CLI | JSONL | yes | no |
| GeminiAdapter | `gemini` | `gemini` | Gemini CLI | JSONL | yes | no |
| CopilotAdapter | `copilot` | `copilot` (binary: `gh copilot`) | GitHub Copilot CLI | JSON | yes | no |
| CursorAdapter | `cursor` | `cursor` | Cursor | SQLite | partial | yes |
| OpenCodeAdapter | `opencode` | `opencode` | OpenCode | SQLite | yes | yes |
| PiAdapter | `pi` | `pi` | Pi | JSONL tree | yes | yes |
| OmpAdapter | `omp` | `omp` | oh-my-pi | JSONL tree | yes | yes |
| OpenClawAdapter | `openclaw` | `openclaw` | OpenClaw | JSON | partial | yes |
| HermesAdapter | `hermes` | `hermes` | NousResearch Hermes | JSONL | yes | no |

---

## 12. Complete Type Index

All types defined or referenced in this specification:

| Type | Defined in | Section |
|---|---|---|
| `AgentAdapter` | This spec | 2 |
| `BaseAgentAdapter` | This spec | 4 |
| `AdapterRegistry` | This spec | 5 |
| `SpawnArgs` | This spec | 3.1 |
| `ParseContext` | This spec | 3.2 |
| `InstalledAgentInfo` | This spec | 3.3 |
| `AgentAdapterInfo` | This spec | 3.4 |
| `StreamAssembler` | This spec | 6 |
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `AgentEvent`, `BaseEvent` | `04-agent-events.md` | 2 |
| `AgentCapabilities` | `06-capabilities-and-models.md` | 1 |
| `ModelCapabilities` | `06-capabilities-and-models.md` | 2 |
| `InstallMethod` | `06-capabilities-and-models.md` | 3 |
| `CostRecord` | `01-core-types-and-client.md` | 4.2.3 |
| `RetryPolicy` | `01-core-types-and-client.md` | 5.1.1 |
| `AuthState` | `08-config-and-auth.md` | 2 |
| `AuthSetupGuidance` | `08-config-and-auth.md` | 2 |
| `AgentConfig` | `08-config-and-auth.md` | 2 |
| `AgentConfigSchema` | `08-config-and-auth.md` | 2 |
| `Session` | `07-session-manager.md` | 2 |
| `InstalledPlugin` | `09-plugin-manager.md` | 2 |
| `PluginInstallOptions` | `09-plugin-manager.md` | 2 |
| `PluginSearchOptions` | `09-plugin-manager.md` | 2 |
| `PluginListing` | `09-plugin-manager.md` | 2 |
| `ErrorCode` | `01-core-types-and-client.md` | 3.1 |
| `AgentMuxError`, `CapabilityError`, `ValidationError` | `01-core-types-and-client.md` | 3.1, 3.2 |

---

## Implementation Status (2026-04-12)

### Additional AgentAdapter members (optional)

`AgentAdapter` exposes three optional methods consumed by `amux install|update|detect`:

```ts
detectInstallation?(): Promise<DetectInstallationResult>;
install?(opts?: AdapterInstallOptions): Promise<InstallResult>;
update?(opts?: AdapterUpdateOptions): Promise<InstallResult>;
```

Types in `packages/core/src/adapter.ts`:

- `DetectInstallationResult { installed, version?, path?, notes? }`
- `InstallResult { ok, method, command, stdout?, stderr?, installedVersion?, message? }`
- `AdapterInstallOptions { version?, force?, dryRun? }`
- `AdapterUpdateOptions { dryRun? }`

Implementations accept a pluggable `Spawner`:

```ts
type Spawner = (command: string, args: string[], options?: {
  env?: Record<string, string>; cwd?: string;
}) => Promise<{ code: number; stdout: string; stderr: string }>;
```

Tests inject a fake spawner to avoid hitting the real system.

### `hostEnvSignals`

Each adapter may expose `readonly hostEnvSignals: readonly string[]`. These are env variables that indicate the current process is running *inside* that harness. They are surfaced via `client.detectHost()` → `detectHostHarness()` and merged with `DEFAULT_HOST_SIGNALS` in `packages/core/src/host-detection.ts`. Example (claude adapter):

```ts
readonly hostEnvSignals = [
  'CLAUDECODE', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE', 'CLAUDE_PROJECT_DIR',
] as const;
```

### Built-in adapter count

`@a5c-ai/agent-mux-adapters` now ships 11 adapters. The 11th is `agent-mux-remote`; see `docs/12-built-in-adapters.md`.

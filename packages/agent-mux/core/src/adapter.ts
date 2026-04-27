/**
 * AgentAdapter interface, SpawnArgs, ParseContext, and related types.
 *
 * @see 05-adapter-system.md §2, §3
 */

import type { AgentName } from './types.js';
import type { AgentCapabilities, ModelCapabilities } from './capabilities.js';
import type { RunOptions } from './run-options.js';
import type { AgentEvent } from './events.js';
import type { StreamAssembler } from './stream-assembler.js';
import type {
  InstalledPlugin,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginListing,
} from './plugin-types.js';
import type {
  RuntimeHookDispatcher,
  RuntimeHookSetup,
} from './runtime-hooks.js';

// ---------------------------------------------------------------------------
// Re-export types from dedicated type modules.
// ---------------------------------------------------------------------------

// Session types
export type { Session, SessionMessage, SessionToolCall, SessionSummary, FullSession, SessionListOptions, SessionQuery, CostAggregationOptions, CostSummary, CostBreakdown, SessionDiff, DiffOperation } from './session-types.js';
import type { Session } from './session-types.js';

// Auth types
export type { AuthState, AuthSetupGuidance, AuthMethod, AuthSetupStep, AuthEnvVar } from './auth-types.js';
import type { AuthState } from './auth-types.js';
import type { AuthSetupGuidance } from './auth-types.js';

// Config types
export type { AgentConfig, AgentConfigSchema, ConfigField, ValidationResult, ConfigValidationError, ConfigValidationWarning } from './config-types.js';
import type { AgentConfig } from './config-types.js';
import type { AgentConfigSchema } from './config-types.js';
export type {
  InstalledPlugin,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginListing,
} from './plugin-types.js';

// ---------------------------------------------------------------------------
// SpawnArgs
// ---------------------------------------------------------------------------

/**
 * Describes exactly how to spawn an agent subprocess.
 * Returned by AgentAdapter.buildSpawnArgs().
 */
export interface SpawnArgs {
  /** The command to execute. */
  command: string;

  /** Array of CLI arguments. */
  args: string[];

  /** Environment variables for the subprocess. */
  env: Record<string, string>;

  /** Working directory for the subprocess. */
  cwd: string;

  /** Whether the subprocess requires a pseudo-terminal (PTY). */
  usePty: boolean;

  /** Standard input to pipe into the subprocess after spawn. */
  stdin?: string;

  /**
   * Close stdin immediately after launch setup completes.
   * Useful for CLIs that inspect stdin and block until EOF even when the
   * primary prompt is supplied via command-line arguments.
   */
  closeStdinAfterSpawn?: boolean;

  /** Timeout in milliseconds for entire subprocess execution. */
  timeout?: number;

  /** Inactivity timeout in milliseconds. */
  inactivityTimeout?: number;

  /** Shell mode — execute via system shell. */
  shell?: boolean;
}

// ---------------------------------------------------------------------------
// ParseContext
// ---------------------------------------------------------------------------

/**
 * Contextual state passed to AgentAdapter.parseEvent() on every line.
 */
export interface ParseContext {
  /** The run ID for the current run. */
  runId: string;

  /** The agent name. */
  agent: AgentName;

  /** The session ID, if one has been established. */
  sessionId: string | undefined;

  /** Zero-based index of the current turn. */
  turnIndex: number;

  /** Whether debug mode is active. */
  debug: boolean;

  /** The output format requested in RunOptions.outputFormat. */
  outputFormat: 'text' | 'json' | 'jsonl';

  /** Whether the line came from stdout or stderr. */
  source: 'stdout' | 'stderr';

  /** The StreamAssembler instance for this run. */
  assembler: StreamAssembler;

  /** Total number of events emitted so far in this run. */
  eventCount: number;

  /** The last event type emitted, or null if no events have been emitted yet. */
  lastEventType: string | null;

  /** Adapter-managed state bag. */
  adapterState: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// InstalledAgentInfo
// ---------------------------------------------------------------------------

/**
 * Result of detecting whether a specific agent is installed and functional.
 */
export interface InstalledAgentInfo {
  /** The agent identifier. */
  agent: AgentName;

  /** Whether the agent CLI binary was found on PATH. */
  installed: boolean;

  /** Absolute path to the CLI binary, or null if not found. */
  cliPath: string | null;

  /** Detected version string, or null. */
  version: string | null;

  /** Whether the detected version meets the adapter's minVersion requirement. */
  meetsMinVersion: boolean;

  /** The minimum version required by the adapter. */
  minVersion: string;

  /** Current authentication state for this agent. */
  authState: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown';

  /** The currently active/default model, or null. */
  activeModel: string | null;
}

// ---------------------------------------------------------------------------
// AgentAdapterInfo
// ---------------------------------------------------------------------------

/**
 * Lightweight descriptor of a registered adapter.
 */
export interface AgentAdapterInfo {
  /** The agent identifier. */
  agent: AgentName;

  /** Human-readable display name. */
  displayName: string;

  /** The CLI command used to invoke this agent. */
  cliCommand: string;

  /** Minimum CLI version required, if any. */
  minVersion: string | undefined;

  /** Whether this adapter was registered as a built-in or plugin. */
  source: 'built-in' | 'plugin';
}

// ---------------------------------------------------------------------------
// Install / Detect types (per-adapter install, update, detect)
// ---------------------------------------------------------------------------

/** Result of `AgentAdapter.detectInstallation()`. */
export interface DetectInstallationResult {
  /** Whether the harness binary was found on PATH (or equivalent). */
  installed: boolean;
  /** Detected version string, if obtainable. */
  version?: string;
  /** Absolute path to the binary, if located. */
  path?: string;
  /** Optional diagnostic notes (e.g. config dir discovered). */
  notes?: string;
}

/** Result of `AgentAdapter.install()` / `update()`. */
export interface InstallResult {
  /** Whether the operation succeeded. */
  ok: boolean;
  /** High-level method chosen (`npm`, `brew`, `manual`, `ssh`, `dry-run`, ...). */
  method: string;
  /** Command string that was (or would be) executed. */
  command: string;
  /** Captured stdout, if the command ran. */
  stdout?: string;
  /** Captured stderr, if the command ran. */
  stderr?: string;
  /** Version detected after a successful install. */
  installedVersion?: string;
  /** Human-readable message (e.g. manual install instructions). */
  message?: string;
}

/** Options for `AgentAdapter.install()`. */
export interface AdapterInstallOptions {
  /** Explicit version tag to pin (npm only; falls through when unsupported). */
  version?: string;
  /** Reinstall even if already detected. */
  force?: boolean;
  /** Print the planned command without executing. */
  dryRun?: boolean;
}

/** Options for `AgentAdapter.update()`. */
export interface AdapterUpdateOptions {
  /** Print the planned command without executing. */
  dryRun?: boolean;
}

/**
 * Pluggable subprocess runner used by install/update/detect.
 * Tests replace this to avoid hitting the real system.
 */
export type Spawner = (
  command: string,
  args: string[],
  options?: { env?: Record<string, string>; cwd?: string },
) => Promise<{ code: number; stdout: string; stderr: string }>;

// ---------------------------------------------------------------------------
// AgentAdapter Interface
// ---------------------------------------------------------------------------

/**
 * The full contract for an agent adapter.
 */
export interface AgentAdapter {
  // ── Identity ──────────────────────────────────────────────────────

  readonly agent: AgentName;
  readonly displayName: string;
  readonly cliCommand: string;
  readonly minVersion?: string;

  // ── Capabilities ──────────────────────────────────────────────────

  readonly capabilities: AgentCapabilities;
  readonly models: ModelCapabilities[];
  readonly defaultModelId?: string;
  readonly configSchema: AgentConfigSchema;

  // ── Spawning ──────────────────────────────────────────────────────

  buildSpawnArgs(options: RunOptions): SpawnArgs;

  // ── Output parsing ────────────────────────────────────────────────

  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null;

  // ── Authentication ────────────────────────────────────────────────

  detectAuth(): Promise<AuthState>;
  getAuthGuidance(): AuthSetupGuidance;

  // ── Session management ────────────────────────────────────────────

  sessionDir(cwd?: string): string;
  parseSessionFile(filePath: string): Promise<Session>;
  listSessionFiles(cwd?: string): Promise<string[]>;

  // ── Configuration ─────────────────────────────────────────────────

  readConfig(cwd?: string): Promise<AgentConfig>;
  writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>;

  /** Optional adapter-native model discovery hook used by ModelRegistry.refresh(). */
  discoverModels?(cwd?: string): Promise<ModelCapabilities[]>;

  /** Translate a provider config into harness-specific env vars and args. */
  translateProvider?(config: Record<string, unknown>): { env: Record<string, string>; args: string[]; proxyRequired: boolean; proxyExposedTransport?: string };

  // ── Host detection (optional) ─────────────────────────────────────

  /** Env-var names that indicate the current process is running under this harness. */
  readonly hostEnvSignals?: readonly string[];

  /** Extract adapter-specific metadata (session_id, run_id, etc.) from an env snapshot. */
  readHostMetadata?(env: NodeJS.ProcessEnv): Record<string, string | number | boolean | null>;

  // ── Install / Update / Detect (optional) ──────────────────────────

  /** Detects whether the harness binary is installed. */
  detectInstallation?(): Promise<DetectInstallationResult>;
  /** Installs the harness binary. */
  install?(opts?: AdapterInstallOptions): Promise<InstallResult>;
  /** Updates the harness binary. */
  update?(opts?: AdapterUpdateOptions): Promise<InstallResult>;

  // ── Hooks (optional) ──────────────────────────────────────────────

  /** Native hook type names this harness supports (see HOOK_CATALOG). */
  readonly supportedHookTypes?: readonly string[];

  /**
   * Install a hook into the harness's native config (e.g. claude's
   * ~/.claude/settings.json). Default implementation in BaseAdapter
   * only writes to .amux/hooks.json — override to also wire the
   * harness natively so it actually fires the hook.
   */
  installHook?(hookType: string, command: string, opts?: { scope?: 'global' | 'project'; id?: string }): Promise<void>;

  /** Remove a hook installed by `installHook`. */
  uninstallHook?(id: string, opts?: { scope?: 'global' | 'project' }): Promise<boolean>;

  /**
   * Optional per-run native runtime-hook bridge setup for harnesses that can
   * invoke external hook commands before or after internal actions.
   */
  setupRuntimeHooks?(options: RunOptions, dispatcher: RuntimeHookDispatcher): Promise<RuntimeHookSetup | void>;

  // ── Plugin operations (optional) ──────────────────────────────────

  listPlugins?(): Promise<InstalledPlugin[]>;
  installPlugin?(pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin>;
  uninstallPlugin?(pluginId: string, options?: { global?: boolean }): Promise<void>;
  searchPlugins?(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>;
}

// ---------------------------------------------------------------------------
// Multi-adapter architecture
// ---------------------------------------------------------------------------

// Export new multi-adapter types
export type {
  BaseAgentAdapterInterface,
  SubprocessAdapter,
  RemoteAdapter,
  ProgrammaticAdapter,
  RemoteConnection,
  HttpConnection,
  WebSocketConnection,
  WebSocketMessage,
  ServerOptions,
  ServerInfo,
  ServerHealth,
  ServerManager,
  AgentAdapter as MultiAgentAdapter, // New union type
} from './adapter-types.js';

export {
  isSubprocessAdapter,
  isRemoteAdapter,
  isProgrammaticAdapter,
  isHttpConnection,
  isWebSocketConnection,
} from './adapter-types.js';

/**
 * Legacy AgentAdapter interface - equivalent to SubprocessAdapter in new architecture.
 *
 * @deprecated For new adapters, import specific types from './adapter-types.js':
 *   - SubprocessAdapter (CLI tools)
 *   - RemoteAdapter (HTTP/WebSocket)
 *   - ProgrammaticAdapter (direct SDK)
 *
 * This interface is maintained for backward compatibility with existing adapters.
 */
// Note: This interface is still the "AgentAdapter" used by existing code

/**
 * Harness adapter interface.
 *
 * A "harness" is the host tool that invokes the babysitter SDK (e.g. Claude Code,
 * Cursor, Windsurf). Each harness has its own session lifecycle, env vars, and
 * hook input/output formats. The adapter interface abstracts these differences
 * so the SDK core remains harness-agnostic.
 */

// ---------------------------------------------------------------------------
// Harness capability enum
// ---------------------------------------------------------------------------

/** Capabilities that a harness adapter may support. */
export enum HarnessCapability {
  /** Harness supports programmatic (non-interactive) invocation. */
  Programmatic = "programmatic",
  /** Harness can bind a babysitter run to a host session. */
  SessionBinding = "session-binding",
  /** Harness implements the stop-hook lifecycle event. */
  StopHook = "stop-hook",
  /** Harness exposes an MCP (Model Context Protocol) server. */
  Mcp = "mcp",
  /** Harness can accept a prompt without a TTY (headless mode). */
  HeadlessPrompt = "headless-prompt",
}

// ---------------------------------------------------------------------------
// Discovery types
// ---------------------------------------------------------------------------

/** Result of probing the local environment for a specific harness CLI. */
export interface HarnessDiscoveryResult {
  /** Harness identifier (matches HarnessAdapter.name). */
  name: string;
  /** Whether the CLI binary was found on the system. */
  installed: boolean;
  /** Semantic version reported by the CLI, if obtainable. */
  version?: string;
  /** Absolute path to the CLI binary, if resolved. */
  cliPath?: string;
  /** Shell command used to invoke the CLI. */
  cliCommand: string;
  /** Whether the harness currently has an active session. */
  activeSession: boolean;
  /** Whether harness-specific configuration was found on disk. */
  configFound: boolean;
  /** Capabilities advertised by this harness. */
  capabilities: HarnessCapability[];
  /** Platform identifier (e.g. "win32", "linux", "darwin"). */
  platform: string;
}

// ---------------------------------------------------------------------------
// Invocation types
// ---------------------------------------------------------------------------

/** Options for programmatically invoking a harness CLI. */
export interface HarnessInvokeOptions {
  /** The prompt to send to the harness. */
  prompt: string;
  /** Working directory for the invocation. */
  workspace?: string;
  /** Model override (harness-specific). */
  model?: string;
  /** Maximum execution time in milliseconds. */
  timeout?: number;
  /** Whether to use RPC/structured-output mode. */
  rpc?: boolean;
  /** Additional environment variables passed to the child process. */
  env?: Record<string, string>;
}

/** Result returned after a harness CLI invocation completes. */
export interface HarnessInvokeResult {
  /** Whether the invocation completed without error. */
  success: boolean;
  /** Combined stdout/stderr output from the CLI. */
  output: string;
  /** Process exit code. */
  exitCode: number;
  /** Wall-clock duration of the invocation in milliseconds. */
  duration: number;
  /** Name of the harness that was invoked. */
  harness: string;
}

// ---------------------------------------------------------------------------
// Pi-specific session types
// ---------------------------------------------------------------------------

/** Options for creating a Pi harness session. */
export interface PiSessionOptions {
  /** Working directory for the session. */
  workspace?: string;
  /** Model override. */
  model?: string;
  /** Maximum execution time in milliseconds. */
  timeout?: number;
  /** Additional environment variables. */
  env?: Record<string, string>;
  /** Explicit path to the Pi CLI binary. */
  cliPath?: string;
}

/** Result of sending a prompt through a Pi session. */
export interface PiPromptResult {
  /** Raw output from the Pi CLI. */
  output: string;
  /** Process exit code. */
  exitCode: number;
  /** Wall-clock duration in milliseconds. */
  duration: number;
  /** Whether the prompt completed without error. */
  success: boolean;
}

// ---------------------------------------------------------------------------
// Session binding types (used by run:create)
// ---------------------------------------------------------------------------

export interface SessionBindOptions {
  sessionId: string;
  runId: string;
  runDir: string;
  pluginRoot?: string;
  stateDir?: string;
  runsDir?: string;
  maxIterations?: number;
  prompt: string;
  verbose: boolean;
  json: boolean;
}

export interface SessionBindResult {
  harness: string;
  sessionId: string;
  stateFile?: string;
  error?: string;
  /** When true, the error is fatal and run:create should exit non-zero. */
  fatal?: boolean;
}

// ---------------------------------------------------------------------------
// Hook handler arg types (used by hook:run)
// ---------------------------------------------------------------------------

export interface HookHandlerArgs {
  pluginRoot?: string;
  stateDir?: string;
  runsDir?: string;
  json: boolean;
  verbose?: boolean;
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface HarnessAdapter {
  /** Harness identifier (e.g. "claude-code") */
  readonly name: string;

  /** Does this harness appear to be active? (env var detection) */
  isActive(): boolean;

  /** Resolve session ID from CLI args / env vars / env file */
  resolveSessionId(parsed: { sessionId?: string }): string | undefined;

  /** Resolve state directory from args / env */
  resolveStateDir(args: { stateDir?: string; pluginRoot?: string }): string | undefined;

  /** Resolve plugin root from args / env */
  resolvePluginRoot(args: { pluginRoot?: string }): string | undefined;

  /** Guidance shown when a harness-specific session ID is required but missing. */
  getMissingSessionIdHint?(): string;

  /** Whether this harness truthfully supports a given SDK hook entrypoint. */
  supportsHookType?(hookType: string): boolean;

  /** Message shown when a hook type is requested but unsupported by the harness. */
  getUnsupportedHookMessage?(hookType: string): string;

  /** Bind a run to the caller's session (run:create flow) */
  bindSession(opts: SessionBindOptions): Promise<SessionBindResult>;

  /** Handle the stop hook (decision: approve/block) */
  handleStopHook(args: HookHandlerArgs): Promise<number>;

  /** Handle the session-start hook (env file + state file setup) */
  handleSessionStartHook(args: HookHandlerArgs): Promise<number>;

  /** Find hook dispatcher path (for shell hook execution) */
  findHookDispatcherPath(startCwd: string): string | null;

  /** Check whether the harness CLI binary is installed and reachable. */
  isCliInstalled?(): Promise<boolean>;

  /** Return CLI metadata (command name, version, resolved path). */
  getCliInfo?(): Promise<{ command: string; version?: string; path?: string }>;

  /** List capabilities supported by this harness adapter. */
  getCapabilities?(): HarnessCapability[];
}

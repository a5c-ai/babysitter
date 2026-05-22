/**
 * Harness adapter interface.
 *
 * A "harness" is the host tool that invokes the babysitter SDK (e.g. Claude Code,
 * Cursor, Windsurf). Each harness has its own session lifecycle, env vars, and
 * hook input/output formats. The adapter interface abstracts these differences
 * so the SDK core remains harness-agnostic.
 */

import type { PromptContext } from "../prompts/types";

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
  /** Harness supports concurrent effect execution (GAP-PAR-001). */
  ConcurrentEffects = "concurrent-effects",
  /** Harness supports async/background effects (GAP-PAR-002). */
  BackgroundEffects = "background-effects",
  /** Harness supports multi-harness parallel dispatch (GAP-PAR-003). */
  MultiHarnessDispatch = "multi-harness-dispatch",
}

// ---------------------------------------------------------------------------
// Discovery types
// ---------------------------------------------------------------------------

/**
 * Result of probing the local environment for a specific harness CLI.
 *
 * This is the **installed-discovery** result — it answers "is this CLI on
 * PATH?" and "does config exist?".  It does NOT report whether we are
 * currently running inside this harness; use `CallerHarnessResult` /
 * `detectCallerHarness()` for that.
 */
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
  /** Whether harness-specific configuration was found on disk. */
  configFound: boolean;
  /** Capabilities advertised by this harness. */
  capabilities: HarnessCapability[];
  /** Platform identifier (e.g. "win32", "linux", "darwin"). */
  platform: string;
}

/** Result of detecting which harness spawned the current process, if any. */
export interface CallerHarnessResult {
  /** Harness identifier (matches HarnessAdapter.name). */
  name: string;
  /** Environment variable names that matched the active caller. */
  matchedEnvVars: string[];
  /** Capabilities advertised by the detected caller harness. */
  capabilities: HarnessCapability[];
}

/** Detection specification for a single known harness. */
export interface HarnessSpec {
  /** Harness identifier (matches HarnessAdapter.name). */
  name: string;
  /** CLI command name used to invoke the harness. */
  cli: string;
  /**
   * Environment variables that indicate we are running inside an active
   * session of this harness.
   */
  callerEnvVars: string[];
  /** Capabilities advertised by this harness. */
  capabilities: HarnessCapability[];
  /** Config directory names to probe in cwd/home during installed discovery. */
  configPaths: string[];
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
  /** @deprecated Resolved from environment automatically (CLAUDE_PLUGIN_ROOT, CODEX_PLUGIN_ROOT, etc.). Accepted for backward compatibility. */
  pluginRoot?: string;
  stateDir?: string;
  runsDir?: string;
  json: boolean;
  verbose?: boolean;
  /** Pre-read stdin payload. When set, hook handlers should use this instead of reading process.stdin. */
  stdinPayload?: string;
}

export interface HarnessInstallOptions {
  workspace?: string;
  json: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export type HarnessInstallStatus =
  | "planned"
  | "installed"
  | "skipped"
  | "unsupported"
  | "failed";

export interface HarnessInstallResult {
  harness: string;
  dryRun?: boolean;
  success?: boolean;
  status?: HarnessInstallStatus;
  installer?: string;
  scope?: "global" | "workspace";
  warning?: string;
  summary?: string;
  command?: string;
  output?: string;
  location?: string;
  exitCode?: number;
  error?: string;
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

  /**
   * Whether this adapter auto-resolves session IDs from environment variables
   * or other ambient sources.  When true, explicitly passing `--session-id`
   * is rejected as a conflict.  Defaults to `false` when not implemented.
   */
  autoResolvesSessionId?(): boolean;

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

  /**
   * Install the harness CLI itself.
   * @deprecated Harness installation is now delegated to agent-mux. Use
   *   `installHarnessViaAmux()` from `./install.ts` instead.
   */
  installHarness?(options: HarnessInstallOptions): Promise<HarnessInstallResult>;

  /**
   * Install or materialize the Babysitter plugin/extension integration for this harness.
   * @deprecated Plugin installation is being migrated. This method will be
   *   removed in a future release.
   */
  installPlugin?(options: HarnessInstallOptions): Promise<HarnessInstallResult>;

  /**
   * Return a PromptContext pre-configured for this harness.
   * Centralizes harness-specific prompt configuration in the adapter itself.
   */
  getPromptContext?(opts?: { interactive?: boolean | undefined }): PromptContext;
}

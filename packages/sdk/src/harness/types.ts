/**
 * Harness adapter interface.
 *
 * A "harness" is the host tool that invokes the babysitter SDK (e.g. Claude Code,
 * Cursor, Windsurf). Each harness has its own session lifecycle, env vars, and
 * hook input/output formats. The adapter interface abstracts these differences
 * so the SDK core remains harness-agnostic.
 */

import type { AskUserQuestionUiContext } from "../interaction";
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

/** Options for creating a Pi harness session (programmatic API). */
export interface PiSessionOptions {
  /** Working directory for the session. */
  workspace?: string;
  /** Model identifier string (e.g. "claude-opus-4-5"). */
  model?: string;
  /** Maximum time in ms to wait for a single prompt to complete. */
  timeout?: number;
  /** Thinking level for the model. */
  thinkingLevel?: "minimal" | "low" | "medium" | "high" | "xhigh";
  /** Built-in tool mode to expose to the model. */
  toolsMode?: "default" | "coding" | "readonly";
  /** Custom tool definitions to register with the session. */
  customTools?: unknown[];
  /** Optional extension-style UI context exposed to custom tools inside the PI loop. */
  uiContext?: AskUserQuestionUiContext;
  /** Replace the discovered system prompt with a custom one. */
  systemPrompt?: string;
  /** Append custom system prompt instructions. */
  appendSystemPrompt?: string[];
  /** Isolate the session from discovered extensions, skills, and AGENTS files. */
  isolated?: boolean;
  /** Use an in-memory session manager instead of persistent session files. */
  ephemeral?: boolean;
  /** Bash tool execution backend. Defaults to native/local PI execution; "secure" opts into the sandbox backend and "auto" falls back to local. */
  bashSandbox?: "auto" | "secure" | "local";
  /** Whether PI session compaction should be enabled for this session. */
  enableCompaction?: boolean;
  /** Global pi agent config directory (default: ~/.pi/agent). */
  agentDir?: string;
}

/**
 * Event emitted by a Pi session during prompt execution.
 * Mirrors the AgentSessionEvent union from `@mariozechner/pi-coding-agent`.
 */
export interface PiSessionEvent {
  type: string;
  [key: string]: unknown;
}

/** Result of sending a prompt through a Pi session. */
export interface PiPromptResult {
  /** Collected text output from the agent response. */
  output: string;
  /** Wall-clock duration in milliseconds. */
  duration: number;
  /** Whether the prompt completed without error. */
  success: boolean;
  /** Exit code (0 = success, 1 = failure). */
  exitCode: number;
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

export interface HarnessInstallOptions {
  workspace?: string;
  json: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export interface HarnessInstallResult {
  harness: string;
  dryRun?: boolean;
  warning?: string;
  summary?: string;
  command?: string;
  output?: string;
  location?: string;
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

  /** Install the harness CLI itself. */
  installHarness?(options: HarnessInstallOptions): Promise<HarnessInstallResult>;

  /** Install or materialize the Babysitter plugin/extension integration for this harness. */
  installPlugin?(options: HarnessInstallOptions): Promise<HarnessInstallResult>;

  /**
   * Return a PromptContext pre-configured for this harness.
   * Centralizes harness-specific prompt configuration in the adapter itself.
   */
  getPromptContext?(opts?: { interactive?: boolean | undefined }): PromptContext;
}

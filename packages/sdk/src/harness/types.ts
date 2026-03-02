/**
 * Harness adapter interface.
 *
 * A "harness" is the host tool that invokes the babysitter SDK (e.g. Claude Code,
 * Cursor, Windsurf). Each harness has its own session lifecycle, env vars, and
 * hook input/output formats. The adapter interface abstracts these differences
 * so the SDK core remains harness-agnostic.
 */

// ---------------------------------------------------------------------------
// Session binding types (used by run:create)
// ---------------------------------------------------------------------------

export interface SessionBindOptions {
  sessionId: string;
  runId: string;
  runDir: string;
  pluginRoot?: string;
  stateDir?: string;
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

  /** Bind a run to the caller's session (run:create flow) */
  bindSession(opts: SessionBindOptions): Promise<SessionBindResult>;

  /** Handle the stop hook (decision: approve/block) */
  handleStopHook(args: HookHandlerArgs): Promise<number>;

  /** Handle the session-start hook (env file + state file setup) */
  handleSessionStartHook(args: HookHandlerArgs): Promise<number>;

  /** Find hook dispatcher path (for shell hook execution) */
  findHookDispatcherPath(startCwd: string): string | null;
}

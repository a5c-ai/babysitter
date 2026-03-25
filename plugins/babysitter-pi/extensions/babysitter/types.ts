/**
 * TypeScript type definitions for the babysitter oh-my-pi extension.
 *
 * Defines the contracts between extension modules,
 * the oh-my-pi ExtensionAPI surface, and babysitter run state.
 *
 * @module types
 */

// ---------------------------------------------------------------------------
// oh-my-pi ExtensionAPI surface (subset relevant to this extension)
// ---------------------------------------------------------------------------

/** Handler that can optionally block a tool call. */
export interface ToolCallInterceptResult {
  block: boolean;
  reason?: string;
}

/** A tool definition registered with oh-my-pi. */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

/** An entry appended to the oh-my-pi session log. */
export interface SessionEntry {
  type: string;
  content: unknown;
  timestamp?: string;
}

/** Message payload for pi.sendMessage / pi.sendUserMessage. */
export interface PiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Custom renderer for a specific message type. */
export type MessageRenderer = (payload: unknown) => string;

/**
 * The oh-my-pi Extension API surface.
 *
 * This is the primary interface handed to `activate()` by the host.
 */
export interface ExtensionAPI {
  /** Subscribe to a lifecycle or data event. */
  on(
    event:
      | 'session_start'
      | 'agent_end'
      | 'session_shutdown'
      | 'before_agent_start'
      | 'tool_call'
      | 'tool_result'
      | 'context'
      | 'input'
      | 'turn_start'
      | 'turn_end',
    handler: (...args: unknown[]) => unknown,
  ): void;

  /** Register a custom tool with the host. */
  registerTool(toolDef: ToolDefinition): void;

  /** Register a slash command. */
  registerCommand(name: string, options: { description?: string; handler: (...args: unknown[]) => unknown }): void;

  /** Register a custom message renderer for a given type. */
  registerMessageRenderer(type: string, renderer: MessageRenderer): void;

  /** Append an entry to the session log. */
  appendEntry(entry: SessionEntry): void;

  /** Inject a message into the conversation. */
  sendMessage(msg: PiMessage): void;

  /** Inject a user-role message into the conversation. */
  sendUserMessage(msg: PiMessage): void;

  /** Retrieve the currently active tool set. */
  getActiveTools(): ToolDefinition[];

  /** Replace the active tool set. */
  setActiveTools(tools: ToolDefinition[]): void;
}

// ---------------------------------------------------------------------------
// Babysitter run / effect state
// ---------------------------------------------------------------------------

/** Possible states of a babysitter run. */
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting';

/** Kinds of effects the babysitter runtime can request. */
export type EffectKind =
  | 'agent'
  | 'node'
  | 'shell'
  | 'breakpoint'
  | 'sleep'
  | 'skill'
  | 'orchestrator_task';

/** A single babysitter effect descriptor. */
export interface EffectDef {
  /** Unique effect identifier (ULID). */
  effectId: string;
  /** The kind of work to perform. */
  kind: EffectKind;
  /** Human-readable title. */
  title: string;
  /** Task identifier. */
  taskId: string;
  /** Arbitrary arguments for the task implementation. */
  args: Record<string, unknown>;
  /** Labels attached to the task definition. */
  labels?: string[];
}

/** Snapshot of a babysitter run as tracked by this extension. */
export interface RunState {
  /** The active run identifier. */
  runId: string;
  /** The oh-my-pi session identifier bound to this run. */
  sessionId: string;
  /** Current run status. */
  status: RunStatus;
  /** Number of orchestration iterations completed so far. */
  iterationCount: number;
  /** ISO-8601 timestamp when the run started. */
  startedAt: string;
  /** Effects currently pending execution. */
  pendingEffects: EffectDef[];
  /** Effects that have been resolved. */
  resolvedEffects: EffectDef[];
  /** Consecutive error counter (for guard thresholds). */
  consecutiveErrors: number;
  /** Most recent quality / score value, if available. */
  lastScore?: number;
  /** Current phase label (e.g. "plan", "execute", "verify"). */
  currentPhase?: string;
}

// ---------------------------------------------------------------------------
// Guard configuration
// ---------------------------------------------------------------------------

/** Configurable limits checked by the guard module. */
export interface GuardConfig {
  /** Maximum number of orchestration iterations before aborting. */
  maxIterations: number;
  /** Maximum wall-clock time (ms) before aborting. */
  maxDurationMs: number;
  /** Consecutive error count that triggers an abort. */
  errorThreshold: number;
  /** Number of identical iteration outputs that indicate a doom loop. */
  doomLoopWindow: number;
}

/** Result returned by the guard check. */
export interface GuardResult {
  /** Whether the run should continue. */
  allowed: boolean;
  /** Human-readable reason when `allowed` is false. */
  reason?: string;
}

// ---------------------------------------------------------------------------
// TUI / widget state
// ---------------------------------------------------------------------------

/** State bag consumed by TUI widget renderers. */
export interface WidgetState {
  /** Run identifier. */
  runId: string;
  /** Current phase label. */
  phase: string;
  /** Number of pending tasks. */
  pendingCount: number;
  /** Number of resolved tasks. */
  resolvedCount: number;
  /** Total tasks seen so far. */
  totalCount: number;
  /** Latest quality score. */
  score?: number;
  /** Elapsed wall-clock time in ms. */
  elapsedMs: number;
}

// ---------------------------------------------------------------------------
// CLI output shapes
// ---------------------------------------------------------------------------

/** JSON output from `babysitter run:iterate --json`. */
export interface IterateOutput {
  status: RunStatus;
  pendingActions?: EffectDef[];
  output?: unknown;
  error?: string;
}

/** JSON output from `babysitter session:init --json`. */
export interface SessionInitOutput {
  sessionId: string;
  runsDir: string;
}

/** JSON output from `babysitter session:associate --json`. */
export interface SessionAssociateOutput {
  runId: string;
  sessionId: string;
}

/** JSON output from `babysitter task:post --json`. */
export interface TaskPostOutput {
  effectId: string;
  recorded: boolean;
}

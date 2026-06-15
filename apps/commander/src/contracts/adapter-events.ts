/**
 * Mirrored adapter event contracts (SPEC §2).
 *
 * Faithful mirror of `@a5c-ai/comm-adapter`:
 *   - `packages/adapters/core/src/types.ts` (BaseEvent, AgentName, ErrorCode,
 *     CostRecord, Attachment, RunResult.exitReason)
 *   - `packages/adapters/core/src/events.ts` + `events-control.ts`
 *     (the UI-relevant subset of the AgentEvent union)
 *   - `packages/adapters/core/src/session-types.ts` (SessionMessage,
 *     SessionToolCall, token usage, workspace runtime surfaces)
 *   - `packages/adapters/core/src/workspaces.ts` (WorkspaceSessionContext)
 *
 * Do NOT add UI-only metadata here (positions, icons, sprite state) — that
 * lives outside the mirrored types, keyed by entity id.
 */

// ---------------------------------------------------------------------------
// Core aliases (mirror: adapters/core/src/types.ts)
// ---------------------------------------------------------------------------

/** Agent names — any string; the adapter registry resolves names to implementations. */
export type AgentName = string;

/** Machine-readable error codes defined by adapters. */
export type ErrorCode =
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
  | 'INTERACTION_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'PTY_NOT_AVAILABLE'
  | 'UNKNOWN_AGENT'
  | 'INTERNAL';

/** Aggregated cost data for a single run (mirror: types.ts CostRecord). */
export interface CostRecord {
  /** Total cost in USD. */
  totalUsd: number;
  /** Input tokens consumed. */
  inputTokens: number;
  /** Output tokens generated. */
  outputTokens: number;
  /** Thinking/reasoning tokens (if applicable). */
  thinkingTokens?: number;
  /** Cached input tokens (if applicable). @deprecated Use cacheCreationTokens + cacheReadTokens. */
  cachedTokens?: number;
  /** Cache creation tokens. */
  cacheCreationTokens?: number;
  /** Cache read tokens. */
  cacheReadTokens?: number;
}

/** Attachment payload accepted by session.start / session.message (mirror: types.ts). */
export interface Attachment {
  /** Absolute path to a local file. */
  filePath?: string;
  /** URL to fetch the attachment from. */
  url?: string;
  /** Base64-encoded content. Requires `mimeType` to be set. */
  base64?: string;
  /** MIME type of the attachment (required when `base64` is set). */
  mimeType?: string;
  /** Human-readable name for the attachment. */
  name?: string;
}

/** Why a run ended (mirror: adapters/core/src/run-handle.ts RunResult['exitReason']). */
export type RunExitReason =
  | 'completed'
  | 'aborted'
  | 'interrupted'
  | 'timeout'
  | 'inactivity'
  | 'turn_limit'
  | 'crashed'
  | 'killed';

// ---------------------------------------------------------------------------
// BaseEvent (mirror: types.ts)
// ---------------------------------------------------------------------------

/** Base shape shared by every event emitted on a RunHandle. */
export interface BaseEvent {
  /** Discriminator tag for the event union type. */
  type: string;
  /** ULID of the run that produced this event. */
  runId: string;
  /** Name of the agent that produced this event. */
  agent: AgentName;
  /** Unix epoch milliseconds when this event was created by adapters. */
  timestamp: number;
  /** Origin of the event inside adapters. Omitted for legacy agent-originated events. */
  source?: string;
  /** The raw, unparsed line from the agent's output (debug mode only). */
  raw?: string;
}

// ---------------------------------------------------------------------------
// Session lifecycle events (mirror: events.ts)
// ---------------------------------------------------------------------------

export interface SessionStartEvent extends BaseEvent {
  type: 'session_start';
  sessionId: string;
  resumed: boolean;
  forkedFrom?: string;
}

export interface SessionResumeEvent extends BaseEvent {
  type: 'session_resume';
  sessionId: string;
  priorTurnCount: number;
}

export interface SessionEndEvent extends BaseEvent {
  type: 'session_end';
  sessionId: string;
  turnCount: number;
  cost?: CostRecord;
}

// ---------------------------------------------------------------------------
// Turn / step lifecycle events (mirror: events.ts)
// ---------------------------------------------------------------------------

export interface TurnStartEvent extends BaseEvent {
  type: 'turn_start';
  turnIndex: number;
}

export interface TurnEndEvent extends BaseEvent {
  type: 'turn_end';
  turnIndex: number;
  cost?: CostRecord;
}

export interface StepStartEvent extends BaseEvent {
  type: 'step_start';
  turnIndex: number;
  stepIndex: number;
  stepType: string;
}

export interface StepEndEvent extends BaseEvent {
  type: 'step_end';
  turnIndex: number;
  stepIndex: number;
}

// ---------------------------------------------------------------------------
// Text / message streaming events (mirror: events.ts)
// ---------------------------------------------------------------------------

export interface MessageStartEvent extends BaseEvent {
  type: 'message_start';
}

export interface TextDeltaEvent extends BaseEvent {
  type: 'text_delta';
  delta: string;
  accumulated: string;
}

export interface MessageStopEvent extends BaseEvent {
  type: 'message_stop';
  text: string;
}

// ---------------------------------------------------------------------------
// Thinking / reasoning events (mirror: events.ts)
// ---------------------------------------------------------------------------

export interface ThinkingStartEvent extends BaseEvent {
  type: 'thinking_start';
  effort?: string;
}

export interface ThinkingDeltaEvent extends BaseEvent {
  type: 'thinking_delta';
  delta: string;
  accumulated: string;
}

export interface ThinkingStopEvent extends BaseEvent {
  type: 'thinking_stop';
  thinking: string;
}

// ---------------------------------------------------------------------------
// Tool calling events (mirror: events.ts)
// ---------------------------------------------------------------------------

export interface ToolCallStartEvent extends BaseEvent {
  type: 'tool_call_start';
  toolCallId: string;
  toolName: string;
  inputAccumulated: string;
}

export interface ToolInputDeltaEvent extends BaseEvent {
  type: 'tool_input_delta';
  toolCallId: string;
  delta: string;
  inputAccumulated: string;
}

export interface ToolCallReadyEvent extends BaseEvent {
  type: 'tool_call_ready';
  toolCallId: string;
  toolName: string;
  input: unknown;
}

export interface ToolResultEvent extends BaseEvent {
  type: 'tool_result';
  toolCallId: string;
  toolName: string;
  output: unknown;
  durationMs: number;
}

export interface ToolErrorEvent extends BaseEvent {
  type: 'tool_error';
  toolCallId: string;
  toolName: string;
  error: string;
}

// ---------------------------------------------------------------------------
// Cost and token events (mirror: events.ts)
// ---------------------------------------------------------------------------

export interface CostEvent extends BaseEvent {
  type: 'cost';
  cost: CostRecord;
}

export interface TokenUsageEvent extends BaseEvent {
  type: 'token_usage';
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
  cachedTokens?: number;
}

// ---------------------------------------------------------------------------
// Interaction / waiting events (mirror: events.ts)
// ---------------------------------------------------------------------------

export interface ApprovalRequestEvent extends BaseEvent {
  type: 'approval_request';
  interactionId: string;
  action: string;
  detail: string;
  toolName?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ApprovalGrantedEvent extends BaseEvent {
  type: 'approval_granted';
  interactionId: string;
}

export interface ApprovalDeniedEvent extends BaseEvent {
  type: 'approval_denied';
  interactionId: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Run lifecycle / control events (mirror: events-control.ts)
// ---------------------------------------------------------------------------

export interface AbortedEvent extends BaseEvent {
  type: 'aborted';
}

export interface PausedEvent extends BaseEvent {
  type: 'paused';
}

export interface ResumedEvent extends BaseEvent {
  type: 'resumed';
}

export interface ContextLimitWarningEvent extends BaseEvent {
  type: 'context_limit_warning';
  usedTokens: number;
  maxTokens: number;
  pctUsed: number;
}

// ---------------------------------------------------------------------------
// Error events (mirror: events-control.ts)
// ---------------------------------------------------------------------------

export interface ErrorEvent extends BaseEvent {
  type: 'error';
  code: ErrorCode;
  message: string;
  recoverable: boolean;
}

// ---------------------------------------------------------------------------
// AgentEvent — the UI-relevant subset of the adapter event union
// ---------------------------------------------------------------------------

/**
 * UI-relevant subset (~25 of 67) of the adapter `AgentEvent` discriminated
 * union. The `type` field is the discriminant; TypeScript narrowing works out
 * of the box. Every member shape mirrors the real adapter shape exactly.
 */
export type AgentEvent =
  // Session lifecycle
  | SessionStartEvent
  | SessionResumeEvent
  | SessionEndEvent
  // Turn / step lifecycle
  | TurnStartEvent
  | TurnEndEvent
  | StepStartEvent
  | StepEndEvent
  // Text / message streaming
  | MessageStartEvent
  | TextDeltaEvent
  | MessageStopEvent
  // Thinking / reasoning
  | ThinkingStartEvent
  | ThinkingDeltaEvent
  | ThinkingStopEvent
  // Tool calling
  | ToolCallStartEvent
  | ToolInputDeltaEvent
  | ToolCallReadyEvent
  | ToolResultEvent
  | ToolErrorEvent
  // Cost and tokens
  | CostEvent
  | TokenUsageEvent
  // Interaction / waiting
  | ApprovalRequestEvent
  | ApprovalGrantedEvent
  | ApprovalDeniedEvent
  // Run lifecycle / control
  | AbortedEvent
  | PausedEvent
  | ResumedEvent
  | ContextLimitWarningEvent
  // Errors
  | ErrorEvent;

/** Extract the event type for a given discriminant string. */
export type EventOfType<T extends AgentEvent['type']> = Extract<AgentEvent, { type: T }>;

/** All valid event type discriminant strings. */
export type AgentEventType = AgentEvent['type'];

// ---------------------------------------------------------------------------
// Workspace context (mirror: workspaces.ts)
// ---------------------------------------------------------------------------

export type WorkspaceMaterializationMode = 'worktree' | 'symlink';

export interface WorkspaceSessionRepoContext {
  readonly alias: string;
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly mode: WorkspaceMaterializationMode;
  readonly gitRoot: string | null;
  readonly branch: string | null;
  readonly head: string | null;
}

export interface WorkspaceSessionContext {
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly workspaceRootPath: string;
  readonly workspaceDefaultCwd: string;
  readonly workspaceMode: WorkspaceMaterializationMode;
  readonly currentPath?: string;
  readonly repo?: WorkspaceSessionRepoContext;
}

// ---------------------------------------------------------------------------
// Workspace runtime surfaces (mirror: session-types.ts)
// ---------------------------------------------------------------------------

export interface WorkspaceRuntimeDeviceProfile {
  readonly id: 'desktop' | 'tablet' | 'mobile';
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

export interface WorkspaceRuntimeLogLine {
  readonly timestamp: number;
  readonly stream: 'stdout' | 'stderr' | 'system';
  readonly text: string;
}

export interface WorkspaceTerminalCommand {
  readonly id: string;
  readonly runId: string;
  readonly source: 'shell' | 'tool';
  readonly toolName?: string;
  readonly command: string;
  readonly status: 'running' | 'completed' | 'failed';
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly exitCode?: number;
  readonly logs: readonly WorkspaceRuntimeLogLine[];
}

export interface WorkspacePreviewSurface {
  readonly status: 'ready' | 'unavailable';
  readonly primaryUrl?: string;
  readonly urls: readonly string[];
  readonly detectedAt?: number;
  readonly deviceProfiles: readonly WorkspaceRuntimeDeviceProfile[];
}

export interface WorkspaceTerminalSurface {
  readonly status: 'active' | 'idle';
  readonly commands: readonly WorkspaceTerminalCommand[];
}

export interface WorkspaceDevServerSurface {
  readonly status: 'running' | 'starting' | 'idle' | 'error';
  readonly command?: string;
  readonly primaryUrl?: string;
  readonly urls: readonly string[];
  readonly port?: number;
  readonly detectedAt?: number;
  readonly logs: readonly WorkspaceRuntimeLogLine[];
}

export interface WorkspaceRuntimeSurface {
  readonly workspacePath?: string;
  readonly updatedAt: number;
  readonly preview: WorkspacePreviewSurface;
  readonly terminal: WorkspaceTerminalSurface;
  readonly devServer: WorkspaceDevServerSurface;
}

// ---------------------------------------------------------------------------
// Session message shapes (mirror: session-types.ts)
// ---------------------------------------------------------------------------

/** A tool call within a session message. */
export interface SessionToolCall {
  /** Tool call ID (agent-assigned). */
  readonly toolCallId: string;
  /** Name of the tool that was called. */
  readonly toolName: string;
  /** Input arguments passed to the tool. */
  readonly input: unknown;
  /** Tool output, if available. */
  readonly output?: unknown;
  /** Duration of the tool call in milliseconds, if recorded. */
  readonly durationMs?: number;
}

/** Per-message token usage (the inline shape of `SessionMessage.tokenUsage`). */
export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly thinkingTokens?: number;
  readonly cachedTokens?: number;
}

/** A single message within a session. */
export interface SessionMessage {
  /** Role of the message author. */
  readonly role: 'user' | 'assistant' | 'system' | 'tool';
  /** Text content of the message. Empty string for tool-only messages. */
  readonly content: string;
  /** Timestamp when this message was recorded. */
  readonly timestamp?: Date;
  /** Tool calls initiated by this message (assistant role only). */
  readonly toolCalls?: SessionToolCall[];
  /** Tool result (tool role only). */
  readonly toolResult?: {
    readonly toolCallId: string;
    readonly toolName: string;
    readonly output: unknown;
  };
  /** Token usage for this message, if available. */
  readonly tokenUsage?: TokenUsage;
  /** Cost for this individual message, if available. */
  readonly cost?: CostRecord;
  /** Thinking/reasoning content, if the agent exposed it. */
  readonly thinking?: string;
  /** Model used for this specific message (may differ within a session). */
  readonly model?: string;
}

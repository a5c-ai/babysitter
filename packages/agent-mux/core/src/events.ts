/**
 * AgentEvent union type and all event discriminants for @a5c-ai/agent-mux.
 *
 * 67 event types across 18 categories. All extend BaseEvent with a `type`
 * discriminant, `runId`, `agent`, and `timestamp`.
 */

import type { AgentName, CostRecord, ErrorCode } from './types.js';

// ---------------------------------------------------------------------------
// Re-export BaseEvent shape (canonical definition lives in types.ts)
// ---------------------------------------------------------------------------

export type { BaseEvent } from './types.js';
import type { BaseEvent } from './types.js';

// ---------------------------------------------------------------------------
// 5 — Session lifecycle events
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

export interface SessionForkEvent extends BaseEvent {
  type: 'session_fork';
  sessionId: string;
  forkedFrom: string;
}

export interface SessionCheckpointEvent extends BaseEvent {
  type: 'session_checkpoint';
  sessionId: string;
  checkpointId: string;
}

export interface SessionEndEvent extends BaseEvent {
  type: 'session_end';
  sessionId: string;
  turnCount: number;
  cost?: CostRecord;
}

// ---------------------------------------------------------------------------
// 4 — Turn / step lifecycle events
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
// 3 — Text / message streaming events
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
// 3 — Thinking / reasoning events
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
// 5 — Tool calling events
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
// 5 — File operations events
// ---------------------------------------------------------------------------

export interface FileReadEvent extends BaseEvent {
  type: 'file_read';
  path: string;
}

export interface FileWriteEvent extends BaseEvent {
  type: 'file_write';
  path: string;
  byteCount: number;
}

export interface FileCreateEvent extends BaseEvent {
  type: 'file_create';
  path: string;
  byteCount: number;
}

export interface FileDeleteEvent extends BaseEvent {
  type: 'file_delete';
  path: string;
}

export interface FilePatchEvent extends BaseEvent {
  type: 'file_patch';
  path: string;
  diff: string;
}

// ---------------------------------------------------------------------------
// 4 — Shell operations events
// ---------------------------------------------------------------------------

export interface ShellStartEvent extends BaseEvent {
  type: 'shell_start';
  command: string;
  cwd: string;
}

export interface ShellStdoutDeltaEvent extends BaseEvent {
  type: 'shell_stdout_delta';
  delta: string;
}

export interface ShellStderrDeltaEvent extends BaseEvent {
  type: 'shell_stderr_delta';
  delta: string;
}

export interface ShellExitEvent extends BaseEvent {
  type: 'shell_exit';
  exitCode: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// 3 — MCP tool calling events
// ---------------------------------------------------------------------------

export interface McpToolCallStartEvent extends BaseEvent {
  type: 'mcp_tool_call_start';
  toolCallId: string;
  server: string;
  toolName: string;
  input: unknown;
}

export interface McpToolResultEvent extends BaseEvent {
  type: 'mcp_tool_result';
  toolCallId: string;
  server: string;
  toolName: string;
  output: unknown;
}

export interface McpToolErrorEvent extends BaseEvent {
  type: 'mcp_tool_error';
  toolCallId: string;
  server: string;
  toolName: string;
  error: string;
}

// ---------------------------------------------------------------------------
// 3 — Subagent dispatch events
// ---------------------------------------------------------------------------

export interface SubagentSpawnEvent extends BaseEvent {
  type: 'subagent_spawn';
  subagentId: string;
  agentName: string;
  prompt: string;
}

export interface SubagentResultEvent extends BaseEvent {
  type: 'subagent_result';
  subagentId: string;
  agentName: string;
  summary: string;
  cost?: CostRecord;
}

export interface SubagentErrorEvent extends BaseEvent {
  type: 'subagent_error';
  subagentId: string;
  agentName: string;
  error: string;
}

// ---------------------------------------------------------------------------
// 3 — Plugin events
// ---------------------------------------------------------------------------

export interface PluginLoadedEvent extends BaseEvent {
  type: 'plugin_loaded';
  pluginId: string;
  pluginName: string;
  version: string;
}

export interface PluginInvokedEvent extends BaseEvent {
  type: 'plugin_invoked';
  pluginId: string;
  pluginName: string;
}

export interface PluginErrorEvent extends BaseEvent {
  type: 'plugin_error';
  pluginId: string;
  pluginName: string;
  error: string;
}

// ---------------------------------------------------------------------------
// 3 — Skill / agent doc loading events
// ---------------------------------------------------------------------------

export interface SkillLoadedEvent extends BaseEvent {
  type: 'skill_loaded';
  skillName: string;
  source: string;
}

export interface SkillInvokedEvent extends BaseEvent {
  type: 'skill_invoked';
  skillName: string;
}

export interface AgentdocReadEvent extends BaseEvent {
  type: 'agentdoc_read';
  path: string;
}

// ---------------------------------------------------------------------------
// 2 — Multimodal events
// ---------------------------------------------------------------------------

export interface ImageOutputEvent extends BaseEvent {
  type: 'image_output';
  mimeType: string;
  base64?: string;
  filePath?: string;
}

export interface ImageInputAckEvent extends BaseEvent {
  type: 'image_input_ack';
  mimeType: string;
}

// ---------------------------------------------------------------------------
// 2 — Cost and token events
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
// 4 — Interaction / waiting events
// ---------------------------------------------------------------------------

export interface InputRequiredEvent extends BaseEvent {
  type: 'input_required';
  interactionId: string;
  question: string;
  context?: string;
  source: 'agent' | 'tool';
}

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

// ---------------------------------------------------------------------------
// Control events split out to events-control.ts — re-exported for back-compat
// ---------------------------------------------------------------------------

export type {
  RateLimitedEvent, ContextLimitWarningEvent, ContextCompactedEvent, RetryEvent,
  InterruptedEvent, AbortedEvent, PausedEvent, ResumedEvent, TimeoutEvent, TurnLimitEvent, StreamFallbackEvent,
  AuthErrorEvent, RateLimitErrorEvent, ContextExceededEvent, CrashEvent, ErrorEvent,
  DebugEvent, LogEvent,
} from './events-control.js';

import type {
  RateLimitedEvent, ContextLimitWarningEvent, ContextCompactedEvent, RetryEvent,
  InterruptedEvent, AbortedEvent, PausedEvent, ResumedEvent, TimeoutEvent, TurnLimitEvent, StreamFallbackEvent,
  AuthErrorEvent, RateLimitErrorEvent, ContextExceededEvent, CrashEvent, ErrorEvent,
  DebugEvent, LogEvent,
} from './events-control.js';

// ---------------------------------------------------------------------------
// AgentEvent — discriminated union of all 67 event types
// ---------------------------------------------------------------------------

/**
 * The complete discriminated union of all 67 event types emitted by agent-mux.
 *
 * The `type` field is the discriminant. TypeScript narrowing works out of
 * the box: `if (event.type === 'text_delta') { event.delta; /* TextDeltaEvent *\/ }`
 */
export type AgentEvent =
  // Session lifecycle (5)
  | SessionStartEvent
  | SessionResumeEvent
  | SessionForkEvent
  | SessionCheckpointEvent
  | SessionEndEvent
  // Turn / step lifecycle (4)
  | TurnStartEvent
  | TurnEndEvent
  | StepStartEvent
  | StepEndEvent
  // Text / message streaming (3)
  | MessageStartEvent
  | TextDeltaEvent
  | MessageStopEvent
  // Thinking / reasoning (3)
  | ThinkingStartEvent
  | ThinkingDeltaEvent
  | ThinkingStopEvent
  // Tool calling (5)
  | ToolCallStartEvent
  | ToolInputDeltaEvent
  | ToolCallReadyEvent
  | ToolResultEvent
  | ToolErrorEvent
  // File operations (5)
  | FileReadEvent
  | FileWriteEvent
  | FileCreateEvent
  | FileDeleteEvent
  | FilePatchEvent
  // Shell operations (4)
  | ShellStartEvent
  | ShellStdoutDeltaEvent
  | ShellStderrDeltaEvent
  | ShellExitEvent
  // MCP tool calling (3)
  | McpToolCallStartEvent
  | McpToolResultEvent
  | McpToolErrorEvent
  // Subagent dispatch (3)
  | SubagentSpawnEvent
  | SubagentResultEvent
  | SubagentErrorEvent
  // Plugin events (3)
  | PluginLoadedEvent
  | PluginInvokedEvent
  | PluginErrorEvent
  // Skill / agent doc loading (3)
  | SkillLoadedEvent
  | SkillInvokedEvent
  | AgentdocReadEvent
  // Multimodal (2)
  | ImageOutputEvent
  | ImageInputAckEvent
  // Cost and tokens (2)
  | CostEvent
  | TokenUsageEvent
  // Interaction / waiting (4)
  | InputRequiredEvent
  | ApprovalRequestEvent
  | ApprovalGrantedEvent
  | ApprovalDeniedEvent
  // Rate / context limits (4)
  | RateLimitedEvent
  | ContextLimitWarningEvent
  | ContextCompactedEvent
  | RetryEvent
  // Run lifecycle / control (7)
  | InterruptedEvent
  | AbortedEvent
  | PausedEvent
  | ResumedEvent
  | TimeoutEvent
  | TurnLimitEvent
  | StreamFallbackEvent
  // Errors (5)
  | AuthErrorEvent
  | RateLimitErrorEvent
  | ContextExceededEvent
  | CrashEvent
  | ErrorEvent
  // Debug (2)
  | DebugEvent
  | LogEvent;

// ---------------------------------------------------------------------------
// Helper type aliases
// ---------------------------------------------------------------------------

/** Extract the event type for a given discriminant string. */
export type EventOfType<T extends AgentEvent['type']> = Extract<AgentEvent, { type: T }>;

/** All valid event type discriminant strings. */
export type AgentEventType = AgentEvent['type'];

/** Handler function type for a given event type. */
export type AgentEventHandler<T extends AgentEventType> = (event: EventOfType<T>) => void;

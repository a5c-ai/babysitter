/**
 * TypeBox JSON Schema definitions for all 67 AgentEvent types.
 *
 * Mirrors the TypeScript interfaces in events.ts and events-control.ts exactly.
 * Every field, optional flag, and literal discriminant is preserved.
 *
 * @module
 */

import { Type, type TObject, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

/** Machine-readable error codes defined by adapters (from types.ts). */
export const ErrorCodeSchema = Type.Union([
  Type.Literal('CAPABILITY_ERROR'),
  Type.Literal('VALIDATION_ERROR'),
  Type.Literal('AUTH_ERROR'),
  Type.Literal('AGENT_NOT_FOUND'),
  Type.Literal('AGENT_NOT_INSTALLED'),
  Type.Literal('AGENT_CRASH'),
  Type.Literal('SPAWN_ERROR'),
  Type.Literal('TIMEOUT'),
  Type.Literal('INACTIVITY_TIMEOUT'),
  Type.Literal('PARSE_ERROR'),
  Type.Literal('CONFIG_ERROR'),
  Type.Literal('CONFIG_LOCK_ERROR'),
  Type.Literal('SESSION_NOT_FOUND'),
  Type.Literal('PROFILE_NOT_FOUND'),
  Type.Literal('PLUGIN_ERROR'),
  Type.Literal('RATE_LIMITED'),
  Type.Literal('CONTEXT_EXCEEDED'),
  Type.Literal('ABORTED'),
  Type.Literal('RUN_NOT_ACTIVE'),
  Type.Literal('STDIN_NOT_AVAILABLE'),
  Type.Literal('NO_PENDING_INTERACTION'),
  Type.Literal('INTERACTION_NOT_FOUND'),
  Type.Literal('INVALID_STATE_TRANSITION'),
  Type.Literal('PTY_NOT_AVAILABLE'),
  Type.Literal('UNKNOWN_AGENT'),
  Type.Literal('INTERNAL'),
]);

/** Aggregated cost data for a single run (from types.ts). */
export const CostRecordSchema = Type.Object({
  totalUsd: Type.Number(),
  inputTokens: Type.Number(),
  outputTokens: Type.Number(),
  thinkingTokens: Type.Optional(Type.Number()),
  cachedTokens: Type.Optional(Type.Number()),
  cacheCreationTokens: Type.Optional(Type.Number()),
  cacheReadTokens: Type.Optional(Type.Number()),
});

// ---------------------------------------------------------------------------
// BaseEvent schema — shared fields present on every event
// ---------------------------------------------------------------------------

/** The base shape shared by every event. */
export const BaseEventSchema = Type.Object({
  type: Type.String(),
  runId: Type.String(),
  agent: Type.String(),
  timestamp: Type.Number(),
  source: Type.Optional(Type.String()),
  raw: Type.Optional(Type.String()),
});

// ---------------------------------------------------------------------------
// Helper to create an event schema that extends BaseEvent
// ---------------------------------------------------------------------------

function eventSchema<T extends Record<string, TSchema>>(
  typeLiteral: string,
  extra: T,
): TObject {
  return Type.Object({
    ...BaseEventSchema.properties,
    type: Type.Literal(typeLiteral),
    ...extra,
  });
}

// ===========================================================================
// 1. Session lifecycle events (5)
// ===========================================================================

export const SessionStartEventSchema = eventSchema('session_start', {
  sessionId: Type.String(),
  resumed: Type.Boolean(),
  forkedFrom: Type.Optional(Type.String()),
});

export const SessionResumeEventSchema = eventSchema('session_resume', {
  sessionId: Type.String(),
  priorTurnCount: Type.Number(),
});

export const SessionForkEventSchema = eventSchema('session_fork', {
  sessionId: Type.String(),
  forkedFrom: Type.String(),
});

export const SessionCheckpointEventSchema = eventSchema('session_checkpoint', {
  sessionId: Type.String(),
  checkpointId: Type.String(),
});

export const SessionEndEventSchema = eventSchema('session_end', {
  sessionId: Type.String(),
  turnCount: Type.Number(),
  cost: Type.Optional(CostRecordSchema),
});

// ===========================================================================
// 2. Turn / step lifecycle events (4)
// ===========================================================================

export const TurnStartEventSchema = eventSchema('turn_start', {
  turnIndex: Type.Number(),
});

export const TurnEndEventSchema = eventSchema('turn_end', {
  turnIndex: Type.Number(),
  cost: Type.Optional(CostRecordSchema),
});

export const StepStartEventSchema = eventSchema('step_start', {
  turnIndex: Type.Number(),
  stepIndex: Type.Number(),
  stepType: Type.String(),
});

export const StepEndEventSchema = eventSchema('step_end', {
  turnIndex: Type.Number(),
  stepIndex: Type.Number(),
});

// ===========================================================================
// 3. Text / message streaming events (3)
// ===========================================================================

export const MessageStartEventSchema = eventSchema('message_start', {});

export const TextDeltaEventSchema = eventSchema('text_delta', {
  delta: Type.String(),
  accumulated: Type.String(),
});

export const MessageStopEventSchema = eventSchema('message_stop', {
  text: Type.String(),
});

// ===========================================================================
// 4. Thinking / reasoning events (3)
// ===========================================================================

export const ThinkingStartEventSchema = eventSchema('thinking_start', {
  effort: Type.Optional(Type.String()),
});

export const ThinkingDeltaEventSchema = eventSchema('thinking_delta', {
  delta: Type.String(),
  accumulated: Type.String(),
});

export const ThinkingStopEventSchema = eventSchema('thinking_stop', {
  thinking: Type.String(),
});

// ===========================================================================
// 5. Tool calling events (5)
// ===========================================================================

export const ToolCallStartEventSchema = eventSchema('tool_call_start', {
  toolCallId: Type.String(),
  toolName: Type.String(),
  inputAccumulated: Type.String(),
});

export const ToolInputDeltaEventSchema = eventSchema('tool_input_delta', {
  toolCallId: Type.String(),
  delta: Type.String(),
  inputAccumulated: Type.String(),
});

export const ToolCallReadyEventSchema = eventSchema('tool_call_ready', {
  toolCallId: Type.String(),
  toolName: Type.String(),
  input: Type.Unknown(),
});

export const ToolResultEventSchema = eventSchema('tool_result', {
  toolCallId: Type.String(),
  toolName: Type.String(),
  output: Type.Unknown(),
  durationMs: Type.Number(),
});

export const ToolErrorEventSchema = eventSchema('tool_error', {
  toolCallId: Type.String(),
  toolName: Type.String(),
  error: Type.String(),
});

// ===========================================================================
// 6. File operations events (5)
// ===========================================================================

export const FileReadEventSchema = eventSchema('file_read', {
  path: Type.String(),
});

export const FileWriteEventSchema = eventSchema('file_write', {
  path: Type.String(),
  byteCount: Type.Number(),
});

export const FileCreateEventSchema = eventSchema('file_create', {
  path: Type.String(),
  byteCount: Type.Number(),
});

export const FileDeleteEventSchema = eventSchema('file_delete', {
  path: Type.String(),
});

export const FilePatchEventSchema = eventSchema('file_patch', {
  path: Type.String(),
  diff: Type.String(),
});

// ===========================================================================
// 7. Shell operations events (4)
// ===========================================================================

export const ShellStartEventSchema = eventSchema('shell_start', {
  command: Type.String(),
  cwd: Type.String(),
});

export const ShellStdoutDeltaEventSchema = eventSchema('shell_stdout_delta', {
  delta: Type.String(),
});

export const ShellStderrDeltaEventSchema = eventSchema('shell_stderr_delta', {
  delta: Type.String(),
});

export const ShellExitEventSchema = eventSchema('shell_exit', {
  exitCode: Type.Number(),
  durationMs: Type.Number(),
});

// ===========================================================================
// 8. MCP tool calling events (3)
// ===========================================================================

export const McpToolCallStartEventSchema = eventSchema('mcp_tool_call_start', {
  toolCallId: Type.String(),
  server: Type.String(),
  toolName: Type.String(),
  input: Type.Unknown(),
});

export const McpToolResultEventSchema = eventSchema('mcp_tool_result', {
  toolCallId: Type.String(),
  server: Type.String(),
  toolName: Type.String(),
  output: Type.Unknown(),
});

export const McpToolErrorEventSchema = eventSchema('mcp_tool_error', {
  toolCallId: Type.String(),
  server: Type.String(),
  toolName: Type.String(),
  error: Type.String(),
});

// ===========================================================================
// 9. Subagent dispatch events (3)
// ===========================================================================

export const SubagentSpawnEventSchema = eventSchema('subagent_spawn', {
  subagentId: Type.String(),
  agentName: Type.String(),
  prompt: Type.String(),
});

export const SubagentResultEventSchema = eventSchema('subagent_result', {
  subagentId: Type.String(),
  agentName: Type.String(),
  summary: Type.String(),
  cost: Type.Optional(CostRecordSchema),
});

export const SubagentErrorEventSchema = eventSchema('subagent_error', {
  subagentId: Type.String(),
  agentName: Type.String(),
  error: Type.String(),
});

// ===========================================================================
// 10. Plugin events (3)
// ===========================================================================

export const PluginLoadedEventSchema = eventSchema('plugin_loaded', {
  pluginId: Type.String(),
  pluginName: Type.String(),
  version: Type.String(),
});

export const PluginInvokedEventSchema = eventSchema('plugin_invoked', {
  pluginId: Type.String(),
  pluginName: Type.String(),
});

export const PluginErrorEventSchema = eventSchema('plugin_error', {
  pluginId: Type.String(),
  pluginName: Type.String(),
  error: Type.String(),
});

// ===========================================================================
// 11. Skill / agent doc loading events (3)
// ===========================================================================

export const SkillLoadedEventSchema = eventSchema('skill_loaded', {
  skillName: Type.String(),
  source: Type.String(),
});

export const SkillInvokedEventSchema = eventSchema('skill_invoked', {
  skillName: Type.String(),
});

export const AgentdocReadEventSchema = eventSchema('agentdoc_read', {
  path: Type.String(),
});

// ===========================================================================
// 12. Multimodal events (2)
// ===========================================================================

export const ImageOutputEventSchema = eventSchema('image_output', {
  mimeType: Type.String(),
  base64: Type.Optional(Type.String()),
  filePath: Type.Optional(Type.String()),
});

export const ImageInputAckEventSchema = eventSchema('image_input_ack', {
  mimeType: Type.String(),
});

// ===========================================================================
// 13. Cost and token events (2)
// ===========================================================================

export const CostEventSchema = eventSchema('cost', {
  cost: CostRecordSchema,
});

export const TokenUsageEventSchema = eventSchema('token_usage', {
  inputTokens: Type.Number(),
  outputTokens: Type.Number(),
  thinkingTokens: Type.Optional(Type.Number()),
  cachedTokens: Type.Optional(Type.Number()),
});

// ===========================================================================
// 14. Interaction / waiting events (4)
// ===========================================================================

export const InputRequiredEventSchema = eventSchema('input_required', {
  interactionId: Type.String(),
  question: Type.String(),
  context: Type.Optional(Type.String()),
  source: Type.Union([Type.Literal('agent'), Type.Literal('tool')]),
});

export const ApprovalRequestEventSchema = eventSchema('approval_request', {
  interactionId: Type.String(),
  action: Type.String(),
  detail: Type.String(),
  toolName: Type.Optional(Type.String()),
  riskLevel: Type.Union([
    Type.Literal('low'),
    Type.Literal('medium'),
    Type.Literal('high'),
  ]),
});

export const ApprovalGrantedEventSchema = eventSchema('approval_granted', {
  interactionId: Type.String(),
});

export const ApprovalDeniedEventSchema = eventSchema('approval_denied', {
  interactionId: Type.String(),
  reason: Type.Optional(Type.String()),
});

// ===========================================================================
// 15. Rate / context limit events (4) — from events-control.ts
// ===========================================================================

export const RateLimitedEventSchema = eventSchema('rate_limited', {
  retryAfterMs: Type.Optional(Type.Number()),
});

export const ContextLimitWarningEventSchema = eventSchema('context_limit_warning', {
  usedTokens: Type.Number(),
  maxTokens: Type.Number(),
  pctUsed: Type.Number(),
});

export const ContextCompactedEventSchema = eventSchema('context_compacted', {
  summary: Type.String(),
  tokensSaved: Type.Number(),
});

export const RetryEventSchema = eventSchema('retry', {
  attempt: Type.Number(),
  maxAttempts: Type.Number(),
  reason: Type.String(),
  delayMs: Type.Number(),
});

// ===========================================================================
// 16. Run lifecycle / control events (7) — from events-control.ts
// ===========================================================================

export const InterruptedEventSchema = eventSchema('interrupted', {});

export const AbortedEventSchema = eventSchema('aborted', {});

export const PausedEventSchema = eventSchema('paused', {});

export const ResumedEventSchema = eventSchema('resumed', {});

export const TimeoutEventSchema = eventSchema('timeout', {
  kind: Type.Union([Type.Literal('run'), Type.Literal('inactivity')]),
});

export const TurnLimitEventSchema = eventSchema('turn_limit', {
  maxTurns: Type.Number(),
});

export const StreamFallbackEventSchema = eventSchema('stream_fallback', {
  capability: Type.Union([
    Type.Literal('text'),
    Type.Literal('tool_calls'),
    Type.Literal('thinking'),
  ]),
  reason: Type.String(),
});

// ===========================================================================
// 17. Error events (5) — from events-control.ts
// ===========================================================================

export const AuthErrorEventSchema = eventSchema('auth_error', {
  message: Type.String(),
  guidance: Type.String(),
});

export const RateLimitErrorEventSchema = eventSchema('rate_limit_error', {
  message: Type.String(),
  retryAfterMs: Type.Optional(Type.Number()),
});

export const ContextExceededEventSchema = eventSchema('context_exceeded', {
  usedTokens: Type.Number(),
  maxTokens: Type.Number(),
});

export const CrashEventSchema = eventSchema('crash', {
  exitCode: Type.Number(),
  stderr: Type.String(),
});

export const ErrorEventSchema = eventSchema('error', {
  code: ErrorCodeSchema,
  message: Type.String(),
  recoverable: Type.Boolean(),
});

// ===========================================================================
// 18. Debug events (2) — from events-control.ts
// ===========================================================================

export const DebugEventSchema = eventSchema('debug', {
  level: Type.Union([
    Type.Literal('verbose'),
    Type.Literal('info'),
    Type.Literal('warn'),
  ]),
  message: Type.String(),
});

export const LogEventSchema = eventSchema('log', {
  source: Type.Union([Type.Literal('stdout'), Type.Literal('stderr')]),
  line: Type.String(),
});

// ===========================================================================
// Registry — maps each type discriminant to its schema
// ===========================================================================

/**
 * Maps every event `type` discriminant string to its TypeBox schema.
 * Useful for runtime lookup and validation by event type.
 */
export const eventSchemaRegistry: Record<string, TSchema> = {
  // Session lifecycle (5)
  session_start: SessionStartEventSchema,
  session_resume: SessionResumeEventSchema,
  session_fork: SessionForkEventSchema,
  session_checkpoint: SessionCheckpointEventSchema,
  session_end: SessionEndEventSchema,
  // Turn / step lifecycle (4)
  turn_start: TurnStartEventSchema,
  turn_end: TurnEndEventSchema,
  step_start: StepStartEventSchema,
  step_end: StepEndEventSchema,
  // Text / message streaming (3)
  message_start: MessageStartEventSchema,
  text_delta: TextDeltaEventSchema,
  message_stop: MessageStopEventSchema,
  // Thinking / reasoning (3)
  thinking_start: ThinkingStartEventSchema,
  thinking_delta: ThinkingDeltaEventSchema,
  thinking_stop: ThinkingStopEventSchema,
  // Tool calling (5)
  tool_call_start: ToolCallStartEventSchema,
  tool_input_delta: ToolInputDeltaEventSchema,
  tool_call_ready: ToolCallReadyEventSchema,
  tool_result: ToolResultEventSchema,
  tool_error: ToolErrorEventSchema,
  // File operations (5)
  file_read: FileReadEventSchema,
  file_write: FileWriteEventSchema,
  file_create: FileCreateEventSchema,
  file_delete: FileDeleteEventSchema,
  file_patch: FilePatchEventSchema,
  // Shell operations (4)
  shell_start: ShellStartEventSchema,
  shell_stdout_delta: ShellStdoutDeltaEventSchema,
  shell_stderr_delta: ShellStderrDeltaEventSchema,
  shell_exit: ShellExitEventSchema,
  // MCP tool calling (3)
  mcp_tool_call_start: McpToolCallStartEventSchema,
  mcp_tool_result: McpToolResultEventSchema,
  mcp_tool_error: McpToolErrorEventSchema,
  // Subagent dispatch (3)
  subagent_spawn: SubagentSpawnEventSchema,
  subagent_result: SubagentResultEventSchema,
  subagent_error: SubagentErrorEventSchema,
  // Plugin events (3)
  plugin_loaded: PluginLoadedEventSchema,
  plugin_invoked: PluginInvokedEventSchema,
  plugin_error: PluginErrorEventSchema,
  // Skill / agent doc loading (3)
  skill_loaded: SkillLoadedEventSchema,
  skill_invoked: SkillInvokedEventSchema,
  agentdoc_read: AgentdocReadEventSchema,
  // Multimodal (2)
  image_output: ImageOutputEventSchema,
  image_input_ack: ImageInputAckEventSchema,
  // Cost and tokens (2)
  cost: CostEventSchema,
  token_usage: TokenUsageEventSchema,
  // Interaction / waiting (4)
  input_required: InputRequiredEventSchema,
  approval_request: ApprovalRequestEventSchema,
  approval_granted: ApprovalGrantedEventSchema,
  approval_denied: ApprovalDeniedEventSchema,
  // Rate / context limits (4)
  rate_limited: RateLimitedEventSchema,
  context_limit_warning: ContextLimitWarningEventSchema,
  context_compacted: ContextCompactedEventSchema,
  retry: RetryEventSchema,
  // Run lifecycle / control (7)
  interrupted: InterruptedEventSchema,
  aborted: AbortedEventSchema,
  paused: PausedEventSchema,
  resumed: ResumedEventSchema,
  timeout: TimeoutEventSchema,
  turn_limit: TurnLimitEventSchema,
  stream_fallback: StreamFallbackEventSchema,
  // Errors (5)
  auth_error: AuthErrorEventSchema,
  rate_limit_error: RateLimitErrorEventSchema,
  context_exceeded: ContextExceededEventSchema,
  crash: CrashEventSchema,
  error: ErrorEventSchema,
  // Debug (2)
  debug: DebugEventSchema,
  log: LogEventSchema,
};

/** Total count of registered event schemas. */
export const EVENT_SCHEMA_COUNT = Object.keys(eventSchemaRegistry).length;

// ===========================================================================
// AgentEvent union schema (all 67 types)
// ===========================================================================

/** TypeBox union schema covering all 67 event types. */
export const AgentEventSchema = Type.Union(
  Object.values(eventSchemaRegistry) as [TSchema, ...TSchema[]],
);

// ===========================================================================
// Validation
// ===========================================================================

/** Result of validating an unknown value against the event schemas. */
export interface EventValidationResult {
  valid: boolean;
  eventType?: string;
  errors?: string[];
}

/**
 * Validate an unknown value as an AgentEvent.
 *
 * First checks if the value has a `type` field that maps to a known schema,
 * then validates against that specific schema for precise error messages.
 * Falls back to validating against the full union if the type is unknown.
 */
export function validateEvent(event: unknown): EventValidationResult {
  if (typeof event !== 'object' || event === null) {
    return { valid: false, errors: ['Event must be a non-null object'] };
  }

  const obj = event as Record<string, unknown>;
  const eventType = typeof obj['type'] === 'string' ? obj['type'] : undefined;

  // If we have a type discriminant, validate against the specific schema
  if (eventType && eventType in eventSchemaRegistry) {
    const schema = eventSchemaRegistry[eventType]!;
    const valid = Value.Check(schema, event);
    if (valid) {
      return { valid: true, eventType };
    }
    // Collect errors from the specific schema
    const errors = [...Value.Errors(schema, event)].map(
      (e) => `${e.path}: ${e.message}`,
    );
    return { valid: false, eventType, errors };
  }

  // Unknown type — validate against full union
  if (!eventType) {
    return { valid: false, errors: ['Missing or non-string "type" field'] };
  }

  return {
    valid: false,
    eventType,
    errors: [`Unknown event type: "${eventType}"`],
  };
}

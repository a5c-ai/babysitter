/**
 * Schema barrel — TypeBox JSON Schema definitions for all AgentEvent types.
 *
 * @module
 */

export {
  // Sub-schemas
  ErrorCodeSchema,
  CostRecordSchema,
  BaseEventSchema,

  // Session lifecycle (5)
  SessionStartEventSchema,
  SessionResumeEventSchema,
  SessionForkEventSchema,
  SessionCheckpointEventSchema,
  SessionEndEventSchema,

  // Turn / step lifecycle (4)
  TurnStartEventSchema,
  TurnEndEventSchema,
  StepStartEventSchema,
  StepEndEventSchema,

  // Text / message streaming (3)
  MessageStartEventSchema,
  TextDeltaEventSchema,
  MessageStopEventSchema,

  // Thinking / reasoning (3)
  ThinkingStartEventSchema,
  ThinkingDeltaEventSchema,
  ThinkingStopEventSchema,

  // Tool calling (5)
  ToolCallStartEventSchema,
  ToolInputDeltaEventSchema,
  ToolCallReadyEventSchema,
  ToolResultEventSchema,
  ToolErrorEventSchema,

  // File operations (5)
  FileReadEventSchema,
  FileWriteEventSchema,
  FileCreateEventSchema,
  FileDeleteEventSchema,
  FilePatchEventSchema,

  // Shell operations (4)
  ShellStartEventSchema,
  ShellStdoutDeltaEventSchema,
  ShellStderrDeltaEventSchema,
  ShellExitEventSchema,

  // MCP tool calling (3)
  McpToolCallStartEventSchema,
  McpToolResultEventSchema,
  McpToolErrorEventSchema,

  // Subagent dispatch (3)
  SubagentSpawnEventSchema,
  SubagentResultEventSchema,
  SubagentErrorEventSchema,

  // Plugin events (3)
  PluginLoadedEventSchema,
  PluginInvokedEventSchema,
  PluginErrorEventSchema,

  // Skill / agent doc loading (3)
  SkillLoadedEventSchema,
  SkillInvokedEventSchema,
  AgentdocReadEventSchema,

  // Multimodal (2)
  ImageOutputEventSchema,
  ImageInputAckEventSchema,

  // Cost and tokens (2)
  CostEventSchema,
  TokenUsageEventSchema,

  // Interaction / waiting (4)
  InputRequiredEventSchema,
  ApprovalRequestEventSchema,
  ApprovalGrantedEventSchema,
  ApprovalDeniedEventSchema,

  // Rate / context limits (4)
  RateLimitedEventSchema,
  ContextLimitWarningEventSchema,
  ContextCompactedEventSchema,
  RetryEventSchema,

  // Run lifecycle / control (7)
  InterruptedEventSchema,
  AbortedEventSchema,
  PausedEventSchema,
  ResumedEventSchema,
  TimeoutEventSchema,
  TurnLimitEventSchema,
  StreamFallbackEventSchema,

  // Errors (5)
  AuthErrorEventSchema,
  RateLimitErrorEventSchema,
  ContextExceededEventSchema,
  CrashEventSchema,
  ErrorEventSchema,

  // Debug (2)
  DebugEventSchema,
  LogEventSchema,

  // Registry, union, count
  eventSchemaRegistry,
  EVENT_SCHEMA_COUNT,
  AgentEventSchema,

  // Validation
  validateEvent,
} from './event-schema.js';

export type { EventValidationResult } from './event-schema.js';

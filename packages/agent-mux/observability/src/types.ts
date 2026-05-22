/**
 * Common types and interfaces for agent-mux observability.
 */

/**
 * Log levels supported by the system.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Cost information structure for tracking LLM usage.
 */
export interface CostInfo {
  totalUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
}

/**
 * Contextual information that can be attached to log entries.
 */
export interface LogContext {
  /** Run ID for correlating logs across a single run */
  runId?: string;
  /** Agent name being used */
  agent?: string;
  /** Session ID for multi-turn conversations */
  sessionId?: string;
  /** Model being used */
  model?: string;
  /** User ID or identifier */
  userId?: string;
  /** Request/operation ID for tracing */
  operationId?: string;
  /** Component or module name */
  component?: string;
  /** Duration in milliseconds for performance tracking */
  duration?: number;
  /** Cost information */
  cost?: CostInfo;
  /** Error information */
  error?: {
    code?: string;
    message?: string;
    stack?: string;
    recoverable?: boolean;
    name?: string;
  };
  /** Additional arbitrary metadata */
  [key: string]: unknown;
}

/**
 * Logger interface for agent-mux.
 */
export interface Logger {
  level: string;
  trace(msg: string): void;
  trace(obj: object, msg?: string): void;
  debug(msg: string): void;
  debug(obj: object, msg?: string): void;
  info(msg: string): void;
  info(obj: object, msg?: string): void;
  warn(msg: string): void;
  warn(obj: object, msg?: string): void;
  error(msg: string): void;
  error(obj: object, msg?: string): void;
  fatal(msg: string): void;
  fatal(obj: object, msg?: string): void;

  /** Create a child logger with additional context */
  child(bindings: LogContext): Logger;

  /** Log agent run start */
  runStart(context: { runId: string; agent: string; prompt: string; model?: string }): void;

  /** Log agent run completion */
  runComplete(context: { runId: string; agent: string; duration: number; cost?: CostInfo }): void;

  /** Log agent run error */
  runError(context: { runId: string; agent: string; error: Error | LogContext['error'] }): void;

  /** Log tool call start */
  toolCallStart(context: { runId: string; toolName: string; toolCallId: string; args?: unknown }): void;

  /** Log tool call completion */
  toolCallComplete(context: { runId: string; toolName: string; toolCallId: string; duration: number; result?: unknown }): void;

  /** Log session events */
  session(message: string, context: LogContext & { action?: 'create' | 'resume' | 'fork' | 'end' }): void;

  // Optional/Extended methods for full implementation
  perf?(message: string, context: LogContext & { duration: number }): void;
  auth?(message: string, context: LogContext & { method?: string; success?: boolean }): void;
  config?(message: string, context: LogContext): void;
}

/**
 * Telemetry interface for agent-mux.
 */
export interface Telemetry {
  /** Record agent run start */
  recordRunStart(agent: string, model?: string): void;

  /** Record agent run completion */
  recordRunComplete(agent: string, model: string | undefined, duration: number, cost?: CostInfo): void;

  /** Record agent run error */
  recordRunError(agent: string, model: string | undefined, error: Error | string, cost?: CostInfo): void;

  /** Record tool call */
  recordToolCall(toolName: string, duration: number, success: boolean): void;

  /** Record authentication event */
  recordAuthEvent(agent: string, method: string, success: boolean): void;

  /** Start tracing an agent run */
  startRunSpan(runId: string, agent: string, model?: string): any;

  /** Start tracing a tool call */
  startToolCallSpan(toolName: string, toolCallId: string, parentSpan?: any): any;

  /** Start tracing a subagent delegation */
  startSubagentSpan(subagentId: string, agentName: string, parentSpan?: any): any;

  /** End a span with success */
  endSpanSuccess(span: any, attributes?: Record<string, string | number | boolean>): void;

  /** End a span with error */
  endSpanError(span: any, error: Error | string, attributes?: Record<string, string | number | boolean>): void;

  /** Initialize telemetry */
  initialize?(): void;

  /** Shutdown telemetry */
  shutdown?(): Promise<void>;

  /** Set active runs gauge */
  setActiveRuns?(count: number): void;
}

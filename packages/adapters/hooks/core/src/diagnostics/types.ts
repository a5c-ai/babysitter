/**
 * Types for the structured diagnostics and logging module.
 *
 * Spec section 23: Observability Requirements.
 */

/**
 * Quality indicator for how the session ID was resolved.
 */
export type SessionIdQuality = 'native' | 'derived' | 'synthetic' | 'none';

/**
 * A structured log entry emitted during hook execution.
 * All fields per spec section 23.
 */
export interface DiagnosticEntry {
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Log severity. */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Short message describing the event. */
  message: string;
  /** Adapter name (e.g. 'claude', 'codex'). */
  adapter: string;
  /** Canonical lifecycle phase (e.g. 'session.start', 'tool.before'). */
  canonicalPhase: string;
  /** The harness-native event name before normalization. */
  nativeEventName: string;
  /** How the session ID was resolved. */
  sessionIdQuality: SessionIdQuality;
  /** Session ID (if available). */
  sessionId?: string;
  /** Ordered list of handler IDs that executed. */
  handlerIds: string[];
  /** Summary of merge decisions applied. */
  mergeDecisions: MergeDecisionSummary[];
  /** Output fields that were degraded during rendering. */
  outputDegradationFlags: string[];
  /** Additional structured data. */
  extra?: Record<string, unknown>;
}

/**
 * Summary of a single merge decision for diagnostic purposes.
 */
export interface MergeDecisionSummary {
  /** The field where merging occurred. */
  field: string;
  /** How it was resolved. */
  resolution: string;
  /** Whether data was lost. */
  lossy: boolean;
}

/**
 * Options for creating a DiagnosticLogger.
 */
export interface DiagnosticLoggerOptions {
  /** Minimum log level to emit. Defaults to 'info'. */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Writable stream for output. Defaults to process.stderr. */
  output?: NodeJS.WritableStream;
  /** Whether to emit JSON (true) or human-readable (false). Defaults to true. */
  json?: boolean;
}

/**
 * Options for the JSONL trace writer.
 */
export interface TraceWriterOptions {
  /** Path to the JSONL trace file. */
  filePath: string;
  /** Whether to append to existing file or overwrite. Defaults to true (append). */
  append?: boolean;
}

/**
 * A complete execution trace record written to the JSONL trace file.
 */
export interface TraceRecord {
  /** Trace record version. */
  version: 'a5c.hooks.trace.v1';
  /** Unique trace ID for this invocation. */
  traceId: string;
  /** ISO-8601 start timestamp. */
  startedAt: string;
  /** ISO-8601 end timestamp. */
  completedAt: string;
  /** Duration in milliseconds. */
  durationMs: number;
  /** Adapter name. */
  adapter: string;
  /** Canonical phase. */
  phase: string;
  /** Native event name. */
  nativeEventName: string;
  /** Session ID quality. */
  sessionIdQuality: SessionIdQuality;
  /** Session ID. */
  sessionId?: string;
  /** Handler execution results. */
  handlers: TraceHandlerRecord[];
  /** Final merged decision. */
  mergedDecision: string;
  /** Whether any output was degraded. */
  degraded: boolean;
  /** Errors encountered. */
  errors: string[];
}

/**
 * Per-handler trace record.
 */
export interface TraceHandlerRecord {
  /** Handler ID. */
  id: string;
  /** Plugin ID. */
  pluginId: string;
  /** Duration in milliseconds. */
  durationMs: number;
  /** Whether the handler succeeded. */
  success: boolean;
  /** Error message if failed. */
  error?: string;
  /** Decision produced by this handler. */
  decision?: string;
}

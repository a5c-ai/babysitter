/**
 * Structured diagnostic logger for hooks-mux execution.
 *
 * Outputs to stderr with structured fields per spec section 23:
 * adapter, canonical phase, native event name, session ID quality,
 * handler IDs executed, merge decisions, output degradation flags.
 */

import type {
  DiagnosticEntry,
  DiagnosticLoggerOptions,
  MergeDecisionSummary,
  SessionIdQuality,
} from './types';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Structured logger that emits diagnostics to stderr (or a custom stream).
 *
 * Separates diagnostic output (stderr) from hook output (stdout) per
 * the security requirement in spec section 22.
 */
export class DiagnosticLogger {
  private readonly minLevel: number;
  private readonly output: NodeJS.WritableStream;
  private readonly json: boolean;

  // Contextual fields set once and reused across log calls within one invocation.
  private adapter = '';
  private canonicalPhase = '';
  private nativeEventName = '';
  private sessionIdQuality: SessionIdQuality = 'none';
  private sessionId: string | undefined;
  private handlerIds: string[] = [];
  private mergeDecisions: MergeDecisionSummary[] = [];
  private outputDegradationFlags: string[] = [];

  constructor(options?: DiagnosticLoggerOptions) {
    this.minLevel = LOG_LEVELS[options?.level ?? 'info'];
    this.output = options?.output ?? process.stderr;
    this.json = options?.json ?? true;
  }

  /**
   * Set the adapter context for subsequent log entries.
   */
  setAdapter(adapter: string): void {
    this.adapter = adapter;
  }

  /**
   * Set the phase context for subsequent log entries.
   */
  setPhase(canonicalPhase: string, nativeEventName: string): void {
    this.canonicalPhase = canonicalPhase;
    this.nativeEventName = nativeEventName;
  }

  /**
   * Set session context for subsequent log entries.
   */
  setSession(sessionId: string | undefined, quality: SessionIdQuality): void {
    this.sessionId = sessionId;
    this.sessionIdQuality = quality;
  }

  /**
   * Record the handler IDs that were executed.
   */
  setHandlerIds(ids: string[]): void {
    this.handlerIds = ids;
  }

  /**
   * Record merge decisions from the fan-out merge phase.
   */
  setMergeDecisions(decisions: MergeDecisionSummary[]): void {
    this.mergeDecisions = decisions;
  }

  /**
   * Record output degradation flags.
   */
  setOutputDegradationFlags(flags: string[]): void {
    this.outputDegradationFlags = flags;
  }

  /**
   * Emit a debug-level diagnostic.
   */
  debug(message: string, extra?: Record<string, unknown>): void {
    this.emit('debug', message, extra);
  }

  /**
   * Emit an info-level diagnostic.
   */
  info(message: string, extra?: Record<string, unknown>): void {
    this.emit('info', message, extra);
  }

  /**
   * Emit a warn-level diagnostic.
   */
  warn(message: string, extra?: Record<string, unknown>): void {
    this.emit('warn', message, extra);
  }

  /**
   * Emit an error-level diagnostic.
   */
  error(message: string, extra?: Record<string, unknown>): void {
    this.emit('error', message, extra);
  }

  /**
   * Build and return a DiagnosticEntry without emitting it.
   * Useful for testing or collecting entries.
   */
  buildEntry(level: LogLevel, message: string, extra?: Record<string, unknown>): DiagnosticEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      adapter: this.adapter,
      canonicalPhase: this.canonicalPhase,
      nativeEventName: this.nativeEventName,
      sessionIdQuality: this.sessionIdQuality,
      sessionId: this.sessionId,
      handlerIds: [...this.handlerIds],
      mergeDecisions: [...this.mergeDecisions],
      outputDegradationFlags: [...this.outputDegradationFlags],
      extra,
    };
  }

  private emit(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < this.minLevel) return;

    const entry = this.buildEntry(level, message, extra);

    if (this.json) {
      this.output.write(JSON.stringify(entry) + '\n');
    } else {
      this.output.write(this.formatHuman(entry) + '\n');
    }
  }

  private formatHuman(entry: DiagnosticEntry): string {
    const parts: string[] = [
      `[${entry.level.toUpperCase()}]`,
      `[${entry.adapter || '-'}]`,
      `[${entry.canonicalPhase || '-'}]`,
      entry.message,
    ];

    if (entry.sessionId) {
      parts.push(`session=${entry.sessionId}`);
    }
    if (entry.handlerIds.length > 0) {
      parts.push(`handlers=[${entry.handlerIds.join(',')}]`);
    }
    if (entry.outputDegradationFlags.length > 0) {
      parts.push(`degraded=[${entry.outputDegradationFlags.join(',')}]`);
    }

    return parts.join(' ');
  }
}

/**
 * Create a DiagnosticLogger with default settings.
 * Intended for use by the invoke pipeline.
 */
export function createDiagnosticLogger(options?: DiagnosticLoggerOptions): DiagnosticLogger {
  return new DiagnosticLogger(options);
}

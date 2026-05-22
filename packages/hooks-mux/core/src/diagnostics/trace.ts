/**
 * Optional JSONL trace file support for debugging.
 *
 * Spec section 23 (optional future support: JSONL trace files).
 *
 * When enabled, writes one JSON line per hook invocation to a trace file.
 * Useful for post-hoc debugging of hook execution sequences.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TraceRecord, TraceWriterOptions, TraceHandlerRecord, SessionIdQuality } from './types';

/**
 * Writer that appends JSONL trace records to a file.
 */
export class TraceWriter {
  private readonly filePath: string;
  private readonly append: boolean;
  private initialized = false;

  constructor(options: TraceWriterOptions) {
    this.filePath = options.filePath;
    this.append = options.append ?? true;
  }

  /**
   * Ensure the trace directory exists and the file is ready for writing.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
    if (!this.append) {
      // Truncate if not appending
      await fs.promises.writeFile(this.filePath, '', 'utf-8');
    }
    this.initialized = true;
  }

  /**
   * Write a trace record as a single JSONL line.
   */
  async writeRecord(record: TraceRecord): Promise<void> {
    await this.ensureInitialized();
    const line = JSON.stringify(record) + '\n';
    await fs.promises.appendFile(this.filePath, line, 'utf-8');
  }

  /**
   * Get the trace file path.
   */
  getFilePath(): string {
    return this.filePath;
  }
}

/**
 * Create a trace writer. Returns null if no trace file path is configured.
 */
export function createTraceWriter(options?: TraceWriterOptions | null): TraceWriter | null {
  if (!options) return null;
  return new TraceWriter(options);
}

/**
 * Generate a simple trace ID for this invocation.
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `trace_${timestamp}_${random}`;
}

/**
 * Build a complete TraceRecord from invocation data.
 */
export function buildTraceRecord(params: {
  traceId: string;
  startedAt: string;
  completedAt: string;
  adapter: string;
  phase: string;
  nativeEventName: string;
  sessionIdQuality: SessionIdQuality;
  sessionId?: string;
  handlers: TraceHandlerRecord[];
  mergedDecision: string;
  degraded: boolean;
  errors: string[];
}): TraceRecord {
  const startMs = new Date(params.startedAt).getTime();
  const endMs = new Date(params.completedAt).getTime();

  return {
    version: 'a5c.hooks.trace.v1',
    traceId: params.traceId,
    startedAt: params.startedAt,
    completedAt: params.completedAt,
    durationMs: endMs - startMs,
    adapter: params.adapter,
    phase: params.phase,
    nativeEventName: params.nativeEventName,
    sessionIdQuality: params.sessionIdQuality,
    sessionId: params.sessionId,
    handlers: params.handlers,
    mergedDecision: params.mergedDecision,
    degraded: params.degraded,
    errors: params.errors,
  };
}

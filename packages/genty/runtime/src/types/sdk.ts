/**
 * Locally-defined types that mirror the SDK storage/runtime types needed
 * by genty-runtime modules.
 *
 * These replace direct `@a5c-ai/babysitter-sdk` type imports so the runtime
 * package does not depend on SDK type definitions at compile time.
 */

// ── Generic JSON ────────────────────────────────────────────────────────

/** A JSON-serialisable record. */
export type JsonRecord = Record<string, unknown>;

// ── Journal ─────────────────────────────────────────────────────────────

export interface JournalEvent {
  seq: number;
  ulid: string;
  filename: string;
  path: string;
  type: string;
  recordedAt: string;
  sdkVersion?: string;
  data: JsonRecord;
  checksum?: string;
}

export interface AppendEventOptions {
  runDir: string;
  event: JsonRecord;
  eventType: string;
}

export interface AppendEventResult {
  seq: number;
  ulid: string;
  filename: string;
  checksum: string;
  path: string;
  recordedAt: string;
}

// ── Run metadata ────────────────────────────────────────────────────────

export interface RunEntrypointMetadata {
  importPath: string;
  exportName?: string;
}

export interface RunMetadata extends JsonRecord {
  runId: string;
  request: string;
  processId: string;
  sdkVersion?: string;
  harness?: string;
  entrypoint: RunEntrypointMetadata;
  processPath?: string;
  processRevision?: string;
  layoutVersion: string;
  createdAt: string;
  prompt?: string;
}

// ── Effect index ────────────────────────────────────────────────────────

/** Index over all effects in a run, queryable by effectId. */
export interface EffectIndex {
  listEffects(): Array<{
    effectId: string;
    taskId: string;
    kind?: string;
    status?: string;
    inputTokens?: number;
    outputTokens?: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
    costUsd?: number;
    costModel?: string;
  }>;
}

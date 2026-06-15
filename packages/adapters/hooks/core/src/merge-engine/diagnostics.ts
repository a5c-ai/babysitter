/**
 * Merge diagnostics types and helpers.
 * Tracks per-merge: conflicts, handler order, degraded fields,
 * per-handler timing, unsupported fields, and native rendering loss.
 */

/** A single conflict encountered during merge. */
export interface MergeConflict {
  /** The field where the conflict occurred (e.g. 'persistEnv.FOO'). */
  field: string;
  /** The value from the earlier handler. */
  existingValue: unknown;
  /** The value from the later handler that caused the conflict. */
  incomingValue: unknown;
  /** How it was resolved. */
  resolution: 'last-writer-wins' | 'kept-existing' | 'error' | 'protected';
  /** Index of the handler that wrote the existing value. */
  existingHandlerIndex: number;
  /** Index of the handler that wrote the incoming value. */
  incomingHandlerIndex: number;
}

/** A field that was degraded (lost fidelity) during merge. */
export interface DegradedField {
  /** The field name. */
  field: string;
  /** Why it was degraded. */
  reason: string;
}

/** Per-handler timing entry. */
export interface HandlerTiming {
  /** Index of the handler in the plan. */
  handlerIndex: number;
  /** Duration in milliseconds. */
  durationMs: number;
}

/** An output field that was set by a handler but is unsupported by the adapter. */
export interface UnsupportedOutputField {
  /** The field name on UnifiedHookResult. */
  field: string;
  /** Index of the handler that set the field. */
  handlerIndex: number;
  /** Why the field is unsupported. */
  reason: string;
}

/** A field whose native rendering was lossy. */
export interface NativeRenderingLoss {
  /** The field name. */
  field: string;
  /** What was lost and why. */
  reason: string;
}

/** Complete diagnostics for a single merge operation. */
export interface MergeDiagnostics {
  /** Number of handler results that were merged. */
  handlerCount: number;
  /** Ordered list of handler indices as they were processed. */
  handlerOrder: number[];
  /** Conflicts encountered during the merge. */
  conflicts: MergeConflict[];
  /** Fields that lost fidelity during merge. */
  degradedFields: DegradedField[];
  /** Per-handler timing data. */
  handlerTimings: HandlerTiming[];
  /** Output fields set by handlers but unsupported by the target adapter. */
  unsupportedOutputFields: UnsupportedOutputField[];
  /** Fields where native rendering lost fidelity. */
  nativeRenderingLosses: NativeRenderingLoss[];
  /** Timestamp of the merge operation. */
  mergedAt: string;
}

/** Creates a fresh diagnostics object for a new merge. */
export function createDiagnostics(handlerCount: number): MergeDiagnostics {
  return {
    handlerCount,
    handlerOrder: Array.from({ length: handlerCount }, (_, i) => i),
    conflicts: [],
    degradedFields: [],
    handlerTimings: [],
    unsupportedOutputFields: [],
    nativeRenderingLosses: [],
    mergedAt: new Date().toISOString(),
  };
}

/** Records a conflict in the diagnostics. */
export function recordConflict(
  diagnostics: MergeDiagnostics,
  conflict: MergeConflict,
): void {
  diagnostics.conflicts.push(conflict);
}

/** Records a degraded field in the diagnostics. */
export function recordDegradedField(
  diagnostics: MergeDiagnostics,
  field: string,
  reason: string,
): void {
  diagnostics.degradedFields.push({ field, reason });
}

/** Records an unsupported output field. */
export function recordUnsupportedOutputField(
  diagnostics: MergeDiagnostics,
  field: string,
  handlerIndex: number,
  reason: string,
): void {
  diagnostics.unsupportedOutputFields.push({ field, handlerIndex, reason });
}

/** Records a native rendering loss. */
export function recordNativeRenderingLoss(
  diagnostics: MergeDiagnostics,
  field: string,
  reason: string,
): void {
  diagnostics.nativeRenderingLosses.push({ field, reason });
}

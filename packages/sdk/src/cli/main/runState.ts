import { promises as fs } from "node:fs";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { readStateCache } from "../../runtime/replay/stateCache";
import type { EffectRecord, IterationMetadata } from "../../runtime/types";
import { loadJournal } from "../../storage/journal";
import { readRunMetadata } from "../../storage/runFiles";
import { readTaskResult } from "../../storage/tasks";
import type { JournalEvent, RunMetadata, StoredTaskResult } from "../../storage/types";
import { DEFAULTS } from "../../config/defaults";
import {
  defaultResultRef,
  normalizeArtifactRef,
  resolveArtifactAbsolutePath,
  toRunRelativePosix,
  type StateCacheSnapshot,
} from "./runSupport";

type RunLifecycleState = "created" | "waiting" | "completed" | "failed";

export interface TaskListEntry {
  effectId: string;
  taskId: string;
  stepId: string;
  status: string;
  kind?: string;
  label?: string;
  labels?: string[];
  taskDefRef: string | null;
  inputsRef: string | null;
  resultRef: string | null;
  stdoutRef: string | null;
  stderrRef: string | null;
  requestedAt?: string;
  resolvedAt?: string;
}

const LARGE_RESULT_PREVIEW_LIMIT = DEFAULTS.largeResultPreviewLimit;
const RUN_LIFECYCLE_TYPES: ReadonlySet<JournalEvent["type"]> = new Set(["RUN_CREATED", "RUN_COMPLETED", "RUN_FAILED"]);

export async function buildEffectIndexSafe(runDir: string, command: string, events?: JournalEvent[]) {
  try {
    return await buildEffectIndex({ runDir, events });
  } catch (error) {
    console.error(`[${command}] unable to read run at ${runDir}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function readRunMetadataSafe(runDir: string, command: string): Promise<RunMetadata | null> {
  try {
    return await readRunMetadata(runDir);
  } catch (error) {
    console.error(
      `[${command}] unable to read run metadata at ${runDir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

export async function loadJournalSafe(runDir: string, command: string): Promise<JournalEvent[] | null> {
  try {
    return await loadJournal(runDir);
  } catch (error) {
    console.error(`[${command}] unable to read journal at ${runDir}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function readStateCacheSafe(runDir: string, command: string): Promise<StateCacheSnapshot | null> {
  try {
    const snapshot = await readStateCache(runDir);
    if (!snapshot) {
      console.warn(`[${command}] state cache snapshot missing at ${runDir} (continuing without metadata)`);
      return null;
    }
    return snapshot;
  } catch (error) {
    console.warn(
      `[${command}] unable to read state cache at ${runDir}: ${error instanceof Error ? error.message : String(error)} (continuing without metadata)`
    );
    return null;
  }
}

export function toTaskListEntry(record: EffectRecord, runDir: string): TaskListEntry {
  return {
    effectId: record.effectId,
    taskId: record.taskId ?? "unknown",
    stepId: record.stepId ?? "unknown",
    status: record.status ?? "unknown",
    kind: record.kind,
    label: record.label,
    labels: record.labels,
    taskDefRef: normalizeArtifactRef(runDir, record.taskDefRef ?? `tasks/${record.effectId}/task.json`),
    inputsRef: normalizeArtifactRef(runDir, record.inputsRef),
    resultRef: normalizeArtifactRef(runDir, record.resultRef),
    stdoutRef: normalizeArtifactRef(runDir, record.stdoutRef),
    stderrRef: normalizeArtifactRef(runDir, record.stderrRef),
    requestedAt: record.requestedAt,
    resolvedAt: record.resolvedAt,
  };
}

export function findLastLifecycleEvent(events: JournalEvent[]): JournalEvent | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (RUN_LIFECYCLE_TYPES.has(event.type)) {
      return event;
    }
  }
  return undefined;
}

export function countPendingByKind(records: EffectRecord[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.kind ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

export async function loadTaskResultPreview(
  runDir: string,
  effectId: string,
  record: EffectRecord
): Promise<{ result?: StoredTaskResult; large: boolean }> {
  const absolutePath = resolveArtifactAbsolutePath(runDir, record.resultRef ?? defaultResultRef(effectId));
  if (!absolutePath) return { result: undefined, large: false };
  try {
    const stats = await fs.stat(absolutePath);
    if (stats.size > LARGE_RESULT_PREVIEW_LIMIT) {
      return { result: undefined, large: true };
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return { result: undefined, large: false };
    }
    throw error;
  }
  const data = await readTaskResult(runDir, effectId, record.resultRef);
  return { result: data ?? undefined, large: false };
}

export function deriveRunState(lastLifecycleEventType: JournalEvent["type"] | undefined, pendingTotal: number): RunLifecycleState {
  if (lastLifecycleEventType === "RUN_COMPLETED") return "completed";
  if (lastLifecycleEventType === "RUN_FAILED") return "failed";
  if (pendingTotal > 0) return "waiting";
  return "created";
}

export function formatLastEventSummary(event?: JournalEvent): string {
  if (!event) return "none";
  return `${event.type}#${formatSeq(event.seq)} ${event.recordedAt}`;
}

export function mergeMetadataSources(
  metadata: IterationMetadata | undefined,
  options: { snapshot?: StateCacheSnapshot | null; pendingByKind?: Record<string, number> }
): IterationMetadata | undefined {
  const snapshot = options.snapshot ?? null;
  const hasPendingOverride = options.pendingByKind !== undefined;
  if (!metadata && !hasPendingOverride && !snapshot) {
    return undefined;
  }

  const next: IterationMetadata = { ...(metadata ?? {}) };
  if (hasPendingOverride) {
    next.pendingEffectsByKind = { ...(options.pendingByKind ?? {}) };
  } else if (!next.pendingEffectsByKind && snapshot) {
    next.pendingEffectsByKind = { ...snapshot.pendingEffectsByKind };
  }

  if (snapshot) {
    next.stateVersion ??= snapshot.stateVersion;
    next.journalHead ??= snapshot.journalHead ?? null;
    if (snapshot.rebuildReason) {
      next.stateRebuilt = true;
      next.stateRebuildReason ??= snapshot.rebuildReason;
    }
  }

  if (
    next.stateVersion === undefined &&
    next.stateRebuilt === undefined &&
    next.pendingEffectsByKind === undefined &&
    next.journalHead === undefined
  ) {
    return undefined;
  }
  return next;
}

export function formatIterationMetadata(metadata?: IterationMetadata): { textParts: string[]; jsonMetadata?: IterationMetadata } {
  const textParts: string[] = [];
  if (!metadata) return { textParts, jsonMetadata: undefined };

  if (metadata.stateVersion !== undefined) {
    textParts.push(`stateVersion=${metadata.stateVersion}`);
  }
  if (metadata.journalHead && typeof metadata.journalHead.seq === "number") {
    textParts.push(`journalHead=#${formatSeq(metadata.journalHead.seq)}`);
    if (metadata.journalHead.ulid) textParts.push(`journalHead.ulid=${metadata.journalHead.ulid}`);
    if (metadata.journalHead.checksum) textParts.push(`journalHead.checksum=${metadata.journalHead.checksum}`);
  }
  if (metadata.stateRebuilt) {
    const reasonSuffix = metadata.stateRebuildReason ? `(${metadata.stateRebuildReason})` : "";
    textParts.push(`stateRebuilt=true${reasonSuffix}`);
  }
  if (metadata.pendingEffectsByKind) {
    const pendingEntries = Object.entries(metadata.pendingEffectsByKind).sort(([a], [b]) => a.localeCompare(b));
    const pendingTotal = pendingEntries.reduce((sum, [, count]) => sum + count, 0);
    textParts.push(`pending[total]=${pendingTotal}`);
    for (const [kind, count] of pendingEntries) {
      textParts.push(`pending[${kind}]=${count}`);
    }
  }
  return { textParts, jsonMetadata: metadata };
}

export function serializeJournalEvent(event: JournalEvent, runDir: string) {
  return {
    seq: event.seq,
    ulid: event.ulid,
    type: event.type,
    recordedAt: event.recordedAt,
    filename: event.filename,
    path: toRunRelativePosix(runDir, event.path),
    data: ensureIterationMetadata(event.data),
  };
}

export function ensureIterationMetadata(data: Record<string, unknown>): Record<string, unknown> {
  const iteration = data.iteration;
  if (!iteration || typeof iteration !== "object" || Array.isArray(iteration)) {
    return data;
  }
  const iterationRecord = iteration as Record<string, unknown>;
  return {
    ...data,
    iteration: {
      ...iterationRecord,
      metadata: iterationRecord.metadata === undefined ? null : iterationRecord.metadata,
    },
  };
}

export function formatEventLine(event: JournalEvent): string {
  return `#${formatSeq(event.seq)} ${event.type} ${event.recordedAt}`;
}

export function formatSeq(seq: number): string {
  return seq.toString().padStart(6, "0");
}

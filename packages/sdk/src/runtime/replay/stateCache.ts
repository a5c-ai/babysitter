import { promises as fs } from "fs";
import { getStateDir, getStateFile } from "../../storage/paths";
import { writeFileAtomic } from "../../storage/atomic";
import { EffectIndex, buildEffectIndex } from "./effectIndex";
import { EffectRecord, EffectStatus } from "../types";
import { getClockIsoString } from "../../storage/clock";

export const STATE_CACHE_SCHEMA_VERSION = "2026.01.state-cache";

export interface StateCacheJournalHead {
  seq: number;
  ulid: string;
  checksum?: string;
}

export interface DerivedEffectSummary {
  effectId: string;
  invocationKey: string;
  status: EffectStatus;
  kind?: string;
  label?: string;
  taskId?: string;
  stepId?: string;
  requestedAt?: string;
  resolvedAt?: string;
}

export interface StateCacheSnapshot {
  schemaVersion: string;
  savedAt: string;
  journalHead?: StateCacheJournalHead | null;
  stateVersion: number;
  effectsByInvocation: Record<string, DerivedEffectSummary>;
  pendingEffectsByKind: Record<string, number>;
  rebuildReason?: string | null;
}

export interface CreateStateCacheSnapshotOptions {
  journalHead?: StateCacheJournalHead | null;
  savedAt?: string;
  schemaVersion?: string;
  stateVersion?: number;
  effectsByInvocation?: Record<string, DerivedEffectSummary>;
  pendingEffectsByKind?: Record<string, number>;
  rebuildReason?: string | null;
}

export async function readStateCache(runDir: string): Promise<StateCacheSnapshot | null> {
  const stateFile = getStateFile(runDir);
  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeSnapshot(parsed);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeStateCache(runDir: string, snapshot: StateCacheSnapshot): Promise<void> {
  const stateDir = getStateDir(runDir);
  await fs.mkdir(stateDir, { recursive: true });
  const stateFile = getStateFile(runDir);
  await writeFileAtomic(stateFile, JSON.stringify(snapshot, null, 2) + "\n");
}

export function journalHeadsEqual(
  a?: StateCacheJournalHead | null,
  b?: StateCacheJournalHead | null
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.seq !== b.seq || a.ulid !== b.ulid) return false;
  if (a.checksum && b.checksum && a.checksum !== b.checksum) return false;
  return true;
}

export function createStateCacheSnapshot(
  journalHeadOrOptions?: StateCacheJournalHead | null | CreateStateCacheSnapshotOptions
): StateCacheSnapshot {
  const options: CreateStateCacheSnapshotOptions =
    journalHeadOrOptions && isJournalHeadLike(journalHeadOrOptions)
      ? { journalHead: journalHeadOrOptions }
      : (journalHeadOrOptions as CreateStateCacheSnapshotOptions | undefined) ?? {};
  return {
    schemaVersion: options.schemaVersion ?? STATE_CACHE_SCHEMA_VERSION,
    savedAt: options.savedAt ?? getClockIsoString(),
    journalHead: options.journalHead ?? null,
    stateVersion: options.stateVersion ?? 0,
    effectsByInvocation: options.effectsByInvocation ?? {},
    pendingEffectsByKind: options.pendingEffectsByKind ?? {},
    rebuildReason: options.rebuildReason ?? null,
  };
}

export function normalizeJournalHead(raw: unknown): StateCacheJournalHead | null | undefined {
  if (raw === null || raw === undefined) return raw;
  if (!isPlainObject(raw)) return undefined;
  const seq = Number(raw.seq);
  const ulid = raw.ulid;
  if (!Number.isFinite(seq) || typeof ulid !== "string" || !ulid) {
    return undefined;
  }
  const checksum = typeof raw.checksum === "string" && raw.checksum ? raw.checksum : undefined;
  return { seq, ulid, checksum };
}

export function normalizeSnapshot(raw: unknown): StateCacheSnapshot {
  if (!isPlainObject(raw)) {
    throw new Error("Invalid state cache snapshot");
  }
  const journalHead =
    raw.journalHead === null ? null : normalizeJournalHead(raw.journalHead ?? undefined) ?? null;
  const effectsByInvocation = normalizeEffectSummaryMap(raw.effectsByInvocation);
  const pendingEffectsByKind = normalizePendingEffects(raw.pendingEffectsByKind);
  const savedAt = typeof raw.savedAt === "string" ? raw.savedAt : getClockIsoString();
  const rebuildReason =
    raw.rebuildReason === null
      ? null
      : typeof raw.rebuildReason === "string"
        ? raw.rebuildReason
        : null;
  const stateVersion =
    typeof raw.stateVersion === "number" && Number.isFinite(raw.stateVersion) ? raw.stateVersion : 0;
  return createStateCacheSnapshot({
    schemaVersion:
      typeof raw.schemaVersion === "string" ? raw.schemaVersion : STATE_CACHE_SCHEMA_VERSION,
    savedAt,
    journalHead,
    stateVersion,
    effectsByInvocation,
    pendingEffectsByKind,
    rebuildReason,
  });
}

export async function rebuildStateCache(
  runDir: string,
  opts?: { effectIndex?: EffectIndex; reason?: string }
): Promise<StateCacheSnapshot> {
  const effectIndex =
    opts?.effectIndex ??
    (await buildEffectIndex({
      runDir,
    }));
  const journalHead = effectIndex.getJournalHead() ?? null;
  const stateVersion = journalHead?.seq ?? 0;
  const effectsByInvocation = deriveEffectsByInvocation(effectIndex);
  const pendingEffectsByKind = derivePendingByKind(effectIndex);
  const snapshot = createStateCacheSnapshot({
    journalHead,
    stateVersion,
    effectsByInvocation,
    pendingEffectsByKind,
    rebuildReason: opts?.reason ?? null,
  });
  await writeStateCache(runDir, snapshot);
  return snapshot;
}

function deriveEffectsByInvocation(effectIndex: EffectIndex): Record<string, DerivedEffectSummary> {
  const summaries: Record<string, DerivedEffectSummary> = {};
  effectIndex.listEffects().forEach((record) => {
    summaries[record.invocationKey] = summarizeEffect(record);
  });
  return summaries;
}

function summarizeEffect(record: EffectRecord): DerivedEffectSummary {
  const summary: DerivedEffectSummary = {
    effectId: record.effectId,
    invocationKey: record.invocationKey,
    status: record.status,
  };
  if (record.kind) summary.kind = record.kind;
  if (record.label) summary.label = record.label;
  if (record.taskId) summary.taskId = record.taskId;
  if (record.stepId) summary.stepId = record.stepId;
  if (record.requestedAt) summary.requestedAt = record.requestedAt;
  if (record.resolvedAt) summary.resolvedAt = record.resolvedAt;
  return summary;
}

function derivePendingByKind(effectIndex: EffectIndex): Record<string, number> {
  const totals: Record<string, number> = {};
  effectIndex.listPendingEffects().forEach((record) => {
    const key = record.kind ?? "unknown";
    totals[key] = (totals[key] ?? 0) + 1;
  });
  return totals;
}

function normalizeEffectSummaryMap(raw: unknown): Record<string, DerivedEffectSummary> {
  if (!isPlainObject(raw)) return {};
  const summaries: Record<string, DerivedEffectSummary> = {};
  for (const [key, value] of Object.entries(raw)) {
    const summary = normalizeDerivedEffectSummary(value);
    if (summary) {
      summaries[key] = summary;
    }
  }
  return summaries;
}

function normalizeDerivedEffectSummary(raw: unknown): DerivedEffectSummary | undefined {
  if (!isPlainObject(raw)) return undefined;
  const effectId = typeof raw.effectId === "string" ? raw.effectId : undefined;
  const invocationKey = typeof raw.invocationKey === "string" ? raw.invocationKey : undefined;
  const status = isEffectStatus(raw.status) ? raw.status : undefined;
  if (!effectId || !invocationKey || !status) {
    return undefined;
  }
  const summary: DerivedEffectSummary = { effectId, invocationKey, status };
  if (typeof raw.kind === "string") summary.kind = raw.kind;
  if (typeof raw.label === "string") summary.label = raw.label;
  if (typeof raw.taskId === "string") summary.taskId = raw.taskId;
  if (typeof raw.stepId === "string") summary.stepId = raw.stepId;
  if (typeof raw.requestedAt === "string") summary.requestedAt = raw.requestedAt;
  if (typeof raw.resolvedAt === "string") summary.resolvedAt = raw.resolvedAt;
  return summary;
}

function normalizePendingEffects(raw: unknown): Record<string, number> {
  if (!isPlainObject(raw)) return {};
  const totals: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      totals[key] = value;
    }
  }
  return totals;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEffectStatus(value: unknown): value is EffectStatus {
  return value === "requested" || value === "resolved_ok" || value === "resolved_error";
}

function isJournalHeadLike(value: unknown): value is StateCacheJournalHead {
  if (!isPlainObject(value)) return false;
  return Number.isFinite(value.seq) && typeof value.ulid === "string" && value.ulid.length > 0;
}

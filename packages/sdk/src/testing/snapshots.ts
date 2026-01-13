import { loadJournal } from "../storage/journal";
import type { JsonRecord } from "../storage/types";
import { readStateCache, type StateCacheSnapshot } from "../runtime/replay/stateCache";

export interface JournalSnapshotEntry {
  seq: number;
  ulid: string;
  type: string;
  recordedAt: string;
  data: JsonRecord;
}

export interface RunSnapshot {
  journal: JournalSnapshotEntry[];
  state: StateCacheSnapshot | null;
}

export async function readJournalSnapshot(runDir: string): Promise<JournalSnapshotEntry[]> {
  const events = await loadJournal(runDir);
  return events.map((event) => ({
    seq: event.seq,
    ulid: event.ulid,
    type: event.type,
    recordedAt: event.recordedAt,
    data: event.data,
  }));
}

export async function readStateSnapshot(runDir: string): Promise<StateCacheSnapshot | null> {
  return readStateCache(runDir);
}

export async function captureRunSnapshot(runDir: string): Promise<RunSnapshot> {
  const [journal, state] = await Promise.all([readJournalSnapshot(runDir), readStateSnapshot(runDir)]);
  return { journal, state };
}

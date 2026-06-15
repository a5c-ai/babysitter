/**
 * Memory I/O tab selectors (SPEC-V4 §V4-9): which sim ref feeds
 * `getMemoryIO`, and how Read/Written pieces deep-link into the Archive
 * overlay. Pure.
 */

import type {
  SimMemoryReadEntry,
  SimMemorySiloView,
  SimMemoryWriteEntry,
} from '../backend/mock/simulation';

/**
 * The `getMemoryIO(ref)` ref for an Inspector target: the attended CARD
 * aggregates every agent attempt's traffic, so it wins over the unit id;
 * an unattached agent falls back to its own unitId.
 */
export function memoryRefFor(taskId: string | null, unitId: string | null): string | null {
  return taskId ?? unitId;
}

/**
 * Deep-link target for a WRITTEN piece (§V4-9): proposals target a silo,
 * not a node — focus the silo's first record (deterministic: silo record
 * order is seed-stable).
 */
export function firstRecordOfSilo(
  silos: ReadonlyArray<Pick<SimMemorySiloView, 'name' | 'recordIds'>>,
  silo: string,
): string | null {
  const match = silos.find((s) => s.name === silo);
  return match?.recordIds[0] ?? null;
}

/** Unique record ids of the Read ledger, in first-seen order (mini strip). */
export function uniqueReadRecordIds(
  read: ReadonlyArray<SimMemoryReadEntry>,
  cap = 8,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of read) {
    if (seen.has(entry.recordId)) continue;
    seen.add(entry.recordId);
    out.push(entry.recordId);
    if (out.length >= cap) break;
  }
  return out;
}

/** Strip keys for the Written ledger (one bead per proposal, capped). */
export function writtenStripKeys(
  written: ReadonlyArray<SimMemoryWriteEntry>,
  cap = 8,
): string[] {
  return written.slice(0, cap).map((entry) => entry.updateId);
}

/** Total proposed file changes across the Written ledger (section meta). */
export function totalWrittenChanges(written: ReadonlyArray<SimMemoryWriteEntry>): number {
  return written.reduce((sum, entry) => sum + entry.changes.length, 0);
}

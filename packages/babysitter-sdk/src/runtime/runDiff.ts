/**
 * GAP-RUN-001: Run Comparison and Diffing.
 *
 * Captures point-in-time snapshots of run metadata and computes
 * field-level diffs between two snapshots for comparison.
 */

import type { RunMetadata } from "../storage/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunSnapshot {
  runId: string;
  status: string;
  effectCount: number;
  completedCount: number;
  failedCount: number;
  totalCostUsd: number;
  durationMs: number;
}

export type DiffChangeType = 'added' | 'removed' | 'modified';

export interface RunDiff {
  field: string;
  before: unknown;
  after: unknown;
  changeType: DiffChangeType;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Extract a RunSnapshot from run metadata and optional state cache data.
 */
export function captureRunSnapshot(metadata: RunMetadata & {
  status?: string;
  effectCount?: number;
  completedCount?: number;
  failedCount?: number;
  totalCostUsd?: number;
  durationMs?: number;
}): RunSnapshot {
  return {
    runId: metadata.runId,
    status: (metadata.status as string) ?? 'unknown',
    effectCount: (metadata.effectCount as number) ?? 0,
    completedCount: (metadata.completedCount as number) ?? 0,
    failedCount: (metadata.failedCount as number) ?? 0,
    totalCostUsd: (metadata.totalCostUsd as number) ?? 0,
    durationMs: (metadata.durationMs as number) ?? 0,
  };
}

/**
 * Compare two run snapshots field by field.
 * Returns an array of diffs for fields that differ.
 */
export function diffRuns(a: RunSnapshot, b: RunSnapshot): RunDiff[] {
  const diffs: RunDiff[] = [];
  const fields: (keyof RunSnapshot)[] = [
    'status', 'effectCount', 'completedCount', 'failedCount', 'totalCostUsd', 'durationMs',
  ];

  for (const field of fields) {
    const va = a[field];
    const vb = b[field];
    if (va !== vb) {
      diffs.push({
        field,
        before: va,
        after: vb,
        changeType: 'modified',
      });
    }
  }

  return diffs;
}

/**
 * Render a human-readable diff summary.
 */
export function formatRunDiff(diffs: RunDiff[]): string {
  if (diffs.length === 0) return 'No differences found.';

  const lines = diffs.map((d) => {
    return `  ${d.field}: ${formatValue(d.before)} → ${formatValue(d.after)}`;
  });

  return `Run comparison (${diffs.length} change${diffs.length === 1 ? '' : 's'}):\n${lines.join('\n')}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(v: unknown): string {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? String(v) : '0';
  }
  return String(v);
}

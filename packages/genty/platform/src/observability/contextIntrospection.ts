/**
 * Context introspection — capture, compare, and report on the runtime
 * context visible to an agent at any point during a run (OBS-005).
 *
 * A "context snapshot" is a lightweight record of what information
 * the agent currently has access to (variables, loaded files, tools,
 * etc.). Diffing two snapshots reveals context drift over time.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextEntry {
  key: string;
  value: string;
  source: string;
}

export interface ContextSnapshot {
  snapshotId: string;
  capturedAt: string;
  entries: ContextEntry[];
}

export interface ContextDiff {
  added: ContextEntry[];
  removed: ContextEntry[];
  changed: Array<{
    key: string;
    before: string;
    after: string;
  }>;
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

/**
 * Create a new context snapshot from a set of key-value entries.
 */
export function captureContext(
  snapshotId: string,
  entries: ContextEntry[],
  now?: string,
): ContextSnapshot {
  return {
    snapshotId,
    capturedAt: now ?? new Date().toISOString(),
    entries: [...entries],
  };
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

/**
 * Compare two context snapshots and return the differences.
 */
export function diffContexts(
  before: ContextSnapshot,
  after: ContextSnapshot,
): ContextDiff {
  const beforeMap = new Map<string, ContextEntry>();
  for (const entry of before.entries) {
    beforeMap.set(entry.key, entry);
  }

  const afterMap = new Map<string, ContextEntry>();
  for (const entry of after.entries) {
    afterMap.set(entry.key, entry);
  }

  const added: ContextEntry[] = [];
  const removed: ContextEntry[] = [];
  const changed: ContextDiff['changed'] = [];

  // Find added and changed
  for (const [key, afterEntry] of afterMap) {
    const beforeEntry = beforeMap.get(key);
    if (!beforeEntry) {
      added.push(afterEntry);
    } else if (beforeEntry.value !== afterEntry.value) {
      changed.push({ key, before: beforeEntry.value, after: afterEntry.value });
    }
  }

  // Find removed
  for (const [key, beforeEntry] of beforeMap) {
    if (!afterMap.has(key)) {
      removed.push(beforeEntry);
    }
  }

  return { added, removed, changed };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/**
 * Format a context diff into a human-readable report.
 */
export function formatContextReport(diff: ContextDiff): string {
  const lines: string[] = [];

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    return 'No context changes.';
  }

  if (diff.added.length > 0) {
    lines.push(`Added (${diff.added.length}):`);
    for (const entry of diff.added) {
      lines.push(`  + ${entry.key} = ${entry.value} [${entry.source}]`);
    }
  }

  if (diff.removed.length > 0) {
    lines.push(`Removed (${diff.removed.length}):`);
    for (const entry of diff.removed) {
      lines.push(`  - ${entry.key} = ${entry.value} [${entry.source}]`);
    }
  }

  if (diff.changed.length > 0) {
    lines.push(`Changed (${diff.changed.length}):`);
    for (const c of diff.changed) {
      lines.push(`  ~ ${c.key}: ${c.before} -> ${c.after}`);
    }
  }

  return lines.join('\n');
}

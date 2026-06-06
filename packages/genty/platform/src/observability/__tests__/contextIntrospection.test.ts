import { describe, it, expect } from 'vitest';
import {
  captureContext,
  diffContexts,
  formatContextReport,
  type ContextEntry,
} from '../contextIntrospection';

const NOW = '2026-06-03T12:00:00.000Z';

function entry(key: string, value: string, source = 'test'): ContextEntry {
  return { key, value, source };
}

// ---------------------------------------------------------------------------
// captureContext
// ---------------------------------------------------------------------------

describe('captureContext', () => {
  it('creates a snapshot with given entries', () => {
    const snap = captureContext('s1', [entry('a', '1')], NOW);
    expect(snap.snapshotId).toBe('s1');
    expect(snap.capturedAt).toBe(NOW);
    expect(snap.entries).toHaveLength(1);
    expect(snap.entries[0].key).toBe('a');
  });

  it('does not share the entries array reference', () => {
    const entries = [entry('x', 'y')];
    const snap = captureContext('s2', entries, NOW);
    entries.push(entry('extra', 'val'));
    expect(snap.entries).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// diffContexts
// ---------------------------------------------------------------------------

describe('diffContexts', () => {
  it('detects added entries', () => {
    const before = captureContext('s1', [entry('a', '1')], NOW);
    const after = captureContext('s2', [entry('a', '1'), entry('b', '2')], NOW);
    const diff = diffContexts(before, after);

    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].key).toBe('b');
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it('detects removed entries', () => {
    const before = captureContext('s1', [entry('a', '1'), entry('b', '2')], NOW);
    const after = captureContext('s2', [entry('b', '2')], NOW);
    const diff = diffContexts(before, after);

    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].key).toBe('a');
  });

  it('detects changed entries', () => {
    const before = captureContext('s1', [entry('a', 'old')], NOW);
    const after = captureContext('s2', [entry('a', 'new')], NOW);
    const diff = diffContexts(before, after);

    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].before).toBe('old');
    expect(diff.changed[0].after).toBe('new');
  });

  it('returns empty diff for identical snapshots', () => {
    const snap = captureContext('s1', [entry('a', '1')], NOW);
    const diff = diffContexts(snap, snap);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// formatContextReport
// ---------------------------------------------------------------------------

describe('formatContextReport', () => {
  it('returns "No context changes." for empty diff', () => {
    const report = formatContextReport({ added: [], removed: [], changed: [] });
    expect(report).toBe('No context changes.');
  });

  it('formats added entries', () => {
    const report = formatContextReport({
      added: [entry('x', 'val', 'env')],
      removed: [],
      changed: [],
    });
    expect(report).toContain('Added (1)');
    expect(report).toContain('+ x = val [env]');
  });

  it('formats removed entries', () => {
    const report = formatContextReport({
      added: [],
      removed: [entry('y', 'old', 'config')],
      changed: [],
    });
    expect(report).toContain('Removed (1)');
    expect(report).toContain('- y = old [config]');
  });

  it('formats changed entries', () => {
    const report = formatContextReport({
      added: [],
      removed: [],
      changed: [{ key: 'z', before: 'a', after: 'b' }],
    });
    expect(report).toContain('Changed (1)');
    expect(report).toContain('~ z: a -> b');
  });
});

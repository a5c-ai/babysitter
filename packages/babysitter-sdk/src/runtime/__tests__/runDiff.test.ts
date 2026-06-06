import { describe, it, expect } from 'vitest';
import {
  captureRunSnapshot,
  diffRuns,
  formatRunDiff,
  type RunSnapshot,
} from '../runDiff';

describe('runDiff', () => {
  // -------------------------------------------------------------------------
  // captureRunSnapshot
  // -------------------------------------------------------------------------

  describe('captureRunSnapshot', () => {
    it('extracts snapshot from metadata', () => {
      const snap = captureRunSnapshot({
        runId: 'run-1',
        request: 'test',
        processId: 'p1',
        entrypoint: { importPath: 'test.ts' },
        layoutVersion: '1',
        createdAt: '2026-01-01T00:00:00Z',
        status: 'completed',
        effectCount: 5,
        completedCount: 4,
        failedCount: 1,
        totalCostUsd: 0.25,
        durationMs: 12000,
      });
      expect(snap.runId).toBe('run-1');
      expect(snap.status).toBe('completed');
      expect(snap.effectCount).toBe(5);
      expect(snap.totalCostUsd).toBe(0.25);
    });

    it('defaults missing fields to zero/unknown', () => {
      const snap = captureRunSnapshot({
        runId: 'run-2',
        request: 'test',
        processId: 'p2',
        entrypoint: { importPath: 'test.ts' },
        layoutVersion: '1',
        createdAt: '2026-01-01T00:00:00Z',
      });
      expect(snap.status).toBe('unknown');
      expect(snap.effectCount).toBe(0);
      expect(snap.totalCostUsd).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // diffRuns
  // -------------------------------------------------------------------------

  describe('diffRuns', () => {
    const snapA: RunSnapshot = {
      runId: 'a',
      status: 'running',
      effectCount: 3,
      completedCount: 2,
      failedCount: 1,
      totalCostUsd: 0.10,
      durationMs: 5000,
    };

    const snapB: RunSnapshot = {
      runId: 'b',
      status: 'completed',
      effectCount: 5,
      completedCount: 5,
      failedCount: 0,
      totalCostUsd: 0.30,
      durationMs: 12000,
    };

    it('finds diffs between two snapshots', () => {
      const diffs = diffRuns(snapA, snapB);
      expect(diffs.length).toBeGreaterThan(0);
      const statusDiff = diffs.find(d => d.field === 'status');
      expect(statusDiff).toBeDefined();
      expect(statusDiff!.before).toBe('running');
      expect(statusDiff!.after).toBe('completed');
    });

    it('returns empty array for identical snapshots', () => {
      const diffs = diffRuns(snapA, { ...snapA, runId: 'a-copy' });
      expect(diffs).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // formatRunDiff
  // -------------------------------------------------------------------------

  describe('formatRunDiff', () => {
    it('formats diffs as human-readable text', () => {
      const diffs = [
        { field: 'status', before: 'running', after: 'completed', changeType: 'modified' as const },
        { field: 'effectCount', before: 3, after: 5, changeType: 'modified' as const },
      ];
      const text = formatRunDiff(diffs);
      expect(text).toContain('2 changes');
      expect(text).toContain('status: running → completed');
      expect(text).toContain('effectCount: 3 → 5');
    });

    it('returns no-diff message for empty array', () => {
      expect(formatRunDiff([])).toBe('No differences found.');
    });
  });
});

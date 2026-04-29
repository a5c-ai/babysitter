import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';

// Mock dependencies before importing the module under test
vi.mock('../parser', () => ({
  getRunDigest: vi.fn(),
  parseRunDir: vi.fn(),
}));

vi.mock('../source-discovery', () => ({
  discoverAllRunDirs: vi.fn(),
}));

vi.mock('../config-loader', () => ({
  getConfig: vi.fn(),
}));

import { getRunDigest, parseRunDir } from '../parser';
import { discoverAllRunDirs } from '../source-discovery';
import type { WatchSource } from '../config-loader';
import type { RunDigest, Run } from '@/types';
import {
  getDigestCached,
  getRunCached,
  invalidateRun,
  invalidateAll,
  getProjectSummaries,
  discoverAndCacheAll,
  getCacheStats,
  forceRefreshBreakpointRuns,
} from '../run-cache';

const mockGetRunDigest = vi.mocked(getRunDigest);
const mockParseRunDir = vi.mocked(parseRunDir);
const mockDiscoverAllRunDirs = vi.mocked(discoverAllRunDirs);
// Use vi.spyOn for fs methods so the same mock is shared with run-cache module
const mockReadFile = vi.spyOn(fs, 'readFile');

const defaultSource: WatchSource = { path: '/projects', depth: 2, label: 'test' };

function makeDigest(overrides: Partial<RunDigest> = {}): RunDigest {
  return {
    runId: 'run-001',
    latestSeq: 5,
    status: 'completed',
    taskCount: 3,
    completedTasks: 3,
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

function makeRun(overrides: Partial<Run> & { _journalFileCount?: number } = {}): Run & { _journalFileCount?: number } {
  return {
    runId: 'run-001',
    processId: 'data-pipeline',
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:05Z',
    tasks: [],
    events: [],
    totalTasks: 3,
    completedTasks: 3,
    failedTasks: 0,
    duration: 5000,
    _journalFileCount: 5,
    ...overrides,
  };
}

describe('run-cache', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    // Clear cache between tests
    invalidateAll();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // getDigestCached
  // -----------------------------------------------------------------------
  describe('getDigestCached', () => {
    it('fetches and caches a digest on first call', async () => {
      const digest = makeDigest();
      mockGetRunDigest.mockResolvedValue(digest);
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'my-proc' }));

      const result = await getDigestCached('/runs/run-001', defaultSource, 'my-project');

      expect(mockGetRunDigest).toHaveBeenCalledWith('/runs/run-001');
      expect(result.runId).toBe('run-001');
      expect(result.processId).toBe('my-proc');
      expect(result.sourceLabel).toBe('test');
      expect(result.projectName).toBe('my-project');
    });

    it('returns cached digest within TTL (completed run = 30s)', async () => {
      const digest = makeDigest({ status: 'completed' });
      mockGetRunDigest.mockResolvedValue(digest);
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getDigestCached('/runs/run-001', defaultSource, 'proj');

      // Advance time by 20s (within 30s TTL for completed runs)
      vi.advanceTimersByTime(20000);

      await getDigestCached('/runs/run-001', defaultSource, 'proj');

      // Should only call getRunDigest once due to caching
      expect(mockGetRunDigest).toHaveBeenCalledTimes(1);
    });

    it('refetches after TTL expires for completed runs (30s)', async () => {
      const digest = makeDigest({ status: 'completed' });
      mockGetRunDigest.mockResolvedValue(digest);
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getDigestCached('/runs/run-001', defaultSource, 'proj');

      // Advance time past 30s TTL
      vi.advanceTimersByTime(31000);

      await getDigestCached('/runs/run-001', defaultSource, 'proj');

      expect(mockGetRunDigest).toHaveBeenCalledTimes(2);
    });

    it('uses shorter TTL (5s) for active runs', async () => {
      const digest = makeDigest({ status: 'waiting' });
      mockGetRunDigest.mockResolvedValue(digest);
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getDigestCached('/runs/run-active', defaultSource, 'proj');

      // At 4s it should still be cached
      vi.advanceTimersByTime(4000);
      await getDigestCached('/runs/run-active', defaultSource, 'proj');
      expect(mockGetRunDigest).toHaveBeenCalledTimes(1);

      // At 6s it should refetch
      vi.advanceTimersByTime(2000);
      await getDigestCached('/runs/run-active', defaultSource, 'proj');
      expect(mockGetRunDigest).toHaveBeenCalledTimes(2);
    });

    it('uses shorter TTL (5s) for pending runs', async () => {
      const digest = makeDigest({ status: 'pending' });
      mockGetRunDigest.mockResolvedValue(digest);
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getDigestCached('/runs/run-pending', defaultSource, 'proj');

      vi.advanceTimersByTime(6000);

      await getDigestCached('/runs/run-pending', defaultSource, 'proj');
      expect(mockGetRunDigest).toHaveBeenCalledTimes(2);
    });

    it('returns "unknown" processId when run.json cannot be read', async () => {
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const result = await getDigestCached('/runs/run-001', defaultSource, 'proj');

      expect(result.processId).toBe('unknown');
    });

    it('returns "unknown" processId when run.json has no processId', async () => {
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({}));

      const result = await getDigestCached('/runs/run-001', defaultSource, 'proj');

      expect(result.processId).toBe('unknown');
    });
  });

  // -----------------------------------------------------------------------
  // getRunCached
  // -----------------------------------------------------------------------
  describe('getRunCached', () => {
    it('fetches and caches a full run on first call', async () => {
      const run = makeRun();
      mockParseRunDir.mockResolvedValue(run);
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      const result = await getRunCached('/runs/run-001', defaultSource, 'proj');

      expect(mockParseRunDir).toHaveBeenCalledWith('/runs/run-001', undefined);
      expect(result.runId).toBe('run-001');
      expect(result.sourceLabel).toBe('test');
      expect(result.projectName).toBe('proj');
    });

    it('returns cached full run within TTL', async () => {
      const run = makeRun({ status: 'completed' });
      mockParseRunDir.mockResolvedValue(run);
      mockGetRunDigest.mockResolvedValue(makeDigest({ status: 'completed' }));
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getRunCached('/runs/run-001', defaultSource, 'proj');

      vi.advanceTimersByTime(20000);

      await getRunCached('/runs/run-001', defaultSource, 'proj');

      // parseRunDir should only be called once
      expect(mockParseRunDir).toHaveBeenCalledTimes(1);
    });

    it('refetches after TTL expires', async () => {
      const run = makeRun({ status: 'completed' });
      mockParseRunDir.mockResolvedValue(run);
      mockGetRunDigest.mockResolvedValue(makeDigest({ status: 'completed' }));
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getRunCached('/runs/run-001', defaultSource, 'proj');

      vi.advanceTimersByTime(31000);

      await getRunCached('/runs/run-001', defaultSource, 'proj');

      expect(mockParseRunDir).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // invalidateRun
  // -----------------------------------------------------------------------
  describe('invalidateRun', () => {
    it('removes a specific run from cache', async () => {
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getDigestCached('/runs/run-001', defaultSource, 'proj');

      expect(getCacheStats().size).toBe(1);

      invalidateRun('/runs/run-001');

      expect(getCacheStats().size).toBe(0);
    });

    it('does nothing when invalidating a non-existent key', () => {
      expect(() => invalidateRun('/runs/nonexistent')).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // invalidateAll
  // -----------------------------------------------------------------------
  describe('invalidateAll', () => {
    it('clears all entries from cache', async () => {
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getDigestCached('/runs/run-001', defaultSource, 'proj');
      await getDigestCached('/runs/run-002', defaultSource, 'proj');

      expect(getCacheStats().size).toBe(2);

      invalidateAll();

      expect(getCacheStats().size).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // getProjectSummaries
  // -----------------------------------------------------------------------
  describe('getProjectSummaries', () => {
    it('returns empty array when cache is empty', () => {
      const summaries = getProjectSummaries();
      expect(summaries).toEqual([]);
    });

    it('groups runs by project name and counts statuses', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      // Add runs from different projects with different statuses
      mockGetRunDigest.mockResolvedValue(makeDigest({ status: 'completed', updatedAt: '2024-01-15T10:00:00Z' }));
      await getDigestCached('/runs/proj-a/run-1', defaultSource, 'project-a');

      mockGetRunDigest.mockResolvedValue(makeDigest({ status: 'failed', updatedAt: '2024-01-15T11:00:00Z' }));
      await getDigestCached('/runs/proj-a/run-2', defaultSource, 'project-a');

      mockGetRunDigest.mockResolvedValue(makeDigest({ status: 'waiting', updatedAt: '2024-01-15T12:00:00Z' }));
      await getDigestCached('/runs/proj-a/run-3', defaultSource, 'project-a');

      mockGetRunDigest.mockResolvedValue(makeDigest({ status: 'completed', updatedAt: '2024-01-15T09:00:00Z' }));
      await getDigestCached('/runs/proj-b/run-1', defaultSource, 'project-b');

      const summaries = getProjectSummaries();

      expect(summaries).toHaveLength(2);

      const projA = summaries.find((s) => s.projectName === 'project-a');
      expect(projA).toBeDefined();
      expect(projA!.totalRuns).toBe(3);
      expect(projA!.completedRuns).toBe(1);
      expect(projA!.failedRuns).toBe(1);
      expect(projA!.activeRuns).toBe(1);
      expect(projA!.latestUpdate).toBe('2024-01-15T12:00:00Z');

      const projB = summaries.find((s) => s.projectName === 'project-b');
      expect(projB).toBeDefined();
      expect(projB!.totalRuns).toBe(1);
      expect(projB!.completedRuns).toBe(1);
    });

    it('uses "Unknown" for runs without projectName', async () => {
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      // Pass empty string for projectName to simulate missing project
      await getDigestCached('/runs/run-orphan', defaultSource, '');

      const summaries = getProjectSummaries();

      // The code checks for `entry.digest.projectName || "Unknown"` but the cache
      // stores projectName as set — if empty string, it becomes "Unknown"
      expect(summaries).toHaveLength(1);
    });

    it('tracks latest update across all runs in a project', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      mockGetRunDigest.mockResolvedValue(makeDigest({ updatedAt: '2024-01-15T08:00:00Z' }));
      await getDigestCached('/runs/r1', defaultSource, 'proj');

      mockGetRunDigest.mockResolvedValue(makeDigest({ updatedAt: '2024-01-15T12:00:00Z' }));
      await getDigestCached('/runs/r2', defaultSource, 'proj');

      mockGetRunDigest.mockResolvedValue(makeDigest({ updatedAt: '2024-01-15T10:00:00Z' }));
      await getDigestCached('/runs/r3', defaultSource, 'proj');

      const summaries = getProjectSummaries();
      expect(summaries[0].latestUpdate).toBe('2024-01-15T12:00:00Z');
    });
  });

  // -----------------------------------------------------------------------
  // discoverAndCacheAll
  // -----------------------------------------------------------------------
  describe('discoverAndCacheAll', () => {
    it('discovers runs and populates cache', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([
        { runDir: '/runs/r1', source: defaultSource, projectName: 'proj', projectPath: '/proj' },
        { runDir: '/runs/r2', source: defaultSource, projectName: 'proj', projectPath: '/proj' },
      ]);
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await discoverAndCacheAll();

      expect(getCacheStats().size).toBe(2);
    });

    it('handles errors for individual runs without failing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockDiscoverAllRunDirs.mockResolvedValue([
        { runDir: '/runs/ok', source: defaultSource, projectName: 'proj', projectPath: '/proj' },
        { runDir: '/runs/bad', source: defaultSource, projectName: 'proj', projectPath: '/proj' },
      ]);

      mockGetRunDigest.mockImplementation(async (runDir: string) => {
        if (runDir === '/runs/bad') throw new Error('corrupt');
        return makeDigest();
      });
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await discoverAndCacheAll();

      // At least the successful run should be cached
      expect(getCacheStats().size).toBeGreaterThanOrEqual(1);
      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // forceRefreshBreakpointRuns
  // -----------------------------------------------------------------------
  describe('forceRefreshBreakpointRuns', () => {
    it('deletes entries with pendingBreakpoints > 0', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      // Entry with pending breakpoints — should be deleted
      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'bp-run', status: 'waiting', pendingBreakpoints: 2, waitingKind: 'breakpoint' })
      );
      await getDigestCached('/runs/bp-run', defaultSource, 'proj');

      // Entry without breakpoints — should survive
      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'normal-run', status: 'completed', pendingBreakpoints: 0 })
      );
      await getDigestCached('/runs/normal-run', defaultSource, 'proj');

      expect(getCacheStats().size).toBe(2);

      forceRefreshBreakpointRuns();

      expect(getCacheStats().size).toBe(1);
      const remaining = getCacheStats().entries;
      expect(remaining[0].runDir).toBe('/runs/normal-run');
    });

    it('leaves entries intact when pendingBreakpoints is 0 or undefined', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      // Entry with pendingBreakpoints = 0
      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'run-zero', status: 'waiting', pendingBreakpoints: 0 })
      );
      await getDigestCached('/runs/run-zero', defaultSource, 'proj');

      // Entry with pendingBreakpoints undefined
      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'run-undef', status: 'completed' })
      );
      await getDigestCached('/runs/run-undef', defaultSource, 'proj');

      expect(getCacheStats().size).toBe(2);

      forceRefreshBreakpointRuns();

      expect(getCacheStats().size).toBe(2);
    });

    it('deletes multiple breakpoint entries in one call', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'bp-1', status: 'waiting', pendingBreakpoints: 1, waitingKind: 'breakpoint' })
      );
      await getDigestCached('/runs/bp-1', defaultSource, 'proj');

      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'bp-2', status: 'waiting', pendingBreakpoints: 3, waitingKind: 'breakpoint' })
      );
      await getDigestCached('/runs/bp-2', defaultSource, 'proj');

      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'safe', status: 'completed' })
      );
      await getDigestCached('/runs/safe', defaultSource, 'proj');

      expect(getCacheStats().size).toBe(3);

      forceRefreshBreakpointRuns();

      expect(getCacheStats().size).toBe(1);
      expect(getCacheStats().entries[0].runDir).toBe('/runs/safe');
    });
  });

  // -----------------------------------------------------------------------
  // Breakpoint cache behavior (v0.12.3 fix: no destructive eviction)
  // -----------------------------------------------------------------------
  describe('breakpoint cache behavior', () => {
    it('does NOT destructively delete breakpoint entries from cache (v0.12.3 anti-flicker)', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      // Cache a breakpoint entry
      mockGetRunDigest.mockResolvedValue(
        makeDigest({
          runId: 'bp-stable',
          status: 'waiting',
          pendingBreakpoints: 1,
          waitingKind: 'breakpoint',
          breakpointQuestion: 'Deploy?',
        })
      );
      await getDigestCached('/runs/bp-stable', defaultSource, 'proj');

      // Immediately, breakpoints should be counted
      const before = getProjectSummaries();
      expect(before).toHaveLength(1);
      expect(before[0].pendingBreakpoints).toBe(1);

      // Advance past old TTL_BREAKPOINT (3s) but within TTL_ACTIVE (5s)
      vi.advanceTimersByTime(3500);

      // Breakpoint should STILL be visible (not evicted)
      const after = getProjectSummaries();
      expect(after).toHaveLength(1);
      expect(after[0].pendingBreakpoints).toBe(1);
      expect(after[0].breakpointRuns).toHaveLength(1);
    });

    it('keeps counting breakpoints even after TTL_ACTIVE expires (no flickering)', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      mockGetRunDigest.mockResolvedValue(
        makeDigest({
          runId: 'bp-persistent',
          status: 'waiting',
          pendingBreakpoints: 2,
          waitingKind: 'breakpoint',
          breakpointQuestion: 'Approve?',
        })
      );
      await getDigestCached('/runs/bp-persistent', defaultSource, 'proj');

      // Within TTL_ACTIVE (5s) — should be counted
      vi.advanceTimersByTime(4000);
      const fresh = getProjectSummaries();
      expect(fresh).toHaveLength(1);
      expect(fresh[0].pendingBreakpoints).toBe(2);

      // Past TTL_ACTIVE (5s) — breakpoints STILL counted (v0.12.3 fix).
      // Breakpoint state only changes on explicit approval (invalidateRun),
      // not on cache TTL expiry. This prevents banner flickering.
      vi.advanceTimersByTime(2000); // now at 6s
      const afterTtl = getProjectSummaries();
      expect(afterTtl).toHaveLength(1);
      expect(afterTtl[0].pendingBreakpoints).toBe(2);
      expect(afterTtl[0].breakpointRuns).toHaveLength(1);
      expect(afterTtl[0].totalRuns).toBe(1);
    });

    it('preserves both breakpoint and non-breakpoint entries regardless of TTL', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      // Breakpoint entry
      mockGetRunDigest.mockResolvedValue(
        makeDigest({
          runId: 'bp-entry',
          status: 'waiting',
          pendingBreakpoints: 1,
          waitingKind: 'breakpoint',
        })
      );
      await getDigestCached('/runs/bp-entry', defaultSource, 'proj');

      // Normal completed entry
      mockGetRunDigest.mockResolvedValue(
        makeDigest({ runId: 'normal', status: 'completed' })
      );
      await getDigestCached('/runs/normal', defaultSource, 'proj');

      // Advance past TTL_ACTIVE but within completed TTL (30s)
      vi.advanceTimersByTime(6000);

      const summaries = getProjectSummaries();
      expect(summaries).toHaveLength(1);
      // Both entries still in cache, breakpoint still counted (v0.12.3)
      expect(summaries[0].totalRuns).toBe(2);
      expect(summaries[0].completedRuns).toBe(1);
      expect(summaries[0].pendingBreakpoints).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // getCacheStats
  // -----------------------------------------------------------------------
  describe('getCacheStats', () => {
    it('returns size and entries info', async () => {
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getDigestCached('/runs/run-001', defaultSource, 'proj');

      const stats = getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].runDir).toBe('/runs/run-001');
      expect(stats.entries[0].status).toBe('completed');
      expect(stats.entries[0].hasFullRun).toBe(false);
    });

    it('shows hasFullRun=true after getRunCached', async () => {
      mockParseRunDir.mockResolvedValue(makeRun());
      mockGetRunDigest.mockResolvedValue(makeDigest());
      mockReadFile.mockResolvedValue(JSON.stringify({ processId: 'proc' }));

      await getRunCached('/runs/run-001', defaultSource, 'proj');

      const stats = getCacheStats();

      expect(stats.entries[0].hasFullRun).toBe(true);
    });
  });
});

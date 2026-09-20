import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRunDashboard } from '../use-run-dashboard';
import { createMockProjectSummary, createMockRun } from '@/test/fixtures';
import type { LightRun } from '@/lib/services/run-query-service';
import type { Run } from '@/types';

// Mock useProjects
const mockRefresh = vi.fn();
vi.mock('../use-projects', () => ({
  useProjects: vi.fn(() => ({
    projects: [],
    recentCompletionWindowMs: 14400000,
    loading: false,
    error: undefined,
    refresh: mockRefresh,
  })),
}));

// §15.4 (owner gate 2026-07-06b, hidden model A): tiles/pills/banner now
// reconcile against the FULL-RUN list (the single counting source), not the
// per-project digest sums. Mock the full-run feed and drive the count
// assertions from real LightRuns. Grid/project tests keep using useProjects.
vi.mock('../use-all-runs', () => ({
  useAllRuns: vi.fn(() => ({ runs: [], totalCount: 0, loading: false, error: undefined })),
}));
import { useAllRuns } from '../use-all-runs';
const mockedUseAllRuns = vi.mocked(useAllRuns);

/** Build a LightRun for the counting-source input. */
function lightRun(overrides: Partial<LightRun> = {}): LightRun {
  const run = createMockRun(overrides as Partial<Run>);
  const { events, ...rest } = run;
  return { ...rest, events: [] as never[], totalEvents: events.length, ...overrides } as LightRun;
}

/** Point the mocked full-run feed at a fixture set. */
function setRuns(runs: LightRun[]) {
  mockedUseAllRuns.mockReturnValue({
    runs,
    totalCount: runs.length,
    loading: false,
    error: undefined,
  });
}

// Mock usePersistedState to behave like useState
vi.mock('../use-persisted-state', () => ({
  usePersistedState: <T>(key: string, defaultValue: T) => {
    const { useState } = require('react');
    return useState<T>(defaultValue);
  },
}));

// Import the mocked module so we can change its return value
import { useProjects } from '../use-projects';
const mockedUseProjects = vi.mocked(useProjects);

describe('useRunDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseProjects.mockReturnValue({
      projects: [],
      recentCompletionWindowMs: 14400000,
      loading: false,
      error: undefined,
      refresh: mockRefresh,
    });
    setRuns([]);
  });

  it('returns default state when no projects', () => {
    const { result } = renderHook(() => useRunDashboard());

    expect(result.current.projects).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.statusFilter).toBe('all');
    expect(result.current.sortMode).toBe('status');
    expect(result.current.metrics.totalRuns).toBe(0);
    expect(result.current.hasStaleRuns).toBe(false);
  });

  it('aggregates metrics from the full-run counting source (§15.4)', () => {
    // 4 active (live, non-stale) + 11 completed + 3 failed + 1 stale = 19 runs.
    setRuns([
      ...Array.from({ length: 4 }, () => lightRun({ status: 'waiting', driver: 'live' })),
      ...Array.from({ length: 11 }, () => lightRun({ status: 'completed' })),
      ...Array.from({ length: 3 }, () => lightRun({ status: 'failed' })),
      lightRun({ status: 'waiting', isStale: true, driver: 'none' }),
    ]);

    const { result } = renderHook(() => useRunDashboard());

    expect(result.current.metrics.totalRuns).toBe(19);
    expect(result.current.metrics.activeRuns).toBe(4);
    expect(result.current.metrics.completedRuns).toBe(11);
    expect(result.current.metrics.failedRuns).toBe(3);
    expect(result.current.metrics.staleRuns).toBe(1);
    expect(result.current.hasStaleRuns).toBe(true);
  });

  it('toggleMetricFilter toggles between filter and "all"', () => {
    const { result } = renderHook(() => useRunDashboard());

    act(() => {
      result.current.toggleMetricFilter('failed');
    });
    expect(result.current.statusFilter).toBe('failed');

    act(() => {
      result.current.toggleMetricFilter('failed');
    });
    expect(result.current.statusFilter).toBe('all');
  });

  it('filters projects by status', () => {
    mockedUseProjects.mockReturnValue({
      projects: [
        createMockProjectSummary({ projectName: 'a', failedRuns: 2, activeRuns: 0 }),
        createMockProjectSummary({ projectName: 'b', failedRuns: 0, activeRuns: 1 }),
      ],
      recentCompletionWindowMs: 14400000,
      loading: false,
      error: undefined,
      refresh: mockRefresh,
    });

    const { result } = renderHook(() => useRunDashboard());

    act(() => {
      result.current.setStatusFilter('failed');
    });

    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].projectName).toBe('a');
  });

  it('handleHideProject calls refresh', () => {
    const { result } = renderHook(() => useRunDashboard());

    act(() => {
      result.current.handleHideProject('some-project');
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('maps stale statusFilter to "all" for cardStatusFilter', () => {
    const { result } = renderHook(() => useRunDashboard());

    act(() => {
      result.current.setStatusFilter('stale');
    });

    expect(result.current.cardStatusFilter).toBe('all');
  });

  it('computes filterCounts from the reconciled counting source', () => {
    // 3 active + 10 completed + 2 failed + 1 stale = 16 runs.
    setRuns([
      ...Array.from({ length: 3 }, () => lightRun({ status: 'waiting', driver: 'live' })),
      ...Array.from({ length: 10 }, () => lightRun({ status: 'completed' })),
      ...Array.from({ length: 2 }, () => lightRun({ status: 'failed' })),
      lightRun({ status: 'waiting', isStale: true, driver: 'none' }),
    ]);

    const { result } = renderHook(() => useRunDashboard());

    expect(result.current.filterCounts.all).toBe(16);
    expect(result.current.filterCounts.waiting).toBe(3);
    expect(result.current.filterCounts.completed).toBe(10);
    expect(result.current.filterCounts.failed).toBe(2);
    expect(result.current.filterCounts.stale).toBe(1);
  });

  it('counts orphaned from the full-run orphaned predicate (== board column)', () => {
    // 5 non-terminal runs with no live driver → orphaned pill.
    setRuns(Array.from({ length: 5 }, () => lightRun({ status: 'waiting', driver: 'none' })));

    const { result } = renderHook(() => useRunDashboard());

    expect(result.current.filterCounts.orphaned).toBe(5);
    // pill === column + disclosed deltas (invariant, AC-73).
    const c = result.current.reconciledCounts.orphaned;
    expect(c.pill).toBe(c.column + c.underNeedsYou + c.fromHidden + c.hiddenCollapsed);
  });

  it('filters projects by orphaned using the orphanedRuns aggregate', () => {
    mockedUseProjects.mockReturnValue({
      projects: [
        createMockProjectSummary({ projectName: 'has-orphan', orphanedRuns: 1 }),
        createMockProjectSummary({ projectName: 'no-orphan', orphanedRuns: 0 }),
      ],
      recentCompletionWindowMs: 14400000,
      loading: false,
      error: undefined,
      refresh: mockRefresh,
    });

    const { result } = renderHook(() => useRunDashboard());

    act(() => {
      result.current.setStatusFilter('orphaned');
    });

    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].projectName).toBe('has-orphan');
  });

  it('computes bannerFingerprint from the reconciled issue metrics', () => {
    setRuns([
      ...Array.from({ length: 2 }, () => lightRun({ status: 'failed' })),
      lightRun({ status: 'waiting', isStale: true, driver: 'none' }),
    ]);

    const { result } = renderHook(() => useRunDashboard());

    // fingerprint format: failedRuns-staleRuns-pendingBreakpoints
    expect(result.current.bannerFingerprint).toBe('2-1-0');
  });

  // QA F4: hiddenProjects must not silently swallow needs-you. Hiding affects
  // the project grid only — the alarm surface (banner + needs-you counts)
  // still includes hidden projects.
  describe('hidden projects (QA F4)', () => {
    const hiddenBp = {
      runId: 'run-hidden-1',
      effectId: 'eff-1',
      projectName: 'wc26-pool',
      processId: 'proc-1',
      breakpointQuestion: 'Deploy?',
    };

    beforeEach(() => {
      mockedUseProjects.mockReturnValue({
        projects: [
          createMockProjectSummary({ projectName: 'visible-a', pendingBreakpoints: 2 }),
          createMockProjectSummary({ projectName: 'visible-b', pendingBreakpoints: 1 }),
          createMockProjectSummary({
            projectName: 'wc26-pool',
            hidden: true,
            pendingBreakpoints: 1,
            breakpointRuns: [hiddenBp],
            totalRuns: 4,
          }),
        ],
        recentCompletionWindowMs: 14400000,
        loading: false,
        error: undefined,
        refresh: mockRefresh,
      });
      // Full-run counting source (§15.4): 3 visible needs-you + 1 hidden
      // (wc26-pool) needs-you = 4 all-scope; 17 more visible completed → 20
      // visible total. The hidden needs-you run is disclosed as "1 from hidden".
      setRuns([
        lightRun({ projectName: 'visible-a', status: 'waiting', pendingBreakpoints: 1 }),
        lightRun({ projectName: 'visible-a', status: 'waiting', pendingBreakpoints: 1 }),
        lightRun({ projectName: 'visible-b', status: 'waiting', pendingBreakpoints: 1 }),
        lightRun({ projectName: 'wc26-pool', status: 'waiting', pendingBreakpoints: 1 }),
        ...Array.from({ length: 17 }, () =>
          lightRun({ projectName: 'visible-a', status: 'completed' })
        ),
      ]);
    });

    it('includes hidden projects in the breakpoint banner list', () => {
      const { result } = renderHook(() => useRunDashboard());
      expect(result.current.allBreakpointRuns).toContainEqual(hiddenBp);
    });

    it('includes hidden projects in the needs-you count (banner says truth: 4, not 3)', () => {
      const { result } = renderHook(() => useRunDashboard());
      expect(result.current.filterCounts.needsyou).toBe(4);
      expect(result.current.summaryMetrics.pendingBreakpoints).toBe(4);
    });

    it('excludes hidden projects from the grid and grid metrics', () => {
      const { result } = renderHook(() => useRunDashboard());
      // statusFilter defaults to "all" → grid view
      expect(result.current.filteredProjects.map((p) => p.projectName)).toEqual([
        'visible-a',
        'visible-b',
      ]);
      // KPI totals only cover visible projects (default fixture totalRuns=10)
      expect(result.current.metrics.totalRuns).toBe(20);
      expect(result.current.summaryMetrics.totalProjects).toBe(2);
    });

    it('surfaces hidden projects under the needs-you filter so count === list', () => {
      const { result } = renderHook(() => useRunDashboard());
      act(() => {
        result.current.setStatusFilter('needsyou');
      });
      expect(result.current.filteredProjects.map((p) => p.projectName)).toContain('wc26-pool');
    });

    it('exposes hiddenProjectCount for the "N hidden" indicator', () => {
      const { result } = renderHook(() => useRunDashboard());
      expect(result.current.hiddenProjectCount).toBe(1);
    });
  });
});

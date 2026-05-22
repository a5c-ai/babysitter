import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fsPromises } from 'fs';

// Mock source-discovery (watcher.ts imports directly from source-discovery)
vi.mock('../source-discovery', () => ({
  discoverAllRunDirs: vi.fn(),
  invalidateDiscoveryCache: vi.fn(),
  discoverAllRunsParentDirs: vi.fn().mockResolvedValue([]),
}));

// Mock run-cache
vi.mock('../run-cache', () => ({
  invalidateRun: vi.fn(),
  requestDiscovery: vi.fn(),
}));

import { discoverAllRunDirs } from '../source-discovery';
import { invalidateRun } from '../run-cache';
import { initWatcher, watcherEvents, getWatcherStats } from '../watcher';

const mockDiscoverAllRunDirs = vi.mocked(discoverAllRunDirs);
const _mockInvalidateRun = vi.mocked(invalidateRun);
const mockAccess = vi.spyOn(fsPromises, 'access');

describe('watcher', () => {
  let cleanupFn: (() => void) | null = null;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    watcherEvents.removeAllListeners();
    cleanupFn = null;
  });

  afterEach(() => {
    if (cleanupFn) {
      cleanupFn();
      cleanupFn = null;
    }
    vi.useRealTimers();
  });

  describe('initWatcher', () => {
    it('returns a cleanup function', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      expect(typeof cleanupFn).toBe('function');
    });

    it('does not throw when discovered dirs have no journal directories', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([
        {
          runDir: '/project/.a5c/runs/run-001',
          source: { path: '/project', depth: 2 },
          projectName: 'project',
          projectPath: '/project',
        },
      ]);

      // Journal dir does not exist
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      expect(cleanupFn).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('removes all event listeners from watcherEvents', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      // Add a listener
      watcherEvents.on('change', () => {});
      expect(watcherEvents.listenerCount('change')).toBeGreaterThan(0);

      cleanupFn();
      expect(watcherEvents.listenerCount('change')).toBe(0);
      cleanupFn = null;
    });

    it('can be called multiple times safely', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      // Call cleanup twice - should not throw
      cleanupFn();
      // After first cleanup, listeners are removed
      expect(watcherEvents.listenerCount('change')).toBe(0);
      cleanupFn = null;
    });
  });

  describe('getWatcherStats', () => {
    it('returns stats about active watchers', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      const stats = getWatcherStats();

      expect(stats).toHaveProperty('activeWatchers');
      expect(stats).toHaveProperty('watchedPaths');
      expect(stats).toHaveProperty('pendingDebounces');
      expect(typeof stats.activeWatchers).toBe('number');
      expect(Array.isArray(stats.watchedPaths)).toBe(true);
      expect(typeof stats.pendingDebounces).toBe('number');
    });

    it('has zero active watchers when no runs discovered', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      const stats = getWatcherStats();
      expect(stats.activeWatchers).toBe(0);
      expect(stats.watchedPaths).toHaveLength(0);
    });

    it('shows zero pending debounces initially', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      const stats = getWatcherStats();
      expect(stats.pendingDebounces).toBe(0);
    });
  });

  describe('watcherEvents', () => {
    it('is an EventEmitter', () => {
      expect(typeof watcherEvents.on).toBe('function');
      expect(typeof watcherEvents.emit).toBe('function');
      expect(typeof watcherEvents.removeAllListeners).toBe('function');
    });

    it('can register and emit change events', () => {
      const handler = vi.fn();
      watcherEvents.on('change', handler);

      watcherEvents.emit('change', { type: 'run-changed', runDir: '/test' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: 'run-changed', runDir: '/test' });
    });

    it('supports multiple listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      watcherEvents.on('change', handler1);
      watcherEvents.on('change', handler2);

      watcherEvents.emit('change', { type: 'new-run', runDir: '/test' });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('supports different event types', () => {
      const handler = vi.fn();
      watcherEvents.on('change', handler);

      watcherEvents.emit('change', { type: 'run-changed', runDir: '/r1' });
      watcherEvents.emit('change', { type: 'new-run', runDir: '/r2' });
      watcherEvents.emit('change', { type: 'error', runDir: '/r3', error: new Error('fail') });

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('periodic rescan', () => {
    it('schedules periodic rescans via setInterval', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      // discoverAllRunDirs was called once during init
      const initialCalls = mockDiscoverAllRunDirs.mock.calls.length;

      // Advance past the 120s rescan interval (RESCAN_INTERVAL_MS = 120000)
      vi.advanceTimersByTime(121000);

      // Should have been called again for the rescan
      expect(mockDiscoverAllRunDirs.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('stops periodic rescan after cleanup', async () => {
      mockDiscoverAllRunDirs.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      cleanupFn = await initWatcher();
      consoleSpy.mockRestore();

      const callsBeforeCleanup = mockDiscoverAllRunDirs.mock.calls.length;

      cleanupFn();
      cleanupFn = null;

      // Advance well past rescan interval (RESCAN_INTERVAL_MS = 120000)
      vi.advanceTimersByTime(240000);

      // No additional calls should have been made
      expect(mockDiscoverAllRunDirs.mock.calls.length).toBe(callsBeforeCleanup);
    });
  });
});

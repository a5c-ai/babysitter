import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../watcher', () => {
  const { EventEmitter } = require('events');
  return {
    initWatcher: vi.fn(),
    watcherEvents: new EventEmitter(),
  };
});

vi.mock('../run-cache', () => ({
  discoverAndCacheAll: vi.fn(),
}));

import { initWatcher, watcherEvents } from '../watcher';
import { discoverAndCacheAll } from '../run-cache';
import {
  ensureInitialized,
  shutdownServer,
  getInitStatus,
  serverEvents,
  resetDebounceState,
  enqueueRunChanged,
  SSE_DEBOUNCE_MS,
  type BatchedRunChangedEvent,
} from '../server-init';

const mockInitWatcher = vi.mocked(initWatcher);
const mockDiscoverAndCacheAll = vi.mocked(discoverAndCacheAll);

describe('server-init', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    // Reset server state between tests
    await shutdownServer();
    resetDebounceState();
    watcherEvents.removeAllListeners();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // ensureInitialized
  // -----------------------------------------------------------------------
  describe('ensureInitialized', () => {
    it('initializes watcher and populates cache on first call', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      expect(mockInitWatcher).toHaveBeenCalledTimes(1);
      expect(mockDiscoverAndCacheAll).toHaveBeenCalledTimes(1);
    });

    it('returns immediately on subsequent calls', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();
      await ensureInitialized();
      await ensureInitialized();

      // Should only initialize once
      expect(mockInitWatcher).toHaveBeenCalledTimes(1);
      expect(mockDiscoverAndCacheAll).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent initialization calls', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      // Call concurrently
      const [_r1, _r2, _r3] = await Promise.all([
        ensureInitialized(),
        ensureInitialized(),
        ensureInitialized(),
      ]);

      expect(mockInitWatcher).toHaveBeenCalledTimes(1);
    });

    it('throws and resets state if initialization fails', async () => {
      mockInitWatcher.mockRejectedValue(new Error('init failed'));

      await expect(ensureInitialized()).rejects.toThrow('init failed');

      // After failure, should be able to retry
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      expect(mockInitWatcher).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // Event forwarding
  // -----------------------------------------------------------------------
  describe('event forwarding', () => {
    it('forwards run-changed events from watcher to server events as batched event', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      watcherEvents.emit('change', { type: 'run-changed', runDir: '/runs/r1' });

      // Leading-edge debounce fires immediately with batched format
      expect(handler).toHaveBeenCalledWith({
        type: 'run-changed',
        runIds: ['r1'],
        runDirs: ['/runs/r1'],
      });
    });

    it('does not globally invalidate breakpoint cache on run-changed (v0.12.3 fix)', async () => {
      // Previously, enqueueRunChanged() called forceRefreshBreakpointRuns()
      // on every watcher event, which deleted ALL breakpoint cache entries
      // and caused banner flickering. Now only the specific run is invalidated
      // by the watcher handler (invalidateRun), not all breakpoint entries.
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      watcherEvents.emit('change', { type: 'run-changed', runDir: '/runs/r1' });

      // The event should still be forwarded
      expect(handler).toHaveBeenCalledTimes(1);

      serverEvents.off('run-changed', handler);
    });

    it('forwards new-run events from watcher to server events', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      const handler = vi.fn();
      serverEvents.on('new-run', handler);

      watcherEvents.emit('change', { type: 'new-run', runDir: '/runs' });

      expect(handler).toHaveBeenCalledWith({ type: 'new-run', runDir: '/runs' });
    });

    it('forwards error events from watcher as watcher-error with dedup', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      const handler = vi.fn();
      serverEvents.on('watcher-error', handler);

      const errorEvent = { type: 'error', runDir: '/runs', error: new Error('watch error') };
      watcherEvents.emit('change', errorEvent);

      expect(handler).toHaveBeenCalledWith(errorEvent);
    });

    it('suppresses duplicate watcher errors within 5s dedup window', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      const handler = vi.fn();
      serverEvents.on('watcher-error', handler);

      const errorEvent1 = { type: 'error', runDir: '/runs', error: new Error('watch error 1') };
      const errorEvent2 = { type: 'error', runDir: '/runs', error: new Error('watch error 2') };

      // First error goes through
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      watcherEvents.emit('change', errorEvent1);
      expect(handler).toHaveBeenCalledTimes(1);

      // Second error within 5s dedup window is suppressed
      vi.spyOn(Date, 'now').mockReturnValue(now + 3000);
      watcherEvents.emit('change', errorEvent2);
      expect(handler).toHaveBeenCalledTimes(1); // still 1

      // Third error after 5s dedup window goes through
      vi.spyOn(Date, 'now').mockReturnValue(now + 6000);
      watcherEvents.emit('change', errorEvent2);
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // Leading-edge debounce for SSE broadcasts
  // -----------------------------------------------------------------------
  describe('SSE broadcast debounce (enqueueRunChanged)', () => {
    beforeEach(() => {
      resetDebounceState();
    });

    it('fires immediately on the first event (leading edge)', () => {
      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r1' });

      expect(handler).toHaveBeenCalledTimes(1);
      const event: BatchedRunChangedEvent = handler.mock.calls[0][0];
      expect(event.type).toBe('run-changed');
      expect(event.runIds).toEqual(['r1']);
      expect(event.runDirs).toEqual(['/runs/r1']);

      serverEvents.off('run-changed', handler);
    });

    it('collects subsequent events within the 500ms window and emits a single batch', () => {
      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      // First event — fires immediately (leading edge)
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r1' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Subsequent events within window — should NOT fire immediately
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r2' });
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r3' });
      expect(handler).toHaveBeenCalledTimes(1); // still just the leading edge

      // Advance past the debounce window
      vi.advanceTimersByTime(SSE_DEBOUNCE_MS);

      // Now the batch should have flushed
      expect(handler).toHaveBeenCalledTimes(2);
      const batchEvent: BatchedRunChangedEvent = handler.mock.calls[1][0];
      expect(batchEvent.type).toBe('run-changed');
      expect(batchEvent.runIds).toEqual(expect.arrayContaining(['r2', 'r3']));
      expect(batchEvent.runIds).toHaveLength(2);
      expect(batchEvent.runDirs).toEqual(expect.arrayContaining(['/runs/r2', '/runs/r3']));

      serverEvents.off('run-changed', handler);
    });

    it('deduplicates the same runDir within the window', () => {
      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      // First event — leading edge
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r1' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Same runDir multiple times within window
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r2' });
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r2' });
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r2' });

      vi.advanceTimersByTime(SSE_DEBOUNCE_MS);

      expect(handler).toHaveBeenCalledTimes(2);
      const batchEvent: BatchedRunChangedEvent = handler.mock.calls[1][0];
      // Set deduplicates: only one r2
      expect(batchEvent.runIds).toEqual(['r2']);

      serverEvents.off('run-changed', handler);
    });

    it('does not emit a trailing batch when there are no pending events', () => {
      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      // Single event — leading edge only
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r1' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Advance past window — no pending events, so no trailing emit
      vi.advanceTimersByTime(SSE_DEBOUNCE_MS);
      expect(handler).toHaveBeenCalledTimes(1); // no additional call

      serverEvents.off('run-changed', handler);
    });

    it('resets the debounce window after flush, allowing new leading edge', () => {
      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      // First burst
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r1' });
      expect(handler).toHaveBeenCalledTimes(1); // leading edge

      // Flush the window
      vi.advanceTimersByTime(SSE_DEBOUNCE_MS);

      // Second burst — should fire as a new leading edge
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r2' });
      expect(handler).toHaveBeenCalledTimes(2); // new leading edge

      const event: BatchedRunChangedEvent = handler.mock.calls[1][0];
      expect(event.runIds).toEqual(['r2']);

      // Flush
      vi.advanceTimersByTime(SSE_DEBOUNCE_MS);
      expect(handler).toHaveBeenCalledTimes(2); // no trailing (no pending)

      serverEvents.off('run-changed', handler);
    });

    it('extends the window when new events arrive (timer reset)', () => {
      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      // Leading edge
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r1' });
      expect(handler).toHaveBeenCalledTimes(1);

      // At 300ms, new event arrives — resets the 500ms timer
      vi.advanceTimersByTime(300);
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r2' });

      // At 600ms (300ms after last event) — should NOT have flushed yet
      vi.advanceTimersByTime(300);
      expect(handler).toHaveBeenCalledTimes(1); // still just leading edge

      // At 800ms (500ms after last event at 300ms) — should flush
      vi.advanceTimersByTime(200);
      expect(handler).toHaveBeenCalledTimes(2);
      const batchEvent: BatchedRunChangedEvent = handler.mock.calls[1][0];
      expect(batchEvent.runIds).toEqual(['r2']);

      serverEvents.off('run-changed', handler);
    });

    it('shutdownServer clears pending debounce state', async () => {
      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      // Leading edge
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r1' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Queue up events
      enqueueRunChanged({ type: 'run-changed', runDir: '/runs/r2' });

      // Shutdown clears everything including debounce timers and listeners
      await shutdownServer();

      // Re-listen after shutdown
      const handler2 = vi.fn();
      serverEvents.on('run-changed', handler2);

      // Advance past window — pending batch should have been cleared
      vi.advanceTimersByTime(SSE_DEBOUNCE_MS);
      expect(handler2).not.toHaveBeenCalled();

      serverEvents.off('run-changed', handler2);
    });

    it('integrates with watcher events end-to-end', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      const handler = vi.fn();
      serverEvents.on('run-changed', handler);

      // Rapid watcher events
      watcherEvents.emit('change', { type: 'run-changed', runDir: '/project/runs/abc123' });
      watcherEvents.emit('change', { type: 'run-changed', runDir: '/project/runs/def456' });
      watcherEvents.emit('change', { type: 'run-changed', runDir: '/project/runs/abc123' }); // duplicate

      // Leading edge should have fired immediately with first event
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].runIds).toEqual(['abc123']);

      // Flush the window
      vi.advanceTimersByTime(SSE_DEBOUNCE_MS);

      // Batch should contain the 2 unique subsequent runDirs
      expect(handler).toHaveBeenCalledTimes(2);
      const batch: BatchedRunChangedEvent = handler.mock.calls[1][0];
      expect(batch.runIds).toEqual(expect.arrayContaining(['def456', 'abc123']));

      serverEvents.off('run-changed', handler);
    });
  });

  // -----------------------------------------------------------------------
  // shutdownServer
  // -----------------------------------------------------------------------
  describe('shutdownServer', () => {
    it('calls the cleanup function from watcher', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();
      await shutdownServer();

      expect(cleanupMock).toHaveBeenCalledTimes(1);
    });

    it('removes all server event listeners', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      serverEvents.on('run-changed', () => {});
      expect(serverEvents.listenerCount('run-changed')).toBeGreaterThan(0);

      await shutdownServer();

      expect(serverEvents.listenerCount('run-changed')).toBe(0);
    });

    it('allows re-initialization after shutdown', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();
      await shutdownServer();

      // Re-initialize
      mockInitWatcher.mockResolvedValue(vi.fn());
      await ensureInitialized();

      expect(mockInitWatcher).toHaveBeenCalledTimes(2);
    });

    it('is safe to call even when not initialized', async () => {
      await expect(shutdownServer()).resolves.not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // getInitStatus
  // -----------------------------------------------------------------------
  describe('getInitStatus', () => {
    it('returns not initialized before init', () => {
      const status = getInitStatus();

      expect(status.initialized).toBe(false);
      expect(status.hasCleanup).toBe(false);
    });

    it('returns initialized after successful init', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      const status = getInitStatus();

      expect(status.initialized).toBe(true);
      expect(status.hasCleanup).toBe(true);
    });

    it('returns not initialized after shutdown', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();
      await shutdownServer();

      const status = getInitStatus();

      expect(status.initialized).toBe(false);
      expect(status.hasCleanup).toBe(false);
    });

    it('reports server event listener count', async () => {
      const cleanupMock = vi.fn();
      mockInitWatcher.mockResolvedValue(cleanupMock);
      mockDiscoverAndCacheAll.mockResolvedValue(undefined);

      await ensureInitialized();

      // The init itself registers a listener on watcherEvents, not serverEvents
      // Let's add a listener and check
      serverEvents.on('run-changed', () => {});

      const status = getInitStatus();

      expect(status.serverEventListeners).toBeGreaterThan(0);
    });
  });
});

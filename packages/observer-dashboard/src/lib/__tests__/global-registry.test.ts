import { describe, it, expect, beforeEach } from 'vitest';
import { getGlobal, clearGlobal, clearAllGlobals } from '../global-registry';

describe('global-registry', () => {
  beforeEach(() => {
    clearAllGlobals();
  });

  // -----------------------------------------------------------------------
  // getGlobal
  // -----------------------------------------------------------------------
  describe('getGlobal', () => {
    it('initialises the value via factory on first call', () => {
      const result = getGlobal('__observer_run_cache__', () => new Map());

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('returns the same instance on subsequent calls (HMR persistence)', () => {
      const first = getGlobal('__observer_run_cache__', () => new Map());
      first.set('key', { some: 'value' });

      const second = getGlobal('__observer_run_cache__', () => new Map());

      expect(second).toBe(first);
      expect(second.size).toBe(1);
    });

    it('does not call factory again after initial creation', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return new Map();
      };

      getGlobal('__observer_run_cache__', factory);
      getGlobal('__observer_run_cache__', factory);
      getGlobal('__observer_run_cache__', factory);

      expect(callCount).toBe(1);
    });

    it('stores different keys independently', () => {
      const cache = getGlobal('__observer_run_cache__', () => new Map());
      const initState = getGlobal('__observer_init__', () => ({
        initialized: false,
        initPromise: null,
        cleanup: null,
      }));

      expect(cache).toBeInstanceOf(Map);
      expect(initState).toHaveProperty('initialized', false);
      expect(cache).not.toBe(initState);
    });

    it('creates the registry container on first access', () => {
      // Before any call, the registry might not exist
      globalThis.__observer_registry__ = undefined;

      getGlobal('__observer_run_cache__', () => new Map());

      expect(globalThis.__observer_registry__).toBeDefined();
      expect(globalThis.__observer_registry__!.__observer_run_cache__).toBeInstanceOf(Map);
    });

    it('works with complex object types (watcher state)', () => {
      const state = getGlobal('__observer_watchers__', () => ({
        activeWatchers: new Map(),
        debounceTimers: new Map(),
        rescanTimer: null,
      }));

      expect(state.activeWatchers).toBeInstanceOf(Map);
      expect(state.debounceTimers).toBeInstanceOf(Map);
      expect(state.rescanTimer).toBeNull();

      // Mutate and verify persistence
      state.rescanTimer = setTimeout(() => {}, 0);
      clearTimeout(state.rescanTimer);

      const samState = getGlobal('__observer_watchers__', () => ({
        activeWatchers: new Map(),
        debounceTimers: new Map(),
        rescanTimer: null,
      }));

      expect(samState).toBe(state);
      expect(samState.rescanTimer).not.toBeNull();
    });

    it('works with Set-containing types (debounce state)', () => {
      const ds = getGlobal('__observer_sse_debounce__', () => ({
        pendingRunDirs: new Set<string>(),
        timer: null,
        windowOpen: false,
      }));

      ds.pendingRunDirs.add('/runs/r1');
      ds.windowOpen = true;

      const same = getGlobal('__observer_sse_debounce__', () => ({
        pendingRunDirs: new Set<string>(),
        timer: null,
        windowOpen: false,
      }));

      expect(same.pendingRunDirs.has('/runs/r1')).toBe(true);
      expect(same.windowOpen).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // clearGlobal
  // -----------------------------------------------------------------------
  describe('clearGlobal', () => {
    it('removes a specific key from the registry', () => {
      getGlobal('__observer_run_cache__', () => new Map());
      getGlobal('__observer_init__', () => ({
        initialized: false,
        initPromise: null,
        cleanup: null,
      }));

      clearGlobal('__observer_run_cache__');

      // The init state should still exist
      expect(globalThis.__observer_registry__!.__observer_init__).toBeDefined();

      // The cache should be gone, so next getGlobal should create a new one
      const fresh = getGlobal('__observer_run_cache__', () => new Map());
      expect(fresh.size).toBe(0);
    });

    it('is safe to call when registry does not exist', () => {
      globalThis.__observer_registry__ = undefined;
      expect(() => clearGlobal('__observer_run_cache__')).not.toThrow();
    });

    it('is safe to call when key does not exist', () => {
      globalThis.__observer_registry__ = {};
      expect(() => clearGlobal('__observer_run_cache__')).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // clearAllGlobals
  // -----------------------------------------------------------------------
  describe('clearAllGlobals', () => {
    it('removes the entire registry', () => {
      getGlobal('__observer_run_cache__', () => new Map());
      getGlobal('__observer_init__', () => ({
        initialized: false,
        initPromise: null,
        cleanup: null,
      }));

      clearAllGlobals();

      expect(globalThis.__observer_registry__).toBeUndefined();
    });

    it('causes getGlobal to re-create values after clearing', () => {
      const original = getGlobal('__observer_run_cache__', () => new Map());
      original.set('key', 'value');

      clearAllGlobals();

      const fresh = getGlobal('__observer_run_cache__', () => new Map());
      expect(fresh).not.toBe(original);
      expect(fresh.size).toBe(0);
    });

    it('is safe to call multiple times', () => {
      clearAllGlobals();
      clearAllGlobals();
      clearAllGlobals();
      expect(globalThis.__observer_registry__).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // HMR simulation
  // -----------------------------------------------------------------------
  describe('HMR safety', () => {
    it('preserves state across simulated module re-evaluations', () => {
      // Simulate first module load: store data
      const cache1 = getGlobal('__observer_run_cache__', () => new Map());
      cache1.set('run-001', { digest: 'some-data' });

      // Simulate HMR: clear the module-level reference but NOT globalThis
      // (this is what actually happens during HMR — globalThis persists)
      // Just call getGlobal again as if the module were freshly evaluated
      const cache2 = getGlobal('__observer_run_cache__', () => new Map());

      expect(cache2).toBe(cache1);
      expect(cache2.get('run-001')).toEqual({ digest: 'some-data' });
    });

    it('preserves EventEmitter listeners across simulated HMR', async () => {
      const { EventEmitter } = await import('events');

      const emitter = getGlobal('__observer_watcher_events__', () => new EventEmitter());
      let called = false;
      emitter.on('test', () => { called = true; });

      // Simulate HMR: re-access the same global
      const sameEmitter = getGlobal('__observer_watcher_events__', () => new EventEmitter());
      sameEmitter.emit('test');

      expect(called).toBe(true);
    });
  });
});

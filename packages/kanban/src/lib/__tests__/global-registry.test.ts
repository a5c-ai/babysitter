import { describe, it, expect, beforeEach } from 'vitest';
import { getGlobal, clearGlobal, clearAllGlobals } from '../global-registry';

describe('global-registry', () => {
  beforeEach(() => {
    clearAllGlobals();
  });

  describe('getGlobal', () => {
    it('initialises the value via factory on first call', () => {
      const result = getGlobal('__kanban_run_cache__', () => new Map());

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('returns the same instance on subsequent calls (HMR persistence)', () => {
      const first = getGlobal('__kanban_run_cache__', () => new Map());
      first.set('key', { some: 'value' });

      const second = getGlobal('__kanban_run_cache__', () => new Map());

      expect(second).toBe(first);
      expect(second.size).toBe(1);
    });

    it('does not call factory again after initial creation', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return new Map();
      };

      getGlobal('__kanban_run_cache__', factory);
      getGlobal('__kanban_run_cache__', factory);
      getGlobal('__kanban_run_cache__', factory);

      expect(callCount).toBe(1);
    });

    it('stores different keys independently', () => {
      const cache = getGlobal('__kanban_run_cache__', () => new Map());
      const initState = getGlobal('__kanban_init__', () => ({
        initialized: false,
        initPromise: null,
        cleanup: null,
      }));

      expect(cache).toBeInstanceOf(Map);
      expect(initState).toHaveProperty('initialized', false);
      expect(cache).not.toBe(initState);
    });

    it('creates the registry container on first access', () => {
      globalThis.__kanban_registry__ = undefined;

      getGlobal('__kanban_run_cache__', () => new Map());

      expect(globalThis.__kanban_registry__).toBeDefined();
      expect(globalThis.__kanban_registry__!.__kanban_run_cache__).toBeInstanceOf(Map);
    });

    it('works with complex object types (watcher state)', () => {
      const state = getGlobal('__kanban_watchers__', () => ({
        activeWatchers: new Map(),
        debounceTimers: new Map(),
        rescanTimer: null,
      }));

      expect(state.activeWatchers).toBeInstanceOf(Map);
      expect(state.debounceTimers).toBeInstanceOf(Map);
      expect(state.rescanTimer).toBeNull();

      state.rescanTimer = setTimeout(() => {}, 0);
      clearTimeout(state.rescanTimer);

      const sameState = getGlobal('__kanban_watchers__', () => ({
        activeWatchers: new Map(),
        debounceTimers: new Map(),
        rescanTimer: null,
      }));

      expect(sameState).toBe(state);
      expect(sameState.rescanTimer).not.toBeNull();
    });

    it('works with Set-containing types (debounce state)', () => {
      const ds = getGlobal('__kanban_sse_debounce__', () => ({
        pendingRunDirs: new Set<string>(),
        timer: null,
        windowOpen: false,
      }));

      ds.pendingRunDirs.add('/runs/r1');
      ds.windowOpen = true;

      const same = getGlobal('__kanban_sse_debounce__', () => ({
        pendingRunDirs: new Set<string>(),
        timer: null,
        windowOpen: false,
      }));

      expect(same.pendingRunDirs.has('/runs/r1')).toBe(true);
      expect(same.windowOpen).toBe(true);
    });
  });

  describe('clearGlobal', () => {
    it('removes a specific key from the registry', () => {
      getGlobal('__kanban_run_cache__', () => new Map());
      getGlobal('__kanban_init__', () => ({
        initialized: false,
        initPromise: null,
        cleanup: null,
      }));

      clearGlobal('__kanban_run_cache__');

      expect(globalThis.__kanban_registry__!.__kanban_init__).toBeDefined();

      const fresh = getGlobal('__kanban_run_cache__', () => new Map());
      expect(fresh.size).toBe(0);
    });

    it('is safe to call when registry does not exist', () => {
      globalThis.__kanban_registry__ = undefined;
      expect(() => clearGlobal('__kanban_run_cache__')).not.toThrow();
    });

    it('is safe to call when key does not exist', () => {
      globalThis.__kanban_registry__ = {};
      expect(() => clearGlobal('__kanban_run_cache__')).not.toThrow();
    });
  });

  describe('clearAllGlobals', () => {
    it('removes the entire registry', () => {
      getGlobal('__kanban_run_cache__', () => new Map());
      getGlobal('__kanban_init__', () => ({
        initialized: false,
        initPromise: null,
        cleanup: null,
      }));

      clearAllGlobals();

      expect(globalThis.__kanban_registry__).toBeUndefined();
    });

    it('causes getGlobal to re-create values after clearing', () => {
      const original = getGlobal('__kanban_run_cache__', () => new Map());
      original.set('key', 'value');

      clearAllGlobals();

      const fresh = getGlobal('__kanban_run_cache__', () => new Map());
      expect(fresh).not.toBe(original);
      expect(fresh.size).toBe(0);
    });

    it('is safe to call multiple times', () => {
      clearAllGlobals();
      clearAllGlobals();
      clearAllGlobals();
      expect(globalThis.__kanban_registry__).toBeUndefined();
    });
  });

  describe('HMR safety', () => {
    it('preserves state across simulated module re-evaluations', () => {
      const cache1 = getGlobal('__kanban_run_cache__', () => new Map());
      cache1.set('run-001', { digest: 'some-data' });

      const cache2 = getGlobal('__kanban_run_cache__', () => new Map());

      expect(cache2).toBe(cache1);
      expect(cache2.get('run-001')).toEqual({ digest: 'some-data' });
    });

    it('preserves EventEmitter listeners across simulated HMR', async () => {
      const { EventEmitter } = await import('events');

      const emitter = getGlobal('__kanban_watcher_events__', () => new EventEmitter());
      let called = false;
      emitter.on('test', () => { called = true; });

      const sameEmitter = getGlobal('__kanban_watcher_events__', () => new EventEmitter());
      sameEmitter.emit('test');

      expect(called).toBe(true);
    });
  });
});

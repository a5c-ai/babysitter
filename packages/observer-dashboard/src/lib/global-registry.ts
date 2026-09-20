/**
 * Typed GlobalRegistry — replaces raw `(globalThis as any).__key` casts with
 * type-safe accessors that persist across HMR reloads.
 *
 * Usage:
 *   const cache = getGlobal('__observer_run_cache__', () => new Map<string, CacheEntry>());
 *
 * The first call lazily initialises the value on `globalThis`; subsequent calls
 * (including after HMR) return the existing instance.
 */

import type { EventEmitter } from "events";
import type { FSWatcher } from "fs";

// ---------------------------------------------------------------------------
// 1. Declare the shape of every key we store on globalThis.
//    Adding a new key is a compile-time-only change — just extend this map.
// ---------------------------------------------------------------------------

/**
 * Maps each globalThis key to its concrete runtime type.
 *
 * Every module that needs HMR-safe global state registers its key + type here
 * so the accessor can enforce type safety without `any` casts.
 */
export interface GlobalRegistryMap {
  /** run-cache.ts — Map of runDir to CacheEntry */
  __observer_run_cache__: Map<string, unknown>;

  /** watcher.ts — shared EventEmitter for watcher change events */
  __observer_watcher_events__: EventEmitter;

  /** watcher.ts — active FSWatcher instances + debounce timers */
  __observer_watchers__: {
    activeWatchers: Map<string, FSWatcher>;
    debounceTimers: Map<string, NodeJS.Timeout>;
    rescanTimer: NodeJS.Timeout | null;
  };

  /** server-init.ts — shared EventEmitter for SSE server events */
  __observer_server_events__: EventEmitter;

  /** server-init.ts — leading-edge debounce state for SSE broadcasts */
  __observer_sse_debounce__: {
    pendingRunDirs: Set<string>;
    timer: ReturnType<typeof setTimeout> | null;
    windowOpen: boolean;
  };

  /** server-init.ts — initialization state (singleton guard) */
  __observer_init__: {
    initialized: boolean;
    initPromise: Promise<void> | null;
    cleanup: (() => void) | null;
  };
}

// ---------------------------------------------------------------------------
// 2. Augment the global scope so TypeScript knows about our keys.
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var -- var is required for globalThis augmentation
  var __observer_registry__: Partial<GlobalRegistryMap> | undefined;
}

// ---------------------------------------------------------------------------
// 3. Typed accessor — the only public API.
// ---------------------------------------------------------------------------

/**
 * Return an HMR-safe global value, lazily initialising it via `factory` on
 * first access.
 *
 * The value is stored on `globalThis.__observer_registry__` under the given
 * key so it survives hot-module reloads.
 *
 * @param key     One of the keys declared in {@link GlobalRegistryMap}.
 * @param factory Called once to create the initial value if it does not exist.
 * @returns       The (possibly pre-existing) value.
 */
export function getGlobal<K extends keyof GlobalRegistryMap>(
  key: K,
  factory: () => GlobalRegistryMap[K],
): GlobalRegistryMap[K] {
  if (!globalThis.__observer_registry__) {
    globalThis.__observer_registry__ = {};
  }

  const registry = globalThis.__observer_registry__;

  if (registry[key] === undefined) {
    registry[key] = factory();
  }

  return registry[key] as GlobalRegistryMap[K];
}

/**
 * Clear a single key from the global registry.
 *
 * Primarily useful during shutdown / test teardown.
 */
export function clearGlobal<K extends keyof GlobalRegistryMap>(key: K): void {
  if (globalThis.__observer_registry__) {
    delete globalThis.__observer_registry__[key];
  }
}

/**
 * Clear the entire global registry.
 *
 * Primarily useful in tests.
 */
export function clearAllGlobals(): void {
  globalThis.__observer_registry__ = undefined;
}

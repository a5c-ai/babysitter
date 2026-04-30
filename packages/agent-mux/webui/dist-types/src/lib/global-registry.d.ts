/**
 * Typed GlobalRegistry — replaces raw `(globalThis as any).__key` casts with
 * type-safe accessors that persist across HMR reloads.
 *
 * Usage:
 *   const cache = getGlobal('__kanban_run_cache__', () => new Map<string, CacheEntry>());
 *
 * The first call lazily initialises the value on `globalThis`; subsequent calls
 * (including after HMR) return the existing instance.
 */
import type { EventEmitter } from "events";
import type { FSWatcher } from "fs";
/**
 * Maps each globalThis key to its concrete runtime type.
 *
 * Every module that needs HMR-safe global state registers its key + type here
 * so the accessor can enforce type safety without `any` casts.
 */
export interface GlobalRegistryMap {
    /** run-cache.ts — Map of runDir to CacheEntry */
    __kanban_run_cache__: Map<string, unknown>;
    /** watcher.ts — shared EventEmitter for watcher change events */
    __kanban_watcher_events__: EventEmitter;
    /** watcher.ts — active FSWatcher instances + debounce timers */
    __kanban_watchers__: {
        activeWatchers: Map<string, FSWatcher>;
        debounceTimers: Map<string, NodeJS.Timeout>;
        rescanTimer: NodeJS.Timeout | null;
    };
    /** server-init.ts — shared EventEmitter for SSE server events */
    __kanban_server_events__: EventEmitter;
    /** server-init.ts — leading-edge debounce state for SSE broadcasts */
    __kanban_sse_debounce__: {
        pendingRunDirs: Set<string>;
        timer: ReturnType<typeof setTimeout> | null;
        windowOpen: boolean;
    };
    /** server-init.ts — initialization state (singleton guard) */
    __kanban_init__: {
        initialized: boolean;
        initPromise: Promise<void> | null;
        cleanup: (() => void) | null;
    };
}
declare global {
    var __kanban_registry__: Partial<GlobalRegistryMap> | undefined;
}
/**
 * Return an HMR-safe global value, lazily initialising it via `factory` on
 * first access.
 *
 * The value is stored on `globalThis.__kanban_registry__` under the given
 * key so it survives hot-module reloads.
 *
 * @param key     One of the keys declared in {@link GlobalRegistryMap}.
 * @param factory Called once to create the initial value if it does not exist.
 * @returns       The (possibly pre-existing) value.
 */
export declare function getGlobal<K extends keyof GlobalRegistryMap>(key: K, factory: () => GlobalRegistryMap[K]): GlobalRegistryMap[K];
/**
 * Clear a single key from the global registry.
 *
 * Primarily useful during shutdown / test teardown.
 */
export declare function clearGlobal<K extends keyof GlobalRegistryMap>(key: K): void;
/**
 * Clear the entire global registry.
 *
 * Primarily useful in tests.
 */
export declare function clearAllGlobals(): void;

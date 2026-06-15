/**
 * Typed GlobalRegistry for the kanban (adapters gateway) namespace.
 *
 * Built on the generic {@link createGlobalRegistry} factory to avoid
 * duplicating accessor logic across packages.
 *
 * CANONICAL REGISTRY MAP: packages/adapters/webui/src/lib/global-registry.ts
 * This file mirrors the same GlobalRegistryMap and namespace key.
 */

import type { EventEmitter } from "events";
import type { FSWatcher } from "fs";
import { createGlobalRegistry } from "./create-global-registry.js";

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

// ---------------------------------------------------------------------------
// 2. Augment the global scope so TypeScript knows about our keys.
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var -- var is required for globalThis augmentation
  var __kanban_registry__: Partial<GlobalRegistryMap> | undefined;
}

// ---------------------------------------------------------------------------
// 3. Typed accessors — the only public API.
// ---------------------------------------------------------------------------

const registry = createGlobalRegistry<GlobalRegistryMap>("__kanban_registry__");

export const getGlobal = registry.getGlobal;
export const clearGlobal = registry.clearGlobal;
export const clearAllGlobals = registry.clearAllGlobals;

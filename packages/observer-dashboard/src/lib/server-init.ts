import path from "path";
import { EventEmitter } from "events";
import { initWatcher, watcherEvents, type WatcherEvent } from "./watcher";
import { discoverAndCacheAll } from "./run-cache";
import { getGlobal } from "./global-registry";

// Shared event bus for SSE endpoints — persist across HMR via typed global registry
function getServerEvents(): EventEmitter {
  return getGlobal('__observer_server_events__', () => new EventEmitter());
}

export const serverEvents = getServerEvents();

// ---------------------------------------------------------------------------
// Leading-edge debounce for SSE broadcasts
// ---------------------------------------------------------------------------
// N clients x M rapid file changes = N*M redundant API requests.  This
// debounce fires immediately on the *first* run-changed event (leading edge),
// then collects any subsequent events within a 500ms window and emits a
// single batched notification containing all affected runIds.
// ---------------------------------------------------------------------------

export const SSE_DEBOUNCE_MS = 500;

export interface BatchedRunChangedEvent {
  type: "run-changed";
  runIds: string[];
  runDirs: string[];
}

// Persist debounce state across HMR reloads via typed global registry
interface DebounceState {
  pendingRunDirs: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
  /** True while we are inside a debounce window (leading edge already fired). */
  windowOpen: boolean;
}

function getDebounceState(): DebounceState {
  return getGlobal('__observer_sse_debounce__', () => ({
    pendingRunDirs: new Set<string>(),
    timer: null,
    windowOpen: false,
  }));
}

export function resetDebounceState(): void {
  const ds = getDebounceState();
  if (ds.timer) clearTimeout(ds.timer);
  ds.timer = null;
  ds.pendingRunDirs.clear();
  ds.windowOpen = false;
}

/** Flush the batch — emit a single event with all collected runIds. */
function flushBatch(): void {
  const ds = getDebounceState();
  const runDirs = Array.from(ds.pendingRunDirs);
  ds.pendingRunDirs.clear();
  ds.timer = null;
  ds.windowOpen = false;

  if (runDirs.length === 0) return;

  const runIds = runDirs.map((d) => path.basename(d));
  serverEvents.emit("run-changed", {
    type: "run-changed",
    runIds,
    runDirs,
  } as BatchedRunChangedEvent);
}

/**
 * Enqueue a run-changed event into the leading-edge debounce.
 *
 * Behaviour:
 *  1. If no window is open, emit immediately (leading edge) and open window.
 *  2. If window is already open, collect the runDir and reset the 500ms timer
 *     (trailing flush).
 */
export function enqueueRunChanged(event: WatcherEvent): void {
  const ds = getDebounceState();

  // Note: forceRefreshBreakpointRuns() was previously called here on every
  // watcher event, but it deleted ALL breakpoint cache entries globally —
  // causing banner flickering during active orchestration. The specific run
  // is already invalidated by invalidateRun(runDir) in the watcher handlers,
  // so broad cache clearing is unnecessary. (v0.12.3 fix)

  if (!ds.windowOpen) {
    // --- Leading edge: fire immediately for this single runDir ---
    ds.windowOpen = true;

    const runId = path.basename(event.runDir);
    serverEvents.emit("run-changed", {
      type: "run-changed",
      runIds: [runId],
      runDirs: [event.runDir],
    } as BatchedRunChangedEvent);

    // Open a 500ms collection window for subsequent events
    ds.timer = setTimeout(flushBatch, SSE_DEBOUNCE_MS);
  } else {
    // --- Inside window: collect and reset timer ---
    ds.pendingRunDirs.add(event.runDir);

    // Reset the trailing-edge timer so the window extends on each new event
    if (ds.timer) clearTimeout(ds.timer);
    ds.timer = setTimeout(flushBatch, SSE_DEBOUNCE_MS);
  }
}

// Persist initialization state across HMR reloads via typed global registry
interface InitState {
  initialized: boolean;
  initPromise: Promise<void> | null;
  cleanup: (() => void) | null;
}

function getInitState(): InitState {
  return getGlobal('__observer_init__', () => ({
    initialized: false,
    initPromise: null,
    cleanup: null,
  }));
}

export async function ensureInitialized(): Promise<void> {
  const state = getInitState();

  // Already initialized
  if (state.initialized) {
    return;
  }

  // Initialization in progress
  if (state.initPromise) {
    return state.initPromise;
  }

  // Start initialization
  state.initPromise = (async () => {
    try {
      console.log("Starting server initialization...");

      // Step 1: Initialize watcher
      console.log("Setting up filesystem watcher...");
      state.cleanup = await initWatcher();

      // Step 2: Initial cache population
      console.log("Populating cache with discovered runs...");
      await discoverAndCacheAll();

      // Step 3: Listen to watcher events and broadcast via leading-edge debounce
      // Watcher already invalidates the specific run cache in handleJournalChange.
      // Additionally, when a journal change is detected, force-refresh all breakpoint
      // cache entries. This ensures that EFFECT_RESOLVED events for breakpoints
      // immediately clear stale breakpoint data across all cached runs — not just
      // the specific run that changed.
      //
      // run-changed events are routed through enqueueRunChanged() which implements
      // a 500ms leading-edge debounce: the first event fires immediately, then
      // subsequent events within the window are batched and flushed once.

      // Dedup window for transient watcher errors — suppress duplicates within 5s
      // to prevent cascading SSE error events that trigger client-side flash
      let lastWatcherErrorTime = 0;
      const WATCHER_ERROR_DEDUP_MS = 5000;

      watcherEvents.on("change", (event: WatcherEvent) => {
        if (event.type === "run-changed") {
          enqueueRunChanged(event);
        } else if (event.type === "new-run") {
          serverEvents.emit("new-run", event);
        } else if (event.type === "error") {
          // Suppress transient watcher errors within dedup window
          const now = Date.now();
          if (now - lastWatcherErrorTime >= WATCHER_ERROR_DEDUP_MS) {
            lastWatcherErrorTime = now;
            serverEvents.emit("watcher-error", event);
          }
        }
      });

      state.initialized = true;
      console.log("Server initialization complete");
    } catch (err) {
      console.error("Server initialization failed:", err);
      state.initPromise = null;
      throw err;
    }
  })();

  return state.initPromise;
}

// Cleanup function for graceful shutdown
export async function shutdownServer(): Promise<void> {
  const state = getInitState();

  if (state.cleanup) {
    state.cleanup();
    state.cleanup = null;
  }

  state.initialized = false;
  state.initPromise = null;

  // Clear SSE debounce timers
  resetDebounceState();

  // Remove all event listeners
  serverEvents.removeAllListeners();

  console.log("Server shutdown complete");
}

// Get initialization status for debugging
export function getInitStatus() {
  const state = getInitState();
  return {
    initialized: state.initialized,
    hasCleanup: !!state.cleanup,
    serverEventListeners: serverEvents.eventNames().length,
  };
}

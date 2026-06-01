import { watch, type FSWatcher } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { EventEmitter } from "events";
import { discoverAllRunDirs, invalidateDiscoveryCache, discoverAllRunsParentDirs } from "./source-discovery";
import { invalidateRun, requestDiscovery } from "./run-cache";
import { getGlobal } from "./global-registry";

// Persist event emitter across HMR reloads via typed global registry
function getWatcherEvents(): EventEmitter {
  return getGlobal('__observer_watcher_events__', () => new EventEmitter());
}

export const watcherEvents = getWatcherEvents();

// Event types
export type WatcherEventType = "run-changed" | "new-run" | "error";

export interface WatcherEvent {
  type: WatcherEventType;
  runDir: string;
  error?: Error;
}

// Persist watcher state across HMR reloads via typed global registry
interface WatcherState {
  activeWatchers: Map<string, FSWatcher>;
  debounceTimers: Map<string, NodeJS.Timeout>;
  rescanTimer: NodeJS.Timeout | null;
}

function getWatcherState(): WatcherState {
  return getGlobal('__observer_watchers__', () => ({
    activeWatchers: new Map<string, FSWatcher>(),
    debounceTimers: new Map<string, NodeJS.Timeout>(),
    rescanTimer: null,
  }));
}

// WSL-optimized constants
const DEBOUNCE_MS = 500; // 500ms debounce (WSL cross-FS needs more)
const RESCAN_INTERVAL_MS = 30000; // 30s — reduced from 120s to detect new project directories faster

function debounceChange(runDir: string, callback: () => void) {
  const state = getWatcherState();
  const existing = state.debounceTimers.get(runDir);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    state.debounceTimers.delete(runDir);
    callback();
  }, DEBOUNCE_MS);

  state.debounceTimers.set(runDir, timer);
}

function handleJournalChange(journalDir: string) {
  const runDir = path.dirname(journalDir);

  debounceChange(runDir, () => {
    invalidateRun(runDir);
    requestDiscovery(); // Ensure discoverAndCacheAll() re-populates the entry
    watcherEvents.emit("change", {
      type: "run-changed",
      runDir,
    } as WatcherEvent);
  });
}

function handleTasksChange(tasksDir: string) {
  const runDir = path.dirname(tasksDir);

  debounceChange(runDir, () => {
    invalidateRun(runDir);
    requestDiscovery(); // Ensure discoverAndCacheAll() re-populates the entry
    watcherEvents.emit("change", {
      type: "run-changed",
      runDir,
    } as WatcherEvent);
  });
}

function handleRunsParentChange(runsDir: string) {
  debounceChange(runsDir, () => {
    // Invalidate caches so new runs are picked up on next request
    invalidateDiscoveryCache();
    requestDiscovery();
    watcherEvents.emit("change", {
      type: "new-run",
      runDir: runsDir,
    } as WatcherEvent);
  });
}

function watchDirectory(dirPath: string, onChange: (path: string) => void): FSWatcher | null {
  try {
    // Use non-recursive watch (WSL doesn't support recursive)
    const watcher = watch(dirPath, { recursive: false }, (eventType, filename) => {
      if (filename) {
        onChange(dirPath);
      }
    });

    watcher.on("error", (err) => {
      console.error(`Watch error for ${dirPath}:`, err);
      watcherEvents.emit("change", {
        type: "error",
        runDir: dirPath,
        error: err,
      } as WatcherEvent);
    });

    return watcher;
  } catch (err) {
    console.error(`Failed to watch ${dirPath}:`, err);
    return null;
  }
}

async function setupWatchers() {
  const state = getWatcherState();
  const discovered = await discoverAllRunDirs();
  const runsParentDirs = new Set<string>();

  // Build the set of directories we need to watch
  const neededDirs = new Set<string>();

  for (const { runDir } of discovered) {
    const journalDir = path.join(runDir, "journal");
    try {
      await fs.access(journalDir);
      neededDirs.add(journalDir);
    } catch {
      // Journal dir doesn't exist yet — skip for now
    }

    const tasksDir = path.join(runDir, "tasks");
    try {
      await fs.access(tasksDir);
      neededDirs.add(tasksDir);
    } catch {
      // Tasks dir doesn't exist yet — skip for now
    }

    const runsDir = path.dirname(runDir);
    runsParentDirs.add(runsDir);
  }

  // Also discover ALL .a5c/runs/ directories (including empty ones)
  // so we detect the very first run in a new project immediately
  try {
    const allRunsParentDirs = await discoverAllRunsParentDirs();
    for (const dir of allRunsParentDirs) {
      runsParentDirs.add(dir);
    }
  } catch {
    // Non-critical — fall back to watching only populated runs dirs
  }

  for (const runsDir of runsParentDirs) {
    try {
      await fs.access(runsDir);
      neededDirs.add(runsDir);
    } catch {
      // Runs dir doesn't exist
    }
  }

  // Incremental update: close watchers for directories no longer needed
  for (const [dirPath, watcher] of state.activeWatchers.entries()) {
    if (!neededDirs.has(dirPath)) {
      watcher.close();
      state.activeWatchers.delete(dirPath);
    }
  }

  // Only create new watchers for newly discovered directories
  for (const dirPath of neededDirs) {
    if (!state.activeWatchers.has(dirPath)) {
      const baseName = path.basename(dirPath);
      const isJournalDir = baseName === "journal";
      const isTasksDir = baseName === "tasks";
      const onChange = isJournalDir
        ? handleJournalChange
        : isTasksDir
          ? handleTasksChange
          : handleRunsParentChange;
      const watcher = watchDirectory(dirPath, onChange);
      if (watcher) {
        state.activeWatchers.set(dirPath, watcher);
      }
    }
  }

  console.log(`Watching ${state.activeWatchers.size} directories`);
}

async function periodicRescan() {
  try {
    // Re-discover and update watchers incrementally
    await setupWatchers();
  } catch (err) {
    console.error("Periodic rescan failed:", err);
  }
}

export async function initWatcher(): Promise<() => void> {
  const state = getWatcherState();

  // If watchers already exist from a previous HMR cycle, skip full re-init
  if (state.activeWatchers.size > 0) {
    console.log(`Reusing ${state.activeWatchers.size} existing watchers (HMR-safe)`);
    // Still do an incremental rescan to pick up any new directories
    await setupWatchers();
  } else {
    console.log("Initializing filesystem watcher...");
    await setupWatchers();
  }

  // Clear any existing rescan timer before setting a new one
  if (state.rescanTimer) {
    clearInterval(state.rescanTimer);
  }

  // Schedule periodic rescans
  state.rescanTimer = setInterval(periodicRescan, RESCAN_INTERVAL_MS);

  // Return cleanup function
  return () => {
    console.log("Cleaning up filesystem watcher...");

    // Clear rescan timer
    if (state.rescanTimer) {
      clearInterval(state.rescanTimer);
      state.rescanTimer = null;
    }

    // Clear debounce timers
    for (const timer of state.debounceTimers.values()) {
      clearTimeout(timer);
    }
    state.debounceTimers.clear();

    // Close all watchers
    for (const watcher of state.activeWatchers.values()) {
      watcher.close();
    }
    state.activeWatchers.clear();

    // Remove all event listeners
    watcherEvents.removeAllListeners();
  };
}

// Get watcher stats for debugging
export function getWatcherStats() {
  const state = getWatcherState();
  return {
    activeWatchers: state.activeWatchers.size,
    watchedPaths: Array.from(state.activeWatchers.keys()),
    pendingDebounces: state.debounceTimers.size,
  };
}

/**
 * GAP-REMOTE-001: File Watcher — debounced fs.watch trigger.
 *
 * Watches directories for file changes matching glob patterns,
 * firing trigger callbacks with configurable debounce.
 */

import * as fsSync from "node:fs";
import * as path from "node:path";
import type { FileTriggerConfig, FileWatcherHandle, TriggerCallback } from "./types";

const DEFAULT_DEBOUNCE_MS = 500;

interface WatchEntry {
  trigger: FileTriggerConfig;
  watcher: ReturnType<typeof fsSync.watch> | null;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  lastPath: string | null;
}

/**
 * Extract the extension pattern from a glob (e.g., "**\/*.ts" -> ".ts").
 * Returns null if no extension can be extracted.
 */
function extractExtension(pattern: string): string | null {
  const normalized = pattern.replace(/\\/g, "/");
  // Match patterns like **/*.ts, **/*.test.ts, *.js
  const match = normalized.match(/\*(\.[a-zA-Z0-9.]+)$/);
  return match ? match[1] : null;
}

/**
 * Check if a filename matches the pattern's file extension filter.
 * This is a simplified matcher that works with common glob patterns like:
 * - path/to/**\/*.ts  -> matches any .ts file under path/to/
 * - path/to/**\/*.test.ts -> matches any .test.ts file under path/to/
 */
function matchesExtension(filename: string, pattern: string): boolean {
  const ext = extractExtension(pattern);
  if (!ext) return true; // No extension filter = match all
  return filename.endsWith(ext);
}

/**
 * Extract the base directory from a glob pattern (everything before the first glob segment).
 */
function getWatchDir(pattern: string): string {
  const normalized = pattern.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const dirParts: string[] = [];

  for (const part of parts) {
    if (part.includes("*") || part.includes("?") || part.includes("{")) {
      break;
    }
    dirParts.push(part);
  }

  return dirParts.join(path.sep) || ".";
}

export function createFileWatcher(
  triggers: FileTriggerConfig[],
  onTrigger: TriggerCallback,
): FileWatcherHandle {
  const entries: WatchEntry[] = [];
  let disposed = false;

  for (const trigger of triggers) {
    const watchDir = getWatchDir(trigger.pattern);
    const debounceMs = trigger.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    const entry: WatchEntry = {
      trigger,
      watcher: null,
      debounceTimer: null,
      lastPath: null,
    };

    try {
      entry.watcher = fsSync.watch(watchDir, { recursive: true }, (_eventType, filename) => {
        if (disposed || !filename) return;

        if (!matchesExtension(filename, trigger.pattern)) return;
        entry.lastPath = path.resolve(watchDir, filename.toString());

        // Debounce: clear previous timer and set a new one
        if (entry.debounceTimer) {
          clearTimeout(entry.debounceTimer);
        }
        entry.debounceTimer = setTimeout(() => {
          if (disposed) return;
          void onTrigger({
            type: "file",
            processId: trigger.processId,
            entrypoint: trigger.entrypoint,
            inputs: entry.lastPath ? { path: entry.lastPath } : undefined,
          });
        }, debounceMs);
      });

      entry.watcher.on("error", () => {
        if (entry.watcher) {
          entry.watcher.close();
          entry.watcher = null;
        }
      });
    } catch {
      // Watch dir doesn't exist yet — skip
    }

    entries.push(entry);
  }

  return {
    dispose() {
      disposed = true;
      for (const entry of entries) {
        if (entry.debounceTimer) {
          clearTimeout(entry.debounceTimer);
          entry.debounceTimer = null;
        }
        if (entry.watcher) {
          entry.watcher.close();
          entry.watcher = null;
        }
      }
    },
  };
}

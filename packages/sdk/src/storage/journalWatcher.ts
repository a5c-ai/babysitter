/**
 * GAP-JSON-005: JournalWatcher — real-time event streaming from journal dir.
 *
 * Watches a run's journal/ directory for new .json files. Emits events
 * incrementally (only seq > lastSeenSeq) in strict seq order. Supports
 * fs.watch with automatic polling fallback.
 */

import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { JournalEvent, JsonRecord } from "./types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface JournalWatcherOptions {
  runDir: string;
  afterSeq?: number;
  pollIntervalMs?: number;
  useFsWatch?: boolean;
  onEvent: (event: JournalEvent) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

export interface JournalWatcher {
  readonly lastSeenSeq: number;
  onEvent: (event: JournalEvent) => void;
  close(): void;
}

// ── Journal filename parsing ──────────────────────────────────────────────

function parseJournalFilename(name: string): { seq: number; ulid: string } | null {
  const match = name.match(/^(\d{6})\.([A-Z0-9]+)\.json$/);
  if (!match) return null;
  return { seq: parseInt(match[1], 10), ulid: match[2] };
}

// ── Implementation ────────────────────────────────────────────────────────

export function createJournalWatcher(options: JournalWatcherOptions): JournalWatcher {
  const {
    runDir,
    afterSeq = 0,
    pollIntervalMs = 1000,
    useFsWatch = true,
    onError,
    onDone,
  } = options;

  const journalDir = path.join(runDir, "journal");
  let _lastSeenSeq = afterSeq;
  let _closed = false;
  let _pollTimer: ReturnType<typeof setInterval> | null = null;
  let _fsWatcher: ReturnType<typeof import("node:fs").watch> | null = null;
  let _scanning = false;

  let eventCallback = options.onEvent;

  const watcher: JournalWatcher = {
    get lastSeenSeq() {
      return _lastSeenSeq;
    },
    get onEvent() {
      return eventCallback;
    },
    set onEvent(cb: (event: JournalEvent) => void) {
      eventCallback = cb;
    },
    close() {
      if (_closed) return;
      _closed = true;
      if (_pollTimer) {
        clearInterval(_pollTimer);
        _pollTimer = null;
      }
      if (_fsWatcher) {
        _fsWatcher.close();
        _fsWatcher = null;
      }
    },
  };

  async function scan(): Promise<void> {
    if (_closed || _scanning) return;
    _scanning = true;

    try {
      let entries: string[];
      try {
        entries = await fs.readdir(journalDir);
      } catch {
        // Journal dir doesn't exist yet — wait for next poll
        return;
      }

      const parsed = entries
        .map((name) => ({ name, parsed: parseJournalFilename(name) }))
        .filter((e): e is { name: string; parsed: { seq: number; ulid: string } } =>
          e.parsed !== null && e.parsed.seq > _lastSeenSeq,
        )
        .sort((a, b) => a.parsed.seq - b.parsed.seq);

      for (const entry of parsed) {
        if (_closed) break;

        const filePath = path.join(journalDir, entry.name);
        let event: JournalEvent;
        let eventType: string;
        try {
          const raw = await fs.readFile(filePath, "utf-8");
          const data = JSON.parse(raw) as {
            type: string;
            recordedAt: string;
            data: JsonRecord;
            checksum?: string;
          };
          eventType = data.type;

          event = {
            seq: entry.parsed.seq,
            ulid: entry.parsed.ulid,
            filename: entry.name,
            path: `journal/${entry.name}`,
            type: data.type,
            recordedAt: data.recordedAt,
            data: data.data,
            checksum: data.checksum,
          };
        } catch (error) {
          // Read/parse error — skip corrupt file, advance seq so we don't re-read
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
          _lastSeenSeq = entry.parsed.seq;
          continue;
        }

        try {
          eventCallback(event);
          _lastSeenSeq = entry.parsed.seq;
        } catch (error) {
          // Callback threw — advance seq to avoid infinite retry loops.
          // The event is lost; callers should not throw from onEvent.
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
          _lastSeenSeq = entry.parsed.seq;
        }

        // Check for terminal events — auto-close after delivery
        if (eventType === "RUN_COMPLETED" || eventType === "RUN_FAILED") {
          if (onDone) onDone();
          watcher.close();
        }
      }
    } finally {
      _scanning = false;
    }
  }

  // Start polling
  _pollTimer = setInterval(() => {
    void scan();
  }, pollIntervalMs);

  // Also try fs.watch for lower latency
  if (useFsWatch) {
    try {
      _fsWatcher = fsSync.watch(journalDir, () => {
        void scan();
      });
      _fsWatcher.on("error", () => {
        // fs.watch failed — polling fallback handles it
        if (_fsWatcher) {
          _fsWatcher.close();
          _fsWatcher = null;
        }
      });
    } catch {
      // fs.watch not available — polling fallback
    }
  }

  // Initial scan
  void scan();

  return watcher;
}

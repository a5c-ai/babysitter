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

function parseJournalFilename(name: string): { seq: number; ulid: string } | null {
  const match = name.match(/^(\d{6})\.([A-Z0-9]+)\.json$/);
  if (!match) return null;
  return { seq: parseInt(match[1], 10), ulid: match[2] };
}

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
  let lastSeenSeq = afterSeq;
  let closed = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let fsWatcher: ReturnType<typeof import("node:fs").watch> | null = null;
  let scanning = false;

  let eventCallback = options.onEvent;

  const watcher: JournalWatcher = {
    get lastSeenSeq() {
      return lastSeenSeq;
    },
    get onEvent() {
      return eventCallback;
    },
    set onEvent(cb: (event: JournalEvent) => void) {
      eventCallback = cb;
    },
    close() {
      if (closed) return;
      closed = true;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (fsWatcher) {
        fsWatcher.close();
        fsWatcher = null;
      }
    },
  };

  async function scan(): Promise<void> {
    if (closed || scanning) return;
    scanning = true;

    try {
      let entries: string[];
      try {
        entries = await fs.readdir(journalDir);
      } catch (e) {
        process.stderr.write(`[babysitter] journal watcher: cannot read ${journalDir}: ${e instanceof Error ? e.message : String(e)}\n`);
        return;
      }

      const parsed = entries
        .map((name) => ({ name, parsed: parseJournalFilename(name) }))
        .filter((entry): entry is { name: string; parsed: { seq: number; ulid: string } } =>
          entry.parsed !== null && entry.parsed.seq > lastSeenSeq,
        )
        .sort((a, b) => a.parsed.seq - b.parsed.seq);

      for (const entry of parsed) {
        if (closed) break;

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
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
          lastSeenSeq = entry.parsed.seq;
          continue;
        }

        try {
          eventCallback(event);
          lastSeenSeq = entry.parsed.seq;
        } catch (error) {
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
          lastSeenSeq = entry.parsed.seq;
        }

        if (eventType === "RUN_COMPLETED" || eventType === "RUN_FAILED") {
          if (onDone) onDone();
          watcher.close();
        }
      }
    } finally {
      scanning = false;
    }
  }

  pollTimer = setInterval(() => {
    void scan();
  }, pollIntervalMs);

  if (useFsWatch) {
    try {
      fsWatcher = fsSync.watch(journalDir, () => {
        void scan();
      });
      fsWatcher.on("error", () => {
        if (fsWatcher) {
          fsWatcher.close();
          fsWatcher = null;
        }
      });
    } catch {
      // Polling fallback remains active.
    }
  }

  void scan();

  return watcher;
}

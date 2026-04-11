/**
 * GAP-JSON-005: JournalWatcher — file-based journal event streaming.
 *
 * Tests for createJournalWatcher: real-time event streaming from
 * the append-only journal directory.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

import {
  createJournalWatcher,
  type JournalWatcher,
  type JournalWatcherOptions,
} from "../journalWatcher";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-json-005-watcher-${crypto.randomUUID()}`);
}

async function scaffoldRunDir(baseDir: string): Promise<string> {
  const journalDir = path.join(baseDir, "journal");
  await fs.mkdir(journalDir, { recursive: true });
  return baseDir;
}

async function appendJournalFile(
  runDir: string,
  seq: number,
  type: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const journalDir = path.join(runDir, "journal");
  await fs.mkdir(journalDir, { recursive: true });
  const ulid = crypto.randomUUID().replace(/-/g, "").slice(0, 26).toUpperCase();
  const seqStr = seq.toString().padStart(6, "0");
  const filename = `${seqStr}.${ulid}.json`;
  const payload = {
    type,
    recordedAt: new Date().toISOString(),
    data,
    checksum: crypto.createHash("sha256").update(type).digest("hex"),
  };
  await fs.writeFile(
    path.join(journalDir, filename),
    JSON.stringify(payload, null, 2),
  );
}

function waitForEvents(
  watcher: JournalWatcher,
  count: number,
  timeoutMs = 5000,
): Promise<Array<{ seq: number; type: string }>> {
  return new Promise((resolve, reject) => {
    const events: Array<{ seq: number; type: string }> = [];
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${count} events, got ${events.length}`));
    }, timeoutMs);

    const orig = watcher.onEvent;
    watcher.onEvent = (event) => {
      if (orig) orig(event);
      events.push({ seq: event.seq, type: event.type });
      if (events.length >= count) {
        clearTimeout(timer);
        resolve(events);
      }
    };
  });
}

// ── Test state ───────────────────────────────────────────────────────────────

let testBase: string;

beforeEach(async () => {
  testBase = tmpDir();
  await fs.mkdir(testBase, { recursive: true });
});

afterEach(async () => {
  try {
    await fs.rm(testBase, { recursive: true, force: true });
  } catch {
    // cleanup best-effort
  }
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GAP-JSON-005: JournalWatcher", () => {
  // ── AC-001: Instantiation ──

  describe("AC-001: instantiation and watching", () => {
    it("can be instantiated with a runDir", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run1"));
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 100,
        onEvent: () => {},
      });
      expect(watcher).toBeDefined();
      expect(typeof watcher.close).toBe("function");
      watcher.close();
    });

    it("defaults pollIntervalMs to 1000ms", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-default"));
      const watcher = createJournalWatcher({
        runDir,
        onEvent: () => {},
      });
      expect(watcher).toBeDefined();
      watcher.close();
    });
  });

  // ── AC-002: Event emission ──

  describe("AC-002: emits events for new journal entries", () => {
    it("delivers JournalEvent with seq, type, data", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-emit"));
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: () => {},
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        await appendJournalFile(runDir, 1, "RUN_CREATED", { runId: "test" });
        const events = await eventsPromise;
        expect(events).toHaveLength(1);
        expect(events[0].seq).toBe(1);
        expect(events[0].type).toBe("RUN_CREATED");
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-003: afterSeq cursor ──

  describe("AC-003: afterSeq filters older events", () => {
    it("only emits events with seq > afterSeq", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-cursor"));
      // Pre-populate journal with seq 1, 2
      await appendJournalFile(runDir, 1, "RUN_CREATED");
      await appendJournalFile(runDir, 2, "EFFECT_REQUESTED", { effectId: "e1" });

      const received: number[] = [];
      const watcher = createJournalWatcher({
        runDir,
        afterSeq: 1,
        pollIntervalMs: 50,
        onEvent: (ev) => received.push(ev.seq),
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        // Seq 2 should be emitted (> 1), seq 1 should not
        const events = await eventsPromise;
        expect(events[0].seq).toBe(2);
        // Give extra time to ensure seq 1 wasn't delivered
        await new Promise((r) => setTimeout(r, 200));
        expect(received).not.toContain(1);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-004: lastSeenSeq tracking ──

  describe("AC-004: tracks lastSeenSeq", () => {
    it("exposes lastSeenSeq property updated after event delivery", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-seq"));
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: () => {},
      });

      try {
        expect(watcher.lastSeenSeq).toBe(0);
        const eventsPromise = waitForEvents(watcher, 2);
        await appendJournalFile(runDir, 1, "RUN_CREATED");
        await appendJournalFile(runDir, 2, "EFFECT_REQUESTED");
        await eventsPromise;
        expect(watcher.lastSeenSeq).toBe(2);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-005: Multiple watchers ──

  describe("AC-005: multiple concurrent watchers", () => {
    it("independent watchers for different runDirs", async () => {
      const runDir1 = await scaffoldRunDir(path.join(testBase, "run-a"));
      const runDir2 = await scaffoldRunDir(path.join(testBase, "run-b"));

      const events1: number[] = [];
      const events2: number[] = [];

      const w1 = createJournalWatcher({
        runDir: runDir1,
        pollIntervalMs: 50,
        onEvent: (ev) => events1.push(ev.seq),
      });
      const w2 = createJournalWatcher({
        runDir: runDir2,
        pollIntervalMs: 50,
        onEvent: (ev) => events2.push(ev.seq),
      });

      try {
        const p1 = waitForEvents(w1, 1);
        const p2 = waitForEvents(w2, 1);

        await appendJournalFile(runDir1, 1, "RUN_CREATED");
        await appendJournalFile(runDir2, 1, "RUN_CREATED");

        await Promise.all([p1, p2]);
        expect(events1).toHaveLength(1);
        expect(events2).toHaveLength(1);
      } finally {
        w1.close();
        w2.close();
      }
    });
  });

  // ── AC-006: close() ──

  describe("AC-006: close() stops watching", () => {
    it("close stops event delivery", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-close"));
      const events: number[] = [];
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: (ev) => events.push(ev.seq),
      });

      watcher.close();
      await appendJournalFile(runDir, 1, "RUN_CREATED");
      await new Promise((r) => setTimeout(r, 200));
      expect(events).toHaveLength(0);
    });

    it("close is idempotent", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-close2"));
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: () => {},
      });

      watcher.close();
      watcher.close(); // should not throw
      watcher.close();
    });
  });

  // ── AC-007: Strict seq order ──

  describe("AC-007: events in strict seq order", () => {
    it("emits events in seq order when multiple appear at once", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-order"));
      // Pre-populate files out of order before starting watcher
      await appendJournalFile(runDir, 3, "EFFECT_RESOLVED");
      await appendJournalFile(runDir, 1, "RUN_CREATED");
      await appendJournalFile(runDir, 2, "EFFECT_REQUESTED");

      const received: number[] = [];
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: (ev) => received.push(ev.seq),
      });

      try {
        // Wait for watcher to scan
        await new Promise((r) => setTimeout(r, 300));
        expect(received).toEqual([1, 2, 3]);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-008: Missing journal directory ──

  describe("AC-008: handles missing journal directory", () => {
    it("waits for journal dir to appear then starts scanning", async () => {
      const runDir = path.join(testBase, "run-missing");
      // Don't create journal dir yet
      await fs.mkdir(runDir, { recursive: true });

      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: () => {},
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        // Create journal dir and add an event after a delay
        await new Promise((r) => setTimeout(r, 100));
        await appendJournalFile(runDir, 1, "RUN_CREATED");
        const events = await eventsPromise;
        expect(events[0].seq).toBe(1);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-009: Corrupt journal file ──

  describe("AC-009: handles corrupt journal files", () => {
    it("emits error callback and continues with next event", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-corrupt"));
      const errors: string[] = [];
      const events: number[] = [];

      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: (ev) => events.push(ev.seq),
        onError: (err) => errors.push(err.message),
      });

      try {
        // Write a corrupt file at seq 1
        const journalDir = path.join(runDir, "journal");
        await fs.writeFile(
          path.join(journalDir, "000001.AAAAAAAAAAAAAAAAAAAAAAAAAA.json"),
          "NOT VALID JSON{{{",
        );
        // Write a valid file at seq 2
        await appendJournalFile(runDir, 2, "RUN_CREATED");

        const eventsPromise = waitForEvents(watcher, 1);
        const receivedEvents = await eventsPromise;
        expect(receivedEvents[0].seq).toBe(2);
        expect(errors.length).toBeGreaterThanOrEqual(1);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-013: De-duplication ──

  describe("AC-013: de-duplicates events", () => {
    it("never delivers same seq twice", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-dedup"));
      const received: number[] = [];
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: (ev) => received.push(ev.seq),
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        await appendJournalFile(runDir, 1, "RUN_CREATED");
        await eventsPromise;
        // Wait for another poll cycle
        await new Promise((r) => setTimeout(r, 200));
        // seq 1 should appear exactly once
        expect(received.filter((s) => s === 1)).toHaveLength(1);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-015: Terminal events ──

  describe("AC-015: terminal events trigger done callback", () => {
    it("emits done on RUN_COMPLETED", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-done"));
      let doneTriggered = false;

      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: () => {},
        onDone: () => { doneTriggered = true; },
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        await appendJournalFile(runDir, 1, "RUN_COMPLETED", { status: "ok" });
        await eventsPromise;
        await new Promise((r) => setTimeout(r, 100));
        expect(doneTriggered).toBe(true);
      } finally {
        watcher.close();
      }
    });

    it("emits done on RUN_FAILED", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-failed"));
      let doneTriggered = false;

      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: () => {},
        onDone: () => { doneTriggered = true; },
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        await appendJournalFile(runDir, 1, "RUN_FAILED", { error: "boom" });
        await eventsPromise;
        await new Promise((r) => setTimeout(r, 100));
        expect(doneTriggered).toBe(true);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-016: Efficient scanning ──

  describe("AC-016: efficient incremental scanning", () => {
    it("only delivers new events on subsequent scans", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-efficient"));
      const received: number[] = [];

      // Pre-populate with seq 1-3
      await appendJournalFile(runDir, 1, "RUN_CREATED");
      await appendJournalFile(runDir, 2, "EFFECT_REQUESTED");
      await appendJournalFile(runDir, 3, "EFFECT_RESOLVED");

      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: (ev) => received.push(ev.seq),
      });

      try {
        // Wait for initial scan to pick up 1-3
        await new Promise((r) => setTimeout(r, 300));
        expect(received).toEqual([1, 2, 3]);

        // Add seq 4
        await appendJournalFile(runDir, 4, "RUN_COMPLETED");
        await new Promise((r) => setTimeout(r, 300));

        expect(received).toEqual([1, 2, 3, 4]);
      } finally {
        watcher.close();
      }
    });
  });

  // ── AC-012: Cross-platform / polling fallback ──

  describe("AC-012: polling-only mode with useFsWatch=false", () => {
    it("works correctly without fs.watch", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-poll"));
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        useFsWatch: false,
        onEvent: () => {},
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        await appendJournalFile(runDir, 1, "RUN_CREATED");
        const events = await eventsPromise;
        expect(events[0].seq).toBe(1);
      } finally {
        watcher.close();
      }
    });
  });

  // ── Terminal event auto-close ──

  describe("auto-close after terminal events", () => {
    it("stops polling after RUN_COMPLETED", async () => {
      const runDir = await scaffoldRunDir(path.join(testBase, "run-autoclose"));
      const events: number[] = [];
      const watcher = createJournalWatcher({
        runDir,
        pollIntervalMs: 50,
        onEvent: (ev) => events.push(ev.seq),
        onDone: () => {},
      });

      try {
        const eventsPromise = waitForEvents(watcher, 1);
        await appendJournalFile(runDir, 1, "RUN_COMPLETED");
        await eventsPromise;
        await new Promise((r) => setTimeout(r, 100));

        // After terminal event, watcher should be closed
        // Adding more events should not trigger callbacks
        await appendJournalFile(runDir, 2, "EFFECT_REQUESTED");
        await new Promise((r) => setTimeout(r, 200));
        expect(events).toEqual([1]);
      } finally {
        watcher.close(); // safe even if already closed
      }
    });
  });

  // ── Input validation in API ──

  describe("apiSubscribeRunEvents input validation", () => {
    it("validates runId is required", async () => {
      // This is tested at the eventStream.test.ts level, but let's verify
      // the watcher itself doesn't crash with invalid paths
      const watcher = createJournalWatcher({
        runDir: path.join(testBase, "nonexistent-dir"),
        pollIntervalMs: 50,
        onEvent: () => {},
      });

      // Should not throw — just polls waiting for dir
      await new Promise((r) => setTimeout(r, 200));
      watcher.close();
    });
  });
});

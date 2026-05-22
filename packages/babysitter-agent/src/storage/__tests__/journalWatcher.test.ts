/**
 * GAP-JSON-005: JournalWatcher — file-based journal event streaming.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import {
  createJournalWatcher,
  type JournalWatcher,
} from "../journalWatcher";

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
  await fs.writeFile(path.join(journalDir, filename), JSON.stringify(payload, null, 2));
}

function waitForEvents(
  watcher: JournalWatcher,
  count: number,
  timeoutMs = 15000,
): Promise<Array<{ seq: number; type: string }>> {
  return new Promise((resolve, reject) => {
    const events: Array<{ seq: number; type: string }> = [];
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${count} events, got ${events.length}`));
    }, timeoutMs);

    const originalOnEvent = watcher.onEvent;
    watcher.onEvent = (event) => {
      originalOnEvent(event);
      events.push({ seq: event.seq, type: event.type });
      if (events.length >= count) {
        clearTimeout(timer);
        resolve(events);
      }
    };
  });
}

let testBase: string;

beforeEach(async () => {
  testBase = tmpDir();
  await fs.mkdir(testBase, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testBase, { recursive: true, force: true });
});

describe("GAP-JSON-005: JournalWatcher", { timeout: 30000 }, () => {
  it("can be instantiated with a runDir", async () => {
    const runDir = await scaffoldRunDir(path.join(testBase, "run1"));
    const watcher = createJournalWatcher({
      runDir,
      pollIntervalMs: 100,
      useFsWatch: false,
      onEvent: () => {},
    });
    expect(watcher).toBeDefined();
    expect(typeof watcher.close).toBe("function");
    watcher.close();
  });

  it("delivers JournalEvent with seq and type", async () => {
    const runDir = await scaffoldRunDir(path.join(testBase, "run-emit"));
    const watcher = createJournalWatcher({
      runDir,
      pollIntervalMs: 50,
      useFsWatch: false,
      onEvent: () => {},
    });

    try {
      const eventsPromise = waitForEvents(watcher, 1);
      await appendJournalFile(runDir, 1, "RUN_CREATED", { runId: "test" });
      const events = await eventsPromise;
      expect(events).toEqual([{ seq: 1, type: "RUN_CREATED" }]);
    } finally {
      watcher.close();
    }
  });

  it("only emits events newer than afterSeq", async () => {
    const runDir = await scaffoldRunDir(path.join(testBase, "run-cursor"));
    await appendJournalFile(runDir, 1, "RUN_CREATED");
    await appendJournalFile(runDir, 2, "EFFECT_REQUESTED", { effectId: "e1" });

    const received: number[] = [];
    const watcher = createJournalWatcher({
      runDir,
      afterSeq: 1,
      pollIntervalMs: 50,
      useFsWatch: false,
      onEvent: (event) => received.push(event.seq),
    });

    try {
      const events = await waitForEvents(watcher, 1);
      expect(events[0].seq).toBe(2);
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(received).not.toContain(1);
    } finally {
      watcher.close();
    }
  });

  it("tracks lastSeenSeq and auto-closes on terminal events", async () => {
    const runDir = await scaffoldRunDir(path.join(testBase, "run-terminal"));
    let doneTriggered = false;
    const watcher = createJournalWatcher({
      runDir,
      pollIntervalMs: 50,
      useFsWatch: false,
      onEvent: () => {},
      onDone: () => {
        doneTriggered = true;
      },
    });

    try {
      const eventsPromise = waitForEvents(watcher, 1);
      await appendJournalFile(runDir, 1, "RUN_COMPLETED");
      await eventsPromise;
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(watcher.lastSeenSeq).toBe(1);
      expect(doneTriggered).toBe(true);
    } finally {
      watcher.close();
    }
  });

  it("continues after a corrupt file", async () => {
    const runDir = await scaffoldRunDir(path.join(testBase, "run-corrupt"));
    const errors: string[] = [];
    const watcher = createJournalWatcher({
      runDir,
      pollIntervalMs: 50,
      useFsWatch: false,
      onEvent: () => {},
      onError: (error) => errors.push(error.message),
    });

    try {
      const journalDir = path.join(runDir, "journal");
      await fs.writeFile(path.join(journalDir, "000001.AAAAAAAAAAAAAAAAAAAAAAAAAA.json"), "NOT VALID JSON{{{");
      const eventsPromise = waitForEvents(watcher, 1);
      await appendJournalFile(runDir, 2, "RUN_CREATED");
      const events = await eventsPromise;
      expect(events[0].seq).toBe(2);
      expect(errors.length).toBeGreaterThan(0);
    } finally {
      watcher.close();
    }
  });
});

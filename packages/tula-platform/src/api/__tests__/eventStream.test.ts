/**
 * GAP-JSON-005: Event Stream API — subscription management.
 *
 * Tests for apiSubscribeRunEvents, apiUnsubscribeRunEvents,
 * getActiveSubscriptions, closeAllSubscriptions.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

import {
  apiSubscribeRunEvents,
  apiUnsubscribeRunEvents,
  getActiveSubscriptions,
  closeAllSubscriptions,
} from "../eventStream";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-json-005-api-${crypto.randomUUID()}`);
}

async function scaffoldRunDir(
  baseDir: string,
  runId: string,
): Promise<string> {
  const runDir = path.join(baseDir, runId);
  const journalDir = path.join(runDir, "journal");
  await fs.mkdir(journalDir, { recursive: true });

  const metadata = {
    runId,
    processId: "test-process",
    entrypoint: { importPath: "/fake/process.js", exportName: "process" },
    createdAt: new Date().toISOString(),
    layoutVersion: "1",
  };
  await fs.writeFile(
    path.join(runDir, "run.json"),
    JSON.stringify(metadata, null, 2),
  );
  return runDir;
}

async function appendJournalEvent(
  runDir: string,
  seq: number,
  type: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const journalDir = path.join(runDir, "journal");
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

// ── Test state ───────────────────────────────────────────────────────────────

let testBase: string;

beforeEach(async () => {
  testBase = tmpDir();
  await fs.mkdir(testBase, { recursive: true });
});

afterEach(async () => {
  // Always clean up subscriptions
  closeAllSubscriptions();
  try {
    await fs.rm(testBase, { recursive: true, force: true });
  } catch {
    // cleanup best-effort
  }
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GAP-JSON-005: Event Stream API", () => {
  // ── AC-014: API functions with ApiResult envelopes ──

  describe("AC-014: subscribe/unsubscribe with ApiResult envelopes", () => {
    it("apiSubscribeRunEvents returns subscriptionId and lastSeq", async () => {
      await scaffoldRunDir(testBase, "run-sub");

      const result = await apiSubscribeRunEvents({
        runId: "run-sub",
        runsDir: testBase,
        onEvent: () => {},
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveProperty("subscriptionId");
      expect(typeof result.data.subscriptionId).toBe("string");
      expect(result.data).toHaveProperty("lastSeq");
      expect(typeof result.data.lastSeq).toBe("number");
    });

    it("apiUnsubscribeRunEvents returns lastSeq", async () => {
      await scaffoldRunDir(testBase, "run-unsub");

      const subResult = await apiSubscribeRunEvents({
        runId: "run-unsub",
        runsDir: testBase,
        onEvent: () => {},
      });

      expect(subResult.ok).toBe(true);
      if (!subResult.ok) return;

      const unsubResult = apiUnsubscribeRunEvents({
        subscriptionId: subResult.data.subscriptionId,
      });

      expect(unsubResult.ok).toBe(true);
      if (!unsubResult.ok) return;
      expect(unsubResult.data).toHaveProperty("lastSeq");
    });

    it("returns error for non-existent run", async () => {
      const result = await apiSubscribeRunEvents({
        runId: "nonexistent",
        runsDir: testBase,
        onEvent: () => {},
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("RUN_NOT_FOUND");
    });

    it("returns error for non-existent subscription", () => {
      const result = apiUnsubscribeRunEvents({
        subscriptionId: "nonexistent-sub-id",
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("SUBSCRIPTION_NOT_FOUND");
    });
  });

  // ── AC-003: afterSeq in subscribe ──

  describe("AC-003: subscribe with afterSeq cursor", () => {
    it("passes afterSeq to journal watcher", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-after");
      await appendJournalEvent(runDir, 1, "RUN_CREATED");
      await appendJournalEvent(runDir, 2, "EFFECT_REQUESTED");

      const received: number[] = [];
      const result = await apiSubscribeRunEvents({
        runId: "run-after",
        runsDir: testBase,
        afterSeq: 1,
        onEvent: (ev) => received.push(ev.seq),
        pollIntervalMs: 50,
      });

      expect(result.ok).toBe(true);
      // Wait for watcher to pick up events
      await new Promise((r) => setTimeout(r, 300));
      // Should only get seq 2, not seq 1
      expect(received).toContain(2);
      expect(received).not.toContain(1);
    });
  });

  // ── getActiveSubscriptions ──

  describe("getActiveSubscriptions", () => {
    it("returns empty map when no subscriptions", () => {
      const subs = getActiveSubscriptions();
      expect(subs.size).toBe(0);
    });

    it("tracks active subscriptions", async () => {
      await scaffoldRunDir(testBase, "run-track");

      const result = await apiSubscribeRunEvents({
        runId: "run-track",
        runsDir: testBase,
        onEvent: () => {},
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const subs = getActiveSubscriptions();
      expect(subs.size).toBe(1);
      expect(subs.has(result.data.subscriptionId)).toBe(true);
    });

    it("removes subscription on unsubscribe", async () => {
      await scaffoldRunDir(testBase, "run-track2");

      const result = await apiSubscribeRunEvents({
        runId: "run-track2",
        runsDir: testBase,
        onEvent: () => {},
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      apiUnsubscribeRunEvents({
        subscriptionId: result.data.subscriptionId,
      });

      const subs = getActiveSubscriptions();
      expect(subs.size).toBe(0);
    });
  });

  // ── closeAllSubscriptions ──

  describe("closeAllSubscriptions", () => {
    it("closes all active watchers", async () => {
      await scaffoldRunDir(testBase, "run-cleanup-1");
      await scaffoldRunDir(testBase, "run-cleanup-2");

      await apiSubscribeRunEvents({
        runId: "run-cleanup-1",
        runsDir: testBase,
        onEvent: () => {},
      });
      await apiSubscribeRunEvents({
        runId: "run-cleanup-2",
        runsDir: testBase,
        onEvent: () => {},
      });

      expect(getActiveSubscriptions().size).toBe(2);

      closeAllSubscriptions();

      expect(getActiveSubscriptions().size).toBe(0);
    });
  });

  // ── Input validation ──

  describe("input validation", () => {
    it("returns INVALID_INPUT for empty runId", async () => {
      const result = await apiSubscribeRunEvents({
        runId: "",
        runsDir: testBase,
        onEvent: () => {},
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });

    it("returns INVALID_INPUT for empty runsDir", async () => {
      const result = await apiSubscribeRunEvents({
        runId: "test",
        runsDir: "",
        onEvent: () => {},
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });

    it("returns INVALID_INPUT for empty subscriptionId on unsubscribe", () => {
      const result = apiUnsubscribeRunEvents({
        subscriptionId: "",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_INPUT");
    });
  });

  // ── Zombie subscription cleanup ──

  describe("auto-close removes subscription from registry", () => {
    it("cleans up subscription Map on terminal event", async () => {
      const runDir = await scaffoldRunDir(testBase, "run-zombie");
      await appendJournalEvent(runDir, 1, "RUN_CREATED");

      const result = await apiSubscribeRunEvents({
        runId: "run-zombie",
        runsDir: testBase,
        onEvent: () => {},
        pollIntervalMs: 50,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(getActiveSubscriptions().size).toBe(1);

      // Append terminal event
      await appendJournalEvent(runDir, 2, "RUN_COMPLETED");
      // Wait for watcher to pick it up and auto-close
      await new Promise((r) => setTimeout(r, 300));

      // Subscription should be automatically removed from Map
      expect(getActiveSubscriptions().size).toBe(0);
    });
  });

  // ── AC-010/AC-011: JSONL integration (barrel exports) ──

  describe("AC-010/AC-011: barrel re-exports", () => {
    it("functions are importable from api module", () => {
      expect(typeof apiSubscribeRunEvents).toBe("function");
      expect(typeof apiUnsubscribeRunEvents).toBe("function");
      expect(typeof getActiveSubscriptions).toBe("function");
      expect(typeof closeAllSubscriptions).toBe("function");
    });
  });
});

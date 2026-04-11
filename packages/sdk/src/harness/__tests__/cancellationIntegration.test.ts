/**
 * Integration tests: Effect Cancellation (GAP-TOOLS-030) x Bash Background Execution (GAP-TOOLS-036).
 *
 * Verifies that the BackgroundProcessRegistry cancellation path, EffectCancelledError,
 * EFFECT_CANCELLED journal handling in EffectIndex, and the EffectStatus type all
 * integrate correctly.
 */

import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { BackgroundProcessRegistry } from "../backgroundProcessRegistry";
import {
  EffectCancelledError,
  BabysitterIntrinsicError,
} from "../../runtime/exceptions";
import { EffectIndex } from "../../runtime/replay/effectIndex";
import type { EffectStatus } from "../../runtime/types";
import type { JournalEvent } from "../../storage/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait until a predicate returns true, polling every `intervalMs`. */
async function waitFor(
  predicate: () => boolean,
  timeoutMs = 5000,
  intervalMs = 50,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("waitFor timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

let seqCounter = 0;
let ulidCounter = 0;

function nextSeq(): number {
  return ++seqCounter;
}

function nextUlid(): string {
  return `01TESTULID${String(++ulidCounter).padStart(16, "0")}`;
}

function makeEvent(
  type: string,
  data: Record<string, unknown>,
  overrides?: Partial<JournalEvent>,
): JournalEvent {
  const seq = nextSeq();
  const ulid = nextUlid();
  return {
    seq,
    ulid,
    filename: `${String(seq).padStart(6, "0")}.${ulid}.json`,
    path: `/fake/journal/${String(seq).padStart(6, "0")}.${ulid}.json`,
    type,
    recordedAt: new Date().toISOString(),
    data,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Effect Cancellation x Background Execution integration", () => {
  const registries: BackgroundProcessRegistry[] = [];

  function createRegistry(opts?: { maxConcurrent?: number }) {
    const r = new BackgroundProcessRegistry(opts);
    registries.push(r);
    return r;
  }

  afterEach(() => {
    for (const r of registries) r.dispose();
    registries.length = 0;
    seqCounter = 0;
    ulidCounter = 0;
  });

  // -----------------------------------------------------------------------
  // Scenario 1: BackgroundProcessRegistry.cancel() terminates a running process
  // -----------------------------------------------------------------------
  it("cancel() terminates a running background process and sets status to cancelled", async () => {
    const registry = createRegistry();

    // Write a temp script to avoid shell quoting issues on Windows
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cancel-test-"));
    const scriptPath = path.join(tmpDir, "sleep.js");
    fs.writeFileSync(scriptPath, "setTimeout(()=>{},30000);");

    const record = registry.spawn({
      command: `node ${scriptPath}`,
      cwd: process.cwd(),
      description: "long-running sleep",
    });

    expect(record.status).toBe("running");

    // Cancel it
    const cancelled = registry.cancel(record.backgroundTaskId);
    expect(cancelled).toBe(true);

    // Verify snapshot reflects cancellation
    const snapshot = registry.get(record.backgroundTaskId);
    expect(snapshot).toBeDefined();
    expect(snapshot!.status).toBe("cancelled");
    expect(snapshot!.durationMs).toBeTypeOf("number");

    // Cleanup temp files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Scenario 2: Cancellation collects partial stdout
  // -----------------------------------------------------------------------
  it("partial stdout is available after cancellation", async () => {
    const registry = createRegistry();

    // Write a temp script that outputs data then sleeps
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cancel-test-"));
    const scriptPath = path.join(tmpDir, "output.js");
    fs.writeFileSync(
      scriptPath,
      "console.log('hello-partial'); setTimeout(()=>{},30000);",
    );

    const record = registry.spawn({
      command: `node ${scriptPath}`,
      cwd: process.cwd(),
      description: "stdout then sleep",
    });

    // Wait until some stdout has been collected (generous timeout for Windows)
    await waitFor(
      () => {
        const snap = registry.get(record.backgroundTaskId);
        return snap != null && snap.stdout.length > 0;
      },
      14000,
      100,
    );

    // Cancel
    registry.cancel(record.backgroundTaskId);

    const snapshot = registry.get(record.backgroundTaskId);
    expect(snapshot).toBeDefined();
    expect(snapshot!.status).toBe("cancelled");
    expect(snapshot!.stdout).toContain("hello-partial");

    // Cleanup temp files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }, 15000);

  // -----------------------------------------------------------------------
  // Scenario 3: EffectCancelledError properties are correct
  // -----------------------------------------------------------------------
  it("EffectCancelledError is a BabysitterIntrinsicError with correct properties", () => {
    const err = new EffectCancelledError("eff-001", "user requested cancellation");

    expect(err).toBeInstanceOf(BabysitterIntrinsicError);
    expect(err).toBeInstanceOf(Error);
    expect(err.isIntrinsic).toBe(true);
    expect(err.name).toBe("EffectCancelledError");
    expect(err.effectId).toBe("eff-001");
    expect(err.reason).toBe("user requested cancellation");
    expect(err.message).toContain("eff-001");
    expect(err.message).toContain("user requested cancellation");
  });

  it("EffectCancelledError works without a reason", () => {
    const err = new EffectCancelledError("eff-002");

    expect(err.isIntrinsic).toBe(true);
    expect(err.effectId).toBe("eff-002");
    expect(err.reason).toBeUndefined();
    expect(err.message).toBe("Effect eff-002 cancelled");
  });

  // -----------------------------------------------------------------------
  // Scenario 4: EFFECT_CANCELLED journal event handled by EffectIndex
  // -----------------------------------------------------------------------
  it("EffectIndex marks a cancelled effect and excludes it from pending", async () => {
    const effectId = "eff-cancel-test";
    const invocationKey = "inv-cancel-test";

    const events: JournalEvent[] = [
      makeEvent("RUN_CREATED", { runId: "run-1" }),
      makeEvent("EFFECT_REQUESTED", {
        effectId,
        invocationKey,
        stepId: "S000001",
        taskId: "task-1",
        kind: "node",
        taskDefRef: "tasks/eff-cancel-test/task.json",
      }),
      makeEvent("EFFECT_CANCELLED", {
        effectId,
        reason: "user cancelled",
      }),
    ];

    const index = await EffectIndex.build({ runDir: "/fake/run", events });

    // The effect should exist and be cancelled
    const record = index.getByEffectId(effectId);
    expect(record).toBeDefined();
    expect(record!.status).toBe("cancelled");
    expect(record!.resolvedAt).toBeDefined();

    // Should NOT appear in pending
    const pending = index.listPendingEffects();
    expect(pending.find((e) => e.effectId === effectId)).toBeUndefined();

    // Should still appear in the full list
    const all = index.listEffects();
    expect(all.find((e) => e.effectId === effectId)).toBeDefined();
  });

  it("EffectIndex rejects EFFECT_CANCELLED for an already-resolved effect", async () => {
    const effectId = "eff-double-cancel";
    const invocationKey = "inv-double-cancel";

    const events: JournalEvent[] = [
      makeEvent("RUN_CREATED", { runId: "run-2" }),
      makeEvent("EFFECT_REQUESTED", {
        effectId,
        invocationKey,
        stepId: "S000001",
        taskId: "task-1",
        kind: "node",
        taskDefRef: "tasks/eff-double-cancel/task.json",
      }),
      makeEvent("EFFECT_RESOLVED", {
        effectId,
        status: "ok",
        resultRef: "tasks/eff-double-cancel/result.json",
      }),
    ];

    // Adding EFFECT_CANCELLED for an already-resolved effect should throw
    const cancelEvent = makeEvent("EFFECT_CANCELLED", {
      effectId,
      reason: "too late",
    });

    await expect(
      EffectIndex.build({ runDir: "/fake/run", events: [...events, cancelEvent] }),
    ).rejects.toThrow(/not requested/i);
  });

  // -----------------------------------------------------------------------
  // Scenario 5: 'cancelled' is a valid EffectStatus
  // -----------------------------------------------------------------------
  it("'cancelled' is a valid EffectStatus value", () => {
    // TypeScript compilation of this assignment proves the type includes 'cancelled'.
    const status: EffectStatus = "cancelled";
    expect(status).toBe("cancelled");

    // Also verify the full set
    const allStatuses: EffectStatus[] = [
      "requested",
      "resolved_ok",
      "resolved_error",
      "cancelled",
    ];
    expect(allStatuses).toContain("cancelled");
  });
});

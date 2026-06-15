import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DurableTriggerQueue } from "../durableQueue";
import { runDaemonLoop } from "../loop";
import type { TriggerEvent } from "../types";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "agent-runtime-queue-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function fileTrigger(processId = "proc"): TriggerEvent {
  return { type: "file", processId, entrypoint: "main" };
}

describe("DurableTriggerQueue", () => {
  it("persists pending trigger events and replays them after restart", async () => {
    const dir = await makeTempDir();
    const queue = await DurableTriggerQueue.open(dir);

    const enqueued = await queue.enqueue(fileTrigger("first"));
    expect(enqueued.state).toBe("pending");

    const reopened = await DurableTriggerQueue.open(dir);
    const due = await reopened.claimDue();

    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(enqueued.id);
    expect(due[0].trigger).toEqual(fileTrigger("first"));
    expect(due[0].state).toBe("running");
  });

  it("retries failed events and moves them to the dead-letter state", async () => {
    const dir = await makeTempDir();
    const queue = await DurableTriggerQueue.open(dir, { maxAttempts: 2, baseBackoffMs: 0 });
    const event = await queue.enqueue(fileTrigger("retry"));

    await queue.claimDue();
    await queue.fail(event.id, "boom");
    let due = await queue.claimDue();
    expect(due).toHaveLength(1);
    expect(due[0].attempts).toBe(2);

    await queue.fail(event.id, "boom again");
    due = await queue.claimDue();
    expect(due).toHaveLength(0);

    const snapshot = await queue.snapshot();
    expect(snapshot.find((item) => item.id === event.id)?.state).toBe("dead-letter");
  });

  it("stores ack states durably", async () => {
    const dir = await makeTempDir();
    const queue = await DurableTriggerQueue.open(dir);
    const event = await queue.enqueue(fileTrigger("done"));

    await queue.claimDue();
    await queue.ack(event.id);

    const content = JSON.parse(await readFile(path.join(dir, "trigger-queue.json"), "utf-8"));
    expect(content.events[0].state).toBe("succeeded");
    expect(content.events[0].ackedAt).toBeDefined();
  });
});

describe("runDaemonLoop durable replay", () => {
  it("replays pending queue events on startup and contains onTrigger errors", async () => {
    const dir = await makeTempDir();
    const queue = await DurableTriggerQueue.open(dir, { maxAttempts: 1 });
    await queue.enqueue(fileTrigger("queued"));

    const controller = new AbortController();
    const onTrigger = vi.fn(async () => {
      controller.abort();
      throw new Error("handler failed");
    });

    await runDaemonLoop(
      { workspace: dir, triggers: [], maxConcurrentRuns: 1 },
      { logDir: dir, signal: controller.signal, onTrigger, queue: { maxAttempts: 1 } },
    );

    expect(onTrigger).toHaveBeenCalledTimes(1);
    const reopened = await DurableTriggerQueue.open(dir);
    const snapshot = await reopened.snapshot();
    expect(snapshot[0].state).toBe("dead-letter");
  });
});

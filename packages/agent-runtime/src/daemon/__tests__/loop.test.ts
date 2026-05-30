import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const timerSchedulerModule = vi.hoisted(() => ({
  createTimerScheduler: vi.fn(),
}));
const webhookListenerModule = vi.hoisted(() => ({
  createWebhookListener: vi.fn(),
}));

vi.mock("../timerScheduler", () => timerSchedulerModule);
vi.mock("../webhookListener", () => webhookListenerModule);

import { readDaemonLoopStatus, runDaemonLoop } from "../loop";
import type { DaemonConfig } from "../types";

const tempDirs: string[] = [];

function createTimerRule() {
  return {
    id: "rule-timer",
    name: "Daily digest",
    state: "active" as const,
    trigger: {
      type: "timer" as const,
      cron: "0 9 * * 1-5",
      timezone: "UTC",
    },
    target: {
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
    },
    template: {
      title: "Review the daily digest",
    },
    routing: {
      issue: {
        action: "canonical-issue-create" as const,
        projectId: "kanban-app",
      },
      board: {
        action: "shared-board-derive" as const,
        boardProjectId: "kanban-app",
      },
      mutateBoardDirectly: false as const,
    },
    source: {
      kind: "config-file" as const,
    },
    audit: {
      createdAt: "2026-04-24T00:00:00.000Z",
    },
  };
}

function createWebhookRule() {
  return {
    id: "rule-webhook",
    name: "GitHub webhook",
    state: "active" as const,
    trigger: {
      type: "webhook" as const,
      port: 4100,
      path: "/github/issues",
      method: "POST" as const,
      sourceEvent: "issues.opened",
    },
    target: {
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
    },
    template: {
      title: "Triage GitHub issue",
    },
    routing: {
      issue: {
        action: "canonical-issue-create" as const,
        projectId: "kanban-app",
      },
      board: {
        action: "shared-board-derive" as const,
        boardProjectId: "kanban-app",
      },
      mutateBoardDirectly: false as const,
    },
    source: {
      kind: "external-system" as const,
      provider: "github",
    },
    audit: {
      createdAt: "2026-04-24T00:00:00.000Z",
    },
  };
}

describe("runDaemonLoop trigger admission", () => {
  afterEach(async () => {
    timerSchedulerModule.createTimerScheduler.mockReset();
    webhookListenerModule.createWebhookListener.mockReset();
    await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it("deduplicates repeated trigger fingerprints within the configured window", async () => {
    const ac = new AbortController();
    const logDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-loop-"));
    tempDirs.push(logDir);
    const rule = createTimerRule();
    const admissionResults: unknown[] = [];

    timerSchedulerModule.createTimerScheduler.mockImplementationOnce((rules, onTrigger) => {
      queueMicrotask(() => {
        Promise.resolve(onTrigger({ type: "automation", rule: rules[0], inputs: { deliveryId: "same" } }))
          .then((result) => admissionResults.push(result))
          .then(() => onTrigger({ type: "automation", rule: rules[0], inputs: { deliveryId: "same" } }))
          .then((result) => admissionResults.push(result))
          .then(() => ac.abort());
      });
      return { dispose: vi.fn() };
    });

    const onTrigger = vi.fn().mockResolvedValue(undefined);
    await runDaemonLoop(
      {
        workspace: logDir,
        triggers: [rule],
        triggerAdmission: { dedupeWindowMs: 60_000 },
      },
      { signal: ac.signal, onTrigger, logDir },
    );

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(admissionResults).toMatchObject([
      { status: "accepted" },
      { status: "duplicate", reason: "dedupe-window" },
    ]);
    expect(await readDaemonLoopStatus(logDir)).toMatchObject({
      duplicateTriggers: 1,
    });
  });

  it("rate limits trigger admission before enqueueing webhook work", async () => {
    const ac = new AbortController();
    const logDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-loop-"));
    tempDirs.push(logDir);
    const rule = createWebhookRule();
    const admissionResults: unknown[] = [];

    webhookListenerModule.createWebhookListener.mockImplementationOnce(async ({ rule: listenerRule, onTrigger }) => {
      queueMicrotask(() => {
        Promise.resolve(onTrigger({ type: "automation", rule: listenerRule, inputs: { deliveryId: "one" } }))
          .then((result) => admissionResults.push(result))
          .then(() => onTrigger({ type: "automation", rule: listenerRule, inputs: { deliveryId: "two" } }))
          .then((result) => admissionResults.push(result))
          .then(() => ac.abort());
      });
      return { close: vi.fn().mockResolvedValue(undefined), port: listenerRule.trigger.port };
    });

    const onTrigger = vi.fn().mockResolvedValue(undefined);
    await runDaemonLoop(
      {
        workspace: logDir,
        triggers: [rule],
        triggerAdmission: { rateLimit: { maxTriggers: 1, windowMs: 60_000 } },
      } satisfies DaemonConfig,
      { signal: ac.signal, onTrigger, logDir },
    );

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(admissionResults).toMatchObject([
      { status: "accepted" },
      { status: "rejected", reason: "rate-limit" },
    ]);
    expect(await readDaemonLoopStatus(logDir)).toMatchObject({
      rejectedTriggers: 1,
      rateLimitedTriggers: 1,
    });
  });
});

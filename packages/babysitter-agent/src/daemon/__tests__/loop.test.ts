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

async function waitForFile(filePath: string): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (Date.now() < deadline) {
    try {
      await fs.stat(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

function createTimerRule() {
  return {
    id: "rule-timer",
    name: "Daily digest",
    state: "paused" as const,
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
      path: ".a5c/automations.json",
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

describe("runDaemonLoop", () => {
  afterEach(async () => {
    vi.useRealTimers();
    timerSchedulerModule.createTimerScheduler.mockReset();
    webhookListenerModule.createWebhookListener.mockReset();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it("starts and stops with AbortSignal", async () => {
    const ac = new AbortController();
    const config: DaemonConfig = {
      workspace: "/tmp/test",
      triggers: [],
    };

    // Abort immediately
    ac.abort();

    await runDaemonLoop(config, { signal: ac.signal });
    // Should complete without hanging
  });

  it("dispatches timer automation triggers with rule state intact and records activation metadata", async () => {
    const ac = new AbortController();
    const logDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-loop-"));
    tempDirs.push(logDir);
    const rule = createTimerRule();
    const dispose = vi.fn();
    timerSchedulerModule.createTimerScheduler.mockImplementationOnce((rules, onTrigger) => {
      queueMicrotask(() => {
        void onTrigger({
          type: "automation",
          rule: rules[0],
          inputs: {
            scheduledAt: "2026-04-24T09:00:00.000Z",
          },
        });
        ac.abort();
      });
      return { dispose };
    });
    webhookListenerModule.createWebhookListener.mockResolvedValue({
      close: vi.fn().mockResolvedValue(undefined),
      port: 4100,
    });

    const onTrigger = vi.fn().mockResolvedValue(undefined);
    await runDaemonLoop(
      {
        workspace: "/tmp/test",
        triggers: [rule],
      },
      { signal: ac.signal, onTrigger, logDir },
    );

    expect(timerSchedulerModule.createTimerScheduler).toHaveBeenCalledWith([rule], expect.any(Function));
    expect(onTrigger).toHaveBeenCalledWith({
      type: "automation",
      rule,
      inputs: {
        scheduledAt: "2026-04-24T09:00:00.000Z",
      },
    });
    expect(dispose).toHaveBeenCalled();

    const logPath = path.join(logDir, "daemon.jsonl");
    const statusPath = path.join(logDir, "daemon.status.json");
    await waitForFile(logPath);
    await waitForFile(statusPath);

    const logLines = (await fs.readFile(logPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { event: string; data: Record<string, unknown> });
    expect(logLines).toEqual([
      expect.objectContaining({
        event: "TRIGGER_ACTIVATED",
        data: expect.objectContaining({
          type: "automation",
          ruleId: "rule-timer",
          triggerType: "timer",
          projectId: "kanban-app",
          boardProjectId: "kanban-app",
        }),
      }),
    ]);
    expect(await readDaemonLoopStatus(logDir)).toMatchObject({
      activeRuns: 0,
      pendingRuns: 0,
    });
  });

  it("defaults maxConcurrentRuns to 4", async () => {
    const ac = new AbortController();
    const config: DaemonConfig = {
      workspace: "/tmp/test",
      triggers: [],
    };

    ac.abort();
    // Should not throw
    await runDaemonLoop(config, { signal: ac.signal });
  });

  it("dispatches webhook automation triggers and closes the listener on shutdown", async () => {
    const ac = new AbortController();
    const logDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-loop-"));
    tempDirs.push(logDir);
    const rule = createWebhookRule();
    const close = vi.fn().mockResolvedValue(undefined);
    webhookListenerModule.createWebhookListener.mockImplementationOnce(async ({ rule: listenerRule, onTrigger }) => {
      queueMicrotask(() => {
        void onTrigger({
          type: "automation",
          rule: listenerRule,
          inputs: {
            deliveryId: "delivery-001",
          },
        });
        ac.abort();
      });
      return {
        close,
        port: listenerRule.trigger.port,
      };
    });
    timerSchedulerModule.createTimerScheduler.mockImplementationOnce(() => ({
      dispose: vi.fn(),
    }));

    const onTrigger = vi.fn().mockResolvedValue(undefined);
    await runDaemonLoop(
      {
        workspace: "/tmp/test",
        triggers: [rule],
      },
      { signal: ac.signal, onTrigger, logDir },
    );

    expect(webhookListenerModule.createWebhookListener).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledWith({
      type: "automation",
      rule,
      inputs: {
        deliveryId: "delivery-001",
      },
    });
    expect(close).toHaveBeenCalled();

    const logPath = path.join(logDir, "daemon.jsonl");
    await waitForFile(logPath);

    const logLines = (await fs.readFile(logPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { event: string; data: Record<string, unknown> });
    expect(logLines).toEqual([
      expect.objectContaining({
        event: "TRIGGER_ACTIVATED",
        data: expect.objectContaining({
          type: "automation",
          ruleId: "rule-webhook",
          triggerType: "webhook",
          projectId: "kanban-app",
          boardProjectId: "kanban-app",
        }),
      }),
    ]);
  });
});

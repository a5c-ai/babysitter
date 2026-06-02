import { describe, it, expect, vi, afterEach } from "vitest";
import { createTimerScheduler } from "../timerScheduler";

function timerRule(overrides: Partial<{
  id: string;
  cron: string;
  timezone: string;
}> = {}) {
  return {
    id: overrides.id ?? "rule-1",
    name: "Timer rule",
    state: "active" as const,
    trigger: {
      type: "timer" as const,
      cron: overrides.cron ?? "30 10 * * *",
      timezone: overrides.timezone,
    },
    target: {
      projectId: "kanban-app",
      boardProjectId: "kanban-app",
    },
    template: {
      title: "Generated task",
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

describe("timerScheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("supports named months and weekdays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "30 10 * JAN THU" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it("supports standard cron macros", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 0, 0, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "@daily" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it("evaluates timer rules in their configured timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T05:00:00.000Z"));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "0 0 * * *", timezone: "America/New_York" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it("fires @reboot once when the scheduler starts", async () => {
    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "@reboot" })],
      onTrigger,
    );

    await Promise.resolve();

    expect(onTrigger).toHaveBeenCalledWith({
      type: "automation",
      rule: timerRule({ cron: "@reboot" }),
      inputs: { scheduledBy: "@reboot" },
    });
    handle.dispose();
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { createTimerScheduler } from "../timerScheduler";

function timerRule(overrides: Partial<{
  id: string;
  cron: string;
  projectId: string;
  title: string;
}> = {}) {
  const projectId = overrides.projectId ?? "kanban-app";
  return {
    id: overrides.id ?? "rule-1",
    name: "Timer rule",
    state: "active" as const,
    trigger: {
      type: "timer" as const,
      cron: overrides.cron ?? "30 10 * * *",
    },
    target: {
      projectId,
      boardProjectId: projectId,
    },
    template: {
      title: overrides.title ?? "Generated task",
    },
    routing: {
      issue: {
        action: "canonical-issue-create" as const,
        projectId,
      },
      board: {
        action: "shared-board-derive" as const,
        boardProjectId: projectId,
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

  it("fires onTrigger when cron matches current time", () => {
    vi.useFakeTimers();
    // Set to 2026-01-15 10:30:00 (Thursday, dow=4)
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ id: "rule-1", cron: "30 10 * * *" })],
      onTrigger,
    );

    // Advance 30s to trigger the interval check
    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledWith({
      type: "automation",
      rule: timerRule({ id: "rule-1", cron: "30 10 * * *" }),
    });

    handle.dispose();
  });

  it("does not fire when cron does not match", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "0 12 * * *" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).not.toHaveBeenCalled();

    handle.dispose();
  });

  it("fires only once per minute even with multiple interval checks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "30 10 * * *" })],
      onTrigger,
    );

    // Two interval firings within the same minute
    vi.advanceTimersByTime(30_000);
    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);

    handle.dispose();
  });

  it("skips triggers with invalid cron expressions", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [
        timerRule({ id: "rule-invalid", cron: "invalid" }),
        timerRule({ id: "rule-valid", cron: "30 10 * * *" }),
      ],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledWith({
      type: "automation",
      rule: timerRule({ id: "rule-valid", cron: "30 10 * * *" }),
    });

    handle.dispose();
  });

  it("supports comma-separated cron values", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 15, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "15,30,45 10 * * *" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);

    handle.dispose();
  });

  it("matches day-of-week correctly", () => {
    vi.useFakeTimers();
    // 2026-01-15 is a Thursday (dow=4)
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [
        timerRule({ id: "monday", cron: "30 10 * * 1" }),
        timerRule({ id: "thursday", cron: "30 10 * * 4" }),
      ],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledWith({
      type: "automation",
      rule: timerRule({ id: "thursday", cron: "30 10 * * 4" }),
    });

    handle.dispose();
  });

  it("supports step syntax (*/15)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 15, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "*/15 * * * *" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);
    expect(onTrigger).toHaveBeenCalledTimes(1);

    handle.dispose();
  });

  it("supports range syntax (1-5)", () => {
    vi.useFakeTimers();
    // Wednesday (dow=3, within range 1-5)
    vi.setSystemTime(new Date(2026, 0, 14, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ id: "weekday", cron: "30 10 * * 1-5" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);
    expect(onTrigger).toHaveBeenCalledTimes(1);

    handle.dispose();
  });

  it("does not fire range cron on day outside range", () => {
    vi.useFakeTimers();
    // Sunday (dow=0, outside 1-5)
    vi.setSystemTime(new Date(2026, 0, 18, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ id: "weekday", cron: "30 10 * * 1-5" })],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);
    expect(onTrigger).not.toHaveBeenCalled();

    handle.dispose();
  });

  it("dispose stops the interval", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 29, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [timerRule({ cron: "30 10 * * *" })],
      onTrigger,
    );

    handle.dispose();

    // Advance past matching time
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));
    vi.advanceTimersByTime(30_000);

    expect(onTrigger).not.toHaveBeenCalled();
  });
});

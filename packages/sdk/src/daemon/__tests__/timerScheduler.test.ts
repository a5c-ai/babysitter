import { describe, it, expect, vi, afterEach } from "vitest";
import { createTimerScheduler } from "../timerScheduler";

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
      [{ cron: "30 10 * * *", processId: "p1", entrypoint: "e1" }],
      onTrigger,
    );

    // Advance 30s to trigger the interval check
    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledWith({
      processId: "p1",
      entrypoint: "e1",
    });

    handle.dispose();
  });

  it("does not fire when cron does not match", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [{ cron: "0 12 * * *", processId: "p1", entrypoint: "e1" }],
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
      [{ cron: "30 10 * * *", processId: "p1", entrypoint: "e1" }],
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
        { cron: "invalid", processId: "p1", entrypoint: "e1" },
        { cron: "30 10 * * *", processId: "p2", entrypoint: "e2" },
      ],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledWith({
      processId: "p2",
      entrypoint: "e2",
    });

    handle.dispose();
  });

  it("supports comma-separated cron values", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 15, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [{ cron: "15,30,45 10 * * *", processId: "p1", entrypoint: "e1" }],
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
        { cron: "30 10 * * 1", processId: "monday", entrypoint: "e1" },
        { cron: "30 10 * * 4", processId: "thursday", entrypoint: "e2" },
      ],
      onTrigger,
    );

    vi.advanceTimersByTime(30_000);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledWith({
      processId: "thursday",
      entrypoint: "e2",
    });

    handle.dispose();
  });

  it("supports step syntax (*/15)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 15, 0));

    const onTrigger = vi.fn();
    const handle = createTimerScheduler(
      [{ cron: "*/15 * * * *", processId: "p1", entrypoint: "e1" }],
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
      [{ cron: "30 10 * * 1-5", processId: "weekday", entrypoint: "e1" }],
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
      [{ cron: "30 10 * * 1-5", processId: "weekday", entrypoint: "e1" }],
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
      [{ cron: "30 10 * * *", processId: "p1", entrypoint: "e1" }],
      onTrigger,
    );

    handle.dispose();

    // Advance past matching time
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30, 0));
    vi.advanceTimersByTime(30_000);

    expect(onTrigger).not.toHaveBeenCalled();
  });
});

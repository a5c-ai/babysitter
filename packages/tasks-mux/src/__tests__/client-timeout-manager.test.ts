import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TimeoutManager } from "../client/timeout-manager.js";

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("TimeoutManager", () => {
  let manager: TimeoutManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new TimeoutManager();
  });

  afterEach(() => {
    manager.dispose();
    vi.useRealTimers();
  });

  // ── trackBreakpoint ─────────────────────────────────────────────────────

  describe("trackBreakpoint()", () => {
    it("should register a timeout for a breakpoint", () => {
      const callback = vi.fn();
      manager.trackBreakpoint("bp-001", 5000, callback);

      expect(manager.getTrackedIds()).toContain("bp-001");
    });

    it("should fire callback when timeout expires", () => {
      const callback = vi.fn();
      manager.trackBreakpoint("bp-001", 5000, callback);

      vi.advanceTimersByTime(5000);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("bp-001");
    });

    it("should not fire callback before timeout expires", () => {
      const callback = vi.fn();
      manager.trackBreakpoint("bp-001", 5000, callback);

      vi.advanceTimersByTime(4999);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should mark breakpoint as timed out after firing", () => {
      const callback = vi.fn();
      manager.trackBreakpoint("bp-001", 5000, callback);

      expect(manager.isTimedOut("bp-001")).toBe(false);

      vi.advanceTimersByTime(5000);

      expect(manager.isTimedOut("bp-001")).toBe(true);
    });

    it("should replace existing timeout when tracking the same breakpointId", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.trackBreakpoint("bp-001", 5000, callback1);
      manager.trackBreakpoint("bp-001", 3000, callback2);

      vi.advanceTimersByTime(3000);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple concurrent breakpoints", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      manager.trackBreakpoint("bp-001", 1000, callback1);
      manager.trackBreakpoint("bp-002", 2000, callback2);
      manager.trackBreakpoint("bp-003", 3000, callback3);

      vi.advanceTimersByTime(1000);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(callback2).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it("should handle zero timeout", () => {
      const callback = vi.fn();
      manager.trackBreakpoint("bp-001", 0, callback);

      vi.advanceTimersByTime(0);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ── cancelTracking ──────────────────────────────────────────────────────

  describe("cancelTracking()", () => {
    it("should return true when cancelling a tracked breakpoint", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());

      const result = manager.cancelTracking("bp-001");

      expect(result).toBe(true);
    });

    it("should return false when cancelling a non-tracked breakpoint", () => {
      const result = manager.cancelTracking("bp-nonexistent");

      expect(result).toBe(false);
    });

    it("should prevent timeout callback from firing", () => {
      const callback = vi.fn();
      manager.trackBreakpoint("bp-001", 5000, callback);

      manager.cancelTracking("bp-001");
      vi.advanceTimersByTime(10000);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should remove breakpoint from tracked IDs", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());
      manager.cancelTracking("bp-001");

      expect(manager.getTrackedIds()).not.toContain("bp-001");
    });
  });

  // ── getStatus ───────────────────────────────────────────────────────────

  describe("getStatus()", () => {
    it("should return undefined for untracked breakpoint", () => {
      const status = manager.getStatus("bp-nonexistent");
      expect(status).toBeUndefined();
    });

    it("should return status with correct breakpointId", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());

      const status = manager.getStatus("bp-001");
      expect(status?.breakpointId).toBe("bp-001");
    });

    it("should return timedOut=false before timeout", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());

      const status = manager.getStatus("bp-001");
      expect(status?.timedOut).toBe(false);
    });

    it("should return timedOut=true after timeout", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());
      vi.advanceTimersByTime(5000);

      const status = manager.getStatus("bp-001");
      expect(status?.timedOut).toBe(true);
    });

    it("should return decreasing remainingMs as time passes", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());

      const before = manager.getStatus("bp-001")!.remainingMs;
      vi.advanceTimersByTime(2000);
      const after = manager.getStatus("bp-001")!.remainingMs;

      expect(after).toBeLessThan(before);
    });

    it("should return remainingMs of 0 after timeout", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());
      vi.advanceTimersByTime(10000);

      const status = manager.getStatus("bp-001");
      expect(status?.remainingMs).toBe(0);
    });
  });

  // ── isTimedOut ──────────────────────────────────────────────────────────

  describe("isTimedOut()", () => {
    it("should return false for untracked breakpoint", () => {
      expect(manager.isTimedOut("bp-nonexistent")).toBe(false);
    });

    it("should return false before timeout fires", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());
      expect(manager.isTimedOut("bp-001")).toBe(false);
    });

    it("should return true after timeout fires", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());
      vi.advanceTimersByTime(5000);
      expect(manager.isTimedOut("bp-001")).toBe(true);
    });
  });

  // ── getTrackedIds ───────────────────────────────────────────────────────

  describe("getTrackedIds()", () => {
    it("should return empty array when nothing is tracked", () => {
      expect(manager.getTrackedIds()).toEqual([]);
    });

    it("should return all tracked breakpoint IDs", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());
      manager.trackBreakpoint("bp-002", 5000, vi.fn());
      manager.trackBreakpoint("bp-003", 5000, vi.fn());

      const ids = manager.getTrackedIds();
      expect(ids).toHaveLength(3);
      expect(ids).toContain("bp-001");
      expect(ids).toContain("bp-002");
      expect(ids).toContain("bp-003");
    });
  });

  // ── dispose ─────────────────────────────────────────────────────────────

  describe("dispose()", () => {
    it("should clear all tracked timeouts", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());
      manager.trackBreakpoint("bp-002", 5000, vi.fn());

      manager.dispose();

      expect(manager.getTrackedIds()).toEqual([]);
    });

    it("should prevent all pending callbacks from firing", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.trackBreakpoint("bp-001", 5000, callback1);
      manager.trackBreakpoint("bp-002", 5000, callback2);

      manager.dispose();
      vi.advanceTimersByTime(10000);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it("should be safe to call multiple times", () => {
      manager.trackBreakpoint("bp-001", 5000, vi.fn());

      expect(() => {
        manager.dispose();
        manager.dispose();
      }).not.toThrow();
    });
  });
});

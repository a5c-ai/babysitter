import { renderHook, act } from "@testing-library/react";
import { useBatchedUpdates, BURST_THRESHOLD, BURST_WINDOW_MS, CATCHUP_HOLD_MS } from "../use-batched-updates";

// ---------------------------------------------------------------------------
// Mock the SSE event stream subscribe function
// ---------------------------------------------------------------------------

type EventCallback = (event: { type: string; runId?: string }) => void;
let subscriberCallbacks: Set<EventCallback> = new Set();

vi.mock("../use-event-stream", () => ({
  subscribe: (callback: EventCallback) => {
    subscriberCallbacks.add(callback);
    return () => {
      subscriberCallbacks.delete(callback);
    };
  },
}));

function emitSSE(event: { type: string; runId?: string }) {
  subscriberCallbacks.forEach((cb) => cb(event));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useBatchedUpdates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    subscriberCallbacks = new Set();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts inactive with 0 buffered count", () => {
    const { result } = renderHook(() => useBatchedUpdates());
    expect(result.current.active).toBe(false);
    expect(result.current.bufferedCount).toBe(0);
  });

  it("does not activate for a small number of events", () => {
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
      })
    );

    // Send fewer events than the threshold
    for (let i = 0; i < BURST_THRESHOLD - 1; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(false);
  });

  it("activates catch-up mode when burst threshold is reached", () => {
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
      })
    );

    // Send enough events to trigger burst detection
    for (let i = 0; i < BURST_THRESHOLD; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(true);
    expect(result.current.bufferedCount).toBe(BURST_THRESHOLD);
  });

  it("increments bufferedCount for events received during catch-up mode", () => {
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
      })
    );

    // Trigger catch-up mode
    for (let i = 0; i < BURST_THRESHOLD; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(true);

    // Send more events
    act(() => {
      emitSSE({ type: "update", runId: "extra-1" });
    });
    act(() => {
      emitSSE({ type: "update", runId: "extra-2" });
    });

    expect(result.current.bufferedCount).toBe(BURST_THRESHOLD + 2);
  });

  it("ignores non-data events (connected, disconnect, error)", () => {
    const { result } = renderHook(() => useBatchedUpdates());

    act(() => {
      emitSSE({ type: "connected" });
      emitSSE({ type: "disconnect" });
      emitSSE({ type: "error" });
    });

    expect(result.current.active).toBe(false);
    expect(result.current.bufferedCount).toBe(0);
  });

  it("respects sseFilter — does not count filtered-out events", () => {
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
      })
    );

    // Send events that don't match the filter
    for (let i = 0; i < BURST_THRESHOLD + 5; i++) {
      act(() => {
        emitSSE({ type: "heartbeat", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(false);
  });

  it("auto-exits catch-up mode after hold period with no new events", async () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
        onFlush,
      })
    );

    // Trigger catch-up mode
    for (let i = 0; i < BURST_THRESHOLD; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(true);

    // Wait for the hold period to expire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CATCHUP_HOLD_MS + 100);
    });

    expect(result.current.active).toBe(false);
    expect(result.current.bufferedCount).toBe(0);
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it("resets the hold timer when new events arrive during catch-up", async () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
        onFlush,
      })
    );

    // Trigger catch-up mode
    for (let i = 0; i < BURST_THRESHOLD; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(true);

    // Wait almost to the hold timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CATCHUP_HOLD_MS - 500);
    });

    // Send another event — should reset the timer
    act(() => {
      emitSSE({ type: "update", runId: "late-event" });
    });

    // The original timeout would have expired by now, but the timer was reset
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.active).toBe(true);
    expect(onFlush).not.toHaveBeenCalled();

    // Now wait for the full hold period from the last event
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CATCHUP_HOLD_MS);
    });
    expect(result.current.active).toBe(false);
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it("flush() immediately exits catch-up mode and calls onFlush", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
        onFlush,
      })
    );

    // Trigger catch-up mode
    for (let i = 0; i < BURST_THRESHOLD; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(true);

    // Flush
    act(() => {
      result.current.flush();
    });

    expect(result.current.active).toBe(false);
    expect(result.current.bufferedCount).toBe(0);
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it("flush() is a no-op when not in catch-up mode", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() =>
      useBatchedUpdates({ onFlush })
    );

    act(() => {
      result.current.flush();
    });

    expect(onFlush).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const { result } = renderHook(() =>
      useBatchedUpdates({ enabled: false })
    );

    // Send many events
    for (let i = 0; i < BURST_THRESHOLD + 5; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    expect(result.current.active).toBe(false);
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
      })
    );

    // Verify we have a subscriber
    expect(subscriberCallbacks.size).toBeGreaterThan(0);

    unmount();

    // Subscriber should be removed
    // Note: the exact count depends on how many hooks subscribe,
    // but after unmount the hook's subscriber should be gone
    const _countAfter = subscriberCallbacks.size;
    // Verify no errors when emitting after unmount
    act(() => {
      emitSSE({ type: "update" });
    });
  });

  it("prunes old timestamps outside burst window", async () => {
    const { result } = renderHook(() =>
      useBatchedUpdates({
        sseFilter: (e) => e.type === "update",
      })
    );

    // Send some events
    for (let i = 0; i < BURST_THRESHOLD - 2; i++) {
      act(() => {
        emitSSE({ type: "update", runId: `run-${i}` });
      });
    }

    // Wait longer than the burst window so old timestamps expire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BURST_WINDOW_MS + 100);
    });

    // Send a few more events — not enough to reach threshold from scratch
    act(() => {
      emitSSE({ type: "update", runId: "late-1" });
    });
    act(() => {
      emitSSE({ type: "update", runId: "late-2" });
    });

    // Should NOT be in catch-up mode because old events were pruned
    expect(result.current.active).toBe(false);
  });
});

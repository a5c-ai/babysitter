import { renderHook, act } from "@testing-library/react";
import { useAnimatedNumber } from "../use-animated-number";

describe("useAnimatedNumber", () => {
  let mockNow = 0;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;

  beforeEach(() => {
    vi.useFakeTimers();
    mockNow = 0;
    rafId = 0;
    rafCallbacks = new Map();

    // Mock performance.now to advance in sync with our fake time
    vi.spyOn(performance, "now").mockImplementation(() => mockNow);

    // Mock requestAnimationFrame: schedules via setTimeout(16ms) and
    // passes the current mock time to the callback.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = ++rafId;
      const timer = setTimeout(() => {
        rafCallbacks.delete(id);
        cb(mockNow);
      }, 16);
      rafCallbacks.set(id, timer as any);
      return id;
    });

    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      const timer = rafCallbacks.get(id);
      if (timer !== undefined) {
        clearTimeout(timer as any);
        rafCallbacks.delete(id);
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Advance fake time by `ms` milliseconds, also advancing performance.now(). */
  async function advanceTime(ms: number) {
    mockNow += ms;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  it("returns the target value immediately on first render", () => {
    const { result } = renderHook(() => useAnimatedNumber(42));
    expect(result.current).toBe(42);
  });

  it("snaps immediately for small changes (diff <= 2)", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target),
      { initialProps: { target: 10 } }
    );

    expect(result.current).toBe(10);

    // Change by 1 -- should snap immediately
    rerender({ target: 11 });
    expect(result.current).toBe(11);

    // Change by 2 -- should snap immediately
    rerender({ target: 13 });
    expect(result.current).toBe(13);
  });

  it("animates towards the target for larger changes", async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 600),
      { initialProps: { target: 10 } }
    );

    expect(result.current).toBe(10);

    // Change by 40 -- should start animating
    rerender({ target: 50 });

    // Advance a few frames -- value should be in between
    await advanceTime(200);

    expect(result.current).toBeGreaterThanOrEqual(10);
    expect(result.current).toBeLessThanOrEqual(50);
  });

  it("reaches exact target after full animation duration", async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 300),
      { initialProps: { target: 0 } }
    );

    rerender({ target: 100 });

    // Wait well past the animation duration
    await advanceTime(500);

    expect(result.current).toBe(100);
  });

  it("handles going from a higher number to lower", async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 300),
      { initialProps: { target: 100 } }
    );

    expect(result.current).toBe(100);

    rerender({ target: 20 });

    // Wait for animation to complete
    await advanceTime(500);
    expect(result.current).toBe(20);
  });

  it("interrupts in-progress animation when target changes mid-flight", async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 600),
      { initialProps: { target: 0 } }
    );

    // Start animating to 100
    rerender({ target: 100 });

    await advanceTime(100);

    // Mid-animation, change target to 200
    rerender({ target: 200 });

    // Wait for new animation to fully complete
    await advanceTime(800);

    expect(result.current).toBe(200);
  });

  it("does not animate when target stays the same", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target),
      { initialProps: { target: 42 } }
    );

    expect(result.current).toBe(42);

    // Re-render with same value
    rerender({ target: 42 });
    expect(result.current).toBe(42);
  });

  it("cleans up animation on unmount without errors", async () => {
    const { unmount, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 600),
      { initialProps: { target: 10 } }
    );

    // Start animation
    rerender({ target: 100 });

    // Unmount mid-animation -- should not throw
    unmount();

    // Advance timers -- no error should occur
    await advanceTime(700);
  });

  it("returns integer values (never fractional)", async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 300),
      { initialProps: { target: 0 } }
    );

    rerender({ target: 91 });

    // Check at various points during animation
    for (let ms = 0; ms < 400; ms += 16) {
      await advanceTime(16);
      expect(Number.isInteger(result.current)).toBe(true);
    }
  });
});

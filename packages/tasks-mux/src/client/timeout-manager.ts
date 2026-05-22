/**
 * Status of a tracked breakpoint timeout.
 */
export interface TimeoutStatus {
  breakpointId: string;
  timedOut: boolean;
  remainingMs: number;
}

/**
 * Callback invoked when a breakpoint's timeout fires.
 */
export type TimeoutCallback = (breakpointId: string) => void;

interface TrackedTimeout {
  timer: ReturnType<typeof setTimeout>;
  expiresAt: number;
  timedOut: boolean;
  callback: TimeoutCallback;
}

/**
 * Manages timeout tracking for in-flight breakpoints.
 * Fires a callback when a breakpoint's deadline is reached.
 */
export class TimeoutManager {
  private readonly tracked = new Map<string, TrackedTimeout>();

  /**
   * Register a timeout for a breakpoint.
   * If the breakpoint is already tracked, the existing timeout is replaced.
   */
  trackBreakpoint(
    breakpointId: string,
    timeoutMs: number,
    onTimeout: TimeoutCallback,
  ): void {
    // Cancel any existing tracking
    this.cancelTracking(breakpointId);

    const expiresAt = Date.now() + timeoutMs;

    const timer = setTimeout(() => {
      const entry = this.tracked.get(breakpointId);
      if (entry) {
        entry.timedOut = true;
        entry.callback(breakpointId);
      }
    }, timeoutMs);

    this.tracked.set(breakpointId, {
      timer,
      expiresAt,
      timedOut: false,
      callback: onTimeout,
    });
  }

  /**
   * Cancel timeout tracking for a breakpoint.
   * Returns true if the breakpoint was being tracked.
   */
  cancelTracking(breakpointId: string): boolean {
    const entry = this.tracked.get(breakpointId);
    if (!entry) return false;

    clearTimeout(entry.timer);
    this.tracked.delete(breakpointId);
    return true;
  }

  /**
   * Get the timeout status for a breakpoint.
   * Returns undefined if the breakpoint is not being tracked.
   */
  getStatus(breakpointId: string): TimeoutStatus | undefined {
    const entry = this.tracked.get(breakpointId);
    if (!entry) return undefined;

    const remainingMs = Math.max(0, entry.expiresAt - Date.now());
    return {
      breakpointId,
      timedOut: entry.timedOut,
      remainingMs,
    };
  }

  /**
   * Check if a specific breakpoint has timed out.
   */
  isTimedOut(breakpointId: string): boolean {
    return this.tracked.get(breakpointId)?.timedOut ?? false;
  }

  /**
   * Get all currently tracked breakpoint IDs.
   */
  getTrackedIds(): string[] {
    return [...this.tracked.keys()];
  }

  /**
   * Clear all timeouts and release resources.
   */
  dispose(): void {
    for (const entry of this.tracked.values()) {
      clearTimeout(entry.timer);
    }
    this.tracked.clear();
  }
}

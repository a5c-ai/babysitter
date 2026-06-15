/**
 * Multi-Harness Dispatch (GAP-PAR-003).
 *
 * Dispatches tasks to multiple harness targets in parallel and
 * collects settled results. Enables cross-harness orchestration
 * where the same effect can be executed by different agent runtimes.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A target harness to dispatch to. */
export interface DispatchTarget {
  /** Harness identifier (e.g. "claude-code", "cursor", "windsurf"). */
  harness: string;
  /** Task prompt or payload to send. */
  prompt: string;
  /** Optional timeout in milliseconds. */
  timeoutMs?: number;
}

/** Result from a single dispatched target. */
export interface DispatchResult {
  /** The target that was dispatched to. */
  target: DispatchTarget;
  /** Whether the dispatch succeeded. */
  status: "fulfilled" | "rejected";
  /** Response content, if successful. */
  response?: string;
  /** Error reason, if failed. */
  reason?: unknown;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
}

/** Handler function that executes a dispatch to a single target. */
export type DispatchHandler = (target: DispatchTarget) => Promise<string>;

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatches tasks to multiple harness targets and collects results.
 *
 * The actual harness invocation is delegated to the provided handler,
 * keeping this class transport-agnostic.
 */
export class MultiHarnessDispatcher {
  constructor(private readonly handler: DispatchHandler) {}

  /**
   * Dispatch to all targets concurrently and return settled results.
   *
   * Never throws — all failures are captured in the result array.
   */
  async dispatch(targets: DispatchTarget[]): Promise<DispatchResult[]> {
    if (targets.length === 0) return [];

    const tasks = targets.map(async (target): Promise<DispatchResult> => {
      const startMs = Date.now();

      try {
        const response = await this.executeWithTimeout(target);
        return {
          target,
          status: "fulfilled",
          response,
          durationMs: Date.now() - startMs,
        };
      } catch (error) {
        return {
          target,
          status: "rejected",
          reason: error,
          durationMs: Date.now() - startMs,
        };
      }
    });

    return Promise.all(tasks);
  }

  private async executeWithTimeout(target: DispatchTarget): Promise<string> {
    if (!target.timeoutMs) {
      return this.handler(target);
    }

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Dispatch to ${target.harness} timed out after ${target.timeoutMs}ms`));
      }, target.timeoutMs);

      this.handler(target).then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }
}

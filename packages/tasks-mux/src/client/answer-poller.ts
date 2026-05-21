import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_POLL_INTERVAL_MS,
} from "../types.js";
import type { Breakpoint, BreakpointWaitResult } from "../types.js";
import type { BreakpointBackend } from "../backend.js";
import { ServerClient } from "./server-client.js";

/**
 * Options for waiting for an answer via the client-side poller.
 */
export interface PollerWaitForAnswerOptions {
  /** Maximum time to wait in milliseconds. Defaults to DEFAULT_TIMEOUT_MS (30 min). */
  timeoutMs?: number;
  /** Polling interval in milliseconds when using HTTP polling. Defaults to DEFAULT_POLL_INTERVAL_MS (3s). */
  pollIntervalMs?: number;
  /** Whether to use SSE for real-time updates. Falls back to polling if false or on error. */
  useSSE?: boolean;
  /** AbortSignal for external cancellation. */
  signal?: AbortSignal;
}

/**
 * Waits for answers to breakpoints using either SSE streaming or HTTP polling.
 *
 * Accepts either a ServerClient (legacy) or a BreakpointBackend.
 * When a BreakpointBackend is passed, delegates to its waitForAnswer method.
 * When a ServerClient is passed, uses the existing SSE/polling logic.
 */
export class AnswerPoller {
  private readonly client: ServerClient | null;
  private readonly backend: BreakpointBackend | null;

  constructor(clientOrBackend: ServerClient | BreakpointBackend) {
    if (clientOrBackend instanceof ServerClient) {
      this.client = clientOrBackend;
      this.backend = null;
    } else {
      this.client = null;
      this.backend = clientOrBackend;
    }
  }

  /**
   * Wait for an answer to a breakpoint.
   *
   * Resolves when:
   * - An answer is received (status becomes "answered" or "completed")
   * - The breakpoint expires or is cancelled
   * - The timeout is reached
   * - The operation is aborted via AbortSignal
   */
  async waitForAnswer(
    breakpointId: string,
    options: PollerWaitForAnswerOptions = {},
  ): Promise<BreakpointWaitResult> {
    // When using a BreakpointBackend, delegate entirely to its waitForAnswer
    if (this.backend) {
      return this.backend.waitForAnswer(breakpointId, {
        timeoutMs: options.timeoutMs,
        pollIntervalMs: options.pollIntervalMs,
        preferStreaming: options.useSSE,
        signal: options.signal,
      });
    }

    const {
      timeoutMs = DEFAULT_TIMEOUT_MS,
      pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
      useSSE = true,
      signal,
    } = options;

    const startTime = Date.now();

    // Set up abort handling
    const controller = new AbortController();
    if (signal) {
      if (signal.aborted) {
        return this.buildResult(breakpointId, startTime);
      }
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    // Set up timeout
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (useSSE) {
        try {
          return await this.waitViaSSE(breakpointId, startTime, controller.signal);
        } catch {
          // If SSE fails and we're not aborted, fall back to polling
          if (controller.signal.aborted) {
            return this.buildResult(breakpointId, startTime);
          }
          // Fallback to polling
        }
      }

      return await this.waitViaPolling(breakpointId, pollIntervalMs, startTime, controller.signal);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Wait for an answer using SSE streaming.
   */
  private waitViaSSE(
    breakpointId: string,
    startTime: number,
    signal: AbortSignal,
  ): Promise<BreakpointWaitResult> {
    return new Promise<BreakpointWaitResult>((resolve, reject) => {
      if (signal.aborted) {
        void this.buildResult(breakpointId, startTime).then(resolve, reject);
        return;
      }

      const stream = this.client!.getBreakpointStream(breakpointId, signal);

      const cleanup = () => {
        stream.close();
      };

      signal.addEventListener("abort", () => {
        cleanup();
        void this.buildResult(breakpointId, startTime).then(resolve, reject);
      }, { once: true });

      stream.on("answer", (data) => {
        cleanup();
        try {
          const breakpoint = JSON.parse(data) as Breakpoint;
          const elapsed = Date.now() - startTime;
          const answer = breakpoint.answers[breakpoint.answers.length - 1];
          resolve({
            answered: true,
            breakpoint,
            answer,
            allAnswers: breakpoint.answers,
            resolution: "answered",
            elapsedMs: elapsed,
          });
        } catch {
          // If we can't parse the SSE data, fetch from server
          void this.buildResult(breakpointId, startTime).then(resolve, reject);
        }
      });

      stream.on("status", (data) => {
        try {
          const payload = JSON.parse(data) as { status: string };
          if (payload.status === "expired" || payload.status === "cancelled") {
            cleanup();
            void this.buildResult(breakpointId, startTime).then(resolve, reject);
          }
        } catch {
          // Ignore parse errors for status events
        }
      });

      stream.on("completed", () => {
        cleanup();
        void this.buildResult(breakpointId, startTime).then(resolve, reject);
      });

      stream.onError((err) => {
        cleanup();
        reject(err);
      });
    });
  }

  /**
   * Wait for an answer using HTTP polling.
   */
  private async waitViaPolling(
    breakpointId: string,
    pollIntervalMs: number,
    startTime: number,
    signal: AbortSignal,
  ): Promise<BreakpointWaitResult> {
    while (!signal.aborted) {
      const breakpoint = await this.client!.getBreakpoint(breakpointId);

      if (isTerminalStatus(breakpoint.status)) {
        return this.breakpointToResult(breakpoint, startTime);
      }

      // Wait for the next poll interval or until aborted
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, pollIntervalMs);
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
      });
    }

    // Aborted - fetch final state
    return this.buildResult(breakpointId, startTime);
  }

  /**
   * Fetch the current breakpoint state and build a BreakpointWaitResult.
   */
  private async buildResult(
    breakpointId: string,
    startTime: number,
  ): Promise<BreakpointWaitResult> {
    try {
      const breakpoint = await this.client!.getBreakpoint(breakpointId);
      return this.breakpointToResult(breakpoint, startTime);
    } catch {
      // If we can't even fetch the breakpoint, return a minimal result
      return {
        answered: false,
        breakpoint: {
          id: breakpointId,
          text: "",
          context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
          status: "expired",
          routing: { strategy: "single", targetResponders: [], timeoutMs: 0, presentToUser: false },
          answers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
        allAnswers: [],
        resolution: "error",
        elapsedMs: Date.now() - startTime,
      };
    }
  }

  private breakpointToResult(breakpoint: Breakpoint, startTime: number): BreakpointWaitResult {
    const answered = breakpoint.status === "answered" || breakpoint.status === "completed";
    const answer = answered
      ? breakpoint.answers[breakpoint.answers.length - 1]
      : undefined;

    return {
      answered,
      breakpoint,
      answer,
      allAnswers: breakpoint.answers,
      resolution: breakpoint.status,
      elapsedMs: Date.now() - startTime,
    };
  }
}

function isTerminalStatus(status: string): boolean {
  return ["answered", "completed", "expired", "cancelled"].includes(status);
}

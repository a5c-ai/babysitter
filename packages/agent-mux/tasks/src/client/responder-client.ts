import { DEFAULT_POLL_INTERVAL_MS } from "../types.js";
import type { Breakpoint, BreakpointAnswer } from "../types.js";
import { ServerClient } from "./server-client.js";

/**
 * Callback invoked when new pending breakpoints are found.
 */
export type BreakpointCallback = (breakpoints: Breakpoint[]) => void | Promise<void>;

/**
 * Client used by responders to receive, claim, and answer breakpoints.
 */
export class ResponderClient {
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly client: ServerClient,
    public readonly responderId: string,
  ) {}

  /**
   * Fetch all pending breakpoints routed to this responder.
   */
  async fetchPendingBreakpoints(): Promise<Breakpoint[]> {
    return this.client.listPendingBreakpoints(this.responderId);
  }

  /**
   * Claim a breakpoint so no other responder can answer it.
   */
  async claimBreakpoint(breakpointId: string): Promise<Breakpoint> {
    return this.client.claimBreakpoint(breakpointId, this.responderId);
  }

  /**
   * Submit an answer to a claimed breakpoint.
   */
  async submitAnswer(
    breakpointId: string,
    text: string,
    confidence = 80,
    references: string[] = [],
  ): Promise<BreakpointAnswer> {
    return this.client.submitAnswer(breakpointId, {
      responderId: this.responderId,
      responderName: this.responderId, // Server should resolve the actual name
      text,
      confidence,
      references,
    });
  }

  /**
   * Start a polling loop that periodically checks for new pending breakpoints
   * and invokes the callback when breakpoints are found.
   *
   * Returns a function to stop the loop.
   */
  startPollingLoop(
    callback: BreakpointCallback,
    intervalMs: number = DEFAULT_POLL_INTERVAL_MS,
  ): () => void {
    // Stop any existing loop
    this.stopPollingLoop();

    const poll = async () => {
      try {
        const breakpoints = await this.fetchPendingBreakpoints();
        if (breakpoints.length > 0) {
          await callback(breakpoints);
        }
      } catch (err) {
        // Log polling errors but continue the loop
        console.error("Responder polling error:", err);
      }
    };

    // Run immediately, then on interval
    void poll();
    this.pollingTimer = setInterval(() => void poll(), intervalMs);

    return () => this.stopPollingLoop();
  }

  /**
   * Stop the current polling loop if running.
   */
  stopPollingLoop(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

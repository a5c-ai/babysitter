/**
 * CircuitBreaker — closed/open/half-open state machine for protecting
 * downstream calls from cascading failures.
 *
 * States:
 *  - closed   — requests pass through normally; failures are counted.
 *  - open     — all requests are rejected immediately; after `resetTimeoutMs`
 *               the breaker transitions to half-open.
 *  - half-open — a single probe request is allowed; success resets to closed,
 *                failure reopens.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit. Default: 5. */
  failureThreshold?: number;
  /** Time (ms) the circuit stays open before transitioning to half-open. Default: 30 000. */
  resetTimeoutMs?: number;
}

export interface CircuitBreakerSnapshot {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureAt: number | null = null;
  private lastSuccessAt: number | null = null;
  private openedAt: number | null = null;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5;
    this.resetTimeoutMs = options?.resetTimeoutMs ?? 30_000;
  }

  // -------------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------------

  /** Return a point-in-time snapshot of the breaker state. */
  getState(now?: number): CircuitBreakerSnapshot {
    // Check for automatic transition from open → half-open
    this.maybeTick(now);
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
    };
  }

  /** Whether the circuit currently allows requests through. */
  isAllowed(now?: number): boolean {
    this.maybeTick(now);
    return this.state !== 'open';
  }

  // -------------------------------------------------------------------------
  // Recording outcomes
  // -------------------------------------------------------------------------

  /** Record a successful call. Resets the breaker to closed. */
  recordSuccess(now?: number): void {
    const ts = now ?? Date.now();
    this.lastSuccessAt = ts;
    this.failureCount = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  /** Record a failed call. Opens the circuit when the threshold is reached. */
  recordFailure(now?: number): void {
    const ts = now ?? Date.now();
    this.lastFailureAt = ts;
    this.failureCount++;

    if (this.state === 'half-open' || this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = ts;
    }
  }

  /** Force the breaker into the closed state (e.g. manual override). */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.openedAt = null;
  }

  // -------------------------------------------------------------------------
  // Execute with protection
  // -------------------------------------------------------------------------

  /**
   * Execute `fn` through the circuit breaker.
   * Throws if the circuit is open.
   */
  async execute<T>(fn: () => Promise<T>, now?: number): Promise<T> {
    const ts = now ?? Date.now();
    if (!this.isAllowed(ts)) {
      throw new Error('Circuit breaker is open — request rejected');
    }

    try {
      const result = await fn();
      this.recordSuccess(ts);
      return result;
    } catch (err) {
      this.recordFailure(ts);
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private maybeTick(now?: number): void {
    if (this.state === 'open' && this.openedAt != null) {
      const ts = now ?? Date.now();
      if (ts - this.openedAt >= this.resetTimeoutMs) {
        this.state = 'half-open';
      }
    }
  }
}

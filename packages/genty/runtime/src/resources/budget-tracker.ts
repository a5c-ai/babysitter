/**
 * Generic budget tracker for token and cost budgets.
 *
 * Tracks consumption against a configured limit and fires callbacks
 * when usage crosses registered threshold percentages.
 */

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/** Thrown when a `consume` call would exceed the budget limit. */
export class BudgetExceededError extends Error {
  readonly limit: number;
  readonly used: number;
  readonly requested: number;

  constructor(limit: number, used: number, requested: number) {
    super(
      `Budget exceeded: requested ${requested} but only ${limit - used} remaining (limit=${limit}, used=${used})`,
    );
    this.name = "BudgetExceededError";
    this.limit = limit;
    this.used = used;
    this.requested = requested;
  }
}

// ---------------------------------------------------------------------------
// Check result
// ---------------------------------------------------------------------------

/** Result of a `check()` call describing current budget health. */
export interface BudgetCheck {
  /** Whether further consumption is allowed. */
  readonly allowed: boolean;
  /** Units remaining before the limit is reached. */
  readonly remaining: number;
  /** Percentage of the budget consumed (0–100). */
  readonly percentUsed: number;
}

// ---------------------------------------------------------------------------
// Threshold entry (internal)
// ---------------------------------------------------------------------------

interface ThresholdEntry {
  /** Threshold percentage (0–100). */
  percent: number;
  callback: () => void;
  /** Whether this threshold has already fired. */
  fired: boolean;
}

// ---------------------------------------------------------------------------
// BudgetTracker
// ---------------------------------------------------------------------------

export class BudgetTracker {
  private _limit: number;
  private _used: number;
  private readonly _thresholds: ThresholdEntry[] = [];

  constructor(limit: number) {
    if (limit < 0) {
      throw new RangeError("Budget limit must be non-negative");
    }
    this._limit = limit;
    this._used = 0;
  }

  // -- Getters --------------------------------------------------------------

  get limit(): number {
    return this._limit;
  }

  get used(): number {
    return this._used;
  }

  get remaining(): number {
    return Math.max(0, this._limit - this._used);
  }

  // -- Core API -------------------------------------------------------------

  /**
   * Consume `amount` units from the budget.
   *
   * @throws {BudgetExceededError} if `amount` exceeds `remaining`.
   */
  consume(amount: number): void {
    if (amount < 0) {
      throw new RangeError("Consume amount must be non-negative");
    }
    if (amount > this.remaining) {
      throw new BudgetExceededError(this._limit, this._used, amount);
    }
    this._used += amount;
    this._evaluateThresholds();
  }

  /**
   * Release previously consumed units back into the budget.
   *
   * The released amount is capped so that `used` never goes below zero.
   */
  release(amount: number): void {
    if (amount < 0) {
      throw new RangeError("Release amount must be non-negative");
    }
    this._used = Math.max(0, this._used - amount);
    // Re-arm any thresholds that are now above current usage.
    for (const entry of this._thresholds) {
      const currentPercent =
        this._limit === 0 ? 100 : (this._used / this._limit) * 100;
      if (currentPercent < entry.percent) {
        entry.fired = false;
      }
    }
  }

  /** Check the current budget state without mutating it. */
  check(): BudgetCheck {
    const percentUsed =
      this._limit === 0 ? 100 : (this._used / this._limit) * 100;
    return {
      allowed: this.remaining > 0,
      remaining: this.remaining,
      percentUsed: Math.min(100, percentUsed),
    };
  }

  /**
   * Register a callback that fires when usage crosses `percent`%.
   *
   * @param percent - Threshold percentage (0–100).
   * @param callback - Function invoked once when the threshold is crossed.
   */
  onThreshold(percent: number, callback: () => void): void {
    if (percent < 0 || percent > 100) {
      throw new RangeError("Threshold percent must be between 0 and 100");
    }
    const entry: ThresholdEntry = { percent, callback, fired: false };
    this._thresholds.push(entry);

    // Fire immediately if already past threshold.
    const currentPercent =
      this._limit === 0 ? 100 : (this._used / this._limit) * 100;
    if (currentPercent >= percent) {
      entry.fired = true;
      callback();
    }
  }

  /** Reset all usage to zero and re-arm all thresholds. */
  reset(): void {
    this._used = 0;
    for (const entry of this._thresholds) {
      entry.fired = false;
    }
  }

  // -- Internals ------------------------------------------------------------

  private _evaluateThresholds(): void {
    const currentPercent =
      this._limit === 0 ? 100 : (this._used / this._limit) * 100;
    for (const entry of this._thresholds) {
      if (!entry.fired && currentPercent >= entry.percent) {
        entry.fired = true;
        entry.callback();
      }
    }
  }
}

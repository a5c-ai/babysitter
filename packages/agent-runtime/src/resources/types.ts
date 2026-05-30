/**
 * Resource management interfaces for Babysitter Agent Runtime.
 *
 * Covers budget tracking (tokens, cost), concurrency limits, timeouts,
 * and a unified resource manager. Interface-only stubs; implementations
 * will follow in issue #217.
 */

// ---------------------------------------------------------------------------
// Budget Types
// ---------------------------------------------------------------------------

/** Token consumption budget for a run or session. */
export interface TokenBudget {
  /** Maximum allowed tokens. */
  readonly limit: number;
  /** Tokens consumed so far. */
  readonly used: number;
  /** Tokens remaining (`limit - used`). */
  readonly remaining: number;
  /** Optional threshold (0-1) at which a warning callback fires. */
  readonly warningThreshold?: number;
}

/** Monetary cost budget for a run or session. */
export interface CostBudget {
  /** Maximum allowed cost. */
  readonly limit: number;
  /** Cost consumed so far. */
  readonly used: number;
  /** Cost remaining (`limit - used`). */
  readonly remaining: number;
  /** ISO 4217 currency code; defaults to "USD". */
  readonly currency?: string;
}

// ---------------------------------------------------------------------------
// Concurrency & Timeouts
// ---------------------------------------------------------------------------

/** Hard caps on parallel work within a single orchestration scope. */
export interface ConcurrencyLimits {
  /** Maximum effects that may execute in parallel. */
  readonly maxParallelEffects: number;
  /** Maximum babysitter runs that may execute in parallel. */
  readonly maxParallelRuns: number;
  /** Maximum Claude Code sessions that may execute in parallel. */
  readonly maxParallelSessions: number;
}

/** Timeout configuration at various granularity levels. */
export interface TimeoutConfig {
  /** Maximum wall-clock duration for a single effect (ms). */
  readonly perEffect?: number;
  /** Maximum wall-clock duration for a single iteration (ms). */
  readonly perIteration?: number;
  /** Maximum wall-clock duration for an entire run (ms). */
  readonly perRun?: number;
  /** Policy applied when a timeout fires (e.g. "cancel", "warn", "escalate"). */
  readonly escalationPolicy?: string;
}

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

/** Point-in-time snapshot of all tracked resource dimensions. */
export interface ResourceSnapshot {
  /** Current token budget state. */
  readonly tokens: TokenBudget;
  /** Current cost budget state. */
  readonly cost: CostBudget;
  /** Current concurrency utilisation (used counts, not limits). */
  readonly concurrency: ConcurrencyLimits;
  /** ISO-8601 timestamp when this snapshot was captured. */
  readonly timestamp: string;
}

// ---------------------------------------------------------------------------
// Budget Kind
// ---------------------------------------------------------------------------

/** Discriminator for the type of budget being queried or mutated. */
export type BudgetKind = "tokens" | "cost";

// ---------------------------------------------------------------------------
// Warning Callback
// ---------------------------------------------------------------------------

/** Payload delivered to resource-warning subscribers. */
export interface ResourceWarning {
  /** Which budget triggered the warning. */
  readonly kind: BudgetKind;
  /** The budget state at the time of the warning. */
  readonly budget: TokenBudget | CostBudget;
  /** ISO-8601 timestamp of the warning. */
  readonly timestamp: string;
}

/** Callback signature for resource warning notifications. */
export type ResourceWarningCallback = (warning: ResourceWarning) => void;

export interface ResourceAdmissionRequest {
  readonly tokens?: number;
  readonly cost?: number;
}

export interface ResourceAdmissionDecision {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly snapshot: ResourceSnapshot;
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

/** Unified resource manager for budget enforcement and reporting. */
export interface ResourceManager {
  /**
   * Check the current budget state for a given kind.
   *
   * @param kind - "tokens" or "cost".
   * @returns The corresponding budget snapshot.
   */
  checkBudget(kind: BudgetKind): TokenBudget | CostBudget;

  /**
   * Record consumption against a budget.
   *
   * @param kind - Which budget to charge.
   * @param amount - Units to consume.
   */
  consume(kind: BudgetKind, amount: number): void;

  /**
   * Atomically check and reserve resources before dispatching new work.
   *
   * A denied decision must not mutate budget state.
   */
  admit(request: ResourceAdmissionRequest): ResourceAdmissionDecision;

  /**
   * Release previously consumed units back into a budget (e.g. on rollback).
   *
   * @param kind - Which budget to credit.
   * @param amount - Units to release.
   */
  release(kind: BudgetKind, amount: number): void;

  /**
   * Capture a point-in-time snapshot of all resource dimensions.
   */
  getSnapshot(): ResourceSnapshot;

  /**
   * Register a callback that fires when any budget crosses its warning threshold.
   *
   * @param callback - Function invoked with the warning payload.
   */
  onWarning(callback: ResourceWarningCallback): void;

  /**
   * Admit OS execution limits into the resource layer.
   *
   * This records the policy seam for executors. ResourceManager does not apply
   * kernel limits directly; concrete executors translate accepted limits.
   */
  admitExecutionPolicy(policy: import("../execution").ExecutionPolicy): import("../execution").ResourceAdmission;
}

/**
 * Unified resource manager that composes budget trackers, a concurrency
 * guard, and a timeout cascade into the `ResourceManager` interface.
 */

import type {
  BudgetKind,
  ConcurrencyLimits,
  CostBudget,
  ResourceManager,
  ResourceAdmissionDecision,
  ResourceAdmissionRequest,
  ResourceSnapshot,
  ResourceWarningCallback,
  TokenBudget,
} from "./types";
import type { ExecutionPolicy, ResourceAdmission } from "../execution";
import { admitExecutionPolicy } from "../execution";
import { BudgetTracker } from "./budget-tracker";
import { ConcurrencyGuard } from "./concurrency-guard";
import { TimeoutCascade } from "./timeout-cascade";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Options for constructing a `ResourceManagerImpl`. */
export interface ResourceManagerOptions {
  /** Token budget limit. */
  tokenLimit: number;
  /** Cost budget limit. */
  costLimit: number;
  /** ISO 4217 currency code for cost budget. Defaults to "USD". */
  costCurrency?: string;
  /** Warning threshold percentage (0–100) for both budgets. */
  warningThresholdPercent?: number;
  /** Concurrency limits. */
  concurrency?: {
    maxParallelEffects?: number;
    maxParallelRuns?: number;
    maxParallelSessions?: number;
  };
}

// ---------------------------------------------------------------------------
// ResourceManagerImpl
// ---------------------------------------------------------------------------

export class ResourceManagerImpl implements ResourceManager {
  private readonly _tokenBudget: BudgetTracker;
  private readonly _costBudget: BudgetTracker;
  private readonly _costCurrency: string;
  private readonly _warningThresholdPercent: number;

  /** Concurrency guard for parallel effects. */
  readonly effects: ConcurrencyGuard;
  /** Concurrency guard for parallel runs. */
  readonly runs: ConcurrencyGuard;
  /** Concurrency guard for parallel sessions. */
  readonly sessions: ConcurrencyGuard;
  /** Timeout cascade for run / iteration / effect timeouts. */
  readonly timeouts: TimeoutCascade;

  private readonly _warningCallbacks: ResourceWarningCallback[] = [];

  constructor(options: ResourceManagerOptions) {
    this._tokenBudget = new BudgetTracker(options.tokenLimit);
    this._costBudget = new BudgetTracker(options.costLimit);
    this._costCurrency = options.costCurrency ?? "USD";
    this._warningThresholdPercent = options.warningThresholdPercent ?? 80;

    const cc = options.concurrency ?? {};
    this.effects = new ConcurrencyGuard(cc.maxParallelEffects ?? 8);
    this.runs = new ConcurrencyGuard(cc.maxParallelRuns ?? 4);
    this.sessions = new ConcurrencyGuard(cc.maxParallelSessions ?? 4);

    this.timeouts = new TimeoutCascade();

    // Wire up threshold warnings.
    this._tokenBudget.onThreshold(this._warningThresholdPercent, () => {
      this._fireWarning("tokens");
    });
    this._costBudget.onThreshold(this._warningThresholdPercent, () => {
      this._fireWarning("cost");
    });
  }

  // -- ResourceManager interface --------------------------------------------

  checkBudget(kind: BudgetKind): TokenBudget | CostBudget {
    return this._snapshot(kind);
  }

  consume(kind: BudgetKind, amount: number): void {
    this._trackerFor(kind).consume(amount);
  }

  admit(request: ResourceAdmissionRequest): ResourceAdmissionDecision {
    const tokens = request.tokens ?? 0;
    const cost = request.cost ?? 0;
    if (tokens < 0 || cost < 0) {
      return {
        allowed: false,
        reason: "Resource admission amounts must be non-negative",
        snapshot: this.getSnapshot(),
      };
    }

    const tokenBudget = this._tokenBudget.check();
    if (tokens > tokenBudget.remaining) {
      return {
        allowed: false,
        reason: `tokens budget exceeded: requested ${tokens}, remaining ${tokenBudget.remaining}`,
        snapshot: this.getSnapshot(),
      };
    }

    const costBudget = this._costBudget.check();
    if (cost > costBudget.remaining) {
      return {
        allowed: false,
        reason: `cost budget exceeded: requested ${cost}, remaining ${costBudget.remaining}`,
        snapshot: this.getSnapshot(),
      };
    }

    if (tokens > 0) this._tokenBudget.consume(tokens);
    if (cost > 0) this._costBudget.consume(cost);
    return {
      allowed: true,
      snapshot: this.getSnapshot(),
    };
  }

  release(kind: BudgetKind, amount: number): void {
    this._trackerFor(kind).release(amount);
  }

  getSnapshot(): ResourceSnapshot {
    return {
      tokens: this._snapshot("tokens") as TokenBudget,
      cost: this._snapshot("cost") as CostBudget,
      concurrency: {
        maxParallelEffects: this.effects.active,
        maxParallelRuns: this.runs.active,
        maxParallelSessions: this.sessions.active,
      } satisfies ConcurrencyLimits,
      timestamp: new Date().toISOString(),
    };
  }

  onWarning(callback: ResourceWarningCallback): void {
    this._warningCallbacks.push(callback);
  }

  admitExecutionPolicy(policy: ExecutionPolicy): ResourceAdmission {
    return admitExecutionPolicy(policy);
  }

  // -- Helpers --------------------------------------------------------------

  private _trackerFor(kind: BudgetKind): BudgetTracker {
    return kind === "tokens" ? this._tokenBudget : this._costBudget;
  }

  private _snapshot(kind: BudgetKind): TokenBudget | CostBudget {
    const tracker = this._trackerFor(kind);
    if (kind === "tokens") {
      const snap: TokenBudget = {
        limit: tracker.limit,
        used: tracker.used,
        remaining: tracker.remaining,
        warningThreshold: this._warningThresholdPercent / 100,
      };
      return snap;
    }
    const snap: CostBudget = {
      limit: tracker.limit,
      used: tracker.used,
      remaining: tracker.remaining,
      currency: this._costCurrency,
    };
    return snap;
  }

  private _fireWarning(kind: BudgetKind): void {
    const budget = this._snapshot(kind);
    const warning = {
      kind,
      budget,
      timestamp: new Date().toISOString(),
    };
    for (const cb of this._warningCallbacks) {
      try {
        cb(warning);
      } catch {
        // Swallow subscriber errors to avoid breaking the manager.
      }
    }
  }
}

/**
 * Resources module — budget, concurrency, and timeout management.
 */

// Types (interfaces)
export type {
  TokenBudget,
  CostBudget,
  ConcurrencyLimits,
  TimeoutConfig,
  ResourceSnapshot,
  BudgetKind,
  ResourceWarning,
  ResourceWarningCallback,
  ResourceAdmissionRequest,
  ResourceAdmissionDecision,
  ResourceManager,
} from "./types";

// Budget tracking
export { BudgetTracker, BudgetExceededError } from "./budget-tracker";
export type { BudgetCheck } from "./budget-tracker";

// Concurrency
export { ConcurrencyGuard, ConcurrencyLimitError } from "./concurrency-guard";

// Timeout cascade
export { TimeoutCascade } from "./timeout-cascade";
export type { TimeoutHandle } from "./timeout-cascade";

// Unified manager
export { ResourceManagerImpl } from "./manager";
export type { ResourceManagerOptions } from "./manager";

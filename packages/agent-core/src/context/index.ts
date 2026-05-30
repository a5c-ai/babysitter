export type {
  CompactionStrategyKind,
  PriorityCompactionStrategy,
  SlidingCompactionStrategy,
  SummaryCompactionStrategy,
  CompactionStrategy,
  ContextEntry,
  TokenEstimatorContext,
  ContextManagerConfig,
  ContextManager,
} from "./types";

export {
  ContextManagerImpl,
  type ContextManagerImplOptions,
} from "./manager";

export { estimateTokens, estimateEntryTokens } from "./token-estimator";

export {
  applyPriorityCompaction,
  applySlidingCompaction,
  applySummaryCompaction,
  type PriorityCompactionResult,
  type SlidingCompactionResult,
  type SummaryCompactionResult,
  type SummarizeFn,
} from "./strategies";

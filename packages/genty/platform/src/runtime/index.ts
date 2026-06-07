/**
 * Runtime barrel re-exports.
 *
 * Value exports come from the SDK (they are runtime functions);
 * type exports are sourced from the local types module so that
 * consumers throughout the platform import from a single location.
 */

// ── Value exports from SDK (run-lifecycle, effect-orchestration) ─────────
export {
  createRun,
  orchestrateIteration,
  commitEffectResult,
  commitEffectCancellation,
  createReplayEngine,
  createProcessContext,
  withProcessContext,
  getActiveProcessContext,
  requireProcessContext,
  STATE_CACHE_SCHEMA_VERSION,
  createStateCacheSnapshot,
  journalHeadsEqual,
  normalizeJournalHead,
  normalizeSnapshot,
  readStateCache,
  rebuildStateCache,
  writeStateCache,
  hashInvocationKey,
  EffectRequestedError,
  EffectPendingError,
  EffectCancelledError,
  ParallelPendingError,
  RunFailedError,
  replaySchemaVersion,
} from "@a5c-ai/babysitter-sdk";

// ── Type exports from local types (centralised) ─────────────────────────
export type {
  OrchestrateOptions,
  IterationResult,
  EffectAction,
  CommitEffectResultOptions,
  CommitEffectResultArtifacts,
  ProcessContext,
  DefinedTask,
  CreateRunOptions,
  CreateRunResult,
  ReplayEngine,
  CreateReplayEngineOptions,
  StateCacheSnapshot,
  StateCacheJournalHead,
  DerivedEffectSummary,
} from "../types";

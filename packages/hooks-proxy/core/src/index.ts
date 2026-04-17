// Types
export type { CanonicalPhase, LifecycleScope, PhaseMapping, SupportLevel } from './types/lifecycle';
export type { UnifiedHookEvent, UnifiedExecutionContext } from './types/event';
export type { UnifiedHookResult } from './types/result';
export type { AdapterCapabilities } from './types/adapter';
export type { HookPlanEntry, HandlerRef } from './types/plan';
export type { SessionState, ContextFragment } from './types/session';

// Normalizer
export {
  normalizeEvent,
  resolvePhaseMapping,
  splitEnv,
  resolveHookPlan,
  sortHandlers,
  runHandler,
  runPlan,
  HandlerError,
  HandlerTimeoutError,
  HandlerLoadError,
  NormalizationError,
} from './normalizer';
export type { NormalizeOptions, PlanResolverOptions, ErrorPolicy, RunPlanOptions } from './normalizer';

// Session store
export {
  SESSION_SCHEMA_VERSION,
  getSessionDir,
  loadSession,
  saveSession,
  deleteSession,
  updateSession,
  addContextFragment,
  acquireLock,
  releaseLock,
  getDefaultSessionDir,
  getSessionFilePath,
} from './session-store';

// Merge engine
export {
  mergeResults,
  MergeConflictError,
  type MergeOptions,
  type MergedExecutionResult,
  type DecisionVerb,
  type MergeDiagnostics,
  type MergeConflict,
  type DegradedField,
  createDiagnostics,
  recordConflict,
  recordDegradedField,
} from './merge-engine';

// Propagation
export {
  materializeExecContext,
  generateTempEnvFile,
  adaptOutput,
  propagateEnv,
} from './propagation';
export type {
  MaterializeOptions,
  ExecMaterialization,
  AdaptOutputOptions,
  AdaptedOutput,
  PropagationBackend,
  PropagationOptions,
  SessionStore,
} from './propagation';

// API
export {
  createAdapter,
  registerHandler,
  runNormalized,
} from './api';
export type { AdapterImpl, RegisteredAdapter } from './api';

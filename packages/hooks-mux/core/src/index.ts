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
  evaluateWhen,
  getNestedValue,
  runHandler,
  runPlan,
  HandlerError,
  HandlerTimeoutError,
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
  SESSION_PID_MARKER_ENV_VAR,
  isSessionPidMarkerEnabled,
  findHarnessAncestorPid,
  writeSessionMarker,
  readSessionMarker,
  cleanupSessionMarker,
  getSessionMarkerPath,
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
  buildExportEnvFileLines,
  materializeExecContext,
  generateTempEnvFile,
  escapeShellValue,
  getTrackedTempFiles,
  cleanupTempFiles,
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

// Diagnostics
export {
  DiagnosticLogger,
  createDiagnosticLogger,
  TraceWriter,
  createTraceWriter,
  generateTraceId,
  buildTraceRecord,
} from './diagnostics';
export type {
  DiagnosticEntry,
  DiagnosticLoggerOptions,
  MergeDecisionSummary,
  SessionIdQuality,
  TraceWriterOptions,
  TraceRecord,
  TraceHandlerRecord,
} from './diagnostics';

// API
export {
  createAdapter,
  registerHandler,
  runNormalized,
} from './api';
export type { AdapterImpl, RegisteredAdapter } from './api';

// Discovery
export { detectHarness } from './discovery';
export type { DetectedHarness } from './discovery';

// Programmatic engine
export {
  createHooksEngine,
} from './programmatic';
export type {
  PortableHookHandler,
  ProgrammaticEngineConfig,
  RegisteredHandler,
  EngineResult,
  ProcessEventInput,
  HooksEngine,
  HookMiddleware,
} from './programmatic';

// SDK interface
export {
  parseHookResult,
  parseHookEvent,
  validateHookResult,
  validateHookEvent,
  HookEventBuilder,
  HookResultBuilder,
  readExecutionContext,
  isInHooksProxyContext,
  serializeEvent,
  serializeResult,
  HookOutputParseError,
} from './sdk-interface';
export type { ExecutionContextFromEnv } from './sdk-interface';

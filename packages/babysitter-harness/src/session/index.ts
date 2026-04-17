/**
 * Session state management module.
 * Provides utilities for managing babysitter orchestration session state.
 */

// Types
export type {
  SessionState,
  SessionFile,
  SessionContext,
  SessionDecision,
  SessionRunSummary,
  SessionContextSnapshot,
  SessionHistory,
  SessionInitOptions,
  SessionAssociateOptions,
  SessionResumeOptions,
  SessionStateOptions,
  SessionUpdateOptions,
  SessionInitResult,
  SessionAssociateResult,
  SessionResumeResult,
  SessionStateResult,
  SessionUpdateResult,
} from './types';

export { SessionError, SessionErrorCode } from './types';

// Parsing utilities
export {
  DEFAULT_SESSION_STATE,
  parseYamlFrontmatter,
  parseSessionState,
  readSessionFile,
  sessionFileExists,
  validateSessionState,
  getSessionFilePath,
} from './parse';

// Writing utilities
export {
  serializeSessionState,
  createSessionFileContent,
  writeSessionFile,
  updateSessionState,
  deleteSessionFile,
  getCurrentTimestamp,
  isoToEpochSeconds,
  updateIterationTimes,
  isIterationTooFast,
  addRunToSession,
  getSessionRuns,
} from './write';

// Context persistence (GAP-SESSION-001)
export {
  getSessionContextPath,
  getSessionContext,
  updateSessionContext,
} from './context';

// Discovery (autodiscovery from markers + env)
export {
  HARNESS_ENV_VARS,
  resolveAmbientSessionId,
} from './discovery';

// History persistence (GAP-SESSION-002)
export {
  getSessionHistoryPath,
  addDecision,
  addRunSummary,
  saveContextSnapshot,
  getSessionHistory,
} from './history';

// Persistent state (GAP-STATE-003)
export type {
  SessionFinding,
  SessionFileModification,
  SessionBreakpointPattern,
  SessionPersistentState,
} from './persistence';
export {
  SESSION_PERSISTENT_SCHEMA_VERSION,
  getSessionPersistentStatePath,
  getSessionPersistentState,
  addFinding,
  setPreference,
  recordFileModification,
  recordBreakpointInteraction,
  buildResumeContext,
} from './persistence';

// Continuity state (GAP-PERF-008)
export type {
  ContinuityPhase,
  ContinuityDecision,
  ContinuityWorkingContext,
  ContinuityState,
} from './continuityState';
export {
  CONTINUITY_STATE_SCHEMA_VERSION,
  getContinuityStatePath,
  getContinuityState,
  setCurrentPhase,
  upsertDecision,
  updateWorkingContext,
  buildContinuityResumePrompt,
} from './continuityState';

// Long-term memory extraction (GAP-STATE-001)
export type {
  MemoryCategory,
  MemoryConfidence,
  MemoryEntry,
  LongTermMemoryStore,
  MemoryExtractionInput,
} from './memoryExtraction';
export {
  LONG_TERM_MEMORY_SCHEMA_VERSION,
  extractMemoriesFromSession,
  readLongTermMemory,
  persistMemories,
  queryMemories,
  pruneMemories,
} from './memoryExtraction';

// Cost tracking (GAP-SESSION-004)
export type {
  SessionBudget,
  SessionCostState,
  SessionBudgetAlert,
  BudgetCheckResult,
  RunCostUpdate,
} from './cost';
export {
  getSessionCostPath,
  getSessionCost,
  updateSessionCost,
  setSessionBudget,
  checkBudget,
  markThresholdsTriggered,
} from './cost';

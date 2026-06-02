/**
 * Re-export shim — canonical implementation lives in @a5c-ai/tula-runtime.
 * Internal agent-platform consumers continue to import via relative paths
 * through this barrel file.
 */
export {
  // Types
  type SessionState,
  type SessionFile,
  type SessionContext,
  type SessionDecision,
  type SessionRunSummary,
  type SessionContextSnapshot,
  type SessionHistory,
  type SessionInitOptions,
  type SessionAssociateOptions,
  type SessionResumeOptions,
  type SessionStateOptions,
  type SessionUpdateOptions,
  type SessionInitResult,
  type SessionAssociateResult,
  type SessionResumeResult,
  type SessionStateResult,
  type SessionUpdateResult,
  SessionError,
  SessionErrorCode,

  // Parsing utilities
  DEFAULT_SESSION_STATE,
  parseYamlFrontmatter,
  parseSessionState,
  readSessionFile,
  sessionFileExists,
  validateSessionState,
  getSessionFilePath,

  // Writing utilities
  serializeSessionState,
  createSessionFileContent,
  writeSessionFile,
  updateSessionState,
  getCurrentTimestamp,
  isoToEpochSeconds,
  updateIterationTimes,
  addRunToSession,
  getSessionRuns,

  // Context persistence (GAP-SESSION-001)
  getSessionContextPath,
  getSessionContext,
  updateSessionContext,

  // Discovery (autodiscovery from markers + env)
  HARNESS_ENV_VARS,
  resolveAmbientSessionId,

  // History persistence (GAP-SESSION-002)
  getSessionHistoryPath,
  addDecision,
  addRunSummary,
  saveContextSnapshot,
  getSessionHistory,

  // Persistent state (GAP-STATE-003)
  type SessionFinding,
  type SessionFileModification,
  type SessionBreakpointPattern,
  type SessionPersistentState,
  SESSION_PERSISTENT_SCHEMA_VERSION,
  getSessionPersistentStatePath,
  getSessionPersistentState,
  addFinding,
  setPreference,
  recordFileModification,
  recordBreakpointInteraction,
  buildResumeContext,

  // Continuity state (GAP-PERF-008)
  type ContinuityPhase,
  type ContinuityDecision,
  type ContinuityWorkingContext,
  type ContinuityState,
  CONTINUITY_STATE_SCHEMA_VERSION,
  getContinuityStatePath,
  getContinuityState,
  setCurrentPhase,
  upsertDecision,
  updateWorkingContext,
  buildContinuityResumePrompt,

  // Long-term memory extraction (GAP-STATE-001)
  type MemoryCategory,
  type MemoryConfidence,
  type MemoryEntry,
  type LongTermMemoryStore,
  type MemoryExtractionInput,
  LONG_TERM_MEMORY_SCHEMA_VERSION,
  extractMemoriesFromSession,
  readLongTermMemory,
  persistMemories,
  queryMemories,
  pruneMemories,

  // Cost tracking (GAP-SESSION-004)
  type SessionBudget,
  type SessionCostState,
  type SessionBudgetAlert,
  type BudgetCheckResult,
  type RunCostUpdate,
  getSessionCostPath,
  getSessionCost,
  updateSessionCost,
  setSessionBudget,
  checkBudget,
  markThresholdsTriggered,
} from "@a5c-ai/tula-runtime/session";

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

// History persistence (GAP-SESSION-002)
export {
  getSessionHistoryPath,
  addDecision,
  addRunSummary,
  saveContextSnapshot,
  getSessionHistory,
} from './history';

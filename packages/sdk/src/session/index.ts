/**
 * Session state management module.
 * Provides utilities for managing babysitter orchestration session state.
 */

// Types
export type {
  SessionState,
  SessionFile,
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
} from './write';

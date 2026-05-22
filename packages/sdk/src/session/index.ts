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
  getCurrentTimestamp,
  isoToEpochSeconds,
  updateIterationTimes,
  addRunToSession,
  getSessionRuns,
} from './write';

// Discovery (autodiscovery from markers + env)
export {
  HARNESS_ENV_VARS,
  resolveAmbientSessionId,
} from './discovery';

export {
  extractPromiseTag,
  parseTranscriptLastAssistantMessage,
} from './transcript';
export type {
  SessionWhoamiArgs,
  SessionWhoamiResult,
} from './whoami';
export {
  runSessionWhoami,
} from './whoami';

export type {
  SessionCleanupArgs,
  SessionCleanupResult,
} from './cleanup';
export {
  parseMarkerFilename,
  runSessionCleanup,
} from './cleanup';



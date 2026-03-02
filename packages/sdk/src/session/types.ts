/**
 * Session state management types for babysitter orchestration.
 * These types represent the state stored in markdown files with YAML frontmatter.
 */

/**
 * Session state stored in the state file's YAML frontmatter.
 */
export interface SessionState {
  /** Whether the session is currently active */
  active: boolean;
  /** Current iteration number (1-based) */
  iteration: number;
  /** Maximum allowed iterations (0 = unlimited) */
  maxIterations: number;
  /** Associated run ID (empty string if not yet associated) */
  runId: string;
  /** ISO timestamp when session started */
  startedAt: string;
  /** ISO timestamp of last iteration */
  lastIterationAt: string;
  /** Array of recent iteration durations in seconds (last 3) */
  iterationTimes: number[];
}

/**
 * Complete session file content including state and prompt.
 */
export interface SessionFile {
  /** Parsed YAML frontmatter state */
  state: SessionState;
  /** Prompt content (everything after the YAML frontmatter) */
  prompt: string;
  /** Path to the state file */
  filePath: string;
}

/**
 * Options for initializing a new session.
 */
export interface SessionInitOptions {
  /** Claude session ID */
  sessionId: string;
  /** Maximum iterations (default: 256) */
  maxIterations?: number;
  /** Optional run ID if already known */
  runId?: string;
  /** Directory to store state files */
  stateDir: string;
  /** Initial prompt text */
  prompt: string;
}

/**
 * Options for associating a session with a run.
 */
export interface SessionAssociateOptions {
  /** Claude session ID */
  sessionId: string;
  /** Run ID to associate */
  runId: string;
  /** Directory containing state files */
  stateDir: string;
}

/**
 * Options for resuming an existing session.
 */
export interface SessionResumeOptions {
  /** Claude session ID */
  sessionId: string;
  /** Run ID to resume */
  runId: string;
  /** Maximum iterations (default: 256) */
  maxIterations?: number;
  /** Directory to store state files */
  stateDir: string;
  /** Runs directory (default: .a5c/runs) */
  runsDir?: string;
}

/**
 * Options for reading session state.
 */
export interface SessionStateOptions {
  /** Claude session ID */
  sessionId: string;
  /** Directory containing state files */
  stateDir: string;
}

/**
 * Options for updating session state.
 */
export interface SessionUpdateOptions {
  /** Claude session ID */
  sessionId: string;
  /** Directory containing state files */
  stateDir: string;
  /** New iteration number */
  iteration?: number;
  /** New last iteration timestamp */
  lastIterationAt?: string;
  /** New iteration times array */
  iterationTimes?: number[];
  /** Delete the state file */
  delete?: boolean;
}

/**
 * Result of session:init command.
 */
export interface SessionInitResult {
  /** Path to created state file */
  stateFile: string;
  /** Initial iteration number */
  iteration: number;
  /** Maximum iterations */
  maxIterations: number;
  /** Run ID (may be empty) */
  runId: string;
}

/**
 * Result of session:associate command.
 */
export interface SessionAssociateResult {
  /** Path to updated state file */
  stateFile: string;
  /** Associated run ID */
  runId: string;
}

/**
 * Result of session:resume command.
 */
export interface SessionResumeResult {
  /** Path to created state file */
  stateFile: string;
  /** Run ID being resumed */
  runId: string;
  /** Current run state */
  runState: string;
  /** Process ID from run metadata */
  processId: string;
}

/**
 * Result of session:state command.
 */
export interface SessionStateResult {
  /** Whether state file exists */
  found: boolean;
  /** Session state (if found) */
  state?: SessionState;
  /** Prompt content (if found) */
  prompt?: string;
  /** Path to state file */
  stateFile: string;
}

/**
 * Result of session:update command.
 */
export interface SessionUpdateResult {
  /** Whether update was successful */
  success: boolean;
  /** Updated state (if not deleted) */
  state?: SessionState;
  /** Whether file was deleted */
  deleted?: boolean;
  /** Path to state file */
  stateFile: string;
}

/**
 * Error thrown when session operations fail.
 */
export class SessionError extends Error {
  constructor(
    message: string,
    public readonly code: SessionErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

/**
 * Session error codes.
 */
export enum SessionErrorCode {
  /** Session ID not provided */
  MISSING_SESSION_ID = 'MISSING_SESSION_ID',
  /** State file already exists */
  SESSION_EXISTS = 'SESSION_EXISTS',
  /** State file not found */
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  /** Run already associated */
  RUN_ALREADY_ASSOCIATED = 'RUN_ALREADY_ASSOCIATED',
  /** Run not found */
  RUN_NOT_FOUND = 'RUN_NOT_FOUND',
  /** Run already completed */
  RUN_COMPLETED = 'RUN_COMPLETED',
  /** State file corrupted */
  CORRUPTED_STATE = 'CORRUPTED_STATE',
  /** Invalid state value */
  INVALID_STATE_VALUE = 'INVALID_STATE_VALUE',
  /** File system error */
  FS_ERROR = 'FS_ERROR',
}

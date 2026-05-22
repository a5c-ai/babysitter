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
  /** The single currently-active run bound to this session (empty string if unbound) */
  runId: string;
  /** Historical audit trail of all run IDs ever bound to this session, chronological (GAP-SESSION-001) */
  runIds: string[];
  /** ISO timestamp when session started */
  startedAt: string;
  /** ISO timestamp of last iteration */
  lastIterationAt: string;
  /** Array of recent iteration durations in seconds (last 3) */
  iterationTimes: number[];
  /** Optional key-value metadata (e.g. external correlation IDs) */
  metadata?: Record<string, string>;
}

/**
 * Accumulated context shared across runs within a session (GAP-SESSION-001).
 * Persisted as a JSON file alongside the session state file.
 */
export interface SessionWorktreeContext {
  /** Workspace or worktree path bound to the session. */
  workspacePath: string;
  /** More specific current path within the workspace, when known. */
  currentPath?: string;
  /** Materialization mode when the binding is known. */
  mode?: "worktree" | "symlink";
  /** Repo alias within a multi-repo workspace, when known. */
  repoAlias?: string;
  /** Branch bound to the worktree, when known. */
  branch?: string | null;
}

export interface SessionContext {
  /** Accumulated notes from across runs */
  notes: string[];
  /** Shared knowledge key-value pairs accumulated across runs */
  sharedKnowledge: Record<string, string>;
  /** Bound workspace/worktree metadata carried across runs when available. */
  worktree?: SessionWorktreeContext;
}

// ---------------------------------------------------------------------------
// GAP-SESSION-002: Session History types
// ---------------------------------------------------------------------------

/** A recorded decision made during a session. */
export interface SessionDecision {
  /** ISO timestamp when the decision was recorded */
  timestamp: string;
  /** What was decided */
  description: string;
  /** Why it was decided */
  rationale?: string;
  /** Run in which this decision was made */
  runId?: string;
}

/** Summary of a completed run within a session. */
export interface SessionRunSummary {
  /** Run identifier */
  runId: string;
  /** Process that was executed */
  processId: string;
  /** Terminal status */
  status: string;
  /** ISO timestamp when the run started */
  startedAt: string;
  /** ISO timestamp when the run finished */
  completedAt?: string;
  /** Human-readable outcome */
  outcome?: string;
  /** Quality score (0-100) if available */
  score?: number;
}

/** Point-in-time snapshot of session context. */
export interface SessionContextSnapshot {
  /** ISO timestamp when the snapshot was taken */
  timestamp: string;
  /** Run during which this snapshot was taken */
  runId?: string;
  /** Arbitrary context data */
  snapshot: Record<string, unknown>;
}

/**
 * Rich session history: extends SessionContext with accumulated
 * decisions, run summaries, and context snapshots (GAP-SESSION-002).
 */
export interface SessionHistory extends SessionContext {
  /** Accumulated decisions made during this session */
  decisions: SessionDecision[];
  /** Summaries of all runs that have executed in this session */
  runSummaries: SessionRunSummary[];
  /** Point-in-time context snapshots */
  contextSnapshots: SessionContextSnapshot[];
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
  /** Maximum iterations (default: 65000) */
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
  /** Maximum iterations (default: 65000) */
  maxIterations?: number;
  /** Directory to store state files */
  stateDir: string;
  /** Runs directory (default: ~/.a5c/runs, or <repo>/.a5c/runs when BABYSITTER_RUNS_SCOPE=repo) */
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
  /** Updated state */
  state?: SessionState;
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




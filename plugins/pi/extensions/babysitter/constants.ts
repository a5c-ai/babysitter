/**
 * Configuration constants for the babysitter oh-my-pi extension.
 *
 * Centralises magic strings, default timeouts, environment variable names,
 * and widget keys so the rest of the extension can remain blissfully ignorant
 * of where these values come from.
 *
 * @module constants
 */

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Path (or bare command name) used to invoke the babysitter CLI. */
export const CLI_COMMAND = process.env['BABYSITTER_CLI_PATH'] ?? 'babysitter';

/** Default timeout (ms) applied to every CLI invocation. */
export const CLI_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Orchestration limits (mirrors BABYSITTER_MAX_ITERATIONS etc.)
// ---------------------------------------------------------------------------

/** Default maximum orchestration iterations per run. */
export const DEFAULT_MAX_ITERATIONS = 256;

/** Default maximum wall-clock time (ms) for a single run. */
export const DEFAULT_MAX_DURATION_MS = 30 * 60 * 1_000; // 30 minutes

/** Consecutive errors before the guard trips. */
export const DEFAULT_ERROR_THRESHOLD = 5;

/** Number of identical iteration digests that signal a doom loop. */
export const DEFAULT_DOOM_LOOP_WINDOW = 4;

// ---------------------------------------------------------------------------
// Timeouts
// ---------------------------------------------------------------------------

/** Timeout (ms) for a single effect execution. */
export const EFFECT_TIMEOUT_MS = 900_000; // 15 minutes, matches NODE_TASK_TIMEOUT

/** Timeout (ms) for posting a task result back. */
export const POST_RESULT_TIMEOUT_MS = 30_000;

/** Delay (ms) for a sleep effect (placeholder; real value comes from the effect). */
export const DEFAULT_SLEEP_MS = 5_000;

// ---------------------------------------------------------------------------
// Environment variable names
// ---------------------------------------------------------------------------

export const ENV_RUNS_DIR = 'BABYSITTER_RUNS_DIR';
export const ENV_MAX_ITERATIONS = 'BABYSITTER_MAX_ITERATIONS';
export const ENV_QUALITY_THRESHOLD = 'BABYSITTER_QUALITY_THRESHOLD';
export const ENV_TIMEOUT = 'BABYSITTER_TIMEOUT';
export const ENV_LOG_LEVEL = 'BABYSITTER_LOG_LEVEL';
export const ENV_HOOK_TIMEOUT = 'BABYSITTER_HOOK_TIMEOUT';
export const ENV_NODE_TASK_TIMEOUT = 'BABYSITTER_NODE_TASK_TIMEOUT';
export const ENV_CLI_PATH = 'BABYSITTER_CLI_PATH';

// ---------------------------------------------------------------------------
// Widget keys (for registerMessageRenderer / TUI identification)
// ---------------------------------------------------------------------------

export const WIDGET_RUN_PROGRESS = 'babysitter:run-progress';
export const WIDGET_TASK_STATUS = 'babysitter:task-status';
export const WIDGET_QUALITY_SCORE = 'babysitter:quality-score';
export const WIDGET_PHASE_INDICATOR = 'babysitter:phase-indicator';

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

export const EXTENSION_NAME = 'babysitter';
export const EXTENSION_VERSION = '0.1.0';

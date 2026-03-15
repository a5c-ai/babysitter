'use strict';

const path = require('path');
const { readSessionContext } = require('./hooks/utils');
const { runJson, supports } = require('./sdk-cli');
const { findSession } = require('./state-index');

function unsupported(command) {
  return {
    ok: false,
    unsupported: true,
    command,
    message: `SDK command "${command}" is not available in this babysitter CLI build.`,
  };
}

function resolveSessionContext(options = {}) {
  const persisted = readSessionContext(options.repoRoot);
  const sessionId =
    options.sessionId ||
    process.env.BABYSITTER_SESSION_ID ||
    process.env.CODEX_THREAD_ID ||
    process.env.CODEX_SESSION_ID ||
    (persisted && (persisted.sessionId || persisted.id || persisted.session_id)) ||
    null;
  const stateDir =
    options.stateDir ||
    process.env.BABYSITTER_STATE_DIR ||
    (persisted && persisted.stateDir) ||
    path.join(options.repoRoot || process.cwd(), '.a5c');

  return { sessionId, stateDir };
}

function sessionArgs(command, options = {}) {
  const ctx = resolveSessionContext(options);
  if (!ctx.sessionId) {
    throw new Error(`${command}: sessionId is required (provide options.sessionId or initialize .a5c/session.json)`);
  }
  if (!ctx.stateDir) {
    throw new Error(`${command}: stateDir is required`);
  }
  return ['--session-id', ctx.sessionId, '--state-dir', ctx.stateDir];
}

function runSessionCommand(command, args) {
  if (!supports(command)) return unsupported(command);
  const res = runJson([command, ...args, '--json']);
  if (!res.ok) {
    return {
      ok: false,
      command,
      message: res.stderr || res.stdout || `Failed to run ${command}`,
      exitCode: res.exitCode,
    };
  }
  return res.parsed || { ok: true };
}

/**
 * 1. initSession(options)
 *
 * Initializes a new babysitter session.
 *
 * CLI: babysitter session:init --session-id <id> --state-dir <dir> --json
 *
 * @param {object} options
 * @param {string} options.sessionId - The session identifier.
 * @param {string} options.stateDir  - Directory where session state is stored.
 * @returns {object} Parsed JSON response.
 */
function initSession(options) {
  if (!options || !options.sessionId) {
    throw new Error('initSession: options.sessionId is required');
  }
  if (!options.stateDir) {
    throw new Error('initSession: options.stateDir is required');
  }

  return runSessionCommand('session:init', [
    '--session-id', options.sessionId,
    '--state-dir', options.stateDir,
  ]);
}

/**
 * 2. associateSession(runId)
 *
 * Associates the current session with a run ID.
 *
 * CLI: babysitter session:associate --run-id <runId> --json
 *
 * @param {string} runId - The run identifier to associate.
 * @param {object} [options]
 * @param {string} [options.sessionId]
 * @param {string} [options.stateDir]
 * @returns {object} Parsed JSON response.
 */
function associateSession(runId, options = {}) {
  if (!runId) {
    throw new Error('associateSession: runId is required');
  }

  return runSessionCommand('session:associate', [...sessionArgs('associateSession', options), '--run-id', runId]);
}

/**
 * 3. resumeSession(sessionId, runId, options)
 *
 * Resumes an existing session.
 *
 * CLI: babysitter session:resume --session-id <id> --run-id <runId> --runs-dir <dir> --json
 *
 * @param {string} sessionId - The session identifier to resume.
 * @param {string} runId     - The run identifier.
 * @param {object} options
 * @param {string} options.runsDir - Directory containing run data.
 * @returns {object} Parsed JSON response.
 */
function resumeSession(sessionId, runId, options = {}) {
  if (!sessionId) {
    throw new Error('resumeSession: sessionId is required');
  }
  if (!runId) {
    throw new Error('resumeSession: runId is required');
  }
  const ctx = resolveSessionContext({ ...options, sessionId });
  if (!ctx.stateDir) {
    throw new Error('resumeSession: stateDir is required');
  }

  const args = ['--session-id', sessionId, '--run-id', runId, '--state-dir', ctx.stateDir];
  if (options.maxIterations !== undefined) args.push('--max-iterations', String(options.maxIterations));
  if (options.runsDir) args.push('--runs-dir', options.runsDir);
  return runSessionCommand('session:resume', args);
}

/**
 * 4. getSessionState()
 *
 * Retrieves the current session state.
 *
 * CLI: babysitter session:state --json
 *
 * @returns {object} Parsed JSON response representing current session state.
 */
function getSessionState(options = {}) {
  return runSessionCommand('session:state', sessionArgs('getSessionState', options));
}

/**
 * 5. updateSession(fields)
 *
 * Updates session fields such as iteration counter and last-iteration timestamp.
 *
 * CLI: babysitter session:update --iteration <n> --last-iteration-at <iso> --json
 *
 * @param {object} fields
 * @param {number} [fields.iteration]       - The current iteration number.
 * @param {string} [fields.lastIterationAt] - ISO 8601 timestamp of the last iteration.
 * @returns {object} Parsed JSON response.
 */
function updateSession(fields, options = {}) {
  if (!fields || (fields.iteration === undefined && !fields.lastIterationAt)) {
    throw new Error(
      'updateSession: at least one of fields.iteration or fields.lastIterationAt is required'
    );
  }

  const args = sessionArgs('updateSession', options);

  if (fields.iteration !== undefined) {
    args.push('--iteration', String(fields.iteration));
  }
  if (fields.lastIterationAt) {
    args.push('--last-iteration-at', fields.lastIterationAt);
  }

  return runSessionCommand('session:update', args);
}

/**
 * 6. checkIteration()
 *
 * Checks the current iteration status.
 *
 * CLI: babysitter session:check-iteration --json
 *
 * @returns {object} Parsed JSON response with iteration check result.
 */
function checkIteration(options = {}) {
  return runSessionCommand('session:check-iteration', sessionArgs('checkIteration', options));
}

/**
 * 7. getIterationMessage(iteration, runId, options)
 *
 * Retrieves the message for a specific iteration.
 *
 * CLI: babysitter session:iteration-message --iteration <n> --run-id <runId>
 *       --runs-dir <dir> --plugin-root <root> --json
 *
 * @param {number} iteration  - The iteration number.
 * @param {string} runId      - The run identifier.
 * @param {object} options
 * @param {string} options.runsDir    - Directory containing run data.
 * @param {string} options.pluginRoot - Root directory of the plugin.
 * @returns {object} Parsed JSON response containing the iteration message.
 */
function getIterationMessage(iteration, runId, options) {
  if (iteration === undefined || iteration === null) {
    throw new Error('getIterationMessage: iteration is required');
  }
  if (!runId) {
    throw new Error('getIterationMessage: runId is required');
  }
  if (!options || !options.runsDir) {
    throw new Error('getIterationMessage: options.runsDir is required');
  }
  if (!options.pluginRoot) {
    throw new Error('getIterationMessage: options.pluginRoot is required');
  }

  return runSessionCommand('session:iteration-message', [
    '--iteration', String(iteration),
    '--run-id', runId,
    '--runs-dir', options.runsDir,
    '--plugin-root', options.pluginRoot,
  ]);
}

/**
 * 8. getLastMessage(transcriptPath)
 *
 * Retrieves the last message from a transcript file.
 *
 * CLI: babysitter session:last-message --transcript-path <path> --json
 *
 * @param {string} transcriptPath - Absolute path to the transcript file.
 * @returns {object} Parsed JSON response containing the last message.
 */
function getLastMessage(transcriptPath) {
  if (!transcriptPath) {
    throw new Error('getLastMessage: transcriptPath is required');
  }

  return runSessionCommand('session:last-message', [
    '--transcript-path', transcriptPath,
  ]);
}

/**
 * 9. resolveResumeSelector(selector, options)
 *
 * Resolves a resume selector in the form:
 * - recent
 * - tag:<name>
 * - <alias>
 * - <sessionId>
 *
 * Returns the selected session metadata (or null).
 */
function resolveResumeSelector(selector, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  return findSession(repoRoot, selector || 'recent');
}

module.exports = {
  initSession,
  associateSession,
  resumeSession,
  getSessionState,
  updateSession,
  checkIteration,
  getIterationMessage,
  getLastMessage,
  resolveResumeSelector,
};

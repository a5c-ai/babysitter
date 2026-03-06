/**
 * result-poster.js
 *
 * Posts task results and errors back to the babysitter SDK.
 * Handles large result files, retry logic, and schema validation.
 */

'use strict';

const { execFileSync } = require('child_process');
const { mkdirSync, writeFileSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');
const crypto = require('crypto');

const { readSessionContext } = require('./hooks/utils.js');
const { runRaw, runJson, supports, parseJsonish } = require('./sdk-cli');

const LARGE_RESULT_THRESHOLD = 1 * 1024 * 1024; // 1 MiB
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compute a content-addressed SHA-256 hash (first 16 hex chars) of a string.
 * @param {string|Buffer} data
 * @returns {string}
 */
function contentHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

/**
 * Execute a CLI command with retry logic and exponential backoff.
 * @param {string[]} args - Arguments to pass to npx
 * @param {number} retries - Number of retries remaining
 * @returns {{ stdout: string, success: boolean }}
 */
async function execWithRetry(args, retries) {
  if (retries === undefined) retries = MAX_RETRIES;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      await sleep(backoffMs);
    }
    try {
      const run = runRaw(args, { timeout: 30000 });
      if (!run.ok) {
        throw new Error(run.stderr || run.stdout || `command failed: ${args.join(' ')}`);
      }
      return { stdout: run.stdout, success: true };
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        // Will retry
        continue;
      }
    }
  }
  throw lastError;
}

/**
 * Check if a result is large (>1 MiB) and handle accordingly.
 * Returns the relative path to use for the value flag.
 * Large results are stored content-addressed under blobs/<hash>.json.
 * Normal results are stored at tasks/<effectId>/output.json.
 * @param {string} runDir
 * @param {string} effectId
 * @param {string} serialized - JSON string of the result
 * @returns {string} relative path for the value flag
 */
function writeResultData(runDir, effectId, serialized) {
  const byteLength = Buffer.byteLength(serialized, 'utf8');

  if (byteLength > LARGE_RESULT_THRESHOLD) {
    // Write to blobs directory using content-addressed naming
    const hash = contentHash(serialized);
    const blobsDir = join(runDir, 'blobs');
    mkdirSync(blobsDir, { recursive: true });
    const blobPath = join(blobsDir, `${hash}.json`);
    writeFileSync(blobPath, serialized, 'utf8');
    return `blobs/${hash}.json`;
  }

  // Write to tasks/<effectId>/output.json
  const taskDir = join(runDir, 'tasks', effectId);
  mkdirSync(taskDir, { recursive: true });
  const outputPath = join(taskDir, 'output.json');
  writeFileSync(outputPath, serialized, 'utf8');
  return `tasks/${effectId}/output.json`;
}

/**
 * Post a successful task result back to babysitter.
 *
 * @param {string} runDir   - The run directory path (e.g. `.a5c/runs/<runId>`)
 * @param {string} effectId - The effect/task ID
 * @param {*}      result   - The result value to post
 * @param {object} [options={}] - Additional options
 * @param {string} [options.stdoutFile]     - Path to stdout capture file
 * @param {string} [options.stderrFile]     - Path to stderr capture file
 * @param {string} [options.startedAt]      - ISO timestamp when task started
 * @param {string} [options.finishedAt]     - ISO timestamp when task finished
 * @param {object} [options.metadata]       - Arbitrary metadata object
 * @param {string} [options.invocationKey]  - Idempotency / invocation key
 * @param {string} [options.repoRoot]       - Repository root for session context lookup
 * @returns {Promise<object>} Posting confirmation object
 */
async function postTaskResult(runDir, effectId, result, options = {}) {
  if (!supports('task:post')) {
    throw new Error('task:post is not supported by this babysitter CLI build.');
  }
  // Enrich result with session context if available
  const session = readSessionContext(options.repoRoot);
  if (session && session.sessionId) {
    result._sessionId = session.sessionId;
  }

  const serialized = JSON.stringify(result, null, 2);

  // Write result (handles large results automatically, content-addressed for blobs)
  const valuePath = writeResultData(runDir, effectId, serialized);

  // Build babysitter CLI arguments
  // Positional: task:post <runDir> <effectId>
  const args = [
    'task:post',
    runDir,
    effectId,
    '--status', 'ok',
    '--value', valuePath,
    '--json',
  ];

  if (options.stdoutFile)    args.push('--stdout-file',     options.stdoutFile);
  if (options.stderrFile)    args.push('--stderr-file',     options.stderrFile);
  if (options.startedAt)     args.push('--started-at',      options.startedAt);
  if (options.finishedAt)    args.push('--finished-at',     options.finishedAt);
  if (options.invocationKey) args.push('--invocation-key',  options.invocationKey);
  if (options.metadata) {
    args.push('--metadata', JSON.stringify(options.metadata));
  }

  let stdout;
  try {
    ({ stdout } = await execWithRetry(args));
  } catch (err) {
    throw new Error(
      `Failed to post task result for effectId=${effectId} after ${MAX_RETRIES} retries: ${err.message}`
    );
  }

  let parsed;
  parsed = parseJsonish(stdout) || { raw: stdout };

  return {
    success: true,
    effectId,
    status: 'ok',
    valuePath,
    response: parsed,
  };
}

/**
 * Post a task error back to babysitter.
 * @param {string} runDir   - The run directory path (e.g. `.a5c/runs/<runId>`)
 * @param {string} effectId - The effect/task ID
 * @param {Error|object} error - The error to post
 * @param {object} [options={}] - Additional options
 * @param {string} [options.stdoutFile]     - Path to stdout capture file
 * @param {string} [options.stderrFile]     - Path to stderr capture file
 * @param {string} [options.startedAt]      - ISO timestamp when task started
 * @param {string} [options.finishedAt]     - ISO timestamp when task finished
 * @param {object} [options.metadata]       - Arbitrary metadata object
 * @param {string} [options.invocationKey]  - Idempotency / invocation key
 * @param {string} [options.repoRoot]       - Repository root for session context lookup
 * @returns {Promise<object>} Error confirmation object
 */
async function postTaskError(runDir, effectId, error, options = {}) {
  if (!supports('task:post')) {
    throw new Error('task:post is not supported by this babysitter CLI build.');
  }
  const errorPayload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    code: error.code,
    details: error.details,
  };

  // Enrich with session context if available
  const session = readSessionContext(options.repoRoot);
  if (session && session.sessionId) {
    errorPayload._sessionId = session.sessionId;
  }

  const serialized = JSON.stringify(errorPayload, null, 2);

  // Write error to tasks/<effectId>/error.json
  const taskDir = join(runDir, 'tasks', effectId);
  mkdirSync(taskDir, { recursive: true });
  const errorPath = join(taskDir, 'error.json');
  writeFileSync(errorPath, serialized, 'utf8');

  const relativeErrorPath = `tasks/${effectId}/error.json`;

  // Build babysitter CLI arguments
  const args = [
    'task:post',
    runDir,
    effectId,
    '--status', 'error',
    '--error', relativeErrorPath,
    '--json',
  ];

  if (options.stdoutFile)    args.push('--stdout-file',     options.stdoutFile);
  if (options.stderrFile)    args.push('--stderr-file',     options.stderrFile);
  if (options.startedAt)     args.push('--started-at',      options.startedAt);
  if (options.finishedAt)    args.push('--finished-at',     options.finishedAt);
  if (options.invocationKey) args.push('--invocation-key',  options.invocationKey);
  if (options.metadata) {
    args.push('--metadata', JSON.stringify(options.metadata));
  }

  let stdout;
  try {
    ({ stdout } = await execWithRetry(args));
  } catch (err) {
    throw new Error(
      `Failed to post task error for effectId=${effectId} after ${MAX_RETRIES} retries: ${err.message}`
    );
  }

  let parsed;
  parsed = parseJsonish(stdout) || { raw: stdout };

  return {
    success: true,
    effectId,
    status: 'error',
    errorPath: relativeErrorPath,
    response: parsed,
  };
}

/**
 * Show details of a posted task result.
 * Calls: babysitter task:show <runDir> <effectId> --json
 *
 * @param {string} runDir   - The run directory path (e.g. `.a5c/runs/<runId>`)
 * @param {string} effectId - The effect/task ID
 * @returns {Promise<object>} Task details object
 */
async function showTask(runDir, effectId) {
  if (!supports('task:show')) {
    return {
      unsupported: true,
      command: 'task:show',
      runDir,
      effectId,
    };
  }
  const args = [
    'task:show',
    runDir,
    effectId,
    '--json',
  ];

  let stdout;
  try {
    ({ stdout } = await execWithRetry(args));
  } catch (err) {
    throw new Error(
      `Failed to show task effectId=${effectId} after ${MAX_RETRIES} retries: ${err.message}`
    );
  }

  return parseJsonish(stdout) || { raw: stdout };
}

/**
 * Execute all pending node-kind tasks in the given run directory.
 * Calls: babysitter run:execute-tasks <runDir> --kind node --json
 *
 * @param {string} runDir          - The run directory path (e.g. `.a5c/runs/<runId>`)
 * @param {object} [options={}]    - Additional options (reserved for future use)
 * @returns {Promise<object>} Execution summary object
 */
async function executeNodeTasks(runDir, options = {}) {
  if (!supports('run:execute-tasks')) {
    return {
      unsupported: true,
      command: 'run:execute-tasks',
      runDir,
      executed: 0,
    };
  }
  const args = [
    'run:execute-tasks',
    runDir,
    '--kind', 'node',
    '--json',
  ];

  let stdout;
  try {
    ({ stdout } = await execWithRetry(args));
  } catch (err) {
    throw new Error(
      `Failed to execute node tasks for runDir=${runDir} after ${MAX_RETRIES} retries: ${err.message}`
    );
  }

  return parseJsonish(stdout) || { raw: stdout };
}

/**
 * Validate a result against an output schema.
 * @param {*} result - The result to validate
 * @param {object} outputSchema - Schema describing expected fields and types
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateResult(result, outputSchema) {
  const errors = [];

  if (!outputSchema || typeof outputSchema !== 'object') {
    return { valid: true, errors: [] };
  }

  if (result === null || result === undefined || typeof result !== 'object') {
    errors.push(`Result must be an object, got: ${result === null ? 'null' : typeof result}`);
    return { valid: false, errors };
  }

  for (const [field, expectedValue] of Object.entries(outputSchema)) {
    const actualValue = result[field];

    // Check required fields exist
    if (!(field in result)) {
      errors.push(`Missing required field: "${field}"`);
      continue;
    }

    // Check types match (infer expected type from schema value)
    const expectedType = typeof expectedValue;
    const actualType = typeof actualValue;

    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(actualValue)) {
        errors.push(`Field "${field}" expected Array, got ${actualType}`);
      }
    } else if (expectedType !== 'undefined' && actualType !== expectedType) {
      errors.push(
        `Field "${field}" expected type "${expectedType}", got "${actualType}"`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  postTaskResult,
  postTaskError,
  validateResult,
  showTask,
  executeNodeTasks,
  contentHash,
  readSessionContext,
};

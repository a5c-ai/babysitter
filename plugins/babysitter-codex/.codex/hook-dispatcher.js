'use strict';

/**
 * hook-dispatcher.js
 * Main dispatcher for the babysitter-codex harness.
 * Supports all 13 hook types and routes payloads to:
 *   1. babysitter hook:log CLI (structured logging via stdin pipe)
 *   2. Custom handler scripts in .codex/hooks/<hookType>/*.js
 */

const fs = require('fs');
const path = require('path');
const { runRaw, supports } = require('./sdk-cli');

// All 13 supported hook types
const HOOK_TYPES = [
  'on-run-start',
  'on-run-complete',
  'on-run-fail',
  'on-task-start',
  'on-task-complete',
  'on-step-dispatch',
  'on-iteration-start',
  'on-iteration-end',
  'on-breakpoint',
  'pre-commit',
  'pre-branch',
  'post-planning',
  'on-score',
];

// Resolve the hooks base directory relative to this file's location
const HOOKS_BASE_DIR = path.resolve(__dirname, 'hooks');

/**
 * Serialize payload to JSON safely.
 * @param {*} payload
 * @returns {string}
 */
function serializePayload(payload) {
  try {
    return JSON.stringify(payload, null, 2);
  } catch (err) {
    return JSON.stringify({
      _serializationError: err.message,
      _rawType: typeof payload,
    });
  }
}

/**
 * Pipe the serialized payload to the babysitter hook:log CLI.
 * The CLI is expected to accept JSON on stdin and record a structured log entry.
 * Falls back gracefully if the CLI is not available.
 *
 * @param {string} hookType
 * @param {string} serializedPayload
 * @param {object} options
 */
function logToBabysitter(hookType, serializedPayload, options) {
  const logFile =
    options.logFile ||
    process.env.BABYSITTER_HOOK_LOG_FILE ||
    path.join(process.cwd(), '.a5c', 'logs', 'hooks.jsonl');

  const entry = {
    hookType,
    ts: new Date().toISOString(),
    payload: (() => {
      try { return JSON.parse(serializedPayload); } catch (_) { return serializedPayload; }
    })(),
  };

  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    process.stderr.write(`[hook-dispatcher] Failed writing local hook log "${logFile}": ${err.message}\n`);
  }

  if (!supports('hook:log')) {
    return;
  }

  const cliArgs = ['hook:log', '--hook-type', hookType, '--log-file', logFile, '--json']
    .concat(Array.isArray(options.cliArgs) ? options.cliArgs : []);

  const result = runRaw(cliArgs, { timeout: 5000 });
  if (!result.ok) {
    const detail = result.stderr || result.stdout || `exit code ${result.exitCode}`;
    process.stderr.write(`[hook-dispatcher] hook:log failed for "${hookType}": ${detail}\n`);
  }
}

/**
 * Discover and return all .js handler files in .codex/hooks/<hookType>/.
 *
 * @param {string} hookType
 * @returns {string[]} Absolute paths to handler JS files
 */
function discoverHandlers(hookType) {
  const hookDir = path.join(HOOKS_BASE_DIR, hookType);

  if (!fs.existsSync(hookDir)) {
    return [];
  }

  let entries;
  try {
    entries = fs.readdirSync(hookDir);
  } catch (err) {
    process.stderr.write(
      `[hook-dispatcher] Could not read hook directory "${hookDir}": ${err.message}\n`
    );
    return [];
  }

  return entries
    .filter((name) => name.endsWith('.js'))
    .sort() // deterministic load order
    .map((name) => path.join(hookDir, name));
}

/**
 * Load and invoke a single JS handler file.
 * The handler must export a function; it receives (payload, options).
 *
 * @param {string} handlerPath
 * @param {*} payload
 * @param {object} options
 */
function invokeJsHandler(handlerPath, payload, options) {
  let handler;

  try {
    // Clear cache entry so hot-reload works in long-lived processes if desired
    delete require.cache[require.resolve(handlerPath)];
    handler = require(handlerPath);
  } catch (err) {
    process.stderr.write(
      `[hook-dispatcher] Failed to require handler "${handlerPath}": ${err.message}\n`
    );
    return;
  }

  // Support both module.exports = fn and module.exports = { default: fn }
  if (typeof handler === 'object' && handler !== null && typeof handler.default === 'function') {
    handler = handler.default;
  }

  if (typeof handler !== 'function') {
    process.stderr.write(
      `[hook-dispatcher] Handler "${handlerPath}" does not export a function — skipping.\n`
    );
    return;
  }

  try {
    const result = handler(payload, options);
    // If the handler returns a promise, await it and catch rejections
    if (result && typeof result.then === 'function') {
      result.catch((err) => {
        process.stderr.write(
          `[hook-dispatcher] Async handler "${handlerPath}" rejected: ${err.message}\n`
        );
      });
    }
  } catch (err) {
    process.stderr.write(
      `[hook-dispatcher] Handler "${handlerPath}" threw synchronously: ${err.message}\n`
    );
  }
}

/**
 * fireHook — the main public API.
 *
 * @param {string} hookType   One of the 13 supported hook type strings.
 * @param {*}      payload    Arbitrary data describing the event.
 * @param {object} [options]  Optional configuration:
 *   - options.babysitterBin {string}  Override the babysitter CLI binary name/path.
 *   - options.cliArgs       {string[]} Extra arguments passed to babysitter hook:log.
 *   - options.skipCli       {boolean} If true, skip the babysitter CLI call.
 *   - options.skipHandlers  {boolean} If true, skip loading custom handler scripts.
 * @returns {void}
 */
function fireHook(hookType, payload, options) {
  options = options || {};

  // Validate hook type
  if (!HOOK_TYPES.includes(hookType)) {
    process.stderr.write(
      `[hook-dispatcher] Unknown hook type "${hookType}". ` +
        `Supported types: ${HOOK_TYPES.join(', ')}\n`
    );
    // Still attempt to continue rather than throwing
  }

  const serializedPayload = serializePayload(payload);

  // --- Step 1: structured logging via babysitter CLI ---
  if (!options.skipCli) {
    logToBabysitter(hookType, serializedPayload, options);
  }

  // --- Step 2: custom handler scripts ---
  if (!options.skipHandlers) {
    const handlers = discoverHandlers(hookType);
    for (const handlerPath of handlers) {
      invokeJsHandler(handlerPath, payload, options);
    }
  }
}

// Expose the list of supported hook types for introspection
fireHook.HOOK_TYPES = HOOK_TYPES;

module.exports = { fireHook, HOOK_TYPES };

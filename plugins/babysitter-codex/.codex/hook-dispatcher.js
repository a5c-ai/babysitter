'use strict';

const fs = require('fs');
const path = require('path');
const { runRaw, supports } = require('./sdk-cli');

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
  'on-tool-error',
  'on-policy-block',
  'on-retry',
];

const HOOKS_BASE_DIR = path.resolve(__dirname, 'hooks');
const TRANSFORM_CONFIG_PATH = path.join(process.cwd(), '.a5c', 'config', 'hook-transforms.json');

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

function discoverHandlers(hookType) {
  const hookDir = path.join(HOOKS_BASE_DIR, hookType);
  if (!fs.existsSync(hookDir)) return [];

  let entries = [];
  try {
    entries = fs.readdirSync(hookDir);
  } catch (err) {
    process.stderr.write(`[hook-dispatcher] Could not read hook directory "${hookDir}": ${err.message}\n`);
    return [];
  }

  return entries
    .filter((name) => name.endsWith('.js'))
    .sort()
    .map((name) => path.join(hookDir, name));
}

function invokeJsHandler(handlerPath, payload, options) {
  let handler;
  try {
    delete require.cache[require.resolve(handlerPath)];
    handler = require(handlerPath);
  } catch (err) {
    process.stderr.write(`[hook-dispatcher] Failed to require handler "${handlerPath}": ${err.message}\n`);
    return;
  }

  if (typeof handler === 'object' && handler !== null && typeof handler.default === 'function') {
    handler = handler.default;
  }
  if (typeof handler !== 'function') {
    process.stderr.write(`[hook-dispatcher] Handler "${handlerPath}" does not export a function, skipping.\n`);
    return;
  }

  try {
    const result = handler(payload, options);
    if (result && typeof result.then === 'function') {
      result.catch((err) => {
        process.stderr.write(`[hook-dispatcher] Async handler "${handlerPath}" rejected: ${err.message}\n`);
      });
    }
  } catch (err) {
    process.stderr.write(`[hook-dispatcher] Handler "${handlerPath}" threw synchronously: ${err.message}\n`);
  }
}

function loadTransformConfig(configPath = TRANSFORM_CONFIG_PATH) {
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) || {};
  } catch (err) {
    process.stderr.write(`[hook-dispatcher] Failed reading transform config "${configPath}": ${err.message}\n`);
    return {};
  }
}

function applyConfiguredTransform(hookType, payload, options = {}) {
  const cfg = loadTransformConfig(options.transformConfigPath);
  const defaults = cfg['*'] && typeof cfg['*'] === 'object' ? cfg['*'] : {};
  const scoped = cfg[hookType] && typeof cfg[hookType] === 'object' ? cfg[hookType] : {};
  const rules = { ...defaults, ...scoped };
  if (!rules || typeof rules !== 'object') return payload;

  let next = payload && typeof payload === 'object'
    ? JSON.parse(JSON.stringify(payload))
    : payload;

  if (Array.isArray(rules.stripFields) && next && typeof next === 'object') {
    for (const field of rules.stripFields) {
      if (Object.prototype.hasOwnProperty.call(next, field)) {
        delete next[field];
      }
    }
  }

  if (rules.maxStringLength && next && typeof next === 'object') {
    const maxLen = Number(rules.maxStringLength);
    for (const key of Object.keys(next)) {
      if (typeof next[key] === 'string' && next[key].length > maxLen) {
        next[key] = `${next[key].slice(0, maxLen)}...`;
      }
    }
  }

  if (rules.addFields && next && typeof next === 'object') {
    next = { ...next, ...rules.addFields };
  }

  return next;
}

function fireHook(hookType, payload, options = {}) {
  let effectivePayload = applyConfiguredTransform(hookType, payload, options);

  if (!HOOK_TYPES.includes(hookType)) {
    process.stderr.write(
      `[hook-dispatcher] Unknown hook type "${hookType}". Supported types: ${HOOK_TYPES.join(', ')}\n`
    );
  }

  if (typeof options.transformPayload === 'function') {
    try {
      const transformed = options.transformPayload(effectivePayload, hookType);
      if (transformed !== undefined) effectivePayload = transformed;
    } catch (err) {
      process.stderr.write(`[hook-dispatcher] transformPayload failed for "${hookType}": ${err.message}\n`);
    }
  }

  const serializedPayload = serializePayload(effectivePayload);
  if (!options.skipCli) {
    logToBabysitter(hookType, serializedPayload, options);
  }

  if (!options.skipHandlers) {
    const handlers = discoverHandlers(hookType);
    for (const handlerPath of handlers) {
      invokeJsHandler(handlerPath, effectivePayload, options);
    }
  }
}

fireHook.HOOK_TYPES = HOOK_TYPES;

module.exports = {
  fireHook,
  HOOK_TYPES,
  applyConfiguredTransform,
  loadTransformConfig,
};

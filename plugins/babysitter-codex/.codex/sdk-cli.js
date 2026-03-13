'use strict';

const { execFileSync, spawnSync } = require('child_process');
const { resolveSdkPackage } = require('./sdk-package');

const DEFAULT_SDK_PKG = resolveSdkPackage();
const IS_WIN = process.platform === 'win32';

function resolveNpxBinary() {
  return IS_WIN ? 'npx.cmd' : 'npx';
}

function parseJsonish(raw) {
  const clean = String(raw || '').replace(/\x1b\[[0-9;]*m/g, '').trim();
  if (!clean) return null;

  if (clean.startsWith('{') || clean.startsWith('[')) {
    try {
      return JSON.parse(clean);
    } catch (_) {
      // fall through to regex extraction
    }
  }

  const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {
      return null;
    }
  }

  return null;
}

function runRaw(args, options = {}) {
  const timeout = options.timeout || 30000;
  const env = { ...process.env, ...(options.env || {}) };

  // Try direct babysitter binary first.
  try {
    const stdout = execFileSync('babysitter', args, {
      encoding: 'utf8',
      timeout,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: String(stdout || ''), stderr: '', exitCode: 0, runner: 'babysitter' };
  } catch (directErr) {
    const npxBin = resolveNpxBinary();
    const npxArgs = ['-y', DEFAULT_SDK_PKG, ...args];
    let spawned = spawnSync(npxBin, npxArgs, {
      encoding: 'utf8',
      timeout,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Some Windows shells expose npx only via cmd.exe resolution.
    if (IS_WIN && spawned.error && spawned.status === null) {
      const quoted = [npxBin, ...npxArgs]
        .map((x) => (/\s/.test(x) ? `"${x}"` : x))
        .join(' ');
      spawned = spawnSync('cmd.exe', ['/d', '/s', '/c', quoted], {
        encoding: 'utf8',
        timeout,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }

    return {
      ok: spawned.status === 0,
      stdout: String(spawned.stdout || ''),
      stderr: String(spawned.stderr || ''),
      exitCode: spawned.status,
      runner: `${npxBin} ${DEFAULT_SDK_PKG}`,
      directError: directErr,
      npxError: spawned.error || null,
    };
  }
}

function runJson(args, options = {}) {
  const result = runRaw(args, options);
  const parsed = parseJsonish(result.stdout);
  return { ...result, parsed };
}

let cachedCommands = null;
const CORE_COMMANDS = ['run:create', 'run:iterate', 'run:status', 'task:list', 'task:post'];
const ADVANCED_COMMANDS = ['session:init', 'session:associate', 'profile:read', 'skill:discover', 'health'];

function getSupportedCommands() {
  if (cachedCommands) return cachedCommands;

  const help = runRaw(['--help'], { timeout: 10000 });
  const text = `${help.stdout}\n${help.stderr}`;
  const commands = new Set();
  const re = /(?:^|\n)\s*babysitter\s+([a-z0-9:_-]+)\b/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    commands.add(m[1]);
  }

  // Fallback baseline commands for old CLIs if help parsing fails.
  if (commands.size === 0) {
    ['run:create', 'run:iterate', 'run:status', 'task:list', 'task:post', 'task:show', 'version'].forEach((c) => commands.add(c));
  }

  cachedCommands = commands;
  return commands;
}

function supports(command) {
  return getSupportedCommands().has(command);
}

function getCompatibilityReport() {
  const available = Array.from(getSupportedCommands()).sort();
  const missingCore = CORE_COMMANDS.filter((c) => !supports(c));
  const missingAdvanced = ADVANCED_COMMANDS.filter((c) => !supports(c));

  let mode = 'full';
  if (missingCore.length > 0) mode = 'unsupported';
  else if (missingAdvanced.length > 0) mode = 'compat-core';

  return {
    mode,
    sdkPackage: DEFAULT_SDK_PKG,
    available,
    missingCore,
    missingAdvanced,
    coreCommands: [...CORE_COMMANDS],
    advancedCommands: [...ADVANCED_COMMANDS],
  };
}

module.exports = {
  runRaw,
  runJson,
  supports,
  getSupportedCommands,
  parseJsonish,
  getCompatibilityReport,
  getSdkPackage: () => DEFAULT_SDK_PKG,
};

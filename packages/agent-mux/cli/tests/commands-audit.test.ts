/**
 * Functional audit of every top-level CLI command via the *built* CLI.
 *
 * Each test spawns `node dist/index.js ...` and asserts:
 *   - the exit code is sensible for the inputs provided,
 *   - `--json` paths emit well-formed `{ ok, data }` or `{ ok: false, error }`,
 *   - no stray child-process output contaminates structured output.
 *
 * Skipped if `dist/index.js` is missing (fresh clone with no build yet).
 */

import { describe, it, expect } from 'vitest';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distEntry = resolve(__dirname, '..', 'dist', 'index.js');
const distExists = existsSync(distEntry);
const suite = distExists ? describe : describe.skip;

/** Isolated config/project dirs so tests never touch the user's state. */
const CONFIG_DIR = mkdtempSync(join(tmpdir(), 'amux-cli-audit-cfg-'));
const PROJECT_DIR = mkdtempSync(join(tmpdir(), 'amux-cli-audit-proj-'));

function run(...args: string[]): SpawnSyncReturns<string> {
  return spawnSync(
    process.execPath,
    [
      distEntry,
      '--config-dir', CONFIG_DIR,
      '--project-dir', PROJECT_DIR,
      ...args,
    ],
    { encoding: 'utf8' },
  );
}

/** Parse stdout as JSON, failing the test with the raw output on error. */
function parseJson(res: SpawnSyncReturns<string>): { ok?: boolean; data?: unknown; error?: { code: string } } {
  try {
    return JSON.parse(res.stdout);
  } catch (err) {
    throw new Error(
      `Failed to parse CLI stdout as JSON. stdout=${JSON.stringify(res.stdout)} stderr=${JSON.stringify(res.stderr)} err=${String(err)}`,
    );
  }
}

suite('built CLI — functional audit', () => {
  // ── help / version ──────────────────────────────────────────────
  it('--help prints usage + lists adapters + remote + detect-host', () => {
    const res = run('--help');
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('amux');
    expect(res.stdout).toContain('adapters');
    expect(res.stdout).toContain('remote');
    expect(res.stdout).toContain('detect-host');
  }, 15000);

  it('--version prints semver', () => {
    const res = run('--version');
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/amux\s+v\d+\.\d+\.\d+/);
  });

  it('help <cmd> prints per-command help', () => {
    for (const cmd of ['run', 'adapters', 'models', 'sessions', 'config', 'profiles', 'auth', 'install', 'update', 'detect', 'remote', 'detect-host', 'plugins']) {
      const res = run('help', cmd);
      expect(res.status, `help ${cmd} should exit 0`).toBe(0);
      expect(res.stdout.length).toBeGreaterThan(20);
    }
  }, 25000);

  // ── adapters ────────────────────────────────────────────────────
  it('adapters list --json returns the built-in adapter set', () => {
    const res = run('adapters', 'list', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.data)).toBe(true);
    expect((parsed.data as unknown[]).length).toBeGreaterThanOrEqual(12);
  });

  it('adapters info claude --json returns a capabilities object', () => {
    const res = run('adapters', 'info', 'claude', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('approvalModes');
  });

  it('adapters info <missing-arg> --json → VALIDATION_ERROR', () => {
    const res = run('adapters', 'info', '--json');
    expect(res.status).not.toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.code).toBe('VALIDATION_ERROR');
  });

  // ── models ──────────────────────────────────────────────────────
  it('models list claude --json returns an array', () => {
    const res = run('models', 'list', 'claude', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.data)).toBe(true);
    expect((parsed.data as Array<Record<string, unknown>>)[0]).toHaveProperty('provider');
  });

  it('models list --json (no agent) → VALIDATION_ERROR', () => {
    const res = run('models', 'list', '--json');
    expect(res.status).not.toBe(0);
    expect(parseJson(res).error?.code).toBe('VALIDATION_ERROR');
  });

  it('models current claude --json returns configured/default/effective model data', () => {
    const res = run('models', 'current', 'claude', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('defaultModel');
    expect(parsed.data).toHaveProperty('effectiveModel');
  });

  it('models set claude sonnet --json resolves aliases and writes config', () => {
    const res = run('models', 'set', 'claude', 'sonnet', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toMatchObject({
      agent: 'claude',
      requestedModel: 'sonnet',
      configuredModel: 'claude-sonnet-4-20250514',
    });
  });

  // ── auth ────────────────────────────────────────────────────────
  it('auth check claude --json returns a status object', () => {
    const res = run('auth', 'check', 'claude', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('status');
  });

  // ── config ──────────────────────────────────────────────────────
  it('config get claude --json returns an object', () => {
    const res = run('config', 'get', 'claude', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toBeTypeOf('object');
  });

  it('config get claude <missing-field> --json returns null (not empty)', () => {
    const res = run('config', 'get', 'claude', 'nonexistent-field-xyz', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    // Consistent shape: data key must be present (null when missing).
    expect('data' in parsed).toBe(true);
  });

  it('config set --json returns the echoed value', () => {
    // Note: persistence across invocations depends on each adapter's
    // native config file — here we only assert the set command returns
    // a well-formed response.
    const setRes = run('config', 'set', 'claude', 'model', 'claude-sonnet-4-20250514', '--json');
    expect(setRes.status).toBe(0);
    const setParsed = parseJson(setRes);
    expect(setParsed.ok).toBe(true);
    expect(setParsed.data).toMatchObject({
      agent: 'claude',
      field: 'model',
      value: 'claude-sonnet-4-20250514',
    });
  });

  // ── profiles ────────────────────────────────────────────────────
  it('profiles list --json returns an array', () => {
    const res = run('profiles', 'list', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.data)).toBe(true);
  });

  it('profiles set then list roundtrip via --json', () => {
    const setRes = run('profiles', 'set', 'fast', '--agent', 'claude', '--yolo', '--json');
    expect(setRes.status).toBe(0);
    expect(parseJson(setRes).ok).toBe(true);

    const listRes = run('profiles', 'list', '--json');
    expect(listRes.status).toBe(0);
    const listParsed = parseJson(listRes);
    expect(listParsed.ok).toBe(true);
    const names = (listParsed.data as Array<{ name: string }>).map((p) => p.name);
    expect(names).toContain('fast');
  });

  // ── sessions ────────────────────────────────────────────────────
  it('sessions list claude --json returns an array', () => {
    const res = run('sessions', 'list', 'claude', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.data)).toBe(true);
  });

  it('sessions export --json (no args) → VALIDATION_ERROR', () => {
    const res = run('sessions', 'export', '--json');
    expect(res.status).not.toBe(0);
    expect(parseJson(res).error?.code).toBe('VALIDATION_ERROR');
  });

  // ── detect / detect-host ────────────────────────────────────────
  it('detect claude --json emits clean JSON (no child-process leak)', () => {
    const res = run('detect', 'claude', '--json');
    expect(res.status).toBe(0);
    // Strict: stdout must parse as a single JSON object with no prefix.
    const trimmed = res.stdout.trimStart();
    expect(trimmed.startsWith('{')).toBe(true);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('agent', 'claude');
    expect(parsed.data).toHaveProperty('installed');
  });

  it('detect --all --json returns a results array', () => {
    const res = run('detect', '--all', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('results');
  });

  it('detect-host --json returns a detection object', () => {
    const res = run('detect-host', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('detected');
  });

  // ── install / update (dry-run) ──────────────────────────────────
  it('install claude --dry-run --json reports the planned command', () => {
    const res = run('install', 'claude', '--dry-run', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('dryRun', true);
    expect(parsed.data).toHaveProperty('command');
  });

  it('update claude --dry-run --json reports the planned command', () => {
    const res = run('update', 'claude', '--dry-run', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('command');
  });

  // ── remote (dry-run) ────────────────────────────────────────────
  it('remote install --mode ssh --dry-run --json reports steps', () => {
    const res = run('remote', 'install', 'host.example.com', '--mode', 'ssh', '--dry-run', '--json');
    expect(res.status).toBe(0);
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toHaveProperty('dryRun', true);
    expect(parsed.data).toHaveProperty('steps');
  });

  // ── plugins (unsupported agent) ─────────────────────────────────
  it('plugins list codex --json → CAPABILITY_ERROR (awaited, not thrown)', () => {
    // Regression test for the bug where `pm.list(agent)` was not awaited,
    // causing a raw stack trace to leak after the JSON envelope.
    // Uses codex because claude now supports plugins (MCP servers).
    const res = run('plugins', 'list', 'codex', '--json');
    expect(res.status).not.toBe(0);
    // Stdout must be exactly one JSON object — no stack trace leakage.
    const parsed = parseJson(res);
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.code).toBe('CAPABILITY_ERROR');
    expect(res.stdout).not.toContain('at PluginManagerImpl');
  });

  // ── unknown command ─────────────────────────────────────────────
  it('unknown command --json → VALIDATION_ERROR', () => {
    const res = run('no-such-command', '--json');
    expect(res.status).not.toBe(0);
    expect(parseJson(res).error?.code).toBe('VALIDATION_ERROR');
  });
});

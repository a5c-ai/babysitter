#!/usr/bin/env node
// Run after `npm run build` from the SDK package.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

if (process.platform !== 'linux') {
  console.log('session-start shell integration: skipped (Linux only)');
  process.exit(0);
}

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const cli = path.join(packageRoot, 'dist/cli/main.js');
const hook = path.join(repoRoot, 'plugins/babysitter-unified/hooks/session-start.sh');
assert.ok(fs.existsSync(cli), 'Build the SDK before running this test');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-session-start-shell-'));
try {
  const bin = path.join(tmp, 'bin');
  fs.mkdirSync(bin);
  const launcher = path.join(bin, 'babysitter');
  fs.writeFileSync(launcher, '#!/bin/sh\nexec "$BABYSITTER_TEST_NODE" "$BABYSITTER_TEST_CLI" "$@"\n', { mode: 0o755 });
  const claude = path.join(bin, 'claude');
  fs.symlinkSync(process.execPath, claude);
  const blockedRuns = path.join(tmp, 'blocked-runs');
  fs.writeFileSync(blockedRuns, 'not a directory');
  const driver = path.join(tmp, 'driver.cjs');
  fs.writeFileSync(driver, `
    const { spawnSync } = require('node:child_process');
    const fs = require('node:fs');
    const path = require('node:path');
    function run(command, args, input) {
      const result = spawnSync(command, args, { input, env: process.env, encoding: 'utf8', timeout: 20000 });
      if (result.error || result.status !== 0) throw new Error(command + ': ' + (result.error || result.stderr));
      return result.stdout;
    }
    const comm = run('ps', ['-p', String(process.pid), '-o', 'comm=']).trim();
    const hookOutput = run('bash', [process.env.BABYSITTER_TEST_HOOK], JSON.stringify({ session_id: 'native-session' }));
    const markerPath = path.join(process.env.BABYSITTER_GLOBAL_STATE_DIR, 'state', 'current-session-claude-code-pid-' + process.pid);
    const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
    const whoami = JSON.parse(run('babysitter', ['session:whoami', '--json']));
    const created = JSON.parse(run('babysitter', ['run:create', '--runs-dir', process.env.BABYSITTER_TEST_RUNS, '--harness', 'claude-code', '--json']));
    process.stdout.write(JSON.stringify({ comm, hookOutput, marker, whoami, created }) + '\\n');
  `);
  const env = {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      PLUGIN_ROOT: path.join(repoRoot, 'plugins/babysitter-unified'),
      BABYSITTER_TEST_NODE: process.execPath,
      BABYSITTER_TEST_CLI: cli,
      BABYSITTER_TEST_HOOK: hook,
      BABYSITTER_TEST_RUNS: path.join(tmp, 'runs'),
      BABYSITTER_GLOBAL_STATE_DIR: path.join(tmp, 'a5c'),
      BABYSITTER_RUNS_DIR: blockedRuns,
      AGENT_SESSION_ID: 'stale-inherited-session',
  };
  delete env.AGENT_ENABLE_SESSION_PID_MARKERS;
  delete env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
  const result = spawnSync(claude, [driver], { encoding: 'utf8', timeout: 60000, env });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  const actual = JSON.parse(result.stdout);
  assert.equal(actual.comm, 'claude');
  assert.equal(actual.marker.sessionId, 'native-session');
  assert.ok(actual.marker.processStartIdentity);
  assert.equal(actual.whoami.sessionId, 'native-session');
  assert.equal(actual.whoami.resolvedFrom, 'pid-marker');
  assert.equal(actual.whoami.ancestorAlive, true);
  assert.equal(actual.created.session.sessionId, 'native-session');
  assert.equal(actual.created.session.resolvedFrom, 'pid-marker');
  console.log('session-start shell integration: passed');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

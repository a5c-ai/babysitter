'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  registerSession,
  findSession,
  listSessions,
  updateSessionMetadata,
} = require('../.codex/state-index');
const { evaluateTaskPolicy } = require('../.codex/policy-engine');
const { updateTelemetry, getBudgetStatus } = require('../.codex/telemetry');
const { loadWorkspace, resolveRepoPath } = require('../.codex/workspace-manager');
const { handleModelCommand, handleResumeSelector } = require('../.codex/mode-handlers');
const { applyConfiguredTransform } = require('../.codex/hook-dispatcher');

function withTempRepo(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-codex-'));
  try {
    fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

console.log('Features 1-10 tests:');

withTempRepo((repoRoot) => {
  registerSession(repoRoot, { sessionId: 's1', alias: 'alpha', tags: ['backend'], runId: 'r1' });
  registerSession(repoRoot, { sessionId: 's2', alias: 'beta', tags: ['frontend'], runId: 'r2' });
  updateSessionMetadata(repoRoot, 's1', { addTag: 'critical' });
  const foundByTag = findSession(repoRoot, 'tag:critical');
  assert.strictEqual(foundByTag.sessionId, 's1');
  const foundBySearch = findSession(repoRoot, 'search:bet');
  assert.strictEqual(foundBySearch.sessionId, 's2');
  const listed = listSessions(repoRoot, { query: 'a' });
  assert.ok(listed.length >= 2);
  console.log('  ok session selectors and metadata updates');
});

withTempRepo((repoRoot) => {
  writeJson(path.join(repoRoot, '.a5c', 'config', 'policies.json'), {
    longTaskMode: 'strict',
    allowShellCommands: ['npm test'],
    allowNodeScripts: ['safe-script.js'],
  });
  const blockedShell = evaluateTaskPolicy(
    { kind: 'shell', shell: { command: 'rm -rf .' } },
    { repoRoot, mode: 'yolo', iteration: 1 }
  );
  assert.strictEqual(blockedShell.allowed, false);
  const allowedNode = evaluateTaskPolicy(
    { kind: 'node', node: { script: 'safe-script.js' } },
    { repoRoot, mode: 'yolo', iteration: 1 }
  );
  assert.strictEqual(allowedNode.allowed, true);
  console.log('  ok long-task strict allowlist policy');
});

withTempRepo((repoRoot) => {
  const runDir = path.join(repoRoot, '.a5c', 'runs', 'r1');
  updateTelemetry(runDir, { iterations: 1, tokens: 1000, estimatedCostUsd: 1.1 });
  const soft = getBudgetStatus(runDir, 2.0, 0.5);
  assert.strictEqual(soft.phase, 'soft-limit');
  updateTelemetry(runDir, { iterations: 1, tokens: 500, estimatedCostUsd: 1.2 });
  const hard = getBudgetStatus(runDir, 2.0, 0.5);
  assert.strictEqual(hard.phase, 'hard-stop');
  console.log('  ok budget phase transitions');
});

withTempRepo((repoRoot) => {
  writeJson(path.join(repoRoot, '.a5c', 'workspace', 'repos.json'), {
    version: 1,
    repos: [
      { alias: 'default', scope: 'core', path: '.' },
      { alias: 'ui', scope: 'frontend', path: './ui' },
    ],
  });
  fs.mkdirSync(path.join(repoRoot, 'ui'), { recursive: true });
  const ws = loadWorkspace(repoRoot);
  assert.ok(resolveRepoPath(ws, 'ui').endsWith(path.join('ui')));
  assert.ok(resolveRepoPath(ws, 'frontend').endsWith(path.join('ui')));
  console.log('  ok workspace alias and scope routing');
});

withTempRepo((repoRoot) => {
  const modelSet = handleModelCommand('set plan=gpt-5 execute=gpt-5-codex', { repoRoot });
  assert.strictEqual(modelSet.ok, true);
  assert.strictEqual(modelSet.policy.plan, 'gpt-5');
  const modelShow = handleModelCommand('show', { repoRoot });
  assert.strictEqual(modelShow.policy.execute, 'gpt-5-codex');
  console.log('  ok model policy persistence');
});

withTempRepo((repoRoot) => {
  registerSession(repoRoot, { sessionId: 's10', alias: 'recent-one', tags: [] });
  const rename = handleResumeSelector('name sprint-fix', { repoRoot });
  assert.strictEqual(rename.ok, true);
  const addTag = handleResumeSelector('tag +urgent', { repoRoot });
  assert.strictEqual(addTag.ok, true);
  const byTag = handleResumeSelector('tag:urgent', { repoRoot });
  assert.strictEqual(byTag.ok, true);
  console.log('  ok resume command alias/tag operations');
});

withTempRepo((repoRoot) => {
  const transformPath = path.join(repoRoot, '.a5c', 'config', 'hook-transforms.json');
  writeJson(transformPath, {
    '*': { maxStringLength: 5 },
    'on-tool-error': { stripFields: ['stack'], addFields: { source: 'test' } },
  });
  const out = applyConfiguredTransform(
    'on-tool-error',
    { message: 'abcdefg', stack: 'trace' },
    { transformConfigPath: transformPath }
  );
  assert.strictEqual(out.stack, undefined);
  assert.strictEqual(out.source, 'test');
  assert.strictEqual(out.message, 'abcde...');
  console.log('  ok hook payload transforms');
});

console.log('All feature tests passed.');

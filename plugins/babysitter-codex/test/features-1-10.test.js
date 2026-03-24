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

function withTempRepo(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-codex-'));
  try {
    fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('Features tests:');

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

console.log('All feature tests passed.');

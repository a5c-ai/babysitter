'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tc = require('../.codex/turn-controller');
const stateIndex = require('../.codex/state-index');

function tmpRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-turn-controller-'));
  fs.mkdirSync(path.join(root, '.a5c', 'runs'), { recursive: true });
  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function testResolveExplicitSessionId() {
  const original = {
    babysitter: process.env.BABYSITTER_SESSION_ID,
    thread: process.env.CODEX_THREAD_ID,
    session: process.env.CODEX_SESSION_ID,
  };
  delete process.env.BABYSITTER_SESSION_ID;
  delete process.env.CODEX_THREAD_ID;
  delete process.env.CODEX_SESSION_ID;

  assert.strictEqual(tc.resolveExplicitSessionId(), null);
  process.env.CODEX_THREAD_ID = 'thread-123';
  assert.strictEqual(tc.resolveExplicitSessionId(), 'thread-123');

  if (original.babysitter === undefined) delete process.env.BABYSITTER_SESSION_ID;
  else process.env.BABYSITTER_SESSION_ID = original.babysitter;
  if (original.thread === undefined) delete process.env.CODEX_THREAD_ID;
  else process.env.CODEX_THREAD_ID = original.thread;
  if (original.session === undefined) delete process.env.CODEX_SESSION_ID;
  else process.env.CODEX_SESSION_ID = original.session;
}

function testCurrentRunPointer() {
  const repoRoot = tmpRepo();
  try {
    const pointer = tc.writeCurrentRun(repoRoot, {
      runId: '01TESTRUN000000000000000001',
      runDir: path.join(repoRoot, '.a5c', 'runs', '01TESTRUN000000000000000001'),
      iteration: 2,
    });
    assert.strictEqual(pointer.runId, '01TESTRUN000000000000000001');
    const readBack = tc.currentRun(repoRoot);
    assert.strictEqual(readBack.iteration, 2);
  } finally {
    cleanup(repoRoot);
  }
}

function testResolveRunHandle() {
  const repoRoot = tmpRepo();
  try {
    const runId = '01TESTRUN000000000000000002';
    const runDir = path.join(repoRoot, '.a5c', 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });
    tc.writeCurrentRun(repoRoot, { runId, runDir, iteration: 1 });

    const current = tc.resolveRunHandle(repoRoot, '');
    assert.strictEqual(current.runId, runId);

    const namedCurrent = tc.resolveRunHandle(repoRoot, 'current');
    assert.strictEqual(namedCurrent.runId, runId);

    const latest = tc.resolveRunHandle(repoRoot, 'latest');
    assert.strictEqual(latest.runId, runId);

    const direct = tc.resolveRunHandle(repoRoot, runId);
    assert.strictEqual(direct.runDir, runDir);
  } finally {
    cleanup(repoRoot);
  }
}

function testResolveIndexedSessionHandle() {
  const repoRoot = tmpRepo();
  try {
    const runId = '01TESTRUN000000000000000003';
    const runDir = path.join(repoRoot, '.a5c', 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });
    stateIndex.registerSession(repoRoot, {
      sessionId: 'thread-456',
      runId,
      alias: 'primary',
      tags: ['recent'],
    });

    const recent = tc.resolveRunHandle(repoRoot, 'recent');
    assert.strictEqual(recent.runId, runId);

    const byAlias = tc.resolveRunHandle(repoRoot, 'primary');
    assert.strictEqual(byAlias.runId, runId);
  } finally {
    cleanup(repoRoot);
  }
}

function testSummarizeTaskAndAction() {
  const runDir = path.join('C:', 'repo', '.a5c', 'runs', '01TEST');
  const breakpoint = tc.summarizeTask(runDir, {
    effectId: 'bp1',
    taskId: 'ask-user',
    kind: 'breakpoint',
    metadata: {
      payload: {
        title: 'Question',
        question: 'Continue?',
        questions: ['Why?', 'When?'],
      },
    },
  });
  assert.strictEqual(breakpoint.kind, 'breakpoint');
  assert.strictEqual(breakpoint.breakpoint.question, 'Continue?');

  const agent = tc.summarizeTask(runDir, {
    effectId: 'ag1',
    taskId: 'implement',
    kind: 'agent',
    agent: { name: 'general-purpose', prompt: { role: 'dev' } },
  });
  assert.strictEqual(agent.execution.agentName, 'general-purpose');

  const yieldAction = tc.buildAction('01TEST', runDir, { state: 'running' }, [
    { effectId: 'bp1', kind: 'breakpoint', metadata: { payload: { question: 'Continue?' } } },
  ]);
  assert.strictEqual(yieldAction.action, 'yield_to_user');

  const executeAction = tc.buildAction('01TEST', runDir, { state: 'running' }, [
    { effectId: 'ag1', kind: 'shell', shell: { command: 'npm test' } },
  ]);
  assert.strictEqual(executeAction.action, 'execute_tasks');

  const completeAction = tc.buildAction('01TEST', runDir, { state: 'completed' }, []);
  assert.strictEqual(completeAction.action, 'run_completed');
}

console.log('Turn Controller Tests:');
try {
  testResolveExplicitSessionId();
  console.log('  ok explicit session resolution is honest');
  testCurrentRunPointer();
  console.log('  ok current-run pointer persists');
  testResolveRunHandle();
  console.log('  ok current and latest selectors resolve');
  testResolveIndexedSessionHandle();
  console.log('  ok session index selectors resolve back to runs');
  testSummarizeTaskAndAction();
  console.log('  ok task summarization and action classification work');
  console.log('\nAll turn-controller tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}

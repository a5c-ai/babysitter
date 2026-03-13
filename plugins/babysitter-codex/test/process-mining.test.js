'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mineProcess } = require('../.codex/process-mining');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function testProcessMining() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-mine-'));
  try {
    const run1 = path.join(repoRoot, '.a5c', 'runs', 'run-1');
    const run2 = path.join(repoRoot, '.a5c', 'runs', 'run-2');

    writeJson(path.join(run1, 'run.json'), { runId: 'run-1', processId: 'demo', createdAt: '2026-03-11T10:00:00.000Z' });
    writeJson(path.join(run1, 'journal', '000001.json'), {
      type: 'RUN_CREATED',
      recordedAt: '2026-03-11T10:00:00.000Z',
      data: { runId: 'run-1' },
    });
    writeJson(path.join(run1, 'journal', '000002.json'), {
      type: 'EFFECT_REQUESTED',
      recordedAt: '2026-03-11T10:00:01.000Z',
      data: { effectId: 'e1', kind: 'agent', taskId: 'task-1', stepId: 'S1' },
    });
    writeJson(path.join(run1, 'journal', '000003.json'), {
      type: 'EFFECT_RESOLVED',
      recordedAt: '2026-03-11T10:00:03.000Z',
      data: {
        effectId: 'e1',
        status: 'ok',
        startedAt: '2026-03-11T10:00:01.000Z',
        finishedAt: '2026-03-11T10:00:03.000Z',
      },
    });
    writeJson(path.join(run1, 'journal', '000004.json'), {
      type: 'RUN_COMPLETED',
      recordedAt: '2026-03-11T10:00:04.000Z',
      data: { runId: 'run-1' },
    });

    writeJson(path.join(run2, 'run.json'), { runId: 'run-2', processId: 'demo-2', createdAt: '2026-03-11T11:00:00.000Z' });
    writeJson(path.join(run2, 'journal', '000001.json'), {
      type: 'RUN_CREATED',
      recordedAt: '2026-03-11T11:00:00.000Z',
      data: { runId: 'run-2' },
    });

    const hooksPath = path.join(repoRoot, '.a5c', 'logs', 'hooks.jsonl');
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(
      hooksPath,
      '{"hookType":"on-breakpoint","payload":{}}\n{"hookType":"on-score","payload":{"score":85}}\n',
      'utf8',
    );

    const report = mineProcess({ repoRoot });

    assert.strictEqual(report.summary.totalRuns, 2);
    assert.strictEqual(report.summary.completedRuns, 1);
    assert.strictEqual(report.summary.partialRuns, 1);
    assert.strictEqual(report.summary.totalEffectsRequested, 1);
    assert.strictEqual(report.summary.totalEffectsResolved, 1);
    assert.strictEqual(report.summary.effectKindCounts.agent, 1);
    assert.strictEqual(report.summary.effectStatusCounts.ok, 1);
    assert.strictEqual(report.summary.effectDurations.avgSec, 2);
    assert.strictEqual(report.hooks.byType['on-score'], 1);
    assert.strictEqual(report.hooks.score.unique, 1);
    console.log('  ok process mining report summarization');
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

console.log('Process Mining Tests:');
try {
  testProcessMining();
  console.log('All process mining tests passed.');
} catch (err) {
  console.error('Test failed:', err.message);
  process.exit(1);
}


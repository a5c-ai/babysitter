#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { runJson, supports } = require('../sdk-cli');
const { getRunId } = require('./utils');

const TERMINAL_STATES = new Set(['completed', 'done', 'finished', 'failed', 'error', 'cancelled']);

function normalizeState(value) {
  return String(value || '').trim().toLowerCase();
}

function computeStopDecision(input = {}) {
  const runState = normalizeState(input.runState);
  const pendingCount = Number(input.pendingCount || 0);
  const hasStatus = Boolean(input.statusOk);
  const hasPending = Boolean(input.pendingOk);

  if (runState && TERMINAL_STATES.has(runState)) {
    return { decision: 'approve', reason: `terminal_state:${runState}` };
  }
  if (pendingCount > 0) {
    return { decision: 'block', reason: `pending_tasks:${pendingCount}` };
  }
  if (!hasStatus || !hasPending) {
    return { decision: 'block', reason: 'insufficient_status_or_pending_data' };
  }
  return { decision: 'block', reason: `non_terminal_state:${runState || 'unknown'}` };
}

function extractPendingCount(parsed) {
  if (!parsed) return 0;
  if (Array.isArray(parsed)) return parsed.length;
  if (Array.isArray(parsed.tasks)) return parsed.tasks.length;
  if (Array.isArray(parsed.pending)) return parsed.pending.length;
  if (typeof parsed.count === 'number') return parsed.count;
  return 0;
}

function readCurrentRunId(repoRoot) {
  const currentRunPath = path.join(repoRoot, '.a5c', 'current-run.json');
  if (!fs.existsSync(currentRunPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(currentRunPath, 'utf8'));
    return data.runId || data.id || data.run_id || null;
  } catch {
    return null;
  }
}

function main() {
  const repoRoot = process.env.REPO_ROOT || process.cwd();
  const runId = process.env.BABYSITTER_RUN_ID || getRunId('stop-decision') || readCurrentRunId(repoRoot);
  if (!runId) {
    process.stdout.write(
      JSON.stringify(
        {
          decision: 'approve',
          reason: 'no_active_run',
          runId: null,
          runState: null,
          pendingCount: 0,
        },
        null,
        2,
      ) + '\n',
    );
    return;
  }

  const statusRes = supports('run:status') ? runJson(['run:status', runId, '--json'], { timeout: 10000 }) : { ok: false };
  const pendingRes = supports('task:list') ? runJson(['task:list', runId, '--pending', '--json'], { timeout: 10000 }) : { ok: false };

  const runState = statusRes.ok ? normalizeState((statusRes.parsed || {}).state || (statusRes.parsed || {}).status) : '';
  const pendingCount = pendingRes.ok ? extractPendingCount(pendingRes.parsed) : 0;
  const decision = computeStopDecision({
    runState,
    pendingCount,
    statusOk: statusRes.ok,
    pendingOk: pendingRes.ok,
  });

  process.stdout.write(
    JSON.stringify(
      {
        ...decision,
        runId,
        runState: runState || null,
        pendingCount,
        statusOk: statusRes.ok,
        pendingOk: pendingRes.ok,
      },
      null,
      2,
    ) + '\n',
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  computeStopDecision,
  normalizeState,
  extractPendingCount,
};

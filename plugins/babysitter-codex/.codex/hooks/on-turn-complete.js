#!/usr/bin/env node
'use strict';

/**
 * on-turn-complete.js
 * Codex lifecycle hook: notified after each turn completes.
 * - Reads the current run ID from environment or .a5c/current-run.json
 * - Logs turn completion with timestamp and context
 * - Checks iteration state via `babysitter run:status`
 */

const fs = require('fs');
const path = require('path');
const { runJson, supports } = require('../sdk-cli');

// Import shared hook utilities
const { getRunId, isValidRunId } = require('./utils.js');

const REPO_ROOT = process.env.REPO_ROOT || path.resolve(__dirname, '..', '..');
const A5C_DIR = path.join(REPO_ROOT, '.a5c');

function getRunStatus(runId) {
  if (!isValidRunId(runId)) {
    console.error('[on-turn-complete] Refusing to use run ID with unexpected characters (possible injection): ' + String(runId));
    return null;
  }

  if (!supports('run:status')) {
    return { unsupported: true, command: 'run:status' };
  }

  const runDir = path.join('.a5c', 'runs', runId);
  const result = runJson(['run:status', runDir, '--json'], { timeout: 10000 });
  if (!result.ok) {
    console.warn('[on-turn-complete] Could not retrieve run status:', result.stderr || result.stdout || `exit code ${result.exitCode}`);
    return null;
  }
  return result.parsed || null;
}

function logTurnCompletion(runId, turnIndex, status) {
  const logDir = runId
    ? path.join(A5C_DIR, 'runs', runId, 'logs')
    : path.join(A5C_DIR, 'logs');

  fs.mkdirSync(logDir, { recursive: true });

  const logEntry = {
    event: 'turn-complete',
    timestamp: new Date().toISOString(),
    runId: runId || null,
    turnIndex: turnIndex !== undefined ? Number(turnIndex) : null,
    status: status || null,
    env: {
      CODEX_TURN_INDEX: process.env.CODEX_TURN_INDEX || null,
      CODEX_SESSION_ID: process.env.CODEX_SESSION_ID || null,
      BABYSITTER_RUN_ID: process.env.BABYSITTER_RUN_ID || null,
    },
  };

  const logFile = path.join(logDir, 'turns.jsonl');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
  console.log(`[on-turn-complete] Turn logged to: ${logFile}`);
  return logEntry;
}

function main() {
  const runId = getRunId();
  const turnIndex = process.env.CODEX_TURN_INDEX;

  console.log(`[on-turn-complete] Turn complete. RunID: ${runId || '(unknown)'}, Turn: ${turnIndex || '(unknown)'}`);

  let status = null;
  if (runId) {
    console.log(`[on-turn-complete] Checking run status for run: ${runId}`);
    status = getRunStatus(runId);
    if (status) {
      console.log(`[on-turn-complete] Run status:`, JSON.stringify(status, null, 2));

      const runState = status.state || status.status;
      if (runState === 'completed' || runState === 'done' || runState === 'finished') {
        console.log(`[on-turn-complete] Run ${runId} is complete. Signaling exit.`);
        logTurnCompletion(runId, turnIndex, status);
        process.exit(0);
      }

      if (runState === 'failed' || runState === 'error' || runState === 'cancelled') {
        console.error(`[on-turn-complete] Run ${runId} is in terminal error state: ${runState}`);
        logTurnCompletion(runId, turnIndex, status);
        process.exit(1);
      }
    }
  } else {
    console.warn('[on-turn-complete] No run ID found; skipping run:status check.');
  }

  logTurnCompletion(runId, turnIndex, status);
  console.log('[on-turn-complete] Hook completed successfully.');
  process.exit(0);
}

main();

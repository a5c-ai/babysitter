#!/usr/bin/env node
'use strict';

/**
 * iteration-guard.js
 * Codex lifecycle hook: guards against runaway iteration loops.
 *
 * Delegates to the authoritative standalone module at ../.codex/iteration-guard.js
 * for the actual guard logic (checkIterationGuard, runAllGuards, etc.).
 *
 * This hook script:
 * - Reads the run ID from env or .a5c/current-run.json
 * - Reads iteration state from .a5c/runs/<runId>/state/
 * - Compares against BABYSITTER_MAX_ITERATIONS env var (default 10)
 * - Optionally reads session context from .a5c/session.json
 * - Warns at 80% threshold, errors (exits 1) at 100%
 */

const fs = require('fs');
const path = require('path');

// Import the authoritative iteration-guard module
const guardModule = require('../iteration-guard.js');

// Import shared hook utilities
const { getRunId } = require('./utils.js');

const REPO_ROOT = process.env.REPO_ROOT || path.resolve(__dirname, '..', '..');
const A5C_DIR = path.join(REPO_ROOT, '.a5c');

const DEFAULT_MAX_ITERATIONS = 10;
const WARN_THRESHOLD = 0.8; // 80%

function readIterationState(runId) {
  const stateDir = path.join(A5C_DIR, 'runs', runId, 'state');

  if (!fs.existsSync(stateDir)) {
    console.warn('[iteration-guard] State directory does not exist: ' + stateDir);
    return null;
  }

  // Try state.json first
  const stateFile = path.join(stateDir, 'state.json');
  if (fs.existsSync(stateFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      const iteration = data.iteration || data.iterationCount || data.turn || data.turnCount;
      if (iteration !== undefined) {
        return { iteration: Number(iteration), source: stateFile };
      }
    } catch (err) {
      console.warn('[iteration-guard] Could not parse state.json:', err.message);
    }
  }

  // Try iteration.json
  const iterFile = path.join(stateDir, 'iteration.json');
  if (fs.existsSync(iterFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(iterFile, 'utf8'));
      const iteration = data.iteration || data.count || data.value;
      if (iteration !== undefined) {
        return { iteration: Number(iteration), source: iterFile };
      }
    } catch (err) {
      console.warn('[iteration-guard] Could not parse iteration.json:', err.message);
    }
  }

  // Try counting turn log entries as a fallback
  const turnsLogFile = path.join(A5C_DIR, 'runs', runId, 'logs', 'turns.jsonl');
  if (fs.existsSync(turnsLogFile)) {
    try {
      const lines = fs.readFileSync(turnsLogFile, 'utf8')
        .split('\n')
        .filter(function (l) { return l.trim().length > 0; });
      return { iteration: lines.length, source: turnsLogFile };
    } catch (err) {
      console.warn('[iteration-guard] Could not count turn log entries:', err.message);
    }
  }

  return null;
}

function writeGuardState(runId, guardState) {
  const stateDir = path.join(A5C_DIR, 'runs', runId, 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  const guardFile = path.join(stateDir, 'guard.json');
  fs.writeFileSync(guardFile, JSON.stringify(guardState, null, 2) + '\n', 'utf8');
}

function main() {
  const maxIterations = parseInt(
    process.env.BABYSITTER_MAX_ITERATIONS || String(DEFAULT_MAX_ITERATIONS),
    10
  );

  if (isNaN(maxIterations) || maxIterations <= 0) {
    console.error('[iteration-guard] Invalid BABYSITTER_MAX_ITERATIONS value: ' + process.env.BABYSITTER_MAX_ITERATIONS);
    process.exit(1);
  }

  const runId = getRunId();

  if (!runId) {
    console.warn('[iteration-guard] No run ID found; skipping iteration guard check.');
    process.exit(0);
  }

  // Read session context if available
  const session = guardModule.readSessionContext(REPO_ROOT);
  if (session && session.sessionId) {
    console.log('[iteration-guard] Session context loaded: ' + session.sessionId);
  }

  console.log('[iteration-guard] Checking iteration count for run: ' + runId);
  console.log('[iteration-guard] Max iterations: ' + maxIterations);

  const state = readIterationState(runId);

  if (state === null) {
    console.warn('[iteration-guard] Could not determine iteration count; allowing run to continue.');
    process.exit(0);
  }

  var iteration = state.iteration;
  var source = state.source;
  const percentage = iteration / maxIterations;
  const warnAt = Math.floor(maxIterations * WARN_THRESHOLD);

  console.log('[iteration-guard] Current iteration: ' + iteration + ' (source: ' + source + ')');
  console.log('[iteration-guard] Progress: ' + iteration + '/' + maxIterations + ' (' + Math.round(percentage * 100) + '%)');

  const guardState = {
    runId,
    iteration,
    maxIterations,
    percentage: Math.round(percentage * 100),
    warnThreshold: warnAt,
    checkedAt: new Date().toISOString(),
  };

  if (session && session.sessionId) {
    guardState.sessionId = session.sessionId;
  }

  if (iteration >= maxIterations) {
    var msg = '[iteration-guard] LIMIT REACHED: Run ' + runId + ' has reached the maximum of ' + maxIterations + ' iterations. Halting.';
    console.error(msg);
    guardState.status = 'limit_reached';
    writeGuardState(runId, guardState);
    process.exit(1);
  }

  if (iteration >= warnAt) {
    var warnMsg = '[iteration-guard] WARNING: Run ' + runId + ' is at ' + iteration + '/' + maxIterations + ' iterations (' + Math.round(percentage * 100) + '%). Approaching limit.';
    console.warn(warnMsg);
    guardState.status = 'warning';
    writeGuardState(runId, guardState);
    // Exit 0 with a warning — do not block execution yet
    process.exit(0);
  }

  guardState.status = 'ok';
  writeGuardState(runId, guardState);
  console.log('[iteration-guard] Iteration count is within safe limits. OK.');
  process.exit(0);
}

main();

#!/usr/bin/env node
'use strict';

/**
 * session-init.js
 * Codex lifecycle hook: initializes a babysitter session and stores the
 * session ID in .a5c/session.json relative to the repository root.
 */

const fs = require('fs');
const path = require('path');
const { runJson, supports } = require('../sdk-cli');

const REPO_ROOT = process.env.REPO_ROOT || path.resolve(__dirname, '..', '..');
const A5C_DIR = path.join(REPO_ROOT, '.a5c');
const SESSION_FILE = path.join(A5C_DIR, 'session.json');

function main() {
  // Ensure .a5c directory exists
  fs.mkdirSync(A5C_DIR, { recursive: true });

  if (!supports('session:init')) {
    const fallback = {
      sessionId: `compat-${Date.now()}`,
      createdAt: new Date().toISOString(),
      stateDir: A5C_DIR,
      mode: 'compat-core',
      reason: 'session:init unsupported or unavailable',
    };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(fallback, null, 2) + '\n', 'utf8');
    console.warn('[session-init] session:init unavailable; wrote compatibility session record.');
    process.exit(0);
  }

  const requestedSessionId = process.env.BABYSITTER_SESSION_ID || process.env.CODEX_SESSION_ID || `codex-${Date.now()}`;
  const result = runJson(
    ['session:init', '--session-id', requestedSessionId, '--state-dir', A5C_DIR, '--json'],
    { timeout: 15000 }
  );
  if (!result.ok) {
    console.error('[session-init] session:init failed:', result.stderr || result.stdout || `exit code ${result.exitCode}`);
    process.exit(1);
  }

  const sessionData = result.parsed || {};
  const resolvedSessionId = sessionData.sessionId || sessionData.id || sessionData.session_id;
  if (!resolvedSessionId) {
    console.error('[session-init] Could not extract session ID from babysitter output:', JSON.stringify(sessionData));
    process.exit(1);
  }

  const sessionRecord = {
    sessionId: resolvedSessionId,
    stateDir: A5C_DIR,
    createdAt: new Date().toISOString(),
    raw: sessionData,
  };

  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionRecord, null, 2) + '\n', 'utf8');
  console.log(`[session-init] Session initialized. ID: ${resolvedSessionId}`);
  console.log(`[session-init] Session data written to: ${SESSION_FILE}`);

  process.exit(0);
}

main();

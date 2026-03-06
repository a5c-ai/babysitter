#!/usr/bin/env node
'use strict';

/**
 * utils.js
 * Shared utilities for Codex lifecycle hooks.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.env.REPO_ROOT || path.resolve(__dirname, '..', '..');
const A5C_DIR = path.join(REPO_ROOT, '.a5c');

/**
 * Optionally read session context from .a5c/session.json.
 * @param {string} [repoRoot]
 * @returns {object|null}
 */
function readSessionContext(repoRoot) {
  const root = repoRoot || process.env.REPO_ROOT || process.cwd();
  const sessionPath = path.join(root, '.a5c', 'session.json');
  if (fs.existsSync(sessionPath)) {
    try {
      return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    } catch (_) {
      return null;
    }
  }
  return null;
}

/**
 * Resolves the current babysitter run ID.
 * Checks the BABYSITTER_RUN_ID environment variable first,
 * then falls back to reading .a5c/current-run.json.
 *
 * @param {string} [logPrefix='hook'] - Prefix used in warning messages.
 * @returns {string|null} The run ID, or null if not found.
 */
function getRunId(logPrefix) {
  const prefix = logPrefix || 'hook';

  if (process.env.BABYSITTER_RUN_ID) {
    return process.env.BABYSITTER_RUN_ID;
  }

  const currentRunFile = path.join(A5C_DIR, 'current-run.json');
  if (fs.existsSync(currentRunFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(currentRunFile, 'utf8'));
      return data.runId || data.id || data.run_id || null;
    } catch (err) {
      console.warn('[' + prefix + '] Could not parse current-run.json:', err.message);
    }
  }

  return null;
}

/**
 * Validates that a run ID contains only alphanumeric characters and hyphens
 * (ULID format). Prevents command injection when interpolated into shell commands.
 * @param {string} runId
 * @returns {boolean}
 */
function isValidRunId(runId) {
  return typeof runId === 'string' && /^[A-Za-z0-9-]+$/.test(runId);
}

module.exports = { getRunId, readSessionContext, isValidRunId };

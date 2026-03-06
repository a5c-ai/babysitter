'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runJson, supports } = require('./sdk-cli');

function runCli(args) {
  const command = args[0];
  if (String(command).startsWith('profile:') && !supports(command)) {
    return null;
  }
  const result = runJson(args, { timeout: 15000 });
  if (!result.ok) {
    const combined = `${result.stderr || ''}\n${result.stdout || ''}`;
    if (combined.includes('no_profile')) return null;
    return null;
  }
  return result.parsed || String(result.stdout || '').trim();
}

function writeTempJson(data) {
  const tmp = path.join(os.tmpdir(), `babysitter-profile-${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  return tmp;
}

/**
 * Read the user-level profile.
 * Returns parsed profile object, or null if no profile exists.
 */
function readUserProfile() {
  return runCli(['profile:read', '--user', '--json']);
}

/**
 * Read the project-level profile from the given project directory (or cwd).
 * Returns parsed profile object, or null if no profile exists.
 */
function readProjectProfile(projectDir) {
  const args = ['profile:read', '--project', '--json'];
  if (projectDir) args.push('--dir', projectDir);
  return runCli(args);
}

/**
 * Write (replace) the user-level profile with the given data object.
 * Writes data to a temp file and passes it via --input flag.
 */
function writeUserProfile(data) {
  const tmp = writeTempJson(data);
  try {
    return runCli(['profile:write', '--user', '--input', tmp, '--json']);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

/**
 * Write (replace) the project-level profile with the given data object.
 * Optionally scoped to a specific project directory.
 */
function writeProjectProfile(data, projectDir) {
  const tmp = writeTempJson(data);
  try {
    const args = ['profile:write', '--project', '--input', tmp, '--json'];
    if (projectDir) args.push('--dir', projectDir);
    return runCli(args);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

/**
 * Merge (patch) the user-level profile with the given partial data object.
 * Existing keys not present in data are preserved.
 */
function mergeUserProfile(data) {
  const tmp = writeTempJson(data);
  try {
    return runCli(['profile:merge', '--user', '--input', tmp, '--json']);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

/**
 * Merge (patch) the project-level profile with the given partial data object.
 * Optionally scoped to a specific project directory.
 */
function mergeProjectProfile(data, projectDir) {
  const tmp = writeTempJson(data);
  try {
    const args = ['profile:merge', '--project', '--input', tmp, '--json'];
    if (projectDir) args.push('--dir', projectDir);
    return runCli(args);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

/**
 * Render the user-level profile as human-readable markdown.
 */
function renderUserProfile() {
  return runCli(['profile:render', '--user']);
}

/**
 * Render the project-level profile as human-readable markdown.
 * Optionally scoped to a specific project directory.
 */
function renderProjectProfile(projectDir) {
  const args = ['profile:render', '--project'];
  if (projectDir) args.push('--dir', projectDir);
  return runCli(args);
}

module.exports = {
  readUserProfile,
  readProjectProfile,
  writeUserProfile,
  writeProjectProfile,
  mergeUserProfile,
  mergeProjectProfile,
  renderUserProfile,
  renderProjectProfile,
};

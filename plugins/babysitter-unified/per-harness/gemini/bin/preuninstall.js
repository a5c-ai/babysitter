#!/usr/bin/env node
'use strict';

/**
 * preuninstall hook — runs before `npm uninstall [-g] @a5c-ai/babysitter-gemini`.
 *
 * Delegates to `gemini extensions uninstall babysitter` so Gemini CLI handles
 * the removal natively. Falls back to manual removal if the CLI is not available.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const EXTENSION_NAME = 'babysitter'; // matches gemini-extension.json "name"

function getExtensionDir() {
  return path.join(os.homedir(), '.gemini', 'extensions', EXTENSION_NAME);
}

function isGeminiCliAvailable() {
  const result = spawnSync('gemini', ['--version'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: true,
    timeout: 10000,
  });
  return result.status === 0;
}

function main() {
  const extensionDir = getExtensionDir();

  if (!fs.existsSync(extensionDir)) {
    return;
  }

  // Don't remove linked extensions automatically — they point to a dev checkout
  try {
    if (fs.lstatSync(extensionDir).isSymbolicLink()) {
      console.log(`[babysitter] Skipping preuninstall: extension is linked (dev mode)`);
      console.log(`[babysitter] Remove the link manually: gemini extensions uninstall ${EXTENSION_NAME}`);
      return;
    }
  } catch {
    // Proceed
  }

  if (isGeminiCliAvailable()) {
    console.log(`[babysitter] Uninstalling extension via: gemini extensions uninstall ${EXTENSION_NAME}`);
    const result = spawnSync('gemini', ['extensions', 'uninstall', EXTENSION_NAME], {
      stdio: 'inherit',
      shell: true,
      timeout: 30000,
    });
    if (result.status === 0) {
      console.log('[babysitter] Extension removed via Gemini CLI.');
      return;
    }
    console.warn('[babysitter] gemini extensions uninstall failed, falling back to manual removal.');
  }

  // Fallback: manual removal
  try {
    fs.rmSync(extensionDir, { recursive: true, force: true });
    console.log(`[babysitter] Removed extension from ${extensionDir}`);
  } catch (err) {
    console.warn(`[babysitter] Warning: could not remove ${extensionDir}: ${err.message}`);
  }
}

main();

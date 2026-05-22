#!/usr/bin/env node
'use strict';

/**
 * postinstall hook — runs after `npm install [-g] @a5c-ai/babysitter-gemini`.
 *
 * When installed globally (the expected path), this delegates to
 * `gemini extensions install <package-root>` so Gemini CLI handles the
 * extension installation natively. Falls back to manual copy if the
 * `gemini` CLI is not available.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const EXTENSION_NAME = 'babysitter'; // matches gemini-extension.json "name"

function isGlobalInstall() {
  if (process.env.npm_config_global === 'true') return true;
  const globalPrefix = process.env.npm_config_prefix || '';
  if (globalPrefix && PACKAGE_ROOT.startsWith(globalPrefix)) return true;
  return false;
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

function isExtensionLinked() {
  const extensionDir = path.join(os.homedir(), '.gemini', 'extensions', EXTENSION_NAME);
  try {
    return fs.lstatSync(extensionDir).isSymbolicLink();
  } catch {
    return false;
  }
}

function main() {
  if (!isGlobalInstall()) {
    return;
  }

  // Don't overwrite a linked extension (dev mode)
  if (isExtensionLinked()) {
    console.log(`[babysitter] Skipping postinstall: extension is linked (dev mode)`);
    return;
  }

  if (!isGeminiCliAvailable()) {
    console.warn('[babysitter] Gemini CLI not found. Run `babysitter-gemini install` after installing Gemini CLI.');
    return;
  }

  console.log(`[babysitter] Installing extension via: gemini extensions install ${PACKAGE_ROOT}`);

  const result = spawnSync('gemini', ['extensions', 'install', PACKAGE_ROOT], {
    stdio: 'inherit',
    shell: true,
    timeout: 60000,
  });

  if (result.status === 0) {
    console.log('[babysitter] Extension installed via Gemini CLI. Restart Gemini CLI to activate.');
  } else {
    console.warn('[babysitter] Warning: gemini extensions install failed.');
    console.warn('[babysitter] Run `babysitter-gemini install` manually to complete setup.');
  }
}

main();

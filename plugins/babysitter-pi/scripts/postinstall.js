#!/usr/bin/env node
'use strict';

/**
 * postinstall.js — Runs after `npm install` or `omp plugin install`
 *
 * Checks prerequisites, creates state directory, prints success info.
 * Exits 0 even on non-critical failures to avoid blocking install.
 */

const fs = require('fs');
const path = require('path');

const MIN_NODE_MAJOR = 18;
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(PLUGIN_ROOT, 'state');

function log(msg) {
  console.log(`[babysitter-pi postinstall] ${msg}`);
}

function warn(msg) {
  console.warn(`[babysitter-pi postinstall] WARNING: ${msg}`);
}

function checkNodeVersion() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < MIN_NODE_MAJOR) {
    warn(
      `Node.js v${process.versions.node} detected. ` +
      `babysitter-pi requires Node.js >= ${MIN_NODE_MAJOR}. ` +
      `Some features may not work correctly.`
    );
    return false;
  }
  log(`Node.js v${process.versions.node} — OK`);
  return true;
}

function checkBabysitterSdk() {
  try {
    const sdk = require('@a5c-ai/babysitter-sdk');
    const sdkVersion = sdk.version || sdk.VERSION || 'unknown';
    log(`@a5c-ai/babysitter-sdk found (version: ${sdkVersion})`);
    return true;
  } catch (_err) {
    warn(
      '@a5c-ai/babysitter-sdk is not available. ' +
      'Install it with: npm install @a5c-ai/babysitter-sdk'
    );
    return false;
  }
}

function createStateDirectory() {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      log(`Created state directory: ${STATE_DIR}`);
    } else {
      log(`State directory already exists: ${STATE_DIR}`);
    }
    return true;
  } catch (err) {
    warn(`Failed to create state directory: ${err.message}`);
    return false;
  }
}

function getPluginVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')
    );
    return pkg.version || 'unknown';
  } catch (_err) {
    return 'unknown';
  }
}

function main() {
  log('Running post-install checks...');

  const nodeOk = checkNodeVersion();
  const sdkOk = checkBabysitterSdk();
  const stateOk = createStateDirectory();

  const version = getPluginVersion();

  console.log('');
  if (nodeOk && sdkOk && stateOk) {
    log(`babysitter-pi v${version} installed successfully.`);
  } else {
    log(
      `babysitter-pi v${version} installed with warnings (see above). ` +
      'The plugin may still work, but some features could be limited.'
    );
  }

  // Always exit 0 to avoid blocking the install pipeline
  process.exit(0);
}

main();

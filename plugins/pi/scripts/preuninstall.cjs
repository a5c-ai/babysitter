#!/usr/bin/env node
'use strict';

/**
 * preuninstall.js — Runs before uninstall
 *
 * Cleans up the state directory and prints a farewell message.
 * Exits 0 even on failure to avoid blocking uninstall.
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(PLUGIN_ROOT, 'state');

function log(msg) {
  console.log(`[babysitter-pi preuninstall] ${msg}`);
}

function warn(msg) {
  console.warn(`[babysitter-pi preuninstall] WARNING: ${msg}`);
}

function removeDirectoryRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      removeDirectoryRecursive(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dirPath);
}

function cleanupState() {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      log('No state directory found — nothing to clean up.');
      return true;
    }

    const entries = fs.readdirSync(STATE_DIR);
    if (entries.length === 0) {
      log('State directory is empty — removing.');
      fs.rmdirSync(STATE_DIR);
      return true;
    }

    log(`Cleaning up state directory (${entries.length} entries)...`);
    removeDirectoryRecursive(STATE_DIR);
    log('State directory removed.');
    return true;
  } catch (err) {
    warn(`Failed to clean up state directory: ${err.message}`);
    return false;
  }
}

function main() {
  log('Running pre-uninstall cleanup...');

  cleanupState();

  log('babysitter-pi cleanup complete. Goodbye.');

  // Always exit 0 to avoid blocking the uninstall pipeline
  process.exit(0);
}

main();

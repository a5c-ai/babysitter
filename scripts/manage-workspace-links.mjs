#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(repoRoot, 'node_modules');
const stashRoot = path.join(nodeModulesDir, '.workspace-stash');
const scopesToPrune = ['@a5c'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function moveDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  ensureDir(path.dirname(to));
  fs.renameSync(from, to);
}

function stash() {
  let changed = false;
  for (const scope of scopesToPrune) {
    const source = path.join(nodeModulesDir, scope);
    if (!fs.existsSync(source)) {
      continue;
    }
    const dest = path.join(stashRoot, scope);
    moveDir(source, dest);
    changed = true;
    console.log(`Stashed workspace directory ${scope}`);
  }
  if (!changed) {
    console.log('No workspace directories to stash.');
  }
}

function restore() {
  let changed = false;
  for (const scope of scopesToPrune) {
    const source = path.join(stashRoot, scope);
    if (!fs.existsSync(source)) {
      continue;
    }
    const dest = path.join(nodeModulesDir, scope);
    fs.rmSync(dest, { recursive: true, force: true });
    ensureDir(path.dirname(dest));
    fs.renameSync(source, dest);
    changed = true;
    console.log(`Restored workspace directory ${scope}`);
  }
  if (!changed) {
    console.log('No workspace directories to restore.');
  } else {
    try {
      fs.rmSync(stashRoot, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to clean stash directory: ${err.message}`);
    }
  }
}

const action = process.argv[2];
if (action === 'stash') {
  stash();
} else if (action === 'restore') {
  restore();
} else {
  console.error('Usage: manage-workspace-links.mjs <stash|restore>');
  process.exit(1);
}

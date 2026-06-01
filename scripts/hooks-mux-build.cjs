#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  'packages/atlas',
  'packages/hooks-mux/core',
  'packages/hooks-mux/cli',
  'packages/hooks-mux/adapter-claude',
  'packages/hooks-mux/adapter-codex',
  'packages/hooks-mux/adapter-gemini',
  'packages/hooks-mux/adapter-copilot',
  'packages/hooks-mux/adapter-cursor',
  'packages/hooks-mux/adapter-pi',
  'packages/hooks-mux/adapter-oh-my-pi',
  'packages/hooks-mux/adapter-opencode',
  'packages/hooks-mux/adapter-openclaw',
  'packages/hooks-mux/adapter-hermes',
];

const mode = process.argv[2] || 'build';

function runScript(dir, pkg, scriptName, label = scriptName) {
  console.log(`\n=== ${pkg} (${label}) ===`);
  try {
    execSync(`npm run ${scriptName}`, { cwd: dir, stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
}

if (mode === 'test') {
  for (const pkg of packages) {
    if (!pkg.startsWith('packages/hooks-mux/')) {
      continue;
    }
    const dir = path.resolve(__dirname, '..', pkg);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    if (manifest.scripts?.build) {
      runScript(dir, pkg, 'build', 'build');
    }
  }
}

for (const pkg of packages) {
  if (mode === 'test' && !pkg.startsWith('packages/hooks-mux/')) {
    console.log(`\n=== ${pkg} (${mode}) skipped: hooks-mux test mode only runs hooks packages ===`);
    continue;
  }
  const dir = path.resolve(__dirname, '..', pkg);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const scriptName = mode === 'lint' ? 'lint' : mode;
  if (!manifest.scripts?.[scriptName]) {
    console.log(`\n=== ${pkg} (${mode}) skipped: no ${scriptName} script ===`);
    continue;
  }
  runScript(dir, pkg, scriptName);
}

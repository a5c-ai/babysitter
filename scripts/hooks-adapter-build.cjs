#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  'packages/atlas',
  'packages/adapters/hooks/core',
  'packages/adapters/hooks/cli',
  'packages/adapters/hooks/adapter-claude',
  'packages/adapters/hooks/adapter-codex',
  'packages/adapters/hooks/adapter-gemini',
  'packages/adapters/hooks/adapter-copilot',
  'packages/adapters/hooks/adapter-cursor',
  'packages/adapters/hooks/adapter-pi',
  'packages/adapters/hooks/adapter-oh-my-pi',
  'packages/adapters/hooks/adapter-opencode',
  'packages/adapters/hooks/adapter-openclaw',
  'packages/adapters/hooks/adapter-hermes',
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
    if (!pkg.startsWith('packages/adapters/hooks/')) {
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
  if (mode === 'test' && !pkg.startsWith('packages/adapters/hooks/')) {
    console.log(`\n=== ${pkg} (${mode}) skipped: hooks-adapter test mode only runs hooks packages ===`);
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

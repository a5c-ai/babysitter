#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  'packages/atlas',
  'packages/agent-mux/hooks/core',
  'packages/agent-mux/hooks/cli',
  'packages/agent-mux/hooks/adapter-claude',
  'packages/agent-mux/hooks/adapter-codex',
  'packages/agent-mux/hooks/adapter-gemini',
  'packages/agent-mux/hooks/adapter-copilot',
  'packages/agent-mux/hooks/adapter-cursor',
  'packages/agent-mux/hooks/adapter-pi',
  'packages/agent-mux/hooks/adapter-oh-my-pi',
  'packages/agent-mux/hooks/adapter-opencode',
  'packages/agent-mux/hooks/adapter-openclaw',
  'packages/agent-mux/hooks/adapter-hermes',
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
    if (!pkg.startsWith('packages/agent-mux/hooks/')) {
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
  if (mode === 'test' && !pkg.startsWith('packages/agent-mux/hooks/')) {
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

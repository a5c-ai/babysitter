#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  'packages/agent-catalog',
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
];

const mode = process.argv[2] || 'build';

for (const pkg of packages) {
  const dir = path.resolve(__dirname, '..', pkg);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const scriptName = mode === 'lint' ? 'lint' : mode;
  if (!manifest.scripts?.[scriptName]) {
    console.log(`\n=== ${pkg} (${mode}) skipped: no ${scriptName} script ===`);
    continue;
  }
  console.log(`\n=== ${pkg} (${mode}) ===`);
  try {
    execSync(`npm run ${scriptName}`, { cwd: dir, stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
}

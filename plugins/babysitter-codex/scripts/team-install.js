#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const root = process.cwd();
  const lockPath = path.join(root, 'babysitter.lock.json');
  if (!fs.existsSync(lockPath)) {
    throw new Error(`missing lock file: ${lockPath}`);
  }
  const lock = readJson(lockPath);
  const verify = spawnSync(process.execPath, ['scripts/verify-content-manifest.js'], { stdio: 'inherit' });
  if (verify.status !== 0) process.exit(verify.status || 1);

  const outDir = path.join(root, '.a5c', 'team');
  fs.mkdirSync(outDir, { recursive: true });
  const installInfo = {
    installedAt: new Date().toISOString(),
    runtime: lock.runtime,
    content: lock.content,
    lockVersion: lock.version,
  };
  fs.writeFileSync(path.join(outDir, 'install.json'), JSON.stringify(installInfo, null, 2), 'utf8');

  const profilePath = path.join(outDir, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    fs.writeFileSync(profilePath, JSON.stringify({
      teamName: 'default',
      rulesLayer: 'config/rules/team/default.json',
      processLibraryRoot: 'upstream/babysitter/skills/babysit/process',
    }, null, 2), 'utf8');
  }

  console.log('[team-install] complete');
}

main();

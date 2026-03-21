#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const args = {
    workspace: process.cwd(),
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--workspace' && argv[i + 1]) {
      args.workspace = path.resolve(argv[++i]);
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    }
  }
  return args;
}

function main() {
  const packageRoot = path.resolve(__dirname, '..');
  const args = parseArgs(process.argv);
  const workspaceRoot = args.workspace;
  const lockPath = path.join(packageRoot, 'babysitter.lock.json');
  if (!fs.existsSync(lockPath)) {
    throw new Error(`missing lock file: ${lockPath}`);
  }
  const lock = readJson(lockPath);

  const verifyScript = path.join(packageRoot, 'scripts', 'verify-content-manifest.js');
  const verify = spawnSync(process.execPath, [verifyScript], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      BABYSITTER_PACKAGE_ROOT: packageRoot,
    },
  });
  if (verify.status !== 0) process.exit(verify.status || 1);

  const installInfo = {
    installedAt: new Date().toISOString(),
    runtime: lock.runtime,
    content: lock.content,
    lockVersion: lock.version,
    packageRoot,
    workspaceRoot,
    turnControllerCommand: 'babysitter-codex-turn',
    turnControllerScript: path.join(packageRoot, '.codex', 'turn-controller.js'),
    bundledProcessLibraryFallbackRoot: path.join(packageRoot, 'upstream', 'babysitter', 'skills', 'babysit', 'process'),
  };

  if (args.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      installInfo,
      rulesLayer: path.join(packageRoot, 'config', 'rules', 'team', 'default.json'),
    }, null, 2));
    return;
  }

  const outDir = path.join(workspaceRoot, '.a5c', 'team');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'install.json'), JSON.stringify(installInfo, null, 2), 'utf8');

  const profilePath = path.join(outDir, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    fs.writeFileSync(profilePath, JSON.stringify({
      teamName: 'default',
      installedSkillRoot: packageRoot,
      rulesLayer: path.join(packageRoot, 'config', 'rules', 'team', 'default.json'),
      turnControllerCommand: 'babysitter-codex-turn',
      turnControllerScript: path.join(packageRoot, '.codex', 'turn-controller.js'),
    }, null, 2), 'utf8');
  }

  console.log('[team-install] complete');
}

main();

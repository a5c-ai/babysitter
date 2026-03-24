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

function renderWorkspaceConfigToml() {
  return [
    'approval_policy = "on-request"',
    'sandbox_mode = "workspace-write"',
    'project_doc_max_bytes = 65536',
    '',
    '[sandbox_workspace_write]',
    'writable_roots = [".a5c", ".codex"]',
    '',
    '[features]',
    'codex_hooks = true',
    'multi_agent = true',
    '',
    '[agents]',
    'max_depth = 3',
    'max_threads = 4',
    '',
  ].join('\n');
}

function buildHooksConfig(packageRoot) {
  return {
    hooks: {
      SessionStart: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: path.join(packageRoot, '.codex', 'hooks', 'babysitter-session-start.sh'),
            },
          ],
        },
      ],
      UserPromptSubmit: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: path.join(packageRoot, '.codex', 'hooks', 'user-prompt-submit.sh'),
            },
          ],
        },
      ],
      Stop: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: path.join(packageRoot, '.codex', 'hooks', 'babysitter-stop-hook.sh'),
            },
          ],
        },
      ],
    },
  };
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

  const workspaceHooksConfigPath = path.join(workspaceRoot, '.codex', 'hooks.json');
  const workspaceConfigPath = path.join(workspaceRoot, '.codex', 'config.toml');
  const installInfo = {
    installedAt: new Date().toISOString(),
    runtime: lock.runtime,
    content: lock.content,
    lockVersion: lock.version,
    packageRoot,
    workspaceRoot,
    workspaceConfigPath,
    workspaceHooksConfigPath,
    hookScriptsRoot: path.join(packageRoot, '.codex', 'hooks'),
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
  fs.mkdirSync(path.dirname(workspaceHooksConfigPath), { recursive: true });
  fs.writeFileSync(workspaceHooksConfigPath, JSON.stringify(buildHooksConfig(packageRoot), null, 2), 'utf8');
  if (!fs.existsSync(workspaceConfigPath)) {
    fs.writeFileSync(workspaceConfigPath, renderWorkspaceConfigToml(), 'utf8');
  }
  fs.writeFileSync(path.join(outDir, 'install.json'), JSON.stringify(installInfo, null, 2), 'utf8');

  const profilePath = path.join(outDir, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    fs.writeFileSync(profilePath, JSON.stringify({
      teamName: 'default',
      installedSkillRoot: packageRoot,
      rulesLayer: path.join(packageRoot, 'config', 'rules', 'team', 'default.json'),
      workspaceConfigPath,
      workspaceHooksConfigPath,
      hookScriptsRoot: path.join(packageRoot, '.codex', 'hooks'),
    }, null, 2), 'utf8');
  }

  console.log('[team-install] complete');
}

main();

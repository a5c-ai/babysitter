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

function resolveSdkCli(packageRoot) {
  if (process.env.BABYSITTER_SDK_CLI) {
    return path.resolve(process.env.BABYSITTER_SDK_CLI);
  }
  try {
    return require.resolve('@a5c-ai/babysitter-sdk/dist/cli/main.js', {
      paths: [packageRoot],
    });
  } catch (error) {
    throw new Error(`could not resolve Babysitter SDK CLI entrypoint: ${error.message}`);
  }
}

function runBabysitterCli(packageRoot, cliArgs, options = {}) {
  const cliMain = resolveSdkCli(packageRoot);
  const result = spawnSync(process.execPath, [cliMain, ...cliArgs], {
    cwd: options.cwd || process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    throw new Error(
      `babysitter ${cliArgs.join(' ')} failed` +
      (stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ''),
    );
  }
  return result.stdout;
}

function resolveProcessLibrarySpec(lock, workspaceRoot) {
  const processLibraryConfig = (lock && lock.content && (lock.content.processLibrary || lock.content.upstream)) || {};
  const pluginPath = processLibraryConfig.path || 'plugins/babysitter';
  const repo = process.env.BABYSITTER_PROCESS_LIBRARY_REPO || processLibraryConfig.repo;
  if (!repo) {
    throw new Error('missing process-library repo configuration in babysitter.lock.json');
  }
  const ref = process.env.BABYSITTER_PROCESS_LIBRARY_REF || processLibraryConfig.ref || '';
  const cloneDir = path.join(workspaceRoot, '.a5c', 'process-library', 'babysitter-repo');
  const processSubpath = process.env.BABYSITTER_PROCESS_LIBRARY_SUBPATH ||
    processLibraryConfig.processSubpath ||
    path.posix.join(pluginPath.replace(/\\/g, '/'), 'skills', 'babysit', 'process');
  const referenceSubpath = process.env.BABYSITTER_PROCESS_LIBRARY_REFERENCE_SUBPATH ||
    processLibraryConfig.referenceSubpath ||
    path.posix.join(pluginPath.replace(/\\/g, '/'), 'skills', 'babysit', 'reference');
  return {
    repo,
    ref: ref || undefined,
    cloneDir,
    processRoot: path.join(cloneDir, ...processSubpath.split('/')),
    referenceRoot: path.join(cloneDir, ...referenceSubpath.split('/')),
    stateDir: path.join(workspaceRoot, '.a5c'),
  };
}

function ensureActiveProcessLibrary(packageRoot, lock, workspaceRoot, dryRun) {
  const spec = resolveProcessLibrarySpec(lock, workspaceRoot);
  const cloneExists = fs.existsSync(path.join(spec.cloneDir, '.git'));
  const cloneArgs = cloneExists
    ? ['process-library:update', '--dir', spec.cloneDir, '--json']
    : ['process-library:clone', '--repo', spec.repo, '--dir', spec.cloneDir, '--json'];
  if (spec.ref) {
    cloneArgs.splice(cloneExists ? 3 : 5, 0, '--ref', spec.ref);
  }
  const useArgs = ['process-library:use', '--dir', spec.processRoot, '--state-dir', spec.stateDir, '--json'];
  const activeArgs = ['process-library:active', '--state-dir', spec.stateDir, '--json'];

  if (dryRun) {
    return {
      ...spec,
      plannedCommands: [
        `babysitter ${cloneArgs.join(' ')}`,
        `babysitter ${useArgs.join(' ')}`,
        `babysitter ${activeArgs.join(' ')}`,
      ],
      activeStateFile: path.join(spec.stateDir, 'active', 'process-library.json'),
      binding: null,
    };
  }

  runBabysitterCli(packageRoot, cloneArgs, { cwd: workspaceRoot });
  if (!fs.existsSync(spec.processRoot)) {
    throw new Error(`fetched process library root is missing: ${spec.processRoot}`);
  }
  runBabysitterCli(packageRoot, useArgs, { cwd: workspaceRoot });
  const active = JSON.parse(runBabysitterCli(packageRoot, activeArgs, { cwd: workspaceRoot }));
  return {
    ...spec,
    plannedCommands: [],
    activeStateFile: active.stateFile,
    binding: active.binding || null,
  };
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
  const workspaceHooksConfigPath = path.join(workspaceRoot, '.codex', 'hooks.json');
  const workspaceConfigPath = path.join(workspaceRoot, '.codex', 'config.toml');
  const processLibrary = ensureActiveProcessLibrary(packageRoot, lock, workspaceRoot, args.dryRun);
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
    processLibraryRepo: processLibrary.repo,
    ...(processLibrary.ref ? { processLibraryRef: processLibrary.ref } : {}),
    processLibraryCloneDir: processLibrary.cloneDir,
    processLibraryRoot: processLibrary.processRoot,
    processLibraryReferenceRoot: processLibrary.referenceRoot,
    processLibraryStateFile: processLibrary.activeStateFile,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      installInfo,
      processLibrary: {
        repo: processLibrary.repo,
        ...(processLibrary.ref ? { ref: processLibrary.ref } : {}),
        cloneDir: processLibrary.cloneDir,
        processRoot: processLibrary.processRoot,
        referenceRoot: processLibrary.referenceRoot,
        stateFile: processLibrary.activeStateFile,
        plannedCommands: processLibrary.plannedCommands,
      },
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
      workspaceConfigPath,
      workspaceHooksConfigPath,
      hookScriptsRoot: path.join(packageRoot, '.codex', 'hooks'),
      processLibraryLookupCommand: 'babysitter process-library:active --state-dir .a5c --json',
    }, null, 2), 'utf8');
  }

  console.log('[team-install] complete');
}

main();

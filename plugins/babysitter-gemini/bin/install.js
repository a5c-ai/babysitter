#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const IS_WIN = process.platform === 'win32';
const EXTENSION_DIR_NAME = 'babysitter';
const INSTALL_ENTRIES = [
  { source: 'GEMINI.md', required: true },
  { source: 'commands', required: true },
  { source: 'hooks', required: true },
  { source: 'scripts', required: true },
  { source: 'gemini-extension.json', required: true },
  { source: 'versions.json', required: true },
];

function parseArgs(argv) {
  const args = { workspace: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--workspace' && argv[i + 1]) {
      args.workspace = path.resolve(argv[++i]);
    } else if (argv[i] === '--global') {
      args.workspace = null;
    } else {
      throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  return args;
}

function getGlobalStateDir() {
  if (process.env.BABYSITTER_GLOBAL_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR);
  }
  return path.join(os.homedir(), '.a5c');
}

function getExtensionRoot(workspace) {
  const base = workspace ? path.resolve(workspace) : os.homedir();
  return path.join(base, '.gemini', 'extensions', EXTENSION_DIR_NAME);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (['node_modules', '.git', 'test', '.gitignore'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function ensureExecutableHooks(hooksDir) {
  if (IS_WIN || !fs.existsSync(hooksDir)) return;
  for (const name of fs.readdirSync(hooksDir)) {
    const hookPath = path.join(hooksDir, name);
    if (name.endsWith('.sh') && fs.statSync(hookPath).isFile()) {
      fs.chmodSync(hookPath, 0o755);
    }
  }
}

function resolveBabysitterCommand(packageRoot) {
  if (process.env.BABYSITTER_SDK_CLI) {
    return {
      command: process.execPath,
      argsPrefix: [path.resolve(process.env.BABYSITTER_SDK_CLI)],
    };
  }
  try {
    return {
      command: process.execPath,
      argsPrefix: [
        require.resolve('@a5c-ai/babysitter-sdk/dist/cli/main.js', {
          paths: [packageRoot],
        }),
      ],
    };
  } catch {
    return {
      command: 'babysitter',
      argsPrefix: [],
    };
  }
}

function runBabysitterCli(packageRoot, cliArgs) {
  const resolved = resolveBabysitterCommand(packageRoot);
  const result = spawnSync(resolved.command, [...resolved.argsPrefix, ...cliArgs], {
    cwd: packageRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: process.env,
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

function ensureGlobalProcessLibrary() {
  const active = JSON.parse(
    runBabysitterCli(
      PACKAGE_ROOT,
      ['process-library:active', '--state-dir', getGlobalStateDir(), '--json'],
    ),
  );
  console.log(`[babysitter]   process library: ${active.binding?.dir}`);
}

function installEntry(extensionRoot, entry) {
  const src = path.join(PACKAGE_ROOT, entry.source);
  const dest = path.join(extensionRoot, entry.source);
  if (!fs.existsSync(src)) {
    if (entry.required) throw new Error(`required install payload is missing: ${src}`);
    return;
  }
  copyRecursive(src, dest);
  console.log(`[babysitter]   ${entry.source}${fs.statSync(src).isDirectory() ? '/' : ''}`);
}

function main() {
  const args = parseArgs(process.argv);
  const extensionRoot = getExtensionRoot(args.workspace);
  console.log(`[babysitter] Installing extension to ${extensionRoot}`);

  try {
    fs.rmSync(extensionRoot, { recursive: true, force: true });
    fs.mkdirSync(extensionRoot, { recursive: true });
    for (const entry of INSTALL_ENTRIES) {
      installEntry(extensionRoot, entry);
    }
    ensureExecutableHooks(path.join(extensionRoot, 'hooks'));
    ensureGlobalProcessLibrary();
    console.log('[babysitter] Installation complete!');
  } catch (err) {
    console.error(`[babysitter] Failed to install extension files: ${err.message}`);
    process.exitCode = 1;
  }
}

main();

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const INSTALL_ENTRIES = [
  { source: 'package.json', required: true },
  { source: 'extensions', required: true },
  { source: 'skills', required: true },
  { source: 'commands', required: true },
  { source: 'scripts', required: true },
];

function parseArgs(argv) {
  const args = {
    harness: 'pi',
    workspace: null,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--harness' && argv[i + 1]) {
      const value = String(argv[++i]).trim();
      if (value !== 'pi' && value !== 'oh-my-pi') {
        throw new Error(`unsupported harness: ${value}`);
      }
      args.harness = value;
    } else if (argv[i] === '--workspace' && argv[i + 1]) {
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

function getPluginRoot(args) {
  const base = args.workspace ? path.resolve(args.workspace) : os.homedir();
  const pluginsDir = args.harness === 'oh-my-pi'
    ? path.join(base, '.omp', 'plugins')
    : path.join(base, '.pi', 'plugins');
  return path.join(pluginsDir, 'babysitter-pi');
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (['node_modules', '.git', 'test', '.gitignore', 'state'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
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
  console.log(`[babysitter-pi]   process library: ${active.binding?.dir}`);
}

function installEntry(pluginRoot, entry) {
  const src = path.join(PACKAGE_ROOT, entry.source);
  const dest = path.join(pluginRoot, entry.source);
  if (!fs.existsSync(src)) {
    if (entry.required) throw new Error(`required install payload is missing: ${src}`);
    return;
  }
  copyRecursive(src, dest);
  console.log(`[babysitter-pi]   ${entry.source}${fs.statSync(src).isDirectory() ? '/' : ''}`);
}

function main() {
  const args = parseArgs(process.argv);
  const pluginRoot = getPluginRoot(args);
  console.log(`[babysitter-pi] Installing ${args.harness} plugin to ${pluginRoot}`);

  try {
    fs.rmSync(pluginRoot, { recursive: true, force: true });
    fs.mkdirSync(pluginRoot, { recursive: true });
    for (const entry of INSTALL_ENTRIES) {
      installEntry(pluginRoot, entry);
    }
    fs.mkdirSync(path.join(pluginRoot, 'state'), { recursive: true });
    ensureGlobalProcessLibrary();
    console.log('[babysitter-pi] Installation complete!');
  } catch (err) {
    console.error(`[babysitter-pi] Failed to install plugin files: ${err.message}`);
    process.exitCode = 1;
  }
}

main();

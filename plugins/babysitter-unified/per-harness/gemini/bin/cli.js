#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PLUGIN_NAME = 'babysitter-gemini';
const EXTENSION_NAME = 'babysitter'; // matches gemini-extension.json "name"
const EXTENSION_DIR_NAME = 'babysitter-gemini';

const REPO_DIR = path.join(os.homedir(), '.a5c', 'babysitter-repo');
const PLUGIN_RELATIVE_PATH = path.join('plugins', 'babysitter-gemini');
const PLUGIN_SOURCE_PATH = path.join(REPO_DIR, PLUGIN_RELATIVE_PATH);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function printUsage() {
  console.log([
    `${PLUGIN_NAME} - Babysitter plugin for Gemini CLI`,
    '',
    'Usage:',
    `  ${PLUGIN_NAME} install                        Install (or update) via git clone/pull to ~/.a5c/babysitter-repo`,
    `                                                and gemini extensions link.`,
    `  ${PLUGIN_NAME} uninstall                      Uninstall via: gemini extensions uninstall ${EXTENSION_NAME}`,
    `  ${PLUGIN_NAME} status                         Check installation status`,
    `  ${PLUGIN_NAME} version                        Show version info`,
    `  ${PLUGIN_NAME} help                           Show this message`,
    '',
    'Installation clones/pulls the repository and links it via `gemini extensions link`.',
    'The Gemini CLI must be installed for install/uninstall to work.',
    '',
    'The plugin provides:',
    '  - GEMINI.md context file for orchestration instructions',
    '  - SessionStart hook for session initialization',
    '  - AfterAgent hook for continuation loop',
    '  - Command definitions for all babysitter workflows',
  ].join('\n'));
}

function getGitRemoteUrl() {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], {
    cwd: PACKAGE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: true,
  });
  if (result.status === 0) {
    return result.stdout.trim();
  }
  return 'https://github.com/a5c-ai/babysitter.git';
}

function getVersions() {
  try {
    const versionsPath = fs.existsSync(PLUGIN_SOURCE_PATH)
      ? path.join(PLUGIN_SOURCE_PATH, 'versions.json')
      : path.join(PACKAGE_ROOT, 'versions.json');
    return JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
  } catch {
    return { sdkVersion: 'unknown', extensionVersion: 'unknown' };
  }
}

function getExtensionDir() {
  if (process.env.GEMINI_EXTENSION_PATH) {
    return path.resolve(process.env.GEMINI_EXTENSION_PATH);
  }
  return path.join(os.homedir(), '.gemini', 'extensions', EXTENSION_DIR_NAME);
}

function isGeminiCliAvailable() {
  const result = spawnSync('gemini', ['--version'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: true,
    timeout: 10000,
  });
  return result.status === 0;
}

function requireGeminiCli() {
  if (!isGeminiCliAvailable()) {
    console.error('[babysitter] Error: Gemini CLI is not installed or not in PATH.');
    console.error('[babysitter] Install it first: https://github.com/google-gemini/gemini-cli');
    process.exitCode = 1;
    return false;
  }
  return true;
}

function removePath(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function ensureParentDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function copyRecursive(sourcePath, targetPath) {
  const stat = fs.lstatSync(sourcePath);
  if (stat.isSymbolicLink()) {
    ensureParentDir(targetPath);
    const linkTarget = fs.readlinkSync(sourcePath);
    fs.symlinkSync(linkTarget, targetPath);
    return;
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(targetPath, { recursive: true });
    for (const entry of fs.readdirSync(sourcePath)) {
      copyRecursive(path.join(sourcePath, entry), path.join(targetPath, entry));
    }
    return;
  }
  ensureParentDir(targetPath);
  fs.copyFileSync(sourcePath, targetPath);
}

function installWithoutGeminiCli(useLink) {
  const extensionDir = getExtensionDir();
  removePath(extensionDir);
  ensureParentDir(extensionDir);

  if (useLink) {
    fs.symlinkSync(PACKAGE_ROOT, extensionDir, process.platform === 'win32' ? 'junction' : 'dir');
    console.log(`[babysitter] Gemini CLI not found. Linked extension bundle to ${extensionDir}`);
  } else {
    copyRecursive(PACKAGE_ROOT, extensionDir);
    console.log(`[babysitter] Gemini CLI not found. Copied extension bundle to ${extensionDir}`);
  }
}

function resolveBabysitterCommand() {
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
          paths: [PACKAGE_ROOT],
        }),
      ],
    };
  } catch {
    return { command: 'babysitter', argsPrefix: [] };
  }
}

function runBabysitterCli(cliArgs) {
  const resolved = resolveBabysitterCommand();
  const result = spawnSync(resolved.command, [...resolved.argsPrefix, ...cliArgs], {
    cwd: PACKAGE_ROOT,
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

function getGlobalStateDir() {
  if (process.env.BABYSITTER_GLOBAL_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR);
  }
  return path.join(os.homedir(), '.a5c');
}

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

function install() {
  const gitUrl = getGitRemoteUrl();

  console.log(`[babysitter] Target repository directory: ${REPO_DIR}`);

  if (fs.existsSync(REPO_DIR)) {
    console.log(`[babysitter] Repository directory exists. Running git pull...`);
    const pullResult = spawnSync('git', ['pull'], {
      cwd: REPO_DIR,
      stdio: 'inherit',
      shell: true,
    });
    if (pullResult.status !== 0) {
      console.error(`[babysitter] git pull failed (exit ${pullResult.status}).`);
      process.exitCode = 1;
      return;
    }
  } else {
    console.log(`[babysitter] Repository directory does not exist. Running git clone ${gitUrl}...`);
    fs.mkdirSync(path.dirname(REPO_DIR), { recursive: true });
    const cloneResult = spawnSync('git', ['clone', gitUrl, REPO_DIR], {
      stdio: 'inherit',
      shell: true,
    });
    if (cloneResult.status !== 0) {
      console.error(`[babysitter] git clone failed (exit ${cloneResult.status}).`);
      process.exitCode = 1;
      return;
    }
  }

  if (isGeminiCliAvailable()) {
    console.log(`[babysitter] Running: gemini extensions link ${PLUGIN_SOURCE_PATH}`);

    const result = spawnSync('gemini', ['extensions', 'link', PLUGIN_SOURCE_PATH], {
      stdio: 'inherit',
      shell: true,
      timeout: 60000,
    });

    if (result.status !== 0) {
      console.error(`[babysitter] gemini extensions link failed (exit ${result.status}).`);
      process.exitCode = 1;
      return;
    }

    console.log('[babysitter] Extension linked.');
  } else {
    console.log('[babysitter] Gemini CLI is not installed or not in PATH. Installing extension bundle directly.');
    installWithoutGeminiCli(true);
  }

  installSdk();
  ensureProcessLibrary();

  console.log('');
  console.log('[babysitter] Installation complete! Restart Gemini CLI to activate.');
}

function installSdk() {
  const versions = getVersions();
  if (!versions.sdkVersion || versions.sdkVersion === 'unknown') return;

  console.log(`[babysitter] Ensuring babysitter SDK (${versions.sdkVersion}) is available...`);
  const result = spawnSync('npm', ['i', '-g', `@a5c-ai/babysitter-sdk@${versions.sdkVersion}`, '--loglevel=error'], {
    stdio: 'inherit',
    shell: true,
  });
  if (result.status === 0) {
    console.log('[babysitter] SDK installed successfully.');
  } else {
    console.log('[babysitter] SDK global install failed — the SessionStart hook will attempt install on first use.');
  }
}

function ensureProcessLibrary() {
  try {
    const raw = runBabysitterCli(['process-library:active', '--state-dir', getGlobalStateDir(), '--json']);
    const active = JSON.parse(raw);
    if (active.binding?.dir) {
      console.log(`[babysitter]   process library: ${active.binding.dir}`);
    }
    if (active.defaultSpec?.cloneDir) {
      console.log(`[babysitter]   process library clone: ${active.defaultSpec.cloneDir}`);
    }
  } catch {
    // Process library bootstrap is best-effort
    console.log('[babysitter] Process library bootstrap skipped (babysitter CLI not available yet).');
  }
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

function uninstall() {
  if (isGeminiCliAvailable()) {
    console.log(`[babysitter] Running: gemini extensions uninstall ${EXTENSION_NAME}`);

    const result = spawnSync('gemini', ['extensions', 'uninstall', EXTENSION_NAME], {
      stdio: 'inherit',
      shell: true,
      timeout: 30000,
    });

    if (result.status !== 0) {
      console.error(`[babysitter] gemini extensions uninstall failed (exit ${result.status}).`);
      process.exitCode = 1;
      return;
    }
  } else {
    removePath(getExtensionDir());
    console.log(`[babysitter] Gemini CLI not found. Removed extension bundle from ${getExtensionDir()}.`);
  }

  console.log('[babysitter] Extension removed. Restart Gemini CLI to complete uninstallation.');
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

function status() {
  const extensionDir = getExtensionDir();
  const exists = fs.existsSync(extensionDir);
  let symlinked = false;
  try {
    symlinked = fs.lstatSync(extensionDir).isSymbolicLink();
  } catch {
    // Does not exist
  }

  console.log(`Extension directory: ${extensionDir}`);
  console.log(`Installed: ${exists ? 'yes' : 'no'}`);

  if (symlinked) {
    const target = fs.readlinkSync(extensionDir);
    console.log(`Mode: linked -> ${target}`);
  } else if (exists) {
    console.log('Mode: installed (copy)');
  }

  if (exists) {
    const extManifest = path.join(extensionDir, 'gemini-extension.json');
    const pluginManifest = path.join(extensionDir, 'plugin.json');
    const versionsFile = path.join(extensionDir, 'versions.json');
    const geminiMd = path.join(extensionDir, 'GEMINI.md');
    const hooksDir = path.join(extensionDir, 'hooks');

    console.log(`gemini-extension.json: ${fs.existsSync(extManifest) ? 'present' : 'MISSING'}`);
    console.log(`plugin.json: ${fs.existsSync(pluginManifest) ? 'present' : 'MISSING'}`);
    console.log(`versions.json: ${fs.existsSync(versionsFile) ? 'present' : 'MISSING'}`);
    console.log(`GEMINI.md: ${fs.existsSync(geminiMd) ? 'present' : 'MISSING'}`);
    console.log(`hooks/: ${fs.existsSync(hooksDir) ? 'present' : 'MISSING'}`);

    if (fs.existsSync(versionsFile)) {
      try {
        const v = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
        console.log(`SDK version: ${v.sdkVersion || 'unknown'}`);
        console.log(`Extension version: ${v.extensionVersion || 'unknown'}`);
      } catch {
        console.log('versions.json: unreadable');
      }
    }
  }

  // Check CLIs
  const geminiCheck = spawnSync('gemini', ['--version'], {
    stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', shell: true,
  });
  console.log(`gemini CLI: ${geminiCheck.status === 0 ? geminiCheck.stdout.trim() : 'not found'}`);

  const cliCheck = spawnSync('babysitter', ['--version'], {
    stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', shell: true,
  });
  console.log(`babysitter CLI: ${cliCheck.status === 0 ? cliCheck.stdout.trim() : 'not found'}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printUsage();
    process.exitCode = command ? 0 : 1;
    return;
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    const versions = getVersions();
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    console.log(`${pkg.name}: ${pkg.version}`);
    console.log(`extension: ${versions.extensionVersion || 'unknown'}`);
    console.log(`sdk: ${versions.sdkVersion || 'unknown'}`);
    return;
  }

  if (command === 'install') {
    install();
    return;
  }

  if (command === 'uninstall') {
    uninstall();
    return;
  }

  if (command === 'status') {
    status();
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exitCode = 1;
}

main();

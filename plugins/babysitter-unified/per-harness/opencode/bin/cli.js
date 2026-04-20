#!/usr/bin/env node
'use strict';

/**
 * Babysitter OpenCode CLI shim.
 *
 * Provides `babysitter-opencode` command for plugin management tasks
 * (install, uninstall, sync, doctor). Delegates heavy lifting to the
 * SDK CLI with opencode-specific flags.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function printUsage() {
  console.log([
    'babysitter-opencode - Babysitter plugin for OpenCode',
    '',
    'Usage:',
    '  babysitter-opencode install [--global]            Install plugin globally',
    '  babysitter-opencode install --workspace [path]    Install into workspace',
    '  babysitter-opencode uninstall [--global]          Uninstall plugin globally',
    '  babysitter-opencode uninstall --workspace [path]  Uninstall from workspace',
    '  babysitter-opencode sync                          Sync command surfaces',
    '  babysitter-opencode doctor                        Check installation health',
    '  babysitter-opencode version                       Show version',
    '  babysitter-opencode help                          Show this help',
  ].join('\n'));
}

function parseArgs(argv) {
  let workspace = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--workspace') {
      const next = argv[i + 1];
      workspace = next && !next.startsWith('-') ? path.resolve(next) : process.cwd();
      if (next && !next.startsWith('-')) {
        i += 1;
      }
      continue;
    }
    if (arg === '--global') {
      workspace = null;
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }

  return { workspace };
}

function runNodeScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  process.exitCode = result.status ?? 1;
}

function runDoctor(workspace) {
  const fs = require('fs');
  const { getOpenCodeHome, getHomePluginRoot } = require('./install-shared.cjs');

  const ws = workspace || process.cwd();
  const openCodeHome = getOpenCodeHome(ws);
  const pluginRoot = getHomePluginRoot(ws);
  let ok = true;

  console.log('[babysitter] OpenCode plugin health check');
  console.log(`  Workspace:   ${ws}`);
  console.log(`  OpenCode:    ${openCodeHome}`);
  console.log(`  Plugin root: ${pluginRoot}`);
  console.log('');

  // Check plugin directory
  if (fs.existsSync(pluginRoot)) {
    console.log('  [ok] Plugin directory exists');
  } else {
    console.log('  [FAIL] Plugin directory missing');
    ok = false;
  }

  // Check index.js
  const indexPath = path.join(pluginRoot, 'index.js');
  if (fs.existsSync(indexPath)) {
    console.log('  [ok] index.js entry point exists');
  } else {
    console.log('  [FAIL] index.js entry point missing');
    ok = false;
  }

  // Check plugin.json
  const pluginJsonPath = path.join(pluginRoot, 'plugin.json');
  if (fs.existsSync(pluginJsonPath)) {
    console.log('  [ok] plugin.json exists');
  } else {
    console.log('  [FAIL] plugin.json missing');
    ok = false;
  }

  // Check hooks
  const hooksDir = path.join(pluginRoot, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hooks = fs.readdirSync(hooksDir).filter((f) => f.endsWith('.js'));
    console.log(`  [ok] hooks/ directory (${hooks.length} scripts)`);
  } else {
    console.log('  [FAIL] hooks/ directory missing');
    ok = false;
  }

  // Check skills
  const skillPath = path.join(pluginRoot, 'skills', 'babysit', 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    console.log('  [ok] skills/babysit/SKILL.md exists');
  } else {
    console.log('  [WARN] skills/babysit/SKILL.md missing');
  }

  // Check babysitter CLI availability
  const { spawnSync: spawn } = require('child_process');
  const cliCheck = spawn('babysitter', ['--version'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  if (cliCheck.status === 0) {
    console.log(`  [ok] babysitter CLI: ${(cliCheck.stdout || '').trim()}`);
  } else {
    console.log('  [WARN] babysitter CLI not found in PATH');
  }

  console.log('');
  if (ok) {
    console.log('  All checks passed.');
  } else {
    console.log('  Some checks failed. Run "babysitter-opencode install" to fix.');
    process.exitCode = 1;
  }
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printUsage();
    process.exitCode = command ? 0 : 1;
    return;
  }

  switch (command) {
    case 'install':
    case 'uninstall': {
      const parsed = parseArgs(rest);
      const args = parsed.workspace ? ['--workspace', parsed.workspace] : ['--global'];
      runNodeScript(path.join(PACKAGE_ROOT, 'bin', `${command}.cjs`), args);
      break;
    }
    case 'sync': {
      const syncScript = path.join(PACKAGE_ROOT, 'scripts', 'sync-command-surfaces.js');
      const fs = require('fs');
      if (fs.existsSync(syncScript)) {
        runNodeScript(syncScript, rest);
      } else {
        console.error('[babysitter] sync-command-surfaces.js not found');
        process.exitCode = 1;
      }
      break;
    }
    case 'doctor': {
      const parsed = parseArgs(rest);
      runDoctor(parsed.workspace);
      break;
    }
    case 'version': {
      try {
        const pkg = require(path.join(PACKAGE_ROOT, 'package.json'));
        console.log(pkg.version);
      } catch {
        console.log('unknown');
      }
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exitCode = 1;
      break;
  }
}

main();

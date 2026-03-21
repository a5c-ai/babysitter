#!/usr/bin/env node
'use strict';

/**
 * postinstall.js — Copies babysitter-codex skill files to ~/.codex/skills/
 * so Codex CLI discovers the skill globally for all projects.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'babysitter-codex';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const IS_WIN = process.platform === 'win32';
const INSTALL_ENTRIES = [
  { source: 'SKILL.md', required: true },
  { source: 'AGENTS.md', required: true },
  { source: 'README.md', required: true },
  { source: 'agents', required: true },
  { source: 'bin', required: true },
  { source: '.codex', required: true },
  { source: 'commands', required: true },
  { source: 'config', required: true },
  { source: 'docs', required: true },
  { source: 'scripts', required: true },
  { source: 'upstream', required: true },
  { source: 'babysitter.lock.json', required: true },
];

function getCodexHome() {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  return path.join(os.homedir(), '.codex');
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      // Skip node_modules, .a5c, .git, and test directories
      if (['node_modules', '.a5c', '.git', 'test', '.gitignore'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    // Codex requires SKILL.md frontmatter to begin exactly with "---".
    // Strip UTF-8 BOM if present to avoid loader parse failures.
    if (path.basename(src) === 'SKILL.md') {
      const file = fs.readFileSync(src);
      const hasBom = file.length >= 3 && file[0] === 0xef && file[1] === 0xbb && file[2] === 0xbf;
      fs.writeFileSync(dest, hasBom ? file.subarray(3) : file);
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

function installEntry(skillDir, entry) {
  const src = path.join(PACKAGE_ROOT, entry.source);
  const dest = path.join(skillDir, entry.source);
  if (!fs.existsSync(src)) {
    if (entry.required) {
      throw new Error(`required install payload is missing: ${src}`);
    }
    return false;
  }
  copyRecursive(src, dest);
  console.log(`[babysitter-codex]   ${entry.source}${fs.statSync(src).isDirectory() ? '/' : ''}`);
  return true;
}

function verifyInstalledPayload(skillDir) {
  const missing = INSTALL_ENTRIES
    .map((entry) => entry.source)
    .filter((source) => !fs.existsSync(path.join(skillDir, source)));
  if (missing.length > 0) {
    throw new Error(`installed skill is incomplete; missing: ${missing.join(', ')}`);
  }
}

function main() {
  const codexHome = getCodexHome();
  const skillDir = path.join(codexHome, 'skills', SKILL_NAME);

  console.log(`[babysitter-codex] Installing skill to ${skillDir}`);

  try {
    fs.mkdirSync(skillDir, { recursive: true });

    for (const entry of INSTALL_ENTRIES) {
      installEntry(skillDir, entry);
    }

    verifyInstalledPayload(skillDir);

    if (!IS_WIN) {
      const hookDir = path.join(skillDir, '.codex', 'hooks');
      if (fs.existsSync(hookDir)) {
        for (const name of fs.readdirSync(hookDir)) {
          const hookPath = path.join(hookDir, name);
          if (name.endsWith('.sh') && fs.statSync(hookPath).isFile()) {
            fs.chmodSync(hookPath, 0o755);
          }
        }
        console.log('[babysitter-codex]   +x hooks/*.sh');
      }
    }

    console.log('[babysitter-codex] Installation complete!');
    console.log('[babysitter-codex] Restart Codex to pick up the new skill.');
  } catch (err) {
    console.error(`[babysitter-codex] Failed to install skill files: ${err.message}`);
    process.exitCode = 1;
  }
}

main();

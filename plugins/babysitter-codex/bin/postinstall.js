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
    fs.copyFileSync(src, dest);
  }
}

function main() {
  const codexHome = getCodexHome();
  const skillDir = path.join(codexHome, 'skills', SKILL_NAME);

  console.log(`[babysitter-codex] Installing skill to ${skillDir}`);

  try {
    // Create the skill directory
    fs.mkdirSync(skillDir, { recursive: true });

    // Copy SKILL.md (required entry point)
    const skillMd = path.join(PACKAGE_ROOT, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      fs.copyFileSync(skillMd, path.join(skillDir, 'SKILL.md'));
      console.log('[babysitter-codex]   SKILL.md');
    }

    // Copy agents/ directory
    const agentsDir = path.join(PACKAGE_ROOT, 'agents');
    if (fs.existsSync(agentsDir)) {
      copyRecursive(agentsDir, path.join(skillDir, 'agents'));
      console.log('[babysitter-codex]   agents/');
    }

    // Copy .codex/ directory (runtime modules, skills, hooks)
    const codexDir = path.join(PACKAGE_ROOT, '.codex');
    if (fs.existsSync(codexDir)) {
      copyRecursive(codexDir, path.join(skillDir, '.codex'));
      console.log('[babysitter-codex]   .codex/');
    }

    console.log('[babysitter-codex] Installation complete!');
    console.log('[babysitter-codex] Restart Codex to pick up the new skill.');
  } catch (err) {
    // Non-fatal: don't break npm install if skill copy fails
    console.warn(`[babysitter-codex] Warning: Could not install skill files: ${err.message}`);
    console.warn('[babysitter-codex] You can manually copy files to ~/.codex/skills/babysitter-codex/');
  }
}

main();

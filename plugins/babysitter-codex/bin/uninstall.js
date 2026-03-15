#!/usr/bin/env node
'use strict';

/**
 * uninstall.js — Removes babysitter-codex skill files from ~/.codex/skills/
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'babysitter-codex';

function getCodexHome() {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  return path.join(os.homedir(), '.codex');
}

function main() {
  const codexHome = getCodexHome();
  const skillDir = path.join(codexHome, 'skills', SKILL_NAME);

  if (!fs.existsSync(skillDir)) {
    console.log('[babysitter-codex] Skill directory not found, nothing to remove.');
    return;
  }

  try {
    fs.rmSync(skillDir, { recursive: true, force: true });
    console.log(`[babysitter-codex] Removed ${skillDir}`);
    console.log('[babysitter-codex] Restart Codex to complete uninstallation.');
  } catch (err) {
    console.warn(`[babysitter-codex] Warning: Could not remove skill directory: ${err.message}`);
  }
}

main();

#!/usr/bin/env node
'use strict';

/**
 * uninstall.js
 *
 * Removes the globally installed Codex Babysitter skill and its optional
 * prompt alias. The globally cloned process library is intentionally kept.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAMES = ['babysit', 'babysitter-codex'];
const PROMPT_NAMES = [
  'assimilate.md',
  'call.md',
  'doctor.md',
  'forever.md',
  'help.md',
  'issue.md',
  'model.md',
  'observe.md',
  'plan.md',
  'project-install.md',
  'resume.md',
  'retrospect.md',
  'team-install.md',
  'user-install.md',
  'yolo.md',
  'babysit.md',
];
const HOOK_SCRIPT_NAMES = [
  'babysitter-session-start.sh',
  'babysitter-stop-hook.sh',
  'user-prompt-submit.sh',
];

function getCodexHome() {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  return path.join(os.homedir(), '.codex');
}

function main() {
  const codexHome = getCodexHome();
  let removedAny = false;

  for (const skillName of SKILL_NAMES) {
    const skillDir = path.join(codexHome, 'skills', skillName);
    if (!fs.existsSync(skillDir)) {
      continue;
    }
    try {
      fs.rmSync(skillDir, { recursive: true, force: true });
      console.log(`[babysitter-codex] Removed ${skillDir}`);
      removedAny = true;
    } catch (err) {
      console.warn(`[babysitter-codex] Warning: Could not remove skill directory ${skillDir}: ${err.message}`);
    }
  }

  for (const promptName of PROMPT_NAMES) {
    const promptPath = path.join(codexHome, 'prompts', promptName);
    if (!fs.existsSync(promptPath)) {
      continue;
    }
    try {
      fs.rmSync(promptPath, { force: true });
      console.log(`[babysitter-codex] Removed ${promptPath}`);
      removedAny = true;
    } catch (err) {
      console.warn(`[babysitter-codex] Warning: Could not remove prompt ${promptPath}: ${err.message}`);
    }
  }

  for (const hookName of HOOK_SCRIPT_NAMES) {
    const hookPath = path.join(codexHome, 'hooks', hookName);
    if (!fs.existsSync(hookPath)) {
      continue;
    }
    try {
      fs.rmSync(hookPath, { force: true });
      console.log(`[babysitter-codex] Removed ${hookPath}`);
      removedAny = true;
    } catch (err) {
      console.warn(`[babysitter-codex] Warning: Could not remove hook script ${hookPath}: ${err.message}`);
    }
  }

  const hooksConfigPath = path.join(codexHome, 'hooks.json');
  if (fs.existsSync(hooksConfigPath)) {
    try {
      fs.rmSync(hooksConfigPath, { force: true });
      console.log(`[babysitter-codex] Removed ${hooksConfigPath}`);
      removedAny = true;
    } catch (err) {
      console.warn(`[babysitter-codex] Warning: Could not remove hook config ${hooksConfigPath}: ${err.message}`);
    }
  }

  const hooksDir = path.join(codexHome, 'hooks');
  if (fs.existsSync(hooksDir)) {
    try {
      if (fs.readdirSync(hooksDir).length === 0) {
        fs.rmSync(hooksDir, { recursive: true, force: true });
        console.log(`[babysitter-codex] Removed ${hooksDir}`);
      }
    } catch (err) {
      console.warn(`[babysitter-codex] Warning: Could not clean hook directory ${hooksDir}: ${err.message}`);
    }
  }

  if (!removedAny) {
    console.log('[babysitter-codex] Skill directory not found, nothing to remove.');
    return;
  }

  console.log('[babysitter-codex] Restart Codex to complete uninstallation.');
}

main();

'use strict';

const fs = require('fs');
const path = require('path');
const {
  listDirectories,
  reportCheckResult,
  syncSkillsFromCommands,
} = require('../../../scripts/plugin-command-sync-lib.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const COMMANDS_ROOT = path.join(REPO_ROOT, 'plugins', 'babysitter', 'commands');
const SKILLS_ROOT = path.join(PACKAGE_ROOT, 'skills');
const LABEL = 'babysitter-codex sync';

function getCommandBackedSkillNames() {
  return listDirectories(SKILLS_ROOT)
    .filter((name) => fs.existsSync(path.join(COMMANDS_ROOT, `${name}.md`)));
}

function main() {
  const result = syncSkillsFromCommands({
    label: LABEL,
    sourceRoot: COMMANDS_ROOT,
    skillsRoot: SKILLS_ROOT,
    names: getCommandBackedSkillNames(),
    check: process.argv.includes('--check'),
    cwd: PACKAGE_ROOT,
  });

  if (process.argv.includes('--check')) {
    reportCheckResult(LABEL, result.stale);
    return;
  }

  if (result.updated === 0) {
    console.log(`[${LABEL}] no Codex skill changes were needed.`);
    return;
  }

  console.log(`[${LABEL}] updated ${result.updated} Codex skill file(s).`);
}

main();

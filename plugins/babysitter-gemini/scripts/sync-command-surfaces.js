'use strict';

const path = require('path');
const {
  listDirectories,
  listMarkdownBasenames,
  reportCheckResult,
  syncCommandMirrors,
  syncSkillsFromCommands,
} = require('../../../scripts/plugin-command-sync-lib.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const ROOT_COMMANDS = path.join(REPO_ROOT, 'plugins', 'babysitter', 'commands');
const PLUGIN_COMMANDS = path.join(PACKAGE_ROOT, 'commands');
const PLUGIN_SKILLS = path.join(PACKAGE_ROOT, 'skills');
const LABEL = 'babysitter-gemini sync';

function getMirroredCommandNames() {
  const local = new Set(listMarkdownBasenames(PLUGIN_COMMANDS));
  return listMarkdownBasenames(ROOT_COMMANDS).filter((name) => local.has(name));
}

function getDerivedSkillNames() {
  const local = new Set(listDirectories(PLUGIN_SKILLS));
  return listMarkdownBasenames(PLUGIN_COMMANDS).filter((name) => local.has(name));
}

function main() {
  const check = process.argv.includes('--check');
  const mirrorResult = syncCommandMirrors({
    label: LABEL,
    sourceRoot: ROOT_COMMANDS,
    targetRoot: PLUGIN_COMMANDS,
    names: getMirroredCommandNames(),
    check,
    cwd: PACKAGE_ROOT,
  });
  const skillsResult = syncSkillsFromCommands({
    label: LABEL,
    sourceRoot: PLUGIN_COMMANDS,
    skillsRoot: PLUGIN_SKILLS,
    names: getDerivedSkillNames(),
    check,
    cwd: PACKAGE_ROOT,
  });

  if (check) {
    reportCheckResult(LABEL, [...mirrorResult.stale, ...skillsResult.stale]);
    return;
  }

  const updated = mirrorResult.updated + skillsResult.updated;
  if (updated === 0) {
    console.log(`[${LABEL}] no Gemini plugin command changes were needed.`);
    return;
  }

  console.log(`[${LABEL}] updated ${updated} Gemini plugin file(s).`);
}

main();

'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const COMMANDS_ROOT = path.join(REPO_ROOT, 'plugins', 'babysitter', 'commands');
const SKILLS_ROOT = path.join(PACKAGE_ROOT, 'skills');

function parseFrontmatter(markdown) {
  if (!markdown.startsWith('---')) {
    return { data: {}, body: markdown.trimStart() };
  }

  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: markdown.trimStart() };
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const frontmatterMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!frontmatterMatch) continue;
    data[frontmatterMatch[1]] = frontmatterMatch[2];
  }

  return {
    data,
    body: match[2].trim(),
  };
}

function renderSkill(name, description, body) {
  return [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    '---',
    '',
    `# ${name}`,
    '',
    body.trim(),
    '',
  ].join('\n');
}

function getCommandBackedSkillNames() {
  return fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(COMMANDS_ROOT, `${name}.md`)))
    .sort();
}

function buildExpectedSkill(name) {
  const commandPath = path.join(COMMANDS_ROOT, `${name}.md`);
  const commandSource = fs.readFileSync(commandPath, 'utf8').replace(/\r\n/g, '\n');
  const parsed = parseFrontmatter(commandSource);
  const description = parsed.data.description || `Babysitter ${name} mode.`;
  return renderSkill(name, description, parsed.body);
}

function checkSkills() {
  const mismatches = [];

  for (const name of getCommandBackedSkillNames()) {
    const skillPath = path.join(SKILLS_ROOT, name, 'SKILL.md');
    const actual = fs.readFileSync(skillPath, 'utf8').replace(/\r\n/g, '\n');
    const expected = buildExpectedSkill(name);
    if (actual !== expected) {
      mismatches.push(path.relative(PACKAGE_ROOT, skillPath));
    }
  }

  if (mismatches.length > 0) {
    console.error('[sync-command-skills] stale Codex skills detected:');
    for (const mismatch of mismatches) {
      console.error(`  - ${mismatch}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('[sync-command-skills] Codex command-backed skills are up to date.');
}

function writeSkills() {
  let updated = 0;

  for (const name of getCommandBackedSkillNames()) {
    const skillPath = path.join(SKILLS_ROOT, name, 'SKILL.md');
    const expected = buildExpectedSkill(name);
    const current = fs.readFileSync(skillPath, 'utf8').replace(/\r\n/g, '\n');
    if (current === expected) continue;
    fs.writeFileSync(skillPath, expected, 'utf8');
    updated += 1;
    console.log(`[sync-command-skills] updated ${path.relative(PACKAGE_ROOT, skillPath)}`);
  }

  if (updated === 0) {
    console.log('[sync-command-skills] no Codex skill changes were needed.');
    return;
  }

  console.log(`[sync-command-skills] updated ${updated} Codex skill file(s).`);
}

function main() {
  if (process.argv.includes('--check')) {
    checkSkills();
    return;
  }

  writeSkills();
}

main();

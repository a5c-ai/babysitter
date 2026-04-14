'use strict';

const fs = require('fs');
const path = require('path');
const {
  listDirectories,
  listMarkdownBasenames,
  normalizeNewlines,
  parseFrontmatter,
  reportCheckResult,
  syncSkillsFromCommands,
  writeFileIfChanged,
} = require('../../../scripts/plugin-command-sync-lib.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const ROOT_COMMANDS = path.join(REPO_ROOT, 'plugins', 'babysitter', 'commands');
const PLUGIN_COMMANDS = path.join(PACKAGE_ROOT, 'commands');
const PLUGIN_SKILLS = path.join(PACKAGE_ROOT, 'skills');
const LABEL = 'babysitter-gemini sync';

function listTomlBasenames(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.toml'))
    .map((entry) => entry.name.replace(/\.toml$/, ''))
    .sort();
}

/**
 * Renders a Gemini CLI v1 TOML command from a Markdown source with YAML frontmatter.
 */
function renderTomlCommand(markdown) {
  const parsed = parseFrontmatter(markdown);
  const description = parsed.data.description || '';
  const body = parsed.body.trim();

  // Simple TOML escaping for description
  const escapedDescription = description.replace(/"/g, '\\"');
  
  // Use JSON.stringify to handle all escaping for the prompt basic string.
  // TOML basic strings are compatible with JSON string escaping rules for the most part.
  const promptValue = JSON.stringify(body);
  
  return [
    `description = "${escapedDescription}"`,
    '',
    `prompt = ${promptValue}`,
    '',
  ].join('\n');
}

function getMirroredCommandNames() {
  // Mirror all source commands into TOML targets
  return listMarkdownBasenames(ROOT_COMMANDS);
}

function getDerivedSkillNames() {
  const local = new Set(listDirectories(PLUGIN_SKILLS));
  // Derived skills match commands that already have a skills directory
  return listTomlBasenames(PLUGIN_COMMANDS).filter((name) => local.has(name));
}

/**
 * Synchronizes source .md commands to target .toml commands with format conversion.
 */
function syncCommandMirrorsToToml(options) {
  const names = options.names || getMirroredCommandNames();
  const stale = [];
  let updated = 0;

  for (const name of names) {
    const sourcePath = path.join(options.sourceRoot, `${name}.md`);
    if (!fs.existsSync(sourcePath)) continue;
    
    const targetPath = path.join(options.targetRoot, `${name}.toml`);
    const expected = normalizeNewlines(renderTomlCommand(fs.readFileSync(sourcePath, 'utf8')));
    const actual = fs.existsSync(targetPath)
      ? normalizeNewlines(fs.readFileSync(targetPath, 'utf8'))
      : null;

    if (options.check) {
      if (actual !== expected) {
        stale.push(path.relative(options.cwd || process.cwd(), targetPath));
      }
    } else {
      if (writeFileIfChanged(targetPath, expected)) {
        updated += 1;
        console.log(`[${options.label}] updated ${path.relative(options.cwd || process.cwd(), targetPath)}`);
      }
    }

    // Clean up old .md file if it exists
    const oldMdPath = path.join(options.targetRoot, `${name}.md`);
    if (fs.existsSync(oldMdPath)) {
      if (options.check) {
        stale.push(path.relative(options.cwd || process.cwd(), oldMdPath));
      } else {
        fs.unlinkSync(oldMdPath);
        console.log(`[${options.label}] removed obsolete ${path.relative(options.cwd || process.cwd(), oldMdPath)}`);
      }
    }
  }

  // Handle orphan .toml files (no longer in source)
  const existingTomls = listTomlBasenames(options.targetRoot);
  const sourceNames = new Set(names);
  for (const name of existingTomls) {
    if (!sourceNames.has(name)) {
      const orphanPath = path.join(options.targetRoot, `${name}.toml`);
      if (options.check) {
        stale.push(path.relative(options.cwd || process.cwd(), orphanPath));
      } else {
        fs.unlinkSync(orphanPath);
        console.log(`[${options.label}] removed orphan ${path.relative(options.cwd || process.cwd(), orphanPath)}`);
        updated += 1;
      }
    }
  }

  return { stale, updated };
}

function main() {
  const check = process.argv.includes('--check');
  
  const mirrorResult = syncCommandMirrorsToToml({
    label: LABEL,
    sourceRoot: ROOT_COMMANDS,
    targetRoot: PLUGIN_COMMANDS,
    names: getMirroredCommandNames(),
    check,
    cwd: PACKAGE_ROOT,
  });

  const skillsResult = syncSkillsFromCommands({
    label: LABEL,
    sourceRoot: ROOT_COMMANDS, // Use source commands for skills generation
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

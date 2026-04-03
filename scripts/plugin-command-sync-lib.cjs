'use strict';

const fs = require('fs');
const path = require('path');

function normalizeNewlines(value) {
  return String(value).replace(/\r\n/g, '\n');
}

function parseFrontmatter(markdown) {
  const normalized = normalizeNewlines(markdown);
  if (!normalized.startsWith('---\n')) {
    return { data: {}, body: normalized.trim() };
  }

  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: normalized.trim() };
  }

  const data = {};
  for (const line of match[1].split('\n')) {
    const frontmatterMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!frontmatterMatch) continue;
    data[frontmatterMatch[1]] = frontmatterMatch[2];
  }

  return {
    data,
    body: match[2].trim(),
  };
}

function renderSkillMarkdown(name, description, body) {
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

function buildSkillFromCommand(name, commandMarkdown) {
  const parsed = parseFrontmatter(commandMarkdown);
  return renderSkillMarkdown(
    name,
    parsed.data.description || `Babysitter ${name} mode.`,
    parsed.body,
  );
}

function writeFileIfChanged(filePath, contents) {
  const normalized = normalizeNewlines(contents);
  const existing = fs.existsSync(filePath)
    ? normalizeNewlines(fs.readFileSync(filePath, 'utf8'))
    : null;

  if (existing === normalized) {
    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, normalized, 'utf8');
  return true;
}

function listDirectories(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listMarkdownBasenames(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .sort();
}

function syncCommandMirrors(options) {
  const names = options.names || listMarkdownBasenames(options.sourceRoot);
  const stale = [];
  let updated = 0;

  for (const name of names) {
    const sourcePath = path.join(options.sourceRoot, `${name}.md`);
    if (!fs.existsSync(sourcePath)) continue;
    const targetPath = path.join(options.targetRoot, `${name}.md`);
    const expected = normalizeNewlines(fs.readFileSync(sourcePath, 'utf8'));
    const actual = fs.existsSync(targetPath)
      ? normalizeNewlines(fs.readFileSync(targetPath, 'utf8'))
      : null;

    if (options.check) {
      if (actual !== expected) {
        stale.push(path.relative(options.cwd || process.cwd(), targetPath));
      }
      continue;
    }

    if (writeFileIfChanged(targetPath, expected)) {
      updated += 1;
      console.log(`[${options.label}] updated ${path.relative(options.cwd || process.cwd(), targetPath)}`);
    }
  }

  return { stale, updated };
}

function syncSkillsFromCommands(options) {
  const skillsDirNames = options.names || listDirectories(options.skillsRoot);
  const stale = [];
  let updated = 0;

  for (const name of skillsDirNames) {
    if (name === 'babysit' || name === 'babysitter') continue;
    const sourcePath = path.join(options.sourceRoot, `${name}.md`);
    if (!fs.existsSync(sourcePath)) continue;
    const targetPath = path.join(options.skillsRoot, name, 'SKILL.md');
    const expected = buildSkillFromCommand(
      name,
      fs.readFileSync(sourcePath, 'utf8'),
    );
    const actual = fs.existsSync(targetPath)
      ? normalizeNewlines(fs.readFileSync(targetPath, 'utf8'))
      : null;

    if (options.check) {
      if (actual !== expected) {
        stale.push(path.relative(options.cwd || process.cwd(), targetPath));
      }
      continue;
    }

    if (writeFileIfChanged(targetPath, expected)) {
      updated += 1;
      console.log(`[${options.label}] updated ${path.relative(options.cwd || process.cwd(), targetPath)}`);
    }
  }

  return { stale, updated };
}

function reportCheckResult(label, stale) {
  if (stale.length === 0) {
    console.log(`[${label}] synchronized.`);
    return;
  }

  console.error(`[${label}] stale generated files detected:`);
  for (const file of stale) {
    console.error(`  - ${file}`);
  }
  process.exitCode = 1;
}

module.exports = {
  buildSkillFromCommand,
  listDirectories,
  listMarkdownBasenames,
  normalizeNewlines,
  parseFrontmatter,
  reportCheckResult,
  syncCommandMirrors,
  syncSkillsFromCommands,
  writeFileIfChanged,
};

#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Linter } = require('eslint');

const repoRoot = path.resolve(__dirname, '..');
const libraryRoot = path.join(repoRoot, 'library');
const linter = new Linter();

async function collectJsFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectJsFiles(fullPath, results);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }

  return results;
}

function readStagedLibraryFiles() {
  const result = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--', 'library'],
    {
      cwd: repoRoot,
      encoding: 'utf8'
    }
  );

  if (result.status !== 0) {
    const output = (result.stderr || result.stdout || 'Failed to read staged files').trim();
    throw new Error(output);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join(repoRoot, file));
}

async function validateFile(filePath) {
  const source = await fs.readFile(filePath, 'utf8');
  const relativePath = path.relative(repoRoot, filePath).replaceAll('\\', '/');
  const messages = linter.verify(
    source,
    {
      env: {
        es2022: true,
        node: true
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    relativePath
  );

  return messages.filter((message) => message.fatal || message.severity === 2);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const jsFiles = args.has('--staged')
    ? readStagedLibraryFiles()
    : await collectJsFiles(libraryRoot);

  if (jsFiles.length === 0) {
    console.log('No matching library JavaScript files to validate.');
    return;
  }

  const failures = [];

  for (const filePath of jsFiles) {
    const messages = await validateFile(filePath);
    if (messages.length > 0) {
      for (const message of messages) {
        const location =
          typeof message.line === 'number'
            ? `:${message.line}${typeof message.column === 'number' ? `:${message.column}` : ''}`
            : '';
        failures.push({
          filePath,
          location,
          message: message.message
        });
      }
    }
  }

  if (failures.length === 0) {
    console.log(`Validated ${jsFiles.length} library JavaScript files: syntax OK.`);
    return;
  }

  console.error(`Library JavaScript syntax check failed in ${failures.length} file(s):`);
  for (const failure of failures) {
    const relativePath = path.relative(repoRoot, failure.filePath).replaceAll('\\', '/');
    console.error(`- ${relativePath}${failure.location}: ${failure.message}`);
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});

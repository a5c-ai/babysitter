#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const libraryRoot = path.join(repoRoot, 'library');

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

function validateFile(filePath) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (result.status === 0) {
    return null;
  }

  return (result.stderr || result.stdout || 'Syntax check failed').trim();
}

async function main() {
  const jsFiles = await collectJsFiles(libraryRoot);
  const failures = [];

  for (const filePath of jsFiles) {
    const failureMessage = validateFile(filePath);
    if (failureMessage) {
      failures.push({
        filePath,
        message: failureMessage
      });
    }
  }

  if (failures.length === 0) {
    console.log(`Validated ${jsFiles.length} library JavaScript files: syntax OK.`);
    return;
  }

  console.error(`Library JavaScript syntax check failed in ${failures.length} file(s):`);
  for (const failure of failures) {
    const relativePath = path.relative(repoRoot, failure.filePath).replaceAll('\\', '/');
    console.error(`- ${relativePath}`);
    console.error(failure.message);
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});

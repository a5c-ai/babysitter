#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { Linter } = require('eslint');

const repoRoot = path.resolve(__dirname, '..');
const libraryRoot = path.join(repoRoot, 'library');
const linter = new Linter();

function walkJsFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsFiles(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

function hasParseErrors(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(repoRoot, filePath).replaceAll('\\', '/');
  const messages = linter.verify(
    source,
    {
      env: { es2022: true, node: true },
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' }
    },
    relativePath
  );
  return messages.some((message) => message.fatal || message.severity === 2);
}

function repairText(source) {
  let updated = source;

  // Collapse obviously spliced double-close lines like "} }" back to a single close.
  updated = updated.replace(/^(\s*)}\s+}(\s*)$/gm, '$1}$2');

  // Recover line starts mangled into "}et lastFeedback..." by a bad splice.
  updated = updated.replace(/^(\s*)}et(\s+lastFeedback[^\n]*)$/gm, '$1}\n$1let$2');

  // Split statements accidentally concatenated after a closing brace, but keep valid "} else" forms intact.
  updated = updated.replace(
    /^(\s*)}(?!\s*(?:else\b|catch\b|finally\b|while\s*\(|[),;\]}]))\s+(.+)$/gm,
    '$1}\n$1$2'
  );

  return updated;
}

function main() {
  const files = walkJsFiles(libraryRoot);
  let changedFiles = 0;

  for (const filePath of files) {
    if (!hasParseErrors(filePath)) {
      continue;
    }

    const original = fs.readFileSync(filePath, 'utf8');
    const repaired = repairText(original);
    if (repaired !== original) {
      fs.writeFileSync(filePath, repaired, 'utf8');
      changedFiles++;
    }
  }

  console.log(`Repaired obvious refactor artifacts in ${changedFiles} file(s).`);
}

main();

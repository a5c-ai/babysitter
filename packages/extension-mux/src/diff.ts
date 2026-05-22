import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { compile } from './compiler.js';
import { getTargetProfile } from './targets/index.js';
import type { DiffFileDifference, DiffResult } from './types.js';

export interface DiffOptions {
  source: string;
  target: string;
  existing: string;
}

const IGNORED_EXISTING_FILES = new Set([
  'package-lock.json',
  'plugin.lock.json',
  '.npmrc',
  '.cursorrules',
  'CHANGELOG.md',
  'hooks/proxied-hooks.json',
  'hooks/hooks.json',
  'proxied-hooks.json',
  'versions.json',
]);

export function diffTarget(options: DiffOptions): DiffResult {
  const { source, target, existing } = options;
  const targetProfile = getTargetProfile(target);

  if (!targetProfile) {
    throw new Error(`Unknown target: ${target}`);
  }

  if (!fs.existsSync(existing)) {
    throw new Error(`Existing directory not found: ${existing}`);
  }

  if (!fs.statSync(existing).isDirectory()) {
    throw new Error(`Existing path must be a directory: ${existing}`);
  }

  const tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'extension-mux-diff-'));
  const compiledDir = path.join(tempBaseDir, target);

  try {
    const compileResult = compile({
      source,
      target,
      output: compiledDir,
    });

    if (compileResult.status === 'error') {
      return {
        target,
        sourceDir: source,
        existingDir: existing,
        compilationStatus: compileResult.status,
        diagnostics: compileResult.diagnostics,
        status: 'error',
        identical: false,
        differenceCount: 0,
        onlyInCompiled: [],
        onlyInExisting: [],
        differingFiles: [],
        ignoredExistingFiles: [],
      };
    }

    const compiledFiles = collectFiles(compiledDir);
    const allExistingFiles = collectFiles(existing);
    const ignoredExistingFiles = allExistingFiles.filter((file) => isIgnoredExistingFile(file));
    const existingFiles = allExistingFiles;

    const onlyInCompiled = compiledFiles.filter((file) => !existingFiles.includes(file)).sort();
    const onlyInExisting = existingFiles
      .filter((file) => !compiledFiles.includes(file) && !isIgnoredExistingFile(file))
      .sort();
    const differingFiles = compiledFiles
      .filter((file) => existingFiles.includes(file) && !isIgnoredExistingFile(file))
      .sort()
      .flatMap((file) => {
        const difference = compareFile(
          path.join(compiledDir, file),
          path.join(existing, file),
          file,
        );
        return difference ? [difference] : [];
      });

    const differenceCount =
      onlyInCompiled.length + onlyInExisting.length + differingFiles.length;

    return {
      target,
      sourceDir: source,
      existingDir: existing,
      compilationStatus: compileResult.status,
      diagnostics: compileResult.diagnostics,
      status: differenceCount > 0 ? 'different' : 'match',
      identical: differenceCount === 0,
      differenceCount,
      onlyInCompiled,
      onlyInExisting,
      differingFiles,
      ignoredExistingFiles,
    };
  } finally {
    fs.rmSync(tempBaseDir, { recursive: true, force: true });
  }
}

export function formatDiffResult(result: DiffResult): string {
  if (result.status === 'error') {
    return `Compilation failed for target ${result.target}.`;
  }

  if (result.identical) {
    return `No differences found for target ${result.target}.`;
  }

  const lines: string[] = [];

  if (result.onlyInCompiled.length > 0) {
    lines.push('Files only in compiled:');
    for (const file of result.onlyInCompiled) {
      lines.push(`  ${file}`);
    }
  }

  if (result.onlyInExisting.length > 0) {
    lines.push('Files only in existing:');
    for (const file of result.onlyInExisting) {
      lines.push(`  ${file}`);
    }
  }

  if (result.differingFiles.length > 0) {
    lines.push('Files with differences:');
    for (const file of result.differingFiles) {
      lines.push(`  ${file.path}`);
      lines.push(`    - compiled: ${formatLinePreview(file.compiledLine)}`);
      lines.push(`    + existing: ${formatLinePreview(file.existingLine)}`);
      lines.push(`    (content differs at line ${file.line})`);
    }
  }

  return lines.join('\n');
}

function compareFile(compiledPath: string, existingPath: string, relativePath: string) {
  const compiledContent = fs.readFileSync(compiledPath, 'utf-8');
  const existingContent = fs.readFileSync(existingPath, 'utf-8');

  if (compiledContent === existingContent) {
    return null;
  }

  const compiledLines = compiledContent.split(/\r?\n/);
  const existingLines = existingContent.split(/\r?\n/);
  const maxLines = Math.max(compiledLines.length, existingLines.length);

  for (let index = 0; index < maxLines; index++) {
    if (compiledLines[index] !== existingLines[index]) {
      const difference: DiffFileDifference = {
        path: relativePath,
        line: index + 1,
        compiledLine: compiledLines[index] ?? null,
        existingLine: existingLines[index] ?? null,
      };
      return difference;
    }
  }

  return {
    path: relativePath,
    line: maxLines,
    compiledLine: compiledLines[maxLines - 1] ?? null,
    existingLine: existingLines[maxLines - 1] ?? null,
  };
}

function collectFiles(dir: string, prefix = ''): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') {
      continue;
    }

    const fullPath = path.join(dir, entry);
    const relativePath = prefix ? `${prefix}/${entry}` : entry;

    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...collectFiles(fullPath, relativePath));
      continue;
    }

    results.push(relativePath);
  }

  return results.sort();
}

function isIgnoredExistingFile(file: string) {
  return (
    file.startsWith('.a5c/') ||
    file.startsWith('test/') ||
    IGNORED_EXISTING_FILES.has(file) ||
    file.endsWith('.legacy') ||
    file.endsWith('.legacy.ts') ||
    file.includes('sync-command') ||
    file.endsWith('.png') ||
    file.endsWith('.svg')
  );
}

function formatLinePreview(line: string | null) {
  if (line === null) {
    return '(missing)';
  }

  if (line.length === 0) {
    return '(empty)';
  }

  return line;
}

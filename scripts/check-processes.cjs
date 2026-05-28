#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const DEFAULT_MEDIA_GLOBS = ['*tts*', '*stt*', '*audio*', '*hands-free*', '*media*', '*voice*'];
const REQUIRED_DEVICE_ROWS = [
  'iPad Safari (PWA install)',
  'iPhone Safari (PWA install)',
  'macOS Safari (web)',
  'Desktop Chrome (web)',
];

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(pattern) {
  const source = String(pattern)
    .split('*')
    .map(escapeRegex)
    .join('.*');
  return new RegExp(`^${source}$`, 'i');
}

function matchesMediaPath(filePath, patterns = DEFAULT_MEDIA_GLOBS) {
  return patterns.some((pattern) => globToRegExp(pattern).test(filePath));
}

function mediaChangedFiles(changedFiles, patterns = DEFAULT_MEDIA_GLOBS) {
  return changedFiles.filter((filePath) => matchesMediaPath(filePath, patterns));
}

function findDeviceMatrixBlock(text) {
  const heading = /^##\s+Device test matrix \(REQUIRED for media-touching changes\)\s*$/im;
  const match = heading.exec(text);
  if (!match) return null;

  const start = match.index;
  const rest = text.slice(start + match[0].length);
  const nextHeading = /\n##\s+/m.exec(rest);
  return text.slice(start, nextHeading ? start + match[0].length + nextHeading.index : text.length);
}

function evidenceAfterStatus(line) {
  const statusMatch = /\b(PASS|FAIL|SKIP)\b\s*(?::|-)?\s*(.*)$/i.exec(line);
  if (!statusMatch) return null;

  return {
    status: statusMatch[1].toUpperCase(),
    evidence: statusMatch[2].trim().replace(/^[-:]\s*/, '').trim(),
  };
}

function validateDeviceMatrix(text) {
  const block = findDeviceMatrixBlock(text);
  const errors = [];

  if (!block) {
    return {
      valid: false,
      errors: ['Missing "## Device test matrix (REQUIRED for media-touching changes)" block.'],
    };
  }

  const lines = block.split(/\r?\n/);
  for (const row of REQUIRED_DEVICE_ROWS) {
    const rowLine = lines.find((line) => line.includes(row));
    if (!rowLine) {
      errors.push(`Missing device row: ${row}.`);
      continue;
    }

    const evidence = evidenceAfterStatus(rowLine);
    if (!evidence) {
      errors.push(`Device row must include PASS, FAIL, or SKIP: ${row}.`);
      continue;
    }

    if (!evidence.evidence) {
      errors.push(`Device row must include one-line evidence: ${row}.`);
      continue;
    }
  }

  return { valid: errors.length === 0, errors };
}

function readChangedFiles({ changedFilesPath, baseRef } = {}) {
  if (changedFilesPath) {
    return fs.readFileSync(changedFilesPath, 'utf8').split(/\r?\n/).filter(Boolean);
  }

  const base = baseRef || 'origin/staging';
  const stdout = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
    encoding: 'utf8',
  });
  return stdout.split(/\r?\n/).filter(Boolean);
}

function readEvidenceTexts({ implPath = 'IMPL.md', prBodyPath, prBody } = {}) {
  const texts = [];

  if (implPath && fs.existsSync(implPath)) {
    texts.push({ source: implPath, text: fs.readFileSync(implPath, 'utf8') });
  }

  if (prBodyPath && fs.existsSync(prBodyPath)) {
    texts.push({ source: prBodyPath, text: fs.readFileSync(prBodyPath, 'utf8') });
  }

  if (prBody) {
    texts.push({ source: 'PROCESS_CHECK_PR_BODY', text: prBody });
  }

  return texts;
}

function validateProcessEvidence({ changedFiles, evidenceTexts, mediaGlobs = DEFAULT_MEDIA_GLOBS }) {
  const mediaFiles = mediaChangedFiles(changedFiles, mediaGlobs);
  if (mediaFiles.length === 0) {
    return { valid: true, mediaFiles, errors: [] };
  }

  const attempts = evidenceTexts.map((entry) => ({
    source: entry.source,
    result: validateDeviceMatrix(entry.text),
  }));
  const validSource = attempts.find((attempt) => attempt.result.valid);
  if (validSource) {
    return { valid: true, mediaFiles, errors: [], source: validSource.source };
  }

  const errors = [
    `Media-touching changes require a filled device test matrix. Matched files: ${mediaFiles.join(', ')}`,
  ];

  if (attempts.length === 0) {
    errors.push('No IMPL.md or PR body evidence was available.');
  } else {
    for (const attempt of attempts) {
      errors.push(`${attempt.source}: ${attempt.result.errors.join(' ')}`);
    }
  }

  return { valid: false, mediaFiles, errors };
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--changed-files') options.changedFilesPath = argv[++i];
    else if (arg === '--base') options.baseRef = argv[++i];
    else if (arg === '--impl') options.implPath = argv[++i];
    else if (arg === '--pr-body-file') options.prBodyPath = argv[++i];
    else if (arg === '--media-globs') options.mediaGlobs = parseCsv(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const changedFiles = readChangedFiles({
    changedFilesPath: args.changedFilesPath || process.env.PROCESS_CHECK_CHANGED_FILES,
    baseRef: args.baseRef || process.env.PROCESS_CHECK_BASE,
  });
  const evidenceTexts = readEvidenceTexts({
    implPath: args.implPath || process.env.PROCESS_CHECK_IMPL_PATH || 'IMPL.md',
    prBodyPath: args.prBodyPath || process.env.PROCESS_CHECK_PR_BODY_FILE,
    prBody: process.env.PROCESS_CHECK_PR_BODY,
  });
  const mediaGlobs = args.mediaGlobs || parseCsv(process.env.PROCESS_CHECK_MEDIA_GLOBS);
  const result = validateProcessEvidence({
    changedFiles,
    evidenceTexts,
    mediaGlobs: mediaGlobs.length > 0 ? mediaGlobs : DEFAULT_MEDIA_GLOBS,
  });

  if (!result.valid) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
    return;
  }

  if (result.mediaFiles.length > 0) {
    console.log(`Process media-device matrix check passed via ${result.source}.`);
  } else {
    console.log('Process media-device matrix check skipped: no media-touching changed files.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_MEDIA_GLOBS,
  REQUIRED_DEVICE_ROWS,
  findDeviceMatrixBlock,
  matchesMediaPath,
  mediaChangedFiles,
  validateDeviceMatrix,
  validateProcessEvidence,
};

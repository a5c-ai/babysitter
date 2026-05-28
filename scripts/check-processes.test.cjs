'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mediaChangedFiles,
  validateDeviceMatrix,
  validateProcessEvidence,
} = require('./check-processes.cjs');

const validMatrix = `
## Device test matrix (REQUIRED for media-touching changes)

For each of the following, mark PASS / FAIL / SKIP with one-line evidence:

- [ ] iPad Safari (PWA install): PASS - verified on physical iPad PWA install.
- [ ] iPhone Safari (PWA install): SKIP - non-iPhone path; iPad covers the PWA gesture path.
- [ ] macOS Safari (web): PASS - verified browser capture smoke.
- [ ] Desktop Chrome (web): FAIL - regression reproduced before fix.
`;

test('skips when no changed file matches media globs', () => {
  const result = validateProcessEvidence({
    changedFiles: ['packages/sdk/src/runtime/run.ts', 'docs/readme.md'],
    evidenceTexts: [],
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.mediaFiles, []);
});

test('detects media-related changed files', () => {
  assert.deepEqual(mediaChangedFiles([
    'src/voice/session.ts',
    'src/stt/browser.ts',
    'src/plain/session.ts',
  ]), ['src/voice/session.ts', 'src/stt/browser.ts']);
});

test('accepts a complete matrix with evidence for every device', () => {
  const result = validateProcessEvidence({
    changedFiles: ['apps/cookbook/audio-capture.ts'],
    evidenceTexts: [{ source: 'IMPL.md', text: validMatrix }],
  });

  assert.equal(result.valid, true);
  assert.equal(result.source, 'IMPL.md');
});

test('rejects media changes when matrix is missing', () => {
  const result = validateProcessEvidence({
    changedFiles: ['apps/cookbook/media-session.ts'],
    evidenceTexts: [{ source: 'IMPL.md', text: '## Plan\nNo device matrix here.' }],
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /Missing "## Device test matrix/);
});

test('accepts SKIP rows with justification', () => {
  const result = validateDeviceMatrix(validMatrix);

  assert.equal(result.valid, true);
});

test('rejects SKIP rows without justification', () => {
  const invalid = `
## Device test matrix (REQUIRED for media-touching changes)

- [ ] iPad Safari (PWA install): SKIP
- [ ] iPhone Safari (PWA install): PASS - tested on device.
- [ ] macOS Safari (web): PASS - tested on macOS.
- [ ] Desktop Chrome (web): PASS - tested on Chrome.
`;

  const result = validateDeviceMatrix(invalid);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /one-line evidence: iPad Safari/);
});

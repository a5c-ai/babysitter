import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');

function readRepoFile(path) {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function expectStrike3Contract(source) {
  expect(source).toMatch(/Strike-3|post-instrumentation/i);
  expect(source).toMatch(/at least 3|3\+|three candidate/i);
  expect(source).toMatch(/candidate root-cause hypotheses/i);
  expect(source).toMatch(/falsifying log line|falsifying .* observation/i);
  expect(source).toMatch(/seq number|sequence number|seq\b/i);
  expect(source).toMatch(/timestamp/i);
  expect(source).toMatch(/log-id/i);
  expect(source).toMatch(/artifact path/i);
  expect(source).toMatch(/specific log line|specific log record|log record citation/i);
  expect(source).toMatch(/needs-more-data/i);
}

describe('Strike-3 post-instrumentation hypothesis-before-fix contract', () => {
  const targets = [
    'docs/agent-reference/process-authoring.md',
    'library/specializations/qa-testing-automation/diagnostic-first-phase.js',
    'library/specializations/qa-testing-automation/diagnostic-first-phase.md',
    'library/processes/shared/n-strikes-escalation.js',
    'library/methodologies/shared/root-cause-diagnosis.js',
    'library/methodologies/gsd/debug.js',
    'library/methodologies/cc10x/cc10x-debug.js',
    'library/methodologies/rpikit/skills/systematic-debugging/SKILL.md',
  ];

  for (const path of targets) {
    it(`${path} preserves the contract terms`, () => {
      expectStrike3Contract(readRepoFile(path));
    });
  }
});

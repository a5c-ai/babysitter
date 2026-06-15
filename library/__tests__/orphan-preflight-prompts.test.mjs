import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');

function readRepoFile(path) {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function expectOrphanPreflightGuidance(source) {
  expect(source).toMatch(/planned new files?/i);
  expect(source).toMatch(/exact path/i);
  expect(source).toMatch(/scripts\//);
  expect(source).toMatch(/supabase\/migrations\//);
  expect(source).toMatch(/src\/server\//);
  expect(source).toMatch(/src\/lib\//);
  expect(source).toMatch(/ls|rg|grep/i);
  expect(source).toMatch(/read (the )?existing file/i);
  expect(source).toMatch(/report .*orchestrator/i);
  expect(source).toMatch(/wait|stop/i);
  expect(source).toMatch(/scope direction/i);
  expect(source).toMatch(/use-existing|replace|append|renumber/i);
  expect(source).toMatch(/do not .*auto/i);
}

describe('implementation prompt orphan preflight guidance', () => {
  it('requires exact-path pre-author checks in the cradle feature implementation prompt', () => {
    const source = readRepoFile('library/cradle/feature-implementation-contribute.js');

    expectOrphanPreflightGuidance(source);
  });

  it('requires exact-path pre-author checks in the cradle harness integration prompt', () => {
    const source = readRepoFile('library/cradle/feature-harness-integration-contribute.js');

    expectOrphanPreflightGuidance(source);
  });

  it('requires exact-path pre-author checks in the CC10X TDD GREEN prompt', () => {
    const source = readRepoFile('library/methodologies/cc10x/cc10x-build.js');

    expectOrphanPreflightGuidance(source);
  });
});

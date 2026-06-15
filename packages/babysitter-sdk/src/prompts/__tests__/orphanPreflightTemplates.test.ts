import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TEMPLATES_ROOT = resolve(__dirname, '..', 'templates');

function readTemplate(name: string) {
  return readFileSync(resolve(TEMPLATES_ROOT, name), 'utf8');
}

function expectOrphanPreflightGuidance(output: string) {
  expect(output).toMatch(/planned new files?/i);
  expect(output).toMatch(/exact path/i);
  expect(output).toContain('scripts/');
  expect(output).toContain('supabase/migrations/');
  expect(output).toContain('src/server/');
  expect(output).toContain('src/lib/');
  expect(output).toMatch(/ls|rg|grep/i);
  expect(output).toMatch(/read (the )?existing file/i);
  expect(output).toMatch(/report .*orchestrator/i);
  expect(output).toMatch(/wait|stop/i);
  expect(output).toMatch(/scope direction/i);
  expect(output).toMatch(/use-existing|replace|append|renumber/i);
  expect(output).toMatch(/do not .*auto/i);
}

describe('SDK prompt template orphan preflight guidance', () => {
  it('preserves plan-scoped reuse audit and adds implementation-time preflight guidance to process creation', () => {
    const output = readTemplate('process-creation.md');

    expect(output).toContain('Phase 0 -- REUSE-AUDIT');
    expect(output).toContain('Reuse-audit findings (REVIEW BEFORE PROCEEDING)');
    expectOrphanPreflightGuidance(output);
  });

  it('adds implementation-time preflight guidance to process guidelines', () => {
    expectOrphanPreflightGuidance(readTemplate('process-guidelines.md'));
  });

  it('keeps coding philosophy focused on existing files and planned-new-path checks', () => {
    const output = readTemplate('coding-philosophy.md');

    expect(output).toContain('Prefer editing existing files over creating new ones');
    expectOrphanPreflightGuidance(output);
  });
});

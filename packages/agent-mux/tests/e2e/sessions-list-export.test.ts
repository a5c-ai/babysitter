/**
 * E2E: `amux sessions list` + `amux sessions export` against a mock
 * adapter whose session files live in a temp directory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { runCliInProcess } from './harness.js';
import { setColorEnabled } from '../../cli/src/output.js';

describe('E2E: sessions list + export', () => {
  let tempDir: string;

  beforeEach(() => {
    setColorEnabled(false);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-e2e-sessions-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('`sessions list` with no agent returns USAGE_ERROR', async () => {
    const { code, stderr } = await runCliInProcess(['sessions', 'list']);
    expect(code).not.toBe(0);
    expect(stderr).toContain('Missing required argument');
  });

  it('`sessions list <unknown-agent> --json` emits a structured error', async () => {
    const { code, stdout, stderr } = await runCliInProcess([
      'sessions', 'list', 'nonexistent-agent', '--json',
    ]);
    expect(code).not.toBe(0);
    // Error envelopes may be emitted on either stream. Diagnostics can also
    // appear on stderr, so prefer the stdout envelope and otherwise parse the
    // final JSON object from stderr.
    const stderrEnvelope = stderr.trim().match(/\{[\s\S]*\}\s*$/)?.[0];
    const parsed = JSON.parse(stdout.trim() || stderrEnvelope || '');
    expect(parsed.ok).toBe(false);
    expect(typeof parsed.error.code).toBe('string');
  });

  it('`sessions export` requires an agent and session id', async () => {
    const { code, stderr } = await runCliInProcess(['sessions', 'export']);
    expect(code).not.toBe(0);
    expect(stderr).toContain('Usage');
  });
});

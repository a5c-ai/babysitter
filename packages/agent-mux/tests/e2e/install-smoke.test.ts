/**
 * E2E: `amux install <fake-agent> --dry-run` smoke test.
 *
 * Verifies the install pipeline end-to-end (argument parsing, command
 * dispatch, JSON output) without touching the real system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { runCliInProcess } from './harness.js';
import { setColorEnabled } from '../../cli/src/output.js';

describe('E2E: amux install --dry-run', () => {
  beforeEach(() => setColorEnabled(false));

  it('returns exit 0 for an unknown agent in dry-run', async () => {
    const { code, stdout } = await runCliInProcess(['install', 'totally-fake-agent', '--dry-run']);
    expect(code).toBe(0);
    expect(stdout).toContain('dry-run');
    expect(stdout).toContain('totally-fake-agent');
  });

  it('emits JSON when --json + --dry-run are combined', async () => {
    const { code, stdout } = await runCliInProcess([
      'install', 'totally-fake-agent', '--dry-run', '--json',
    ]);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.ok).toBe(true);
    expect(parsed.data.agent).toBe('totally-fake-agent');
    expect(parsed.data.dryRun).toBe(true);
  });

  it('without --dry-run, unknown agent errors with AGENT_NOT_FOUND exit code', async () => {
    const { code, stderr } = await runCliInProcess(['install', 'still-fake']);
    expect(code).not.toBe(0);
    expect(stderr).toContain('Unknown agent');
  });
});

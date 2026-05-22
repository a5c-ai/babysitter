import { execPath } from 'node:process';
import { describe, expect, it } from 'vitest';
import { evaluateActionTrigger, runCommand } from '../src/action.js';

describe('action helpers', () => {
  it('matches when no trigger query is configured', async () => {
    const result = await evaluateActionTrigger({
      backend: 'generic-webhook',
      eventName: 'webhook',
      query: undefined,
    });

    expect(result.matched).toBe(true);
    expect(result.reasons).toContain('trigger matched');
  });

  it('returns subprocess exit codes', async () => {
    await expect(runCommand(execPath, ['-e', 'process.exit(7)'])).resolves.toMatchObject({ code: 7, signal: null });
  });

  it('returns zero for successful subprocesses', async () => {
    await expect(runCommand(execPath, ['-e', 'process.exit(0)'])).resolves.toMatchObject({ code: 0, signal: null });
  });
});

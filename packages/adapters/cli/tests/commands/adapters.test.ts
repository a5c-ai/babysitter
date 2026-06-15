import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptersCommand } from '../../src/commands/adapters.js';
import { ExitCode } from '../../src/exit-codes.js';
import { parseArgs } from '../../src/parse-args.js';

// Capture stdout and stderr
function captureOutput() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const origStdout = process.stdout.write;
  const origStderr = process.stderr.write;

  process.stdout.write = ((chunk: string) => {
    stdout.push(chunk);
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string) => {
    stderr.push(chunk);
    return true;
  }) as typeof process.stderr.write;

  return {
    stdout,
    stderr,
    restore() {
      process.stdout.write = origStdout;
      process.stderr.write = origStderr;
    },
  };
}

describe('adaptersCommand', () => {
  it('returns USAGE_ERROR for unknown subcommand', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['adapters', 'bogus']);
      const code = await adaptersCommand({} as Parameters<typeof adaptersCommand>[0], args);
      expect(code).toBe(ExitCode.USAGE_ERROR);
      expect(io.stderr.join('')).toContain('Unknown subcommand');
    } finally {
      io.restore();
    }
  });

  it('returns USAGE_ERROR for detect without agent', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['adapters', 'detect']);
      const code = await adaptersCommand({} as Parameters<typeof adaptersCommand>[0], args);
      expect(code).toBe(ExitCode.USAGE_ERROR);
      expect(io.stderr.join('')).toContain('Missing required argument');
    } finally {
      io.restore();
    }
  });

  it('returns USAGE_ERROR for detect without agent in JSON mode', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['adapters', 'detect', '--json']);
      const code = await adaptersCommand({} as Parameters<typeof adaptersCommand>[0], args);
      expect(code).toBe(ExitCode.USAGE_ERROR);
      const output = JSON.parse(io.stdout.join(''));
      expect(output.ok).toBe(false);
      expect(output.error.code).toBe('VALIDATION_ERROR');
    } finally {
      io.restore();
    }
  });

  it('lists adapters with mock client', async () => {
    const io = captureOutput();
    try {
      const mockClient = {
        adapters: {
          list: () => [
            { agent: 'claude', displayName: 'Claude Code', source: 'built-in' },
            { agent: 'codex', displayName: 'Codex', source: 'built-in' },
          ],
        },
      };
      const args = parseArgs(['adapters', 'list']);
      const code = await adaptersCommand(mockClient as Parameters<typeof adaptersCommand>[0], args);
      expect(code).toBe(ExitCode.SUCCESS);
      const output = io.stdout.join('');
      expect(output).toContain('claude');
      expect(output).toContain('codex');
    } finally {
      io.restore();
    }
  });

  it('lists adapters in JSON mode', async () => {
    const io = captureOutput();
    try {
      const mockClient = {
        adapters: {
          list: () => [
            { agent: 'claude', displayName: 'Claude Code', source: 'built-in' },
          ],
        },
      };
      const args = parseArgs(['adapters', 'list', '--json']);
      const code = await adaptersCommand(mockClient as Parameters<typeof adaptersCommand>[0], args);
      expect(code).toBe(ExitCode.SUCCESS);
      const output = JSON.parse(io.stdout.join(''));
      expect(output.ok).toBe(true);
      expect(output.data).toHaveLength(1);
      expect(output.data[0].agent).toBe('claude');
    } finally {
      io.restore();
    }
  });
});

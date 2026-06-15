import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('cli/print', () => {
  let stdoutWrites: string[];
  let stderrWrites: string[];

  beforeEach(() => {
    stdoutWrites = [];
    stderrWrites = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      stdoutWrites.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
      stderrWrites.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns error when no prompt is provided', async () => {
    const { handlePrint } = await import('./print.js');
    const result = await handlePrint({ json: false } as any);
    expect(result).toBe(1);
    expect(stderrWrites.join('')).toContain('No prompt provided');
  });

  it('returns JSON error when no prompt in json mode', async () => {
    const { handlePrint } = await import('./print.js');
    const result = await handlePrint({ json: true } as any);
    expect(result).toBe(1);
    const output = JSON.parse(stdoutWrites[0]);
    expect(output.error).toContain('No prompt provided');
  });

  it('emits JSON start event in json mode', async () => {
    vi.doMock('./harness/createRun.js', () => ({
      handleHarnessCreateRun: vi.fn().mockResolvedValue(0),
    }));

    const { handlePrint } = await import('./print.js');
    const result = await handlePrint({
      prompt: 'test query',
      json: true,
      harness: 'internal',
      workspace: '/tmp',
    } as any);

    expect(stdoutWrites.length).toBeGreaterThanOrEqual(1);
    const startEvent = JSON.parse(stdoutWrites[0]);
    expect(startEvent.event).toBe('start');
    expect(startEvent.prompt).toBe('test query');
  });
});

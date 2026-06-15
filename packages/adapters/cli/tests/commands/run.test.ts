import { describe, it, expect, vi } from 'vitest';
import { ExitCode } from '../../src/exit-codes.js';
import { validateRunFlags, buildRunOptions, RUN_FLAGS, runCommand } from '../../src/commands/run.js';
import { parseArgs } from '../../src/parse-args.js';

describe('validateRunFlags', () => {
  it('returns null for valid flag combinations', () => {
    expect(validateRunFlags({ yolo: true })).toBeNull();
    expect(validateRunFlags({ deny: true })).toBeNull();
    expect(validateRunFlags({ stream: true })).toBeNull();
    expect(validateRunFlags({})).toBeNull();
  });

  it('rejects --session + --no-session', () => {
    const result = validateRunFlags({ session: 'abc', 'no-session': true });
    expect(result).toContain('--session');
    expect(result).toContain('--no-session');
  });

  it('rejects --session + --fork', () => {
    const result = validateRunFlags({ session: 'abc', fork: 'def' });
    expect(result).toContain('--session');
    expect(result).toContain('--fork');
  });

  it('rejects --fork + --no-session', () => {
    const result = validateRunFlags({ fork: 'abc', 'no-session': true });
    expect(result).toContain('--fork');
    expect(result).toContain('--no-session');
  });

  it('rejects --yolo + --deny', () => {
    const result = validateRunFlags({ yolo: true, deny: true });
    expect(result).toContain('--yolo');
    expect(result).toContain('--deny');
  });

  it('rejects --stream + --no-stream', () => {
    const result = validateRunFlags({ stream: true, 'no-stream': true });
    expect(result).toContain('--stream');
    expect(result).toContain('--no-stream');
  });
});

describe('buildRunOptions', () => {
  const agents = new Set(['claude', 'codex', 'gemini']);

  it('resolves agent from first positional when it matches a known agent', () => {
    const args = parseArgs(['run', 'claude', 'hello world'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.agent).toBe('claude');
    expect(result.prompt).toBe('hello world');
  });

  it('treats first positional as prompt when it does not match an agent', () => {
    const args = parseArgs(['run', 'explain this code'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.agent).toBeUndefined();
    expect(result.prompt).toBe('explain this code');
  });

  it('uses --agent flag for agent', () => {
    const args = parseArgs(['run', '--agent', 'claude', 'hello'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.agent).toBe('claude');
    expect(result.prompt).toBe('hello');
  });

  it('uses --prompt flag for prompt text', () => {
    const args = parseArgs(['run', '--agent', 'claude', '--prompt', 'hello flag'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.agent).toBe('claude');
    expect(result.prompt).toBe('hello flag');
  });

  it('still resolves a positional agent when --prompt is used', () => {
    const args = parseArgs(['run', 'claude', '--prompt', 'hello flag'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.agent).toBe('claude');
    expect(result.prompt).toBe('hello flag');
  });

  it('marks runs non-interactive only when --prompt and --non-interactive are both set', () => {
    const args = parseArgs(['run', '--agent', 'claude', '--prompt', 'hello flag', '--non-interactive'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.prompt).toBe('hello flag');
    expect(result.options['nonInteractive']).toBe(true);
  });

  it('does not mark positional prompts as non-interactive', () => {
    const args = parseArgs(['run', '--agent', 'claude', '--non-interactive', 'hello positional'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.prompt).toBe('hello positional');
    expect(Object.prototype.hasOwnProperty.call(result.options, 'nonInteractive')).toBe(false);
  });

  it('prefers explicit interactive mode over prompt-driven non-interactive mode', () => {
    const args = parseArgs(['run', '--agent', 'claude', '--prompt', 'hello flag', '--non-interactive', '--interactive'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.prompt).toBe('hello flag');
    expect(Object.prototype.hasOwnProperty.call(result.options, 'nonInteractive')).toBe(false);
  });

  it('maps --yolo to approvalMode', () => {
    const args = parseArgs(['run', '--yolo'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['approvalMode']).toBe('yolo');
  });

  it('maps --deny to approvalMode', () => {
    const args = parseArgs(['run', '--deny'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['approvalMode']).toBe('deny');
  });

  it('maps --no-stream to stream: false', () => {
    const args = parseArgs(['run', '--no-stream'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['stream']).toBe(false);
  });

  it('maps --stream to stream: true', () => {
    const args = parseArgs(['run', '--stream'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['stream']).toBe(true);
  });

  it('maps --thinking-effort', () => {
    const args = parseArgs(['run', '--thinking-effort', 'high'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['thinkingEffort']).toBe('high');
  });

  it('maps --session', () => {
    const args = parseArgs(['run', '--session', 'abc123'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['sessionId']).toBe('abc123');
  });

  it('maps --no-session', () => {
    const args = parseArgs(['run', '--no-session'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['noSession']).toBe(true);
  });

  it('maps --timeout', () => {
    const args = parseArgs(['run', '--timeout', '30000'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['timeout']).toBe(30000);
  });

  it('maps --tag as array', () => {
    const args = parseArgs(['run', '--tag', 'build', '--tag', 'test'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['tags']).toEqual(['build', 'test']);
  });

  it('maps --env KEY=VALUE pairs', () => {
    const args = parseArgs(['run', '--env', 'FOO=bar', '--env', 'BAZ=qux'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['env']).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('maps --max-output-tokens over --max-tokens', () => {
    const args = parseArgs(['run', '--max-tokens', '1000', '--max-output-tokens', '2000'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['maxOutputTokens']).toBe(2000);
  });

  it('maps --model', () => {
    const args = parseArgs(['run', '--model', 'claude-sonnet-4-20250514'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(result.options['model']).toBe('claude-sonnet-4-20250514');
  });

  it('strips undefined options', () => {
    const args = parseArgs(['run', 'claude', 'hello'], RUN_FLAGS);
    const result = buildRunOptions(args, agents);
    expect(Object.prototype.hasOwnProperty.call(result.options, 'temperature')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result.options, 'topP')).toBe(false);
  });
});


describe('runCommand', () => {
  it('reads a piped prompt from stdin when no explicit prompt is provided', async () => {
    const originalIsTTY = process.stdin.isTTY;
    const originalOn = process.stdin.on.bind(process.stdin);
    const originalSetEncoding = process.stdin.setEncoding.bind(process.stdin);

    const calls: Array<Record<string, unknown>> = [];
    const client = {
      adapters: {
        list: () => [{ agent: 'claude' }],
      },
      run: vi.fn((options: Record<string, unknown>) => {
        calls.push(options);
        return {
          [Symbol.asyncIterator]: async function* () {},
          result: () => Promise.resolve({ type: 'run_result', runId: 'r1', agent: 'claude', text: '', exitCode: 0, exitReason: 'completed', durationMs: 0, turnCount: 1 }),
        };
      }),
    } as unknown as Parameters<typeof runCommand>[0];

    (process.stdin as unknown as { isTTY: boolean }).isTTY = false;
    process.stdin.setEncoding = (() => process.stdin) as typeof process.stdin.setEncoding;
    process.stdin.on = ((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'data') handler('prompt from pipe');
      if (event === 'end') handler();
      return process.stdin;
    }) as typeof process.stdin.on;

    try {
      const code = await runCommand(client, parseArgs(['run', 'claude'], RUN_FLAGS));
      expect(code).toBe(0);
      expect(calls).toHaveLength(1);
      expect(calls[0]?.['prompt']).toBe('prompt from pipe');
    } finally {
      (process.stdin as unknown as { isTTY: boolean | undefined }).isTTY = originalIsTTY;
      process.stdin.on = originalOn;
      process.stdin.setEncoding = originalSetEncoding;
    }
  });

  it('returns a non-zero exit code when the run crashes', async () => {
    const client = {
      adapters: {
        list: () => [{ agent: 'openclaw' }],
      },
      run: vi.fn(() => ({
        [Symbol.asyncIterator]: async function* () {},
        result: () => Promise.resolve({
          type: 'run_result',
          runId: 'r1',
          agent: 'openclaw',
          text: '',
          exitCode: null,
          exitReason: 'crashed',
          durationMs: 0,
          turnCount: 1,
          error: {
            code: 'SPAWN_ERROR',
            message: 'spawn mock-harness EACCES',
            stderr: '',
            recoverable: false,
          },
        }),
      })),
    } as unknown as Parameters<typeof runCommand>[0];

    const code = await runCommand(client, parseArgs(['run', 'openclaw', 'hello'], RUN_FLAGS));
    expect(code).toBe(ExitCode.GENERAL_ERROR);
  });

  it('launches .js mock harness paths through node', async () => {
    const originalMockBin = process.env['AGENT_MUX_MOCK_HARNESS_BIN'];
    process.env['AGENT_MUX_MOCK_HARNESS_BIN'] = '/tmp/mock-harness.js';

    const registry = new Map<string, any>([
      ['openclaw', {
        agent: 'openclaw',
        buildSpawnArgs: () => ({
          command: 'openclaw',
          args: ['run'],
          env: {},
          cwd: process.cwd(),
          usePty: false,
        }),
      }],
    ]);

    const client = {
      adapters: {
        list: () => [{ agent: 'openclaw' }],
        get: (name: string) => registry.get(name),
        unregister: (name: string) => void registry.delete(name),
        register: (adapter: any) => void registry.set(adapter.agent, adapter),
      },
      run: vi.fn((options: Record<string, unknown>) => {
        const adapter = registry.get(options['agent'] as string);
        const spawnArgs = adapter.buildSpawnArgs(options);
        expect(spawnArgs.command).toBe(process.execPath);
        expect(spawnArgs.args).toEqual([
          '/tmp/mock-harness.js',
          '--scenario',
          'openclaw:basic-text',
          '--agent',
          'openclaw',
        ]);

        return {
          [Symbol.asyncIterator]: async function* () {},
          result: () => Promise.resolve({
            type: 'run_result',
            runId: 'r2',
            agent: 'openclaw',
            text: '',
            exitCode: 0,
            exitReason: 'completed',
            durationMs: 0,
            turnCount: 1,
            error: null,
          }),
        };
      }),
    } as unknown as Parameters<typeof runCommand>[0];

    try {
      const code = await runCommand(
        client,
        parseArgs(['run', 'openclaw', '--use-mock-harness', 'hello'], RUN_FLAGS),
      );
      expect(code).toBe(ExitCode.SUCCESS);
    } finally {
      if (originalMockBin === undefined) delete process.env['AGENT_MUX_MOCK_HARNESS_BIN'];
      else process.env['AGENT_MUX_MOCK_HARNESS_BIN'] = originalMockBin;
    }
  });

  it('permits explicit interactive runs without an initial prompt', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = {
      adapters: {
        list: () => [{ agent: 'claude-agent-sdk' }],
        get: () => ({ capabilities: { supportsInteractiveMode: true } }),
      },
      run: vi.fn((options: Record<string, unknown>) => {
        calls.push(options);
        return {
          [Symbol.asyncIterator]: async function* () {},
          result: () => Promise.resolve({ type: 'run_result', runId: 'r-interactive', agent: 'claude-agent-sdk', text: '', exitCode: 0, exitReason: 'completed', durationMs: 0, turnCount: 1 }),
        };
      }),
    } as unknown as Parameters<typeof runCommand>[0];

    const code = await runCommand(client, parseArgs(['run', '--agent', 'claude-agent-sdk', '--interactive'], RUN_FLAGS));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.['prompt']).toBe(' ');
  });

  it('passes interactive flag through to run options (PTY support in spawn-runner)', async () => {
    const client = {
      adapters: {
        list: () => [{ agent: 'codex' }],
        get: () => ({ capabilities: {} }),
      },
      run: vi.fn().mockReturnValue(Object.assign((async function* () {})(), { result: async () => ({ exitReason: 'completed', exitCode: 0 }) })),
    } as unknown as Parameters<typeof runCommand>[0];

    await runCommand(client, parseArgs(['run', '--agent', 'codex', '--interactive', '--prompt', 'hello'], RUN_FLAGS));
    expect(client.run).toHaveBeenCalledWith(expect.objectContaining({ interactive: true }));
  });
});

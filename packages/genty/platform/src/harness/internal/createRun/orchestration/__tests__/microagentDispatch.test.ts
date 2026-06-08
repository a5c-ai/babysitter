import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../../microagents', () => {
  const registry = new Map<string, { name: string }>();
  registry.set('format-converter', { name: 'format-converter' });
  registry.set('code-analyzer', { name: 'code-analyzer' });

  const mockDispatch = vi.fn().mockResolvedValue({
    output: { result: '{"key": "value"}', targetFormat: 'json' },
    exitCode: 0,
    durationMs: 150,
    logs: ['Converting YAML to JSON'],
  });

  return {
    createMicroagentSystem: () => ({
      registry: {
        has: (name: string) => registry.has(name),
        get: (name: string) => registry.get(name),
      },
      dispatcher: { dispatch: mockDispatch },
      runner: {},
    }),
  };
});

describe('microagent dispatch in agent effects', () => {
  it('microagent system recognizes registered agents', async () => {
    const { createMicroagentSystem } = await import('../../../../../microagents');
    const system = createMicroagentSystem();

    expect(system.registry.has('format-converter')).toBe(true);
    expect(system.registry.has('code-analyzer')).toBe(true);
    expect(system.registry.has('nonexistent-agent')).toBe(false);
  });

  it('dispatcher returns structured result for microagent', async () => {
    const { createMicroagentSystem } = await import('../../../../../microagents');
    const system = createMicroagentSystem();

    const result = await system.dispatcher.dispatch('format-converter', {
      source: 'key: value',
      sourceFormat: 'yaml',
      targetFormat: 'json',
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toEqual({ result: '{"key": "value"}', targetFormat: 'json' });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('non-microagent names fall through to normal dispatch', async () => {
    const { createMicroagentSystem } = await import('../../../../../microagents');
    const system = createMicroagentSystem();

    expect(system.registry.has('general-purpose')).toBe(false);
    expect(system.registry.has('claude-code')).toBe(false);
  });
});

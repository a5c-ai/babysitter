import { describe, it, expect } from 'vitest';
import * as adapters from '../src/index.js';

describe('@a5c-ai/adapters meta package', () => {
  it('re-exports core client factory', () => {
    expect(typeof adapters.createClient).toBe('function');
  });

  it('re-exports hooks surface', () => {
    expect(typeof adapters.HookConfigManager).toBe('function');
    expect(typeof adapters.HookDispatcher).toBe('function');
    expect(typeof adapters.builtInHooks).toBe('object');
  });

  it('re-exports adapter classes', () => {
    expect(typeof adapters.ClaudeAdapter).toBe('function');
    expect(typeof adapters.CodexAdapter).toBe('function');
  });

  it('re-exports CLI entry point', () => {
    expect(typeof adapters.parseArgs).toBe('function');
    expect(typeof adapters.registerBuiltInAdapters).toBe('function');
  });

  it('createClient + registerBuiltInAdapters wires all 12 built-ins', () => {
    const client = adapters.createClient();
    adapters.registerBuiltInAdapters(client);
    const names = client.adapters.list().map((a) => a.agent);
    for (const a of ['claude','codex','gemini','copilot','cursor','opencode','pi','omp','openclaw','hermes','adapters-remote','qwen','babysitter']) {
      expect(names).toContain(a);
    }
  });
});

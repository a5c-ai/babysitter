import { describe, it, expect } from 'vitest';
import * as amux from '../src/index.js';

describe('@a5c-ai/agent-mux meta package', () => {
  it('re-exports core client factory', () => {
    expect(typeof amux.createClient).toBe('function');
  });

  it('re-exports hooks surface', () => {
    expect(typeof amux.HookConfigManager).toBe('function');
    expect(typeof amux.HookDispatcher).toBe('function');
    expect(typeof amux.builtInHooks).toBe('object');
  });

  it('re-exports adapter classes', () => {
    expect(typeof amux.ClaudeAdapter).toBe('function');
    expect(typeof amux.CodexAdapter).toBe('function');
  });

  it('re-exports CLI entry point', () => {
    expect(typeof amux.parseArgs).toBe('function');
    expect(typeof amux.registerBuiltInAdapters).toBe('function');
  });

  it('createClient + registerBuiltInAdapters wires all 12 built-ins', () => {
    const client = amux.createClient();
    amux.registerBuiltInAdapters(client);
    const names = client.adapters.list().map((a) => a.agent);
    for (const a of ['claude','codex','gemini','copilot','cursor','opencode','pi','omp','openclaw','hermes','agent-mux-remote','qwen','babysitter']) {
      expect(names).toContain(a);
    }
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamAssembler } from '@a5c-ai/agent-mux-core';
import type { ParseContext } from '@a5c-ai/agent-mux-core';
import { QwenAdapter } from '../src/qwen-adapter.js';

function makeContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    runId: 'test-run-1',
    agent: 'qwen',
    sessionId: undefined,
    turnIndex: 0,
    debug: false,
    outputFormat: 'jsonl',
    source: 'stdout',
    assembler: new StreamAssembler(),
    eventCount: 0,
    lastEventType: null,
    adapterState: {},
    ...overrides,
  };
}

describe('QwenAdapter', () => {
  let adapter: QwenAdapter;

  beforeEach(() => {
    adapter = new QwenAdapter();
  });

  describe('identity', () => {
    it('has correct agent name', () => {
      expect(adapter.agent).toBe('qwen');
    });
    it('has correct display name', () => {
      expect(adapter.displayName).toBe('Qwen Code');
    });
    it('has correct CLI command', () => {
      expect(adapter.cliCommand).toBe('qwen');
    });
  });

  describe('capabilities', () => {
    it('declares agent as qwen', () => {
      expect(adapter.capabilities.agent).toBe('qwen');
    });
    it('supports MCP plugins', () => {
      expect(adapter.capabilities.supportsMCP).toBe(true);
      expect(adapter.capabilities.supportsPlugins).toBe(true);
      expect(adapter.capabilities.pluginFormats).toContain('mcp-server');
    });
    it('conservatively disables thinking and image input', () => {
      expect(adapter.capabilities.supportsThinking).toBe(false);
      expect(adapter.capabilities.supportsImageInput).toBe(false);
    });
    it('has at least one model with a large context window', () => {
      expect(adapter.models.length).toBeGreaterThanOrEqual(1);
      expect(adapter.models[0]!.contextWindow).toBeGreaterThanOrEqual(128000);
    });
    it('all models have agent qwen', () => {
      for (const m of adapter.models) expect(m.agent).toBe('qwen');
    });
  });

  describe('buildSpawnArgs', () => {
    it('sends the initial prompt over stdin by default', () => {
      const r = adapter.buildSpawnArgs({ agent: 'qwen', prompt: 'hi' });
      expect(r.command).toBe('qwen');
      expect(r.args).not.toContain('--prompt');
      expect(r.stdin).toBe('hi\n');
    });

    it('uses --prompt only for explicit non-interactive runs', () => {
      const r = adapter.buildSpawnArgs({ agent: 'qwen', prompt: 'hi', nonInteractive: true });
      expect(r.args).toContain('--prompt');
      expect(r.args).toContain('hi');
      expect(r.stdin).toBeUndefined();
    });

    it('includes --model flag when provided', () => {
      const r = adapter.buildSpawnArgs({ agent: 'qwen', prompt: 'hi', model: 'qwen3-coder-flash' });
      expect(r.args).toContain('--model');
      expect(r.args).toContain('qwen3-coder-flash');
    });

    it('adds --yolo in yolo mode', () => {
      const r = adapter.buildSpawnArgs({ agent: 'qwen', prompt: 'hi', approvalMode: 'yolo' });
      expect(r.args).toContain('--yolo');
    });

    it('joins array prompts with newlines before writing stdin', () => {
      const r = adapter.buildSpawnArgs({ agent: 'qwen', prompt: ['a', 'b'] });
      expect(r.stdin).toBe('a\nb\n');
    });
  });

  describe('parseEvent', () => {
    it('returns null for non-JSON', () => {
      expect(adapter.parseEvent('hello world', makeContext())).toBeNull();
    });
    it('parses text events', () => {
      const ev = adapter.parseEvent(
        JSON.stringify({ type: 'text', content: 'hello' }),
        makeContext(),
      ) as { type: string; delta: string };
      expect(ev.type).toBe('text_delta');
      expect(ev.delta).toBe('hello');
    });
    it('parses tool_call events', () => {
      const ev = adapter.parseEvent(
        JSON.stringify({ type: 'tool_call', id: 't1', name: 'bash', args: { cmd: 'ls' } }),
        makeContext(),
      ) as { type: string; toolName: string };
      expect(ev.type).toBe('tool_call_start');
      expect(ev.toolName).toBe('bash');
    });
    it('parses tool_result events', () => {
      const ev = adapter.parseEvent(
        JSON.stringify({ type: 'tool_result', id: 't1', name: 'bash', output: 'ok' }),
        makeContext(),
      ) as { type: string; output: unknown };
      expect(ev.type).toBe('tool_result');
      expect(ev.output).toBe('ok');
    });
    it('parses error events', () => {
      const ev = adapter.parseEvent(
        JSON.stringify({ type: 'error', message: 'nope' }),
        makeContext(),
      ) as { type: string; message: string };
      expect(ev.type).toBe('error');
      expect(ev.message).toBe('nope');
    });
  });

  describe('detectAuth', () => {
    const originalEnv = process.env;
    beforeEach(() => { process.env = { ...originalEnv }; });
    afterEach(() => { process.env = originalEnv; });

    it('returns authenticated with OPENAI_API_KEY', async () => {
      process.env['OPENAI_API_KEY'] = 'sk-test-qwen-ABCD';
      const state = await adapter.detectAuth();
      expect(state.status).toBe('authenticated');
      expect(state.method).toBe('api_key');
      expect(state.identity).toContain('ABCD');
    });
    it('returns unauthenticated without key', async () => {
      delete process.env['OPENAI_API_KEY'];
      const state = await adapter.detectAuth();
      expect(state.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('returns guidance with DashScope provider', () => {
      const g = adapter.getAuthGuidance();
      expect(g.agent).toBe('qwen');
      expect(g.providerName).toContain('Alibaba');
      expect(g.steps.length).toBeGreaterThan(0);
    });
  });

  describe('sessionDir', () => {
    it('returns a path containing .qwen', () => {
      expect(adapter.sessionDir()).toContain('.qwen');
    });
  });
});

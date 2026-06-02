import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamAssembler } from '@a5c-ai/agent-mux-comm';
import type { ParseContext } from '@a5c-ai/agent-mux-comm';
import { GeminiAdapter } from '../src/gemini-adapter.js';

function makeContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    runId: 'test-run-1',
    agent: 'gemini',
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

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    adapter = new GeminiAdapter();
  });

  describe('identity', () => {
    it('has correct agent name', () => {
      expect(adapter.agent).toBe('gemini');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('Gemini CLI');
    });

    it('has correct CLI command', () => {
      expect(adapter.cliCommand).toBe('gemini');
    });
  });

  describe('capabilities', () => {
    it('declares agent as gemini', () => {
      expect(adapter.capabilities.agent).toBe('gemini');
    });

    it('supports thinking', () => {
      expect(adapter.capabilities.supportsThinking).toBe(true);
    });

    it('supports MCP', () => {
      expect(adapter.capabilities.supportsMCP).toBe(true);
    });

    it('supports image input', () => {
      expect(adapter.capabilities.supportsImageInput).toBe(true);
    });

    it('has large context model', () => {
      const proModel = adapter.models.find(m => m.modelId === 'gemini-2.5-pro');
      expect(proModel).toBeDefined();
      expect(proModel!.contextWindow).toBe(1000000);
    });
  });

  describe('models', () => {
    it('has at least two models', () => {
      expect(adapter.models.length).toBeGreaterThanOrEqual(2);
    });

    it('all models have correct agent', () => {
      for (const model of adapter.models) {
        expect(model.agent).toBe('gemini');
      }
    });
  });

  describe('buildSpawnArgs', () => {
    it('sends the initial prompt over stdin by default', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'gemini',
        prompt: 'Explain this code',
      });

      expect(result.command).toBe('gemini');
      expect(result.args).not.toContain('--prompt');
      expect(result.stdin).toBe('Explain this code\n');
    });

    it('uses --prompt only for explicit non-interactive runs', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'gemini',
        prompt: 'Explain this code',
        nonInteractive: true,
      });

      expect(result.args).toContain('--prompt');
      expect(result.args).toContain('Explain this code');
      expect(result.stdin).toBeUndefined();
    });

    it('includes model flag', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'gemini',
        prompt: 'Test',
        model: 'gemini-2.5-flash',
      });

      expect(result.args).toContain('--model');
      expect(result.args).toContain('gemini-2.5-flash');
    });

    it('disables sandbox for yolo mode', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'gemini',
        prompt: 'Test',
        approvalMode: 'yolo',
      });

      expect(result.args).toContain('--sandbox');
      expect(result.args).toContain('false');
    });
  });

  describe('parseEvent', () => {
    it('returns null for non-JSON', () => {
      expect(adapter.parseEvent('plain text', makeContext())).toBeNull();
    });

    it('parses text events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'text', content: 'Here is the explanation' }),
        makeContext(),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('text_delta');
      expect(event.delta).toBe('Here is the explanation');
    });

    it('parses tool_call events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'tool_call', id: 'tc-1', name: 'search', args: { query: 'test' } }),
        makeContext(),
      );
      const event = result as { type: string; toolName: string };
      expect(event.type).toBe('tool_call_start');
      expect(event.toolName).toBe('search');
    });

    it('parses thinking events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'thinking', content: 'Reasoning...' }),
        makeContext(),
      );
      const event = result as { type: string; delta: string };
      expect(event.type).toBe('thinking_delta');
      expect(event.delta).toBe('Reasoning...');
    });

    it('parses error events', () => {
      const result = adapter.parseEvent(
        JSON.stringify({ type: 'error', message: 'Quota exceeded' }),
        makeContext(),
      );
      const event = result as { type: string; message: string };
      expect(event.type).toBe('error');
      expect(event.message).toBe('Quota exceeded');
    });
  });

  describe('detectAuth', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns authenticated with GOOGLE_API_KEY', async () => {
      process.env['GOOGLE_API_KEY'] = 'AIzaSyTestKey1234';
      delete process.env['GEMINI_API_KEY'];
      const state = await adapter.detectAuth();
      expect(state.status).toBe('authenticated');
      expect(state.method).toBe('api_key');
    });

    it('returns authenticated with GEMINI_API_KEY', async () => {
      delete process.env['GOOGLE_API_KEY'];
      process.env['GEMINI_API_KEY'] = 'AIzaSyTestKey5678';
      const state = await adapter.detectAuth();
      expect(state.status).toBe('authenticated');
      expect(state.method).toBe('api_key');
    });

    it('prefers GOOGLE_API_KEY over GEMINI_API_KEY', async () => {
      process.env['GOOGLE_API_KEY'] = 'AIzaSyGoogleKey_AAAA';
      process.env['GEMINI_API_KEY'] = 'AIzaSyGeminiKey_BBBB';
      const state = await adapter.detectAuth();
      expect(state.identity).toContain('AAAA');
    });

    it('returns unauthenticated without keys', async () => {
      delete process.env['GOOGLE_API_KEY'];
      delete process.env['GEMINI_API_KEY'];
      const state = await adapter.detectAuth();
      expect(state.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('returns valid guidance', () => {
      const guidance = adapter.getAuthGuidance();
      expect(guidance.agent).toBe('gemini');
      expect(guidance.providerName).toBe('Google');
      expect(guidance.steps.length).toBeGreaterThan(0);
    });

    it('includes both API key env vars', () => {
      const guidance = adapter.getAuthGuidance();
      const envVarNames = guidance.envVars!.map(v => typeof v === 'string' ? v : v.name);
      expect(envVarNames).toContain('GOOGLE_API_KEY');
      expect(envVarNames).toContain('GEMINI_API_KEY');
    });
  });

  describe('sessionDir', () => {
    it('returns a path containing .gemini', () => {
      expect(adapter.sessionDir()).toContain('.gemini');
    });
  });

  describe('configSchema', () => {
    it('has json format', () => {
      expect(adapter.configSchema.configFormat).toBe('json');
    });
  });

  describe('placeholder methods', () => {
    it('listSessionFiles returns an array', async () => {
      expect(Array.isArray(await adapter.listSessionFiles())).toBe(true);
    });

    it('parseSessionFile returns minimal session', async () => {
      const session = await adapter.parseSessionFile('/nonexistent-dir/my-session.jsonl');
      expect(session.agent).toBe('gemini');
      expect(session.sessionId).toBe('my-session');
    });

    it('readConfig returns default', async () => {
      const config = await adapter.readConfig();
      expect(config.agent).toBe('gemini');
    });

    it('writeConfig writes to configured path', async () => {
      const os = await import('node:os');
      const path = await import('node:path');
      const fs = await import('node:fs/promises');
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-cfg-'));
      const tmpFile = path.join(tmpDir, 'settings.json');
      Object.defineProperty(adapter, 'configSchema', {
        value: { ...adapter.configSchema, configFilePaths: [tmpFile] },
        configurable: true,
      });
      await adapter.writeConfig({ model: 'test' });
      const written = JSON.parse(await fs.readFile(tmpFile, 'utf8'));
      expect(written.model).toBe('test');
      await fs.rm(tmpDir, { recursive: true, force: true });
    });
  });
});

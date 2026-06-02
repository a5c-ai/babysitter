import { describe, it, expect } from 'vitest';
import type { ProviderConfig, AgentName } from '@a5c-ai/agent-mux-comm';
import { translateForHarness } from '../src/translate-for-harness.js';

function makeConfig(overrides: Partial<ProviderConfig> & { provider: ProviderConfig['provider'] }): ProviderConfig {
  return {
    provider: overrides.provider,
    model: overrides.model ?? 'some-model',
    transport: overrides.transport ?? 'openai-chat',
    auth: overrides.auth ?? { type: 'api_key' },
    params: overrides.params ?? {},
  };
}

describe('translateForHarness', () => {
  describe('dispatches to claude translator', () => {
    it('sets ANTHROPIC_API_KEY for anthropic provider', () => {
      const result = translateForHarness('claude', makeConfig({
        provider: 'anthropic',
        auth: { type: 'api_key', apiKey: 'sk-ant' },
      }));
      expect(result.env['ANTHROPIC_API_KEY']).toBe('sk-ant');
      expect(result.proxyRequired).toBe(false);
    });

    it('sets CLAUDE_CODE_USE_BEDROCK for bedrock provider', () => {
      const result = translateForHarness('claude', makeConfig({ provider: 'bedrock', auth: { type: 'iam' } }));
      expect(result.env['CLAUDE_CODE_USE_BEDROCK']).toBe('1');
    });
  });

  describe('dispatches to codex translator', () => {
    it('sets OPENAI_API_KEY for openai provider', () => {
      const result = translateForHarness('codex', makeConfig({
        provider: 'openai',
        auth: { type: 'api_key', apiKey: 'sk-openai' },
      }));
      expect(result.env['OPENAI_API_KEY']).toBe('sk-openai');
      expect(result.proxyRequired).toBe(false);
    });

    it('adds --oss for ollama provider', () => {
      const result = translateForHarness('codex', makeConfig({ provider: 'ollama', auth: { type: 'none' } }));
      expect(result.args).toContain('--oss');
    });
  });

  describe('dispatches to gemini translator', () => {
    it('sets Google API env aliases for google provider', () => {
      const result = translateForHarness('gemini', makeConfig({
        provider: 'google',
        auth: { type: 'api_key', apiKey: 'gai-key' },
      }));
      expect(result.env['GOOGLE_API_KEY']).toBe('gai-key');
      expect(result.env['GEMINI_API_KEY']).toBe('gai-key');
      expect(result.proxyRequired).toBe(false);
    });

    it('sets GOOGLE_GENAI_USE_VERTEXAI for vertex provider', () => {
      const result = translateForHarness('gemini', makeConfig({ provider: 'vertex', auth: { type: 'adc' } }));
      expect(result.env['GOOGLE_GENAI_USE_VERTEXAI']).toBe('True');
      expect(result.env['GOOGLE_CLOUD_LOCATION']).toBe('global');
    });
  });

  describe('dispatches qwen to gemini translator', () => {
    it('sets GEMINI_API_KEY for google provider via qwen agent', () => {
      const result = translateForHarness('qwen', makeConfig({
        provider: 'google',
        auth: { type: 'api_key', apiKey: 'gai-qwen-key' },
      }));
      expect(result.env['GEMINI_API_KEY']).toBe('gai-qwen-key');
      expect(result.proxyRequired).toBe(false);
    });

    it('returns proxy for unsupported provider via qwen', () => {
      const result = translateForHarness('qwen', makeConfig({ provider: 'anthropic', auth: { type: 'api_key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('google');
    });
  });

  describe('dispatches to opencode translator', () => {
    it('sets OPENCODE_CONFIG_CONTENT for anthropic provider', () => {
      const result = translateForHarness('opencode', makeConfig({
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        auth: { type: 'api_key', apiKey: 'sk-ant' },
      }));
      expect(result.env['OPENCODE_CONFIG_CONTENT']).toBeDefined();
      const cfg = JSON.parse(result.env['OPENCODE_CONFIG_CONTENT']!);
      expect(cfg.model).toBe('anthropic/claude-sonnet-4');
    });
  });

  describe('unknown agents fall back to proxy', () => {
    it('returns proxyRequired=true for unknown agent', () => {
      const result = translateForHarness('copilot' as AgentName, makeConfig({ provider: 'openai', auth: { type: 'api_key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.env).toEqual({});
      expect(result.args).toEqual([]);
    });

    it('returns correct default transport for copilot', () => {
      const result = translateForHarness('copilot' as AgentName, makeConfig({ provider: 'openai', auth: { type: 'api_key' } }));
      expect(result.proxyExposedTransport).toBe('openai-chat');
    });

    it('returns correct default transport for cursor', () => {
      const result = translateForHarness('cursor' as AgentName, makeConfig({ provider: 'anthropic', auth: { type: 'api_key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('openai-chat');
    });

    it('returns openai-chat for truly unknown agent name', () => {
      const result = translateForHarness('unknown-agent' as AgentName, makeConfig({ provider: 'openai', auth: { type: 'api_key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('openai-chat');
    });
  });

  describe('dispatches to pi translator', () => {
    it('returns proxyRequired=true for pi with foundry (uses proxy for chat completions)', () => {
      const config = makeConfig({ provider: 'foundry' as any, transport: 'openai-chat' as any, auth: { type: 'api_key' as const, apiKey: 'azkey' }, params: { apiBase: 'https://myres.services.ai.azure.com' } });
      const r = translateForHarness('pi' as AgentName, config);
      expect(r.proxyRequired).toBe(true);
      expect(r.proxyExposedTransport).toBe('openai-chat');
    });

    it('returns proxyRequired=false for pi with custom provider', () => {
      const config = makeConfig({ provider: 'custom' as any, transport: 'openai-chat' as any, auth: { type: 'api_key' as const, apiKey: 'key' }, params: { apiBase: 'http://localhost:8080' } });
      const r = translateForHarness('pi' as AgentName, config);
      expect(r.proxyRequired).toBe(false);
      expect(r.env['OPENAI_BASE_URL']).toBe('http://localhost:8080');
    });

    it('returns proxyRequired=true for pi with unsupported provider', () => {
      const config = makeConfig({ provider: 'groq' as any, transport: 'openai-chat' as any, auth: { type: 'api_key' as const, apiKey: 'gsk' } });
      const r = translateForHarness('pi' as AgentName, config);
      expect(r.proxyRequired).toBe(true);
      expect(r.proxyExposedTransport).toBe('openai-chat');
    });
  });
});

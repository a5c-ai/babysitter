import { describe, it, expect } from 'vitest';
import type { ProviderConfig } from '@a5c-ai/agent-mux-comm';
import { translateForCodex } from '../src/translations/codex-translation.js';

function makeConfig(overrides: Partial<ProviderConfig> & { provider: ProviderConfig['provider'] }): ProviderConfig {
  return {
    provider: overrides.provider,
    model: overrides.model ?? 'gpt-4o',
    transport: overrides.transport ?? 'openai-responses',
    auth: overrides.auth ?? { type: 'api_key' },
    params: overrides.params ?? {},
  };
}

describe('translateForCodex', () => {
  describe('openai provider', () => {
    it('sets OPENAI_API_KEY from auth.apiKey', () => {
      const result = translateForCodex(makeConfig({ provider: 'openai', auth: { type: 'api_key', apiKey: 'sk-openai-key' } }));
      expect(result.env['OPENAI_API_KEY']).toBe('sk-openai-key');
      expect(result.proxyRequired).toBe(false);
    });

    it('omits OPENAI_API_KEY when auth.apiKey is absent', () => {
      const result = translateForCodex(makeConfig({ provider: 'openai', auth: { type: 'api_key' } }));
      expect(result.env['OPENAI_API_KEY']).toBeUndefined();
      expect(result.proxyRequired).toBe(false);
    });

    it('returns empty args', () => {
      const result = translateForCodex(makeConfig({ provider: 'openai', auth: { type: 'api_key', apiKey: 'sk-key' } }));
      expect(result.args).toEqual([]);
    });
  });

  describe('ollama provider', () => {
    it('ollama: uses --oss flag and sets API key', () => {
      const r = translateForCodex(makeConfig({
        provider: 'ollama', model: 'qwen3:32b', transport: 'openai-chat',
        auth: { type: 'none' },
      }));
      expect(r.proxyRequired).toBe(false);
      expect(r.args).toContain('--oss');
      expect(r.env['OPENAI_API_KEY']).toBe('ollama');
    });
  });

  describe('openai-compatible providers', () => {
    it('sets OPENAI_BASE_URL from params.apiBase for groq', () => {
      const result = translateForCodex(makeConfig({
        provider: 'groq',
        auth: { type: 'api_key', apiKey: 'gsk-key' },
        params: { apiBase: 'https://api.groq.com/openai' },
      }));
      expect(result.env['OPENAI_BASE_URL']).toBe('https://api.groq.com/openai');
      expect(result.env['OPENAI_API_KEY']).toBe('gsk-key');
      expect(result.args).toContain('-c');
      expect(result.args).toContain('openai_base_url=https://api.groq.com/openai');
      expect(result.proxyRequired).toBe(false);
    });

    it('sets OPENAI_BASE_URL for fireworks', () => {
      const result = translateForCodex(makeConfig({
        provider: 'fireworks',
        auth: { type: 'api_key', apiKey: 'fw-key' },
        params: { apiBase: 'https://api.fireworks.ai/inference' },
      }));
      expect(result.env['OPENAI_BASE_URL']).toBe('https://api.fireworks.ai/inference');
    });

    it('sets OPENAI_BASE_URL for custom provider', () => {
      const result = translateForCodex(makeConfig({
        provider: 'custom',
        auth: { type: 'api_key', apiKey: 'custom-key' },
        params: { apiBase: 'https://my-custom-endpoint.com/v1' },
      }));
      expect(result.env['OPENAI_BASE_URL']).toBe('https://my-custom-endpoint.com/v1');
      expect(result.env['OPENAI_API_KEY']).toBe('custom-key');
      expect(result.args).toContain('openai_base_url=https://my-custom-endpoint.com/v1');
    });

    it('omits OPENAI_BASE_URL when params.apiBase is absent', () => {
      const result = translateForCodex(makeConfig({
        provider: 'groq',
        auth: { type: 'api_key', apiKey: 'gsk-key' },
      }));
      expect(result.env['OPENAI_BASE_URL']).toBeUndefined();
    });

    it('handles deepseek', () => {
      const result = translateForCodex(makeConfig({
        provider: 'deepseek',
        auth: { type: 'api_key', apiKey: 'ds-key' },
        params: { apiBase: 'https://api.deepseek.com' },
      }));
      expect(result.proxyRequired).toBe(false);
      expect(result.env['OPENAI_API_KEY']).toBe('ds-key');
    });

    it('handles openrouter', () => {
      const result = translateForCodex(makeConfig({
        provider: 'openrouter',
        auth: { type: 'api_key', apiKey: 'or-key' },
        params: { apiBase: 'https://openrouter.ai/api' },
      }));
      expect(result.proxyRequired).toBe(false);
      expect(result.env['OPENAI_BASE_URL']).toBe('https://openrouter.ai/api');
    });
  });

  describe('unsupported providers', () => {
    it('returns proxyRequired=true for bedrock', () => {
      const result = translateForCodex(makeConfig({ provider: 'bedrock', auth: { type: 'iam' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('openai-responses');
    });

    it('returns proxyRequired=true for anthropic', () => {
      const result = translateForCodex(makeConfig({ provider: 'anthropic', auth: { type: 'api_key', apiKey: 'sk-ant' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('openai-responses');
    });

    it('returns proxyRequired=true for google', () => {
      const result = translateForCodex(makeConfig({ provider: 'google', auth: { type: 'api_key', apiKey: 'gai-key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('openai-responses');
    });

    it('clears ANTHROPIC_API_KEY for unsupported providers routed through proxy', () => {
      const result = translateForCodex(makeConfig({ provider: 'bedrock', auth: { type: 'iam' } }));
      expect(result.env).toEqual({ ANTHROPIC_API_KEY: '' });
      expect(result.proxyRequired).toBe(true);
    });
  });
});

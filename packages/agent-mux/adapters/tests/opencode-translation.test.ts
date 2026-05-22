import { describe, it, expect } from 'vitest';
import type { ProviderConfig } from '@a5c-ai/agent-mux-core';
import { translateForOpenCode } from '../src/translations/opencode-translation.js';

function makeConfig(overrides: Partial<ProviderConfig> & { provider: ProviderConfig['provider'] }): ProviderConfig {
  return {
    provider: overrides.provider,
    model: overrides.model ?? 'default-model',
    transport: overrides.transport ?? 'openai-chat',
    auth: overrides.auth ?? { type: 'api_key' },
    params: overrides.params ?? {},
  };
}

function parseConfigContent(env: Record<string, string>): Record<string, unknown> {
  const content = env['OPENCODE_CONFIG_CONTENT'];
  expect(content).toBeDefined();
  return JSON.parse(content!);
}

describe('translateForOpenCode', () => {
  describe('anthropic provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with @ai-sdk/anthropic', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        auth: { type: 'api_key', apiKey: 'sk-ant-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/anthropic' });
    });

    it('sets ANTHROPIC_API_KEY', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'anthropic',
        auth: { type: 'api_key', apiKey: 'sk-ant-key' },
      }));
      expect(result.env['ANTHROPIC_API_KEY']).toBe('sk-ant-key');
    });

    it('sets correct model path in config', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'anthropic',
        model: 'claude-opus-4',
        auth: { type: 'api_key', apiKey: 'sk-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.model as Record<string, unknown>)['default']).toBe('amux/claude-opus-4');
    });

    it('returns proxyRequired=false', () => {
      const result = translateForOpenCode(makeConfig({ provider: 'anthropic', auth: { type: 'api_key' } }));
      expect(result.proxyRequired).toBe(false);
    });
  });

  describe('openai provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with @ai-sdk/openai', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'openai',
        model: 'gpt-4o',
        auth: { type: 'api_key', apiKey: 'sk-openai-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/openai' });
    });

    it('sets OPENAI_API_KEY', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'openai',
        auth: { type: 'api_key', apiKey: 'sk-openai-key' },
      }));
      expect(result.env['OPENAI_API_KEY']).toBe('sk-openai-key');
    });
  });

  describe('google provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with @ai-sdk/google', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'google',
        model: 'gemini-2.5-pro',
        auth: { type: 'api_key', apiKey: 'gai-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/google' });
    });

    it('sets GOOGLE_GENERATIVE_AI_API_KEY', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'google',
        auth: { type: 'api_key', apiKey: 'gai-key' },
      }));
      expect(result.env['GOOGLE_GENERATIVE_AI_API_KEY']).toBe('gai-key');
    });
  });

  describe('vertex provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with @ai-sdk/google-vertex', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'vertex',
        model: 'claude-sonnet-4',
        auth: { type: 'adc' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/google-vertex' });
    });

    it('does not set an env key for adc auth', () => {
      const result = translateForOpenCode(makeConfig({ provider: 'vertex', auth: { type: 'adc' } }));
      expect(result.env['ANTHROPIC_API_KEY']).toBeUndefined();
      expect(result.env['GOOGLE_GENERATIVE_AI_API_KEY']).toBeUndefined();
    });
  });

  describe('bedrock provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with @ai-sdk/amazon-bedrock', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'bedrock',
        model: 'anthropic.claude-sonnet-4',
        auth: { type: 'iam' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/amazon-bedrock' });
    });
  });

  describe('azure provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with @ai-sdk/azure', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'azure',
        model: 'gpt-4o',
        auth: { type: 'api_key', apiKey: 'az-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/azure' });
    });
  });

  describe('openai-compatible fallback providers', () => {
    it('uses @ai-sdk/openai-compatible for groq', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'groq',
        model: 'llama-4-scout-17b',
        auth: { type: 'api_key', apiKey: 'gsk-key' },
        params: { apiBase: 'https://api.groq.com/openai' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/openai-compatible' });
    });

    it('sets baseURL in options from params.apiBase for groq', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'groq',
        model: 'llama-4-scout-17b',
        auth: { type: 'api_key', apiKey: 'gsk-key' },
        params: { apiBase: 'https://api.groq.com/openai' },
      }));
      const cfg = parseConfigContent(result.env);
      const amux = (cfg.provider as Record<string, unknown>)['amux'] as Record<string, unknown>;
      expect((amux['options'] as Record<string, string>)['baseURL']).toBe('https://api.groq.com/openai');
    });

    it('sets OPENAI_API_KEY for groq fallback', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'groq',
        auth: { type: 'api_key', apiKey: 'gsk-key' },
      }));
      expect(result.env['OPENAI_API_KEY']).toBe('gsk-key');
    });

    it('uses @ai-sdk/openai-compatible for deepseek', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'deepseek',
        model: 'deepseek-chat',
        auth: { type: 'api_key', apiKey: 'ds-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/openai-compatible' });
    });

    it('uses @ai-sdk/openai-compatible for ollama', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'ollama',
        model: 'qwen3:latest',
        auth: { type: 'none' },
        params: { apiBase: 'http://localhost:11434' },
      }));
      const cfg = parseConfigContent(result.env);
      expect((cfg.provider as Record<string, unknown>)['amux']).toMatchObject({ npm: '@ai-sdk/openai-compatible' });
    });

    it('omits baseURL in options when params.apiBase is absent', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'groq',
        auth: { type: 'api_key', apiKey: 'gsk-key' },
      }));
      const cfg = parseConfigContent(result.env);
      const amux = (cfg.provider as Record<string, unknown>)['amux'] as Record<string, unknown>;
      expect(amux['options']).toEqual({});
    });

    it('returns proxyRequired=false for fallback', () => {
      const result = translateForOpenCode(makeConfig({ provider: 'groq', auth: { type: 'api_key' } }));
      expect(result.proxyRequired).toBe(false);
    });
  });

  describe('config schema', () => {
    it('includes $schema field', () => {
      const result = translateForOpenCode(makeConfig({ provider: 'anthropic', auth: { type: 'api_key' } }));
      const cfg = parseConfigContent(result.env);
      expect(cfg['$schema']).toBe('https://opencode.ai/config.json');
    });

    it('returns empty args', () => {
      const result = translateForOpenCode(makeConfig({ provider: 'anthropic', auth: { type: 'api_key' } }));
      expect(result.args).toEqual([]);
    });
  });
});

import { describe, it, expect } from 'vitest';
import type { ProviderConfig } from '@a5c-ai/agent-mux-comm';
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
    it('sets OPENCODE_CONFIG_CONTENT with anthropic built-in provider', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        auth: { type: 'api_key', apiKey: 'sk-ant-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect(cfg.model).toBe('anthropic/claude-sonnet-4');
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
      expect(cfg.model).toBe('anthropic/claude-opus-4');
    });

    it('returns proxyRequired=false', () => {
      const result = translateForOpenCode(makeConfig({ provider: 'anthropic', auth: { type: 'api_key' } }));
      expect(result.proxyRequired).toBe(false);
    });
  });

  describe('openai provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with openai built-in provider', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'openai',
        model: 'gpt-4o',
        auth: { type: 'api_key', apiKey: 'sk-openai' },
      }));
      const cfg = parseConfigContent(result.env);
      expect(cfg.model).toBe('openai/gpt-4o');
    });

    it('sets OPENAI_API_KEY', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'openai',
        auth: { type: 'api_key', apiKey: 'sk-openai' },
      }));
      expect(result.env['OPENAI_API_KEY']).toBe('sk-openai');
    });
  });

  describe('google provider', () => {
    it('sets OPENCODE_CONFIG_CONTENT with google built-in provider', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'google',
        model: 'gemini-2.5-flash',
        auth: { type: 'api_key', apiKey: 'google-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect(cfg.model).toBe('google/gemini-2.5-flash');
    });

    it('sets GOOGLE_GENERATIVE_AI_API_KEY', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'google',
        auth: { type: 'api_key', apiKey: 'google-key' },
      }));
      expect(result.env['GOOGLE_GENERATIVE_AI_API_KEY']).toBe('google-key');
    });
  });

  describe('non-builtin providers route through proxy', () => {
    it('uses openai provider with proxy for vertex', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'vertex' as ProviderConfig['provider'],
        model: 'gemini-pro',
        auth: { type: 'api_key', apiKey: 'vtx-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect(cfg.model).toBe('openai/gemini-pro');
      expect(result.proxyRequired).toBe(true);
    });

    it('uses openai provider with proxy for bedrock', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'bedrock' as ProviderConfig['provider'],
        model: 'claude-3-haiku',
        auth: { type: 'api_key', apiKey: 'aws-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect(cfg.model).toBe('openai/claude-3-haiku');
      expect(result.proxyRequired).toBe(true);
    });

    it('uses openai provider with proxy for azure', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'azure' as ProviderConfig['provider'],
        model: 'gpt-4',
        auth: { type: 'api_key', apiKey: 'azure-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect(cfg.model).toBe('openai/gpt-4');
      expect(result.proxyRequired).toBe(true);
    });

    it('sets OPENAI_API_KEY from auth for proxy providers', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'groq' as ProviderConfig['provider'],
        model: 'llama-3',
        auth: { type: 'api_key', apiKey: 'groq-key' },
      }));
      expect(result.env['OPENAI_API_KEY']).toBe('groq-key');
      expect(result.proxyRequired).toBe(true);
    });

    it('includes provider config with openai options', () => {
      const result = translateForOpenCode(makeConfig({
        provider: 'deepseek' as ProviderConfig['provider'],
        model: 'deepseek-coder',
        auth: { type: 'api_key', apiKey: 'ds-key' },
      }));
      const cfg = parseConfigContent(result.env);
      expect(cfg.provider).toMatchObject({
        openai: { options: { baseURL: '' } },
      });
    });
  });
});

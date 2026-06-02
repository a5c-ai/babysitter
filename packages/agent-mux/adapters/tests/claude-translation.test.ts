import { describe, it, expect } from 'vitest';
import type { ProviderConfig } from '@a5c-ai/agent-mux-comm';
import { translateForClaude } from '../src/translations/claude-translation.js';

function makeConfig(overrides: Partial<ProviderConfig> & { provider: ProviderConfig['provider'] }): ProviderConfig {
  return {
    provider: overrides.provider,
    model: overrides.model ?? 'claude-sonnet-4',
    transport: overrides.transport ?? 'anthropic',
    auth: overrides.auth ?? { type: 'api_key' },
    params: overrides.params ?? {},
  };
}

describe('translateForClaude', () => {
  describe('anthropic provider', () => {
    it('sets ANTHROPIC_API_KEY from auth.apiKey', () => {
      const result = translateForClaude(makeConfig({ provider: 'anthropic', auth: { type: 'api_key', apiKey: 'sk-test-key' } }));
      expect(result.env['ANTHROPIC_API_KEY']).toBe('sk-test-key');
      expect(result.proxyRequired).toBe(false);
    });

    it('sets ANTHROPIC_MODEL from model', () => {
      const result = translateForClaude(makeConfig({ provider: 'anthropic', model: 'claude-opus-4', auth: { type: 'api_key', apiKey: 'sk-key' } }));
      expect(result.env['ANTHROPIC_MODEL']).toBe('claude-opus-4');
      expect(result.proxyRequired).toBe(false);
    });

    it('omits ANTHROPIC_API_KEY when auth.apiKey is absent', () => {
      const result = translateForClaude(makeConfig({ provider: 'anthropic', auth: { type: 'iam' } }));
      expect(result.env['ANTHROPIC_API_KEY']).toBeUndefined();
      expect(result.proxyRequired).toBe(false);
    });

    it('returns empty args array', () => {
      const result = translateForClaude(makeConfig({ provider: 'anthropic' }));
      expect(result.args).toEqual([]);
    });
  });

  describe('bedrock provider', () => {
    it('sets CLAUDE_CODE_USE_BEDROCK=1', () => {
      const result = translateForClaude(makeConfig({ provider: 'bedrock', auth: { type: 'iam' } }));
      expect(result.env['CLAUDE_CODE_USE_BEDROCK']).toBe('1');
      expect(result.proxyRequired).toBe(false);
    });

    it('sets AWS_REGION from params.region', () => {
      const result = translateForClaude(makeConfig({ provider: 'bedrock', auth: { type: 'iam' }, params: { region: 'us-east-1' } }));
      expect(result.env['AWS_REGION']).toBe('us-east-1');
    });

    it('sets AWS_PROFILE from auth.awsProfile', () => {
      const result = translateForClaude(makeConfig({ provider: 'bedrock', auth: { type: 'iam', awsProfile: 'my-profile' } }));
      expect(result.env['AWS_PROFILE']).toBe('my-profile');
    });

    it('omits AWS_REGION when not in params', () => {
      const result = translateForClaude(makeConfig({ provider: 'bedrock', auth: { type: 'iam' } }));
      expect(result.env['AWS_REGION']).toBeUndefined();
    });
  });

  describe('vertex provider', () => {
    it('sets CLAUDE_CODE_USE_VERTEX=1', () => {
      const result = translateForClaude(makeConfig({ provider: 'vertex', auth: { type: 'adc' } }));
      expect(result.env['CLAUDE_CODE_USE_VERTEX']).toBe('1');
      expect(result.proxyRequired).toBe(false);
    });

    it('sets GOOGLE_CLOUD_PROJECT from params.project', () => {
      const result = translateForClaude(makeConfig({ provider: 'vertex', auth: { type: 'adc' }, params: { project: 'my-gcp-project' } }));
      expect(result.env['GOOGLE_CLOUD_PROJECT']).toBe('my-gcp-project');
    });

    it('sets GOOGLE_CLOUD_LOCATION from params.region', () => {
      const result = translateForClaude(makeConfig({ provider: 'vertex', auth: { type: 'adc' }, params: { region: 'us-central1' } }));
      expect(result.env['GOOGLE_CLOUD_LOCATION']).toBe('us-central1');
    });

    it('routes Gemini models on Vertex through transport-mux', () => {
      const result = translateForClaude(makeConfig({ provider: 'vertex', model: 'gemini-3.1-pro-preview', auth: { type: 'adc', apiKey: 'google-key' } }));
      expect(result.env).toEqual({ ANTHROPIC_API_KEY: '' });
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('anthropic');
    });
  });

  describe('foundry provider', () => {
    it('routes Foundry through transport-mux with Claude-facing Anthropic transport', () => {
      const result = translateForClaude(makeConfig({ provider: 'foundry', model: 'gpt-5.5', auth: { type: 'api_key', apiKey: 'az-key' } }));
      expect(result.env).toEqual({ ANTHROPIC_API_KEY: '' });
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('anthropic');
    });
  });

  describe('ollama provider', () => {
    it('ollama: sets ANTHROPIC_BASE_URL and dummy auth', () => {
      const result = translateForClaude(makeConfig({
        provider: 'ollama',
        model: 'qwen3:32b',
        transport: 'openai-chat',
        auth: { type: 'none' },
        params: { apiBase: 'http://localhost:11434' },
      }));
      expect(result.proxyRequired).toBe(false);
      expect(result.env['ANTHROPIC_BASE_URL']).toBe('http://localhost:11434');
      expect(result.env['ANTHROPIC_AUTH_TOKEN']).toBe('ollama');
      expect(result.env['ANTHROPIC_DEFAULT_SONNET_MODEL']).toBe('qwen3:32b');
    });

    it('ollama: uses default base URL when apiBase not provided', () => {
      const result = translateForClaude(makeConfig({ provider: 'ollama', auth: { type: 'none' } }));
      expect(result.proxyRequired).toBe(false);
      expect(result.env['ANTHROPIC_BASE_URL']).toBe('http://localhost:11434');
    });
  });

  describe('unsupported providers', () => {
    it('returns proxyRequired=true for openai', () => {
      const result = translateForClaude(makeConfig({ provider: 'openai', auth: { type: 'api_key', apiKey: 'sk-key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('anthropic');
    });

    it('returns proxyRequired=true for groq', () => {
      const result = translateForClaude(makeConfig({ provider: 'groq', auth: { type: 'api_key', apiKey: 'gsk-key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('anthropic');
    });

    it('clears ANTHROPIC_API_KEY for unsupported providers routed through proxy', () => {
      const result = translateForClaude(makeConfig({ provider: 'openai', model: 'gpt-4o', auth: { type: 'api_key' } }));
      expect(result.env).toEqual({ ANTHROPIC_API_KEY: '' });
      expect(result.proxyRequired).toBe(true);
    });
  });
});

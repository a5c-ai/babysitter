import { describe, it, expect } from 'vitest';
import type { ProviderConfig } from '@a5c-ai/agent-mux-comm';
import { translateForGemini } from '../src/translations/gemini-translation.js';

function makeConfig(overrides: Partial<ProviderConfig> & { provider: ProviderConfig['provider'] }): ProviderConfig {
  return {
    provider: overrides.provider,
    model: overrides.model ?? 'gemini-2.5-pro',
    transport: overrides.transport ?? 'google',
    auth: overrides.auth ?? { type: 'api_key' },
    params: overrides.params ?? {},
  };
}

describe('translateForGemini', () => {
  describe('google provider', () => {
    it('sets Google API env aliases from auth.apiKey', () => {
      const result = translateForGemini(makeConfig({ provider: 'google', auth: { type: 'api_key', apiKey: 'gai-test-key' } }));
      expect(result.env['GOOGLE_API_KEY']).toBe('gai-test-key');
      expect(result.env['GEMINI_API_KEY']).toBe('gai-test-key');
      expect(result.proxyRequired).toBe(false);
    });

    it('omits Google API env aliases when auth.apiKey is absent', () => {
      const result = translateForGemini(makeConfig({ provider: 'google', auth: { type: 'api_key' } }));
      expect(result.env['GOOGLE_API_KEY']).toBeUndefined();
      expect(result.env['GEMINI_API_KEY']).toBeUndefined();
      expect(result.proxyRequired).toBe(false);
    });

    it('returns empty args', () => {
      const result = translateForGemini(makeConfig({ provider: 'google', auth: { type: 'api_key', apiKey: 'key' } }));
      expect(result.args).toEqual([]);
    });
  });

  describe('vertex provider', () => {
    it('sets GOOGLE_GENAI_USE_VERTEXAI=True', () => {
      const result = translateForGemini(makeConfig({ provider: 'vertex', auth: { type: 'adc' } }));
      expect(result.env['GOOGLE_GENAI_USE_VERTEXAI']).toBe('True');
      expect(result.env['GOOGLE_CLOUD_LOCATION']).toBe('global');
      expect(result.proxyRequired).toBe(false);
    });

    it('sets GOOGLE_CLOUD_PROJECT from params.project', () => {
      const result = translateForGemini(makeConfig({
        provider: 'vertex',
        auth: { type: 'adc' },
        params: { project: 'my-vertex-project' },
      }));
      expect(result.env['GOOGLE_CLOUD_PROJECT']).toBe('my-vertex-project');
    });

    it('sets GOOGLE_CLOUD_LOCATION from params.region', () => {
      const result = translateForGemini(makeConfig({
        provider: 'vertex',
        auth: { type: 'adc' },
        params: { region: 'us-east4' },
      }));
      expect(result.env['GOOGLE_CLOUD_LOCATION']).toBe('us-east4');
    });

    it('passes GOOGLE_API_KEY when auth.apiKey is configured', () => {
      const result = translateForGemini(makeConfig({ provider: 'vertex', auth: { type: 'adc', apiKey: 'google-key' } }));
      expect(result.env['GOOGLE_API_KEY']).toBe('google-key');
    });

    it('omits GOOGLE_CLOUD_PROJECT when not in params', () => {
      const result = translateForGemini(makeConfig({ provider: 'vertex', auth: { type: 'adc' } }));
      expect(result.env['GOOGLE_CLOUD_PROJECT']).toBeUndefined();
    });
  });

  describe('unsupported providers', () => {
    it('returns proxyRequired=true for anthropic', () => {
      const result = translateForGemini(makeConfig({ provider: 'anthropic', auth: { type: 'api_key', apiKey: 'sk-ant' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('google');
    });

    it('returns proxyRequired=true for openai', () => {
      const result = translateForGemini(makeConfig({ provider: 'openai', auth: { type: 'api_key', apiKey: 'sk-key' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('google');
    });

    it('returns proxyRequired=true for bedrock', () => {
      const result = translateForGemini(makeConfig({ provider: 'bedrock', auth: { type: 'iam' } }));
      expect(result.proxyRequired).toBe(true);
      expect(result.proxyExposedTransport).toBe('google');
    });

    it('returns empty env for unsupported providers', () => {
      const result = translateForGemini(makeConfig({ provider: 'anthropic', auth: { type: 'api_key' } }));
      expect(result.env).toEqual({});
      expect(result.args).toEqual([]);
    });
  });
});

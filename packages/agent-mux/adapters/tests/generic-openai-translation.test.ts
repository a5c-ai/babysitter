import { describe, it, expect } from 'vitest';
import { translateForGenericOpenAI } from '../src/translations/generic-openai-translation.js';
import type { ProviderConfig } from '@a5c-ai/agent-mux-comm';

function makeConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    provider: 'groq', model: 'llama-4', transport: 'openai-chat',
    auth: { type: 'api_key', apiKey: 'gsk-test' }, params: {},
    ...overrides,
  };
}

describe('translateForGenericOpenAI', () => {
  it('groq: direct with API key', () => {
    const r = translateForGenericOpenAI(makeConfig());
    expect(r.proxyRequired).toBe(false);
    expect(r.env['OPENAI_API_KEY']).toBe('gsk-test');
  });

  it('ollama: direct', () => {
    const r = translateForGenericOpenAI(makeConfig({ provider: 'ollama', auth: { type: 'none' } }));
    expect(r.proxyRequired).toBe(false);
  });

  it('anthropic: proxy required', () => {
    const r = translateForGenericOpenAI(makeConfig({ provider: 'anthropic' }));
    expect(r.proxyRequired).toBe(true);
    expect(r.proxyExposedTransport).toBe('openai-chat');
  });

  it('custom with apiBase: sets OPENAI_BASE_URL', () => {
    const r = translateForGenericOpenAI(makeConfig({
      provider: 'custom', params: { apiBase: 'https://my-llm.corp.net/v1' },
    }));
    expect(r.proxyRequired).toBe(false);
    expect(r.env['OPENAI_BASE_URL']).toBe('https://my-llm.corp.net/v1');
  });
});

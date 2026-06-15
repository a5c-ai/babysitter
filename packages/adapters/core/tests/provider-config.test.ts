import { describe, it, expect } from 'vitest';
import type { ProviderConfig, ProviderId, TransportId, ProviderAuth } from '../src/provider-config.js';
import { PROVIDER_DEFAULTS, translateModelId } from '../src/provider-config.js';

describe('ProviderConfig types', () => {
  it('has defaults for all built-in providers', () => {
    const expected: ProviderId[] = [
      'anthropic', 'openai', 'google', 'bedrock', 'vertex',
      'azure', 'foundry', 'ollama', 'local', 'openrouter',
      'groq', 'fireworks', 'together', 'deepseek', 'mistral',
      'cerebras', 'sambanova', 'custom',
    ];
    for (const id of expected) {
      expect(PROVIDER_DEFAULTS[id]).toBeDefined();
      expect(PROVIDER_DEFAULTS[id].transport).toBeTruthy();
    }
  });

  it('anthropic defaults to anthropic transport with api_key auth', () => {
    const d = PROVIDER_DEFAULTS['anthropic'];
    expect(d.transport).toBe('anthropic');
    expect(d.authType).toBe('api_key');
  });

  it('bedrock defaults to anthropic transport with iam auth', () => {
    const d = PROVIDER_DEFAULTS['bedrock'];
    expect(d.transport).toBe('anthropic');
    expect(d.authType).toBe('iam');
  });

  it('ollama defaults to openai-chat transport with no auth', () => {
    const d = PROVIDER_DEFAULTS['ollama'];
    expect(d.transport).toBe('openai-chat');
    expect(d.authType).toBe('none');
  });
});

describe('translateModelId', () => {
  it('translates canonical to bedrock format', () => {
    expect(translateModelId('claude-sonnet-4-20250514', 'bedrock'))
      .toBe('anthropic.claude-sonnet-4-20250514-v1:0');
  });

  it('translates canonical to vertex format', () => {
    expect(translateModelId('claude-sonnet-4-20250514', 'vertex'))
      .toBe('claude-sonnet-4@20250514');
  });

  it('returns canonical unchanged for anthropic', () => {
    expect(translateModelId('claude-sonnet-4-20250514', 'anthropic'))
      .toBe('claude-sonnet-4-20250514');
  });

  it('returns unknown model unchanged', () => {
    expect(translateModelId('my-custom-model', 'bedrock'))
      .toBe('my-custom-model');
  });

  it('returns canonical unchanged for provider without mapping', () => {
    expect(translateModelId('claude-sonnet-4-20250514', 'groq'))
      .toBe('claude-sonnet-4-20250514');
  });
});

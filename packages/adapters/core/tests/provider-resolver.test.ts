import { describe, it, expect, afterEach } from 'vitest';
import { resolveProvider } from '../src/provider-resolver.js';

describe('resolveProvider', () => {
  const originalEnv = { ...process.env };
  afterEach(() => { process.env = { ...originalEnv }; });

  it('resolves anthropic provider with api key from env', () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
    const config = resolveProvider({ provider: 'anthropic' });
    expect(config.provider).toBe('anthropic');
    expect(config.transport).toBe('anthropic');
    expect(config.auth.type).toBe('api_key');
    expect(config.auth.apiKey).toBe('sk-ant-test');
    expect(config.model).toBe('claude-sonnet-4-20250514');
  });

  it('explicit model overrides default', () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
    const config = resolveProvider({ provider: 'anthropic', model: 'claude-opus-4-20250514' });
    expect(config.model).toBe('claude-opus-4-20250514');
  });

  it('explicit api key overrides env', () => {
    process.env['ANTHROPIC_API_KEY'] = 'env-key';
    const config = resolveProvider({ provider: 'anthropic', apiKey: 'flag-key' });
    expect(config.auth.apiKey).toBe('flag-key');
  });

  it('resolves bedrock with region', () => {
    process.env['AWS_ACCESS_KEY_ID'] = 'AKIA...';
    process.env['AWS_SECRET_ACCESS_KEY'] = 'secret';
    const config = resolveProvider({ provider: 'bedrock', region: 'us-east-1' });
    expect(config.provider).toBe('bedrock');
    expect(config.transport).toBe('anthropic');
    expect(config.auth.type).toBe('iam');
    expect(config.params['region']).toBe('us-east-1');
  });

  it('resolves ollama with no auth', () => {
    const config = resolveProvider({ provider: 'ollama', model: 'qwen3:32b' });
    expect(config.auth.type).toBe('none');
    expect(config.model).toBe('qwen3:32b');
    expect(config.transport).toBe('openai-chat');
  });

  it('explicit transport overrides default', () => {
    const config = resolveProvider({ provider: 'openai', transport: 'openai-chat' });
    expect(config.transport).toBe('openai-chat');
  });

  it('resolves vertex with project and region', () => {
    const config = resolveProvider({
      provider: 'vertex',
      project: 'my-project',
      region: 'us-central1',
    });
    expect(config.params['project']).toBe('my-project');
    expect(config.params['region']).toBe('us-central1');
    expect(config.auth.type).toBe('adc');
  });

  it('resolves Vertex Gemini env from Google CI variables', () => {
    process.env['GOOGLE_CLOUD_PROJECT'] = 'ci-google-project';
    process.env['GOOGLE_CLOUD_LOCATION'] = 'global';
    process.env['GOOGLE_API_KEY'] = 'google-ci-key';

    const config = resolveProvider({ provider: 'vertex', model: 'gemini-3.1-pro-preview' });

    expect(config.params['project']).toBe('ci-google-project');
    expect(config.params['region']).toBe('global');
    expect(config.auth.type).toBe('adc');
    expect(config.auth.apiKey).toBe('google-ci-key');
    expect(config.model).toBe('gemini-3.1-pro-preview');
  });

  it('keeps GEMINI_API_KEY as a fallback for direct Google provider auth', () => {
    process.env['GEMINI_API_KEY'] = 'legacy-gemini-key';

    const config = resolveProvider({ provider: 'google' });

    expect(config.auth.apiKey).toBe('legacy-gemini-key');
  });

  it('resolves custom provider requiring all fields', () => {
    const config = resolveProvider({
      provider: 'custom',
      model: 'my-model',
      transport: 'openai-chat',
      apiKey: 'my-key',
      apiBase: 'https://my-llm.corp.net/v1',
    });
    expect(config.provider).toBe('custom');
    expect(config.params['apiBase']).toBe('https://my-llm.corp.net/v1');
  });

  it('resolves auth command', () => {
    const config = resolveProvider({
      provider: 'custom',
      model: 'my-model',
      transport: 'openai-chat',
      authCommand: 'get-token --scope llm',
      apiBase: 'https://my-llm.corp.net/v1',
    });
    expect(config.auth.type).toBe('command');
    expect(config.auth.command).toBe('get-token --scope llm');
  });

  it('resolves from AGENT_MUX_PROVIDER env var', () => {
    process.env['AGENT_MUX_PROVIDER'] = 'groq';
    process.env['GROQ_API_KEY'] = 'gsk-test';
    const config = resolveProvider({});
    expect(config.provider).toBe('groq');
    expect(config.auth.apiKey).toBe('gsk-test');
  });

  it('auto-translates model ID for bedrock provider', () => {
    const config = resolveProvider({
      provider: 'bedrock',
      model: 'claude-sonnet-4-20250514',
      region: 'us-east-1',
    });
    expect(config.model).toBe('anthropic.claude-sonnet-4-20250514-v1:0');
  });
});

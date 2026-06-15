import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProxyConfig, createProxyProcessEnv, readProxyConfigFromEnv, validateProxyConfig } from '../src/config.js';

describe('transport-adapter config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads defaults from env', () => {
    vi.stubEnv('AGENT_MUX_PROXY_TARGET_PROVIDER', 'bedrock');
    vi.stubEnv('AGENT_MUX_PROXY_TARGET_MODEL', 'bedrock/anthropic.claude-sonnet-4');
    vi.stubEnv('AGENT_MUX_PROXY_EXPOSED_TRANSPORT', 'anthropic');

    const config = readProxyConfigFromEnv();

    expect(config.targetProvider).toBe('bedrock');
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(0);
    expect(config.stream).toBe(true);
  });

  it('validates missing fields', () => {
    const errors = validateProxyConfig(
      createProxyConfig({
        targetProvider: '',
        targetModel: '',
        exposedTransport: '',
      }),
    );

    expect(errors).toHaveLength(3);
  });

  it('validates invalid transport', () => {
    const errors = validateProxyConfig(
      createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'invalid-transport',
      }),
    );

    expect(errors.some((error) => error.includes('Invalid transport'))).toBe(true);
  });

  it('passes validation for a valid config', () => {
    const errors = validateProxyConfig(
      createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
      }),
    );

    expect(errors).toEqual([]);
  });

  it('projects process env for the adapters-proxy runtime', () => {
    const env = createProxyProcessEnv(
      {
        targetProvider: 'bedrock',
        targetModel: 'bedrock/anthropic.claude-sonnet-4',
        exposedTransport: 'anthropic',
        port: 4317,
      },
      {
        authToken: 'test-token',
        logLevel: 'debug',
      },
    );

    expect(env).toMatchObject({
      AGENT_MUX_PROXY_TARGET_PROVIDER: 'bedrock',
      AGENT_MUX_PROXY_TARGET_MODEL: 'bedrock/anthropic.claude-sonnet-4',
      AGENT_MUX_PROXY_EXPOSED_TRANSPORT: 'anthropic',
      AGENT_MUX_PROXY_PORT: '4317',
      AGENT_MUX_PROXY_AUTH_TOKEN: 'test-token',
      AGENT_MUX_PROXY_LOG_LEVEL: 'debug',
    });
  });
});

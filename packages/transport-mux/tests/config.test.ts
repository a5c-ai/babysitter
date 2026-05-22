import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProxyConfig, createProxyProcessEnv, readProxyConfigFromEnv, validateProxyConfig } from '../src/config.js';

describe('transport-mux config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads defaults from env', () => {
    vi.stubEnv('AMUX_PROXY_TARGET_PROVIDER', 'bedrock');
    vi.stubEnv('AMUX_PROXY_TARGET_MODEL', 'bedrock/anthropic.claude-sonnet-4');
    vi.stubEnv('AMUX_PROXY_EXPOSED_TRANSPORT', 'anthropic');

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

  it('projects process env for the amux-proxy runtime', () => {
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
      AMUX_PROXY_TARGET_PROVIDER: 'bedrock',
      AMUX_PROXY_TARGET_MODEL: 'bedrock/anthropic.claude-sonnet-4',
      AMUX_PROXY_EXPOSED_TRANSPORT: 'anthropic',
      AMUX_PROXY_PORT: '4317',
      AMUX_PROXY_AUTH_TOKEN: 'test-token',
      AMUX_PROXY_LOG_LEVEL: 'debug',
    });
  });
});

import { SUPPORTED_TRANSPORTS, type ProxyConfig } from './types.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 0;
const DEFAULT_STREAM = true;

export function createProxyConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  const config = {
    targetProvider: '',
    targetModel: '',
    exposedTransport: 'openai-chat',
    authToken: undefined,
    apiBase: undefined,
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    stream: DEFAULT_STREAM,
  } satisfies ProxyConfig;

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      (config as Record<string, unknown>)[key] = value;
    }
  }

  return config;
}

export function readProxyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  return createProxyConfig({
    targetProvider: env.AMUX_PROXY_TARGET_PROVIDER,
    targetModel: env.AMUX_PROXY_TARGET_MODEL,
    exposedTransport: env.AMUX_PROXY_EXPOSED_TRANSPORT,
    authToken: env.AMUX_PROXY_AUTH_TOKEN,
    apiBase: env.AMUX_PROXY_API_BASE,
    host: env.AMUX_PROXY_HOST || DEFAULT_HOST,
    port: env.AMUX_PROXY_PORT ? Number(env.AMUX_PROXY_PORT) : DEFAULT_PORT,
    stream: env.AMUX_PROXY_STREAM ? env.AMUX_PROXY_STREAM !== 'false' : DEFAULT_STREAM,
  });
}

export function validateProxyConfig(config: ProxyConfig): string[] {
  const errors: string[] = [];

  if (!config.targetProvider) {
    errors.push('Missing targetProvider');
  }
  if (!config.targetModel) {
    errors.push('Missing targetModel');
  }
  if (!config.exposedTransport) {
    errors.push('Missing exposedTransport');
  } else if (!SUPPORTED_TRANSPORTS.includes(config.exposedTransport as (typeof SUPPORTED_TRANSPORTS)[number])) {
    errors.push(`Invalid transport: ${config.exposedTransport}`);
  }
  if (!Number.isFinite(config.port) || config.port < 0) {
    errors.push(`Invalid port: ${config.port}`);
  }

  return errors;
}

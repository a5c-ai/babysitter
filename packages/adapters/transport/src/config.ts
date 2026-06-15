import { SUPPORTED_TRANSPORTS, type ProxyConfig } from './types.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 0;
const DEFAULT_STREAM = true;

export interface ProxyProcessEnvOptions extends Partial<ProxyConfig> {
  logLevel?: string;
}

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
    targetProvider: env.AGENT_MUX_PROXY_TARGET_PROVIDER,
    targetModel: env.AGENT_MUX_PROXY_TARGET_MODEL,
    exposedTransport: env.AGENT_MUX_PROXY_EXPOSED_TRANSPORT,
    authToken: env.AGENT_MUX_PROXY_AUTH_TOKEN,
    apiBase: env.AGENT_MUX_PROXY_API_BASE,
    host: env.AGENT_MUX_PROXY_HOST || DEFAULT_HOST,
    port: env.AGENT_MUX_PROXY_PORT ? Number(env.AGENT_MUX_PROXY_PORT) : DEFAULT_PORT,
    stream: env.AGENT_MUX_PROXY_STREAM ? env.AGENT_MUX_PROXY_STREAM !== 'false' : DEFAULT_STREAM,
  });
}

export function createProxyProcessEnv(overrides: Partial<ProxyConfig>, options: ProxyProcessEnvOptions = {}): Record<string, string> {
  const config = createProxyConfig({
    ...overrides,
    authToken: options.authToken ?? overrides.authToken,
    apiBase: options.apiBase ?? overrides.apiBase,
    host: options.host ?? overrides.host,
    port: options.port ?? overrides.port,
    stream: options.stream ?? overrides.stream,
  });

  const env: Record<string, string> = {
    AGENT_MUX_PROXY_TARGET_PROVIDER: config.targetProvider,
    AGENT_MUX_PROXY_TARGET_MODEL: config.targetModel,
    AGENT_MUX_PROXY_EXPOSED_TRANSPORT: config.exposedTransport,
    AGENT_MUX_PROXY_PORT: String(config.port),
  };

  if (config.authToken) {
    env.AGENT_MUX_PROXY_AUTH_TOKEN = config.authToken;
  }
  if (config.apiBase) {
    env.AGENT_MUX_PROXY_API_BASE = config.apiBase;
  }
  if (config.host && config.host !== DEFAULT_HOST) {
    env.AGENT_MUX_PROXY_HOST = config.host;
  }
  if (config.stream !== DEFAULT_STREAM) {
    env.AGENT_MUX_PROXY_STREAM = String(config.stream);
  }
  if (options.logLevel) {
    env.AGENT_MUX_PROXY_LOG_LEVEL = options.logLevel;
  }

  return env;
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

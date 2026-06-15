import { randomUUID } from 'node:crypto';

import { createProxyConfig } from './config.js';
import { startProxyServer } from './server.js';
import type {
  CompletionEngine,
  ProxyConfig,
  RunningProxyServer,
  TransportId,
} from './types.js';

export interface StartTransportMuxRuntimeOptions {
  targetProvider: string;
  targetModel: string;
  exposedTransport: TransportId;
  authToken?: string | null;
  apiBase?: string;
  host?: string;
  port?: number;
  stream?: boolean;
  completionEngine?: CompletionEngine;
}

export interface TransportMuxRuntime extends RunningProxyServer {
  authToken?: string;
  config: ProxyConfig;
  applyHarnessEnv(env: Record<string, string>): Record<string, string>;
}

export function applyTransportMuxToHarnessEnv(
  env: Record<string, string>,
  transport: TransportId,
  proxyUrl: string,
  authToken: string,
): Record<string, string> {
  env['AGENT_MUX_PROXY_BASE_URL'] = proxyUrl;
  env['AGENT_MUX_PROXY_AUTH_TOKEN'] = authToken;

  switch (transport) {
    case 'anthropic':
      env['ANTHROPIC_BASE_URL'] = proxyUrl;
      env['ANTHROPIC_API_KEY'] = authToken;
      env['ANTHROPIC_AUTH_TOKEN'] = authToken;
      break;
    case 'openai-chat':
    case 'openai-responses':
    case 'azure-foundry':
      env['OPENAI_BASE_URL'] = proxyUrl;
      env['OPENAI_API_KEY'] = authToken;
      break;
    case 'google':
    case 'vertex-native':
      env['CODE_ASSIST_ENDPOINT'] = proxyUrl;
      env['GOOGLE_API_KEY'] = authToken;
      env['GEMINI_API_KEY'] = authToken;
      break;
  }

  return env;
}

export async function startTransportMuxRuntime(
  options: StartTransportMuxRuntimeOptions,
): Promise<TransportMuxRuntime> {
  const authToken = options.authToken === null ? undefined : (options.authToken ?? randomUUID());
  const config = createProxyConfig({
    targetProvider: options.targetProvider,
    targetModel: options.targetModel,
    exposedTransport: options.exposedTransport,
    authToken,
    apiBase: options.apiBase,
    host: options.host,
    port: options.port,
    stream: options.stream,
  });
  const server = await startProxyServer(config, options.completionEngine);

  return createTransportMuxRuntime(server, config);
}

function createTransportMuxRuntime(
  server: RunningProxyServer,
  config: ProxyConfig,
): TransportMuxRuntime {
  return {
    ...server,
    authToken: config.authToken,
    config,
    applyHarnessEnv(env) {
      if (!config.authToken) {
        return env;
      }
      return applyTransportMuxToHarnessEnv(
        env,
        config.exposedTransport,
        server.url,
        config.authToken,
      );
    },
  };
}

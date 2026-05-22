import * as os from 'node:os';
import * as path from 'node:path';

import type { RunHandle, RunOptions } from '@a5c-ai/agent-mux-core';

import type { BootstrapAuthMode } from './auth/bootstrap.js';
import type { TokenStore } from './auth/tokens.js';
import type { NotificationWebhookConfig } from './notifications/types.js';

export interface GatewayRunClient {
  run(options: RunOptions): RunHandle;
}

export interface GatewayConfig {
  host: string;
  port: number;
  webuiRoot?: string | null;
  enableWebui: boolean;
  serverVersion: string;
  unauthenticatedTimeoutMs: number;
  maxPendingFrames: number;
  tokenStore?: TokenStore;
  tokenStoreKind: 'sqlite' | 'memory';
  tokenDbPath: string;
  eventLogDir: string;
  maxEventsPerRun: number;
  replayBufferSize: number;
  maxConcurrentRuns: number;
  shutdownGraceMs: number;
  hookDecisionTimeoutMs: number;
  notificationWebhook?: NotificationWebhookConfig | null;
  bootstrapAuth: {
    mode: BootstrapAuthMode;
    adminUsername: string | null;
    adminPassword: string | null;
    tokenSeed: string | null;
    bootstrapTokenName: string;
  };
  client?: GatewayRunClient;
}

export const DEFAULT_GATEWAY_CONFIG: Readonly<GatewayConfig> = Object.freeze({
  host: '127.0.0.1',
  port: 7878,
  webuiRoot: null,
  enableWebui: true,
  serverVersion: '0.0.0',
  unauthenticatedTimeoutMs: 5000,
  maxPendingFrames: 1024,
  tokenStoreKind: 'sqlite',
  tokenDbPath: path.join(os.homedir(), '.amux', 'gateway', 'tokens.db'),
  eventLogDir: path.join(os.homedir(), '.amux', 'gateway', 'events'),
  maxEventsPerRun: 100_000,
  replayBufferSize: 512,
  maxConcurrentRuns: 16,
  shutdownGraceMs: 5000,
  hookDecisionTimeoutMs: 30_000,
  notificationWebhook: null,
  bootstrapAuth: {
    mode: 'manual' as BootstrapAuthMode,
    adminUsername: null,
    adminPassword: null,
    tokenSeed: null,
    bootstrapTokenName: 'bootstrap-admin',
  },
});

export function resolveGatewayConfig(config: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    ...DEFAULT_GATEWAY_CONFIG,
    ...config,
    bootstrapAuth: {
      ...DEFAULT_GATEWAY_CONFIG.bootstrapAuth,
      ...(config.bootstrapAuth ?? {}),
    },
  };
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value == null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no') return false;
  return undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (value == null || value.trim().length === 0) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readTrimmed(env: NodeJS.ProcessEnv, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function resolveBootstrapAuthMode(value: string | null): BootstrapAuthMode {
  if (value === 'bootstrap-admin' || value === 'local-dev') {
    return value;
  }
  return 'manual';
}

export function resolveGatewayEnvConfig(env: NodeJS.ProcessEnv = process.env): Partial<GatewayConfig> {
  const host = readTrimmed(env, 'AMUX_GATEWAY_HOST');
  const port = parseNumber(env['AMUX_GATEWAY_PORT']);
  const webuiRoot = readTrimmed(env, 'AMUX_GATEWAY_WEBUI_ROOT');
  const enableWebui = parseBoolean(env['AMUX_GATEWAY_ENABLE_WEBUI']);
  const tokenDbPath = readTrimmed(env, 'AMUX_GATEWAY_TOKEN_DB_PATH');
  const eventLogDir = readTrimmed(env, 'AMUX_GATEWAY_EVENT_LOG_DIR');
  const mode = resolveBootstrapAuthMode(
    readTrimmed(
      env,
      'AMUX_GATEWAY_AUTH_MODE',
      'AMUX_GATEWAY_BOOTSTRAP_AUTH_MODE',
      'CLOUD_BOOTSTRAP_AUTH_MODE',
      'AUTH_MODE',
    ),
  );
  const adminUsername = readTrimmed(
    env,
    'AMUX_GATEWAY_BOOTSTRAP_ADMIN_USERNAME',
    'CLOUD_BOOTSTRAP_ADMIN_USERNAME',
    'ADMIN_USERNAME',
  );
  const adminPassword = readTrimmed(
    env,
    'AMUX_GATEWAY_BOOTSTRAP_ADMIN_PASSWORD',
    'CLOUD_BOOTSTRAP_ADMIN_PASSWORD',
    'ADMIN_PASSWORD',
  );
  const tokenSeed = readTrimmed(
    env,
    'AMUX_GATEWAY_BOOTSTRAP_TOKEN_SEED',
    'CLOUD_BOOTSTRAP_ADMIN_TOKEN_SEED',
    'ADMIN_TOKEN_SEED',
  );
  const bootstrapTokenName = readTrimmed(env, 'AMUX_GATEWAY_BOOTSTRAP_TOKEN_NAME');

  return {
    ...(host ? { host } : {}),
    ...(port != null ? { port } : {}),
    ...(webuiRoot ? { webuiRoot } : {}),
    ...(enableWebui != null ? { enableWebui } : {}),
    ...(tokenDbPath ? { tokenDbPath } : {}),
    ...(eventLogDir ? { eventLogDir } : {}),
    bootstrapAuth: {
      mode,
      adminUsername,
      adminPassword,
      tokenSeed,
      bootstrapTokenName: bootstrapTokenName ?? DEFAULT_GATEWAY_CONFIG.bootstrapAuth.bootstrapTokenName,
    },
  };
}

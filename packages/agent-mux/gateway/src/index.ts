import {
  DEFAULT_GATEWAY_CONFIG,
  GatewayConfig,
  GatewayRunClient,
  resolveGatewayEnvConfig,
  resolveGatewayConfig,
} from './config.js';
import {
  createGatewayLogger,
  GatewayLogger,
} from './logging.js';
import { createGatewayServer, type GatewayServer } from './server.js';
import type { TokenStore, TokenRecord, TokenIssueResult } from './auth/tokens.js';
import type { RunManager } from './runs/manager.js';
import type { RunEntry, RunOwner, RunStartInput, RunStatus } from './runs/types.js';

export type { GatewayConfig } from './config.js';
export {
  DEFAULT_GATEWAY_CONFIG,
  resolveGatewayEnvConfig,
  resolveGatewayConfig,
} from './config.js';
export type { GatewayRunClient } from './config.js';
export type { GatewayLogger } from './logging.js';
export { createGatewayLogger } from './logging.js';
export type { TokenStore, TokenRecord, TokenIssueResult } from './auth/tokens.js';
export { MemoryTokenStore, SqliteTokenStore } from './auth/tokens.js';
export type { BootstrapAuthMode, BootstrapAuthConfig } from './auth/bootstrap.js';
export { encodeFrame, decodeFrame, gatewayFrameSchema } from './protocol/frames.js';
export { GATEWAY_CLOSE_CODES, GatewayProtocolError } from './protocol/errors.js';
export type * from './protocol/v1.js';
export type { RunEntry, RunOwner, RunStartInput, RunStatus } from './runs/types.js';
export { RunManager } from './runs/manager.js';
export { resolveWebuiRoot, serveWebuiRequest } from './static/webui-server.js';
export type { NotificationWebhookConfig, HookRequestWebhookPayload, PushTarget } from './notifications/types.js';
export { createHookWebhookPayload, emitHookWebhook } from './notifications/webhook-out.js';

export interface Gateway {
  readonly config: GatewayConfig;
  readonly logger: GatewayLogger;
  readonly server: GatewayServer;
  readonly runManager: RunManager;
  readonly started: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createGateway(config: Partial<GatewayConfig> = {}): Gateway {
  const resolvedConfig = resolveGatewayConfig(config);
  const logger = createGatewayLogger();
  const server = createGatewayServer(resolvedConfig, logger);
  let started = false;

  return {
    config: resolvedConfig,
    logger,
    server,
    get runManager() {
      return server.runManager;
    },
    get started() {
      return started;
    },
    async start() {
      if (started) {
        return;
      }
      await server.start();
      started = true;
      logger.info('Gateway started', {
        host: resolvedConfig.host,
        port: resolvedConfig.port,
        enableWebui: resolvedConfig.enableWebui,
      });
    },
    async stop() {
      if (!started) {
        return;
      }
      await server.stop();
      started = false;
      logger.info('Gateway stopped', {
        host: resolvedConfig.host,
        port: resolvedConfig.port,
      });
    },
  };
}

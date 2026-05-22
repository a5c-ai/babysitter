import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { createGateway, DEFAULT_GATEWAY_CONFIG, resolveGatewayConfig, resolveGatewayEnvConfig, type GatewayConfig } from '@a5c-ai/agent-mux-gateway';
import YAML from 'yaml';

import type { ParsedArgs } from '../../parse-args.js';
import { flagBool, flagNum, flagStr } from '../../parse-args.js';
import { ExitCode } from '../../exit-codes.js';
import { printError, printInfo, printJsonOk } from '../../output.js';

export const DEFAULT_GATEWAY_CONFIG_PATH = path.join(os.homedir(), '.amux', 'gateway', 'config.yml');

export async function loadGatewayConfig(configPath: string): Promise<Partial<GatewayConfig>> {
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    if (configPath.endsWith('.json')) {
      return JSON.parse(raw) as Partial<GatewayConfig>;
    }
    return (YAML.parse(raw) as Partial<GatewayConfig>) ?? {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

export async function serveGatewayCommand(args: ParsedArgs): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const configPath = flagStr(args.flags, 'config') ?? DEFAULT_GATEWAY_CONFIG_PATH;
  const fileConfig = await loadGatewayConfig(configPath);
  const envConfig = resolveGatewayEnvConfig();
  const config = resolveGatewayConfig({
    ...envConfig,
    ...fileConfig,
    host: flagStr(args.flags, 'host') ?? fileConfig.host ?? envConfig.host,
    port: flagNum(args.flags, 'port') ?? fileConfig.port ?? envConfig.port,
    webuiRoot: flagStr(args.flags, 'webui') ?? fileConfig.webuiRoot ?? envConfig.webuiRoot,
    enableWebui: flagBool(args.flags, 'no-webui') === true
      ? false
      : (fileConfig.enableWebui ?? envConfig.enableWebui ?? true),
    bootstrapAuth: {
      ...DEFAULT_GATEWAY_CONFIG.bootstrapAuth,
      ...(envConfig.bootstrapAuth ?? {}),
      ...(fileConfig.bootstrapAuth ?? {}),
    },
  });
  const gateway = createGateway(config);
  await gateway.start();

  if (jsonMode) {
    printJsonOk({
      host: gateway.server.address.host,
      port: gateway.server.address.port,
      configPath,
    });
  } else {
    printInfo(`Gateway listening on http://${gateway.server.address.host}:${gateway.server.address.port}`);
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = async () => {
      if (settled) return;
      settled = true;
      try {
        await gateway.stop();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    process.once('SIGINT', () => void finish());
    process.once('SIGTERM', () => void finish());
  });

  return ExitCode.SUCCESS;
}

import * as os from 'node:os';
import { createRequire } from 'node:module';

import { DEFAULT_GATEWAY_CONFIG, MemoryTokenStore, SqliteTokenStore, resolveGatewayConfig, resolveGatewayEnvConfig, type GatewayConfig } from '@a5c-ai/agent-mux-gateway';

import type { ParsedArgs } from '../../parse-args.js';
import { flagBool, flagNum, flagStr } from '../../parse-args.js';
import { ExitCode } from '../../exit-codes.js';
import { printError, printJsonOk, printTable } from '../../output.js';
import { DEFAULT_GATEWAY_CONFIG_PATH, loadGatewayConfig } from './serve.js';

const require = createRequire(import.meta.url);

function resolveTokenStore(config: GatewayConfig) {
  if (config.tokenStore) return config.tokenStore;
  if (config.tokenStoreKind === 'memory') return new MemoryTokenStore();
  return new SqliteTokenStore(config.tokenDbPath);
}

function renderQr(url: string, token: string): void {
  const qrcode = require('qrcode-terminal') as {
    generate(text: string, options?: { small?: boolean }, cb?: (qr: string) => void): void;
  };
  qrcode.generate(JSON.stringify({ url, token }), { small: true });
}

export async function gatewayTokensCommand(args: ParsedArgs): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const configPath = flagStr(args.flags, 'config') ?? DEFAULT_GATEWAY_CONFIG_PATH;
  const fileConfig = await loadGatewayConfig(configPath);
  const envConfig = resolveGatewayEnvConfig();
  const config = resolveGatewayConfig({
    ...envConfig,
    ...fileConfig,
    bootstrapAuth: {
      ...DEFAULT_GATEWAY_CONFIG.bootstrapAuth,
      ...(envConfig.bootstrapAuth ?? {}),
      ...(fileConfig.bootstrapAuth ?? {}),
    },
  });
  const store = resolveTokenStore(config);
  const sub = args.positionals[0];

  if (sub === 'list') {
    const tokens = await store.list();
    if (jsonMode) {
      printJsonOk(tokens);
      return ExitCode.SUCCESS;
    }
    printTable(
      ['ID', 'Name', 'Created', 'Last Used', 'Revoked'],
      tokens.map((token) => [
        token.id,
        token.name,
        new Date(token.createdAt).toISOString(),
        token.lastUsedAt == null ? '--' : new Date(token.lastUsedAt).toISOString(),
        token.revokedAt == null ? '--' : new Date(token.revokedAt).toISOString(),
      ]),
    );
    return ExitCode.SUCCESS;
  }

  if (sub === 'create') {
    const name = flagStr(args.flags, 'name') ?? `token@${os.hostname()}`;
    const created = await store.create({
      name,
      ttlMs: flagNum(args.flags, 'ttl-ms') ?? null,
    });
    if (jsonMode) {
      printJsonOk(created);
      return ExitCode.SUCCESS;
    }
    process.stdout.write(`Token: ${created.plaintext}\n`);
    process.stdout.write(`ID: ${created.id}\n`);
    if (flagBool(args.flags, 'qr') === true) {
      renderQr(flagStr(args.flags, 'url') ?? 'http://127.0.0.1:7878', created.plaintext);
    }
    return ExitCode.SUCCESS;
  }

  if (sub === 'revoke') {
    const id = args.positionals[1] ?? flagStr(args.flags, 'id');
    if (!id) {
      printError('Missing token id for revoke');
      return ExitCode.USAGE_ERROR;
    }
    const revoked = await store.revoke(id);
    if (jsonMode) {
      printJsonOk({ revoked });
      return ExitCode.SUCCESS;
    }
    process.stdout.write(revoked ? `Revoked ${id}\n` : `Token not found: ${id}\n`);
    return revoked ? ExitCode.SUCCESS : ExitCode.GENERAL_ERROR;
  }

  printError('Missing or unknown tokens subcommand. Available: list, create, revoke');
  return ExitCode.USAGE_ERROR;
}

#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createProxyConfig, readProxyConfigFromEnv, validateProxyConfig } from '../config.js';
import { startProxyServer } from '../server.js';

function readPackageVersion(): string {
  const __filename = fileURLToPath(import.meta.url);
  const packageJsonPath = path.resolve(path.dirname(__filename), '../../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: unknown };
  return typeof packageJson.version === 'string' ? packageJson.version : '0.0.0';
}

async function main(): Promise<void> {
  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    process.stdout.write(`${readPackageVersion()}\n`);
    return;
  }

  const config = createProxyConfig({
    ...readProxyConfigFromEnv(),
    authToken: process.env.AMUX_PROXY_AUTH_TOKEN || randomUUID(),
  });
  const errors = validateProxyConfig(config);

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`Error: ${error}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stderr.write(`[amux-proxy] Transport: ${config.exposedTransport} -> ${config.targetProvider}\n`);
  process.stderr.write(`[amux-proxy] Model: ${config.targetModel}\n`);

  const server = await startProxyServer(config);
  process.stdout.write(
    `${JSON.stringify({
      event: 'ready',
      port: server.port,
      auth_token: config.authToken,
      url: server.url,
    })}\n`,
  );

  let stopping = false;
  const stop = async (signal?: NodeJS.Signals) => {
    if (stopping) {
      return;
    }
    stopping = true;
    if (signal) {
      process.stderr.write(`[amux-proxy] Received ${signal}, shutting down\n`);
    }
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void stop('SIGINT'));
  process.on('SIGTERM', () => void stop('SIGTERM'));
}

await main();

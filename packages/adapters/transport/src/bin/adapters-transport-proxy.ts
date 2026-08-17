#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createProxyConfig, readProxyConfigFromEnv, validateProxyConfig } from '../config.js';
import { startProxyServer } from '../server.js';
import { SUPPORTED_TRANSPORTS } from '../types.js';

const USAGE = `Usage: adapters-transport-proxy [--help] [--version]

Starts the transport proxy that exposes a supported wire transport in front of a
target provider. All configuration is supplied through the environment; there
are no positional arguments.

Options:
  -h, --help       Show this message and exit
  -v, --version    Print the package version and exit

Required environment:
  AGENT_MUX_PROXY_TARGET_PROVIDER    Provider to proxy to
  AGENT_MUX_PROXY_TARGET_MODEL       Model to request from that provider
  AGENT_MUX_PROXY_EXPOSED_TRANSPORT  Wire transport to expose (default: openai-chat)
                                     One of: ${SUPPORTED_TRANSPORTS.join(', ')}

Optional environment:
  AGENT_MUX_PROXY_AUTH_TOKEN         Bearer token clients must present
                                     (a random token is generated when unset)
  AGENT_MUX_PROXY_API_BASE           Override the upstream API base URL
  AGENT_MUX_PROXY_HOST               Listen host (default: 127.0.0.1)
  AGENT_MUX_PROXY_PORT               Listen port (default: 0 — ephemeral)

On startup a single JSON line is written to stdout:
  {"event":"ready","port":<port>,"auth_token":"<token>","url":"<url>"}
`;

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

  // `--help` used to fall through to config validation, so the published bin
  // answered `adapters-transport-proxy --help` with "Error: Missing
  // targetProvider" and exit 1 (found by the FIX-011 packed-artifact bin smoke
  // test). Usage is not an error: it prints on stdout and exits 0.
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(USAGE);
    return;
  }

  const config = createProxyConfig({
    ...readProxyConfigFromEnv(),
    authToken: process.env.AGENT_MUX_PROXY_AUTH_TOKEN || randomUUID(),
  });
  const errors = validateProxyConfig(config);

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`Error: ${error}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stderr.write(`[adapters-transport-proxy] Transport: ${config.exposedTransport} -> ${config.targetProvider}\n`);
  process.stderr.write(`[adapters-transport-proxy] Model: ${config.targetModel}\n`);

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
      process.stderr.write(`[adapters-transport-proxy] Received ${signal}, shutting down\n`);
    }
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void stop('SIGINT'));
  process.on('SIGTERM', () => void stop('SIGTERM'));
}

await main();

#!/usr/bin/env node
// mcp-channels CLI entry (stdio MCP server bootstrap).
//
// Usage: mcp-channels <path/to/channels.yml>
//        node dist/cli.js examples/channels.yml
//
// Thin wrapper: resolve the config path from argv, build the runtime over a real
// stdio MCP transport, and start it. All real logic lives in runtime.js (and the
// modules it composes). This file owns the concrete transport so runtime.js stays
// transport-agnostic (tests inject an in-memory transport instead). It is
// intentionally trivial and is excluded from coverage; the live stdio handshake
// is covered by the cli-stdio integration test.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRuntime } from './runtime.js';

const USAGE =
  'Usage: adapters-channels <config.yml>\n' +
  '       mcp-channels <config.yml>   (alias)\n' +
  '\n' +
  'Starts the channels stdio MCP server over the given channel configuration.\n' +
  '\n' +
  'Arguments:\n' +
  '  <config.yml>     Path to the channels configuration file\n' +
  '\n' +
  'Options:\n' +
  '  -h, --help       Show this message and exit\n' +
  '  -v, --version    Print the package version and exit\n' +
  '\n' +
  'Example:\n' +
  '  adapters-channels examples/channels.yml\n';

const args = process.argv.slice(2);

// `--help` and `--version` used to be treated as the config path, so the
// published bin answered `adapters-channels --help` with
// "mcp-channels: invalid config" and exit 1 (found by the FIX-011 packed-artifact
// bin smoke test). Usage is not an error: stdout, exit 0.
if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const manifestPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { version?: unknown };
  process.stdout.write(`${typeof manifest.version === 'string' ? manifest.version : '0.0.0'}\n`);
  process.exit(0);
}

const configPath = args[0];

if (!configPath) {
  process.stderr.write(USAGE);
  process.exit(1);
}

// Wrap the bootstrap so a misconfig (e.g. aggregated validation errors from
// createRuntime, or a bad custom-backend import) prints a clean message to stderr
// and exits non-zero, rather than surfacing as an unhandled promise rejection.
try {
  const runtime = await createRuntime(configPath, {
    transport: new StdioServerTransport(),
  });
  await runtime.start();
} catch (err) {
  process.stderr.write(`${(err as Error)?.message || String(err)}\n`);
  process.exit(1);
}

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

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRuntime } from './runtime.js';

const configPath = process.argv[2];

if (!configPath) {
  process.stderr.write(
    'Usage: mcp-channels <config.yml>\n' +
      '  e.g. mcp-channels examples/channels.yml\n'
  );
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

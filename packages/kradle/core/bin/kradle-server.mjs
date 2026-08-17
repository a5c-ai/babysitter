#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const args = new Set(process.argv.slice(2));

// `--help`/`--version` used to fall through and START the server, so
// `kradle-server --help` bound a port and hung until the caller timed it out
// (found by the FIX-011 packed-artifact bin smoke test). Both flags answer on
// stdout and exit 0 without opening a socket.
if (args.has('--help') || args.has('-h')) {
  console.log(
    `Usage: kradle-server [--port=<port>]\n` +
      `\n` +
      `Starts the Kradle Kubernetes-API HTTP server.\n` +
      `\n` +
      `Options:\n` +
      `  --port=<port>   Listen port (default: $PORT, otherwise 3080)\n` +
      `  -h, --help      Show this message and exit\n` +
      `  -v, --version   Print the package version and exit\n` +
      `\n` +
      `Once listening, a single JSON line describing the bound port, mode and\n` +
      `endpoints is written to stdout.`,
  );
  process.exit(0);
}

if (args.has('--version') || args.has('-v')) {
  const packageInfo = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(packageInfo.version);
  process.exit(0);
}

const { createKradleHttpServer } = await import('../src/http-server.js');

const portArg = process.argv.find((arg) => arg.startsWith('--port='));
const port = Number(portArg?.split('=')[1] || process.env.PORT || 3080);
const server = createKradleHttpServer();
server.listen(port, () => {
  console.log(JSON.stringify({
    status: 'listening',
    port,
    mode: 'kubernetes-api',
    endpoints: ['/healthz', '/api/controller', '/api/controller/resources', '/api/repositories', '/api/watch/*', '/api/git-proxy']
  }));
});

// Integration test for the live stdio MCP handshake.
//
// The unit suite injects an in-memory transport into createRuntime; this test
// instead spawns the BUILT CLI (dist/cli.js) exactly as Claude Code would
// (`node dist/cli.js <config>`), performs a real MCP `initialize` over stdio,
// and asserts the server responds with the channel capability. This is the
// regression guard for the bug where cli.js never connected a StdioServerTransport
// (server booted but never spoke MCP over stdio).
//
// It runs only when dist/ has been built (CI / `test:adapters` build before test);
// it skips cleanly on a pre-build local `vitest run` rather than failing.

import { describe, it, expect, afterEach } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST_CLI = resolve(HERE, '../../dist/cli.js');

const CONFIG = `
server:
  name: mcp-channels
sources:
  - id: gh-test
    backend: github
    auth: { token: "dummy" }
    config: { repo: "octo/app", events: [issue_comment] }
`;

describe('cli stdio MCP handshake', () => {
  let child: ChildProcessWithoutNullStreams | undefined;
  let workdir: string | undefined;

  afterEach(() => {
    child?.kill();
    child = undefined;
    if (workdir) {
      rmSync(workdir, { recursive: true, force: true });
      workdir = undefined;
    }
  });

  it.skipIf(!existsSync(DIST_CLI))(
    'responds to initialize over stdio with the claude/channel capability',
    async () => {
      workdir = mkdtempSync(join(tmpdir(), 'channels-cli-'));
      const configPath = join(workdir, 'channels.yml');
      writeFileSync(configPath, CONFIG);

      child = spawn(process.execPath, [DIST_CLI, configPath], {
        env: { ...process.env, GITHUB_TOKEN: 'dummy' },
        stdio: ['pipe', 'pipe', 'pipe'],
      }) as ChildProcessWithoutNullStreams;

      const result = await new Promise<Record<string, unknown>>((resolveP, rejectP) => {
        let buf = '';
        let stderr = '';
        const timer = setTimeout(
          () => rejectP(new Error(`no initialize response in time. stderr: ${stderr.slice(0, 500)}`)),
          15000,
        );
        child!.stderr.on('data', (d) => {
          stderr += d;
        });
        child!.stdout.on('data', (d) => {
          buf += d;
          for (const line of buf.split('\n')) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.id === 1 && msg.result) {
                clearTimeout(timer);
                resolveP(msg.result);
                return;
              }
            } catch {
              // partial line; keep accumulating
            }
          }
        });
        child!.on('exit', (code) => {
          clearTimeout(timer);
          rejectP(new Error(`cli exited early (code ${code}) before responding. stderr: ${stderr.slice(0, 500)}`));
        });
        child!.stdin.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'cli-stdio-test', version: '0' },
            },
          }) + '\n',
        );
      });

      const serverInfo = result['serverInfo'] as { name?: string } | undefined;
      const capabilities = result['capabilities'] as
        | { experimental?: Record<string, unknown>; tools?: unknown }
        | undefined;

      expect(serverInfo?.name).toBe('mcp-channels');
      expect(capabilities?.experimental).toBeDefined();
      expect(capabilities?.experimental?.['claude/channel']).toBeDefined();
      expect(capabilities?.tools).toBeDefined();
    },
    20000,
  );
});

import { describe, it, expect } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/**
 * Smoke tests for the *built* CLI. These spawn `node packages/agent-mux/cli/dist/index.js`
 * to prove the published artifact actually runs end-to-end.
 *
 * The suite is skipped if `dist/index.js` does not exist (e.g. a fresh clone
 * that hasn't run `npm run build` yet), so `npm test` alone still passes.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const distEntry = resolve(__dirname, '..', 'dist', 'index.js');
const distExists = existsSync(distEntry);

const suite = distExists ? describe : describe.skip;

suite('built CLI (dist/index.js)', () => {
  it('--help prints usage and exits 0', () => {
    const res = spawnSync(process.execPath, [distEntry, '--help'], {
      encoding: 'utf8',
    });
    expect(res.status).toBe(0);
    const out = res.stdout + res.stderr;
    expect(out).toContain('amux');
    expect(out).toContain('Usage:');
  });

  it('--version prints a version string and exits 0', () => {
    const res = spawnSync(process.execPath, [distEntry, '--version'], {
      encoding: 'utf8',
    });
    expect(res.status).toBe(0);
    expect(res.stdout + res.stderr).toMatch(/amux\s+v\d+\.\d+\.\d+/);
  });

  it('adapters list exits 0 and contains all 11 built-in adapters', () => {
    const res = spawnSync(process.execPath, [distEntry, 'adapters', 'list', '--json'], {
      encoding: 'utf8',
    });
    expect(res.status).toBe(0);
    const parsed = JSON.parse(res.stdout);
    expect(parsed).toHaveProperty('ok', true);
    expect(Array.isArray(parsed.data)).toBe(true);
    // Registration bootstrap must wire up all 11 built-in adapters.
    expect(parsed.data.length).toBeGreaterThanOrEqual(11);
    const agents = parsed.data.map((a: { agent: string }) => a.agent).sort();
    expect(agents).toEqual(expect.arrayContaining([
      'agent-mux-remote',
      'claude',
      'codex',
      'copilot',
      'cursor',
      'gemini',
      'hermes',
      'omp',
      'openclaw',
      'opencode',
      'pi',
    ]));
  });

  it('gateway serve starts the built server and accepts a CLI-issued token', { timeout: 60000 }, async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'amux-built-cli-'));
    const configPath = join(tempDir, 'gateway.config.json');
    const tokenDbPath = join(tempDir, 'tokens.db');
    const eventLogDir = join(tempDir, 'events');
    writeFileSync(
      configPath,
      JSON.stringify({
        host: '127.0.0.1',
        port: 0,
        enableWebui: false,
        tokenStoreKind: 'sqlite',
        tokenDbPath,
        eventLogDir,
      }),
      'utf8',
    );

    const tokenResult = spawnSync(
      process.execPath,
      [distEntry, '--log-level', 'error', 'gateway', 'tokens', 'create', '--json', '--config', configPath, '--name', 'built-cli-e2e'],
      {
        encoding: 'utf8',
      },
    );
    expect(tokenResult.status).toBe(0);
    const tokenJson = JSON.parse(tokenResult.stdout);
    const token = tokenJson.data.plaintext as string;
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);

    const child = spawn(
      process.execPath,
      [distEntry, '--log-level', 'error', 'gateway', 'serve', '--json', '--config', configPath, '--no-webui'],
      {
        cwd: resolve(__dirname, '..', '..', '..'),
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk) => stderrChunks.push(chunk));

    try {
      const started = await new Promise<{ host: string; port: number }>((resolvePromise, rejectPromise) => {
        const timeout = setTimeout(() => {
          rejectPromise(new Error(`Timed out waiting for built gateway startup. stdout=${stdoutChunks.join('')} stderr=${stderrChunks.join('')}`));
        }, 10_000);

        const tryResolve = () => {
          const combined = stdoutChunks.join('').trim();
          if (!combined) {
            return;
          }
          try {
            const parsed = JSON.parse(combined) as { ok?: boolean; data?: { host?: string; port?: number } };
            if (parsed.ok === true && parsed.data && typeof parsed.data.host === 'string' && typeof parsed.data.port === 'number') {
              clearTimeout(timeout);
              resolvePromise({ host: parsed.data.host, port: parsed.data.port });
            }
          } catch {
            // Wait for the rest of the JSON payload.
          }
        };

        child.stdout.on('data', tryResolve);
        child.once('exit', (code) => {
          clearTimeout(timeout);
          rejectPromise(new Error(`Built gateway exited before startup with code ${code}. stdout=${stdoutChunks.join('')} stderr=${stderrChunks.join('')}`));
        });
      });

      const healthz = await fetch(`http://${started.host}:${started.port}/healthz`);
      expect(healthz.status).toBe(200);

      const agents = await fetch(`http://${started.host}:${started.port}/api/v1/agents`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      expect(agents.status).toBe(200);
      const agentsBody = await agents.json() as { agents: string[] };
      expect(agentsBody.agents.length).toBeGreaterThanOrEqual(1);
      expect(agentsBody.agents.some((a: string) => a.startsWith('claude'))).toBe(true);
    } finally {
      child.kill('SIGTERM');
      const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolvePromise) => {
        child.once('exit', (code, signal) => resolvePromise({ code, signal }));
      });
      expect(
        exit.code === 0 || exit.signal === 'SIGTERM' || exit.signal === 'SIGINT',
      ).toBe(true);
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 20_000);
});

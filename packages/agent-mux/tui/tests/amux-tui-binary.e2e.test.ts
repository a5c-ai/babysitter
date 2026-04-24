import { afterEach, describe, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pty from 'node-pty';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function stripAnsi(value: string): string {
  return value
    .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, '')
    .replace(/\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
    .replace(/\r/g, '');
}

function readEvents(eventsPath: string): Array<Record<string, unknown>> {
  if (!fs.existsSync(eventsPath)) {
    return [];
  }
  return fs
    .readFileSync(eventsPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

class PtyHarness {
  private buffer = '';
  private error: Error | null = null;
  private exitResult: { exitCode: number; signal: number } | null = null;
  private readonly exitPromise: Promise<{ exitCode: number; signal: number }>;

  constructor(private readonly proc: pty.IPty) {
    proc.onData((chunk) => {
      this.buffer += stripAnsi(chunk);
    });
    proc.on('error', (error: Error) => {
      if (error.message.includes('EIO')) {
        return;
      }
      this.error = error;
    });
    this.exitPromise = new Promise((resolve) => {
      proc.onExit(({ exitCode, signal }) => {
        const result = { exitCode, signal };
        this.exitResult = result;
        resolve(result);
      });
    });
  }

  text(): string {
    return this.buffer;
  }

  checkpoint(): number {
    return this.buffer.length;
  }

  write(value: string): void {
    this.proc.write(value);
  }

  async pause(ms = 120): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async waitFor(fragment: string, timeoutMs = 10_000): Promise<void> {
    await this.waitForSince(fragment, 0, timeoutMs);
  }

  async waitForSince(fragment: string, start: number, timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.error) {
        throw this.error;
      }
      if (this.exitResult) {
        throw new Error(
          `Process exited before "${fragment}" (exitCode=${this.exitResult.exitCode}, signal=${this.exitResult.signal}). Output:\n${this.buffer}`,
        );
      }
      if (this.buffer.slice(start).includes(fragment)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out waiting for "${fragment}". Output:\n${this.buffer}`);
  }

  async waitForCondition(
    label: string,
    predicate: () => boolean,
    timeoutMs = 10_000,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.error) {
        throw this.error;
      }
      if (this.exitResult) {
        throw new Error(
          `Process exited before ${label} (exitCode=${this.exitResult.exitCode}, signal=${this.exitResult.signal}). Output:\n${this.buffer}`,
        );
      }
      if (predicate()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out waiting for ${label}. Output:\n${this.buffer}`);
  }

  async close(): Promise<void> {
    this.proc.write('\u001B');
    await this.pause();
    this.proc.write('q');
    await Promise.race([
      this.exitPromise,
      new Promise<{ exitCode: number; signal: number }>((resolve) =>
        setTimeout(() => {
          this.proc.kill();
          resolve({ exitCode: -1, signal: 0 });
        }, 5000),
      ),
    ]);
    if (this.error) {
      throw this.error;
    }
  }
}

describe('real amux-tui binary e2e', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('loads external plugins and drives session detail, resume, and prompt dispatch through the real binary', async () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-home-'));
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-state-'));
    tempDirs.push(homeDir, stateDir);

    const pluginDir = path.resolve(__dirname, 'fixtures');
    const binaryPath = path.resolve(__dirname, '../dist/bin/amux-tui.js');
    const eventsPath = path.join(stateDir, 'events.jsonl');

    const proc = pty.spawn(process.execPath, [binaryPath], {
      name: 'xterm-color',
      cols: 120,
      rows: 40,
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        HOME: homeDir,
        AMUX_TUI_PLUGINS_DIR: pluginDir,
        AMUX_TUI_NO_BUILTIN_ADAPTERS: '1',
        AMUX_TUI_INITIAL_VIEW: 'sessions',
        AMUX_TUI_E2E_STATE_DIR: stateDir,
        AMUX_LOG_FILE: path.join(stateDir, 'amux.log'),
        AMUX_LOG_LEVEL: 'error',
        FORCE_COLOR: '0',
        NO_COLOR: '1',
      },
    });
    const harness = new PtyHarness(proc);
    await harness.pause(800);

    await harness.waitForCondition(
      'external session listing',
      () => readEvents(eventsPath).some((event) => event.type === 'list'),
    );

    const detailBaseline = readEvents(eventsPath).filter(
      (event) => event.type === 'parse' && event.sessionId === 'sess-beta',
    ).length;
    harness.write('d');
    await harness.waitForCondition(
      'session detail load',
      () =>
        readEvents(eventsPath).filter(
          (event) => event.type === 'parse' && event.sessionId === 'sess-beta',
        ).length > detailBaseline,
    );

    const exportBaseline = readEvents(eventsPath).filter(
      (event) => event.type === 'parse' && event.sessionId === 'sess-beta',
    ).length;
    harness.write('e');
    await harness.waitForCondition(
      'session export request',
      () =>
        readEvents(eventsPath).filter(
          (event) => event.type === 'parse' && event.sessionId === 'sess-beta',
        ).length > exportBaseline,
    );

    harness.write('b');
    await harness.pause(200);

    const resumeBaseline = readEvents(eventsPath).filter(
      (event) => event.type === 'parse' && event.sessionId === 'sess-beta',
    ).length;
    harness.write('\r');
    await harness.waitForCondition(
      'session resume transcript load',
      () =>
        readEvents(eventsPath).filter(
          (event) => event.type === 'parse' && event.sessionId === 'sess-beta',
        ).length > resumeBaseline,
    );

    harness.write('hello from binary e2e');
    await harness.pause();
    harness.write('\r');
    await harness.waitForCondition(
      'prompt dispatch through resumed session',
      () =>
        readEvents(eventsPath).some(
          (event) =>
            event.type === 'execute'
            && event.sessionId === 'sess-beta'
            && event.prompt === 'hello from binary e2e',
        ),
    );

    await harness.close();
  }, 30_000);
});

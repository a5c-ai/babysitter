import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pty from 'node-pty';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binaryPath = path.resolve(__dirname, '../dist/bin/amux-tui.js');
const fixturePluginPath = path.resolve(__dirname, 'fixtures/amux-tui-e2e-plugin.mjs');
const agentMuxCoreDistPath = path.resolve(__dirname, '../../../../node_modules/@a5c-ai/agent-mux-core/dist/index.js');
const agentMuxCliBootstrapDistPath = path.resolve(__dirname, '../../../../node_modules/@a5c-ai/agent-mux-cli/dist/bootstrap.js');
const observabilityDistPath = path.resolve(__dirname, '../../../../node_modules/@a5c-ai/agent-mux-observability/dist/index.js');
const describeBuiltBinary =
  fs.existsSync(binaryPath) &&
  fs.existsSync(agentMuxCoreDistPath) &&
  fs.existsSync(agentMuxCliBootstrapDistPath) &&
  fs.existsSync(observabilityDistPath)
    ? describe
    : describe.skip;

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

function hasListEventFor(eventsPath: string, sessionId: string): boolean {
  return readEvents(eventsPath).some((event) => {
    if (event.type !== 'list' || !Array.isArray(event.sessionIds)) {
      return false;
    }
    return event.sessionIds.includes(sessionId);
  });
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

  async pressUntilCondition(
    key: string,
    label: string,
    predicate: () => boolean,
    timeoutMs = 10_000,
    retryMs = 150,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      this.write(key);
      try {
        await this.waitForCondition(label, predicate, retryMs);
        return;
      } catch (error) {
        const message = String((error as Error).message ?? error);
        if (!message.includes(`Timed out waiting for ${label}`)) {
          throw error;
        }
      }
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

function installFixturePlugin(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(fixturePluginPath, path.join(targetDir, path.basename(fixturePluginPath)));
}

function spawnBinary(options: {
  homeDir: string;
  stateDir: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
}): PtyHarness {
  const proc = pty.spawn(process.execPath, [binaryPath, ...(options.args ?? [])], {
    name: 'xterm-color',
    cols: 120,
    rows: 40,
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      HOME: options.homeDir,
      AMUX_TUI_E2E_STATE_DIR: options.stateDir,
      AMUX_TUI_NO_BUILTIN_ADAPTERS: '1',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
      ...(options.env ?? {}),
    },
  });
  return new PtyHarness(proc);
}

describeBuiltBinary('real amux-tui binary e2e', () => {
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
    const eventsPath = path.join(stateDir, 'events.jsonl');
    const harness = spawnBinary({
      homeDir,
      stateDir,
      env: {
        AMUX_TUI_PLUGINS_DIR: pluginDir,
        AMUX_TUI_INITIAL_VIEW: 'sessions',
        AMUX_LOG_FILE: path.join(stateDir, 'amux.log'),
        AMUX_LOG_LEVEL: 'error',
      },
    });

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

    const resumeBaseline = readEvents(eventsPath).filter(
      (event) => event.type === 'parse' && event.sessionId === 'sess-beta',
    ).length;
    // Export behavior already has direct coverage in session-detail and CLI export tests.
    await harness.pressUntilCondition(
      'r',
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

  it('discovers user plugins from ~/.amux/tui-plugins by default', async () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-home-'));
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-state-'));
    tempDirs.push(homeDir, stateDir);

    installFixturePlugin(path.join(homeDir, '.amux', 'tui-plugins'));
    const eventsPath = path.join(stateDir, 'events.jsonl');
    const sessionFixturePath = path.join(stateDir, 'sess-beta.json');

    const harness = spawnBinary({
      homeDir,
      stateDir,
      env: {
        AMUX_TUI_INITIAL_VIEW: 'sessions',
        AMUX_TUI_NO_AUTO_PROMPT: '1',
      },
    });

    await harness.waitForCondition('user plugin registration', () => fs.existsSync(sessionFixturePath));
    await harness.waitForCondition(
      'session listing',
      () => hasListEventFor(eventsPath, 'sess-beta'),
    );

    await harness.close();
  }, 30_000);

  it('honors --user-plugins-dir for binary-level plugin discovery', async () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-home-'));
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-state-'));
    const pluginDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-plugins-'));
    tempDirs.push(homeDir, stateDir, pluginDir);

    installFixturePlugin(pluginDir);
    const eventsPath = path.join(stateDir, 'events.jsonl');
    const sessionFixturePath = path.join(stateDir, 'sess-beta.json');

    const harness = spawnBinary({
      homeDir,
      stateDir,
      args: ['--user-plugins-dir', pluginDir],
      env: {
        AMUX_TUI_INITIAL_VIEW: 'sessions',
        AMUX_TUI_NO_AUTO_PROMPT: '1',
      },
    });

    await harness.waitForCondition('user plugin registration', () => fs.existsSync(sessionFixturePath));
    await harness.waitForCondition(
      'session listing',
      () => hasListEventFor(eventsPath, 'sess-beta'),
    );

    await harness.close();
  }, 30_000);

  it('honors --no-user-plugins even when a plugin directory is configured', async () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-home-'));
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-state-'));
    const pluginDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-plugins-'));
    tempDirs.push(homeDir, stateDir, pluginDir);

    installFixturePlugin(pluginDir);
    const eventsPath = path.join(stateDir, 'events.jsonl');
    const sessionFixturePath = path.join(stateDir, 'sess-beta.json');

    const harness = spawnBinary({
      homeDir,
      stateDir,
      args: ['--user-plugins-dir', pluginDir, '--no-user-plugins'],
      env: {
        AMUX_TUI_INITIAL_VIEW: 'sessions',
        AMUX_TUI_NO_AUTO_PROMPT: '1',
      },
    });

    await harness.pause(500);
    expect(fs.existsSync(sessionFixturePath)).toBe(false);
    expect(readEvents(eventsPath)).toEqual([]);
    expect(harness.text()).not.toContain('sess-beta');

    await harness.close();
  }, 30_000);

  it('keeps the sessions view interactive after a live terminal resize', async () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-home-'));
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-state-'));
    tempDirs.push(homeDir, stateDir);

    const pluginDir = path.resolve(__dirname, 'fixtures');
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
        AMUX_TUI_INITIAL_VIEW: 'sessions',
        AMUX_TUI_NO_BUILTIN_ADAPTERS: '1',
        AMUX_TUI_NO_AUTO_PROMPT: '1',
        AMUX_TUI_E2E_STATE_DIR: stateDir,
        FORCE_COLOR: '0',
        NO_COLOR: '1',
      },
    });
    const harness = new PtyHarness(proc);

    await harness.waitForCondition(
      'session listing',
      () => hasListEventFor(eventsPath, 'sess-beta'),
    );

    const refreshBaseline = readEvents(eventsPath).filter(
      (event) => event.type === 'list' && Array.isArray(event.sessionIds) && event.sessionIds.includes('sess-beta'),
    ).length;

    proc.resize(44, 14);
    await harness.pause(250);
    harness.write('R');
    await harness.waitForCondition(
      'session refresh after resize',
      () =>
        readEvents(eventsPath).filter(
          (event) => event.type === 'list' && Array.isArray(event.sessionIds) && event.sessionIds.includes('sess-beta'),
        ).length > refreshBaseline,
    );
    expect(harness.text()).not.toContain('Process exited before');

    await harness.close();
  }, 30_000);
});

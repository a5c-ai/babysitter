import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Module from 'module';
import * as codexAdapterModule from '../index';
import {
  SESSION_START_PAYLOAD,
  STOP_PAYLOAD,
  TOOL_AFTER_PAYLOAD,
} from './fixtures/codex-events';

vi.mock('../../../cli/src/cli/stdin', () => ({
  readStdin: vi.fn(async () => ''),
}));

import { readStdin } from '../../../cli/src/cli/stdin';
import { loadAdapter } from '../../../cli/src/cli/adapter-loader';
import { invokeCommand } from '../../../cli/src/cli/commands/invoke';

const mockReadStdin = vi.mocked(readStdin);
const originalRequire = Module.prototype.require;

function patchAdapterPackageResolution(): void {
  Module.prototype.require = function patchedRequire(this: NodeJS.Module, id: string) {
    if (id === '@a5c-ai/agent-mux-hooks-adapter-codex') {
      return codexAdapterModule;
    }
    return originalRequire.call(this, id);
  };
}

function restoreAdapterPackageResolution(): void {
  Module.prototype.require = originalRequire;
}

function captureStdout(): { getOutput: () => string; restore: () => void } {
  const originalWrite = process.stdout.write;
  let output = '';

  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
    return true;
  }) as typeof process.stdout.write;

  return {
    getOutput: () => output,
    restore: () => {
      process.stdout.write = originalWrite;
    },
  };
}

async function createTempSessionRoot(): Promise<{
  tmpRoot: string;
  sessionDir: string;
  cleanup: () => Promise<void>;
}> {
  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'codex-invoke-'));
  const sessionDir = path.join(tmpRoot, 'a5c-hooks', 'sessions');
  await fs.promises.mkdir(sessionDir, { recursive: true });
  return {
    tmpRoot,
    sessionDir,
    cleanup: async () => {
      await fs.promises.rm(tmpRoot, { recursive: true, force: true });
    },
  };
}

async function readSessionFile(
  sessionDir: string,
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const filePath = path.join(sessionDir, `${sessionId}.json`);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function writeHandlerScript(tmpRoot: string, name: string, body: string): Promise<string> {
  const scriptPath = path.join(tmpRoot, `${name}.js`);
  await fs.promises.writeFile(scriptPath, body, 'utf-8');

  const adapterPkgDir = path.resolve(__dirname, '..', '..');
  const launcherDir = path.join(adapterPkgDir, '.e2e-tmp-handlers', path.basename(tmpRoot));
  await fs.promises.mkdir(launcherDir, { recursive: true });

  const launcherPath = path.join(launcherDir, `${name}-launcher-${process.pid}.js`);
  const scriptPathForward = scriptPath.replace(/\\/g, '/');
  await fs.promises.writeFile(launcherPath, `require("${scriptPathForward}");`, 'utf-8');

  const relativeLauncher = path.relative(adapterPkgDir, launcherPath).replace(/\\/g, '/');
  return `node ${relativeLauncher}`;
}

describe('Codex invoke integration through CLI loader', () => {
  let envSnapshot: NodeJS.ProcessEnv;

  beforeEach(() => {
    patchAdapterPackageResolution();
    vi.clearAllMocks();
    envSnapshot = { ...process.env };
  });

  afterEach(() => {
    process.env = envSnapshot;
    restoreAdapterPackageResolution();
  });

  afterAll(() => {
    restoreAdapterPackageResolution();
  });

  it('loads Codex invoke aliases through the adapter package contract', () => {
    const loaded = loadAdapter('codex');
    expect(loaded.capabilities.name).toBe('codex');
    expect(loaded.normalizer).toBe(codexAdapterModule.normalizeForInvoke);
    expect(loaded.renderer).toBe(codexAdapterModule.renderForInvoke);
    expect(loaded.sessionResolver).toBe(codexAdapterModule.resolveSessionId);
  });

  it('bootstraps SessionStart through invoke using the loader-resolved package', async () => {
    const { sessionDir, tmpRoot, cleanup } = await createTempSessionRoot();
    const stdout = captureStdout();

    try {
      process.env.XDG_STATE_HOME = tmpRoot;
      mockReadStdin.mockResolvedValue(JSON.stringify(SESSION_START_PAYLOAD));

      await invokeCommand.handler({
        adapter: 'codex',
        'native-event': 'SessionStart',
        'bootstrap-only': true,
        json: true,
      } as never);

      const output = JSON.parse(stdout.getOutput().trim()) as Record<string, unknown>;
      expect(output).toEqual({
        status: 'bootstrapped',
        sessionId: 'codex-sess-abc123',
      });

      const sessionEnvelope = await readSessionFile(sessionDir, 'codex-sess-abc123');
      expect(sessionEnvelope).not.toBeNull();
      expect(sessionEnvelope).toEqual(expect.objectContaining({
        session: expect.objectContaining({
          sessionId: 'codex-sess-abc123',
          adapter: 'codex',
        }),
      }));
    } finally {
      stdout.restore();
      await cleanup();
    }
  });

  it('renders native Stop output through invoke and drops unsupported fields', async () => {
    const { tmpRoot, cleanup } = await createTempSessionRoot();
    const stdout = captureStdout();

    try {
      process.env.XDG_STATE_HOME = tmpRoot;
      mockReadStdin.mockResolvedValue(JSON.stringify(STOP_PAYLOAD));

      const handler = await writeHandlerScript(tmpRoot, 'stop-handler', `
        process.stdout.write(JSON.stringify({
          decision: 'deny',
          reason: 'forced stop',
          continueSession: false,
          stopReason: 'iteration limit'
        }));
      `);

      await invokeCommand.handler({
        adapter: 'codex',
        'native-event': 'Stop',
        handler: [handler],
        json: true,
      } as never);

      const output = JSON.parse(stdout.getOutput().trim()) as Record<string, unknown>;
      expect(output.continueSession).toBe(false);
      expect(output.stopReason).toBe('iteration limit');
      expect(output.reason).toBe('forced stop');
      expect(output).not.toHaveProperty('decision');
      expect(output.metadata).toBeDefined();
    } finally {
      stdout.restore();
      await cleanup();
    }
  });

  it('renders native PostToolUse output through invoke and preserves suppressOutput only', async () => {
    const { tmpRoot, cleanup } = await createTempSessionRoot();
    const stdout = captureStdout();

    try {
      process.env.XDG_STATE_HOME = tmpRoot;
      mockReadStdin.mockResolvedValue(JSON.stringify(TOOL_AFTER_PAYLOAD));

      const handler = await writeHandlerScript(tmpRoot, 'post-tool-handler', `
        process.stdout.write(JSON.stringify({
          decision: 'deny',
          reason: 'redacted tool output',
          suppressOutput: true
        }));
      `);

      await invokeCommand.handler({
        adapter: 'codex',
        'native-event': 'PostToolUse',
        handler: [handler],
        json: true,
      } as never);

      const output = JSON.parse(stdout.getOutput().trim()) as Record<string, unknown>;
      expect(output.suppressOutput).toBe(true);
      expect(output.reason).toBe('redacted tool output');
      expect(output).not.toHaveProperty('decision');
      expect(output.metadata).toBeDefined();
    } finally {
      stdout.restore();
      await cleanup();
    }
  });
});

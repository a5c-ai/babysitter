import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const execSyncMock = vi.fn(() => '');
const spawnMock = vi.fn();
const startTransportMuxRuntimeMock = vi.fn();

vi.mock('node:child_process', () => ({
  execSync: execSyncMock,
  spawn: spawnMock,
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

vi.mock('@a5c-ai/transport-mux', () => ({
  startTransportMuxRuntime: startTransportMuxRuntimeMock,
}));

vi.mock('@a5c-ai/agent-mux-adapters', () => ({
  translateForHarness: vi.fn(() => ({
    env: {},
    args: [],
    proxyRequired: true,
    proxyExposedTransport: 'openai-responses',
  })),
}));

vi.mock('@a5c-ai/agent-mux-core', () => ({
  PROVIDER_DEFAULTS: {
    bedrock: { envKey: undefined },
  },
  WorkspaceService: class {
    async createWorkspace() {
      throw new Error('not used in this test');
    }

    async resolveWorkspace() {
      return null;
    }
  },
  resolveWorkspaceDefaultCwd: vi.fn((workspace: { rootPath?: string }) => workspace.rootPath ?? process.cwd()),
  resolveProvider: vi.fn((input: Record<string, unknown>) => ({
    provider: input['provider'] ?? 'anthropic',
    model: input['model'] ?? 'claude-sonnet-4-20250514',
    transport: input['transport'] ?? 'anthropic',
    auth: { type: 'iam' },
    params: {},
  })),
}));

describe('launchCommand transport-mux integration', () => {
  beforeEach(() => {
    vi.resetModules();
    execSyncMock.mockReset();
    spawnMock.mockReset();
    startTransportMuxRuntimeMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts the transport-mux runtime and passes its env through to the harness', async () => {
    const runtimeStop = vi.fn(async () => {});
    startTransportMuxRuntimeMock.mockResolvedValue({
      url: 'http://127.0.0.1:4010',
      port: 4010,
      authToken: 'runtime-token',
      config: {
        targetProvider: 'bedrock',
        targetModel: 'bedrock/anthropic.claude-sonnet-4-20250514-v1:0',
        exposedTransport: 'openai-responses',
        host: '127.0.0.1',
        port: 4010,
        stream: true,
      },
      applyHarnessEnv(env: Record<string, string>) {
        env['OPENAI_BASE_URL'] = 'http://127.0.0.1:4010';
        env['OPENAI_API_KEY'] = 'runtime-token';
        return env;
      },
      stop: runtimeStop,
    });

    const child = new EventEmitter() as EventEmitter & {
      pid: number;
      stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
      stdout: PassThrough;
      stderr: PassThrough;
      kill: ReturnType<typeof vi.fn>;
    };
    child.pid = 4242;
    child.stdin = { write: vi.fn(), end: vi.fn() };
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = vi.fn();
    spawnMock.mockImplementation(() => {
      queueMicrotask(() => child.emit('exit', 0, null));
      return child;
    });

    const [{ launchCommand, LAUNCH_FLAGS }, { parseArgs }] = await Promise.all([
      import('../src/commands/launch.js'),
      import('../src/parse-args.js'),
    ]);

    const client = {
      adapters: {
        get: () => ({
          agent: 'codex',
          detectInstallation: async () => ({ installed: true }),
        }),
        list: () => [{ agent: 'codex' }],
      },
    } as any;

    const code = await launchCommand(
      client,
      parseArgs(
        ['launch', 'codex', 'bedrock', '--with-proxy-if-needed', '--prompt', 'hello'],
        LAUNCH_FLAGS,
      ),
    );

    expect(code).toBe(0);
    expect(startTransportMuxRuntimeMock).toHaveBeenCalledWith({
      targetProvider: 'bedrock',
      targetModel: 'bedrock/claude-sonnet-4-20250514',
      exposedTransport: 'openai-responses',
      port: 0,
    });
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock.mock.calls[0]?.[2]?.env['OPENAI_BASE_URL']).toBe('http://127.0.0.1:4010');
    expect(spawnMock.mock.calls[0]?.[2]?.env['OPENAI_API_KEY']).toBe('runtime-token');
    expect(runtimeStop).toHaveBeenCalledTimes(1);
    expect(child.stdin.write).toHaveBeenCalledWith('hello');
    expect(child.stdin.end).toHaveBeenCalledTimes(1);
  });
});

import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

vi.mock('node-pty', () => {
  throw new Error('node-pty mocked out for tests');
});

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

vi.mock('@a5c-ai/agent-catalog', () => ({
  getLaunchBehavior: vi.fn((harness: string) => {
    const behaviors: Record<string, unknown> = {
      claude: { promptDelivery: 'cli-flag', promptFlag: '-p', stdinBehavior: 'close-after-prompt', selfExits: true, needsIdleKill: false, sessionIdFlag: '--session-id', maxTurnsFlag: '--max-turns', resumeDelivery: 'flag', resumeFlag: '--resume' },
      codex: { promptDelivery: 'exec-subcommand', execSubcommand: 'exec', stdinBehavior: 'close-after-prompt', selfExits: true, needsIdleKill: false, resumeDelivery: 'subcommand', resumeSubcommand: 'resume' },
      pi: { promptDelivery: 'cli-flag', promptFlag: '-p', promptExtraFlags: ['--mode', 'json'], stdinBehavior: 'close-after-prompt', selfExits: false, needsIdleKill: true },
      gemini: { promptDelivery: 'cli-flag', promptFlag: '--prompt', stdinBehavior: 'close-after-prompt', selfExits: true, needsIdleKill: false },
      hermes: { promptDelivery: 'stdin', stdinBehavior: 'keep-open', selfExits: false, needsIdleKill: true },
    };
    return behaviors[harness] ?? undefined;
  }),
  getBridgeCapabilities: vi.fn(() => ({})),
  getYoloLaunchArgs: vi.fn(() => []),
  getAutomationEnv: vi.fn(() => ({})),
  getHookSupport: vi.fn(() => ({})),
  getAdapterMetadata: vi.fn(() => null),
  getSessionConfig: vi.fn(() => ({})),
}));

vi.mock('@a5c-ai/agent-comm-mux', () => ({
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
        ['launch', 'codex', 'bedrock', '--with-proxy-if-needed', '--prompt', 'hello', '--no-interactive'],
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
    expect(spawnMock.mock.calls[0]?.[2]?.env['OPENAI_BASE_URL']).toBe('http://127.0.0.1:4010/v1');
    expect(spawnMock.mock.calls[0]?.[2]?.env['OPENAI_API_KEY']).toBe('runtime-token');
    expect(spawnMock.mock.calls[0]?.[1]).toContain('-m');
    expect(spawnMock.mock.calls[0]?.[1]).toContain('claude-sonnet-4-20250514');
    expect(spawnMock.mock.calls[0]?.[1]).toContain('-c');
    expect(spawnMock.mock.calls[0]?.[1]).toContain('model_provider="amux-proxy"');
    expect(spawnMock.mock.calls[0]?.[1]).toContain('model_providers.amux-proxy.base_url="http://127.0.0.1:4010/v1"');
    expect(spawnMock.mock.calls[0]?.[1]).toContain('model_providers.amux-proxy.env_key="OPENAI_API_KEY"');
    expect(spawnMock.mock.calls[0]?.[1]).toContain('model_providers.amux-proxy.wire_api="responses"');
    expect(runtimeStop).toHaveBeenCalledTimes(1);
    const spawnedArgs = spawnMock.mock.calls[0]?.[1] as string[];
    expect(spawnedArgs).toContain('exec');
    expect(spawnedArgs).toContain('hello');
    expect(child.stdin.write).not.toHaveBeenCalled();
    expect(child.stdin.end).toHaveBeenCalledTimes(1);
  });

  it('passes non-interactive Pi prompts through stdin injection', async () => {
    const runtimeStop = vi.fn(async () => {});
    const originalHome = process.env['HOME'];
    const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-pi-home-'));
    process.env['HOME'] = tempHome;
    startTransportMuxRuntimeMock.mockResolvedValue({
      url: 'http://127.0.0.1:4011',
      port: 4011,
      authToken: 'runtime-token',
      config: {
        targetProvider: 'bedrock',
        targetModel: 'bedrock/anthropic.claude-sonnet-4-20250514-v1:0',
        exposedTransport: 'openai-responses',
        host: '127.0.0.1',
        port: 4011,
        stream: true,
      },
      applyHarnessEnv(env: Record<string, string>) {
        env['OPENAI_BASE_URL'] = 'http://127.0.0.1:4011';
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
    child.pid = 4243;
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
          agent: 'pi',
          detectInstallation: async () => ({ installed: true }),
        }),
        list: () => [{ agent: 'pi' }],
      },
    } as any;

    try {
      const code = await launchCommand(
        client,
        parseArgs(
          ['launch', 'pi', 'bedrock', '--with-proxy-if-needed', '--prompt', 'write the file', '--no-interactive'],
          LAUNCH_FLAGS,
        ),
      );

      expect(code).toBe(0);
      expect(spawnMock).toHaveBeenCalledTimes(1);
      const spawnedArgs = spawnMock.mock.calls[0]?.[1] as string[];
      expect(spawnedArgs).toContain('-p');
      expect(spawnedArgs).toContain('write the file');
      expect(spawnedArgs).toContain('--mode');
      expect(spawnedArgs).toContain('json');
      expect(child.stdin.write).not.toHaveBeenCalled();
      expect(child.stdin.end).toHaveBeenCalledTimes(1);
      expect(runtimeStop).toHaveBeenCalledTimes(1);
    } finally {
      if (originalHome === undefined) delete process.env['HOME'];
      else process.env['HOME'] = originalHome;
      fs.rmSync(tempHome, { recursive: true, force: true });
    }
  });

  it('passes Hermes proxy endpoints through native provider flags', async () => {
    const runtimeStop = vi.fn(async () => {});
    startTransportMuxRuntimeMock.mockResolvedValue({
      url: 'http://127.0.0.1:4012',
      port: 4012,
      authToken: 'runtime-token',
      config: {
        targetProvider: 'foundry',
        targetModel: 'foundry/gpt-5.5',
        exposedTransport: 'openai-chat',
        host: '127.0.0.1',
        port: 4012,
        stream: true,
      },
      applyHarnessEnv(env: Record<string, string>) {
        env['OPENAI_BASE_URL'] = 'http://127.0.0.1:4012';
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
    child.pid = 4244;
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
          agent: 'hermes',
          detectInstallation: async () => ({ installed: true }),
        }),
        list: () => [{ agent: 'hermes' }],
      },
    } as any;

    const code = await launchCommand(
      client,
      parseArgs(
        ['launch', 'hermes', 'foundry', '--with-proxy', '--prompt', 'write the file', '--no-interactive'],
        LAUNCH_FLAGS,
      ),
    );

    expect(code).toBe(0);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    const spawnedArgs = spawnMock.mock.calls[0]?.[1] as string[];
    expect(spawnedArgs).toContain('--provider');
    expect(spawnedArgs).toContain('custom');
    expect(spawnedArgs).toContain('--base-url');
    expect(spawnedArgs).toContain('http://127.0.0.1:4012/v1');
    expect(spawnedArgs).toContain('--api-key');
    expect(spawnedArgs).toContain('runtime-token');
    expect(child.stdin.write).toHaveBeenCalledWith('write the file\n');
    expect(child.stdin.end).not.toHaveBeenCalled();
    expect(runtimeStop).toHaveBeenCalledTimes(1);
  });
});

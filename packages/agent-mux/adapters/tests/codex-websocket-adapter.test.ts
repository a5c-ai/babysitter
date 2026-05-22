import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as os from 'node:os';
import * as path from 'node:path';

const mockConnectionInstances: Array<Record<string, unknown>> = [];
const mockConnect = vi.fn(async () => {});
const mockClose = vi.fn(async () => {});
const mockSpawn = vi.fn();

vi.mock('../src/codex-websocket-connection.js', () => ({
  CodexWebSocketConnection: vi.fn(class {
    connectionId: unknown;
    connectionType = 'websocket' as const;
    websocketUrl: unknown;
    endpoint: unknown;
    connect = mockConnect;
    close = mockClose;
    send = vi.fn();
    receive = async function* () {};
    subscribe = async function* () {};
    unsubscribe = vi.fn(async () => {});

    constructor(options: Record<string, unknown>) {
      this.connectionId = options.connectionId;
      this.websocketUrl = options.websocketUrl;
      this.endpoint = options.websocketUrl;
      mockConnectionInstances.push({ options, connection: this });
    }
  }),
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: mockSpawn,
  };
});

const { CodexWebSocketAdapter } = await import('../src/codex-websocket-adapter.js');

describe('CodexWebSocketAdapter', () => {
  let adapter: InstanceType<typeof CodexWebSocketAdapter>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    adapter = new CodexWebSocketAdapter();
    originalEnv = { ...process.env };
    mockConnectionInstances.length = 0;
    mockConnect.mockClear();
    mockClose.mockClear();
    mockSpawn.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exposes the real app-server identity and persistent transport semantics', () => {
    expect(adapter.adapterType).toBe('remote');
    expect(adapter.connectionType).toBe('websocket');
    expect(adapter.agent).toBe('codex-websocket');
    expect(adapter.displayName).toBe('Codex (App Server)');
    expect(adapter.minVersion).toBe('0.121.0');
    expect(adapter.capabilities.structuredSessionTransport).toBe('persistent');
    expect(adapter.capabilities.supportsInteractiveMode).toBe(true);
    expect(adapter.capabilities.supportsStdinInjection).toBe(true);
    expect(adapter.capabilities.supportsMCP).toBe(true);
    expect(adapter.capabilities.supportsThinkingStreaming).toBe(true);
  });

  it('describes Codex CLI installation rather than the removed mock server package', () => {
    expect(adapter.capabilities.installMethods).toHaveLength(1);
    expect(adapter.capabilities.installMethods[0]?.command).toBe('npm install -g @openai/codex');
    expect(adapter.getAuthGuidance().verifyCommand).toBe('codex app-server --help');
  });

  it('detects OpenAI auth from environment and codex auth files', async () => {
    process.env.OPENAI_API_KEY = 'sk-test1234';
    await expect(adapter.detectAuth()).resolves.toMatchObject({
      status: 'authenticated',
      method: 'api_key',
      identity: 'openai:...1234',
    });
  });

  it('returns the codex session directory and config schema', () => {
    expect(adapter.sessionDir()).toBe(path.join(os.homedir(), '.codex', 'sessions'));
    expect(adapter.configSchema.configFilePaths?.[0]).toContain(path.join('.codex', 'config.json'));
    expect(adapter.configSchema.supportsProjectConfig).toBe(false);
  });

  it('uses an external CODEX_APP_SERVER endpoint when provided', async () => {
    process.env.CODEX_APP_SERVER = 'http://127.0.0.1:43210';
    const server = await adapter.startServer();
    expect(server.serverId).toBe('codex-app-server-external');
    expect(server.endpoint).toBe('ws://127.0.0.1:43210');
    expect(server.port).toBe(43210);
  });

  it.skipIf(process.platform !== 'win32')('starts a managed codex app-server process on Windows PowerShell shims', async () => {
    vi.spyOn(adapter as never, 'findAvailablePort').mockResolvedValue(32150);
    vi.spyOn(adapter as never, 'findCommandInPath').mockReturnValue(
      'C:\\Users\\tmusk\\.nvm\\versions\\node\\v22.22.0\\bin\\codex.ps1',
    );
    vi.spyOn(adapter, 'healthCheck').mockResolvedValue({
      status: 'healthy',
      lastCheck: new Date(),
    });

    const stderr = new EventEmitter();
    const child = {
      pid: 12345,
      stderr,
      once: vi.fn(),
      kill: vi.fn(),
      killed: false,
    };
    mockSpawn.mockReturnValue(child);

    const server = await adapter.startServer();

    expect(mockSpawn).toHaveBeenCalledWith(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        'C:\\Users\\tmusk\\.nvm\\versions\\node\\v22.22.0\\bin\\codex.ps1',
        'app-server',
        '--listen',
        'ws://127.0.0.1:32150',
      ],
      expect.objectContaining({
        stdio: ['ignore', 'ignore', 'pipe'],
      }),
    );
    expect(server.endpoint).toBe('ws://127.0.0.1:32150');
    expect(server.pid).toBe(12345);

    await adapter.stopServer(server);
    expect(child.kill).toHaveBeenCalled();
  });

  it('reports readyz health through HTTP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const health = await adapter.healthCheck({
      serverId: 'srv',
      serverType: 'codex-websocket',
      endpoint: 'ws://127.0.0.1:32150',
      port: 32150,
      startedAt: new Date(),
    });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:32150/readyz');
    expect(health.status).toBe('healthy');
  });

  it('creates a Codex app-server connection with the run options wired through', async () => {
    vi.spyOn(adapter as never, 'ensureServer').mockResolvedValue({
      serverId: 'srv',
      serverType: 'codex-websocket',
      endpoint: 'ws://127.0.0.1:32150',
      port: 32150,
      startedAt: new Date(),
    });

    const connection = await adapter.connect({
      agent: 'codex-websocket',
      prompt: 'hello from agent-mux',
      cwd: 'C:/work/agent-mux',
      model: 'o4-mini',
      approvalMode: 'yolo',
      sessionId: 'session-123',
    });

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(connection.connectionType).toBe('websocket');
    expect(mockConnectionInstances[0]?.options).toMatchObject({
      websocketUrl: 'ws://127.0.0.1:32150',
      prompt: 'hello from agent-mux',
      cwd: 'C:/work/agent-mux',
      requestedModel: 'o4-mini',
      approvalMode: 'yolo',
      sessionId: 'session-123',
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const execFileSyncMock = vi.fn<(...args: any[]) => string>();
const execSyncMock = vi.fn(() => '');

/** Create a minimal fake ChildProcess that launch.ts can interact with. */
function makeFakeChild() {
  const listeners: Record<string, ((...args: any[]) => void)[]> = {};
  return {
    pid: 1234,
    stdin: {
      write: vi.fn(),
      end: vi.fn(),
    },
    stdout: null,
    stderr: null,
    on(event: string, cb: (...args: any[]) => void) {
      (listeners[event] ??= []).push(cb);
      return this;
    },
    kill: vi.fn(),
    /** Helper to trigger exit from tests. */
    _triggerExit(code: number) {
      for (const cb of listeners['exit'] ?? []) cb(code, null);
    },
  };
}

const spawnMock = vi.fn(() => makeFakeChild());

vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
  execSync: execSyncMock,
  spawn: spawnMock,
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

// PTY mock — minimal for bridge-hooks tests (bridge-hooks doesn't use PTY itself)
const ptySpawnMock = vi.fn(() => ({
  pid: 9999,
  onData(cb: (data: string) => void) {},
  onExit(cb: (info: { exitCode: number }) => void) {},
  write(data: string) {},
  kill(sig: string) {},
}));

vi.mock('node-pty', () => ({
  default: { spawn: ptySpawnMock },
  spawn: ptySpawnMock,
}));

vi.mock('@a5c-ai/transport-mux', () => ({
  startTransportMuxRuntime: vi.fn(),
}));

vi.mock('@a5c-ai/agent-mux-adapters', () => ({
  translateForHarness: vi.fn(() => ({
    env: {},
    args: [],
    proxyRequired: false,
    proxyExposedTransport: undefined,
  })),
  getAdapterFactory: vi.fn(() => () => ({
    parseEvent() { return null; },
  })),
}));

vi.mock('@a5c-ai/agent-comm-mux', () => ({
  PROVIDER_DEFAULTS: {},
  StreamAssembler: class {
    feed(line: string) { return line; }
    endBlock() { return null; }
    reset() {}
  },
  WorkspaceService: class {
    async createWorkspace() { throw new Error('not used'); }
    async resolveWorkspace() { return null; }
  },
  resolveWorkspaceDefaultCwd: vi.fn(() => process.cwd()),
  resolveProvider: vi.fn((input: Record<string, unknown>) => ({
    provider: input['provider'] ?? 'anthropic',
    model: input['model'] ?? 'claude-sonnet-4-20250514',
    transport: input['transport'] ?? 'anthropic',
    auth: { type: 'api_key', apiKey: 'sk-test' },
    params: {},
  })),
}));

// Controllable mock for agent-catalog
const getHookSupportMock = vi.fn();
const getBridgeCapabilitiesMock = vi.fn();
const getYoloLaunchArgsMock = vi.fn(() => []);

vi.mock('@a5c-ai/agent-catalog', () => ({
  getHookSupport: getHookSupportMock,
  getBridgeCapabilities: getBridgeCapabilitiesMock,
  getYoloLaunchArgs: getYoloLaunchArgsMock,
  getAutomationEnv: vi.fn(() => ({})),
  getAdapterMetadata: vi.fn(() => null),
  getSessionConfig: vi.fn(() => ({})),
  getLaunchBehavior: vi.fn(() => undefined),
}));

// ---------------------------------------------------------------------------
// BridgeHookEmulator direct tests
// ---------------------------------------------------------------------------

describe('BridgeHookEmulator', () => {
  beforeEach(() => {
    vi.resetModules();
    execFileSyncMock.mockReset();
    getHookSupportMock.mockReset();
    getBridgeCapabilitiesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function createEmulator(overrides: Record<string, unknown> = {}) {
    const { BridgeHookEmulator } = await import('../src/commands/launch-bridge-hooks.js');
    return new BridgeHookEmulator({
      harness: 'codex',
      cwd: '/tmp/test',
      env: {},
      sessionId: 'sess-123',
      runsDir: '/tmp/runs',
      verbose: false,
      ...overrides,
    });
  }

  // -----------------------------------------------------------------------
  // emulateSessionStart
  // -----------------------------------------------------------------------

  describe('emulateSessionStart()', () => {
    it('calls babysitter hook:run --hook-type session-start when hook is unsupported', async () => {
      getHookSupportMock.mockReturnValue({ sessionStart: 'unsupported' });
      execFileSyncMock.mockReturnValue('{"runId":"run-abc"}');

      const emulator = await createEmulator();
      const result = await emulator.emulateSessionStart();

      expect(result.emulated).toBe(true);
      expect(result.runId).toBe('run-abc');
      expect(execFileSyncMock).toHaveBeenCalledTimes(1);

      const [bin, args] = execFileSyncMock.mock.calls[0]!;
      expect(bin).toBe('babysitter');
      expect(args).toContain('hook:run');
      expect(args).toContain('--hook-type');
      expect(args).toContain('session-start');
      expect(args).toContain('--harness');
      expect(args).toContain('codex');
      expect(args).toContain('--runs-dir');
      expect(args).toContain('/tmp/runs');
    });

    it('is a no-op when hook support is native', async () => {
      getHookSupportMock.mockReturnValue({ sessionStart: 'native' });

      const emulator = await createEmulator();
      const result = await emulator.emulateSessionStart();

      expect(result.emulated).toBe(false);
      expect(result.runId).toBeUndefined();
      expect(execFileSyncMock).not.toHaveBeenCalled();
    });

    it('uses BABYSITTER_BIN env var to resolve binary', async () => {
      getHookSupportMock.mockReturnValue({ sessionStart: 'unsupported' });
      execFileSyncMock.mockReturnValue('{}');

      const emulator = await createEmulator({
        env: { BABYSITTER_BIN: '/usr/local/bin/my-babysitter' },
      });
      await emulator.emulateSessionStart();

      expect(execFileSyncMock).toHaveBeenCalledTimes(1);
      const [bin] = execFileSyncMock.mock.calls[0]!;
      expect(bin).toBe('/usr/local/bin/my-babysitter');
    });

    it('returns emulated:true even if babysitter CLI throws (non-fatal)', async () => {
      getHookSupportMock.mockReturnValue({ sessionStart: 'emulated' });
      execFileSyncMock.mockImplementation(() => { throw new Error('CLI not found'); });

      const emulator = await createEmulator();
      const result = await emulator.emulateSessionStart();

      expect(result.emulated).toBe(true);
      expect(result.runId).toBeUndefined();
    });

    it('emulates when hook support is undefined (catalog not available)', async () => {
      getHookSupportMock.mockReturnValue(undefined);
      execFileSyncMock.mockReturnValue('{"runId":"run-xyz"}');

      const emulator = await createEmulator();
      const result = await emulator.emulateSessionStart();

      expect(result.emulated).toBe(true);
      expect(result.runId).toBe('run-xyz');
    });
  });

  // -----------------------------------------------------------------------
  // emulateStop
  // -----------------------------------------------------------------------

  describe('emulateStop()', () => {
    it('returns shouldContinue=true when run has pending effects', async () => {
      getHookSupportMock.mockReturnValue({ sessionStart: 'unsupported', stop: 'unsupported' });
      // First call: session-start, second call: run:status
      execFileSyncMock
        .mockReturnValueOnce('{"runId":"run-001"}')
        .mockReturnValueOnce(JSON.stringify({
          state: 'running',
          needsMoreIterations: false,
          pendingEffectsSummary: { totalPending: 3 },
        }));

      const emulator = await createEmulator();
      await emulator.emulateSessionStart();
      const result = await emulator.emulateStop();

      expect(result.emulated).toBe(true);
      expect(result.shouldContinue).toBe(true);
      expect(result.resumeId).toBe('sess-123');
    });

    it('returns shouldContinue=true when needsMoreIterations is true', async () => {
      getHookSupportMock.mockReturnValue({ stop: 'unsupported' });
      execFileSyncMock.mockReturnValue(JSON.stringify({
        state: 'running',
        needsMoreIterations: true,
        pendingEffectsSummary: { totalPending: 0 },
      }));

      const emulator = await createEmulator();
      // Manually set runId by providing it to emulateStop
      const result = await emulator.emulateStop('run-manual');

      expect(result.shouldContinue).toBe(true);
      expect(result.emulated).toBe(true);
    });

    it('returns shouldContinue=false when run is completed', async () => {
      getHookSupportMock.mockReturnValue({ stop: 'unsupported' });
      execFileSyncMock.mockReturnValue(JSON.stringify({
        state: 'completed',
        needsMoreIterations: false,
        pendingEffectsSummary: { totalPending: 0 },
      }));

      const emulator = await createEmulator();
      const result = await emulator.emulateStop('run-done');

      expect(result.shouldContinue).toBe(false);
      expect(result.emulated).toBe(true);
      expect(result.resumeId).toBeUndefined();
    });

    it('returns shouldContinue=false when no runId is available', async () => {
      getHookSupportMock.mockReturnValue({ stop: 'unsupported' });

      const emulator = await createEmulator();
      // No session-start was called, so no runId
      const result = await emulator.emulateStop();

      expect(result.shouldContinue).toBe(false);
      expect(result.emulated).toBe(true);
      expect(execFileSyncMock).not.toHaveBeenCalled();
    });

    it('is a no-op when hook support is native', async () => {
      getHookSupportMock.mockReturnValue({ stop: 'native' });

      const emulator = await createEmulator();
      const result = await emulator.emulateStop('run-001');

      expect(result.shouldContinue).toBe(false);
      expect(result.emulated).toBe(false);
      expect(execFileSyncMock).not.toHaveBeenCalled();
    });

    it('returns shouldContinue=false on exec error (safe default)', async () => {
      getHookSupportMock.mockReturnValue({ stop: 'emulated' });
      execFileSyncMock.mockImplementation(() => { throw new Error('connection refused'); });

      const emulator = await createEmulator();
      const result = await emulator.emulateStop('run-err');

      expect(result.shouldContinue).toBe(false);
      expect(result.emulated).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // emulateSessionEnd
  // -----------------------------------------------------------------------

  describe('emulateSessionEnd()', () => {
    it('calls babysitter hook:run --hook-type session-end', async () => {
      getHookSupportMock.mockReturnValue({ sessionEnd: 'unsupported' });
      execFileSyncMock.mockReturnValue('{}');

      const emulator = await createEmulator();
      await emulator.emulateSessionEnd();

      expect(execFileSyncMock).toHaveBeenCalledTimes(1);
      const [, args] = execFileSyncMock.mock.calls[0]!;
      expect(args).toContain('--hook-type');
      expect(args).toContain('session-end');
    });

    it('is non-fatal when babysitter CLI throws', async () => {
      getHookSupportMock.mockReturnValue({ sessionEnd: 'emulated' });
      execFileSyncMock.mockImplementation(() => { throw new Error('ENOENT'); });

      const emulator = await createEmulator();
      // Should NOT throw
      await expect(emulator.emulateSessionEnd()).resolves.toBeUndefined();
    });

    it('is a no-op when hook support is native', async () => {
      getHookSupportMock.mockReturnValue({ sessionEnd: 'native' });

      const emulator = await createEmulator();
      await emulator.emulateSessionEnd();

      expect(execFileSyncMock).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getRunId
  // -----------------------------------------------------------------------

  describe('getRunId()', () => {
    it('returns undefined before session-start', async () => {
      const emulator = await createEmulator();
      expect(emulator.getRunId()).toBeUndefined();
    });

    it('returns the runId after successful session-start', async () => {
      getHookSupportMock.mockReturnValue({ sessionStart: 'unsupported' });
      execFileSyncMock.mockReturnValue('{"runId":"run-42"}');

      const emulator = await createEmulator();
      await emulator.emulateSessionStart();

      expect(emulator.getRunId()).toBe('run-42');
    });
  });
});

// ---------------------------------------------------------------------------
// CLI flag validation tests (launch command integration)
// ---------------------------------------------------------------------------

describe('bridge flag validation in launch command', () => {
  beforeEach(() => {
    vi.resetModules();
    execFileSyncMock.mockReset();
    execSyncMock.mockReset();
    spawnMock.mockReset();
    getHookSupportMock.mockReset();
    getBridgeCapabilitiesMock.mockReset();
    getYoloLaunchArgsMock.mockReset();
    getYoloLaunchArgsMock.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function importModules() {
    const [{ launchCommand, LAUNCH_FLAGS }, { parseArgs }] = await Promise.all([
      import('../src/commands/launch.js'),
      import('../src/parse-args.js'),
    ]);
    return { launchCommand, LAUNCH_FLAGS, parseArgs };
  }

  function makeClient(harness = 'claude') {
    return {
      adapters: {
        get: () => ({
          agent: harness,
          detectInstallation: async () => ({ installed: true }),
          capabilities: { canResume: true },
        }),
        list: () => [{ agent: harness }],
      },
    } as any;
  }

  it('--bridge-hooks requires --no-interactive (returns USAGE_ERROR)', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const code = await launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-hooks', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    // Should return USAGE_ERROR (2)
    expect(code).toBe(2);
  });

  it('--bridge-interactive requires --no-interactive (returns USAGE_ERROR)', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const code = await launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    expect(code).toBe(2);
  });

  it('--bridge-interactive is rejected for harness without interactiveBridge capability', async () => {
    getBridgeCapabilitiesMock.mockReturnValue({ interactiveBridge: false });

    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const code = await launchCommand(
      makeClient('codex'),
      parseArgs(
        ['launch', 'codex', '--bridge-interactive', '--no-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    // Should return USAGE_ERROR (2) because codex doesn't support interactive bridging
    expect(code).toBe(2);
  });

  it('--bridge-interactive passes validation when harness has interactiveBridge', async () => {
    getBridgeCapabilitiesMock.mockReturnValue({ interactiveBridge: true });

    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    // This should NOT return a usage error — it'll proceed to PTY spawn
    // (which will "succeed" via mock, then hang waiting for exit).
    // We use a timeout race to confirm it passed validation.
    const launchPromise = launchCommand(
      makeClient('claude'),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    // If validation passed, the PTY mock was spawned
    await new Promise(r => setTimeout(r, 100));
    expect(ptySpawnMock).toHaveBeenCalled();

    // Clean up: trigger PTY exit so promise resolves
    // (the PTY mock from this file doesn't store callbacks, so we can't trigger exit easily;
    //  just verify validation passed above)
  });

  it('--bridge-hooks with --no-interactive calls BridgeHookEmulator session-start', async () => {
    getBridgeCapabilitiesMock.mockReturnValue(undefined);
    getHookSupportMock.mockReturnValue({ sessionStart: 'unsupported', stop: 'native', sessionEnd: 'native' });
    execFileSyncMock.mockReturnValue('{}');

    // Make spawn return a child that we can trigger exit on
    const fakeChild = makeFakeChild();
    spawnMock.mockReturnValue(fakeChild);

    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient('claude'),
      parseArgs(
        ['launch', 'claude', '--bridge-hooks', '--no-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    // Give time for the async session-start to fire and spawn to happen
    await new Promise(r => setTimeout(r, 200));

    // execFileSyncMock should have been called for session-start
    expect(execFileSyncMock).toHaveBeenCalled();
    const calls = execFileSyncMock.mock.calls;
    const sessionStartCall = calls.find((c: any[]) =>
      Array.isArray(c[1]) && c[1].includes('session-start'),
    );
    expect(sessionStartCall).toBeDefined();

    // Trigger child exit so the launch promise resolves cleanly
    fakeChild._triggerExit(0);
    await launchPromise;
  });
});

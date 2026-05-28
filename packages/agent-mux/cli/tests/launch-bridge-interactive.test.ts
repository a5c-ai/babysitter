import { EventEmitter } from 'node:events';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PassThrough } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const execSyncMock = vi.fn(() => '');
const spawnMock = vi.fn();
const getLaunchBehaviorMock = vi.fn();

vi.mock('node:child_process', () => ({
  execSync: execSyncMock,
  spawn: spawnMock,
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

// PTY mock — emits data and supports onExit/write/kill
type PtyDataCb = (data: string) => void;
type PtyExitCb = (info: { exitCode: number }) => void;

let ptyDataCallbacks: PtyDataCb[] = [];
let ptyExitCallbacks: PtyExitCb[] = [];
let ptyWritten: string[] = [];
let ptyKilled: string[] = [];

const ptySpawnMock = vi.fn(() => {
  ptyDataCallbacks = [];
  ptyExitCallbacks = [];
  ptyWritten = [];
  ptyKilled = [];
  return {
    pid: 9999,
    onData(cb: PtyDataCb) { ptyDataCallbacks.push(cb); },
    onExit(cb: PtyExitCb) { ptyExitCallbacks.push(cb); },
    write(data: string) { ptyWritten.push(data); },
    kill(sig: string) { ptyKilled.push(sig); },
  };
});

/** Shared ref object — vi.mock factory captures the reference, reads .value at call time. */
const ptyMockControl = { shouldThrow: false };

vi.mock('node-pty', () => {
  if (ptyMockControl.shouldThrow) throw new Error('node-pty not installed');
  return {
    default: { spawn: ptySpawnMock },
    spawn: ptySpawnMock,
  };
});

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
    parseEvent(line: string, _ctx: any) {
      // Simple adapter: lines containing "turn_end" emit a turn_end event
      if (line.includes('turn_end')) {
        return { type: 'turn_end', timestamp: new Date().toISOString() };
      }
      if (line.includes('message_stop')) {
        return { type: 'message_stop', timestamp: new Date().toISOString() };
      }
      return null;
    },
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

vi.mock('@a5c-ai/agent-catalog', () => ({
  getBridgeCapabilities: vi.fn(() => ({ interactiveBridge: true })),
  getYoloLaunchArgs: vi.fn(() => []),
  getAutomationEnv: vi.fn(() => ({})),
  getHookSupport: vi.fn(() => ({})),
  getAdapterMetadata: vi.fn(() => null),
  getSessionConfig: vi.fn(() => ({})),
  getLaunchBehavior: getLaunchBehaviorMock,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('bridge-interactive spawn', () => {
  let stdoutChunks: string[];
  let origWrite: typeof process.stdout.write;

  beforeEach(() => {
    vi.resetModules();
    execSyncMock.mockReset();
    spawnMock.mockReset();
    getLaunchBehaviorMock.mockReset();
    getLaunchBehaviorMock.mockImplementation((harness: string) => {
      if (harness !== 'claude') return undefined;
      return {
        promptDelivery: 'cli-flag',
        promptFlag: '-p',
        stdinBehavior: 'close-after-prompt',
        selfExits: true,
        needsIdleKill: false,
        sessionIdFlag: '--session-id',
        maxTurnsFlag: '--max-turns',
        resumeDelivery: 'flag',
        resumeFlag: '--resume',
      };
    });
    ptySpawnMock.mockClear();
    ptyMockControl.shouldThrow = false;
    stdoutChunks = [];
    origWrite = process.stdout.write;
    // Intercept stdout writes to capture NDJSON output
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdoutChunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = origWrite;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function importModules() {
    const [{ launchCommand, LAUNCH_FLAGS }, { parseArgs }] = await Promise.all([
      import('../src/commands/launch.js'),
      import('../src/parse-args.js'),
    ]);
    return { launchCommand, LAUNCH_FLAGS, parseArgs };
  }

  async function waitFor(condition: () => boolean | Promise<boolean>, timeoutMs = 3000): Promise<void> {
    const startedAt = Date.now();
    while (!await condition()) {
      if (Date.now() - startedAt > timeoutMs) throw new Error('timed out waiting for condition');
      await new Promise(resolve => setTimeout(resolve, 20));
    }
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

  function makeSpawnChild() {
    const child = new EventEmitter() as EventEmitter & {
      pid: number;
      stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn>; readonly writable: boolean };
      stdout: PassThrough;
      stderr: PassThrough;
      kill: ReturnType<typeof vi.fn>;
    };
    let writable = true;
    child.pid = 4242;
    child.stdin = {
      write: vi.fn(() => true),
      end: vi.fn(() => { writable = false; }),
      get writable() { return writable; },
    };
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = vi.fn();
    return child;
  }

  function stdinWriteText(child: ReturnType<typeof makeSpawnChild>): string {
    return child.stdin.write.mock.calls.map(([chunk]) => String(chunk)).join('');
  }

  function withMockPlatform(platform: NodeJS.Platform): () => void {
    const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: platform, configurable: true });
    return () => {
      if (descriptor) Object.defineProperty(process, 'platform', descriptor);
    };
  }

  it('keeps Claude child_process fallback prompts in args instead of stdin when node-pty is unavailable', async () => {
    vi.useFakeTimers();
    ptyMockControl.shouldThrow = true;
    const prompt = 'write .a5c-live-test/fallback-prompt.md';
    const child = makeSpawnChild();
    spawnMock.mockReturnValue(child);
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', prompt],
        LAUNCH_FLAGS,
      ),
    );

    try {
      await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(1));
      const spawnedArgs = spawnMock.mock.calls[0]?.[1] as string[];
      expect(spawnedArgs.filter((arg) => arg === prompt)).toHaveLength(1);
      expect(spawnedArgs[spawnedArgs.indexOf('-p') + 1]).toBe(prompt);

      await vi.advanceTimersByTimeAsync(2500);
      expect(stdinWriteText(child)).not.toContain(prompt);
      expect(child.stdin.end).toHaveBeenCalled();
    } finally {
      child.emit('exit', 0, null);
      await launchPromise.catch(() => undefined);
    }
  });

  it('preserves Windows .cmd fallback prompts with spaces quotes and parens without delayed stdin', async () => {
    vi.useFakeTimers();
    ptyMockControl.shouldThrow = true;
    const restorePlatform = withMockPlatform('win32');
    const prompt = 'summarize "Act (I)" and write .a5c-live-test/windows prompt.md';
    const child = makeSpawnChild();
    spawnMock.mockReturnValue(child);
    execSyncMock.mockImplementation((command: string) => {
      if (command.startsWith('where claude')) return 'C:\\Users\\runner\\AppData\\Roaming\\npm\\claude.cmd\r\n';
      return '';
    });
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', prompt],
        LAUNCH_FLAGS,
      ),
    );

    try {
      await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(1));
      const spawnedArgs = spawnMock.mock.calls[0]?.[1] as string[];
      const resolvedInvocation = spawnedArgs.join('\0');
      const normalizedInvocation = resolvedInvocation.replace(/""/g, '"');
      expect((normalizedInvocation.match(new RegExp(prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? [])).toHaveLength(1);
      expect(normalizedInvocation).toContain(prompt);
      expect(spawnMock.mock.calls[0]?.[0]).toBe(process.env['ComSpec'] ?? 'cmd.exe');

      await vi.advanceTimersByTimeAsync(2500);
      expect(stdinWriteText(child)).not.toContain(prompt);
      expect(child.stdin.end).toHaveBeenCalled();
    } finally {
      child.emit('exit', 0, null);
      await launchPromise.catch(() => undefined);
      restorePlatform();
    }
  });

  it('preseeds first-run trust state for CI harness launches', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-launch-home-'));
    const originalHome = process.env['HOME'];
    const originalUserProfile = process.env['USERPROFILE'];
    const originalCi = process.env['CI'];
    const originalAnthropicApiKey = process.env['ANTHROPIC_API_KEY'];
    process.env['HOME'] = home;
    process.env['USERPROFILE'] = home;
    process.env['CI'] = 'true';
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-api03-test-key-1234567890ABCDEFGHIJ';

    try {
      const claudeLaunch = launchCommand(
        makeClient('claude'),
        parseArgs(['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', 'hello'], LAUNCH_FLAGS),
      );
      await waitFor(() => ptySpawnMock.mock.calls.length >= 1 && ptyExitCallbacks.length > 0);
      for (const cb of [...ptyExitCallbacks]) cb({ exitCode: 0 });
      await claudeLaunch;

      const claudeConfig = JSON.parse(await fs.readFile(path.join(home, '.claude.json'), 'utf8'));
      const claudeSettings = JSON.parse(await fs.readFile(path.join(home, '.claude', 'settings.json'), 'utf8'));
      const projectPath = path.resolve(process.cwd()).replace(/\\/g, '/');
      expect(claudeConfig.hasCompletedOnboarding).toBe(true);
      expect(claudeConfig.lastOnboardingVersion).toBe('999.999.999');
      expect(claudeConfig.lastReleaseNotesSeen).toBe('999.999.999');
      expect(claudeConfig.customApiKeyResponses.approved).toContain('1234567890ABCDEFGHIJ');
      expect(claudeConfig.customApiKeyResponses.rejected).not.toContain('1234567890ABCDEFGHIJ');
      expect(claudeConfig.projects[projectPath].hasTrustDialogAccepted).toBe(true);
      expect(claudeConfig.projects[projectPath].hasCompletedProjectOnboarding).toBe(true);
      expect(claudeConfig.projects[projectPath].projectOnboardingSeenCount).toBe(1);
      expect(claudeConfig.projects[projectPath].lastVersionBase).toBe('999.999.999');
      expect(claudeSettings.theme).toBe('dark');
      expect(claudeSettings.skipDangerousModePermissionPrompt).toBe(true);

      const codexLaunch = launchCommand(
        makeClient('codex'),
        parseArgs(['launch', 'codex', '--bridge-interactive', '--no-interactive', '--prompt', 'hello'], LAUNCH_FLAGS),
      );
      await waitFor(() => ptySpawnMock.mock.calls.length >= 2 && ptyExitCallbacks.length > 0);
      for (const cb of [...ptyExitCallbacks]) cb({ exitCode: 0 });
      await codexLaunch;

      const codexConfig = await fs.readFile(path.join(home, '.codex', 'config.toml'), 'utf8');
      expect(codexConfig).toContain(`[projects.${JSON.stringify(path.resolve(process.cwd()))}]`);
      expect(codexConfig).toContain('trust_level = "trusted"');
    } finally {
      if (originalHome === undefined) delete process.env['HOME']; else process.env['HOME'] = originalHome;
      if (originalUserProfile === undefined) delete process.env['USERPROFILE']; else process.env['USERPROFILE'] = originalUserProfile;
      if (originalCi === undefined) delete process.env['CI']; else process.env['CI'] = originalCi;
      if (originalAnthropicApiKey === undefined) delete process.env['ANTHROPIC_API_KEY']; else process.env['ANTHROPIC_API_KEY'] = originalAnthropicApiKey;
    }
  });

  it('spawns PTY, emits NDJSON events, and auto-kills on turn_end', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', 'hello world'],
        LAUNCH_FLAGS,
      ),
    );

    // Let the setTimeout for prompt injection fire (1000ms initial + 500ms Enter delay)
    await new Promise(r => setTimeout(r, 1600));

    // Verify prompt text and Enter were injected as separate writes
    expect(ptyWritten).toContain('hello world');
    expect(ptyWritten).toContain('\r');

    // Verify PTY was spawned (not child_process.spawn)
    expect(ptySpawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).not.toHaveBeenCalled();
    const spawnedArgs = ptySpawnMock.mock.calls[0]?.[1] as string[];
    expect(spawnedArgs).not.toContain('-p');
    expect(spawnedArgs).not.toContain('hello world');

    // Simulate PTY output with a turn_end event
    for (const cb of ptyDataCallbacks) {
      cb('Some output text\n');
      cb('turn_end\n');
    }

    // Let setImmediate flush the NDJSON events
    await new Promise(r => setTimeout(r, 50));

    // The turn_end event should trigger a SIGTERM after 1s timeout
    // Simulate PTY exit before the timeout
    for (const cb of ptyExitCallbacks) {
      cb({ exitCode: 0 });
    }

    // Let setImmediate flush the final output event
    await new Promise(r => setTimeout(r, 50));

    const exitCode = await launchPromise;
    expect(exitCode).toBe(0);

    // Parse emitted NDJSON events
    const events = stdoutChunks
      .join('')
      .split('\n')
      .filter(l => l.trim())
      .map(l => JSON.parse(l));

    // Should have a turn_end event and a final output event
    const turnEndEvents = events.filter((e: any) => e.type === 'turn_end');
    expect(turnEndEvents.length).toBe(1);

    const outputEvents = events.filter((e: any) => e.type === 'output');
    expect(outputEvents.length).toBe(1);
    expect(outputEvents[0].data.text).toContain('turn_end');
  });

  it('emits message_stop events as NDJSON', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    await new Promise(r => setTimeout(r, 600));

    // Simulate message_stop
    for (const cb of ptyDataCallbacks) {
      cb('response text\nmessage_stop\n');
    }

    await new Promise(r => setTimeout(r, 50));

    for (const cb of ptyExitCallbacks) {
      cb({ exitCode: 0 });
    }

    await new Promise(r => setTimeout(r, 50));

    const exitCode = await launchPromise;
    expect(exitCode).toBe(0);

    const events = stdoutChunks
      .join('')
      .split('\n')
      .filter(l => l.trim())
      .map(l => JSON.parse(l));

    const stopEvents = events.filter((e: any) => e.type === 'message_stop');
    expect(stopEvents.length).toBe(1);
  });

  it('exits bridge-interactive CI sessions when the requested prompt artifact is complete', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-bridge-artifact-'));
    const originalCwd = process.cwd();
    process.chdir(cwd);

    try {
      const launchPromise = launchCommand(
        makeClient(),
        parseArgs(
          ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', 'write .a5c-live-test/bridge-artifact.md'],
          LAUNCH_FLAGS,
        ),
      );

      await new Promise(r => setTimeout(r, 1600));
      expect(ptyWritten).toContain('write .a5c-live-test/bridge-artifact.md');

      await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
      await fs.writeFile(path.join(cwd, '.a5c-live-test', 'bridge-artifact.md'), 'completed artifact\n'.repeat(40));
      await new Promise(r => setTimeout(r, 2300));

      expect(ptyKilled).toContain('SIGTERM');
      for (const cb of ptyExitCallbacks) cb({ exitCode: 143 });
      expect(await launchPromise).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('exits prompt-injected interactive CI sessions when the requested prompt artifact is complete', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-interactive-artifact-'));
    const originalCwd = process.cwd();
    process.chdir(cwd);

    try {
      const launchPromise = launchCommand(
        makeClient(),
        parseArgs(
          ['launch', 'claude', '--prompt', 'write .a5c-live-test/interactive-artifact.md'],
          LAUNCH_FLAGS,
        ),
      );

      await new Promise(r => setTimeout(r, 1600));
      const spawnedArgs = ptySpawnMock.mock.calls[0]?.[1] as string[];
      expect(spawnedArgs).not.toContain('write .a5c-live-test/interactive-artifact.md');
      expect(spawnedArgs).not.toContain('-p');
      expect(ptyWritten).toContain('write .a5c-live-test/interactive-artifact.md');

      await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
      await fs.writeFile(path.join(cwd, '.a5c-live-test', 'interactive-artifact.md'), 'completed artifact\n'.repeat(40));
      await new Promise(r => setTimeout(r, 2300));

      expect(ptyKilled).toContain('SIGTERM');
      for (const cb of ptyExitCallbacks) cb({ exitCode: 143 });
      expect(await launchPromise).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('continues Claude babysitter slash commands after skill load', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', '/babysitter:yolo write .a5c-live-test/plugin.md'],
        LAUNCH_FLAGS,
      ),
    );

    await new Promise(r => setTimeout(r, 600));
    for (const cb of ptyDataCallbacks) cb('\u001b[1mSkill\u001b[22m(babysitter:babysit)\n');
    await new Promise(r => setTimeout(r, 1200));

    const writtenText = ptyWritten.join('');
    expect(writtenText).toContain('Continue the Babysitter command now; do not answer in prose');
    expect(writtenText).toContain('Use the Bash tool now with this exact command: babysitter instructions:babysit-skill --harness claude-code --no-interactive');
    expect(writtenText).toContain('Original /babysitter request: /babysitter:yolo write .a5c-live-test/plugin.md');

    for (const cb of ptyExitCallbacks) cb({ exitCode: 0 });
    await launchPromise;
  });

  it('does not pass Claude bare mode for bridge-interactive sessions', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', '/babysitter:yolo test'],
        LAUNCH_FLAGS,
      ),
    );

    await new Promise(r => setTimeout(r, 600));
    const spawnedArgs = ptySpawnMock.mock.calls[0]?.[1] as string[];
    expect(spawnedArgs).not.toContain('--bare');

    for (const cb of ptyExitCallbacks) cb({ exitCode: 0 });
    await launchPromise;
  });

  it('requires --no-interactive with --bridge-interactive', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    // When used without --no-interactive, should fail validation
    const code = await launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    // Should return USAGE_ERROR (2) because --bridge-interactive requires --no-interactive
    expect(code).toBe(2);
    // PTY should not have been spawned
    expect(ptySpawnMock).not.toHaveBeenCalled();
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('does not write PTY data synchronously to stdout (avoids deadlock)', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    let stdoutCallsDuringPtyCallback = 0;
    // Track stdout writes that happen synchronously during PTY data callback
    let inPtyCallback = false;
    process.stdout.write = ((chunk: string | Uint8Array) => {
      if (inPtyCallback) stdoutCallsDuringPtyCallback++;
      stdoutChunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    }) as any;

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    await new Promise(r => setTimeout(r, 600));

    // Feed PTY data and check no stdout writes happen synchronously
    for (const cb of ptyDataCallbacks) {
      inPtyCallback = true;
      cb('some output\nturn_end\n');
      inPtyCallback = false;
    }

    // No stdout writes should happen synchronously inside the PTY callback
    expect(stdoutCallsDuringPtyCallback).toBe(0);

    // But after setImmediate, events should be emitted
    await new Promise(r => setTimeout(r, 50));
    expect(stdoutChunks.length).toBeGreaterThan(0);

    for (const cb of ptyExitCallbacks) {
      cb({ exitCode: 0 });
    }
    await new Promise(r => setTimeout(r, 50));

    await launchPromise;
  });

  it('NDJSON events have correct BridgeEvent shape', async () => {
    const { launchCommand, LAUNCH_FLAGS, parseArgs } = await importModules();

    const launchPromise = launchCommand(
      makeClient(),
      parseArgs(
        ['launch', 'claude', '--bridge-interactive', '--no-interactive', '--prompt', 'test'],
        LAUNCH_FLAGS,
      ),
    );

    await new Promise(r => setTimeout(r, 600));

    for (const cb of ptyDataCallbacks) {
      cb('turn_end\n');
    }

    await new Promise(r => setTimeout(r, 50));

    for (const cb of ptyExitCallbacks) {
      cb({ exitCode: 0 });
    }

    await new Promise(r => setTimeout(r, 50));
    await launchPromise;

    const events = stdoutChunks
      .join('')
      .split('\n')
      .filter(l => l.trim())
      .map(l => JSON.parse(l));

    for (const ev of events) {
      expect(ev).toHaveProperty('type');
      expect(ev).toHaveProperty('timestamp');
      expect(ev).toHaveProperty('data');
      // timestamp should be ISO format
      expect(() => new Date(ev.timestamp)).not.toThrow();
      expect(new Date(ev.timestamp).toISOString()).toBe(ev.timestamp);
    }
  });
});

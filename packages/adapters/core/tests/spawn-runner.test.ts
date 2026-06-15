import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

class FakeChild extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();
  stdin = {
    destroyed: false,
    write: vi.fn(),
    end: vi.fn(),
  };
  kill = vi.fn();
  pid: number | undefined = undefined;
}

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return {
    ...actual,
    spawn: spawnMock,
  };
});

import { RunHandleImpl } from '../src/run-handle-impl.js';
import { startSpawnLoop } from '../src/spawn-runner.js';

const virtualRuntimeHooks = {
  preToolUse: 'unsupported',
  postToolUse: 'unsupported',
  sessionStart: 'unsupported',
  sessionEnd: 'unsupported',
  stop: 'unsupported',
  userPromptSubmit: 'unsupported',
} as const;

describe('startSpawnLoop stdin transport', () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it('keeps stdin open for interactive runs and routes follow-up send() calls', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-1', agent: 'gemini' });
    const adapter = {
      agent: 'gemini',
      capabilities: { supportsStdinInjection: true },
      buildSpawnArgs: () => ({
        command: 'fake-agent',
        args: [],
        env: {},
        cwd: process.cwd(),
        usePty: false,
        stdin: 'first prompt\n',
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'gemini', prompt: 'first prompt' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(child.stdin.write).toHaveBeenCalledWith('first prompt\n');
    expect(child.stdin.end).not.toHaveBeenCalled();

    await handle.send('follow up');
    expect(child.stdin.write).toHaveBeenLastCalledWith('follow up\n');

    child.emit('exit', 0, null);
  });

  it('delivers queued prompts after the next turn boundary', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-queue', agent: 'gemini' });
    const adapter = {
      agent: 'gemini',
      capabilities: { supportsStdinInjection: true },
      buildSpawnArgs: () => ({
        command: 'fake-agent',
        args: [],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'gemini', prompt: 'first prompt' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    await handle.queue('queued follow up');
    handle.emit({
      type: 'turn_end',
      runId: 'run-queue',
      agent: 'gemini',
      timestamp: Date.now(),
      turnIndex: 0,
    } as any);
    await Promise.resolve();

    expect(child.stdin.write).toHaveBeenCalledWith('queued follow up\n');
    child.emit('exit', 0, null);
  });

  it('delivers steering prompts after the next tool boundary', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-steer', agent: 'gemini' });
    const adapter = {
      agent: 'gemini',
      capabilities: { supportsStdinInjection: true },
      buildSpawnArgs: () => ({
        command: 'fake-agent',
        args: [],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'gemini', prompt: 'first prompt' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    await handle.steer('steer now', { when: 'after-tool' });
    handle.emit({
      type: 'tool_result',
      runId: 'run-steer',
      agent: 'gemini',
      timestamp: Date.now(),
      toolCallId: 'tool-1',
      toolName: 'search',
      output: {},
      durationMs: 5,
    } as any);
    await Promise.resolve();

    expect(child.stdin.write).toHaveBeenCalledWith('steer now\n');
    child.emit('exit', 0, null);
  });

  it('closes seeded stdin for explicit non-interactive runs', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-2', agent: 'gemini' });
    const adapter = {
      agent: 'gemini',
      capabilities: { supportsStdinInjection: true },
      buildSpawnArgs: () => ({
        command: 'fake-agent',
        args: [],
        env: {},
        cwd: process.cwd(),
        usePty: false,
        stdin: 'first prompt\n',
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'gemini', prompt: 'first prompt', nonInteractive: true } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(child.stdin.write).toHaveBeenCalledWith('first prompt\n');
    expect(child.stdin.end).toHaveBeenCalledTimes(1);

    child.emit('exit', 0, null);
  });

  it('closes stdin after launch when requested by spawn args', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-2b', agent: 'codex' });
    const adapter = {
      agent: 'codex',
      capabilities: { supportsStdinInjection: false },
      buildSpawnArgs: () => ({
        command: 'fake-agent',
        args: ['exec', '--json', 'hello'],
        env: {},
        cwd: process.cwd(),
        usePty: false,
        closeStdinAfterSpawn: true,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'codex', prompt: 'hello' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(child.stdin.write).not.toHaveBeenCalled();
    expect(child.stdin.end).toHaveBeenCalledTimes(1);

    child.emit('exit', 0, null);
  });

  it('prefers detected executable path when spawning a bare cli command', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-3', agent: 'codex' });
    const adapter = {
      agent: 'codex',
      cliCommand: 'codex',
      capabilities: { supportsStdinInjection: false },
      detectInstallation: async () => ({
        installed: true,
        path: '/resolved/bin/codex',
      }),
      buildSpawnArgs: () => ({
        command: 'codex',
        args: ['exec'],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'codex', prompt: 'go' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(spawnMock).toHaveBeenCalledWith(
      '/resolved/bin/codex',
      ['exec'],
      expect.objectContaining({
        cwd: process.cwd(),
      }),
    );

    child.emit('exit', 0, null);
  });

  it.skipIf(process.platform !== 'win32')('uses shell mode for detected Windows cmd shims', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-3b', agent: 'codex' });
    const adapter = {
      agent: 'codex',
      cliCommand: 'codex',
      capabilities: { supportsStdinInjection: false },
      detectInstallation: async () => ({
        installed: true,
        path: 'C:\\shim\\codex.cmd',
      }),
      buildSpawnArgs: () => ({
        command: 'codex',
        args: ['exec'],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'codex', prompt: 'go' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(spawnMock).toHaveBeenCalledWith(
      'C:\\shim\\codex.cmd',
      ['exec'],
      expect.objectContaining({
        shell: true,
      }),
    );

    child.emit('exit', 0, null);
  });

  it.skipIf(process.platform !== 'win32')('prefers sibling Windows cmd shims when detection returns an extensionless path', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-shim-'));
    const shimBase = path.join(dir, 'codex');
    await fs.writeFile(`${shimBase}.cmd`, '@echo off\r\n', 'utf8');

    const handle = new RunHandleImpl({ runId: 'run-3c', agent: 'codex' });
    const adapter = {
      agent: 'codex',
      cliCommand: 'codex',
      capabilities: { supportsStdinInjection: false },
      detectInstallation: async () => ({
        installed: true,
        path: shimBase,
      }),
      buildSpawnArgs: () => ({
        command: 'codex',
        args: ['exec'],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'codex', prompt: 'go' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(spawnMock).toHaveBeenCalledWith(
      `${shimBase}.cmd`,
      ['exec'],
      expect.objectContaining({
        shell: true,
      }),
    );

    child.emit('exit', 0, null);
  });

  it.skipIf(process.platform !== 'win32')('prefers sibling Windows powershell shims for argument-safe execution', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-ps1-shim-'));
    const shimBase = path.join(dir, 'codex');
    await fs.writeFile(`${shimBase}.cmd`, '@echo off\r\n', 'utf8');
    await fs.writeFile(`${shimBase}.ps1`, 'exit 0\r\n', 'utf8');

    const handle = new RunHandleImpl({ runId: 'run-3d', agent: 'codex' });
    const adapter = {
      agent: 'codex',
      cliCommand: 'codex',
      capabilities: { supportsStdinInjection: false },
      detectInstallation: async () => ({
        installed: true,
        path: shimBase,
      }),
      buildSpawnArgs: () => ({
        command: 'codex',
        args: ['exec', 'hello from codex'],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'codex', prompt: 'go' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(spawnMock).toHaveBeenCalledWith(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', `${shimBase}.ps1`, 'exec', 'hello from codex'],
      expect.objectContaining({
        shell: false,
      }),
    );

    child.emit('exit', 0, null);
  });

  it.skipIf(process.platform !== 'win32')('invokes codex directly through node.exe on Windows npm installs', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-node-shim-'));
    const shimBase = path.join(dir, 'codex');
    const nodeModulesDir = path.join(dir, 'node_modules', '@openai', 'codex', 'bin');
    await fs.mkdir(nodeModulesDir, { recursive: true });
    await fs.writeFile(`${shimBase}.cmd`, '@echo off\r\n', 'utf8');
    await fs.writeFile(path.join(dir, 'node.exe'), '', 'utf8');
    await fs.writeFile(path.join(nodeModulesDir, 'codex.js'), '', 'utf8');

    const handle = new RunHandleImpl({ runId: 'run-3e', agent: 'codex' });
    const adapter = {
      agent: 'codex',
      cliCommand: 'codex',
      capabilities: { supportsStdinInjection: false },
      detectInstallation: async () => ({
        installed: true,
        path: shimBase,
      }),
      buildSpawnArgs: () => ({
        command: 'codex',
        args: ['exec', 'hello from codex'],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: () => null,
    } as any;

    startSpawnLoop(handle, adapter, { agent: 'codex', prompt: 'go' } as any);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(spawnMock).toHaveBeenCalledWith(
      path.join(dir, 'node.exe'),
      [path.join(nodeModulesDir, 'codex.js'), 'exec', 'hello from codex'],
      expect.objectContaining({
        shell: false,
      }),
    );

    child.emit('exit', 0, null);
  });

  it('gates tool delivery behind blocking preToolUse runtime hooks', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-hook-deny', agent: 'gemini', collectEvents: true });
    const adapter = {
      agent: 'gemini',
      capabilities: {
        supportsStdinInjection: false,
        runtimeHooks: {
          ...virtualRuntimeHooks,
          preToolUse: 'blocking',
        },
      },
      buildSpawnArgs: () => ({
        command: 'fake-agent',
        args: [],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: (line: string) => line === 'tool'
        ? ({
            type: 'tool_call_start',
            runId: 'ignored',
            agent: 'gemini',
            timestamp: Date.now(),
            toolCallId: 'tool-1',
            toolName: 'Bash',
            inputAccumulated: '{"command":"rm -rf ."}',
          } as any)
        : null,
    } as any;

    startSpawnLoop(handle, adapter, {
      agent: 'gemini',
      prompt: 'go',
      hooks: {
        preToolUse: () => ({ decision: 'deny', reason: 'blocked by test hook' }),
      },
    } as any);
    await Promise.resolve();
    child.stdout.write('tool\n');
    await new Promise((resolve) => setTimeout(resolve, 0));
    child.emit('exit', 0, null);

    const result = await handle.result();
    expect(result.events.find((event) => event.type === 'tool_call_start')).toBeUndefined();
    const toolError = result.events.find((event) => event.type === 'tool_error') as any;
    expect(toolError).toBeDefined();
    expect(toolError.source).toBe('hook');
    expect(toolError.error).toContain('blocked by test hook');
  });

  it('lets runtime hooks inject hook-sourced events into the run stream', async () => {
    const child = new FakeChild();
    spawnMock.mockReturnValue(child);

    const handle = new RunHandleImpl({ runId: 'run-hook-emit', agent: 'gemini', collectEvents: true });
    const adapter = {
      agent: 'gemini',
      capabilities: {
        supportsStdinInjection: false,
        runtimeHooks: {
          ...virtualRuntimeHooks,
          postToolUse: 'nonblocking',
        },
      },
      buildSpawnArgs: () => ({
        command: 'fake-agent',
        args: [],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      }),
      parseEvent: (line: string) => line === 'result'
        ? ({
            type: 'tool_result',
            runId: 'ignored',
            agent: 'gemini',
            timestamp: Date.now(),
            toolCallId: 'tool-2',
            toolName: 'Read',
            output: 'ok',
            durationMs: 4,
          } as any)
        : null,
    } as any;

    startSpawnLoop(handle, adapter, {
      agent: 'gemini',
      prompt: 'go',
      hooks: {
        postToolUse: async (_payload: unknown, context: any) => {
          await context.emit({
            type: 'debug',
            runId: 'ignored',
            agent: 'ignored',
            timestamp: 1,
            level: 'info',
            message: 'hook emitted debug event',
          });
        },
      },
    } as any);
    await Promise.resolve();
    child.stdout.write('result\n');
    await new Promise((resolve) => setTimeout(resolve, 0));
    child.emit('exit', 0, null);

    const result = await handle.result();
    const hookDebug = result.events.find(
      (event) => event.type === 'debug' && (event as any).message === 'hook emitted debug event',
    ) as any;
    expect(hookDebug).toBeDefined();
    expect(hookDebug.source).toBe('hook');
    expect(hookDebug.runId).toBe('run-hook-emit');
    expect(hookDebug.agent).toBe('gemini');
  });
});

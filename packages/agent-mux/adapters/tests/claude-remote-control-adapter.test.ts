import { EventEmitter } from 'node:events';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PassThrough } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ClaudeRemoteControlAdapter,
  extractClaudeRemoteControlBridgeJson,
  extractClaudeRemoteControlInitialSessionId,
  extractClaudeRemoteControlUrl,
} from '../src/claude-remote-control-adapter.js';

class FakeChildProcess extends EventEmitter {
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly stdin = new PassThrough();
  pid = 12345;
  killed = false;

  kill = vi.fn((signal?: string) => {
    if (this.killed) {
      return true;
    }
    this.killed = true;
    this.emit('exit', 0, signal ?? null);
    return true;
  });
}

async function waitUntil(predicate: () => boolean, timeoutMs: number = 5_000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function waitForValue<T>(
  read: () => T | null | Promise<T | null>,
  timeoutMs: number = 5_000,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    const value = await read();
    if (value != null) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for value');
}

describe('ClaudeRemoteControlAdapter', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-remote-control-adapter-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('extracts remote-control session metadata from stdout and bridge logs', () => {
    expect(
      extractClaudeRemoteControlUrl(
        'Continue coding in the Claude app or https://claude.ai/code/session_01DZuRNQCTLfNABDsfz7x19L',
      ),
    ).toEqual({
      sessionId: 'session_01DZuRNQCTLfNABDsfz7x19L',
      url: 'https://claude.ai/code/session_01DZuRNQCTLfNABDsfz7x19L',
    });

    expect(
      extractClaudeRemoteControlInitialSessionId(
        '2026-04-19T10:03:49.040Z [DEBUG] [bridge:init] Created initial session session_01DZuRNQCTLfNABDsfz7x19L',
      ),
    ).toBe('session_01DZuRNQCTLfNABDsfz7x19L');

    expect(
      extractClaudeRemoteControlBridgeJson(
        '2026-04-19T10:03:55.718Z [DEBUG] [bridge:ws] sessionId=cse_01 <<< {"type":"assistant","content":"hello"}',
      ),
    ).toBe('{"type":"assistant","content":"hello"}');
  });

  it('advertises remote-control as an external-host surface instead of a local interactive chat transport', () => {
    const adapter = new ClaudeRemoteControlAdapter();
    expect(adapter.capabilities.sessionControlPlane).toBe('external-host');
    expect(adapter.capabilities.structuredSessionTransport).toBe('none');
    expect(adapter.capabilities.supportsInteractiveMode).toBe(false);
    expect(adapter.capabilities.supportsStdinInjection).toBe(false);
  });

  it('streams bootstrap metadata and bridge payload events from the real bridge process shape', async () => {
    const adapter = new ClaudeRemoteControlAdapter();
    const child = new FakeChildProcess();
    let capturedArgs: string[] | null = null;
    adapter.setProcessSpawner((_command, args) => {
      capturedArgs = args;
      return child as never;
    });

    const stream = adapter.execute({
      agent: 'claude-remote-control',
      prompt: 'start remote control',
      cwd: tempDir,
    });

    await waitUntil(() => capturedArgs != null);
    const debugIndex = capturedArgs!.indexOf('--debug-file');
    const debugFile = capturedArgs![debugIndex + 1]!;
    await fs.writeFile(debugFile, '', 'utf8');

    child.stdout.write(
      'Continue coding in the Claude app or https://claude.ai/code/session_01DZuRNQCTLfNABDsfz7x19L\n',
    );
    await fs.appendFile(
      debugFile,
      `${new Date().toISOString()} [DEBUG] [bridge:ws] sessionId=cse_01 <<< {"type":"assistant","content":"hello from remote"}\n`,
      'utf8',
    );

    const first = await waitForValue(async () => {
      const result = await stream.next();
      return result.done ? null : result.value;
    });
    expect(first.type).toBe('session_start');
    expect((first as { sessionId?: string }).sessionId).toBe('session_01DZuRNQCTLfNABDsfz7x19L');

    const second = await waitForValue(async () => {
      const result = await stream.next();
      return result.done ? null : result.value;
    });
    expect(second.type).toBe('message_stop');
    expect((second as { text?: string }).text).toContain('https://claude.ai/code/session_01DZuRNQCTLfNABDsfz7x19L');

    const third = await waitForValue(async () => {
      const result = await stream.next();
      return result.done ? null : result.value;
    });
    expect(third.type).toBe('text_delta');
    expect((third as { delta?: string }).delta).toBe('hello from remote');

    await stream.close();
    expect(child.kill).toHaveBeenCalled();
  });
});

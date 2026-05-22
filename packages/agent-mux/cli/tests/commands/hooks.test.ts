import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import { main } from '../../src/index.js';

describe('amux hooks', () => {
  let cwd: string;
  let home: string;
  const prevCwd = process.cwd();
  const prevHome = process.env['HOME'];
  const prevUserProfile = process.env['USERPROFILE'];

  beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-hooks-cli-'));
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-hooks-home-'));
    process.chdir(cwd);
    process.env['HOME'] = home;
    process.env['USERPROFILE'] = home;
  });

  afterEach(() => {
    process.chdir(prevCwd);
    process.env['HOME'] = prevHome;
    process.env['USERPROFILE'] = prevUserProfile;
  });

  it('discover lists claude hook types', async () => {
    const out = captureStdout();
    const code = await main(['hooks', 'claude', 'discover', '--json']);
    out.restore();
    expect(code).toBe(0);
    const parsed = JSON.parse(out.text);
    expect(parsed.ok).toBe(true);
    expect(parsed.data.hookTypes.some((e: { name: string }) => e.name === 'PreToolUse')).toBe(true);
  });

  it('add + list + remove roundtrip at project scope', async () => {
    let out = captureStdout();
    let code = await main(['hooks', 'claude', 'add', 'StopHook', '--handler', 'builtin', '--target', 'log', '--id', 'my-hook', '--json']);
    out.restore();
    expect(code).toBe(0);

    out = captureStdout();
    code = await main(['hooks', 'claude', 'list', '--json']);
    out.restore();
    expect(code).toBe(0);
    const parsed = JSON.parse(out.text);
    expect(parsed.data.hooks.some((h: { id: string }) => h.id === 'my-hook')).toBe(true);

    out = captureStdout();
    code = await main(['hooks', 'claude', 'remove', 'my-hook', '--json']);
    out.restore();
    expect(code).toBe(0);
  });

  it('handle dispatches builtin and emits JSON decision', async () => {
    await main(['hooks', 'claude', 'add', 'StopHook', '--handler', 'builtin', '--target', 'trace', '--id', 'h-trace', '--json']);
    // Pipe payload to stdin
    const payload = JSON.stringify({ session_id: 'abc', tool_name: 'Bash' });
    const stdinMock = mockStdin(payload);
    const out = captureStdout();
    const code = await main(['hooks', 'claude', 'handle', 'StopHook']);
    out.restore();
    stdinMock.restore();
    expect(code).toBe(0);
    expect(out.text).toContain('"decision":"allow"');
    expect(out.text).toContain('claude/StopHook');
  });
});

function captureStdout(): { text: string; restore: () => void } {
  const orig = process.stdout.write.bind(process.stdout);
  let buf = '';
  (process.stdout.write as unknown as (s: string) => boolean) = (s: unknown) => {
    buf += typeof s === 'string' ? s : String(s);
    return true;
  };
  return {
    get text() { return buf; },
    restore: () => { process.stdout.write = orig; },
  };
}

function mockStdin(data: string): { restore: () => void } {
  const origIsTTY = process.stdin.isTTY;
  const origOn = process.stdin.on.bind(process.stdin);
  const origSetEncoding = process.stdin.setEncoding.bind(process.stdin);
  (process.stdin as unknown as { isTTY: boolean }).isTTY = false;
  process.stdin.setEncoding = () => process.stdin;
  process.stdin.on = ((event: string, handler: (...a: unknown[]) => void) => {
    if (event === 'data') handler(data);
    if (event === 'end') handler();
    return process.stdin;
  }) as typeof process.stdin.on;
  return {
    restore: () => {
      (process.stdin as unknown as { isTTY: boolean | undefined }).isTTY = origIsTTY;
      process.stdin.on = origOn;
      process.stdin.setEncoding = origSetEncoding;
    },
  };
}

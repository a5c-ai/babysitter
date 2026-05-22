import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import {
  HookConfigManager,
  BuiltInHooksRegistry,
  HookDispatcher,
  type UnifiedHookPayload,
} from '../src/index.js';

async function tmpDir(label: string): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), `amux-hooks-${label}-`));
  return d;
}

function payload(overrides: Partial<UnifiedHookPayload> = {}): UnifiedHookPayload {
  return {
    agent: 'claude',
    hookType: 'StopHook',
    timestamp: new Date().toISOString(),
    data: {},
    raw: {},
    ...overrides,
  };
}

describe('HookConfigManager', () => {
  let dir: string;
  let mgr: HookConfigManager;

  beforeEach(async () => {
    dir = await tmpDir('cfg');
    mgr = new HookConfigManager(
      path.join(dir, 'global.json'),
      path.join(dir, 'project.json'),
    );
  });

  it('starts empty', async () => {
    expect(await mgr.list()).toEqual([]);
  });

  it('add + list + remove roundtrip at project scope', async () => {
    await mgr.add({
      id: 'h1',
      agent: 'claude',
      hookType: 'StopHook',
      handler: 'builtin',
      target: 'log',
    });
    const all = await mgr.list();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('h1');
    const removed = await mgr.remove('h1');
    expect(removed).toBe(true);
    expect(await mgr.list()).toEqual([]);
  });

  it('project overrides global by id', async () => {
    await mgr.add({ id: 'dup', agent: '*', hookType: '*', handler: 'builtin', target: 'log' }, 'global');
    await mgr.add({ id: 'dup', agent: 'claude', hookType: 'StopHook', handler: 'builtin', target: 'trace' }, 'project');
    const all = await mgr.list();
    expect(all).toHaveLength(1);
    expect(all[0].target).toBe('trace');
  });

  it('set patches fields', async () => {
    await mgr.add({ id: 'h1', agent: 'claude', hookType: '*', handler: 'builtin', target: 'log', priority: 100 });
    const patched = await mgr.set('h1', { priority: 10 });
    expect(patched?.priority).toBe(10);
  });

  it('getForAgent filters by agent+hookType, sorts by priority, honors enabled=false', async () => {
    await mgr.add({ id: 'a', agent: 'claude', hookType: 'StopHook', handler: 'builtin', target: 'log', priority: 20 });
    await mgr.add({ id: 'b', agent: '*', hookType: '*', handler: 'builtin', target: 'trace', priority: 5 });
    await mgr.add({ id: 'c', agent: 'claude', hookType: 'StopHook', handler: 'builtin', target: 'log', priority: 1, enabled: false });
    await mgr.add({ id: 'd', agent: 'codex', hookType: 'StopHook', handler: 'builtin', target: 'log' });
    const matches = await mgr.getForAgent('claude', 'StopHook');
    expect(matches.map((m) => m.id)).toEqual(['b', 'a']);
  });
});

describe('BuiltInHooksRegistry', () => {
  it('has log and trace built-ins', () => {
    const r = new BuiltInHooksRegistry();
    expect(r.get('log')).toBeDefined();
    expect(r.get('trace')).toBeDefined();
  });

  it('list filters by agent', () => {
    const r = new BuiltInHooksRegistry();
    const claudeOnly = r.list('claude').map((e) => e.id);
    expect(claudeOnly).toContain('claude.session-capture');
    const codexOnly = r.list('codex').map((e) => e.id);
    expect(codexOnly).not.toContain('claude.session-capture');
  });

  it('run unknown hook returns allow with message', async () => {
    const r = new BuiltInHooksRegistry();
    const res = await r.run('no-such', payload());
    expect(res.decision).toBe('allow');
    expect(res.message).toMatch(/no built-in hook/);
  });

  it('trace returns stdout line', async () => {
    const r = new BuiltInHooksRegistry();
    const res = await r.run('trace', payload({ sessionId: 'x' }));
    expect(res.stdout).toContain('claude/StopHook');
  });

  it('log appends JSONL to the configured path', async () => {
    const dir = await tmpDir('log');
    const logFile = path.join(dir, 'hook-log.jsonl');
    const r = new BuiltInHooksRegistry(logFile);
    await r.run('log', payload({ sessionId: 'sess' }));
    const contents = await fs.readFile(logFile, 'utf8');
    expect(contents).toContain('"sessionId":"sess"');
  });
});

describe('HookDispatcher', () => {
  it('dispatches matching registrations through builtin runner', async () => {
    const dir = await tmpDir('disp');
    const mgr = new HookConfigManager(
      path.join(dir, 'g.json'),
      path.join(dir, 'p.json'),
    );
    await mgr.add({ id: 'h', agent: 'claude', hookType: 'StopHook', handler: 'builtin', target: 'trace' });
    const dispatcher = new HookDispatcher(mgr, new BuiltInHooksRegistry());
    const res = await dispatcher.dispatch(payload());
    expect(res.decision).toBe('allow');
    expect(res.stdout).toContain('claude/StopHook');
  });

  it('runs a command handler and captures its stdout+exit code', async () => {
    const dir = await tmpDir('disp-cmd');
    const mgr = new HookConfigManager(
      path.join(dir, 'g.json'),
      path.join(dir, 'p.json'),
    );
    // Portable cross-platform command that prints a marker and exits 0.
    const cmd = process.platform === 'win32' ? 'echo hook-ran' : 'printf hook-ran';
    await mgr.add({
      id: 'cmd-1',
      agent: 'claude',
      hookType: 'StopHook',
      handler: 'command',
      target: cmd,
    });
    const dispatcher = new HookDispatcher(mgr, new BuiltInHooksRegistry());
    const res = await dispatcher.dispatch(payload(), { timeoutMs: 5000 });
    expect(res.decision).toBe('allow');
    expect(res.stdout ?? '').toMatch(/hook-ran/);
  });

  it('deny short-circuits later registrations', async () => {
    const dir = await tmpDir('disp-deny');
    const mgr = new HookConfigManager(
      path.join(dir, 'g.json'),
      path.join(dir, 'p.json'),
    );
    const badCmd = process.platform === 'win32' ? 'cmd /c exit 2' : 'sh -c "exit 2"';
    await mgr.add({ id: 'deny', agent: 'claude', hookType: 'StopHook', handler: 'command', target: badCmd, priority: 1 });
    await mgr.add({ id: 'after', agent: 'claude', hookType: 'StopHook', handler: 'builtin', target: 'trace', priority: 10 });
    const dispatcher = new HookDispatcher(mgr, new BuiltInHooksRegistry());
    const res = await dispatcher.dispatch(payload(), { timeoutMs: 5000 });
    expect(res.decision).toBe('deny');
    expect(res.stdout ?? '').not.toContain('claude/StopHook');
  });

  it('returns allow with no stdout when no registrations match', async () => {
    const dir = await tmpDir('disp-empty');
    const mgr = new HookConfigManager(
      path.join(dir, 'g.json'),
      path.join(dir, 'p.json'),
    );
    const dispatcher = new HookDispatcher(mgr, new BuiltInHooksRegistry());
    const res = await dispatcher.dispatch(payload());
    expect(res.decision).toBe('allow');
    expect(res.stdout).toBeUndefined();
  });
});

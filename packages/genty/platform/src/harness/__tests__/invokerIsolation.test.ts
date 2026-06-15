import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('node:child_process', () => {
  const EventEmitter = require('node:events');
  let lastSpawnEnv: Record<string, string> | undefined;
  return {
    spawn: vi.fn((_cmd: string, _args: string[], opts: { env?: Record<string, string> }) => {
      lastSpawnEnv = opts.env as Record<string, string>;
      const child = new EventEmitter();
      child.pid = 99;
      child.stdin = null;
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = vi.fn();
      process.nextTick(() => {
        child.stdout.emit('data', Buffer.from('ok'));
        child.emit('close', 0, null);
      });
      return child;
    }),
    get __lastSpawnEnv() { return lastSpawnEnv; },
  };
});

vi.mock('@a5c-ai/babysitter-sdk', () => ({
  BabysitterRuntimeError: class extends Error {
    constructor(name: string, msg: string, public details?: unknown) { super(msg); this.name = name; }
  },
  ErrorCategory: { Configuration: 'configuration', External: 'external', Runtime: 'runtime', Validation: 'validation' },
  checkCliAvailable: vi.fn().mockResolvedValue({ available: true, path: '/usr/bin/pi' }),
}));

vi.mock('../invoker/processControl', () => ({
  trackChild: vi.fn(),
  untrackChild: vi.fn(),
  cancelRunningProcess: vi.fn(),
}));

vi.mock('../invoker/launch', () => ({
  buildLaunchSpec: vi.fn().mockReturnValue({ command: 'pi', args: ['--prompt', 'test'], shell: false }),
}));

afterEach(() => vi.clearAllMocks());

describe('invoker isolation', () => {
  it('passes full env by default', async () => {
    const { invokeHarness } = await import('../invoker');
    const cp = await import('node:child_process');
    process.env.MY_SECRET = 'supersecret';
    await invokeHarness('pi', { prompt: 'test' });
    expect((cp as any).__lastSpawnEnv.MY_SECRET).toBe('supersecret');
    delete process.env.MY_SECRET;
  });

  it('strips env vars in isolated mode', async () => {
    const { invokeHarness } = await import('../invoker');
    const cp = await import('node:child_process');
    process.env.MY_SECRET = 'supersecret';
    await invokeHarness('pi', { prompt: 'test', isolated: true });
    const env = (cp as any).__lastSpawnEnv;
    expect(env.MY_SECRET).toBeUndefined();
    expect(env.PATH).toBeDefined();
    delete process.env.MY_SECRET;
  });

  it('applies explicit env overrides in isolated mode', async () => {
    const { invokeHarness } = await import('../invoker');
    const cp = await import('node:child_process');
    await invokeHarness('pi', { prompt: 'test', isolated: true, env: { CUSTOM: 'value' } });
    const env = (cp as any).__lastSpawnEnv;
    expect(env.CUSTOM).toBe('value');
    expect(env.PATH).toBeDefined();
  });
});

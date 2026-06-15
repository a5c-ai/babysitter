import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RpcServer } from './server.js';

describe('rpc/server', () => {
  let stdoutWrites: string[];

  beforeEach(() => {
    stdoutWrites = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      stdoutWrites.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    });
  });

  it('registers and calls a handler', async () => {
    const server = new RpcServer();
    server.register('health', async () => ({ status: 'ok' }));
    expect(server['handlers'].has('health')).toBe(true);
  });

  it('emits events as JSONL to stdout', () => {
    const server = new RpcServer();
    server.emit('test.event', { key: 'value' });
    expect(stdoutWrites).toHaveLength(1);
    const parsed = JSON.parse(stdoutWrites[0]);
    expect(parsed.event).toBe('test.event');
    expect(parsed.data.key).toBe('value');
    expect(parsed.timestamp).toBeTruthy();
  });

  it('stop emits shutdown event', () => {
    const server = new RpcServer();
    server.stop();
    expect(stdoutWrites).toHaveLength(1);
    const parsed = JSON.parse(stdoutWrites[0]);
    expect(parsed.event).toBe('server.shutdown');
  });
});

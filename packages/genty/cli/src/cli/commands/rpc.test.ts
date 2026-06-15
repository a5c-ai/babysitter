import { describe, it, expect, vi } from 'vitest';

describe('cli/rpc', () => {
  it('handleRpc is a function', async () => {
    const { handleRpc } = await import('./rpc.js');
    expect(typeof handleRpc).toBe('function');
  });
});

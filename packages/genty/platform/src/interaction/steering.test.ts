import { describe, it, expect, vi } from 'vitest';
import { SteeringQueue } from './steering.js';

describe('interaction/steering', () => {
  it('submits and drains messages', () => {
    const q = new SteeringQueue();
    q.submit('fix the bug', 'steer');
    q.submit('also add tests', 'followup');
    expect(q.pending).toBe(2);

    const all = q.drain();
    expect(all).toHaveLength(2);
    expect(q.pending).toBe(0);
  });

  it('drains by type', () => {
    const q = new SteeringQueue();
    q.submit('steer 1', 'steer');
    q.submit('followup 1', 'followup');
    q.submit('steer 2', 'steer');

    const steers = q.drain('steer');
    expect(steers).toHaveLength(2);
    expect(q.pending).toBe(1);

    const followups = q.drain('followup');
    expect(followups).toHaveLength(1);
    expect(q.pending).toBe(0);
  });

  it('peek does not consume messages', () => {
    const q = new SteeringQueue();
    q.submit('msg', 'steer');
    expect(q.peek()).toHaveLength(1);
    expect(q.pending).toBe(1);
  });

  it('notifies listeners on submit', () => {
    const q = new SteeringQueue();
    const listener = vi.fn();
    q.onMessage(listener);
    q.submit('hello', 'steer', 'user-1');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      type: 'steer', content: 'hello', authorId: 'user-1',
    }));
  });

  it('unsubscribes listeners', () => {
    const q = new SteeringQueue();
    const listener = vi.fn();
    const unsub = q.onMessage(listener);
    q.submit('before', 'steer');
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    q.submit('after', 'steer');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('includes timestamps', () => {
    const q = new SteeringQueue();
    q.submit('msg', 'steer');
    const msgs = q.drain();
    expect(msgs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

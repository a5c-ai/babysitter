import { describe, it, expect } from 'vitest';
import { processTracker } from '../src/process-tracker.js';

describe('ProcessTracker', () => {
  it('starts with zero active processes', () => {
    expect(processTracker.activeCount).toBe(0);
  });

  it('register increments activeCount', () => {
    const baseline = processTracker.activeCount;
    processTracker.register(99999, 99999, 'test-run-1');
    expect(processTracker.activeCount).toBe(baseline + 1);
    // Cleanup
    processTracker.unregister(99999);
  });

  it('unregister decrements activeCount', () => {
    processTracker.register(99998, 99998, 'test-run-2');
    const before = processTracker.activeCount;
    processTracker.unregister(99998);
    expect(processTracker.activeCount).toBe(before - 1);
  });

  it('unregister is idempotent', () => {
    processTracker.register(99997, 99997, 'test-run-3');
    processTracker.unregister(99997);
    const count = processTracker.activeCount;
    processTracker.unregister(99997);
    expect(processTracker.activeCount).toBe(count);
  });

  it('killAll clears all tracked processes', () => {
    processTracker.register(99996, 99996, 'test-run-4');
    processTracker.register(99995, 99995, 'test-run-5');
    processTracker.killAll();
    expect(processTracker.activeCount).toBe(0);
  });

  it('is a singleton', async () => {
    const { processTracker: pt2 } = await import('../src/process-tracker.js');
    expect(pt2).toBe(processTracker);
  });
});

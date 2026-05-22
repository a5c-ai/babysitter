import { describe, it, expect } from 'vitest';
import { DEFAULT_RETRY_POLICY } from '../src/index.js';

describe('DEFAULT_RETRY_POLICY', () => {
  it('has maxAttempts of 3', () => {
    expect(DEFAULT_RETRY_POLICY.maxAttempts).toBe(3);
  });

  it('has baseDelayMs of 1000', () => {
    expect(DEFAULT_RETRY_POLICY.baseDelayMs).toBe(1000);
  });

  it('has maxDelayMs of 30000', () => {
    expect(DEFAULT_RETRY_POLICY.maxDelayMs).toBe(30000);
  });

  it('has jitterFactor of 0.1', () => {
    expect(DEFAULT_RETRY_POLICY.jitterFactor).toBe(0.1);
  });

  it('retries on RATE_LIMITED, AGENT_CRASH, and TIMEOUT', () => {
    expect(DEFAULT_RETRY_POLICY.retryOn).toEqual([
      'RATE_LIMITED',
      'AGENT_CRASH',
      'TIMEOUT',
    ]);
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(DEFAULT_RETRY_POLICY)).toBe(true);
  });

  it('has a frozen retryOn array', () => {
    expect(Object.isFrozen(DEFAULT_RETRY_POLICY.retryOn)).toBe(true);
  });

  it('cannot be mutated', () => {
    expect(() => {
      // @ts-expect-error -- Testing runtime immutability
      DEFAULT_RETRY_POLICY.maxAttempts = 10;
    }).toThrow();
  });
});

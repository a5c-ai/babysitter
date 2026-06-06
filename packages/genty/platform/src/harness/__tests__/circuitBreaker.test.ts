import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreaker } from '../circuitBreaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;
  const NOW = 1_000_000;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 5_000 });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts in closed state', () => {
    const snap = breaker.getState();
    expect(snap.state).toBe('closed');
    expect(snap.failureCount).toBe(0);
  });

  it('allows requests when closed', () => {
    expect(breaker.isAllowed()).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Closed → Open
  // -------------------------------------------------------------------------

  it('opens after reaching the failure threshold', () => {
    breaker.recordFailure(NOW);
    breaker.recordFailure(NOW);
    expect(breaker.getState(NOW).state).toBe('closed');

    breaker.recordFailure(NOW);
    expect(breaker.getState(NOW).state).toBe('open');
    expect(breaker.isAllowed(NOW)).toBe(false);
  });

  it('tracks failureCount and lastFailureAt', () => {
    breaker.recordFailure(NOW);
    const snap = breaker.getState(NOW);
    expect(snap.failureCount).toBe(1);
    expect(snap.lastFailureAt).toBe(NOW);
  });

  // -------------------------------------------------------------------------
  // Open → Half-open
  // -------------------------------------------------------------------------

  it('transitions to half-open after resetTimeoutMs', () => {
    // Trip the breaker
    for (let i = 0; i < 3; i++) breaker.recordFailure(NOW);
    expect(breaker.getState(NOW).state).toBe('open');

    // Not enough time
    expect(breaker.getState(NOW + 4_999).state).toBe('open');

    // Timeout reached
    expect(breaker.getState(NOW + 5_000).state).toBe('half-open');
    expect(breaker.isAllowed(NOW + 5_000)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Half-open → Closed (success)
  // -------------------------------------------------------------------------

  it('closes on success from half-open', () => {
    for (let i = 0; i < 3; i++) breaker.recordFailure(NOW);
    // Advance to half-open
    breaker.getState(NOW + 5_000);

    breaker.recordSuccess(NOW + 5_001);
    const snap = breaker.getState(NOW + 5_001);
    expect(snap.state).toBe('closed');
    expect(snap.failureCount).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Half-open → Open (failure)
  // -------------------------------------------------------------------------

  it('reopens on failure from half-open', () => {
    for (let i = 0; i < 3; i++) breaker.recordFailure(NOW);
    // Advance to half-open
    breaker.getState(NOW + 5_000);

    breaker.recordFailure(NOW + 5_001);
    expect(breaker.getState(NOW + 5_001).state).toBe('open');
  });

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  it('reset() returns to closed state', () => {
    for (let i = 0; i < 3; i++) breaker.recordFailure(NOW);
    expect(breaker.getState(NOW).state).toBe('open');

    breaker.reset();
    expect(breaker.getState(NOW).state).toBe('closed');
    expect(breaker.isAllowed(NOW)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Execute
  // -------------------------------------------------------------------------

  it('execute() runs fn and records success', async () => {
    const result = await breaker.execute(() => Promise.resolve(42), NOW);
    expect(result).toBe(42);
    expect(breaker.getState(NOW).lastSuccessAt).toBe(NOW);
  });

  it('execute() records failure and rethrows', async () => {
    const err = new Error('boom');
    await expect(breaker.execute(() => Promise.reject(err), NOW)).rejects.toThrow('boom');
    expect(breaker.getState(NOW).failureCount).toBe(1);
  });

  it('execute() rejects immediately when circuit is open', async () => {
    for (let i = 0; i < 3; i++) breaker.recordFailure(NOW);
    await expect(breaker.execute(() => Promise.resolve('nope'), NOW)).rejects.toThrow(
      'Circuit breaker is open',
    );
  });

  // -------------------------------------------------------------------------
  // Success resets failure count while closed
  // -------------------------------------------------------------------------

  it('recordSuccess resets failure count in closed state', () => {
    breaker.recordFailure(NOW);
    breaker.recordFailure(NOW);
    expect(breaker.getState(NOW).failureCount).toBe(2);

    breaker.recordSuccess(NOW);
    expect(breaker.getState(NOW).failureCount).toBe(0);

    // Now need full threshold again to trip
    breaker.recordFailure(NOW);
    breaker.recordFailure(NOW);
    expect(breaker.getState(NOW).state).toBe('closed');
  });
});

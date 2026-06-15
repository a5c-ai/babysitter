/**
 * Alert queue tests (SPEC §4/§5, AC6 — HUD phase): urgency ordering (earliest
 * deadline first), shown-alert resolution (remembered id wins while pending,
 * most urgent as fallback) and click-to-cycle wrap-around.
 */
import { describe, expect, it } from 'vitest';

import { nextAlert, resolveShownAlert, sortAlertsByUrgency } from '../alertQueue';
import type { AlertEntry } from '../store';

function alert(id: string, deadlineTs: number): AlertEntry {
  return {
    hookRequestId: id,
    runId: `run-${id}`,
    unitId: `unit-${id}`,
    kind: 'approval',
    payload: {},
    deadlineTs,
  };
}

const A = alert('hook-a', 3000);
const B = alert('hook-b', 1000); // most urgent
const C = alert('hook-c', 2000);

describe('sortAlertsByUrgency', () => {
  it('orders by earliest deadline, then id (stable)', () => {
    expect(sortAlertsByUrgency([A, B, C]).map((a) => a.hookRequestId)).toEqual([
      'hook-b',
      'hook-c',
      'hook-a',
    ]);
    const tieX = alert('hook-x', 500);
    const tieY = alert('hook-y', 500);
    expect(sortAlertsByUrgency([tieY, tieX]).map((a) => a.hookRequestId)).toEqual([
      'hook-x',
      'hook-y',
    ]);
  });

  it('does not mutate its input', () => {
    const input = [A, B];
    sortAlertsByUrgency(input);
    expect(input.map((a) => a.hookRequestId)).toEqual(['hook-a', 'hook-b']);
  });
});

describe('resolveShownAlert', () => {
  it('shows the most urgent by default', () => {
    expect(resolveShownAlert([A, B, C], null)?.hookRequestId).toBe('hook-b');
  });

  it('keeps the remembered alert while it is still pending', () => {
    expect(resolveShownAlert([A, B, C], 'hook-a')?.hookRequestId).toBe('hook-a');
  });

  it('falls back to most urgent when the remembered alert resolved', () => {
    expect(resolveShownAlert([A, C], 'hook-b')?.hookRequestId).toBe('hook-c');
  });

  it('is undefined for an empty queue', () => {
    expect(resolveShownAlert([], 'hook-a')).toBeUndefined();
  });
});

describe('nextAlert (banner click cycles)', () => {
  it('cycles in urgency order and wraps around', () => {
    expect(nextAlert([A, B, C], 'hook-b')?.hookRequestId).toBe('hook-c');
    expect(nextAlert([A, B, C], 'hook-c')?.hookRequestId).toBe('hook-a');
    expect(nextAlert([A, B, C], 'hook-a')?.hookRequestId).toBe('hook-b'); // wrap
  });

  it('starts from the most urgent when nothing is remembered', () => {
    expect(nextAlert([A, B, C], null)?.hookRequestId).toBe('hook-b');
  });

  it('handles a single-alert queue and an unknown id', () => {
    expect(nextAlert([A], 'hook-a')?.hookRequestId).toBe('hook-a');
    expect(nextAlert([A, B], 'hook-gone')?.hookRequestId).toBe('hook-b');
    expect(nextAlert([], null)).toBeUndefined();
  });
});

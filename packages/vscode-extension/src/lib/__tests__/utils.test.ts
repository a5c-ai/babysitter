import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDuration,
  formatRelativeTime,
  formatTimestamp,
  getStatusIcon,
  getKindIcon,
  isStale,
  truncate,
} from '../utils';

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------
describe('formatDuration', () => {
  it('returns "< 1s" for 0ms', () => {
    expect(formatDuration(0)).toBe('< 1s');
  });

  it('returns "< 1s" for 500ms', () => {
    expect(formatDuration(500)).toBe('< 1s');
  });

  it('returns "< 1s" for 999ms', () => {
    expect(formatDuration(999)).toBe('< 1s');
  });

  it('returns "5s" for 5000ms', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('returns "1m 30s" for 90000ms', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
  });

  it('returns "2m" for exactly 120000ms', () => {
    expect(formatDuration(120000)).toBe('2m');
  });

  it('returns "1h 1m" for 3660000ms', () => {
    expect(formatDuration(3660000)).toBe('1h 1m');
  });

  it('returns "1h" for exactly 3600000ms', () => {
    expect(formatDuration(3600000)).toBe('1h');
  });

  it('returns "0s" for negative values', () => {
    expect(formatDuration(-100)).toBe('0s');
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------
describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for a time within the last 60 seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:30Z'));
    expect(formatRelativeTime('2026-03-10T12:00:00Z')).toBe('just now');
    vi.useRealTimers();
  });

  it('returns minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:05:00Z'));
    expect(formatRelativeTime('2026-03-10T12:00:00Z')).toBe('5m ago');
    vi.useRealTimers();
  });

  it('returns hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T15:00:00Z'));
    expect(formatRelativeTime('2026-03-10T12:00:00Z')).toBe('3h ago');
    vi.useRealTimers();
  });

  it('returns days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    expect(formatRelativeTime('2026-03-10T12:00:00Z')).toBe('5d ago');
    vi.useRealTimers();
  });

  it('returns months ago for large differences', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T12:00:00Z'));
    expect(formatRelativeTime('2026-03-10T12:00:00Z')).toBe('3mo ago');
    vi.useRealTimers();
  });

  it('returns "just now" for future dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    expect(formatRelativeTime('2026-03-10T13:00:00Z')).toBe('just now');
    vi.useRealTimers();
  });

  it('returns the raw string for invalid dates', () => {
    expect(formatRelativeTime('not-a-date')).toBe('not-a-date');
  });
});

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------
describe('formatTimestamp', () => {
  it('formats a valid ISO date', () => {
    // Use a date that formats predictably regardless of timezone
    const result = formatTimestamp('2026-03-10T12:30:00.000Z');
    // Just verify it contains expected month abbreviation pattern
    expect(result).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+, \d+:\d{2} (AM|PM)$/);
  });

  it('returns raw string for invalid date', () => {
    expect(formatTimestamp('invalid')).toBe('invalid');
  });
});

// ---------------------------------------------------------------------------
// getStatusIcon
// ---------------------------------------------------------------------------
describe('getStatusIcon', () => {
  it('returns sync~spin for pending', () => {
    expect(getStatusIcon('pending')).toBe('sync~spin');
  });

  it('returns hand for waiting with breakpoint', () => {
    expect(getStatusIcon('waiting', 'breakpoint')).toBe('hand');
  });

  it('returns loading~spin for waiting with task', () => {
    expect(getStatusIcon('waiting', 'task')).toBe('loading~spin');
  });

  it('returns loading~spin for waiting without waitingKind', () => {
    expect(getStatusIcon('waiting')).toBe('loading~spin');
  });

  it('returns check for completed', () => {
    expect(getStatusIcon('completed')).toBe('check');
  });

  it('returns error for failed', () => {
    expect(getStatusIcon('failed')).toBe('error');
  });

  it('returns circle-outline for unknown status', () => {
    expect(getStatusIcon('unknown' as never)).toBe('circle-outline');
  });
});

// ---------------------------------------------------------------------------
// getKindIcon
// ---------------------------------------------------------------------------
describe('getKindIcon', () => {
  it('returns code for node', () => {
    expect(getKindIcon('node')).toBe('code');
  });

  it('returns hubot for agent', () => {
    expect(getKindIcon('agent')).toBe('hubot');
  });

  it('returns wand for skill', () => {
    expect(getKindIcon('skill')).toBe('wand');
  });

  it('returns hand for breakpoint', () => {
    expect(getKindIcon('breakpoint')).toBe('hand');
  });

  it('returns terminal for shell', () => {
    expect(getKindIcon('shell')).toBe('terminal');
  });

  it('returns clock for sleep', () => {
    expect(getKindIcon('sleep')).toBe('clock');
  });

  it('returns circle-outline for unknown kind', () => {
    expect(getKindIcon('unknown' as never)).toBe('circle-outline');
  });
});

// ---------------------------------------------------------------------------
// isStale
// ---------------------------------------------------------------------------
describe('isStale', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for a recent date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    expect(isStale('2026-03-10T11:30:00Z')).toBe(false);
    vi.useRealTimers();
  });

  it('returns true for a date older than 1 hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T14:00:00Z'));
    expect(isStale('2026-03-10T12:00:00Z')).toBe(true);
    vi.useRealTimers();
  });

  it('supports custom threshold', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:10:00Z'));
    // 5 minutes threshold
    expect(isStale('2026-03-10T12:00:00Z', 5 * 60 * 1000)).toBe(true);
    expect(isStale('2026-03-10T12:06:00Z', 5 * 60 * 1000)).toBe(false);
    vi.useRealTimers();
  });

  it('returns false for invalid date', () => {
    expect(isStale('not-a-date')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------
describe('truncate', () => {
  it('returns the original string when shorter than maxLen', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns the original string when exactly maxLen', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates with ellipsis when longer than maxLen', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('returns empty string for maxLen < 1', () => {
    expect(truncate('hello', 0)).toBe('');
    expect(truncate('hello', -1)).toBe('');
  });

  it('handles maxLen <= 3 by slicing without ellipsis', () => {
    expect(truncate('hello', 3)).toBe('hel');
    expect(truncate('hello', 2)).toBe('he');
    expect(truncate('hello', 1)).toBe('h');
  });

  it('handles empty string input', () => {
    expect(truncate('', 10)).toBe('');
  });
});

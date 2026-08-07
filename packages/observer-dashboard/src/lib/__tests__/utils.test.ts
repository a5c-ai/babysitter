import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatTimestamp,
  truncateId,
  getStatusColor,
  getStatusBg,
  formatShortId,
  friendlyProcessName,
  formatWakeRelative,
} from '../utils';

describe('formatWakeRelative (§15.1 AC-84/85)', () => {
  const now = Date.UTC(2026, 6, 6, 12, 0, 0); // 2026-07-06T12:00:00Z
  it('a future wake reads "in <rel>" and is not overdue', () => {
    const iso = new Date(now + 3 * 3_600_000).toISOString();
    expect(formatWakeRelative(iso, now)).toEqual({ overdue: false, text: 'in 3h' });
  });
  it('a past wake reads "<rel> ago" and is overdue', () => {
    const iso = new Date(now - 17 * 3_600_000).toISOString();
    expect(formatWakeRelative(iso, now)).toEqual({ overdue: true, text: '17h ago' });
  });
  it('undefined / unparseable input yields an empty, non-overdue result', () => {
    expect(formatWakeRelative(undefined, now)).toEqual({ overdue: false, text: '' });
    expect(formatWakeRelative('not-a-date', now)).toEqual({ overdue: false, text: '' });
  });
});

describe('formatDuration', () => {
  it('returns dash for null/undefined', () => {
    expect(formatDuration(null)).toBe('\u2014');
    expect(formatDuration(undefined)).toBe('\u2014');
  });

  it('returns dash for negative values', () => {
    expect(formatDuration(-100)).toBe('\u2014');
  });

  it('returns "<1s" for zero', () => {
    expect(formatDuration(0)).toBe('<1s');
  });

  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(5000)).toBe('5s');
    expect(formatDuration(59000)).toBe('59s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(3599000)).toBe('59m 59s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3600000)).toBe('1h 0m');
    expect(formatDuration(7260000)).toBe('2h 1m');
  });

  it('formats ages >=48h in days (QA F7)', () => {
    // Just under the threshold stays in hours.
    expect(formatDuration(47 * 3600000 + 59 * 60000)).toBe('47h 59m');
    // At the threshold, switch to days.
    expect(formatDuration(48 * 3600000)).toBe('2d 0h');
    // The QA F7 example: 388h 25m → 16d 4h.
    expect(formatDuration((388 * 3600 + 25 * 60) * 1000)).toBe('16d 4h');
  });
});

describe('formatTimestamp', () => {
  it('returns dash for undefined', () => {
    expect(formatTimestamp(undefined)).toBe('\u2014');
  });

  it('formats a valid ISO string', () => {
    const result = formatTimestamp('2024-01-15T14:30:00Z');
    // Result depends on locale, just verify it returns something non-dash
    expect(result).not.toBe('\u2014');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('truncateId', () => {
  it('returns dash for empty string', () => {
    expect(truncateId('')).toBe('\u2014');
  });

  it('returns full string when within limit', () => {
    expect(truncateId('short')).toBe('short');
  });

  it('truncates and appends ellipsis', () => {
    const longId = 'abcdefghijklmnopqrstuvwxyz';
    expect(truncateId(longId)).toBe('abcdefghijkl...');
    expect(truncateId(longId, 5)).toBe('abcde...');
  });
});

describe('getStatusColor', () => {
  it('returns success class for completed/resolved/ok', () => {
    expect(getStatusColor('completed')).toBe('text-success');
    expect(getStatusColor('resolved')).toBe('text-success');
    expect(getStatusColor('ok')).toBe('text-success');
  });

  it('returns error class for failed/error', () => {
    expect(getStatusColor('failed')).toBe('text-error');
    expect(getStatusColor('error')).toBe('text-error');
  });

  it('returns pending class for waiting/pending', () => {
    expect(getStatusColor('waiting')).toBe('text-pending');
    expect(getStatusColor('pending')).toBe('text-pending');
  });

  it('returns info class for running/requested', () => {
    expect(getStatusColor('running')).toBe('text-info');
    expect(getStatusColor('requested')).toBe('text-info');
  });

  it('returns muted class for unknown status', () => {
    expect(getStatusColor('whatever')).toBe('text-foreground-muted');
  });
});

describe('getStatusBg', () => {
  it('returns success bg for completed/resolved/ok', () => {
    expect(getStatusBg('completed')).toBe('bg-success-muted');
    expect(getStatusBg('resolved')).toBe('bg-success-muted');
    expect(getStatusBg('ok')).toBe('bg-success-muted');
  });

  it('returns error bg for failed/error', () => {
    expect(getStatusBg('failed')).toBe('bg-error-muted');
    expect(getStatusBg('error')).toBe('bg-error-muted');
  });

  it('returns pending bg for waiting/pending', () => {
    expect(getStatusBg('waiting')).toBe('bg-pending-muted');
    expect(getStatusBg('pending')).toBe('bg-pending-muted');
  });

  it('returns info bg for running/requested', () => {
    expect(getStatusBg('running')).toBe('bg-info-muted');
    expect(getStatusBg('requested')).toBe('bg-info-muted');
  });

  it('returns default bg for unknown status', () => {
    expect(getStatusBg('whatever')).toBe('bg-muted');
  });
});

describe('formatShortId', () => {
  it('returns dash for empty string', () => {
    // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
    expect(formatShortId('')).toBe('N/A');
  });

  it('returns full string when within limit', () => {
    expect(formatShortId('abcd')).toBe('abcd');
  });

  it('shows last N chars with leading ellipsis for machine ids', () => {
    // ULID → any fragment is as good as any other, tail wins.
    expect(formatShortId('01KVAEXP3ERB4KX9G031GS4YE0')).toBe('...4YE0');
    expect(formatShortId('01KVAEXP3ERB4KX9G031GS4YE0', 6)).toBe('...GS4YE0');
    // UUID and long hex hashes are equally opaque.
    expect(formatShortId('550e8400-e29b-41d4-a716-446655440000')).toBe('...0000');
    expect(formatShortId('dc57c0b0317c423c09d38028fb2fbbba')).toBe('...bbba');
  });

  it('keeps human-named ids readable instead of tail fragments (QA F9)', () => {
    // "...-org" told the user nothing; the dir name is the meaning.
    expect(formatShortId('ai-org')).toBe('ai-org');
    expect(formatShortId('meeting-notes')).toBe('meeting-notes');
    // Genuinely long human names head-truncate, preserving the head.
    expect(formatShortId('a-very-long-human-readable-run-name')).toBe('a-very-long-human...');
  });
});

describe('friendlyProcessName', () => {
  it('returns empty string for empty input', () => {
    expect(friendlyProcessName('')).toBe('');
  });

  it('capitalizes hyphen-separated words', () => {
    expect(friendlyProcessName('data-pipeline')).toBe('Data Pipeline');
  });

  it('capitalizes slash-separated words', () => {
    expect(friendlyProcessName('data-pipeline/ingest')).toBe('Data Pipeline Ingest');
  });

  it('handles single word', () => {
    expect(friendlyProcessName('deploy')).toBe('Deploy');
  });
});

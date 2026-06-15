import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  triageFailures,
  formatTriageReport,
  type TriageReport,
  type FailureEntry,
} from '../failureTriage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'fail-triage-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function writeJournal(events: Array<{ type: string; recordedAt: string; data: Record<string, unknown> }>): void {
  const lines = events.map((e) => JSON.stringify(e)).join('\n');
  writeFileSync(join(tempDir, 'journal.jsonl'), lines);
}

// ---------------------------------------------------------------------------
// triageFailures
// ---------------------------------------------------------------------------

describe('triageFailures', () => {
  it('returns empty report when no journal exists', async () => {
    const report = await triageFailures(tempDir);
    expect(report.failures).toHaveLength(0);
    expect(report.summary).toContain('No journal');
  });

  it('returns empty report when journal has no failures', async () => {
    writeJournal([
      { type: 'EFFECT_REQUESTED', recordedAt: '2026-01-01T00:00:00Z', data: { effectId: 'e1' } },
      { type: 'EFFECT_RESOLVED', recordedAt: '2026-01-01T00:00:01Z', data: { effectId: 'e1' } },
    ]);
    const report = await triageFailures(tempDir);
    expect(report.failures).toHaveLength(0);
    expect(report.summary).toBe('No failures detected.');
  });

  it('classifies a fatal error', async () => {
    writeJournal([
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:00Z', data: { effectId: 'e1', kind: 'shell', error: 'ENOSPC: no space left' } },
    ]);
    const report = await triageFailures(tempDir);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].severity).toBe('fatal');
    expect(report.suggestedActions.some((a) => a.includes('fatal'))).toBe(true);
  });

  it('classifies a warning error', async () => {
    writeJournal([
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:00Z', data: { effectId: 'e2', kind: 'api', error: 'Request timeout after 30s' } },
    ]);
    const report = await triageFailures(tempDir);
    expect(report.failures[0].severity).toBe('warning');
  });

  it('classifies recoverable errors by default', async () => {
    writeJournal([
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:00Z', data: { effectId: 'e3', kind: 'node', error: 'TypeError: x is not a function' } },
    ]);
    const report = await triageFailures(tempDir);
    expect(report.failures[0].severity).toBe('recoverable');
  });

  it('handles multiple failures with mixed severities', async () => {
    writeJournal([
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:00Z', data: { effectId: 'e1', kind: 'shell', error: 'Permission denied' } },
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:01Z', data: { effectId: 'e2', kind: 'api', error: 'rate limit exceeded' } },
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:02Z', data: { effectId: 'e3', kind: 'node', error: 'ReferenceError' } },
    ]);
    const report = await triageFailures(tempDir);
    expect(report.failures).toHaveLength(3);
    expect(report.summary).toContain('3 failure(s)');
    expect(report.suggestedActions.length).toBeGreaterThanOrEqual(2);
  });

  it('uses message field when error field is absent', async () => {
    writeJournal([
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:00Z', data: { effectId: 'e4', kind: 'node', message: 'Something broke' } },
    ]);
    const report = await triageFailures(tempDir);
    expect(report.failures[0].error).toBe('Something broke');
  });
});

// ---------------------------------------------------------------------------
// formatTriageReport
// ---------------------------------------------------------------------------

describe('formatTriageReport', () => {
  it('formats an empty report', () => {
    const report: TriageReport = {
      failures: [],
      summary: 'No failures detected.',
      suggestedActions: [],
    };
    const text = formatTriageReport(report);
    expect(text).toContain('Failure Triage Report');
    expect(text).toContain('No failures detected.');
  });

  it('formats failures with severity tags', () => {
    const report: TriageReport = {
      failures: [
        { effectId: 'e1', kind: 'shell', error: 'disk full', timestamp: '2026-01-01T00:00:00Z', severity: 'fatal' },
        { effectId: 'e2', kind: 'api', error: 'timeout', timestamp: '2026-01-01T00:00:01Z', severity: 'warning' },
        { effectId: 'e3', kind: 'node', error: 'crash', timestamp: '2026-01-01T00:00:02Z', severity: 'recoverable' },
      ],
      summary: '3 failure(s)',
      suggestedActions: ['Fix disk', 'Retry later'],
    };
    const text = formatTriageReport(report);
    expect(text).toContain('[FATAL]');
    expect(text).toContain('[WARN ]');
    expect(text).toContain('[RECOV]');
    expect(text).toContain('Suggested Actions:');
    expect(text).toContain('Fix disk');
  });
});

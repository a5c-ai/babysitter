import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { exportAuditLog, collectAuditRecords, type AuditRecord } from '../auditExport';

// ---------------------------------------------------------------------------
// exportAuditLog
// ---------------------------------------------------------------------------

describe('exportAuditLog', () => {
  const records: AuditRecord[] = [
    {
      timestamp: '2026-06-01T10:00:00Z',
      actor: 'orchestrator',
      action: 'approve',
      resource: 'task-1',
      outcome: 'approved',
      metadata: { reason: 'looks good' },
    },
    {
      timestamp: '2026-06-01T10:05:00Z',
      actor: 'reviewer',
      action: 'reject',
      resource: 'task-2',
      outcome: 'rejected',
    },
  ];

  it('exports as JSON', () => {
    const output = exportAuditLog(records, 'json');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].actor).toBe('orchestrator');
  });

  it('exports as CSV with header', () => {
    const output = exportAuditLog(records, 'csv');
    const lines = output.split('\n');
    expect(lines[0]).toBe('timestamp,actor,action,resource,outcome,metadata');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[1]).toContain('orchestrator');
  });

  it('exports as Markdown table', () => {
    const output = exportAuditLog(records, 'markdown');
    const lines = output.split('\n');
    expect(lines[0]).toContain('Timestamp');
    expect(lines[1]).toContain('---');
    expect(lines[2]).toContain('orchestrator');
    expect(lines[3]).toContain('reviewer');
  });

  it('handles CSV fields with commas and quotes', () => {
    const specialRecords: AuditRecord[] = [
      {
        timestamp: '2026-06-01T10:00:00Z',
        actor: 'bot',
        action: 'note',
        resource: 'a "quoted" thing',
        outcome: 'value, with comma',
      },
    ];
    const output = exportAuditLog(specialRecords, 'csv');
    expect(output).toContain('"a ""quoted"" thing"');
    expect(output).toContain('"value, with comma"');
  });
});

// ---------------------------------------------------------------------------
// collectAuditRecords
// ---------------------------------------------------------------------------

describe('collectAuditRecords', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'audit-'));
  });
  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('collects from governance-decisions.jsonl', () => {
    const decisions = [
      JSON.stringify({
        timestamp: '2026-06-01T10:00:00Z',
        actor: 'governance',
        action: 'approve',
        resource: 'task-1',
        outcome: 'approved',
      }),
    ].join('\n');
    writeFileSync(join(tempDir, 'governance-decisions.jsonl'), decisions, 'utf8');

    const records = collectAuditRecords(tempDir);
    expect(records).toHaveLength(1);
    expect(records[0].actor).toBe('governance');
    expect(records[0].action).toBe('approve');
  });

  it('collects from journal.jsonl', () => {
    const journal = [
      JSON.stringify({
        timestamp: '2026-06-01T10:01:00Z',
        agent: 'worker-1',
        event: 'task-started',
        taskId: 'task-2',
        status: 'running',
      }),
    ].join('\n');
    writeFileSync(join(tempDir, 'journal.jsonl'), journal, 'utf8');

    const records = collectAuditRecords(tempDir);
    expect(records).toHaveLength(1);
    expect(records[0].actor).toBe('worker-1');
    expect(records[0].action).toBe('task-started');
    expect(records[0].resource).toBe('task-2');
  });

  it('merges and sorts records from both sources', () => {
    writeFileSync(
      join(tempDir, 'governance-decisions.jsonl'),
      JSON.stringify({ timestamp: '2026-06-01T10:05:00Z', actor: 'gov', action: 'a', resource: 'r', outcome: 'ok' }) + '\n',
      'utf8',
    );
    writeFileSync(
      join(tempDir, 'journal.jsonl'),
      JSON.stringify({ timestamp: '2026-06-01T10:00:00Z', agent: 'sys', event: 'b', taskId: 'x', status: 'done' }) + '\n',
      'utf8',
    );

    const records = collectAuditRecords(tempDir);
    expect(records).toHaveLength(2);
    // journal event is earlier, should come first
    expect(records[0].actor).toBe('sys');
    expect(records[1].actor).toBe('gov');
  });

  it('returns empty array for empty run directory', () => {
    const emptyDir = join(tempDir, 'empty');
    mkdirSync(emptyDir);
    expect(collectAuditRecords(emptyDir)).toEqual([]);
  });
});

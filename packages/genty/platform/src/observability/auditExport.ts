/**
 * Audit Export (GAP-OBS-007).
 *
 * Collects governance decisions and journal events from a run directory
 * and exports them as structured audit logs in JSON, CSV, or Markdown.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditRecord {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  outcome: string;
  metadata?: Record<string, unknown>;
}

export type AuditExportFormat = 'json' | 'csv' | 'markdown';

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Serialize audit records to the requested format.
 */
export function exportAuditLog(
  records: AuditRecord[],
  format: AuditExportFormat,
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(records, null, 2);
    case 'csv':
      return exportCsv(records);
    case 'markdown':
      return exportMarkdown(records);
  }
}

// ---------------------------------------------------------------------------
// Collect
// ---------------------------------------------------------------------------

/**
 * Read governance-decisions.jsonl and journal.jsonl from a run directory
 * and return them as AuditRecord[].
 */
export function collectAuditRecords(runDir: string): AuditRecord[] {
  const records: AuditRecord[] = [];

  // governance-decisions.jsonl
  const govPath = join(runDir, 'governance-decisions.jsonl');
  if (existsSync(govPath)) {
    const lines = readFileSync(govPath, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      records.push({
        timestamp: String(parsed.timestamp ?? new Date().toISOString()),
        actor: String(parsed.actor ?? 'governance'),
        action: String(parsed.action ?? parsed.type ?? 'decision'),
        resource: String(parsed.resource ?? parsed.target ?? ''),
        outcome: String(parsed.outcome ?? parsed.result ?? ''),
        metadata: typeof parsed.metadata === 'object' && parsed.metadata != null
          ? parsed.metadata as Record<string, unknown>
          : undefined,
      });
    }
  }

  // journal.jsonl
  const journalPath = join(runDir, 'journal.jsonl');
  if (existsSync(journalPath)) {
    const lines = readFileSync(journalPath, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      records.push({
        timestamp: String(parsed.timestamp ?? parsed.ts ?? new Date().toISOString()),
        actor: String(parsed.actor ?? parsed.agent ?? 'system'),
        action: String(parsed.action ?? parsed.event ?? parsed.type ?? 'journal'),
        resource: String(parsed.resource ?? parsed.taskId ?? ''),
        outcome: String(parsed.outcome ?? parsed.status ?? ''),
        metadata: typeof parsed.metadata === 'object' && parsed.metadata != null
          ? parsed.metadata as Record<string, unknown>
          : undefined,
      });
    }
  }

  // Sort chronologically
  records.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return records;
}

// ---------------------------------------------------------------------------
// Internal formatters
// ---------------------------------------------------------------------------

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportCsv(records: AuditRecord[]): string {
  const header = 'timestamp,actor,action,resource,outcome,metadata';
  const rows = records.map((r) =>
    [
      escapeCsvField(r.timestamp),
      escapeCsvField(r.actor),
      escapeCsvField(r.action),
      escapeCsvField(r.resource),
      escapeCsvField(r.outcome),
      escapeCsvField(r.metadata ? JSON.stringify(r.metadata) : ''),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

function exportMarkdown(records: AuditRecord[]): string {
  const lines: string[] = [
    '| Timestamp | Actor | Action | Resource | Outcome |',
    '|-----------|-------|--------|----------|---------|',
  ];
  for (const r of records) {
    lines.push(`| ${r.timestamp} | ${r.actor} | ${r.action} | ${r.resource} | ${r.outcome} |`);
  }
  return lines.join('\n');
}

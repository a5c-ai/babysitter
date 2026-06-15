/**
 * Failure triage view — read failed effects from a run directory,
 * classify their severity, and produce a structured triage report
 * with suggested remediation actions (GAP-UX-009).
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FailureSeverity = 'fatal' | 'recoverable' | 'warning';

export interface FailureEntry {
  effectId: string;
  kind: string;
  error: string;
  timestamp: string;
  severity: FailureSeverity;
}

export interface TriageReport {
  failures: FailureEntry[];
  summary: string;
  suggestedActions: string[];
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

const FATAL_PATTERNS = [
  /ENOSPC/i,
  /out of memory/i,
  /segmentation fault/i,
  /permission denied/i,
  /EACCES/i,
];

const WARNING_PATTERNS = [
  /timeout/i,
  /rate limit/i,
  /retry/i,
  /transient/i,
];

function classifySeverity(error: string): FailureSeverity {
  for (const pattern of FATAL_PATTERNS) {
    if (pattern.test(error)) return 'fatal';
  }
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(error)) return 'warning';
  }
  return 'recoverable';
}

// ---------------------------------------------------------------------------
// Triage builder
// ---------------------------------------------------------------------------

/**
 * Read failed effects from a run's journal and classify them into
 * a triage report.
 */
export async function triageFailures(runDir: string): Promise<TriageReport> {
  const journalPath = path.join(runDir, 'journal.jsonl');
  let journalLines: string[] = [];
  try {
    const raw = await fs.readFile(journalPath, 'utf-8');
    journalLines = raw.split('\n').filter((l) => l.trim().length > 0);
  } catch {
    return {
      failures: [],
      summary: 'No journal found.',
      suggestedActions: [],
    };
  }

  const failures: FailureEntry[] = [];

  for (const line of journalLines) {
    let evt: { type: string; recordedAt: string; data: Record<string, unknown> };
    try {
      evt = JSON.parse(line);
    } catch {
      continue;
    }

    if (evt.type !== 'EFFECT_FAILED') continue;

    const effectId = typeof evt.data.effectId === 'string' ? evt.data.effectId : 'unknown';
    const kind = typeof evt.data.kind === 'string' ? evt.data.kind : 'unknown';
    const error = typeof evt.data.error === 'string'
      ? evt.data.error
      : typeof evt.data.message === 'string'
        ? evt.data.message
        : 'Unknown error';

    failures.push({
      effectId,
      kind,
      error,
      timestamp: evt.recordedAt,
      severity: classifySeverity(error),
    });
  }

  const fatalCount = failures.filter((f) => f.severity === 'fatal').length;
  const recoverableCount = failures.filter((f) => f.severity === 'recoverable').length;
  const warningCount = failures.filter((f) => f.severity === 'warning').length;

  const summary = failures.length === 0
    ? 'No failures detected.'
    : `${failures.length} failure(s): ${fatalCount} fatal, ${recoverableCount} recoverable, ${warningCount} warning.`;

  const suggestedActions: string[] = [];
  if (fatalCount > 0) {
    suggestedActions.push('Investigate fatal errors before resuming — these likely require manual intervention.');
  }
  if (recoverableCount > 0) {
    suggestedActions.push('Recoverable errors may succeed on retry. Consider resuming the run.');
  }
  if (warningCount > 0) {
    suggestedActions.push('Warnings (timeout/rate-limit) may resolve with backoff. Check external service status.');
  }

  return { failures, summary, suggestedActions };
}

// ---------------------------------------------------------------------------
// Formatter
// ---------------------------------------------------------------------------

/**
 * Render a triage report as a human-readable text block.
 */
export function formatTriageReport(report: TriageReport): string {
  const lines: string[] = [];
  const divider = '─'.repeat(50);

  lines.push(divider);
  lines.push('  Failure Triage Report');
  lines.push(divider);
  lines.push(`  ${report.summary}`);
  lines.push('');

  if (report.failures.length > 0) {
    for (const f of report.failures) {
      const tag = f.severity === 'fatal' ? 'FATAL' : f.severity === 'warning' ? 'WARN ' : 'RECOV';
      lines.push(`  [${tag}] ${f.effectId} (${f.kind})`);
      lines.push(`         ${f.error}`);
      lines.push(`         at ${f.timestamp}`);
    }
    lines.push('');
  }

  if (report.suggestedActions.length > 0) {
    lines.push('  Suggested Actions:');
    for (const action of report.suggestedActions) {
      lines.push(`    - ${action}`);
    }
  }

  lines.push(divider);
  return lines.join('\n');
}

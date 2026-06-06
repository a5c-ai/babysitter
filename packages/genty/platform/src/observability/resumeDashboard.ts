/**
 * Resume dashboard — build a summary view of a run's progress so
 * operators can quickly see what completed, what's pending, and what
 * failed before deciding to resume (GAP-UX-008).
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepSummary {
  id: string;
  title: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface ResumeDashboardData {
  runId: string;
  status: 'completed' | 'running' | 'failed' | 'paused';
  completedSteps: StepSummary[];
  pendingSteps: StepSummary[];
  failedSteps: StepSummary[];
  totalDuration: number;
  lastActivity: string;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Read run state from disk and build dashboard data.
 *
 * Expects a run directory containing:
 * - metadata.json  (runId, createdAt)
 * - journal.jsonl  (events for timing/status)
 */
export async function buildResumeDashboard(runDir: string): Promise<ResumeDashboardData> {
  // Read metadata
  const metaPath = path.join(runDir, 'metadata.json');
  const metaRaw = await fs.readFile(metaPath, 'utf-8');
  const meta = JSON.parse(metaRaw) as { runId: string; createdAt: string };

  // Read journal
  const journalPath = path.join(runDir, 'journal.jsonl');
  let journalLines: string[] = [];
  try {
    const journalRaw = await fs.readFile(journalPath, 'utf-8');
    journalLines = journalRaw.split('\n').filter((l) => l.trim().length > 0);
  } catch {
    // journal may not exist yet
  }

  const events: Array<{ type: string; recordedAt: string; data: Record<string, unknown> }> = [];
  for (const line of journalLines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }

  // Classify effects into steps
  const requested = new Map<string, { id: string; title: string; requestedAt: string }>();
  const resolved = new Set<string>();
  const failed = new Set<string>();

  for (const evt of events) {
    const effectId = typeof evt.data?.effectId === 'string' ? evt.data.effectId : undefined;
    if (!effectId) continue;

    if (evt.type === 'EFFECT_REQUESTED') {
      requested.set(effectId, {
        id: effectId,
        title: typeof evt.data.title === 'string' ? evt.data.title : effectId,
        requestedAt: evt.recordedAt,
      });
    }
    if (evt.type === 'EFFECT_RESOLVED') {
      resolved.add(effectId);
    }
    if (evt.type === 'EFFECT_FAILED') {
      failed.add(effectId);
    }
  }

  const completedSteps: StepSummary[] = [];
  const pendingSteps: StepSummary[] = [];
  const failedSteps: StepSummary[] = [];

  for (const [effectId, info] of requested) {
    if (failed.has(effectId)) {
      failedSteps.push({ id: info.id, title: info.title, status: 'failed' });
    } else if (resolved.has(effectId)) {
      completedSteps.push({ id: info.id, title: info.title, status: 'completed' });
    } else {
      pendingSteps.push({ id: info.id, title: info.title, status: 'pending' });
    }
  }

  // Derive overall status
  const hasRunCompleted = events.some((e) => e.type === 'RUN_COMPLETED');
  const hasRunFailed = events.some((e) => e.type === 'RUN_FAILED');
  let status: ResumeDashboardData['status'];
  if (hasRunFailed || failedSteps.length > 0) {
    status = 'failed';
  } else if (hasRunCompleted) {
    status = 'completed';
  } else if (pendingSteps.length > 0) {
    status = 'paused';
  } else {
    status = 'running';
  }

  // Timing
  const createdMs = new Date(meta.createdAt).getTime();
  const lastEvent = events[events.length - 1];
  const lastActivity = lastEvent?.recordedAt ?? meta.createdAt;
  const lastMs = new Date(lastActivity).getTime();
  const totalDuration = lastMs - createdMs;

  return {
    runId: meta.runId,
    status,
    completedSteps,
    pendingSteps,
    failedSteps,
    totalDuration,
    lastActivity,
  };
}

// ---------------------------------------------------------------------------
// Formatter
// ---------------------------------------------------------------------------

function formatDurationMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainSec}s`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}h ${remainMin}m`;
}

/**
 * Render dashboard data as a human-readable ASCII text block.
 */
export function formatDashboardText(data: ResumeDashboardData): string {
  const lines: string[] = [];
  const divider = '─'.repeat(50);

  lines.push(divider);
  lines.push(`  Resume Dashboard: ${data.runId}`);
  lines.push(divider);
  lines.push(`  Status:        ${data.status.toUpperCase()}`);
  lines.push(`  Duration:      ${formatDurationMs(data.totalDuration)}`);
  lines.push(`  Last activity: ${data.lastActivity}`);
  lines.push('');

  lines.push(`  Completed (${data.completedSteps.length}):`);
  if (data.completedSteps.length === 0) {
    lines.push('    (none)');
  } else {
    for (const s of data.completedSteps) {
      lines.push(`    [done] ${s.title}`);
    }
  }

  lines.push(`  Pending (${data.pendingSteps.length}):`);
  if (data.pendingSteps.length === 0) {
    lines.push('    (none)');
  } else {
    for (const s of data.pendingSteps) {
      lines.push(`    [ .. ] ${s.title}`);
    }
  }

  lines.push(`  Failed (${data.failedSteps.length}):`);
  if (data.failedSteps.length === 0) {
    lines.push('    (none)');
  } else {
    for (const s of data.failedSteps) {
      lines.push(`    [FAIL] ${s.title}`);
    }
  }

  lines.push(divider);
  return lines.join('\n');
}

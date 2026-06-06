/**
 * Agent Progress Summarization (GAP-OBS-008).
 *
 * Reads run state (journal, task statuses) and produces a compact progress
 * summary with step counts, active agents, estimated completion, and highlights.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressSummary {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  activeAgents: string[];
  estimatedCompletion: number | null;
  highlights: string[];
}

interface JournalEvent {
  event?: string;
  type?: string;
  status?: string;
  agent?: string;
  actor?: string;
  taskId?: string;
  message?: string;
  timestamp?: string | number;
}

// ---------------------------------------------------------------------------
// Summarize
// ---------------------------------------------------------------------------

/**
 * Read a run directory's journal and state to produce a progress summary.
 */
export function summarizeProgress(runDir: string): ProgressSummary {
  const events = loadJournalEvents(runDir);
  const stateData = loadRunState(runDir);

  const taskStatuses = new Map<string, string>();
  const agentSet = new Set<string>();
  const highlights: string[] = [];

  // Process journal events to track task statuses and active agents
  for (const evt of events) {
    const taskId = evt.taskId ?? '';
    const status = evt.status ?? evt.event ?? evt.type ?? '';
    const agent = evt.agent ?? evt.actor ?? '';

    if (taskId) {
      taskStatuses.set(taskId, status);
    }

    if (agent && isActiveStatus(status)) {
      agentSet.add(agent);
    }

    if (agent && isTerminalStatus(status)) {
      agentSet.delete(agent);
    }

    if (evt.message && isHighlightWorthy(status)) {
      highlights.push(evt.message);
    }
  }

  // Also inspect run state for task counts if available
  if (stateData.tasks && Array.isArray(stateData.tasks)) {
    for (const task of stateData.tasks as Array<{ id?: string; status?: string }>) {
      if (task.id && task.status) {
        taskStatuses.set(task.id, task.status);
      }
    }
  }

  let totalSteps = 0;
  let completedSteps = 0;
  let failedSteps = 0;

  for (const status of taskStatuses.values()) {
    totalSteps++;
    if (isCompletedStatus(status)) completedSteps++;
    if (isFailedStatus(status)) failedSteps++;
  }

  const estimatedCompletion = totalSteps > 0
    ? Math.round((completedSteps / totalSteps) * 100)
    : null;

  return {
    totalSteps,
    completedSteps,
    failedSteps,
    activeAgents: Array.from(agentSet),
    estimatedCompletion,
    highlights: highlights.slice(-5), // keep last 5 highlights
  };
}

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

/**
 * Render a progress summary as compact human-readable text.
 */
export function formatProgressText(summary: ProgressSummary): string {
  const lines: string[] = [];

  const pct = summary.estimatedCompletion != null
    ? ` (${summary.estimatedCompletion}%)`
    : '';

  lines.push(`Progress: ${summary.completedSteps}/${summary.totalSteps} steps completed${pct}`);

  if (summary.failedSteps > 0) {
    lines.push(`Failed: ${summary.failedSteps} steps`);
  }

  if (summary.activeAgents.length > 0) {
    lines.push(`Active agents: ${summary.activeAgents.join(', ')}`);
  }

  if (summary.highlights.length > 0) {
    lines.push('Highlights:');
    for (const h of summary.highlights) {
      lines.push(`  - ${h}`);
    }
  }

  return lines.join('\n');
}

/**
 * Render a progress summary as structured JSON string.
 */
export function formatProgressJson(summary: ProgressSummary): string {
  return JSON.stringify(summary, null, 2);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadJournalEvents(runDir: string): JournalEvent[] {
  const journalPath = join(runDir, 'journal.jsonl');
  if (!existsSync(journalPath)) return [];

  const raw = readFileSync(journalPath, 'utf8').trim();
  if (!raw) return [];

  return raw.split('\n').map((line) => JSON.parse(line) as JournalEvent);
}

function loadRunState(runDir: string): Record<string, unknown> {
  const statePath = join(runDir, 'state.json');
  if (!existsSync(statePath)) return {};

  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return {};
  }
}

function isActiveStatus(status: string): boolean {
  return ['running', 'in-progress', 'active', 'task-started'].includes(status);
}

function isTerminalStatus(status: string): boolean {
  return ['completed', 'done', 'failed', 'error', 'task-completed', 'task-failed'].includes(status);
}

function isCompletedStatus(status: string): boolean {
  return ['completed', 'done', 'passed', 'task-completed'].includes(status);
}

function isFailedStatus(status: string): boolean {
  return ['failed', 'error', 'task-failed'].includes(status);
}

function isHighlightWorthy(status: string): boolean {
  return ['completed', 'done', 'failed', 'error', 'milestone', 'task-completed', 'task-failed'].includes(status);
}

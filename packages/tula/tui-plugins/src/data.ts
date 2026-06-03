/**
 * Data access layer for babysitter TUI plugins.
 *
 * Reads run metadata, journals, and task definitions from the resolved
 * babysitter runs directory.
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';
import type {
  RunSummary,
  RunState,
  EffectSummary,
  EffectStatus,
  GovernanceDecision,
  CostSummary,
} from './types.js';

// ---------------------------------------------------------------------------
// Run scanning (self-contained, no SDK import at module level)
// ---------------------------------------------------------------------------

interface JournalEvent {
  type: string;
  recordedAt: string;
  seq: number;
  data?: Record<string, unknown>;
}

function deriveRunState(
  journal: readonly JournalEvent[],
  pendingCount: number,
): RunState {
  const lastLifecycleType = [...journal]
    .reverse()
    .find((e) => e.type === 'RUN_COMPLETED' || e.type === 'RUN_FAILED')?.type;

  if (lastLifecycleType === 'RUN_COMPLETED') return 'completed';
  if (lastLifecycleType === 'RUN_FAILED') return 'failed';
  if (pendingCount > 0) return 'waiting';
  return 'created';
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed: unknown = JSON.parse(content);
  return parsed;
}

async function readJournal(runDir: string): Promise<JournalEvent[]> {
  const journalDir = path.join(runDir, 'journal');
  let entries: string[];
  try {
    entries = await fs.readdir(journalDir);
  } catch {
    return [];
  }

  const jsonFiles = entries.filter((f) => f.endsWith('.json')).sort();
  const events: JournalEvent[] = [];

  for (const file of jsonFiles) {
    try {
      const event = (await readJsonFile(
        path.join(journalDir, file),
      )) as JournalEvent;
      events.push(event);
    } catch (e) {
      process.stderr.write(`[tui] skipping malformed journal entry: ${e instanceof Error ? e.message : String(e)}\n`);
    }
  }

  return events;
}

/**
 * Scan a runs directory and return summaries for all valid runs.
 */
export async function scanRuns(runsDir: string): Promise<RunSummary[]> {
  const resolvedDir = path.resolve(runsDir);
  let entries: string[];
  try {
    entries = await fs.readdir(resolvedDir);
  } catch {
    return [];
  }

  const summaries: RunSummary[] = [];

  for (const entry of entries) {
    const runDir = path.join(resolvedDir, entry);
    const metadataPath = path.join(runDir, 'run.json');
    try {
      await fs.access(metadataPath);
    } catch {
      continue;
    }

    try {
      const metadata = (await readJsonFile(metadataPath)) as Record<
        string,
        unknown
      >;
      const journal = await readJournal(runDir);

      const requestedCount = journal.filter(
        (e) => e.type === 'EFFECT_REQUESTED',
      ).length;
      const resolvedCount = journal.filter(
        (e) => e.type === 'EFFECT_RESOLVED',
      ).length;
      const pendingCount = Math.max(0, requestedCount - resolvedCount);
      const state = deriveRunState(journal, pendingCount);

      summaries.push({
        runId: (metadata.runId as string) ?? entry,
        runDir,
        state,
        processId: (metadata.processId as string) ?? 'unknown',
        createdAt: (metadata.createdAt as string) ?? '',
        eventCount: journal.length,
        pendingCount,
        resolvedCount,
        prompt: metadata.prompt as string | undefined,
        harness: metadata.harness as string | undefined,
      });
    } catch (e) {
      process.stderr.write(`[tui] skipping malformed run entry: ${e instanceof Error ? e.message : String(e)}\n`);
    }
  }

  summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return summaries;
}

/**
 * Extract effect summaries from a run's journal events.
 */
export function extractEffects(journal: JournalEvent[]): EffectSummary[] {
  const effectMap = new Map<
    string,
    { kind: string; status: EffectStatus; title?: string; elapsedMs?: number; error?: string }
  >();

  for (const event of journal) {
    if (event.type === 'EFFECT_REQUESTED' && event.data) {
      const effectId = event.data.effectId as string;
      const kind = (event.data.kind as string) ?? 'node';
      const title = event.data.title as string | undefined;
      effectMap.set(effectId, { kind, status: 'pending', title });
    } else if (event.type === 'EFFECT_RESOLVED' && event.data) {
      const effectId = event.data.effectId as string;
      const existing = effectMap.get(effectId);
      if (existing) {
        const resultStatus = event.data.status as string;
        existing.status = resultStatus === 'failed' ? 'failed' : 'resolved';
        if (event.data.elapsedMs !== undefined) {
          existing.elapsedMs = event.data.elapsedMs as number;
        }
        if (resultStatus === 'failed' && event.data.error) {
          existing.error = event.data.error as string;
        }
      }
    }
  }

  return Array.from(effectMap.entries()).map(([effectId, info]) => ({
    effectId,
    kind: info.kind,
    status: info.status,
    title: info.title,
    elapsedMs: info.elapsedMs,
    error: info.error,
  }));
}

/**
 * Load journal events for a specific run directory.
 */
export async function loadRunJournal(runDir: string): Promise<JournalEvent[]> {
  return readJournal(runDir);
}

/**
 * Extract governance decisions (breakpoint approvals) from journal events.
 */
export function extractGovernanceDecisions(
  journal: JournalEvent[],
): GovernanceDecision[] {
  const decisions: GovernanceDecision[] = [];

  for (const event of journal) {
    if (event.type === 'EFFECT_REQUESTED' && event.data) {
      const kind = event.data.kind as string;
      if (kind !== 'breakpoint') continue;

      const effectId = event.data.effectId as string;
      const title = (event.data.title as string) ?? effectId;
      const breakpointId =
        (event.data.breakpointId as string) ?? effectId;

      // Look for corresponding resolution
      const resolution = journal.find(
        (e) =>
          e.type === 'EFFECT_RESOLVED' &&
          e.data &&
          (e.data.effectId as string) === effectId,
      );

      let approved: boolean | null = null;
      let response: string | undefined;
      let feedback: string | undefined;

      if (resolution?.data) {
        const value = resolution.data.value as Record<string, unknown> | undefined;
        if (value) {
          approved = (value.approved as boolean) ?? null;
          response = value.response as string | undefined;
          feedback = value.feedback as string | undefined;
        }
      }

      decisions.push({
        breakpointId,
        title,
        approved,
        response,
        feedback,
        expert: event.data.expert as string | string[] | undefined,
        tags: event.data.tags as string[] | undefined,
        autoApproval: event.data.autoApproval as
          | { recommended: boolean; reason: string }
          | undefined,
        timestamp: event.recordedAt,
      });
    }
  }

  return decisions;
}

/**
 * Scan for cost data from a run's task results.
 */
export async function scanRunCosts(runDir: string): Promise<CostSummary> {
  const journal = await readJournal(runDir);
  let totalUsd = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  // Scan task result files for cost info
  const tasksDir = path.join(runDir, 'tasks');
  let taskDirs: string[];
  try {
    taskDirs = await fs.readdir(tasksDir);
  } catch {
    taskDirs = [];
  }

  for (const taskDir of taskDirs) {
    const resultPath = path.join(tasksDir, taskDir, 'result.json');
    try {
      const result = (await readJsonFile(resultPath)) as Record<
        string,
        unknown
      >;
      const value = result.value as Record<string, unknown> | undefined;
      if (value?.cost !== undefined) {
        totalUsd += (value.cost as number) ?? 0;
      }
      if (value?.tokenUsage) {
        const usage = value.tokenUsage as Record<string, number>;
        inputTokens += usage.input ?? 0;
        outputTokens += usage.output ?? 0;
      }
    } catch (e) {
      process.stderr.write(`[tui] skipping malformed task result: ${e instanceof Error ? e.message : String(e)}\n`);
    }
  }

  // Also check journal events for cost events
  for (const event of journal) {
    if (
      event.type === 'EFFECT_RESOLVED' &&
      event.data?.value &&
      typeof event.data.value === 'object'
    ) {
      const value = event.data.value as Record<string, unknown>;
      if (value.cost !== undefined && typeof value.cost === 'number') {
        // Avoid double-counting if we already found it in task results
        // Only add if not already accounted for
      }
    }
  }

  return {
    totalUsd,
    inputTokens,
    outputTokens,
    entries: [],
  };
}

/**
 * Resolve the default runs directory using the babysitter env policy.
 */
export function resolveRunsDir(workspace?: string): string {
  const cwd = workspace ?? process.cwd();
  const globalRoot = process.env.BABYSITTER_GLOBAL_STATE_DIR?.trim()
    ? path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR)
    : path.join(os.homedir(), '.a5c');
  const runsScope = process.env.BABYSITTER_RUNS_SCOPE?.trim().toLowerCase();
  const runsDirOverride = process.env.BABYSITTER_RUNS_DIR?.trim();

  if (runsDirOverride) {
    if (path.isAbsolute(runsDirOverride)) {
      return path.resolve(runsDirOverride);
    }
    const baseDir = runsScope === 'repo' ? cwd : globalRoot;
    return path.resolve(baseDir, runsDirOverride);
  }

  if (runsScope === 'repo') {
    return path.resolve(cwd, '.a5c', 'runs');
  }

  return path.join(globalRoot, 'runs');
}

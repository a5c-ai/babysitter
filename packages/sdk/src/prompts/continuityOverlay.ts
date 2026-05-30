/**
 * GAP-PROMPT-005: Continuity Overlays for Resume
 *
 * Extracts rich context from the run journal, task artifacts, and session history
 * to render a structured resume context section for prompt injection.
 *
 * @module prompts/continuityOverlay
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PromptContext, ContinuityContext, ContinuityEffectSummary } from './types';

/**
 * Options for building a continuity context from a run.
 */
export interface BuildContinuityContextOptions {
  /** Path to the run directory */
  runDir: string;
  /** State directory for session data */
  stateDir: string;
  /** Session ID for history lookup */
  sessionId: string;
  /** Runs directory (optional, for multi-run resolution) */
  runsDir?: string;
  /** Maximum number of recent decisions to include (default: 5) */
  maxDecisions?: number;
}

/**
 * Build a ContinuityContext by reading the run journal, task definitions,
 * and session history. Handles missing or corrupt data gracefully.
 */
export async function buildContinuityContext(
  options: BuildContinuityContextOptions,
): Promise<ContinuityContext> {
  const maxDecisions = options.maxDecisions ?? 5;

  const events = await loadJournalEvents(options.runDir);
  const { resolvedEffects, pendingEffects, stateTransitions } = categorizeEvents(events);
  const modifiedFiles = await collectModifiedFiles(options.runDir, events);
  const iteration = deriveIterationCount(events);
  const decisions = await readDecisions(options.stateDir, options.sessionId, maxDecisions);

  const resolvedCount = resolvedEffects.length;
  const pendingCount = pendingEffects.length;
  const totalCount = resolvedCount + pendingCount;
  const progressText = totalCount > 0
    ? `${resolvedCount}/${totalCount} effects resolved (iteration ${iteration})`
    : `No effects yet (iteration ${iteration})`;

  return {
    resolvedEffects,
    pendingEffects,
    stateTransitions,
    modifiedFiles,
    decisions,
    iteration,
    progressText,
  };
}

/**
 * Render a continuity overlay section for inclusion in resumed prompts.
 * Returns empty string when no continuity context is present.
 */
export function renderContinuityOverlay(ctx: PromptContext): string {
  if (!ctx.continuityContext) return '';

  const cc = ctx.continuityContext;
  const sections: string[] = [];

  sections.push('## Resume Context');
  sections.push('');
  sections.push(`**Progress:** ${cc.progressText}`);

  if (cc.decisions.length > 0) {
    sections.push('');
    sections.push('### Recent Decisions');
    for (const d of cc.decisions) {
      sections.push(`- ${d.description} (${d.timestamp})`);
    }
  }

  if (cc.pendingEffects.length > 0) {
    sections.push('');
    sections.push('### Pending Effects');
    for (const e of cc.pendingEffects) {
      sections.push(`- **${e.title}** (${e.kind}) — ${e.effectId}`);
    }
  }

  if (cc.resolvedEffects.length > 0) {
    sections.push('');
    sections.push(`### Resolved Effects (${cc.resolvedEffects.length})`);
    for (const e of cc.resolvedEffects) {
      sections.push(`- ${e.title} (${e.kind})`);
    }
  }

  if (cc.modifiedFiles.length > 0) {
    sections.push('');
    sections.push('### Modified Files');
    for (const f of cc.modifiedFiles) {
      sections.push(`- \`${f}\``);
    }
  }

  return sections.join('\n');
}

// ── Internal helpers ────────────────────────────────────────────────────

interface JournalEvent {
  type: string;
  recordedAt: string;
  data?: Record<string, unknown>;
}

/**
 * Load journal events from the run directory.
 * Returns empty array if journal directory doesn't exist.
 */
async function loadJournalEvents(runDir: string): Promise<JournalEvent[]> {
  const journalDir = path.join(runDir, 'journal');
  try {
    const files = await fs.readdir(journalDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort();
    const events: JournalEvent[] = [];
    for (const file of jsonFiles) {
      try {
        const raw = await fs.readFile(path.join(journalDir, file), 'utf-8');
        events.push(JSON.parse(raw) as JournalEvent);
      } catch {
        // Skip corrupt journal entries
      }
    }
    return events;
  } catch {
    return [];
  }
}

/**
 * Categorize journal events into resolved effects, pending effects, and state transitions.
 */
function categorizeEvents(events: JournalEvent[]): {
  resolvedEffects: ContinuityEffectSummary[];
  pendingEffects: ContinuityEffectSummary[];
  stateTransitions: Array<{ event: string; recordedAt: string }>;
} {
  const resolvedIds = new Set<string>();
  const requestedEffects = new Map<string, ContinuityEffectSummary>();
  const stateTransitions: Array<{ event: string; recordedAt: string }> = [];

  for (const event of events) {
    if (event.type === 'EFFECT_RESOLVED') {
      const effectId = (event.data as Record<string, unknown>)?.effectId as string | undefined;
      if (effectId) resolvedIds.add(effectId);
    } else if (event.type === 'EFFECT_REQUESTED') {
      const data = event.data;
      const effectId = data?.effectId as string | undefined;
      const kind = (data?.kind as string) ?? 'unknown';
      const title = (data?.title as string) ?? (data?.taskId as string) ?? 'untitled';
      if (effectId) {
        requestedEffects.set(effectId, { effectId, kind, title, status: 'pending' });
      }
    } else if (['RUN_CREATED', 'RUN_COMPLETED', 'RUN_HALTED', 'RUN_FAILED'].includes(event.type)) {
      stateTransitions.push({ event: event.type, recordedAt: event.recordedAt });
    }
  }

  const resolvedEffects: ContinuityEffectSummary[] = [];
  const pendingEffects: ContinuityEffectSummary[] = [];

  for (const [effectId, summary] of requestedEffects) {
    if (resolvedIds.has(effectId)) {
      resolvedEffects.push({ ...summary, status: 'resolved' });
    } else {
      pendingEffects.push(summary);
    }
  }

  return { resolvedEffects, pendingEffects, stateTransitions };
}

/**
 * Collect modified file paths from task definitions.
 */
async function collectModifiedFiles(runDir: string, events: JournalEvent[]): Promise<string[]> {
  const files = new Set<string>();
  const effectIds = new Set<string>();

  for (const event of events) {
    if (event.type === 'EFFECT_RESOLVED') {
      const effectId = (event.data as Record<string, unknown>)?.effectId as string | undefined;
      if (effectId) effectIds.add(effectId);
    }
  }

  for (const effectId of effectIds) {
    try {
      const taskDefPath = path.join(runDir, 'tasks', effectId, 'task.json');
      const raw = await fs.readFile(taskDefPath, 'utf-8');
      const taskDef = JSON.parse(raw) as Record<string, unknown>;
      const args = taskDef.args as Record<string, unknown> | undefined;
      if (args?.files && Array.isArray(args.files)) {
        for (const f of args.files) {
          if (typeof f === 'string') files.add(f);
        }
      }
      if (args?.path && typeof args.path === 'string') {
        files.add(args.path);
      }
    } catch {
      // Skip unreadable task definitions
    }
  }

  return [...files].sort();
}

/**
 * Derive the iteration count from journal events.
 * Counts the number of EFFECT_RESOLVED events as a proxy for completed iterations.
 */
function deriveIterationCount(events: JournalEvent[]): number {
  return events.filter(e => e.type === 'EFFECT_RESOLVED').length;
}

/**
 * Read recent decisions from session history.
 */
async function readDecisions(
  stateDir: string,
  sessionId: string,
  maxDecisions: number,
): Promise<Array<{ description: string; timestamp: string }>> {
  try {
    const sessionDir = path.join(stateDir, 'sessions');
    const historyPath = path.join(sessionDir, `${sessionId}.history.json`);
    const raw = await fs.readFile(historyPath, 'utf-8');
    const history = JSON.parse(raw) as Record<string, unknown>;
    const decisions = history.decisions as Array<{ description: string; timestamp: string }> | undefined;
    if (Array.isArray(decisions)) {
      return decisions.slice(-maxDecisions);
    }
  } catch {
    // Missing or corrupt history is non-fatal
  }
  return [];
}

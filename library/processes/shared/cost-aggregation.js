/**
 * @module cost-aggregation
 * @description Composable process component that aggregates cost-proxy metrics
 * across related runs for "Cumulative Effort" reporting in retrospect processes.
 *
 * Rather than tracking actual monetary cost (which, like happiness, is largely
 * unknowable), this module counts journal events and tasks as proxies for the
 * computational effort expended across a set of related runs.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { promises as fs } from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads and parses a JSON file, returning null on any error.
 *
 * @param {string} filePath - Absolute or relative path to the JSON file
 * @returns {Promise<object|null>} Parsed JSON object or null if unreadable/corrupt
 */
async function readJsonSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Returns true when the given processId matches any of the provided patterns
 * (case-insensitive substring match) or any entry in relatedProcessIds (exact match).
 *
 * @param {string} processId - The processId from a run's run.json
 * @param {string[]} patterns - Substring patterns to test against processId
 * @param {string[]} [relatedProcessIds] - Exact processIds to also include
 * @returns {boolean}
 */
function isMatch(processId, patterns = [], relatedProcessIds = []) {
  if (!processId) return false;

  const lower = processId.toLowerCase();

  for (const pattern of patterns) {
    if (lower.includes(pattern.toLowerCase())) return true;
  }

  for (const exact of relatedProcessIds) {
    if (processId === exact) return true;
  }

  return false;
}

/**
 * Applies an optional time range filter against a createdAt ISO timestamp string.
 *
 * @param {string|null} createdAt - ISO 8601 timestamp from run.json
 * @param {{ from?: string, to?: string }} [timeRange] - Optional bounds (inclusive)
 * @returns {boolean} true if the timestamp falls within the range (or no range is set)
 */
function isInTimeRange(createdAt, timeRange) {
  if (!timeRange) return true;
  if (!createdAt) return true; // No timestamp — include by default

  const { from, to } = timeRange;
  if (from && createdAt < from) return false;
  if (to && createdAt > to) return false;
  return true;
}

/**
 * Derives the status of a run from the last journal event's type field.
 *
 * @param {string} runDir - Path to the run directory
 * @returns {Promise<'RUN_COMPLETED'|'RUN_FAILED'|'in-progress'>}
 */
async function resolveRunStatus(runDir) {
  try {
    const journalDir = path.join(runDir, 'journal');
    const entries = await fs.readdir(journalDir);
    const jsonEntries = entries.filter(e => e.endsWith('.json')).sort();
    if (jsonEntries.length === 0) return 'in-progress';

    const lastEvent = await readJsonSafe(path.join(journalDir, jsonEntries[jsonEntries.length - 1]));
    if (!lastEvent) return 'in-progress';

    if (lastEvent.type === 'RUN_COMPLETED') return 'RUN_COMPLETED';
    if (lastEvent.type === 'RUN_FAILED') return 'RUN_FAILED';
    return 'in-progress';
  } catch {
    return 'in-progress';
  }
}

/**
 * Counts journal events in a run's journal directory, also counting how many
 * are EFFECT_REQUESTED (used as a task proxy) and capturing first/last timestamps
 * for duration calculation.
 *
 * @param {string} runDir - Path to the run directory
 * @returns {Promise<{ totalEvents: number, taskCount: number, durationMs: number|null }>}
 */
async function analyzeJournal(runDir) {
  const result = { totalEvents: 0, taskCount: 0, durationMs: null };

  let journalEntries;
  try {
    const journalDir = path.join(runDir, 'journal');
    journalEntries = (await fs.readdir(journalDir))
      .filter(e => e.endsWith('.json'))
      .sort();
  } catch {
    return result;
  }

  result.totalEvents = journalEntries.length;

  if (journalEntries.length === 0) return result;

  const journalDir = path.join(runDir, 'journal');

  // Read first and last events for timestamps; scan all for EFFECT_REQUESTED counts.
  let firstTimestamp = null;
  let lastTimestamp = null;

  for (let i = 0; i < journalEntries.length; i++) {
    const event = await readJsonSafe(path.join(journalDir, journalEntries[i]));
    if (!event) continue;

    if (event.type === 'EFFECT_REQUESTED') {
      result.taskCount += 1;
    }

    const ts = event.recordedAt ?? null;
    if (ts) {
      if (i === 0) firstTimestamp = ts;
      lastTimestamp = ts;
    }
  }

  if (firstTimestamp && lastTimestamp && firstTimestamp !== lastTimestamp) {
    result.durationMs = new Date(lastTimestamp).getTime() - new Date(firstTimestamp).getTime();
  }

  return result;
}

/**
 * Extracts the calendar date (YYYY-MM-DD) from an ISO 8601 timestamp string.
 *
 * @param {string|null} isoTimestamp
 * @returns {string|null}
 */
function toCalendarDate(isoTimestamp) {
  if (!isoTimestamp) return null;
  try {
    return new Date(isoTimestamp).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} RunSummary
 * @property {string} runId - The run identifier
 * @property {string|null} processId - The process identifier from run.json
 * @property {string|null} createdAt - ISO 8601 creation timestamp
 * @property {'RUN_COMPLETED'|'RUN_FAILED'|'in-progress'} status - Derived run status
 * @property {number} journalEventCount - Total journal files in journal/ directory
 * @property {number} taskCount - Number of EFFECT_REQUESTED events (task proxy)
 * @property {number|null} durationMs - Elapsed time between first and last journal events
 */

/**
 * @typedef {object} AggregatedCosts
 * @property {number} totalRuns - Number of matched runs
 * @property {number} totalTasks - Sum of EFFECT_REQUESTED events across all runs
 * @property {number} totalJournalEvents - Sum of all journal events across all runs
 * @property {number} calendarDays - Distinct calendar dates on which runs were created
 * @property {number} averageTasksPerRun - totalTasks / totalRuns (0 if no runs)
 * @property {number} averageEventsPerRun - totalJournalEvents / totalRuns (0 if no runs)
 * @property {RunSummary[]} runSummaries - Per-run detail, sorted by createdAt descending
 */

/**
 * Aggregates cost-proxy metrics across related runs for cumulative effort reporting.
 *
 * Scans `runsDir` for runs whose processId matches any of the supplied patterns or
 * exact IDs, optionally filtered by a creation time range. For each matched run the
 * function reads the journal directory to count events and EFFECT_REQUESTED entries
 * (used as a lightweight proxy for "tasks performed"). Aggregated totals and per-run
 * summaries are returned together.
 *
 * @param {object} opts
 * @param {string} [opts.runsDir='.a5c/runs']
 *   Path to the runs root directory.
 * @param {string[]} [opts.processIdPatterns=[]]
 *   Substring patterns matched case-insensitively against each run's processId.
 * @param {string[]} [opts.relatedProcessIds=[]]
 *   Additional exact processIds to include regardless of pattern matching.
 * @param {{ from?: string, to?: string }} [opts.timeRange]
 *   Optional ISO 8601 bounds (both inclusive) applied to each run's createdAt.
 *
 * @returns {Promise<AggregatedCosts>}
 */
export async function aggregateCosts({
  runsDir = '.a5c/runs',
  processIdPatterns = [],
  relatedProcessIds = [],
  timeRange
} = {}) {
  // Attempt to list the runs directory; return zeroed result if it doesn't exist.
  let dirEntries;
  try {
    dirEntries = await fs.readdir(runsDir);
  } catch {
    return {
      totalRuns: 0,
      totalTasks: 0,
      totalJournalEvents: 0,
      calendarDays: 0,
      averageTasksPerRun: 0,
      averageEventsPerRun: 0,
      runSummaries: []
    };
  }

  /** @type {RunSummary[]} */
  const runSummaries = [];

  for (const entry of dirEntries) {
    const runDir = path.join(runsDir, entry);

    // Skip non-directories quietly.
    let stat;
    try {
      stat = await fs.stat(runDir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    // Read run metadata.
    const runJson = await readJsonSafe(path.join(runDir, 'run.json'));
    if (!runJson) continue;

    const { runId, processId, createdAt } = runJson;

    // Apply processId filters.
    if (!isMatch(processId, processIdPatterns, relatedProcessIds)) continue;

    // Apply time range filter.
    if (!isInTimeRange(createdAt ?? null, timeRange)) continue;

    // Analyse the journal for this run.
    const { totalEvents, taskCount, durationMs } = await analyzeJournal(runDir);

    // Determine status from last journal event.
    const status = await resolveRunStatus(runDir);

    runSummaries.push({
      runId: runId ?? entry,
      processId: processId ?? null,
      createdAt: createdAt ?? null,
      status,
      journalEventCount: totalEvents,
      taskCount,
      durationMs
    });
  }

  // Sort descending by createdAt; runs with no timestamp sink to the bottom.
  runSummaries.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  // Aggregate totals.
  const totalRuns = runSummaries.length;
  const totalTasks = runSummaries.reduce((sum, r) => sum + r.taskCount, 0);
  const totalJournalEvents = runSummaries.reduce((sum, r) => sum + r.journalEventCount, 0);

  // Count distinct calendar days from createdAt timestamps.
  const distinctDates = new Set(
    runSummaries.map(r => toCalendarDate(r.createdAt)).filter(Boolean)
  );
  const calendarDays = distinctDates.size;

  const averageTasksPerRun = totalRuns > 0
    ? Math.round((totalTasks / totalRuns) * 100) / 100
    : 0;

  const averageEventsPerRun = totalRuns > 0
    ? Math.round((totalJournalEvents / totalRuns) * 100) / 100
    : 0;

  return {
    totalRuns,
    totalTasks,
    totalJournalEvents,
    calendarDays,
    averageTasksPerRun,
    averageEventsPerRun,
    runSummaries
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// defineTask wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Babysitter task definition for the cost-aggregation component.
 *
 * Use this when you want the aggregation to happen as an orchestrated agent task
 * (e.g. as part of a harness-driven retrospect run). For direct programmatic use,
 * prefer the exported `aggregateCosts` function.
 *
 * Task inputs (passed as `args`):
 * - `runsDir` {string}              — path to the runs root directory (default '.a5c/runs')
 * - `processIdPatterns` {string[]}  — substring patterns to match processIds
 * - `relatedProcessIds` {string[]}  — additional exact-match processIds
 * - `timeRange` {{ from?: string, to?: string }} — optional ISO 8601 date bounds
 *
 * Task output (written to the io outputJsonPath):
 * - `totalRuns` {number}
 * - `totalTasks` {number}
 * - `totalJournalEvents` {number}
 * - `calendarDays` {number}
 * - `averageTasksPerRun` {number}
 * - `averageEventsPerRun` {number}
 * - `runSummaries` {RunSummary[]}
 */
export const costAggregationTask = defineTask('cost-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate cost-proxy metrics across related runs',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Run-history cost analyst computing cumulative effort metrics',
      task: `Use the aggregateCosts utility to scan the runs directory and return aggregated cost-proxy metrics.

Inputs provided:
- runsDir: ${JSON.stringify(args.runsDir ?? '.a5c/runs')}
- processIdPatterns: ${JSON.stringify(args.processIdPatterns ?? [])}
- relatedProcessIds: ${JSON.stringify(args.relatedProcessIds ?? [])}
- timeRange: ${JSON.stringify(args.timeRange ?? null)}

Steps:
1. List all directories inside runsDir. If the directory does not exist, return zeroed aggregates.
2. For each directory, read run.json and extract: runId, processId, createdAt.
3. Skip runs whose processId does not match any processIdPatterns (case-insensitive substring)
   and is not listed in relatedProcessIds (exact match).
4. If timeRange is provided, skip runs whose createdAt falls outside the [from, to] bounds.
5. For each kept run:
   a. List files in the journal/ subdirectory and count them (= journalEventCount).
   b. Read each journal file and count events with type === "EFFECT_REQUESTED" (= taskCount).
   c. Record timestamps from the first and last journal events to compute durationMs.
   d. Determine status from the last journal event type: RUN_COMPLETED, RUN_FAILED, or in-progress.
6. Sort matched runs by createdAt descending (newest first).
7. Compute aggregates: totalRuns, totalTasks, totalJournalEvents, calendarDays (distinct YYYY-MM-DD
   dates from createdAt values), averageTasksPerRun, averageEventsPerRun.

Output JSON (write to the task output path):
{
  "totalRuns": <number>,
  "totalTasks": <number>,
  "totalJournalEvents": <number>,
  "calendarDays": <number>,
  "averageTasksPerRun": <number>,
  "averageEventsPerRun": <number>,
  "runSummaries": [
    {
      "runId": <string>,
      "processId": <string|null>,
      "createdAt": <string|null>,
      "status": <"RUN_COMPLETED"|"RUN_FAILED"|"in-progress">,
      "journalEventCount": <number>,
      "taskCount": <number>,
      "durationMs": <number|null>
    }
  ]
}`,
      context: {
        runsDir: args.runsDir,
        processIdPatterns: args.processIdPatterns,
        relatedProcessIds: args.relatedProcessIds,
        timeRange: args.timeRange
      },
      instructions: [
        'Handle a missing or unreadable runsDir by returning zeroed aggregates with an empty runSummaries array',
        'Handle corrupt or missing run.json files gracefully — skip those directories',
        'Handle missing or unreadable journal files gracefully — count what is readable',
        'averageTasksPerRun and averageEventsPerRun should be rounded to 2 decimal places',
        'Output must be valid JSON matching the schema above'
      ],
      outputFormat: 'JSON matching the AggregatedCosts schema'
    },
    outputSchema: {
      type: 'object',
      required: [
        'totalRuns',
        'totalTasks',
        'totalJournalEvents',
        'calendarDays',
        'averageTasksPerRun',
        'averageEventsPerRun',
        'runSummaries'
      ],
      properties: {
        totalRuns: { type: 'number' },
        totalTasks: { type: 'number' },
        totalJournalEvents: { type: 'number' },
        calendarDays: { type: 'number' },
        averageTasksPerRun: { type: 'number' },
        averageEventsPerRun: { type: 'number' },
        runSummaries: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

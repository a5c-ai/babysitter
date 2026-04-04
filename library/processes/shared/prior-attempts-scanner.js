/**
 * @module prior-attempts-scanner
 * @description Composable process component that scans .a5c/runs/ for prior runs
 * matching processId patterns. Designed for injection into retrospect and convergence
 * processes to provide historical context from prior attempts.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { promises as fs } from 'fs';
import path from 'path';

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
 * Determines the status of a run by reading the last journal event.
 *
 * Scans the journal directory for the highest-sequence event file and
 * inspects its `type` field. Recognises RUN_COMPLETED and RUN_FAILED;
 * everything else (including an absent or unreadable journal) is reported
 * as 'in-progress'.
 *
 * @param {string} runDir - Path to the run directory
 * @returns {Promise<'RUN_COMPLETED'|'RUN_FAILED'|'in-progress'>} Run status
 */
async function resolveRunStatus(runDir) {
  try {
    const journalDir = path.join(runDir, 'journal');
    const entries = await fs.readdir(journalDir);
    if (entries.length === 0) return 'in-progress';

    // Journal files are named <seq>.<ulid>.json — sort lexicographically to get the last one.
    const sorted = entries.filter(e => e.endsWith('.json')).sort();
    const lastFile = sorted[sorted.length - 1];
    if (!lastFile) return 'in-progress';

    const event = await readJsonSafe(path.join(journalDir, lastFile));
    if (!event) return 'in-progress';

    if (event.type === 'RUN_COMPLETED') return 'RUN_COMPLETED';
    if (event.type === 'RUN_FAILED') return 'RUN_FAILED';
    return 'in-progress';
  } catch {
    return 'in-progress';
  }
}

/**
 * Attempts to read a brief output summary from state/output.json if it exists.
 *
 * @param {string} runDir - Path to the run directory
 * @returns {Promise<object|null>} Output summary object or null if unavailable
 */
async function readOutputSummary(runDir) {
  return readJsonSafe(path.join(runDir, 'state', 'output.json'));
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
function isMatch(processId, patterns, relatedProcessIds = []) {
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
 * Scans a runs directory for prior runs matching the supplied processId patterns.
 *
 * For each candidate directory the function reads `run.json` to extract metadata,
 * determines run status from the journal, and optionally reads an output summary.
 * Results are sorted by `createdAt` descending (most recent first) and capped at
 * `opts.maxRuns`.
 *
 * @param {string} runsDir
 *   Path to the runs root (e.g. `.a5c/runs`).
 * @param {string[]} processIdPatterns
 *   Substring patterns matched case-insensitively against each run's `processId`.
 * @param {object} [opts]
 *   Optional configuration.
 * @param {string[]} [opts.relatedProcessIds]
 *   Additional processIds to include via exact match (union with pattern matches).
 * @param {number} [opts.maxRuns=10]
 *   Maximum number of runs to return after sorting.
 * @param {boolean} [opts.includeOutputSummary=false]
 *   When true, reads `state/output.json` for each matched run.
 * @returns {Promise<{ priorRuns: object[], totalFound: number }>}
 *   `priorRuns` — array of matched run descriptors, sorted newest-first.
 *   `totalFound` — total number of matching runs before the maxRuns cap.
 */
export async function scanPriorAttempts(runsDir, processIdPatterns = [], opts = {}) {
  const {
    relatedProcessIds = [],
    maxRuns = 10,
    includeOutputSummary = false
  } = opts;

  let entries;
  try {
    entries = await fs.readdir(runsDir);
  } catch {
    // runsDir does not exist or is not readable — return empty result gracefully.
    return { priorRuns: [], totalFound: 0 };
  }

  const matched = [];

  for (const entry of entries) {
    const runDir = path.join(runsDir, entry);

    // Skip non-directories (e.g. stray lock files at the root level).
    let stat;
    try {
      stat = await fs.stat(runDir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    const runJson = await readJsonSafe(path.join(runDir, 'run.json'));
    if (!runJson) continue;

    const { runId, processId, createdAt, prompt, harness } = runJson;

    if (!isMatch(processId, processIdPatterns, relatedProcessIds)) continue;

    const status = await resolveRunStatus(runDir);
    const outputSummary = includeOutputSummary ? await readOutputSummary(runDir) : undefined;

    matched.push({
      runId: runId || entry,
      processId: processId || null,
      createdAt: createdAt || null,
      prompt: prompt || null,
      harness: harness || null,
      status,
      ...(includeOutputSummary ? { outputSummary } : {})
    });
  }

  // Sort descending by createdAt; runs with no timestamp sink to the bottom.
  matched.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const totalFound = matched.length;
  const priorRuns = matched.slice(0, maxRuns);

  return { priorRuns, totalFound };
}

// ─────────────────────────────────────────────────────────────────────────────
// defineTask wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Babysitter task definition for the prior-attempts-scanner component.
 *
 * Use this when you want the scanning to happen as an orchestrated agent task
 * (e.g. as part of a harness-driven run). For direct programmatic use, prefer
 * the exported `scanPriorAttempts` function.
 *
 * Task inputs (passed as `args`):
 * - `runsDir` {string}        — path to the runs root directory
 * - `processIdPatterns` {string[]} — substring patterns to match processIds
 * - `relatedProcessIds` {string[]} — additional exact-match processIds
 * - `maxRuns` {number}         — cap on results (default 10)
 * - `includeOutputSummary` {boolean} — whether to include state/output.json
 *
 * Task output (written to the io outputJsonPath):
 * - `priorRuns` {object[]}    — matched run descriptors, newest-first
 * - `totalFound` {number}     — total matches before capping
 */
export const priorAttemptsScannerTask = defineTask('prior-attempts-scanner', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scan prior runs for matching processId patterns',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Run-history analyst extracting structured prior-attempt context',
      task: `Use the scanPriorAttempts utility to scan the runs directory and return structured data about prior runs.

Inputs provided:
- runsDir: ${JSON.stringify(args.runsDir ?? '.a5c/runs')}
- processIdPatterns: ${JSON.stringify(args.processIdPatterns ?? [])}
- relatedProcessIds: ${JSON.stringify(args.relatedProcessIds ?? [])}
- maxRuns: ${JSON.stringify(args.maxRuns ?? 10)}
- includeOutputSummary: ${JSON.stringify(args.includeOutputSummary ?? false)}

Steps:
1. List directories inside runsDir.
2. For each directory read run.json and extract: runId, processId, createdAt, prompt, harness.
3. Keep only runs whose processId contains one of the processIdPatterns (case-insensitive substring)
   or exactly matches one of the relatedProcessIds entries.
4. For each kept run, read the last file in the journal/ subdirectory to determine status:
   - RUN_COMPLETED, RUN_FAILED, or in-progress.
5. If includeOutputSummary is true, also read state/output.json for each kept run.
6. Sort the kept runs by createdAt descending (newest first).
7. Return at most maxRuns entries.

Output JSON (write to the task output path):
{
  "priorRuns": [ { "runId", "processId", "createdAt", "prompt", "harness", "status", "outputSummary?" } ],
  "totalFound": <number of matches before capping>
}`,
      context: {
        runsDir: args.runsDir,
        processIdPatterns: args.processIdPatterns,
        relatedProcessIds: args.relatedProcessIds,
        maxRuns: args.maxRuns,
        includeOutputSummary: args.includeOutputSummary
      },
      instructions: [
        'Handle missing or corrupt run.json files gracefully — skip those runs',
        'Handle a non-existent or empty runsDir by returning { priorRuns: [], totalFound: 0 }',
        'Do not fail if individual journal files are unreadable',
        'Output must be valid JSON matching the schema above'
      ],
      outputFormat: 'JSON with priorRuns (array) and totalFound (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['priorRuns', 'totalFound'],
      properties: {
        priorRuns: { type: 'array' },
        totalFound: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

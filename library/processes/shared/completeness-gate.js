/**
 * @module completeness-gate
 * @description Composable process component that verifies all identified issues have been
 * addressed before a run completes. Designed for injection into convergence and quality-gate
 * processes to enforce resolution accountability.
 *
 * The module provides three surfaces:
 * - `evaluateCompleteness` — synchronous evaluation given explicit issue + resolution data
 * - `checkCompleteness`    — async convenience wrapper that mines a run directory for evidence
 * - `completenessGateTask` — babysitter `defineTask` wrapper for harness-driven execution
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
 * @returns {Promise<object|null>} Parsed JSON object, or null if unreadable/corrupt
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
 * Normalises a resolution status string to one of the four canonical values.
 *
 * Unrecognised values are mapped to 'unaddressed'.
 *
 * @param {string|undefined} status - Raw status string from a resolution entry
 * @returns {'addressed'|'deferred'|'wont-fix'|'unaddressed'}
 */
function normaliseStatus(status) {
  switch (status) {
    case 'addressed':  return 'addressed';
    case 'deferred':   return 'deferred';
    case 'wont-fix':   return 'wont-fix';
    default:           return 'unaddressed';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// evaluateCompleteness
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ id: string, description: string, severity: string }} Issue
 * @typedef {{ status: string, justification?: string }} ResolutionEntry
 * @typedef {{ id: string, status: 'addressed'|'deferred'|'wont-fix'|'unaddressed', justification?: string }} IssueResult
 * @typedef {{ allAddressed: boolean, summary: string, issues: IssueResult[] }} CompletenessResult
 */

/**
 * Evaluates whether all identified issues have been addressed.
 *
 * For each issue in `identifiedIssues`, the function looks up a matching entry in
 * `resolutions` by `issue.id`. If found, the resolution's `status` is normalised to
 * one of `'addressed'`, `'deferred'`, `'wont-fix'`, or `'unaddressed'`. If no entry
 * exists, the issue is classified as `'unaddressed'`.
 *
 * `allAddressed` is `true` **only** when every issue resolves to `'addressed'`.
 *
 * @param {object} params
 * @param {Issue[]} params.identifiedIssues
 *   Array of issues to verify. Each must have at minimum an `id` property.
 * @param {Record<string, ResolutionEntry>} params.resolutions
 *   Map of issue id → resolution entry. Missing keys are treated as unaddressed.
 * @returns {CompletenessResult}
 */
export function evaluateCompleteness({ identifiedIssues = [], resolutions = {} }) {
  const issues = identifiedIssues.map(issue => {
    const resolution = resolutions[issue.id];

    if (!resolution) {
      return { id: issue.id, status: /** @type {'unaddressed'} */ ('unaddressed') };
    }

    const status = normaliseStatus(resolution.status);
    /** @type {IssueResult} */
    const result = { id: issue.id, status };
    if (resolution.justification != null) {
      result.justification = resolution.justification;
    }
    return result;
  });

  const allAddressed = issues.length > 0 && issues.every(i => i.status === 'addressed');

  const counts = { addressed: 0, deferred: 0, 'wont-fix': 0, unaddressed: 0 };
  for (const i of issues) counts[i.status]++;

  const total = issues.length;
  const summaryParts = [`${total} issue(s) evaluated`];
  if (counts.addressed)   summaryParts.push(`${counts.addressed} addressed`);
  if (counts.deferred)    summaryParts.push(`${counts.deferred} deferred`);
  if (counts['wont-fix']) summaryParts.push(`${counts['wont-fix']} wont-fix`);
  if (counts.unaddressed) summaryParts.push(`${counts.unaddressed} unaddressed`);

  const summary = summaryParts.join(', ') +
    (allAddressed ? '. All issues addressed.' : '. Completeness gate NOT passed.');

  return { allAddressed, summary, issues };
}

// ─────────────────────────────────────────────────────────────────────────────
// checkCompleteness
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scans a run directory to build a resolutions map, then evaluates completeness.
 *
 * Resolution evidence is collected from two sources:
 * 1. **Task results** — every `tasks/<effectId>/result.json` is read. If the result
 *    contains a top-level `resolutions` map it is merged verbatim. Otherwise the
 *    raw JSON text is scanned for issue id keywords; any id found in the text is
 *    recorded as `{ status: 'addressed', justification: 'found in task result' }`.
 *
 * 2. **Explicit deferral markers** — if a task result contains an array
 *    `deferredIssues` whose entries have `{ id, reason }`, those are recorded as
 *    `{ status: 'deferred', justification: reason }`.
 *
 * Later sources (higher-sequenced task results) overwrite earlier ones for the same
 * issue id, so the most recent evidence wins.
 *
 * @param {string} runDir
 *   Path to the run directory (e.g. `.a5c/runs/<runId>`).
 * @param {Issue[]} identifiedIssues
 *   The list of issues to check — same shape expected by `evaluateCompleteness`.
 * @returns {Promise<CompletenessResult>}
 */
export async function checkCompleteness(runDir, identifiedIssues = []) {
  /** @type {Record<string, ResolutionEntry>} */
  const resolutions = {};

  const issueIds = identifiedIssues.map(i => i.id);

  // ── Collect evidence from task results ──────────────────────────────────────
  const tasksDir = path.join(runDir, 'tasks');
  let taskEntries = [];
  try {
    taskEntries = await fs.readdir(tasksDir);
  } catch {
    // No tasks directory — proceed with empty evidence set.
  }

  for (const effectId of taskEntries) {
    const resultPath = path.join(tasksDir, effectId, 'result.json');
    const result = await readJsonSafe(resultPath);
    if (!result) continue;

    // 1. Explicit resolutions map in the result payload.
    if (result.resolutions && typeof result.resolutions === 'object') {
      for (const [id, entry] of Object.entries(result.resolutions)) {
        if (entry && typeof entry === 'object') {
          resolutions[id] = {
            status: normaliseStatus(/** @type {string} */ (entry.status)),
            ...(entry.justification != null ? { justification: String(entry.justification) } : {})
          };
        }
      }
    }

    // 2. Explicit deferral markers.
    if (Array.isArray(result.deferredIssues)) {
      for (const item of result.deferredIssues) {
        if (item && typeof item.id === 'string') {
          resolutions[item.id] = {
            status: 'deferred',
            justification: typeof item.reason === 'string' ? item.reason : 'deferred by task result'
          };
        }
      }
    }

    // 3. Keyword scan — only for issues not yet explicitly resolved.
    const rawText = JSON.stringify(result);
    for (const id of issueIds) {
      if (resolutions[id]) continue; // already have explicit evidence
      if (rawText.includes(id)) {
        resolutions[id] = {
          status: 'addressed',
          justification: `issue id '${id}' found in task result for effect ${effectId}`
        };
      }
    }
  }

  // ── Collect evidence from journal events (keyword scan) ─────────────────────
  const journalDir = path.join(runDir, 'journal');
  let journalEntries = [];
  try {
    journalEntries = await fs.readdir(journalDir);
  } catch {
    // No journal directory — continue.
  }

  const sortedJournal = journalEntries.filter(e => e.endsWith('.json')).sort();
  for (const filename of sortedJournal) {
    const event = await readJsonSafe(path.join(journalDir, filename));
    if (!event) continue;

    // Only scan EFFECT_RESOLVED events for additional keyword evidence.
    if (event.type !== 'EFFECT_RESOLVED') continue;

    const rawText = JSON.stringify(event);
    for (const id of issueIds) {
      if (resolutions[id]) continue; // prefer task-result evidence
      if (rawText.includes(id)) {
        resolutions[id] = {
          status: 'addressed',
          justification: `issue id '${id}' found in journal event ${filename}`
        };
      }
    }
  }

  return evaluateCompleteness({ identifiedIssues, resolutions });
}

// ─────────────────────────────────────────────────────────────────────────────
// completenessGateTask
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Babysitter task definition for the completeness-gate component.
 *
 * Use this when completeness verification should happen as an orchestrated agent
 * task within a harness-driven run. For direct programmatic use, prefer the
 * exported `evaluateCompleteness` or `checkCompleteness` functions.
 *
 * Task inputs (passed as `args`):
 * - `identifiedIssues` {Array<{ id, description, severity }>} — issues to verify
 * - `resolutions` {Record<string, { status, justification? }>} — optional explicit map
 * - `runDir` {string} — optional run directory to mine for evidence when resolutions is absent
 *
 * Task output (written to the io outputJsonPath):
 * - `allAddressed` {boolean} — true only if every issue status is 'addressed'
 * - `summary` {string}       — human-readable completeness summary
 * - `issues` {IssueResult[]} — per-issue breakdown
 */
export const completenessGateTask = defineTask('completeness-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify all identified issues have been addressed',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Completeness auditor verifying issue resolution status',
      task: `Evaluate whether all identified issues have been addressed, deferred, or explicitly marked as wont-fix.

Inputs provided:
- identifiedIssues: ${JSON.stringify(args.identifiedIssues ?? [])}
- resolutions: ${JSON.stringify(args.resolutions ?? null)}
- runDir: ${JSON.stringify(args.runDir ?? null)}

Steps:
1. If an explicit \`resolutions\` map was provided, use it directly.
   Otherwise, if \`runDir\` is set, scan tasks/<effectId>/result.json files for evidence:
   a. If a result contains a top-level \`resolutions\` object, merge it.
   b. If a result contains a \`deferredIssues\` array with { id, reason } entries, record those as 'deferred'.
   c. For any issue id not yet resolved, scan the raw JSON text; if the id appears, mark it 'addressed'.
2. For each issue in identifiedIssues, determine its status:
   - 'addressed'  — resolution entry exists with status 'addressed'
   - 'deferred'   — resolution entry exists with status 'deferred'
   - 'wont-fix'   — resolution entry exists with status 'wont-fix'
   - 'unaddressed' — no resolution entry found
3. Set allAddressed = true ONLY if every issue has status 'addressed'.
4. Compose a summary string counting issues per status category.

Output JSON (write to the task output path):
{
  "allAddressed": <boolean>,
  "summary": "<human-readable summary>",
  "issues": [
    { "id": "<issueId>", "status": "<addressed|deferred|wont-fix|unaddressed>", "justification": "<optional>" }
  ]
}`,
      context: {
        identifiedIssues: args.identifiedIssues,
        resolutions: args.resolutions,
        runDir: args.runDir
      },
      instructions: [
        'allAddressed must be false if ANY issue is not status "addressed"',
        'Do not invent resolutions — only mark issues addressed when clear evidence exists',
        'Handle missing or unreadable task result files gracefully',
        'Output must be valid JSON matching the schema above'
      ],
      outputFormat: 'JSON with allAddressed (boolean), summary (string), and issues (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['allAddressed', 'summary', 'issues'],
      properties: {
        allAddressed: { type: 'boolean' },
        summary: { type: 'string' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'status'],
            properties: {
              id:            { type: 'string' },
              status:        { type: 'string', enum: ['addressed', 'deferred', 'wont-fix', 'unaddressed'] },
              justification: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath:  `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

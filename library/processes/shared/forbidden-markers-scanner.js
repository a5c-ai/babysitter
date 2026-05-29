/**
 * @module forbidden-markers-scanner
 * @description Composable pre-deploy gate that scans built JS chunks for substring
 * markers listed in a project-local `forbidden-markers.txt`. Designed for injection
 * into deploy and quality-gate processes to enforce structural guarantees against
 * the revival of saga-era / obsolete code paths after a refactor.
 *
 * The module provides three surfaces:
 * - `parseForbiddenMarkers` — synchronous parser (blank lines + `#` comments stripped)
 * - `scanForbiddenMarkers`  — async scanner returning structured `{ ok, hits, reason }`
 * - `checkForbiddenMarkersTask` — babysitter `defineTask` wrapper for harness-driven use
 *
 * Origin: ported from the cookbook prototype `scripts/check-no-forbidden.mjs`,
 * which proved the pattern across the VI-restart / iOS-Safari saga (2026-05).
 * Upstreamed for the babysitter process library per issue #477.
 *
 * @see https://github.com/a5c-ai/babysitter/issues/477
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { promises as fs } from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// parseForbiddenMarkers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses the body of a forbidden-markers file into a list of marker strings.
 *
 * Strips blank lines and full-line `#`-prefixed comments. Each remaining line
 * is trimmed; the resulting non-empty strings are returned in source order.
 *
 * Synchronous and side-effect-free — callers supply the file contents.
 *
 * @param {string} content  Raw file body (UTF-8 text from `forbidden-markers.txt`).
 * @returns {string[]} Markers in source order.
 */
export function parseForbiddenMarkers(content) {
  if (typeof content !== 'string' || content.length === 0) return [];

  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

// ─────────────────────────────────────────────────────────────────────────────
// scanForbiddenMarkers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ForbiddenMarkerHit
 * @property {string} marker  Literal marker string that appeared in the chunk.
 * @property {string} chunk   Absolute path to the chunk file containing the marker.
 * @property {number} count   Number of occurrences of the marker within that chunk.
 */

/**
 * @typedef {('missing-markers-file'|'missing-chunks-dir'|'empty-markers'|'no-chunks'|'clean'|'hits')} ForbiddenMarkerReason
 */

/**
 * @typedef {Object} ForbiddenMarkerResult
 * @property {boolean} ok                 True for clean / no-op states; false only when `hits.length > 0`.
 * @property {ForbiddenMarkerHit[]} hits  Marker × chunk hits with occurrence counts.
 * @property {number} markerCount         Number of markers actually checked (after parsing).
 * @property {number} chunkCount          Number of `.js` chunks scanned.
 * @property {ForbiddenMarkerReason} reason  Tag describing why the result shape is what it is.
 */

/**
 * Counts the number of occurrences of `needle` (literal substring) in `haystack`.
 *
 * Uses `indexOf` advancement rather than a global regex to avoid the cost of
 * regex escaping for arbitrary marker strings.
 *
 * @param {string} haystack  The content to scan.
 * @param {string} needle    The literal substring to count.
 * @returns {number} Number of occurrences (0 if needle is empty).
 */
function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    count++;
    from = idx + needle.length;
  }
  return count;
}

/**
 * Reads a file as UTF-8 text. Returns null on any I/O error so callers can
 * skip unreadable chunks without failing the whole scan.
 *
 * @param {string} filePath
 * @returns {Promise<string|null>}
 */
async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Checks whether a path exists. Returns null when it does not (or on permission
 * errors). Returns a fs.Stats object when it does.
 *
 * @param {string} p
 * @returns {Promise<import('fs').Stats|null>}
 */
async function statSafe(p) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

/**
 * Scans every `.js` chunk under `chunksDir` for any of the markers listed in
 * `markersFile`. Both paths are required arguments — callers supply project-
 * specific defaults (see the babysitter task wrapper below for Next.js
 * conventions).
 *
 * Result semantics:
 *
 * | Situation                                | `ok`  | `hits` | `reason`              |
 * |------------------------------------------|-------|--------|-----------------------|
 * | `markersFile` does not exist             | true  | []     | 'missing-markers-file'|
 * | `chunksDir` does not exist               | true  | []     | 'missing-chunks-dir'  |
 * | markers parsed to an empty list          | true  | []     | 'empty-markers'       |
 * | `chunksDir` is empty of `.js` files      | true  | []     | 'no-chunks'           |
 * | scan ran, no marker found in any chunk   | true  | []     | 'clean'               |
 * | scan ran, at least one marker found      | false | [...]  | 'hits'                |
 *
 * Both missing-config sentinels return `ok: true` by design: misconfiguration
 * is a no-op, not a failure. Opt-in is structural — projects that want the
 * gate enforced check the `reason` field explicitly (or chain a "is the
 * config file present?" pre-check). This matches the cookbook prototype's
 * "safe to chain into `check:all` before the build runs" semantics for the
 * chunks-dir side, and softens the prototype's markers-file behaviour from
 * "exit 1" to "ok: true" so a missing-config library is never a deploy block.
 *
 * @param {Object} params
 * @param {string} params.markersFile  Absolute or relative path to `forbidden-markers.txt`.
 * @param {string} params.chunksDir    Absolute or relative path to a built chunks directory.
 * @returns {Promise<ForbiddenMarkerResult>}
 */
export async function scanForbiddenMarkers({ markersFile, chunksDir } = {}) {
  if (typeof markersFile !== 'string' || markersFile.length === 0) {
    throw new TypeError('scanForbiddenMarkers: markersFile is required');
  }
  if (typeof chunksDir !== 'string' || chunksDir.length === 0) {
    throw new TypeError('scanForbiddenMarkers: chunksDir is required');
  }

  // ── markers file existence + parse ──────────────────────────────────────
  const markersContent = await readFileSafe(markersFile);
  if (markersContent === null) {
    return {
      ok: true,
      hits: [],
      markerCount: 0,
      chunkCount: 0,
      reason: 'missing-markers-file',
    };
  }

  const markers = parseForbiddenMarkers(markersContent);
  if (markers.length === 0) {
    return {
      ok: true,
      hits: [],
      markerCount: 0,
      chunkCount: 0,
      reason: 'empty-markers',
    };
  }

  // ── chunks dir existence ────────────────────────────────────────────────
  const chunksStat = await statSafe(chunksDir);
  if (chunksStat === null || !chunksStat.isDirectory()) {
    return {
      ok: true,
      hits: [],
      markerCount: markers.length,
      chunkCount: 0,
      reason: 'missing-chunks-dir',
    };
  }

  let entries;
  try {
    entries = await fs.readdir(chunksDir);
  } catch {
    return {
      ok: true,
      hits: [],
      markerCount: markers.length,
      chunkCount: 0,
      reason: 'missing-chunks-dir',
    };
  }

  const chunkPaths = entries
    .filter(name => name.endsWith('.js'))
    .map(name => path.resolve(chunksDir, name));

  if (chunkPaths.length === 0) {
    return {
      ok: true,
      hits: [],
      markerCount: markers.length,
      chunkCount: 0,
      reason: 'no-chunks',
    };
  }

  // ── scan ─────────────────────────────────────────────────────────────────
  /** @type {ForbiddenMarkerHit[]} */
  const hits = [];

  for (const chunkPath of chunkPaths) {
    const body = await readFileSafe(chunkPath);
    if (body === null) continue; // unreadable chunk — skip, don't fail the scan

    for (const marker of markers) {
      const count = countOccurrences(body, marker);
      if (count > 0) {
        hits.push({ marker, chunk: chunkPath, count });
      }
    }
  }

  if (hits.length === 0) {
    return {
      ok: true,
      hits: [],
      markerCount: markers.length,
      chunkCount: chunkPaths.length,
      reason: 'clean',
    };
  }

  return {
    ok: false,
    hits,
    markerCount: markers.length,
    chunkCount: chunkPaths.length,
    reason: 'hits',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// checkForbiddenMarkersTask
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default markers-file path, relative to a project root.
 * Mirrors the cookbook convention (`scripts/forbidden-markers.txt`).
 */
const DEFAULT_MARKERS_FILE = 'scripts/forbidden-markers.txt';

/**
 * Default chunks dir, relative to a project root. Matches the Next.js / Vercel
 * output directory layout (`vercel build` → `.vercel/output/static/_next/...`).
 * Override via the task `args.chunksDir` for other frameworks (Vite, Remix, etc.).
 */
const DEFAULT_CHUNKS_DIR = '.vercel/output/static/_next/static/chunks';

/**
 * Babysitter task definition for the forbidden-markers pre-deploy gate.
 *
 * Use this when the gate should run as an orchestrated agent task within a
 * harness-driven run (e.g. just before a `vercel deploy --prod` step). For
 * direct programmatic use, prefer the exported `scanForbiddenMarkers` function.
 *
 * Task inputs (passed as `args`):
 * - `projectDir`   {string} — project root (default: process cwd at task time)
 * - `markersFile`  {string} — override markers file path (default: `<projectDir>/scripts/forbidden-markers.txt`)
 * - `chunksDir`    {string} — override chunks dir path (default: `<projectDir>/.vercel/output/static/_next/static/chunks`)
 *
 * Task output (written to the io outputJsonPath):
 * - `ok`           {boolean}
 * - `hits`         {Array<{ marker, chunk, count }>}
 * - `markerCount`  {number}
 * - `chunkCount`   {number}
 * - `reason`       {'missing-markers-file'|'missing-chunks-dir'|'empty-markers'|'no-chunks'|'clean'|'hits'}
 *
 * The wrapped agent invokes the `scanForbiddenMarkers` helper directly; it does
 * NOT re-implement the scanning logic. This keeps behaviour bit-identical to
 * direct programmatic use.
 *
 * @see https://github.com/a5c-ai/babysitter/issues/477
 */
export const checkForbiddenMarkersTask = defineTask(
  'check-forbidden-markers',
  (args, taskCtx) => {
    const projectDir = args.projectDir ?? '.';
    const markersFile = args.markersFile ?? path.join(projectDir, DEFAULT_MARKERS_FILE);
    const chunksDir = args.chunksDir ?? path.join(projectDir, DEFAULT_CHUNKS_DIR);

    return {
      kind: 'agent',
      title: 'Pre-deploy gate: scan built chunks for forbidden markers',
      agent: {
        name: 'general-purpose',
        prompt: {
          role: 'Pre-deploy gate auditor scanning built chunks for forbidden markers',
          task: `Use the scanForbiddenMarkers helper from \`library/processes/shared/forbidden-markers-scanner.js\` to scan a built chunks directory for substring markers listed in a forbidden-markers file.

Inputs provided:
- projectDir:  ${JSON.stringify(projectDir)}
- markersFile: ${JSON.stringify(markersFile)}
- chunksDir:   ${JSON.stringify(chunksDir)}

Steps:
1. Import scanForbiddenMarkers from the shared library (or call it directly when the
   runtime allows). Pass { markersFile, chunksDir }.
2. Treat the result's \`reason\` field as the primary discriminator:
   - 'missing-markers-file' / 'missing-chunks-dir' / 'empty-markers' / 'no-chunks' / 'clean' → ok:true
   - 'hits' → ok:false; emit the structured hits array verbatim.
3. Write the full result object as JSON to the task output path.
4. Do NOT mutate the chunks directory or the markers file.

Output JSON (write to the task output path):
{
  "ok":          <boolean>,
  "hits":        [ { "marker": "<string>", "chunk": "<absolute path>", "count": <number> } ],
  "markerCount": <number>,
  "chunkCount":  <number>,
  "reason":      "<missing-markers-file|missing-chunks-dir|empty-markers|no-chunks|clean|hits>"
}`,
          context: {
            projectDir,
            markersFile,
            chunksDir,
          },
          instructions: [
            'Never modify the chunks directory or the markers file',
            'A missing markers file or missing chunks dir is a no-op (ok:true), not a failure',
            'Empty markers list and empty chunks dir are also no-ops',
            'Only reason="hits" should set ok:false',
            'Each hit must include marker, chunk (absolute path), and count (>=1)',
            'Output must be valid JSON matching the schema above',
          ],
          outputFormat: 'JSON with ok (boolean), hits (array), markerCount, chunkCount, reason',
        },
        outputSchema: {
          type: 'object',
          required: ['ok', 'hits', 'markerCount', 'chunkCount', 'reason'],
          properties: {
            ok:          { type: 'boolean' },
            hits: {
              type: 'array',
              items: {
                type: 'object',
                required: ['marker', 'chunk', 'count'],
                properties: {
                  marker: { type: 'string' },
                  chunk:  { type: 'string' },
                  count:  { type: 'number' },
                },
              },
            },
            markerCount: { type: 'number' },
            chunkCount:  { type: 'number' },
            reason: {
              type: 'string',
              enum: [
                'missing-markers-file',
                'missing-chunks-dir',
                'empty-markers',
                'no-chunks',
                'clean',
                'hits',
              ],
            },
          },
        },
      },
      io: {
        inputJsonPath:  `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['pre-deploy', 'gate', 'forbidden-markers'],
    };
  }
);

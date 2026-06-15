/**
 * Mock ghost completion (SPEC-V4 §V4-11): `suggestCompletion(context)` —
 * a deterministic Microagent member. The suggestion derives ONLY from the
 * file path + the preceding line content (FNV-1a hash → continuation table
 * keyed by file extension), so the same context always yields the same
 * ghost text. Blank lines and closing braces yield no suggestion (an empty
 * string); any line with real content gets a plausible code-ish
 * continuation.
 */

import type { CompletionContext } from '../types';

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Continuations when the line ends mid-declaration (`const foo`…). */
const CODE_ASSIGNMENTS = [
  'Gauge = calibrate(12);',
  'Relay = engageClutch(7);',
  'Manifold = readPressure();',
  'Index = registry.size + 1;',
  'Spool = windCoil(3, 9);',
] as const;

/** Continuations for a line that already closed (statement endings). */
const CODE_FOLLOWUPS = [
  ' // torque within tolerance',
  ' // verified against the rubric',
  ' // gauge steady at 0.96',
] as const;

const JSON_CONTINUATIONS = [
  '"calibration": "0.96",',
  '"verified": true,',
  '"pressure": 12,',
] as const;

const CSS_CONTINUATIONS = [
  ' color: var(--color-amber-glow);',
  ' border: 1px solid rgb(185 145 63 / 0.4);',
  ' letter-spacing: 0.08em;',
] as const;

const MD_CONTINUATIONS = [
  ' — observed by the cogitator.',
  ' (see the trial-rites ledger).',
  ' as inscribed in the charter.',
] as const;

function pick<T>(table: readonly T[], hash: number): T {
  return table[hash % table.length]!;
}

function extOf(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot + 1).toLowerCase() : '';
}

/**
 * Deterministic ghost suggestion for the caret line. Empty string = no
 * ghost (blank lines, lone closers); content-bearing lines ALWAYS suggest.
 */
export function suggestCompletion(context: CompletionContext): string {
  const line = context.lineText;
  const trimmed = line.trim();
  if (trimmed === '' || /^[}\])];?$/.test(trimmed)) return '';

  const hash = fnv1a(`${context.path}::${line}`);
  const ext = extOf(context.path);

  if (ext === 'json') return pick(JSON_CONTINUATIONS, hash);
  if (ext === 'css') return pick(CSS_CONTINUATIONS, hash);
  if (ext === 'md' || ext === 'markdown') return pick(MD_CONTINUATIONS, hash);

  // Code files (ts/tsx/js/…): mid-declaration lines complete the statement;
  // closed lines gain an engraved trailing comment.
  if (/(?:const|let|var|function|return|=)\s*[\w$]*$/.test(trimmed)) {
    return pick(CODE_ASSIGNMENTS, hash);
  }
  if (/[;{,)]$/.test(trimmed)) return pick(CODE_FOLLOWUPS, hash);
  return pick(CODE_ASSIGNMENTS, hash);
}

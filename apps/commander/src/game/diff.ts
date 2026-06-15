/**
 * Unified-diff row classification (SPEC-V2 §V2-7 / SPEC-V3 §V3-4 diff
 * plates): addition rows render verdigris with '+' markers, deletion rows
 * garnet with '-', hunk/file headers as engraved meta rows, the rest as
 * ink-gray context. Pure string analysis — shared by the Inspector
 * Workspace tab and the Human Review side panel so both surfaces render
 * byte-identical plates.
 */

export type DiffRowKind = 'add' | 'del' | 'meta' | 'context';

export interface DiffRow {
  kind: DiffRowKind;
  /** Row text WITHOUT the leading +/- marker (the marker renders apart). */
  text: string;
  /** Visible gutter marker: '+', '-', '@', or '' for context. */
  marker: string;
}

/** Classify one unified-diff line. */
export function classifyDiffLine(line: string): DiffRowKind {
  if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@') || line.startsWith('diff ')) {
    return 'meta';
  }
  if (line.startsWith('+')) return 'add';
  if (line.startsWith('-')) return 'del';
  return 'context';
}

/** Parse a synthetic unified diff into render rows (§V2-7 sim diffs). */
export function parseDiffRows(diff: string): DiffRow[] {
  return diff
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const kind = classifyDiffLine(line);
      switch (kind) {
        case 'add':
          return { kind, text: line.slice(1), marker: '+' };
        case 'del':
          return { kind, text: line.slice(1), marker: '-' };
        case 'meta':
          return { kind, text: line, marker: '@' };
        default:
          return { kind, text: line, marker: '' };
      }
    });
}

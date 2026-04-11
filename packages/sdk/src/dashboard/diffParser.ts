/**
 * Unified diff parser for structured diff rendering (GAP-UX-001b).
 */

export type DiffLineType = "add" | "remove" | "context";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  header: string;
  lines: DiffLine[];
}

const HUNK_HEADER_RE = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$/;

export function parseDiff(input: string): DiffHunk[] {
  if (!input || input.trim().length === 0) return [];

  const rawLines = input.split("\n");
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const rawLine of rawLines) {
    const hunkMatch = rawLine.match(HUNK_HEADER_RE);
    if (hunkMatch) {
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldCount: parseInt(hunkMatch[2] ?? "1", 10),
        newStart: parseInt(hunkMatch[3], 10),
        newCount: parseInt(hunkMatch[4] ?? "1", 10),
        header: rawLine,
        lines: [],
      };
      hunks.push(currentHunk);
      oldLine = currentHunk.oldStart;
      newLine = currentHunk.newStart;
      continue;
    }

    if (!currentHunk) continue;

    if (rawLine.startsWith("+")) {
      currentHunk.lines.push({
        type: "add",
        content: rawLine.slice(1),
        newLine: newLine++,
      });
    } else if (rawLine.startsWith("-")) {
      currentHunk.lines.push({
        type: "remove",
        content: rawLine.slice(1),
        oldLine: oldLine++,
      });
    } else if (rawLine.startsWith(" ") || rawLine === "") {
      currentHunk.lines.push({
        type: "context",
        content: rawLine.startsWith(" ") ? rawLine.slice(1) : rawLine,
        oldLine: oldLine++,
        newLine: newLine++,
      });
    }
  }

  return hunks;
}

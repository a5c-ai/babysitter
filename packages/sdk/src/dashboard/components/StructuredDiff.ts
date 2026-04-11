/**
 * StructuredDiff — colored unified diff rendering (GAP-UX-001b).
 */
import { colors, colorize } from "../colors";
import { parseDiff, type DiffHunk } from "../diffParser";

export interface StructuredDiffProps {
  diff: string;
  filePath?: string;
}

function renderHunk(hunk: DiffHunk): string[] {
  const lines: string[] = [];

  // Hunk header
  lines.push(colorize(hunk.header, colors.cyan));

  for (const line of hunk.lines) {
    const oldNum = line.oldLine !== undefined ? String(line.oldLine).padStart(4) : "    ";
    const newNum = line.newLine !== undefined ? String(line.newLine).padStart(4) : "    ";

    switch (line.type) {
      case "add":
        lines.push(colorize(`    ${newNum} +${line.content}`, colors.green));
        break;
      case "remove":
        lines.push(colorize(`${oldNum}      -${line.content}`, colors.red));
        break;
      case "context":
        lines.push(colorize(`${oldNum} ${newNum}  ${line.content}`, colors.dim));
        break;
    }
  }

  return lines;
}

export function renderStructuredDiff(props: StructuredDiffProps): string {
  const hunks = parseDiff(props.diff);

  if (hunks.length === 0) {
    return colorize("(no changes)", colors.dim);
  }

  const lines: string[] = [];

  // File path header
  if (props.filePath) {
    lines.push(colorize(`\u2500\u2500\u2500 ${props.filePath}`, colors.bold));
    lines.push("");
  }

  for (let i = 0; i < hunks.length; i++) {
    if (i > 0) lines.push("");
    lines.push(...renderHunk(hunks[i]));
  }

  return lines.join("\n");
}

// StructuredDiffView.ts — Unified diff parsing and rendering (GAP-UX-001b)
// Pure TypeScript: parses unified diff output, renders text or HTML.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiffLineType = 'add' | 'remove' | 'context';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  lineNumber: number | null;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

// ---------------------------------------------------------------------------
// Diff parsing
// ---------------------------------------------------------------------------

export function parseDiffOutput(diffText: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const rawLines = diffText.split('\n');

  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const rawLine of rawLines) {
    // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = rawLine.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@(.*)$/);
    if (hunkMatch) {
      currentHunk = { header: rawLine, lines: [] };
      hunks.push(currentHunk);
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[2], 10);
      continue;
    }

    // Skip file headers (---, +++, diff, index)
    if (rawLine.startsWith('---') || rawLine.startsWith('+++') || rawLine.startsWith('diff ') || rawLine.startsWith('index ')) {
      continue;
    }

    if (!currentHunk) continue;

    if (rawLine.startsWith('+')) {
      currentHunk.lines.push({ type: 'add', content: rawLine.slice(1), lineNumber: newLine });
      newLine++;
    } else if (rawLine.startsWith('-')) {
      currentHunk.lines.push({ type: 'remove', content: rawLine.slice(1), lineNumber: oldLine });
      oldLine++;
    } else if (rawLine.startsWith(' ') || rawLine === '') {
      const content = rawLine.startsWith(' ') ? rawLine.slice(1) : rawLine;
      currentHunk.lines.push({ type: 'context', content, lineNumber: newLine });
      oldLine++;
      newLine++;
    }
  }

  return hunks;
}

// ---------------------------------------------------------------------------
// Text rendering
// ---------------------------------------------------------------------------

export function formatDiffText(hunks: DiffHunk[]): string {
  if (hunks.length === 0) return '(no changes)';

  const lines: string[] = [];
  for (const hunk of hunks) {
    lines.push(hunk.header);
    for (const line of hunk.lines) {
      const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
      const lineNum = line.lineNumber != null ? String(line.lineNumber).padStart(4) : '    ';
      lines.push(`${lineNum} ${prefix} ${line.content}`);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const DIFF_LINE_CLASS: Record<DiffLineType, string> = {
  add: 'diff-add',
  remove: 'diff-remove',
  context: 'diff-context',
};

const DIFF_LINE_BG: Record<DiffLineType, string> = {
  add: '#e6ffec',
  remove: '#ffebe9',
  context: 'transparent',
};

export function formatDiffHtml(hunks: DiffHunk[]): string {
  if (hunks.length === 0) return '<div class="diff-view">(no changes)</div>';

  let html = '<div class="diff-view">';
  for (const hunk of hunks) {
    html += `<div class="diff-hunk">`;
    html += `<div class="diff-header">${escapeHtml(hunk.header)}</div>`;
    html += `<table class="diff-table">`;
    for (const line of hunk.lines) {
      const cls = DIFF_LINE_CLASS[line.type];
      const bg = DIFF_LINE_BG[line.type];
      const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
      const lineNum = line.lineNumber != null ? String(line.lineNumber) : '';
      html += `<tr class="${cls}" style="background:${bg}">`;
      html += `<td class="diff-line-num">${lineNum}</td>`;
      html += `<td class="diff-prefix">${prefix}</td>`;
      html += `<td class="diff-content">${escapeHtml(line.content)}</td>`;
      html += `</tr>`;
    }
    html += `</table></div>`;
  }
  html += '</div>';
  return html;
}

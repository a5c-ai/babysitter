export const PASTE_START = "\x1b[200~";
export const PASTE_END = "\x1b[201~";

export function isPasteSequence(input: string): boolean {
  return input.includes(PASTE_START);
}

export interface PasteDetectionResult {
  readonly isPaste: boolean;
  readonly content?: string;
}

export function detectBracketedPaste(input: string): PasteDetectionResult {
  if (!isPasteSequence(input)) {
    return { isPaste: false };
  }
  return { isPaste: true, content: extractPasteContent(input) };
}

export function extractPasteContent(input: string): string {
  return input.replace(PASTE_START, "").replace(PASTE_END, "");
}

export interface SearchMatch {
  readonly start: number;
  readonly end: number;
}

export interface SearchOptions {
  readonly ignoreCase?: boolean;
}

export function findMatches(
  text: string,
  pattern: string,
  options?: SearchOptions,
): SearchMatch[] {
  if (!pattern || !text) return [];

  const flags = options?.ignoreCase ? "gi" : "g";
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, flags);
  const matches: SearchMatch[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });
    if (match[0].length === 0) regex.lastIndex++;
  }
  return matches;
}

export function highlightText(
  text: string,
  matches: readonly SearchMatch[],
  startMarker: string,
  endMarker: string,
): string {
  if (matches.length === 0) return text;

  const sorted = [...matches].sort((a, b) => a.start - b.start);
  let result = "";
  let lastEnd = 0;

  for (const m of sorted) {
    result += text.slice(lastEnd, m.start);
    result += startMarker + text.slice(m.start, m.end) + endMarker;
    lastEnd = m.end;
  }
  result += text.slice(lastEnd);
  return result;
}

export function navigateMatch(
  currentIndex: number,
  totalMatches: number,
  direction: "next" | "prev",
): number {
  if (totalMatches <= 0) return 0;
  if (totalMatches === 1) return 0;
  if (direction === "next") {
    return (currentIndex + 1) % totalMatches;
  }
  return (currentIndex - 1 + totalMatches) % totalMatches;
}

export interface MarkdownSpan {
  readonly text: string;
  readonly style: "plain" | "bold" | "italic" | "code" | "codeBlock" | "blockquote" | "listItem";
  readonly language?: string;
}

export function parseMarkdownLite(input: string): MarkdownSpan[] {
  if (!input) return [];

  const spans: MarkdownSpan[] = [];
  const lines = input.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      const langMatch = line.trimStart().match(/^```(\w*)/);
      const language = langMatch?.[1] || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;

      if (spans.length > 0 && spans[spans.length - 1].style !== "codeBlock") {
        const last = spans[spans.length - 1];
        if (!last.text.endsWith("\n")) {
          spans[spans.length - 1] = { ...last, text: last.text + "\n" };
        }
      }

      spans.push({
        text: codeLines.join("\n"),
        style: "codeBlock",
        language,
      });
      continue;
    }

    if (line.match(/^>\s?/)) {
      ensureMarkdownLineBreak(spans, i);
      spans.push({
        text: line.replace(/^>\s?/, ""),
        style: "blockquote",
      });
      i++;
      continue;
    }

    if (line.match(/^\s*[-*]\s+/) || line.match(/^\s*\d+\.\s+/)) {
      ensureMarkdownLineBreak(spans, i);
      spans.push({
        text: line.replace(/^\s*(?:[-*]|\d+\.)\s+/, ""),
        style: "listItem",
      });
      i++;
      continue;
    }

    parseInlineMarkdown(i > 0 ? "\n" + line : line, spans);
    i++;
  }

  return spans;
}

function ensureMarkdownLineBreak(spans: MarkdownSpan[], index: number): void {
  if (index <= 0 || spans.length === 0) return;
  const last = spans[spans.length - 1];
  if (!last.text.endsWith("\n")) {
    spans[spans.length - 1] = { ...last, text: last.text + "\n" };
  }
}

function parseInlineMarkdown(text: string, spans: MarkdownSpan[]): void {
  const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      appendPlain(spans, text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      spans.push({ text: match[2], style: "bold" });
    } else if (match[3] !== undefined) {
      spans.push({ text: match[3], style: "italic" });
    } else if (match[4] !== undefined) {
      spans.push({ text: match[4], style: "code" });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    appendPlain(spans, text.slice(lastIndex));
  }
}

function appendPlain(spans: MarkdownSpan[], text: string): void {
  if (spans.length > 0 && spans[spans.length - 1].style === "plain") {
    spans[spans.length - 1] = {
      ...spans[spans.length - 1],
      text: spans[spans.length - 1].text + text,
    };
    return;
  }
  spans.push({ text, style: "plain" });
}

export type DiffLineKind = "add" | "remove" | "context" | "hunk-header" | "header";

export function classifyDiffLine(line: string): DiffLineKind {
  if (line.startsWith("@@")) return "hunk-header";
  if (line.startsWith("+++") || line.startsWith("---")) return "header";
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "remove";
  return "context";
}

export interface DiffHunk {
  readonly header: string;
  readonly lines: readonly string[];
}

export function parseDiffHunks(diff: string): DiffHunk[] {
  if (!diff.trim()) return [];

  const hunks: DiffHunk[] = [];
  let currentHeader: string | null = null;
  let currentLines: string[] = [];

  for (const line of diff.split("\n")) {
    if (line.startsWith("@@")) {
      if (currentHeader !== null) {
        hunks.push({ header: currentHeader, lines: currentLines });
      }
      currentHeader = line;
      currentLines = [];
    } else if (currentHeader !== null && !line.startsWith("+++") && !line.startsWith("---")) {
      currentLines.push(line);
    }
  }

  if (currentHeader !== null) {
    hunks.push({ header: currentHeader, lines: currentLines });
  }
  return hunks;
}

export interface DiffStats {
  readonly additions: number;
  readonly deletions: number;
  readonly summary: string;
}

export function formatDiffStats(lines: readonly string[]): DiffStats {
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) additions++;
    if (line.startsWith("-") && !line.startsWith("---")) deletions++;
  }

  return {
    additions,
    deletions,
    summary: `+${additions} -${deletions}`,
  };
}

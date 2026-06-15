/**
 * Pure view-state helpers for the web IDE overlay (SPEC-V4 §V4-11):
 * tab-id sanitization, caret/line geometry over a textarea buffer, and the
 * ghost-completion accept/dismiss state machine. All pure and unit-tested;
 * the IdeOverlay component is a thin renderer over these.
 */

/** `ide-tab-<sanitized-path>`: every non-alphanumeric character → '-'. */
export function sanitizeTabId(path: string): string {
  return path.replace(/[^a-zA-Z0-9]/g, '-');
}

/** Caret position resolved against the buffer's line structure. */
export interface CaretInfo {
  /** 0-based line index of the caret. */
  lineIndex: number;
  /** Full text of the caret's line. */
  lineText: string;
  /** Text of the line BEFORE the caret column. */
  beforeCaret: string;
  /** True when the caret sits at the very end of its line. */
  atLineEnd: boolean;
}

export function caretInfo(text: string, caret: number): CaretInfo {
  const clamped = Math.max(0, Math.min(text.length, caret));
  const before = text.slice(0, clamped);
  const lineStart = before.lastIndexOf('\n') + 1;
  const lineIndex = lineStart === 0 ? 0 : before.split('\n').length - 1;
  const nextBreak = text.indexOf('\n', clamped);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  const lineText = text.slice(lineStart, lineEnd);
  return {
    lineIndex,
    lineText,
    beforeCaret: text.slice(lineStart, clamped),
    atLineEnd: clamped === lineEnd,
  };
}

/** An armed ghost suggestion (rendered after the caret, §V4-11). */
export interface GhostState {
  path: string;
  lineIndex: number;
  text: string;
}

export interface GhostAccept {
  /** The buffer with the suggestion spliced in at the caret. */
  text: string;
  /** New caret position (end of the inserted suggestion). */
  caret: number;
}

/**
 * Tab accepts the ghost: splice its text at the caret. Pure — the caller
 * owns marking the tab dirty and clearing the ghost state.
 */
export function acceptGhost(text: string, caret: number, ghost: GhostState): GhostAccept {
  const at = Math.max(0, Math.min(text.length, caret));
  return {
    text: text.slice(0, at) + ghost.text + text.slice(at),
    caret: at + ghost.text.length,
  };
}

/**
 * Ghost lifecycle transition for an Escape press inside the editor buffer:
 * a visible ghost is dismissed FIRST; only a ghost-less Esc may cascade up
 * (close the IDE). Returns the next ghost state + whether to cascade.
 */
export function escapeGhost(ghost: GhostState | null): { ghost: null; cascade: boolean } {
  return { ghost: null, cascade: ghost === null };
}

/** Render cap for the highlight layer (§V4-11 "cap render at ~400 lines"). */
export const IDE_RENDER_LINE_CAP = 400;

export const IDE_CAP_NOTICE =
  'the cogitator abridges the scroll here — the remaining verses exceed its plate';

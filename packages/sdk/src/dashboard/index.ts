/**
 * Dashboard — terminal UI components for babysitter (GAP-UX-001 family).
 *
 * The ANSI string renderers (components/) are used for non-interactive CLI
 * output and for composing within the Ink-based interactive TUI (ink/).
 */
export * from "./components";
export * from "./colors";
export { parseDiff, type DiffHunk, type DiffLine, type DiffLineType } from "./diffParser";
export { isTTY, writeStatus, clearStatus } from "./render";

// Ink-based interactive TUI (loaded dynamically — no ESM import at require time)
export { createTuiSession, type TuiSession } from "./ink/render";
export type {
  TuiConfig,
  TuiMessage,
  TuiMessageContent,
  MessageKind,
  VerbosityLevel,
  RunStatus,
  SessionState,
  Theme,
  ThemeColors,
} from "./ink/types";

/**
 * Babysitter TUI — public API.
 *
 * Only exports types and the async entry point so that importing this module
 * from CJS code does not trigger any ESM resolution at require() time.
 */

// Types
export type {
  ViewName,
  MessageKind,
  VerbosityLevel,
  RunStatus,
  TuiMessage,
  TuiMessageContent,
  UserMessageContent,
  AssistantMessageContent,
  ToolCallContent,
  SubagentContent,
  SystemContent,
  ErrorContent,
  SessionState,
  Theme,
  ThemeColors,
  TuiConfig,
  EffectKind,
  TuiEffectStatus,
  EffectSummary,
  TaskSummary,
  BreakpointState,
  OrchestrationPhase,
  OrchestrationStatus,
  TokenUsage,
} from "./types.js";

// Session actions (useful for consumers that dispatch externally)
export type { SessionAction } from "./contexts/SessionContext.js";

// Navigation actions and state
export type { NavigationAction, NavigationState } from "./contexts/NavigationContext.js";

// Hook result types
export type { UseSessionResult } from "./hooks/useSession.js";
export type { UseClockResult } from "./hooks/useClock.js";
export type { UseRunScannerResult } from "./hooks/useRunScanner.js";
export type { UseRunDetailResult } from "./hooks/useRunDetail.js";

// Data layer types
export type { RunSummary, RunDetail } from "./data/runScanner.js";

// Message rendering helpers (pure functions)
export {
  truncateOutput,
  formatTimestamp,
  formatElapsedCompact,
  formatElapsedClock,
  briefArgs,
  getMessageIcon,
  getMessageColor,
  shouldShowTimestamp,
  formatToolCallSummary,
  formatShellOutput,
  formatToolOutput,
  getEffectIcon,
  getEffectStatusColor,
  buildEffectTree,
  derivePhase,
  aggregateOrchestrationStatus,
  groupPendingEffects,
  summarizePendingGroups,
  formatEventType,
  getEventIcon,
  getEventColor,
  formatEventTimeline,
} from "./helpers.js";

// StatusLine pure functions
export {
  formatElapsed,
  phaseToColorKey,
  formatCostForStatus,
  formatStatusSegments,
} from "./components/StatusLine.js";

// StatusLine types
export type { StatusSegment, StatusLineProps } from "./components/StatusLine.js";

// Phase 3 types
export type { PendingGroupSummary } from "./helpers.js";

// Phase 4: Breakpoint & Interaction UI helpers
export {
  parseSlashCommand,
  isValidSlashCommand,
  getSlashCompletions,
  formatBreakpointPrompt,
  getBreakpointStatusColor,
  formatBreakpointOptions,
  createInputHistory,
  addToHistory,
  navigateHistory,
} from "./helpers.js";

// Phase 4 types
export type { SlashCommandDef, InputHistory } from "./helpers.js";

// Phase 6: Cost tracking helpers
export {
  formatCostRate,
  estimateRemainingCost,
  formatCostSummary,
} from "./helpers.js";
export type { CostSummary } from "./helpers.js";

// Phase 6: Resume dashboard helpers
export {
  getResumableRuns,
  rankRunsForResume,
  formatRunSummaryLine,
} from "./helpers.js";

// Phase 6: Structured status view helpers
export {
  buildStatusSections,
  formatStatusSection,
} from "./helpers.js";
export type { StatusSection, StatusEntry } from "./helpers.js";

// Keyboard help overlay
export { formatKeyboardHelp } from "./helpers.js";

// Streaming line parser and turn timer
export {
  parseStreamingLine,
  createStreamingParser,
  formatTurnElapsed,
  formatTokenSummary,
  getHarnessStreamingFormat,
  HARNESS_STREAMING_FORMATS,
} from "./helpers.js";
export type { StreamingEvent, HarnessStreamingFormat, StreamingParser } from "./helpers.js";

// Component helpers — RunListTable
export {
  stateSymbol,
  stateColor,
  truncateId,
  truncateProcess,
  formatRelativeTimestamp,
} from "./components/RunListTable.js";

// Component helpers — MessagePane
export { filterMessages, VERBOSITY_ALLOWED } from "./components/MessagePane.js";

// SearchBar component + helpers
export { SearchBar, applySearchHighlight } from "./components/SearchBar.js";
export type { SearchBarProps, SearchBarState } from "./components/SearchBar.js";

// Component helpers — ActionMenu
export { SHORTCUTS as ACTION_MENU_SHORTCUTS, mapKeyToAction } from "./components/ActionMenu.js";
export type { Shortcut as ActionMenuShortcut } from "./components/ActionMenu.js";

// Component helpers — PromptBar
export {
  getSlashHints,
  countLines,
  completeSlashCommand,
  SLASH_COMMANDS,
} from "./components/PromptBar.js";
export type { SlashCommand as PromptBarSlashCommand } from "./components/PromptBar.js";

// Component helpers — StatusBar
export {
  formatTokenCount,
  statusToIndicator,
  statusToColor,
} from "./components/StatusBar.js";

// Phase 7: ScrollBox math
export {
  clampScrollOffset,
  computeVisibleRange,
  shouldAutoScroll,
} from "./helpers.js";

// Phase 7: Alternate screen mode
export {
  buildAlternateScreenEnter,
  buildAlternateScreenLeave,
} from "./helpers.js";

// Phase 7: Terminal tab status
export {
  buildTabStatusSequence,
  mapRunStatusToTabPreset,
  TERMINAL_BELL,
} from "./helpers.js";
export type { TabStatusPreset } from "./helpers.js";

// Phase 7: Paste detection
export {
  PASTE_START,
  PASTE_END,
  isPasteSequence,
  detectBracketedPaste,
  extractPasteContent,
} from "./helpers.js";
export type { PasteDetectionResult } from "./helpers.js";

// Phase 7: Search highlighting
export {
  findMatches,
  highlightText,
  navigateMatch,
} from "./helpers.js";
export type { SearchMatch, SearchOptions } from "./helpers.js";

// Markdown-lite parser for rich message rendering
export { parseMarkdownLite } from "./helpers.js";
export type { MarkdownSpan } from "./helpers.js";

// Phase 7: Diff helpers
export {
  classifyDiffLine,
  parseDiffHunks,
  formatDiffStats,
} from "./helpers.js";
export type { DiffLineKind, DiffHunk, DiffStats } from "./helpers.js";

// Phase 7: Viewport-aware animation
export {
  shouldAnimateTick,
  computeFrameIndex,
} from "./helpers.js";
export type { ViewportState } from "./helpers.js";

// Chat context
export type { ChatContextValue, ChatProviderProps, ChatTurn, StreamCallbacks } from "./contexts/ChatContext.js";

// Effects context
export { EffectsProvider, useEffects } from "./contexts/EffectsContext.js";
export type { EffectsContextValue, EffectsProviderProps } from "./contexts/EffectsContext.js";

// Effects panel
export { EffectsPanel } from "./components/EffectsPanel.js";
export type { EffectsPanelProps } from "./components/EffectsPanel.js";

// Breakpoint panel
export { BreakpointPanel } from "./components/BreakpointPanel.js";
export type { BreakpointPanelProps } from "./components/BreakpointPanel.js";

// RunDetailView
export { RunDetailView } from "./views/RunDetailView.js";
export type { RunDetailViewProps } from "./views/RunDetailView.js";

// Runtime entry point
export { createTuiSession, type TuiSession } from "./render.js";

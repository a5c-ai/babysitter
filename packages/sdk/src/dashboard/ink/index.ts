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

// Data layer types
export type { RunSummary, RunDetail } from "./data/runScanner.js";

// Message rendering helpers (pure functions)
export {
  truncateOutput,
  formatTimestamp,
  formatElapsedCompact,
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
} from "./helpers.js";

// Phase 3 types
export type { PendingGroupSummary } from "./helpers.js";

// Runtime entry point
export { createTuiSession, type TuiSession } from "./render.js";

/**
 * Shared types for the Babysitter TUI layer.
 *
 * All Ink/React imports are kept out of this file so it can be imported from
 * CJS modules without triggering ESM dynamic-import resolution at require time.
 */

// ---------------------------------------------------------------------------
// Enumerations / union types
// ---------------------------------------------------------------------------

export type ViewName = "dashboard" | "session" | "run-detail";

export type MessageKind =
  | "user"
  | "assistant"
  | "tool_call"
  | "subagent"
  | "system"
  | "error";

export type VerbosityLevel = "minimal" | "normal" | "verbose";

export type RunStatus =
  | "idle"
  | "running"
  | "waiting_effect"
  | "complete"
  | "failed";

// ---------------------------------------------------------------------------
// Message content (discriminated union)
// ---------------------------------------------------------------------------

export interface UserMessageContent {
  readonly kind: "user";
  readonly text: string;
}

export interface AssistantMessageContent {
  readonly kind: "assistant";
  readonly text: string;
  /** Whether the assistant is still streaming this message. */
  readonly streaming?: boolean;
}

export interface ToolCallContent {
  readonly kind: "tool_call";
  readonly toolName: string;
  readonly input: unknown;
  readonly output?: unknown;
  /** Elapsed milliseconds for the tool call (once completed). */
  readonly elapsedMs?: number;
}

export interface SubagentContent {
  readonly kind: "subagent";
  readonly agentId: string;
  readonly label: string;
  readonly status: RunStatus;
  readonly childMessages?: readonly TuiMessage[];
}

export interface SystemContent {
  readonly kind: "system";
  readonly text: string;
}

export interface ErrorContent {
  readonly kind: "error";
  readonly message: string;
  readonly detail?: string;
}

export type TuiMessageContent =
  | UserMessageContent
  | AssistantMessageContent
  | ToolCallContent
  | SubagentContent
  | SystemContent
  | ErrorContent;

// ---------------------------------------------------------------------------
// TuiMessage
// ---------------------------------------------------------------------------

export interface TuiMessage {
  /** Unique message identifier (e.g. ULID). */
  readonly id: string;
  /** ISO-8601 timestamp string. */
  readonly timestamp: string;
  /** Minimum verbosity level at which this message should be rendered. */
  readonly verbosity: VerbosityLevel;
  readonly content: TuiMessageContent;
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

export interface SessionState {
  readonly runId: string | null;
  readonly status: RunStatus;
  readonly messages: readonly TuiMessage[];
  readonly verbosity: VerbosityLevel;
  /** Current prompt input buffer (controlled by PromptBar). */
  readonly inputBuffer: string;
  /** Whether the prompt bar is focused / active. */
  readonly inputActive: boolean;
  /** Wall-clock ms at which the current run started (null if not running). */
  readonly runStartedAt: number | null;
  /** Wall-clock ms at which the current turn (user message) started. */
  readonly turnStartedAt: number | null;
  /** Accumulated token usage for the current session. */
  readonly tokenUsage: TokenUsage | null;
  /** Accumulated cost for the current session. */
  readonly cost: number | null;
  /** Active breakpoint awaiting user decision (null if none). */
  readonly breakpoint: BreakpointState | null;
  /** Current iteration/turn number (incremented on each user message). */
  readonly iteration: number;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface ThemeColors {
  /** Primary accent — used for highlights, selections, cursor. */
  readonly primary: string;
  /** Secondary accent. */
  readonly secondary: string;
  /** Muted / dim foreground for timestamps, metadata. */
  readonly muted: string;
  /** Error / failure color. */
  readonly error: string;
  /** Warning color. */
  readonly warning: string;
  /** Success / complete color. */
  readonly success: string;
  /** Default foreground text color. */
  readonly foreground: string;
  /** Background color (used where supported). */
  readonly background: string;
  /** Border / separator color. */
  readonly border: string;
  /** Tool-call highlight color. */
  readonly toolCall: string;
  /** Subagent label color. */
  readonly subagent: string;
}

export interface Theme {
  readonly name: string;
  readonly colors: ThemeColors;
}

// ---------------------------------------------------------------------------
// TUI configuration
// ---------------------------------------------------------------------------

export interface TuiConfig {
  /** Run ID to bind the TUI to (optional — can be set post-mount). */
  readonly runId?: string;
  /** Initial verbosity level. Defaults to "normal". */
  readonly verbosity?: VerbosityLevel;
  /** Theme override. Defaults to neonDark. */
  readonly theme?: Theme;
  /** Whether to render to stderr instead of stdout. Defaults to true. */
  readonly useStderr?: boolean;
  /** Initial view to display. Defaults to "dashboard". */
  readonly initialView?: ViewName;
  /** Directory containing runs. Defaults to ".a5c/runs". */
  readonly runsDir?: string;
  /** Harness to use for chat invocations. Defaults to "internal". */
  readonly harness?: string;
  /** Workspace directory for harness invocations. Defaults to cwd. */
  readonly workspace?: string;
  /** Model override for harness invocations. */
  readonly model?: string;
}

// ---------------------------------------------------------------------------
// Phase 1: Foundation Enhancement types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/ban-types
export type EffectKind = "node" | "breakpoint" | "orchestrator_task" | "sleep" | (string & {});
export type TuiEffectStatus = "pending" | "resolved" | "failed";
export type OrchestrationPhase = "planning" | "executing" | "verifying" | "waiting" | "complete" | "failed";

export interface EffectSummary {
  readonly effectId: string;
  readonly kind: EffectKind;
  readonly status: TuiEffectStatus;
  readonly title?: string;
  readonly elapsedMs?: number;
  readonly error?: string;
}

export interface TaskSummary {
  readonly taskId: string;
  readonly effectId: string;
  readonly kind: EffectKind;
  readonly title: string;
  readonly status: TuiEffectStatus;
  readonly startedAt?: number | string;
  readonly completedAt?: number | string;
  readonly elapsedMs?: number;
}

export interface BreakpointState {
  readonly breakpointId: string;
  readonly title: string;
  readonly approved: boolean | null;
  readonly response?: string;
  readonly feedback?: string;
  readonly expert?: string | string[];
  readonly tags?: string[];
  readonly autoApproval?: { readonly recommended: boolean; readonly reason: string };
}

export interface TokenUsage {
  readonly input: number;
  readonly output: number;
  readonly total: number;
  readonly cacheRead?: number;
  readonly cacheWrite?: number;
}

export interface OrchestrationStatus {
  readonly runId: string;
  readonly iteration: number;
  readonly phase: OrchestrationPhase;
  readonly totalEffects: number;
  readonly pendingEffects: number;
  readonly resolvedEffects: number;
  readonly tokenUsage?: TokenUsage;
  readonly cost?: number;
  readonly elapsedMs: number;
}

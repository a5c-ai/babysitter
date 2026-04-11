/**
 * Shared types for the Babysitter Paperclip plugin.
 */

/** Adapter type mapping from Paperclip agent adapterType to babysitter harness name. */
export const ADAPTER_TYPE_MAP: Record<string, string> = {
  claude_local: "claude-code",
  codex_local: "codex",
  gemini_local: "gemini-cli",
  cursor_local: "cursor",
  github_copilot: "github-copilot",
  opencode_local: "opencode",
  pi_local: "pi",
  omp_local: "oh-my-pi",
};

/** A babysitter run tracked by the plugin. */
export interface TrackedRun {
  runId: string;
  processId: string;
  agentId: string;
  companyId: string;
  harnessName: string;
  status: "running" | "waiting" | "completed" | "failed";
  createdAt: string;
  lastIteratedAt?: string;
  pendingBreakpoints: PendingBreakpoint[];
}

/** A pending breakpoint awaiting user approval.
 *
 * Breakpoint metadata comes from the SDK's breakpoint intrinsic
 * (runtime/intrinsics/breakpoint.ts). The task.json for a breakpoint has:
 *   kind: "breakpoint"
 *   metadata.payload: { question, title, options, expert, tags, strategy, ... }
 *
 * The stop hook in the underlying harness (e.g., Claude Code) checks if only
 * breakpoints are pending and allows the agent to exit (approve decision),
 * pausing the orchestration loop until the breakpoint is resolved externally.
 *
 * CRITICAL: Both approve and reject use --status ok.
 * Rejection sends { approved: false, feedback: "..." }.
 * Never use --status error for rejection -- that triggers RUN_FAILED.
 */
export interface PendingBreakpoint {
  effectId: string;
  title: string;
  question?: string;
  description?: string;
  options?: string[];
  expert?: string | string[];
  tags?: string[];
  strategy?: "single" | "first-response-wins" | "collect-all" | "quorum";
  previousFeedback?: string;
  attempt?: number;
  requestedAt: string;
}

/** Overview data returned by the runs-overview data handler. */
export interface RunsOverview {
  activeRuns: TrackedRun[];
  pendingBreakpoints: number;
  totalRuns: number;
}

/** Detail data for a single run. */
export interface RunDetail {
  run: TrackedRun;
  events: RunEvent[];
  pendingEffects: PendingEffect[];
}

/** A journal event from a babysitter run. */
export interface RunEvent {
  seq: number;
  type: string;
  recordedAt: string;
  data: Record<string, unknown>;
}

/** A pending effect from a babysitter run. */
export interface PendingEffect {
  effectId: string;
  kind: string;
  label: string;
  taskId: string;
  requestedAt: string;
}

/** Result of detecting which harness an agent uses. */
export interface HarnessDetectionResult {
  harnessName: string;
  detectionTier: "agent-metadata" | "env-probe" | "config" | "fallback";
  confidence: "high" | "medium" | "low";
}

/**
 * Breakpoint task definition metadata as written by the SDK.
 * Extracted from task.json files in runs/<runId>/tasks/<effectId>/.
 */
export interface BreakpointTaskDef {
  kind: "breakpoint";
  title: string;
  metadata: {
    payload: {
      question?: string;
      title?: string;
      options?: string[];
      expert?: string | string[];
      tags?: string[];
      strategy?: string;
      previousFeedback?: string;
      attempt?: number;
      [key: string]: unknown;
    };
    requestedAt: string;
    label: string;
  };
}

/**
 * Harness plugin installation status.
 * Used to verify the underlying harness has its babysitter plugin installed.
 */
export interface HarnessPluginStatus {
  harnessName: string;
  cliAvailable: boolean;
  pluginInstalled: boolean;
  installCommand?: string;
}

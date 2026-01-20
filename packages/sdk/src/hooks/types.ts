/**
 * Hook System Types
 * Type definitions for the generalized hook system
 */

export type HookType =
  // SDK Lifecycle Hooks
  | "on-run-start"
  | "on-run-complete"
  | "on-run-fail"
  | "on-task-start"
  | "on-task-complete"
  | "on-step-dispatch"
  | "on-iteration-start"
  | "on-iteration-end"
  // Process-Level Hooks
  | "on-breakpoint"
  | "pre-commit"
  | "pre-branch"
  | "post-planning"
  | "on-score"
  // Custom hooks
  | string;

export interface HookResult {
  hookType: HookType;
  success: boolean;
  output?: unknown;
  error?: string;
  executedHooks: HookExecutionResult[];
}

export interface HookExecutionResult {
  hookPath: string;
  hookName: string;
  hookLocation: "per-repo" | "per-user" | "plugin";
  status: "success" | "failed";
  exitCode?: number;
  error?: string;
}

// Payload types for each hook

export interface OnRunStartPayload {
  hookType: "on-run-start";
  runId: string;
  processId: string;
  entry: string;
  inputs?: unknown;
  timestamp: string;
}

export interface OnRunCompletePayload {
  hookType: "on-run-complete";
  runId: string;
  status: "completed";
  output?: unknown;
  duration: number;
  timestamp: string;
}

export interface OnRunFailPayload {
  hookType: "on-run-fail";
  runId: string;
  status: "failed";
  error: string;
  duration: number;
  timestamp: string;
}

export interface OnTaskStartPayload {
  hookType: "on-task-start";
  runId: string;
  effectId: string;
  taskId: string;
  kind: string;
  label?: string;
  timestamp: string;
}

export interface OnTaskCompletePayload {
  hookType: "on-task-complete";
  runId: string;
  effectId: string;
  taskId: string;
  status: "ok" | "error" | "timeout";
  result?: unknown;
  duration: number;
  timestamp: string;
}

export interface OnStepDispatchPayload {
  hookType: "on-step-dispatch";
  runId: string;
  stepId: string;
  action: string;
  timestamp: string;
}

export interface OnIterationStartPayload {
  hookType: "on-iteration-start";
  runId: string;
  iteration: number;
  timestamp: string;
}

export interface OnIterationEndPayload {
  hookType: "on-iteration-end";
  runId: string;
  iteration: number;
  status: "completed" | "failed" | "waiting";
  timestamp: string;
}

export interface OnBreakpointPayload {
  hookType: "on-breakpoint";
  question: string;
  title?: string;
  runId?: string;
  reason?: string;
  context?: {
    runId?: string;
    files?: Array<{
      path: string;
      format: "markdown" | "code";
      language?: string;
    }>;
  };
}

export interface PreCommitPayload {
  hookType: "pre-commit";
  runId: string;
  files: string[];
  message: string;
  author?: string;
  timestamp: string;
}

export interface PreBranchPayload {
  hookType: "pre-branch";
  runId: string;
  branch: string;
  base: string;
  timestamp: string;
}

export interface PostPlanningPayload {
  hookType: "post-planning";
  runId: string;
  planFile: string;
  timestamp: string;
}

export interface OnScorePayload {
  hookType: "on-score";
  runId: string;
  target: string;
  score?: number;
  metrics?: Record<string, unknown>;
  timestamp: string;
}

export type HookPayload =
  | OnRunStartPayload
  | OnRunCompletePayload
  | OnRunFailPayload
  | OnTaskStartPayload
  | OnTaskCompletePayload
  | OnStepDispatchPayload
  | OnIterationStartPayload
  | OnIterationEndPayload
  | OnBreakpointPayload
  | PreCommitPayload
  | PreBranchPayload
  | PostPlanningPayload
  | OnScorePayload
  | { hookType: string; [key: string]: unknown };

export interface HookDispatcherOptions {
  /**
   * Hook type to execute (e.g., "on-run-start", "pre-commit")
   */
  hookType: HookType;

  /**
   * Payload to pass to hooks (will be JSON.stringify'd and sent via stdin)
   */
  payload: HookPayload;

  /**
   * Working directory for hook execution (defaults to process.cwd())
   */
  cwd?: string;

  /**
   * Timeout in milliseconds for hook execution (defaults to 30000)
   */
  timeout?: number;

  /**
   * Whether to throw on hook execution failures (defaults to false)
   */
  throwOnFailure?: boolean;
}

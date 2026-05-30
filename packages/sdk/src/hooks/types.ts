/**
 * Hook System Types
 * Type definitions for the generalized hook system
 */

// Known hook types (custom hooks are also allowed as any string)
export type KnownHookType =
  // SDK Lifecycle Hooks
  | "on-run-start"
  | "on-run-complete"
  | "on-run-fail"
  | "on-task-start"
  | "on-task-complete"
  | "on-step-dispatch"
  | "on-iteration-start"
  | "on-iteration-end"
  // Canonical hook phases surfaced by hooks-mux / agent-mux.
  | "session.setup"
  | "turn.prompt_expansion"
  | "turn.stop_failure"
  | "tool.after_failure"
  | "tool.after_batch"
  | "task.created"
  | "task.completed"
  | "team.idle"
  | "session.instructions_loaded"
  | "session.config_changed"
  | "message.received"
  | "model.before_request"
  | "model.after_response"
  | "planner.before_tool_selection"
  // Process-Level Hooks
  | "on-breakpoint"
  | "on-permission-denied"
  | "pre-commit"
  | "pre-branch"
  | "post-planning"
  | "on-score";

// HookType accepts any string (including custom hooks)
export type HookType = string;

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
  status: "failed" | "halted";
  error: string;
  reason?: string;
  payload?: Record<string, unknown>;
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

export interface SessionSetupPayload {
  hookType: "session.setup";
  runId?: string;
  trigger?: "init" | "maintenance" | string;
  timestamp: string;
}

export interface TurnPromptExpansionPayload {
  hookType: "turn.prompt_expansion";
  runId?: string;
  expansion_type?: string;
  command_name?: string;
  command_args?: unknown;
  command_source?: string;
  prompt?: string;
  timestamp: string;
}

export interface TurnStopFailurePayload {
  hookType: "turn.stop_failure";
  runId?: string;
  error_type?: string;
  error_message?: string;
  retry_after?: number;
  timestamp: string;
}

export interface ToolAfterFailurePayload {
  hookType: "tool.after_failure";
  runId?: string;
  tool_name?: string;
  tool_input?: unknown;
  error?: unknown;
  error_message?: string;
  exit_code?: number;
  timestamp: string;
}

export interface ToolAfterBatchPayload {
  hookType: "tool.after_batch";
  runId?: string;
  batch_results?: unknown[];
  tool_results?: unknown[];
  timestamp: string;
}

export interface TaskCreatedPayload {
  hookType: "task.created";
  runId: string;
  processId?: string;
  task_id: string;
  task_kind: string;
  task_title?: string;
  task_labels?: string[];
  taskId?: string;
  effectId?: string;
  kind?: string;
  title?: string;
  labels?: string[];
  timestamp: string;
}

export interface TaskCompletedPayload {
  hookType: "task.completed";
  runId: string;
  task_id: string;
  task_kind: string;
  task_status: "ok" | "error" | "timeout" | string;
  task_result?: unknown;
  taskId?: string;
  effectId?: string;
  kind?: string;
  status?: "ok" | "error" | "timeout" | string;
  result?: unknown;
  timestamp: string;
}

export interface TeamIdlePayload {
  hookType: "team.idle";
  runId?: string;
  agent_id?: string;
  agent_type?: string;
  idle_reason?: string;
  timestamp: string;
}

export interface SessionInstructionsLoadedPayload {
  hookType: "session.instructions_loaded";
  runId?: string;
  file_path?: string;
  memory_type?: string;
  load_reason?: string;
  globs?: string[];
  trigger_file_path?: string;
  parent_file_path?: string;
  timestamp: string;
}

export interface SessionConfigChangedPayload {
  hookType: "session.config_changed";
  runId?: string;
  config_path?: string;
  change_type?: string;
  setting_key?: string;
  timestamp: string;
}

export interface MessageReceivedPayload {
  hookType: "message.received";
  runId?: string;
  turn_id?: string;
  message_id?: string;
  index?: number;
  final?: boolean;
  delta?: string;
  timestamp: string;
}

export interface ModelBeforeRequestPayload {
  hookType: "model.before_request";
  runId?: string;
  model?: string;
  request?: unknown;
  timestamp: string;
}

export interface ModelAfterResponsePayload {
  hookType: "model.after_response";
  runId?: string;
  model?: string;
  response?: unknown;
  timestamp: string;
}

export interface PlannerBeforeToolSelectionPayload {
  hookType: "planner.before_tool_selection";
  runId?: string;
  planner?: string;
  tools?: unknown[];
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
  status: "completed" | "halted" | "failed" | "waiting";
  reason?: string;
  payload?: Record<string, unknown>;
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

/**
 * GAP-SEC-003: Payload for on-permission-denied hook.
 * Fires when a breakpoint with kind 'approval' or 'intervention' is denied.
 */
export interface OnPermissionDeniedPayload {
  hookType: "on-permission-denied";
  breakpointId: string;
  title?: string;
  kind: string;
  runId?: string;
  effectId?: string;
  respondedBy?: string;
  feedback?: string;
  timestamp: string;
}

export type HookPayload =
  | OnRunStartPayload
  | OnRunCompletePayload
  | OnRunFailPayload
  | OnTaskStartPayload
  | OnTaskCompletePayload
  | SessionSetupPayload
  | TurnPromptExpansionPayload
  | TurnStopFailurePayload
  | ToolAfterFailurePayload
  | ToolAfterBatchPayload
  | TaskCreatedPayload
  | TaskCompletedPayload
  | TeamIdlePayload
  | SessionInstructionsLoadedPayload
  | SessionConfigChangedPayload
  | MessageReceivedPayload
  | ModelBeforeRequestPayload
  | ModelAfterResponsePayload
  | PlannerBeforeToolSelectionPayload
  | OnStepDispatchPayload
  | OnIterationStartPayload
  | OnIterationEndPayload
  | OnBreakpointPayload
  | OnPermissionDeniedPayload
  | PreCommitPayload
  | PreBranchPayload
  | PostPlanningPayload
  | OnScorePayload
  | { hookType: string; [key: string]: unknown }
  | string;

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

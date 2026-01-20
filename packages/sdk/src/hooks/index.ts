/**
 * Hook System API
 * Public interface for calling hooks from process files
 */

export {
  callHook,
} from "./dispatcher";

export type {
  HookType,
  HookResult,
  HookExecutionResult,
  HookPayload,
  HookDispatcherOptions,
  OnRunStartPayload,
  OnRunCompletePayload,
  OnRunFailPayload,
  OnTaskStartPayload,
  OnTaskCompletePayload,
  OnStepDispatchPayload,
  OnIterationStartPayload,
  OnIterationEndPayload,
  OnBreakpointPayload,
  PreCommitPayload,
  PreBranchPayload,
  PostPlanningPayload,
  OnScorePayload,
} from "./types";

/**
 * Helper function to create hook payloads with proper typing
 */
export function createHookPayload<T extends { hookType: string }>(
  payload: T
): T & { timestamp: string } {
  return {
    ...payload,
    timestamp: new Date().toISOString(),
  };
}

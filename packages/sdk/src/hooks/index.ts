/**
 * Hook System API
 * Public interface for calling hooks from process files
 */

export {
  callHook,
  discoverHooks,
} from "./dispatcher";

export type { DiscoveredHook } from "./dispatcher";

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
  SessionSetupPayload,
  TurnPromptExpansionPayload,
  TurnStopFailurePayload,
  ToolAfterFailurePayload,
  ToolAfterBatchPayload,
  TaskCreatedPayload,
  TaskCompletedPayload,
  TeamIdlePayload,
  SessionInstructionsLoadedPayload,
  SessionConfigChangedPayload,
  MessageReceivedPayload,
  ModelBeforeRequestPayload,
  ModelAfterResponsePayload,
  PlannerBeforeToolSelectionPayload,
  OnStepDispatchPayload,
  OnIterationStartPayload,
  OnIterationEndPayload,
  OnBreakpointPayload,
  OnPermissionDeniedPayload,
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

import type { AgentEvent } from './events.js';
import type { RuntimeHookDispatcher } from './runtime-hook-dispatcher.js';

/** Runtime hook kinds supported by adapters. */
export type RuntimeHookKind =
  | 'preToolUse'
  | 'postToolUse'
  | 'postToolUseFailure'
  | 'postToolBatch'
  | 'sessionStart'
  | 'sessionEnd'
  | 'setup'
  | 'instructionsLoaded'
  | 'configChange'
  | 'stop'
  | 'stopFailure'
  | 'userPromptSubmit'
  | 'userPromptExpansion'
  | 'taskCreated'
  | 'taskCompleted'
  | 'messageDisplay';

/** How an adapter supports a given runtime hook kind. */
export type RuntimeHookMode = 'unsupported' | 'nonblocking' | 'blocking';

/** Adapter capability declaration for runtime hooks. */
export interface RuntimeHookCapabilities {
  preToolUse: RuntimeHookMode;
  postToolUse: RuntimeHookMode;
  postToolUseFailure?: RuntimeHookMode;
  postToolBatch?: RuntimeHookMode;
  sessionStart: RuntimeHookMode;
  sessionEnd: RuntimeHookMode;
  setup?: RuntimeHookMode;
  instructionsLoaded?: RuntimeHookMode;
  configChange?: RuntimeHookMode;
  stop: RuntimeHookMode;
  stopFailure?: RuntimeHookMode;
  userPromptSubmit: RuntimeHookMode;
  userPromptExpansion?: RuntimeHookMode;
  taskCreated?: RuntimeHookMode;
  taskCompleted?: RuntimeHookMode;
  messageDisplay?: RuntimeHookMode;
}

/** Context passed to runtime hook handlers. */
export interface HookContext {
  signal: AbortSignal;
  emit(event: AgentEvent): void | Promise<void>;
}

/** Decision returned by blocking runtime hooks. */
export type HookDecision =
  | {
      decision: 'allow';
    }
  | {
      decision: 'deny';
      reason?: string;
    };

/** Handler invoked before a tool executes. */
export type PreToolUseHook<TPayload = unknown> = (
  payload: TPayload,
  context: HookContext,
) => Promise<HookDecision> | HookDecision;

/** Handler invoked when the user submits a prompt. */
export type UserPromptSubmitHook<TPayload = unknown> = (
  payload: TPayload,
  context: HookContext,
) => Promise<HookDecision> | HookDecision;

/** Handler invoked for non-blocking runtime hook notifications. */
export type NotificationHook<TPayload = unknown> = (
  payload: TPayload,
  context: HookContext,
) => Promise<void> | void;

/** Per-run runtime hooks attached through RunOptions. */
export interface RuntimeHooks {
  preToolUse?: PreToolUseHook;
  postToolUse?: NotificationHook;
  postToolUseFailure?: NotificationHook;
  postToolBatch?: PreToolUseHook;
  sessionStart?: NotificationHook;
  sessionEnd?: NotificationHook;
  setup?: NotificationHook;
  instructionsLoaded?: NotificationHook;
  configChange?: PreToolUseHook;
  stop?: NotificationHook;
  stopFailure?: NotificationHook;
  userPromptSubmit?: UserPromptSubmitHook;
  userPromptExpansion?: UserPromptSubmitHook;
  taskCreated?: PreToolUseHook;
  taskCompleted?: PreToolUseHook;
  messageDisplay?: NotificationHook;
}

/** Optional native harness bridge returned by adapters that support runtime hooks. */
export interface RuntimeHookSetup {
  env?: Record<string, string>;
  cleanup?: () => Promise<void> | void;
}

export type { RuntimeHookDispatcher } from './runtime-hook-dispatcher.js';

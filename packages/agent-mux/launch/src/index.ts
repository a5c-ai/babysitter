/**
 * @a5c-ai/agent-mux-launch
 *
 * Launch orchestration for agent-mux: plan resolution, proxy setup,
 * harness spawning, bridge hooks, and completion engines.
 */

// Core launch command and plan resolution
export {
  launchCommand,
  resolveLaunchPlan,
  LAUNCH_FLAGS,
  PROMPT_ARTIFACT_MONITOR_TIMEOUT_MS,
} from './launch.js';

// Launch plan types
export type {
  LaunchPlanInput,
  ProxyPlan,
  LaunchPlan,
} from './launch.js';

// Bridge hook emulation
export {
  BridgeHookEmulator,
} from './bridge-hooks.js';

export type {
  BridgeHookContext,
  SessionStartResult,
  StopResult,
} from './bridge-hooks.js';

// Completion engine re-exports
export {
  createOpenAICompletionEngine,
  createGoogleCompletionEngine,
} from './completion-engine.js';

// CLI helpers (exit codes, flag utilities)
export {
  ExitCode,
  flagStr,
  flagNum,
  flagBool,
  flagArr,
  printError,
  printJsonError,
} from './cli-helpers.js';

export type {
  ExitCodeValue,
} from './cli-helpers.js';

// Shared types
export type {
  FlagDef,
  ParsedArgs,
  SessionArgs,
} from './types.js';

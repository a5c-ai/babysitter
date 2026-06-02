/**
 * `amux launch` command — thin wrapper.
 *
 * The launch orchestration logic now lives in @a5c-ai/agent-mux-launch.
 * This module re-exports everything for backward compatibility.
 */

export {
  launchCommand,
  resolveLaunchPlan,
  LAUNCH_FLAGS,
  PROMPT_ARTIFACT_MONITOR_TIMEOUT_MS,
} from '@a5c-ai/agent-mux-launch';

export type {
  LaunchPlanInput,
  ProxyPlan,
  LaunchPlan,
} from '@a5c-ai/agent-mux-launch';

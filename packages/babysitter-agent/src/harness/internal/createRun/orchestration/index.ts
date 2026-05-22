/**
 * Compatibility surface for PhaseOrchestration helpers.
 *
 * The implementation lives under ./orchestration/ so the command stays
 * split by responsibility instead of accreting more top-level helper files.
 */

export {
  MAX_CONSECUTIVE_PROCESS_ERROR_STALLS,
  MAX_CONSECUTIVE_STALLS,
  MAX_CONSECUTIVE_TIMEOUTS,
  MAX_PROCESS_ERROR_RECOVERIES,
} from "./constants";
export {
  orchestrateIterationWithProcessLoadRetry,
  readProcessFileFingerprint,
  resolveEffect,
  resolveEffectWithRetry,
  resolveHarnessSessionIdForBinding,
} from "./effects";
export { runExternalOrchestrationPhase } from "./externalPhase";
export { runInternalOrchestrationPhase } from "./internalPhase";
export { subscribeVerbosePiEvents } from "./verbose";

import type { RunOrchestrationPhaseArgs } from "./types";
import { runExternalOrchestrationPhase } from "./externalPhase";
import { runInternalOrchestrationPhase } from "./internalPhase";

export async function runOrchestrationPhase(
  args: RunOrchestrationPhaseArgs,
): Promise<number> {
  const externalExitCode = await runExternalOrchestrationPhase(args);
  if (externalExitCode !== undefined) {
    return externalExitCode;
  }
  return runInternalOrchestrationPhase(args);
}

import type { MergedExecutionResult } from '@a5c-ai/agent-mux-hooks-core';
import { getMappingByNativeHook } from './mappings';

/**
 * Copilot native output shape for pre-tool-use hooks.
 *
 * Only the preTool event actually processes output.
 * permissionDecision supports allow|deny|ask in the schema,
 * but only deny is currently processed by Copilot CLI.
 */
export interface CopilotPreToolOutput {
  permissionDecision?: 'allow' | 'deny' | 'ask';
  reason?: string;
}

/**
 * Copilot native output shape for all other events.
 * Output is ignored by Copilot CLI on non-preTool events,
 * so we emit a minimal success object.
 */
export interface CopilotNoopOutput {
  ok: true;
}

export type CopilotNativeOutput = CopilotPreToolOutput | CopilotNoopOutput;

/**
 * Render a merged execution result into Copilot-native JSON output.
 *
 * Copilot only processes output on preTool events (permissionDecision: deny).
 * All other events get a no-op success response since their output is ignored.
 *
 * @param mergedResult - The merged result from hook handler execution
 * @param nativeEventName - The original native event name
 * @returns JSON-serializable native output
 */
export function renderCopilotOutput(
  mergedResult: MergedExecutionResult,
  nativeEventName: string,
): CopilotNativeOutput {
  const mapping = getMappingByNativeHook(nativeEventName);

  // Only preTool events can block
  if (mapping?.blockCapability && nativeEventName === 'preToolUse') {
    return renderPreToolOutput(mergedResult);
  }

  // All other events: output is ignored by Copilot
  return { ok: true };
}

/**
 * Render output for preTool events.
 *
 * Maps the unified decision to Copilot's permissionDecision field.
 * Only 'deny' is actually processed by Copilot CLI.
 */
function renderPreToolOutput(mergedResult: MergedExecutionResult): CopilotPreToolOutput {
  const output: CopilotPreToolOutput = {};

  if (mergedResult.decision === 'deny') {
    output.permissionDecision = 'deny';
    if (mergedResult.reason) {
      output.reason = mergedResult.reason;
    }
  }
  // allow and ask are in the schema but not processed;
  // omit permissionDecision to let Copilot proceed with default behavior

  return output;
}

/**
 * Serialize Copilot native output to a stdout-ready JSON string.
 */
export function serializeOutput(output: CopilotNativeOutput): string {
  return JSON.stringify(output);
}

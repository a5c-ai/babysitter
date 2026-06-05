import type { GentySessionContext } from "../../../gentySessionContext";
import type { AgentCoreSessionOptions } from "../../../types";
import { bridgeExtensionTools } from "../../../extensionToolBridge";

export function enhanceWorkerSessionOptions(
  opts: AgentCoreSessionOptions,
  gentyCtx: GentySessionContext | undefined | null,
): AgentCoreSessionOptions {
  if (!gentyCtx) return opts;

  const result = { ...opts };

  // Apply AGENTS.md instructions
  if (gentyCtx.instructions.agentInstructions.length > 0) {
    result.appendSystemPrompt = [
      ...(result.appendSystemPrompt ?? []),
      ...gentyCtx.instructions.agentInstructions,
    ];
  }

  // Apply SYSTEM.md
  if (gentyCtx.instructions.systemPromptMode === 'replace' && gentyCtx.instructions.systemPrompt) {
    result.systemPrompt = gentyCtx.instructions.systemPrompt;
  } else if (gentyCtx.instructions.systemPromptMode === 'append' && gentyCtx.instructions.systemPrompt) {
    result.appendSystemPrompt = [
      ...(result.appendSystemPrompt ?? []),
      gentyCtx.instructions.systemPrompt,
    ];
  }

  // Bridge extension tools
  const extensionTools = bridgeExtensionTools(gentyCtx.extensionRegistry);
  if (extensionTools.length > 0) {
    result.customTools = [...(result.customTools ?? []), ...extensionTools];
  }

  // Use model switch state if no explicit model override
  if (!result.model && gentyCtx.modelSwitch.currentModel) {
    result.model = gentyCtx.modelSwitch.currentModel;
  }

  return result;
}

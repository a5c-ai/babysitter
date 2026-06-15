import type { GentySessionContext } from './gentySessionContext.js';
import type { AgentCoreSessionOptions } from './types.js';
import type { TrustContext } from '../trust/harness-signing.js';
import { bridgeExtensionTools } from './extensionToolBridge.js';

export function applyInstructionsToSessionOptions(
  ctx: GentySessionContext,
  opts: AgentCoreSessionOptions,
): AgentCoreSessionOptions {
  const result = { ...opts };

  // SYSTEM.md
  if (ctx.instructions.systemPromptMode === 'replace' && ctx.instructions.systemPrompt) {
    result.systemPrompt = ctx.instructions.systemPrompt;
  } else if (ctx.instructions.systemPromptMode === 'append' && ctx.instructions.systemPrompt) {
    result.appendSystemPrompt = [
      ...(result.appendSystemPrompt ?? []),
      ctx.instructions.systemPrompt,
    ];
  }

  // AGENTS.md content appended as system prompt sections
  if (ctx.instructions.agentInstructions.length > 0) {
    result.appendSystemPrompt = [
      ...(result.appendSystemPrompt ?? []),
      ...ctx.instructions.agentInstructions,
    ];
  }

  return result;
}

export function applyExtensionToolsToSessionOptions(
  ctx: GentySessionContext,
  opts: AgentCoreSessionOptions,
): AgentCoreSessionOptions {
  const extensionTools = bridgeExtensionTools(ctx.extensionRegistry);
  if (extensionTools.length === 0) return opts;

  return {
    ...opts,
    customTools: [...(opts.customTools ?? []), ...extensionTools],
  };
}

export async function applyDynamicContextToMessages(
  ctx: GentySessionContext,
  messages: Array<{ role: string; content: string }>,
  turnNumber: number,
): Promise<Array<{ role: string; content: string }>> {
  const injections = await ctx.dynamicContext.collectInjections({
    sessionId: ctx.sessionId,
    turnNumber,
    messageHistory: messages,
    pendingTools: [],
  });
  if (injections.length === 0) return messages;
  return ctx.dynamicContext.applyInjections(injections, messages);
}

export function drainSteeringMessages(
  ctx: GentySessionContext,
): string | undefined {
  const messages = ctx.steeringQueue.drain();
  if (messages.length === 0) return undefined;
  return messages.map(m => `[${m.type}] ${m.content}`).join('\n');
}

export function getTrustContext(ctx: GentySessionContext): TrustContext {
  return {
    keyPair: ctx.keyPair,
    agentId: ctx.agentId,
    sessionId: ctx.sessionId,
  };
}

export function getCurrentModel(ctx: GentySessionContext): string {
  return ctx.modelSwitch.currentModel;
}

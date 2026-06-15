import type { UnifiedHookResult } from '../types/result';
import type { AgentHandlerRef } from '../types/plan';
import { HandlerError } from '../normalizer/errors';
import { ensureDepth, parseHandlerResult, withTimeout, type HandlerRuntimeContext } from './shared';

export interface AgentExecutionRequest {
  prompt: string;
  agent?: string;
  model?: string;
  maxTurns: number;
}

export type AgentExecutor = (
  request: AgentExecutionRequest,
  context: HandlerRuntimeContext,
) => Promise<UnifiedHookResult | string | Record<string, unknown>> | UnifiedHookResult | string | Record<string, unknown>;

export async function runAgentHandler(
  ref: AgentHandlerRef,
  context: HandlerRuntimeContext,
  executor?: AgentExecutor,
): Promise<UnifiedHookResult> {
  ensureDepth(context.currentDepth, ref.maxDepth, 'agent', ref.agent ?? 'agent', 'AGENT_DEPTH_EXCEEDED');

  if (!executor) {
    throw new HandlerError('agent handler requires an injected executor', {
      source: ref.agent ?? 'agent',
      handler: 'agent',
      code: 'AGENT_EXECUTOR_MISSING',
    });
  }

  try {
    const result = await withTimeout(ref.agent ?? 'agent', 'agent', context.timeoutMs, (signal) => executor({
      prompt: ref.prompt,
      agent: ref.agent,
      model: ref.model,
      maxTurns: Math.max(1, Math.min(ref.maxTurns ?? 1, 10)),
    }, { ...context, signal }));

    return parseHandlerResult(result);
  } catch (err) {
    if (err instanceof HandlerError) {
      throw err;
    }
    throw new HandlerError(
      err instanceof Error ? err.message : String(err),
      {
        source: ref.agent ?? 'agent',
        handler: 'agent',
        code: 'AGENT_HANDLER_ERROR',
        cause: err,
      },
    );
  }
}

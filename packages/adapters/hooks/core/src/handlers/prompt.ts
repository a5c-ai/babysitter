import type { UnifiedHookResult } from '../types/result';
import type { PromptHandlerRef } from '../types/plan';
import { HandlerError } from '../normalizer/errors';
import { ensureDepth, parseHandlerResult, withTimeout, type HandlerRuntimeContext } from './shared';

export interface PromptExecutionRequest {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  maxOutputBytes?: number;
}

export type PromptExecutor = (
  request: PromptExecutionRequest,
  context: HandlerRuntimeContext,
) => Promise<UnifiedHookResult | string | Record<string, unknown>> | UnifiedHookResult | string | Record<string, unknown>;

export async function runPromptHandler(
  ref: PromptHandlerRef,
  context: HandlerRuntimeContext,
  executor?: PromptExecutor,
): Promise<UnifiedHookResult> {
  ensureDepth(context.currentDepth, ref.maxDepth, 'prompt', 'prompt', 'PROMPT_DEPTH_EXCEEDED');

  if (!executor) {
    throw new HandlerError('prompt handler requires an injected executor', {
      source: 'prompt',
      handler: 'prompt',
      code: 'PROMPT_EXECUTOR_MISSING',
    });
  }

  try {
    const result = await withTimeout('prompt', 'prompt', context.timeoutMs, (signal) => executor({
      prompt: ref.prompt,
      model: ref.model,
      systemPrompt: ref.systemPrompt,
      maxOutputBytes: ref.maxOutputBytes,
    }, { ...context, signal }));

    return parseHandlerResult(result);
  } catch (err) {
    if (err instanceof HandlerError) {
      throw err;
    }
    throw new HandlerError(
      err instanceof Error ? err.message : String(err),
      {
        source: 'prompt',
        handler: 'prompt',
        code: 'PROMPT_HANDLER_ERROR',
        cause: err,
      },
    );
  }
}

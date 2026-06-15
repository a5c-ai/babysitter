import type { UnifiedHookEvent } from '../types/event';
import type { UnifiedHookResult } from '../types/result';
import { HandlerError, HandlerTimeoutError } from '../normalizer/errors';

export interface HandlerRuntimeContext {
  event: UnifiedHookEvent;
  timeoutMs: number;
  signal?: AbortSignal;
  currentDepth: number;
}

export function parseHandlerResult(value: unknown): UnifiedHookResult {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return { decision: 'noop' };
    }
    try {
      return JSON.parse(trimmed) as UnifiedHookResult;
    } catch {
      return { decision: 'noop', reason: trimmed };
    }
  }

  if (value && typeof value === 'object') {
    return value as UnifiedHookResult;
  }

  return { decision: 'noop', reason: value == null ? undefined : String(value) };
}

export function ensureDepth(currentDepth: number, maxDepth: number | undefined, source: string, handler: string, code: string): void {
  const limit = maxDepth ?? 1;
  if (currentDepth >= limit) {
    throw new HandlerError(
      `Handler ${source}:${handler} exceeded maxDepth ${limit}`,
      { source, handler, code },
    );
  }
}

export async function withTimeout<T>(
  source: string,
  handler: string,
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T> | T,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new HandlerTimeoutError({ source, handler, timeoutMs }));
    }, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(operation(controller.signal)), timeoutPromise]);
  } catch (err) {
    if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw new HandlerTimeoutError({ source, handler, timeoutMs });
    }
    throw err;
  } finally {
    clearTimeout(timeout!);
  }
}

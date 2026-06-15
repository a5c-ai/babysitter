/**
 * Hook middleware types for the programmatic engine.
 *
 * Middleware follows an Express/Koa-style pattern: each middleware
 * receives the event and a `next` function, and can transform the
 * event before calling next or transform the result after.
 */

import type { UnifiedHookEvent } from '../types/event';
import type { UnifiedHookResult } from '../types/result';

/**
 * Hook middleware -- transforms events or results in the processing pipeline.
 *
 * Call `next()` to continue to the next middleware (or the core handler
 * execution). Return a `UnifiedHookResult` to short-circuit or transform
 * the pipeline output.
 *
 * Example (logging middleware):
 * ```typescript
 * const loggingMiddleware: HookMiddleware = async (event, next) => {
 *   console.log(`[${event.phase}] Processing...`);
 *   const result = await next();
 *   console.log(`[${event.phase}] Decision: ${result.decision}`);
 *   return result;
 * };
 * ```
 *
 * Example (rate limiting):
 * ```typescript
 * const rateLimiter: HookMiddleware = async (event, next) => {
 *   if (isRateLimited(event.execution.sessionId)) {
 *     return { decision: 'deny', reason: 'Rate limited' };
 *   }
 *   return next();
 * };
 * ```
 */
export type HookMiddleware = (
  event: UnifiedHookEvent,
  next: () => Promise<UnifiedHookResult>,
) => Promise<UnifiedHookResult>;

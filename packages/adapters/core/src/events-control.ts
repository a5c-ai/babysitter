/**
 * Rate limits, run lifecycle / control, error, and debug events.
 *
 * Split out of events.ts for file-size hygiene; re-exported from events.ts
 * so the public surface `import { ... } from './events.js'` is unchanged.
 */

import type { ErrorCode } from './types.js';
import type { BaseEvent } from './types.js';

// ---------------------------------------------------------------------------
// 4 — Rate / context limit events
// ---------------------------------------------------------------------------

export interface RateLimitedEvent extends BaseEvent {
  type: 'rate_limited';
  retryAfterMs?: number;
}

export interface ContextLimitWarningEvent extends BaseEvent {
  type: 'context_limit_warning';
  usedTokens: number;
  maxTokens: number;
  pctUsed: number;
}

export interface ContextCompactedEvent extends BaseEvent {
  type: 'context_compacted';
  summary: string;
  tokensSaved: number;
}

export interface RetryEvent extends BaseEvent {
  type: 'retry';
  attempt: number;
  maxAttempts: number;
  reason: string;
  delayMs: number;
}

// ---------------------------------------------------------------------------
// 7 — Run lifecycle / control events
// ---------------------------------------------------------------------------

export interface InterruptedEvent extends BaseEvent {
  type: 'interrupted';
}

export interface AbortedEvent extends BaseEvent {
  type: 'aborted';
}

export interface PausedEvent extends BaseEvent {
  type: 'paused';
}

export interface ResumedEvent extends BaseEvent {
  type: 'resumed';
}

export interface TimeoutEvent extends BaseEvent {
  type: 'timeout';
  kind: 'run' | 'inactivity';
}

export interface TurnLimitEvent extends BaseEvent {
  type: 'turn_limit';
  maxTurns: number;
}

export interface StreamFallbackEvent extends BaseEvent {
  type: 'stream_fallback';
  capability: 'text' | 'tool_calls' | 'thinking';
  reason: string;
}

// ---------------------------------------------------------------------------
// 5 — Error events
// ---------------------------------------------------------------------------

export interface AuthErrorEvent extends BaseEvent {
  type: 'auth_error';
  message: string;
  guidance: string;
}

export interface RateLimitErrorEvent extends BaseEvent {
  type: 'rate_limit_error';
  message: string;
  retryAfterMs?: number;
}

export interface ContextExceededEvent extends BaseEvent {
  type: 'context_exceeded';
  usedTokens: number;
  maxTokens: number;
}

export interface CrashEvent extends BaseEvent {
  type: 'crash';
  exitCode: number;
  stderr: string;
}

export interface ErrorEvent extends BaseEvent {
  type: 'error';
  code: ErrorCode;
  message: string;
  recoverable: boolean;
}

// ---------------------------------------------------------------------------
// 2 — Debug events
// ---------------------------------------------------------------------------

export interface DebugEvent extends BaseEvent {
  type: 'debug';
  level: 'verbose' | 'info' | 'warn';
  message: string;
}

export interface LogEvent extends BaseEvent {
  type: 'log';
  source: 'stdout' | 'stderr';
  line: string;
}

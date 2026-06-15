/**
 * Error scenarios: rate-limit, auth-required, crash, timeout, oom.
 *
 * Each scenario emits wire output whose parsed AgentEvent has a specific
 * error code, or exits abnormally so onProcessExit/onTimeout surface the
 * appropriate code.
 */

import type { HarnessScenario } from '../types.js';
import { claudeError, codexError, geminiError, stderrChunk, stdoutChunk } from './wire-format.js';

// Adapters map any `type:error` line to `code: 'INTERNAL'`. To exercise
// RATE_LIMITED / AUTH_ERROR paths in tests we expose both the wire output
// and the expected mapped code so the integration test can decide which
// path it wants to assert.

export interface ErrorScenarioMeta {
  /** Scenario to spawn. */
  scenario: HarnessScenario;
  /** The error code a caller should classify this run as, after combining
   *  wire events and process exit. */
  expectedCode: 'RATE_LIMITED' | 'AUTH_ERROR' | 'AGENT_CRASH' | 'TIMEOUT' | 'INTERNAL';
}

export const rateLimitClaude: ErrorScenarioMeta = {
  scenario: {
    harness: 'claude-code',
    name: 'error:rate-limit',
    process: { exitCode: 1 },
    output: [
      stdoutChunk(claudeError('Rate limit exceeded. Please retry after 60 seconds.'), 10),
      stderrChunk('HTTP 429 Too Many Requests\n', 5),
    ],
  },
  expectedCode: 'RATE_LIMITED',
};

export const authRequiredCodex: ErrorScenarioMeta = {
  scenario: {
    harness: 'codex',
    name: 'error:auth-required',
    process: { exitCode: 1 },
    output: [
      stdoutChunk(codexError('Missing OPENAI_API_KEY. Please authenticate.'), 10),
      stderrChunk('auth: unauthorized\n', 5),
    ],
  },
  expectedCode: 'AUTH_ERROR',
};

export const crashClaude: ErrorScenarioMeta = {
  scenario: {
    harness: 'claude-code',
    name: 'error:crash',
    process: { exitCode: 1, crashAfterMs: 80, crashSignal: 'SIGTERM' },
    output: [
      stderrChunk('segfault\n', 20),
    ],
  },
  expectedCode: 'AGENT_CRASH',
};

export const timeoutGemini: ErrorScenarioMeta = {
  scenario: {
    harness: 'gemini',
    name: 'error:timeout',
    process: { exitCode: 0, hang: true },
    output: [
      stdoutChunk(geminiError('Working...'), 10),
    ],
  },
  expectedCode: 'TIMEOUT',
};

export const oomClaude: ErrorScenarioMeta = {
  scenario: {
    harness: 'claude-code',
    name: 'error:oom',
    process: { exitCode: 137, crashAfterMs: 60, crashSignal: 'SIGKILL' },
    output: [
      stderrChunk('FATAL ERROR: Reached heap limit\n', 20),
    ],
  },
  expectedCode: 'AGENT_CRASH',
};

export const ERROR_SCENARIOS: Record<string, ErrorScenarioMeta> = {
  'rate-limit': rateLimitClaude,
  'auth-required': authRequiredCodex,
  'crash': crashClaude,
  'timeout': timeoutGemini,
  'oom': oomClaude,
};

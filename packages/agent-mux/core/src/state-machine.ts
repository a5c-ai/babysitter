/**
 * Run state machine for @a5c-ai/agent-mux.
 *
 * Defines the 9 RunState values, valid transition map, terminal state set,
 * and guard helpers used by RunHandleImpl.
 */

import { AgentMuxError } from './errors.js';

// ---------------------------------------------------------------------------
// RunState
// ---------------------------------------------------------------------------

/**
 * All valid states for an agent run.
 *
 * States are mutually exclusive; every run is in exactly one state at a time.
 * Terminal states are absorbing — no transitions out.
 */
export type RunState =
  | 'spawned'       // Process spawn initiated, not yet confirmed alive
  | 'running'       // Process is alive and producing output
  | 'paused'        // Process suspended (SIGTSTP / SuspendThread)
  | 'interrupted'   // SIGINT sent; waiting for agent response
  | 'aborted'       // SIGTERM/SIGKILL sequence initiated
  | 'timed-out'     // Timeout or inactivity timeout expired
  | 'completed'     // Process exited with code 0
  | 'crashed'       // Process exited with non-zero code
  | 'killed';       // Process killed by external signal

// ---------------------------------------------------------------------------
// Terminal states
// ---------------------------------------------------------------------------

/** Set of states from which no further transitions are possible. */
export const TERMINAL_STATES: ReadonlySet<RunState> = new Set<RunState>([
  'aborted',
  'timed-out',
  'completed',
  'crashed',
  'killed',
]);

// ---------------------------------------------------------------------------
// Valid transitions
// ---------------------------------------------------------------------------

/**
 * Map of (fromState -> Set<toState>) defining all legal state transitions.
 *
 * Transitions not listed here are invalid and will throw
 * AgentMuxError('INVALID_STATE_TRANSITION', ...).
 */
export const VALID_TRANSITIONS: ReadonlyMap<RunState, ReadonlySet<RunState>> = new Map<RunState, ReadonlySet<RunState>>([
  ['spawned', new Set<RunState>(['running', 'crashed', 'timed-out', 'aborted'])],
  ['running', new Set<RunState>(['paused', 'interrupted', 'aborted', 'timed-out', 'completed', 'crashed', 'killed'])],
  ['paused',  new Set<RunState>(['running', 'aborted', 'timed-out'])],
  ['interrupted', new Set<RunState>(['running', 'completed', 'crashed', 'aborted'])],
  // Terminal states — no outgoing transitions
  ['aborted',   new Set<RunState>()],
  ['timed-out', new Set<RunState>()],
  ['completed', new Set<RunState>()],
  ['crashed',   new Set<RunState>()],
  ['killed',    new Set<RunState>()],
]);

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns true when the state is terminal (no transitions out).
 */
export function isTerminal(state: RunState): boolean {
  return TERMINAL_STATES.has(state);
}

/**
 * Assert that transitioning from `from` to `to` is valid.
 *
 * @throws {AgentMuxError} code `INVALID_STATE_TRANSITION` when the transition
 *         is not in the VALID_TRANSITIONS map.
 */
export function assertTransition(from: RunState, to: RunState): void {
  const allowed = VALID_TRANSITIONS.get(from);
  if (!allowed || !allowed.has(to)) {
    throw new AgentMuxError(
      'INVALID_STATE_TRANSITION',
      `Cannot transition run state from '${from}' to '${to}'`,
      false,
    );
  }
}

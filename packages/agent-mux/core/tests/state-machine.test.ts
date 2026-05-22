import { describe, it, expect } from 'vitest';
import {
  type RunState,
  TERMINAL_STATES,
  VALID_TRANSITIONS,
  isTerminal,
  assertTransition,
} from '../src/state-machine.js';
import { AgentMuxError } from '../src/errors.js';

describe('RunState', () => {
  const allStates: RunState[] = [
    'spawned', 'running', 'paused', 'interrupted',
    'aborted', 'timed-out', 'completed', 'crashed', 'killed',
  ];

  describe('TERMINAL_STATES', () => {
    it('contains exactly the 5 terminal states', () => {
      expect(TERMINAL_STATES.size).toBe(5);
      expect(TERMINAL_STATES.has('aborted')).toBe(true);
      expect(TERMINAL_STATES.has('timed-out')).toBe(true);
      expect(TERMINAL_STATES.has('completed')).toBe(true);
      expect(TERMINAL_STATES.has('crashed')).toBe(true);
      expect(TERMINAL_STATES.has('killed')).toBe(true);
    });

    it('does not contain non-terminal states', () => {
      expect(TERMINAL_STATES.has('spawned')).toBe(false);
      expect(TERMINAL_STATES.has('running')).toBe(false);
      expect(TERMINAL_STATES.has('paused')).toBe(false);
      expect(TERMINAL_STATES.has('interrupted')).toBe(false);
    });
  });

  describe('VALID_TRANSITIONS', () => {
    it('has entries for all 9 states', () => {
      expect(VALID_TRANSITIONS.size).toBe(9);
      for (const state of allStates) {
        expect(VALID_TRANSITIONS.has(state)).toBe(true);
      }
    });

    it('terminal states have no outgoing transitions', () => {
      for (const state of ['aborted', 'timed-out', 'completed', 'crashed', 'killed'] as RunState[]) {
        expect(VALID_TRANSITIONS.get(state)!.size).toBe(0);
      }
    });

    it('spawned can transition to running, crashed, timed-out, aborted', () => {
      const from = VALID_TRANSITIONS.get('spawned')!;
      expect(from.has('running')).toBe(true);
      expect(from.has('crashed')).toBe(true);
      expect(from.has('timed-out')).toBe(true);
      expect(from.has('aborted')).toBe(true);
      expect(from.has('paused')).toBe(false);
    });

    it('running has broad transitions', () => {
      const from = VALID_TRANSITIONS.get('running')!;
      expect(from.has('paused')).toBe(true);
      expect(from.has('interrupted')).toBe(true);
      expect(from.has('aborted')).toBe(true);
      expect(from.has('completed')).toBe(true);
      expect(from.has('crashed')).toBe(true);
      expect(from.has('killed')).toBe(true);
      expect(from.has('timed-out')).toBe(true);
    });

    it('paused can resume or be aborted/timed-out', () => {
      const from = VALID_TRANSITIONS.get('paused')!;
      expect(from.has('running')).toBe(true);
      expect(from.has('aborted')).toBe(true);
      expect(from.has('timed-out')).toBe(true);
    });

    it('interrupted can resume, complete, crash, or abort', () => {
      const from = VALID_TRANSITIONS.get('interrupted')!;
      expect(from.has('running')).toBe(true);
      expect(from.has('completed')).toBe(true);
      expect(from.has('crashed')).toBe(true);
      expect(from.has('aborted')).toBe(true);
    });
  });

  describe('isTerminal', () => {
    it('returns true for terminal states', () => {
      expect(isTerminal('completed')).toBe(true);
      expect(isTerminal('aborted')).toBe(true);
      expect(isTerminal('crashed')).toBe(true);
      expect(isTerminal('killed')).toBe(true);
      expect(isTerminal('timed-out')).toBe(true);
    });

    it('returns false for non-terminal states', () => {
      expect(isTerminal('spawned')).toBe(false);
      expect(isTerminal('running')).toBe(false);
      expect(isTerminal('paused')).toBe(false);
      expect(isTerminal('interrupted')).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('does not throw for valid transitions', () => {
      expect(() => assertTransition('spawned', 'running')).not.toThrow();
      expect(() => assertTransition('running', 'completed')).not.toThrow();
      expect(() => assertTransition('running', 'paused')).not.toThrow();
      expect(() => assertTransition('paused', 'running')).not.toThrow();
    });

    it('throws INVALID_STATE_TRANSITION for invalid transitions', () => {
      expect(() => assertTransition('spawned', 'paused')).toThrow(AgentMuxError);
      expect(() => assertTransition('completed', 'running')).toThrow(AgentMuxError);
      expect(() => assertTransition('paused', 'completed')).toThrow(AgentMuxError);
    });

    it('throws with correct error code', () => {
      try {
        assertTransition('completed', 'running');
        expect.unreachable('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(AgentMuxError);
        expect((e as AgentMuxError).code).toBe('INVALID_STATE_TRANSITION');
      }
    });

    it('throws for transitions from terminal states', () => {
      for (const terminal of ['aborted', 'timed-out', 'completed', 'crashed', 'killed'] as RunState[]) {
        for (const target of allStates) {
          if (target === terminal) continue;
          expect(() => assertTransition(terminal, target)).toThrow();
        }
      }
    });
  });
});

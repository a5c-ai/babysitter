import { describe, it, expect } from 'vitest';
import { resolveInteractionUxHints } from '../interactionRouter';
import type { InteractionKind } from '@a5c-ai/babysitter-sdk';

describe('GAP-SEC-003: Interaction UX Routing', () => {
  describe('resolveInteractionUxHints', () => {
    const ALL_KINDS: InteractionKind[] = [
      'clarification', 'approval', 'intervention', 'notification', 'handoff',
    ];

    it('returns correct hints for clarification', () => {
      const hints = resolveInteractionUxHints('clarification');
      expect(hints.urgency).toBe('low');
      expect(hints.requiresDecision).toBe(true);
      expect(hints.presentAlwaysApprove).toBe(false);
      expect(hints.defaultAutoApprove).toBe(false);
      expect(hints.uiStyle).toBe('qa');
    });

    it('returns correct hints for approval', () => {
      const hints = resolveInteractionUxHints('approval');
      expect(hints.urgency).toBe('medium');
      expect(hints.requiresDecision).toBe(true);
      expect(hints.presentAlwaysApprove).toBe(true);
      expect(hints.defaultAutoApprove).toBe(false);
      expect(hints.uiStyle).toBe('confirm');
    });

    it('returns correct hints for intervention', () => {
      const hints = resolveInteractionUxHints('intervention');
      expect(hints.urgency).toBe('high');
      expect(hints.requiresDecision).toBe(true);
      expect(hints.presentAlwaysApprove).toBe(false);
      expect(hints.defaultAutoApprove).toBe(false);
      expect(hints.uiStyle).toBe('alert');
    });

    it('returns correct hints for notification', () => {
      const hints = resolveInteractionUxHints('notification');
      expect(hints.urgency).toBe('low');
      expect(hints.requiresDecision).toBe(false);
      expect(hints.presentAlwaysApprove).toBe(false);
      expect(hints.defaultAutoApprove).toBe(true);
      expect(hints.uiStyle).toBe('banner');
    });

    it('returns correct hints for handoff', () => {
      const hints = resolveInteractionUxHints('handoff');
      expect(hints.urgency).toBe('low');
      expect(hints.requiresDecision).toBe(false);
      expect(hints.presentAlwaysApprove).toBe(false);
      expect(hints.defaultAutoApprove).toBe(false);
      expect(hints.uiStyle).toBe('summary');
    });

    it('notification is the only kind with defaultAutoApprove === true', () => {
      for (const kind of ALL_KINDS) {
        const hints = resolveInteractionUxHints(kind);
        if (kind === 'notification') {
          expect(hints.defaultAutoApprove).toBe(true);
        } else {
          expect(hints.defaultAutoApprove).toBe(false);
        }
      }
    });

    it('approval is the only kind with presentAlwaysApprove === true', () => {
      for (const kind of ALL_KINDS) {
        const hints = resolveInteractionUxHints(kind);
        if (kind === 'approval') {
          expect(hints.presentAlwaysApprove).toBe(true);
        } else {
          expect(hints.presentAlwaysApprove).toBe(false);
        }
      }
    });

    it('intervention is the only kind with urgency high', () => {
      for (const kind of ALL_KINDS) {
        const hints = resolveInteractionUxHints(kind);
        expect(hints).toBeDefined();
        if (kind === 'intervention') {
          expect(hints!.urgency).toBe('high');
        } else {
          expect(hints!.urgency).not.toBe('high');
        }
      }
    });

    it('returns undefined for unknown kind at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hints = resolveInteractionUxHints('unknown-kind' as any);
      expect(hints).toBeUndefined();
    });
  });
});

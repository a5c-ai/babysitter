/**
 * GAP-SEC-003: Interaction UX Routing
 *
 * Maps InteractionKind values to UX hints that harness adapters
 * consume for kind-appropriate rendering.
 *
 * @module interaction/interactionRouter
 */

import type { InteractionKind } from '@a5c-ai/babysitter-sdk';

/**
 * UX hints for rendering a specific interaction kind.
 */
export interface InteractionUxHints {
  urgency: 'low' | 'medium' | 'high';
  requiresDecision: boolean;
  presentAlwaysApprove: boolean;
  defaultAutoApprove: boolean;
  uiStyle: 'qa' | 'confirm' | 'alert' | 'banner' | 'summary';
}

const HINTS_MAP: Record<InteractionKind, InteractionUxHints> = {
  clarification: {
    urgency: 'low',
    requiresDecision: true,
    presentAlwaysApprove: false,
    defaultAutoApprove: false,
    uiStyle: 'qa',
  },
  approval: {
    urgency: 'medium',
    requiresDecision: true,
    presentAlwaysApprove: true,
    defaultAutoApprove: false,
    uiStyle: 'confirm',
  },
  intervention: {
    urgency: 'high',
    requiresDecision: true,
    presentAlwaysApprove: false,
    defaultAutoApprove: false,
    uiStyle: 'alert',
  },
  notification: {
    urgency: 'low',
    requiresDecision: false,
    presentAlwaysApprove: false,
    defaultAutoApprove: true,
    uiStyle: 'banner',
  },
  handoff: {
    urgency: 'low',
    requiresDecision: false,
    presentAlwaysApprove: false,
    defaultAutoApprove: false,
    uiStyle: 'summary',
  },
};

/**
 * Resolve UX hints for a given interaction kind.
 * Pure function — no I/O.
 */
export function resolveInteractionUxHints(kind: InteractionKind): InteractionUxHints | undefined {
  return HINTS_MAP[kind];
}

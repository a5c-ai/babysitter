/**
 * Permission event propagation: formatting for different output targets
 * and configuration for which event kinds propagate to which targets.
 */

import type { PermissionEvent } from './permissionEvents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropagationTarget {
  name: string;
  kinds: string[];
}

export interface PropagationConfig {
  targets: PropagationTarget[];
}

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

function colorForAction(action: string): string {
  switch (action) {
    case 'block':
      return RED;
    case 'allow':
      return GREEN;
    case 'prompt':
      return YELLOW;
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatPermissionForTui(event: PermissionEvent): string {
  const color = colorForAction(event.decision.action);
  const target = event.operation.target ?? '';
  return `${color}[${event.decision.action}]${RESET} ${event.kind} ${target}`;
}

export function formatPermissionForJsonStream(event: PermissionEvent): PermissionEvent {
  // Return a clean copy with all fields — already JSON-serializable
  return { ...event };
}

export function formatPermissionForCli(event: PermissionEvent): string {
  const target = event.operation.target ?? '';
  return `${event.decision.action} ${event.kind} ${target}`;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function createPropagationConfig(targets: PropagationTarget[]): PropagationConfig {
  return { targets };
}

export function shouldPropagate(
  event: PermissionEvent,
  targetName: string,
  config: PropagationConfig,
): boolean {
  const target = config.targets.find((t) => t.name === targetName);
  if (!target) return false;
  return target.kinds.includes(event.kind);
}

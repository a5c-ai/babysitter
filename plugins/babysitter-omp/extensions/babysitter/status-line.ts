/**
 * Status line integration for babysitter orchestration state.
 *
 * Provides a compact, single-line summary of the active babysitter run
 * suitable for display in oh-my-pi's persistent status bar area.
 *
 * @module status-line
 */

import type { RunState } from './session-binder.js';

/**
 * Update the oh-my-pi status bar with the current babysitter run state.
 *
 * @param runState - The current {@link RunState}, or `null` when no run is active.
 * @param pi       - The oh-my-pi extension API handle (must expose `setStatus`).
 */
export function updateStatusLine(runState: RunState | null, pi: any): void {
  if (!runState) {
    pi.setStatus('babysitter', 'Babysitter: idle');
    return;
  }

  switch (runState.status) {
    case 'completed':
      pi.setStatus('babysitter', 'Babysitter: done');
      break;
    case 'failed':
      pi.setStatus('babysitter', 'Babysitter: FAILED');
      break;
    case 'running': {
      const elapsedMs = Date.now() - new Date(runState.startedAt).getTime();
      const elapsedMin = Math.floor(elapsedMs / 60_000);
      const pending = (runState as any).pendingEffectCount ?? 0;
      pi.setStatus(
        'babysitter',
        `Babysitter: iter ${runState.iteration} | pending ${pending} | ${elapsedMin}m`,
      );
      break;
    }
    default:
      pi.setStatus('babysitter', 'Babysitter: idle');
      break;
  }
}

/**
 * Clear the babysitter status line (e.g. on session shutdown).
 *
 * @param pi - The oh-my-pi extension API handle.
 */
export function clearStatusLine(pi: any): void {
  pi.setStatus('babysitter', '');
}

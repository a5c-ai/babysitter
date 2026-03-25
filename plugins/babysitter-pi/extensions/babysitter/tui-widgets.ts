/**
 * TUI widget rendering for babysitter orchestration state.
 *
 * Renders run progress, pending effects, and quality scores into
 * oh-my-pi's widget panels via `pi.setWidget(key, lines[])` so the
 * user can monitor babysitter activity without leaving the terminal.
 *
 * @module tui-widgets
 */

import type { RunState } from './session-binder.js';

// ---------------------------------------------------------------------------
// Widget keys
// ---------------------------------------------------------------------------

const WIDGET_KEY_RUN = 'babysitter:run';
const WIDGET_KEY_EFFECTS = 'babysitter:effects';
const WIDGET_KEY_QUALITY = 'babysitter:quality';

// ---------------------------------------------------------------------------
// formatElapsed
// ---------------------------------------------------------------------------

/**
 * Format elapsed time from an ISO-8601 timestamp to a human-readable string.
 *
 * Returns the most compact representation that still conveys the duration:
 * - Under a minute: `"42s"`
 * - Under an hour:  `"5m 32s"`
 * - An hour or more: `"1h 12m 5s"`
 *
 * @param startedAt - ISO-8601 timestamp string.
 * @returns A formatted duration string.
 */
export function formatElapsed(startedAt: string): string {
  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// ---------------------------------------------------------------------------
// renderRunWidget
// ---------------------------------------------------------------------------

/**
 * Render the babysitter run progress widget.
 *
 * Displays the run ID, process ID, current iteration/status, and elapsed
 * time as a set of compact lines in the `"babysitter:run"` widget panel.
 *
 * @param runState - The current {@link RunState} snapshot.
 * @param pi       - The oh-my-pi extension API handle (must expose `setWidget`).
 */
export function renderRunWidget(runState: RunState, pi: any): void {
  const elapsed = formatElapsed(runState.startedAt);
  const statusLabel = runState.status ?? 'unknown';

  const lines: string[] = [
    `Babysitter Run: ${runState.runId}`,
    `Process: ${runState.processId}`,
    `Iteration: ${runState.iteration}/${runState.maxIterations} | Status: ${statusLabel}`,
    `Elapsed: ${elapsed}`,
  ];

  pi.setWidget(WIDGET_KEY_RUN, lines);
}

// ---------------------------------------------------------------------------
// renderEffectsWidget
// ---------------------------------------------------------------------------

/**
 * Render the pending effects widget.
 *
 * Shows a compact list of effects currently awaiting resolution. Each
 * effect is expected to have at least a `kind` property; a `title` or
 * `label` property is used for the human-readable description when
 * available.
 *
 * @param effects - Array of effect descriptors (objects with `kind` and
 *                  optionally `title` / `label` / `taskId` fields).
 * @param pi      - The oh-my-pi extension API handle.
 */
export function renderEffectsWidget(effects: any[], pi: any): void {
  if (!effects || effects.length === 0) {
    pi.setWidget(WIDGET_KEY_EFFECTS, ['Pending Effects (0)']);
    return;
  }

  const header = `Pending Effects (${effects.length}):`;
  const itemLines = effects.map((effect: any) => {
    const kind: string = effect.kind ?? 'unknown';
    const title: string = effect.title ?? effect.label ?? effect.taskId ?? kind;
    return `  [${kind}] ${title}`;
  });

  pi.setWidget(WIDGET_KEY_EFFECTS, [header, ...itemLines]);
}

// ---------------------------------------------------------------------------
// renderQualityWidget
// ---------------------------------------------------------------------------

/**
 * Render the quality score widget with a visual progress bar.
 *
 * Displays the current score against the target threshold using an
 * ASCII progress bar. The bar is 16 characters wide; an arrow (`>`)
 * marks the current position.
 *
 * @param score  - The current quality score (0-100).
 * @param target - The target quality threshold (0-100).
 * @param pi     - The oh-my-pi extension API handle.
 */
export function renderQualityWidget(score: number, target: number, pi: any): void {
  const barWidth = 16;
  const maxVal = Math.max(target, 100);
  const filled = Math.round((score / maxVal) * barWidth);
  const clamped = Math.min(filled, barWidth);

  let bar = '';
  for (let i = 0; i < barWidth; i++) {
    if (i < clamped && i !== clamped - 1) {
      bar += '=';
    } else if (i === clamped - 1 && clamped > 0) {
      bar += '>';
    } else {
      bar += ' ';
    }
  }

  const line = `Quality: ${score}/${target} [${bar}]`;
  pi.setWidget(WIDGET_KEY_QUALITY, [line]);
}

// ---------------------------------------------------------------------------
// clearWidgets
// ---------------------------------------------------------------------------

/**
 * Clear all babysitter TUI widgets.
 *
 * Sets each widget key to an empty array so oh-my-pi removes the panels
 * from the display.
 *
 * @param pi - The oh-my-pi extension API handle.
 */
export function clearWidgets(pi: any): void {
  pi.setWidget(WIDGET_KEY_RUN, []);
  pi.setWidget(WIDGET_KEY_EFFECTS, []);
  pi.setWidget(WIDGET_KEY_QUALITY, []);
}

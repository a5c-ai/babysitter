/**
 * Custom message renderer for babysitter tool calls.
 *
 * Registered with oh-my-pi via `pi.registerMessageRenderer` so that
 * babysitter effect execution results, run status updates, and iteration
 * progress are displayed in a structured, human-readable format rather
 * than raw JSON.
 *
 * @module tool-renderer
 */

import type { MessageRenderer } from './types';

// ---------------------------------------------------------------------------
// Payload interfaces
// ---------------------------------------------------------------------------

/** The payload shape expected by the babysitter tool renderer. */
export interface BabysitterToolPayload {
  effectId: string;
  kind: string;
  title: string;
  success: boolean;
  value?: unknown;
  error?: string;
  durationMs?: number;
}

/** Payload for the `babysitter:status` message type. */
export interface RunStatusPayload {
  runId: string;
  processId?: string;
  iteration?: number;
  status: string;
  pendingEffectsCount?: number;
}

/** Payload for the `babysitter:effect-result` message type. */
export interface EffectResultPayload {
  effectId: string;
  kind: string;
  status: string;
}

/** Payload for the `babysitter:iteration` message type. */
export interface IterationPayload {
  iteration: number;
  status: string;
  pendingCount?: number;
}

// ---------------------------------------------------------------------------
// Box-drawing helpers
// ---------------------------------------------------------------------------

const BOX_HORIZONTAL = '\u2500';
const BOX_VERTICAL = '\u2502';
const BOX_TOP_LEFT = '\u250C';
const BOX_TOP_RIGHT = '\u2510';
const BOX_BOTTOM_LEFT = '\u2514';
const BOX_BOTTOM_RIGHT = '\u2518';

/**
 * Wrap a set of lines inside a simple Unicode box.
 *
 * @param lines - Content lines (no newlines within each entry).
 * @param minWidth - Minimum inner width of the box.
 * @returns The formatted box as a single string.
 */
function drawBox(lines: string[], minWidth = 40): string {
  const innerWidth = Math.max(minWidth, ...lines.map((l) => l.length));
  const top = `${BOX_TOP_LEFT}${BOX_HORIZONTAL.repeat(innerWidth + 2)}${BOX_TOP_RIGHT}`;
  const bottom = `${BOX_BOTTOM_LEFT}${BOX_HORIZONTAL.repeat(innerWidth + 2)}${BOX_BOTTOM_RIGHT}`;
  const body = lines.map((l) => `${BOX_VERTICAL} ${l.padEnd(innerWidth)} ${BOX_VERTICAL}`);
  return [top, ...body, bottom].join('\n');
}

// ---------------------------------------------------------------------------
// Public format helpers
// ---------------------------------------------------------------------------

/**
 * Format run status as a clean multi-line display inside a box.
 *
 * Shows: run ID, process, iteration, status, and pending effects count.
 *
 * @param data - The run status payload (loosely typed for renderer compatibility).
 * @returns A formatted multi-line string.
 */
export function formatRunStatus(data: unknown): string {
  const d = (data ?? {}) as Record<string, unknown>;
  const runId = typeof d['runId'] === 'string' ? d['runId'] : 'unknown';
  const processId = typeof d['processId'] === 'string' ? d['processId'] : 'n/a';
  const iteration =
    typeof d['iteration'] === 'number' ? String(d['iteration']) : 'n/a';
  const status = typeof d['status'] === 'string' ? d['status'] : 'unknown';
  const pending =
    typeof d['pendingEffectsCount'] === 'number'
      ? String(d['pendingEffectsCount'])
      : '0';

  const lines = [
    `Run Status`,
    `${'─'.repeat(38)}`,
    `  Run ID  : ${runId}`,
    `  Process : ${processId}`,
    `  Iter    : ${iteration}`,
    `  Status  : ${status}`,
    `  Pending : ${pending} effect(s)`,
  ];

  return drawBox(lines);
}

/**
 * Compact one-line format for an effect completion summary.
 *
 * Format: `Effect <effectId> (<kind>): <status>`
 *
 * @param data - The effect result payload (loosely typed for renderer compatibility).
 * @returns A single-line formatted string.
 */
export function formatEffectResult(data: unknown): string {
  const d = (data ?? {}) as Record<string, unknown>;
  const effectId = typeof d['effectId'] === 'string' ? d['effectId'] : 'unknown';
  const kind = typeof d['kind'] === 'string' ? d['kind'] : 'unknown';
  const status = typeof d['status'] === 'string' ? d['status'] : 'unknown';

  return `Effect ${effectId} (${kind}): ${status}`;
}

/**
 * Format an iteration progress summary.
 *
 * Format: `Iteration N: <status> | <pending count> pending effects`
 *
 * @param data - The iteration payload (loosely typed for renderer compatibility).
 * @returns A single-line formatted string.
 */
export function formatIterationSummary(data: unknown): string {
  const d = (data ?? {}) as Record<string, unknown>;
  const iteration =
    typeof d['iteration'] === 'number' ? d['iteration'] : 0;
  const status = typeof d['status'] === 'string' ? d['status'] : 'unknown';
  const pendingCount =
    typeof d['pendingCount'] === 'number' ? d['pendingCount'] : 0;

  return `Iteration ${iteration}: ${status} | ${pendingCount} pending effects`;
}

// ---------------------------------------------------------------------------
// Tool-result renderer (original functionality, preserved)
// ---------------------------------------------------------------------------

/**
 * Create the babysitter tool-result message renderer.
 *
 * Returns a {@link MessageRenderer} that formats babysitter effect results
 * for the TUI.
 *
 * @returns A renderer function that converts payloads to display strings.
 */
export function createToolRenderer(): MessageRenderer {
  return (payload: unknown): string => {
    if (!isBabysitterPayload(payload)) {
      return `[babysitter] Unrecognised payload: ${JSON.stringify(payload)}`;
    }

    return formatToolResult(payload);
  };
}

// ---------------------------------------------------------------------------
// Registration entry point
// ---------------------------------------------------------------------------

/**
 * Register all babysitter-related message renderers with oh-my-pi.
 *
 * Registers renderers for the following message types:
 * - `babysitter:tool-result` -- per-effect execution result
 * - `babysitter:status`       -- run status overview (formatted box)
 * - `babysitter:effect-result` -- compact effect completion summary
 * - `babysitter:iteration`    -- iteration progress line
 *
 * @param pi - The oh-my-pi ExtensionAPI (or compatible object exposing
 *             `registerMessageRenderer`).
 */
export function registerBabysitterRenderers(pi: unknown): void {
  const api = pi as { registerMessageRenderer(type: string, renderer: MessageRenderer): void };

  // Per-effect tool execution result (original renderer)
  api.registerMessageRenderer('babysitter:tool-result', createToolRenderer());

  // Run status box
  api.registerMessageRenderer('babysitter:status', (payload: unknown): string => {
    return formatRunStatus(payload);
  });

  // Effect completion one-liner
  api.registerMessageRenderer('babysitter:effect-result', (payload: unknown): string => {
    return formatEffectResult(payload);
  });

  // Iteration progress
  api.registerMessageRenderer('babysitter:iteration', (payload: unknown): string => {
    return formatIterationSummary(payload);
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Format a single effect result into a readable string.
 *
 * @param p - The structured payload.
 * @returns A formatted string for display.
 */
function formatToolResult(p: BabysitterToolPayload): string {
  const statusIcon = p.success ? '[OK]' : '[FAIL]';
  const duration = p.durationMs !== undefined ? ` (${p.durationMs}ms)` : '';

  const lines: string[] = [
    `${statusIcon} ${p.kind}: ${p.title}${duration}`,
    `    effect: ${p.effectId}`,
  ];

  if (p.success && p.value !== undefined) {
    const valueStr =
      typeof p.value === 'string' ? p.value : JSON.stringify(p.value, null, 2);
    // Truncate long values
    const truncated =
      valueStr.length > 500 ? valueStr.slice(0, 497) + '...' : valueStr;
    lines.push(`    result: ${truncated}`);
  }

  if (!p.success && p.error) {
    lines.push(`    error: ${p.error}`);
  }

  return lines.join('\n');
}

/**
 * Type guard for {@link BabysitterToolPayload}.
 */
function isBabysitterPayload(
  value: unknown,
): value is BabysitterToolPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj['effectId'] === 'string' &&
    typeof obj['kind'] === 'string' &&
    typeof obj['title'] === 'string' &&
    typeof obj['success'] === 'boolean'
  );
}

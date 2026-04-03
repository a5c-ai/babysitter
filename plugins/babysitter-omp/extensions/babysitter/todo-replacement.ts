/**
 * Replaces oh-my-pi's native todo widget with babysitter task tracking.
 *
 * Instead of maintaining a separate todo list, this module reads the
 * babysitter journal directly via the SDK and maps effect states into
 * a todo-compatible TUI widget.
 *
 * @module todo-replacement
 */

import { loadJournal } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// TodoItem type
// ---------------------------------------------------------------------------

/** A single todo item derived from babysitter journal events. */
export interface TodoItem {
  /** The effect identifier (unique per task dispatch). */
  id: string;
  /** Human-readable title derived from the effect label or taskId. */
  title: string;
  /** Display status: "in-progress", "completed", or "failed". */
  status: 'in-progress' | 'completed' | 'failed';
  /** The effect kind (e.g. "node", "shell", "breakpoint"). */
  kind: string;
}

// ---------------------------------------------------------------------------
// buildTodoItems — extract TodoItems from raw journal events
// ---------------------------------------------------------------------------

/**
 * Build a list of {@link TodoItem}s from raw babysitter journal events.
 *
 * Walks the event list in order, creating items on EFFECT_REQUESTED and
 * updating their status on EFFECT_RESOLVED.
 *
 * @param journalEvents - Array of journal events as returned by `loadJournal`.
 * @returns An array of {@link TodoItem}s reflecting the current state.
 */
export function buildTodoItems(journalEvents: any[]): TodoItem[] {
  const itemsById = new Map<string, TodoItem>();

  for (const event of journalEvents) {
    if (event.type === 'EFFECT_REQUESTED') {
      const data = event.data ?? {};
      const effectId: string = data.effectId ?? event.ulid ?? '';
      const title: string = data.label ?? data.taskId ?? effectId;
      const kind: string = data.kind ?? 'unknown';

      itemsById.set(effectId, {
        id: effectId,
        title,
        status: 'in-progress',
        kind,
      });
    } else if (event.type === 'EFFECT_RESOLVED') {
      const data = event.data ?? {};
      const effectId: string = data.effectId ?? '';
      const existing = itemsById.get(effectId);
      if (existing) {
        existing.status = data.status === 'ok' ? 'completed' : 'failed';
      }
    }
  }

  return Array.from(itemsById.values());
}

// ---------------------------------------------------------------------------
// formatTodoWidget — render TodoItems as TUI widget lines
// ---------------------------------------------------------------------------

/**
 * Format todo items as widget lines suitable for `pi.setWidget()`.
 *
 * Each line uses a checkbox-style prefix:
 * - `[x]` for completed items
 * - `[ ]` for in-progress items
 * - `[!]` for failed items
 *
 * @param items - The {@link TodoItem}s to render.
 * @returns An array of formatted strings, one per item.
 */
export function formatTodoWidget(items: TodoItem[]): string[] {
  return items.map((item) => {
    let prefix: string;
    switch (item.status) {
      case 'completed':
        prefix = '[x]';
        break;
      case 'failed':
        prefix = '[!]';
        break;
      case 'in-progress':
      default:
        prefix = '[ ]';
        break;
    }
    return `${prefix} ${item.title} (${item.kind})`;
  });
}

// ---------------------------------------------------------------------------
// syncTodoState — read journal and push widget update
// ---------------------------------------------------------------------------

/**
 * Synchronise babysitter task state into oh-my-pi's todo widget.
 *
 * Reads the journal from disk using the SDK's `loadJournal`, builds
 * todo items from the events, formats them as widget lines, and pushes
 * the result to the TUI via `pi.setWidget()`.
 *
 * @param runDir - Absolute path to the babysitter run directory.
 * @param pi     - The oh-my-pi extension API handle.
 */
export async function syncTodoState(runDir: string, pi: any): Promise<void> {
  const journalEvents = await loadJournal(runDir);
  const items = buildTodoItems(journalEvents);
  const lines = formatTodoWidget(items);

  pi.setWidget('babysitter:todos', lines);
}

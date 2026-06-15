/**
 * Derived selectors over the game store (SPEC §6/§8, SPEC-V3 §V3-7).
 *
 * IMPORTANT React note: these are PLAIN derivation helpers, meant to be called
 * with already-subscribed slices (e.g. inside render after `useStore(store,
 * (s) => s.world)`). They are NOT to be passed directly to `useStore` —
 * fresh-object selectors break `getSnapshot` caching in zustand v5.
 */

import type {
  AlertEntry,
  CommanderState,
  TaskEntity,
  UnitEntity,
} from './store';
import type {
  CardContextSummary,
  CommandContext,
  SelectionSummary,
} from '../microagent/types';

export const WORKING_STATES = new Set(['dispatching', 'thinking', 'tool_running', 'blocked']);

export function getUnitList(state: Pick<CommanderState, 'world'>): UnitEntity[] {
  const out: UnitEntity[] = [];
  for (const id of state.world.unitIds) {
    const unit = state.world.units[id];
    if (unit !== undefined) out.push(unit);
  }
  return out;
}

export function getTaskList(state: Pick<CommanderState, 'world'>): TaskEntity[] {
  const out: TaskEntity[] = [];
  for (const id of state.world.taskIds) {
    const task = state.world.tasks[id];
    if (task !== undefined) out.push(task);
  }
  return out;
}

export interface SelectedEntities {
  units: UnitEntity[];
  tasks: TaskEntity[];
}

export function getSelectedEntities(
  state: Pick<CommanderState, 'world' | 'selection'>,
): SelectedEntities {
  const units: UnitEntity[] = [];
  const tasks: TaskEntity[] = [];
  for (const id of state.selection.ids) {
    const unit = state.world.units[id];
    if (unit !== undefined) {
      units.push(unit);
      continue;
    }
    const task = state.world.tasks[id];
    if (task !== undefined) tasks.push(task);
  }
  return { units, tasks };
}

export function getLatestAlert(state: Pick<CommanderState, 'alerts'>): AlertEntry | undefined {
  return state.alerts[state.alerts.length - 1];
}

/** Alert pending for one of the given units (first match wins). */
export function getAlertForUnits(
  state: Pick<CommanderState, 'alerts'>,
  unitIds: readonly string[],
): AlertEntry | undefined {
  return state.alerts.find((alert) => unitIds.includes(alert.unitId));
}

/**
 * Board-context summaries for the cards in scope of the selection (§V2-2/
 * §V3-7): the selected cards plus the cards attended by selected agents.
 * Reads the store-committed board slice (SimCardView/SimAgentView per tick
 * batch) — the boardLens indirection is retired.
 */
export function buildCardSummaries(
  state: Pick<CommanderState, 'world' | 'board' | 'selection' | 'alerts'>,
): CardContextSummary[] {
  const { units, tasks } = getSelectedEntities(state);
  const taskIds: string[] = [];
  for (const task of tasks) taskIds.push(task.id);
  for (const unit of units) {
    const taskId = unit.view.taskId;
    if (taskId !== null && !taskIds.includes(taskId)) taskIds.push(taskId);
  }
  if (taskIds.length === 0) return [];

  return taskIds.flatMap((taskId) => {
    const card = state.board.cards[taskId];
    if (card === undefined) return [];
    const summary: CardContextSummary = {
      taskId,
      taskKind: card.view.taskKind,
      column: card.view.column,
      runStage: card.runStage,
      inquiryPending: card.view.hasPendingInquiry,
      workspaceDirty: card.view.dirtyFileCount > 0,
      yolo: card.view.yolo,
      merged: card.view.merged,
      agentRoles: card.view.agentIds.flatMap((id) => {
        const agent = state.board.agents[id];
        return agent !== undefined ? [agent.role] : [];
      }),
    };
    return [summary];
  });
}

/** Build the §8 microagent CommandContext from store slices. */
export function buildCommandContext(
  state: Pick<CommanderState, 'world' | 'board' | 'selection' | 'alerts' | 'meta'>,
): CommandContext {
  const { units, tasks } = getSelectedEntities(state);
  const kinds: Array<'unit' | 'task'> = [];
  if (units.length > 0) kinds.push('unit');
  if (tasks.length > 0) kinds.push('task');
  const selection: SelectionSummary = {
    count: units.length + tasks.length,
    kinds,
    states: [...new Set(units.map((u) => u.view.state))],
    adapters: [...new Set(units.map((u) => u.view.agent))],
    taskStates: [...new Set(tasks.map((t) => t.view.state))],
    pausedUnits: units.filter((u) => u.view.paused).length,
  };
  return {
    selection,
    alerts: state.alerts.map((a) => ({
      hookRequestId: a.hookRequestId,
      unitId: a.unitId,
      kind: a.kind,
    })),
    fleet: {
      totalUnits: state.meta.resources.unitCount,
      idleUnits: state.meta.resources.idleCount,
      busyUnits: state.meta.resources.busyCount,
      pendingAlerts: state.meta.resources.alertCount,
      simPaused: state.meta.paused,
    },
    cards: buildCardSummaries(state),
  };
}

// ---------------------------------------------------------------------------
// HUD formatting (mono accent for numbers, SPEC §10)
// ---------------------------------------------------------------------------

/** Sim clock as elapsed `T+MM:SS` (or `T+H:MM:SS`). Deterministic. */
export function formatClock(simTimeMs: number, simStartMs: number): string {
  const elapsed = Math.max(0, simTimeMs - simStartMs);
  const totalSeconds = Math.floor(elapsed / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `T+${hours}:${mm}:${ss}` : `T+${mm}:${ss}`;
}

/** Plain integer rendering (no locale separators — deterministic). */
export function formatInt(value: number): string {
  return String(Math.round(value));
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatPct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

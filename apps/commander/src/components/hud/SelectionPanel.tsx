/**
 * SelectionPanel (SPEC §4): single unit → portrait + name/adapter/model/state
 * badge + current task link + vitals (context bar, budget bar, turns/rank);
 * multi-unit → clickable card grid (click a card to sub-select that unit);
 * task → icon + title/kind/repo/phase + progress + assignees (click an
 * assignee to select it). data-testid="selection-panel" (SPEC §9).
 *
 * NOTE (frozen e2e contract): the panel text is matched against the §3 state
 * strings — render `view.state` verbatim and never include the word "idle"
 * for non-idle selections.
 */

import { useStore } from 'zustand';
import clsx from 'clsx';

import { formatInt, formatPct, formatUsd, getSelectedEntities } from '../../game/selectors';
import type { CommanderStore, TaskEntity, UnitEntity } from '../../game/store';
import { UNIT_BUDGET_USD } from '../../game/store';
import type { SimViews } from '../../game/views';
import { generateIcon } from '../../microagent/mock/iconGen';

const MAX_RANK_CHEVRONS = 5;

/**
 * Short human-readable state labels for the MULTI-select card grid only.
 * Frozen e2e contract: the SINGLE-unit view renders `view.state` verbatim
 * (and must never contain 'idle' for non-idle selections) — these labels are
 * therefore never used there.
 */
const CARD_STATE_LABELS: Record<string, string> = {
  idle: 'IDLE',
  dispatching: 'MOVING',
  thinking: 'THINKING',
  tool_running: 'TOOLING',
  awaiting_approval: 'NEEDS OK',
  blocked: 'BLOCKED',
  completed: 'DONE',
  failed: 'FAILED',
};

function cardStateLabel(state: string): string {
  return CARD_STATE_LABELS[state] ?? state.replace(/_/g, ' ').toUpperCase();
}

export interface SelectionPanelProps {
  store: CommanderStore;
  views: SimViews;
}

function focusEntity(store: CommanderStore, id: string, shift: boolean): void {
  store.getState().clickSelect(id, shift);
}

function RankChevrons({ turnCount }: { turnCount: number }): React.JSX.Element {
  const rank = Math.min(MAX_RANK_CHEVRONS, turnCount);
  return (
    <span className="wr-rank" title={`${turnCount} turns served`} aria-label={`rank ${rank}`}>
      {Array.from({ length: MAX_RANK_CHEVRONS }, (_, i) => (
        <span key={i} className={clsx('wr-rank-chevron', i < rank && 'is-earned')} />
      ))}
    </span>
  );
}

function UnitVitals({ store, unit }: { store: CommanderStore; unit: UnitEntity }): React.JSX.Element {
  const taskId = unit.view.taskId;
  const task = useStore(store, (s) => (taskId !== null ? s.world.tasks[taskId] : undefined));
  const icon = generateIcon({ entityId: unit.id, kind: 'unit', adapter: unit.view.agent });
  return (
    <div className="wr-sel-single">
      <div className="wr-sel-portrait" dangerouslySetInnerHTML={{ __html: icon.svg }} />
      <div className="wr-sel-info">
        <div className="wr-sel-name">{unit.view.title}</div>
        <div className="wr-sel-sub">
          <span className={`wr-sel-adapter wr-faction-text--${unit.view.agent}`}>{unit.view.agent}</span>
          <span className="wr-sel-model">{unit.view.model}</span>
        </div>
        <div className="wr-sel-staterow">
          <span className={`wr-sel-state wr-sel-state--${unit.view.state}`}>{unit.view.state}</span>
          {unit.view.paused && <span className="wr-sel-paused">paused</span>}
        </div>
        {taskId !== null && (
          <button
            type="button"
            className="wr-sel-tasklink"
            title="Select the assigned objective"
            onClick={(e) => focusEntity(store, taskId, e.shiftKey)}
          >
            › {task?.view.title ?? taskId}
          </button>
        )}
      </div>
      <div className="wr-sel-vitals">
        <div className="wr-vital">
          <span className="wr-vital-label">CTX</span>
          <div className="wr-bar wr-bar--health">
            <div className="wr-bar-fill" style={{ width: formatPct(1 - unit.contextPct) }} />
          </div>
          <span className="wr-vital-value">{formatPct(1 - unit.contextPct)}</span>
        </div>
        <div className="wr-vital">
          <span className="wr-vital-label">BUDGET</span>
          <div className="wr-bar wr-bar--energy">
            <div className="wr-bar-fill" style={{ width: formatPct(unit.energyPct) }} />
          </div>
          {/* bar and number agree: both show budget REMAINING (spent/total on hover) */}
          <span
            className="wr-vital-value"
            title={`${formatUsd(unit.view.cost.totalUsd)} of ${formatUsd(UNIT_BUDGET_USD)} spent`}
          >
            {formatUsd(UNIT_BUDGET_USD * unit.energyPct)} left
          </span>
        </div>
        <div className="wr-vital">
          <span className="wr-vital-label">TURNS</span>
          <RankChevrons turnCount={unit.view.turnCount} />
          <span className="wr-vital-value">{formatInt(unit.view.turnCount)}</span>
        </div>
      </div>
    </div>
  );
}

function UnitCardGrid({ store, units }: { store: CommanderStore; units: UnitEntity[] }): React.JSX.Element {
  return (
    <div className="wr-sel-grid">
      {units.map((unit) => {
        const icon = generateIcon({ entityId: unit.id, kind: 'unit', adapter: unit.view.agent });
        return (
          <button
            key={unit.id}
            type="button"
            className={`wr-sel-card wr-sel-card--${unit.view.state}`}
            title={`${unit.view.title} (${unit.view.state}) — click to select only this unit`}
            onClick={(e) => focusEntity(store, unit.id, e.shiftKey)}
          >
            <div className="wr-sel-card-portrait" dangerouslySetInnerHTML={{ __html: icon.svg }} />
            <div className="wr-sel-card-name">{unit.view.title}</div>
            <div className="wr-sel-card-state">
              {cardStateLabel(unit.view.state)}
              {unit.view.paused && <span className="wr-sel-paused">paused</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TaskDetails({
  store,
  views,
  task,
}: {
  store: CommanderStore;
  views: SimViews;
  task: TaskEntity;
}): React.JSX.Element {
  const units = useStore(store, (s) => s.world.units);
  /** Current babysitter process phase of the card's run (§V2-5 sel-stage). */
  const runStage = useStore(store, (s) => s.board.cards[task.id]?.runStage ?? null);
  // §V5-4 entity separation: the attending agent line splits into SESSION
  // (instance) and STACK (template). Refresh per committed tick.
  useStore(store, (s) => s.meta.tickIndex);
  const activeSession = views.listSessions(task.id).find((s) => s.status === 'active');
  const icon = generateIcon({ entityId: task.id, kind: 'task', taskKind: task.view.taskKind });
  return (
    <div className="wr-sel-single">
      <div className="wr-sel-portrait" dangerouslySetInnerHTML={{ __html: icon.svg }} />
      <div className="wr-sel-info">
        <div className="wr-sel-name">{task.view.title}</div>
        <div className="wr-sel-sub">
          <span>{task.view.taskKind}</span>
          <span>{task.view.repository}</span>
          <span className="wr-sel-phase">{task.view.phase}</span>
        </div>
        <div className="wr-sel-staterow">
          <span className={`wr-sel-state wr-sel-state--task-${task.view.state}`}>{task.view.state}</span>
          {runStage !== null && (
            <span className="wr-sel-stage" data-testid="sel-stage" title="current process stage">
              {runStage}
            </span>
          )}
          {task.view.priority > 0 && <span className="wr-sel-priority">priority</span>}
          <button
            type="button"
            className="wr-sel-edit"
            title="Open the card editor (§V4-5)"
            onClick={() => store.getState().openCardEditor(task.id)}
          >
            EDIT CARD
          </button>
        </div>
        {activeSession !== undefined && (
          <div className="wr-sel-agentline">
            <button
              type="button"
              data-testid="sel-session-link"
              className="wr-sel-entitylink"
              title={`${activeSession.creatureName} — session of ${activeSession.stackName}`}
              onClick={() => store.getState().openInspectorSessions(task.id)}
            >
              {activeSession.creatureName} · view session
            </button>
            <button
              type="button"
              data-testid="sel-stack-link"
              className="wr-sel-entitylink wr-sel-entitylink--stack"
              title={`open the agent stack "${activeSession.stackName}" in the Registry (§V5-4)`}
              onClick={() => store.getState().openRegistryStack(activeSession.stackRef)}
            >
              {activeSession.stackName} · view stack
            </button>
          </div>
        )}
      </div>
      <div className="wr-sel-vitals">
        <div className="wr-vital">
          <span className="wr-vital-label">PROGRESS</span>
          <div className="wr-bar wr-bar--progress">
            <div className="wr-bar-fill" style={{ width: formatPct(task.view.progress) }} />
          </div>
          <span className="wr-vital-value">{formatPct(task.view.progress)}</span>
        </div>
        <div className="wr-vital wr-vital--assignees">
          <span className="wr-vital-label">ASSIGNEES</span>
          {task.view.assigneeIds.length === 0 ? (
            <span className="wr-vital-value">none</span>
          ) : (
            <span className="wr-sel-assignees">
              {task.view.assigneeIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="wr-sel-assignee"
                  title="Select this unit"
                  onClick={(e) => focusEntity(store, id, e.shiftKey)}
                >
                  {units[id]?.view.title ?? id}
                </button>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SelectionPanel({ store, views }: SelectionPanelProps): React.JSX.Element {
  const world = useStore(store, (s) => s.world);
  const selection = useStore(store, (s) => s.selection);
  const { units, tasks } = getSelectedEntities({ world, selection });
  const total = units.length + tasks.length;

  let content: React.JSX.Element;
  if (total === 0) {
    content = <div className="wr-sel-empty">no selection — click a unit or drag a marquee</div>;
  } else if (units.length === 1 && tasks.length === 0) {
    const unit = units[0];
    content = unit !== undefined ? <UnitVitals store={store} unit={unit} /> : <div />;
  } else if (units.length > 1 && tasks.length === 0) {
    content = <UnitCardGrid store={store} units={units} />;
  } else if (tasks.length === 1 && units.length === 0) {
    const task = tasks[0];
    content = task !== undefined ? <TaskDetails store={store} views={views} task={task} /> : <div />;
  } else {
    content = (
      <div className="wr-sel-mixed">
        <UnitCardGrid store={store} units={units} />
        {tasks.map((task) => (
          <TaskDetails key={task.id} store={store} views={views} task={task} />
        ))}
      </div>
    );
  }

  return (
    <section className="wr-panel wr-selection" data-testid="selection-panel" aria-label="Selection">
      <div className="wr-panel-title">
        SELECTION{total > 0 && <span className="wr-panel-count">{total}</span>}
      </div>
      {content}
    </section>
  );
}

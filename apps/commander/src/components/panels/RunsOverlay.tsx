/**
 * The Runs overlay (SPEC-V4 §V4-6, AC41): full-screen parchment ledger over
 * the board, opened via `topbar-runs`; Esc closes (top tier of the cascade
 * with foundry/archive, §V4-13).
 *
 *   Runs tab (default): table of ALL runs (per card attempt, newest first) —
 *     short runId, card title, kind chip, processId@rev, ObservedRunState
 *     badge, mini phase pipeline, pending-effects chips, tokens/cost,
 *     started/ended. Row click → run-detail: the V2-5 Inspector Process tab
 *     PROMOTED AND REUSED (shared ProcessTab component: full pipeline,
 *     pendingEffectsByKind chips, auto-follow journal) + a back link.
 *   Processes tab (`data-testid="process-library"`): per-taskKind phase
 *     pipeline TEMPLATE cards (`commander/<kind>@vN`); selecting one opens
 *     the process-editor — rename inline / add / remove (≥2 floor enforced
 *     in character) / reorder; SAVE goes through orders.updateProcessTemplate
 *     (revision bump, `process_updated` ticker event) and binds FUTURE runs
 *     only (running runs keep their pinned revision).
 *
 * Tabs are role="tab" plates, NOT <button>s (same census rule as the
 * Foundry tab strip). No class name contains "current" (frozen census).
 */

import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import { formatClock, formatInt, formatUsd } from '../../game/selectors';
import {
  addPhase,
  draftError,
  FUTURE_RUNS_NOTE,
  movePhase,
  removePhase,
  renamePhase,
} from '../../game/processEditor';
import { assembleRunDetail, runTokensTotal, shortRunId } from '../../game/runsView';
import type { CommanderStore, Orders } from '../../game/store';
import type { SimViews } from '../../game/views';
import type {
  SimProcessTemplateView,
  SimRunObservationView,
  SimRunView,
} from '../../backend/mock/simulation';
import { ProcessTab } from './Inspector';

export interface RunsOverlayProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
}

// ---------------------------------------------------------------------------
// Runs ledger
// ---------------------------------------------------------------------------

/** Tiny etched pipeline: one notch per phase (done/now/pending). */
function MiniPipeline({
  phases,
}: {
  phases: SimRunView['phases'];
}): React.JSX.Element {
  return (
    <span className="wr-runs-pipeline" aria-label="phase pipeline">
      {phases.map((phase) => (
        <i
          key={phase.label}
          className={clsx(
            'wr-runs-stage',
            phase.status === 'done' && 'is-done',
            phase.status === 'current' && 'is-now',
          )}
          title={phase.label}
        />
      ))}
    </span>
  );
}

function PendingEffectChips({ run }: { run: SimRunView }): React.JSX.Element | null {
  const kinds = Object.entries(run.pendingEffectsByKind)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (kinds.length === 0) return null;
  return (
    <span className="wr-runs-effects">
      {kinds.map(([kind, count]) => (
        <span key={kind} className="wr-effect-chip">
          {kind} ×{count}
        </span>
      ))}
    </span>
  );
}

function RunRow({
  run,
  title,
  simStartMs,
  onOpen,
}: {
  run: SimRunView;
  title: string;
  simStartMs: number;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <li
      className="wr-runs-row"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen();
      }}
    >
      <span className="wr-runs-id" title={run.runId}>
        {shortRunId(run.runId)}
      </span>
      <span className="wr-runs-title">{title}</span>
      <span className={`wr-card-kind wr-card-kind--${run.taskKind}`}>{run.taskKind}</span>
      <span className="wr-runs-process">{run.processId}</span>
      <span className={`wr-runstate wr-runstate--${run.observedState}`}>{run.observedState}</span>
      <MiniPipeline phases={run.phases} />
      <PendingEffectChips run={run} />
      <span className="wr-runs-tokens">
        {formatInt(runTokensTotal(run))} tok · {formatUsd(run.costUsd)}
      </span>
      <span className="wr-runs-times">
        {formatClock(run.startedAt, simStartMs)} →{' '}
        {run.endedAt !== null ? formatClock(run.endedAt, simStartMs) : '—'}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Run detail (§V4-6: the Inspector Process tab, promoted + reusable)
// ---------------------------------------------------------------------------

function RunDetail({
  run,
  title,
  views,
  simStartMs,
  onBack,
}: {
  run: SimRunView;
  title: string;
  views: SimViews;
  simStartMs: number;
  onBack: () => void;
}): React.JSX.Element {
  const data = assembleRunDetail(run, views.getRunObservation(run.taskId));
  // ProcessTab consumes the observation shape; the registry row supplies the
  // PINNED pipeline + state, the live observation supplies the journal.
  const observation: SimRunObservationView = {
    runId: run.runId,
    taskId: run.taskId,
    observedState: run.observedState,
    pendingEffectsByKind: run.pendingEffectsByKind,
    phases: run.phases,
    journal: data.journal,
  };
  return (
    <div className="wr-run-detail" data-testid="run-detail">
      <div className="wr-run-detail-head">
        <button type="button" className="wr-runs-back" onClick={onBack}>
          ← LEDGER
        </button>
        <span className="wr-runs-title">{title}</span>
        <span className={`wr-card-kind wr-card-kind--${run.taskKind}`}>{run.taskKind}</span>
        <span className="wr-runs-process">{run.processId}</span>
        <span className="wr-runs-tokens">
          {formatInt(runTokensTotal(run))} tok · {formatUsd(run.costUsd)}
        </span>
        <span className="wr-runs-times">
          {formatClock(run.startedAt, simStartMs)} →{' '}
          {run.endedAt !== null ? formatClock(run.endedAt, simStartMs) : '—'}
        </span>
      </div>
      <ProcessTab observation={observation} simStartMs={simStartMs} />
      {!data.journalLive && (
        <div className="wr-runs-note">journal sealed — a newer attempt owns the live stream</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Process library + editor (§V4-6)
// ---------------------------------------------------------------------------

function ProcessEditor({
  template,
  orders,
  onClose,
}: {
  template: SimProcessTemplateView;
  orders: Orders;
  onClose: () => void;
}): React.JSX.Element {
  const [phases, setPhases] = useState<string[]>([...template.phases]);
  const [error, setError] = useState<string | null>(null);

  const save = (): void => {
    const blocking = draftError(phases);
    if (blocking !== null) {
      setError(blocking);
      return;
    }
    const revision = orders.updateProcessTemplate(
      template.kind,
      phases.map((p) => p.trim()),
    );
    if (revision !== null) onClose();
  };

  const remove = (index: number): void => {
    const result = removePhase(phases, index);
    setError(result.error);
    if (result.ok) setPhases(result.phases);
  };

  return (
    <div className="wr-process-editor" data-testid="process-editor">
      <div className="wr-process-editor-head">
        <span className="wr-process-editor-id">{template.processId}</span>
        <span className="wr-process-editor-kind">{template.kind} rite</span>
      </div>
      <ol className="wr-process-editor-phases">
        {phases.map((phase, i) => (
          <li key={i} className="wr-process-editor-phase">
            <input
              type="text"
              value={phase}
              aria-label={`phase ${i + 1} label`}
              onChange={(e) => {
                setError(null);
                setPhases(renamePhase(phases, i, e.target.value));
              }}
            />
            <button
              type="button"
              aria-label={`move phase ${i + 1} up`}
              disabled={i === 0}
              onClick={() => setPhases(movePhase(phases, i, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`move phase ${i + 1} down`}
              disabled={i === phases.length - 1}
              onClick={() => setPhases(movePhase(phases, i, 1))}
            >
              ↓
            </button>
            <button type="button" aria-label={`remove phase ${i + 1}`} onClick={() => remove(i)}>
              REMOVE
            </button>
          </li>
        ))}
      </ol>
      {error !== null && <div className="wr-process-editor-error">{error}</div>}
      <div className="wr-process-editor-actions">
        <button
          type="button"
          className="wr-process-editor-add"
          onClick={() => {
            setError(null);
            setPhases(addPhase(phases));
          }}
        >
          ADD PHASE
        </button>
        <button type="button" className="wr-process-editor-save" onClick={save}>
          SAVE
        </button>
        <button type="button" onClick={onClose}>
          CANCEL
        </button>
      </div>
      <div className="wr-process-editor-note">{FUTURE_RUNS_NOTE}</div>
    </div>
  );
}

function ProcessesTab({
  views,
  orders,
}: {
  views: SimViews;
  orders: Orders;
}): React.JSX.Element {
  const [editKind, setEditKind] = useState<string | null>(null);
  const templates = views.listProcessTemplates();
  const editing = editKind !== null ? templates.find((t) => t.kind === editKind) : undefined;
  return (
    <div className="wr-process-lib">
      <ul className="wr-process-cards" aria-label="Process templates">
        {templates.map((template) => (
          <li
            key={template.kind}
            className={clsx('wr-process-card', editKind === template.kind && 'is-open')}
            role="button"
            tabIndex={0}
            onClick={() => setEditKind(template.kind)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setEditKind(template.kind);
            }}
          >
            <span className="wr-process-card-id">{template.processId}</span>
            <span className={`wr-card-kind wr-card-kind--${template.kind}`}>{template.kind}</span>
            <span className="wr-process-card-phases">{template.phases.join(' → ')}</span>
          </li>
        ))}
      </ul>
      {editing !== undefined && (
        <ProcessEditor
          key={`${editing.kind}@v${editing.revision}`}
          template={editing}
          orders={orders}
          onClose={() => setEditKind(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlay shell
// ---------------------------------------------------------------------------

type RunsTab = 'runs' | 'processes';

export function RunsOverlay({ store, orders, views }: RunsOverlayProps): React.JSX.Element | null {
  const open = useStore(store, (s) => s.meta.runsOpen);
  // §V5-3 deep-link: a registry run link opens directly on that run's detail.
  const focusRunId = useStore(store, (s) => s.meta.runsFocusRunId);
  const cards = useStore(store, (s) => s.board.cards);
  const simStartMs = useStore(store, (s) => s.meta.simStartMs);
  // Sim views refresh per committed tick (ledger + auto-follow journal).
  useStore(store, (s) => s.meta.tickIndex);
  const [tab, setTab] = useState<RunsTab>('runs');
  const [detailRunId, setDetailRunId] = useState<string | null>(null);

  // Each open starts on the ledger (fresh navigation state), or on the
  // deep-linked run's detail when a registry run link routed here (§V5-3).
  useEffect(() => {
    if (open) {
      setTab('runs');
      setDetailRunId(focusRunId);
    }
  }, [open, focusRunId]);

  if (!open) return null;

  // listRuns() is newest-first; the parchment LEDGER reads in append order
  // (oldest first), like the ticker — entries are inscribed, never reshuffled.
  const runs = [...views.listRuns()].reverse();
  const titleOf = (run: SimRunView): string => cards[run.taskId]?.view.title ?? run.taskId;
  const detail = detailRunId !== null ? runs.find((r) => r.runId === detailRunId) : undefined;

  return (
    <div className="wr-overlay-backdrop" data-testid="runs-overlay">
      <div className="wr-memory wr-runs" role="dialog" aria-label="The Runs Ledger">
        <header className="wr-memory-head">
          <span className="wr-panel-title">THE RUNS LEDGER — RITES OF THE COGITATOR</span>
          <div className="wr-foundry-tabs wr-runs-tabs" role="tablist" aria-label="Runs ledger tabs">
            <div
              role="tab"
              tabIndex={0}
              aria-selected={tab === 'runs'}
              className={clsx('wr-foundry-tab', tab === 'runs' && 'is-active')}
              onClick={() => setTab('runs')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setTab('runs');
              }}
            >
              Runs
            </div>
            <div
              role="tab"
              tabIndex={0}
              data-testid="process-library"
              aria-selected={tab === 'processes'}
              className={clsx('wr-foundry-tab', tab === 'processes' && 'is-active')}
              onClick={() => setTab('processes')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setTab('processes');
              }}
            >
              Processes
            </div>
          </div>
          <button
            type="button"
            className="wr-inspector-close"
            onClick={() => store.getState().closeRuns()}
          >
            CLOSE
          </button>
        </header>

        <div className="wr-runs-body">
          {tab === 'runs' &&
            (detail !== undefined ? (
              <RunDetail
                run={detail}
                title={titleOf(detail)}
                views={views}
                simStartMs={simStartMs}
                onBack={() => setDetailRunId(null)}
              />
            ) : (
              <ul className="wr-runs-table" aria-label="All runs">
                {/* §V4-6 ledger column headers (v4-r0): same grid as the rows */}
                <li className="wr-runs-row wr-runs-colhead" aria-hidden>
                  <span>rite</span>
                  <span>card</span>
                  <span>kind</span>
                  <span>process</span>
                  <span>state</span>
                  <span>phases</span>
                  <span>pending effects</span>
                  <span>tokens · cost</span>
                  <span>started → ended</span>
                </li>
                {runs.length === 0 && (
                  <li className="wr-tab-empty">no rites recorded — start a card working</li>
                )}
                {runs.map((run) => (
                  <RunRow
                    key={run.runId}
                    run={run}
                    title={titleOf(run)}
                    simStartMs={simStartMs}
                    onOpen={() => setDetailRunId(run.runId)}
                  />
                ))}
              </ul>
            ))}
          {tab === 'processes' && <ProcessesTab views={views} orders={orders} />}
        </div>

        {/* §V4-6 ornamental footer colophon (v4-r0): both tabs share it */}
        <footer className="wr-runs-colophon" aria-hidden>
          <svg className="wr-runs-colophon-orn" viewBox="0 0 60 10" role="presentation">
            <path
              d="M2 5 H22 M38 5 H58 M26 5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30 3.4 a1.6 1.6 0 1 0 0 3.2 a1.6 1.6 0 1 0 0 -3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
          <span className="wr-runs-colophon-text">
            inscribed by the cogitator · ledger of rites · seal of the magos
          </span>
          <svg className="wr-runs-colophon-orn" viewBox="0 0 60 10" role="presentation">
            <path
              d="M2 5 H22 M38 5 H58 M26 5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30 3.4 a1.6 1.6 0 1 0 0 3.2 a1.6 1.6 0 1 0 0 -3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </footer>
      </div>
    </div>
  );
}

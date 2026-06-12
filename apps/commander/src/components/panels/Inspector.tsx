/**
 * Inspector (SPEC §4/AC11, tabbed per SPEC-V2 §V2-5/§V2-7 under SPEC-V3):
 * right slide-over with three tabs —
 *   Transcript (default, `inspector-tab-transcript`): the v1 message stream
 *     plus the §V3-5 inquiry bubbles inline (pending = clickable options;
 *     resolved = chosen caption + icon).
 *   Process (`inspector-tab-process`, AC20): brass stage pipeline (done =
 *     filled, the single live stage = glowing amber + gear spinner, pending
 *     = etched), ObservedRunState badge, pendingEffectsByKind chips
 *     (`breakpoint ×N` pulses when N>0) and an auto-following journal list
 *     (seq · type · label · clock time, newest last, scroll-lock on
 *     scroll-up).
 *   Workspace (`inspector-tab-workspace`, AC22): git-status header +
 *     changed-file list + the SAME diff plate components as the Human
 *     Review panel.
 * Opens for an AGENT (double-click avatar / Inspect) or a CARD (agent-less
 * cards default to the Process tab). Tab state lives in the store so the
 * Open Diff intent can deep-link the Workspace tab. Esc closes (after the
 * steer modal in the §V3-7 cascade).
 */

import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import { formatClock, formatInt, formatUsd } from '../../game/selectors';
import type {
  CommanderStore,
  InspectorTab,
  Orders,
  ResolvedInquiry,
  TranscriptEntry,
  UnitEntity,
} from '../../game/store';
import type { SimViews } from '../../game/views';
import type { SimInquiryView, SimRunObservationView } from '../../backend/mock/simulation';
import { generateIcon } from '../../microagent/mock/iconGen';
import { generateOptionIcon } from '../../microagent/mock/optionIconGen';
import { InquiryOptionRow } from '../hud/ChatDock';
import { ChangedFileList, GitStatusHeader } from './WorkspaceView';

export interface InspectorProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
}

/** Path-only gear glyph for tool rows (never <line>/<polyline> — frozen contract). */
const TOOL_GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true">' +
  '<path d="M8 5.2 A2.8 2.8 0 1 0 8 10.8 A2.8 2.8 0 1 0 8 5.2 Z M8 1.5 V3.5 M8 12.5 V14.5 M1.5 8 H3.5 M12.5 8 H14.5 M3.4 3.4 L4.8 4.8 M11.2 11.2 L12.6 12.6 M12.6 3.4 L11.2 4.8 M4.8 11.2 L3.4 12.6" ' +
  'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

const SCROLL_STICK_THRESHOLD_PX = 28;

const TABS: ReadonlyArray<{ id: InspectorTab; label: string }> = [
  { id: 'transcript', label: 'Transcript' },
  { id: 'process', label: 'Process' },
  { id: 'workspace', label: 'Workspace' },
];

// ---------------------------------------------------------------------------
// Transcript tab (v1 stream + inline inquiry bubbles, §V3-5)
// ---------------------------------------------------------------------------

function TranscriptRow({
  entry,
  live,
}: {
  entry: TranscriptEntry;
  live: boolean;
}): React.JSX.Element {
  switch (entry.kind) {
    case 'turn':
      return <li className="wr-tr wr-tr--turn">{entry.text}</li>;
    case 'tool':
      return (
        <li
          className={clsx(
            'wr-tr wr-tr--tool',
            entry.toolStatus === 'failed' && 'wr-tr--tool-failed',
            entry.toolStatus === 'running' && 'wr-tr--tool-running',
          )}
        >
          <span className="wr-tr-tool-glyph" dangerouslySetInnerHTML={{ __html: TOOL_GLYPH }} />
          <span className="wr-tr-tool-name">{entry.toolName ?? 'tool'}</span>
          <span className="wr-tr-tool-meta">
            {entry.durationMs !== undefined
              ? `${formatInt(entry.durationMs)}ms`
              : entry.toolStatus === 'failed'
                ? 'FAILED'
                : 'running…'}
          </span>
        </li>
      );
    case 'thinking':
      return (
        <li className={clsx('wr-tr wr-tr--thinking', live && 'is-live')}>
          <span className="wr-tr-role">THINKING</span>
          {entry.text}
        </li>
      );
    case 'text':
      return (
        <li className="wr-tr wr-tr--text">
          <span className="wr-tr-role">AGENT</span>
          {entry.text}
        </li>
      );
    default:
      return <li className="wr-tr wr-tr--note">{entry.text}</li>;
  }
}

/** Resolved inquiry bubble: chosen caption + its engraved icon (§V3-5). */
function ResolvedInquiryRow({ resolved }: { resolved: ResolvedInquiry }): React.JSX.Element {
  const icon = generateOptionIcon({
    id: resolved.optionId,
    caption: resolved.caption,
    ...(resolved.tone !== undefined ? { tone: resolved.tone } : {}),
  });
  return (
    <li className="wr-tr wr-tr--inquiry is-resolved">
      <div className="wr-inq-question">{resolved.question}</div>
      <div className="wr-inq-resolved">
        <span className="wr-inq-opt-icon" aria-hidden dangerouslySetInnerHTML={{ __html: icon.svg }} />
        <span className="wr-inq-resolved-caption">{resolved.caption}</span>
      </div>
    </li>
  );
}

function TranscriptStream({
  unit,
  inquiries,
  resolved,
  onChoose,
}: {
  unit: UnitEntity;
  inquiries: SimInquiryView[];
  resolved: ResolvedInquiry[];
  onChoose: (inquiry: SimInquiryView, optionId: string, caption: string, tone?: 'normal' | 'danger' | 'primary') => void;
}): React.JSX.Element {
  const listRef = useRef<HTMLOListElement | null>(null);
  const stuckRef = useRef(true);
  const [stuck, setStuck] = useState(true);
  const transcriptLength = unit.transcript.length + inquiries.length + resolved.length;

  useEffect(() => {
    stuckRef.current = true;
    setStuck(true);
  }, [unit.id]);

  useEffect(() => {
    const list = listRef.current;
    if (list !== null && stuckRef.current) list.scrollTop = list.scrollHeight;
  }, [transcriptLength, unit.id]);

  const lastEntry = unit.transcript[unit.transcript.length - 1];

  const onScroll = (e: React.UIEvent<HTMLOListElement>): void => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_STICK_THRESHOLD_PX;
    if (stuckRef.current !== atBottom) {
      stuckRef.current = atBottom;
      setStuck(atBottom);
    }
  };

  const jumpToLatest = (): void => {
    const list = listRef.current;
    if (list !== null) list.scrollTop = list.scrollHeight;
    stuckRef.current = true;
    setStuck(true);
  };

  return (
    <div className="wr-inspector-body">
      <ol ref={listRef} className="wr-inspector-stream" onScroll={onScroll}>
        {unit.transcript.length === 0 && (
          <li className="wr-tr wr-tr--note">no transcript yet — unit has not run</li>
        )}
        {unit.transcript.map((entry) => (
          <TranscriptRow
            key={entry.id}
            entry={entry}
            live={entry === lastEntry && unit.view.state === 'thinking'}
          />
        ))}
        {resolved.map((entry) => (
          <ResolvedInquiryRow key={`res-${entry.hookRequestId}`} resolved={entry} />
        ))}
        {inquiries.map((inquiry) => (
          // The SAME inquiry as the dock bubble, inline (no testids here —
          // the dock owns the frozen `inquiry-*` selector contract).
          <li key={`inq-${inquiry.hookRequestId}`} className="wr-tr wr-tr--inquiry">
            <div className="wr-inq-question">{inquiry.question}</div>
            <InquiryOptionRow
              inquiry={inquiry}
              withTestIds={false}
              onChoose={(option) => onChoose(inquiry, option.id, option.caption, option.tone)}
            />
          </li>
        ))}
      </ol>
      {!stuck && (
        <button type="button" className="wr-inspector-jump" onClick={jumpToLatest}>
          LATEST
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Process tab (SPEC-V2 §V2-5, AC20)
// ---------------------------------------------------------------------------

function ProcessTab({
  observation,
  simStartMs,
}: {
  observation: SimRunObservationView | null;
  simStartMs: number;
}): React.JSX.Element {
  const listRef = useRef<HTMLOListElement | null>(null);
  const stuckRef = useRef(true);
  const [stuck, setStuck] = useState(true);
  const journalLength = observation?.journal.length ?? 0;

  useEffect(() => {
    const list = listRef.current;
    if (list !== null && stuckRef.current) list.scrollTop = list.scrollHeight;
  }, [journalLength]);

  if (observation === null) {
    return <div className="wr-inspector-body wr-tab-empty">no run observed — the card has not started work</div>;
  }

  const onScroll = (e: React.UIEvent<HTMLOListElement>): void => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_STICK_THRESHOLD_PX;
    if (stuckRef.current !== atBottom) {
      stuckRef.current = atBottom;
      setStuck(atBottom);
    }
  };

  const effectKinds = Object.entries(observation.pendingEffectsByKind).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="wr-inspector-body wr-process">
      <div className="wr-process-head">
        <span className={`wr-runstate wr-runstate--${observation.observedState}`}>
          {observation.observedState}
        </span>
        <span className="wr-process-runid" title={observation.runId}>
          {observation.runId}
        </span>
      </div>
      <div className="wr-stage-pipeline" aria-label="Process stages">
        {observation.phases.map((phase) => (
          <span
            key={phase.label}
            className={clsx(
              'wr-stage',
              phase.status === 'done' && 'wr-stage--done',
              phase.status === 'current' && 'wr-stage--now',
              phase.status === 'pending' && 'wr-stage--pending',
            )}
            {...(phase.status === 'current' ? { 'data-current': 'true' } : {})}
          >
            {phase.status === 'current' && (
              <span className="wr-stage-gear" aria-hidden dangerouslySetInnerHTML={{ __html: TOOL_GLYPH }} />
            )}
            {phase.label}
          </span>
        ))}
      </div>
      {effectKinds.length > 0 && (
        <div className="wr-effect-chips" aria-label="Pending effects">
          {effectKinds.map(([kind, count]) => (
            <span
              key={kind}
              className={clsx(
                'wr-effect-chip',
                kind === 'breakpoint' && count > 0 && 'wr-effect-chip--pulse',
              )}
            >
              {kind} ×{count}
            </span>
          ))}
        </div>
      )}
      <ol ref={listRef} className="wr-journal" onScroll={onScroll} aria-label="Run journal">
        {observation.journal.map((event) => (
          <li key={event.seq} className="wr-journal-row">
            <span className="wr-journal-seq">{String(event.seq).padStart(3, '0')}</span>
            <span className={`wr-journal-type wr-journal-type--${event.type.toLowerCase()}`}>
              {event.type}
            </span>
            <span className="wr-journal-label">
              {typeof event.data['label'] === 'string' ? event.data['label'] : ''}
            </span>
            <span className="wr-journal-ts">{formatClock(event.recordedAt, simStartMs)}</span>
          </li>
        ))}
      </ol>
      {!stuck && (
        <button
          type="button"
          className="wr-inspector-jump"
          onClick={() => {
            const list = listRef.current;
            if (list !== null) list.scrollTop = list.scrollHeight;
            stuckRef.current = true;
            setStuck(true);
          }}
        >
          LATEST
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workspace tab (SPEC-V2 §V2-7, AC22 — shared plates with the review panel)
// ---------------------------------------------------------------------------

function WorkspaceTab({
  taskId,
  views,
}: {
  taskId: string | null;
  views: SimViews;
}): React.JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ws = taskId !== null ? views.getWorkspaceView(taskId) : null;
  if (ws === null) {
    return <div className="wr-inspector-body wr-tab-empty">no workspace — the card has no working copy</div>;
  }
  return (
    <div className="wr-inspector-body wr-workspace">
      <GitStatusHeader ws={ws} />
      <div className="wr-workspace-scroll">
        <ChangedFileList
          files={ws.files}
          openIndex={openIndex}
          onToggle={(index) => setOpenIndex((cur) => (cur === index ? null : index))}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token footer (unit mode only)
// ---------------------------------------------------------------------------

function TokenFooter({ unit }: { unit: UnitEntity }): React.JSX.Element {
  const t = unit.view.tokenUsage;
  return (
    <footer className="wr-inspector-foot" aria-label="Token usage">
      <span className="wr-foot-cell">
        <em>IN</em>
        {formatInt(t.inputTokens)}
      </span>
      <span className="wr-foot-cell">
        <em>OUT</em>
        {formatInt(t.outputTokens)}
      </span>
      <span className="wr-foot-cell">
        <em>THINK</em>
        {formatInt(t.thinkingTokens)}
      </span>
      <span className="wr-foot-cell">
        <em>CACHE</em>
        {formatInt(t.cachedTokens)}
      </span>
      <span className="wr-foot-cell wr-foot-cell--cost">
        <em>COST</em>
        {formatUsd(unit.view.cost.totalUsd)}
      </span>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Inspector shell
// ---------------------------------------------------------------------------

export function Inspector({ store, orders, views }: InspectorProps): React.JSX.Element | null {
  const unitId = useStore(store, (s) => s.meta.inspectorUnitId);
  const cardTaskId = useStore(store, (s) => s.meta.inspectorTaskId);
  const tab = useStore(store, (s) => s.meta.inspectorTab);
  const units = useStore(store, (s) => s.world.units);
  const board = useStore(store, (s) => s.board);
  const simStartMs = useStore(store, (s) => s.meta.simStartMs);
  // Sim views refresh per committed tick (Process/Workspace tabs).
  useStore(store, (s) => s.meta.tickIndex);

  const unit = unitId !== null ? units[unitId] : undefined;
  if (unitId === null && cardTaskId === null) return null;
  if (unitId !== null && unit === undefined && cardTaskId === null) return null;

  const taskId = cardTaskId ?? unit?.view.taskId ?? null;
  const card = taskId !== null ? board.cards[taskId] : undefined;
  const observation = taskId !== null ? views.getRunObservation(taskId) : null;

  // Header identity: agent when present, otherwise the inspected card.
  let head: React.JSX.Element;
  if (unit !== undefined) {
    const icon = generateIcon({ entityId: unit.id, kind: 'unit', adapter: unit.view.agent });
    head = (
      <>
        <div className="wr-inspector-portrait" dangerouslySetInnerHTML={{ __html: icon.svg }} />
        <div className="wr-inspector-id">
          <div className="wr-inspector-name">{unit.view.title}</div>
          <div className="wr-inspector-sub">
            {unit.view.agent} · {unit.view.model}
          </div>
          {card !== undefined && (
            <div className="wr-inspector-sub wr-inspector-attended" title="attended card">
              {card.view.title}
            </div>
          )}
          <div className={`wr-sel-state wr-sel-state--${unit.view.state}`}>{unit.view.state}</div>
        </div>
      </>
    );
  } else if (card !== undefined) {
    const icon = generateIcon({ entityId: card.id, kind: 'task', taskKind: card.view.taskKind });
    head = (
      <>
        <div className="wr-inspector-portrait" dangerouslySetInnerHTML={{ __html: icon.svg }} />
        <div className="wr-inspector-id">
          <div className="wr-inspector-name">{card.view.title}</div>
          <div className="wr-inspector-sub">
            {card.view.taskKind} · {card.view.column}
          </div>
        </div>
      </>
    );
  } else {
    return null;
  }

  const pendingForUnit =
    unit !== undefined ? board.inquiries.filter((q) => q.unitId === unit.id) : [];
  const resolvedForUnit = unit !== undefined ? (board.resolvedInquiries[unit.id] ?? []) : [];

  const chooseInline = (
    inquiry: SimInquiryView,
    optionId: string,
    caption: string,
    tone?: 'normal' | 'danger' | 'primary',
  ): void => {
    store.getState().recordResolvedInquiry({
      hookRequestId: inquiry.hookRequestId,
      unitId: inquiry.unitId,
      taskId: inquiry.taskId,
      question: inquiry.question,
      optionId,
      caption,
      ...(tone !== undefined ? { tone } : {}),
    });
    orders.answerInquiry(inquiry.hookRequestId, optionId);
  };

  return (
    <aside className="wr-inspector" data-testid="inspector" aria-label="Session inspector">
      <header className="wr-inspector-head">
        {head}
        <button
          type="button"
          className="wr-inspector-close"
          aria-label="Close inspector"
          onClick={() => store.getState().closeInspector()}
        >
          CLOSE
        </button>
      </header>
      <nav className="wr-inspector-tabs" aria-label="Inspector tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            data-testid={`inspector-tab-${id}`}
            className={clsx('wr-inspector-tab', tab === id && 'is-active')}
            onClick={() => store.getState().setInspectorTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'transcript' &&
        (unit !== undefined ? (
          <TranscriptStream
            unit={unit}
            inquiries={pendingForUnit}
            resolved={resolvedForUnit}
            onChoose={chooseInline}
          />
        ) : (
          <div className="wr-inspector-body wr-tab-empty">no attending agent — no transcript</div>
        ))}
      {tab === 'process' && <ProcessTab observation={observation} simStartMs={simStartMs} />}
      {tab === 'workspace' && <WorkspaceTab taskId={taskId} views={views} />}
      {unit !== undefined && <TokenFooter unit={unit} />}
    </aside>
  );
}

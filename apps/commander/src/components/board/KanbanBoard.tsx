/**
 * KanbanBoard (SPEC-V3 §V3-1 as amended by SPEC-V4 §V4-1): seven brass-framed
 * parchment lanes (the release rail adds MERGED — staging, with the brass
 * Release lever in its header — and IN PRODUCTION, whose rows carry a crown
 * seal and compact to slim rows after 30 ticks). Cards are tasks — wax-seal
 * kind icon, serif title, kind chip, progress ring, yolo toggle, workspace
 * dirty badge and an agent slot of attending clockwork creatures. Subtask
 * stacks render the parent card with children fanned beneath (inside the
 * parent's draggable group). Merged cards render as brass-sealed rows in the
 * MERGED lane (§V4-1: the seal lives there now).
 *
 * Drag & drop (§V3-1 + §V4-2): raw pointer events, no library. The lifted
 * card renders as a GHOST in a top-level portal layer (`data-drag-ghost`,
 * z-index above all panels) so no lane or HUD chrome can occlude it (AC36);
 * the in-lane original dims to a placeholder. Lane hit-testing resolves via
 * `elementsFromPoint`, skipping the ghost layer, so drop resolution and the
 * synthetic e2e pointer sequence (mouse.down → stepped moves → mouse.up)
 * keep working without pointer capture. Amber glow on legal drop lanes,
 * snap-back on invalid drop; every legal drop issues `orders.moveCard`.
 *
 * Auto-move animation (§V3-3): `meta.movingCards` entries trigger a
 * FLIP-style ~600ms arc glide; the card carries `is-moving` for the duration
 * (e2e hook) and `clearMoving` retires the registry entry. Agent spawn =
 * gear-assemble (~500ms CSS), despawn = dissolve-to-sparks (ghost avatars
 * WITHOUT the card-agent testid). `prefers-reduced-motion` collapses both to
 * instant + glow.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import clsx from 'clsx';

import {
  cardsForColumn,
  childrenOf,
  COLUMN_TITLES,
  COLUMNS,
  isDraggable,
  laneFromHits,
  legalUserMove,
  planDrop,
  sanitizeGhostMarkup,
  type ColumnId,
} from '../../game/board';
import { formatPct } from '../../game/selectors';
import type { CommanderStore, Orders } from '../../game/store';
import type { SimAgentView, SimCardView, SimRosterAgentView } from '../../backend/mock/simulation';
import { generateIcon } from '../../microagent/mock/iconGen';

const DRAG_THRESHOLD_PX = 4;
const MOVE_ANIM_MS = 600;
/**
 * v5-r0 (§V4-1 as amended): release-train wagon glide delay per stagger
 * index. The SIM ships the whole train atomically; the visual stagger is
 * purely an animation-layer affair (paused sims never strand wagons).
 */
const RELEASE_STAGGER_MS = 140;
const SNAPBACK_MS = 220;
const DESPAWN_MS = 450;
/** Double-click grace before a single click opens the review panel (§V5-2). */
const REVIEW_CLICK_GRACE_MS = 250;

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * v4-r1 FLIP bug fix (§V3-3): the card's SETTLED layout rect. While a prior
 * move animation is still in flight, `getBoundingClientRect()` reports the
 * transient mid-arc position (translate keyframes included) — recording THAT
 * as a FLIP "first" rect poisoned the next move's origin and launched cards
 * hundreds of px off-canvas. The move keyframes are translate-only, so
 * subtracting the live computed-transform translation recovers the true slot.
 */
function settledRect(el: HTMLElement): DOMRect {
  const rect = el.getBoundingClientRect();
  const t = getComputedStyle(el).transform;
  if (t === 'none' || t === '') return rect;
  const m = new DOMMatrixReadOnly(t);
  if (m.e === 0 && m.f === 0) return rect;
  return new DOMRect(rect.x - m.e, rect.y - m.f, rect.width, rect.height);
}

/**
 * §V4-2 drop resolution: the drag ghost is hit-testable (so AC36's
 * elementFromPoint probe finds it topmost), so the lane under the pointer is
 * resolved from the full hit stack, skipping the ghost layer.
 */
function laneFromPoint(x: number, y: number): ColumnId | null {
  return laneFromHits(document.elementsFromPoint(x, y));
}

/** §V4-1 crown seal for IN PRODUCTION rows (path-only — frozen census). */
const CROWN_GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">' +
  '<path d="M4.2 13 L3.4 5.6 L7.2 8.6 L10 4 L12.8 8.6 L16.6 5.6 L15.8 13 Z" fill="currentColor"/>' +
  '<path d="M4.6 15.4 H15.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '</svg>';

/** §V4-1 brass release-lever glyph (path-only). */
const LEVER_GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">' +
  '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M4 16.5 H16 M10 16.5 V10.5 M10 10.5 L14.2 5.2"/><circle cx="15.2" cy="4" r="1.7"/>' +
  '</g></svg>';

// ---------------------------------------------------------------------------
// Progress ring (path/circle only — never <line>/<polyline>, AC33)
// ---------------------------------------------------------------------------

function ProgressRing({ progress }: { progress: number }): React.JSX.Element {
  const r = 8;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, progress));
  return (
    <span className="wr-card-ring" title={`progress ${formatPct(filled)}`} aria-label={`progress ${formatPct(filled)}`}>
      <svg viewBox="0 0 22 22" width="100%" height="100%" aria-hidden="true">
        <circle className="wr-ring-track" cx="11" cy="11" r={r} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3.2" />
        <circle
          className="wr-ring-arc"
          cx="11"
          cy="11"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={`${c * filled} ${c}`}
          transform="rotate(-90 11 11)"
        />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Agent slot: up to 3 attending creature avatars + overflow count (§V3-1)
// ---------------------------------------------------------------------------

interface GhostAvatar {
  unitId: string;
  adapter: string;
}

function AgentSlot({
  agentIds,
  agents,
  store,
}: {
  agentIds: readonly string[];
  agents: Record<string, SimAgentView>;
  store: CommanderStore;
}): React.JSX.Element {
  // Despawn dissolve: remember the last attended set; render leavers as
  // ghost avatars (NO card-agent testid — they are visual residue only).
  const prevRef = useRef<Map<string, string>>(new Map());
  const [ghosts, setGhosts] = useState<GhostAvatar[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    const current = new Map<string, string>();
    for (const id of agentIds) {
      const adapter = agents[id]?.agent ?? prev.get(id) ?? 'claude-code';
      current.set(id, adapter);
    }
    const leavers: GhostAvatar[] = [];
    for (const [unitId, adapter] of prev) {
      if (!current.has(unitId)) leavers.push({ unitId, adapter });
    }
    prevRef.current = current;
    if (leavers.length > 0 && !reducedMotion()) {
      setGhosts((g) => [...g, ...leavers]);
      const timer = window.setTimeout(() => {
        setGhosts((g) => g.filter((ghost) => !leavers.some((l) => l.unitId === ghost.unitId)));
      }, DESPAWN_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [agentIds, agents]);

  const visible = agentIds.slice(0, 3);
  const overflow = agentIds.length - visible.length;
  return (
    <span className="wr-card-agents">
      {visible.map((unitId) => {
        const agent = agents[unitId];
        const adapter = agent?.agent ?? 'claude-code';
        const icon = generateIcon({ entityId: unitId, kind: 'unit', adapter });
        return (
          <button
            key={unitId}
            type="button"
            data-testid={`card-agent-${unitId}`}
            data-adapter={adapter}
            data-role={agent?.role ?? 'worker'}
            className={clsx('wr-card-agent', `wr-card-agent--${adapter}`, 'is-spawning')}
            title={
              agent !== undefined
                ? `${agent.creatureName} — session of ${agent.stackName}`
                : `agent · ${adapter} — click to select, double-click to inspect`
            }
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              store.getState().clickSelect(unitId, e.shiftKey);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              store.getState().openInspector(unitId);
            }}
          >
            <span className="wr-card-agent-portrait" dangerouslySetInnerHTML={{ __html: icon.svg }} />
          </button>
        );
      })}
      {overflow > 0 && <span className="wr-card-agent-overflow">+{overflow}</span>}
      {ghosts.map((ghost) => {
        const icon = generateIcon({ entityId: ghost.unitId, kind: 'unit', adapter: ghost.adapter });
        return (
          <span key={`ghost-${ghost.unitId}`} className="wr-card-agent wr-card-agent--ghost" aria-hidden>
            <span className="wr-card-agent-portrait" dangerouslySetInnerHTML={{ __html: icon.svg }} />
          </span>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Card (and stack mini-children, §V3-1)
// ---------------------------------------------------------------------------

interface CardProps {
  card: SimCardView;
  allCards: readonly SimCardView[];
  agents: Record<string, SimAgentView>;
  rosterAgents: SimRosterAgentView[];
  store: CommanderStore;
  orders: Orders;
  selected: ReadonlySet<string>;
  onHoverLane: (from: ColumnId | null, lane: ColumnId | null) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  dragging: boolean;
}

// ---------------------------------------------------------------------------
// Assignment chips (backlog cards): worker / reviewer / human slots
// ---------------------------------------------------------------------------

function AssignmentChips({
  card,
  rosterAgents,
  orders,
}: {
  card: SimCardView;
  rosterAgents: SimRosterAgentView[];
  orders: Orders;
}): React.JSX.Element {
  const [openSlot, setOpenSlot] = useState<'worker' | 'reviewer' | 'human' | null>(null);

  const workers = rosterAgents.filter((a) => a.role === 'worker');
  const reviewers = rosterAgents.filter((a) => a.role === 'reviewer');

  const workerName = card.workerAgentId
    ? (rosterAgents.find((a) => a.agentId === card.workerAgentId)?.name ?? card.workerAgentId)
    : null;
  const reviewerName = card.reviewerAgentId
    ? (rosterAgents.find((a) => a.agentId === card.reviewerAgentId)?.name ?? card.reviewerAgentId)
    : null;
  const humanAssigned = card.humanAssigneeId !== null;

  const closeOnEscape = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') setOpenSlot(null);
  };

  return (
    <div className="wr-assign-chips" onPointerDown={(e) => e.stopPropagation()}>
      {/* Worker slot */}
      <div className="wr-assign-slot">
        <button
          type="button"
          className={clsx('wr-assign-chip', 'wr-assign-chip--worker', workerName !== null && 'is-set')}
          title={workerName !== null ? `Worker: ${workerName}` : 'Assign worker agent'}
          onClick={(e) => {
            e.stopPropagation();
            setOpenSlot(openSlot === 'worker' ? null : 'worker');
          }}
          onKeyDown={closeOnEscape}
        >
          <span className="wr-assign-chip-label">{workerName ?? 'wrkr'}</span>
        </button>
        {openSlot === 'worker' && (
          <div className="wr-assign-popover">
            <button
              type="button"
              className="wr-assign-pop-opt wr-assign-pop-opt--clear"
              onClick={(e) => {
                e.stopPropagation();
                orders.assignTaskAgent(card.taskId, 'worker', null);
                setOpenSlot(null);
              }}
            >
              — unassign —
            </button>
            {workers.map((a) => (
              <button
                key={a.agentId}
                type="button"
                className={clsx(
                  'wr-assign-pop-opt',
                  card.workerAgentId === a.agentId && 'is-selected',
                  a.status === 'assigned' && a.agentId !== card.workerAgentId && 'is-busy',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  orders.assignTaskAgent(card.taskId, 'worker', a.agentId);
                  setOpenSlot(null);
                }}
              >
                <span className={`wr-assign-pop-adapter wr-faction-text--${a.adapter}`}>{a.adapter}</span>
                {a.name}
              </button>
            ))}
            {workers.length === 0 && (
              <span className="wr-assign-pop-empty">No workers — recruit in Foundry</span>
            )}
          </div>
        )}
      </div>
      {/* Reviewer slot */}
      <div className="wr-assign-slot">
        <button
          type="button"
          className={clsx('wr-assign-chip', 'wr-assign-chip--reviewer', reviewerName !== null && 'is-set')}
          title={reviewerName !== null ? `Reviewer: ${reviewerName}` : 'Assign reviewer agent'}
          onClick={(e) => {
            e.stopPropagation();
            setOpenSlot(openSlot === 'reviewer' ? null : 'reviewer');
          }}
          onKeyDown={closeOnEscape}
        >
          <span className="wr-assign-chip-label">{reviewerName ?? 'revr'}</span>
        </button>
        {openSlot === 'reviewer' && (
          <div className="wr-assign-popover">
            <button
              type="button"
              className="wr-assign-pop-opt wr-assign-pop-opt--clear"
              onClick={(e) => {
                e.stopPropagation();
                orders.assignTaskAgent(card.taskId, 'reviewer', null);
                setOpenSlot(null);
              }}
            >
              — unassign —
            </button>
            {reviewers.map((a) => (
              <button
                key={a.agentId}
                type="button"
                className={clsx(
                  'wr-assign-pop-opt',
                  card.reviewerAgentId === a.agentId && 'is-selected',
                  a.status === 'assigned' && a.agentId !== card.reviewerAgentId && 'is-busy',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  orders.assignTaskAgent(card.taskId, 'reviewer', a.agentId);
                  setOpenSlot(null);
                }}
              >
                <span className={`wr-assign-pop-adapter wr-faction-text--${a.adapter}`}>{a.adapter}</span>
                {a.name}
              </button>
            ))}
            {reviewers.length === 0 && (
              <span className="wr-assign-pop-empty">No reviewers — recruit in Foundry</span>
            )}
          </div>
        )}
      </div>
      {/* Human slot */}
      <div className="wr-assign-slot">
        <button
          type="button"
          className={clsx('wr-assign-chip', 'wr-assign-chip--human', humanAssigned && 'is-set')}
          title={humanAssigned ? 'Human review assigned' : 'Assign for human review'}
          onClick={(e) => {
            e.stopPropagation();
            orders.assignTaskHuman(card.taskId, !humanAssigned);
          }}
        >
          <span className="wr-assign-chip-label">{humanAssigned ? 'you' : 'hmn'}</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card body
// ---------------------------------------------------------------------------

function CardBody({
  card,
  orders,
  mini,
}: {
  card: SimCardView;
  orders: Orders;
  mini: boolean;
}): React.JSX.Element {
  const seal = generateIcon({ entityId: card.taskId, kind: 'task', taskKind: card.taskKind });
  return (
    <div className={clsx('wr-card-body', mini && 'wr-card-body--mini')}>
      <span className="wr-card-seal" aria-hidden dangerouslySetInnerHTML={{ __html: seal.svg }} />
      <span className="wr-card-main">
        <span className="wr-card-title">{card.title}</span>
        <span className="wr-card-chips">
          <span className="wr-card-kind">{card.taskKind}</span>
          {card.dirtyFileCount > 0 && (
            <span className="wr-card-dirty" title={`${card.dirtyFileCount} uncommitted file(s)`}>
              {card.dirtyFileCount}Δ
            </span>
          )}
          {card.feedback !== null && !mini && (
            <span className="wr-card-feedback" title={card.feedback}>
              feedback
            </span>
          )}
          {card.hasPendingInquiry && <span className="wr-card-inquiry" title="inquiry pending">?</span>}
        </span>
      </span>
      <ProgressRing progress={card.progress} />
      <button
        type="button"
        data-testid={`card-yolo-${card.taskId}`}
        className={clsx('wr-card-yolo', card.yolo && 'is-on')}
        aria-pressed={card.yolo}
        title={card.yolo ? 'Yolo ON — review passes auto-approve' : 'Yolo OFF — review passes go to human review'}
        disabled={card.merged}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          orders.setYolo(card.taskId, !card.yolo);
        }}
      >
        yolo
      </button>
    </div>
  );
}

/** §V4-2 ghost snapshot: sanitized markup + the lifted card's start frame. */
interface GhostSnapshot {
  html: string;
  left: number;
  top: number;
  width: number;
}

function Card({ card, allCards, agents, rosterAgents, store, orders, selected, onHoverLane }: CardProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  /** Pending single-click review-open (cancelled by a double click, §V5-2). */
  const reviewTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (reviewTimerRef.current !== null) window.clearTimeout(reviewTimerRef.current);
    };
  }, []);
  const ghostRef = useRef<GhostSnapshot | null>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [snapback, setSnapback] = useState(false);
  const draggable = isDraggable(card);
  const children = childrenOf(allCards, card);
  const isStack = children.length > 0;

  const endDrag = (commitLane: ColumnId | null): void => {
    const plan = planDrop(card, commitLane);
    onHoverLane(null, null);
    dragRef.current = null;
    ghostRef.current = null;
    ref.current?.style.removeProperty('pointer-events');
    if (plan !== null) {
      setDrag(null);
      orders.moveCard(plan.taskId, plan.column);
      return;
    }
    // Invalid drop: snap back to the lane slot.
    if (reducedMotion()) {
      setDrag(null);
      return;
    }
    setSnapback(true);
    setDrag(null);
    window.setTimeout(() => setSnapback(false), SNAPBACK_MS);
  };

  const onPointerDown = (e: React.PointerEvent): void => {
    if (!draggable || e.button !== 0) return;
    if (e.target instanceof HTMLElement && e.target.closest('button')) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      dragging: false,
    };

    const onMove = (ev: PointerEvent): void => {
      const session = dragRef.current;
      if (session === null || ev.pointerId !== session.pointerId) return;
      session.dx = ev.clientX - session.startX;
      session.dy = ev.clientY - session.startY;
      if (!session.dragging) {
        if (Math.abs(session.dx) < DRAG_THRESHOLD_PX && Math.abs(session.dy) < DRAG_THRESHOLD_PX) return;
        session.dragging = true;
        suppressClickRef.current = true;
        const el = ref.current;
        if (el !== null) {
          // §V4-2: snapshot the lifted card for the top-level drag ghost and
          // turn the in-lane original into a dim, hit-test-free placeholder.
          const rect = el.getBoundingClientRect();
          ghostRef.current = {
            html: sanitizeGhostMarkup(el.outerHTML),
            left: rect.left,
            top: rect.top,
            width: rect.width,
          };
          el.style.setProperty('pointer-events', 'none');
        }
      }
      setDrag({ dx: session.dx, dy: session.dy });
      // Hit-test the lane under the pointer — the §V4-2 ghost layer rides
      // topmost, so resolve from the full hit stack, skipping the ghost.
      const lane = laneFromPoint(ev.clientX, ev.clientY);
      onHoverLane(card.column, lane);
    };

    const onUp = (ev: PointerEvent): void => {
      const session = dragRef.current;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      if (session === null || ev.pointerId !== session.pointerId) return;
      if (!session.dragging) {
        dragRef.current = null;
        return;
      }
      const lane = laneFromPoint(ev.clientX, ev.clientY);
      endDrag(lane);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    const onCancel = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      endDrag(null);
      suppressClickRef.current = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  };

  const onClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (suppressClickRef.current) return;
    store.getState().clickSelect(card.taskId, e.shiftKey);
    // SPEC-V3 §V3-4: a SINGLE click on a HUMAN REVIEW card opens the review
    // side panel (AC30). Deferred one double-click grace so a DOUBLE click
    // can cancel it and open the Inspector instead (§V5-2/AC46) — otherwise
    // the slide-over panel would swallow the second click of the pair.
    if (card.column === 'human-review' && !card.merged && e.detail === 1) {
      if (reviewTimerRef.current !== null) window.clearTimeout(reviewTimerRef.current);
      reviewTimerRef.current = window.setTimeout(() => {
        reviewTimerRef.current = null;
        store.getState().openReview(card.taskId);
      }, REVIEW_CLICK_GRACE_MS);
    }
  };

  const onDoubleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    // A double click supersedes the pending single-click review-open (§V5-2).
    if (reviewTimerRef.current !== null) {
      window.clearTimeout(reviewTimerRef.current);
      reviewTimerRef.current = null;
    }
    if (suppressClickRef.current) return;
    const first = card.agentIds[0];
    if (first !== undefined) {
      store.getState().openInspector(first);
    } else {
      // Agent-less cards open the Inspector in card mode (§V5-2 default-tab
      // policy: Sessions for the review-and-beyond columns, else Process).
      // The Inspector becomes primary — the review panel that the first
      // click of the double-click may have opened closes (§V4-3 rule, AC46).
      store.getState().openInspectorCard(card.taskId);
    }
  };

  const dragging = drag !== null;
  const ghost = ghostRef.current;
  // §V4-2: the in-lane original stays put as a dim placeholder (no inline
  // transform) while the portal ghost tracks the pointer above everything.
  const style: React.CSSProperties | undefined = dragging ? { pointerEvents: 'none' } : undefined;
  const inProduction = card.column === 'in-production';

  return (
    <div
      ref={ref}
      data-testid={`card-${card.taskId}`}
      data-card-column={card.column}
      role="button"
      tabIndex={0}
      className={clsx(
        'wr-card',
        isStack && 'wr-card--stack',
        card.merged && 'wr-card--merged',
        card.compacted && 'wr-card--compact',
        selected.has(card.taskId) && 'is-selected',
        draggable && 'is-draggable',
        dragging && 'is-dragging',
        snapback && 'is-snapback',
      )}
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') store.getState().clickSelect(card.taskId, e.shiftKey);
      }}
    >
      {drag !== null &&
        ghost !== null &&
        createPortal(
          <div className="wr-drag-ghost-layer" data-drag-ghost="true" aria-hidden="true">
            <div
              className="wr-drag-ghost"
              style={{ left: ghost.left + drag.dx, top: ghost.top + drag.dy, width: ghost.width }}
              dangerouslySetInnerHTML={{ __html: ghost.html }}
            />
          </div>,
          document.body,
        )}
      {card.merged && !inProduction && (
        <span className="wr-card-sealstamp" title="merged" aria-label="merged" />
      )}
      {inProduction && (
        <span
          className="wr-card-crown"
          title="in production"
          aria-label="in production"
          dangerouslySetInnerHTML={{ __html: CROWN_GLYPH }}
        />
      )}
      {!card.merged && card.agentIds.length > 0 && <span className="wr-card-eye" aria-hidden />}
      <CardBody card={card} orders={orders} mini={false} />
      {card.column === 'backlog' && (
        <AssignmentChips card={card} rosterAgents={rosterAgents} orders={orders} />
      )}
      <AgentSlot agentIds={card.agentIds} agents={agents} store={store} />
      {isStack && (
        <div className="wr-card-children">
          {children.map((child, index) => (
            <div
              key={child.taskId}
              data-testid={`card-${child.taskId}`}
              role="button"
              tabIndex={0}
              className={clsx('wr-card wr-card--mini', selected.has(child.taskId) && 'is-selected')}
              style={{ marginLeft: `${(index + 1) * 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                if (!suppressClickRef.current) store.getState().clickSelect(child.taskId, e.shiftKey);
              }}
              onDoubleClick={(e) => {
                const first = child.agentIds[0];
                if (first !== undefined) {
                  e.stopPropagation();
                  store.getState().openInspector(first);
                }
                // Agent-less mini: bubble to the stack PARENT — its card-mode
                // Inspector owns the stack's session forensics (§V5-2, AC47).
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') store.getState().clickSelect(child.taskId, e.shiftKey);
              }}
            >
              <CardBody card={child} orders={orders} mini />
              <AgentSlot agentIds={child.agentIds} agents={agents} store={store} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export interface KanbanBoardProps {
  store: CommanderStore;
  orders: Orders;
}

export function KanbanBoard({ store, orders }: KanbanBoardProps): React.JSX.Element {
  const board = useStore(store, (s) => s.board);
  const selectionIds = useStore(store, (s) => s.selection.ids);
  const movingCards = useStore(store, (s) => s.meta.movingCards);
  const reviewTaskId = useStore(store, (s) => s.meta.reviewTaskId);
  const rootRef = useRef<HTMLDivElement | null>(null);
  /** taskId → last laid-out rect (FLIP "first" positions, §V3-3). */
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());
  /** taskId → movingCards seq already animated. */
  const animatedRef = useRef<Map<string, number>>(new Map());
  /** taskId → the live move Animation (cancelled when a new move supersedes it). */
  const liveAnimsRef = useRef<Map<string, Animation>>(new Map());
  const [hover, setHover] = useState<{ from: ColumnId; lane: ColumnId } | null>(null);

  const cardViews = board.cardIds
    .map((id) => board.cards[id]?.view)
    .filter((v): v is SimCardView => v !== undefined);
  const selected = new Set(selectionIds);

  // FLIP arc glide for automatic moves (§V3-3). Runs after every commit:
  // compares each moved card's previous rect to its fresh lane slot and
  // animates the inverse delta down to identity with the `is-moving` class.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    const els = new Map<string, HTMLElement>();
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-testid^="card-"]'))) {
      const testid = el.getAttribute('data-testid') ?? '';
      if (testid.startsWith('card-agent-') || testid.startsWith('card-yolo-')) continue;
      els.set(testid.slice('card-'.length), el);
    }

    for (const [taskId, move] of Object.entries(movingCards)) {
      if (animatedRef.current.get(taskId) === move.seq) continue;
      animatedRef.current.set(taskId, move.seq);
      const el = els.get(taskId);
      if (el === undefined) {
        store.getState().clearMoving(taskId);
        continue;
      }
      // v4-r1: a still-running previous move (e.g. landing in MERGED as the
      // release lever fires) must not contaminate the LIVE target rect — and
      // its late finish must not strip the new move's is-moving class.
      const stale = liveAnimsRef.current.get(taskId);
      if (stale !== undefined) {
        liveAnimsRef.current.delete(taskId);
        stale.cancel();
      }
      const prev = rectsRef.current.get(taskId);
      const next = settledRect(el);
      const finish = (): void => {
        el.classList.remove('is-moving');
        store.getState().clearMoving(taskId);
      };
      if (reducedMotion() || prev === undefined) {
        // Reduced motion (or no previous position): instant + brief glow.
        el.classList.add('is-moving', 'wr-card--arrive-glow');
        window.setTimeout(() => {
          el.classList.remove('wr-card--arrive-glow');
          finish();
        }, 50);
        continue;
      }
      // v4-r1: clamp the glide ORIGIN to the visible board plate so a stale
      // first-rect can never launch the card off-canvas (belt and braces on
      // top of the settledRect fix).
      const board = root.getBoundingClientRect();
      const originX = Math.min(Math.max(prev.left, board.left + 4), Math.max(board.left + 4, board.right - next.width - 4));
      const originY = Math.min(Math.max(prev.top, board.top + 4), Math.max(board.top + 4, board.bottom - next.height - 4));
      const dx = originX - next.left;
      const dy = originY - next.top;
      if (dx === 0 && dy === 0) {
        finish();
        continue;
      }
      el.classList.add('is-moving');
      // Arc lift, clamped so the apex stays on the board plate.
      const apexHeadroom = Math.max(0, Math.min(originY, next.top) - (board.top + 4));
      const arcLift = Math.min(64, Math.max(24, Math.hypot(dx, dy) * 0.18), Math.max(8, apexHeadroom));
      // v5-r0: release wagons glide with a per-index delay (fill backwards
      // holds the wagon at its origin while it waits its turn in the train).
      const staggerDelay = move.stagger * RELEASE_STAGGER_MS;
      const animation = el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - arcLift}px)`, offset: 0.5 },
          { transform: 'translate(0px, 3px)', offset: 0.88 },
          { transform: 'translate(0px, 0px)' },
        ],
        { duration: MOVE_ANIM_MS, delay: staggerDelay, fill: 'backwards', easing: 'ease-in-out' },
      );
      liveAnimsRef.current.set(taskId, animation);
      const settle = (): void => {
        // Only the animation still registered for this card may retire the
        // move (a superseding move cancels this one AFTER re-registering).
        if (liveAnimsRef.current.get(taskId) === animation) {
          liveAnimsRef.current.delete(taskId);
          finish();
        }
      };
      animation.addEventListener('finish', settle);
      animation.addEventListener('cancel', settle);
    }

    // Record "first" rects for the next pass — SETTLED positions only
    // (v4-r1: never snapshot a transient mid-flight transform as an origin).
    const nextRects = new Map<string, DOMRect>();
    for (const [taskId, el] of els) {
      nextRects.set(taskId, settledRect(el));
    }
    rectsRef.current = nextRects;
  });

  // Prune stale animation bookkeeping when registry entries clear.
  useEffect(() => {
    for (const taskId of [...animatedRef.current.keys()]) {
      if (movingCards[taskId] === undefined) animatedRef.current.delete(taskId);
    }
    for (const taskId of [...liveAnimsRef.current.keys()]) {
      if (movingCards[taskId] === undefined) liveAnimsRef.current.delete(taskId);
    }
  }, [movingCards]);

  const onHoverLane = (from: ColumnId | null, lane: ColumnId | null): void => {
    setHover(from !== null && lane !== null ? { from, lane } : null);
  };

  return (
    <div ref={rootRef} className="wr-board" data-testid="kanban-board" aria-label="The Cogitator Board">
      {COLUMNS.map((columnId) => {
        const lane = cardsForColumn(cardViews, columnId);
        const cardCount = lane.reduce(
          (acc, c) => acc + 1 + c.childIds.length,
          0,
        );
        const isTarget = hover !== null && hover.lane === columnId;
        const isLegal = hover !== null && legalUserMove(hover.from, columnId);
        return (
          <section
            key={columnId}
            data-testid={`kanban-col-${columnId}`}
            className={clsx(
              'wr-lane',
              `wr-lane--${columnId}`,
              hover !== null && isLegal && 'is-drop-legal',
              isTarget && isLegal && 'is-drop-target',
              isTarget && !isLegal && 'is-drop-illegal',
            )}
            aria-label={COLUMN_TITLES[columnId]}
          >
            <header className="wr-lane-head">
              <span className="wr-lane-title">{COLUMN_TITLES[columnId]}</span>
              {columnId === 'merged' && (
                <button
                  type="button"
                  data-testid="col-release"
                  className="wr-release-lever"
                  disabled={lane.length === 0}
                  title={
                    lane.length === 0
                      ? 'The release lever waits — staging holds no merged cards'
                      : 'Throw the release lever — ship every merged card to production as one train (§V4-1)'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    orders.release();
                  }}
                >
                  <span className="wr-release-lever-glyph" aria-hidden dangerouslySetInnerHTML={{ __html: LEVER_GLYPH }} />
                  Release
                </button>
              )}
              <span className="wr-lane-count" data-testid={`kanban-count-${columnId}`}>
                {cardCount}
              </span>
            </header>
            {columnId === 'merged' && <div className="wr-lane-caption">staging</div>}
            {columnId === 'in-production' && <div className="wr-lane-caption">live</div>}
            <div className="wr-lane-cards">
              {lane.map((card) => {
                const el = (
                  <Card
                    key={card.taskId}
                    card={card}
                    allCards={cardViews}
                    agents={board.agents}
                    rosterAgents={board.rosterAgents}
                    store={store}
                    orders={orders}
                    selected={selected}
                    onHoverLane={onHoverLane}
                  />
                );
                // Slot wrappers (frozen e2e contract: `cardsInColumn(col)
                // .locator('[data-testid="card-<id>"]')` resolves the card
                // as a DESCENDANT of a card-prefixed element):
                //   - the DO lane wraps EVERY top-level card (v3 probes);
                //   - HUMAN REVIEW wraps ONLY the card whose review panel is
                //     open (AC45's tail asserts under an open panel), so
                //     AC30's bare `cardsInColumn('human-review').count()`
                //     wait keeps counting REAL cards 1:1 while no panel is
                //     up. Every other lane stays bare (`singleCardsIn`
                //     flat-singles contract).
                const slotted =
                  columnId === 'do' ||
                  (columnId === 'human-review' && card.taskId === reviewTaskId);
                return !slotted ? (
                  el
                ) : (
                  <div key={card.taskId} className="wr-card-slot" data-testid={`card-slot-${card.taskId}`}>
                    {el}
                  </div>
                );
              })}
              {lane.length === 0 &&
                (columnId === 'merged' || columnId === 'in-production' ? (
                  // §V4-1 release rail (v4-r0): etched empty-state caption
                  <div className="wr-lane-empty wr-lane-empty--rail">awaiting the release train</div>
                ) : (
                  <div className="wr-lane-empty">— empty plate —</div>
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

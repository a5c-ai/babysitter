/**
 * KanbanBoard (SPEC-V3 §V3-1): five brass-framed parchment lanes with etched
 * small-caps headers and live card-count chips. Cards are tasks — wax-seal
 * kind icon, serif title, kind chip, progress ring, yolo toggle, workspace
 * dirty badge and an agent slot of attending clockwork creatures. Subtask
 * stacks render the parent card with children fanned beneath (inside the
 * parent's draggable group). Merged cards compact to slim brass-sealed rows
 * at the bottom of APPROVED.
 *
 * Drag & drop (§V3-1): raw pointer events, no library. Lift shadow + tilt
 * while dragging, amber glow on legal drop lanes, snap-back on invalid drop;
 * every legal drop issues the sim verb `orders.moveCard`. Hit-testing uses
 * `elementFromPoint` with the dragged card's pointer-events disabled, so the
 * synthetic e2e pointer sequence (mouse.down → stepped moves → mouse.up)
 * works without pointer capture.
 *
 * Auto-move animation (§V3-3): `meta.movingCards` entries trigger a
 * FLIP-style ~600ms arc glide; the card carries `is-moving` for the duration
 * (e2e hook) and `clearMoving` retires the registry entry. Agent spawn =
 * gear-assemble (~500ms CSS), despawn = dissolve-to-sparks (ghost avatars
 * WITHOUT the card-agent testid). `prefers-reduced-motion` collapses both to
 * instant + glow.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import {
  cardsForColumn,
  childrenOf,
  columnFromElement,
  COLUMN_TITLES,
  COLUMNS,
  isDraggable,
  legalUserMove,
  planDrop,
  type ColumnId,
} from '../../game/board';
import { formatPct } from '../../game/selectors';
import type { CommanderStore, Orders } from '../../game/store';
import type { SimAgentView, SimCardView } from '../../backend/mock/simulation';
import { generateIcon } from '../../microagent/mock/iconGen';

const DRAG_THRESHOLD_PX = 4;
const MOVE_ANIM_MS = 600;
const SNAPBACK_MS = 220;
const DESPAWN_MS = 450;

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
            title={`${agent?.role ?? 'agent'} · ${adapter} — click to select, double-click to inspect`}
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

function Card({ card, allCards, agents, store, orders, selected, onHoverLane }: CardProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [snapback, setSnapback] = useState(false);
  const draggable = isDraggable(card);
  const children = childrenOf(allCards, card);
  const isStack = children.length > 0;

  const endDrag = (commitLane: ColumnId | null): void => {
    const plan = planDrop(card, commitLane);
    onHoverLane(null, null);
    dragRef.current = null;
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
        // Disable hit-testing on the lifted card immediately (synchronously,
        // ahead of the React state flush) so elementFromPoint sees the lane.
        ref.current?.style.setProperty('pointer-events', 'none');
      }
      setDrag({ dx: session.dx, dy: session.dy });
      // Hit-test the lane under the pointer (the dragged card itself has
      // pointer-events: none while lifted — see style below).
      const lane = columnFromElement(document.elementFromPoint(ev.clientX, ev.clientY));
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
      const lane = columnFromElement(document.elementFromPoint(ev.clientX, ev.clientY));
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
    // side panel (AC30).
    if (card.column === 'human-review' && !card.merged) {
      store.getState().openReview(card.taskId);
    }
  };

  const onDoubleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (suppressClickRef.current) return;
    const first = card.agentIds[0];
    if (first !== undefined) {
      store.getState().openInspector(first);
    } else if (card.column !== 'human-review') {
      // Agent-less cards open the Inspector in card mode (Process tab
      // default, §V2-5); human-review cards already opened the review panel.
      store.getState().openInspectorCard(card.taskId);
    }
  };

  const dragging = drag !== null;
  const style: React.CSSProperties | undefined = dragging
    ? {
        transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(2.2deg)`,
        pointerEvents: 'none',
        zIndex: 60,
      }
    : undefined;

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
      {card.merged && <span className="wr-card-sealstamp" title="merged" aria-label="merged" />}
      {!card.merged && card.agentIds.length > 0 && <span className="wr-card-eye" aria-hidden />}
      <CardBody card={card} orders={orders} mini={false} />
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
                e.stopPropagation();
                const first = child.agentIds[0];
                if (first !== undefined) store.getState().openInspector(first);
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  /** taskId → last laid-out rect (FLIP "first" positions, §V3-3). */
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());
  /** taskId → movingCards seq already animated. */
  const animatedRef = useRef<Map<string, number>>(new Map());
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
      const prev = rectsRef.current.get(taskId);
      const next = el.getBoundingClientRect();
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
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx === 0 && dy === 0) {
        finish();
        continue;
      }
      el.classList.add('is-moving');
      const arcLift = Math.min(64, Math.max(24, Math.hypot(dx, dy) * 0.18));
      const animation = el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - arcLift}px)`, offset: 0.5 },
          { transform: 'translate(0px, 3px)', offset: 0.88 },
          { transform: 'translate(0px, 0px)' },
        ],
        { duration: MOVE_ANIM_MS, easing: 'ease-in-out' },
      );
      animation.addEventListener('finish', finish);
      animation.addEventListener('cancel', finish);
    }

    // Record "first" rects for the next pass.
    const nextRects = new Map<string, DOMRect>();
    for (const [taskId, el] of els) {
      nextRects.set(taskId, el.getBoundingClientRect());
    }
    rectsRef.current = nextRects;
  });

  // Prune stale animation bookkeeping when registry entries clear.
  useEffect(() => {
    for (const taskId of [...animatedRef.current.keys()]) {
      if (movingCards[taskId] === undefined) animatedRef.current.delete(taskId);
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
              <span className="wr-lane-count" data-testid={`kanban-count-${columnId}`}>
                {cardCount}
              </span>
            </header>
            <div className="wr-lane-cards">
              {lane.map((card) => {
                const el = (
                  <Card
                    key={card.taskId}
                    card={card}
                    allCards={cardViews}
                    agents={board.agents}
                    store={store}
                    orders={orders}
                    selected={selected}
                    onHoverLane={onHoverLane}
                  />
                );
                // ONLY the DO lane wraps each top-level card in a slot
                // element (frozen e2e contract: `cardsInColumn('do')
                // .locator('[data-testid="card-<id>"]')` resolves the card as
                // a DESCENDANT of a card-prefixed element). Every other lane
                // stays bare so raw `cardsInColumn(col).count()` waits (e.g.
                // AC30's "≥2 cards in HUMAN REVIEW") count REAL cards, not
                // slot wrappers, and `singleCardsIn('backlog')` sees flat
                // singles.
                return columnId !== 'do' ? (
                  el
                ) : (
                  <div key={card.taskId} className="wr-card-slot" data-testid={`card-slot-${card.taskId}`}>
                    {el}
                  </div>
                );
              })}
              {lane.length === 0 && <div className="wr-lane-empty">— empty plate —</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

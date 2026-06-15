/**
 * Inspector SESSIONS tab (SPEC-V5 §V5-2, AC46/AC47): session forensics for a
 * card — every persisted session (worker / reviewer / integration, plus the
 * stack parent's coordination sessions) grouped by attempt with etched
 * ATTEMPT dividers. Subsessions (rows whose `parentSessionId` matches a
 * listed session) render NESTED beneath their parent with an engraved CSS
 * connector bracket (zero <line>/<polyline> — frozen census). Reviewer rows
 * carry a "reviewed ⟶ <worker title>" link chip.
 *
 * Clicking a row opens the read-only session transcript view
 * (`data-testid="session-transcript"`): the same bubble family as the live
 * Transcript tab ('event' entries as small centered etched lines), a header
 * with portrait + role/status/stack chips, parent/reviewOf link chips and a
 * back link to the list. ACTIVE sessions keep growing — the Inspector
 * re-renders per committed tick, so the view IS the live transcript.
 */

import { Fragment, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { formatInt, formatUsd } from '../../game/selectors';
import {
  backToSessionList,
  groupSessionsByAttempt,
  openSessionTranscript,
  SESSIONS_LIST_VIEW,
  sessionsForCard,
  type SessionRowNode,
  type SessionsTabView,
} from '../../game/sessions';
import type { SimViews } from '../../game/views';
import type {
  SimSessionTranscriptEntry,
  SimSessionView,
} from '../../backend/mock/simulation';
import { generateIcon } from '../../microagent/mock/iconGen';
import { TOOL_GLYPH } from './Inspector';

export interface SessionsTabProps {
  views: SimViews;
  taskId: string | null;
  childIds: readonly string[];
}

// ---------------------------------------------------------------------------
// Shared row chips
// ---------------------------------------------------------------------------

function RoleStackChips({ session }: { session: SimSessionView }): React.JSX.Element {
  return (
    <>
      <span className={clsx('wr-sess-role', `wr-sess-role--${session.role}`)}>{session.role}</span>
      {session.coordination && <span className="wr-sess-role wr-sess-role--coordination">coordination</span>}
      <span className="wr-sess-stack" title="agent stack">
        {session.stackName}
      </span>
    </>
  );
}

function StatusChip({ session }: { session: SimSessionView }): React.JSX.Element {
  return (
    <span className={clsx('wr-sess-status', `wr-sess-status--${session.status}`)}>
      {session.status}
    </span>
  );
}

function SessionChips({ session }: { session: SimSessionView }): React.JSX.Element {
  return (
    <>
      <RoleStackChips session={session} />
      <StatusChip session={session} />
    </>
  );
}

function tickRange(session: SimSessionView): string {
  return `T${formatInt(session.startedTick)} → ${session.endedTick !== null ? `T${formatInt(session.endedTick)}` : 'now'}`;
}

// ---------------------------------------------------------------------------
// Session list (grouped by attempt, nested subsessions, §V5-2)
// ---------------------------------------------------------------------------

function SessionRow({
  node,
  views,
  onOpen,
}: {
  node: SessionRowNode;
  views: SimViews;
  onOpen: (sessionId: string) => void;
}): React.JSX.Element {
  const s = node.session;
  const icon = generateIcon({ entityId: s.sessionId, kind: 'unit', adapter: s.agent });
  const reviewed =
    s.reviewOfSessionId !== null ? views.getSession(s.reviewOfSessionId)?.record : undefined;
  const tokens = s.tokenUsage.inputTokens + s.tokenUsage.outputTokens + s.tokenUsage.thinkingTokens;
  return (
    <>
      <div
        data-testid={`session-row-${s.sessionId}`}
        className="wr-sess-row"
        role="button"
        tabIndex={0}
        onClick={() => onOpen(s.sessionId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpen(s.sessionId);
        }}
      >
        <span className="wr-sess-portrait" aria-hidden dangerouslySetInnerHTML={{ __html: icon.svg }} />
        <span className="wr-sess-main">
          <span className="wr-sess-title">{s.title}</span>
          {/* v5-r1 (8): chips flow on two fixed lines — role + stack on line
              one, status + reviewed-link on line two — so every row keeps the
              same height whether or not a reviewed-link chip exists. */}
          <span className="wr-sess-chiprow wr-sess-chiprow--line">
            <RoleStackChips session={s} />
          </span>
          <span className="wr-sess-chiprow wr-sess-chiprow--line">
            <StatusChip session={s} />
            {reviewed !== undefined && (
              // v5-r0: chip label drops the role suffix (the full title rides
              // the tooltip) so creature names survive the ellipsis.
              <button
                type="button"
                className="wr-sess-reviewed"
                title={`open the reviewed session — ${reviewed.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(reviewed.sessionId);
                }}
              >
                reviewed ⟶ {reviewed.creatureName}
              </button>
            )}
          </span>
        </span>
        <span className="wr-sess-meta">
          <span className="wr-sess-meta-line">
            {formatInt(s.turnCount)} turns · {formatInt(tokens)} tok · {formatUsd(s.cost.totalUsd)}
          </span>
          <span className="wr-sess-meta-line wr-sess-ticks">{tickRange(s)}</span>
        </span>
      </div>
      {node.children.length > 0 && (
        <div className="wr-sess-children">
          {node.children.map((child) => (
            <SessionRow key={child.session.sessionId} node={child} views={views} onOpen={onOpen} />
          ))}
        </div>
      )}
    </>
  );
}

/** Grouped session list — exported for the Registry task detail (§V5-3). */
export function SessionList({
  sessions,
  views,
  onOpen,
}: {
  sessions: SimSessionView[];
  views: SimViews;
  onOpen: (sessionId: string) => void;
}): React.JSX.Element {
  const groups = groupSessionsByAttempt(sessions);
  if (groups.length === 0) {
    return <div className="wr-inspector-body wr-tab-empty">no sessions yet — no agent has attended this card</div>;
  }
  return (
    <div className="wr-inspector-body wr-sessions">
      <div className="wr-sess-scroll">
        {groups.map((group) => (
          <Fragment key={group.attempt}>
            <div className="wr-sess-divider">ATTEMPT {group.attempt}</div>
            {group.rows.map((node) => (
              <SessionRow key={node.session.sessionId} node={node} views={views} onOpen={onOpen} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Read-only transcript view (`session-transcript`, §V5-2)
// ---------------------------------------------------------------------------

function SessionBubble({ entry }: { entry: SimSessionTranscriptEntry }): React.JSX.Element {
  switch (entry.kind) {
    case 'thinking':
      return (
        <li className="wr-tr wr-tr--thinking">
          <span className="wr-tr-role">THINKING</span>
          {entry.text}
        </li>
      );
    case 'tool_call':
    case 'tool_result':
      return (
        <li className="wr-tr wr-tr--tool">
          <span className="wr-tr-tool-glyph" dangerouslySetInnerHTML={{ __html: TOOL_GLYPH }} />
          <span className="wr-tr-tool-name">{entry.toolName ?? 'tool'}</span>
          <span className="wr-tr-tool-meta">{entry.kind === 'tool_call' ? entry.text : `→ ${entry.text}`}</span>
        </li>
      );
    case 'user':
      return (
        <li className="wr-tr wr-tr--text wr-tr--user">
          <span className="wr-tr-role">OPERATOR</span>
          {entry.text}
        </li>
      );
    case 'event':
      // Small centered etched line (§V5-2: 'event' entries).
      return <li className="wr-sess-event">{entry.text}</li>;
    case 'message':
    default:
      return (
        <li className="wr-tr wr-tr--text">
          <span className="wr-tr-role">AGENT</span>
          {entry.text}
        </li>
      );
  }
}

/** Read-only transcript view — exported for the Registry agent detail (§V5-3). */
export function SessionTranscript({
  sessionId,
  views,
  onOpen,
  onBack,
  hideParentLink = false,
}: {
  sessionId: string;
  views: SimViews;
  onOpen: (sessionId: string) => void;
  onBack: () => void;
  /**
   * v5-r1 (5): the Registry agent detail renders its own sub-header link
   * chips (AgentLinkChips) above this view — suppress the breadcrumb-trail
   * parent chip there so the link appears exactly once.
   */
  hideParentLink?: boolean;
}): React.JSX.Element {
  const detail = views.getSession(sessionId);
  const listRef = useRef<HTMLOListElement | null>(null);
  const length = detail?.transcript.length ?? 0;
  const active = detail?.record.status === 'active';

  // ACTIVE sessions grow per tick — keep the live tail in view (§V5-2).
  useEffect(() => {
    const list = listRef.current;
    if (list !== null && active) list.scrollTop = list.scrollHeight;
  }, [length, sessionId, active]);

  if (detail === null) {
    return (
      <div className="wr-inspector-body wr-tab-empty" data-testid="session-transcript">
        unknown session — the archive holds no such record
      </div>
    );
  }
  const record = detail.record;
  const icon = generateIcon({ entityId: record.sessionId, kind: 'unit', adapter: record.agent });
  const parent =
    record.parentSessionId !== null ? views.getSession(record.parentSessionId)?.record : undefined;
  const reviewed =
    record.reviewOfSessionId !== null ? views.getSession(record.reviewOfSessionId)?.record : undefined;

  return (
    <div className="wr-inspector-body wr-sess-transcript" data-testid="session-transcript">
      <div className="wr-sess-tr-head">
        <span className="wr-sess-portrait wr-sess-portrait--lg" aria-hidden dangerouslySetInnerHTML={{ __html: icon.svg }} />
        <div className="wr-sess-tr-id">
          <div className="wr-sess-tr-title">{record.title}</div>
          <div className="wr-sess-chiprow">
            <SessionChips session={record} />
          </div>
        </div>
        <span className="wr-sess-meta">
          <span className="wr-sess-meta-line">
            {formatInt(record.turnCount)} turns · {formatUsd(record.cost.totalUsd)}
          </span>
          <span className="wr-sess-meta-line wr-sess-ticks">{tickRange(record)}</span>
        </span>
      </div>
      <div className="wr-sess-linkrow">
        <button type="button" className="wr-sess-back" onClick={onBack}>
          ‹ back to sessions
        </button>
        {parent !== undefined && !hideParentLink && (
          <button
            type="button"
            className="wr-sess-linkchip"
            title={`open the parent session — ${parent.title}`}
            onClick={() => onOpen(parent.sessionId)}
          >
            parent ⟶ {parent.title}
          </button>
        )}
        {reviewed !== undefined && (
          <button
            type="button"
            className="wr-sess-linkchip"
            title={`open the reviewed session — ${reviewed.title}`}
            onClick={() => onOpen(reviewed.sessionId)}
          >
            reviewed ⟶ {reviewed.creatureName}
          </button>
        )}
      </div>
      <ol ref={listRef} className="wr-inspector-stream wr-sess-stream" aria-label="Session transcript (read-only)">
        {detail.transcript.length === 0 && (
          <li className="wr-tr wr-tr--note">an empty ledger — the session logged nothing</li>
        )}
        {detail.transcript.map((entry) => (
          <SessionBubble key={entry.seq} entry={entry} />
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab shell (list ⇄ transcript routing, §V5-2)
// ---------------------------------------------------------------------------

export function SessionsTab({ views, taskId, childIds }: SessionsTabProps): React.JSX.Element {
  const [view, setView] = useState<SessionsTabView>(SESSIONS_LIST_VIEW);

  // Retargeting the Inspector onto another card returns to the list.
  useEffect(() => {
    setView(SESSIONS_LIST_VIEW);
  }, [taskId]);

  if (taskId === null) {
    return <div className="wr-inspector-body wr-tab-empty">no card — sessions attach to cards</div>;
  }
  const open = (sessionId: string): void => setView(openSessionTranscript(sessionId));

  if (view.mode === 'transcript') {
    return (
      <SessionTranscript
        sessionId={view.sessionId}
        views={views}
        onOpen={open}
        onBack={() => setView(backToSessionList())}
      />
    );
  }
  const sessions = sessionsForCard(views.listSessions(), taskId, childIds);
  return <SessionList sessions={sessions} views={views} onOpen={open} />;
}

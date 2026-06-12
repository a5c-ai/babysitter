/**
 * The Registry overlay (SPEC-V5 §V5-3, AC48–AC51): full-screen parchment
 * ledger (same family as the Runs overlay), opened via `topbar-registry` or
 * the §V5-4 stack deep-link (sel-stack-link / Inspector stack chip). It
 * separates entity kinds the way kradle does — config vs execution:
 *
 *   Stacks      (config,    mirrors AgentStack)      — every seeded + forged stack
 *   Agents      (execution, mirrors AgentSession)    — ALL sessions ever (§V5-1)
 *   Tasks       (execution, mirrors AgentDispatchRun)— every card
 *   Workspaces  (           listWorkspaces() view)   — git/cards/sessions per ws
 *
 * Navigation is the pure state machine in game/registry.ts: tab → list →
 * detail (→ detail …); every cross-link pushes onto the breadcrumb trail and
 * `registry-back` pops — EXCEPT run links, which exit to the Runs overlay
 * (it renders above; Esc returns to the registry's preserved state).
 *
 * Census rules: tabs are role="tab" plates (not <button>s), zero
 * <line>/<polyline> (path-only glyphs), no class contains "current".
 */

import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import { formatInt, formatUsd } from '../../game/selectors';
import {
  canRegistryBack,
  openRegistryDetail,
  personalityExcerpt,
  registryBack,
  REGISTRY_KINDS,
  registryHome,
  registryStackDeepLink,
  selectRegistryTab,
  sessionsOfStack,
  sessionTokensTotal,
  stackByRef,
  type RegistryKind,
  type RegistryNavState,
} from '../../game/registry';
import { sessionsForCard } from '../../game/sessions';
import type { CommanderStore } from '../../game/store';
import type { SimViews } from '../../game/views';
import type {
  SimCardView,
  SimSessionView,
  SimStackView,
  SimWorkspaceSummaryView,
} from '../../backend/mock/simulation';
import { generateIcon } from '../../microagent/mock/iconGen';
import { SessionList, SessionTranscript } from './SessionsTab';

export interface RegistryOverlayProps {
  store: CommanderStore;
  views: SimViews;
}

/** Tab strip labels (§V5-3 kinds, in spec order). */
const TAB_LABELS: Record<RegistryKind, string> = {
  stacks: 'Stacks',
  agents: 'Agents',
  tasks: 'Tasks',
  workspaces: 'Workspaces',
};

/** Shared navigation callbacks threaded through every list/detail. */
interface RegistryNav {
  openDetail(tab: RegistryKind, id: string): void;
  /** Run links EXIT to the Runs overlay detail (§V5-3 exception). */
  openRun(runId: string): void;
}

/** Resolve card titles for cross-link captions. */
function cardTitle(cards: readonly SimCardView[], taskId: string): string {
  return cards.find((c) => c.taskId === taskId)?.title ?? taskId;
}

function shortSha(sha: string): string {
  return sha.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Stacks tab (config — mirrors AgentStack, §V5-3)
// ---------------------------------------------------------------------------

function StackChips({ stack }: { stack: SimStackView }): React.JSX.Element {
  const spec = stack.stack.spec;
  return (
    <>
      <span className={`wr-sel-adapter wr-faction-text--${spec.adapter}`}>{spec.adapter}</span>
      <span className="wr-reg-model">{spec.model}</span>
      <span className="wr-reg-approval" title="approval mode">
        {spec.approvalMode}
      </span>
      <span className="wr-reg-phase" title="stack phase">
        {stack.stack.status.phase}
      </span>
      {stack.custom && <span className="wr-reg-custom">CUSTOM</span>}
    </>
  );
}

function StacksList({ views, nav }: { views: SimViews; nav: RegistryNav }): React.JSX.Element {
  const stacks = views.listStacks();
  return (
    <ul className="wr-reg-table" aria-label="Agent stacks">
      {stacks.map((stack) => (
        <li
          key={stack.stackRef}
          data-testid={`registry-row-${stack.stackRef}`}
          className="wr-reg-row"
          role="button"
          tabIndex={0}
          onClick={() => nav.openDetail('stacks', stack.stackRef)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') nav.openDetail('stacks', stack.stackRef);
          }}
        >
          <span className="wr-reg-name">{stack.name}</span>
          <span className="wr-reg-chiprow">
            <StackChips stack={stack} />
          </span>
          <span className="wr-reg-excerpt" title="personality (prompt.system)">
            {personalityExcerpt(stack)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StackDetail({
  stackRef,
  store,
  views,
  nav,
}: {
  stackRef: string;
  store: CommanderStore;
  views: SimViews;
  nav: RegistryNav;
}): React.JSX.Element {
  const stack = stackByRef(views.listStacks(), stackRef);
  if (stack === undefined) {
    return <div className="wr-tab-empty">no such stack — the roster holds no “{stackRef}”</div>;
  }
  const spawned = sessionsOfStack(views.listSessions(), stackRef);
  const prompt = stack.stack.spec.prompt;
  return (
    <div className="wr-reg-detail" data-testid="registry-stack-detail">
      <div className="wr-reg-detail-head">
        <span className="wr-reg-detail-title">{stack.name}</span>
        <span className="wr-reg-chiprow">
          <StackChips stack={stack} />
        </span>
        <button
          type="button"
          className="wr-reg-foundry"
          title="open this roster in the Foundry's Stacks tab (§V5-3)"
          onClick={() => store.getState().openFoundryStacks()}
        >
          OPEN IN FOUNDRY
        </button>
      </div>
      <div className="wr-reg-plates">
        <div className="wr-reg-plate-block">
          <div className="wr-reg-plate-label">prompt.system</div>
          <pre className="wr-reg-plate">{prompt.system}</pre>
        </div>
        {prompt.developer !== undefined && prompt.developer !== '' && (
          <div className="wr-reg-plate-block">
            <div className="wr-reg-plate-label">prompt.developer</div>
            <pre className="wr-reg-plate">{prompt.developer}</pre>
          </div>
        )}
      </div>
      <div className="wr-reg-section">SPAWNED SESSIONS</div>
      {spawned.length === 0 && (
        <div className="wr-tab-empty">no sessions yet — this stack has not attended a card</div>
      )}
      <ul className="wr-reg-sublist" aria-label="Sessions spawned by this stack">
        {spawned.map((session) => (
          <li
            key={session.sessionId}
            className={clsx('wr-reg-subrow', `wr-reg-subrow--${session.status}`)}
            role="button"
            tabIndex={0}
            onClick={() => nav.openDetail('agents', session.sessionId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') nav.openDetail('agents', session.sessionId);
            }}
          >
            <span className="wr-reg-name">{session.title}</span>
            <span className={clsx('wr-sess-status', `wr-sess-status--${session.status}`)}>
              {session.status}
            </span>
            <span className="wr-reg-dim">
              {formatInt(session.turnCount)} turns · {formatUsd(session.cost.totalUsd)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agents tab (execution — ALL sessions ever, §V5-1/§V5-3)
// ---------------------------------------------------------------------------

function AgentsList({
  views,
  cards,
  nav,
}: {
  views: SimViews;
  cards: readonly SimCardView[];
  nav: RegistryNav;
}): React.JSX.Element {
  const sessions = views.listSessions();
  if (sessions.length === 0) {
    return <div className="wr-tab-empty">no sessions recorded — start a card working</div>;
  }
  return (
    <ul className="wr-reg-table" aria-label="All agent sessions">
      {sessions.map((session) => {
        const icon = generateIcon({ entityId: session.sessionId, kind: 'unit', adapter: session.agent });
        return (
          <li
            key={session.sessionId}
            data-testid={`registry-row-${session.sessionId}`}
            className={clsx('wr-reg-row', 'wr-reg-row--agent', `wr-reg-row--${session.status}`)}
            role="button"
            tabIndex={0}
            onClick={() => nav.openDetail('agents', session.sessionId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') nav.openDetail('agents', session.sessionId);
            }}
          >
            <span className="wr-sess-portrait" aria-hidden dangerouslySetInnerHTML={{ __html: icon.svg }} />
            <span className="wr-reg-name">{session.title}</span>
            <span className={clsx('wr-sess-role', `wr-sess-role--${session.role}`)}>{session.role}</span>
            <button
              type="button"
              className="wr-reg-link"
              title={`open the stack "${session.stackName}"`}
              onClick={(e) => {
                e.stopPropagation();
                nav.openDetail('stacks', session.stackRef);
              }}
            >
              {session.stackName}
            </button>
            <button
              type="button"
              className="wr-reg-link"
              title="open the attended task"
              onClick={(e) => {
                e.stopPropagation();
                nav.openDetail('tasks', session.taskId);
              }}
            >
              {cardTitle(cards, session.taskId)}
            </button>
            <span className={clsx('wr-sess-status', `wr-sess-status--${session.status}`)}>
              {session.status}
            </span>
            <span className="wr-reg-dim">
              {formatInt(session.turnCount)} turns · {formatInt(sessionTokensTotal(session))} tok ·{' '}
              {formatUsd(session.cost.totalUsd)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Link chips of an agent detail (§V5-3: task/run/workspace/stack/parent/reviewOf). */
function AgentLinkChips({
  session,
  cards,
  views,
  nav,
}: {
  session: SimSessionView;
  cards: readonly SimCardView[];
  views: SimViews;
  nav: RegistryNav;
}): React.JSX.Element {
  const card = cards.find((c) => c.taskId === session.taskId);
  const parent =
    session.parentSessionId !== null ? views.getSession(session.parentSessionId)?.record : undefined;
  const reviewed =
    session.reviewOfSessionId !== null ? views.getSession(session.reviewOfSessionId)?.record : undefined;
  return (
    <div className="wr-reg-chiprow wr-reg-linkrow">
      <button
        type="button"
        className="wr-reg-link"
        title={`open the stack "${session.stackName}"`}
        onClick={() => nav.openDetail('stacks', session.stackRef)}
      >
        stack ⟶ {session.stackName}
      </button>
      <button
        type="button"
        className="wr-reg-link"
        title="open the attended task"
        onClick={() => nav.openDetail('tasks', session.taskId)}
      >
        task ⟶ {cardTitle(cards, session.taskId)}
      </button>
      {session.runId !== null && (
        <button
          type="button"
          className="wr-reg-link"
          title="open this run in the Runs ledger (§V5-3: run links exit to the Runs overlay)"
          onClick={() => nav.openRun(session.runId!)}
        >
          run ⟶ {session.runId}
        </button>
      )}
      {card !== undefined && card.workspaceId !== '' && (
        <button
          type="button"
          className="wr-reg-link"
          title="open the workspace"
          onClick={() => nav.openDetail('workspaces', card.workspaceId)}
        >
          workspace ⟶ {card.workspaceId}
        </button>
      )}
      {parent !== undefined && (
        <button
          type="button"
          className="wr-reg-link"
          title={`open the parent session — ${parent.title}`}
          onClick={() => nav.openDetail('agents', parent.sessionId)}
        >
          parent ⟶ {parent.title}
        </button>
      )}
      {reviewed !== undefined && (
        <button
          type="button"
          className="wr-reg-link"
          title={`open the reviewed session — ${reviewed.title}`}
          onClick={() => nav.openDetail('agents', reviewed.sessionId)}
        >
          reviewed ⟶ {reviewed.title}
        </button>
      )}
    </div>
  );
}

function AgentDetail({
  sessionId,
  cards,
  views,
  nav,
  onBack,
}: {
  sessionId: string;
  cards: readonly SimCardView[];
  views: SimViews;
  nav: RegistryNav;
  onBack: () => void;
}): React.JSX.Element {
  const record = views.getSession(sessionId)?.record;
  return (
    <div className="wr-reg-detail" data-testid="registry-agent-detail">
      {record !== undefined && (
        // Link chips render ABOVE the transcript (DOM-first for the stack
        // chip — §V5-3: "clicking its stack chip navigates to stack detail").
        <AgentLinkChips session={record} cards={cards} views={views} nav={nav} />
      )}
      <SessionTranscript
        sessionId={sessionId}
        views={views}
        onOpen={(id) => nav.openDetail('agents', id)}
        onBack={onBack}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tasks tab (execution — every card, §V5-3)
// ---------------------------------------------------------------------------

function TasksList({
  cards,
  views,
  nav,
}: {
  cards: readonly SimCardView[];
  views: SimViews;
  nav: RegistryNav;
}): React.JSX.Element {
  const stacks = views.listStacks();
  return (
    <ul className="wr-reg-table" aria-label="All tasks">
      {cards.map((card) => (
        <li
          key={card.taskId}
          data-testid={`registry-row-${card.taskId}`}
          className="wr-reg-row"
          role="button"
          tabIndex={0}
          onClick={() => nav.openDetail('tasks', card.taskId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') nav.openDetail('tasks', card.taskId);
          }}
        >
          <span className={`wr-card-kind wr-card-kind--${card.taskKind}`}>{card.taskKind}</span>
          <span className="wr-reg-name">{card.title}</span>
          <span className="wr-reg-column">{card.column}</span>
          <span className="wr-reg-dim" title="attempts">
            attempt {formatInt(card.attempt)}
          </span>
          {card.yolo && <span className="wr-reg-yolo">yolo</span>}
          <button
            type="button"
            className="wr-reg-link"
            title="open the bound agent stack"
            onClick={(e) => {
              e.stopPropagation();
              nav.openDetail('stacks', card.stackRef);
            }}
          >
            {stackByRef(stacks, card.stackRef)?.name ?? card.stackRef}
          </button>
          {card.workspaceId !== '' && (
            <button
              type="button"
              className="wr-reg-link"
              title="open the workspace"
              onClick={(e) => {
                e.stopPropagation();
                nav.openDetail('workspaces', card.workspaceId);
              }}
            >
              {card.workspaceId}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function TaskDetail({
  taskId,
  cards,
  views,
  nav,
}: {
  taskId: string;
  cards: readonly SimCardView[];
  views: SimViews;
  nav: RegistryNav;
}): React.JSX.Element {
  const card = cards.find((c) => c.taskId === taskId);
  if (card === undefined) {
    return <div className="wr-tab-empty">no such task — the board holds no “{taskId}”</div>;
  }
  const parent = card.parentId !== null ? cards.find((c) => c.taskId === card.parentId) : undefined;
  const children = card.childIds
    .map((id) => cards.find((c) => c.taskId === id))
    .filter((c): c is SimCardView => c !== undefined);
  const runs = views.listRuns().filter((r) => r.taskId === taskId);
  const ws = views.getWorkspaceView(taskId);
  const sessions = sessionsForCard(views.listSessions(), taskId, card.childIds);
  return (
    <div className="wr-reg-detail" data-testid="registry-task-detail">
      <div className="wr-reg-detail-head">
        <span className={`wr-card-kind wr-card-kind--${card.taskKind}`}>{card.taskKind}</span>
        <span className="wr-reg-detail-title">{card.title}</span>
        <span className="wr-reg-column">{card.column}</span>
        <span className="wr-reg-dim">attempt {formatInt(card.attempt)}</span>
        {card.yolo && <span className="wr-reg-yolo">yolo</span>}
      </div>

      {(parent !== undefined || children.length > 0) && (
        <>
          <div className="wr-reg-section">HIERARCHY</div>
          <ul className="wr-reg-sublist" aria-label="Task hierarchy">
            {parent !== undefined && (
              <li
                className="wr-reg-subrow"
                role="button"
                tabIndex={0}
                onClick={() => nav.openDetail('tasks', parent.taskId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') nav.openDetail('tasks', parent.taskId);
                }}
              >
                <span className="wr-reg-dim">parent ⟶</span>
                <span className="wr-reg-name">{parent.title}</span>
              </li>
            )}
            {children.map((child) => (
              <li
                key={child.taskId}
                className="wr-reg-subrow"
                role="button"
                tabIndex={0}
                onClick={() => nav.openDetail('tasks', child.taskId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') nav.openDetail('tasks', child.taskId);
                }}
              >
                <span className="wr-reg-dim">child ⟶</span>
                <span className="wr-reg-name">{child.title}</span>
                <span className="wr-reg-column">{child.column}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="wr-reg-section">SESSIONS</div>
      <SessionList
        sessions={sessions}
        views={views}
        onOpen={(id) => nav.openDetail('agents', id)}
      />

      <div className="wr-reg-section">RUNS</div>
      {runs.length === 0 && <div className="wr-tab-empty">no rites recorded for this card</div>}
      <ul className="wr-reg-sublist" aria-label="Runs of this task">
        {runs.map((run) => (
          <li
            key={run.runId}
            className="wr-reg-subrow"
            role="button"
            tabIndex={0}
            title="open this run in the Runs ledger (§V5-3)"
            onClick={() => nav.openRun(run.runId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') nav.openRun(run.runId);
            }}
          >
            <span className="wr-reg-dim">run ⟶</span>
            <span className="wr-reg-name">{run.runId}</span>
            <span className="wr-reg-dim">{run.processId}</span>
            <span className={`wr-runstate wr-runstate--${run.observedState}`}>{run.observedState}</span>
          </li>
        ))}
      </ul>

      <div className="wr-reg-section">WORKSPACE</div>
      {ws === null ? (
        <div className="wr-tab-empty">no workspace bound</div>
      ) : (
        <div className="wr-reg-ws-summary">
          {card.workspaceId !== '' && (
            <button
              type="button"
              className="wr-reg-link"
              title="open the workspace"
              onClick={() => nav.openDetail('workspaces', card.workspaceId)}
            >
              {card.workspaceId}
            </button>
          )}
          <span className="wr-reg-dim">branch</span>
          <span className="wr-reg-mono">{ws.gitStatus.branch}</span>
          <span className="wr-reg-mono">{shortSha(ws.gitStatus.headSha)}</span>
          <span className={clsx('wr-reg-dirty', ws.gitStatus.dirty && 'is-dirty')}>
            {ws.gitStatus.dirty ? 'dirty' : 'clean'}
          </span>
          <span className="wr-reg-dim">{formatInt(ws.files.length)} file(s) changed</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workspaces tab (§V5-3 listWorkspaces() view)
// ---------------------------------------------------------------------------

function WorkspacesList({
  views,
  nav,
}: {
  views: SimViews;
  nav: RegistryNav;
}): React.JSX.Element {
  const workspaces = views.listWorkspaces();
  return (
    <ul className="wr-reg-table" aria-label="All workspaces">
      {workspaces.map((ws) => (
        <li
          key={ws.workspaceId}
          data-testid={`registry-row-${ws.workspaceId}`}
          className="wr-reg-row wr-reg-row--ws"
          role="button"
          tabIndex={0}
          onClick={() => nav.openDetail('workspaces', ws.workspaceId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') nav.openDetail('workspaces', ws.workspaceId);
          }}
        >
          <span className="wr-reg-ws-head">
            <span className="wr-reg-name">{ws.workspaceId}</span>
            <span className="wr-reg-mono">{ws.repository}</span>
            <span className="wr-reg-phase">{ws.phase}</span>
            <span className={clsx('wr-reg-dirty', ws.dirty && 'is-dirty')}>
              {ws.dirty ? 'dirty' : 'clean'}
            </span>
            {ws.gitStatus !== null && ws.gitStatus.branch !== '' && (
              <>
                <span className="wr-reg-dim">branch</span>
                <span className="wr-reg-mono">{ws.gitStatus.branch}</span>
                <span className="wr-reg-mono">{shortSha(ws.gitStatus.headSha)}</span>
              </>
            )}
            <span className="wr-reg-dim">{formatInt(ws.activeSessionIds.length)} active session(s)</span>
          </span>
          <span className="wr-reg-ws-cards">
            {ws.cards.map((c) => (
              <span key={c.taskId} className="wr-reg-ws-cardline">
                <span className="wr-reg-name">{c.title}</span>
                {c.branch !== '' && (
                  <>
                    <span className="wr-reg-mono">{c.branch}</span>
                    <span className="wr-reg-mono">{shortSha(c.headSha)}</span>
                  </>
                )}
                <span className={clsx('wr-reg-dirty', c.dirty && 'is-dirty')}>
                  {c.dirty ? 'dirty' : 'clean'}
                </span>
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function WorkspaceDetail({
  workspaceId,
  cards,
  views,
  nav,
}: {
  workspaceId: string;
  cards: readonly SimCardView[];
  views: SimViews;
  nav: RegistryNav;
}): React.JSX.Element {
  const ws: SimWorkspaceSummaryView | undefined = views
    .listWorkspaces()
    .find((w) => w.workspaceId === workspaceId);
  if (ws === undefined) {
    return <div className="wr-tab-empty">no such workspace — “{workspaceId}” is unknown</div>;
  }
  const activeSessions = ws.activeSessionIds
    .map((id) => views.getSession(id)?.record)
    .filter((r): r is SimSessionView => r !== undefined);
  return (
    <div className="wr-reg-detail" data-testid="registry-workspace-detail">
      <div className="wr-reg-detail-head">
        <span className="wr-reg-detail-title">{ws.workspaceId}</span>
        <span className="wr-reg-mono">{ws.repository}</span>
        <span className="wr-reg-phase">{ws.phase}</span>
        <span className={clsx('wr-reg-dirty', ws.dirty && 'is-dirty')}>
          {ws.dirty ? 'dirty' : 'clean'}
        </span>
      </div>

      <div className="wr-reg-section">LINKED CARDS</div>
      {ws.cards.length === 0 && <div className="wr-tab-empty">no cards bound to this workspace</div>}
      <ul className="wr-reg-sublist" aria-label="Cards in this workspace">
        {ws.cards.map((c) => (
          <li
            key={c.taskId}
            className="wr-reg-subrow"
            role="button"
            tabIndex={0}
            onClick={() => nav.openDetail('tasks', c.taskId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') nav.openDetail('tasks', c.taskId);
            }}
          >
            <span className="wr-reg-name">{c.title}</span>
            {c.branch !== '' && (
              <>
                <span className="wr-reg-mono">{c.branch}</span>
                <span className="wr-reg-mono">{shortSha(c.headSha)}</span>
              </>
            )}
            <span className={clsx('wr-reg-dirty', c.dirty && 'is-dirty')}>
              {c.dirty ? 'dirty' : 'clean'}
            </span>
          </li>
        ))}
      </ul>

      <div className="wr-reg-section">ACTIVE SESSIONS</div>
      {activeSessions.length === 0 && <div className="wr-tab-empty">no agent attends this workspace</div>}
      <ul className="wr-reg-sublist" aria-label="Active sessions in this workspace">
        {activeSessions.map((session) => (
          <li
            key={session.sessionId}
            className="wr-reg-subrow wr-reg-subrow--active"
            role="button"
            tabIndex={0}
            onClick={() => nav.openDetail('agents', session.sessionId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') nav.openDetail('agents', session.sessionId);
            }}
          >
            <span className="wr-reg-name">{session.title}</span>
            <span className={clsx('wr-sess-status', `wr-sess-status--${session.status}`)}>
              {session.status}
            </span>
            <span className="wr-reg-dim">{cardTitle(cards, session.taskId)}</span>
          </li>
        ))}
      </ul>

      <div className="wr-reg-section">CHANGED FILES</div>
      <ul className="wr-reg-sublist" aria-label="Changed files across this workspace's cards">
        {ws.cardIds.flatMap((taskId) => {
          const view = views.getWorkspaceView(taskId);
          if (view === null || !view.gitStatus.dirty) return [];
          return view.files.map((file) => (
            <li key={`${taskId}:${file.path}`} className="wr-reg-subrow wr-reg-subrow--file">
              <span className="wr-reg-filestatus">{file.status}</span>
              <span className="wr-reg-mono">{file.path}</span>
              <span className="wr-reg-dim">
                +{formatInt(file.additions)} −{formatInt(file.deletions)} · {cardTitle(cards, taskId)}
              </span>
            </li>
          ));
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlay shell
// ---------------------------------------------------------------------------

export function RegistryOverlay({ store, views }: RegistryOverlayProps): React.JSX.Element | null {
  const open = useStore(store, (s) => s.meta.registryOpen);
  const deepLinkRef = useStore(store, (s) => s.meta.registryStackRef);
  // Sim views refresh per committed tick (live lists + growing transcripts).
  useStore(store, (s) => s.meta.tickIndex);
  const [navState, setNavState] = useState<RegistryNavState>(registryHome());

  // Each open lands on the stacks list, or directly on a stack's detail when
  // the §V5-4 deep-link routed here (sel-stack-link / Inspector stack chip).
  useEffect(() => {
    if (open) {
      setNavState(deepLinkRef !== null ? registryStackDeepLink(deepLinkRef) : registryHome());
    }
  }, [open, deepLinkRef]);

  if (!open) return null;

  const nav: RegistryNav = {
    openDetail: (tab, id) => setNavState((s) => openRegistryDetail(s, tab, id)),
    openRun: (runId) => store.getState().openRunsAt(runId),
  };
  const back = (): void => setNavState((s) => registryBack(s));
  const cards = views.listCardViews();
  const { tab, detailId } = navState.current;

  let body: React.JSX.Element;
  if (detailId === null) {
    body =
      tab === 'stacks' ? (
        <StacksList views={views} nav={nav} />
      ) : tab === 'agents' ? (
        <AgentsList views={views} cards={cards} nav={nav} />
      ) : tab === 'tasks' ? (
        <TasksList cards={cards} views={views} nav={nav} />
      ) : (
        <WorkspacesList views={views} nav={nav} />
      );
  } else {
    body =
      tab === 'stacks' ? (
        <StackDetail stackRef={detailId} store={store} views={views} nav={nav} />
      ) : tab === 'agents' ? (
        <AgentDetail sessionId={detailId} cards={cards} views={views} nav={nav} onBack={back} />
      ) : tab === 'tasks' ? (
        <TaskDetail taskId={detailId} cards={cards} views={views} nav={nav} />
      ) : (
        <WorkspaceDetail workspaceId={detailId} cards={cards} views={views} nav={nav} />
      );
  }

  return (
    <div className="wr-overlay-backdrop" data-testid="registry-overlay">
      <div className="wr-memory wr-runs wr-registry" role="dialog" aria-label="The Registry">
        <header className="wr-memory-head">
          <span className="wr-panel-title">THE REGISTRY — ROSTER OF THE COGITATOR</span>
          <div className="wr-foundry-tabs wr-runs-tabs" role="tablist" aria-label="Registry tabs">
            {REGISTRY_KINDS.map((kind) => (
              <div
                key={kind}
                role="tab"
                tabIndex={0}
                data-testid={`registry-tab-${kind}`}
                aria-selected={tab === kind}
                className={clsx('wr-foundry-tab', tab === kind && 'is-active')}
                onClick={() => setNavState((s) => selectRegistryTab(s, kind))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setNavState((s) => selectRegistryTab(s, kind));
                  }
                }}
              >
                {TAB_LABELS[kind]}
              </div>
            ))}
          </div>
          {canRegistryBack(navState) && (
            <button
              type="button"
              className="wr-runs-back"
              data-testid="registry-back"
              title="back one level (breadcrumb)"
              onClick={back}
            >
              ← BACK
            </button>
          )}
          <button
            type="button"
            className="wr-inspector-close"
            onClick={() => store.getState().closeRegistry()}
          >
            CLOSE
          </button>
        </header>
        <div className="wr-runs-body wr-reg-body">{body}</div>
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
            inscribed by the cogitator · roster of stacks, agents, tasks and workspaces
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


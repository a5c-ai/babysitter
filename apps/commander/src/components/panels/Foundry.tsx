/**
 * The Foundry (SPEC-V2 §V2-6 as amended by SPEC-V3 §V3-7 and SPEC-V4 §V4-5):
 * a two-tab parchment dialog —
 *   Commission Task (unchanged V3 surface): kind/title/parent → sim verb
 *     `createTask`; the new card lands in the backlog (`adr-cXX` id).
 *   Stacks (`data-testid="foundry-stacks"`, §V4-5 "create agents from
 *     agents"): roster of seeded + custom agent stacks (name, adapter chip
 *     with faction tint, model, personality excerpt, phase badge, CUSTOM
 *     tag) with per-row Forge From (clone-as-template, "<src> Mk II") and
 *     Edit (custom stacks update in place); the editor form below saves via
 *     sim verb `upsertStack` (`stack_forged` event, deterministic stk-cNN
 *     ids). New stacks appear in the card editor's stack select.
 * Opened via N or topbar-create; Esc closes (top of the cascade).
 */

import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import { TASK_KINDS, TASK_TITLES, ADAPTERS, type TaskKind } from '../../backend/mock/scenario';
import type { SimRosterAgentView, SimStackView } from '../../backend/mock/simulation';
import type { CommanderStore, Orders } from '../../game/store';
import type { SimViews } from '../../game/views';
import {
  APPROVAL_MODES,
  blankStackDraft,
  draftToStackInput,
  editStackDraft,
  forgeFromStack,
  personalityExcerpt,
  withAdapter,
  type StackDraft,
} from '../../game/stackForge';

export interface FoundryProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
}

type FoundryTab = 'commission' | 'stacks' | 'agents';

/** v4-r1: small anvil glyph for the Forge From chip (path-only — census). */
const ANVIL_GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">' +
  '<path d="M3 6.5 H17 C16.4 9.2 14.2 10.6 11.6 10.9 L11.6 13.2 H13.6 C14.3 13.2 14.8 13.7 14.8 14.4 V15.4 H5.2 V14.4 C5.2 13.7 5.7 13.2 6.4 13.2 H8.4 L8.4 10.9 C6.6 10.7 5.4 9.9 4.8 8.6 L3 8.2 Z" fill="currentColor"/>' +
  '</svg>';

// ---------------------------------------------------------------------------
// Commission Task tab (V3 surface, unchanged)
// ---------------------------------------------------------------------------

function CommissionTab({ store, orders }: { store: CommanderStore; orders: Orders }): React.JSX.Element {
  const taskIds = useStore(store, (s) => s.board.cardIds);
  const cards = useStore(store, (s) => s.board.cards);
  const [kind, setKind] = useState<TaskKind>('implement');
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState('');

  const parentOptions = taskIds.filter((id) => cards[id]?.view.parentId === null);
  const defaultTitle = TASK_TITLES[kind];

  const submit = (): void => {
    const created = orders.createTask({
      taskKind: kind,
      ...(title.trim() !== '' ? { title: title.trim() } : {}),
      ...(parentId !== '' ? { parentId } : {}),
    });
    if (created !== null) {
      setTitle('');
      setParentId('');
      store.getState().closeFoundry();
    }
  };

  return (
    <>
      <label className="wr-foundry-field">
        <span className="wr-foundry-label">task kind</span>
        <select
          className="wr-foundry-input"
          value={kind}
          onChange={(e) => setKind(e.target.value as TaskKind)}
        >
          {TASK_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label className="wr-foundry-field">
        <span className="wr-foundry-label">title</span>
        <input
          className="wr-foundry-input"
          type="text"
          value={title}
          placeholder={defaultTitle}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') store.getState().closeFoundry();
          }}
        />
      </label>
      <label className="wr-foundry-field">
        <span className="wr-foundry-label">parent task (optional)</span>
        <select
          className="wr-foundry-input"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">— none —</option>
          {parentOptions.map((id) => (
            <option key={id} value={id}>
              {cards[id]?.view.title ?? id}
            </option>
          ))}
        </select>
      </label>
      <div className="wr-modal-hint">lands in BACKLOG · deterministic adr-cXX id · Esc to close</div>
      <div className="wr-modal-actions">
        <button type="button" className="wr-alert-btn" onClick={() => store.getState().closeFoundry()}>
          Cancel
        </button>
        <button
          type="button"
          data-testid="foundry-commission"
          className="wr-alert-btn wr-alert-btn--approve"
          onClick={submit}
        >
          Commission
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stacks tab (§V4-5)
// ---------------------------------------------------------------------------

function StackRow({
  stack,
  onForgeFrom,
  onEdit,
}: {
  stack: SimStackView;
  onForgeFrom: () => void;
  onEdit: () => void;
}): React.JSX.Element {
  const spec = stack.stack.spec;
  return (
    <li className="wr-stack-row">
      <div className="wr-stack-row-main">
        <span className="wr-stack-name">{stack.name}</span>
        <span className={`wr-stack-adapter wr-faction-text--${spec.adapter}`}>{spec.adapter}</span>
        <span className="wr-stack-model">{spec.model}</span>
        <span className="wr-stack-phase">{stack.stack.status.phase}</span>
        {stack.custom && <span className="wr-stack-custom">CUSTOM</span>}
        <span className="wr-stack-id">{stack.stackRef}</span>
      </div>
      <div className="wr-stack-row-excerpt">{personalityExcerpt(spec.prompt.system)}</div>
      <div className="wr-stack-row-actions">
        <button type="button" className="wr-alert-btn wr-stack-btn wr-stack-btn--forge" onClick={onForgeFrom}>
          <span className="wr-forge-glyph" aria-hidden dangerouslySetInnerHTML={{ __html: ANVIL_GLYPH }} />
          Forge From
        </button>
        {stack.custom && (
          <button type="button" className="wr-alert-btn wr-stack-btn" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
    </li>
  );
}

function StacksTab({ orders, views }: { orders: Orders; views: SimViews }): React.JSX.Element {
  const [draft, setDraft] = useState<StackDraft>(blankStackDraft);
  // Roster reads straight from the sim; bump after a save so it re-renders.
  const [, setForgeSeq] = useState(0);
  const stacks = views.listStacks();

  const approvalModes = APPROVAL_MODES.includes(draft.approvalMode as (typeof APPROVAL_MODES)[number])
    ? APPROVAL_MODES
    : [draft.approvalMode, ...APPROVAL_MODES];

  const save = (): void => {
    const input = draftToStackInput(draft);
    if (input === null) return;
    const stackRef = orders.upsertStack(input);
    if (stackRef !== null) {
      // Keep editing the saved stack (further saves update it in place).
      setDraft({ ...draft, stackRef });
      setForgeSeq((n) => n + 1);
    }
  };

  return (
    <div className="wr-foundry-stacks-body">
      <ul className="wr-stack-roster" aria-label="Agent stack roster">
        {stacks.map((s) => (
          <StackRow
            key={s.stackRef}
            stack={s}
            onForgeFrom={() => setDraft(forgeFromStack(s))}
            onEdit={() => setDraft(editStackDraft(s))}
          />
        ))}
      </ul>
      <div className="wr-stack-editor" aria-label="Stack editor">
        <div className="wr-stack-editor-title">
          {draft.stackRef !== null ? `RE-FORGE ${draft.stackRef.toUpperCase()}` : 'FORGE A NEW STACK'}
        </div>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">name</span>
          <input
            className="wr-foundry-input"
            type="text"
            value={draft.name}
            placeholder="name the stack"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <div className="wr-stack-editor-grid">
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">adapter</span>
            <select
              className="wr-foundry-input"
              value={draft.adapter}
              onChange={(e) => setDraft(withAdapter(draft, e.target.value))}
            >
              {ADAPTERS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">model</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">approval mode</span>
            <select
              className="wr-foundry-input"
              value={draft.approvalMode}
              onChange={(e) => setDraft({ ...draft, approvalMode: e.target.value })}
            >
              {approvalModes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">system personality</span>
          <textarea
            className="wr-foundry-input wr-stack-prompt"
            rows={3}
            value={draft.system}
            placeholder="inscribe the personality (prompt.system)"
            onChange={(e) => setDraft({ ...draft, system: e.target.value })}
          />
        </label>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">developer prompt (optional)</span>
          <textarea
            className="wr-foundry-input wr-stack-prompt"
            rows={2}
            value={draft.developer}
            onChange={(e) => setDraft({ ...draft, developer: e.target.value })}
          />
        </label>
        <div className="wr-modal-hint">deterministic stk-cNN id · honored on the next spawn</div>
        <div className="wr-modal-actions">
          <button
            type="button"
            className="wr-alert-btn"
            onClick={() => setDraft(blankStackDraft())}
          >
            Clear
          </button>
          <button
            type="button"
            className="wr-alert-btn wr-alert-btn--approve"
            disabled={draft.name.trim() === ''}
            onClick={save}
          >
            Save Stack
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agents tab (named roster agents — assignable workers/reviewers)
// ---------------------------------------------------------------------------

function RosterAgentRow({
  agent,
  onRelease,
}: {
  agent: SimRosterAgentView;
  onRelease: () => void;
}): React.JSX.Element {
  return (
    <li className="wr-stack-row wr-roster-row">
      <div className="wr-stack-row-main">
        <span className="wr-stack-name">{agent.name}</span>
        <span className={`wr-stack-adapter wr-faction-text--${agent.adapter}`}>{agent.adapter}</span>
        <span className="wr-stack-model">{agent.model}</span>
        <span className={clsx('wr-roster-role', `wr-roster-role--${agent.role}`)}>{agent.role}</span>
        {agent.status === 'assigned' && (
          <span className="wr-roster-assigned" title={agent.assignedTaskId ?? ''}>
            assigned
          </span>
        )}
        <span className="wr-stack-id">{agent.stackRef}</span>
      </div>
      <div className="wr-stack-row-actions">
        <button
          type="button"
          className="wr-alert-btn wr-stack-btn"
          disabled={agent.status === 'assigned'}
          title={agent.status === 'assigned' ? 'Unassign before releasing' : 'Release this agent'}
          onClick={onRelease}
        >
          Release
        </button>
      </div>
    </li>
  );
}

function AgentsTab({ orders, views }: { orders: Orders; views: SimViews }): React.JSX.Element {
  const stacks = views.listStacks();
  const [, setRecruitSeq] = useState(0);
  const agents = views.listRosterAgents();
  const [stackRef, setStackRef] = useState(stacks[0]?.stackRef ?? '');
  const [role, setRole] = useState<'worker' | 'reviewer'>('worker');
  const [name, setName] = useState('');

  const recruit = (): void => {
    if (!stackRef) return;
    const agentId = orders.createRosterAgent({
      stackRef,
      role,
      ...(name.trim() !== '' ? { name: name.trim() } : {}),
    });
    if (agentId !== null) {
      setName('');
      setRecruitSeq((n) => n + 1);
    }
  };

  return (
    <div className="wr-foundry-stacks-body">
      <ul className="wr-stack-roster" aria-label="Roster agents">
        {agents.length === 0 && (
          <li className="wr-roster-empty">No agents recruited — forge one below</li>
        )}
        {agents.map((a) => (
          <RosterAgentRow
            key={a.agentId}
            agent={a}
            onRelease={() => {
              orders.deleteRosterAgent(a.agentId);
              setRecruitSeq((n) => n + 1);
            }}
          />
        ))}
      </ul>
      <div className="wr-stack-editor" aria-label="Recruit agent">
        <div className="wr-stack-editor-title">RECRUIT AN AGENT</div>
        <div className="wr-stack-editor-grid">
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">stack</span>
            <select
              className="wr-foundry-input"
              value={stackRef}
              onChange={(e) => setStackRef(e.target.value)}
            >
              {stacks.map((s) => (
                <option key={s.stackRef} value={s.stackRef}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">role</span>
            <select
              className="wr-foundry-input"
              value={role}
              onChange={(e) => setRole(e.target.value as 'worker' | 'reviewer')}
            >
              <option value="worker">worker</option>
              <option value="reviewer">reviewer</option>
            </select>
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">name (optional)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={name}
              placeholder="auto-generate"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') recruit();
              }}
            />
          </label>
        </div>
        <div className="wr-modal-hint">binds to the selected stack · assignable via task backlog</div>
        <div className="wr-modal-actions">
          <button
            type="button"
            className="wr-alert-btn wr-alert-btn--approve"
            disabled={!stackRef}
            onClick={recruit}
          >
            Recruit
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export function Foundry({ store, orders, views }: FoundryProps): React.JSX.Element | null {
  const open = useStore(store, (s) => s.meta.foundryOpen);
  // §V5-3 landing intent: openFoundry() lands on Commission Task (the
  // historical default); the registry's "open in Foundry" lands on Stacks.
  const landingTab = useStore(store, (s) => s.meta.foundryTab);
  const [tab, setTab] = useState<FoundryTab>('commission');
  useEffect(() => {
    if (open) setTab(landingTab);
  }, [open, landingTab]);
  if (!open) return null;

  return (
    <div className="wr-modal-backdrop" data-testid="foundry">
      <div
        className={clsx('wr-modal wr-foundry', (tab === 'stacks' || tab === 'agents') && 'wr-foundry--wide')}
        role="dialog"
        aria-label="The Foundry"
      >
        <div className="wr-panel-title">THE FOUNDRY</div>
        {/* Tabs are role="tab" plates, NOT <button>s: the frozen v3 commission
            helper clicks the first button matching /commission/i and must hit
            the submit control, never the tab strip. */}
        <div className="wr-foundry-tabs" role="tablist" aria-label="Foundry tabs">
          <div
            role="tab"
            tabIndex={0}
            aria-selected={tab === 'commission'}
            className={clsx('wr-foundry-tab', tab === 'commission' && 'is-active')}
            onClick={() => setTab('commission')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setTab('commission');
            }}
          >
            Commission Task
          </div>
          <div
            role="tab"
            tabIndex={0}
            data-testid="foundry-stacks"
            aria-selected={tab === 'stacks'}
            className={clsx('wr-foundry-tab', tab === 'stacks' && 'is-active')}
            onClick={() => setTab('stacks')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setTab('stacks');
            }}
          >
            Stacks
          </div>
          <div
            role="tab"
            tabIndex={0}
            data-testid="foundry-agents"
            aria-selected={tab === 'agents'}
            className={clsx('wr-foundry-tab', tab === 'agents' && 'is-active')}
            onClick={() => setTab('agents')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setTab('agents');
            }}
          >
            Agents
          </div>
        </div>
        {tab === 'commission' ? (
          <CommissionTab store={store} orders={orders} />
        ) : tab === 'stacks' ? (
          <StacksTab orders={orders} views={views} />
        ) : (
          <AgentsTab orders={orders} views={views} />
        )}
      </div>
    </div>
  );
}

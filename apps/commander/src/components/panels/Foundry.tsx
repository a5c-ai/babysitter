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

import { GraphLayerPicker } from './GraphLayerPicker';

import { TASK_KINDS, TASK_TITLES, ADAPTERS, type TaskKind } from '../../backend/mock/scenario';
import type {
  SimAgentDefinitionView,
  SimAgentPersonaView,
  SimStackView,
} from '../../backend/mock/simulation';
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

/**
 * Append a graph-picked ref to a comma-separated field, de-duplicating. Lets the
 * GraphLayerPicker contribute concrete graph objects (tools, skills, mcp servers)
 * to a stack's CSV ref lists — the same per-layer object selection kradle's
 * stack-builder offers.
 */
function appendCsv(csv: string, value: string): string {
  const parts = (csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!value || parts.includes(value)) return csv;
  return [...parts, value].join(', ');
}

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
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">display name</span>
          <input
            className="wr-foundry-input"
            type="text"
            value={draft.displayName}
            placeholder="human label (spec.displayName)"
            onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
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
            <GraphLayerPicker
              label="Platform"
              kinds={['AgentProduct', 'AgentPlatformImpl', 'AgentRuntimeImpl', 'Platform']}
              selectedId={draft.adapter}
              onSelect={(h) => setDraft(withAdapter(draft, h.displayName || h.id))}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">model</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            />
            <GraphLayerPicker
              label="Model"
              kinds={['ModelFamily', 'ModelVersion', 'SessionModel']}
              selectedId={draft.model}
              onSelect={(h) => setDraft({ ...draft, model: h.displayName || h.id })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">provider</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.provider}
              placeholder="anthropic"
              onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
            />
            <GraphLayerPicker
              label="Provider"
              kinds={['Provider', 'ModelProviderProduct', 'ModelProviderVersion']}
              selectedId={draft.provider}
              onSelect={(h) => setDraft({ ...draft, provider: h.displayName || h.id })}
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
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">service account</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.serviceAccountRef}
              placeholder="runtimeIdentity.serviceAccountRef"
              onChange={(e) => setDraft({ ...draft, serviceAccountRef: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">tool profile</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.toolProfileRef}
              placeholder="toolProfileRef"
              onChange={(e) => setDraft({ ...draft, toolProfileRef: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">runner pool</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.runnerPool}
              placeholder="runnerPool"
              onChange={(e) => setDraft({ ...draft, runnerPool: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">workspace policy</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.workspacePolicyRef}
              placeholder="workspacePolicyRef"
              onChange={(e) => setDraft({ ...draft, workspacePolicyRef: e.target.value })}
            />
          </label>
        </div>
        <div className="wr-stack-editor-grid">
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">mcp servers (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.mcpServerRefs}
              placeholder="kradle-mcp, atlas-mcp"
              onChange={(e) => setDraft({ ...draft, mcpServerRefs: e.target.value })}
            />
            <GraphLayerPicker
              label="Tools / MCP"
              kinds={['Tool', 'ToolServer', 'MCPPrompt', 'MCPResource']}
              onSelect={(h) => setDraft({ ...draft, mcpServerRefs: appendCsv(draft.mcpServerRefs, h.displayName || h.id) })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">cli tools (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.cliToolRefs}
              placeholder="gh, kubectl"
              onChange={(e) => setDraft({ ...draft, cliToolRefs: e.target.value })}
            />
            <GraphLayerPicker
              label="CLI Tools"
              kinds={['Tool', 'ToolDescriptor']}
              onSelect={(h) => setDraft({ ...draft, cliToolRefs: appendCsv(draft.cliToolRefs, h.displayName || h.id) })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">skills (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.skillRefs}
              placeholder="skill-x, skill-y"
              onChange={(e) => setDraft({ ...draft, skillRefs: e.target.value })}
            />
            <GraphLayerPicker
              label="Skills"
              kinds={['Skill', 'LibrarySkill', 'SkillArea', 'Capability']}
              onSelect={(h) => setDraft({ ...draft, skillRefs: appendCsv(draft.skillRefs, h.displayName || h.id) })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">subagents (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.subagentRefs}
              placeholder="subagent-1, subagent-2"
              onChange={(e) => setDraft({ ...draft, subagentRefs: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">context labels (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.contextLabelRefs}
              placeholder="label-a, label-b"
              onChange={(e) => setDraft({ ...draft, contextLabelRefs: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">memory repositories (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.memoryRepositoryRefs}
              placeholder="repo-brain"
              onChange={(e) => setDraft({ ...draft, memoryRepositoryRefs: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">agent role (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.agentRole}
              placeholder="reviewer, backend-team"
              onChange={(e) => setDraft({ ...draft, agentRole: e.target.value })}
            />
            <GraphLayerPicker
              label="Agent Role"
              kinds={['Role', 'Responsibility', 'AgentTeam', 'OrgUnit']}
              onSelect={(h) => setDraft({ ...draft, agentRole: appendCsv(draft.agentRole, h.displayName || h.id) })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">role bindings (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.roleBindings}
              placeholder="permissionRefs.roleBindings"
              onChange={(e) => setDraft({ ...draft, roleBindings: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">secret grants (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.secretGrants}
              placeholder="permissionRefs.secretGrants"
              onChange={(e) => setDraft({ ...draft, secretGrants: e.target.value })}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">config grants (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={draft.configGrants}
              placeholder="permissionRefs.configGrants"
              onChange={(e) => setDraft({ ...draft, configGrants: e.target.value })}
            />
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
// Agents tab — the REAL kradle agent-identity model (SPEC-KRADLE-MODEL):
//   AgentDefinition  = the deployment binding (persona ↔ stack + roleContext)
//   AgentPersona     = the reusable identity (displayName + emoji + role/tagline)
// Replaces the invented "roster agents" entirely. The list is read-only; the
// editor below applies a new AgentDefinition (persona + stack + roleContext)
// via orders.upsertDefinition.
// ---------------------------------------------------------------------------

/** A persona's emoji/avatar glyph (emoji wins; falls back to the initial). */
function personaGlyph(persona: SimAgentPersonaView | null, fallback: string): string {
  if (persona?.emoji != null && persona.emoji !== '') return persona.emoji;
  return (fallback.trim()[0] ?? '?').toUpperCase();
}

function DefinitionRow({ def }: { def: SimAgentDefinitionView }): React.JSX.Element {
  // The role shown is the deployment-specific roleContext (preferred), falling
  // back to the persona's own role title — never invented.
  const role = def.roleContext ?? def.persona?.roleTitle ?? null;
  const displayName = def.persona?.displayName ?? def.personaRef ?? def.name;
  return (
    <li className="wr-stack-row wr-definition-row">
      <div className="wr-stack-row-main">
        <span className="wr-persona-glyph" aria-hidden>
          {personaGlyph(def.persona, displayName)}
        </span>
        <span className="wr-stack-name">{displayName}</span>
        {role != null && role !== '' && <span className="wr-definition-role">{role}</span>}
        {def.stackRef !== '' && (
          <span className="wr-stack-adapter" title="bound stack">
            {def.stackRef}
          </span>
        )}
        <span className="wr-stack-id">{def.name}</span>
      </div>
      {def.persona === null && def.personaRef !== '' && (
        <div className="wr-stack-row-excerpt">persona “{def.personaRef}” not found</div>
      )}
    </li>
  );
}

function PersonaCard({ persona }: { persona: SimAgentPersonaView }): React.JSX.Element {
  return (
    <li className="wr-persona-card">
      <span className="wr-persona-glyph wr-persona-glyph--lg" aria-hidden>
        {personaGlyph(persona, persona.displayName)}
      </span>
      <div className="wr-persona-card-body">
        <span className="wr-persona-name">{persona.displayName}</span>
        {persona.roleTitle != null && persona.roleTitle !== '' && (
          <span className="wr-persona-role">{persona.roleTitle}</span>
        )}
        {persona.tagline != null && persona.tagline !== '' && (
          <span className="wr-persona-tagline">{persona.tagline}</span>
        )}
      </div>
    </li>
  );
}

function AgentsTab({ orders, views }: { orders: Orders; views: SimViews }): React.JSX.Element {
  const definitions = views.listDefinitions();
  const personas = views.listPersonas();
  const stacks = views.listStacks();
  const [, setApplySeq] = useState(0);
  const [name, setName] = useState('');
  const [personaRef, setPersonaRef] = useState(personas[0]?.name ?? '');
  const [stackRef, setStackRef] = useState(stacks[0]?.stackRef ?? '');
  const [roleContext, setRoleContext] = useState('');

  // NEW PERSONA form — the full identity model (persona + soul + appearance +
  // voice), mirroring kradle's agent-create wizard.
  const [pName, setPName] = useState('');
  const [pTagline, setPTagline] = useState('');
  const [pRoleTitle, setPRoleTitle] = useState('');
  const [pRoleDomain, setPRoleDomain] = useState('');
  const [pCommStyle, setPCommStyle] = useState('direct');
  const [pTone, setPTone] = useState('professional');
  const [pEmoji, setPEmoji] = useState('');
  const [pSoul, setPSoul] = useState('');
  const pTtsProvider = 'openai';
  const [pTtsVoice, setPTtsVoice] = useState('nova');
  const [pSkillRefs, setPSkillRefs] = useState('');

  const canApply = name.trim() !== '' && personaRef !== '' && stackRef !== '';

  const apply = (): void => {
    if (!canApply) return;
    const applied = orders.upsertDefinition({
      name: name.trim(),
      personaRef,
      stackRef,
      ...(roleContext.trim() !== '' ? { roleContext: roleContext.trim() } : {}),
    });
    if (applied !== null) {
      setName('');
      setRoleContext('');
      setApplySeq((n) => n + 1);
    }
  };

  const canCreatePersona = pName.trim() !== '';

  const createPersona = (): void => {
    if (!canCreatePersona) return;
    const slug =
      pName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'new-agent';
    const skillRefs = pSkillRefs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const applied = orders.createAgentIdentity({
      name: slug,
      displayName: pName.trim(),
      ...(pTagline.trim() !== '' ? { tagline: pTagline.trim() } : {}),
      ...(pRoleTitle.trim() !== '' ? { roleTitle: pRoleTitle.trim() } : {}),
      ...(pRoleDomain.trim() !== '' ? { roleDomain: pRoleDomain.trim() } : {}),
      communicationStyle: pCommStyle,
      tone: pTone,
      ...(pEmoji.trim() !== '' ? { emoji: pEmoji.trim() } : {}),
      ...(pSoul.trim() !== '' ? { soul: pSoul } : {}),
      ttsProvider: pTtsProvider,
      ttsVoice: pTtsVoice,
      ...(skillRefs.length > 0 ? { skillRefs } : {}),
    });
    if (applied !== null) {
      setPName('');
      setPTagline('');
      setPRoleTitle('');
      setPRoleDomain('');
      setPEmoji('');
      setPSoul('');
      setPSkillRefs('');
      setApplySeq((n) => n + 1);
    }
  };

  return (
    <div className="wr-foundry-stacks-body">
      <ul className="wr-stack-roster" aria-label="Agent definitions">
        {definitions.length === 0 && (
          <li className="wr-roster-empty">No agent definitions</li>
        )}
        {definitions.map((d) => (
          <DefinitionRow key={d.name} def={d} />
        ))}
      </ul>

      <div className="wr-persona-gallery-wrap" aria-label="Agent personas">
        <div className="wr-stack-editor-title">PERSONAS</div>
        <ul className="wr-persona-gallery">
          {personas.length === 0 && <li className="wr-roster-empty">No personas</li>}
          {personas.map((p) => (
            <PersonaCard key={p.name} persona={p} />
          ))}
        </ul>
      </div>

      <div className="wr-stack-editor" aria-label="New persona">
        <div className="wr-stack-editor-title">NEW PERSONA</div>
        <div className="wr-stack-editor-grid">
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">display name</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={pName}
              placeholder="Ada the Reviewer"
              onChange={(e) => setPName(e.target.value)}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">tagline</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={pTagline}
              placeholder="meticulous code auditor"
              onChange={(e) => setPTagline(e.target.value)}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">role title</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={pRoleTitle}
              placeholder="Senior Reviewer"
              onChange={(e) => setPRoleTitle(e.target.value)}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">role domain</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={pRoleDomain}
              placeholder="backend"
              onChange={(e) => setPRoleDomain(e.target.value)}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">communication style</span>
            <select
              className="wr-foundry-input"
              value={pCommStyle}
              onChange={(e) => setPCommStyle(e.target.value)}
            >
              {['direct', 'gentle', 'formal', 'casual'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">tone</span>
            <select
              className="wr-foundry-input"
              value={pTone}
              onChange={(e) => setPTone(e.target.value)}
            >
              {['professional', 'friendly', 'academic', 'playful'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">emoji</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={pEmoji}
              placeholder="🔍"
              onChange={(e) => setPEmoji(e.target.value)}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">tts voice</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={pTtsVoice}
              placeholder="nova"
              onChange={(e) => setPTtsVoice(e.target.value)}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">skills (csv)</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={pSkillRefs}
              placeholder="code-review, security"
              onChange={(e) => setPSkillRefs(e.target.value)}
            />
            <GraphLayerPicker
              label="Skills"
              kinds={['Skill', 'LibrarySkill', 'SkillArea', 'Capability']}
              onSelect={(h) => setPSkillRefs(appendCsv(pSkillRefs, h.displayName || h.id))}
            />
          </label>
        </div>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">soul (behavioral document, markdown)</span>
          <textarea
            className="wr-foundry-input wr-stack-prompt"
            rows={3}
            value={pSoul}
            placeholder="# Identity&#10;Values, boundaries, and communication principles."
            onChange={(e) => setPSoul(e.target.value)}
          />
        </label>
        <div className="wr-modal-hint">
          creates AgentPersona + AgentSoul + AgentAppearance + AgentVoiceProfile · reconciles on the next refresh
        </div>
        <div className="wr-modal-actions">
          <button
            type="button"
            data-testid="foundry-new-persona"
            className="wr-alert-btn wr-alert-btn--approve"
            disabled={!canCreatePersona}
            onClick={createPersona}
          >
            Create Persona
          </button>
        </div>
      </div>

      <div className="wr-stack-editor" aria-label="New definition">
        <div className="wr-stack-editor-title">NEW DEFINITION</div>
        <div className="wr-stack-editor-grid">
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">name</span>
            <input
              className="wr-foundry-input"
              type="text"
              value={name}
              placeholder="reviewer-on-main"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') apply();
              }}
            />
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">persona</span>
            <select
              className="wr-foundry-input"
              value={personaRef}
              onChange={(e) => setPersonaRef(e.target.value)}
              disabled={personas.length === 0}
            >
              {personas.length === 0 && <option value="">— no personas —</option>}
              {personas.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="wr-foundry-field">
            <span className="wr-foundry-label">stack</span>
            <select
              className="wr-foundry-input"
              value={stackRef}
              onChange={(e) => setStackRef(e.target.value)}
              disabled={stacks.length === 0}
            >
              {stacks.length === 0 && <option value="">— no stacks —</option>}
              {stacks.map((s) => (
                <option key={s.stackRef} value={s.stackRef}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">role context (optional)</span>
          <textarea
            className="wr-foundry-input wr-stack-prompt"
            rows={2}
            value={roleContext}
            placeholder="deployment-specific role framing (spec.roleContext)"
            onChange={(e) => setRoleContext(e.target.value)}
          />
        </label>
        <div className="wr-modal-hint">binds a persona to a stack · reconciles on the next refresh</div>
        <div className="wr-modal-actions">
          <button
            type="button"
            data-testid="foundry-new-definition"
            className="wr-alert-btn wr-alert-btn--approve"
            disabled={!canApply}
            onClick={apply}
          >
            Apply Definition
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

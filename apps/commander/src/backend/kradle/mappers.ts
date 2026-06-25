/**
 * Pure kradle-resource → Commander-view mappers (SPEC-KRADLE-MODEL §4, AC2/AC4).
 *
 * Every function here is PURE and deterministic: it consumes a controller
 * snapshot (`KradleControllerSnapshot`) plus an optional on-demand memory
 * result, and produces the `Sim*View` surface (`simulation.ts`) + the board
 * payload. No `Date.now()`, no rng — the caller injects `nowMs`; UI-only fields
 * with no kradle source use the documented stable defaults (never random).
 *
 * The headline of this cut is the true **`AgentDispatchRun → AgentDispatchAttempt
 * → AgentSession`** hierarchy (SPEC §4.1): a card surfaces its attempts and the
 * sessions of its ACTIVE attempt; `SimCardView.attempt` is the count of real
 * `AgentDispatchAttempt` records (not a `status.attempt` integer). The phase→
 * column map (SPEC §4.2) accepts BOTH the lowercase lifecycle union and the
 * capitalized terminals the live BFF emits. The invented roster is REMOVED
 * (no `mapRosterAgents`).
 *
 * The snapshot's CRD items are typed as the wide `KradleResourceItem` structural
 * shape (`controllerClient.ts`); these mappers narrow each `spec`/`status`/`labels`
 * field through the local `read*` helpers (mirroring `realBackend.ts:141`
 * `asServerFrame` — narrow `unknown`, never `any`).
 */

import type { CostRecord } from '../../contracts/adapter-events';
import type { ObservedRunState, PendingEffectsByKind } from '../../contracts/babysitter-run';
import type { GraphQueryResult, GraphRecord, MemoryNodeKind } from '../../contracts/kradle-memory';
import type { KradleResourcePhase } from '../../contracts/kradle-resources';
import type { KradleAgentStack } from '../../contracts/kradle-stack';
import type { AgentWorkspacePhase, WorkspaceGitStatus } from '../../contracts/kradle-workspace';
import type {
  ColumnId,
  SessionStatus,
  SimAgentDefinitionView,
  SimAgentPersonaView,
  SimAgentView,
  SimAttemptView,
  SimCardView,
  SimHookView,
  SimMemoryIOView,
  SimMemoryReadEntry,
  SimMemorySiloView,
  SimMemoryWriteEntry,
  SimProcessTemplateView,
  SimRunObservationView,
  SimRunView,
  SimSessionDetailView,
  SimSessionTranscriptEntry,
  SimSessionView,
  SimStackView,
  SimTaskState,
  SimTaskView,
  SimUnitView,
  SimWorkspaceCardGitView,
  SimWorkspaceSummaryView,
  SimWorkspaceView,
} from '../mock/simulation';
import { COLUMNS, PHASES_BY_KIND } from '../mock/simulation';
import type { AdapterName, TaskKind } from '../mock/scenario';
import { ADAPTERS, MODELS_BY_ADAPTER, TASK_KINDS } from '../mock/scenario';
import type {
  KradleControllerSnapshot,
  KradleResourceItem,
} from './controllerClient';

// ---------------------------------------------------------------------------
// Commander label conventions (§2.1/§2.3 — the sanctioned representation for
// concepts kradle has no first-class CRD field for).
// ---------------------------------------------------------------------------

export const LABEL_ROSTER_NAME = 'commander.a5c.ai/roster-name';
export const LABEL_STACK_REF = 'commander.a5c.ai/stack-ref';
export const LABEL_ROLE = 'commander.a5c.ai/role';
export const LABEL_ORIGIN = 'kradle.a5c.ai/origin';
export const LABEL_MERGED = 'commander.a5c.ai/merged';
export const LABEL_RELEASE_ID = 'commander.a5c.ai/release-id';
export const LABEL_YOLO = 'commander.a5c.ai/yolo';
export const LABEL_PARENT = 'commander.a5c.ai/parent';
export const LABEL_WORKER = 'commander.a5c.ai/worker';
export const LABEL_REVIEWER = 'commander.a5c.ai/reviewer';
export const LABEL_HUMAN = 'commander.a5c.ai/human';
export const LABEL_DEFAULT_FOR = 'commander.a5c.ai/default-for';
export const LABEL_CREATURE = 'commander.a5c.ai/creature';
export const LABEL_COORDINATION = 'commander.a5c.ai/coordination';
export const LABEL_AGENT_ROLE = 'kradle.a5c.ai/agent-role';

/** §6.2 default inquiry deadline window (ms) for synthesized hooks. */
export const DEFAULT_INQUIRY_MS = 15_000;

const EMPTY_COST: CostRecord = {
  totalUsd: 0,
  inputTokens: 0,
  outputTokens: 0,
  thinkingTokens: 0,
  cachedTokens: 0,
};

const EMPTY_TOKENS = {
  inputTokens: 0,
  outputTokens: 0,
  thinkingTokens: 0,
  cachedTokens: 0,
};

// ---------------------------------------------------------------------------
// `unknown` narrowers (mirror realBackend.ts:141 `asServerFrame` — never `any`).
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

/** A CRD item's `spec` as a record (empty when absent). */
function spec(item: KradleResourceItem): Record<string, unknown> {
  return asRecord(item.spec) ?? {};
}

/** A CRD item's `status` as a record (empty when absent). */
function status(item: KradleResourceItem): Record<string, unknown> {
  return asRecord(item.status) ?? {};
}

/** A CRD item's labels (empty when absent). */
function labels(item: KradleResourceItem): Record<string, string> {
  const raw = item.metadata.labels;
  if (!isRecord(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function statusPhase(item: KradleResourceItem): string | undefined {
  return asString(status(item).phase);
}

/** ISO timestamp → epoch ms; `undefined` when unparseable. */
function isoToMs(value: unknown): number | undefined {
  const s = asString(value);
  if (s === undefined) return undefined;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : undefined;
}

function creationMs(item: KradleResourceItem): number | undefined {
  return isoToMs(item.metadata.creationTimestamp);
}

// ---------------------------------------------------------------------------
// Narrowing helpers for the kradle→Commander enum maps.
// ---------------------------------------------------------------------------

const ADAPTER_SET = new Set<string>(ADAPTERS);
const TASK_KIND_SET = new Set<string>(TASK_KINDS);

function narrowAdapter(value: string | undefined, fallback: AdapterName = 'claude-code'): AdapterName {
  if (value !== undefined && ADAPTER_SET.has(value)) return value as AdapterName;
  return fallback;
}

/**
 * §2.3.2 kradle `taskKind` → Commander `TaskKind`. Known kinds pass through; the
 * documented fallback table maps kradle-native kinds, else `'implement'`.
 */
export function narrowTaskKind(value: string | undefined): TaskKind {
  if (value !== undefined && TASK_KIND_SET.has(value)) return value as TaskKind;
  switch (value) {
    case 'ci-repair':
    case 'diagnostic':
      return 'fix';
    default:
      return 'implement';
  }
}

// ---------------------------------------------------------------------------
// Snapshot projection access (§1.2): canonical `model.agents.*`, fallback
// `model.resources[].kind`. Tolerant of a kind appearing in either place (AC2).
// ---------------------------------------------------------------------------

export type AgentsCollectionKey =
  | 'stacks'
  | 'runs'
  | 'rules'
  | 'sessions'
  | 'workspaces'
  | 'approvals'
  | 'adapters'
  | 'providers'
  | 'projects'
  | 'transcripts'
  | 'memoryRepositories'
  | 'memorySnapshots'
  | 'memoryImports'
  // Agent-identity collections (the real "who / how-where" model).
  | 'personas'
  | 'definitions'
  | 'appearances'
  | 'voiceProfiles'
  // The real per-taskKind process phase pipeline (AgentProcessTemplate).
  | 'processTemplates';

function collectionItems(
  snapshot: KradleControllerSnapshot,
  key: AgentsCollectionKey,
): KradleResourceItem[] {
  const fromAgents = snapshot.agents?.[key]?.items;
  if (Array.isArray(fromAgents) && fromAgents.length > 0) return fromAgents;
  return [];
}

function collectionPending(
  snapshot: KradleControllerSnapshot,
  key: AgentsCollectionKey,
): KradleResourceItem[] {
  const fromAgents = snapshot.agents?.[key]?.pending;
  if (Array.isArray(fromAgents)) return fromAgents;
  return [];
}

/** All items of a CRD kind from `model.resources[]` (the §1.2 fallback source). */
function resourceItemsByKind(snapshot: KradleControllerSnapshot, kind: string): KradleResourceItem[] {
  const out: KradleResourceItem[] = [];
  for (const entry of snapshot.resources ?? []) {
    if (entry.kind === kind && Array.isArray(entry.items)) {
      for (const item of entry.items) {
        if (isRecord(item) && isRecord((item as KradleResourceItem).metadata)) {
          out.push(item);
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// §2.1 — AgentStack / AgentDefinition → SimStackView
// ---------------------------------------------------------------------------

function buildStackResource(item: KradleResourceItem): KradleAgentStack {
  const sp = spec(item);
  const adapter = asString(sp.adapter) ?? 'claude-code';
  const baseAgent = asString(sp.baseAgent) ?? adapter;
  const adapterModels = MODELS_BY_ADAPTER[narrowAdapter(adapter)] ?? [];
  const model = asString(sp.model) ?? adapterModels[0] ?? '';

  const promptRaw = asRecord(sp.prompt) ?? asRecord(sp.promptTemplates);
  // Tolerate the flat `systemPrompt`/`developerPrompt` the live builder writes
  // (`stack-builder.jsx:34-35`) alongside the nested `prompt.{system,developer}`.
  const promptSystem = asString(promptRaw?.system) ?? asString(sp.systemPrompt) ?? '';
  const promptDeveloper = asString(promptRaw?.developer) ?? asString(sp.developerPrompt);

  const stringArray = (value: unknown): string[] | undefined => {
    const arr = asArray(value);
    return arr !== undefined
      ? arr.filter((x): x is string => typeof x === 'string')
      : undefined;
  };

  const runtimeIdentityRaw = asRecord(sp.runtimeIdentity);
  const serviceAccountRef = asString(runtimeIdentityRaw?.serviceAccountRef);

  const externalToolsRaw = asRecord(sp.externalTools);
  const externalMcp = stringArray(externalToolsRaw?.mcpServerRefs) ?? stringArray(sp.mcpServerRefs);
  const externalCli = stringArray(externalToolsRaw?.cliToolRefs);
  const externalTools =
    externalMcp !== undefined || externalCli !== undefined
      ? {
          ...(externalMcp !== undefined ? { mcpServerRefs: externalMcp } : {}),
          ...(externalCli !== undefined ? { cliToolRefs: externalCli } : {}),
        }
      : undefined;

  const permissionRaw = asRecord(sp.permissionRefs);
  const roleBindings = stringArray(permissionRaw?.roleBindings);
  const secretGrants = stringArray(permissionRaw?.secretGrants);
  const configGrants = stringArray(permissionRaw?.configGrants);
  const permissionRefs =
    roleBindings !== undefined || secretGrants !== undefined || configGrants !== undefined
      ? {
          ...(roleBindings !== undefined ? { roleBindings } : {}),
          ...(secretGrants !== undefined ? { secretGrants } : {}),
          ...(configGrants !== undefined ? { configGrants } : {}),
        }
      : undefined;

  const stack: KradleAgentStack = {
    apiVersion: asString(item.apiVersion) ?? 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentStack',
    metadata: {
      name: item.metadata.name,
      ...(asString(item.metadata.namespace) !== undefined
        ? { namespace: item.metadata.namespace }
        : {}),
      labels: labels(item),
    },
    spec: {
      ...(asString(sp.organizationRef) !== undefined
        ? { organizationRef: asString(sp.organizationRef) }
        : {}),
      baseAgent,
      adapter,
      ...(asString(sp.provider) !== undefined ? { provider: asString(sp.provider) } : {}),
      model,
      prompt: promptDeveloper !== undefined
        ? { system: promptSystem, developer: promptDeveloper }
        : { system: promptSystem },
      approvalMode: asString(sp.approvalMode) ?? 'prompt',
      ...(serviceAccountRef !== undefined
        ? { runtimeIdentity: { serviceAccountRef } }
        : {}),
      ...(asString(sp.toolProfileRef) !== undefined
        ? { toolProfileRef: asString(sp.toolProfileRef) }
        : {}),
      ...(externalTools !== undefined ? { externalTools } : {}),
      ...(stringArray(sp.skillRefs) !== undefined
        ? { skillRefs: stringArray(sp.skillRefs) }
        : {}),
      ...(stringArray(sp.subagentRefs) !== undefined
        ? { subagentRefs: stringArray(sp.subagentRefs) }
        : {}),
      ...(stringArray(sp.contextLabelRefs) !== undefined
        ? { contextLabelRefs: stringArray(sp.contextLabelRefs) }
        : {}),
      ...(asString(sp.workspacePolicyRef) !== undefined
        ? { workspacePolicyRef: asString(sp.workspacePolicyRef) }
        : {}),
      ...(asString(sp.runnerPool) !== undefined ? { runnerPool: asString(sp.runnerPool) } : {}),
      ...(permissionRefs !== undefined ? { permissionRefs } : {}),
      ...(stringArray(sp.memoryRepositoryRefs) !== undefined
        ? { memoryRepositoryRefs: stringArray(sp.memoryRepositoryRefs) }
        : {}),
    },
    status: { phase: statusPhase(item) ?? 'Ready' },
  };
  return stack;
}

function mapStackView(item: KradleResourceItem): SimStackView {
  const sp = spec(item);
  const name = asString(sp.displayName) ?? item.metadata.name;
  const custom = labels(item)[LABEL_ORIGIN] === 'foundry';
  return {
    stackRef: item.metadata.name,
    name,
    custom,
    stack: buildStackResource(item),
  };
}

/**
 * §2.1 stack source set: `agents.stacks.items` (AgentStack) PLUS any
 * `AgentDefinition` summary, deduplicated by `metadata.name` (AgentStack wins),
 * sorted by name (stable).
 */
export function mapStacks(snapshot: KradleControllerSnapshot): SimStackView[] {
  const byName = new Map<string, SimStackView>();
  for (const def of resourceItemsByKind(snapshot, 'AgentDefinition')) {
    byName.set(def.metadata.name, mapStackView(def));
  }
  // AgentStack wins on conflict — apply last.
  for (const stack of collectionItems(snapshot, 'stacks')) {
    byName.set(stack.metadata.name, mapStackView(stack));
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Agent-identity model (the real "who / how-where"): AgentPersona +
// AgentAppearance + AgentVoiceProfile → SimAgentPersonaView; AgentDefinition →
// SimAgentDefinitionView. Replaces the invented game-creature/roster concept.
//
// Resolution mirrors kradle's `resolveAgentPersona`/`resolveAgentDefinition`
// (`packages/kradle/core/src/agent-persona-controller.js`): appearance/voice are
// either INLINE on the persona spec OR carried by a standalone resource that
// references the persona via `personaRef`. The inline form wins.
// ---------------------------------------------------------------------------

function personaItems(snapshot: KradleControllerSnapshot): KradleResourceItem[] {
  const fromAgents = collectionItems(snapshot, 'personas');
  if (fromAgents.length > 0) return fromAgents;
  return resourceItemsByKind(snapshot, 'AgentPersona');
}

function definitionItems(snapshot: KradleControllerSnapshot): KradleResourceItem[] {
  const fromAgents = collectionItems(snapshot, 'definitions');
  if (fromAgents.length > 0) return fromAgents;
  return resourceItemsByKind(snapshot, 'AgentDefinition');
}

function processTemplateItems(snapshot: KradleControllerSnapshot): KradleResourceItem[] {
  const fromAgents = collectionItems(snapshot, 'processTemplates');
  if (fromAgents.length > 0) return fromAgents;
  return resourceItemsByKind(snapshot, 'AgentProcessTemplate');
}

/**
 * Index the REAL `AgentProcessTemplate` resources by their `spec.taskKind`. Each
 * entry carries the persisted phase pipeline plus the real identity used by the
 * process view: `processId` from `metadata.name`, `revision` from
 * `metadata.generation` (falling back to `resourceVersion`). When two templates
 * target the same task kind, the last one (stably sorted by name) wins — but
 * task kinds are expected to be unique.
 */
interface RealProcessTemplate {
  taskKind: TaskKind;
  phases: string[];
  processId: string;
  revision: number;
  displayName: string | null;
}

function buildProcessTemplateIndex(
  snapshot: KradleControllerSnapshot,
): Map<TaskKind, RealProcessTemplate> {
  const index = new Map<TaskKind, RealProcessTemplate>();
  const items = [...processTemplateItems(snapshot)].sort((a, b) =>
    a.metadata.name.localeCompare(b.metadata.name),
  );
  for (const item of items) {
    const sp = spec(item);
    const taskKindRaw = asString(sp.taskKind);
    if (taskKindRaw === undefined || !TASK_KIND_SET.has(taskKindRaw)) continue;
    const phasesRaw = Array.isArray(sp.phases) ? sp.phases : [];
    const phases = phasesRaw
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter((p) => p.length > 0);
    if (phases.length === 0) continue;
    index.set(taskKindRaw as TaskKind, {
      taskKind: taskKindRaw as TaskKind,
      phases,
      processId: item.metadata.name,
      revision: processTemplateRevision(item),
      displayName: asString(sp.displayName) ?? null,
    });
  }
  return index;
}

/** Real template revision: prefer `metadata.generation`, then `resourceVersion`. */
function processTemplateRevision(item: KradleResourceItem): number {
  const { generation, resourceVersion } = item.metadata;
  if (typeof generation === 'number' && Number.isFinite(generation)) return generation;
  if (typeof resourceVersion === 'string') {
    const parsed = Number.parseInt(resourceVersion, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof resourceVersion === 'number' && Number.isFinite(resourceVersion)) return resourceVersion;
  return 1;
}

function appearanceItems(snapshot: KradleControllerSnapshot): KradleResourceItem[] {
  const fromAgents = collectionItems(snapshot, 'appearances');
  if (fromAgents.length > 0) return fromAgents;
  return resourceItemsByKind(snapshot, 'AgentAppearance');
}

function voiceProfileItems(snapshot: KradleControllerSnapshot): KradleResourceItem[] {
  const fromAgents = collectionItems(snapshot, 'voiceProfiles');
  if (fromAgents.length > 0) return fromAgents;
  return resourceItemsByKind(snapshot, 'AgentVoiceProfile');
}

interface IdentityIndex {
  /** Personas by `metadata.name`. */
  personaByName: Map<string, KradleResourceItem>;
  /** Standalone AgentAppearance by `spec.personaRef`. */
  appearanceByPersona: Map<string, KradleResourceItem>;
  /** Standalone AgentVoiceProfile by `spec.personaRef`. */
  voiceByPersona: Map<string, KradleResourceItem>;
  /** Resolved persona views by persona name (memoized). */
  personaViewByName: Map<string, SimAgentPersonaView>;
}

function buildIdentityIndex(snapshot: KradleControllerSnapshot): IdentityIndex {
  const personaByName = new Map<string, KradleResourceItem>();
  for (const p of personaItems(snapshot)) personaByName.set(p.metadata.name, p);

  const appearanceByPersona = new Map<string, KradleResourceItem>();
  for (const a of appearanceItems(snapshot)) {
    const ref = asString(spec(a).personaRef);
    if (ref !== undefined) appearanceByPersona.set(ref, a);
  }
  const voiceByPersona = new Map<string, KradleResourceItem>();
  for (const v of voiceProfileItems(snapshot)) {
    const ref = asString(spec(v).personaRef);
    if (ref !== undefined) voiceByPersona.set(ref, v);
  }
  return {
    personaByName,
    appearanceByPersona,
    voiceByPersona,
    personaViewByName: new Map(),
  };
}

/**
 * Resolve one `AgentPersona` item to a {@link SimAgentPersonaView}, joining the
 * inline `appearance`/`voiceProfile` (preferred) or the standalone
 * `AgentAppearance`/`AgentVoiceProfile` by `personaRef`. Memoized per index.
 */
function resolvePersonaView(
  persona: KradleResourceItem,
  index: IdentityIndex,
): SimAgentPersonaView {
  const cached = index.personaViewByName.get(persona.metadata.name);
  if (cached !== undefined) return cached;

  const sp = spec(persona);
  const displayName = asString(sp.displayName) ?? persona.metadata.name;
  const tagline = asString(sp.tagline) ?? null;
  const roleTitle = asString(asRecord(sp.role)?.title) ?? null;

  // Appearance: inline on the persona spec, else the standalone resource.
  const inlineAppearance = asRecord(sp.appearance);
  const standaloneAppearance = index.appearanceByPersona.get(persona.metadata.name);
  const appearanceSpec =
    inlineAppearance ??
    (standaloneAppearance !== undefined ? spec(standaloneAppearance) : undefined);
  const emoji = asString(appearanceSpec?.emoji) ?? null;
  const avatar = asRecord(appearanceSpec?.avatar) ?? null;

  // Voice: inline on the persona spec, else the standalone resource.
  const inlineVoice = asRecord(sp.voiceProfile);
  const standaloneVoice = index.voiceByPersona.get(persona.metadata.name);
  const voiceSpec =
    inlineVoice ?? (standaloneVoice !== undefined ? spec(standaloneVoice) : undefined);
  const ttsProvider = asString(voiceSpec?.ttsProvider) ?? null;

  const view: SimAgentPersonaView = {
    name: persona.metadata.name,
    displayName,
    roleTitle,
    tagline,
    emoji,
    avatar,
    ttsProvider,
  };
  index.personaViewByName.set(persona.metadata.name, view);
  return view;
}

/**
 * `mapAgentPersonas(snapshot)` — every `AgentPersona` resolved to its identity
 * view (displayName + role.title + appearance.emoji|avatar + voiceProfile.
 * ttsProvider + tagline), sorted by displayName (stable).
 */
export function mapAgentPersonas(snapshot: KradleControllerSnapshot): SimAgentPersonaView[] {
  const index = buildIdentityIndex(snapshot);
  return [...index.personaByName.values()]
    .map((p) => resolvePersonaView(p, index))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * `mapAgentDefinitions(snapshot)` — every `AgentDefinition` (the deployment
 * binding pairing a persona to a stack) with its resolved persona identity.
 * `persona` is null when the referenced `AgentPersona` is absent (honest gap —
 * never fabricated). Sorted by name (stable).
 */
export function mapAgentDefinitions(
  snapshot: KradleControllerSnapshot,
): SimAgentDefinitionView[] {
  const index = buildIdentityIndex(snapshot);
  const out: SimAgentDefinitionView[] = [];
  for (const def of definitionItems(snapshot)) {
    const sp = spec(def);
    const personaRef = asString(sp.personaRef) ?? '';
    const personaItem = personaRef !== '' ? index.personaByName.get(personaRef) : undefined;
    out.push({
      name: def.metadata.name,
      personaRef,
      stackRef: asString(sp.stackRef) ?? '',
      roleContext: asString(sp.roleContext) ?? null,
      persona: personaItem !== undefined ? resolvePersonaView(personaItem, index) : null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The honest board/session IDENTITY resolved from the real model. Given a
 * run/session `spec.agentDefinition` (or a direct `spec.personaRef`), follow
 * `AgentDefinition.spec.personaRef → AgentPersona` and return the resolved
 * persona view. Returns null when no identity can be resolved — the caller then
 * uses an HONEST fallback (the run/session name), never a procedural creature.
 */
function resolveIdentityForRef(
  index: IdentityIndex,
  definitionByName: Map<string, KradleResourceItem>,
  agentDefinitionRef: string | undefined,
  personaRef: string | undefined,
): SimAgentPersonaView | null {
  // 1) A direct persona ref wins (rare, but honest when present).
  if (personaRef !== undefined) {
    const direct = index.personaByName.get(personaRef);
    if (direct !== undefined) return resolvePersonaView(direct, index);
  }
  // 2) The definition path: definition → personaRef → persona.
  if (agentDefinitionRef !== undefined) {
    const def = definitionByName.get(agentDefinitionRef);
    const defPersonaRef = def !== undefined ? asString(spec(def).personaRef) : undefined;
    if (defPersonaRef !== undefined) {
      const persona = index.personaByName.get(defPersonaRef);
      if (persona !== undefined) return resolvePersonaView(persona, index);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// §4.2 — AgentDispatchRun phase (+ refinement) → board column (AC4)
// ---------------------------------------------------------------------------

/** Valid board columns (the kradle reconciler emits a subset of these). */
const COLUMN_SET = new Set<string>(COLUMNS);

/**
 * The first-class lane source: the run's `status.boardColumn`, set by the kradle
 * run-status reconciler (`aggregated-resources.yaml`). Returns the column only
 * when it is a recognized `ColumnId`; otherwise `undefined` so the caller falls
 * back to the phase→column derivation (thin, honest fallback — never invents).
 */
function runBoardColumn(item: KradleResourceItem): ColumnId | undefined {
  const raw = asString(status(item).boardColumn);
  return raw !== undefined && COLUMN_SET.has(raw) ? (raw as ColumnId) : undefined;
}

/** The first-class progress source: the run's `status.progress` in [0,1]. */
function runStatusProgress(item: KradleResourceItem): number | undefined {
  const raw = asNumber(status(item).progress);
  if (raw === undefined) return undefined;
  return Math.min(1, Math.max(0, raw));
}

/**
 * §4.2 total, deterministic phase→column map. `phase` is the run's
 * `status.phase`; `refine` carries the refinement signals the table keys on.
 *
 * Accepts BOTH casings (SPEC §4.2): the lowercase lifecycle union
 * (`pending|queued|running|waiting-for-approval|succeeded|failed|cancelled`,
 * `agent-stack-management-spec.md:277`) AND the capitalized terminals the live
 * BFF emits (`Queued|Running|AwaitingApproval|Succeeded|Completed|Cancelled|Failed`,
 * `run-actions.jsx:129`; cancel patches `status.phase='Cancelled'`). The map
 * stays total + deterministic: an unknown phase lands in the backlog.
 */
export function runPhaseToColumn(
  phase: string | undefined,
  refine: {
    taskKind: TaskKind;
    hasPendingReviewApproval: boolean;
    hasPendingWriteBackApproval: boolean;
    hasApprovedWriteBack: boolean;
    merged: boolean;
    released: boolean;
  },
): ColumnId {
  switch (phase) {
    // created, not executing.
    case 'pending':
    case 'Pending':
    case 'queued':
    case 'Queued':
      return 'backlog';
    // actively working (automated review stage when a review gate is pending).
    case 'running':
    case 'Running': {
      if (refine.hasPendingReviewApproval || refine.taskKind === 'review') return 'ai-review';
      return 'do';
    }
    // blocked on a human gate.
    case 'waiting-for-approval':
    case 'AwaitingApproval':
      return 'human-review';
    // passed review; merged/in-production are Commander label refinements.
    case 'succeeded':
    case 'Succeeded':
    case 'Completed': {
      if (refine.released) return 'in-production';
      if (refine.merged) return 'merged';
      if (refine.hasApprovedWriteBack) return 'approved';
      // Succeeded with no integration signal — treat as approved (passed,
      // awaiting integration). The merge/release labels move it onward.
      return 'approved';
    }
    // returned for rework.
    case 'failed':
    case 'Failed':
    case 'cancelled':
    case 'Cancelled':
      return 'backlog';
    default:
      // Forward-compatible: an unknown phase lands in the backlog (total map).
      return 'backlog';
  }
}

// ---------------------------------------------------------------------------
// §4.1 — Run → Attempt → Session hierarchy (the headline fix)
// ---------------------------------------------------------------------------

/** Terminal attempt/run phases (both casings) — a non-terminal attempt is "live". */
const TERMINAL_PHASES = new Set<string>([
  'succeeded',
  'Succeeded',
  'Completed',
  'failed',
  'Failed',
  'cancelled',
  'Cancelled',
]);

function isTerminalPhase(phase: string | undefined): boolean {
  return phase !== undefined && TERMINAL_PHASES.has(phase);
}

function attemptRun(item: KradleResourceItem): string | undefined {
  // The attempt's parent run (`spec.agentDispatchRun`); tolerate `dispatchRun`.
  return asString(spec(item).agentDispatchRun) ?? asString(spec(item).dispatchRun);
}

/** All `AgentDispatchAttempt` items (collection-first, `resources[]` fallback). */
function attemptItems(snapshot: KradleControllerSnapshot): KradleResourceItem[] {
  const fromResources = resourceItemsByKind(snapshot, 'AgentDispatchAttempt');
  if (fromResources.length > 0) return fromResources;
  return [];
}

interface AttemptIndex {
  /** Attempts grouped by run, ordered oldest→newest (creationTimestamp, then seq). */
  byRun: Map<string, KradleResourceItem[]>;
  /** The active (newest non-terminal, else newest) attempt name per run. */
  activeByRun: Map<string, string>;
}

function buildAttemptIndex(snapshot: KradleControllerSnapshot): AttemptIndex {
  const grouped = new Map<string, Array<{ item: KradleResourceItem; seq: number }>>();
  let seq = 0;
  for (const attempt of attemptItems(snapshot)) {
    const run = attemptRun(attempt);
    if (run === undefined) {
      seq += 1;
      continue;
    }
    (grouped.get(run) ?? grouped.set(run, []).get(run)!).push({ item: attempt, seq });
    seq += 1;
  }

  const byRun = new Map<string, KradleResourceItem[]>();
  const activeByRun = new Map<string, string>();
  for (const [run, entries] of grouped) {
    entries.sort(
      (a, b) =>
        (creationMs(a.item) ?? a.seq) - (creationMs(b.item) ?? b.seq) || a.seq - b.seq,
    );
    const ordered = entries.map((e) => e.item);
    byRun.set(run, ordered);
    // Active = the newest non-terminal attempt; else the newest overall.
    let active: KradleResourceItem | undefined;
    for (let i = ordered.length - 1; i >= 0; i -= 1) {
      if (!isTerminalPhase(statusPhase(ordered[i]))) {
        active = ordered[i];
        break;
      }
    }
    active ??= ordered[ordered.length - 1];
    if (active !== undefined) activeByRun.set(run, active.metadata.name);
  }
  return { byRun, activeByRun };
}

// ---------------------------------------------------------------------------
// Approval helpers (§2.3.3) — pending AgentApprovals keyed by run.
// ---------------------------------------------------------------------------

interface ApprovalIndex {
  /** All approvals for a run (`spec.dispatchRun`). */
  byRun: Map<string, KradleResourceItem[]>;
  /** Pending approvals for a run (phase 'Pending' or unset). */
  pendingByRun: Map<string, KradleResourceItem[]>;
}

function approvalDispatchRun(item: KradleResourceItem): string | undefined {
  return asString(spec(item).dispatchRun);
}

function approvalActionType(item: KradleResourceItem): string | undefined {
  // `spec.action` has two shapes in the wild: the kradle approval controller +
  // live cluster store a bare STRING (e.g. 'review', 'write-back'); the richer
  // spec/contract form is an object `{ type, target, summary }`. Read both, else
  // the gate type never resolves against real data and review/human-review
  // refinements silently never fire.
  const raw = spec(item).action;
  const asStr = asString(raw);
  if (asStr !== undefined) return asStr;
  return asString(asRecord(raw)?.type);
}

function isPendingApproval(item: KradleResourceItem): boolean {
  const phase = statusPhase(item);
  return phase === undefined || phase === 'Pending';
}

function buildApprovalIndex(snapshot: KradleControllerSnapshot): ApprovalIndex {
  const byRun = new Map<string, KradleResourceItem[]>();
  const pendingByRun = new Map<string, KradleResourceItem[]>();
  const all = collectionItems(snapshot, 'approvals');
  const pending = collectionPending(snapshot, 'approvals');
  for (const item of all) {
    const run = approvalDispatchRun(item);
    if (run === undefined) continue;
    (byRun.get(run) ?? byRun.set(run, []).get(run)!).push(item);
  }
  const pendingSource = pending.length > 0 ? pending : all.filter(isPendingApproval);
  for (const item of pendingSource) {
    const run = approvalDispatchRun(item);
    if (run === undefined) continue;
    (pendingByRun.get(run) ?? pendingByRun.set(run, []).get(run)!).push(item);
  }
  return { byRun, pendingByRun };
}

const REVIEW_ACTION_TYPES = new Set(['review', 'ai-review']);
const WRITE_BACK_ACTION_TYPES = new Set(['write-back', 'release', 'tool-use']);

// ---------------------------------------------------------------------------
// Session indexing (§4.1) — sessions roll up from attempts.
// ---------------------------------------------------------------------------

function sessionDispatchRun(item: KradleResourceItem): string | undefined {
  return asString(spec(item).dispatchRun);
}

/** §4.1 preferred grouping key: the owning attempt, falling back to the run. */
function sessionDispatchAttempt(item: KradleResourceItem): string | undefined {
  return asString(spec(item).dispatchAttempt);
}

function isActiveSession(item: KradleResourceItem): boolean {
  return statusPhase(item) === 'Active';
}

/** Active sessions grouped by their dispatch run (used by run-level surfaces). */
function activeSessionsByRun(snapshot: KradleControllerSnapshot): Map<string, KradleResourceItem[]> {
  const out = new Map<string, KradleResourceItem[]>();
  for (const session of collectionItems(snapshot, 'sessions')) {
    if (!isActiveSession(session)) continue;
    const run = sessionDispatchRun(session);
    if (run === undefined) continue;
    (out.get(run) ?? out.set(run, []).get(run)!).push(session);
  }
  return out;
}

/** All sessions (any phase) grouped by their owning attempt (§4.1). */
function sessionsByAttempt(snapshot: KradleControllerSnapshot): Map<string, KradleResourceItem[]> {
  const out = new Map<string, KradleResourceItem[]>();
  for (const session of collectionItems(snapshot, 'sessions')) {
    const attempt = sessionDispatchAttempt(session);
    if (attempt === undefined) continue;
    (out.get(attempt) ?? out.set(attempt, []).get(attempt)!).push(session);
  }
  return out;
}

/**
 * §4.1 `SimCardView.agentIds` source: the ACTIVE sessions of the run's ACTIVE
 * attempt. Sessions are grouped by `spec.dispatchAttempt` (preferred); when no
 * attempt records exist (or sessions carry no attempt ref), this falls back to
 * the run's active sessions so the kradle-only path still surfaces creatures.
 */
function activeSessionsOfActiveAttempt(
  runName: string,
  attempts: AttemptIndex,
  activeByRun: Map<string, KradleResourceItem[]>,
  byAttempt: Map<string, KradleResourceItem[]>,
): KradleResourceItem[] {
  const activeAttempt = attempts.activeByRun.get(runName);
  if (activeAttempt !== undefined) {
    const scoped = (byAttempt.get(activeAttempt) ?? []).filter(isActiveSession);
    if (scoped.length > 0) return scoped;
    // The active attempt has no active sessions yet — surface none (do NOT leak
    // sessions of a prior attempt). Fall through to the run-level set only when
    // there are NO attempt records at all (handled below).
    if (attempts.byRun.has(runName)) return [];
  }
  // No attempt records for this run → fall back to the run's active sessions.
  return activeByRun.get(runName) ?? [];
}

// ---------------------------------------------------------------------------
// Workspace indexing (§2.5) — workspaces by name.
// ---------------------------------------------------------------------------

const WORKSPACE_PHASE_MAP: Record<string, AgentWorkspacePhase> = {
  Pending: 'created',
  Provisioning: 'created',
  Ready: 'ready',
  InUse: 'ready',
  Released: 'ready',
  Archived: 'archived',
  Terminating: 'missing',
};

function mapWorkspacePhase(phase: string | undefined): AgentWorkspacePhase {
  if (phase !== undefined && phase in WORKSPACE_PHASE_MAP) return WORKSPACE_PHASE_MAP[phase]!;
  return 'missing';
}

function workspaceGitStatus(item: KradleResourceItem): WorkspaceGitStatus {
  const raw = asRecord(status(item).gitStatus);
  const branch = asString(raw?.branch) ?? 'main';
  const headSha = asString(raw?.headSha) ?? '';
  const dirty = raw?.dirty === true;
  const result: WorkspaceGitStatus = { branch, headSha, dirty };
  const ahead = asNumber(raw?.ahead);
  const behind = asNumber(raw?.behind);
  const uncommittedCount = asNumber(raw?.uncommittedCount);
  if (ahead !== undefined) result.ahead = ahead;
  if (behind !== undefined) result.behind = behind;
  if (uncommittedCount !== undefined) result.uncommittedCount = uncommittedCount;
  return result;
}

function workspacesByName(snapshot: KradleControllerSnapshot): Map<string, KradleResourceItem> {
  const out = new Map<string, KradleResourceItem>();
  for (const ws of collectionItems(snapshot, 'workspaces')) {
    out.set(ws.metadata.name, ws);
  }
  return out;
}

// ---------------------------------------------------------------------------
// §2.3.2 — AgentDispatchRun → SimCardView (the central mapping, AC12)
// ---------------------------------------------------------------------------

function runProgress(phase: string | undefined): number {
  // Casing-tolerant (§4.2): normalize before the step function.
  switch (normalizeAttemptPhase(phase)) {
    case 'running':
      return 0.5;
    case 'succeeded':
      return 1;
    default:
      return 0;
  }
}

/**
 * §4.1/§4.3 `mapCards`. Maps every `model.agents.runs.items` to a `SimCardView`,
 * column per §4.2, with stable per-column ordering by creationTimestamp.
 * `attempt` is the count of `AgentDispatchAttempt` records for the run, and
 * `agentIds` are the ACTIVE sessions of the run's ACTIVE attempt (§4.1).
 */
export function mapCards(snapshot: KradleControllerSnapshot): SimCardView[] {
  const runs = collectionItems(snapshot, 'runs');
  const approvals = buildApprovalIndex(snapshot);
  const wsByName = workspacesByName(snapshot);
  const activeByRun = activeSessionsByRun(snapshot);
  const attempts = buildAttemptIndex(snapshot);
  const byAttempt = sessionsByAttempt(snapshot);

  // Parent → children. Prefer the REAL `spec.parentRunRef` (subtask
  // decomposition); fall back to the `commander.a5c.ai/parent` label only when
  // the real field is absent (honest interim for runs that predate it).
  const childrenByParent = new Map<string, string[]>();
  for (const run of runs) {
    const parent = asString(spec(run).parentRunRef) ?? labels(run)[LABEL_PARENT];
    if (parent !== undefined) {
      (childrenByParent.get(parent) ?? childrenByParent.set(parent, []).get(parent)!).push(
        run.metadata.name,
      );
    }
  }

  // First pass: build each card (column + sort key).
  interface Built {
    view: SimCardView;
    sortKey: number;
    seq: number;
  }
  const built: Built[] = [];
  let seq = 0;
  for (const run of runs) {
    const sp = spec(run);
    const lab = labels(run);
    const taskId = run.metadata.name;
    const taskKind = narrowTaskKind(asString(sp.taskKind));
    const phase = statusPhase(run);

    // Observability: surface the run's cost / tokens / duration on the card.
    const st = status(run);
    const tokenUsage = asRecord(st.tokenUsage);
    const tokensBurned =
      (asNumber(tokenUsage?.totalTokens) ??
        (asNumber(tokenUsage?.inputTokens) ?? 0) + (asNumber(tokenUsage?.outputTokens) ?? 0)) || 0;
    const startedMs = isoToMs(st.startedAt) ?? isoToMs(st.queuedAt);
    const endedMs = isoToMs(st.completedAt) ?? isoToMs(st.failedAt);
    const durationMs = startedMs !== undefined && endedMs !== undefined ? endedMs - startedMs : null;

    const runApprovals = approvals.pendingByRun.get(taskId) ?? [];
    const hasPendingReviewApproval = runApprovals.some((a) =>
      REVIEW_ACTION_TYPES.has(approvalActionType(a) ?? ''),
    );
    const hasPendingWriteBackApproval = runApprovals.some((a) =>
      WRITE_BACK_ACTION_TYPES.has(approvalActionType(a) ?? ''),
    );
    const hasApprovedWriteBack = (approvals.byRun.get(taskId) ?? []).some(
      (a) =>
        WRITE_BACK_ACTION_TYPES.has(approvalActionType(a) ?? '') &&
        (statusPhase(a) === 'Approved' || asString(status(a).decision) === 'approved'),
    );
    // Release rail: the REAL `status.mergedAt`/`status.releasedAt` are PRIMARY
    // (set by the run-status reconciler); the `commander.a5c.ai/merged` /
    // `release-id` labels are the honest fallback for runs that predate them.
    const merged = asString(status(run).mergedAt) !== undefined || lab[LABEL_MERGED] === 'true';
    const released =
      asString(status(run).releasedAt) !== undefined || lab[LABEL_RELEASE_ID] !== undefined;

    // Base lane: prefer the real reconciled lane (`status.boardColumn`); fall
    // back to the phase→column derivation otherwise (thin, honest fallback —
    // §4.2). The kradle run-status reconciler derives boardColumn from the phase
    // ALONE (it has no approval context), so a pending approval gate is overlaid
    // below.
    const baseColumn =
      runBoardColumn(run) ??
      runPhaseToColumn(phase, {
        taskKind,
        hasPendingReviewApproval,
        hasPendingWriteBackApproval,
        hasApprovedWriteBack,
        merged,
        released,
      });
    // A PENDING AgentApproval is the salient lane state and must surface even
    // over a phase-derived boardColumn: a real review/ai-review approval → the
    // AI-review lane; a write-back/release/escalation/tool-use/secret-access
    // approval → the human-review lane. Terminal/release lanes are never overridden.
    const column: ColumnId =
      baseColumn === 'merged' || baseColumn === 'in-production' || baseColumn === 'approved'
        ? baseColumn
        : hasPendingReviewApproval
          ? 'ai-review'
          : hasPendingWriteBackApproval
            ? 'human-review'
            : baseColumn;

    const workspaceId = asString(sp.workspaceRef) ?? '';
    const ws = workspaceId !== '' ? wsByName.get(workspaceId) : undefined;
    const dirtyFileCount = ws !== undefined ? workspaceGitStatus(ws).uncommittedCount ?? 0 : 0;

    const sourceRefs = asRecord(sp.sourceRefs);
    const pullRequest = asString(sourceRefs?.pullRequest);
    const repository = asString(sp.repository) ?? '';
    // Prefer the real `spec.title`; fall back to PR/repository derivation only
    // when it is absent (thin, honest fallback).
    const title =
      asString(sp.title) ?? pullRequest ?? (repository !== '' ? `${repository}:${taskKind}` : taskId);

    const sourceEvent = asRecord(sp.sourceEvent);
    // Prefer the real `spec.description`; fall back to the source-event name.
    const description = asString(sp.description) ?? asString(sourceEvent?.name) ?? '';

    const feedbackApproval = (approvals.byRun.get(taskId) ?? []).find(
      (a) => asString(status(a).feedback) !== undefined,
    );
    const feedback = feedbackApproval ? asString(status(feedbackApproval).feedback) ?? null : null;

    const agentIds = activeSessionsOfActiveAttempt(
      taskId,
      attempts,
      activeByRun,
      byAttempt,
    ).map((s) => s.metadata.name);

    // §4.3: the attempt count is the number of real AgentDispatchAttempt records
    // for the run (the centerpiece of the cut), not a status.attempt integer.
    const attempt = (attempts.byRun.get(taskId) ?? []).length || 1;

    const view: SimCardView = {
      taskId,
      taskKind,
      title,
      repository,
      workspaceId,
      column,
      order: 0, // assigned in the per-column ordering pass below.
      // Yolo / per-run auto-approve: prefer the REAL
      // `spec.approvalPolicy.autoApprove` boolean; fall back to the
      // `commander.a5c.ai/yolo` label only when the real field is absent.
      yolo:
        asBoolean(asRecord(sp.approvalPolicy)?.autoApprove) ?? lab[LABEL_YOLO] === 'true',
      merged: column === 'merged' || column === 'in-production',
      // Prefer the real reconciled `status.progress`; fall back to phase→progress.
      progress: runStatusProgress(run) ?? runProgress(phase),
      // Subtask parent: prefer the REAL `spec.parentRunRef`; fall back to the
      // `commander.a5c.ai/parent` label only when the real field is absent.
      parentId: asString(sp.parentRunRef) ?? lab[LABEL_PARENT] ?? null,
      childIds: childrenByParent.get(taskId) ?? [],
      agentIds,
      attempt,
      feedback,
      dirtyFileCount,
      hasPendingInquiry: runApprovals.length > 0,
      stackRef: asString(sp.agentStack) ?? '',
      description,
      releaseId: lab[LABEL_RELEASE_ID] ?? null,
      compacted: false,
      workerAgentId: lab[LABEL_WORKER] ?? null,
      reviewerAgentId: lab[LABEL_REVIEWER] ?? null,
      humanAssigneeId: lab[LABEL_HUMAN] ?? null,
      costUsd: asNumber(st.cost) ?? 0,
      tokensBurned,
      durationMs,
    };
    built.push({ view, sortKey: creationMs(run) ?? seq, seq });
    seq += 1;
  }

  // Second pass: stable per-column ordering by creationTimestamp (then seq).
  const byColumn = new Map<ColumnId, Built[]>();
  for (const b of built) {
    (byColumn.get(b.view.column) ?? byColumn.set(b.view.column, []).get(b.view.column)!).push(b);
  }
  for (const group of byColumn.values()) {
    group.sort((a, b) => a.sortKey - b.sortKey || a.seq - b.seq);
    group.forEach((b, index) => {
      b.view.order = index;
    });
  }
  return built.map((b) => b.view);
}

// ---------------------------------------------------------------------------
// §4.1 — AgentDispatchAttempt → SimAttemptView (the new attempt surface)
// ---------------------------------------------------------------------------

const ATTEMPT_PHASE_NORMALIZE: Record<string, string> = {
  Pending: 'pending',
  Queued: 'queued',
  Running: 'running',
  AwaitingApproval: 'waiting-for-approval',
  Succeeded: 'succeeded',
  Completed: 'succeeded',
  Failed: 'failed',
  Cancelled: 'cancelled',
};

/** Normalize an attempt phase to the lowercase lifecycle union (both casings in). */
function normalizeAttemptPhase(phase: string | undefined): string {
  if (phase === undefined) return 'pending';
  return ATTEMPT_PHASE_NORMALIZE[phase] ?? phase;
}

/**
 * Canonicalize a run phase (either casing) to the CAPITALIZED key the run-state
 * maps below (`OBSERVED_STATE_MAP`/`TASK_STATE_MAP`) are written against, so the
 * lowercase lifecycle union the generic CRD list surfaces (`succeeded`, …) and
 * the capitalized terminals the live BFF emits (`Succeeded`, …) both resolve
 * (§4.2 both-casings).
 */
const RUN_PHASE_TO_CAPITALIZED: Record<string, string> = {
  pending: 'Pending',
  queued: 'Queued',
  running: 'Running',
  'waiting-for-approval': 'AwaitingApproval',
  succeeded: 'Succeeded',
  Completed: 'Succeeded',
  completed: 'Succeeded',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function canonicalRunPhase(phase: string | undefined): string | undefined {
  if (phase === undefined) return undefined;
  return RUN_PHASE_TO_CAPITALIZED[phase] ?? phase;
}

function mapAttemptView(
  attempt: KradleResourceItem,
  runName: string,
  active: boolean,
  byAttempt: Map<string, KradleResourceItem[]>,
): SimAttemptView {
  const sp = spec(attempt);
  const st = status(attempt);
  const sessions = byAttempt.get(attempt.metadata.name) ?? [];
  return {
    attemptId: attempt.metadata.name,
    taskId: runName,
    attemptReason: asString(sp.attemptReason) ?? 'initial',
    phase: normalizeAttemptPhase(statusPhase(attempt)),
    active,
    exitReason: asString(st.exitReason) ?? null,
    sessionIds: sessions.map((s) => s.metadata.name),
    startedAt: isoToMs(st.startedAt) ?? null,
    endedAt: isoToMs(st.completedAt) ?? null,
  };
}

/**
 * §4.1 `listAttempts(taskId?)`. Maps `AgentDispatchAttempt` records to
 * `SimAttemptView`, oldest→newest per run; the run's ACTIVE attempt is flagged.
 * Filtered by run when `taskId` is given.
 */
export function mapAttempts(snapshot: KradleControllerSnapshot, taskId?: string): SimAttemptView[] {
  const attempts = buildAttemptIndex(snapshot);
  const byAttempt = sessionsByAttempt(snapshot);
  const out: SimAttemptView[] = [];
  for (const [runName, items] of attempts.byRun) {
    if (taskId !== undefined && runName !== taskId) continue;
    const activeName = attempts.activeByRun.get(runName);
    for (const item of items) {
      out.push(
        mapAttemptView(item, runName, item.metadata.name === activeName, byAttempt),
      );
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// §4.3 — AgentDispatchRun → SimRunView + getRunObservation (AC4)
// ---------------------------------------------------------------------------

/**
 * §2.3.3 `status.phase` → `ObservedRunState`. NOTE: `ObservedRunState`
 * (`babysitter-run.ts`) is the journal-derived union
 * `'created'|'waiting'|'completed'|'halted'|'failed'` — it has no `'running'`/
 * `'pending'` members (the spec's prose names are mapped to the nearest journal
 * state): a Running/AwaitingApproval run is `'waiting'` (it has live/open
 * effects); a Pending/Queued run is `'created'` (no effects yet).
 */
const OBSERVED_STATE_MAP: Record<string, ObservedRunState> = {
  Running: 'waiting',
  Succeeded: 'completed',
  Failed: 'failed',
  Cancelled: 'failed',
  Pending: 'created',
  Queued: 'created',
  AwaitingApproval: 'waiting',
};

function mapObservedState(phase: string | undefined): ObservedRunState {
  const canon = canonicalRunPhase(phase);
  if (canon !== undefined && canon in OBSERVED_STATE_MAP) return OBSERVED_STATE_MAP[canon]!;
  return 'created';
}

function phasePipeline(
  taskKind: TaskKind,
  phase: string | undefined,
  templateIndex?: Map<TaskKind, RealProcessTemplate>,
): Array<{ label: string; status: 'done' | 'current' | 'pending' }> {
  // Prefer the REAL AgentProcessTemplate's phases when one exists for this task
  // kind; otherwise fall back HONESTLY to the hardcoded PHASES_BY_KIND constant.
  const real = templateIndex?.get(taskKind);
  const phases = real !== undefined ? real.phases : PHASES_BY_KIND[taskKind];
  const progress = runProgress(phase);
  // Map progress to a current-phase index: 0 → first, 0.5 → middle, 1 → all done.
  if (progress >= 1) {
    return phases.map((label) => ({ label, status: 'done' as const }));
  }
  const currentIndex = progress <= 0 ? 0 : Math.min(phases.length - 1, Math.floor(phases.length / 2));
  return phases.map((label, index) => ({
    label,
    status: index < currentIndex ? ('done' as const) : index === currentIndex ? ('current' as const) : ('pending' as const),
  }));
}

function pendingEffectsByKindForRun(
  snapshot: KradleControllerSnapshot,
  runName: string,
): PendingEffectsByKind {
  const approvals = buildApprovalIndex(snapshot);
  const pending = approvals.pendingByRun.get(runName) ?? [];
  if (pending.length === 0) return {};
  return { breakpoint: pending.length };
}

function processIdFor(
  taskKind: TaskKind,
  templateIndex?: Map<TaskKind, RealProcessTemplate>,
): string {
  // The REAL template's metadata.name is the persisted process id; the synthetic
  // `commander/<kind>@v1` id is only the honest fallback when none exists.
  const real = templateIndex?.get(taskKind);
  if (real !== undefined) return real.processId;
  return `commander/${taskKind}@v1`;
}

/** §2.3.3 `mapRuns`. `model.agents.runs.items` → run-ledger rows, newest-first. */
export function mapRuns(snapshot: KradleControllerSnapshot): SimRunView[] {
  const runs = collectionItems(snapshot, 'runs');
  const templateIndex = buildProcessTemplateIndex(snapshot);
  const out: SimRunView[] = runs.map((run) => {
    const sp = spec(run);
    const st = status(run);
    const taskKind = narrowTaskKind(asString(sp.taskKind));
    const phase = statusPhase(run);
    const startedAt = isoToMs(st.queuedAt) ?? creationMs(run) ?? 0;
    const endedAtRaw = isoToMs(st.completedAt) ?? isoToMs(st.failedAt);
    return {
      runId: run.metadata.name,
      taskId: run.metadata.name,
      taskKind,
      processId: processIdFor(taskKind, templateIndex),
      processRevision: templateIndex.get(taskKind)?.revision ?? 1,
      observedState: mapObservedState(phase),
      phases: phasePipeline(taskKind, phase, templateIndex),
      pendingEffectsByKind: pendingEffectsByKindForRun(snapshot, run.metadata.name),
      tokens: { ...EMPTY_TOKENS },
      costUsd: asNumber(st.cost) ?? 0,
      startedAt,
      endedAt: endedAtRaw ?? null,
    };
  });
  return out.sort((a, b) => b.startedAt - a.startedAt);
}

/** §2.3.3 `getRunObservation(taskId)`. Journal is documented-empty (AC12). */
export function mapRunObservation(
  snapshot: KradleControllerSnapshot,
  taskId: string,
): SimRunObservationView | null {
  const run = collectionItems(snapshot, 'runs').find((r) => r.metadata.name === taskId);
  if (run === undefined) return null;
  const taskKind = narrowTaskKind(asString(spec(run).taskKind));
  const phase = statusPhase(run);
  const templateIndex = buildProcessTemplateIndex(snapshot);
  return {
    runId: run.metadata.name,
    taskId: run.metadata.name,
    observedState: mapObservedState(phase),
    pendingEffectsByKind: pendingEffectsByKindForRun(snapshot, taskId),
    phases: phasePipeline(taskKind, phase, templateIndex),
    journal: [],
  };
}

// ---------------------------------------------------------------------------
// §2.2 — AgentSession → SimSessionView / SimSessionDetailView (AC11)
// ---------------------------------------------------------------------------

const SESSION_STATUS_MAP: Record<string, SessionStatus> = {
  Active: 'active',
  Completed: 'completed',
  Failed: 'aborted',
  Cancelled: 'aborted',
};

function mapSessionStatus(phase: string | undefined): SessionStatus {
  if (phase !== undefined && phase in SESSION_STATUS_MAP) return SESSION_STATUS_MAP[phase]!;
  return 'active';
}

interface TranscriptIndex {
  /** Transcript items keyed by `spec.sessionRef`. */
  bySession: Map<string, KradleResourceItem>;
}

function buildTranscriptIndex(snapshot: KradleControllerSnapshot): TranscriptIndex {
  const bySession = new Map<string, KradleResourceItem>();
  for (const t of collectionItems(snapshot, 'transcripts')) {
    const ref = asString(spec(t).sessionRef);
    if (ref !== undefined) bySession.set(ref, t);
  }
  return { bySession };
}

function transcriptCost(transcript: KradleResourceItem | undefined): {
  tokenUsage: SimSessionView['tokenUsage'];
  cost: CostRecord;
  messageCount: number;
  transcriptLength: number;
} {
  if (transcript === undefined) {
    return { tokenUsage: { ...EMPTY_TOKENS }, cost: { ...EMPTY_COST }, messageCount: 0, transcriptLength: 0 };
  }
  const sp = spec(transcript);
  const costRaw = asRecord(sp.cost);
  const messages = asArray(sp.messages) ?? [];
  const inputTokens = asNumber(costRaw?.inputTokens) ?? 0;
  const outputTokens = asNumber(costRaw?.outputTokens) ?? 0;
  const thinkingTokens = asNumber(costRaw?.thinkingTokens) ?? 0;
  const cachedTokens = asNumber(costRaw?.cachedTokens) ?? 0;
  const totalUsd = asNumber(costRaw?.totalUsd) ?? 0;
  return {
    tokenUsage: { inputTokens, outputTokens, thinkingTokens, cachedTokens },
    cost: { totalUsd, inputTokens, outputTokens, thinkingTokens },
    messageCount: messages.length,
    transcriptLength: messages.length,
  };
}

function runStackRef(snapshot: KradleControllerSnapshot, runName: string | undefined): string {
  if (runName === undefined) return '';
  const run = collectionItems(snapshot, 'runs').find((r) => r.metadata.name === runName);
  return run !== undefined ? asString(spec(run).agentStack) ?? '' : '';
}

/**
 * Resolve the HONEST display identity of a session (SPEC-KRADLE-MODEL): when the
 * session (or its dispatch run) references an `agentDefinition`/`personaRef`,
 * follow it to the real `AgentPersona` (displayName + appearance.emoji). Returns
 * null when no persona is available — the caller then falls back to the
 * run/session name (never a procedural creature name/emoji in live mode).
 */
function resolveSessionIdentity(
  snapshot: KradleControllerSnapshot,
  session: KradleResourceItem,
  identity: IdentityIndex,
  definitionByName: Map<string, KradleResourceItem>,
): SimAgentPersonaView | null {
  const sp = spec(session);
  // The session may carry the identity directly, or inherit it from its run.
  const runName = asString(sp.dispatchRun);
  const run =
    runName !== undefined
      ? collectionItems(snapshot, 'runs').find((r) => r.metadata.name === runName)
      : undefined;
  const runSpec = run !== undefined ? spec(run) : {};

  const agentDefinitionRef = asString(sp.agentDefinition) ?? asString(runSpec.agentDefinition);
  const personaRef = asString(sp.personaRef) ?? asString(runSpec.personaRef);
  return resolveIdentityForRef(identity, definitionByName, agentDefinitionRef, personaRef);
}

function definitionByNameIndex(
  snapshot: KradleControllerSnapshot,
): Map<string, KradleResourceItem> {
  const out = new Map<string, KradleResourceItem>();
  for (const def of definitionItems(snapshot)) out.set(def.metadata.name, def);
  return out;
}

function mapSessionView(
  snapshot: KradleControllerSnapshot,
  session: KradleResourceItem,
  transcripts: TranscriptIndex,
  stackNameByRef: Map<string, string>,
  identity: IdentityIndex,
  definitionByName: Map<string, KradleResourceItem>,
): SimSessionView {
  const sp = spec(session);
  const lab = labels(session);
  const sessionId = session.metadata.name;
  const dispatchRun = asString(sp.dispatchRun);
  // IDENTITY: prefer the REAL persona (resolved via the session/run's
  // agentDefinition → AgentPersona) — displayName is the honest board identity.
  // Fall back to the session name when no persona is available (NEVER a
  // procedural creature name in live mode). The legacy `commander.a5c.ai/creature`
  // label is honored only as a last resort before the session id.
  const persona = resolveSessionIdentity(snapshot, session, identity, definitionByName);
  const creatureName = persona?.displayName ?? lab[LABEL_CREATURE] ?? sessionId;
  const adapter = narrowAdapter(asString(sp.adapter));
  const model = asString(sp.model) ?? MODELS_BY_ADAPTER[adapter][0] ?? '';
  const role = lab[LABEL_AGENT_ROLE] === 'reviewer'
    ? 'reviewer'
    : lab[LABEL_AGENT_ROLE] === 'integration'
      ? 'integration'
      : 'worker';
  const sessionStatus = mapSessionStatus(statusPhase(session));
  const stackRef = runStackRef(snapshot, dispatchRun);
  const transcript = transcripts.bySession.get(sessionId);
  const cost = transcriptCost(transcript);
  const title = asString(sp.title) ?? `${creatureName} — ${role}`;
  const endedTick = sessionStatus === 'active' ? null : 0;

  return {
    sessionId,
    title,
    creatureName,
    agent: adapter,
    model,
    stackRef,
    stackName: stackNameByRef.get(stackRef) ?? stackRef,
    role,
    coordination: lab[LABEL_COORDINATION] === 'true',
    taskId: dispatchRun ?? '',
    attempt: asNumber(sp.attempt) ?? 1,
    runId: dispatchRun ?? null,
    parentSessionId: lab['commander.a5c.ai/parent-session'] ?? asString(sp.parentSession) ?? null,
    reviewOfSessionId: lab['commander.a5c.ai/review-of'] ?? asString(sp.reviewOfSession) ?? null,
    status: sessionStatus,
    startedTick: 0,
    endedTick,
    turnCount: 0,
    messageCount: cost.messageCount,
    tokenUsage: cost.tokenUsage,
    cost: cost.cost,
    transcriptLength: cost.transcriptLength,
  };
}

/** §2.2 `listSessions(taskId?)`. Filtered by `spec.dispatchRun`; newest-first. */
export function mapSessions(snapshot: KradleControllerSnapshot, taskId?: string): SimSessionView[] {
  const transcripts = buildTranscriptIndex(snapshot);
  const stackNameByRef = new Map(mapStacks(snapshot).map((s) => [s.stackRef, s.name]));
  const identity = buildIdentityIndex(snapshot);
  const definitionByName = definitionByNameIndex(snapshot);
  const sessions = collectionItems(snapshot, 'sessions');

  interface Built {
    view: SimSessionView;
    sortKey: number;
    seq: number;
  }
  const built: Built[] = [];
  let seq = 0;
  for (const session of sessions) {
    if (taskId !== undefined && sessionDispatchRun(session) !== taskId) {
      seq += 1;
      continue;
    }
    built.push({
      view: mapSessionView(snapshot, session, transcripts, stackNameByRef, identity, definitionByName),
      sortKey: creationMs(session) ?? seq,
      seq,
    });
    seq += 1;
  }
  // Newest-first by creationTimestamp (fallback insertion order).
  built.sort((a, b) => b.sortKey - a.sortKey || b.seq - a.seq);
  return built.map((b) => b.view);
}

const TRANSCRIPT_KIND_MAP: Record<string, SimSessionTranscriptEntry['kind']> = {
  user: 'user',
  assistant: 'message',
  system: 'event',
  tool: 'tool_call',
};

/** §2.2 `getSession(sessionId)` → record + transcript entries. */
export function mapSessionDetail(
  snapshot: KradleControllerSnapshot,
  sessionId: string,
): SimSessionDetailView | null {
  const session = collectionItems(snapshot, 'sessions').find((s) => s.metadata.name === sessionId);
  if (session === undefined) return null;
  const transcripts = buildTranscriptIndex(snapshot);
  const stackNameByRef = new Map(mapStacks(snapshot).map((s) => [s.stackRef, s.name]));
  const identity = buildIdentityIndex(snapshot);
  const definitionByName = definitionByNameIndex(snapshot);
  const record = mapSessionView(snapshot, session, transcripts, stackNameByRef, identity, definitionByName);

  const transcriptItem = transcripts.bySession.get(sessionId);
  const messages = transcriptItem !== undefined ? asArray(spec(transcriptItem).messages) ?? [] : [];
  const transcript: SimSessionTranscriptEntry[] = messages.map((raw, index) => {
    const msg = asRecord(raw) ?? {};
    const role = asString(msg.role) ?? 'assistant';
    const kind = TRANSCRIPT_KIND_MAP[role] ?? 'message';
    const entry: SimSessionTranscriptEntry = {
      seq: index,
      tick: 0,
      timestamp: isoToMs(msg.timestamp) ?? 0,
      kind,
      text: asString(msg.content) ?? '',
    };
    const toolName = asString(msg.toolName);
    if (toolName !== undefined) entry.toolName = toolName;
    return entry;
  });
  return { record, transcript };
}

// ---------------------------------------------------------------------------
// §2.5 — KradleWorkspace → SimWorkspaceView / SimWorkspaceSummaryView (AC13)
// ---------------------------------------------------------------------------

/** §2.5 `getWorkspaceView(taskId)`. `files`/`testEvidence` documented-empty. */
export function mapWorkspaceView(
  snapshot: KradleControllerSnapshot,
  taskId: string,
): SimWorkspaceView | null {
  const run = collectionItems(snapshot, 'runs').find((r) => r.metadata.name === taskId);
  if (run === undefined) return null;
  const workspaceRef = asString(spec(run).workspaceRef);
  const ws = workspaceRef !== undefined ? workspacesByName(snapshot).get(workspaceRef) : undefined;

  const approvals = buildApprovalIndex(snapshot);
  const reviewerNotes = (approvals.byRun.get(taskId) ?? [])
    .map((a) => asString(status(a).feedback))
    .filter((f): f is string => f !== undefined);

  return {
    taskId,
    phase: ws !== undefined ? mapWorkspacePhase(statusPhase(ws)) : 'missing',
    gitStatus: ws !== undefined ? workspaceGitStatus(ws) : { branch: 'main', headSha: '', dirty: false },
    files: [],
    testEvidence: { status: 'unknown' },
    reviewerNotes,
  };
}

/** §2.5 `listWorkspaces()`. One row per KradleWorkspace. */
export function mapWorkspaces(snapshot: KradleControllerSnapshot): SimWorkspaceSummaryView[] {
  const cards = mapCards(snapshot);
  const wsItems = collectionItems(snapshot, 'workspaces');
  const activeByRun = activeSessionsByRun(snapshot);

  return wsItems.map((ws) => {
    const name = ws.metadata.name;
    const gitStatus = workspaceGitStatus(ws);
    const phase = mapWorkspacePhase(statusPhase(ws));
    const cardsForWs = cards.filter((c) => c.workspaceId === name);
    const cardIds = cardsForWs.map((c) => c.taskId);
    const cardGit: SimWorkspaceCardGitView[] = cardsForWs.map((c) => ({
      taskId: c.taskId,
      title: c.title,
      branch: gitStatus.branch,
      headSha: gitStatus.headSha,
      dirty: gitStatus.dirty,
      dirtyFileCount: c.dirtyFileCount,
    }));
    const activeSessionIds = cardsForWs.flatMap((c) =>
      (activeByRun.get(c.taskId) ?? []).map((s) => s.metadata.name),
    );
    return {
      workspaceId: name,
      name,
      repository: asString(spec(ws).repository) ?? '',
      phase,
      gitStatus: cardsForWs.length > 0 ? gitStatus : null,
      dirty: gitStatus.dirty,
      cardIds,
      cards: cardGit,
      activeSessionIds,
    };
  });
}

// ---------------------------------------------------------------------------
// §2.6 — memory → SimMemoryIOView + silos (AC13)
// ---------------------------------------------------------------------------

function repoFromRecordId(id: string): string {
  const colon = id.indexOf(':');
  return colon > 0 ? id.slice(0, colon) : id;
}

/**
 * §2.6 `getMemoryIO(ref)`. `read[]` from the memory-query result; `written[]`
 * from `model.agents.memoryImports.items` / AgentMemoryUpdate records whose
 * `spec.sourceRun === ref`. Empty (never throws) when the query is unavailable.
 */
export function mapMemoryIO(
  snapshot: KradleControllerSnapshot,
  ref: string,
  memoryResult: GraphQueryResult | undefined,
): SimMemoryIOView {
  const read: SimMemoryReadEntry[] = (memoryResult?.matches ?? []).map((match) => ({
    recordId: match.record.id,
    kind: match.record.nodeKind,
    silo: repoFromRecordId(match.record.id),
    tick: 0,
    unitId: ref,
  }));

  const written: SimMemoryWriteEntry[] = [];
  const imports = [
    ...collectionItems(snapshot, 'memoryImports'),
    ...resourceItemsByKind(snapshot, 'AgentMemoryUpdate'),
  ];
  for (const item of imports) {
    const sp = spec(item);
    if (asString(sp.sourceRun) !== ref) continue;
    const changesRaw = asArray(sp.changes) ?? [];
    const changes = changesRaw.map((c) => {
      const rec = asRecord(c) ?? {};
      return {
        path: asString(rec.path) ?? '',
        action: asString(rec.action) ?? 'modify',
        reason: asString(rec.reason) ?? '',
      };
    });
    written.push({
      updateId: item.metadata.name,
      silo: asString(sp.memoryRepository) ?? '',
      changes,
      phase: statusPhase(item) ?? 'Pending',
      tick: 0,
      unitId: ref,
    });
  }

  return { read, written };
}

/** §2.6 memory silos from `model.agents.memoryRepositories.items`. */
export function mapSilos(snapshot: KradleControllerSnapshot): SimMemorySiloView[] {
  return collectionItems(snapshot, 'memoryRepositories').map((repo) => {
    const st = status(repo);
    return {
      name: repo.metadata.name,
      phase: ((): SimMemorySiloView['phase'] => {
        // The real CRD resource phase is [Pending,Ready,Blocked,Error].
        const phase = statusPhase(repo);
        return phase === 'Ready' ||
          phase === 'Pending' ||
          phase === 'Blocked' ||
          phase === 'Error'
          ? phase
          : 'Ready';
      })(),
      currentCommit: asString(st.currentCommit) ?? '',
      recordCount: 0,
      owner: asString(spec(repo).repositoryRef) ?? '',
      recordIds: [],
    };
  });
}

/** Map a broad memory query result to `GraphRecord[]` for the Archive. */
export function mapMemoryRecords(memoryResult: GraphQueryResult | undefined): GraphRecord[] {
  return (memoryResult?.matches ?? []).map((m) => m.record);
}

// ---------------------------------------------------------------------------
// §2.7 — process templates: REAL AgentProcessTemplate + honest fallback
// ---------------------------------------------------------------------------

/**
 * `listProcessTemplates()` — one template per `TaskKind`. For task kinds that
 * have a REAL `AgentProcessTemplate` CRD, the returned phases/processId/revision
 * come from the persisted resource (so the RunsOverlay editor edits something
 * that can actually persist). For task kinds with NO `AgentProcessTemplate`, we
 * fall back HONESTLY to the hardcoded `PHASES_BY_KIND` constant with the
 * synthetic `commander/<kind>@v1` process id and revision 1 — never claiming the
 * fallback is a persisted template.
 */
export function mapProcessTemplates(
  snapshot: KradleControllerSnapshot,
): SimProcessTemplateView[] {
  const templateIndex = buildProcessTemplateIndex(snapshot);
  return TASK_KINDS.map((kind) => {
    const real = templateIndex.get(kind);
    if (real !== undefined) {
      return {
        kind,
        processId: real.processId,
        revision: real.revision,
        phases: [...real.phases],
      };
    }
    return {
      kind,
      processId: processIdFor(kind),
      revision: 1,
      phases: [...PHASES_BY_KIND[kind]],
    };
  });
}

// ---------------------------------------------------------------------------
// §6.2 — kradle → TickCommitInput board halves
// ---------------------------------------------------------------------------

function mapActiveAgentView(
  snapshot: KradleControllerSnapshot,
  session: KradleResourceItem,
  stackNameByRef: Map<string, string>,
  transcripts: TranscriptIndex,
  identity: IdentityIndex,
  definitionByName: Map<string, KradleResourceItem>,
  nowMs: number,
): SimAgentView {
  const sp = spec(session);
  const lab = labels(session);
  const dispatchRun = asString(sp.dispatchRun);
  const adapter = narrowAdapter(asString(sp.adapter));
  const model = asString(sp.model) ?? MODELS_BY_ADAPTER[adapter][0] ?? '';
  const stackRef = runStackRef(snapshot, dispatchRun);
  const role = lab[LABEL_AGENT_ROLE] === 'reviewer'
    ? 'reviewer'
    : lab[LABEL_AGENT_ROLE] === 'integration'
      ? 'integration'
      : 'worker';
  const cost = transcriptCost(transcripts.bySession.get(session.metadata.name));
  // IDENTITY (live): the resolved persona displayName, else an honest fallback
  // to the session name (never a procedural creature).
  const persona = resolveSessionIdentity(snapshot, session, identity, definitionByName);
  return {
    unitId: session.metadata.name,
    agent: adapter,
    model,
    creatureName: persona?.displayName ?? lab[LABEL_CREATURE] ?? session.metadata.name,
    stackRef,
    stackName: stackNameByRef.get(stackRef) ?? stackRef,
    role,
    taskId: dispatchRun ?? '',
    state: 'thinking',
    paused: false,
    runId: dispatchRun ?? '',
    pendingHookId: null,
    heldPieces: [],
    tokenUsage: cost.tokenUsage,
    cost: cost.cost,
    turnCount: 0,
    messageCount: cost.messageCount,
    createdAt: creationMs(session) ?? nowMs,
    updatedAt: nowMs,
  };
}

const TASK_STATE_MAP: Record<string, SimTaskState> = {
  Running: 'in_progress',
  Succeeded: 'done',
  Failed: 'failed',
  Cancelled: 'failed',
  Pending: 'queued',
  Queued: 'queued',
  AwaitingApproval: 'review',
};

function mapTaskState(phase: string | undefined): SimTaskState {
  const canon = canonicalRunPhase(phase);
  if (canon !== undefined && canon in TASK_STATE_MAP) return TASK_STATE_MAP[canon]!;
  return 'queued';
}

function mapTaskView(run: KradleResourceItem): SimTaskView {
  const sp = spec(run);
  const phase = statusPhase(run);
  const taskKind = narrowTaskKind(asString(sp.taskKind));
  // Project the run lifecycle phase to the 4-value resource phase the
  // SimTaskView row carries ([Pending,Ready,Blocked,Error]).
  const kradlePhase: KradleResourcePhase =
    phase === 'Succeeded' || phase === 'succeeded'
      ? 'Ready'
      : phase === 'Failed' ||
          phase === 'failed' ||
          phase === 'Cancelled' ||
          phase === 'cancelled'
        ? 'Error'
        : 'Pending';
  return {
    taskId: run.metadata.name,
    taskKind,
    repository: asString(sp.repository) ?? '',
    workspaceId: asString(sp.workspaceRef) ?? '',
    title: asString(sp.title) ?? asString(asRecord(sp.sourceRefs)?.pullRequest) ?? run.metadata.name,
    state: mapTaskState(phase),
    phase: kradlePhase,
    progress: runStatusProgress(run) ?? runProgress(phase),
    assigneeIds: [],
    priority: asNumber(sp.priority) ?? 0,
  };
}

function mapUnitView(
  session: KradleResourceItem,
  transcripts: TranscriptIndex,
  nowMs: number,
): SimUnitView {
  const sp = spec(session);
  const dispatchRun = asString(sp.dispatchRun);
  const adapter = narrowAdapter(asString(sp.adapter));
  const model = asString(sp.model) ?? MODELS_BY_ADAPTER[adapter][0] ?? '';
  const cost = transcriptCost(transcripts.bySession.get(session.metadata.name));
  return {
    unitId: session.metadata.name,
    agent: adapter,
    model,
    title: asString(sp.title) ?? session.metadata.name,
    workspaceId: '',
    state: 'thinking',
    paused: false,
    taskId: dispatchRun ?? null,
    runId: dispatchRun ?? null,
    turnIndex: 0,
    turnCount: 0,
    messageCount: cost.messageCount,
    pendingHookId: null,
    tokenUsage: cost.tokenUsage,
    cost: cost.cost,
    createdAt: creationMs(session) ?? nowMs,
    updatedAt: nowMs,
  };
}

function mapHookViews(snapshot: KradleControllerSnapshot, nowMs: number): SimHookView[] {
  const approvals = buildApprovalIndex(snapshot);
  const activeByRun = activeSessionsByRun(snapshot);
  const out: SimHookView[] = [];
  for (const [runName, pending] of approvals.pendingByRun) {
    const unit = activeByRun.get(runName)?.[0]?.metadata.name ?? '';
    for (const approval of pending) {
      const action = asRecord(spec(approval).action);
      const summary = asString(action?.summary) ?? 'Approval requested';
      out.push({
        hookRequestId: approval.metadata.name,
        runId: runName,
        unitId: unit,
        hookKind: asString(action?.type) ?? 'breakpoint',
        payload: {
          taskId: runName,
          question: summary,
          options: [
            { id: 'approve', caption: 'Approve' },
            { id: 'deny', caption: 'Deny' },
          ],
        },
        deadlineTs: nowMs + DEFAULT_INQUIRY_MS,
      });
    }
  }
  return out;
}

function mapInquiryViews(snapshot: KradleControllerSnapshot, nowMs: number): TickInquiry[] {
  const approvals = buildApprovalIndex(snapshot);
  const activeByRun = activeSessionsByRun(snapshot);
  const out: TickInquiry[] = [];
  for (const [runName, pending] of approvals.pendingByRun) {
    const unit = activeByRun.get(runName)?.[0]?.metadata.name ?? '';
    for (const approval of pending) {
      const action = asRecord(spec(approval).action);
      const summary = asString(action?.summary) ?? 'Approval requested';
      out.push({
        hookRequestId: approval.metadata.name,
        runId: runName,
        taskId: runName,
        unitId: unit,
        inquiryKind: 'tool-approval',
        question: summary,
        options: [
          { id: 'approve', caption: 'Approve', tone: 'primary' },
          { id: 'deny', caption: 'Deny', tone: 'danger' },
        ],
        deadlineTs: nowMs + DEFAULT_INQUIRY_MS,
      });
    }
  }
  return out;
}

/** The §6.2 inquiry view shape (matches `SimInquiryView` without importing it directly). */
interface TickInquiry {
  hookRequestId: string;
  runId: string;
  taskId: string;
  unitId: string;
  inquiryKind: 'tool-approval';
  question: string;
  options: Array<{ id: string; caption: string; tone?: 'normal' | 'danger' | 'primary' }>;
  deadlineTs: number;
}

/**
 * The board-half payload the boot layer feeds into `commitTick` (§4). The
 * invented roster is REMOVED (SPEC §2.4/§5.2): the boot layer passes
 * `rosterAgents: []` literally into `commitTick` until the store slice is
 * removed in the UI phase.
 */
export interface KradleTickInput {
  cards: SimCardView[];
  agents: SimAgentView[];
  units: SimUnitView[];
  tasks: SimTaskView[];
  hooks: SimHookView[];
  inquiries: TickInquiry[];
  runStages: Record<string, string | null>;
  /** SPEC-KRADLE-MODEL — the real agent identities (`AgentPersona`). */
  personas: SimAgentPersonaView[];
  /** SPEC-KRADLE-MODEL — the real agent definitions (`AgentDefinition`). */
  definitions: SimAgentDefinitionView[];
}

/**
 * §4 `mapToTickInput(snapshot, nowMs)`. Builds the kradle-owned board halves
 * for one `commitTick`. `frames` stays empty (the gateway owns it) and the boot
 * layer supplies `rosterAgents: []` (roster removed) — the boot layer assembles
 * the full `TickCommitInput` (additive merge; neither producer writes the
 * other's slice).
 */
export function mapToTickInput(snapshot: KradleControllerSnapshot, nowMs: number): KradleTickInput {
  const cards = mapCards(snapshot);
  const transcripts = buildTranscriptIndex(snapshot);
  const stackNameByRef = new Map(mapStacks(snapshot).map((s) => [s.stackRef, s.name]));
  const identity = buildIdentityIndex(snapshot);
  const definitionByName = definitionByNameIndex(snapshot);

  const activeSessions = collectionItems(snapshot, 'sessions').filter(isActiveSession);
  const agents = activeSessions.map((s) =>
    mapActiveAgentView(snapshot, s, stackNameByRef, transcripts, identity, definitionByName, nowMs),
  );
  const units = activeSessions.map((s) => mapUnitView(s, transcripts, nowMs));
  const tasks = collectionItems(snapshot, 'runs').map((r) => mapTaskView(r));
  const hooks = mapHookViews(snapshot, nowMs);
  const inquiries = mapInquiryViews(snapshot, nowMs);

  const runStages: Record<string, string | null> = {};
  for (const card of cards) {
    if (card.agentIds.length === 0) continue;
    const observation = mapRunObservation(snapshot, card.taskId);
    runStages[card.taskId] = observation?.phases.find((p) => p.status === 'current')?.label ?? null;
  }

  return {
    cards,
    agents,
    units,
    tasks,
    hooks,
    inquiries,
    runStages,
    personas: mapAgentPersonas(snapshot),
    definitions: mapAgentDefinitions(snapshot),
  };
}

// ---------------------------------------------------------------------------
// §4.2 — buildSimViews: the SimViews surface over a cached snapshot + memory.
// ---------------------------------------------------------------------------

/** A lazily-populated memory cache the SimViews close over (§2.6, per snapshot gen). */
export interface MemoryCache {
  /** Per-`ref` memory-query result for `getMemoryIO(ref)`. */
  ioByRef: Map<string, GraphQueryResult>;
  /** The broad Archive query result (`query.text:''`, graph-only). */
  archive?: GraphQueryResult;
}

export function createMemoryCache(): MemoryCache {
  return { ioByRef: new Map() };
}

/** Memory-query node-kind list used by the broad Archive query (§2.6). */
export const ARCHIVE_QUERY_KINDS: MemoryNodeKind[] = [];

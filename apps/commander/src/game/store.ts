/**
 * Single Zustand store (SPEC §6 as amended by SPEC-V3) with slices:
 *   - world: active agents (UnitEntity, transcript-bearing) + v1-compat task
 *     views (SelectionPanel/CommandCard consumers)
 *   - board: the kanban surface (SimCardView/SimAgentView/SimInquiryView
 *     committed per tick batch, §V3-1) + the static memory graph (§V2-3)
 *   - selection: ordered entityId[] (card taskIds and agent unitIds)
 *   - events: ring buffer (≤500) of ticker entries {id, ts, severity, text, entityId?}
 *   - alerts: pending inquiries {hookRequestId, runId, unitId, kind, payload, deadlineTs}
 *   - meta: resources snapshot, sim clock, overlay state, card-move animation
 *     registry (`is-moving` lifecycle, §V3-3)
 *
 * RETIRED by V3 (with the map canvas): camera, world positions/layout, rally
 * points, marquee, targeting modes, pings, control groups, idle-cycle.
 *
 * One store commit per sim tick batch: `bindBackendToStore` buffers
 * ServerFrames and flushes them together with the sim views in a single
 * `commitTick` setState (SPEC §6, §14, §V3-7).
 *
 * Determinism (AC13/AC33): everything committed during a tick derives from
 * the sim (frames + views + sim clock) — never Date.now() or Math.random().
 */

import { createStore, type StoreApi } from 'zustand/vanilla';

import type {
  HookRequestFrame,
  RunEventFrame,
  ServerFrame,
} from '../contracts/gateway-protocol';
import type { GraphRecord } from '../contracts/kradle-memory';
import type { MockBackend } from '../backend/mock/mockBackend';
import type {
  ColumnId,
  SimAgentView,
  SimCardView,
  SimHookView,
  SimInquiryView,
  SimMemorySiloView,
  SimRosterAgentView,
  SimTaskView,
  SimUnitView,
  UpdateTaskPatch,
} from '../backend/mock/simulation';
import type { KradleAgentStackInput } from '../contracts/kradle-stack';
import type { TaskKind } from '../backend/mock/scenario';
import { CARD_SUPPORTED_TABS, defaultInspectorCardTab } from './sessions';

// ---------------------------------------------------------------------------
// Entity & slice types (SPEC §6 / SPEC-V3)
// ---------------------------------------------------------------------------

export const COMMANDER_VERSION = '0.4.0-board';

/** Assumed context window per agent (tokens) → health bar = context headroom. */
export const CONTEXT_WINDOW_TOKENS = 200_000;
/** Assumed token budget per agent (USD) → energy bar = budget remaining. */
export const UNIT_BUDGET_USD = 2.5;

/**
 * Ring buffer cap (SPEC §6, raised for V4): the frozen v3/v4 ticker probes
 * index into the rendered list (`tickerTexts().slice(before)`), so the ring
 * must not roll over within a single scenario's event volume (§V4-4 pacing
 * roughly doubles tick counts per scenario).
 */
export const EVENT_RING_CAP = 2000;
/** Transcript entries kept per agent (Inspector stream). */
const TRANSCRIPT_CAP = 100;
/** Memory transfer pulse lifetime in sim milliseconds (§V2-3). */
const PULSE_TTL_MS = 5_000;
const PULSE_CAP = 24;

export type TickerSeverity = 'info' | 'success' | 'warn' | 'alert';

export interface TickerEntry {
  id: string;
  ts: number;
  severity: TickerSeverity;
  text: string;
  entityId?: string;
}

export interface AlertEntry {
  hookRequestId: string;
  runId: string;
  unitId: string;
  kind: string;
  payload: Record<string, unknown>;
  deadlineTs: number;
}

export interface TranscriptEntry {
  id: string;
  kind: 'turn' | 'text' | 'thinking' | 'tool' | 'note';
  text: string;
  /** Tool-call entries: tool name (Inspector renders name + duration). */
  toolName?: string;
  /** Tool-result entries: execution duration in ms. */
  durationMs?: number;
  /** Tool entry lifecycle (running → done | failed). */
  toolStatus?: 'running' | 'done' | 'failed';
}

export interface UnitEntity {
  kind: 'unit';
  id: string;
  /** Serializable sim view (v1-compat lifecycle surface of an ACTIVE agent). */
  view: SimUnitView;
  /** Context window usage 0..1 (health bar = 1 - contextPct). */
  contextPct: number;
  /** Budget remaining 0..1 (energy bar). */
  energyPct: number;
  /** Inspector transcript stream (capped). */
  transcript: TranscriptEntry[];
  /** Monotonic transcript id counter (survives ring-cap slicing). */
  transcriptSeq: number;
}

export interface TaskEntity {
  kind: 'task';
  id: string;
  view: SimTaskView;
}

export interface WorldSlice {
  units: Record<string, UnitEntity>;
  /** Sorted unit ids (stable render order). */
  unitIds: string[];
  tasks: Record<string, TaskEntity>;
  /** Sorted task ids (stable render order). */
  taskIds: string[];
  /** runId → unitId (resolves run-scoped adapter events to agents). */
  runToUnit: Record<string, string>;
}

/** Board card entity: the V3 view + the live babysitter run stage (§V2-5). */
export interface BoardCardEntity {
  id: string;
  view: SimCardView;
  runStage: string | null;
}

export interface BoardMemory {
  silos: SimMemorySiloView[];
  records: GraphRecord[];
}

/**
 * A resolved inquiry kept for the owning agent's Inspector transcript
 * (SPEC-V3 §V3-5: "resolved state shows the chosen caption + icon").
 */
export interface ResolvedInquiry {
  hookRequestId: string;
  unitId: string;
  taskId: string;
  question: string;
  optionId: string;
  caption: string;
  tone?: 'normal' | 'danger' | 'primary';
}

/** Resolved-inquiry history kept per agent (transcript inline bubbles). */
const RESOLVED_INQUIRY_CAP = 12;

export interface BoardSlice {
  cards: Record<string, BoardCardEntity>;
  /** Sorted card ids (stable iteration; lanes re-sort by order, §V3-1). */
  cardIds: string[];
  agents: Record<string, SimAgentView>;
  agentIds: string[];
  inquiries: SimInquiryView[];
  /** unitId → resolved inquiries (newest last, capped — §V3-5 transcript). */
  resolvedInquiries: Record<string, ResolvedInquiry[]>;
  /** Static memory graph (silos + records, §V2-3 Archive overlay). */
  memory: BoardMemory;
  /**
   * taskId → memory record ids its agents have drawn (accumulated from
   * memory_query events; survives worker despawn so the Archive can keep
   * highlighting a selected card's pieces, §V2-3/AC18).
   */
  heldByCard: Record<string, string[]>;
  /** Named assignable workers/reviewers (roster agents). */
  rosterAgents: SimRosterAgentView[];
}

export interface SelectionSlice {
  /** Ordered selection (cards and/or agents). */
  ids: string[];
}

export interface ResourcesSnapshot {
  unitCount: number;
  busyCount: number;
  idleCount: number;
  tokensBurned: number;
  costUsd: number;
  tasksDone: number;
  tasksTotal: number;
  alertCount: number;
}

/** §V3-3 auto-move animation registry entry (`is-moving` e2e hook). */
export interface CardMove {
  from: ColumnId;
  to: ColumnId;
  reason: string;
  seq: number;
  /** v5-r0 (§V4-1): release-train wagon index — drives the FLIP glide delay. */
  stagger: number;
}

/** §V2-3 live memory-transfer pulse (Archive overlay animation source). */
export interface MemoryPulse {
  id: string;
  kind: 'query' | 'update';
  silo: string;
  recordIds: string[];
  unitId: string | null;
  ts: number;
}

/** Inspector tab ids (SPEC-V2 §V2-5/§V2-7 as amended by SPEC-V4 §V4-7/§V4-9 and SPEC-V5 §V5-2). */
export type InspectorTab = 'transcript' | 'sessions' | 'process' | 'workspace' | 'memory' | 'terminal';

export interface MetaSlice {
  resources: ResourcesSnapshot;
  /** §V4-4 sim speed multiplier mirror (0.5 | 1 | 2) — TopBar speed control. */
  speed: number;
  simTimeMs: number;
  simStartMs: number;
  tickIndex: number;
  connection: 'connecting' | 'connected' | 'disconnected';
  paused: boolean;
  viewport: { width: number; height: number };
  inspectorUnitId: string | null;
  /**
   * Inspector opened directly on a CARD (agent-less, SPEC-V2 §V2-5 under V3).
   * Mutually exclusive with `inspectorUnitId`.
   */
  inspectorTaskId: string | null;
  /** Active Inspector tab — externally settable (Open Diff intent, §V2-2). */
  inspectorTab: InspectorTab;
  /** Human-review side panel target (SPEC-V3 §V3-4). */
  reviewTaskId: string | null;
  /** §V4-5 card editor target (the parchment form dialog); null = closed. */
  cardEditorTaskId: string | null;
  /** Space-key pulse counter — the Inquiry Dock scrolls into view + flashes. */
  dockPulse: number;
  steerOpen: boolean;
  /** The Foundry dialog (§V2-6 — Commission Task only under V3). */
  foundryOpen: boolean;
  /** The Archive overlay (§V2-3). */
  archiveOpen: boolean;
  /**
   * §V4-9 Archive deep-link: record id to focus+select when the overlay
   * opens from a Memory I/O piece (null = no pending deep-link).
   */
  archiveFocusId: string | null;
  /** The Runs ledger overlay (§V4-6 — top Esc tier with foundry/archive). */
  runsOpen: boolean;
  /**
   * §V5-3 Runs deep-link: a registry run link opens the Runs overlay
   * directly on this run's detail (null = open on the ledger list).
   */
  runsFocusRunId: string | null;
  /** §V5-3 the Registry ledger overlay (top Esc tier, below runs). */
  registryOpen: boolean;
  /**
   * §V5-3/§V5-4 Registry stack-detail deep-link: when set, the overlay opens
   * directly on this stack's detail (sel-stack-link / Inspector stack chip).
   * null = the overlay opens on the stacks list.
   */
  registryStackRef: string | null;
  /** §V5-3 Foundry landing tab ("open in Foundry" → Stacks; default Commission). */
  foundryTab: 'commission' | 'stacks' | 'agents';
  /** §V4-11 web IDE overlay target (full-screen plate); null = closed. */
  ideTaskId: string | null;
  /** taskId → in-flight automatic move (cleared by the board after the glide). */
  movingCards: Record<string, CardMove>;
  moveSeq: number;
  memoryPulses: MemoryPulse[];
  pulseSeq: number;
  eventSeq: number;
  version: string;
}

export interface TickCommitInput {
  frames: ServerFrame[];
  units: SimUnitView[];
  tasks: SimTaskView[];
  hooks: SimHookView[];
  cards: SimCardView[];
  agents: SimAgentView[];
  inquiries: SimInquiryView[];
  /** taskId → current babysitter phase label (active cards only, §V2-5). */
  runStages: Record<string, string | null>;
  rosterAgents: SimRosterAgentView[];
  nowMs: number;
  tickIndex: number;
  paused: boolean;
}

export interface CommanderState {
  world: WorldSlice;
  board: BoardSlice;
  selection: SelectionSlice;
  events: TickerEntry[];
  alerts: AlertEntry[];
  meta: MetaSlice;

  // --- tick ingestion -------------------------------------------------------
  commitTick(input: TickCommitInput): void;

  // --- selection ------------------------------------------------------------
  select(ids: string[]): void;
  clickSelect(id: string, shift: boolean): void;
  clearSelection(): void;
  /** Esc: foundry/archive → review panel → steer modal → inspector → selection (§V3-7). */
  escape(): void;
  /** Space: select the latest alert's card so the operator lands on it. */
  jumpToLatestAlert(): void;

  // --- transient UI ---------------------------------------------------------
  setViewport(size: { width: number; height: number }): void;
  openInspector(unitId: string): void;
  /** Open the Inspector on a CARD (§V5-2 default-tab policy: Sessions for agent-less review-and-beyond cards, else Process). */
  openInspectorCard(taskId: string): void;
  /** §V5-2/§V5-4 deep-link: open the Inspector on a card's SESSIONS tab (review-panel chip, sel-session-link). */
  openInspectorSessions(taskId: string): void;
  /** §V5-4: open the Registry overlay directly on a stack's detail (sel-stack-link, Inspector stack chip). */
  openRegistryStack(stackRef: string): void;
  /** §V5-3: open/close the Registry ledger overlay (TopBar button; opens on the stacks list). */
  openRegistry(): void;
  closeRegistry(): void;
  /** §V5-3: open the Runs overlay directly on a run's detail (registry run links). */
  openRunsAt(runId: string): void;
  /** §V5-3: open the Foundry on its STACKS tab (registry "open in Foundry"). */
  openFoundryStacks(): void;
  closeInspector(): void;
  /** Switch the Inspector tab (externally settable — Open Diff, §V2-2). */
  setInspectorTab(tab: InspectorTab): void;
  /** Space: pulse the Inquiry Dock (scroll into view + highlight, §V3-5). */
  pulseDock(): void;
  /** Record a resolved inquiry for the owning agent's transcript (§V3-5). */
  recordResolvedInquiry(entry: ResolvedInquiry): void;
  /** Open/close the human-review side panel for a card (SPEC-V3 §V3-4). */
  openReview(taskId: string): void;
  closeReview(): void;
  /** Open/close the §V4-5 card-editor dialog for a card. */
  openCardEditor(taskId: string): void;
  closeCardEditor(): void;
  openSteer(): void;
  closeSteer(): void;
  openFoundry(): void;
  closeFoundry(): void;
  openArchive(): void;
  closeArchive(): void;
  /** §V4-9: open the Archive focused on a node (closes the Inspector). */
  openArchiveAt(recordId: string | null): void;
  /** §V4-6: open/close the Runs ledger overlay. */
  openRuns(): void;
  closeRuns(): void;
  /** §V4-11: open/close the web IDE overlay for a card's workspace. */
  openIde(taskId: string): void;
  closeIde(): void;
  /** The board calls this when a card's §V3-3 glide animation finishes. */
  clearMoving(taskId: string): void;
  setMemory(memory: BoardMemory): void;
  setPaused(paused: boolean): void;
  /** §V4-4: mirror the sim speed multiplier (TopBar label re-render). */
  setSimSpeed(speed: number): void;
  pushEvent(text: string, severity: TickerSeverity, entityId?: string): void;
}

export type CommanderStore = StoreApi<CommanderState>;

// ---------------------------------------------------------------------------
// Pure selection helpers (unit-tested)
// ---------------------------------------------------------------------------

export function applyClickSelection(current: readonly string[], id: string, shift: boolean): string[] {
  if (!shift) return [id];
  return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
}

export function sameSelectionSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

// ---------------------------------------------------------------------------
// Tick reduction internals
// ---------------------------------------------------------------------------

const BUSY_STATES = new Set([
  'dispatching',
  'thinking',
  'tool_running',
  'awaiting_approval',
  'blocked',
]);

function tokenTotal(view: SimUnitView): number {
  const t = view.tokenUsage;
  return t.inputTokens + t.outputTokens + t.thinkingTokens;
}

function unitViewEqual(a: SimUnitView, b: SimUnitView): boolean {
  return (
    a.unitId === b.unitId &&
    a.agent === b.agent &&
    a.model === b.model &&
    a.title === b.title &&
    a.workspaceId === b.workspaceId &&
    a.state === b.state &&
    a.paused === b.paused &&
    a.taskId === b.taskId &&
    a.runId === b.runId &&
    a.turnIndex === b.turnIndex &&
    a.turnCount === b.turnCount &&
    a.messageCount === b.messageCount &&
    a.pendingHookId === b.pendingHookId &&
    a.tokenUsage.inputTokens === b.tokenUsage.inputTokens &&
    a.tokenUsage.outputTokens === b.tokenUsage.outputTokens &&
    a.tokenUsage.thinkingTokens === b.tokenUsage.thinkingTokens &&
    a.tokenUsage.cachedTokens === b.tokenUsage.cachedTokens &&
    a.cost.totalUsd === b.cost.totalUsd &&
    a.updatedAt === b.updatedAt
  );
}

function taskViewEqual(a: SimTaskView, b: SimTaskView): boolean {
  return (
    a.taskId === b.taskId &&
    a.taskKind === b.taskKind &&
    a.repository === b.repository &&
    a.workspaceId === b.workspaceId &&
    a.title === b.title &&
    a.state === b.state &&
    a.phase === b.phase &&
    a.progress === b.progress &&
    a.priority === b.priority &&
    a.assigneeIds.length === b.assigneeIds.length &&
    a.assigneeIds.every((id, i) => b.assigneeIds[i] === id)
  );
}

function cardViewEqual(a: SimCardView, b: SimCardView): boolean {
  return (
    a.taskId === b.taskId &&
    a.taskKind === b.taskKind &&
    a.title === b.title &&
    a.column === b.column &&
    a.order === b.order &&
    a.yolo === b.yolo &&
    a.merged === b.merged &&
    a.progress === b.progress &&
    a.parentId === b.parentId &&
    a.attempt === b.attempt &&
    a.feedback === b.feedback &&
    a.dirtyFileCount === b.dirtyFileCount &&
    a.hasPendingInquiry === b.hasPendingInquiry &&
    a.workerAgentId === b.workerAgentId &&
    a.reviewerAgentId === b.reviewerAgentId &&
    a.humanAssigneeId === b.humanAssigneeId &&
    a.childIds.length === b.childIds.length &&
    a.childIds.every((id, i) => b.childIds[i] === id) &&
    a.agentIds.length === b.agentIds.length &&
    a.agentIds.every((id, i) => b.agentIds[i] === id)
  );
}

interface CardMoveSource {
  taskId: string;
  from: ColumnId;
  to: ColumnId;
  reason: string;
  /** v5-r0: explicit release-train wagon index from the card_moved payload. */
  stagger: number;
}

interface PulseSource {
  kind: 'query' | 'update';
  silo: string;
  recordIds: string[];
  unitId: string | null;
  taskId: string | null;
  ts: number;
}

interface FrameRouting {
  tickerEntries: Array<Omit<TickerEntry, 'id'>>;
  /** unitId → appended transcript entries (without ids). */
  transcriptOps: Map<string, Array<Omit<TranscriptEntry, 'id'>>>;
  cardMoves: CardMoveSource[];
  pulses: PulseSource[];
  runToUnit: Record<string, string>;
  connected: boolean;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Route a batch of ServerFrames into ticker entries, transcript appends,
 * card-move animation sources, memory pulses and runId→unitId index updates.
 * Pure with respect to its inputs.
 */
function routeFrames(
  frames: readonly ServerFrame[],
  prevRunToUnit: Record<string, string>,
  unitTitle: (unitId: string | undefined) => string,
  taskTitle: (taskId: string | undefined) => string,
  nowMs: number,
): FrameRouting {
  const routing: FrameRouting = {
    tickerEntries: [],
    transcriptOps: new Map(),
    cardMoves: [],
    pulses: [],
    runToUnit: prevRunToUnit,
    connected: false,
  };
  let runToUnitMutable: Record<string, string> | null = null;
  const indexRun = (runId: string, unitId: string): void => {
    if (routing.runToUnit[runId] === unitId) return;
    if (runToUnitMutable === null) {
      runToUnitMutable = { ...prevRunToUnit };
      routing.runToUnit = runToUnitMutable;
    }
    runToUnitMutable[runId] = unitId;
  };
  const transcript = (unitId: string, entry: Omit<TranscriptEntry, 'id'>): void => {
    const list = routing.transcriptOps.get(unitId);
    if (list) {
      list.push(entry);
    } else {
      routing.transcriptOps.set(unitId, [entry]);
    }
  };
  const ticker = (entry: Omit<TickerEntry, 'id'>): void => {
    routing.tickerEntries.push(entry);
  };

  for (const frame of frames) {
    switch (frame.type) {
      case 'hello':
        routing.connected = true;
        break;
      case 'error':
        ticker({ ts: nowMs, severity: 'alert', text: `Command rejected — ${frame.code}: ${frame.message}` });
        break;
      case 'hook.request': {
        const taskId = asString((frame as HookRequestFrame).payload['taskId']);
        const question = asString((frame as HookRequestFrame).payload['question']);
        ticker({
          ts: nowMs,
          severity: 'warn',
          text: `Inquiry raised — ${question ?? 'the agent needs a decision'}`,
          ...(taskId !== undefined ? { entityId: taskId } : {}),
        });
        break;
      }
      case 'hook.resolved':
        // Alerts reconcile against listPendingHooks(); nothing extra to do.
        break;
      case 'pong':
      case 'pairing.consumed':
        break;
      case 'run.event': {
        routeRunEvent(frame, routing, indexRun, transcript, ticker, unitTitle, taskTitle);
        break;
      }
    }
  }
  return routing;
}

/**
 * Card-move reasons whose ticker line is owned elsewhere: user moves are
 * logged by the Orders layer; revert/release/rollback carry dedicated §V4-1
 * events (`reverted`/`release_shipped`/`rolled_back`) routed below.
 */
const SILENT_MOVE_REASONS = new Set(['user-move', 'reverted', 'release-shipped', 'rolled-back']);

/** Ticker phrasing for automatic card moves (§V3-2/§V3-3/§V4-1). */
function cardMoveText(reason: string, title: string, to: ColumnId): string {
  switch (reason) {
    case 'work-complete':
      return `Work complete — ${title} advances to AI REVIEW`;
    case 'review-pass':
      return `Review passed — ${title} awaits human review`;
    case 'review-pass-yolo':
      return `Yolo pass — ${title} auto-approved, skipping human review`;
    case 'review-rejected':
      return `Review rejected — ${title} returns to DO for rework`;
    case 'aborted':
      return `Abort executed — ${title} returns to the backlog`;
    case 'integration-complete':
      return `Integration complete — ${title} lands on staging (MERGED)`;
    default:
      return `${title} moved to ${to.toUpperCase()}`;
  }
}

function routeRunEvent(
  frame: RunEventFrame,
  routing: FrameRouting,
  indexRun: (runId: string, unitId: string) => void,
  transcript: (unitId: string, entry: Omit<TranscriptEntry, 'id'>) => void,
  ticker: (entry: Omit<TickerEntry, 'id'>) => void,
  unitTitle: (unitId: string | undefined) => string,
  taskTitle: (taskId: string | undefined) => string,
): void {
  const ev = frame.event;
  const type = asString(ev['type']);
  if (type === undefined) return;
  const ts = asNumber(ev['timestamp']) ?? 0;
  const sessionId = asString(ev['sessionId']);
  const eventUnitId = asString(ev['unitId']);
  if (sessionId !== undefined && frame.runId !== 'run-none') {
    indexRun(frame.runId, sessionId);
  }
  const unitId = sessionId ?? eventUnitId ?? routing.runToUnit[frame.runId];
  const taskId = asString(ev['taskId']);

  switch (type) {
    case 'session_start': {
      const resumed = ev['resumed'] === true;
      if (unitId !== undefined) {
        transcript(unitId, { kind: 'note', text: `session ${resumed ? 'resumed' : 'started'} (${frame.runId})` });
        ticker({
          ts,
          severity: 'info',
          text: `${unitTitle(unitId)} attends${resumed ? ' (resumed)' : ''}`,
          entityId: unitId,
        });
      }
      break;
    }
    case 'turn_start': {
      const turnIndex = asNumber(ev['turnIndex']) ?? 0;
      if (unitId !== undefined) transcript(unitId, { kind: 'turn', text: `— turn ${turnIndex + 1} —` });
      break;
    }
    case 'text_delta': {
      const accumulated = asString(ev['accumulated']) ?? '';
      if (unitId !== undefined) transcript(unitId, { kind: 'text', text: accumulated });
      break;
    }
    case 'thinking_delta': {
      const accumulated = asString(ev['accumulated']) ?? '';
      if (unitId !== undefined) transcript(unitId, { kind: 'thinking', text: accumulated });
      break;
    }
    case 'tool_call_start': {
      const toolName = asString(ev['toolName']) ?? 'tool';
      if (unitId !== undefined) {
        transcript(unitId, {
          kind: 'tool',
          text: `> ${toolName} running…`,
          toolName,
          toolStatus: 'running',
        });
      }
      break;
    }
    case 'tool_result': {
      const toolName = asString(ev['toolName']) ?? 'tool';
      const durationMs = asNumber(ev['durationMs']) ?? 0;
      if (unitId !== undefined) {
        transcript(unitId, {
          kind: 'tool',
          text: `> ${toolName} finished (${durationMs}ms)`,
          toolName,
          durationMs,
          toolStatus: 'done',
        });
      }
      break;
    }
    case 'tool_error': {
      const toolName = asString(ev['toolName']) ?? 'tool';
      const error = asString(ev['error']) ?? 'tool failed';
      if (unitId !== undefined) {
        transcript(unitId, {
          kind: 'tool',
          text: `> ${toolName} FAILED: ${error}`,
          toolName,
          toolStatus: 'failed',
        });
        ticker({ ts, severity: 'warn', text: `${unitTitle(unitId)}: ${error}`, entityId: unitId });
      }
      break;
    }
    case 'paused': {
      if (unitId !== undefined) {
        transcript(unitId, { kind: 'note', text: 'holding — paused by operator' });
        ticker({
          ts,
          severity: 'info',
          text: `${unitTitle(unitId)} holding — paused by operator`,
          entityId: unitId,
        });
      }
      break;
    }
    case 'resumed': {
      if (unitId !== undefined) {
        transcript(unitId, { kind: 'note', text: 'resumed' });
        ticker({ ts, severity: 'info', text: `${unitTitle(unitId)} back online`, entityId: unitId });
      }
      break;
    }
    case 'task_prioritized': {
      ticker({
        ts,
        severity: 'info',
        text: `Priority — ${taskTitle(taskId)} bumped to the top of the backlog`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'error': {
      const message = asString(ev['message']) ?? 'unknown error';
      const recoverable = ev['recoverable'] === true;
      if (unitId !== undefined) {
        transcript(unitId, { kind: 'note', text: `ERROR: ${message}` });
        ticker({
          ts,
          severity: recoverable ? 'warn' : 'alert',
          text: `${unitTitle(unitId)}: ${message}`,
          entityId: unitId,
        });
      }
      break;
    }
    case 'session_end': {
      if (unitId !== undefined) transcript(unitId, { kind: 'note', text: 'session ended' });
      break;
    }
    // --- V3 board events (§V3-2/§V3-3/§V3-5) --------------------------------
    case 'card_moved': {
      const from = asString(ev['from']) as ColumnId | undefined;
      const to = asString(ev['to']) as ColumnId | undefined;
      const reason = asString(ev['reason']) ?? 'user-move';
      const stagger = typeof ev['stagger'] === 'number' ? ev['stagger'] : 0;
      if (taskId !== undefined && from !== undefined && to !== undefined) {
        routing.cardMoves.push({ taskId, from, to, reason, stagger });
        if (!SILENT_MOVE_REASONS.has(reason)) {
          // User moves are logged by the Orders layer; §V4-1 rail verbs carry
          // their own dedicated events; remaining auto-moves ticker here.
          ticker({ ts, severity: 'info', text: cardMoveText(reason, taskTitle(taskId), to), entityId: taskId });
        }
      }
      break;
    }
    // --- §V4-1 release-rail events -------------------------------------------
    case 'reverted': {
      ticker({
        ts,
        severity: 'warn',
        text: `Reverted — ${taskTitle(taskId)} pulled from staging, returns to DO`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'release_shipped': {
      const releaseId = asString(ev['releaseId']) ?? 'rel-??';
      ticker({
        ts,
        severity: 'success',
        text: `Release ${releaseId} — ${taskTitle(taskId)} ships to production`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'rolled_back': {
      ticker({
        ts,
        severity: 'warn',
        text: `Rolled back — ${taskTitle(taskId)} withdrawn from production to staging`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    // --- §V4-5 editor events ---------------------------------------------------
    case 'task_updated': {
      ticker({
        ts,
        severity: 'info',
        text: `Card updated — ${taskTitle(taskId)}`,
        ...(taskId !== undefined && taskId !== '' ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'stack_forged': {
      const name = asString(ev['name']) ?? 'unnamed stack';
      const stackRef = asString(ev['stackRef']) ?? 'stk-c??';
      const updated = ev['updated'] === true;
      ticker({
        ts,
        severity: 'success',
        text: updated
          ? `Stack re-forged — ${name} (${stackRef}) updated in the foundry`
          : `Stack forged — ${name} (${stackRef}) joins the roster`,
      });
      break;
    }
    case 'process_updated': {
      // §V4-6: template amendment — revision bump, future runs only.
      const processId = asString(ev['processId']) ?? 'commander/?@v?';
      ticker({
        ts,
        severity: 'success',
        text: `Process amended — ${processId} inscribed; future runs only`,
      });
      break;
    }
    case 'card_merged': {
      ticker({
        ts,
        severity: 'success',
        text: `Merged — ${taskTitle(taskId)} sealed into the base branch`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'integration_step': {
      const step = asString(ev['step']) ?? 'integration step';
      ticker({
        ts,
        severity: 'info',
        text: `Integration — ${step} (${taskTitle(taskId)})`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'review_feedback': {
      const feedback = asString(ev['feedback']) ?? 'changes requested';
      ticker({
        ts,
        severity: 'warn',
        text: `Feedback — ${taskTitle(taskId)}: ${feedback}`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'review_note': {
      const note = asString(ev['note']) ?? 'reviewer note';
      ticker({
        ts,
        severity: 'info',
        text: `Reviewer — ${note}`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'inquiry_resolved': {
      const caption = asString(ev['caption']) ?? 'option chosen';
      ticker({
        ts,
        severity: 'success',
        text: `Inquiry resolved — ${caption} (${taskTitle(taskId)})`,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'inquiry_followup': {
      const text = asString(ev['text']) ?? 'branch engaged';
      ticker({
        ts,
        severity: 'info',
        text,
        ...(taskId !== undefined ? { entityId: taskId } : {}),
      });
      break;
    }
    case 'memory_query': {
      const silo = asString(ev['silo']) ?? '';
      const matched = asStringArray(ev['matchedIds']);
      const qUnit = asString(ev['unitId']);
      routing.pulses.push({ kind: 'query', silo, recordIds: matched, unitId: qUnit ?? null, taskId: taskId ?? null, ts });
      ticker({
        ts,
        severity: 'info',
        text: `Memory query — ${unitTitle(qUnit)} drew ${matched.length} piece(s) from ${silo}`,
        ...(qUnit !== undefined ? { entityId: qUnit } : {}),
      });
      break;
    }
    case 'memory_update': {
      const silo = asString(ev['silo']) ?? '';
      const uUnit = asString(ev['unitId']);
      routing.pulses.push({ kind: 'update', silo, recordIds: [], unitId: uUnit ?? null, taskId: taskId ?? null, ts });
      ticker({
        ts,
        severity: 'info',
        text: `Memory update — ${unitTitle(uUnit)} proposes changes to ${silo}`,
        ...(uUnit !== undefined ? { entityId: uUnit } : {}),
      });
      break;
    }
    default:
      // thinking_start/stop, message_start/stop, token_usage, turn_end,
      // phase/workspace chatter… intentionally not surfaced in the ticker
      // (noise control, SPEC §14).
      break;
  }
}

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

function initialResources(): ResourcesSnapshot {
  return {
    unitCount: 0,
    busyCount: 0,
    idleCount: 0,
    tokensBurned: 0,
    costUsd: 0,
    tasksDone: 0,
    tasksTotal: 0,
    alertCount: 0,
  };
}

export function createCommanderStore(): CommanderStore {
  return createStore<CommanderState>((set, get) => ({
    world: {
      units: {},
      unitIds: [],
      tasks: {},
      taskIds: [],
      runToUnit: {},
    },
    board: {
      cards: {},
      cardIds: [],
      agents: {},
      agentIds: [],
      inquiries: [],
      resolvedInquiries: {},
      memory: { silos: [], records: [] },
      heldByCard: {},
      rosterAgents: [],
    },
    selection: { ids: [] },
    events: [],
    alerts: [],
    meta: {
      resources: initialResources(),
      speed: 1,
      simTimeMs: 0,
      simStartMs: 0,
      tickIndex: 0,
      connection: 'connecting',
      paused: false,
      viewport: { width: 1280, height: 720 },
      inspectorUnitId: null,
      inspectorTaskId: null,
      inspectorTab: 'transcript',
      reviewTaskId: null,
      cardEditorTaskId: null,
      dockPulse: 0,
      steerOpen: false,
      foundryOpen: false,
      archiveOpen: false,
      archiveFocusId: null,
      runsOpen: false,
      runsFocusRunId: null,
      registryOpen: false,
      registryStackRef: null,
      foundryTab: 'commission',
      ideTaskId: null,
      movingCards: {},
      moveSeq: 0,
      memoryPulses: [],
      pulseSeq: 0,
      eventSeq: 0,
      version: COMMANDER_VERSION,
    },

    // --- tick ingestion -----------------------------------------------------
    commitTick(input) {
      set((state) => {
        const prevWorld = state.world;
        const prevBoard = state.board;
        const unitViewById = new Map(input.units.map((u) => [u.unitId, u]));
        const unitTitle = (id: string | undefined): string => {
          if (id === undefined) return 'unknown agent';
          return unitViewById.get(id)?.title ?? prevWorld.units[id]?.view.title ?? id;
        };
        const taskTitle = (id: string | undefined): string => {
          if (id === undefined) return 'unknown task';
          const card = input.cards.find((c) => c.taskId === id);
          return card?.title ?? prevBoard.cards[id]?.view.title ?? id;
        };

        const routing = routeFrames(input.frames, prevWorld.runToUnit, unitTitle, taskTitle, input.nowMs);

        // --- tasks (v1-compat views for SelectionPanel etc.) ----------------
        const tasks: Record<string, TaskEntity> = {};
        let tasksChanged = false;
        for (const view of input.tasks) {
          const prev = prevWorld.tasks[view.taskId];
          if (prev && taskViewEqual(prev.view, view)) {
            tasks[view.taskId] = prev;
          } else {
            tasks[view.taskId] = { kind: 'task', id: view.taskId, view };
            tasksChanged = true;
          }
        }
        const taskIds = Object.keys(tasks).sort();
        const taskIdsStable =
          taskIds.length === prevWorld.taskIds.length && taskIds.every((id, i) => prevWorld.taskIds[i] === id);

        // --- units (active agents; preserve refs when unchanged) ------------
        const units: Record<string, UnitEntity> = {};
        let unitsChanged = false;
        for (const view of input.units) {
          const prev = prevWorld.units[view.unitId];
          const appended = routing.transcriptOps.get(view.unitId);
          let transcriptArr = prev?.transcript ?? [];
          let transcriptSeq = prev?.transcriptSeq ?? 0;
          if (appended !== undefined && appended.length > 0) {
            const next = [...transcriptArr];
            for (const entry of appended) {
              const last = next[next.length - 1];
              if (
                last !== undefined &&
                (entry.kind === 'text' || entry.kind === 'thinking') &&
                last.kind === entry.kind
              ) {
                next[next.length - 1] = { ...last, text: entry.text };
              } else {
                next.push({ id: `tr-${view.unitId}-${(transcriptSeq += 1)}`, ...entry });
              }
            }
            transcriptArr = next.slice(-TRANSCRIPT_CAP);
          }
          if (prev && transcriptArr === prev.transcript && unitViewEqual(prev.view, view)) {
            units[view.unitId] = prev;
          } else {
            const used = tokenTotal(view) + view.tokenUsage.cachedTokens;
            units[view.unitId] = {
              kind: 'unit',
              id: view.unitId,
              view,
              contextPct: Math.min(1, used / CONTEXT_WINDOW_TOKENS),
              energyPct: Math.max(0, 1 - view.cost.totalUsd / UNIT_BUDGET_USD),
              transcript: transcriptArr,
              transcriptSeq,
            };
            unitsChanged = true;
          }
        }
        const unitIds = Object.keys(units).sort();
        const unitIdsStable =
          unitIds.length === prevWorld.unitIds.length && unitIds.every((id, i) => prevWorld.unitIds[i] === id);

        // --- board cards (§V3-1) ---------------------------------------------
        const cards: Record<string, BoardCardEntity> = {};
        let cardsChanged = false;
        for (const view of input.cards) {
          const prev = prevBoard.cards[view.taskId];
          const runStage = input.runStages[view.taskId] ?? null;
          if (prev && prev.runStage === runStage && cardViewEqual(prev.view, view)) {
            cards[view.taskId] = prev;
          } else {
            cards[view.taskId] = { id: view.taskId, view, runStage };
            cardsChanged = true;
          }
        }
        const cardIds = Object.keys(cards).sort();
        const cardIdsStable =
          cardIds.length === prevBoard.cardIds.length && cardIds.every((id, i) => prevBoard.cardIds[i] === id);

        // --- board agents (§V3-2) ----------------------------------------------
        const agents: Record<string, SimAgentView> = {};
        let agentsChanged = false;
        for (const view of input.agents) {
          const prev = prevBoard.agents[view.unitId];
          if (prev && prev.updatedAt === view.updatedAt && prev.state === view.state && prev.paused === view.paused && prev.heldPieces.length === view.heldPieces.length) {
            agents[view.unitId] = prev;
          } else {
            agents[view.unitId] = view;
            agentsChanged = true;
          }
        }
        const agentIds = Object.keys(agents).sort();
        const agentIdsStable =
          agentIds.length === prevBoard.agentIds.length && agentIds.every((id, i) => prevBoard.agentIds[i] === id);

        // --- inquiries (§V3-5) ---------------------------------------------------
        const inquiriesStable =
          input.inquiries.length === prevBoard.inquiries.length &&
          input.inquiries.every((q, i) => prevBoard.inquiries[i]?.hookRequestId === q.hookRequestId);
        const inquiries = inquiriesStable ? prevBoard.inquiries : input.inquiries;

        // --- alerts (sim pending hooks are the source of truth) -------------
        const prevAlertById = new Map(state.alerts.map((a) => [a.hookRequestId, a]));
        const alerts: AlertEntry[] = input.hooks.map((hook) => {
          const prev = prevAlertById.get(hook.hookRequestId);
          if (prev !== undefined) return prev;
          return {
            hookRequestId: hook.hookRequestId,
            runId: hook.runId,
            unitId: hook.unitId,
            kind: hook.hookKind,
            payload: hook.payload,
            deadlineTs: hook.deadlineTs,
          };
        });
        const alertsStable =
          alerts.length === state.alerts.length && alerts.every((a, i) => state.alerts[i] === a);

        // --- ticker ring buffer ----------------------------------------------
        let eventSeq = state.meta.eventSeq;
        let events = state.events;
        if (routing.tickerEntries.length > 0) {
          const appended = routing.tickerEntries.map((entry) => ({ id: `evt-${(eventSeq += 1)}`, ...entry }));
          events = [...state.events, ...appended].slice(-EVENT_RING_CAP);
        }

        // --- card-move animation registry (§V3-3) -----------------------------
        let movingCards = state.meta.movingCards;
        let moveSeq = state.meta.moveSeq;
        if (routing.cardMoves.length > 0) {
          movingCards = { ...movingCards };
          for (const move of routing.cardMoves) {
            moveSeq += 1;
            movingCards[move.taskId] = {
              from: move.from,
              to: move.to,
              reason: move.reason,
              seq: moveSeq,
              stagger: move.stagger,
            };
          }
        }

        // --- held pieces per card (§V2-3/AC18) -----------------------------------
        let heldByCard = prevBoard.heldByCard;
        for (const pulse of routing.pulses) {
          if (pulse.kind !== 'query' || pulse.taskId === null || pulse.recordIds.length === 0) continue;
          const prevHeld = heldByCard[pulse.taskId] ?? [];
          const added = pulse.recordIds.filter((id) => !prevHeld.includes(id));
          if (added.length === 0) continue;
          if (heldByCard === prevBoard.heldByCard) heldByCard = { ...heldByCard };
          heldByCard[pulse.taskId] = [...prevHeld, ...added];
        }

        // --- memory transfer pulses (§V2-3) -------------------------------------
        let pulseSeq = state.meta.pulseSeq;
        let memoryPulses = state.meta.memoryPulses.filter((p) => input.nowMs - p.ts < PULSE_TTL_MS);
        if (memoryPulses.length === state.meta.memoryPulses.length && routing.pulses.length === 0) {
          memoryPulses = state.meta.memoryPulses;
        }
        if (routing.pulses.length > 0) {
          memoryPulses = [
            ...memoryPulses,
            ...routing.pulses.map((p) => ({ id: `pulse-${(pulseSeq += 1)}`, ...p })),
          ].slice(-PULSE_CAP);
        }

        // --- selection pruning ------------------------------------------------
        let selection = state.selection;
        const pruned = selection.ids.filter((id) => units[id] !== undefined || cards[id] !== undefined);
        if (pruned.length !== selection.ids.length) {
          selection = { ...selection, ids: pruned };
        }

        // --- meta / resources ---------------------------------------------------
        let busyCount = 0;
        let tokensBurned = 0;
        let costUsd = 0;
        for (const view of input.units) {
          if (BUSY_STATES.has(view.state)) busyCount += 1;
          tokensBurned += tokenTotal(view);
          costUsd += view.cost.totalUsd;
        }
        const tasksDone = input.tasks.filter((t) => t.state === 'done').length;
        const resources: ResourcesSnapshot = {
          unitCount: input.units.length,
          busyCount,
          idleCount: input.units.filter((u) => u.state === 'idle').length,
          tokensBurned,
          costUsd: Math.round(costUsd * 100) / 100,
          tasksDone,
          tasksTotal: input.tasks.length,
          alertCount: alerts.length,
        };

        const world: WorldSlice =
          unitsChanged ||
          tasksChanged ||
          !unitIdsStable ||
          !taskIdsStable ||
          routing.runToUnit !== prevWorld.runToUnit
            ? {
                units,
                unitIds: unitIdsStable ? prevWorld.unitIds : unitIds,
                tasks,
                taskIds: taskIdsStable ? prevWorld.taskIds : taskIds,
                runToUnit: routing.runToUnit,
              }
            : prevWorld;

        const rosterAgents = input.rosterAgents;
        const rosterChanged = rosterAgents !== prevBoard.rosterAgents &&
          (rosterAgents.length !== prevBoard.rosterAgents.length ||
            rosterAgents.some((a, i) => a !== prevBoard.rosterAgents[i]));

        const board: BoardSlice =
          cardsChanged ||
          agentsChanged ||
          !cardIdsStable ||
          !agentIdsStable ||
          inquiries !== prevBoard.inquiries ||
          heldByCard !== prevBoard.heldByCard ||
          rosterChanged
            ? {
                cards,
                cardIds: cardIdsStable ? prevBoard.cardIds : cardIds,
                agents,
                agentIds: agentIdsStable ? prevBoard.agentIds : agentIds,
                inquiries,
                resolvedInquiries: prevBoard.resolvedInquiries,
                memory: prevBoard.memory,
                heldByCard,
                rosterAgents,
              }
            : prevBoard;

        return {
          world,
          board,
          selection,
          events,
          alerts: alertsStable ? state.alerts : alerts,
          meta: {
            ...state.meta,
            resources,
            simTimeMs: input.nowMs,
            simStartMs: state.meta.simStartMs === 0 ? input.nowMs - input.tickIndex * 250 : state.meta.simStartMs,
            tickIndex: input.tickIndex,
            connection: routing.connected ? 'connected' : state.meta.connection,
            paused: input.paused,
            movingCards,
            moveSeq,
            memoryPulses,
            pulseSeq,
            eventSeq,
          },
        };
      });
    },

    // --- selection -----------------------------------------------------------
    select(ids) {
      set((state) => ({ selection: { ...state.selection, ids: [...ids] } }));
    },
    clickSelect(id, shift) {
      set((state) => ({
        selection: { ...state.selection, ids: applyClickSelection(state.selection.ids, id, shift) },
      }));
    },
    clearSelection() {
      set((state) =>
        state.selection.ids.length === 0 ? state : { selection: { ...state.selection, ids: [] } },
      );
    },
    escape() {
      // Esc cascade (§V3-7 as amended by §V4-13/§V4-11/§V5-3): ide >
      // card-editor > runs > registry > foundry > archive > review panel >
      // steer modal > inspector > selection. The registry joins the top tier
      // BELOW runs: a registry run link opens the Runs overlay above the
      // registry, so Esc unwinds runs first and returns to the registry's
      // preserved navigation state. Modals close WITHOUT clearing the
      // selection; the review panel SURVIVES the IDE's Esc (AC45).
      const state = get();
      if (state.meta.ideTaskId !== null) {
        set({ meta: { ...state.meta, ideTaskId: null } });
        return;
      }
      if (state.meta.cardEditorTaskId !== null) {
        set({ meta: { ...state.meta, cardEditorTaskId: null } });
        return;
      }
      if (state.meta.runsOpen) {
        set({ meta: { ...state.meta, runsOpen: false, runsFocusRunId: null } });
        return;
      }
      if (state.meta.registryOpen) {
        set({ meta: { ...state.meta, registryOpen: false, registryStackRef: null } });
        return;
      }
      if (state.meta.foundryOpen) {
        set({ meta: { ...state.meta, foundryOpen: false } });
        return;
      }
      if (state.meta.archiveOpen) {
        set({ meta: { ...state.meta, archiveOpen: false } });
        return;
      }
      if (state.meta.reviewTaskId !== null) {
        set({ meta: { ...state.meta, reviewTaskId: null } });
        return;
      }
      if (state.meta.steerOpen) {
        set({ meta: { ...state.meta, steerOpen: false } });
        return;
      }
      if (state.meta.inspectorUnitId !== null || state.meta.inspectorTaskId !== null) {
        set({ meta: { ...state.meta, inspectorUnitId: null, inspectorTaskId: null } });
        return;
      }
      get().clearSelection();
    },
    jumpToLatestAlert() {
      // Space (SPEC §5 under V3): land the operator on the latest alert by
      // selecting its card (the agent's attended task), falling back to the
      // agent itself.
      const state = get();
      const latest = state.alerts[state.alerts.length - 1];
      if (latest === undefined) return;
      const fromPayload = state.board.cards[String(latest.payload['taskId'] ?? '')]?.id;
      const taskId = fromPayload ?? state.world.units[latest.unitId]?.view.taskId ?? null;
      const target = taskId ?? (state.world.units[latest.unitId] !== undefined ? latest.unitId : null);
      if (target !== null) {
        set({ selection: { ...state.selection, ids: [target] } });
      }
    },

    // --- transient UI ------------------------------------------------------------
    setViewport(size) {
      set((state) =>
        state.meta.viewport.width === size.width && state.meta.viewport.height === size.height
          ? state
          : { meta: { ...state.meta, viewport: size } },
      );
    },
    openInspector(unitId) {
      // §V4-3 retargeting: an already-open Inspector keeps its selected tab
      // (agents support every tab); a fresh open defaults to Transcript.
      // An Inspector-opening intent (Inspect/Terminal/Memory) makes the
      // Inspector primary: any open review panel closes — same task or not.
      set((state) => {
        const wasOpen = state.meta.inspectorUnitId !== null || state.meta.inspectorTaskId !== null;
        const tab: InspectorTab = wasOpen ? state.meta.inspectorTab : 'transcript';
        return {
          meta: {
            ...state.meta,
            inspectorUnitId: unitId,
            inspectorTaskId: null,
            inspectorTab: tab,
            reviewTaskId: null,
          },
        };
      });
    },
    openInspectorCard(taskId) {
      // §V5-2 default-tab policy: agent-less cards in the review-and-beyond
      // columns open on SESSIONS (ahead of Process); backlog/do cards keep
      // the V3 Process default. §V4-3 retargeting: preserve the selected tab
      // when the card supports it (CARD_SUPPORTED_TABS — now incl. Sessions);
      // the live Transcript falls back to the card default. As with
      // openInspector, the Inspector becomes primary: an open review panel
      // (same task or different) closes.
      set((state) => {
        const wasOpen = state.meta.inspectorUnitId !== null || state.meta.inspectorTaskId !== null;
        const card = state.board.cards[taskId];
        const fallback = defaultInspectorCardTab(
          card?.view.column,
          card?.view.agentIds.length ?? 0,
        );
        const tab: InspectorTab =
          wasOpen && CARD_SUPPORTED_TABS.has(state.meta.inspectorTab)
            ? state.meta.inspectorTab
            : fallback;
        return {
          meta: {
            ...state.meta,
            inspectorUnitId: null,
            inspectorTaskId: taskId,
            inspectorTab: tab,
            reviewTaskId: null,
          },
        };
      });
    },
    openInspectorSessions(taskId) {
      // §V5-2/§V5-4 deep-link (review-panel "Sessions" chip, sel-session-link):
      // always lands on the Sessions tab regardless of retarget state.
      set((state) => ({
        meta: {
          ...state.meta,
          inspectorUnitId: null,
          inspectorTaskId: taskId,
          inspectorTab: 'sessions',
          reviewTaskId: null,
        },
      }));
    },
    openRegistryStack(stackRef) {
      // §V5-4: "view stack" routes to the Registry overlay opened directly
      // on that stack's detail (the overlay consumes registryStackRef as its
      // deep-link on open).
      set((state) => ({
        meta: { ...state.meta, registryOpen: true, registryStackRef: stackRef },
      }));
    },
    openRegistry() {
      // §V5-3 TopBar button: fresh open on the stacks list (no deep-link).
      set((state) => ({
        meta: { ...state.meta, registryOpen: true, registryStackRef: null },
      }));
    },
    closeRegistry() {
      set((state) => ({
        meta: { ...state.meta, registryOpen: false, registryStackRef: null },
      }));
    },
    openRunsAt(runId) {
      // §V5-3 registry run links: the Runs overlay opens ABOVE the registry
      // directly on the run's detail; the registry keeps its navigation
      // state for the Esc return trip.
      set((state) => ({ meta: { ...state.meta, runsOpen: true, runsFocusRunId: runId } }));
    },
    openFoundryStacks() {
      // §V5-3 stack detail "open in Foundry": a deliberate exit from the
      // registry into the Foundry's STACKS tab.
      set((state) => ({
        meta: {
          ...state.meta,
          foundryOpen: true,
          foundryTab: 'stacks',
          registryOpen: false,
          registryStackRef: null,
        },
      }));
    },
    closeInspector() {
      set((state) => ({ meta: { ...state.meta, inspectorUnitId: null, inspectorTaskId: null } }));
    },
    setInspectorTab(tab) {
      set((state) => (state.meta.inspectorTab === tab ? state : { meta: { ...state.meta, inspectorTab: tab } }));
    },
    pulseDock() {
      set((state) => ({ meta: { ...state.meta, dockPulse: state.meta.dockPulse + 1 } }));
    },
    recordResolvedInquiry(entry) {
      set((state) => {
        const prev = state.board.resolvedInquiries[entry.unitId] ?? [];
        if (prev.some((r) => r.hookRequestId === entry.hookRequestId)) return state;
        return {
          board: {
            ...state.board,
            resolvedInquiries: {
              ...state.board.resolvedInquiries,
              [entry.unitId]: [...prev, entry].slice(-RESOLVED_INQUIRY_CAP),
            },
          },
        };
      });
    },
    openReview(taskId) {
      set((state) => ({ meta: { ...state.meta, reviewTaskId: taskId } }));
    },
    closeReview() {
      set((state) => ({ meta: { ...state.meta, reviewTaskId: null } }));
    },
    openCardEditor(taskId) {
      set((state) => ({ meta: { ...state.meta, cardEditorTaskId: taskId } }));
    },
    closeCardEditor() {
      set((state) => ({ meta: { ...state.meta, cardEditorTaskId: null } }));
    },
    openSteer() {
      set((state) => ({ meta: { ...state.meta, steerOpen: true } }));
    },
    closeSteer() {
      set((state) => ({ meta: { ...state.meta, steerOpen: false } }));
    },
    openFoundry() {
      set((state) => ({ meta: { ...state.meta, foundryOpen: true, foundryTab: 'commission' } }));
    },
    closeFoundry() {
      set((state) => ({ meta: { ...state.meta, foundryOpen: false } }));
    },
    openArchive() {
      set((state) => ({ meta: { ...state.meta, archiveOpen: true, archiveFocusId: null } }));
    },
    closeArchive() {
      set((state) => ({ meta: { ...state.meta, archiveOpen: false, archiveFocusId: null } }));
    },
    openArchiveAt(recordId) {
      // §V4-9 deep-link: the Memory I/O piece "closes the inspector view
      // into the Archive overlay focused+selected on that node".
      set((state) => ({
        meta: {
          ...state.meta,
          archiveOpen: true,
          archiveFocusId: recordId,
          inspectorUnitId: null,
          inspectorTaskId: null,
        },
      }));
    },
    openRuns() {
      set((state) => ({ meta: { ...state.meta, runsOpen: true, runsFocusRunId: null } }));
    },
    closeRuns() {
      set((state) => ({ meta: { ...state.meta, runsOpen: false, runsFocusRunId: null } }));
    },
    openIde(taskId) {
      set((state) => ({ meta: { ...state.meta, ideTaskId: taskId } }));
    },
    closeIde() {
      set((state) => ({ meta: { ...state.meta, ideTaskId: null } }));
    },
    clearMoving(taskId) {
      set((state) => {
        if (state.meta.movingCards[taskId] === undefined) return state;
        const movingCards = { ...state.meta.movingCards };
        delete movingCards[taskId];
        return { meta: { ...state.meta, movingCards } };
      });
    },
    setMemory(memory) {
      set((state) => ({ board: { ...state.board, memory } }));
    },
    setPaused(paused) {
      set((state) => (state.meta.paused === paused ? state : { meta: { ...state.meta, paused } }));
    },
    setSimSpeed(speed) {
      set((state) => (state.meta.speed === speed ? state : { meta: { ...state.meta, speed } }));
    },
    pushEvent(text, severity, entityId) {
      set((state) => {
        const eventSeq = state.meta.eventSeq + 1;
        const entry: TickerEntry = {
          id: `evt-${eventSeq}`,
          ts: state.meta.simTimeMs,
          severity,
          text,
          ...(entityId !== undefined ? { entityId } : {}),
        };
        return {
          events: [...state.events, entry].slice(-EVENT_RING_CAP),
          meta: { ...state.meta, eventSeq },
        };
      });
    },
  }));
}

// ---------------------------------------------------------------------------
// Backend binding: frames + sim views → ONE store commit per tick batch
// ---------------------------------------------------------------------------

/** Order surface used by the input grammar, board and command card (§V3-7). */
export interface Orders {
  /** `/abort` via session.message. */
  abort(unitIds: readonly string[]): void;
  /** Any other prompt via session.message. */
  steer(unitIds: readonly string[], prompt: string): void;
  /** hook.decision frames (legacy approve/deny surface — AlertBanner). */
  decide(hookRequestId: string, decision: 'allow' | 'deny'): void;
  /** Pause: hold working agents' runs mid-state (sim operator verb). */
  pauseUnits(unitIds: readonly string[]): void;
  /** Resume: release operator holds. */
  resumeUnits(unitIds: readonly string[]): void;
  /** Prioritize: bump a backlog card to the top of its lane. */
  prioritize(taskId: string): void;
  /** Pause/resume the simulation (global command card). */
  toggleSim(): void;
  /** SPEC-V3 §V3-1: user board move via the sim verb (drag or command card). */
  moveCard(taskId: string, column: ColumnId): void;
  /** SPEC-V3 §V3-1: yolo toggle — passing AI review auto-approves. */
  setYolo(taskId: string, on: boolean): void;
  /** SPEC-V2 §V2-6 Commission Task: lands a new card in the backlog. */
  createTask(input: { taskKind: TaskKind; title?: string; parentId?: string; workspaceId?: string }): string | null;
  /** SPEC-V3 §V3-5: resolve an inquiry with the chosen option. */
  answerInquiry(hookRequestId: string, optionId: string | null): void;
  /** SPEC-V4 §V4-1: revert a MERGED card from staging back to DO. */
  revertCard(taskId: string): void;
  /** SPEC-V4 §V4-1: ship ALL merged cards to production (release train). */
  release(): string | null;
  /** SPEC-V4 §V4-1: roll an IN PRODUCTION card back to MERGED (staging). */
  rollbackCard(taskId: string): void;
  /** SPEC-V4 §V4-4: set the real-time pacing multiplier (0.5 | 1 | 2). */
  setSpeed(speed: number): boolean;
  /** SPEC-V4 §V4-5: card editor save — applies ONLY the changed fields. */
  updateTask(taskId: string, patch: UpdateTaskPatch): boolean;
  /** SPEC-V4 §V4-5: stacks foundry save — forge or update an agent stack. */
  upsertStack(stack: KradleAgentStackInput): string | null;
  /**
   * SPEC-V4 §V4-6: process-editor save — amend a kind's phase pipeline
   * TEMPLATE (revision bump, `process_updated` event, future runs only).
   */
  updateProcessTemplate(kind: TaskKind, phases: string[]): number | null;
  /**
   * SPEC-V4 §V4-8/§V4-11: session-local editor write — the workspace view
   * (dirty badges + diff plates) reflects it on the next read.
   */
  writeFile(taskId: string, path: string, content: string): boolean;
  /** Recruit a named roster agent from a stack. */
  createRosterAgent(input: { stackRef: string; role: 'worker' | 'reviewer'; name?: string }): string | null;
  /** Release (delete) a roster agent. */
  deleteRosterAgent(agentId: string): void;
  /** Assign or unassign a roster agent to a task role (null = unassign). */
  assignTaskAgent(taskId: string, role: 'worker' | 'reviewer', agentId: string | null): void;
  /** Toggle the human operator assignee for a task. */
  assignTaskHuman(taskId: string, assign: boolean): void;
  /**
   * Navigate to the card's context when an inquiry bubble is clicked:
   * human-review cards open the Review Panel; others open the Inspector
   * on the Transcript tab.
   */
  focusInquiryCard(taskId: string): void;
}

export interface BackendBinding {
  /** Drain buffered frames + sim views into one store commit. */
  flush(): void;
  orders: Orders;
  dispose(): void;
}

/**
 * Subscribe the store to a MockBackend. Frames are buffered; a microtask
 * flush coalesces every synchronous frame burst (one auto-tick) into a single
 * `commitTick`. Manual `sim.tick(n)` callers (the §9 test hook, orders) call
 * `flush()` synchronously for deterministic timing.
 */
export function bindBackendToStore(store: CommanderStore, backend: MockBackend): BackendBinding {
  const sim = backend.sim;
  let pending: ServerFrame[] = [];
  let scheduled = false;
  let disposed = false;
  let lastTick = -1;

  const flush = (): void => {
    if (disposed) return;
    if (pending.length === 0 && sim.tickIndex === lastTick) return;
    const frames = pending;
    pending = [];
    lastTick = sim.tickIndex;
    const cards = sim.listCardViews();
    // Current babysitter phase per ACTIVE card (§V2-5 run stage in context).
    const runStages: Record<string, string | null> = {};
    for (const card of cards) {
      if (card.agentIds.length === 0) continue;
      const observation = sim.getRunObservation(card.taskId);
      runStages[card.taskId] =
        observation?.phases.find((p) => p.status === 'current')?.label ?? null;
    }
    store.getState().commitTick({
      frames,
      units: sim.listUnitViews(),
      tasks: sim.listTaskViews(),
      hooks: sim.listPendingHooks(),
      cards,
      agents: sim.listActiveAgentViews(),
      inquiries: sim.listInquiries(),
      runStages,
      rosterAgents: sim.listRosterAgents(),
      nowMs: sim.now(),
      tickIndex: sim.tickIndex,
      paused: sim.paused,
    });
  };

  const unsubscribe = backend.onFrame((frame) => {
    pending.push(frame);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        flush();
      });
    }
  });

  // Static memory graph (§V2-3) + initial world ingest (boot world exists
  // before the first tick).
  store.getState().setMemory({ silos: sim.listMemorySilos(), records: sim.listMemoryRecords() });
  flush();

  const orders: Orders = {
    abort(unitIds) {
      const state = store.getState();
      const active = unitIds.filter((id) => state.world.units[id]?.view.runId !== null);
      for (const unitId of active) {
        backend.send({ type: 'session.message', sessionId: unitId, prompt: '/abort' });
      }
      flush();
    },
    steer(unitIds, prompt) {
      for (const unitId of unitIds) {
        backend.send({ type: 'session.message', sessionId: unitId, prompt });
      }
      flush();
    },
    decide(hookRequestId, decision) {
      backend.send({ type: 'hook.decision', hookRequestId, decision });
      flush();
    },
    pauseUnits(unitIds) {
      for (const id of unitIds) {
        sim.pauseUnit(id);
      }
      flush();
    },
    resumeUnits(unitIds) {
      for (const id of unitIds) {
        sim.resumeUnit(id);
      }
      flush();
    },
    prioritize(taskId) {
      sim.prioritizeTask(taskId);
      flush();
    },
    toggleSim() {
      if (sim.paused) {
        sim.resume();
        store.getState().setPaused(false);
        store.getState().pushEvent('Simulation resumed', 'info');
      } else {
        sim.pause();
        store.getState().setPaused(true);
        store.getState().pushEvent('Simulation paused', 'info');
      }
    },
    moveCard(taskId, column) {
      const title = store.getState().board.cards[taskId]?.view.title ?? taskId;
      if (sim.moveCard(taskId, column)) {
        store.getState().pushEvent(`Card order — ${title} moved to ${column.toUpperCase()}`, 'info', taskId);
      }
      flush();
    },
    setYolo(taskId, on) {
      const title = store.getState().board.cards[taskId]?.view.title ?? taskId;
      if (sim.setYolo(taskId, on)) {
        store.getState().pushEvent(
          on ? `Yolo flag raised — ${title} will auto-approve on review pass` : `Yolo flag struck — ${title} returns to human review`,
          'warn',
          taskId,
        );
      }
      flush();
    },
    createTask(input) {
      const taskId = sim.createTask(input);
      flush();
      if (taskId !== null) {
        store.getState().pushEvent(`Commissioned — ${input.taskKind} task ${taskId} enters the backlog`, 'info', taskId);
      }
      return taskId;
    },
    answerInquiry(hookRequestId, optionId) {
      backend.send({
        type: 'hook.decision',
        hookRequestId,
        decision: 'allow',
        ...(optionId !== null ? { optionId } : {}),
      });
      flush();
    },
    revertCard(taskId) {
      // §V4-1: the sim emits the `reverted` event + card_moved(reverted);
      // the frame router owns the ticker line.
      sim.revertCard(taskId);
      flush();
    },
    release() {
      const releaseId = sim.release();
      flush();
      return releaseId;
    },
    rollbackCard(taskId) {
      sim.rollbackCard(taskId);
      flush();
    },
    setSpeed(speed) {
      // §V4-4: real-time pacing only — never journaled, tick(n) untouched.
      const ok = sim.setSpeed(speed);
      if (ok) {
        store.getState().setSimSpeed(speed);
        store.getState().pushEvent(`Cogitator pacing — ${speed}x`, 'info');
      }
      return ok;
    },
    updateTask(taskId, patch) {
      // §V4-5: the sim emits `task_updated` — the frame router owns the
      // ticker line; this verb only applies + flushes.
      const ok = sim.updateTask(taskId, patch);
      flush();
      return ok;
    },
    upsertStack(stack) {
      // §V4-5: the sim emits `stack_forged` (deterministic stk-cNN id).
      const stackRef = sim.upsertStack(stack);
      flush();
      return stackRef;
    },
    updateProcessTemplate(kind, phases) {
      // §V4-6: the sim emits `process_updated` — the frame router owns the
      // ticker line; running runs keep their pinned revision.
      const revision = sim.updateProcessTemplate(kind, phases);
      flush();
      return revision;
    },
    writeFile(taskId, path, content) {
      // §V4-11: the sim emits `workspace_change`; the workspace view picks
      // up the new diff + dirty badge on the flushed re-read.
      const ok = sim.writeFile(taskId, path, content);
      flush();
      return ok;
    },
    createRosterAgent(input) {
      const agentId = sim.createRosterAgent(input);
      flush();
      if (agentId !== null) {
        store.getState().pushEvent(`Agent recruited — ${input.role} ${agentId} joins the roster`, 'info');
      }
      return agentId;
    },
    deleteRosterAgent(agentId) {
      sim.deleteRosterAgent(agentId);
      flush();
      store.getState().pushEvent(`Agent released — ${agentId} departs the roster`, 'info');
    },
    assignTaskAgent(taskId, role, agentId) {
      sim.assignTaskAgent(taskId, role, agentId);
      flush();
      const title = store.getState().board.cards[taskId]?.view.title ?? taskId;
      const text = agentId !== null
        ? `Assigned ${agentId} as ${role} to ${title}`
        : `Unassigned ${role} from ${title}`;
      store.getState().pushEvent(text, 'info', taskId);
    },
    assignTaskHuman(taskId, assign) {
      sim.assignTaskHuman(taskId, assign);
      flush();
      const title = store.getState().board.cards[taskId]?.view.title ?? taskId;
      store.getState().pushEvent(
        assign ? `Human review assigned to ${title}` : `Human review unassigned from ${title}`,
        'info',
        taskId,
      );
    },
    focusInquiryCard(taskId) {
      const state = store.getState();
      const card = state.board.cards[taskId];
      if (!card) return;
      if (card.view.column === 'human-review') {
        state.openReview(taskId);
      } else {
        state.openInspectorCard(taskId);
        state.setInspectorTab('transcript');
      }
    },
  };

  return {
    flush,
    orders,
    dispose() {
      disposed = true;
      unsubscribe();
    },
  };
}

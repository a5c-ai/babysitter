/**
 * Tick-driven deterministic simulation — kanban model (SPEC §7 as amended by
 * SPEC-V3 §V3-1/§V3-2/§V3-5).
 *
 * The world is a board of five columns (backlog | do | ai-review |
 * human-review | approved) whose cards are tasks. There are NO idle agents
 * and no pre-spawned fleet: agents exist only while attached to a card.
 *
 * Lifecycle (SPEC-V3 §V3-2):
 *   card enters DO        -> a worker agent of the kind-mapped adapter spawns
 *                            (stack children each get their own worker);
 *   work complete         -> auto-move to AI REVIEW; worker despawns; 1–2
 *                            REVIEWER agents of a DIFFERENT adapter spawn;
 *   AI verdict (per seed) -> PASS: HUMAN REVIEW (or APPROVED when yolo);
 *                            REJECT: back to DO with feedback + fresh worker;
 *   HUMAN REVIEW          -> no agents; user verdicts via moveCard;
 *   APPROVED              -> an INTEGRATION agent merges (rebase /
 *                            conflict-fix / integration-test events) ending
 *                            in the MERGED terminal state, then despawns.
 * Agents despawn whenever their card leaves their column.
 *
 * Kept systems, adapted to the column model:
 *   - memory (SPEC-V2 §V2-3): unified 40–60-record graph across 3–4 silos;
 *     ACTIVE agents emit `memory_query` (held pieces) and `memory_update`;
 *   - per-card babysitter process run (SPEC-V2 §V2-5): kind-derived phase
 *     pipeline, journal events per phase, breakpoint effect pending while an
 *     inquiry is open, ObservedRunState derivation;
 *   - workspace changes (SPEC-V2 §V2-7): files+diffs accumulate while in DO,
 *     reviewer notes in AI REVIEW, integration applies the patch.
 *
 * Inquiries (SPEC-V3 §V3-5): `hook.request` payload carries
 * `{ question, options: [{ id, caption, detail?, tone? }] }` (2–5 options;
 * icons attach in the microagent phase); `hook.decision` is extended with
 * `optionId`; the sim branches deterministically per option (phase label +
 * distinct follow-up events).
 *
 * Determinism rules: no Date.now(), no Math.random() — the sim clock is
 * `epochMs + tick * TICK_MS` and all randomness flows through one seeded
 * Prng. Same seed + same verb sequence => identical board + frame stream.
 *
 * Verb surface (v1-PROTOCOL GAP, raise upstream): gateway protocol v1 has no
 * board verbs, so `moveCard` / `setYolo` / `createTask` / `answerInquiry`
 * ride a sim-local client command channel exposed directly on this class
 * (the UI test-hooks API binds them). `session.message` remains for
 * steer/abort of ACTIVE agents; `hook.decision` (with the `optionId`
 * extension) resolves inquiries.
 */

import type { AgentEvent, CostRecord } from '../../contracts/adapter-events';
import type {
  EffectKind,
  JournalEvent,
  JournalEventType,
  ObservedRunState,
  PendingEffectsByKind,
} from '../../contracts/babysitter-run';
import type {
  AgentSummary,
  ClientFrame,
  HookRequestFrame,
  RunEntry,
  ServerFrame,
  SessionEntry,
  SessionMessageFrame,
} from '../../contracts/gateway-protocol';
import type { GraphRecord } from '../../contracts/kradle-memory';
import type {
  AgentWorkspacePhase,
  TestEvidenceStatus,
  WorkspaceGitStatus,
} from '../../contracts/kradle-workspace';
import type {
  AgentRunPhase,
  CommanderTask,
  KradlePhase,
  KradleResourcePhase,
} from '../../contracts/kradle-resources';
import type { KradleAgentStack, KradleAgentStackInput } from '../../contracts/kradle-stack';
import { hashString, Prng } from './prng';
import type { AdapterName, Scenario, TaskKind } from './scenario';
import {
  ADAPTERS,
  DEFAULT_STACK_BY_KIND,
  generateScenario,
  MODELS_BY_ADAPTER,
  PARENT_TASK_LABEL,
  SEEDED_STACKS,
  TASK_KINDS,
  TASK_TITLES,
  WORKER_ADAPTER_BY_KIND,
} from './scenario';

// ---------------------------------------------------------------------------
// Sim-local domain types (NOT contracts — UI/game-layer vocabulary)
// ---------------------------------------------------------------------------

/**
 * Project an `AgentDispatchRun.status.phase` (the run lifecycle superset) down
 * to the 4-value resource phase the `SimTaskView`/`SimMemorySiloView` rows
 * carry. The mock only ever stores `'Ready'`/`'Pending'` in
 * `card.resource.status.phase`, so this is behavior-preserving; it stays total
 * for the wider `AgentRunPhase` type the contract now uses.
 */
function toResourcePhase(phase: AgentRunPhase): KradleResourcePhase {
  switch (phase) {
    case 'Ready':
    case 'Pending':
    case 'Blocked':
    case 'Error':
      return phase;
    case 'succeeded':
    case 'Succeeded':
    case 'Completed':
      return 'Ready';
    case 'failed':
    case 'cancelled':
    case 'Cancelled':
      return 'Error';
    case 'waiting-for-approval':
    case 'AwaitingApproval':
      return 'Blocked';
    default:
      // pending/queued/running and their capitalized variants → Pending.
      return 'Pending';
  }
}

/** Sim-time advanced per tick. `tick(n)` semantics are UNCHANGED by §V4-4. */
export const TICK_MS = 250;

/**
 * SPEC-V4 §V4-4: default real-time auto-tick interval (was 250ms in v3).
 * Real-time pacing only — never part of tick determinism.
 */
export const DEFAULT_TICK_INTERVAL_MS = 800;

/** §V4-4 speed steps: 0.5x → 1600ms, 1x → 800ms, 2x → 400ms. */
export const SIM_SPEEDS = [0.5, 1, 2] as const;
export type SimSpeed = (typeof SIM_SPEEDS)[number];

/** SPEC-V3 §V3-1 column ids as amended by SPEC-V4 §V4-1 (the release rail). */
export const COLUMNS = [
  'backlog',
  'do',
  'ai-review',
  'human-review',
  'approved',
  'merged',
  'in-production',
] as const;
export type ColumnId = (typeof COLUMNS)[number];

/** §V4-1: in-production cards compact to slim rows after this many ticks. */
export const IN_PRODUCTION_COMPACT_TICKS = 30;

/** Agent roles (SPEC-V3 §V3-2). */
export type AgentRole = 'worker' | 'reviewer' | 'integration';

/** Assignable roles for roster agents (integration is always auto-assigned). */
export type RosterRole = 'worker' | 'reviewer';

/** Active-agent visual states. */
export type AgentState = 'thinking' | 'tool_running' | 'awaiting_input';

/**
 * Unit lifecycle states kept for the v1 store compatibility surface
 * (`SimUnitView.state`). Active agents only ever occupy `thinking`,
 * `tool_running` or `awaiting_approval` under V3.
 */
export type UnitLifecycleState =
  | 'idle'
  | 'dispatching'
  | 'thinking'
  | 'tool_running'
  | 'awaiting_approval'
  | 'blocked'
  | 'completed'
  | 'failed';

/** Task states (v1 compat mapping of the V3 column model). */
export type SimTaskState = 'queued' | 'assigned' | 'in_progress' | 'review' | 'done' | 'failed';

/** SPEC-V3 §V3-5 inquiry kinds (sim variety). */
export type InquiryKind = 'strategy' | 'fix-approach' | 'dependency-version' | 'tool-approval';

/** SPEC-V3 §V3-5 InquiryOption — icon-less here; icons attach in the microagent phase. */
export interface SimInquiryOption {
  id: string;
  caption: string;
  detail?: string;
  tone?: 'normal' | 'danger' | 'primary';
}

export interface SimInquiryPayload {
  question: string;
  options: SimInquiryOption[];
}

// --- run.event-enveloped sim-local payloads (open `event` record) -----------

export interface CardMovedEventPayload {
  type: 'card_moved';
  runId: string;
  agent: string;
  timestamp: number;
  taskId: string;
  from: ColumnId;
  to: ColumnId;
  reason:
    | 'user-move'
    | 'work-complete'
    | 'review-pass'
    | 'review-pass-yolo'
    | 'review-rejected'
    | 'aborted'
    | 'integration-complete'
    | 'reverted'
    | 'release-shipped'
    | 'rolled-back';
  /**
   * v5-r0 (§V4-1 as amended): release-train wagon index. Present ONLY on
   * `release-shipped` moves — the SIM transition is atomic (all wagons move
   * in the verb call); the ANIMATION layer staggers the glide per index.
   */
  stagger?: number;
}

export interface SimLocalEventPayload {
  type:
    | 'task_created'
    | 'task_prioritized'
    | 'yolo_set'
    | 'card_merged'
    | 'phase_started'
    | 'phase_completed'
    | 'review_note'
    | 'review_feedback'
    | 'review_verdict'
    | 'integration_step'
    | 'inquiry_resolved'
    | 'inquiry_followup'
    | 'memory_query'
    | 'memory_update'
    | 'workspace_change'
    | 'reverted'
    | 'release_shipped'
    | 'rolled_back'
    | 'task_updated'
    | 'stack_forged'
    | 'process_updated'
    | 'agent_recruited'
    | 'agent_released'
    | 'task_agent_assigned'
    | 'task_human_assigned';
  runId: string;
  agent: string;
  timestamp: number;
  taskId: string;
  [key: string]: unknown;
}

// --- views -------------------------------------------------------------------

export interface SimCardView {
  taskId: string;
  taskKind: TaskKind;
  title: string;
  repository: string;
  workspaceId: string;
  column: ColumnId;
  /** Backlog ordering (lower = nearer the top). */
  order: number;
  yolo: boolean;
  /** Terminal seal (SPEC-V3 §V3-2): integration finished. */
  merged: boolean;
  progress: number;
  parentId: string | null;
  childIds: string[];
  /** Active agents attached to this card. */
  agentIds: string[];
  attempt: number;
  feedback: string | null;
  dirtyFileCount: number;
  hasPendingInquiry: boolean;
  /** §V4-5: resolved agent-stack binding (explicit, else kind-mapped default). */
  stackRef: string;
  /** §V4-5 card editor description field. */
  description: string;
  /** §V4-1: release train this card shipped on (in-production only). */
  releaseId: string | null;
  /** §V4-1: in-production cards compact to slim rows after 30 ticks. */
  compacted: boolean;
  /** Roster agent explicitly assigned as worker (null = auto-select from stack). */
  workerAgentId: string | null;
  /** Roster agent explicitly assigned as reviewer (null = auto-select). */
  reviewerAgentId: string | null;
  /** Human operator assigned for human-review/breakpoints ('user' or null). */
  humanAssigneeId: string | null;
}

export interface SimAgentView {
  unitId: string;
  agent: AdapterName;
  model: string;
  /** §V5-4: the session's creature name (avatar tooltip "<creature> — session of <stack>"). */
  creatureName: string;
  /** §V4-5: the agent-stack this agent was spawned from. */
  stackRef: string;
  stackName: string;
  role: AgentRole;
  taskId: string;
  state: AgentState;
  paused: boolean;
  runId: string;
  pendingHookId: string | null;
  /** Memory record ids currently held (SPEC-V2 §V2-3). */
  heldPieces: string[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    cachedTokens: number;
  };
  cost: CostRecord;
  turnCount: number;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

// --- v5 sessions (SPEC-V5 §V5-1) ---------------------------------------------

/** SPEC-V5 §V5-1 session lifecycle status. */
export type SessionStatus = 'active' | 'completed' | 'aborted';

/**
 * One persisted transcript entry (message / tool call) of a session. The
 * ACTIVE agent streams straight into this ring (no forking): despawn merely
 * flips the session status — the transcript is already persistent.
 */
export interface SimSessionTranscriptEntry {
  seq: number;
  tick: number;
  timestamp: number;
  kind: 'message' | 'thinking' | 'tool_call' | 'tool_result' | 'user' | 'event';
  text: string;
  toolName?: string;
}

/**
 * SPEC-V5 §V5-1 SessionRecord view: persists after despawn. `sessionId` is
 * the agent's unitId; `title` is "creature name + role". Coordination
 * sessions (stack parent cards, one per attempt) carry `coordination: true`
 * with role `worker` and a "<name> the Coordinator" title.
 */
export interface SimSessionView {
  sessionId: string;
  title: string;
  creatureName: string;
  agent: AdapterName;
  model: string;
  stackRef: string;
  stackName: string;
  role: AgentRole;
  coordination: boolean;
  taskId: string;
  attempt: number;
  runId: string | null;
  parentSessionId: string | null;
  reviewOfSessionId: string | null;
  status: SessionStatus;
  startedTick: number;
  endedTick: number | null;
  turnCount: number;
  messageCount: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    cachedTokens: number;
  };
  cost: CostRecord;
  transcriptLength: number;
}

/** §V5-1 `getSession(sessionId)` envelope: record + transcript. */
export interface SimSessionDetailView {
  record: SimSessionView;
  transcript: SimSessionTranscriptEntry[];
}

/**
 * SPEC-KRADLE-MODEL §4.1 — one `AgentDispatchAttempt` under a run: the
 * retry/resume/fork/continuation unit (`AgentDispatchRun → AgentDispatchAttempt
 * → AgentSession`). A card surfaces its attempts; sessions roll up from the
 * active attempt. This is a kradle-only projection (the mock sim has no attempt
 * records yet); UI-only metadata stays out.
 */
export interface SimAttemptView {
  attemptId: string;
  /** The owning `AgentDispatchRun` (card) name. */
  taskId: string;
  /** Why this attempt was created (`initial|retry|resume|repair|…`). */
  attemptReason: string;
  /** The attempt lifecycle phase as reported by kradle (both casings tolerated). */
  phase: string;
  /** True for the newest attempt of the run (drives the card's live state). */
  active: boolean;
  /** Terminal reason, when the attempt has completed. */
  exitReason: string | null;
  /** `AgentSession` ids attached to this attempt. */
  sessionIds: string[];
  startedAt: number | null;
  endedAt: number | null;
}

/**
 * A recruited agent in the operator's roster — a named, stackbound worker
 * or reviewer available to be assigned to specific tasks before they enter
 * their working column. Distinct from auto-spawned ephemeral AgentRecords.
 */
export interface SimRosterAgentView {
  agentId: string;
  name: string;
  stackRef: string;
  stackName: string;
  adapter: AdapterName;
  model: string;
  role: RosterRole;
  status: 'available' | 'assigned';
  assignedTaskId: string | null;
  assignedRole: RosterRole | null;
}

export interface SimInquiryView {
  hookRequestId: string;
  runId: string;
  taskId: string;
  unitId: string;
  inquiryKind: InquiryKind;
  question: string;
  options: SimInquiryOption[];
  deadlineTs: number;
}

export interface SimWorkspaceFileView {
  path: string;
  status: 'A' | 'M' | 'D';
  additions: number;
  deletions: number;
  /** Synthetic unified diff (5–25 lines, references the task title). */
  diff: string;
}

export interface SimWorkspaceView {
  taskId: string;
  phase: AgentWorkspacePhase;
  gitStatus: WorkspaceGitStatus;
  files: SimWorkspaceFileView[];
  testEvidence: { status: TestEvidenceStatus; summary?: string };
  reviewerNotes: string[];
}

export interface SimRunObservationView {
  runId: string;
  taskId: string;
  observedState: ObservedRunState;
  pendingEffectsByKind: PendingEffectsByKind;
  phases: Array<{ label: string; status: 'done' | 'current' | 'pending' }>;
  journal: JournalEvent[];
}

// --- v5 registry workspaces view (SPEC-V5 §V5-3) ------------------------------

/** Per-card git line inside a workspace summary (branch/sha/dirty). */
export interface SimWorkspaceCardGitView {
  taskId: string;
  title: string;
  branch: string;
  headSha: string;
  dirty: boolean;
  dirtyFileCount: number;
}

/**
 * SPEC-V5 §V5-3 `listWorkspaces()` row: one entry per scenario workspace,
 * derived PURELY from existing card/session state (no rng draws — the view
 * is a read like every other list view). `cards` carries the per-card
 * gitStatus lines; `gitStatus` mirrors the first (sorted) card's workspace
 * as the representative branch/sha for the row.
 */
export interface SimWorkspaceSummaryView {
  workspaceId: string;
  name: string;
  repository: string;
  /** Representative phase (first card's workspace), 'ready' when empty. */
  phase: AgentWorkspacePhase;
  /** Representative gitStatus (first card), null when no cards yet. */
  gitStatus: WorkspaceGitStatus | null;
  /** True when ANY of its cards' workspaces is dirty (aggregate). */
  dirty: boolean;
  cardIds: string[];
  cards: SimWorkspaceCardGitView[];
  /** ACTIVE session ids across its cards (§V5-1 registry cross-links). */
  activeSessionIds: string[];
}

export interface SimMemorySiloView {
  name: string;
  phase: KradlePhase;
  currentCommit: string;
  recordCount: number;
  owner: string;
  recordIds: string[];
}

// --- v4 views (SPEC-V4 §V4-5/§V4-6/§V4-8/§V4-9 + terminal git log) -----------

/** §V4-5 `listStacks()` row: a stack plus its sim id and provenance. */
export interface SimStackView {
  stackRef: string;
  name: string;
  /** False for the 4 seeded stacks; true for foundry-forged stk-cNN stacks. */
  custom: boolean;
  stack: KradleAgentStack;
}

/** §V4-5 `updateTask(taskId, patch)` patch shape (card editor form). */
export interface UpdateTaskPatch {
  title?: string;
  taskKind?: TaskKind;
  description?: string;
  yolo?: boolean;
  /** Legal only while the card sits in backlog. `null` detaches. */
  parentId?: string | null;
  workspaceId?: string;
  stackRef?: string;
}

/** §V4-6 runs-registry row (`listRuns()`, newest first). */
export interface SimRunView {
  runId: string;
  taskId: string;
  taskKind: TaskKind;
  /** `commander/<kind>@v<rev>` — pinned at run creation (§V4-6). */
  processId: string;
  processRevision: number;
  observedState: ObservedRunState;
  phases: Array<{ label: string; status: 'done' | 'current' | 'pending' }>;
  pendingEffectsByKind: PendingEffectsByKind;
  tokens: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    cachedTokens: number;
  };
  costUsd: number;
  startedAt: number;
  endedAt: number | null;
}

/** §V4-6 per-kind phase pipeline template (`listProcessTemplates()`). */
export interface SimProcessTemplateView {
  kind: TaskKind;
  processId: string;
  revision: number;
  phases: string[];
}

/** §V4-8 workspace file-tree node (`getWorkspaceTree(taskId)`). */
export interface SimFileTreeNode {
  name: string;
  path: string;
  type: 'dir' | 'file';
  children?: SimFileTreeNode[];
}

/** §V4-9 memory I/O ledgers (`getMemoryIO(ref)`). */
export interface SimMemoryReadEntry {
  recordId: string;
  kind: string;
  silo: string;
  tick: number;
  unitId: string;
}

export interface SimMemoryWriteEntry {
  updateId: string;
  silo: string;
  changes: Array<{ path: string; action: string; reason: string }>;
  phase: string;
  tick: number;
  unitId: string;
}

export interface SimMemoryIOView {
  read: SimMemoryReadEntry[];
  written: SimMemoryWriteEntry[];
}

/** §V4-7 `git log` — journal/phase-derived commits (`getGitLog(taskId)`). */
export interface SimGitCommitView {
  sha: string;
  message: string;
  tick: number;
}

// --- v1 compatibility views (consumed by the existing game store) ------------

export interface SimUnitView {
  unitId: string;
  agent: string;
  model: string;
  title: string;
  workspaceId: string;
  state: UnitLifecycleState;
  paused: boolean;
  taskId: string | null;
  runId: string | null;
  turnIndex: number;
  turnCount: number;
  messageCount: number;
  pendingHookId: string | null;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    cachedTokens: number;
  };
  cost: CostRecord;
  createdAt: number;
  updatedAt: number;
}

export interface SimTaskView {
  taskId: string;
  taskKind: string;
  repository: string;
  workspaceId: string;
  title: string;
  state: SimTaskState;
  phase: KradlePhase;
  progress: number;
  assigneeIds: string[];
  priority: number;
}

export interface SimHookView {
  hookRequestId: string;
  runId: string;
  unitId: string;
  hookKind: string;
  payload: Record<string, unknown>;
  deadlineTs: number;
}

/** Fully JSON-serializable deep snapshot of sim state (determinism testing). */
export interface SimSnapshot {
  seed: number;
  tick: number;
  simTimeMs: number;
  rngDraws: number;
  counters: {
    runs: number;
    hooks: number;
    tools: number;
    agents: number;
    creations: number;
    stacks: number;
    releases: number;
    memoryUpdates: number;
  };
  cards: SimCardView[];
  agents: SimAgentView[];
  inquiries: SimInquiryView[];
  workspaces: SimWorkspaceView[];
  runs: RunEntry[];
  stacks: SimStackView[];
  processTemplates: SimProcessTemplateView[];
  runLedger: SimRunView[];
  /** §V5-1 persistent session registry (records; transcripts via getSession). */
  sessions: SimSessionView[];
}

// ---------------------------------------------------------------------------
// Phase pipelines (SPEC-V2 §V2-5: derived from task kind)
// ---------------------------------------------------------------------------

export const PHASES_BY_KIND: Record<TaskKind, readonly string[]> = {
  fix: ['reproduce', 'diagnose', 'patch', 'verify'],
  review: ['survey', 'annotate', 'verdict'],
  'root-cause-analysis': ['reproduce', 'hypothesize', 'bisect', 'conclude'],
  'test-coverage': ['map gaps', 'add cases', 'run suite'],
  docs: ['outline', 'draft', 'polish prose'],
  research: ['survey', 'synthesize', 'cite sources'],
  polish: ['capture plates', 'score', 'apply findings'],
  deploy: ['dry run', 'ship', 'watch'],
  migrate: ['plan steps', 'execute step', 'verify parity'],
  implement: ['plan', 'implement', 'verify', 'review'],
};

// ---------------------------------------------------------------------------
// Inquiry tables (SPEC-V3 §V3-5 — deterministic option palettes)
// ---------------------------------------------------------------------------

interface InquiryTemplate {
  inquiryKind: InquiryKind;
  question: (title: string) => string;
  options: SimInquiryOption[];
}

const INQUIRY_TEMPLATES: readonly InquiryTemplate[] = [
  {
    inquiryKind: 'strategy',
    question: (title) => `Choose the working strategy for "${title}"`,
    options: [
      { id: 'incremental', caption: 'Incremental', detail: 'Small reviewed steps, slower but safe', tone: 'primary' },
      { id: 'big-bang', caption: 'Big Bang', detail: 'One sweeping change, fastest path', tone: 'danger' },
      { id: 'expand-contract', caption: 'Expand-Contract', detail: 'Parallel structures, migrate, then prune', tone: 'normal' },
    ],
  },
  {
    inquiryKind: 'fix-approach',
    question: (title) => `Pick the fix approach for "${title}"`,
    options: [
      { id: 'patch-forward', caption: 'Patch Forward', detail: 'Repair in place on the current branch', tone: 'primary' },
      { id: 'revert-redo', caption: 'Revert & Redo', detail: 'Back out the regression, reland cleanly', tone: 'normal' },
      { id: 'quarantine', caption: 'Quarantine', detail: 'Isolate the failure behind a flag for now', tone: 'danger' },
    ],
  },
  {
    inquiryKind: 'dependency-version',
    question: (title) => `Select the dependency version for "${title}"`,
    options: [
      { id: 'pin-current', caption: 'Pin Current', detail: 'Freeze the working version', tone: 'normal' },
      { id: 'minor-bump', caption: 'Minor Bump', detail: 'Take the latest compatible minor', tone: 'primary' },
      { id: 'major-upgrade', caption: 'Major Upgrade', detail: 'Cross the breaking-change line', tone: 'danger' },
      { id: 'hold', caption: 'Hold', detail: 'Defer the decision to the next cycle', tone: 'normal' },
    ],
  },
  {
    // Classic 2-option tool approval — the degenerate case (SPEC-V3 §V3-5).
    inquiryKind: 'tool-approval',
    question: (title) => `Agent wants to run \`git push\` for "${title}" — proceed?`,
    options: [
      { id: 'proceed', caption: 'Proceed', detail: 'Allow the gated tool call', tone: 'primary' },
      { id: 'stand-down', caption: 'Stand Down', detail: 'Deny and rethink', tone: 'danger' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Workspace path pools per kind (plausible changed files, SPEC-V2 §V2-7)
// ---------------------------------------------------------------------------

const FILE_POOLS: Record<TaskKind, readonly string[]> = {
  implement: ['src/core/mechanism.ts', 'src/core/mechanism.test.ts', 'src/index.ts', 'src/core/registry.ts'],
  review: ['REVIEW_NOTES.md', 'src/review/checklist.ts', 'docs/review-log.md'],
  fix: ['src/engine/regulator.ts', 'src/engine/regulator.test.ts', 'src/engine/valves.ts', 'CHANGELOG.md'],
  'root-cause-analysis': ['docs/rca/findings.md', 'src/diagnostics/probe.ts', 'src/diagnostics/probe.test.ts'],
  polish: ['src/ui/plates.css', 'src/ui/ornament.tsx', 'docs/style-ledger.md'],
  'test-coverage': ['src/core/mechanism.test.ts', 'src/engine/valves.test.ts', 'vitest.config.ts'],
  docs: ['docs/atlas.md', 'README.md', 'docs/glossary.md'],
  deploy: ['deploy/manifest.yaml', 'scripts/launch.sh', 'deploy/rollback.md'],
  research: ['docs/research/survey.md', 'docs/research/citations.md', 'notes/leads.md'],
  migrate: ['migrations/0007-vault.sql', 'src/storage/vault.ts', 'src/storage/vault.test.ts', 'docs/migration-plan.md'],
};

/** §V4-8 (v4-r0) seed-picked vocabulary for plausible per-extension content. */
const CONTENT_NOUNS = [
  'manifold',
  'regulator',
  'flywheel',
  'servo',
  'plenum',
  'dynamo',
  'lattice',
  'gimbal',
  'capacitor',
  'aether',
] as const;
const CONTENT_VERBS = [
  'calibrate',
  'engage',
  'temper',
  'align',
  'transmute',
  'regulate',
  'prime',
  'anneal',
] as const;

/**
 * v5-r0 transcript copy: each phrase SLOT now carries deterministic variants.
 * The slot is still the single rng draw the caller always consumed; the
 * variant is derived from the session's transcript step index (transcriptSeq)
 * — NO new rng draws, so the deterministic stream is byte-identical across
 * same-seed engines while transcripts stop parroting one fixed line per slot.
 */
const THINKING_PHRASES: ReadonlyArray<readonly string[]> = [
  [
    'Scanning the objective perimeter... ',
    'Sweeping the objective perimeter a second time... ',
    'Re-walking the objective perimeter for stragglers... ',
  ],
  [
    'Cross-referencing the failing assertions... ',
    'Collating the failing assertions against the ledger... ',
    'Sifting the failing assertions for a common root... ',
  ],
  [
    'The diff suggests a deeper structural issue. ',
    'The diff hints the rot runs beneath this module. ',
    'The diff points at a seam the tests never pressed. ',
  ],
  [
    'Weighing two repair strategies... ',
    'Balancing a quick patch against a proper mend... ',
    'Holding both repair routes up to the light... ',
  ],
  [
    'Tracing the regression to its origin commit. ',
    'Following the regression back through the log. ',
    'Bisecting the history toward the offending change. ',
  ],
  [
    'Formulating a minimal patch plan. ',
    'Sketching the smallest cut that heals the fault. ',
    'Drafting a patch plan that touches nothing it need not. ',
  ],
];

const TEXT_PHRASES: ReadonlyArray<readonly string[]> = [
  [
    'Applying the fix to the affected module. ',
    'Landing the fix in the affected module. ',
    'Threading the fix through the affected module. ',
  ],
  [
    'Updating tests to cover the new branch. ',
    'Adding a regression test over the new branch. ',
    'Extending the suite to pin the new branch. ',
  ],
  [
    'Refactoring the helper for clarity. ',
    'Untangling the helper so it reads plainly. ',
    'Tidying the helper before it calcifies. ',
  ],
  [
    'Verifying the change against the spec. ',
    'Checking the change clause by clause against the spec. ',
    'Re-reading the spec to confirm the change holds. ',
  ],
  [
    'Documenting the decision inline. ',
    'Inscribing the rationale beside the code. ',
    'Leaving a note for the next unfortunate reader. ',
  ],
  [
    'Consolidating duplicate logic. ',
    'Folding the duplicated logic into one place. ',
    'Retiring the second copy of this logic. ',
  ],
];

/** Pick the step-indexed variant of a drawn phrase slot (no rng involved). */
function phraseVariant(pools: ReadonlyArray<readonly string[]>, slot: number, step: number): string {
  const variants = pools[slot]!;
  return variants[step % variants.length]!;
}

const TOOL_NAMES = ['Bash', 'Read', 'Edit', 'Grep', 'WebFetch'] as const;

const REVIEW_NOTE_TEMPLATES = [
  (file: string) => `Consider tightening the error handling in ${file}.`,
  (file: string) => `${file}: naming is clear; add a regression test for the edge case.`,
  (file: string) => `The diff in ${file} looks correct; verify the rollback path.`,
  (file: string) => `${file} duplicates logic from the registry — extract a helper.`,
  (file: string) => `Second pass over ${file}: the boundary condition still worries me.`,
  (file: string) => `${file} reads well now; document the invariant inline before merge.`,
] as const;

/**
 * v4-r0: pick a reviewer note, varying the pool per attempt and skipping
 * notes already inscribed on the card (no duplicate ledger lines). Pure —
 * `drawIndex` is the single rng draw the caller already consumed.
 */
export function pickReviewerNote(
  file: string,
  attempt: number,
  existing: readonly string[],
  drawIndex: number,
): string {
  const len = REVIEW_NOTE_TEMPLATES.length;
  const start = (drawIndex + Math.max(0, attempt - 1)) % len;
  for (let offset = 0; offset < len; offset += 1) {
    const note = REVIEW_NOTE_TEMPLATES[(start + offset) % len]!(file);
    if (!existing.includes(note)) return note;
  }
  return REVIEW_NOTE_TEMPLATES[start]!(file);
}

const REJECT_FEEDBACK = [
  'Changes requested: the verify phase is missing coverage for the failure path.',
  'Changes requested: the patch leaks state across iterations — isolate it.',
  'Changes requested: documentation does not match the implemented behavior.',
] as const;

/** Per-adapter token pricing used to accrue mock cost (USD per token). */
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-code': { input: 3e-6, output: 15e-6 },
  codex: { input: 2.5e-6, output: 10e-6 },
  'gemini-cli': { input: 1.5e-6, output: 7e-6 },
  pi: { input: 1e-6, output: 5e-6 },
};

/**
 * Inquiry deadline: 15s sim time (60 ticks). Unanswered inquiries auto-default
 * to their first option so the board never deadlocks (deterministic).
 */
const HOOK_DEADLINE_MS = 15_000;
const SERVER_VERSION = 'mock-commander/3.0.0';
const JOURNAL_CAP = 100;

/** §V5-1/§V5-6 memory bound: per-session transcript ring (~200 entries). */
export const SESSION_TRANSCRIPT_CAP = 200;

/** §V5-1: clockwork-creature names for session titles (deterministic mint). */
const CREATURE_NAMES = [
  'Brassbeak',
  'Cogsworth',
  'Pinion',
  'Gearhart',
  'Sprocketta',
  'Tinwhistle',
  'Boilerbun',
  'Flywheel',
  'Copperdove',
  'Ratchet',
  'Camshaft',
  'Steamwick',
  'Gimbal',
  'Soldera',
  'Rivetta',
  'Clankston',
  'Pendula',
  'Axleby',
  'Vapoura',
  'Dynamo',
  'Quillgear',
  'Ironmoth',
  'Bellowsby',
  'Cinderlatch',
  'Mainspring',
  'Thimblecog',
  'Valvette',
  'Smokestack',
  'Borewell',
  'Latchkey',
  'Turbina',
  'Weldwyn',
] as const;

/** §V5-1 title suffix per role ("creature name + role"). */
const ROLE_TITLES: Record<AgentRole, string> = {
  worker: 'the Worker',
  reviewer: 'the Reviewer',
  integration: 'the Integrator',
};

// ---------------------------------------------------------------------------
// Internal records
// ---------------------------------------------------------------------------

interface OpenEffect {
  effectId: string;
  kind: EffectKind;
  label: string;
}

interface CardRunRecord {
  runId: string;
  entry: RunEntry;
  seq: number;
  journal: JournalEvent[];
  journalSeq: number;
  phases: string[];
  phaseIndex: number;
  phaseTicksLeft: number;
  openEffects: OpenEffect[];
  effectCounter: number;
  terminal: 'completed' | 'failed' | null;
  /** §V4-6 run registry: pinned process template at creation time. */
  taskId: string;
  taskKind: TaskKind;
  processId: string;
  processRevision: number;
  /** Token/cost totals folded in from despawned agents (live agents add on read). */
  tokens: { inputTokens: number; outputTokens: number; thinkingTokens: number; cachedTokens: number };
  costUsd: number;
}

interface WorkspaceFileRecord {
  path: string;
  status: 'A' | 'M' | 'D';
  additions: number;
  deletions: number;
  diff: string;
}

interface CardWorkspaceRecord {
  phase: AgentWorkspacePhase;
  branch: string;
  headSha: string;
  ahead: number;
  behind: number;
  dirty: boolean;
  files: WorkspaceFileRecord[];
  testEvidence: { status: TestEvidenceStatus; summary?: string };
  reviewerNotes: string[];
}

interface CardRecord {
  taskId: string;
  resource: CommanderTask;
  taskKind: TaskKind;
  parentId: string | null;
  childIds: string[];
  column: ColumnId;
  order: number;
  yolo: boolean;
  merged: boolean;
  progress: number;
  attempt: number;
  feedback: string | null;
  run: CardRunRecord | null;
  ws: CardWorkspaceRecord;
  /** AI-review countdown (parent/single card only). */
  reviewTicksLeft: number;
  /** Integration step machine (approved column). */
  integrationSteps: string[];
  integrationIndex: number;
  integrationTicksLeft: number;
  /** Pending deterministic follow-up events from a resolved inquiry. */
  pendingFollowUps: Array<{ text: string; optionId: string }>;
  /** Inquiries raised in the current DO attempt (capped at 1 per attempt). */
  inquiriesThisAttempt: number;
  workerAdapter: AdapterName | null;
  // --- v4 state ---------------------------------------------------------
  /** §V4-5: explicit stack binding; null = default mapped from taskKind. */
  stackRefOverride: string | null;
  description: string;
  /** §V4-1 release rail bookkeeping. */
  releaseId: string | null;
  inProductionAtTick: number | null;
  /** §V5-1: the parent card's COORDINATION session for the current attempt. */
  coordSessionId: string | null;
  /** §V5-1: the review session whose verdict approved the current attempt. */
  approvingReviewSessionId: string | null;
  /** §V4-8: editor-written file contents (writeFile overrides). */
  fileOverrides: Map<string, string>;
  /** §V4-9 memory I/O ledgers (accumulated from memory_query/memory_update). */
  memoryReads: SimMemoryReadEntry[];
  memoryWrites: SimMemoryWriteEntry[];
  /** Roster agent explicitly assigned as worker (null = auto). */
  workerAgentId: string | null;
  /** Roster agent explicitly assigned as reviewer (null = auto). */
  reviewerAgentId: string | null;
  /** Human operator assigned ('user' or null). */
  humanAssigneeId: string | null;
}

/**
 * §V5-1 persistent session record. The LIVE agent's transcript, counters and
 * token/cost burn live HERE (the active `AgentRecord` references its session)
 * so persistence is free: despawn only flips `status`/`endedTick`.
 */
interface SessionRecord {
  sessionId: string;
  /** Creation order (monotonic) — `listSessions` sorts newest first. */
  order: number;
  title: string;
  creatureName: string;
  agent: AdapterName;
  model: string;
  stackRef: string;
  stackName: string;
  role: AgentRole;
  coordination: boolean;
  taskId: string;
  attempt: number;
  runId: string | null;
  parentSessionId: string | null;
  reviewOfSessionId: string | null;
  status: SessionStatus;
  startedTick: number;
  endedTick: number | null;
  turnCount: number;
  messageCount: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    cachedTokens: number;
  };
  cost: { totalUsd: number; inputTokens: number; outputTokens: number; thinkingTokens: number };
  transcript: SimSessionTranscriptEntry[];
  transcriptSeq: number;
}

interface AgentRecord {
  unitId: string;
  agent: AdapterName;
  model: string;
  stackRef: string;
  stackName: string;
  role: AgentRole;
  taskId: string;
  state: AgentState;
  held: boolean;
  stateTicks: number;
  stateDuration: number;
  pendingHookId: string | null;
  activeToolName: string | null;
  heldPieces: string[];
  /** Frame-stream accumulation state (text_delta/thinking_delta envelopes). */
  accumulatedText: string;
  accumulatedThinking: string;
  /**
   * §V5-1: the persistent session this agent streams into. Transcript,
   * turn/message counters and token/cost burn are stored ON the session
   * (same data live and persisted — no forking).
   */
  session: SessionRecord;
  createdAt: number;
  updatedAt: number;
}

interface InquiryRecord {
  hookRequestId: string;
  runId: string;
  taskId: string;
  unitId: string;
  inquiryKind: InquiryKind;
  question: string;
  options: SimInquiryOption[];
  deadlineTs: number;
  effectId: string;
}

interface RosterAgentRecord {
  agentId: string;
  name: string;
  stackRef: string;
  role: RosterRole;
  assignedTaskId: string | null;
  assignedRole: RosterRole | null;
}

// ---------------------------------------------------------------------------
// ObservedRunState derivation (mirror semantics of the babysitter SDK)
// ---------------------------------------------------------------------------

export function deriveObservedRunState(journal: readonly JournalEvent[]): ObservedRunState {
  let state: ObservedRunState = 'created';
  for (const event of journal) {
    switch (event.type) {
      case 'RUN_CREATED':
        state = 'created';
        break;
      case 'EFFECT_REQUESTED':
      case 'EFFECT_RESOLVED':
      case 'EFFECT_CANCELLED':
        state = 'waiting';
        break;
      case 'RUN_COMPLETED':
        state = 'completed';
        break;
      case 'RUN_HALTED':
        state = 'halted';
        break;
      case 'RUN_FAILED':
      case 'PROCESS_RUNTIME_ERROR':
        state = 'failed';
        break;
    }
  }
  return state;
}

// ---------------------------------------------------------------------------
// Simulation engine
// ---------------------------------------------------------------------------

export interface SimulationOptions {
  seed: number;
  /** Override the generated scenario (tests). */
  scenario?: Scenario;
}

export class Simulation {
  readonly seed: number;
  readonly scenario: Scenario;

  private readonly rng: Prng;
  private readonly cards = new Map<string, CardRecord>();
  private readonly agents = new Map<string, AgentRecord>();
  /** §V5-1: persistent session registry — survives agent despawn. */
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly usedCreatureNames = new Set<string>();
  private sessionOrderCounter = 0;
  private readonly runs = new Map<string, CardRunRecord>();
  private readonly inquiries = new Map<string, InquiryRecord>();
  private readonly listeners = new Set<(frame: ServerFrame) => void>();

  private tickCount = 0;
  private pausedFlag = false;
  private interval: ReturnType<typeof setInterval> | null = null;
  private runCounter = 0;
  private hookCounter = 0;
  private toolCounter = 0;
  private agentCounter = 0;
  private creationCounter = 0;
  private ulidCounter = 0;
  private orderCounter = 0;
  /** Operator roster agents (named workers/reviewers assignable to tasks). */
  private readonly rosterAgents = new Map<string, RosterAgentRecord>();
  private rosterCounter = 0;
  // --- v4 state -------------------------------------------------------------
  /** §V4-5 agent stacks: seeded + foundry-forged, keyed by stackRef. */
  private readonly stacks = new Map<string, { stackRef: string; custom: boolean; stack: KradleAgentStack }>();
  private stackCounter = 0;
  /** §V4-1 release trains. */
  private releaseCounter = 0;
  /** §V4-6 per-kind phase pipeline templates (revision-bumped on edit). */
  private readonly templates = new Map<TaskKind, { revision: number; phases: string[] }>();
  private memoryUpdateCounter = 0;
  /** §V4-4 real-time pacing only — NEVER consulted by tick logic. */
  private speedValue: SimSpeed = 1;

  constructor(options: SimulationOptions) {
    this.seed = options.seed >>> 0;
    this.scenario = options.scenario ?? generateScenario(this.seed);
    this.rng = new Prng(this.seed);

    for (const seeded of SEEDED_STACKS) {
      this.stacks.set(seeded.stackRef, {
        stackRef: seeded.stackRef,
        custom: false,
        stack: JSON.parse(JSON.stringify(seeded.stack)) as KradleAgentStack,
      });
    }
    for (const kind of TASK_KINDS) {
      this.templates.set(kind, { revision: 1, phases: [...PHASES_BY_KIND[kind]] });
    }

    // Seed 3 roster agents from distinct stacks (deterministic names).
    const SEED_ROSTER: Array<{ stackRef: string; name: string; role: RosterRole }> = [
      { stackRef: SEEDED_STACKS[0]!.stackRef, name: 'Cogsworth', role: 'worker' },
      { stackRef: SEEDED_STACKS[1]!.stackRef, name: 'Pendula', role: 'reviewer' },
      { stackRef: SEEDED_STACKS[2]!.stackRef, name: 'Brassbeak', role: 'worker' },
    ];
    for (const seed of SEED_ROSTER) {
      this.rosterCounter += 1;
      const agentId = `ra-${String(this.rosterCounter).padStart(3, '0')}`;
      this.rosterAgents.set(agentId, {
        agentId,
        name: seed.name,
        stackRef: seed.stackRef,
        role: seed.role,
        assignedTaskId: null,
        assignedRole: null,
      });
    }

    for (const card of this.scenario.cards) {
      this.addCard(card.resource, card.taskKind, card.parentId);
    }
  }

  // -------------------------------------------------------------------------
  // Clock / control surface (window.__commander.sim binds to these)
  // -------------------------------------------------------------------------

  get paused(): boolean {
    return this.pausedFlag;
  }

  get tickIndex(): number {
    return this.tickCount;
  }

  /** Current simulated wall-clock time (never Date.now()). */
  now(): number {
    return this.scenario.epochMs + this.tickCount * TICK_MS;
  }

  pause(): void {
    this.pausedFlag = true;
  }

  resume(): void {
    this.pausedFlag = false;
  }

  /** Advance the sim by `n` ticks regardless of the paused flag (single-step). */
  tick(n = 1): void {
    for (let i = 0; i < n; i += 1) {
      this.stepOnce();
    }
  }

  /**
   * Begin auto-ticking (skips ticks while paused). Defaults to the §V4-4
   * speed-derived interval; an explicit override wins (tests).
   */
  start(intervalMs?: number): void {
    if (this.interval !== null) return;
    this.intervalOverride = intervalMs ?? null;
    this.interval = setInterval(() => {
      if (!this.pausedFlag) {
        this.stepOnce();
      }
    }, intervalMs ?? this.tickIntervalMs);
  }

  stop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // --- §V4-4 speed control (real-time pacing ONLY; tick(n) untouched) --------

  private intervalOverride: number | null = null;

  /** Current speed multiplier (0.5 | 1 | 2). */
  get speed(): SimSpeed {
    return this.speedValue;
  }

  /** Current real-time auto-tick interval: 1600/800/400ms for 0.5x/1x/2x. */
  get tickIntervalMs(): number {
    return DEFAULT_TICK_INTERVAL_MS / this.speedValue;
  }

  /**
   * §V4-4 `setSpeed(0.5|1|2)`. Restarts a running auto-tick loop at the new
   * interval. Deliberately NOT journaled and rng-free: speed is real-time
   * pacing only and must never affect tick determinism.
   */
  setSpeed(speed: number): boolean {
    if (!(SIM_SPEEDS as readonly number[]).includes(speed)) {
      this.emit({
        type: 'error',
        code: 'invalid_speed',
        message: `Speed must be one of ${SIM_SPEEDS.join('/')}; got ${String(speed)}`,
      });
      return false;
    }
    this.speedValue = speed as SimSpeed;
    if (this.interval !== null) {
      this.stop();
      this.start(this.intervalOverride ?? undefined);
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Frame surface
  // -------------------------------------------------------------------------

  onFrame(cb: (frame: ServerFrame) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** Apply a mirrored ClientFrame command. Effects are immediate and visible. */
  handleClientFrame(frame: ClientFrame): void {
    switch (frame.type) {
      case 'auth':
        this.emit({
          type: 'hello',
          protocolVersions: ['1'],
          serverVersion: SERVER_VERSION,
          serverTime: new Date(this.now()).toISOString(),
        });
        return;
      case 'ping':
        this.emit({ type: 'pong' });
        return;
      case 'subscribe':
        if (!this.runs.has(frame.runId)) {
          this.emit({
            type: 'error',
            code: 'run_not_found',
            message: `Unknown run: ${frame.runId}`,
            runId: frame.runId,
          });
        }
        return;
      case 'unsubscribe':
      case 'session.subscribe':
      case 'session.unsubscribe':
      case 'pairing.register':
      case 'pairing.consume':
        return;
      case 'session.start':
        // V3 retires manual agent creation (SPEC-V3: "agents are never
        // created manually") — agents spawn only when cards enter columns.
        this.emit({
          type: 'error',
          code: 'unsupported_in_v3',
          message: 'session.start is retired: agents spawn on demand when a card enters DO',
        });
        return;
      case 'session.message':
        this.handleSessionMessage(frame);
        return;
      case 'hook.decision':
        this.answerInquiry(frame.hookRequestId, frame.optionId ?? null, frame.decision, frame.reason);
        return;
    }
  }

  // -------------------------------------------------------------------------
  // Board verbs (sim-local client command channel — v1-protocol gap)
  // -------------------------------------------------------------------------

  /**
   * SPEC-V3 §V3-1 `moveCard(taskId, column)`. Validates LEGAL user moves:
   * backlog → do; human-review → do | ai-review | approved; backlog → backlog
   * (reorder to bottom). All other movement is automatic and rejected here.
   */
  moveCard(taskId: string, column: ColumnId): boolean {
    const card = this.cards.get(taskId);
    if (!card || !(COLUMNS as readonly string[]).includes(column)) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown task: ${taskId}` });
      return false;
    }
    if (card.parentId !== null) {
      this.emit({
        type: 'error',
        code: 'illegal_move',
        message: `Card ${taskId} is a stack child — drag its parent (the whole stack moves)`,
      });
      return false;
    }
    if (card.merged) {
      this.emit({ type: 'error', code: 'illegal_move', message: `Card ${taskId} is merged (terminal)` });
      return false;
    }
    const from = card.column;
    const legal =
      (from === 'backlog' && (column === 'do' || column === 'backlog')) ||
      (from === 'human-review' && (column === 'do' || column === 'ai-review' || column === 'approved'));
    if (!legal) {
      this.emit({
        type: 'error',
        code: 'illegal_move',
        message: `Illegal user move ${from} -> ${column} for ${taskId} (allowed: backlog->do, backlog reorder, human-review->do|ai-review|approved)`,
      });
      return false;
    }
    if (from === 'backlog' && column === 'backlog') {
      // Reorder: drop the card at the bottom of the backlog.
      this.orderCounter += 1;
      card.order = this.orderCounter;
      return true;
    }
    this.transitionCard(card, column, 'user-move');
    return true;
  }

  /** SPEC-V3 §V3-1 yolo toggle: passing AI review auto-approves. */
  setYolo(taskId: string, on: boolean): boolean {
    const card = this.cards.get(taskId);
    if (!card) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown task: ${taskId}` });
      return false;
    }
    if (card.yolo === on) return true;
    card.yolo = on;
    this.emitSimEvent(card, {
      type: 'yolo_set',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
      on,
    });
    return true;
  }

  /**
   * SPEC-V2 §V2-6 Commission Task (the Foundry's only surviving tab): lands
   * in BACKLOG with a deterministic `adr-cXX-…` id from a creation counter.
   */
  createTask(input: {
    taskKind: TaskKind;
    title?: string;
    parentId?: string;
    workspaceId?: string;
  }): string | null {
    if (!(TASK_KINDS as readonly string[]).includes(input.taskKind)) {
      this.emit({ type: 'error', code: 'invalid_task_kind', message: `Unknown task kind: ${String(input.taskKind)}` });
      return null;
    }
    const parent = input.parentId !== undefined ? this.cards.get(input.parentId) : undefined;
    if (input.parentId !== undefined && !parent) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown parent task: ${input.parentId}` });
      return null;
    }
    this.creationCounter += 1;
    const name = `adr-c${String(this.creationCounter).padStart(2, '0')}-${input.taskKind}`;
    const ws =
      this.scenario.workspaces.find((w) => w.workspaceId === input.workspaceId) ??
      this.scenario.workspaces[0]!;
    const title = input.title ?? TASK_TITLES[input.taskKind];
    const resource: CommanderTask = {
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: 'AgentDispatchRun',
      metadata: {
        name,
        namespace: 'kradle-system',
        labels: {
          'a5c.ai/title': title,
          'kradle.a5c.ai/repository': ws.repository,
          'kradle.a5c.ai/agent-stack': 'commander-fleet',
          'kradle.a5c.ai/runner-pool': 'untrusted-linux',
          ...(parent ? { [PARENT_TASK_LABEL]: parent.taskId } : {}),
        },
      },
      spec: {
        repository: ws.repository,
        ref: 'refs/heads/main',
        branch: 'main',
        sha: this.deterministicSha(name),
        sourceRefs: { triggerRule: 'commander-foundry' },
        agentStack: 'commander-fleet',
        taskKind: input.taskKind,
        workspaceRef: ws.workspaceId,
        runnerPool: 'untrusted-linux',
        approvalPolicy: { requireWriteBackApproval: true },
      },
      status: { storage: 'postgres', phase: 'Pending', conditions: [] },
    };
    const card = this.addCard(resource, input.taskKind, parent ? parent.taskId : null);
    this.emitSimEvent(card, {
      type: 'task_created',
      runId: 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId: name,
      taskKind: input.taskKind,
      title,
    });
    return name;
  }

  /**
   * Resolve an inquiry (SPEC-V3 §V3-5). `optionId` selects the branch; a bare
   * legacy allow/deny maps to the first/danger option of a tool approval.
   */
  answerInquiry(
    hookRequestId: string,
    optionId: string | null,
    decision: 'allow' | 'deny' = 'allow',
    reason?: string,
  ): boolean {
    const inquiry = this.inquiries.get(hookRequestId);
    if (!inquiry) {
      this.emit({ type: 'error', code: 'hook_not_found', message: `Unknown hook request: ${hookRequestId}` });
      return false;
    }
    const fallback =
      decision === 'deny'
        ? (inquiry.options.find((o) => o.tone === 'danger') ?? inquiry.options[inquiry.options.length - 1]!)
        : inquiry.options[0]!;
    const option = inquiry.options.find((o) => o.id === optionId) ?? fallback;
    this.inquiries.delete(hookRequestId);

    const card = this.cards.get(inquiry.taskId);
    const agent = this.agents.get(inquiry.unitId);
    this.emit({
      type: 'hook.resolved',
      hookRequestId,
      resolvedBy: 'operator',
      decision: option.tone === 'danger' && inquiry.inquiryKind === 'tool-approval' ? 'deny' : 'allow',
    });
    if (!card || !card.run) return true;

    // Journal: the breakpoint effect resolves with the chosen option.
    this.resolveEffect(card.run, inquiry.effectId, 'EFFECT_RESOLVED', {
      optionId: option.id,
      caption: option.caption,
      ...(reason !== undefined ? { reason } : {}),
    });
    this.emitSimEvent(card, {
      type: 'inquiry_resolved',
      runId: card.run.runId,
      agent: agent?.agent ?? 'commander',
      timestamp: this.now(),
      taskId: card.taskId,
      hookRequestId,
      inquiryKind: inquiry.inquiryKind,
      optionId: option.id,
      caption: option.caption,
      question: inquiry.question,
    });

    // Visible deterministic branch: the chosen option renames the path ahead
    // and queues distinct follow-up events (different per option).
    if (inquiry.inquiryKind !== 'tool-approval') {
      const next = card.run.phaseIndex + 1;
      if (next < card.run.phases.length) {
        card.run.phases[next] = `${card.run.phases[next]!} via ${option.id}`;
      } else {
        card.run.phases.push(`settle ${option.id}`);
      }
      card.pendingFollowUps.push(
        { text: `[${option.id}] ${option.caption} path engaged — ${option.detail ?? 'committing to the branch'}`, optionId: option.id },
        { text: `[${option.id}] replanning remaining phases for the ${option.caption} route`, optionId: option.id },
      );
    } else if (option.id === 'proceed') {
      card.pendingFollowUps.push({ text: `[proceed] gated tool call released — \`git push\` executing`, optionId: option.id });
    } else {
      card.pendingFollowUps.push({ text: `[stand-down] gated tool call denied — agent rethinking`, optionId: option.id });
    }

    if (agent) {
      this.pushTranscript(
        agent.session,
        'event',
        `Inquiry resolved: ${option.caption} (${option.id}).`,
      );
      agent.pendingHookId = null;
      agent.state = 'thinking';
      agent.stateTicks = 0;
      agent.stateDuration = this.rng.int(2, 5);
      agent.updatedAt = this.now();
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // v4 verbs (SPEC-V4 §V4-1/§V4-5/§V4-6/§V4-8 — sim-local channel, journaled)
  // -------------------------------------------------------------------------

  /**
   * §V4-1 `revertCard(taskId)`: revert a MERGED card from staging — back to DO
   * with a `reverted` feedback event; a fresh worker iterates on arrival.
   */
  revertCard(taskId: string): boolean {
    const card = this.cards.get(taskId);
    if (!card) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown task: ${taskId}` });
      return false;
    }
    if (card.parentId !== null || card.column !== 'merged') {
      this.emit({
        type: 'error',
        code: 'illegal_move',
        message: `Revert requires a top-level card in MERGED; ${taskId} is in ${card.column}`,
      });
      return false;
    }
    const feedback = `Reverted from staging: release verification flagged "${this.titleOf(card)}" — iterate and re-land.`;
    card.feedback = feedback;
    card.releaseId = null;
    this.unseal(card);
    this.emitSimEvent(card, {
      type: 'reverted',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
      feedback,
    });
    this.transitionCard(card, 'do', 'reverted');
    return true;
  }

  /**
   * §V4-1 `release()` (v5-r0 amendment): ship ALL merged cards to IN
   * PRODUCTION as one release train `rel-NN` — ATOMICALLY, in this verb call
   * (single deterministic transition; a PAUSED sim can never strand wagons).
   * Each wagon's `card_moved` payload carries an explicit `stagger` index;
   * the staggered glide is purely an ANIMATION-layer affair. Returns the
   * release id, or null when the MERGED lane is empty.
   */
  release(): string | null {
    const train = [...this.cards.values()].filter(
      (c) => c.parentId === null && c.column === 'merged',
    );
    if (train.length === 0) {
      this.emit({ type: 'error', code: 'empty_release', message: 'No merged cards to release' });
      return null;
    }
    this.releaseCounter += 1;
    const releaseId = `rel-${String(this.releaseCounter).padStart(2, '0')}`;
    train.forEach((card, index) => {
      this.shipCard(card, releaseId, index);
    });
    return releaseId;
  }

  /** §V4-1 `rollbackCard(taskId)`: in-production → MERGED (staging), `rolled_back` event. */
  rollbackCard(taskId: string): boolean {
    const card = this.cards.get(taskId);
    if (!card) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown task: ${taskId}` });
      return false;
    }
    if (card.parentId !== null || card.column !== 'in-production') {
      this.emit({
        type: 'error',
        code: 'illegal_move',
        message: `Rollback requires a top-level card in IN PRODUCTION; ${taskId} is in ${card.column}`,
      });
      return false;
    }
    const releaseId = card.releaseId;
    card.releaseId = null;
    card.inProductionAtTick = null;
    this.emitSimEvent(card, {
      type: 'rolled_back',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
      releaseId,
    });
    this.transitionCard(card, 'merged', 'rolled-back');
    return true;
  }

  /**
   * §V4-5 `updateTask(taskId, patch)` — the card editor's verb. Deterministic,
   * evented `task_updated`. A kind change remaps the DEFAULT stack mapping
   * only when the card's stackRef was never explicitly set.
   */
  updateTask(taskId: string, patch: UpdateTaskPatch): boolean {
    const card = this.cards.get(taskId);
    if (!card) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown task: ${taskId}` });
      return false;
    }
    if (patch.taskKind !== undefined && !(TASK_KINDS as readonly string[]).includes(patch.taskKind)) {
      this.emit({ type: 'error', code: 'invalid_task_kind', message: `Unknown task kind: ${String(patch.taskKind)}` });
      return false;
    }
    if (patch.stackRef !== undefined && !this.stacks.has(patch.stackRef)) {
      this.emit({ type: 'error', code: 'stack_not_found', message: `Unknown agent stack: ${patch.stackRef}` });
      return false;
    }
    if (patch.parentId !== undefined && patch.parentId !== null) {
      const parent = this.cards.get(patch.parentId);
      if (!parent || parent.taskId === taskId || parent.parentId !== null) {
        this.emit({
          type: 'error',
          code: 'task_not_found',
          message: `Invalid parent task: ${String(patch.parentId)}`,
        });
        return false;
      }
      if (card.column !== 'backlog') {
        this.emit({
          type: 'error',
          code: 'illegal_move',
          message: `Parent reassignment is legal only while in backlog; ${taskId} is in ${card.column}`,
        });
        return false;
      }
    }
    const ws =
      patch.workspaceId !== undefined
        ? this.scenario.workspaces.find((w) => w.workspaceId === patch.workspaceId)
        : undefined;
    if (patch.workspaceId !== undefined && !ws) {
      this.emit({ type: 'error', code: 'workspace_not_found', message: `Unknown workspace: ${patch.workspaceId}` });
      return false;
    }

    const applied: Record<string, unknown> = {};
    if (patch.title !== undefined) {
      card.resource.metadata.labels = { ...card.resource.metadata.labels, 'a5c.ai/title': patch.title };
      applied['title'] = patch.title;
    }
    if (patch.taskKind !== undefined && patch.taskKind !== card.taskKind) {
      card.taskKind = patch.taskKind;
      card.resource.spec.taskKind = patch.taskKind;
      applied['taskKind'] = patch.taskKind;
    }
    if (patch.description !== undefined) {
      card.description = patch.description;
      applied['description'] = patch.description;
    }
    if (patch.yolo !== undefined && patch.yolo !== card.yolo) {
      card.yolo = patch.yolo;
      applied['yolo'] = patch.yolo;
    }
    if (patch.parentId !== undefined) {
      const oldParent = card.parentId !== null ? this.cards.get(card.parentId) : undefined;
      if (oldParent) oldParent.childIds = oldParent.childIds.filter((id) => id !== taskId);
      card.parentId = patch.parentId;
      if (patch.parentId !== null) {
        const parent = this.cards.get(patch.parentId)!;
        if (!parent.childIds.includes(taskId)) parent.childIds.push(taskId);
        card.resource.metadata.labels = { ...card.resource.metadata.labels, [PARENT_TASK_LABEL]: patch.parentId };
      } else if (card.resource.metadata.labels) {
        delete card.resource.metadata.labels[PARENT_TASK_LABEL];
      }
      applied['parentId'] = patch.parentId;
    }
    if (ws) {
      card.resource.spec.workspaceRef = ws.workspaceId;
      card.resource.spec.repository = ws.repository;
      card.resource.metadata.labels = { ...card.resource.metadata.labels, 'kradle.a5c.ai/repository': ws.repository };
      applied['workspaceId'] = ws.workspaceId;
    }
    if (patch.stackRef !== undefined) {
      card.stackRefOverride = patch.stackRef;
      applied['stackRef'] = patch.stackRef;
    }

    this.emitSimEvent(card, {
      type: 'task_updated',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
      patch: applied,
      stackRef: this.stackRefOf(card),
    });
    return true;
  }

  /**
   * §V4-5 `upsertStack(stack)` — the foundry's verb. A known `stackRef`
   * updates in place; otherwise a deterministic `stk-cNN` id is minted.
   * Emits `stack_forged`. Returns the stackRef (null on invalid input).
   */
  upsertStack(input: KradleAgentStackInput): string | null {
    const name = input.metadata?.name?.trim() ?? '';
    const spec = input.spec;
    if (name === '' || !spec || typeof spec.baseAgent !== 'string' || typeof spec.adapter !== 'string') {
      this.emit({
        type: 'error',
        code: 'invalid_stack',
        message: 'upsertStack requires metadata.name and spec.{baseAgent, adapter}',
      });
      return null;
    }
    let stackRef = input.stackRef !== undefined && this.stacks.has(input.stackRef) ? input.stackRef : null;
    if (stackRef === null) {
      this.stackCounter += 1;
      stackRef = `stk-c${String(this.stackCounter).padStart(2, '0')}`;
    }
    const stack: KradleAgentStack = {
      apiVersion: input.apiVersion ?? 'kradle.a5c.ai/v1alpha1',
      kind: 'AgentStack',
      metadata: { name, namespace: input.metadata.namespace ?? 'kradle-system', labels: { ...input.metadata.labels } },
      spec: {
        baseAgent: spec.baseAgent,
        adapter: spec.adapter,
        ...(spec.provider !== undefined ? { provider: spec.provider } : {}),
        model: spec.model ?? MODELS_BY_ADAPTER[this.adapterOfStackSpec(spec)][0]!,
        prompt: { system: spec.prompt?.system ?? '', developer: spec.prompt?.developer },
        approvalMode: spec.approvalMode ?? 'prompt',
        ...(spec.toolProfileRef !== undefined ? { toolProfileRef: spec.toolProfileRef } : {}),
        ...(spec.skillRefs !== undefined ? { skillRefs: [...spec.skillRefs] } : {}),
        ...(spec.subagentRefs !== undefined ? { subagentRefs: [...spec.subagentRefs] } : {}),
        ...(spec.runnerPool !== undefined ? { runnerPool: spec.runnerPool } : {}),
      },
      status: { phase: input.status?.phase ?? 'ready' },
    };
    const existing = this.stacks.get(stackRef);
    this.stacks.set(stackRef, { stackRef, custom: existing ? existing.custom : true, stack });
    this.emitEnveloped('run-none', 'commander', {
      type: 'stack_forged',
      runId: 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId: '',
      stackRef,
      name,
      adapter: stack.spec.adapter,
      model: stack.spec.model,
      updated: existing !== undefined,
    });
    return stackRef;
  }

  /**
   * §V4-6 `updateProcessTemplate(kind, phases)`: edit a kind's phase pipeline
   * TEMPLATE (≥2 non-empty phases). Bumps the revision (`process_updated`
   * event); the NEXT run created for that kind pins the new revision while
   * running runs keep theirs. Returns the new revision (null on rejection).
   */
  updateProcessTemplate(kind: TaskKind, phases: string[]): number | null {
    const template = this.templates.get(kind);
    if (!template) {
      this.emit({ type: 'error', code: 'invalid_task_kind', message: `Unknown task kind: ${String(kind)}` });
      return null;
    }
    const cleaned = phases.map((p) => String(p).trim()).filter((p) => p.length > 0);
    if (cleaned.length < 2 || cleaned.length !== phases.length) {
      this.emit({
        type: 'error',
        code: 'invalid_template',
        message: `A process template needs >=2 non-empty phases; got ${JSON.stringify(phases)}`,
      });
      return null;
    }
    template.revision += 1;
    template.phases = cleaned;
    this.emitEnveloped('run-none', 'commander', {
      type: 'process_updated',
      runId: 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId: '',
      kind,
      processId: `commander/${kind}@v${template.revision}`,
      revision: template.revision,
      phases: [...cleaned],
    });
    return template.revision;
  }

  /**
   * §V4-8/§V4-11 `writeFile(taskId, path, content)`: a session-local editor
   * write. Updates the workspace view (dirty count + a diff vs the PRE-EDIT
   * content) and emits `workspace_change`.
   */
  writeFile(taskId: string, path: string, content: string): boolean {
    const card = this.cards.get(taskId);
    if (!card) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown task: ${taskId}` });
      return false;
    }
    const before = this.getFileContent(taskId, path) ?? '';
    card.fileOverrides.set(path, content);

    const oldLines = before === '' ? [] : before.split('\n');
    const newLines = content.split('\n');
    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);
    const minus = oldLines.filter((l) => !newSet.has(l));
    const plus = newLines.filter((l) => !oldSet.has(l));
    const diffLines = [
      `@@ -1,${oldLines.length} +1,${newLines.length} @@ manual edit`,
      ` // edited via commander: ${path}`,
      ...minus.slice(0, 10).map((l) => `-${l}`),
      ...plus.slice(0, 10).map((l) => `+${l}`),
      ` // end: ${path}`,
    ];
    const existing = card.ws.files.find((f) => f.path === path);
    const status: 'A' | 'M' = existing || before !== '' ? 'M' : 'A';
    if (existing) {
      existing.status = 'M';
      existing.additions += plus.length;
      existing.deletions += minus.length;
      existing.diff = diffLines.slice(0, 25).join('\n');
    } else {
      card.ws.files.push({
        path,
        status,
        additions: Math.max(plus.length, 1),
        deletions: minus.length,
        diff: diffLines.slice(0, 25).join('\n'),
      });
    }
    card.ws.dirty = true;
    this.emitSimEvent(card, {
      type: 'workspace_change',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
      path,
      status,
      source: 'editor',
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // v1 compat operator verbs (kept type-compatible for the existing store)
  // -------------------------------------------------------------------------

  /** V3: agents are lifecycle-owned and never idle — retiring is refused. */
  retireUnit(unitId: string): boolean {
    this.emit({
      type: 'error',
      code: 'unit_busy',
      message: `Unit ${unitId} is lifecycle-owned under V3 — agents despawn with their card`,
    });
    return false;
  }

  /** Hold an active agent: its card's work freezes until resumed. */
  pauseUnit(unitId: string): boolean {
    const agent = this.agents.get(unitId);
    if (!agent || agent.held || agent.state === 'awaiting_input') return false;
    agent.held = true;
    agent.updatedAt = this.now();
    this.emitAgentEvent(agent, { type: 'paused', runId: this.runIdOf(agent), agent: agent.agent, timestamp: this.now() });
    return true;
  }

  /** Release an operator hold; the agent continues exactly where it froze. */
  resumeUnit(unitId: string): boolean {
    const agent = this.agents.get(unitId);
    if (!agent || !agent.held) return false;
    agent.held = false;
    agent.updatedAt = this.now();
    this.emitAgentEvent(agent, { type: 'resumed', runId: this.runIdOf(agent), agent: agent.agent, timestamp: this.now() });
    return true;
  }

  /** Bump a backlog card to the top of the lane. */
  prioritizeTask(taskId: string): boolean {
    const card = this.cards.get(taskId);
    if (!card) {
      this.emit({ type: 'error', code: 'task_not_found', message: `Unknown task: ${taskId}` });
      return false;
    }
    if (card.column !== 'backlog') return false;
    card.order = Math.min(0, ...[...this.cards.values()].map((c) => c.order)) - 1;
    this.emitSimEvent(card, {
      type: 'task_prioritized',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // Read surface
  // -------------------------------------------------------------------------

  listAgents(): AgentSummary[] {
    return ADAPTERS.map((agent: AdapterName) => ({
      agent,
      displayName: agent,
      adapterType: 'subprocess',
      structuredSessionTransport: 'persistent',
      sessionControlPlane: 'self-managed',
      supportsInteractiveMode: true,
      canResume: true,
      supportsImageInput: agent !== 'pi',
      supportsFileAttachments: true,
      approvalModes: ['yolo', 'prompt', 'deny'],
    }));
  }

  /**
   * Gateway-protocol session entries for ACTIVE agents (REST mirror).
   * Renamed from `listSessions` in v5 — the §V5-1 persistent-session view now
   * owns that name.
   */
  listSessionEntries(): SessionEntry[] {
    return [...this.agents.values()].map((agent) => {
      const runId = this.runIdOf(agent);
      const run = this.runs.get(runId);
      return {
        sessionId: agent.unitId,
        agent: agent.agent,
        status: 'active',
        activeRunId: runId,
        latestRunId: runId,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        latestRunStartedAt: run ? run.entry.startedAt : null,
        latestRunEndedAt: run ? run.entry.endedAt : null,
        title: `${agent.role}:${agent.taskId}`,
        turnCount: agent.session.turnCount,
        messageCount: agent.session.messageCount,
        model: agent.model,
        cost: this.costOf(agent),
        cwd: `/ws/${this.workspaceOf(agent.taskId)}`,
        workspaceId: this.workspaceOf(agent.taskId),
        source: 'gateway',
      } satisfies SessionEntry;
    });
  }

  /** Gateway-protocol run entries (REST mirror; the §V4-6 ledger is `listRuns()`). */
  listRunEntries(): RunEntry[] {
    return [...this.runs.values()].map((record) => ({ ...record.entry }));
  }

  /** §V4-6 runs registry: every card attempt, newest first. */
  listRuns(): SimRunView[] {
    return [...this.runs.values()].map((run) => this.runViewOf(run)).reverse();
  }

  /**
   * SPEC-V5 §V5-1 `listSessions(taskId?)`: every persisted session ever (all
   * sessions, or one card's), NEWEST FIRST. Pure — no engine-rng draws.
   */
  listSessions(taskId?: string): SimSessionView[] {
    return [...this.sessions.values()]
      .filter((session) => taskId === undefined || session.taskId === taskId)
      .sort((a, b) => b.order - a.order)
      .map((session) => this.sessionViewOf(session));
  }

  /**
   * SPEC-V5 §V5-1 `getSession(sessionId)`: record + transcript (deep copy).
   * The transcript survives despawn — it IS the live agent's transcript.
   */
  getSession(sessionId: string): SimSessionDetailView | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return {
      record: this.sessionViewOf(session),
      transcript: session.transcript.map((entry) => ({ ...entry })),
    };
  }

  /** §V4-5 `listStacks()`: 4 seeded + custom foundry stacks, stable order. */
  listStacks(): SimStackView[] {
    return [...this.stacks.values()].map((entry) => ({
      stackRef: entry.stackRef,
      name: entry.stack.metadata.name,
      custom: entry.custom,
      stack: JSON.parse(JSON.stringify(entry.stack)) as KradleAgentStack,
    }));
  }

  // -------------------------------------------------------------------------
  // Roster agents (named, stackbound workers/reviewers assignable to tasks)
  // -------------------------------------------------------------------------

  listRosterAgents(): SimRosterAgentView[] {
    return [...this.rosterAgents.values()].map((r) => this.rosterAgentView(r));
  }

  private rosterAgentView(r: RosterAgentRecord): SimRosterAgentView {
    const stackEntry = this.stacks.get(r.stackRef);
    const adapter = stackEntry ? this.adapterOfStackSpec(stackEntry.stack.spec) : 'claude-code';
    const model = stackEntry?.stack.spec.model || MODELS_BY_ADAPTER[adapter][0]!;
    return {
      agentId: r.agentId,
      name: r.name,
      stackRef: r.stackRef,
      stackName: stackEntry?.stack.metadata.name ?? r.stackRef,
      adapter,
      model,
      role: r.role,
      status: r.assignedTaskId !== null ? 'assigned' : 'available',
      assignedTaskId: r.assignedTaskId,
      assignedRole: r.assignedRole,
    };
  }

  createRosterAgent(input: { stackRef: string; role: RosterRole; name?: string }): string | null {
    const stackEntry = this.stacks.get(input.stackRef);
    if (!stackEntry) return null;
    this.rosterCounter += 1;
    const agentId = `ra-${String(this.rosterCounter).padStart(3, '0')}`;
    const adapter = this.adapterOfStackSpec(stackEntry.stack.spec);
    const name = input.name?.trim() || `${CREATURE_NAMES[this.rosterCounter % CREATURE_NAMES.length]}`;
    this.rosterAgents.set(agentId, {
      agentId,
      name,
      stackRef: input.stackRef,
      role: input.role,
      assignedTaskId: null,
      assignedRole: null,
    });
    this.emitSimEvent(null, {
      type: 'agent_recruited',
      runId: 'run-none',
      agent: adapter,
      timestamp: this.now(),
      taskId: '',
      agentId,
      name,
      stackRef: input.stackRef,
    });
    return agentId;
  }

  deleteRosterAgent(agentId: string): boolean {
    const record = this.rosterAgents.get(agentId);
    if (!record) return false;
    // Unassign from any task
    if (record.assignedTaskId !== null) {
      const card = this.cards.get(record.assignedTaskId);
      if (card) {
        if (card.workerAgentId === agentId) card.workerAgentId = null;
        if (card.reviewerAgentId === agentId) card.reviewerAgentId = null;
      }
    }
    this.rosterAgents.delete(agentId);
    this.emitSimEvent(null, {
      type: 'agent_released',
      runId: 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId: '',
      agentId,
      name: record.name,
    });
    return true;
  }

  assignTaskAgent(taskId: string, role: RosterRole, agentId: string | null): boolean {
    const card = this.cards.get(taskId);
    if (!card) return false;
    // Unassign previous occupant of this slot
    const prevId = role === 'worker' ? card.workerAgentId : card.reviewerAgentId;
    if (prevId !== null && prevId !== agentId) {
      const prev = this.rosterAgents.get(prevId);
      if (prev && prev.assignedTaskId === taskId) {
        prev.assignedTaskId = null;
        prev.assignedRole = null;
      }
    }
    if (agentId !== null) {
      const roster = this.rosterAgents.get(agentId);
      if (!roster) return false;
      // Unassign from previous task if needed
      if (roster.assignedTaskId !== null && roster.assignedTaskId !== taskId) {
        const prevCard = this.cards.get(roster.assignedTaskId);
        if (prevCard) {
          if (prevCard.workerAgentId === agentId) prevCard.workerAgentId = null;
          if (prevCard.reviewerAgentId === agentId) prevCard.reviewerAgentId = null;
        }
      }
      roster.assignedTaskId = taskId;
      roster.assignedRole = role;
    }
    if (role === 'worker') card.workerAgentId = agentId;
    else card.reviewerAgentId = agentId;
    this.emitSimEvent(card, {
      type: 'task_agent_assigned',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
      role,
      agentId,
    });
    return true;
  }

  assignTaskHuman(taskId: string, assign: boolean): boolean {
    const card = this.cards.get(taskId);
    if (!card) return false;
    card.humanAssigneeId = assign ? 'user' : null;
    this.emitSimEvent(card, {
      type: 'task_human_assigned',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId,
      assigned: assign,
    });
    return true;
  }

  /** §V4-6 `listProcessTemplates()`: the per-kind phase pipeline templates. */
  listProcessTemplates(): SimProcessTemplateView[] {
    return TASK_KINDS.map((kind) => {
      const template = this.templates.get(kind)!;
      return {
        kind,
        processId: `commander/${kind}@v${template.revision}`,
        revision: template.revision,
        phases: [...template.phases],
      };
    });
  }

  /**
   * §V4-8 `getWorkspaceTree(taskId)`: deterministic nested file tree (8–20
   * plausible files per task kind). Pure — never touches the engine rng.
   */
  getWorkspaceTree(taskId: string): SimFileTreeNode | null {
    const card = this.cards.get(taskId);
    if (!card) return null;
    const paths = this.workspacePathsOf(card);
    const root: SimFileTreeNode = { name: this.workspaceOf(taskId) || taskId, path: '', type: 'dir', children: [] };
    for (const path of paths) {
      let node = root;
      const segments = path.split('/');
      segments.forEach((segment, index) => {
        const childPath = segments.slice(0, index + 1).join('/');
        const isFile = index === segments.length - 1;
        node.children = node.children ?? [];
        let child = node.children.find((c) => c.path === childPath);
        if (!child) {
          child = isFile
            ? { name: segment, path: childPath, type: 'file' }
            : { name: segment, path: childPath, type: 'dir', children: [] };
          node.children.push(child);
        }
        node = child;
      });
    }
    sortTree(root);
    return root;
  }

  /**
   * §V4-8 `getFileContent(taskId, path)`: deterministic 20–80-line content.
   * CHANGED files contain their diff hunks' added lines; editor writes
   * (`writeFile`) override. Pure — never touches the engine rng.
   */
  getFileContent(taskId: string, path: string): string | null {
    const card = this.cards.get(taskId);
    if (!card) return null;
    const override = card.fileOverrides.get(path);
    if (override !== undefined) return override;
    const known = this.workspacePathsOf(card).includes(path) || card.ws.files.some((f) => f.path === path);
    if (!known) return null;

    const rng = new Prng(hashString(`${this.seed}:content:${card.taskId}:${path}`));
    const title = this.titleOf(card);
    const lines: string[] = [];
    const ext = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : '';
    const lineCount = rng.int(20, 56);
    // v4-r0: seed-picked vocabulary so files read plausibly per extension —
    // pure on the per-path rng (same seed ⇒ identical content, §V4-8).
    const noun = (): string => rng.pick(CONTENT_NOUNS);
    const verb = (): string => rng.pick(CONTENT_VERBS);
    const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
    if (ext === 'json') {
      lines.push('{', `  "name": "${this.workspaceOf(card.taskId) || 'workspace'}",`, `  "version": "0.${rng.int(1, 9)}.${rng.int(0, 9)}",`);
      for (let i = lines.length; i < lineCount - 1; i += 1) {
        lines.push(`  "${noun()}-${i}": "${verb()}-${rng.int(100, 999)}",`);
      }
      lines.push('  "private": true', '}');
    } else if (ext === 'md') {
      lines.push(`# ${path.split('/').pop() ?? path}`, '', `Notes for "${title}".`, '');
      for (let i = lines.length; i < lineCount; i += 1) {
        const t = rng.int(0, 3);
        if (t === 0) lines.push(`## ${cap(verb())} the ${noun()}`);
        else if (t === 1) lines.push(`- the ${noun()} must ${verb()} before the ${noun()} engages`);
        else if (t === 2) lines.push(`> the cogitator records: ${noun()} ${rng.int(100, 999)} holds within tolerance`);
        else lines.push(`See \`src/core/${noun()}.ts\` for how we ${verb()} the ${noun()}.`);
      }
    } else if (ext === 'css') {
      lines.push(`/* ${path} — plates for "${title}" */`, '');
      while (lines.length < lineCount) {
        lines.push(
          `.wr-${noun()}-${rng.int(1, 9)} {`,
          `  --${noun()}-gauge: ${rng.int(2, 24)}px;`,
          `  ${rng.pick(['margin', 'padding', 'gap'])}: ${rng.int(1, 12)}px;`,
          '}',
        );
      }
    } else if (ext === 'sh') {
      lines.push('#!/usr/bin/env bash', `# ${path} — rites for "${title}"`, 'set -euo pipefail', '');
      while (lines.length < lineCount) {
        lines.push(
          `echo "${verb()} the ${noun()}…"`,
          `./scripts/${verb()}.sh --target ${noun()} --retries ${rng.int(1, 5)}`,
          `[ -f .${noun()}.lock ] && rm .${noun()}.lock`,
        );
      }
    } else if (ext === 'sql') {
      lines.push(`-- ${path} — vault rites for "${title}"`, '');
      while (lines.length < lineCount) {
        lines.push(
          `CREATE TABLE IF NOT EXISTS ${noun()}_${rng.int(1, 9)} (`,
          `  id INTEGER PRIMARY KEY,`,
          `  ${noun()}_state TEXT NOT NULL DEFAULT '${verb()}ed'`,
          ');',
        );
      }
    } else if (ext === 'yaml' || ext === 'yml') {
      lines.push(`# ${path} — manifest for "${title}"`, `apiVersion: cogitator/v${rng.int(1, 3)}`, `kind: ${cap(noun())}`);
      while (lines.length < lineCount) {
        lines.push(
          `${noun()}:`,
          `  ${verb()}: true`,
          `  gauge: ${rng.int(1, 99)}`,
          `  notes: "${verb()} the ${noun()} before dispatch"`,
        );
      }
    } else {
      // ts/tsx/js and kin: import → typed surface → exported mechanisms.
      lines.push(
        `// ${path} — part of "${title}"`,
        `import { ${verb()} } from '../util/${noun()}s';`,
        '',
        `export interface ${cap(noun())}Spec {`,
        `  gauge: number;`,
        `  ${verb()}ed: boolean;`,
        '}',
        '',
      );
      while (lines.length < lineCount) {
        const t = rng.int(0, 3);
        if (t === 0) {
          lines.push(
            `export function ${verb()}${cap(noun())}(spec: ${cap(noun())}Spec): number {`,
            `  return ${verb()}(spec.gauge) * ${rng.int(2, 9)};`,
            '}',
          );
        } else if (t === 1) {
          lines.push(`const ${noun()}Gauge = ${verb()}(${rng.int(1, 12)});`);
        } else if (t === 2) {
          lines.push(`// ${noun()}: torque within tolerance (${rng.int(1, 99)} Nm)`);
        } else {
          lines.push(`registry.set('${noun()}-${rng.int(1, 60)}', ${noun()}Gauge);`);
        }
      }
    }

    // Changed files reflect their diff hunks applied: splice the added rows in.
    const changed = card.ws.files.find((f) => f.path === path);
    if (changed) {
      const added = changed.diff
        .split('\n')
        .filter((l) => l.startsWith('+'))
        .map((l) => l.slice(1));
      const at = Math.min(lines.length, 3 + (hashString(`${this.seed}:hunk:${path}`) % 10));
      lines.splice(at, 0, ...added);
    }
    return lines.slice(0, 80).join('\n');
  }

  /**
   * §V4-9 `getMemoryIO(ref)`: read/written memory ledgers for an agent unitId
   * OR a card taskId, accumulated from memory_query / memory_update events.
   */
  getMemoryIO(ref: string): SimMemoryIOView {
    const read: SimMemoryReadEntry[] = [];
    const written: SimMemoryWriteEntry[] = [];
    for (const card of this.cards.values()) {
      const byCard = card.taskId === ref;
      for (const entry of card.memoryReads) {
        if (byCard || entry.unitId === ref) read.push({ ...entry });
      }
      for (const entry of card.memoryWrites) {
        if (byCard || entry.unitId === ref) {
          written.push({ ...entry, changes: entry.changes.map((c) => ({ ...c })) });
        }
      }
    }
    return { read, written };
  }

  /** §V4-7 `git log`: commits derived deterministically from the journal/phases. */
  getGitLog(taskId: string): SimGitCommitView[] {
    const card = this.cards.get(taskId);
    if (!card) return [];
    const commits: SimGitCommitView[] = [
      {
        sha: this.deterministicSha(`${taskId}:git:base`),
        message: `chore: cut branch agent/${taskId} from main`,
        tick: 0,
      },
    ];
    if (card.run) {
      for (const event of card.run.journal) {
        if (event.type !== 'EFFECT_RESOLVED' || event.data['kind'] !== 'node') continue;
        const label = String(event.data['label'] ?? 'work');
        commits.push({
          sha: this.deterministicSha(`${taskId}:git:${card.run.runId}:${event.seq}`),
          message: `feat(${card.taskKind}): complete ${label}`,
          tick: Math.max(0, Math.round((event.recordedAt - this.scenario.epochMs) / TICK_MS)),
        });
      }
    }
    return commits.reverse();
  }

  listTasks(): CommanderTask[] {
    return [...this.cards.values()].map(
      (record) => JSON.parse(JSON.stringify(record.resource)) as CommanderTask,
    );
  }

  /** Board view (SPEC-V3): cards with column/stack/agent info. */
  listCardViews(): SimCardView[] {
    return [...this.cards.values()].map((card) => ({
      taskId: card.taskId,
      taskKind: card.taskKind,
      title: card.resource.metadata.labels?.['a5c.ai/title'] ?? card.taskId,
      repository: card.resource.spec.repository,
      workspaceId: card.resource.spec.workspaceRef ?? '',
      column: card.column,
      order: card.order,
      yolo: card.yolo,
      merged: card.merged,
      progress: roundTo(this.progressOf(card), 4),
      parentId: card.parentId,
      childIds: [...card.childIds],
      agentIds: [...this.agents.values()].filter((a) => a.taskId === card.taskId).map((a) => a.unitId),
      attempt: card.attempt,
      feedback: card.feedback,
      dirtyFileCount: card.ws.dirty ? card.ws.files.length : 0,
      hasPendingInquiry: [...this.inquiries.values()].some((i) => i.taskId === card.taskId),
      stackRef: this.stackRefOf(card),
      description: card.description,
      releaseId: card.releaseId,
      compacted:
        card.column === 'in-production' &&
        card.inProductionAtTick !== null &&
        this.tickCount - card.inProductionAtTick >= IN_PRODUCTION_COMPACT_TICKS,
      workerAgentId: card.workerAgentId,
      reviewerAgentId: card.reviewerAgentId,
      humanAssigneeId: card.humanAssigneeId,
    }));
  }

  /** Active agents (SPEC-V3 §V3-2: the units counter counts these). */
  listActiveAgentViews(): SimAgentView[] {
    return [...this.agents.values()].map((agent) => ({
      unitId: agent.unitId,
      agent: agent.agent,
      model: agent.model,
      creatureName: agent.session.creatureName,
      stackRef: agent.stackRef,
      stackName: agent.stackName,
      role: agent.role,
      taskId: agent.taskId,
      state: agent.state,
      paused: agent.held,
      runId: this.runIdOf(agent),
      pendingHookId: agent.pendingHookId,
      heldPieces: [...agent.heldPieces],
      tokenUsage: { ...agent.session.tokenUsage },
      cost: this.costOf(agent),
      turnCount: agent.session.turnCount,
      messageCount: agent.session.messageCount,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    }));
  }

  /** Open inquiries (SPEC-V3 §V3-5) for the Inquiry Dock. */
  listInquiries(): SimInquiryView[] {
    return [...this.inquiries.values()].map((inquiry) => ({
      hookRequestId: inquiry.hookRequestId,
      runId: inquiry.runId,
      taskId: inquiry.taskId,
      unitId: inquiry.unitId,
      inquiryKind: inquiry.inquiryKind,
      question: inquiry.question,
      options: inquiry.options.map((o) => ({ ...o })),
      deadlineTs: inquiry.deadlineTs,
    }));
  }

  /** Workspace view for a card (SPEC-V2 §V2-7 / SPEC-V3 §V3-4). */
  getWorkspaceView(taskId: string): SimWorkspaceView | null {
    const card = this.cards.get(taskId);
    if (!card) return null;
    return {
      taskId,
      phase: card.ws.phase,
      gitStatus: {
        branch: card.ws.branch,
        headSha: card.ws.headSha,
        ahead: card.ws.ahead,
        behind: card.ws.behind,
        dirty: card.ws.dirty,
        uncommittedCount: card.ws.dirty ? card.ws.files.length : 0,
      },
      files: card.ws.files.map((f) => ({ ...f })),
      testEvidence: { ...card.ws.testEvidence },
      reviewerNotes: [...card.ws.reviewerNotes],
    };
  }

  /**
   * SPEC-V5 §V5-3 `listWorkspaces()`: one summary per scenario workspace,
   * stable scenario order. Derived PURELY from existing card + session state
   * (no rng draws — same seed + verb sequence ⇒ identical output). Cards are
   * grouped by `spec.workspaceRef` and listed in sorted-taskId order; the
   * first card supplies the representative phase/gitStatus.
   */
  listWorkspaces(): SimWorkspaceSummaryView[] {
    const cardsByWorkspace = new Map<string, CardRecord[]>();
    for (const card of this.cards.values()) {
      const wsId = card.resource.spec.workspaceRef ?? '';
      if (wsId === '') continue;
      const list = cardsByWorkspace.get(wsId);
      if (list) {
        list.push(card);
      } else {
        cardsByWorkspace.set(wsId, [card]);
      }
    }
    return this.scenario.workspaces.map((ws) => {
      const cards = (cardsByWorkspace.get(ws.workspaceId) ?? []).sort((a, b) =>
        a.taskId.localeCompare(b.taskId),
      );
      const first = cards[0];
      const cardIds = cards.map((c) => c.taskId);
      const cardIdSet = new Set(cardIds);
      const activeSessionIds = [...this.sessions.values()]
        .filter((s) => s.status === 'active' && cardIdSet.has(s.taskId))
        .sort((a, b) => a.order - b.order)
        .map((s) => s.sessionId);
      return {
        workspaceId: ws.workspaceId,
        name: ws.name,
        repository: ws.repository,
        phase: first !== undefined ? first.ws.phase : 'ready',
        gitStatus:
          first !== undefined
            ? {
                branch: first.ws.branch,
                headSha: first.ws.headSha,
                ahead: first.ws.ahead,
                behind: first.ws.behind,
                dirty: first.ws.dirty,
                uncommittedCount: first.ws.dirty ? first.ws.files.length : 0,
              }
            : null,
        dirty: cards.some((c) => c.ws.dirty),
        cardIds,
        cards: cards.map((c) => ({
          taskId: c.taskId,
          title: c.resource.metadata.labels?.['a5c.ai/title'] ?? c.taskId,
          branch: c.ws.branch,
          headSha: c.ws.headSha,
          dirty: c.ws.dirty,
          dirtyFileCount: c.ws.dirty ? c.ws.files.length : 0,
        })),
        activeSessionIds,
      };
    });
  }

  /** Process-flow observation for a card's run (SPEC-V2 §V2-5). */
  getRunObservation(taskId: string): SimRunObservationView | null {
    const card = this.cards.get(taskId);
    if (!card || !card.run) return null;
    const run = card.run;
    const pendingEffectsByKind: PendingEffectsByKind = {};
    for (const effect of run.openEffects) {
      pendingEffectsByKind[effect.kind] = (pendingEffectsByKind[effect.kind] ?? 0) + 1;
    }
    return {
      runId: run.runId,
      taskId,
      observedState: run.terminal === 'completed'
        ? 'completed'
        : run.terminal === 'failed'
          ? 'failed'
          : deriveObservedRunState(run.journal),
      pendingEffectsByKind,
      phases: run.phases.map((label, index) => ({
        label,
        status: index < run.phaseIndex ? 'done' : index === run.phaseIndex ? 'current' : 'pending',
      })),
      journal: run.journal.map((event) => ({ ...event, data: { ...event.data } })),
    };
  }

  /** Memory silos (SPEC-V2 §V2-3 Archive overlay). */
  listMemorySilos(): SimMemorySiloView[] {
    return this.scenario.memory.silos.map((silo) => ({
      name: silo.repository.metadata.name,
      phase: silo.repository.status.phase,
      currentCommit: silo.repository.status.currentCommit ?? '',
      recordCount: silo.recordIds.length,
      owner: silo.source.spec.appliesTo.teams[0] ?? '',
      recordIds: [...silo.recordIds],
    }));
  }

  /** The unified memory graph (deep copy). */
  listMemoryRecords(): GraphRecord[] {
    return JSON.parse(JSON.stringify(this.scenario.memory.records)) as GraphRecord[];
  }

  // --- v1 compatibility views ------------------------------------------------

  listUnitViews(): SimUnitView[] {
    return [...this.agents.values()].map((agent) => ({
      unitId: agent.unitId,
      agent: agent.agent,
      model: agent.model,
      title: `${agent.role}:${agent.taskId}`,
      workspaceId: this.workspaceOf(agent.taskId),
      state: agent.state === 'awaiting_input' ? 'awaiting_approval' : agent.state,
      paused: agent.held,
      taskId: agent.taskId,
      runId: this.runIdOf(agent),
      turnIndex: agent.session.turnCount,
      turnCount: agent.session.turnCount,
      messageCount: agent.session.messageCount,
      pendingHookId: agent.pendingHookId,
      tokenUsage: { ...agent.session.tokenUsage },
      cost: this.costOf(agent),
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    }));
  }

  listTaskViews(): SimTaskView[] {
    return [...this.cards.values()].map((card) => ({
      taskId: card.taskId,
      taskKind: card.taskKind,
      repository: card.resource.spec.repository,
      workspaceId: card.resource.spec.workspaceRef ?? '',
      title: card.resource.metadata.labels?.['a5c.ai/title'] ?? card.taskId,
      state: this.compatTaskState(card),
      phase: toResourcePhase(card.resource.status.phase),
      progress: roundTo(this.progressOf(card), 4),
      assigneeIds: [...this.agents.values()].filter((a) => a.taskId === card.taskId).map((a) => a.unitId),
      priority: -card.order,
    }));
  }

  listPendingHooks(): SimHookView[] {
    return [...this.inquiries.values()].map((inquiry) => ({
      hookRequestId: inquiry.hookRequestId,
      runId: inquiry.runId,
      unitId: inquiry.unitId,
      hookKind: 'inquiry',
      payload: {
        question: inquiry.question,
        options: inquiry.options.map((o) => ({ ...o })),
        inquiryKind: inquiry.inquiryKind,
        taskId: inquiry.taskId,
        unitId: inquiry.unitId,
      },
      deadlineTs: inquiry.deadlineTs,
    }));
  }

  /** Deep, JSON-serializable snapshot — the determinism contract surface. */
  snapshot(): SimSnapshot {
    return {
      seed: this.seed,
      tick: this.tickCount,
      simTimeMs: this.now(),
      rngDraws: this.rng.draws,
      counters: {
        runs: this.runCounter,
        hooks: this.hookCounter,
        tools: this.toolCounter,
        agents: this.agentCounter,
        creations: this.creationCounter,
        stacks: this.stackCounter,
        releases: this.releaseCounter,
        memoryUpdates: this.memoryUpdateCounter,
      },
      cards: this.listCardViews(),
      agents: this.listActiveAgentViews(),
      inquiries: this.listInquiries(),
      workspaces: [...this.cards.keys()]
        .map((id) => this.getWorkspaceView(id))
        .filter((w): w is SimWorkspaceView => w !== null),
      runs: this.listRunEntries(),
      stacks: this.listStacks(),
      processTemplates: this.listProcessTemplates(),
      runLedger: this.listRuns(),
      sessions: this.listSessions(),
    };
  }

  // -------------------------------------------------------------------------
  // Session command compat (steer/abort of ACTIVE agents)
  // -------------------------------------------------------------------------

  private handleSessionMessage(frame: SessionMessageFrame): void {
    const agent = this.agents.get(frame.sessionId);
    if (!agent) {
      this.emit({ type: 'error', code: 'session_not_found', message: `Unknown session: ${frame.sessionId}` });
      return;
    }
    const prompt = frame.prompt.trim();
    const card = this.cards.get(agent.taskId);
    if (prompt === '/abort' || prompt === '/stop') {
      if (card) this.abortCard(this.topLevelOf(card));
      return;
    }
    // Steer: lands as user input; the agent replans its current phase.
    agent.session.messageCount += 1;
    this.pushTranscript(agent.session, 'user', prompt);
    if (agent.held) this.resumeUnit(agent.unitId);
    agent.stateDuration = Math.max(agent.stateDuration, agent.stateTicks + this.rng.int(1, 3));
    agent.updatedAt = this.now();
    this.emitAgentEvent(agent, {
      type: 'turn_start',
      runId: this.runIdOf(agent),
      agent: agent.agent,
      timestamp: this.now(),
      turnIndex: agent.session.turnCount,
    });
  }

  // -------------------------------------------------------------------------
  // Tick engine
  // -------------------------------------------------------------------------

  private stepOnce(): void {
    this.tickCount += 1;
    // Iterate over a stable copy: transitions spawn/despawn agents mid-walk.
    for (const card of [...this.cards.values()]) {
      this.advanceCard(card);
    }
  }

  private advanceCard(card: CardRecord): void {
    // Unanswered inquiries auto-default at the deadline (first option) so the
    // board never deadlocks; the path is fully deterministic. An auto-default
    // FREES the per-attempt inquiry slot — the operator never answered, so
    // the run may breakpoint again at a later phase start (AC20 relies on a
    // working run reliably presenting a live inquiry).
    for (const inquiry of [...this.inquiries.values()]) {
      if (inquiry.taskId === card.taskId && this.now() >= inquiry.deadlineTs) {
        this.answerInquiry(inquiry.hookRequestId, null, 'allow', 'auto-default at deadline');
        card.inquiriesThisAttempt = Math.max(0, card.inquiriesThisAttempt - 1);
      }
    }

    // Children are driven through their own records; only their work ticks
    // run here. Column machinery runs on top-level cards.
    if (card.pendingFollowUps.length > 0 && card.run) {
      const followUp = card.pendingFollowUps.shift()!;
      this.emitSimEvent(card, {
        type: 'inquiry_followup',
        runId: card.run.runId,
        agent: card.workerAdapter ?? 'commander',
        timestamp: this.now(),
        taskId: card.taskId,
        optionId: followUp.optionId,
        text: followUp.text,
      });
    }

    switch (card.column) {
      case 'backlog':
        return;
      case 'do':
        this.advanceWork(card);
        return;
      case 'ai-review':
        if (card.parentId === null) this.advanceAiReview(card);
        return;
      case 'human-review':
        return;
      case 'approved':
        if (card.parentId === null && !card.merged) this.advanceIntegration(card);
        return;
      case 'merged':
        // v5-r0: nothing ticks here — release() ships the whole train
        // atomically in the verb call (§V4-1 as amended).
        return;
      case 'in-production':
        return;
    }
  }

  // --- DO: workers grind phases ----------------------------------------------

  private advanceWork(card: CardRecord): void {
    if (card.parentId === null && card.childIds.length > 0) {
      // Stack parent: aggregate; auto-move when ALL children completed.
      const children = card.childIds.map((id) => this.cards.get(id)!).filter(Boolean);
      if (children.every((c) => c.run !== null && c.run.phaseIndex >= c.run.phases.length)) {
        this.completeWork(card);
      }
      return;
    }
    const run = card.run;
    if (!run || run.phaseIndex >= run.phases.length) return;
    const worker = [...this.agents.values()].find(
      (a) => a.taskId === card.taskId && a.role === 'worker',
    );
    if (!worker || worker.held || worker.state === 'awaiting_input') return;

    this.streamAgentTick(worker);
    run.phaseTicksLeft -= 1;
    if (run.phaseTicksLeft > 0) return;

    // Phase complete.
    const label = run.phases[run.phaseIndex]!;
    const effect = run.openEffects.find((e) => e.kind !== 'breakpoint');
    if (effect) this.resolveEffect(run, effect.effectId, 'EFFECT_RESOLVED', { phase: label });
    this.emitSimEvent(card, {
      type: 'phase_completed',
      runId: run.runId,
      agent: worker.agent,
      timestamp: this.now(),
      taskId: card.taskId,
      phase: label,
    });
    this.addWorkspaceChange(card, run.phaseIndex);
    run.phaseIndex += 1;
    card.progress = run.phaseIndex / run.phases.length;

    if (run.phaseIndex >= run.phases.length) {
      // Work complete on this leaf card.
      card.ws.testEvidence = {
        status: this.rng.chance(0.85) ? 'passed' : 'unknown',
        summary: `vitest: suite green for ${card.taskId}`,
      };
      this.emitMemoryUpdate(card, worker);
      if (card.parentId === null) {
        this.completeWork(card);
      } else {
        // Child done: its worker despawns; the parent aggregates. §V5-1: the
        // coordination session logs the child completion event.
        const parent = this.cards.get(card.parentId);
        const coordination =
          parent !== undefined && parent.coordSessionId !== null
            ? this.sessions.get(parent.coordSessionId)
            : undefined;
        if (coordination !== undefined) {
          this.pushTranscript(
            coordination,
            'event',
            `${card.taskId} completed by ${worker.session.title} — folded into the stack.`,
          );
        }
        this.despawnAgent(worker.unitId);
      }
      return;
    }

    // Next phase begins.
    this.requestPhaseEffect(card, run);
    this.emitSimEvent(card, {
      type: 'phase_started',
      runId: run.runId,
      agent: worker.agent,
      timestamp: this.now(),
      taskId: card.taskId,
      phase: run.phases[run.phaseIndex]!,
    });

    // Memory query at phase start (SPEC-V2 §V2-3: ACTIVE agents only).
    if (this.rng.chance(0.6)) this.emitMemoryQuery(card, worker);

    // Inquiry roll (SPEC-V3 §V3-5): at most one open inquiry per card, and at
    // most one raised per DO attempt (keeps work durations bounded). The
    // FINAL phase start guarantees the roll: every working attempt raises
    // exactly one inquiry (AC20 needs the only working run to hit a
    // breakpoint within budget — the rng decides WHEN, never whether).
    const hasOpen = [...this.inquiries.values()].some((i) => i.taskId === card.taskId);
    const lastPhase = run.phaseIndex >= run.phases.length - 1;
    if (!hasOpen && card.inquiriesThisAttempt < 1 && (this.rng.chance(0.45) || lastPhase)) {
      card.inquiriesThisAttempt += 1;
      this.raiseInquiry(card, worker);
    }
  }

  /** Work complete → auto-move to AI REVIEW (SPEC-V3 §V3-2). */
  private completeWork(card: CardRecord): void {
    this.transitionCard(card, 'ai-review', 'work-complete');
  }

  // --- AI REVIEW ---------------------------------------------------------------

  private advanceAiReview(card: CardRecord): void {
    const reviewers = [...this.agents.values()].filter(
      (a) => a.taskId === card.taskId && a.role === 'reviewer',
    );
    for (const reviewer of reviewers) {
      if (!reviewer.held) this.streamAgentTick(reviewer);
    }
    card.reviewTicksLeft -= 1;

    // A reviewer note lands midway — varied per attempt, never a duplicate
    // of a note already inscribed (v4-r0; one rng draw as before).
    if (card.reviewTicksLeft === 4 && reviewers[0]) {
      const file = card.ws.files[0]?.path ?? 'src/index.ts';
      const drawIndex = this.rng.int(0, REVIEW_NOTE_TEMPLATES.length - 1);
      const note = pickReviewerNote(file, card.attempt, card.ws.reviewerNotes, drawIndex);
      card.ws.reviewerNotes.push(note);
      this.emitSimEvent(card, {
        type: 'review_note',
        runId: card.run?.runId ?? 'run-none',
        agent: reviewers[0].agent,
        timestamp: this.now(),
        taskId: card.taskId,
        note,
      });
    }
    if (card.reviewTicksLeft > 0) return;

    // Verdict — deterministic per seed; rejects converge after 2 attempts.
    const pass = card.attempt >= 2 || this.rng.chance(0.6);
    const verdictAgent = reviewers[0]?.agent ?? 'codex';
    if (card.run) {
      const open = card.run.openEffects.find((e) => e.kind === 'agent');
      if (open) {
        this.resolveEffect(card.run, open.effectId, 'EFFECT_RESOLVED', {
          verdict: pass ? 'pass' : 'reject',
        });
      }
    }
    for (const reviewer of reviewers) {
      this.pushTranscript(
        reviewer.session,
        'event',
        `Review verdict on ${card.taskId} (attempt ${card.attempt}): ${pass ? 'pass' : 'reject'}.`,
      );
    }
    this.emitSimEvent(card, {
      type: 'review_verdict',
      runId: card.run?.runId ?? 'run-none',
      agent: verdictAgent,
      timestamp: this.now(),
      taskId: card.taskId,
      verdict: pass ? 'pass' : 'reject',
    });
    if (pass) {
      // §V5-1 (c): remember the APPROVING review session for the integration link.
      if (reviewers[0] !== undefined) {
        card.approvingReviewSessionId = reviewers[0].session.sessionId;
      }
      if (card.yolo) {
        this.transitionCard(card, 'approved', 'review-pass-yolo');
      } else {
        this.transitionCard(card, 'human-review', 'review-pass');
      }
    } else {
      const feedback = this.rng.pick(REJECT_FEEDBACK);
      card.feedback = feedback;
      this.emitSimEvent(card, {
        type: 'review_feedback',
        runId: card.run?.runId ?? 'run-none',
        agent: verdictAgent,
        timestamp: this.now(),
        taskId: card.taskId,
        feedback,
      });
      this.transitionCard(card, 'do', 'review-rejected');
    }
  }

  // --- APPROVED: integration ---------------------------------------------------

  private advanceIntegration(card: CardRecord): void {
    const integrator = [...this.agents.values()].find(
      (a) => a.taskId === card.taskId && a.role === 'integration',
    );
    if (!integrator || integrator.held) return;
    this.streamAgentTick(integrator);
    card.integrationTicksLeft -= 1;
    if (card.integrationTicksLeft > 0) return;

    const step = card.integrationSteps[card.integrationIndex]!;
    this.pushTranscript(integrator.session, 'event', `Integration step: ${step}.`);
    this.emitSimEvent(card, {
      type: 'integration_step',
      runId: card.run?.runId ?? 'run-none',
      agent: integrator.agent,
      timestamp: this.now(),
      taskId: card.taskId,
      step,
    });
    card.integrationIndex += 1;
    if (card.integrationIndex < card.integrationSteps.length) {
      card.integrationTicksLeft = this.rng.int(6, 12);
      return;
    }

    // Merged seal: patch applied, run completed, agent despawns — and the
    // card AUTO-MOVES to the MERGED lane (§V4-1: merged = live on staging;
    // APPROVED no longer holds terminal cards).
    card.merged = true;
    card.progress = 1;
    card.ws.dirty = false;
    card.ws.ahead = 0;
    card.ws.phase = 'archived';
    card.resource.status.phase = 'Ready';
    for (const child of card.childIds) {
      const c = this.cards.get(child);
      if (c) {
        c.merged = true;
        c.ws.dirty = false;
        c.resource.status.phase = 'Ready';
        if (c.run && c.run.terminal === null) this.terminateRun(c, c.run, 'RUN_COMPLETED');
      }
    }
    if (card.run && card.run.terminal === null) this.terminateRun(card, card.run, 'RUN_COMPLETED');
    this.emitSimEvent(card, {
      type: 'card_merged',
      runId: card.run?.runId ?? 'run-none',
      agent: integrator.agent,
      timestamp: this.now(),
      taskId: card.taskId,
    });
    this.despawnAgent(integrator.unitId);
    this.transitionCard(card, 'merged', 'integration-complete');
  }

  // -------------------------------------------------------------------------
  // Column transitions (the state machine core)
  // -------------------------------------------------------------------------

  private transitionCard(
    card: CardRecord,
    to: ColumnId,
    reason: CardMovedEventPayload['reason'],
    stagger?: number,
  ): void {
    const from = card.column;
    if (from === to) return;

    // §V5-1 status transitions: completed on normal despawn; aborted on the
    // /abort (and other terminal-deny) paths.
    const endStatus: SessionStatus = reason === 'aborted' ? 'aborted' : 'completed';

    // Agents despawn whenever their card leaves their column (SPEC-V3 §V3-2).
    this.despawnAgentsOf(card, endStatus);
    this.cancelInquiriesOf(card);
    // §V5-1: the parent card's coordination session ends with the DO attempt.
    if (from === 'do' && card.coordSessionId !== null) {
      this.closeSession(card.coordSessionId, endStatus);
      card.coordSessionId = null;
    }

    card.column = to;
    for (const childId of card.childIds) {
      const child = this.cards.get(childId);
      if (child) {
        child.column = to;
        this.despawnAgentsOf(child, endStatus);
        this.cancelInquiriesOf(child);
      }
    }

    this.emitSimMove(card, from, to, reason, stagger);

    switch (to) {
      case 'do':
        this.enterDo(card);
        break;
      case 'ai-review':
        this.enterAiReview(card);
        break;
      case 'human-review':
        card.resource.status.phase = 'Pending';
        break;
      case 'approved':
        this.enterApproved(card);
        break;
      case 'merged':
        card.resource.status.phase = 'Ready';
        card.inProductionAtTick = null;
        break;
      case 'in-production': {
        card.inProductionAtTick = this.tickCount;
        card.resource.status.phase = 'Ready';
        for (const childId of card.childIds) {
          const child = this.cards.get(childId);
          if (child) child.inProductionAtTick = this.tickCount;
        }
        break;
      }
      case 'backlog':
        break;
    }
  }

  private enterDo(card: CardRecord): void {
    card.attempt += 1;
    card.inquiriesThisAttempt = 0;
    const leaves = card.childIds.length > 0 ? card.childIds.map((id) => this.cards.get(id)!) : [card];
    // §V5-1 (a): a stack parent opens a lightweight per-attempt COORDINATION
    // session; child worker sessions link to it via parentSessionId.
    const coordination = card.childIds.length > 0 ? this.openCoordinationSession(card) : null;
    for (const leaf of leaves) {
      leaf.attempt = card.attempt;
      leaf.inquiriesThisAttempt = 0;
      this.ensureRun(leaf);
      this.initWorkspace(leaf);
      // §V4-5: the worker spawn binds the card's agent stack. If a roster
      // agent is assigned to this card as worker, use its stack instead.
      const rosterWorker = card.workerAgentId ? this.rosterAgents.get(card.workerAgentId) : null;
      const stackRef = rosterWorker?.stackRef ?? this.stackRefOf(leaf);
      const stackEntry = (this.stacks.get(stackRef) ?? this.stacks.get(this.stackRefOf(leaf)))!;
      const adapter = this.adapterOfStackSpec(stackEntry.stack.spec);
      leaf.workerAdapter = adapter;
      const worker = this.spawnAgent(
        adapter,
        'worker',
        leaf.taskId,
        stackEntry,
        coordination !== null ? { parentSessionId: coordination.sessionId } : undefined,
      );
      if (coordination !== null) {
        this.pushTranscript(
          coordination,
          'event',
          `Assigned ${leaf.taskId} (attempt ${card.attempt}) to ${worker.session.title}.`,
        );
      }
      const run = leaf.run!;
      // Rework after a rejection re-opens the pipeline.
      if (run.phaseIndex >= run.phases.length) {
        run.phases.push(`rework ${card.attempt}`);
        leaf.progress = run.phaseIndex / run.phases.length;
      }
      this.requestPhaseEffect(leaf, run);
    }
    card.workerAdapter = card.childIds.length > 0
      ? (this.cards.get(card.childIds[0]!)?.workerAdapter ?? null)
      : card.workerAdapter;
  }

  private enterAiReview(card: CardRecord): void {
    // 1–2 reviewer agents. If a roster reviewer is assigned, use their stack.
    const rosterReviewer = card.reviewerAgentId ? this.rosterAgents.get(card.reviewerAgentId) : null;
    const workerAdapter = card.workerAdapter ?? WORKER_ADAPTER_BY_KIND[card.taskKind];
    const count = rosterReviewer ? 1 : this.rng.int(1, 2);
    const pool = ADAPTERS.filter((a) => a !== workerAdapter);
    // §V5-1 (b): reviewers judge the attempt's worker session (a stack
    // parent's "worker" is its coordination session — also role worker).
    const judged = this.latestSession((s) => s.taskId === card.taskId && s.role === 'worker');
    for (let i = 0; i < count; i += 1) {
      const reviewerStackEntry = rosterReviewer ? this.stacks.get(rosterReviewer.stackRef) : undefined;
      const reviewerAdapter = reviewerStackEntry
        ? this.adapterOfStackSpec(reviewerStackEntry.stack.spec)
        : this.rng.pick(pool);
      this.spawnAgent(
        reviewerAdapter,
        'reviewer',
        card.taskId,
        reviewerStackEntry,
        judged !== undefined ? { reviewOfSessionId: judged.sessionId } : undefined,
      );
    }
    // §V4-4: lifecycle phase durations roughly double the v3 values.
    card.reviewTicksLeft = this.rng.int(16, 28);
    if (card.run) {
      this.requestEffect(card.run, 'agent', 'ai-review');
    }
  }

  private enterApproved(card: CardRecord): void {
    const integrationAdapter = this.rng.pick(ADAPTERS);
    // §V5-1 (c): the integration session's parent is the approving review
    // session when one exists, else the attempt's worker session.
    const parentSession =
      (card.approvingReviewSessionId !== null
        ? this.sessions.get(card.approvingReviewSessionId)
        : undefined) ?? this.latestSession((s) => s.taskId === card.taskId && s.role === 'worker');
    this.spawnAgent(
      integrationAdapter,
      'integration',
      card.taskId,
      undefined,
      parentSession !== undefined ? { parentSessionId: parentSession.sessionId } : undefined,
    );
    card.integrationSteps = this.rng.chance(0.4)
      ? ['rebase onto main', 'conflict-fix', 'integration-test', 'merge']
      : ['rebase onto main', 'integration-test', 'merge'];
    card.integrationIndex = 0;
    // §V4-4: lifecycle phase durations roughly double the v3 values.
    card.integrationTicksLeft = this.rng.int(6, 12);
    if (card.run) {
      // Close the review effect if still open; open the integration effect.
      const open = card.run.openEffects.find((e) => e.kind === 'agent');
      if (open) this.resolveEffect(card.run, open.effectId, 'EFFECT_RESOLVED', { verdict: 'approved' });
      this.requestEffect(card.run, 'node', 'integration');
    }
  }

  private abortCard(card: CardRecord): void {
    if (card.column === 'backlog' || card.merged) return;
    if (card.run) {
      for (const effect of [...card.run.openEffects]) {
        this.resolveEffect(card.run, effect.effectId, 'EFFECT_CANCELLED', { reason: 'aborted' });
      }
    }
    this.transitionCard(card, 'backlog', 'aborted');
  }

  // -------------------------------------------------------------------------
  // Agents
  // -------------------------------------------------------------------------

  private spawnAgent(
    adapter: AdapterName,
    role: AgentRole,
    taskId: string,
    stackEntry?: { stackRef: string; stack: KradleAgentStack },
    links?: { parentSessionId?: string; reviewOfSessionId?: string },
  ): AgentRecord {
    // §V4-5: every agent derives from a stack — explicit for workers, the
    // adapter family's seeded stack otherwise.
    const bound =
      stackEntry ??
      this.stacks.get(SEEDED_STACKS.find((s) => s.stack.spec.adapter === adapter)!.stackRef)!;
    this.agentCounter += 1;
    const now = this.now();
    const unitId = `agt-${String(this.agentCounter).padStart(3, '0')}-${role}`;
    const model = bound.stack.spec.model || MODELS_BY_ADAPTER[adapter][0]!;
    const stateDuration = this.rng.int(2, 5);
    const card = this.cards.get(taskId);
    // §V5-1: the persistent session record — the agent's transcript and
    // counters live here so they survive despawn unchanged.
    const session = this.createSession({
      sessionId: unitId,
      role,
      coordination: false,
      taskId,
      agent: adapter,
      model,
      stackRef: bound.stackRef,
      stackName: bound.stack.metadata.name,
      attempt: card?.attempt ?? 0,
      runId: card?.run?.runId ?? null,
      parentSessionId: links?.parentSessionId ?? null,
      reviewOfSessionId: links?.reviewOfSessionId ?? null,
    });
    session.tokenUsage.inputTokens = this.rng.int(400, 1600);
    const agent: AgentRecord = {
      unitId,
      agent: adapter,
      model,
      stackRef: bound.stackRef,
      stackName: bound.stack.metadata.name,
      role,
      taskId,
      state: 'thinking',
      held: false,
      stateTicks: 0,
      stateDuration,
      pendingHookId: null,
      activeToolName: null,
      heldPieces: [],
      accumulatedText: '',
      accumulatedThinking: '',
      session,
      createdAt: now,
      updatedAt: now,
    };
    this.agents.set(agent.unitId, agent);
    this.emitAgentEvent(agent, {
      type: 'session_start',
      runId: this.runIdOf(agent),
      agent: adapter,
      timestamp: now,
      sessionId: agent.unitId,
      resumed: false,
    });
    // §V4-5: the transcript's first message references the stack personality.
    const persona = bound.stack.spec.prompt.system.split('. ')[0]?.trim() ?? '';
    const greeting = `[${bound.stack.metadata.name}] ${persona !== '' ? `${persona}.` : 'Stack engaged.'} Taking up ${role} duty on ${taskId}. `;
    agent.accumulatedText = greeting;
    this.appendStreamEntry(session, 'message', greeting);
    this.emitAgentEvent(agent, {
      type: 'text_delta',
      runId: this.runIdOf(agent),
      agent: adapter,
      timestamp: now,
      delta: greeting,
      accumulated: agent.accumulatedText,
    });
    return agent;
  }

  private despawnAgent(unitId: string, endStatus: SessionStatus = 'completed'): void {
    const agent = this.agents.get(unitId);
    if (!agent) return;
    // §V4-6: fold the agent's burn into its run's registry totals.
    const run = this.runs.get(this.runIdOf(agent));
    if (run) {
      run.tokens.inputTokens += agent.session.tokenUsage.inputTokens;
      run.tokens.outputTokens += agent.session.tokenUsage.outputTokens;
      run.tokens.thinkingTokens += agent.session.tokenUsage.thinkingTokens;
      run.tokens.cachedTokens += agent.session.tokenUsage.cachedTokens;
      run.costUsd = roundTo(run.costUsd + this.costOf(agent).totalUsd, 6);
    }
    this.emitAgentEvent(agent, {
      type: 'session_end',
      runId: this.runIdOf(agent),
      agent: agent.agent,
      timestamp: this.now(),
      sessionId: agent.unitId,
      turnCount: agent.session.turnCount,
      cost: this.costOf(agent),
    });
    // §V5-1: the session record PERSISTS — only its status flips.
    this.closeSession(agent.session.sessionId, endStatus);
    this.agents.delete(unitId);
  }

  private despawnAgentsOf(card: CardRecord, endStatus: SessionStatus = 'completed'): void {
    for (const agent of [...this.agents.values()]) {
      if (agent.taskId === card.taskId) this.despawnAgent(agent.unitId, endStatus);
    }
  }

  // -------------------------------------------------------------------------
  // Persistent sessions (SPEC-V5 §V5-1)
  // -------------------------------------------------------------------------

  /**
   * Deterministic creature-name mint: seed+counter hashed into the pool, with
   * a linear probe for uniqueness (falls back to a numbered name when the
   * pool is exhausted). No engine-rng draws — pure on seed + call order.
   */
  private mintCreatureName(): string {
    const start = hashString(`${this.seed}:creature:${this.sessionOrderCounter}`) % CREATURE_NAMES.length;
    for (let offset = 0; offset < CREATURE_NAMES.length; offset += 1) {
      const name = CREATURE_NAMES[(start + offset) % CREATURE_NAMES.length]!;
      if (!this.usedCreatureNames.has(name)) {
        this.usedCreatureNames.add(name);
        return name;
      }
    }
    return `${CREATURE_NAMES[start]!} ${Math.floor(this.sessionOrderCounter / CREATURE_NAMES.length) + 1}`;
  }

  private createSession(init: {
    sessionId: string;
    role: AgentRole;
    coordination: boolean;
    taskId: string;
    agent: AdapterName;
    model: string;
    stackRef: string;
    stackName: string;
    attempt: number;
    runId: string | null;
    parentSessionId?: string | null;
    reviewOfSessionId?: string | null;
  }): SessionRecord {
    this.sessionOrderCounter += 1;
    const creatureName = this.mintCreatureName();
    const session: SessionRecord = {
      sessionId: init.sessionId,
      order: this.sessionOrderCounter,
      title: `${creatureName} ${init.coordination ? 'the Coordinator' : ROLE_TITLES[init.role]}`,
      creatureName,
      agent: init.agent,
      model: init.model,
      stackRef: init.stackRef,
      stackName: init.stackName,
      role: init.role,
      coordination: init.coordination,
      taskId: init.taskId,
      attempt: init.attempt,
      runId: init.runId,
      parentSessionId: init.parentSessionId ?? null,
      reviewOfSessionId: init.reviewOfSessionId ?? null,
      status: 'active',
      startedTick: this.tickCount,
      endedTick: null,
      turnCount: 0,
      messageCount: 1,
      tokenUsage: { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, cachedTokens: 0 },
      cost: { totalUsd: 0, inputTokens: 0, outputTokens: 0, thinkingTokens: 0 },
      transcript: [],
      transcriptSeq: 0,
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  /** Flip an ACTIVE session to its terminal status (idempotent). */
  private closeSession(sessionId: string, status: SessionStatus): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return;
    session.status = status;
    session.endedTick = this.tickCount;
    this.pushTranscript(
      session,
      'event',
      status === 'aborted' ? 'Session aborted — duty cut short.' : 'Session completed — duty discharged.',
    );
  }

  /** Append a transcript entry, ring-capped at SESSION_TRANSCRIPT_CAP. */
  private pushTranscript(
    session: SessionRecord,
    kind: SimSessionTranscriptEntry['kind'],
    text: string,
    toolName?: string,
  ): void {
    session.transcriptSeq += 1;
    session.transcript.push({
      seq: session.transcriptSeq,
      tick: this.tickCount,
      timestamp: this.now(),
      kind,
      text,
      ...(toolName !== undefined ? { toolName } : {}),
    });
    if (session.transcript.length > SESSION_TRANSCRIPT_CAP) {
      session.transcript.splice(0, session.transcript.length - SESSION_TRANSCRIPT_CAP);
    }
  }

  /** Stream coalescing: consecutive same-kind deltas grow ONE bubble entry. */
  private appendStreamEntry(session: SessionRecord, kind: 'message' | 'thinking', delta: string): void {
    const last = session.transcript[session.transcript.length - 1];
    if (last && last.kind === kind) {
      last.text += delta;
      return;
    }
    this.pushTranscript(session, kind, delta);
  }

  /** Newest matching session (by creation order). */
  private latestSession(predicate: (session: SessionRecord) => boolean): SessionRecord | undefined {
    let best: SessionRecord | undefined;
    for (const session of this.sessions.values()) {
      if (predicate(session) && (best === undefined || session.order > best.order)) best = session;
    }
    return best;
  }

  /** §V5-1: per-attempt coordination session on a STACK parent card. */
  private openCoordinationSession(card: CardRecord): SessionRecord {
    const stackRef = this.stackRefOf(card);
    const stackEntry = this.stacks.get(stackRef)!;
    const adapter = this.adapterOfStackSpec(stackEntry.stack.spec);
    this.agentCounter += 1;
    const session = this.createSession({
      sessionId: `agt-${String(this.agentCounter).padStart(3, '0')}-coordinator`,
      role: 'worker',
      coordination: true,
      taskId: card.taskId,
      agent: adapter,
      model: stackEntry.stack.spec.model || MODELS_BY_ADAPTER[adapter][0]!,
      stackRef,
      stackName: stackEntry.stack.metadata.name,
      attempt: card.attempt,
      runId: card.run?.runId ?? null,
    });
    card.coordSessionId = session.sessionId;
    this.pushTranscript(
      session,
      'event',
      `Coordination opened for attempt ${card.attempt}: marshalling ${card.childIds.length} child cards of ${card.taskId}.`,
    );
    return session;
  }

  private sessionViewOf(session: SessionRecord): SimSessionView {
    this.accrueSessionCost(session);
    return {
      sessionId: session.sessionId,
      title: session.title,
      creatureName: session.creatureName,
      agent: session.agent,
      model: session.model,
      stackRef: session.stackRef,
      stackName: session.stackName,
      role: session.role,
      coordination: session.coordination,
      taskId: session.taskId,
      attempt: session.attempt,
      runId: session.runId,
      parentSessionId: session.parentSessionId,
      reviewOfSessionId: session.reviewOfSessionId,
      status: session.status,
      startedTick: session.startedTick,
      endedTick: session.endedTick,
      turnCount: session.turnCount,
      messageCount: session.messageCount,
      tokenUsage: { ...session.tokenUsage },
      cost: { ...session.cost },
      transcriptLength: session.transcript.length,
    };
  }

  private cancelInquiriesOf(card: CardRecord): void {
    for (const inquiry of [...this.inquiries.values()]) {
      if (inquiry.taskId !== card.taskId) continue;
      this.inquiries.delete(inquiry.hookRequestId);
      this.emit({
        type: 'hook.resolved',
        hookRequestId: inquiry.hookRequestId,
        resolvedBy: 'system:card-left-column',
        decision: 'deny',
      });
      if (card.run) {
        this.resolveEffect(card.run, inquiry.effectId, 'EFFECT_CANCELLED', { reason: 'card left column' });
      }
    }
  }

  /** Token burn + transcript streaming for an active agent. */
  private streamAgentTick(agent: AgentRecord): void {
    if (agent.state === 'awaiting_input') return;
    agent.stateTicks += 1;
    const now = this.now();
    if (agent.state === 'tool_running') {
      if (agent.stateTicks >= agent.stateDuration) {
        this.emitAgentEvent(agent, {
          type: 'tool_result',
          runId: this.runIdOf(agent),
          agent: agent.agent,
          timestamp: now,
          toolCallId: `tc-${this.seed}-${String(this.toolCounter).padStart(4, '0')}`,
          toolName: agent.activeToolName ?? 'Bash',
          output: { ok: true, summary: `${agent.activeToolName ?? 'Bash'} finished cleanly` },
          durationMs: agent.stateDuration * TICK_MS,
        });
        this.pushTranscript(
          agent.session,
          'tool_result',
          `${agent.activeToolName ?? 'Bash'} finished cleanly`,
          agent.activeToolName ?? 'Bash',
        );
        agent.session.tokenUsage.inputTokens += this.rng.int(60, 400);
        agent.activeToolName = null;
        agent.state = 'thinking';
        agent.stateTicks = 0;
        agent.stateDuration = this.rng.int(2, 6);
      }
      this.accrueCost(agent);
      agent.updatedAt = now;
      return;
    }
    // thinking
    if (this.rng.chance(0.5)) {
      // One draw for the SLOT (as before); the variant rides deterministic
      // step inputs (tick + per-session transcript seq) — no extra draws.
      const slot = this.rng.int(0, THINKING_PHRASES.length - 1);
      const delta = phraseVariant(THINKING_PHRASES, slot, this.tickCount + agent.session.transcriptSeq);
      agent.accumulatedThinking += delta;
      this.appendStreamEntry(agent.session, 'thinking', delta);
      agent.session.tokenUsage.thinkingTokens += this.rng.int(6, 28);
      this.emitAgentEvent(agent, {
        type: 'thinking_delta',
        runId: this.runIdOf(agent),
        agent: agent.agent,
        timestamp: now,
        delta,
        accumulated: agent.accumulatedThinking,
      });
    } else {
      const slot = this.rng.int(0, TEXT_PHRASES.length - 1);
      const delta = phraseVariant(TEXT_PHRASES, slot, this.tickCount + agent.session.transcriptSeq);
      agent.accumulatedText += delta;
      this.appendStreamEntry(agent.session, 'message', delta);
      agent.session.tokenUsage.outputTokens += this.rng.int(8, 40);
      this.emitAgentEvent(agent, {
        type: 'text_delta',
        runId: this.runIdOf(agent),
        agent: agent.agent,
        timestamp: now,
        delta,
        accumulated: agent.accumulatedText,
      });
    }
    if (agent.stateTicks >= agent.stateDuration) {
      if (this.rng.chance(0.5)) {
        // Start a tool call.
        this.toolCounter += 1;
        const toolName = this.rng.pick(TOOL_NAMES);
        agent.activeToolName = toolName;
        agent.state = 'tool_running';
        agent.stateTicks = 0;
        agent.stateDuration = this.rng.int(2, 5);
        this.emitAgentEvent(agent, {
          type: 'tool_call_start',
          runId: this.runIdOf(agent),
          agent: agent.agent,
          timestamp: now,
          toolCallId: `tc-${this.seed}-${String(this.toolCounter).padStart(4, '0')}`,
          toolName,
          inputAccumulated: JSON.stringify({ description: `${toolName} sweep over the card` }),
        });
        this.pushTranscript(agent.session, 'tool_call', `${toolName} sweep over the card`, toolName);
      } else {
        this.emitAgentEvent(agent, {
          type: 'turn_end',
          runId: this.runIdOf(agent),
          agent: agent.agent,
          timestamp: now,
          turnIndex: agent.session.turnCount,
          cost: this.costOf(agent),
        });
        agent.session.turnCount += 1;
        agent.session.messageCount += 2;
        agent.stateTicks = 0;
        agent.stateDuration = this.rng.int(2, 6);
      }
    }
    if (agent.stateTicks % 4 === 0) {
      this.emitAgentEvent(agent, {
        type: 'token_usage',
        runId: this.runIdOf(agent),
        agent: agent.agent,
        timestamp: now,
        inputTokens: agent.session.tokenUsage.inputTokens,
        outputTokens: agent.session.tokenUsage.outputTokens,
        thinkingTokens: agent.session.tokenUsage.thinkingTokens,
      });
    }
    this.accrueCost(agent);
    agent.updatedAt = now;
  }

  // -------------------------------------------------------------------------
  // Inquiries (SPEC-V3 §V3-5)
  // -------------------------------------------------------------------------

  private raiseInquiry(card: CardRecord, agent: AgentRecord): void {
    this.hookCounter += 1;
    const template = INQUIRY_TEMPLATES[(this.hookCounter - 1) % INQUIRY_TEMPLATES.length]!;
    const hookRequestId = `hook-${this.seed}-${String(this.hookCounter).padStart(4, '0')}`;
    const title = card.resource.metadata.labels?.['a5c.ai/title'] ?? card.taskId;
    const run = card.run!;
    const effectId = this.requestEffect(run, 'breakpoint', `inquiry:${template.inquiryKind}`);
    const inquiry: InquiryRecord = {
      hookRequestId,
      runId: run.runId,
      taskId: card.taskId,
      unitId: agent.unitId,
      inquiryKind: template.inquiryKind,
      question: template.question(title),
      options: template.options.map((o) => ({ ...o })),
      deadlineTs: this.now() + HOOK_DEADLINE_MS,
      effectId,
    };
    this.inquiries.set(hookRequestId, inquiry);
    this.pushTranscript(agent.session, 'event', `Inquiry raised: ${inquiry.question}`);
    agent.state = 'awaiting_input';
    agent.pendingHookId = hookRequestId;
    agent.stateTicks = 0;
    agent.updatedAt = this.now();

    const payload: SimInquiryPayload & Record<string, unknown> = {
      question: inquiry.question,
      options: inquiry.options.map((o) => ({ ...o })),
      inquiryKind: inquiry.inquiryKind,
      taskId: card.taskId,
      unitId: agent.unitId,
    };
    const frame: HookRequestFrame = {
      type: 'hook.request',
      hookRequestId,
      runId: run.runId,
      hookKind: 'inquiry',
      payload,
      deadlineTs: inquiry.deadlineTs,
    };
    this.emit(frame);
  }

  // -------------------------------------------------------------------------
  // Memory (SPEC-V2 §V2-3, column-model adapted)
  // -------------------------------------------------------------------------

  private siloFor(card: CardRecord): { name: string; recordIds: string[] } {
    const silos = this.scenario.memory.silos;
    const index = hashString(card.resource.spec.workspaceRef ?? card.taskId) % silos.length;
    const silo = silos[index]!;
    return { name: silo.repository.metadata.name, recordIds: silo.recordIds };
  }

  private emitMemoryQuery(card: CardRecord, agent: AgentRecord): void {
    const silo = this.siloFor(card);
    if (silo.recordIds.length === 0) return;
    const count = this.rng.int(1, 3);
    const matched: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const id = silo.recordIds[this.rng.int(0, silo.recordIds.length - 1)]!;
      if (!matched.includes(id)) matched.push(id);
      if (!agent.heldPieces.includes(id)) agent.heldPieces.push(id);
    }
    // §V4-9: accumulate the READ ledger from memory_query events.
    for (const id of matched) {
      card.memoryReads.push({
        recordId: id,
        kind: this.scenario.memory.records.find((r) => r.id === id)?.nodeKind ?? 'Term',
        silo: silo.name,
        tick: this.tickCount,
        unitId: agent.unitId,
      });
    }
    this.emitSimEvent(card, {
      type: 'memory_query',
      runId: card.run?.runId ?? 'run-none',
      agent: agent.agent,
      timestamp: this.now(),
      taskId: card.taskId,
      unitId: agent.unitId,
      silo: silo.name,
      matchedIds: matched,
      totalMatches: matched.length,
      queryText: `${card.taskKind} practice for ${card.resource.spec.repository}`,
    });
  }

  private emitMemoryUpdate(card: CardRecord, agent: AgentRecord): void {
    const silo = this.siloFor(card);
    const changes = card.ws.files.slice(0, 2).map((f) => ({
      path: `notes/${card.taskId}.md`,
      action: 'add',
      reason: `Lessons from ${f.path}`,
    }));
    // §V4-9: accumulate the WRITTEN ledger from memory_update events.
    this.memoryUpdateCounter += 1;
    const updateId = `mu-${this.seed}-${String(this.memoryUpdateCounter).padStart(4, '0')}`;
    const phase =
      card.run !== null
        ? (card.run.phases[Math.min(card.run.phaseIndex, card.run.phases.length - 1)] ?? 'work')
        : 'work';
    card.memoryWrites.push({
      updateId,
      silo: silo.name,
      changes: changes.map((c) => ({ ...c })),
      phase,
      tick: this.tickCount,
      unitId: agent.unitId,
    });
    this.emitSimEvent(card, {
      type: 'memory_update',
      runId: card.run?.runId ?? 'run-none',
      agent: agent.agent,
      timestamp: this.now(),
      taskId: card.taskId,
      unitId: agent.unitId,
      silo: silo.name,
      updateId,
      updateKind: 'proposed-pr',
      branchName: `memory/${card.taskId}`,
      phase,
      changes,
    });
  }

  // -------------------------------------------------------------------------
  // Per-card babysitter run + journal (SPEC-V2 §V2-5)
  // -------------------------------------------------------------------------

  private ensureRun(card: CardRecord): void {
    if (card.run && card.run.terminal === null) return;
    this.runCounter += 1;
    const runId = `run-${this.seed}-${String(this.runCounter).padStart(4, '0')}`;
    const now = this.now();
    // §V4-6: pin the CURRENT process template revision to this run.
    const template = this.templates.get(card.taskKind)!;
    const run: CardRunRecord = {
      runId,
      entry: {
        runId,
        agent: WORKER_ADAPTER_BY_KIND[card.taskKind],
        model: MODELS_BY_ADAPTER[WORKER_ADAPTER_BY_KIND[card.taskKind]][0]!,
        cwd: `/ws/${card.resource.spec.workspaceRef ?? ''}`,
        status: 'running',
        createdAt: now,
        startedAt: now,
        endedAt: null,
        sessionId: card.taskId,
        owner: { tokenId: 'mock-token', name: 'commander', remoteAddress: null },
        workspaceId: card.resource.spec.workspaceRef ?? '',
      },
      seq: 0,
      journal: [],
      journalSeq: 0,
      phases: [...template.phases],
      phaseIndex: 0,
      phaseTicksLeft: 0,
      openEffects: [],
      effectCounter: 0,
      terminal: null,
      taskId: card.taskId,
      taskKind: card.taskKind,
      processId: `commander/${card.taskKind}@v${template.revision}`,
      processRevision: template.revision,
      tokens: { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, cachedTokens: 0 },
      costUsd: 0,
    };
    this.runs.set(runId, run);
    card.run = run;
    this.appendJournal(run, 'RUN_CREATED', {
      processId: run.processId,
      processRevision: run.processRevision,
      taskId: card.taskId,
    });
  }

  private requestPhaseEffect(_card: CardRecord, run: CardRunRecord): void {
    // §V4-4: lifecycle phase durations roughly double the v3 values (6–12).
    run.phaseTicksLeft = this.rng.int(12, 24);
    this.requestEffect(run, 'node', run.phases[run.phaseIndex] ?? 'work');
  }

  private requestEffect(run: CardRunRecord, kind: EffectKind, label: string): string {
    run.effectCounter += 1;
    const effectId = `S${String(run.effectCounter).padStart(6, '0')}`;
    run.openEffects.push({ effectId, kind, label });
    this.appendJournal(run, 'EFFECT_REQUESTED', { effectId, kind, label });
    return effectId;
  }

  private resolveEffect(
    run: CardRunRecord,
    effectId: string,
    type: Extract<JournalEventType, 'EFFECT_RESOLVED' | 'EFFECT_CANCELLED'>,
    data: Record<string, unknown>,
  ): void {
    const index = run.openEffects.findIndex((e) => e.effectId === effectId);
    if (index === -1) return;
    const [effect] = run.openEffects.splice(index, 1);
    this.appendJournal(run, type, { effectId, kind: effect!.kind, label: effect!.label, ...data });
  }

  private terminateRun(
    card: CardRecord,
    run: CardRunRecord,
    type: Extract<JournalEventType, 'RUN_COMPLETED' | 'RUN_FAILED' | 'RUN_HALTED'>,
  ): void {
    for (const effect of [...run.openEffects]) {
      this.resolveEffect(run, effect.effectId, 'EFFECT_RESOLVED', { reason: 'terminal' });
    }
    this.appendJournal(run, type, { taskId: card.taskId });
    run.terminal = type === 'RUN_COMPLETED' ? 'completed' : 'failed';
    run.entry.status = type === 'RUN_COMPLETED' ? 'completed' : 'failed';
    run.entry.endedAt = this.now();
    run.entry.exitReason = type === 'RUN_COMPLETED' ? 'completed' : 'crashed';
  }

  private appendJournal(run: CardRunRecord, type: JournalEventType, data: Record<string, unknown>): void {
    run.journalSeq += 1;
    this.ulidCounter += 1;
    const event: JournalEvent = {
      seq: run.journalSeq,
      ulid: this.deterministicUlid(),
      type,
      recordedAt: this.now(),
      data,
    };
    run.journal.push(event);
    if (run.journal.length > JOURNAL_CAP) run.journal.splice(0, run.journal.length - JOURNAL_CAP);
  }

  // -------------------------------------------------------------------------
  // Workspace (SPEC-V2 §V2-7)
  // -------------------------------------------------------------------------

  private initWorkspace(card: CardRecord): void {
    if (card.ws.phase === 'ready' && card.ws.files.length > 0) {
      // Rework iteration: the diff iterates rather than resets.
      card.ws.dirty = true;
      return;
    }
    card.ws = {
      phase: 'ready',
      branch: `agent/${card.taskId}`,
      headSha: this.deterministicSha(`${card.taskId}:head:${card.attempt}`),
      ahead: 0,
      behind: this.rng.int(0, 2),
      dirty: false,
      files: [],
      testEvidence: { status: 'unknown' },
      reviewerNotes: [],
    };
  }

  private addWorkspaceChange(card: CardRecord, phaseIndex: number): void {
    const pool = FILE_POOLS[card.taskKind];
    const path = pool[(phaseIndex + card.attempt - 1) % pool.length]!;
    const title = card.resource.metadata.labels?.['a5c.ai/title'] ?? card.taskId;
    const existing = card.ws.files.find((f) => f.path === path);
    const status: 'A' | 'M' | 'D' = existing ? 'M' : phaseIndex === 0 ? 'M' : this.rng.chance(0.2) ? 'D' : 'A';
    const bodyLines = this.rng.int(2, 9);
    const additions = status === 'D' ? 0 : this.rng.int(1, bodyLines);
    const deletions = status === 'A' ? this.rng.int(0, 1) : this.rng.int(1, bodyLines);
    const lines: string[] = [`@@ -${this.rng.int(1, 40)},${deletions + 2} +${this.rng.int(1, 40)},${additions + 2} @@`];
    lines.push(` // context: ${title}`);
    for (let i = 0; i < deletions; i += 1) lines.push(`-  const legacy${i} = previousMechanism('${title}');`);
    for (let i = 0; i < additions; i += 1) lines.push(`+  const forged${i} = rebuildMechanism('${title}', ${i});`);
    lines.push(` // end: ${path}`);
    const diff = lines.slice(0, 25).join('\n');
    if (existing) {
      existing.status = 'M';
      existing.additions += additions;
      existing.deletions += deletions;
      existing.diff = diff;
    } else {
      card.ws.files.push({ path, status, additions: Math.max(additions, 1), deletions: Math.max(deletions, status === 'A' ? 0 : 1), diff });
    }
    card.ws.dirty = true;
    card.ws.ahead += 1;
    this.emitSimEvent(card, {
      type: 'workspace_change',
      runId: card.run?.runId ?? 'run-none',
      agent: card.workerAdapter ?? 'commander',
      timestamp: this.now(),
      taskId: card.taskId,
      path,
      status,
    });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private addCard(resource: CommanderTask, taskKind: TaskKind, parentId: string | null): CardRecord {
    this.orderCounter += 1;
    const card: CardRecord = {
      taskId: resource.metadata.name,
      resource,
      taskKind,
      parentId,
      childIds: [],
      column: 'backlog',
      order: this.orderCounter,
      yolo: false,
      merged: false,
      progress: 0,
      attempt: 0,
      feedback: null,
      run: null,
      ws: {
        phase: 'created',
        branch: '',
        headSha: '',
        ahead: 0,
        behind: 0,
        dirty: false,
        files: [],
        testEvidence: { status: 'unknown' },
        reviewerNotes: [],
      },
      reviewTicksLeft: 0,
      integrationSteps: [],
      integrationIndex: 0,
      integrationTicksLeft: 0,
      pendingFollowUps: [],
      inquiriesThisAttempt: 0,
      workerAdapter: null,
      coordSessionId: null,
      approvingReviewSessionId: null,
      stackRefOverride: null,
      description: '',
      releaseId: null,
      inProductionAtTick: null,
      fileOverrides: new Map(),
      memoryReads: [],
      memoryWrites: [],
      workerAgentId: null,
      reviewerAgentId: null,
      humanAssigneeId: null,
    };
    this.cards.set(card.taskId, card);
    if (parentId !== null) {
      const parent = this.cards.get(parentId);
      if (parent && !parent.childIds.includes(card.taskId)) parent.childIds.push(card.taskId);
    }
    return card;
  }

  private topLevelOf(card: CardRecord): CardRecord {
    return card.parentId !== null ? (this.cards.get(card.parentId) ?? card) : card;
  }

  private titleOf(card: CardRecord): string {
    return card.resource.metadata.labels?.['a5c.ai/title'] ?? card.taskId;
  }

  /** §V4-5: resolved stack binding — explicit override, else kind-mapped default. */
  private stackRefOf(card: CardRecord): string {
    if (card.stackRefOverride !== null && this.stacks.has(card.stackRefOverride)) {
      return card.stackRefOverride;
    }
    return DEFAULT_STACK_BY_KIND[card.taskKind];
  }

  /** Narrow a stack's adapter binding to a known AdapterName (sim families). */
  private adapterOfStackSpec(spec: { adapter: string; baseAgent: string }): AdapterName {
    const candidates = [spec.adapter, spec.adapter.replace(/^adapters\./, ''), spec.baseAgent];
    for (const candidate of candidates) {
      if ((ADAPTERS as readonly string[]).includes(candidate)) return candidate as AdapterName;
    }
    return 'claude-code';
  }

  /** §V4-1 revert: lift the merged seal so the card can iterate again. */
  private unseal(card: CardRecord): void {
    card.merged = false;
    card.progress = 0;
    card.resource.status.phase = 'Pending';
    card.inProductionAtTick = null;
    for (const childId of card.childIds) {
      const child = this.cards.get(childId);
      if (child) {
        child.merged = false;
        child.progress = 0;
        child.resource.status.phase = 'Pending';
        child.inProductionAtTick = null;
      }
    }
  }

  /** §V4-1: one wagon of the release train ships to IN PRODUCTION (v5-r0: atomic, stagger index rides the payload). */
  private shipCard(card: CardRecord, releaseId: string, stagger: number): void {
    card.releaseId = releaseId;
    for (const childId of card.childIds) {
      const child = this.cards.get(childId);
      if (child) child.releaseId = releaseId;
    }
    this.emitSimEvent(card, {
      type: 'release_shipped',
      runId: card.run?.runId ?? 'run-none',
      agent: 'commander',
      timestamp: this.now(),
      taskId: card.taskId,
      releaseId,
      stagger,
    });
    this.transitionCard(card, 'in-production', 'release-shipped', stagger);
  }

  /** §V4-6: project a run record into its registry row (live agents add on top). */
  private runViewOf(run: CardRunRecord): SimRunView {
    const pendingEffectsByKind: PendingEffectsByKind = {};
    for (const effect of run.openEffects) {
      pendingEffectsByKind[effect.kind] = (pendingEffectsByKind[effect.kind] ?? 0) + 1;
    }
    const tokens = { ...run.tokens };
    let costUsd = run.costUsd;
    for (const agent of this.agents.values()) {
      if (this.runIdOf(agent) !== run.runId) continue;
      tokens.inputTokens += agent.session.tokenUsage.inputTokens;
      tokens.outputTokens += agent.session.tokenUsage.outputTokens;
      tokens.thinkingTokens += agent.session.tokenUsage.thinkingTokens;
      tokens.cachedTokens += agent.session.tokenUsage.cachedTokens;
      costUsd += this.costOf(agent).totalUsd;
    }
    return {
      runId: run.runId,
      taskId: run.taskId,
      taskKind: run.taskKind,
      processId: run.processId,
      processRevision: run.processRevision,
      observedState:
        run.terminal === 'completed'
          ? 'completed'
          : run.terminal === 'failed'
            ? 'failed'
            : deriveObservedRunState(run.journal),
      pendingEffectsByKind,
      phases: run.phases.map((label, index) => ({
        label,
        status: index < run.phaseIndex ? 'done' : index === run.phaseIndex ? 'current' : 'pending',
      })),
      tokens,
      costUsd: roundTo(costUsd, 6),
      startedAt: run.entry.startedAt ?? run.entry.createdAt,
      endedAt: run.entry.endedAt,
    };
  }

  /**
   * §V4-8: the deterministic flat path list of a card's workspace — a
   * plausible repo skeleton per task kind (8–20 files), guaranteed to include
   * the kind's change pool and any editor-written files. Pure (local Prng).
   */
  private workspacePathsOf(card: CardRecord): string[] {
    const rng = new Prng(hashString(`${this.seed}:tree:${card.taskId}`));
    const paths = new Set<string>([
      'package.json',
      'README.md',
      'tsconfig.json',
      'src/index.ts',
      'src/core/registry.ts',
      'tests/core.test.ts',
      'docs/overview.md',
    ]);
    for (const path of FILE_POOLS[card.taskKind]) paths.add(path);
    const extras = [
      'src/core/mechanism.ts',
      'src/engine/valves.ts',
      'src/util/gauges.ts',
      'tests/engine.test.ts',
      'docs/decisions.md',
      'scripts/build.sh',
      '.gitignore',
      'vitest.config.ts',
    ];
    const extraCount = rng.int(2, Math.min(5, 20 - paths.size));
    for (let i = 0; i < extraCount; i += 1) {
      paths.add(extras[rng.int(0, extras.length - 1)]!);
    }
    for (const file of card.ws.files) paths.add(file.path);
    for (const path of card.fileOverrides.keys()) paths.add(path);
    return [...paths].sort();
  }

  private progressOf(card: CardRecord): number {
    if (card.merged) return 1;
    if (card.childIds.length > 0) {
      const children = card.childIds
        .map((id) => this.cards.get(id))
        .filter((c): c is CardRecord => c !== undefined);
      if (children.length === 0) return card.progress;
      return children.reduce((sum, c) => sum + this.progressOf(c), 0) / children.length;
    }
    return card.progress;
  }

  private compatTaskState(card: CardRecord): SimTaskState {
    if (card.merged) return 'done';
    switch (card.column) {
      case 'backlog':
        return 'queued';
      case 'do':
        return card.progress > 0 ? 'in_progress' : 'assigned';
      case 'ai-review':
      case 'human-review':
      case 'approved':
        return 'review';
      case 'merged':
      case 'in-production':
        return 'done';
    }
  }

  private workspaceOf(taskId: string): string {
    return this.cards.get(taskId)?.resource.spec.workspaceRef ?? '';
  }

  private runIdOf(agent: AgentRecord): string {
    return this.cards.get(agent.taskId)?.run?.runId ?? 'run-none';
  }

  /** §V5-1: cost accrues on the SESSION (live agent and record share it). */
  private accrueSessionCost(session: SessionRecord): void {
    const pricing = PRICING[session.agent] ?? { input: 2e-6, output: 8e-6 };
    const usage = session.tokenUsage;
    session.cost = {
      totalUsd: roundTo(
        usage.inputTokens * pricing.input +
          (usage.outputTokens + usage.thinkingTokens) * pricing.output,
        6,
      ),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      thinkingTokens: usage.thinkingTokens,
    };
  }

  private accrueCost(agent: AgentRecord): void {
    this.accrueSessionCost(agent.session);
  }

  private costOf(agent: AgentRecord): CostRecord {
    this.accrueCost(agent);
    return { ...agent.session.cost };
  }

  private deterministicSha(key: string): string {
    const hex = '0123456789abcdef';
    let h = hashString(`${this.seed}:${key}`);
    let out = '';
    for (let i = 0; i < 12; i += 1) {
      out += hex[h & 0xf];
      h = (Math.imul(h, 0x01000193) ^ (h >>> 7)) >>> 0;
    }
    return out;
  }

  /** Sortable pseudo-ULID derived from the sim clock + a global counter. */
  private deterministicUlid(): string {
    const time = this.now().toString(32).toUpperCase().padStart(10, '0');
    const tail = hashString(`${this.seed}:ulid:${this.ulidCounter}`)
      .toString(32)
      .toUpperCase()
      .padStart(8, '0');
    return `${time}${String(this.ulidCounter % 1024).padStart(4, '0')}${tail}`.slice(0, 26);
  }

  private emit(frame: ServerFrame): void {
    for (const listener of [...this.listeners]) {
      listener(frame);
    }
  }

  private emitSimMove(
    card: CardRecord,
    from: ColumnId,
    to: ColumnId,
    reason: CardMovedEventPayload['reason'],
    stagger?: number,
  ): void {
    const payload: CardMovedEventPayload = {
      type: 'card_moved',
      runId: card.run?.runId ?? 'run-none',
      agent: card.workerAdapter ?? 'commander',
      timestamp: this.now(),
      taskId: card.taskId,
      from,
      to,
      reason,
      ...(stagger !== undefined ? { stagger } : {}),
    };
    this.emitEnveloped(payload.runId, payload.agent, { ...payload });
  }

  private emitSimEvent(_card: CardRecord | null, payload: SimLocalEventPayload): void {
    this.emitEnveloped(payload.runId, payload.agent, { ...payload });
  }

  private emitAgentEvent(agent: AgentRecord, event: AgentEvent): void {
    this.emitEnveloped(event.runId !== '' ? event.runId : this.runIdOf(agent), agent.agent, {
      ...event,
      sessionId: agent.unitId,
    });
  }

  private emitEnveloped(runId: string, source: string, event: Record<string, unknown>): void {
    const run = this.runs.get(runId);
    const seq = run ? (run.seq += 1) : 0;
    this.emit({ type: 'run.event', runId, seq, source, event: { ...event } });
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Deterministic tree ordering: directories first, then alphabetical. */
function sortTree(node: SimFileTreeNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  for (const child of node.children) sortTree(child);
}

/** Extract a `task:<taskId>` reference from a steer prompt (v1 compat). */
export function parseTaskRef(prompt: string): string | null {
  const match = /task:([A-Za-z0-9_-]+)/.exec(prompt);
  return match ? (match[1] ?? null) : null;
}

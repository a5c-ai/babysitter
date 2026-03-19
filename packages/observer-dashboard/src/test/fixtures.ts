import type {
  Run,
  RunStatus,
  TaskEffect,
  TaskKind,
  TaskStatus,
  TaskDetail,
  JournalEvent,
  EventType,
  ProjectSummary,
  RunDigest,
} from '@/types';
import type { BreakpointPayload } from '@/types/breakpoint';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function nextId(prefix = 'test'): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter).padStart(6, '0')}`;
}

/** Reset the ID counter between test suites if needed. */
export function resetIdCounter(): void {
  idCounter = 0;
}

function isoNow(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

// ---------------------------------------------------------------------------
// TaskEffect factory
// ---------------------------------------------------------------------------

export interface CreateMockTaskEffectOptions {
  effectId?: string;
  kind?: TaskKind;
  title?: string;
  label?: string;
  status?: TaskStatus;
  invocationKey?: string;
  stepId?: string;
  taskId?: string;
  requestedAt?: string;
  resolvedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  error?: { name: string; message: string; stack?: string };
  breakpointQuestion?: string;
  agent?: { name: string; prompt?: { role: string; task: string; instructions: string[] } };
}

export function createMockTaskEffect(overrides: CreateMockTaskEffectOptions = {}): TaskEffect {
  const id = overrides.effectId ?? nextId('eff');
  const status = overrides.status ?? 'resolved';
  const requestedAt = overrides.requestedAt ?? isoNow(-5000);
  const resolvedAt =
    status === 'resolved' ? (overrides.resolvedAt ?? isoNow(-1000)) : overrides.resolvedAt;

  return {
    effectId: id,
    kind: overrides.kind ?? 'node',
    title: overrides.title ?? `Task ${id}`,
    label: overrides.label ?? `run-task-${id}`,
    status,
    invocationKey: overrides.invocationKey ?? nextId('inv'),
    stepId: overrides.stepId ?? nextId('step'),
    taskId: overrides.taskId ?? nextId('task'),
    requestedAt,
    resolvedAt,
    startedAt: overrides.startedAt ?? requestedAt,
    finishedAt: overrides.finishedAt ?? resolvedAt,
    duration: overrides.duration ?? 4000,
    error: overrides.error,
    breakpointQuestion: overrides.breakpointQuestion,
    agent: overrides.agent,
  };
}

// ---------------------------------------------------------------------------
// JournalEvent factory
// ---------------------------------------------------------------------------

export interface CreateMockJournalEventOptions {
  seq?: number;
  id?: string;
  ts?: string;
  type?: EventType;
  payload?: Record<string, unknown>;
}

export function createMockJournalEvent(
  overrides: CreateMockJournalEventOptions = {},
): JournalEvent {
  return {
    seq: overrides.seq ?? 1,
    id: overrides.id ?? nextId('evt'),
    ts: overrides.ts ?? isoNow(),
    type: overrides.type ?? 'EFFECT_REQUESTED',
    payload: overrides.payload ?? { effectId: nextId('eff') },
  };
}

// ---------------------------------------------------------------------------
// Run factory
// ---------------------------------------------------------------------------

export interface CreateMockRunOptions {
  runId?: string;
  processId?: string;
  status?: RunStatus;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  sessionId?: string;
  tasks?: TaskEffect[];
  events?: JournalEvent[];
  totalTasks?: number;
  completedTasks?: number;
  failedTasks?: number;
  duration?: number;
  failedStep?: string;
  breakpointQuestion?: string;
  sourceLabel?: string;
  projectName?: string;
  isStale?: boolean;
  waitingKind?: 'breakpoint' | 'task';
}

export function createMockRun(overrides: CreateMockRunOptions = {}): Run {
  const tasks = overrides.tasks ?? [
    createMockTaskEffect({ status: 'resolved', kind: 'node' }),
    createMockTaskEffect({ status: 'resolved', kind: 'agent' }),
    createMockTaskEffect({ status: 'requested', kind: 'shell' }),
  ];

  const completedTasks =
    overrides.completedTasks ?? tasks.filter((t) => t.status === 'resolved').length;
  const failedTasks =
    overrides.failedTasks ?? tasks.filter((t) => t.status === 'error').length;

  return {
    runId: overrides.runId ?? nextId('run'),
    processId: overrides.processId ?? 'data-pipeline/ingest',
    status: overrides.status ?? 'completed',
    createdAt: overrides.createdAt ?? isoNow(-60000),
    updatedAt: overrides.updatedAt ?? isoNow(-1000),
    completedAt: overrides.completedAt,
    sessionId: overrides.sessionId ?? nextId('session'),
    tasks,
    events: overrides.events ?? [
      createMockJournalEvent({ type: 'RUN_CREATED', seq: 0 }),
      createMockJournalEvent({ type: 'EFFECT_REQUESTED', seq: 1 }),
      createMockJournalEvent({ type: 'EFFECT_RESOLVED', seq: 2 }),
    ],
    totalTasks: overrides.totalTasks ?? tasks.length,
    completedTasks,
    failedTasks,
    duration: overrides.duration ?? 59000,
    failedStep: overrides.failedStep,
    breakpointQuestion: overrides.breakpointQuestion,
    sourceLabel: overrides.sourceLabel ?? 'cli',
    projectName: overrides.projectName ?? 'my-project',
    isStale: overrides.isStale,
    waitingKind: overrides.waitingKind,
  };
}

// ---------------------------------------------------------------------------
// TaskDetail factory (extends TaskEffect with extra fields)
// ---------------------------------------------------------------------------

export interface CreateMockTaskDetailOptions extends CreateMockTaskEffectOptions {
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stdout?: string;
  stderr?: string;
  taskDef?: Record<string, unknown>;
  breakpoint?: BreakpointPayload;
}

export function createMockTaskDetail(overrides: CreateMockTaskDetailOptions = {}): TaskDetail {
  const base = createMockTaskEffect(overrides);

  return {
    ...base,
    input: overrides.input ?? { query: 'test input' },
    result: overrides.result ?? { output: 'test output', exitCode: 0 },
    stdout: overrides.stdout ?? 'Hello from stdout\n',
    stderr: overrides.stderr ?? '',
    taskDef: overrides.taskDef,
    breakpoint: overrides.breakpoint,
  };
}

// ---------------------------------------------------------------------------
// ProjectSummary factory
// ---------------------------------------------------------------------------

export interface CreateMockProjectSummaryOptions {
  projectName?: string;
  totalRuns?: number;
  activeRuns?: number;
  completedRuns?: number;
  failedRuns?: number;
  staleRuns?: number;
  totalTasks?: number;
  completedTasksAggregate?: number;
  latestUpdate?: string;
}

export function createMockProjectSummary(
  overrides: CreateMockProjectSummaryOptions = {},
): ProjectSummary {
  return {
    projectName: overrides.projectName ?? 'my-project',
    totalRuns: overrides.totalRuns ?? 10,
    activeRuns: overrides.activeRuns ?? 2,
    completedRuns: overrides.completedRuns ?? 7,
    failedRuns: overrides.failedRuns ?? 1,
    staleRuns: overrides.staleRuns ?? 0,
    totalTasks: overrides.totalTasks ?? 50,
    completedTasksAggregate: overrides.completedTasksAggregate ?? 45,
    latestUpdate: overrides.latestUpdate ?? isoNow(),
    pendingBreakpoints: 0,
    breakpointRuns: [],
  };
}

// ---------------------------------------------------------------------------
// RunDigest factory
// ---------------------------------------------------------------------------

export interface CreateMockRunDigestOptions {
  runId?: string;
  latestSeq?: number;
  status?: RunStatus;
  taskCount?: number;
  completedTasks?: number;
  updatedAt?: string;
  pendingBreakpoints?: number;
  breakpointQuestion?: string;
  sourceLabel?: string;
  projectName?: string;
  isStale?: boolean;
  waitingKind?: 'breakpoint' | 'task';
}

export function createMockRunDigest(overrides: CreateMockRunDigestOptions = {}): RunDigest {
  return {
    runId: overrides.runId ?? nextId('run'),
    latestSeq: overrides.latestSeq ?? 5,
    status: overrides.status ?? 'completed',
    taskCount: overrides.taskCount ?? 3,
    completedTasks: overrides.completedTasks ?? 3,
    updatedAt: overrides.updatedAt ?? isoNow(),
    pendingBreakpoints: overrides.pendingBreakpoints,
    breakpointQuestion: overrides.breakpointQuestion,
    sourceLabel: overrides.sourceLabel ?? 'cli',
    projectName: overrides.projectName ?? 'my-project',
    isStale: overrides.isStale,
    waitingKind: overrides.waitingKind,
  };
}

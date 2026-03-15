export type RunStatus = 'pending' | 'waiting' | 'completed' | 'failed';
export type TaskKind = 'node' | 'agent' | 'skill' | 'breakpoint' | 'shell' | 'sleep';
export type TaskStatus = 'requested' | 'resolved' | 'error';
export type EventType = 'RUN_CREATED' | 'EFFECT_REQUESTED' | 'EFFECT_RESOLVED' | 'RUN_COMPLETED' | 'RUN_FAILED';

export interface JournalEvent {
  seq: number;
  id: string;
  ts: string;
  type: EventType;
  payload: Record<string, unknown>;
  checksum?: string;
}

export interface TaskEffect {
  effectId: string;
  kind: TaskKind;
  title: string;
  label?: string;
  status: TaskStatus;
  invocationKey?: string;
  stepId?: string;
  taskId?: string;
  requestedAt?: string;
  resolvedAt?: string;
  duration?: number;
  error?: string;
  breakpointQuestion?: string;
  agent?: { name: string; prompt?: Record<string, unknown> };
}

export interface TaskDetail extends TaskEffect {
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stdout?: string;
  stderr?: string;
  taskDef?: Record<string, unknown>;
}

export interface Run {
  runId: string;
  processId: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  tasks: TaskEffect[];
  events: JournalEvent[];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  duration?: number;
  failureError?: string;
  failureMessage?: string;
  breakpointQuestion?: string;
  breakpointEffectId?: string;
  waitingKind?: 'breakpoint' | 'task';
  isStale: boolean;
  prompt?: string;
}

export interface RunDigest {
  runId: string;
  processId: string;
  status: RunStatus;
  taskCount: number;
  completedTasks: number;
  updatedAt: string;
  pendingBreakpoints: number;
  breakpointQuestion?: string;
  breakpointEffectId?: string;
  waitingKind?: 'breakpoint' | 'task';
  isStale: boolean;
}

import type {
  CostRecord,
  RunOptions,
  RunResult,
  WorkspaceRuntimeSurface,
  WorkspaceSessionContext,
} from '@a5c-ai/agent-mux-comm';

export type RunStatus = 'running' | 'completed' | 'aborted' | 'failed';

export interface RunOwner {
  tokenId: string | null;
  name: string | null;
  remoteAddress?: string | null;
}

export interface RunStartInput extends Partial<Omit<RunOptions, 'agent' | 'prompt' | 'runId' | 'hooks'>> {
  agent: string;
  prompt: string | string[];
  runId?: string;
  workspaceId?: string;
}

export interface RunEntry {
  runId: string;
  agent: string;
  model?: string;
  cwd?: string;
  status: RunStatus;
  createdAt: number;
  startedAt: number;
  endedAt: number | null;
  sessionId?: string;
  exitReason?: RunResult['exitReason'];
  error?: {
    code: string;
    message: string;
  } | null;
  owner: RunOwner;
  workspaceId?: string;
  workspace?: WorkspaceSessionContext;
}

export type SessionStatus = 'active' | 'inactive';

export interface SessionEntry {
  sessionId: string;
  agent: string;
  status: SessionStatus;
  activeRunId: string | null;
  latestRunId: string | null;
  createdAt: number;
  updatedAt: number;
  latestRunStartedAt: number | null;
  latestRunEndedAt: number | null;
  latestExitReason?: RunResult['exitReason'];
  title?: string;
  turnCount?: number;
  messageCount?: number;
  model?: string;
  cost?: CostRecord;
  cwd?: string;
  workspaceId?: string;
  workspace?: WorkspaceSessionContext;
  runtime?: WorkspaceRuntimeSurface;
  source?: 'gateway' | 'native' | 'merged';
}

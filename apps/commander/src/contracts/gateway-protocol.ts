/**
 * Mirrored gateway protocol contracts (SPEC §2).
 *
 * Faithful mirror of `@a5c-ai/adapters-gateway`:
 *   - WS protocol v1: `packages/adapters/gateway/src/protocol/v1.ts`
 *     (ClientFrame / ServerFrame discriminated unions — mirrored exactly)
 *   - Run registry: `packages/adapters/gateway/src/runs/types.ts`
 *     (RunEntry / RunStatus / SessionEntry / SessionStatus / RunOwner)
 *   - REST surface: `packages/adapters/gateway/src/server.ts` +
 *     `builtin-adapters.ts` (`GET /api/v1/agents` → RunnableGatewayAgent,
 *     mirrored here as `AgentSummary`)
 */

import type {
  Attachment,
  CostRecord,
  RunExitReason,
  WorkspaceRuntimeSurface,
  WorkspaceSessionContext,
} from './adapter-events';

// ---------------------------------------------------------------------------
// Protocol v1 frames (mirror: protocol/v1.ts — exact)
// ---------------------------------------------------------------------------

export type ProtocolVersion = '1';

export interface AuthFrame {
  type: 'auth';
  token: string;
}

export interface HelloFrame {
  type: 'hello';
  protocolVersions: ProtocolVersion[];
  serverVersion: string;
  serverTime: string;
}

export interface ErrorFrame {
  type: 'error';
  code: string;
  message: string;
  runId?: string;
  tailSeq?: number;
}

export interface SubscribeFrame {
  type: 'subscribe';
  runId: string;
  sinceSeq?: number;
}

export interface UnsubscribeFrame {
  type: 'unsubscribe';
  runId: string;
}

export interface SessionSubscribeFrame {
  type: 'session.subscribe';
  sessionId: string;
}

export interface SessionUnsubscribeFrame {
  type: 'session.unsubscribe';
  sessionId: string;
}

export interface SessionStartFrame {
  type: 'session.start';
  agent: string;
  prompt: string;
  model?: string;
  attachments?: Attachment[];
  approvalMode?: 'yolo' | 'prompt' | 'deny';
  sessionId?: string;
  runId?: string;
  cwd?: string;
  workspaceId?: string;
  forkSessionId?: string;
}

export interface SessionMessageFrame {
  type: 'session.message';
  sessionId: string;
  prompt: string;
  agent?: string;
  model?: string;
  attachments?: Attachment[];
  approvalMode?: 'yolo' | 'prompt' | 'deny';
}

export interface PingFrame {
  type: 'ping';
}

export interface PongFrame {
  type: 'pong';
}

export interface RunEventFrame {
  type: 'run.event';
  runId: string;
  seq: number;
  source: string;
  event: Record<string, unknown>;
}

export interface HookRequestFrame {
  type: 'hook.request';
  hookRequestId: string;
  runId: string;
  hookKind: string;
  payload: Record<string, unknown>;
  deadlineTs: number;
}

export interface HookDecisionFrame {
  type: 'hook.decision';
  hookRequestId: string;
  decision: 'allow' | 'deny';
  reason?: string;
  /**
   * SPEC-V3 §V3-5 extension (NOT in gateway protocol v1): the chosen inquiry
   * option id when a breakpoint carries an option palette. Legacy approve/deny
   * is the degenerate 2-option case. KNOWN v1-PROTOCOL GAP to raise upstream.
   */
  optionId?: string;
}

export interface HookResolvedFrame {
  type: 'hook.resolved';
  hookRequestId: string;
  resolvedBy: string;
  decision: 'allow' | 'deny';
}

export interface PairingRegisterFrame {
  type: 'pairing.register';
  code: string;
  url: string;
  token: string;
}

export interface PairingConsumeFrame {
  type: 'pairing.consume';
  code: string;
}

export interface PairingConsumedFrame {
  type: 'pairing.consumed';
  code: string;
  url: string;
  token: string;
  expiresAt: number;
}

export type ClientFrame =
  | AuthFrame
  | SubscribeFrame
  | UnsubscribeFrame
  | SessionSubscribeFrame
  | SessionUnsubscribeFrame
  | SessionStartFrame
  | SessionMessageFrame
  | PingFrame
  | HookDecisionFrame
  | PairingRegisterFrame
  | PairingConsumeFrame;

export type ServerFrame =
  | HelloFrame
  | ErrorFrame
  | PongFrame
  | RunEventFrame
  | HookRequestFrame
  | HookResolvedFrame
  | PairingConsumedFrame;

export type GatewayFrame = ClientFrame | ServerFrame;

// ---------------------------------------------------------------------------
// Run / session registry entries (mirror: runs/types.ts)
// ---------------------------------------------------------------------------

export type RunStatus = 'running' | 'completed' | 'aborted' | 'failed';

export interface RunOwner {
  tokenId: string | null;
  name: string | null;
  remoteAddress?: string | null;
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
  exitReason?: RunExitReason;
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
  latestExitReason?: RunExitReason;
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

// ---------------------------------------------------------------------------
// REST surface: GET /api/v1/agents (mirror: builtin-adapters.ts RunnableGatewayAgent)
// ---------------------------------------------------------------------------

/** One runnable agent descriptor, as returned by `GET /api/v1/agents`. */
export interface AgentSummary {
  agent: string;
  displayName: string;
  adapterType: string;
  structuredSessionTransport: 'none' | 'restart-per-turn' | 'persistent';
  sessionControlPlane: 'self-managed' | 'external-host' | 'mcp-mediated';
  supportsInteractiveMode: boolean;
  canResume: boolean;
  supportsImageInput: boolean;
  supportsFileAttachments: boolean;
  approvalModes: Array<'yolo' | 'prompt' | 'deny'>;
}

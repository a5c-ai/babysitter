import type { Attachment } from '@a5c-ai/agent-mux-comm';

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

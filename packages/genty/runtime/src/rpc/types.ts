export interface RpcRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface RpcResponse {
  id: string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface RpcEvent {
  event: string;
  data: unknown;
  timestamp: string;
}

export type RpcMessage = RpcRequest | RpcResponse | RpcEvent;

export const RPC_METHODS = [
  'session.create',
  'session.send',
  'session.getHistory',
  'session.fork',
  'session.list',
  'model.switch',
  'model.list',
  'tool.call',
  'tool.list',
  'extension.list',
  'extension.activate',
  'run.create',
  'run.iterate',
  'run.status',
  'health',
] as const;

export type RpcMethod = (typeof RPC_METHODS)[number];

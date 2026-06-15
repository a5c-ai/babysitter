export const SUPPORTED_TRANSPORTS = [
  'anthropic',
  'openai-chat',
  'openai-responses',
  'google',
  'bedrock-converse',
  'azure-foundry',
  'vertex-native',
  'passthrough',
] as const;

export type SupportedTransport = (typeof SUPPORTED_TRANSPORTS)[number];
export type TransportId = string;

export interface ProxyConfig {
  targetProvider: string;
  targetModel: string;
  exposedTransport: TransportId;
  authToken?: string;
  apiBase?: string;
  host: string;
  port: number;
  stream: boolean;
}

export interface CompletionRequestMessage {
  role: string;
  content: string;
  rawContent?: unknown;
}

export interface CompletionRequest {
  model: string;
  transport: TransportId;
  messages: CompletionRequestMessage[];
  tools?: unknown[];
  toolChoice?: unknown;
  stream: boolean;
  input?: string;
  raw: unknown;
  thoughtSignatureStore?: Map<string, string>;
}

export interface CompletionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CompletionResult {
  id: string;
  model: string;
  role: string;
  text: string;
  finishReason: string;
  usage: CompletionUsage;
  toolCalls?: Array<{ id: string; name: string; arguments: string; metadata?: Record<string, unknown> }>;
  costRecord?: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number };
}

export interface CostFeedbackMetadata {
  runId?: string;
  sessionId?: string;
  effectId?: string;
  taskId?: string;
  taskKind?: string;
  source?: string;
  idempotencyKey?: string;
}

export interface CostFeedbackRecord extends CostFeedbackMetadata {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  durationMs?: number;
}

export type CostFeedbackSink = (record: CostFeedbackRecord) => void | Promise<void>;

export interface TokenCountResult {
  count: number;
}

export interface CompletionTextDeltaEvent {
  type: 'text-delta';
  text: string;
}

export interface CompletionDoneEvent {
  type: 'done';
  finishReason?: string;
  usage?: CompletionUsage;
}

export interface CompletionToolCallEvent {
  type: 'tool-call';
  id: string;
  name: string;
  arguments: string;
  metadata?: Record<string, unknown>;
}

export type CompletionStreamEvent = CompletionTextDeltaEvent | CompletionToolCallEvent | CompletionDoneEvent;

export interface CompletionEngine {
  complete(request: CompletionRequest): Promise<CompletionResult>;
  stream?(request: CompletionRequest): AsyncIterable<CompletionStreamEvent>;
  countTokens?(request: CompletionRequest): Promise<TokenCountResult>;
}

export interface CreateTransportMuxAppOptions {
  config: ProxyConfig;
  completionEngine?: CompletionEngine;
  costFeedbackSink?: CostFeedbackSink;
  costFeedbackMetadata?: CostFeedbackMetadata;
}

export interface RunningProxyServer {
  url: string;
  port: number;
  stop(): Promise<void>;
}

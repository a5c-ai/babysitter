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

export interface ProxyConfig {
  targetProvider: string;
  targetModel: string;
  exposedTransport: SupportedTransport | string;
  authToken?: string;
  apiBase?: string;
  host: string;
  port: number;
  stream: boolean;
}

export interface CompletionRequestMessage {
  role: string;
  content: string;
}

export interface CompletionRequest {
  model: string;
  transport: SupportedTransport | string;
  messages: CompletionRequestMessage[];
  input?: string;
  raw: unknown;
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
}

export interface CompletionEngine {
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

export interface CreateTransportMuxAppOptions {
  config: ProxyConfig;
  completionEngine?: CompletionEngine;
}

export interface RunningProxyServer {
  url: string;
  port: number;
  stop(): Promise<void>;
}

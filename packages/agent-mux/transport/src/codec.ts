import type { CompletionRequest, CompletionResult, CompletionStreamEvent, TransportId } from './types.js';

export interface NormalizedToolDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface NormalizedToolCall {
  id: string;
  name: string;
  arguments: string | Record<string, unknown>;
}

export interface NormalizedCostRecord {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  model?: string;
  provider?: string;
}

export interface CodecCapabilities {
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsTokenCounting: boolean;
  costTracking: boolean;
  toolSchemaFormat: 'openai' | 'anthropic' | 'google' | 'none';
}

export interface TransportCodec {
  readonly transportId: TransportId;
  readonly capabilities: CodecCapabilities;

  decodeRequest(body: Record<string, unknown>): CompletionRequest;
  encodeResult(result: CompletionResult): unknown;
  encodeStreamChunk(event: CompletionStreamEvent): string;

  normalizeTools?(tools: unknown[]): NormalizedToolDefinition[];
  denormalizeTools?(tools: NormalizedToolDefinition[]): unknown[];
  extractCostRecord?(result: CompletionResult): NormalizedCostRecord | undefined;
}

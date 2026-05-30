import type { CodecCapabilities, NormalizedToolDefinition, TransportCodec } from '../codec.js';
import type { CompletionUsage } from '../types.js';
import type { TransportId } from '../types.js';

import { AnthropicCodec } from './anthropic.js';
import { BedrockConverseCodec } from './bedrock.js';
import { GoogleCodec } from './google.js';
import { OpenAiChatCodec } from './openai-chat.js';
import { OpenAiResponsesCodec } from './openai-responses.js';

const codecRegistry = new Map<TransportId, TransportCodec>();

type ToolSchemaFormat = CodecCapabilities['toolSchemaFormat'];

export interface RegisterCodecOptions {
  aliases?: TransportId[];
  override?: boolean;
}

export interface TransportDescriptorLike {
  transportId?: string;
  runtimeId?: string;
  runtimeKind?: string;
  id?: string;
  codecCapabilities?: Partial<CodecCapabilities>;
}

function normalizeTransportId(transportId: string): string {
  return transportId
    .replace(/^transport-runtime:/, '')
    .replace(/^model-transport:/, '')
    .replace(/-messages$/, '')
    .replace(/-completions$/, '')
    .replace(/-converse$/, '')
    .replace(/^bedrock$/, 'bedrock-converse')
    .replace(/^openai-chat$/, 'openai-chat')
    .replace(/^openai-responses$/, 'openai-responses')
    .replace(/^anthropic$/, 'anthropic')
    .replace(/^google$/, 'google');
}

function codecIds(codec: TransportCodec, aliases: TransportId[] = []): TransportId[] {
  return Array.from(
    new Set(
      [codec.transportId, ...aliases]
        .map((id) => id.trim())
        .filter(Boolean)
        .flatMap((id) => {
          const normalized = normalizeTransportId(id);
          return normalized === id ? [id] : [id, normalized];
        }),
    ),
  );
}

export function registerCodec(
  codec: TransportCodec,
  options: RegisterCodecOptions = {},
): readonly TransportId[] {
  const ids = codecIds(codec, options.aliases);
  if (ids.length === 0) {
    throw new Error('Cannot register codec without a transport id.');
  }

  for (const id of ids) {
    const existing = codecRegistry.get(id);
    if (existing && existing !== codec && options.override !== true) {
      throw new Error(`Codec already registered for transport id ${id}.`);
    }
  }

  for (const id of ids) {
    codecRegistry.set(id, codec);
  }
  return ids;
}

export function listRegisteredCodecs(): readonly TransportCodec[] {
  return Array.from(new Set(codecRegistry.values()));
}

registerCodec(new AnthropicCodec());
registerCodec(new GoogleCodec(), { aliases: ['vertex-native'] });
registerCodec(new OpenAiChatCodec(), { aliases: ['azure-foundry', 'openai-chat-completions'] });
registerCodec(new OpenAiResponsesCodec());
registerCodec(new BedrockConverseCodec(), { aliases: ['bedrock'] });

/**
 * Look up a TransportCodec by transport identifier.
 * Returns `undefined` when no codec has been registered for the given id.
 */
export function getCodec(transportId: TransportId): TransportCodec | undefined {
  return codecRegistry.get(transportId) ?? codecRegistry.get(normalizeTransportId(transportId));
}

export function getCodecForDescriptor(
  descriptor: TransportDescriptorLike,
): TransportCodec | undefined {
  const candidate = descriptor.transportId
    ?? descriptor.runtimeId
    ?? descriptor.runtimeKind
    ?? descriptor.id;
  if (!candidate) {
    return undefined;
  }

  return getCodec(candidate);
}

function requiredCodec(format: ToolSchemaFormat): TransportCodec {
  const codec = [...codecRegistry.values()].find(
    (candidate) => candidate.capabilities.toolSchemaFormat === format,
  );
  if (!codec) {
    throw new Error(`No codec registered for tool schema format ${format}.`);
  }
  return codec;
}

export function convertTools(
  tools: unknown[],
  from: ToolSchemaFormat,
  to: ToolSchemaFormat,
): unknown[] {
  if (from === to) {
    return tools;
  }
  if (from === 'none' || to === 'none') {
    return [];
  }

  const source = requiredCodec(from);
  const target = requiredCodec(to);
  const normalized: NormalizedToolDefinition[] = source.normalizeTools
    ? source.normalizeTools(tools)
    : [];
  return target.denormalizeTools ? target.denormalizeTools(normalized) : normalized;
}

function numberField(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

export function normalizeUsage(raw: unknown): CompletionUsage {
  const record = raw && typeof raw === 'object'
    ? raw as Record<string, unknown>
    : {};
  const promptTokens = numberField(
    record,
    'promptTokens',
    'prompt_tokens',
    'inputTokens',
    'input_tokens',
    'promptTokenCount',
  );
  const completionTokens = numberField(
    record,
    'completionTokens',
    'completion_tokens',
    'outputTokens',
    'output_tokens',
    'candidatesTokenCount',
  );
  const totalTokens = numberField(record, 'totalTokens', 'total_tokens', 'totalTokenCount')
    || promptTokens + completionTokens;

  return { promptTokens, completionTokens, totalTokens };
}

export { AnthropicCodec } from './anthropic.js';
export { BedrockConverseCodec } from './bedrock.js';
export { GoogleCodec } from './google.js';
export { OpenAiChatCodec } from './openai-chat.js';
export { OpenAiResponsesCodec } from './openai-responses.js';

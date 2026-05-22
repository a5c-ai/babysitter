import { randomUUID } from 'node:crypto';

import type {
  CompletionRequest,
  CompletionResult,
  CompletionStreamEvent,
} from '../types.js';

import type {
  TransportCodec,
  CodecCapabilities,
  NormalizedToolDefinition,
  NormalizedCostRecord,
} from '../codec.js';

/**
 * Anthropic Messages API codec.
 *
 * Wire format reference: https://docs.anthropic.com/en/api/messages
 *
 * Tool schema key: Anthropic uses `input_schema` (not `parameters`).
 * Cost record keys: input_tokens, output_tokens, cache_creation_input_tokens,
 *                   cache_read_input_tokens.
 */

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */

function parseMessageContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (
          part &&
          typeof part === 'object' &&
          'text' in part &&
          typeof (part as { text?: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function normalizeMessages(raw: unknown): CompletionRequest['messages'] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((entry) => {
    const record = entry as { role?: unknown; content?: unknown };
    return {
      role: typeof record.role === 'string' ? record.role : 'user',
      content: parseMessageContent(record.content),
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Codec                                                                     */
/* -------------------------------------------------------------------------- */

export class AnthropicCodec implements TransportCodec {
  readonly transportId = 'anthropic';

  readonly capabilities: CodecCapabilities = {
    supportsTools: true,
    supportsStreaming: true,
    supportsTokenCounting: false,
    costTracking: true,
    toolSchemaFormat: 'anthropic',
  };

  /* ---- decodeRequest --------------------------------------------------- */

  decodeRequest(body: Record<string, unknown>): CompletionRequest {
    const messages = normalizeMessages(body.messages);
    const model =
      typeof body.model === 'string' ? body.model : 'mock-model';
    const stream = body.stream === true;

    return {
      model,
      transport: this.transportId,
      messages,
      tools: Array.isArray(body.tools)
        ? (body.tools as unknown[])
        : undefined,
      toolChoice: body.tool_choice ?? undefined,
      stream,
      raw: body,
    };
  }

  /* ---- encodeResult ---------------------------------------------------- */

  encodeResult(result: CompletionResult): unknown {
    return {
      id: result.id ?? `msg_${randomUUID()}`,
      type: 'message',
      role: result.role ?? 'assistant',
      model: result.model,
      stop_reason: result.finishReason ?? 'end_turn',
      content: [{ type: 'text', text: result.text }],
      usage: {
        input_tokens: result.usage.promptTokens,
        output_tokens: result.usage.completionTokens,
      },
    };
  }

  /* ---- encodeStreamChunk ----------------------------------------------- */

  encodeStreamChunk(event: CompletionStreamEvent): string {
    if (event.type === 'text-delta' && event.text) {
      return `event: content_block_delta\ndata: ${JSON.stringify({
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: event.text },
      })}\n\n`;
    }

    if (event.type === 'done') {
      return (
        `event: content_block_stop\ndata: ${JSON.stringify({
          type: 'content_block_stop',
          index: 0,
        })}\n\n` +
        `event: message_stop\ndata: ${JSON.stringify({
          type: 'message_stop',
        })}\n\n`
      );
    }

    return '';
  }

  /* ---- normalizeTools -------------------------------------------------- */

  normalizeTools(tools: unknown[]): NormalizedToolDefinition[] {
    return tools.map((tool) => {
      const t = tool as {
        name?: string;
        description?: string;
        input_schema?: Record<string, unknown>;
      };
      return {
        name: t.name ?? '',
        description: t.description,
        parameters: t.input_schema,
      };
    });
  }

  /* ---- denormalizeTools ------------------------------------------------ */

  denormalizeTools(tools: NormalizedToolDefinition[]): unknown[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters ?? { type: 'object', properties: {} },
    }));
  }

  /* ---- extractCostRecord ----------------------------------------------- */

  extractCostRecord(result: CompletionResult): NormalizedCostRecord | undefined {
    if (!result.usage) {
      return undefined;
    }

    const cost: NormalizedCostRecord = {
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      model: result.model,
      provider: 'anthropic',
    };

    // Honour cache token fields when present on the raw cost record.
    const raw = result.costRecord;
    if (raw) {
      if (typeof raw.cacheWriteTokens === 'number') {
        cost.cacheWriteTokens = raw.cacheWriteTokens;
      }
      if (typeof raw.cacheReadTokens === 'number') {
        cost.cacheReadTokens = raw.cacheReadTokens;
      }
    }

    return cost;
  }
}

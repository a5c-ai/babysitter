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

export class OpenAiChatCodec implements TransportCodec {
  readonly transportId = 'openai-chat';

  readonly capabilities: CodecCapabilities = {
    supportsTools: true,
    supportsStreaming: true,
    supportsTokenCounting: false,
    costTracking: true,
    toolSchemaFormat: 'openai',
  };

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

  encodeResult(result: CompletionResult): unknown {
    return {
      id: result.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: result.text },
          finish_reason: result.finishReason,
        },
      ],
      usage: {
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
      },
    };
  }

  encodeStreamChunk(event: CompletionStreamEvent): string {
    const responseId = `chatcmpl_${randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);

    if (event.type === 'text-delta' && event.text) {
      return `data: ${JSON.stringify({
        id: responseId,
        object: 'chat.completion.chunk',
        created,
        model: 'unknown',
        choices: [
          { index: 0, delta: { content: event.text }, finish_reason: null },
        ],
      })}\n\n`;
    }

    if (event.type === 'done') {
      return `data: ${JSON.stringify({
        id: responseId,
        object: 'chat.completion.chunk',
        created,
        model: 'unknown',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: event.finishReason ?? 'stop',
          },
        ],
      })}\n\n`;
    }

    return '';
  }

  normalizeTools(tools: unknown[]): NormalizedToolDefinition[] {
    const result: NormalizedToolDefinition[] = [];

    for (const tool of tools) {
      const t = tool as {
        type?: string;
        function?: {
          name?: string;
          description?: string;
          parameters?: Record<string, unknown>;
        };
      };

      if (t.type === 'function' && t.function) {
        result.push({
          name: t.function.name ?? '',
          description: t.function.description,
          parameters: t.function.parameters,
        });
        continue;
      }

      // Fallback: treat as direct function-like object
      const direct = tool as {
        name?: string;
        description?: string;
        parameters?: Record<string, unknown>;
      };
      if (typeof direct.name === 'string') {
        result.push({
          name: direct.name,
          description: direct.description,
          parameters: direct.parameters,
        });
      }
    }

    return result;
  }

  denormalizeTools(tools: NormalizedToolDefinition[]): unknown[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters ?? { type: 'object', properties: {} },
      },
    }));
  }

  extractCostRecord(result: CompletionResult): NormalizedCostRecord | undefined {
    if (!result.usage) {
      return undefined;
    }

    return {
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      model: result.model,
      provider: 'openai',
    };
  }
}

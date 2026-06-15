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
    const record = entry as Record<string, unknown>;
    const role = typeof record.role === 'string' ? record.role : 'user';
    const content = parseMessageContent(record.content);

    // Preserve tool_calls on assistant messages and tool_call_id on tool messages
    // as rawContent so translateMessagesToOpenAi can reconstruct them.
    if (role === 'assistant' && Array.isArray(record.tool_calls) && record.tool_calls.length > 0) {
      const rawContent = (record.tool_calls as Array<Record<string, unknown>>).map(tc => {
        const fn = tc.function as Record<string, unknown> | undefined;
        return {
          type: 'tool_use',
          id: String(tc.id ?? ''),
          name: String(fn?.name ?? ''),
          input: fn?.arguments ? (typeof fn.arguments === 'string' ? JSON.parse(fn.arguments as string) : fn.arguments) : {},
        };
      });
      if (content) {
        rawContent.unshift({ type: 'text', text: content } as unknown as typeof rawContent[0]);
      }
      return { role, content, rawContent };
    }

    if (role === 'tool' && record.tool_call_id) {
      const rawContent = [{
        type: 'tool_result',
        tool_use_id: String(record.tool_call_id),
        content: record.content,
      }];
      return { role, content, rawContent };
    }

    return { role, content };
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
    const message: Record<string, unknown> = { role: 'assistant', content: result.text };
    if (result.toolCalls && result.toolCalls.length > 0) {
      message.tool_calls = result.toolCalls.map((tc, i) => ({
        id: tc.id || `call_${i}`,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      }));
    }
    return {
      id: result.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.model,
      choices: [
        {
          index: 0,
          message,
          finish_reason: result.toolCalls?.length ? 'tool_calls' : result.finishReason,
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

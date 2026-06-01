import { randomUUID } from 'node:crypto';

import type {
  CompletionRequest,
  CompletionRequestMessage,
  CompletionResult,
  CompletionStreamEvent,
} from '../types.js';
import type {
  CodecCapabilities,
  NormalizedCostRecord,
  NormalizedToolDefinition,
  TransportCodec,
} from '../codec.js';

function textFromInput(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  if (!Array.isArray(input)) {
    return '';
  }

  return input
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (!entry || typeof entry !== 'object') {
        return '';
      }
      const record = entry as Record<string, unknown>;
      if (typeof record.text === 'string') {
        return record.text;
      }
      if (Array.isArray(record.content)) {
        return textFromInput(record.content);
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string') {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function responseInputMessages(input: unknown): CompletionRequestMessage[] {
  if (typeof input === 'string') {
    return input ? [{ role: 'user', content: input }] : [];
  }
  if (!Array.isArray(input)) {
    return [];
  }

  const messages: CompletionRequestMessage[] = [];
  for (const entry of input) {
    if (typeof entry === 'string') {
      if (entry) messages.push({ role: 'user', content: entry });
      continue;
    }
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const type = typeof record.type === 'string' ? record.type : undefined;

    if (type === 'message') {
      const role = typeof record.role === 'string' ? record.role : 'user';
      const content = textFromInput(record.content);
      messages.push({
        role,
        content,
      });
      continue;
    }

    if (type === 'function_call') {
      const callId = String(record.call_id ?? record.id ?? '');
      const name = String(record.name ?? '');
      const rawContent = [{
        type: 'tool_use',
        id: callId,
        name,
        input: parseJsonObject(record.arguments),
      }];
      messages.push({
        role: 'assistant',
        content: '',
        rawContent,
      });
      continue;
    }

    if (type === 'function_call_output') {
      const callId = String(record.call_id ?? record.id ?? '');
      const output = record.output;
      const content = typeof output === 'string' ? output : textFromInput(output);
      messages.push({
        role: 'tool',
        content,
        rawContent: [{
          type: 'tool_result',
          tool_use_id: callId,
          content: output ?? '',
        }],
      });
      continue;
    }

    if (type === 'input_text' && typeof record.text === 'string') {
      messages.push({ role: 'user', content: record.text });
    }
  }

  return messages;
}

export class OpenAiResponsesCodec implements TransportCodec {
  readonly transportId = 'openai-responses';

  readonly capabilities: CodecCapabilities = {
    supportsTools: true,
    supportsStreaming: true,
    supportsTokenCounting: false,
    costTracking: true,
    toolSchemaFormat: 'openai',
  };

  decodeRequest(body: Record<string, unknown>): CompletionRequest {
    const input = textFromInput(body.input);
    const messages = responseInputMessages(body.input);

    return {
      model: typeof body.model === 'string' ? body.model : 'mock-model',
      transport: this.transportId,
      messages,
      tools: Array.isArray(body.tools) ? body.tools : undefined,
      toolChoice: body.tool_choice ?? body.toolChoice ?? undefined,
      stream: body.stream === true,
      input,
      raw: body,
    };
  }

  encodeResult(result: CompletionResult): unknown {
    return {
      id: result.id,
      object: 'response',
      status: 'completed',
      model: result.model,
      output: [
        {
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: result.text }],
        },
      ],
      usage: {
        input_tokens: result.usage.promptTokens,
        output_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
      },
    };
  }

  encodeStreamChunk(event: CompletionStreamEvent): string {
    const responseId = `resp_${randomUUID()}`;

    if (event.type === 'text-delta' && event.text) {
      return `event: response.output_text.delta\ndata: ${JSON.stringify({
        type: 'response.output_text.delta',
        output_index: 0,
        content_index: 0,
        delta: event.text,
      })}\n\n`;
    }

    if (event.type === 'tool-call') {
      return `event: response.output_item.added\ndata: ${JSON.stringify({
        type: 'response.output_item.added',
        output_index: 1,
        item: {
          type: 'function_call',
          id: event.id,
          call_id: event.id,
          name: event.name,
          arguments: event.arguments,
          ...event.metadata,
        },
      })}\n\n`;
    }

    if (event.type === 'done') {
      return `event: response.completed\ndata: ${JSON.stringify({
        type: 'response.completed',
        response: { id: responseId, status: 'completed' },
      })}\n\n`;
    }

    return '';
  }

  normalizeTools(tools: unknown[]): NormalizedToolDefinition[] {
    const result: NormalizedToolDefinition[] = [];
    for (const tool of tools) {
      if (!tool || typeof tool !== 'object') {
        continue;
      }
      const record = tool as Record<string, unknown>;
      const nested = record.function && typeof record.function === 'object'
        ? record.function as Record<string, unknown>
        : record;
      if (typeof nested.name !== 'string') {
        continue;
      }
      result.push({
        name: nested.name,
        description: typeof nested.description === 'string' ? nested.description : undefined,
        parameters: nested.parameters && typeof nested.parameters === 'object'
          ? nested.parameters as Record<string, unknown>
          : undefined,
      });
    }
    return result;
  }

  denormalizeTools(tools: NormalizedToolDefinition[]): unknown[] {
    return tools.map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ?? { type: 'object', properties: {} },
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

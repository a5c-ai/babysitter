import type {
  CompletionRequest,
  CompletionResult,
  CompletionStreamEvent,
} from '../types.js';
import type {
  CodecCapabilities,
  NormalizedCostRecord,
  NormalizedToolDefinition,
  TransportCodec,
} from '../codec.js';

function textFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (
        part
        && typeof part === 'object'
        && 'text' in part
        && typeof (part as { text?: unknown }).text === 'string'
      ) {
        return (part as { text: string }).text;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

function normalizeMessages(raw: unknown): CompletionRequest['messages'] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((entry) => {
    const record = entry as { role?: unknown; content?: unknown };
    return {
      role: typeof record.role === 'string' ? record.role : 'user',
      content: textFromContent(record.content),
    };
  });
}

function toolEntries(raw: unknown): unknown[] | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const config = raw as { tools?: unknown };
  return Array.isArray(config.tools) ? config.tools : undefined;
}

export class BedrockConverseCodec implements TransportCodec {
  readonly transportId = 'bedrock-converse';

  readonly capabilities: CodecCapabilities = {
    supportsTools: true,
    supportsStreaming: true,
    supportsTokenCounting: true,
    costTracking: true,
    toolSchemaFormat: 'anthropic',
  };

  decodeRequest(body: Record<string, unknown>): CompletionRequest {
    return {
      model: typeof body.modelId === 'string'
        ? body.modelId
        : typeof body.model === 'string'
          ? body.model
          : 'mock-model',
      transport: this.transportId,
      messages: normalizeMessages(body.messages),
      tools: toolEntries(body.toolConfig),
      toolChoice: body.toolConfig && typeof body.toolConfig === 'object'
        ? (body.toolConfig as { toolChoice?: unknown }).toolChoice
        : undefined,
      stream: body.stream === true,
      raw: body,
    };
  }

  encodeResult(result: CompletionResult): unknown {
    return {
      output: {
        message: {
          role: 'assistant',
          content: result.text ? [{ text: result.text }] : [],
        },
      },
      stopReason: result.finishReason === 'stop' ? 'end_turn' : result.finishReason,
      usage: {
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
    };
  }

  encodeStreamChunk(event: CompletionStreamEvent): string {
    if (event.type === 'text-delta' && event.text) {
      return `${JSON.stringify({
        contentBlockDelta: {
          delta: { text: event.text },
          contentBlockIndex: 0,
        },
      })}\n`;
    }

    if (event.type === 'tool-call') {
      return `${JSON.stringify({
        contentBlockStart: {
          start: {
            toolUse: {
              toolUseId: event.id,
              name: event.name,
            },
          },
          contentBlockIndex: 1,
        },
      })}\n${JSON.stringify({
        contentBlockDelta: {
          delta: { toolUse: { input: event.arguments } },
          contentBlockIndex: 1,
        },
      })}\n`;
    }

    if (event.type === 'done') {
      return `${JSON.stringify({
        messageStop: { stopReason: event.finishReason === 'stop' ? 'end_turn' : event.finishReason },
        metadata: event.usage
          ? {
              usage: {
                inputTokens: event.usage.promptTokens,
                outputTokens: event.usage.completionTokens,
                totalTokens: event.usage.totalTokens,
              },
            }
          : undefined,
      })}\n`;
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
      const spec = record.toolSpec && typeof record.toolSpec === 'object'
        ? record.toolSpec as Record<string, unknown>
        : record;
      if (typeof spec.name !== 'string') {
        continue;
      }
      const inputSchema = spec.inputSchema && typeof spec.inputSchema === 'object'
        ? spec.inputSchema as Record<string, unknown>
        : undefined;
      result.push({
        name: spec.name,
        description: typeof spec.description === 'string' ? spec.description : undefined,
        parameters: inputSchema?.json && typeof inputSchema.json === 'object'
          ? inputSchema.json as Record<string, unknown>
          : inputSchema,
      });
    }
    return result;
  }

  denormalizeTools(tools: NormalizedToolDefinition[]): unknown[] {
    return tools.map((tool) => ({
      toolSpec: {
        name: tool.name,
        description: tool.description,
        inputSchema: { json: tool.parameters ?? { type: 'object', properties: {} } },
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
      provider: 'bedrock',
    };
  }
}

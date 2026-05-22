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
 * Parse Google AI "parts" array into a plain string.
 */
function parsePartsContent(parts: unknown): string {
  if (!Array.isArray(parts)) {
    return '';
  }
  return parts
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

/**
 * Map a Google role string to the normalised internal role.
 * Google uses "model" where other providers use "assistant".
 */
function mapGoogleRole(role: unknown): string {
  if (typeof role !== 'string') {
    return 'user';
  }
  return role === 'model' ? 'assistant' : role;
}

interface GoogleFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

interface GoogleToolEntry {
  functionDeclarations?: GoogleFunctionDeclaration[];
}

interface GoogleContentEntry {
  role?: unknown;
  parts?: unknown;
}

function normalizeMessages(
  raw: unknown,
): CompletionRequest['messages'] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => {
    const record = entry as GoogleContentEntry;
    return {
      role: mapGoogleRole(record.role),
      content: parsePartsContent(record.parts),
    };
  });
}

export class GoogleCodec implements TransportCodec {
  readonly transportId = 'google';

  readonly capabilities: CodecCapabilities = {
    supportsTools: true,
    supportsStreaming: true,
    supportsTokenCounting: true,
    costTracking: true,
    toolSchemaFormat: 'google',
  };

  decodeRequest(body: Record<string, unknown>): CompletionRequest {
    const messages = normalizeMessages(body.contents);

    // Extract tools from body.tools[].functionDeclarations
    let tools: unknown[] | undefined;
    if (Array.isArray(body.tools)) {
      const declarations: GoogleFunctionDeclaration[] = [];
      for (const toolEntry of body.tools as GoogleToolEntry[]) {
        if (Array.isArray(toolEntry.functionDeclarations)) {
          declarations.push(...toolEntry.functionDeclarations);
        }
      }
      if (declarations.length > 0) {
        tools = declarations;
      }
    }

    const model =
      typeof body.model === 'string' ? body.model : 'mock-model';

    return {
      model,
      transport: this.transportId,
      messages,
      tools,
      stream: false,
      raw: body,
    };
  }

  encodeResult(result: CompletionResult): unknown {
    return {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [{ text: result.text }],
          },
          finishReason:
            result.finishReason === 'stop'
              ? 'STOP'
              : result.finishReason,
        },
      ],
      usageMetadata: {
        promptTokenCount: result.usage.promptTokens,
        candidatesTokenCount: result.usage.completionTokens,
        totalTokenCount: result.usage.totalTokens,
      },
    };
  }

  encodeStreamChunk(event: CompletionStreamEvent): string {
    if (event.type === 'text-delta' && event.text) {
      return (
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: event.text }],
                role: 'model',
              },
            },
          ],
        }) + '\n'
      );
    }
    return '';
  }

  normalizeTools(tools: unknown[]): NormalizedToolDefinition[] {
    const result: NormalizedToolDefinition[] = [];

    for (const entry of tools) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const record = entry as Record<string, unknown>;

      // Wrapper form: { functionDeclarations: [...] }
      if (Array.isArray(record.functionDeclarations)) {
        for (const decl of record.functionDeclarations as GoogleFunctionDeclaration[]) {
          result.push({
            name: decl.name,
            description: decl.description,
            parameters: decl.parameters,
          });
        }
        continue;
      }

      // Direct functionDeclaration object with name
      if (typeof record.name === 'string') {
        result.push({
          name: record.name,
          description:
            typeof record.description === 'string'
              ? record.description
              : undefined,
          parameters:
            record.parameters && typeof record.parameters === 'object'
              ? (record.parameters as Record<string, unknown>)
              : undefined,
        });
      }
    }

    return result;
  }

  denormalizeTools(tools: NormalizedToolDefinition[]): unknown[] {
    return [
      {
        functionDeclarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      },
    ];
  }

  extractCostRecord(
    result: CompletionResult,
  ): NormalizedCostRecord | undefined {
    if (!result.usage) {
      return undefined;
    }
    return {
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      model: result.model,
      provider: 'google',
    };
  }
}

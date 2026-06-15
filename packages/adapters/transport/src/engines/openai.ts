/**
 * OpenAI-compatible completion engine.
 *
 * Moved from packages/adapters/cli/src/commands/launch-completion-engine.ts
 * so that the engine lives alongside the transport-adapter runtime.
 */

import type {
  CompletionEngine,
  CompletionRequest,
  CompletionResult,
  CompletionStreamEvent,
} from '../types.js';

type OpenAiFunctionTool = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
};

function buildUrl(apiBase: string, model: string): string {
  return `${apiBase}/openai/deployments/${model}/chat/completions?api-version=2025-04-01-preview`;
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'api-key': apiKey,
  };
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function normalizeOpenAiTools(tools?: unknown[]): OpenAiFunctionTool[] | undefined {
  if (!tools || tools.length === 0) return undefined;

  const normalized: OpenAiFunctionTool[] = [];
  for (const tool of tools) {
    const record = toRecord(tool);
    if (!record) continue;

    const wrapped = toRecord(record['function']);
    if (record['type'] === 'function' && wrapped && typeof wrapped['name'] === 'string') {
      normalized.push({
        type: 'function',
        function: {
          name: wrapped['name'],
          description: typeof wrapped['description'] === 'string' ? wrapped['description'] : undefined,
          parameters: toRecord(wrapped['parameters']) ?? { type: 'object', properties: {} },
        },
      });
      continue;
    }

    if (typeof record['name'] === 'string') {
      normalized.push({
        type: 'function',
        function: {
          name: record['name'],
          description: typeof record['description'] === 'string' ? record['description'] : undefined,
          parameters: toRecord(record['parameters'])
            ?? toRecord(record['parametersJsonSchema'])
            ?? toRecord(record['input_schema'])
            ?? { type: 'object', properties: {} },
        },
      });
    }
  }

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOpenAiToolChoice(toolChoice: unknown): unknown {
  if (toolChoice === undefined) return undefined;
  if (typeof toolChoice === 'string') return toolChoice;

  const record = toRecord(toolChoice);
  if (!record) return toolChoice;

  if (record['type'] === 'auto' || record['type'] === 'none' || record['type'] === 'required') {
    return record['type'];
  }

  if (record['type'] === 'tool' && typeof record['name'] === 'string') {
    return { type: 'function', function: { name: record['name'] } };
  }

  return toolChoice;
}

function buildBody(messages: Array<Record<string, unknown>>, model: string, stream: boolean, tools?: unknown[], toolChoice?: unknown): string {
  const body: Record<string, unknown> = { messages, model, stream };
  const openAiTools = normalizeOpenAiTools(tools);
  if (openAiTools) {
    body.tools = openAiTools;
  } else if (tools && tools.length > 0) {
    console.error(`[transport-adapter] WARNING: ${tools.length} tools received but normalization returned empty. Raw tool[0] keys: ${Object.keys(tools[0] as Record<string, unknown>).join(',')}`);
  }
  const openAiToolChoice = normalizeOpenAiToolChoice(toolChoice);
  if (openAiToolChoice !== undefined) body.tool_choice = openAiToolChoice;
  return JSON.stringify(body);
}

type OpenAiMessage = { role: string; content: string | null; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>; tool_call_id?: string };

function translateMessagesToOpenAi(messages: CompletionRequest['messages']): OpenAiMessage[] {
  const result: OpenAiMessage[] = [];
  for (const msg of messages) {
    const raw = msg.rawContent;
    if (!Array.isArray(raw)) {
      result.push({ role: msg.role, content: msg.content });
      continue;
    }

    const blocks = raw as Array<Record<string, unknown>>;
    const toolUseBlocks = blocks.filter(b => b['type'] === 'tool_use');
    const toolResultBlocks = blocks.filter(b => b['type'] === 'tool_result');
    const textBlocks = blocks.filter(b => b['type'] === 'text' || typeof b === 'string');

    if (toolResultBlocks.length > 0) {
      for (const tr of toolResultBlocks) {
        const content = typeof tr['content'] === 'string' ? tr['content']
          : Array.isArray(tr['content']) ? (tr['content'] as Array<Record<string, unknown>>).map(c => c['text'] ?? '').join('')
          : JSON.stringify(tr['content'] ?? '');
        result.push({ role: 'tool', content, tool_call_id: String(tr['tool_use_id'] ?? '') });
      }
    } else if (toolUseBlocks.length > 0) {
      const text = textBlocks.map(b => typeof b === 'string' ? b : String(b['text'] ?? '')).filter(Boolean).join('');
      result.push({
        role: 'assistant',
        content: text || null,
        tool_calls: toolUseBlocks.map(tu => ({
          id: String(tu['id'] ?? ''),
          type: 'function' as const,
          function: { name: String(tu['name'] ?? ''), arguments: JSON.stringify(tu['input'] ?? {}) },
        })),
      });
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }
  return result;
}

export function createOpenAICompletionEngine(options: {
  apiBase: string;
  apiKey: string;
  targetModel: string;
}): CompletionEngine {
  return {
    async complete(request: CompletionRequest): Promise<CompletionResult> {
      const messages = translateMessagesToOpenAi(request.messages);
      const url = buildUrl(options.apiBase, options.targetModel);
      console.error(`[transport-adapter] OpenAI engine: POST ${url.replace(/api-key=[^&]+/, 'api-key=***')}`);
      const response = await fetch(
        url,
        {
          method: 'POST',
          headers: buildHeaders(options.apiKey),
          body: buildBody(messages, options.targetModel, false, request.tools, request.toolChoice),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[transport-adapter] OpenAI API error ${response.status}: ${errorText.slice(0, 500)}`);
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        id: string;
        choices: Array<{
          message: {
            content: string | null;
            tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
          };
          finish_reason: string;
        }>;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const choice = data.choices[0];
      const toolCalls = choice?.message?.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      }));
      return {
        id: data.id,
        model: options.targetModel,
        role: 'assistant',
        text: choice?.message?.content ?? '',
        finishReason: choice?.finish_reason ?? 'stop',
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      };
    },

    async *stream(request: CompletionRequest): AsyncIterable<CompletionStreamEvent> {
      const messages = translateMessagesToOpenAi(request.messages);
      const url = buildUrl(options.apiBase, options.targetModel);
      const bodyStr = buildBody(messages, options.targetModel, true, request.tools, request.toolChoice);
      console.error(`[transport-adapter] OpenAI engine stream: POST ${url.replace(/api-key=[^&]+/, 'api-key=***')} (${messages.length} msgs, ${request.tools?.length ?? 0} tools, body ${bodyStr.length} bytes)`);
      const response = await fetch(
        url,
        {
          method: 'POST',
          headers: buildHeaders(options.apiKey),
          body: bodyStr,
        },
      );

      console.error(`[transport-adapter] OpenAI engine stream response: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[transport-adapter] OpenAI API error ${response.status}: ${errorText.slice(0, 500)}`);
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;
      const pendingToolCalls: Array<{ id: string; name: string; arguments: string } | undefined> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          try {
            chunkCount++;
            if (chunkCount === 1) {
              console.error(`[transport-adapter] First stream chunk: ${payload.slice(0, 300)}`);
            }
            const chunk = JSON.parse(payload) as {
              choices: Array<{
                delta: {
                  content?: string | null;
                  tool_calls?: Array<{ index: number; id?: string; function?: { name?: string; arguments?: string } }>;
                };
                finish_reason?: string | null;
              }>;
              usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
            };
            const choice = chunk.choices[0];
            const delta = choice?.delta?.content;
            if (delta) {
              yield { type: 'text-delta', text: delta };
            }

            // Accumulate streamed tool_calls — OpenAI streams them as incremental
            // argument chunks across multiple SSE events.
            if (choice?.delta?.tool_calls) {
              for (const tc of choice.delta.tool_calls) {
                const idx = tc.index;
                const pendingToolCall = pendingToolCalls[idx] ?? (pendingToolCalls[idx] = { id: tc.id ?? `call_${idx}`, name: '', arguments: '' });
                if (tc.function?.name) pendingToolCall.name += tc.function.name;
                if (tc.function?.arguments) pendingToolCall.arguments += tc.function.arguments;
              }
            }

            if (choice?.finish_reason) {
              // Emit accumulated tool calls before done
              for (const tc of pendingToolCalls) {
                if (tc) yield { type: 'tool-call' as const, id: tc.id, name: tc.name, arguments: tc.arguments };
              }
              yield {
                type: 'done',
                finishReason: choice.finish_reason,
                usage: chunk.usage ? {
                  promptTokens: chunk.usage.prompt_tokens,
                  completionTokens: chunk.usage.completion_tokens,
                  totalTokens: chunk.usage.total_tokens,
                } : undefined,
              };
              return;
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to parse OpenAI chat stream chunk: ${message}`);
          }
        }
      }

      console.error(`[transport-adapter] OpenAI stream ended without finish_reason (${chunkCount} chunks received)`);
      yield { type: 'done' };
    },
  };
}

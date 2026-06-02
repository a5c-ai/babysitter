import type {
  CompletionEngine,
  CompletionRequest,
  CompletionResult,
  CompletionStreamEvent,
} from '../types.js';

export interface AnthropicCompletionEngineOptions {
  apiBase?: string;
  apiKey: string;
  targetModel: string;
}

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string | Array<Record<string, unknown>>;
};

function translateMessages(messages: CompletionRequest['messages']): { system?: string; messages: AnthropicMessage[] } {
  let system: string | undefined;
  const result: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = (system ? system + '\n' : '') + msg.content;
      continue;
    }

    const role = msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user';
    const raw = msg.rawContent;

    if (Array.isArray(raw)) {
      const blocks = raw as Array<Record<string, unknown>>;
      const toolUseBlocks = blocks.filter(b => b['type'] === 'tool_use');
      const toolResultBlocks = blocks.filter(b => b['type'] === 'tool_result');

      if (toolResultBlocks.length > 0) {
        result.push({ role: 'user', content: toolResultBlocks as unknown as Array<Record<string, unknown>> });
      } else if (toolUseBlocks.length > 0) {
        const content: Array<Record<string, unknown>> = [];
        for (const b of blocks) {
          if (b['type'] === 'text' && b['text']) content.push({ type: 'text', text: String(b['text']) });
          if (b['type'] === 'tool_use') content.push(b);
        }
        result.push({ role: 'assistant', content });
      } else {
        result.push({ role, content: msg.content });
      }
    } else if (msg.role === 'tool') {
      result.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: (raw as Record<string, unknown>)?.['tool_call_id'] ?? '',
          content: msg.content,
        }],
      });
    } else {
      result.push({ role, content: msg.content });
    }
  }

  return { system, messages: result };
}

function translateTools(tools?: unknown[]): Array<Record<string, unknown>> | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map(t => {
    const tool = t as Record<string, unknown>;
    const fn = tool.function as Record<string, unknown> | undefined;
    return {
      name: String(fn?.name ?? tool.name ?? ''),
      description: String(fn?.description ?? tool.description ?? ''),
      input_schema: (fn?.parameters ?? tool.parameters ?? { type: 'object', properties: {} }) as Record<string, unknown>,
    };
  }).filter(d => d.name);
}

function buildUrl(apiBase: string): string {
  return `${apiBase}/v1/messages`;
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
}

export function createAnthropicCompletionEngine(options: AnthropicCompletionEngineOptions): CompletionEngine {
  const apiBase = options.apiBase ?? 'https://api.anthropic.com';

  return {
    async complete(request: CompletionRequest): Promise<CompletionResult> {
      const { system, messages } = translateMessages(request.messages);
      const body: Record<string, unknown> = {
        model: options.targetModel,
        max_tokens: 8192,
        messages,
      };
      if (system) body.system = system;
      const tools = translateTools(request.tools);
      if (tools) body.tools = tools;

      const url = buildUrl(apiBase);
      console.error(`[transport-mux] Anthropic engine: POST ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(options.apiKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[transport-mux] Anthropic API error ${response.status}: ${errorText.slice(0, 500)}`);
        throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        id: string;
        content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
        stop_reason: string;
        usage: { input_tokens: number; output_tokens: number };
      };

      const text = data.content.filter(c => c.type === 'text').map(c => c.text ?? '').join('');
      const toolCalls = data.content
        .filter(c => c.type === 'tool_use')
        .map(c => ({
          id: c.id ?? '',
          name: c.name ?? '',
          arguments: JSON.stringify(c.input ?? {}),
        }));

      return {
        id: data.id,
        model: options.targetModel,
        role: 'assistant',
        text,
        finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : data.stop_reason,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    },

    async *stream(request: CompletionRequest): AsyncIterable<CompletionStreamEvent> {
      const { system, messages } = translateMessages(request.messages);
      const body: Record<string, unknown> = {
        model: options.targetModel,
        max_tokens: 8192,
        messages,
        stream: true,
      };
      if (system) body.system = system;
      const tools = translateTools(request.tools);
      if (tools) body.tools = tools;

      const url = buildUrl(apiBase);
      console.error(`[transport-mux] Anthropic engine stream: POST ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(options.apiKey),
        body: JSON.stringify(body),
      });

      console.error(`[transport-mux] Anthropic engine stream response: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[transport-mux] Anthropic API error ${response.status}: ${errorText.slice(0, 500)}`);
        throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let usage: CompletionResult['usage'] | undefined;
      const pendingToolCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let currentToolIdx = -1;

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
          if (payload === '[DONE]') continue;

          try {
            const event = JSON.parse(payload) as Record<string, unknown>;
            const type = event.type as string;

            if (type === 'content_block_start') {
              const block = event.content_block as Record<string, unknown>;
              if (block?.type === 'tool_use') {
                currentToolIdx = pendingToolCalls.length;
                pendingToolCalls.push({
                  id: String(block.id ?? ''),
                  name: String(block.name ?? ''),
                  arguments: '',
                });
              }
            } else if (type === 'content_block_delta') {
              const delta = event.delta as Record<string, unknown>;
              if (delta?.type === 'text_delta' && delta.text) {
                yield { type: 'text-delta', text: String(delta.text) };
              } else if (delta?.type === 'input_json_delta' && currentToolIdx >= 0) {
                pendingToolCalls[currentToolIdx].arguments += String(delta.partial_json ?? '');
              }
            } else if (type === 'content_block_stop') {
              if (currentToolIdx >= 0) {
                const tc = pendingToolCalls[currentToolIdx];
                yield { type: 'tool-call' as const, id: tc.id, name: tc.name, arguments: tc.arguments };
                currentToolIdx = -1;
              }
            } else if (type === 'message_delta') {
              const delta = event.delta as Record<string, unknown>;
              const stopReason = delta?.stop_reason as string | undefined;
              const msgUsage = event.usage as { output_tokens?: number } | undefined;
              if (msgUsage) {
                usage = {
                  promptTokens: usage?.promptTokens ?? 0,
                  completionTokens: msgUsage.output_tokens ?? 0,
                  totalTokens: (usage?.promptTokens ?? 0) + (msgUsage.output_tokens ?? 0),
                };
              }
              yield { type: 'done', finishReason: stopReason === 'tool_use' ? 'tool_calls' : stopReason, usage };
              return;
            } else if (type === 'message_start') {
              const msg = event.message as Record<string, unknown>;
              const msgUsage = msg?.usage as { input_tokens?: number } | undefined;
              if (msgUsage) {
                usage = {
                  promptTokens: msgUsage.input_tokens ?? 0,
                  completionTokens: 0,
                  totalTokens: msgUsage.input_tokens ?? 0,
                };
              }
            }
          } catch { /* skip unparseable lines */ }
        }
      }

      yield { type: 'done', usage };
    },
  };
}

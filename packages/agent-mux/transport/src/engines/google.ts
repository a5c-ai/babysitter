/**
 * Google (Gemini / Vertex AI) completion engine.
 *
 * Moved from packages/agent-mux/cli/src/commands/launch-completion-engine.ts
 * so that the engine lives alongside the transport-mux runtime.
 */

import type {
  CompletionEngine,
  CompletionRequest,
  CompletionResult,
  CompletionStreamEvent,
} from '../types.js';

export interface GoogleCompletionEngineOptions {
  apiBase?: string;
  apiKey: string;
  targetModel: string;
  provider?: string;
  project?: string;
  location?: string;
  useVertexAi?: boolean;
}

type GoogleContentPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> }; thoughtSignature?: string }
  | { functionResponse: { name: string; response: { content: string } } };

function translateMessagesToGoogle(messages: CompletionRequest['messages'], sigStore?: Map<string, string>): Array<{ role: string; parts: GoogleContentPart[] }> {
  const result: Array<{ role: string; parts: GoogleContentPart[] }> = [];
  const toolIdToName = new Map<string, string>();
  for (const msg of messages) {
    const googleRole = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
    const raw = msg.rawContent;

    if (!Array.isArray(raw)) {
      result.push({ role: googleRole, parts: [{ text: msg.content }] });
      continue;
    }

    const blocks = raw as Array<Record<string, unknown>>;
    const parts: GoogleContentPart[] = [];

    for (const block of blocks) {
      if (block['type'] === 'tool_use') {
        const name = String(block['name'] ?? '');
        const id = String(block['id'] ?? '');
        if (id) toolIdToName.set(id, name);
        const sig = block['thoughtSignature'] ?? (id && sigStore?.get(id)) ?? undefined;
        const part: GoogleContentPart = {
          functionCall: { name, args: (block['input'] as Record<string, unknown>) ?? {} },
        };
        if (sig) (part as Record<string, unknown>)['thoughtSignature'] = sig;
        parts.push(part);
      } else if (block['type'] === 'tool_result') {
        const content = typeof block['content'] === 'string' ? block['content']
          : Array.isArray(block['content']) ? (block['content'] as Array<Record<string, unknown>>).map(c => c['text'] ?? '').join('')
          : JSON.stringify(block['content'] ?? '');
        const toolUseId = String(block['tool_use_id'] ?? '');
        parts.push({
          functionResponse: {
            name: toolIdToName.get(toolUseId) ?? String(block['name'] ?? toolUseId),
            response: { content },
          },
        });
      } else if (block['type'] === 'text' && block['text']) {
        parts.push({ text: String(block['text']) });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: msg.content || '' });
    }
    result.push({ role: googleRole, parts });
  }
  return result;
}

function stripUnsupportedSchemaFields(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(stripUnsupportedSchemaFields);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (key === 'additionalProperties') continue;
    result[key] = stripUnsupportedSchemaFields(value);
  }
  return result;
}

function buildGoogleBody(messages: CompletionRequest['messages'], tools?: unknown[], sigStore?: Map<string, string>): string {
  const body: Record<string, unknown> = { contents: translateMessagesToGoogle(messages, sigStore) };
  if (tools && tools.length > 0) {
    const declarations = tools.map((t) => { const tool = t as Record<string, unknown>; const fn = tool.function as Record<string, unknown> | undefined; return { name: fn?.name ?? tool.name, description: fn?.description ?? tool.description, parameters: stripUnsupportedSchemaFields(fn?.parameters ?? tool.parameters) }; }).filter((d) => d.name);
    if (declarations.length > 0) body.tools = [{ functionDeclarations: declarations }];
  }
  return JSON.stringify(body);
}

function buildGoogleUrl(options: GoogleCompletionEngineOptions, streaming: boolean): string {
  const useVertexAi = options.useVertexAi === true || options.provider === 'vertex';
  const method = streaming ? 'streamGenerateContent' : 'generateContent';

  if (useVertexAi) {
    const project = options.project ?? process.env['GOOGLE_CLOUD_PROJECT'];
    if (!project) {
      throw new Error('GOOGLE_CLOUD_PROJECT is required for Vertex AI Gemini proxy calls.');
    }
    const location = options.location ?? process.env['GOOGLE_CLOUD_LOCATION'] ?? 'global';
    const apiBase = options.apiBase ?? 'https://aiplatform.googleapis.com';
    const url = new URL(`/v1/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(options.targetModel)}:${method}`, apiBase);
    url.searchParams.set('key', options.apiKey);
    if (streaming) url.searchParams.set('alt', 'sse');
    return String(url);
  }

  const apiBase = options.apiBase ?? 'https://generativelanguage.googleapis.com';
  const url = new URL(`/v1beta/models/${encodeURIComponent(options.targetModel)}:${method}`, apiBase);
  url.searchParams.set('key', options.apiKey);
  if (streaming) url.searchParams.set('alt', 'sse');
  return String(url);
}

function googleHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

type GooglePart = { text?: string; functionCall?: { name: string; args: Record<string, unknown> } };
type GoogleCandidate = { content?: { parts?: GooglePart[] }; finishReason?: string };
type GoogleResponseData = { candidates?: GoogleCandidate[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } };

function extractGoogleText(data: GoogleResponseData): string {
  return data.candidates
    ?.flatMap((candidate) => candidate.content?.parts?.map((part) => part.text ?? '') ?? [])
    .filter(Boolean)
    .join('') ?? '';
}

function extractGoogleToolCalls(data: GoogleResponseData, sigStore?: Map<string, string>): Array<{ id: string; name: string; arguments: string; metadata?: Record<string, unknown> }> | undefined {
  const calls: Array<{ id: string; name: string; arguments: string; metadata?: Record<string, unknown> }> = [];
  for (const candidate of data.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.functionCall) {
        const rawPart = part as Record<string, unknown>;
        const id = `call_${Date.now()}_${calls.length}`;
        const metadata: Record<string, unknown> = {};
        if (rawPart['thoughtSignature']) {
          metadata['thoughtSignature'] = rawPart['thoughtSignature'];
          sigStore?.set(id, String(rawPart['thoughtSignature']));
        }
        calls.push({
          id,
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args ?? {}),
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
      }
    }
  }
  return calls.length > 0 ? calls : undefined;
}

function googleUsage(data: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }) {
  return {
    promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
  };
}

function parseGoogleStreamPayload(payload: string, sigStore?: Map<string, string>): { text?: string; finishReason?: string; usage?: CompletionResult['usage']; toolCalls?: CompletionResult['toolCalls'] } | null {
  if (!payload || payload === '[DONE]') return null;
  try {
    const data = JSON.parse(payload) as GoogleResponseData;
    return {
      text: extractGoogleText(data),
      finishReason: data.candidates?.find((candidate) => candidate.finishReason)?.finishReason?.toLowerCase(),
      usage: data.usageMetadata ? googleUsage(data) : undefined,
      toolCalls: extractGoogleToolCalls(data, sigStore),
    };
  } catch {
    return null;
  }
}

async function* parseGoogleStream(response: Response, sigStore?: Map<string, string>): AsyncIterable<CompletionStreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let usage: CompletionResult['usage'] | undefined;
  let finishReason: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
      const parsed = parseGoogleStreamPayload(payload, sigStore);
      if (!parsed) continue;
      if (parsed.text) yield { type: 'text-delta', text: parsed.text };
      if (parsed.toolCalls) {
        for (const tc of parsed.toolCalls) {
          yield { type: 'tool-call' as const, id: tc.id, name: tc.name, arguments: tc.arguments, metadata: tc.metadata };
        }
      }
      if (parsed.usage) usage = parsed.usage;
      if (parsed.finishReason) finishReason = parsed.finishReason;
    }
  }

  yield { type: 'done', finishReason, usage };
}

export function createGoogleCompletionEngine(options: GoogleCompletionEngineOptions): CompletionEngine {
  return {
    async complete(request: CompletionRequest): Promise<CompletionResult> {
      const response = await fetch(buildGoogleUrl(options, false), {
        method: 'POST',
        headers: googleHeaders(),
        body: buildGoogleBody(request.messages, request.tools, request.thoughtSignatureStore),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as GoogleResponseData;
      const toolCalls = extractGoogleToolCalls(data, request.thoughtSignatureStore);

      return {
        id: `google_${Date.now()}`,
        model: options.targetModel,
        role: 'assistant',
        text: extractGoogleText(data),
        finishReason: data.candidates?.find((candidate) => candidate.finishReason)?.finishReason?.toLowerCase() ?? 'stop',
        usage: googleUsage(data),
        toolCalls,
      };
    },

    async *stream(request: CompletionRequest): AsyncIterable<CompletionStreamEvent> {
      const response = await fetch(buildGoogleUrl(options, true), {
        method: 'POST',
        headers: googleHeaders(),
        body: buildGoogleBody(request.messages, request.tools, request.thoughtSignatureStore),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error ${response.status}: ${errorText}`);
      }

      yield* parseGoogleStream(response, request.thoughtSignatureStore);
    },
  };
}

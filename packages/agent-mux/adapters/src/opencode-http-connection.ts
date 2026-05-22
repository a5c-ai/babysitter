/**
 * HTTP connection implementation for OpenCodeHttpAdapter.
 * Extracted to keep opencode-http-adapter.ts under the 400-line cap.
 */

import type {
  AgentEvent,
  CostRecord,
  HttpConnection,
  RunOptions,
} from '@a5c-ai/agent-mux-core';
import type { OpenCodeHttpAdapter } from './opencode-http-adapter.js';

export interface OpenCodeHttpConnectionOptions {
  connectionId: string;
  baseUrl: string;
  runOptions: RunOptions;
  adapter: OpenCodeHttpAdapter;
}

export class OpenCodeHttpConnection implements HttpConnection {
  readonly connectionType = 'http' as const;
  readonly connectionId: string;
  readonly baseUrl: string;
  readonly endpoint: string;

  private options: RunOptions;
  private adapter: OpenCodeHttpAdapter;
  private closed = false;

  constructor(options: OpenCodeHttpConnectionOptions) {
    this.connectionId = options.connectionId;
    this.baseUrl = options.baseUrl;
    this.endpoint = options.baseUrl;
    this.options = options.runOptions;
    this.adapter = options.adapter;
  }

  async send(data: unknown): Promise<void> {
    if (this.closed) throw new Error('Connection is closed');
    const response = await fetch(`${this.baseUrl}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Send failed: HTTP ${response.status}`);
  }

  async get(path: string, params?: Record<string, unknown>): Promise<unknown> {
    if (this.closed) throw new Error('Connection is closed');
    const url = new URL(path, this.baseUrl);
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(`GET ${path} failed: HTTP ${response.status}`);
    return response.json();
  }

  async post(path: string, data?: unknown): Promise<unknown> {
    if (this.closed) throw new Error('Connection is closed');
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`POST ${path} failed: HTTP ${response.status}`);
    return response.json();
  }

  async put(path: string, data?: unknown): Promise<unknown> {
    if (this.closed) throw new Error('Connection is closed');
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`PUT ${path} failed: HTTP ${response.status}`);
    return response.json();
  }

  async delete(path: string): Promise<unknown> {
    if (this.closed) throw new Error('Connection is closed');
    const response = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`DELETE ${path} failed: HTTP ${response.status}`);
    return response.json();
  }

  async *stream(path: string, data?: unknown): AsyncIterableIterator<AgentEvent> {
    if (this.closed) throw new Error('Connection is closed');
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`Stream ${path} failed: HTTP ${response.status}`);
    if (!response.body) throw new Error('No response body for streaming');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const event = this.parseServerSentEvent(parsed);
              if (event) yield event;
            } catch (error) {
              console.warn('Failed to parse SSE event:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async *receive(): AsyncIterableIterator<AgentEvent> {
    const requestData = {
      prompt: this.options.prompt,
      model: this.options.model || this.adapter.defaultModelId,
      sessionId: this.options.sessionId,
      maxTurns: this.options.maxTurns,
      systemPrompt: this.options.systemPrompt,
    };
    yield* this.stream('/api/chat/stream', requestData);
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  private parseServerSentEvent(data: Record<string, unknown>): AgentEvent | null {
    const ts = Date.now();
    const runId = this.connectionId;
    const base = { runId, agent: this.adapter.agent, timestamp: ts };
    const type = data.type as string;
    const event = data.event as string;

    if (event === 'message' || type === 'message') {
      const content = (data.content ?? data.data ?? '') as string;
      if (content) {
        return { ...base, type: 'text_delta', delta: content, accumulated: content } as AgentEvent;
      }
    }
    if (event === 'tool_start' || type === 'tool_start') {
      return {
        ...base,
        type: 'tool_call_start',
        toolCallId: (data.id ?? data.tool_id ?? '') as string,
        toolName: (data.name ?? data.tool_name ?? '') as string,
        inputAccumulated: JSON.stringify(data.input ?? data.arguments ?? {}),
      } as AgentEvent;
    }
    if (event === 'tool_result' || type === 'tool_result') {
      return {
        ...base,
        type: 'tool_result',
        toolCallId: (data.id ?? data.tool_id ?? '') as string,
        toolName: (data.name ?? data.tool_name ?? '') as string,
        output: data.result ?? data.output ?? '',
        durationMs: (data.duration ?? 0) as number,
      } as AgentEvent;
    }
    if (event === 'session_end' || type === 'session_end') {
      const events: AgentEvent[] = [];
      const finalMessage = (data.final_message ?? data.message ?? '') as string;
      if (finalMessage) events.push({ ...base, type: 'message_stop', text: finalMessage } as AgentEvent);
      const usage = data.usage as Record<string, unknown> | undefined;
      if (usage) {
        const cost = this.extractCostFromUsage(usage);
        if (cost) events.push({ ...base, type: 'cost', cost } as AgentEvent);
      }
      return events.length > 0 ? (events.length === 1 ? events[0] : (events as any)) : null;
    }
    if (event === 'error' || type === 'error') {
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message: (data.message ?? data.error ?? 'Unknown error') as string,
        recoverable: (data.recoverable ?? false) as boolean,
      } as AgentEvent;
    }
    return null;
  }

  private extractCostFromUsage(usage: Record<string, unknown>): CostRecord | null {
    const totalUsd = Number(usage.totalUsd || usage.total_usd || usage.cost || 0);
    const inputTokens = Number(usage.inputTokens || usage.input_tokens || usage.prompt_tokens || 0);
    const outputTokens = Number(usage.outputTokens || usage.output_tokens || usage.completion_tokens || 0);
    const cacheCreationTokens = usage.cacheCreationTokens || usage.cache_creation_tokens;
    const cacheReadTokens = usage.cacheReadTokens || usage.cache_read_tokens;
    if (totalUsd === 0 && inputTokens === 0 && outputTokens === 0) return null;
    const cost: CostRecord = { totalUsd, inputTokens, outputTokens };
    if (cacheCreationTokens != null) cost.cacheCreationTokens = Number(cacheCreationTokens);
    if (cacheReadTokens != null) cost.cacheReadTokens = Number(cacheReadTokens);
    return cost;
  }
}

import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';
import { createProxyConfig } from '../../src/config.js';
import { startProxyServer } from '../../src/server.js';
import type { CompletionEngine, CompletionRequest, CompletionStreamEvent } from '../../src/types.js';

function createToolCallEngine(): CompletionEngine & { requests: CompletionRequest[] } {
  const requests: CompletionRequest[] = [];
  const toolCall = {
    id: 'toolu_write_file',
    name: 'Write',
    arguments: JSON.stringify({ file_path: '/tmp/odyssey.md', content: '# Odyssey' }),
  };

  return {
    requests,
    async complete(request) {
      requests.push(request);
      return {
        id: 'mock-tool-completion',
        model: request.model,
        role: 'assistant',
        text: '',
        finishReason: 'tool_calls',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        toolCalls: [toolCall],
      };
    },
    async *stream(request): AsyncIterable<CompletionStreamEvent> {
      requests.push(request);
      yield { type: 'tool-call', ...toolCall };
      yield {
        type: 'done',
        finishReason: 'tool_calls',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };
    },
  };
}

describe('openai responses transport', () => {
  it('returns responses output text', async () => {
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-responses',
      },
      createMockCompletionEngine({ text: 'Proxy response' }),
    );

    const response = await app.request('/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: 'tell me something',
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.object).toBe('response');
    expect(body.status).toBe('completed');
    expect(body.output[0].content[0].text).toBe('Proxy response');
  });

  it('returns function_call output items from non-streaming completion tool calls', async () => {
    const engine = createToolCallEngine();
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude-sonnet-4-6',
        exposedTransport: 'openai-responses',
      },
      engine,
    );

    const response = await app.request('/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-5-codex',
        input: 'write the odyssey artifact',
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.output).toContainEqual(expect.objectContaining({
      type: 'function_call',
      call_id: 'toolu_write_file',
      name: 'Write',
      arguments: JSON.stringify({ file_path: '/tmp/odyssey.md', content: '# Odyssey' }),
      status: 'completed',
    }));
    expect(engine.requests[0]?.transport).toBe('openai-responses');
  });

  it('streams responses events when requested', async () => {
    const engine = createMockCompletionEngine({ text: 'Proxy response' });
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-responses',
      },
      engine,
    );

    const response = await app.request('/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        stream: true,
        input: 'tell me something',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const body = await response.text();
    expect(body).toContain('event: response.created');
    expect(body).toContain('event: response.output_text.delta');
    expect(body).toContain('Proxy response');
    expect(body).toContain('event: response.completed');
    expect(body).toContain('data: [DONE]');
    expect(engine.requests[0]?.stream).toBe(true);
  });

  it('includes function_call output items in streamed response completion payloads', async () => {
    const engine = createToolCallEngine();
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude-sonnet-4-6',
        exposedTransport: 'openai-responses',
      },
      engine,
    );

    const response = await app.request('/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-5-codex',
        stream: true,
        input: 'write the odyssey artifact',
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('event: response.output_item.added');
    expect(body).toContain('"type":"function_call"');
    expect(body).toContain('"call_id":"toolu_write_file"');

    const completedLine = body
      .split('\n')
      .find((line) => line.startsWith('data: ') && line.includes('"type":"response.completed"'));
    expect(completedLine).toBeDefined();
    const completed = JSON.parse(completedLine!.slice('data: '.length));
    expect(completed.response.output).toContainEqual(expect.objectContaining({
      type: 'function_call',
      call_id: 'toolu_write_file',
      name: 'Write',
      status: 'completed',
    }));
  });

  it('accepts Codex Responses WebSocket create events', async () => {
    const engine = createMockCompletionEngine({ text: 'Proxy websocket response' });
    const server = await startProxyServer(
      createProxyConfig({
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-responses',
        authToken: 'test-token',
        port: 0,
      }),
      engine,
    );

    try {
      const wsUrl = `${server.url.replace(/^http:/, 'ws:')}/v1/responses`;
      const events: Array<Record<string, unknown>> = [];
      const ws = new WebSocket(wsUrl, { headers: { authorization: 'Bearer test-token' } });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for websocket response')), 3000);
        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'response.create',
            model: 'gpt-4o',
            stream: true,
            input: 'tell me something',
          }));
        });
        ws.on('message', (data) => {
          const event = JSON.parse(data.toString()) as Record<string, unknown>;
          events.push(event);
          if (event.type === 'response.completed') {
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        });
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      expect(events.map((event) => event.type)).toContain('response.output_text.delta');
      expect(JSON.stringify(events)).toContain('Proxy websocket response');
      expect(engine.requests[0]?.transport).toBe('openai-responses');
      expect(engine.requests[0]?.stream).toBe(true);
    } finally {
      await server.stop();
    }
  });

  it('includes function_call output items in websocket response completion payloads', async () => {
    const engine = createToolCallEngine();
    const server = await startProxyServer(
      createProxyConfig({
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude-sonnet-4-6',
        exposedTransport: 'openai-responses',
        authToken: 'test-token',
        port: 0,
      }),
      engine,
    );

    try {
      const wsUrl = `${server.url.replace(/^http:/, 'ws:')}/v1/responses`;
      const events: Array<Record<string, unknown>> = [];
      const ws = new WebSocket(wsUrl, { headers: { authorization: 'Bearer test-token' } });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for websocket response')), 3000);
        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'response.create',
            model: 'gpt-5-codex',
            stream: true,
            input: 'write the odyssey artifact',
          }));
        });
        ws.on('message', (data) => {
          const event = JSON.parse(data.toString()) as Record<string, unknown>;
          events.push(event);
          if (event.type === 'response.completed') {
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        });
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      expect(events).toContainEqual(expect.objectContaining({
        type: 'response.output_item.added',
        item: expect.objectContaining({
          type: 'function_call',
          call_id: 'toolu_write_file',
          name: 'Write',
        }),
      }));
      const completed = events.find((event) => event.type === 'response.completed');
      expect((completed?.response as { output?: unknown[] }).output).toContainEqual(expect.objectContaining({
        type: 'function_call',
        call_id: 'toolu_write_file',
        name: 'Write',
        status: 'completed',
      }));
    } finally {
      await server.stop();
    }
  });
});

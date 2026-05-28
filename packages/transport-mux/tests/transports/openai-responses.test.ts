import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';
import { createProxyConfig } from '../../src/config.js';
import { startProxyServer } from '../../src/server.js';

describe('openai responses transport', () => {
  function parseSseEvents(body: string): Array<{ event?: string; data?: Record<string, unknown> | string }> {
    return body
      .split('\n\n')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const event = chunk.split('\n').find((line) => line.startsWith('event: '))?.slice('event: '.length);
        const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '))?.slice('data: '.length);
        if (!dataLine || dataLine === '[DONE]') return { event, data: dataLine };
        return { event, data: JSON.parse(dataLine) as Record<string, unknown> };
      });
  }

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

  it('streams function call arguments with Responses SSE events', async () => {
    const engine = createMockCompletionEngine({
      text: '',
      finishReason: 'tool_calls',
      toolCalls: [{
        id: 'call_assign_process',
        name: 'babysitter_yolo',
        arguments: '{"process":"predefined"}',
      }],
    });
    const app = createTestApp(
      {
        targetProvider: 'google',
        targetModel: 'google/gemini-3.5-flash',
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
        input: 'run /babysitter:yolo',
      }),
    });

    expect(response.status).toBe(200);
    const events = parseSseEvents(await response.text());
    const functionCallAdded = events.find((event) => event.event === 'response.output_item.added' &&
      (event.data as { item?: { type?: string } }).item?.type === 'function_call')?.data as { item: { arguments: string; status: string } } | undefined;
    const argumentsDelta = events.find((event) => event.event === 'response.function_call_arguments.delta')?.data as { delta?: string } | undefined;
    const argumentsDone = events.find((event) => event.event === 'response.function_call_arguments.done')?.data as { arguments?: string } | undefined;
    const completed = events.find((event) => event.event === 'response.completed')?.data as { response?: { output?: Array<{ type?: string }> } } | undefined;

    expect(functionCallAdded?.item).toMatchObject({
      arguments: '',
      status: 'in_progress',
    });
    expect(argumentsDelta?.delta).toBe('{"process":"predefined"}');
    expect(argumentsDone?.arguments).toBe('{"process":"predefined"}');
    expect(completed?.response?.output?.some((item) => item.type === 'function_call')).toBe(true);
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
});

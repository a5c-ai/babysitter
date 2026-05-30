import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { createTransportMuxApp } from '../src/server.js';
import { createProxyConfig } from '../src/config.js';
import { appendCostEventOnce, computeRunCostStats, extractCostEvents } from '../../sdk/src/cost/journal.js';
import { createRunDir, loadJournal, appendEvent } from '../../sdk/src/storage/index.js';
import { nextUlid } from '../../sdk/src/storage/ulids.js';
import { buildEffectIndex } from '../../sdk/src/runtime/replay/effectIndex.js';
import { enforceSessionBudgetForRun, setSessionBudget } from '../../agent-platform/src/session/cost.js';

function getRoutePaths(app: ReturnType<typeof createTransportMuxApp>) {
  return app.routes.map((route) => route.path);
}

describe('transport-mux server', () => {
  it('mounts health endpoint', () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'bedrock',
        targetModel: 'bedrock/claude',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(app)).toContain('/health');
  });

  it('mounts models endpoint', () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(app)).toContain('/v1/models');
  });

  it('mounts legacy ops endpoints', () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(app)).toContain('/metrics');
    expect(getRoutePaths(app)).toContain('/cache/stats');
  });

  it('mounts anthropic transport', () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(app)).toContain('/v1/messages');
  });

  it('mounts openai chat transport', () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-chat',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(app)).toContain('/v1/chat/completions');
  });

  it('mounts openai responses transport', () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-responses',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(app)).toContain('/v1/responses');
  });

  it('mounts google and passthrough routes', () => {
    const googleApp = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'google',
        authToken: 't',
      }),
    });
    const passthroughApp = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'passthrough',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(googleApp)).toContain('/v1beta/models/*');
    expect(getRoutePaths(passthroughApp)).toContain('/passthrough/*');
  });

  it('mounts count tokens endpoint', () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
    });

    expect(getRoutePaths(app)).toContain('/v1/count_tokens');
  });

  it('delegates /v1/count_tokens to provider-aware token counting and returns { count }', async () => {
    const requests: Array<{ model: string; transport: string; messages: Array<{ role: string; content: string }> }> = [];
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
      completionEngine: {
        async complete() {
          throw new Error('not used');
        },
        async countTokens(request) {
          requests.push({
            model: request.model,
            transport: request.transport,
            messages: request.messages,
          });
          return { count: 17 };
        },
      },
    });
    const body = {
      model: 'ignored-by-server',
      messages: [{ role: 'user', content: 'count these tokens' }],
    };

    const response = await app.request('/v1/count_tokens', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 't',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ count: 17 });
    expect(requests).toEqual([
      {
        model: 'openai/gpt-4o',
        transport: 'anthropic',
        messages: [{ role: 'user', content: 'count these tokens', rawContent: 'count these tokens' }],
      },
    ]);
  });

  it('returns 400 when /v1/count_tokens receives invalid json', async () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
      completionEngine: {
        async complete() {
          throw new Error('not used');
        },
        async countTokens() {
          throw new Error('not used');
        },
      },
    });

    const response = await app.request('/v1/count_tokens', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer t',
      },
      body: '{not-json',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: 'Request body must be valid JSON.' },
    });
  });

  it('returns 501 when provider-backed token counting is unavailable', async () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
    });

    const response = await app.request('/v1/count_tokens', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 't',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'count these tokens' }],
      }),
    });

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: { message: 'Token counting is not supported for provider openai.' },
    });
  });

  it('returns 400 when provider-backed token counting fails', async () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
      completionEngine: {
        async complete() {
          throw new Error('not used');
        },
        async countTokens() {
          throw new Error('provider rejected token count request');
        },
      },
    });

    const response = await app.request('/v1/count_tokens', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer t',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'count these tokens' }],
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: 'provider rejected token count request' },
    });
  });

  it('exposes unauthenticated legacy ops endpoint payloads', async () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'anthropic',
        authToken: 't',
      }),
    });

    const metricsResponse = await app.request('/metrics');
    const cacheResponse = await app.request('/cache/stats');

    expect(metricsResponse.status).toBe(200);
    await expect(metricsResponse.json()).resolves.toMatchObject({
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_requests: 0,
      total_errors: 0,
      avg_tokens_per_request: 0,
    });

    expect(cacheResponse.status).toBe(200);
    await expect(cacheResponse.json()).resolves.toEqual({ enabled: false });
  });

  it('tracks usage in /metrics for engine-backed completions', async () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 't',
      }),
      completionEngine: {
        async complete() {
          return {
            id: 'cmpl_123',
            model: 'openai/gpt-4o',
            role: 'assistant',
            text: 'hello',
            finishReason: 'stop',
            usage: {
              promptTokens: 11,
              completionTokens: 7,
              totalTokens: 18,
            },
          };
        },
      },
    });

    const completionResponse = await app.request('/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 't',
      },
      body: JSON.stringify({
        model: 'ignored-by-server',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(completionResponse.status).toBe(200);

    const metricsResponse = await app.request('/metrics');
    expect(metricsResponse.status).toBe(200);
    await expect(metricsResponse.json()).resolves.toMatchObject({
      total_input_tokens: 11,
      total_output_tokens: 7,
      total_requests: 1,
      total_errors: 0,
      avg_tokens_per_request: 18,
    });
  });

  it('emits normalized cost feedback for engine-backed completions with request identity', async () => {
    const feedback: unknown[] = [];
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude-sonnet',
        exposedTransport: 'openai-chat',
        authToken: 't',
      }),
      costFeedbackSink(record) {
        feedback.push(record);
      },
      completionEngine: {
        async complete() {
          return {
            id: 'cmpl_123',
            model: 'anthropic/claude-sonnet',
            role: 'assistant',
            text: 'hello',
            finishReason: 'stop',
            usage: {
              promptTokens: 11,
              completionTokens: 7,
              totalTokens: 18,
            },
            costRecord: {
              inputTokens: 12,
              outputTokens: 8,
              cacheReadTokens: 3,
              cacheWriteTokens: 2,
            },
          };
        },
      },
    });

    const response = await app.request('/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 't',
        'x-babysitter-run-id': 'run-1',
        'x-babysitter-session-id': 'session-1',
        'x-babysitter-effect-id': 'effect-1',
        'x-babysitter-cost-idempotency-key': 'transport:run-1:effect-1',
      },
      body: JSON.stringify({
        model: 'ignored-by-server',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(response.status).toBe(200);
    expect(feedback).toEqual([
      {
        runId: 'run-1',
        sessionId: 'session-1',
        effectId: 'effect-1',
        idempotencyKey: 'transport:run-1:effect-1',
        provider: 'anthropic',
        model: 'anthropic/claude-sonnet',
        inputTokens: 12,
        outputTokens: 8,
        cacheReadTokens: 3,
        cacheCreationTokens: 2,
      },
    ]);
  });

  it('emits streaming cost feedback exactly once from final usage', async () => {
    const feedback: unknown[] = [];
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 't',
        stream: true,
      }),
      costFeedbackSink(record) {
        feedback.push(record);
      },
      completionEngine: {
        async complete() {
          throw new Error('not used');
        },
        async *stream() {
          yield { type: 'text-delta', text: 'hel' };
          yield { type: 'text-delta', text: 'lo' };
          yield {
            type: 'done',
            finishReason: 'stop',
            usage: { promptTokens: 4, completionTokens: 2, totalTokens: 6 },
          };
        },
      },
    });

    const response = await app.request('/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 't',
        'x-babysitter-run-id': 'run-1',
        'x-babysitter-effect-id': 'effect-1',
      },
      body: JSON.stringify({
        model: 'ignored-by-server',
        stream: true,
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(response.status).toBe(200);
    await response.text();
    expect(feedback).toEqual([
      {
        runId: 'run-1',
        effectId: 'effect-1',
        provider: 'openai',
        model: 'openai/gpt-4o',
        inputTokens: 4,
        outputTokens: 2,
      },
    ]);
  });

  it('journals one transport feedback cost event and feeds session budget enforcement', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'transport-cost-chain-'));
    try {
      const runId = nextUlid();
      const { runDir } = await createRunDir({
        runsRoot: tempDir,
        runId,
        request: 'cost chain',
        processId: 'cost-chain',
      });
      await appendEvent({
        runDir,
        eventType: 'EFFECT_REQUESTED',
        event: {
          effectId: 'effect-1',
          invocationKey: 'cost-chain:S000001:effect-1',
          invocationHash: 'abc123',
          stepId: 'S000001',
          taskId: 'task-1',
          kind: 'agent',
          label: 'cost-chain',
          taskDefRef: 'tasks/effect-1/task.json',
          labels: ['cost-chain'],
        },
      });

      const app = createTransportMuxApp({
        config: createProxyConfig({
          targetProvider: 'anthropic',
          targetModel: 'anthropic/claude-sonnet',
          exposedTransport: 'openai-chat',
          authToken: 't',
        }),
        async costFeedbackSink(record) {
          await appendCostEventOnce(runDir, {
            ...record,
            model: record.model,
            inputTokens: record.inputTokens,
            outputTokens: record.outputTokens,
            cacheCreationTokens: record.cacheCreationTokens ?? 0,
            cacheReadTokens: record.cacheReadTokens ?? 0,
            cacheCreation5mTokens: 0,
            cacheCreation1hTokens: 0,
            costUsd: 0.02,
          });
        },
        completionEngine: {
          async complete() {
            return {
              id: 'cmpl_123',
              model: 'anthropic/claude-sonnet',
              role: 'assistant',
              text: 'hello',
              finishReason: 'stop',
              usage: {
                promptTokens: 11,
                completionTokens: 7,
                totalTokens: 18,
              },
              costRecord: {
                inputTokens: 12,
                outputTokens: 8,
                cacheReadTokens: 3,
                cacheWriteTokens: 2,
              },
            };
          },
        },
      });

      for (let i = 0; i < 2; i += 1) {
        const response = await app.request('/v1/chat/completions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': 't',
            'x-babysitter-run-id': runId,
            'x-babysitter-session-id': 'session-1',
            'x-babysitter-effect-id': 'effect-1',
            'x-babysitter-task-id': 'task-1',
            'x-babysitter-task-kind': 'agent',
            'x-babysitter-cost-idempotency-key': 'transport:run-1:effect-1',
          },
          body: JSON.stringify({
            model: 'ignored-by-server',
            messages: [{ role: 'user', content: 'hello' }],
          }),
        });
        expect(response.status).toBe(200);
      }

      const journal = await loadJournal(runDir);
      const costEvents = extractCostEvents(journal);
      expect(costEvents).toHaveLength(1);
      expect(costEvents[0].data).toMatchObject({
        runId,
        sessionId: 'session-1',
        effectId: 'effect-1',
        taskId: 'task-1',
        taskKind: 'agent',
        provider: 'anthropic',
        inputTokens: 12,
        outputTokens: 8,
        cacheCreationInputTokens: 2,
        cacheReadInputTokens: 3,
        idempotencyKey: 'transport:run-1:effect-1',
      });

      const stats = computeRunCostStats(runId, journal);
      expect(stats.totalCostUsd).toBeCloseTo(0.02);

      const index = await buildEffectIndex({ runDir });
      const effect = index.getByEffectId('effect-1');
      expect(effect?.costUsd).toBeCloseTo(0.02);
      expect(effect?.inputTokens).toBe(12);
      expect(effect?.cacheCreationInputTokens).toBe(2);

      await setSessionBudget(tempDir, 'session-1', {
        maxCostUsd: 0.01,
        alertThresholds: [50, 100],
        autoPause: true,
      });
      const budget = await enforceSessionBudgetForRun(tempDir, 'session-1', {
        runId,
        costUsd: stats.totalCostUsd,
        inputTokens: stats.totalInputTokens,
        outputTokens: stats.totalOutputTokens,
      });
      expect(budget.paused).toBe(true);
      expect(budget.pauseReason).toContain('Session cost budget exceeded');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('tracks completion failures in /metrics', async () => {
    const app = createTransportMuxApp({
      config: createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 't',
      }),
      completionEngine: {
        async complete() {
          throw new Error('boom');
        },
      },
    });

    const completionResponse = await app.request('/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer t',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(completionResponse.status).toBe(500);

    const metricsResponse = await app.request('/metrics');
    expect(metricsResponse.status).toBe(200);
    await expect(metricsResponse.json()).resolves.toMatchObject({
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_requests: 0,
      total_errors: 1,
      avg_tokens_per_request: 0,
    });
  });
});

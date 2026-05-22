import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { RunHandleImpl } from '@a5c-ai/agent-mux-core';
import { afterEach, describe, expect, it } from 'vitest';

import { createGateway, MemoryTokenStore } from '../src/index.js';
import type { GatewayRunClient } from '../src/config.js';
import { GatewayClient } from '../../ui/src/client/GatewayClient.js';
import { createWebSocket as createNodeWebSocket } from '../../ui/src/client/transports/ws-node.js';

interface FakeActiveRun {
  handle: RunHandleImpl;
  inputs: string[];
  aborted: boolean;
  hooks?: Record<string, (...args: unknown[]) => Promise<unknown>>;
}

class FakeGatewayRunClient implements GatewayRunClient {
  readonly runs = new Map<string, FakeActiveRun>();
  readonly nativeSessions = new Map<string, Array<Record<string, unknown>>>();
  readonly nativeSessionDetails = new Map<string, Record<string, unknown>>();
  lastRunOptions: Record<string, unknown> | null = null;
  readonly adapters = {
    list: () => [
      { agent: 'claude', displayName: 'Claude' },
      { agent: 'codex', displayName: 'Codex' },
      { agent: 'opencode', displayName: 'OpenCode' },
    ],
    installed: async () => [
      { agent: 'claude', installed: true, meetsMinVersion: true },
      { agent: 'codex', installed: true, meetsMinVersion: true },
      { agent: 'opencode', installed: true, meetsMinVersion: true },
    ],
    get: (agent: string) => {
      switch (agent) {
        case 'claude':
          return {
            adapterType: 'subprocess',
            capabilities: {
              structuredSessionTransport: 'persistent',
              sessionControlPlane: 'self-managed',
              supportsInteractiveMode: true,
              canResume: true,
            },
          };
        case 'codex':
          return {
            adapterType: 'subprocess',
            capabilities: {
              structuredSessionTransport: 'restart-per-turn',
              sessionControlPlane: 'self-managed',
              supportsInteractiveMode: false,
              canResume: true,
            },
          };
        case 'opencode':
          return {
            adapterType: 'subprocess',
            capabilities: {
              structuredSessionTransport: 'restart-per-turn',
              sessionControlPlane: 'self-managed',
              supportsInteractiveMode: false,
              canResume: true,
            },
          };
        default:
          return undefined;
      }
    },
  };
  readonly sessions = {
    list: async (agent: string) =>
      (this.nativeSessions.get(agent) ?? []).map((session) => ({
        agent,
        sessionId: String(session['sessionId']),
        unifiedId: `${agent}:${String(session['sessionId'])}`,
        title: String(session['title'] ?? session['sessionId']),
        createdAt: new Date(String(session['createdAt'])),
        updatedAt: new Date(String(session['updatedAt'])),
        turnCount: Number(session['turnCount'] ?? 0),
        messageCount: Number(session['messageCount'] ?? 0),
        model: typeof session['model'] === 'string' ? session['model'] : undefined,
        cost: typeof session['cost'] === 'object' ? session['cost'] as Record<string, unknown> : undefined,
        tags: [],
        cwd: typeof session['cwd'] === 'string' ? session['cwd'] : undefined,
      })),
    get: async (agent: string, sessionId: string) => {
      const detail = this.nativeSessionDetails.get(`${agent}:${sessionId}`);
      if (!detail) {
        throw new Error('SESSION_NOT_FOUND');
      }
      return {
        agent,
        sessionId,
        unifiedId: `${agent}:${sessionId}`,
        title: String(detail['title'] ?? sessionId),
        createdAt: new Date(String(detail['createdAt'])),
        updatedAt: new Date(String(detail['updatedAt'])),
        turnCount: Number(detail['turnCount'] ?? 0),
        model: typeof detail['model'] === 'string' ? detail['model'] : undefined,
        cost: typeof detail['cost'] === 'object' ? detail['cost'] as Record<string, unknown> : undefined,
        tags: [],
        cwd: typeof detail['cwd'] === 'string' ? detail['cwd'] : undefined,
        messages: Array.isArray(detail['messages']) ? detail['messages'] as never[] : [],
        raw: detail,
      };
    },
  };

  run(options: { runId?: string; agent: string; model?: string; sessionId?: string }): RunHandleImpl {
    this.lastRunOptions = options as Record<string, unknown>;
    const runId = options.runId ?? `run-${this.runs.size + 1}`;
    const handle = new RunHandleImpl({
      runId,
      agent: options.agent,
      model: options.model,
      collectEvents: false,
    });
    const inputs: string[] = [];
    handle.bindInputTransport(async (text) => {
      inputs.push(text);
    });

    const active: FakeActiveRun = {
      handle,
      inputs,
      aborted: false,
      hooks: options['hooks'] as FakeActiveRun['hooks'],
    };
    const originalAbort = handle.abort.bind(handle);
    handle.abort = async () => {
      await originalAbort();
      active.aborted = true;
      handle.complete('aborted', null, 'SIGTERM');
    };

    this.runs.set(runId, active);
    return handle;
  }
}

async function waitFor<T>(read: () => T | null | undefined, timeoutMs: number = 5_000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = read();
    if (value != null) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for condition');
}

describe('gateway end-to-end', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it('serves http, pairing, and websocket run control through the ui client', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-e2e-'));
    tempDirs.push(tempDir);

    const tokenStore = new MemoryTokenStore();
    const token = await tokenStore.create({ name: 'e2e-client' });
    const fakeClient = new FakeGatewayRunClient();
    const gateway = createGateway({
      host: '127.0.0.1',
      port: 0,
      tokenStore,
      tokenStoreKind: 'memory',
      client: fakeClient,
      eventLogDir: tempDir,
      enableWebui: false,
      unauthenticatedTimeoutMs: 500,
    });

    await gateway.start();
    const baseUrl = `http://127.0.0.1:${gateway.server.address.port}`;

    try {
      const healthz = await fetch(`${baseUrl}/healthz`);
      expect(healthz.status).toBe(200);
      await expect(healthz.json()).resolves.toMatchObject({
        ok: true,
      });

      const agentsResponse = await fetch(`${baseUrl}/api/v1/agents`, {
        headers: {
          authorization: `Bearer ${token.plaintext}`,
        },
      });
      expect(agentsResponse.status).toBe(200);
      await expect(agentsResponse.json()).resolves.toMatchObject({
        agents: expect.arrayContaining(['claude', 'codex', 'opencode']),
        agentDescriptors: expect.arrayContaining([
          expect.objectContaining({
            agent: 'claude',
            structuredSessionTransport: 'persistent',
            sessionControlPlane: 'self-managed',
          }),
        ]),
      });

      const registerResponse = await fetch(`${baseUrl}/api/v1/pairing/register`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token.plaintext}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          code: '12345678',
          url: baseUrl,
          token: token.plaintext,
        }),
      });
      expect(registerResponse.status).toBe(201);
      await expect(registerResponse.json()).resolves.toMatchObject({
        code: '12345678',
        url: baseUrl,
      });

      const consumeResponse = await fetch(`${baseUrl}/api/v1/pairing/consume`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ code: '12345678' }),
      });
      expect(consumeResponse.status).toBe(200);
      await expect(consumeResponse.json()).resolves.toMatchObject({
        code: '12345678',
        url: baseUrl,
        token: token.plaintext,
      });

      const client = new GatewayClient({
        url: `ws://127.0.0.1:${gateway.server.address.port}`,
        token: token.plaintext,
        createSocket: createNodeWebSocket,
      });

      try {
        await client.connect();
        const receivedFrames: Array<Record<string, unknown>> = [];
        const disconnectFrameListener = client.on('frame', (frame) => {
          receivedFrames.push(frame as Record<string, unknown>);
        });

        await expect(client.request({ type: 'agents.list' })).resolves.toMatchObject({
          agents: expect.arrayContaining(['claude', 'codex']),
        });

        const runStart = await client.request<{
          type: 'session.start';
          agent: string;
          model: string;
          prompt: string;
          sessionId: string;
        }, {
          run: { runId: string; status: string; agent: string; model?: string };
        }>({
          type: 'session.start',
          agent: 'claude',
          model: 'gpt-test',
          prompt: 'hello gateway',
          sessionId: 'session-to-resume',
        });
        expect(runStart.run).toMatchObject({
          status: 'running',
          agent: 'claude',
          model: 'gpt-test',
        });
        expect(fakeClient.lastRunOptions).toMatchObject({
          sessionId: 'session-to-resume',
        });

        const runId = runStart.run.runId;
        const unsubscribe = client.subscribeRun(runId, (frame) => {
          receivedFrames.push(frame as unknown as Record<string, unknown>);
        });

        try {
          const activeRun = await waitFor(() => fakeClient.runs.get(runId));
          const hookDecisionPromise = activeRun.hooks?.preToolUse?.(
            { toolName: 'Read', file_path: '/tmp/x.txt' },
            { signal: AbortSignal.timeout(1_000), emit: () => undefined },
          );

          const hookRequest = await waitFor(() =>
            receivedFrames.find(
              (frame) =>
                frame['type'] === 'hook.request' &&
                frame['runId'] === runId &&
                frame['hookKind'] === 'preToolUse',
            ) ?? null,
          );
          await expect(
            client.request({
              type: 'hook.decision',
              hookRequestId: String(hookRequest['hookRequestId']),
              decision: 'allow',
            }),
          ).resolves.toMatchObject({ ok: true });
          await expect(hookDecisionPromise).resolves.toEqual({ decision: 'allow' });

          activeRun.handle.emit({
            type: 'session_start',
            runId,
            agent: 'claude',
            timestamp: Date.now(),
            sessionId: 'session-e2e',
            cwd: process.cwd(),
          });
          activeRun.handle.emit({
            type: 'text_delta',
            runId,
            agent: 'claude',
            timestamp: Date.now(),
            delta: 'hello',
            accumulated: 'hello',
          });
          activeRun.handle.emit({
            type: 'message_stop',
            runId,
            agent: 'claude',
            timestamp: Date.now(),
            text: 'hello',
          });

          const runEventFrames = await waitFor(() => {
            const frames = receivedFrames.filter((frame) => frame['type'] === 'run.event');
            return frames.length >= 3 ? frames : null;
          });
          expect(runEventFrames.length).toBeGreaterThanOrEqual(3);

          await expect(client.request({
            type: 'session.message',
            sessionId: 'session-e2e',
            prompt: 'continue',
            agent: 'claude',
          })).resolves.toMatchObject({ ok: true });
          expect(activeRun.inputs).toEqual(['continue']);

          const runsResponse = await fetch(`${baseUrl}/api/v1/runs`, {
            headers: {
              authorization: `Bearer ${token.plaintext}`,
            },
          });
          expect(runsResponse.status).toBe(200);
          const runsBody = await runsResponse.json() as { runs: Array<Record<string, unknown>> };
          expect(runsBody.runs).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                runId,
                sessionId: 'session-e2e',
                status: 'running',
              }),
            ]),
          );

          const sessionsResponse = await fetch(`${baseUrl}/api/v1/sessions`, {
            headers: {
              authorization: `Bearer ${token.plaintext}`,
            },
          });
          expect(sessionsResponse.status).toBe(200);
          const sessionsBody = await sessionsResponse.json() as { sessions: Array<Record<string, unknown>> };
          expect(sessionsBody.sessions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                sessionId: 'session-e2e',
                agent: 'claude',
                status: 'active',
                activeRunId: runId,
              }),
            ]),
          );

          const unsubscribeSession = client.subscribeSession('session-e2e');
          try {
            const resumedRun = await client.request<{
              type: 'session.start';
              agent: string;
              prompt: string;
              sessionId: string;
            }, {
              run: { runId: string };
            }>({
              type: 'session.start',
              agent: 'claude',
              prompt: 'resume the same session',
              sessionId: 'session-e2e',
            });
            const resumedActiveRun = await waitFor(() => fakeClient.runs.get(resumedRun.run.runId));
            resumedActiveRun.handle.emit({
              type: 'text_delta',
              runId: resumedRun.run.runId,
              agent: 'claude',
              timestamp: Date.now(),
              delta: 'picked up remotely',
              accumulated: 'picked up remotely',
            });

            await waitFor(() =>
              receivedFrames.find(
                (frame) =>
                  frame['type'] === 'run.event' &&
                  frame['runId'] === resumedRun.run.runId &&
                  typeof frame['event'] === 'object' &&
                  frame['event'] != null &&
                  (frame['event'] as Record<string, unknown>)['type'] === 'text_delta',
              ) ?? null,
            );
          } finally {
            unsubscribeSession();
          }

          await expect(client.request({
            type: 'run.stop',
            runId,
          })).resolves.toMatchObject({ stopped: true });
          expect(activeRun.aborted).toBe(true);

          await waitFor(() => {
            const entry = gateway.runManager.get(runId);
            return entry?.status === 'aborted' ? entry : null;
          });
        } finally {
          unsubscribe();
          disconnectFrameListener();
        }
      } finally {
        await client.close();
      }
    } finally {
      await gateway.stop();
    }
  }, 10_000);

  it('merges inactive native sessions discovered from agent storage into the sessions api', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-native-sessions-'));
    tempDirs.push(tempDir);

    const tokenStore = new MemoryTokenStore();
    const token = await tokenStore.create({ name: 'native-sessions-client' });
    const fakeClient = new FakeGatewayRunClient();
    fakeClient.nativeSessions.set('codex', [
      {
        sessionId: 'native-codex-session',
        title: 'Disk session',
        createdAt: '2026-04-16T10:00:00.000Z',
        updatedAt: '2026-04-16T10:15:00.000Z',
        turnCount: 4,
        messageCount: 9,
        model: 'gpt-5-codex',
        cost: {
          totalUsd: 0.0421,
          inputTokens: 1234,
          outputTokens: 456,
          thinkingTokens: 111,
          cachedTokens: 222,
        },
        cwd: 'C:\\work\\agent-mux',
      },
    ]);
    fakeClient.nativeSessionDetails.set('codex:native-codex-session', {
      sessionId: 'native-codex-session',
      title: 'Disk session',
      createdAt: '2026-04-16T10:00:00.000Z',
      updatedAt: '2026-04-16T10:15:00.000Z',
      turnCount: 4,
      model: 'gpt-5-codex',
      cost: {
        totalUsd: 0.0421,
        inputTokens: 1234,
        outputTokens: 456,
        thinkingTokens: 111,
        cachedTokens: 222,
      },
      cwd: 'C:\\work\\agent-mux',
      messages: [
        { role: 'user', content: 'hello from disk' },
        { role: 'assistant', content: 'hello back', thinking: 'checking disk transcript' },
      ],
    });

    const gateway = createGateway({
      host: '127.0.0.1',
      port: 0,
      tokenStore,
      tokenStoreKind: 'memory',
      client: fakeClient,
      eventLogDir: tempDir,
      enableWebui: false,
    });

    await gateway.start();
    const baseUrl = `http://127.0.0.1:${gateway.server.address.port}`;

    try {
      const sessionsResponse = await fetch(`${baseUrl}/api/v1/sessions`, {
        headers: {
          authorization: `Bearer ${token.plaintext}`,
        },
      });
      expect(sessionsResponse.status).toBe(200);
      const sessionsBody = await sessionsResponse.json() as { sessions: Array<Record<string, unknown>> };
      expect(sessionsBody.sessions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'native-codex-session',
            agent: 'codex',
            status: 'inactive',
            activeRunId: null,
            latestRunId: null,
            title: 'Disk session',
            turnCount: 4,
            messageCount: 9,
            model: 'gpt-5-codex',
            cost: {
              totalUsd: 0.0421,
              inputTokens: 1234,
              outputTokens: 456,
              thinkingTokens: 111,
              cachedTokens: 222,
            },
            cwd: 'C:\\work\\agent-mux',
            source: 'native',
          }),
        ]),
      );

      const sessionResponse = await fetch(`${baseUrl}/api/v1/sessions/native-codex-session`, {
        headers: {
          authorization: `Bearer ${token.plaintext}`,
        },
      });
      expect(sessionResponse.status).toBe(200);
      await expect(sessionResponse.json()).resolves.toMatchObject({
        sessionId: 'native-codex-session',
        agent: 'codex',
        status: 'inactive',
        cost: {
          totalUsd: 0.0421,
          inputTokens: 1234,
          outputTokens: 456,
          thinkingTokens: 111,
          cachedTokens: 222,
        },
        source: 'native',
      });

      const fullResponse = await fetch(`${baseUrl}/api/v1/sessions/native-codex-session/full`, {
        headers: {
          authorization: `Bearer ${token.plaintext}`,
        },
      });
      expect(fullResponse.status).toBe(200);
      await expect(fullResponse.json()).resolves.toMatchObject({
        sessionId: 'native-codex-session',
        agent: 'codex',
        cost: {
          totalUsd: 0.0421,
          inputTokens: 1234,
          outputTokens: 456,
          thinkingTokens: 111,
          cachedTokens: 222,
        },
        messages: [
          { role: 'user', content: 'hello from disk' },
          { role: 'assistant', content: 'hello back', thinking: 'checking disk transcript' },
        ],
      });
    } finally {
      await gateway.stop();
    }
  });

  it('marks the ambient native harness session as active when it matches a discovered session', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-native-active-session-'));
    tempDirs.push(tempDir);

    const previousThreadId = process.env['CODEX_THREAD_ID'];
    process.env['CODEX_THREAD_ID'] = 'native-codex-session';

    const tokenStore = new MemoryTokenStore();
    const token = await tokenStore.create({ name: 'native-active-client' });
    const fakeClient = new FakeGatewayRunClient();
    fakeClient.nativeSessions.set('codex', [
      {
        sessionId: 'native-codex-session',
        title: 'Ambient codex thread',
        createdAt: '2026-04-16T10:00:00.000Z',
        updatedAt: '2026-04-16T10:15:00.000Z',
        turnCount: 4,
        messageCount: 9,
      },
    ]);

    const gateway = createGateway({
      host: '127.0.0.1',
      port: 0,
      tokenStore,
      tokenStoreKind: 'memory',
      client: fakeClient,
      eventLogDir: tempDir,
      enableWebui: false,
    });

    await gateway.start();
    const baseUrl = `http://127.0.0.1:${gateway.server.address.port}`;

    try {
      const sessionsResponse = await fetch(`${baseUrl}/api/v1/sessions`, {
        headers: {
          authorization: `Bearer ${token.plaintext}`,
        },
      });
      expect(sessionsResponse.status).toBe(200);
      const sessionsBody = await sessionsResponse.json() as { sessions: Array<Record<string, unknown>> };
      expect(sessionsBody.sessions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'native-codex-session',
            agent: 'codex',
            status: 'active',
            activeRunId: null,
            latestRunId: null,
            source: 'native',
          }),
        ]),
      );
    } finally {
      await gateway.stop();
      if (previousThreadId === undefined) {
        delete process.env['CODEX_THREAD_ID'];
      } else {
        process.env['CODEX_THREAD_ID'] = previousThreadId;
      }
    }
  });
});

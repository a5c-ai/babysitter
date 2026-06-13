/**
 * KradleControllerClient — kradle CRD control-plane REST client
 * (SPEC-KRADLE-CONTROLPLANE §1, AC1–AC9).
 *
 * Driven entirely by an INJECTED fake `fetch` and a hand-rolled fake
 * `EventSource` — no real network, no new deps (§6 invariant 5). Each test
 * cites the acceptance criterion it pins:
 *   AC1 — Bearer + Accept on every request; CSRF (`Content-Type` +
 *         `X-Kradle-Request`) on mutating requests; `credentials:'include'`;
 *         org scoping (default `'default'`); GETs `cache:'no-store'`.
 *   AC2 — `snapshot()` → `GET /api/controller?org=<org>`; degraded never throws.
 *   AC3 — definitions create/patch/get/delete bodies + paths; 422 typed.
 *   AC4 — `dispatch()` → `POST /agents/dispatch`; body shape.
 *   AC5 — `cancelRun()` → `POST /agents/runs/<name>/cancel` (no body).
 *   AC6 — `openEventStream()` via `EventSource` (`withCredentials:true`);
 *         heartbeat ignored; frames forwarded; unsubscribe closes.
 *   AC7 — `queryMemory()` → `POST /agents/memory/query`.
 *   AC8 — `decideApproval()` → `POST /agents/approvals/<name>/decide`.
 *   AC9 — non-2xx → `KradleControlPlaneError{status,endpoint,bodyExcerpt}`;
 *         5000ms abort timeout; verbs reject.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createKradleControllerClient,
  KradleControlPlaneError,
  KRADLE_REQUEST_TIMEOUT_MS,
} from '../controllerClient';
import type {
  KradleControllerClientConfig,
  KradleFetchLike,
  KradleFetchResponseLike,
  KradleFetchInit,
  EventSourceLike,
  EventSourceFactory,
} from '../controllerClient';

// ---------------------------------------------------------------------------
// Fake fetch — records every call (url/method/headers/body/signal), returns a
// scripted response. No network.
// ---------------------------------------------------------------------------

interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  hasSignal: boolean;
  cache?: string;
  credentials?: string;
}

interface FakeResponseSpec {
  ok?: boolean;
  status?: number;
  json?: unknown;
  text?: string;
  throws?: Error;
}

function makeFetch(
  responses: FakeResponseSpec | FakeResponseSpec[],
): { fetch: KradleFetchLike; calls: RecordedCall[] } {
  const queue = Array.isArray(responses) ? [...responses] : null;
  const calls: RecordedCall[] = [];
  const fetch: KradleFetchLike = (url: string, init?: KradleFetchInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    let parsedBody: unknown;
    if (typeof init?.body === 'string') {
      try {
        parsedBody = JSON.parse(init.body);
      } catch {
        parsedBody = init.body;
      }
    } else {
      parsedBody = init?.body;
    }
    calls.push({
      url,
      method: (init?.method ?? 'GET').toUpperCase(),
      headers,
      body: parsedBody,
      hasSignal: init?.signal != null,
      cache: init?.cache,
      credentials: init?.credentials,
    });
    const spec = (queue ? queue.shift() : responses) as FakeResponseSpec | undefined;
    const resolved: FakeResponseSpec = spec ?? { ok: true, status: 200, json: {} };
    if (resolved.throws) return Promise.reject(resolved.throws);
    const response: KradleFetchResponseLike = {
      ok: resolved.ok ?? true,
      status: resolved.status ?? 200,
      json: () => Promise.resolve(resolved.json ?? {}),
      text: () => Promise.resolve(resolved.text ?? JSON.stringify(resolved.json ?? {})),
    };
    return Promise.resolve(response);
  };
  return { fetch, calls };
}

// ---------------------------------------------------------------------------
// Fake EventSource — records the URL/options, lets the test drive messages.
// ---------------------------------------------------------------------------

class FakeEventSource implements EventSourceLike {
  static instances: FakeEventSource[] = [];
  readonly url: string;
  readonly withCredentials: boolean;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onopen: ((event: unknown) => void) | null = null;
  closed = false;

  constructor(url: string, init?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = init?.withCredentials ?? false;
    FakeEventSource.instances.push(this);
  }

  close(): void {
    this.closed = true;
  }

  emit(data: unknown): void {
    this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
  }
}

const factory: EventSourceFactory = (url, init) => new FakeEventSource(url, init);

function baseConfig(
  overrides: Partial<KradleControllerClientConfig> = {},
): KradleControllerClientConfig {
  return {
    kradleApiUrl: 'https://kradle.example.com',
    kradleToken: 'tok-xyz',
    kradleOrg: 'acme',
    kradleRepo: 'default',
    ...overrides,
  };
}

beforeEach(() => {
  FakeEventSource.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
});

// ===========================================================================
// AC1 — auth / CSRF / credentials / org scoping / no-store
// ===========================================================================

describe('AC1 — auth headers, CSRF, credentials, org scoping', () => {
  it('AC1: every request sends Authorization: Bearer + Accept: application/json + credentials:include', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: { items: [] } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.listDefinitions();
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.Authorization).toBe('Bearer tok-xyz');
    expect(calls[0].headers.Accept).toBe('application/json');
    expect(calls[0].credentials).toBe('include');
  });

  it('AC1: a GET sends cache:no-store and NO CSRF/Content-Type headers', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.snapshot();
    expect(calls[0].method).toBe('GET');
    expect(calls[0].cache).toBe('no-store');
    expect(calls[0].headers['Content-Type']).toBeUndefined();
    expect(calls[0].headers['X-Kradle-Request']).toBeUndefined();
  });

  it('AC1: a mutating request sends BOTH Content-Type: application/json AND X-Kradle-Request: commander', async () => {
    const { fetch, calls } = makeFetch({ ok: true, status: 201, json: { resource: {} } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.dispatch({ taskKind: 'diagnostic', agentDefinition: 'stack-a' });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].headers['Content-Type']).toBe('application/json');
    expect(calls[0].headers['X-Kradle-Request']).toBe('commander');
    expect(calls[0].headers.Authorization).toBe('Bearer tok-xyz');
  });

  it('AC1: org from config is substituted into the path; snapshot uses ?org=', async () => {
    const { fetch, calls } = makeFetch([
      { ok: true, json: {} },
      { ok: true, json: { items: [] } },
    ]);
    const client = createKradleControllerClient(baseConfig({ kradleOrg: 'acme' }), {
      fetch,
      eventSourceFactory: factory,
    });
    await client.snapshot();
    await client.listDefinitions();
    expect(calls[0].url).toBe('https://kradle.example.com/api/controller?org=acme');
    expect(calls[1].url).toBe('https://kradle.example.com/api/orgs/acme/agents/definitions');
  });

  it('AC1: org defaults to "default" when not configured', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(
      baseConfig({ kradleOrg: undefined }),
      { fetch, eventSourceFactory: factory },
    );
    await client.snapshot();
    expect(calls[0].url).toBe('https://kradle.example.com/api/controller?org=default');
  });

  it('AC1: a trailing slash on the base URL is normalized (no double slash)', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(
      baseConfig({ kradleApiUrl: 'https://kradle.example.com/' }),
      { fetch, eventSourceFactory: factory },
    );
    await client.snapshot();
    expect(calls[0].url).toBe('https://kradle.example.com/api/controller?org=acme');
  });
});

// ===========================================================================
// AC2 — controller snapshot
// ===========================================================================

describe('AC2 — controller snapshot', () => {
  it('AC2: snapshot() → GET /api/controller?org=<org>, returns the parsed model', async () => {
    const model = {
      product: 'Kradle',
      status: 'ready',
      agents: { stacks: { count: 1, items: [{ metadata: { name: 's1' } }] } },
    };
    const { fetch, calls } = makeFetch({ ok: true, json: model });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const result = await client.snapshot();
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('https://kradle.example.com/api/controller?org=acme');
    expect(result.status).toBe('ready');
    expect(result.agents?.stacks?.items?.[0]?.metadata?.name).toBe('s1');
  });

  it('AC2: a degraded snapshot (status!=ready, empty items, connection errors) is returned, NOT thrown', async () => {
    const degraded = {
      product: 'Kradle',
      status: 'degraded',
      controller: { connection: { available: false, context: null, errors: ['no controller'] } },
      agents: { stacks: { count: 0, items: [] }, runs: { count: 0, items: [], active: [] } },
    };
    const { fetch } = makeFetch({ ok: true, json: degraded });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const result = await client.snapshot();
    expect(result.status).toBe('degraded');
    expect(result.controller?.connection?.available).toBe(false);
    expect(result.controller?.connection?.errors).toEqual(['no controller']);
  });
});

// ===========================================================================
// AC3 — agent definitions CRUD
// ===========================================================================

describe('AC3 — AgentDefinition list/create/get/patch/delete', () => {
  it('AC3: listDefinitions() → GET /agents/definitions, returns items', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: { items: [{ metadata: { name: 'd1' } }] } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const result = await client.listDefinitions();
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/definitions');
    expect(result.items).toHaveLength(1);
  });

  it('AC3: createDefinition() → POST with explicit { metadata:{name,labels}, spec } body, no server-forced fields', async () => {
    const { fetch, calls } = makeFetch({ ok: true, status: 201, json: { resource: { metadata: { name: 'd1' } } } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.createDefinition({
      metadata: { name: 'd1', labels: { 'commander.a5c.ai/role': 'worker' } },
      spec: { baseAgent: 'claude-code', adapter: 'adapters.claude-code' },
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/definitions');
    const body = calls[0].body as { metadata: { name: string; labels: Record<string, string>; namespace?: string }; spec: Record<string, unknown> };
    expect(body.metadata.name).toBe('d1');
    expect(body.metadata.labels['commander.a5c.ai/role']).toBe('worker');
    expect(body.spec.baseAgent).toBe('claude-code');
    // The client MUST NOT send server-forced fields (namespace/organizationRef/org-label).
    expect(body.metadata.namespace).toBeUndefined();
    expect(body.spec.organizationRef).toBeUndefined();
    expect(body.metadata.labels['kradle.a5c.ai/org']).toBeUndefined();
  });

  it('AC3: getDefinition(name) → GET /agents/definitions/<name>, returns { resource }', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: { resource: { metadata: { name: 'd1' } } } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const result = await client.getDefinition('d1');
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/definitions/d1');
    expect(result.resource?.metadata.name).toBe('d1');
  });

  it('AC3: patchDefinition(name, partial) → PATCH /agents/definitions/<name> with the partial body', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: { resource: { metadata: { name: 'd1' } } } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.patchDefinition('d1', { spec: { model: 'opus' } });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/definitions/d1');
    expect(calls[0].headers['Content-Type']).toBe('application/json');
    expect(calls[0].headers['X-Kradle-Request']).toBe('commander');
    const body = calls[0].body as { spec: { model: string } };
    expect(body.spec.model).toBe('opus');
  });

  it('AC3: deleteDefinition(name) → DELETE /agents/definitions/<name> (CSRF header present, no body)', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.deleteDefinition('d1');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/definitions/d1');
    expect(calls[0].headers['X-Kradle-Request']).toBe('commander');
    expect(calls[0].body).toBeUndefined();
  });

  it('AC3: a 422 validation failure surfaces a typed KradleControlPlaneError', async () => {
    const { fetch } = makeFetch({
      ok: false,
      status: 422,
      json: { error: true, message: 'spec.baseAgent is required' },
      text: JSON.stringify({ error: true, message: 'spec.baseAgent is required' }),
    });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await expect(
      client.createDefinition({ metadata: { name: 'bad' }, spec: {} }),
    ).rejects.toBeInstanceOf(KradleControlPlaneError);
  });
});

// ===========================================================================
// AC4 — dispatch
// ===========================================================================

describe('AC4 — dispatch (create a run)', () => {
  it('AC4: dispatch() → POST /agents/dispatch with the full body, returns { run }', async () => {
    const { fetch, calls } = makeFetch({
      ok: true,
      status: 201,
      json: { run: { metadata: { name: 'run-1' } } },
    });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const result = await client.dispatch({
      agentDefinition: 'stack-a',
      repository: 'default',
      ref: 'main',
      taskKind: 'diagnostic',
      actor: 'owner',
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/dispatch');
    const body = calls[0].body as Record<string, unknown>;
    expect(body.agentDefinition).toBe('stack-a');
    expect(body.repository).toBe('default');
    expect(body.ref).toBe('main');
    expect(body.taskKind).toBe('diagnostic');
    expect(body.actor).toBe('owner');
    expect(result.run?.metadata.name).toBe('run-1');
  });

  it('AC4: a 400 domain failure throws a typed error (caller maps to null)', async () => {
    const { fetch } = makeFetch({
      ok: false,
      status: 400,
      json: { error: true, message: 'no stack' },
      text: JSON.stringify({ error: true, message: 'no stack' }),
    });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await expect(client.dispatch({ taskKind: 'diagnostic' })).rejects.toBeInstanceOf(
      KradleControlPlaneError,
    );
  });
});

// ===========================================================================
// AC5 — cancel run
// ===========================================================================

describe('AC5 — cancel a run', () => {
  it('AC5: cancelRun(name) → POST /agents/runs/<name>/cancel with NO body but CSRF header', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: { error: false, run: {} } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.cancelRun('run-1');
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/runs/run-1/cancel');
    expect(calls[0].headers['X-Kradle-Request']).toBe('commander');
    expect(calls[0].body).toBeUndefined();
  });

  it('AC5: a 404 unknown run surfaces a typed KradleControlPlaneError with status 404', async () => {
    const { fetch } = makeFetch({
      ok: false,
      status: 404,
      json: { error: true, message: "Run 'x' not found" },
      text: JSON.stringify({ error: true, message: "Run 'x' not found" }),
    });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.cancelRun('x').then(
      () => {
        throw new Error('expected rejection');
      },
      (err: unknown) => {
        expect(err).toBeInstanceOf(KradleControlPlaneError);
        expect((err as KradleControlPlaneError).status).toBe(404);
        expect((err as KradleControlPlaneError).endpoint).toContain('/agents/runs/x/cancel');
      },
    );
  });
});

// ===========================================================================
// AC7 — memory query
// ===========================================================================

describe('AC7 — memory query', () => {
  it('AC7: queryMemory(spec) → POST /agents/memory/query with the AgentMemoryQuerySpec body', async () => {
    const { fetch, calls } = makeFetch({
      ok: true,
      json: { matches: [{ record: { id: 'r1', nodeKind: 'Repository' }, score: 1, edges: [] }], totalMatches: 1 },
    });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const result = await client.queryMemory({
      snapshotRef: 'snap-1',
      requester: { kind: 'commander', name: 'board' },
      query: { text: 'ci', modes: ['graph-only'] },
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/memory/query');
    const body = calls[0].body as { query: { text: string } };
    expect(body.query.text).toBe('ci');
    expect(result.totalMatches).toBe(1);
    expect(result.matches[0].record.id).toBe('r1');
  });
});

// ===========================================================================
// AC8 — approvals decide
// ===========================================================================

describe('AC8 — approval decide', () => {
  it('AC8: decideApproval(name, "approve") → POST /agents/approvals/<name>/decide { decision:"approve" }', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: { resource: {} } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.decideApproval('appr-1', 'approve');
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://kradle.example.com/api/orgs/acme/agents/approvals/appr-1/decide');
    const body = calls[0].body as { decision: string };
    expect(body.decision).toBe('approve');
  });

  it('AC8: decideApproval(name, "deny") sends { decision:"deny" } with CSRF + auth', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: { resource: {} } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.decideApproval('appr-1', 'deny');
    const body = calls[0].body as { decision: string };
    expect(body.decision).toBe('deny');
    expect(calls[0].headers['X-Kradle-Request']).toBe('commander');
    expect(calls[0].headers.Authorization).toBe('Bearer tok-xyz');
  });
});

// ===========================================================================
// AC9 — typed errors + abort timeout
// ===========================================================================

describe('AC9 — typed failures + abort timeout', () => {
  it('AC9: a non-2xx response throws KradleControlPlaneError carrying status, endpoint, bodyExcerpt', async () => {
    const { fetch } = makeFetch({
      ok: false,
      status: 500,
      json: { error: true, message: 'boom' },
      text: JSON.stringify({ error: true, message: 'boom' }),
    });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    let caught: KradleControlPlaneError | null = null;
    try {
      await client.snapshot();
    } catch (err) {
      caught = err as KradleControlPlaneError;
    }
    expect(caught).toBeInstanceOf(KradleControlPlaneError);
    expect(caught?.status).toBe(500);
    expect(caught?.endpoint).toContain('/api/controller');
    expect(caught?.bodyExcerpt).toContain('boom');
  });

  it('AC9: the bodyExcerpt is truncated to a bounded length', async () => {
    const long = 'x'.repeat(5000);
    const { fetch } = makeFetch({ ok: false, status: 400, text: long, json: { message: long } });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const err = (await client.snapshot().catch((e: unknown) => e)) as KradleControlPlaneError;
    expect(err).toBeInstanceOf(KradleControlPlaneError);
    expect(err.bodyExcerpt.length).toBeLessThanOrEqual(500);
  });

  it('AC9: KRADLE_REQUEST_TIMEOUT_MS is 5000ms', () => {
    expect(KRADLE_REQUEST_TIMEOUT_MS).toBe(5000);
  });

  it('AC9: every request passes an AbortSignal (timeout wiring)', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await client.snapshot();
    expect(calls[0].hasSignal).toBe(true);
  });

  it('AC9: the request aborts after KRADLE_REQUEST_TIMEOUT_MS when fetch never settles', async () => {
    vi.useFakeTimers();
    const calls: RecordedCall[] = [];
    // fetch that rejects when its signal aborts (mirrors a real fetch abort).
    const fetch: KradleFetchLike = (url: string, init?: KradleFetchInit) => {
      calls.push({
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        headers: (init?.headers ?? {}) as Record<string, string>,
        body: init?.body,
        hasSignal: init?.signal != null,
      });
      return new Promise<KradleFetchResponseLike>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const e = new Error('aborted');
          e.name = 'AbortError';
          reject(e);
        });
      });
    };
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const pending = client.snapshot();
    const assertion = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(KRADLE_REQUEST_TIMEOUT_MS + 10);
    await assertion;
    expect(calls[0].hasSignal).toBe(true);
  });

  it('AC9: a network failure (fetch rejects) propagates as a rejection from the verb', async () => {
    const { fetch } = makeFetch({ throws: new Error('network down') });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    await expect(client.dispatch({ taskKind: 'diagnostic' })).rejects.toThrow('network down');
  });
});

// ===========================================================================
// AC6 — SSE event stream
// ===========================================================================

describe('AC6 — SSE event stream via EventSource', () => {
  it('AC6: openEventStream opens an EventSource at the org-scoped stream URL with withCredentials:true and ?korg=', () => {
    const { fetch } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const unsubscribe = client.openEventStream(() => {});
    expect(FakeEventSource.instances).toHaveLength(1);
    const es = FakeEventSource.instances[0];
    expect(es.url).toBe(
      'https://kradle.example.com/api/orgs/acme/agents/events/stream?korg=acme',
    );
    expect(es.withCredentials).toBe(true);
    unsubscribe();
  });

  it('AC6: a non-heartbeat frame is forwarded to the callback as a parsed object', () => {
    const { fetch } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const received: unknown[] = [];
    const unsubscribe = client.openEventStream((frame) => received.push(frame));
    const es = FakeEventSource.instances[0];
    es.emit({ type: 'agent-dispatched', run: { metadata: { name: 'r1' } }, timestamp: 't' });
    expect(received).toHaveLength(1);
    expect((received[0] as { type: string }).type).toBe('agent-dispatched');
    unsubscribe();
  });

  it('AC6: a heartbeat frame is IGNORED (not forwarded)', () => {
    const { fetch } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const received: unknown[] = [];
    const unsubscribe = client.openEventStream((frame) => received.push(frame));
    const es = FakeEventSource.instances[0];
    es.emit({ type: 'heartbeat', org: 'acme' });
    es.emit({ type: 'connected', org: 'acme' });
    es.emit({ type: 'definition-applied', resource: {}, timestamp: 't' });
    // heartbeat dropped; connected + applied forwarded.
    expect(received.map((r) => (r as { type: string }).type)).toEqual([
      'connected',
      'definition-applied',
    ]);
    unsubscribe();
  });

  it('AC6: a malformed (non-JSON) frame does not throw and is dropped', () => {
    const { fetch } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const received: unknown[] = [];
    const unsubscribe = client.openEventStream((frame) => received.push(frame));
    const es = FakeEventSource.instances[0];
    expect(() => es.emit('not json {')).not.toThrow();
    expect(received).toHaveLength(0);
    unsubscribe();
  });

  it('AC6: the returned unsubscribe closes the EventSource', () => {
    const { fetch } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(baseConfig(), { fetch, eventSourceFactory: factory });
    const unsubscribe = client.openEventStream(() => {});
    const es = FakeEventSource.instances[0];
    expect(es.closed).toBe(false);
    unsubscribe();
    expect(es.closed).toBe(true);
  });

  it('AC6: when no EventSource factory is available, openEventStream degrades to a no-op unsubscribe (polling-only)', () => {
    const { fetch } = makeFetch({ ok: true, json: {} });
    // No eventSourceFactory injected and no ambient EventSource → degraded.
    const client = createKradleControllerClient(baseConfig(), { fetch });
    const received: unknown[] = [];
    const unsubscribe = client.openEventStream((frame) => received.push(frame));
    expect(FakeEventSource.instances).toHaveLength(0);
    expect(() => unsubscribe()).not.toThrow();
  });
});

// ===========================================================================
// Construction guards
// ===========================================================================

describe('construction', () => {
  it('requires a kradleApiUrl (the client is only built when kradle is enabled — §4.2/AC18)', () => {
    const { fetch } = makeFetch({ ok: true, json: {} });
    expect(() =>
      createKradleControllerClient(
        baseConfig({ kradleApiUrl: '' }),
        { fetch, eventSourceFactory: factory },
      ),
    ).toThrow();
  });

  it('tolerates a missing token (Bearer header omitted, cookie-auth path)', async () => {
    const { fetch, calls } = makeFetch({ ok: true, json: {} });
    const client = createKradleControllerClient(
      baseConfig({ kradleToken: undefined }),
      { fetch, eventSourceFactory: factory },
    );
    await client.snapshot();
    expect(calls[0].headers.Authorization).toBeUndefined();
    expect(calls[0].credentials).toBe('include');
  });
});

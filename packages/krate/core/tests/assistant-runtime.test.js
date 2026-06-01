import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  createAssistantRuntime,
  defaultAssistantConfig,
  defaultSystemPrompt,
  callModel,
  ASSISTANT_RUNTIME_BOUNDARY,
} from '../src/assistant-runtime.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a mock fetch that returns a successful Anthropic Messages API response. */
function mockFetch(overrides = {}) {
  const defaultResponse = {
    content: [{ type: 'text', text: 'Hello from the assistant.' }],
    usage: { input_tokens: 10, output_tokens: 5 },
    stop_reason: 'end_turn',
  };
  const body = { ...defaultResponse, ...overrides };
  return async (_url, _opts) => ({
    ok: true,
    json: async () => body,
  });
}

/** Create a mock fetch that returns an API error. */
function mockFetchError(message = 'rate_limit_exceeded') {
  return async () => ({
    ok: false,
    json: async () => ({ error: { message } }),
  });
}

/** Create a mock fetch that throws a network error. */
function mockFetchNetworkError(msg = 'ECONNREFUSED') {
  return async () => { throw new Error(msg); };
}

/** Create a mock controller with getResource. */
function mockController(resources = {}) {
  return {
    async getResource(kind, name) {
      const key = `${kind}/${name}`;
      if (resources[key]) return { resource: resources[key] };
      throw new Error(`Resource ${key} not found`);
    },
  };
}

// ---------------------------------------------------------------------------
// ASSISTANT_RUNTIME_BOUNDARY
// ---------------------------------------------------------------------------

describe('ASSISTANT_RUNTIME_BOUNDARY', () => {
  it('declares the expected role', () => {
    assert.equal(ASSISTANT_RUNTIME_BOUNDARY.role, 'assistant-runtime');
  });

  it('includes chat sessions in owns list', () => {
    assert.ok(ASSISTANT_RUNTIME_BOUNDARY.owns.includes('chat sessions'));
  });
});

// ---------------------------------------------------------------------------
// defaultAssistantConfig
// ---------------------------------------------------------------------------

describe('defaultAssistantConfig', () => {
  it('returns an object with expected fields', () => {
    const config = defaultAssistantConfig();
    assert.equal(config.baseAgent, 'krate-assistant');
    assert.ok(typeof config.provider === 'string' || config.provider === undefined);
    assert.equal(typeof config.model, 'string');
    assert.equal(typeof config.systemPrompt, 'string');
    assert.equal(config.approvalMode, 'prompt');
  });

  it('returns a fresh object each call', () => {
    const a = defaultAssistantConfig();
    const b = defaultAssistantConfig();
    assert.notEqual(a, b);
    assert.deepEqual(a, b);
  });
});

// ---------------------------------------------------------------------------
// defaultSystemPrompt
// ---------------------------------------------------------------------------

describe('defaultSystemPrompt', () => {
  it('returns a non-empty string mentioning Krate', () => {
    const prompt = defaultSystemPrompt();
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.length > 50);
    assert.ok(prompt.includes('Krate'));
  });
});

// ---------------------------------------------------------------------------
// createAssistantRuntime — factory
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — factory', () => {
  it('returns an object with all expected methods', () => {
    const runtime = createAssistantRuntime();
    assert.equal(runtime.role, 'assistant-runtime');
    assert.equal(typeof runtime.resolveConfig, 'function');
    assert.equal(typeof runtime.createSession, 'function');
    assert.equal(typeof runtime.chat, 'function');
    assert.equal(typeof runtime.getSession, 'function');
    assert.equal(typeof runtime.listSessions, 'function');
    assert.equal(typeof runtime.deleteSession, 'function');
    assert.equal(typeof runtime.structuredCall, 'function');
  });
});

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — createSession', () => {
  it('creates a session with a generated ID when none provided', () => {
    const runtime = createAssistantRuntime();
    const session = runtime.createSession();
    assert.equal(typeof session.id, 'string');
    assert.ok(session.id.length > 0);
    assert.deepEqual(session.messages, []);
    assert.equal(session.status, 'active');
    assert.equal(session.stackRef, 'assistant');
  });

  it('creates a session with a custom ID', () => {
    const runtime = createAssistantRuntime();
    const session = runtime.createSession('my-session-123');
    assert.equal(session.id, 'my-session-123');
  });

  it('creates a session with a custom stackRef', () => {
    const runtime = createAssistantRuntime();
    const session = runtime.createSession(undefined, 'review-agent');
    assert.equal(session.stackRef, 'review-agent');
  });

  it('has a valid ISO createdAt timestamp', () => {
    const runtime = createAssistantRuntime();
    const session = runtime.createSession();
    assert.ok(!isNaN(Date.parse(session.createdAt)));
  });
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — getSession', () => {
  it('returns a created session by ID', () => {
    const runtime = createAssistantRuntime();
    const session = runtime.createSession('s1');
    const found = runtime.getSession('s1');
    assert.deepEqual(found, session);
  });

  it('returns null for unknown session ID', () => {
    const runtime = createAssistantRuntime();
    assert.equal(runtime.getSession('nonexistent'), null);
  });
});

// ---------------------------------------------------------------------------
// listSessions
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — listSessions', () => {
  it('returns empty array when no sessions exist', () => {
    const runtime = createAssistantRuntime();
    assert.deepEqual(runtime.listSessions(), []);
  });

  it('returns all created sessions', () => {
    const runtime = createAssistantRuntime();
    runtime.createSession('a');
    runtime.createSession('b');
    runtime.createSession('c');
    const list = runtime.listSessions();
    assert.equal(list.length, 3);
    const ids = list.map(s => s.id);
    assert.ok(ids.includes('a'));
    assert.ok(ids.includes('b'));
    assert.ok(ids.includes('c'));
  });
});

// ---------------------------------------------------------------------------
// deleteSession
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — deleteSession', () => {
  it('deletes an existing session and returns true', () => {
    const runtime = createAssistantRuntime();
    runtime.createSession('del-me');
    assert.equal(runtime.deleteSession('del-me'), true);
    assert.equal(runtime.getSession('del-me'), null);
  });

  it('returns false for a nonexistent session', () => {
    const runtime = createAssistantRuntime();
    assert.equal(runtime.deleteSession('ghost'), false);
  });
});

// ---------------------------------------------------------------------------
// resolveConfig
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — resolveConfig', () => {
  it('returns default config when no controller provided', async () => {
    const runtime = createAssistantRuntime();
    const config = await runtime.resolveConfig(null);
    assert.equal(config.baseAgent, 'krate-assistant');
    assert.ok(typeof config.provider === 'string' || config.provider === undefined);
  });

  it('returns default config when controller throws', async () => {
    const runtime = createAssistantRuntime();
    const controller = mockController({}); // empty — will throw
    const config = await runtime.resolveConfig(controller);
    assert.equal(config.baseAgent, 'krate-assistant');
  });

  it('reads spec from controller when stack exists', async () => {
    const runtime = createAssistantRuntime({ stackName: 'my-stack' });
    const controller = mockController({
      'AgentStack/my-stack': {
        spec: {
          baseAgent: 'codex',
          provider: 'openai',
          model: 'o3-pro',
          systemPrompt: 'Custom prompt',
          approvalMode: 'auto',
        },
      },
    });
    const config = await runtime.resolveConfig(controller);
    assert.equal(config.baseAgent, 'codex');
    assert.equal(config.provider, 'openai');
    assert.equal(config.model, 'o3-pro');
    assert.equal(config.approvalMode, 'auto');
  });

  it('falls back to default when resource has no spec', async () => {
    const runtime = createAssistantRuntime();
    const controller = mockController({
      'AgentStack/assistant': { spec: null },
    });
    const config = await runtime.resolveConfig(controller);
    assert.equal(config.baseAgent, 'krate-assistant');
  });
});

// ---------------------------------------------------------------------------
// chat
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — chat', () => {
  it('throws when session does not exist', async () => {
    const runtime = createAssistantRuntime({ fetchImpl: mockFetch() });
    await assert.rejects(
      () => runtime.chat('no-such-session', 'hello'),
      { message: /not found/ }
    );
  });

  it('adds user message and gets assistant response', async () => {
    const runtime = createAssistantRuntime({
      fetchImpl: mockFetch(),
      apiKey: 'test-key',
    });
    const session = runtime.createSession('chat-1');
    const response = await runtime.chat('chat-1', 'What is Krate?');

    assert.equal(response.content, 'Hello from the assistant.');
    assert.equal(session.messages.length, 2);
    assert.equal(session.messages[0].role, 'user');
    assert.equal(session.messages[0].content, 'What is Krate?');
    assert.equal(session.messages[1].role, 'assistant');
    assert.equal(session.messages[1].content, 'Hello from the assistant.');
  });

  it('messages accumulate across multiple chat calls', async () => {
    const runtime = createAssistantRuntime({
      fetchImpl: mockFetch(),
      apiKey: 'test-key',
    });
    const session = runtime.createSession('multi');
    await runtime.chat('multi', 'First message');
    await runtime.chat('multi', 'Second message');

    assert.equal(session.messages.length, 4);
    assert.equal(session.messages[0].role, 'user');
    assert.equal(session.messages[0].content, 'First message');
    assert.equal(session.messages[1].role, 'assistant');
    assert.equal(session.messages[2].role, 'user');
    assert.equal(session.messages[2].content, 'Second message');
    assert.equal(session.messages[3].role, 'assistant');
  });

  it('chat messages have timestamps', async () => {
    const runtime = createAssistantRuntime({
      fetchImpl: mockFetch(),
      apiKey: 'test-key',
    });
    runtime.createSession('ts');
    await runtime.chat('ts', 'hi');
    const session = runtime.getSession('ts');
    for (const msg of session.messages) {
      assert.ok(!isNaN(Date.parse(msg.timestamp)), `timestamp should be valid ISO: ${msg.timestamp}`);
    }
  });

  it('returns helpful error when no API key is set', async () => {
    // Temporarily unset env vars
    const origAnthropic = process.env.ANTHROPIC_API_KEY;
    const origKrate = process.env.KRATE_ASSISTANT_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.KRATE_ASSISTANT_API_KEY;

    try {
      const runtime = createAssistantRuntime({ apiKey: undefined });
      const session = runtime.createSession('no-key');
      const response = await runtime.chat('no-key', 'hello');
      assert.ok(response.content.includes('API key not configured'));
    } finally {
      if (origAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = origAnthropic;
      if (origKrate !== undefined) process.env.KRATE_ASSISTANT_API_KEY = origKrate;
    }
  });

  it('handles model API error response', async () => {
    const runtime = createAssistantRuntime({
      fetchImpl: mockFetchError('overloaded'),
      apiKey: 'test-key',
    });
    runtime.createSession('err');
    const response = await runtime.chat('err', 'test');
    assert.equal(response.content, 'overloaded');
  });

  it('handles network error gracefully', async () => {
    const runtime = createAssistantRuntime({
      fetchImpl: mockFetchNetworkError('ECONNREFUSED'),
      apiKey: 'test-key',
    });
    runtime.createSession('net-err');
    const response = await runtime.chat('net-err', 'test');
    assert.ok(response.content.includes('ECONNREFUSED'));
  });
});

// ---------------------------------------------------------------------------
// structuredCall
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — structuredCall', () => {
  it('returns model response for a string task', async () => {
    const runtime = createAssistantRuntime({
      fetchImpl: mockFetch({ content: [{ type: 'text', text: '{"result": "done"}' }] }),
      apiKey: 'test-key',
    });
    const response = await runtime.structuredCall('Summarize the deployment');
    assert.equal(response.content, '{"result": "done"}');
  });

  it('serializes object task to JSON', async () => {
    let capturedBody;
    const runtime = createAssistantRuntime({
      fetchImpl: async (_url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'ok' }], usage: {} }) };
      },
      apiKey: 'test-key',
    });
    await runtime.structuredCall({ action: 'deploy', target: 'staging' });
    const userMsg = capturedBody.messages.find(m => m.role === 'user');
    assert.ok(userMsg.content.includes('"action"'));
    assert.ok(userMsg.content.includes('"deploy"'));
  });

  it('supports custom systemPrompt override', async () => {
    let capturedBody;
    const runtime = createAssistantRuntime({
      fetchImpl: async (_url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'ok' }], usage: {} }) };
      },
      apiKey: 'test-key',
    });
    await runtime.structuredCall('Do something', { systemPrompt: 'You are a deployment expert.' });
    assert.equal(capturedBody.system, 'You are a deployment expert.');
  });

  it('returns helpful error when no API key is set', async () => {
    const origAnthropic = process.env.ANTHROPIC_API_KEY;
    const origKrate = process.env.KRATE_ASSISTANT_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.KRATE_ASSISTANT_API_KEY;

    try {
      const runtime = createAssistantRuntime({ apiKey: undefined });
      const response = await runtime.structuredCall('test');
      assert.ok(response.content.includes('API key not configured'));
    } finally {
      if (origAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = origAnthropic;
      if (origKrate !== undefined) process.env.KRATE_ASSISTANT_API_KEY = origKrate;
    }
  });

  it('uses stack config from controller when provided', async () => {
    let capturedBody;
    const runtime = createAssistantRuntime({
      stackName: 'custom',
      fetchImpl: async (_url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'ok' }], usage: {} }) };
      },
      apiKey: 'test-key',
    });
    const controller = mockController({
      'AgentStack/custom': {
        spec: {
          provider: 'anthropic',
          model: 'claude-opus-4-20250514',
          systemPrompt: 'You are a code reviewer.',
        },
      },
    });
    await runtime.structuredCall('Review this PR', { controller });
    assert.equal(capturedBody.model, 'claude-opus-4-20250514');
    assert.equal(capturedBody.system, 'You are a code reviewer.');
  });
});

// ---------------------------------------------------------------------------
// callModel — unit
// ---------------------------------------------------------------------------

describe('callModel', () => {
  it('returns API key error when none set', async () => {
    const origAnthropic = process.env.ANTHROPIC_API_KEY;
    const origKrate = process.env.KRATE_ASSISTANT_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.KRATE_ASSISTANT_API_KEY;

    try {
      const result = await callModel({
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'hi' }],
      });
      assert.ok(result.content.includes('API key not configured'));
    } finally {
      if (origAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = origAnthropic;
      if (origKrate !== undefined) process.env.KRATE_ASSISTANT_API_KEY = origKrate;
    }
  });

  it('extracts tool_use blocks into toolCalls', async () => {
    const result = await callModel({
      provider: 'anthropic',
      model: 'test-model',
      messages: [{ role: 'user', content: 'use a tool' }],
      apiKey: 'test-key',
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({
          content: [
            { type: 'text', text: 'Sure, I will use a tool.' },
            { type: 'tool_use', id: 'tu_1', name: 'get_status', input: {} },
          ],
          usage: { input_tokens: 5, output_tokens: 3 },
          stop_reason: 'tool_use',
        }),
      }),
    });
    assert.equal(result.toolCalls.length, 1);
    assert.equal(result.toolCalls[0].name, 'get_status');
    assert.equal(result.stopReason, 'tool_use');
    assert.ok(result.content.includes('Sure'));
  });
});

// ---------------------------------------------------------------------------
// Session isolation
// ---------------------------------------------------------------------------

describe('createAssistantRuntime — session isolation', () => {
  it('separate runtime instances have independent session stores', () => {
    const r1 = createAssistantRuntime();
    const r2 = createAssistantRuntime();
    r1.createSession('shared-id');
    assert.ok(r1.getSession('shared-id'));
    assert.equal(r2.getSession('shared-id'), null);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestApp } from '../helpers.js';

describe('passthrough transport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('rejects missing auth', async () => {
    const app = createTestApp({
      targetProvider: 'anthropic',
      targetModel: 'anthropic/claude-sonnet-4-20250514',
      exposedTransport: 'passthrough',
    });

    const response = await app.request('/passthrough/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
  });

  it('resolves provider base, preserves query params, and injects anthropic upstream auth', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ type: 'message' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-upstream');

    const app = createTestApp({
      targetProvider: 'anthropic',
      targetModel: 'anthropic/claude-sonnet-4-20250514',
      exposedTransport: 'passthrough',
    });

    const response = await app.request('/passthrough/v1/messages?trace=1', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
        authorization: 'Bearer proxy-boundary-token',
        'anthropic-version': 'client-value',
        'x-request-id': 'req-123',
      },
      body: JSON.stringify({ model: 'claude', messages: [] }),
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe('https://api.anthropic.com/v1/messages?trace=1');
    expect(headers.get('x-api-key')).toBe('sk-ant-upstream');
    expect(headers.get('authorization')).toBeNull();
    expect(headers.get('anthropic-version')).toBe('2023-06-01');
    expect(headers.get('x-request-id')).toBe('req-123');
  });

  it('honors explicit apiBase overrides and injects openai-compatible bearer auth', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'chatcmpl_123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubEnv('GROQ_API_KEY', 'gsk-upstream');

    const app = createTestApp({
      targetProvider: 'groq',
      targetModel: 'groq/llama-4-scout',
      exposedTransport: 'passthrough',
      apiBase: 'https://override.example.test/openai',
    });

    const response = await app.request('/passthrough/providers/openai/v1/chat/completions?foo=bar&foo=baz&mode=debug', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ model: 'llama-4-scout', messages: [] }),
    });

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe('https://override.example.test/providers/openai/v1/chat/completions?foo=bar&foo=baz&mode=debug');
    expect(headers.get('authorization')).toBe('Bearer gsk-upstream');
    expect(headers.get('x-api-key')).toBeNull();
  });

  it('injects google api-key auth for google passthrough providers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubEnv('GOOGLE_API_KEY', 'google-upstream');

    const app = createTestApp({
      targetProvider: 'google',
      targetModel: 'google/gemini-2.5-pro',
      exposedTransport: 'passthrough',
    });

    const response = await app.request('/passthrough/v1beta/models/gemini-2.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({ contents: [] }),
    });

    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent');
    expect(headers.get('x-goog-api-key')).toBe('google-upstream');
    expect(headers.get('authorization')).toBeNull();
  });

  it('returns 501 when passthrough has no completion engine and no resolvable apiBase', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const app = createTestApp({
      targetProvider: 'custom-provider-without-default-base',
      targetModel: 'custom/model',
      exposedTransport: 'passthrough',
    });

    const response = await app.request('/passthrough/v1/chat/completions?foo=bar', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ model: 'custom/model', messages: [] }),
    });

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: 'No completion engine or apiBase configured.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

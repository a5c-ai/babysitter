/**
 * createBackend factory (SPEC-LIVE-BACKEND §5.3, AC11 + AC1): returns the
 * `CommanderBackend` interface, a `MockBackend` for mock config (byte-identical
 * constructor path to `createMockBackendFromSearch` for the same seed) and a
 * `RealBackend` for valid real config.
 */
import { describe, expect, it } from 'vitest';

import { createBackend } from '../factory';
import { resolveBackendConfig } from '../config';
import { MockBackend, createMockBackendFromSearch } from '../mock/mockBackend';
import { RealBackend, type WebSocketLike, type FetchLike } from '../real/realBackend';
import type { BackendConfig } from '../config';

const noopFetch: FetchLike = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
  });

function noopSocketFactory(): WebSocketLike {
  return {
    send: () => undefined,
    close: () => undefined,
    readyState: 0,
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  };
}

describe('createBackend (AC11 — factory)', () => {
  it('AC1: mock config returns a MockBackend', () => {
    const config = resolveBackendConfig({}, '');
    const backend = createBackend(config);
    expect(backend).toBeInstanceOf(MockBackend);
  });

  it('AC1: the mock branch uses the same seed as createMockBackendFromSearch', () => {
    const search = '?seed=99';
    const config = resolveBackendConfig({}, search);
    const fromFactory = createBackend(config);
    const fromHelper = createMockBackendFromSearch(search);
    expect(fromFactory).toBeInstanceOf(MockBackend);
    // Same seed ⇒ same deterministic boot (structural byte-identity, AC1).
    expect((fromFactory as MockBackend).sim.seed).toBe(fromHelper.sim.seed);
    expect((fromFactory as MockBackend).sim.seed).toBe(99);
  });

  it('AC11: valid real config returns a RealBackend', () => {
    const config: BackendConfig = {
      mode: 'real',
      seed: 42,
      gatewayUrl: 'wss://gw.example/socket',
      token: 'tok',
    };
    const backend = createBackend(config, {
      webSocketFactory: noopSocketFactory,
      fetch: noopFetch,
    });
    expect(backend).toBeInstanceOf(RealBackend);
  });

  it('AC1: a partial-real resolved config (→ mock) returns a MockBackend', () => {
    // resolveBackendConfig downgrades missing url/token to mock; the factory then
    // simply sees mode:'mock'.
    const config = resolveBackendConfig(
      { VITE_BACKEND: 'real', VITE_GATEWAY_URL: 'wss://gw' },
      '',
    );
    expect(config.mode).toBe('mock');
    expect(createBackend(config)).toBeInstanceOf(MockBackend);
  });

  it('AC16: kradle-only real config (no gateway) returns a non-throwing inert-gateway backend', async () => {
    // SPEC-KRADLE-CONTROLPLANE §4.1/AC16: real mode is valid with just
    // kradleApiUrl. The factory must NOT construct a gateway RealBackend (which
    // requires gatewayUrl+token and would throw at boot) — it returns an inert
    // gateway whose kradle data rides bootReal's own client.
    const config = resolveBackendConfig(
      { VITE_BACKEND: 'real', VITE_KRADLE_API_URL: 'https://kradle.example' },
      '',
    );
    expect(config.mode).toBe('real');
    expect(config.gatewayUrl).toBeUndefined();
    expect(config.kradleApiUrl).toBe('https://kradle.example');
    const backend = createBackend(config);
    expect(backend).not.toBeInstanceOf(MockBackend);
    expect(backend).not.toBeInstanceOf(RealBackend);
    // The inert gateway is a usable CommanderBackend: connect resolves, lists empty.
    await expect(backend.connect()).resolves.toBeUndefined();
    expect(backend.onFrame(() => undefined)()).toBeUndefined();
    await expect(backend.listAgents()).resolves.toEqual([]);
    await expect(backend.listRuns()).resolves.toEqual([]);
    backend.disconnect();
  });
});

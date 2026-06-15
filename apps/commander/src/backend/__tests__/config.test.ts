/**
 * resolveBackendConfig matrix (SPEC-LIVE-BACKEND §5.2, AC1 + AC10): default →
 * mock, env real, URL-overrides-env precedence, partial-real → mock fallback,
 * and seed passthrough via the canonical `seedFromSearch`.
 */
import { describe, expect, it } from 'vitest';

import { resolveBackendConfig, type BackendEnv } from '../config';
import { DEFAULT_SEED } from '../mock/mockBackend';

const EMPTY_ENV: BackendEnv = {};

describe('resolveBackendConfig (AC10 — config resolution & precedence)', () => {
  it('AC1: defaults to mock with no env and no params, seed = DEFAULT_SEED', () => {
    const config = resolveBackendConfig(EMPTY_ENV, '');
    expect(config.mode).toBe('mock');
    expect(config.seed).toBe(DEFAULT_SEED);
    expect(config.gatewayUrl).toBeUndefined();
    expect(config.token).toBeUndefined();
  });

  it('AC1: an unrecognized backend value falls back to mock', () => {
    const config = resolveBackendConfig({ VITE_BACKEND: 'bogus' as 'mock' }, '?backend=nonsense');
    expect(config.mode).toBe('mock');
  });

  it('AC10: VITE_BACKEND=real with VITE url+token resolves to real', () => {
    const config = resolveBackendConfig(
      {
        VITE_BACKEND: 'real',
        VITE_GATEWAY_URL: 'wss://gw.example/socket',
        VITE_GATEWAY_TOKEN: 'tok-env',
      },
      '',
    );
    expect(config.mode).toBe('real');
    expect(config.gatewayUrl).toBe('wss://gw.example/socket');
    expect(config.token).toBe('tok-env');
  });

  it('AC10: URL params override env (?backend=mock forces mock over VITE real)', () => {
    const config = resolveBackendConfig(
      {
        VITE_BACKEND: 'real',
        VITE_GATEWAY_URL: 'wss://gw.example',
        VITE_GATEWAY_TOKEN: 'tok-env',
      },
      '?backend=mock',
    );
    expect(config.mode).toBe('mock');
  });

  it('AC10: URL params override env (?backend=real + ?gateway + ?token over VITE mock)', () => {
    const config = resolveBackendConfig(
      { VITE_BACKEND: 'mock' },
      '?backend=real&gateway=ws://local:9000/ws&token=tok-url',
    );
    expect(config.mode).toBe('real');
    expect(config.gatewayUrl).toBe('ws://local:9000/ws');
    expect(config.token).toBe('tok-url');
  });

  it('AC10: ?gateway and ?token override the VITE equivalents for a real deploy', () => {
    const config = resolveBackendConfig(
      {
        VITE_BACKEND: 'real',
        VITE_GATEWAY_URL: 'wss://env-host',
        VITE_GATEWAY_TOKEN: 'tok-env',
      },
      '?gateway=wss://url-host&token=tok-url',
    );
    expect(config.mode).toBe('real');
    expect(config.gatewayUrl).toBe('wss://url-host');
    expect(config.token).toBe('tok-url');
  });

  it('AC1: partial real (missing token) falls back to mock', () => {
    const config = resolveBackendConfig(
      { VITE_BACKEND: 'real', VITE_GATEWAY_URL: 'wss://gw.example' },
      '',
    );
    expect(config.mode).toBe('mock');
    expect(config.gatewayUrl).toBeUndefined();
  });

  it('AC1: partial real (missing url) falls back to mock', () => {
    const config = resolveBackendConfig({ VITE_BACKEND: 'real', VITE_GATEWAY_TOKEN: 'tok' }, '');
    expect(config.mode).toBe('mock');
    expect(config.token).toBeUndefined();
  });

  it('AC1: real mode with whitespace-only url/token degrades to mock', () => {
    const config = resolveBackendConfig(
      { VITE_BACKEND: 'real', VITE_GATEWAY_URL: '   ', VITE_GATEWAY_TOKEN: '  ' },
      '',
    );
    expect(config.mode).toBe('mock');
  });

  it('AC10: seed passthrough — ?seed= is parsed via seedFromSearch (mock branch)', () => {
    const config = resolveBackendConfig(EMPTY_ENV, '?seed=777');
    expect(config.mode).toBe('mock');
    expect(config.seed).toBe(777);
  });

  it('AC10: seed is resolved even on the real branch (carried for fail-safe mock)', () => {
    const config = resolveBackendConfig(
      {
        VITE_BACKEND: 'real',
        VITE_GATEWAY_URL: 'wss://gw',
        VITE_GATEWAY_TOKEN: 'tok',
      },
      '?seed=123',
    );
    expect(config.seed).toBe(123);
  });
});

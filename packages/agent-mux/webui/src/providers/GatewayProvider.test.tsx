/** @vitest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  connectMock,
  requestMock,
  closeMock,
  uiGatewayProviderSpy,
} = vi.hoisted(() => ({
  connectMock: vi.fn(),
  requestMock: vi.fn(),
  closeMock: vi.fn(),
  uiGatewayProviderSpy: vi.fn(),
}));

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  GatewayClient: class MockGatewayClient {
    readonly connect = connectMock;
    readonly request = requestMock;
    readonly close = closeMock;
    readonly subscribeRun = vi.fn(() => () => {});

    constructor(_options: unknown) {}
  },
  GatewayProvider: ({ children }: { children: React.ReactNode }) => {
    uiGatewayProviderSpy();
    return <>{children}</>;
  },
  useGateway: () => ({
    client: {
      subscribeRun: vi.fn(() => () => {}),
    },
    store: {
      getState: () => ({
        actions: {
          setAgents: vi.fn(),
          mergeRun: vi.fn(),
          mergeSession: vi.fn(),
        },
      }),
    },
  }),
}));

import { GatewayProvider, readPersistedAuthError, useGatewayAuth } from './GatewayProvider.js';

function AuthProbe(): JSX.Element {
  const { auth, isAuthenticated, isReady } = useGatewayAuth();
  return (
    <div>
      <div data-testid="auth">{auth ? 'present' : 'none'}</div>
      <div data-testid="gateway-url">{auth?.gatewayUrl ?? ''}</div>
      <div data-testid="ready">{isReady ? 'ready' : 'pending'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="auth-error">{readPersistedAuthError() ?? ''}</div>
    </div>
  );
}

describe('GatewayProvider', () => {
  beforeEach(() => {
    connectMock.mockReset();
    requestMock.mockReset();
    closeMock.mockReset();
    uiGatewayProviderSpy.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('waits for stored auth validation before mounting the live gateway layer', async () => {
    window.localStorage.setItem(
      'amux.webui.auth',
      JSON.stringify({ gatewayUrl: 'http://localhost:57751', token: 'stale-token' }),
    );
    connectMock.mockRejectedValue(
      new Error('Gateway socket closed before authentication completed'),
    );

    render(
      <GatewayProvider>
        <AuthProbe />
      </GatewayProvider>,
    );

    expect(screen.getByTestId('auth').textContent).toBe('present');
    expect(uiGatewayProviderSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('none');
    });

    expect(screen.getByTestId('ready').textContent).toBe('ready');
    expect(screen.getByTestId('authenticated').textContent).toBe('no');
    expect(screen.getByTestId('auth-error').textContent).toBe(
      'Stored gateway access expired or was rejected. Connect again.',
    );
    expect(uiGatewayProviderSpy).not.toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
  });

  it('normalizes stored app route URLs back to the gateway base origin', async () => {
    window.localStorage.setItem(
      'amux.webui.auth',
      JSON.stringify({
        gatewayUrl: 'http://localhost:57751/sessions/rollout-2026-04-27T15-37-25-019dcef1-c795-7552-a983-71a1c631d64c',
        token: 'valid-token',
      }),
    );
    connectMock.mockResolvedValue(undefined);
    requestMock.mockResolvedValue({ agents: [] });

    render(
      <GatewayProvider>
        <AuthProbe />
      </GatewayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready').textContent).toBe('ready');
    });

    expect(screen.getByTestId('gateway-url').textContent).toBe('http://localhost:57751');
    expect(screen.getByTestId('authenticated').textContent).toBe('yes');
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('amux.webui.auth') ?? '{}')).toMatchObject({
        gatewayUrl: 'http://localhost:57751',
        token: 'valid-token',
      });
    });
  });
});

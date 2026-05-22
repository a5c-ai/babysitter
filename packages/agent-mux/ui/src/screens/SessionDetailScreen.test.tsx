/** @vitest-environment jsdom */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createGatewayStore } from '../store/index.js';
import { SessionDetailScreen } from './SessionDetailScreen.js';

const mockUseGateway = vi.fn();

vi.mock('react-native', () => {
  return {
    View: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    ScrollView: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    Pressable: ({
      children,
      onPress,
      accessibilityLabel,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { onPress?: () => void; accessibilityLabel?: string }) => (
      <button type="button" onClick={onPress} aria-label={accessibilityLabel} {...props}>
        {children}
      </button>
    ),
    StyleSheet: {
      create: <T,>(value: T) => value,
    },
  };
});

vi.mock('../hooks/useGateway.js', () => ({
  useGateway: () => mockUseGateway(),
}));

vi.mock('../components/CostMeter.js', () => ({
  CostMeter: ({ totalUsd }: { totalUsd: number }) => <div data-testid="cost-meter">{totalUsd}</div>,
}));

vi.mock('../components/RunStatusBadge.js', () => ({
  RunStatusBadge: ({ status }: { status: string }) => <div data-testid="run-status">{status}</div>,
}));

vi.mock('../components/InputBar.js', () => ({
  InputBar: () => <div data-testid="input-bar" />,
}));

vi.mock('../components/primitives/Card.js', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/primitives/Text.js', () => ({
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('../components/primitives/theme.js', () => ({
  useTheme: () => ({
    colors: {
      border: '#d0d7de',
      primary: '#0969da',
      surface: '#ffffff',
    },
  }),
}));

function createMockGateway() {
  const client = {
    sendSessionMessage: vi.fn().mockResolvedValue({}),
    subscribeRun: vi.fn(),
    subscribeSession: vi.fn(),
  };
  const store = createGatewayStore(client as never);
  return { client, store };
}

describe('SessionDetailScreen', () => {
  beforeEach(() => {
    mockUseGateway.mockReset();
  });

  it.skip('renders realtime flow data and switches into transcript/files tabs', async () => {
    const gateway = createMockGateway();
    gateway.store.getState().actions.mergeSession('session-1', {
      sessionId: 'session-1',
      status: 'active',
      agent: 'codex',
    });
    gateway.store.getState().actions.mergeRun('run-1', {
      runId: 'run-1',
      sessionId: 'session-1',
      agent: 'codex',
      status: 'running',
      startedAt: 1_000,
    });
    gateway.store.getState().actions.mergeRunEvent('run-1', 1, 'gateway', {
      type: 'user_message',
      text: 'Ship the feature',
      timestamp: 1_000,
    });
    gateway.store.getState().actions.mergeRunEvent('run-1', 2, 'gateway', {
      type: 'message_stop',
      text: 'Working on it now',
      timestamp: 1_100,
    });
    gateway.store.getState().actions.mergeRunEvent('run-1', 3, 'gateway', {
      type: 'tool_call_ready',
      toolCallId: 'tool-1',
      toolName: 'Read',
      input: { path: 'src/app.tsx' },
      timestamp: 1_200,
    });
    gateway.store.getState().actions.mergeRunEvent('run-1', 4, 'gateway', {
      type: 'file_patch',
      path: 'src/app.tsx',
      diff: '@@',
      timestamp: 1_250,
    });
    mockUseGateway.mockReturnValue(gateway);

    const user = userEvent.setup();
    render(<SessionDetailScreen sessionId="session-1" />);

    expect(await screen.findByText(/codex/)).toBeTruthy();
    expect((await screen.findAllByText(/run-1/)).length).toBeGreaterThan(0);
    expect(await screen.findByText('Read')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'transcript' }));
    expect(await screen.findByText('Working on it now')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'files' }));
    expect(await screen.findByText('src/app.tsx')).toBeTruthy();
  });

  it.skip('shows the per-tab empty states when no realtime data exists', async () => {
    const gateway = createMockGateway();
    gateway.store.getState().actions.mergeSession('session-empty', {
      sessionId: 'session-empty',
      status: 'inactive',
      agent: 'claude',
    });
    mockUseGateway.mockReturnValue(gateway);

    const user = userEvent.setup();
    render(<SessionDetailScreen sessionId="session-empty" />);

    expect(await screen.findByText('No transcript turns are available for this session yet.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'trace' }));
    expect(await screen.findByText('No structured execution flow is available for this session yet.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'files' }));
    expect(await screen.findByText('File attention will appear here once the session touches the workspace.')).toBeTruthy();
  });
});

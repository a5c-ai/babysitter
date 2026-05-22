import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom-v6';
import { createStore } from 'zustand/vanilla';
import { describe, expect, it, vi } from 'vitest';

import { TopBar } from './TopBar.js';

const mockUseConnection = vi.fn();

const gatewayStore = createStore(() => ({
  sessions: {
    byId: {
      'session-active': { sessionId: 'session-active', status: 'active' },
    },
  },
  runs: {
    byId: {
      'run-active': { runId: 'run-active', status: 'running' },
    },
  },
}));

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  useConnection: () => mockUseConnection(),
  useGateway: () => ({ store: gatewayStore }),
}));

vi.mock('lucide-react', () => ({
  Command: () => null,
  PlayCircle: () => null,
}));

describe('TopBar', () => {
  it('keeps workspace tools collapsed by default on operator routes', () => {
    mockUseConnection.mockReturnValue({ status: 'connected' });

    render(
      <MemoryRouter>
        <TopBar pathname="/sessions" onOpenPalette={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sessions' })).toBeInTheDocument();
    expect(screen.getByTestId('topbar-tools-details')).not.toHaveAttribute('open');
    expect(screen.getByTestId('topbar-connection-status')).toHaveTextContent('connected');
    expect(screen.getByText('Directory')).toBeInTheDocument();
    expect(screen.getByText('1 active')).toBeInTheDocument();
    expect(screen.getByText('1 dispatching')).toBeInTheDocument();
  });
});

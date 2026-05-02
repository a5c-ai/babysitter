import { createStore } from 'zustand/vanilla';
import { describe, expect, it, vi } from 'vitest';

import { render, screen, setupUser, waitFor } from '@/test/test-utils';

import { SessionsPage } from './SessionsPage.js';

const mockUseGateway = vi.fn();
const mockUseGatewayFetch = vi.fn();

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  useGateway: () => mockUseGateway(),
}));

vi.mock('../providers/GatewayProvider.js', () => ({
  useGatewayFetch: () => mockUseGatewayFetch(),
}));

function createGatewayStore() {
  return createStore(() => ({
    sessions: {
      byId: {
        'session-active': {
          sessionId: 'session-active',
          agent: 'codex',
          status: 'active',
          title: 'Realtime workspace repair',
          messageCount: 8,
          turnCount: 4,
          updatedAt: 1_700_000_000_000,
          activeRunId: 'run-active',
          cwd: '/repo/worktrees/active',
          cost: { totalUsd: 0.42 },
        },
        'session-paused': {
          sessionId: 'session-paused',
          agent: 'claude',
          status: 'inactive',
          title: 'Board follow-up',
          messageCount: 3,
          turnCount: 2,
          updatedAt: 1_699_000_000_000,
          latestRunId: 'run-paused',
          workspace: { currentPath: '/repo/worktrees/paused' },
        },
      },
    },
    runs: {
      byId: {
        'run-active': { runId: 'run-active', sessionId: 'session-active' },
        'run-paused': { runId: 'run-paused', sessionId: 'session-paused' },
      },
    },
    events: {
      byRunId: {
        'run-paused': {
          events: [{ type: 'cost', cost: { totalUsd: 0.07 } }],
        },
      },
    },
  }));
}

describe('SessionsPage', () => {
  beforeEach(() => {
    mockUseGatewayFetch.mockReturnValue(
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ sessions: [] }),
      })),
    );
  });

  it('surfaces active sessions first with workspace and run navigation', () => {
    mockUseGateway.mockReturnValue({ store: createGatewayStore() });

    render(<SessionsPage />);

    expect(screen.getByText('Jump back into the right chat.')).toBeInTheDocument();
    expect(screen.getByText('Observed cost')).toBeInTheDocument();
    expect(screen.getAllByText('Realtime workspace repair').length).toBeGreaterThan(0);
    expect(screen.getAllByText('/repo/worktrees/active').length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Open live chat' }).some((link) => link.getAttribute('href') === '/sessions/session-active'),
    ).toBe(true);
    expect(
      screen.getAllByRole('link', { name: 'Open workspace' }).some(
        (link) => link.getAttribute('href') === '/workspaces?workspace=%2Frepo%2Fworktrees%2Factive',
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole('link', { name: 'Open dispatch' }).some(
        (link) => link.getAttribute('href') === '/dispatches/run-active',
      ),
    ).toBe(true);
  });

  it('filters the directory by status and search term', async () => {
    const user = setupUser();
    mockUseGateway.mockReturnValue({ store: createGatewayStore() });

    render(<SessionsPage />);

    expect(screen.getByLabelText('Search sessions')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Inactive (1)' }));
    expect(screen.getByTestId('session-row-session-paused')).toBeInTheDocument();
    expect(screen.queryByTestId('session-row-session-active')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search session id, title, agent, workspace, or dispatch id'), 'board');
    expect(screen.getByTestId('session-row-session-paused')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search session id, title, agent, workspace, or dispatch id'));
    await user.type(screen.getByPlaceholderText('Search session id, title, agent, workspace, or dispatch id'), 'missing');
    expect(screen.getByText('No sessions match the current filter.')).toBeInTheDocument();
  });

  it('briefly highlights a session row when live values change', async () => {
    const store = createGatewayStore();
    mockUseGateway.mockReturnValue({ store });

    render(<SessionsPage />);

    expect(screen.getByTestId('session-row-session-active')).not.toHaveClass('session-browser__item--fresh-update');

    store.setState({
      ...store.getState(),
      sessions: {
        byId: {
          ...store.getState().sessions.byId,
          'session-active': {
            ...store.getState().sessions.byId['session-active'],
            messageCount: 9,
            updatedAt: 1_700_000_001_000,
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('session-row-session-active')).toHaveClass('session-browser__item--fresh-update');
    });
  });
});

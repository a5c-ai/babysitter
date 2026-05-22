import { createStore } from 'zustand/vanilla';
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/test/test-utils';

import { HomePage } from './HomePage.js';

const mockUseGateway = vi.fn();

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  useGateway: () => mockUseGateway(),
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
          updatedAt: 1_700_000_000_000,
          activeRunId: 'run-active',
          cwd: '/repo/worktrees/active',
        },
        'session-paused': {
          sessionId: 'session-paused',
          agent: 'claude',
          status: 'inactive',
          title: 'Board follow-up',
          updatedAt: 1_699_000_000_000,
          latestRunId: 'run-paused',
          workspace: { currentPath: '/repo/worktrees/paused' },
        },
      },
    },
    agents: {
      items: [{ id: 'codex' }, { id: 'claude' }, { id: 'cursor' }],
    },
  }));
}

describe('HomePage', () => {
  it('presents the workbench as a session-first launch surface', () => {
    mockUseGateway.mockReturnValue({ store: createGatewayStore() });

    render(<HomePage />);

    expect(screen.getByText('Plan in projects. Work inside sessions. Ship from workspaces.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open projects' })).toHaveAttribute('href', '/projects');
    expect(screen.getAllByText('Realtime workspace repair').length).toBeGreaterThan(0);
    expect(screen.getByText('/repo/worktrees/active')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Dispatch handoff' }).some((link) => link.getAttribute('href') === '/dispatches/run-active'),
    ).toBe(true);
  });
});

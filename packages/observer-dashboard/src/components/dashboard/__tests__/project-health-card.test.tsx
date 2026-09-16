import { render, screen, setupUser } from '@/test/test-utils';
import { vi } from 'vitest';
import { ProjectHealthCard } from '../project-health-card';
import { createMockProjectSummary, createMockRun, resetIdCounter } from '@/test/fixtures';
import type { Run } from '@/types';

// Runs returned to the expanded card are driven by useProjectRuns (which polls the
// API). Mock it so we control the exact run mix used to exercise the header count.
const mockRuns = vi.hoisted(() => ({ current: [] as Run[] }));
vi.mock('@/hooks/use-project-runs', () => ({
  useProjectRuns: () => ({
    runs: mockRuns.current,
    totalCount: mockRuns.current.length,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

// Stub the virtualized list so we can assert how many runs land in each section
// without pulling in the virtualization machinery.
vi.mock('../virtualized-run-list', () => ({
  VirtualizedRunList: ({ runs }: { runs: Run[] }) => (
    <div data-testid="run-list" data-count={runs.length} />
  ),
}));

beforeEach(() => {
  resetIdCounter();
  mockRuns.current = [];
});

describe('ProjectHealthCard — In Progress reconciliation', () => {
  it('labels the active section "Active & Recent" (not "In Progress") and its count includes stale runs', async () => {
    const user = setupUser();

    // One genuinely active (non-stale) run + one stale run. The canonical KPI
    // definition (project.activeRuns) only counts the non-stale one, but the
    // section list deliberately also surfaces the stale run.
    mockRuns.current = [
      createMockRun({ status: 'waiting', isStale: false }),
      createMockRun({ status: 'completed', isStale: true }),
    ];

    const project = createMockProjectSummary({
      projectName: 'reconcile-me',
      activeRuns: 1, // canonical non-stale count
      staleRuns: 1,
    });

    render(<ProjectHealthCard project={project} statusFilter="all" sortMode="status" />);

    // Expand the card to reveal the runs sections.
    await user.click(screen.getByRole('button', { name: /reconcile-me/i }));

    // The header must NOT reuse the "In Progress" label that collides with the KPI tile.
    expect(screen.getByText('Active & Recent')).toBeInTheDocument();
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument();

    // The active/recent list contains both runs (active + stale) — no runs dropped.
    const lists = screen.getAllByTestId('run-list');
    expect(lists[0]).toHaveAttribute('data-count', '2');
  });
});

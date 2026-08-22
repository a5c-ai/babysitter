import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { RunFilterBar } from '../run-filter-bar';
import userEvent from '@testing-library/user-event';
import type { DashboardStatusFilter } from '@/hooks/use-run-dashboard';

const defaultFilterCounts: Record<DashboardStatusFilter, number> = {
  all: 20,
  waiting: 5,
  stale: 0,
  completed: 12,
  failed: 3,
  pending: 0,
};

describe('RunFilterBar', () => {
  const defaultProps = {
    statusFilter: 'all' as DashboardStatusFilter,
    onStatusFilterChange: vi.fn(),
    filterCounts: defaultFilterCounts,
    sortMode: 'status' as const,
    onSortModeToggle: vi.fn(),
    filteredProjectCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter pills for all, running, completed, failed', () => {
    render(<RunFilterBar {...defaultProps} />);
    expect(screen.getByTestId('filter-pill-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-waiting')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-completed')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-failed')).toBeInTheDocument();
  });

  it('hides stale pill when count is 0', () => {
    render(<RunFilterBar {...defaultProps} />);
    expect(screen.queryByTestId('filter-pill-stale')).not.toBeInTheDocument();
  });

  it('shows stale pill when count > 0', () => {
    render(
      <RunFilterBar
        {...defaultProps}
        filterCounts={{ ...defaultFilterCounts, stale: 2 }}
      />
    );
    expect(screen.getByTestId('filter-pill-stale')).toBeInTheDocument();
  });

  it('calls onStatusFilterChange when a pill is clicked', async () => {
    const onStatusFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <RunFilterBar {...defaultProps} onStatusFilterChange={onStatusFilterChange} />
    );
    await user.click(screen.getByTestId('filter-pill-failed'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('failed');
  });

  it('marks active filter pill with aria-pressed', () => {
    render(<RunFilterBar {...defaultProps} statusFilter="completed" />);
    expect(screen.getByTestId('filter-pill-completed')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('filter-pill-all')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the sort toggle button', () => {
    render(<RunFilterBar {...defaultProps} />);
    expect(screen.getByTestId('sort-toggle')).toBeInTheDocument();
  });

  it('displays "By Status" when sortMode is status', () => {
    render(<RunFilterBar {...defaultProps} sortMode="status" />);
    expect(screen.getByTestId('sort-toggle')).toHaveTextContent('By Status');
  });

  it('displays "By Activity" when sortMode is activity', () => {
    render(<RunFilterBar {...defaultProps} sortMode="activity" />);
    expect(screen.getByTestId('sort-toggle')).toHaveTextContent('By Activity');
  });

  it('calls onSortModeToggle when sort button is clicked', async () => {
    const onSortModeToggle = vi.fn();
    const user = userEvent.setup();
    render(<RunFilterBar {...defaultProps} onSortModeToggle={onSortModeToggle} />);
    await user.click(screen.getByTestId('sort-toggle'));
    expect(onSortModeToggle).toHaveBeenCalledTimes(1);
  });

  it('displays the project count', () => {
    render(<RunFilterBar {...defaultProps} filteredProjectCount={7} />);
    expect(screen.getByTestId('project-count')).toHaveTextContent('7 projects');
  });

  it('uses singular "project" when count is 1', () => {
    render(<RunFilterBar {...defaultProps} filteredProjectCount={1} />);
    expect(screen.getByTestId('project-count')).toHaveTextContent('1 project');
    expect(screen.getByTestId('project-count')).not.toHaveTextContent('projects');
  });

  it('displays filter counts in badges', () => {
    render(<RunFilterBar {...defaultProps} />);
    // The "All" pill should show count of 20
    expect(screen.getByTestId('filter-pill-all')).toHaveTextContent('20');
    expect(screen.getByTestId('filter-pill-failed')).toHaveTextContent('3');
  });

  // QA F4: hidden projects must be visibly indicated near the filter pills.
  describe('hidden-projects indicator', () => {
    it('is absent when no projects are hidden', () => {
      render(<RunFilterBar {...defaultProps} hiddenProjectCount={0} />);
      expect(screen.queryByTestId('hidden-projects-indicator')).not.toBeInTheDocument();
    });

    it('shows "N hidden" when projects are hidden', () => {
      render(<RunFilterBar {...defaultProps} hiddenProjectCount={2} />);
      expect(screen.getByTestId('hidden-projects-indicator')).toHaveTextContent('2 hidden');
    });

    it('dispatches the open-settings event on click (reveal via Settings)', async () => {
      const user = userEvent.setup();
      const listener = vi.fn();
      window.addEventListener('open-settings', listener);
      try {
        render(<RunFilterBar {...defaultProps} hiddenProjectCount={1} />);
        await user.click(screen.getByTestId('hidden-projects-indicator'));
        expect(listener).toHaveBeenCalledTimes(1);
      } finally {
        window.removeEventListener('open-settings', listener);
      }
    });
  });
  describe('board-view sort tooltip (SPEC-vibekanban §6.2)', () => {
    it('says sorting applies within columns when boardView is set', () => {
      render(<RunFilterBar {...defaultProps} boardView />);
      const title = screen.getByTestId('sort-toggle').getAttribute('title') ?? '';
      expect(title.toLowerCase()).toContain('sorting applies within columns');
    });

    it('keeps the list-mode status/activity tooltips when boardView is off', () => {
      render(<RunFilterBar {...defaultProps} />);
      const title = screen.getByTestId('sort-toggle').getAttribute('title') ?? '';
      expect(title).toContain('status priority');
      expect(title.toLowerCase()).not.toContain('within columns');
    });
  });
});

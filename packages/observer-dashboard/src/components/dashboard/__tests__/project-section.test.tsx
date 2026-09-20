import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { ProjectSection } from '../project-section';
import { createMockRun, resetIdCounter } from '@/test/fixtures';
import type { Run } from '@/types';

// Mock useProjectRuns hook
const mockUseProjectRuns = vi.fn();
vi.mock('@/hooks/use-project-runs', () => ({
  useProjectRuns: (...args: any[]) => mockUseProjectRuns(...args),
}));

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  ),
}));

beforeEach(() => {
  resetIdCounter();
  vi.clearAllMocks();
});

function setupMockHook(runs: Run[], totalCount: number, loading = false) {
  mockUseProjectRuns.mockReturnValue({
    runs,
    totalCount,
    loading,
    error: null,
    refresh: vi.fn(),
  });
}

describe('ProjectSection', () => {
  it('renders RunCards for fetched runs', () => {
    const runs = [
      createMockRun({ runId: 'run-1', processId: 'alpha-process' }),
      createMockRun({ runId: 'run-2', processId: 'beta-process' }),
    ];
    setupMockHook(runs, 2);

    render(<ProjectSection projectName="test-project" runs={[]} />);
    expect(screen.getByText('Alpha Process')).toBeInTheDocument();
    expect(screen.getByText('Beta Process')).toBeInTheDocument();
  });

  it('shows loading spinner when loading with no runs', () => {
    setupMockHook([], 0, true);

    const { container } = render(
      <ProjectSection projectName="test-project" runs={[]} />
    );
    // The loading spinner uses animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows "No runs found" when not loading and no runs', () => {
    setupMockHook([], 0, false);

    render(<ProjectSection projectName="test-project" runs={[]} />);
    expect(screen.getByText('No runs found')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    setupMockHook([], 0, false);

    render(<ProjectSection projectName="test-project" runs={[]} />);
    expect(
      screen.getByPlaceholderText('Search by run ID, process, task, or error...')
    ).toBeInTheDocument();
  });

  it('renders pagination controls when there are items', () => {
    const runs = [createMockRun({ runId: 'run-1' })];
    setupMockHook(runs, 15);

    render(<ProjectSection projectName="test-project" runs={[]} />);
    // PaginationControls renders range text
    expect(screen.getByText(/of 15/)).toBeInTheDocument();
  });

  it('passes enabled=true by default to useProjectRuns', () => {
    setupMockHook([], 0, false);

    render(<ProjectSection projectName="test-project" runs={[]} />);
    expect(mockUseProjectRuns).toHaveBeenCalledWith(
      'test-project',
      expect.objectContaining({ enabled: true })
    );
  });

  it('passes enabled=false when prop is false', () => {
    setupMockHook([], 0, false);

    render(
      <ProjectSection projectName="test-project" runs={[]} enabled={false} />
    );
    expect(mockUseProjectRuns).toHaveBeenCalledWith(
      'test-project',
      expect.objectContaining({ enabled: false })
    );
  });

  it('passes statusFilter to useProjectRuns', () => {
    setupMockHook([], 0, false);

    render(
      <ProjectSection
        projectName="test-project"
        runs={[]}
        statusFilter="completed"
      />
    );
    expect(mockUseProjectRuns).toHaveBeenCalledWith(
      'test-project',
      expect.objectContaining({ status: 'completed' })
    );
  });

  it('does not pass status when statusFilter is "all"', () => {
    setupMockHook([], 0, false);

    render(
      <ProjectSection
        projectName="test-project"
        runs={[]}
        statusFilter="all"
      />
    );
    expect(mockUseProjectRuns).toHaveBeenCalledWith(
      'test-project',
      expect.objectContaining({ status: undefined })
    );
  });

  it('does not render pagination when totalCount is 0', () => {
    setupMockHook([], 0, false);

    const { container: _container } = render(
      <ProjectSection projectName="test-project" runs={[]} />
    );
    // PaginationControls returns null when totalItems is 0
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
  });
});

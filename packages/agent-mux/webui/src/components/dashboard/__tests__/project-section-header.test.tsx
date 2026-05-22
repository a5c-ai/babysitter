import { render, screen } from '@/test/test-utils';
import { ProjectSectionHeader } from '../project-section-header';

describe('ProjectSectionHeader', () => {
  const defaultProps = {
    projectName: 'my-project',
    activeRuns: 2,
    completedRuns: 5,
    failedRuns: 1,
    totalRuns: 8,
  };

  it('renders the project name', () => {
    render(<ProjectSectionHeader {...defaultProps} />);
    expect(screen.getByText('my-project')).toBeInTheDocument();
  });

  it('shows active runs badge when activeRuns > 0', () => {
    render(<ProjectSectionHeader {...defaultProps} activeRuns={3} />);
    expect(screen.getByText('3 active')).toBeInTheDocument();
  });

  it('does not show active runs badge when activeRuns is 0', () => {
    render(<ProjectSectionHeader {...defaultProps} activeRuns={0} />);
    expect(screen.queryByText(/active/)).not.toBeInTheDocument();
  });

  it('shows completed runs badge when completedRuns > 0', () => {
    render(<ProjectSectionHeader {...defaultProps} completedRuns={7} />);
    expect(screen.getByText('7 completed')).toBeInTheDocument();
  });

  it('does not show completed runs badge when completedRuns is 0', () => {
    render(<ProjectSectionHeader {...defaultProps} completedRuns={0} />);
    expect(screen.queryByText(/completed/)).not.toBeInTheDocument();
  });

  it('shows failed runs badge when failedRuns > 0', () => {
    render(<ProjectSectionHeader {...defaultProps} failedRuns={3} />);
    expect(screen.getByText('3 failed')).toBeInTheDocument();
  });

  it('does not show failed runs badge when failedRuns is 0', () => {
    render(<ProjectSectionHeader {...defaultProps} failedRuns={0} />);
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
  });

  it('shows total runs count with plural "runs"', () => {
    render(<ProjectSectionHeader {...defaultProps} totalRuns={10} />);
    expect(screen.getByText(/10 runs/)).toBeInTheDocument();
  });

  it('shows singular "run" for totalRuns === 1', () => {
    render(<ProjectSectionHeader {...defaultProps} totalRuns={1} />);
    expect(screen.getByText(/1 run(?!s)/)).toBeInTheDocument();
  });

  it('renders without latestUpdate', () => {
    render(<ProjectSectionHeader {...defaultProps} />);
    // Should render without errors; the total runs text should be there
    expect(screen.getByText(/8 runs/)).toBeInTheDocument();
  });

  it('displays relative time when latestUpdate is provided', () => {
    // Use a recent timestamp
    const recent = new Date(Date.now() - 30000).toISOString(); // 30 seconds ago
    render(<ProjectSectionHeader {...defaultProps} latestUpdate={recent} />);
    // Should show something like "30s ago"
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('shows "just now" for future timestamps', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    render(<ProjectSectionHeader {...defaultProps} latestUpdate={future} />);
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it('hides all badges when counts are 0', () => {
    render(
      <ProjectSectionHeader
        {...defaultProps}
        activeRuns={0}
        completedRuns={0}
        failedRuns={0}
      />
    );
    expect(screen.queryByText(/active/)).not.toBeInTheDocument();
    expect(screen.queryByText(/completed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
  });
});

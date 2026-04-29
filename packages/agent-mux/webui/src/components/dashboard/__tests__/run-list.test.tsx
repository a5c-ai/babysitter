import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { RunList } from '../run-list';
import { createMockRun, resetIdCounter } from '@/test/fixtures';
import userEvent from '@testing-library/user-event';

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  ),
}));

// Mock ProjectSection to avoid hook side effects
vi.mock('../project-section', () => ({
  ProjectSection: ({ projectName }: { projectName: string }) => (
    <div data-testid={`project-section-${projectName}`}>{projectName}</div>
  ),
}));

beforeEach(() => {
  resetIdCounter();
});

describe('RunList', () => {
  it('renders an empty state when there are no runs', () => {
    render(<RunList runs={[]} />);
    expect(screen.getByText('No runs found')).toBeInTheDocument();
  });

  it('renders a list of RunCards for each run', () => {
    const runs = [
      createMockRun({ runId: 'run-1', processId: 'process-alpha' }),
      createMockRun({ runId: 'run-2', processId: 'process-beta' }),
    ];
    render(<RunList runs={runs} />);
    expect(screen.getByText('Process Alpha')).toBeInTheDocument();
    expect(screen.getByText('Process Beta')).toBeInTheDocument();
  });

  it('marks the selected run card', () => {
    const runs = [
      createMockRun({ runId: 'run-1' }),
      createMockRun({ runId: 'run-2' }),
    ];
    const { container } = render(<RunList runs={runs} selectedIndex={0} />);
    // The first card should have a ring-1 class (selected)
    const cards = container.querySelectorAll('.ring-1');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('paginates runs and shows "Show more" button', () => {
    // Create 12 runs (default page size is 10)
    const runs = Array.from({ length: 12 }, (_, i) =>
      createMockRun({ runId: `run-${i}`, processId: `process-${i}` })
    );
    render(<RunList runs={runs} />);
    // First page shows 10 items
    const links = screen.getAllByTestId('next-link');
    expect(links).toHaveLength(10);
    // "Show more" button exists with remaining count
    expect(screen.getByText(/Show more \(2 remaining\)/)).toBeInTheDocument();
  });

  it('loads more runs when "Show more" is clicked', async () => {
    const user = userEvent.setup();
    const runs = Array.from({ length: 12 }, (_, i) =>
      createMockRun({ runId: `run-${i}`, processId: `process-${i}` })
    );
    render(<RunList runs={runs} />);

    const showMoreBtn = screen.getByText(/Show more/);
    await user.click(showMoreBtn);

    // After clicking, all 12 runs should be visible
    const links = screen.getAllByTestId('next-link');
    expect(links).toHaveLength(12);
  });

  it('does not show "Show more" when all runs fit on one page', () => {
    const runs = Array.from({ length: 5 }, (_, i) =>
      createMockRun({ runId: `run-${i}` })
    );
    render(<RunList runs={runs} />);
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
  });

  describe('groupByProject mode', () => {
    it('renders ProjectSection components grouped by project name', () => {
      const runs = [
        createMockRun({ runId: 'run-1', projectName: 'alpha-project' }),
        createMockRun({ runId: 'run-2', projectName: 'beta-project' }),
        createMockRun({ runId: 'run-3', projectName: 'alpha-project' }),
      ];
      render(<RunList runs={runs} groupByProject />);
      expect(screen.getByTestId('project-section-alpha-project')).toBeInTheDocument();
      expect(screen.getByTestId('project-section-beta-project')).toBeInTheDocument();
    });

    it('groups runs without a project under "Unknown Project"', () => {
      // createMockRun defaults projectName to 'my-project', so we must explicitly set it empty
      const run = createMockRun({ runId: 'run-1' });
      // Override projectName to undefined after creation
      (run as any).projectName = undefined;
      render(<RunList runs={[run]} groupByProject />);
      expect(screen.getByTestId('project-section-Unknown Project')).toBeInTheDocument();
    });

    it('sorts project groups alphabetically', () => {
      const runs = [
        createMockRun({ runId: 'run-1', projectName: 'zebra' }),
        createMockRun({ runId: 'run-2', projectName: 'alpha' }),
      ];
      render(<RunList runs={runs} groupByProject />);
      const sections = screen.getAllByTestId(/project-section-/);
      expect(sections[0]).toHaveTextContent('alpha');
      expect(sections[1]).toHaveTextContent('zebra');
    });
  });
});

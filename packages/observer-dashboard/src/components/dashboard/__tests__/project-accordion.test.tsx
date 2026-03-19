import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { ProjectAccordion } from '../project-accordion';
import { createMockProjectSummary, resetIdCounter } from '@/test/fixtures';
import userEvent from '@testing-library/user-event';

// Mock ProjectSection to avoid hook side effects (useProjectRuns calls useSmartPolling)
vi.mock('../project-section', () => ({
  ProjectSection: ({ projectName, enabled }: { projectName: string; enabled?: boolean }) => (
    <div data-testid={`project-section-${projectName}`} data-enabled={String(enabled ?? true)}>
      Section: {projectName}
    </div>
  ),
}));

// Mock ProjectSectionHeader to simplify testing
vi.mock('../project-section-header', () => ({
  ProjectSectionHeader: ({
    projectName,
    activeRuns,
    totalRuns,
  }: {
    projectName: string;
    activeRuns: number;
    totalRuns: number;
  }) => (
    <div data-testid={`header-${projectName}`}>
      {projectName} ({activeRuns} active, {totalRuns} total)
    </div>
  ),
}));

beforeEach(() => {
  resetIdCounter();
});

describe('ProjectAccordion', () => {
  it('renders "No projects found" when projects list is empty', () => {
    render(<ProjectAccordion projects={[]} />);
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('renders project section headers for each project', () => {
    const projects = [
      createMockProjectSummary({ projectName: 'project-a', activeRuns: 1 }),
      createMockProjectSummary({ projectName: 'project-b', activeRuns: 0 }),
    ];
    render(<ProjectAccordion projects={projects} />);
    expect(screen.getByTestId('header-project-a')).toBeInTheDocument();
    expect(screen.getByTestId('header-project-b')).toBeInTheDocument();
  });

  it('renders header text with active runs and total runs', () => {
    const projects = [
      createMockProjectSummary({ projectName: 'alpha', activeRuns: 3, totalRuns: 10 }),
    ];
    render(<ProjectAccordion projects={projects} />);
    expect(screen.getByText('alpha (3 active, 10 total)')).toBeInTheDocument();
  });

  it('auto-expands projects with active runs by default', () => {
    const projects = [
      createMockProjectSummary({ projectName: 'active-project', activeRuns: 2 }),
      createMockProjectSummary({ projectName: 'idle-project', activeRuns: 0 }),
    ];
    render(<ProjectAccordion projects={projects} />);
    // The active project section should be visible since it's expanded
    expect(screen.getByTestId('project-section-active-project')).toBeInTheDocument();
  });

  it('can expand a collapsed project by clicking its trigger', async () => {
    const user = userEvent.setup();
    const projects = [
      createMockProjectSummary({ projectName: 'idle-project', activeRuns: 0 }),
    ];
    render(<ProjectAccordion projects={projects} />);

    // Click the trigger to expand
    const trigger = screen.getByTestId('header-idle-project');
    await user.click(trigger);

    // Now the section should become visible
    expect(screen.getByTestId('project-section-idle-project')).toBeInTheDocument();
  });

  it('renders multiple projects', () => {
    const projects = [
      createMockProjectSummary({ projectName: 'project-1' }),
      createMockProjectSummary({ projectName: 'project-2' }),
      createMockProjectSummary({ projectName: 'project-3' }),
    ];
    render(<ProjectAccordion projects={projects} />);
    expect(screen.getByTestId('header-project-1')).toBeInTheDocument();
    expect(screen.getByTestId('header-project-2')).toBeInTheDocument();
    expect(screen.getByTestId('header-project-3')).toBeInTheDocument();
  });
});

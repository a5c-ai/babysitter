import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { ProjectListView } from '../project-list-view';
import { createMockProjectSummary } from '@/test/fixtures';
import type { ProjectSummary } from '@/types';

// Mock ProjectHealthCard to keep tests focused on ProjectListView logic
vi.mock('../project-health-card', () => ({
  ProjectHealthCard: ({ project }: { project: ProjectSummary }) => (
    <div data-testid={`project-card-${project.projectName}`}>{project.projectName}</div>
  ),
}));

describe('ProjectListView', () => {
  const defaultProps = {
    loading: false,
    error: undefined,
    filteredProjects: [] as ProjectSummary[],
    activeProjects: [] as ProjectSummary[],
    historyProjects: [] as ProjectSummary[],
    statusFilter: 'all' as const,
    sortMode: 'status' as const,
    cardStatusFilter: 'all' as const,
    historyCollapsed: false,
    onHistoryCollapsedChange: vi.fn(),
    onHideProject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton when loading', () => {
    const { container } = render(
      <ProjectListView {...defaultProps} loading={true} />
    );
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it('renders error banner when error is set', () => {
    render(
      <ProjectListView {...defaultProps} error="Server error" />
    );
    expect(screen.getByTestId('error-banner')).toHaveTextContent('Failed to load projects: Server error');
  });

  it('renders empty state when no projects match filter', () => {
    render(
      <ProjectListView {...defaultProps} filteredProjects={[]} />
    );
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('renders idle empty state when no active and no history', () => {
    const projects = [createMockProjectSummary()];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={projects}
        activeProjects={[]}
        historyProjects={[]}
      />
    );
    expect(screen.getByTestId('idle-empty-state')).toBeInTheDocument();
  });

  it('renders idle-with-history banner when no active but has history', () => {
    const projects = [createMockProjectSummary()];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={projects}
        activeProjects={[]}
        historyProjects={projects}
        statusFilter="all"
      />
    );
    expect(screen.getByTestId('idle-with-history-banner')).toBeInTheDocument();
  });

  it('renders active runs section with project cards', () => {
    const projects = [
      createMockProjectSummary({ projectName: 'alpha' }),
      createMockProjectSummary({ projectName: 'beta' }),
    ];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={projects}
        activeProjects={projects}
        statusFilter="all"
      />
    );
    expect(screen.getByTestId('active-runs-section')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-alpha')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-beta')).toBeInTheDocument();
  });

  it('renders filtered grid for completed filter', () => {
    const projects = [createMockProjectSummary({ projectName: 'gamma' })];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={projects}
        statusFilter="completed"
      />
    );
    expect(screen.getByTestId('project-grid-filtered')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-gamma')).toBeInTheDocument();
  });

  it('renders history section when historyProjects exist', () => {
    const activeP = [createMockProjectSummary({ projectName: 'active1' })];
    const historyP = [createMockProjectSummary({ projectName: 'history1' })];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={[...activeP, ...historyP]}
        activeProjects={activeP}
        historyProjects={historyP}
        statusFilter="all"
        historyCollapsed={false}
      />
    );
    expect(screen.getByTestId('recent-history-section')).toBeInTheDocument();
    expect(screen.getByTestId('project-grid-history')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-history1')).toBeInTheDocument();
  });

  it('hides history grid when historyCollapsed is true', () => {
    const historyP = [createMockProjectSummary({ projectName: 'history1' })];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={historyP}
        historyProjects={historyP}
        statusFilter="all"
        historyCollapsed={true}
      />
    );
    expect(screen.getByTestId('recent-history-section')).toBeInTheDocument();
    expect(screen.queryByTestId('project-grid-history')).not.toBeInTheDocument();
  });

  it('shows "In Progress" header in status sort mode', () => {
    const projects = [createMockProjectSummary({ projectName: 'proj1' })];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={projects}
        activeProjects={projects}
        sortMode="status"
        statusFilter="all"
      />
    );
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows "Recent Activity" header in activity sort mode', () => {
    const projects = [createMockProjectSummary({ projectName: 'proj1' })];
    render(
      <ProjectListView
        {...defaultProps}
        filteredProjects={projects}
        activeProjects={projects}
        sortMode="activity"
        statusFilter="all"
      />
    );
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});

import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { RunCard } from '../run-card';
import {
  createMockRun,
  createMockTaskEffect,
  resetIdCounter,
} from '@/test/fixtures';

// Mock next/link to render a plain anchor
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
});

describe('RunCard', () => {
  it('renders the friendly process name', () => {
    const run = createMockRun({ processId: 'data-pipeline/ingest' });
    render(<RunCard run={run} />);
    expect(screen.getByText('Data Pipeline Ingest')).toBeInTheDocument();
  });

  it('renders a status badge for the run status', () => {
    const run = createMockRun({ status: 'completed' });
    render(<RunCard run={run} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders the task count', () => {
    const run = createMockRun({ completedTasks: 2, totalTasks: 5 });
    render(<RunCard run={run} />);
    expect(screen.getByText('2/5 tasks')).toBeInTheDocument();
  });

  it('renders formatted duration', () => {
    const run = createMockRun({ duration: 59000 });
    render(<RunCard run={run} />);
    expect(screen.getByText('59s')).toBeInTheDocument();
  });

  it('links to the run detail page', () => {
    const run = createMockRun({ runId: 'run-abc-123' });
    render(<RunCard run={run} />);
    const link = screen.getByTestId('next-link');
    expect(link).toHaveAttribute('href', '/runs/run-abc-123');
  });

  it('shows the project name tag when present', () => {
    const run = createMockRun({ projectName: 'my-project' });
    render(<RunCard run={run} />);
    expect(screen.getByText('my-project')).toBeInTheDocument();
  });

  it('does not show source label', () => {
    const run = createMockRun({ projectName: 'my-project', sourceLabel: 'cli' });
    render(<RunCard run={run} />);
    expect(screen.queryByText('cli')).not.toBeInTheDocument();
  });

  it('shows a progress bar when there are tasks', () => {
    const run = createMockRun({ totalTasks: 5, completedTasks: 3 });
    render(<RunCard run={run} />);
    // The progress bar renders a div with style width
    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not show a progress bar when totalTasks is 0', () => {
    const run = createMockRun({ totalTasks: 0, tasks: [] });
    render(<RunCard run={run} />);
    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toBeNull();
  });

  it('shows 100% progress for completed runs', () => {
    const run = createMockRun({ status: 'completed', totalTasks: 5, completedTasks: 3 });
    render(<RunCard run={run} />);
    const progressBar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(progressBar?.style.width).toBe('100%');
  });

  it('displays the failed step text for failed runs', () => {
    const run = createMockRun({
      status: 'failed',
      failedStep: 'process-data step',
    });
    render(<RunCard run={run} />);
    expect(screen.getByText(/Failed at: process-data step/)).toBeInTheDocument();
  });

  it('truncates long failed step text to 80 chars', () => {
    const longStep = 'a'.repeat(100);
    const run = createMockRun({
      status: 'failed',
      failedStep: longStep,
    });
    render(<RunCard run={run} />);
    expect(screen.getByText(/Failed at:/)).toHaveTextContent(
      `Failed at: ${'a'.repeat(80)}...`
    );
  });

  it('shows breakpoint question when a pending breakpoint exists', () => {
    const breakpointTask = createMockTaskEffect({
      kind: 'breakpoint',
      status: 'requested',
      breakpointQuestion: 'Approve deployment?',
    });
    const run = createMockRun({
      status: 'waiting',
      tasks: [breakpointTask],
    });
    render(<RunCard run={run} />);
    expect(screen.getByText('Approve deployment?')).toBeInTheDocument();
  });

  it('prefers run-level breakpointQuestion over task-level', () => {
    const breakpointTask = createMockTaskEffect({
      kind: 'breakpoint',
      status: 'requested',
      breakpointQuestion: 'Task-level question?',
    });
    const run = createMockRun({
      status: 'waiting',
      tasks: [breakpointTask],
      breakpointQuestion: 'Run-level question?',
    });
    render(<RunCard run={run} />);
    expect(screen.getByText('Run-level question?')).toBeInTheDocument();
  });

  it('applies selected styling when selected prop is true', () => {
    const run = createMockRun();
    const { container } = render(<RunCard run={run} selected />);
    const card = container.querySelector('.ring-1');
    expect(card).toBeInTheDocument();
  });

  it('renders with waiting status indicator', () => {
    const run = createMockRun({ status: 'waiting' });
    render(<RunCard run={run} />);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
  });

  it('renders with failed status indicator', () => {
    const run = createMockRun({ status: 'failed' });
    render(<RunCard run={run} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders with pending status indicator', () => {
    const run = createMockRun({ status: 'pending' });
    render(<RunCard run={run} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

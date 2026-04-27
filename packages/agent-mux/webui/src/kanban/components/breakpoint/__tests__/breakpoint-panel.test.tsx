import { render, screen } from '@/test/test-utils';
import { vi } from 'vitest';
import { BreakpointPanel } from '../breakpoint-panel';
import { createMockTaskDetail } from '@/test/fixtures';
import type { TaskDetail } from '@/types';

// Mock the server action used by BreakpointApproval
vi.mock('@/app/actions/approve-breakpoint', () => ({
  approveBreakpoint: vi.fn().mockResolvedValue({ success: true }),
}));

describe('BreakpointPanel', () => {
  const defaultRunId = 'run-123';

  function makeBreakpointTask(overrides: Partial<TaskDetail> = {}): TaskDetail {
    return createMockTaskDetail({
      kind: 'breakpoint',
      status: 'requested',
      breakpointQuestion: 'Should we deploy to production?',
      title: 'Deploy Approval',
      breakpoint: {
        question: 'Should we deploy to production?',
        title: 'Deploy Approval',
        context: { files: [] },
      },
      ...overrides,
    });
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------
  it('renders the breakpoint title', () => {
    const task = makeBreakpointTask();
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Deploy Approval')).toBeInTheDocument();
  });

  it('renders the breakpoint question', () => {
    const task = makeBreakpointTask();
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Should we deploy to production?')).toBeInTheDocument();
  });

  it('renders the "Breakpoint" badge', () => {
    const task = makeBreakpointTask();
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Breakpoint')).toBeInTheDocument();
  });

  it('renders the "Awaiting decision" label', () => {
    const task = makeBreakpointTask();
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Awaiting decision')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Approval form for pending breakpoints
  // -----------------------------------------------------------------------
  it('renders approval form for requested breakpoints', () => {
    const task = makeBreakpointTask({ status: 'requested' });
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByTestId('breakpoint-approval')).toBeInTheDocument();
    expect(screen.getByTestId('approve-btn')).toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  it('does not render approval form for resolved breakpoints', () => {
    const task = makeBreakpointTask({ status: 'resolved' });
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.queryByTestId('breakpoint-approval')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Already resolved state (task.status === 'resolved')
  // -----------------------------------------------------------------------
  it('shows "Already Resolved" badge when task.status is resolved', () => {
    const task = makeBreakpointTask({ status: 'resolved' });
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Already Resolved')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Resolved state display
  // -----------------------------------------------------------------------
  it('shows success message when task is resolved', () => {
    const task = makeBreakpointTask({ status: 'resolved' });
    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Breakpoint has been resolved')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Fallback question text
  // -----------------------------------------------------------------------
  it('falls back to breakpointQuestion when breakpoint payload is missing', () => {
    const task = createMockTaskDetail({
      kind: 'breakpoint',
      status: 'requested',
      breakpointQuestion: 'Fallback question?',
      title: 'Fallback Title',
      breakpoint: undefined,
    });

    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Fallback question?')).toBeInTheDocument();
  });

  it('falls back to "Approval required" when no question is provided', () => {
    const task = createMockTaskDetail({
      kind: 'breakpoint',
      status: 'requested',
      breakpointQuestion: undefined,
      breakpoint: undefined,
    });

    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(screen.getByText('Approval required')).toBeInTheDocument();
  });
});

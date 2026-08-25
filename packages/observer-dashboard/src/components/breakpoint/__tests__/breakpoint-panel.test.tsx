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

  // Superseded per UX-R2 §13.1 (gate-free bug fix): the bare "Approval
  // required" fallback is replaced by the honest last-resort copy (AC-32).
  it('falls back to the honest no-question copy when no question is provided', () => {
    const task = createMockTaskDetail({
      kind: 'breakpoint',
      status: 'requested',
      breakpointQuestion: undefined,
      breakpoint: undefined,
    });

    render(<BreakpointPanel task={task} runId={defaultRunId} />);

    expect(
      // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
      screen.getByText('Approval required: this breakpoint has no question text on disk.'),
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // UX-R2 §13.4 — read-only clarity on the run-detail answer panel
  // -----------------------------------------------------------------------
  it('AC-43: renders the read-only contract line VERBATIM above the answer input for pending breakpoints', () => {
    const task = makeBreakpointTask({ status: 'requested' });
    render(<BreakpointPanel task={task} runId={defaultRunId} runDriver="live" />);

    const contract = screen.getByTestId('bp-readonly-contract');
    expect(contract).toHaveTextContent(
      'The observer is read-only, except this single action: recording your breakpoint answer.',
    );
    // Above any input: the contract line precedes the approval form in the DOM.
    const input = screen.getByTestId('custom-answer-input');
    expect(
      contract.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('AC-44: renders the orphaned-semantics line VERBATIM for a no-driver run, and not for a live one', () => {
    const task = makeBreakpointTask({ status: 'requested' });
    const { unmount } = render(
      <BreakpointPanel task={task} runId={defaultRunId} runDriver="none" />,
    );
    expect(screen.getByTestId('bp-orphaned-semantics')).toHaveTextContent(
      'Recorded to disk. Nothing runs until you resume:',
    );
    unmount();

    render(<BreakpointPanel task={task} runId={defaultRunId} runDriver="live" />);
    expect(screen.queryByTestId('bp-orphaned-semantics')).not.toBeInTheDocument();
  });

  it('does not render the contract line for resolved breakpoints (no answer input exists)', () => {
    const task = makeBreakpointTask({ status: 'resolved' });
    render(<BreakpointPanel task={task} runId={defaultRunId} runDriver="none" />);
    expect(screen.queryByTestId('bp-readonly-contract')).not.toBeInTheDocument();
  });
});
